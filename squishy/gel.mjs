import {SoftBody} from './physics.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

// Reduced-order viscoelastic material + a local spring lattice. A determinant-one
// squeeze tensor makes the displaced volume bulge out in the free directions.
// All surfaces (including the face) share this same continuous deformation map.
export class GelBody extends SoftBody {
 constructor(){super();this.strain=0;this.strainVelocity=0;this.axis=[0,1,0];this.pull=[0,0,0];this.pullVelocity=[0,0,0];this.grabPoint=[0,2,1];this.handles=new Map();this.twist=0;this.twistVelocity=0;this.wobble=0;this.wobbleVelocity=0;}
 reset(){super.reset();this.strain=0;this.strainVelocity=0;this.axis=[0,1,0];this.pull=[0,0,0];this.pullVelocity=[0,0,0];this.grabPoint=[0,2,1];this.handles.clear();this.twist=0;this.twistVelocity=0;this.wobble=0;this.wobbleVelocity=0;}
 poke(point=[0,2,.8],strength=.7){
  this.strainVelocity+=2.4*strength;
  for(let i=0;i<this.v.length;i+=3){const w=Math.exp(-((this.rest[i]-point[0])**2+(this.rest[i+1]-point[1])**2+(this.rest[i+2]-point[2])**2)/.5);this.v[i+2]-=w*strength*2;}
 }
 step(dt){
  const c=this.contact,k=78-48*this.softness,damping=6.4+2.8*this.softness;
  const active=c&&c.amount!==undefined,goal=active?(c.kind==='stretch'?c.amount*.1:c.amount):0;
  this.twistVelocity+=(((c?.twist||0)-this.twist)*k-this.twistVelocity*damping)*dt;
  this.twist=clamp(this.twist+this.twistVelocity*dt,-1.7,1.7);
  this.wobbleVelocity+=(-this.wobble*48-this.wobbleVelocity*6)*dt;
  this.wobble=clamp(this.wobble+this.wobbleVelocity*dt,-.55,.55);
  const targets=new Map((c?.handles||[]).map(h=>[h.id,h]));
  for(const h of targets.values())if(!this.handles.has(h.id))this.handles.set(h.id,{point:h.point.slice(),pull:[0,0,0],velocity:[0,0,0],pressure:0,pressureVelocity:0});
  for(const [id,h] of this.handles){
   const target=targets.get(id);
   for(let a=0;a<3;a++){h.velocity[a]+=(((target?.pull[a]||0)-h.pull[a])*k-h.velocity[a]*damping)*dt;h.pull[a]=clamp(h.pull[a]+h.velocity[a]*dt,-2.5,2.5);}
   h.pressureVelocity+=(((target?.amount||0)-h.pressure)*k-h.pressureVelocity*damping)*dt;h.pressure=clamp(h.pressure+h.pressureVelocity*dt,0,1);
   if(!target&&Math.hypot(...h.pull)<.002&&Math.hypot(...h.velocity)<.01&&h.pressure<.002)this.handles.delete(id);
  }
  this.strainVelocity+=((goal-this.strain)*k-this.strainVelocity*damping)*dt;
  this.strain=clamp(this.strain+this.strainVelocity*dt,-.16,1.05);
  if(active){
   const axis=c.axis||[0,1,0],blend=1-Math.exp(-18*dt);
   for(let a=0;a<3;a++){this.axis[a]+=(axis[a]-this.axis[a])*blend;this.grabPoint[a]+=(c.point[a]-this.grabPoint[a])*blend;}
   const length=Math.hypot(...this.axis)||1;this.axis=this.axis.map(v=>v/length);
  }
  for(let a=0;a<3;a++){
   const target=active?(c.pull?.[a]||0)*(c.kind==='stretch'?1:.68):0;
   this.pullVelocity[a]+=((target-this.pull[a])*k-this.pullVelocity[a]*damping)*dt;
   this.pull[a]=clamp(this.pull[a]+this.pullVelocity[a]*dt,-2.8,2.8);
  }
  // Keep small finger dents, but let the material tensor handle large compression.
  this.contact=active?{...c,delta:c.delta.map(v=>v*.24),pressure:c.pressure*.24}:c;
  super.step(dt);this.contact=c;
 }
 map(x,y,z,binding,out){
  this.displacement(binding,out);x+=out[0];y+=out[1];z+=out[2];
  const cx=x,cy=y-1.6,cz=z,axis=this.axis;
  const along=clamp(1-.65*this.strain,.32,1.15),side=1/Math.sqrt(along);
  const projection=cx*axis[0]+cy*axis[1]+cz*axis[2],difference=along-side;
  let xx=cx*side+difference*projection*axis[0];
  let yy=1.6+cy*side+difference*projection*axis[1];
  let zz=cz*side+difference*projection*axis[2];
  // Support by the table: a squeeze does not levitate the entire toy.
  yy+=1.6*(side+difference*axis[1]*axis[1]-1);
  const pullLength=Math.hypot(...this.pull),dx=x-this.grabPoint[0],dy=y-this.grabPoint[1],dz=z-this.grabPoint[2];
  const weight=Math.exp(-(dx*dx+dy*dy+dz*dz)/2.8),root=clamp(y/.65,0,1);
  if(pullLength>.00001){
   const nx=this.pull[0]/pullLength,ny=this.pull[1]/pullLength,nz=this.pull[2]/pullLength;
   // Local elongation and necking follow the grab, with the feet still supported.
   const extension=1+pullLength*.32*weight,neck=1/Math.sqrt(extension);
   const localX=xx,localY=yy-.2,localZ=zz,parallel=localX*nx+localY*ny+localZ*nz;
   xx+=(localX*(neck-1)+parallel*(extension-neck)*nx)*root;
   yy+=(localY*(neck-1)+parallel*(extension-neck)*ny)*root;
   zz+=(localZ*(neck-1)+parallel*(extension-neck)*nz)*root;
   xx+=this.pull[0]*weight*.8*root;yy+=this.pull[1]*weight*.8*root;zz+=this.pull[2]*weight*.8*root;
  }
  // Independent local pulls remain distinct even when their vector sum is zero.
  let localX=0,localY=0,localZ=0,totalWeight=0;
  for(const h of this.handles.values()){
   const distance=(x-h.point[0])**2+(y-h.point[1])**2+(z-h.point[2])**2;
   const w=Math.exp(-distance/1.05),anchor=clamp(y/.5,0,1);
   totalWeight+=w;localX+=h.pull[0]*w*anchor*1.35;localY+=h.pull[1]*w*anchor*1.35;localZ+=(h.pull[2]-.2*h.pressure)*w*anchor;
  }
  const overlap=Math.max(1,totalWeight*.7);xx+=localX/overlap;yy+=localY/overlap;zz+=localZ/overlap;
  const angle=this.twist*clamp((y-.15)/2.8,0,1),cos=Math.cos(angle),sin=Math.sin(angle);
  const twistedX=xx*cos+zz*sin;zz=zz*cos-xx*sin;xx=twistedX;
  xx+=this.wobble*Math.sin(y*1.1)*clamp(y/.5,0,1);
  out[0]=xx;out[1]=Math.max(.04,yy);out[2]=zz;return out;
 }
 get materialState(){return {strain:this.strain,pull:Math.max(Math.hypot(...this.pull),...Array.from(this.handles.values(),h=>Math.hypot(...h.pull))),handles:this.handles.size,twist:this.twist,wobble:this.wobble,compressionDeterminant:1};}
}
