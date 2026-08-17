
(function(){
'use strict';
/* Each entry maps to something already shipped:
   brief → /api/ai/generate · ask → aiEditCurrentSite · canvas → the builder
   3D → the scene library and sequencer · media → /api/image + /api/video
   publish → /api/publish and /api/domains with real DNS verification. */
var CAPS=[
  ['M12 3v6M12 15v6M3 12h6M15 12h6M6.4 6.4l3 3M14.6 14.6l3 3M17.6 6.4l-3 3M9.4 14.6l-3 3',
   'One brief, a whole site',
   'Scen plans the pages, picks a visual direction and writes every line of copy before it builds anything.'],
  ['M4 5h16v11H4zM8 20h8M9.5 10.5h5M12 8v5',
   'Change it by asking',
   'Say what you want different and it edits the real site — not a preview, not a copy that has to be re-applied.'],
  ['M4 4h16v16H4zM4 9h16M9 9v11',
   'Or click and edit',
   'Every heading, image, button and section is directly editable on the canvas, with a properties panel when you need it.'],
  ['M12 3 21 7.5v9L12 21 3 16.5v-9zM3 7.5l9 4.5 9-4.5M12 12v9',
   '3D scenes and scroll motion',
   'Spatial scenes, camera moves and scroll-linked animation, set up without writing a keyframe by hand.'],
  ['M3 6h18v13H3zM3 15l5-4 4 3 3-3 6 5M8.5 10a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4',
   'Images and video, in place',
   'Generate the hero image or a background loop inside the builder and drop it straight into the page.'],
  ['M12 3c3.5 2 5.5 5.5 5.5 9.5L12 17l-5.5-4.5C6.5 8.5 8.5 5 12 3zM8 17l-2 4 4-2M16 17l2 4-4-2',
   'Publish to your own domain',
   'Go live on a free scen.space address in one click, or point your own domain and Scen walks you through the DNS.']
];

function mount(){
  if(document.getElementById('capability'))return;
  var anchor=document.querySelector('#marketing #features');
  if(!anchor||!anchor.parentNode)return;
  var s=document.createElement('section');
  s.id='capability';
  s.innerHTML='<div class="inner">'+
    '<div class="cap-head"><span>What it actually does</span>'+
    '<h2>Everything the site needs.<br><em>None of the plumbing.</em></h2></div>'+
    '<div class="cap-grid">'+CAPS.map(function(c){
      return '<article class="cap"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+c[0]+'"/></svg>'+
             '<b>'+c[1]+'</b><p>'+c[2]+'</p></article>';
    }).join('')+'</div>'+
    '<p class="cap-note">Forms, content collections, a store and bookings are built in and switch on when you '+
    'need them. Payments, email and data connect once for the whole workspace — Scen tells you which one is '+
    'missing at the moment it needs it, then carries on where it left off.</p>'+
    '</div>';
  anchor.parentNode.insertBefore(s,anchor.nextSibling);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
else mount();
setTimeout(mount,1200);
})();
