/* Staff-only Admin Dashboard — business overview, users, payments and a
   report-abuse moderation queue, all real queries against the live backend.
   v1 is read-only on purpose: suspend/refund are a separate, more careful
   pass later. This file also wires up the /report-abuse page's submission
   form, which never had one before — it was static policy text only. */
(function(){
'use strict';
if(window.__ADMIN_ROUTES)window.__ADMIN_ROUTES.add('admindashboard');

var DASH={tab:'overview',loading:false,error:null,overview:null,users:null,payments:null,reports:null};

function money(minor,currency){return (currency||'INR')+' '+((Number(minor)||0)/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}
function why(e){try{return window.__apiWhy?window.__apiWhy(e,'admin dashboard'):String(e&&e.message||e)}catch(x){return 'Request failed'}}

async function loadTab(tab){
  DASH.loading=true;DASH.error=null;render('admindashboard');
  try{
    if(tab==='overview')DASH.overview=await api('/api/admin/dashboard/overview');
    else if(tab==='users')DASH.users=await api('/api/admin/dashboard/users');
    else if(tab==='payments')DASH.payments=await api('/api/admin/dashboard/payments');
    else if(tab==='abuse')DASH.reports=await api('/api/admin/dashboard/abuse-reports?status=all');
  }catch(e){DASH.error=why(e)}
  DASH.loading=false;render('admindashboard');
}

function tabBtn(id,label){return `<button class="chip ${DASH.tab===id?'active':''}" data-action="admdashTab" data-tab="${id}">${label}</button>`}

function overviewHTML(){
  var o=DASH.overview;if(!o)return '<div class="empty-state" style="padding:26px;text-align:center">Loading…</div>';
  return `<div class="admin-polish-grid">
    <div class="card admin-polish-card span-4" style="padding:18px"><span class="caps">Signups</span><h2 style="margin:6px 0">${o.signups.toLocaleString()}</h2><span class="tiny muted">total accounts</span></div>
    <div class="card admin-polish-card span-4" style="padding:18px"><span class="caps">Active · 30d</span><h2 style="margin:6px 0">${o.activeUsers30d.toLocaleString()}</h2><span class="tiny muted">signed in recently</span></div>
    <div class="card admin-polish-card span-4" style="padding:18px"><span class="caps">Revenue</span><h2 style="margin:6px 0">${money(o.revenue.minor,o.revenue.currency)}</h2><span class="tiny muted">${o.revenue.payments} payment(s) · Dodo only</span></div>
    <div class="card admin-polish-card span-4" style="padding:18px"><span class="caps">Credits granted</span><h2 style="margin:6px 0">${o.creditsGranted.toLocaleString()}</h2><span class="tiny muted">lifetime</span></div>
  </div>
  <p class="tiny muted" style="margin-top:14px">Revenue only counts Dodo payments captured after this dashboard shipped — earlier payments aren't backfilled.</p>`;
}

function usersHTML(){
  var d=DASH.users;if(!d)return '<div class="empty-state" style="padding:26px;text-align:center">Loading…</div>';
  var rows=d.users||[];
  if(!rows.length)return '<div class="empty-state" style="padding:26px;text-align:center">No users yet.</div>';
  return '<div class="table"><div class="tr header"><span>Email</span><span>Workspace</span><span>Role</span><span>Credits</span><span>Joined</span></div>'+
    rows.map(function(u){return '<div class="tr"><b>'+escB(u.email||'—')+'</b><span class="tiny muted">'+escB(u.workspaceName||'—')+'</span><span class="tiny muted">'+escB(u.role||'—')+'</span><span>'+Number(u.creditsAvailable||0).toLocaleString()+'</span><span class="tiny muted">'+new Date(u.createdAt).toLocaleDateString()+'</span></div>'}).join('')+
    '</div><div class="tiny muted" style="margin-top:10px">'+d.total+' user(s) total · showing '+rows.length+'</div>';
}

function paymentsHTML(){
  var d=DASH.payments;if(!d)return '<div class="empty-state" style="padding:26px;text-align:center">Loading…</div>';
  var rows=d.payments||[];
  if(!rows.length)return '<div class="empty-state" style="padding:26px;text-align:center">No payments captured yet.</div>';
  return '<div class="table"><div class="tr header"><span>Date</span><span>Workspace</span><span>Kind</span><span>Amount</span><span>Status</span></div>'+
    rows.map(function(p){return '<div class="tr"><span class="tiny muted">'+new Date(p.createdAt).toLocaleString()+'</span><b>'+escB(p.workspaceName||'—')+'</b><span class="tiny muted">'+escB(p.kind||'—')+'</span><span>'+money(p.amountMinor,p.currency)+'</span><span class="status live">'+escB(p.status)+'</span></div>'}).join('')+
    '</div><div class="tiny muted" style="margin-top:10px">'+d.total+' payment(s) total · showing '+rows.length+'</div>';
}

function abuseHTML(){
  var d=DASH.reports;if(!d)return '<div class="empty-state" style="padding:26px;text-align:center">Loading…</div>';
  var rows=d.reports||[];
  if(!rows.length)return '<div class="empty-state" style="padding:26px;text-align:center">No abuse reports yet.</div>';
  return '<div class="table"><div class="tr header"><span>Reported</span><span>From</span><span>URL</span><span>Description</span><span>Status</span><span></span></div>'+
    rows.map(function(r){
      return '<div class="tr"><span class="tiny muted">'+new Date(r.createdAt).toLocaleString()+'</span><b>'+escB(r.reporterEmail||'—')+'</b><span class="tiny muted">'+escB(r.targetUrl||'—')+'</span><span class="tiny">'+escB(String(r.description||'').slice(0,140))+'</span><span class="status '+(r.status==='resolved'?'live':'warn')+'">'+escB(r.status)+'</span>'+
        (r.status==='open'?'<button class="btn ghost" data-action="admdashResolve" data-id="'+escB(r.id)+'">Mark resolved</button>':'<span></span>')+
      '</div>';
    }).join('')+
  '</div>';
}

views.admindashboard=function(){
  var tabs=[['overview','Overview'],['users','Users'],['payments','Payments'],['abuse','Abuse Queue']];
  var body;
  if(DASH.loading)body='<div class="empty-state" style="padding:40px;text-align:center">Loading…</div>';
  else if(DASH.error)body='<div class="empty-state" style="padding:26px;text-align:center;color:#e0616b">Could not load: '+escB(DASH.error)+'</div>';
  else if(DASH.tab==='overview')body=overviewHTML();
  else if(DASH.tab==='users')body=usersHTML();
  else if(DASH.tab==='payments')body=paymentsHTML();
  else body=abuseHTML();

  if(!DASH.loading&&!DASH.error){
    var key=DASH.tab==='abuse'?'reports':DASH.tab;
    if(!DASH[key])setTimeout(function(){loadTab(DASH.tab)},0);
  }

  return viewHead('Admin Dashboard','Business overview, users, payments and moderation — all live queries.',
    '<button class="btn" data-action="admdashRefresh">Refresh</button>')+
    '<div class="legal-tabs">'+tabs.map(function(t){return tabBtn(t[0],t[1])}).join('')+'</div>'+
    '<div style="margin-top:16px">'+body+'</div>';
};

// The /report-abuse page (views.legal on the 'acceptable' tab) was static
// policy text with no way to actually submit a report — this appends a real
// form under it, wired to the new public endpoint.
var baseLegal=views.legal;
views.legal=function(){
  var html=baseLegal();
  if(state.legalTab!=='acceptable')return html;
  return html+`<div class="card legal-doc" style="margin-top:16px">
    <span class="caps">Report a problem</span><h3 style="margin:8px 0 4px">Submit a report</h3>
    <p class="tiny muted" style="margin:0 0 14px">Tell us what happened — we read every report.</p>
    <div class="field"><label>Your email (optional)</label><input class="prop-input" id="abuseReportEmail" placeholder="you@example.com"/></div>
    <div class="field"><label>Link or page you're reporting (optional)</label><input class="prop-input" id="abuseReportUrl" placeholder="https://..."/></div>
    <div class="field"><label>What happened</label><textarea class="prop-input" id="abuseReportDesc" rows="4" placeholder="Describe the issue"></textarea></div>
    <button class="btn primary" data-action="submitAbuseReport" style="margin-top:6px">Submit report</button>
    <div id="abuseReportMsg" class="tiny muted" style="margin-top:8px"></div>
  </div>`;
};

document.addEventListener('click',async function(e){
  var b=e.target.closest('[data-action]');if(!b)return;
  var a=b.dataset.action;
  if(a==='admdashTab'){e.preventDefault();DASH.tab=b.dataset.tab;render('admindashboard');return}
  if(a==='admdashRefresh'){e.preventDefault();var key=DASH.tab==='abuse'?'reports':DASH.tab;DASH[key]=null;loadTab(DASH.tab);return}
  if(a==='admdashResolve'){
    e.preventDefault();
    try{await api('/api/admin/dashboard/abuse-reports/'+encodeURIComponent(b.dataset.id)+'/resolve',{method:'POST'});toast('Marked resolved');DASH.reports=null;loadTab('abuse')}
    catch(err){toast(why(err))}
    return;
  }
  if(a==='submitAbuseReport'){
    e.preventDefault();
    var email=(document.getElementById('abuseReportEmail')||{}).value||'';
    var targetUrl=(document.getElementById('abuseReportUrl')||{}).value||'';
    var description=(document.getElementById('abuseReportDesc')||{}).value||'';
    var msgEl=document.getElementById('abuseReportMsg');
    if(!description.trim()){if(msgEl)msgEl.textContent='Please describe what happened.';return}
    try{
      await api('/api/report-abuse',{method:'POST',body:JSON.stringify({email:email,targetUrl:targetUrl,description:description})});
      if(msgEl){msgEl.style.color='#7ee787';msgEl.textContent='Thank you — your report was submitted.'}
      var de=document.getElementById('abuseReportDesc');if(de)de.value='';
      var ue=document.getElementById('abuseReportUrl');if(ue)ue.value='';
    }catch(err){
      if(msgEl){msgEl.style.color='#e0616b';msgEl.textContent=why(err)}
    }
    return;
  }
},true);
})();
