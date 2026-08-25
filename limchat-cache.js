(()=>{
  const DB_NAME='limchat-cache';
  const STORE='responses';
  const VERSION=1;
  const MAX_AGE=5*60*1000;
  const originalFetch=window.fetch.bind(window);

  function openDB(){
    return new Promise((resolve,reject)=>{
      const r=indexedDB.open(DB_NAME,VERSION);
      r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};
      r.onsuccess=()=>resolve(r.result);
      r.onerror=()=>reject(r.error);
    });
  }
  async function get(key){
    try{const db=await openDB();return await new Promise((resolve,reject)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}catch{return null}
  }
  async function put(key,value){
    try{const db=await openDB();await new Promise((resolve,reject)=>{const r=db.transaction(STORE,'readwrite').objectStore(STORE).put(value,key);r.onsuccess=resolve;r.onerror=()=>reject(r.error)})}catch{}
  }
  function userKey(headers){
    const auth=headers.get('Authorization')||'';
    if(!auth)return 'public';
    const token=auth.replace(/^Bearer\s+/i,'');
    try{const payload=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));return payload.sub||'auth'}catch{return 'auth'}
  }
  function cacheable(url,method){
    if(!url.startsWith('https://dpiwdhtbhwjgatvcfkcb.supabase.co/'))return false;
    if(method==='GET')return url.includes('/rest/v1/');
    if(method==='POST')return /\/rest\/v1\/rpc\/limchat_get_chat_history(?:\?|$)/.test(url);
    return false;
  }
  window.fetch=async(input,init={})=>{
    const req=input instanceof Request?input:new Request(input,init);
    const method=(req.method||'GET').toUpperCase();
    if(!cacheable(req.url,method))return originalFetch(input,init);
    const auth=req.headers.get('Authorization')||'';
    if(!auth)return originalFetch(input,init);
    const key=`${userKey(req.headers)}|${method}|${req.url}|${method==='POST'?await req.clone().text():''}`;
    const cached=await get(key);
    if(cached&&Date.now()-cached.savedAt<MAX_AGE){
      originalFetch(req.clone()).then(async fresh=>{
        if(fresh.ok){const body=await fresh.clone().text();await put(key,{savedAt:Date.now(),status:fresh.status,statusText:fresh.statusText,headers:[...fresh.headers.entries()],body})}
      }).catch(()=>{});
      return new Response(cached.body,{status:cached.status,statusText:cached.statusText,headers:cached.headers});
    }
    try{
      const fresh=await originalFetch(req.clone());
      if(fresh.ok){const body=await fresh.clone().text();await put(key,{savedAt:Date.now(),status:fresh.status,statusText:fresh.statusText,headers:[...fresh.headers.entries()],body})}
      return fresh;
    }catch(error){
      if(cached)return new Response(cached.body,{status:cached.status,statusText:cached.statusText,headers:cached.headers});
      throw error;
    }
  };
  window.limchatClearCache=async()=>{try{const db=await openDB();await new Promise((resolve,reject)=>{const r=db.transaction(STORE,'readwrite').objectStore(STORE).clear();r.onsuccess=resolve;r.onerror=()=>reject(r.error)})}catch{}};
})();
