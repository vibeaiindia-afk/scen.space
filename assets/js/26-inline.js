
(function(){
  'use strict';
  var E=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};

  var CHEV='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
          +'stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

  function markup(h){
    var nav=(h.nav||[]).map(function(n){
      return '<a class="ph-navitem" href="#">'+E(n.label)+(n.chevron?CHEV:'')+'</a>';
    }).join('');
    var sub=(h.subtitle||[]).map(E).join('<br/>');
    var label=(h.marqueeLabel||[]).map(E).join('<br/>');
    return '<div class="ph-root">'
      +'<video class="ph-video" src="'+E(h.video)+'" autoplay muted playsinline preload="auto"></video>'
      +'<div class="ph-content"><header class="ph-hero">'
      +  '<div class="ph-blur" aria-hidden="true"></div>'
      +  '<div><nav class="ph-nav">'
      +    '<a class="ph-logo" href="#"><span class="ph-wordmark">'+E(h.brand)+'</span></a>'
      +    '<div class="ph-navcenter">'+nav+'</div>'
      +    '<button class="ph-btn liquid-glass ph-signup" type="button">'+E(h.signup)+'</button>'
      +  '</nav><div class="ph-divider" aria-hidden="true"></div></div>'
      +  '<div class="ph-center"><div class="ph-copy">'
      +    '<h1 class="ph-title">'+E(h.titlePlain)+'<span class="ph-grad">'+E(h.titleGradient)+'</span></h1>'
      +    '<p class="ph-sub">'+sub+'</p>'
      +    '<button class="ph-btn liquid-glass ph-cta" type="button">'+E(h.cta)+'</button>'
      +  '</div></div>'
      +  '<div class="ph-marquee-wrap"><div class="ph-marquee-inner">'
      +    '<div class="ph-marquee-label">'+label+'</div>'
      +    '<div class="ph-marquee"><div class="ph-track"></div></div>'
      +  '</div></div>'
      +'</header></div></div>';
  }

  // One live hero at a time; the previous one's rAF and listeners are dropped.
  var dispose=null;

  function mount(host,h){
    if(dispose){try{dispose()}catch(e){}dispose=null}

    var track=host.querySelector('.ph-track');
    if(track){
      var half=(h.brands||[]).map(function(n){
        return '<div class="ph-brand"><div class="ph-brand-icon liquid-glass">'+E(n.charAt(0))+'</div>'
             + '<span class="ph-brand-name">'+E(n)+'</span></div>';
      }).join('');
      track.innerHTML=half+half;   // 2x -> translateX(-50%) is an exact loop
    }

    var v=host.querySelector('.ph-video');
    if(!v)return;

    var FADE=0.5, replaying=false, raf=null, dead=false;

    function tick(){
      if(dead)return;
      var d=v.duration;
      if(isFinite(d)&&d>0&&!replaying){
        var t=v.currentTime,o=1;
        if(t<FADE){o=t/FADE}
        else if(d-t<FADE){o=Math.max(0,(d-t)/FADE)}
        v.style.opacity=String(Math.min(1,Math.max(0,o)));
      }
      raf=requestAnimationFrame(tick);
    }
    function start(){if(!raf&&!dead)raf=requestAnimationFrame(tick)}
    function stop(){if(raf){cancelAnimationFrame(raf);raf=null}}

    function onEnded(){
      replaying=true;
      v.style.opacity='0';
      setTimeout(function(){
        if(dead)return;
        try{v.currentTime=0}catch(e){}
        replaying=false;
        var p=v.play(); if(p&&p.catch)p.catch(function(){});
      },100);
    }
    function kick(){
      if(dead)return;
      var p=v.play();
      if(p&&p.catch)p.catch(function(){
        document.addEventListener('click',kick,{once:true});
        document.addEventListener('touchstart',kick,{once:true});
      });
    }
    function sync(){ if(document.hidden){stop();v.pause()} else {start();kick()} }

    v.addEventListener('ended',onEnded);
    v.addEventListener('loadedmetadata',kick);
    document.addEventListener('visibilitychange',sync);
    kick(); start();

    dispose=function(){
      dead=true; stop();
      v.removeEventListener('ended',onEnded);
      v.removeEventListener('loadedmetadata',kick);
      document.removeEventListener('visibilitychange',sync);
      try{v.pause()}catch(e){}
    };
  }

  var prev=window.renderPreset;
  window.renderPreset=function(tpl){
    var host=document.getElementById('presetView');
    var out=prev.apply(this,arguments);
    if(!host)return out;
    if(tpl&&tpl.powerHero){
      host.classList.add('power-on');
      var old=host.querySelector('.pv-hero');
      if(old){
        old.insertAdjacentHTML('beforebegin',markup(tpl.powerHero));
        old.parentNode.removeChild(old);
      }
      mount(host,tpl.powerHero);
    }else{
      host.classList.remove('power-on');
      if(dispose){try{dispose()}catch(e){}dispose=null}
    }
    return out;
  };

  // A direct load of /preset/power has already been drawn by the earlier
  // script by the time this override exists — same catch-up the cinema
  // preset does, so the first paint is not left on the wrong renderer.
  var opened=document.getElementById('presetView');
  if(opened&&opened.classList.contains('on')&&!opened.classList.contains('power-on')&&
     window.__presetTpl&&window.__presetTpl.powerHero){
    window.renderPreset(window.__presetTpl);
  }
})();
