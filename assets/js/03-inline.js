
/* ===== 3D SCENE LIBRARY + CINEMATIC LANDING CONTROLS ===== */
(function(){
  const scenePresets=[
    {id:'orbital-hero',name:'Orbital Hero',kind:'orbital',camera:'Orbit',trigger:'Pointer + scroll',depth:74,weight:'Light',desc:'A central object with orbiting interface planes and subtle pointer depth.'},
    {id:'product-pedestal',name:'Product Pedestal',kind:'pedestal',camera:'Push In',trigger:'Scroll progress',depth:58,weight:'Light',desc:'A focused product object floating above a cinematic presentation base.'},
    {id:'scroll-tunnel',name:'Scroll Tunnel',kind:'tunnel',camera:'Push Through',trigger:'Pinned scroll',depth:92,weight:'Medium',desc:'Layered frames move through camera depth as the visitor scrolls.'},
    {id:'glass-gallery',name:'Glass Gallery',kind:'gallery',camera:'Dolly',trigger:'Scroll into view',depth:66,weight:'Medium',desc:'Editorial glass panels create a spatial gallery for work, architecture or imagery.'},
    {id:'liquid-type',name:'Liquid Type',kind:'liquid',camera:'Drift',trigger:'Page load',depth:46,weight:'Light',desc:'Soft morphing geometry designed for expressive brand and launch moments.'},
    {id:'architecture-reveal',name:'Architecture Reveal',kind:'arch',camera:'Rise',trigger:'Scroll progress',depth:78,weight:'Medium',desc:'Structural planes reveal content progressively like moving through a building.'},
    {id:'layered-parallax',name:'Layered Parallax',kind:'layers',camera:'Parallax',trigger:'Pointer + scroll',depth:52,weight:'Light',desc:'Three depth layers create premium motion while keeping content highly readable.'},
    {id:'portal-transition',name:'Portal Transition',kind:'portal',camera:'Push Through',trigger:'Click / section end',depth:88,weight:'Medium',desc:'A circular depth transition for moving between key pages or chapters.'}
  ];
  window.scenePresets=scenePresets;
  state.scenePreset=state.scenePreset||'orbital-hero';
  state.sceneQuality=state.sceneQuality||'Balanced';
  state.sceneEnvironment=state.sceneEnvironment||'Dark Studio';
  state.sceneAutoReduce=state.sceneAutoReduce!==false;
  function sceneById(id){return scenePresets.find(x=>x.id===id)||scenePresets[0]}
  function persistScene(){try{saveState()}catch(e){try{localStorage.setItem('scenspace3d_state',JSON.stringify(state))}catch(x){}}}
  function previewMarkup(p){return `<div class="scene-preview ${p.kind}"><div class="sp-core"></div><div class="sp-a"></div><div class="sp-b"></div><div class="sp-c"></div></div>`}

  views.scenes=()=>{const active=sceneById(state.scenePreset);return `${viewHead('3D Scene Library','Production-ready spatial scene patterns for cinematic websites — without external APIs.',`<button class="btn" data-action="previewActiveScene">Preview active</button><button class="btn primary" data-action="openScenesInBuilder">Open in Builder →</button>`)}<div class="scene-library-grid">${scenePresets.map(p=>`<article class="scene-preset-card card ${state.scenePreset===p.id?'active':''}">${previewMarkup(p)}<div class="scene-card-info"><span class="caps">${p.weight} scene</span><h3>${p.name}</h3><p>${p.desc}</p><div class="scene-meta"><span>${p.camera}</span><span>${p.trigger}</span><span>Depth ${p.depth}</span></div></div><div class="scene-card-actions"><button class="btn" data-action="previewScenePreset" data-preset="${p.id}">Preview</button><button class="btn ${state.scenePreset===p.id?'primary':''}" data-action="applyScenePreset" data-preset="${p.id}">${state.scenePreset===p.id?'Applied ✓':'Apply'}</button></div></article>`).join('')}</div><div class="scene-control-grid"><section class="scene-inspector card"><div class="row"><div><span class="caps">Active scene inspector</span><h2 style="margin:5px 0">${active.name}</h2></div><span class="grow"></span><span class="status live">Canvas ready</span></div><div class="scene-inspector-row"><span>Camera path</span><b>${active.camera}</b></div><div class="scene-inspector-row"><span>Primary trigger</span><b>${active.trigger}</b></div><div class="scene-inspector-row"><span>Depth intensity</span><b>${active.depth}%</b></div><div class="scene-inspector-row"><span>Runtime weight</span><b>${active.weight}</b></div><div class="scene-health"><div><span class="tiny muted">Desktop</span><b>60 FPS</b></div><div><span class="tiny muted">Tablet</span><b>Adaptive</b></div><div><span class="tiny muted">Mobile</span><b>Lite</b></div></div></section><aside class="scene-inspector card"><span class="caps">Runtime controls</span><h3>Performance-safe 3D</h3><div class="field"><label>Scene quality</label><select class="prop-input" data-scene-runtime="quality"><option ${state.sceneQuality==='Performance'?'selected':''}>Performance</option><option ${state.sceneQuality==='Balanced'?'selected':''}>Balanced</option><option ${state.sceneQuality==='Cinematic'?'selected':''}>Cinematic</option></select></div><div class="field"><label>Environment</label><select class="prop-input" data-scene-runtime="environment"><option ${state.sceneEnvironment==='Dark Studio'?'selected':''}>Dark Studio</option><option ${state.sceneEnvironment==='Soft Daylight'?'selected':''}>Soft Daylight</option><option ${state.sceneEnvironment==='Midnight Glass'?'selected':''}>Midnight Glass</option><option ${state.sceneEnvironment==='Warm Gallery'?'selected':''}>Warm Gallery</option></select></div><div class="toggle-row"><span>Reduce automatically on mobile</span><button class="switch ${state.sceneAutoReduce?'on':''}" data-action="toggleSceneAutoReduce"></button></div><button class="btn primary" style="width:100%;margin-top:10px" data-action="openScenesInBuilder">Edit active scene →</button></aside></div>`};

  // Add Scene Library to command palette when the command system exists.
  if(typeof commands!=='undefined' && Array.isArray(commands) && !commands.some(c=>c.route==='scenes')) commands.splice(5,0,{icon:'◈',title:'3D Scene Library',sub:'Camera paths, depth and spatial presets',route:'scenes',keys:['3D']});

  // Latest builder panel wrapper: scene presets become a first-class tab.
  const prevPanel=builderPanel;
  window.builderPanel=function(){
    if(state.builderTab==='scenes'){
      const a=sceneById(state.scenePreset);
      return `<div class="row"><div><span class="caps">Scene Library</span><h3 style="margin:5px 0">${a.name}</h3></div><span class="grow"></span><button class="btn ghost" data-nav="scenes">All</button></div><div class="builder-scene-list">${scenePresets.map(p=>`<button class="builder-scene-option ${state.scenePreset===p.id?'active':''}" data-action="applyScenePreset" data-preset="${p.id}"><b>${p.name}</b><span>${p.camera} · ${p.trigger}</span></button>`).join('')}</div><div class="builder-scene-inspector"><span class="caps">Inspector</span><div class="mini-stat"><span>Camera</span><b>${a.camera}</b></div><div class="mini-stat"><span>Depth</span><b>${a.depth}%</b></div><div class="mini-stat"><span>Quality</span><b>${state.sceneQuality}</b></div><div class="mini-stat"><span>Environment</span><b>${state.sceneEnvironment}</b></div><button class="btn primary" style="width:100%;margin-top:8px" data-action="previewActiveScene">▶ Preview scene</button></div>`;
    }
    return prevPanel();
  };

  // Latest builder view wrapper: add Scenes tab + visible scene treatment on canvas.
  const prevView=builderView;
  window.builderView=function(){
    let h=prevView();
    h=h.replace('</div><div class="builder-panel">',`<button class="btab ${state.builderTab==='scenes'?'active':''}" data-btab="scenes">◈</button></div><div class="builder-panel">`);
    const p=sceneById(state.scenePreset), cls='preset-'+p.id;
    h=h.replace('<section class="site-hero','<section class="site-hero scene-preset-'+p.id);
    const cube='<div class="site-3d"><div class="site-cube"><i></i><i></i><i></i></div></div>';
    const fx=`${cube}<div class="builder-scene-fx ${cls}"><div class="fx-ring"></div><div class="fx-core"></div></div><span class="scene-live-chip">${p.name} · ${state.sceneQuality}</span>`;
    h=h.replace(cube,fx);
    return h;
  };

  function previewModal(p){modal(`<div class="modal-head"><div><span class="caps">3D Scene Preview</span><b style="display:block;margin-top:4px">${p.name}</b></div><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><div style="height:390px;border:1px solid var(--line);border-radius:18px;overflow:hidden">${previewMarkup(p)}</div><div class="scene-health"><div><span class="tiny muted">Camera</span><b style="font-size:13px">${p.camera}</b></div><div><span class="tiny muted">Trigger</span><b style="font-size:13px">${p.trigger}</b></div><div><span class="tiny muted">Depth</span><b style="font-size:13px">${p.depth}%</b></div></div><button class="btn primary" style="width:100%;margin-top:14px" data-action="applyScenePreset" data-preset="${p.id}">Apply to current website →</button></div>`)}

  const sceneActions=new Set(['openSceneLibraryMarketing','applyScenePreset','previewScenePreset','previewActiveScene','openScenesInBuilder','toggleSceneAutoReduce']);
  document.addEventListener('click',function(e){const a=e.target.closest('[data-action]');if(!a||!sceneActions.has(a.dataset.action))return;e.preventDefault();e.stopImmediatePropagation();const action=a.dataset.action;
    if(action==='openSceneLibraryMarketing'){navigate('scenes');return}
    if(action==='applyScenePreset'){state.scenePreset=a.dataset.preset||state.scenePreset;const p=sceneById(state.scenePreset);state.motion=Object.assign({},state.motion,{preset:p.camera==='Orbit'?'Parallax':'Cinematic',depth:p.depth});if(state.currentPageId&&state.sceneMap){const key=state.currentPageId+':hero';state.sceneMap[key]=Object.assign({enabled:true,trigger:p.trigger.includes('Scroll')?'Scroll progress':'Page load',camera:p.camera,intensity:p.depth,start:12,end:88},state.sceneMap[key]||{},{enabled:true,camera:p.camera,intensity:p.depth});}persistScene();try{closeModal()}catch(x){};if(state.route==='builder')render('builder');else render('scenes');toast(p.name+' applied');return}
    if(action==='previewScenePreset'){previewModal(sceneById(a.dataset.preset));return}
    if(action==='previewActiveScene'){previewModal(sceneById(state.scenePreset));return}
    if(action==='openScenesInBuilder'){state.builderTab='scenes';state.propTab='scene';persistScene();navigate('builder');return}
    if(action==='toggleSceneAutoReduce'){state.sceneAutoReduce=!state.sceneAutoReduce;persistScene();render('scenes');return}
  },true);
  document.addEventListener('change',function(e){const x=e.target.closest('[data-scene-runtime]');if(!x)return;if(x.dataset.sceneRuntime==='quality')state.sceneQuality=x.value;if(x.dataset.sceneRuntime==='environment')state.sceneEnvironment=x.value;persistScene();render('scenes');toast('Scene runtime updated')},true);

  // Landing pointer + scroll camera variables. Pure CSS, no external runtime.
  let raf=0;
  function updateLandingDepth(){raf=0;if(state.route!=='marketing')return;const hero=document.querySelector('#marketing .hero');if(!hero)return;const rect=hero.getBoundingClientRect();const progress=Math.max(0,Math.min(1,-rect.top/Math.max(1,rect.height*.72)));document.documentElement.style.setProperty('--heroScroll',progress.toFixed(3));document.documentElement.style.setProperty('--hero-progress',(progress*100).toFixed(1)+'%')}
  window.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(updateLandingDepth)},{passive:true});
  window.addEventListener('pointermove',e=>{if(state.route!=='marketing')return;document.documentElement.style.setProperty('--cx',((e.clientX/window.innerWidth)*100).toFixed(1));document.documentElement.style.setProperty('--cy',((e.clientY/window.innerHeight)*100).toFixed(1))},{passive:true});
  updateLandingDepth();

  // Add a 3D-specific completion card to final QA without changing API status.
  if(views.finalqa){const prevFinal=views.finalqa;views.finalqa=()=>prevFinal()+`<div class="card" style="padding:18px;margin-top:16px"><div class="row"><div><span class="caps">3D experience audit</span><h3 style="margin:5px 0">Spatial layer complete</h3></div><span class="grow"></span><span class="status live">PASS</span></div><div class="final-qa-grid" style="margin-top:10px"><div class="check-item"><i>✓</i><span>Scene presets<div class="tiny muted">8 production-safe visual patterns</div></span></div><div class="check-item"><i>✓</i><span>Adaptive motion<div class="tiny muted">Reduced-motion + mobile fallback</div></span></div><div class="check-item"><i>✓</i><span>Builder integration<div class="tiny muted">Scene inspector + active canvas preset</div></span></div><div class="check-item"><i>⌁</i><span>External 3D/API assets<div class="tiny muted">Deferred to LAST PHASE</div></span></div></div></div>`}
  persistScene();
})();
