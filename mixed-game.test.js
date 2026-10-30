import test from 'node:test';
import assert from 'node:assert/strict';
import {mixedQuestion,mixedSummary,runMixedGame} from './mixed-game.js';
test('mixed questions have exact whole-number answers across all operators',()=>{
 for(const r of [0,.3,.6,.9]){const q=mixedQuestion(()=>r);assert.ok(Number.isInteger(q.answer));assert.ok(q.answer>0);}
 assert.equal(mixedSummary({trials:[{kind:'math',correct:true},{kind:'math',correct:false},{kind:'reaction',status:'early'},{kind:'reaction',status:'valid',ms:240}]}),'1/2 math · 240 ms reaction');
});
test('mixed game completes both trial types once, pauses and cleans up',t=>{
 let now=0,timer,frame,visibility,result;
 const old={document:globalThis.document,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
 globalThis.document={hidden:false,addEventListener(_,fn){visibility=fn;},removeEventListener(){visibility=null;}};
 globalThis.requestAnimationFrame=fn=>{frame=fn;return 1;};globalThis.cancelAnimationFrame=()=>{};
 t.after(()=>Object.assign(globalThis,old));t.mock.method(performance,'now',()=>now);t.mock.method(Math,'random',()=>0);t.mock.method(globalThis,'setTimeout',fn=>{timer=fn;return 1;});t.mock.method(globalThis,'clearTimeout',()=>{});
 const els=new Map(),root={innerHTML:'',querySelector(id){if(!els.has(id))els.set(id,{classList:{add(){},remove(){}},focus(){},value:''});return els.get(id);}},el=id=>root.querySelector('#mix-'+id);
 runMixedGame(root,r=>result=r,()=>{});el('start').onclick();document.hidden=true;visibility();assert.equal(el('pad').textContent,'Paused');document.hidden=false;el('start').onclick();
 for(let i=0;i<12;i++){timer();frame();now+=200;if(el('pad').textContent==='NOW')el('pad').onkeydown({key:' ',preventDefault(){}});else{el('answer').value='4';el('form').onsubmit({preventDefault(){}});el('form').onsubmit({preventDefault(){}});}if(i<11)timer();}
 assert.equal(el('start').textContent,'Save results');el('start').onclick();assert.equal(result.trials.length,12);assert.equal(result.trials.filter(t=>t.kind==='math').length,6);assert.equal(result.trials.filter(t=>t.correct).length,6);assert.equal(visibility,null);
});
