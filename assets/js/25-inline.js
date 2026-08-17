
(function(){
  'use strict';
  var E=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};

  function cinemaMarkup(c){
    var L=c.layers||{};
    var nav=(c.nav||[]).map(function(n){return '<a href="'+E(n[1])+'">'+E(n[0])+'</a>'}).join('');
    var cards=(c.cards||[]).map(function(s){
      return '<article class="cin-sight-card" tabindex="0" role="button" aria-label="Open '+E(s.title)+' card">'
        +'<span class="cin-sight-kicker">'+E(s.kicker)+'</span>'
        +'<img class="cin-sight-pin" src="'+E(s.pin)+'" alt=""/>'
        +'<h3>'+E(s.title)+'</h3><p>'+E(s.copy)+'</p></article>';
    }).join('');
    var panels=(c.panels||[]).map(function(p){
      var extra='';
      if(p.facts)extra='<dl class="cin-facts">'+p.facts.map(function(f){
        return '<div><dt>'+E(f[0])+'</dt><dd>'+E(f[1])+'</dd></div>'}).join('')+'</dl>';
      if(p.button){
        // a label with a destination is a link, not a button that does nothing
        var tag=p.href?'a':'button', attr=p.href?' href="'+E(p.href)+'"':' type="button"';
        extra='<'+tag+' class="cin-note-button"'+attr+'><span aria-hidden="true">&#8599;</span>'
          +'<span>'+E(p.button)+'</span></'+tag+'>';
      }
      return '<section class="cin-story-panel cin-story-panel-'+E(p.id)+'" aria-label="'+E(p.label||p.id)+'">'
        +'<h2>'+E(p.h2)+'</h2><p>'+E(p.p)+'</p>'+extra+'</section>';
    }).join('');

    return '<section class="cin-cinema-scroll" id="cinema" aria-label="'+E(c.aria||'Cinematic scroll story')+'">'
      +'<div class="cin-stage"><div class="cin-world">'
      +(L.video
        ? '<video class="cin-scene-img cin-sky-img" src="'+E(L.video)+'" autoplay muted loop playsinline preload="auto"></video>'
        : '<img class="cin-scene-img cin-sky-img" src="'+E(L.sky)+'" alt=""/>')
      +'<header class="cin-site-header" aria-label="Primary navigation">'
        +'<a class="cin-site-logo" href="#cinema">'+E(c.logo)+'</a>'
        +'<nav class="cin-site-nav" aria-label="Main menu">'+nav+'</nav>'
        +'<button class="cin-language-switcher" aria-label="Change language"><span>EN</span><span aria-hidden="true">&#8964;</span></button>'
      +'</header>'
      +'<div class="cin-back-stack">'
        +'<img class="cin-scene-img cin-back-img cin-back-four" src="'+E(L.four)+'" alt=""/>'
        +'<section class="cin-sights-slider" aria-label="Sights slider"><div class="cin-sights-track">'+cards+'</div></section>'
        +'<img class="cin-scene-img cin-back-img cin-back-bazaar" src="'+E(L.bazaar)+'" alt=""/>'
      +'</div>'
      +'<div class="cin-sights-controls" aria-label="Slider controls">'
        +'<button class="cin-sight-nav cin-sight-prev" aria-label="Previous sight">&#8592;</button>'
        +'<button class="cin-sight-nav cin-sight-next" aria-label="Next sight">&#8594;</button>'
      +'</div>'
      +'<h1 class="cin-hero-title">'+E(c.title)+'</h1>'
      +'<img class="cin-scene-img cin-splitframe-img cin-splitframe-left" src="'+E(L.splitLeft)+'" alt=""/>'
      +'<img class="cin-scene-img cin-splitframe-img cin-splitframe-right" src="'+E(L.splitRight)+'" alt=""/>'
      +'<img class="cin-scene-img cin-bridge-img" src="'+E(L.bridge)+'" alt=""/>'
      +'<img class="cin-scene-img cin-frame-two-img" src="'+E(L.frameTwo)+'" alt=""/>'
      +'<div class="cin-shade"></div></div>'
      +'<section class="cin-intro-copy" aria-label="Overview"><p>'+E(c.intro)+'</p>'
        +'<div class="cin-hero-tags">'+(c.tags||[]).map(function(t){return '<span>'+E(t)+'</span>'}).join('')+'</div>'
      +'</section>'
      +panels
      +'</div></section>';
  }

  // ---- the engine -------------------------------------------------------
  function startCinema(host){
    var section=host.querySelector('.cin-cinema-scroll');
    if(!section)return function(){};
    var reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
    var track=host.querySelector('.cin-sights-track');
    var controls=host.querySelector('.cin-sights-controls');
    var prev=host.querySelector('.cin-sight-prev');
    var next=host.querySelector('.cin-sight-next');
    var originals=Array.prototype.slice.call(host.querySelectorAll('.cin-sight-card'));

    var targetMouseX=0,targetMouseY=0,mouseX=0,mouseY=0;
    var targetScroll=0,smoothScroll=0,initialized=false,rafPending=false,dead=false;
    var cards=[],count=originals.length,active=count;

    var clamp=function(v,min,max){min=min===undefined?0:min;max=max===undefined?1:max;return Math.min(max,Math.max(min,v))};
    var smoothstep=function(e0,e1,v){var x=clamp((v-e0)/(e1-e0));return x*x*(3-2*x)};
    var lerp=function(a,b,t){return a+(b-a)*t};
    var seg=function(s,a,b,c,d){var en=smoothstep(a,b,s),ex=smoothstep(c,d,s);return {enter:en,exit:ex,active:en*(1-ex)}};
    var dist=function(){return clamp(-section.getBoundingClientRect().top,0,section.offsetHeight-window.innerHeight)};
    var set=function(k,v){host.style.setProperty(k,v)};

    function updateSlider(){
      if(!track||!cards.length)return;
      var w=cards[0].offsetWidth;
      var gap=parseFloat(getComputedStyle(track).columnGap||'0');
      set('--sights-shift',(-(w+gap)*active)+'px');
      cards.forEach(function(c,i){c.classList.toggle('cin-is-active',i===active)});
    }
    function move(dir){active+=dir;updateSlider()}
    function select(card){var i=Number(card.dataset.sightIndex);if(isFinite(i))active=i;updateSlider()}
    function jump(i){
      track.classList.add('cin-is-jumping');active=i;updateSlider();
      requestAnimationFrame(function(){requestAnimationFrame(function(){track.classList.remove('cin-is-jumping')})});
    }
    function normalize(){
      if(active>=count*2)jump(active-count);
      else if(active<count)jump(active+count);
    }
    function setupSlider(){
      if(!track||!count)return;
      track.replaceChildren();
      // three identical sets, so the track can always be jumped back to the
      // middle one without the viewer ever seeing an edge
      for(var s=0;s<3;s++){
        originals.forEach(function(card,i){
          var clone=card.cloneNode(true);
          clone.dataset.sightIndex=String(s*count+i);
          track.append(clone);
        });
      }
      cards=Array.prototype.slice.call(track.querySelectorAll('.cin-sight-card'));
      active=count;
      cards.forEach(function(card){
        card.addEventListener('click',function(){select(card)});
        card.addEventListener('keydown',function(ev){
          if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();select(card)}
        });
      });
      track.addEventListener('transitionend',normalize);
      updateSlider();
    }

    function update(){
      rafPending=false;
      if(dead||!host.isConnected)return;

      targetScroll=dist();
      if(!initialized||reduceMotion.matches){smoothScroll=targetScroll;initialized=true}
      else smoothScroll=lerp(smoothScroll,targetScroll,0.14);
      if(Math.abs(smoothScroll-targetScroll)<0.08)smoothScroll=targetScroll;

      mouseX=lerp(mouseX,targetMouseX,0.12);
      mouseY=lerp(mouseY,targetMouseY,0.12);

      var f2=seg(smoothScroll,560,900,1300,1620);
      var f3=seg(smoothScroll,1760,2140,2540,2700);
      var progress=clamp(smoothScroll/2700);
      var introExit=smoothstep(90,650,smoothScroll);
      var sightsEnter=Math.pow(smoothstep(2760,3560,smoothScroll),1.55);
      var ctrlEnter=smoothstep(3360,3660,smoothScroll);
      var blurActive=clamp(f2.active+f3.active);
      var splitDrift=Math.pow(f2.enter,1.5);
      var backScale=0.76+progress*0.2+f2.enter*0.18+f3.enter*0.16;
      var heroY=progress*-74, heroScale=progress*0.23;
      var screenTop=Math.min(220,Math.max(112,window.innerHeight*0.19))-50;
      var parentTop=window.innerHeight-(window.innerHeight-screenTop)/backScale;

      set('--mx',(reduceMotion.matches?0:mouseX).toFixed(4));
      set('--my',(reduceMotion.matches?0:mouseY).toFixed(4));
      set('--back-opacity',1-f2.active*0.06);
      set('--back-x',(mouseX*-12)+'px');
      set('--back-y',(mouseY*-4)+'px');
      set('--back-scale',backScale);
      set('--four-y',(10+progress*10)+'vh');
      set('--four-scale',0.78+progress*0.16);
      set('--bazaar-y',(20-progress*8)+'vh');
      set('--blur-px',(blurActive*14)+'px');
      set('--back-brightness',1-blurActive*0.255);
      set('--bazaar-blur-px',(f2.active*14)+'px');
      set('--bazaar-brightness',1-f2.active*0.255-f3.active*0.06);
      set('--bazaar-saturation',1+f3.active*0.18);
      set('--shade-opacity','1');
      set('--shade-z',f2.active>0.02?'2':'0');
      set('--shade-top-alpha',blurActive*0.465);
      set('--shade-mid-alpha',blurActive*0.42);
      set('--shade-bottom-alpha',blurActive*0.51);
      set('--title-y',(introExit*-210)+'px');
      set('--title-scale',1-introExit*0.08);
      set('--title-opacity',1-introExit);
      set('--bridge-x','calc(-50% + '+(mouseX*18)+'px)');
      set('--bridge-y',(mouseY*8+heroY-f2.exit*760)+'px');
      set('--bridge-bottom',(5-f2.enter*13)+'vh');
      set('--bridge-width',(67.2+f2.enter*37.8)+'vw');
      set('--bridge-scale',1.02+heroScale+f2.exit*0.46);
      set('--split-left-x','calc(-50% + '+(-splitDrift*46)+'vw + '+(mouseX*22)+'px)');
      set('--split-left-y',(mouseY*10+heroY-splitDrift*180)+'px');
      set('--split-left-scale',1+heroScale+f2.enter*0.74);
      set('--split-right-x','calc(-50% + '+(splitDrift*46)+'vw + '+(mouseX*22)+'px)');
      set('--split-right-y',(mouseY*10+heroY-splitDrift*180)+'px');
      set('--split-right-scale',1+heroScale+f2.enter*0.74);
      set('--frame2-opacity',f2.active*(1-f3.enter));
      set('--frame2-x','calc(-50% + '+(mouseX*10)+'px)');
      set('--frame2-y','calc(-50% + '+(mouseY*8-f2.exit*150)+'px)');
      set('--frame2-scale',1.06+f2.enter*0.08+f2.exit*0.08);
      set('--intro-copy-y',(introExit*90)+'px');
      set('--intro-copy-opacity',1-introExit);
      set('--panel2-opacity',f2.active*(1-f2.exit));
      set('--panel2-y','calc(-50% + '+(-f2.exit*86+(1-f2.enter)*58)+'px)');
      set('--panel3-opacity',f3.active*(1-f3.exit));
      set('--panel3-y','calc(-50% + '+(-f3.exit*86+(1-f3.enter)*58)+'px)');
      set('--sights-opacity',sightsEnter);
      set('--sights-controls-opacity',ctrlEnter);
      if(controls)controls.classList.toggle('cin-is-ready',ctrlEnter>0.98);
      set('--sights-visibility',sightsEnter>0.01?'visible':'hidden');
      set('--sights-y','0px');
      set('--sights-enter-x',((1-sightsEnter)*420)+'vw');
      set('--sights-scale',1/backScale);
      set('--sights-top',parentTop+'px');
      set('--sights-screen-top',screenTop+'px');

      if(Math.abs(smoothScroll-targetScroll)>0.08||
         Math.abs(mouseX-targetMouseX)>0.001||
         Math.abs(mouseY-targetMouseY)>0.001)tick();
    }
    function tick(){if(rafPending||dead)return;rafPending=true;requestAnimationFrame(update)}

    var onScroll=function(){tick()};
    var onResize=function(){updateSlider();tick()};
    var onMove=function(ev){
      targetMouseX=ev.clientX/window.innerWidth-0.5;
      targetMouseY=ev.clientY/window.innerHeight-0.5;
      tick();
    };
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onResize);
    window.addEventListener('pointermove',onMove,{passive:true});
    if(prev)prev.addEventListener('click',function(){move(-1)});
    if(next)next.addEventListener('click',function(){move(1)});

    setupSlider();
    tick();

    return function dispose(){
      dead=true;
      window.removeEventListener('scroll',onScroll);
      window.removeEventListener('resize',onResize);
      window.removeEventListener('pointermove',onMove);
    };
  }

  // shared with the builder: the same markup and the same engine drive the
  // preset page, the editor canvas and the published site
  window.__cinemaMarkup=cinemaMarkup;
  window.__cinemaStart=startCinema;

  window.renderCinemaPreset=function(tpl){
    var host=document.getElementById('presetView');
    if(!host||!tpl||!tpl.cinema)return false;
    if(window.__cinemaDispose){try{window.__cinemaDispose()}catch(e){}}
    host.classList.add('cinema-on');
    host.innerHTML=cinemaMarkup(tpl.cinema)
      +'<div class="pv-bar"><span class="c">'+E(tpl.name)+'</span><span class="n">'+E(tpl.tag||tpl.category)+'</span>'
      +'<button class="btn primary" data-action="usePresetFromPreview" data-template="'+E(tpl.name)+'">Use this template &rarr;</button>'
      +'<button class="btn ghost" data-nav="marketing">Close</button></div>';
    window.__cinemaDispose=startCinema(host);
    window.scrollTo(0,0);
    return true;
  };

  // Delegate: a template that carries a `cinema` block gets the scroll rig,
  // everything else keeps the ordinary preset page.
  var basePreset=window.renderPreset;
  window.renderPreset=function(tpl){
    var host=document.getElementById('presetView');
    if(tpl&&tpl.cinema&&window.renderCinemaPreset(tpl))return;
    if(host){
      host.classList.remove('cinema-on');
      if(window.__cinemaDispose){try{window.__cinemaDispose()}catch(e){}window.__cinemaDispose=null}
    }
    return basePreset.apply(this,arguments);
  };

  // /preset/<name> is resolved by an earlier script, which has already drawn
  // the ordinary page by the time this override exists. Catch that first paint
  // up rather than leaving a direct load showing the wrong renderer.
  var opened=document.getElementById('presetView');
  if(opened&&opened.classList.contains('on')&&!opened.classList.contains('cinema-on')&&
     window.__presetTpl&&window.__presetTpl.cinema){
    window.renderCinemaPreset(window.__presetTpl);
  }
})();
