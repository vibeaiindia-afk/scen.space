
(function(){
  'use strict';
  var E=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
  var base=window.__apiWhy||function(e){return String(e&&e.message||e)};
  var why=function(e){return base(e,'version history')};

  // history belongs to one project row; opening another must not show its list
  var versions=null, cachedFor=null, note='', busy=false, loading=false;
  function redraw(){try{render(state.route)}catch(e){}}

  async function load(force){
    if(loading)return;
    if(versions!==null&&!force&&cachedFor===state.projectDbId)return;
    loading=true;
    try{
      var id=await window.__projectId();
      var d=await api('/api/projects/'+encodeURIComponent(id)+'/versions');
      versions=d.versions||[];cachedFor=id;note='';
    }catch(e){versions=[];cachedFor=state.projectDbId;note=why(e)}
    loading=false;
    redraw();
  }
  window.__versionsReload=function(){versions=null;cachedFor=null;load(true)};

  function when(v){
    if(!v.created_at&&!v.createdAt)return '';
    var d=new Date(v.created_at||v.createdAt);
    return isNaN(d)?'':d.toLocaleString(undefined,{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
  }

  function panelHtml(){
    if(versions===null||cachedFor!==state.projectDbId){load();
      return '<h3>Version history</h3><div class="rv-msg">Loading history&hellip;</div>'}
    return '<h3>Version history</h3>'
      +'<div class="rv-msg">'+(versions.length?versions.length+' saved on the server':'')+'</div>'
      +'<div class="vh-list">'
      +(versions.length?versions.map(function(v){
        return '<div class="vh-item"><span class="no">v'+E(v.version_no)+'</span>'
          +'<div class="meta"><b>'+E(v.label||('Version '+v.version_no))+'</b>'
          +'<span class="tiny muted">'+E(when(v))+'</span></div>'
          +'<button data-vh="restore" data-id="'+E(v.id)+'"'+(busy?' disabled':'')+'>Restore</button>'
          +'</div>';
      }).join(''):(note?'':'<div class="rv-msg">No versions yet. Save the first one below.</div>'))
      +'</div>'
      +'<button class="btn" style="width:100%;margin-top:9px" data-vh="save"'+(busy?' disabled':'')+'>'
      +(busy?'Working…':'＋ Save version')+'</button>'
      +(note?'<div class="rv-msg rv-err">'+E(note)+'</div>':'');
  }

  var basePanel=window.builderPanel;
  window.builderPanel=function(){
    if(state.builderTab!=='history')return basePanel.apply(this,arguments);
    return panelHtml();
  };

  /**
   * Every edit used to mint a local version. Keep that trigger, but write it
   * to the project row instead — and never block the edit on the network.
   */
  var baseMake=window.makeVersion;
  window.makeVersion=function(label){
    var snap=snapshot();
    try{baseMake.apply(this,arguments)}catch(e){}
    (async function(){
      try{
        var id=await window.__projectId();
        var d=await api('/api/projects/'+encodeURIComponent(id)+'/versions',
          {method:'POST',body:JSON.stringify({label:String(label||'Version'),snapshot:snap})});
        if(versions!==null&&d&&d.version)versions=[d.version].concat(versions);
        note='';
        if(state.route==='builder'&&state.builderTab==='history')redraw();
      }catch(e){/* the local copy already saved; surface it in the panel only */
        if(versions!==null){note=why(e);if(state.builderTab==='history')redraw()}
      }
    })();
  };

  document.addEventListener('click',async function(e){
    var b=e.target.closest&&e.target.closest('[data-vh]');
    if(!b)return;
    e.preventDefault();

    if(b.dataset.vh==='save'){
      var label=(state.projectName||'Project')+' · manual save';
      busy=true;redraw();
      try{
        var id=await window.__projectId();
        var d=await api('/api/projects/'+encodeURIComponent(id)+'/versions',
          {method:'POST',body:JSON.stringify({label:label,snapshot:snapshot()})});
        versions=[d.version].concat(versions||[]);note='';
        toast('Version saved');
      }catch(err){note=why(err)}
      busy=false;redraw();
      return;
    }

    if(b.dataset.vh==='restore'){
      busy=true;redraw();
      try{
        var pid=await window.__projectId();
        var d=await api('/api/projects/'+encodeURIComponent(pid)+'/versions/'+encodeURIComponent(b.dataset.id));
        recordUndo();
        restoreSnap(d.version&&d.version.snapshot);
        note='';
        toast('Version restored');
      }catch(err){note=why(err)}
      busy=false;redraw();
      return;
    }
  });

})();
