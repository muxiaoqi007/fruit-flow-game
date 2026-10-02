import {createGame,createPractice,step,WORLDS,FLOOR} from './physics.mjs';
import {readStarRecords,recordStar,countStars,availableLooks} from './progress.mjs';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
export let game=createGame();
let viewW=960,last=0,accumulator=0,visualTime=0,keys=new Set(),pointers=new Map(),particles=[],floaters=[],soundOn=false,audio=null,noteClock=0,noteIndex=0;
let best=0,completed=[],starRecords=readStarRecords(null,WORLDS.length),look='orange',touchAutoRun=true;
const activeModes=['playing','respawning','dying','finishing'];
try{best=Number(localStorage.getItem('tangerine-best'))||0;completed=JSON.parse(localStorage.getItem('tangerine-completed')||'[]');if(!Array.isArray(completed))completed=[];starRecords=readStarRecords(localStorage.getItem('tangerine-stars'),WORLDS.length);look=localStorage.getItem('tangerine-look')||'orange';if(!availableLooks(starRecords).includes(look))look='orange';}catch{}
const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
function poly(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x),Math.round(y)):ctx.moveTo(Math.round(x),Math.round(y)));ctx.closePath();ctx.fill();}
function text(s,x,y,size,color,align='left'){ctx.fillStyle=color;ctx.font=`bold ${size}px "Courier New",monospace`;ctx.textAlign=align;ctx.fillText(s,Math.round(x),Math.round(y));}
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
function audioInit(){try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();}catch{}}
function tone(freq,duration=.12,type='square',volume=.025,delay=0){if(!soundOn||!audio)return;const o=audio.createOscillator(),v=audio.createGain(),t=audio.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);v.gain.setValueAtTime(volume,t);v.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(v);v.connect(audio.destination);o.start(t);o.stop(t+duration);}
function sfx(type){const sounds={coin:[880,1320],star:[523,659,784,1047],land:[95],respawn:[330,523],finish:[523,659,784],jump:[240,400],stomp:[140,90],bump:[180],hurt:[180,130,80],checkpoint:[523,784,1047],win:[523,659,784,1047,1318]};(sounds[type]||[]).forEach((f,i)=>tone(f,.13,'square',.025,i*.07));}
function music(dt){if(!soundOn||game.mode!=='playing')return;noteClock-=dt;if(noteClock>0)return;noteClock=.25;const melody=[659,0,784,880,784,659,523,0,587,659,784,0,659,587,523,0,523,659,784,1047,880,784,659,0,587,659,523,0,392,0,0,0];const f=melody[noteIndex%melody.length];if(f)tone(f,.17,'triangle',.03);if(noteIndex%4===0)tone([131,165,175,147][Math.floor(noteIndex/8)%4],.22,'triangle',.032);noteIndex++;}
function save(){if(game.practice)return;best=Math.max(best,game.score);try{localStorage.setItem('tangerine-best',String(best));localStorage.setItem('tangerine-completed',JSON.stringify(completed));localStorage.setItem('tangerine-stars',JSON.stringify(starRecords));}catch{}$('best').textContent=String(best).padStart(6,'0');}
function clearInput(){keys.clear();pointers.clear();document.querySelectorAll('[data-key]').forEach(b=>b.classList.remove('pressed'));}
function input(){const active=k=>[...keys].some(code=>bindings[code]===k)||[...pointers.values()].includes(k);return {left:active('left'),right:active('right'),jump:active('jump'),run:active('run')||(touchAutoRun&&[...pointers.values()].some(k=>k==='left'||k==='right'))};}
function select(index,carry=false){const prev=game;game=createGame(index,carry?prev.score:0,carry?prev.coinsCount:0,carry?prev.starsCount:0);game.viewWidth=viewW;particles=[];floaters=[];clearInput();noteIndex=0;updateWorlds();updateUI();showOverlay();}
function updateWorlds(){document.querySelectorAll('[data-world]').forEach((el,i)=>{el.querySelector('.world-state').textContent=completed.includes(i)?'已通关 ✓':i===game.index&&!game.practice?'出发 ↗':'探索 ↗';el.querySelector('.world-stars').setAttribute('aria-label',`已收集 ${countStars([starRecords[i]])} / 3 颗星星`);el.querySelector('.world-stars').textContent=[0,1,2].map(id=>starRecords[i]&(1<<id)?'★':'☆').join(' ');el.classList.toggle('active',i===game.index&&!game.practice);el.setAttribute('aria-pressed',String(i===game.index&&!game.practice));});$('level-label').textContent=game.practice?'FREE PLAY / 风中练习场':`0${game.index+1} / ${game.world.name}`;updateCollection();$('scene-caption').innerHTML=`<span>0${game.index+1}</span>${game.world.en.replace(' ','<br>')} <i>↗</i>`;document.querySelector('.hud').style.color=game.world.night?'#f3ead1':'';$('viewport').dataset.theme=game.world.theme||'';document.querySelector('.tip').innerHTML=game.practice?'<span>✦</span> 试试短按、长按和空中转向，找到自己的节奏。':game.world.theme==='snow'?'<span>✦</span> 蓝色冰面会滑行，白色积雪可刹车。':game.world.theme==='lava'?'<span>✦</span> 熔岩碰不得，长按跳跃越过峡谷。':game.world.theme==='forest'?'<span>✦</span> 树梢藏着星星，试试走上层路线。':game.world.theme==='desert'?'<span>✦</span> 沿石阶逐级跳高，沙丘间留有落脚点。':game.world.theme==='aurora'?'<span>✦</span> 长桥有下层桥台，落稳后再起跳。':game.world.theme==='sky'?'<span>✦</span> 高处藏着星星，沿浮岛逐级向上跳。':'<span>✦</span> 从头顶踩下去，小怪物就没辙了。';}
function showOverlay(){const mode=game.mode,active=activeModes.includes(mode);$('overlay').hidden=active;$('scene-caption').hidden=active||game.practice;document.body.classList.toggle('in-game',mode!=='ready');$('pause').innerHTML=mode==='paused'?'▶ <span>继续</span>':'Ⅱ <span>暂停</span>';$('pause').setAttribute('aria-label',mode==='paused'?'继续游戏':'暂停游戏');if(active)return;
 const final=mode==='won'&&game.index===WORLDS.length-1;
 $('card-kicker').textContent=mode==='paused'?'TAKE A LITTLE BREAK':mode==='dead'?'ONE MORE ADVENTURE':final?'ALL WORLDS CLEAR':game.practice?'FREE PLAY · 放心试跳':`WORLD 0${game.index+1} · ${game.world.name}`;
 $('card-title').innerHTML=mode==='ready'?(game.practice?'随便跳跳，<br>找找感觉。':'准备好，<br>出发冒险！'):mode==='paused'?'歇一会儿，<br>风景还在。':mode==='dead'?'没关系，<br>再跳一次！':final?'带着星光，<br>到家啦！':'好样的，<br>继续向前！';
 $('card-text').textContent=mode==='ready'?game.world.subtitle:mode==='paused'?'你的冒险进度会留在这里。':mode==='dead'?'小小的跌倒，挡不住大大的冒险。':`本关 ${game.localStars} / 3 颗星 · 星册 ${countStars(starRecords)} / ${WORLDS.length*3} · 总分 ${game.score.toLocaleString()}`;
 $('play').innerHTML=(mode==='ready'?'开始冒险':mode==='paused'?'继续冒险':mode==='dead'?'重试本关':final?'再次出发':'前往下一关')+' <span>→</span>';
 $('card-hint').textContent=mode==='paused'?'按 P / ESC 返回游戏':'或按 ENTER 继续';
}
function focusGame(){document.querySelector('.arcade').scrollIntoView({block:'start',behavior:'instant'});canvas.focus({preventScroll:true});}
function retry(){
 save();game=game.practice?createPractice():createGame(game.index,game.startScore,game.startCoins,game.startStars);game.mode='playing';game.viewWidth=viewW;particles=[];floaters=[];clearInput();showOverlay();focusGame();
}
export function action(){
 audioInit();if(game.mode==='ready'){game.mode='playing';clearInput();}
 else if(game.mode==='paused'){game.mode=game.resumeMode||'playing';clearInput();}
 else if(game.mode==='dead'){retry();return;}
 else if(game.mode==='won'){select(game.index===WORLDS.length-1?0:game.index+1,game.index<WORLDS.length-1);game.mode='playing';}
 else return;
 showOverlay();focusGame();
}
function pause(){if(activeModes.includes(game.mode)){game.resumeMode=game.mode;game.mode='paused';clearInput();showOverlay();updateUI();}else if(game.mode==='paused')action();}
function updateCollection(){
 const n=countStars(starRecords);$('collection-count').textContent=`${n} / ${WORLDS.length*3}`;
 $('collection-hint').textContent=n<3?'收集 3 颗不同星星，解锁薄荷橘子':n<18?'薄荷配色已解锁 · 收集 18 星解锁金色橘子':n===WORLDS.length*3?'全星达成 · 金色橘子已解锁':'金色橘子已解锁 · 继续探索新世界';
 const names={orange:'经典橘子',mint:'薄荷橘子',gold:'金色橘子'};$('outfit').textContent=names[look]+' ↻';$('outfit').disabled=availableLooks(starRecords).length===1;
}
$('practice').addEventListener('click',()=>{save();game=createPractice();game.viewWidth=viewW;particles=[];floaters=[];clearInput();updateWorlds();showOverlay();focusGame();});
$('outfit').addEventListener('click',()=>{const looks=availableLooks(starRecords);look=looks[(looks.indexOf(look)+1)%looks.length];try{localStorage.setItem('tangerine-look',look);}catch{}updateCollection();});
$('speed-toggle').addEventListener('click',()=>{touchAutoRun=!touchAutoRun;$('speed-toggle').textContent=touchAutoRun?'自动跑':'慢走';$('speed-toggle').setAttribute('aria-pressed',String(touchAutoRun));$('speed-toggle').setAttribute('aria-label',touchAutoRun?'自动奔跑已开启，点击切换慢走':'慢走已开启，点击切换自动奔跑');});
$('map-toggle').addEventListener('click',()=>{if(activeModes.includes(game.mode))pause();document.querySelector('.worlds').scrollIntoView({block:'start',behavior:'instant'});});
$('play').addEventListener('click',action);$('pause').addEventListener('click',pause);
$('sound').addEventListener('click',()=>{soundOn=!soundOn;audioInit();$('sound').innerHTML=`♪ <span>声音${soundOn?'开':'关'}</span>`;$('sound').setAttribute('aria-label',soundOn?'关闭声音':'开启声音');$('sound').setAttribute('aria-pressed',String(soundOn));if(soundOn)sfx('coin');});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.arcade').requestFullscreen();}catch{$('fullscreen').title='当前浏览器暂不支持全屏';}});
const worldDescriptions=['绿意、微风，还有第一枚金币。','追着夕阳，跳得再远一点。','把星星装进口袋，继续远行。','雪花落下，记得提前减速。','踏过岩台，穿越滚烫峡谷。','跳上浮岛，在云海尽头回家。','爬上树梢，追逐林间萤火。','穿过沙丘，登上遗迹石阶。','桥台接力，跟着极光远行。'];
$('world-count').textContent=`${WORLDS.length} 个世界，沿途都是惊喜`;
$('world-list').innerHTML=WORLDS.map((w,i)=>`<button class="world" data-world="${i}"><span class="world-art ${w.theme||['meadow','sunset','night'][i]}"><i></i><b>${String(i+1).padStart(2,'0')}</b></span><span class="world-copy"><small>WORLD ${String(i+1).padStart(2,'0')}</small><strong>${w.name} <em class="world-stars" aria-label="已收集星星">☆ ☆ ☆</em></strong><span>${worldDescriptions[i]}</span></span><span class="world-state">探索 ↗</span></button>`).join('');
document.querySelectorAll('[data-world]').forEach(b=>b.addEventListener('click',()=>{save();select(Number(b.dataset.world));focusGame();}));
const bindings={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump',ShiftLeft:'run',ShiftRight:'run'};
window.addEventListener('keydown',e=>{if(bindings[e.code]){if(e.target.tagName==='BUTTON'&&game.mode!=='playing'&&e.code==='Space')return;e.preventDefault();keys.add(e.code);}if(e.repeat)return;if(e.code==='Enter'&&game.mode!=='playing'&&e.target.tagName!=='BUTTON'){e.preventDefault();action();}if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();pause();}if(e.code==='KeyR'&&(activeModes.includes(game.mode)||game.mode==='paused'||game.mode==='dead'))retry();});
window.addEventListener('keyup',e=>{if(bindings[e.code]){e.preventDefault();keys.delete(e.code);}});
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();audioInit();b.setPointerCapture(e.pointerId);pointers.set(e.pointerId,b.dataset.key);b.classList.add('pressed');});const release=e=>{pointers.delete(e.pointerId);if(![...pointers.values()].includes(b.dataset.key))b.classList.remove('pressed');};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);b.addEventListener('contextmenu',e=>e.preventDefault());});
window.addEventListener('blur',()=>{clearInput();if(activeModes.includes(game.mode))pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(activeModes.includes(game.mode))pause();}});
function resize(){const box=$('viewport').getBoundingClientRect();viewW=Math.max(480,Math.round(box.width/box.height*480));canvas.width=viewW;canvas.height=480;game.viewWidth=viewW;ctx.imageSmoothingEnabled=false;}new ResizeObserver(resize).observe($('viewport'));
function cloud(x,y,size,color){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(size,size);rect(0,10,66,13,color);rect(9,3,42,23,color);rect(19,-3,22,10,color);rect(60,15,12,8,color);ctx.restore();}
function hill(x,y,w,h,c){const pts=[[x,y],[x,y-h*.25],[x+w*.12,y-h*.25],[x+w*.12,y-h*.49],[x+w*.25,y-h*.49],[x+w*.25,y-h*.72],[x+w*.37,y-h*.72],[x+w*.37,y-h*.9],[x+w*.45,y-h*.9],[x+w*.45,y-h],[x+w*.6,y-h],[x+w*.6,y-h*.86],[x+w*.72,y-h*.86],[x+w*.72,y-h*.65],[x+w*.83,y-h*.65],[x+w*.83,y-h*.4],[x+w*.93,y-h*.4],[x+w*.93,y],[x,y]];poly(pts,c);}
function background(){const w=game.world,c=game.camera;rect(0,0,viewW,480,w.sky);
 const sunX=viewW*.77;rect(sunX,58,46,46,w.theme==='lava'?'#e5a07d':w.night?'#e9ddb0':'#f7edbd');rect(sunX-6,64,58,34,w.theme==='lava'?'#e5a07d':w.night?'#e9ddb0':'#f7edbd');rect(sunX+6,52,34,58,w.theme==='lava'?'#e5a07d':w.night?'#e9ddb0':'#f7edbd');if(w.night){rect(sunX+18,50,34,35,w.sky);for(let i=0;i<42;i++){const x=(hash(i+101)*viewW-c*.07+viewW)%viewW,y=hash(i+89)*230+15;rect(x,y,2,2,i%3?'#b5c7cc':'#f2e1a6');}}
 for(let i=-1;i<8;i++){let x=i*230-c*.12+Math.sin(visualTime*.06+i)*12;cloud(x,67+hash(i+4)*87,1+hash(i+7)*.6,w.theme==='snow'?'#f1f7f2':w.theme==='lava'?'#726172':w.theme==='sky'?'#f8f1e7':w.night?'#485973':'#e9f0db');}
 for(let i=-2;i<12;i++){const x=i*270-(c*.2)%270;hill(x,380,330,150+hash(i+20)*84,w.mountain);rect(x+166,232+hash(i+20)*20,4,10,w.night?'#53627a':'#b4d0bc');}
 for(let i=-1;i<12;i++){const x=i*210-(c*.36)%210;hill(x,420,260,88+hash(i+44)*60,w.hill);}
 // A distant winding trail and small trees add depth without obscuring jumps.
 if(!w.theme)for(let i=-1;i<12;i++){const x=i*144-(c*.5)%144;rect(x+25,330,5,44,w.night?'#53647a':'#78987b');hill(x,337,64,48,w.night?'#546b7d':'#84ab8a');}
}
function themedTree(x,y,scale,theme){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);
 if(theme==='forest'){
  rect(-7,-150,14,150,'#766b56');for(let i=0;i<3;i++)hill(-55+i*9,-105-i*32,110-i*18,45,'#4b8064');rect(-3,-130,3,90,'#a08b64');
 }else if(theme==='desert'){
  rect(-7,-90,14,90,'#78936b');rect(-29,-66,22,12,'#78936b');rect(-29,-91,10,30,'#78936b');rect(7,-48,23,12,'#78936b');rect(20,-75,10,36,'#78936b');rect(-3,-84,3,78,'#acc18b');
 }else if(theme==='aurora'){
  rect(-5,-120,10,120,'#647a94');for(let i=0;i<3;i++)poly([[-35+i*6,-55-i*26],[0,-120-i*26],[35-i*6,-55-i*26]],'#92bbb7');
 }else if(theme==='snow'){
  rect(-6,-137,12,139,'#798894');
  for(let i=0;i<4;i++){const y=-190+i*32,width=26+i*13;poly([[-width,y+50],[0,y], [width,y+50]],'#6f989d');poly([[-width+4,y+43],[0,y],[width-4,y+43],[width-17,y+43],[width-17,y+35],[-width+17,y+35],[-width+17,y+43]],'#eef9f3');}
 }else if(theme==='lava'){
  poly([[-23,0],[-23,-57],[-13,-57],[-13,-99],[8,-116],[27,-96],[27,0]],'#605261');
  poly([[-9,0],[-9,-80],[3,-93],[9,-76],[9,0]],'#92717a');rect(1,-76,4,28,'#e6a078');rect(5,-51,5,21,'#c08174');
  poly([[30,0],[30,-44],[44,-62],[55,-43],[55,0]],'#806574');
 }else{
  rect(-7,-130,14,130,'#a9a5b3');rect(-3,-124,4,111,'#d5cbbc');
  cloud(-45,-145,1.2,'#fcf4df');cloud(-33,-166,.85,'#fff9e9');
  rect(-25,-112,3,30,'#a3b4a1');rect(-25,-86,10,4,'#acbead');rect(15,-119,3,46,'#a3b4a1');rect(9,-80,9,4,'#acbead');
 }ctx.restore();
}
function tree(x,y,scale=1){const w=game.world;if(w.theme){themedTree(x,y,scale,w.theme);return;}ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);rect(-9,-105,18,110,w.night?'#566373':'#8b8560');rect(-5,-91,5,85,w.night?'#707779':'#aaa079');rect(-25,-130,51,35,w.night?'#638478':'#779b64');rect(-40,-166,80,41,w.night?'#6e9281':'#87aa6a');rect(-31,-185,62,26,w.night?'#789b8c':'#9cb97b');rect(-15,-197,29,14,w.night?'#8ba695':'#b0c88a');rect(-41,-155,16,14,w.night?'#5c7a72':'#6e955e');rect(25,-148,17,23,w.night?'#5c7a72':'#6e955e');rect(-25,-176,14,5,'#c9d8a035');rect(8,-158,18,4,'#c9d8a035');rect(18,-125,7,7,'#df9e59');rect(-27,-152,6,6,'#df9e59');ctx.restore();}
function bush(x,y,size=1){
 if(game.world.theme==='snow'){rect(x-24,y-10,48,10,'#cce3e8');rect(x-17,y-17,34,13,'#eff8f1');return;}
 if(game.world.theme==='lava'){poly([[x-20,y],[x-20,y-12],[x-10,y-23],[x+12,y-23],[x+22,y-11],[x+22,y]],'#92717b');rect(x-6,y-17,10,3,'#be8d87');return;}
 if(game.world.theme==='sky'){cloud(x-27,y-20,.7,'#f8f0d9');return;}
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(size,size);const n=game.world.night;rect(-24,-14,50,14,n?'#5c8075':'#618756');rect(-17,-24,35,13,n?'#6a8f80':'#779c60');rect(-7,-31,17,9,n?'#81a091':'#91b473');rect(-16,-18,7,3,'#b4c686');rect(8,-11,9,3,'#b4c686');ctx.restore();}
function decorations(){const cam=game.camera,w=game.world;for(let i=0;i<w.length/32;i++){const x=i*32-cam;if(x< -120||x>viewW+120)continue;if(game.gaps.some(([a,b])=>i>=a&&i<b))continue;
 if(i%19===7)tree(x+5,400,.8+(i%3)*.12);if(i%11===5)bush(x,400,1.1);
 if(i%5===1&&w.theme!=='lava'&&w.theme!=='snow'){rect(x+9,388,2,12,'#739058');rect(x+5,391,4,2,'#739058');rect(x+7,384,6,5,i%2?'#f6e2a2':'#eaa87d');rect(x+9,386,2,2,'#ba8f50');}
 if(i%8===0&&!w.theme){rect(x,392,2,8,'#66804f');rect(x+4,387,2,13,'#66804f');rect(x+8,391,2,9,'#66804f');}
 }
 // Little timber signs communicate direction inside the world.
 for(const at of [160,game.world.length-475]){let x=at-cam;rect(x+14,361,5,39,'#a38153');rect(x,339,37,25,'#e6c28b');rect(x+2,341,33,20,'#d5ae76');text('→',x+18,358,22,'#705c42','center');}
}
function themeTerrain(b,x,y,w){
 const platform=b.type==='platform',h=platform?16:b.h;
 rect(x,y,b.w,h,w.dirt);
 if(w.theme==='snow'){
  rect(x,y,b.w,7,b.material==='ice'?'#a9e5ef':'#f1fbf5');rect(x,y+7,b.w,7,b.material==='ice'?'#6ebbcf':'#dae5dd');if(b.material==='ice')for(let j=3;j<b.w;j+=13)rect(x+j,y+2,7,2,'#eaffff');
  for(let j=3;j<b.w;j+=17){rect(x+j,y+11,8,4,'#e5f6f0');if(platform)poly([[x+j,y+14],[x+j+6,y+14],[x+j+3,y+26]],'#c8e8e9');else{rect(x+j,y+24,3,14,'#b8d5df');rect(x+j+3,y+35,10,3,'#b8d5df');rect(x+j+7,y+56,9,4,'#aac9d5');}}
 }else if(w.theme==='lava'){
  rect(x,y,b.w,5,'#d4a07f');rect(x,y+5,b.w,5,'#997581');
  for(let j=4;j<b.w;j+=20){rect(x+j,y+13,11,3,'#877082');rect(x+j+9,y+16,3,platform?6:17,'#4e485e');if(!platform){rect(x+j+2,y+39,3,15,'#b27874');rect(x+j+5,y+51,7,3,'#b27874');}}
 }else if(['forest','desert','aurora'].includes(w.theme)){
  rect(x,y,b.w,6,w.grass);rect(x,y+6,b.w,4,w.theme==='desert'?'#f6d79d':'#91b7a0');for(let j=4;j<b.w;j+=16){rect(x+j,y+14,8,3,w.theme==='desert'?'#d5aa76':'#9b9c91');if(!platform)rect(x+j+3,y+35,6,4,w.theme==='desert'?'#86694f':'#545d73');}
 }else{
  rect(x,y,b.w,6,'#fff5dc');rect(x,y+6,b.w,5,'#d6dfc0');
  for(let j=0;j<b.w;j+=16){rect(x+j+3,y+11,7,4,'#bec8b7');if(platform)poly([[x+j+2,y+16],[x+j+14,y+16],[x+j+8,y+31]],'#aca7bc');else{rect(x+j+3,y+28,3,20,'#bab3c6');rect(x+j+6,y+51,6,4,'#8589a7');}}
 }
}
function atmosphere(){const theme=game.world.theme,c=game.camera;
 if(theme==='forest')for(let i=0;i<28;i++){const x=(hash(i+145)*viewW-c*.3+visualTime*8+viewW*20)%viewW,y=180+hash(i+160)*195+Math.sin(visualTime+i)*8;ctx.globalAlpha=.4+.4*Math.sin(visualTime*2+i)**2;rect(x,y,3,3,'#e6f3a5');ctx.globalAlpha=1;}
 if(theme==='desert')for(let i=0;i<18;i++){const x=(hash(i+185)*viewW+visualTime*26-c*.2+viewW*20)%viewW;rect(x,300+hash(i+195)*85,5,1,'#f4dfb6');}
 if(theme==='snow')for(let i=0;i<42;i++){const x=(hash(i+81)*viewW+visualTime*(8+hash(i)*8)-c*.14+viewW*10)%viewW,y=(hash(i+93)*480+visualTime*(15+hash(i+3)*14))%480;rect(x,y,i%4?2:3,3,'#f8fff5');}
 if(theme==='lava')for(const [a,b] of game.gaps){const x=a*32-c,width=(b-a)*32;if(x>viewW||x+width<0)continue;rect(x,442,width,38,'#d96f4d');rect(x,442,width,5,'#f3bd73');for(let j=0;j<width;j+=16){rect(x+j,443+Math.sin(visualTime*3+j)*2,12,3,'#ffe0a0');rect(x+j+4,458+Math.sin(visualTime*2+j)*4,7,3,'#f2a663');const py=442-((visualTime*24+j*3)%54);rect(x+j+7,py,2,3,'#f1bc82');}}
}
function themeBackdrop(){const w=game.world,c=game.camera;
 if(w.theme==='aurora'){ctx.save();ctx.globalAlpha=.18;for(let i=0;i<28;i++){const x=i*40-(c*.06)%40,y=80+Math.sin(i*.3+visualTime*.15)*28;rect(x,y,28,90,'#81dbc1');rect(x+10,y+40,18,75,'#9aa4db');}ctx.restore();}
 if(w.theme==='desert')for(let i=-1;i<6;i++){const x=i*300-(c*.25)%300;rect(x+60,280,20,110,'#c4a178');rect(x+54,274,32,12,'#e1bd8d');rect(x+140,306,20,84,'#c4a178');rect(x+134,300,32,12,'#e1bd8d');rect(x+68,280,6,103,'#dcb786');}
 if(w.theme==='sky'){for(let i=-1;i<8;i++)cloud(i*190-(c*.27)%190,342+Math.sin(i)*24,2.8,'#e8edf0');const bx=viewW*.72-c*.04%100;const by=151+Math.sin(visualTime*.7)*6;rect(bx,by,38,25,'#e1af84');rect(bx+6,by-8,26,42,'#f3d19b');rect(bx+15,by-8,9,42,'#f9e7c2');rect(bx+8,by+34,2,13,'#b69985');rect(bx+28,by+34,2,13,'#b69985');rect(bx+7,by+47,25,12,'#b89375');}
 if(w.theme==='lava'){for(let i=-1;i<5;i++){const x=i*340-(c*.23)%340;poly([[x,390],[x+94,216],[x+150,216],[x+263,390]],'#5b495b');rect(x+94,216,56,8,'#d7997c');poly([[x+118,224],[x+134,224],[x+146,263],[x+130,263],[x+140,311],[x+125,311]],'#a26968');cloud(x+88,172,1.1,'#8b737d');}}
}
function tile(b){if(b.safety){for(let j=0;j<b.w;j+=32)tile({...b,x:b.x+j,w:32,safety:false});return;}const x=b.x-game.camera,y=b.y-Math.sin((b.bump||0)/.18*Math.PI)*7,w=game.world;if(x< -b.w||x>viewW)return;if(w.theme&&(b.type==='ground'||b.type==='platform')){themeTerrain(b,x,y,w);return;}
 if(b.type==='ground'){rect(x,y,b.w,b.h,w.dirt);rect(x,y,32,8,w.grass);rect(x,y,32,3,w.night?'#a4b99a':'#b2c487');rect(x+4,y+8,10,4,w.grass);rect(x+22,y+7,7,5,w.grass);rect(x,y+14,32,2,w.night?'#827780':'#c28c61');rect(x+31,y+14,1,66,w.night?'#5c596d':'#946846');for(let k=0;k<5;k++){const px=4+Math.floor(hash(b.x+k)*22),py=21+k*11;rect(x+px,y+py,5,3,w.night?'#857687':'#cc9264');rect(x+px+4,y+py+3,3,2,w.night?'#585c71':'#946444');}}
 else if(b.type==='platform'){rect(x,y,b.w,6,w.night?'#a3c0a5':'#cad59d');rect(x,y+6,b.w,7,w.grass);rect(x+6,y+13,b.w-12,5,w.dirt);for(let j=8;j<b.w;j+=18)rect(x+j,y+16,6,7,w.dirt);}
 else if(b.type==='box'){rect(x,y,32,32,'#9c643c');rect(x+2,y+2,28,26,'#efb45e');rect(x+4,y+3,25,3,'#ffdc89');rect(x+4,y+28,26,3,'#b77b45');text('?',x+16,y+24,23,'#8b643d','center');rect(x+3,y+4,2,2,'#986f43');rect(x+27,y+25,2,2,'#986f43');}
 else if(b.type==='used'){rect(x,y,32,32,'#957454');rect(x+2,y+2,28,27,'#b39c73');rect(x+5,y+5,22,2,'#cabb90');for(const dx of [5,25])for(const dy of [6,25])rect(x+dx,y+dy,2,2,'#8a7957');}
 else if(b.type==='brick'){rect(x,y,32,32,'#896c4e');rect(x+1,y+1,30,29,'#bb9268');rect(x+2,y+2,28,3,'#d4b082');rect(x,y+14,32,2,'#8a6d50');rect(x+15,y,2,14,'#8a6d50');rect(x+7,y+16,2,15,'#8a6d50');rect(x+25,y+16,2,15,'#8a6d50');rect(x+2,y+17,4,2,'#d4b082');rect(x+10,y+17,13,2,'#d4b082');}
 else{rect(x,y,b.w,b.h,'#88977c');rect(x+2,y+2,b.w-4,b.h-4,'#a9b194');rect(x+4,y+4,b.w-8,4,'#ccd0ae');rect(x+4,y+10,3,b.h-16,'#bac2a2');for(let py=32;py<b.h;py+=32)rect(x,y+py,32,2,'#88977c');}
}
function coin(c){const x=c.x-game.camera,y=c.y+Math.sin(visualTime*3+c.x)*2,ww=4+Math.abs(Math.cos(visualTime*3+c.x*.01))*9;rect(x+(12-ww)/2,y,ww,18,'#b77c35');rect(x+(12-ww)/2+2,y-2,ww-4,22,'#d8a045');rect(x+(12-ww)/2+2,y+1,Math.max(2,ww-4),16,'#f5cd69');rect(x+5,y+3,2,10,'#fff0a2');}
function star(s){const x=s.x-game.camera,y=s.y+Math.sin(visualTime*3+s.x)*4;poly([[x+11,y],[x+15,y+7],[x+23,y+7],[x+18,y+13],[x+20,y+22],[x+11,y+17],[x+2,y+22],[x+4,y+13],[x-1,y+7],[x+7,y+7]],'#b28c4b');poly([[x+11,y+3],[x+14,y+9],[x+20,y+9],[x+15,y+13],[x+17,y+18],[x+11,y+15],[x+5,y+18],[x+7,y+12],[x+2,y+9],[x+9,y+9]],'#fff0a1');rect(x+9,y+9,2,3,'#9d8049');rect(x+14,y+9,2,3,'#9d8049');}
function enemy(e){if(!e.alive&&!e.flat)return;const x=e.x-game.camera,y=e.y;if(x< -50||x>viewW+50)return;ctx.save();ctx.translate(Math.round(x+14),Math.round(y+24));if(!e.alive)ctx.scale(1.15,.3);const wig=Math.sin(visualTime*10+e.x)*2;rect(-14,-16,28,12,'#496855');rect(-11,-22,22,17,'#627f61');rect(-6,-26,11,6,'#84996f');rect(-9,-19,7,5,'#8eaa7a');rect(-15,-8,30,6,'#355546');rect(-9,-13,6,7,'#eee9c9');rect(4,-13,6,7,'#eee9c9');rect(e.vx>0?-5:-8,-11,3,4,'#304a3b');rect(e.vx>0?8:5,-11,3,4,'#304a3b');rect(-12,-3,8,4+wig,'#334a3b');rect(5,-3,8,4-wig,'#334a3b');ctx.restore();}
function player(){if(game.mode==='won')return;const p=game.player;if(p.invuln>0&&Math.floor(visualTime*14)%2)return;const x=p.x-game.camera+p.w/2,y=p.y+p.h;ctx.save();ctx.translate(Math.round(x),Math.round(y));if(game.mode==='finishing')ctx.globalAlpha=Math.max(0,Math.min(1,(1.6-game.finishTime)/.35));ctx.scale(p.face,1);if(game.mode==='dying')ctx.rotate(-.35);const squash=p.land/.16;ctx.scale(1+squash*.15,1-squash*.12);if(p.skid)ctx.transform(1,0,-.12,1,0,0);let walk=p.grounded?Math.sin(visualTime*(Math.abs(p.vx)>210?24:17))*Math.min(3,Math.abs(p.vx)/55):2;
 // Hand-drawn pixel sprite: a tangerine explorer with a leaf, scarf and tiny backpack.
 rect(-12,-24,5,15,'#876a46');rect(-14,-21,3,9,'#b49762');rect(-7,-8,7,7+walk,'#365c49');rect(4,-8,7,7-walk,'#365c49');rect(-8,-2+walk,9,3,'#354b3d');rect(4,-2-walk,10,3,'#354b3d');
 const body=look==='mint'?['#559a83','#7bbd9a','#91cfa9','#c5e8bc']:look==='gold'?['#b99139','#d7b34e','#edcc63','#fff0a2']:['#db7c43','#e9964f','#eea75a','#f6bf77'];
 rect(-10,-21,22,14,body[0]);rect(-7,-25,16,20,body[1]);rect(-10,-31,22,15,body[2]);rect(-7,-35,16,5,body[2]);rect(-13,-27,28,10,body[2]);rect(-9,-32,16,4,body[3]);rect(0,-22,13,11,'#ffe0a0');rect(6,-27,3,5,'#3e4f3e');rect(7,-27,1,1,'#faf0cf');rect(11,-22,4,3,'#ce7b49');rect(-10,-13,22,4,'#f5d877');rect(-11,-12,7,10,'#f5d877');rect(-13,-11,4,7,'#d5b251');rect(-4,-11,6,6,'#f4b770');rect(-2,-8,5,5,'#ffcd87');rect(-1,-39,3,6,'#607448');rect(2,-40,9,4,'#607448');rect(5,-42,8,3,'#7f9553');ctx.restore();}
function flags(){if(game.practice)return;const cp=game.checkpoint,x=cp.x-game.camera;rect(x,331,4,69,'#7d8468');rect(x-2,327,8,7,'#d6cda2');poly([[x+4,333],[x+31,338],[x+4,355]],cp.active?'#ecaa61':'#adc1a0');if(cp.active)rect(x+8,338,6,6,'#fff0bb');
 const fx=game.flag.x-game.camera;rect(fx,244,5,156,'#566c54');rect(fx-2,238,9,9,'#efc56e');const flagY=game.mode==='won'?248:game.finishTime>0?354-Math.min(1,game.finishTime/.8)*106:354;poly([[fx+5,flagY],[fx+64,flagY],[fx+52,flagY+18],[fx+64,flagY+36],[fx+5,flagY+36]],'#e48f57');rect(fx+19,flagY+8,7,15,'#ffe0a0');rect(fx+15,flagY+12,15,7,'#ffe0a0');rect(fx-9,392,24,8,'#9b9e80');
 // The little home beyond the flag is the visual destination.
 const hx=fx+57;rect(hx,337,64,63,game.world.night?'#aa9b9c':'#e5d5ab');rect(hx+5,343,54,55,game.world.night?'#c5ae9d':'#f0e1b7');poly([[hx-10,339],[hx+32,301],[hx+74,339]],'#9b725b');rect(hx-8,336,80,6,'#795f51');rect(hx+27,367,18,33,'#7c8362');rect(hx+10,353,12,16,'#f6c86f');rect(hx+49,353,10,16,'#f6c86f');rect(hx+39,380,2,3,'#e6cf87');}
function effects(dt){for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=220*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);for(const f of floaters){f.y-=28*dt;f.life-=dt;}floaters=floaters.filter(f=>f.life>0);}
function processEvents(){for(const e of game.events){sfx(e.type);if(e.type==='star'&&!game.practice){starRecords=recordStar(starRecords,game.index,e.id);save();updateWorlds();}if(e.type==='respawn'||e.type==='finish'||e.type==='dead')clearInput();if(e.type==='land'){for(let i=0;i<5;i++)particles.push({x:e.x+12,y:e.y,vx:(Math.random()-.5)*65,vy:-15-Math.random()*35,life:.22,c:'#f0e5bc'});}if(['coin','star','stomp','checkpoint','win'].includes(e.type)){const n=e.type==='win'?70:10;for(let i=0;i<n;i++)particles.push({x:e.x,y:e.y,vx:(Math.random()-.5)*(e.type==='win'?500:130),vy:-Math.random()*190-35,life:.5+Math.random(),c:['#ffe6a0','#efa464','#f9f1ca','#8baa72'][i%4]});if(e.type!=='win')floaters.push({x:e.x+10,y:e.y-10,life:1.1,label:e.type==='coin'?'+100':e.type==='star'?'+500':e.type==='stomp'?'+200':'CHECKPOINT'});}
 if(e.type==='win'){if(!completed.includes(game.index))completed.push(game.index);save();updateWorlds();}
 }game.events.length=0;if(game.score>best)save();
 if(game.mode==='won'||game.mode==='dead'){save();clearInput();showOverlay();}}
let oldMode='ready';
function updateUI(){const m=game.mode==='paused'?game.resumeMode:game.mode;$('transition-veil').classList.toggle('visible',m==='respawning'||m==='dying');$('transition-veil').setAttribute('aria-hidden',String(m!=='respawning'&&m!=='dying'));$('transition-label').textContent=m==='dying'?'再试一次，下一跳会更好。':game.practice?'放心试跳，马上回来。':game.checkpoint.active?'回到检查点，继续冒险。':'回到起点，再跳一次。';$('hearts').textContent=game.practice?'∞':'♥ '.repeat(Math.max(0,game.hp))+'♡ '.repeat(3-Math.max(0,game.hp));$('coins').textContent=String(game.coinsCount).padStart(2,'0');$('stars').textContent=game.practice?'练习中':game.stars.map(s=>s.taken?'★':'☆').join(' ');$('score').textContent=String(game.score).padStart(6,'0');$('best').textContent=String(Math.max(best,game.score)).padStart(6,'0');$('progress').style.width=`${Math.min(100,game.player.x/game.flag.x*100)}%`;$('notice').style.opacity=game.notice>0?'1':'0';$('notice').setAttribute('aria-hidden',String(game.notice<=0));const time=`${Math.floor(game.time/60).toString().padStart(2,'0')}:${Math.floor(game.time%60).toString().padStart(2,'0')}`;$('status').textContent=game.mode==='ready'?'等待出发':game.mode==='paused'?'冒险已暂停':game.mode==='won'?'世界已通关':game.mode==='dead'?'再试一次吧':game.mode==='respawning'?'返回检查点':game.mode==='dying'?'别灰心，再试一次':game.mode==='finishing'?'好样的！回家啦':game.practice?'自由练习 · 不扣生命':`冒险中 · ${time}`;}
function draw(){ctx.imageSmoothingEnabled=false;background();themeBackdrop();decorations();flags();for(const b of game.solids)tile(b);for(const c of game.coins)if(!c.taken&&c.x>game.camera-32&&c.x<game.camera+viewW)coin(c);for(const s of game.stars)if(!s.taken)star(s);for(const e of game.enemies)enemy(e);atmosphere();player();for(const p of particles)rect(p.x-game.camera,p.y,3,3,p.c);for(const f of floaters){ctx.globalAlpha=Math.min(1,f.life*2);text(f.label,f.x-game.camera,f.y,13,game.world.night?'#fff0b4':'#53714a','center');ctx.globalAlpha=1;}if(game.mode==='ready'){text('YOU',game.player.x-game.camera+12,game.player.y-55,10,'#547450','center');poly([[game.player.x+8-game.camera,game.player.y-49],[game.player.x+16-game.camera,game.player.y-49],[game.player.x+12-game.camera,game.player.y-44]],'#547450');}}
function frame(now){const dt=Math.min(.05,(now-last)/1000||0);last=now;if(game.mode!=='paused'){visualTime+=dt;effects(dt);}if(activeModes.includes(game.mode)){accumulator+=dt;while(accumulator>=1/120){step(game,1/120,input());accumulator-=1/120;}music(dt);}else accumulator=0;if(game.events.length)processEvents();if(oldMode!==game.mode){showOverlay();oldMode=game.mode;}updateUI();draw();requestAnimationFrame(frame);}
updateWorlds();showOverlay();resize();requestAnimationFrame(frame);
