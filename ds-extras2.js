/* DOLLAR STORE — extras2 overlay (no dependencies, no build step).
   Real-data metrics board + marquee, Atari intro, in-page explainer, ripple + synth sound, Arabic touches.
   Optional config (config.js):  window.DS_CONFIG.salatSoundSrc = 'assets/salat-on-mohammed.mp3'  (a file you have rights to) */
(function(){
'use strict';
var CFG=window.DS_CONFIG||{};
var $=function(s,r){return (r||document).querySelector(s)};
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var isAr=function(){return document.documentElement.getAttribute('dir')==='rtl'};
function bi(en,ar){return '<span class="dsx2-en">'+en+'</span><span class="dsx2-ar">'+ar+'</span>'}
function el(h){var d=document.createElement('div');d.innerHTML=h.trim();return d.firstChild}
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function ssGet(k){try{return sessionStorage.getItem(k)}catch(e){return null}}
function ssSet(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}
var isHome=function(){return /^\/Dollar-Store\/?$/.test(location.pathname)||location.pathname==='/'};

/* ================= SOUND (synthesised — no audio files, no copyright) ================= */
var AC=null,muted=lsGet('dsx2_mute')==='1';
function ctx(){
  if(muted)return null;
  if(!AC){var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;try{AC=new C()}catch(e){return null}}
  if(AC.state==='suspended')AC.resume();return AC;
}
function tone(f,t,d,type,vol){
  var a=ctx();if(!a)return;var o=a.createOscillator(),g=a.createGain(),t0=a.currentTime+(t||0);
  o.type=type||'square';o.frequency.setValueAtTime(f,t0);
  g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(vol||0.04,t0+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t0+d);
  o.connect(g);g.connect(a.destination);o.start(t0);o.stop(t0+d+0.02);
}
var sfx={
  click:function(){tone(880,0,.05,'square',.03);tone(1320,.04,.05,'square',.025)},
  notify:function(){
    if(isAr()&&CFG.salatSoundSrc&&!muted){try{var au=new Audio(CFG.salatSoundSrc);au.volume=.7;au.play().catch(function(){});return}catch(e){}}
    tone(988,0,.1,'triangle',.05);tone(1319,.11,.16,'triangle',.05)},
  success:function(){[523,659,784,1047].forEach(function(f,i){tone(f,i*.08,.12,'square',.035)})},
  coin:function(){tone(988,0,.07,'square',.04);tone(1319,.07,.25,'square',.04)}
};
var music={on:false,timer:null,step:0};
var SEQ=[220,261.6,329.6,440,329.6,261.6,246.9,293.7,370,493.9,370,293.7]; // A-minor / G arpeggio, retro chiptune
function musicStart(){
  if(muted||music.on)return;music.on=true;
  music.timer=setInterval(function(){
    var f=SEQ[music.step%SEQ.length];tone(f,0,.16,'square',.018);
    if(music.step%4===0)tone(f/2,0,.3,'triangle',.03);
    music.step++;
  },180);
}
function musicStop(){music.on=false;clearInterval(music.timer)}
function setMuted(m){muted=m;lsSet('dsx2_mute',m?'1':'0');if(m)musicStop();var b=$('.dsx2-sound');if(b){b.setAttribute('aria-pressed',m?'true':'false');b.textContent=m?'🔇':'🔊'}}
function soundToggle(){
  if($('.dsx2-sound'))return;
  var b=el('<button class="dsx2-sound" aria-label="Mute / كتم الصوت" title="Sound on/off · الصوت"></button>');
  b.onclick=function(){setMuted(!muted);if(!muted)sfx.coin()};
  document.body.appendChild(b);setMuted(muted);
}

/* ================= WATER RIPPLE + click/notification sounds ================= */
document.addEventListener('pointerdown',function(e){
  if(!RM){
    [['dsx2-ripple'],['dsx2-ripple b']].forEach(function(c){var r=document.createElement('span');r.className=c[0];r.style.left=e.clientX+'px';r.style.top=e.clientY+'px';document.body.appendChild(r);setTimeout(function(){r.remove()},950)});
  }
  var t=e.target&&e.target.closest&&e.target.closest('a,button,[role=button],input[type=submit],summary');
  if(t&&!t.classList.contains('dsx2-sound'))sfx.click();
  if(t&&isAr()&&/ticket|تذكر/i.test((t.textContent||'')+(t.getAttribute('href')||'')))ticketLoader();
},{passive:true,capture:true});
function ticketLoader(){
  if(!isAr()||$('.dsx2-loader'))return;
  var l=el('<div class="dsx2-loader" role="status" aria-live="polite"><div>اذكر الله</div></div>');document.body.appendChild(l);setTimeout(function(){l.remove()},1100);
}
window.DSX={sfx:sfx,ticketLoader:ticketLoader,notify:sfx.notify};
var seenToast=new WeakSet();
function watchToasts(n){
  if(n.nodeType!==1)return;
  var t=(n.matches&&n.matches('[role=alert],[role=status],[data-sonner-toast],.toast'))?n:(n.querySelector&&n.querySelector('[role=alert],[data-sonner-toast],.toast'));
  if(t&&!seenToast.has(t)&&!t.closest('.dsx2-loader,.dsx2-intro')){seenToast.add(t);sfx.notify()}
}

/* ================= LIVE METRICS (100% from Supabase; never invented) ================= */
function cfgOk(){return CFG.supabaseUrl&&CFG.supabaseAnonKey&&!/YOUR-|PASTE_/i.test(CFG.supabaseUrl+CFG.supabaseAnonKey)}
function rpc(name,body){
  var u=String(CFG.supabaseUrl).replace(/\/+$/,'')+'/rest/v1/rpc/'+name;
  return fetch(u,{method:'POST',headers:{apikey:CFG.supabaseAnonKey,Authorization:'Bearer '+CFG.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify(body||{})})
    .then(function(r){if(!r.ok)throw new Error(r.status);return r.text()}).then(function(t){return t?JSON.parse(t):null});
}
function visitorId(){
  var v=lsGet('dsx2_vid');
  if(!v){var a=new Uint8Array(12);(window.crypto||{getRandomValues:function(x){for(var i=0;i<x.length;i++)x[i]=Math.random()*256}}).getRandomValues(a);v=Array.prototype.map.call(a,function(b){return ('0'+b.toString(16)).slice(-2)}).join('');lsSet('dsx2_vid',v)}
  return v;
}
var TILES=[
  ['visitors','Visitors','الزوّار','visitors'],['customers','Customers entered','عملاء دخلوا الموقع','customers'],
  ['buyers','Buyers','المشترون','buyers'],['sellers','Sellers','البائعون','sellers'],
  ['sold','Items sold','عناصر مباعة','items_sold'],['listed','Items available','عناصر متاحة','items_listed']
];
function fmt(n){try{return Number(n).toLocaleString(isAr()?'ar-EG':'en-US')}catch(e){return String(n)}}
function countTo(node,to){
  var from=Number(node.dataset.v||0);node.dataset.v=to;
  if(RM||from===to){node.textContent=fmt(to);return}
  var t0=performance.now(),d=900;
  (function step(t){var p=Math.min(1,(t-t0)/d);node.textContent=fmt(Math.round(from+(to-from)*p));if(p<1)requestAnimationFrame(step)})(t0);
}
var visited=false;
function refreshMetrics(box){
  if(!cfgOk()){box.dataset.state='off';return}
  var p=Promise.resolve();
  if(!visited){visited=true;p=rpc('ds_record_visit',{p_visitor:visitorId(),p_path:location.pathname}).catch(function(){})}
  p.then(function(){return rpc('get_site_metrics')}).then(function(m){
    if(!m||typeof m!=='object')throw 0;
    TILES.forEach(function(t){var n=$('[data-k='+t[0]+']',box);if(n&&m[t[3]]!=null)countTo(n,Number(m[t[3]])||0)});
    box.dataset.state='on';
    var s=$('.dsx2-asof',box);if(s&&m.as_of){try{s.textContent=new Date(m.as_of).toLocaleTimeString(isAr()?'ar-EG':'en-GB',{hour:'2-digit',minute:'2-digit'})}catch(e){}}
  }).catch(function(){box.dataset.state='off'});
}
function metricsBoard(){
  if(!isHome()){return}
  var grid=$('.market-hero-grid');if(!grid||$('.dsx2-metrics'))return;
  var anchor=grid.closest('section')||grid.parentElement;if(!anchor||!anchor.parentNode)return;
  var tiles=TILES.map(function(t){return '<div class="dsx2-tile"><span class="dsx2-num" data-k="'+t[0]+'">—</span><span class="dsx2-lab">'+bi(t[1],t[2])+'</span></div>'}).join('');
  var line=bi('Within 6 to 12 months, this platform will have more than 30,000 real people on it.','خلال من 6 إلى 12 شهراً سيكون على هذا الموقع أكثر من 30 ألف بني آدم');
  var rep=function(){return '<span>'+line+'</span>'};
  var box=el('<section class="dsx2-metrics" data-state="off" aria-label="Live site metrics"><div class="dsx2-wrap">'+
    '<div class="dsx2-head"><span class="dsx2-title">'+bi('LIVE · SITE STATS','مباشر · إحصائيات الموقع')+'</span>'+
    '<span class="dsx2-live"><i></i><span class="dsx2-asof"></span></span></div>'+
    '<div class="dsx2-grid">'+tiles+'</div></div>'+
    '<div class="dsx2-marquee" role="marquee" aria-label="'+'Within 6 to 12 months, this platform will have more than 30,000 real people on it.'+'"><div class="dsx2-track">'+rep()+rep()+rep()+rep()+rep()+rep()+'</div></div></section>');
  anchor.parentNode.insertBefore(box,anchor.nextSibling);
  var mq=$('.dsx2-marquee',box);   // pause on hover (CSS) + tap/hold on touch
  mq.addEventListener('pointerdown',function(e){if(e.pointerType==='touch'){mq.classList.toggle('is-paused')}});
  refreshMetrics(box);
  box.__t=setInterval(function(){if(!document.hidden&&document.body.contains(box))refreshMetrics(box);else if(!document.body.contains(box))clearInterval(box.__t)},60000);
}

/* ================= ATARI-STYLE INTRO (CSS/SVG, once per session) ================= */
function intro(){
  if(ssGet('dsx2_intro')||RM)return;
  ssSet('dsx2_intro','1');
  var loggedIn=false;try{for(var i=0;i<localStorage.length;i++){if(/^sb-.*-auth-token$/.test(localStorage.key(i))){loggedIn=true;break}}}catch(e){}
  var stripes=['#f5c542','#c99a1c','#8a6a10','#4a3a0a'].map(function(c,i){return '<rect x="40" y="'+(130+i*11)+'" width="720" height="8" fill="'+c+'"/>'}).join('');
  var o=el('<div class="dsx2-intro" role="dialog" aria-label="Intro">'+
    '<button class="dsx2-skip">'+bi('SKIP ▶','تخطي ▶')+'</button>'+
    '<svg class="zoom" viewBox="0 0 800 260" aria-hidden="true" shape-rendering="crispEdges">'+
      '<g class="dsx2-stripes">'+stripes+'</g>'+
      '<text x="400" y="118" text-anchor="middle" font-family="\'Press Start 2P\',monospace" font-size="58" fill="#f5c542" stroke="#a77b0a" stroke-width="3">DOLLAR</text>'+
      '<text x="400" y="232" text-anchor="middle" font-family="\'Press Start 2P\',monospace" font-size="44" fill="#fff">STORE</text>'+
    '</svg>'+
    '<div class="dsx2-cta"><div class="dsx2-press">'+bi('PRESS START','اضغط للبدء')+'</div><div class="dsx2-row">'+
      (loggedIn?'':'<button class="dsx2-btn" data-go="login">'+bi('LOGIN','تسجيل الدخول')+'</button>')+
      '<button class="dsx2-btn'+(loggedIn?'':' alt')+'" data-go="enter">'+bi('ENTER STORE','ادخل المتجر')+'</button></div></div></div>');
  document.body.appendChild(o);
  var done=false;
  function close(go){
    if(done)return;done=true;document.removeEventListener('keydown',key);o.classList.add('out');setTimeout(function(){o.remove()},650);
    if(go==='login')location.assign('/Dollar-Store/login');
  }
  function key(e){if(e.key==='Escape')close()}
  document.addEventListener('keydown',key);
  o.querySelector('.dsx2-skip').onclick=function(){close()};
  Array.prototype.forEach.call(o.querySelectorAll('[data-go]'),function(b){b.onclick=function(){sfx.success();close(b.dataset.go)}});
  // retro jingle on first gesture is not possible before interaction; play a startup chirp when the CTA appears if audio is already unlocked
  setTimeout(function(){if(!done&&AC)sfx.success()},2600);
}

/* ================= IN-PAGE EXPLAINER (replaces the video / copyrighted song) ================= */
function px(cells,col){ // tiny pixel icon from a 8x8 string map
  var r='';cells.forEach(function(row,y){for(var x=0;x<row.length;x++)if(row[x]==='1')r+='<rect x="'+x+'" y="'+y+'" width="1" height="1"/>'});
  return '<svg viewBox="0 0 8 8" fill="'+col+'" shape-rendering="crispEdges" aria-hidden="true">'+r+'</svg>';
}
var ICONS={
  shop:px(['01111110','10000001','10111101','10100101','10100101','10111101','10000001','11111111'],'#f5c542'),
  pay:px(['00111100','01000010','10111101','10100101','10100101','10111101','01000010','00111100'],'#19c37d'),
  chat:px(['11111111','10000001','10100101','10000001','11111111','00011000','00110000','01100000'],'#2f8cff'),
  done:px(['00000001','00000011','00000110','10001100','11011000','01110000','00100000','00000000'],'#f5c542')
};
function explainerFab(){
  var old=$('.dsx-pip');if(old)old.remove();
  if($('.dsx2-ex-fab')||!isHome())return;
  var b=el('<button class="dsx2-ex-fab">'+bi('First Time Here? Welcome','أول مرة تنورنا')+'</button>');
  b.onclick=openExplainer;document.body.appendChild(b);
}
function openExplainer(){
  if($('.dsx2-modal'))return;sfx.coin();
  var steps=[
    [ICONS.shop,'Browse','تصفّح','Game keys, gift cards, subscriptions and custom services from verified sellers.','مفاتيح ألعاب وبطاقات واشتراكات وخدمات مخصصة من بائعين موثّقين.'],
    [ICONS.pay,'Pay the admin','ادفع للأدمن','Pay manually (Vodafone Cash / InstaPay / Binance). The admin confirms your payment.','ادفع يدويًا (فودافون كاش / إنستاباي / باينانس) والأدمن يؤكد دفعتك.'],
    [ICONS.chat,'Chat in your ticket','تكلّم في التذكرة','You, the seller and the admin talk in one group ticket until the job is done.','أنت والبائع والأدمن في تذكرة جماعية واحدة حتى ينتهي الطلب.'],
    [ICONS.done,'Confirm & done','أكّد وخلاص','Confirm delivery. The seller is paid by the admin once a week — no freeze.','أكّد الاستلام ويحصل البائع على مستحقاته من الأدمن مرة كل أسبوع — بدون تجميد.']
  ];
  var scenes=steps.map(function(s){return '<div class="dsx2-scene"><div>'+s[0]+'<b>'+bi(s[1],s[2])+'</b><small>'+bi(s[3],s[4])+'</small></div></div>'}).join('');
  var m=el('<div class="dsx2-modal" role="dialog" aria-modal="true"><div class="dsx2-card" data-lang="'+(isAr()?'ar':'en')+'">'+
    '<button class="dsx2-close">✕</button><h2>'+bi('First Time Here? Welcome','أول مرة تنورنا')+'</h2>'+
    '<div class="dsx2-tools"><button data-l="ar" aria-pressed="'+isAr()+'">العربية</button><button data-l="en" aria-pressed="'+!isAr()+'">English</button><button data-music aria-pressed="false">♪ '+'Music · موسيقى'+'</button></div>'+
    '<div class="dsx2-stage">'+scenes+'</div>'+
    '<p class="dsx2-note">'+bi('Retro music is synthesised in your browser — no copyrighted audio.','الموسيقى مولّدة داخل المتصفح — بدون أي صوت محمي بحقوق.')+'</p></div></div>');
  document.body.appendChild(m);
  var card=m.firstChild;
  function close(){musicStop();m.remove();document.removeEventListener('keydown',esc)}
  function esc(e){if(e.key==='Escape')close()}
  document.addEventListener('keydown',esc);
  m.querySelector('.dsx2-close').onclick=close;m.addEventListener('click',function(e){if(e.target===m)close()});
  Array.prototype.forEach.call(m.querySelectorAll('[data-l]'),function(b){b.onclick=function(){card.dataset.lang=b.dataset.l;card.setAttribute('dir',b.dataset.l==='ar'?'rtl':'ltr');Array.prototype.forEach.call(m.querySelectorAll('[data-l]'),function(x){x.setAttribute('aria-pressed',x===b?'true':'false')})}});
  var mb=m.querySelector('[data-music]');
  mb.onclick=function(){if(music.on){musicStop();mb.setAttribute('aria-pressed','false')}else{if(muted)setMuted(false);musicStart();mb.setAttribute('aria-pressed','true')}};
  card.setAttribute('dir',isAr()?'rtl':'ltr');
}

/* ================= wiring ================= */
function tick(){
  soundToggle();metricsBoard();explainerFab();
  if(!isHome()){var f=$('.dsx2-ex-fab');if(f)f.remove()}
}
new MutationObserver(function(muts){
  for(var i=0;i<muts.length;i++)for(var j=0;j<muts[i].addedNodes.length;j++)watchToasts(muts[i].addedNodes[j]);
  clearTimeout(tick.t);tick.t=setTimeout(tick,150);
}).observe(document.documentElement,{childList:true,subtree:true});
function boot(){tick();intro()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
