const $ = id => document.getElementById(id);
const home = $('home'), practice = $('practice');

const titles = {
  addition:'Addition', subtraction:'Subtraction', multiplication:'Multiplication',
  square:'Squares – Mixed', cube:'Cubes – Mixed',
  table:'Tables – Mixed', table_s:'Tables – In Sequence', bodmas:'BODMAS', mix:'Add & Subtract Mix',
  addition_s:'Successive Addition', daily:'Daily Practice',
  square_s:'Squares – In Sequence', cube_s:'Cubes – In Sequence'
};
/* tapping the title cycles through these views ('@remember' = the Remember screen for that topic) */
const cycles = {
  addition:['addition','addition_s'],
  square:['square','square_s','@remember'], cube:['cube','cube_s','@remember'], table:['table','table_s','@remember']
};
const baseOf = {addition_s:'addition', square_s:'square', cube_s:'cube', table_s:'table'};
const levelNames = {easy:'Easy', medium:'Medium', hard:'Hard', custom:'Custom'};

const presets = {
  easy: {
    addition:{min:1,max:20,terms:2}, subtraction:{min:1,max:20,terms:2},
    multiplication:{min:2,max:10,secondMin:2,secondMax:10,terms:2},
    square:{min:2,max:20}, cube:{min:2,max:10}, table:{min:2,max:12,multMin:2,multMax:10},
    bodmas:{min:2,max:9,tier:1}, mix:{terms:3,digits:1,sign:'mix'},
    addition_s:{min:1,max:15}, square_s:{min:2,max:20}, cube_s:{min:2,max:20}, table_s:{min:2,max:12,multMin:2,multMax:10}
  },
  medium: {
    addition:{min:10,max:99,terms:2}, subtraction:{min:10,max:99,terms:2},
    multiplication:{min:2,max:30,secondMin:2,secondMax:30,terms:2},
    square:{min:2,max:30}, cube:{min:2,max:12}, table:{min:2,max:20,multMin:2,multMax:12},
    bodmas:{min:2,max:12,tier:2}, mix:{terms:3,digits:2,sign:'mix'},
    addition_s:{min:10,max:99}, square_s:{min:2,max:30}, cube_s:{min:2,max:30}, table_s:{min:2,max:20,multMin:2,multMax:12}
  },
  hard: {
    addition:{min:100,max:9999,terms:2}, subtraction:{min:100,max:9999,terms:2},
    multiplication:{min:10,max:99,secondMin:10,secondMax:99,terms:2},
    square:{min:20,max:100}, cube:{min:10,max:30}, table:{min:10,max:50,multMin:10,multMax:25},
    bodmas:{min:3,max:20,tier:3}, mix:{terms:5,digits:3,sign:'mix'},
    addition_s:{min:100,max:9999}, square_s:{min:2,max:50}, cube_s:{min:2,max:50}, table_s:{min:10,max:50,multMin:10,multMax:25}
  }
};
/* ranges like (2–4) are not in the labels: the box placeholder already shows them */
const customFields = {
  addition: [['min','Min number'],['max','Max number'],['terms','No. of additions']],
  subtraction: [['min','Min number'],['max','Max number'],['terms','No. of subtractions']],
  multiplication: [['min','Min first'],['max','Max first'],['secondMin','Min others'],['secondMax','Max others'],['terms','No. of multiplications']],
  square: [['min','Smallest base'],['max','Largest base']],
  cube: [['min','Smallest base'],['max','Largest base']],
  table: [['min','Smallest table'],['max','Largest table'],['multMin','Min multiplier'],['multMax','Max multiplier']],
  bodmas: [['min','Min number'],['max','Max number'],['tier','Complexity']],
  mix: [['terms','Max numbers'],['digits','Max digits'],['sign','Signs']],
  addition_s: [['min','Min number'],['max','Max number']],
  square_s: [['min','Smallest base'],['max','Largest base']],
  cube_s: [['min','Smallest base'],['max','Largest base']],
  table_s: [['min','Smallest table'],['max','Largest table'],['multMin','Min multiplier'],['multMax','Max multiplier']]
};
/* upper limits keep every answer a safe whole number (below 2^53) */
const CAPS = {addition:99999, subtraction:99999, multiplication:999, square:9999, cube:999, table:9999, bodmas:999, addition_s:99999, square_s:50, cube_s:50, table_s:9999};
/* allowed [min,max] for every custom field: the inputs refuse anything outside this range */
function fieldLimit(m,k){
  if(k==='terms') return m==='mix' ? [2,8] : [2,4];
  if(k==='digits') return [1,6];
  if(k==='tier') return [1,3];
  const cap=CAPS[m]||99999;
  /* no zeros in multiplication / powers / tables; add & subtract may use 0 */
  const lo = m.endsWith('_s') || ['multiplication','square','cube','table'].includes(m) ? 1 : (m==='bodmas' ? 2 : 0);
  return [lo, cap];
}

const quotes = [
  "Every question you solve today makes the exam easier tomorrow.",
  "Speed is built one correct answer at a time.",
  "Small daily practice beats occasional cramming.",
  "Mistakes are proof that you are trying. Keep going.",
  "You're faster than you were yesterday. Prove it again tomorrow.",
  "Accuracy first, speed follows.",
  "Consistency turns difficult calculations into habits.",
  "The best time to practise was yesterday. The next best is now.",
  "Confidence is repetition backed by results.",
  "Calm mind, quick hands, correct answers.",

  "Progress is silent until the results speak.",
  "Every completed session is a victory. Stack them.",
  "Difficult today, automatic tomorrow.",
  "Champions are made in practice sessions nobody sees.",
  "Don't stop at good. Aim for effortless.",
  "Your only competition is who you were yesterday.",
  "One more question can make a difference.",
  "Train your mind to calculate faster than your doubts.",
  "Success begins where excuses end.",
  "A little progress every day adds up to big results.",

  "Don't count the minutes. Make the minutes count.",
  "The faster you practise, the sharper you become.",
  "Great results come from ordinary days done exceptionally well.",
  "Every second matters. Make it count.",
  "Your future score depends on today's effort.",
  "Think faster. Stay focused. Get it right.",
  "A sharp mind is built through daily challenges.",
  "You don't need to be perfect. You need to keep improving.",
  "Discipline takes you where motivation cannot.",
  "Turn your weaknesses into your strongest skills.",

  "Don't fear difficult questions. Train for them.",
  "Every mistake teaches a calculation worth remembering.",
  "Practice until accuracy becomes your second nature.",
  "Fast calculations start with a focused mind.",
  "The secret to speed is never skipping practice.",
  "Your limits are waiting to be challenged.",
  "One focused minute is better than ten distracted ones.",
  "Keep practising until the impossible feels easy.",
  "Success is the sum of small efforts repeated daily.",
  "Be patient with progress, but never lazy with practice.",

  "You cannot improve what you refuse to practise.",
  "Make every calculation a step towards excellence.",
  "A slow beginning doesn't mean a slow finish.",
  "Train hard today. Perform confidently tomorrow.",
  "Don't wish for a better score. Work for it.",
  "Your potential grows with every challenge you accept.",
  "The more you practise, the less you panic.",
  "Focus on the solution, not the difficulty.",
  "Every great calculator was once a beginner.",
  "Small improvements create extraordinary results.",

  "Speed without accuracy is just another mistake.",
  "Accuracy is the foundation. Speed is the reward.",
  "Beat your previous record, not someone else's.",
  "A focused mind can solve what a doubtful mind cannot.",
  "Never let one wrong answer stop your progress.",
  "The difference between ordinary and extraordinary is practice.",
  "Your effort today is your advantage tomorrow.",
  "Don't just practise more. Practise smarter.",
  "Turn every second into an opportunity to improve.",
  "The best investment is the time you spend improving yourself.",

  "You are one practice session closer to your goal.",
  "Greatness is built one calculation at a time.",
  "Stay consistent when nobody is watching.",
  "Challenge your speed. Protect your accuracy.",
  "Don't let yesterday's mistakes define today's performance.",
  "The clock is ticking. Make every second useful.",
  "A strong foundation creates unstoppable confidence.",
  "The harder you train, the easier the exam feels.",
  "Your progress is more important than your starting point.",
  "Think clearly. Calculate quickly. Finish strongly.",

  "If you can solve it slowly, you can learn to solve it quickly.",
  "Every difficult question is an opportunity to grow.",
  "Winners practise even when they don't feel like it.",
  "The only shortcut to speed is consistent practice.",
  "Stop doubting. Start calculating.",
  "Make your next attempt better than your last.",
  "A second saved today can make a difference tomorrow.",
  "Great scores are earned, not wished for.",
  "Stay hungry for improvement, not just high scores.",
  "Your mind gets stronger with every problem you solve.",

  "Don't chase perfection. Chase progress.",
  "Success loves preparation.",
  "The more you challenge yourself, the more capable you become.",
  "Be faster than your excuses.",
  "A strong mind never gives up after one wrong answer.",
  "Every repetition brings you closer to mastery.",
  "The goal is not just to finish. The goal is to improve.",
  "Small steps today. Big achievements tomorrow.",
  "Believe in your preparation, not your luck.",
  "Train your brain. Transform your performance.",

  "You don't rise to the level of your goals. You fall to the level of your practice.",
  "Make calculation your strength, not your struggle.",
  "One question at a time. One victory at a time.",
  "Don't wait for confidence. Build it through practice.",
  "Your speed today is just the beginning.",
  "The clock measures time. Your practice measures growth.",
  "Push your limits, one calculation at a time.",
  "Stay focused. Stay consistent. Stay unstoppable.",
  "If you can do 2 + 3, you can learn to do anything.",
  "Your next personal best starts with your next question."
];

const DAILY_POOL=['addition','subtraction','multiplication','square','cube','table','bodmas'];
let mode='addition', level='medium', settings={}, customSettings=null;
let total=20, overallLimit=300, questionLimit=10;
let index=0, correct=0, wrong=0, skipped=0, current=null, answers=[];
let overallRemaining=0, questionRemaining=0, startedAt=0;
let overallEnd=0, questionEnd=0;
let timerId=null, finished=true;
let sessionId=0, endedAt=0;

const rand = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const num = (v,fb,min=0) => {
  if(v===''||v==null) return fb;
  const n=Number(v);
  return Number.isFinite(n)?Math.max(min,Math.floor(n)):fb;
};
const fmt = s => { s=Math.max(0,Math.ceil(s)); return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; };
const sum = arr => arr.reduce((a,b)=>a+b,0);
function stopTimer(){ if(timerId) clearInterval(timerId); timerId=null; }

/* ---------- theme ---------- */
const THEME_KEY='mathsprint-theme', OLD_THEME_KEY='speedymath-theme';
function setTheme(theme){
  document.documentElement.dataset.theme=theme;
  $('themeToggle').textContent = theme==='dark' ? '☀' : '☾';
  $('themeToggle').setAttribute('aria-label', theme==='dark' ? 'Switch to light theme' : 'Switch to dark theme');
  try{ localStorage.setItem(THEME_KEY,theme); }catch(e){}
}
let savedTheme=null;
try{ savedTheme=localStorage.getItem(THEME_KEY)||localStorage.getItem(OLD_THEME_KEY); }catch(e){}
setTheme(savedTheme==='dark'?'dark':'light');
$('themeToggle').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));

/* ---------- saved text sizes (kept in localStorage, survive closing the app) ---------- */
const QS_KEY='mathsprint-qscale', RS_KEY='mathsprint-rscale';
const Q_MIN=0.6, Q_MAX=1.6, R_MIN=0.8, R_MAX=1.8;
function loadScale(k,lo,hi){ try{ const v=parseFloat(localStorage.getItem(k)); if(v>=lo&&v<=hi) return v; }catch(e){} return 1; }
function saveScale(k,v){ try{ localStorage.setItem(k,String(v)); }catch(e){} }
const stepScale=(v,d,lo,hi)=>Math.min(hi,Math.max(lo,Math.round((v+d)*10)/10));
let qScale=loadScale(QS_KEY,Q_MIN,Q_MAX), rScale=loadScale(RS_KEY,R_MIN,R_MAX);

/* question text: user size, always kept on ONE line (shrinks only if it would overflow) */
function fitExpression(){
  const el=$('expression');
  if(!el||practice.hidden) return;
  el.style.fontSize='';
  const base=parseFloat(getComputedStyle(el).fontSize)||40;
  let size=base*qScale;
  /* the question lives in a fixed-height box: never let the text grow taller than it */
  const availH=el.clientHeight;
  if(availH>0) size=Math.min(size,Math.floor(availH*0.8));
  el.style.fontSize=size+'px';
  const avail=el.clientWidth;
  if(avail>0 && el.scrollWidth>avail){
    size=Math.max(10,Math.floor(size*avail/el.scrollWidth*0.98));
    el.style.fontSize=size+'px';
  }
}
function updateQUI(){
  $('qScaleVal').textContent=Math.round(qScale*100)+'%';
  $('qMinus').disabled=qScale<=Q_MIN+1e-6;
  $('qPlus').disabled=qScale>=Q_MAX-1e-6;
}
$('qMinus').addEventListener('click',()=>{ qScale=stepScale(qScale,-0.1,Q_MIN,Q_MAX); saveScale(QS_KEY,qScale); updateQUI(); fitExpression(); });
$('qPlus').addEventListener('click',()=>{ qScale=stepScale(qScale,0.1,Q_MIN,Q_MAX); saveScale(QS_KEY,qScale); updateQUI(); fitExpression(); });
updateQUI();
window.addEventListener('resize',fitExpression);
window.addEventListener('orientationchange',()=>setTimeout(fitExpression,150));
/* re-measure once Space Grotesk has loaded, so the first question is sized with the real font */
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(fitExpression);

/* ---------- dropdowns ---------- */
function syncDD(){
  $('dd1Btn').setAttribute('aria-expanded',String(!$('dd1Panel').hidden));
  $('dd2Btn').setAttribute('aria-expanded',String(!$('dd2Panel').hidden));
}
function closeDropdowns(){ $('dd1Panel').hidden=true; $('dd2Panel').hidden=true; syncDD(); }
function toggleDD(which){
  const panel=$(which+'Panel'), other=$(which==='dd1'?'dd2Panel':'dd1Panel');
  other.hidden=true; panel.hidden=!panel.hidden; syncDD();
}
$('dd1Btn').addEventListener('click',e=>{e.stopPropagation();toggleDD('dd1');});
$('dd2Btn').addEventListener('click',e=>{e.stopPropagation();toggleDD('dd2');});
document.addEventListener('click',e=>{ if(!e.target.closest('.dd')) closeDropdowns(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ closeDropdowns(); $('rPanel').classList.remove('open'); } });

/* Successive Addition and In-sequence Squares / Cubes / Tables: no Easy / Medium / Hard — just a range */
const isSeq = m => ['square_s','cube_s','table_s'].includes(m);   /* addition_s now has Easy / Medium / Hard / Custom like the other drills */
function markLevel(){
  $('levelLabel').textContent = isSeq(mode) ? 'Range' : levelNames[level];
  document.querySelectorAll('.dd-item').forEach(b=>b.classList.toggle('selected',b.dataset.level===level));
}
/* grey hint shown inside an empty box: the allowed range */
function placeholderFor(k,lo,hi){
  if(k==='terms'||k==='digits'||k==='tier') return `${lo} – ${hi}`;
  return /min/i.test(k) ? `Min ${lo}` : `Max ${hi}`;
}
function renderCustomFields(){
  const base = customSettings || (isSeq(mode)||mode==='addition_s' ? presets.easy : presets.medium)[mode];
  let html = customFields[mode].map(([k,label]) => {
    if(k==='sign'){
      const v=base.sign||'mix';
      return `<div class="field"><label for="c-sign">${label}<select id="c-sign"><option value="mix"${v==='mix'?' selected':''}>+ and − mixed</option><option value="add"${v==='add'?' selected':''}>+ only</option><option value="sub"${v==='sub'?' selected':''}>− only</option></select></label></div>`;
    }
    const [lo,hi]=fieldLimit(mode,k);
    return `<div class="field"><label for="c-${k}">${label}<input id="c-${k}" type="text" inputmode="numeric" pattern="[0-9]*" data-min="${lo}" data-max="${hi}" data-prev="${Math.min(hi,Math.max(lo,base[k]))}" maxlength="${String(hi).length}" autocomplete="off" placeholder="${placeholderFor(k,lo,hi)}" value="${Math.min(hi,Math.max(lo,base[k]))}"></label></div>`;
  }).join('');
  if(mode==='mix') html += '<p class="hint">Each number has up to this many digits. Answers are never negative.</p>';
  if(mode==='bodmas') html += '<p class="hint">1 = simple, 2 = brackets &amp; division, 3 = multi-step with squares.</p>';
  $('customFields').innerHTML = html;
}
/* STRICT number boxes: a keystroke is accepted only if what is typed can still become a number inside [min, max].
   e.g. "No. of numbers (2–4)" accepts only 2, 3 or 4; Min/Max boxes never accept a number above their limit. */
function allowedPrefix(v,lo,hi){
  if(v==='') return true;
  if(v==='0') return lo===0;
  const n=Number(v);
  for(let p=1;;p*=10){ const a=n*p, b=n*p+p-1; if(a>hi) return false; if(b>=lo) return true; }
}
function strictDigits(e){
  const el=e.target; if(!el.dataset||el.dataset.max==null) return;
  let v=el.value.replace(/\D/g,'').replace(/^0+(?=\d)/,'');
  if(!allowedPrefix(v,Number(el.dataset.min),Number(el.dataset.max))) v=el.dataset.prev||'';
  if(v!==el.value) el.value=v;
  el.dataset.prev=v;
}
$('customFields').addEventListener('input',strictDigits);
$('customFields').addEventListener('focusout',e=>{
  const el=e.target; if(!el.dataset||el.dataset.max==null) return;
  const lo=Number(el.dataset.min), hi=Number(el.dataset.max);
  el.value = el.value==='' ? String(lo) : String(Math.min(hi,Math.max(lo,Number(el.value))));
  el.dataset.prev = el.value;
});
function readCustom(){
  const r={};
  for(const [k] of customFields[mode]){
    if(k==='sign'){ const v=$('c-sign').value; r.sign=['mix','add','sub'].includes(v)?v:'mix'; }
    else{
      const [lo,hi]=fieldLimit(mode,k);
      r[k]=Math.min(hi,Math.max(lo,num($('c-'+k).value, presets.medium[mode][k], 0)));
    }
  }
  for(const [lo,hi] of [['min','max'],['secondMin','secondMax'],['multMin','multMax']]){
    if(r[lo]!=null && r[hi]!=null && r[lo]>r[hi]) [r[lo],r[hi]]=[r[hi],r[lo]];
  }
  if('terms' in r) r.terms=Math.min(mode==='mix'?8:4,Math.max(2,r.terms));
  if('digits' in r) r.digits=Math.min(6,Math.max(1,r.digits));
  if('tier' in r) r.tier=Math.min(3,Math.max(1,r.tier));
  if(mode==='bodmas'){ r.min=Math.max(2,r.min); r.max=Math.max(r.min,r.max); }
  return r;
}
document.querySelectorAll('.dd-item').forEach(b=>b.addEventListener('click',()=>{
  const l=b.dataset.level;
  /* Custom only takes effect when "Apply & restart" is pressed */
  if(l==='custom'){ if($('customBox').hidden||!$('customFields').children.length) renderCustomFields(); $('customBox').hidden=false; return; }
  level=l; $('customBox').hidden=true; markLevel(); closeDropdowns(); startSession();
}));
$('applyCustom').addEventListener('click',()=>{ customSettings=readCustom(); level='custom'; markLevel(); closeDropdowns(); startSession(); });
$('applySettings').addEventListener('click',()=>{
  if((level==='custom'||isSeq(mode)) && !$('customBox').hidden && $('customFields').children.length){ customSettings=readCustom(); if(isSeq(mode)) level='custom'; }
  closeDropdowns(); startSession();
});

/* ---------- saved practice settings (per drill: level, custom values, no. of questions, timers) ---------- */
const PS_KEY='mathsprint-practice';
function loadPS(){ try{ return JSON.parse(localStorage.getItem(PS_KEY))||{}; }catch(e){ return {}; } }
function savePS(){
  try{
    const all=loadPS();
    all[mode]={level, custom:customSettings, count:$('count').value, overall:$('overallTime').value, qtime:$('questionTime').value};
    localStorage.setItem(PS_KEY,JSON.stringify(all));
  }catch(e){}
}
function setSel(id,v){
  const el=$(id);
  if(v!=null && [...el.options].some(o=>o.value===String(v))) el.value=String(v);
}

/* ---------- BODMAS ---------- */
function bodmasQuestion(s){
  const r=()=>rand(s.min,s.max);
  const tier=Math.min(3,Math.max(1,s.tier||1));
  for(let tries=0;tries<60;tries++){
    const a=r(), b=r(), c=r(), d=r(), e=r();
    const q=rand(2,9), dv=rand(2,Math.max(2,Math.min(s.max,12))), m=dv*q;
    const T1=[
      ()=>[`${a} + ${b} × ${c}`, a+b*c],
      ()=>[`${a} × ${b} − ${c}`, a*b-c],
      ()=>[`(${a} + ${b}) × ${c}`, (a+b)*c],
      ()=>[`${a} × ${b} + ${c}`, a*b+c]
    ];
    const T2=[
      ()=>[`(${a} + ${b}) × ${c} − ${d}`, (a+b)*c-d],
      ()=>[`${a} + ${m} ÷ ${dv}`, a+q],
      ()=>[`${a} × ${b} + ${c} × ${d}`, a*b+c*d],
      ()=>[`(${a} − ${b}) × ${c}`, (a-b)*c],
      ()=>[`${m} ÷ ${dv} + ${a} × ${b}`, q+a*b]
    ];
    const T3=[
      ()=>[`(${a} + ${b}) × (${c} − ${d})`, (a+b)*(c-d)],
      ()=>[`${a}² + ${b} × ${c}`, a*a+b*c],
      ()=>[`${m} ÷ ${dv} × ${d} + ${a}`, q*d+a],
      ()=>[`${a} × (${b} + ${c}) − ${d} × ${e}`, a*(b+c)-d*e],
      ()=>[`(${m} ÷ ${dv} + ${a}) × ${b}`, (q+a)*b],
      ()=>[`${a}² − ${b} × ${c}`, a*a-b*c]
    ];
    const pool = tier===1 ? T1 : tier===2 ? T2 : [...T2,...T3];
    const [expr,val] = pool[rand(0,pool.length-1)]();
    if(Number.isInteger(val) && val>0) return {expression:expr, answer:val};
  }
  const [a,b,c]=[s.min,s.min,s.min];
  return {expression:`${a} + ${b} × ${c}`, answer:a+b*c};
}

/* ---------- Add & Subtract mix ---------- */
function mixQuestion(s){
  const maxN=Math.min(8,Math.max(2,s.terms||3));
  const dg=Math.min(6,Math.max(1,s.digits||2));
  const sign=s.sign||'mix';
  const numD=()=>{ const d=rand(Math.max(1,dg-1),dg); return rand(d===1?1:10**(d-1),10**d-1); };
  let nums, ops;
  for(let tries=0;tries<60;tries++){
    const n=rand(2,maxN);
    nums=Array.from({length:n},numD);
    ops=['+'];
    for(let i=1;i<n;i++) ops.push(sign==='add'?'+':sign==='sub'?'−':(Math.random()<.5?'+':'−'));
    if(sign==='mix' && !ops.includes('−')) ops[rand(1,n-1)]='−';
    const tot=nums.reduce((a,v,i)=>a+(ops[i]==='+'?v:-v),0);
    if(tot>=0) return {expression:nums.map((v,i)=>i?`${ops[i]} ${v}`:`${v}`).join(' '), answer:tot};
  }
  const pos=nums.reduce((a,v,i)=>a+(ops[i]==='+'?v:0),0), neg=nums.reduce((a,v,i)=>a+(ops[i]==='−'?v:0),0);
  if(pos<neg) nums[0]+=neg-pos+rand(0,9);
  const tot=nums.reduce((a,v,i)=>a+(ops[i]==='+'?v:-v),0);
  return {expression:nums.map((v,i)=>i?`${ops[i]} ${v}`:`${v}`).join(' '), answer:tot};
}

/* ---------- questions ---------- */
function makeQuestion(){
  if(mode==='daily'){
    /* Daily Practice: every question comes from a randomly chosen drill, at the chosen level */
    const sub=DAILY_POOL[rand(0,DAILY_POOL.length-1)];
    const lv=presets[level]?level:'easy';
    const saveMode=mode, saveSettings=settings;
    mode=sub; settings={...presets[lv][sub]};
    const q=makeQuestion();
    mode=saveMode; settings=saveSettings;
    return q;
  }
  const s=settings; const t=Math.min(4,Math.max(2,s.terms||2));
  let x,y,answer,expression,prompt='';
  /* "successive" / "in sequence": the number steps through min…max in order (then repeats) */
  const seqX = () => s.min + (index % (s.max - s.min + 1));
  if(mode==='addition_s'){
    /* random first number; the second always differs from it by exactly 1 (e.g. 3 + 4 or 3 + 2) */
    x=rand(s.min,s.max);
    const up = x<=s.min ? true : x>=s.max ? false : Math.random()<.5;
    y = up ? x+1 : x-1;
    if(y<0) y=x+1;
    answer=x+y; expression=`${x} + ${y}`;
  }
  else if(mode==='square_s'){ x=seqX(); answer=x*x; expression=`${x}² = ?`; }
  else if(mode==='table_s'){   /* 2×2 … 2×10, then 3×2 … 3×10, … in order */
    const span=s.multMax-s.multMin+1, tspan=s.max-s.min+1;
    x=s.min+Math.floor(index/span)%tspan; y=s.multMin+index%span; answer=x*y; expression=`${x} × ${y} = ?`;
  }
  else if(mode==='cube_s'){ x=seqX(); answer=x**3; expression=`${x}³ = ?`; }
  else if(mode==='addition'){
    const n=Array.from({length:t},()=>rand(s.min,s.max));
    answer=sum(n); expression=n.join(' + ');
  } else if(mode==='subtraction'){
    if(t===2){
      x=rand(s.min,s.max); y=rand(s.min,s.max); if(y>x)[x,y]=[y,x];
      answer=x-y; expression=`${x} − ${y}`;
    } else {
      /* pick the answer first so the result is never negative */
      const rest=Array.from({length:t-1},()=>rand(s.min,s.max));
      answer=rand(s.min,s.max); x=sum(rest)+answer;
      expression=`${x} − ${rest.join(' − ')}`;
    }
  } else if(mode==='multiplication'){
    const n=[rand(s.min,s.max)];
    for(let i=1;i<t;i++) n.push(rand(s.secondMin,s.secondMax));
    answer=n.reduce((a,b)=>a*b,1); expression=n.join(' × ');
  } else if(mode==='square'){ x=rand(s.min,s.max); answer=x*x; expression=`${x}² = ?`; }
  else if(mode==='cube'){ x=rand(s.min,s.max); answer=x**3; expression=`${x}³ = ?`; }
  else if(mode==='table'){ x=rand(s.min,s.max); y=rand(s.multMin,s.multMax); answer=x*y; expression=`${x} × ${y} = ?`; }
  else if(mode==='mix') return mixQuestion(s);
  else return bodmasQuestion(s);
  return {expression,answer,prompt};
}

function renderClocks(){
  $('overallClock').textContent = overallLimit ? fmt(overallRemaining) : '∞';
  $('questionClock').textContent = questionLimit ? fmt(questionRemaining) : '∞';
  $('overallClock').parentElement.classList.toggle('warn', overallLimit>0 && overallRemaining<=10);
  $('qBox').classList.toggle('warn', questionLimit>0 && questionRemaining<=3);
}
function renderStats(){
  $('questionCount').textContent = `${Math.min(index+1,total)}/${total}`;
  $('liveScore').textContent = correct;
}
function showNext(){
  if(finished) return;
  if(index>=total){
    /* leave the last answer's feedback on screen for a moment before the summary */
    if(!endedAt) endedAt=Date.now();
    renderStats();   /* count the final answer straight away */
    const sid=sessionId;
    setTimeout(()=>{ if(sid===sessionId) finish(false); },900);
    return;
  }
  current=makeQuestion();
  questionRemaining=questionLimit;
  questionEnd = questionLimit ? Date.now()+questionLimit*1000 : 0;
  $('prompt').textContent=current.prompt||'';
  $('expression').textContent=current.expression;
  fitExpression();
  $('answer').value='';
  renderStats(); renderClocks();
  $('answer').focus({preventScroll:true});
}
function setFeedback(text,cls){ $('feedback').textContent=text; $('feedback').className='feedback '+cls; }
function record(kind,value){
  if(finished||!current) return;
  const q=current;
  current=null;               /* a question can only be recorded once */
  let status;
  if(kind==='skip'){ status='skipped'; skipped++; setFeedback(`Skipped — answer was ${q.answer}`,'bad'); }
  else if(kind==='timeout'){ status='timeout'; skipped++; setFeedback(`Time's up — answer was ${q.answer}`,'bad'); }
  else if(value===q.answer){ status='correct'; correct++; setFeedback(`✓ ${q.expression.replace(' = ?','')} = ${q.answer}`,'good'); }
  else { status='wrong'; wrong++; setFeedback(`✗ Answer was ${q.answer}`,'bad'); }
  answers.push({expression:q.expression,answer:q.answer,userAnswer:value??null,status});
  index++;
  showNext();
}

/* auto-submit as soon as enough digits are typed */
$('answer').addEventListener('input',()=>{
  const el=$('answer');
  const clean=el.value.replace(/\D/g,'');
  if(clean!==el.value) el.value=clean;
  if(!current||finished||clean==='') return;
  if(clean.length>=String(current.answer).length) record('submit',Number(clean));
});
$('answer').addEventListener('keydown',e=>{
  if(e.key==='Enter'){ e.preventDefault(); const v=$('answer').value.trim(); if(v!=='') record('submit',Number(v)); }
});
$('skip').addEventListener('click',()=>record('skip'));

/* ---------- built-in number pad (phone mode): the system keyboard never opens ---------- */
const phoneMQ=window.matchMedia('(max-width:560px)');
function applyKeyboardMode(){
  const a=$('answer');
  if(phoneMQ.matches){ a.readOnly=true; a.setAttribute('inputmode','none'); }
  else { a.readOnly=false; a.setAttribute('inputmode','numeric'); }
  fitExpression();
}
if(phoneMQ.addEventListener) phoneMQ.addEventListener('change',applyKeyboardMode); else if(phoneMQ.addListener) phoneMQ.addListener(applyKeyboardMode);
applyKeyboardMode();
$('keypad').addEventListener('pointerdown',e=>e.preventDefault());
$('keypad').addEventListener('click',e=>{
  const b=e.target.closest('button[data-k]');
  if(!b||finished||!current) return;
  const k=b.dataset.k, a=$('answer');
  if(k==='back'){ a.value=a.value.slice(0,-1); }
  else if(k==='skip'){ record('skip'); }  else if(a.value.length<12){ a.value+=k; a.dispatchEvent(new Event('input')); }
});

/* ---------- timers (deadline based: exact, even in background tabs) ---------- */
function startTimer(){
  stopTimer();
  timerId=setInterval(()=>{
    if(finished) return;
    const now=Date.now();
    if(overallLimit){
      overallRemaining=(overallEnd-now)/1000;
      if(overallRemaining<=0){ overallRemaining=0; renderClocks(); finish(true); return; }
    }
    if(questionLimit){
      questionRemaining=(questionEnd-now)/1000;
      if(questionRemaining<=0){ questionRemaining=0; renderClocks(); record('timeout'); return; }
    }
    renderClocks();
  },250);
}

/* ---------- session ---------- */
function startSession(){
  total=num($('count').value,20,1);
  overallLimit=num($('overallTime').value,0,0);
  questionLimit=num($('questionTime').value,0,0);
  settings = mode==='daily' ? {} : level==='custom' ? {...(customSettings||presets.medium[mode])} : {...presets[level][mode]};
  savePS();
  stopTimer(); sessionId++; endedAt=0;
  index=0; correct=0; wrong=0; skipped=0; answers=[]; current=null;
  finished=false;
  overallRemaining=overallLimit; questionRemaining=questionLimit;
  overallEnd = overallLimit ? Date.now()+overallLimit*1000 : 0;
  startedAt=Date.now();
  $('done').hidden=true; $('quiz').hidden=false;
  setFeedback('Answer submits automatically','');
  showNext();
  startTimer();
}
function finish(timeExpired){
  if(finished) return;
  finished=true; stopTimer();
  /* questions never reached are listed in the review but are not counted as skipped */
  for(let i=index;i<total;i++) answers.push({expression:`Question ${i+1}`,answer:'—',userAnswer:null,status:'unreached'});
  const attempted=correct+wrong;
  const acc=attempted?Math.round(correct/attempted*100):0;
  $('quiz').hidden=true; $('done').hidden=false;
  $('resultTitle').textContent = timeExpired ? 'Time is up!' : 'Practice complete!';
  $('finalScore').textContent=`${correct}/${total}`;
  $('finalAccuracy').textContent=`Accuracy: ${acc}% · ${attempted} attempted out of ${total}`;
  $('resultQuote').textContent='“'+quotes[rand(0,quotes.length-1)]+'”';
  $('resultCorrect').textContent=correct;
  $('resultWrong').textContent=wrong;
  $('resultSkipped').textContent=skipped;
  $('resultTime').textContent=fmt(((endedAt||Date.now())-startedAt)/1000);
  $('reviewList').hidden=true; $('reviewButton').textContent='Review answers';
}
/* ---------- remember (study) screens ---------- */
const remember = $('remember');
let rMode='square', rTab='a', rDetail=2;
const rState={square:{from:2,to:30}, cube:{from:2,to:30}};
/* Remember screens: the From/To ranges and the Tables tab are kept between launches */
const RM_KEY='mathsprint-remember';
function saveR(){ try{ localStorage.setItem(RM_KEY,JSON.stringify({state:rState,tab:rTab})); }catch(e){} }
let savedRTab='a';
try{
  const sr=JSON.parse(localStorage.getItem(RM_KEY)||'null');
  if(sr){
    for(const k of ['square','cube']){
      const s=sr.state&&sr.state[k];
      if(s&&Number.isInteger(s.from)&&Number.isInteger(s.to)&&s.from>=2&&s.to<=50&&s.from<=s.to) rState[k]={from:s.from,to:s.to};
    }
    if(sr.tab==='a'||sr.tab==='d') savedRTab=sr.tab;
  }
}catch(e){}
const T_MIN=2, T_MAX=25, T_LIM=10;   /* tables: 2–25, multiplied up to 10 only */
const rNames={square:'Squares', cube:'Cubes', table:'Tables'};
const rTabList=[['a','Tables'],['d','In Detail']];
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
/* empty or invalid input keeps the previous value instead of jumping to the minimum */
const clampN=(v,lo,hi,fb)=>{
  if(v===''||v==null) return fb;
  const n=Math.floor(Number(v));
  return Number.isFinite(n)?Math.min(hi,Math.max(lo,n)):fb;
};

function tableCard(n,lim){
  return `<div class="tcard"><h4>Table of ${n}</h4>${range(1,lim).map(m=>`<div class="trow"><span class="q">${n} × ${m} =</span><span class="v">${n*m}</span></div>`).join('')}</div>`;
}
/* quick-revision chart: each table runs down its own column */
function tableChart(from,to,lim){
  const cols=range(from,to);
  return `<div class="chart-wrap"><table class="chart"><thead><tr><th>×</th>${cols.map(n=>`<th>${n}</th>`).join('')}</tr></thead><tbody>${range(1,lim).map(m=>`<tr><th>${m}</th>${cols.map(n=>`<td class="v">${n*m}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function updateRUI(){
  $('rGrid').style.setProperty('--rs',rScale);
  $('rFontMinus').disabled=rScale<=R_MIN+1e-6;
  $('rFontPlus').disabled=rScale>=R_MAX-1e-6;
}
/* one column → centre the cards (checked after every render / resize / size change) */
function fitList(){
  const l=document.querySelector('#rGrid .hlist'); if(!l) return;
  l.classList.remove('one');
  const c=l.children;
  if(c.length<2 || c[0].offsetLeft===c[c.length-1].offsetLeft) l.classList.add('one');
}
window.addEventListener('resize',fitList);
function bumpR(d){ rScale=stepScale(rScale,d,R_MIN,R_MAX); saveScale(RS_KEY,rScale); updateRUI(); fitList(); }
$('rFontMinus').addEventListener('click',()=>bumpR(-0.1));
$('rFontPlus').addEventListener('click',()=>bumpR(0.1));
function renderRemember(){
  const grid=$('rGrid'), tabs=$('rTabs'), ctl=$('rControls');
  let html='';
  if(rMode==='table') savedRTab=rTab;
  saveR();
  $('rFontMinus').hidden=$('rFontPlus').hidden=false;   /* zoom works on squares, cubes and tables */
  document.body.classList.toggle('chart-fit',rMode==='table'&&rTab==='a');
  updateRUI();
  if(rMode==='table'){
    const lim=T_LIM;
    $('rTitle').textContent='Tables';
    tabs.hidden=false;
    tabs.innerHTML=rTabList.map(([k,l])=>`<button type="button" class="chip${k===rTab?' on':''}" data-tab="${k}">${l}</button>`).join('');
    ctl.innerHTML='';
    if(rTab==='a') html=tableChart(T_MIN,T_MAX,lim);
    else html=`<div class="dnav"><button class="btn" type="button" data-dir="-1">‹ Prev</button><select id="rJump" aria-label="Jump to table">${range(T_MIN,T_MAX).map(n=>`<option value="${n}"${n===rDetail?' selected':''}>Table ${n}</option>`).join('')}</select><button class="btn" type="button" data-dir="1">Next ›</button></div><div class="carousel" id="rCar">${range(T_MIN,T_MAX).map(n=>`<div class="slide">${tableCard(n,lim)}</div>`).join('')}</div>`;
  } else {
    const {from,to}=rState[rMode], p=rMode==='square'?2:3;
    tabs.hidden=true; tabs.innerHTML='';
    $('rTitle').textContent=`${rNames[rMode]} ${from}–${to}`;
    ctl.innerHTML=`<label class="ctl">From<input id="rFrom" type="text" inputmode="numeric" pattern="[0-9]*" data-min="2" data-max="50" data-prev="${from}" maxlength="2" autocomplete="off" placeholder="From 2" value="${from}"></label><label class="ctl">To<input id="rTo" type="text" inputmode="numeric" pattern="[0-9]*" data-min="2" data-max="50" data-prev="${to}" maxlength="2" autocomplete="off" placeholder="To 50" value="${to}"></label>`;
    html=`<div class="hlist">${range(from,to).map(n=>`<div class="rcell"><span class="q">${n} =</span><span class="v">${n**p}</span></div>`).join('')}</div>`;
  }
  grid.innerHTML=html;
  fitList(); requestAnimationFrame(fitList);
  $('hdrTitle').textContent = rMode==='table' ? ` ${rTab==='a'?'Tables':'In Detail'}` : $('rTitle').textContent;
  const car=$('rCar');
  if(car){
    requestAnimationFrame(()=>{ car.scrollLeft=(rDetail-T_MIN)*car.clientWidth; });
    car.addEventListener('scroll',()=>{
      const i=Math.round(car.scrollLeft/Math.max(1,car.clientWidth));
      rDetail=Math.min(T_MAX,Math.max(T_MIN,i+T_MIN));
      const sel=$('rJump'); if(sel) sel.value=String(rDetail);
    },{passive:true});
  }
}
/* open the Remember screen for squares / cubes / tables (swap=true when switching from the practice title toggle) */
let rLinked=false;   /* true only when Remember was reached through the practice title cycle */
function openRemember(m,swap){
  rLinked=!!swap; rMode=m; rTab=(m==='table'&&!swap)?savedRTab:'a'; rDetail=T_MIN;
  sessionId++; stopTimer(); finished=true; closeDropdowns();
  $('rGrid').classList.remove('hide-on'); $('rHide').textContent='Hide answers'; $('rPanel').classList.remove('open');
  home.hidden=true; practice.hidden=true; remember.hidden=false;
  document.body.classList.add('in-practice');
  if(swap) replaceScreen('remember'); else pushScreen('remember');
  renderRemember(); markTitles(); window.scrollTo(0,0);
}
document.querySelectorAll('.tile[data-remember]').forEach(t=>t.addEventListener('click',()=>openRemember(t.dataset.remember,false)));
$('rTabs').addEventListener('click',e=>{
  const b=e.target.closest('.chip'); if(!b) return;
  rTab=b.dataset.tab; renderRemember();
});
$('rControls').addEventListener('input',strictDigits);
$('rControls').addEventListener('change',e=>{
  const id=e.target.id;
  if(id==='rFrom'||id==='rTo'){
    const cur=rState[rMode];
    let f=clampN($('rFrom').value,2,50,cur.from), t=clampN($('rTo').value,2,50,cur.to);
    if(f>t) [f,t]=[t,f];
    rState[rMode]={from:f,to:t}; renderRemember();
  }
});
$('rHide').addEventListener('click',()=>{
  const on=$('rGrid').classList.toggle('hide-on');
  $('rHide').textContent = on ? 'Show answers' : 'Hide answers';
  document.querySelectorAll('#rGrid .v.show').forEach(v=>v.classList.remove('show'));
});
$('rGrid').addEventListener('click',e=>{
  const v=e.target.closest('.v'); if(v){ v.classList.toggle('show'); return; }
  const d=e.target.closest('[data-dir]'); const car=$('rCar');
  if(d&&car) car.scrollBy({left:Number(d.dataset.dir)*car.clientWidth,behavior:'smooth'});
});
$('rGrid').addEventListener('change',e=>{
  if(e.target.id!=='rJump') return;
  const car=$('rCar'); rDetail=Number(e.target.value);
  if(car) car.scrollTo({left:(rDetail-T_MIN)*car.clientWidth,behavior:'smooth'});
});
$('rBack').addEventListener('click',()=>goHome());
/* gear: on Tables it switches between "2–25" and "Detail 2–25" (no panel); on Squares / Cubes it opens the From/To panel */
$('rGear').addEventListener('click',()=>{
  if(rMode==='table'){ rTab = rTab==='a' ? 'd' : 'a'; renderRemember(); window.scrollTo(0,0); }
  else $('rPanel').classList.toggle('open');
});
document.addEventListener('click',e=>{
  if(!e.composedPath().some(n=>n.id==='rPanel'||n.id==='rGear')) $('rPanel').classList.remove('open');
});

function showHome(){
  sessionId++; stopTimer(); finished=true; closeDropdowns(); $('rPanel').classList.remove('open');
  practice.hidden=true; remember.hidden=true; home.hidden=false;
  document.body.classList.remove('in-practice','chart-fit');
  $('hdrTitle').textContent='';
  window.scrollTo(0,0);
}
/* Back button / gesture: every screen pushes a history entry, so Back returns Home instead of leaving the app */
function pushScreen(name){ try{ history.pushState({screen:name},''); }catch(e){} }
function replaceScreen(name){ try{ history.replaceState({screen:name},''); }catch(e){} }
function goHome(){
  let inScreen=false;
  try{ inScreen=!!(history.state&&history.state.screen); }catch(e){}
  if(inScreen) history.back(); else showHome();
}
window.addEventListener('popstate',showHome);
try{ if(history.state&&history.state.screen) history.replaceState(null,''); }catch(e){}   /* a reload always starts on Home */
/* keep the question visible when the on-screen keyboard opens/closes */
if(window.visualViewport){
  visualViewport.addEventListener('resize',()=>{
    /* only when the system keyboard is really in use (not with the built-in number pad) */
    if(practice.hidden||finished||$('answer').readOnly||document.activeElement!==$('answer')) return;
    $('quiz').scrollIntoView({block:'center',behavior:'smooth'});
  });
}

/* start instantly with basic settings (Easy · 20 Qs · 5 min · 10 s) */
function openPractice(m,swap,forceLevel){
  mode=m; level='easy'; customSettings=null;
  $('count').value='20'; $('overallTime').value='300'; $('questionTime').value='10';
  /* the screen always starts on the tapped drill, but its difficulty and settings are restored from last time */
  const sv=loadPS()[mode];
  if(sv){
    if(sv.level && levelNames[sv.level]) level=sv.level;
    if(sv.custom && typeof sv.custom==='object') customSettings={...(presets.medium[mode]||{}),...sv.custom};
    if(level==='custom' && !customSettings) level='easy';
    setSel('count',sv.count); setSel('overallTime',sv.overall); setSel('questionTime',sv.qtime);
  }
  if(mode==='daily'){ level = forceLevel || (presets[level]?level:'easy'); }
  $('modeTitle').textContent=titles[mode]; $('hdrTitle').textContent=titles[mode];
  $('customBox').hidden=true; $('customFields').innerHTML='';
  const seq=isSeq(mode);
  document.querySelectorAll('.dd-item').forEach(b=>b.hidden=seq||(mode==='daily'&&b.dataset.level==='custom'));
  $('customBox').style.cssText = seq ? 'margin-top:0;padding-top:0;border-top:0' : '';
  if(seq){ renderCustomFields(); $('customBox').hidden=false; }
  markLevel(); closeDropdowns();
  $('rPanel').classList.remove('open');
  home.hidden=true; remember.hidden=true; practice.hidden=false;
  document.body.classList.remove('chart-fit');
  document.body.classList.add('in-practice');
  window.scrollTo(0,0);
  if(swap) replaceScreen('practice'); else pushScreen('practice');
  markTitles();
  startSession();
}
$('dailyStart').addEventListener('click',()=>openPractice('daily',false));
document.querySelectorAll('.tile[data-mode]').forEach(t=>t.addEventListener('click',()=>openPractice(t.dataset.mode,false)));

/* tap the title to cycle: Addition ⇄ Successive · Squares: Mixed → In Sequence → Remember → Mixed · Tables: Practice ⇄ Remember */
function currentBase(){ return !remember.hidden ? rMode : (baseOf[mode]||mode); }
function markTitles(){
  const c=cycles[currentBase()], on=remember.hidden ? !!(c&&c.length>1) : rLinked;   /* Remember opened from Home has no title toggle */
  ['modeTitle','hdrTitle','rTitle'].forEach(id=>$(id).classList.toggle('toggable',on));
}
function toggleTitle(){
  if(home.hidden===false) return;
  if(!remember.hidden){
    if(!rLinked) return;
    /* inside the cycle: Tables goes 2–25 → Detail, then every topic returns to its first practice view */
    if(rMode==='table' && rTab==='a'){ rTab='d'; renderRemember(); return; }
    openPractice(cycles[rMode][0],true); return;
  }
  const base=currentBase(), c=cycles[base];
  if(!c||c.length<2) return;
  const next=c[(c.indexOf(mode)+1)%c.length];
  if(next==='@remember') openRemember(base,true); else openPractice(next,true);
}
['modeTitle','hdrTitle','rTitle'].forEach(id=>$(id).addEventListener('click',toggleTitle));

$('endSession').addEventListener('click',()=>finish(false));   // ends immediately, no alert
$('back').addEventListener('click',goHome);
$('homeButton').addEventListener('click',goHome);
$('brandHome').addEventListener('click',e=>{e.preventDefault();goHome();});
$('again').addEventListener('click',startSession);
$('reviewButton').addEventListener('click',()=>{
  const list=$('reviewList'); list.hidden=!list.hidden;
  $('reviewButton').textContent=list.hidden?'Review answers':'Hide review';
  if(!list.hidden){
    const label={correct:'Correct',wrong:'Incorrect',skipped:'Skipped',timeout:'Timed out',unreached:'Not reached'};
    list.innerHTML=answers.map((a,i)=>
      `<div class="review-item ${a.status}"><strong>${i+1}. ${a.expression} — ${label[a.status]}</strong>${a.status==='unreached'?'':`<div class="review-answer">Your answer: ${a.userAnswer===null?'none':a.userAnswer} · Correct: ${a.answer}</div>`}</div>`).join('');
  }
});

/* app-like behaviour: no text selection, no long-press menu / selection box, no copying (form fields excluded) */
['contextmenu','selectstart','dragstart','copy','cut'].forEach(ev=>
  document.addEventListener(ev,e=>{
    const t=e.target&&e.target.nodeType===1?e.target:(e.target&&e.target.parentElement);
    if(t&&t.closest('input,select,textarea')) return;   /* inputs keep select / copy / paste */
    e.preventDefault();
  }));
markLevel();
