import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,ripple,step,levels} from '../ripple-post/physics.mjs';
function boot(level=0){const g=createGame(level);g.mode='playing';return g;}
function advance(g,t){for(let i=0;i<t*120;i++)step(g,1/120);}
test('wave propagates before pushing away, hits only once and has limited reach',()=>{const g=boot();ripple(g,170,720);step(g,1/120);assert.equal(g.boat.vy,0);advance(g,.25);assert.ok(g.boat.vy<0);assert.equal(g.waves[0].hit,true);advance(g,2);assert.equal(g.waves.length,0);assert.equal(g.strokes,1);const far=boot();ripple(far,600,100);advance(far,2);assert.equal(far.boat.y,650);});
test('pause prevents wave creation and freezes simulation; cooldown prevents rapid spam',()=>{const g=boot();assert.ok(ripple(g,100,650));assert.equal(ripple(g,100,650),false);g.mode='paused';const snapshot=JSON.stringify(g);advance(g,1);assert.equal(ripple(g,100,650),false);assert.equal(JSON.stringify(g),snapshot);});
test('dock requires all lights and completes once',()=>{const g=boot();Object.assign(g.boat,g.dock);step(g,.01);assert.equal(g.mode,'playing');for(const l of g.lights){Object.assign(g.boat,{x:l.x,y:l.y});step(g,.01);assert.ok(l.collected);}Object.assign(g.boat,g.dock);step(g,.01);assert.equal(g.mode,'won');assert.equal(ripple(g,0,0),false);});
test('island collision resolves penetration and reflects incoming boat',()=>{const g=boot(1),r=g.rocks[0];Object.assign(g.boat,{x:r.x-r.r-17,y:r.y,vx:150});step(g,.01);assert.ok(g.boat.vx<0);assert.ok(Math.hypot(g.boat.x-r.x,g.boat.y-r.y)>=r.r+17.99);});
test('all maps remain finite and bounded under sustained ripples',()=>{for(let level=0;level<levels.length;level++){const g=boot(level);for(let i=0;i<12000;i++){if(i%70===0)ripple(g,g.boat.x+Math.sin(i)*60,g.boat.y+Math.cos(i)*60);step(g,1/120);assert.ok(Object.values(g.boat).every(Number.isFinite));assert.ok(g.boat.x>=24&&g.boat.x<=696&&g.boat.y>=24&&g.boat.y<=796);assert.ok(g.waves.length<=3);}}});
