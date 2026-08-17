
(function(){
  'use strict';
  var REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MAX_LIVE=3;          // each preview is a full app load
  var WARMUP=260;          // don't load a card the user is scrolling past
  var CYCLE=17000;         // one pass down the page and back
  var live=new Map();      // preview element -> session

  function slugOf(card){
    var n=card&&card.dataset?card.dataset.template:'';
    return String(n||'').toLowerCase().replace(/[^a-z0-9]+/g,'-');
  }

  function stop(prev){
    var s=live.get(prev);
    if(!s)return;
    live.delete(prev);
    if(s.raf)cancelAnimationFrame(s.raf);
    if(s.timer)clearTimeout(s.timer);
    prev.classList.remove('live-on');
    if(s.wrap&&s.wrap.parentNode)s.wrap.parentNode.removeChild(s.wrap);
  }

  function play(s){
    var w=s.frame.contentWindow, d=s.frame.contentDocument;
    if(!w||!d)return;
    var max=Math.max(1,d.documentElement.scrollHeight-w.innerHeight);
    if(REDUCED){w.scrollTo(0,0);return}
    var t0=performance.now();
    (function step(now){
      if(!live.has(s.host))return;
      var p=((now-t0)%CYCLE)/CYCLE;
      // ping-pong with easing, so the loop never snaps back
      var e=p<0.5?p*2:2-p*2;
      e=e*e*(3-2*e);
      try{w.scrollTo(0,max*e)}catch(err){}
      s.raf=requestAnimationFrame(step);
    })(t0);
  }

  function start(prev,card){
    if(live.has(prev))return;
    var slug=slugOf(card);
    if(!slug)return;

    var wrap=document.createElement('div');
    wrap.className='tmb-live';
    var frame=document.createElement('iframe');
    frame.setAttribute('tabindex','-1');
    frame.setAttribute('aria-hidden','true');
    frame.setAttribute('scrolling','no');
    frame.src='/preset/'+encodeURIComponent(slug);
    wrap.appendChild(frame);

    var badge=prev.querySelector('.tmb-badge');
    if(!badge){
      badge=document.createElement('span');
      badge.className='tmb-badge';
      badge.innerHTML='<i></i>LIVE';
      prev.appendChild(badge);
    }
    prev.appendChild(wrap);

    var s={host:prev,wrap:wrap,frame:frame,raf:0,timer:0};
    live.set(prev,s);

    frame.addEventListener('load',function(){
      if(!live.has(prev))return;
      var d=frame.contentDocument;
      if(!d)return;
      // the preview chrome belongs to the full page, not to a 220px card
      var st=d.createElement('style');
      st.textContent='.pv-bar{display:none!important}#cinematicPreloader{display:none!important}'
        +'html{scroll-behavior:auto!important}body{overflow:hidden!important}'
        +'::-webkit-scrollbar{display:none}';
      (d.head||d.documentElement).appendChild(st);
      wrap.style.setProperty('--live-scale',(prev.clientWidth/1440).toFixed(4));
      // give the preset a beat to paint before the crossfade
      s.timer=setTimeout(function(){
        if(!live.has(prev))return;
        wrap.classList.add('on');
        prev.classList.add('live-on');
        play(s);
      },520);
    });
  }

  // Nearest-to-centre cards win the few live slots there are.
  var visible=new Set();
  function rebalance(){
    var mid=innerHeight/2;
    var ranked=[...visible].map(function(prev){
      var r=prev.getBoundingClientRect();
      return {prev:prev,d:Math.abs(r.top+r.height/2-mid)};
    }).sort(function(a,b){return a.d-b.d}).slice(0,MAX_LIVE);
    var keep=new Set(ranked.map(function(x){return x.prev}));
    live.forEach(function(_,prev){if(!keep.has(prev))stop(prev)});
    ranked.forEach(function(x){
      var card=x.prev.closest('.template');
      if(card)start(x.prev,card);
    });
  }

  var io=new IntersectionObserver(function(rows){
    rows.forEach(function(r){
      if(r.isIntersecting)visible.add(r.target);
      else{visible.delete(r.target);stop(r.target)}
    });
    clearTimeout(window.__liveT);
    window.__liveT=setTimeout(rebalance,WARMUP);
  },{rootMargin:'80px',threshold:.35});

  function hook(){
    document.querySelectorAll('.template .template-preview').forEach(function(prev){
      if(prev.dataset.liveHooked)return;
      prev.dataset.liveHooked='1';
      io.observe(prev);
    });
    // a card that left the DOM must not keep an app alive
    live.forEach(function(_,prev){if(!prev.isConnected)stop(prev)});
  }

  addEventListener('scroll',function(){
    clearTimeout(window.__liveS);
    window.__liveS=setTimeout(rebalance,WARMUP);
  },{passive:true});

  new MutationObserver(hook).observe(document.body,{childList:true,subtree:true});
  hook();
})();
