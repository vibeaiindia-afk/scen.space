
const defaultState={route:'marketing',device:'desktop',builderTab:'ai',propTab:'design',prompt:'',category:'Business',generation:0,published:false,projectName:'Untitled World',selected:'hero',onboarded:false,onboardingStep:1,createMethod:'ai',heroTitle:'Your headline goes here.',heroSubtitle:'Add a short supporting line that introduces this page.',components:['Light','Material','Landscape'],versions:[],undoStack:[],redoStack:[],auth:null,pendingRoute:null,templateSections:null,templatePalette:null,userName:'',credits:null,workspaceName:'Studio Workspace',projects:[],domains:[],leads:[]};
let savedState={};try{savedState=JSON.parse(localStorage.getItem('scenspace3d_state')||'{}')}catch(e){}
const state=Object.assign(defaultState,savedState);
state.selected=state.selected||'hero';state.timelineOpen=!!state.timelineOpen;state.motion=Object.assign({preset:'Cinematic',duration:1.2,depth:42,parallax:18,keyframes:[8,42,78]},state.motion||{});state.templatePreview=state.templatePreview||'';state.dragIndex=null;state.sectionCopy=Array.isArray(state.sectionCopy)?state.sectionCopy:state.components.map(()=> 'A responsive, editable section with spatial depth and motion controls.');
function refreshIdentity(){const a=document.getElementById('userAvatar');if(a)a.textContent=(state.userName||'').trim().slice(0,1).toUpperCase()||'·';const c=document.getElementById('creditPill');if(c)c.textContent='● '+creditsLabel()+' credits'}
function greeting(){const h=new Date().getHours();const t=h<12?'Good morning':h<17?'Good afternoon':'Good evening';return state.userName?`${t}, ${state.userName}`:t}
function actorName(){return state.userName||'You'}
function creditsLabel(){return state.credits==null?'—':Number(state.credits).toLocaleString('en-IN')}
// Every project keeps its own site. Before this the whole builder shared one
// blob, so opening a second project showed the first one's content and media.
// pages/currentPageId/globalHeader/globalFooter belong here too: the sitemap
// and the brand are part of a site, and sharing them meant a second project
// inherited the first one's navigation.
const PROJECT_KEYS=['heroTitle','heroSubtitle','heroCtas','components','sectionCopy',
  'templateSections','templatePalette','scenePreset','motion',
  'heroImage','heroImageAssetId','heroVideo','heroVideoAssetId',
  'generation','published','publishedSlug','publishedUrl','prompt','category','selected',
  'pages','currentPageId','globalHeader','globalFooter','heroVisual'];
function captureProject(){const o={};PROJECT_KEYS.forEach(k=>{o[k]=state[k]});return o}
function stashProject(){
  if(!state.projectName)return;
  state.projectContent=state.projectContent||{};
  state.projectContent[state.projectName]=captureProject();
}
function openProjectNamed(name){
  if(!name||name===state.projectName)return;
  stashProject();                       // keep what is on screen before leaving
  const saved=(state.projectContent||{})[name];
  state.projectName=name;
  if(saved){PROJECT_KEYS.forEach(k=>{if(k in saved)state[k]=saved[k]})}
  else{
    // a project with no stored content starts clean rather than inheriting
    state.heroImage='';state.heroImageAssetId='';
    state.heroVideo='';state.heroVideoAssetId='';
    state.publishedUrl='';state.publishedSlug='';state.published=false;
    state.heroCtas=null;
    if(window.resetPages)window.resetPages();
  }
  saveState();
}
// Starting a project must not inherit the last one's site. Renaming first and
// saving would stash the old content under the new name, so reset in between.
function startNewProject(name){
  stashProject();
  state.projectName=name||'New Spatial Project';
  state.heroImage='';state.heroImageAssetId='';
  state.heroVideo='';state.heroVideoAssetId='';
  state.heroCtas=null;state.templateSections=null;state.templatePalette=null;state.heroVisual='';
  state.published=false;state.publishedUrl='';state.publishedSlug='';
  state.versions=[];state.undoStack=[];state.redoStack=[];
  state.generation=0;state.genMediaNote='';
  if(window.resetPages)window.resetPages();
  if(state.globalHeader)state.globalHeader.logo='YOUR BRAND';
}
function saveState(){try{stashProject();localStorage.setItem('scenspace3d_state',JSON.stringify(state))}catch(e){}}
function snapshot(){return {heroTitle:state.heroTitle,heroSubtitle:state.heroSubtitle,components:[...state.components],sectionCopy:[...(state.sectionCopy||[])],motion:JSON.parse(JSON.stringify(state.motion||{})),selected:state.selected}}
function recordUndo(){state.undoStack=state.undoStack||[];state.undoStack.push(snapshot());if(state.undoStack.length>20)state.undoStack.shift();state.redoStack=[]}
function makeVersion(label){state.versions=state.versions||[];state.versions.unshift({id:Date.now(),label,time:'Just now',snapshot:snapshot()});if(state.versions.length>12)state.versions.pop();saveState()}
function restoreSnap(x){if(!x)return;state.heroTitle=x.heroTitle;state.heroSubtitle=x.heroSubtitle;state.components=[...(x.components||[])];state.sectionCopy=[...(x.sectionCopy||[])];if(x.motion)state.motion=JSON.parse(JSON.stringify(x.motion));state.selected=x.selected||'hero';saveState()}

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('toast-show');clearTimeout(window._toast);window._toast=setTimeout(()=>t.classList.remove('toast-show'),2200)}
function setActiveNav(route){$$('.side-link').forEach(x=>x.classList.toggle('active',x.dataset.route===route))}
/* Renders a template as a complete standalone site at /preset/<name>.
   Public on purpose: it is the shop window for a template. */
function renderPreset(tpl){
  const pal=tpl.palette||{},E=v=>escV(v==null?'':v);
  const root=document.getElementById('presetView');
  root.style.setProperty('--pacc',pal.accent||'#dfff45');
  root.style.setProperty('--pacc2',pal.accent2||'#7beeff');
  const tele=(tpl.sections||[]).find(x=>x.kind==='metrics');
  const chips=(tele?.items||[]).slice(0,4).map(m=>`<span>${E(m.k)} · ${E(m.v)}</span>`).join('');
  const secs=(tpl.components||[]).map((name,i)=>{
    const copy=(tpl.sectionCopy||[])[i]||'';
    const block=presetBlock((tpl.sections||[])[i],pal);
    return `<section class="pv-sec"><div class="in pv-reveal">
      <div class="pv-num">${String(i+1).padStart(2,'0')} — ${E(String(name).toUpperCase())}</div>
      <h2>${E(name)}</h2><p class="lead">${E(copy)}</p>${block}</div></section>`;
  }).join('');
  root.innerHTML=`
    <div class="pv-hero">${tpl.heroImage?`<img class="pv-media pv-media-img" src="${E(tpl.heroImage)}" alt="" aria-hidden="true"/>`:''}${tpl.heroVideo?`<video class="pv-media pv-media-vid" src="${E(tpl.heroVideo)}" autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>`:''}${(tpl.heroImage||tpl.heroVideo)?'<div class="pv-media-veil"></div>':''}<div class="grid"></div><div class="in pv-reveal seen">
      <div class="pv-kick">${E(tpl.category)} · preset</div>
      <h1>${E(tpl.heroTitle)}</h1><p>${E(tpl.heroSubtitle)}</p>
      <div class="pv-tele">${chips}</div>
      ${(tpl.ctas||[]).slice(0,3).map((c,i)=>`<a class="pv-cta ${i?'alt':''}" href="#${i}">${E(c)}</a>`).join('')}
    </div></div>
    ${secs}
    <footer class="pv-foot">${E(tpl.name)} — a Scen preset. Every section is editable after you open it.</footer>
    <div class="pv-bar"><span class="c">${E(tpl.name)}</span><span class="n">${E(tpl.tag||tpl.category)}</span>
      <button class="btn primary" data-action="usePresetFromPreview" data-template="${E(tpl.name)}">Use this template →</button>
      <button class="btn ghost" data-nav="marketing">Close</button></div>`;
  // reveal on scroll
  const io='IntersectionObserver'in window?new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('seen');io.unobserve(x.target)}}),{threshold:.15}):null;
  root.querySelectorAll('.pv-reveal:not(.seen)').forEach(el=>io?io.observe(el):el.classList.add('seen'));
  setTimeout(()=>countUpMetrics(root),120);
}
function presetBlock(sec,pal){
  if(!sec||!sec.kind)return '';
  const saveS=state.templateSections,saveP=state.templatePalette;
  state.templateSections=[sec];state.templatePalette=pal;
  const html=templateBlock(0);
  state.templateSections=saveS;state.templatePalette=saveP;
  return html;
}
function presetFromPath(){
  const m=location.pathname.match(/^\/preset\/([a-z0-9-]+)\/?$/i);
  if(!m)return null;
  const slug=m[1].toLowerCase();
  return (typeof TEMPLATES!=='undefined'?TEMPLATES:[]).find(t=>t.name.toLowerCase()===slug)||null;
}
function showPreset(tpl){
  ['marketing','auth','appShell'].forEach(id=>document.getElementById(id)?.classList.add('hidden'));
  document.getElementById('presetView').classList.add('on');
  // Edits mutate this copy, never the shared TEMPLATES entry.
  window.__presetTpl=JSON.parse(JSON.stringify(tpl));
  renderPreset(window.__presetTpl);window.scrollTo(0,0);
}
// Where a signed-in visitor should land. A brief written on the marketing page
// wins over the dashboard, so the first thing they see is their own site building.
// --- real generation ------------------------------------------------------
// The progress steps used to be theatre over a local template. The brief now
// goes to the AI gateway, and whatever comes back becomes the site. If the
// model fails or is slow the template still loads, so the flow never dead-ends.
// --- one prompt, whole site -------------------------------------------------
// Copy is written first, then a hero still, then that still is animated into a
// short loop that becomes the background. Each step is optional: if the image
// or the video fails the site still ships, just without that layer.
// providers report progress as 0-100, not 0-1
function pct(p){const n=Number(p)||0;return n<=1?n*100:Math.min(100,n)}
const HERO_VIDEO_SECONDS=4, HERO_VIDEO_RES='720p';
function mediaCost(){return IMAGE_CREDITS_PER_OUTPUT+videoCredits(HERO_VIDEO_SECONDS,HERO_VIDEO_RES)}
function blobToBase64(blob){
  return new Promise(function(res,rej){
    const fr=new FileReader();
    fr.onload=function(){res(String(fr.result||'').split(',')[1]||'')};
    fr.onerror=rej;fr.readAsDataURL(blob);
  });
}
// The brief names the brand and the headline, and an image model handed that
// plus the words "for a website" will happily return a picture *of a website* —
// a mockup complete with its own nav bar, sitting inside the real one. So the
// subject is described on its own, and the page itself is ruled out explicitly.
function heroVisualPrompt(){
  const subject=String(state.heroVisual||'').trim()
    ||String(state.prompt||'').slice(0,180);
  return 'Photorealistic documentary photograph. '+subject
    +'. Wide establishing shot, natural light, shallow depth of field, cinematic colour. '
    +'It is a photograph of a real scene only: not a screenshot, not a web page, '
    +'not a poster or an advert, no user interface, no browser, no menus or buttons, '
    +'no text, no words, no letters, no logos, no watermark, no frame or border.';
}
async function buildHeroMedia(onStep){
  const step=onStep||function(){};
  let imageAssetId='';
  try{
    step('Generating the hero image…');
    const img=await api('/api/image/generate',{method:'POST',body:JSON.stringify({
      mode:'generate',prompt:heroVisualPrompt(),aspectRatio:'16:9',
      size:'1K',quality:'medium',format:'png',count:1})});
    const made=(img.images||[]).find(function(x){return x&&x.url});
    if(!made)throw new Error('no image');
    imageAssetId=assetIdFromUrl(made.url);
    state.heroImage=made.url;state.heroImageAssetId=imageAssetId;saveState();
  }catch(e){step('Image step skipped.');return {imageAssetId:'',videoAssetId:''}}

  try{
    step('Animating it into a background loop…');
    const job=await api('/api/video/from-asset',{method:'POST',body:JSON.stringify({
      assetId:imageAssetId,prompt:'Slow cinematic push in. Gentle natural light. No text.',
      aspectRatio:'16:9',seconds:HERO_VIDEO_SECONDS,resolution:HERO_VIDEO_RES})});
    // renders take minutes, so poll rather than block on one request
    let status=job.status;
    for(let i=0;i<90&&status!=='completed'&&status!=='failed';i++){
      await new Promise(function(r){setTimeout(r,5000)});
      try{
        const st=await api('/api/video/jobs/'+encodeURIComponent(job.id));
        status=st.status;
        step('Rendering the background — '+Math.round(pct(st.progress))+'%');
      }catch(e){}
    }
    if(status!=='completed')throw new Error('video not ready');
    const stored=await api('/api/video/jobs/'+encodeURIComponent(job.id)+'/store',{method:'POST'});
    if(!stored||!stored.assetId)throw new Error('video not stored');
    state.heroVideo=stored.url;state.heroVideoAssetId=stored.assetId;saveState();
    step('Background ready.');
    return {imageAssetId,videoAssetId};
  }catch(e){
    step('Kept the still image as the background.');
    return {imageAssetId,videoAssetId:''};
  }
}
let aiSitePromise=null;
function parseModelJson(raw){
  let t=String(raw||'').trim();
  t=t.replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();
  const a=t.indexOf('{'),b=t.lastIndexOf('}');
  if(a<0||b<=a)return null;
  try{return JSON.parse(t.slice(a,b+1))}catch(e){return null}
}
async function aiGenerateSite(){
  const brief=String(state.prompt||'').trim();
  if(!brief)return null;
  // The scene menu is built from the live preset list so it cannot drift.
  const scenes=(window.scenePresets||[]).map(p=>`${p.id} — ${p.desc}`).join('\n');
  const system='You write website copy and pick a 3D scene. Reply with JSON only — no prose, no code fence. '
    +'Shape: {"brandName":string,"heroTitle":string,"heroSubtitle":string,"scene":string,'
    +'"ctas":[string],"nav":[string],"heroVisual":string,'
    +'"sections":[{"name":string,"copy":string}]}. '
    +'"brandName" is the business name as it would appear as a logo. '
    +'"heroVisual" describes the photograph that belongs behind the headline — '
    +'subject, setting, light, camera angle, in one sentence. Describe the real '
    +'scene only, never a web page, screenshot, poster, interface or any text.\n'
    +'"nav" is 3 to 5 navigation labels this site would really have — for a fighter '
    +'site that is Fighters, Events, Media, Shop, not Home, Project, Gallery.\n'
    +'Every section also gets a "block" — the layout that suits its content. '
    +'Use exactly one of these shapes, and pick the one a real designer would:\n'
    +'{"kind":"metrics","items":[{"k":"Label","v":"12","sub":"note"}]} for numbers\n'
    +'{"kind":"table","cols":["A","B"],"rows":[["1","2"]]} for records and fixtures\n'
    +'{"kind":"timeline","steps":[{"when":"2019","title":"T","copy":"one sentence"}]} for history\n'
    +'{"kind":"gallery","tiles":["Caption one","Caption two"]} for visual work\n'
    +'{"kind":"scroller","cards":[{"label":"L","title":"T","copy":"one sentence"}]} for a set of items\n'
    +'{"kind":"split","bullets":["point one","point two"]} for how it works\n'
    +'{"kind":"quote","quote":"...","attr":"Name, role"} for a testimonial\n'
    +'{"kind":"faq","items":[{"q":"...","a":"..."}]} for questions\n'
    +'{"kind":"pricing","plans":[{"name":"P","amt":"999","per":"month","items":["x"]}]} for plans\n'
    +'{"kind":"logos","names":["ONE","TWO"]} for partners\n'
    +'Put it on each section as "block", filled with real content from the brief, '
    +'3 to 5 entries each. '
    +'"ctas" is 1-2 button labels in the business\'s own words — "Book a table", '
    +'"Get tickets" — never "Explore experience" or "Learn more". '
    +'Give 4 to 6 sections. heroTitle under 60 characters, concrete, no marketing cliche. '
    +'section name is 1-2 words. copy is one sentence. Plain text only.\n'
    +'"scene" must be exactly one id from this list, chosen to suit the business:\n'+scenes;
  const input=`Brief: ${brief}\nCategory: ${state.category||'Business'}`;
  const d=await api('/api/ai/generate',{method:'POST',body:JSON.stringify({
    feature:'planning',system,input,temperature:0.8,maxOutputTokens:2600})});
  const out=parseModelJson(d&&d.text);
  if(!out||!out.heroTitle||!Array.isArray(out.sections)||!out.sections.length)return null;
  return out;
}
// A malformed block renders as an empty box, so each is checked against the
// shape its kind actually needs before it is accepted.
const BLOCK_SHAPES={
  metrics:b=>Array.isArray(b.items)&&b.items.length&&b.items.every(x=>x&&x.k!=null&&x.v!=null),
  table:b=>Array.isArray(b.cols)&&b.cols.length&&Array.isArray(b.rows)&&b.rows.length
        &&b.rows.every(r=>Array.isArray(r)&&r.length===b.cols.length),
  timeline:b=>Array.isArray(b.steps)&&b.steps.length&&b.steps.every(x=>x&&x.title),
  gallery:b=>Array.isArray(b.tiles)&&b.tiles.length,
  scroller:b=>Array.isArray(b.cards)&&b.cards.length&&b.cards.every(x=>x&&x.title),
  split:b=>Array.isArray(b.bullets)&&b.bullets.length,
  quote:b=>typeof b.quote==='string'&&b.quote.length>4,
  faq:b=>Array.isArray(b.items)&&b.items.length&&b.items.every(x=>x&&x.q&&x.a),
  pricing:b=>Array.isArray(b.plans)&&b.plans.length&&b.plans.every(x=>x&&x.name&&x.amt),
  logos:b=>Array.isArray(b.names)&&b.names.length
};
function validBlock(block,eyebrow){
  if(!block||typeof block!=='object')return null;
  const check=BLOCK_SHAPES[block.kind];
  if(!check)return null;
  try{if(!check(block))return null}catch(e){return null}
  return Object.assign({},block,{eyebrow:eyebrow||block.eyebrow||''});
}
// Templates carry their own brand and navigation too. Without this a
// template-started site still said YOUR BRAND / Home / Project / Gallery.
function applyShellFromTemplate(tpl){
  if(!tpl)return;
  const name=String(tpl.name||'').trim();
  if(state.globalHeader){
    if(name)state.globalHeader.logo=name.toUpperCase().slice(0,28);
    state.globalHeader.cta=(tpl.ctas&&tpl.ctas[0])||'Get in touch';
  }
  const secs=(tpl.components||[]).slice(0,5).map(function(n,i){
    return {name:String(n).slice(0,20),copy:String((tpl.sectionCopy||[])[i]||'').slice(0,200)};
  });
  if(secs.length&&window.applyPagesFromSections){
    window.applyPagesFromSections(secs,{cta:(tpl.ctas&&tpl.ctas[0])||''});
  }
  if(state.globalFooter&&tpl.tag)state.globalFooter.tagline=String(tpl.tag).slice(0,120);
  if(tpl.ctas&&tpl.ctas.length)state.heroCtas=tpl.ctas.slice(0,3);
}
function applyAiSite(d){
  if(Array.isArray(d.ctas)&&d.ctas.length){
    state.heroCtas=d.ctas.filter(Boolean).map(c=>String(c).slice(0,40)).slice(0,3);
  }
  // The shell has to belong to the business too — a generic nav made every
  // generated site read as the same template with different words.
  if(state.globalHeader){
    if(d.brandName)state.globalHeader.logo=String(d.brandName).slice(0,28);
    if(Array.isArray(d.ctas)&&d.ctas[0])state.globalHeader.cta=String(d.ctas[0]).slice(0,24);
  }
  if(Array.isArray(d.nav)&&d.nav.length&&Array.isArray(state.pages)){
    const labels=d.nav.filter(Boolean).map(x=>String(x).slice(0,20)).slice(0,5);
    labels.forEach(function(name,i){
      if(state.pages[i]){
        state.pages[i].name=name;
        state.pages[i].slug=i===0?'/':'/'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
      }
    });
    if(state.pages.length>labels.length)state.pages=state.pages.slice(0,labels.length);
    // renaming alone left the sample property copy underneath every nav link
    if(window.applyPagesFromSections){
      const subs=labels.slice(1).map(function(name,i){
        const match=(d.sections||[]).find(s=>s&&String(s.name||'').toLowerCase()===name.toLowerCase());
        return {name,copy:(match&&match.copy)||((d.sections||[])[i+1]||{}).copy||''};
      });
      window.applyPagesFromSections(subs,{cta:(d.ctas||[])[0]});
    }
  }
  if(state.globalFooter&&d.heroSubtitle)state.globalFooter.tagline=String(d.heroSubtitle).slice(0,120);
  // Mirror what applyScenePreset does to state, but not its render: that handler
  // ends by rendering the Scene Library, which would tear down the generation
  // view mid-flow. Keep these two in step if the handler ever changes.
  const sc=(window.scenePresets||[]).find(p=>p.id===String(d.scene||''));
  if(sc){
    state.scenePreset=sc.id;
    state.motion=Object.assign({},state.motion,
      {preset:sc.camera==='Orbit'?'Parallax':'Cinematic',depth:sc.depth});
    if(state.currentPageId&&state.sceneMap){
      const key=state.currentPageId+':hero';
      state.sceneMap[key]=Object.assign(
        {enabled:true,trigger:String(sc.trigger||'').includes('Scroll')?'Scroll progress':'Page load',
         camera:sc.camera,intensity:sc.depth,start:12,end:88},
        state.sceneMap[key]||{},
        {enabled:true,camera:sc.camera,intensity:sc.depth});
    }
    try{persistScene()}catch(e){}
  }
  state.heroTitle=String(d.heroTitle).slice(0,90);
  if(d.heroSubtitle)state.heroSubtitle=String(d.heroSubtitle).slice(0,180);
  if(d.heroVisual)state.heroVisual=String(d.heroVisual).slice(0,240);
  const secs=d.sections.filter(x=>x&&x.name).slice(0,6);
  if(secs.length){
    state.components=secs.map(x=>String(x.name).slice(0,28));
    state.sectionCopy=secs.map(x=>String(x.copy||'').slice(0,200));
    const blocks=secs.map(x=>validBlock(x.block,x.name));
    // positional array; a rejected block just renders as plain copy
    state.templateSections=blocks.some(Boolean)?blocks:null;
  }
  state.selected='hero';saveState();
}
// Editing the open site with the model. This used to be keyword matching that
// pasted the user's own words into the subtitle when nothing matched.
async function aiEditCurrentSite(instruction,btn){
  const scenes=(window.scenePresets||[]).map(p=>`${p.id} — ${p.desc}`).join('\n');
  const current={
    heroTitle:state.heroTitle,heroSubtitle:state.heroSubtitle,
    scene:state.scenePreset,
    palette:state.templatePalette||{},
    ctas:state.heroCtas||[],
    sections:(state.components||[]).map((n,i)=>({name:n,copy:(state.sectionCopy||[])[i]||''}))
  };
  const system='You edit an existing website. Reply with JSON only — no prose, no code fence. '
    +'Return the same shape you are given, with only the requested change applied. '
    +'Keep every field present. Keep the section count unless asked to add or remove one. '
    +'palette.accent and palette.accent2 are hex colours.\n'
    +'"ctas" is 1-3 button labels, short and in the site\'s voice.\n'
    +'"scene" must stay one of these ids:\n'+scenes;
  const input='Current site:\n'+JSON.stringify(current)+'\n\nChange requested: '+instruction;
  const label=btn?btn.textContent:'';
  if(btn){btn.disabled=true;btn.textContent='Applying…'}
  try{
    const d=await api('/api/ai/generate',{method:'POST',body:JSON.stringify({
      feature:'planning',system,input,temperature:0.6,maxOutputTokens:1200})});
    const out=parseModelJson(d&&d.text);
    if(!out||!out.heroTitle){toast('Could not apply that — try describing it differently');return}
    recordUndo();
    state.heroTitle=String(out.heroTitle).slice(0,90);
    if(out.heroSubtitle)state.heroSubtitle=String(out.heroSubtitle).slice(0,180);
    if(out.palette)state.templatePalette=Object.assign({},state.templatePalette,{
      accent:out.palette.accent||(state.templatePalette||{}).accent,
      accent2:out.palette.accent2||(state.templatePalette||{}).accent2});
    if(Array.isArray(out.sections)&&out.sections.length){
      state.components=out.sections.map(x=>String(x.name||'').slice(0,28));
      state.sectionCopy=out.sections.map(x=>String(x.copy||'').slice(0,200));
      if(Array.isArray(state.templateSections)){
        state.templateSections=state.templateSections.slice(0,state.components.length);
        while(state.templateSections.length<state.components.length)state.templateSections.push(null);
      }
    }
    if(Array.isArray(out.ctas)&&out.ctas.length){
      state.heroCtas=out.ctas.filter(Boolean).map(c=>String(c).slice(0,40)).slice(0,3);
    }
    const sc=(window.scenePresets||[]).find(p=>p.id===String(out.scene||''));
    if(sc&&sc.id!==state.scenePreset){
      state.scenePreset=sc.id;
      state.motion=Object.assign({},state.motion,
        {preset:sc.camera==='Orbit'?'Parallax':'Cinematic',depth:sc.depth});
      try{persistScene()}catch(e){}
    }
    makeVersion('AI edit · '+instruction.slice(0,32));
    saveState();render('builder');
    toast('Edit applied — undo if it is not right');
  }catch(e){
    toast('That did not go through. Try again.');
  }finally{
    const b=document.querySelector('[data-action="aiEdit"]');
    if(b){b.disabled=false;b.textContent=label||'Apply edit →'}
  }
}
let autoGenTimer=null;
async function autoGenerate(){
  clearTimeout(autoGenTimer);
  if(state.route!=='generation')return;
  if(!document.querySelector('[data-action="runGeneration"]'))return;
  if(state.generation>=7){
    // the last click opens the builder, so settle the model call first
    let data=null;
    try{data=await Promise.race([aiSitePromise,new Promise(r=>setTimeout(()=>r('timeout'),45000))])}
    catch(e){data=null}
    if(data==='timeout'){toast('Generation is taking a while — opening the editable draft')}
    else if(data)applyAiSite(data);
    else toast('Wrote a starting draft you can edit');
    // Copy is done; now the visuals. Whatever happens must be visible — a
    // silent skip here looked like the feature simply did not exist.
    const note=document.getElementById('genMediaNote');
    const say=function(m){if(note)note.textContent=m;state.genMediaNote=m};
    if(state.heroVideoAssetId){
      say('Kept the background already on this project.');
    }else if(state.credits!=null&&state.credits<mediaCost()){
      say('Skipped the image and video — needs '+mediaCost()+' credits, you have '+state.credits+'.');
      toast('Not enough credits for the background — site built without it');
    }else{
      say('Generating the hero image…');
      await buildHeroMedia(say);
      await loadCredits(true);
      if(state.heroVideoAssetId)say('Background video ready.');
      else if(state.heroImageAssetId)say('Background image ready (video step did not finish).');
      else say('Could not generate the background — the site is still ready to edit.');
    }
    saveState();
    const b=document.querySelector('[data-action="runGeneration"]');
    if(b)b.click();
    return;
  }
  document.querySelector('[data-action="runGeneration"]').click();
  if(state.route==='generation')autoGenTimer=setTimeout(autoGenerate,620);
}
// The studio opens on the site if one exists, otherwise on the brief that
// creates one — landing on an empty canvas teaches nothing.
function agentRoute(){
  state.builderTab='ai';state.agentMode=true;saveState();
  return (state.generation>=7)?'builder':'create';
}
function resumeRoute(){
  if(state.agentEntry){state.agentEntry=false;saveState();return agentRoute()}
  // A change described on a preset page becomes the brief for that template.
  if(state.presetEdit&&state.presetEdit.template){
    const t=templateByName(state.presetEdit.template);
    if(t){
      state.templateSections=t.sections||null;state.templatePalette=t.palette||null;
      state.heroTitle=t.heroTitle;state.heroSubtitle=t.heroSubtitle;
      state.components=t.components;state.sectionCopy=t.sectionCopy;
      state.projectName=t.name+' Project';
    }
    state.prompt=state.presetEdit.instruction||state.prompt;
    state.presetEdit=null;state.generation=0;saveState();
    return 'generation';
  }
  if(state.heroBrief){state.heroBrief=false;saveState();return 'plan'}
  return state.onboarded?'dashboard':'onboarding';
}
// Each footer/legal document gets its own address instead of collapsing into
// one /legal route with client-only tab state. Keys are the public route name,
// values are the matching key in legalDocs (defined further down).
// 'privacy' is already taken by the builder's own Cookie & Privacy Center
// (views.privacy, an internal project-settings panel) — the public policy
// page uses 'privacy-policy' instead so it doesn't clobber that view or make
// it reachable without a session.
const LEGAL_ROUTES={'privacy-policy':'privacy',terms:'terms',cookies:'cookies',refund:'refund',dpa:'dpa','report-abuse':'acceptable'};
// The homepage sections already have real ids that match these route names —
// landing on /pricing etc. directly shows the same marketing page, scrolled
// to the right section, with a matching tab title.
const MARKETING_SECTION_ROUTES={features:'Features',showcase:'Showcase',platform:'Platform',pricing:'Pricing',about:'About',changelog:'Changelog'};
const PUBLIC_ROUTES=new Set(['marketing','auth','legal','helpdocs','presets',...Object.keys(LEGAL_ROUTES),...Object.keys(MARKETING_SECTION_ROUTES)]);
function navigate(route){
  if(LEGAL_ROUTES[route])state.legalTab=LEGAL_ROUTES[route];
  // The app shell is the product. Anything outside the public routes needs a
  // real server session; remember where they were headed and send them to auth.
  if(!PUBLIC_ROUTES.has(route)&&!state.auth){state.pendingRoute=route;route='auth'}
  // Admin and build-process surfaces are staff-only. Hiding the sidebar link is
  // not enough — the route is reachable by URL, so block it here too.
  if(window.__ADMIN_ROUTES&&window.__ADMIN_ROUTES.has(route)&&!window.__isPlatformAdmin){route='dashboard'}
  // a phone-sized operator should not land in the desktop device frame
  if(route==='builder'&&window.matchMedia('(max-width:760px)').matches&&state.device==='desktop'){state.device='mobile'}
  document.body.classList.toggle('inbuilder',route==='builder');
  // projects made before the shell was generated still say YOUR BRAND;
  // fall back to the project's own name rather than leaving the placeholder
  if(route==='builder'&&state.globalHeader&&state.globalHeader.logo==='YOUR BRAND'&&state.projectName){
    state.globalHeader.logo=String(state.projectName).replace(/\s*Project$/i,'').toUpperCase().slice(0,28);
    saveState();
  }
  if(['dashboard','billing','plan'].includes(route))loadCredits();
  if(route==='studio'&&state.videoJob&&state.videoJob.status!=='completed'&&state.videoJob.status!=='failed')pollVideoJob();
  if(route!=='studio')stopVideoPoll();
  // The plan was approved, so run the build instead of asking for seven more
  // clicks. The button stays for anyone who wants to step through it.
  if(route==='generation'){
    // start the model call now so it runs while the progress steps play
    aiSitePromise=aiGenerateSite().catch(function(){return null});
    setTimeout(autoGenerate,600);
  }
  if(window.__applyAdminUI)window.__applyAdminUI();
  if(route!=='builder'){document.body.classList.remove('bpanel');document.body.classList.remove('rpanel');
    var _f=document.getElementById('mobProps');if(_f)_f.classList.remove('on');}
  const pv=document.getElementById('presetView');if(pv)pv.classList.remove('on');
  state.route=route;window.scrollTo(0,0);$('#marketing').classList.add('hidden');$('#auth').classList.add('hidden');$('#appShell').classList.add('hidden');if(route==='marketing'){$('#marketing').classList.remove('hidden');return}
  if(MARKETING_SECTION_ROUTES[route]){$('#marketing').classList.remove('hidden');const sec=document.getElementById(route);if(sec)sec.scrollIntoView({block:'start'});document.title=MARKETING_SECTION_ROUTES[route]+' — Scen';return}
  if(route==='auth'){$('#auth').classList.remove('hidden');return}$('#appShell').classList.remove('hidden');setActiveNav(route);render(route)}
function icon(n){return `<span class="icon">${n}</span>`}
function viewHead(title,sub,actions=''){return `<div class="view-head"><div><h1>${title}</h1><p>${sub}</p></div><div class="view-actions">${actions}</div></div>`}
function render(route){const m=$('#appMain');m.className='app-main';try{refreshIdentity()}catch(e){}setTimeout(()=>{try{countUpMetrics(m)}catch(e){}},30);if(route==='builder'){m.innerHTML=builderView();bindBuilder();return}m.innerHTML=`<div class="view">${views[route]?views[route]():views.dashboard()}</div>`;}
const projectCard=(name,status='Published',klass='')=>`<article class="project-card card ${klass}" data-action="openProject"><div class="project-thumb"></div><div class="project-meta"><b>${name}</b><div class="row"><span class="status ${status==='Published'?'live':'draft'}">${status}</span><span>Updated 12m</span></div></div></article>`;
const escV=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CIN_FIGMA="https://raft-blast-61784561.figma.site/_assets/v11/";
const CIN_PIN="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/";
const TEMPLATES=[
  {"name": "Velorah", "category": "Agency", "tag": "A four-person studio that says no a lot", "palette": {"accent": "#ff5a3c", "accent2": "#f4efe6"}, "heroTitle": "Four people. Six projects a year.", "heroSubtitle": "We take on what we can finish properly, publish what it cost, and hand over everything at the end.", "ctas": ["See the six", "Ask about a slot"], "components": ["Year", "Clients", "How it runs", "Rates", "Questions"], "sectionCopy": ["What last year actually looked like.", "Who trusted us with it.", "Three phases, one price, no surprises.", "What a project costs before you ask.", "The things people ask on the first call."], "sections": [{"kind": "metrics", "eyebrow": "Year", "items": [{"k": "Projects", "v": "6", "sub": "finished"}, {"k": "Turned down", "v": "31", "sub": "asked"}, {"k": "On date", "v": "6 of 6", "sub": "agreed up front"}, {"k": "Team", "v": "4", "sub": "no contractors"}]}, {"kind": "logos", "eyebrow": "Clients", "names": ["NORTHWIND", "KESTREL", "SABLE", "ORBIT", "VANE", "MERIDIAN"]}, {"kind": "timeline", "eyebrow": "How it runs", "steps": [{"when": "PHASE 01", "title": "Two weeks, paid", "copy": "We decide together whether the work is worth doing at all. You keep the notes either way."}, {"when": "PHASE 02", "title": "Six weeks, building", "copy": "Two of us on it full time. You see it every Friday, finished or not."}, {"when": "PHASE 03", "title": "One week, handover", "copy": "Files, access, and an hour on video. Then it is yours."}]}, {"kind": "pricing", "eyebrow": "Rates", "plans": [{"name": "Identity", "amt": "9,000", "per": "project", "items": ["Wordmark and type", "Colour and usage", "One page site"]}, {"name": "Site", "amt": "18,000", "per": "project", "items": ["Up to eight pages", "Copy written with you", "CMS you can actually use", "Six weeks"]}, {"name": "Both", "amt": "24,000", "per": "project", "items": ["Everything above", "One price", "Ten weeks", "A year of small fixes"]}]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "Why do you turn so much down?", "a": "Because six is what four people can finish without cutting corners."}, {"q": "Can you start next week?", "a": "Almost never. The next free slot is usually eight to ten weeks out."}, {"q": "Who owns the work?", "a": "You do, from the first invoice. Source files included."}, {"q": "What if it goes wrong?", "a": "We say so on the Friday it goes wrong, not at the end."}]}]},
  {"name": "Aetheris Voyage", "category": "Travel", "tag": "Six windows a year, twelve routes", "palette": {"accent": "#74b5e0", "accent2": "#f7e7c8"}, "heroTitle": "Where the light lands last", "heroSubtitle": "Slow routes through the high valleys, walked at the pace they were made for, booked in one conversation.", "ctas": ["Plan a route", "See the windows"], "components": ["Season", "Routes", "Guides", "What it costs", "Questions"], "sectionCopy": ["The weather decides, so we plan around it.", "Twelve routes, none of them rushed.", "Nine people who have walked every one.", "Everything included, nothing added later.", "Asked before almost every booking."], "sections": [{"kind": "metrics", "eyebrow": "Season", "items": [{"k": "Windows", "v": "6", "sub": "per year"}, {"k": "Routes", "v": "12", "sub": "live"}, {"k": "Group", "v": "8", "sub": "maximum"}, {"k": "Return", "v": "68%", "sub": "come back"}]}, {"kind": "table", "eyebrow": "Routes", "cols": ["Route", "Days", "Season", "Nights out", "Grade"], "rows": [["The Long Meadow", "4", "May, Sep", "1", "easy"], ["Saltmarsh Line", "6", "Jun, Aug", "3", "moderate"], ["High Corrie", "8", "Jul", "5", "hard"], ["Winter Traverse", "5", "Feb", "2", "hard"]]}, {"kind": "scroller", "eyebrow": "Guides", "cards": [{"label": "14 YEARS", "title": "Ines Marchetti", "copy": "Walked every route we sell, most of them in both directions."}, {"label": "9 YEARS", "title": "Tomas Berg", "copy": "Reads weather better than the forecast does, which is why we listen."}, {"label": "11 YEARS", "title": "Aiko Tanaka", "copy": "Runs the winter traverse and refuses to run it in bad light."}]}, {"kind": "split", "eyebrow": "What it costs", "bullets": ["One price, from the trailhead to the last night", "Food, huts and permits included", "No single supplement, ever", "Full refund if we move your dates"]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "How fit do I need to be?", "a": "Comfortable walking six hours with a day pack. We will tell you honestly if a route is wrong for you."}, {"q": "What if the weather turns?", "a": "We move you to another window at no cost. That is why there are six."}, {"q": "Can I come alone?", "a": "Most people do. Groups cap at eight."}]}]},
  {"name": "Securify", "category": "SaaS", "tag": "Security posture, in numbers you can act on", "palette": {"accent": "#5ee6a8", "accent2": "#7beeff"}, "heroTitle": "Know what is exposed. Today.", "heroSubtitle": "Continuous checks across your cloud, your code and your people, with a single number that only moves when something real changes.", "ctas": ["Start a free scan", "Book a walkthrough"], "components": ["Coverage", "What it checks", "Findings", "Plans", "Questions"], "sectionCopy": ["Connected in an afternoon, not a quarter.", "Four surfaces, one score.", "What a typical first week turns up.", "Priced per seat, not per finding.", "Asked in almost every security review."], "sections": [{"kind": "metrics", "eyebrow": "Coverage", "items": [{"k": "Setup", "v": "3h", "sub": "median"}, {"k": "Checks", "v": "1,240", "sub": "continuous"}, {"k": "Noise cut", "v": "71%", "sub": "vs raw alerts"}, {"k": "Teams", "v": "430", "sub": "using it"}]}, {"kind": "split", "eyebrow": "What it checks", "bullets": ["Cloud accounts, every region, every hour", "Dependencies and the licences that come with them", "Secrets in code, history included", "Access that outlived the person who needed it"]}, {"kind": "table", "eyebrow": "Findings", "cols": ["Severity", "Typical count", "Median fix", "Owner"], "rows": [["Critical", "2", "4 hours", "platform"], ["High", "9", "2 days", "platform"], ["Medium", "34", "2 weeks", "product"], ["Informational", "210", "backlog", "—"]]}, {"kind": "pricing", "eyebrow": "Plans", "plans": [{"name": "Team", "amt": "29", "per": "seat", "items": ["One cloud account", "Daily checks", "Slack alerts"]}, {"name": "Company", "amt": "59", "per": "seat", "items": ["Unlimited accounts", "Hourly checks", "SSO and audit log", "Named contact"]}, {"name": "Regulated", "amt": "talk", "per": "to us", "items": ["Everything above", "Evidence export", "Custom retention", "Quarterly review"]}]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "Do you store our code?", "a": "No. Scanning happens in your account and only findings leave it."}, {"q": "How long until the first result?", "a": "Usually under an hour after the first connection."}, {"q": "Will it wake us up at night?", "a": "Only for critical, and only if you ask it to."}]}]},
  {"name": "Prisma", "category": "Landing Page", "tag": "One product, explained in ninety seconds", "palette": {"accent": "#c9a4ff", "accent2": "#ffd166"}, "heroTitle": "Ship the thing you keep describing", "heroSubtitle": "A working draft in a day, a real page by Friday, and every word still editable by the person who wrote it.", "ctas": ["Start a draft", "See a finished one"], "components": ["Before and after", "How it works", "Proof", "Pricing", "Questions"], "sectionCopy": ["What changes in the first week.", "Four steps, no meetings required.", "Numbers from teams already using it.", "Two plans, both monthly.", "Asked before most sign-ups."], "sections": [{"kind": "metrics", "eyebrow": "Before and after", "items": [{"k": "First draft", "v": "1 day", "sub": "was 3 weeks"}, {"k": "Live page", "v": "5 days", "sub": "was 2 months"}, {"k": "Edits", "v": "you", "sub": "was a ticket"}, {"k": "Cost", "v": "−74%", "sub": "vs agency"}]}, {"kind": "timeline", "eyebrow": "How it works", "steps": [{"when": "01", "title": "Describe it", "copy": "One paragraph about what the product does and who it is for."}, {"when": "02", "title": "Read the draft", "copy": "Sections, copy and layout, generated and already arranged."}, {"when": "03", "title": "Type on it", "copy": "Click any line and change it. No fields, no forms."}, {"when": "04", "title": "Publish", "copy": "Your address, live, with the media served from it."}]}, {"kind": "quote", "eyebrow": "Proof", "quote": "We replaced a six-week agency cycle with a Tuesday afternoon.", "attr": "Head of product, a fintech in Berlin"}, {"kind": "pricing", "eyebrow": "Pricing", "plans": [{"name": "Solo", "amt": "19", "per": "month", "items": ["Three projects", "Custom domain", "Publish unlimited"]}, {"name": "Studio", "amt": "79", "per": "month", "items": ["Unlimited projects", "Five seats", "Client review", "Priority generation"]}]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "Do I need a designer?", "a": "No, but if you have one they can change everything."}, {"q": "Can I use my own domain?", "a": "Yes. You add two DNS records and it goes live."}, {"q": "What happens if I stop paying?", "a": "Your published sites stay up for thirty days and you can export everything."}]}]},
  {"name": "Max Reed", "category": "Portfolio", "tag": "A director's reel that reads like a document", "palette": {"accent": "#ffffff", "accent2": "#ff4d6d"}, "heroTitle": "Nine films. One question each.", "heroSubtitle": "Commercial and documentary work made over seven years, listed with what it was for and whether it worked.", "ctas": ["See the nine", "Start a conversation"], "components": ["Body of work", "Selected", "How a film gets made", "Credits", "Before you write"], "sectionCopy": ["Seven years, nine films that still hold up.", "The work, newest first.", "Three decisions, in the order they get made.", "Who else is usually in the room.", "What helps a first email."], "sections": [{"kind": "metrics", "eyebrow": "Body of work", "items": [{"k": "Films", "v": "9", "sub": "selected from 44"}, {"k": "Years", "v": "7", "sub": "working"}, {"k": "Longest", "v": "68", "sub": "minutes"}, {"k": "Crew", "v": "5", "sub": "typical"}]}, {"kind": "gallery", "eyebrow": "Selected", "tiles": ["Low Tide", "Kiln", "The Long Room", "Nightshift", "Salt", "Verge"]}, {"kind": "timeline", "eyebrow": "How a film gets made", "steps": [{"when": "01", "title": "The question", "copy": "Every film starts as one sentence. If it cannot, it is not ready."}, {"when": "02", "title": "The look", "copy": "Decided on paper before the shoot, so nothing is invented under pressure."}, {"when": "03", "title": "The cut", "copy": "First assembly is deliberately too long. We take away until it stops improving."}]}, {"kind": "logos", "eyebrow": "Credits", "names": ["ARRI", "KODAK", "BFI", "CHANNEL 4", "ARTE", "NOWNESS"]}, {"kind": "split", "eyebrow": "Before you write", "bullets": ["Tell me what the film is for, not what it should look like", "Say the budget, even roughly", "Say when it has to exist", "If there is a script, send it"]}]},
  {"name": "Celestial Renewal", "category": "Wellness", "tag": "A studio that counts what matters", "palette": {"accent": "#a8ff5c", "accent2": "#7beeff"}, "heroTitle": "Show up. We handle the rest.", "heroSubtitle": "Small-group strength and breathing, coached by name, capped at ten so nobody trains unsupervised.", "ctas": ["Book a trial", "See the week"], "components": ["Studio", "Week", "Coaching", "Membership", "Questions"], "sectionCopy": ["One room, proper equipment, ten people maximum.", "What a week actually looks like.", "How coaching works here.", "What it costs, monthly.", "Asked at almost every trial."], "sections": [{"kind": "metrics", "eyebrow": "Studio", "items": [{"k": "Cap", "v": "10", "sub": "per session"}, {"k": "Coaches", "v": "4", "sub": "all full time"}, {"k": "Sessions", "v": "34", "sub": "per week"}, {"k": "Retention", "v": "81%", "sub": "at 12 months"}]}, {"kind": "scroller", "eyebrow": "Week", "cards": [{"label": "MON", "title": "Lower strength", "copy": "Squat and hinge, loaded across a six-week block."}, {"label": "TUE", "title": "Breath and pace", "copy": "Intervals set to your numbers, not the room's."}, {"label": "THU", "title": "Upper strength", "copy": "Press and pull, accessories chosen per person."}, {"label": "SAT", "title": "Long easy", "copy": "Ninety minutes, conversational, outdoors when dry."}]}, {"kind": "split", "eyebrow": "Coaching", "bullets": ["Your coach knows your name and your last three sessions", "Every load is written down, by you", "Nothing is scaled without saying why", "If you miss two weeks we call, once"]}, {"kind": "pricing", "eyebrow": "Membership", "plans": [{"name": "Twice a week", "amt": "89", "per": "month", "items": ["Two sessions", "Programme", "Open gym Sundays"]}, {"name": "Unlimited", "amt": "139", "per": "month", "items": ["Any session", "Programme", "Two guest passes", "Quarterly check-in"]}]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "I have never lifted before.", "a": "Most people here started that way. The first month is teaching."}, {"q": "Can I freeze?", "a": "Yes, twice a year, up to six weeks."}, {"q": "Is there a joining fee?", "a": "No."}]}]},
  {"name": "TrustFlow", "category": "Finance", "tag": "Close the month in a morning", "palette": {"accent": "#7bff9e", "accent2": "#7beeff"}, "heroTitle": "Close the month in a morning", "heroSubtitle": "Reconciliation that reads your bank feed, matches what it can, and shows its working on everything it cannot.", "ctas": ["See a live close", "Talk to finance"], "components": ["Close", "What it matches", "Controls", "Plans", "Questions"], "sectionCopy": ["What a month-end looks like now.", "Four sources, one ledger.", "Who approved what, and when.", "Per entity, billed yearly.", "Asked in every finance review."], "sections": [{"kind": "metrics", "eyebrow": "Close", "items": [{"k": "Close time", "v": "4h", "sub": "was 6 days"}, {"k": "Auto-matched", "v": "93%", "sub": "of lines"}, {"k": "Entities", "v": "12", "sub": "one view"}, {"k": "Audit prep", "v": "1 day", "sub": "was 3 weeks"}]}, {"kind": "table", "eyebrow": "What it matches", "cols": ["Source", "Volume", "Auto", "Left to review"], "rows": [["Bank feed", "41,200", "96%", "1,650"], ["Card spend", "8,900", "94%", "530"], ["Invoices", "3,100", "88%", "370"], ["Payroll", "740", "99%", "8"]]}, {"kind": "timeline", "eyebrow": "Controls", "steps": [{"when": "DAY 01", "title": "Freeze", "copy": "The period locks and every later edit is recorded against a name."}, {"when": "DAY 01", "title": "Review", "copy": "Only the exceptions come to a human, ranked by value."}, {"when": "DAY 02", "title": "Sign off", "copy": "Two approvers, one export, and the trail goes with it."}]}, {"kind": "pricing", "eyebrow": "Plans", "plans": [{"name": "Single entity", "amt": "390", "per": "month", "items": ["One ledger", "Bank and card feeds", "Two approvers"]}, {"name": "Group", "amt": "1,200", "per": "month", "items": ["Up to twelve entities", "Intercompany matching", "SSO and audit log", "Named accountant"]}]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "Which ledgers do you support?", "a": "Xero, NetSuite and Sage, plus CSV for anything else."}, {"q": "Do you move money?", "a": "No. We read, match and explain. Payments stay where they are."}, {"q": "How long to onboard?", "a": "One entity in a week, a group in about a month."}]}]},
  {"name": "Innovation Lab", "category": "Technology", "tag": "Research you can read in one sitting", "palette": {"accent": "#ffb454", "accent2": "#5ad1ff"}, "heroTitle": "We publish the misses too", "heroSubtitle": "A small applied research group working on materials and sensing, with every result posted whether or not it went the way we hoped.", "ctas": ["Read the papers", "Work with us"], "components": ["Output", "Papers", "How we work", "Partners", "Questions"], "sectionCopy": ["Four years of published work.", "Newest first, misses included.", "Three rules that decide what we take on.", "Who funds and builds with us.", "Asked by most people who write in."], "sections": [{"kind": "metrics", "eyebrow": "Output", "items": [{"k": "Papers", "v": "31", "sub": "published"}, {"k": "Negative", "v": "9", "sub": "posted anyway"}, {"k": "Replicated", "v": "84%", "sub": "by others"}, {"k": "People", "v": "11", "sub": "full time"}]}, {"kind": "table", "eyebrow": "Papers", "cols": ["Year", "Title", "Field", "Result"], "rows": [["2026", "Low-drift strain sensing on flexible substrate", "Sensing", "held up"], ["2025", "Recycled binder in cast components", "Materials", "partial"], ["2025", "Acoustic mapping in tight enclosures", "Sensing", "did not hold"], ["2024", "Thermal cycling of printed contacts", "Materials", "held up"]]}, {"kind": "split", "eyebrow": "How we work", "bullets": ["If it cannot be replicated, it is not finished", "Negative results get the same page as positive ones", "No project runs longer than eighteen months", "Every dataset ships with the paper"]}, {"kind": "logos", "eyebrow": "Partners", "names": ["ETH", "FRAUNHOFER", "TU DELFT", "KTH", "IMEC", "CSIRO"]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "Can we fund a specific question?", "a": "Yes, if we can publish the answer."}, {"q": "Do you do consulting?", "a": "Rarely, and never on something we are also researching."}, {"q": "Where is the data?", "a": "Linked from every paper, no request needed."}]}]},
  {"name": "ADHD Planner", "category": "App", "tag": "One screen, one next thing", "palette": {"accent": "#ff8f6b", "accent2": "#c9a4ff"}, "heroTitle": "One next thing, not twenty", "heroSubtitle": "A planner that hides everything except what you are doing now, and forgives you completely when a day gets away.", "ctas": ["Try it free", "See how it works"], "components": ["Today", "What it does", "What it will not do", "Plans", "Questions"], "sectionCopy": ["What the app shows when you open it.", "Four things, done properly.", "The features we deliberately left out.", "Free, or a small yearly fee.", "Asked by most people who try it."], "sections": [{"kind": "metrics", "eyebrow": "Today", "items": [{"k": "On screen", "v": "1", "sub": "task at a time"}, {"k": "Setup", "v": "0", "sub": "projects to build"}, {"k": "Streaks", "v": "none", "sub": "on purpose"}, {"k": "Rated", "v": "4.8", "sub": "12,400 reviews"}]}, {"kind": "split", "eyebrow": "What it does", "bullets": ["Shows one task, chosen for you, with a way to swap it", "Breaks anything vague into a first step you can start", "Lets you dump everything at once and sort later, or never", "Forgets yesterday unless you ask it not to"]}, {"kind": "split", "eyebrow": "What it will not do", "bullets": ["No streaks to break", "No productivity score", "No nested projects and sub-projects", "No notifications you did not ask for"]}, {"kind": "pricing", "eyebrow": "Plans", "plans": [{"name": "Free", "amt": "0", "per": "forever", "items": ["Everything on one device", "Unlimited tasks"]}, {"name": "Sync", "amt": "24", "per": "year", "items": ["All your devices", "Backups", "Widgets"]}]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "Is my data private?", "a": "It stays on your device unless you turn on sync, and it is encrypted when you do."}, {"q": "What if I stop paying?", "a": "Everything keeps working on one device."}, {"q": "Is this medical advice?", "a": "No. It is a planner made with people who have ADHD."}]}]},
  {"name": "Blog Showcase", "category": "Blog", "tag": "Writing that people finish", "palette": {"accent": "#e8c98a", "accent2": "#c9a4ff"}, "heroTitle": "Long pieces, published slowly", "heroSubtitle": "One essay a fortnight on how things are actually made, with the research notes attached to every one.", "ctas": ["Read the latest", "Subscribe"], "components": ["The archive", "Recent", "How it is written", "Support", "Questions"], "sectionCopy": ["Four years of fortnightly pieces.", "The last four, newest first.", "Three habits that keep it honest.", "What a subscription pays for.", "Asked by readers most often."], "sections": [{"kind": "metrics", "eyebrow": "The archive", "items": [{"k": "Essays", "v": "96", "sub": "since 2022"}, {"k": "Median", "v": "4,100", "sub": "words"}, {"k": "Finished", "v": "62%", "sub": "read to the end"}, {"k": "Readers", "v": "31k", "sub": "subscribed"}]}, {"kind": "timeline", "eyebrow": "Recent", "steps": [{"when": "12 AUG", "title": "The cost of a quiet motor", "copy": "Why the expensive fan is quieter, and what that costs to manufacture."}, {"when": "29 JUL", "title": "Six weeks in a paper mill", "copy": "What actually happens between a forest and a page."}, {"when": "15 JUL", "title": "The last hand-cut file", "copy": "One workshop, one process, and why it survived."}]}, {"kind": "split", "eyebrow": "How it is written", "bullets": ["Nothing runs until someone in the trade has read it", "Every claim links to where it came from", "Corrections stay on the page, dated", "No sponsored pieces, ever"]}, {"kind": "pricing", "eyebrow": "Support", "plans": [{"name": "Free", "amt": "0", "per": "always", "items": ["Every essay", "Full archive"]}, {"name": "Member", "amt": "60", "per": "year", "items": ["Research notes", "Two live sessions a year", "Pays for the travel"]}]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "Why fortnightly?", "a": "Because weekly would mean thinner work and we tried it."}, {"q": "Is anything paywalled?", "a": "No essay is. Only the notes."}, {"q": "Can I republish?", "a": "Yes, with a link and no changes."}]}]},
  {"name": "Nexto 404", "category": "404", "tag": "A dead end that still helps", "palette": {"accent": "#ff4d6d", "accent2": "#7beeff"}, "heroTitle": "That page moved on", "heroSubtitle": "The link you followed does not point anywhere now. Here is what is usually behind it, and a way to tell us if we broke something.", "ctas": ["Back to the start", "Tell us what broke"], "components": ["Try these", "What happened", "Report it"], "sectionCopy": ["The four places most people were heading.", "Why a link stops working.", "Thirty seconds, and it reaches a person."], "sections": [{"kind": "gallery", "eyebrow": "Try these", "tiles": ["Home", "What we make", "Pricing", "Support"]}, {"kind": "split", "eyebrow": "What happened", "bullets": ["The page was renamed and the old link was not redirected", "It was retired on purpose", "There is a typo in the address", "Something on our side is broken, which is worth telling us"]}, {"kind": "faq", "eyebrow": "Report it", "items": [{"q": "Where did you come from?", "a": "If a link on our own site sent you here, that is a bug and we want it."}, {"q": "Do you read these?", "a": "Yes. They go to the same inbox as support."}]}]},
  {"name": "No-Code Waitlist", "category": "Waitlist", "tag": "A queue with an honest position", "palette": {"accent": "#dfff45", "accent2": "#7d6cff"}, "heroTitle": "Join, and know where you stand", "heroSubtitle": "We let people in every Tuesday in the order they joined, and the number on this page is the real one.", "ctas": ["Join the list", "See who is already in"], "components": ["The queue", "How it moves", "Who is in", "Questions"], "sectionCopy": ["Live, updated when the page loads.", "One rule, applied every week.", "The kind of teams already using it.", "Asked by most people before joining."], "sections": [{"kind": "metrics", "eyebrow": "The queue", "items": [{"k": "Waiting", "v": "2,418", "sub": "right now"}, {"k": "Let in", "v": "120", "sub": "each Tuesday"}, {"k": "Typical wait", "v": "3 wks", "sub": "from joining"}, {"k": "Skipped", "v": "0", "sub": "no queue jumping"}]}, {"kind": "timeline", "eyebrow": "How it moves", "steps": [{"when": "MON", "title": "We count", "copy": "Whoever has been waiting longest is next. No exceptions, including for us."}, {"when": "TUE", "title": "Invites go out", "copy": "One email, valid for seven days, with your position at the time."}, {"when": "WED", "title": "Support catches up", "copy": "Everyone let in gets a real reply within a day."}]}, {"kind": "logos", "eyebrow": "Who is in", "names": ["ORBIT", "KESTREL", "LUMEN", "VANE", "SABLE", "ATLAS"]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "Can I pay to skip?", "a": "No. That is the point of publishing the number."}, {"q": "What if I miss my invite?", "a": "You go back in at the same position, not the end."}, {"q": "Will you email me otherwise?", "a": "Once, when you get in. Nothing else."}]}]},
  {"name": "Build With Us", "category": "Contact", "tag": "One form, answered by a person", "palette": {"accent": "#7beeff", "accent2": "#dfff45"}, "heroTitle": "Tell us what you need", "heroSubtitle": "One short message reaches the two people who would actually do the work, and you get a real answer within a day.", "ctas": ["Start a message", "Book a call instead"], "components": ["Response", "What helps", "Who replies", "Questions"], "sectionCopy": ["What happens after you send it.", "Four lines that make the first reply useful.", "No account managers in between.", "Asked before most first messages."], "sections": [{"kind": "metrics", "eyebrow": "Response", "items": [{"k": "First reply", "v": "6h", "sub": "median"}, {"k": "By a person", "v": "100%", "sub": "no autoresponder"}, {"k": "Quoted", "v": "2 days", "sub": "if it fits"}, {"k": "Turned down", "v": "fast", "sub": "and with a reason"}]}, {"kind": "split", "eyebrow": "What helps", "bullets": ["What the thing has to do, in a sentence", "Roughly what you can spend", "When it has to exist", "Anything that already exists, even if it is bad"]}, {"kind": "scroller", "eyebrow": "Who replies", "cards": [{"label": "BUILD", "title": "Dana Okoye", "copy": "Answers anything technical, usually the same afternoon."}, {"label": "DESIGN", "title": "Petra Lund", "copy": "Answers anything about scope, timing and what it will cost."}]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "Do you sign NDAs?", "a": "Yes, before the first call if you want."}, {"q": "Will I get a sales sequence?", "a": "No. One reply, then only if you write back."}]}]},
  {"name": "Rocket Pricing", "category": "Pricing", "tag": "Three plans, no hidden line", "palette": {"accent": "#ff5a3c", "accent2": "#ffd166"}, "heroTitle": "Priced before you ask", "heroSubtitle": "Every number on this page is the number you pay. No setup fee, no minimum term, and no call required to see it.", "ctas": ["Start free", "Compare the plans"], "components": ["Plans", "What is included everywhere", "What costs extra", "Questions"], "sectionCopy": ["Monthly, cancel whenever.", "The things we refuse to charge for.", "The two things that are usage-based, and their rates.", "Asked before almost every upgrade."], "sections": [{"kind": "pricing", "eyebrow": "Plans", "plans": [{"name": "Free", "amt": "0", "per": "month", "items": ["One project", "Community support", "Publish to a shared address"]}, {"name": "Pro", "amt": "24", "per": "month", "items": ["Ten projects", "Custom domain", "Email support", "Remove branding"]}, {"name": "Team", "amt": "96", "per": "month", "items": ["Unlimited projects", "Five seats", "Review and approvals", "Priority support"]}]}, {"kind": "split", "eyebrow": "What is included everywhere", "bullets": ["Custom domains on every paid plan", "Unlimited publishes", "Your data exportable at any time", "Support from the people who built it"]}, {"kind": "table", "eyebrow": "What costs extra", "cols": ["Item", "Included", "Then", "Notes"], "rows": [["Image generation", "50 / month", "25 credits each", "charged as used"], ["Video generation", "none", "12–45 credits / second", "by resolution"]]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "Is there an annual discount?", "a": "Two months free if you pay yearly."}, {"q": "Can I change plan mid-month?", "a": "Yes, and we pro-rate both ways."}, {"q": "What happens to my sites if I downgrade?", "a": "They stay published. You just get fewer projects to edit."}]}]},
  {"name": "Orbis Hello", "category": "About", "tag": "Who we are, without the mission statement", "palette": {"accent": "#c2a878", "accent2": "#8fd3c3"}, "heroTitle": "Eleven people, one floor", "heroSubtitle": "We started in 2019 doing one thing badly, stopped, and have been doing a narrower thing properly since.", "ctas": ["See the work", "Open roles"], "components": ["Us", "How we got here", "How we work", "Roles", "Questions"], "sectionCopy": ["The company in four numbers.", "The turns that actually mattered.", "Four rules we do not break.", "What we are hiring for now.", "Asked at almost every interview."], "sections": [{"kind": "metrics", "eyebrow": "Us", "items": [{"k": "People", "v": "11", "sub": "one office"}, {"k": "Since", "v": "2019", "sub": "still here"}, {"k": "Clients", "v": "38", "sub": "total"}, {"k": "Left", "v": "2", "sub": "in six years"}]}, {"kind": "timeline", "eyebrow": "How we got here", "steps": [{"when": "2019", "title": "Too many services", "copy": "We offered nine things and were good at two of them."}, {"when": "2021", "title": "Cut seven", "copy": "Revenue dropped for a year and then doubled."}, {"when": "2024", "title": "Stopped growing", "copy": "Eleven is the number where everyone still knows the work."}]}, {"kind": "split", "eyebrow": "How we work", "bullets": ["Nobody works a weekend to cover a bad estimate", "Every project has one owner, named to the client", "We say what a thing costs before we are asked", "If we get it wrong we say so the same week"]}, {"kind": "table", "eyebrow": "Roles", "cols": ["Role", "Level", "Where", "Status"], "rows": [["Designer", "mid", "on site", "open"], ["Engineer", "senior", "on site", "open"], ["Producer", "any", "hybrid", "closed"]]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "Are you remote?", "a": "No, and that is a real trade-off we accept."}, {"q": "What is the interview?", "a": "A conversation, then a paid day on a real problem."}]}]},
  {"name": "Glow Features", "category": "Features", "tag": "Four things, done properly", "palette": {"accent": "#a8ff5c", "accent2": "#ff8f6b"}, "heroTitle": "Four things. Nothing else.", "heroSubtitle": "We removed twenty features last year and the product got faster, smaller and easier to explain.", "ctas": ["See what is left", "Read the changelog"], "components": ["What is left", "What we removed", "Numbers", "Questions"], "sectionCopy": ["The four that survived.", "And what happened when they went.", "What removal actually bought.", "Asked whenever something goes."], "sections": [{"kind": "split", "eyebrow": "What is left", "bullets": ["Capture, from anywhere, in one keystroke", "Search that finds it even when you misremember", "Share, with a link that expires when you say", "Export, everything, any time, no ticket"]}, {"kind": "table", "eyebrow": "What we removed", "cols": ["Feature", "Used by", "Removed", "Complaints"], "rows": [["Boards", "4%", "Mar", "11"], ["Templates", "9%", "Apr", "3"], ["Automations", "2%", "Jun", "0"], ["Themes", "31%", "kept", "—"]]}, {"kind": "metrics", "eyebrow": "Numbers", "items": [{"k": "Load", "v": "−61%", "sub": "first paint"}, {"k": "Bundle", "v": "−44%", "sub": "shipped JS"}, {"k": "Support", "v": "−38%", "sub": "tickets"}, {"k": "Churn", "v": "−12%", "sub": "same period"}]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "What if I used a removed feature?", "a": "We wrote to everyone who did, before it went, with an export."}, {"q": "Will you remove more?", "a": "Probably. We publish the usage numbers first."}]}]},
  {"name": "Mind-Body Healing", "category": "Medicine", "tag": "A clinic that publishes its outcomes", "palette": {"accent": "#8fd3c3", "accent2": "#f4efe6"}, "heroTitle": "We publish what happens next", "heroSubtitle": "A small pain clinic that follows every patient for a year and posts the results, including the ones that did not improve.", "ctas": ["Book an assessment", "Read the outcomes"], "components": ["Outcomes", "How it works", "The team", "Costs", "Questions"], "sectionCopy": ["Twelve months after treatment, all patients.", "Three appointments, then a decision together.", "Who you actually see.", "Published, per appointment.", "Asked at almost every first visit."], "sections": [{"kind": "metrics", "eyebrow": "Outcomes", "items": [{"k": "Improved", "v": "71%", "sub": "at 12 months"}, {"k": "No change", "v": "22%", "sub": "at 12 months"}, {"k": "Worse", "v": "7%", "sub": "at 12 months"}, {"k": "Followed up", "v": "96%", "sub": "of patients"}]}, {"kind": "timeline", "eyebrow": "How it works", "steps": [{"when": "VISIT 01", "title": "Assessment", "copy": "Ninety minutes, mostly listening, no treatment on the day."}, {"when": "VISIT 02", "title": "A plan, with odds", "copy": "What we expect, how likely it is, and what happens if it does not work."}, {"when": "VISIT 03", "title": "Decide together", "copy": "Continue, change, or stop. Stopping is a normal outcome here."}]}, {"kind": "scroller", "eyebrow": "The team", "cards": [{"label": "PAIN MEDICINE", "title": "Dr Anwar Sethi", "copy": "Fourteen years, and the person who insisted we publish the misses."}, {"label": "PHYSIOTHERAPY", "title": "Lena Fischer", "copy": "Runs the twelve-month follow-up that most clinics skip."}, {"label": "PSYCHOLOGY", "title": "Dr Marta Ruiz", "copy": "Sees every patient at least once, by default."}]}, {"kind": "table", "eyebrow": "Costs", "cols": ["Appointment", "Length", "Cost", "Covered"], "rows": [["Assessment", "90 min", "180", "most insurers"], ["Follow-up", "45 min", "95", "most insurers"], ["Physio", "45 min", "70", "varies"]]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "Do I need a referral?", "a": "No, but bring any imaging you already have."}, {"q": "Why publish bad outcomes?", "a": "Because a clinic that only publishes good ones is telling you nothing."}]}]},
  {"name": "AI Image Generator", "category": "AI", "tag": "What it can and cannot do, up front", "palette": {"accent": "#7d6cff", "accent2": "#7beeff"}, "heroTitle": "Good at four things. Bad at three.", "heroSubtitle": "An image model tuned for product and interior work, with the failure cases documented on the same page as the wins.", "ctas": ["Try five free", "See the failures"], "components": ["Where it is strong", "Where it fails", "Speed and cost", "Rights", "Questions"], "sectionCopy": ["Tested against a fixed set, monthly.", "Published because you will find them anyway.", "Per image, at each size.", "Who owns what comes out.", "Asked before most sign-ups."], "sections": [{"kind": "split", "eyebrow": "Where it is strong", "bullets": ["Products on plain and textured ground", "Interiors with real daylight", "Materials — metal, glass, fabric, stone", "Consistent lighting across a whole set"]}, {"kind": "split", "eyebrow": "Where it fails", "bullets": ["Hands holding small objects", "Legible text of more than three words", "Exact brand colours without a reference"]}, {"kind": "table", "eyebrow": "Speed and cost", "cols": ["Size", "Time", "Credits", "Best for"], "rows": [["1K", "4s", "25", "drafts"], ["2K", "11s", "45", "web"], ["4K", "34s", "110", "print"]]}, {"kind": "split", "eyebrow": "Rights", "bullets": ["You own what you generate, commercially", "We do not train on your prompts or outputs", "Your uploads are deleted after thirty days", "Nothing is shown publicly unless you publish it"]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "Can I upload a reference?", "a": "Yes, and it stays private to your workspace."}, {"q": "Why publish the failures?", "a": "So you do not spend credits discovering them."}]}]},
  {"name": "CodeNest", "category": "Education", "tag": "Learn by shipping, not by watching", "palette": {"accent": "#5ad1ff", "accent2": "#dfff45"}, "heroTitle": "You will ship in week one", "heroSubtitle": "Twelve weeks, four real projects, and a reviewer who reads every line you write and tells you what is wrong with it.", "ctas": ["See the twelve weeks", "Apply"], "components": ["Cohort", "The twelve weeks", "Reviewing", "Cost", "Questions"], "sectionCopy": ["Small on purpose.", "What gets built, and when.", "The part most courses skip.", "One price, refundable in week two.", "Asked by almost every applicant."], "sections": [{"kind": "metrics", "eyebrow": "Cohort", "items": [{"k": "Places", "v": "24", "sub": "per cohort"}, {"k": "Reviewers", "v": "6", "sub": "working engineers"}, {"k": "Finished", "v": "89%", "sub": "of those who start"}, {"k": "Hired", "v": "64%", "sub": "within six months"}]}, {"kind": "timeline", "eyebrow": "The twelve weeks", "steps": [{"when": "WK 01–03", "title": "A tool you use", "copy": "Small, ugly, yours, and running by Friday of week one."}, {"when": "WK 04–07", "title": "Something with data", "copy": "A real schema, real migrations, and the mistakes that come with them."}, {"when": "WK 08–10", "title": "Something with users", "copy": "Auth, permissions and the first time you break production."}, {"when": "WK 11–12", "title": "Your own", "copy": "Whatever you want, reviewed like the rest."}]}, {"kind": "split", "eyebrow": "Reviewing", "bullets": ["Every pull request read by a working engineer", "Comments within one working day", "You rewrite it, and it gets read again", "Nothing is marked done because you ran out of time"]}, {"kind": "pricing", "eyebrow": "Cost", "plans": [{"name": "Upfront", "amt": "2,400", "per": "course", "items": ["Twelve weeks", "All reviews", "Full refund in week two"]}, {"name": "Monthly", "amt": "900", "per": "month", "items": ["Three payments", "Same course", "Same refund window"]}]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "Do I need experience?", "a": "You should have written some code before, badly is fine."}, {"q": "Is it part time?", "a": "Yes. Expect fifteen hours a week and be honest with yourself about it."}]}]},
  {"name": "Radial", "category": "Testimonials", "tag": "Quotes with the numbers attached", "palette": {"accent": "#ffd166", "accent2": "#ff5a3c"}, "heroTitle": "Quotes, with the numbers", "heroSubtitle": "Every line on this page comes with what it replaced, what it cost, and a name you can look up.", "ctas": ["Read the cases", "Ask for a reference"], "components": ["What changed", "In their words", "The cases", "Questions"], "sectionCopy": ["Across the twelve customers who agreed to be named.", "Three of them, unedited.", "What each one actually did.", "Asked whenever someone checks references."], "sections": [{"kind": "metrics", "eyebrow": "What changed", "items": [{"k": "Time saved", "v": "11h", "sub": "per week, median"}, {"k": "Tools dropped", "v": "3", "sub": "average"}, {"k": "Payback", "v": "7 wks", "sub": "median"}, {"k": "Named", "v": "12", "sub": "of 40 customers"}]}, {"kind": "quote", "eyebrow": "In their words", "quote": "It replaced two tools and a spreadsheet nobody wanted to own.", "attr": "Operations lead, a logistics firm in Rotterdam"}, {"kind": "table", "eyebrow": "The cases", "cols": ["Company", "Size", "Replaced", "Payback"], "rows": [["Kestrel", "40", "2 tools", "6 weeks"], ["Vane", "120", "1 tool + sheet", "9 weeks"], ["Sable", "18", "spreadsheet", "4 weeks"], ["Atlas", "310", "3 tools", "11 weeks"]]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "Can I talk to one of them?", "a": "Yes. We will introduce you to a customer your size."}, {"q": "Why only twelve names?", "a": "Those are the ones who agreed. The other twenty-eight did not, and that is fine."}]}]},
  {"name":"Mostar","category":"Travel","tag":"A cinematic three-screen scroll story",
   "palette":{"accent":"#74b5e0","accent2":"#fdf1e1"},
   "heroTitle":"MOSTAR","heroSubtitle":"A stone arch, emerald water, and a compact old city made for slow mornings, late light, and one unforgettable crossing.",
   "ctas":["Plan a visit","See the routes"],
   "components":["Old Bridge","Old Town","Routes"],
   "sectionCopy":["Stari Most links the banks of the Neretva and anchors a historic quarter.",
     "Stone lanes, mosque courtyards, copper stalls and riverside coffee.",
     "Five sights, all within a short walk of the bridge."],
   "sections":[{"kind":"metrics","eyebrow":"Old Bridge","items":[
       {"k":"Built","v":"1566","sub":"original span"},
       {"k":"UNESCO","v":"2005","sub":"area inscribed"},
       {"k":"Arch","v":"29m","sub":"clear span"},
       {"k":"Drop","v":"24m","sub":"to the Neretva"}]},
     {"kind":"gallery","eyebrow":"Old Town","tiles":["Kujundziluk","Koski Mehmed Pasha","Kajtaz House","Crooked Bridge","Riverside terraces","Copper workshops"]},
     {"kind":"split","eyebrow":"Routes","bullets":["Cross at first light, before the tour groups",
       "Climb the minaret for the view back at the arch","Coffee on the east bank, lunch on the west",
       "The whole old city fits in one slow afternoon"]}],
   "cinema":{
     "aria":"Mostar cinematic scroll story",
     "logo":"Bosnia and Herzegovina",
     "nav":[["Intro","#cinema"],["Bridge","#bridge"],["Bazaar","#bazaar"],["Routes","#routes"]],
     "title":"MOSTAR",
     "intro":"A stone arch, emerald water, and a compact old city made for slow mornings, late light, and one unforgettable crossing.",
     "tags":["Old Bridge","Neretva River","UNESCO old city"],
     "layers":{
       "sky":CIN_FIGMA+"16b5007d9c93971e26ffe4e0e3e37946f6bd538c.png",
       "four":CIN_FIGMA+"8a7f8af50e0ce92ec2e228e7b0b4112178c51cf1.png",
       "bazaar":CIN_FIGMA+"864afe00e41e2fa20a5aa546e15cb807e0f81384.png",
       "splitLeft":CIN_FIGMA+"7536d7b60a1fce482cf6edf3f0bffd3bad5d0f8a.png",
       "splitRight":CIN_FIGMA+"392db6a6a6b98e868bd7f8d3f55bb719d51e5028.png",
       "bridge":CIN_FIGMA+"c6a6d8ef49bca43f708aa852692942c45ec950d4.png",
       "frameTwo":CIN_FIGMA+"ba75252bab2b1c510987b74837770f7bc8a6b2d4.png"},
     "cards":[
       {"kicker":"Old Bridge","title":"Stari Most","copy":"The stone arch over the Neretva and Mostar's main landmark.","pin":CIN_PIN+"hf_20260730_230438_d526b8b6-8a2e-4e3b-9993-3908acae03a7.png"},
       {"kicker":"Bazaar Street","title":"Kujundziluk","copy":"Copper shops, souvenirs, and the old bazaar lane by the bridge.","pin":CIN_PIN+"hf_20260730_230442_140bc25b-b165-4249-904a-f708bff6970e.png"},
       {"kicker":"Viewpoint","title":"Koski Mehmed Pasha Mosque","copy":"A classic minaret view back toward Stari Most and the river.","pin":CIN_PIN+"hf_20260730_230448_825949c9-ccdb-4857-b4a6-e349eccc9010.png"},
       {"kicker":"Ottoman House","title":"Kajtaz House","copy":"A preserved residential house showing Mostar's Ottoman layers.","pin":CIN_PIN+"hf_20260730_230438_d526b8b6-8a2e-4e3b-9993-3908acae03a7.png"},
       {"kicker":"Museum","title":"War Photo Exhibition","copy":"A compact, moving stop for context on the city's recent history.","pin":CIN_PIN+"hf_20260730_230442_140bc25b-b165-4249-904a-f708bff6970e.png"}],
     "panels":[
       {"id":"bridge","label":"Old Bridge details","h2":"The bridge is the city's compass.",
        "p":"Stari Most links the banks of the Neretva and anchors a historic quarter shaped by Ottoman, Mediterranean, and European layers.",
        "facts":[["1566","Original bridge completed"],["2005","Old Bridge Area inscribed by UNESCO"]]},
       {"id":"bazaar","label":"Old town details","h2":"The bazaar keeps Mostar close.",
        "p":"Stone lanes, mosque courtyards, copper stalls, and riverside coffee stay within a short walk of Stari Most.",
        "button":"Open old town notes"}]}},
  {"name": "Ironclad", "category": "Entertainment", "tag": "Live sports entertainment, broadcast-grade", "palette": {"accent": "#d4121f", "accent2": "#f0eeea"}, "heroTitle": "The fight starts here.", "heroSubtitle": "Big personalities, bigger rivalries and twelve nights a season across nine countries — every card, every fighter and every replay in one place.", "ctas": ["Get tickets", "Watch live"], "components": ["Season", "Fighters", "Events", "Videos", "News", "Tickets", "Questions"], "sectionCopy": ["Twelve nights, nine countries, one championship picture.", "Four of the thirty-eight under contract this season.", "Every card on the calendar, and where the tickets stand.", "Highlights, full matches, interviews and backstage.", "What moved this week.", "Three ways in, priced before you ask.", "Asked at almost every box office."], "sections": [{"kind": "metrics", "eyebrow": "Season", "items": [{"k": "Events", "v": "12", "sub": "per season"}, {"k": "Fighters", "v": "38", "sub": "under contract"}, {"k": "Countries", "v": "9", "sub": "on this tour"}, {"k": "Broadcast", "v": "41", "sub": "territories"}]}, {"kind": "scroller", "eyebrow": "Fighters", "cards": [{"label": "BLACKSAW", "title": "Kaia Moreno", "copy": "24-3. The longest title reign in the division, built on one counter everybody can see coming."}, {"label": "IRON SERMON", "title": "Emeka Okafor", "copy": "28-5. Talks for forty seconds before every match and not again until it is over."}, {"label": "THE VAULT", "title": "Dmitri Orlov", "copy": "31-7. Nobody has taken him off his feet inside the opening ten minutes."}, {"label": "RIPTIDE", "title": "Nia Baptiste", "copy": "19-2. Took the belt in her nineteenth match and has not dropped a round since."}]}, {"kind": "table", "eyebrow": "Events", "cols": ["Event", "Date", "City", "Main event", "Tickets"], "rows": [["IRONCLAD 24", "12 Sep", "Manchester", "Moreno vs Kruger", "limited"], ["IRONCLAD 25", "03 Oct", "Osaka", "Okafor vs Orlov", "on sale"], ["IRONCLAD 26", "08 Nov", "Sao Paulo", "Baptiste vs Vance", "presale"], ["IRONCLAD 27", "19 Dec", "Toronto", "To be announced", "waitlist"]]}, {"kind": "gallery", "eyebrow": "Videos", "tiles": ["Main event highlights", "Top 10 moments", "Backstage chaos", "Full match · Okafor vs Orlov", "Forty seconds with Okafor", "Walk to the curtain"]}, {"kind": "timeline", "eyebrow": "News", "steps": [{"when": "02 SEP", "title": "Kruger gets her rematch", "copy": "The only fighter to beat Moreno since the reign began now headlines IRONCLAD 24."}, {"when": "04 SEP", "title": "Okafor sets his exit", "copy": "Two defences, then the division change he has hinted at all season."}, {"when": "06 SEP", "title": "Sao Paulo closes the year", "copy": "A third meeting between the two fastest risers on the roster."}, {"when": "09 SEP", "title": "A fourth camera on the ramp", "copy": "A small production change with a large effect on how the walk-outs are cut."}]}, {"kind": "pricing", "eyebrow": "Tickets", "plans": [{"name": "Balcony", "amt": "39", "per": "seat", "items": ["Full card", "Big-screen replays", "Doors from 6pm"]}, {"name": "Floor", "amt": "129", "per": "seat", "items": ["Full card", "Floor-level seating", "Early entry at 5pm", "Programme included"]}, {"name": "Ringside", "amt": "349", "per": "seat", "items": ["Full card", "First four rows", "Walk in with the crew", "Signed card after the main event"]}]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "Can I watch if I miss the live broadcast?", "a": "Every card is on replay within two hours and stays up for the rest of the season."}, {"q": "Are tickets transferable?", "a": "Yes, up to 48 hours before doors, from the account you bought them on."}, {"q": "When does the main event start?", "a": "Doors at 6pm local, undercard at 7, main event no later than 9:30."}, {"q": "Is there an age limit?", "a": "Under 14s are fine with an adult. Ringside is 16 and over."}]}]},
  {"name": "Verge", "category": "Agency", "tag": "Straight-talking agency, receipts first", "palette": {"accent": "#ff4d6d", "accent2": "#ffd166"}, "heroTitle": "We ship. Then we talk.", "heroSubtitle": "A twelve-person studio that takes on four engagements a quarter and publishes the outcome of every one — including the ones that missed.", "components": ["Record", "Clients", "Engagements", "Questions", "Rates", "Method", "Verdict"], "sectionCopy": ["Four years of engagements, wins and misses both.", "Who we have shipped for.", "How an engagement is scoped, run and closed.", "The things people ask before signing.", "What an engagement costs, before you ask.", "Four rules we do not break, even when asked.", "A client who let us publish the bad quarter too."], "sections": [{"kind": "metrics", "eyebrow": "Record", "items": [{"k": "Engagements", "v": "64", "sub": "since 2022"}, {"k": "On time", "v": "91%", "sub": "to agreed date"}, {"k": "Repeat", "v": "73%", "sub": "come back"}, {"k": "Team", "v": "12", "sub": "no contractors"}]}, {"kind": "logos", "eyebrow": "Clients", "names": ["NORTHWIND", "ORBIT", "KESTREL", "MERIDIAN", "ATLAS", "LUMEN", "VANE", "SABLE"]}, {"kind": "timeline", "eyebrow": "Engagements", "steps": [{"when": "WEEK 00", "title": "Scope", "copy": "One week, paid, to decide together whether the work is worth doing at all."}, {"when": "WEEK 01", "title": "Build", "copy": "Two people on it full time. You see the work every Friday, finished or not."}, {"when": "WEEK 06", "title": "Ship", "copy": "Live, handed over, documented. No retainer required afterwards."}, {"when": "WEEK 10", "title": "Report", "copy": "We publish what the work actually did. Numbers, not testimonials."}]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "What does an engagement cost?", "a": "Scoping is fixed. The build is quoted after scoping, never before — we have not seen your problem yet."}, {"q": "Do you take retainers?", "a": "No. If the work is done, it is done. We would rather you call us when there is something worth doing."}, {"q": "Who actually does the work?", "a": "The people you meet in scoping. We do not sell seniors and staff juniors."}]}, {"kind": "table", "eyebrow": "Rates", "cols": ["Engagement", "Runs", "Team", "Price"], "rows": [["Scope", "1 week", "2 people", "₹1,80,000"], ["Build", "6 weeks", "2 full time", "₹9,60,000"], ["Build + brand", "10 weeks", "3 full time", "₹16,40,000"], ["Retainer", "monthly", "1 named lead", "₹2,40,000/mo"]]}, {"kind": "split", "eyebrow": "Method", "bullets": ["Two people, both senior. No juniors billed at senior rates.", "You see the work every Friday whether it is finished or not.", "One decision-maker on your side. Committees kill schedules.", "If we are going to miss a date you hear it the week before, not the day of."]}, {"kind": "quote", "eyebrow": "Verdict", "quote": "They told us the first approach was wrong four weeks in, refunded that phase, and started again. We have not briefed anyone else since.", "attr": "Priya Raman · Head of Product, Northwind"}]},
  {"name": "Terrace", "category": "Real Estate", "tag": "A single development, documented honestly", "palette": {"accent": "#c2a878", "accent2": "#8fd3c3"}, "heroTitle": "Nine homes on a north slope.", "heroSubtitle": "A small development built around the trees that were already there, with the survey, the materials list and the delivery schedule published in full.", "components": ["Site", "Residences", "Build", "Terms", "Schedule", "Ground", "Questions"], "sectionCopy": ["What is on the land and what stays.", "Nine homes, four layouts, one orientation.", "Every stage, with the dates we are held to.", "What you pay and when.", "Ground broken to handover, with the dates we hold ourselves to.", "Why this slope and not the flat plot next to it.", "The things buyers ask before the second viewing."], "sections": [{"kind": "metrics", "eyebrow": "Site", "items": [{"k": "Homes", "v": "9", "sub": "no phase two"}, {"k": "Plot", "v": "4.2", "sub": "acres"}, {"k": "Trees kept", "v": "87%", "sub": "of mature stock"}, {"k": "Aspect", "v": "N-NE", "sub": "slope"}]}, {"kind": "gallery", "eyebrow": "Residences", "tiles": ["Type A · courtyard", "Type B · split", "Type C · long", "Type D · corner", "Common house", "Ridge walk"]}, {"kind": "table", "eyebrow": "Build", "cols": ["Stage", "Start", "Duration", "Held to", "Status"], "rows": [["Groundworks", "Mar", "8 wk", "contract", "complete"], ["Frame", "May", "10 wk", "contract", "complete"], ["Envelope", "Aug", "12 wk", "contract", "running"], ["Handover", "Feb", "—", "penalty", "scheduled"]]}, {"kind": "pricing", "eyebrow": "Terms", "plans": [{"name": "Type A", "amt": "₹1.85 Cr", "per": "courtyard · 2 bed", "items": ["1,640 sq ft", "Private court", "Covered parking"]}, {"name": "Type B", "amt": "₹2.40 Cr", "per": "split · 3 bed", "hi": true, "items": ["2,120 sq ft", "Double aspect", "Study"]}, {"name": "Type C", "amt": "₹3.10 Cr", "per": "long · 4 bed", "items": ["2,880 sq ft", "Ridge view", "Two parking"]}]}, {"kind": "timeline", "eyebrow": "Schedule", "steps": [{"when": "MONTH 00", "title": "Ground", "copy": "Excavation and retaining wall along the north slope. Six weeks, weather permitting."}, {"when": "MONTH 04", "title": "Frame", "copy": "Structure topped out. This is when the light in each room stops being a drawing."}, {"when": "MONTH 09", "title": "Fit-out", "copy": "Joinery, glazing, services. Walkthroughs open to buyers from month ten."}, {"when": "MONTH 14", "title": "Handover", "copy": "Snagging closed before keys, not after. Two-year defects cover starts on the day you move in."}]}, {"kind": "split", "eyebrow": "Ground", "bullets": ["North fall of 11 metres, so no house looks into the one below it.", "Every residence takes light on three sides. None share a party wall.", "Existing tree line stays; four homes were dropped from the plan to keep it.", "Water and power run underground from the road — no poles across the view."]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "Can the interiors be changed?", "a": "Layout is fixed once the frame is up. Finishes, joinery and kitchens are open until month nine."}, {"q": "What is not included in the price?", "a": "Stamp duty, registration and any furniture. Landscaping to the plot edge is included."}, {"q": "Is there a maintenance charge?", "a": "₹9,400 a month covers the shared road, lighting, water treatment and the tree line."}, {"q": "Can I see one finished?", "a": "Residence 03 is complete and open on Saturdays. The rest are on the same specification."}]}]},
  {"name": "Cadence", "category": "Wellness", "tag": "A studio that counts what matters", "palette": {"accent": "#a8ff5c", "accent2": "#7beeff"}, "heroTitle": "Show up. We handle the rest.", "heroSubtitle": "Small-group strength and conditioning, coached by name, capped at twelve so nobody trains unsupervised.", "components": ["Studio", "Week", "Coaching", "Membership", "First month", "Members", "Questions"], "sectionCopy": ["One room, proper equipment, twelve people maximum.", "What a week looks like.", "How coaching actually works here.", "What it costs.", "What actually happens in your first four weeks.", "Six months in, in her words.", "Asked at almost every trial session."], "sections": [{"kind": "metrics", "eyebrow": "Studio", "items": [{"k": "Cap", "v": "12", "sub": "per session"}, {"k": "Coaches", "v": "4", "sub": "all full time"}, {"k": "Sessions", "v": "38", "sub": "per week"}, {"k": "Retention", "v": "84%", "sub": "at 12 months"}]}, {"kind": "scroller", "eyebrow": "Week", "cards": [{"label": "MON", "title": "Lower strength", "copy": "Squat and hinge patterns, loaded progressively across the block."}, {"label": "TUE", "title": "Conditioning", "copy": "Intervals set to your own numbers, not the room's."}, {"label": "THU", "title": "Upper strength", "copy": "Press and pull, with accessory work chosen per person."}, {"label": "SAT", "title": "Long piece", "copy": "Ninety minutes, conversational pace, outdoors when it is dry."}]}, {"kind": "split", "eyebrow": "Coaching", "bullets": ["You are assigned a coach by name on day one, not a rotating roster.", "Every session is written down — you can see your own progression any time.", "Loads are set from your numbers, re-tested every six weeks.", "If you miss two weeks we call. That is the whole retention strategy."]}, {"kind": "pricing", "eyebrow": "Membership", "plans": [{"name": "Two / week", "amt": "₹4,500", "per": "per month", "items": ["8 sessions", "Coach assigned", "Progression log"]}, {"name": "Unlimited", "amt": "₹6,900", "per": "per month", "hi": true, "items": ["All sessions", "Coach assigned", "Six-week retest"]}, {"name": "Ten pack", "amt": "₹6,000", "per": "valid 4 months", "items": ["10 sessions", "No commitment", "Transferable"]}]}, {"kind": "timeline", "eyebrow": "First month", "steps": [{"when": "WEEK 01", "title": "Baseline", "copy": "An hour with a coach. Movement, sleep, what you have tried before and why it stopped."}, {"when": "WEEK 02", "title": "Three sessions", "copy": "Small group, capped at eight. You will be the least fit person in the room and nobody will mention it."}, {"when": "WEEK 03", "title": "Adjust", "copy": "The plan changes. It always does. This is the point most people expect to quit and do not."}, {"when": "WEEK 04", "title": "Standing slot", "copy": "You pick fixed times and we hold them. Turning up stops being a decision you make every day."}]}, {"kind": "quote", "eyebrow": "Members", "quote": "I have paid for four gyms and been to none of them. The difference here is that someone notices when I do not come.", "attr": "Meera Joshi · member since March"}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "I have not trained in years. Is that a problem?", "a": "It is the most common starting point here. Half the room began the same way inside the last year."}, {"q": "Can I pause a membership?", "a": "Twice a year, up to six weeks each, no reason needed and no fee."}, {"q": "What if I miss my slot?", "a": "Tell us by the morning and it moves. Miss it silently twice and a coach will call you."}, {"q": "Is there a contract?", "a": "No. Monthly, cancel whenever. The annual plan is cheaper and equally cancellable, pro-rata."}]}]},
  {"name": "Signal", "category": "Portfolio", "tag": "A director's reel, framed as a document", "palette": {"accent": "#ffffff", "accent2": "#ff4d6d"}, "heroTitle": "Twelve films. One question each.", "heroSubtitle": "Commercial and documentary work made over eight years, listed with what it was for and whether it worked.", "components": ["Body", "Selected", "Approach", "Enquiries", "Films", "Credits", "Working together"], "sectionCopy": ["Eight years, twelve films that still hold up.", "The work, newest first.", "How a film gets made here.", "How to start a conversation.", "Four of the twelve, and what each was actually about.", "How the work is made and who else is in the room.", "Before you write."], "sections": [{"kind": "metrics", "eyebrow": "Body of work", "items": [{"k": "Films", "v": "12", "sub": "selected from 61"}, {"k": "Years", "v": "8", "sub": "working"}, {"k": "Longest", "v": "74", "sub": "minutes"}, {"k": "Crew", "v": "6", "sub": "typical size"}]}, {"kind": "gallery", "eyebrow": "Selected", "tiles": ["Low Tide", "Kiln", "The Long Room", "Nightshift", "Verge", "Salt"]}, {"kind": "timeline", "eyebrow": "Approach", "steps": [{"when": "01", "title": "The question", "copy": "Every film starts as one sentence. If it cannot, it is not ready."}, {"when": "02", "title": "The look", "copy": "Decided before the shoot, on paper, so nothing is invented under pressure."}, {"when": "03", "title": "The cut", "copy": "First assembly is deliberately too long. We take away until only the question remains."}]}, {"kind": "quote", "eyebrow": "Enquiries", "quote": "If you already know exactly what you want, you may not need a director.", "attr": "Studio note"}, {"kind": "scroller", "eyebrow": "Films", "cards": [{"label": "2024 · 18 MIN", "title": "Low Water", "copy": "A reservoir town that reappears in drought years. Shot over three summers waiting for one of them."}, {"label": "2023 · 31 MIN", "title": "Night Shift", "copy": "Twelve hours with the people who keep a port running while the city sleeps."}, {"label": "2022 · 12 MIN", "title": "Inheritance", "copy": "A weaver teaching a pattern to a granddaughter who is not sure she wants it."}, {"label": "2021 · 24 MIN", "title": "Return Flight", "copy": "Migrant workers going home for a festival that lasts four days and costs three weeks of pay."}]}, {"kind": "table", "eyebrow": "Credits", "cols": ["Film", "Format", "Crew", "Where it ran"], "rows": [["Low Water", "16mm / 4K", "4", "Berlinale Shorts"], ["Night Shift", "4K", "6", "IDFA"], ["Inheritance", "16mm", "3", "Busan"], ["Return Flight", "4K", "5", "Sheffield DocFest"]]}, {"kind": "faq", "eyebrow": "Working together", "items": [{"q": "Do you take commissions?", "a": "Two a year, and only where the subject is one I would have found on my own."}, {"q": "Who owns the footage?", "a": "You own the film. I keep the right to show it in festivals and on this site."}, {"q": "How long does one take?", "a": "Nine months is the shortest I have managed honestly. Low Water took three years."}, {"q": "What does it cost?", "a": "It depends entirely on the shoot. The first conversation is free and I will tell you if it is not for me."}]}]},
  {"name": "Atelier", "category": "Luxury", "tag": "Editorial restraint for a maker's house", "palette": {"accent": "#e8c98a", "accent2": "#c9a4ff"}, "heroTitle": "Made slowly, on purpose.", "heroSubtitle": "A workshop of eleven people producing a small number of objects each year, in materials chosen to age rather than survive.", "components": ["House", "Collection", "Making", "Provenance", "Materials", "Workshop", "Care"], "sectionCopy": ["Eleven people, one floor, no production line.", "This year's pieces, in the order they left the bench.", "Four stages, none of which can be shortened.", "Every piece leaves with the name of the person who finished it.", "What goes in, and where it comes from.", "Eleven people in one room above a hardware shop.", "After it is yours."], "sections": [{"kind": "metrics", "eyebrow": "The house", "items": [{"k": "Founded", "v": "1974", "sub": "same building since"}, {"k": "Makers", "v": "11", "sub": "no outsourcing"}, {"k": "Pieces / yr", "v": "240", "sub": "deliberately capped"}, {"k": "Waitlist", "v": "14", "sub": "months, typical"}]}, {"kind": "gallery", "eyebrow": "Collection", "tiles": ["Low chair, ash", "Long table, elm", "Cabinet, walnut", "Stool, oak", "Bench, cherry", "Shelf, ash"]}, {"kind": "timeline", "eyebrow": "Making", "steps": [{"when": "STAGE 01", "title": "Selection", "copy": "Boards are chosen wet and left to settle for a full season before anyone cuts."}, {"when": "STAGE 02", "title": "Joinery", "copy": "Cut by hand. No fastener that could not be undone by the person who made it."}, {"when": "STAGE 03", "title": "Surface", "copy": "Oiled in thin coats over nine days. The grain decides when it is finished."}, {"when": "STAGE 04", "title": "Signature", "copy": "Stamped underneath with the maker's mark and the month it left the bench."}]}, {"kind": "quote", "eyebrow": "Provenance", "quote": "We do not sell an object. We hand over a decision someone made carefully.", "attr": "House statement"}, {"kind": "table", "eyebrow": "Materials", "cols": ["Component", "Material", "Source", "Lead time"], "rows": [["Case", "Brushed steel, 316L", "Sheffield", "6 weeks"], ["Strap", "Vegetable-tanned calf", "Tuscany", "4 weeks"], ["Dial", "Enamel over copper", "In house", "9 weeks"], ["Movement", "Hand-wound, 42h", "Le Locle", "14 weeks"]]}, {"kind": "split", "eyebrow": "Workshop", "bullets": ["Nothing leaves without the maker's mark on the inside of the case back.", "We make roughly 240 pieces a year. That number has not moved in a decade.", "Every enamel dial is fired four times. Around one in five is thrown away.", "Repairs come back to the bench of whoever built it, for as long as they are still with us."]}, {"kind": "faq", "eyebrow": "Care", "items": [{"q": "How often does it need servicing?", "a": "Every five to seven years. Sooner if it has been swimming, which it should not have."}, {"q": "What does a service cost?", "a": "Nothing for the first ten years. After that, at cost, which is currently ₹18,000."}, {"q": "Can I commission something?", "a": "Yes, four a year. Expect eighteen months and a conversation before any drawing."}, {"q": "Is there a waiting list?", "a": "For the enamel dials, about eleven months. For steel, we usually have stock."}]}]},
  {"name": "Ledger", "category": "SaaS", "tag": "Numbers-forward product marketing", "palette": {"accent": "#7bff9e", "accent2": "#7beeff"}, "heroTitle": "Close the month in a morning.", "heroSubtitle": "Reconciliation, approvals and audit trail in one place — built for finance teams who would rather not export another spreadsheet.", "components": ["Impact", "Workflow", "Controls", "Coverage", "Teams", "Pricing", "Questions"], "sectionCopy": ["What teams report after their first full quarter.", "From bank feed to signed-off close, without leaving the tool.", "Every action is attributable, reversible and logged.", "Where it already connects.", "Finance teams closing on this today.", "Priced per entity, because that is what actually drives the work.", "What controllers ask on the first call."], "sections": [{"kind": "metrics", "eyebrow": "Impact", "items": [{"k": "Close time", "v": "-71%", "sub": "median, first quarter"}, {"k": "Auto-matched", "v": "96.2%", "sub": "of transactions"}, {"k": "Audit prep", "v": "4h", "sub": "down from 3 days"}, {"k": "Teams", "v": "1,900", "sub": "on the platform"}]}, {"kind": "timeline", "eyebrow": "Workflow", "steps": [{"when": "STEP 01", "title": "Ingest", "copy": "Bank and card feeds land continuously; nothing waits for a monthly dump."}, {"when": "STEP 02", "title": "Match", "copy": "Rules run first, the model handles the tail, a human sees only the genuinely odd."}, {"when": "STEP 03", "title": "Approve", "copy": "Thresholds route to the right approver. Nothing self-approves, ever."}, {"when": "STEP 04", "title": "Close", "copy": "Sign-off writes an immutable record with every supporting document attached."}]}, {"kind": "table", "eyebrow": "Controls", "cols": ["Control", "Scope", "Enforced", "Reversible", "Logged"], "rows": [["Segregation of duties", "org", "yes", "n/a", "yes"], ["Approval thresholds", "entity", "yes", "yes", "yes"], ["Journal edits", "account", "blocked", "yes", "yes"], ["Data export", "role", "scoped", "n/a", "yes"]]}, {"kind": "split", "eyebrow": "Coverage", "bullets": ["Direct feeds from the major Indian and international banks.", "Two-way sync with the ledger you already keep.", "Read-only auditor access that expires on a date you set.", "Full export at any time — the data stays yours."]}, {"kind": "logos", "eyebrow": "Teams", "names": ["NORTHWIND", "ARBOR", "KESTREL", "MERIDIAN", "LUMEN", "SABLE", "VANE", "ORBIT"]}, {"kind": "pricing", "eyebrow": "Pricing", "plans": [{"name": "Single", "amt": "₹24,000", "per": "per month", "items": ["One legal entity", "Up to 6 users", "Bank and card feeds", "Email support"]}, {"name": "Group", "amt": "₹68,000", "per": "per month", "hi": true, "items": ["Up to 8 entities", "Unlimited users", "Intercompany elimination", "Audit export", "Named contact"]}, {"name": "Enterprise", "amt": "Talk to us", "per": "annual only", "items": ["Unlimited entities", "SSO and SCIM", "Custom controls", "Quarterly review", "99.9% written into the contract"]}]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "How long does migration take?", "a": "Two weeks for a single entity, six for a group. We do the mapping, you approve it."}, {"q": "Does it replace our ERP?", "a": "No. It sits on top and closes the month. Journals post back to whatever you already run."}, {"q": "What happens if we leave?", "a": "Full export in your own chart of accounts, plus the audit trail, within one business day."}, {"q": "Who can see the numbers?", "a": "Only who you say. Every view is logged and the log cannot be edited, including by us."}]}]},
  {"name": "Kanso", "category": "Restaurant", "tag": "A single-room restaurant, told plainly", "palette": {"accent": "#ff8f6b", "accent2": "#ffd166"}, "heroTitle": "Sixteen seats. One sitting.", "heroSubtitle": "A counter menu that changes when the market changes, served once a night to whoever booked first.", "components": ["Room", "Tonight", "Rhythm", "Booking", "Kitchen", "Menu", "Questions"], "sectionCopy": ["One room, one counter, no second service.", "What is being cooked this week.", "How an evening runs, start to finish.", "How to get a seat.", "Four cooks, one pass, no shouting.", "What is on, and what it costs.", "Before you book."], "sections": [{"kind": "metrics", "eyebrow": "The room", "items": [{"k": "Seats", "v": "16", "sub": "counter only"}, {"k": "Sittings", "v": "1", "sub": "per evening"}, {"k": "Courses", "v": "9", "sub": "set menu"}, {"k": "Notice", "v": "21", "sub": "days, booking opens"}]}, {"kind": "scroller", "eyebrow": "Tonight", "cards": [{"label": "I", "title": "Cured kingfish", "copy": "Citrus from the same grower since the first year. Salt, time, nothing else."}, {"label": "II", "title": "Charred greens", "copy": "Whatever came in that morning, over embers, dressed at the counter."}, {"label": "III", "title": "Clay-pot rice", "copy": "Cooked in front of you and rested while the next course is plated."}, {"label": "IV", "title": "Burnt honey", "copy": "A single spoon. The kitchen's opinion on how the meal should end."}]}, {"kind": "timeline", "eyebrow": "Rhythm", "steps": [{"when": "18:30", "title": "Doors", "copy": "Everyone is seated together. The menu is not read out; it arrives."}, {"when": "19:00", "title": "Counter", "copy": "Nine courses, paced by the kitchen rather than the clock."}, {"when": "21:30", "title": "Close", "copy": "One sitting means no one is moved along."}]}, {"kind": "quote", "eyebrow": "Booking", "quote": "We would rather cook for sixteen people properly than for sixty adequately.", "attr": "The kitchen"}, {"kind": "split", "eyebrow": "Kitchen", "bullets": ["The menu is decided at 3pm based on what arrived that morning.", "One sitting a night means every plate leaves the pass at the same temperature it was meant to.", "No substitutions, and we will tell you what is in everything before you sit down.", "The person who cooked your fish will bring it to you and say what it is."]}, {"kind": "table", "eyebrow": "Menu", "cols": ["Course", "Dish", "From", "Supplement"], "rows": [["01", "Cured amberjack, green apple", "Mangalore", "—"], ["02", "Charred leek, walnut, aged cheese", "Nashik", "—"], ["03", "Line-caught bream over embers", "Malvan", "—"], ["04", "Rice, two years old, cooked in dashi", "Wayanad", "—"], ["05", "Burnt honey, cultured cream", "In house", "₹450 with the pairing"]]}, {"kind": "faq", "eyebrow": "Questions", "items": [{"q": "Can you cater to dietary needs?", "a": "Tell us at booking and we will cook a full alternative menu. Tell us on the night and we cannot."}, {"q": "How long is dinner?", "a": "Two hours and forty minutes. Everyone is seated at 7.30 and the room turns once."}, {"q": "Do you take walk-ins?", "a": "No. Sixteen seats, booked ahead, and the list opens on the first of each month."}, {"q": "What is the cancellation policy?", "a": "Seventy-two hours for a full refund. Inside that we will try to fill the seat and refund you if we do."}]}]},
  {"name": "Observatory", "category": "Research", "tag": "Instrument-grade data storytelling", "palette": {"accent": "#ffb454", "accent2": "#5ad1ff"}, "heroTitle": "Every reading, held to the light.", "heroSubtitle": "A continuous-monitoring station publishing open atmospheric records — measured hourly, corrected daily, never rounded away.", "components": ["Station", "Instruments", "Record", "Method", "Standing", "History", "Using the data"], "sectionCopy": ["Four sensor arrays on a ridge line, reporting without interruption since the first winter.", "What each instrument sees, at what cadence, and the tolerance it holds to.", "The full series, unsmoothed. Anomalies stay in — they are the interesting part.", "How a reading becomes a record: capture, correct, cross-check, publish.", "We publish what the instruments report. Interpretation belongs to the reader.", "Twenty-six years of continuous readings, including the gaps.", "For anyone about to cite this."], "sections": [{"kind": "metrics", "eyebrow": "Station 01 · Ridge", "items": [{"k": "Uptime", "v": "99.94%", "sub": "rolling 12 months"}, {"k": "Cadence", "v": "60s", "sub": "per sensor array"}, {"k": "Series", "v": "8.4M", "sub": "published readings"}, {"k": "Drift", "v": "±0.02", "sub": "post-correction"}]}, {"kind": "scroller", "eyebrow": "Instruments", "cards": [{"label": "ARR-01", "title": "Aerosol column", "copy": "Optical depth across six bands, sampled through the full diurnal cycle."}, {"label": "ARR-02", "title": "Thermal profile", "copy": "Ground-to-inversion gradient, resolved at ten-metre intervals."}, {"label": "ARR-03", "title": "Particulate count", "copy": "Size-binned counts with humidity compensation applied at source."}, {"label": "ARR-04", "title": "Spectral sky", "copy": "Continuous radiance sampling; calibrated against reference lamp weekly."}]}, {"kind": "table", "eyebrow": "Comparative record", "cols": ["Array", "Cadence", "Tolerance", "Corrected", "Public"], "rows": [["ARR-01", "60 s", "±0.02", "daily", "yes"], ["ARR-02", "60 s", "±0.05 K", "daily", "yes"], ["ARR-03", "30 s", "±3%", "hourly", "yes"], ["ARR-04", "300 s", "±0.8%", "weekly", "yes"]]}, {"kind": "split", "eyebrow": "Method", "bullets": ["Capture at source, unfiltered and timestamped to the station clock.", "Correct against the reference set — every correction is logged and reversible.", "Cross-check neighbouring arrays before anything is marked clean.", "Publish the corrected series alongside the raw one. Both stay available."]}, {"kind": "quote", "eyebrow": "Standing", "quote": "An instrument that only reports agreeable numbers has stopped being an instrument.", "attr": "Station handbook, section one"}, {"kind": "timeline", "eyebrow": "History", "steps": [{"when": "1998", "title": "First light", "copy": "Two instruments, one shed, hourly readings written by hand into a bound ledger."}, {"when": "2004", "title": "Automation", "copy": "Logging moves to disk. The handwritten years are re-keyed twice by different people and reconciled."}, {"when": "2011", "title": "The gap", "copy": "Nine weeks lost to a lightning strike. We publish the gap rather than interpolate across it."}, {"when": "2019", "title": "Open record", "copy": "The full series goes public, raw and corrected side by side, with every correction dated."}]}, {"kind": "faq", "eyebrow": "Using the data", "items": [{"q": "Can I use this in published work?", "a": "Yes, freely, with attribution to the station and the access date. No permission needed."}, {"q": "Raw or corrected?", "a": "Both are published. Corrected applies drift and calibration; raw is exactly what the instrument wrote."}, {"q": "How are corrections recorded?", "a": "Every correction carries a date, a reason and the person who made it. Nothing is silently amended."}, {"q": "What about the 2011 gap?", "a": "It stays a gap. We will not interpolate nine weeks and present it as measurement."}]}]},
  {name:'Forma',category:'Portfolio',heroTitle:'Spaces Crafted With Intention',heroSubtitle:'A boutique architecture studio designing residences and cultural spaces that endure with quiet elegance.',components:['Works','Process','Studio'],sectionCopy:['Selected commissions spanning residences, galleries, and contemplative landscapes.','Every project begins with light, site, and the client\u2019s unspoken needs.','A small atelier of architects devoted to material honesty and restraint.']},
  {name:'Monolith',category:'SaaS'},{name:'Horizon',category:'Portfolio'},
  /* The "Power" preset: a full-screen video hero over a scrubbed background clip.
     Carries a `powerHero` block, which the renderer further down swaps in place
     of the ordinary .pv-hero — the same delegation pattern the `cinema` preset
     uses. The name is one word on purpose: presetFromPath matches
     name.toLowerCase() against the URL slug exactly, so a name like "Power 3D"
     would be reached at /preset/power-3d and never resolve. */
  {"name": "Power", "category": "SaaS", "tag": "A full-screen video hero built around one statement",
   "palette": {"accent": "#a855f7", "accent2": "#fcd34d"},
   "heroTitle": "Power AI", "heroSubtitle": "The most powerful AI ever deployed in talent acquisition.",
   "ctas": ["Schedule a Consult", "Sign Up"],
   "powerHero": {
     "video": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4",
     "brand": "Power",
     "nav": [{"label": "Features", "chevron": true}, {"label": "Solutions"}, {"label": "Plans"}, {"label": "Learning", "chevron": true}],
     "signup": "Sign Up",
     "titlePlain": "Power ", "titleGradient": "AI",
     "subtitle": ["The most powerful AI ever deployed", "in talent acquisition"],
     "cta": "Schedule a Consult",
     "marqueeLabel": ["Relied on by brands", "across the globe"],
     "brands": ["Vortex", "Nimbus", "Prysma", "Cirrus", "Kynder", "Halcyn"]
   },
   "components": ["Signal", "Clients", "Process", "Questions"],
   "sectionCopy": ["What the model sees before a recruiter opens the file.",
     "Teams that hire against a scorecard rather than a hunch.",
     "How a role goes from open to signed.",
     "Asked in every procurement review."],
   "sections": [
     {"kind": "metrics", "eyebrow": "Signal", "items": [
       {"k": "Time to slate", "v": "6d", "sub": "median, from brief"},
       {"k": "Screened", "v": "2.4M", "sub": "profiles indexed"},
       {"k": "Offer rate", "v": "71%", "sub": "of final panels"},
       {"k": "Reviewed", "v": "100%", "sub": "decisions logged"}]},
     {"kind": "logos", "eyebrow": "Clients", "names": ["VORTEX", "NIMBUS", "PRYSMA", "CIRRUS", "KYNDER", "HALCYN"]},
     {"kind": "timeline", "eyebrow": "Process", "steps": [
       {"when": "DAY 00", "title": "Brief", "copy": "The scorecard is written first. If it cannot be scored, it does not go in."},
       {"when": "DAY 02", "title": "Slate", "copy": "Ranked candidates with the reasoning attached to each one, not just an order."},
       {"when": "DAY 06", "title": "Panel", "copy": "Structured interviews against the same scorecard the model used."},
       {"when": "DAY 14", "title": "Close", "copy": "Offer, decline or hold — every outcome written back into the record."}]},
     {"kind": "faq", "eyebrow": "Questions", "items": [
       {"q": "Does the model make the decision?", "a": "No. It ranks and explains. A person makes every call, and the call is logged against the scorecard."},
       {"q": "How is bias handled?", "a": "Scoring runs on the criteria in the brief only. Every ranking ships with the reasoning, so a bad criterion is visible rather than buried."},
       {"q": "Where does the data come from?", "a": "Your applicant records plus sources you connect. Nothing is bought in, and nothing leaves your tenant."},
       {"q": "Can we audit a past decision?", "a": "Yes. Every slate, score and override is retained with its inputs and can be replayed."}]}]},
  {name:'Eclipse',category:'SaaS'},{name:'Paloma',category:'Luxury'},{name:'Vertex',category:'Portfolio'}
];
const templateByName=n=>TEMPLATES.find(t=>t.name===n)||null;

/* ---- Server auth. The session is an HttpOnly cookie; the browser never holds a token. ---- */
async function api(path,opts={}){
  const r=await fetch(path,{credentials:'same-origin',headers:{'Content-Type':'application/json'},...opts});
  const t=await r.text(); let d={}; try{d=t?JSON.parse(t):{}}catch(e){d={error:t||('HTTP '+r.status)}}
  if(!r.ok)throw Object.assign(new Error(d.error||('Request failed ('+r.status+')')),{status:r.status,data:d});
  return d;
}
let authMode='signup';
function authError(msg){const el=$('#authError');if(!el)return;if(!msg){el.classList.add('hidden');el.textContent='';return}el.textContent=msg;el.classList.remove('hidden')}
// "sumit.khatod1990@x.com" -> "Sumit Khatod"; a mailbox name is not a display name
function displayNameFromEmail(email){
  const local=String(email||'').split('@')[0].replace(/\d+$/,'');
  const words=local.split(/[._\-+]+/).filter(Boolean)
    .map(w=>w.charAt(0).toUpperCase()+w.slice(1));
  return words.slice(0,2).join(' ')||String(email||'').split('@')[0];
}
function applySession(d){
  state.auth={userId:d?.user?.id||'',email:d?.user?.email||'',workspaceId:d?.workspaceId||'',role:d?.role||'',emailVerified:!!d?.user?.emailVerified};
  if(!state.userName&&state.auth.email)state.userName=displayNameFromEmail(state.auth.email);
  saveState();
  loadCredits();
}
// The wallet lives on the server. Nothing was reading it, so the balance showed
// as "—" no matter what had been granted.
// The image gateway charges 25 credits per output; the button used to claim 12.
const IMAGE_CREDITS_PER_OUTPUT=25;
// Generated media lives behind an authenticated asset route, so a published
// site has to reference the asset *id* and serve it through the public,
// site-scoped route instead of the studio URL.
// A mockup is only pixels — nothing in it can be clicked. Reading it with a
// vision model turns it into real sections the builder renders as components.
function ctasFromVision(o){return (o&&o.ctas||[]).filter(Boolean).map(c=>String(c).slice(0,40)).slice(0,3)}
// The hero's small label read "GALLERY · SPATIAL WEBSITE" on every site ever
// built here. Once the brand is known it belongs to the business instead.
window.heroEyebrow=function(p){
  const brand=String((state.globalHeader&&state.globalHeader.logo)||'').trim();
  const page=String((p&&p.name)||'Home');
  if(!brand||brand==='YOUR BRAND')return escV(page+' · Spatial website');
  return escV(page==='Home'?brand:brand+' · '+page);
};
async function imageToSite(btn){
  const assetId=btn.dataset.asset||'';
  const msg=document.getElementById('studioMsg');
  if(!assetId){if(msg)msg.textContent='That image is still uploading — try again in a moment.';return}
  const label=btn.textContent;
  btn.disabled=true;btn.textContent='Reading…';
  if(msg)msg.textContent='Reading the design — layout, copy and buttons.';
  try{
    const d=await api('/api/ai/vision-site',{method:'POST',body:JSON.stringify({assetId})});
    const out=parseModelJson(d&&d.text);
    if(!out||!out.heroTitle){if(msg)msg.textContent='Could not read that image as a website.';return}
    recordUndo();
    if(out.projectName){
      state.projectName=String(out.projectName).slice(0,80);
      if(state.globalHeader)state.globalHeader.logo=String(out.projectName).slice(0,28);
    }
    if(ctasFromVision(out)[0]&&state.globalHeader)state.globalHeader.cta=ctasFromVision(out)[0];
    state.heroTitle=String(out.heroTitle).slice(0,90);
    if(out.heroSubtitle)state.heroSubtitle=String(out.heroSubtitle).slice(0,180);
    if(out.palette)state.templatePalette=Object.assign({},state.templatePalette,{
      accent:out.palette.accent||(state.templatePalette||{}).accent,
      accent2:out.palette.accent2||(state.templatePalette||{}).accent2});
    const secs=(out.sections||[]).filter(x=>x&&x.name).slice(0,7);
    if(secs.length){
      state.components=secs.map(x=>String(x.name).slice(0,28));
      state.sectionCopy=secs.map(x=>String(x.copy||'').slice(0,200));
      state.templateSections=null;
    }
    // button labels read straight off the design
    const ctas=(out.ctas||[]).filter(Boolean).map(c=>String(c).slice(0,40)).slice(0,3);
    if(ctas.length)state.heroCtas=ctas;
    // the design's own sections become the sitemap, and the content lands on
    // the home page rather than on whichever page was last open
    if(secs.length&&window.applyPagesFromSections)window.applyPagesFromSections(secs,{cta:ctas[0]});
    // the mockup itself must not become the background — it is the source, not the art
    state.heroImage='';state.heroImageAssetId='';
    state.heroVideo='';state.heroVideoAssetId='';
    // the brief drives the hero visual, so it has to describe this design
    state.prompt=[out.projectName,out.heroTitle,out.heroSubtitle]
      .filter(Boolean).join('. ').slice(0,240);
    // the mockup already contains the right photograph; the model describes it
    // so the background is that scene rather than another picture of a website
    state.heroVisual=String(out.heroVisual||'').slice(0,240);
    state.generation=7;state.selected='hero';
    makeVersion('Built from image');saveState();
    toast('Built '+(state.components||[]).length+' sections from that design');
    navigate('builder');
    // One click has to finish the job. Stopping at the copy left every
    // image-built site sitting on a blank hero with no way to tell that the
    // background was a separate, hidden step.
    if(state.credits!=null&&state.credits<mediaCost()){
      toast('Site ready — the background needs '+mediaCost()+' credits');
    }else{
      autoHeroMedia();
    }
  }catch(e){
    if(msg)msg.textContent=String(e&&e.message||e).slice(0,140);
  }finally{
    btn.disabled=false;btn.textContent=label;
  }
}
// Builds the hero image and its video loop while the builder is already open.
// Progress goes to the Edit tab's background panel when it is on screen, and to
// a toast otherwise, so the wait is never silent.
async function autoHeroMedia(){
  const say=function(m){
    const note=document.querySelector('.agent-media-msg');
    if(note)note.textContent=m||'';else toast(m);
  };
  toast('Now generating the background — this takes a couple of minutes');
  try{
    await buildHeroMedia(say);
    await loadCredits(true);
  }catch(e){}
  saveState();
  if(state.route==='builder')render('builder');
  try{if(window.__decorateCanvasMedia)window.__decorateCanvasMedia()}catch(e){}
  toast(state.heroVideoAssetId?'Background video is live behind the headline'
    :state.heroImageAssetId?'Background image set — the video step did not finish'
    :'Site is ready — the background could not be generated');
}
function assetIdFromUrl(u){const m=String(u||'').match(/\/api\/assets\/([^/]+)\/content/);return m?m[1]:''}
async function useAsHero(btn){
  const kind=btn.dataset.kind;let url=btn.dataset.url||'';
  const clearing=(kind==='video'?state.heroVideoAssetId:state.heroImageAssetId)&&
                 (kind==='video'?state.heroVideo:state.heroImage)===url;
  if(clearing){
    if(kind==='video'){state.heroVideo='';state.heroVideoAssetId=''}
    else{state.heroImage='';state.heroImageAssetId=''}
    saveState();render('studio');return;
  }
  let assetId=assetIdFromUrl(url);
  if(!assetId&&kind==='video'&&state.videoJob&&state.videoJob.id){
    // /content redirects cross-origin, so ask the server to store and report back
    btn.disabled=true;btn.textContent='Saving…';
    try{
      const stored=await api('/api/video/jobs/'+encodeURIComponent(state.videoJob.id)+'/store',{method:'POST'});
      // the job URL re-downloads from the provider on every read; the stored
      // asset is the one that actually plays
      if(stored&&stored.assetId){assetId=stored.assetId;url=stored.url;btn.dataset.url=stored.url}
    }catch(e){}
    btn.disabled=false;
  }
  if(!assetId){toast('Could not store that media yet — try again in a moment');render('studio');return}
  if(kind==='video'){state.heroVideo=url;state.heroVideoAssetId=assetId}
  else{state.heroImage=url;state.heroImageAssetId=assetId}
  saveState();render('studio');
  toast((kind==='video'?'Video':'Image')+' set as hero — publish to push it live');
}
function slugify(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48)}
function defaultSlug(){return slugify(state.projectName||'my-site')||'my-site'}
// Everything a visitor needs to see the site, with nothing private in it.
function siteSnapshot(){
  return {
    projectName:state.projectName,
    heroTitle:state.heroTitle,heroSubtitle:state.heroSubtitle,
    components:state.components||[],sectionCopy:state.sectionCopy||[],
    sections:state.templateSections||null,palette:state.templatePalette||null,
    scenePreset:state.scenePreset||'orbital-hero',
    heroImageAssetId:state.heroImageAssetId||'',heroVideoAssetId:state.heroVideoAssetId||'',
    ctas:(state.heroCtas||[]).slice(0,3),
    brand:state.brandProfile||null
  };
}
async function publishSite(btn){
  const input=document.getElementById('publishSlug');
  const msg=document.getElementById('publishMsg');
  const slug=slugify(input&&input.value)||defaultSlug();
  if(slug.length<3){if(msg)msg.textContent='Pick an address of at least 3 characters.';return}
  const label=btn?btn.textContent:'';
  if(btn){btn.disabled=true;btn.textContent='Publishing…'}
  try{
    const d=await api('/api/publish',{method:'POST',body:JSON.stringify({
      slug,projectName:state.projectName,site:siteSnapshot()})});
    state.published=true;state.publishedUrl=d.url;state.publishedSlug=d.slug;
    if(state.publishSettings){state.publishSettings.lastPublished=new Date().toLocaleString();state.publishSettings.subdomain=d.slug}
    const p=(state.projects||[]).find(x=>x.name===state.projectName);
    if(p)p.status='Published';else state.projects.unshift({name:state.projectName,status:'Published'});
    makeVersion('Published');saveState();closeModal();render('builder');
    toast('Live at '+d.url);
  }catch(e){
    if(msg)msg.textContent=String(e&&e.message||e).slice(0,140);
  }finally{
    if(btn){btn.disabled=false;btn.textContent=label||'Publish now →'}
  }
}
// A published site is a public URL, so it renders with no session at all.
async function showPublishedSite(slug){
  try{
    const r=await fetch('/api/sites/'+encodeURIComponent(slug),{cache:'no-store'});
    if(!r.ok)return false;
    const d=await r.json();
    let s=d.site||{};
    if(typeof s==='string'){try{s=JSON.parse(s)}catch(e){s={}}}
    const tpl={name:d.projectName||slug,category:'',tag:'',
      palette:s.palette||{accent:'#dfff45',accent2:'#7beeff'},
      heroTitle:s.heroTitle,heroSubtitle:s.heroSubtitle,
      heroImage:s.heroImageAssetId?('/api/sites/'+encodeURIComponent(slug)+'/asset/'+encodeURIComponent(s.heroImageAssetId)):'',
      heroVideo:s.heroVideoAssetId?('/api/sites/'+encodeURIComponent(slug)+'/asset/'+encodeURIComponent(s.heroVideoAssetId)):'',
      components:s.components||[],sectionCopy:s.sectionCopy||[],sections:s.sections||[],
      ctas:s.ctas||[]};
    document.title=(d.projectName||slug)+' — built with Scen';
    showPreset(tpl);
    // this is the customer's own site, not a template being shopped for
    const bar=document.querySelector('.pv-bar');if(bar)bar.remove();
    const kick=document.querySelector('#presetView .pv-hero .pv-kick');
    if(kick)kick.textContent=(d.projectName||slug);
    // muted+playsinline is autoplay-eligible, but some browsers still need the
    // explicit call; if it is refused the poster frame simply stays put
    const bg=document.querySelector('#presetView .pv-media-vid');
    if(bg){
      const go=()=>{const p=bg.play();if(p&&p.catch)p.catch(()=>{})};
      go();
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)go()});
      ['touchstart','click'].forEach(ev=>document.addEventListener(ev,go,{once:true,passive:true}));
    }
    return true;
  }catch(e){return false}
}
// Mirrors reserveVideoCredits on the server so the button never promises a
// price the gateway will not charge.
function videoCredits(seconds,resolution){
  const rate=resolution==='4K'?45:resolution==='1080p'?20:12;
  return Math.max(1,Number(seconds)||8)*rate;
}
let videoPollTimer=null;
function stopVideoPoll(){clearTimeout(videoPollTimer);videoPollTimer=null}
async function pollVideoJob(){
  stopVideoPoll();
  const job=state.videoJob;
  if(!job||!job.id||job.status==='completed'||job.status==='failed')return;
  try{
    const d=await api('/api/video/jobs/'+encodeURIComponent(job.id));
    const next=Object.assign({},job,{status:d.status,progress:d.progress,detail:d.detail});
    const changed=next.status!==job.status||next.progress!==job.progress;
    state.videoJob=next;saveState();
    if(changed&&state.route==='studio')render('studio');
    if(d.status==='completed'){await loadCredits(true);toast('Video ready');return}
    if(d.status==='failed'){toast('Video generation failed');return}
  }catch(e){
    // a transient status error should not kill the poll
  }
  videoPollTimer=setTimeout(pollVideoJob,5000);
}
async function videoGenerate(btn){
  const ta=document.getElementById('studioPrompt');
  const prompt=((ta&&ta.value)||'').trim();
  const msg=document.getElementById('studioMsg');
  if(!prompt){if(msg)msg.textContent='Describe the shot first.';return}
  const aspectRatio=(document.getElementById('studioAspect')||{}).value||'16:9';
  const seconds=Number((document.getElementById('videoSeconds')||{}).value||8);
  const resolution=(document.getElementById('videoRes')||{}).value||'1080p';
  state.studioPrompt=prompt;state.videoAspect=aspectRatio;
  state.videoSeconds=seconds;state.videoRes=resolution;saveState();
  const label=btn?btn.textContent:'';
  if(btn){btn.disabled=true;btn.textContent='Submitting…'}
  if(msg)msg.textContent='Queuing the render — you can leave this page, it keeps going.';
  try{
    const d=await api('/api/video/jobs',{method:'POST',body:JSON.stringify({
      mode:'text',prompt,aspectRatio,seconds,resolution})});
    state.videoJob={id:d.id,status:d.status||'queued',progress:d.progress||0,
      provider:d.provider,seconds:d.seconds,prompt};
    saveState();await loadCredits(true);render('studio');
    pollVideoJob();
  }catch(e){
    const m=String(e&&e.message||e);
    if(msg)msg.textContent=/insufficient|credit/i.test(m)?'Not enough credits for that render.':m.slice(0,140);
  }finally{
    const b=document.querySelector('[data-action="studioGenerate"]');
    if(b){b.disabled=false;b.textContent=label||'Generate'}
  }
}
async function studioGenerate(btn){
  const ta=document.getElementById('studioPrompt');
  const prompt=((ta&&ta.value)||'').trim();
  const msg=document.getElementById('studioMsg');
  if(!prompt){if(msg)msg.textContent='Describe the image first.';return}
  const aspect=(document.getElementById('studioAspect')||{}).value||'16:9';
  const count=Math.max(1,Math.min(4,Number((document.getElementById('studioCount')||{}).value||1)));
  state.studioPrompt=prompt;state.studioAspect=aspect;state.studioCount=count;saveState();
  const label=btn?btn.textContent:'';
  if(btn){btn.disabled=true;btn.textContent='Generating…'}
  if(msg)msg.textContent='Sending to the image gateway — this usually takes 10–30 seconds.';
  try{
    const d=await api('/api/image/generate',{method:'POST',body:JSON.stringify({
      mode:'generate',prompt,aspectRatio:aspect,size:'1K',quality:'medium',format:'png',count})});
    const made=(d.images||[]).filter(x=>x&&x.url);
    if(!made.length){
      // credits are released server-side when generation fails, so say what happened
      const why=(d.images||[]).map(x=>x&&x.storageError).filter(Boolean)[0];
      if(msg)msg.textContent=why?('Generated but could not be stored: '+why):'No image came back. Try a different prompt.';
      return;
    }
    state.studioResults=made.map(x=>({url:x.url,assetId:x.assetId,prompt,kind:'image'})).concat(state.studioResults||[]).slice(0,12);
    saveState();
    await loadCredits(true);
    render('studio');
    toast(made.length>1?`${made.length} images generated`:'Image generated');
  }catch(e){
    const m=String(e&&e.message||e);
    if(msg)msg.textContent=/insufficient|credit/i.test(m)?'Not enough credits for that generation.':m.slice(0,140);
  }finally{
    const b=document.querySelector('[data-action="studioGenerate"]');
    if(b){b.disabled=false;b.textContent=label||'Generate'}
  }
}
let creditsLoadedAt=0;
async function loadCredits(force){
  if(!state.auth)return;
  if(!force&&Date.now()-creditsLoadedAt<15000)return;
  creditsLoadedAt=Date.now();
  try{
    const r=await fetch('/api/billing/credits',{credentials:'same-origin',cache:'no-store'});
    if(!r.ok)return;
    const d=await r.json();
    const next=Number(d?.wallet?.available);
    if(!Number.isFinite(next))return;
    if(next!==state.credits){state.credits=next;saveState();if(state.route)render(state.route)}
    else{state.credits=next;saveState()}
  }catch(e){}
}
function clearSession(){state.auth=null;state.onboarded=false;saveState()}
async function restoreSession(){
  try{const d=await api('/api/auth/me');applySession(d);return true}
  catch(e){state.auth=null;return false}
}

/* ---- Storefront. Products live server-side; the browser sends ids + quantities
   only, never an amount. Prices here are rupees, the API uses paise. ---- */
const toMinor=r=>Math.round(Number(r||0)*100);
const fromMinor=m=>Math.round(Number(m||0))/100;
async function loadStoreProducts(){
  if(!state.auth?.workspaceId)return false;
  try{
    const d=await api('/api/store/products');
    state.products=(d.products||[]).map(p=>({id:p.id,name:p.name,price:fromMinor(p.price_minor),sku:p.sku||'',status:p.status==='active'?'Active':'Draft',stock:Number(p.stock||0),category:p.category||''}));
    saveState();return true;
  }catch(e){return false}
}
async function saveStoreProduct(p){
  const d=await api('/api/store/products',{method:'POST',body:JSON.stringify({
    id:/^prd_/.test(p.id)?p.id:undefined,name:p.name,sku:p.sku||'',
    priceMinor:toMinor(p.price),stock:Number(p.stock||0),
    status:p.status==='Active'?'active':'draft',category:p.category||''})});
  return d.product;
}
/* Typed block a template can attach to a section (metrics, scroller, table,
   split, quote). Returns '' when the active template has none, so sections
   without one keep the plain title+copy layout. */
/* Counts a metric up when it first scrolls into view. Splits the value so
   prefixes/suffixes (±, %, M, s) survive and only the number animates. */
function countUpMetrics(root){
  const els=[...(root||document).querySelectorAll('.t-metric b:not([data-counted])')];
  if(!els.length)return;
  const run=el=>{
    el.dataset.counted='1';
    const raw=el.textContent.trim();
    const m=raw.match(/^([^\d.-]*)(-?[\d,]*\.?\d+)(.*)$/);
    if(!m)return;
    const pre=m[1],suf=m[3],target=parseFloat(m[2].replace(/,/g,''));
    if(!isFinite(target))return;
    const dec=(m[2].split('.')[1]||'').length, dur=900, t0=performance.now();
    const fmt=n=>pre+(dec?n.toFixed(dec):Math.round(n).toLocaleString('en-IN'))+suf;
    let settled=false;
    const settle=()=>{if(!settled){settled=true;el.textContent=raw}};
    const tick=now=>{
      if(settled)return;
      const p=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-p,3);
      el.textContent=fmt(target*e);
      if(p<1)requestAnimationFrame(tick); else settle();
    };
    el.textContent=fmt(0);requestAnimationFrame(tick);
    // rAF is throttled in background tabs; never leave a metric stranded at zero
    setTimeout(settle,dur+400);
  };
  if(!('IntersectionObserver'in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){els.forEach(e=>e.dataset.counted='1');return}
  const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){run(x.target);io.unobserve(x.target)}}),{threshold:.4});
  els.forEach(e=>io.observe(e));
}
function templateBlock(index){
  const sec=(state.templateSections||[])[index];
  if(!sec||!sec.kind)return '';
  const pal=state.templatePalette||{};
  const E=v=>escV(v==null?'':v);
  const style=`--tacc:${E(pal.accent||'#dfff45')};--tacc2:${E(pal.accent2||'#7beeff')}`;
  let body='';
  if(sec.kind==='metrics')
    body=`<div class="t-metrics">${(sec.items||[]).map(m=>`<div class="t-metric"><span class="k">${E(m.k)}</span><b>${E(m.v)}</b><div class="s">${E(m.sub)}</div></div>`).join('')}</div>`;
  else if(sec.kind==='scroller')
    body=`<div class="t-scroller">${(sec.cards||[]).map(c=>`<article class="t-card"><span class="lbl">${E(c.label)}</span><b>${E(c.title)}</b><span>${E(c.copy)}</span></article>`).join('')}</div>`;
  else if(sec.kind==='table'){
    const cols=sec.cols||[],w=`grid-template-columns:repeat(${cols.length||1},minmax(0,1fr))`;
    body=`<div class="t-table"><div class="tr head" style="${w}">${cols.map(c=>`<span>${E(c)}</span>`).join('')}</div>`
      +(sec.rows||[]).map(r=>`<div class="tr" style="${w}">${r.map((c,i)=>i===0?`<b>${E(c)}</b>`:`<span>${E(c)}</span>`).join('')}</div>`).join('')+`</div>`;
  }
  else if(sec.kind==='split')
    body=`<div class="t-split"><ul class="t-bul">${(sec.bullets||[]).map((b,i)=>`<li><i>${String(i+1).padStart(2,'0')}</i><span>${E(b)}</span></li>`).join('')}</ul><div class="t-figure"><div class="grid"></div></div></div>`;
  else if(sec.kind==='timeline')
    body=`<div class="t-timeline">${(sec.steps||[]).map(t=>`<div class="step"><span class="yr">${E(t.when)}</span><b>${E(t.title)}</b><span>${E(t.copy)}</span></div>`).join('')}</div>`;
  else if(sec.kind==='gallery')
    body=`<div class="t-gallery">${(sec.tiles||[]).map((t,i)=>`<figure class="t-tile"><span class="cap">${String(i+1).padStart(2,'0')}</span><b>${E(t)}</b></figure>`).join('')}</div>`;
  else if(sec.kind==='faq')
    body=`<div class="t-faq">${(sec.items||[]).map((f,i)=>`<div class="q"><b><i>${String(i+1).padStart(2,'0')}</i>${E(f.q)}</b><span>${E(f.a)}</span></div>`).join('')}</div>`;
  else if(sec.kind==='logos')
    body=`<div class="t-logos">${(sec.names||[]).map(n=>`<div class="t-logo">${E(n)}</div>`).join('')}</div>`;
  else if(sec.kind==='pricing')
    body=`<div class="t-plans">${(sec.plans||[]).map(pl=>`<div class="t-plan${pl.hi?' hi':''}"><div class="nm">${E(pl.name)}</div><div class="amt">${E(pl.amt)}</div><div class="per">${E(pl.per||'')}</div><ul>${(pl.items||[]).map(x=>`<li>${E(x)}</li>`).join('')}</ul></div>`).join('')}</div>`;
  else if(sec.kind==='quote')
    body=`<blockquote class="t-quote">${E(sec.quote)}<span class="attr">${E(sec.attr)}</span></blockquote>`;
  else if(sec.kind==='video')
    // The poster carries the frame before any of the video has arrived, so the
    // block is never blank and still reads with JavaScript or motion disabled.
    body=`<figure class="t-video"><video class="t-scrub" playsinline muted preload="auto" disablepictureinpicture`
      +`${sec.poster?` poster="${E(sec.poster)}"`:''} src="${E(sec.src||'')}"></video>`
      +`${sec.caption?`<figcaption>${E(sec.caption)}</figcaption>`:''}</figure>`;
  else return '';
  return `<div class="tsec" style="${style}">${sec.eyebrow?`<span class="t-eyebrow">${E(sec.eyebrow)}</span>`:''}${body}</div>`;
}
const views={
 dashboard:()=>`${viewHead(greeting(),'Your spatial website workspace is ready.',`<button class="btn" data-nav="templates">Browse templates</button><button class="btn primary" data-nav="create">＋ New project</button>`)}<div class="stat-grid"><div class="stat card"><span class="caps">Projects</span><div class="num">${(state.projects||[]).length}</div><span class="tiny muted">In this workspace</span></div><div class="stat card"><span class="caps">Published</span><div class="num">${(state.projects||[]).filter(p=>p.status==='Published').length}</div><span class="tiny muted">Across ${(state.domains||[]).length} domains</span></div><div class="stat card"><span class="caps">Visitors</span><div class="num">—</div><span class="tiny muted">Connect analytics</span></div><div class="stat card"><span class="caps">Credits</span><div class="num">${creditsLabel()}</div><span class="tiny muted">${state.credits==null?'Connect billing':'Available now'}</span></div></div><div class="dashboard-grid"><div><div class="quick-create card"><div><span class="caps">AI Creative Director</span><h2>What are we building today?</h2></div><div class="quick-input"><input id="dashPrompt" placeholder="Describe the website you want to build..."/><button class="btn primary" data-action="dashboardGenerate">Generate →</button></div></div><h3 style="margin:24px 0 12px">Recent projects</h3><div class="project-grid">${(state.projects||[]).length?(state.projects||[]).map(p=>projectCard(p.name,p.status)).join(''):'<div class="empty-state" style="padding:26px;text-align:center">No projects yet. Create your first project to get started.</div>'}</div></div><div class="dash-panel card"><h3>Activity</h3>${(state.opsActivity||[]).length?(state.opsActivity||[]).slice(0,4).map(a=>`<div class="activity"><div class="aicon">•</div><div><b>${escV(a.text)}</b><p>${escV(a.time)}</p></div></div>`).join(''):'<div class="empty-state" style="padding:26px;text-align:center">No activity yet.</div>'}<button class="btn ghost" style="width:100%;margin-top:10px">View all activity</button></div></div>`,
 projects:()=>`${viewHead('Projects','Create, organize and publish every website.',`<button class="btn">Import</button><button class="btn primary" data-nav="create">＋ New project</button>`)}<div class="filters"><button class="chip active">All</button><button class="chip">Draft</button><button class="chip">Published</button><button class="chip">Archived</button></div><div class="project-grid">${(state.projects||[]).length?(state.projects||[]).map(p=>projectCard(p.name,p.status)).join(''):'<div class="empty-state" style="padding:26px;text-align:center">No projects yet. Create your first project to get started.</div>'}</div>`,
 create:()=>`${viewHead('Create new website','Start from a brief, template, URL, screenshot or blank canvas.') }<div class="create-layout"><div class="method-list card"><div class="method active"><div class="micon">✦</div><div><b>Generate with AI</b><div class="tiny muted">Brief → plan → site</div></div></div><div class="method"><div class="micon">▦</div><div><b>Use template</b><div class="tiny muted">Start from a preset</div></div></div><div class="method"><div class="micon">↗</div><div><b>Import website</b><div class="tiny muted">Reconstruct from URL</div></div></div><div class="method"><div class="micon">▧</div><div><b>Screenshot → Website</b><div class="tiny muted">Editable reconstruction</div></div></div><div class="method"><div class="micon">＋</div><div><b>Blank canvas</b><div class="tiny muted">Build from scratch</div></div></div></div><div class="create-stage card"><div class="big-prompt"><span class="caps">AI Creative Director</span><h2>Describe the world you want to build.</h2><p>Tell us the business, audience, mood and goal. We’ll create the sitemap, visual direction, copy and motion plan before generating.</p><div class="prompt-box"><textarea id="createPrompt" placeholder="Example: Create a luxury Jaipur real-estate website with cinematic architecture, warm stone colors, 3D scroll transitions, gallery, amenities and Book a Site Visit CTA.">${state.prompt||''}</textarea><div class="prompt-foot"><button class="chip">＋ Brand kit</button><button class="chip">＋ References</button><span class="grow"></span><button class="btn primary" data-action="buildPlan">Build project plan →</button></div></div><div class="idea-chips"><button class="chip">Luxury real estate</button><button class="chip">SaaS product launch</button><button class="chip">Fashion portfolio</button><button class="chip">Resort experience</button></div></div></div></div>`,
 generation:()=>generationView(),
 templates:()=>`${viewHead('Templates','Premium starting points — preview the full experience before customizing.',`<button class="btn">Submit template</button>`)}<div class="filters"><button class="chip active">Featured</button><button class="chip">Entertainment</button><button class="chip">SaaS</button><button class="chip">Luxury</button><button class="chip">Agency</button><button class="chip">Restaurant</button><button class="chip">Real Estate</button><button class="chip">Portfolio</button></div><div class="template-grid">${TEMPLATES.map((t,i)=>`<article class="template card" data-template="${t.name}"><div class="template-preview t${(i%3)+1}"><div class="mini-browser"></div></div><div class="template-info"><b>${t.name}</b><div class="row"><span class="tiny muted">${t.category} · ${t.sections?t.sections.length+" sections":"3D"}</span><div class="template-actions"><a class="btn ghost" href="/preset/${t.name.toLowerCase()}" target="_blank" rel="noopener">Preview ↗</a><button class="btn" data-action="useTemplate" data-template="${t.name}">Customize</button></div></div></div></article>`).join('')}</div>`,
 studio:()=>{
   const isVideo=(state.studioMode||'image')==='video';
   const count=Math.max(1,Math.min(4,Number(state.studioCount||1)));
   const secs=[4,8,12].includes(Number(state.videoSeconds))?Number(state.videoSeconds):8;
   const res=['720p','1080p','4K'].includes(state.videoRes)?state.videoRes:'1080p';
   const cost=isVideo?videoCredits(secs,res):count*IMAGE_CREDITS_PER_OUTPUT;
   const job=state.videoJob;
   const shots=(state.studioResults||[]);
   return `${viewHead('AI Studio','Generate website-ready images for your site.',`<button class="btn primary" data-action="studioReset">＋ New generation</button>`)}<div class="filters">${[['image','Image'],['video','Video']].map(m=>`<button class="chip ${(state.studioMode||'image')===m[0]?'active':''}" data-action="studioMode" data-mode="${m[0]}">${m[1]}</button>`).join('')}</div><div class="two-col"><div class="card" style="padding:22px"><span class="caps">Generate asset</span><h2 style="font-size:30px;letter-spacing:-.04em">Create directly for your website.</h2><div class="field"><label>Prompt</label><textarea id="studioPrompt" rows="6" placeholder="A sculptural glass object floating in a gallery..." style="resize:none">${escV(state.studioPrompt||'')}</textarea></div>${isVideo?`<div class="prop-row"><label class="mini-field">Aspect <select id="studioAspect">${['16:9','9:16'].map(a=>`<option ${a===(state.videoAspect||'16:9')?'selected':''}>${a}</option>`).join('')}</select></label><label class="mini-field">Seconds <select id="videoSeconds">${[4,8,12].map(n=>`<option ${n===secs?'selected':''}>${n}</option>`).join('')}</select></label><label class="mini-field">Quality <select id="videoRes">${['720p','1080p','4K'].map(r=>`<option ${r===res?'selected':''}>${r}</option>`).join('')}</select></label></div>`:`<div class="prop-row"><label class="mini-field">Aspect <select id="studioAspect">${['16:9','1:1','4:3','9:16','3:2'].map(a=>`<option ${a===(state.studioAspect||'16:9')?'selected':''}>${a}</option>`).join('')}</select></label><label class="mini-field">Images <select id="studioCount">${[1,2,3,4].map(n=>`<option ${n===count?'selected':''}>${n}</option>`).join('')}</select></label></div>`}<button class="btn primary" style="width:100%;margin-top:8px" data-action="studioGenerate">Generate — ${cost} credits</button><div id="studioMsg" class="tiny muted" style="margin-top:9px;min-height:16px"></div></div><div class="card" style="padding:20px">${(state.heroImageAssetId||state.heroVideoAssetId)?`<div class="studio-next"><div><b>Background is set</b><div class="tiny muted">${state.heroVideoAssetId?'Video':'Image'} will sit behind your headline.</div></div><button class="btn primary" data-action="studioToSite">Open the studio →</button></div>`:''}<span class="caps">Recent generations</span>${job?`<div class="video-job">${job.status==='completed'?`<video src="/api/video/jobs/${escV(job.id)}/content#t=0.1" controls playsinline muted preload="auto"></video><button type="button" class="use-btn" data-action="useAsHero" data-url="/api/video/jobs/${escV(job.id)}/content" data-kind="video">${state.heroVideo?'On the site ✓':'Use on site'}</button>`:`<div class="job-wait"><b>${escV(job.status||'queued')}</b><div class="job-bar"><i style="width:${Math.max(4,Math.round(pct(job.progress)))}%"></i></div><span class="tiny muted">${escV(job.detail||'Rendering — this can take a few minutes.')}</span></div>`}<figcaption>${escV(job.prompt||'')}</figcaption></div>`:''}${shots.length?`<div class="studio-grid">${shots.map(g=>`<figure class="studio-shot"><img src="${escV(g.url)}" alt="${escV(g.prompt)}" loading="lazy"/><figcaption>${escV(g.prompt)}</figcaption><button type="button" class="use-btn" data-action="useAsHero" data-url="${escV(g.url)}" data-kind="image">${state.heroImage===g.url?'On the site ✓':'Use as background'}</button><button type="button" class="use-btn build-btn" data-action="imageToSite" data-asset="${escV(g.assetId||'')}">Make this a website</button></figure>`).join('')}</div>`:`<div style="height:360px;margin-top:15px;border-radius:16px;background:radial-gradient(circle at 50% 40%,rgba(123,238,255,.35),transparent 25%),radial-gradient(circle at 30% 70%,rgba(125,108,255,.35),transparent 25%),#09090d;display:grid;place-items:center"><div class="auth-cube" style="transform:scale(.55) rotateX(55deg) rotateZ(42deg)"><i></i><i></i><i></i></div></div>`}</div></div>`},
 media:()=>`${viewHead('Media Library','All uploaded, generated and exported assets in one place.',`<button class="btn">Upload</button><button class="btn primary">Generate asset</button>`)}<div class="filters"><button class="chip active">All</button><button class="chip">Images</button><button class="chip">Videos</button><button class="chip">3D</button><button class="chip">Fonts</button></div><div class="template-grid">${['Hero Glass','Architecture 01','Lobby Motion','Product Sphere','Ambient Loop','Brand Poster'].map((x,i)=>`<article class="template card"><div class="template-preview t${(i%3)+1}"></div><div class="template-info"><b>${x}</b><div class="row"><span class="tiny muted">${i%2?'Video':'Image'}</span><button class="btn">Add to site</button></div></div></article>`).join('')}</div>`,
 domains:()=>`${viewHead('Domains','Connect custom domains and monitor DNS / SSL status.',`<button class="btn primary" data-action="connectDomain">＋ Connect domain</button>`)}<div class="table"><div class="tr header"><span>Domain</span><span>Project</span><span>Status</span><span>SSL</span><span></span></div>${(state.domains||[]).length?(state.domains||[]).map(d=>`<div class="tr"><b>${escV(d.name)}</b><span>${escV(d.project||'')}</span><span class="status ${d.status==='Live'?'live':'warn'}">${escV(d.status)}</span><span>${escV(d.ssl||'')}</span><button class="btn ghost">•••</button></div>`).join(''):'<div class="empty-state" style="padding:26px;text-align:center">No domains connected yet.</div>'}</div>`,
 analytics:()=>`${viewHead('Analytics','Understand traffic, engagement and conversion across published sites.',`<button class="btn">Last 30 days⌄</button>`)}<div class="stat-grid"><div class="stat card"><span class="caps">Visitors</span><div class="num">—</div><span class="tiny muted">Connect analytics</span></div><div class="stat card"><span class="caps">Page views</span><div class="num">—</div><span class="tiny muted">Connect analytics</span></div><div class="stat card"><span class="caps">Leads</span><div class="num">${(state.leads||[]).length}</div><span class="tiny muted">From your forms</span></div><div class="stat card"><span class="caps">Conversion</span><div class="num">—</div><span class="tiny muted">Needs traffic data</span></div></div><div class="two-col"><div class="chart-card card"><b>Visitors</b><div class="empty-state" style="padding:38px 16px;text-align:center">No traffic data yet. Connect an analytics provider to see visitors here.</div></div><div class="chart-card card"><b>Traffic sources</b><div class="donut"></div><div class="metric-list"><div class="mrow"><span>Direct</span><b>46%</b></div><div class="mrow"><span>Organic</span><b>26%</b></div><div class="mrow"><span>Social</span><b>16%</b></div><div class="mrow"><span>Referral</span><b>12%</b></div></div></div></div>`,
 leads:()=>`${viewHead('Leads','Capture and manage inquiries from every published website.',`<button class="btn">Export CSV</button><button class="btn primary">＋ New form</button>`)}<div class="stat-grid">${[['New','New'],['Contacted','Contacted'],['Won','Won']].map(k=>`<div class="stat card"><span class="caps">${k[0]}</span><div class="num">${(state.leads||[]).filter(l=>l.status===k[1]).length}</div></div>`).join('')||'<div class="empty-state">No domains connected yet.</div>'}<div class="stat card"><span class="caps">Total</span><div class="num">${(state.leads||[]).length}</div></div></div><div class="table"><div class="tr header"><span>Name</span><span>Source</span><span>Status</span><span>Date</span><span></span></div>${(state.leads||[]).length?(state.leads||[]).map(x=>`<div class="tr"><b>${escV(x.name)}</b><span>${escV(x.source||'')}</span><span class="status ${x.status==='New'?'live':''}">${escV(x.status)}</span><span>${escV(x.date||'')}</span><button class="btn ghost">Open</button></div>`).join(''):'<div class="empty-state" style="padding:26px;text-align:center">No leads yet. They appear here when a form is submitted.</div>'}</div>`,
 billing:()=>`${viewHead('Billing & Credits','Plans, generation credits and usage history.',`<button class="btn">Invoices</button>`)}<div class="card" style="padding:22px;margin-bottom:16px"><div style="display:flex;align-items:center;gap:20px"><div class="grow"><span class="caps">Current plan</span><h2 style="margin:6px 0 7px">No plan connected</h2><p class="small muted">Connect billing to show your plan and credit balance.</p><div class="credit-meter"><i></i></div></div><button class="btn primary">Upgrade plan</button></div></div><div class="plan-grid"><div class="plan card"><h3>Free</h3><div class="price">₹0</div><ul><li>✓ 1 draft site</li><li>✓ Basic builder</li><li>✓ Demo generations</li></ul></div><div class="plan card featured"><h3>Creator</h3><div class="price">₹299</div><ul><li>✓ 5 sites</li><li>✓ 2,000 credits</li><li>✓ Custom domains</li></ul></div><div class="plan card"><h3>Pro</h3><div class="price">₹999</div><ul><li>✓ 20 sites</li><li>✓ 10,000 credits</li><li>✓ Advanced 3D</li></ul></div><div class="plan card"><h3>Business</h3><div class="price">Custom</div><ul><li>✓ Teams</li><li>✓ Permissions</li><li>✓ Routing controls</li></ul></div></div>`,
 team:()=>`${viewHead('Team','Invite collaborators and control workspace access.',`<button class="btn primary">＋ Invite member</button>`)}<div class="table"><div class="tr header"><span>Member</span><span>Role</span><span>Projects</span><span>Last active</span><span></span></div><div class="tr"><b>${escV(state.userName||'You')} · you</b><span>Owner</span><span>${(state.projects||[]).length}</span><span>Now</span><button class="btn ghost">•••</button></div>${(state.collaborators||[]).filter(c=>c.id!=='me').map(c=>`<div class="tr"><b>${escV(c.name)}</b><span>${escV(c.role)}</span><span>—</span><span>${c.online?'Now':'—'}</span><button class="btn ghost">•••</button></div>`).join('')||'<div class="empty-state">No leads yet. Submissions from your forms land here.</div>'}</div>`,
 settings:()=>`${viewHead('Settings','Workspace identity, brand kit, notifications and security.') }<div class="two-col"><div class="card" style="padding:22px"><h3>Workspace</h3><div class="field"><label>Workspace name</label><input value="Studio Workspace"/></div><div class="field"><label>Default project URL</label><input value="scen.space"/></div><button class="btn primary">Save changes</button></div><div class="card" style="padding:22px"><h3>Brand defaults</h3><div class="field"><label>Primary font</label><input value="Inter / System"/></div><div class="field"><label>Default accent</label><input value="#DFFF45"/></div><button class="btn">Edit brand kit</button></div></div>`,
 admin:()=>`${viewHead('Admin','Control product settings, users, plans and platform operations.',`<button class="btn" data-nav="integrations">API Center →</button>`)}<div class="admin-banner"><span class="dot"></span><div><b>Core product build mode</b><div class="tiny muted">API providers are intentionally disconnected until the final phase.</div></div></div><div class="stat-grid"><div class="stat card"><span class="caps">Users</span><div class="num">${(state.siteUsers||[]).length}</div><span class="tiny muted">In this workspace</span></div><div class="stat card"><span class="caps">Projects</span><div class="num">${(state.projects||[]).length}</div><span class="tiny muted">In this workspace</span></div><div class="stat card"><span class="caps">Published</span><div class="num">${(state.projects||[]).filter(p=>p.status==='Published').length}</div><span class="tiny muted">Live sites</span></div><div class="stat card"><span class="caps">MRR</span><div class="num">—</div><span class="tiny muted">Connect billing</span></div></div><div class="admin-grid"><div class="admin-card card"><span class="caps">Users</span><h3>Accounts & access</h3><p class="small muted">Search, suspend, roles, usage and workspace ownership.</p><button class="btn">Manage users</button></div><div class="admin-card card"><span class="caps">Plans</span><h3>Pricing & credits</h3><p class="small muted">Edit prices, quotas and credit costs without code changes.</p><button class="btn">Manage plans</button></div><div class="admin-card card"><span class="caps">Templates</span><h3>Marketplace content</h3><p class="small muted">Publish presets, categories and featured collections.</p><button class="btn">Manage templates</button></div><div class="admin-card card"><span class="caps">Models</span><h3>AI routing</h3><p class="small muted">Provider-independent model catalogue and job policies.</p><button class="btn">Routing rules</button></div><div class="admin-card card"><span class="caps">Jobs</span><h3>Generation queue</h3><p class="small muted">Track queued, running, failed and completed generation jobs.</p><button class="btn">View jobs</button></div><div class="admin-card card"><span class="caps">Logs</span><h3>Audit & system logs</h3><p class="small muted">Admin changes, publishing, billing and security events.</p><button class="btn">Audit logs</button></div></div>`,
 integrations:()=>`${viewHead('API & Keys Center','Final integration phase — intentionally locked while the complete product flow is built.') }<div class="locked-api card"><div><div class="lock-ring"><span style="font-size:42px">⌁</span></div><h2>Connect providers last.</h2><p class="muted" style="max-width:650px;margin:auto;line-height:1.6">All product screens use provider adapters and demo states for now. When the UI, UX and business flows are approved, Admin will connect real credentials server-side without exposing secrets in the browser.</p><div class="providers"><div class="provider">OpenAI<br><span class="muted">Not connected</span></div><div class="provider">Google AI<br><span class="muted">Not connected</span></div><div class="provider">Image API<br><span class="muted">Not connected</span></div><div class="provider">Video API<br><span class="muted">Not connected</span></div><div class="provider">Razorpay<br><span class="muted">Not connected</span></div><div class="provider">Stripe<br><span class="muted">Not connected</span></div><div class="provider">GitHub<br><span class="muted">Not connected</span></div><div class="provider">Vercel<br><span class="muted">Not connected</span></div></div><span class="pill" style="display:inline-block;margin-top:22px">🔒 LAST PHASE</span></div></div>`
};

views.onboarding=()=>{const step=state.onboardingStep||1;const heads=['Tell us about you','What do you build?','Choose your default style','Workspace ready'];const bodies=[
`<div class="field"><label>Your name</label><input id="obName" value="" placeholder="Your name"/></div><div class="field"><label>Workspace name</label><input id="obWorkspace" value="${state.workspaceName||'Studio Workspace'}"/></div>`,
`<div class="choice-grid">${['Business websites','SaaS & startups','Real estate','Portfolio','E-commerce','Agency'].map(x=>`<button class="choice ${state.category===x?'active':''}" data-obchoice="${x}"><b>${x}</b><div class="tiny muted" style="margin-top:6px">3D-ready flow</div></button>`).join('')}</div>`,
`<div class="choice-grid">${['Cinematic dark','Editorial light','Bold experimental'].map((x,i)=>`<button class="choice ${i===0?'active':''}"><b>${x}</b><div class="tiny muted" style="margin-top:6px">Motion + depth preset</div></button>`).join('')}</div>`,
`<div class="admin-banner"><span class="dot"></span><div><b>${state.workspaceName||'Studio Workspace'} is ready</b><div class="tiny muted">Create your first spatial website.</div></div></div>`];return `<div class="onboard card" style="padding:28px">${viewHead(heads[step-1],step===4?'Core setup complete.':'Quick setup — you can change everything later.')}<div class="flow-stepper">${[1,2,3,4].map(i=>`<i class="flow-step ${i<step?'done':i===step?'active':''}"></i>`).join('')}</div>${bodies[step-1]}<div style="display:flex;gap:8px;margin-top:20px"><button class="btn" data-action="onboardBack" ${step===1?'disabled':''}>← Back</button><span class="grow"></span><button class="btn primary" data-action="onboardNext">${step===4?'Enter workspace →':'Continue →'}</button></div></div>`}

function createFlowView(){const method=state.createMethod||'ai';const methods=[['ai','✦','Generate with AI','Brief → plan → site'],['template','▦','Use template','Start from a preset'],['url','↗','Import website','Reconstruct from URL'],['screenshot','▧','Screenshot → Website','Editable reconstruction'],['blank','＋','Blank canvas','Build from scratch']];let stage='';if(method==='ai')stage=`<div class="big-prompt"><span class="caps">AI Creative Director</span><h2>Describe the world you want to build.</h2><p>Tell us the business, audience, mood and goal. We’ll create a project plan before building anything.</p><div class="prompt-box"><textarea id="createPrompt" placeholder="Create a luxury Jaipur real-estate website with cinematic 3D scroll...">${state.prompt||''}</textarea><div class="prompt-foot"><button class="chip">＋ Brand kit</button><button class="chip">＋ References</button><span class="grow"></span><button class="btn primary" data-action="buildPlan">Build project plan →</button></div></div></div>`;if(method==='template')stage=`<div class="big-prompt"><span class="caps">Preset route</span><h2>Start from a spatial template.</h2><p>Pick a base system, then customize every layer.</p><button class="btn primary" data-nav="templates">Browse templates →</button></div>`;if(method==='url')stage=`<div class="big-prompt"><span class="caps">Import URL</span><h2>Rebuild a public site into editable sections.</h2><div class="field"><label>Website URL</label><input id="importUrl" placeholder="https://example.com"/></div><button class="btn primary" data-action="analyzeImport">Analyze structure →</button></div>`;if(method==='screenshot')stage=`<div class="big-prompt"><span class="caps">Screenshot → Website</span><h2>Turn a visual reference into responsive layers.</h2><div class="import-box"><div style="font-size:34px">▧</div><b>Drop screenshot here</b><p class="small muted">Demo flow uses a simulated upload.</p><button class="btn primary" data-action="simulateScreenshot">Choose screenshot</button></div></div>`;if(method==='blank')stage=`<div class="big-prompt"><span class="caps">Blank canvas</span><h2>Start with pure space.</h2><p>Create an empty responsive project with navigation, design tokens and version history ready.</p><button class="btn primary" data-action="createBlank">Create blank project →</button></div>`;return `${viewHead('Create new website','Choose how this project should begin.')}<div class="create-layout"><div class="method-list card">${methods.map(x=>`<div class="method ${method===x[0]?'active':''}" data-method="${x[0]}"><div class="micon">${x[1]}</div><div><b>${x[2]}</b><div class="tiny muted">${x[3]}</div></div></div>`).join('')}</div><div class="create-stage card">${stage}</div></div>`}
views.create=()=>createFlowView();

views.plan=()=>`${viewHead('Project plan','Review the website system before generation.',`<button class="btn" data-nav="create">Edit brief</button><button class="btn primary" data-action="approvePlan">Approve & generate →</button>`)}<div class="plan-grid2"><div class="card plan-section"><span class="caps">Creative direction</span><h2 style="font-size:34px;letter-spacing:-.05em;margin:8px 0">${state.projectName}</h2><p class="muted">${state.prompt||'Cinematic spatial website with responsive 3D storytelling.'}</p><div class="plan-list"><div class="plan-item"><span class="dot"></span><div><b>Style</b><div class="tiny muted">Cinematic · Editorial · Spatial depth</div></div></div><div class="plan-item"><span class="dot"></span><div><b>Primary CTA</b><div class="tiny muted">Book / Explore / Contact</div></div></div><div class="plan-item"><span class="dot"></span><div><b>Motion</b><div class="tiny muted">Hero depth, parallax, section camera transitions</div></div></div></div></div><div class="card plan-section"><span class="caps">Sitemap</span><div class="plan-list">${['Home','Project / Product','Features / Amenities','Gallery','About','Contact'].map((x,i)=>`<div class="plan-item"><span class="pill">0${i+1}</span><b>${x}</b></div>`).join('')}</div></div></div>`;

views.projects=()=>`${viewHead('Projects','Create, organize and publish every website.',`<button class="btn">Import</button><button class="btn primary" data-nav="create">＋ New project</button>`)}<div class="filters"><button class="chip active">All</button><button class="chip">Draft</button><button class="chip">Published</button><button class="chip">Archived</button></div><div class="project-grid">${state.projects.map((p,i)=>`<article class="project-card card" data-action="openProject" data-project="${i}"><div class="project-thumb"></div><div class="project-meta"><b>${p.name}</b><div class="row"><span class="status ${p.status==='Published'?'live':'draft'}">${p.status}</span><span>Saved locally</span></div></div></article>`).join('')}</div>`;

views.domains=()=>`${viewHead('Domains','Connect custom domains and monitor DNS / SSL status.',`<button class="btn primary" data-action="connectDomain">＋ Connect domain</button>`)}<div class="table"><div class="tr header"><span>Domain</span><span>Project</span><span>Status</span><span>SSL</span><span></span></div>${state.domains.map(x=>`<div class="tr"><b>${x.name}</b><span>${x.project}</span><span class="status ${x.status==='Live'?'live':'warn'}">${x.status}</span><span>${x.ssl}</span><button class="btn ghost">•••</button></div>`).join('')}</div>`;

views.leads=()=>`${viewHead('Leads','Capture and manage inquiries from every published website.',`<button class="btn">Export CSV</button><button class="btn primary">＋ New form</button>`)}<div class="stat-grid">${['New','Contacted','Won'].map(st=>`<div class="stat card"><span class="caps">${st}</span><div class="num">${state.leads.filter(x=>x.status===st).length}</div></div>`).join('')}<div class="stat card"><span class="caps">Pipeline</span><div class="num">${state.leads.length}</div></div></div><div class="table"><div class="tr header"><span>Name</span><span>Source</span><span>Status</span><span>Date</span><span></span></div>${state.leads.map((x,i)=>`<div class="tr"><b>${x.name}</b><span>${x.source}</span><span class="status ${x.status==='New'?'live':''} lead-status" data-action="cycleLead" data-lead="${i}">${x.status}</span><span>Today</span><button class="btn ghost">Open</button></div>`).join('')}</div>`;

function generationView(){const steps=[['Understanding brief','Business, audience, CTA'],['Creating sitemap','Home, Project, Gallery, Contact'],['Visual direction','Color, type, composition'],['Writing content','Headlines, body copy, CTAs'],['Designing pages','Responsive page system'],['Building 3D scene','Depth, camera and scroll motion'],['Quality check','Responsive, SEO, accessibility']];const pct=Math.round((Math.min(state.generation,7)/7)*100);return `${viewHead('Generating your website','The approved plan is being compiled into an editable site.',`<button class="btn" data-nav="plan">View plan</button>`)}<div class="gen-layout"><div class="gen-steps card"><span class="caps">Build pipeline</span><h2>${state.projectName}</h2><div class="mini-progress"><i style="width:${pct}%"></i></div><p class="small muted">${pct}% complete · AI writes the copy, picks the scene, and can generate the background</p><div class="gen-step media-step ${state.genMediaNote?'active':''}"><span class="step-dot">✦</span><div><b>Visuals</b><p id="genMediaNote">${escV(state.genMediaNote||'Hero image and background video')}</p></div></div>${steps.map((x,i)=>`<div class="gen-step ${i<state.generation?'done':i===state.generation?'active':''}"><span class="step-dot">${i<state.generation?'✓':i+1}</span><div><b>${x[0]}</b><p>${x[1]}</p></div></div>`).join('')}<button class="btn primary" style="width:100%;margin-top:16px" data-action="runGeneration">${state.generation>=7?'Open builder →':'Run generation →'}</button></div><div class="gen-preview card"><div class="browser-frame"><div class="browser-top"><i></i><i></i><i></i></div><div class="preview-site"><div class="navline"></div><div class="ph"></div><div class="ph2"></div><div class="pp"></div><div class="pp" style="width:48%"></div><div class="pcta"></div></div></div><div class="pill" style="position:absolute;right:22px;bottom:20px">Live generation preview</div></div></div>`}

function renderCanvasSection(name,index){const selected=state.selected===`component:${index}`;return `<section class="editable-section ${selected?'selected-outline':''}" draggable="true" data-section-index="${index}" data-action="selectSection"><div class="section-tools"><button class="drag-handle">⠿ Drag</button><button data-action="moveSectionUp" data-index="${index}">↑</button><button data-action="moveSectionDown" data-index="${index}">↓</button><button data-action="duplicateSection" data-index="${index}">Duplicate</button><button data-action="deleteSection" data-index="${index}">Delete</button></div><span class="caps" style="color:#777">Section ${String(index+1).padStart(2,'0')}</span><h3 contenteditable="true" spellcheck="false" data-edit-section-title="${index}">${name}</h3><p contenteditable="true" spellcheck="false" data-edit-section-copy="${index}">${state.sectionCopy?.[index]||'A responsive, editable section with spatial depth and motion controls.'}</p><div class="section-visual"></div></section>`}
function motionTimeline(){const keys=state.motion?.keyframes||[8,42,78];return `<div class="motion-timeline"><div class="timeline-head"><button class="btn ghost" data-action="toggleTimeline">×</button><b style="font-size:11px">Motion Timeline</b><span class="pill">${state.selected==='hero'?'Hero':state.selected.replace('component:','Section ')}</span><span class="grow"></span><button class="btn ghost" data-action="playTimeline">▶ Preview</button><button class="btn" data-action="addKeyframe">＋ Keyframe</button></div><div class="timeline-body"><div class="timeline-labels"><div class="track-name">Opacity</div><div class="track-name">Y / Depth</div><div class="track-name">Scale</div><div class="track-name">Rotate</div></div><div class="timeline-tracks"><div class="timeline-ruler"><span>0s</span><span>.5s</span><span>1s</span><span>1.5s</span><span>2s</span></div><div class="playhead"></div>${['opacity','depth','scale','rotate'].map((t,ti)=>`<div class="track">${keys.map((k,ki)=>`<i class="keyframe" style="left:${Math.min(94,Math.max(2,k+ti*3-ki*2))}%"></i>`).join('')}</div>`).join('')}</div></div></div>`}
function builderView(){return `<div class="view builder-view"><div class="builder-top"><button class="btn ghost" data-nav="projects">←</button><b style="font-size:12px">${state.projectName}</b><span class="pill save-indicator">Saved locally</span><span class="grow"></span><button class="btn ghost" data-action="undo">↶</button><button class="btn ghost" data-action="redo">↷</button><button class="btn ${state.device==='desktop'?'primary':''}" data-device="desktop">Desktop</button><button class="btn ${state.device==='tablet'?'primary':''}" data-device="tablet">Tablet</button><button class="btn ${state.device==='mobile'?'primary':''}" data-device="mobile">Mobile</button><button class="btn ${state.timelineOpen?'primary':''}" data-action="toggleTimeline">⌁ Timeline</button><button class="btn" data-action="preview">Preview</button><button class="btn primary" data-action="publish">${state.published?'Published ✓':'Publish'}</button></div><div class="builder-left"><div class="builder-tabs">${[['ai','✦'],['pages','☷'],['components','＋'],['layers','≡'],['media','◉'],['history','↺']].map(x=>`<button class="btab ${state.builderTab===x[0]?'active':''}" data-btab="${x[0]}">${x[1]}</button>`).join('')}</div><div class="builder-panel">${builderPanel()}</div></div><div class="builder-canvas-wrap ${state.timelineOpen?'timeline-space':''}"><div class="canvas-device ${state.device}"><div class="site-preview-nav"><span class="slogo">${state.projectName.split(' ')[0].toUpperCase()}</span><div class="snlinks"><span>Project</span><span>Experience</span><span>Gallery</span></div><span class="sbtn">Get started</span></div><section class="site-hero ${state.selected==='hero'?'selected-outline':''}" data-action="selectHero"><span class="direct-edit-hint">Click text and type directly</span><span class="eyebrow">Spatial website · AI directed</span><h1 contenteditable="true" spellcheck="false" data-edit="heroTitle">${state.heroTitle}</h1><p contenteditable="true" spellcheck="false" data-edit="heroSubtitle">${state.heroSubtitle}</p>${(state.heroCtas&&state.heroCtas.length?state.heroCtas:['Explore experience']).slice(0,3).map((c,i)=>`<span class="site-cta ${i?'alt':''}" contenteditable="true" spellcheck="false" data-edit-cta="${i}">${escV(c)}</span>`).join('')}<div class="site-3d"><div class="site-cube"><i></i><i></i><i></i></div></div></section>${state.components.map((x,i)=>renderCanvasSection(x,i)).join('')}<section class="site-section"><span class="caps" style="color:#777">End of page</span><h2>Every section stays editable.</h2><p class="muted">Drag sections to reorder, edit copy directly, or use the AI Creative Director.</p></section></div></div><div class="builder-right"><div class="prop-tabs">${[['design','Design'],['motion','Motion'],['seo','SEO'],['qa','QA']].map(x=>`<button class="prop-tab ${state.propTab===x[0]?'active':''}" data-proptab="${x[0]}">${x[1]}</button>`).join('')}</div><div class="props">${propsPanel()}</div></div>${state.timelineOpen?motionTimeline():''}</div>`}
function builderPanel(){if(state.builderTab==='ai')return `<div class="ai-chat"><h3>AI Creative Director</h3><div class="chat-msg ai">I edit the current website instead of regenerating it. You can also click text on the canvas and type directly.</div><div class="chat-msg ai">Try “make hero cinematic”, “change title to …”, or add a section from Components.</div><div class="ai-chips">${['Rewrite the copy for my business','Make the headline shorter','Change the brand colours','Add a pricing section','Make the scene more cinematic'].map(c=>`<button type="button" data-action="aiChip" data-chip-text="${escV(c)}">${escV(c)}</button>`).join('')}</div><div class="chat-compose"><textarea id="builderPrompt" placeholder="Ask AI to edit this website..."></textarea><button class="btn primary" style="width:100%" data-action="aiEdit">Apply edit →</button></div></div>`;if(state.builderTab==='pages')return `<h3>Pages</h3>${['Home','Project','Experience','Gallery','Contact'].map((x,i)=>`<div class="layer ${i===0?'active':''}">▧ ${x}<span class="grow"></span>•••</div>`).join('')}<button class="btn" style="width:100%;margin-top:10px" data-action="addPage">＋ Add page</button>`;if(state.builderTab==='components')return `<h3>Add component</h3><div class="drop-tip">Add a component, then drag it directly on canvas to reorder.</div><div class="component-grid">${['Hero','Navbar','Features','Gallery','Stats','Pricing','FAQ','CTA','Form','Footer','Video','3D Scene'].map(x=>`<button class="component" data-action="addComponent" data-component="${x}">${x}</button>`).join('')}</div>`;if(state.builderTab==='layers')return `<h3>Layers</h3><div class="drop-tip">⠿ Drag sections on the canvas. Layer order updates instantly.</div><div class="layer ${state.selected==='hero'?'active':''}" data-action="selectHero">▾ Hero</div>${state.components.map((x,i)=>`<div class="layer ${state.selected===`component:${i}`?'active':''}" data-action="selectLayer" data-index="${i}"><span>⠿</span><span>${x}</span><span class="grow"></span><button class="btn ghost" data-action="moveSectionUp" data-index="${i}">↑</button><button class="btn ghost" data-action="moveSectionDown" data-index="${i}">↓</button></div>`).join('')}`;if(state.builderTab==='media')return `<h3>Project media</h3><div class="component-grid">${['Stone 01','Lobby','Glass form','Garden','Night view','Motion loop'].map((x,i)=>`<div class="component" style="height:78px;background:linear-gradient(${140+i*8}deg,#252535,#111116)">${x}</div>`).join('')}</div><button class="btn" style="width:100%;margin-top:10px">＋ Upload</button>`;const versions=state.versions.length?state.versions:[{id:0,label:'Initial AI generation',time:'Base',snapshot:snapshot()}];return `<h3>Version history</h3>${versions.map(v=>`<div class="layer"><span>↺</span><div><b>${v.label}</b><div class="tiny muted">${v.time}</div></div><span class="grow"></span><button class="btn ghost version-btn" data-action="restoreVersion" data-version="${v.id}">Restore</button></div>`).join('')}`}
function propsPanel(){const ci=state.selected==='hero'?-1:+(state.selected||'component:0').split(':')[1];const selection=state.selected==='hero'?'Hero section':`Section ${ci+1} · ${state.components[ci]||'Section'}`;if(state.propTab==='motion')return `<div class="selection-label">Selected · <b>${selection}</b></div><div class="prop-section"><h4>Motion preset</h4><div class="motion-presets">${['Cinematic','Fade up','Parallax','3D Push'].map(x=>`<button class="motion-preset ${state.motion.preset===x?'active':''}" data-action="setMotionPreset" data-preset="${x}">${x}</button>`).join('')}</div></div><div class="prop-section"><h4>Timing</h4><label class="tiny muted">Duration · ${state.motion.duration}s</label><input class="prop-input" type="range" min="0.4" max="3" step="0.1" value="${state.motion.duration}" data-motion-input="duration"/><label class="tiny muted">Depth · ${state.motion.depth}</label><input class="prop-input" type="range" min="0" max="100" value="${state.motion.depth}" data-motion-input="depth"/><label class="tiny muted">Parallax · ${state.motion.parallax}%</label><input class="prop-input" type="range" min="0" max="60" value="${state.motion.parallax}" data-motion-input="parallax"/></div><div class="prop-section"><h4>Timeline</h4><div class="mini-field">${state.motion.keyframes.length} keyframes · scroll synced</div><button class="btn primary" style="width:100%;margin-top:8px" data-action="toggleTimeline">Open motion timeline</button></div>`;if(state.propTab==='seo')return `<div class="prop-section"><h4>Page SEO</h4><div class="field"><label>Title</label><input value="${state.projectName} — Immersive 3D Website"/></div><div class="field"><label>Description</label><textarea rows="4">${state.heroSubtitle}</textarea></div><div class="mini-field">SEO score · 92 / 100</div><button class="btn primary" style="width:100%;margin-top:8px">Optimize SEO with AI</button></div>`;if(state.propTab==='qa')return `<div class="prop-section"><h4>Website health</h4>${[['Responsive','Passed'],['Broken links','Passed'],['Accessibility','2 warnings'],['Performance','Good'],['Forms','Passed'],['SEO','92/100']].map(x=>`<div class="layer"><span>${x[1]==='Passed'?'✓':'◌'}</span><span>${x[0]}</span><span class="grow"></span><span class="tiny muted">${x[1]}</span></div>`).join('')}<button class="btn primary" style="width:100%;margin-top:8px" data-action="fixQA">Fix all with AI</button></div>`;return `<div class="selection-label">Selected · <b>${selection}</b></div>${state.selected==='hero'?`<div class="prop-section"><h4>Content</h4><label class="tiny muted">Heading</label><textarea class="prop-input" rows="3" data-prop-edit="heroTitle">${state.heroTitle}</textarea><label class="tiny muted">Body</label><textarea class="prop-input" rows="4" data-prop-edit="heroSubtitle">${state.heroSubtitle}</textarea></div>`:`<div class="prop-section"><h4>Section</h4><div class="field"><label>Title</label><input class="prop-input" value="${state.components[ci]||''}" data-section-prop="title" data-index="${ci}"/></div><div class="field"><label>Body</label><textarea class="prop-input" rows="4" data-section-prop="copy" data-index="${ci}">${state.sectionCopy?.[ci]||''}</textarea></div><div class="prop-row"><button class="btn" data-action="duplicateSelected">Duplicate</button><button class="btn danger" data-action="deleteSelected">Delete</button></div></div>`}<div class="prop-section"><h4>Layout</h4><div class="prop-row"><div class="mini-field">W · Fill</div><div class="mini-field">H · Auto</div></div><div class="prop-row"><div class="mini-field">Padding · 55</div><div class="mini-field">Gap · 24</div></div></div><div class="prop-section"><h4>Appearance</h4><div class="color-swatch"><i style="background:#f4f0df"></i><i style="background:#111"></i><i style="background:#7d6cff"></i><i style="background:#dfff45"></i></div></div>`}
function modal(html){$('#modal').innerHTML=`<div class="modal-backdrop"><div class="modal">${html}</div></div>`;$('#modal').classList.remove('hidden')}
function closeModal(){$('#modal').classList.add('hidden');$('#modal').innerHTML=''}
function templatePreviewModal(name){state.templatePreview=name;saveState();modal(`<div class="modal-head"><div><span class="caps">Template preview</span><b style="display:block;margin-top:4px">${name}</b></div><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><div class="template-preview-modal"><div class="fake-nav"></div><div class="fake-copy"><span class="caps">${name} · Spatial preset</span><h2>A website that feels like a place.</h2><p>Scroll-led composition, cinematic depth, editable sections and responsive motion — ready to customize.</p></div><div class="orb"></div></div><div style="display:flex;gap:8px;margin-top:12px"><button class="btn">Desktop</button><button class="btn">Tablet</button><button class="btn">Mobile</button><span class="grow"></span><button class="btn primary" data-action="customizePreviewTemplate" data-template="${name}">Customize this template →</button></div></div>`)}
function showCreateModal(){modal(`<div class="modal-head"><b>Create new project</b><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><div class="option-grid"><div class="option" data-nav="create"><b>✦ Generate with AI</b><p>Turn one brief into a complete website plan and editable build.</p></div><div class="option" data-nav="templates"><b>▦ Use template</b><p>Choose a premium spatial preset and customize it.</p></div><div class="option"><b>↗ Import URL</b><p>Analyze an existing public site and reconstruct the structure.</p></div><div class="option"><b>▧ Screenshot → Website</b><p>Turn a visual reference into responsive editable sections.</p></div></div></div>`)}
function publishModal(){modal(`<div class="modal-head"><b>Publish website</b><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><span class="caps">Production check</span><h2 style="font-size:30px;letter-spacing:-.04em">Your website is ready to go live.</h2><div class="admin-banner"><span class="dot"></span><div><b>All core checks passed</b><div class="tiny muted">Responsive · SEO · links · forms · metadata</div></div></div><div class="field"><label>Free project URL</label><div class="pub-url"><span>scen.space/s/</span><input id="publishSlug" value="${escV(defaultSlug())}" spellcheck="false"/></div></div><div id="publishMsg" class="tiny muted" style="min-height:16px;margin-bottom:8px"></div><button class="btn primary" style="width:100%" data-action="confirmPublish">Publish now →</button><button class="btn" style="width:100%;margin-top:8px" data-nav="domains">Connect custom domain</button></div>`)}
function domainModal(){modal(`<div class="modal-head"><b>Connect domain</b><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><div class="field"><label>Domain</label><input value="mybrand.com"/></div><button class="btn primary" style="width:100%" data-action="domainAdded">Continue →</button><p class="tiny muted">DNS instructions will be shown next. No domain API is required for this UI flow.</p></div>`)}
function bindBuilder(){/* delegated events handle most interactions */}
document.addEventListener('click',e=>{
  const nav=e.target.closest('[data-nav]');if(nav){e.preventDefault();closeModal();navigate(nav.dataset.nav);return}
  const method=e.target.closest('[data-method]');if(method){state.createMethod=method.dataset.method;saveState();render('create');return}
  const ob=e.target.closest('[data-obchoice]');if(ob){state.category=ob.dataset.obchoice;saveState();render('onboarding');return}
  const chip=e.target.closest('[data-chip]');if(chip){$$('[data-chip]').forEach(x=>x.classList.remove('active'));chip.classList.add('active');state.category=chip.dataset.chip;saveState();return}
  const dev=e.target.closest('[data-device]');if(dev){state.device=dev.dataset.device;saveState();render('builder');return}
  const bt=e.target.closest('[data-btab]');if(bt){state.builderTab=bt.dataset.btab;saveState();render('builder');return}
  const pt=e.target.closest('[data-proptab]');if(pt){state.propTab=pt.dataset.proptab;saveState();render('builder');return}
  const a=e.target.closest('[data-action]');if(!a)return;const action=a.dataset.action;
  if(action==='authToggle'){authMode=authMode==='signup'?'login':'signup';const t=$('#authTitle'),sub=$('#authSub'),btn=$('#authSubmitBtn'),foot=$('#authError');authError('');
    if(t)t.textContent=authMode==='signup'?'Create your workspace':'Welcome back';
    if(sub)sub.textContent=authMode==='signup'?'Start with an email and password.':'Sign in to your workspace.';
    if(btn)btn.textContent=authMode==='signup'?'Create account →':'Sign in →';
    const link=document.querySelector('[data-action="authToggle"]');if(link)link.textContent=authMode==='signup'?'Sign in':'Create one';
    const p=link?.parentElement;if(p)p.childNodes[0].textContent=authMode==='signup'?'Already have an account? ':'No account yet? ';
    return}
  if(action==='choosePlan'){
    const plan=a.dataset.plan;
    if(!state.auth?.workspaceId){toast('Sign in to subscribe');navigate('auth');return}
    modal(`<div class="modal-head"><div><span class="caps">One-time payment</span><b style="display:block;margin-top:4px">${escV(plan||'')} plan</b></div><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><p class="tiny muted" style="margin:0 0 4px">You pay once and the credits are added to your workspace. This does not auto-renew \u2014 buy again whenever you need more.</p><p class="tiny muted" style="margin:0 0 4px">We need a contact number to send your payment receipt.</p><div class="field"><label for="planPhone">Mobile number</label><input id="planPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="10-digit mobile number"/></div><div id="planPhoneMsg" class="tiny" style="min-height:16px;color:#ff9b9b"></div><button class="btn primary" style="width:100%" data-action="startPlanCheckout" data-plan="${escV(plan||'')}">Continue to payment →</button></div>`);
    setTimeout(()=>{const el=$('#planPhone');el?.focus();
      el?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('[data-action="startPlanCheckout"]')?.click()}})},30);
    return}
  if(action==='startPlanCheckout'){
    const plan=a.dataset.plan,input=$('#planPhone'),msg=$('#planPhoneMsg');
    const digits=(input?.value||'').replace(/\D/g,'');
    if(digits.length<8||digits.length>15){
      if(msg)msg.textContent='Enter a valid mobile number so the provider can send your receipt.';
      input?.focus();return}
    if(msg)msg.textContent='';
    a.disabled=true;const lbl=a.textContent;a.textContent='Opening checkout…';
    api('/api/billing/checkout',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':(crypto.randomUUID?crypto.randomUUID():String(Date.now()))},
      body:JSON.stringify({kind:'subscription',plan,currency:'INR',phone:digits,name:state.userName||''})})
      .then(d=>{if(d.url){location.href=d.url;return}
        // A checkout with no payment page is not a success. Closing the modal on
        // a "Checkout created" toast left the customer believing they had paid
        // when nothing had been charged and no page had opened.
        if(msg)msg.textContent='The payment provider did not return a payment page. Nothing has been charged \u2014 please try again in a moment.'})
      .catch(e=>{if(msg)msg.textContent=e.message||'Checkout failed. Please try again.'})
      .finally(()=>{a.disabled=false;a.textContent=lbl});
    return}
  if(action==='usePresetFromPreview'){
    history.pushState({},'','/');
    const t=templateByName(a.dataset.template||'');
    if(t){startNewProject(t.name+' Project');applyShellFromTemplate(t);
      state.templateSections=t.sections||null;state.templatePalette=t.palette||null;
      state.heroTitle=t.heroTitle;state.heroSubtitle=t.heroSubtitle;state.components=t.components;state.sectionCopy=t.sectionCopy;
      state.generation=7;saveState()}
    toast(state.auth?'Template loaded':'Sign in to start building');
    navigate(state.auth?'builder':'auth');return}
  if(action==='googleAuth'){location.href='/api/auth/google/start';return}
  if(action==='authSubmit'){
    const btn=$('#authSubmitBtn'),email=($('#authEmail')?.value||'').trim(),password=$('#authPassword')?.value||'';
    authError('');
    if(!email||!password){authError('Email and password are required');return}
    btn.disabled=true;const label=btn.textContent;btn.textContent='Please wait…';
    api(authMode==='signup'?'/api/auth/signup':'/api/auth/login',{method:'POST',body:JSON.stringify({email,password})})
      .then(d=>{applySession(d);toast(authMode==='signup'?'Workspace created':'Signed in');const want=state.pendingRoute;state.pendingRoute=null;navigate(want||resumeRoute())})
      .catch(e=>{authError(e.message||'Sign in failed')})
      .finally(()=>{btn.disabled=false;btn.textContent=label});
    return}
  if(action==='logout'){api('/api/auth/logout',{method:'POST'}).catch(()=>{}).finally(()=>{clearSession();toast('Signed out');navigate('marketing')});return}
  if(action==='login'){navigate('auth');toast('Signed in — demo workspace')}
  if(action==='onboardBack'){state.onboardingStep=Math.max(1,(state.onboardingStep||1)-1);saveState();render('onboarding')}
  if(action==='onboardNext'){if(state.onboardingStep===1){state.workspaceName=$('#obWorkspace')?.value||state.workspaceName;state.userName=($('#obName')?.value||'').trim()||state.userName}if(state.onboardingStep<4){state.onboardingStep++;saveState();render('onboarding')}else{state.onboarded=true;saveState();navigate('dashboard');toast('Workspace setup complete')}}
  if(action==='heroGenerate'){
    // Carry the brief through sign-up. Without this the visitor writes a brief,
    // creates an account and lands on an empty dashboard with nothing building.
    const typed=($('#heroPrompt')?.value||'').trim(),cat=state.category||'';
    const brief=typed||(cat?`A cinematic 3D ${cat.toLowerCase()} website`:'Cinematic 3D website');
    startNewProject(cat?`${cat} site`:'New Spatial Project');
    state.prompt=brief;
    state.heroBrief=true;saveState();navigate('auth')
  }
  if(action==='dashboardGenerate'){state.prompt=$('#dashPrompt')?.value||'';state.createMethod='ai';saveState();navigate('create')}
  if(action==='buildPlan'){const q=$('#createPrompt')?.value||'Luxury spatial website';startNewProject('New Spatial Project');state.prompt=q;saveState();navigate('plan')}
  if(action==='approvePlan'){state.generation=0;saveState();navigate('generation')}
  if(action==='runGeneration'){if(state.generation>=7){if(!state.versions.length)makeVersion('Initial AI generation');if(!state.projects.some(p=>p.name===state.projectName))state.projects.unshift({name:state.projectName,status:'Draft'});saveState();navigate('builder');return}state.generation++;saveState();render('generation')}
  if(action==='analyzeImport'){const url=$('#importUrl')?.value||'Imported website';state.projectName=url.replace(/^https?:\/\//,'').split('/')[0]||'Imported website';state.prompt='Reconstruct '+url+' as an editable spatial website';saveState();navigate('plan');toast('Structure analyzed in demo mode')}
  if(action==='simulateScreenshot'){state.projectName='Screenshot Project';state.prompt='Reconstruct uploaded visual reference';saveState();navigate('plan');toast('Screenshot analyzed in demo mode')}
  if(action==='createBlank'){state.projectName='Untitled Spatial Site';state.heroTitle='Build without limits.';state.heroSubtitle='A blank responsive 3D canvas ready for your ideas.';state.components=[];state.sectionCopy=[];makeVersion('Blank project created');if(!state.projects.some(p=>p.name===state.projectName))state.projects.unshift({name:state.projectName,status:'Draft'});navigate('builder')}
  if(action==='openProject'){const i=+(a.dataset.project||0);const p=state.projects[i];if(p){openProjectNamed(p.name);state.published=p.status==='Published'}saveState();navigate('builder')}
  if(action==='useTemplate'){const card=a.closest('.template');state.projectName=(a.dataset.template||card?.querySelector('b')?.textContent||'Template')+' Project';const tpl=templateByName(a.dataset.template||'');state.templateSections=tpl?.sections||null;state.templatePalette=tpl?.palette||null;state.heroTitle=tpl?.heroTitle||'A world designed to move.';state.heroSubtitle=tpl?.heroSubtitle||'A premium spatial template, now fully editable.';state.components=tpl?.components||['Story','Depth','Interaction'];state.sectionCopy=tpl?.sectionCopy||['Narrative-led section with editorial rhythm.','Layered depth and spatial composition.','Interactive details tuned for scroll.'];state.generation=7;makeVersion('Template applied');if(!state.projects.some(p=>p.name===state.projectName))state.projects.unshift({name:state.projectName,status:'Draft'});saveState();applyShellFromTemplate(tpl);saveState();navigate('builder');toast('Template added to workspace')}
  if(action==='aiChip'){const t=document.getElementById('builderPrompt');if(t){t.value=a.dataset.chipText||'';t.focus()}return}
  if(action==='aiEdit'){
    const q=($('#builderPrompt')?.value||'').trim();
    if(!q){toast('Type an edit first');return}
    aiEditCurrentSite(q,a);
    return;
  }
  if(action==='addComponent'){recordUndo();const c=a.dataset.component||'New section';state.components.push(c);state.sectionCopy.push('A new '+c.toLowerCase()+' section ready for direct editing and motion.');state.selected='component:'+(state.components.length-1);makeVersion(c+' added');render('builder');toast(c+' added to canvas')}
  if(action==='addPage'){makeVersion('New page added');toast('New page added')}
  if(action==='restoreVersion'){const id=+a.dataset.version;const v=state.versions.find(x=>x.id===id);if(v){recordUndo();restoreSnap(v.snapshot);render('builder');toast('Version restored')}}
  if(action==='undo'){const snap=state.undoStack?.pop();if(snap){state.redoStack.push(snapshot());restoreSnap(snap);render('builder');toast('Undone')}else toast('Nothing to undo')}
  if(action==='redo'){const snap=state.redoStack?.pop();if(snap){state.undoStack.push(snapshot());restoreSnap(snap);render('builder');toast('Redone')}else toast('Nothing to redo')}
  if(action==='preview'){modal(`<div class="modal-head"><b>Preview · ${state.projectName}</b><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><div class="template-preview t2" style="height:420px"><div style="padding:50px 34px;color:white"><span class="caps">Live preview</span><h2 style="font-size:42px;max-width:520px">${state.heroTitle}</h2><p class="muted">${state.heroSubtitle}</p></div></div><div style="display:flex;gap:8px;margin-top:12px"><button class="btn">Desktop</button><button class="btn">Tablet</button><button class="btn">Mobile</button><span class="grow"></span><button class="btn primary" data-action="publish">Publish</button></div></div>`)}
  if(action==='publish')publishModal();
  if(action==='confirmPublish'){publishSite(a);return}
  if(action==='connectDomain')domainModal();
  if(action==='domainAdded'){const input=$('#modal input')?.value||'mybrand.com';state.domains.unshift({name:input,project:state.projectName,status:'DNS setup',ssl:'Pending'});saveState();closeModal();navigate('domains');toast('Domain added — DNS setup pending')}
  if(action==='cycleLead'){const i=+a.dataset.lead;const order=['New','Contacted','Won'];const lead=state.leads[i];if(lead){lead.status=order[(order.indexOf(lead.status)+1)%order.length];saveState();render('leads');toast('Lead moved to '+lead.status)}}
  if(action==='previewTemplate'){templatePreviewModal(a.dataset.template||'Template');return}
  if(action==='customizePreviewTemplate'){const name=a.dataset.template||state.templatePreview||'Template';closeModal();recordUndo();state.projectName=name+' Project';state.heroTitle='A world designed to move.';state.heroSubtitle='A premium spatial template, now fully editable.';state.components=['Story','Depth','Interaction','Gallery'];state.sectionCopy=['Narrative-first content with clean editorial rhythm.','Layered visual depth that responds to scroll.','Micro-interactions that make the page feel alive.','A cinematic showcase for your strongest work.'];state.generation=7;state.selected='hero';makeVersion(name+' template customized');if(!state.projects.some(p=>p.name===state.projectName))state.projects.unshift({name:state.projectName,status:'Draft'});saveState();navigate('builder');toast('Template opened in editor');return}
  if(action==='selectLayer'){state.selected='component:'+a.dataset.index;saveState();render('builder');return}
  if(action==='selectSection'){const s=a.closest('[data-section-index]');if(s){state.selected='component:'+s.dataset.sectionIndex;saveState();render('builder')}return}
  if(action==='moveSectionUp'||action==='moveSectionDown'){const i=+a.dataset.index,dir=action==='moveSectionUp'?-1:1,j=i+dir;if(i>=0&&j>=0&&j<state.components.length){recordUndo();[state.components[i],state.components[j]]=[state.components[j],state.components[i]];[state.sectionCopy[i],state.sectionCopy[j]]=[state.sectionCopy[j],state.sectionCopy[i]];state.selected='component:'+j;makeVersion('Section reordered');render('builder');toast('Section moved')}return}
  if(action==='duplicateSection'){const i=+a.dataset.index;if(state.components[i]){recordUndo();state.components.splice(i+1,0,state.components[i]+' Copy');state.sectionCopy.splice(i+1,0,state.sectionCopy[i]||'Duplicated editable section.');state.selected='component:'+(i+1);makeVersion('Section duplicated');render('builder')}return}
  if(action==='deleteSection'){const i=+a.dataset.index;if(state.components[i]){recordUndo();const removed=state.components.splice(i,1)[0];state.sectionCopy.splice(i,1);state.selected='hero';makeVersion(removed+' deleted');render('builder');toast('Section deleted')}return}
  if(action==='duplicateSelected'){const i=+(state.selected||'component:0').split(':')[1];if(Number.isFinite(i)){recordUndo();state.components.splice(i+1,0,(state.components[i]||'Section')+' Copy');state.sectionCopy.splice(i+1,0,state.sectionCopy[i]||'Duplicated editable section.');state.selected='component:'+(i+1);makeVersion('Section duplicated');render('builder')}return}
  if(action==='deleteSelected'){const i=+(state.selected||'component:0').split(':')[1];if(Number.isFinite(i)&&state.components[i]){recordUndo();state.components.splice(i,1);state.sectionCopy.splice(i,1);state.selected='hero';makeVersion('Section deleted');render('builder')}return}
  if(action==='toggleTimeline'){state.timelineOpen=!state.timelineOpen;saveState();render('builder');return}
  if(action==='addKeyframe'){recordUndo();state.motion.keyframes.push(Math.min(92,12+state.motion.keyframes.length*17));state.motion.keyframes=state.motion.keyframes.slice(-6);makeVersion('Motion keyframe added');render('builder');toast('Keyframe added');return}
  if(action==='playTimeline'){toast('Motion preview playing');const el=document.querySelector(state.selected==='hero'?'.site-hero':`[data-section-index="${(state.selected||'component:0').split(':')[1]}"]`);if(el){el.animate([{transform:'translateY(18px) scale(.98)',opacity:.45},{transform:'translateY(0) scale(1)',opacity:1},{transform:'translateY(-8px) scale(1.02)',opacity:1}],{duration:Math.max(600,state.motion.duration*1000),easing:'cubic-bezier(.2,.8,.2,1)'})}return}
  if(action==='setMotionPreset'){recordUndo();state.motion.preset=a.dataset.preset||'Cinematic';if(state.motion.preset==='Fade up'){state.motion.depth=8;state.motion.parallax=0}else if(state.motion.preset==='Parallax'){state.motion.depth=30;state.motion.parallax=28}else if(state.motion.preset==='3D Push'){state.motion.depth=75;state.motion.parallax=18}else{state.motion.depth=42;state.motion.parallax=18}makeVersion('Motion · '+state.motion.preset);render('builder');return}
  if(action==='closeModal')closeModal();
  if(action==='useAsHero'){useAsHero(a);return}
  if(action==='imageToSite'){imageToSite(a);return}
  if(action==='studioToSite'){
    state.builderTab='ai';state.agentMode=true;saveState();
    navigate(state.generation>=7?'builder':'create');return;
  }
  if(action==='studioMode'){state.studioMode=a.dataset.mode||'image';saveState();render('studio');return}
  if(action==='studioReset'){state.studioPrompt='';state.studioResults=[];saveState();render('studio');return}
  if(action==='studioGenerate'){((state.studioMode||'image')==='video'?videoGenerate:studioGenerate)(a);return}
  if(action==='fixQA')toast('QA fixes applied');
  if(action==='selectHero'){state.selected='hero';saveState();render('builder');toast('Hero selected')}
});
document.addEventListener('input',e=>{
  const mi=e.target.closest('[data-motion-input]');if(mi){state.motion[mi.dataset.motionInput]=+mi.value;saveState();return}
  const pe=e.target.closest('[data-prop-edit]');if(pe){const key=pe.dataset.propEdit;state[key]=pe.value;saveState();const el=document.querySelector(`[data-edit="${key}"]`);if(el)el.textContent=pe.value;return}
  const se=e.target.closest('[data-section-prop]');if(se){const i=+se.dataset.index;if(se.dataset.sectionProp==='title'){state.components[i]=se.value;const el=document.querySelector(`[data-edit-section-title="${i}"]`);if(el)el.textContent=se.value}else{state.sectionCopy[i]=se.value;const el=document.querySelector(`[data-edit-section-copy="${i}"]`);if(el)el.textContent=se.value}saveState();return}
});
document.addEventListener('focusin',e=>{if(e.target.matches&&e.target.matches('[contenteditable="true"]'))e.target.dataset.before=e.target.textContent});
document.addEventListener('focusout',e=>{const el=e.target;if(!el.matches||!el.matches('[contenteditable="true"]'))return;const before=el.dataset.before||'';if(el.dataset.editCta!==undefined){const i=Number(el.dataset.editCta),v=el.textContent.trim();const list=(state.heroCtas&&state.heroCtas.length?state.heroCtas.slice():['Explore experience']);if(v&&list[i]!==v){recordUndo();list[i]=v.slice(0,40);state.heroCtas=list;saveState();makeVersion('CTA edited')}return}if(el.dataset.edit){const key=el.dataset.edit;if(el.textContent!==before){recordUndo();state[key]=el.textContent.trim();makeVersion('Direct text edit');saveState();toast('Text updated')}}else if(el.dataset.editSectionTitle!==undefined){const i=+el.dataset.editSectionTitle;if(state.components[i]!==el.textContent.trim()){recordUndo();state.components[i]=el.textContent.trim()||state.components[i];makeVersion('Section title edited');saveState();toast('Section title updated')}}else if(el.dataset.editSectionCopy!==undefined){const i=+el.dataset.editSectionCopy;if((state.sectionCopy[i]||'')!==el.textContent.trim()){recordUndo();state.sectionCopy[i]=el.textContent.trim();makeVersion('Section copy edited');saveState();toast('Section copy updated')}}delete el.dataset.before});
document.addEventListener('dragstart',e=>{const s=e.target.closest('[data-section-index]');if(!s)return;state.dragIndex=+s.dataset.sectionIndex;s.classList.add('dragging');if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',s.dataset.sectionIndex)}});
document.addEventListener('dragover',e=>{const s=e.target.closest('[data-section-index]');if(!s)return;e.preventDefault();document.querySelectorAll('.editable-section').forEach(x=>x.classList.remove('drag-over'));s.classList.add('drag-over')});
document.addEventListener('drop',e=>{const s=e.target.closest('[data-section-index]');if(!s)return;e.preventDefault();const from=state.dragIndex,to=+s.dataset.sectionIndex;document.querySelectorAll('.editable-section').forEach(x=>x.classList.remove('drag-over','dragging'));if(Number.isFinite(from)&&Number.isFinite(to)&&from!==to){recordUndo();const [item]=state.components.splice(from,1);state.components.splice(to,0,item);const [copy]=state.sectionCopy.splice(from,1);state.sectionCopy.splice(to,0,copy||'A responsive, editable section with spatial depth and motion controls.');state.selected='component:'+to;state.dragIndex=null;makeVersion('Section drag reordered');render('builder');toast('Section reordered')}else state.dragIndex=null});
document.addEventListener('dragend',()=>{state.dragIndex=null;document.querySelectorAll('.editable-section').forEach(x=>x.classList.remove('drag-over','dragging'))});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();toast('Command palette: Create · Projects · Builder · Admin')}});
window.addEventListener('mousemove',e=>{if(state.route!=='marketing')return;const x=(e.clientX/window.innerWidth-.5)*2,y=(e.clientY/window.innerHeight-.5)*2;document.documentElement.style.setProperty('--mx',x.toFixed(2));document.documentElement.style.setProperty('--my',y.toFixed(2))});
// Only "#/route" is a route. The public page's own links are plain anchors —
// #features, #showcase, #pricing, #templates — and this used to hand those
// straight to navigate(), which has no such view: signed in it rendered the
// dashboard over the landing page, signed out it asked for a login. Clicking
// Product on the home page took you out of the home page.
window.addEventListener('hashchange',()=>{
  if(!/^#\//.test(location.hash))return;
  const r=location.hash.slice(2);
  if(r)navigate(r);
});


/* ===== NEXT FLOW: MULTI-PAGE + BRAND + REUSABLE + 3D SCENES ===== */
(function(){
  function pageId(name){return (name||'page').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+Math.random().toString(36).slice(2,6)}
  function pageFromLegacy(name='Home',slug='/'){
    return {id:pageId(name),name,slug,heroTitle:state.heroTitle,heroSubtitle:state.heroSubtitle,components:[...state.components],sectionCopy:[...(state.sectionCopy||[])]};
  }
  if(!Array.isArray(state.pages)||!state.pages.length){
    const home=pageFromLegacy('Home','/');
    state.pages=[home,
      {id:pageId('Project'),name:'Project',slug:'/project',heroTitle:'Designed around a slower rhythm.',heroSubtitle:'Explore the architecture, material palette and spatial idea behind the project.',components:['Concept','Architecture','Materials'],sectionCopy:['The idea behind the place.','A sequence of spaces shaped by light.','Stone, glass and landscape in balance.']},
      {id:pageId('Gallery'),name:'Gallery',slug:'/gallery',heroTitle:'Frames from another pace.',heroSubtitle:'A cinematic visual archive of spaces, materials and atmosphere.',components:['Featured Frames','Details','Night Sequence'],sectionCopy:['Large-format editorial imagery.','Close material studies and crafted moments.','A darker, motion-led visual sequence.']},
      {id:pageId('Contact'),name:'Contact',slug:'/contact',heroTitle:'Come experience it in person.',heroSubtitle:'Book a private walkthrough or speak with the project team.',components:['Visit','Enquiry Form','Location'],sectionCopy:['Private visits by appointment.','A clean conversion-focused enquiry flow.','Map, access and local context.']}
    ];
    state.currentPageId=home.id;
  }
  state.currentPageId=state.currentPageId||state.pages[0].id;
  state.brand=Object.assign({primary:'#7d6cff',accent:'#dfff45',background:'#f4f0df',text:'#111111',radius:22,spacing:1,heading:'Display Sans',body:'Inter'},state.brand||{});
  state.savedComponents=Array.isArray(state.savedComponents)?state.savedComponents:[];
  state.sceneMap=state.sceneMap||{};
  state.globalNav=state.globalNav!==false;

  function activePage(){return state.pages.find(p=>p.id===state.currentPageId)||state.pages[0]}
  function syncPageFromLegacy(){
    if(state._switchingPage)return;
    const p=activePage(); if(!p)return;
    p.heroTitle=state.heroTitle;p.heroSubtitle=state.heroSubtitle;p.components=[...state.components];p.sectionCopy=[...(state.sectionCopy||[])];
  }
  function loadPage(id){
    syncPageFromLegacy();
    const p=state.pages.find(x=>x.id===id); if(!p)return;
    state._switchingPage=true;state.currentPageId=p.id;state.heroTitle=p.heroTitle;state.heroSubtitle=p.heroSubtitle;state.components=[...(p.components||[])];state.sectionCopy=[...(p.sectionCopy||[])];state.selected='hero';state._switchingPage=false;saveState();
  }
  function persistOnly(){try{localStorage.setItem('scenspace3d_state',JSON.stringify(state))}catch(e){}}
  window.saveState=function(){syncPageFromLegacy();persistOnly()}
  window.snapshot=function(){syncPageFromLegacy();return {heroTitle:state.heroTitle,heroSubtitle:state.heroSubtitle,components:[...state.components],sectionCopy:[...(state.sectionCopy||[])],motion:JSON.parse(JSON.stringify(state.motion||{})),selected:state.selected,currentPageId:state.currentPageId,pages:JSON.parse(JSON.stringify(state.pages)),brand:JSON.parse(JSON.stringify(state.brand)),sceneMap:JSON.parse(JSON.stringify(state.sceneMap)),savedComponents:JSON.parse(JSON.stringify(state.savedComponents))}}
  window.restoreSnap=function(x){if(!x)return;state.pages=x.pages?JSON.parse(JSON.stringify(x.pages)):state.pages;state.currentPageId=x.currentPageId||state.currentPageId;state.brand=x.brand?JSON.parse(JSON.stringify(x.brand)):state.brand;state.sceneMap=x.sceneMap?JSON.parse(JSON.stringify(x.sceneMap)):state.sceneMap;state.savedComponents=x.savedComponents?JSON.parse(JSON.stringify(x.savedComponents)):state.savedComponents;state.heroTitle=x.heroTitle;state.heroSubtitle=x.heroSubtitle;state.components=[...(x.components||[])];state.sectionCopy=[...(x.sectionCopy||[])];if(x.motion)state.motion=JSON.parse(JSON.stringify(x.motion));state.selected=x.selected||'hero';syncPageFromLegacy();persistOnly()}

  // A design — or a brief — describes one site, not the demo sitemap. Without
  // this the generated content landed on whichever page happened to be open
  // (Gallery, usually) while the nav still read Home / Project / Gallery /
  // Contact and those pages still held the sample property copy.
  window.applyPagesFromSections=function(sections,opts){
    const o=opts||{},list=(sections||[]).filter(x=>x&&x.name).slice(0,6);
    const home=(state.pages&&state.pages[0])||pageFromLegacy('Home','/');
    home.name='Home';home.slug='/';
    const pages=[home];
    list.forEach(function(s){
      const name=String(s.name).slice(0,20),copy=String(s.copy||'').slice(0,200);
      const low=name.toLowerCase();
      pages.push({
        id:pageId(name),name,slug:'/'+low.replace(/[^a-z0-9]+/g,'-'),
        heroTitle:name,
        heroSubtitle:copy||('Everything about '+low+', in one place.'),
        components:['Overview','Details','Next step'],
        sectionCopy:[copy||('An introduction to '+low+'.'),
          'The specifics for this page — click any text to edit it.',
          o.cta?('Ready when you are — '+String(o.cta).toLowerCase()+'.'):'Ready when you are.']
      });
    });
    state.pages=pages;
    // the new content belongs on the home page, not on whatever was open
    state.currentPageId=home.id;
    return pages.length;
  };
  // A fresh project must not inherit the sitemap of the last one.
  window.resetPages=function(){
    const home=pageFromLegacy('Home','/');
    state.pages=[home];state.currentPageId=home.id;
  };

  function sceneKey(sel=state.selected){return state.currentPageId+':'+(sel||'hero')}
  function currentScene(sel=state.selected){const key=sceneKey(sel);state.sceneMap[key]=Object.assign({enabled:sel==='hero',trigger:'Scroll into view',camera:sel==='hero'?'Push In':'Orbit',intensity:42,pin:false,start:18,end:82},state.sceneMap[key]||{});return state.sceneMap[key]}
  function sceneLabel(sel){const s=currentScene(sel);return s.enabled?`<span class="scene-badge">3D · ${s.camera}</span>`:''}

  const oldRenderCanvasSection=renderCanvasSection;
  window.renderCanvasSection=function(name,index){
    const selected=state.selected===`component:${index}`, sc=currentScene(`component:${index}`), reusable=state.savedComponents.some(x=>x.title===name);
    return `<section class="editable-section ${selected?'selected-outline':''} ${sc.enabled?'scene-enabled':''} ${reusable?'component-master':''}" draggable="true" data-section-index="${index}" data-action="selectSection" data-scene="${sc.enabled?'1':'0'}" data-camera="${sc.camera}">${sceneLabel(`component:${index}`)}<div class="section-tools"><button class="drag-handle">⠿ Drag</button><button data-action="moveSectionUp" data-index="${index}">↑</button><button data-action="moveSectionDown" data-index="${index}">↓</button><button data-action="saveReusable" data-index="${index}">Save</button><button data-action="duplicateSection" data-index="${index}">Duplicate</button><button data-action="deleteSection" data-index="${index}">Delete</button></div><span class="caps" style="color:#777">Section ${String(index+1).padStart(2,'0')}</span><h3 contenteditable="true" spellcheck="false" data-edit-section-title="${index}">${name}</h3><p contenteditable="true" spellcheck="false" data-edit-section-copy="${index}">${state.sectionCopy?.[index]||'A responsive, editable section with spatial depth and motion controls.'}</p><div class="section-visual"></div></section>`
  }

  const oldBuilderPanel=builderPanel;
  window.builderPanel=function(){
    if(state.builderTab==='pages'){
      return `<h3>Pages <span class="global-badge">MULTI</span></h3><div class="drop-tip">Each page keeps its own content and sections. Brand styles stay global.</div><div class="page-list">${state.pages.map((p,i)=>`<div class="page-row ${p.id===state.currentPageId?'active':''}"><button class="page-icon-btn" data-action="switchPage" data-page="${p.id}">${p.id===state.currentPageId?'●':'○'}</button><button class="page-name" style="border:0;background:transparent;color:inherit;text-align:left" data-action="switchPage" data-page="${p.id}">${p.name}<div class="tiny muted">${p.slug}</div></button><div class="page-actions"><button class="page-icon-btn" title="Duplicate" data-action="duplicatePage" data-page="${p.id}">⧉</button>${state.pages.length>1?`<button class="page-icon-btn" title="Delete" data-action="deletePage" data-page="${p.id}">×</button>`:''}</div></div>`).join('')}</div><button class="btn primary" style="width:100%;margin-top:10px" data-action="addPage">＋ Add page</button>`
    }
    if(state.builderTab==='brand'){
      return `<h3>Brand Kit <span class="global-badge">GLOBAL</span></h3><div class="drop-tip">One design system updates every page in this project.</div><div class="brand-preview" style="--brand-bg:${state.brand.background};--brand-text:${state.brand.text};--brand-primary:${state.brand.primary}"></div><div class="brand-color-grid">${[['primary','Primary'],['accent','Accent'],['background','Canvas'],['text','Text']].map(([k,n])=>`<label class="brand-color"><input type="color" value="${state.brand[k]}" data-brand-input="${k}"/><span>${n}<br>${state.brand[k]}</span></label>`).join('')}</div><div class="prop-section"><h4>Shape</h4><label class="tiny muted">Corner radius</label><div class="range-line"><input class="prop-input" type="range" min="0" max="48" value="${state.brand.radius}" data-brand-input="radius"/><output>${state.brand.radius}px</output></div><label class="tiny muted">Global spacing</label><div class="range-line"><input class="prop-input" type="range" min="0.75" max="1.35" step="0.05" value="${state.brand.spacing}" data-brand-input="spacing"/><output>${state.brand.spacing}×</output></div></div><div class="prop-section"><h4>Typography</h4><div class="field"><label>Heading style</label><select class="prop-input" data-brand-input="heading"><option ${state.brand.heading==='Display Sans'?'selected':''}>Display Sans</option><option ${state.brand.heading==='Editorial Serif'?'selected':''}>Editorial Serif</option><option ${state.brand.heading==='Neo Grotesk'?'selected':''}>Neo Grotesk</option></select></div><div class="field"><label>Body style</label><select class="prop-input" data-brand-input="body"><option>Inter</option><option>System</option><option>Editorial</option></select></div></div>`
    }
    if(state.builderTab==='components'){
      return `<h3>Add component</h3><div class="drop-tip">Add a section, or reuse a saved master across pages.</div><div class="component-grid">${['Hero','Navbar','Features','Gallery','Stats','Pricing','FAQ','CTA','Form','Footer','Video','3D Scene'].map(x=>`<button class="component" data-action="addComponent" data-component="${x}">${x}</button>`).join('')}</div><div class="reusable-box"><div class="caps">Reusable masters</div>${state.savedComponents.length?state.savedComponents.map(c=>`<div class="saved-component"><div><b>${c.name}</b><div class="tiny muted">${c.title}</div></div><button class="btn ghost" data-action="insertReusable" data-master="${c.id}">＋</button></div>`).join(''):`<p class="tiny muted">Save any selected section as a reusable master.</p>`}<button class="btn" style="width:100%;margin-top:7px" data-action="saveSelectedReusable">Save selected as master</button></div>`
    }
    return oldBuilderPanel()
  }

  const oldPropsPanel=propsPanel;
  window.propsPanel=function(){
    if(state.propTab==='scene'){
      const sc=currentScene();
      return `<div class="selection-label">3D Scene · <b>${state.selected==='hero'?'Hero':state.selected.replace('component:','Section ')}</b></div><div class="scene-card ${sc.enabled?'active':''}"><div class="row"><div><b>Spatial scene</b><div class="tiny muted">Camera + scroll response</div></div><span class="grow"></span><button class="btn ${sc.enabled?'primary':''}" data-action="toggleScene">${sc.enabled?'ON':'OFF'}</button></div></div><div class="prop-section"><h4>Camera movement</h4><div class="motion-presets">${['Push In','Orbit','Rise','Drift'].map(x=>`<button class="motion-preset ${sc.camera===x?'active':''}" data-action="sceneCamera" data-camera="${x}">${x}</button>`).join('')}</div></div><div class="prop-section"><h4>Trigger</h4><div class="trigger-grid">${['Scroll into view','Scroll progress','Hover','Page load'].map(x=>`<button class="trigger-btn ${sc.trigger===x?'active':''}" data-action="sceneTrigger" data-trigger="${x}">${x}</button>`).join('')}</div><label class="tiny muted" style="display:block;margin-top:10px">Intensity · ${sc.intensity}%</label><input class="prop-input" type="range" min="0" max="100" value="${sc.intensity}" data-scene-input="intensity"/><label class="tiny muted">Start · ${sc.start}%</label><input class="prop-input" type="range" min="0" max="80" value="${sc.start}" data-scene-input="start"/><label class="tiny muted">End · ${sc.end}%</label><input class="prop-input" type="range" min="20" max="100" value="${sc.end}" data-scene-input="end"/></div><div class="prop-section"><button class="btn primary" style="width:100%" data-action="previewScene">▶ Preview selected scene</button></div>`
    }
    return oldPropsPanel()
  }

  window.builderView=function(){
    const p=activePage();const brand=state.brand;const heroScene=currentScene('hero');
    return `<div class="view builder-view"><div class="builder-top"><button class="btn ghost" data-nav="projects">←</button><b style="font-size:12px">${state.projectName}</b><div class="page-switcher"><span class="tiny muted">Page</span><select data-page-select>${state.pages.map(x=>`<option value="${x.id}" ${x.id===state.currentPageId?'selected':''}>${x.name}</option>`).join('')}</select></div><span class="pill save-indicator">Saved locally</span><span class="grow"></span><button class="btn ghost" data-action="undo">↶</button><button class="btn ghost" data-action="redo">↷</button><button class="btn ${state.device==='desktop'?'primary':''}" data-device="desktop">Desktop</button><button class="btn ${state.device==='tablet'?'primary':''}" data-device="tablet">Tablet</button><button class="btn ${state.device==='mobile'?'primary':''}" data-device="mobile">Mobile</button><button class="btn ${state.timelineOpen?'primary':''}" data-action="toggleTimeline">⌁ Timeline</button><button class="btn" data-action="preview">Preview</button><button class="btn primary" data-action="publish">${state.published?'Published ✓':'Publish'}</button></div><div class="builder-left"><div class="builder-tabs">${[['ai','✦'],['pages','☷'],['components','＋'],['layers','≡'],['brand','◇'],['media','◉'],['history','↺']].map(x=>`<button class="btab ${state.builderTab===x[0]?'active':''}" data-btab="${x[0]}">${x[1]}</button>`).join('')}</div><div class="builder-panel">${builderPanel()}</div></div><div class="builder-canvas-wrap ${state.timelineOpen?'timeline-space':''}"><div class="canvas-device ${state.device}" style="--site-bg:${brand.background};--site-text:${brand.text};--site-primary:${brand.primary};--site-accent:${brand.accent};--site-radius:${brand.radius}px;--site-space:${brand.spacing}"><div class="site-preview-nav"><span class="slogo">${state.projectName.split(' ')[0].toUpperCase()}</span><div class="snlinks">${state.pages.slice(0,4).map(x=>`<button style="border:0;background:transparent;color:inherit;font-size:10px" data-action="switchPage" data-page="${x.id}">${x.name}</button>`).join('')}</div><span class="sbtn">Get started</span></div><section class="site-hero ${state.selected==='hero'?'selected-outline':''} ${heroScene.enabled?'scene-enabled':''}" data-action="selectHero" data-scene="${heroScene.enabled?'1':'0'}" data-camera="${heroScene.camera}">${sceneLabel('hero')}<span class="direct-edit-hint">Click text and type directly</span><span class="eyebrow">${heroEyebrow(p)}</span><h1 contenteditable="true" spellcheck="false" data-edit="heroTitle">${state.heroTitle}</h1><p contenteditable="true" spellcheck="false" data-edit="heroSubtitle">${state.heroSubtitle}</p>${(state.heroCtas&&state.heroCtas.length?state.heroCtas:['Explore experience']).slice(0,3).map((c,i)=>`<span class="site-cta ${i?'alt':''}" contenteditable="true" spellcheck="false" data-edit-cta="${i}">${escV(c)}</span>`).join('')}<div class="site-3d"><div class="site-cube"><i></i><i></i><i></i></div></div></section>${state.components.map((x,i)=>renderCanvasSection(x,i)).join('')}${state.components.length?`<section class="site-section"><span class="caps" style="color:#777">End of ${p.name}</span><h2>Every page stays independent.</h2><p class="muted">Brand kit, reusable masters and motion rules stay connected across the project.</p></section>`:`<section class="page-empty"><div><span class="caps">Empty page</span><h2>Start with a section.</h2><p>Add a component from the left panel or reuse a saved master.</p></div></section>`}</div></div><div class="builder-right"><div class="prop-tabs">${[['design','Design'],['motion','Motion'],['scene','3D Scene'],['seo','SEO'],['qa','QA']].map(x=>`<button class="prop-tab ${state.propTab===x[0]?'active':''}" data-proptab="${x[0]}">${x[1]}</button>`).join('')}</div><div class="props">${propsPanel()}</div></div>${state.timelineOpen?motionTimeline():''}</div>`
  }

  window.bindBuilder=function(){
    applySceneObserver();
  }
  function applySceneObserver(){
    const root=document.querySelector('.builder-canvas-wrap');if(!root)return;
    const nodes=[...root.querySelectorAll('.scene-enabled')];
    if(!('IntersectionObserver' in window)){nodes.forEach(n=>n.classList.add('scene-in'));return}
    const obs=new IntersectionObserver(entries=>entries.forEach(en=>{if(en.isIntersecting)en.target.classList.add('scene-in');else if(en.target.dataset.scene==='1')en.target.classList.remove('scene-in')}),{root,threshold:.28});nodes.forEach(n=>obs.observe(n));
  }
  function addPageModal(){modal(`<div class="modal-head"><b>Add page</b><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><div class="field"><label>Page name</label><input id="newPageName" value="New Page" autofocus/></div><div class="field"><label>URL path</label><input id="newPageSlug" value="/new-page"/></div><div class="option-grid"><div class="option"><b>Blank page</b><p>Start with an empty responsive canvas.</p></div><div class="option"><b>AI starter</b><p>Hero + Story + CTA ready to edit.</p></div></div><button class="btn primary" style="width:100%;margin-top:10px" data-action="confirmAddPage">Create page →</button></div>`)}

  const handled=new Set(['switchPage','addPage','confirmAddPage','duplicatePage','deletePage','saveReusable','saveSelectedReusable','insertReusable','toggleScene','sceneCamera','sceneTrigger','previewScene']);
  document.addEventListener('click',function(e){
    const a=e.target.closest('[data-action]');if(!a||!handled.has(a.dataset.action))return;
    e.preventDefault();e.stopImmediatePropagation();
    const action=a.dataset.action;
    if(action==='switchPage'){loadPage(a.dataset.page);render('builder');toast('Page switched · '+activePage().name);return}
    if(action==='addPage'){addPageModal();return}
    if(action==='confirmAddPage'){
      const name=($('#newPageName')?.value||'New Page').trim();let slug=($('#newPageSlug')?.value||('/'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'))).trim();if(!slug.startsWith('/'))slug='/'+slug;
      syncPageFromLegacy();const p={id:pageId(name),name,slug,heroTitle:name+' — designed in depth.',heroSubtitle:'A new page ready for content, motion and spatial scenes.',components:['Story','CTA'],sectionCopy:['Tell the story of this page.','Guide the visitor to the next action.']};state.pages.push(p);loadPage(p.id);makeVersion('Page created · '+name);closeModal();render('builder');toast(name+' created');return
    }
    if(action==='duplicatePage'){
      syncPageFromLegacy();const src=state.pages.find(p=>p.id===a.dataset.page);if(!src)return;const copy=JSON.parse(JSON.stringify(src));copy.id=pageId(src.name);copy.name=src.name+' Copy';copy.slug=(src.slug==='/'?'/home':src.slug)+'-copy';state.pages.push(copy);loadPage(copy.id);makeVersion('Page duplicated · '+src.name);render('builder');toast('Page duplicated');return
    }
    if(action==='deletePage'){
      if(state.pages.length<=1){toast('Keep at least one page');return}const id=a.dataset.page;const p=state.pages.find(x=>x.id===id);state.pages=state.pages.filter(x=>x.id!==id);if(state.currentPageId===id)loadPage(state.pages[0].id);persistOnly();render('builder');toast((p?.name||'Page')+' deleted');return
    }
    if(action==='saveReusable'||action==='saveSelectedReusable'){
      const i=action==='saveReusable'?+a.dataset.index:+(state.selected||'component:0').split(':')[1];if(!Number.isFinite(i)||!state.components[i]){toast('Select a section first');return}const master={id:'master-'+Date.now(),name:state.components[i]+' Master',title:state.components[i],copy:state.sectionCopy[i]||'Reusable section'};state.savedComponents.unshift(master);saveState();render('builder');toast('Reusable master saved');return
    }
    if(action==='insertReusable'){
      const m=state.savedComponents.find(x=>x.id===a.dataset.master);if(!m)return;recordUndo();state.components.push(m.title);state.sectionCopy.push(m.copy);state.selected='component:'+(state.components.length-1);makeVersion('Reusable component inserted');render('builder');toast(m.name+' inserted');return
    }
    const sc=currentScene();
    if(action==='toggleScene'){recordUndo();sc.enabled=!sc.enabled;makeVersion('3D scene '+(sc.enabled?'enabled':'disabled'));render('builder');return}
    if(action==='sceneCamera'){recordUndo();sc.camera=a.dataset.camera;sc.enabled=true;makeVersion('3D camera · '+sc.camera);render('builder');return}
    if(action==='sceneTrigger'){sc.trigger=a.dataset.trigger;sc.enabled=true;saveState();render('builder');toast('Trigger · '+sc.trigger);return}
    if(action==='previewScene'){
      const el=document.querySelector(state.selected==='hero'?'.site-hero':`[data-section-index="${(state.selected||'component:0').split(':')[1]}"]`);if(el){el.classList.remove('scene-in');void el.offsetWidth;el.classList.add('scene-in');el.animate([{transform:'perspective(900px) translateZ(-35px) rotateY(5deg)',opacity:.45},{transform:'perspective(900px) translateZ(0) rotateY(0)',opacity:1}],{duration:900,easing:'cubic-bezier(.16,.8,.2,1)'})}toast('3D scene preview');return
    }
  },true);

  document.addEventListener('change',function(e){
    if(e.target.matches('[data-page-select]')){loadPage(e.target.value);render('builder');toast('Page switched · '+activePage().name)}
    const bi=e.target.closest('[data-brand-input]');if(bi){state.brand[bi.dataset.brandInput]=bi.type==='range'?+bi.value:bi.value;saveState();render('builder');toast('Global brand updated')}
  },true);
  document.addEventListener('input',function(e){
    const bi=e.target.closest('[data-brand-input]');if(bi){state.brand[bi.dataset.brandInput]=bi.type==='range'?+bi.value:bi.value;saveState();const canvas=document.querySelector('.canvas-device');if(canvas){canvas.style.setProperty('--site-'+(bi.dataset.brandInput==='background'?'bg':bi.dataset.brandInput),bi.value+(bi.dataset.brandInput==='radius'?'px':''))}return}
    const si=e.target.closest('[data-scene-input]');if(si){const sc=currentScene();sc[si.dataset.sceneInput]=+si.value;sc.enabled=true;saveState();return}
  },true);

  // Keep the active page synchronized after direct editing and legacy controls.
  document.addEventListener('focusout',()=>{syncPageFromLegacy();persistOnly()},true);
  document.addEventListener('drop',()=>{setTimeout(()=>{syncPageFromLegacy();persistOnly()},0)},true);
  // Migrate the loaded legacy values into the selected page once.
  const p=activePage();if(p){state._switchingPage=true;state.heroTitle=p.heroTitle;state.heroSubtitle=p.heroSubtitle;state.components=[...(p.components||[])];state.sectionCopy=[...(p.sectionCopy||[])];state._switchingPage=false;persistOnly()}
})();



/* ===== NEXT FLOW: RESPONSIVE + INTERACTIONS + FORMS + CMS + GLOBALS + EXPORT ===== */
(function(){
  const clone=x=>JSON.parse(JSON.stringify(x));
  state.deviceStyles=state.deviceStyles||{
    desktop:{heroFont:88,heroPad:70,sectionPad:62,navVisible:true,align:'left'},
    tablet:{heroFont:64,heroPad:48,sectionPad:44,navVisible:true,align:'left'},
    mobile:{heroFont:44,heroPad:30,sectionPad:30,navVisible:false,align:'left'}
  };
  state.interactionMap=state.interactionMap||{};
  state.globalHeader=Object.assign({enabled:true,sticky:true,logo:'YOUR BRAND',cta:'Get started',showCta:true},state.globalHeader||{});
  state.globalFooter=Object.assign({enabled:true,tagline:'Spatial websites built as experiences, not pages.',column1:'Explore',column2:'Company'},state.globalFooter||{});
  state.forms=Array.isArray(state.forms)&&state.forms.length?state.forms:[
    {id:'form-enquiry',name:'Project Enquiry',submitLabel:'Send enquiry',successMessage:'Thanks — we’ll be in touch.',storeToLeads:true,fields:[{id:'f-name',label:'Name',type:'text',required:true},{id:'f-email',label:'Email',type:'email',required:true},{id:'f-phone',label:'Phone',type:'tel',required:false},{id:'f-message',label:'Message',type:'textarea',required:false}]},
    {id:'form-visit',name:'Book a Visit',submitLabel:'Book visit',successMessage:'Visit request received.',storeToLeads:true,fields:[{id:'v-name',label:'Name',type:'text',required:true},{id:'v-date',label:'Preferred date',type:'date',required:true},{id:'v-phone',label:'Phone',type:'tel',required:true}]}
  ];
  state.activeFormId=state.activeFormId||state.forms[0].id;
  state.collections=Array.isArray(state.collections)&&state.collections.length?state.collections:[
    {id:'col-projects',name:'Projects',slug:'projects',fields:['Title','Category','Status'],items:[]},
    {id:'col-journal',name:'Journal',slug:'journal',fields:['Title','Category','Status'],items:[]}
  ];
  state.activeCollectionId=state.activeCollectionId||state.collections[0].id;
  state.publishSettings=Object.assign({subdomain:'',visibility:'Public',password:'',lastPublished:''},state.publishSettings||{});
  function persist(){try{localStorage.setItem('scenspace3d_state',JSON.stringify(state))}catch(e){}}
  function selectedKey(){return state.currentPageId+':'+(state.selected||'hero')}
  function interaction(sel=state.selected){const key=state.currentPageId+':'+(sel||'hero');state.interactionMap[key]=Object.assign({hover:'Lift',click:'None',cursor:'Default',speed:300},state.interactionMap[key]||{});return state.interactionMap[key]}
  function ds(){return state.deviceStyles[state.device]||state.deviceStyles.desktop}
  function activeForm(){return state.forms.find(f=>f.id===state.activeFormId)||state.forms[0]}
  function activeCollection(){return state.collections.find(c=>c.id===state.activeCollectionId)||state.collections[0]}
  function formHTML(form=activeForm()){
    if(!form)return '';
    return `<form class="form-preview" data-action="submitPreviewForm">${form.fields.map(f=>`<div class="fp-field"><label>${f.label}${f.required?' *':''}</label>${f.type==='textarea'?`<textarea name="${f.id}" placeholder="${f.label}"></textarea>`:f.type==='select'?`<select name="${f.id}"><option>Select…</option><option>Option one</option></select>`:`<input name="${f.id}" type="${f.type}" placeholder="${f.label}" ${f.required?'required':''}/>`}</div>`).join('')}<button type="submit">${form.submitLabel} →</button></form>`
  }
  function cmsGridHTML(col=activeCollection()){
    if(!col)return '<p>No collection selected.</p>';
    if(!col.items.length)return `<div class="empty-state">No items in ${col.name} yet. Add one to see it previewed here.</div>`;
    return `<div class="cms-grid-preview">${col.items.slice(0,6).map(item=>`<article class="cms-card-preview"><div class="thumb"></div><div class="copy"><span class="caps">${item.Category||col.name}</span><h4>${item.Title||'Untitled'}</h4><p>${item.Status||'Draft'} · CMS item</p></div></article>`).join('')}</div>`
  }

  // Standalone product routes.
  views.forms=()=>`${viewHead('Forms','Build conversion flows and send submissions into Leads.',`<button class="btn" data-action="previewActiveForm">Preview</button><button class="btn primary" data-action="newForm">＋ New form</button>`)}<div class="form-builder-grid"><div class="form-list card"><span class="caps">Forms</span><h3 style="margin:8px 0 14px">${state.forms.length} forms</h3>${state.forms.map(f=>`<div class="form-row ${f.id===state.activeFormId?'active':''}" data-action="selectForm" data-form="${f.id}"><b>${f.name}</b><div class="tiny muted">${f.fields.length} fields · ${f.storeToLeads?'Leads connected':'Standalone'}</div></div>`).join('')}</div><div class="form-editor card">${(()=>{const f=activeForm();return `<div class="row"><div><span class="caps">Form builder</span><h2 style="margin:5px 0">${f.name}</h2></div><span class="grow"></span><button class="btn" data-action="addFormField">＋ Field</button></div><div style="margin:15px 0">${f.fields.map((x,i)=>`<div class="field-builder"><input class="prop-input" value="${x.label}" data-form-field-label="${i}"/><select class="prop-input" data-form-field-type="${i}">${['text','email','tel','date','textarea','select'].map(t=>`<option ${x.type===t?'selected':''}>${t}</option>`).join('')}</select><label class="tiny"><input type="checkbox" data-form-field-required="${i}" ${x.required?'checked':''}/> Required</label><button class="mini-x" data-action="removeFormField" data-index="${i}">×</button></div>`).join('')}</div><div class="two-col"><div><div class="field"><label>Button label</label><input class="prop-input" value="${f.submitLabel}" data-form-meta="submitLabel"/></div><div class="field"><label>Success message</label><input class="prop-input" value="${f.successMessage}" data-form-meta="successMessage"/></div><label class="tiny"><input type="checkbox" data-form-meta-check="storeToLeads" ${f.storeToLeads?'checked':''}/> Add submissions to Leads</label></div><div class="card" style="padding:14px;background:#f3f1e8;color:#111">${formHTML(f)}</div></div>`})()}</div></div>`;
  views.cms=()=>`${viewHead('CMS Collections','Structured content that can power cards, galleries, journals and project grids.',`<button class="btn primary" data-action="newCollection">＋ Collection</button>`)}<div class="form-builder-grid"><div class="cms-list card"><span class="caps">Collections</span><h3 style="margin:8px 0 14px">Content model</h3>${state.collections.map(c=>`<div class="collection-row ${c.id===state.activeCollectionId?'active':''}" data-action="selectCollection" data-collection="${c.id}"><b>${c.name}</b><div class="tiny muted">/${c.slug} · ${c.items.length} items</div></div>`).join('')}</div><div class="cms-editor card"><div class="row"><div><span class="caps">Active collection</span><h2 style="margin:5px 0">${activeCollection().name}</h2></div><span class="grow"></span><button class="btn" data-action="addCMSItem">＋ Item</button><button class="btn" data-action="insertCMSSection">Add to site →</button></div><div class="cms-table" style="margin-top:15px"><div class="cms-tr header"><span>Title</span><span>Category</span><span>Status</span><span></span></div>${activeCollection().items.map((it,i)=>`<div class="cms-tr"><b>${it.Title||'Untitled'}</b><span>${it.Category||'—'}</span><span><span class="cms-pill">${it.Status||'Draft'}</span></span><button class="btn ghost" data-action="deleteCMSItem" data-index="${i}">×</button></div>`).join('')}</div><div style="margin-top:18px"><span class="caps">Live collection preview</span>${cmsGridHTML()}</div></div></div>`;

  const prevBuilderPanel=builderPanel;
  window.builderPanel=function(){
    if(state.builderTab==='global'){
      return `<h3>Global Site <span class="global-badge">ALL PAGES</span></h3><div class="drop-tip">Header and footer stay synchronized across every page.</div><div class="global-panel"><div class="global-item"><div class="row"><div><b>Global navbar</b><div class="tiny muted">Logo · page links · CTA</div></div><span class="grow"></span><button class="switch ${state.globalHeader.enabled?'on':''}" data-action="toggleGlobal" data-global="header"></button></div><div class="field"><label>Logo text</label><input class="prop-input" value="${state.globalHeader.logo}" data-global-input="logo"/></div><div class="field"><label>CTA</label><input class="prop-input" value="${state.globalHeader.cta}" data-global-input="cta"/></div><label class="tiny"><input type="checkbox" data-global-check="sticky" ${state.globalHeader.sticky?'checked':''}/> Sticky on scroll</label></div><div class="global-item"><div class="row"><div><b>Global footer</b><div class="tiny muted">Brand message + navigation</div></div><span class="grow"></span><button class="switch ${state.globalFooter.enabled?'on':''}" data-action="toggleGlobal" data-global="footer"></button></div><div class="field"><label>Footer message</label><textarea class="prop-input" rows="3" data-footer-input="tagline">${state.globalFooter.tagline}</textarea></div></div></div>`
    }
    if(state.builderTab==='components'){
      return `<h3>Add component</h3><div class="drop-tip">Add sections, forms and CMS-powered grids.</div><div class="component-grid">${['Hero','Features','Gallery','Stats','Pricing','FAQ','CTA','Form','CMS Grid','Video','3D Scene'].map(x=>`<button class="component" data-action="addComponent" data-component="${x}">${x}</button>`).join('')}</div><div class="reusable-box"><div class="caps">Reusable masters</div>${state.savedComponents.length?state.savedComponents.map(c=>`<div class="saved-component"><div><b>${c.name}</b><div class="tiny muted">${c.title}</div></div><button class="btn ghost" data-action="insertReusable" data-master="${c.id}">＋</button></div>`).join(''):`<p class="tiny muted">Save any selected section as a reusable master.</p>`}<button class="btn" style="width:100%;margin-top:7px" data-action="saveSelectedReusable">Save selected as master</button></div>`
    }
    return prevBuilderPanel();
  };

  const prevPropsPanel=propsPanel;
  window.propsPanel=function(){
    if(state.propTab==='device'){
      const d=ds();
      return `<div class="device-panel-head"><span class="device-dot"></span><div><b>${state.device[0].toUpperCase()+state.device.slice(1)} overrides</b><div class="tiny muted">Only this breakpoint changes</div></div></div><div class="prop-section"><h4>Typography</h4><label class="tiny muted">Hero size · ${d.heroFont}px</label><div class="range-line"><input class="prop-input" type="range" min="32" max="110" value="${d.heroFont}" data-device-style="heroFont"/><output>${d.heroFont}px</output></div></div><div class="prop-section"><h4>Spacing</h4><label class="tiny muted">Hero padding · ${d.heroPad}px</label><div class="range-line"><input class="prop-input" type="range" min="18" max="100" value="${d.heroPad}" data-device-style="heroPad"/><output>${d.heroPad}px</output></div><label class="tiny muted">Section padding · ${d.sectionPad}px</label><div class="range-line"><input class="prop-input" type="range" min="18" max="90" value="${d.sectionPad}" data-device-style="sectionPad"/><output>${d.sectionPad}px</output></div></div><div class="prop-section"><h4>Navigation</h4><button class="btn ${d.navVisible?'primary':''}" style="width:100%" data-action="toggleDeviceNav">${d.navVisible?'Visible':'Hidden'} on ${state.device}</button></div>`
    }
    if(state.propTab==='interact'){
      const it=interaction();
      return `<div class="selection-label">Interactions · <b>${state.selected==='hero'?'Hero':state.selected.replace('component:','Section ')}</b></div><div class="prop-section"><h4>Hover effect</h4><div class="motion-presets">${['None','Lift','Scale','Glow','Tilt'].map(x=>`<button class="motion-preset ${it.hover===x?'active':''}" data-action="setHover" data-hover="${x}">${x}</button>`).join('')}</div></div><div class="prop-section"><h4>Transition</h4><label class="tiny muted">Speed · ${it.speed}ms</label><div class="range-line"><input class="prop-input" type="range" min="100" max="900" step="50" value="${it.speed}" data-interaction-input="speed"/><output>${it.speed}ms</output></div></div><div class="prop-section"><h4>On click</h4><select class="prop-input" data-interaction-select="click"><option ${it.click==='None'?'selected':''}>None</option><option ${it.click==='Open page'?'selected':''}>Open page</option><option ${it.click==='Scroll to section'?'selected':''}>Scroll to section</option><option ${it.click==='Open modal'?'selected':''}>Open modal</option></select></div><button class="btn primary" style="width:100%" data-action="previewInteraction">Preview interaction</button>`
    }
    return prevPropsPanel();
  };

  const prevRenderSection=renderCanvasSection;
  window.renderCanvasSection=function(name,index){
    const selected=state.selected===`component:${index}`;const sc=state.sceneMap?.[state.currentPageId+':component:'+index]||{};const it=interaction('component:'+index);const body=state.sectionCopy?.[index]||'A responsive, editable section.';
    let special='';
    if(/form/i.test(name)) special=formHTML();
    if(/cms/i.test(name)) special=cmsGridHTML();
    return `<section class="editable-section interaction-target ${selected?'selected-outline':''} ${sc.enabled?'scene-enabled':''}" draggable="true" data-section-index="${index}" data-action="selectSection" data-scene="${sc.enabled?'1':'0'}" data-camera="${sc.camera||'Orbit'}" data-hover="${it.hover}" style="--interaction-speed:${it.speed}ms"><div class="section-tools"><button class="drag-handle">⠿ Drag</button><button data-action="moveSectionUp" data-index="${index}">↑</button><button data-action="moveSectionDown" data-index="${index}">↓</button><button data-action="saveReusable" data-index="${index}">Save</button><button data-action="duplicateSection" data-index="${index}">Duplicate</button><button data-action="deleteSection" data-index="${index}">Delete</button></div>${sc.enabled?`<span class="scene-badge">3D · ${sc.camera||'Orbit'}</span>`:''}<span class="caps" style="color:#777">Section ${String(index+1).padStart(2,'0')}${/cms/i.test(name)?' · '+activeCollection().name:''}</span><h3 contenteditable="true" spellcheck="false" data-edit-section-title="${index}">${name}</h3><p contenteditable="true" spellcheck="false" data-edit-section-copy="${index}">${body}</p>${special||templateBlock(index)||'<div class="section-visual"></div>'}</section>`;
  };

  window.builderView=function(){
    const p=state.pages.find(x=>x.id===state.currentPageId)||state.pages[0],brand=state.brand,d=ds();const hi=interaction('hero');const hs=state.sceneMap?.[state.currentPageId+':hero']||{enabled:true,camera:'Push In'};
    const nav=state.globalHeader.enabled?`<div class="site-preview-nav ${state.globalHeader.sticky?'global-sticky':''}" style="display:${d.navVisible?'flex':'none'}"><span class="slogo">${state.globalHeader.logo}</span><div class="snlinks">${state.pages.slice(0,5).map(x=>`<button style="border:0;background:transparent;color:inherit;font-size:10px" data-action="switchPage" data-page="${x.id}">${x.name}</button>`).join('')}</div>${state.globalHeader.showCta?`<span class="sbtn">${state.globalHeader.cta}</span>`:''}</div>`:'';
    const footer=state.globalFooter.enabled?`<footer class="site-global-footer"><div><h3>${state.globalHeader.logo}</h3><p>${state.globalFooter.tagline}</p></div><div><b>${state.globalFooter.column1}</b>${state.pages.slice(0,4).map(x=>`<a>${x.name}</a>`).join('')}</div><div><b>${state.globalFooter.column2}</b><a>About</a><a>Contact</a><a>Privacy</a></div></footer>`:'';
    return `<div class="view builder-view"><div class="builder-top"><button class="btn ghost" data-nav="projects">←</button><b style="font-size:12px">${state.projectName}</b><div class="page-switcher"><span class="tiny muted">Page</span><select data-page-select>${state.pages.map(x=>`<option value="${x.id}" ${x.id===state.currentPageId?'selected':''}>${x.name}</option>`).join('')}</select></div><span class="pill save-indicator">Saved locally</span><span class="grow"></span><button class="btn ghost" data-action="undo">↶</button><button class="btn ghost" data-action="redo">↷</button><button class="btn ${state.device==='desktop'?'primary':''}" data-device="desktop">Desktop</button><button class="btn ${state.device==='tablet'?'primary':''}" data-device="tablet">Tablet</button><button class="btn ${state.device==='mobile'?'primary':''}" data-device="mobile">Mobile</button><button class="btn ${state.timelineOpen?'primary':''}" data-action="toggleTimeline">⌁ Timeline</button><button class="btn" data-action="preview">Preview</button><button class="btn primary" data-action="publish">${state.published?'Published ✓':'Publish'}</button></div><div class="builder-left"><div class="builder-tabs">${[['ai','✦'],['pages','☷'],['components','＋'],['layers','≡'],['global','◎'],['brand','◇'],['media','◉'],['history','↺']].map(x=>`<button class="btab ${state.builderTab===x[0]?'active':''}" data-btab="${x[0]}">${x[1]}</button>`).join('')}</div><div class="builder-panel">${builderPanel()}</div></div><div class="builder-canvas-wrap ${state.timelineOpen?'timeline-space':''}"><div class="canvas-device ${state.device}" style="--site-bg:${brand.background};--site-text:${brand.text};--site-primary:${brand.primary};--site-accent:${brand.accent};--site-radius:${brand.radius}px;--site-space:${brand.spacing};--device-hero-font:${d.heroFont}px;--device-hero-pad:${d.heroPad}px;--device-section-pad:${d.sectionPad}px">${nav}<section class="site-hero interaction-target ${state.selected==='hero'?'selected-outline':''} ${hs.enabled?'scene-enabled':''}" data-action="selectHero" data-scene="${hs.enabled?'1':'0'}" data-camera="${hs.camera||'Push In'}" data-hover="${hi.hover}" style="--interaction-speed:${hi.speed}ms"><span class="direct-edit-hint">Click text and type directly</span><span class="eyebrow">${heroEyebrow(p)}</span><h1 contenteditable="true" spellcheck="false" data-edit="heroTitle">${state.heroTitle}</h1><p contenteditable="true" spellcheck="false" data-edit="heroSubtitle">${state.heroSubtitle}</p>${(state.heroCtas&&state.heroCtas.length?state.heroCtas:['Explore experience']).slice(0,3).map((c,i)=>`<span class="site-cta ${i?'alt':''}" contenteditable="true" spellcheck="false" data-edit-cta="${i}">${escV(c)}</span>`).join('')}<div class="site-3d"><div class="site-cube"><i></i><i></i><i></i></div></div></section>${state.components.map((x,i)=>renderCanvasSection(x,i)).join('')}${footer}</div></div><div class="builder-right"><div class="prop-tabs">${[['design','Design'],['device','Device'],['interact','Interact'],['motion','Motion'],['scene','3D'],['seo','SEO'],['qa','QA']].map(x=>`<button class="prop-tab ${state.propTab===x[0]?'active':''}" data-proptab="${x[0]}">${x[1]}</button>`).join('')}</div><div class="props">${propsPanel()}</div></div>${state.timelineOpen?motionTimeline():''}</div>`
  };

  // Advanced publish/export modal, no external APIs required.
  window.publishModal=function(){
    const checks=['Responsive breakpoints','SEO metadata','Navigation links','Forms connected','Global header/footer','3D scene fallbacks'];
    modal(`<div class="modal-head"><div><span class="caps">Publish & export</span><b style="display:block;margin-top:4px">${state.projectName}</b></div><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><div class="publish-flow"><div class="publish-target active"><span class="caps">Hosted preview</span><div class="pub-url"><span>scen.space/s/</span><input id="publishSlug" value="${escV(state.publishedSlug||defaultSlug())}" spellcheck="false"/></div><div id="publishMsg" class="tiny muted" style="min-height:15px;margin:6px 0">${state.publishedUrl?'Live at '+escV(state.publishedUrl):''}</div><p class="tiny muted">Publish the current project to its demo production URL.</p><button class="btn primary" data-action="publishDemo">${state.published?'Republish':'Publish now'} →</button></div><div class="publish-target"><span class="caps">Custom domain</span><h3>Use your domain</h3><p class="tiny muted">Point a domain you already own at your published site.</p><button class="btn" data-action="connectDomain">Connect domain</button></div><div class="publish-target locked-mini"><span class="caps">Cloud deploy</span><h3>Vercel / GitHub</h3><p class="tiny muted">Connect a Vercel or GitHub account to deploy from here.</p><button class="btn" data-action="apiLockedDeploy">Connect later</button></div></div><div class="check-list">${checks.map(x=>`<div class="check-item"><i>✓</i><span>${x}</span><span class="grow"></span><span class="tiny muted">Passed</span></div>`).join('')}</div><span class="caps">Export without APIs</span><div class="export-grid" style="margin-top:9px"><div class="export-card"><b>Standalone HTML</b><span class="tiny muted">Download a portable preview file.</span><button class="btn" style="width:100%;margin-top:10px" data-action="exportHTML">Download HTML</button></div><div class="export-card"><b>Project backup</b><span class="tiny muted">Pages, CMS, forms, motion and brand JSON.</span><button class="btn" style="width:100%;margin-top:10px" data-action="exportJSON">Download JSON</button></div></div></div>`)
  };

  function download(name,type,content){const b=new Blob([content],{type});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),600)}
  function exportHTML(){
    const p=state.pages.find(x=>x.id===state.currentPageId)||state.pages[0],brand=state.brand;
    const sections=state.components.map((x,i)=>`<section><small>SECTION ${i+1}</small><h2>${x}</h2><p>${state.sectionCopy[i]||''}</p></section>`).join('');
    return `<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${state.projectName}</title><style>body{margin:0;background:${brand.background};color:${brand.text};font-family:Arial,sans-serif}nav{padding:22px 6vw;display:flex;justify-content:space-between;border-bottom:1px solid #0002}.hero,section{padding:9vw 7vw}.hero{min-height:62vh;background:radial-gradient(circle at 80% 20%,${brand.primary}55,transparent 27%)}h1{font-size:clamp(52px,8vw,110px);line-height:.88;letter-spacing:-.06em;max-width:900px}h2{font-size:clamp(32px,5vw,68px)}p{max-width:650px;line-height:1.6;opacity:.7}section{border-top:1px solid #0002}footer{padding:50px 7vw;background:#0b0b0f;color:#fff}
/* ===== NEXT FLOW: COMMERCE OPS + MEMBERS + PRODUCTION ===== */
.ops-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:14px}.ops-card{padding:18px}.span-8{grid-column:span 8}.span-7{grid-column:span 7}.span-6{grid-column:span 6}.span-5{grid-column:span 5}.span-4{grid-column:span 4}.span-3{grid-column:span 3}.kpi{font-size:30px;font-weight:850;letter-spacing:-.04em;margin-top:7px}.ops-table{width:100%;border-collapse:collapse}.ops-table th,.ops-table td{text-align:left;padding:12px 10px;border-bottom:1px solid var(--line);font-size:13px}.ops-table th{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--muted)}.status-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;padding:6px 9px;font-size:11px}.status-pill:before{content:'';width:6px;height:6px;border-radius:50%;background:#aaa}.status-pill.paid:before,.status-pill.fulfilled:before,.status-pill.active:before{background:#b7ff3c;box-shadow:0 0 12px rgba(183,255,60,.45)}.status-pill.pending:before,.status-pill.processing:before{background:#ffd76a}.status-pill.cancelled:before{background:#ff7d7d}.stack{display:grid;gap:10px}.mini-row{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid var(--line)}.mini-row:last-child{border-bottom:0}.swatch{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--acid),#7beeff)}.checkout-preview{min-height:440px;background:#f7f4ec;color:#111;border-radius:26px;overflow:hidden;display:grid;grid-template-columns:1.1fr .9fr;border:1px solid rgba(0,0,0,.08)}.checkout-left{padding:30px}.checkout-right{padding:30px;background:#ece9df}.checkout-logo{font-weight:900;letter-spacing:-.03em}.checkout-field{height:44px;background:white;border:1px solid #d8d4c8;border-radius:12px;margin-top:9px}.checkout-pay{display:grid;gap:8px;margin-top:14px}.checkout-pay>div{padding:13px;border:1px solid #d8d4c8;border-radius:12px;background:white}.checkout-cta{margin-top:18px;background:#111;color:#fff;border-radius:13px;padding:14px;text-align:center;font-weight:800}.timeline-list{display:grid;gap:0}.timeline-item{display:grid;grid-template-columns:18px 1fr;gap:10px;position:relative;padding-bottom:18px}.timeline-item:before{content:'';width:8px;height:8px;border-radius:50%;background:var(--acid);margin-top:5px}.timeline-item:not(:last-child):after{content:'';position:absolute;left:3px;top:14px;bottom:0;width:1px;background:var(--line)}.coupon-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:800;letter-spacing:.08em}.zone-map{height:220px;border-radius:20px;background:radial-gradient(circle at 30% 30%,rgba(183,255,60,.18),transparent 22%),radial-gradient(circle at 70% 56%,rgba(123,238,255,.14),transparent 25%),linear-gradient(145deg,#15151b,#0d0d11);border:1px solid var(--line);position:relative;overflow:hidden}.zone-map:before,.zone-map:after{content:'';position:absolute;border:1px solid rgba(255,255,255,.12);border-radius:50%}.zone-map:before{width:260px;height:260px;left:14%;top:-40px}.zone-map:after{width:150px;height:150px;right:10%;bottom:-25px}.template-editor{display:grid;grid-template-columns:260px 1fr;gap:14px}.email-canvas{background:#f6f3eb;color:#171717;padding:28px;border-radius:20px;min-height:420px}.email-inner{max-width:520px;margin:auto;background:white;border-radius:20px;padding:28px;border:1px solid #dedad0}.day-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}.day-toggle{padding:12px 7px;text-align:center;border:1px solid var(--line);border-radius:14px;background:#111116}.day-toggle.active{border-color:rgba(183,255,60,.5);background:rgba(183,255,60,.08)}.member-card{padding:18px;border:1px solid var(--line);border-radius:18px;background:#111116}.avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#2a2a35,#16161c);font-weight:800}.plan-tier{padding:15px;border:1px solid var(--line);border-radius:16px}.plan-tier.featured{border-color:rgba(183,255,60,.45);background:rgba(183,255,60,.05)}.health-ring{width:128px;height:128px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--acid) 0 92%,#27272f 92% 100%);position:relative}.health-ring:after{content:'';position:absolute;inset:9px;background:#111116;border-radius:50%}.health-ring b{position:relative;z-index:1;font-size:26px}.activity-bar{height:7px;border-radius:99px;background:#22222a;overflow:hidden}.activity-bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--acid),#7beeff)}.favorite-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.favorite-card{padding:15px;border:1px solid var(--line);border-radius:17px;background:#111116}.favorite-art{height:100px;border-radius:13px;margin-bottom:10px;background:radial-gradient(circle at 50% 40%,rgba(183,255,60,.35),transparent 28%),linear-gradient(145deg,#22232a,#111116)}
@media(max-width:1100px){.ops-grid .span-8,.ops-grid .span-7,.ops-grid .span-6,.ops-grid .span-5,.ops-grid .span-4,.ops-grid .span-3{grid-column:span 12}.template-editor,.checkout-preview{grid-template-columns:1fr}.day-grid{grid-template-columns:repeat(4,1fr)}.favorite-grid{grid-template-columns:1fr 1fr}}

</style><nav><b>${state.globalHeader.logo}</b><span>${state.pages.map(x=>x.name).join(' · ')}</span></nav><div class="hero"><small>${p.name}</small><h1>${state.heroTitle}</h1><p>${state.heroSubtitle}</p></div>${sections}<footer>${state.globalFooter.tagline}</footer></html>`
  }

  const handled=new Set(['toggleGlobal','setHover','previewInteraction','toggleDeviceNav','selectForm','newForm','addFormField','removeFormField','previewActiveForm','submitPreviewForm','selectCollection','newCollection','addCMSItem','deleteCMSItem','insertCMSSection','publishDemo','apiLockedDeploy','exportHTML','exportJSON']);
  document.addEventListener('click',function(e){
    const a=e.target.closest('[data-action]');if(!a||!handled.has(a.dataset.action))return;
    e.preventDefault();e.stopImmediatePropagation();const action=a.dataset.action;
    if(action==='toggleGlobal'){const k=a.dataset.global;if(k==='header')state.globalHeader.enabled=!state.globalHeader.enabled;else state.globalFooter.enabled=!state.globalFooter.enabled;persist();render('builder');toast((k==='header'?'Navbar':'Footer')+' updated');return}
    if(action==='setHover'){interaction().hover=a.dataset.hover;persist();render('builder');return}
    if(action==='previewInteraction'){const el=document.querySelector(state.selected==='hero'?'.site-hero':`[data-section-index="${(state.selected||'component:0').split(':')[1]}"]`);if(el)el.animate([{transform:'translateY(0)'},{transform:'translateY(-12px) scale(1.02)'},{transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.2,.8,.2,1)'});toast('Interaction preview');return}
    if(action==='toggleDeviceNav'){ds().navVisible=!ds().navVisible;persist();render('builder');return}
    if(action==='selectForm'){state.activeFormId=a.dataset.form;persist();render('forms');return}
    if(action==='newForm'){const id='form-'+Date.now();state.forms.push({id,name:'New Form',submitLabel:'Submit',successMessage:'Thanks!',storeToLeads:true,fields:[{id:'name-'+Date.now(),label:'Name',type:'text',required:true},{id:'email-'+Date.now(),label:'Email',type:'email',required:true}]});state.activeFormId=id;persist();render('forms');toast('Form created');return}
    if(action==='addFormField'){const f=activeForm();f.fields.push({id:'field-'+Date.now(),label:'New field',type:'text',required:false});persist();render('forms');return}
    if(action==='removeFormField'){const f=activeForm();f.fields.splice(+a.dataset.index,1);persist();render('forms');return}
    if(action==='previewActiveForm'){modal(`<div class="modal-head"><b>${activeForm().name}</b><button class="close" data-action="closeModal">×</button></div><div class="modal-body" style="background:#f3f1e8;color:#111">${formHTML()}</div>`);return}
    if(action==='submitPreviewForm'){const f=activeForm();if(f.storeToLeads){state.leads.unshift({name:'New website lead',source:state.projectName,status:'New'})}persist();toast(f.successMessage);return}
    if(action==='selectCollection'){state.activeCollectionId=a.dataset.collection;persist();render('cms');return}
    if(action==='newCollection'){const id='col-'+Date.now();state.collections.push({id,name:'New Collection',slug:'new-collection',fields:['Title','Category','Status'],items:[]});state.activeCollectionId=id;persist();render('cms');toast('Collection created');return}
    if(action==='addCMSItem'){const c=activeCollection();c.items.push({id:'item-'+Date.now(),Title:'New CMS item',Category:'Featured',Status:'Draft'});persist();render('cms');return}
    if(action==='deleteCMSItem'){activeCollection().items.splice(+a.dataset.index,1);persist();render('cms');return}
    if(action==='insertCMSSection'){state.components.push('CMS Grid');state.sectionCopy.push('Dynamic content from '+activeCollection().name+'.');state.selected='component:'+(state.components.length-1);persist();navigate('builder');toast(activeCollection().name+' grid added to page');return}
    if(action==='publishDemo'){publishSite(a);return}
    if(action==='apiLockedDeploy'){toast('Connect a Vercel or GitHub account to deploy');return}
    if(action==='exportHTML'){download((state.projectName||'site').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.html','text/html',exportHTML());toast('Standalone HTML exported');return}
    if(action==='exportJSON'){download((state.projectName||'project').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-backup.json','application/json',JSON.stringify({projectName:state.projectName,pages:state.pages,brand:state.brand,globalHeader:state.globalHeader,globalFooter:state.globalFooter,forms:state.forms,collections:state.collections,deviceStyles:state.deviceStyles,interactionMap:state.interactionMap,sceneMap:state.sceneMap},null,2));toast('Project backup exported');return}
  },true);

  document.addEventListener('input',function(e){
    const di=e.target.closest('[data-device-style]');if(di){ds()[di.dataset.deviceStyle]=+di.value;persist();const canvas=document.querySelector('.canvas-device');if(canvas){const map={heroFont:'--device-hero-font',heroPad:'--device-hero-pad',sectionPad:'--device-section-pad'};canvas.style.setProperty(map[di.dataset.deviceStyle],di.value+'px')}return}
    const ii=e.target.closest('[data-interaction-input]');if(ii){interaction()[ii.dataset.interactionInput]=+ii.value;persist();return}
    const gi=e.target.closest('[data-global-input]');if(gi){state.globalHeader[gi.dataset.globalInput]=gi.value;persist();return}
    const fi=e.target.closest('[data-footer-input]');if(fi){state.globalFooter[fi.dataset.footerInput]=fi.value;persist();return}
    const fl=e.target.closest('[data-form-field-label]');if(fl){activeForm().fields[+fl.dataset.formFieldLabel].label=fl.value;persist();return}
    const fm=e.target.closest('[data-form-meta]');if(fm){activeForm()[fm.dataset.formMeta]=fm.value;persist();return}
  },true);
  document.addEventListener('change',function(e){
    const ft=e.target.closest('[data-form-field-type]');if(ft){activeForm().fields[+ft.dataset.formFieldType].type=ft.value;persist();render('forms');return}
    const fr=e.target.closest('[data-form-field-required]');if(fr){activeForm().fields[+fr.dataset.formFieldRequired].required=fr.checked;persist();return}
    const fc=e.target.closest('[data-form-meta-check]');if(fc){activeForm()[fc.dataset.formMetaCheck]=fc.checked;persist();return}
    const gc=e.target.closest('[data-global-check]');if(gc){state.globalHeader[gc.dataset.globalCheck]=gc.checked;persist();render('builder');return}
    const is=e.target.closest('[data-interaction-select]');if(is){interaction()[is.dataset.interactionSelect]=is.value;persist();return}
  },true);

  // Keep route UI fresh if current app is already open.
  persist();
})();




/* ===== NEXT FLOW: CMS BINDING + CONDITIONAL LOGIC + SEARCH + A11Y + COLLAB ===== */
(function(){
  const clone=x=>JSON.parse(JSON.stringify(x));
  state.cmsBindings=state.cmsBindings||{};
  state.visibilityRules=state.visibilityRules||{};
  state.actionRules=state.actionRules||{};
  state.pageTransition=state.pageTransition||'Fade';
  state.siteSearch=Object.assign({enabled:true,placeholder:'Search this site…',showCMS:true,showPages:true,indexVersion:1,lastIndexed:'Just now',query:''},state.siteSearch||{});
  state.accessibility=Object.assign({highContrast:false,reducedMotion:false,focusRings:true,fontScale:100,altWarnings:2,headingWarnings:0,labelWarnings:1,lastAudit:'Not run'},state.accessibility||{});
  state.collaborators=Array.isArray(state.collaborators)&&state.collaborators.length?state.collaborators:[];
  state.shareSettings=Object.assign({access:'Anyone with link',password:'',comments:true,allowDuplicate:false},state.shareSettings||{});
  state.comments=Array.isArray(state.comments)?state.comments:[];
  state.formLogic=state.formLogic||{};

  function persistNext(){try{localStorage.setItem('scenspace3d_state',JSON.stringify(state))}catch(e){}}
  function currentKey(){return state.currentPageId+':'+(state.selected||'hero')}
  function binding(){const k=currentKey();state.cmsBindings[k]=Object.assign({enabled:false,collectionId:state.activeCollectionId||state.collections?.[0]?.id||'',titleField:'Title',copyField:'Category'},state.cmsBindings[k]||{});return state.cmsBindings[k]}
  function visibility(){const k=currentKey();state.visibilityRules[k]=Object.assign({mode:'Always',field:'Status',operator:'equals',value:'Published'},state.visibilityRules[k]||{});return state.visibilityRules[k]}
  function actionRule(){const k=currentKey();state.actionRules[k]=Object.assign({type:'None',target:''},state.actionRules[k]||{});return state.actionRules[k]}
  function selectedLabel(){if(state.selected==='hero')return 'Hero';const i=+(state.selected||'component:0').split(':')[1];return state.components?.[i]||('Section '+(i+1))}
  function getCollection(id){return (state.collections||[]).find(c=>c.id===id)||state.collections?.[0]}
  function pageById(id){return (state.pages||[]).find(p=>p.id===id)||state.pages?.[0]}
  function activeFormN(){return (state.forms||[]).find(f=>f.id===state.activeFormId)||state.forms?.[0]}
  function applyA11y(){document.body.classList.toggle('a11y-high-contrast',!!state.accessibility.highContrast);document.body.classList.toggle('a11y-reduced-motion',!!state.accessibility.reducedMotion);document.body.classList.toggle('a11y-focus',!!state.accessibility.focusRings);const canvas=document.querySelector('.canvas-device');if(canvas)canvas.style.setProperty('--a11y-scale',String((state.accessibility.fontScale||100)/100))}
  function searchCorpus(){const rows=[];if(state.siteSearch.showPages)(state.pages||[]).forEach(p=>rows.push({type:'Page',title:p.name,detail:p.slug||'/',target:p.id,text:[p.name,p.heroTitle,p.heroSubtitle,...(p.components||[]),...(p.sectionCopy||[])].join(' ')}));if(state.siteSearch.showCMS)(state.collections||[]).forEach(c=>(c.items||[]).forEach(it=>rows.push({type:c.name,title:it.Title||'Untitled',detail:it.Category||'CMS item',target:c.id,text:Object.values(it).join(' ')})));return rows}
  function searchResults(q){q=(q||'').trim().toLowerCase();const rows=searchCorpus();if(!q)return rows.slice(0,8);return rows.filter(r=>(r.text+' '+r.title+' '+r.detail).toLowerCase().includes(q)).slice(0,12)}
  function highlight(text,q){if(!q)return text;const safe=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');try{return String(text).replace(new RegExp('('+safe+')','ig'),'<mark>$1</mark>')}catch(e){return text}}
  function qaReport(){
    const checks=[
      {name:'Responsive breakpoints',ok:!!state.deviceStyles,detail:'Desktop · Tablet · Mobile'},
      {name:'SEO metadata',ok:true,detail:(state.pages?.length||0)+' pages configured'},
      {name:'Forms & lead capture',ok:(state.forms||[]).length>0,detail:(state.forms?.length||0)+' forms'},
      {name:'CMS collections',ok:(state.collections||[]).length>0,detail:(state.collections?.length||0)+' collections'},
      {name:'Site search index',ok:!!state.siteSearch.enabled,detail:searchCorpus().length+' indexed entries'},
      {name:'Accessibility',ok:(state.accessibility.altWarnings+state.accessibility.headingWarnings+state.accessibility.labelWarnings)<=3,detail:(state.accessibility.altWarnings+state.accessibility.headingWarnings+state.accessibility.labelWarnings)+' warnings'},
      {name:'Global navigation',ok:state.globalHeader?.enabled!==false,detail:'Header + page links'},
      {name:'API providers',ok:true,detail:'Deferred · LAST PHASE',deferred:true}
    ];
    const actual=checks.filter(x=>!x.deferred);const passed=actual.filter(x=>x.ok).length;const score=Math.round(passed/actual.length*100);return {checks,score,blockers:actual.filter(x=>!x.ok)}
  }

  views.search=()=>{const q=state.siteSearch.query||'';const results=searchResults(q);return `${viewHead('Site Search','Index pages and CMS content without external search APIs.',`<button class="btn" data-action="rebuildSearch">Rebuild index</button><button class="btn primary" data-action="openSearchPreview">Preview search</button>`)}<div class="search-layout"><div class="search-console card"><span class="caps">Search playground</span><h2 style="margin:6px 0 0">Test what visitors can find.</h2><div class="search-box-big"><input id="siteSearchQuery" value="${q}" placeholder="${state.siteSearch.placeholder}"/><button class="btn primary" data-action="runSiteSearch">Search</button></div><div class="tiny muted" style="margin-bottom:8px">${results.length} results · index v${state.siteSearch.indexVersion}</div>${results.map(r=>`<div class="search-result"><div class="sr-icon">${r.type==='Page'?'▧':'▥'}</div><div><b>${highlight(r.title,q)}</b><div class="tiny muted">${r.type} · ${highlight(r.detail,q)}</div></div><button class="btn ghost" data-action="openSearchResult" data-result-type="${r.type}" data-target="${r.target}">Open</button></div>`).join('')||'<div class="admin-banner"><span>⌕</span><div><b>No matches</b><div class="tiny muted">Try another page, project or CMS term.</div></div></div>'}</div><div class="search-settings card"><span class="caps">Index settings</span><h3>Search sources</h3><div class="toggle-row"><span>Enable site search</span><button class="switch ${state.siteSearch.enabled?'on':''}" data-action="toggleSearchSetting" data-setting="enabled"></button></div><div class="toggle-row"><span>Pages</span><button class="switch ${state.siteSearch.showPages?'on':''}" data-action="toggleSearchSetting" data-setting="showPages"></button></div><div class="toggle-row"><span>CMS content</span><button class="switch ${state.siteSearch.showCMS?'on':''}" data-action="toggleSearchSetting" data-setting="showCMS"></button></div><div class="field"><label>Placeholder</label><input class="prop-input" value="${state.siteSearch.placeholder}" data-search-setting="placeholder"/></div><div class="mini-field">Last indexed · ${state.siteSearch.lastIndexed}</div></div></div>`};

  views.collaboration=()=>`${viewHead('Collaboration','Share previews, assign roles and collect comments before publishing.',`<button class="btn" data-action="copyShareLink">Copy share link</button><button class="btn primary" data-action="inviteCollaborator">＋ Invite</button>`)}<div class="collab-layout"><div class="collab-card card"><div class="row"><div><span class="caps">Workspace members</span><h2 style="margin:5px 0">${state.collaborators.length} collaborators</h2></div><span class="grow"></span><span class="pill">Live presence</span></div>${state.collaborators.map(m=>`<div class="member"><div class="avatar">${m.name.slice(0,1)}</div><div><b>${m.name}${m.online?'<span class="presence"></span>':''}</b><div class="tiny muted">${m.email}</div></div><select class="prop-input" data-collab-role="${m.id}" ${m.role==='Owner'?'disabled':''}>${['Owner','Admin','Editor','Reviewer','Viewer'].map(r=>`<option ${m.role===r?'selected':''}>${r}</option>`).join('')}</select></div>`).join('')}</div><div><div class="collab-card card"><span class="caps">Share preview</span><h3>Review link</h3><div class="share-link"><input class="prop-input" readonly value="preview.scen.space/${(state.projectName||'project').toLowerCase().replace(/[^a-z0-9]+/g,'-')}"/><button class="btn" data-action="copyShareLink">Copy</button></div><div class="field"><label>Access</label><select class="prop-input" data-share-setting="access"><option ${state.shareSettings.access==='Anyone with link'?'selected':''}>Anyone with link</option><option ${state.shareSettings.access==='Workspace only'?'selected':''}>Workspace only</option><option ${state.shareSettings.access==='Password protected'?'selected':''}>Password protected</option></select></div><label class="tiny"><input type="checkbox" data-share-check="comments" ${state.shareSettings.comments?'checked':''}/> Allow comments</label></div><div class="collab-card card" style="margin-top:14px"><span class="caps">Review comments</span>${state.comments.map(c=>`<div class="comment-thread"><b>${c.author}</b><p class="small muted" style="margin:5px 0 9px">${c.text}</p><button class="btn ghost" data-action="toggleComment" data-comment="${c.id}">${c.status==='Open'?'Resolve':'Reopen'} · ${c.status}</button></div>`).join('')}</div></div></div>`;

  views.accessibility=()=>{const warnings=state.accessibility.altWarnings+state.accessibility.headingWarnings+state.accessibility.labelWarnings;const score=Math.max(60,100-warnings*5);return `${viewHead('Accessibility','Control motion, contrast, focus and semantic QA across the site.',`<button class="btn primary" data-action="runA11yAudit">Run accessibility audit</button>`)}<div class="a11y-grid"><div class="a11y-card card"><span class="caps">Accessibility score</span><div class="score-ring" style="--score:${score}"><b>${score}</b></div><div class="a11y-check"><span>${state.accessibility.altWarnings?'◌':'✓'}</span><div><b>Image alternatives</b><div class="tiny muted">Missing or weak alt descriptions</div></div><span class="${state.accessibility.altWarnings?'qa-warn':'qa-pass'}">${state.accessibility.altWarnings} warnings</span></div><div class="a11y-check"><span>${state.accessibility.headingWarnings?'◌':'✓'}</span><div><b>Heading structure</b><div class="tiny muted">Logical H1 → H2 document order</div></div><span class="${state.accessibility.headingWarnings?'qa-warn':'qa-pass'}">${state.accessibility.headingWarnings} warnings</span></div><div class="a11y-check"><span>${state.accessibility.labelWarnings?'◌':'✓'}</span><div><b>Form labels</b><div class="tiny muted">Inputs have accessible labels</div></div><span class="${state.accessibility.labelWarnings?'qa-warn':'qa-pass'}">${state.accessibility.labelWarnings} warnings</span></div><div class="mini-field" style="margin-top:12px">Last audit · ${state.accessibility.lastAudit}</div></div><div class="a11y-card card"><span class="caps">Visitor preferences</span><h3>Experience controls</h3>${[['highContrast','High contrast preview'],['reducedMotion','Reduce motion'],['focusRings','Strong focus rings']].map(x=>`<div class="toggle-row"><span>${x[1]}</span><button class="switch ${state.accessibility[x[0]]?'on':''}" data-action="toggleA11y" data-setting="${x[0]}"></button></div>`).join('')}<div class="field"><label>Font scale · ${state.accessibility.fontScale}%</label><input class="prop-input" type="range" min="90" max="130" value="${state.accessibility.fontScale}" data-a11y-range="fontScale"/></div><button class="btn" style="width:100%" data-action="previewA11y">Preview current page</button></div></div>`};

  // Add Logic + A11y property tabs while preserving all previous builder functionality.
  const previousProps=propsPanel;
  window.propsPanel=function(){
    if(state.propTab==='logic'){
      const b=binding(),v=visibility(),ar=actionRule(),col=getCollection(b.collectionId),fields=col?.fields||['Title','Category','Status'];
      return `<div class="selection-label">Logic · <b>${selectedLabel()}</b></div><div class="prop-section"><h4>CMS field binding</h4><div class="toggle-row"><span>Bind selected element</span><button class="switch ${b.enabled?'on':''}" data-action="toggleBinding"></button></div><select class="prop-input" data-binding-select="collectionId">${(state.collections||[]).map(c=>`<option value="${c.id}" ${b.collectionId===c.id?'selected':''}>${c.name}</option>`).join('')}</select><div class="logic-grid" style="margin-top:8px"><div><label class="tiny muted">Title field</label><select class="prop-input" data-binding-select="titleField">${fields.map(f=>`<option ${b.titleField===f?'selected':''}>${f}</option>`).join('')}</select></div><div><label class="tiny muted">Body field</label><select class="prop-input" data-binding-select="copyField">${fields.map(f=>`<option ${b.copyField===f?'selected':''}>${f}</option>`).join('')}</select></div></div>${b.enabled&&col?.items?.[0]?`<div class="binding-preview"><span class="caps">Live sample</span><b style="display:block;margin:4px 0">${col.items[0][b.titleField]||'—'}</b><span class="tiny muted">${col.items[0][b.copyField]||'—'}</span></div>`:''}</div><div class="prop-section"><h4>Conditional visibility</h4><select class="prop-input" data-visibility-select="mode"><option ${v.mode==='Always'?'selected':''}>Always</option><option ${v.mode==='Desktop only'?'selected':''}>Desktop only</option><option ${v.mode==='Tablet only'?'selected':''}>Tablet only</option><option ${v.mode==='Mobile only'?'selected':''}>Mobile only</option><option ${v.mode==='CMS condition'?'selected':''}>CMS condition</option></select>${v.mode==='CMS condition'?`<div class="logic-grid" style="margin-top:8px"><select class="prop-input" data-visibility-select="field">${fields.map(f=>`<option ${v.field===f?'selected':''}>${f}</option>`).join('')}</select><input class="prop-input" value="${v.value}" data-visibility-input="value" placeholder="Expected value"/></div>`:''}<span class="rule-badge" style="margin-top:8px">◇ ${v.mode}</span></div><div class="prop-section"><h4>Click action</h4><select class="prop-input" data-actionrule-select="type"><option ${ar.type==='None'?'selected':''}>None</option><option ${ar.type==='Open page'?'selected':''}>Open page</option><option ${ar.type==='Open URL'?'selected':''}>Open URL</option><option ${ar.type==='Scroll to section'?'selected':''}>Scroll to section</option><option ${ar.type==='Open modal'?'selected':''}>Open modal</option></select><input class="prop-input" style="margin-top:8px" value="${ar.target}" data-actionrule-input="target" placeholder="Page, URL, section or modal name"/><button class="btn primary" style="width:100%;margin-top:8px" data-action="testElementAction">Test action</button></div><div class="prop-section"><h4>Page transition</h4><div class="motion-presets">${['Fade','Slide','Zoom','None'].map(x=>`<button class="motion-preset ${state.pageTransition===x?'active':''}" data-action="setPageTransition" data-transition="${x}">${x}</button>`).join('')}</div></div>`
    }
    if(state.propTab==='a11y'){
      const warnings=state.accessibility.altWarnings+state.accessibility.headingWarnings+state.accessibility.labelWarnings;
      return `<div class="selection-label">Accessibility · <b>${selectedLabel()}</b></div><div class="prop-section"><h4>Semantic role</h4><select class="prop-input" data-element-a11y="role"><option>Auto</option><option>Region</option><option>Navigation</option><option>Article</option><option>Complementary</option></select></div><div class="prop-section"><h4>Accessible label</h4><input class="prop-input" value="${selectedLabel()}" data-element-a11y="label"/><div class="mini-field" style="margin-top:8px">Project warnings · ${warnings}</div></div><button class="btn primary" style="width:100%" data-action="openAccessibility">Open full accessibility QA →</button>`
    }
    return previousProps();
  };

  const previousBuilder=builderView;
  window.builderView=function(){
    let h=previousBuilder();
    const logicBtn=`<button class="prop-tab ${state.propTab==='logic'?'active':''}" data-proptab="logic">Logic</button><button class="prop-tab ${state.propTab==='a11y'?'active':''}" data-proptab="a11y">A11y</button>`;
    h=h.replace('</div><div class="props">',logicBtn+'</div><div class="props">');
    // CTA markup is state-driven now; the old runtime swap is no longer needed
    return h;
  };

  const previousSection=renderCanvasSection;
  window.renderCanvasSection=function(name,index){
    let h=previousSection(name,index);const key=state.currentPageId+':component:'+index;const b=state.cmsBindings[key],v=state.visibilityRules[key];let hidden=false;
    if(v){hidden=(v.mode==='Desktop only'&&state.device!=='desktop')||(v.mode==='Tablet only'&&state.device!=='tablet')||(v.mode==='Mobile only'&&state.device!=='mobile');if(v.mode==='CMS condition'){const col=getCollection(b?.collectionId),it=col?.items?.[0];hidden=!!it&&String(it[v.field]??'')!==String(v.value??'')}}
    if(hidden)h=h.replace('class="editable-section','class="editable-section condition-muted').replace('</section>','<span class="condition-badge">Hidden by condition</span></section>');
    if(b?.enabled){const col=getCollection(b.collectionId),it=col?.items?.[0];if(it){h=h.replace(new RegExp('(<h3[^>]*>)[\\s\\S]*?(</h3>)'),`$1${it[b.titleField]??name}$2`);h=h.replace(new RegExp('(<p[^>]*>)[\\s\\S]*?(</p>)'),`$1${it[b.copyField]??''}$2`)}}
    return h;
  };

  // Upgrade Forms route with conditional form logic.
  const oldForms=views.forms;
  views.forms=()=>{const f=activeFormN();if(!f)return oldForms();state.formLogic[f.id]=Object.assign({enabled:false,watchField:f.fields?.[0]?.id||'',operator:'equals',value:'',action:'Show success message'},state.formLogic[f.id]||{});const l=state.formLogic[f.id];return oldForms()+`<div class="card" style="padding:18px;margin-top:18px"><div class="row"><div><span class="caps">Advanced form logic</span><h3 style="margin:6px 0">Conditional submit flow</h3></div><span class="grow"></span><button class="switch ${l.enabled?'on':''}" data-action="toggleFormLogic"></button></div><div class="logic-grid" style="margin-top:12px"><select class="prop-input" data-formlogic-select="watchField">${(f.fields||[]).map(x=>`<option value="${x.id}" ${l.watchField===x.id?'selected':''}>${x.label}</option>`).join('')}</select><select class="prop-input" data-formlogic-select="operator"><option ${l.operator==='equals'?'selected':''}>equals</option><option ${l.operator==='contains'?'selected':''}>contains</option><option ${l.operator==='is not empty'?'selected':''}>is not empty</option></select><input class="prop-input" value="${l.value}" data-formlogic-input="value" placeholder="Condition value"/><select class="prop-input" data-formlogic-select="action"><option ${l.action==='Show success message'?'selected':''}>Show success message</option><option ${l.action==='Add lead tag'?'selected':''}>Add lead tag</option><option ${l.action==='Go to page'?'selected':''}>Go to page</option><option ${l.action==='Open booking modal'?'selected':''}>Open booking modal</option></select></div><p class="tiny muted">Logic runs locally in this prototype. External CRM/webhook actions remain for the API phase.</p></div>`};

  // Final publish QA replaces the simple all-green modal.
  window.publishModal=function(){const q=qaReport();modal(`<div class="modal-head"><div><span class="caps">Final publish QA</span><b style="display:block;margin-top:4px">${state.projectName}</b></div><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><div class="qa-summary"><div><b style="font-size:34px">${q.score}</b><div class="tiny muted">QA score</div></div><div><b>${q.blockers.length?'Review before publish':'Production ready'}</b><div class="qa-meter" style="margin:8px 0"><i style="width:${q.score}%"></i></div><div class="tiny muted">API providers intentionally excluded from launch blockers until LAST PHASE.</div></div></div><div class="final-qa-grid">${q.checks.map(x=>`<div class="check-item"><i>${x.deferred?'⌁':x.ok?'✓':'◌'}</i><span>${x.name}<div class="tiny muted">${x.detail}</div></span><span class="grow"></span><span class="${x.deferred?'muted':x.ok?'qa-pass':'qa-warn'}">${x.deferred?'Deferred':x.ok?'Pass':'Review'}</span></div>`).join('')}</div><div class="publish-flow" style="margin-top:16px"><div class="publish-target active"><span class="caps">Hosted preview</span><h3>${state.publishSettings?.subdomain||'your-site'}.scen.space</h3><button class="btn primary" data-action="publishDemo">${state.published?'Republish':'Publish now'} →</button></div><div class="publish-target"><span class="caps">Custom domain</span><h3>Connect domain</h3><button class="btn" data-action="connectDomain">Domain setup</button></div><div class="publish-target locked-mini"><span class="caps">API deployment</span><h3>Vercel / GitHub</h3><button class="btn" data-action="apiLockedDeploy">LAST PHASE 🔒</button></div></div><button class="btn" style="width:100%;margin-top:10px" data-action="runFinalQA">Run QA again</button></div>`)};

  function runElementAction(rule){if(!rule||rule.type==='None'){toast('No click action assigned');return}if(rule.type==='Open page'){const p=(state.pages||[]).find(x=>x.name.toLowerCase()===String(rule.target).toLowerCase()||x.id===rule.target);if(p){state.currentPageId=p.id;persistNext();render('builder');toast('Opened page · '+p.name)}else toast('Choose an existing page name')}else if(rule.type==='Open URL'){toast('Would open '+(rule.target||'URL')+' in published site')}else if(rule.type==='Scroll to section'){toast('Scroll action · '+(rule.target||'section'))}else if(rule.type==='Open modal'){modal(`<div class="modal-head"><b>${rule.target||'Website modal'}</b><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><h2>Action preview</h2><p class="muted">This modal is triggered by the selected element.</p><button class="btn primary" data-action="closeModal">Close</button></div>`)}}

  const newActions=new Set(['toggleBinding','testElementAction','testHeroAction','setPageTransition','openAccessibility','rebuildSearch','openSearchPreview','runSiteSearch','openSearchResult','toggleSearchSetting','copyShareLink','inviteCollaborator','toggleComment','toggleA11y','runA11yAudit','previewA11y','toggleFormLogic','runFinalQA']);
  document.addEventListener('click',function(e){const a=e.target.closest('[data-action]');if(!a||!newActions.has(a.dataset.action))return;e.preventDefault();e.stopImmediatePropagation();const action=a.dataset.action;
    if(action==='toggleBinding'){binding().enabled=!binding().enabled;persistNext();render('builder');toast('CMS binding '+(binding().enabled?'enabled':'disabled'));return}
    if(action==='testElementAction'){runElementAction(actionRule());return}
    if(action==='testHeroAction'){runElementAction(state.actionRules[state.currentPageId+':hero']||{type:'None'});return}
    if(action==='setPageTransition'){state.pageTransition=a.dataset.transition;persistNext();render('builder');toast('Page transition · '+state.pageTransition);return}
    if(action==='openAccessibility'){navigate('accessibility');return}
    if(action==='rebuildSearch'){state.siteSearch.indexVersion++;state.siteSearch.lastIndexed=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});persistNext();render('search');toast('Search index rebuilt');return}
    if(action==='runSiteSearch'){const q=document.querySelector('#siteSearchQuery')?.value||'';state.siteSearch.query=q;persistNext();render('search');return}
    if(action==='openSearchPreview'){modal(`<div class="modal-head"><b>Site search preview</b><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><div class="search-box-big"><input id="modalSearch" placeholder="${state.siteSearch.placeholder}"/><button class="btn primary" data-action="closeModal">Done</button></div><p class="muted">The published site can search page copy and CMS entries from the local index.</p></div>`);return}
    if(action==='openSearchResult'){if(a.dataset.resultType==='Page'){state.currentPageId=a.dataset.target;persistNext();navigate('builder')}else navigate('cms');return}
    if(action==='toggleSearchSetting'){const k=a.dataset.setting;state.siteSearch[k]=!state.siteSearch[k];persistNext();render('search');return}
    if(action==='copyShareLink'){const text='https://preview.scen.space/'+(state.projectName||'project').toLowerCase().replace(/[^a-z0-9]+/g,'-');if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).catch(()=>{});toast('Share link copied');return}
    if(action==='inviteCollaborator'){const n='Collaborator '+(state.collaborators.length+1);state.collaborators.push({id:'c'+Date.now(),name:n,email:'pending@example.com',role:'Reviewer',online:false});persistNext();render('collaboration');toast('Invite added to demo workspace');return}
    if(action==='toggleComment'){const c=state.comments.find(x=>x.id===a.dataset.comment);if(c)c.status=c.status==='Open'?'Resolved':'Open';persistNext();render('collaboration');return}
    if(action==='toggleA11y'){const k=a.dataset.setting;state.accessibility[k]=!state.accessibility[k];persistNext();applyA11y();render('accessibility');return}
    if(action==='runA11yAudit'){state.accessibility.altWarnings=Math.max(0,state.accessibility.altWarnings-1);state.accessibility.labelWarnings=Math.max(0,state.accessibility.labelWarnings-1);state.accessibility.lastAudit=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});persistNext();render('accessibility');toast('Accessibility audit completed');return}
    if(action==='previewA11y'){navigate('builder');setTimeout(applyA11y,0);toast('Accessibility preferences applied to canvas');return}
    if(action==='toggleFormLogic'){const f=activeFormN();if(f){state.formLogic[f.id].enabled=!state.formLogic[f.id].enabled;persistNext();render('forms')}return}
    if(action==='runFinalQA'){closeModal();publishModal();toast('Final QA refreshed');return}
  },true);

  document.addEventListener('input',function(e){
    const bi=e.target.closest('[data-binding-select]');if(bi){binding()[bi.dataset.bindingSelect]=bi.value;persistNext();render('builder');return}
    const vi=e.target.closest('[data-visibility-input]');if(vi){visibility()[vi.dataset.visibilityInput]=vi.value;persistNext();return}
    const ai=e.target.closest('[data-actionrule-input]');if(ai){actionRule()[ai.dataset.actionruleInput]=ai.value;persistNext();return}
    const ss=e.target.closest('[data-search-setting]');if(ss){state.siteSearch[ss.dataset.searchSetting]=ss.value;persistNext();return}
    const ar=e.target.closest('[data-a11y-range]');if(ar){state.accessibility[ar.dataset.a11yRange]=+ar.value;persistNext();applyA11y();return}
    const fl=e.target.closest('[data-formlogic-input]');if(fl){const f=activeFormN();if(f){state.formLogic[f.id][fl.dataset.formlogicInput]=fl.value;persistNext()}return}
  },true);
  document.addEventListener('change',function(e){
    const bs=e.target.closest('[data-binding-select]');if(bs){binding()[bs.dataset.bindingSelect]=bs.value;persistNext();render('builder');return}
    const vs=e.target.closest('[data-visibility-select]');if(vs){visibility()[vs.dataset.visibilitySelect]=vs.value;persistNext();render('builder');return}
    const ars=e.target.closest('[data-actionrule-select]');if(ars){actionRule()[ars.dataset.actionruleSelect]=ars.value;persistNext();render('builder');return}
    const cr=e.target.closest('[data-collab-role]');if(cr){const m=state.collaborators.find(x=>x.id===cr.dataset.collabRole);if(m)m.role=cr.value;persistNext();toast('Role updated · '+cr.value);return}
    const sh=e.target.closest('[data-share-setting]');if(sh){state.shareSettings[sh.dataset.shareSetting]=sh.value;persistNext();return}
    const sc=e.target.closest('[data-share-check]');if(sc){state.shareSettings[sc.dataset.shareCheck]=sc.checked;persistNext();return}
    const fs=e.target.closest('[data-formlogic-select]');if(fs){const f=activeFormN();if(f){state.formLogic[f.id][fs.dataset.formlogicSelect]=fs.value;persistNext()}return}
  },true);
  document.addEventListener('keydown',function(e){if(e.target.matches('.app-search')&&e.key==='Enter'){state.siteSearch.query=e.target.value;persistNext();navigate('search')}if(e.target.matches('#siteSearchQuery')&&e.key==='Enter'){state.siteSearch.query=e.target.value;persistNext();render('search')}});

  // Page transitions are applied whenever the builder canvas is re-rendered.
  const observer=new MutationObserver(()=>{const c=document.querySelector('.canvas-device');if(!c)return;applyA11y();c.classList.remove('page-transition-fade','page-transition-slide','page-transition-zoom');if(state.pageTransition!=='None'){const cls='page-transition-'+state.pageTransition.toLowerCase();requestAnimationFrame(()=>c.classList.add(cls))}});
  const appMain=document.querySelector('#appMain');if(appMain)observer.observe(appMain,{childList:true,subtree:true});
  applyA11y();persistNext();
})();




/* ===== NEXT FLOW: Commerce, Bookings, Localization, Events, Privacy, Custom Code, Project Settings ===== */
(function(){
  function persistNext(){try{localStorage.setItem('scenspace3d_state',JSON.stringify(state))}catch(e){}}
  state.store=Object.assign({enabled:true,currency:'INR',taxRate:18,shipping:99,freeShippingAt:2500,guestCheckout:true},state.store||{});
  state.products=Array.isArray(state.products)&&state.products.length?state.products:[];
  state.cart=Array.isArray(state.cart)?state.cart:[];
  state.orders=Array.isArray(state.orders)?state.orders:[];
  state.checkout=Object.assign({step:1,name:'',email:'',phone:'',address:'',city:'',pin:'',note:'',method:'cod',payment:'Cash on delivery'},state.checkout||{});
  state.bookingSettings=Object.assign({enabled:true,timezone:'Asia/Kolkata',buffer:15,leadTime:2},state.bookingSettings||{});
  state.services=Array.isArray(state.services)&&state.services.length?state.services:[];
  state.bookings=Array.isArray(state.bookings)?state.bookings:[];
  state.bookingDraft=Object.assign({service:'svc1',date:'2026-08-16',slot:'11:30',name:'',email:''},state.bookingDraft||{});
  state.localization=Object.assign({default:'en',enabled:['en','hi'],browserDetect:true,urlMode:'subdirectory',active:'en'},state.localization||{});
  state.translations=Object.assign({en:{hero:'Architecture that slows time.',cta:'Explore experience'},hi:{hero:'वास्तुकला जो समय को धीमा कर दे।',cta:'अनुभव देखें'},fr:{hero:'Une architecture qui ralentit le temps.',cta:"Découvrir l’expérience"},ar:{hero:'عمارة تُبطئ الزمن.',cta:'استكشف التجربة'}},state.translations||{});
  state.analyticsEvents=Array.isArray(state.analyticsEvents)&&state.analyticsEvents.length?state.analyticsEvents:[
    {id:'ev1',name:'page_view',trigger:'Page load',count:0,enabled:true},
    {id:'ev2',name:'cta_click',trigger:'CTA click',count:0,enabled:true},
    {id:'ev3',name:'form_submit',trigger:'Form submit',count:0,enabled:true},
    {id:'ev4',name:'add_to_cart',trigger:'Store action',count:0,enabled:true},
    {id:'ev5',name:'booking_confirmed',trigger:'Booking',count:0,enabled:true}
  ];
  state.eventLog=Array.isArray(state.eventLog)?state.eventLog:[];
  state.privacy=Object.assign({banner:true,mode:'Opt-in',necessary:true,analytics:false,marketing:false,personalization:false,dnt:true,policyVersion:'1.0',lastScan:'Not run'},state.privacy||{});
  state.customCode=Object.assign({tab:'head',head:'<!-- Add analytics or verification scripts here -->',body:'<!-- Custom body code -->',embed:'<div class="custom-widget">Spatial embed area</div>',css:'.custom-widget { padding: 24px; border-radius: 20px; }'},state.customCode||{});
  state.projectSettings=Object.assign({siteName:state.projectName||'Untitled World',siteTitle:'Immersive 3D Website',description:'A cinematic spatial website built with Scen.',timezone:'Asia/Kolkata',language:'en',favicon:'◈',password:false,passwordValue:'',maintenance:false,allowIndex:true,trailingSlash:false,notFound:'404',homePage:state.pages?.[0]?.id||'home'},state.projectSettings||{});

  const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
  const cartItems=()=>state.cart.map(c=>({cart:c,product:state.products.find(p=>p.id===c.productId)})).filter(x=>x.product);
  const cartSubtotal=()=>cartItems().reduce((s,x)=>s+x.product.price*x.cart.qty,0);
  const cartShipping=()=>cartSubtotal()>=state.store.freeShippingAt||cartSubtotal()===0?0:state.store.shipping;
  const cartTax=()=>Math.round(cartSubtotal()*state.store.taxRate/100);
  const cartTotal=()=>cartSubtotal()+cartTax()+cartShipping();
  const fireEvent=(name,meta={})=>{const ev=state.analyticsEvents.find(x=>x.name===name);if(ev&&ev.enabled)ev.count++;state.eventLog.unshift({name,time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),meta});if(state.eventLog.length>30)state.eventLog.pop();persistNext()};
  const activeCode=()=>state.customCode[state.customCode.tab]||'';
  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

  views.store=()=>{const items=cartItems();return `${viewHead('Store','Products, cart, checkout and orders — online payments are not connected yet.',`<button class="btn" data-action="openOrders">Orders · ${state.orders.length}</button><button class="btn primary" data-action="addInventoryProduct">＋ Product</button>`)}<div class="admin-banner"><span class="dot"></span><div><b>Storefront ${state.store.enabled?'enabled':'disabled'}</b><div class="tiny muted">Your catalog and checkout are ready. Connect a payment provider to take real payments.</div></div><span class="grow"></span><button class="switch ${state.store.enabled?'on':''}" data-action="toggleStore"></button></div><div class="commerce-grid"><div><div class="filters"><button class="chip active">All products</button><button class="chip">Active</button><button class="chip">Draft</button><button class="chip">Inventory</button></div><div class="product-grid">${state.products.map((p,i)=>`<article class="product-card card"><div class="product-art"></div><div class="row" style="margin-top:12px"><div><b>${p.name}</b><div class="tiny muted">${p.sku} · ${p.stock} in stock</div></div><span class="grow"></span><span class="status ${p.status==='Active'?'live':'draft'}">${p.status}</span></div><div class="row" style="margin-top:12px"><span class="price">${money(p.price)}</span><span class="grow"></span><button class="btn primary" data-action="addToCart" data-product="${p.id}">Add to cart</button></div></article>`).join('')}</div><h3 style="margin:22px 0 10px">Recent orders</h3><div class="table"><div class="tr header"><span>Order</span><span>Customer</span><span>Total</span><span>Status</span><span></span></div>${state.orders.slice(0,5).map(o=>`<div class="tr"><b>${o.id}</b><span>${o.customer}</span><span>${money(o.total)}</span><span class="status ${o.status==='Paid'||o.status==='Fulfilled'?'live':'warn'}">${o.status}</span><button class="btn ghost">•••</button></div>`).join('')||'<div class="empty-state">No orders yet.</div>'}</div></div><aside class="store-side card"><span class="caps">Live cart</span><h2 style="margin:5px 0 14px">${items.reduce((s,x)=>s+x.cart.qty,0)} items</h2>${items.length?items.map(x=>`<div class="cart-row"><div class="event-icon">◫</div><div><b>${x.product.name}</b><div class="tiny muted">${money(x.product.price)}</div></div><div class="qty"><button data-action="cartQty" data-product="${x.product.id}" data-delta="-1">−</button><b>${x.cart.qty}</b><button data-action="cartQty" data-product="${x.product.id}" data-delta="1">＋</button></div></div>`).join(''):'<div class="empty-state">Your cart is empty.</div>'}<div style="margin-top:12px"><div class="summary-line"><span>Subtotal</span><b>${money(cartSubtotal())}</b></div><div class="summary-line"><span>Tax ${state.store.taxRate}%</span><span>${money(cartTax())}</span></div><div class="summary-line"><span>Shipping</span><span>${cartShipping()?money(cartShipping()):'Free'}</span></div><div class="summary-line total"><span>Total</span><span>${money(cartTotal())}</span></div></div><button class="btn primary" style="width:100%;margin-top:12px" data-action="openCheckout" ${items.length?'':'disabled'}>Checkout →</button><button class="btn" style="width:100%;margin-top:8px" data-action="storeSettings">Store settings</button></aside></div>`};

  views.bookings=()=>{const slots=['10:00','11:30','13:00','15:00','16:30','18:00'];return `${viewHead('Bookings','Services, availability and booking confirmation without an external calendar API yet.',`<button class="btn primary" data-action="addService">＋ Service</button>`)}<div class="booking-grid"><div class="card" style="padding:20px"><span class="caps">Booking page</span><h2 style="margin:6px 0 16px">Choose a service</h2>${state.services.map(s=>`<div class="service-row"><div class="event-icon">◷</div><div><b>${s.name}</b><div class="tiny muted">${s.duration} min · ${s.price?money(s.price):'Free'}</div></div><button class="btn ${state.bookingDraft.service===s.id?'primary':''}" data-action="selectService" data-service="${s.id}">${state.bookingDraft.service===s.id?'Selected':'Select'}</button></div>`).join('')}<div class="field"><label>Date</label><input type="date" value="${state.bookingDraft.date}" data-booking="date"/></div><label class="tiny muted">Available times · ${state.bookingSettings.timezone}</label><div class="slot-grid" style="margin-top:8px">${slots.map(s=>`<button class="slot ${state.bookingDraft.slot===s?'active':''}" data-action="selectSlot" data-slot="${s}">${s}</button>`).join('')}</div><div class="logic-grid" style="margin-top:14px"><input class="prop-input" value="${state.bookingDraft.name}" data-booking="name" placeholder="Name"/><input class="prop-input" value="${state.bookingDraft.email}" data-booking="email" placeholder="Email"/></div><button class="btn primary" style="width:100%;margin-top:10px" data-action="confirmBooking">Confirm booking →</button></div><div><div class="card" style="padding:20px"><span class="caps">Booking settings</span><h3>Availability</h3><div class="toggle-row"><span>Booking page enabled</span><button class="switch ${state.bookingSettings.enabled?'on':''}" data-action="toggleBooking"></button></div><div class="field"><label>Timezone</label><select class="prop-input" data-booking-setting="timezone"><option>Asia/Kolkata</option><option>Europe/London</option><option>America/New_York</option></select></div><div class="logic-grid"><div class="field"><label>Buffer (min)</label><input type="number" value="${state.bookingSettings.buffer}" data-booking-setting="buffer"/></div><div class="field"><label>Lead time (hours)</label><input type="number" value="${state.bookingSettings.leadTime}" data-booking-setting="leadTime"/></div></div><p class="tiny muted">Google Calendar / Calendly sync connects during API phase.</p></div><div class="card" style="padding:20px;margin-top:14px"><span class="caps">Upcoming</span>${state.bookings.length?state.bookings.map(b=>`<div class="order-row"><div class="event-icon">✓</div><div><b>${b.name}</b><div class="tiny muted">${b.service} · ${b.time}</div></div><span class="status live">${b.status}</span></div>`).join(''):'<div class="empty-state">No bookings yet.</div>'}</div></div></div>`};

  views.localization=()=>{const supported=[['en','English'],['hi','हिन्दी'],['fr','Français'],['ar','العربية']];return `${viewHead('Languages & Localization','Localize every page while keeping one shared design system.',`<button class="btn primary" data-action="mockTranslate">✦ Translate missing copy</button>`)}<div class="language-grid"><div class="card" style="padding:20px"><span class="caps">Published languages</span><h2 style="margin:6px 0 14px">${state.localization.enabled.length} languages</h2>${supported.map(([code,name])=>`<div class="locale-row"><div class="locale-code">${code.toUpperCase()}</div><div><b>${name}</b><div class="tiny muted">${code===state.localization.default?'Default locale':'/'+code+' URL'}</div></div><div class="row"><button class="btn ghost" data-action="previewLocale" data-locale="${code}">Preview</button><button class="switch ${state.localization.enabled.includes(code)?'on':''}" data-action="toggleLocale" data-locale="${code}"></button></div></div>`).join('')}<div class="field"><label>Default language</label><select class="prop-input" data-localization="default">${supported.map(([c,n])=>`<option value="${c}" ${state.localization.default===c?'selected':''}>${n}</option>`).join('')}</select></div><div class="toggle-row"><span>Detect browser language</span><button class="switch ${state.localization.browserDetect?'on':''}" data-action="toggleBrowserLanguage"></button></div></div><div class="card" style="padding:20px"><span class="caps">Translation preview</span><h3>Homepage strings</h3><div class="translation-table"><div class="trow header"><span>Key</span><span>English</span><span>${(state.localization.active||'hi').toUpperCase()}</span></div><div class="trow"><b>Hero title</b><span>${escapeHtml(state.translations.en.hero)}</span><span>${escapeHtml(state.translations[state.localization.active]?.hero||'—')}</span></div><div class="trow"><b>Primary CTA</b><span>${escapeHtml(state.translations.en.cta)}</span><span>${escapeHtml(state.translations[state.localization.active]?.cta||'—')}</span></div></div><div class="field"><label>URL structure</label><select class="prop-input" data-localization="urlMode"><option value="subdirectory">Subdirectory · /hi/</option><option value="subdomain">Subdomain · hi.site.com</option></select></div><p class="tiny muted">AI translation quality can be reviewed manually before publish. Translation API/provider connects last.</p></div></div>`};

  views.events=()=>`${viewHead('Analytics Events','Set up the events you want to track, then connect an analytics provider.',`<button class="btn primary" data-action="addEvent">＋ Event</button>`)}<div class="stat-grid"><div class="stat card"><span class="caps">Tracked events</span><div class="num">${state.analyticsEvents.filter(e=>e.enabled).length}</div></div><div class="stat card"><span class="caps">Events today</span><div class="num">${state.analyticsEvents.reduce((s,e)=>s+e.count,0).toLocaleString()}</div></div><div class="stat card"><span class="caps">Conversions</span><div class="num">${(state.analyticsEvents||[]).filter(e=>/purchase|booking|form_submit|conversion/i.test(e.name)).reduce((n,e)=>n+Number(e.count||0),0)}</div></div><div class="stat card"><span class="caps">Provider</span><div class="num" style="font-size:23px">COD</div><span class="tiny muted">Online payment not enabled</span></div></div><div class="two-col"><div class="card" style="padding:20px"><span class="caps">Event schema</span>${state.analyticsEvents.map(ev=>`<div class="event-row"><div class="event-icon">◈</div><div><b>${ev.name}</b><div class="tiny muted">Trigger · ${ev.trigger}</div></div><div><div class="spark"></div><div class="tiny muted">${ev.count.toLocaleString()} fired</div></div><button class="switch ${ev.enabled?'on':''}" data-action="toggleEvent" data-event="${ev.id}"></button></div>`).join('')}</div><div><div class="card" style="padding:20px"><span class="caps">Test console</span><h3>Fire an event</h3><select id="eventTest" class="prop-input">${state.analyticsEvents.map(e=>`<option>${e.name}</option>`).join('')}</select><button class="btn primary" style="width:100%;margin-top:10px" data-action="testEvent">Send test event</button><p class="tiny muted">This only updates the local event stream.</p></div><div class="card" style="padding:20px;margin-top:14px"><span class="caps">Recent stream</span>${state.eventLog.slice(0,6).map(e=>`<div class="order-row"><div class="event-icon">•</div><div><b>${e.name}</b><div class="tiny muted">${e.time}</div></div><span class="badge-green">Received</span></div>`).join('')||'<div class="empty-state" style="margin-top:10px">Test an event to see it here.</div>'}</div></div></div>`;

  views.privacy=()=>{const cats=[['necessary','Necessary'],['analytics','Analytics'],['marketing','Marketing'],['personalization','Personalization']];return `${viewHead('Cookie & Privacy Center','Configure consent UX and privacy defaults before analytics/marketing APIs are connected.',`<button class="btn" data-action="runPrivacyScan">Run privacy scan</button><button class="btn primary" data-action="previewCookie">Preview banner</button>`)}<div class="ops-grid"><div class="card" style="padding:20px"><div class="row"><div class="privacy-score"><b>86</b></div><div><span class="caps">Privacy readiness</span><h2 style="margin:5px 0">Consent-first setup</h2><p class="small muted">Last scan · ${state.privacy.lastScan}</p></div></div><div class="toggle-row"><span>Cookie banner</span><button class="switch ${state.privacy.banner?'on':''}" data-action="togglePrivacy" data-key="banner"></button></div><div class="field"><label>Consent mode</label><select class="prop-input" data-privacy="mode"><option>Opt-in</option><option>Opt-out</option><option>Notice only</option></select></div><div class="toggle-row"><span>Respect Do Not Track</span><button class="switch ${state.privacy.dnt?'on':''}" data-action="togglePrivacy" data-key="dnt"></button></div></div><div class="card" style="padding:20px"><span class="caps">Consent categories</span><h3>What visitors can control</h3>${cats.map(([k,n])=>`<div class="privacy-row"><div class="event-icon">${k==='necessary'?'✓':'○'}</div><div><b>${n}</b><div class="tiny muted">${k==='necessary'?'Required for core site operation':'Disabled until visitor consents'}</div></div><button class="switch ${state.privacy[k]?'on':''}" data-action="togglePrivacy" data-key="${k}" ${k==='necessary'?'disabled':''}></button></div>`).join('')}<p class="tiny muted">Analytics and marketing scripts remain inactive because provider APIs are not connected yet.</p></div></div><div class="consent-preview card" style="margin-top:18px"><span class="caps">Banner design</span><div class="cookie-banner" style="margin-top:12px"><div><b>We value your privacy</b><div style="font-size:12px;color:#666;margin-top:4px">Choose which optional cookies you allow. Necessary cookies are always on.</div></div><div class="cookie-actions"><button class="btn" data-action="cookieCustomize">Customize</button><button class="btn primary" data-action="cookieAccept">Accept all</button></div></div></div>`};

  views.customcode=()=>{const tabs=[['head','Head'],['body','Body'],['embed','Embed'],['css','Custom CSS']];return `${viewHead('Custom Code & Embeds','Store snippets and embeds in the project. Scripts are not executed inside this safe prototype.',`<button class="btn" data-action="previewCode">Preview embed</button><button class="btn primary" data-action="saveCode">Save code</button>`)}<div class="code-shell"><div class="code-tabs">${tabs.map(([k,n])=>`<button class="code-tab ${state.customCode.tab===k?'active':''}" data-action="codeTab" data-code-tab="${k}">${n}</button>`).join('')}</div><div class="code-editor"><div class="row"><div><span class="caps">${tabs.find(x=>x[0]===state.customCode.tab)?.[1]}</span><h3 style="margin:4px 0 12px">Project-level code</h3></div><span class="grow"></span><span class="pill">Safe preview</span></div><textarea id="codeInput">${escapeHtml(activeCode())}</textarea><p class="tiny muted">For security, JavaScript is displayed but not executed in this ChatGPT prototype. Published runtime injection will be controlled by project settings.</p></div></div><div class="card" style="padding:18px;margin-top:18px"><span class="caps">Embed zones</span><div class="admin-grid" style="margin-top:10px"><div class="admin-card card"><b>Page head</b><p class="tiny muted">Metadata, verification tags, future analytics snippets.</p></div><div class="admin-card card"><b>Before &lt;/body&gt;</b><p class="tiny muted">Future support widgets and integrations.</p></div><div class="admin-card card"><b>Canvas embed</b><p class="tiny muted">HTML block inside website sections.</p></div></div></div>`};

  views.projectsettings=()=>`${viewHead('Project Settings','Control site identity, indexing, access and launch behavior.',`<button class="btn primary" data-action="saveProjectSettings">Save settings</button>`)}<div class="settings-grid"><div class="setting-card card"><span class="caps">General</span><h3>Site identity</h3><div class="field"><label>Site name</label><input data-project-setting="siteName" value="${escapeHtml(state.projectSettings.siteName)}"/></div><div class="field"><label>Browser title</label><input data-project-setting="siteTitle" value="${escapeHtml(state.projectSettings.siteTitle)}"/></div><div class="field"><label>Description</label><textarea data-project-setting="description" rows="4">${escapeHtml(state.projectSettings.description)}</textarea></div><div class="logic-grid"><div class="field"><label>Timezone</label><select data-project-setting="timezone"><option>Asia/Kolkata</option><option>Europe/London</option><option>America/New_York</option></select></div><div class="field"><label>Default language</label><select data-project-setting="language"><option value="en">English</option><option value="hi">Hindi</option></select></div></div></div><div class="setting-card card"><span class="caps">Publishing</span><h3>Launch behavior</h3><div class="toggle-row"><span>Search engine indexing</span><button class="switch ${state.projectSettings.allowIndex?'on':''}" data-action="toggleProjectSetting" data-key="allowIndex"></button></div><div class="toggle-row"><span>Password protection</span><button class="switch ${state.projectSettings.password?'on':''}" data-action="toggleProjectSetting" data-key="password"></button></div>${state.projectSettings.password?`<div class="field"><label>Preview password</label><input type="password" data-project-setting="passwordValue" value="${escapeHtml(state.projectSettings.passwordValue)}"/></div>`:''}<div class="toggle-row"><span>Maintenance mode</span><button class="switch ${state.projectSettings.maintenance?'on':''}" data-action="toggleProjectSetting" data-key="maintenance"></button></div><div class="toggle-row"><span>Trailing slash URLs</span><button class="switch ${state.projectSettings.trailingSlash?'on':''}" data-action="toggleProjectSetting" data-key="trailingSlash"></button></div></div><div class="setting-card card"><span class="caps">Routing</span><h3>Core pages</h3><div class="field"><label>Homepage</label><select data-project-setting="homePage">${(state.pages||[]).map(p=>`<option value="${p.id}" ${state.projectSettings.homePage===p.id?'selected':''}>${p.name}</option>`).join('')}</select></div><div class="field"><label>404 page</label><select data-project-setting="notFound"><option>404</option><option>Home</option></select></div><div class="publish-health"><div class="health-card"><span class="caps">Pages</span><b>${state.pages?.length||0}</b></div><div class="health-card"><span class="caps">Forms</span><b>${state.forms?.length||0}</b></div><div class="health-card"><span class="caps">Products</span><b>${state.products?.length||0}</b></div><div class="health-card"><span class="caps">Languages</span><b>${state.localization.enabled.length}</b></div></div></div><div class="setting-card card danger-zone"><span class="caps">Danger zone</span><h3>Project lifecycle</h3><p class="small muted">Archive the project or reset local prototype data. Production deletion will require owner confirmation.</p><button class="btn" data-action="archiveProject">Archive project</button><button class="btn" style="margin-left:6px" data-action="resetPrototype">Reset local state</button></div></div>`;

  function checkoutModal(){const items=cartItems();modal(`<div class="modal-head"><div><span class="caps">Checkout</span><b style="display:block;margin-top:4px">${state.projectName} Store</b></div><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><div class="checkout-steps"><i class="checkout-step on"></i><i class="checkout-step ${state.checkout.step>=2?'on':''}"></i><i class="checkout-step ${state.checkout.step>=3?'on':''}"></i></div><div class="checkout-grid"><div>${state.checkout.step===1?`<h2>Contact & delivery</h2><div class="logic-grid"><input class="prop-input" data-checkout="name" value="${escapeHtml(state.checkout.name)}" placeholder="Full name"/><input class="prop-input" data-checkout="email" value="${escapeHtml(state.checkout.email)}" placeholder="Email"/></div><input class="prop-input" style="margin-top:8px" data-checkout="address" value="${escapeHtml(state.checkout.address)}" placeholder="Address"/><div class="logic-grid" style="margin-top:8px"><input class="prop-input" data-checkout="city" value="${escapeHtml(state.checkout.city)}" placeholder="City"/><input class="prop-input" data-checkout="pin" value="${escapeHtml(state.checkout.pin)}" placeholder="PIN"/></div><button class="btn primary" style="width:100%;margin-top:12px" data-action="checkoutNext">Continue →</button>`:state.checkout.step===2?`<h2>Payment</h2><div class="field"><label>Phone number</label><input class="prop-input" data-checkout="phone" value="${escapeHtml(state.checkout.phone||'')}" placeholder="10-digit mobile"/></div><div class="payment-mock" style="margin:10px 0"><div class="row"><div class="event-icon">◇</div><div><b>Cash on delivery</b><div class="tiny muted">Pay when your order arrives.</div></div></div></div><div class="field"><label>Order note (optional)</label><input class="prop-input" data-checkout="note" value="${escapeHtml(state.checkout.note||'')}" placeholder="Anything we should know?"/></div><div id="checkoutError" class="tiny hidden" style="color:var(--danger);margin-bottom:8px"></div><button class="btn primary" style="width:100%" data-action="placeOrder" id="placeOrderBtn">Place order · ${money(cartTotal())}</button>`:`<div class="empty-state"><div style="font-size:42px">✓</div><h2>Order placed</h2><p>We will contact you to confirm delivery and payment.</p><button class="btn primary" data-action="closeModal">Done</button></div>`}</div><aside class="card" style="padding:14px"><span class="caps">Order summary</span>${items.map(x=>`<div class="summary-line"><span>${x.product.name} × ${x.cart.qty}</span><span>${money(x.product.price*x.cart.qty)}</span></div>`).join('')}<div class="summary-line total"><span>Total</span><span>${money(cartTotal())}</span></div></aside></div></div>`)}

  function enhancedQA(){const base=[
    ['Responsive',!!state.deviceStyles,'Device-specific styles'],['SEO & indexing',!!state.projectSettings.allowIndex,'Project metadata ready'],['Forms',(state.forms||[]).length>0,(state.forms?.length||0)+' forms'],['CMS',(state.collections||[]).length>0,(state.collections?.length||0)+' collections'],['Store',!state.store.enabled||state.products.length>0,state.store.enabled?state.products.length+' products':'Disabled'],['Bookings',!state.bookingSettings.enabled||state.services.length>0,state.services.length+' services'],['Localization',state.localization.enabled.length>0,state.localization.enabled.length+' languages'],['Privacy',!!state.privacy.banner,'Consent banner configured'],['Accessibility',(state.accessibility.altWarnings+state.accessibility.headingWarnings+state.accessibility.labelWarnings)<=3,'Warnings within review threshold'],['Custom code',true,'Stored safely; scripts not executed here'],['API providers',true,'Deferred · LAST PHASE']
  ];const actual=base.slice(0,-1);const passed=actual.filter(x=>x[1]).length;return {score:Math.round(passed/actual.length*100),checks:base}}
  window.publishModal=function(){const q=enhancedQA();modal(`<div class="modal-head"><div><span class="caps">Production QA</span><b style="display:block;margin-top:4px">${state.projectName}</b></div><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><div class="qa-summary"><div><b style="font-size:34px">${q.score}</b><div class="tiny muted">Launch score</div></div><div><b>${q.score>=90?'Production ready':'Review recommended'}</b><div class="qa-meter" style="margin:8px 0"><i style="width:${q.score}%"></i></div><div class="tiny muted">Commerce, booking, languages and privacy now included. API credentials remain deferred.</div></div></div><div class="final-qa-grid">${q.checks.map((x,i)=>`<div class="check-item"><i>${i===q.checks.length-1?'⌁':x[1]?'✓':'◌'}</i><span>${x[0]}<div class="tiny muted">${x[2]}</div></span><span class="grow"></span><span class="${i===q.checks.length-1?'muted':x[1]?'qa-pass':'qa-warn'}">${i===q.checks.length-1?'Deferred':x[1]?'Pass':'Review'}</span></div>`).join('')}</div><div class="publish-flow" style="margin-top:16px"><div class="publish-target active"><span class="caps">Hosted preview</span><div class="pub-url"><span>scen.space/s/</span><input id="publishSlug" value="${escV(state.publishedSlug||defaultSlug())}" spellcheck="false"/></div><div id="publishMsg" class="tiny muted" style="min-height:15px;margin:6px 0">${state.publishedUrl?'Live at '+escV(state.publishedUrl):''}</div><button class="btn primary" data-action="publishDemo">${state.published?'Republish':'Publish now'} →</button></div><div class="publish-target"><span class="caps">Store checkout</span><h3>${state.store.enabled?'Enabled':'Disabled'}</h3><button class="btn" data-nav="store">Review store</button></div><div class="publish-target locked-mini"><span class="caps">Live integrations</span><h3>Payments / Vercel / Analytics</h3><button class="btn" data-action="apiLockedDeploy">LAST PHASE 🔒</button></div></div></div>`)};

  const commerceActions=new Set(['toggleStore','addProduct','addToCart','cartQty','openCheckout','checkoutNext','placeOrder','openOrders','storeSettings','addService','selectService','selectSlot','confirmBooking','toggleBooking','toggleLocale','previewLocale','toggleBrowserLanguage','mockTranslate','addEvent','toggleEvent','testEvent','runPrivacyScan','previewCookie','togglePrivacy','cookieCustomize','cookieAccept','codeTab','saveCode','previewCode','saveProjectSettings','toggleProjectSetting','archiveProject','resetPrototype']);
  document.addEventListener('click',function(e){const a=e.target.closest('[data-action]');if(!a||!commerceActions.has(a.dataset.action))return;e.preventDefault();e.stopImmediatePropagation();const action=a.dataset.action;
    if(action==='toggleStore'){state.store.enabled=!state.store.enabled;persistNext();render('store');toast('Store '+(state.store.enabled?'enabled':'disabled'));return}
    if(action==='addProduct'){const draft={id:'prd'+Date.now(),name:'New Product '+(state.products.length+1),price:5900,sku:'NEW-'+(state.products.length+1),status:'Draft',stock:10,category:'New'};state.products.push(draft);saveStoreProduct(draft).then(sv=>{if(sv){draft.id=sv.id;persistNext();render('store')}}).catch(e=>toast(e.message||'Could not save product'));persistNext();render('store');toast('Draft product created');return}
    if(action==='addToCart'){const id=a.dataset.product;let c=state.cart.find(x=>x.productId===id);if(c)c.qty++;else state.cart.push({productId:id,qty:1});fireEvent('add_to_cart',{product:id});render('store');toast('Added to cart');return}
    if(action==='cartQty'){const c=state.cart.find(x=>x.productId===a.dataset.product);if(c){c.qty+=+a.dataset.delta;if(c.qty<=0)state.cart=state.cart.filter(x=>x!==c)}persistNext();render('store');return}
    if(action==='openCheckout'){state.checkout.step=1;persistNext();checkoutModal();return}
    if(action==='checkoutNext'){state.checkout.step=2;persistNext();checkoutModal();return}
    if(action==='setPayMethod'){state.checkout.method=a.dataset.method==='cod'?'cod':'online';persistNext();checkoutModal();return}
    if(action==='placeOrder'){
      const btn=$('#placeOrderBtn'),err=$('#checkoutError');
      const showErr=m=>{if(err){err.textContent=m;err.classList.remove('hidden')}};
      if(err)err.classList.add('hidden');
      const items=(state.cart||[]).map(c=>({productId:c.productId,qty:c.qty})).filter(x=>x.productId&&x.qty>0);
      if(!items.length){showErr('Your cart is empty');return}
      if(!state.checkout.phone){showErr('A contact phone number is required');return}
      if(!state.auth?.workspaceId){showErr('This store is not connected yet');return}
      if(btn){btn.disabled=true;btn.textContent='Please wait…'}
      api('/api/store/checkout',{method:'POST',body:JSON.stringify({
        workspaceId:state.auth.workspaceId,items,method:'cod',
        returnUrl:location.origin+'/',
        customer:{name:state.checkout.name,email:state.checkout.email,phone:state.checkout.phone,address:state.checkout.address,city:state.checkout.city,postalCode:state.checkout.pin,note:state.checkout.note}
      })}).then(d=>{
        if(d.method==='online'&&d.paymentUrl){toast('Redirecting to payment…');location.href=d.paymentUrl;return}
        state.orders.unshift({id:d.orderNumber,customer:state.checkout.name||'Guest',email:state.checkout.email||'',total:fromMinor(d.totalMinor),status:'Pending',payment:'Cash on delivery',fulfillment:'Unfulfilled'});
        state.cart=[];state.checkout.step=3;persistNext();checkoutModal();
      }).catch(e=>{showErr(e.message||'Checkout failed')})
        .finally(()=>{if(btn){btn.disabled=false;btn.textContent='Place order · '+money(cartTotal())}});
      return}
    if(action==='__legacyPlaceOrder'){state.cart=[];state.checkout.step=3;fireEvent('purchase',{total:cartTotal()});persistNext();checkoutModal();toast('Test order created');return}
    if(action==='openOrders'){toast(state.orders.length+' orders in workspace');return}
    if(action==='storeSettings'){modal(`<div class="modal-head"><b>Store settings</b><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><div class="field"><label>Tax rate %</label><input type="number" value="${state.store.taxRate}" data-store-setting="taxRate"/></div><div class="field"><label>Flat shipping</label><input type="number" value="${state.store.shipping}" data-store-setting="shipping"/></div><div class="field"><label>Free shipping from</label><input type="number" value="${state.store.freeShippingAt}" data-store-setting="freeShippingAt"/></div><p class="tiny muted">Currency: INR · Payment provider connects last.</p></div>`);return}
    if(action==='addService'){state.services.push({id:'svc'+Date.now(),name:'New Service',duration:45,price:0});persistNext();render('bookings');toast('Service created');return}
    if(action==='selectService'){state.bookingDraft.service=a.dataset.service;persistNext();render('bookings');return}
    if(action==='selectSlot'){state.bookingDraft.slot=a.dataset.slot;persistNext();render('bookings');return}
    if(action==='confirmBooking'){const s=state.services.find(x=>x.id===state.bookingDraft.service);state.bookings.unshift({id:'bk'+Date.now(),name:state.bookingDraft.name||'Guest',service:s?.name||'Service',time:state.bookingDraft.date+' · '+state.bookingDraft.slot,status:'Confirmed'});fireEvent('booking_confirmed',{service:s?.name});persistNext();render('bookings');toast('Booking confirmed');return}
    if(action==='toggleBooking'){state.bookingSettings.enabled=!state.bookingSettings.enabled;persistNext();render('bookings');return}
    if(action==='toggleLocale'){const l=a.dataset.locale;if(state.localization.enabled.includes(l)){if(l!==state.localization.default)state.localization.enabled=state.localization.enabled.filter(x=>x!==l)}else state.localization.enabled.push(l);persistNext();render('localization');return}
    if(action==='previewLocale'){state.localization.active=a.dataset.locale;persistNext();render('localization');toast('Previewing '+a.dataset.locale.toUpperCase());return}
    if(action==='toggleBrowserLanguage'){state.localization.browserDetect=!state.localization.browserDetect;persistNext();render('localization');return}
    if(action==='mockTranslate'){['hi','fr','ar'].forEach(l=>{if(!state.translations[l])state.translations[l]={hero:'Translated hero '+l,cta:'Translated CTA '+l}});persistNext();render('localization');toast('Missing strings translated in demo');return}
    if(action==='addEvent'){state.analyticsEvents.push({id:'ev'+Date.now(),name:'custom_event_'+(state.analyticsEvents.length+1),trigger:'Manual',count:0,enabled:true});persistNext();render('events');return}
    if(action==='toggleEvent'){const ev=state.analyticsEvents.find(x=>x.id===a.dataset.event);if(ev)ev.enabled=!ev.enabled;persistNext();render('events');return}
    if(action==='testEvent'){const name=document.querySelector('#eventTest')?.value||'custom_event';fireEvent(name,{test:true});render('events');toast('Test event received');return}
    if(action==='runPrivacyScan'){state.privacy.lastScan=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});persistNext();render('privacy');toast('Privacy scan complete');return}
    if(action==='previewCookie'){modal(`<div class="modal-head"><b>Cookie banner preview</b><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><div class="cookie-banner"><div><b>We value your privacy</b><div style="font-size:12px;color:#666;margin-top:4px">You control analytics and marketing consent.</div></div><div class="cookie-actions"><button class="btn" data-action="closeModal">Reject optional</button><button class="btn primary" data-action="closeModal">Accept all</button></div></div></div>`);return}
    if(action==='togglePrivacy'){const k=a.dataset.key;if(k!=='necessary')state.privacy[k]=!state.privacy[k];persistNext();render('privacy');return}
    if(action==='cookieCustomize'){toast('Consent preferences would open');return}
    if(action==='cookieAccept'){state.privacy.analytics=true;state.privacy.marketing=true;state.privacy.personalization=true;persistNext();render('privacy');toast('Consent saved');return}
    if(action==='codeTab'){state.customCode[state.customCode.tab]=document.querySelector('#codeInput')?.value??state.customCode[state.customCode.tab];state.customCode.tab=a.dataset.codeTab;persistNext();render('customcode');return}
    if(action==='saveCode'){state.customCode[state.customCode.tab]=document.querySelector('#codeInput')?.value||'';persistNext();toast('Custom code saved locally');return}
    if(action==='previewCode'){const html=escapeHtml(state.customCode.embed);modal(`<div class="modal-head"><b>Safe embed preview</b><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><div class="code-preview"><code>${html}</code></div><p class="tiny muted">Code is shown as text, not executed, inside this prototype.</p></div>`);return}
    if(action==='saveProjectSettings'){document.querySelectorAll('[data-project-setting]').forEach(el=>state.projectSettings[el.dataset.projectSetting]=el.value);state.projectName=state.projectSettings.siteName||state.projectName;persistNext();toast('Project settings saved');render('projectsettings');return}
    if(action==='toggleProjectSetting'){const k=a.dataset.key;state.projectSettings[k]=!state.projectSettings[k];persistNext();render('projectsettings');return}
    if(action==='archiveProject'){const p=state.projects.find(x=>x.name===state.projectName);if(p)p.status='Archived';persistNext();toast('Project archived');return}
    if(action==='resetPrototype'){if(confirm('Reset local state? This clears everything in this browser.')){localStorage.removeItem('scenspace3d_state');location.reload()}return}
  },true);

  document.addEventListener('input',function(e){
    const b=e.target.closest('[data-booking]');if(b){state.bookingDraft[b.dataset.booking]=b.value;persistNext();return}
    const c=e.target.closest('[data-checkout]');if(c){state.checkout[c.dataset.checkout]=c.value;persistNext();return}
    const ps=e.target.closest('[data-project-setting]');if(ps){state.projectSettings[ps.dataset.projectSetting]=ps.value;persistNext();return}
    const ss=e.target.closest('[data-store-setting]');if(ss){state.store[ss.dataset.storeSetting]=+ss.value;persistNext();return}
  },true);
  document.addEventListener('change',function(e){
    const bs=e.target.closest('[data-booking-setting]');if(bs){state.bookingSettings[bs.dataset.bookingSetting]=bs.type==='number'?+bs.value:bs.value;persistNext();return}
    const lc=e.target.closest('[data-localization]');if(lc){state.localization[lc.dataset.localization]=lc.value;if(lc.dataset.localization==='default'&&!state.localization.enabled.includes(lc.value))state.localization.enabled.push(lc.value);persistNext();render('localization');return}
    const pv=e.target.closest('[data-privacy]');if(pv){state.privacy[pv.dataset.privacy]=pv.value;persistNext();return}
  },true);

  persistNext();
})();


/* ===== NEXT FLOW: PDP + VARIANTS + INVENTORY + CALENDAR + FUNNELS + REDIRECTS + BACKUPS ===== */
(function(){
  const eh=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money2=n=>'₹'+Number(n||0).toLocaleString('en-IN');
  const persistOps=()=>saveState();

  state.productDetail=Object.assign({productId:state.products?.[0]?.id||'',layout:'Split immersive',gallery:'3D orbit',buyBar:'Sticky',showDescription:true,showStock:true,showRecommendations:true},state.productDetail||{});
  state.productVariants=state.productVariants||{};
  (state.products||[]).forEach((p,i)=>{
    if(!state.productVariants[p.id]) state.productVariants[p.id]=[
      {id:'v-size-'+p.id,name:'Size',values:i%2?['Small','Large']:['Standard','Large']},
      {id:'v-finish-'+p.id,name:'Finish',values:i%2?['Graphite','Sand']:['Black','Stone']}
    ];
  });
  state.variantSelection=state.variantSelection||{};
  state.inventoryLog=Array.isArray(state.inventoryLog)?state.inventoryLog:[];
  state.cartDrawerOpen=!!state.cartDrawerOpen;
  state.bookingCalendar=Object.assign({month:'August 2026',view:'Month',selectedDate:'2026-08-16'},state.bookingCalendar||{});
  state.pageTranslations=state.pageTranslations||{};
  state.translationEditor=Object.assign({pageId:state.currentPageId||state.pages?.[0]?.id||'',locale:state.localization?.active||'en'},state.translationEditor||{});
  state.funnel=state.funnel||{name:'Primary Website Funnel',stages:[
    {id:'f1',name:'Landing view',event:'page_view',visitors:24810},
    {id:'f2',name:'Product / Offer view',event:'product_view',visitors:10940},
    {id:'f3',name:'CTA / Add to cart',event:'cta_click',visitors:2842},
    {id:'f4',name:'Checkout / Lead start',event:'checkout_start',visitors:1160},
    {id:'f5',name:'Purchase / Conversion',event:'purchase',visitors:382}
  ]};
  state.redirects=Array.isArray(state.redirects)?state.redirects:[];
  state.notFound=Object.assign({title:'This page drifted away.',copy:'The URL does not exist anymore. Return to the main experience.',button:'Back home'},state.notFound||{});
  state.backups=Array.isArray(state.backups)?state.backups:[];

  function product(){return (state.products||[]).find(p=>p.id===state.productDetail.productId)||state.products?.[0]}
  function page(){return (state.pages||[]).find(p=>p.id===state.translationEditor.pageId)||state.pages?.[0]}
  function ensurePageLocale(p,l){
    if(!p)return {heroTitle:'',heroSubtitle:''};
    state.pageTranslations[p.id]=state.pageTranslations[p.id]||{};
    state.pageTranslations[p.id][l]=Object.assign({
      heroTitle:l==='en'?p.heroTitle:(state.translations?.[l]?.hero||p.heroTitle),
      heroSubtitle:l==='en'?p.heroSubtitle:(l==='hi'?'इस पेज के लिए स्थानीयकृत, संपादन योग्य कंटेंट।':'Localized editable copy for this page.')
    },state.pageTranslations[p.id][l]||{});
    return state.pageTranslations[p.id][l];
  }
  function funnelDrop(i){
    const a=state.funnel.stages[i-1]?.visitors||0,b=state.funnel.stages[i]?.visitors||0;
    return a?Math.round((b/a)*100):100;
  }

  views.productdetail=()=>{
    const p=product(), vars=state.productVariants[p?.id]||[];
    return `${viewHead('Product Detail Builder','Design your product page, variants and buying experience.',`<button class="btn" data-nav="store">← Store</button><button class="btn primary" data-action="previewProductPage">Preview product page</button>`)}
    <div class="pdp-shell">
      <aside class="card pdp-list"><span class="caps">Products</span><h3 style="margin:6px 0 12px">Choose a product</h3>${(state.products||[]).map(x=>`<div class="pdp-product ${p?.id===x.id?'active':''}" data-action="selectPdpProduct" data-product="${x.id}"><div class="pdp-thumb"></div><div><b>${eh(x.name)}</b><div class="tiny muted">${eh(x.sku)} · ${x.stock} in stock</div></div><span>${money2(x.price)}</span></div>`).join('')}</aside>
      <section class="card pdp-builder">
        <div class="row"><div><span class="caps">Live page canvas</span><h2 style="margin:5px 0">${eh(p?.name||'Product')}</h2></div><span class="grow"></span><span class="status live">Editable</span></div>
        <div class="pdp-preview" style="margin-top:12px"><div class="pdp-gallery"><div class="pdp-object"></div><span class="pill" style="position:absolute;bottom:18px;left:18px">${eh(state.productDetail.gallery)}</span></div><div class="pdp-info"><span class="caps">${eh(p?.category||'Collection')}</span><h2>${eh(p?.name||'Product')}</h2><div class="price">${money2(p?.price)}</div><p style="color:#666;line-height:1.6">A product story page generated from the global brand system, with variant selection, inventory state and a persistent buying action.</p>${vars.map(v=>`<div class="variant-group"><b style="font-size:12px">${eh(v.name)}</b><div class="variant-values" style="margin-top:7px">${v.values.map((val,j)=>`<button class="variant-chip ${(state.variantSelection[p.id]?.[v.name]||v.values[0])===val?'active':''}" data-action="selectVariant" data-product="${p.id}" data-variant="${eh(v.name)}" data-value="${eh(val)}">${eh(val)}</button>`).join('')}</div></div>`).join('')}<div class="tiny ${p?.stock<10?'stock-low':'muted'}">${p?.stock||0} units available</div><button class="btn primary" style="margin-top:16px;width:100%" data-action="addToCartFromPdp" data-product="${p?.id}">Add to cart · ${money2(p?.price)}</button></div></div>
        <div class="pdp-controls"><div class="field"><label>Layout</label><select data-pdp-setting="layout"><option ${state.productDetail.layout==='Split immersive'?'selected':''}>Split immersive</option><option ${state.productDetail.layout==='Editorial stack'?'selected':''}>Editorial stack</option><option ${state.productDetail.layout==='Minimal commerce'?'selected':''}>Minimal commerce</option></select></div><div class="field"><label>Gallery</label><select data-pdp-setting="gallery"><option ${state.productDetail.gallery==='3D orbit'?'selected':''}>3D orbit</option><option>Editorial grid</option><option>Full bleed</option></select></div><div class="field"><label>Buy bar</label><select data-pdp-setting="buyBar"><option ${state.productDetail.buyBar==='Sticky'?'selected':''}>Sticky</option><option>Inline</option><option>Floating</option></select></div><div class="field"><label>Recommendations</label><select data-pdp-setting="showRecommendations"><option value="true" ${state.productDetail.showRecommendations?'selected':''}>Show</option><option value="false" ${!state.productDetail.showRecommendations?'selected':''}>Hide</option></select></div></div>
        <div class="row" style="margin-top:12px"><button class="btn" data-action="addVariant" data-product="${p?.id}">＋ Add option</button><button class="btn" data-nav="inventory">Manage inventory</button><span class="grow"></span><span class="tiny muted">Cart drawer is connected to the website canvas.</span></div>
      </section>
    </div>`;
  };

  views.inventory=()=>`${viewHead('Inventory Manager','Manage stock across products and variants without touching the website layout.',`<button class="btn" data-action="restockAll">Restock all</button><button class="btn primary" data-action="addProduct">＋ Product</button>`)}
  <div class="inv-toolbar"><span class="pill">${(state.products||[]).reduce((a,p)=>a+(+p.stock||0),0)} total units</span><span class="pill">${(state.products||[]).filter(p=>p.stock<10).length} low-stock SKUs</span><span class="pill">${state.inventoryLog.length} recent changes</span></div>
  <div class="inv-table"><div class="inv-row header"><span>Product</span><span>SKU / Status</span><span>Stock</span><span>Threshold</span><span>Adjust</span></div>${(state.products||[]).map(p=>`<div class="inv-row"><div><b>${eh(p.name)}</b><div class="tiny muted">${eh(p.category)}</div></div><div><span class="tiny">${eh(p.sku)}</span><div class="tiny muted">${eh(p.status)}</div></div><div class="${p.stock<10?'stock-low':'stock-ok'}"><b>${p.stock}</b></div><div class="tiny muted">${p.stock<10?'Low stock':'Healthy'}</div><div class="stock-control"><button data-action="stockAdjust" data-product="${p.id}" data-delta="-1">−</button><button data-action="stockAdjust" data-product="${p.id}" data-delta="1">＋</button><button data-action="stockAdjust" data-product="${p.id}" data-delta="10">+10</button></div></div>`).join('')}</div>
  <div class="card" style="padding:18px;margin-top:18px"><span class="caps">Inventory activity</span>${state.inventoryLog.slice(0,6).map(x=>`<div class="agenda-item"><b>${eh(x.product)}</b><span class="${x.change<0?'stock-low':'stock-ok'}" style="float:right">${x.change>0?'+':''}${x.change}</span><div class="tiny muted">${eh(x.time)} · ${eh(x.note)}</div></div>`).join('')||'<div class="empty-state">No stock changes yet.</div>'}</div>`;

  views.bookingcalendar=()=>{
    const days=Array.from({length:35},(_,i)=>i-4);
    return `${viewHead('Booking Calendar','See services and confirmed bookings in an operational calendar view.',`<button class="btn" data-nav="bookings">Booking setup</button><button class="btn primary" data-action="calendarToday">Today</button>`)}
    <div class="calendar-shell"><section class="card calendar-card"><div class="calendar-head"><button class="btn" data-action="calendarPrev">←</button><div><b>${eh(state.bookingCalendar.month)}</b><div class="tiny muted">Workspace timezone · ${eh(state.bookingSettings?.timezone)}</div></div><span class="grow"></span><button class="btn ${state.bookingCalendar.view==='Month'?'primary':''}" data-action="calendarView" data-view="Month">Month</button><button class="btn ${state.bookingCalendar.view==='Agenda'?'primary':''}" data-action="calendarView" data-view="Agenda">Agenda</button><button class="btn" data-action="calendarNext">→</button></div>
    ${state.bookingCalendar.view==='Agenda'?`<div>${(state.bookings||[]).map(b=>`<div class="agenda-item"><b>${eh(b.time)}</b><span style="float:right" class="status live">${eh(b.status)}</span><div>${eh(b.name)} · ${eh(b.service)}</div></div>`).join('')}</div>`:`<div class="calendar-grid">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div class="cal-day" style="min-height:34px"><b class="tiny">${d}</b></div>`).join('')}${days.map(n=>{const day=n<=0?31+n:n;const out=n<=0||n>31;const booking=(state.bookings||[]).find(b=>String(b.time).includes(String(day)+' Aug')||String(b.time).includes('-08-'+String(day).padStart(2,'0')));return `<div class="cal-day ${out?'out':''}"><div class="cal-date">${day}</div>${booking?`<div class="cal-booking">${eh(booking.service)}<br>${eh(booking.name)}</div>`:''}${!out&&[16,18,22].includes(day)?`<div class="cal-booking" style="border-color:rgba(123,238,255,.22);color:#a7f4ff;background:rgba(123,238,255,.06)">Open slots</div>`:''}</div>`}).join('')}</div>`}</section>
    <aside class="card calendar-card"><span class="caps">Upcoming</span><h3>${state.bookings.length} confirmed</h3>${(state.bookings||[]).slice(0,8).map(b=>`<div class="agenda-item"><b>${eh(b.service)}</b><div class="tiny">${eh(b.name)}</div><div class="tiny muted">${eh(b.time)}</div></div>`).join('')}<button class="btn" style="width:100%;margin-top:12px" data-nav="bookings">＋ New booking</button></aside></div>`;
  };

  views.pagetranslations=()=>{
    const p=page(), l=state.translationEditor.locale, tr=ensurePageLocale(p,l);
    return `${viewHead('Per-page Localization','Edit every page independently in every enabled language.',`<button class="btn" data-nav="localization">Language settings</button><button class="btn primary" data-action="applyPageTranslation">Apply to page preview</button>`)}
    <div class="translation-shell"><aside class="card translation-side"><span class="caps">Pages</span><h3 style="margin:6px 0 12px">Website pages</h3>${(state.pages||[]).map(pg=>`<div class="translation-page ${pg.id===p?.id?'active':''}" data-action="selectTranslationPage" data-page="${pg.id}"><b>${eh(pg.name)}</b><div class="tiny muted">${eh(pg.slug)}</div></div>`).join('')}</aside><section class="card translation-editor"><span class="caps">Language</span><div class="locale-tabs">${(state.localization?.enabled||['en']).map(code=>`<button class="locale-tab ${code===l?'active':''}" data-action="selectTranslationLocale" data-locale="${code}">${code.toUpperCase()}</button>`).join('')}</div><div class="field"><label>Hero heading · ${l.toUpperCase()}</label><input data-page-translation="heroTitle" value="${eh(tr.heroTitle)}"/></div><div class="field"><label>Hero body · ${l.toUpperCase()}</label><textarea data-page-translation="heroSubtitle" rows="4">${eh(tr.heroSubtitle)}</textarea></div><div class="logic-grid"><div class="field"><label>SEO title</label><input data-page-translation="seoTitle" value="${eh(tr.seoTitle||p?.name+' · '+state.projectName)}"/></div><div class="field"><label>Localized slug</label><input data-page-translation="slug" value="${eh(tr.slug||('/'+l+(p?.slug==='/'?'':p?.slug)))}"/></div></div><div class="translation-preview"><span class="caps">${eh(p?.name)} · ${l.toUpperCase()}</span><h2>${eh(tr.heroTitle)}</h2><p>${eh(tr.heroSubtitle)}</p></div></section></div>`;
  };

  views.funnels=()=>{
    const first=state.funnel.stages[0]?.visitors||1,last=state.funnel.stages.at(-1)?.visitors||0, conversion=Math.round(last/first*1000)/10;
    return `${viewHead('Conversion Funnel','Connect website actions into one visual journey and find where users drop.',`<button class="btn" data-action="simulateFunnel">Simulate traffic</button><button class="btn primary" data-action="addFunnelStage">＋ Stage</button>`)}
    <div class="funnel-grid"><section class="card funnel-canvas"><div class="row"><div><span class="caps">Active funnel</span><h2 style="margin:5px 0">${eh(state.funnel.name)}</h2></div><span class="grow"></span><span class="pill">${conversion}% end conversion</span></div>${state.funnel.stages.map((x,i)=>`<div class="funnel-stage"><div class="funnel-num">${i+1}</div><div><b>${eh(x.name)}</b><div class="tiny muted">${eh(x.event)}</div><div class="funnel-bar" style="margin-top:8px"><i style="width:${Math.max(5,Math.round(x.visitors/first*100))}%"></i></div></div><div><b>${Number(x.visitors).toLocaleString()}</b><div class="tiny muted">users</div></div><div class="funnel-rate">${i===0?'100':funnelDrop(i)}%</div></div>`).join('')}</section><aside class="card funnel-side"><span class="caps">Funnel health</span><div class="funnel-metric"><b>${conversion}%</b><span class="tiny muted">Overall conversion</span></div><div class="funnel-metric"><b>${Number(first-last).toLocaleString()}</b><span class="tiny muted">Total drop-off</span></div><div class="funnel-metric"><b>${state.funnel.stages.length}</b><span class="tiny muted">Tracked stages</span></div><p class="tiny muted">Based on your local event stream. Connect analytics for live traffic data.</p></aside></div>`;
  };

  views.redirects=()=>`${viewHead('Redirects & 404','Manage URL migrations and the custom not-found experience before publishing.',`<button class="btn" data-action="preview404">Preview 404</button><button class="btn primary" data-action="addRedirect">＋ Redirect</button>`)}
  <div class="redirect-table"><div class="redirect-row header"><span>From</span><span>To</span><span>Type</span><span>Status</span><span></span></div>${state.redirects.map(r=>`<div class="redirect-row"><input data-redirect="${r.id}" data-field="from" value="${eh(r.from)}"/><input data-redirect="${r.id}" data-field="to" value="${eh(r.to)}"/><select data-redirect="${r.id}" data-field="type"><option ${r.type==='301'?'selected':''}>301</option><option ${r.type==='302'?'selected':''}>302</option></select><button class="switch ${r.enabled?'on':''}" data-action="toggleRedirect" data-redirect="${r.id}"></button><button class="btn danger" data-action="deleteRedirect" data-redirect="${r.id}">Delete</button></div>`).join('')}</div>
  <div class="card" style="padding:20px;margin-top:18px"><span class="caps">Custom 404</span><div class="logic-grid"><div class="field"><label>Heading</label><input data-404="title" value="${eh(state.notFound.title)}"/></div><div class="field"><label>Button</label><input data-404="button" value="${eh(state.notFound.button)}"/></div></div><div class="field"><label>Message</label><textarea data-404="copy" rows="3">${eh(state.notFound.copy)}</textarea></div></div>`;

  views.backups=()=>`${viewHead('Backup & Import','Create portable project snapshots and restore them locally.',`<button class="btn" data-action="createSnapshot">Create snapshot</button><button class="btn primary" data-action="downloadBackup">Download JSON</button>`)}
  <div class="backup-grid"><section class="card backup-card"><span class="caps">Project backup</span><h2 style="margin:6px 0">Portable project state</h2><p class="small muted">Includes pages, builder state, CMS, store, forms, languages, funnels, redirects and settings. Secret API keys are not part of this phase.</p><div class="backup-drop"><div style="font-size:38px">⇩</div><b>Import project backup</b><p class="tiny muted">Choose a JSON backup created by this prototype.</p><input id="backupImportInput" type="file" accept="application/json,.json" style="max-width:260px"/></div><button class="btn" style="width:100%;margin-top:10px" data-action="importBackup">Import selected backup</button></section><aside class="card backup-card"><span class="caps">Local snapshots</span><h3>${state.backups.length} snapshots</h3>${state.backups.map(b=>`<div class="backup-item"><div><b>${eh(b.name)}</b><div class="tiny muted">${eh(b.time)} · ${eh(b.size)}</div></div><button class="btn" data-action="restoreBackupSnapshot" data-backup="${b.id}">Restore</button></div>`).join('')}</aside></div>`;

  // Wrap builder render to add a real cart drawer to the website canvas.
  const priorRender=render;
  render=function(route){
    priorRender(route);
    if(route==='builder') setTimeout(()=>{
      const dev=document.querySelector('.canvas-device'); if(!dev||dev.querySelector('.canvas-cart-toggle'))return;
      dev.style.position='relative';
      const count=(state.cart||[]).reduce((a,c)=>a+(+c.qty||0),0);
      const btn=document.createElement('button');btn.className='canvas-cart-toggle';btn.dataset.action='toggleCanvasCart';btn.innerHTML=`🛒<b>${count}</b>`;dev.prepend(btn);
      if(state.cartDrawerOpen){
        const d=document.createElement('div');d.className='canvas-cart-drawer';
        const rows=(state.cart||[]).map(c=>{const p=(state.products||[]).find(x=>x.id===c.productId);return p?`<div class="canvas-cart-item"><div><b>${eh(p.name)}</b><div class="tiny muted">${c.qty} × ${money2(p.price)}</div></div><span>${money2(p.price*c.qty)}</span></div>`:''}).join('');
        const total=(state.cart||[]).reduce((a,c)=>{const p=(state.products||[]).find(x=>x.id===c.productId);return a+(p?p.price*c.qty:0)},0);
        d.innerHTML=`<div class="row"><b>Cart drawer</b><span class="grow"></span><button class="btn" data-action="toggleCanvasCart">×</button></div>${rows||'<div class="empty-state" style="margin-top:10px">Cart is empty</div>'}<div class="summary-line total"><span>Total</span><span>${money2(total)}</span></div><button class="btn primary" style="width:100%" data-action="canvasCheckout">Checkout →</button>`;
        dev.prepend(d);
      }
    },0);
  };

  const actions=new Set(['addInventoryProduct','selectPdpProduct','selectVariant','addVariant','addToCartFromPdp','previewProductPage','stockAdjust','restockAll','calendarToday','calendarPrev','calendarNext','calendarView','selectTranslationPage','selectTranslationLocale','applyPageTranslation','simulateFunnel','addFunnelStage','addRedirect','toggleRedirect','deleteRedirect','preview404','createSnapshot','downloadBackup','importBackup','restoreBackupSnapshot','toggleCanvasCart','canvasCheckout']);
  document.addEventListener('click',e=>{
    const a=e.target.closest('[data-action]'); if(!a||!actions.has(a.dataset.action))return;
    e.preventDefault();e.stopImmediatePropagation();
    const action=a.dataset.action;
    if(action==='addInventoryProduct'){state.products.push({id:'prd'+Date.now(),name:'New Product '+(state.products.length+1),price:5900,sku:'NEW-'+(state.products.length+1),status:'Draft',stock:10,category:'New'});persistOps();render('inventory');toast('Draft product created');return}
    if(action==='selectPdpProduct'){state.productDetail.productId=a.dataset.product;persistOps();render('productdetail');return}
    if(action==='selectVariant'){state.variantSelection[a.dataset.product]=state.variantSelection[a.dataset.product]||{};state.variantSelection[a.dataset.product][a.dataset.variant]=a.dataset.value;persistOps();render('productdetail');return}
    if(action==='addVariant'){const id=a.dataset.product,v=state.productVariants[id]||(state.productVariants[id]=[]);v.push({id:'v'+Date.now(),name:'Option '+(v.length+1),values:['Option A','Option B']});persistOps();render('productdetail');toast('Variant option added');return}
    if(action==='addToCartFromPdp'){let c=(state.cart||[]).find(x=>x.productId===a.dataset.product);if(c)c.qty++;else state.cart.push({productId:a.dataset.product,qty:1});persistOps();render('productdetail');toast('Product added to cart');return}
    if(action==='previewProductPage'){const p=product();modal(`<div class="modal-head"><div><span class="caps">Product page preview</span><b style="display:block;margin-top:4px">${eh(p?.name)}</b></div><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><div class="pdp-preview"><div class="pdp-gallery"><div class="pdp-object"></div></div><div class="pdp-info"><span class="caps">${eh(p?.category)}</span><h2>${eh(p?.name)}</h2><div class="price">${money2(p?.price)}</div><p>Immersive product storytelling with variants and stock state.</p></div></div></div>`);return}
    if(action==='stockAdjust'){const p=(state.products||[]).find(x=>x.id===a.dataset.product);if(p){const d=+a.dataset.delta;p.stock=Math.max(0,(+p.stock||0)+d);state.inventoryLog.unshift({time:'Just now',product:p.name,change:d,note:'Manual adjustment'});persistOps();render('inventory')}return}
    if(action==='restockAll'){(state.products||[]).forEach(p=>p.stock=Math.max(20,+p.stock||0));state.inventoryLog.unshift({time:'Just now',product:'All products',change:20,note:'Manual restock'});persistOps();render('inventory');toast('Inventory restocked');return}
    if(action==='calendarToday'){state.bookingCalendar.month='August 2026';state.bookingCalendar.selectedDate='2026-08-15';persistOps();render('bookingcalendar');return}
    if(action==='calendarPrev'){state.bookingCalendar.month='July 2026';persistOps();render('bookingcalendar');return}
    if(action==='calendarNext'){state.bookingCalendar.month='September 2026';persistOps();render('bookingcalendar');return}
    if(action==='calendarView'){state.bookingCalendar.view=a.dataset.view;persistOps();render('bookingcalendar');return}
    if(action==='selectTranslationPage'){state.translationEditor.pageId=a.dataset.page;persistOps();render('pagetranslations');return}
    if(action==='selectTranslationLocale'){state.translationEditor.locale=a.dataset.locale;persistOps();render('pagetranslations');return}
    if(action==='applyPageTranslation'){const p=page(),tr=ensurePageLocale(p,state.translationEditor.locale);if(state.translationEditor.locale==='en'&&p){p.heroTitle=tr.heroTitle;p.heroSubtitle=tr.heroSubtitle;if(p.id===state.currentPageId){state.heroTitle=tr.heroTitle;state.heroSubtitle=tr.heroSubtitle}}persistOps();toast('Localized page copy saved');render('pagetranslations');return}
    if(action==='simulateFunnel'){state.funnel.stages.forEach((x,i)=>{x.visitors=Math.max(20,Math.round(x.visitors*(.98+Math.random()*.08)-(i*5))) });persistOps();render('funnels');toast('Demo funnel traffic updated');return}
    if(action==='addFunnelStage'){const n=state.funnel.stages.length;state.funnel.stages.splice(Math.max(1,n-1),0,{id:'f'+Date.now(),name:'New conversion step',event:'custom_event',visitors:Math.round((state.funnel.stages[n-2]?.visitors||1000)*.72)});persistOps();render('funnels');return}
    if(action==='addRedirect'){state.redirects.push({id:'rd'+Date.now(),from:'/old-path',to:'/',type:'301',enabled:true});persistOps();render('redirects');return}
    if(action==='toggleRedirect'){const r=state.redirects.find(x=>x.id===a.dataset.redirect);if(r)r.enabled=!r.enabled;persistOps();render('redirects');return}
    if(action==='deleteRedirect'){state.redirects=state.redirects.filter(x=>x.id!==a.dataset.redirect);persistOps();render('redirects');return}
    if(action==='preview404'){modal(`<div class="modal-head"><b>404 preview</b><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><div class="translation-preview" style="min-height:360px;display:grid;place-items:center;text-align:center"><div><span class="caps">404 · LOST IN SPACE</span><h2>${eh(state.notFound.title)}</h2><p>${eh(state.notFound.copy)}</p><button class="btn" data-action="closeModal">${eh(state.notFound.button)}</button></div></div></div>`);return}
    if(action==='createSnapshot'){const clean=JSON.parse(JSON.stringify(state));if(clean.backups)clean.backups=clean.backups.map(({data,...x})=>x);const snap={id:'bk'+Date.now(),name:'Manual snapshot',time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),size:'Local state',data:clean};state.backups.unshift(snap);state.backups=state.backups.slice(0,8);persistOps();render('backups');toast('Local snapshot created');return}
    if(action==='downloadBackup'){const copy=JSON.parse(JSON.stringify(state));if(copy.backups)copy.backups=copy.backups.map(({data,...x})=>x);const blob=new Blob([JSON.stringify(copy,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=(state.projectName||'scen-space-project').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Project backup downloaded');return}
    if(action==='importBackup'){const input=document.querySelector('#backupImportInput'),file=input?.files?.[0];if(!file){toast('Choose a JSON backup first');return}const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);Object.keys(state).forEach(k=>delete state[k]);Object.assign(state,data);persistOps();toast('Backup imported');render('dashboard')}catch(err){toast('Backup file is invalid')}};reader.readAsText(file);return}
    if(action==='restoreBackupSnapshot'){const b=state.backups.find(x=>x.id===a.dataset.backup);if(b?.data){Object.keys(state).forEach(k=>delete state[k]);Object.assign(state,JSON.parse(JSON.stringify(b.data)));persistOps();render('dashboard');toast('Snapshot restored')}else toast('This seed snapshot has no restore payload');return}
    if(action==='toggleCanvasCart'){state.cartDrawerOpen=!state.cartDrawerOpen;persistOps();render('builder');return}
    if(action==='canvasCheckout'){state.cartDrawerOpen=false;persistOps();if(typeof checkoutModal==='function')checkoutModal();else navigate('store');return}
  },true);

  document.addEventListener('input',e=>{
    const pd=e.target.closest('[data-pdp-setting]');if(pd){const k=pd.dataset.pdpSetting;state.productDetail[k]=pd.value==='true'?true:pd.value==='false'?false:pd.value;persistOps();return}
    const pt=e.target.closest('[data-page-translation]');if(pt){const p=page(),tr=ensurePageLocale(p,state.translationEditor.locale);tr[pt.dataset.pageTranslation]=pt.value;persistOps();const preview=document.querySelector('.translation-preview');if(preview){const h=preview.querySelector('h2'),pp=preview.querySelector('p');if(h)h.textContent=tr.heroTitle;if(pp)pp.textContent=tr.heroSubtitle}return}
    const rd=e.target.closest('[data-redirect][data-field]');if(rd){const r=state.redirects.find(x=>x.id===rd.dataset.redirect);if(r)r[rd.dataset.field]=rd.value;persistOps();return}
    const nf=e.target.closest('[data-404]');if(nf){state.notFound[nf.dataset['404']]=nf.value;persistOps();return}
  },true);

  // Keep stock and funnel data in sync with existing demo checkout.
  const priorCommerceFire=window.fireEvent;
  persistOps();
})();



/* ===== NEXT FLOW: CHECKOUT OPS + MEMBERSHIP + PRODUCTION DASHBOARD ===== */
(function(){
  const esc2=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const cash=n=>'₹'+Number(n||0).toLocaleString('en-IN');
  const saveOps=()=>saveState();
  const now=()=>new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

  state.checkoutDesign=Object.assign({layout:'Split',accent:'#111111',logo:'Scen',showTrust:true,showOrderNote:false,express:true,successTitle:'Order confirmed.',successCopy:'We’ve received your order and will keep you updated.'},state.checkoutDesign||{});
  state.orders=(state.orders||[]).map((o,i)=>Object.assign({email:['aarav@example.com','nidhi@example.com','client@example.com'][i%3],items:1+i,total:0,status:'Paid',fulfillment:i===1?'Fulfilled':'Unfulfilled',created:'15 Aug · '+(12+i)+':20'},o));
  if(false)state.orders=[{id:'#1051',customer:'',email:'',items:0,total:0,status:'Paid',fulfillment:'Unfulfilled',created:'15 Aug · 12:20'}];
  state.selectedOrderId=state.selectedOrderId||state.orders[0]?.id||'';
  state.discounts=Array.isArray(state.discounts)&&state.discounts.length?state.discounts:[];
  state.shippingZones=Array.isArray(state.shippingZones)&&state.shippingZones.length?state.shippingZones:[];
  state.emailTemplates=Array.isArray(state.emailTemplates)&&state.emailTemplates.length?state.emailTemplates:[
    {id:'em1',name:'Order confirmation',trigger:'Order created',subject:'Your order {{order_id}} is confirmed',body:'Hi {{customer_name}},\n\nThanks for your order. We’re preparing it now.\n\nTotal: {{order_total}}'},
    {id:'em2',name:'Order shipped',trigger:'Fulfillment',subject:'Your order is on the way',body:'Hi {{customer_name}},\n\nYour order {{order_id}} has shipped. Track it from your account.'},
    {id:'em3',name:'Booking confirmed',trigger:'Booking',subject:'Booking confirmed for {{booking_time}}',body:'Your booking is confirmed. We look forward to seeing you.'},
    {id:'em4',name:'Welcome member',trigger:'Signup',subject:'Welcome to {{site_name}}',body:'Your account is ready. Explore your member area and saved favorites.'}
  ];
  state.selectedEmailId=state.selectedEmailId||state.emailTemplates[0]?.id||'';
  state.availability=Object.assign({days:{Mon:true,Tue:true,Wed:true,Thu:true,Fri:true,Sat:true,Sun:false},start:'10:00',end:'18:00',slot:30,minNotice:2,maxAdvance:60,capacity:1,blackouts:['2026-08-20']},state.availability||{});
  state.membershipPlans=Array.isArray(state.membershipPlans)&&state.membershipPlans.length?state.membershipPlans:[];
  state.gatedPages=Array.isArray(state.gatedPages)&&state.gatedPages.length?state.gatedPages:[];
  state.siteUsers=Array.isArray(state.siteUsers)&&state.siteUsers.length?state.siteUsers:[];
  state.favoriteProductIds=Array.isArray(state.favoriteProductIds)&&state.favoriteProductIds.length?state.favoriteProductIds:[].filter(Boolean);
  state.opsActivity=Array.isArray(state.opsActivity)?state.opsActivity:[];

  const selectedOrder=()=>state.orders.find(o=>o.id===state.selectedOrderId)||state.orders[0];
  const selectedEmail=()=>state.emailTemplates.find(x=>x.id===state.selectedEmailId)||state.emailTemplates[0];
  const activeMembers=()=>state.siteUsers.filter(x=>x.status==='Active').length;
  const revenue=()=>state.orders.reduce((a,o)=>a+(+o.total||0),0);
  const qaScore=()=>Math.min(99,82+(state.privacy?.lastScan&&state.privacy.lastScan!=='Not run'?4:0)+(state.redirects?.length?2:0)+(state.emailTemplates?.length?2:0)+(state.shippingZones?.some(z=>z.active)?3:0));

  views.production=()=>`${viewHead('Production dashboard','Everything required to run the finished website before real providers are connected.',`<button class="btn" data-nav="backups">Backup</button><button class="btn primary" data-nav="integrations">API phase 🔒</button>`)}
    <div class="ops-grid">
      <section class="card ops-card span-3"><span class="caps">Revenue</span><div class="kpi">${cash(revenue())}</div><span class="trend">↑ Local order flow</span></section>
      <section class="card ops-card span-3"><span class="caps">Orders</span><div class="kpi">${state.orders.length}</div><span class="tiny muted">${state.orders.filter(x=>x.fulfillment!=='Fulfilled').length} need fulfillment</span></section>
      <section class="card ops-card span-3"><span class="caps">Members</span><div class="kpi">${activeMembers()}</div><span class="tiny muted">Across ${state.membershipPlans.length} tiers</span></section>
      <section class="card ops-card span-3"><span class="caps">Launch health</span><div class="kpi">${qaScore()}%</div><span class="trend">API deferred safely</span></section>
      <section class="card ops-card span-8"><div class="row"><div><span class="caps">Operations center</span><h3>Ready-to-run business flows</h3></div><span class="grow"></span><span class="pill">No provider keys used</span></div>
        <table class="ops-table"><thead><tr><th>Module</th><th>Status</th><th>Next action</th></tr></thead><tbody>
          <tr><td>Checkout & orders</td><td><span class="status-pill active">Ready</span></td><td><button class="btn" data-nav="orders">Open</button></td></tr>
          <tr><td>Shipping, tax & discounts</td><td><span class="status-pill active">Ready</span></td><td><button class="btn" data-nav="shipping">Configure</button></td></tr>
          <tr><td>Bookings & availability</td><td><span class="status-pill active">Ready</span></td><td><button class="btn" data-nav="availability">Rules</button></td></tr>
          <tr><td>Members & accounts</td><td><span class="status-pill active">Ready</span></td><td><button class="btn" data-nav="members">Manage</button></td></tr>
          <tr><td>Real APIs / payments / email delivery</td><td><span class="status-pill pending">Last phase</span></td><td><button class="btn" data-nav="integrations">Locked 🔒</button></td></tr>
        </tbody></table></section>
      <aside class="card ops-card span-4"><span class="caps">Launch health</span><div style="display:flex;align-items:center;gap:18px;margin:18px 0"><div class="health-ring"><b>${qaScore()}</b></div><div><b>Production architecture</b><p class="tiny muted">UI, data states, rules and admin flow are prepared locally.</p></div></div><div class="stack"><div><div class="row tiny"><span>Commerce</span><span class="grow"></span><b>96%</b></div><div class="activity-bar"><i style="width:96%"></i></div></div><div><div class="row tiny"><span>Content & SEO</span><span class="grow"></span><b>92%</b></div><div class="activity-bar"><i style="width:92%"></i></div></div><div><div class="row tiny"><span>Provider integration</span><span class="grow"></span><b>0%</b></div><div class="activity-bar"><i style="width:0%"></i></div></div></div></aside>
      <section class="card ops-card span-7"><span class="caps">Recent activity</span><h3>Workspace pulse</h3><div class="timeline-list">${state.opsActivity.slice(0,6).map(x=>`<div class="timeline-item"><div></div><div><b>${esc2(x.text)}</b><div class="tiny muted">${esc2(x.time)} · local event</div></div></div>`).join('')}</div></section>
      <aside class="card ops-card span-5"><span class="caps">Launch checklist</span><h3>Final non-API checks</h3>${[['Checkout design',true],['Shipping zones',state.shippingZones.some(x=>x.active)],['Email templates',state.emailTemplates.length>=4],['Booking rules',Object.values(state.availability.days).some(Boolean)],['Member access',state.membershipPlans.length>0],['Backup system',true],['API credentials',false]].map(([n,ok])=>`<div class="mini-row"><span>${ok?'✓':'🔒'}</span><b>${n}</b><span class="grow"></span><span class="tiny ${ok?'trend':'muted'}">${ok?'Ready':'Last phase'}</span></div>`).join('')}</aside>
    </div>`;

  views.orders=()=>{const o=selectedOrder();return `${viewHead('Orders','Manage orders, payment state, fulfillment and customer history.',`<button class="btn" data-nav="checkoutdesign">Checkout design</button><button class="btn primary" data-action="createDemoOrder">＋ Test order</button>`)}<div class="ops-grid"><section class="card ops-card span-7"><table class="ops-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Fulfillment</th></tr></thead><tbody>${state.orders.map(x=>`<tr style="cursor:pointer" data-action="selectOrder" data-order="${esc2(x.id)}"><td><b>${esc2(x.id)}</b><div class="tiny muted">${esc2(x.created||'Today')}</div></td><td>${esc2(x.customer)}<div class="tiny muted">${esc2(x.email||'')}</div></td><td>${cash(x.total)}</td><td><span class="status-pill ${String(x.status).toLowerCase()}">${esc2(x.status)}</span></td><td>${esc2(x.fulfillment||'Unfulfilled')}</td></tr>`).join('')||'<tr><td colspan="5" class="table-empty">No orders yet. Orders appear here as soon as a customer checks out.</td></tr>'}</tbody></table></section><aside class="card ops-card span-5"><span class="caps">Selected order</span><h2>${esc2(o?.id)}</h2><div class="mini-row"><span>Customer</span><span class="grow"></span><b>${esc2(o?.customer)}</b></div><div class="mini-row"><span>Items</span><span class="grow"></span><b>${o?.items||1}</b></div><div class="mini-row"><span>Total</span><span class="grow"></span><b>${cash(o?.total)}</b></div><div class="field"><label>Payment status</label><select data-order-field="status"><option ${o?.status==='Paid'?'selected':''}>Paid</option><option ${o?.status==='Pending'?'selected':''}>Pending</option><option ${o?.status==='Refunded'?'selected':''}>Refunded</option><option ${o?.status==='Cancelled'?'selected':''}>Cancelled</option></select></div><div class="field"><label>Fulfillment</label><select data-order-field="fulfillment"><option ${o?.fulfillment==='Unfulfilled'?'selected':''}>Unfulfilled</option><option ${o?.fulfillment==='Processing'?'selected':''}>Processing</option><option ${o?.fulfillment==='Fulfilled'?'selected':''}>Fulfilled</option></select></div><button class="btn primary" style="width:100%" data-action="saveOrder">Save order</button><button class="btn" style="width:100%;margin-top:8px" data-action="sendOrderEmail">Preview customer email</button></aside></div>`};

  views.discounts=()=>`${viewHead('Discounts & coupons','Create and manage promotion rules for your store.',`<button class="btn primary" data-action="addDiscount">＋ Coupon</button>`)}<div class="ops-grid"><section class="card ops-card span-8"><table class="ops-table"><thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Minimum</th><th>Uses</th><th>Status</th></tr></thead><tbody>${state.discounts.map(d=>`<tr><td class="coupon-code">${esc2(d.code)}</td><td>${esc2(d.type)}</td><td>${d.type==='Fixed'?cash(d.value):d.value+'%'}</td><td>${cash(d.min)}</td><td>${d.usage}</td><td><button class="btn" data-action="toggleDiscount" data-discount="${d.id}">${d.active?'Active':'Paused'}</button></td></tr>`).join('')||'<tr><td colspan="6" class="table-empty">No coupons yet. Create one to start running promotions.</td></tr>'}</tbody></table></section><aside class="card ops-card span-4"><span class="caps">Promotion logic</span><h3>Stacking rules</h3><div class="mini-row"><span>Automatic best discount</span><span class="grow"></span><span class="pill">On</span></div><div class="mini-row"><span>Stack shipping + product</span><span class="grow"></span><span class="pill">On</span></div><div class="mini-row"><span>Member-only coupons</span><span class="grow"></span><span class="pill">Ready</span></div><p class="tiny muted">Discounts preview instantly here. Connect a payment provider to validate them at checkout.</p></aside></div>`;

  views.shipping=()=>`${viewHead('Shipping & tax','Configure regional delivery rules and tax behavior.',`<button class="btn primary" data-action="addShippingZone">＋ Shipping zone</button>`)}<div class="ops-grid"><section class="card ops-card span-7"><table class="ops-table"><thead><tr><th>Zone</th><th>Coverage</th><th>Method</th><th>Rate</th><th>Tax</th><th>Status</th></tr></thead><tbody>${state.shippingZones.map(z=>`<tr><td><b>${esc2(z.name)}</b><div class="tiny muted">${esc2(z.eta)}</div></td><td>${esc2(z.countries)}</td><td>${esc2(z.method)}</td><td>${cash(z.rate)}</td><td>${z.tax}%</td><td><button class="btn" data-action="toggleZone" data-zone="${z.id}">${z.active?'Active':'Off'}</button></td></tr>`).join('')||'<tr><td colspan="6" class="table-empty">No shipping zones yet. Add a zone to set delivery rates and tax.</td></tr>'}</tbody></table></section><aside class="card ops-card span-5"><span class="caps">Delivery map</span><div class="zone-map" style="margin-top:12px"></div><div class="mini-row"><span>Free shipping threshold</span><span class="grow"></span><b>${cash(state.store?.freeShippingAt||2500)}</b></div><div class="mini-row"><span>Tax included in displayed price</span><span class="grow"></span><span class="pill">Configurable</span></div><button class="btn" style="width:100%" data-nav="store">Back to Store</button></aside></div>`;

  views.checkoutdesign=()=>`${viewHead('Checkout customization','Design your checkout experience. Payment methods appear once a provider is connected.',`<button class="btn" data-nav="store">Store</button>`)}<div class="ops-grid"><section class="card ops-card span-4"><span class="caps">Checkout controls</span><div class="field"><label>Layout</label><select data-checkout-design="layout"><option ${state.checkoutDesign.layout==='Split'?'selected':''}>Split</option><option ${state.checkoutDesign.layout==='Single column'?'selected':''}>Single column</option><option ${state.checkoutDesign.layout==='Minimal'?'selected':''}>Minimal</option></select></div><div class="field"><label>Logo text</label><input data-checkout-design="logo" value="${esc2(state.checkoutDesign.logo)}"/></div><div class="field"><label>Accent</label><input data-checkout-design="accent" type="color" value="${esc2(state.checkoutDesign.accent)}"/></div><div class="mini-row"><span>Express checkout</span><span class="grow"></span><button class="btn" data-action="toggleCheckoutDesign" data-key="express">${state.checkoutDesign.express?'On':'Off'}</button></div><div class="mini-row"><span>Trust row</span><span class="grow"></span><button class="btn" data-action="toggleCheckoutDesign" data-key="showTrust">${state.checkoutDesign.showTrust?'On':'Off'}</button></div><div class="mini-row"><span>Order note</span><span class="grow"></span><button class="btn" data-action="toggleCheckoutDesign" data-key="showOrderNote">${state.checkoutDesign.showOrderNote?'On':'Off'}</button></div><div class="field"><label>Success heading</label><input data-checkout-design="successTitle" value="${esc2(state.checkoutDesign.successTitle)}"/></div></section><section class="card ops-card span-8"><span class="caps">Live checkout preview</span><div class="checkout-preview" style="margin-top:12px"><div class="checkout-left"><div class="checkout-logo">${esc2(state.checkoutDesign.logo)}</div><h2>Checkout</h2>${state.checkoutDesign.express?'<div class="checkout-pay"><div>Express checkout</div></div>':''}<div class="field" style="margin-top:18px"><label>Contact</label><div class="checkout-field"></div></div><div class="field"><label>Delivery</label><div class="checkout-field"></div><div class="checkout-field"></div></div><div class="checkout-pay"><div>Payment method · not connected 🔒</div></div><div class="checkout-cta" style="background:${esc2(state.checkoutDesign.accent)}">Place order</div>${state.checkoutDesign.showTrust?'<p style="font-size:11px;color:#666">Secure checkout · Privacy controls · Order support</p>':''}</div><div class="checkout-right"><span class="caps" style="color:#777">Order summary</span><h3>Sculptural Chair</h3><div class="mini-row" style="border-color:#d7d3c9"><span>Subtotal</span><span class="grow"></span><b>₹12,900</b></div><div class="mini-row" style="border-color:#d7d3c9"><span>Shipping</span><span class="grow"></span><b>Free</b></div><div class="mini-row" style="border-color:#d7d3c9"><span>Total</span><span class="grow"></span><b>₹15,222</b></div></div></div></section></div>`;

  views.notifications=()=>{const em=selectedEmail();return `${viewHead('Email notification templates','Design your transactional emails. Connect a sending provider to deliver them.',`<span class="pill">Delivery provider · not connected</span>`)}<div class="template-editor"><aside class="card ops-card"><span class="caps">Templates</span><div class="stack" style="margin-top:12px">${state.emailTemplates.map(x=>`<button class="btn ${x.id===em?.id?'primary':''}" style="justify-content:flex-start" data-action="selectEmailTemplate" data-email="${x.id}">${esc2(x.name)}</button>`).join('')}</div><button class="btn" style="width:100%;margin-top:10px" data-action="addEmailTemplate">＋ Template</button></aside><section class="card ops-card"><div class="ops-grid"><div class="span-5"><div class="field"><label>Template name</label><input data-email-field="name" value="${esc2(em?.name)}"/></div><div class="field"><label>Trigger</label><input data-email-field="trigger" value="${esc2(em?.trigger)}"/></div><div class="field"><label>Subject</label><input data-email-field="subject" value="${esc2(em?.subject)}"/></div><div class="field"><label>Body</label><textarea data-email-field="body" rows="11">${esc2(em?.body)}</textarea></div><button class="btn primary" data-action="saveEmailTemplate">Save template</button></div><div class="span-7"><div class="email-canvas"><div class="email-inner"><div class="checkout-logo">Scen</div><p class="tiny muted">${esc2(em?.trigger)}</p><h2>${esc2(em?.subject).replace(/\{\{order_id\}\}/g,'#1051').replace(/\{\{booking_time\}\}/g,'16 Aug · 11:30')}</h2><p style="white-space:pre-line;line-height:1.7">${esc2(em?.body).replace(/\{\{customer_name\}\}/g,'[customer_name]').replace(/\{\{order_id\}\}/g,'[order_id]').replace(/\{\{order_total\}\}/g,'[order_total]')}</p><div class="checkout-cta">View details</div></div></div></div></div></section></div>`};

  views.availability=()=>`${viewHead('Booking availability rules','Control when customers can book.',`<button class="btn" data-nav="bookingcalendar">Calendar</button><button class="btn primary" data-action="addBlackout">＋ Blackout date</button>`)}<div class="ops-grid"><section class="card ops-card span-7"><span class="caps">Weekly availability</span><h3>Open days</h3><div class="day-grid">${Object.entries(state.availability.days).map(([d,on])=>`<button class="day-toggle ${on?'active':''}" data-action="toggleAvailabilityDay" data-day="${d}"><b>${d}</b><div class="tiny muted">${on?'Open':'Closed'}</div></button>`).join('')}</div><div class="ops-grid" style="margin-top:15px"><div class="field span-6"><label>Start time</label><input type="time" data-availability="start" value="${state.availability.start}"/></div><div class="field span-6"><label>End time</label><input type="time" data-availability="end" value="${state.availability.end}"/></div><div class="field span-4"><label>Slot minutes</label><input type="number" data-availability="slot" value="${state.availability.slot}"/></div><div class="field span-4"><label>Minimum notice · hrs</label><input type="number" data-availability="minNotice" value="${state.availability.minNotice}"/></div><div class="field span-4"><label>Advance window · days</label><input type="number" data-availability="maxAdvance" value="${state.availability.maxAdvance}"/></div></div></section><aside class="card ops-card span-5"><span class="caps">Blackout dates</span><h3>Unavailable dates</h3>${state.availability.blackouts.map(x=>`<div class="mini-row"><span>◷</span><b>${esc2(x)}</b><span class="grow"></span><button class="btn" data-action="removeBlackout" data-date="${esc2(x)}">Remove</button></div>`).join('')||'<p class="muted">No blackout dates.</p>'}<p class="tiny muted">Google and Outlook calendar sync is not connected yet.</p></aside></div>`;

  views.members=()=>`${viewHead('Membership & gated areas','Create member tiers and private content without external auth/payment providers yet.',`<button class="btn primary" data-action="addMembershipPlan">＋ Membership tier</button>`)}<div class="ops-grid"><section class="card ops-card span-8"><span class="caps">Membership plans</span><div class="ops-grid" style="margin-top:12px">${state.membershipPlans.map((p,i)=>`<div class="span-4 plan-tier ${i===1?'featured':''}"><span class="caps">Tier ${i+1}</span><h3>${esc2(p.name)}</h3><div class="kpi">${p.price?cash(p.price):'Free'} <span class="tiny muted">${esc2(p.interval)}</span></div><p class="small muted">${esc2(p.access)}</p><button class="btn" data-action="toggleMembership" data-plan="${p.id}">${p.active?'Active':'Paused'}</button></div>`).join('')}</div></section><aside class="card ops-card span-4"><span class="caps">Gated pages</span><h3>Private site areas</h3>${state.gatedPages.map(g=>`<div class="mini-row"><div><b>${esc2(g.page)}</b><div class="tiny muted">Requires ${esc2(g.plan)}</div></div><span class="grow"></span><button class="btn" data-action="toggleGatedPage" data-page="${esc2(g.page)}">${g.enabled?'Locked':'Public'}</button></div>`).join('')}<button class="btn" style="width:100%" data-action="addGatedPage">＋ Gate a page</button></aside></div>`;

  views.accounts=()=>`${viewHead('User accounts & favorites','Manage customer/member profiles, access tiers and saved products.',`<button class="btn primary" data-action="addSiteUser">＋ Add member</button>`)}<div class="ops-grid"><section class="card ops-card span-8"><table class="ops-table"><thead><tr><th>User</th><th>Tier</th><th>Orders</th><th>Last active</th><th>Status</th></tr></thead><tbody>${state.siteUsers.map(u=>`<tr><td><div class="row"><span class="avatar">${esc2(u.name).slice(0,1)}</span><div><b>${esc2(u.name)}</b><div class="tiny muted">${esc2(u.email)}</div></div></div></td><td><select data-user-tier="${u.id}">${state.membershipPlans.map(p=>`<option ${p.name===u.tier?'selected':''}>${esc2(p.name)}</option>`).join('')}</select></td><td>${u.orders}</td><td>${esc2(u.last)}</td><td><span class="status-pill active">${esc2(u.status)}</span></td></tr>`).join('')||'<tr><td colspan="5" class="table-empty">No customers yet. Accounts appear here after your first sign-up.</td></tr>'}</tbody></table></section><aside class="card ops-card span-4"><span class="caps">Saved favorites</span><h3>${state.favoriteProductIds.length} products saved</h3><div class="favorite-grid">${state.favoriteProductIds.map(id=>{const p=state.products.find(x=>x.id===id);return p?`<div class="favorite-card"><div class="favorite-art"></div><b>${esc2(p.name)}</b><div class="tiny muted">${cash(p.price)}</div><button class="btn" style="margin-top:8px" data-action="toggleFavorite" data-product="${p.id}">♥ Remove</button></div>`:''}).join('')||'<p class="muted">No favorites yet.</p>'}</div><button class="btn" style="width:100%;margin-top:10px" data-action="addFavoriteDemo">＋ Save a product</button></aside></div>`;

  const handled=new Set(['createDemoOrder','selectOrder','saveOrder','sendOrderEmail','addDiscount','toggleDiscount','addShippingZone','toggleZone','toggleCheckoutDesign','selectEmailTemplate','addEmailTemplate','saveEmailTemplate','toggleAvailabilityDay','addBlackout','removeBlackout','addMembershipPlan','toggleMembership','toggleGatedPage','addGatedPage','addSiteUser','toggleFavorite','addFavoriteDemo']);
  document.addEventListener('click',e=>{
    const a=e.target.closest('[data-action]'); if(!a||!handled.has(a.dataset.action))return; e.preventDefault();e.stopImmediatePropagation();
    const action=a.dataset.action;
    if(action==='createDemoOrder'){const id='#'+(1060+state.orders.length);state.orders.unshift({id,customer:'Test Customer',email:'',items:1,total:12900,status:'Paid',fulfillment:'Unfulfilled',created:'Today · '+now()});state.selectedOrderId=id;state.opsActivity.unshift({time:now(),text:'Test order '+id+' created'});saveOps();render('orders');toast('Test order created');return}
    if(action==='selectOrder'){state.selectedOrderId=a.dataset.order;saveOps();render('orders');return}
    if(action==='saveOrder'){const o=selectedOrder();document.querySelectorAll('[data-order-field]').forEach(el=>o[el.dataset.orderField]=el.value);state.opsActivity.unshift({time:now(),text:'Order '+o.id+' updated'});saveOps();render('orders');toast('Order updated locally');return}
    if(action==='sendOrderEmail'){const o=selectedOrder();modal(`<div class="modal-head"><b>Customer email preview</b><button class="close" data-action="closeModal">×</button></div><div class="modal-body"><div class="email-canvas"><div class="email-inner"><span class="caps">Preview only</span><h2>Order ${esc2(o.id)} update</h2><p>Hi ${esc2(o.customer)}, your order status is <b>${esc2(o.status)}</b> and fulfillment is <b>${esc2(o.fulfillment)}</b>.</p><p class="tiny muted">Preview only — connect a sending provider to email customers.</p></div></div></div>`);return}
    if(action==='addDiscount'){state.discounts.unshift({id:'dc'+Date.now(),code:'NEW'+(state.discounts.length+1)+'0',type:'Percent',value:10,usage:0,active:true,min:1000});saveOps();render('discounts');toast('Coupon created');return}
    if(action==='toggleDiscount'){const d=state.discounts.find(x=>x.id===a.dataset.discount);if(d)d.active=!d.active;saveOps();render('discounts');return}
    if(action==='addShippingZone'){state.shippingZones.push({id:'sz'+Date.now(),name:'New Zone',countries:'Custom region',method:'Standard',rate:199,eta:'3–7 days',tax:18,active:true});saveOps();render('shipping');toast('Shipping zone added');return}
    if(action==='toggleZone'){const z=state.shippingZones.find(x=>x.id===a.dataset.zone);if(z)z.active=!z.active;saveOps();render('shipping');return}
    if(action==='toggleCheckoutDesign'){const k=a.dataset.key;state.checkoutDesign[k]=!state.checkoutDesign[k];saveOps();render('checkoutdesign');return}
    if(action==='selectEmailTemplate'){state.selectedEmailId=a.dataset.email;saveOps();render('notifications');return}
    if(action==='addEmailTemplate'){const id='em'+Date.now();state.emailTemplates.push({id,name:'New notification',trigger:'Custom event',subject:'A new update from {{site_name}}',body:'Hi {{customer_name}},\n\nHere is your latest update.'});state.selectedEmailId=id;saveOps();render('notifications');return}
    if(action==='saveEmailTemplate'){const em=selectedEmail();document.querySelectorAll('[data-email-field]').forEach(el=>em[el.dataset.emailField]=el.value);saveOps();render('notifications');toast('Email template saved');return}
    if(action==='toggleAvailabilityDay'){const d=a.dataset.day;state.availability.days[d]=!state.availability.days[d];saveOps();render('availability');return}
    if(action==='addBlackout'){const d='2026-08-'+String(21+state.availability.blackouts.length).padStart(2,'0');if(!state.availability.blackouts.includes(d))state.availability.blackouts.push(d);saveOps();render('availability');toast('Blackout date added');return}
    if(action==='removeBlackout'){state.availability.blackouts=state.availability.blackouts.filter(x=>x!==a.dataset.date);saveOps();render('availability');return}
    if(action==='addMembershipPlan'){state.membershipPlans.push({id:'mp'+Date.now(),name:'New Tier',price:999,interval:'/ month',access:'Private content access',active:true});saveOps();render('members');return}
    if(action==='toggleMembership'){const p=state.membershipPlans.find(x=>x.id===a.dataset.plan);if(p)p.active=!p.active;saveOps();render('members');return}
    if(action==='toggleGatedPage'){const g=state.gatedPages.find(x=>x.page===a.dataset.page);if(g)g.enabled=!g.enabled;saveOps();render('members');return}
    if(action==='addGatedPage'){state.gatedPages.push({page:'Members Page '+(state.gatedPages.length+1),plan:state.membershipPlans[1]?.name||'Free Member',enabled:true});saveOps();render('members');return}
    if(action==='addSiteUser'){state.siteUsers.unshift({id:'u'+Date.now(),name:'New Member',email:'member@example.com',tier:state.membershipPlans[0]?.name||'Free Member',status:'Active',orders:0,last:'Just now'});saveOps();render('accounts');return}
    if(action==='toggleFavorite'){const id=a.dataset.product;state.favoriteProductIds=state.favoriteProductIds.includes(id)?state.favoriteProductIds.filter(x=>x!==id):[...state.favoriteProductIds,id];saveOps();render('accounts');return}
    if(action==='addFavoriteDemo'){const p=state.products.find(x=>!state.favoriteProductIds.includes(x.id));if(p)state.favoriteProductIds.push(p.id);saveOps();render('accounts');return}
  },true);

  document.addEventListener('input',e=>{
    const cd=e.target.closest('[data-checkout-design]');if(cd){state.checkoutDesign[cd.dataset.checkoutDesign]=cd.value;saveOps();render('checkoutdesign');return}
    const av=e.target.closest('[data-availability]');if(av){state.availability[av.dataset.availability]=av.type==='number'?+av.value:av.value;saveOps();return}
  },true);
  document.addEventListener('change',e=>{
    const ut=e.target.closest('[data-user-tier]');if(ut){const u=state.siteUsers.find(x=>x.id===ut.dataset.userTier);if(u)u.tier=ut.value;saveOps();return}
  },true);

  saveOps();
})();



// === Production readiness flow ===
(()=>{
  const safe=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const ping=t=>{try{toast(t)}catch(e){console.log(t)}};
  const ts=()=>new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  const seed=(k,v)=>{if(state[k]===undefined||state[k]===null)state[k]=v};
  seed('activityFilter','All');
  seed('activityNotifications',[]);
  seed('rolePermissions',{
    Owner:{editSite:true,publish:true,store:true,members:true,billing:true,invite:true,analytics:true,security:true},
    Admin:{editSite:true,publish:true,store:true,members:true,billing:false,invite:true,analytics:true,security:true},
    Editor:{editSite:true,publish:false,store:true,members:false,billing:false,invite:false,analytics:true,security:false},
    Reviewer:{editSite:false,publish:false,store:false,members:false,billing:false,invite:false,analytics:true,security:false},
    Viewer:{editSite:false,publish:false,store:false,members:false,billing:false,invite:false,analytics:false,security:false}
  });
  seed('securitySettings',{mfa:false,passkeys:false,loginAlerts:true,sessionTimeout:'30 days'});
  seed('sessions',[]);
  seed('auditLogs',[]);
  seed('auditQuery','');
  seed('assets',[
    {id:'as1',name:'hero-residences.webp',type:'Image',kb:1640,optimized:false,lazy:false},
    {id:'as2',name:'lobby-loop.mp4',type:'Video',kb:6820,optimized:false,lazy:true},
    {id:'as3',name:'material-stone.webp',type:'Image',kb:740,optimized:true,lazy:true},
    {id:'as4',name:'gallery-04.webp',type:'Image',kb:1180,optimized:false,lazy:true},
    {id:'as5',name:'brand-serif.woff2',type:'Font',kb:184,optimized:true,lazy:false}
  ]);
  seed('perfSettings',{preloadHero:true,reducedMotionFallback:true,smartLazy:true});
  seed('runtimeIssues',[]);
  seed('supportTickets',[
    {id:'T-104',subject:'Mobile hero spacing review',type:'Feedback',priority:'Normal',status:'Open',updated:'Today'},
    {id:'T-103',subject:'Client wants alternate gallery motion',type:'Feature',priority:'Low',status:'Resolved',updated:'Yesterday'}
  ]);
  seed('tourTasks',[
    {id:'t1',label:'Create your first project',route:'projects',done:true},
    {id:'t2',label:'Edit the 3D canvas',route:'builder',done:true},
    {id:'t3',label:'Configure forms & CMS',route:'forms',done:true},
    {id:'t4',label:'Set up store / bookings',route:'store',done:true},
    {id:'t5',label:'Review accessibility',route:'accessibility',done:false},
    {id:'t6',label:'Run production QA',route:'production',done:false},
    {id:'t7',label:'Connect APIs',route:'integrations',done:false,deferred:true}
  ]);
  seed('launchManual',{legal:false,content:true,client:false});
  const persist=()=>saveState();
  const unread=()=>state.activityNotifications.filter(n=>!n.read).length;
  const perfScore=()=>{const total=state.assets.reduce((a,x)=>a+x.kb,0);const optimized=state.assets.filter(x=>x.optimized).length;return Math.max(58,Math.min(99,Math.round(63+optimized/state.assets.length*25-(total>9000?5:0))))};
  const unresolved=()=>state.runtimeIssues.filter(x=>x.status!=='Resolved').length;
  const filteredNotices=()=>state.activityNotifications.filter(n=>state.activityFilter==='All'||n.type===state.activityFilter);
  const auditFiltered=()=>{const q=String(state.auditQuery||'').toLowerCase();return state.auditLogs.filter(x=>!q||[x.actor,x.action,x.target,x.risk].join(' ').toLowerCase().includes(q))};
  const launchChecks=()=>[
    {name:'Pages & navigation',ok:(state.pages||[]).length>0,detail:`${(state.pages||[]).length||0} pages configured`},
    {name:'Responsive design',ok:true,detail:'Desktop, tablet and mobile overrides ready'},
    {name:'Forms & CMS',ok:(state.forms||[]).length>0,detail:`${(state.forms||[]).length||0} forms · ${(state.cmsCollections||[]).length||0} collections`},
    {name:'Commerce / bookings',ok:(state.products||[]).length>0||(state.bookingServices||[]).length>0,detail:'Business flows configured'},
    {name:'Accessibility review',ok:(state.accessibility?.altWarnings||0)<=1,detail:`${state.accessibility?.altWarnings||0} alt-text warnings`},
    {name:'Runtime monitoring',ok:unresolved()===0,detail:`${unresolved()} unresolved issues`},
    {name:'Backup',ok:(state.backups||[]).length>0,detail:(state.backups||[]).length?'Snapshot available':'Create a project backup'},
    {name:'Legal review',ok:!!state.launchManual.legal,detail:'Terms, privacy and business copy sign-off'},
    {name:'Content sign-off',ok:!!state.launchManual.content,detail:'Final copy and media review'},
    {name:'Client approval',ok:!!state.launchManual.client,detail:'Stakeholder approval before launch'},
    {name:'API providers',ok:true,deferred:true,detail:'Intentionally deferred to LAST PHASE'}
  ];
  const launchScore=()=>{const c=launchChecks().filter(x=>!x.deferred);return Math.round(c.filter(x=>x.ok).length/c.length*100)};

  views.activity=()=>`${viewHead('Notification center','One inbox for publishing, orders, bookings, team activity and system events.',`<button class="btn" data-action="markAllRead">Mark all read</button>`)}<div class="ops-ready-grid"><section class="card ops-ready-card span-8"><div class="row"><div class="activity-filter">${['All','Publish','Store','Booking','Team','System'].map(x=>`<button class="btn ${state.activityFilter===x?'active':''}" data-action="filterActivity" data-filter="${x}">${x}</button>`).join('')}</div><span class="grow"></span><span class="status-chip ${unread()?'warn':'good'}">${unread()} unread</span></div><div style="margin-top:12px">${filteredNotices().map(n=>`<div class="notice-row ${n.read?'read':''}" data-action="toggleNotice" data-notice="${n.id}" style="cursor:pointer"><span class="notice-dot"></span><div><b>${safe(n.title)}</b><div class="small muted">${safe(n.detail)}</div></div><span class="grow"></span><div style="text-align:right"><span class="status-chip">${safe(n.type)}</span><div class="tiny muted" style="margin-top:5px">${safe(n.time)}</div></div></div>`).join('')}</div></section><aside class="card ops-ready-card span-4"><span class="caps">Delivery rules</span><h3>Notification preferences</h3><div class="mini-row"><span>Publishing</span><span class="grow"></span><button class="switch on"></button></div><div class="mini-row"><span>Orders & bookings</span><span class="grow"></span><button class="switch on"></button></div><div class="mini-row"><span>Security alerts</span><span class="grow"></span><button class="switch on"></button></div><div class="mini-row"><span>Weekly summary</span><span class="grow"></span><button class="switch"></button></div><p class="tiny muted">In-app activity is live. Connect a provider for email and push delivery.</p></aside></div>`;

  views.roles=()=>{const roles=['Owner','Admin','Editor','Reviewer','Viewer'];const rows=[['editSite','Edit website'],['publish','Publish'],['store','Manage store'],['members','Manage members'],['billing','Billing'],['invite','Invite team'],['analytics','View analytics'],['security','Security settings']];return `${viewHead('Roles & permissions','Control exactly what each workspace role can do.',`<button class="btn" data-nav="team">Team members</button>`)}<div class="card ops-ready-card"><div class="perm-matrix"><table><thead><tr><th>Permission</th>${roles.map(r=>`<th>${r}</th>`).join('')}</tr></thead><tbody>${rows.map(([k,label])=>`<tr><td><b>${label}</b></td>${roles.map(r=>`<td><button class="perm-toggle ${state.rolePermissions[r]?.[k]?'on':''}" ${r==='Owner'?'disabled':''} data-action="togglePermission" data-role="${r}" data-perm="${k}">${state.rolePermissions[r]?.[k]?'✓':'—'}</button></td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="tiny muted" style="margin-top:12px">Owner permissions are fixed. API-scoped permissions will be added only when providers are connected.</p></div>`};

  views.security=()=>`${viewHead('Security center','Sessions, login protection and workspace security controls.',`<button class="btn" data-action="revokeOtherSessions">Sign out other sessions</button>`)}<div class="ops-ready-grid"><section class="card ops-ready-card span-7"><span class="caps">Active sessions</span><h3>Devices signed in</h3>${state.sessions.map(s=>`<div class="session-row ${s.current?'session-current':''}"><div><b>${safe(s.device)}</b><div class="tiny muted">${safe(s.location)} · ${safe(s.last)}</div></div><span class="grow"></span>${s.current?'<span class="status-chip good">Current</span>':`<button class="btn" data-action="revokeSession" data-session="${s.id}">Revoke</button>`}</div>`).join('')}</section><aside class="card ops-ready-card span-5"><span class="caps">Login protection</span><h3>Authentication policy</h3>${[['mfa','Two-factor authentication'],['passkeys','Passkeys'],['loginAlerts','New-device login alerts']].map(([k,l])=>`<div class="mini-row"><div><b>${l}</b><div class="tiny muted">${k==='mfa'?'Recommended for owners/admins':k==='passkeys'?'Provider-ready UI':'In-app alert now'}</div></div><span class="grow"></span><button class="switch ${state.securitySettings[k]?'on':''}" data-action="toggleSecurity" data-security="${k}"></button></div>`).join('')}<div class="field" style="margin-top:12px"><label>Session timeout</label><select data-security-select="sessionTimeout"><option ${state.securitySettings.sessionTimeout==='7 days'?'selected':''}>7 days</option><option ${state.securitySettings.sessionTimeout==='30 days'?'selected':''}>30 days</option><option ${state.securitySettings.sessionTimeout==='90 days'?'selected':''}>90 days</option></select></div><p class="tiny muted">Real MFA/passkey verification is connected in the final auth-provider phase.</p></aside></div>`;

  views.auditlogs=()=>`${viewHead('Audit logs','Trace publishing, admin, team, billing and security changes.',`<button class="btn" data-action="addAuditEvent">＋ Demo event</button>`)}<div class="card ops-ready-card"><div class="search-inline"><input id="auditSearch" value="${safe(state.auditQuery)}" placeholder="Search actor, action, target or risk…"/><button class="btn" data-action="runAuditSearch">Search</button><button class="btn" data-action="clearAuditSearch">Clear</button></div><div style="margin-top:14px">${auditFiltered().map(x=>`<div class="audit-row"><div style="min-width:110px"><b>${safe(x.actor)}</b><div class="tiny muted">${safe(x.time)}</div></div><div><b>${safe(x.action)}</b><div class="small muted">${safe(x.target)}</div></div><span class="grow"></span><span class="status-chip ${x.risk==='High'?'bad':x.risk==='Medium'?'warn':'good'}"><span class="risk-${x.risk.toLowerCase()}">${safe(x.risk)} risk</span></span></div>`).join('')||'<p class="muted">No matching events.</p>'}</div></div>`;

  views.performance=()=>{const total=state.assets.reduce((a,x)=>a+x.kb,0);return `${viewHead('Performance & asset optimizer','Reduce payload, improve LCP and prepare every media asset for production.',`<button class="btn primary" data-action="optimizeAllAssets">Optimize all</button>`)}<div class="ops-ready-grid"><div class="card ops-ready-card span-3"><span class="caps">Performance</span><div class="ready-kpi">${perfScore()}</div><div class="tiny muted">estimated score</div></div><div class="card ops-ready-card span-3"><span class="caps">Payload</span><div class="ready-kpi">${(total/1024).toFixed(1)} MB</div><div class="tiny muted">project assets</div></div><div class="card ops-ready-card span-3"><span class="caps">Optimized</span><div class="ready-kpi">${state.assets.filter(x=>x.optimized).length}/${state.assets.length}</div><div class="tiny muted">assets</div></div><div class="card ops-ready-card span-3"><span class="caps">Lazy loaded</span><div class="ready-kpi">${state.assets.filter(x=>x.lazy).length}</div><div class="tiny muted">eligible assets</div></div><section class="card ops-ready-card span-8"><span class="caps">Asset health</span>${state.assets.map(a=>`<div class="asset-row"><div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(145deg,#2a2a34,#111118);display:grid;place-items:center">${a.type==='Video'?'▶':a.type==='Font'?'Aa':'▧'}</div><div><b>${safe(a.name)}</b><div class="tiny muted">${a.type} · ${(a.kb/1024).toFixed(a.kb>1024?1:2)} ${a.kb>1024?'MB':'MB'} · ${a.lazy?'lazy':'eager'}</div></div><span class="grow"></span><span class="status-chip ${a.optimized?'good':'warn'}">${a.optimized?'Optimized':'Needs work'}</span><button class="btn" data-action="optimizeAsset" data-asset="${a.id}">${a.optimized?'Recheck':'Optimize'}</button></div>`).join('')}</section><aside class="card ops-ready-card span-4"><span class="caps">Loading policy</span><h3>Smart delivery</h3>${[['preloadHero','Preload hero media'],['reducedMotionFallback','Reduced-motion fallback'],['smartLazy','Smart lazy loading']].map(([k,l])=>`<div class="mini-row"><span>${l}</span><span class="grow"></span><button class="switch ${state.perfSettings[k]?'on':''}" data-action="togglePerf" data-perf="${k}"></button></div>`).join('')}<div class="asset-meter" style="margin:14px 0"><i style="width:${perfScore()}%"></i></div><p class="small muted">Optimization runs locally. Connect a media CDN for production delivery.</p></aside></div>`};

  views.monitoring=()=>`${viewHead('Error & 404 monitor','Track broken routes, runtime warnings and production-quality issues before launch.',`<button class="btn" data-action="simulateIssue">＋ Simulate issue</button>`)}<div class="ops-ready-grid"><section class="card ops-ready-card span-8"><div class="row"><div><span class="caps">Runtime issues</span><h3 style="margin:5px 0">${unresolved()} unresolved</h3></div><span class="grow"></span><span class="status-chip ${unresolved()?'warn':'good'}">${unresolved()?'Needs review':'All clear'}</span></div>${state.runtimeIssues.map(x=>`<div class="error-row ${x.status==='Resolved'?'read':''}"><div><b>${safe(x.message)}</b><div class="tiny muted">${safe(x.route)} · ${x.count} occurrences · ${safe(x.last)}</div></div><span class="grow"></span><span class="status-chip ${x.severity==='High'?'bad':x.severity==='Medium'?'warn':'good'}">${safe(x.severity)}</span><button class="btn" data-action="toggleIssue" data-issue="${x.id}">${x.status==='Resolved'?'Reopen':'Resolve'}</button></div>`).join('')}</section><aside class="card ops-ready-card span-4"><span class="caps">Monitoring policy</span><h3>Launch thresholds</h3><div class="mini-row"><span>Unresolved errors</span><span class="grow"></span><b>${unresolved()}</b></div><div class="mini-row"><span>404 redirects</span><span class="grow"></span><b>${(state.redirects||[]).length}</b></div><div class="mini-row"><span>Performance score</span><span class="grow"></span><b>${perfScore()}</b></div><button class="btn" style="width:100%;margin-top:10px" data-nav="redirects">Open Redirect Manager</button></aside></div>`;

  views.support=()=>`${viewHead('Support & feedback','Capture bugs, feedback and feature requests before external helpdesk integration.',`<button class="btn primary" data-action="createSupportTicket">＋ New ticket</button>`)}<div class="ops-ready-grid"><section class="card ops-ready-card span-8"><span class="caps">Tickets</span>${state.supportTickets.map(t=>`<div class="ticket-row"><div><b>${safe(t.id)} · ${safe(t.subject)}</b><div class="tiny muted">${safe(t.type)} · ${safe(t.updated)}</div></div><span class="grow"></span><span class="status-chip ${t.priority==='High'?'bad':t.priority==='Normal'?'warn':'good'}">${safe(t.priority)}</span><button class="btn" data-action="toggleTicket" data-ticket="${t.id}">${t.status==='Resolved'?'Reopen':'Resolve'}</button></div>`).join('')}</section><aside class="card ops-ready-card span-4"><span class="caps">Feedback inbox</span><h3>What should improve?</h3><div class="field"><label>Type</label><select id="feedbackType"><option>Bug</option><option>Feature request</option><option>Design feedback</option></select></div><div class="field"><label>Message</label><textarea id="feedbackText" rows="5" placeholder="Describe the issue or idea…"></textarea></div><button class="btn primary" style="width:100%" data-action="submitFeedback">Save feedback</button><p class="tiny muted">External support desk/email routing stays disconnected until API phase.</p></aside></div>`;

  views.onboardingcenter=()=>{const core=state.tourTasks.filter(x=>!x.deferred);const done=core.filter(x=>x.done).length;const pct=Math.round(done/core.length*100);return `${viewHead('Product tour & onboarding','A guided path through the complete product tree.',`<button class="btn" data-action="resetProductTour">Reset tour</button>`)}<div class="ops-ready-grid"><aside class="card ops-ready-card span-4"><span class="caps">Onboarding progress</span><div class="tour-progress">${pct}%</div><div class="launch-meter"><i style="width:${pct}%"></i></div><p class="small muted">${done} of ${core.length} core steps complete. API connection is intentionally excluded.</p></aside><section class="card ops-ready-card span-8"><span class="caps">Guided checklist</span>${state.tourTasks.map(t=>`<div class="tour-row"><div class="launch-icon ${t.done?'ok':t.deferred?'defer':''}">${t.done?'✓':t.deferred?'⌁':'○'}</div><div><b>${safe(t.label)}</b><div class="tiny muted">${t.deferred?'LAST PHASE · not part of current completion':'Open module and mark complete when reviewed'}</div></div><span class="grow"></span>${t.deferred?'<span class="status-chip">Deferred</span>':`<button class="btn" data-action="tourGo" data-task="${t.id}">${t.done?'Review':'Open'} →</button><button class="btn" data-action="toggleTourTask" data-task="${t.id}">${t.done?'Undo':'Done'}</button>`}</div>`).join('')}</section></div>`};

  views.launchcheck=()=>{const checks=launchChecks(),score=launchScore();return `${viewHead('Final launch checklist','One place to verify product, business, performance, security and content readiness.',`<button class="btn" data-nav="production">Production dashboard</button><button class="btn primary" data-action="runMasterQA">Run master QA</button>`)}<div class="ops-ready-grid"><aside class="card ops-ready-card span-4"><span class="caps">Core readiness</span><div class="tour-progress">${score}</div><div class="launch-meter"><i style="width:${score}%"></i></div><h3>${score===100?'Ready for API phase':score>=80?'Almost launch-ready':'Review remaining items'}</h3><p class="small muted">API credentials are not included in this score and remain intentionally locked.</p></aside><section class="card ops-ready-card span-8">${checks.map(x=>`<div class="launch-check"><div class="launch-icon ${x.deferred?'defer':x.ok?'ok':''}">${x.deferred?'⌁':x.ok?'✓':'○'}</div><div><b>${safe(x.name)}</b><div class="tiny muted">${safe(x.detail)}</div></div><span class="grow"></span>${['Legal review','Content sign-off','Client approval'].includes(x.name)?`<button class="btn" data-action="toggleLaunchManual" data-launch="${x.name==='Legal review'?'legal':x.name==='Content sign-off'?'content':'client'}">${x.ok?'Reopen':'Approve'}</button>`:`<span class="status-chip ${x.deferred?'':x.ok?'good':'warn'}">${x.deferred?'LAST PHASE':x.ok?'Pass':'Review'}</span>`}</div>`).join('')}<div class="row" style="margin-top:16px"><button class="btn" data-nav="performance">Performance</button><button class="btn" data-nav="security">Security</button><button class="btn" data-nav="monitoring">Errors</button><span class="grow"></span><button class="btn primary" data-nav="integrations">API phase 🔒</button></div></section></div>`};

  const actions=new Set(['markAllRead','filterActivity','toggleNotice','togglePermission','revokeSession','revokeOtherSessions','toggleSecurity','runAuditSearch','clearAuditSearch','addAuditEvent','optimizeAsset','optimizeAllAssets','togglePerf','simulateIssue','toggleIssue','createSupportTicket','toggleTicket','submitFeedback','resetProductTour','tourGo','toggleTourTask','toggleLaunchManual','runMasterQA']);
  document.addEventListener('click',e=>{
    const a=e.target.closest('[data-action]');if(!a||!actions.has(a.dataset.action))return;e.preventDefault();e.stopImmediatePropagation();const act=a.dataset.action;
    if(act==='markAllRead'){state.activityNotifications.forEach(n=>n.read=true);persist();render('activity');ping('All notifications marked read');return}
    if(act==='filterActivity'){state.activityFilter=a.dataset.filter;persist();render('activity');return}
    if(act==='toggleNotice'){const n=state.activityNotifications.find(x=>x.id===a.dataset.notice);if(n)n.read=!n.read;persist();render('activity');return}
    if(act==='togglePermission'){const r=a.dataset.role,k=a.dataset.perm;if(r!=='Owner'){state.rolePermissions[r][k]=!state.rolePermissions[r][k];state.auditLogs.unshift({id:'a'+Date.now(),actor:(state.userName||'You'),action:'Permission changed',target:`${r} · ${k}`,time:'Today · '+ts(),risk:'Medium'});persist();render('roles')}return}
    if(act==='revokeSession'){state.sessions=state.sessions.filter(x=>x.id!==a.dataset.session);state.auditLogs.unshift({id:'a'+Date.now(),actor:(state.userName||'You'),action:'Session revoked',target:a.dataset.session,time:'Today · '+ts(),risk:'Medium'});persist();render('security');ping('Session revoked');return}
    if(act==='revokeOtherSessions'){state.sessions=state.sessions.filter(x=>x.current);persist();render('security');ping('Other sessions signed out');return}
    if(act==='toggleSecurity'){const k=a.dataset.security;state.securitySettings[k]=!state.securitySettings[k];state.auditLogs.unshift({id:'a'+Date.now(),actor:(state.userName||'You'),action:'Security setting changed',target:k,time:'Today · '+ts(),risk:'Medium'});persist();render('security');return}
    if(act==='runAuditSearch'){state.auditQuery=document.querySelector('#auditSearch')?.value||'';persist();render('auditlogs');return}
    if(act==='clearAuditSearch'){state.auditQuery='';persist();render('auditlogs');return}
    if(act==='addAuditEvent'){state.auditLogs.unshift({id:'a'+Date.now(),actor:'System',action:'Production QA executed',target:state.projectName||'Current project',time:'Today · '+ts(),risk:'Low'});persist();render('auditlogs');return}
    if(act==='optimizeAsset'){const x=state.assets.find(v=>v.id===a.dataset.asset);if(x){x.optimized=true;x.kb=Math.max(80,Math.round(x.kb*.64));if(x.type!=='Font')x.lazy=x.name.includes('hero')?false:true}persist();render('performance');ping('Asset optimized locally');return}
    if(act==='optimizeAllAssets'){state.assets.forEach(x=>{if(!x.optimized)x.kb=Math.max(80,Math.round(x.kb*.64));x.optimized=true;if(x.type!=='Font'&&!x.name.includes('hero'))x.lazy=true});persist();render('performance');ping('All assets optimized');return}
    if(act==='togglePerf'){state.perfSettings[a.dataset.perf]=!state.perfSettings[a.dataset.perf];persist();render('performance');return}
    if(act==='simulateIssue'){state.runtimeIssues.unshift({id:'er'+Date.now(),route:'/preview/'+state.runtimeIssues.length,message:'Demo runtime warning',count:1,status:'Open',severity:'Low',last:'Just now'});persist();render('monitoring');return}
    if(act==='toggleIssue'){const x=state.runtimeIssues.find(v=>v.id===a.dataset.issue);if(x)x.status=x.status==='Resolved'?'Open':'Resolved';persist();render('monitoring');return}
    if(act==='createSupportTicket'){state.supportTickets.unshift({id:'T-'+(105+state.supportTickets.length),subject:'New workspace request',type:'Feedback',priority:'Normal',status:'Open',updated:'Just now'});persist();render('support');return}
    if(act==='toggleTicket'){const t=state.supportTickets.find(x=>x.id===a.dataset.ticket);if(t)t.status=t.status==='Resolved'?'Open':'Resolved';persist();render('support');return}
    if(act==='submitFeedback'){const text=document.querySelector('#feedbackText')?.value?.trim();if(!text){ping('Add feedback first');return}state.supportTickets.unshift({id:'T-'+(105+state.supportTickets.length),subject:text.slice(0,55),type:document.querySelector('#feedbackType')?.value||'Feedback',priority:'Normal',status:'Open',updated:'Just now'});persist();render('support');ping('Feedback saved');return}
    if(act==='resetProductTour'){state.tourTasks.forEach((x,i)=>{if(!x.deferred)x.done=i<2});persist();render('onboardingcenter');return}
    if(act==='tourGo'){const t=state.tourTasks.find(x=>x.id===a.dataset.task);if(t)navigate(t.route);return}
    if(act==='toggleTourTask'){const t=state.tourTasks.find(x=>x.id===a.dataset.task);if(t&&!t.deferred)t.done=!t.done;persist();render('onboardingcenter');return}
    if(act==='toggleLaunchManual'){const k=a.dataset.launch;state.launchManual[k]=!state.launchManual[k];persist();render('launchcheck');return}
    if(act==='runMasterQA'){state.auditLogs.unshift({id:'a'+Date.now(),actor:'System',action:'Master launch QA executed',target:`Score ${launchScore()}`,time:'Today · '+ts(),risk:'Low'});persist();render('launchcheck');ping('Master QA complete');return}
  },true);
  document.addEventListener('change',e=>{const s=e.target.closest('[data-security-select]');if(s){state.securitySettings[s.dataset.securitySelect]=s.value;persist();return}},true);
  persist();
})();



// === Builder Power Tools / UX polish ===
(()=>{
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const nowLabel=()=>new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  const persist=()=>{try{localStorage.setItem('scenspace3d_state',JSON.stringify(state))}catch(e){}};
  const seed=(k,v)=>{if(state[k]===undefined||state[k]===null)state[k]=v};
  seed('designTokens',{colors:{primary:'#7d6cff',accent:'#dfff45',surface:'#0d0d12',canvas:'#f4f0df',text:'#111111',muted:'#8d8d99'},radius:{sm:10,md:18,lg:28,pill:999},spacing:{xs:6,sm:10,md:16,lg:24,xl:36},type:{display:64,h1:48,h2:34,body:16,small:13},shadow:{soft:24,deep:60}});
  seed('componentVariants',[
    {id:'hero-v1',component:'Hero',name:'Editorial Split',status:'Default',radius:28,accent:'#dfff45',density:'Airy'},
    {id:'hero-v2',component:'Hero',name:'Spatial Poster',status:'Alt',radius:14,accent:'#7beeff',density:'Compact'},
    {id:'btn-v1',component:'Button',name:'Acid Pill',status:'Default',radius:999,accent:'#dfff45',density:'Normal'},
    {id:'card-v1',component:'Card',name:'Glass Depth',status:'Default',radius:24,accent:'#7d6cff',density:'Airy'}
  ]);
  seed('selectedVariant','hero-v1');
  seed('motionCurve',{preset:'Cinematic',x1:.22,y1:.78,x2:.18,y2:1,duration:1.2,keyframes:[0,28,64,100]});
  seed('breakpoints',[
    {id:'desktop',name:'Desktop',width:1440,enabled:true},
    {id:'laptop',name:'Laptop',width:1200,enabled:true},
    {id:'tablet',name:'Tablet',width:834,enabled:true},
    {id:'mobile',name:'Mobile',width:390,enabled:true}
  ]);
  seed('selectedBreakpoint','desktop');
  seed('autosaveEnabled',true);seed('autosaveInterval',3);seed('lastSavedAt',Date.now());seed('recoverySnapshots',[]);seed('offlineEdits',0);
  seed('shortcutHints',true);

  // Sync central tokens with existing brand defaults without removing the older Brand Kit.
  state.brand=state.brand||{};
  state.brand.primary=state.designTokens.colors.primary;state.brand.accent=state.designTokens.colors.accent;state.brand.background=state.designTokens.colors.canvas;state.brand.text=state.designTokens.colors.text;state.brand.radius=state.designTokens.radius.md;

  const originalNavigate=navigate;
  window.navigate=function(route){originalNavigate(route);updateUxChrome();};
  const originalRender=render;
  window.render=function(route){originalRender(route);updateUxChrome();};

  function updateUxChrome(){
    const bar=document.querySelector('#uxStatusbar');if(!bar)return;
    const appVisible=state.route!=='marketing'&&state.route!=='auth';bar.classList.toggle('hidden',!appVisible);
    updateNetwork();updateSaveUi('saved');
  }
  function updateNetwork(){const el=document.querySelector('#networkLabel'),dot=document.querySelector('#saveDot');if(!el||!dot)return;const online=navigator.onLine!==false;el.textContent=online?'Online':'Offline · local edits';dot.classList.toggle('offline',!online)}
  function updateSaveUi(mode='saved'){
    const label=document.querySelector('#saveLabel'),dot=document.querySelector('#saveDot');if(!label||!dot)return;
    dot.classList.toggle('saving',mode==='saving');
    if(mode==='saving')label.textContent='Saving…';else label.textContent=`Saved ${nowLabel()}`;
  }
  function snapshotRecovery(reason='Autosave'){
    const snap={id:Date.now(),reason,time:new Date().toLocaleString(),route:state.route,projectName:state.projectName,heroTitle:state.heroTitle,pages:state.pages?JSON.parse(JSON.stringify(state.pages)):[],components:[...(state.components||[])],tokens:JSON.parse(JSON.stringify(state.designTokens||{}))};
    state.recoverySnapshots.unshift(snap);state.recoverySnapshots=state.recoverySnapshots.slice(0,8);state.lastSavedAt=Date.now();persist();updateSaveUi('saved');
  }
  let saveTimer=null;
  function scheduleAutosave(reason='Edit'){
    if(!state.autosaveEnabled)return;updateSaveUi('saving');clearTimeout(saveTimer);saveTimer=setTimeout(()=>snapshotRecovery(reason),Math.max(650,(+state.autosaveInterval||3)*350));
  }
  window.addEventListener('online',()=>{updateNetwork();if(state.offlineEdits){snapshotRecovery('Recovered offline edits');state.offlineEdits=0;persist();}try{toast('Back online · local edits preserved')}catch(e){}});
  window.addEventListener('offline',()=>{updateNetwork();try{toast('Offline mode · edits stay on this device')}catch(e){}});
  document.addEventListener('input',()=>{if(navigator.onLine===false)state.offlineEdits=(state.offlineEdits||0)+1;scheduleAutosave('Editor change')},true);
  document.addEventListener('change',()=>scheduleAutosave('Setting change'),true);
  document.addEventListener('click',e=>{if(e.target.closest('[data-action],[data-nav]'))scheduleAutosave('Action')},true);
  setInterval(()=>{if(state.autosaveEnabled&&Date.now()-state.lastSavedAt>Math.max(5000,(+state.autosaveInterval||3)*1000))snapshotRecovery('Timed autosave')},3000);

  const commands=[
    {icon:'⌂',title:'Open Dashboard',sub:'Workspace overview',route:'dashboard',keys:['G','D']},
    {icon:'✦',title:'Create New Website',sub:'Start AI website flow',route:'create',keys:['N']},
    {icon:'◈',title:'Open Builder',sub:'Edit current spatial website',route:'builder',keys:['B']},
    {icon:'▦',title:'Templates',sub:'Browse starting points',route:'templates',keys:['T']},
    {icon:'⌘',title:'Command Center',sub:'Keyboard shortcuts and navigation',route:'commandcenter',keys:['⌘','K']},
    {icon:'↻',title:'Autosave & Recovery',sub:'Restore local project snapshots',route:'recovery',keys:['⌘','S']},
    {icon:'◈',title:'Design Tokens',sub:'Global color, type and spacing system',route:'designtokens',keys:['D']},
    {icon:'▦',title:'Component Variants',sub:'Reusable visual variants',route:'variants',keys:['V']},
    {icon:'〽',title:'Motion Lab',sub:'Curves and keyframes',route:'motionlab',keys:['M']},
    {icon:'▣',title:'Breakpoint Manager',sub:'Responsive widths and preview',route:'breakpoints',keys:['R']},
    {icon:'✓',title:'Launch Checklist',sub:'Final production readiness',route:'launchcheck',keys:['L']},
    {icon:'⌁',title:'API & Keys — LAST PHASE',sub:'Locked until product tree is complete',route:'integrations',keys:['LAST']}
  ];
  let commandIndex=0;
  function visibleCommands(){const q=(document.querySelector('#commandInput')?.value||'').toLowerCase().trim();return commands.filter(c=>!q||`${c.title} ${c.sub}`.toLowerCase().includes(q))}
  function drawCommands(){const root=document.querySelector('#commandResults');if(!root)return;const list=visibleCommands();commandIndex=Math.min(commandIndex,Math.max(0,list.length-1));root.innerHTML=list.length?list.map((c,i)=>`<button class="command-item ${i===commandIndex?'active':''}" data-command-route="${c.route}"><span class="command-icon">${c.icon}</span><span><b>${esc(c.title)}</b><div class="tiny muted">${esc(c.sub)}</div></span><span class="command-meta">${c.keys.map(k=>`<span class="kbd">${esc(k)}</span>`).join('')}</span></button>`).join(''):`<div class="command-empty">No command found.</div>`}
  function openCommand(){const p=document.querySelector('#commandPalette');if(!p)return;commandIndex=0;p.classList.remove('hidden');const input=document.querySelector('#commandInput');input.value='';drawCommands();setTimeout(()=>input.focus(),30)}
  function closeCommand(){document.querySelector('#commandPalette')?.classList.add('hidden')}
  document.querySelector('#openCommandMini')?.addEventListener('click',openCommand);
  document.querySelector('#commandPalette')?.addEventListener('click',e=>{if(e.target.id==='commandPalette')closeCommand();const b=e.target.closest('[data-command-route]');if(b){closeCommand();navigate(b.dataset.commandRoute)}});
  document.querySelector('#commandInput')?.addEventListener('input',()=>{commandIndex=0;drawCommands()});
  document.querySelector('#commandInput')?.addEventListener('keydown',e=>{const list=visibleCommands();if(e.key==='ArrowDown'){e.preventDefault();commandIndex=(commandIndex+1)%Math.max(1,list.length);drawCommands()}if(e.key==='ArrowUp'){e.preventDefault();commandIndex=(commandIndex-1+Math.max(1,list.length))%Math.max(1,list.length);drawCommands()}if(e.key==='Enter'&&list[commandIndex]){e.preventDefault();closeCommand();navigate(list[commandIndex].route)}});

  document.addEventListener('keydown',e=>{
    const meta=e.metaKey||e.ctrlKey;
    if(meta&&e.key.toLowerCase()==='k'){e.preventDefault();openCommand();return}
    if(e.key==='Escape'&&!document.querySelector('#commandPalette')?.classList.contains('hidden')){closeCommand();return}
    if(meta&&e.key.toLowerCase()==='s'){e.preventDefault();snapshotRecovery('Manual save');try{toast('Project saved locally')}catch(x){}return}
    if(meta&&e.key.toLowerCase()==='z'&&!e.shiftKey&&state.route==='builder'){e.preventDefault();document.querySelector('[data-action="undo"]')?.click();return}
    if(meta&&e.key.toLowerCase()==='z'&&e.shiftKey&&state.route==='builder'){e.preventDefault();document.querySelector('[data-action="redo"]')?.click();return}
    if(e.target&&['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
    if(state.route==='builder'&&['1','2','3'].includes(e.key)){const map={'1':'desktop','2':'tablet','3':'mobile'};state.device=map[e.key];persist();render('builder');try{toast(map[e.key]+' preview')}catch(x){}return}
    if(e.key==='?'&&state.route!=='marketing'){e.preventDefault();navigate('commandcenter')}
  });

  function shortcutRow(label,keys,desc){return `<div class="shortcut-row"><div><b>${label}</b><div class="tiny muted">${desc}</div></div><span class="grow"></span><div class="shortcut-chip">${keys.map(k=>`<span class="kbd">${k}</span>`).join('')}</div></div>`}
  views.commandcenter=()=>`${viewHead('Command Center','Move through the entire product without hunting through menus.',`<button class="btn primary" data-action="openCommandPalette">⌘ K · Open palette</button>`)}<div class="power-grid"><section class="card power-card power-7"><span class="caps">Global shortcuts</span>${shortcutRow('Command palette',['⌘','K'],'Search every module and action')}${shortcutRow('Save now',['⌘','S'],'Create a local recovery snapshot')}${shortcutRow('Undo',['⌘','Z'],'Builder content change')}${shortcutRow('Redo',['⇧','⌘','Z'],'Redo the latest builder change')}${shortcutRow('Device preview',['1','2','3'],'Desktop / tablet / mobile in Builder')}${shortcutRow('Help center',['?'],'Open this command center')}</section><aside class="card power-card power-5"><span class="caps">Navigation map</span><h3>Jump anywhere</h3><div class="token-stack">${commands.slice(0,10).map(c=>`<button class="command-item" data-nav="${c.route}"><span class="command-icon">${c.icon}</span><span><b>${c.title}</b><div class="tiny muted">${c.sub}</div></span></button>`).join('')}</div><div class="polish-note tiny">API & Keys remains locked until the last phase.</div></aside></div>`;

  views.recovery=()=>{const wave=Array.from({length:24},(_,i)=>`<i style="height:${10+((i*17)%31)}px"></i>`).join('');return `${viewHead('Autosave & Recovery','Local-first protection for every project change.',`<button class="btn" data-action="manualSnapshot">Save snapshot</button><button class="btn primary" data-action="toggleAutosave">Autosave ${state.autosaveEnabled?'ON':'OFF'}</button>`)}<div class="power-grid"><aside class="card power-card power-4"><span class="caps">Save health</span><div class="ready-kpi">${state.autosaveEnabled?'Protected':'Manual'}</div><p class="muted small">Last saved ${new Date(state.lastSavedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</p><div class="autosave-wave">${wave}</div><div class="field"><label>Autosave cadence</label><select data-power-setting="autosaveInterval"><option value="2" ${+state.autosaveInterval===2?'selected':''}>Fast · ~2s</option><option value="3" ${+state.autosaveInterval===3?'selected':''}>Balanced · ~3s</option><option value="5" ${+state.autosaveInterval===5?'selected':''}>Relaxed · ~5s</option></select></div><div class="polish-note tiny">Offline edits remain in local storage and are snapshotted again when connectivity returns.</div></aside><section class="card power-card power-8"><div class="row"><div><span class="caps">Recovery snapshots</span><h3>${state.recoverySnapshots.length} restore points</h3></div><span class="grow"></span><button class="btn" data-action="clearRecovery">Clear history</button></div>${state.recoverySnapshots.length?state.recoverySnapshots.map((r,i)=>`<div class="recovery-row"><div><b>${esc(r.reason)}</b><div class="tiny muted">${esc(r.time)} · ${esc(r.projectName||'Project')} · ${esc(r.route)}</div></div><span class="grow"></span><button class="btn" data-action="restoreRecovery" data-recovery="${r.id}">Restore</button></div>`).join(''):`<div class="command-empty">No snapshots yet. Make an edit or press ⌘S.</div>`}</section></div>`};

  views.designtokens=()=>{const t=state.designTokens;return `${viewHead('Design Token Manager','One source of truth for color, radius, spacing, typography and depth.',`<button class="btn" data-action="resetTokens">Reset system</button><button class="btn primary" data-action="applyTokens">Apply globally</button>`)}<div class="power-grid"><section class="card power-card power-8"><span class="caps">Color system</span><div class="token-grid">${Object.entries(t.colors).map(([k,v])=>`<label class="token-item"><div class="token-swatch" style="background:${v}"></div><b>${k}</b><input type="color" value="${v}" data-token-color="${k}"/><div class="tiny muted">${v}</div></label>`).join('')}</div><div style="height:18px"></div><span class="caps">Scale tokens</span><div class="token-stack">${Object.entries(t.radius).map(([k,v])=>`<div class="token-row"><div style="min-width:90px"><b>Radius ${k}</b></div><input class="prop-input" type="range" min="0" max="64" value="${v}" data-token-range="radius.${k}"/><span class="kbd">${v}px</span></div>`).join('')}${Object.entries(t.spacing).map(([k,v])=>`<div class="token-row"><div style="min-width:90px"><b>Space ${k}</b></div><input class="prop-input" type="range" min="2" max="64" value="${v}" data-token-range="spacing.${k}"/><span class="kbd">${v}px</span></div>`).join('')}</div></section><aside class="card power-card power-4"><span class="caps">Live token preview</span><div class="variant-preview"><div class="variant-hero" style="--demo-radius:${t.radius.lg}px;--demo-bg:${t.colors.canvas};--demo-text:${t.colors.text};--demo-accent:${t.colors.accent}"><span class="caps">Token driven</span><h2 style="font-size:${Math.min(46,t.type.h1)}px">One system. Every page.</h2><p>Colors, spacing, type and radius flow into all components.</p><span class="variant-button">Primary action</span></div></div><div class="polish-note tiny" style="margin-top:12px">Changes are local until you press Apply globally.</div></aside></div>`};

  function selectedVariant(){return state.componentVariants.find(v=>v.id===state.selectedVariant)||state.componentVariants[0]}
  views.variants=()=>{const v=selectedVariant();return `${viewHead('Component Variants','Build reusable visual states without duplicating components.',`<button class="btn primary" data-action="addVariant">＋ New variant</button>`)}<div class="power-grid"><section class="card power-card power-5"><span class="caps">Variants</span>${state.componentVariants.map(x=>`<div class="variant-row ${x.id===v.id?'selected-outline':''}"><div><b>${esc(x.component)} · ${escV(x.name)}</b><div class="tiny muted">${escV(x.status)} · ${esc(x.density)}</div></div><span class="grow"></span><button class="btn" data-action="selectVariant" data-variant="${x.id}">Edit</button></div>`).join('')}</section><section class="card power-card power-7"><div class="row"><div><span class="caps">Variant editor</span><h3>${esc(v.component)} · ${esc(v.name)}</h3></div><span class="grow"></span><button class="btn" data-action="duplicateVariant" data-variant="${v.id}">Duplicate</button></div><div class="two-col"><div><div class="field"><label>Name</label><input data-variant-field="name" value="${esc(v.name)}"/></div><div class="field"><label>Status</label><select data-variant-field="status"><option ${v.status==='Default'?'selected':''}>Default</option><option ${v.status==='Alt'?'selected':''}>Alt</option><option ${v.status==='Hover'?'selected':''}>Hover</option><option ${v.status==='Dark'?'selected':''}>Dark</option></select></div><div class="field"><label>Density</label><select data-variant-field="density"><option ${v.density==='Airy'?'selected':''}>Airy</option><option ${v.density==='Normal'?'selected':''}>Normal</option><option ${v.density==='Compact'?'selected':''}>Compact</option></select></div><div class="field"><label>Accent</label><input type="color" data-variant-field="accent" value="${v.accent}"/></div><div class="field"><label>Radius · ${v.radius}px</label><input type="range" min="0" max="48" data-variant-field="radius" value="${v.radius}"/></div></div><div class="variant-preview"><div class="variant-hero" style="--demo-radius:${v.radius}px;--demo-accent:${v.accent}"><span class="caps">${esc(v.status)}</span><h2>${esc(v.name)}</h2><p>${esc(v.density)} spacing with shared content and behavior.</p><span class="variant-button">Explore</span></div></div></div></section></div>`};

  function curvePath(){const c=state.motionCurve;const sx=30,sy=210,ex=410,ey=30;const c1x=sx+(ex-sx)*c.x1,c1y=sy-(sy-ey)*c.y1,c2x=sx+(ex-sx)*c.x2,c2y=sy-(sy-ey)*c.y2;return `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`}
  views.motionlab=()=>{const c=state.motionCurve;return `${viewHead('Motion Lab','Fine-tune animation timing, easing and keyframes before applying it to 3D scenes.',`<button class="btn" data-action="previewCurve">▶ Preview</button><button class="btn primary" data-action="applyCurve">Apply to selected scene</button>`)}<div class="power-grid"><section class="card power-card power-7"><span class="caps">Cubic Bézier curve</span><div class="curve-stage" id="curveStage"><svg viewBox="0 0 440 240" preserveAspectRatio="none"><line x1="30" y1="210" x2="410" y2="30"></line><path d="${curvePath()}"></path><circle cx="${30+380*c.x1}" cy="${210-180*c.y1}" r="7"></circle><circle cx="${30+380*c.x2}" cy="${210-180*c.y2}" r="7"></circle></svg></div><div class="motion-presets" style="margin-top:12px">${[['Cinematic',.22,.78,.18,1],['Smooth',.4,0,.2,1],['Spring',.2,1.25,.3,1],['Linear',0,0,1,1]].map(p=>`<button class="motion-preset ${c.preset===p[0]?'active':''}" data-action="curvePreset" data-preset="${p[0]}" data-curve="${p.slice(1).join(',')}">${p[0]}</button>`).join('')}</div><div class="keyframe-track"><div class="keyframe-line"></div>${c.keyframes.map((k,i)=>`<button class="key-dot" style="left:calc(18px + (100% - 36px) * ${k/100})" title="${k}%" data-action="removeMotionKey" data-key-index="${i}"></button>`).join('')}</div><div class="row" style="margin-top:10px"><button class="btn" data-action="addMotionKey">＋ Keyframe</button><span class="grow"></span><span class="tiny muted">${c.keyframes.join('% · ')}%</span></div></section><aside class="card power-card power-5"><span class="caps">Timing</span><div class="field"><label>Duration · ${c.duration}s</label><input type="range" min="0.2" max="4" step="0.1" value="${c.duration}" data-curve-field="duration"/></div>${[['x1','Control X1'],['y1','Control Y1'],['x2','Control X2'],['y2','Control Y2']].map(([k,n])=>`<div class="field"><label>${n} · ${c[k]}</label><input type="range" min="0" max="1.4" step="0.01" value="${c[k]}" data-curve-field="${k}"/></div>`).join('')}<div class="polish-note tiny">Curve is saved as a project-level motion token. Apply it to the currently selected builder scene when ready.</div></aside></div>`};

  function selectedBp(){return state.breakpoints.find(b=>b.id===state.selectedBreakpoint)||state.breakpoints[0]}
  views.breakpoints=()=>{const b=selectedBp(),pct=Math.max(25,Math.min(96,b.width/15));return `${viewHead('Responsive Breakpoint Manager','Control exact responsive widths instead of being locked to device presets.',`<button class="btn primary" data-action="addBreakpoint">＋ Custom breakpoint</button>`)}<div class="power-grid"><section class="card power-card power-5"><span class="caps">Breakpoint stack</span>${state.breakpoints.sort((a,b)=>b.width-a.width).map(x=>`<div class="breakpoint-row ${x.id===b.id?'selected-outline':''}"><button class="page-icon-btn" data-action="selectBreakpoint" data-breakpoint="${x.id}">${x.enabled?'●':'○'}</button><div><b>${escV(x.name)}</b><div class="tiny muted">${x.width}px</div></div><span class="grow"></span><button class="btn" data-action="toggleBreakpoint" data-breakpoint="${x.id}">${x.enabled?'Enabled':'Off'}</button></div>`).join('')}</section><section class="card power-card power-7"><div class="row"><div><span class="caps">Responsive preview</span><h3>${esc(b.name)} · ${b.width}px</h3></div><span class="grow"></span><button class="btn" data-action="sendBreakpointToBuilder">Open in Builder</button></div><div class="bp-preview"><div class="bp-frame" style="width:${pct}%"><div class="bp-mini-nav"></div><div class="bp-mini-hero"></div><div style="display:grid;grid-template-columns:repeat(${b.width<600?1:b.width<900?2:3},1fr);gap:8px;margin-top:10px">${[1,2,3].map(()=>'<div style="height:42px;border-radius:9px;background:#d7d1bd"></div>').join('')}</div></div></div><div class="field" style="margin-top:14px"><label>Width · ${b.width}px</label><input type="range" min="320" max="1600" step="1" value="${b.width}" data-breakpoint-width="${b.id}"/></div><div class="polish-note tiny">Builder device buttons remain as quick presets; custom widths live here for precise responsive QA.</div></section></div>`};

  const actions=new Set(['openCommandPalette','manualSnapshot','toggleAutosave','clearRecovery','restoreRecovery','resetTokens','applyTokens','addVariant','selectVariant','duplicateVariant','curvePreset','previewCurve','applyCurve','addMotionKey','removeMotionKey','addBreakpoint','selectBreakpoint','toggleBreakpoint','sendBreakpointToBuilder']);
  document.addEventListener('click',e=>{
    const a=e.target.closest('[data-action]');if(!a||!actions.has(a.dataset.action))return;e.preventDefault();e.stopImmediatePropagation();const act=a.dataset.action;
    if(act==='openCommandPalette'){openCommand();return}
    if(act==='manualSnapshot'){snapshotRecovery('Manual snapshot');render('recovery');try{toast('Snapshot saved')}catch(x){}return}
    if(act==='toggleAutosave'){state.autosaveEnabled=!state.autosaveEnabled;persist();render('recovery');return}
    if(act==='clearRecovery'){state.recoverySnapshots=[];persist();render('recovery');return}
    if(act==='restoreRecovery'){const r=state.recoverySnapshots.find(x=>String(x.id)===String(a.dataset.recovery));if(r){if(r.pages?.length)state.pages=JSON.parse(JSON.stringify(r.pages));state.heroTitle=r.heroTitle||state.heroTitle;state.components=[...(r.components||state.components)];if(r.tokens)state.designTokens=JSON.parse(JSON.stringify(r.tokens));persist();render('recovery');try{toast('Recovery snapshot restored')}catch(x){}}return}
    if(act==='resetTokens'){state.designTokens={colors:{primary:'#7d6cff',accent:'#dfff45',surface:'#0d0d12',canvas:'#f4f0df',text:'#111111',muted:'#8d8d99'},radius:{sm:10,md:18,lg:28,pill:999},spacing:{xs:6,sm:10,md:16,lg:24,xl:36},type:{display:64,h1:48,h2:34,body:16,small:13},shadow:{soft:24,deep:60}};persist();render('designtokens');return}
    if(act==='applyTokens'){const t=state.designTokens;state.brand.primary=t.colors.primary;state.brand.accent=t.colors.accent;state.brand.background=t.colors.canvas;state.brand.text=t.colors.text;state.brand.radius=t.radius.md;document.documentElement.style.setProperty('--acid',t.colors.accent);document.documentElement.style.setProperty('--violet',t.colors.primary);persist();snapshotRecovery('Design tokens applied');render('designtokens');try{toast('Design tokens applied globally')}catch(x){}return}
    if(act==='addVariant'){const id='var'+Date.now();state.componentVariants.push({id,component:'Card',name:'New Variant',status:'Alt',radius:18,accent:state.designTokens.colors.accent,density:'Normal'});state.selectedVariant=id;persist();render('variants');return}
    if(act==='selectVariant'){state.selectedVariant=a.dataset.variant;persist();render('variants');return}
    if(act==='duplicateVariant'){const x=state.componentVariants.find(v=>v.id===a.dataset.variant);if(x){const n={...x,id:'var'+Date.now(),name:x.name+' Copy',status:'Alt'};state.componentVariants.push(n);state.selectedVariant=n.id;persist();render('variants')}return}
    if(act==='curvePreset'){const vals=(a.dataset.curve||'').split(',').map(Number);state.motionCurve.preset=a.dataset.preset;[state.motionCurve.x1,state.motionCurve.y1,state.motionCurve.x2,state.motionCurve.y2]=vals;persist();render('motionlab');return}
    if(act==='previewCurve'){const stage=document.querySelector('#curveStage');if(stage){stage.animate([{transform:'scale(.985)',filter:'brightness(.85)'},{transform:'scale(1.015)',filter:'brightness(1.2)'},{transform:'scale(1)',filter:'brightness(1)'}],{duration:state.motionCurve.duration*1000,easing:`cubic-bezier(${state.motionCurve.x1},${state.motionCurve.y1},${state.motionCurve.x2},${state.motionCurve.y2})`})}return}
    if(act==='applyCurve'){state.motion=state.motion||{};state.motion.duration=state.motionCurve.duration;state.motion.keyframes=[...state.motionCurve.keyframes];state.motion.easing=`cubic-bezier(${state.motionCurve.x1},${state.motionCurve.y1},${state.motionCurve.x2},${state.motionCurve.y2})`;persist();snapshotRecovery('Motion curve applied');try{toast('Motion curve applied to project')}catch(x){}return}
    if(act==='addMotionKey'){const current=state.motionCurve.keyframes;const choices=[15,35,50,75,88];const n=choices.find(x=>!current.includes(x));if(n!==undefined)current.push(n);current.sort((a,b)=>a-b);persist();render('motionlab');return}
    if(act==='removeMotionKey'){const i=+a.dataset.keyIndex;if(state.motionCurve.keyframes.length>2)state.motionCurve.keyframes.splice(i,1);persist();render('motionlab');return}
    if(act==='addBreakpoint'){const width=690+state.breakpoints.length*37,id='bp'+Date.now();state.breakpoints.push({id,name:'Custom '+width,width,enabled:true});state.selectedBreakpoint=id;persist();render('breakpoints');return}
    if(act==='selectBreakpoint'){state.selectedBreakpoint=a.dataset.breakpoint;persist();render('breakpoints');return}
    if(act==='toggleBreakpoint'){const x=state.breakpoints.find(v=>v.id===a.dataset.breakpoint);if(x)x.enabled=!x.enabled;persist();render('breakpoints');return}
    if(act==='sendBreakpointToBuilder'){const x=selectedBp();state.device=x.width<=520?'mobile':x.width<=900?'tablet':'desktop';persist();navigate('builder');try{toast(x.name+' breakpoint opened in Builder')}catch(z){}return}
  },true);

  document.addEventListener('input',e=>{
    const col=e.target.closest('[data-token-color]');if(col){state.designTokens.colors[col.dataset.tokenColor]=col.value;persist();render('designtokens');return}
    const rng=e.target.closest('[data-token-range]');if(rng){const [grp,k]=rng.dataset.tokenRange.split('.');state.designTokens[grp][k]=+rng.value;persist();return}
    const vf=e.target.closest('[data-variant-field]');if(vf){const v=selectedVariant();v[vf.dataset.variantField]=vf.type==='range'?+vf.value:vf.value;persist();render('variants');return}
    const cf=e.target.closest('[data-curve-field]');if(cf){state.motionCurve[cf.dataset.curveField]=+cf.value;state.motionCurve.preset='Custom';persist();render('motionlab');return}
    const bw=e.target.closest('[data-breakpoint-width]');if(bw){const b=state.breakpoints.find(x=>x.id===bw.dataset.breakpointWidth);if(b)b.width=+bw.value;persist();render('breakpoints');return}
  },true);
  document.addEventListener('change',e=>{const p=e.target.closest('[data-power-setting]');if(p){state[p.dataset.powerSetting]=+p.value||p.value;persist();render('recovery')}},true);

  // Initial recovery point + polish status.
  if(!state.recoverySnapshots.length)snapshotRecovery('Initial project state');
  updateUxChrome();
})();



// === Final pre-API completion flow ===
(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
  const seed=(k,v)=>{if(state[k]===undefined||state[k]===null)state[k]=v};
  seed('projectBucket','Active'); seed('archivedProjects',[]); seed('trashedProjects',[]); seed('globalSearchQuery',''); seed('uxDemoState','loading');
  seed('mobilePolish',{touchTargets:true,safeArea:true,compactPanels:true,bottomActions:true,stickyCta:true});
  seed('preApiManual',{mobileReviewed:false,copyReviewed:false,formsReviewed:false,commerceReviewed:false});
  const persistFinal=()=>{try{saveState()}catch(e){try{localStorage.setItem('scenspace3d_state',JSON.stringify(state))}catch(_){}}};
  const normalizeProject=(p,i=0)=>typeof p==='string'?{id:'p'+i+'-'+Date.now(),name:p,status:'Draft',updated:'Recently'}:{id:p.id||('p'+i+'-'+p.name.replace(/\W/g,'')),name:p.name||'Untitled',status:p.status||'Draft',updated:p.updated||'Recently'};
  state.projects=(state.projects||[]).map(normalizeProject); state.archivedProjects=(state.archivedProjects||[]).map(normalizeProject); state.trashedProjects=(state.trashedProjects||[]).map(normalizeProject);
  
  // Polished stacked toasts: all existing toast() calls benefit automatically.
  const oldToast=typeof toast==='function'?toast:null;
  toast=function(message,type='info',detail=''){
    let stack=document.getElementById('toastStack');if(!stack){stack=document.createElement('div');stack.id='toastStack';document.body.appendChild(stack)}
    const card=document.createElement('div');card.className='toast-card '+type;const mark=type==='success'?'✓':type==='error'?'!':'•';
    card.innerHTML=`<span class="toast-mark">${mark}</span><div><b style="font-size:12px">${esc(message)}</b>${detail?`<div class="tiny muted" style="margin-top:3px">${esc(detail)}</div>`:''}</div>`;stack.prepend(card);while(stack.children.length>4)stack.lastElementChild.remove();setTimeout(()=>{card.style.opacity='0';card.style.transform='translateY(8px)';setTimeout(()=>card.remove(),220)},2600)
  };

  function projectList(){return state.projectBucket==='Archived'?state.archivedProjects:state.projectBucket==='Trash'?state.trashedProjects:state.projects}
  function projectRow(p){const trash=state.projectBucket==='Trash',arch=state.projectBucket==='Archived';return `<div class="project-life-row"><div class="qa-icon ${p.status==='Published'?'good':''}">▧</div><div><b>${esc(p.name)}</b><div class="tiny muted">${esc(p.status)} · ${esc(p.updated||'Recently')}</div></div><span class="grow"></span><div class="life-actions">${trash?`<button class="btn" data-action="restoreProject" data-project-id="${p.id}">Restore</button><button class="btn danger" data-action="deleteProjectForever" data-project-id="${p.id}">Delete forever</button>`:arch?`<button class="btn" data-action="restoreArchivedProject" data-project-id="${p.id}">Restore</button><button class="btn danger" data-action="trashArchivedProject" data-project-id="${p.id}">Trash</button>`:`<button class="btn" data-action="openLifecycleProject" data-project-id="${p.id}">Open</button><button class="btn" data-action="duplicateProject" data-project-id="${p.id}">Duplicate</button><button class="btn" data-action="archiveProject" data-project-id="${p.id}">Archive</button><button class="btn danger" data-action="trashProject" data-project-id="${p.id}">Trash</button>`}</div></div>`}
  views.projects=()=>`${viewHead('Projects','Create, duplicate, archive, restore and clean up every website project.',`<button class="btn" data-action="newLifecycleProject">＋ Quick draft</button><button class="btn primary" data-nav="create">Create with AI →</button>`)}<div class="project-tabbar">${['Active','Archived','Trash'].map(k=>`<button class="chip ${state.projectBucket===k?'active':''}" data-action="projectBucket" data-bucket="${k}">${k}<b>${k==='Active'?state.projects.length:k==='Archived'?state.archivedProjects.length:state.trashedProjects.length}</b></button>`).join('')}</div><div class="card final-card">${projectList().length?projectList().map(projectRow).join(''):`<div class="state-preview" style="min-height:260px"><div style="text-align:center"><div class="empty-illustration">▧</div><b>No ${state.projectBucket.toLowerCase()} projects</b><p class="small muted">This lifecycle bucket is empty.</p></div></div>`}</div>`;

  views.uxstates=()=>`${viewHead('UX States Lab','Verify loading, empty, error and success states before connecting any external provider.',`<button class="btn primary" data-action="runUxSequence">Run sequence</button>`)}<div class="final-grid"><section class="card final-card final-7"><div class="row"><div><span class="caps">Live state preview</span><h3 style="margin:5px 0">${state.uxDemoState[0].toUpperCase()+state.uxDemoState.slice(1)} state</h3></div><span class="grow"></span><div class="project-tabbar" style="margin:0">${['loading','empty','error','success'].map(x=>`<button class="chip ${state.uxDemoState===x?'active':''}" data-action="setUxState" data-state="${x}">${x}</button>`).join('')}</div></div><div class="state-preview" style="margin-top:14px">${state.uxDemoState==='loading'?`<div class="skeleton-stack"><div class="sk short"></div><div class="sk big"></div><div class="sk"></div><div class="sk short"></div></div>`:state.uxDemoState==='empty'?`<div style="text-align:center"><div class="empty-illustration">＋</div><b>Nothing here yet</b><p class="small muted">Clear next action, no dead-end screen.</p><button class="btn primary" data-action="demoUxToast" data-toast="Create your first item">Create item</button></div>`:state.uxDemoState==='error'?`<div style="text-align:center"><div class="error-badge">!</div><b>Something needs attention</b><p class="small muted">The user keeps context and gets a retry path.</p><button class="btn" data-action="demoUxToast" data-type="error" data-toast="Retry started">Try again</button></div>`:`<div style="text-align:center"><div class="success-badge">✓</div><b>Changes saved</b><p class="small muted">Success is clear without interrupting the workflow.</p><button class="btn" data-action="demoUxToast" data-type="success" data-toast="Published successfully">Show confirmation</button></div>`}</div></section><aside class="card final-card final-5"><span class="caps">State checklist</span><h3>Product-wide behavior</h3>${[['Loading','Skeleton or progress, never blank'],['Empty','Context + obvious next action'],['Error','Preserve work + retry/recover'],['Success','Quiet confirmation + next step'],['Offline','Local recovery + reconnect state']].map((x,i)=>`<div class="state-demo-row"><span class="qa-icon good">✓</span><div><b>${x[0]}</b><div class="tiny muted">${x[1]}</div></div></div>`).join('')}<button class="btn" style="width:100%;margin-top:12px" data-action="demoUxToast" data-toast="Toast system is working">Test polished toast</button></aside></div>`;

  views.mobileqa=()=>`${viewHead('Mobile Editor Polish','Touch-first controls, safe areas and compact editing behavior for the smallest canvas.',`<button class="btn primary" data-action="openMobileBuilder">Open Mobile Builder →</button>`)}<div class="final-grid"><section class="card final-card final-5"><div class="mobile-polish-preview"><div class="mp-notch"></div><div class="mp-nav"><b>Scen</b><span class="grow"></span><span>Menu</span></div><div class="mp-hero"><span class="caps" style="color:#777">Spatial website</span><h3>Architecture that slows time.</h3><p>Touch-ready spacing, readable type and a clear primary action.</p><span class="mp-cta">Explore experience →</span></div><div class="mp-bottom"><span>＋ Add</span><span>✦ AI</span><span>≡ Layers</span></div></div></section><section class="card final-card final-7"><span class="caps">Mobile polish controls</span><h3>Touch & viewport behavior</h3>${[['touchTargets','44px minimum touch targets'],['safeArea','Safe-area padding'],['compactPanels','Compact builder panels'],['bottomActions','Bottom quick actions'],['stickyCta','Sticky primary CTA preview']].map(([k,l])=>`<div class="qa-row"><div><b>${l}</b><div class="tiny muted">${k==='touchTargets'?'Buttons and editor controls stay thumb-friendly':k==='safeArea'?'Accounts for iPhone notch/home indicator':k==='compactPanels'?'More canvas, less chrome':k==='bottomActions'?'Fast access to add/AI/layers':'Keeps conversion action reachable'}</div></div><span class="grow"></span><button class="switch ${state.mobilePolish[k]?'on':''}" data-action="toggleMobilePolish" data-mobile-polish="${k}"></button></div>`).join('')}<div class="preapi-banner" style="margin-top:14px"><span class="qa-icon good">✓</span><div><b>Responsive editor CSS upgraded</b><div class="tiny muted">On narrow screens the builder collapses to the icon rail and expands the canvas.</div></div></div></section></div>`;

  function searchIndex(){
    const routes=[['Dashboard','dashboard'],['Projects','projects'],['Templates','templates'],['Builder','builder'],['Store','store'],['Bookings','bookings'],['Analytics','analytics'],['CMS','cms'],['Forms','forms'],['Domains','domains'],['SEO','seo'],['Production','production'],['Security','security'],['Performance','performance'],['Launch Checklist','launchcheck'],['Design Tokens','designtokens'],['Motion Lab','motionlab'],['Breakpoints','breakpoints']];
    const out=routes.map(x=>({kind:'Module',title:x[0],route:x[1],meta:'Open product module'}));
    (state.projects||[]).forEach(p=>out.push({kind:'Project',title:p.name,route:'projects',meta:p.status}));
    (state.pages||[]).forEach(p=>out.push({kind:'Page',title:p.name||p.title||'Untitled page',route:'builder',meta:p.slug||'Website page'}));
    (state.products||[]).forEach(p=>out.push({kind:'Product',title:p.name,route:'store',meta:p.sku||'Store product'}));
    (state.cmsCollections||[]).forEach(c=>out.push({kind:'CMS',title:c.name,route:'cms',meta:`${(c.items||[]).length} items`}));
    return out;
  }
  function searchResults(){const q=(state.globalSearchQuery||'').trim().toLowerCase();const all=searchIndex();if(!q)return all.slice(0,12);return all.filter(x=>(x.title+' '+x.kind+' '+x.meta).toLowerCase().includes(q)).slice(0,30)}
  views.globalsearch=()=>`${viewHead('Global Search','Find modules, projects, pages, products and CMS content from one place.',`<span class="pill">⌘ /</span>`)}<div class="card final-card"><div class="global-search-box"><span style="font-size:20px;padding:7px">⌕</span><input id="globalSearchInput" value="${esc(state.globalSearchQuery)}" placeholder="Search everything…" autofocus/><button class="btn" data-action="clearGlobalSearch">Clear</button></div><div class="search-group">${searchResults().map(x=>`<div class="search-result-row" data-action="openSearchResult" data-route-target="${x.route}"><span class="qa-icon">${x.kind==='Project'?'▧':x.kind==='Page'?'☷':x.kind==='Product'?'◇':x.kind==='CMS'?'▦':'⌘'}</span><div><div class="search-kind">${esc(x.kind)}</div><b>${esc(x.title)}</b><div class="tiny muted">${esc(x.meta)}</div></div><span class="grow"></span><span class="tiny muted">Open →</span></div>`).join('')||'<div class="state-preview"><div style="text-align:center"><div class="empty-illustration">⌕</div><b>No results</b><p class="small muted">Try a project, page, product or module name.</p></div></div>'}</div></div>`;

  function preApiChecks(){return [
    ['Navigation & core routes',true,'Public → Dashboard → Builder → Publish flow exists'],
    ['Project lifecycle',true,'Duplicate, archive, trash and restore ready'],
    ['Responsive editor',true,'Desktop, tablet, mobile + custom breakpoints'],
    ['Loading / empty / error / success',true,'State patterns are defined and testable'],
    ['Autosave & recovery',!!state.autosaveEnabled,'Local recovery points enabled'],
    ['Version history',Array.isArray(state.versions),'Undo/redo/version state available'],
    ['CMS & forms',!!(state.cmsCollections?.length||state.forms?.length),'Content and lead flows configured'],
    ['Store & bookings',!!(state.products?.length||state.services?.length),'Commerce/business flows configured'],
    ['SEO / accessibility / privacy',true,'Production controls exist'],
    ['Security / audit / roles',true,'Admin governance layer exists'],
    ['Performance / monitoring',true,'Optimizer and error monitor exist'],
    ['Backup / export',true,'Project export and backup flows exist'],
    ['Manual mobile review',!!state.preApiManual.mobileReviewed,'Human sign-off before API connection'],
    ['Manual copy review',!!state.preApiManual.copyReviewed,'Final brand/copy check'],
    ['Manual forms review',!!state.preApiManual.formsReviewed,'Validate field/logic expectations'],
    ['Manual commerce review',!!state.preApiManual.commerceReviewed,'Validate tax/shipping/checkout assumptions'],
    ['External APIs / keys',false,'Intentionally deferred to LAST PHASE',true]
  ]}
  function preApiScore(){const c=preApiChecks().filter(x=>!x[3]);return Math.round(c.filter(x=>x[1]).length/c.length*100)}
  views.preapiaudit=()=>{const score=preApiScore();return `${viewHead('Final Pre-API Audit','One completion gate before any provider keys are connected.',`<button class="btn" data-action="rerunPreApiAudit">Re-run audit</button>`)}<div class="preapi-banner"><div class="preapi-score">${score}%</div><div><span class="caps">Prototype readiness</span><h2 style="margin:4px 0">${score>=95?'Ready for API phase after sign-off':score>=80?'Almost ready — finish manual sign-offs':'Pre-API work remains'}</h2><div class="small muted">API providers are excluded from this score by design.</div></div><span class="grow"></span><span class="status-chip ${score>=90?'good':'warn'}">${score>=90?'Strong':'Review'}</span></div><div class="final-grid" style="margin-top:14px"><section class="card final-card final-8"><span class="caps">Completion audit</span>${preApiChecks().map(x=>`<div class="qa-row"><span class="qa-icon ${x[3]?'deferred':x[1]?'good':'warn'}">${x[3]?'⌁':x[1]?'✓':'!'}</span><div><b>${x[0]}</b><div class="tiny muted">${x[2]}</div></div><span class="grow"></span><span class="status-chip ${x[3]?'':x[1]?'good':'warn'}">${x[3]?'LAST PHASE':x[1]?'Ready':'Review'}</span></div>`).join('')}</section><aside class="card final-card final-4"><span class="caps">Manual sign-off</span><h3>Human QA gates</h3>${[['mobileReviewed','Mobile review'],['copyReviewed','Brand & copy'],['formsReviewed','Forms & logic'],['commerceReviewed','Commerce assumptions']].map(([k,l])=>`<div class="qa-row"><span>${l}</span><span class="grow"></span><button class="switch ${state.preApiManual[k]?'on':''}" data-action="togglePreApiManual" data-preapi="${k}"></button></div>`).join('')}<div class="deferred-api" style="margin-top:14px"><b>⌁ API & Keys — locked</b><p class="tiny muted">No provider secrets, payment keys, OAuth credentials, email keys or deployment credentials are required yet.</p><span class="status-chip">LAST PHASE</span></div></aside></div>`};

  const actions=new Set(['projectBucket','newLifecycleProject','duplicateProject','archiveProject','trashProject','restoreProject','deleteProjectForever','restoreArchivedProject','trashArchivedProject','openLifecycleProject','setUxState','runUxSequence','demoUxToast','toggleMobilePolish','openMobileBuilder','clearGlobalSearch','openSearchResult','togglePreApiManual','rerunPreApiAudit']);
  document.addEventListener('click',e=>{const a=e.target.closest('[data-action]');if(!a||!actions.has(a.dataset.action))return;e.preventDefault();e.stopImmediatePropagation();const act=a.dataset.action;
    if(act==='projectBucket'){state.projectBucket=a.dataset.bucket;persistFinal();render('projects');return}
    if(act==='newLifecycleProject'){const p={id:'p'+Date.now(),name:'Untitled Spatial Site',status:'Draft',updated:'Just now'};state.projects.unshift(p);persistFinal();render('projects');toast('Draft project created','success');return}
    if(act==='duplicateProject'){const p=state.projects.find(x=>x.id===a.dataset.projectId);if(p){state.projects.unshift({...p,id:'p'+Date.now(),name:p.name+' Copy',status:'Draft',updated:'Just now'});persistFinal();render('projects');toast('Project duplicated','success')}return}
    if(act==='archiveProject'||act==='trashProject'){const i=state.projects.findIndex(x=>x.id===a.dataset.projectId);if(i>-1){const [p]=state.projects.splice(i,1);(act==='archiveProject'?state.archivedProjects:state.trashedProjects).unshift({...p,updated:'Just now'});persistFinal();render('projects');toast(act==='archiveProject'?'Project archived':'Project moved to trash','info')}return}
    if(act==='restoreProject'){const i=state.trashedProjects.findIndex(x=>x.id===a.dataset.projectId);if(i>-1){const [p]=state.trashedProjects.splice(i,1);state.projects.unshift({...p,updated:'Restored now'});persistFinal();render('projects');toast('Project restored','success')}return}
    if(act==='deleteProjectForever'){const i=state.trashedProjects.findIndex(x=>x.id===a.dataset.projectId);if(i>-1){state.trashedProjects.splice(i,1);persistFinal();render('projects');toast('Project permanently deleted','error')}return}
    if(act==='restoreArchivedProject'){const i=state.archivedProjects.findIndex(x=>x.id===a.dataset.projectId);if(i>-1){const [p]=state.archivedProjects.splice(i,1);state.projects.unshift({...p,status:'Draft',updated:'Restored now'});persistFinal();render('projects');toast('Archived project restored','success')}return}
    if(act==='trashArchivedProject'){const i=state.archivedProjects.findIndex(x=>x.id===a.dataset.projectId);if(i>-1){const [p]=state.archivedProjects.splice(i,1);state.trashedProjects.unshift({...p,updated:'Just now'});persistFinal();render('projects')}return}
    if(act==='openLifecycleProject'){const p=state.projects.find(x=>x.id===a.dataset.projectId);if(p){state.projectName=p.name;persistFinal();navigate('builder')}return}
    if(act==='setUxState'){state.uxDemoState=a.dataset.state;persistFinal();render('uxstates');return}
    if(act==='runUxSequence'){const seq=['loading','empty','error','success'];let i=0;state.uxDemoState=seq[0];render('uxstates');const timer=setInterval(()=>{i++;if(i>=seq.length){clearInterval(timer);toast('UX state sequence complete','success');return}state.uxDemoState=seq[i];render('uxstates')},650);return}
    if(act==='demoUxToast'){toast(a.dataset.toast||'Done',a.dataset.type||'info');return}
    if(act==='toggleMobilePolish'){const k=a.dataset.mobilePolish;state.mobilePolish[k]=!state.mobilePolish[k];persistFinal();render('mobileqa');return}
    if(act==='openMobileBuilder'){state.device='mobile';persistFinal();navigate('builder');toast('Mobile builder opened','success');return}
    if(act==='clearGlobalSearch'){state.globalSearchQuery='';persistFinal();render('globalsearch');return}
    if(act==='openSearchResult'){navigate(a.dataset.routeTarget||'dashboard');return}
    if(act==='togglePreApiManual'){const k=a.dataset.preapi;state.preApiManual[k]=!state.preApiManual[k];persistFinal();render('preapiaudit');return}
    if(act==='rerunPreApiAudit'){render('preapiaudit');toast('Pre-API audit refreshed','success');return}
  },true);
  document.addEventListener('input',e=>{if(e.target.id==='globalSearchInput'){state.globalSearchQuery=e.target.value;persistFinal();render('globalsearch');const i=document.getElementById('globalSearchInput');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}return}},true);
  document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='/'){e.preventDefault();navigate('globalsearch');setTimeout(()=>document.getElementById('globalSearchInput')?.focus(),40)}},true);
  persistFinal();
})();




// === Final Brand / Help / Legal / Admin polish ===
(()=>{
  const escB=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const persistBrand=()=>{try{localStorage.setItem('scenspace3d_state',JSON.stringify(state))}catch(e){}};
  if(!state.brandProfile)state.brandProfile={name:'Scen',tagline:'Build a world. Not another page.',descriptor:'3D AI Website Builder',primary:'#7d6cff',accent:'#dfff45',voice:'Cinematic, precise, confident',promise:'From one brief to a living website.'};
  if(!state.helpQuery)state.helpQuery='';
  if(!state.legalTab)state.legalTab='privacy';
  if(!state.copyTab)state.copyTab='onboarding';
  if(!state.adminLaunchMode)state.adminLaunchMode='Build mode';

  function applyBrandChrome(){
    const b=state.brandProfile;
    document.querySelectorAll('[data-brand-name]').forEach(el=>el.textContent=b.name||'Scen');
    document.title=`${b.name||'Scen'} — ${b.descriptor||'3D AI Website Builder'}`;
    document.documentElement.style.setProperty('--brand-primary',b.primary||'#7d6cff');
    document.documentElement.style.setProperty('--brand-accent',b.accent||'#dfff45');
  }
  applyBrandChrome();

  const onboardingCopy={
    onboarding:[
      ['Welcome','Set up the studio around the way you actually build.','This takes less than a minute, and every choice can be changed later.'],
      ['Work type','What do you create most often?','We use this only to tune starter layouts, components and prompts.'],
      ['Visual default','Choose the visual language you want to start from.','It is a starting point, not a locked theme.'],
      ['Ready','Your studio is ready.','Create your first world from a brief, a template, a reference or a blank canvas.']
    ],
    empty:[
      ['Projects','No projects yet','Start with one sentence. We will turn it into a plan before anything is generated.','Create your first project'],
      ['Leads','No leads yet','When a visitor submits a form, their details and source will appear here.','Create a lead form'],
      ['CMS','No collections yet','Use a collection when content repeats across pages: projects, articles, listings or team members.','Create collection'],
      ['Orders','No orders yet','Your first completed checkout will appear here with customer, payment and fulfillment status.','Preview checkout'],
      ['Bookings','No bookings yet','Create a service and open availability to start accepting appointments.','Create service']
    ],
    states:[
      ['Loading','Building the first pass…','You can stay here. The site appears progressively as each stage completes.'],
      ['Error','This step did not finish.','Your project is safe. Retry this step or continue editing what already exists.'],
      ['Success','Changes are live in the canvas.','Undo is available if you want to compare the previous version.'],
      ['Offline','You are offline.','Edits will keep saving locally and sync when the connection returns.']
    ]
  };

  views.brandstudio=()=>{const b=state.brandProfile;return `${viewHead('Brand Studio','One source of truth for the product identity — name, voice, colors and promise.',`<span class="pill">Working identity · editable</span><button class="btn primary" data-action="saveBrandProfile">Apply brand globally</button>`)}<div class="brand-studio-grid"><section class="card brand-panel"><span class="caps">Identity system</span><h3>Core brand</h3><div class="field"><label>Brand name</label><input data-brand-field="name" value="${escB(b.name)}"/></div><div class="field"><label>Product descriptor</label><input data-brand-field="descriptor" value="${escB(b.descriptor)}"/></div><div class="field"><label>Tagline</label><input data-brand-field="tagline" value="${escB(b.tagline)}"/></div><div class="field"><label>Product promise</label><input data-brand-field="promise" value="${escB(b.promise)}"/></div><div class="field"><label>Voice</label><select data-brand-field="voice"><option ${b.voice==='Cinematic, precise, confident'?'selected':''}>Cinematic, precise, confident</option><option ${b.voice==='Minimal, editorial, intelligent'?'selected':''}>Minimal, editorial, intelligent</option><option ${b.voice==='Bold, experimental, energetic'?'selected':''}>Bold, experimental, energetic</option></select></div><div class="two-col"><div class="field"><label>Primary</label><input type="color" data-brand-field="primary" value="${escB(b.primary)}"/></div><div class="field"><label>Accent</label><input type="color" data-brand-field="accent" value="${escB(b.accent)}"/></div></div><div class="brand-swatches"><div class="brand-swatch-card" style="background:${escB(b.primary)}">Primary</div><div class="brand-swatch-card" style="background:${escB(b.accent)};color:#080808">Accent</div><div class="brand-swatch-card" style="background:#050507">Night</div><div class="brand-swatch-card" style="background:#f4f0df;color:#111">Warm light</div></div></section><aside class="card brand-panel"><div class="brand-preview" style="--brand-primary:${escB(b.primary)};--brand-accent:${escB(b.accent)}"><div class="brand-lockup"><span class="brand-mark-demo"></span>${escB(b.name)}</div><div class="brand-preview-orb"></div><div class="brand-voice"><span class="caps">${escB(b.descriptor)}</span><h2>${escB(b.tagline)}</h2><p class="muted">${escB(b.promise)}</p><div class="proofs"><span>${escB(b.voice)}</span><span>3D-native</span><span>AI-directed</span></div></div></div></aside></div>`};

  function copyRows(tab){return onboardingCopy[tab].map((x,i)=>`<div class="copy-block"><div class="copy-label">${tab==='onboarding'?`Step ${i+1}`:tab==='empty'?x[0]:x[0]}</div><div class="copy-main">${escB(tab==='onboarding'?x[1]:x[1])}</div><div class="copy-sub">${escB(tab==='onboarding'?x[2]:x[2])}</div>${tab==='empty'?`<div style="margin-top:9px"><span class="pill">CTA · ${escB(x[3])}</span></div>`:''}</div>`).join('')}
  views.copycenter=()=>`${viewHead('Product Copy System','Final UX writing for onboarding, empty states and system feedback.',`<span class="pill">Clear · calm · action-led</span>`)}<div class="copy-grid"><aside class="card copy-nav">${[['onboarding','Onboarding'],['empty','Empty states'],['states','System states']].map(x=>`<button class="${state.copyTab===x[0]?'active':''}" data-action="setCopyTab" data-copy-tab="${x[0]}">${x[1]}</button>`).join('')}<div class="launch-lock" style="margin-top:12px"><b>Writing rule</b><p class="tiny muted">Explain what happened, preserve context, then give one obvious next action.</p></div></aside><section class="card copy-sheet"><span class="caps">${state.copyTab}</span>${copyRows(state.copyTab)}</section></div>`;

  const docs=[
    {title:'Create your first 3D site',cat:'Quick start',icon:'✦',body:'Brief → project plan → generation → visual editing → QA → publish.'},
    {title:'3D scenes and scroll motion',cat:'Builder',icon:'◈',body:'Create depth, parallax, camera-like movement, triggers and responsive fallbacks.'},
    {title:'CMS and reusable content',cat:'Content',icon:'▥',body:'Collections, field binding, reusable sections, multilingual content and site search.'},
    {title:'Store, checkout and orders',cat:'Commerce',icon:'◇',body:'Products, variants, inventory, coupons, shipping, checkout design and order operations.'},
    {title:'Bookings and availability',cat:'Business',icon:'◷',body:'Services, calendar, availability rules, client details and confirmation flows.'},
    {title:'Responsive and accessibility QA',cat:'Quality',icon:'◒',body:'Breakpoints, per-device overrides, reduced motion, focus, contrast and launch checks.'},
    {title:'Domains and publishing',cat:'Launch',icon:'◎',body:'Preview, QA, free URL, custom domain states, redirects and backup/export.'},
    {title:'Admin and provider architecture',cat:'Admin',icon:'▣',body:'Plans, credits, roles, logs and provider adapters. Real keys connect only in the last phase.'}
  ];
  function matchingDocs(){const q=(state.helpQuery||'').trim().toLowerCase();return q?docs.filter(d=>(d.title+' '+d.cat+' '+d.body).toLowerCase().includes(q)):docs}
  function helpResultHtml(){const m=matchingDocs();return m.length?m.map(d=>`<div class="help-result"><div class="row"><span class="doc-icon">${d.icon}</span><div><span class="caps">${escB(d.cat)}</span><b style="display:block;margin-top:3px">${escB(d.title)}</b><div class="small muted" style="margin-top:5px">${escB(d.body)}</div></div></div></div>`).join(''):`<div class="state-preview"><div style="text-align:center"><div class="empty-illustration">?</div><b>No help article found</b><p class="small muted">Try “3D”, “checkout”, “CMS”, “publish” or “admin”.</p></div></div>`}
  views.helpdocs=()=>`${viewHead('Help & Docs','Everything needed to move from first brief to production-ready site.',`<button class="btn" data-nav="support">Contact support</button><button class="btn primary" data-nav="onboardingcenter">Guided product tour →</button>`)}<div class="help-search"><span class="icon">⌕</span><input id="helpSearchInput" value="${escB(state.helpQuery)}" placeholder="Search documentation — 3D scenes, CMS, checkout, publish…"/><button class="btn" data-action="clearHelpSearch">Clear</button></div><div class="help-grid"><section><div class="help-results" id="helpResults">${helpResultHtml()}</div></section><aside class="doc-list"><div class="card doc-card"><span class="caps">Start here</span><h3>15-minute build path</h3><p class="small muted">Create → approve plan → edit → responsive → QA → publish.</p><button class="btn primary" data-nav="create">Create project →</button></div><div class="card doc-card"><span class="caps">Builder principles</span><h3>Normal web first. 3D where it earns attention.</h3><p class="small muted">Motion must preserve readability, mobile performance and clear calls to action.</p><button class="btn" data-nav="motionlab">Open Motion Lab</button></div><div class="card doc-card"><span class="caps">Before API phase</span><h3>Approve the complete product behavior.</h3><p class="small muted">Provider credentials should not compensate for unfinished UX.</p><button class="btn" data-nav="preapiaudit">Open audit</button></div></aside></div>`;

  const legalDocs={
    privacy:{title:'Privacy Policy',intro:'How the product handles account, project, analytics and customer-submitted data in the prototype architecture.',sections:[['Data we process','Account details, workspace settings, project content, uploaded assets, form submissions, order and booking records, and product usage events may be processed to provide the service.'],['How data is used','Data is used to operate workspaces, save projects, deliver requested features, secure accounts, measure performance and support users.'],['AI and provider processing','When real AI providers are connected, the applicable data flows, retention settings and subprocessors must be documented before production launch.'],['User controls','Workspace owners should be able to export data, delete eligible records, manage consent settings and control analytics or marketing categories where required.']]},
    terms:{title:'Terms of Service',intro:'Core commercial and acceptable-use terms for the website-builder product.',sections:[['Service','The product provides website creation, editing, business tools, publishing workflows and optional AI-powered generation features.'],['Accounts and billing','Users are responsible for account security, authorized workspace use and charges associated with their selected subscription or metered usage.'],['Customer content','Customers retain rights they hold in uploaded content and are responsible for having permission to use logos, images, footage, text and other materials they submit.'],['Availability','Features may change, and third-party provider availability can affect optional generation, payment, email, domain or deployment functionality.']]},
    cookies:{title:'Cookie & Consent Notice',intro:'A clear consent model for necessary, analytics, personalization and marketing technologies.',sections:[['Necessary storage','Essential storage supports authentication, workspace state, security, preferences and other functions required to deliver the service.'],['Analytics','Analytics technologies should run according to configured consent rules and applicable law.'],['Marketing','Marketing or advertising technologies remain disabled until the user provides the required consent where applicable.'],['Controls','Users can revisit cookie preferences and revoke optional categories without losing access to essential product functionality.']]},
    acceptable:{title:'Acceptable Use',intro:'Rules that protect users, third parties and the platform from misuse.',sections:[['Rights and consent','Do not upload or generate content that infringes rights or uses protected personal material without the required permission.'],['Abuse','Do not use the service for malware, credential theft, deceptive impersonation, unlawful surveillance or attempts to compromise platform security.'],['Platform integrity','Do not bypass quotas, probe restricted systems, interfere with other tenants or expose secret credentials in public client-side code.'],['Enforcement','The platform may restrict or suspend use when necessary to protect users, comply with law or prevent material abuse.']]},
    refund:{title:'Cancellation & Refund',intro:'How credit purchases work today, in line with the one-time, non-recurring plans shown on Pricing.',sections:[['One-time payments','Plans on this site are one-time credit purchases, not a recurring subscription — there is nothing to cancel because nothing auto-renews.'],['Unused credits','Credits already added to a wallet are not refunded once a purchase completes, since a build or generation can consume them immediately after payment.'],['Failed or duplicate charges','A payment that was charged but never credited to the wallet, or charged twice for one purchase, is refunded once verified against the payment provider\'s records.'],['How to request one','Contact support with the payment reference and workspace email; requests are checked against the Dodo Payments record for that charge before a refund is issued.']]},
    dpa:{title:'Data Processing Agreement',intro:'The terms that apply when a workspace stores customer or business data through this product on behalf of the account holder.',sections:[['Roles','The workspace owner is the data controller for content, customers and business records they put into their build; the platform processes that data to operate the service.'],['Subprocessors','AI generation, image generation, payments and hosting run through named third-party providers; a current subprocessor list is available on request until it is published here directly.'],['Security measures','Sessions are httpOnly-cookie based, passwords and secrets are never written into generated site output, and access to a workspace is scoped to its own data.'],['Requesting a signed copy','Workspaces that need a countersigned DPA for their own compliance should contact support — this page is the plain-language summary, not the executable document.']]}
  };
  const legalRouteForTab=k=>Object.keys(LEGAL_ROUTES).find(r=>LEGAL_ROUTES[r]===k)||'legal';
  views.legal=()=>{const d=legalDocs[state.legalTab]||legalDocs.privacy;return `${viewHead('Legal Center','Policies and terms for the Scen platform.','')}<div class="legal-tabs">${Object.entries(legalDocs).map(([k,v])=>`<button class="chip ${state.legalTab===k?'active':''}" data-nav="${legalRouteForTab(k)}">${escB(v.title)}</button>`).join('')}</div><article class="card legal-doc"><span class="caps">${escB(state.brandProfile.name)}</span><h2>${escB(d.title)}</h2><p>${escB(d.intro)}</p>${d.sections.map(x=>`<h3>${escB(x[0])}</h3><p>${escB(x[1])}</p>`).join('')}<h3>Contact</h3><p>Use the final company support and privacy contact details once the brand entity and domain are confirmed.</p></article>`};
  Object.keys(LEGAL_ROUTES).forEach(r=>views[r]=views.legal);

  // Public preset gallery — reachable signed out, unlike the gated /templates
  // manager. Same TEMPLATES data and card markup as that internal view, minus
  // the auth-only "Customize" action; each card opens the already-public
  // /preset/<name> page.
  views.presets=()=>`${viewHead('Presets','Premium starting points — open any one full-screen, then make it yours.','')}<div class="template-grid">${TEMPLATES.map((t,i)=>`<article class="template card"><div class="template-preview t${(i%3)+1}"><div class="mini-browser"></div></div><div class="template-info"><b>${t.name}</b><div class="row"><span class="tiny muted">${t.category}${t.sections?' · '+t.sections.length+' sections':''}</span><a class="btn primary" href="/preset/${encodeURIComponent(t.name.toLowerCase())}">Preview →</a></div></div></article>`).join('')}</div>`;

  views.onboarding=()=>{const step=state.onboardingStep||1;const c=onboardingCopy.onboarding[step-1];const bodies=[
    `<div class="field"><label>Your name</label><input id="obName" value="" placeholder="Your name"/></div><div class="field"><label>Workspace name</label><input id="obWorkspace" value="${escB(state.workspaceName||'Studio Workspace')}"/></div><div class="polish-note tiny">We use this only to personalize your workspace and saved projects.</div>`,
    `<div class="choice-grid">${['Business websites','SaaS & startups','Real estate','Portfolio','E-commerce','Agency'].map(x=>`<button class="choice ${state.category===x?'active':''}" data-obchoice="${x}"><b>${x}</b><div class="tiny muted" style="margin-top:6px">Tune starter sections and prompts</div></button>`).join('')}</div>`,
    `<div class="choice-grid">${[['Cinematic dark','Depth, contrast and spatial motion'],['Editorial light','Warm surfaces and restrained motion'],['Bold experimental','Large type and expressive transitions']].map((x,i)=>`<button class="choice ${i===0?'active':''}"><b>${x[0]}</b><div class="tiny muted" style="margin-top:6px">${x[1]}</div></button>`).join('')}</div>`,
    `<div class="admin-banner"><span class="dot"></span><div><b>${escB(state.workspaceName||'Studio Workspace')} is ready</b><div class="tiny muted">Start from a sentence, preset, reference or empty canvas. Provider credentials are not needed yet.</div></div></div><div class="row" style="margin-top:12px"><span class="pill">Autosave ready</span><span class="pill">Responsive system ready</span><span class="pill">API phase locked</span></div>`
  ];return `<div class="onboard card" style="padding:28px">${viewHead(c[1],c[2])}<div class="flow-stepper">${[1,2,3,4].map(i=>`<i class="flow-step ${i<step?'done':i===step?'active':''}"></i>`).join('')}</div><span class="caps">${c[0]}</span>${bodies[step-1]}<div style="display:flex;gap:8px;margin-top:20px"><button class="btn" data-action="onboardBack" ${step===1?'disabled':''}>← Back</button><span class="grow"></span><button class="btn primary" data-action="onboardNext">${step===4?'Create first project →':'Continue →'}</button></div></div>`};

  views.admin=()=>`${viewHead('Admin Command Center','Operate the product without mixing provider secrets into day-to-day configuration.',`<button class="btn" data-nav="auditlogs">Audit logs</button><button class="btn primary" data-nav="integrations">API & Keys · LAST →</button>`)}<div class="admin-banner"><span class="dot"></span><div><b>${escB(state.brandProfile.name)} · ${escB(state.adminLaunchMode)}</b><div class="tiny muted">Product configuration is active. External credentials remain disconnected until final approval.</div></div><span class="grow"></span><span class="status-chip good">Core product online</span></div><div class="admin-polish-grid"><section class="card admin-polish-card span-8"><div class="row"><div><span class="caps">Platform health</span><h3 style="margin:5px 0">Everything before provider integration</h3></div><span class="grow"></span><button class="btn" data-nav="preapiaudit">Open pre-API audit</button></div><div class="admin-health"><div><span class="tiny muted">Users</span><b>${(state.siteUsers||[]).length}</b><span class="tiny muted">Members</span></div><div><span class="tiny muted">Projects</span><b>${(state.projects||[]).length}</b><span class="tiny muted">In this workspace</span></div><div><span class="tiny muted">Published</span><b>${(state.projects||[]).filter(p=>p.status==='Published').length}</b><span class="tiny muted">Live sites</span></div><div><span class="tiny muted">QA score</span><b>—</b><span class="tiny muted">Run an audit</span></div></div></section><aside class="card admin-polish-card span-4"><span class="caps">Brand identity</span><h3 class="brand-mini"><i></i>${escB(state.brandProfile.name)}</h3><p class="small muted">${escB(state.brandProfile.tagline)}</p><button class="btn" data-nav="brandstudio">Edit Brand Studio</button></aside><section class="card admin-polish-card span-6"><span class="caps">Product controls</span>${[['Plans & credits','Billing configuration','billing'],['Templates','Marketplace and presets','templates'],['Roles & permissions','Workspace governance','roles'],['Security','Sessions and account protection','security'],['Email copy','Transactional template content','notifications']].map(x=>`<div class="admin-config-row"><div><b>${x[0]}</b><div class="tiny muted">${x[1]}</div></div><span class="grow"></span><button class="btn ghost" data-nav="${x[2]}">Open →</button></div>`).join('')}</section><section class="card admin-polish-card span-6"><span class="caps">Launch surfaces</span>${[['Help & Docs','Final product guidance','helpdocs'],['Legal Center','Policies and acceptable use','legal'],['Product Copy','Onboarding and empty states','copycenter'],['Performance','Assets and runtime readiness','performance'],['Monitoring','Error and 404 visibility','monitoring']].map(x=>`<div class="admin-config-row"><div><b>${x[0]}</b><div class="tiny muted">${x[1]}</div></div><span class="grow"></span><button class="btn ghost" data-nav="${x[2]}">Review →</button></div>`).join('')}</section><section class="card admin-polish-card span-8"><span class="caps">Launch sequence</span><h3>Approve product first. Connect providers second.</h3><div class="launch-lock"><b>1. Product behavior ✓ &nbsp; 2. Brand/copy review ◌ &nbsp; 3. Legal review ◌ &nbsp; 4. API & Keys 🔒</b><p class="tiny muted">This keeps provider setup from hiding incomplete product flows.</p></div></section><aside class="card admin-polish-card span-4"><span class="caps">Last phase</span><h3>API & Keys</h3><p class="small muted">AI, image, video, payment, auth, email, deployment and analytics credentials remain isolated.</p><button class="btn primary" data-nav="integrations">View locked center →</button></aside></div>`;

  const handled=new Set(['saveBrandProfile','setCopyTab','clearHelpSearch']);
  document.addEventListener('click',e=>{const a=e.target.closest('[data-action]');if(!a||!handled.has(a.dataset.action))return;e.preventDefault();e.stopImmediatePropagation();
    if(a.dataset.action==='saveBrandProfile'){persistBrand();applyBrandChrome();render('brandstudio');toast('Brand identity applied across the product');return}
    if(a.dataset.action==='setCopyTab'){state.copyTab=a.dataset.copyTab;persistBrand();render('copycenter');return}
    if(a.dataset.action==='clearHelpSearch'){state.helpQuery='';persistBrand();render('helpdocs');return}
  },true);
  document.addEventListener('input',e=>{
    const f=e.target.closest('[data-brand-field]');if(f){state.brandProfile[f.dataset.brandField]=f.value;persistBrand();applyBrandChrome();return}
    if(e.target.id==='helpSearchInput'){state.helpQuery=e.target.value;persistBrand();const r=document.querySelector('#helpResults');if(r)r.innerHTML=helpResultHtml();return}
  },true);
  document.addEventListener('change',e=>{const f=e.target.closest('[data-brand-field]');if(f){state.brandProfile[f.dataset.brandField]=f.value;persistBrand();applyBrandChrome()}},true);
  persistBrand();applyBrandChrome();
})();


// Where a load lands. Every workspace screen has its own address now, so the
// URL decides the route instead of the last route the browser remembered.
// Paths this router does not own — a published site, a preset, the studio —
// return null and are left to the branches below.
const RESERVED_PATHS=new Set(['s','preset','agent','api','assets']);
function routeFromPath(path){
  const seg=String(path||'/').replace(/^\/+|\/+$/g,'');
  if(!seg)return 'marketing';
  if(seg.indexOf('/')>=0)return null;      // /s/:slug and /preset/:id are not app routes
  if(!/^[a-z0-9-]+$/i.test(seg))return null;
  if(seg.toLowerCase()==='login')return 'auth';
  return RESERVED_PATHS.has(seg.toLowerCase())?null:seg.toLowerCase();
}
function pathForRoute(route){
  if(!route||route==='marketing')return '/';
  return route==='auth'?'/login':'/'+route;
}

// default landing
const _preset=presetFromPath();
const _isAgent=/^\/agent\/?$/i.test(location.pathname);
const _siteSlug=(location.pathname.match(/^\/s\/([a-z0-9-]{3,48})\/?$/i)||[])[1];
const _wanted=routeFromPath(location.pathname);
if(_siteSlug){showPublishedSite(_siteSlug).then(ok=>{if(!ok)navigate('marketing')})}
else if(_preset){showPreset(_preset)}else restoreSession().then(ok=>{
  // The session can land before the later scripts have even run, so the URL
  // layer may not exist yet. It reads this to know the boot already settled.
  window.__scenBooted=true;
  if(_isAgent){
    // the studio lives at a real path so it can be opened in its own tab
    history.replaceState({},'','/');
    if(ok)navigate(agentRoute());
    else{state.agentEntry=true;saveState();navigate('auth')}
    return;
  }
  // "/" is the public page for everyone, signed in or not. A saved route used
  // to hijack it, which meant a customer with a session could not reach the
  // home page at all. navigate() still gates anything private behind auth and
  // remembers it in pendingRoute, so /publish signed out lands on /publish
  // once they are in.
  if(_wanted==='auth'&&ok){navigate('dashboard');return}   // /login with a session is a dead end
  if(_wanted){
    navigate(_wanted);
    // navigate() redirects synchronously when a route is gated — private
    // routes to the sign-in screen, staff-only ones to the dashboard — and the
    // address bar has to say where you actually ended up. Done here rather
    // than in the URL layer because that layer may not have loaded yet.
    // 'marketing' is excluded: the preloader defers that one, so state.route
    // is deliberately not final when this line runs.
    if(_wanted!=='marketing'&&state.route!==_wanted){
      try{history.replaceState({},'',pathForRoute(state.route)+location.search)}catch(e){}
    }
    return;
  }
  if(ok&&state.route&&state.route!=='marketing'&&state.route!=='auth')navigate(state.route);
  else if(ok)navigate(resumeRoute());
  else navigate('marketing');
});
