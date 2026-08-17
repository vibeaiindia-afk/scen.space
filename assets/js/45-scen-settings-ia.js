
/* Settings gains the grouping from §57 without duplicating a single existing
   panel: each tab hands off to the real view that already owns that area. */
(function(){
'use strict';
var ic=window.scenIcon;
var TABS=[
  ['settings','General'],
  ['brandstudio','Brand'],
  ['projectsettings','SEO & Site'],
  ['localization','Languages'],
  ['team','Team'],
  ['billing','Billing'],
  ['accessibility','Accessibility'],
  ['privacy','Privacy']
];
function strip(active){
  return '<div class="sx-tabs">'+TABS.map(function(t){
    return '<button data-nav="'+t[0]+'" class="'+(t[0]===active?'on':'')+'">'+t[1]+'</button>';
  }).join('')+'</div>';
}
/* Wrap, never replace: the original view still renders everything it did. */
TABS.forEach(function(t){
  var route=t[0],old=views[route];
  if(typeof old!=='function')return;
  views[route]=function(){
    var inner=old.apply(this,arguments);
    /* The strip belongs under the page title, not above it. */
    var i=inner.indexOf('</div></div>');
    var head=inner.indexOf('view-head');
    if(head>=0&&i>head)return inner.slice(0,i+12)+strip(route)+inner.slice(i+12);
    return strip(route)+inner;
  };
});

/* Media picks up the 3D library as a source alongside images and video (§48/§49)
   rather than 3D Scene Library sitting in the sidebar as its own destination. */
var oldMedia=views.media;
if(typeof oldMedia==='function'){
  views.media=function(){
    return oldMedia.apply(this,arguments)+
      '<div class="sx-sect"><h3>3D</h3><p class="sx-sub">Spatial scenes used by this website.</p>'+
      '<div class="sx-advgrid"><button class="sx-tool" data-nav="scenes">'+ic('box')+'3D scene library</button>'+
      '<button class="sx-tool" data-nav="assetstudio">'+ic('grid')+'Objects &amp; materials</button></div></div>';
  };
}
})();
