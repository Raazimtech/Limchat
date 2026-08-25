(()=>{
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const style=document.createElement('style');
  style.textContent=`
    .site-install-btn{height:34px;padding:0 10px;border:1px solid #dce5cf;border-radius:9px;background:#f4f8ea;color:#526d12;font:750 12px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
    .site-install-btn:hover{background:#eaf2d7}
    .site-install-btn svg{width:16px;height:16px}
    .site-install-btn.hidden{display:none!important}
    .nav-fast-loading{padding:22px 14px;display:grid;gap:9px}
    .nav-fast-line{height:12px;border-radius:7px;background:#edf1ea;width:70%}
    .nav-fast-line.short{width:45%}
    @media(max-width:760px){.site-install-btn{height:34px;padding:0 8px}.site-install-btn span{display:none}.topbar .site-install-btn{margin-left:auto}.topbar .mobile-search{margin-left:0}}
  `;
  document.head.appendChild(style);

  function installButton(){
    if(standalone())return;
    const make=()=>{
      const b=document.createElement('button');
      b.className='site-install-btn hidden';
      b.type='button';
      b.setAttribute('aria-label','Install Limchat app');
      b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11M8 10l4 4 4-4M5 18v2h14v-2"/></svg><span>Install app</span>';
      b.onclick=async()=>{
        if(window.__limchatInstallPrompt){
          const prompt=window.__limchatInstallPrompt;
          window.__limchatInstallPrompt=null;
          prompt.prompt();
          try{await prompt.userChoice}catch{}
          b.classList.add('hidden');
        }else{
          const toast=document.querySelector('#toast');
          if(toast){toast.textContent='Use your browser menu to install Limchat.';toast.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>toast.classList.remove('show'),3000)}
        }
      };
      return b;
    };
    const desktop=document.querySelector('.sidebar-head');
    const top=document.querySelector('.topbar');
    if(desktop){const b=make();b.id='site-install-desktop';const logout=document.querySelector('#logout');desktop.insertBefore(b,logout)}
    if(top){const b=make();b.id='site-install-mobile';const search=document.querySelector('#mobile-search');top.insertBefore(b,search)}
    const show=()=>document.querySelectorAll('.site-install-btn').forEach(b=>b.classList.toggle('hidden',!window.__limchatInstallPrompt));
    window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();window.__limchatInstallPrompt=e;show()});
    window.addEventListener('appinstalled',()=>{window.__limchatInstallPrompt=null;document.querySelectorAll('.site-install-btn').forEach(b=>b.classList.add('hidden'))});
  }

  function fastNavigation(){
    document.addEventListener('click',e=>{
      const button=e.target.closest('.nav-item[data-view]');
      if(!button||window.matchMedia('(min-width:761px)').matches)return;
      const view=document.querySelector('#view');
      if(!view)return;
      const type=button.dataset.view;
      e.stopImmediatePropagation();
      document.querySelectorAll('.nav-item[data-view]').forEach(x=>x.classList.toggle('active',x===button));
      if(type==='chats'){
        const existing=document.querySelector('#chat-list');
        if(existing&&existing.innerHTML.trim())view.innerHTML='<div class="chat-list mobile-chat-list">'+existing.innerHTML+'</div>';
        else view.innerHTML='<div class="nav-fast-loading"><div class="nav-fast-line"></div><div class="nav-fast-line short"></div></div>';
      }else if(type==='people'){
        view.innerHTML='<div class="page"><h1>People</h1><p class="page-sub">Find someone using their unique username.</p><div class="section-card"><div class="people-search-wrap"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="people-search" placeholder="Search username" autocomplete="off"></div><div id="people-results" class="person-list"></div></div></div>';
      }else if(type==='files'){
        view.innerHTML='<div class="page"><h1>Files</h1><p class="page-sub">Files shared inside your private chats.</p><div class="section-card"><div class="nav-fast-loading"><div class="nav-fast-line"></div><div class="nav-fast-line short"></div></div></div></div>';
      }else if(type==='profile'){
        view.innerHTML='<div class="nav-fast-loading"><div class="nav-fast-line"></div><div class="nav-fast-line short"></div></div>';
      }
      setTimeout(()=>{
        const native=window.setView;
        if(typeof native==='function')native(type);
      },0);
    },true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{installButton();fastNavigation()});
  else{installButton();fastNavigation()}
})();
