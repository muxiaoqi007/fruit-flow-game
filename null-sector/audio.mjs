export class Audio {
  constructor() { this.enabled = true; }
  unlock() { try { this.ctx ||= new (window.AudioContext || window.webkitAudioContext)(); if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); } catch {} }
  play(type) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const tones = { shot: [180, 45, .085, .035, 'sawtooth'], hit: [650, 180, .07, .018, 'triangle'], kill: [130, 30, .22, .055, 'sawtooth'], dash: [100, 650, .16, .028, 'sine'], hurt: [120, 40, .2, .08, 'square'], wave: [260, 520, .4, .035, 'sine'], reload: [450, 700, .09, .025, 'triangle'], heal: [550, 1100, .3, .03, 'sine'], switch: [300, 550, .06, .02, 'triangle'] };
    const spec = tones[type]; if (!spec) return;
    const [start, end, duration, volume, wave] = spec, t = this.ctx.currentTime, oscillator = this.ctx.createOscillator(), gain = this.ctx.createGain();
    oscillator.type = wave; oscillator.frequency.setValueAtTime(start, t); oscillator.frequency.exponentialRampToValueAtTime(end, t + duration); gain.gain.setValueAtTime(volume, t); gain.gain.exponentialRampToValueAtTime(.001, t + duration); oscillator.connect(gain); gain.connect(this.ctx.destination); oscillator.start(t); oscillator.stop(t + duration); oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
}
