import * as THREE from 'three';

// The page is a stack of sections, each with its own calm composition. A section rests at a story time `s`
// (placing the world and the actors), or eases through an [from, to] range while its copy scrolls.
// `enter` is how the 3D arrives from the section before: 'cut' (a glitch), 'liquid' (a melt), 'fade', or
// 'same' (it's the same shot, so nothing happens). Going back up always cuts.
export const CHAPTERS=[
  // The hero has no 3D of its own: it scrolls away over the About close-up at 100 km.
  {id:'summit',label:'Hello',altitude:'0 m',s:2},
  {id:'about',label:'About',altitude:'100 km',s:2,enter:'same'},
  {id:'skills',label:'Skills',altitude:'100 km',s:2,vh:200,enter:'same'},
  {id:'projects',label:'Projects',altitude:'36,000 km',s:[3.06,3.9],vh:340,enter:'liquid'},
  // Moon pass: parked for now (too busy); its set pieces stay in the world.
  // {id:'moon',label:'Moon pass',altitude:'384,400 km',s:[4.1,4.84],vh:260},
  {id:'aliens',label:'Defend',altitude:'??? km',s:[5.4,5.9],vh:260,enter:'cut'},
  {id:'contact',label:'Contact',altitude:'∞',s:7,enter:'cut'},
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
