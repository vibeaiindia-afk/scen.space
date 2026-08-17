
/* Adds the missing How-it-works section and the missing meta description.
   Injected rather than written into the markup, to stay consistent with how
   every other layer in this file works. */
(function(){
'use strict';

/* The page had no <meta name="description"> at all, so search results were
   left to guess from body copy. */
function meta(){
  if(document.querySelector('meta[name="description"]'))return;
  var m=document.createElement('meta');
  m.name='description';
  m.content='Scen turns one brief into a finished website — AI plans the pages, writes the copy, '+
            'designs the motion and 3D scenes, then publishes to your own domain. Edit visually or '+
            'just ask for changes.';
  document.head.appendChild(m);
}

var STEPS=[
  ['01','Describe','Tell Scen what the business is and what the site needs to do. One or two sentences is enough.'],
  ['02','Direct','It plans the pages, picks a visual direction and writes the copy — you approve the plan before anything is built.'],
  ['03','Refine','Click any element and edit it, or just say what you want changed. Scen edits the real site, not a copy.'],
  ['04','Publish','It checks the site is ready, connects whatever it needs, and puts it live on your domain.']
];

function mount(){
  if(document.getElementById('howitworks'))return;
  var anchor=document.querySelector('#marketing #showcase');
  if(!anchor)return;
  var s=document.createElement('section');
  s.id='howitworks';
  s.innerHTML='<div class="inner">'+
    '<div class="hiw-head"><span>How it works</span>'+
    '<h2>Four steps.<br><em>Nothing technical in any of them.</em></h2></div>'+
    '<div class="hiw-grid">'+STEPS.map(function(x){
      return '<article class="hiw"><i>'+x[0]+'</i><b>'+x[1]+'</b><p>'+x[2]+'</p></article>';
    }).join('')+'</div>'+
    '<div class="hiw-foot"><button class="btn primary" data-action="heroFocus">Start with a sentence</button>'+
    '<span class="note">No card needed. You only connect a domain when you want your own address.</span></div>'+
    '</div>';
  anchor.parentNode.insertBefore(s,anchor);
}

/* Sends someone back to the one input that starts everything. */
document.addEventListener('click',function(e){
  if(!e.target.closest('[data-action="heroFocus"]'))return;
  e.preventDefault();
  var box=document.getElementById('heroPrompt');
  if(!box)return;
  window.scrollTo({top:0,behavior:'smooth'});
  setTimeout(function(){try{box.focus()}catch(err){}},420);
},false);

function boot(){meta();mount()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
setTimeout(mount,1200);
})();
