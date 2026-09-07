const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function boot({width=900,height=710,compact=false}={}){
 const elements=new Map(),listeners={},storage=new Map();
 const context=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const element=id=>{if(!elements.has(id))elements.set(id,{style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,fn){this[k]=fn},getContext:()=>context,getBoundingClientRect:()=>({left:0,top:0,width,height}),setPointerCapture(){},setAttribute(){},scrollIntoView(){}});return elements.get(id)};
 const sandbox={console,Math,Number,String,Set,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},document:{getElementById:element,addEventListener(){}},window:{matchMedia:()=>({matches:compact}),devicePixelRatio:2,addEventListener(k,fn){listeners[k]=fn}},requestAnimationFrame(){}};
 const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace('window.fruitFlow={',`window.testEngine={reset,physics,drop,makeFruit,mergePairs,tiers,swapFruit,shake,draw,resizeCanvas,getAim:()=>aimX,setFruits:value=>fruits=value,setAim:value=>aimX=value,getFruits:()=>fruits};window.fruitFlow={`);
 vm.createContext(sandbox);vm.runInContext(script,sandbox);const engine=sandbox.window.testEngine;engine.reset();
 return {...engine,state:sandbox.window.fruitFlow.getState,element,listeners,advance(seconds){for(let i=0;i<seconds*60;i++){if(sandbox.window.fruitFlow.getState().mode!=='playing')break;engine.physics(1/60)}}};
}
test('each of the nine evolutions consumes exactly two fruits and cumulatively scores the result',()=>{
 const g=boot();let total=0;
 for(let tier=0;tier<9;tier++){
  const r=g.tiers[tier].r,a=g.makeFruit(450-r,460,tier),b=g.makeFruit(450+r,460,tier);a.age=b.age=2;g.setFruits([a,b]);g.mergePairs();total+=g.tiers[tier+1].points;
  assert.equal(g.state().fruitCount,1);assert.equal(g.state().fruits[0].tier,tier+1);assert.equal(g.state().baseScore,total);assert.equal(g.state().score,total+g.state().bonusScore);assert.equal(g.state().merges,tier+1);
 }
 assert.equal(g.state().highest,'西瓜');assert.equal(g.state().best,g.state().score);
});
test('one fruit cannot be consumed twice; different tiers and final-tier pairs do not merge',()=>{
 const g=boot();const batch=[0,0,0].map((t,i)=>{const f=g.makeFruit(400+i*20,500,t);f.age=2;return f});g.setFruits(batch);g.mergePairs();assert.equal(g.state().score,10);assert.equal(g.state().fruitCount,2);
 for(const pair of [[0,1],[9,9]]){const a=g.makeFruit(400,500,pair[0]),b=g.makeFruit(420,500,pair[1]);a.age=b.age=2;g.setFruits([a,b]);g.mergePairs();assert.equal(g.state().fruitCount,2);assert.equal(g.state().score,10)}
});
test('actual drops settle, merge, and remain inside the container',()=>{
 const g=boot();assert.equal(g.drop(),true);assert.equal(g.drop(),false);g.advance(1.8);assert.equal(g.drop(),true);g.advance(4);
 assert.equal(g.state().score,10);assert.equal(g.state().fruitCount,1);const f=g.state().fruits[0];assert.equal(f.tier,1);assert.ok(Math.abs(f.y+f.halfHeight-668)<1);assert.ok(g.state().finite);
});
test('unlimited time; overflow grace ends a full container and restart clears the round',()=>{
 const g=boot();g.advance(120);assert.equal(g.state().mode,'playing');
 const pile=[[300,537],[600,537],[300,275],[600,275],[300,13],[600,13]].map(([x,y])=>{const f=g.makeFruit(x,y,9);f.age=2;return f});g.setFruits(pile);g.advance(1);assert.equal(g.state().mode,'playing');g.advance(3);assert.equal(g.state().mode,'ended');assert.ok(g.state().finite);
 g.reset();assert.equal(g.state().mode,'playing');assert.equal(g.state().score,0);assert.equal(g.state().fruitCount,0);assert.equal(g.state().overflow,0);
});
test('liquid energy depletes, recovers on release, and pause blocks dropping',()=>{
 const g=boot();g.listeners.keydown({code:'Space',preventDefault(){}});g.advance(1);assert.ok(g.state().liquid);assert.ok(g.state().energy<80);g.advance(4);assert.equal(g.state().liquid,false);g.listeners.keyup({code:'Space'});g.advance(7);assert.equal(g.state().energy,100);
 g.element('pause').onclick();assert.equal(g.state().mode,'paused');assert.equal(g.drop(),false);g.element('pause').onclick();assert.equal(g.state().mode,'playing');
});
test('long soft-body sessions keep finite physics and exact accumulated score',()=>{
 const g=boot();let drops=0;
 while(g.state().mode==='playing'&&drops<100){g.setAim(230+(drops%5)*105);g.drop();g.advance(.7);assert.ok(g.state().finite);drops++}
 g.advance(5);const s=g.state();assert.ok(s.finite);assert.equal(s.baseScore,s.counts.reduce((sum,count,t)=>sum+count*g.tiers[t].points,0));assert.ok(s.fruitCount>0);
});

test('chain bonus grows to its cap, expires, and stays separate from evolution points',()=>{
 const g=boot();let expectedBonus=0;
 for(let i=0;i<7;i++){
  const a=g.makeFruit(400,600,0),b=g.makeFruit(440,600,0);a.age=b.age=2;g.setFruits([a,b]);g.mergePairs();expectedBonus+=Math.floor(10*.25*Math.min(i,4));
  assert.equal(g.state().chain,i+1);assert.equal(g.state().bonusScore,expectedBonus);
 }
 assert.equal(g.state().baseScore,70);assert.equal(g.state().score,70+expectedBonus);g.setFruits([]);g.advance(3);assert.equal(g.state().chain,0);
 const a=g.makeFruit(400,600,0),b=g.makeFruit(440,600,0);a.age=b.age=2;g.setFruits([a,b]);g.mergePairs();assert.equal(g.state().chain,1);assert.equal(g.state().bonusScore,expectedBonus);assert.equal(g.state().bestChain,7);
});
test('swap always changes the waiting fruit, spends charges, and refills after eight merges',()=>{
 const g=boot();for(let i=0;i<3;i++){const before=g.state().next[0];assert.ok(g.swapFruit());assert.notEqual(g.state().next[0],before)}assert.equal(g.state().swaps,0);assert.equal(g.swapFruit(),false);
 for(let i=0;i<8;i++){const a=g.makeFruit(400,600,0),b=g.makeFruit(440,600,0);a.age=b.age=2;g.setFruits([a,b]);g.mergePairs()}assert.equal(g.state().swaps,1);
 g.reset();assert.equal(g.state().swaps,3);assert.equal(g.state().bonusScore,0);
});
test('shake shares energy with liquid, respects cooldown, and changes fruit motion without adding points',()=>{
 const g=boot();assert.equal(g.shake(),false);g.drop();g.advance(2);const before=g.state().energy;assert.equal(g.shake(),true);assert.equal(g.state().energy,before-40);assert.equal(g.state().score,0);assert.ok(g.getFruits()[0].vy<0);assert.equal(g.shake(),false);g.advance(8.1);assert.equal(g.shake(),true);g.advance(1);assert.ok(g.state().finite);
});
test('mobile cropped viewport maps touch positions to logical coordinates and cancels interrupted touches',()=>{
 const g=boot({width:315,height:320,compact:true});const c=g.element('game');
 c.pointerdown({pointerId:1,clientX:157.5,preventDefault(){}});assert.equal(g.getAim(),450);c.pointercancel({pointerId:1});c.pointerup({pointerId:1,clientX:157.5});assert.equal(g.state().fruitCount,0);
 c.pointerdown({pointerId:2,clientX:50,preventDefault(){}});c.pointermove({pointerId:2,clientX:100});c.pointerup({pointerId:2,clientX:100});assert.equal(g.state().fruits[0].x,335);assert.equal(g.state().fruitCount,1);g.draw();assert.equal(c.width,630);assert.equal(c.height,640);
});

test('default fruit spreads under gravity, keeps its area, and liquid deepens the deformation',()=>{
 const g=boot();const f=g.makeFruit(450,360,4);g.setFruits([f]);g.advance(4);let state=g.state().fruits[0];
 assert.equal(g.state().liquid,false);assert.ok(state.halfWidth>state.r*1.16,'default fruit must visibly spread');assert.ok(state.halfHeight<state.r*.88,'default fruit must flatten');
 assert.ok(Math.abs(state.halfWidth*state.halfHeight-state.r*state.r)<.001,'deforming collider conserves area');
 const nodes=g.getFruits()[0].outline;const area=nodes.reduce((sum,p,i)=>sum+p.r*nodes[(i+1)%32].r*Math.sin(Math.PI*2/32)*.5,0);assert.ok(area>Math.PI*state.r*state.r*.9,'soft skin retains juice volume');
 const before=state.halfHeight;g.listeners.keydown({code:'Space',preventDefault(){}});g.advance(2);state=g.state().fruits[0];assert.ok(state.halfHeight<before*.92);g.listeners.keyup({code:'Space'});g.advance(3);
 assert.ok(g.state().fruits[0].halfWidth>state.r*1.15,'release must not make it rigid');assert.ok(g.state().finite);
});
test('soft perimeter stays inside the vessel while fruit settles and recovers from shaking',()=>{
 const g=boot();g.setFruits([g.makeFruit(190,400,5),g.makeFruit(700,450,4)]);g.advance(3);g.shake();g.advance(2);
 for(const f of g.getFruits())for(let i=0;i<32;i++){const a=i/32*Math.PI*2,x=f.x+Math.cos(a)*f.outline[i].r,y=f.y+Math.sin(a)*f.outline[i].r;assert.ok(x>=159.9&&x<=740.1);assert.ok(y<=668.1)}
 assert.ok(g.state().finite);
});
