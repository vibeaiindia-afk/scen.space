
(function(){
  var base=window.showPublishedSite;
  if(typeof base!=='function')return;
  function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

  var BRIDGE='<scr'+'ipt>document.addEventListener("click",function(e){'+
    'var a=e.target.closest&&e.target.closest("a[href$=\\".html\\"]");'+
    'if(a){e.preventDefault();parent.postMessage({scenNav:a.getAttribute("href")},"*")}'+
    '},true);</scr'+'ipt>';

  function renderAgentBuild(slug,d,s){
    var byFile={};
    s.pages.forEach(function(p){if(p&&p.file)byFile[p.file]=p});
    var first=(s.pages[0]||{}).file||'index.html';
    if(!byFile[first])return false;

    // Once per real page load, not once per postMessage nav inside the
    // iframe — the frame's own links never leave this document.
    try{fetch('/api/sites/'+encodeURIComponent(slug)+'/track',{method:'POST',keepalive:true})}catch(e){}

    document.title=(d.projectName||slug)+' — built with Scen';
    // The builder's loaders keep animating against their own nodes, so hiding
    // beats removing: nothing it holds a reference to disappears, and anything
    // it renders later (toasts, modals) stays hidden too.
    var hide=document.createElement('style');
    hide.textContent='html,body{margin:0;height:100%;overflow:hidden}'+
      'body>*:not(#scenAgentFrame){display:none!important}';
    document.head.appendChild(hide);
    var frame=document.createElement('iframe');
    frame.id='scenAgentFrame';
    frame.title=d.projectName||slug;
    // viewport units, not percentages: the builder puts a perspective on an
    // ancestor, which makes it the containing block for position:fixed
    frame.style.cssText='position:fixed;top:0;left:0;width:100vw;height:100vh;border:0;'+
      'display:block;background:#07070b;z-index:2147483647';
    document.body.appendChild(frame);

    function docFor(file){
      var p=byFile[file]||byFile[first];
      return String(p.html||'')
        .replace('<link rel="stylesheet" href="styles.css"/>','<style>'+(s.css||'')+'</style>')
        .replace('<scr'+'ipt src="app.js"></scr'+'ipt>','<scr'+'ipt>'+(s.js||'')+'</scr'+'ipt>'+BRIDGE);
    }
    function show(file,push){
      var f=byFile[file]?file:first;
      frame.srcdoc=docFor(f);
      if(push)history.pushState({f:f},'','/s/'+slug+(f===first?'':'#'+f));
    }
    addEventListener('message',function(e){
      if(e.data&&e.data.scenNav)show(String(e.data.scenNav),true);
    });
    addEventListener('popstate',function(){
      show((location.hash||'').replace(/^#/,'')||first,false);
    });
    show((location.hash||'').replace(/^#/,'')||first,false);
    return true;
  }

  window.showPublishedSite=async function(slug){
    try{
      var r=await fetch('/api/sites/'+encodeURIComponent(slug),{cache:'no-store'});
      if(r.ok){
        var d=await r.json(),s=d.site;
        if(typeof s==='string'){try{s=JSON.parse(s)}catch(e){}}
        if(s&&s.kind==='scen-agent-build'&&Array.isArray(s.pages)&&s.pages.length){
          if(renderAgentBuild(slug,d,s))return true;
        }
      }
    }catch(e){}
    return base.apply(this,arguments);
  };

  /* The very first script on the page (01-inline.js) detects a /s/:slug URL
     and calls showPublishedSite(slug) synchronously, before this — the last
     script on the page — has even loaded, let alone wrapped the function.
     So a scen-agent-build site always rendered through the pre-existing base
     renderer instead, which only understands the older single-page preset
     shape: it read heroTitle/heroSubtitle (present in both shapes) and
     silently ignored `pages`, so every multi-page agent build painted a bare
     hero with no real content, nav, or images — while still reporting
     success, so nothing ever surfaced this as an error. Re-running the now
     fully-wrapped function once this script has loaded catches that case and
     replaces it with the real site; for every other kind of published site
     this just repeats the same render the base already did. */
  var m=(location.pathname.match(/^\/s\/([a-z0-9-]{3,48})\/?$/i)||[]);
  if(m[1])window.showPublishedSite(m[1]);
})();
