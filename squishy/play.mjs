const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class ToyPlay {
 constructor(){this.reset();}
 reset(){this.tickle=0;this.rub=0;this.angle=0;this.pitch=0;this.velocity=0;this.pitchVelocity=0;this.target=null;this.beat=0;this.crossed=false;}
 stroke(distance,belly){if(belly)this.rub=Math.min(1.2,this.rub+Math.min(distance,45)/90);}
 step(dt,mode){
  dt=clamp(dt,0,.05);this.tickle=clamp(this.tickle+(mode==='tickle'?this.rub*5:0)*dt-this.tickle*2.8*dt,0,1);this.rub*=Math.exp(-12*dt);this.beat+=dt*(15+this.tickle*12);
  this.crossed=false;const before=this.angle;
  for(let t=0;t<dt;t+=1/120){const h=Math.min(1/120,dt-t),held=mode==='rocker'&&this.target;
   this.velocity+=((held?(this.target[0]-this.angle)*65:-19*Math.sin(this.angle))-(held?12:1.65)*this.velocity)*h;
   this.pitchVelocity+=((held?(this.target[1]-this.pitch)*65:-19*Math.sin(this.pitch))-(held?12:1.65)*this.pitchVelocity)*h;
   this.angle=clamp(this.angle+this.velocity*h,-1.05,1.05);this.pitch=clamp(this.pitch+this.pitchVelocity*h,-.6,.6);
  }
  this.crossed=before*this.angle<0&&Math.abs(this.velocity)>.22;
 }
}
