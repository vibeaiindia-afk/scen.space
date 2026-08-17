
(function(){
  'use strict';
  var E=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};

  function threadsHtml(){
    var rv=window.__review;
    if(!rv.ready()){rv.load();return '<div class="rv-msg">Loading comments&hellip;</div>'}
    var list=rv.list(),note=rv.note();
    return (list.length?list.map(function(c){
      var when=c.createdAt?new Date(c.createdAt).toLocaleString(undefined,
        {day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):'';
      return '<div class="review-thread'+(c.status==='open'?'':' resolved')+'">'
        +'<div class="review-thread-head">'
          +'<div class="review-avatar">'+E((c.authorEmail||'?').slice(0,1).toUpperCase())+'</div>'
          +'<div style="min-width:0"><b>'+E(c.authorEmail||'Someone')+'</b>'
          +'<div class="tiny muted">'+E(when)
          +(c.objectRef?' · <span class="review-object-chip">'+E(c.objectRef)+'</span>':'')+'</div></div>'
          +'<span class="grow"></span>'
          +'<span class="review-status '+(c.status==='open'?'open':'resolved')+'">'
          +(c.status==='open'?'Open':'Resolved')+'</span>'
        +'</div>'
        +'<p class="small" style="line-height:1.55;margin:10px 0">'+E(c.body)+'</p>'
        +'<div class="row">'
          +'<button class="btn ghost" data-rv="'+(c.status==='open'?'resolve':'reopen')+'" data-id="'+E(c.id)+'">'
          +(c.status==='open'?'Resolve':'Reopen')+'</button>'
          +'<button class="btn ghost" data-rv="del" data-id="'+E(c.id)+'">Delete</button>'
        +'</div></div>';
    }).join(''):(note?'<div class="state-preview"><div style="text-align:center">'
      +'<div class="empty-illustration">⚠</div><b>Comments could not be loaded</b>'
      +'<p class="small muted">'+E(note)+'</p></div></div>'
      :'<div class="state-preview"><div style="text-align:center">'
      +'<div class="empty-illustration">◎</div><b>No review comments yet</b>'
      +'<p class="small muted">Leave the first one below — the client sees the same list.</p></div></div>'))
      +'<div class="rv-new" style="margin-top:12px">'
      +'<textarea id="rvBody" placeholder="What needs changing on this page?"></textarea>'
      +'<button class="btn primary" id="rvAdd">Add comment</button></div>'
      +(list.length&&note?'<div class="rv-msg rv-err">'+E(note)+'</div>':'');
  }

  function caps(el,text){
    var n=el.querySelector('.caps');
    return !!n&&n.textContent.trim().toLowerCase()===text;
  }

  function patch(){
    if(state.route!=='clientreview')return;
    var rv=window.__review,loaded=rv.ready(),live=loaded&&!rv.note(),open=0;
    if(loaded)open=rv.list().filter(function(c){return c.status==='open'}).length;

    // counts printed in a few places, all from the prototype array
    if(loaded)Array.prototype.forEach.call(document.querySelectorAll('.pill'),function(p){
      var m=/^\d+ open( comments)?$/.exec(p.textContent.trim());
      if(m)p.textContent=open+' open'+(m[1]||'');
    });

    Array.prototype.forEach.call(document.querySelectorAll('.review-panel'),function(panel){
      if(!caps(panel,'object comments'))return;
      if(panel.dataset.rvHub==='1'&&panel.querySelector('#rvAdd')&&loaded)return;
      panel.dataset.rvHub='1';
      var row=panel.querySelector('.row');
      panel.innerHTML='';
      if(row){
        var add=row.querySelector('[data-action="addReviewPin"]');
        if(add)add.remove();
        panel.appendChild(row);
      }
      var box=document.createElement('div');
      box.innerHTML=threadsHtml();
      panel.appendChild(box);
    });

    // pins are positioned from prototype x/y and point at rows that are gone
    if(loaded)Array.prototype.forEach.call(document.querySelectorAll('.review-pin'),function(p){p.remove()});

    // keyed off the marker attribute, not the copy, so wording can change freely
    var banner=document.querySelector('[data-review-banner] b')||document.querySelector('.admin-banner b');
    if(live&&banner){
      banner.textContent='Comments are live — branches and approvals are not';
      var sub=banner.parentNode&&banner.parentNode.querySelector('.tiny');
      if(sub)sub.textContent='Review comments are saved to your database. Branching, approvals and share settings stay on this device for now.';
    }
  }

  var baseNav=window.render;
  window.render=function(route){
    var r=baseNav.apply(this,arguments);
    if(route==='clientreview')setTimeout(patch,0);
    return r;
  };

  // the hub's own "＋ Pin comment" wrote a fake row; send it to the real box
  document.addEventListener('click',function(e){
    if(state.route!=='clientreview')return;
    var b=e.target.closest&&e.target.closest('[data-action="addReviewPin"]');
    if(!b)return;
    e.preventDefault();e.stopPropagation();
    var ta=document.getElementById('rvBody');
    if(ta){ta.scrollIntoView({block:'center',behavior:'smooth'});ta.focus()}
  },true);
})();
