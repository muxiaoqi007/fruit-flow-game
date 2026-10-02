import * as THREE from './vendor/three.module.js';
import {GelBody} from './gel.mjs?v=multi4';
import {SquishAudio} from './audio.mjs?v=play6';
import {ToyPlay} from './play.mjs?v=play6';
import {pressureProfile} from './pressure.mjs';
import {GripSet,ShapeChallenge} from './gestures.mjs?v=multi4';
const $=id=>document.getElementById(id),stage=$('stage'),canvas=$('canvas');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}catch(e){$('loading').textContent='3D 画面暂时无法启动，请开启浏览器硬件加速后刷新。';throw e;}
const mobileGPU=matchMedia('(pointer: coarse)').matches||innerWidth<700;
renderer.setPixelRatio(Math.min(devicePixelRatio,mobileGPU?1.5:2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.VSMShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,60);camera.position.set(0,2.85,9.8);camera.lookAt(0,1.65,0);
scene.add(new THREE.HemisphereLight(0xfff5e5,0x987c74,1.9));
const key=new THREE.DirectionalLight(0xfff3e4,2.8);key.position.set(-3,7,5);key.castShadow=true;key.shadow.mapSize.set(mobileGPU?512:1024,mobileGPU?512:1024);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=5;key.shadow.camera.bottom=-4;key.shadow.normalBias=.035;key.shadow.bias=-.0001;key.shadow.radius=9;key.shadow.blurSamples=8;scene.add(key);
const fill=new THREE.DirectionalLight(0xffddd6,1);fill.position.set(4,3,2);scene.add(fill);const rim=new THREE.DirectionalLight(0xffffff,2.3);rim.position.set(0,4,-3);scene.add(rim);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x65473b,opacity:.13}));floor.rotation.x=-Math.PI/2;floor.position.y=.04;floor.receiveShadow=true;scene.add(floor);
const texCanvas=document.createElement('canvas');texCanvas.width=texCanvas.height=128;const ctx=texCanvas.getContext('2d'),data=ctx.createImageData(128,128);let seed=8432;for(let i=0;i<data.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;let n=140+seed%110;data.data[i]=data.data[i+1]=data.data[i+2]=n;data.data[i+3]=255;}ctx.putImageData(data,0,0);const bump=new THREE.CanvasTexture(texCanvas);bump.wrapS=bump.wrapT=THREE.RepeatWrapping;bump.repeat.set(3,3);
const red=new THREE.MeshPhysicalMaterial({color:0xde3d40,roughness:.48,bumpMap:bump,bumpScale:.003,clearcoat:.22,clearcoatRoughness:.4,sheen:.12,sheenColor:0xf76d69,sheenRoughness:1});
const cream=new THREE.MeshPhysicalMaterial({color:0xffdfaa,roughness:.62,bumpMap:bump,bumpScale:.002,sheen:.1,sheenColor:0xfff1ce});
const purple=new THREE.MeshPhysicalMaterial({color:0x412335,roughness:.52,bumpMap:bump,bumpScale:.003,sheen:.15,sheenColor:0xa16e86});
const dark=new THREE.MeshPhysicalMaterial({color:0x352129,roughness:.3,clearcoat:.2});const blush=new THREE.MeshStandardMaterial({color:0xfb8279,roughness:1});const white=new THREE.MeshBasicMaterial({color:0xfff9ee});
const character=new THREE.Group();scene.add(character);const soft=new GelBody(),parts=[];let body;
function add(geometry,material,eye=false){const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;character.add(mesh);const rest=geometry.attributes.position.array.slice();const binds=[];for(let i=0;i<rest.length;i+=3)binds.push(soft.bind(rest[i],rest[i+1],rest[i+2]));const part={mesh,rest,binds,eye};parts.push(part);mesh.userData.skin=part;return mesh;}
function ellipsoid(x,y,z,sx,sy,sz,mat,segments=32,eye=false){const g=new THREE.SphereGeometry(1,segments,Math.max(16,segments/2));g.scale(sx,sy,sz);g.translate(x,y,z);return add(g,mat,eye);}
function curve(points,radius,mat){const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return add(new THREE.TubeGeometry(c,40,radius,10,false),mat);}
const power=(v,p)=>Math.sign(v)*Math.pow(Math.abs(v),p);
function buildRed(){
const bodyGeo=new THREE.SphereGeometry(1,80,64),pos=bodyGeo.attributes.position;
for(let i=0;i<pos.count;i++){
 const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),py=power(y,.59),width=1.23*(1-.12*Math.max(0,py));
 const px=power(x,.59)*width;let yy=1.65+py*1.4;
 // The folded left crest gives Xiaohong the asymmetric silhouette in the reference.
 yy+=.37*Math.exp(-((px+.52)**2/.19))*Math.pow(Math.max(0,y),4);
 pos.setXYZ(i,px,yy,power(z,.84)*.79);
}bodyGeo.computeVertexNormals();body=add(bodyGeo,red);
ellipsoid(0,1.8,.68,.89,1.035,.37,cream,64);
// Short feet, soft cuffs, and two curved mittens forming a heart-shaped opening.
ellipsoid(-.53,.16,.11,.32,.15,.39,purple);ellipsoid(.53,.16,.11,.32,.15,.39,purple);
ellipsoid(-.86,.9,.61,.27,.32,.25,red);ellipsoid(.86,.9,.61,.27,.32,.25,red);
for(const s of [-1,1]){
 curve([[s*.12,1.19,1.18],[s*.27,1.33,1.16],[s*.48,1.30,1.12],[s*.73,1.10,1.05],[s*.68,.96,1.1],[s*.40,.88,1.17],[s*.13,.73,1.18]],.18,purple);
 ellipsoid(s*.12,1.19,1.18,.175,.18,.18,purple,24);ellipsoid(s*.13,.73,1.18,.18,.18,.18,purple,24);
}
for(const s of [-1,1]){
 ellipsoid(s*.355,2.08,1.009,.13,.207,.077,dark,32,true);
 ellipsoid(s*.355-.035,2.153,1.08,.037,.05,.021,white,20,true);
 ellipsoid(s*.355+.039,1.997,1.072,.015,.021,.012,white,16,true);
 curve([[s*.23,2.47,.953],[s*.35,2.49,.965],[s*.47,2.42,.948]],.041,purple);
 ellipsoid(s*.61,1.85,.977,.14,.079,.035,blush,32);
}
curve([[-.22,1.79,1.061],[-.12,1.735,1.078],[0,1.72,1.085],[.12,1.735,1.078],[.22,1.79,1.061]],.037,dark);
for(const sign of [-1,1])ellipsoid(sign*.22,1.79,1.061,.037,.037,.037,dark,16);
ellipsoid(0,1.74,1.11,.21,.15,.035,dark,32);parts.at(-1).laugh=true;
}
const teal=new THREE.MeshPhysicalMaterial({color:0x43bfc0,roughness:.55,bumpMap:bump,bumpScale:.004,clearcoat:.13,sheen:.2,sheenColor:0x9aeee0});
const navy=new THREE.MeshPhysicalMaterial({color:0x152c58,roughness:.55,bumpMap:bump,bumpScale:.003});
const orange=new THREE.MeshPhysicalMaterial({color:0xff9a50,roughness:.6,side:THREE.DoubleSide});
const tealShell=teal.clone();tealShell.side=THREE.DoubleSide;
function buildQing(){
 const g=new THREE.SphereGeometry(1,72,56),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const y=p.getY(i),py=power(y,.67);p.setXYZ(i,power(p.getX(i),.68)*(1.02-.16*Math.max(0,py)),1.65+py*1.41,power(p.getZ(i),.84)*.73);}
 g.computeVertexNormals();body=add(g,teal);
 for(const s of [-1,1]){
  ellipsoid(s*.47,.16,.12,.31,.16,.36,navy);
  curve([[s*.85,1.42,.1],[s*1.10,1.17,.23],[s*1.18,.94,.39]],.115,navy);
  ellipsoid(s*1.18,.91,.42,.21,.23,.18,navy);
  ellipsoid(s*.33,2.08,.719,.14,.235,.065,navy,32,true);
  ellipsoid(s*.33-.028,2.166,.775,.036,.055,.02,white,20,true);
  curve([[s*.21,2.47,.66],[s*.31,2.51,.67],[s*.43,2.47,.65]],.035,navy);
 }
 curve([[-.20,1.74,.736],[-.11,1.66,.755],[0,1.64,.762],[.13,1.68,.75],[.21,1.77,.73]],.035,navy);
 // A hollow, curled hood: orange concave lining, turquoise shell and soft rolled rim.
 const hoodPath=new THREE.CubicBezierCurve3(new THREE.Vector3(-.32,2.72,-.05),new THREE.Vector3(-.38,3.68,.1),new THREE.Vector3(.78,3.12,.15),new THREE.Vector3(.72,2.71,.9));
 const rings=40,segments=48,rimPoints=[];
 function hood(t,a,inset=0){const center=hoodPath.getPoint(t),tangent=hoodPath.getTangent(t),side=new THREE.Vector3(1,0,0).cross(tangent).normalize(),up=tangent.clone().cross(side).normalize();const r=.43-.1*t-inset;return center.addScaledVector(side,Math.cos(a)*r).addScaledVector(up,Math.sin(a)*r*.85).toArray();}
 for(const inside of [false,true]){const positions=[],indices=[];for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++)positions.push(...hood(j/rings,i/segments*Math.PI*2,inside?.045:0));for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();add(geo,inside?orange:tealShell);}
 for(let i=0;i<=segments;i++)rimPoints.push(hood(1,i/segments*Math.PI*2,.02));curve(rimPoints,.027,teal);
 ellipsoid(0,1.72,.8,.20,.15,.035,navy,32);parts.at(-1).laugh=true;
}
let activeCharacter='red';buildRed();

const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d'),gradient=sc.createRadialGradient(64,64,2,64,64,62);gradient.addColorStop(0,'rgba(90,57,44,0.27)');gradient.addColorStop(.5,'rgba(90,57,44,0.10)');gradient.addColorStop(1,'rgba(90,57,44,0)');sc.fillStyle=gradient;sc.fillRect(0,0,128,128);const contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(3.6,2.7),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));contactShadow.rotation.x=-Math.PI/2;contactShadow.position.y=.047;scene.add(contactShadow);
const squishAudio=new SquishAudio(),toyPlay=new ToyPlay();
let wasEngaged=false,shapeBounds={width:2.5,height:3.35};
let mode='knead',count=0,toastTimer,rotY=-.10,rotX=0,pointer=new THREE.Vector2(),gaze={x:0,y:0},drag=null,hugUntil=0,clock=0,lastTime=0,accumulator=0;
let pressureGain=.6,currentPressure=0,play=null,gestureSource='hold';
const grips=new GripSet(5),challenge=new ShapeChallenge(),markers=new Map();
const pointers=grips.contacts,raycaster=new THREE.Raycaster(),normal=new THREE.Vector3(),target=new THREE.Vector3(),d=new Float32Array(3),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function resize(){const r=stage.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.position.z=innerWidth<700?8.3:9.3;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(stage);resize();
function point(e){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);return r;}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2100);}
function increment(){count++;$('squeezeCount').innerHTML=`已经陪你揉了 <b>${count}</b> 下`;if(count===10||count===30||count===100)toast(['今天的你，也值得被温柔对待','坏心情，正在一点点松开'][count===30?1:0]);}
function setMode(value){mode=value;endDrag();toyPlay.reset();soft.reset();rotX=0;play=null;hugUntil=0;document.querySelectorAll('[data-mode]').forEach(b=>{const active=b.dataset.mode===mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});$('tip').textContent={knead:'最多 5 指抓揉 · 分开拉长 · 合拢夹挤',stretch:'每根手指抓一处 · 各自拉扯 · 转动双指拧麻花',tickle:'按住肚子来回挠 · 越挠越痒 · 停下就缓过来',rocker:'按住推歪 · 松手摇回来 · 怎么推都不倒',rotate:'左右拖动看看我 · 双击回到正面'}[mode];$('cursor').firstElementChild.textContent={knead:'按住揉捏',stretch:'抓住拉伸',tickle:'挠挠肚子',rocker:'推一推',rotate:'拖动旋转'}[mode];}
function endDrag(){toyPlay.target=null;if(drag)squishAudio.release();wasEngaged=false;drag=null;soft.contact=null;currentPressure=0;const ids=[...pointers.keys()];grips.clear();for(const id of ids){markers.get(id)?.remove();markers.delete(id);if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}}
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
 if((e.pointerType==='mouse'&&e.button!==0)||pointers.size>=grips.limit)return;
 e.preventDefault();point(e);const hits=raycaster.intersectObjects(character.children);if(!hits.length&&mode!=='rotate')return;
 play=null;hugUntil=0;
 const hit=hits[0]?.point??new THREE.Vector3(0,1.7,0);normal.copy(camera.position).sub(hit).normalize();const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,hit);
 const local=character.worldToLocal(hit.clone()),restPoint=local.clone();
 if(hits[0]?.face){
  const mesh=hits[0].object,part=mesh.userData.skin,face=hits[0].face,attr=mesh.geometry.attributes.position;
  const a=new THREE.Vector3().fromBufferAttribute(attr,face.a),b=new THREE.Vector3().fromBufferAttribute(attr,face.b),c=new THREE.Vector3().fromBufferAttribute(attr,face.c);
  const bary=THREE.Triangle.getBarycoord(local,a,b,c,new THREE.Vector3());
  if(part&&bary)restPoint.set(...[0,1,2].map(axis=>part.rest[face.a*3+axis]*bary.x+part.rest[face.b*3+axis]*bary.y+part.rest[face.c*3+axis]*bary.z));
 }
 const grip=grips.start(e.pointerId,{point:restPoint.toArray(),plane,startLocal:local.clone(),startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,rotY,rotX,rockAngle:toyPlay.angle,rockPitch:toyPlay.pitch,time:clock,previous:[0,0,0],local:false},e);
 if(!grip)return;canvas.setPointerCapture(e.pointerId);drag=pointers.values().next().value;
 if(pointers.size>1)for(const g of pointers.values())g.local=true;
 const marker=document.createElement('div');marker.className='touch-marker';const occupied=new Set([...markers.values()].map(m=>m.dataset.color));const color=[0,1,2,3,4].find(n=>!occupied.has(String(n)));marker.dataset.color=color;marker.style.setProperty('--touch-color',['#d87d62','#829966','#ad87b4','#6d9dac','#c7a05b'][color]);marker.textContent='';$('touchPoints').appendChild(marker);markers.set(e.pointerId,marker);
 $('floatNote').style.opacity=0;if(mode!=='rotate'){increment();if(pointers.size===1){squishAudio.press(mode);}}
});
canvas.addEventListener('pointermove',e=>{
 const rect=point(e);gaze.x=pointer.x;gaze.y=pointer.y;
 if(e.pointerType!=='touch'){$('cursor').style.left=`${e.clientX-rect.left}px`;$('cursor').style.top=`${e.clientY-rect.top}px`;const hits=raycaster.intersectObject(body);$('cursor').style.display=hits.length?'block':'none';}
 const old=pointers.get(e.pointerId),distance=old?Math.hypot(e.clientX-old.x,e.clientY-old.y):0;
 const grip=grips.move(e.pointerId,e);if(!grip)return;
 if(mode==='tickle'){const hit=raycaster.intersectObjects(character.children)[0];const p=hit?character.worldToLocal(hit.point.clone()):null;toyPlay.stroke(distance,!!p&&p.y>.8&&p.y<2.12&&p.z>.3);return;}
 if(mode==='rocker'){if(grip.id===drag?.id)toyPlay.target=[THREE.MathUtils.clamp(grip.rockAngle-(e.clientX-grip.startX)/180,-.95,.95),THREE.MathUtils.clamp(grip.rockPitch+(e.clientY-grip.startY)/240,-.5,.5)];return;}
 if(mode==='rotate'){if(grip.id===drag?.id){rotY=grip.rotY+(e.clientX-grip.startX)*.009;rotX=THREE.MathUtils.clamp(grip.rotX+(e.clientY-grip.startY)*.004,-.35,.35);}return;}
 if(raycaster.ray.intersectPlane(grip.plane,target)){const local=character.worldToLocal(target.clone());const limit=mode==='stretch'?2.1:1.5;grip.delta=local.sub(grip.startLocal).clampLength(0,limit).toArray();}

});
// Force changes may arrive without a position change on pressure-capable touch screens.
canvas.addEventListener('pointerrawupdate',e=>pointers.get(e.pointerId)?.pressure.observe(e));
for(const type of ['touchmove','touchforcechange'])canvas.addEventListener(type,e=>{
 const unmatched=new Set(pointers.values());for(const touch of e.changedTouches||[]){let closest=null,best=28;for(const g of unmatched){const distance=Math.hypot(g.x-touch.clientX,g.y-touch.clientY);if(distance<best){best=distance;closest=g;}}if(closest){closest.pressure.observeTouch(touch.force);unmatched.delete(closest);}}
},{passive:true});
function release(e){
 const grip=grips.end(e.pointerId);if(!grip)return;
 markers.get(e.pointerId)?.remove();markers.delete(e.pointerId);
 if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
 if(e.type==='pointerup'&&['knead','stretch'].includes(mode)&&clock-grip.time<.23&&grip.travel<9){soft.poke(grip.point,.55+pressureGain*.35);squishAudio.accent('touch',.55);}
 drag=pointers.values().next().value||null;
 if(!drag){toyPlay.target=null;soft.contact=null;currentPressure=0;squishAudio.release();wasEngaged=false;}
 else if(mode==='rocker'){drag.rockAngle=toyPlay.angle;drag.rockPitch=toyPlay.pitch;drag.startX=drag.x;drag.startY=drag.y;}
 else if(mode==='rotate'){drag.rotY=rotY;drag.rotX=rotX;drag.startX=drag.x;drag.startY=drag.y;}
}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);canvas.addEventListener('pointerleave',()=>{$('cursor').style.display='none';if(!drag)gaze.x=gaze.y=0;});
canvas.addEventListener('dblclick',()=>{if(mode==='rotate'){rotY=-.1;rotX=0;toast('转回来啦，还是最喜欢看着你');}});
window.addEventListener('blur',()=>{endDrag();hugUntil=0;play=null;squishAudio.silence();});document.addEventListener('visibilitychange',()=>{if(document.hidden){endDrag();hugUntil=0;play=null;squishAudio.silence();}lastTime=0;accumulator=0;});
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
$('softness').addEventListener('input',e=>{soft.softness=Number(e.target.value)/100;$('softValue').textContent=soft.softness<.33?'弹弹软':soft.softness<.75?'糯叽叽':'棉花糖';});
function setPressureGain(value){pressureGain=THREE.MathUtils.clamp(Number(value)/100,.1,1);$('pressureGain').value=Math.round(pressureGain*100);$('gainValue').textContent=Math.round(pressureGain*100)+'%';document.querySelectorAll('[data-pressure]').forEach(b=>{const selected=Number(b.dataset.pressure)===Math.round(pressureGain*100);b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});}
$('pressureGain').addEventListener('input',e=>setPressureGain(e.target.value));
document.querySelectorAll('[data-pressure]').forEach(b=>b.addEventListener('click',()=>setPressureGain(b.dataset.pressure)));
$('sound').addEventListener('click',()=>{squishAudio.setEnabled(!squishAudio.enabled);$('sound').setAttribute('aria-pressed',squishAudio.enabled);$('sound').querySelector('span').textContent=squishAudio.enabled?'声音开':'声音关';});
document.querySelectorAll('[data-sound]').forEach(b=>b.addEventListener('click',async()=>{squishAudio.setStyle(b.dataset.sound);document.querySelectorAll('[data-sound]').forEach(option=>{option.classList.toggle('selected',option===b);option.setAttribute('aria-pressed',option===b);});await squishAudio.unlock();squishAudio.accent('release',.5);}));
function reset(){endDrag();toyPlay.reset();soft.reset();hugUntil=0;play=null;rotY=-.1;rotX=0;gaze.x=gaze.y=0;toast('呼，又是蓬蓬松松的一只');}
const settingsDialog=$('settingsDialog');
for(const selector of ['.play-tools','.character-card','.pressure-panel'])$('settingsContent').appendChild(document.querySelector(selector));
$('openSettings').addEventListener('click',()=>{endDrag();hugUntil=0;play=null;settingsDialog.showModal();});
$('closeSettings').addEventListener('click',()=>settingsDialog.close());
settingsDialog.addEventListener('click',e=>{if(e.target===settingsDialog){const r=settingsDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)settingsDialog.close();}});
function switchCharacter(id){
 if(!['red','qing'].includes(id)||activeCharacter===id)return;
 endDrag();toyPlay.reset();soft.reset();hugUntil=0;play=null;challenge.reset();rotY=-.1;rotX=0;gaze.x=gaze.y=0;lookX=lookY=0;
 for(const part of parts){character.remove(part.mesh);part.mesh.geometry.dispose();}parts.length=0;
 activeCharacter=id;if(id==='qing')buildQing();else buildRed();
 const name=id==='qing'?'小青':'小红';document.body.dataset.character=id;
 document.title=name+' · 揉揉 / A little softer';$('canvas').setAttribute('aria-label','可揉捏的三维'+name);stage.setAttribute('aria-label',name+' 3D 互动区：最多五指同时抓取、拉扯、挤压和扭动');
 document.querySelector('.name-tag>span').textContent=name;document.querySelector('.edition').textContent=id==='qing'?'MEET XIAOQING · 小青':'MEET XIAOHONG · 小红';
 document.querySelector('.card-top').textContent=name+'今天的状态';document.querySelector('.material').textContent=id==='qing'?'薄荷青 · 软胶手感':'草莓红 · 软胶手感';
 document.querySelectorAll('button[data-character]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.character===id));
 try{localStorage.setItem('squish-character',id);}catch{}
 toast(name+'来陪你啦');
}
document.querySelectorAll('button[data-character]').forEach(b=>b.addEventListener('click',()=>switchCharacter(b.dataset.character)));
function hug(){if(['tickle','rocker'].includes(mode))setMode('knead');endDrag();play=null;increment();squishAudio.press('knead');hugUntil=clock+2.5;toast('把烦恼捏扁，再慢慢蓬松回来 ♡');}
function playAction(kind){
 if(['tickle','rocker'].includes(mode))setMode('knead');settingsDialog.close();
 endDrag();hugUntil=0;increment();squishAudio.press(kind==='twist'?'stretch':'knead');
 if(kind==='tap'){play=null;soft.poke([0,2,.8],.6+pressureGain*.5);toast('拍一拍，烦恼弹走啦');return;}
 play={kind,start:clock,duration:kind==='shake'?1.8:2.8};
 toast(kind==='shake'?'抖抖抖，把坏心情抖掉':'拧个麻花，松手就舒展开');
}
document.querySelectorAll('[data-play]').forEach(b=>b.addEventListener('click',()=>playAction(b.dataset.play)));
$('challenge').addEventListener('click',()=>{if(['tickle','rocker'].includes(mode))setMode('knead');settingsDialog.close();if(challenge.active){challenge.reset();toast('继续随心揉揉');}else{challenge.start();toast('不计时，试试三种软乎乎的造型');}});
$('reset').addEventListener('click',reset);$('hug').addEventListener('click',hug);
window.addEventListener('keydown',e=>{if(settingsDialog.open||e.target.matches('input')||e.repeat||(e.target.matches('button')&&e.code==='Space'))return;if(['1','2','3'].includes(e.key))setMode(['knead','stretch','rotate'][Number(e.key)-1]);if(['4','5','6'].includes(e.key))playAction(['tap','shake','twist'][Number(e.key)-4]);if(e.key.toLowerCase()==='r')reset();if(e.code==='Space'){e.preventDefault();hug();}});
let lookX=0,lookY=0,frames=0;
try{switchCharacter(localStorage.getItem('squish-character'));}catch{}
function frame(time){
 requestAnimationFrame(frame);if(document.hidden)return;const dt=lastTime?Math.min((time-lastTime)/1000,.05):1/60;lastTime=time;clock+=dt;accumulator+=dt;
 let motion=0;
 toyPlay.step(dt,mode);
 if(mode==='tickle'){soft.contact=null;currentPressure=0;soft.wobbleVelocity+=Math.sin(toyPlay.beat)*toyPlay.tickle*dt*13;if(toyPlay.tickle>.16)squishAudio.laugh(toyPlay.tickle,activeCharacter);}
 else if(mode==='rocker'){soft.contact=null;currentPressure=0;if(toyPlay.crossed)squishAudio.rock(toyPlay.velocity);}
 else if(drag&&mode!=='rotate'){
  const gesture=grips.sample(dt,clock,pressureGain),local=gesture.points.some(g=>g.local);
  currentPressure=THREE.MathUtils.clamp(gesture.force+Math.max(0,gesture.compression)*.7,0,1);
  gestureSource=gesture.points.find(g=>g.pressure.measured)?.pressure.source||'hold';
  const profile=pressureProfile(currentPressure,mode),axis=new THREE.Vector3(0,1,0);
  if(pointers.size>1){axis.set(...gesture.axis,0);if(axis.y<0||(Math.abs(axis.y)<.01&&axis.x<0))axis.negate();}
  axis.applyQuaternion(character.quaternion.clone().invert());
  const inward=new THREE.Vector3(0,0,-profile.depth).applyQuaternion(character.quaternion.clone().invert());
  const pull=local?[0,0,0]:drag.delta.map(v=>v*(.7+.3*profile.grip));
  for(const g of gesture.points){motion=Math.max(motion,Math.min(1,Math.hypot(...g.delta.map((v,a)=>v-g.previous[a]))/Math.max(dt,.001)*.35));g.previous=g.delta.slice();}
  const amount=local?THREE.MathUtils.clamp(currentPressure*.22+Math.max(0,gesture.compression)*1.2,0,1):currentPressure;
  const handles=local?gesture.points.map(g=>({id:g.id,point:g.point,pull:g.delta,amount:g.force})):[];
  soft.contact={kind:mode,amount,axis:axis.toArray(),pull,handles,twist:gesture.twist,point:drag.point,delta:[inward.x,inward.y,inward.z],radius:profile.radius,pressure:profile.depth};
 }else if(clock<hugUntil){
  const elapsed=2.5-(hugUntil-clock),envelope=Math.min(1,elapsed/.35,(hugUntil-clock)/.32);
  currentPressure=Math.max(0,envelope)*Math.min(1,.4+pressureGain*.6);
  soft.contact={kind:'knead',amount:currentPressure,axis:[0,1,0],pull:[0,0,0],point:[0,2.5,.6],delta:[0,0,-currentPressure*.3],radius:1.2,pressure:currentPressure};
 }else if(play&&clock-play.start<play.duration){
  const elapsed=clock-play.start,envelope=Math.min(1,elapsed/.25,(play.duration-elapsed)/.35);
  currentPressure=Math.max(0,envelope)*(.4+pressureGain*.4);
  if(play.kind==='shake'){soft.wobbleVelocity+=Math.cos(elapsed*25)*dt*21;motion=.7;}
  soft.contact={kind:'knead',amount:currentPressure*.22,axis:[0,1,0],pull:[0,0,0],twist:play.kind==='twist'?Math.sin(elapsed*2.1)*1.15*envelope:0,point:[0,2,.8],delta:[0,0,-currentPressure*.1],radius:1,pressure:currentPressure*.1};
 }else{soft.contact=null;currentPressure=0;play=null;}
 if(wasEngaged&&!soft.contact)squishAudio.release();wasEngaged=!!soft.contact;
 squishAudio.update(currentPressure,motion,mode);
 while(accumulator>=1/120){soft.step(1/120);accumulator-=1/120;}
 const blend=1-Math.exp(-8*dt);lookX+=(THREE.MathUtils.clamp(gaze.x*.075,-.075,.075)-lookX)*blend;lookY+=(THREE.MathUtils.clamp(gaze.y*.055,-.05,.05)-lookY)*blend;
 character.rotation.y+=(rotY-character.rotation.y)*blend;character.rotation.x+=((mode==='rocker'?toyPlay.pitch:rotX)-character.rotation.x)*blend;character.rotation.z=mode==='rocker'?toyPlay.angle:Math.sin(toyPlay.beat*.6)*toyPlay.tickle*.09;character.position.y=0;character.position.x=mode==='tickle'?Math.sin(toyPlay.beat*.7)*toyPlay.tickle*.10:0;
 const breathing=reducedMotion?0:Math.sin(clock*1.6)*.004;character.scale.set(1-breathing*.4,1+breathing,1-breathing*.4);
 const blink=Math.min(1-toyPlay.tickle*.8,reducedMotion?1:1-Math.pow(Math.max(0,Math.cos(clock*1.17)),70)*.9);
 character.updateMatrix();const transform=character.matrix.elements;let worldExtent=0,worldFloor=Infinity;
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(const part of parts){if(part.laugh)part.mesh.visible=toyPlay.tickle>.17;const arr=part.mesh.geometry.attributes.position.array;for(let i=0,j=0;i<arr.length;i+=3,j++){
  soft.map(part.rest[i]+(part.eye?lookX:0),part.rest[i+1]+(part.eye?lookY+(part.rest[i+1]-2.08)*(blink-1):0),part.rest[i+2],part.binds[j],d);
  worldExtent=Math.max(worldExtent,Math.abs(transform[0]*d[0]+transform[4]*d[1]+transform[8]*d[2]+transform[12]));worldFloor=Math.min(worldFloor,transform[1]*d[0]+transform[5]*d[1]+transform[9]*d[2]);
  arr[i]=d[0];arr[i+1]=d[1];arr[i+2]=d[2];minX=Math.min(minX,d[0]);maxX=Math.max(maxX,d[0]);minY=Math.min(minY,d[1]);maxY=Math.max(maxY,d[1]);
 }part.mesh.geometry.attributes.position.needsUpdate=true;part.mesh.geometry.computeVertexNormals();part.mesh.geometry.computeBoundingSphere();}
 character.position.y=.05-worldFloor;
 shapeBounds={width:maxX-minX,height:maxY-minY};
 // Leave room for a pancake or a long pulled neck, including on narrow phones.
 const halfFov=Math.tan(THREE.MathUtils.degToRad(16)),base=innerWidth<700?8.3:9.3;
 const desiredDistance=Math.max(base,Math.max(worldExtent,Math.abs(minX),Math.abs(maxX))*1.13/(halfFov*camera.aspect)+.8,Math.max(Math.abs(maxY-1.65),Math.abs(minY-1.65))*1.1/halfFov+.8);
 camera.position.z+=(desiredDistance-camera.position.z)*(1-Math.exp(-5*dt));
 contactShadow.scale.set(Math.max(.7,shapeBounds.width/2.5),Math.max(.7,shapeBounds.width/2.5),1);
 const material=soft.materialState;
 $('stage').classList.toggle('deforming',Math.abs(soft.strain)>.16||material.pull>.2||Math.abs(material.twist)>.2);
 const challengeEvent=challenge.update({height:shapeBounds.height,pull:material.pull,twist:material.twist},dt);
 if(challengeEvent==='complete'){toast('三种造型都完成啦，软乎乎大师就是你 ✨');$('stage').classList.add('celebrate');setTimeout(()=>$('stage').classList.remove('celebrate'),1800);squishAudio.accent('release',.8);}
 else if(challengeEvent==='step')toast(['','小饼完成！接着抓住身体拉长','拉长完成！试试转动双指，或拧麻花'][challenge.step]);
 if(frames++%4===0){
 $('reaction').textContent=mode==='tickle'?(toyPlay.tickle>.45?'哈哈哈！好痒呀～':toyPlay.tickle>.15?'嘻嘻…再轻一点':'试着来回挠挠肚子'):mode==='rocker'?(Math.abs(toyPlay.angle)>.2?'歪啦歪啦…我又回来啦':'推我一下，看看会不会倒') :'';
  const percent=Math.round(currentPressure*100);$('pressureValue').textContent=percent+'%';$('pressureMeter').value=percent;
  $('pressureSource').textContent=mode==='rotate'?'旋转不施压':clock<hugUntil?'掌心挤压':pointers.size>1?pointers.size+' 指同时揉捏':gestureSource==='pen'?'触笔实时压感':gestureSource==='touch'?'触屏实时压感':'长按逐渐加力';
  const rect=stage.getBoundingClientRect();
  for(const [id,g] of pointers){const marker=markers.get(id);if(marker){marker.style.left=(g.x-rect.left)+'px';marker.style.top=(g.y-rect.top)+'px';marker.style.width=marker.style.height=(30+g.force*22)+'px';marker.textContent=String(Number(marker.dataset.color)+1);}}
  $('touchStatus').textContent=pointers.size?`${pointers.size} 指抓住 · 松开一指，其余继续`:'最多 5 指 · 抓住不同位置一起揉';
  $('challengeCard').hidden=!challenge.active&&!challenge.complete;
  $('challenge').setAttribute('aria-pressed',challenge.active);
  $('challengeTitle').textContent=challenge.complete?'完成啦！软乎乎大师 ✨':'变形挑战 · 不计时';
  document.querySelectorAll('[data-step]').forEach((el,i)=>{el.classList.toggle('done',i<challenge.step);el.classList.toggle('current',challenge.active&&i===challenge.step);});
  $('cursor').style.width=$('cursor').style.height=(38+currentPressure*36)+'px';
  const deform=soft.deformation+Math.abs(soft.strain)+material.pull+Math.abs(material.twist)+Math.abs(material.wobble);$('mood').textContent=play?(play.kind==='shake'?'抖抖抖，烦恼掉下来':'哎呀，变成小麻花啦'):clock<hugUntil?'抱紧一点也可以 ♡':drag?(mode==='rotate'?'每一面都软乎乎':pointers.size>1?`${pointers.size} 根手指，一起变软`:mode==='stretch'?'呜～变成长条啦':currentPressure<.3?'轻轻的，好温柔':currentPressure<.7?'唔，越来越软啦':'哎呀，被你捏扁啦'):(deform>.014?'慢慢蓬松回来…':'软乎乎，等你来');}
 renderer.render(scene,camera);
}
$('loading').style.display='none';requestAnimationFrame(frame);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();endDrag();$('loading').style.display='grid';$('loading').textContent='画面暂时休息了，刷新页面就能再见到小红。';});
// Read-only diagnostics for interaction and numerical stability checks.
window.__squish={get state(){return {tickle:toyPlay.tickle,rocker:{angle:toyPlay.angle,velocity:toyPlay.velocity,pitch:toyPlay.pitch},character:activeCharacter,mode,count,shape:shapeBounds,material:soft.materialState,audio:squishAudio.state,pressure:currentPressure,pressureSource:gestureSource,pressureGain,pointers:pointers.size,grips:[...pointers.values()].map(g=>({id:g.id,point:g.point,delta:g.delta,force:g.force})),play:play?.kind||null,challenge:{active:challenge.active,step:challenge.step,complete:challenge.complete},deformation:soft.deformation,contact:!!soft.contact,rotation:character.rotation.y,gaze:[lookX,lookY],vertices:parts.reduce((n,p)=>n+p.rest.length/3,0),finite:soft.p.every(Number.isFinite)&&parts.every(p=>p.mesh.geometry.attributes.position.array.every(Number.isFinite))};}};
