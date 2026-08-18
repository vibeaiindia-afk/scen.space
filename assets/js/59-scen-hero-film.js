/* The hero's lit object is a film now.

   One behaviour only: the pointer pushes it forward or pulls it back in Z.
   No tilt, no parallax, no sound. Depth is eased in rAF rather than by a CSS
   transition so a fast pointer does not fight a half-finished tween. */
(function(){
'use strict';
var film=document.getElementById('heroFilm');
if(!film)return;
var vid=film.querySelector('video');

/* Autoplay only survives muted, and only if the property — not just the
   attribute — is set before play() is called. */
if(vid){
  vid.muted=true;vid.defaultMuted=true;vid.volume=0;
  var kick=function(){var p=vid.play();if(p&&p.catch)p.catch(function(){})};
  kick();
  /* Some browsers refuse the first play() until the tab has been touched. */
  document.addEventListener('pointerdown',kick,{once:true,passive:true});

  /* Off screen it is burning battery for nobody. */
  if(window.IntersectionObserver)
    new IntersectionObserver(function(entries){
      entries.forEach(function(en){en.isIntersecting?kick():vid.pause()});
    },{threshold:.01}).observe(film);
}

var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
var coarse=window.matchMedia&&window.matchMedia('(pointer:coarse)').matches;
if(reduced||coarse)return;

var NEAR=120,FAR=-70;      /* px of travel toward and away from the viewer */
var target=0,current=0,raf=0;

function frame(){
  raf=0;
  current+=(target-current)*.12;
  if(Math.abs(target-current)<.25)current=target;else raf=requestAnimationFrame(frame);
  film.style.setProperty('--film-z',current.toFixed(2)+'px');
}

window.addEventListener('pointermove',function(e){
  var r=film.getBoundingClientRect();
  if(!r.width)return;
  var dx=(e.clientX-(r.left+r.width/2))/(window.innerWidth/2);
  var dy=(e.clientY-(r.top+r.height/2))/(window.innerHeight/2);
  var d=Math.min(1,Math.sqrt(dx*dx+dy*dy));   /* 0 on the film, 1 at the edges */
  target=FAR+(NEAR-FAR)*(1-d);
  if(!raf)raf=requestAnimationFrame(frame);
},{passive:true});

/* Pointer gone from the window — settle back to rest. */
window.addEventListener('pointerout',function(e){
  if(e.relatedTarget)return;
  target=0;if(!raf)raf=requestAnimationFrame(frame);
},{passive:true});
})();
