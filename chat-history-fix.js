const LIMCHAT_HISTORY_URL='https://dpiwdhtbhwjgatvcfkcb.supabase.co';
const LIMCHAT_HISTORY_KEY='sb_publishable_PSZnTEo74jObih_6TTpXVQ_tJwzTnXY';
const limchatHistoryDb=supabase.createClient(LIMCHAT_HISTORY_URL,LIMCHAT_HISTORY_KEY);

async function loadChats(){
  const {data:sessionData}=await limchatHistoryDb.auth.getSession();
  if(!sessionData.session)return;
  const {data,error}=await limchatHistoryDb.rpc('limchat_list_chats');
  if(error){
    const toast=document.querySelector('#toast');
    if(toast){toast.textContent=error.message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3000)}
    return;
  }
  const list=(data||[]).map(row=>({
    conversationId:row.conversation_id,
    p:{id:row.other_user_id,username:row.username,display_name:row.display_name,avatar_url:row.avatar_url},
    last:row.last_message_at?{body:row.last_message,created_at:row.last_message_at}:null
  }));
  if(typeof window.renderChatList==='function')window.renderChatList(list);
}

// Refresh once after this targeted history fix loads, then every time Chats is selected.
loadChats();
