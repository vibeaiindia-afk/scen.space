
(function(){
  'use strict';
  var E=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};

  var list=null, note='', busy='';

  async function load(force){
    if(list!==null&&!force)return;
    try{
      var d=await api('/api/domains');
      list=d.domains||[];note='';
    }catch(e){
      list=[];
      // the migration hint is for staff only — customers get a plain status line
      var raw=String(e&&e.message||e);
      if(/custom_domains|relation/.test(raw))console.warn('[domains] migration pending:',raw);
      note=(e&&e.status===401)?'Sign in to manage domains.'
        :(/custom_domains|relation/.test(raw)
            ? 'Custom domains are not available yet. Your site stays live at its scen.space address.'
            : 'Could not load your domains. Please try again in a moment.');
    }
    if(state.route==='domains')render('domains');
  }

  function row(d){
    var live=d.status==='live';
    return '<article class="dm-row" data-dm-row="'+E(d.id)+'">'
      +'<div class="dm-head"><b>'+E(d.host)+'</b>'
        +'<span class="dm-state '+(live?'live':'')+'"><i></i>'+(live?'Live':'Pending DNS')+'</span>'
        +'<span class="grow"></span>'
        +'<button class="btn sm" data-dm="verify" data-id="'+E(d.id)+'">'
          +(busy===d.id?'Checking&hellip;':'Verify DNS')+'</button>'
        +'<button class="btn sm ghost" data-dm="remove" data-id="'+E(d.id)+'">Remove</button></div>'
      +(live?'':'<div class="dm-dns">'
        +'<div class="dm-rec"><span class="k">TYPE</span><span class="k">NAME</span><span class="k">VALUE</span><span></span></div>'
        +(d.records||[]).map(function(r){
          return '<div class="dm-rec"><span>'+E(r.type)+'</span><span class="v">'+E(r.name)+'</span>'
            +'<span class="v" title="'+E(r.value)+'">'+E(r.value)+'</span>'
            +'<button data-dm="copy" data-value="'+E(r.value)+'">Copy</button></div>';
        }).join('')
        +'</div>')
      +(d.lastError?'<div class="dm-note dm-err">'+E(d.lastError)+'</div>'
        :'<div class="dm-note">Add these at your registrar, then press Verify DNS.</div>');
  }

  views.domains=function(){
    if(list===null){load();}
    var body;
    if(list===null)body='<div class="dm-empty"><span class="tiny muted">Loading&hellip;</span></div>';
    else if(!list.length)body='<div class="dm-empty"><b>No domains yet</b>'
      +'<p class="small muted" style="margin:6px 0 12px">Your sites are live at scen.space/s/&lt;name&gt;. '
      +'Add a domain you own to use that instead.</p>'
      +'<button class="btn primary" data-dm="add">Connect a domain</button></div>';
    else body='<div class="dm-list">'+list.map(row).join('')+'</div>';

    return viewHead('Domains','Connect a domain you own and point it at your published site.',
        '<button class="btn primary" data-dm="add">&#65291; Connect domain</button>')
      +(note?'<div class="dm-note dm-err" style="padding:10px 0">'+E(note)+'</div>':'')
      +body;
  };

  function addModal(){
    modal('<div class="modal-head"><b>Connect a domain</b>'
      +'<button class="close" data-action="closeModal">&times;</button></div>'
      +'<div class="modal-body"><div class="field"><label>Domain you own</label>'
      +'<input id="dmHost" placeholder="example.com or shop.example.com" spellcheck="false"/></div>'
      +'<p class="tiny muted">You will get the DNS records to add at your registrar. '
      +'Nothing changes on your domain until you add them.</p>'
      +'<div id="dmMsg" class="tiny muted" style="min-height:16px;margin:8px 0"></div>'
      +'<button class="btn primary" style="width:100%" id="dmSave">Add domain</button></div>');
    var input=document.getElementById('dmHost');
    input&&input.focus();
    document.getElementById('dmSave').addEventListener('click',async function(){
      var btn=this,msg=document.getElementById('dmMsg');
      btn.disabled=true;btn.textContent='Adding…';
      try{
        var d=await api('/api/domains',{method:'POST',body:JSON.stringify({
          host:input.value,slug:state.publishedSlug||''})});
        list=[d.domain].concat(list||[]);
        closeModal();render('domains');
        toast('Domain added — now add the DNS records');
      }catch(e){
        msg.textContent=String(e&&e.message||e);
        btn.disabled=false;btn.textContent='Add domain';
      }
    });
    input&&input.addEventListener('keydown',function(e){
      if(e.key==='Enter')document.getElementById('dmSave').click();
    });
  }

  document.addEventListener('click',async function(e){
    var b=e.target.closest('[data-dm]');
    if(!b)return;
    var act=b.dataset.dm;

    if(act==='add'){e.preventDefault();addModal();return}

    if(act==='copy'){
      try{await navigator.clipboard.writeText(b.dataset.value);toast('Copied')}
      catch(err){toast('Select and copy manually')}
      return;
    }

    if(act==='verify'){
      busy=b.dataset.id;render('domains');
      try{
        var r=await api('/api/domains/'+encodeURIComponent(b.dataset.id),{method:'PATCH'});
        list=(list||[]).map(function(d){
          return d.id===b.dataset.id?Object.assign({},d,{status:r.status,lastError:r.error}):d});
        toast(r.status==='live'?'Domain is live':'Not visible yet — DNS can take up to an hour');
      }catch(err){note=String(err&&err.message||err)}
      busy='';render('domains');
      return;
    }

    if(act==='remove'){
      b.disabled=true;
      try{
        await api('/api/domains/'+encodeURIComponent(b.dataset.id),{method:'DELETE'});
        list=(list||[]).filter(function(d){return d.id!==b.dataset.id});
        render('domains');toast('Domain removed');
      }catch(err){note=String(err&&err.message||err);render('domains')}
      return;
    }
  });

  // the old modal wrote a row straight into local state, which is how the
  // same host appeared twice
  document.addEventListener('click',function(e){
    if(e.target.closest('[data-action="connectDomain"]')){
      e.preventDefault();e.stopImmediatePropagation();addModal();
    }
  },true);

  var last='';
  new MutationObserver(function(){
    if(state.route==='domains'&&last!=='domains')load(true);
    last=state.route;
  }).observe(document.body,{childList:true,subtree:true});
})();
