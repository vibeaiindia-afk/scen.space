
(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  var coarse=window.matchMedia('(hover: none)');
  function showing(){var p=document.getElementById('presetView');return p&&p.classList.contains('on')?p:null}

  // ---- a live scene in the hero, scrubbed by scroll ------------------------
  function buildScene(pv){
    var hero=pv.querySelector('.pv-hero');
    if(!hero||hero.querySelector('.pv-scene'))return;
    var scene=document.createElement('div');
    scene.className='pv-scene';scene.setAttribute('aria-hidden','true');
    scene.innerHTML='<div class="pv-dust"></div><div class="pv-ring two"></div>'+
      '<div class="pv-ring"></div><div class="pv-orb"></div>';
    hero.insertBefore(scene,hero.firstChild);
  }
  // Scroll-scrubbed video. Seeking is only worth doing where it is smooth:
  // touch devices cannot seek per frame, so there the clip simply loops.
  function scrub(sec,p){
    var v=sec.querySelector('video.t-scrub');
    if(!v||v.dataset.mode==='loop')return;
    var d=v.duration;
    if(!d||!isFinite(d))return;
    var want=Math.max(0,Math.min(d-0.05,d*p));
    // a seek costs a decode, so ignore anything under roughly one frame
    if(Math.abs((v.currentTime||0)-want)<1/30)return;
    try{v.currentTime=want}catch(e){}
  }
  function setupVideos(pv){
    var vids=pv.querySelectorAll('video.t-scrub');
    for(var i=0;i<vids.length;i++){
      var v=vids[i];
      if(v.dataset.mode)continue;
      if(reduce.matches){v.dataset.mode='poster';v.removeAttribute('src');v.load();continue}
      if(coarse.matches){
        v.dataset.mode='loop';v.loop=true;v.autoplay=true;v.muted=true;
        var pr=v.play();if(pr&&pr.catch)pr.catch(function(){});
        continue;
      }
      v.dataset.mode='scrub';v.pause();
    }
  }
  // --- customize dock ------------------------------------------------------
  // Describe a change in plain English and it is applied to the live preview.
  var PRESET_CHIPS=['Rewrite the copy for my business','Change the brand colours',
    'Make the headline shorter and punchier','Add a pricing section'];
  async function aiEditPreset(tpl,instruction){
    const current={heroTitle:tpl.heroTitle,heroSubtitle:tpl.heroSubtitle,
      palette:tpl.palette||{},
      sections:(tpl.components||[]).map(function(n,i){
        return {name:n,copy:(tpl.sectionCopy||[])[i]||''}})};
    const system='You edit website content. Reply with JSON only — no prose, no code fence. '
      +'Return the same shape you are given with only the requested change applied. '
      +'Keep every field present. Keep the section count unless asked to add or remove one. '
      +'palette.accent and palette.accent2 are hex colours.';
    const input='Current site:\n'+JSON.stringify(current)+'\n\nChange requested: '+instruction;
    const d=await api('/api/ai/generate',{method:'POST',body:JSON.stringify({
      feature:'planning',system,input,temperature:0.6,maxOutputTokens:1200})});
    return parseModelJson(d&&d.text);
  }
  function mergePresetEdit(out){
    const tpl=window.__presetTpl;if(!tpl||!out)return false;
    if(out.heroTitle)tpl.heroTitle=String(out.heroTitle);
    if(out.heroSubtitle)tpl.heroSubtitle=String(out.heroSubtitle);
    if(out.palette)tpl.palette=Object.assign({},tpl.palette,{
      accent:out.palette.accent||(tpl.palette||{}).accent,
      accent2:out.palette.accent2||(tpl.palette||{}).accent2});
    if(Array.isArray(out.sections)&&out.sections.length){
      tpl.components=out.sections.map(function(x){return String(x.name||'')});
      tpl.sectionCopy=out.sections.map(function(x){return String(x.copy||'')});
      // typed blocks are positional, so keep the arrays the same length
      if(Array.isArray(tpl.sections)){
        tpl.sections=tpl.sections.slice(0,tpl.components.length);
        while(tpl.sections.length<tpl.components.length)tpl.sections.push(null);
      }
    }
    renderPreset(tpl);return true;
  }
  function buildDock(pv){
    if(pv.querySelector('.pv-dock'))return;
    const tpl=window.__presetTpl||{};
    const dock=document.createElement('div');
    dock.className='pv-dock';
    dock.innerHTML='<p class="hint">Ask for anything — "make the headline read Meridian Survey", '
      +'"switch the palette to warm amber", "rewrite the intro for a climate startup". '
      +'The change applies to this preview.</p>'
      +'<div class="pv-chips">'+PRESET_CHIPS.map(function(c){
        return '<button type="button">'+c+'</button>'}).join('')+'</div>'
      +'<textarea placeholder="Describe a change — copy, colours, sections..."></textarea>'
      +'<div class="row"><span class="msg"></span>'
      +'<button type="button" class="apply">Apply change</button></div>';
    pv.appendChild(dock);
    const ta=dock.querySelector('textarea'),msg=dock.querySelector('.msg'),go=dock.querySelector('.apply');
    dock.querySelectorAll('.pv-chips button').forEach(function(b){
      b.addEventListener('click',function(){ta.value=b.textContent;ta.focus()})});
    go.addEventListener('click',async function(){
      const instruction=(ta.value||'').trim();
      if(!instruction){msg.textContent='Describe the change first.';return}
      if(!state.auth){
        // carry it through sign-up; resumeRoute turns it into the brief
        state.presetEdit={template:tpl.name,instruction};saveState();
        navigate('auth');return;
      }
      go.disabled=true;msg.textContent='Applying…';
      try{
        const out=await aiEditPreset(window.__presetTpl,instruction);
        if(mergePresetEdit(out)){toast('Change applied')}
        else{msg.textContent='Could not apply that — try describing it differently.'}
      }catch(e){msg.textContent='That did not go through. Try again.'}
      go.disabled=false;
    });
  }
  // Background media, editable after the fact: replace it, regenerate it from
  // the current brief, or drop it entirely.
  // The canvas has to show the same background the published page will, or the
  // studio quietly lies about what was set.
  function decorateCanvasMedia(){
    const hero=document.querySelector('.canvas-device .site-hero');
    if(!hero)return;
    const wantImg=state.heroImage||'',wantVid=state.heroVideo||'';
    const stamp=wantImg+'|'+wantVid;
    if(hero.dataset.mediaStamp===stamp)return;
    hero.dataset.mediaStamp=stamp;
    hero.querySelectorAll(':scope > .cv-media,:scope > .cv-media-veil').forEach(n=>n.remove());
    if(!wantImg&&!wantVid)return;
    const frag=document.createDocumentFragment();
    if(wantImg){
      const im=document.createElement('img');
      im.className='cv-media cv-media-img';im.src=wantImg;im.alt='';im.setAttribute('aria-hidden','true');
      frag.appendChild(im);
    }
    if(wantVid){
      const v=document.createElement('video');
      v.className='cv-media cv-media-vid';v.src=wantVid;
      v.muted=true;v.loop=true;v.playsInline=true;v.autoplay=true;v.preload='auto';
      v.setAttribute('aria-hidden','true');
      frag.appendChild(v);
      setTimeout(()=>{const p=v.play();if(p&&p.catch)p.catch(()=>{})},0);
    }
    const veil=document.createElement('div');veil.className='cv-media-veil';
    frag.appendChild(veil);
    hero.insertBefore(frag,hero.firstChild);
    hero.classList.add('has-media');
  }
  window.__decorateCanvasMedia=decorateCanvasMedia;
  window.__renderAgentMedia=function(h){return renderAgentMedia(h)};

  function renderAgentMedia(host){
    if(!host)return;
    const hasImg=!!state.heroImageAssetId,hasVid=!!state.heroVideoAssetId;
    host.innerHTML=
      '<div class="agent-media-head"><span>BACKGROUND</span>'
        +'<span class="tiny muted">'+(hasVid?'Video':hasImg?'Image':'None yet')+'</span></div>'
      +'<div class="agent-media-row">'
      +(hasImg?'<figure><img src="'+escV(state.heroImage)+'" alt=""/><figcaption>Image</figcaption></figure>':'')
      +(hasVid?'<figure><video src="'+escV(state.heroVideo)+'#t=0.1" muted playsinline autoplay loop preload="auto"></video><figcaption>Video</figcaption></figure>':'')
      +(!hasImg&&!hasVid?'<span class="tiny muted">Generate one below, or pick a result in AI Studio.</span>':'')
      +'</div>'
      +'<div class="agent-media-acts">'
        +'<button type="button" data-m="make">'+(hasImg?'Regenerate':'Generate')+' background</button>'
        +(hasImg&&!hasVid?'<button type="button" data-m="animate">Animate into video</button>':'')
        +(hasImg||hasVid?'<button type="button" data-m="clear">Remove</button>':'')
      +'</div><div class="agent-media-msg tiny muted"></div>';
    const note=host.querySelector('.agent-media-msg');
    const say=function(m){note.textContent=m||''};
    host.querySelectorAll('.agent-media-acts button').forEach(function(b){
      b.addEventListener('click',async function(){
        const mode=b.dataset.m;
        if(mode==='clear'){
          state.heroImage='';state.heroImageAssetId='';
          state.heroVideo='';state.heroVideoAssetId='';
          saveState();renderAgentMedia(host);toast('Background removed — publish to update the live site');return;
        }
        host.querySelectorAll('button').forEach(function(x){x.disabled=true});
        try{
          if(mode==='make'){
            state.heroImage='';state.heroImageAssetId='';
            state.heroVideo='';state.heroVideoAssetId='';
            await buildHeroMedia(say);
          }else{
            // keep the existing still, just animate it
            const job=await api('/api/video/from-asset',{method:'POST',body:JSON.stringify({
              assetId:state.heroImageAssetId,prompt:'Slow cinematic push in. Gentle natural light. No text.',
              aspectRatio:'16:9',seconds:HERO_VIDEO_SECONDS,resolution:HERO_VIDEO_RES})});
            let status=job.status;
            for(let i=0;i<90&&status!=='completed'&&status!=='failed';i++){
              await new Promise(function(r){setTimeout(r,5000)});
              try{const st=await api('/api/video/jobs/'+encodeURIComponent(job.id));
                status=st.status;say('Rendering — '+Math.round(pct(st.progress))+'%')}catch(e){}
            }
            if(status==='completed'){
              const stored=await api('/api/video/jobs/'+encodeURIComponent(job.id)+'/store',{method:'POST'});
              if(stored&&stored.assetId){state.heroVideo=stored.url;state.heroVideoAssetId=stored.assetId;saveState()}
            }else say('The render did not finish — the image is still in place.');
          }
          await loadCredits(true);
        }catch(e){say(String(e&&e.message||e).slice(0,120))}
        host.querySelectorAll('button').forEach(function(x){x.disabled=false});
        renderAgentMedia(host);
      });
    });
  }
  function buildDockToggle(pv){
    const bar=pv.querySelector('.pv-bar');
    if(!bar||bar.querySelector('.pv-customize'))return;
    const b=document.createElement('button');
    b.type='button';b.className='btn ghost pv-customize';b.textContent='Customize';
    bar.insertBefore(b,bar.querySelector('.btn.primary')||null);
    b.addEventListener('click',function(){
      const d=pv.querySelector('.pv-dock');if(!d)return;
      d.classList.toggle('on');
      if(d.classList.contains('on'))d.querySelector('textarea').focus();
    });
  }
  function buildSectionScenes(pv){
    var secs=pv.querySelectorAll('.pv-sec');
    for(var i=0;i<secs.length;i++){
      if(secs[i].querySelector('.pv-secfx'))continue;
      var fx=document.createElement('div');
      fx.className='pv-secfx';fx.setAttribute('aria-hidden','true');
      fx.innerHTML='<div class="halo"></div><div class="band b3"></div>'+
        '<div class="band b2"></div><div class="band"></div>';
      secs[i].insertBefore(fx,secs[i].firstChild);
    }
  }
  var ticking=false;
  function paint(){
    ticking=false;
    var pv=showing();if(!pv)return;
    var hero=pv.querySelector('.pv-hero');
    if(hero){
      // 0 at rest, 1 once the hero has been scrolled fully past
      var h=hero.offsetHeight||1;
      hero.style.setProperty('--p',Math.max(0,Math.min(1,window.scrollY/h)).toFixed(4));
    }
    // Each chapter carries its own 0..1: 0 as it enters from below, 1 as it leaves.
    var secs=pv.querySelectorAll('.pv-sec'),vh=window.innerHeight;
    for(var i=0;i<secs.length;i++){
      var r=secs[i].getBoundingClientRect();
      var span=(r.height+vh)||1;
      var p=Math.max(0,Math.min(1,(vh-r.top)/span));
      secs[i].style.setProperty('--p',p.toFixed(4));
      scrub(secs[i],p);
    }
  }
  function onScroll(){if(!ticking){ticking=true;requestAnimationFrame(paint)}}

  // ---- per-word heading reveal -------------------------------------------
  function split(el){
    if(el.dataset.split==='1')return;
    var text=el.textContent.replace(/\s+/g,' ').trim();
    if(!text||text.length>140)return;
    var words=text.split(' ');
    el.textContent='';
    words.forEach(function(w,i){
      var outer=document.createElement('span');
      outer.className='pv-split';outer.style.setProperty('--i',i);
      var inner=document.createElement('span');
      inner.textContent=w;
      outer.appendChild(inner);
      el.appendChild(outer);
      if(i<words.length-1)el.appendChild(document.createTextNode(' '));
    });
    el.dataset.split='1';
  }
  function revealIn(el){
    el.querySelectorAll('.pv-split').forEach(function(s){s.classList.add('on')});
  }

  // ---- wheel-driven smooth scroll -----------------------------------------
  var target=0,current=0,running=false,smoothing=false;
  function lerp(){
    if(!smoothing)return;
    current+=(target-current)*0.11;
    if(Math.abs(target-current)<0.4){current=target;running=false}
    else{running=true}
    window.scrollTo(0,current);
    if(running)requestAnimationFrame(lerp);
  }
  function onWheel(e){
    if(!smoothing||!showing())return;
    if(e.ctrlKey)return;                       // pinch-zoom must still work
    e.preventDefault();
    var max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
    target=Math.max(0,Math.min(max,target+e.deltaY));
    if(!running){running=true;requestAnimationFrame(lerp)}
  }
  function syncTarget(){if(!running)target=current=window.scrollY}

  function start(){
    var pv=showing();if(!pv)return;
    buildScene(pv);
    buildSectionScenes(pv);
    setupVideos(pv);
    buildDock(pv);
    buildDockToggle(pv);
    var heads=pv.querySelectorAll('.pv-hero h1, .pv-sec h2');
    heads.forEach(split);
    // Reveal by geometry rather than IntersectionObserver: IO and rAF are both
    // withheld while a tab is hidden, which would leave a heading permanently
    // invisible. Scroll still drives it, and a timer guarantees a final state.
    function sweep(){
      for(var i=0;i<heads.length;i++){
        var r=heads[i].getBoundingClientRect();
        if(r.top<window.innerHeight*0.9&&r.bottom>0)revealIn(heads[i]);
      }
    }
    window.addEventListener('scroll',function(){onScroll();sweep()},{passive:true});
    sweep();
    setTimeout(sweep,400);
    // last resort: nothing may stay hidden just because no event arrived
    setTimeout(function(){heads.forEach(revealIn)},1800);
    paint();
    // Native momentum already feels right on touch; only smooth the wheel.
    if(!reduce.matches&&!coarse.matches){
      smoothing=true;target=current=window.scrollY;
      window.addEventListener('wheel',onWheel,{passive:false});
      window.addEventListener('scroll',syncTarget,{passive:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(start,60)});
  else setTimeout(start,60);
  // preset pages are routed client-side, so pick the view up whenever it appears
  new MutationObserver(function(){if(showing()&&!document.querySelector('.pv-scene'))start()})
    .observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();
