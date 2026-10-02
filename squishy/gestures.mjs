import {PressureInput} from './pressure.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pairKey=(a,b)=>JSON.stringify([a,b]);

// Every finger owns its grab anchor, drag plane, and pressure history. Pair
// baselines survive unrelated fingers entering or leaving the gesture.
export class GripSet {
 constructor(limit=5){this.limit=limit;this.contacts=new Map();this.pairs=new Map();}
 start(id,data,event){
  if(this.contacts.size>=this.limit||this.contacts.has(id))return null;
  const pressure=new PressureInput();pressure.begin(event);
  const grip={...data,id,pressure,delta:[0,0,0],travel:0,force:0};
  for(const other of this.contacts.values()){
   const dx=grip.x-other.x,dy=other.y-grip.y;
   this.pairs.set(pairKey(other.id,id),{a:other.id,b:id,distance:Math.max(35,Math.hypot(dx,dy)),angle:Math.atan2(dy,dx),twist:0});
  }
  this.contacts.set(id,grip);return grip;
 }
 move(id,event){
  const g=this.contacts.get(id);if(!g)return null;
  g.x=event.clientX;g.y=event.clientY;g.travel=Math.max(g.travel,Math.hypot(g.x-g.startX,g.y-g.startY));g.pressure.observe(event);
  return g;
 }
 end(id){
  const grip=this.contacts.get(id);this.contacts.delete(id);
  for(const [key,pair] of this.pairs)if(pair.a===id||pair.b===id)this.pairs.delete(key);
  return grip;
 }
 clear(){this.contacts.clear();this.pairs.clear();}
 sample(dt,time,gain){
  const points=[...this.contacts.values()];let force=0,compression=0,twist=0,axis=[0,1],weight=0;
  for(const g of points){g.force=g.pressure.update({dt,held:time-g.time,gain});force+=g.force;}
  for(const pair of this.pairs.values()){
   const a=this.contacts.get(pair.a),b=this.contacts.get(pair.b),dx=b.x-a.x,dy=a.y-b.y,distance=Math.hypot(dx,dy);
   if(distance<12)continue;
   const angle=Math.atan2(dy,dx),change=Math.atan2(Math.sin(angle-pair.angle),Math.cos(angle-pair.angle));
   pair.twist=clamp(pair.twist+change,-1.5,1.5);pair.angle=angle;
   const squeeze=clamp((pair.distance-distance)/pair.distance,-.8,.8);
   compression+=squeeze;twist+=pair.twist;weight++;
   if(weight===1)axis=[dx/distance,dy/distance];
  }
  return {points,force:force/Math.max(1,points.length),compression:compression/Math.max(1,weight),twist:twist/Math.max(1,weight),axis};
 }
}

export class ShapeChallenge {
 constructor(){this.reset();}
 reset(){this.active=false;this.step=0;this.held=0;this.complete=false;}
 start(){this.reset();this.active=true;}
 update({height,pull,twist},dt){
  if(!this.active)return null;
  const reached=[height<1.75,pull>.85,Math.abs(twist)>.48][this.step];
  this.held=reached?this.held+dt:0;
  if(this.held<.32)return null;
  this.step++;this.held=0;
  if(this.step===3){this.active=false;this.complete=true;return 'complete';}
  return 'step';
 }
}
