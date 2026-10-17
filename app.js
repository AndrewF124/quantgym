import {question,parseAnswer,isCorrect,summary} from './core.js';
const URL='https://lhxsquzmblnfhauqrhoh.supabase.co';
const KEY='sb_publishable_aRzHnFzqPywqtRqJi-chkg_wLp_Yh9i';
const OWNER='46df99c8-daed-4eee-8aea-974e6fbd1a91';
const $=id=>document.getElementById(id);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let client,user,rows=[],pending=[],track='math',session=null,authVersion=0;
const initialPractice=$('practice').innerHTML;
const notice=s=>$('notice').textContent=s;
const syncStatus=s=>$('sync-status').textContent=s;
$('today').textContent=new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
function savePending(){try{localStorage.setItem(`quantgym-pending-${OWNER}`,JSON.stringify(pending));}catch{notice('Browser backup is unavailable. Keep this tab open until syncing succeeds.');}}
function readPending(){try{return JSON.parse(localStorage.getItem(`quantgym-pending-${OWNER}`)||'[]').filter(r=>r.user_id===OWNER);}catch{return [];}}
function render(){
 const s=summary(rows);$('accuracy').textContent=s.total?`${Math.round(s.correct/s.total*100)}%`:'—';$('sessions').textContent=s.sessions;$('answers').textContent=s.total;$('speed').textContent=s.total?(s.seconds/s.total).toFixed(1):'—';
 const dates=new Set(rows.map(r=>new Date(r.completed_at).toDateString()));let day=new Date(),streak=0;if(!dates.has(day.toDateString()))day.setDate(day.getDate()-1);while(dates.has(day.toDateString())){streak++;day.setDate(day.getDate()-1);}$('streak').textContent=streak;
 $('history').innerHTML=rows.length?rows.slice(0,12).map(r=>{const x=summary([r]);return `<div class="log-row"><div>${r.activity==='math'?'Mental math':'Probability'}<small>${escape(new Date(r.completed_at).toLocaleString())} · ${escape(r.results?.difficulty||'foundation')}</small></div><div class="log-score">${x.correct} / ${x.total}<small>${pending.some(p=>p.id===r.id)?'Waiting to sync':'Completed'}</small></div></div>`;}).join(''):`<div class="empty"><strong>Your first rep starts here.</strong>${user?'Complete a session to start your training log.':'Sign in to see saved sessions, or try a practice round.'}</div>`;
}
let syncing=false;
async function sync(){
 if(!client||!user||syncing)return;syncing=true;const version=authVersion;syncStatus('Syncing…');
 try{
  for(const row of [...pending]){const {error}=await client.from('training_results').upsert(row,{onConflict:'id'});if(error)throw error;if(version!==authVersion)return;pending=pending.filter(p=>p.id!==row.id);savePending();}
  let data=[];for(let offset=0;;offset+=1000){const result=await client.from('training_results').select('*').eq('user_id',OWNER).order('completed_at',{ascending:false}).order('id').range(offset,offset+999);if(result.error)throw result.error;data.push(...result.data);if(result.data.length<1000)break;}
  if(version!==authVersion)return;
  rows=[...new Map([...pending,...data].map(r=>[r.id,r])).values()].sort((a,b)=>b.completed_at.localeCompare(a.completed_at));syncStatus(pending.length?'Results waiting to sync':'Synced · private account');render();
 }catch(error){if(version===authVersion){syncStatus('Sync failed · retry with Refresh');notice(`Could not sync: ${error.message}. Completed results remain in this browser for retry.`);}}
 finally{syncing=false;}
}
function setupPractice(){
 document.querySelectorAll('[data-track]').forEach(b=>{b.classList.toggle('selected',b.dataset.track===track);b.setAttribute('aria-pressed',String(b.dataset.track===track));b.onclick=()=>{track=b.dataset.track;setupPractice();};});
 $('start').onclick=()=>{session={id:crypto.randomUUID(),owner:user?.id||null,track,difficulty:$('difficulty').value,attempts:[]};showQuestion();};
 $('practice-note').textContent=user?'Your completed sessions will sync to your private account.':'Try a session now. Sign in to save your results across devices.';
}
function resetPractice(){session=null;$('practice').innerHTML=initialPractice;setupPractice();}
function showQuestion(){
 const q=question(session.track,session.difficulty);const started=performance.now();
 $('practice').innerHTML=`<div class="section-label"><span>${session.track==='math'?'MENTAL MATH':'PROBABILITY'} / ${session.attempts.length+1} OF 10</span><button id="exit" class="text-button">End session ✕</button></div><div class="progress"><span style="width:${session.attempts.length*10}%"></span></div><h2 class="question">${escape(q.prompt)}</h2><form id="answer-form" class="answer-form"><label for="answer">Enter a number, fraction, or percentage. Round to 2 decimal places if needed.</label><input id="answer" autocomplete="off" inputmode="text" required autofocus aria-describedby="answer-error"><p id="answer-error" role="alert"></p><button class="accent">Check answer ↗</button></form><div id="feedback" aria-live="polite"></div>`;
 $('answer').focus();$('exit').onclick=()=>{if(confirm('End this session? Incomplete sessions are not saved.'))resetPractice();};
 $('answer-form').onsubmit=e=>{e.preventDefault();const raw=$('answer').value,value=parseAnswer(raw);if(!Number.isFinite(value)){$('answer-error').textContent='Enter a valid number, such as 0.25, 1/4, or 25%.';return;}
  const correct=isCorrect(value,q.answer);session.attempts.push({...q,given:raw,correct,seconds:Math.round((performance.now()-started)/100)/10});$('answer-form').querySelector('button').disabled=true;$('answer').disabled=true;$('answer-error').textContent='';
  $('feedback').innerHTML=`<div class="feedback"><strong>${correct?'Correct. Nice work.':`Answer: ${Number(q.answer.toFixed(4))}`}</strong><div>${escape(q.explanation)}</div></div><button id="next" class="accent">${session.attempts.length===10?'View results':'Next question'} →</button>`;
  $('next').focus();$('next').onclick=()=>session.attempts.length===10?finish():showQuestion();
 };
}
function finish(){
 const completed=session;session=null;const correct=completed.attempts.filter(a=>a.correct).length;
 const row={id:completed.id,user_id:completed.owner,completed_at:new Date().toISOString(),activity:completed.track,results:{difficulty:completed.difficulty,attempts:completed.attempts}};
 const canSave=user&&completed.owner===user.id;
 if(canSave){pending.push(row);savePending();rows.unshift(row);render();sync();}
 $('practice').innerHTML=`<div class="section-label">SESSION COMPLETE</div><h2 class="question">${correct} / 10. Another rep in the bank.</h2><p class="muted">${canSave?'Your result is queued for syncing. Check the sync status for confirmation.':'Practice complete. Sign in before your next session to save results.'}</p><details><summary>Review all 10 answers</summary>${completed.attempts.map(a=>`<div class="review-item"><strong>${a.correct?'✓':'○'} ${escape(a.prompt)}</strong><p>Your answer: ${escape(a.given)} · Correct: ${Number(a.answer.toFixed(4))}</p><p>${escape(a.explanation)}</p></div>`).join('')}</details><button id="again" class="accent">Back to training ↗</button>`;$('again').onclick=resetPractice;
}
async function setUser(next){
 if(next&&next.id!==OWNER){await client.auth.signOut();notice('This site is restricted to its owner account.');return;}
 if(user?.id===next?.id)return;
 authVersion++;user=next;rows=[];pending=user?readPending():[];rows=[...pending];$('account-button').textContent=user?'Sign out ↗':'Sign in ↗';render();if(!session&&$('start'))setupPractice();if(user)await sync();else syncStatus('Practice mode · not signed in');
}
$('account-button').onclick=async()=>{if(session){notice('Finish or end your session before changing accounts.');return;}if(user){const {error}=await client.auth.signOut();if(error)notice(error.message);}else $('login-dialog').showModal();};
$('close-login').onclick=()=>$('login-dialog').close();
$('login-form').onsubmit=async e=>{e.preventDefault();if(!client){$('login-error').textContent='Connection library unavailable. Check your internet connection and reload.';return;}$('login-submit').disabled=true;$('login-error').textContent='';try{const {data,error}=await client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error;if(data.user.id!==OWNER)throw new Error('Use your personal owner account.');$('password').value='';$('login-dialog').close();await setUser(data.user);}catch(error){$('login-error').textContent=error.message;}finally{$('login-submit').disabled=false;}};
$('refresh').onclick=()=>user?sync():notice('Sign in to load your saved progress.');
window.addEventListener('online',sync);window.addEventListener('focus',sync);window.addEventListener('storage',e=>{if(user&&e.key===`quantgym-pending-${OWNER}`){pending=readPending();sync();}});
setupPractice();render();
try{const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.57.4');client=createClient(URL,KEY);client.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>setUser(session?.user||null),0);});const {data,error}=await client.auth.getSession();if(error)throw error;await setUser(data.session?.user||null);}catch(error){syncStatus('Connection unavailable · practice still works');notice(`Sign-in could not initialize: ${error.message}`);}
