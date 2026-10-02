import * as THREE from '../squishy/vendor/three.module.js';
import { LEVELS } from './levels.mjs';
import { armorById } from './appearance.mjs';
import { makeRobot, animateRobot } from './models.mjs';
const Y = new THREE.Vector3(0, 1, 0);
export class Arena {
  constructor(container) {
    this.container = container; this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#101915'); this.scene.fog = new THREE.FogExp2('#101915', .012);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7)); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.3;
    container.appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(44, 1, .1, 180); this.camera.position.set(0, 34, 28); this.camera.lookAt(0, 0, 0);
    this.raycaster = new THREE.Raycaster(); this.plane = new THREE.Plane(Y, -.75); this.target = new THREE.Vector3();
    this.scene.add(new THREE.HemisphereLight('#d1e4c3', '#1a201b', 2));
    const sun = new THREE.DirectionalLight('#f2ffd6', 3); sun.position.set(-12, 30, 8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -27, right: 27, top: 24, bottom: -24, near: .5, far: 75 }); sun.shadow.bias = -.001; this.scene.add(sun);
    const rim = new THREE.DirectionalLight('#749e9a', 1.5); rim.position.set(15, 10, -20); this.scene.add(rim);
    this.mat = {}; this.geo = {}; this.entities = new Map(); this.projectiles = new Map(); this.loot = new Map(); this.particles = []; this.particlePool = []; this.rings = []; this.shake = 0;
    this.boxGeo = new THREE.BoxGeometry(1, 1, 1); this.sphereGeo = new THREE.IcosahedronGeometry(1, 0);
    this.setLevel(LEVELS[0]); this.player = this.robot('player'); this.scene.add(this.player); this.player.position.set(0, 0, 3);
    this.demo = []; for (const [kind, x, z] of [['chaser', 11, 1], ['gunner', 5, -7], ['chaser', -3, -3], ['brute', 13, -8]]) { const mesh = this.robot(kind); mesh.position.set(x, 0, z); mesh.rotation.y = -1; this.scene.add(mesh); this.demo.push(mesh); }
    this.resize(); window.addEventListener('resize', () => this.resize());
  }
  material(color, glow = false) { const key = color + glow; if (!this.mat[key]) this.mat[key] = glow ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshStandardMaterial({ color, roughness: .42, metalness: .45 }); return this.mat[key]; }
  box(w, h, d, x, y, z, color, parent = this.scene, glow = false) { const mesh = new THREE.Mesh(this.boxGeo, this.material(color, glow)); mesh.scale.set(w, h, d); mesh.position.set(x, y, z); mesh.castShadow = !glow; mesh.receiveShadow = !glow; parent.add(mesh); return mesh; }
  ring(radius, color, x, z, parent = this.scene, width = .035) { const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, width, 5, 64), this.material(color, true)); mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, .04, z); parent.add(mesh); return mesh; }
  label(text, x, z, size, color = '#6c8067', rotation = 0) {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 128; const ctx = c.getContext('2d'); ctx.fillStyle = color; ctx.font = 'bold 74px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 512, 64);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: .6 }); const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size / 8), mat); mesh.rotation.set(-Math.PI / 2, 0, rotation); mesh.position.set(x, .025, z); this.scene.add(mesh);
  }
  floor() {
    this.box(43, 1, 33, 0, -.7, 0, '#151e19'); this.box(39, .4, 29, 0, -.22, 0, '#28382e');
    // Individual metal floor tiles with inset seams.
    for (let x = -18; x <= 18; x += 3) for (let z = -12; z <= 12; z += 3) {
      const shade = ((x * 7 + z * 13) % 9 + 9) % 9; this.box(2.96, .09, 2.96, x, -.025, z, ['#2c3a30', '#29372e', '#304035'][shade % 3]);
      if (shade === 2) { this.box(.03, .02, .22, x + 1.25, .026, z + 1.25, '#53624c'); this.box(.22, .02, .03, x + 1.25, .026, z + 1.25, '#53624c'); }
    }
    const grid = new THREE.GridHelper(39, 26, '#687b52', '#526146'); grid.material.opacity = .12; grid.material.transparent = true; grid.position.y = .03; this.scene.add(grid);
    for (const z of [-14.5, 14.5]) {
      this.box(40, .5, .65, 0, .1, z, '#4c5b42'); this.box(39, .06, .065, 0, .38, z, '#b8e66a', this.scene, true);
      for (let x = -18; x < 20; x += 3) { this.box(.8, .4, .8, x, .45, z, '#263629'); this.box(.3, .045, .85, x, .68, z, '#a6bb75'); }
    }
    for (const x of [-19.7, 19.7]) { this.box(.7, .6, 29, x, .1, 0, '#43593e'); this.box(.06, .06, 28, x, .45, 0, '#afdc67', this.scene, true); }
    this.ring(4.5, '#5a7150', 0, 0); this.ring(4.7, '#415539', 0, 0, this.scene, .015);
    this.box(.035, .015, 10, 0, .04, 0, '#617452'); this.box(10, .015, .035, 0, .04, 0, '#617452');
    this.label(this.level.sector, 0, .3, 7, '#97aa7d'); this.label(this.level.english, 0, 6.2, 10); this.label('RESTRICTED ACCESS', 0, -12.4, 10, '#a4b780');
    for (const c of this.level.cover) {
      this.box(c.w + .35, .25, c.d + .35, c.x, .15, c.z, '#1b261e');
      this.box(c.w, 1.45, c.d, c.x, .87, c.z, '#43513b');
      this.box(c.w + .12, .17, c.d + .12, c.x, 1.65, c.z, '#6b7650');
      this.box(c.w - .3, .08, c.d - .3, c.x, 1.77, c.z, '#4f6244');
      for (const sign of [-1, 1]) { this.box(c.w - .4, .08, .03, c.x, 1.35, c.z + sign * (c.d / 2 + .02), '#cfed82', this.scene, true); this.box(.17, 1.3, c.d + .1, c.x + sign * (c.w / 2 - .35), .85, c.z, '#273725'); }
      for (let i = -1; i <= 1; i++) this.box(.7, .025, .09, c.x + i * .9, 1.82, c.z, '#869360');
    }
    // Peripheral pylons, conduits, guardrails and hazard chevrons frame the playfield.
    for (const x of [-21, 21]) for (const z of [-13, -7, 7, 13]) {
      this.box(1.1, 2.8, 1.1, x, .7, z, '#2d3f31'); this.box(.8, .12, .8, x, 2.17, z, '#91af6b'); this.box(.25, 1.5, .25, x, 2.9, z, '#d0fa8f', this.scene, true);
      const light = new THREE.PointLight('#a3dd5b', 10, 7, 2); light.position.set(x, 2, z); this.scene.add(light);
    }
    for (let i = -16; i <= 16; i += 2) for (const z of [-13.6, 13.6]) { const m = this.box(.85, .018, .22, i, .04, z, '#a0af66'); m.rotation.y = -.6; }
    for (const z of [-16.1, 16.1]) for (let i = -20; i <= 20; i += 1.3) this.box(.045, .025, 1.2, i, -.12, z, '#4f6044');
    // Dark silhouettes beyond the arena keep the site grounded in a larger industrial space.
    for (let i = 0; i < 18; i++) { const x = (i - 8.5) * 4.6, h = 1 + ((i * 7) % 8); this.box(3.5, h, 4, x, h / 2 - 3, -23 - (i % 3) * 3, '#17251c'); }
  }
  batchStatic(objects = this.scene.children) {
    const groups = new Map();
    for (const mesh of [...objects]) {
      if (!mesh.isMesh || mesh.geometry !== this.boxGeo) continue;
      const key = mesh.material; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(mesh);
    }
    for (const [material, meshes] of groups) {
      const batch = new THREE.InstancedMesh(this.boxGeo, material, meshes.length);
      meshes.forEach((mesh, index) => { mesh.updateMatrix(); batch.setMatrixAt(index, mesh.matrix); this.scene.remove(mesh); });
      batch.castShadow = !material.isMeshBasicMaterial; batch.receiveShadow = true; batch.computeBoundingSphere(); this.scene.add(batch);
    }
  }
  robot(kind) { return makeRobot(this, kind, this.armorId); }
  releaseObject(object) {
    this.scene.remove(object);
    object.traverse(node => { if (node.geometry?.type === 'TorusGeometry') node.geometry.dispose(); if (node.isInstancedMesh) node.dispose(); });
  }
  setArmor(id) {
    const armor = armorById(id); if (this.armorId === armor.id) return;
    this.armorId = armor.id; this.releaseObject(this.player); this.player = this.robot('player'); this.scene.add(this.player);
  }
  setQuality(quality) {
    this.quality = quality === 'low' ? 'low' : 'high';
    this.renderer.setPixelRatio(this.quality === 'low' ? 1 : Math.min(devicePixelRatio, 1.7));
    this.renderer.shadowMap.enabled = this.quality !== 'low';
    this.scene.traverse(node => { if (node.material) for (const mat of Array.isArray(node.material) ? node.material : [node.material]) mat.needsUpdate = true; });
    this.resize();
  }
  setLevel(level) {
    if (this.level === level) return;
    if (this.scenery) for (const object of this.scenery) {
      this.scene.remove(object); object.traverse(node => {
        if (node.geometry && node.geometry !== this.boxGeo) node.geometry.dispose();
        if (node.material?.map) { node.material.map.dispose(); node.material.dispose(); }
        if (node.isInstancedMesh) node.dispose();
      });
    }
    for (const particle of this.particles) this.scene.remove(particle.mesh); this.particles = [];
    for (const ring of this.rings) { this.scene.remove(ring.mesh); ring.mesh.geometry.dispose(); } this.rings = [];
    this.level = level; this.scene.background.set(level.fog); this.scene.fog.color.set(level.fog);
    const before = new Set(this.scene.children); this.floor(); this.batchStatic(this.scene.children.filter(node => !before.has(node)));
    this.scenery = this.scene.children.filter(node => !before.has(node));
    const floorColor = new THREE.Color(level.floor), armorColor = new THREE.Color(level.armor);
    const palette = new Map();
    for (const object of this.scenery) object.traverse(node => {
      if (node.isLight) node.color.set(level.accent);
      if (!node.material || node.material.map || !node.material.color) return;
      const original = node.material;
      if (!palette.has(original)) {
        const mat = original.clone();
        if (mat.isMeshBasicMaterial || mat.isLineBasicMaterial) mat.color.set(level.accent);
        else { const luminance = original.color.getHSL({}).l; mat.color.copy(luminance > .085 ? armorColor : floorColor); mat.color.multiplyScalar(.6 + luminance * 2); }
        palette.set(original, mat);
      }
      node.material = palette.get(original);
    });
    if (this.levelMaterials) this.levelMaterials.forEach(m => m.dispose());
    this.levelMaterials = [...palette.values()];
    // Distinct environmental silhouettes sit outside the collision boundary.
    for (const x of [-22, 22]) for (const z of [-9, 0, 9]) {
      const group = new THREE.Group(); this.scene.add(group); this.scenery.push(group);
      if (level.id === 'cryovault') {
        this.box(2, 4, 2, x, 1, z, '#304a5a', group); this.box(.08, 3, 1.4, x + (x < 0 ? 1.01 : -1.01), 1.2, z, level.accent, group, true);
      } else if (level.id === 'reactor') {
        this.box(1.9, 2.7, 2, x, .8, z, '#674732', group); this.box(1.3, .1, 1.4, x, 2.21, z, level.accent, group, true);
        for (let i = 0; i < 3; i++) this.box(.15, 3.8, .15, x + (i - 1) * .5, 1.3, z, '#aa805e', group);
      } else if (level.id === 'stormbridge') {
        this.box(.7, 5, .7, x, 1.6, z, '#375966', group);
        for (const side of [-1, 1]) { const wing = this.box(2.2, .08, .1, x + side * .65, 3, z, level.accent, group, true); wing.rotation.z = side * .5; }
        this.box(.08, 3.5, .08, x, 1.5, z + .38, level.accent, group, true);
      } else if (level.id === 'skyport') {
        this.box(2.5, .35, 4, x, .1, z, '#b8a084', group);
        this.box(.4, 3, .4, x, 1, z, '#a39582', group);
        this.box(2, .12, .15, x, 2.6, z, level.accent, group, true);
      } else if (level.id === 'nexus') {
        const monolith = this.box(1.1, 4.8, 1.1, x, 1.8, z, '#554569', group); monolith.rotation.y = Math.PI / 4;
        this.box(.1, 4.4, .1, x, 1.8, z + .81, level.accent, group, true);
      }
    }
  }
  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight; this.renderer.setSize(w, h); this.camera.aspect = w / h;
    // Keep playable ground visible on narrow displays; HUD stays in screen space.
    const dist = w / h < 1 ? 38 : w / h < 1.4 ? 44 : 40;
    this.portrait = w / h < 1; this.cameraDistance = dist; this.followX = 0; this.followZ = 0;
    this.camera.position.set(0, dist * .79, dist * .66); this.camera.lookAt(0, 0, 0); this.camera.updateProjectionMatrix();
  }
  aim(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect(); this.raycaster.setFromCamera(new THREE.Vector2((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1), this.camera);
    this.raycaster.ray.intersectPlane(this.plane, this.target); return this.target;
  }
  burst(x, z, color, count = 15) {
    if (this.quality === 'low') count = Math.ceil(count * .45);
    for (let i = 0; i < count; i++) { const mesh = this.particlePool.pop() || new THREE.Mesh(this.boxGeo); mesh.material = this.material(color, true); mesh.scale.setScalar(.04 + Math.random() * .09); mesh.position.set(x, .7, z); this.scene.add(mesh); const a = Math.random() * Math.PI * 2, speed = 2 + Math.random() * 5; this.particles.push({ mesh, vx: Math.sin(a) * speed, vz: Math.cos(a) * speed, vy: 2 + Math.random() * 4, life: .3 + Math.random() * .5 }); }
    while (this.particles.length > 350) this.scene.remove(this.particles.shift().mesh);
  }
  pulse(x, z, color) { const mesh = this.ring(.6, color, x, z); this.rings.push({ mesh, life: .65 }); }
  event(e) {
    if (e.type === 'kill') { this.burst(e.x, e.z, '#ffb576', e.kind === 'boss' ? 60 : 20); this.pulse(e.x, e.z, '#ff9b67'); this.shake = .12; }
    if (e.type === 'hit') this.burst(e.x, e.z, '#ffe1a7', 4);
    if (e.type === 'shot') { this.player.userData.recoil = 1; const p = this.player, a = p.rotation.y; this.burst(p.position.x + Math.sin(a) * 1.2 + Math.cos(a) * .45, p.position.z + Math.cos(a) * 1.2 - Math.sin(a) * .45, '#e3ff9d', 3); }
    if (e.type === 'spawn') this.pulse(e.x, e.z, '#ff7964');
    if (e.type === 'heal') this.pulse(e.x, e.z, '#cfff7c');
    if (e.type === 'hurt') this.shake = .3;
  }
  sync(map, data, create, update) {
    const ids = new Set(); for (const item of data) { ids.add(item.id); let mesh = map.get(item.id); if (!mesh) { mesh = create(item); map.set(item.id, mesh); this.scene.add(mesh); } update(mesh, item); }
    for (const [id, mesh] of map) if (!ids.has(id)) { this.releaseObject(mesh); map.delete(id); }
  }
  render(game, dt, now) {
    this.setLevel(game.level);
    const p = game.player, active = game.mode !== 'ready'; for (const d of this.demo) { d.visible = !active; d.position.y = Math.sin(now * 2 + d.position.x) * .04; }
    this.player.userData.weapon.scale.set(game.weapon ? 1.3 : 1, 1, game.weapon ? .72 : 1);
    this.player.position.set(active ? p.x : 4.5, 0, active ? p.z : 1.5);
    this.player.scale.setScalar(active ? this.player.userData.scale : 3.1);
    this.player.rotation.y = active ? p.angle : Math.sin(now * .35) * .35 + .45;
    this.player.visible = p.invulnerable <= 0 || Math.floor(now * 16) % 2 === 0 || !active;
    animateRobot(this.player, now, active && (this.lastX !== p.x || this.lastZ !== p.z), dt, p.dash > 0);
    this.lastX = p.x; this.lastZ = p.z;
    if (p.dash > 0 && game.mode === 'playing') this.burst(p.x, p.z, '#c9ff75', 2);
    this.sync(this.entities, game.enemies, e => {
      const mesh = this.robot(e.kind), bar = new THREE.Group(); bar.position.y = e.kind === 'chaser' ? 1.35 : 2.65;
      this.box(1.05, .075, .035, 0, 0, 0, '#18242d', bar, true);
      const fill = this.box(1, .045, .04, 0, 0, .01, '#f9a276', bar, true); mesh.add(bar);
      mesh.userData.healthBar = bar; mesh.userData.healthFill = fill; return mesh;
    }, (mesh, e) => { mesh.position.set(e.x, Math.sin(now * 5 + e.id) * .035, e.z); mesh.rotation.y = e.angle; mesh.scale.setScalar(mesh.userData.scale * Math.min(1, e.age / .75)); animateRobot(mesh, now, game.mode === 'playing', dt); mesh.userData.ring.visible = true;
      mesh.userData.ring.scale.setScalar(e.kind === 'boss' && e.cooldown < .6 ? 1.15 + Math.sin(now * 20) * .12 : 1);
      const bar = mesh.userData.healthBar, ratio = Math.max(0, e.hp / e.maxHp);
      bar.visible = e.hp < e.maxHp && e.kind !== 'boss'; bar.quaternion.copy(mesh.quaternion).invert().multiply(this.camera.quaternion);
      mesh.userData.healthFill.scale.x = ratio; mesh.userData.healthFill.position.x = (ratio - 1) * .5; });
    this.sync(this.projectiles, game.bullets, b => { const mesh = new THREE.Mesh(this.boxGeo, this.material(b.enemy ? '#ff7864' : '#dbff91', true)); mesh.scale.set(b.enemy ? .22 : .085, .085, b.enemy ? .32 : .8); return mesh; }, (mesh, b) => { mesh.position.set(b.x, .96, b.z); mesh.rotation.y = Math.atan2(b.vx, b.vz); });
    this.sync(this.loot, game.pickups, () => { const g = new THREE.Group(); this.box(.65, .35, .65, 0, 0, 0, '#516b3f', g); this.box(.45, .02, .14, 0, .18, 0, '#dcffad', g, true); this.box(.14, .02, .45, 0, .19, 0, '#dcffad', g, true); this.ring(.55, '#c9ff75', 0, 0, g); return g; }, (mesh, item) => { mesh.position.set(item.x, .35 + Math.sin(now * 3 + item.id) * .15, item.z); mesh.rotation.y = now; });
    for (const part of this.particles) { part.life -= dt; part.mesh.position.x += part.vx * dt; part.mesh.position.z += part.vz * dt; part.mesh.position.y += part.vy * dt; part.vy -= 13 * dt; part.mesh.rotation.x += dt * 4; if (part.life <= 0) { this.scene.remove(part.mesh); if (this.particlePool.length < 100) this.particlePool.push(part.mesh); } }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const ring of this.rings) { ring.life -= dt; ring.mesh.scale.setScalar(1 + (1 - ring.life / .65) * 4); ring.mesh.visible = Math.floor(ring.life * 30) % 3 !== 0; if (ring.life <= 0) { this.scene.remove(ring.mesh); ring.mesh.geometry.dispose(); } } this.rings = this.rings.filter(r => r.life > 0);
    if (this.portrait) { const blend = 1 - Math.exp(-dt * 5); this.followX += ((active ? p.x : 3) - this.followX) * blend; this.followZ += ((active ? p.z : 0) - this.followZ) * blend; this.camera.position.set(this.followX, this.cameraDistance * .79, this.followZ + this.cameraDistance * .66); this.camera.lookAt(this.followX, 0, this.followZ); }
    this.shake = Math.max(0, this.shake - dt); const sx = dt > 0 ? (Math.random() - .5) * this.shake : 0; this.camera.position.x += sx; this.renderer.render(this.scene, this.camera); this.camera.position.x -= sx;
  }
}
