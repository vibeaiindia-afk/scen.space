
(function(){
  'use strict';
  var E=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};

  // A faithful miniature of one section, using the template's real content.
  function miniBlock(sec,accent){
    if(!sec||!sec.kind)return '';
    if(sec.kind==='metrics')
      return (sec.items||[]).slice(0,4).map(function(m){
        return '<div class="tmb-card"><div class="k">'+E(m.k)+'</div><div class="v">'+E(m.v)+'</div>'
          +'<div class="s">'+E(m.sub)+'</div></div>'}).join('');
    if(sec.kind==='table'){
      var cols=(sec.cols||[]).slice(0,5);
      var rows=(sec.rows||[]).slice(0,3);
      return '<div class="tmb-stack">'
        +'<div class="tmb-row">'+cols.map(function(c){return '<span><b>'+E(c)+'</b></span>'}).join('')+'</div>'
        +rows.map(function(r){return '<div class="tmb-row">'+r.slice(0,5).map(function(c){
            return '<span>'+E(c)+'</span>'}).join('')+'</div>'}).join('')
        +'</div>';
    }
    if(sec.kind==='gallery')
      return '<div class="tmb-tiles">'+(sec.tiles||[]).slice(0,4).map(function(t){
        return '<div class="tmb-tile">'+E(t)+'</div>'}).join('')+'</div>';
    if(sec.kind==='pricing')
      return (sec.plans||[]).slice(0,3).map(function(p){
        return '<div class="tmb-card"><div class="k">'+E(p.name)+'</div><div class="v">'+E(p.amt)+'</div>'
          +'<div class="s">per '+E(p.per||'month')+'</div></div>'}).join('');
    if(sec.kind==='scroller')
      return (sec.cards||[]).slice(0,3).map(function(c){
        return '<div class="tmb-card"><div class="k">'+E(c.label)+'</div>'
          +'<div class="v" style="font-size:28px">'+E(c.title)+'</div>'
          +'<div class="s">'+E(String(c.copy||'').slice(0,54))+'</div></div>'}).join('');
    if(sec.kind==='timeline')
      return (sec.steps||[]).slice(0,3).map(function(s){
        return '<div class="tmb-card"><div class="k">'+E(s.when)+'</div>'
          +'<div class="v" style="font-size:28px">'+E(s.title)+'</div></div>'}).join('');
    if(sec.kind==='faq')
      return '<div class="tmb-stack">'+(sec.items||[]).slice(0,3).map(function(i){
        return '<div class="tmb-row"><span><b>'+E(i.q)+'</b></span></div>'}).join('')+'</div>';
    if(sec.kind==='split')
      return '<div class="tmb-stack">'+(sec.bullets||[]).slice(0,3).map(function(b){
        return '<div class="tmb-row"><span>'+E(b)+'</span></div>'}).join('')+'</div>';
    if(sec.kind==='logos')
      return '<div class="tmb-tiles">'+(sec.names||[]).slice(0,4).map(function(n){
        return '<div class="tmb-tile" style="height:76px;align-items:center;justify-content:center;font-weight:700">'
          +E(n)+'</div>'}).join('')+'</div>';
    if(sec.kind==='quote')
      return '<div class="tmb-card" style="flex:1"><div class="v" style="font-size:30px;line-height:1.2">&ldquo;'
        +E(String(sec.quote||'').slice(0,90))+'&rdquo;</div><div class="s">'+E(sec.attr)+'</div></div>';
    return '';
  }

  window.__templateThumb=function(tpl){
    var pal=tpl.palette||{}, accent=pal.accent||'#dfff45', accent2=pal.accent2||'#7beeff';
    var cin=tpl.cinema;
    var nav=(tpl.components||[]).slice(0,4).map(function(n){return '<span>'+E(n)+'</span>'}).join('');
    var cta=(tpl.ctas&&tpl.ctas[0])||'Get started';
    var blocks=(tpl.sections||[]).slice(0,1).map(function(s){return miniBlock(s,accent)}).join('');

    // A cinematic template is its photography, so the thumbnail is the scene.
    var bg='';
    if(cin&&cin.layers){
      bg='<img class="tmb-sky" src="'+E(cin.layers.sky)+'" alt="" loading="lazy"/>'
        +(cin.layers.bridge?'<img class="tmb-fg" src="'+E(cin.layers.bridge)+'" alt="" loading="lazy"/>':'');
      nav=(cin.nav||[]).slice(0,4).map(function(n){return '<span>'+E(n[0])+'</span>'}).join('');
      blocks='<div class="tmb-pills">'+(cin.tags||[]).map(function(t){
        return '<span class="tmb-pill">'+E(t)+'</span>'}).join('')+'</div>';
    }

    return '<div class="tmb-fit"><div class="tmb'+(cin?' tmb-serif':'')+'" '
      +'style="--ta:'+E(accent)+';--tb:'+E(accent2)+'">'
      +bg+'<div class="tmb-wash"></div>'
      +'<div class="tmb-in">'
        +'<div class="tmb-nav"><b>'+E((cin&&cin.logo)||tpl.name)+'</b>'
          +'<div class="lk">'+nav+'</div><div class="cta">'+E(cta)+'</div></div>'
        +'<div class="tmb-hero"><h4>'+E((cin&&cin.title)||tpl.heroTitle||tpl.name)+'</h4>'
          +'<p>'+E(String(tpl.heroSubtitle||'').slice(0,130))+'</p></div>'
        +'<div class="tmb-blocks">'+blocks+'</div>'
      +'</div></div></div>';
  };

  // true-to-life proportions: the miniature is laid out at 1200px wide and
  // scaled down, so nothing has to be re-designed for the card
  function fitThumbs(){
    document.querySelectorAll('.tmb-fit').forEach(function(f){
      var t=f.querySelector('.tmb');
      if(t)t.style.setProperty('--tmb-scale',(f.clientWidth/1200).toFixed(4));
    });
  }
  window.__fitThumbs=fitThumbs;
  addEventListener('resize',function(){clearTimeout(window.__tmbT);window.__tmbT=setTimeout(fitThumbs,120)});

  var baseTemplates=views.templates;
  views.templates=function(){
    var html=baseTemplates();
    // swap the placeholder for the real miniature, per card
    html=html.replace(/<div class="template-preview t\d"><div class="mini-browser"><\/div><\/div>/g,
      function(){return '<!--tmb-->'});
    var i=0;
    html=html.replace(/<!--tmb-->/g,function(){
      var t=TEMPLATES[i++]||{};
      return '<div class="template-preview">'+window.__templateThumb(t)+'</div>';
    });
    setTimeout(fitThumbs,0);
    return html;
  };

  // the gallery re-renders on navigation, so re-measure whenever it reappears
  new MutationObserver(function(){
    if(document.querySelector('.tmb-fit .tmb:not([style*="--tmb-scale"])'))fitThumbs();
  }).observe(document.body,{childList:true,subtree:true});
})();
