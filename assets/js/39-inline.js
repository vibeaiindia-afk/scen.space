
(function(){
  'use strict';
  var E=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};

  var lib=null, cat='All', q='', note='';

  async function load(){
    if(lib!==null)return;
    try{
      var r=await fetch('/prompt-library.json',{cache:'force-cache'});
      if(!r.ok)throw new Error('Could not load the library ('+r.status+')');
      lib=await r.json();
      note='';
    }catch(e){lib=[];note=String(e&&e.message||e)}
    if(state.route==='library')render('library');
  }

  function cats(){
    var seen={},out=['All'];
    (lib||[]).forEach(function(x){if(!seen[x.cat]){seen[x.cat]=1;out.push(x.cat)}});
    return out;
  }

  function match(x){
    if(cat!=='All'&&x.cat!==cat)return false;
    if(!q)return true;
    var s=(x.n+' '+x.cat+' '+x.prompt).toLowerCase();
    return s.indexOf(q.toLowerCase())>-1;
  }

  views.library=function(){
    if(lib===null){load();}
    var list=(lib||[]).filter(match);
    var chips=cats().map(function(c){
      return '<button class="chip '+(cat===c?'active':'')+'" data-plc="'+E(c)+'">'+E(c)+'</button>';
    }).join('');
    var body;
    if(lib===null)body='<div class="pl-empty"><span class="tiny muted">Loading the library&hellip;</span></div>';
    else if(!list.length)body='<div class="pl-empty"><b>Nothing matches</b>'
      +'<p class="small muted" style="margin-top:6px">Try another word or category.</p></div>';
    else body='<div class="pl-grid">'+list.map(function(x,i){
      var idx=(lib||[]).indexOf(x);
      return '<article class="pl-card">'
        +'<span class="cat">'+E(x.cat)+'</span>'
        +'<b>'+E(x.n)+'</b>'
        +'<p>'+E(x.prompt.slice(0,190))+'</p>'
        +'<div class="row">'
          +'<button data-pl="read" data-i="'+idx+'">Read</button>'
          +'<button class="go" data-pl="use" data-i="'+idx+'">Build this</button>'
        +'</div></article>';
    }).join('');

    return viewHead('Prompt library','126 starting points. Pick one and the AI builds it into an editable site.',
        '<button class="btn" data-nav="templates">Browse templates</button>')
      +'<div class="filters">'+chips+'</div>'
      +'<div class="pl-bar"><input class="pl-search" id="plSearch" placeholder="Search by name, category or words in the prompt" value="'+E(q)+'"/>'
      +'<span class="pl-count">'+list.length+' of '+((lib||[]).length)+'</span></div>'
      +(note?'<div class="tiny muted" style="color:#e0616b">'+E(note)+'</div>':'')
      +body;
  };

  document.addEventListener('click',function(e){
    var c=e.target.closest('[data-plc]');
    if(c){cat=c.dataset.plc;render('library');return}

    var b=e.target.closest('[data-pl]');
    if(!b)return;
    var item=(lib||[])[Number(b.dataset.i)];
    if(!item)return;

    if(b.dataset.pl==='read'){
      modal('<div class="modal-head"><div><span class="caps">'+E(item.cat)+'</span>'
        +'<b style="display:block;margin-top:4px">'+E(item.n)+'</b></div>'
        +'<button class="close" data-action="closeModal">&times;</button></div>'
        +'<div class="modal-body"><div class="pl-full">'+E(item.prompt)+'</div>'
        +'<div style="display:flex;gap:8px;margin-top:12px">'
        +'<button class="btn" data-pl-copy="'+Number(b.dataset.i)+'">Copy prompt</button>'
        +'<span class="grow"></span>'
        +'<button class="btn primary" data-pl="use" data-i="'+Number(b.dataset.i)+'">Build this</button>'
        +'</div></div>');
      return;
    }

    if(b.dataset.pl==='use'){
      closeModal();
      startNewProject(item.n);
      state.prompt=item.prompt;
      state.category=item.cat;
      saveState();
      navigate('generation');
      toast('Building "'+item.n+'" — the AI writes the sections');
      return;
    }
  });

  document.addEventListener('click',async function(e){
    var c=e.target.closest('[data-pl-copy]');
    if(!c)return;
    var item=(lib||[])[Number(c.dataset.plCopy)];
    if(!item)return;
    try{await navigator.clipboard.writeText(item.prompt);toast('Prompt copied')}
    catch(err){toast('Select the text and copy it')}
  });

  document.addEventListener('input',function(e){
    if(e.target.id!=='plSearch')return;
    q=e.target.value;
    clearTimeout(window.__plT);
    window.__plT=setTimeout(function(){
      render('library');
      var el=document.getElementById('plSearch');
      if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length)}
    },220);
  });

  // reachable from the sidebar, next to Templates
  new MutationObserver(function(){
    var tpl=document.querySelector('.side-link[data-route="templates"]');
    if(!tpl||document.querySelector('.side-link[data-route="library"]'))return;
    // the router reads data-nav, not data-route — cloning the Templates link
    // and only renaming data-route left it navigating to Templates
    var a=tpl.cloneNode(true);
    a.classList.remove('active');
    a.setAttribute('data-route','library');
    a.setAttribute('data-nav','library');
    a.textContent='\u2727 Prompt library';
    tpl.parentNode.insertBefore(a,tpl.nextSibling);
  }).observe(document.body,{childList:true,subtree:true});
})();
