import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,createPractice,step,damage,FLOOR,WORLDS} from '../tangerine-trail/physics.mjs';
const boot=(index=0)=>{const g=createGame(index);g.mode='playing';return g;};
const advance=(g,t,input={})=>{for(let i=0;i<Math.ceil(t*120);i++)step(g,1/120,input);};
test('holding jump reaches higher than tapping; landing stops at the floor',()=>{
 const high=boot(),low=boot();let highY=high.player.y,lowY=low.player.y;
 for(let i=0;i<120;i++){step(high,1/120,{jump:i<80});step(low,1/120,{jump:i<6});highY=Math.min(highY,high.player.y);lowY=Math.min(lowY,low.player.y);}
 assert.ok(lowY-highY>35);assert.equal(high.player.y,FLOOR-high.player.h);assert.equal(high.player.grounded,true);
});
test('walk, sprint, release and world bounds respond to actual input',()=>{
 const walk=boot(),run=boot();advance(walk,.7,{right:true});advance(run,.7,{right:true,run:true});assert.ok(run.player.x>walk.player.x+35);
 advance(run,.5);assert.equal(run.player.vx,0);advance(run,3,{left:true});assert.equal(run.player.x,0);
});
test('coyote time allows a jump just after leaving the ground',()=>{
 const g=boot();g.solids=g.solids.filter(b=>b.type==='ground'&&b.x<128);g.player.x=127;g.player.vx=200;
 step(g,1/120,{right:true});step(g,1/120,{right:true});assert.equal(g.player.grounded,false);step(g,1/120,{right:true,jump:true});assert.ok(g.player.vy< -400);
});
test('jump pressed just before landing is buffered and does not auto-repeat',()=>{
 const g=boot();g.player.y=363;g.player.vy=180;g.player.grounded=false;g.player.coyote=0;
 advance(g,.05,{jump:true});assert.ok(g.player.vy<0);advance(g,1.5,{jump:true});assert.equal(g.player.grounded,true);
});
test('question block pays once when hit from below and blocks the head',()=>{
 const g=boot(),b=g.solids.find(b=>b.type==='box');Object.assign(g.player,{x:b.x+4,y:340,vy:-400,grounded:false,coyote:0});advance(g,.1,{jump:true});assert.equal(b.type,'used');assert.equal(g.coinsCount,1);assert.equal(g.score,100);assert.ok(g.player.y>=b.y+b.h);
 Object.assign(g.player,{x:b.x+4,y:340,vy:-400,grounded:false,coyote:0});advance(g,.1,{jump:true});assert.equal(g.coinsCount,1);
});
test('coins and optional stars are collected only once',()=>{
 const g=boot();const c=g.coins[0];g.player.x=c.x;g.player.y=c.y;advance(g,.02);assert.equal(c.taken,true);assert.equal(g.coinsCount,1);
 g.coins=[];const s=g.stars[0];g.player.x=s.x;g.player.y=s.y;advance(g,.02);assert.equal(s.taken,true);assert.equal(g.localStars,1);assert.equal(g.starsCount,1);assert.equal(g.score,600);advance(g,.02);assert.equal(g.score,600);
});
test('landing on an enemy defeats it and bounces the player',()=>{
 const g=boot(),e=g.enemies[0];g.coins=[];Object.assign(g.player,{x:e.x+2,y:e.y-33,vy:180,grounded:false,coyote:0});advance(g,.03,{jump:true});assert.equal(e.alive,false);assert.ok(g.player.vy<0);assert.equal(g.hp,3);assert.equal(g.score,200);
});
test('side collision costs one heart and grants temporary invulnerability',()=>{
 const g=boot(),e=g.enemies[0];g.player.x=e.x;step(g,1/120);assert.equal(g.hp,2);assert.ok(g.player.invuln>1);damage(g);assert.equal(g.hp,2);advance(g,2.1);damage(g);assert.equal(g.hp,1);
});
test('all checkpoints have safe floor; falling respawns there and preserves collections',()=>{
 for(let index=0;index<WORLDS.length;index++){const g=boot(index),cp=g.checkpoint;assert.ok(g.solids.some(b=>b.type==='ground'&&cp.x>=b.x&&cp.x+24<=b.x+b.w));
 g.hp=2;g.player.x=cp.x+1;step(g,1/120);assert.equal(cp.active,true);assert.equal(g.hp,3);assert.equal(g.respawnX,cp.x);g.coinsCount=7;g.player.y=600;step(g,1/120);assert.equal(g.hp,2);assert.equal(g.mode,'respawning');advance(g,.56);assert.equal(g.player.x,cp.x);assert.equal(g.player.y,FLOOR-32);assert.equal(g.coinsCount,7);
 }
});
test('three falls end the game; a stopped game cannot collect or take damage',()=>{
 const g=boot();for(let i=0;i<3;i++){g.player.y=600;step(g,1/120);advance(g,.72);}assert.equal(g.mode,'dead');assert.equal(g.hp,0);const before=JSON.stringify(g);advance(g,1,{right:true,jump:true});assert.equal(JSON.stringify(g),before);
});
test('pause freezes physics and the world timer',()=>{const g=boot();g.mode='paused';const before=JSON.stringify(g);advance(g,1,{right:true,jump:true});assert.equal(JSON.stringify(g),before);});
test('reaching the flag gives a single completion bonus; next world carries score and totals',()=>{
 const g=boot();g.player.x=g.flag.x;step(g,1/120);assert.equal(g.mode,'finishing');advance(g,1.7);assert.equal(g.mode,'won');assert.equal(g.score,1600);advance(g,1);assert.equal(g.score,1600);const next=createGame(1,g.score,8,2);assert.equal(next.score,1600);assert.equal(next.coinsCount,8);assert.equal(next.starsCount,2);assert.equal(next.localStars,0);
});
test('camera follows and stays within the world for narrow viewports',()=>{
 const g=boot();g.viewWidth=600;g.player.x=3000;advance(g,.4);assert.ok(g.camera>2000);assert.ok(g.camera<=g.world.length-600);
});
// The route uses ordinary movement/jump input from the starting position.
// It may take a hit or fall, exercising checkpoint recovery on actual maps.
for(let index=0;index<WORLDS.length;index++)test(`world ${index+1} can be completed with continuous gameplay input`,()=>{
 const g=boot(index);let jumping=false,stuck=0,prevX=0;
 for(let i=0;i<120*70&&!['dead','won'].includes(g.mode);i++){
  const p=g.player;
  if(p.grounded){const ahead=p.x+p.w+35;const ledge=!g.solids.some(b=>ahead>=b.x&&ahead<b.x+b.w&&Math.abs(b.y-p.y-p.h)<3);const enemy=g.enemies.some(e=>e.alive&&e.x>p.x-10&&e.x-p.x<100&&e.y<p.y+p.h+16);const wall=g.solids.some(b=>b.type!=='ground'&&b.type!=='platform'&&b.x>p.x&&b.x-p.x<75&&b.y<p.y+p.h&&b.y+b.h>p.y);jumping=!g.jumpWasDown&&(ledge||enemy||wall||stuck>25);}
  step(g,1/120,{right:true,run:true,jump:jumping});stuck=Math.abs(p.x-prevX)<.01?stuck+1:0;prevX=p.x;g.events.length=0;
  assert.ok([p.x,p.y,p.vx,p.vy].every(Number.isFinite));
 }
 assert.equal(g.mode,'won',`stopped at x=${g.player.x}, hearts=${g.hp}`);assert.ok(g.hp>0);assert.ok(g.coinsCount>0);
});


test('snow has a longer stopping distance without changing other worlds',()=>{
 const snow=boot(3),grass=boot();snow.player.x=352;step(snow,1/120);advance(snow,.4,{right:true,run:true});advance(grass,.4,{right:true,run:true});
 const snowStart=snow.player.x,grassStart=grass.player.x;advance(snow,.18);advance(grass,.18);
 assert.ok(snow.player.vx>150);assert.equal(grass.player.vx,0);assert.ok(snow.player.x-snowStart>grass.player.x-grassStart+12);
});
test('lava contact costs one heart and safely respawns; high jumps stay clear',()=>{
 const g=boot(4),[a]=g.gaps[0];g.player.x=a*32+12;g.player.y=360;g.player.grounded=false;g.player.coyote=0;
 step(g,1/120);assert.equal(g.hp,3);g.player.y=411;step(g,1/120);assert.equal(g.hp,2);assert.equal(g.mode,'respawning');advance(g,.56);assert.equal(g.player.x,g.respawnX);assert.equal(g.player.y,FLOOR-32);advance(g,.1);assert.equal(g.hp,2);
});
test('new worlds have distinct routes, safe starts and three supported star detours',()=>{
 const signatures=new Set();
 for(let index=3;index<WORLDS.length;index++){
  const g=boot(index);signatures.add(JSON.stringify(g.gaps));assert.equal(g.stars.length,3);assert.equal(g.hp,3);assert.ok(g.solids.some(b=>b.type==='ground'&&g.player.x>=b.x&&g.player.x<b.x+b.w));
  for(const s of g.stars)assert.ok(g.solids.some(b=>s.x+s.w>b.x&&s.x<b.x+b.w&&b.y>s.y+s.h&&b.y-s.y<100),'star has a reachable supporting platform');
  for(const e of g.enemies)assert.ok(g.solids.some(b=>b.type==='ground'&&e.x>=b.x&&e.x+e.w<=b.x+b.w));
 }
 assert.equal(signatures.size,WORLDS.length-3);
});

test('first teaching pits have safe lower floors and can be escaped without losing hearts',()=>{
 for(const [a,b] of [[29,32],[47,50]]){
  const g=boot();g.enemies=[];g.player.x=a*32+16;g.player.y=365;g.player.grounded=false;g.player.coyote=0;
  advance(g,.6);assert.equal(g.hp,3);assert.equal(g.player.y,400);assert.equal(g.player.grounded,true);
  advance(g,.75,{right:true,run:true,jump:true});assert.ok(g.player.x>=b*32);assert.equal(g.hp,3);
 }
});
test('brick collision rewards at most once, while still giving bump feedback',()=>{
 const g=boot(),b=g.solids.find(b=>b.type==='brick');g.coins=[];g.stars=[];g.enemies=[];
 for(let i=0;i<4;i++){
  Object.assign(g.player,{x:b.x+4,y:b.y+b.h+8,vy:-400,vx:0,grounded:false,coyote:0});advance(g,.08,{jump:true});
 }
 assert.equal(g.score,10);assert.equal(g.events.filter(e=>e.type==='bump').length,4);
});
test('enemy knockback always points away from the attacker, regardless of facing',()=>{
 for(const face of [-1,1])for(const side of [-1,1]){const g=boot();g.player.face=face;damage(g,false,g.player.x+12+side*40);assert.equal(Math.sign(g.player.vx),-side);assert.equal(g.player.grounded,false);}
});
test('airborne release preserves momentum; landing uses faster ground braking',()=>{
 const air=boot(),ground=boot();Object.assign(air.player,{y:220,vy:0,vx:200,grounded:false,coyote:0});ground.player.vx=200;
 advance(air,.1);advance(ground,.1);assert.ok(air.player.vx>175);assert.ok(Math.abs(ground.player.vx)<1e-8);
});
test('normal snow tiles have grip while blue ice tiles retain sliding',()=>{
 const snow=boot(3);snow.player.x=80;snow.player.vx=200;step(snow,1/120);assert.equal(snow.player.surface,'normal');advance(snow,.15);assert.equal(snow.player.vx,0);
 snow.player.x=352;snow.player.vx=200;step(snow,1/120);assert.equal(snow.player.surface,'ice');advance(snow,.15);assert.ok(snow.player.vx>100);
});
test('respawn freezes hazards and accepts no movement until the transition finishes',()=>{
 const g=boot();g.player.y=600;step(g,1/120);const x=g.player.x,time=g.time,enemies=g.enemies.map(e=>e.x);
 advance(g,.3,{right:true,jump:true});assert.equal(g.mode,'respawning');assert.equal(g.player.x,x);assert.equal(g.time,time);assert.deepEqual(g.enemies.map(e=>e.x),enemies);
 const remaining=g.transition;g.mode='paused';advance(g,1);assert.equal(g.transition,remaining);g.mode='respawning';advance(g,.26);
 assert.equal(g.mode,'playing');assert.equal(g.player.x,g.respawnX);assert.ok(g.player.invuln>1.9);
});
test('finish sequence walks into the home, grants one bonus, and can pause',()=>{
 const g=boot();g.player.x=g.flag.x;step(g,1/120);assert.equal(g.mode,'finishing');const bonus=g.score;
 advance(g,.5,{left:true,jump:true});assert.ok(g.player.x>g.flag.x);const t=g.finishTime;g.mode='paused';advance(g,.5);assert.equal(g.finishTime,t);
 g.mode='finishing';advance(g,1.2);assert.equal(g.mode,'won');assert.equal(g.score,bonus);assert.equal(g.player.x,g.flag.x+80);
});
test('practice world offers repeatable jumps with no life or completion penalty',()=>{
 const g=createPractice();g.mode='playing';assert.equal(g.enemies.length,0);assert.equal(g.stars.length,0);
 for(let i=0;i<5;i++){g.player.y=600;step(g,1/120);advance(g,.56);}assert.equal(g.hp,3);assert.equal(g.mode,'playing');assert.equal(g.score,0);
 g.player.x=g.flag.x;advance(g,.2);assert.equal(g.mode,'playing');
});
