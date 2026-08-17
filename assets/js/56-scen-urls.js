/* Addresses for the workspace.

   The whole app used to live at "/", which cost two things: a signed-in
   customer could never see the public page again, and no screen inside the
   workspace could be linked, bookmarked or reached with the back button.
   routeFromPath()/pathForRoute() in the first script decide the mapping; this
   layer only keeps the address bar in step with it.

   The address is written when state.route actually changes, not when navigate()
   returns. Those are not the same moment: the preloader layer defers the real
   navigation into a callback and returns early, so syncing on return wrote the
   *old* route back over the URL the browser had just restored — which is what
   made the back button look dead. */
(function(){
'use strict';
var toPath=window.pathForRoute,toRoute=window.routeFromPath;
if(typeof toPath!=='function'||typeof toRoute!=='function')return;
if(typeof state!=='object'||!state)return;

/* True while the browser is already showing the right address: the first paint,
   and any move through history. Then the URL is corrected, never appended to. */
var replaying=true;
var current=state.route;

function signedIn(){try{return !!state.auth}catch(e){return false}}

function syncUrl(){
  /* A published site or a preset owns its address — never rewrite those. */
  if(!toRoute(location.pathname))return;
  var want=toPath(current);
  if(want===location.pathname)return;
  try{history[replaying?'replaceState':'pushState']({r:current},'',want+location.search)}catch(e){}
}

/* The header's two auth buttons are wrong once there is a session — they offer
   a login to someone already logged in. Swap them for the way back in. */
function syncAuthActions(){
  var box=document.querySelector('#marketing .mactions');
  if(!box)return;
  var on=signedIn();
  var auth=box.querySelectorAll('[data-nav="auth"]');
  for(var i=0;i<auth.length;i++)auth[i].style.display=on?'none':'';
  var open=box.querySelector('[data-nav="dashboard"]');
  if(on&&!open){
    open=document.createElement('button');
    open.className='btn light';
    open.setAttribute('data-nav','dashboard');
    open.innerHTML='Open workspace <span>↗</span>';
    box.appendChild(open);
  }
  if(open)open.style.display=on?'':'none';
}

/* state is created once and never replaced, so the route can be watched
   directly. Enumerable, so saveState() still serializes it.

   Every assignment syncs, not only the ones that change the value: a load of
   /dashboard whose remembered route is already 'auth' settles on 'auth'
   without changing it, and the address bar would have been left saying
   /dashboard while the sign-in screen was showing. */
Object.defineProperty(state,'route',{
  configurable:true,enumerable:true,
  get:function(){return current},
  set:function(v){
    current=v;
    try{syncUrl()}catch(e){}
    try{syncAuthActions()}catch(e){}
  }
});

/* The first navigate() is the boot decision. Everything after it is a real
   move and earns a history entry. */
var base=window.navigate||navigate;
window.navigate=function(){
  var r=base.apply(this,arguments);
  replaying=false;
  return r;
};
try{navigate=window.navigate}catch(e){}

addEventListener('popstate',function(){
  var r=toRoute(location.pathname);
  /* A published site drives its own history; leave those entries alone. */
  if(!r||r===current)return;
  replaying=true;
  try{window.navigate(r)}finally{replaying=false}
});

/* Every other "Log in"/"Start building" on the public page is a call to action,
   not a header control — retarget them rather than leaving holes in the layout. */
window.addEventListener('click',function(e){
  if(!signedIn()||!e.target.closest)return;
  var a=e.target.closest('#marketing [data-nav="auth"]');
  if(!a)return;
  e.preventDefault();e.stopPropagation();
  window.navigate('dashboard');
},true);

/* The session lands after the first paint, so the buttons are re-read when it
   does. The timer covers the case where applySession is not reachable here. */
var baseApply=window.applySession;
if(typeof baseApply==='function'){
  window.applySession=function(){
    var r=baseApply.apply(this,arguments);
    try{syncAuthActions()}catch(e){}
    return r;
  };
  try{applySession=window.applySession}catch(e){}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncAuthActions);
else syncAuthActions();
setTimeout(syncAuthActions,1200);
})();
