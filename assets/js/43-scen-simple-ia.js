
/* ──────────────────────────────────────────────────────────────────────────
   Scen — simplified information architecture.

   This is the last layer in index.html, so every definition here wins. It does
   not delete a single view, route or handler: the 89 views all still render and
   every legacy route still resolves. What changes is which of them a normal
   customer is shown by default.

   Structure:
     1. ROUTES   the migration map — old route → where it lives now
     2. mode     simple (default) / advanced, persisted per browser
     3. shell    sidebar, mobile tab bar, heading vocabulary
     4. views    the new hub views
   ────────────────────────────────────────────────────────────────────────── */
(function(){
'use strict';

/* ── 1. Route migration map ────────────────────────────────────────────────
   Every technical route in the product, with the place it now lives. Nothing
   here is a redirect: the routes themselves are untouched and still work if
   typed, bookmarked or linked from an old email. This is what builds the
   Advanced Tools index and what the hubs read to know what to offer. ── */
var ROUTES={
  /* Generated files and version history are builder panels, not routes, so they
     are not listed as tools here — the note under the group says where they are
     rather than offering a link that would land somewhere else. */
  build:{label:'Build',icon:'code',note:'Generated files and version history live in the builder’s Ship panel.',items:[
    ['customcode','Code','Snippets, embeds and custom CSS'],
    ['activity','Build Activity','Publishing, orders, team and system events'],
    ['recovery','Autosave & Recovery','Local-first protection for every change'],
    ['backups','Backups','Portable project snapshots']
  ]},
  design:{label:'Design',icon:'spark',items:[
    ['designtokens','Design Tokens','Colour, radius, spacing, type, depth'],
    ['variants','Components & Variants','Reusable visual states'],
    ['breakpoints','Breakpoints','Exact responsive widths'],
    ['motionlab','Motion Lab','Timing, easing and keyframes'],
    ['motionstudio','Motion Studio','Type, frames, sound cues, transitions'],
    ['scenes','3D Scene Library','Spatial scene patterns'],
    ['scenecomposer','Scene Composer','Hierarchy, constraints, comparisons'],
    ['assetstudio','3D Assets & Materials','Objects, materials, environments'],
    ['effects','Effects & Physics','Particles, physics, atmosphere'],
    ['precision','Precision Editing','Snap, align, multi-select, group'],
    ['interactions','Interaction & Lighting','Cursor behaviour, magnetics, lighting'],
    ['sequencer','Cinematic Sequencer','Chapters, camera moves, transitions']
  ]},
  developer:{label:'Developer',icon:'plug',items:[
    ['integrations','Integrations & API Keys','Providers and server-side secrets'],
    ['aigateway','AI Gateway','Provider routing and model configuration'],
    ['imagegateway','Image Gateway','Image generation providers'],
    ['videogateway','Video Gateway','Video generation providers and job log'],
    ['dbstorage','Database & Storage','Schema, migrations, buckets'],
    ['vercelconnector','Deployment Connector','Project, environment and deploy targets'],
    ['authemail','Authentication & Email','Identity and transactional email control plane'],
    ['handoff','Export & Handoff','Package a project for engineering']
  ]},
  operations:{label:'Operations',icon:'gear',items:[
    ['performance','Performance','Payload, LCP, media preparation'],
    ['monitoring','Error Monitor','Broken routes and runtime warnings'],
    ['auditlogs','Audit Logs','Publishing, admin, team, billing, security'],
    ['security','Security','Sessions, login protection, workspace controls'],
    ['roles','Roles & Permissions','What each workspace role can do'],
    ['redirects','Redirects & 404','URL migrations and the custom 404'],
    ['production','Production','Everything needed to run the finished site'],
    ['productionready','Production Readiness','Architecture, safety and launch gates'],
    ['billingops','Billing Operations','Plans, wallets and payment state'],
    ['preapiaudit','Pre-API Audit','Completion gate before provider keys'],
    ['finalqa','Final QA Sweep','Routes, actions, responsive, performance'],
    ['uxstates','UX States Lab','Loading, empty, error and success states'],
    ['mobileqa','Mobile Polish','Touch-first controls, safe areas'],
    ['uxpolish','Final Product Polish','Actions, responsive, a11y, motion'],
    ['clientreview','Client Review','Pin feedback to 3D objects, compare branches'],
    ['accessibility','Accessibility','Motion, contrast, focus, semantics'],
    ['admin','Admin Command Center','Platform administration']
  ]}
};

/* Client-facing vocabulary. The technical name stays in Advanced Mode — this
   only rewrites the heading a normal customer reads. (Spec §24.) */
var RENAME={
  aigateway:'AI', domains:'Domain', dbstorage:'Data', authemail:'Login & Users',
  monitoring:'Site Health', activity:'Activity', integrations:'Connections',
  cms:'Content', localization:'Languages', notifications:'Email Templates',
  onboardingcenter:'Product Tour', launchcheck:'Launch Checklist'
};

/* ── 2. Mode ── */
var MODE_KEY='scen.uimode';
function mode(){try{return localStorage.getItem(MODE_KEY)==='advanced'?'advanced':'simple'}catch(e){return 'simple'}}
function setMode(m){
  try{localStorage.setItem(MODE_KEY,m)}catch(e){}
  document.body.classList.toggle('sx-advanced',m==='advanced');
  buildSidebar();
  if(typeof state!=='undefined'&&state.route)try{render(state.route)}catch(e){}
  toast(m==='advanced'?'Technical names on — the sidebar stays as it is':'Plain names on — Advanced Tools is still at the foot of the sidebar');
}
window.scenUiMode=mode;

/* ── 3. Icons ── one stroked family, no emoji, no mixed glyph sets ── */
var PATHS={
  home:'M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5',
  grid:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  spark:'M12 3v6M12 15v6M3 12h6M15 12h6M6.4 6.4l3 3M14.6 14.6l3 3M17.6 6.4l-3 3M9.4 14.6l-3 3',
  pages:'M6 3h8l4 4v14H6zM14 3v4h4',
  media:'M3 6h18v13H3zM3 15l5-4 4 3 3-3 6 5M8.5 10a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4',
  chart:'M4 20V10M10 20V4M16 20v-7M22 20H2',
  plug:'M9 3v6M15 3v6M6 9h12v3a6 6 0 0 1-12 0zM12 18v3',
  rocket:'M12 3c3.5 2 5.5 5.5 5.5 9.5L12 17l-5.5-4.5C6.5 8.5 8.5 5 12 3zM12 9.5a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8M8 17l-2 4 4-2M16 17l2 4-4-2',
  gear:'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4M19.3 14.4a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.8-1.1V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.4 1z',
  help:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M9.6 9.2a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.5M12 16.8h.01',
  tools:'M14.5 5.5a4 4 0 0 1 5 5l-9 9-5 1 1-5zM13 7l4 4',
  card:'M3 7h18v11H3zM3 11h18',
  user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4.5 20a7.5 7.5 0 0 1 15 0',
  eye:'M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12m10 2.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2',
  dots:'M5 12h.01M12 12h.01M19 12h.01',
  check:'M4.5 12.5 9.5 17.5 19.5 6.5',
  bolt:'M13 3 5 13.5h6L10.5 21 19 10.5h-6z',
  globe:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3.2 9h17.6M3.2 15h17.6M12 3c2.4 2.4 3.6 5.4 3.6 9S14.4 18.6 12 21c-2.4-2.4-3.6-5.4-3.6-9S9.6 5.4 12 3',
  db:'M12 7.5c4.4 0 8-1 8-2.2S16.4 3 12 3 4 4 4 5.3s3.6 2.2 8 2.2M4 5.3v13.4C4 20 7.6 21 12 21s8-1 8-2.3V5.3M4 12c0 1.3 3.6 2.3 8 2.3s8-1 8-2.3',
  lock:'M6 10.5h12V21H6zM8.7 10.5V7.2a3.3 3.3 0 0 1 6.6 0v3.3',
  mail:'M3 6h18v12H3zM3 6.6l9 6.4 9-6.4',
  box:'M12 3 21 7.5v9L12 21 3 16.5v-9zM3 7.5l9 4.5 9-4.5M12 12v9',
  code:'M8.5 8 4 12l4.5 4M15.5 8 20 12l-4.5 4M13.5 4.5 10.5 19.5'
};
function ic(n){return '<svg class="sx-i" viewBox="0 0 24 24" aria-hidden="true"><path d="'+(PATHS[n]||PATHS.dots)+'"/></svg>'}
window.scenIcon=ic;

/* ── 4. Sidebar ────────────────────────────────────────────────────────────
   Rebuilt from scratch each time so mode changes are a single source of truth.
   Every entry navigates through the existing router, so nothing about routing,
   gating or state changes — only what is listed.

   The sidebar carries the customer's job and nothing else: the work of making,
   filling and publishing a website. Every technical tool lives on the Advanced
   Tools page, one click away at the foot of the bar. Advanced Mode used to
   empty all forty of them into this column, which is what made the bar
   unreadable; it now only decides whether headings read in the customer's
   words or the technical ones, and it is switched from that page. ── */
var SIMPLE=[
  {label:'Main',items:[['dashboard','Home','home'],['projects','Projects','grid']]},
  {label:'Current project',items:[
    ['pages','Pages','pages'],
    ['media','Media','media'],
    ['business','Business','chart'],
    ['connections','Connections','plug'],
    ['publish','Publish','rocket']
  ]}
];

function link(route,label,icon,cls){
  return '<a class="side-link '+(cls||'')+'" data-route="'+route+'" data-nav="'+route+'">'+ic(icon)+'<span>'+label+'</span></a>';
}

function buildSidebar(){
  var bar=document.querySelector('.app-sidebar');
  if(!bar)return;
  var html='<button class="new-project" data-nav="create">＋ New project</button>';

  SIMPLE.forEach(function(g){
    html+='<div class="nav-group"><div class="nav-label">'+g.label+'</div>';
    g.items.forEach(function(it){html+=link(it[0],it[1],it[2])});
    html+='</div>';
  });

  html+='<div class="sx-sidefoot">'+
    link('settings','Settings','gear')+
    link('help','Help','help')+
    '<a class="side-link sx-adv" data-route="advanced" data-nav="advanced">'+ic('tools')+'<span>Advanced Tools</span><span class="sx-chev">›</span></a>'+
    creditBlock()+
    link('settings','Profile','user')+
  '</div>';

  bar.innerHTML=html;
  if(window.__applyAdminUI)window.__applyAdminUI();
  if(typeof state!=='undefined'&&state.route)setActiveNav(state.route);
}
window.scenBuildSidebar=buildSidebar;

/* Credits stay visible but must not dominate (spec §97). Shown only once the
   server has actually reported a balance — never as an invented number. */
function creditBlock(){
  var c=(typeof state!=='undefined')?state.credits:null;
  if(c===null||c===undefined||!isFinite(Number(c)))
    return '<a class="sx-credit" data-nav="billing"><div class="sx-row"><span class="tiny muted">Plan &amp; credits</span><span class="tiny muted">View</span></div></a>';
  var pct=Math.max(2,Math.min(100,Math.round(Number(c)/25000*100)));
  return '<a class="sx-credit" data-nav="billing"><div class="sx-row"><span class="tiny muted">Credits</span><b style="font-size:12.5px">'+Number(c).toLocaleString()+'</b></div><div class="sx-cbar"><i style="width:'+pct+'%"></i></div></a>';
}

/* ── 5. Mobile tab bar ── */
var TABS=[['builder','Builder','spark'],['preview','Preview','eye'],['business','Business','chart'],['publish','Publish','rocket'],['more','More','dots']];
function buildTabbar(){
  if(document.getElementById('sxTabbar'))return;
  var n=document.createElement('nav');
  n.id='sxTabbar';n.setAttribute('aria-label','Main');
  n.innerHTML=TABS.map(function(t){
    return '<button data-sx="tab" data-tab="'+t[0]+'" aria-label="'+t[1]+'">'+ic(t[2])+'<span>'+t[1]+'</span></button>';
  }).join('');
  document.body.appendChild(n);
  var s=document.createElement('div');
  s.id='sxSheet';s.className='sx-sheet';
  s.innerHTML='<div class="sx-sheet-bd" data-sx="sheetClose"></div><div class="sx-sheet-panel" role="dialog" aria-modal="true" aria-label="More"><div class="sx-sheet-grab"></div><div id="sxSheetBody"></div></div>';
  document.body.appendChild(s);
}
function syncTabbar(route){
  var bar=document.getElementById('sxTabbar');if(!bar)return;
  document.body.classList.toggle('sx-inapp',route!=='marketing'&&route!=='auth'&&!!route);
  var map={builder:'builder',aibuilder:'builder',business:'business',publish:'publish',connections:'more',settings:'more',pages:'more',media:'more'};
  var on=map[route]||'';
  [].forEach.call(bar.querySelectorAll('button'),function(b){b.classList.toggle('on',b.dataset.tab===on)});
}
/* The preloader defers a navigation to the public page and returns early, so
   the wrappers below can run while state.route still names the old screen —
   which left the phone tab bar sitting on the landing page for anyone who had
   used the workspace before. The URL layer watches the route for real and
   calls this once it has settled. */
window.__scenSyncTabbar=syncTabbar;

function openSheet(){
  var body=document.getElementById('sxSheetBody');if(!body)return;
  var items=[['pages','Pages','pages'],['media','Media','media'],['connections','Connections','plug'],
             ['settings','Settings','gear'],['help','Help','help'],['advanced','Advanced Tools','tools'],
             ['dashboard','Home','home'],['projects','Projects','grid']];
  body.innerHTML='<div class="sx-advgrid">'+items.map(function(i){
    return '<button class="sx-tool" data-nav="'+i[0]+'">'+ic(i[2])+i[1]+'</button>';
  }).join('')+'</div>';
  document.getElementById('sxSheet').classList.add('on');
}
function closeSheet(){var s=document.getElementById('sxSheet');if(s)s.classList.remove('on')}

/* ── 6. Delegated events for this layer ────────────────────────────────────
   A private attribute so none of the 516 existing data-action handlers are
   touched or shadowed. ── */
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-sx]');if(!t)return;
  var k=t.dataset.sx;
  if(k==='mode'){e.preventDefault();setMode(t.dataset.mode);return}
  if(k==='tab'){
    e.preventDefault();
    var tab=t.dataset.tab;
    if(tab==='more'){openSheet();return}
    closeSheet();
    if(tab==='preview'){
      /* The preview modal is an action, not a route. Open the real one. */
      var pv=document.querySelector('[data-action="preview"]');
      if(pv){pv.click();return}
      navigate('builder');return;
    }
    navigate(tab==='builder'?'builder':tab);
    return;
  }
  if(k==='sheetClose'){e.preventDefault();closeSheet();return}
},false);

/* ── 7. Router hooks ───────────────────────────────────────────────────────
   navigate() and render() are wrapped, never replaced: the originals keep all
   their gating, admin blocking and builder behaviour. ── */
var baseNavigate=window.navigate||navigate;
window.navigate=function(route){
  closeSheet();
  var r=baseNavigate.apply(this,arguments);
  try{syncTabbar(state.route)}catch(e){}
  return r;
};
/* The inline scripts call the bare identifier, so rebind it too where possible. */
try{navigate=window.navigate}catch(e){}

var baseRender=window.render||render;
window.render=function(route){
  var r=baseRender.apply(this,arguments);
  /* applyAdminUI runs before render() inside navigate(), so staff-only cards
     drawn by a view would otherwise stay visible to everyone. */
  try{if(window.__applyAdminUI)window.__applyAdminUI()}catch(e){}
  try{hideEmptySections()}catch(e){}
  try{applyVocabulary()}catch(e){}
  try{syncTabbar(route)}catch(e){}
  return r;
};
try{render=window.render}catch(e){}

/* A group whose every tool is staff-only must not leave a heading with nothing
   under it — the same rule applyAdminUI() applies to sidebar groups. */
function hideEmptySections(){
  var secs=document.querySelectorAll('#appMain .sx-sect');
  for(var i=0;i<secs.length;i++){
    var tools=secs[i].querySelectorAll('.sx-tool');
    if(!tools.length)continue;
    var shown=0;
    for(var j=0;j<tools.length;j++)if(tools[j].style.display!=='none')shown++;
    secs[i].style.display=shown?'':'none';
  }
}

/* Simple Mode reads in the customer's words. Advanced Mode keeps the technical
   name, because that is what its documentation and support answers use. */
function applyVocabulary(){
  if(mode()==='advanced')return;
  var r=(typeof state!=='undefined')?state.route:'';
  var name=RENAME[r];if(!name)return;
  var h=document.querySelector('#appMain .view-head h1');
  if(h&&h.textContent.trim()!==name)h.textContent=name;
}

/* ── 8. Home ───────────────────────────────────────────────────────────────
   Rebuilt around "what should I do next?" instead of a metric wall. ── */
function statusOf(p){return p&&p.status?String(p.status):'Draft'}
function statusClass(s){
  if(s==='Published')return 'ok';
  if(s==='Building')return 'busy';
  if(s==='Needs Attention')return 'err';
  if(s==='Ready')return 'ok';
  return '';
}
function projectCardHtml(p,i){
  var s=statusOf(p);
  return '<article class="sx-pcard" data-sx="openProject" data-idx="'+i+'">'+
    '<div class="sx-pshot">'+(p.name||'Untitled').slice(0,1).toUpperCase()+'</div>'+
    '<div class="sx-pbody"><b>'+escV(p.name||'Untitled')+'</b>'+
      '<div class="sx-pmeta"><span class="sx-st '+statusClass(s)+'">'+escV(s)+'</span>'+
      (p.domain?'<span>'+escV(p.domain)+'</span>':'')+
      '<span>'+escV(p.updated||'Not edited yet')+'</span></div>'+
    '</div></article>';
}

/* Activity a customer cares about, drawn from what the product actually
   recorded. Build logs stay in Advanced Tools → Build Activity. */
function recentActivity(){
  var out=[];
  (state.activityNotifications||[]).slice(0,6).forEach(function(a){
    out.push([a.title||a.name||'Update',a.time||a.date||'',a.icon||'check']);
  });
  if(state.publishSettings&&state.publishSettings.lastPublished)
    out.push(['Website published',String(state.publishSettings.lastPublished),'rocket']);
  (state.domains||[]).filter(function(d){return d.status==='Live'}).slice(0,2).forEach(function(d){
    out.push(['Domain connected — '+(d.name||d.host||''),'','globe']);
  });
  if((state.leads||[]).length)out.push([(state.leads||[]).length+' leads captured','From your forms','user']);
  return out.slice(0,6);
}

views.dashboard=function(){
  var ps=(state.projects||[]);
  var acts=recentActivity();
  var h='<div class="sx-hero"><div>'+
      '<h1>'+escV(typeof greeting==='function'?greeting():'Welcome back')+'</h1>'+
      '<p>Pick up where you left off, or start something new.</p></div>'+
      '<button class="btn primary" data-nav="create">＋ Create website</button></div>';

  h+='<div class="sx-sect"><h3>Continue working</h3>';
  if(ps.length){
    h+='<div class="sx-grid">'+ps.slice(0,6).map(projectCardHtml).join('')+'</div>';
  }else{
    h+='<div class="sx-empty" style="margin-top:11px"><b>No websites yet</b>'+
       '<p>Describe your business in a sentence and Scen will plan the pages, write the copy and build the site for you.</p>'+
       '<button class="btn primary" data-nav="create">＋ Create your first website</button></div>';
  }
  h+='</div>';

  h+='<div class="sx-sect"><h3>Recent activity</h3><div class="card" style="margin-top:11px;padding:4px 15px">';
  if(acts.length){
    h+=acts.map(function(a){
      return '<div class="sx-act">'+ic(a[2])+'<div><b>'+escV(a[0])+'</b><span>'+escV(a[1])+'</span></div></div>';
    }).join('');
  }else{
    h+='<div class="sx-act">'+ic('check')+'<div><b>Nothing has happened yet</b><span>Publishing, new leads, orders and connections will show up here.</span></div></div>';
  }
  h+='</div></div>';

  h+='<div class="sx-sect"><h3>Quick actions</h3><div class="sx-advgrid">'+
     '<button class="sx-tool" data-nav="create">'+ic('spark')+'Create website</button>'+
     '<button class="sx-tool" data-nav="templates">'+ic('grid')+'Browse templates</button>'+
     '<button class="sx-tool" data-nav="connections">'+ic('globe')+'Connect a domain</button>'+
     '<button class="sx-tool" data-nav="leads">'+ic('user')+'View leads</button>'+
     '</div></div>';
  return h;
};

/* ── 9. Projects ── */
views.projects=function(){
  var all=(state.projects||[]).slice();
  var arch=(state.archivedProjects||[]);
  var f=state.projectFilter||'All';
  var q=String(state.projectQuery||'').toLowerCase();
  var list=(f==='Archived'?arch:all).filter(function(p){
    if(f!=='All'&&f!=='Archived'&&statusOf(p)!==f)return false;
    if(q&&String(p.name||'').toLowerCase().indexOf(q)<0)return false;
    return true;
  });
  var chips=['All','Draft','Building','Published','Archived'];
  var h=viewHead('Projects','Create, organize and publish every website.',
        '<button class="btn primary" data-nav="create">＋ New project</button>');
  h+='<div class="sx-row" style="gap:12px;flex-wrap:wrap;margin-bottom:6px">'+
     '<div class="filters" style="margin:0">'+chips.map(function(c){
       return '<button class="chip '+(c===f?'active':'')+'" data-sx="pfilter" data-f="'+c+'">'+c+'</button>';
     }).join('')+'</div>'+
     '<input id="sxProjQ" placeholder="Search projects" value="'+escV(state.projectQuery||'')+'" '+
       'style="flex:1;min-width:180px;max-width:300px;padding:9px 12px;border:1px solid var(--line);border-radius:11px;background:#0b0b0f;color:#fff;font-size:13px"/>'+
     '</div>';
  if(list.length){
    h+='<div class="sx-grid">'+list.map(projectCardHtml).join('')+'</div>';
  }else if(all.length||arch.length){
    h+='<div class="sx-empty" style="margin-top:14px"><b>Nothing matches</b><p>No project matches this filter or search.</p>'+
       '<button class="btn" data-sx="pfilter" data-f="All">Show all projects</button></div>';
  }else{
    h+='<div class="sx-empty" style="margin-top:14px"><b>No projects yet</b>'+
       '<p>Every website you create lives here — drafts, published sites and archived work.</p>'+
       '<button class="btn primary" data-nav="create">＋ Create website</button></div>';
  }
  return h;
};

document.addEventListener('click',function(e){
  var f=e.target.closest('[data-sx="pfilter"]');
  if(f){state.projectFilter=f.dataset.f;saveState();render('projects');return}
  var op=e.target.closest('[data-sx="openProject"]');
  if(op){
    var src=(state.projectFilter==='Archived')?(state.archivedProjects||[]):(state.projects||[]);
    var p=src[Number(op.dataset.idx)||0];
    if(p&&p.name){state.projectName=p.name;saveState()}
    navigate('builder');
    return;
  }
},false);
document.addEventListener('input',function(e){
  if(e.target&&e.target.id==='sxProjQ'){
    state.projectQuery=e.target.value;
    clearTimeout(window._sxpq);
    window._sxpq=setTimeout(function(){
      render('projects');
      var el=document.getElementById('sxProjQ');
      if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length)}
    },220);
  }
},false);

/* ── 10. Pages ─────────────────────────────────────────────────────────────
   The builder already owns page state; this is the same list at project
   level so a customer does not have to enter the editor to manage pages. ── */
views.pages=function(){
  var pages=(state.pages||[]);
  var h=viewHead('Pages','Every page on this website.',
        '<button class="btn primary" data-action="addPage">＋ Add page</button>');
  if(!pages.length){
    return h+'<div class="sx-empty"><b>No pages yet</b><p>Pages appear here once your website has been generated. Describe the site you want in Agent Studio and it will create them.</p><a class="btn primary" href="/agent-studio.html">Open Agent Studio</a></div>';
  }
  h+='<div class="table" style="margin-top:8px"><div class="tr header"><span>Page</span><span>Address</span><span>Type</span><span></span></div>';
  h+=pages.map(function(p){
    var dyn=(state.cmsBindings&&state.cmsBindings[p.id])?'<span class="sx-st">Content</span>':'<span class="tiny muted">Static</span>';
    var home=(p.slug==='/'||p.id===state.currentPageId&&p.slug==='/');
    return '<div class="tr"><b>'+escV(p.name||'Untitled')+(home?' <span class="tiny muted">· Home</span>':'')+'</b>'+
      '<span class="tiny muted">'+escV(p.slug||'/')+'</span>'+
      '<span>'+dyn+'</span>'+
      '<button class="btn ghost" data-sx="openPage" data-id="'+escV(p.id)+'">Edit</button></div>';
  }).join('');
  h+='</div>';
  h+='<p class="tiny muted" style="margin-top:12px">Rename, duplicate, SEO, set as home and delete are available on each page inside the builder.</p>';
  return h;
};
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-sx="openPage"]');if(!t)return;
  state.currentPageId=t.dataset.id;state.builderTab='pages';saveState();navigate('builder');
},false);

/* ── 11. Advanced Tools ────────────────────────────────────────────────────
   The index that makes hiding tools safe: every technical route in the
   product, grouped, one click away, with nothing removed. ── */
views.advanced=function(){
  var adv=mode()==='advanced';
  var groups=Object.keys(ROUTES);
  var total=groups.reduce(function(n,k){return n+ROUTES[k].items.length},0);
  var h=viewHead('Advanced Tools',
    'Every technical capability in Scen, '+total+' in all. None of it is needed to build, fill or publish a website — the sidebar already carries that work.',
    '<button class="btn'+(adv?' primary':'')+'" data-sx="mode" data-mode="'+(adv?'simple':'advanced')+'">'+
      (adv?'Using technical names':'Use technical names')+'</button>');

  /* Forty entries is more than anyone scans. The filter is the index. */
  h+='<div class="sx-advfind"><input id="sxAdvQ" type="search" placeholder="Search tools — payments, backups, redirects…" '+
     'aria-label="Search advanced tools" autocomplete="off"/>'+
     '<span class="tiny muted" id="sxAdvCount"></span></div>';

  groups.forEach(function(k){
    var g=ROUTES[k];
    h+='<div class="sx-sect"><h3>'+escV(g.label)+' <span class="sx-cnt">'+g.items.length+'</span></h3>'+
      (g.note?'<p class="sx-sub">'+g.note+'</p>':'')+
      '<div class="sx-advgrid">'+
      g.items.map(function(it){
        return '<button class="sx-tool sx-tool-2" data-nav="'+it[0]+'" data-find="'+escV((it[1]+' '+it[2]).toLowerCase())+'">'+
          ic(g.icon||'dots')+'<span class="sx-tw"><b>'+escV(it[1])+'</b><i>'+escV(it[2])+'</i></span></button>';
      }).join('')+'</div></div>';
  });
  return h;
};

/* The filter hides with a class, never with style.display: staff-only tools are
   hidden by applyAdminUI() writing display:none inline, and clearing that on a
   search would show a customer the admin routes. */
function filterAdvanced(q){
  q=String(q||'').trim().toLowerCase();
  var tools=document.querySelectorAll('#appMain .sx-tool-2'),shownAll=0;
  for(var i=0;i<tools.length;i++){
    var hit=!q||(tools[i].getAttribute('data-find')||'').indexOf(q)>=0;
    tools[i].classList.toggle('sx-hide',!hit);
    if(hit&&tools[i].style.display!=='none')shownAll++;
  }
  var secs=document.querySelectorAll('#appMain .sx-sect');
  for(var j=0;j<secs.length;j++){
    var list=secs[j].querySelectorAll('.sx-tool-2');
    if(!list.length)continue;
    var shown=0;
    for(var m=0;m<list.length;m++)
      if(!list[m].classList.contains('sx-hide')&&list[m].style.display!=='none')shown++;
    secs[j].classList.toggle('sx-hide',!shown);
  }
  var c=document.getElementById('sxAdvCount');
  if(c)c.textContent=q?(shownAll?shownAll+' match'+(shownAll===1?'':'es'):'No tool matches “'+q+'”'):'';
}

document.addEventListener('input',function(e){
  if(!e.target||e.target.id!=='sxAdvQ')return;
  filterAdvanced(e.target.value);
},false);

/* ── 12. Help ── one place, instead of Support / Docs / Tour / Legal ── */
views.help=function(){
  var h=viewHead('Help','Answers, a guided tour, and a way to reach us.');
  h+='<div class="sx-grid">'+
    '<button class="sx-card" data-nav="helpdocs"><div class="sx-head">'+ic('help')+'<b>Documentation</b></div><p>Search guides and the 15-minute build path.</p></button>'+
    '<a class="sx-card" href="/agent-studio.html"><div class="sx-head">'+ic('spark')+'<b>Ask AI</b></div><p>Describe what you are trying to do in Agent Studio and it will do it.</p></a>'+
    '<button class="sx-card" data-nav="onboardingcenter"><div class="sx-head">'+ic('check')+'<b>Product tour</b></div><p>A guided path through the product.</p></button>'+
    '<button class="sx-card" data-nav="support"><div class="sx-head">'+ic('mail')+'<b>Contact support</b></div><p>Report a bug, send feedback or request a feature.</p></button>'+
    '<button class="sx-card" data-sx="shortcuts"><div class="sx-head">'+ic('code')+'<b>Keyboard shortcuts</b></div><p>⌘K opens search and every action in the product.</p></button>'+
    '<button class="sx-card" data-nav="legal"><div class="sx-head">'+ic('lock')+'<b>Legal</b></div><p>Privacy, terms and acceptable use.</p></button>'+
  '</div>';
  return h;
};
document.addEventListener('click',function(e){
  if(!e.target.closest('[data-sx="shortcuts"]'))return;
  modal('<div class="modal-head"><b>Keyboard shortcuts</b><button class="close" data-action="closeModal">×</button></div>'+
    '<div class="modal-body"><div class="table"><div class="tr header"><span>Shortcut</span><span>Does</span></div>'+
    [['⌘K / Ctrl K','Search and run any action'],['⌘S / Ctrl S','Save the current project'],
     ['⌘Z / Ctrl Z','Undo'],['⇧⌘Z','Redo'],['Esc','Close a dialog or panel']].map(function(r){
      return '<div class="tr"><b>'+r[0]+'</b><span>'+r[1]+'</span></div>';
    }).join('')+'</div></div>');
},false);

/* ── 12b. Settings ── the sidebar has linked here twice (Settings, and the
   Profile entry above the fold) since the IA refactor, but nothing ever
   defined the view — both fell through to the dashboard silently. This is
   the account hub: who you are, and the real places account-level work
   happens — Security was gated as staff-only by a stale entry in
   __ADMIN_ROUTES (see 23-inline.js) and is fixed alongside this. ── */
views.settings=function(){
  var email=(state.auth&&state.auth.email)||'';
  var name=state.userName||(email?email.split('@')[0]:'');
  var h=viewHead('Settings','Your account, security and billing — one place instead of a scattered dead end.');
  if(name||email){
    var initial=(name||email||'S').slice(0,1).toUpperCase();
    h+='<div class="card" style="padding:18px 22px;margin-bottom:16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">'+
      '<span class="avatar" style="width:44px;height:44px;font-size:16px">'+escV(initial)+'</span>'+
      '<div><b>'+escV(name||email)+'</b>'+(email&&name?'<div class="tiny muted">'+escV(email)+'</div>':'')+'</div>'+
    '</div>';
  }
  h+='<div class="sx-grid">'+
    '<button class="sx-card" data-nav="billing"><div class="sx-head">'+ic('card')+'<b>Billing &amp; Credits</b></div><p>Your credit balance and how it is being spent.</p></button>'+
    '<button class="sx-card" data-nav="security"><div class="sx-head">'+ic('lock')+'<b>Security</b></div><p>Devices signed into your account, and signing any of them out.</p></button>'+
    '<button class="sx-card" data-nav="legal"><div class="sx-head">'+ic('lock')+'<b>Legal</b></div><p>Privacy, terms and acceptable use.</p></button>'+
    '<button class="sx-card" data-action="logout"><div class="sx-head">'+ic('bolt')+'<b>Sign out</b></div><p>End your session on this device.</p></button>'+
  '</div>';
  return h;
};

/* ── 13. Boot ── */
function boot(){
  document.body.classList.toggle('sx-advanced',mode()==='advanced');
  buildSidebar();
  buildTabbar();
  try{syncTabbar(state.route)}catch(e){}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();

/* The credit pill and sidebar balance come from the same server read. */
var baseLoadCredits=window.loadCredits;
if(typeof baseLoadCredits==='function'){
  window.loadCredits=function(){
    var p=baseLoadCredits.apply(this,arguments);
    Promise.resolve(p).then(function(){try{buildSidebar()}catch(e){}}).catch(function(){});
    return p;
  };
  try{loadCredits=window.loadCredits}catch(e){}
}
})();
