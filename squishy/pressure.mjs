const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:0));

// Mouse and non-pressure touch devices report a synthetic 0.5. Do not present
// that constant as a measured force; use a time-based squeeze on those devices.
export class PressureInput {
 constructor(){this.reset();}
 reset(){this.pointerType='mouse';this.measured=false;this.raw=0;this.value=0;this.source='hold';}
 begin(event){this.reset();this.pointerType=event.pointerType||'mouse';this.observe(event);}
 observe(event){
  if(event.pointerType!==this.pointerType||this.pointerType==='mouse')return;
  const p=Number(event.pressure);if(!Number.isFinite(p))return;
  if(this.pointerType==='pen'&&p>0)this.measured=true;
  if(this.pointerType==='touch'&&p>0&&Math.abs(p-.5)>.015)this.measured=true;
  if(this.measured){this.raw=clamp(p);this.source=this.pointerType==='pen'?'pen':'touch';}
 }
 observeTouch(force){if(this.pointerType==='touch'&&Number.isFinite(force)&&((force>0&&Math.abs(force-.5)>.015)||this.measured)){this.measured=true;this.raw=clamp(force);this.source='touch';}}
 update({held=0,gain=.6,pinch=0,dt=1/60}={}){
  const strength=this.measured?this.raw:.2+.8*clamp(held/1.65);
  const target=clamp(strength*clamp(gain)+clamp(pinch,-.5,.5));
  this.value+=(target-this.value)*(1-Math.exp(-14*clamp(dt,0,.05)));
  return this.value;
 }
}

export function pressureProfile(value,mode='knead'){
 const p=clamp(value);
 return {depth:(mode==='stretch'?.2:1.15)*p**1.1,radius:(mode==='stretch'?.5:.53)+.36*p,grip:.2+.8*p};
}
