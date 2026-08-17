
(function(){
  'use strict';
  var E=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};

  var LAYERS=[
    ['sky','Sky','farthest back, fills the frame'],
    ['four','Glow','sits behind, screen blend'],
    ['bazaar','Mid town','the middle band'],
    ['splitLeft','Split left','parts to the left'],
    ['splitRight','Split right','parts to the right'],
    ['bridge','Foreground','the hero object'],
    ['frameTwo','Close-up','revealed behind the split'],
    ['video','Video','plays instead of the sky']
  ];

  function blank(){
    return {enabled:false,logo:'',title:'',intro:'',tags:[],nav:[],
      layers:{},cards:[],
      panels:[{id:'bridge',h2:'',p:'',facts:[['',''],['','']]},
              {id:'bazaar',h2:'',p:'',button:'Read more'}]};
  }
  function cin(){
    if(!state.cinema||typeof state.cinema!=='object')state.cinema=blank();
    var c=state.cinema;
    c.layers=c.layers||{};c.cards=c.cards||[];c.tags=c.tags||[];c.nav=c.nav||[];
    if(!Array.isArray(c.panels)||c.panels.length<2)c.panels=blank().panels;
    return c;
  }
  window.__cinState=cin;

  function url(slot){
    if(!slot)return '';
    return slot.url||(slot.assetId?'/api/assets/'+encodeURIComponent(slot.assetId)+'/content':'');
  }

  // state -> the shape cinemaMarkup already understands
  function config(forPublish,slug){
    var c=cin();
    var pick=function(slot){
      if(!slot)return '';
      if(forPublish)return slot.assetId
        ? '/api/sites/'+encodeURIComponent(slug)+'/asset/'+encodeURIComponent(slot.assetId) : '';
      return url(slot);
    };
    var layers={};
    LAYERS.forEach(function(l){layers[l[0]]=pick(c.layers[l[0]])});
    var src=(c.nav&&c.nav.length?c.nav:(state.pages||[]).map(function(p){return p.name})).slice(0,5);
    var nav=src.map(function(n){
      if(Array.isArray(n))return [String(n[0]),String(n[1]||'#')];
      if(n&&typeof n==='object')return [String(n.label||''),String(n.href||'#')];
      return [String(n),'#'+String(n).toLowerCase().replace(/[^a-z0-9]+/g,'-')];
    });
    return {
      aria:(c.title||state.projectName||'Scene')+' scroll story',
      logo:c.logo||(state.globalHeader&&state.globalHeader.logo)||state.projectName||'',
      // the inspector edits state.heroTitle, so that is the live value and the
      // scene's own copy is only the fallback it was imported with
      title:state.heroTitle||c.title||'',
      intro:state.heroSubtitle||c.intro||'',
      tags:c.tags.filter(Boolean).slice(0,4),
      nav:nav,
      layers:layers,
      cards:c.cards.map(function(s){
        return {kicker:s.kicker,title:s.title,copy:s.copy,pin:pick(s.pin)};
      }),
      panels:c.panels
    };
  }
  window.__cinConfig=config;

  /* ---------- media picker ---------- */

  var mediaCache=null;
  async function loadMedia(kind){
    if(!mediaCache){
      var d=await api('/api/assets?limit=100');
      mediaCache=d.assets||[];
    }
    return mediaCache.filter(function(a){
      return String(a.mime_type||'').indexOf(kind==='video'?'video':'image')===0;
    });
  }

  async function pickAsset(onPick,kind){
    modal('<div class="modal-head"><b>Choose an image</b>'
      +'<button class="close" data-action="closeModal">&times;</button></div>'
      +'<div class="modal-body"><div class="scene-pickbar">'
        +'<span class="tiny muted">From your media. Generate more in AI Studio.</span>'
        +'<span class="grow"></span><button class="btn ghost" data-nav="studio">Open AI Studio</button></div>'
      +'<div class="scene-pick-grid" id="scenePick"><span class="tiny muted">Loading&hellip;</span></div></div>');
    var host=document.getElementById('scenePick');
    try{
      var list=await loadMedia();
      if(!list.length){host.innerHTML='<span class="tiny muted">No images yet — generate one in AI Studio.</span>';return}
      host.innerHTML=list.map(function(a){
        return '<button type="button" data-asset="'+E(a.id)+'">'
          +'<img src="/api/assets/'+E(a.id)+'/content" alt="" loading="lazy"/></button>';
      }).join('');
      host.addEventListener('click',function(e){
        var b=e.target.closest('[data-asset]');if(!b)return;
        var id=b.dataset.asset;
        onPick({assetId:id,url:'/api/assets/'+encodeURIComponent(id)+'/content'});
        closeModal();
      });
    }catch(err){
      host.innerHTML='<span class="tiny muted">'+E(String(err&&err.message||err))+'</span>';
    }
  }

  /* ---------- editor ---------- */

  function editorHtml(){
    var c=cin();
    var slots=LAYERS.map(function(l){
      var s=c.layers[l[0]],u=url(s);
      return '<button type="button" class="scene-slot'+(u?' filled':'')+'" data-layer="'+l[0]+'" title="'+E(l[2])+'">'
        +'<div class="shot">'+(u
            ? (l[0]==='video'
               ? '<video src="'+E(u)+'" muted playsinline preload="metadata"></video>'
               : '<img src="'+E(u)+'" alt=""/>')
            : '<span class="empty">Empty</span>')+'</div>'
        +'<div class="lab"><b>'+E(l[1])+'</b><span>'+(u?'set':'pick')+'</span></div></button>';
    }).join('');

    var cards=c.cards.map(function(s,i){
      var u=url(s.pin);
      return '<div class="scene-card-edit" data-card="'+i+'">'
        +'<div class="top"><b>Card '+(i+1)+'</b>'
          +'<button type="button" data-cardpin="'+i+'" class="btn ghost" style="font-size:10px;height:24px;padding:0 8px">'
            +(u?'Change pin':'Add pin')+'</button>'
          +'<button type="button" data-cardrm="'+i+'">Remove</button></div>'
        +'<div class="scene-row"><input data-cf="kicker" data-i="'+i+'" value="'+E(s.kicker)+'" placeholder="Label"/>'
          +'<input data-cf="title" data-i="'+i+'" value="'+E(s.title)+'" placeholder="Name"/></div>'
        +'<input data-cf="copy" data-i="'+i+'" value="'+E(s.copy)+'" placeholder="One sentence"/></div>';
    }).join('');

    var p1=c.panels[0],p2=c.panels[1];
    return '<div class="modal-head"><div><span class="caps">Cinematic scene</span>'
      +'<b style="display:block;margin-top:4px">'+E(state.projectName||'Project')+'</b></div>'
      +'<button class="close" data-action="closeModal">&times;</button></div>'
      +'<div class="modal-body">'
      +'<label style="display:flex;align-items:center;gap:9px;margin-bottom:12px">'
        +'<input type="checkbox" id="cinEnabled" '+(c.enabled?'checked':'')+' style="width:auto"/>'
        +'<span><b style="font-size:13px">Use a cinematic scroll scene</b>'
        +'<div class="tiny muted">Replaces the page with a layered story the visitor scrubs by scrolling.</div></span></label>'

      +'<div class="scene-sec"><span class="caps">Layers</span>'
        +'<div class="tiny muted">Seven images, back to front. Transparent PNGs work best for everything except the sky.</div>'
        +'<div class="scene-grid">'+slots+'</div></div>'

      +'<div class="scene-sec"><span class="caps">Navigation</span>'
        +'<div class="tiny muted" style="margin-bottom:8px">Label and where it goes. A full URL opens that site; #anchor jumps inside the page.</div>'
        +(c.nav.length?c.nav:[{label:'',href:''}]).map(function(n,i){
          return '<div class="scene-row" style="margin-bottom:6px">'
            +'<input data-nf="label" data-i="'+i+'" value="'+E(n.label||'')+'" placeholder="Menu label"/>'
            +'<input data-nf="href" data-i="'+i+'" value="'+E(n.href||'')+'" placeholder="https:// or #anchor"/></div>';
        }).join('')
        +'<button class="btn" id="cinAddNav" style="width:100%;margin-top:4px">Add a menu item</button></div>'

      +'<div class="scene-sec"><span class="caps">Words</span>'
        +'<div class="scene-row"><input id="cinLogo" value="'+E(c.logo)+'" placeholder="Small logo text"/>'
        +'<input id="cinTitle" value="'+E(c.title)+'" placeholder="Huge headline"/></div>'
        +'<textarea id="cinIntro" placeholder="One sentence under the headline" style="margin-top:8px">'+E(c.intro)+'</textarea>'
        +'<input id="cinTags" value="'+E(c.tags.join(', '))+'" placeholder="Pills, comma separated" style="margin-top:8px"/></div>'

      +'<div class="scene-sec"><span class="caps">Sight cards</span>'
        +'<div class="tiny muted" style="margin-bottom:8px">They fly in at the end and loop forever.</div>'
        +cards
        +'<button class="btn" id="cinAddCard" style="width:100%">Add a card</button></div>'

      +'<div class="scene-sec"><span class="caps">Story panel one</span>'
        +'<input id="cinP1h" value="'+E(p1.h2)+'" placeholder="Headline"/>'
        +'<textarea id="cinP1p" placeholder="One paragraph" style="margin-top:8px">'+E(p1.p)+'</textarea>'
        +'<div class="scene-row" style="margin-top:8px">'
          +'<input id="cinF1a" value="'+E(p1.facts[0][0])+'" placeholder="Big number"/>'
          +'<input id="cinF1b" value="'+E(p1.facts[0][1])+'" placeholder="What it means"/></div>'
        +'<div class="scene-row" style="margin-top:8px">'
          +'<input id="cinF2a" value="'+E(p1.facts[1][0])+'" placeholder="Big number"/>'
          +'<input id="cinF2b" value="'+E(p1.facts[1][1])+'" placeholder="What it means"/></div></div>'

      +'<div class="scene-sec"><span class="caps">Story panel two</span>'
        +'<input id="cinP2h" value="'+E(p2.h2)+'" placeholder="Headline"/>'
        +'<textarea id="cinP2p" placeholder="One paragraph" style="margin-top:8px">'+E(p2.p)+'</textarea>'
        +'<div class="scene-row" style="margin-top:8px">'
          +'<input id="cinP2b" value="'+E(p2.button||'')+'" placeholder="Button label"/>'
          +'<input id="cinP2href" value="'+E(p2.href||'')+'" placeholder="Where it goes"/></div></div>'

      +'<div style="display:flex;gap:8px;margin-top:18px">'
        +'<button class="btn" id="cinFromMostar">Fill from the Mostar example</button>'
        +'<span class="grow"></span>'
        +'<button class="btn primary" id="cinSave">Save scene</button></div>'
      +'</div>';
  }

  function readEditor(){
    var c=cin(),v=function(id){var e=document.getElementById(id);return e?e.value:''};
    c.enabled=!!document.getElementById('cinEnabled').checked;
    c.logo=v('cinLogo');c.title=v('cinTitle');c.intro=v('cinIntro');
    if(c.title)state.heroTitle=c.title;
    if(c.intro)state.heroSubtitle=c.intro;
    c.tags=v('cinTags').split(',').map(function(t){return t.trim()}).filter(Boolean).slice(0,4);
    c.panels[0].h2=v('cinP1h');c.panels[0].p=v('cinP1p');
    c.panels[0].facts=[[v('cinF1a'),v('cinF1b')],[v('cinF2a'),v('cinF2b')]];
    c.panels[1].h2=v('cinP2h');c.panels[1].p=v('cinP2p');
    c.panels[1].button=v('cinP2b');c.panels[1].href=v('cinP2href');
    document.querySelectorAll('[data-nf]').forEach(function(inp){
      var i=Number(inp.dataset.i);
      c.nav[i]=c.nav[i]||{label:'',href:''};
      c.nav[i][inp.dataset.nf]=inp.value;
    });
    c.nav=c.nav.filter(function(n){return n&&String(n.label||'').trim()});
    document.querySelectorAll('[data-cf]').forEach(function(inp){
      var i=Number(inp.dataset.i);if(c.cards[i])c.cards[i][inp.dataset.cf]=inp.value;
    });
  }

  function openEditor(){
    modal(editorHtml());
    var root=document.getElementById('modal');
    root.classList.add('scene-modal');

    root.addEventListener('click',function(e){
      var layer=e.target.closest('[data-layer]');
      if(layer){var key=layer.dataset.layer;readEditor();
        pickAsset(function(a){cin().layers[key]=a;saveState();openEditor()},key==='video'?'video':'image');return}
      var pin=e.target.closest('[data-cardpin]');
      if(pin){readEditor();var i=Number(pin.dataset.cardpin);
        pickAsset(function(a){cin().cards[i].pin=a;saveState();openEditor()});return}
      var rm=e.target.closest('[data-cardrm]');
      if(rm){readEditor();cin().cards.splice(Number(rm.dataset.cardrm),1);saveState();openEditor();return}
      if(e.target.closest('#cinAddNav')){
        readEditor();cin().nav.push({label:'New item',href:'#'});saveState();openEditor();return}
      if(e.target.closest('#cinAddCard')){
        readEditor();cin().cards.push({kicker:'',title:'',copy:'',pin:null});saveState();openEditor();return}
      if(e.target.closest('#cinFromMostar')){
        var m=templateByName('Mostar');
        if(m&&m.cinema){
          var c=cin(),s=m.cinema;
          c.logo=s.logo;c.title=s.title;c.intro=s.intro;c.tags=s.tags.slice();
          c.nav=s.nav.map(function(n){return {label:n[0],href:n[1]}});
          Object.keys(s.layers).forEach(function(k){c.layers[k]={url:s.layers[k]}});
          c.cards=s.cards.map(function(x){
            return {kicker:x.kicker,title:x.title,copy:x.copy,pin:{url:x.pin}}});
          c.panels=JSON.parse(JSON.stringify(s.panels));
          c.enabled=true;saveState();openEditor();
          toast('Filled from Mostar — swap the layers for your own');
        }
        return;
      }
      if(e.target.closest('#cinSave')){
        readEditor();makeVersion('Scene updated');saveState();closeModal();
        render('builder');
        toast(cin().enabled?'Scene is on — scrub it under the canvas':'Scene saved');
        return;
      }
    });
  }
  window.__openSceneEditor=openEditor;

  /* ---------- builder canvas ---------- */

  var canvasSession=null,canvasFrame=null;
  function teardownCanvas(){
    if(canvasSession){try{canvasSession()}catch(e){}canvasSession=null}
  }
  // rescale the canvas with the window; canvasFrame only exists while one is open
  addEventListener('resize',function(){if(canvasFrame)try{canvasFrame.fit()}catch(e){}});

  function paintCanvas(){
    var dev=document.querySelector('.canvas-device');
    if(!dev)return;
    var c=cin();
    if(!c.enabled){dev.classList.remove('cin-canvas');teardownCanvas();return}
    if(dev.dataset.cinPainted==='1')return;
    dev.dataset.cinPainted='1';
    dev.classList.add('cin-canvas');
    teardownCanvas();
    var at=Number(state.cinemaScrub||0);
    dev.innerHTML='<div class="cin-stagebox" id="cinStage"></div>'
      +'<div class="cin-scrub"><span class="tag">SCROLL</span>'
      +'<input type="range" min="0" max="3700" step="10" value="'+at+'" id="cinScrub"/>'
      +'<span class="tag" id="cinScrubVal">'+at+'px</span></div>';
    var stage=document.getElementById('cinStage');

    // The scene is laid out in vw/vh, which resolve against the window and not
    // against a 300px canvas box. Rendering it in a frame gives those units a
    // viewport of their own, then the whole frame is scaled to fit.
    var frame=document.createElement('iframe');
    frame.setAttribute('tabindex','-1');
    frame.setAttribute('aria-hidden','true');
    frame.setAttribute('scrolling','no');
    frame.style.cssText='width:1280px;height:800px;border:0;display:block;transform-origin:0 0';
    stage.appendChild(frame);

    var d=frame.contentDocument;
    d.open();d.write('<!doctype html><html><head></head><body></body></html>');d.close();
    var css=document.getElementById('cinemaCss');
    if(css)d.head.appendChild(css.cloneNode(true));
    d.body.style.cssText='margin:0;background:#0b1110;overflow:hidden';
    var host=d.createElement('div');
    host.id='presetView';
    host.className='on cinema-on';
    host.style.cssText='position:absolute;inset:0;display:block';
    host.innerHTML=window.__cinemaMarkup(config(false));
    d.body.appendChild(host);

    function fit(){
      var w=stage.clientWidth||1;
      var sc=w/1280;
      frame.style.transform='scale('+sc.toFixed(4)+')';
      stage.style.height=Math.round(800*sc)+'px';
    }
    fit();
    canvasFrame={frame:frame,host:host,fit:fit};
    applyScrub(host,at);
    makeCanvasEditable();

    var range=document.getElementById('cinScrub');
    range.addEventListener('input',function(){
      state.cinemaScrub=Number(range.value);
      document.getElementById('cinScrubVal').textContent=range.value+'px';
      applyScrub(host,Number(range.value));
    });
    range.addEventListener('change',function(){saveState()});
    canvasSession=function(){canvasFrame=null};
  }

  // the same numbers the engine writes, driven by the slider instead of scroll
  function applyScrub(host,s){
    var clamp=function(v,a,b){a=a===undefined?0:a;b=b===undefined?1:b;return Math.min(b,Math.max(a,v))};
    var ss=function(e0,e1,v){var x=clamp((v-e0)/(e1-e0));return x*x*(3-2*x)};
    var seg=function(a,b,c,d){var en=ss(a,b,s),ex=ss(c,d,s);return {enter:en,exit:ex,active:en*(1-ex)}};
    var set=function(k,v){host.style.setProperty(k,v)};
    var f2=seg(560,900,1300,1620), f3=seg(1760,2140,2540,2700);
    var progress=clamp(s/2700), introExit=ss(90,650,s);
    var sightsEnter=Math.pow(ss(2760,3560,s),1.55), ctrl=ss(3360,3660,s);
    var blurActive=clamp(f2.active+f3.active), splitDrift=Math.pow(f2.enter,1.5);
    var backScale=0.76+progress*0.2+f2.enter*0.18+f3.enter*0.16;
    var heroY=progress*-74, heroScale=progress*0.23;
    var box=800;   // the frame's own viewport height
    var screenTop=Math.min(220,Math.max(112,box*0.19))-50;
    set('--back-opacity',1-f2.active*0.06);
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
    set('--bridge-x','-50%');
    set('--bridge-y',(heroY-f2.exit*760)+'px');
    set('--bridge-bottom',(5-f2.enter*13)+'vh');
    set('--bridge-width',(67.2+f2.enter*37.8)+'vw');
    set('--bridge-scale',1.02+heroScale+f2.exit*0.46);
    set('--split-left-x','calc(-50% + '+(-splitDrift*46)+'vw)');
    set('--split-left-y',(heroY-splitDrift*180)+'px');
    set('--split-left-scale',1+heroScale+f2.enter*0.74);
    set('--split-right-x','calc(-50% + '+(splitDrift*46)+'vw)');
    set('--split-right-y',(heroY-splitDrift*180)+'px');
    set('--split-right-scale',1+heroScale+f2.enter*0.74);
    set('--frame2-opacity',f2.active*(1-f3.enter));
    set('--frame2-x','-50%');
    set('--frame2-y','calc(-50% + '+(-f2.exit*150)+'px)');
    set('--frame2-scale',1.06+f2.enter*0.08+f2.exit*0.08);
    set('--intro-copy-y',(introExit*90)+'px');
    set('--intro-copy-opacity',1-introExit);
    set('--panel2-opacity',f2.active*(1-f2.exit));
    set('--panel2-y','calc(-50% + '+(-f2.exit*86+(1-f2.enter)*58)+'px)');
    set('--panel3-opacity',f3.active*(1-f3.exit));
    set('--panel3-y','calc(-50% + '+(-f3.exit*86+(1-f3.enter)*58)+'px)');
    set('--sights-controls-opacity',ctrl);
    set('--sights-visibility',sightsEnter>0.01?'visible':'hidden');
    set('--sights-y','0px');
    set('--sights-enter-x',((1-sightsEnter)*420)+'vw');
    set('--sights-scale',1/backScale);
    set('--sights-top',(box-(box-screenTop)/backScale)+'px');
    set('--sights-screen-top',screenTop+'px');
  }

  // Typing in the inspector must show up in the scene straight away. The
  // canvas is a frame, so rebuilding it per keystroke would reload every layer
  // and flicker — only the words are rewritten.
  function syncCanvasText(){
    if(!canvasFrame||!canvasFrame.host)return;
    var d=canvasFrame.host,cfg=config(false);
    var set=function(sel,txt){var e=d.querySelector(sel);if(e)e.textContent=txt};
    set('.cin-hero-title',cfg.title);
    set('.cin-intro-copy p',cfg.intro);
    set('.cin-site-logo',cfg.logo);
    var tags=d.querySelectorAll('.cin-hero-tags span');
    cfg.tags.forEach(function(t,i){if(tags[i])tags[i].textContent=t});
    var p=cfg.panels||[];
    if(p[0]){set('.cin-story-panel-bridge h2',p[0].h2);set('.cin-story-panel-bridge p',p[0].p)}
    if(p[1]){set('.cin-story-panel-bazaar h2',p[1].h2);set('.cin-story-panel-bazaar p',p[1].p)}
  }
  window.__syncSceneText=syncCanvasText;

  // Click the words on the canvas and type, the way the ordinary builder
  // works. The scene lives in a frame, so the handlers are attached inside it
  // and write straight back to state.
  function makeCanvasEditable(){
    if(!canvasFrame||!canvasFrame.host)return;
    var d=canvasFrame.host, c=cin();
    var bind=function(sel,get,set){
      var el=d.querySelector(sel); if(!el||el.dataset.cinEdit)return;
      el.dataset.cinEdit='1';
      el.setAttribute('contenteditable','true');
      el.setAttribute('spellcheck','false');
      el.addEventListener('input',function(){set(el.textContent);saveState()});
      el.addEventListener('keydown',function(ev){if(ev.key==='Enter'){ev.preventDefault();el.blur()}});
      if(get&&el.textContent!==get())el.textContent=get();
    };
    bind('.cin-hero-title',function(){return state.heroTitle},function(v){state.heroTitle=v});
    bind('.cin-intro-copy p',function(){return state.heroSubtitle},function(v){state.heroSubtitle=v});
    bind('.cin-site-logo',null,function(v){c.logo=v});
    d.querySelectorAll('.cin-hero-tags span').forEach(function(el,i){
      if(el.dataset.cinEdit)return;el.dataset.cinEdit='1';
      el.setAttribute('contenteditable','true');
      el.addEventListener('input',function(){c.tags[i]=el.textContent;saveState()});
    });
    [['bridge',0],['bazaar',1]].forEach(function(pair){
      bind('.cin-story-panel-'+pair[0]+' h2',null,function(v){c.panels[pair[1]].h2=v});
      bind('.cin-story-panel-'+pair[0]+' p',null,function(v){c.panels[pair[1]].p=v});
    });
    d.querySelectorAll('.cin-sight-card').forEach(function(card,i){
      if(card.dataset.cinEdit)return;card.dataset.cinEdit='1';
      [['.cin-sight-kicker','kicker'],['h3','title'],['p','copy']].forEach(function(f){
        var el=card.querySelector(f[0]); if(!el)return;
        el.setAttribute('contenteditable','true');
        el.addEventListener('input',function(){if(c.cards[i])c.cards[i][f[1]]=el.textContent;saveState()});
      });
    });
    // a link inside the editor would navigate the frame away from the scene
    d.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click',function(ev){ev.preventDefault()});
    });
  }
  window.__makeSceneEditable=makeCanvasEditable;

  var syncT=null;
  document.addEventListener('input',function(e){
    if(!cin().enabled)return;
    if(!e.target.closest('[data-prop-edit],[data-edit],.props'))return;
    clearTimeout(syncT);
    syncT=setTimeout(syncCanvasText,60);
  },true);

  /* ---------- top-bar button + canvas hook ---------- */

  function decorate(){
    var bar=document.querySelector('.builder-top');
    if(bar&&!bar.querySelector('[data-action="openScene"]')){
      var b=document.createElement('button');
      b.className='btn scene-btn';
      b.dataset.action='openScene';
      b.innerHTML='&#9968; Scene'+(cin().enabled?' &bull;':'');
      var pub=bar.querySelector('[data-action="publish"]');
      if(pub)bar.insertBefore(b,pub);else bar.appendChild(b);
    }
    var dev=document.querySelector('.canvas-device');
    if(dev&&!cin().enabled)dev.dataset.cinPainted='';
    if(dev&&cin().enabled&&dev.dataset.cinPainted!=='1')paintCanvas();
  }

  document.addEventListener('click',function(e){
    if(e.target.closest('[data-action="openScene"]')){e.preventDefault();openEditor()}
  });

  new MutationObserver(function(){
    if(state.route!=='builder')return;
    try{decorate()}catch(err){}
  }).observe(document.body,{childList:true,subtree:true});

  /* ---------- templates carry their scene ---------- */

  // Customizing a cinematic template used to hand back the flat page: the
  // shell and copy came across but the scene stayed behind in the template.
  function importCinema(src){
    if(!src)return false;
    var c=cin();
    c.logo=src.logo||'';c.title=src.title||'';c.intro=src.intro||'';
    c.tags=(src.tags||[]).slice();
    c.nav=(src.nav||[]).map(function(n){
      return Array.isArray(n)?{label:n[0],href:n[1]}:{label:String(n),href:'#'}});
    c.layers={};
    Object.keys(src.layers||{}).forEach(function(k){c.layers[k]={url:src.layers[k]}});
    c.cards=(src.cards||[]).map(function(x){
      return {kicker:x.kicker,title:x.title,copy:x.copy,pin:x.pin?{url:x.pin}:null}});
    c.panels=JSON.parse(JSON.stringify(src.panels||cin().panels));
    c.enabled=true;
    // one headline, edited in one place
    if(src.title)state.heroTitle=src.title;
    if(src.intro)state.heroSubtitle=src.intro;
    return true;
  }
  window.__importCinema=importCinema;

  var baseShell=window.applyShellFromTemplate;
  window.applyShellFromTemplate=function(tpl){
    var r=baseShell.apply(this,arguments);
    if(tpl&&tpl.cinema)importCinema(tpl.cinema);
    else state.cinema=blank();          // a flat template must not inherit a scene
    var dev=document.querySelector('.canvas-device');
    if(dev)dev.dataset.cinPainted='';
    return r;
  };

  var baseNew=window.startNewProject;
  window.startNewProject=function(){
    var r=baseNew.apply(this,arguments);
    state.cinema=blank();state.cinemaScrub=0;
    return r;
  };

  /* ---------- publish + published page ---------- */

  var baseSnapshot=window.siteSnapshot;
  window.siteSnapshot=function(){
    var s=baseSnapshot.apply(this,arguments);
    var c=cin();
    if(c.enabled){
      // asset ids travel, not studio URLs: the live page serves them through
      // the public, site-scoped route
      var live=config(false);
      s.cinema={
        enabled:true,logo:live.logo,title:live.title,intro:live.intro,
        tags:live.tags,nav:c.nav,panels:c.panels,
        layers:(function(){var o={};LAYERS.forEach(function(l){
          var v=c.layers[l[0]];if(v)o[l[0]]=v.assetId?{assetId:v.assetId}:{url:v.url}});return o})(),
        cards:c.cards.map(function(x){
          return {kicker:x.kicker,title:x.title,copy:x.copy,
            pin:x.pin?(x.pin.assetId?{assetId:x.pin.assetId}:{url:x.pin.url}):null}})
      };
    }
    return s;
  };

  var baseShow=window.showPublishedSite;
  window.showPublishedSite=async function(slug){
    try{
      var r=await fetch('/api/sites/'+encodeURIComponent(slug),{cache:'no-store'});
      if(!r.ok)return baseShow.apply(this,arguments);
      var d=await r.json();
      var s=d.site||{};
      if(typeof s==='string'){try{s=JSON.parse(s)}catch(e){s={}}}
      if(!s.cinema||!s.cinema.enabled)return baseShow.apply(this,arguments);

      var c=s.cinema;
      var pub=function(v){
        if(!v)return '';
        if(v.assetId)return '/api/sites/'+encodeURIComponent(slug)+'/asset/'+encodeURIComponent(v.assetId);
        return v.url||'';
      };
      var layers={};
      LAYERS.forEach(function(l){layers[l[0]]=pub(c.layers&&c.layers[l[0]])});
      var cfg={
        aria:(d.projectName||slug)+' scroll story',
        logo:c.logo||d.projectName||slug,title:c.title||'',intro:c.intro||'',
        tags:c.tags||[],
        nav:(c.nav||[]).slice(0,5).map(function(n){
          return Array.isArray(n)?n:[String(n),'#'+String(n).toLowerCase().replace(/[^a-z0-9]+/g,'-')]}),
        layers:layers,
        cards:(c.cards||[]).map(function(x){
          return {kicker:x.kicker,title:x.title,copy:x.copy,pin:pub(x.pin)}}),
        panels:c.panels||[]
      };
      ['marketing','auth','appShell'].forEach(function(id){
        document.getElementById(id)&&document.getElementById(id).classList.add('hidden')});
      var host=document.getElementById('presetView');
      host.classList.add('on','cinema-on');
      host.innerHTML=window.__cinemaMarkup(cfg);
      document.title=(d.projectName||slug)+' — built with Scen';
      window.__cinemaDispose=window.__cinemaStart(host);
      window.scrollTo(0,0);
      return true;
    }catch(e){return baseShow.apply(this,arguments)}
  };

  // a top-level const is script-scoped, not a window property, so reach it by
  // bare name — the scene has to travel with its project like everything else
  try{
    if(Array.isArray(PROJECT_KEYS)&&PROJECT_KEYS.indexOf('cinema')<0){
      PROJECT_KEYS.push('cinema','cinemaScrub');
    }
  }catch(e){}
})();
