// A volumetric position-based spring lattice. Visible meshes use trilinear skinning.
export class SoftBody {
 constructor(){
  this.dims=[9,11,7];this.min=[-1.6,-.2,-1.25];this.max=[1.6,3.6,1.55];
  this.n=9*11*7;this.rest=new Float32Array(this.n*3);this.p=new Float32Array(this.n*3);this.v=new Float32Array(this.n*3);this.old=new Float32Array(this.n*3);this.edges=[];this.softness=.65;
  const id=(x,y,z)=>(x+9*(y+11*z))*3;
  for(let z=0;z<7;z++)for(let y=0;y<11;y++)for(let x=0;x<9;x++){
   const i=id(x,y,z);for(let a=0;a<3;a++)this.rest[i+a]=this.min[a]+[x,y,z][a]/(this.dims[a]-1)*(this.max[a]-this.min[a]);
   for(const [dx,dy,dz] of [[1,0,0],[0,1,0],[0,0,1],[1,1,0],[-1,1,0],[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1],[-1,1,1],[1,-1,1],[-1,-1,1]]){
    if(x+dx<0||x+dx>=9||y+dy<0||y+dy>=11||z+dz>=7||z+dz<0)continue;
    const j=id(x+dx,y+dy,z+dz),length=Math.hypot(dx*3.2/8,dy*3.8/10,dz*2.8/6);this.edges.push([i,j,length]);
   }
  }this.p.set(this.rest);this.contact=null;
 }
 reset(){this.p.set(this.rest);this.v.fill(0);this.contact=null;}
 bind(x,y,z){
  const q=[x,y,z].map((v,a)=>Math.max(0,Math.min(this.dims[a]-1.00001,(v-this.min[a])/(this.max[a]-this.min[a])*(this.dims[a]-1))));
  const b=q.map(Math.floor),f=q.map((v,a)=>v-b[a]),ids=[],weights=[];
  for(let z=0;z<2;z++)for(let y=0;y<2;y++)for(let x=0;x<2;x++){ids.push(((b[0]+x)+9*((b[1]+y)+11*(b[2]+z)))*3);weights.push((x?f[0]:1-f[0])*(y?f[1]:1-f[1])*(z?f[2]:1-f[2]));}
  return {ids,weights};
 }
 displacement(binding,out){out[0]=out[1]=out[2]=0;for(let k=0;k<8;k++){const i=binding.ids[k],w=binding.weights[k];for(let a=0;a<3;a++)out[a]+=(this.p[i+a]-this.rest[i+a])*w;}return out;}
 step(dt){
  dt=Math.min(dt,1/60);const p=this.p,r=this.rest,v=this.v,c=this.contact;this.old.set(p);
  const spring=22-16*this.softness,damp=Math.exp(-(4.5+this.softness*2)*dt);
  for(let i=0;i<p.length;i++){v[i]=(v[i]+(r[i]-p[i])*spring*dt)*damp;p[i]+=v[i]*dt;}
  for(let iteration=0;iteration<3;iteration++){
   // Structural and diagonal constraints resist tearing and propagate pressure in 3D.
   for(const [i,j,l] of this.edges){const dx=p[j]-p[i],dy=p[j+1]-p[i+1],dz=p[j+2]-p[i+2],d=Math.hypot(dx,dy,dz)||1;const s=(d-l)/d*.095;
    p[i]+=dx*s;p[i+1]+=dy*s;p[i+2]+=dz*s;p[j]-=dx*s;p[j+1]-=dy*s;p[j+2]-=dz*s;
   }
   if(c){
    for(let i=0;i<p.length;i+=3){
     const dx=r[i]-c.point[0],dy=r[i+1]-c.point[1],dz=r[i+2]-c.point[2];const d2=dx*dx+dy*dy+dz*dz;
     const w=Math.exp(-d2/(c.radius*c.radius)),halo=Math.exp(-d2/(c.radius*c.radius*2.8));
     // A broader lateral bulge compensates a narrow indentation, like filled foam.
     const bulge=c.pressure*.3*halo;
     const target=[r[i]+c.delta[0]*w+dx*bulge,r[i+1]+c.delta[1]*w+dy*bulge,r[i+2]+c.delta[2]*w];
     const strength=.16*w;
     for(let a=0;a<3;a++)p[i+a]+=(target[a]-p[i+a])*strength;
    }
   }
  }
  for(let i=0;i<p.length;i++){p[i]=Math.max(r[i]-1.2,Math.min(r[i]+1.2,p[i]));v[i]=Math.max(-5,Math.min(5,(p[i]-this.old[i])/dt));}
 }
 get deformation(){let sum=0;for(let i=0;i<this.p.length;i++)sum+=(this.p[i]-this.rest[i])**2;return Math.sqrt(sum/this.n);}
}
