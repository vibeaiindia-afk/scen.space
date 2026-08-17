
(function(){
'use strict';

function scrub(frame){
  var t=0,dir=1,raf=0,running=false;
  function step(){
    var w=frame.contentWindow,d=frame.contentDocument;
    if(!w||!d||!d.body){raf=requestAnimationFrame(step);return}
    var max=Math.max(1,d.documentElement.scrollHeight-w.innerHeight);
    t+=dir*0.0016;
    if(t>=1){t=1;dir=-1}else if(t<=0){t=0;dir=1}
    try{w.scrollTo(0,t*max)}catch(e){}
    raf=requestAnimationFrame(step);
  }
  return {
    start:function(){if(running)return;running=true;step()},
    stop:function(){running=false;cancelAnimationFrame(raf)}
  };
}

/* Only cards actually on screen get an iframe, and only MAX_LIVE of those at
   once. Each preview is a whole site: the twelve pages under /templates/ carry
   sixteen autoplaying videos between them, so an uncapped gallery downloads
   tens of megabytes and runs a video decoder per card while the visitor
   scrolls. Scrolling away stops the scrub immediately and drops the iframe a
   few seconds later, which is what actually releases the media. */
var MAX_LIVE=3, IDLE_MS=5000, live=[];

function unmount(shot){
  if(shot.__idle){clearTimeout(shot.__idle);shot.__idle=0}
  if(shot.__scrub){shot.__scrub.stop();shot.__scrub=null}
  if(shot.__frame){
    shot.__frame.src='about:blank';
    if(shot.__frame.parentNode)shot.__frame.parentNode.removeChild(shot.__frame);
    shot.__frame=null;
  }
  shot.classList.remove('ready');
  var i=live.indexOf(shot);
  if(i>-1)live.splice(i,1);
}

function mount(shot){
  var f=document.createElement('iframe');
  f.className='tpl-frame';
  f.setAttribute('scrolling','no');
  f.setAttribute('tabindex','-1');
  f.setAttribute('aria-hidden','true');
  f.setAttribute('loading','lazy');
  f.src=shot.dataset.preview;
  f.addEventListener('load',function(){
    if(shot.__frame!==f)return;          /* evicted while it was loading */
    shot.classList.add('ready');
    shot.__scrub=scrub(f);
    shot.__scrub.start();
  });
  shot.__frame=f;
  shot.appendChild(f);
  live.push(shot);

  /* Oldest first: the card furthest from what the visitor is reading. */
  while(live.length>MAX_LIVE){
    var old=live[0];
    if(old===shot)break;
    unmount(old);
  }
}

var io=new IntersectionObserver(function(entries){
  entries.forEach(function(e){
    var shot=e.target;
    if(!e.isIntersecting){
      if(shot.__scrub)shot.__scrub.stop();
      /* A card can cross the edge twice in one flick — wait before dropping
         it, so a scroll past does not reload it on the way back. */
      if(shot.__frame&&!shot.__idle){
        shot.__idle=setTimeout(function(){shot.__idle=0;unmount(shot)},IDLE_MS);
      }
      return;
    }
    if(shot.__idle){clearTimeout(shot.__idle);shot.__idle=0}
    if(!shot.__frame)mount(shot);
    else if(shot.__scrub)shot.__scrub.start();
  });
},{threshold:.2});

function wire(){
  var cards=document.querySelectorAll('#templates .tpl-card');
  for(var i=0;i<cards.length;i++){
    var c=cards[i];
    var shot=c.querySelector('.tpl-shot');
    if(!shot||shot.dataset.preview)continue;
    var a=c.querySelector('a.btn.ghost')||c.querySelector('a[href^="/templates/"],a[href^="/preset/"]');
    if(!a)continue;
    var href=a.getAttribute('href')||'';
    if(!href)continue;
    shot.dataset.preview=href;
    io.observe(shot);
  }
}

var mo=new MutationObserver(wire);
function boot(){wire();mo.observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
setTimeout(wire,1400);
})();
