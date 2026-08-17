
/* Getting a customer to the Agent Studio.

   The pieces were all here and pointed at the wrong place: agentEntry was set
   on the way to auth, but agentRoute() resolved to an in-app route ('create'
   or 'builder'), so signing in landed people in the workspace instead of the
   studio they had asked for. */
(function(){
'use strict';
var STUDIO='/agent-studio.html';
function goStudio(){location.href=STUDIO}

/* 1 ─ After sign-in. resumeRoute() decides where a restored session lands;
       when the studio was the intent, leave the SPA entirely. */
var baseResume=window.resumeRoute;
if(typeof baseResume==='function'){
  window.resumeRoute=function(){
    if(state&&state.agentEntry){
      state.agentEntry=false;saveState();
      setTimeout(goStudio,0);
      return 'dashboard';   /* never rendered — the redirect wins */
    }
    return baseResume.apply(this,arguments);
  };
  try{resumeRoute=window.resumeRoute}catch(e){}
}

/* 2 ─ The 4D Website Builder button on the public page. Signed in, it goes
       straight through; signed out, it asks for the login first and
       remembers where it was headed. */
document.addEventListener('click',function(e){
  var a=e.target.closest('a[href="'+STUDIO+'"],a[href$="agent-studio.html"]');
  if(!a)return;
  if(typeof state==='undefined')return;
  if(state.auth)return;                 /* already signed in — let it through */
  e.preventDefault();
  state.agentEntry=true;saveState();
  navigate('auth');
},true);

/* 3 ─ AI Builder in the sidebar is the same destination, so send it there
       rather than to the in-app summary of it. */
document.addEventListener('click',function(e){
  var n=e.target.closest('[data-nav="aibuilder"]');
  if(!n)return;
  e.preventDefault();e.stopPropagation();
  if(typeof state!=='undefined'&&!state.auth){
    state.agentEntry=true;saveState();navigate('auth');return;
  }
  goStudio();
},true);
})();
