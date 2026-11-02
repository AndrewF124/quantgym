import {parseAnswer,isCorrect} from './core.js';
export function sprintQuestion(index,random=Math.random){
 const n=2+Math.floor(random()*3),threshold=2+Math.floor(random()*4);
 const questions=[
 {prompt:`Flip a fair coin ${n} times. Probability of all heads?`,answer:1/2**n,explanation:`Independent flips multiply: (1/2)^${n} = 1/${2**n}.`},
 {prompt:`Roll a fair six-sided die. Probability of at least ${threshold}?`,answer:(7-threshold)/6,explanation:`Count ${threshold} through 6: ${7-threshold} favorable outcomes out of 6.`},
 {prompt:'Draw one card from a shuffled standard 52-card deck, without jokers. Probability of an ace?',answer:1/13,explanation:'There are 4 aces among 52 cards: 4/52 = 1/13.'},
 {prompt:`Flip a fair coin ${n} times. Probability of at least one head?`,answer:1-1/2**n,explanation:`Use the complement: 1 − P(all tails) = 1 − 1/${2**n}.`},
 {prompt:'Roll two independent fair six-sided dice. Probability their sum is 7?',answer:1/6,explanation:'Six ordered pairs sum to 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1). There are 36 pairs total: 6/36 = 1/6.'},
 {prompt:'Draw two cards without replacement from a shuffled standard 52-card deck. Probability both are hearts?',answer:1/17,explanation:'Multiply 13/52 × 12/51 = 1/17. The second draw has one fewer heart and one fewer card.'},
 {prompt:'Flip three fair coins independently. Probability of exactly two heads?',answer:3/8,explanation:'HHT, HTH, and THH are the 3 favorable sequences among 8 equally likely sequences.'},
 {prompt:'Roll two independent fair six-sided dice. Probability of at least one six?',answer:11/36,explanation:'Subtract the chance neither is six: 1 − (5/6)² = 11/36.'},
 {prompt:'Draw one card from a shuffled standard 52-card deck. Probability it is a king or a heart?',answer:4/13,explanation:'Count 4 kings + 13 hearts − 1 king of hearts = 16 cards. 16/52 = 4/13.'},
 {prompt:'Roll two independent fair six-sided dice. Probability of a double?',answer:1/6,explanation:'There are 6 doubles among 36 ordered outcomes: 6/36 = 1/6.'}
 ];return questions[index%questions.length];
}
export function runProbabilitySprint(root,onComplete,onCancel){
 const order=Array.from({length:10},(_,i)=>i);for(let i=9;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 let active=true,state='ready',frame,started=0,remaining=15000,q,attempts=[];
 root.innerHTML='<div class="section-label">PROBABILITY SPRINT <button id="ps-exit" class="text-button">Discard sprint</button></div><h2>Think in probabilities.</h2><p>10 shuffled coin, dice, and card questions. 15 seconds each. One answer per question; review the explanation before continuing.</p><p id="ps-progress"></p><strong id="ps-clock"></strong><h3 id="ps-question"></h3><form id="ps-form" hidden><label for="ps-answer">Enter a fraction, decimal, or percentage. Decimals may be rounded to 2 places.</label><input id="ps-answer" autocomplete="off" inputmode="text"><p id="ps-error" role="alert"></p><button class="accent">Submit answer</button><button id="ps-skip" type="button">Skip</button></form><div id="ps-feedback" role="status"></div><button id="ps-next" class="accent">Start sprint</button>';
 const el=id=>root.querySelector('#ps-'+id);
 function cleanup(){active=false;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);}
 function finish(timeout=false,skip=false){if(!active||state!=='answer')return;const raw=el('answer').value.trim(),value=parseAnswer(raw),elapsed=15000-remaining+performance.now()-started;timeout=timeout||elapsed>=15000;if(!timeout&&!skip&&!Number.isFinite(value)){el('error').textContent='Enter a number, fraction, or percentage.';return;}state='feedback';cancelAnimationFrame(frame);const correct=!timeout&&!skip&&isCorrect(value,q.answer);attempts.push({...q,given:timeout?'Timed out':skip?'Skipped':raw,correct,seconds:Math.min(15000,elapsed)/1000});el('form').hidden=true;el('clock').textContent='';el('feedback').textContent=(correct?'Correct. ':timeout?'Time up. ':skip?'Skipped. ':'Incorrect. ')+'Answer: '+Number(q.answer.toFixed(4))+'. '+q.explanation;el('next').hidden=false;el('next').textContent=attempts.length===10?'Save results':'Next question';el('next').focus();}
 function tick(){if(!active||state!=='answer')return;const left=remaining-(performance.now()-started);el('clock').textContent=(Math.max(0,left)/1000).toFixed(1)+'s';if(left<=0)finish(true);else frame=requestAnimationFrame(tick);}
 function begin(){if(!active)return;if(attempts.length===10){cleanup();onComplete(attempts);return;}if(state!=='paused'){q=sprintQuestion(order[attempts.length]);remaining=15000;el('answer').value='';el('feedback').textContent='';el('error').textContent='';}state='answer';started=performance.now();el('progress').textContent='Question '+(attempts.length+1)+' / 10 · '+attempts.filter(a=>a.correct).length+' correct';el('question').textContent=q.prompt;el('form').hidden=false;el('next').hidden=true;el('answer').focus();tick();}
 function visibility(){if(document.hidden&&state==='answer'){remaining=Math.max(0,remaining-(performance.now()-started));state='paused';cancelAnimationFrame(frame);el('form').hidden=true;el('next').hidden=false;el('next').textContent='Resume question';el('clock').textContent='Paused';}}
 el('form').onsubmit=e=>{e.preventDefault();finish();};el('skip').onclick=()=>finish(false,true);el('next').onclick=begin;el('exit').onclick=()=>{cleanup();onCancel();};document.addEventListener('visibilitychange',visibility);
}
