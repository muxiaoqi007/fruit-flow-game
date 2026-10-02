export const TILE=32, FLOOR=400, HEIGHT=480;
export const WORLDS=[
 {name:'风起草甸',en:'BREEZY MEADOW',subtitle:'跟着风，向前跑。',length:3456,sky:'#bedfdb',mountain:'#8fbcb3',hill:'#66988a',grass:'#618745',dirt:'#ad7351',night:false},
 {name:'日落山谷',en:'SUNSET VALLEY',subtitle:'越过山谷，追上最后一束光。',length:3904,sky:'#efc6a5',mountain:'#c99389',hill:'#a77070',grass:'#a68d51',dirt:'#9a6260',night:false},
 {name:'星光归途',en:'STARLIGHT HOME',subtitle:'带着收集的星光，回家。',length:4352,sky:'#283b58',mountain:'#394965',hill:'#435975',grass:'#729483',dirt:'#696375',night:true},
 {name:'霜雪松林',en:'FROSTWOOD RUN',subtitle:'冰面有点滑，提前松开方向键减速。',length:4736,sky:'#d6e9ed',mountain:'#adcad6',hill:'#8fafbf',grass:'#d8f1ed',dirt:'#87a9bd',night:false,theme:'snow'},
 {name:'熔火峡谷',en:'EMBER CANYON',subtitle:'踩稳岩台，跃过脚下的熔岩。',length:5120,sky:'#473b4d',mountain:'#665063',hill:'#866065',grass:'#bc8261',dirt:'#685665',night:true,theme:'lava'},
 {name:'云端远行',en:'CLOUDTOP VOYAGE',subtitle:'沿着浮岛向上跳，云海尽头就是家。',length:5568,sky:'#c9e1ef',mountain:'#b1c6db',hill:'#a5bad1',grass:'#e6eccb',dirt:'#9c9bb5',night:false,theme:'sky'},
 {name:'萤火秘林',en:'FIREFLY GROVE',subtitle:'沿树梢寻找萤火，岔路也藏着惊喜。',length:4800,sky:'#243e42',mountain:'#355955',hill:'#477566',grass:'#82a86c',dirt:'#655b50',night:true,theme:'forest'},
 {name:'金砂遗迹',en:'GOLDEN RUINS',subtitle:'踏上古老石阶，追寻沙海中的星光。',length:5184,sky:'#f0d4ac',mountain:'#cfaa7e',hill:'#b88d67',grass:'#e3be80',dirt:'#a77e5a',night:false,theme:'desert'},
 {name:'极光长桥',en:'AURORA CROSSING',subtitle:'找准落点，沿着极光一路跳回家。',length:5504,sky:'#24364f',mountain:'#405874',hill:'#567b87',grass:'#c4e4db',dirt:'#747f9e',night:true,theme:'aurora'}
];
// The later worlds have authored routes, including their own vertical detours.
const EXTRA_ROUTES={
 forest:{gaps:[[24,27],[43,47],[66,70],[92,96],[117,121],[135,139]],
  platforms:[[7,352,3],[13,304,3],[19,256,3],[28,352,3],[35,304,3],[44,368,2],[48,352,3],[55,288,3],[61,240,3],[72,352,3],[80,304,4],[87,256,3],[98,352,3],[106,304,3],[112,256,3],[123,352,3],[130,304,3],[141,352,3]],
  blocks:[[10,272,['box','brick']],[32,272,['brick','box']],[76,272,['box','brick']],[102,272,['brick','box']]],
  stars:[[20,214],[62,198],[113,214]],enemies:[32,52,76,102,127]},
 desert:{gaps:[[28,32],[51,55],[77,81],[103,108],[130,134],[146,150]],
  platforms:[[8,352,3],[15,304,3],[22,256,3],[34,352,3],[42,304,3],[57,352,3],[64,304,3],[71,256,3],[83,352,3],[91,304,3],[98,256,3],[110,352,3],[118,304,3],[125,256,3],[136,352,3],[152,352,3]],
  blocks:[[11,272,['brick','box']],[38,272,['box','brick']],[60,272,['brick','box']],[87,272,['box','brick']],[114,272,['brick','box']]],
  stars:[[23,214],[72,214],[126,214]],enemies:[18,38,60,87,114,140]},
 aurora:{gaps:[[23,27],[39,43],[58,62],[78,82],[99,103],[120,124],[140,144],[155,159]],
  platforms:[[7,352,3],[14,304,3],[24,368,2],[29,336,3],[40,368,2],[46,336,3],[52,288,3],[59,368,2],[65,336,3],[72,288,3],[79,368,2],[85,336,3],[92,288,3],[100,368,2],[106,336,3],[113,288,3],[121,368,2],[127,336,3],[134,288,3],[141,368,2],[147,336,3],[156,368,2],[161,352,3]],
  blocks:[[10,272,['box','brick']],[33,272,['brick','box']],[68,272,['box','brick']],[88,272,['brick','box']],[109,272,['box','brick']],[130,272,['brick','box']]],
  stars:[[15,262],[93,246],[135,246]],enemies:[33,49,68,89,109,130,148]},
 tutorial:{gaps:[[29,32],[47,50],[70,73],[81,85],[91,95]],
  platforms:[[7,352,3],[19,336,3],[35,352,3],[42,320,3],[55,336,3],[59,272,3],[65,336,3],[77,336,3],[80,336,5],[86,352,3],[97,336,3]],
  blocks:[[14,304,['brick','box','brick']],[37,288,['box','brick']],[61,208,['brick','box']]],
  stars:[[8,308],[60,230],[83,406]],enemies:[24,40,61,88]},
 snow:{gaps:[[25,29],[48,52],[73,77],[99,103],[124,129]],
  platforms:[[8,336,3],[16,304,3],[30,336,3],[39,320,3],[54,336,3],[62,304,3],[79,336,3],[89,304,3],[105,336,3],[116,304,3],[131,336,3]],
  blocks:[[11,272,['box','brick','box']],[35,288,['brick','box','brick']],[65,256,['box','brick','box']],[94,272,['box','brick']],[119,256,['brick','box','brick']]],
  stars:[[17,262],[66,214],[120,214]],enemies:[20,34,44,59,69,84,95,110,136]},
 lava:{gaps:[[22,26],[42,47],[65,70],[88,93],[112,117],[138,143]],
  platforms:[[8,336,3],[15,304,3],[28,336,3],[35,304,3],[50,336,3],[58,304,3],[72,336,3],[80,304,3],[96,336,3],[104,304,3],[120,336,3],[130,304,3],[145,336,3]],
  blocks:[[11,272,['brick','box','brick']],[31,272,['box','brick','box']],[54,272,['box','brick']],[75,272,['brick','box','brick']],[100,272,['box','brick','box']],[124,272,['box','brick']]],
  stars:[[16,262],[81,262],[131,262]],enemies:[32,55,77,101,125,148]},
 sky:{gaps:[[26,30],[48,52],[72,76],[97,101],[122,126],[148,152]],
  platforms:[[8,336,3],[15,288,3],[21,256,3],[33,336,3],[40,288,3],[55,336,3],[62,288,3],[68,256,3],[79,336,3],[87,288,3],[104,336,3],[112,288,3],[129,336,3],[137,288,3],[144,256,3],[155,336,3],[27,368,2],[49,368,2],[73,368,2],[98,368,2],[123,368,2],[149,368,2]],
  blocks:[[11,272,['box','brick','box']],[36,272,['brick','box']],[58,272,['box','brick']],[83,272,['box','brick','box']],[108,272,['box','brick']],[133,272,['brick','box']]],
  stars:[[22,214],[69,214],[145,214]],enemies:[19,39,63,87,113,137,159]}
};
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function level(index){
 const w=WORLDS[index], solids=[],coins=[],stars=[],enemies=[];
 const route=EXTRA_ROUTES[index===0?'tutorial':w.theme];
 const gaps=route?route.gaps:index===0?[[26,29],[53,56],[78,82]]:index===1?[[23,27],[44,48],[71,75],[95,100]]:[[24,28],[46,50],[68,73],[91,96],[113,118]];
 for(let i=0;i<w.length/TILE;i++)if(!gaps.some(([a,b])=>i>=a&&i<b))solids.push({x:i*TILE,y:FLOOR,w:TILE,h:80,type:'ground',material:w.theme==='snow'&&[[10,24],[36,47],[59,72],[85,98],[110,123],[135,139]].some(([a,b])=>i>=a&&i<=b)?'ice':'normal'});
 if(index===0)for(const [a,b,y] of [[29,32,432],[47,50,432],[81,85,448]])solids.push({x:a*TILE,y,w:(b-a)*TILE,h:480-y,type:'ground',material:'normal',safety:true});
 const blocks=(x,y,kinds)=>kinds.forEach((type,i)=>solids.push({x:(x+i)*TILE,y,w:TILE,h:TILE,type,bump:0}));
 let platforms;
 if(route){
  for(const [x,y,kinds] of route.blocks)blocks(x,y,kinds);
  platforms=route.platforms;
 }else{
  blocks(10,288,['brick','box','brick','box','brick']);blocks(33,288,['box','brick','box']);blocks(61,272,['brick','box','brick','box']);
  blocks(85,288,['box','brick','box']);
  if(index>0)blocks(105,272,['box','brick','box','brick']);
  if(index>1)blocks(122,288,['box','brick','box']);
  platforms=[[8,336,2],[19,336,3],[30,336,2],[40,336,3],[48,304,3],[58,336,2],[68,336,3],[75,304,3],[90,336,3]];
  if(index>0)platforms.push([101,336,3],[111,320,2]);
  if(index>1)platforms.push([119,336,3],[128,336,3]);
 }
 for(const [x,y,width] of platforms)solids.push({x:x*TILE,y,w:width*TILE,h:16,type:'platform'});
 // Authored coin trails teach the first world's jumps and optional lower route.
 const addCoin=(x,y)=>coins.push({x,y,w:12,h:18,taken:false});
 if(index===0){
  for(const i of [5,16,20,35,40,53,65,76,94])for(let j=0;j<3;j++)addCoin((i+j)*TILE+10,354);
  for(const [x,y] of [[28,352],[30,316],[32,352],[46,352],[48,316],[50,352],[81,390],[82,411],[84,411]])addCoin(x*TILE+10,y);
 }else for(let i=6;i<w.length/TILE-8;i+=9)for(let j=0;j<3;j++){
  const t=i+j;if(gaps.some(([a,b])=>t>=a&&t<b))continue;addCoin(t*TILE+10,354);
 }
 for(const [x,y,width] of platforms)for(let j=0;j<width;j++)addCoin((x+j)*TILE+10,y-32);
 const starSpots=route?route.stars:index===0?[[12,246],[49,258],[86,246]]:index===1?[[20,292],[62,230],[106,230]]:[[34,246],[76,262],[123,246]];
 for(const [x,y] of starSpots)stars.push({id:stars.length,x:x*TILE,y,w:22,h:22,taken:false});
 const enemyTiles=route?route.enemies:Array.from({length:Math.ceil((w.length/TILE-27)/(index?10:14))},(_,i)=>17+i*(index?10:14));
 for(const i of enemyTiles){if(gaps.some(([a,b])=>i>=a-1&&i<=b+1))continue;enemies.push({x:i*TILE,y:FLOOR-24,w:28,h:24,vx:(i%2?1:-1)*(index?43:32),vy:0,alive:true,flat:0,minX:i*TILE-48,maxX:i*TILE+76});}
 // Staircase to the final pennant, all steps below maximum jump height.
 const end=w.length-320;for(let i=0;i<3;i++)solids.push({x:end+i*TILE,y:FLOOR-(i+1)*TILE,w:TILE,h:(i+1)*TILE,type:'stone'});
 let checkpointTile=index===0?54:Math.floor(w.length/2/TILE);
 while(gaps.some(([a,b])=>checkpointTile>=a-1&&checkpointTile<=b)||enemies.some(e=>Math.abs(e.x-(checkpointTile*TILE+8))<96))checkpointTile++;
 return {solids,coins,stars,enemies,gaps,checkpoint:{x:checkpointTile*TILE+8,y:FLOOR,active:false},flag:{x:w.length-152,y:FLOOR}};
}
export function createGame(index=0,score=0,totalCoins=0,totalStars=0){
 return {index,world:WORLDS[index],...level(index),mode:'ready',player:{x:80,y:FLOOR-32,w:24,h:32,vx:0,vy:0,grounded:true,face:1,coyote:.1,buffer:0,invuln:0,hurt:0,land:0,skid:0,surface:'normal'},hp:3,score,coinsCount:totalCoins,starsCount:totalStars,localStars:0,time:0,camera:0,events:[],particles:[],jumpWasDown:false,startScore:score,startCoins:totalCoins,startStars:totalStars,respawnX:80,notice:0,transition:0,finishTime:0,practice:false};
}
function event(g,type,x,y){g.events.push({type,x,y});}
function collectCoin(g,c){c.taken=true;g.coinsCount++;g.score+=100;event(g,'coin',c.x,c.y);}
export function createPractice(){
 const g=createGame();g.practice=true;g.world={...WORLDS[0],name:'风中练习场',en:'JUMP GARDEN',subtitle:'放心试跳，跌落不扣心。随时选择关卡出发。',length:1920};
 g.solids=[];for(let i=0;i<60;i++)g.solids.push({x:i*TILE,y:FLOOR,w:TILE,h:80,type:'ground',material:'normal'});
 for(const [x,y,w] of [[7,352,3],[13,304,3],[20,256,3],[28,320,3],[36,352,3],[44,288,3],[51,336,3]])g.solids.push({x:x*TILE,y,w:w*TILE,h:16,type:'platform'});
 g.coins=[];g.stars=[];g.enemies=[];g.gaps=[];g.checkpoint={x:960,y:FLOOR,active:false};g.flag={x:1840,y:FLOOR};return g;
}
function respawn(g){
 const p=g.player;Object.assign(p,{x:g.respawnX,y:FLOOR-p.h,vx:0,vy:0,grounded:true,coyote:.1,buffer:0,invuln:2,hurt:0,surface:'normal',land:.18});
 g.mode='playing';g.jumpWasDown=true;g.camera=clamp(p.x-(g.viewWidth||960)*.32,0,g.world.length-(g.viewWidth||960));event(g,'respawn',p.x,p.y);
}
export function damage(g,fall=false,sourceX=null){
 const p=g.player;if(g.mode!=='playing'||(!fall&&p.invuln>0))return;
 if(!g.practice)g.hp--;event(g,'hurt',p.x,p.y);
 if(fall||g.hp<=0){g.mode=g.hp<=0?'dying':'respawning';g.transition=g.hp<=0?.7:.55;p.vx=0;p.vy=0;return;}
 p.invuln=2;p.hurt=.24;
 const away=sourceX===null?-p.face:Math.sign(p.x+p.w/2-sourceX)||-p.face;p.vx=away*165;p.vy=-230;p.grounded=false;p.coyote=0;
}
export function step(g,dt,input={}){
 if(g.mode==='respawning'||g.mode==='dying'){
  g.transition=Math.max(0,g.transition-dt);if(g.transition===0){if(g.mode==='dying'){g.mode='dead';event(g,'dead',g.player.x,g.player.y);}else respawn(g);}return;
 }
 if(g.mode==='finishing'){
  const p=g.player;g.finishTime+=dt;p.face=1;p.invuln=0;p.vx=p.x<g.flag.x+80?95:0;p.x=Math.min(g.flag.x+80,p.x+p.vx*dt);
  p.vy=Math.min(500,p.vy+1550*dt);p.y=Math.min(FLOOR-p.h,p.y+p.vy*dt);p.grounded=p.y===FLOOR-p.h;
  if(g.finishTime>=1.6){g.mode='won';p.vx=0;event(g,'win',p.x,p.y);}return;
 }
 if(g.mode!=='playing')return;
 const p=g.player;g.time+=dt;g.notice=Math.max(0,g.notice-dt);p.invuln=Math.max(0,p.invuln-dt);p.hurt=Math.max(0,p.hurt-dt);p.land=Math.max(0,p.land-dt);
 if(input.jump&&!g.jumpWasDown)p.buffer=.13;else p.buffer=Math.max(0,p.buffer-dt);
 g.jumpWasDown=!!input.jump;p.coyote=p.grounded?.1:Math.max(0,p.coyote-dt);
 const dir=(input.right?1:0)-(input.left?1:0),speed=input.run?280:200;
 p.skid=p.grounded&&dir&&dir*p.vx< -35?dir:0;
 if(p.hurt<=0){
  const target=dir*speed,icy=p.grounded&&p.surface==='ice';
  const rate=icy?(dir?850:450):p.grounded?(dir?1700:2000):(dir?1100:180);
  p.vx+=clamp(target-p.vx,-rate*dt,rate*dt);if(dir)p.face=dir;
 }
 if(p.buffer>0&&p.coyote>0){p.vy=-505;p.grounded=false;p.coyote=0;p.buffer=0;event(g,'jump',p.x,p.y);}
 if(!input.jump&&p.vy< -190)p.vy=Math.min(-190,p.vy+2300*dt);
 p.vy=Math.min(740,p.vy+(p.vy<0?1120:1550)*dt);
 const oldY=p.y,wasGrounded=p.grounded;
 p.x+=p.vx*dt;
 for(const b of g.solids){if(b.type==='platform')continue;if(overlap(p,b)){if(p.vx>0)p.x=b.x-p.w;else if(p.vx<0)p.x=b.x+b.w;p.vx=0;}}
 p.x=clamp(p.x,0,g.world.length-p.w);p.y+=p.vy*dt;p.grounded=false;
 for(const b of g.solids){b.bump=Math.max(0,(b.bump||0)-dt);if(!overlap(p,b))continue;
  if(p.vy>=0&&oldY+p.h<=b.y+2){if(!wasGrounded&&p.vy>180){p.land=.16;event(g,'land',p.x,b.y);}p.y=b.y-p.h;p.vy=0;p.grounded=true;p.surface=b.material||'normal';}
  else if(b.type!=='platform'&&p.vy<0&&oldY>=b.y+b.h-2){p.y=b.y+b.h;p.vy=0;b.bump=.18;
   if(b.type==='box'){b.type='used';collectCoin(g,{x:b.x+10,y:b.y-22});}else if(b.type==='brick'){if(!b.rewarded){g.score+=10;b.rewarded=true;}event(g,'bump',b.x,b.y);}
  }
 }
 for(const c of g.coins)if(!c.taken&&overlap(p,c))collectCoin(g,c);
 for(const s of g.stars)if(!s.taken&&overlap(p,s)){s.taken=true;g.localStars++;g.starsCount++;g.score+=500;g.events.push({type:'star',x:s.x,y:s.y,id:s.id});}
 for(const e of g.enemies){
  if(!e.alive){e.flat=Math.max(0,e.flat-dt);continue;}
  // Turn around at a ledge or wall; no invisible enemy falls between frames.
  const ahead=e.vx>0?e.x+e.w+3:e.x-3;
  const floorAhead=g.solids.some(b=>ahead>=b.x&&ahead<b.x+b.w&&Math.abs(b.y-(e.y+e.h))<5);
  if(!floorAhead||(e.vx<0&&e.x<=e.minX)||(e.vx>0&&e.x+e.w>=e.maxX))e.vx*=-1;
  e.x+=e.vx*dt;
  for(const b of g.solids)if(b.type!=='platform'&&overlap(e,b)){if(e.vx>0)e.x=b.x-e.w;else e.x=b.x+b.w;e.vx*=-1;break;}
  if(overlap(p,e)){
   if(p.vy>0&&oldY+p.h<=e.y+10){e.alive=false;e.flat=.3;p.vy=input.jump?-445:-290;p.y=e.y-p.h;p.grounded=false;p.coyote=0;p.buffer=0;g.score+=200;event(g,'stomp',e.x,e.y);}
   else damage(g,false,e.x+e.w/2);
  }
 }
 const inLava=g.world.theme==='lava'&&p.y+p.h>=442&&g.gaps.some(([a,b])=>p.x+p.w>a*TILE&&p.x<b*TILE);
 if(p.y>HEIGHT+70||inLava)damage(g,true);
 if(g.mode!=='playing')return;
 const cp=g.checkpoint;
 if(!g.practice&&!cp.active&&p.x>cp.x&&p.grounded){cp.active=true;g.respawnX=cp.x;g.hp=Math.min(3,g.hp+1);g.notice=3;event(g,'checkpoint',cp.x,cp.y-65);}
 if(!g.practice&&p.x+p.w>g.flag.x&&p.y+p.h<=FLOOR+2){g.mode='finishing';g.finishTime=0;g.score+=1000+g.hp*200;event(g,'finish',p.x,p.y);}
 g.camera=clamp(g.camera+(p.x-(g.viewWidth||960)*.32-g.camera)*Math.min(1,dt*5),0,g.world.length-(g.viewWidth||960));
}
