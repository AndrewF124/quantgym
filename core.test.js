import test from 'node:test';
import assert from 'node:assert/strict';
import {question,parseAnswer,isCorrect,summary} from './core.js';
test('accepts fractions, percentages, decimals; rejects invalid input',()=>{assert.equal(parseAnswer('1/4'),.25);assert.equal(parseAnswer('25%'),.25);assert.equal(parseAnswer('-2.5'),-2.5);for(const s of ['','1/0','2abc','0x10','Infinity'])assert.ok(Number.isNaN(parseAnswer(s)));});
test('accepts rounded answers without accepting a one-cent error',()=>{assert.ok(isCorrect(.33,1/3));assert.ok(!isCorrect(.34,1/3));assert.ok(!isCorrect(101,100));});
test('question generators produce finite and correct reference answers',()=>{assert.equal(question('math','foundation',()=>0).answer,4);assert.equal(question('probability','foundation',()=>0).answer,.25);for(const track of ['math','probability'])for(const difficulty of ['foundation','challenge'])for(let i=0;i<1000;i++){const q=question(track,difficulty);assert.ok(Number.isFinite(q.answer));assert.ok(isCorrect(parseAnswer(q.answer.toFixed(2)),q.answer));}});
test('summarizes saved attempts',()=>{assert.deepEqual(summary([{results:{attempts:[{correct:true,seconds:2},{correct:false,seconds:4}]}}]),{sessions:1,total:2,correct:1,seconds:6});assert.equal(summary([]).total,0);});
