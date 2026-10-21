export const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = n => Number.isFinite(Number(n)) ? Number(n).toFixed(2) : '—';
export function runMetrics(row) {
  const attempts = Array.isArray(row.results?.attempts) ? row.results.attempts : [];
  const correct = attempts.filter(a=>a.correct).length;
  const timed = attempts.filter(a=>Number.isFinite(a.seconds) && a.seconds>=0);
  const seconds = timed.reduce((sum,a)=>sum+a.seconds,0);
  const duration = Number(row.results?.duration);
  return {attempts,correct,average:timed.length?seconds/timed.length:null,fastest:timed.length?Math.min(...timed.map(a=>a.seconds)):null,pace:duration>0?correct*60/duration:null};
}
function detail(row) {
  const m=runMetrics(row), s=row.results?.settings, speed=row.results?.mode==='speed';
  const range = value => Array.isArray(value)&&value.length===4?`${value[0]}–${value[1]} and ${value[2]}–${value[3]}`:'Not recorded';
  return `<div class="run-detail"><dl class="run-metrics"><div><dt>Average answer</dt><dd>${m.average===null?'—':number(m.average)+'s'}</dd></div><div><dt>Fastest answer</dt><dd>${m.fastest===null?'—':number(m.fastest)+'s'}</dd></div>${speed?`<div><dt>Answers / minute</dt><dd>${m.pace===null?'—':number(m.pace)}</dd></div>`:''}</dl>
  ${speed?`<p class="footnote">Addition ranges: ${escapeHTML(range(s?.add))}<br>Multiplication ranges: ${escapeHTML(range(s?.multiply))}<br>Subtraction and division reverse these ranges. Answer times include time spent correcting input; incomplete typing is not scored.</p>`:''}
  ${m.attempts.length?`<div class="answer-table-wrap" tabindex="0" aria-label="Question breakdown"><table class="answer-table"><thead><tr><th>#</th><th>Question</th><th>Your answer</th><th>Correct answer</th><th>Time</th></tr></thead><tbody>${m.attempts.map((a,i)=>`<tr><td>${i+1}</td><td>${escapeHTML(a.prompt)}</td><td>${escapeHTML(a.given)} ${a.correct?'✓':'✕'}</td><td>${escapeHTML(a.answer)}</td><td>${number(a.seconds)}s</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">No questions completed in this round.</p>'}</div>`;
}
export function mountHistory(root, getState) {
  let filter='speed', limit=10;
  const open=new Set();
  function render() {
    const {rows,pending,user,guestCount}=getState();
    const filtered=rows.filter(r=>filter==='all'||r.results?.mode==='speed');
    root.innerHTML=`<div class="history-controls"><label>Show <select id="history-filter"><option value="speed" ${filter==='speed'?'selected':''}>Timed math runs</option><option value="all" ${filter==='all'?'selected':''}>All practice</option></select></label><button id="export-runs" class="quiet" ${filtered.length?'':'disabled'}>Export JSON ↓</button></div><p class="footnote">${filtered.length} saved ${filtered.length===1?'run':'runs'} · ${user?'Personal account':'This browser only · sign in to sync between devices'}</p>${user&&guestCount?`<button id="import-runs" class="quiet">Save ${guestCount} browser ${guestCount===1?'run':'runs'} to my account</button>`:''}
    ${filtered.length?filtered.slice(0,limit).map(r=>{
      const m=runMetrics(r), speed=r.results?.mode==='speed';
      const info=speed?`${r.results.duration}s · ${(r.results.settings?.operations||[]).join(' ')}`:r.results?.difficulty||'foundation';
      const status=!r.user_id?'Saved in this browser':pending.some(p=>p.id===r.id)?'Saved locally · awaiting sync':'Synced';
      return `<details class="saved-run" data-run="${escapeHTML(r.id)}" ${open.has(r.id)?'open':''}><summary><span><strong>${speed?'Math speed drill':r.activity==='math'?'Mental math':'Probability'}</strong><small>${escapeHTML(new Date(r.completed_at).toLocaleString())} · ${escapeHTML(info)}</small></span><span class="log-score">${speed?`${m.correct} correct`:`${m.correct} / ${m.attempts.length}`}<small>${status}</small><small>View details ▾</small></span></summary>${detail(r)}</details>`;
    }).join(''):'<div class="empty"><strong>No saved runs yet.</strong>Finish a timed round to start your history. Previous unsaved rounds cannot be recovered.</div>'}
    ${filtered.length>limit?'<button id="more-runs" class="quiet">Show 10 older runs</button>':''}`;
    root.querySelector('#history-filter').onchange=e=>{filter=e.target.value;limit=10;render();};
    root.querySelector('#more-runs')?.addEventListener('click',()=>{limit+=10;render();});
    root.querySelectorAll('[data-run]').forEach(el=>el.addEventListener('toggle',()=>{if(!el.isConnected)return;if(el.open)open.add(el.dataset.run);else open.delete(el.dataset.run);}));
    root.querySelector('#import-runs')?.addEventListener('click',()=>getState().importGuest());
    root.querySelector('#export-runs').onclick=()=>{
      const blob=new Blob([JSON.stringify({format:'quantgym-history-v1',exported_at:new Date().toISOString(),runs:filtered},null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`quantgym-runs-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    };
  }
  return render;
}
