(()=>{
  const MAX_FILE_SIZE=25*1024*1024;
  const escFile=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const fileIcon=type=>type?.startsWith('image/')?'🖼️':type==='application/pdf'?'📄':'📎';
  const size=n=>n<1024?`${n} B`:n<1048576?`${Math.round(n/1024)} KB`:`${(n/1048576).toFixed(1)} MB`;
  const card=(a,url)=>`<div class="file-message"><div class="file-message-icon">${fileIcon(a.mime_type)}</div><div class="file-message-info"><strong>${escFile(a.file_name)}</strong><span>${size(a.size_bytes||0)}</span></div><a class="file-message-download" href="${url}" target="_blank" rel="noopener" download aria-label="Download file"><svg viewBox="0 0 24 24"><path d="M12 3v12M7 11l5 5 5-5M5 20h14"/></svg></a></div>`;
  function addButton(){
    const form=document.querySelector('#composer');
    if(!form||form.querySelector('#file-input'))return;
    const input=document.createElement('input');input.type='file';input.id='file-input';input.className='hidden';input.accept='image/*,.pdf,.txt,.zip,application/octet-stream';
    const b=document.createElement('button');b.type='button';b.className='file-attach';b.id='file-attach';b.title='Share a file';b.setAttribute('aria-label','Share a file');b.innerHTML='<svg viewBox="0 0 24 24"><path d="m21.4 11.6-8.8 8.8a6 6 0 0 1-8.5-8.5l9-9a4.5 4.5 0 0 1 6.4 6.4l-8.8 8.8a3 3 0 1 1-4.2-4.2l8-8"/></svg>';
    b.onclick=()=>input.click();
    input.onchange=()=>{const f=input.files?.[0];if(f)sendFile(f);input.value=''};
    form.insertBefore(b,form.querySelector('#message'));
    form.appendChild(input);
  }
  async function sendFile(file){
    if(!window.activeChat&&typeof activeChat==='undefined')return;
    const chat=typeof activeChat!=='undefined'?activeChat:window.activeChat;
    const me=typeof user!=='undefined'?user:window.user;
    const client=typeof db!=='undefined'?db:window.db;
    if(!chat||!me||!client)return;
    if(file.size>MAX_FILE_SIZE){toast('Files must be 25 MB or smaller.');return}
    const path=`${chat.conversation.id}/${me.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
    const attach=document.querySelector('#file-attach');if(attach)attach.disabled=true;
    try{
      const up=await client.storage.from('limchat-files').upload(path,file,{contentType:file.type||'application/octet-stream',upsert:false});
      if(up.error)throw up.error;
      const msg=await client.from('limchat_messages').insert({conversation_id:chat.conversation.id,sender_id:me.id,body:file.name,message_type:'file'}).select('id').single();
      if(msg.error)throw msg.error;
      const a=await client.from('limchat_attachments').insert({message_id:msg.data.id,conversation_id:chat.conversation.id,uploader_id:me.id,storage_path:path,file_name:file.name,mime_type:file.type||'application/octet-stream',size_bytes:file.size}).select('*').single();
      if(a.error)throw a.error;
      const signed=await client.storage.from('limchat-files').createSignedUrl(path,3600);
      if(signed.error)throw signed.error;
      const box=document.querySelector('#messages');if(box){box.insertAdjacentHTML('beforeend',card(a.data,signed.data.signedUrl));scrollMessages()}
      toast('File shared');
    }catch(e){toast(e.message||'Could not share file')}finally{if(attach)attach.disabled=false}
  }
  const originalOpenChat=window.openChat||openChat;
  window.openChat=async function(){await originalOpenChat();addButton();await hydrateFiles()};
  async function hydrateFiles(){
    const chat=typeof activeChat!=='undefined'?activeChat:window.activeChat;const client=typeof db!=='undefined'?db:window.db;if(!chat||!client)return;
    const {data}=await client.from('limchat_attachments').select('*').eq('conversation_id',chat.conversation.id);
    const box=document.querySelector('#messages');if(!box||!data?.length)return;
    for(const a of data){const url=await client.storage.from('limchat-files').createSignedUrl(a.storage_path,3600);if(url.data?.signedUrl){const msg=document.querySelector(`[data-message-id="${a.message_id}"]`);if(msg)msg.innerHTML=card(a,url.data.signedUrl);}}
  }
  const originalSubscribe=window.subscribeMessages||subscribeMessages;
  window.subscribeMessages=function(){
    const chat=typeof activeChat!=='undefined'?activeChat:window.activeChat;const client=typeof db!=='undefined'?db:window.db;const me=typeof user!=='undefined'?user:window.user;if(!chat||!client)return originalSubscribe();
    if(typeof channel!=='undefined'&&channel)client.removeChannel(channel);
    channel=client.channel(`limchat-${chat.conversation.id}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'limchat_messages',filter:`conversation_id=eq.${chat.conversation.id}`},async payload=>{
      const box=document.querySelector('#messages');if(!box||payload.new.sender_id===me.id)return;
      if(payload.new.message_type==='file'){
        const {data:a}=await client.from('limchat_attachments').select('*').eq('message_id',payload.new.id).single();
        if(a){const u=await client.storage.from('limchat-files').createSignedUrl(a.storage_path,3600);if(u.data?.signedUrl)box.insertAdjacentHTML('beforeend',card(a,u.data.signedUrl));}
      }else box.insertAdjacentHTML('beforeend',messageHTML(payload.new));scrollMessages();
    }).subscribe();
  };
  const observer=new MutationObserver(()=>addButton());
  observer.observe(document.body,{childList:true,subtree:true});
})();
