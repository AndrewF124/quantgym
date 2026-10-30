import {runReflex,reflexSummary,reflexDetails} from './reflex.js?v=circles-20261029';
import {estimationQuestion,estimationGrade} from './estimation.js';
import {mountTargeted,targetSettings} from './targeted.js?v=circles-20261029';
import {mountAnalytics} from './analytics.js?v=circles-20261029';
import {question,parseAnswer,isCorrect,summary} from './core.js';
import {readRuns,writeRun,mergeRuns,migratePending} from './run-store.js';
import {mountHistory} from './history.js?v=circles-20261029';
import {settingsMarkup,readSettings,validateSettings,runSpeedRound} from './speed.js?v=circles-20261029';
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
function stored(owner){try{return readRuns(localStorage,owner);}catch{return [];}}
function retain(row,waiting){try{writeRun(localStorage,row,waiting);return true;}catch{notice('Browser storage is unavailable or full. Export your history as a backup; cloud saving will still be attempted when signed in.');return false;}}
function readPending(){return stored(OWNER).filter(e=>e.pending).map(e=>e.row);}
function refreshLocal(){const entries=stored(user?.id);rows=mergeRuns(rows,entries.map(e=>e.row));if(user)pending=mergeRuns(pending,entries.filter(e=>e.pending).map(e=>e.row));}
function importGuest(){
 if(!user)return;
 for(const entry of stored(null)){
  const row={...entry.row,user_id:user.id};
  if(retain(row,true)){pending=mergeRuns(pending,[row]);rows=mergeRuns(rows,[row]);try{localStorage.removeItem('quantgym-run-v1:guest:'+row.id);}catch{}}
 }
 render();sync();
}
const renderHistory=mountHistory($('history'),()=>({rows,pending,user,guestCount:stored(null).length,importGuest}));
const renderAnalytics=mountAnalytics($('analytics'),()=>rows);
const renderTargeted=mountTargeted($('targeted'),()=>rows,config=>{
 if(session){notice('Finish or discard your current round before starting targeted practice.');return;}
 session={id:crypto.randomUUID(),owner:user?.id||null,track:config.numberType==='probability'?'probability':'math',mode:'speed',duration:config.duration,settings:config,attempts:[]};
 runSpeedRound($('practice'),config,attempts=>{session.attempts=attempts;finish();},resetPractice);
 $('practice').scrollIntoView({block:'start',behavior:'smooth'});
});
function render(){
 const s=summary(rows.filter(r=>r.results?.mode!=='reflex')), graded=summary(rows.filter(r=>!['speed','reflex'].includes(r.results?.mode)));$('accuracy').textContent=graded.total?`${Math.round(graded.correct/graded.total*100)}%`:'—';$('accuracy').nextElementSibling.textContent='graded practice accuracy';$('sessions').textContent=s.sessions;$('answers').textContent=s.total;$('speed').textContent=s.total?(s.seconds/s.total).toFixed(1):'—';
 const dates=new Set(rows.map(r=>new Date(r.completed_at).toDateString()));let day=new Date(),streak=0;if(!dates.has(day.toDateString()))day.setDate(day.getDate()-1);while(dates.has(day.toDateString())){streak++;day.setDate(day.getDate()-1);}$('streak').textContent=streak;
 renderHistory();renderAnalytics();renderTargeted();
}
let syncing=false,syncRequested=false;
async function sync(){
 if(!client||!user)return;if(syncing){syncRequested=true;return;}refreshLocal();syncing=true;syncRequested=false;const version=authVersion;syncStatus('Syncing…');
 try{
  for(const row of [...pending]){const {error}=await client.from('training_results').upsert(row,{onConflict:'id'});if(error)throw error;if(version!==authVersion)return;retain(row,false);pending=pending.filter(p=>p.id!==row.id);}
  let data=[];for(let offset=0;;offset+=1000){const result=await client.from('training_results').select('*').eq('user_id',OWNER).order('completed_at',{ascending:false}).order('id').range(offset,offset+999);if(result.error)throw result.error;data.push(...result.data);if(result.data.length<1000)break;}
  if(version!==authVersion)return;
  for(const row of data)retain(row,false);rows=mergeRuns(rows,data,pending);syncStatus(pending.length?'Results waiting to sync':'Synced · private account');render();
 }catch(error){if(version===authVersion){syncStatus('Sync failed · retry with Refresh');notice(`Could not sync: ${error.message}. Completed results remain in this browser for retry.`);}}
 finally{syncing=false;if(syncRequested&&user){syncRequested=false;setTimeout(sync,0);}}
}
function setupPractice(){
 let gameOptions=$('reflex-options');if(!gameOptions){gameOptions=document.createElement('label');gameOptions.id='reflex-options';gameOptions.innerHTML='Game <select id="reflex-mode"><option value="reaction">Reaction speed</option><option value="timing">Timing challenge</option><option value="circles">Circle timing</option></select>';$('practice').querySelector('.start-row').prepend(gameOptions);}gameOptions.hidden=track!=='reflex';
 document.querySelectorAll('[data-track]').forEach(b=>{b.classList.toggle('selected',b.dataset.track===track);b.setAttribute('aria-pressed',String(b.dataset.track===track));b.onclick=()=>{track=b.dataset.track;setupPractice();};});
 let settings=$('speed-settings');if(!settings){settings=document.createElement('div');settings.id='speed-settings';settings.innerHTML=settingsMarkup();$('practice').querySelector('.start-row').before(settings);}
 let probabilityDuration=$('probability-duration-wrap');if(!probabilityDuration){probabilityDuration=document.createElement('div');probabilityDuration.id='probability-duration-wrap';probabilityDuration.innerHTML='<label>Format <select id="probability-format"><option value="timed">Timed drill</option><option value="guided">10 questions with feedback</option></select></label> <label>Duration <select id="probability-duration"><option value="30">30 seconds</option><option value="60">1 minute</option><option value="120" selected>2 minutes</option><option value="300">5 minutes</option></select></label>';$('practice').querySelector('.start-row').prepend(probabilityDuration);}probabilityDuration.hidden=track!=='probability';
 settings.hidden=track!=='math';$('difficulty').parentElement.hidden=track==='math'||track==='reflex';$('practice').querySelector('.pill').textContent=track==='math'?'Beat the clock':track==='reflex'?'Choose a game':track==='estimation'?'10 estimates · your pace':'Timed probability';
 $('practice').querySelector('[data-track="math"] strong').textContent='Math speed drill';$('practice').querySelector('[data-track="math"] > span:not(.track-icon)').textContent='Addition, subtraction, multiplication & division';
 $('start').onclick=()=>{
  if(track==='reflex'){session={id:crypto.randomUUID(),owner:user?.id||null,track:'math',mode:'reflex',attempts:[]};runReflex($('practice'),$('reflex-mode').value,result=>{session.gameResult=result;finish();},resetPractice);return;}
  if(track==='math'){
   const config=readSettings(settings),error=validateSettings(config);$('settings-error').textContent=error;if(error)return;
   session={id:crypto.randomUUID(),owner:user?.id||null,track,mode:'speed',duration:config.duration,settings:config,attempts:[]};
   runSpeedRound($('practice'),config,attempts=>{session.attempts=attempts;finish();},resetPractice);
  }else{
   if(track==='estimation'){session={id:crypto.randomUUID(),owner:user?.id||null,track,difficulty:$('difficulty').value,attempts:[]};showQuestion();return;}
   if($('probability-format').value==='guided'){session={id:crypto.randomUUID(),owner:user?.id||null,track,difficulty:$('difficulty').value,attempts:[]};showQuestion();return;}
   const config=targetSettings($('difficulty').value==='challenge'?'probability-challenge':'probability',Number($('probability-duration').value),{});
   session={id:crypto.randomUUID(),owner:user?.id||null,track,mode:'speed',duration:config.duration,settings:config,attempts:[]};
   runSpeedRound($('practice'),config,attempts=>{session.attempts=attempts;finish();},resetPractice);
  }
 };
 $('practice-note').textContent=user?'Your completed sessions will sync to your private account.':'Visitors can practice and save runs in this browser only. Sign-in and cloud storage are reserved for the site owner.';
}
function resetPractice(){session=null;$('practice').innerHTML=initialPractice;setupPractice();}
function showQuestion(){
 const q=session.track==='estimation'?estimationQuestion(session.difficulty):question(session.track,session.difficulty);const started=performance.now();
 $('practice').innerHTML=`<div class="section-label"><span>${session.track==='estimation'?'ESTIMATION':session.track==='math'?'MENTAL MATH':'PROBABILITY'} / ${session.attempts.length+1} OF 10</span><button id="exit" class="text-button">End session ✕</button></div><div class="progress"><span style="width:${session.attempts.length*10}%"></span></div><h2 class="question">${escape(q.prompt)}</h2><form id="answer-form" class="answer-form"><label for="answer">${session.track==='estimation'?'Aim within '+(q.tolerance*100)+'% of the exact answer. Enter your estimate, then check it.':'Enter a number, fraction, or percentage. Round to 2 decimal places if needed.'}</label><input id="answer" autocomplete="off" inputmode="text" required autofocus aria-describedby="answer-error"><p id="answer-error" role="alert"></p><button class="accent">Check answer ↗</button></form><div id="feedback" aria-live="polite"></div>`;
 $('answer').focus();$('exit').onclick=()=>{if(confirm('End this session? Incomplete sessions are not saved.'))resetPractice();};
 $('answer-form').onsubmit=e=>{e.preventDefault();const raw=$('answer').value,value=parseAnswer(raw);if(!Number.isFinite(value)){$('answer-error').textContent='Enter a valid number, such as 0.25, 1/4, or 25%.';return;}
  const grade=session.track==='estimation'?estimationGrade(value,q.answer,q.tolerance):null;const correct=grade?grade.correct:isCorrect(value,q.answer);session.attempts.push({...q,given:raw,correct,seconds:Math.round((performance.now()-started)/100)/10});$('answer-form').querySelector('button').disabled=true;$('answer').disabled=true;$('answer-error').textContent='';
  $('feedback').innerHTML=`<div class="feedback"><strong>${correct?'Correct. Nice work.':`Answer: ${Number(q.answer.toFixed(4))}`}</strong>${grade?'<p>Your estimate was '+(grade.relativeError*100).toFixed(2)+'% off. Exact answer: '+Number(q.answer.toFixed(6))+'.</p>':''}<div>${escape(q.explanation)}</div></div><button id="next" class="accent">${session.attempts.length===10?'View results':'Next question'} →</button>`;
  $('next').focus();$('next').onclick=()=>session.attempts.length===10?finish():showQuestion();
 };
}
function finish(){
 const completed=session;session=null;const correct=completed.attempts.filter(a=>a.correct).length;
 const row={id:completed.id,user_id:completed.owner,completed_at:new Date().toISOString(),activity:completed.track,results:{difficulty:completed.difficulty,attempts:completed.attempts,...(completed.mode==='reflex'?{mode:'reflex',...completed.gameResult}:{}),...(completed.mode==='speed'?{mode:'speed',duration:completed.duration,settings:completed.settings}: {})}};
 const canSave=user&&completed.owner===user.id;
 const storedRow=canSave?row:{...row,user_id:null};
 const retained=retain(storedRow,Boolean(canSave));
 if(canSave){pending=mergeRuns(pending,[storedRow]);rows=mergeRuns(rows,[storedRow]);render();sync();}
 else if(!user){rows=mergeRuns(rows,[storedRow]);render();}
 if(completed.mode==='reflex'){$('practice').innerHTML='<div class="section-label">GAME COMPLETE</div><h2>'+reflexSummary(completed.gameResult)+'</h2>'+reflexDetails(completed.gameResult)+'<p class="muted">'+(canSave?'Results queued for your private account.':retained?'Saved in this browser.':'Could not save locally; export your history before leaving.')+'</p><button id="again" class="accent">Back to training</button>';$('again').onclick=resetPractice;return;}
 $('practice').innerHTML=`<div class="section-label">${completed.mode==='speed'?"TIME’S UP":'SESSION COMPLETE'}</div><h2 class="question">${completed.mode==='speed'?`${correct} correct in ${completed.duration} seconds.`:`${correct} / 10. Another rep in the bank.`}</h2>${completed.mode==='speed'?`<p class="muted">${(correct/completed.duration*60).toFixed(1)} answers per minute · ${escape(completed.settings.operations.join(' '))}</p>`:''}<p class="muted">${canSave?'Your result is queued for syncing. Check the sync status for confirmation.':retained?'Saved in this browser only. Visitors cannot save to the cloud or sync across devices; those features are reserved for the site owner.':'Browser storage failed. Keep this page open and export your history.'}</p><details><summary>Review ${completed.attempts.length} answers</summary>${completed.attempts.map(a=>`<div class="review-item"><strong>${a.correct?'✓':'○'} ${escape(a.prompt)}</strong><p>Your answer: ${escape(a.given)} · Correct: ${Number(a.answer.toFixed(4))}</p>${a.explanation?`<p>${escape(a.explanation)}</p>`:''}</div>`).join('')}</details><button id="again" class="accent">Back to training ↗</button>`;$('again').onclick=resetPractice;
}
async function setUser(next){
 if(next&&next.id!==OWNER){await client.auth.signOut();notice('This site is restricted to its owner account.');return;}
 if(user?.id===next?.id)return;
 authVersion++;user=next;rows=stored(user?.id).map(e=>e.row);pending=user?readPending():[];$('account-button').textContent=user?'Sign out ↗':'Owner sign in ↗';render();if(!session&&$('start'))setupPractice();if(user)await sync();else syncStatus('Browser storage only · cloud sync is owner-only');
}
$('account-button').onclick=async()=>{if(session){notice('Finish or end your session before changing accounts.');return;}if(user){const {error}=await client.auth.signOut();if(error)notice(error.message);}else $('login-dialog').showModal();};
$('close-login').onclick=()=>$('login-dialog').close();
$('login-form').onsubmit=async e=>{e.preventDefault();if(!client){$('login-error').textContent='Connection library unavailable. Check your internet connection and reload.';return;}$('login-submit').disabled=true;$('login-error').textContent='';try{const {data,error}=await client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error;if(data.user.id!==OWNER)throw new Error('Use your personal owner account.');$('password').value='';$('login-dialog').close();await setUser(data.user);}catch(error){$('login-error').textContent=error.message;}finally{$('login-submit').disabled=false;}};
$('refresh').onclick=()=>{refreshLocal();render();if(user)sync();};
window.addEventListener('online',sync);window.addEventListener('focus',sync);window.addEventListener('storage',e=>{if(e.key?.startsWith('quantgym-run-v1:')){refreshLocal();render();if(user)sync();}});
try{migratePending(localStorage,OWNER);}catch{notice('Could not migrate the local save queue. Existing data has been retained.');}
rows=stored(null).map(e=>e.row);
setupPractice();render();
try{const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.57.4');client=createClient(URL,KEY);client.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>setUser(session?.user||null),0);});const {data,error}=await client.auth.getSession();if(error)throw error;await setUser(data.session?.user||null);}catch(error){syncStatus('Connection unavailable · practice still works');notice(`Sign-in could not initialize: ${error.message}`);}
