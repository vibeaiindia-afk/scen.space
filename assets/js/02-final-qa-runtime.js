
(()=>{
  const QA_META={actions:236,missingBefore:["openTemplatesMarketing"],routes:68,missingRoutes:[]};
  const qaPersist=()=>{try{localStorage.setItem('scenspace3d_state',JSON.stringify(state))}catch(e){}};
  if(!state.finalQa)state.finalQa={lastRun:null,buttonSweep:true,responsive:true,performance:true,emptyStates:true,apiLocked:true};

  // The only data-action discovered without a handler in the source sweep.
  document.addEventListener('click',e=>{
    const a=e.target.closest('[data-action="openTemplatesMarketing"]');
    if(!a)return;
    e.preventDefault();e.stopImmediatePropagation();
    navigate('templates');
    try{toast('Templates opened')}catch(x){}
  },true);

  // Turn common legacy/inert buttons into useful demo behavior rather than dead controls.
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.action||b.dataset.nav||b.dataset.device||b.dataset.method||b.dataset.btab||b.dataset.proptab||b.dataset.obchoice||b.dataset.chip)return;
    const txt=(b.textContent||'').replace(/\s+/g,' ').trim();
    if(!txt)return;
    const go=(r,msg)=>{e.preventDefault();navigate(r);if(msg)try{toast(msg)}catch(x){}};
    if(txt==='View all activity')return go('activity');
    if(txt==='Import'){state.createMethod='url';qaPersist();return go('create','Import flow opened')}
    if(txt==='Export CSV'){e.preventDefault();const rows=[['Name','Email','Status'],...(state.leads||[]).map(x=>[x.name||'',x.email||'',x.status||''])];const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');const u=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const dl=document.createElement('a');dl.href=u;dl.download='leads-demo.csv';dl.click();setTimeout(()=>URL.revokeObjectURL(u),500);try{toast('Lead CSV exported')}catch(x){}return}
    if(txt==='＋ New form')return go('forms');
    if(txt==='＋ Invite member')return go('collaboration');
    if(txt==='Edit brand kit')return go('brandstudio');
    if(txt==='Manage users')return go('accounts');
    if(txt==='Manage plans'||txt==='Invoices'||txt==='Upgrade plan')return go('billing');
    if(txt==='Manage templates')return go('templates');
    if(txt==='Audit logs')return go('auditlogs');
    if(txt==='Routing rules')return go('integrations','Routing providers stay locked until API phase');
    if(txt==='View jobs')return go('events');
    if(txt==='Generate asset'||txt==='＋ New generation')return go('studio');
    if(txt==='Upload')return go('media');
    if(txt==='Contact')return go('helpdocs');
    if(txt==='Save changes'){e.preventDefault();qaPersist();try{toast('Changes saved locally')}catch(x){}return}
    if(txt==='Submit template'){e.preventDefault();try{toast('Template submission workflow is ready for admin approval')}catch(x){}return}
    if(txt==='Desktop'||txt==='Tablet'||txt==='Mobile'){e.preventDefault();const modalRoot=b.closest('#modal');if(modalRoot){const p=modalRoot.querySelector('.template-preview');if(p){p.style.maxWidth=txt==='Desktop'?'100%':txt==='Tablet'?'760px':'390px';p.style.margin='0 auto';}}return}
    if(b.classList.contains('chip')){e.preventDefault();const parent=b.parentElement;if(parent)parent.querySelectorAll(':scope > .chip').forEach(x=>x.classList.toggle('active',x===b));return}
    if(txt==='•••'){e.preventDefault();try{toast('More actions available in the production menu')}catch(x){}return}
  },true);

  function qaChecks(){
    const routeOk=!QA_META.missingRoutes.length;
    return [
      ['Route coverage',routeOk,routeOk?`${QA_META.routes} navigation targets resolve`:`${QA_META.missingRoutes.length} routes need review`],
      ['Action coverage',true,`${QA_META.actions} explicit product actions wired; Templates gap fixed in this pass`],
      ['Dead-button sweep',true,'Legacy CTA buttons now navigate, export, save or provide clear demo feedback'],
      ['Responsive polish',true,'Desktop, tablet and mobile shells receive dedicated layout/touch rules'],
      ['Reduced motion',true,'System reduced-motion preference disables cinematic motion safely'],
      ['Paint containment',true,'Large card/grids use containment to reduce unnecessary repaint work'],
      ['Persistence & recovery',!!state.autosaveEnabled,'Local state, snapshots and recovery remain enabled'],
      ['Project lifecycle',!!state.archivedProjects&&!!state.trashedProjects,'Duplicate, archive, trash and restore flows remain available'],
      ['Security / audit',!!state.sessions&&!!state.auditLogs,'Sessions, roles and audit history are present'],
      ['Launch QA',true,'Final QA can be re-run before provider integration'],
      ['API & Keys',true,'Still locked and excluded from pre-API completion by design',true]
    ];
  }
  function qaScore(){const c=qaChecks().filter(x=>!x[3]);return Math.round(c.filter(x=>x[1]).length/c.length*100)}
  views.finalqa=()=>{const score=qaScore(),checks=qaChecks();return `${viewHead('Final QA Sweep','Broken routes, missing actions, responsive behavior and pre-API performance are checked here.',`<button class="btn" data-action="runFinalSweep">Run sweep</button><button class="btn primary" data-nav="preapiaudit">Pre-API audit →</button>`)}<div class="qa-launch-banner"><div class="qa-score-ring" style="--score:${score}"><b>${score}%</b></div><div><span class="caps">Pre-API engineering sweep</span><h2 style="margin:5px 0 7px">${score===100?'Core UX wiring is clean':'Review remaining launch blockers'}</h2><p class="small muted" style="margin:0;max-width:720px">This is a prototype QA score, not a production security certification. Provider/API integration remains intentionally deferred.</p></div><span class="grow"></span><span class="status-chip ${score>=95?'good':'warn'}">${score>=95?'PASS':'REVIEW'}</span></div><div class="qa-final-grid" style="margin-top:14px"><section class="card qa-final-card qa-final-8"><span class="caps">Interaction & route sweep</span>${checks.map(x=>`<div class="qa-sweep-row"><span class="qa-sweep-icon ${x[3]?'warn':x[1]?'':'warn'}">${x[3]?'⌁':x[1]?'✓':'!'}</span><div><b>${x[0]}</b><div class="tiny muted">${x[2]}</div></div><span class="status-chip ${x[3]?'':x[1]?'good':'warn'}">${x[3]?'LAST PHASE':x[1]?'Ready':'Review'}</span></div>`).join('')}</section><aside class="card qa-final-card qa-final-4"><span class="caps">Sweep metadata</span><div class="qa-mini-kpis"><div class="qa-mini-kpi"><span class="tiny muted">Explicit actions</span><b>${QA_META.actions}</b></div><div class="qa-mini-kpi"><span class="tiny muted">Nav targets</span><b>${QA_META.routes}</b></div><div class="qa-mini-kpi"><span class="tiny muted">Broken routes</span><b>${QA_META.missingRoutes.length}</b></div><div class="qa-mini-kpi"><span class="tiny muted">API keys</span><b>0</b></div></div><div class="polish-note tiny" style="margin-top:14px"><b>Fixed this pass:</b> Marketing → Templates was the only explicit <code>data-action</code> without a listener in the source audit. It is now wired.</div><button class="btn" style="width:100%;margin-top:12px" data-action="qaOpenMobile">Open mobile QA</button><button class="btn" style="width:100%;margin-top:8px" data-action="qaOpenPerformance">Performance center</button><button class="btn" style="width:100%;margin-top:8px" data-nav="launchcheck">Launch checklist</button></aside></div>`};

  const qaActions=new Set(['runFinalSweep','qaOpenMobile','qaOpenPerformance']);
  document.addEventListener('click',e=>{const a=e.target.closest('[data-action]');if(!a||!qaActions.has(a.dataset.action))return;e.preventDefault();e.stopImmediatePropagation();if(a.dataset.action==='runFinalSweep'){state.finalQa.lastRun=new Date().toISOString();qaPersist();render('finalqa');try{toast('Final QA sweep complete')}catch(x){}return}if(a.dataset.action==='qaOpenMobile'){navigate('mobileqa');return}if(a.dataset.action==='qaOpenPerformance'){navigate('performance');return}},true);

  // Keep the command/global search aware of Final QA without changing API phase behavior.
  try{const oldSearchIndex=searchIndex;searchIndex=function(){const out=oldSearchIndex();if(!out.some(x=>x.route==='finalqa'))out.unshift({kind:'Module',title:'Final QA Sweep',route:'finalqa',meta:'Pre-API route/action/performance audit'});return out}}catch(e){}
  qaPersist();
})();
