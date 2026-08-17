
(function(){
  'use strict';

  function mine(){
    if(!Array.isArray(state.myTemplates))state.myTemplates=[];
    return state.myTemplates;
  }
  window.__myTemplates=mine;

  /** The live project, in the shape a template needs. */
  function asTemplate(name){
    var pal=state.templatePalette||{};
    var comps=(state.components||[]).slice(0,7);
    var t={
      name:String(name||state.projectName||'Untitled').slice(0,40),
      category:state.category||'Custom',
      tag:String(state.heroSubtitle||'').slice(0,90),
      palette:{accent:pal.accent||'#dfff45',accent2:pal.accent2||'#7beeff'},
      heroTitle:state.heroTitle||'',
      heroSubtitle:state.heroSubtitle||'',
      ctas:(state.heroCtas||[]).slice(0,3),
      components:comps,
      sectionCopy:(state.sectionCopy||[]).slice(0,comps.length),
      sections:Array.isArray(state.templateSections)?state.templateSections.slice(0,comps.length):null,
      mine:true
    };
    // a cinematic project keeps its scene, so the preset page plays it
    try{
      if(window.__cinState&&window.__cinState().enabled&&window.__cinConfig){
        t.cinema=window.__cinConfig(false);
      }
    }catch(e){}
    return t;
  }

  function save(name){
    var t=asTemplate(name);
    if(!t.heroTitle){toast('Build the site first, then save it');return null}
    var list=mine();
    var at=list.findIndex(function(x){return x.name===t.name});
    if(at>-1)list[at]=t;else list.unshift(t);
    // TEMPLATES is what every gallery and /preset/<name> reads
    var i=TEMPLATES.findIndex(function(x){return x.name===t.name});
    if(i>-1)TEMPLATES[i]=t;else TEMPLATES.unshift(t);
    saveState();
    return t;
  }
  window.__saveAsTemplate=save;

  // user templates have to survive a reload
  function rehydrate(){
    mine().forEach(function(t){
      if(!TEMPLATES.some(function(x){return x.name===t.name}))TEMPLATES.unshift(t);
    });
  }
  rehydrate();

  /* ---------- the offer, once a build has finished ---------- */

  var bar=document.createElement('div');
  bar.className='mt-save';
  bar.innerHTML='<span><b>Site built.</b> Keep it as a template?</span>'
    +'<button data-mt="no">Not now</button>'
    +'<button class="go" data-mt="save">Save as template</button>';
  document.body.appendChild(bar);

  var shown='';
  new MutationObserver(function(){
    var ready=state.generation>=7&&state.heroTitle&&(state.route==='builder'||state.route==='generation');
    var already=mine().some(function(t){return t.name===state.projectName});
    var key=state.projectName+'|'+state.heroTitle;
    if(ready&&!already&&shown!==key){bar.classList.add('on')}
    if(!ready||already)bar.classList.remove('on');
  }).observe(document.body,{childList:true,subtree:true});

  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-mt]');
    if(!b)return;
    if(b.dataset.mt==='no'){shown=state.projectName+'|'+state.heroTitle;bar.classList.remove('on');return}
    var t=save(state.projectName);
    if(!t)return;
    bar.classList.remove('on');
    toast('"'+t.name+'" is in Templates — preview or customise it like any other');
  });

  /* ---------- library cards know what has been built ---------- */

  var baseLib=views.library;
  if(baseLib){
    views.library=function(){
      var html=baseLib.apply(this,arguments);
      // mark the ones already saved
      mine().forEach(function(t){
        html=html.replace(new RegExp('(<b>'+t.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'</b>)'),
          '$1<span class="cat" style="color:#5fd08a">in templates</span>');
      });
      return html;
    };
  }

  /* ---------- keep them out of the way of the built-ins ---------- */

  // "/preset/<name>" is built by lowercasing the name, which leaves a space in
  // any multi-word template and never routes. Both ends now use the same slug.
  function slug(n){return String(n||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}
  window.__tplSlug=slug;

  var baseFromPath=window.presetFromPath;
  window.presetFromPath=function(){
    var m=location.pathname.match(/^\/preset\/([a-z0-9-]+)\/?$/i);
    if(!m)return baseFromPath?baseFromPath.apply(this,arguments):null;
    var want=m[1].toLowerCase();
    return TEMPLATES.find(function(t){return slug(t.name)===want})
        || (baseFromPath?baseFromPath.apply(this,arguments):null);
  };

  var baseTemplates=views.templates;
  views.templates=function(){
    rehydrate();
    var html=baseTemplates.apply(this,arguments);
    return html.replace(/href="\/preset\/([^"]*)"/g,function(_,n){
      return 'href="/preset/'+slug(decodeURIComponent(n))+'"';
    });
  };
})();
