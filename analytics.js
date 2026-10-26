import {numberRanges,rangesLabel} from './number-ranges.js';
import {escapeHTML as esc,runMetrics} from './history.js';
export function settingsKey(row){
 const s=row.results?.settings,d=Number(row.results?.duration);
 if(row.results?.mode!=='speed'||!s||!Array.isArray(s.operations)||!s.operations.length||![s.add,s.multiply].every(r=>Array.isArray(r)&&r.length===4&&r.every(Number.isFinite))||!Number.isFinite(d)||d<=0)return null;
 return JSON.stringify([d,[...new Set(s.operations)].sort(),s.add,s.multiply,...(s.target?[s.target,s.questions||null]:[]),numberRanges(s)]);
}
export function analyze(rows,key){
 const runs=rows.filter(r=>settingsKey(r)===key&&key!==null&&Number.isFinite(Date.parse(r.completed_at))).sort((a,b)=>Date.parse(a.completed_at)-Date.parse(b.completed_at));
 const points=runs.map((r,i)=>({date:r.completed_at,score:runMetrics(r).correct,average:runs.slice(Math.max(0,i-4),i+1).reduce((n,x)=>n+runMetrics(x).correct,0)/Math.min(i+1,5)}));
 const operations=new Map(),types=new Map();
 for(const r of runs)for(const a of r.results.attempts||[]){
  if(!a.correct||!Number.isFinite(a.seconds)||a.seconds<0)continue;
  if(r.results.settings?.numberType==='probability'){const label=a.topic||'Probability';for(const map of [operations,types]){const v=map.get(label)||{label,count:0,total:0};v.count++;v.total+=a.seconds;map.set(label,v);}continue;}
  const m=String(a.prompt).match(/^(\d+(?:[./]\d+)?)\s*([+−×÷])\s*(\d+(?:[./]\d+)?)$/);if(!m)continue;
  const name={'+':'Addition','−':'Subtraction','×':'Multiplication','÷':'Division'}[m[2]];
  for(const [map,label] of [[operations,name],[types,name+' · '+(r.results.settings?.numberType|| (m[1].length+' digit / '+m[3].length+' digit'))]]){const v=map.get(label)||{label,count:0,total:0};v.count++;v.total+=a.seconds;map.set(label,v);}
 }
 const summarize=map=>[...map.values()].map(v=>({...v,mean:v.total/v.count})).sort((a,b)=>b.mean-a.mean);
 return {points,best:points.length?Math.max(...points.map(p=>p.score)):null,operations:summarize(operations),types:summarize(types)};
}
function table(items){return items.length?'<div class="answer-table-wrap"><table class="answer-table"><thead><tr><th>Type</th><th>Answers</th><th>Average time</th></tr></thead><tbody>'+items.map(x=>'<tr><td>'+esc(x.label)+'</td><td>'+x.count+(x.count<5?' · limited data':'')+'</td><td>'+x.mean.toFixed(2)+'s</td></tr>').join('')+'</tbody></table></div>':'<p class="muted">No answer timings recorded yet.</p>';}
function chart(points){
 const max=Math.max(1,...points.map(p=>p.score)), x=i=>40+(points.length===1?270:i*540/(points.length-1)),y=v=>180-v/max*150;
 const line=k=>points.map((p,i)=>x(i)+','+y(p[k])).join(' ');
 return '<svg class="score-chart" viewBox="0 0 620 220" role="img" aria-label="Correct answers by run, oldest to newest. Solid line: score. Dashed line: rolling average."><line x1="40" y1="180" x2="580" y2="180" stroke="#555"/><text x="8" y="184">0</text><text x="8" y="30">'+max+'</text><polyline points="'+line('score')+'" fill="none" stroke="white" stroke-width="2"/><polyline points="'+line('average')+'" fill="none" stroke="#999" stroke-width="2" stroke-dasharray="6 5"/>'+points.map((p,i)=>'<circle cx="'+x(i)+'" cy="'+y(p.score)+'" r="4" fill="white"><title>'+esc(new Date(p.date).toLocaleString())+': '+p.score+' correct; average '+p.average.toFixed(1)+'</title></circle>').join('')+'<text x="40" y="210">Oldest</text><text x="540" y="210">Latest</text></svg>';
}
export function mountAnalytics(root,getRows){let selected=null;return function render(){
 const rows=getRows(),groups=new Map();for(const r of [...rows].sort((a,b)=>Date.parse(b.completed_at)-Date.parse(a.completed_at))){const key=settingsKey(r);if(key&&!groups.has(key))groups.set(key,r);}
 if(!groups.has(selected))selected=groups.keys().next().value||null;
 if(!selected){root.innerHTML='<h2>Progress & weaknesses</h2><p class="muted">Complete a timed run to see score trends and answer timings.</p>';return;}
 const a=analyze(rows,selected), latest=a.points.at(-1);
 root.innerHTML='<h2>Progress & weaknesses</h2><label>Compare settings <select id="analytics-settings">'+[...groups].map(([key,r],i)=>'<option value="'+i+'" '+(key===selected?'selected':'')+'>'+esc((r.results.settings.target?r.results.settings.target+' · ':'')+r.results.duration+'s · '+(rangesLabel(r.results.settings)?rangesLabel(r.results.settings)+' · ':'')+r.results.settings.operations.join(' ')+' · add '+r.results.settings.add.join('/')+' · multiply '+r.results.settings.multiply.join('/'))+'</option>').join('')+'</select></label><p class="footnote">Only runs with the same duration, operations, and ranges are compared. Ranges show first min/max, then second min/max.</p><dl class="run-metrics"><div><dt>Personal best</dt><dd>'+ (a.best??'—')+'</dd></div><div><dt>Latest score</dt><dd>'+(latest?.score??'—')+'</dd></div><div><dt>Rolling average · last '+Math.min(a.points.length,5)+'</dt><dd>'+(latest?latest.average.toFixed(1):'—')+'</dd></div></dl>'+ (a.points.length?chart(a.points):'')+'<p class="footnote">Correct answers · solid: run score · dashed: average of up to 5 runs. '+a.points.length+' matching runs.</p><details><summary>View chart data</summary><div class="answer-table-wrap"><table class="answer-table"><thead><tr><th>Date</th><th>Score</th><th>Rolling average</th></tr></thead><tbody>'+a.points.map(p=>'<tr><td>'+esc(new Date(p.date).toLocaleString())+'</td><td>'+p.score+'</td><td>'+p.average.toFixed(1)+'</td></tr>').join('')+'</tbody></table></div></details><h3>Operations / topics · slowest first</h3>'+table(a.operations)+'<h3>Question types · slowest first</h3><p class="footnote">Digit counts refer to the two numbers shown in each question. Times include corrections; unfinished questions are not recorded. Fewer than 5 answers is limited evidence.</p>'+table(a.types);
 root.querySelector('#analytics-settings').onchange=e=>{selected=[...groups.keys()][Number(e.target.value)];render();};
 };}
