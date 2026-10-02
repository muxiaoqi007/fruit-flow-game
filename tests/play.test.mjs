import test from 'node:test';
import assert from 'node:assert/strict';
import {ToyPlay} from '../squishy/play.mjs';
test('tickling requires belly strokes and settles when rubbing stops',()=>{
 const toy=new ToyPlay();for(let i=0;i<120;i++){toy.stroke(20,false);toy.step(1/60,'tickle');}assert.equal(toy.tickle,0);
 for(let i=0;i<120;i++){toy.stroke(15,true);toy.step(1/60,'tickle');}assert.ok(toy.tickle>.4);
 for(let i=0;i<240;i++)toy.step(1/60,'tickle');assert.ok(toy.tickle<.01);
});
test('rocker follows a held push then oscillates and returns upright',()=>{
 const toy=new ToyPlay();toy.target=[.85,.3];for(let i=0;i<120;i++)toy.step(1/60,'rocker');assert.ok(toy.angle>.8);assert.ok(toy.pitch>.25);
 toy.target=null;let crossings=0;for(let i=0;i<720;i++){toy.step(1/60,'rocker');if(toy.crossed)crossings++;}assert.ok(crossings>1);assert.ok(Math.abs(toy.angle)<.001);assert.ok(Math.abs(toy.pitch)<.001);
 toy.reset();assert.equal(toy.velocity,0);assert.equal(toy.tickle,0);assert.equal(toy.target,null);
});
