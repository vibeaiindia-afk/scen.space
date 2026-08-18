
/* ──────────────────────────────────────────────────────────────────────────
   Scroll-film templates.

   The thirteen entries below are complete standalone pages under /templates/,
   not preset data. Every other TEMPLATES entry is a description that the
   preset renderers draw; these are hand-built pages with their own markup,
   so there is nothing for the renderer to draw from. The first five are
   scroll-scrubbed films; the rest are single-viewport hero pages. Terranova
   is a folder rather than one file, so its entry points at its index.html.

   They join the same gallery by carrying a `file` field. Anything holding
   one is served as a real file — Vercel checks the filesystem before the SPA
   rewrite — and /preset/<slug> redirects there, so the URL contract the
   gallery, the thumbnails and any existing link rely on still holds.
   ────────────────────────────────────────────────────────────────────────── */
(function(){
'use strict';
if(typeof TEMPLATES==='undefined')return;

var FILMS=[
  /* One product-launch preset, added 2026-08-18. Halo and Aura sat beside it
     until 2026-08-19 and were dropped from the gallery. Like the films below
     it is a standalone page, so Customize hands the whole page to the studio
     and the client edits it by talking. */
  {name:'Nova',file:'/templates/nova.html',category:'Product',
   tag:'Cinematic product launch — sticky scroll scenes, colour picker, 17 sections',
   palette:{accent:'#0071e3',accent2:'#f5f5f7'},
   heroTitle:'Hello, future.',
   heroSubtitle:'Powerful. Beautiful. A cinematic product launch page with sticky scroll scenes, a live colour picker and a camera, chip and battery story.',
   components:['Home','Design','Camera','Performance','Buy']},

  {name:'SynapseX',file:'/templates/synapsex.html',category:'Technology',
   tag:'Scroll-scrubbed film with split hero titles',
   palette:{accent:'#61ff9e',accent2:'#0b0b0f'},
   heroTitle:'Brain And Body',
   heroSubtitle:'Built at the intersection of neuroscience and artificial intelligence — neural pathways, cognitive load and physiological state as one adaptive layer.',
   components:['Home','Technology','Research','Platform','Contact']},

  {name:'Worlds',file:'/templates/worlds.html',category:'Agency',
   tag:'Four titled moments over one continuous film',
   palette:{accent:'#f6f3ec',accent2:'#050505'},
   heroTitle:'Enter The Unknown',
   heroSubtitle:'Where imagination becomes place. Every frame is a threshold, and depth comes before interface.',
   components:['Home','Worlds','Atelier','Immersions','Contact']},

  {name:'Kinetic Cut',file:'/templates/kinetic-cut.html',category:'Entertainment',
   tag:'Five type treatments, each cut differently',
   palette:{accent:'#ffffff',accent2:'#000000'},
   heroTitle:'Enter The Frame',
   heroSubtitle:'Nothing ordinary. Motion becomes emotion, and every scene breaks its type a different way.',
   components:['Home','Work','Motion','Studio','Contact']},

  {name:'Smooth Film',file:'/templates/smooth-film.html',category:'SaaS',
   tag:'The quiet one — four sections, no tricks',
   palette:{accent:'#ffffff',accent2:'#000000'},
   heroTitle:'Ideas Become Real',
   heroSubtitle:'Built differently. Four sections that fade up over a scroll-scrubbed film, and nothing that gets in the way.',
   components:['Home','Product','Design','Company','Contact']},

  {name:'Frame',file:'/templates/frame.html',category:'Luxury',
   tag:'Editorial masthead, colour washes and split strips',
   palette:{accent:'#d50000',accent2:'#050505'},
   heroTitle:'FRaME',
   heroSubtitle:'Impossible scenes, cut like they happened. No seams, no explanation — just motion that feels remembered.',
   components:['Home','Films','Studio','Index','Contact']},

  {name:'Beyond Hero',file:'/templates/beyond-hero.html',category:'Creative',
   tag:'Four-layer display type behind a 3D character',
   palette:{accent:'#EC612C',accent2:'#000000'},
   heroTitle:'Beyond',
   heroSubtitle:'One word in four colour layers, side columns that slide inward as the page scrolls, and a marquee that never stops.',
   components:['Home','Work','Studio','Journal','Contact']},

  {name:'Lumora',file:'/templates/lumora.html',category:'Wellness',
   tag:'Four films the visitor switches between, one hero',
   palette:{accent:'#182C41',accent2:'#000000'},
   heroTitle:'Clarity In An Endlessly Noisy Universe',
   heroSubtitle:'A mindfulness hero where the film is the control: pick a mood and the whole page changes with it, ink and all.',
   components:['Home','How It Works','Features','Pricing','Community']},

  {name:'Synthetic Nature',file:'/templates/synthetic-nature.html',category:'Photography',
   tag:'Garamond titles that arrive letter by letter',
   palette:{accent:'#ffffff',accent2:'#010101'},
   heroTitle:'Witness The Hidden Realm',
   heroSubtitle:'Slow serif titles over a living film, glass on the one button, and nothing else asking for attention.',
   components:['Home','Wander','Archive','Story','Connect']},

  {name:'Echoid',file:'/templates/echoid.html',category:'Product',
   tag:'Terminal-mono signup pinned beside a full-bleed film',
   palette:{accent:'#ffffff',accent2:'#000000'},
   heroTitle:'Echoid',
   heroSubtitle:'A voice-identity sign-up: black negative space on the left, the form held on the right, sharp rectangles only.',
   components:['Home','Story','Platforms','Identity','Contact']},

  {name:'Serene',file:'/templates/serene.html',category:'Beauty',
   tag:'A film, then a quote with drifting clouds',
   palette:{accent:'#6BADC4',accent2:'#010A17'},
   heroTitle:'Gentle Touch. Radiant Presence.',
   heroSubtitle:'Two screens for a beauty and wellness studio — one cinematic, one a founder quote that clouds drift into.',
   components:['Home','About','Services','Journal','Contact']},

  {name:'Terranova',file:'/templates/terranova/index.html',category:'Research',
   tag:'A card that refracts the film playing behind it',
   palette:{accent:'#f5f4f0',accent2:'#c2ccd3'},
   heroTitle:'Signals From The Deep Green',
   heroSubtitle:'Dark type on a bright film, and a glass card that is really a live refracted copy of the video behind it.',
   components:['Home','About','Research','Projects','Journal','Contact']},

  {name:'Orbit',file:'/templates/orbit.html',category:'Security',
   tag:'Poster type with a mouse-driven morph reveal',
   palette:{accent:'#fd86db',accent2:'#161616'},
   heroTitle:'Orbit',
   heroSubtitle:'One word, one flower, and a trail that wipes the image away to a second one wherever the cursor goes.',
   components:['Home','Resources','Benefits','Contact']}
];

function slugOf(name){return String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}

/* Idempotent: this layer can run again without duplicating the gallery. */
FILMS.forEach(function(f){
  var exists=TEMPLATES.some(function(t){return slugOf(t.name)===slugOf(f.name)});
  if(!exists)TEMPLATES.push(f);
});

function fileFor(slug){
  for(var i=0;i<TEMPLATES.length;i++){
    var t=TEMPLATES[i];
    if(t&&t.file&&slugOf(t.name)===slug)return t.file;
  }
  return '';
}
window.scenTemplateFile=fileFor;

/* A direct hit on /preset/<slug> for one of these should end up at the real
   page rather than at a renderer with nothing to render. */
var baseShowPreset=window.showPreset;
if(typeof baseShowPreset==='function'){
  window.showPreset=function(tpl){
    if(tpl&&tpl.file){location.replace(tpl.file);return}
    return baseShowPreset.apply(this,arguments);
  };
  try{showPreset=window.showPreset}catch(e){}
}

/* The redirect above is the fallback for a typed or shared URL. Pointing the
   gallery's own links straight at the file skips loading the 1.4MB shell
   first, which is a visible stall on a link that should feel instant. */
function retargetLinks(root){
  var scope=root||document;
  var links=scope.querySelectorAll('a[href^="/preset/"]');
  for(var i=0;i<links.length;i++){
    var a=links[i];
    if(a.dataset.filmRetargeted)continue;
    var m=a.getAttribute('href').match(/^\/preset\/([^\/?#]+)/);
    if(!m)continue;
    /* The marketing gallery only lowercases the name, so a two-word template
       arrives here as "/preset/kinetic cut". Slugify rather than trusting it. */
    var file=fileFor(slugOf(decodeURIComponent(m[1])));
    if(!file)continue;
    a.setAttribute('href',file);
    a.dataset.filmRetargeted='1';
  }
  /* Same root cause on the Customize link, which carried the raw name into a
     query string as "?template=kinetic%20cut". The seed itself travels through
     localStorage, so this was cosmetic — but it is the slug the studio reads
     when no seed was written. */
  var cust=scope.querySelectorAll('a[href*="template="]');
  for(var j=0;j<cust.length;j++){
    var c=cust[j];
    if(c.dataset.filmSlugged)continue;
    var href=c.getAttribute('href');
    var q=href.match(/([?&]template=)([^&#]+)/);
    if(!q)continue;
    var want=slugOf(decodeURIComponent(q[2]));
    if(!want||want===q[2])continue;
    c.setAttribute('href',href.replace(q[0],q[1]+encodeURIComponent(want)));
    c.dataset.filmSlugged='1';
  }
}

/* Boot resolves /preset/<slug> partway down the file, before this layer has
   pushed anything into TEMPLATES — so the wrapper above never sees a film on
   a cold load, and the visitor lands on the marketing page instead. Handle the
   URL here, where the entries actually exist. */
(function(){
  var m=location.pathname.match(/^\/preset\/([^\/?#]+)\/?$/);
  if(!m)return;
  var f=fileFor(slugOf(decodeURIComponent(m[1])));
  if(f)location.replace(f);
})();

/* The gallery is injected by an earlier layer and re-rendered on navigation,
   so watch for it rather than racing it. */
var mo=new MutationObserver(function(){retargetLinks(document)});
function start(){
  retargetLinks(document);
  mo.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
else start();
})();
