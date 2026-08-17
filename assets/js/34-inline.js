
(function(){
  'use strict';
  var SHAPES={orb:'Orb',cube:'Soft Cube',ring:'Portal Ring',card:'Glass Card',type:'3D Type',arch:'Arch'};

  function studio(){
    state.assetStudio=state.assetStudio||{};
    var a=state.assetStudio;
    a.selectedAsset=a.selectedAsset||'orb';
    a.material=a.material||'Glass';
    a.transform=a.transform||{x:0,y:0,z:0,rx:-8,ry:18,rz:0,sx:1,sy:1,sz:1};
    return a;
  }
  window.__heroObject=studio;

  function objectHtml(a){
    var t=a.transform||{}, brand=state.brand||{};
    var accent=(state.templatePalette&&state.templatePalette.accent)||brand.accent||'#dfff45';
    var second=(state.templatePalette&&state.templatePalette.accent2)||brand.primary||'#7d6cff';
    var shape=a.selectedAsset||'orb';
    var tf='rotateX('+(t.rx||0)+'deg) rotateY('+(t.ry||0)+'deg) rotateZ('+(t.rz||0)+'deg)'
      +' translate3d('+(t.x||0)+'px,'+(t.y||0)+'px,'+(t.z||0)+'px)'
      +' scale3d('+(t.sx||1)+','+(t.sy||1)+','+(t.sz||1)+')';
    var label=shape==='type'
      ? String((state.globalHeader&&state.globalHeader.logo)||state.projectName||'Aa').slice(0,3).toUpperCase()
      : '';
    return '<div class="h3d-obj h3d-float shape-'+shape+' mat-'+String(a.material||'Glass').replace(/\s+/g,'')+'" '
      +'style="--h3a:'+accent+';--h3b:'+second+';transform:'+tf+'">'+label+'</div>';
  }
  window.__heroObjectHtml=objectHtml;

  // swap the fixed cube for the chosen object, on every canvas repaint
  function decorate(){
    if(state.route!=='builder')return;
    var host=document.querySelector('.canvas-device .site-3d');
    if(!host)return;
    var a=studio();
    var stamp=[a.selectedAsset,a.material,JSON.stringify(a.transform)].join('|');
    if(host.dataset.h3d===stamp)return;
    host.dataset.h3d=stamp;
    host.classList.add('h3d');
    host.innerHTML=objectHtml(a);
  }

  new MutationObserver(function(){try{decorate()}catch(e){}})
    .observe(document.body,{childList:true,subtree:true});

  // choosing an asset or a material has to reach the canvas straight away
  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-asset-id],[data-asset-select],[data-material],[data-asset]');
    if(!b)return;
    setTimeout(function(){
      var host=document.querySelector('.canvas-device .site-3d');
      if(host)host.dataset.h3d='';
      decorate();
      saveState();
    },40);
  });

  // "Preview object" showed nothing; it now shows the object it describes
  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-action="previewObject"],[data-action="previewAsset"]');
    if(!b&&!(e.target.closest('button')&&/preview object/i.test(e.target.closest('button').textContent||'')))return;
    e.preventDefault();e.stopImmediatePropagation();
    var a=studio();
    modal('<div class="modal-head"><div><span class="caps">Scene object</span>'
      +'<b style="display:block;margin-top:4px">'+(SHAPES[a.selectedAsset]||'Object')+' &middot; '+String(a.material||'')+'</b></div>'
      +'<button class="close" data-action="closeModal">&times;</button></div>'
      +'<div class="modal-body"><div class="h3d-preview">'+objectHtml(a)+'</div>'
      +'<div class="tiny muted" style="margin-top:10px">This is what sits in the hero of your site. '
      +'Change the shape or material on the left and it updates here and on the canvas.</div>'
      +'<button class="btn primary" style="width:100%;margin-top:12px" data-nav="builder">Back to the canvas</button></div>');
  },true);

  /* ---------- publish ---------- */

  var baseSnapshot=window.siteSnapshot;
  window.siteSnapshot=function(){
    var s=baseSnapshot.apply(this,arguments);
    var a=studio();
    s.heroObject={shape:a.selectedAsset,material:a.material,transform:a.transform};
    return s;
  };

  // the published page draws the same object
  var basePreset=window.renderPreset;
  window.renderPreset=function(tpl){
    var r=basePreset.apply(this,arguments);
    try{
      if(tpl&&tpl.heroObject){
        var host=document.querySelector('#presetView .pv-hero .in');
        if(host&&!host.querySelector('.h3d-obj')){
          var wrap=document.createElement('div');
          wrap.className='site-3d h3d';
          wrap.style.cssText='margin-top:26px;min-height:220px';
          wrap.innerHTML=objectHtml(tpl.heroObject);
          host.appendChild(wrap);
        }
      }
    }catch(e){}
    return r;
  };
})();
