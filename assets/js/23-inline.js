
(function(){
  var mob=function(){return window.matchMedia('(max-width:760px)').matches};
  // Capture phase: read the previous tab before the main handler overwrites it,
  // so tapping the active icon closes the drawer instead of re-opening it.
  document.addEventListener('click',function(e){
    if(!mob())return;
    var t=e.target,bt=t&&t.closest?t.closest('[data-btab]'):null;
    if(bt){
      var open=document.body.classList.contains('bpanel');
      var st=(typeof state!=='undefined')?state:null;
      var same=open&&st&&st.builderTab===bt.dataset.btab;
      document.body.classList.toggle('bpanel',!same);
      // two 340px drawers cannot share a 375px screen
      document.body.classList.remove('rpanel');
      var pf=document.getElementById('mobProps');if(pf)pf.classList.remove('on');
      return;
    }
    var anyOpen=document.body.classList.contains('bpanel')||document.body.classList.contains('rpanel');
    if(anyOpen&&t.closest&&t.closest('.builder-canvas-wrap')){
      document.body.classList.remove('bpanel');
      document.body.classList.remove('rpanel');
      var f=document.getElementById('mobProps');if(f)f.classList.remove('on');
      e.preventDefault();e.stopPropagation();
    }
  },true);
  // --- staff-only surfaces -------------------------------------------------
  // Admin pages plus the roadmap's own build-gates ("Pre-API Audit", "PROTOTYPE
  // READINESS"...) must never reach a customer. The backend is the authority on
  // who is staff: every /api/admin route already requires a signed admin cookie,
  // so we ask it rather than trusting anything in the browser.
  window.__ADMIN_ROUTES=new Set(['admin','integrations','production','productionready',
    'preapiaudit','finalqa','uxstates','mobileqa','globalsearch',
    'auditlogs','security','roles','clientreview','handoff','uxpolish']);
  window.__isPlatformAdmin=false;
  function applyAdminUI(){
    document.body.classList.toggle('platform-admin',!!window.__isPlatformAdmin);
    window.__ADMIN_ROUTES.forEach(function(r){
      var sel='[data-nav="'+r+'"],[data-route="'+r+'"]';
      var links=document.querySelectorAll(sel);
      for(var i=0;i<links.length;i++)links[i].style.display=window.__isPlatformAdmin?'':'none';
    });
    // a group whose every link is staff-only should not leave a dangling label
    var groups=document.querySelectorAll('.nav-group');
    for(var g=0;g<groups.length;g++){
      var all=groups[g].querySelectorAll('.side-link'),shown=0;
      for(var j=0;j<all.length;j++)if(all[j].style.display!=='none')shown++;
      groups[g].style.display=(all.length&&!shown)?'none':'';
    }
  }
  window.__applyAdminUI=applyAdminUI;
  applyAdminUI();
  function refreshAdmin(){
    return fetch('/api/admin/session',{credentials:'same-origin'})
      .then(function(r){return r.json()})
      .then(function(d){window.__isPlatformAdmin=!!(d&&d.admin)})
      .catch(function(){window.__isPlatformAdmin=false})
      .then(applyAdminUI);
  }
  refreshAdmin();
  // Staff sign-in. Reaching #staff asks for the admin key and exchanges it for
  // the signed, httpOnly session cookie the /api/admin routes require. The key
  // is never stored in the page.
  function staffLogin(){
    var key=window.prompt('Admin key');
    if(!key)return;
    fetch('/api/admin/session',{method:'POST',credentials:'same-origin',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({key:key})})
      .then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d}})})
      .then(function(x){
        if(!x.ok){window.alert(x.d&&x.d.error||'Sign-in failed');return}
        return refreshAdmin().then(function(){window.alert('Staff access on')});
      })
      .catch(function(){window.alert('Sign-in failed')});
  }
  window.scenStaffLogin=staffLogin;
  window.scenStaffLogout=function(){
    return fetch('/api/admin/session',{method:'DELETE',credentials:'same-origin'})
      .then(refreshAdmin).then(function(){navigate('dashboard')});
  };
  if(location.hash==='#staff'){history.replaceState(null,'',location.pathname);staffLogin()}
  window.addEventListener('hashchange',function(){
    if(location.hash==='#staff'){history.replaceState(null,'',location.pathname);staffLogin()}
  });

  // --- builder rail: 19 flat icons -> 6 groups ------------------------------
  // The rail grew one icon per roadmap feature. Group them by task instead, and
  // drive every change through the app's own [data-btab] buttons so state,
  // persistence and re-render behaviour stay exactly as they were.
  var RAIL_GROUPS=[
    {icon:'▤',label:'Build',  tabs:['pages','components','layers','global']},
    {icon:'◇',label:'Design', tabs:['brand','media']},
    {icon:'◈',label:'3D Scene',tabs:['scenes','scenecomposer','assetstudio','effects','precision']},
    {icon:'〽',label:'Motion', tabs:['motionstudio','sequence','interactions']},
    {icon:'✦',label:'AI',     tabs:['ai']},
    {icon:'✓',label:'Ship',   tabs:['review','handoff','polish','history']}
  ];
  var RAIL_LAST={};
  var RAIL_LABELS={pages:'Pages',components:'Components',layers:'Layers',global:'Global',
    brand:'Brand',media:'Media',scenes:'Library',scenecomposer:'Composer',assetstudio:'Assets',
    effects:'Effects',precision:'Precision',motionstudio:'Studio',sequence:'Sequence',
    interactions:'Interactions',ai:'AI',review:'Review',handoff:'Handoff',polish:'Polish',
    history:'History'};
  function decorateRail(){
    var rail=document.querySelector('.builder-left .builder-tabs');
    if(!rail||rail.dataset.grouped==='1')return;
    var originals={},any=false;
    var list=rail.querySelectorAll('[data-btab]');
    for(var i=0;i<list.length;i++){originals[list[i].dataset.btab]=list[i];list[i].style.display='none';any=true}
    if(!any)return;
    var active=(typeof state!=='undefined'&&state.builderTab)?state.builderTab:'pages';
    var group=null;
    for(var g=0;g<RAIL_GROUPS.length;g++){
      if(RAIL_GROUPS[g].tabs.indexOf(active)>=0){group=RAIL_GROUPS[g];break}
    }
    if(!group)group=RAIL_GROUPS[0];
    RAIL_LAST[group.label]=active;
    RAIL_GROUPS.forEach(function(gr){
      var members=gr.tabs.filter(function(t){return originals[t]});
      if(!members.length)return;
      var b=document.createElement('button');
      b.type='button';
      b.className='btab btab-group'+(gr===group?' active':'');
      b.title=gr.label;b.setAttribute('aria-label',gr.label);
      b.textContent=gr.icon;
      b.addEventListener('click',function(e){
        e.preventDefault();
        // reopening a group returns to whichever member was last used in it
        var remembered=RAIL_LAST[gr.label];
        var target=members.indexOf(remembered)>=0?remembered:members[0];
        originals[target].click();
      });
      rail.appendChild(b);
    });
    rail.dataset.grouped='1';
    var panel=document.querySelector('.builder-left .builder-panel');
    var members=group.tabs.filter(function(t){return originals[t]});
    if(panel&&members.length>1&&!panel.querySelector('.btab-sub-row')){
      var row=document.createElement('div');
      row.className='btab-sub-row';
      members.forEach(function(t){
        var s=document.createElement('button');
        s.type='button';
        s.className='btab-sub'+(t===active?' on':'');
        s.textContent=RAIL_LABELS[t]||t;
        s.addEventListener('click',function(){originals[t].click()});
        row.appendChild(s);
      });
      panel.insertBefore(row,panel.firstChild);
    }
  }
  // --- inspector: 9 tabs -> 4 groups ----------------------------------------
  var PROP_GROUPS=[
    {label:'Design',tabs:['design','device']},
    {label:'Motion',tabs:['motion','scene','interact']},
    {label:'SEO',   tabs:['seo']},
    {label:'Checks',tabs:['qa','logic','a11y']}
  ];
  var PROP_LABELS={design:'Design',device:'Device',motion:'Motion',scene:'3D',
    interact:'Interact',seo:'SEO',qa:'QA',logic:'Logic',a11y:'A11y'};
  var PROP_LAST={};
  function decorateInspector(){
    var wrap=document.querySelector('.builder-right .prop-tabs');
    if(!wrap||wrap.dataset.grouped==='1')return;
    var list=wrap.querySelectorAll('[data-proptab]');
    if(!list.length)return;
    var originals={},active=null;
    for(var i=0;i<list.length;i++){
      originals[list[i].dataset.proptab]=list[i];
      if(list[i].classList.contains('active'))active=list[i].dataset.proptab;
      list[i].style.display='none';
    }
    if(!active)active='design';
    var group=null;
    for(var g=0;g<PROP_GROUPS.length;g++){
      if(PROP_GROUPS[g].tabs.indexOf(active)>=0){group=PROP_GROUPS[g];break}
    }
    if(!group)group=PROP_GROUPS[0];
    PROP_LAST[group.label]=active;
    PROP_GROUPS.forEach(function(gr){
      var members=gr.tabs.filter(function(t){return originals[t]});
      if(!members.length)return;
      var b=document.createElement('button');
      b.type='button';
      b.className='prop-tab prop-tab-group'+(gr===group?' active':'');
      b.textContent=gr.label;
      b.addEventListener('click',function(e){
        e.preventDefault();
        var rem=PROP_LAST[gr.label];
        originals[members.indexOf(rem)>=0?rem:members[0]].click();
      });
      wrap.appendChild(b);
    });
    wrap.dataset.grouped='1';
    var members=group.tabs.filter(function(t){return originals[t]});
    if(members.length>1&&!wrap.parentElement.querySelector('.prop-sub-row')){
      var row=document.createElement('div');
      row.className='prop-sub-row';
      members.forEach(function(t){
        var sb=document.createElement('button');
        sb.type='button';
        sb.className='btab-sub'+(t===active?' on':'');
        sb.textContent=PROP_LABELS[t]||t;
        sb.addEventListener('click',function(){originals[t].click()});
        row.appendChild(sb);
      });
      wrap.parentElement.insertBefore(row,wrap.nextSibling);
    }
  }
  // --- studio tab strip -----------------------------------------------------
  // One shell across the studio. Build and Edit stay on the canvas; the other
  // three open their own screens, which is why the strip is drawn there too.
  var AGENT_TABS=[
    {id:'build',   label:'Build',    route:'builder', tab:'pages'},
    {id:'edit',    label:'Edit',     route:'builder', tab:'ai'},
    {id:'assets',  label:'Assets',   route:'media'},
    {id:'business',label:'Business', route:'store'},
    {id:'publish', label:'Publish',  route:'domains'}
  ];
  var AGENT_ROUTES={media:'assets',store:'business',cms:'business',forms:'business',
    leads:'business',orders:'business',domains:'publish'};
  function activeAgentTab(){
    if(state.route==='builder')return state.builderTab==='ai'?'edit':'build';
    return AGENT_ROUTES[state.route]||'';
  }
  function decorateAgentTabs(){
    var active=activeAgentTab();
    if(!active)return;
    var host=state.route==='builder'
      ? document.querySelector('.builder-view')
      : document.querySelector('.view');
    if(!host||host.querySelector(':scope > .agent-tabs'))return;
    var strip=document.createElement('nav');
    strip.className='agent-tabs';
    strip.setAttribute('aria-label','Studio sections');
    AGENT_TABS.forEach(function(t){
      var b=document.createElement('button');
      b.type='button';
      b.className='agent-tab'+(t.id===active?' on':'');
      b.textContent=t.label;
      b.addEventListener('click',function(){
        if(t.tab)state.builderTab=t.tab;
        saveState();
        if(state.route===t.route)render(t.route);else navigate(t.route);
      });
      strip.appendChild(b);
    });
    // above the canvas in the builder, above everything elsewhere
    var after=state.route==='builder'?host.querySelector('.builder-top'):null;
    if(after&&after.nextSibling)host.insertBefore(strip,after.nextSibling);
    else host.insertBefore(strip,host.firstChild);
    if(state.route==='builder'){
      requestAnimationFrame(function(){
        var h=Math.round(strip.getBoundingClientRect().height)||57;
        host.style.setProperty('--agentstrip',h+'px');
      });
      // rAF is withheld in a hidden tab, so set it straight away as well
      host.style.setProperty('--agentstrip',(Math.round(strip.getBoundingClientRect().height)||57)+'px');
    }
  }
  var AGENT_ASKS=['Rewrite all copy for my business','Change the brand colours',
    'Make the headline shorter and punchier','Add a pricing section',
    'Make the scene more cinematic'];
  function decorateAgentPanel(){
    if(!state.agentMode||state.route!=='builder')return;
    var view=document.querySelector('.builder-view');
    if(!view)return;
    view.classList.add('agentmode');
    if(view.querySelector(':scope > .agent-panel'))return;
    var strip=view.querySelector(':scope > .agent-tabs');
    if(!strip)return;
    var p=document.createElement('section');
    p.className='agent-panel';
    p.innerHTML=
      '<button type="button" class="agent-brand" aria-expanded="false">'
        +'<span>BRAND — LOGO &amp; SOCIALS</span><i>⌄</i></button>'
      +'<div class="agent-brand-body" hidden></div>'
      +'<div class="agent-media"></div>'
      +'<p class="agent-hint">Ask for anything — "make the headline read Meridian Survey", '
        +'"switch the palette to warm amber", "rewrite the intro for a climate startup". '
        +'The change applies to the preview below and saves with the project.</p>'
      +'<div class="agent-asks">'+AGENT_ASKS.map(function(a){
          return '<button type="button">'+a+'</button>'}).join('')+'</div>'
      +'<textarea id="agentPrompt" rows="3" placeholder="Describe a change — copy, colours, sections..."></textarea>'
      +'<div class="agent-go"><span class="agent-msg"></span>'
        +'<button type="button" class="btn primary agent-apply">Apply change</button></div>';
    strip.parentNode.insertBefore(p,strip.nextSibling);

    var ta=p.querySelector('#agentPrompt'),msg=p.querySelector('.agent-msg');
    // defined in a later <script>, so reach it through window rather than
    // letting a ReferenceError kill the rest of this setup
    if(window.__renderAgentMedia)window.__renderAgentMedia(p.querySelector('.agent-media'));
    p.querySelectorAll('.agent-asks button').forEach(function(b){
      b.addEventListener('click',function(){ta.value=b.textContent;ta.focus()})});

    var brand=p.querySelector('.agent-brand'),body=p.querySelector('.agent-brand-body');
    brand.addEventListener('click',function(){
      var open=body.hasAttribute('hidden');
      if(open){
        var bp=state.brandProfile||{};
        body.innerHTML=['name','tagline','logo','instagram','linkedin'].map(function(f){
          return '<label>'+f+'<input data-brand-field="'+f+'" value="'+escV(bp[f]||'')+'"/></label>'
        }).join('');
        body.removeAttribute('hidden');
      }else body.setAttribute('hidden','');
      brand.setAttribute('aria-expanded',String(open));
    });

    function sizePanel(){
      var h=Math.round(p.getBoundingClientRect().height)||300;
      view.style.setProperty('--agentpanel',h+'px');
    }
    sizePanel();
    requestAnimationFrame(sizePanel);
    new ResizeObserver(sizePanel).observe(p);

    p.querySelector('.agent-apply').addEventListener('click',function(){
      var q=(ta.value||'').trim();
      if(!q){msg.textContent='Describe the change first.';return}
      msg.textContent='';
      // one edit path for the whole product, so behaviour cannot drift
      var hidden=document.getElementById('builderPrompt');
      if(hidden)hidden.value=q;
      aiEditCurrentSite(q,p.querySelector('.agent-apply'));
    });
  }
  window.__decorateAgentPanel=decorateAgentPanel;
  window.__decorateAgentTabs=decorateAgentTabs;
  window.__decorateInspector=decorateInspector;
  decorateInspector();
  window.__decorateRail=decorateRail;
  decorateRail();
  // the builder re-renders on every edit, so re-group each time it reappears
  new MutationObserver(function(){
    try{decorateRail()}catch(e){}
    try{decorateInspector()}catch(e){}
    try{decorateAgentTabs()}catch(e){}
    try{decorateAgentPanel()}catch(e){}
    try{if(window.__decorateCanvasMedia)window.__decorateCanvasMedia()}catch(e){}
  })
    .observe(document.body,{childList:true,subtree:true});

  var fab=document.createElement('button');
  fab.id='mobProps';fab.type='button';fab.textContent='\u2699';
  fab.setAttribute('aria-label','Section properties');
  document.body.appendChild(fab);
  fab.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    var open=!document.body.classList.contains('rpanel');
    document.body.classList.toggle('rpanel',open);
    document.body.classList.remove('bpanel');
    fab.classList.toggle('on',open);
  });
  // Neither drawer may survive a route change.
  window.addEventListener('hashchange',function(){
    document.body.classList.remove('bpanel');
    document.body.classList.remove('rpanel');
    fab.classList.remove('on');
  });
})();
