import test from 'node:test';
import assert from 'node:assert/strict';
import {readStarRecords,recordStar,countStars,availableLooks} from '../tangerine-trail/progress.mjs';
test('star records survive serialization with their exact identities',()=>{
 let records=readStarRecords(null,6);records=recordStar(records,0,2);records=recordStar(records,3,0);
 assert.deepEqual(readStarRecords(JSON.stringify(records),6),[4,0,0,1,0,0]);assert.equal(countStars(records),2);
});
test('recollecting a star does not inflate progress or unlock rewards early',()=>{
 let records=readStarRecords(null,6);for(let i=0;i<10;i++)records=recordStar(records,0,1);
 assert.equal(countStars(records),1);assert.deepEqual(availableLooks(records),['orange']);
 records=recordStar(recordStar(records,0,0),0,2);assert.deepEqual(availableLooks(records),['orange','mint']);
 assert.deepEqual(availableLooks([7,7,7,7,7,7]),['orange','mint','gold']);
});
test('corrupt or old save data loads safely without imaginary rewards',()=>{
 assert.deepEqual(readStarRecords('broken',6),[0,0,0,0,0,0]);assert.deepEqual(readStarRecords('{"0":7}',6),[0,0,0,0,0,0]);
 assert.deepEqual(readStarRecords('[7,-1,99,2.5,"7",null]',6),[7,0,0,0,0,0]);
 const records=[0,0,0,0,0,0];assert.deepEqual(recordStar(records,0,4),records);assert.deepEqual(recordStar(records,8,0),records);
});

test('expanding to nine worlds preserves existing stars and gold unlock',()=>{
 const expanded=readStarRecords('[7,7,7,7,7,7]',9);assert.deepEqual(expanded,[7,7,7,7,7,7,0,0,0]);assert.deepEqual(availableLooks(expanded),['orange','mint','gold']);const added=recordStar(expanded,8,2);assert.equal(countStars(added),19);assert.equal(expanded[8],0);assert.equal(readStarRecords(JSON.stringify(added),9)[8],4);
});
