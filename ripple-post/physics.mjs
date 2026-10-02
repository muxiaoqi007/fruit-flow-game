export const W=720,H=820;
export const levels=[
 {name:'第一封 · 顺水的问候',boat:[170,650],dock:[560,170],lights:[[240,540],[390,380],[510,240]],rocks:[]},
 {name:'第二封 · 绕个温柔的弯',boat:[130,680],dock:[560,150],lights:[[200,520],[440,450],[550,270]],rocks:[[335,580,53],[330,275,64]]},
 {name:'第三封 · 岛屿间的晚安',boat:[125,700],dock:[590,130],lights:[[190,520],[370,370],[545,230]],rocks:[[350,635,65],[140,315,55],[535,425,59]]}
];
export function createGame(level=0){const l=levels[level];return {level,mode:'ready',boat:{x:l.boat[0],y:l.boat[1],vx:0,vy:0},lights:l.lights.map(([x,y])=>({x,y,collected:false})),rocks:l.rocks.map(([x,y,r])=>({x,y,r})),dock:{x:l.dock[0],y:l.dock[1]},waves:[],strokes:0,time:0,cooldown:0};}
export function ripple(g,x,y){if(g.mode!=='playing'||g.cooldown>0||!Number.isFinite(x)||!Number.isFinite(y))return false;g.waves.push({x:Math.max(0,Math.min(W,x)),y:Math.max(0,Math.min(H,y)),r:0,hit:false});g.strokes++;g.cooldown=.35;return true;}
export function step(g,dt){if(g.mode!=='playing')return;dt=Math.max(0,Math.min(dt,1/30));g.time+=dt;g.cooldown=Math.max(0,g.cooldown-dt);const b=g.boat;
 for(const w of g.waves){const before=w.r;w.r+=310*dt;const dx=b.x-w.x,dy=b.y-w.y,d=Math.hypot(dx,dy);if(!w.hit&&d<=w.r+16&&d>=before-22&&d<210){w.hit=true;if(d>1){const power=260*(1-d/330);b.vx+=dx/d*power;b.vy+=dy/d*power;}}}
 g.waves=g.waves.filter(w=>w.r<230);const speed=Math.hypot(b.vx,b.vy);if(speed>340){b.vx*=340/speed;b.vy*=340/speed;}b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=Math.exp(-1.05*dt);b.vy*=Math.exp(-1.05*dt);
 for(const r of g.rocks){let dx=b.x-r.x,dy=b.y-r.y,d=Math.hypot(dx,dy);if(d<r.r+18){if(d<.001){dx=1;dy=0;d=1;}const nx=dx/d,ny=dy/d;b.x=r.x+nx*(r.r+18);b.y=r.y+ny*(r.r+18);const v=b.vx*nx+b.vy*ny;if(v<0){b.vx-=1.65*v*nx;b.vy-=1.65*v*ny;}}}
 for(const [pos,vel,max] of [['x','vx',W],['y','vy',H]]){if(b[pos]<24){b[pos]=24;b[vel]=Math.abs(b[vel])*.6;}if(b[pos]>max-24){b[pos]=max-24;b[vel]=-Math.abs(b[vel])*.6;}}
 for(const l of g.lights)if(Math.hypot(l.x-b.x,l.y-b.y)<37)l.collected=true;
 if(g.lights.every(l=>l.collected)&&Math.hypot(b.x-g.dock.x,b.y-g.dock.y)<43){g.mode='won';b.vx=b.vy=0;}
}
