import {fractionDefaults,decimalDefaults,validateNumberRanges,rangesMarkup} from './number-ranges.js';
import {escapeHTML as esc} from './history.js';
const names={'+':'Addition','−':'Subtraction','×':'Multiplication','÷':'Division'};
export function practiceTargets(rows){
 const stats=new Map(),questions=new Map();
 const recent=rows.filter(r=>r.results?.mode==='speed').sort((a,b)=>Date.parse(b.completed_at)-Date.parse(a.completed_at)).slice(0,50);
 for(const r of recent)for(const a of r.results.attempts||[]){
  const m=String(a.prompt).match(/^(\d+) ([+−×÷]) (\d+)$/);
  if(!m||!a.correct||!Number.isFinite(a.seconds)||a.seconds<0||!Number.isInteger(a.answer)||a.answer<1)continue;
  const v=stats.get(m[2])||{op:m[2],count:0,total:0};v.count++;v.total+=a.seconds;stats.set(m[2],v);
  const q=questions.get(a.prompt)||{prompt:a.prompt,answer:a.answer,count:0,total:0};q.count++;q.total+=a.seconds;questions.set(a.prompt,q);
 }
 return {operations:[...stats.values()].filter(v=>v.count>=5).sort((a,b)=>b.total/b.count-a.total/a.count),questions:[...questions.values()].sort((a,b)=>b.total/b.count-a.total/a.count).slice(0,20).map(({prompt,answer})=>({prompt,answer}))};
}
export function targetSettings(choice,duration,targets){
 const config={duration,operations:['+','−','×','÷'],add:[2,100,2,100],multiply:[2,12,2,100]};
 if(choice==='slow'){if(!targets.questions.length)throw new Error('Complete a timed run first.');config.questions=targets.questions;config.target='Slow question review';}
 else if(choice==='probability'||choice==='probability-challenge'){config.numberType='probability';config.difficulty=choice==='probability'?'foundation':'challenge';config.target='Probability · '+config.difficulty;}
 else if(choice==='fractions'||choice==='decimals'){config.numberType=choice;config.target=choice==='fractions'?'Fraction arithmetic':'Decimal arithmetic';}
 else if(choice==='two'){config.operations=['×'];config.multiply=[10,99,10,99];config.target='Two-digit multiplication';}
 else if(names[choice]){config.operations=[choice];config.target=names[choice]+' practice';}
 else throw new Error('Choose a practice focus.');
 return config;
}
export function mountTargeted(root,getRows,start){let choice='+',duration=60,f=structuredClone(fractionDefaults),d=structuredClone(decimalDefaults);return function render(){
 const t=practiceTargets(getRows()),best=t.operations[0];
 if(choice==='slow'&&!t.questions.length)choice='+';
 root.innerHTML='<h2>Targeted practice</h2><p class="muted">Timed drills with automatic scoring: operations, fractions, decimals, probability, and your slowest questions.</p>'+ (best?'<p>Suggested focus: <strong>'+names[best.op]+'</strong> · '+(best.total/best.count).toFixed(2)+'s per answer across '+best.count+' answers. <button class="quiet" id="use-target">Use suggestion</button></p>':'<p class="footnote">Complete more timed runs for a suggestion (at least 5 timed answers per operation).</p>')+'<p class="footnote">Suggestions use your latest 50 timed runs. Different question sizes can affect timings. Operation drills use standard ranges; slow question review repeats saved questions.</p><label>Focus <select id="target-focus">'+Object.entries(names).map(([op,name])=>'<option value="'+op+'" '+(choice===op?'selected':'')+'>'+name+'</option>').join('')+['probability','probability-challenge'].map(v=>'<option value="'+v+'" '+(choice===v?'selected':'')+'>'+ (v==='probability'?'Probability — foundation':'Probability — challenge')+'</option>').join('')+['fractions','decimals'].map(v=>'<option value="'+v+'" '+(choice===v?'selected':'')+'>'+ (v==='fractions'?'Fractions':'Decimals')+'</option>').join('')+'<option value="two" '+(choice==='two'?'selected':'')+'>Two-digit multiplication</option><option value="slow" '+(choice==='slow'?'selected':'')+' '+(!t.questions.length?'disabled':'')+'>Slow question review</option></select></label> <label>Duration <select id="target-duration">'+[30,60,120,300].map(n=>'<option value="'+n+'" '+(duration===n?'selected':'')+'>'+n+' seconds</option>').join('')+'</select></label><div class="speed-settings">'+rangesMarkup(choice,f,d)+'</div><p id="target-error" role="alert"></p><p><button class="accent" id="start-target">Start targeted practice</button></p>';
 root.querySelector('#target-focus').onchange=e=>{choice=e.target.value;render();};
 root.querySelector('#target-duration').onchange=e=>duration=Number(e.target.value);
 root.querySelector('#use-target')?.addEventListener('click',()=>{choice=best.op;render();});
 root.querySelectorAll('[data-number-range]').forEach(el=>el.oninput=()=>{
  const n=id=>{const value=root.querySelector('#'+id).value;return value===''?NaN:Number(value);};
  if(choice==='fractions')f={numerator:[n('num-min'),n('num-max')],denominator:[n('den-min'),n('den-max')]};
  if(choice==='decimals')d={range:[n('dec-min'),n('dec-max')],places:n('dec-places')};
 });
 root.querySelector('#start-target').onclick=()=>{const config=targetSettings(choice,duration,t);if(choice==='fractions')config.fractionRanges=structuredClone(f);if(choice==='decimals')config.decimalRanges=structuredClone(d);const error=validateNumberRanges(config);root.querySelector('#target-error').textContent=error;if(!error)start(config);};
 };}
