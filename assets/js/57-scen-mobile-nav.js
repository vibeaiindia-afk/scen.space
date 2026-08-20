/* The public page's navigation, on a phone.

   The bar was built for a desktop width and never given a small-screen form:
   at 375px the links ran to 529px and the buttons beside them to 693px, so
   Pricing, Preset AI, Docs, the 4D Website Builder and the login all sat off
   the right edge, unreachable. A stylesheet was supposed to hide the links at
   that width — app-1.css does exactly that — but a later unconditional
   `.mlinks{display:flex}` in app-2.css wins on source order and put them back.

   Rather than fight that with another override, the bar keeps the logo and
   gains a menu button, and everything else moves into a sheet: the sections,
   the studio, and signing in or out. */
(function(){
'use strict';

var BREAK=760;
function phone(){return innerWidth<=BREAK}
function signedIn(){try{return !!state.auth}catch(e){return false}}

var css=document.createElement('style');
css.id='scen-mobile-nav-css';
css.textContent=[
'@media(max-width:'+BREAK+'px){',
'  #marketing .mnav .mlinks{display:none!important}',
'  #marketing .mnav .mactions{display:none!important}',
'  #marketing .mnav{gap:10px}',
'  #mnavBtn{display:inline-flex;margin-left:auto;align-items:center;justify-content:center;',
'    gap:5px;flex-direction:column;width:42px;height:42px;flex:0 0 auto;border-radius:13px;',
'    border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);cursor:pointer}',
'  #mnavBtn i{display:block;width:16px;height:1.5px;background:#e9e9ee;border-radius:2px;transition:.18s}',
'  body.mnav-open #mnavBtn i:first-child{transform:translateY(3.2px) rotate(45deg)}',
'  body.mnav-open #mnavBtn i:last-child{transform:translateY(-3.2px) rotate(-45deg)}',
'  #mnavSheet{position:fixed;z-index:99;left:12px;right:12px;top:78px;padding:10px;',
'    border:1px solid rgba(255,255,255,.14);border-radius:20px;background:rgba(10,10,14,.97);',
'    backdrop-filter:blur(22px);box-shadow:0 26px 80px rgba(0,0,0,.5);',
'    display:none;max-height:calc(100vh - 96px);overflow:auto;',
'    -webkit-overflow-scrolling:touch}',
'  body.mnav-open #mnavSheet{display:block}',
'  #mnavSheet a,#mnavSheet button{display:flex;width:100%;align-items:center;gap:10px;',
'    padding:13px 14px;border-radius:13px;border:0;background:none;color:#e9e9ee;',
'    font:inherit;font-size:15px;font-weight:500;text-align:left;cursor:pointer;min-height:48px}',
'  #mnavSheet a:active,#mnavSheet button:active{background:rgba(255,255,255,.06)}',
'  #mnavSheet hr{border:0;border-top:1px solid rgba(255,255,255,.1);margin:8px 6px}',
'  #mnavSheet .studio{border:1px solid rgba(255,255,255,.16)}',
'  #mnavSheet .go{background:var(--acid,#dfff45);color:#0a0a0c;font-weight:650;justify-content:center}',
'  #mnavSheet .muted{color:#8a8a95;font-size:12.5px;padding:2px 14px 8px}',
'}',
'@media(min-width:'+(BREAK+1)+'px){#mnavBtn,#mnavSheet{display:none!important}}'
].join('');
document.head.appendChild(css);

function close(){document.body.classList.remove('mnav-open')}

/* Rebuilt on every open, so it always agrees with the session. */
function fill(sheet){
  var h='';
  var links=document.querySelectorAll('#marketing .mlinks a');
  for(var i=0;i<links.length;i++){
    var a=links[i];
    /* Docs is hidden from signed-out visitors by an earlier layer; respect it. */
    if(a.style.display==='none')continue;
    /* Without data-nav the clone loses the app's own click handling and falls
       back to a real browser navigation on real hrefs like /features — a full
       reload instead of the instant in-page move the desktop link gets. */
    var dn=a.getAttribute('data-nav');
    h+='<a href="'+(a.getAttribute('href')||'#')+'"'+(dn?' data-nav="'+dn+'"':'')+' data-mnav-go>'+a.textContent+'</a>';
  }
  h+='<hr>';
  h+='<a class="studio" href="/superaiagent.html">4D Website Builder</a>';
  if(signedIn()){
    h+='<a class="go" href="/superaiagent.html">Open workspace ↗</a>';
    h+='<button data-action="logout">Sign out</button>';
  }else{
    h+='<button data-nav="auth">Log in</button>';
    h+='<a class="go" href="#" data-nav="auth">Start building ↗</a>';
  }
  sheet.innerHTML=h;
}

function mount(){
  var nav=document.querySelector('#marketing .mnav');
  if(!nav)return;
  if(!document.getElementById('mnavBtn')){
    var b=document.createElement('button');
    b.id='mnavBtn';b.type='button';
    b.setAttribute('aria-label','Menu');b.setAttribute('aria-expanded','false');
    b.innerHTML='<i></i><i></i>';
    nav.appendChild(b);
  }
  if(!document.getElementById('mnavSheet')){
    var s=document.createElement('div');
    s.id='mnavSheet';
    document.body.appendChild(s);
  }
}

document.addEventListener('click',function(e){
  var btn=e.target.closest&&e.target.closest('#mnavBtn');
  if(btn){
    e.preventDefault();
    var open=!document.body.classList.contains('mnav-open');
    if(open)fill(document.getElementById('mnavSheet'));
    document.body.classList.toggle('mnav-open',open);
    btn.setAttribute('aria-expanded',open?'true':'false');
    return;
  }
  var sheet=document.getElementById('mnavSheet');
  if(!sheet)return;
  if(sheet.contains(e.target)){
    /* Section links scroll the page themselves; everything else is handled by
       the app's own data-nav / data-action listeners. Either way we close. */
    setTimeout(close,0);
    return;
  }
  if(document.body.classList.contains('mnav-open'))close();
},false);

addEventListener('keydown',function(e){if(e.key==='Escape')close()});
addEventListener('resize',function(){if(!phone())close()});

/* The public page is rebuilt by later layers, so re-mount rather than assume. */
var mo=new MutationObserver(function(){mount()});
function boot(){mount();mo.observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
})();
