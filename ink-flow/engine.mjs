export const W=1200,H=850;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function createGame(random=Math.random,width=W){
 const g={width,mode:'ready',time:180,score:0,absorbed:0,level:1,energy:100,cooldown:0,dash:0,hurt:0,combo:0,comboTime:0,health:100,random,player:{x:width/2,y:425,vx:0,vy:0,r:24},drops:[],effects:[],spawn:0};
 for(let i=0;i<72;i++)spawn(g,i<54?'food':'enemy');return g;
}
export function spawn(g,kind){let x,y;do{x=35+g.random()*(g.width-70);y=35+g.random()*(H-70)}while(Math.hypot(x-g.player.x,y-g.player.y)<130);g.drops.push({x,y,vx:(g.random()-.5)*24,vy:(g.random()-.5)*24,r:kind==='food'?4+g.random()*7:13+g.random()*13,kind,phase:g.random()*6.28});}
export function dash(g,input){if(g.mode!=='playing'||g.cooldown>0||g.energy<25)return false;const p=g.player;let dx=input.x-p.x,dy=input.y-p.y,d=Math.hypot(dx,dy);if(d<1){dx=1;dy=0;d=1}p.vx=dx/d*650;p.vy=dy/d*650;g.energy-=25;g.cooldown=3;g.dash=.32;return true}
export function step(g,dt,input){
 if(g.mode!=='playing')return;dt=clamp(dt,0,.04);g.time=Math.max(0,g.time-dt);if(!g.time){g.mode='ended';return}
 const p=g.player;g.cooldown=Math.max(0,g.cooldown-dt);g.dash=Math.max(0,g.dash-dt);g.hurt=Math.max(0,g.hurt-dt);g.comboTime-=dt;if(g.comboTime<=0)g.combo=0;
 const vortex=!!input.held&&g.energy>1;g.vortex=vortex;g.energy=clamp(g.energy+(vortex?-22:13)*dt,0,100);
 const dx=input.x-p.x,dy=input.y-p.y,d=Math.hypot(dx,dy),speed=(195-(g.level-1)*9)*(vortex?.65:1),force=1-Math.exp(-dt*5);
 if(!g.dash){p.vx+=(dx/(d||1)*Math.min(speed,d*3)-p.vx)*force;p.vy+=(dy/(d||1)*Math.min(speed,d*3)-p.vy)*force}
 p.x=clamp(p.x+p.vx*dt,p.r,g.width-p.r);p.y=clamp(p.y+p.vy*dt,p.r,H-p.r);
 for(let i=g.drops.length-1;i>=0;i--){const a=g.drops[i];let ax=p.x-a.x,ay=p.y-a.y,dist=Math.hypot(ax,ay)||.01;
 if(vortex&&dist<180+g.level*12){const pull=a.kind==='food'?500:110;a.vx+=(ax/dist*pull-ay/dist*230)*dt;a.vy+=(ay/dist*pull+ax/dist*230)*dt}
 a.vx+=(Math.sin(g.time*.6+a.phase)*13-a.vx*.5)*dt;a.vy+=(Math.cos(g.time*.5+a.phase)*13-a.vy*.5)*dt;
 a.x=clamp(a.x+a.vx*dt,a.r,g.width-a.r);a.y=clamp(a.y+a.vy*dt,a.r,H-a.r);
 if(dist<p.r+a.r*.65){
 if(a.kind==='food'){g.combo++;g.comboTime=2.5;g.score+=10+Math.min(g.combo,10)*2;g.absorbed++;g.level=Math.min(5,1+Math.floor(g.absorbed/15));p.r=24+(g.level-1)*6;g.health=clamp(g.health+1,0,100);g.effects.push({x:a.x,y:a.y,t:.5,kind:'food',text:g.combo>2?'×'+g.combo:''});g.drops.splice(i,1)}
 else if(g.dash){g.score+=35;g.effects.push({x:a.x,y:a.y,t:.6,kind:'enemy',text:'+35'});g.drops.splice(i,1)}
 else if(!g.hurt){g.health=Math.max(0,g.health-18);g.hurt=1.3;g.combo=0;a.vx=-ax/dist*240;a.vy=-ay/dist*240;g.effects.push({x:p.x,y:p.y,t:.7,kind:'enemy',text:'−18'});if(!g.health)g.mode='ended'}
 }
 }
 g.effects=g.effects.filter(e=>(e.t-=dt)>0);g.spawn-=dt;if(g.spawn<=0){g.spawn=.5;if(g.drops.filter(a=>a.kind==='food').length<58)spawn(g,'food');if(g.drops.filter(a=>a.kind==='enemy').length<18+g.level*2)spawn(g,'enemy')}
}
