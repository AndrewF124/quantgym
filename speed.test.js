import test from 'node:test';
import assert from 'node:assert/strict';
import {speedQuestion,validateSettings,runSpeedRound} from './speed.js';
const settings={duration:120,operations:['+','−','×','÷'],add:[2,100,2,100],multiply:[2,12,2,100]};
test('all operations respect ranges and inverse arithmetic',()=>{
 for(const operation of settings.operations){
  for(const random of [()=>0,()=>0.999999]){
   const q=speedQuestion({...settings,operations:[operation]},random);
   const [a,op,b]=q.prompt.split(' ');const x=Number(a),y=Number(b);
   assert.equal(q.answer,op==='+'?x+y:op==='−'?x-y:op==='×'?x*y:x/y);
   assert.ok(Number.isInteger(q.answer)&&q.answer>0);
   const range=['+','−'].includes(op)?settings.add:settings.multiply;
   const first=op==='−'?y:op==='÷'?y:x;
   const second=op==='−'||op==='÷'?q.answer:y;
   assert.ok(first>=range[0]&&first<=range[1]);assert.ok(second>=range[2]&&second<=range[3]);
  }
 }
});
test('invalid setup cannot start an impossible round',()=>{
 assert.equal(validateSettings(settings),'');
 for(const patch of [{operations:[]},{duration:0},{add:[10,2,2,10]},{multiply:[0,12,2,100]},{add:[1.5,2,2,3]},{add:[2,1000,2,3]}])assert.notEqual(validateSettings({...settings,...patch}),'');
});

test('round scores only correct answers before deadline and completes once',t=>{
 let now=0,tick,completed=0,result;
 t.mock.method(performance,'now',()=>now);
 t.mock.method(globalThis,'setInterval',fn=>{tick=fn;return 1;});
 t.mock.method(globalThis,'clearInterval',()=>{});
 const originalDocument=globalThis.document;
 globalThis.document={addEventListener(){},removeEventListener(){}};
 t.after(()=>{if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;});
 const elements=new Map();
 const root={innerHTML:'',querySelector(id){if(!elements.has(id))elements.set(id,{style:{},value:'',textContent:'',focus(){},addEventListener(name,fn){this[name]=fn;}});return elements.get(id);}};
 runSpeedRound(root,{...settings,duration:30,operations:['+'],add:[2,2,3,3]},a=>{completed++;result=a;},()=>{});
 const input=root.querySelector('#speed-answer');
 input.value='4';input.input();assert.equal(root.querySelector('#speed-question').textContent,'2 + 3');
 now=500;input.value='5';input.input();assert.equal(root.querySelector('#round-score').textContent,1);assert.equal(input.value,'');
 now=30000;input.value='5';input.input();tick();
 assert.equal(completed,1);assert.equal(result.length,1);assert.equal(result[0].seconds,.5);assert.equal(input.disabled,true);
});
import {speedAnswerMatches} from './speed.js';
test('auto answers accept equivalents and correct rounding, reject incomplete or nearby answers',()=>{for(const raw of ['1/4','0.25','25%'])assert.ok(speedAnswerMatches(raw,.25,true));assert.ok(speedAnswerMatches('0.33',1/3,true));for(const raw of ['','0.','1/','0.32','0.34','1/0'])assert.equal(speedAnswerMatches(raw,1/3,true),false);assert.equal(speedAnswerMatches('0',.004,true),false);assert.ok(speedAnswerMatches('0.00',.004,true));assert.equal(speedAnswerMatches('0.25',.25,false),false);});
test('fraction and decimal rounds advance on input without submission and stop at deadline',t=>{
 let now=0,done; t.mock.method(performance,'now',()=>now);t.mock.method(Math,'random',()=>0);t.mock.method(globalThis,'setInterval',()=>1);t.mock.method(globalThis,'clearInterval',()=>{});
 const previous=globalThis.document;globalThis.document={addEventListener(){},removeEventListener(){}};t.after(()=>{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;});
 for(const numberType of ['fractions','decimals','probability']){
 now=0;const elements=new Map(),root={innerHTML:'',querySelector(id){if(!elements.has(id))elements.set(id,{style:{},value:'',textContent:'',focus(){},addEventListener(event,fn){this[event]=fn;}});return elements.get(id);}};
 runSpeedRound(root,{...settings,numberType,duration:30},a=>done=a,()=>{});const input=root.querySelector('#speed-answer');input.value='1/';input.input();assert.equal(root.querySelector('#round-score').textContent,'');input.value=numberType==='fractions'?'1':numberType==='decimals'?'0.2':'1/4';now=500;input.input();assert.equal(root.querySelector('#round-score').textContent,1);assert.equal(input.value,'');now=30000;input.input();assert.equal(done.length,1);assert.equal(done[0].seconds,.5);
 }
});
test('probability generator includes topics and worked explanations at both levels',()=>{for(const difficulty of ['foundation','challenge'])for(const r of [0,.3,.6,.9]){const q=speedQuestion({...settings,numberType:'probability',difficulty},()=>r);assert.ok(Number.isFinite(q.answer));assert.ok(q.topic);assert.ok(q.explanation);}});
