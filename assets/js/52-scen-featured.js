
/* Featured six: the standalone pages under /templates/ first — they are real
   sites rather than preset data, so they show the ceiling — then the strongest
   of the presets to fill the row. */
(function(){
'use strict';
var SHOW=6;

function apply(){
  var grid=document.querySelector('#templates .tpl-grid');
  if(!grid||grid.dataset.featured)return;
  var cards=[].slice.call(grid.querySelectorAll('.tpl-card'));
  if(cards.length<=SHOW)return;
  grid.dataset.featured='1';

  /* Films carry a /templates/ preview link; float them to the front. */
  var films=[],rest=[];
  cards.forEach(function(c){
    var a=c.querySelector('a.btn.ghost,a[href^="/templates/"],a[href^="/preset/"]');
    var href=a?a.getAttribute('href')||'':'';
    (href.indexOf('/templates/')===0?films:rest).push(c);
  });
  var ordered=films.concat(rest);
  ordered.forEach(function(c,i){
    grid.appendChild(c);
    c.classList.toggle('tpl-hidden',i>=SHOW);
  });

  var bar=document.createElement('div');
  bar.className='tpl-more';
  bar.innerHTML='<button class="btn" data-tplmore="1">Show all '+cards.length+' templates</button>'+
    '<span class="note">Every one is a real site — open a preview and scroll it.</span>';
  grid.parentNode.insertBefore(bar,grid.nextSibling);
}

document.addEventListener('click',function(e){
  var b=e.target.closest('[data-tplmore]');
  if(!b)return;
  e.preventDefault();
  var grid=document.querySelector('#templates .tpl-grid');
  if(!grid)return;
  var hidden=grid.querySelectorAll('.tpl-card.tpl-hidden');
  if(hidden.length){
    [].forEach.call(hidden,function(c){c.classList.remove('tpl-hidden')});
    b.textContent='Show fewer';
  }else{
    var cards=[].slice.call(grid.querySelectorAll('.tpl-card'));
    cards.forEach(function(c,i){c.classList.toggle('tpl-hidden',i>=SHOW)});
    b.textContent='Show all '+cards.length+' templates';
    var t=document.getElementById('templates');
    if(t)t.scrollIntoView({behavior:'smooth',block:'start'});
  }
},false);

/* The gallery is injected by an earlier layer, so wait for it. */
var mo=new MutationObserver(apply);
function boot(){apply();mo.observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
})();
