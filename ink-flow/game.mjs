import {W,H,clamp,createGame,step,dash} from './engine.mjs';
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d'),trail=document.createElement('canvas'),tx=trail.getContext('2d');
let game=createGame(),input={x:600,y:425,held:false},keys=new Set(),best=0,soundOn=false,audio=null,last=0,t=0,view={s:1,x:0,y:0,w:0,h:0},pointer=null,buttonHeld=false,keyboardWasMoving=false;
const names=['微光','涟漪','潮汐','深流','海洋'];
try{best=Number(localStorage.getItem('ink-flow-best'))||0}catch{}
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);const previousWidth=game.width;game.width=clamp(H*r.width/r.height,480,1800);game.player.x=clamp(game.player.x/previousWidth*game.width,game.player.r,game.width-game.player.r);for(const a of game.drops)a.x=clamp(a.x/previousWidth*game.width,a.r,game.width-a.r);input.x=clamp(input.x/previousWidth*game.width,0,game.width);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);trail.width=canvas.width;trail.height=canvas.height;view={s:Math.min(canvas.width/game.width,canvas.height/H),x:0,y:0,w:canvas.width,h:canvas.height};view.x=(view.w-game.width*view.s)/2;view.y=(view.h-H*view.s)/2}
new ResizeObserver(resize).observe(canvas);
function world(c){c.translate(view.x,view.y);c.scale(view.s,view.s)}
function blob(c,x,y,r,phase,color,stretch=1,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.scale(stretch,1/Math.sqrt(stretch));c.beginPath();for(let i=0;i<=48;i++){let a=i/48*Math.PI*2,rr=r*(1+.09*Math.sin(a*3+phase)+.055*Math.sin(a*5-phase*1.3));let px=Math.cos(a)*rr,py=Math.sin(a)*rr;i?c.lineTo(px,py):c.moveTo(px,py)}c.closePath();c.fillStyle=color;c.fill();c.restore()}
function tone(freq=440){if(!soundOn)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});let o=audio.createOscillator(),v=audio.createGain();o.connect(v);v.connect(audio.destination);o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.6,audio.currentTime+.18);v.gain.setValueAtTime(.035,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.2);o.start();o.stop(audio.currentTime+.21)}catch{}}
function clearInput(){keys.clear();input.held=false;buttonHeld=false;pointer=null}
function begin(){game=createGame(Math.random,game.width);game.mode='playing';input={x:game.width/2,y:425,held:false};clearInput();tx.clearRect(0,0,trail.width,trail.height);$('overlay').hidden=true;canvas.focus({preventScroll:true});tone(280);update()}
function showOverlay(title,body,button){$('overlayTitle').textContent=title;$('overlayText').textContent=body;$('start').textContent=button;$('overlayTag').textContent=game.mode==='ended'?'EVERY DROP BECOMES A STORY.':'TAKE A BREATH. THE OCEAN CAN WAIT.';$('overlay').hidden=false}
function pause(){if(game.mode==='playing'){game.mode='paused';clearInput();showOverlay('让水面静一会儿。','准备好后，继续你的这片海。','继续流动 ↗')}else if(game.mode==='paused'){game.mode='playing';$('overlay').hidden=true}update()}
function finish(){clearInput();best=Math.max(best,game.score);try{localStorage.setItem('ink-flow-best',String(best))}catch{}showOverlay(game.health?'你已汇成一片海。':'这一滴，游了很远。',`获得 ${game.score} 分 · 吸收 ${game.absorbed} 滴 · ${names[game.level-1]}形态。${game.health?'三分钟旅程完成。':'纯净度耗尽，下次记得用冲刺穿过污染物。'}`,'再流动一次 ↗');tone(220)}
function doDash(){if(dash(game,input))tone(160)}
$('start').onclick=()=>{if(game.mode==='paused')pause();else begin()};$('restart').onclick=begin;$('pause').onclick=pause;$('dash').onclick=doDash;
$('sound').onclick=()=>{soundOn=!soundOn;$('sound').textContent='声音 '+(soundOn?'开':'关');$('sound').setAttribute('aria-pressed',String(soundOn));tone()};
function point(e){const r=canvas.getBoundingClientRect();input.x=clamp(((e.clientX-r.left)*canvas.width/r.width-view.x)/view.s,0,game.width);input.y=clamp(((e.clientY-r.top)*canvas.height/r.height-view.y)/view.s,0,H)}
canvas.onpointermove=e=>{if(e.pointerType==='mouse'||pointer===e.pointerId)point(e)};
canvas.onpointerdown=e=>{if(game.mode!=='playing'||pointer!==null)return;point(e);pointer=e.pointerId;canvas.setPointerCapture(e.pointerId);input.held=true};
function release(e){if(e.pointerId===pointer){pointer=null;input.held=false}}
canvas.onpointerup=release;canvas.onpointercancel=release;canvas.onlostpointercapture=release;
$('vortex').onpointerdown=e=>{if(game.mode!=='playing')return;buttonHeld=true;$('vortex').setPointerCapture(e.pointerId);e.preventDefault()};
for(const name of ['pointerup','pointercancel','lostpointercapture'])$('vortex').addEventListener(name,()=>buttonHeld=false);
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='KeyP'){pause();return}if(game.mode!=='playing')return;keys.add(e.code);if(e.code==='ShiftLeft'||e.code==='ShiftRight')doDash()});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{clearInput();if(game.mode==='playing')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.mode==='playing')pause()});
function update(){
 $('score').textContent=String(game.score).padStart(4,'0');$('absorbed').textContent=game.absorbed+' 滴';$('best').textContent=best;$('clock').textContent=String(Math.floor(Math.ceil(game.time)/60)).padStart(2,'0')+':'+String(Math.ceil(game.time)%60).padStart(2,'0');$('level').textContent='0'+game.level+' / '+names[game.level-1];$('growth').style.width=(game.level===5?100:(game.absorbed%15)/15*100)+'%';$('next').textContent=game.level===5?'已成为海洋，继续创造最佳成绩':`再吸收 ${15-game.absorbed%15} 滴，长成${names[game.level]}`;$('health').textContent=Math.round(game.health)+'%';$('healthBar').style.width=game.health+'%';$('energy').textContent=Math.floor(game.energy)+'%';$('energyBar').style.width=game.energy+'%';$('combo').textContent=game.combo>2?`连续吸收 ×${game.combo} · 分数加成中`:'慢慢游，也会长大。';$('dash').disabled=game.mode!=='playing'||game.cooldown>0||game.energy<25;$('dashLabel').textContent=game.cooldown>0?`${game.cooldown.toFixed(1)} 秒后就绪`:game.energy<25?'需要 25 能量':'打散污染物 · Shift';$('vortex').classList.toggle('active',game.mode==='playing'&&game.vortex);$('pause').textContent=game.mode==='paused'?'▷ 继续':'Ⅱ 暂停';$('pause').disabled=!['playing','paused'].includes(game.mode);$('flowLabel').textContent=game.mode==='playing'&&game.vortex?'旋涡吸收中':game.mode==='paused'?'水面已静止':'自由流动';
}
function draw(dt){
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#e6eee4';ctx.fillRect(0,0,view.w,view.h);
 const moving=game.mode==='playing'||game.mode==='ready';
 if(moving){tx.save();tx.globalCompositeOperation='destination-out';tx.fillStyle=`rgba(0,0,0,${1-Math.exp(-dt*1.45)})`;tx.fillRect(0,0,trail.width,trail.height);tx.restore();tx.save();world(tx);const p=game.player;
 for(const a of game.drops){blob(tx,a.x,a.y,a.r*1.6,t*.6+a.phase,a.kind==='food'?'#237d6510':'#c56b6610')}
 if(game.mode==='playing'){blob(tx,p.x,p.y,p.r*1.17,t,'#166e5836',1+Math.hypot(p.vx,p.vy)/900,Math.atan2(p.vy,p.vx));}
 tx.restore();}
 ctx.save();world(ctx);
 // Slow streamlines give the water depth, while the ink leaves persistent pigment trails.
 ctx.strokeStyle='#7d9d8520';ctx.lineWidth=.7;
 for(let row=0;row<14;row++){ctx.beginPath();for(let x=-60;x<game.width+60;x+=16){let y=row*75+Math.sin(x*.006+t*.13+row*.7)*25+Math.sin(x*.012-row)*9;x===-60?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke()}
 ctx.restore();ctx.drawImage(trail,0,0);ctx.save();world(ctx);
 for(const a of game.drops){const color=a.kind==='food'?'#347e69':'#be766f';blob(ctx,a.x,a.y,a.r*2.3,t*.5+a.phase,a.kind==='food'?'#458f7210':'#c97c7313');blob(ctx,a.x,a.y,a.r,t+a.phase,color,1.08,Math.atan2(a.vy,a.vx));blob(ctx,a.x-a.r*.22,a.y-a.r*.24,a.r*.42,a.phase,a.kind==='food'?'#a4c0a670':'#e8b1a27a');if(a.kind==='enemy'){ctx.strokeStyle='#965a5255';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x-3,a.y-3);ctx.lineTo(a.x+3,a.y+3);ctx.moveTo(a.x+3,a.y-3);ctx.lineTo(a.x-3,a.y+3);ctx.stroke()}}
 const p=game.player;if(game.vortex&&game.mode==='playing'){const radius=180+game.level*12;for(let j=0;j<5;j++){ctx.beginPath();for(let i=0;i<65;i++){let r=radius*i/65,a=t*3+j*Math.PI*2/5+i*.055;let x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.strokeStyle='#4e987840';ctx.lineWidth=1.4;ctx.stroke()}ctx.setLineDash([2,10]);ctx.strokeStyle='#397b6233';ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}
 const v=Math.hypot(p.vx,p.vy),angle=Math.atan2(p.vy,p.vx);const aura=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*3);aura.addColorStop(0,'#11604728');aura.addColorStop(1,'#11604700');ctx.fillStyle=aura;ctx.fillRect(p.x-p.r*3,p.y-p.r*3,p.r*6,p.r*6);
 for(let i=5;i>=1;i--)blob(ctx,p.x-Math.cos(angle)*i*v*.024,p.y-Math.sin(angle)*i*v*.024,p.r*(1-i*.125),t+i*.3,'#236f5924');
 blob(ctx,p.x,p.y,p.r,t,game.hurt>0&&Math.floor(game.hurt*10)%2?'#b7856d':'#1c6653',1+v/850,angle);blob(ctx,p.x-p.r*.18,p.y-p.r*.23,p.r*.6,-t*.6,'#528f7280');blob(ctx,p.x-p.r*.3,p.y-p.r*.35,p.r*.23,t,'#b1c8a88a');
 if(game.mode==='ready'){ctx.fillStyle='#416b57';ctx.font='10px Arial';ctx.textAlign='center';ctx.fillText('YOU',p.x,p.y+p.r+24)}
 for(const e of game.effects){ctx.globalAlpha=clamp(e.t*2,0,1);ctx.strokeStyle=e.kind==='food'?'#59937c':'#ba7168';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(e.x,e.y,10+(1-e.t)*40,0,Math.PI*2);ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.font='16px Arial';ctx.textAlign='center';ctx.fillText(e.text,e.x,e.y-(1-e.t)*50)}ctx.globalAlpha=1;ctx.restore();
}
function frame(now){const dt=Math.min((now-last)/1000||.016,.04);last=now;const moving=game.mode==='playing'||game.mode==='ready';if(moving)t+=dt;
 if(game.mode==='playing'){const kx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),ky=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);if(kx||ky){input.x=game.player.x+kx*100;input.y=game.player.y+ky*100}else if(keyboardWasMoving){input.x=game.player.x;input.y=game.player.y}keyboardWasMoving=!!(kx||ky);const prev=game.absorbed;step(game,dt,{...input,held:input.held||buttonHeld||keys.has('Space')});if(game.absorbed>prev)tone(330+game.combo*22);if(game.mode==='ended')finish()}
 draw(dt);update();requestAnimationFrame(frame)}
window.inkFlow={getState:()=>({mode:game.mode,score:game.score,absorbed:game.absorbed,level:game.level,health:game.health,energy:game.energy,time:game.time,player:{...game.player},drops:game.drops.map(d=>({...d}))})};resize();update();requestAnimationFrame(frame);
