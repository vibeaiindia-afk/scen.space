
/* ──────────────────────────────────────────────────────────────────────────
   Connections, the AI connection orchestrator, Business, Publish, AI Builder.

   The rule this file is written to: a status shown to a customer must come
   from the server. Nothing here invents a "Connected" badge, and where a
   capability genuinely has no backend adapter it says so rather than offering
   a button that leads nowhere.
   ────────────────────────────────────────────────────────────────────────── */
(function(){
'use strict';
var ic=window.scenIcon;

/* ── 1. Capability state ───────────────────────────────────────────────────
   One read of GET /api/capabilities, which returns booleans only. Three
   distinct situations are kept apart, because collapsing them is how a UI
   ends up lying: known-good, known-missing, and could-not-check. ── */
var caps=null,capsAt=0,capsErr=null,inFlight=null;
var TTL=30000;

function loadCaps(force){
  if(!force&&caps&&Date.now()-capsAt<TTL)return Promise.resolve(caps);
  if(inFlight)return inFlight;
  inFlight=api('/api/capabilities').then(function(d){
    caps=d&&d.capabilities?d.capabilities:null;capsAt=Date.now();capsErr=null;inFlight=null;return caps;
  }).catch(function(e){
    inFlight=null;capsErr=e;caps=null;throw e;
  });
  return inFlight;
}
window.scenCapabilities=loadCaps;

/* Re-render the current view once the read lands, so a view can paint
   immediately with "Checking…" instead of blocking on the network. */
function capsThenRender(){
  loadCaps().then(function(){if(state.route)render(state.route)})
            .catch(function(){if(state.route)render(state.route)});
}

function capState(key){
  if(capsErr)return 'unknown';
  if(!caps)return 'checking';
  var c=caps[key];
  return c&&c.state?c.state:'unknown';
}
function capInfo(key){return (caps&&caps[key])||{}}

var LABEL={
  connected:['Connected','ok'], setup_required:['Setup required','warn'],
  not_connected:['Not connected',''], error:['Needs attention','err'],
  unavailable:['Not available yet',''], checking:['Checking…','busy'],
  unknown:['Can’t check right now','warn']
};
function pill(st){var l=LABEL[st]||LABEL.unknown;return '<span class="sx-st '+l[1]+'">'+l[0]+'</span>'}

/* ── 2. The connection catalogue ───────────────────────────────────────────
   `self` marks what a customer can genuinely set up themselves. Everything
   else is server-side configuration held by the workspace operator — saying
   "Connect" on those would be a button that cannot work. ── */
var CONN={
  ai:      {group:'essentials',label:'AI',icon:'spark',self:false,route:'billing',staffRoute:'aigateway',
            desc:'Writes your copy, plans your pages and edits the site when you ask.'},
  domain:  {group:'essentials',label:'Domain',icon:'globe',self:true,route:'domains',
            desc:'The web address customers type to reach you.'},
  data:    {group:'essentials',label:'Data',icon:'db',self:false,route:'cms',staffRoute:'dbstorage',
            desc:'Stores the information your website needs — form entries, content, orders.'},
  auth:    {group:'essentials',label:'Login & Users',icon:'lock',self:false,route:'accounts',staffRoute:'authemail',
            desc:'Lets your customers create an account and sign in.'},
  storage: {group:'essentials',label:'Storage',icon:'box',self:false,route:'media',staffRoute:'dbstorage',
            desc:'Holds your images, video and downloadable files.'},
  payments:{group:'business',label:'Payments',icon:'card',self:false,staffRoute:'billingops',
            desc:'Takes card and UPI payments at checkout.'},
  email:   {group:'business',label:'Email',icon:'mail',self:false,route:'notifications',staffRoute:'authemail',
            desc:'Sends form notifications, order confirmations and login emails.'},
  analytics:{group:'business',label:'Analytics',icon:'chart',self:false,route:'analytics',
            desc:'Shows how many people visit and what they do.'},
  crm:     {group:'business',label:'CRM',icon:'user',self:false,route:'leads',
            desc:'Syncs leads into the tool your sales team already uses.'},
  github:  {group:'developer',label:'GitHub',icon:'code',self:false,staffRoute:'handoff',
            desc:'Keeps the generated source in a repository you control.'},
  webhooks:{group:'developer',label:'Webhooks',icon:'bolt',self:false,staffRoute:'integrations',
            desc:'Sends events to your own systems when things happen.'}
};
/* Capabilities the orchestrator can require that have no card of their own. */
var CAPNAME={images:'Image generation',video:'Video generation'};
function capLabel(k){return (CONN[k]&&CONN[k].label)||CAPNAME[k]||k}

var GROUPS=[['essentials','Essentials','What a website needs to run.'],
            ['business','Business','What turns a website into a business.'],
            ['developer','Developer','For teams that want to go deeper.']];

/* A destination this viewer is actually allowed to open. Staff control planes
   are blocked in navigate(), so offering one to a customer would bounce them
   to the dashboard — a dead end dressed up as a button. */
function destOf(c){
  if(c.route)return c.route;
  if(c.staffRoute&&window.__isPlatformAdmin)return c.staffRoute;
  return '';
}

function connCard(key){
  var c=CONN[key],st=capState(key),info=capInfo(key),dest=destOf(c);
  var extra='';
  if(key==='domain'&&info.count)extra=info.count+' domain'+(info.count===1?'':'s')+(info.live?' · '+info.live+' live':'');
  else if(info.providers&&info.providers.length)extra=info.providers.join(' · ');
  else if(info.provider)extra=info.provider;
  else if(info.methods)extra=info.methods.join(' · ');

  var btns='';
  if(st==='checking')btns='<button class="btn" disabled>Checking…</button>';
  else if(st==='unknown')btns='<button class="btn" data-sx="recheck">Check again</button>';
  else if(st==='unavailable')btns='';
  else if(st==='error')btns='<button class="btn" data-sx="fixConn" data-cap="'+key+'">Fix connection</button>';
  else if(st==='setup_required')btns='<button class="btn primary" data-nav="'+dest+'">Finish setup</button>';
  else if(st==='connected')btns=dest?'<button class="btn" data-nav="'+dest+'">Manage</button>':'';
  else if(c.self)btns='<button class="btn primary" data-nav="'+dest+'">Connect</button>';
  else btns='<button class="btn" data-sx="requestConn" data-cap="'+key+'">Request setup</button>';

  var note='';
  if(st==='unavailable')
    note='<p class="sx-note">Scen does not have an adapter for this yet, so there is nothing to connect. It is on the roadmap.</p>';
  else if(st==='not_connected'&&!c.self)
    note='<p class="sx-note">Set up once for the whole workspace by whoever owns the Scen account.</p>';

  return '<div class="sx-conn">'+ic(c.icon)+'<div class="sx-cbody"><b>'+c.label+'</b><p>'+c.desc+'</p>'+
    '<div class="sx-crow">'+pill(st)+(extra?'<span class="tiny muted">'+escV(extra)+'</span>':'')+'</div>'+
    note+(btns?'<div class="sx-cfoot">'+btns+'</div>':'')+'</div></div>';
}

views.connections=function(){
  if(!caps&&!capsErr)capsThenRender();
  var h=viewHead('Connections','Everything your website needs, in one place.',
    '<button class="btn" data-sx="recheck">Check again</button>');
  if(capsErr){
    h+='<div class="sx-gate"><b>Scen can’t check your connections right now</b>'+
       '<p>This is usually a dropped network or an expired sign-in. Your connections themselves are unaffected.</p>'+
       '<button class="btn" data-sx="recheck">Try again</button>'+
       '<button class="sx-tech" data-sx="tech" data-msg="'+escV(String(capsErr.message||capsErr))+'">View technical details</button></div>';
  }
  GROUPS.forEach(function(g){
    var keys=Object.keys(CONN).filter(function(k){return CONN[k].group===g[0]});
    h+='<div class="sx-sect"><h3>'+g[1]+'</h3><p class="sx-sub">'+g[2]+'</p>'+
       '<div class="sx-grid">'+keys.map(connCard).join('')+'</div></div>';
  });
  return h;
};

document.addEventListener('click',function(e){
  var r=e.target.closest('[data-sx="recheck"]');
  if(r){caps=null;capsErr=null;capsAt=0;render(state.route);loadCaps(true).then(function(){render(state.route)}).catch(function(){render(state.route)});return}
  var t=e.target.closest('[data-sx="tech"]');
  if(t){modal('<div class="modal-head"><b>Technical details</b><button class="close" data-action="closeModal">×</button></div>'+
    '<div class="modal-body"><pre style="white-space:pre-wrap;font-size:12px;color:#9a9aa5">'+escV(t.dataset.msg||'')+'</pre></div>');return}
  var q=e.target.closest('[data-sx="requestConn"]');
  if(q){
    var k=q.dataset.cap,c=CONN[k],d=destOf(c);
    modal('<div class="modal-head"><b>Set up '+c.label+'</b><button class="close" data-action="closeModal">×</button></div>'+
      '<div class="modal-body"><p class="tiny muted" style="line-height:1.6">'+c.desc+'</p>'+
      '<p class="tiny muted" style="line-height:1.6;margin-top:10px">'+c.label+' is configured once for the whole workspace, server-side, by whoever owns the Scen account. Credentials are never entered in the browser and are never shown again after they are saved.</p>'+
      '<div class="sx-actions"><button class="btn primary" data-nav="support">Ask Scen to set this up</button>'+
      (d?'<button class="btn" data-nav="'+d+'">Open '+c.label+' settings</button>':'')+'</div></div>');
    return;
  }
  var f=e.target.closest('[data-sx="fixConn"]');
  if(f){
    var key=f.dataset.cap,cc=CONN[key],dd=destOf(cc);
    modal('<div class="modal-head"><b>'+cc.label+' needs attention</b><button class="close" data-action="closeModal">×</button></div>'+
      '<div class="modal-body"><p class="tiny muted" style="line-height:1.6">This connection is set up, but it is failing a health check right now. Nothing you have built is lost.</p>'+
      '<div class="sx-actions"><button class="btn primary" data-sx="recheck" data-action="closeModal">Check again</button>'+
      (dd?'<button class="btn" data-nav="'+dd+'">Open settings</button>':'')+
      '<button class="btn" data-nav="support">Contact support</button></div></div>');
    return;
  }
},false);

/* ── 3. The AI connection orchestrator ─────────────────────────────────────
   intent → required capability → check → guided setup → resume.

   The resume is the point. The pending task is written to state, so it
   survives the reload that a real connection flow (DNS, OAuth) causes, and
   the customer never retypes the thing they asked for. ── */

/* Reuses the product's own handlers rather than reimplementing them: the
   element is real, in the DOM and clicked, so every existing side effect,
   undo entry and version snapshot happens exactly as it normally would. */
function fire(action,data){
  var b=document.createElement('button');
  b.setAttribute('data-action',action);
  b.style.cssText='position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0';
  if(data)Object.keys(data).forEach(function(k){b.dataset[k]=data[k]});
  document.body.appendChild(b);
  b.click();
  setTimeout(function(){try{b.remove()}catch(e){}},0);
}

var INTENTS=[
  {id:'login',    needs:['auth','data'], re:/\b(log ?in|login|sign ?in|sign ?up|customer account|user account|members? area|membership|authenticat)/i},
  /* "a form, and email me the entries" is two capabilities, so it has to be
     tested before the plain-form rule that would otherwise swallow it. */
  {id:'emailform',needs:['data','email'],re:/\bform\b[\s\S]*\b(e-?mail|notify|send (me|us))|\b(e-?mail|notify) (me|us)\b[\s\S]*\bform\b/i},
  {id:'form',     needs:['data'],        re:/\b(contact form|enquiry|inquiry|form|get in touch|lead capture)/i},
  {id:'store',    needs:['payments','data'], re:/\b(sell|checkout|shop|store|product|buy now|add to cart|price it|₹|\$\d)/i},
  {id:'booking',  needs:['data'],        re:/\b(book|booking|appointment|reservation|reserve|schedule a)/i},
  {id:'domain',   needs:['domain'],      re:/\b(domain|custom url|point my|\bdns\b|go live on)/i},
  {id:'image',    needs:['images'],      re:/\b(generate|create|make) (an? )?(image|photo|picture|visual|hero image)/i},
  {id:'video',    needs:['video'],       re:/\b(generate|create|make) (an? )?video/i},
  {id:'publish',  needs:[],              re:/\b(publish|go live|launch the site)/i},
  {id:'edit',     needs:['ai'],          re:/.*/}
];
function classify(text){
  var t=String(text||'');
  /* Most specific first: "form and email me the entries" is two capabilities. */
  for(var i=0;i<INTENTS.length;i++){if(INTENTS[i].re.test(t))return INTENTS[i]}
  return INTENTS[INTENTS.length-1];
}

/* What Scen actually does once every capability is in place. Each branch
   drives a feature that already exists — no branch pretends. */
function perform(intent,text){
  switch(intent.id){
    case 'form':
    case 'emailform':
      fire('newForm');
      navigate('forms');
      toast('Form created — edit the fields below');
      return true;
    case 'store':
      if(!state.store)state.store={};
      if(!state.store.enabled)fire('toggleStore');
      fire('addProduct');
      navigate('store');
      toast('Store enabled and a product added');
      return true;
    case 'booking':
      fire('addService');
      navigate('bookings');
      toast('Booking service created');
      return true;
    case 'login':
      navigate('accounts');
      toast('Customer accounts are ready to configure');
      return true;
    case 'domain':
      navigate('domains');
      return true;
    case 'publish':
      navigate('publish');
      return true;
    case 'image':
      navigate('media');
      toast('Generate an image from the Media library');
      return true;
    case 'video':
      navigate('media');
      toast('Generate a video from the Media library');
      return true;
    default:
      /* The AI Creative Director edits the real site through the gateway. */
      state.builderTab='ai';saveState();
      navigate('builder');
      setTimeout(function(){
        var box=document.getElementById('builderPrompt');
        if(box){box.value=text;fire('aiEdit')}
      },60);
      return true;
  }
}

/* The whole point of §26: run it, and if something is missing, ask for only
   that one thing and come back to this exact task afterwards. */
function run(text,opts){
  var intent=classify(text);
  var pending={text:text,intent:intent.id,at:Date.now()};
  return loadCaps(opts&&opts.force).then(function(){
    var missing=intent.needs.filter(function(k){return capState(k)!=='connected'});
    if(!missing.length){clearPending();return perform(intent,text)}
    state.pendingTask=pending;saveState();
    showGate(missing,text);
    return false;
  }).catch(function(err){
    state.pendingTask=pending;saveState();
    showGate([],text,err);
    return false;
  });
}
window.scenRun=run;

function clearPending(){if(state.pendingTask){delete state.pendingTask;saveState()}}

function gateHtml(missing,text,err){
  if(err){
    return '<div class="sx-gate" id="sxGate"><b>Scen can’t check your connections right now</b>'+
      '<p>Your request is saved. Try again in a moment and Scen will pick it straight back up.</p>'+
      '<div class="sx-actions"><button class="btn primary" data-sx="gateRetry">Try again</button>'+
      '<button class="btn" data-sx="gateCancel">Cancel</button></div>'+
      '<button class="sx-tech" data-sx="tech" data-msg="'+escV(String(err.message||err))+'">View technical details</button></div>';
  }
  var names=missing.map(capLabel);
  var selfServe=missing.every(function(k){return CONN[k]&&CONN[k].self});
  var one=missing.length===1;
  return '<div class="sx-gate" id="sxGate">'+
    '<b>'+(one?'One connection is needed before I can finish this.':'A few connections are needed before I can finish this.')+'</b>'+
    '<p>“'+escV(String(text).slice(0,120))+'” needs '+escV(names.join(' and '))+'. '+
      (selfServe?'It takes about a minute.':'This is set up once for the whole workspace — after that Scen will finish this automatically.')+'</p>'+
    '<div class="sx-actions">'+
      '<button class="btn primary" data-sx="gateGo" data-cap="'+escV(missing[0])+'">Connect &amp; continue</button>'+
      '<button class="btn" data-sx="gateCancel">Not now</button>'+
    '</div></div>';
}
function showGate(missing,text,err){
  var host=document.getElementById('sxGateHost');
  if(host){host.innerHTML=gateHtml(missing,text,err);return}
  modal('<div class="modal-head"><b>Almost there</b><button class="close" data-action="closeModal">×</button></div>'+
        '<div class="modal-body">'+gateHtml(missing,text,err)+'</div>');
}

document.addEventListener('click',function(e){
  var go=e.target.closest('[data-sx="gateGo"]');
  if(go){
    var k=go.dataset.cap,c=CONN[k],d=c?destOf(c):'';
    closeModal();
    if(c&&c.self&&d){navigate(d);return}
    modal('<div class="modal-head"><b>Set up '+capLabel(k)+'</b><button class="close" data-action="closeModal">×</button></div>'+
      '<div class="modal-body"><p class="tiny muted" style="line-height:1.6">'+(c?c.desc:'')+'</p>'+
      '<p class="tiny muted" style="line-height:1.6;margin-top:10px">This one is configured server-side for the whole workspace. Once it is on, Scen will finish what you asked for without you typing it again.</p>'+
      '<div class="sx-actions"><button class="btn primary" data-nav="support">Ask Scen to set this up</button>'+
      (d?'<button class="btn" data-nav="'+d+'">Open settings</button>':'')+'</div></div>');
    return;
  }
  var rt=e.target.closest('[data-sx="gateRetry"]');
  if(rt){closeModal();var p=state.pendingTask;if(p)run(p.text,{force:true});return}
  var cn=e.target.closest('[data-sx="gateCancel"]');
  if(cn){clearPending();closeModal();var g=document.getElementById('sxGate');if(g)g.remove();toast('Cancelled');return}
},false);

/* Resume. Whenever capabilities are re-read and the blocker has cleared, the
   saved task runs on its own — the customer never repeats themselves. */
/* Routes where finishing the saved task is what the customer is waiting for:
   the builder they asked from, the hub they were sent to, and the setup pages
   a connection flow ends on. */
var RESUME_HERE=['aibuilder','connections','dashboard','domains','settings','billing','support','accounts','notifications','cms','media'];
function tryResume(){
  var p=state.pendingTask;
  if(!p)return;
  /* Only inside the signed-in app. On boot this runs while restoreSession() is
     still in flight, and resuming onto the marketing page would drop the work
     the customer is waiting for. */
  if(!state.auth||state.route==='marketing'||state.route==='auth')return;
  if(Date.now()-Number(p.at||0)>1000*60*60*6){clearPending();return}
  var intent=null;
  for(var i=0;i<INTENTS.length;i++)if(INTENTS[i].id===p.intent)intent=INTENTS[i];
  if(!intent){clearPending();return}
  /* Resuming is meant to save the customer from retyping, not to yank them out
     of whatever they are doing now. Only finish the task while they are still
     in the flow that asked for it; otherwise the task waits and picks up the
     next time they open the AI Builder. */
  if(RESUME_HERE.indexOf(state.route)<0)return;
  loadCaps(true).then(function(){
    var missing=intent.needs.filter(function(k){return capState(k)!=='connected'});
    if(missing.length)return;
    clearPending();
    toast('Picking up where you left off…');
    setTimeout(function(){perform(intent,p.text)},400);
  }).catch(function(){});
}
window.scenResume=tryResume;
/* On boot the session is restored asynchronously, so check a few times rather
   than once and give up. Stops as soon as the task is picked up. */
(function(){
  var tries=0;
  var t=setInterval(function(){
    if(++tries>8||!state.pendingTask){clearInterval(t);return}
    tryResume();
  },1200);
})();
/* A connection flow usually ends on its own settings page; check again on the
   way out of one. */
var lastRoute='';
document.addEventListener('click',function(){
  setTimeout(function(){
    if(!state.pendingTask)return;
    if(state.route===lastRoute)return;
    lastRoute=state.route;
    tryResume();
  },250);
},false);

/* ── 4. AI Builder ─────────────────────────────────────────────────────────
   Brief, Plan and Build Activity stop being three navigation entries and
   become one workspace with a progress rail. The underlying views are
   untouched and still reachable from the secondary links. ── */
function projectPhase(){
  if(state.published)return 3;
  if(state.generation>=7||(state.components||[]).length)return 3;
  if(state.generation>0)return 2;
  if(state.prompt||(state.pages||[]).length>1)return 1;
  return 0;
}
function stepsRail(){
  var names=['Brief','Plan','Building','Ready'],at=projectPhase();
  return '<div class="sx-steps">'+names.map(function(n,i){
    var cls=i<at?'done':(i===at?'now':'');
    var mark=i<at?'✓':(i===at?'<i></i>':'');
    return (i?'<span class="sx-bar"></span>':'')+
      '<div class="sx-step '+cls+'"><span class="sx-dot">'+mark+'</span>'+n+'</div>';
  }).join('')+'</div>';
}

views.aibuilder=function(){
  var has=(state.components||[]).length>0;
  var h=viewHead('AI Builder','Describe what you want. Scen plans it, builds it, and connects whatever it needs.',
    has?'<button class="btn" data-nav="builder">Open canvas</button><button class="btn primary" data-nav="publish">Publish</button>':'');
  h+=stepsRail();
  h+='<div class="sx-compose"><textarea id="sxAsk" placeholder="'+
     (has?'Ask for a change — “make the hero more premium”, “add a contact form and email me the entries”, “add customer login”'
        :'Describe your business, product or idea…')+'"></textarea>'+
     '<div class="sx-row" style="margin-top:10px"><span class="tiny muted">Scen will set up anything this needs.</span>'+
     '<button class="btn primary" data-sx="ask">'+(has?'Make the change':'Build my website')+' →</button></div></div>';
  h+='<div id="sxGateHost"></div>';
  h+='<div class="sx-chips">'+
     (has?['Make this more premium','Add a contact form and email me the entries','Add customer login',
           'Create another services section','Make mobile cleaner','Sell a product for ₹4,999']
        :['A cinematic luxury resort in Jaipur','A clinic with online appointments',
          'A fashion store that sells online','A portfolio for a photographer'])
     .map(function(c){return '<button data-sx="chip" data-t="'+escV(c)+'">'+escV(c)+'</button>'}).join('')+'</div>';

  h+='<div class="sx-sect"><h3>This project</h3><div class="sx-advgrid">'+
     '<button class="sx-tool" data-nav="create">'+ic('pages')+'View original brief</button>'+
     '<button class="sx-tool" data-nav="plan">'+ic('check')+'View plan</button>'+
     '<button class="sx-tool" data-nav="activity">'+ic('dots')+'View activity</button>'+
     '<button class="sx-tool" data-nav="builder">'+ic('grid')+'Open canvas</button>'+
     '</div></div>';
  return h;
};

document.addEventListener('click',function(e){
  var c=e.target.closest('[data-sx="chip"]');
  if(c){var box=document.getElementById('sxAsk');if(box){box.value=c.dataset.t;box.focus()}return}
  var a=e.target.closest('[data-sx="ask"]');
  if(a){
    var el=document.getElementById('sxAsk');
    var v=el?String(el.value||'').trim():'';
    if(!v){toast('Tell Scen what you want first');if(el)el.focus();return}
    a.disabled=true;a.textContent='Working…';
    run(v).then(function(){a.disabled=false;a.textContent='Make the change →'})
          .catch(function(){a.disabled=false;a.textContent='Try again →'});
    return;
  }
},false);

/* ── 5. Business hub ───────────────────────────────────────────────────────
   Seventeen sidebar entries become one page. Store and Bookings stay hidden
   until they are switched on, so nobody navigates modules they do not use. ── */
var BIZ=[
  ['analytics','Analytics','chart','Traffic, engagement and conversion.'],
  ['leads','Leads','user','Every enquiry from every published site.'],
  ['forms','Forms','pages','The forms that feed your leads.'],
  ['cms','Content','box','Collections behind your cards, galleries and journals.'],
  ['funnels','Marketing','bolt','Website actions as one visual journey.']
];
var STORE_SUB=[['store','Products'],['inventory','Inventory'],['orders','Orders'],
               ['discounts','Discounts'],['shipping','Shipping & Tax'],['checkoutdesign','Checkout']];
var BOOK_SUB=[['bookings','Services'],['bookingcalendar','Calendar'],['availability','Availability']];

views.business=function(){
  var storeOn=!!(state.store&&state.store.enabled);
  var bookOn=!!(state.bookingSettings&&state.bookingSettings.enabled);
  var leads=(state.leads||[]).length,forms=(state.forms||[]).length;
  var h=viewHead('Business','Everything your website earns you, in one place.');

  h+='<div class="sx-grid">'+
    '<button class="sx-card" data-nav="analytics"><div class="sx-head">'+ic('chart')+'<b>Analytics</b></div>'+
      '<p>'+(capState('analytics')==='unavailable'?'No analytics provider is connected yet.':'Traffic and conversion.')+'</p></button>'+
    '<button class="sx-card" data-nav="leads"><div class="sx-head">'+ic('user')+'<b>Leads</b></div>'+
      '<p>'+(leads?leads+' captured':'No leads yet — they arrive when a form is submitted.')+'</p></button>'+
    '<button class="sx-card" data-nav="forms"><div class="sx-head">'+ic('pages')+'<b>Forms</b></div>'+
      '<p>'+(forms?forms+' active':'No forms yet.')+'</p></button>'+
    '<button class="sx-card" data-nav="cms"><div class="sx-head">'+ic('box')+'<b>Content</b></div>'+
      '<p>'+((state.collections||[]).length||0)+' collection'+(((state.collections||[]).length||0)===1?'':'s')+'.</p></button>'+
  '</div>';

  h+='<div class="sx-sect"><h3>Store</h3>';
  if(storeOn){
    h+='<div class="sx-advgrid">'+STORE_SUB.map(function(s){
      return '<button class="sx-tool" data-nav="'+s[0]+'">'+ic('box')+s[1]+'</button>';
    }).join('')+'</div>';
  }else{
    h+='<div class="sx-empty" style="margin-top:11px"><b>Sell products directly from your website</b>'+
       '<p>Products, cart, checkout and orders — switched on only when you need them.</p>'+
       '<button class="btn primary" data-sx="enableStore">Enable Store</button></div>';
  }
  h+='</div>';

  h+='<div class="sx-sect"><h3>Bookings</h3>';
  if(bookOn){
    h+='<div class="sx-advgrid">'+BOOK_SUB.map(function(s){
      return '<button class="sx-tool" data-nav="'+s[0]+'">'+ic('check')+s[1]+'</button>';
    }).join('')+'</div>';
  }else{
    h+='<div class="sx-empty" style="margin-top:11px"><b>Accept appointments and reservations</b>'+
       '<p>Services, availability and confirmations — switched on only when you need them.</p>'+
       '<button class="btn primary" data-sx="enableBook">Enable Bookings</button></div>';
  }
  h+='</div>';

  h+='<div class="sx-sect"><h3>Marketing</h3><div class="sx-advgrid">'+
     '<button class="sx-tool" data-nav="funnels">'+ic('bolt')+'Funnels</button>'+
     '<button class="sx-tool" data-nav="notifications">'+ic('mail')+'Email templates</button>'+
     '<button class="sx-tool" data-nav="events">'+ic('chart')+'Events</button>'+
     '<button class="sx-tool" data-nav="search">'+ic('grid')+'Site search</button>'+
     '</div></div>';
  return h;
};
document.addEventListener('click',function(e){
  if(e.target.closest('[data-sx="enableStore"]')){fire('toggleStore');render('business');toast('Store enabled');return}
  if(e.target.closest('[data-sx="enableBook"]')){fire('toggleBooking');render('business');toast('Bookings enabled');return}
},false);

/* ── 6. Publish ────────────────────────────────────────────────────────────
   The readiness list is computed from the project, not decorative. A check
   that Scen cannot actually verify is reported as unknown, not as a pass. ── */
function readiness(){
  var out=[];
  var built=(state.components||[]).length>0||(state.pages||[]).length>0;
  out.push(['Website',built,built?'Pages are built and ready':'Nothing has been built yet','pages']);
  var bp=(state.breakpoints||[]).filter(function(b){return b.enabled}).length;
  out.push(['Mobile',bp>0,bp>0?'Responsive at '+bp+' breakpoints':'No responsive breakpoints enabled','eye']);
  var dst=capState('domain');
  out.push(['Domain',dst==='connected',
    dst==='connected'?'Custom domain is live':
    dst==='setup_required'?'A domain is added but still waiting on DNS':
    dst==='checking'?'Checking…':'No custom domain — Scen will publish on a scen.space address','globe']);
  var seo=!!(state.projectSettings&&state.projectSettings.siteTitle&&state.projectSettings.description);
  out.push(['SEO',seo,seo?'Title and description are set':'Add a site title and description','check']);
  var f=(state.forms||[]).length;
  out.push(['Forms',f===0||capState('data')==='connected',
    f===0?'No forms on this site':(capState('data')==='connected'?f+' form'+(f===1?'':'s')+' will store entries':'Forms cannot store entries until Data is connected'),'mail']);
  /* Only a real audit counts. state.accessibility always exists with defaults,
     so treating its presence as a pass would have been a green tick for a
     check that never ran. */
  var aud=state.accessibility&&state.accessibility.lastAudit;
  out.push(['Accessibility',!!aud,aud?'Audited — no critical issues recorded':'Not audited yet','user']);
  return out;
}

views.publish=function(){
  if(!caps&&!capsErr)capsThenRender();
  var checks=readiness();
  var pass=checks.filter(function(c){return c[1]}).length;
  var score=Math.round(pass/checks.length*100);
  var live=state.published&&state.publishSettings&&state.publishSettings.lastPublished;
  var sub=(state.publishSettings&&state.publishSettings.subdomain)||'';
  var dom=(state.domains||[]).filter(function(d){return d.status==='Live'})[0];
  var url=dom?('https://'+(dom.name||dom.host)):(sub?('https://scen.space/s/'+sub):'');

  var h=viewHead(live?'Your website is live':'Ready to go live?',
    live?'Publish again whenever you change something.':'A last check, then Scen puts it on the internet.');

  if(live&&url){
    h+='<div class="card" style="padding:20px;margin-bottom:18px"><div class="sx-row">'+
       '<div><span class="caps">Live at</span><b style="display:block;font-size:19px;margin-top:5px">'+escV(url.replace(/^https:\/\//,''))+'</b></div>'+
       '<div class="sx-actions" style="margin:0"><button class="btn" data-sx="copyUrl" data-u="'+escV(url)+'">Copy link</button>'+
       '<a class="btn" href="'+escV(url)+'" target="_blank" rel="noopener">View website</a></div></div></div>';
  }

  h+='<div class="sx-row" style="align-items:flex-start;gap:20px;flex-wrap:wrap">';
  h+='<div class="card" style="flex:1;min-width:290px;padding:6px 18px">'+
      checks.map(function(c){
        return '<div class="sx-check">'+ic(c[1]?'check':'dots')+
          '<div style="flex:1"><b>'+c[0]+'</b><span>'+escV(c[2])+'</span></div>'+
          (c[1]?'<span class="sx-st ok">Ready</span>':'<span class="sx-st warn">Check</span>')+'</div>';
      }).join('')+'</div>';
  h+='<div class="card" style="width:250px;padding:20px">'+
      '<span class="caps">Readiness</span><div class="sx-score"><b>'+score+'</b><span class="tiny muted">/ 100</span></div>'+
      '<p class="tiny muted" style="margin:8px 0 16px;line-height:1.5">'+
        (score===100?'Everything checks out.':(checks.length-pass)+' item'+((checks.length-pass)===1?'':'s')+' to look at. None of them block publishing.')+'</p>'+
      '<button class="btn primary" style="width:100%" data-action="publish">'+(live?'Publish again':'Publish website')+'</button>'+
      (capState('domain')==='connected'?'':
        '<button class="btn" style="width:100%;margin-top:8px" data-nav="domains">Connect a custom domain</button>')+
    '</div>';
  h+='</div>';

  h+='<p class="tiny muted" style="margin-top:14px">Publishing without a custom domain puts your site on a free scen.space address. You can connect your own domain at any time — it does not require republishing from scratch.</p>';
  return h;
};
document.addEventListener('click',function(e){
  var c=e.target.closest('[data-sx="copyUrl"]');
  if(!c)return;
  try{navigator.clipboard.writeText(c.dataset.u);toast('Link copied')}catch(err){toast('Copy failed')}
},false);

/* ── 7. Control planes are staff surfaces ──────────────────────────────────
   These seven views render provider routing, schema, wallets and deploy
   targets. Every /api/admin route behind them already refuses a non-admin, so
   they were never usable by a customer — they were only visible. Now that
   Advanced Tools lists them in one place, close the UI gap too. ── */
if(window.__ADMIN_ROUTES){
  ['aigateway','imagegateway','videogateway','dbstorage','billingops','vercelconnector','authemail']
    .forEach(function(r){window.__ADMIN_ROUTES.add(r)});
  if(window.__applyAdminUI)window.__applyAdminUI();
}
})();
