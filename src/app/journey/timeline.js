import * as THREE from 'three';

// The space experiments' places in the shared 3D scene (titles and notes live in experiments.js). Each rests at a story time `s` (placing the world and the
// actors), or plays through an [from, to] range as you scroll (`scroll`: its length in screen heights). `enter` is how the 3D arrives from the experiment
// before: 'cut' (a glitch), 'liquid' (a melt), 'fade', or 'same' (it's the same shot). Going back always cuts.
export const CHAPTERS=[
  {id:'launch',s:[.35,1.6],scroll:3},
  {id:'about',s:2,enter:'cut'},
  {id:'skills',s:2,scroll:2.5,enter:'same'},
  {id:'projects',s:[3.06,3.9],scroll:4,enter:'liquid'},
  // Moon pass: parked for now (too busy); its set pieces stay in the world.
  {id:'aliens',s:[5.4,5.9],scroll:4,enter:'cut'},
  {id:'contact',s:7,enter:'cut'},
];
export const chapterIndex=id=>CHAPTERS.findIndex(c=>c.id===id);

export const clamp=THREE.MathUtils.clamp;
export const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};

export const restS=(i,progress)=>{const s=CHAPTERS[i].s;return Array.isArray(s)?THREE.MathUtils.lerp(s[0],s[1],progress):s;};

// Piecewise smooth interpolation through [time, value] keys.
export function track(s,keys) {
  if(s<=keys[0][0])return keys[0][1];
  for(let i=1;i<keys.length;i++)if(s<=keys[i][0])
    return THREE.MathUtils.lerp(keys[i-1][1],keys[i][1],smooth((s-keys[i-1][0])/(keys[i][0]-keys[i-1][0])));
  return keys.at(-1)[1];
}
// Linear version, for positions along the flight path (keeps speed continuous).
export function trackLinear(s,keys) {
  if(s<=keys[0][0])return keys[0][1];
  for(let i=1;i<keys.length;i++)if(s<=keys[i][0])
    return THREE.MathUtils.lerp(keys[i-1][1],keys[i][1],(s-keys[i-1][0])/(keys[i][0]-keys[i-1][0]));
  return keys.at(-1)[1];
}
// 0 far away → 1 close, for revealing objects out of the dark instead of popping them in.
export const reveal=(distance,near,far)=>1-smooth((distance-near)/(far-near));
