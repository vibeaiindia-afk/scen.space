
/* Home, rebuilt in the UI 2 language. Every number here comes from real state
   or the capability read — where there is no data it says so rather than
   showing a placeholder figure. */
(function(){
'use strict';
var ic=window.scenIcon;
if(typeof views==='undefined'||!ic)return;

function n(v){return Number(v||0).toLocaleString()}

/* A sparkline needs a real series. Nothing in the product records one yet, so
   this draws the only honest thing available: flat, unlit, with the reason. */
function spark(series){
  if(!series||!series.length)
    return '<div class="ui2-spark">'+Array(12).join('x').split('x')
      .map(function(){return '<i style="height:14%"></i>'}).join('')+'</div>';
  var max=Math.max.apply(null,series)||1;
  return '<div class="ui2-spark">'+series.map(function(v,i){
    return '<i class="'+(v===max?'on':'')+'" style="height:'+Math.max(8,v/max*100)+'%"></i>';
  }).join('')+'</div>';
}

/* What is actually stopping this project going live. Real checks only. */
function blockers(){
  var out=[];
  var caps=null;
  try{caps=window.__ui2caps}catch(e){}
  var domainState=caps&&caps.domain?caps.domain.state:null;
  var payState=caps&&caps.payments?caps.payments.state:null;

  if(state.store&&state.store.enabled&&payState&&payState!=='connected')
    out.push(['Connect payments','Your store is built but checkout cannot take money','Blocking','connections']);
  if(domainState==='setup_required')
    out.push(['Finish your domain','Added, but still waiting on DNS at your registrar','Pending','domains']);
  else if(domainState==='not_connected')
    out.push(['Connect a domain','Publishing works without one, on a scen.space address','Optional','domains']);
  var ps=state.projectSettings||{};
  if(!ps.siteTitle||!ps.description)
    out.push(['Add a site description','Improves how you appear in search results','Minor','projectsettings']);
  if(!(state.forms||[]).length)
    out.push(['Add a way to get enquiries','No form on the site yet, so nothing can reach you','Minor','forms']);
  return out;
}

views.dashboard=function(){
  var ps=(state.projects||[]);
  var published=ps.filter(function(p){return p.status==='Published'}).length;
  var leads=(state.leads||[]).length;
  var credits=state.credits;
  var todo=blockers();

  var h='<div class="ui2-top"><h1>'+escV(typeof greeting==='function'?greeting():'Welcome back')+'</h1>'+
    '<div style="display:flex;gap:10px;align-items:center">'+
    '<div class="ui2-seg"><button class="on">Overview</button>'+
    '<button data-nav="activity">Activity</button><button data-nav="monitoring">Health</button></div>'+
    '<button class="btn primary" data-nav="create">＋ Create website</button></div></div>';

  /* Stat row — three real counts. */
  h+='<div class="ui2-stats">';
  h+='<div class="ui2-stat"><span class="caps">Websites</span><div class="ui2-row">'+
     '<div class="ui2-num'+(ps.length?'':' none')+'">'+(ps.length?n(ps.length):'—')+'</div>'+
     (published?'<span class="ui2-delta">'+published+' live</span>':'')+'</div>'+
     (ps.length?spark():'<p class="ui2-hint">Nothing built yet.</p>')+'</div>';

  h+='<div class="ui2-stat"><span class="caps">Leads captured</span><div class="ui2-row">'+
     '<div class="ui2-num'+(leads?'':' none')+'">'+(leads?n(leads):'—')+'</div></div>'+
     (leads?spark():'<p class="ui2-hint">Arrive here when someone submits a form.</p>')+'</div>';

  h+='<div class="ui2-stat"><span class="caps">Credits</span><div class="ui2-row">'+
     '<div class="ui2-num'+(credits==null?' none':'')+'">'+(credits==null?'—':n(credits))+'</div></div>'+
     (credits==null?'<p class="ui2-hint">Balance loads from your account.</p>'
                   :'<p class="ui2-hint">Used by AI writing, images and video.</p>')+'</div>';
  h+='</div>';

  /* Projects + the paper panel. */
  h+='<div class="ui2-split">';
  h+='<div class="card" style="padding:20px">'+
     '<div class="sx-row" style="margin-bottom:14px"><b style="font-size:12.5px">Continue working</b>'+
     '<button class="btn ghost" data-nav="projects" style="font-size:12px">All projects</button></div>';
  if(ps.length){
    h+='<div class="sx-grid" style="margin:0">'+ps.slice(0,4).map(function(p,i){
      var s=p.status||'Draft';
      return '<article class="sx-pcard" data-sx="openProject" data-idx="'+i+'">'+
        '<div class="sx-pshot">'+escV((p.name||'U').slice(0,1).toUpperCase())+'</div>'+
        '<div class="sx-pbody"><b>'+escV(p.name||'Untitled')+'</b><div class="sx-pmeta">'+
        '<span class="sx-st '+(s==='Published'?'ok':'')+'">'+escV(s)+'</span>'+
        '<span>'+escV(p.updated||'Not edited yet')+'</span></div></div></article>';
    }).join('')+'</div>';
  }else{
    h+='<div class="sx-empty" style="border:1px dashed #24242c"><b>No websites yet</b>'+
       '<p>Describe your business in a sentence and Scen will plan the pages, write the copy and build the site.</p>'+
       '<button class="btn primary" data-nav="aibuilder">Open AI Builder</button></div>';
  }
  h+='</div>';

  /* The paper surface. */
  h+='<div class="ui2-paper"><span class="caps">Needs you</span>'+
     '<div class="ui2-num" style="margin-top:10px">'+(todo.length||'0')+'</div>'+
     '<div class="ui2-sub">'+(todo.length
        ?'thing'+(todo.length===1?'':'s')+' to look at before you launch'
        :'nothing is waiting on you')+'</div>';
  if(todo.length){
    h+='<div class="ui2-list">'+todo.slice(0,4).map(function(t,i){
      return '<div class="ui2-item'+(i===0?' top':'')+'" data-nav="'+t[3]+'"><span class="dot"></span>'+
        '<div><b>'+escV(t[0])+'</b><small>'+escV(t[1])+'</small></div>'+
        '<span class="st">'+escV(t[2])+'</span></div>';
    }).join('')+'</div>'+
    '<button class="btn ink" data-nav="'+todo[0][3]+'">'+escV(todo[0][0])+' →</button>';
  }else{
    h+='<div class="ui2-list"><div class="ui2-item"><span class="dot"></span>'+
       '<div><b>All clear</b><small>Publish whenever you are ready</small></div></div></div>'+
       '<button class="btn ink" data-nav="publish">Go to Publish →</button>';
  }
  h+='</div></div>';
  return h;
};

/* The blockers list needs the capability read; cache it and repaint once. */
if(typeof window.scenCapabilities==='function'){
  var painted=false;
  var poll=setInterval(function(){
    if(!state.auth)return;
    window.scenCapabilities().then(function(c){
      window.__ui2caps=c;
      clearInterval(poll);
      if(!painted&&state.route==='dashboard'){painted=true;render('dashboard')}
    }).catch(function(){clearInterval(poll)});
  },1500);
}

/* Workspace card at the top of the sidebar, matching the reference. */
function mountWs(){
  var bar=document.querySelector('.app-sidebar');
  if(!bar||bar.querySelector('.ui2-ws'))return;
  var np=bar.querySelector('.new-project');
  if(!np)return;
  var c=(typeof state!=='undefined')?state.credits:null;
  var d=document.createElement('div');
  d.className='ui2-ws';
  d.setAttribute('data-nav','settings');
  d.innerHTML='<i></i><div><b>'+escV(state.workspaceName||'Workspace')+'</b>'+
    '<span>'+(c==null?'Plan &amp; credits':Number(c).toLocaleString()+' credits')+'</span></div>';
  np.parentNode.insertBefore(d,np);
}
var mo=new MutationObserver(mountWs);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){mountWs();mo.observe(document.body,{childList:true,subtree:true})});
else{mountWs();mo.observe(document.body,{childList:true,subtree:true})}
})();
