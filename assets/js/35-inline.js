
(function(){
  'use strict';

  var TEXT_CLASS={'Word Cascade':'ms-run','Split Mask':'ms-run ms-split',
    'Depth Type':'ms-run ms-depth','Scroll Stretch':'ms-run ms-stretch','Soft Reveal':'ms-run ms-soft'};
  var TRANS_CLASS={'Depth Fade':'ms-t-fade','Portal':'ms-t-portal',
    'Slide Depth':'ms-t-slide','Iris':'ms-t-iris'};

  function ms(){
    state.motionStudio=state.motionStudio||{};
    var m=state.motionStudio;
    m.text=m.text||{preset:'Word Cascade',stagger:80,blur:14,y:42,scale:.94,tracking:-2,mask:'Soft Clip'};
    m.frame=m.frame||{frames:84,fps:24,markers:[0,21,42,63,83]};
    m.transition=m.transition||{preset:'Depth Fade',duration:1,easing:'Cinematic'};
    return m;
  }
  window.__motionStudio=ms;

  /** Wrap each word so it can be staggered, then run the configured animation. */
  function animateHeadline(el,t){
    if(!el)return;
    var text=(el.dataset.msText||el.textContent||'').trim();
    if(!text)return;
    el.dataset.msText=text;
    var masked=String(t.mask||'').indexOf('Clip')>-1||t.preset==='Split Mask';
    el.innerHTML=text.split(/\s+/).map(function(w,i){
      var span='<span class="ms-word" style="animation-delay:'+(i*(Number(t.stagger)||80))+'ms">'+w+'</span>';
      return masked?'<span class="ms-mask">'+span+'</span>':span;
    }).join(' ');
    el.style.setProperty('--ms-y',(Number(t.y)||0)+'px');
    el.style.setProperty('--ms-blur',(Number(t.blur)||0)+'px');
    el.style.setProperty('--ms-scale',Number(t.scale)||1);
    el.style.setProperty('--ms-dur',(600+(Number(t.stagger)||80)*3)+'ms');
    el.style.letterSpacing=(Number(t.tracking)||0)/100+'em';
    el.className=(el.className.replace(/ms-[\w-]+/g,'').trim()+' '+(TEXT_CLASS[t.preset]||'ms-run')).trim();
  }
  window.__animateHeadline=animateHeadline;

  function replay(){
    var h=document.querySelector('.canvas-device .site-hero h1');
    if(!h)return;
    var t=ms().text;
    h.classList.remove('ms-run');
    void h.offsetWidth;                       // force the animation to restart
    animateHeadline(h,t);
  }
  window.__replayHeadline=replay;

  // run it whenever the canvas is (re)drawn, and on a page change
  var lastPage='';
  new MutationObserver(function(){
    if(state.route!=='builder')return;
    var h=document.querySelector('.canvas-device .site-hero h1');
    if(!h)return;
    var m=ms();
    var stamp=JSON.stringify(m.text)+'|'+(h.dataset.msText||h.textContent||'').trim();
    if(h.dataset.msDone===stamp)return;
    h.dataset.msDone=stamp;
    animateHeadline(h,m.text);

    if(lastPage&&lastPage!==state.currentPageId){
      var dev=document.querySelector('.canvas-device');
      if(dev){
        var cls=TRANS_CLASS[m.transition.preset]||'ms-t-fade';
        dev.style.setProperty('--ms-tdur',(Number(m.transition.duration)||1)+'s');
        dev.classList.remove('ms-t-fade','ms-t-portal','ms-t-slide','ms-t-iris');
        void dev.offsetWidth;
        dev.classList.add(cls);
      }
    }
    lastPage=state.currentPageId;
  }).observe(document.body,{childList:true,subtree:true});

  // changing a motion setting should be visible immediately
  document.addEventListener('change',function(e){
    if(!e.target.closest('[data-motion-field],[data-text-field],[data-frame-field],[data-transition-field]'))return;
    setTimeout(function(){saveState();replay()},60);
  });
  document.addEventListener('input',function(e){
    if(!e.target.closest('[data-motion-field],[data-text-field],[data-frame-field],[data-transition-field]'))return;
    clearTimeout(window.__msT);
    window.__msT=setTimeout(replay,180);
  });

  /* ---------- the showreel actually plays ---------- */

  var reelRaf=0;
  function playShowreel(){
    var m=ms(), f=m.frame, t=m.text;
    var total=Math.max(1,Number(f.frames)||84), fps=Math.max(1,Number(f.fps)||24);
    var durMs=total/fps*1000;
    var title=state.heroTitle||state.projectName||'Your headline';
    var marks=(f.markers||[]).map(function(x){return Math.round(x/total*100)});

    modal('<div class="modal-head"><div><span class="caps">Showreel</span>'
      +'<b style="display:block;margin-top:4px">'+total+' frames &middot; '+fps+'fps &middot; '
      +(t.preset||'Word Cascade')+'</b></div>'
      +'<button class="close" data-action="closeModal">&times;</button></div>'
      +'<div class="modal-body"><div class="ms-reel"><h2 id="msReelTitle">'+title.replace(/[<>&]/g,'')+'</h2></div>'
      +'<div class="ms-reelbar"><span class="t" id="msNow">frame 0</span>'
      +'<div class="ms-track" id="msTrack"><i id="msFill"></i>'
      +marks.map(function(p){return '<span class="ms-mark" style="left:'+p+'%"></span>'}).join('')
      +'</div><span class="t">'+total+' / '+(durMs/1000).toFixed(1)+'s</span></div>'
      +'<div style="display:flex;gap:8px;margin-top:14px">'
      +'<button class="btn" id="msReplay">Replay</button>'
      +'<span class="grow"></span>'
      +'<button class="btn primary" data-action="closeModal">Done</button></div>'
      +'<div class="tiny muted" style="margin-top:10px">This is the same animation the headline uses on your site. '
      +'Change the preset, stagger or blur and press Replay.</div></div>');

    var el=document.getElementById('msReelTitle');
    function run(){
      cancelAnimationFrame(reelRaf);
      el.classList.remove('ms-run');
      void el.offsetWidth;
      animateHeadline(el,t);
      var t0=performance.now();
      (function step(now){
        if(!document.getElementById('msReelTitle'))return;
        var p=Math.min(1,(now-t0)/durMs);
        var fill=document.getElementById('msFill'), lab=document.getElementById('msNow');
        if(fill)fill.style.width=(p*100)+'%';
        if(lab)lab.textContent='frame '+Math.round(p*total);
        if(p<1)reelRaf=requestAnimationFrame(step);
      })(t0);
    }
    run();
    var rb=document.getElementById('msReplay');
    if(rb)rb.addEventListener('click',run);
  }
  window.__playShowreel=playShowreel;

  document.addEventListener('click',function(e){
    var b=e.target.closest('button');
    if(!b)return;
    var txt=(b.textContent||'').replace(/\s+/g,' ').trim();
    if(!/preview showreel|play showreel/i.test(txt))return;
    e.preventDefault();e.stopImmediatePropagation();
    playShowreel();
  },true);

  /* ---------- the published site animates too ---------- */

  var baseSnapshot=window.siteSnapshot;
  window.siteSnapshot=function(){
    var s=baseSnapshot.apply(this,arguments);
    s.textMotion=ms().text;
    return s;
  };

  var basePreset=window.renderPreset;
  window.renderPreset=function(tpl){
    var r=basePreset.apply(this,arguments);
    try{
      if(tpl&&tpl.textMotion){
        var h=document.querySelector('#presetView .pv-hero h1');
        if(h)animateHeadline(h,tpl.textMotion);
      }
    }catch(e){}
    return r;
  };
})();
