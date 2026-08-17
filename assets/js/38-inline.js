
(function(){
  'use strict';
  var base=window.__apiWhy||function(e){return String(e&&e.message||e)};
  var why=function(e){return base(e,'active sessions')};
  var loaded=false, busy=false;

  // user agents are long; the row only has space for something recognisable
  function device(ua){
    ua=String(ua||'');
    if(!ua)return 'Unknown device';
    var b=/Edg\//.test(ua)?'Edge':/OPR\//.test(ua)?'Opera':/Chrome\//.test(ua)?'Chrome'
      :/Safari\//.test(ua)?'Safari':/Firefox\//.test(ua)?'Firefox':'Browser';
    var o=/iPhone|iPad/.test(ua)?'iOS':/Android/.test(ua)?'Android':/Mac OS X/.test(ua)?'macOS'
      :/Windows/.test(ua)?'Windows':/Linux/.test(ua)?'Linux':'';
    return o?b+' on '+o:b;
  }
  function ago(v){
    if(!v)return 'unknown';
    var d=new Date(v);if(isNaN(d))return 'unknown';
    var s=Math.floor((Date.now()-d.getTime())/1000);
    if(s<90)return 'just now';
    if(s<3600)return Math.floor(s/60)+' min ago';
    if(s<86400)return Math.floor(s/3600)+' h ago';
    return d.toLocaleDateString(undefined,{day:'numeric',month:'short'});
  }

  // the existing view renders state.sessions, so fill it with the real rows
  // rather than re-implementing the markup
  async function load(){
    try{
      var d=await api('/api/auth/sessions');
      state.sessions=(d.sessions||d||[]).map(function(s){
        return {id:s.id,device:device(s.deviceLabel),location:s.ipHint||'—',
                last:ago(s.lastSeenAt||s.createdAt),current:!!s.current};
      });
      state.sessionsNote='';
    }catch(e){state.sessions=[];state.sessionsNote=why(e)}
    loaded=true;
    if(state.route==='security')render('security');
  }

  var baseNav=window.navigate;
  window.navigate=function(route){
    var r=baseNav.apply(this,arguments);
    if(state.route==='security'){loaded=false;load()}
    return r;
  };

  /**
   * The old handlers are keyed off the action name, and this file has enough
   * layered click listeners that racing them by event phase is not reliable.
   * Renaming the actions is: the local-only branch can no longer match, so
   * there is nothing to out-order.
   */
  var baseView=views.security;
  views.security=function(){
    var html=baseView.apply(this,arguments);
    html=html.split('data-action="revokeSession"').join('data-action="rvkOne"')
             .split('data-action="revokeOtherSessions"').join('data-action="rvkAll"');
    if(!loaded)return html;
    if(state.sessionsNote)html=html.replace('<h3>Devices signed in</h3>',
      '<h3>Devices signed in</h3><p class="tiny muted" style="color:#e0616b">'+
      String(state.sessionsNote).replace(/[&<>"]/g,'')+'</p>');
    else if(!state.sessions.length)html=html.replace('<h3>Devices signed in</h3>',
      '<h3>Devices signed in</h3><p class="tiny muted">No other devices signed in.</p>');
    return html;
  };

  document.addEventListener('click',async function(e){
    var a=e.target.closest&&e.target.closest('[data-action]');
    if(!a)return;
    var act=a.dataset.action==='rvkOne'?'revokeSession'
           :a.dataset.action==='rvkAll'?'revokeOtherSessions':null;
    if(!act)return;
    e.preventDefault();e.stopPropagation();
    if(busy)return;
    busy=true;a.disabled=true;
    try{
      if(act==='revokeSession'){
        await api('/api/auth/sessions/'+encodeURIComponent(a.dataset.session),{method:'DELETE'});
        toast('Session revoked');
      }else{
        await api('/api/auth/sessions?others=true',{method:'DELETE'});
        toast('Other sessions signed out');
      }
      await load();
    }catch(err){
      state.sessionsNote=why(err);
      toast(state.sessionsNote);
      render('security');
    }
    busy=false;
  },true);
})();
