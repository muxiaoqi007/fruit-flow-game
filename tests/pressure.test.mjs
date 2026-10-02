import test from 'node:test';
import assert from 'node:assert/strict';
import {PressureInput,pressureProfile} from '../squishy/pressure.mjs';
import {SoftBody} from '../squishy/physics.mjs';
function hold(input,seconds,gain=.6,pinch=0){for(let i=0;i<seconds*120;i++)input.update({held:i/120,gain,pinch,dt:1/120});return input.value;}

test('mouse default pressure is simulated by hold duration, not mistaken for hardware force',()=>{const p=new PressureInput();p.begin({pointerType:'mouse',pressure:.5});const light=hold(p,.15);const strong=hold(p,2);assert.equal(p.source,'hold');assert.ok(light<.15);assert.ok(strong>.55);});
test('a plain touch screen using 0.5 retains long-press fallback',()=>{const p=new PressureInput();p.begin({pointerType:'touch',pressure:.5});hold(p,2);assert.equal(p.measured,false);assert.equal(p.source,'hold');assert.ok(p.value>.55);});
test('pen pressure follows both increasing and decreasing force without accumulating from hold time',()=>{const p=new PressureInput();p.begin({pointerType:'pen',pressure:.18});hold(p,2,1);const light=p.value;p.observe({pointerType:'pen',pressure:.9});hold(p,.5,1);assert.ok(p.value>light*4);p.observe({pointerType:'pen',pressure:.12});hold(p,.5,1);assert.ok(p.value<.14);assert.equal(p.source,'pen');});
test('touch pressure updates and force-only events use measured values',()=>{const p=new PressureInput();p.begin({pointerType:'touch',pressure:.2});hold(p,.6,1);assert.equal(p.source,'touch');p.observeTouch(.85);hold(p,.6,1);assert.ok(p.value>.84);p.observe({pointerType:'touch',pressure:.5});hold(p,.6,1);assert.ok(Math.abs(p.value-.5)<.01);});
test('fallback presets produce separate light, medium and strong force levels',()=>{const values=[.25,.6,1].map(gain=>{const p=new PressureInput();p.begin({pointerType:'touch',pressure:.5});return hold(p,2,gain);});assert.ok(values[1]>values[0]*2);assert.ok(values[2]>values[1]*1.6);});
test('pinching adds bounded pressure and release clears remembered sensor state',()=>{const p=new PressureInput();p.begin({pointerType:'pen',pressure:.9});hold(p,2,1,.5);assert.ok(p.value<=1);p.reset();assert.equal(p.value,0);assert.equal(p.measured,false);p.begin({pointerType:'touch',pressure:.5});assert.equal(p.source,'hold');});
test('higher measured pressure causes a materially deeper physical indentation',()=>{
 const dents=[.2,.6,1].map(value=>{const s=new SoftBody(),profile=pressureProfile(value);s.contact={point:[0,2,1],delta:[0,0,-profile.depth],radius:profile.radius,pressure:profile.depth};for(let i=0;i<180;i++)s.step(1/120);assert.ok(s.p.every(Number.isFinite));const depth=-s.displacement(s.bind(0,2,1),[0,0,0])[2];s.contact=null;for(let i=0;i<720;i++)s.step(1/120);assert.ok(s.deformation<.001);return depth;});
 assert.ok(dents[1]>dents[0]*2,JSON.stringify(dents));assert.ok(dents[2]>dents[1]*1.4,JSON.stringify(dents));
});
