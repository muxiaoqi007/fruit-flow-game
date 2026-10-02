const foundry = [
  { x: -9, z: -5, w: 3.6, d: 2.5 }, { x: 9, z: -5, w: 3.6, d: 2.5 },
  { x: -9, z: 5, w: 3.6, d: 2.5 }, { x: 9, z: 5, w: 3.6, d: 2.5 },
  { x: 0, z: -9, w: 4, d: 1.6 }, { x: 0, z: 9, w: 4, d: 1.6 },

];
export const LEVELS = [
  { id: 'foundry', sector: '07', name: '铸造场', english: 'THE FOUNDRY', description: '熟悉掩体与冲刺，突破机械军团的第一道封锁。', tactic: '均衡交战 · 环形弹幕', accent: '#d0ff75', floor: '#304035', fog: '#101915', armor: '#637653', boss: '歼灭者', pattern: 'radial', roster: ['chaser', 'chaser', 'gunner', 'chaser', 'brute'], cover: foundry },
  { id: 'cryovault', sector: '12', name: '极寒仓库', english: 'CRYO VAULT', description: '穿越冰蓝仓储通道，利用货架切断远程射手视线。', tactic: '远程压制 · 扇形齐射', accent: '#79e4ff', floor: '#293c4a', fog: '#0d1722', armor: '#597a90', boss: '霜卫', pattern: 'fan', roster: ['gunner', 'raider', 'sniper', 'brute', 'chaser'], cover: [
    { x: -10, z: -6, w: 3, d: 5 }, { x: 10, z: -6, w: 3, d: 5 }, { x: -10, z: 5, w: 3, d: 5 }, { x: 10, z: 5, w: 3, d: 5 }, { x: 0, z: -7, w: 5, d: 2 }, { x: 0, z: 8, w: 5, d: 2 },
  ] },
  { id: 'reactor', sector: '19', name: '熔炉中枢', english: 'EMBER REACTOR', description: '重装守卫接管反应堆。绕开装甲阵列，寻找交叉火力的空隙。', tactic: '重装围攻 · 旋转弹幕', accent: '#ffb16d', floor: '#47342b', fog: '#211510', armor: '#927051', boss: '熔核巨像', pattern: 'spiral', roster: ['brute', 'assault', 'gunner', 'raider', 'brute'], cover: [
    { x: -7, z: -6, w: 4, d: 3 }, { x: 7, z: -6, w: 4, d: 3 }, { x: -7, z: 6, w: 4, d: 3 }, { x: 7, z: 6, w: 4, d: 3 }, { x: -13, z: 0, w: 2, d: 4 }, { x: 13, z: 0, w: 2, d: 4 },
  ] },
  { id: 'nexus', sector: '00', name: '虚空核心', english: 'VOID NEXUS', description: '抵达失控信号源。击破混编精锐，追踪通往空中战区的残余信号。', tactic: '精锐混编 · 双重弹幕', accent: '#c4a0ff', floor: '#36324a', fog: '#151122', armor: '#756588', boss: '零界主宰', pattern: 'crossfire', roster: ['sniper', 'brute', 'raider', 'assault', 'gunner'], cover: [
    { x: -10, z: -7, w: 4, d: 2 }, { x: 10, z: -7, w: 4, d: 2 }, { x: -10, z: 7, w: 4, d: 2 }, { x: 10, z: 7, w: 4, d: 2 }, { x: -6, z: 0, w: 2, d: 4 }, { x: 6, z: 0, w: 2, d: 4 }, { x: 0, z: -10, w: 4, d: 1.5 },
  ] },
  { id: 'stormbridge', sector: '24', name: '雷暴栈桥', english: 'STORM BRIDGE', description: '信号源转移至空中栈桥。在交错掩体间推进，穿过雷霆守卫的交替弹幕。', tactic: '高速突袭 · 交替雷幕', accent: '#6effcf', floor: '#203d3d', fog: '#0b1c22', armor: '#4b8987', boss: '雷霆守卫', pattern: 'storm', roster: ['raider', 'assault', 'chaser', 'raider', 'sniper'], cover: [
    { x: -11, z: -7, w: 3, d: 3 }, { x: 7, z: -7, w: 5, d: 2 }, { x: -7, z: 6, w: 5, d: 2 }, { x: 11, z: 6, w: 3, d: 3 }, { x: -11, z: 0, w: 3, d: 2 }, { x: 11, z: 0, w: 3, d: 2 },
  ] },
  { id: 'skyport', sector: '31', name: '曙光空港', english: 'DAWN TERMINAL', description: '夺回最后的撤离平台。借助分散掩体躲避三路齐射，击败天穹执行官。', tactic: '终局攻坚 · 三路齐射', accent: '#ffd590', floor: '#3f3a37', fog: '#201c21', armor: '#a28c73', boss: '天穹执行官', pattern: 'trident', roster: ['brute', 'sniper', 'raider', 'assault', 'gunner'], cover: [
    { x: -10, z: -6, w: 3, d: 3 }, { x: 10, z: -6, w: 3, d: 3 }, { x: -10, z: 6, w: 3, d: 3 }, { x: 10, z: 6, w: 3, d: 3 }, { x: 0, z: -8, w: 3, d: 2 }, { x: 0, z: 9, w: 3, d: 2 },
  ] },
];
export const WAVES_PER_LEVEL = 5;
