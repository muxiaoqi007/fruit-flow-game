import { Game, LEVELS, WEAPONS, UPGRADES, aimTarget } from './engine.mjs';
import { Arena } from './scene.mjs';
import { ARMORS, armorById } from './appearance.mjs';
import { Audio } from './audio.mjs';
const $ = id => document.getElementById(id), game = new Game(), audio = new Audio();
let arena;
try { arena = new Arena($('scene')); } catch (error) { $('error').hidden = false; console.error(error); }
if (arena) {
  let selectedLevel = 0, armorId = 'aurora', quality = 'high';
  try { armorId = armorById(localStorage.getItem('null-sector-armor')).id; quality = localStorage.getItem('null-sector-quality') === 'low' ? 'low' : 'high'; } catch {}
  arena.setArmor(armorId); arena.setQuality(quality);
  let visualTime = 0;
  let completed = []; try { const stored = JSON.parse(localStorage.getItem('null-sector-cleared') || '[]'); if (Array.isArray(stored)) completed = stored.filter(id => LEVELS.some(level => level.id === id)); } catch {}
  let best = 0; try { best = Number(localStorage.getItem('null-sector-best')) || 0; } catch {}
  const keys = new Set(), pointer = { x: innerWidth / 2, y: innerHeight / 2, down: false }, stick = { x: 0, z: 0, id: null }, touch = { fire: false, id: null };
  let last = performance.now(), accumulator = 0, uiTime = 0, bannerUntil = 0, damageUntil = 0, previousMode = '', resumeMode = 'playing';
  const minimap = $('minimap').getContext('2d');
  let isTouch = matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0;
  document.body.classList.toggle('touch-mode', isTouch);
  window.addEventListener('pointerdown', event => { if (event.pointerType === 'touch' || event.pointerType === 'mouse') { isTouch = event.pointerType === 'touch'; document.body.classList.toggle('touch-mode', isTouch); } }, { capture: true });
  function clearInput() { keys.clear(); pointer.down = false; touch.fire = false; touch.id = null; stick.x = stick.z = 0; stick.id = null; $('stick').firstElementChild.style.transform = ''; }
  function save() { if (game.score > best) { best = game.score; try { localStorage.setItem('null-sector-best', String(best)); } catch {} } }
  function banner(text) { $('banner').textContent = text; bannerUntil = performance.now() + 2800; }
  function start(levelIndex = selectedLevel) { audio.unlock(); clearInput(); game.start(levelIndex); $('welcome').hidden = true; $('modal').hidden = true; previousMode = ''; ui(); }
  function pause() { if (game.mode === 'playing') { resumeMode = game.mode; game.mode = 'paused'; clearInput(); } else if (game.mode === 'paused') game.mode = resumeMode; ui(); }
  function modal() {
    const mode = game.mode; document.body.classList.toggle('playing', mode === 'playing'); $('welcome').hidden = mode !== 'ready'; $('modal').hidden = !['paused', 'upgrade', 'cleared', 'won', 'lost'].includes(mode); $('pause').textContent = mode === 'paused' ? '▷' : 'Ⅱ'; $('pause').disabled = !['playing', 'paused'].includes(mode);
    if (mode === previousMode) return; previousMode = mode;
    $('upgrades').replaceChildren(); $('result-stats').replaceChildren(); $('resume').hidden = mode !== 'paused'; $('restart').hidden = !['won', 'lost'].includes(mode); $('next-level').hidden = mode !== 'cleared'; $('pilot-label').hidden = mode !== 'ready';
    if (mode === 'paused') { $('modal-eyebrow').textContent = 'SIMULATION PAUSED'; $('modal-title').textContent = '战术暂停'; $('modal-description').textContent = '防线暂时安全。准备好后，继续你的战斗。'; }
    if (mode === 'upgrade') {
      clearInput(); $('modal-eyebrow').textContent = `WAVE ${String(game.wave).padStart(2, '0')} / COMPLETE`; $('modal-title').textContent = '防线稳固。选择你的强化。'; $('modal-description').textContent = '选择一项永久强化，补满弹药并修复 15 点装甲，然后迎接下一波。';
      for (const item of UPGRADES) { const b = document.createElement('button'); b.className = 'upgrade-card'; b.innerHTML = `<span>${item.icon}</span><small>${item.tag}</small><b>${item.name}</b><p>${item.description}</p>`; b.onclick = () => { audio.unlock(); game.chooseUpgrade(item.id); ui(); }; $('upgrades').append(b); }
    }
    if (mode === 'cleared') {
      clearInput(); save(); markCleared(); $('modal-eyebrow').textContent = `SECTOR ${game.level.sector} / SECURED`; $('modal-title').textContent = `${game.level.name}已肃清`; $('modal-description').textContent = `下一站：${LEVELS[game.levelIndex + 1].name}。保留当前强化与积分，修复全部装甲并补满弹药。`;
      $('next-level').innerHTML = `进入${LEVELS[game.levelIndex + 1].name} <span>↗</span>`;
    }
    if (mode === 'won' || mode === 'lost') {
      clearInput(); save(); if (mode === 'won') markCleared(); $('modal-eyebrow').textContent = mode === 'won' ? 'OPERATION COMPLETE' : 'CONNECTION LOST'; $('modal-title').textContent = mode === 'won' ? '零界已肃清。防线由你守住。' : '信号丢失，等待重新部署。'; $('modal-description').textContent = mode === 'won' ? '曙光空港已夺回，天穹执行官已被击败。本次作战战绩已记录。' : '善用掩体阻挡弹幕，冲刺可短暂无敌。维修箱会恢复装甲。';
      $('result-stats').innerHTML = `<span>作战积分<b>${game.score}</b></span><span>击破单位<b>${game.kills}</b></span><span>命中率<b>${game.shots ? Math.round(game.hits / game.shots * 100) : 0}%</b></span>`;
    }
  }
  function ui() {
    modal(); const level = game.level; document.documentElement.style.setProperty('--lime', level.accent);
    $('header-sector').textContent = `SECTOR ${level.sector}`; $('operation').textContent = `OPERATION / 0${game.levelIndex + 1} OF ${String(LEVELS.length).padStart(2, '0')}`; $('stage-name').textContent = level.name; $('stage-english').textContent = level.english;
    $('sector-number').textContent = level.sector; $('sector-english').textContent = level.english; $('sector-tactic').textContent = level.tactic; $('boss-name').textContent = level.boss;
    const p = game.player, w = WEAPONS[game.weapon]; $('hp').textContent = Math.ceil(p.hp); $('max-hp').textContent = p.maxHp; $('health-fill').style.width = p.hp / p.maxHp * 100 + '%'; $('health-fill').style.background = p.hp < p.maxHp * .3 ? '#ff8069' : '';
    $('dash-fill').style.width = (1 - p.dashCooldown / p.dashMax) * 100 + '%'; $('dash-text').textContent = p.dashCooldown > 0 ? p.dashCooldown.toFixed(1) + 's' : 'READY';
    $('wave').textContent = String(Math.max(1, game.wave)).padStart(2, '0'); $('enemies').textContent = String(game.enemies.length).padStart(2, '0'); $('mission-state').textContent = game.mode === 'ready' ? '等待部署' : game.intermission > 0 ? '下一波准备中' : '防守进行中';
    [...$('wave-bars').children].forEach((el, i) => el.classList.toggle('active', i < Math.max(1, game.wave)));
    $('score').textContent = String(game.score).padStart(6, '0'); $('best').textContent = String(Math.max(best, game.score)).padStart(6, '0'); $('kills').textContent = String(game.kills).padStart(2, '0'); $('time').textContent = String(Math.floor(game.time / 60)).padStart(2, '0') + ':' + String(Math.floor(game.time % 60)).padStart(2, '0');
    $('weapon-name').textContent = w.name; $('weapon-code').textContent = w.code; $('weapon-slot').textContent = `0${game.weapon + 1} / 02`; $('ammo').textContent = String(game.ammo[game.weapon]).padStart(2, '0'); $('magazine').textContent = ' / ' + w.magazine;
    $('reload-status').innerHTML = game.reloadTime ? `装填中 · ${game.reloadTime.toFixed(1)}s` : '<kbd>R</kbd> 换弹 · 无限备用弹药';
    $('combo').textContent = game.combo >= 3 ? `${game.combo} CHAIN / 连续击破` : '';
    const boss = game.enemies.find(e => e.kind === 'boss'); $('boss').hidden = !boss; if (boss) { $('boss-hp').textContent = `${Math.ceil(boss.hp)} / ${boss.maxHp}`; $('boss').querySelector('i').style.width = boss.hp / boss.maxHp * 100 + '%'; }
    drawMap();
  }
  function drawMap() {
    const ctx = minimap, map = (x, z) => [90 + x * 4.1, 70 + z * 4.1]; ctx.clearRect(0, 0, 180, 140); ctx.strokeStyle = '#91ac7220'; ctx.lineWidth = 1;
    for (let i = 10; i <= 170; i += 20) { ctx.beginPath(); ctx.moveTo(i, 10); ctx.lineTo(i, 130); ctx.stroke(); } for (let i = 10; i <= 130; i += 20) { ctx.beginPath(); ctx.moveTo(10, i); ctx.lineTo(170, i); ctx.stroke(); }
    ctx.strokeStyle = '#a9c78160'; ctx.strokeRect(12, 13, 156, 114); ctx.fillStyle = '#70875b80'; for (const c of game.cover) { const [x, z] = map(c.x - c.w / 2, c.z - c.d / 2); ctx.fillRect(x, z, c.w * 4.1, c.d * 4.1); }
    const enemies = game.mode === 'ready' ? [{ x: 11, z: 1 }, { x: 5, z: -7 }, { x: -3, z: -3 }, { x: 13, z: -8 }] : game.enemies;
    ctx.fillStyle = '#ff876c'; for (const e of enemies) { const [x, z] = map(e.x, e.z); ctx.beginPath(); ctx.arc(x, z, e.kind === 'boss' ? 4 : 2, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#cfff7e'; for (const item of game.pickups) { const [x, z] = map(item.x, item.z); ctx.fillRect(x - 1.5, z - 1.5, 3, 3); }
    const [x, z] = map(game.player.x, game.player.z); ctx.save(); ctx.translate(x, z); ctx.rotate(-game.player.angle); ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(-3.5, -4); ctx.lineTo(3.5, -4); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function input() {
    const x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) + stick.x;
    const z = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) + stick.z;
    let angle = game.player.angle;
    if (isTouch) {
      if (touch.fire) { const enemy = aimTarget(game.player, game.enemies, game.cover, game.weapon === 1 ? 20 : 58); if (enemy) angle = Math.atan2(enemy.x - game.player.x, enemy.z - game.player.z); }
      else if (Math.hypot(x, z) > .1) angle = Math.atan2(x, z);
    } else { const target = arena.aim(pointer.x, pointer.y); angle = Math.atan2(target.x - game.player.x, target.z - game.player.z); }
    return { x, z, angle, fire: pointer.down || touch.fire };
  }
  $('start').onclick = () => start(); $('restart').onclick = () => start(game.levelIndex); $('resume').onclick = pause; $('pause').onclick = pause;
  $('quit').onclick = () => { save(); clearInput(); selectedLevel = game.levelIndex; game.reset(selectedLevel); game.mode = 'ready'; drawLevelSelect(); ui(); };
  $('sound').onclick = () => { audio.unlock(); audio.enabled = !audio.enabled; $('sound').querySelector('b').textContent = audio.enabled ? 'ON' : 'OFF'; $('sound').setAttribute('aria-pressed', String(audio.enabled)); };
  $('fullscreen').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { banner('当前浏览器不支持全屏模式'); } };
  window.addEventListener('keydown', e => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (e.repeat) return; keys.add(e.code);
    if (e.code === 'Escape' || e.code === 'KeyP') pause();
    if (game.mode !== 'playing') return;
    if (e.code === 'Space' || e.code === 'ShiftLeft') { const v = input(); game.dash(v.x, v.z); }
    if (e.code === 'KeyR') game.reload();
    if (e.code === 'KeyQ') game.switchWeapon(1 - game.weapon);
    if (e.code === 'Digit1') game.switchWeapon(0); if (e.code === 'Digit2') game.switchWeapon(1);
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
  window.addEventListener('pointermove', e => { if (e.pointerType !== 'touch') { pointer.x = e.clientX; pointer.y = e.clientY; $('crosshair').style.left = e.clientX + 'px'; $('crosshair').style.top = e.clientY + 'px'; } });
  arena.renderer.domElement.addEventListener('pointerdown', e => { if (e.button === 0 && e.pointerType !== 'touch' && game.mode === 'playing') { audio.unlock(); pointer.down = true; pointer.x = e.clientX; pointer.y = e.clientY; arena.renderer.domElement.setPointerCapture(e.pointerId); } });
  window.addEventListener('pointerup', e => { if (e.pointerType !== 'touch') pointer.down = false; });
  window.addEventListener('pointercancel', e => { if (e.pointerType !== 'touch') pointer.down = false; });
  const blur = () => { clearInput(); if (game.mode === 'playing') pause(); }; window.addEventListener('blur', blur); document.addEventListener('visibilitychange', () => { if (document.hidden) blur(); });
  $('touch-switch').onclick = () => game.switchWeapon(1 - game.weapon); $('touch-dash').onclick = () => { audio.unlock(); game.dash(stick.x, stick.z); };
  $('touch-fire').addEventListener('pointerdown', e => { if (touch.id !== null) return; e.preventDefault(); audio.unlock(); touch.fire = true; touch.id = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); });
  const releaseFire = e => { if (touch.id === e.pointerId) { touch.fire = false; touch.id = null; } }; $('touch-fire').addEventListener('pointerup', releaseFire); $('touch-fire').addEventListener('lostpointercapture', releaseFire); $('touch-fire').addEventListener('pointercancel', releaseFire);
  const moveStick = e => { if (e.pointerId !== stick.id) return; const r = $('stick').getBoundingClientRect(), dx = e.clientX - r.left - r.width / 2, dz = e.clientY - r.top - r.height / 2, length = Math.hypot(dx, dz), max = 32, scale = length > max ? max / length : 1; stick.x = dx * scale / max; stick.z = dz * scale / max; $('stick').firstElementChild.style.transform = `translate(${dx * scale}px,${dz * scale}px)`; };
  $('stick').addEventListener('pointerdown', e => { if (stick.id !== null) return; e.preventDefault(); stick.id = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); moveStick(e); }); $('stick').addEventListener('pointermove', moveStick);
  const releaseStick = e => { if (stick.id !== e.pointerId) return; stick.x = stick.z = 0; stick.id = null; $('stick').firstElementChild.style.transform = ''; }; $('stick').addEventListener('pointerup', releaseStick); $('stick').addEventListener('lostpointercapture', releaseStick); $('stick').addEventListener('pointercancel', releaseStick);
  arena.renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); blur(); $('error').hidden = false; $('error').querySelector('p').textContent = '图形连接已中断，请刷新页面重新部署。'; });
  function frame(now) {
    const dt = Math.min((now - last) / 1000, .05); last = now; accumulator += dt;
    while (accumulator >= 1 / 60) { game.update(1 / 60, input()); accumulator -= 1 / 60; }
    for (const e of game.events) { arena.event(e); audio.play(e.type); if (e.type === 'message') banner(e.text); if (e.type === 'wave') banner(e.wave === 5 ? `最终波次 / ${game.level.boss}正在接近` : `WAVE 0${e.wave} / 入侵信号已确认`); if (e.type === 'hurt') damageUntil = now + 160; if (e.type === 'end') save(); } game.events = [];
    $('banner').classList.toggle('visible', now < bannerUntil && game.mode === 'playing'); $('damage-flash').style.opacity = now < damageUntil ? .5 : 0;
    uiTime += dt; if (uiTime > .08 || previousMode !== game.mode) { ui(); uiTime = 0; }
    const visualDelta = ['ready', 'playing'].includes(game.mode) ? dt : 0; visualTime += visualDelta;
    arena.render(game, visualDelta, visualTime); requestAnimationFrame(frame);
  }
  // A read-only diagnostic snapshot supports browser verification without changing gameplay.
  window.nullSector = { snapshot: () => ({ mode: game.mode, armor: armorId, quality, visualTime, level: game.levelIndex, levelName: game.level.name, wave: game.wave, hp: game.player.hp, x: game.player.x, z: game.player.z, enemies: game.enemies.length, ammo: [...game.ammo], weapon: game.weapon, reload: game.reloadTime, score: game.score, dashCooldown: game.player.dashCooldown, renderer: { ...arena.renderer.info.render }, memory: { ...arena.renderer.info.memory } }) };
  function markCleared() {
    if (!completed.includes(game.level.id)) completed.push(game.level.id);
    try { localStorage.setItem('null-sector-cleared', JSON.stringify(completed)); } catch {}
    drawLevelSelect();
  }
  function drawLevelSelect() {
    $('level-select').replaceChildren();
    LEVELS.forEach((level, index) => {
      const button = document.createElement('button'); button.className = 'level-choice'; button.dataset.level = index;
      button.classList.toggle('selected', index === selectedLevel); button.setAttribute('aria-pressed', String(index === selectedLevel)); button.style.setProperty('--stage-color', level.accent);
      button.innerHTML = `<small>0${index + 1} / ${completed.includes(level.id) ? '已肃清 ✓' : 'SECTOR ' + level.sector}</small><b>${level.name}</b>`;
      button.onclick = () => { selectedLevel = index; game.preview(index); drawLevelSelect(); ui(); };
      $('level-select').append(button);
    });
    $('level-description').textContent = LEVELS[selectedLevel].description;
  }
  $('next-level').onclick = () => { clearInput(); audio.unlock(); if (game.nextLevel()) { selectedLevel = game.levelIndex; drawLevelSelect(); ui(); } };
  function selectArmor(id) {
    armorId = armorById(id).id; arena.setArmor(armorId);
    try { localStorage.setItem('null-sector-armor', armorId); } catch {}
    const armor = armorById(armorId); $('pilot-label').querySelector('small').textContent = armor.code; $('pilot-label').querySelector('b').textContent = armor.name + ' · 游骑兵战甲';
    for (const button of $('armor-select').children) { const active = button.dataset.armor === armorId; button.classList.toggle('selected', active); button.setAttribute('aria-pressed', String(active)); }
  }
  for (const armor of ARMORS) {
    const button = document.createElement('button'); button.dataset.armor = armor.id; button.style.setProperty('--armor-color', armor.shell);
    button.innerHTML = `<i></i>${armor.name}`; button.onclick = () => selectArmor(armor.id); $('armor-select').append(button);
  }
  function showQuality() { $('quality').textContent = quality === 'high' ? '画质 高' : '画质 低'; $('quality').setAttribute('aria-label', `当前${quality === 'high' ? '高' : '低'}画质，点击切换`); }
  $('quality').onclick = () => { quality = quality === 'high' ? 'low' : 'high'; arena.setQuality(quality); try { localStorage.setItem('null-sector-quality', quality); } catch {} showQuality(); };
  selectArmor(armorId); showQuality(); drawLevelSelect(); ui(); requestAnimationFrame(frame);
}
