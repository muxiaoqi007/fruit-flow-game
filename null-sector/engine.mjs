// Deterministic, renderer-independent arena simulation. Coordinates are ground-plane x/z.
export const LIMIT = { x: 19, z: 14 };
export { LEVELS, WAVES_PER_LEVEL } from './levels.mjs';
import { LEVELS, WAVES_PER_LEVEL } from './levels.mjs';
export const COVER = LEVELS[0].cover;
export const WEAPONS = [
  { name: '脉冲步枪', code: 'AR–01', magazine: 30, interval: .13, damage: 19, speed: 43, reload: 1.35, pellets: 1, spread: .025 },
  { name: '离子霰弹枪', code: 'SG–02', magazine: 8, interval: .62, damage: 15, speed: 36, reload: 1.8, pellets: 7, spread: .32 },
];
export const UPGRADES = [
  { id: 'damage', icon: '↗', name: '超频弹芯', description: '基础武器伤害 +25%', tag: '火力强化' },
  { id: 'armor', icon: '◇', name: '再生装甲', description: '生命上限 +30，并恢复全部生命', tag: '生存强化' },
  { id: 'agility', icon: 'ϟ', name: '矢量推进', description: '提升移动速度，缩短冲刺冷却', tag: '机动强化' },
];
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export function circleEntry(ax, az, bx, bz, x, z, r) {
  const dx = bx - ax, dz = bz - az, ox = ax - x, oz = az - z;
  const c = ox * ox + oz * oz - r * r, a = dx * dx + dz * dz;
  if (c <= 0) return 0;
  if (a < 1e-12) return Infinity;
  const b = ox * dx + oz * dz, discriminant = b * b - a * c;
  if (discriminant < 0) return Infinity;
  const t = (-b - Math.sqrt(discriminant)) / a;
  return t >= 0 && t <= 1 ? t : Infinity;
}
export function segmentCircle(...args) { return Number.isFinite(circleEntry(...args)); }
export function boxEntry(ax, az, bx, bz, c, pad = 0) {
  let near = 0, far = 1;
  for (const [a, b, center, extent] of [[ax, bx, c.x, c.w / 2 + pad], [az, bz, c.z, c.d / 2 + pad]]) {
    const delta = b - a;
    if (Math.abs(delta) < 1e-9) { if (a < center - extent || a > center + extent) return Infinity; }
    else { const p = (center - extent - a) / delta, q = (center + extent - a) / delta; near = Math.max(near, Math.min(p, q)); far = Math.min(far, Math.max(p, q)); if (near > far) return Infinity; }
  }
  return near;
}
function segmentBox(...args) { return Number.isFinite(boxEntry(...args)); }
export function aimTarget(player, enemies, cover, range = 60) {
  let target = null, distance = range * range;
  for (const enemy of enemies) {
    const d = (enemy.x - player.x) ** 2 + (enemy.z - player.z) ** 2;
    if (enemy.hp <= 0 || enemy.age < .75 || d >= distance) continue;
    if (cover.some(c => segmentBox(player.x, player.z, enemy.x, enemy.z, c, .06))) continue;
    target = enemy; distance = d;
  }
  return target;
}
export function blocked(x, z, radius = .55, cover = COVER) {
  return Math.abs(x) > LIMIT.x - radius || Math.abs(z) > LIMIT.z - radius || cover.some(c => Math.abs(x - c.x) < c.w / 2 + radius && Math.abs(z - c.z) < c.d / 2 + radius);
}
export class Game {
  constructor(random = Math.random) { this.random = random; this.reset(); this.mode = 'ready'; }
  get level() { return LEVELS[this.levelIndex]; }
  get cover() { return this.level.cover; }
  reset(levelIndex = 0) {
    this.levelIndex = Number.isInteger(levelIndex) ? clamp(levelIndex, 0, LEVELS.length - 1) : 0;
    this.mode = 'playing'; this.time = 0; this.wave = 0; this.score = 0; this.kills = 0; this.shots = 0; this.hits = 0; this.serial = 0;
    this.player = { x: 0, z: 3, angle: Math.PI, hp: 100, maxHp: 100, speed: 7, damage: 1, invulnerable: 1.5, dash: 0, dashCooldown: 0, dashMax: 2.7, dx: 0, dz: -1 };
    this.enemies = []; this.bullets = []; this.pickups = []; this.events = []; this.pending = []; this.weapon = 0; this.ammo = [30, 8]; this.reloadTime = 0; this.cooldown = 0; this.intermission = 1.5; this.combo = 0; this.comboTime = 0;
    this.player.damage += this.levelIndex * .65; this.player.maxHp += this.levelIndex * 30; this.player.hp = this.player.maxHp;
  }
  event(type, data = {}) { this.events.push({ type, ...data }); }
  start(levelIndex = 0) { this.reset(levelIndex); this.event('message', { text: `${this.level.name} · 清除本关五波入侵` }); }
  preview(levelIndex) { if (this.mode !== 'ready') return; this.reset(levelIndex); this.mode = 'ready'; }
  nextLevel() {
    if (this.mode !== 'cleared' || this.levelIndex >= LEVELS.length - 1) return false;
    this.levelIndex++; this.wave = 0; this.enemies = []; this.pending = []; this.bullets = []; this.pickups = []; this.events = [];
    Object.assign(this.player, { x: 0, z: 3, hp: this.player.maxHp, invulnerable: 2, dash: 0, dashCooldown: 0 });
    this.ammo = WEAPONS.map(w => w.magazine); this.reloadTime = this.cooldown = this.combo = this.comboTime = 0;
    this.intermission = 2; this.mode = 'playing'; this.event('message', { text: `${this.level.name} · 强化已保留，装甲已修复` }); return true;
  }
  move(body, dx, dz, radius) {
    // Small swept steps prevent tunnelling through cover while dashing.
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .2));
    for (let i = 0; i < steps; i++) {
      if (!blocked(body.x + dx / steps, body.z, radius, this.cover)) body.x += dx / steps;
      if (!blocked(body.x, body.z + dz / steps, radius, this.cover)) body.z += dz / steps;
    }
  }
  switchWeapon(index) { if (this.mode !== 'playing' || !Number.isInteger(index) || !WEAPONS[index] || index === this.weapon) return; this.weapon = index; this.reloadTime = 0; this.cooldown = Math.max(.15, this.cooldown); this.event('switch'); }
  reload() { if (this.mode !== 'playing' || this.reloadTime || this.ammo[this.weapon] === WEAPONS[this.weapon].magazine) return; this.reloadTime = WEAPONS[this.weapon].reload; this.event('reload'); }
  dash(x = 0, z = 0) {
    const p = this.player; if (this.mode !== 'playing' || p.dashCooldown > 0) return false;
    const l = Math.hypot(x, z); p.dx = l ? x / l : Math.sin(p.angle); p.dz = l ? z / l : Math.cos(p.angle);
    p.dash = .18; p.invulnerable = Math.max(p.invulnerable, .3); p.dashCooldown = p.dashMax; this.event('dash'); return true;
  }
  spawnWave() {
    this.wave++; const total = 5 + this.wave * 3 + this.levelIndex * 2;
    for (let i = 0; i < total; i++) this.pending.push({ time: i * .65, kind: this.levelIndex ? this.level.roster[i % this.level.roster.length] : this.wave > 1 && i % 4 === 2 ? 'gunner' : this.wave > 2 && i % 5 === 3 ? 'brute' : 'chaser' });
    if (this.wave === WAVES_PER_LEVEL) this.pending.push({ time: 2, kind: 'boss' });
    this.event('wave', { wave: this.wave });
  }
  spawn(kind) {
    const stats = { chaser: [40, 2.8, .55], gunner: [65, 1.8, .65], brute: [180, 1.5, .95], assault: [85, 2.3, .65], sniper: [55, 1.6, .6], raider: [60, 3.6, .6], boss: [1700, 1.1, 1.6] }[kind];
    let x = 17, z = 12;
    for (let attempt = 0; attempt < 12; attempt++) {
      const side = Math.floor(this.random() * 4), v = (this.random() - .5) * 22;
      x = side < 2 ? (side ? 17 : -17) : v; z = side < 2 ? v * .85 : (side === 2 ? -12 : 12);
      if (!blocked(x, z, stats[2], this.cover)) break;
    }
    if (blocked(x, z, stats[2], this.cover)) [x, z] = [[17, 12], [-17, 12], [17, -12], [-17, -12]].find(([cx, cz]) => !blocked(cx, cz, stats[2], this.cover));
    const hp = Math.round(stats[0] * (1 + (this.wave - 1) * .1) * (1 + this.levelIndex * .5));
    this.enemies.push({ id: ++this.serial, kind, x, z, hp, maxHp: hp, speed: stats[1] * (1 + this.levelIndex * .06), volley: 0, radius: stats[2], cooldown: 1.5, age: 0, angle: 0, flash: 0 });
    this.event('spawn', { x, z, kind });
  }
  fire() {
    if (this.mode !== 'playing' || this.cooldown > 0 || this.reloadTime) return;
    if (this.ammo[this.weapon] <= 0) { this.reload(); return; }
    const w = WEAPONS[this.weapon], p = this.player;
    this.ammo[this.weapon]--; this.cooldown = w.interval; this.shots += w.pellets;
    for (let i = 0; i < w.pellets; i++) {
      const a = p.angle + (w.pellets > 1 ? (i / (w.pellets - 1) - .5) * w.spread * 2 : (this.random() - .5) * w.spread);
      this.bullets.push({ id: ++this.serial, x: p.x, z: p.z, vx: Math.sin(a) * w.speed, vz: Math.cos(a) * w.speed, damage: w.damage * p.damage, enemy: false, life: this.weapon ? .55 : 1.4 });
    }
    this.event('shot', { x: p.x, z: p.z, weapon: this.weapon });
  }
  hurt(damage) {
    const p = this.player; if (p.invulnerable > 0 || this.mode !== 'playing') return;
    p.hp = Math.max(0, p.hp - damage); p.invulnerable = .65; this.combo = 0; this.event('hurt');
    if (p.hp === 0) { this.mode = 'lost'; this.event('end'); }
  }
  chooseUpgrade(id) {
    if (this.mode !== 'upgrade') return false;
    const p = this.player;
    if (id === 'damage') p.damage += .25;
    else if (id === 'armor') { p.maxHp += 30; p.hp = p.maxHp; }
    else if (id === 'agility') { p.speed = Math.min(10, p.speed * 1.12); p.dashMax = Math.max(.8, p.dashMax * .82); }
    else return false;
    this.ammo = WEAPONS.map(w => w.magazine); this.reloadTime = 0; p.hp = Math.min(p.maxHp, p.hp + 15); p.invulnerable = 2;
    this.mode = 'playing'; this.intermission = 2; this.event('message', { text: '强化已安装 · 下一波即将抵达' }); return true;
  }
  update(dt, input = {}) {
    if (this.mode !== 'playing') return;
    dt = Math.min(dt, .04); this.time += dt; const p = this.player;
    p.invulnerable = Math.max(0, p.invulnerable - dt); p.dashCooldown = Math.max(0, p.dashCooldown - dt); this.cooldown = Math.max(0, this.cooldown - dt);
    this.comboTime -= dt; if (this.comboTime <= 0) this.combo = 0;
    if (this.reloadTime > 0) { this.reloadTime = Math.max(0, this.reloadTime - dt); if (!this.reloadTime) this.ammo[this.weapon] = WEAPONS[this.weapon].magazine; }
    if (Number.isFinite(input.angle)) p.angle = input.angle;
    let dx = input.x || 0, dz = input.z || 0; const length = Math.hypot(dx, dz); if (length > 1) { dx /= length; dz /= length; }
    if (p.dash > 0) { this.move(p, p.dx * 26 * dt, p.dz * 26 * dt, .55); p.dash -= dt; }
    else this.move(p, dx * p.speed * dt, dz * p.speed * dt, .55);
    if (input.fire) this.fire();
    if (this.intermission > 0) { this.intermission -= dt; if (this.intermission <= 0) this.spawnWave(); }
    for (const spawn of this.pending) spawn.time -= dt;
    const due = this.pending.filter(s => s.time <= 0); this.pending = this.pending.filter(s => s.time > 0); for (const s of due) this.spawn(s.kind);
    for (const e of this.enemies) {
      e.age += dt; e.flash = Math.max(0, e.flash - dt); e.cooldown -= dt;
      if (e.age < .75 || e.hp <= 0) continue;
      const ax = p.x - e.x, az = p.z - e.z, dist = Math.hypot(ax, az) || 1; e.angle = Math.atan2(ax, az);
      const clear = !this.cover.some(c => segmentBox(e.x, e.z, p.x, p.z, c));
      const ranged = ['gunner', 'assault', 'sniper'].includes(e.kind);
      const range = e.kind === 'sniper' ? 15 : e.kind === 'assault' ? 7 : 10;
      if (!ranged || dist > range || !clear) {
        // Probe both sides of cover; stable handedness prevents frame-to-frame oscillation.
        const step = e.speed * dt; let angle = e.angle;
        if (blocked(e.x + Math.sin(angle) * 1.3, e.z + Math.cos(angle) * 1.3, e.radius, this.cover)) {
          const sign = e.id % 2 ? 1 : -1;
          for (const offset of [.7, 1.3, 1.8, 2.4, 3.14]) {
            if (!blocked(e.x + Math.sin(angle + offset * sign) * 1.3, e.z + Math.cos(angle + offset * sign) * 1.3, e.radius, this.cover)) { angle += offset * sign; break; }
          }
        }
        this.move(e, Math.sin(angle) * step, Math.cos(angle) * step, e.radius);
      }
      if (dist < e.radius + .65) this.hurt(e.kind === 'boss' ? 25 : e.kind === 'brute' ? 20 : 10);
      if (this.mode !== 'playing') return;
      if ((ranged || e.kind === 'boss') && e.cooldown <= 0 && clear) {
        const pattern = this.level.pattern, boss = e.kind === 'boss';
        const n = !boss ? (e.kind === 'assault' ? 3 : 1) : pattern === 'fan' ? 7 : pattern === 'spiral' ? 9 : pattern === 'crossfire' ? 18 : pattern === 'storm' ? ((e.volley || 0) % 2 ? 16 : 7) : pattern === 'trident' ? 9 : 14;
        e.volley = (e.volley || 0) + 1;
        for (let i = 0; i < n; i++) {
          let a = e.angle + (e.kind === 'assault' ? (i - 1) * .14 : 0);
          if (boss) a += pattern === 'fan' ? (i - 3) * .15 : i / n * Math.PI * 2 + (pattern === 'spiral' ? e.volley * .38 : pattern === 'crossfire' ? e.volley * .17 : 0);
          if (boss && pattern === 'storm') a = e.angle + (e.volley % 2 ? (i - 3) * .13 : i / n * Math.PI * 2 + e.volley * .19);
          if (boss && pattern === 'trident') a = e.angle + (Math.floor(i / 3) - 1) * .55 + (i % 3 - 1) * .065;
          const speed = e.kind === 'sniper' ? 19 : pattern === 'fan' && boss ? 13 : 10;
          this.bullets.push({ id: ++this.serial, x: e.x, z: e.z, vx: Math.sin(a) * speed, vz: Math.cos(a) * speed, enemy: true, damage: (e.kind === 'sniper' ? 20 : 12) + this.levelIndex * 2, life: 4 });
        }
        e.cooldown = boss ? pattern === 'spiral' ? .85 : pattern === 'crossfire' ? 1.3 : pattern === 'storm' ? 1.4 : pattern === 'trident' ? 1.15 : 1.8 : e.kind === 'sniper' ? 3.2 : e.kind === 'assault' ? 2.6 : 2.2; this.event('enemyShot');
      }
    }
    for (const b of this.bullets) {
      const ox = b.x, oz = b.z; b.x += b.vx * dt; b.z += b.vz * dt; b.life -= dt;
      let wallTime = Infinity;
      for (const c of this.cover) wallTime = Math.min(wallTime, boxEntry(ox, oz, b.x, b.z, c, .06));
      for (const [start, end, limit] of [[ox, b.x, LIMIT.x], [oz, b.z, LIMIT.z]]) {
        if (Math.abs(end) > limit) wallTime = Math.min(wallTime, ((end > 0 ? limit : -limit) - start) / (end - start));
      }
      if (b.enemy) {
        if (circleEntry(ox, oz, b.x, b.z, p.x, p.z, .55) < wallTime) { this.hurt(b.damage); b.life = 0; if (this.mode !== 'playing') return; }
      } else {
        let target = null, firstTime = wallTime;
        for (const enemy of this.enemies) {
          if (enemy.hp <= 0 || enemy.age < .75) continue;
          const t = circleEntry(ox, oz, b.x, b.z, enemy.x, enemy.z, enemy.radius + .14);
          if (t < firstTime) { firstTime = t; target = enemy; }
        }
        const e = target; if (e) {
          e.hp -= b.damage; e.flash = .12; b.life = 0; this.hits++; this.event('hit', { x: e.x, z: e.z, damage: b.damage });
          if (e.hp <= 0) {
            this.kills++; this.combo++; this.comboTime = 3; const points = (e.kind === 'boss' ? 2000 : e.kind === 'brute' ? 250 : 100) * Math.min(4, 1 + Math.floor(this.combo / 5)); this.score += points;
            this.event('kill', { x: e.x, z: e.z, kind: e.kind, points });
            if (this.random() < .2 || e.kind === 'brute') this.pickups.push({ id: ++this.serial, x: e.x, z: e.z, life: 18 });
          }
        }
      }
      if (b.life > 0 && Number.isFinite(wallTime)) { b.life = 0; this.event('impact', { x: ox + (b.x - ox) * wallTime, z: oz + (b.z - oz) * wallTime, enemy: b.enemy }); }
    }

    this.bullets = this.bullets.filter(b => b.life > 0); this.enemies = this.enemies.filter(e => e.hp > 0);
    for (const item of this.pickups) { item.life -= dt; if (Math.hypot(item.x - p.x, item.z - p.z) < 1.4 && p.hp < p.maxHp) { p.hp = Math.min(p.maxHp, p.hp + 22); item.life = 0; this.event('heal', { x: p.x, z: p.z }); } }
    this.pickups = this.pickups.filter(item => item.life > 0);
    if (this.mode === 'playing' && this.wave && this.intermission <= 0 && !this.pending.length && !this.enemies.length) {
      this.bullets = []; this.pickups = []; this.mode = this.wave === WAVES_PER_LEVEL ? this.levelIndex === LEVELS.length - 1 ? 'won' : 'cleared' : 'upgrade'; this.event(['won', 'cleared'].includes(this.mode) ? 'end' : 'upgrade');
    }
  }
}
