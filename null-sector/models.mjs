import { armorById } from './appearance.mjs';
import * as THREE from '../squishy/vendor/three.module.js';

// Shared bevelled geometry keeps silhouettes smooth without downloading model assets.
const outline = new THREE.Shape();
outline.moveTo(-.45, -.45); outline.lineTo(.45, -.45); outline.lineTo(.45, .45); outline.lineTo(-.45, .45); outline.closePath();
const armorGeometry = new THREE.ExtrudeGeometry(outline, { depth: .9, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .05, bevelThickness: .05 });
armorGeometry.translate(0, 0, -.45);
const sphere = new THREE.SphereGeometry(1, 16, 10);
const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
const taper = new THREE.CylinderGeometry(.7, 1, 1, 8);
const cone = new THREE.ConeGeometry(1, 1, 10);

const capeGeometry = new THREE.PlaneGeometry(.74, .96, 6, 6);
const vertices = capeGeometry.attributes.position;
for (let i = 0; i < vertices.count; i++) {
  const x = vertices.getX(i), y = vertices.getY(i), drop = .48 - y;
  vertices.setXYZ(i, x * (1 + drop * .35), y - Math.abs(x) * .18, -.04 - drop * .2 + Math.cos(x * 23) * drop * .035);
}
capeGeometry.computeVertexNormals();

export function makeRobot(arena, kind, armorId) {
  const root = new THREE.Group(), body = new THREE.Group(), limbs = [], jets = [];
  root.add(body);
  const player = kind === 'player', boss = kind === 'boss', brute = kind === 'brute', gunner = kind === 'gunner';
  const assault = kind === 'assault', sniper = kind === 'sniper', raider = kind === 'raider';
  const armor = armorById(armorId); let cape = null;
  const shell = player ? armor.shell : boss ? '#49445b' : brute ? '#824d3b' : assault ? '#456e64' : sniper ? '#64628b' : raider ? '#813e54' : gunner ? '#b39b68' : '#596f79';
  const trim = player ? armor.trim : boss ? '#a78bba' : brute ? '#be8360' : '#9ba5a0';
  const dark = '#1b2935', joint = '#364652';
  const accent = player ? armor.accent : boss ? (arena.level?.accent || '#f38fff') : sniper ? '#c4b3ff' : assault ? '#8affcb' : raider ? '#ff77aa' : gunner ? '#ffc878' : '#ff7868';
  function part(geometry, size, position, color, parent = body, glow = false) {
    const mesh = new THREE.Mesh(geometry, arena.material(color, glow)); mesh.scale.set(...size); mesh.position.set(...position); mesh.castShadow = !glow; mesh.receiveShadow = !glow; parent.add(mesh); return mesh;
  }
  const plate = (size, pos, color, parent = body, glow = false) => part(armorGeometry, size, pos, color, parent, glow);
  const orb = (size, pos, color, parent = body, glow = false) => part(sphere, size, pos, color, parent, glow);
  if (kind === 'chaser') {
    // Low, four-legged pursuit drone: recognisable even at the edge of the screen.
    plate([.78, .37, .95], [0, .63, 0], shell);
    plate([.57, .16, .64], [0, .87, -.08], trim);
    plate([.62, .16, .12], [0, .71, .49], dark);
    for (const x of [-.18, .18]) orb([.075, .065, .035], [x, .72, .57], accent, body, true);
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      const leg = new THREE.Group(); leg.position.set(x * .35, .57, z * .29); root.add(leg); limbs.push(leg);
      orb([.13, .13, .13], [0, 0, 0], joint, leg);
      const limb = plate([.18, .43, .18], [x * .13, -.14, z * .06], shell, leg); limb.rotation.z = x * .65;
      plate([.15, .12, .4], [x * .22, -.48, z * .12], dark, leg);
      plate([.08, .045, .2], [x * .22, -.39, z * .12], accent, leg, true);
    }
    const fin = plate([.1, .4, .42], [0, 1.03, -.24], dark); fin.rotation.x = -.25;
  } else {
    // Layered breastplate over a flexible undersuit, with an exposed luminous reactor.
    plate([.57, .66, .42], [0, 1.1, 0], dark);
    const breast = part(taper, [.52, .61, .34], [0, 1.25, 0], shell); breast.rotation.z = Math.PI;
    plate([.71, .23, .16], [0, 1.42, .28], shell);
    plate([.35, .2, .12], [0, 1.21, .35], dark);
    orb([.1, .1, .05], [0, 1.23, .43], accent, body, true);
    for (const x of [-.21, .21]) { const rib = plate([.19, .34, .11], [x, 1.07, .28], trim); rib.rotation.z = x * .9; }
    plate([.59, .18, .43], [0, .79, 0], joint);
    for (const x of [-.22, .22]) plate([.18, .18, .12], [x, .81, .26], player ? armor.marking : trim);
    // Helmet shell, recessed glass visor, separate brow and chin armour.
    orb([.36, .34, .33], [0, 1.84, .015], shell);
    const visor = plate([.57, .21, .19], [0, 1.86, .28], '#101e29');
    if (player) {
      arena.mat.visor ||= new THREE.MeshPhysicalMaterial({ color: '#143645', metalness: .65, roughness: .13, clearcoat: 1, clearcoatRoughness: .1 });
      visor.material = arena.mat.visor;
      plate([.29, .012, .01], [-.035, 1.92, .382], '#a3cee0', body, true);
    }
    plate([.46, .055, .035], [0, 1.87, .392], accent, body, true);
    plate([.58, .09, .23], [0, 2.02, .23], shell);
    plate([.32, .12, .18], [0, 1.64, .28], trim);
    for (const x of [-.36, .36]) { orb([.07, .14, .15], [x, 1.85, 0], joint); plate([.04, .1, .08], [x * 1.1, 1.86, .02], accent, body, true); }
    for (const x of [-.24, .24]) {
      const leg = new THREE.Group(); leg.position.set(x, .75, 0); root.add(leg); limbs.push(leg);
      orb([.14, .14, .14], [0, -.04, 0], joint, leg);
      plate([.3, .33, .29], [0, -.19, 0], shell, leg);
      orb([.12, .12, .12], [0, -.39, 0], dark, leg);
      plate([.23, .18, .1], [0, -.37, .19], trim, leg);
      plate([.28, .3, .3], [0, -.54, 0], shell, leg);
      plate([.34, .16, .52], [0, -.69, .11], dark, leg);
      plate([.3, .065, .25], [0, -.59, .25], trim, leg);
    }
    // Asymmetric field markings and round shoulder articulation.
    for (const x of [-.53, .53]) {
      orb([.22, .2, .2], [x, 1.42, 0], joint);
      const shoulder = plate([.4, .31, .48], [x, 1.49, 0], player && x < 0 ? armor.marking : shell); shoulder.rotation.z = -x * .25;
      plate([.19, .31, .22], [x, 1.17, .12], dark);
      const forearm = plate([.25, .26, .39], [x, 1.07, .31], shell); forearm.rotation.x = -.4;
      plate([.1, .035, .23], [x, 1.65, .03], accent, body, true);
    }
    // Backpack, turbine housings and emissive exhausts.
    plate([.53, .56, .25], [0, 1.28, -.39], dark);
    for (const x of [-.22, .22]) {
      part(cylinder, [.12, .48, .12], [x, 1.29, -.56], trim);
      const jet = part(cone, [.09, .24, .09], [x, .94, -.56], accent, body, true); jet.rotation.z = Math.PI; jets.push(jet);
    }
    if (brute || boss) {
      for (const x of [-.66, .66]) {
        plate([.5, .42, .65], [x, 1.55, -.05], shell);
        plate([.39, .13, .52], [x, 1.82, -.05], trim);
        plate([.29, .06, .04], [x, 1.62, .31], accent, body, true);
      }
      plate([.65, .22, .18], [0, 1.48, .39], trim);
    }
    if (boss) {
      for (const x of [-.7, .7]) { const horn = part(cone, [.15, .76, .15], [x, 2.1, -.15], trim); horn.rotation.z = -x * .5; }
      orb([.21, .2, .08], [0, 1.19, .45], accent, body, true);
    }
  }
  if (assault) {
    for (const x of [-.62, .62]) {
      plate([.43, .3, .62], [x, 1.65, -.08], shell);
      for (let i = 0; i < 3; i++) plate([.09, .2, .15], [x + (i - 1) * .11, 1.64, .26], trim);
    }
    for (const x of [-.19, 0, .19]) plate([.13, .2, .14], [x, 1.48, .37], trim);
  }
  if (sniper) {
    const hood = plate([.73, .13, .73], [0, 2.09, -.08], shell); hood.rotation.x = -.12;
    orb([.13, .13, .06], [-.15, 1.87, .43], accent, body, true);
    const key = 'sniper-cloth';
    arena.mat[key] ||= new THREE.MeshStandardMaterial({ color: '#302c4c', roughness: 1, side: THREE.DoubleSide });
    cape = new THREE.Mesh(capeGeometry, arena.mat[key]); cape.position.set(0, 1.18, -.66); cape.scale.set(1.3, 1.35, 1); cape.castShadow = true; body.add(cape);
  }
  if (raider) {
    for (const x of [-.3, .3]) {
      const fin = part(cone, [.09, .52, .12], [x, 2.18, -.08], trim); fin.rotation.z = -x;
      const blade = plate([.07, .1, 1.15], [x * 2, 1, .8], accent, body, true); blade.rotation.y = x * .5;
    }
  }
  if (player) {
    // Layered helmet rails, shoulder insignia, utility pouches and an animated fabric mantle.
    for (const x of [-.22, .22]) {
      plate([.055, .055, .48], [x, 2.08, -.01], trim);
      plate([.04, .055, .18], [x, 2.09, .15], accent, body, true);
      plate([.16, .23, .14], [x, .92, -.22], armor.marking);
    }
    const antenna = part(cylinder, [.018, .43, .018], [-.39, 2.12, -.1], dark);
    orb([.035, .035, .035], [-.39, 2.35, -.1], accent, body, true);
    for (let i = 0; i < 3; i++) {
      const stripe = plate([.22, .032, .035], [-.53, 1.49 + i * .06, .252], shell); stripe.rotation.z = -.18;
    }
    const badge = plate([.14, .14, .035], [.22, 1.43, .39], armor.marking); badge.rotation.z = Math.PI / 4;
    for (const x of [-.49, .49]) {
      const fin = plate([.18, .32, .5], [x, 1.68, -.38], shell); fin.rotation.z = -x * .65;
      plate([.035, .22, .1], [x, 1.7, -.64], accent, body, true);
    }
    const fabricKey = 'fabric-' + armor.id;
    arena.mat[fabricKey] ||= new THREE.MeshStandardMaterial({ color: armor.cloth, roughness: .96, metalness: 0, side: THREE.DoubleSide });
    cape = new THREE.Mesh(capeGeometry, arena.mat[fabricKey]); cape.position.set(-.12, 1.13, -.65); cape.castShadow = true; body.add(cape);
  }
  const weapon = new THREE.Group(); weapon.position.set(.46, 1.08, .43); body.add(weapon);
  if (kind !== 'chaser' && !raider) {
    plate([.22, .23, .7], [0, .04, .12], dark, weapon);
    plate([.27, .12, .52], [0, .18, .11], shell, weapon);
    const barrel = part(cylinder, [.065, .47, .065], [0, .03, .68], joint, weapon); barrel.rotation.x = Math.PI / 2;
    plate([.16, .14, .11], [0, .03, .94], dark, weapon);
    plate([.08, .07, .02], [0, .03, 1.005], accent, weapon, true);
    plate([.13, .26, .21], [0, -.19, .07], trim, weapon);
    plate([.1, .045, .32], [0, .255, .23], accent, weapon, true);
    if (sniper) {
      part(cylinder, [.11, .11, .32], [0, .38, .3], dark, weapon).rotation.x = Math.PI / 2;
      orb([.08, .08, .03], [0, .38, .48], accent, weapon, true);
      weapon.scale.z = 1.65;
    }
    if (assault) { plate([.31, .3, .38], [0, -.06, .25], trim, weapon); weapon.scale.x = 1.25; }
    if (gunner || boss) { const drum = part(cylinder, [.18, .29, .18], [.19, .02, .12], trim, weapon); drum.rotation.z = Math.PI / 2; }
    if (brute) { plate([.51, .73, .14], [-1.08, .15, .08], shell, weapon); plate([.08, .59, .035], [-1.08, .15, .17], accent, weapon, true); }
  }
  // Batch rigid parts by geometry and material, leaving joints and weapon independently movable.
  function batch(group) {
    const batches = new Map();
    for (const m of [...group.children]) if (m.isMesh && !jets.includes(m)) {
      const key = m.geometry.uuid + m.material.uuid;
      if (!batches.has(key)) batches.set(key, []); batches.get(key).push(m);
    }
    for (const parts of batches.values()) {
      if (parts.length < 2) continue;
      const mesh = new THREE.InstancedMesh(parts[0].geometry, parts[0].material, parts.length);
      parts.forEach((p, i) => { p.updateMatrix(); mesh.setMatrixAt(i, p.matrix); group.remove(p); });
      mesh.castShadow = !mesh.material.isMeshBasicMaterial; mesh.receiveShadow = true; mesh.computeBoundingSphere(); group.add(mesh);
    }
  }
  batch(body); batch(weapon); for (const limb of limbs) batch(limb);
  const ring = arena.ring(player ? .76 : .66, accent, 0, 0, root, .018);
  const scale = boss ? 1.95 : brute ? 1.25 : player ? 1.08 : 1;
  root.scale.setScalar(scale); root.userData = { limbs, ring, scale, body, weapon, jets, cape, recoil: 0, kind, armorId: armor.id }; return root;
}

export function animateRobot(mesh, time, moving, dt, dash = false) {
  if (dt <= 0) return;
  const rig = mesh.userData, spider = rig.kind === 'chaser';
  rig.limbs.forEach((limb, i) => { limb.rotation.x = Math.sin(time * (spider ? 17 : 12) + i * Math.PI) * (moving ? .52 : .015); });
  rig.body.position.y = Math.sin(time * (moving ? 24 : 2.5)) * (moving ? .025 : .018);
  rig.body.rotation.x += ((dash ? .2 : moving ? .06 : 0) - rig.body.rotation.x) * Math.min(1, dt * 12);
  rig.recoil = Math.max(0, rig.recoil - dt * 7); rig.weapon.position.z = .43 - rig.recoil * .16;
  if (rig.cape) { rig.cape.rotation.x = -.08 + Math.sin(time * (moving ? 9 : 2)) * .05 - (dash ? .6 : moving ? .18 : 0); rig.cape.rotation.z = Math.sin(time * 3) * .035; }
  rig.jets.forEach(jet => { jet.scale.y = (dash ? .75 : .18) * (1 + Math.sin(time * 35) * .15); });
}
