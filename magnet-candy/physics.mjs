export const W=720,H=820;
export const colors=['#e78777','#80ac90','#af9bc8'];
export const jars=[{x:120,color:0,label:'桃桃',symbol:'○'},{x:360,color:1,label:'青苹果',symbol:'◇'},{x:600,color:2,label:'葡萄',symbol:'△'}];
export function createGame(){return {mode:'ready',balls:[],particles:[],score:0,caught:0,misses:0,combo:0,time:90,spawn:0,next:0,polarity:1,magnet:{x:360,y:390,active:false},events:[]};}
export function candy(x,y,color){return {x,y,color,vx:0,vy:35,r:20,age:0};}
export function step(g,dt,random=Math.random){if(g.mode!=='playing')return;dt=Math.max(0,Math.min(dt,1/30));g.events=[];g.time=Math.max(0,g.time-dt);g.spawn-=dt;
 if(g.spawn<=0){const color=g.next;g.balls.push(candy(70+random()*580,-25,color));g.next=Math.floor(random()*3);g.spawn=Math.max(1.1,2.5-(90-g.time)/65);}
 for(const b of g.balls){b.age+=dt;let ax=0,ay=33;const dx=g.magnet.x-b.x,dy=g.magnet.y-b.y,d=Math.hypot(dx,dy);if(g.magnet.active&&d<245&&d>2){const force=660*(1-d/245)*g.polarity;ax=dx/d*force;ay+=dy/d*force;}
 b.vx=(b.vx+ax*dt)*Math.exp(-.7*dt);b.vy=(b.vy+ay*dt)*Math.exp(-.12*dt);const speed=Math.hypot(b.vx,b.vy);if(speed>300){b.vx*=300/speed;b.vy*=300/speed;}b.x+=b.vx*dt;b.y+=b.vy*dt;
 if(b.x<22){b.x=22;b.vx=Math.abs(b.vx)*.65;}if(b.x>W-22){b.x=W-22;b.vx=-Math.abs(b.vx)*.65;}if(b.y< -30){b.y=-30;b.vy=Math.abs(b.vy)*.5;}
 if(b.y>=735){const jar=jars.find(j=>Math.abs(j.x-b.x)<82);b.done=true;const hit=jar?.color===b.color;if(hit){g.combo++;g.caught++;g.score+=100+Math.min(g.combo-1,9)*25;}else{g.combo=0;g.misses++;}g.events.push(hit?'catch':'miss');for(let k=0;k<12;k++)g.particles.push({x:b.x,y:735,vx:(random()-.5)*160,vy:-random()*140,life:.7,color:hit?colors[b.color]:'#b2aaa0'});}
 }
 g.balls=g.balls.filter(b=>!b.done);for(const p of g.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;p.life-=dt;}g.particles=g.particles.filter(p=>p.life>0);
 if(g.misses>=5||g.time<=0){g.mode='ended';g.magnet.active=false;}
}
