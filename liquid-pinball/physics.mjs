export const W=600,H=900;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const bumpers=[{x:188,y:295,r:39},{x:412,y:295,r:39},{x:300,y:432,r:46}];
export const rails=[[52,100,52,650],[548,100,548,650],[52,100,115,60],[115,60,485,60],[485,60,548,100],[52,650,143,738],[548,650,457,738],[102,552,175,643],[498,552,425,643],[246,150,246,194],[354,150,354,194]];
export function water(x,y,vx=0,vy=0,r=21){return {x,y,vx,vy,r,squash:0,angle:0,hit:0,age:0,trail:[]}}
export function createGame(){return {mode:'ready',balls:[],score:0,stock:5,cups:0,hits:0,combo:0,comboTime:0,jet:0,time:0,effects:[],flippers:[{x:151,y:746,a:.30,omega:0,side:1},{x:449,y:746,a:Math.PI-.30,omega:0,side:-1}],bumperFlash:[0,0,0]}}
export function launch(g){if(g.mode!=='playing'||g.balls.length||g.stock<=0)return false;g.stock--;const b=water(523,790,0,-1080);b.launching=true;g.balls.push(b);return true}
export function jet(g){if(g.mode!=='playing'||g.jet>0||!g.balls.some(b=>!b.launching))return false;g.jet=7;for(const b of g.balls){if(b.launching)continue;b.vy=-Math.max(680,Math.abs(b.vy)*.8);b.vx+=(300-b.x)*1.1}g.effects.push({x:300,y:720,t:1,type:'jet',text:'上升喷流'});return true}
function burst(g,b,color,text=''){g.effects.push({x:b.x,y:b.y,t:.6,type:'splash',color,text,seed:g.time*12});}
function segment(b,x1,y1,x2,y2,radius,restitution,svx=0,svy=0){const dx=x2-x1,dy=y2-y1,t=clamp(((b.x-x1)*dx+(b.y-y1)*dy)/(dx*dx+dy*dy),0,1),x=x1+t*dx,y=y1+t*dy;let nx=b.x-x,ny=b.y-y,d=Math.hypot(nx,ny);if(d>=b.r+radius)return false;if(d<.001){nx=0;ny=-1;d=1}else{nx/=d;ny/=d}b.x=x+nx*(b.r+radius+.1);b.y=y+ny*(b.r+radius+.1);const vn=(b.vx-svx)*nx+(b.vy-svy)*ny;if(vn<0){b.vx-=(1+restitution)*vn*nx;b.vy-=(1+restitution)*vn*ny;b.squash=Math.min(.45,-vn/2000);b.angle=Math.atan2(ny,nx);return true}return false}
export function step(g,dt,input={}){
 if(g.mode!=='playing')return;dt=clamp(dt,0,.05);const count=Math.ceil(dt/(1/180));if(!count)return;const h=dt/count;
 g.time+=dt;g.jet=Math.max(0,g.jet-dt);g.comboTime-=dt;if(g.comboTime<=0)g.combo=0;g.effects=g.effects.filter(e=>(e.t-=dt)>0);g.bumperFlash=g.bumperFlash.map(t=>Math.max(0,t-dt));
 for(let n=0;n<count;n++){
 for(let i=0;i<2;i++){const f=g.flippers[i],held=i===0?input.left:input.right,target=i===0?(held?-.43:.30):(held?Math.PI+.43:Math.PI-.30),old=f.a;f.a+=(target-f.a)*(1-Math.exp(-h*24));f.omega=(f.a-old)/h}
 for(let j=g.balls.length-1;j>=0;j--){const b=g.balls[j];b.age+=h;b.hit=Math.max(0,b.hit-h);b.vy+=610*h;b.vx*=Math.exp(-h*.035);b.x+=b.vx*h;b.y+=b.vy*h;b.squash*=Math.exp(-h*7);
 if(b.launching){b.x=523;if(b.y>180)continue;b.launching=false;b.x=510;b.vx=-160;b.vy=-340;}
 if(b.y>H+45){g.balls.splice(j,1);g.combo=0;continue}
 // Capture only droplets falling through the open mouth of the cup.
 if(b.x>258+b.r*.3&&b.x<342-b.r*.3&&b.y>150&&b.y<192&&b.vy>0){g.score+=500;g.cups++;burst(g,b,'#dd9d43','入杯 +500');g.balls.splice(j,1);continue}
 for(const a of rails)segment(b,...a,5,.76);
 for(let k=0;k<bumpers.length;k++){const a=bumpers[k],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;if(d<a.r+b.r){const nx=dx/d,ny=dy/d;const vn=b.vx*nx+b.vy*ny;b.x=a.x+nx*(a.r+b.r+1);b.y=a.y+ny*(a.r+b.r+1);if(vn<0){const boost=Math.max(390,-vn*1.10);b.vx+=(boost-vn)*nx;b.vy+=(boost-vn)*ny;b.squash=.45;b.angle=Math.atan2(ny,nx);if(b.hit<=0){g.combo++;g.comboTime=3;const pts=50*Math.min(g.combo,5);g.score+=pts;g.hits++;g.bumperFlash[k]=.32;burst(g,b,'#63bec2','+'+pts);b.hit=.18;
 if(b.r>19&&g.balls.length<5){const r=b.r/Math.SQRT2;b.r=r;const child=water(b.x-ny*r*1.1,b.y+nx*r*1.1,b.vx-ny*100,b.vy+nx*100,r);b.x+=ny*r*1.1;b.y-=nx*r*1.1;b.vx+=ny*100;b.vy-=nx*100;child.hit=.25;g.balls.push(child)}
 }}}}
 for(const f of g.flippers){const dx=Math.cos(f.a)*128,dy=Math.sin(f.a)*128,t=clamp(((b.x-f.x)*dx+(b.y-f.y)*dy)/(128*128),0,1),svx=-dy*t*f.omega,svy=dx*t*f.omega;if(segment(b,f.x,f.y,f.x+dx,f.y+dy,11,.65,svx,svy)&&Math.abs(f.omega)>2){b.vy=Math.min(b.vy,-640-t*300);b.vx+=f.side*(130+t*70);burst(g,b,'#63bec2')}}
 const speed=Math.hypot(b.vx,b.vy);if(speed>1350){b.vx*=1350/speed;b.vy*=1350/speed}
 }
 // Surface tension reunites slow droplets while keeping their combined area.
 for(let i=0;i<g.balls.length;i++)for(let j=g.balls.length-1;j>i;j--){const a=g.balls[i],b=g.balls[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(a.age>.4&&b.age>.4&&d<a.r+b.r&&Math.hypot(a.vx-b.vx,a.vy-b.vy)<220){const aa=a.r*a.r,bb=b.r*b.r,total=aa+bb;a.x=(a.x*aa+b.x*bb)/total;a.y=(a.y*aa+b.y*bb)/total;a.vx=(a.vx*aa+b.vx*bb)/total;a.vy=(a.vy*aa+b.vy*bb)/total;a.r=Math.sqrt(total);a.squash=.3;g.balls.splice(j,1)}}
 }
 for(const b of g.balls){const speed=Math.hypot(b.vx,b.vy);if(speed>1350){b.vx*=1350/speed;b.vy*=1350/speed}b.trail.unshift({x:b.x,y:b.y});if(b.trail.length>12)b.trail.pop()}
 if(!g.balls.length&&g.stock===0)g.mode='ended';
}
