
(function(){
'use strict';
/* Three real sites, each opening the page it advertises. Descriptions come
   from the template's own entry, so the card cannot drift from the thing. */
var PICKS=['frame','synapsex','worlds'];

function slug(n){return String(n||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}

function build(){
  var grid=document.querySelector('#showcase .show-grid');
  if(!grid||grid.dataset.real)return;
  if(typeof TEMPLATES==='undefined')return;

  var picked=PICKS.map(function(s){
    for(var i=0;i<TEMPLATES.length;i++)if(slug(TEMPLATES[i].name)===s)return TEMPLATES[i];
    return null;
  }).filter(Boolean);
  if(picked.length<PICKS.length)return;
  grid.dataset.real='1';

  grid.innerHTML=picked.map(function(t){
    var href=t.file||('/preset/'+slug(t.name));
    return '<a class="sc-card" href="'+href+'" target="_blank" rel="noopener">'+
      '<div class="sc-shot"><span class="sc-live">Live site</span>'+
      '<iframe src="'+href+'" loading="lazy" tabindex="-1" aria-hidden="true" scrolling="no"></iframe></div>'+
      '<div class="sc-body"><span class="k">'+escV(t.category||'Showcase')+'</span>'+
      '<b>'+escV(t.name)+'</b><p>'+escV(t.tag||'')+'</p>'+
      '<div class="sc-open">Open it ↗</div></div></a>';
  }).join('');
}

/* A scroll-film parked at scroll 0 is a black frame. These pages are
   same-origin, so the preview can drive them the way the template
   thumbnails already do — scrub the iframe and the real site plays. */
function scrub(frame){
  var t=0,raf=0,dir=1;
  function step(){
    var w=frame.contentWindow,d=frame.contentDocument;
    if(!w||!d||!d.body){raf=requestAnimationFrame(step);return}
    var max=Math.max(1,d.documentElement.scrollHeight-w.innerHeight);
    t+=dir*0.0016;
    if(t>=1){t=1;dir=-1}else if(t<=0){t=0;dir=1}
    try{w.scrollTo(0,t*max)}catch(e){}
    raf=requestAnimationFrame(step);
  }
  frame.addEventListener('load',function(){cancelAnimationFrame(raf);t=0;dir=1;step()});
  /* Only run what is on screen. */
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting)step();
      else cancelAnimationFrame(raf);
    });
  },{threshold:.15});
  io.observe(frame);
}
function wire(){
  [].forEach.call(document.querySelectorAll('#showcase .sc-shot iframe'),function(f){
    if(f.dataset.scrubbed)return;
    f.dataset.scrubbed='1';
    scrub(f);
  });
}

var mo=new MutationObserver(function(){build();wire()});
function boot(){build();wire();mo.observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
setTimeout(function(){build();wire()},1200);
})();
