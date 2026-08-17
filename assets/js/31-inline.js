
(function(){
  'use strict';
  var E=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};

  var cache=null, pending=false, note='';

  function kindOf(a){
    var m=String(a.mime_type||'');
    return m.indexOf('video')===0?'video':m.indexOf('image')===0?'image':'file';
  }

  async function load(){
    if(pending)return;
    pending=true;
    try{
      var d=await api('/api/assets?limit=60');
      cache=(d.assets||[]).filter(function(a){return kindOf(a)!=='file'});
      note='';
    }catch(e){
      cache=[];
      note=(e&&e.status===401)?'Sign in to load your media.':String(e&&e.message||e);
    }
    pending=false;
    if(state.route==='builder'&&state.builderTab==='media')render('builder');
  }
  window.__panelMediaReload=function(){cache=null;load()};

  var basePanel=window.builderPanel;
  window.builderPanel=function(){
    if(state.builderTab!=='media')return basePanel.apply(this,arguments);
    if(cache===null){load();return '<h3>Project media</h3><div class="pm-note">Loading your media&hellip;</div>'}
    if(!cache.length){
      return '<h3>Project media</h3>'
        +'<div class="pm-note">'+(note||'Nothing generated or uploaded yet.')+'</div>'
        +'<button class="btn" style="width:100%;margin-top:10px" data-nav="studio">Open AI Studio</button>'
        +'<button class="btn" style="width:100%;margin-top:8px" data-pm="upload">&#65291; Upload</button>'
        +'<input type="file" id="pmFile" style="display:none" accept="image/*,video/*"/>';
    }
    var tiles=cache.map(function(a){
      var k=kindOf(a), u='/api/assets/'+encodeURIComponent(a.id)+'/content';
      var on=(k==='video'?state.heroVideoAssetId:state.heroImageAssetId)===a.id;
      return '<button type="button" class="pm-tile'+(on?' on':'')+'" data-pm="use" '
        +'data-id="'+E(a.id)+'" data-kind="'+k+'" title="'+E(a.original_name||a.model||'')+'">'
        +(k==='video'
          ? '<video src="'+E(u)+'" muted playsinline preload="metadata"></video>'
          : '<img src="'+E(u)+'" alt="" loading="lazy"/>')
        +'<span class="kd">'+k+'</span>'
        +'<span class="nm">'+E(a.original_name||a.model||'generated')+'</span></button>';
    }).join('');
    return '<h3>Project media</h3>'
      +'<div class="drop-tip">Click a tile to put it behind the headline. It publishes with the site.</div>'
      +'<div class="pm-grid">'+tiles+'</div>'
      +'<div class="pm-note">'+E(note)+'</div>'
      +'<button class="btn" style="width:100%;margin-top:10px" data-pm="upload">&#65291; Upload</button>'
      +'<button class="btn ghost" style="width:100%;margin-top:6px" data-pm="refresh">Refresh</button>'
      +'<input type="file" id="pmFile" style="display:none" accept="image/*,video/*"/>';
  };

  async function upload(file){
    note='Uploading '+file.name+'…';render('builder');
    try{
      var signed=await api('/api/storage/uploads/sign',{method:'POST',body:JSON.stringify({
        name:file.name,mimeType:file.type||'application/octet-stream',bytes:file.size})});
      var put=await fetch(signed.uploadUrl,{method:'PUT',headers:signed.headers||{},body:file});
      if(!put.ok)throw new Error('Storage rejected the file ('+put.status+')');
      await api('/api/storage/uploads/complete',{method:'POST',body:JSON.stringify({
        uploadToken:signed.uploadToken,kind:(file.type||'').indexOf('video')===0?'video':'image'})});
      note='';cache=null;await load();toast('Uploaded');
    }catch(e){note=String(e&&e.message||e);render('builder')}
  }

  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-pm]');
    if(!b)return;
    var act=b.dataset.pm;
    if(act==='refresh'){cache=null;render('builder');load();return}
    if(act==='upload'){
      var inp=document.getElementById('pmFile');
      if(inp){inp.onchange=function(){if(inp.files&&inp.files[0])upload(inp.files[0])};inp.click()}
      return;
    }
    if(act==='use'){
      var id=b.dataset.id,u='/api/assets/'+encodeURIComponent(id)+'/content';
      if(b.dataset.kind==='video'){
        if(state.heroVideoAssetId===id){state.heroVideo='';state.heroVideoAssetId=''}
        else{state.heroVideo=u;state.heroVideoAssetId=id}
      }else{
        if(state.heroImageAssetId===id){state.heroImage='';state.heroImageAssetId=''}
        else{state.heroImage=u;state.heroImageAssetId=id}
      }
      saveState();render('builder');
      try{if(window.__decorateCanvasMedia)window.__decorateCanvasMedia()}catch(err){}
      toast(state.heroImageAssetId||state.heroVideoAssetId?'Set as the background':'Background removed');
      return;
    }
  });
})();
