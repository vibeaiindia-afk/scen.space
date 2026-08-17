
/* Home's left column becomes the mockup's card: a header row, then the sites
   list. No traffic chart — the product records no traffic series, and drawing
   invented bars is the one thing this whole refactor has refused to do. */
(function(){
'use strict';
if(typeof views!=='function'&&typeof views!=='object')return;
var prev=views.dashboard;
if(typeof prev!=='function')return;

views.dashboard=function(){
  var html=prev.apply(this,arguments);
  var ps=(state.projects||[]);
  if(!ps.length)return html;

  var rows='<div class="ui2-tbl">'+
    '<div class="ui2-tr head"><span>Website</span><span>Status</span><span>Address</span></div>'+
    ps.slice(0,6).map(function(p,i){
      var s=p.status||'Draft';
      var live=s==='Published';
      var addr=p.domain?escV(p.domain)
        :(live&&state.publishSettings&&state.publishSettings.subdomain
            ?'scen.space/s/'+escV(state.publishSettings.subdomain)
            :'Not connected');
      return '<div class="ui2-tr" data-sx="openProject" data-idx="'+i+'">'+
        '<b>'+escV(p.name||'Untitled')+'</b>'+
        '<span><span class="ui2-chip '+(live?'ok':'')+'">'+escV(s)+'</span></span>'+
        '<span class="mutcell">'+addr+'</span></div>';
    }).join('')+'</div>';

  /* Swap the card grid for the list, leaving the rest of the layout alone.
     Matched by its articles rather than by counting closing tags — a lazy
     [\s\S]*? here ran past the grid and swallowed the paper panel with it. */
  var re=/<div class="sx-grid" style="margin:0">(?:<article[\s\S]*?<\/article>)+<\/div>/;
  if(!re.test(html))return html;
  return html.replace(re,rows);
};
})();
