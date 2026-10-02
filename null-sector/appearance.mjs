export const ARMORS = [
  { id: 'aurora', name: '极光先锋', code: 'VANGUARD / A–07', shell: '#e7eee9', trim: '#608f9d', accent: '#80f2ff', marking: '#f5c27c', cloth: '#264657' },
  { id: 'midnight', name: '夜巡侦察', code: 'PATHFINDER / N–12', shell: '#344963', trim: '#8babc0', accent: '#bbacff', marking: '#a797de', cloth: '#25243f' },
  { id: 'ember', name: '赤焰突击', code: 'STRIKER / R–19', shell: '#b74b40', trim: '#eed6ae', accent: '#ffdb89', marking: '#f1ba69', cloth: '#4f2d30' },
];
export function armorById(id) { return ARMORS.find(armor => armor.id === id) || ARMORS[0]; }
