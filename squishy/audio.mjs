export const SOUND_STYLES={silicone:{label:'软胶',tone:125,resonance:3.8,noise:.045},bubble:{label:'啵啵',tone:260,resonance:6,noise:.018},jelly:{label:'Q 弹',tone:160,resonance:2.3,noise:.026}};

// Procedural Foley: pressure drives a continuous filtered friction layer; movement
// excites rubber squeaks and bubbles; release excites a damped, pitched resonance.
export class SquishAudio {
 constructor(){this.enabled=true;this.style='silicone';this.context=null;this.lastAccent=-10;this.lastPressure=0;this.lastAccentPressure=0;this.events=0;this.peakPressure=0;this.gestureMode='knead';}
 async unlock(){
  if(!this.enabled)return;
  try{if(!this.context){
   const Context=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Context)return;
   const ctx=this.context=new Context(),master=this.master=ctx.createGain();master.gain.value=.65;
   const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-18;limiter.knee.value=16;limiter.ratio.value=5;master.connect(limiter);this.analyser=ctx.createAnalyser();this.analyser.fftSize=256;this.samples=new Float32Array(256);limiter.connect(this.analyser);this.analyser.connect(ctx.destination);
   const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),samples=buffer.getChannelData(0);let brown=0;
   for(let i=0;i<samples.length;i++){brown=(brown+(Math.random()*2-1)*.035)/1.025;samples[i]=brown*6;}
   this.noise=buffer;const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
   this.filter=ctx.createBiquadFilter();this.filter.type='bandpass';this.friction=ctx.createGain();this.friction.gain.value=0;
   source.connect(this.filter);this.filter.connect(this.friction);this.friction.connect(master);source.start();
  }if(this.context.state==='suspended')await this.context.resume();}catch{/* Audio is optional; a denied audio session never interrupts touch input. */}
 }
 setEnabled(enabled){this.enabled=enabled;if(this.master)this.master.gain.setTargetAtTime(enabled?.65:0,this.context.currentTime,.02);if(!enabled)this.silence();else this.unlock();}
 setStyle(style){if(SOUND_STYLES[style])this.style=style;}
 press(mode='knead'){this.peakPressure=0;this.lastPressure=0;this.lastAccentPressure=0;this.gestureMode=mode;this.unlock().then(()=>{if(this.context?.state==='running'&&this.enabled)this.accent('touch',.18);});}
 silence(){if(this.context){this.friction.gain.setTargetAtTime(0,this.context.currentTime,.03);}this.lastPressure=0;this.peakPressure=0;}
 update(pressure,motion,mode){
  const ctx=this.context;if(!this.enabled||!ctx||ctx.state!=='running')return;
  const s=SOUND_STYLES[this.style],p=Math.max(0,Math.min(1,pressure)),speed=Math.min(1,motion),change=Math.abs(p-this.lastPressure);
  this.filter.frequency.setTargetAtTime((this.style==='silicone'?950:600)-p*400+speed*1000,ctx.currentTime,.035);
  this.filter.Q.setTargetAtTime(s.resonance,ctx.currentTime,.04);
  // A still-held squeeze quiets down, like an actual toy held between the fingers.
  this.friction.gain.setTargetAtTime(s.noise*(p*.13+speed*.8+Math.min(.8,change*9)),ctx.currentTime,.035);
  if((Math.abs(p-this.lastAccentPressure)>.13||speed>.14)&&ctx.currentTime-this.lastAccent>(this.style==='bubble'?.13:.23)){
   this.accent(mode==='stretch'?'stretch':'squeeze',p);this.lastAccent=ctx.currentTime;this.lastAccentPressure=p;
  }
  this.peakPressure=Math.max(this.peakPressure,p);this.lastPressure=p;
 }
 release(){const p=this.peakPressure;if(this.enabled&&this.context?.state==='running'&&p>.04)this.accent('release',p);this.silence();}
 laugh(intensity,character){
  const ctx=this.context;if(!this.enabled||ctx?.state!=='running'||ctx.currentTime-(this.lastLaugh??-10)<.38)return;
  this.lastLaugh=ctx.currentTime;this.laughs=(this.laughs||0)+1;
  // Short voiced "ha / hi" syllables, with breath and changing vowel formants.
  for(let i=0;i<3;i++){const t=ctx.currentTime+i*.115,o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();o.type='sawtooth';const pitch=(character==='qing'?320:390)*(1+intensity*.22);o.frequency.setValueAtTime(pitch*(1+i*.07),t);o.frequency.exponentialRampToValueAtTime(pitch*.75,t+.095);f.type='bandpass';f.frequency.value=i%2?1500:1000;f.Q.value=1.8;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.065+intensity*.045,t+.018);g.gain.exponentialRampToValueAtTime(.0001,t+.10);o.connect(f);f.connect(g);g.connect(this.master);o.start(t);o.stop(t+.11);o.onended=()=>{o.disconnect();f.disconnect();g.disconnect();};}
  this.events++;
 }
 rock(speed){if(!this.enabled||this.context?.state!=='running'||this.context.currentTime-(this.lastRock??-10)<.2)return;this.lastRock=this.context.currentTime;this.rocks=(this.rocks||0)+1;this.accent('release',Math.min(.8,Math.abs(speed)*.22));}
 accent(kind,pressure){
  const ctx=this.context;if(!this.enabled||!ctx)return;const s=SOUND_STYLES[this.style],t=ctx.currentTime,p=Math.max(.08,Math.min(1,pressure)),release=kind==='release';
  const duration=release?.42:kind==='stretch'?.24:.16,osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type=this.style==='silicone'?'triangle':'sine';const pitch=s.tone*(.85+Math.random()*.25)*(1.15-p*.4);
  osc.frequency.setValueAtTime(pitch*(release?.7:kind==='stretch'?1.8:1.45),t);
  osc.frequency.exponentialRampToValueAtTime(pitch*(release?1.65:.6),t+duration*.38);
  osc.frequency.exponentialRampToValueAtTime(pitch*(release?.86:.42),t+duration);
  gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime((.022+p*.065)*(this.style==='bubble'?1.3:1),t+.015);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  osc.connect(gain);gain.connect(this.master);osc.start(t);osc.stop(t+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};this.events++;
  if(release&&this.style==='bubble'){
   const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(pitch*2,t+.12);o.frequency.exponentialRampToValueAtTime(pitch*.55,t+.3);g.gain.setValueAtTime(0,t);g.gain.setValueAtTime(.06*p,t+.12);g.gain.exponentialRampToValueAtTime(.0001,t+.31);o.connect(g);g.connect(this.master);o.start(t+.12);o.stop(t+.33);o.onended=()=>{o.disconnect();g.disconnect();};
  }
 }
 get state(){let rms=0;if(this.analyser){this.analyser.getFloatTimeDomainData(this.samples);rms=Math.sqrt(this.samples.reduce((sum,v)=>sum+v*v,0)/this.samples.length);}return {enabled:this.enabled,style:this.style,status:this.context?.state||'locked',events:this.events,laughs:this.laughs||0,rocks:this.rocks||0,rms};}
}
