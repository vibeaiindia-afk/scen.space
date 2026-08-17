
(function(){
  'use strict';
  var E=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};

  var assets=null, loading=false, filter='all', msg='';

  function kindOf(a){
    var m=String(a.mime_type||'');
    if(m.indexOf('video')===0)return 'video';
    if(m.indexOf('image')===0)return 'image';
    if(m.indexOf('font')===0||/font/.test(String(a.original_name||'')))return 'font';
    return 'file';
  }
  function sizeOf(a){
    var b=Number(a.bytes||0);
    if(!b)return '';
    return b>1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB';
  }
  function nameOf(a){
    return a.original_name||((a.provider||'Generated')+' '+String(a.id||'').slice(0,6));
  }

  async function load(force){
    if(loading)return;
    if(assets&&!force)return;
    loading=true;
    try{
      var d=await api('/api/assets?limit=200');
      assets=d.assets||[];
      msg='';
    }catch(e){
      assets=[];
      msg=(e&&e.status===401)?'Sign in to see your media.':String(e&&e.message||e);
    }
    loading=false;
    if(state.route==='media')render('media');
  }

  function card(a){
    var k=kindOf(a), u='/api/assets/'+encodeURIComponent(a.id)+'/content';
    var shot=k==='video'
      ? '<video src="'+E(u)+'" muted playsinline preload="metadata"></video>'
      : k==='image'
        ? '<img src="'+E(u)+'" alt="" loading="lazy"/>'
        : '<span class="ml-kind" style="position:static">'+E(k.toUpperCase())+'</span>';
    return '<article class="ml-item" data-asset-id="'+E(a.id)+'">'
      +'<div class="ml-shot">'+shot+'<span class="ml-kind">'+E(k)+'</span></div>'
      +'<div class="ml-meta"><b title="'+E(nameOf(a))+'">'+E(nameOf(a))+'</b>'
        +'<span class="sub">'+E(sizeOf(a))+(a.model?' &middot; '+E(a.model):'')+'</span>'
        +'<div class="ml-acts">'
          +'<button data-ml="use" data-id="'+E(a.id)+'" data-kind="'+E(k)+'">Use as background</button>'
          +'<button data-ml="open" data-id="'+E(a.id)+'">Open</button>'
          +'<button class="del" data-ml="del" data-id="'+E(a.id)+'" title="Delete">&times;</button>'
        +'</div></div></article>';
  }

  views.media=function(){
    if(assets===null){load();}
    var list=(assets||[]).filter(function(a){
      if(filter==='all')return true;
      return kindOf(a)===filter;
    });
    var chips=[['all','All'],['image','Images'],['video','Videos'],['font','Fonts']]
      .map(function(f){return '<button class="chip '+(filter===f[0]?'active':'')+'" data-mlf="'+f[0]+'">'+f[1]+'</button>'}).join('');

    var body;
    if(assets===null)body='<div class="ml-empty"><span class="tiny muted">Loading your media&hellip;</span></div>';
    else if(!list.length)body='<div class="ml-empty"><b>Nothing here yet</b>'
      +'<p class="small muted" style="margin:6px 0 12px">Generate an image or video in AI Studio, or upload one.</p>'
      +'<button class="btn primary" data-nav="studio">Open AI Studio</button></div>';
    else body='<div class="ml-grid">'+list.map(card).join('')+'</div>';

    return viewHead('Media Library','Everything generated or uploaded in this workspace.',
        '<button class="btn" data-ml="upload">Upload</button>'
        +'<button class="btn" data-ml="refresh">Refresh</button>'
        +'<button class="btn primary" data-nav="studio">Generate asset</button>')
      +'<div class="filters">'+chips+'</div>'
      +'<div class="ml-bar"><span class="ml-count">'+list.length+' of '+((assets||[]).length)+'</span></div>'
      +'<div class="ml-msg">'+E(msg)+'</div>'
      +body
      +'<input type="file" id="mlFile" style="display:none" accept="image/*,video/*"/>';
  };

  async function upload(file){
    msg='Uploading '+file.name+'…';render('media');
    try{
      var signed=await api('/api/storage/uploads/sign',{method:'POST',body:JSON.stringify({
        name:file.name,mimeType:file.type||'application/octet-stream',bytes:file.size})});
      var put=await fetch(signed.uploadUrl,{method:'PUT',headers:signed.headers||{},body:file});
      if(!put.ok)throw new Error('Storage rejected the file ('+put.status+')');
      await api('/api/storage/uploads/complete',{method:'POST',body:JSON.stringify({
        uploadToken:signed.uploadToken,kind:(file.type||'').indexOf('video')===0?'video':'image'})});
      msg='';
      await load(true);
      toast('Uploaded');
    }catch(e){
      msg=String(e&&e.message||e);
      render('media');
    }
  }

  document.addEventListener('click',async function(e){
    var f=e.target.closest('[data-mlf]');
    if(f){filter=f.dataset.mlf;render('media');return}

    var b=e.target.closest('[data-ml]');
    if(!b)return;
    var act=b.dataset.ml, id=b.dataset.id;

    if(act==='refresh'){assets=null;render('media');load(true);return}
    if(act==='upload'){var inp=document.getElementById('mlFile');
      if(inp){inp.onchange=function(){if(inp.files&&inp.files[0])upload(inp.files[0])};inp.click()}return}
    if(act==='open'){window.open('/api/assets/'+encodeURIComponent(id)+'/content','_blank','noopener');return}
    if(act==='use'){
      var u='/api/assets/'+encodeURIComponent(id)+'/content';
      if(b.dataset.kind==='video'){state.heroVideo=u;state.heroVideoAssetId=id}
      else{state.heroImage=u;state.heroImageAssetId=id}
      saveState();
      toast('Set as the site background');
      return;
    }
    if(act==='del'){
      b.disabled=true;
      try{
        await api('/api/assets/'+encodeURIComponent(id),{method:'DELETE'});
        assets=(assets||[]).filter(function(a){return a.id!==id});
        render('media');toast('Moved to trash');
      }catch(err){msg=String(err&&err.message||err);render('media');b.disabled=false}
      return;
    }
  });

  // a fresh sign-in or a new generation should show up without a reload
  var lastRoute='';
  new MutationObserver(function(){
    if(state.route==='media'&&lastRoute!=='media'){load(true)}
    lastRoute=state.route;
  }).observe(document.body,{childList:true,subtree:true});
})();
