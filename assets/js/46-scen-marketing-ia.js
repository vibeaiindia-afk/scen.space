
/* The public page had two links that sent a first-time visitor to the sign-up
   screen instead of the thing they clicked: "Docs" and "Explore scene library"
   both point at gated routes. Nothing is removed from a signed-in visitor —
   the links simply stop pretending to be public. (§30, §90.) */
(function(){
'use strict';
function signedIn(){try{return !!state.auth}catch(e){return false}}

function syncMarketingNav(){
  var links=document.querySelector('.mlinks');
  if(!links)return;
  var docs=links.querySelector('[data-nav="helpdocs"]');
  if(docs)docs.style.display=signedIn()?'':'none';
  var product=links.querySelector('a[href="#features"]');
  if(product&&product.textContent==='Features')product.textContent='Product';
}

/* An earlier layer already listens on document in capture phase and would call
   navigate('scenes') first. window capture runs ahead of document capture, so
   this settles the destination before that handler ever sees the click. */
window.addEventListener('click',function(e){
  var cta=e.target.closest('[data-action="openSceneLibraryMarketing"]');
  if(!cta||signedIn())return;
  e.preventDefault();e.stopPropagation();
  var target=document.getElementById('showcase');
  if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
},true);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncMarketingNav);
else syncMarketingNav();
/* The session lands asynchronously, and a visitor can sign in and come back to
   the public page, so re-check on arrival rather than only on a boot timer. */
setTimeout(syncMarketingNav,1200);
var baseNav=window.navigate;
window.navigate=function(route){
  var r=baseNav.apply(this,arguments);
  if(route==='marketing')syncMarketingNav();
  return r;
};
try{navigate=window.navigate}catch(e){}
})();
