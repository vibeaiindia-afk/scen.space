/* On a phone, the workspace is the Agent Studio.

   The two were showing the same job twice: the mobile shell carried Builder,
   Preview, Business, Publish and a More sheet, while the studio does the whole
   brief → plan → build → publish run in one conversation and is the only one
   of the two actually designed for a small screen. Asked to pick, the answer
   was the studio, so on a phone every workspace route hands over to it.

   What stays in the page: the public landing page and the sign-in screen —
   both are needed to reach the studio at all — plus published sites and
   presets, which never route through here.

   Known cost, decided deliberately: a phone cannot reach Leads, Analytics,
   Forms, Content, the store, Domains, Settings or Billing, because the studio
   has no equivalent for them yet. They are all still there on a laptop. */
(function(){
'use strict';

var BREAK=760;
var STUDIO='/agent-studio.html';
/* The two routes that must keep working here — everything else is the studio's. */
var STAYS={marketing:1,auth:1};

function phone(){return innerWidth<=BREAK}
function go(){
  location.href=(typeof window.__scenStudioUrl==='function')?window.__scenStudioUrl():STUDIO;
}

function handover(route){
  var signed=false;try{signed=!!state.auth}catch(e){}
  if(signed){go();return true}
  /* No session: the sign-in has to come first, and agentEntry is what tells
     the resume to finish in the studio rather than the workspace. */
  try{state.agentEntry=true;saveState()}catch(e){}
  return false;
}

var base=window.navigate||navigate;
window.navigate=function(route){
  if(phone()&&route&&!STAYS[route]){
    if(handover(route))return;
    return base.call(this,'auth');
  }
  return base.apply(this,arguments);
};
try{navigate=window.navigate}catch(e){}

/* The session can answer before the later scripts run, so the boot decision
   may already have landed on a workspace route by the time this loads. */
if(phone()&&window.__scenBooted){
  var now;try{now=state.route}catch(e){}
  if(now&&!STAYS[now]){
    if(!handover(now)){try{base.call(window,'auth')}catch(e){}}
  }
}
})();
