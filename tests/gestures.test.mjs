import test from 'node:test';
import assert from 'node:assert/strict';
import {GripSet,ShapeChallenge} from '../squishy/gestures.mjs';
import {GelBody} from '../squishy/gel.mjs';
const event=pressure=>({pointerType:'touch',pressure});
const data=(x,y)=>({x,y,startX:x,startY:y,time:0,point:[x/100,y/100,.8]});
const advance=(s,n)=>{for(let i=0;i<n;i++)s.step(1/120);};
test('five contacts retain independent pressure, anchors and displacement',()=>{
 const grips=new GripSet();for(let i=0;i<5;i++)grips.start(i,data(i*30,150),event(.1+i*.18));
 assert.equal(grips.start(9,data(0,0),event(.5)),null);
 for(let i=0;i<120;i++)grips.sample(1/120,i/120,1);
 const forces=[...grips.contacts.values()].map(g=>g.force);assert.ok(forces[4]>forces[0]*6);
 grips.move(3,{...event(.7),clientX:120,clientY:90});assert.equal(grips.contacts.get(3).y,90);assert.equal(grips.contacts.get(2).y,150);
});
test('lifting the first contact preserves the others and their pair baselines',()=>{
 const grips=new GripSet();for(let i=0;i<4;i++)grips.start(i,data(i*30,150),event(.5));
 grips.contacts.get(2).delta=[.4,.8,0];grips.end(0);
 assert.equal(grips.contacts.size,3);assert.deepEqual(grips.contacts.get(2).delta,[.4,.8,0]);assert.equal(grips.pairs.size,3);
 grips.end(2);assert.equal(grips.contacts.size,2);grips.clear();assert.equal(grips.pairs.size,0);
});
test('two-finger rotation and pinch report separate twist and squeeze',()=>{
 const g=new GripSet();g.start(1,data(100,100),event(.5));g.start(2,data(200,100),event(.5));
 g.move(2,{...event(.5),clientX:160,clientY:100});const pinched=g.sample(1/60,1,1);assert.ok(pinched.compression>.35);assert.equal(pinched.twist,0);
 g.move(2,{...event(.5),clientX:130,clientY:50});const twisted=g.sample(1/60,1,1);assert.ok(twisted.twist>.9);
});
test('opposing pulls deform both sides instead of cancelling into a zero average',()=>{
 const s=new GelBody(),left=[-.8,2,.7],right=[.8,2,.7];
 const map=xyz=>s.map(...xyz,s.bind(...xyz),[0,0,0]);
 s.contact={kind:'stretch',amount:.1,point:[0,2,.8],axis:[0,1,0],pull:[0,0,0],delta:[0,0,0],radius:1,pressure:0,handles:[{id:1,point:left,pull:[-.8,.1,0],amount:.5},{id:2,point:right,pull:[.8,.1,0],amount:.5}]};advance(s,180);
 assert.ok(map(left)[0]<-1.3);assert.ok(map(right)[0]>1.3);
 s.contact.handles=s.contact.handles.slice(1);advance(s,360);assert.ok(map(right)[0]>1.3,'remaining finger must keep pulling');
 s.contact=null;advance(s,720);assert.equal(s.handles.size,0);assert.ok(Math.abs(map(right)[0]-.8)<.005);
});
test('tap, shake and twist have nonzero, recoverable physical responses',()=>{
 const s=new GelBody();s.poke([0,2,.8],.9);s.wobbleVelocity=3;advance(s,15);assert.ok(s.strain>.04);assert.ok(Math.abs(s.wobble)>.02);
 s.contact={kind:'knead',amount:.1,point:[0,2,.8],delta:[0,0,0],pressure:0,radius:1,twist:1.1};advance(s,180);assert.ok(s.twist>.9);
 s.contact=null;advance(s,720);assert.ok(Math.abs(s.twist)<.001);assert.ok(Math.abs(s.wobble)<.001);s.reset();assert.equal(s.handles.size,0);
});
test('challenge advances only after each distinct shape is held and can be restarted',()=>{
 const c=new ShapeChallenge();c.start();
 for(let i=0;i<30;i++)c.update({height:3,pull:0,twist:0},1/60);assert.equal(c.step,0);
 for(const shape of [{height:1.2,pull:0,twist:0},{height:3,pull:1,twist:0},{height:3,pull:0,twist:.8}])for(let i=0;i<20;i++)c.update(shape,1/60);
 assert.equal(c.complete,true);assert.equal(c.active,false);c.start();assert.equal(c.step,0);assert.equal(c.complete,false);
});
