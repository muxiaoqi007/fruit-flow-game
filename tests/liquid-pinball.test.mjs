import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,launch,jet,step,water} from '../liquid-pinball/physics.mjs';
function boot(){const g=createGame();g.mode='playing';return g}
function advance(g,t,input={}){for(let i=0;i<t*180;i++)step(g,1/180,input)}
test('five launches, no additional launch while water is in play, final drain ends round',()=>{const g=boot();for(let i=0;i<5;i++){assert.equal(launch(g),true);assert.equal(launch(g),false);g.balls[0].launching=false;g.balls[0].y=960;step(g,.02);assert.equal(g.stock,4-i)}assert.equal(g.mode,'ended');assert.equal(launch(g),false)});
test('a descending drop is collected in cup once, ascending drop is not',()=>{const g=boot();g.balls=[water(300,162,0,-100)];step(g,.01);assert.equal(g.cups,0);g.balls[0].vy=100;step(g,.01);assert.equal(g.cups,1);assert.equal(g.score,500);step(g,.01);assert.equal(g.score,500)});
test('hard bumper hit splits water, awards score and preserves total area',()=>{const g=boot();g.balls=[water(188,230,0,600)];advance(g,.04);assert.equal(g.balls.length,2);assert.ok(g.score>=50);assert.ok(Math.abs(g.balls.reduce((s,b)=>s+b.r*b.r,0)-441)<1e-8)});
test('nearby slow water reunites preserving area and momentum',()=>{const g=boot();const a=water(280,600,20,0,10),b=water(295,600,20,0,10);a.age=b.age=1;g.balls=[a,b];step(g,.005);assert.equal(g.balls.length,1);assert.ok(Math.abs(g.balls[0].r-Math.sqrt(200))<1e-8)});
test('flipper stroke propels a falling drop upward',()=>{const g=boot();g.balls=[water(220,745,0,160,15)];advance(g,.08,{left:true});assert.ok(g.balls[0].vy< -300);assert.ok(g.flippers[0].a<0)});
test('jet rescues drops and cooldown blocks repeat, pause freezes simulation',()=>{const g=boot();g.balls=[water(300,820,0,300)];assert.equal(jet(g),true);assert.ok(g.balls[0].vy<0);assert.equal(jet(g),false);g.mode='paused';const before=JSON.stringify(g);step(g,.03,{left:true});assert.equal(JSON.stringify(g),before);assert.equal(jet(g),false)});
test('long mixed-input play has finite physics and bounded particles',()=>{const g=boot();for(let i=0;i<54000&&g.mode==='playing';i++){if(!g.balls.length)launch(g);if(i%1250===0)jet(g);step(g,1/180,{left:i%80<16,right:i%110<22});assert.ok(g.balls.length<=6);for(const b of g.balls){assert.ok([b.x,b.y,b.vx,b.vy,b.r].every(Number.isFinite));assert.ok(Math.hypot(b.vx,b.vy)<=1350.001)}}assert.ok(g.score>=0)});

test('natural launch reaches the upper table before returning to the flippers',()=>{const g=boot();launch(g);advance(g,.75);assert.ok(g.balls.length>0);assert.ok(g.balls.some(b=>b.y<250));for(const b of g.balls)assert.ok(b.x>0&&b.x<600)});
