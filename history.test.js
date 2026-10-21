import test from 'node:test';
import assert from 'node:assert/strict';
import {readRuns,writeRun,mergeRuns,migratePending} from './run-store.js';
import {runMetrics,escapeHTML} from './history.js';
class Storage {
 data=new Map();get length(){return this.data.size;}key(i){return [...this.data.keys()][i];}
 getItem(k){return this.data.get(k)??null;}setItem(k,v){this.data.set(k,v);}removeItem(k){this.data.delete(k);}
}
const row=(id,user_id=null)=>({id,user_id,completed_at:`2026-10-21T12:00:00Z`,results:{mode:'speed',duration:120,attempts:[{correct:true,seconds:2},{correct:true,seconds:4}]}});
test('guest and owner runs persist independently across reloads and acknowledgements',()=>{
 const storage=new Storage();writeRun(storage,row('a'));writeRun(storage,row('b','owner'),true);writeRun(storage,row('c','owner'),true);
 assert.deepEqual(readRuns(storage,null).map(e=>e.row.id),['a']);assert.equal(readRuns(storage,'owner').length,2);
 writeRun(storage,row('b','owner'),false);assert.equal(readRuns(storage,'owner').filter(e=>e.pending).length,1);
 assert.equal(readRuns(storage,'owner').length,2);assert.equal(readRuns(storage,'other').length,0);
});
test('legacy pending queue migrates once without overwriting an acknowledged run',()=>{
 const storage=new Storage();storage.setItem('quantgym-pending-owner',JSON.stringify([row('a','owner'),row('b','owner')]));writeRun(storage,row('a','owner'),false);
 migratePending(storage,'owner');migratePending(storage,'owner');assert.equal(readRuns(storage,'owner').length,2);assert.equal(readRuns(storage,'owner').filter(e=>e.pending).length,1);
});
test('failed migration keeps the old queue available',()=>{
 const storage=new Storage();storage.setItem('quantgym-pending-owner',JSON.stringify([row('a','owner')]));storage.setItem=()=>{throw Error('full');};
 assert.throws(()=>migratePending(storage,'owner'));assert.ok(storage.getItem('quantgym-pending-owner'));
});
test('merges duplicate cloud and cached runs while retaining unsynced runs',()=>{
 assert.equal(mergeRuns([row('a')],[row('a'),row('b')]).length,2);
});
test('history derives score and timings, including zero-score and older runs',()=>{
 const m=runMetrics(row('a'));assert.equal(m.correct,2);assert.equal(m.average,3);assert.equal(m.fastest,2);assert.equal(m.pace,1);
 assert.equal(runMetrics({results:{duration:30,attempts:[]}}).pace,0);assert.equal(runMetrics({results:{}}).average,null);
 assert.equal(escapeHTML('<img>'), '&lt;img&gt;');
});
