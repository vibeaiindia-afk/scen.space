
/* Getting a customer to the Agent Studio.

   The pieces were all here and pointed at the wrong place: agentEntry was set
   on the way to auth, but agentRoute() resolved to an in-app route ('create'
   or 'builder'), so signing in landed people in the workspace instead of the
   studio they had asked for. */
(function(){
'use strict';
var STUDIO='/agent-studio.html';
var SEED='scen.agentstudio.seed';

/* The studio only looks for a handed-over brief when the address names one,
   so carry the slug of whatever is waiting in storage. */
function studioUrl(){
  try{
    var o=JSON.parse(localStorage.getItem(SEED)||'null');
    if(o&&o.slug)return STUDIO+'?template='+encodeURIComponent(o.slug);
  }catch(e){}
  return STUDIO;
}
function goStudio(){location.href=studioUrl()}

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

/* 4 ─ The brief box on the public page. Writing a brief and pressing Generate
       used to hand the visitor to the sign-in screen and file the brief
       against a workspace they had not asked for — the studio is where a
       brief becomes a site, so it goes there instead, carrying what they
       wrote. Signed out, the sign-in still comes first and the studio follows
       it, which is what agentEntry already arranges. */
var CAT2IND={'SaaS':'saas','Portfolio':'portfolio','Restaurant':'restaurant',
  'Real Estate':'realestate','Agency':'agency','E-commerce':'other','Business':'other'};

window.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('[data-action="heroGenerate"]');
  if(!b)return;
  e.preventDefault();e.stopPropagation();
  var box=document.getElementById('heroPrompt');
  var typed=String((box&&box.value)||'').trim();
  var cat='';try{cat=state.category||''}catch(x){}
  try{
    localStorage.setItem(SEED,JSON.stringify({
      slug:'brief',
      label:typed?'your brief':((cat||'a new')+' website').toLowerCase(),
      pitch:typed,
      industry:CAT2IND[cat]||'',
      kind:'website',content:'agent',style:'cinematic',motion:'cinematic',
      languages:['English']
    }));
  }catch(x){}
  if(typeof state!=='undefined'&&!state.auth){
    state.agentEntry=true;saveState();navigate('auth');return;
  }
  goStudio();
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
