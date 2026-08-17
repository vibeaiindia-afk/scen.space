
(function(){
  var STUDIO='/agent-studio.html';

  /* 1 — /agent used to open the old in-app builder. It is the studio now. */
  if(/^\/agent\/?$/i.test(location.pathname)){location.replace(STUDIO);return}

  /* 2 — the two studios are separate products and both are reachable.
         AI Studio is the in-app image and video generator on the
         `studio` route; the Scen Agent Studio is the standalone page
         this file links to by href. Nothing intercepts `studio` any
         more, so its sidebar link and its "Generate asset" buttons
         open the generator they name. */

  /* 3 — Preset AI gallery on the public landing page ------------------
         One card per preset that actually has a finished preview behind
         it. The agent-start cards were removed: they had nothing to
         preview, so they belonged in the studio, not in a gallery. */
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

  /* a preset knows more than a query string can carry, so Customize writes the
     whole seed into storage and the studio picks it up by slug */
  var CAT2IND={Travel:'travel',Entertainment:'events',Agency:'agency','Real Estate':'realestate',
    Wellness:'fitness',Portfolio:'portfolio',Luxury:'fashion',SaaS:'saas',Restaurant:'restaurant',
    Research:'education',Fashion:'fashion',Health:'clinic',Education:'education',Events:'events'};
  function seedFor(t){
    var slug=String(t.name||'').toLowerCase();
    var pages=(t.components||[]).filter(function(p){return p&&!/^home$/i.test(p)}).slice(0,5);
    pages=['Home'].concat(pages);
    if(!pages.some(function(p){return /contact/i.test(p)}))pages.push('Contact');
    return{slug:slug,label:'the '+t.name+' template',name:t.name,
      industry:CAT2IND[t.category]||'other',
      pitch:t.heroSubtitle||t.tag||'',
      accent:(t.palette&&t.palette.accent)||'',
      style:'cinematic',motion:'full',kind:'website',content:'agent',
      pages:pages,languages:['English']};
  }

  function shot(accent,label){
    return '<div class="tpl-shot" style="--a:'+esc(accent)+'">'+
      '<span class="tpl-tagpill">'+esc(label)+'</span>'+
      '<div class="tpl-chrome"><div class="tpl-lines"><i></i><i></i><i></i><i></i></div></div></div>';
  }
  function liveCards(){
    var list=(typeof TEMPLATES!=='undefined'?TEMPLATES:[]);
    return list.map(function(t){
      var slug=String(t.name||'').toLowerCase();
      var accent=(t.palette&&t.palette.accent)||'#dfff45';
      var count=t.sections?t.sections.length+' sections':'3D scenes';
      return '<article class="tpl-card" data-group="live">'+shot(accent,'Live template')+
        '<div class="tpl-body"><b>'+esc(t.name)+'</b>'+
        '<span class="tpl-meta">'+esc(t.category||'')+' · '+esc(count)+'</span>'+
        '<span class="tpl-meta">'+esc(t.tag||'')+'</span>'+
        '<div class="tpl-acts">'+
          '<a class="btn ghost" href="/preset/'+esc(slug)+'" target="_blank" rel="noopener">Preview ↗</a>'+
          '<a class="btn primary" data-seed="'+esc(JSON.stringify(seedFor(t)))+'" '+
            'href="'+STUDIO+'?template='+encodeURIComponent(slug)+'">Customize</a>'+
        '</div></div></article>';
    }).join('');
  }
  function mountTemplates(){
    if(document.getElementById('templates'))return;
    var anchor=document.querySelector('#marketing #pricing')||document.querySelector('#marketing #features');
    if(!anchor)return;
    var sec=document.createElement('section');
    sec.className='msection';sec.id='templates';
    sec.innerHTML='<div class="inner">'+
      '<div class="section-head"><h2>Preset AI</h2>'+
      '<p>Open the preview to see the finished site, or press Customize — that hands the whole preset to the '+
      'Scen Agent with the brief already filled in, and from there you change the site by talking to it.</p></div>'+
      '<div class="tpl-grid">'+liveCards()+'</div>'+
      '</div>';
    anchor.parentNode.insertBefore(sec,anchor);

    sec.addEventListener('click',function(e){
      var a=e.target.closest('a[data-seed]');if(!a)return;
      try{localStorage.setItem('scen.agentstudio.seed',a.dataset.seed)}catch(x){}
    },true);

    // the nav link used to jump into the logged-in Templates page
    var link=document.querySelector('#marketing .mlinks [data-action="openTemplatesMarketing"]');
    if(link){link.removeAttribute('data-action');link.setAttribute('href','#templates');link.textContent='Preset AI'}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountTemplates);
  else mountTemplates();
})();
