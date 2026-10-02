import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, LEVELS, COVER, WEAPONS, blocked, segmentCircle, aimTarget, circleEntry } from '../null-sector/engine.mjs';
const tick = (g, seconds, input = {}) => { for (let i = 0; i < seconds * 60; i++) { g.update(1 / 60, input); g.events = []; } };
const empty = () => { const g = new Game(() => .5); g.start(); g.intermission = 1000; return g; };
test('movement is normalized; walls and cover cannot be crossed even while dashing', () => {
 const a = empty(), b = empty(); tick(a, .5, {x:1}); tick(b,.5,{x:1,z:1}); assert.ok(Math.abs(Math.hypot(a.player.x,a.player.z-3)-Math.hypot(b.player.x,b.player.z-3))<.01);
 const g = empty();g.player.x=-9;g.player.z=-2;g.dash(0,-1);tick(g,.2);assert.ok(g.player.z>-3.21);assert.ok(!blocked(g.player.x,g.player.z));
 g.player.x=18;g.player.z=0;tick(g,2,{x:1});assert.ok(g.player.x<=18.45);
});
test('reload replenishes only after duration; swapping cancels reload; ammo never negative',()=>{
 const g=empty();tick(g,1,{fire:true,angle:0});assert.ok(g.ammo[0]<30);g.reload();tick(g,.5);assert.ok(g.ammo[0]<30);g.switchWeapon(1);assert.equal(g.reloadTime,0);assert.equal(g.ammo[1],8);g.switchWeapon(0);g.reload();tick(g,1.5);assert.equal(g.ammo[0],30);
 tick(g,10,{fire:true,angle:0});assert.ok(g.ammo.every(a=>a>=0));
});
test('swept collision catches fast shots and cover blocks bullets',()=>{
 assert.ok(segmentCircle(-5,0,5,0,0,0,.2));assert.ok(!segmentCircle(-5,1,5,1,0,0,.2));
 const g=empty();g.enemies=[{id:1,kind:'chaser',x:0,z:0,hp:19,maxHp:19,radius:.55,speed:0,age:1,cooldown:10,flash:0}];g.player.z=3;tick(g,.1,{fire:true,angle:Math.PI});assert.equal(g.kills,1);assert.equal(g.score,100);
 const h=empty();h.player.x=-9;h.player.z=-2;h.enemies=[{id:1,kind:'chaser',x:-9,z:-8,hp:40,maxHp:40,radius:.55,speed:0,age:1,cooldown:10,flash:0}];tick(h,1,{fire:true,angle:Math.PI});assert.equal(h.enemies[0].hp,40);
});
test('dash and hit invulnerability, health clamps, death blocks further play',()=>{
 const g=empty();g.player.invulnerable=0;g.dash(1,0);g.hurt(100);assert.equal(g.player.hp,100);assert.equal(g.dash(1,0),false);tick(g,.4);g.hurt(10);g.hurt(10);assert.equal(g.player.hp,90);tick(g,.7);g.hurt(999);assert.equal(g.mode,'lost');assert.equal(g.player.hp,0);const time=g.time;tick(g,2);assert.equal(g.time,time);
});
test('waves offer exactly one upgrade, replenish ammo, finish after boss wave',()=>{
 const g=empty();g.intermission=0;g.wave=1;g.player.hp=40;g.ammo=[1,1];g.update(.02);assert.equal(g.mode,'upgrade');assert.equal(g.chooseUpgrade('wrong'),false);assert.ok(g.chooseUpgrade('armor'));assert.equal(g.player.maxHp,130);assert.equal(g.player.hp,130);assert.deepEqual(g.ammo,[30,8]);assert.equal(g.chooseUpgrade('damage'),false);tick(g,2.1);assert.equal(g.wave,2);assert.ok(g.pending.length+g.enemies.length>0);
 g.wave=5;g.pending=[];g.enemies=[];g.intermission=0;g.update(.02);assert.equal(g.mode,'cleared');
});
test('all enemy variants spawn within safe arena bounds; boss emits radial attacks',()=>{
 const g=empty();g.wave=5;for(const kind of ['chaser','gunner','brute','boss'])g.spawn(kind);assert.ok(g.enemies.every(e=>!blocked(e.x,e.z,e.radius)));
 const boss=g.enemies.find(e=>e.kind==='boss');g.enemies=[boss];boss.x=0;boss.z=-3;boss.age=1;boss.cooldown=0;g.update(.02);assert.equal(g.bullets.filter(b=>b.enemy).length,14);
});
test('paused simulation freezes every combat timer and restart clears run state',()=>{
 const g=empty();g.reload();g.dash(1,0);g.mode='paused';g.events=[];const state=JSON.stringify(g);tick(g,1,{fire:true,x:1});assert.equal(JSON.stringify(g),state);g.start();assert.equal(g.mode,'playing');assert.equal(g.wave,0);assert.equal(g.player.dashCooldown,0);assert.deepEqual(g.ammo,WEAPONS.map(w=>w.magazine));
});
test('repair pickups restore health and are consumed once',()=>{
 const g=empty();g.player.hp=50;g.pickups=[{id:1,x:0,z:3,life:5}];g.update(.02);assert.equal(g.player.hp,72);assert.equal(g.pickups.length,0);g.update(.02);assert.equal(g.player.hp,72);
});
test('a lethal boss hit completes the fifth wave with points and a single end event',()=>{
 const g=empty();g.wave=5;g.intermission=0;g.player.z=3;g.spawn('boss');const boss=g.enemies[0];boss.x=0;boss.z=0;boss.age=1;boss.hp=19;boss.speed=0;boss.cooldown=99;
 for(let i=0;i<20&&g.mode==='playing';i++)g.update(1/60,{fire:true,angle:Math.PI});
 assert.equal(g.mode,'cleared');assert.equal(g.kills,1);assert.equal(g.score,2000);assert.equal(g.events.filter(e=>e.type==='end').length,1);
});

test('campaign transitions preserve upgrades and score, reset combat, and end only in final sector',()=>{
 const g=empty();g.player.damage=2;g.player.maxHp=160;g.player.hp=12;g.score=4500;
 for(let level=0;level<LEVELS.length;level++){
   g.wave=5;g.intermission=0;g.enemies=[];g.pending=[];g.bullets=[];g.update(.02);
   assert.equal(g.mode,level===LEVELS.length-1?'won':'cleared');
   const state=JSON.stringify(g);g.update(.02,{fire:true,x:1});assert.equal(JSON.stringify(g),state);
   if(level<LEVELS.length-1){assert.ok(g.nextLevel());assert.equal(g.levelIndex,level+1);assert.equal(g.player.damage,2);assert.equal(g.score,4500);assert.equal(g.player.hp,160);assert.equal(g.wave,0);assert.deepEqual(g.ammo,[30,8]);assert.equal(g.nextLevel(),false);}
 }
 assert.equal(g.nextLevel(),false);
});
test('direct deployment is balanced, invalid selections are safe, and previews cannot interrupt play',()=>{
 const g=new Game();g.preview(2);assert.equal(g.mode,'ready');assert.equal(g.levelIndex,2);g.start(3);assert.equal(g.player.maxHp,190);assert.ok(g.player.damage>1);g.preview(0);assert.equal(g.levelIndex,3);g.start(-1);assert.equal(g.levelIndex,0);g.start(999);assert.equal(g.levelIndex,LEVELS.length-1);g.start(NaN);assert.equal(g.levelIndex,0);
});
test('every map has clear deployment and perimeter spawn positions for every enemy type',()=>{
 let seed=7382;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let level=0;level<LEVELS.length;level++){
   const g=new Game(random);g.start(level);assert.ok(!blocked(0,3,.55,g.cover));
   for(let i=0;i<160;i++)g.spawn(['chaser','gunner','brute','boss'][i%4]);
   assert.ok(g.enemies.every(e=>!blocked(e.x,e.z,e.radius,g.cover)),LEVELS[level].name);
   const c=g.cover[0];assert.ok(blocked(c.x,c.z,.55,g.cover));g.player.x=c.x;g.player.z=c.z+c.d/2+1;g.dash(0,-1);tick(g,.2);assert.ok(!blocked(g.player.x,g.player.z,.55,g.cover));
 }
});
test('new cover layouts block projectiles, while an empty lane allows hits',()=>{
 const g=new Game(()=>.5);g.start(3);g.intermission=1000;g.player.x=3;g.player.z=0;
 g.enemies=[{id:1,kind:'chaser',x:10,z:0,hp:100,maxHp:100,radius:.55,speed:0,age:1,cooldown:10,flash:0}];tick(g,.6,{fire:true,angle:Math.PI/2});assert.equal(g.enemies[0].hp,100);
 g.player.z=4;g.enemies[0].z=4;tick(g,.6,{fire:true,angle:Math.PI/2});assert.ok(!g.enemies.length||g.enemies[0].hp<100);
});
test('each boss uses its sector attack, including faster rotating and aimed fan patterns',()=>{
 const counts=[14,7,9,18,7,9];
 for(let level=0;level<LEVELS.length;level++){
   const g=new Game(()=>.5);g.start(level);g.intermission=1000;g.wave=5;g.spawn('boss');const b=g.enemies[0];Object.assign(b,{x:0,z:-3,age:1,cooldown:0});g.update(.02);
   assert.equal(g.bullets.length,counts[level]);assert.equal(b.volley,1);
   if(level===1)assert.ok(g.bullets.every(shot=>shot.vz>0));
   if(level===2)assert.ok(b.cooldown<1);
 }
});
test('campaign mobility remains bounded after repeated upgrades',()=>{
 const g=empty();for(let i=0;i<30;i++){g.mode='upgrade';g.chooseUpgrade('agility');}
 assert.ok(g.player.speed<=10);assert.ok(g.player.dashMax>=.8);
});

test('auto aim ignores occluded, spawning, dead and out of range targets',()=>{
 const p={x:0,z:0}, targets=[{id:1,x:3,z:0,hp:10,age:2},{id:2,x:0,z:5,hp:10,age:2},{id:3,x:0,z:1,hp:10,age:.2},{id:4,x:0,z:2,hp:0,age:2}];
 assert.equal(aimTarget(p,targets,[{x:1.5,z:0,w:.5,d:2}]).id,2);assert.equal(aimTarget(p,targets,[{x:1.5,z:0,w:.5,d:2}],4),null);
});
test('a target before a wall is hit even when a bullet crosses both in one frame',()=>{
 const g=empty();g.player.x=-9;g.player.z=-2.5;
 g.enemies=[{id:1,kind:'chaser',x:-9,z:-3,hp:19,maxHp:19,radius:.2,speed:0,age:1,cooldown:99,flash:0}];
 g.bullets=[{id:2,x:-9,z:-2.5,vx:0,vz:-60,damage:19,enemy:false,life:1}];g.update(.04);assert.equal(g.kills,1);
});
test('shots originate before cover, never beyond the barrel obstruction',()=>{
 const g=empty();g.player.x=-9;g.player.z=-3.19;g.player.angle=Math.PI;g.fire();assert.equal(g.bullets[0].z,g.player.z);g.update(.04);assert.equal(g.bullets.length,0);
});
test('nearest collision uses target surface rather than target centre',()=>{
 assert.ok(circleEntry(0,0,10,0,6,0,3)<circleEntry(0,0,10,0,4,0,.1));
 const g=empty();g.bullets=[{id:3,x:0,z:0,vx:250,vz:0,damage:19,enemy:false,life:1}];
 g.enemies=[{id:1,kind:'chaser',x:4,z:0,hp:40,maxHp:40,radius:.1,speed:0,age:1,cooldown:99,flash:0},{id:2,kind:'boss',x:6,z:0,hp:40,maxHp:40,radius:3,speed:0,age:1,cooldown:99,flash:0}];g.update(.04);assert.equal(g.enemies[0].hp,40);assert.equal(g.enemies[1].hp,21);
});
test('invalid weapon selection and fire while paused cannot change combat state',()=>{
 const g=empty();g.switchWeapon(-1);g.switchWeapon(12);g.switchWeapon(1.5);assert.equal(g.weapon,0);g.mode='paused';g.fire();assert.equal(g.ammo[0],30);assert.equal(g.bullets.length,0);
});
test('storm boss alternates aimed fan and radial volleys',()=>{
 const g=empty();g.start(4);g.intermission=1000;g.spawn('boss');Object.assign(g.enemies[0],{x:0,z:-3,age:1,cooldown:0,speed:0});g.update(.02);assert.equal(g.bullets.length,7);g.bullets=[];g.enemies[0].cooldown=0;g.update(.02);assert.equal(g.bullets.length,16);
});

test('humanoid specialists use distinct attacks and all maps have safe spawns', () => {
 for (let level=0; level<LEVELS.length; level++) for (const kind of ['assault','sniper','raider']) {
  const g=empty();g.start(level);g.spawn(kind);const e=g.enemies[0];assert.ok(!blocked(e.x,e.z,e.radius,g.cover));
 }
 for(const [kind,count,speed] of [['assault',3,10],['sniper',1,19],['raider',0,0]]) {
  const g=empty();g.spawn(kind);const e=g.enemies[0];Object.assign(e,{x:0,z:0,age:1,cooldown:0});
  g.update(1/60,{});assert.equal(g.bullets.length,count);
  if(count) assert.ok(Math.abs(Math.hypot(g.bullets[0].vx,g.bullets[0].vz)-speed)<.001);
  else assert.ok(e.z>0,'raider closes distance');
 }
});
test('specialists cannot fire through cover and appear in later campaign rosters',()=>{
 for(const kind of ['assault','sniper']) {
  const g=empty();g.player.x=-9;g.player.z=-2;g.spawn(kind);Object.assign(g.enemies[0],{x:-9,z:-8,age:1,cooldown:0});g.update(1/60,{});assert.equal(g.bullets.length,0);
 }
 for(const kind of ['assault','sniper','raider']) assert.ok(LEVELS.slice(1).some(l=>l.roster.includes(kind)));
});
