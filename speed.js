import {parseAnswer,isCorrect} from './core.js';
// Integer arithmetic: subtraction and division invert addition and multiplication.
export function speedQuestion(settings, random = Math.random) {
  if(settings.numberType){
    const pick=(a,b)=>a+Math.floor(random()*(b-a+1)),op=settings.operations[pick(0,settings.operations.length-1)];
    const fraction=settings.numberType==='fractions';
    let a=pick(1,9),b=pick(1,9),da=fraction?pick(2,12):10,db=fraction?pick(2,12):10;
    const fmt=(n,d)=>fraction?n+'/'+d:String(n/d);
    if(op==='−'&&a/da<b/db){[a,b]=[b,a];[da,db]=[db,da];}
    const answer=op==='+'?a/da+b/db:op==='−'?a/da-b/db:op==='×'?(a*b)/(da*db):(a*db)/(da*b);
    return {prompt:fmt(a,da)+' '+op+' '+fmt(b,db),answer};
  }
  if(settings.questions?.length)return {...settings.questions[Math.floor(random()*settings.questions.length)]};
  const pick = (min, max) => min + Math.floor(random() * (max - min + 1));
  const operation = settings.operations[pick(0, settings.operations.length - 1)];
  const range = operation === '+' || operation === '−' ? settings.add : settings.multiply;
  const a = pick(range[0], range[1]), b = pick(range[2], range[3]);
  if (operation === '+') return {prompt: `${a} + ${b}`, answer: a + b};
  if (operation === '−') return {prompt: `${a + b} − ${a}`, answer: b};
  if (operation === '×') return {prompt: `${a} × ${b}`, answer: a * b};
  return {prompt: `${a * b} ÷ ${a}`, answer: b};
}

export function validateSettings(settings) {
  if (!settings.operations.length) return 'Choose at least one operation.';
  for (const range of [settings.add, settings.multiply]) {
    if (range.some(n => !Number.isInteger(n) || n < 1 || n > 999)) return 'Use whole numbers between 1 and 999 for every range.';
    if (range[0] > range[1] || range[2] > range[3]) return 'Each minimum must be no greater than its maximum.';
  }
  if (![30, 60, 120, 300].includes(settings.duration)) return 'Choose a valid duration.';
  return '';
}

export function settingsMarkup() {
  return `<div class="speed-settings"><p class="muted">Answer as many as you can before time runs out. Correct answers advance automatically; keep editing an incorrect answer.</p>
    <fieldset class="operations"><legend>Operations</legend>${['+','−','×','÷'].map((op,i)=>`<label><input type="checkbox" name="operation" value="${op}" checked> ${['Addition','Subtraction','Multiplication','Division'][i]}</label>`).join('')}</fieldset>
    <div class="range-settings"><fieldset><legend>Addition ranges</legend><div class="range-pair"><label>First minimum<input id="add-min-a" type="number" min="1" max="999" value="2"></label><label>First maximum<input id="add-max-a" type="number" min="1" max="999" value="100"></label></div><div class="range-pair"><label>Second minimum<input id="add-min-b" type="number" min="1" max="999" value="2"></label><label>Second maximum<input id="add-max-b" type="number" min="1" max="999" value="100"></label></div></fieldset>
    <fieldset><legend>Multiplication ranges</legend><div class="range-pair"><label>First minimum<input id="mul-min-a" type="number" min="1" max="999" value="2"></label><label>First maximum<input id="mul-max-a" type="number" min="1" max="999" value="12"></label></div><div class="range-pair"><label>Second minimum<input id="mul-min-b" type="number" min="1" max="999" value="2"></label><label>Second maximum<input id="mul-max-b" type="number" min="1" max="999" value="100"></label></div></fieldset></div>
    <p class="footnote">Subtraction reverses addition. Division reverses multiplication, so every answer is a positive whole number.</p>
    <label>Duration <select id="duration"><option value="30">30 seconds</option><option value="60">1 minute</option><option value="120" selected>2 minutes</option><option value="300">5 minutes</option></select></label><p id="settings-error" role="alert"></p>${settings.numberType?'<button id="check-speed" class="accent">Check answer</button><p id="speed-error" role="status"></p>':''}</div>`;
}

export function readSettings(root) {
  const numbers = ids => ids.map(id=>Number(root.querySelector(`#${id}`).value));
  return {operations:[...root.querySelectorAll('[name="operation"]:checked')].map(el=>el.value),duration:Number(root.querySelector('#duration').value),add:numbers(['add-min-a','add-max-a','add-min-b','add-max-b']),multiply:numbers(['mul-min-a','mul-max-a','mul-min-b','mul-max-b'])};
}

export function runSpeedRound(root, settings, onComplete, onCancel) {
  root.innerHTML=`<div class="section-label"><span>MENTAL MATH / ${settings.target?'TARGETED PRACTICE':'SPEED DRILL'}</span><button id="stop-speed" class="text-button">Discard round ✕</button></div><div class="speed-metrics"><div><span>TIME LEFT</span><strong id="time-left" role="timer"></strong></div><div><span>SCORE</span><strong id="round-score">0</strong></div></div><div class="progress"><span id="time-bar" style="width:100%"></span></div><div class="speed-stage"><h2 id="speed-question" aria-live="polite"></h2><label for="speed-answer">Your answer</label><input id="speed-answer" inputmode="${settings.numberType?'text':'numeric'}" autocomplete="off" aria-describedby="speed-hint"><p id="speed-hint" class="muted">${settings.numberType?'Enter a fraction or decimal (round to 2 decimal places if needed), then press Enter or Check answer.':'Just type. No Enter needed.'}</p></div>`;
  const input = root.querySelector('#speed-answer');
  const end = performance.now() + settings.duration * 1000;
  let started = performance.now(), current, active = true, timer;
  const attempts = [];
  const next = () => {current=speedQuestion(settings);root.querySelector('#speed-question').textContent=current.prompt;input.value='';started=performance.now();input.focus();};
  const stop = () => {if(!active)return;active=false;clearInterval(timer);document.removeEventListener('visibilitychange',tick);input.disabled=true;onComplete(attempts);};
  function tick() {
    if(!active)return;
    const remaining=Math.max(0,end-performance.now()), seconds=Math.ceil(remaining/1000);
    root.querySelector('#time-left').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
    root.querySelector('#time-bar').style.width=`${remaining/(settings.duration*10)}%`;
    if(remaining===0)stop();
  }
  const submit=()=>{
    if(!active)return;
    if(performance.now()>=end){stop();return;}
    const raw=input.value.trim();
    const valid=settings.numberType?isCorrect(parseAnswer(raw),current.answer):/^\d+$/.test(raw)&&Number(raw)===current.answer;
    if(!valid){if(settings.numberType)root.querySelector('#speed-error').textContent='Not quite. Try again.';return;}
    if(settings.numberType)root.querySelector('#speed-error').textContent='';
    attempts.push({...current,given:raw,correct:true,seconds:(performance.now()-started)/1000});
    root.querySelector('#round-score').textContent=attempts.length;next();
  };
  if(settings.numberType){input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit();}});root.querySelector('#check-speed').onclick=submit;}else input.addEventListener('input',submit);
  root.querySelector('#stop-speed').onclick=()=>{if(!active)return;active=false;clearInterval(timer);document.removeEventListener('visibilitychange',tick);onCancel();};
  next();tick();timer=setInterval(tick,100);document.addEventListener('visibilitychange',tick);
}
