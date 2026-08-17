
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
})();
