const $ = id => document.getElementById(id);
const home = $('home'), practice = $('practice');

const titles = {
  addition:'Addition', subtraction:'Subtraction', multiplication:'Multiplication',
  square:'Squares – Fill the blank', cube:'Cubes – Fill the blank',
  table:'Tables – Fill the blank', bodmas:'BODMAS', mix:'Add & Subtract Mix'
};
const levelNames = {easy:'Easy', medium:'Medium', hard:'Hard', custom:'Custom'};

const presets = {
  easy: {
    addition:{min:1,max:20,terms:2}, subtraction:{min:1,max:20,terms:2},
    multiplication:{min:2,max:10,secondMin:2,secondMax:10,terms:2},
    square:{min:2,max:20}, cube:{min:2,max:10}, table:{min:2,max:12,multMin:2,multMax:10},
    bodmas:{min:2,max:9,tier:1}, mix:{terms:3,digits:1,sign:'mix'}
  },
  medium: {
    addition:{min:10,max:99,terms:2}, subtraction:{min:10,max:99,terms:2},
    multiplication:{min:2,max:30,secondMin:2,secondMax:30,terms:2},
    square:{min:2,max:30}, cube:{min:2,max:12}, table:{min:2,max:20,multMin:2,multMax:12},
    bodmas:{min:2,max:12,tier:2}, mix:{terms:3,digits:2,sign:'mix'}
  },
  hard: {
    addition:{min:100,max:9999,terms:2}, subtraction:{min:100,max:9999,terms:2},
    multiplication:{min:10,max:99,secondMin:10,secondMax:99,terms:2},
    square:{min:20,max:100}, cube:{min:10,max:30}, table:{min:10,max:50,multMin:10,multMax:25},
    bodmas:{min:3,max:20,tier:3}, mix:{terms:5,digits:3,sign:'mix'}
  }
};
const TERMS = ['terms','No. of numbers (2–4)'];
const customFields = {
  addition: [['min','Min number'],['max','Max number'],TERMS],
  subtraction: [['min','Min number'],['max','Max number'],TERMS],
  multiplication: [['min','Min first'],['max','Max first'],['secondMin','Min others'],['secondMax','Max others'],TERMS],
  square: [['min','Smallest base'],['max','Largest base']],
  cube: [['min','Smallest base'],['max','Largest base']],
  table: [['min','Smallest table'],['max','Largest table'],['multMin','Min multiplier'],['multMax','Max multiplier']],
  bodmas: [['min','Min number'],['max','Max number'],['tier','Complexity (1–3)']],
  mix: [['terms','Max numbers (2–8)'],['digits','Max digits (1–6)'],['sign','Signs']]
};
/* upper limits keep every answer a safe whole number (below 2^53) */
const CAPS = {addition:999999, subtraction:999999, multiplication:999, square:9999, cube:999, table:9999, bodmas:999};

const quotes = [
  "Every question you solve today makes the exam easier tomorrow.",
  "Speed is built one correct answer at a time.",
  "Small daily practice beats occasional cramming.",
  "Mistakes are just practice in disguise. Keep going.",
  "You're faster than you were yesterday. Prove it again tomorrow.",
  "Accuracy first, speed follows.",
  "Consistency turns hard sums into habits.",
  "The best time to practise was yesterday. The next best is now.",
  "Confidence is just repetition with results.",
  "Calm mind, quick hands, correct answers.",
  "Progress is quiet, until the day it shows up in your score.",
  "Every session you finish is a win. Stack them.",
  "Difficult today, automatic tomorrow.",
  "Champions are made in the practice sessions nobody sees.",
  "Don't stop at good. Aim for effortless."
];

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

function markLevel(){
  $('levelLabel').textContent = levelNames[level];
  document.querySelectorAll('.dd-item').forEach(b=>b.classList.toggle('selected',b.dataset.level===level));
}
function renderCustomFields(){
  const base = customSettings || presets.medium[mode];
  let html = customFields[mode].map(([k,label]) => {
    if(k==='sign'){
      const v=base.sign||'mix';
      return `<div class="field"><label for="c-sign">${label}<select id="c-sign"><option value="mix"${v==='mix'?' selected':''}>+ and − mixed</option><option value="add"${v==='add'?' selected':''}>+ only</option><option value="sub"${v==='sub'?' selected':''}>− only</option></select></label></div>`;
    }
    return `<div class="field"><label for="c-${k}">${label}<input id="c-${k}" type="number" min="0" step="1" value="${base[k]}"></label></div>`;
  }).join('');
  if(mode==='mix') html += '<p class="hint">Each number has up to this many digits. Answers are never negative.</p>';
  if(mode==='bodmas') html += '<p class="hint">1 = simple, 2 = brackets &amp; division, 3 = multi-step with squares.</p>';
  if(customFields[mode].includes(TERMS)) html += '<p class="hint">e.g. 4 numbers → 4 + 6 + 7 + 8</p>';
  $('customFields').innerHTML = html;
}
function readCustom(){
  const r={}, cap=CAPS[mode]||999999;
  for(const [k] of customFields[mode]){
    if(k==='sign'){ const v=$('c-sign').value; r.sign=['mix','add','sub'].includes(v)?v:'mix'; }
    else r[k]=num($('c-'+k).value, presets.medium[mode][k], 0);
  }
  for(const k of ['min','max','secondMin','secondMax','multMin','multMax']) if(k in r) r[k]=Math.min(cap,r[k]);
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
  if(level==='custom' && !$('customBox').hidden && $('customFields').children.length) customSettings=readCustom();
  closeDropdowns(); startSession();
});

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
  const s=settings; const t=Math.min(4,Math.max(2,s.terms||2));
  let x,y,answer,expression,prompt='';
  if(mode==='addition'){
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
  settings = level==='custom' ? {...(customSettings||presets.medium[mode])} : {...presets[level][mode]};
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
const T_MIN=2, T_MAX=25, T_LIM=10;   /* tables: 2–25, multiplied up to 10 only */
const rNames={square:'Squares', cube:'Cubes', table:'Tables'};
const rTabList=[['a','2–25'],['d','Detail 2–25']];
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
  $('rFontMinus').hidden=$('rFontPlus').hidden=(rMode==='table');
  document.body.classList.toggle('chart-fit',rMode==='table'&&rTab==='a');
  updateRUI();
  if(rMode==='table'){
    const lim=T_LIM;
    $('rTitle').textContent='Tables';
    tabs.hidden=false;
    tabs.innerHTML=rTabList.map(([k,l])=>`<button type="button" class="chip${k===rTab?' on':''}" data-tab="${k}">${l}</button>`).join('');
    ctl.innerHTML='';
    if(rTab==='a') html=tableChart(T_MIN,T_MAX,lim);
    else html=`<div class="dnav"><button class="btn" type="button" data-dir="-1">‹ Prev</button><select id="rJump" aria-label="Jump to table">${range(T_MIN,T_MAX).map(n=>`<option value="${n}"${n===rDetail?' selected':''}>Table ${n}</option>`).join('')}</select><button class="btn" type="button" data-dir="1">Next ›</button></div><div class="carousel" id="rCar">${range(T_MIN,T_MAX).map(n=>`<div class="slide">${tableCard(n,lim)}</div>`).join('')}</div><p class="swipe-hint">Swipe left / right for the next table</p>`;
  } else {
    const {from,to}=rState[rMode], p=rMode==='square'?2:3;
    tabs.hidden=true; tabs.innerHTML='';
    $('rTitle').textContent=`${rNames[rMode]} ${from}–${to}`;
    ctl.innerHTML=`<label class="ctl">From<input id="rFrom" type="number" inputmode="numeric" min="2" max="50" value="${from}"></label><label class="ctl">To<input id="rTo" type="number" inputmode="numeric" min="2" max="50" value="${to}"></label><span class="ctl-note">allowed 2 – 50</span>`;
    html=`<div class="hlist">${range(from,to).map(n=>`<div class="rcell"><span class="q">${n} =</span><span class="v">${n**p}</span></div>`).join('')}</div>`;
  }
  grid.innerHTML=html;
  fitList(); requestAnimationFrame(fitList);
  $('hdrTitle').textContent=$('rTitle').textContent;
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
document.querySelectorAll('.tile[data-remember]').forEach(t=>t.addEventListener('click',()=>{
  rMode=t.dataset.remember; rTab='a'; rDetail=T_MIN;
  $('rGrid').classList.remove('hide-on'); $('rHide').textContent='Hide answers'; $('rPanel').classList.remove('open');
  home.hidden=true; remember.hidden=false;
  document.body.classList.add('in-practice');
  pushScreen('remember');
  renderRemember(); window.scrollTo(0,0);
}));
$('rTabs').addEventListener('click',e=>{
  const b=e.target.closest('.chip'); if(!b) return;
  rTab=b.dataset.tab; renderRemember();
});
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
$('rGear').addEventListener('click',()=>$('rPanel').classList.toggle('open'));
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
    if(practice.hidden||finished) return;
    $('quiz').scrollIntoView({block:'center',behavior:'smooth'});
  });
}

/* start instantly with basic settings (Easy · 20 Qs · 5 min · 10 s) */
document.querySelectorAll('.tile[data-mode]').forEach(t=>t.addEventListener('click',()=>{
  mode=t.dataset.mode; level='easy'; customSettings=null;
  $('count').value='20'; $('overallTime').value='300'; $('questionTime').value='10';
  $('modeTitle').textContent=titles[mode]; $('hdrTitle').textContent=titles[mode];
  $('customBox').hidden=true; $('customFields').innerHTML=''; markLevel(); closeDropdowns();
  home.hidden=true; practice.hidden=false;
  document.body.classList.add('in-practice');
  window.scrollTo(0,0);
  pushScreen('practice');
  startSession();
}));

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
