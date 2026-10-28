import * as THREE from 'three';

// Each chapter owns its own scroll runway. The 3D story reads "story time":
// chapter index + progress through that chapter, so resizing one section never shifts the others.
// A `hold` chapter freezes story time and exposes its own progress instead (a close-up beat).
// `beats` are composed resting points (chapter progress) that scrolling settles onto.
export const CHAPTERS=[
  {id:'summit',label:'Summit',altitude:'0 m',vh:170,beats:[0]},
  {id:'launch',label:'Liftoff',altitude:'8,848 m',vh:260,beats:[.42,.8]},
  {id:'about',label:'About',altitude:'100 km',vh:200,hold:true,beats:[.45]},
  {id:'chase',label:'The chase',altitude:'400 km',vh:220,beats:[.5]},
  {id:'projects',label:'Projects',altitude:'36,000 km',vh:340,beats:[]},
  {id:'moon',label:'Moon pass',altitude:'384,400 km',vh:260,beats:[.5]},
  {id:'portal',label:'The portal',altitude:'??? km',vh:280,beats:[.4,.8]},
  {id:'blackhole',label:'Contact',altitude:'∞',vh:240,beats:[1]},
];

export const clamp=THREE.MathUtils.clamp;
export const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};

// Returns story time `s`, per-hold progress, and the index of the chapter in view.
export function readStory(sections,reduced) {
  const viewport=window.innerHeight;
  const progress=CHAPTERS.map((chapter,i)=>{
    const section=sections[i];if(!section)return 0;
    const {top,height}=section.getBoundingClientRect();
    // The last chapter can only scroll until its bottom meets the viewport bottom.
    const runway=i===CHAPTERS.length-1?Math.max(1,height-viewport):Math.max(1,height);
    return clamp(-top/runway,0,1);
  });
  let current=progress.findIndex(t=>t<1);if(current===-1)current=CHAPTERS.length-1;
  // Reduced motion: each chapter shows one still composition.
  if(reduced)progress.forEach((_,i)=>{progress[i]=i<current?1:i===current?.55:0;});
  let s=0;const holds={};
  CHAPTERS.forEach((chapter,i)=>{if(chapter.hold)holds[chapter.id]=progress[i];else s+=progress[i];});
  return {s,holds,current};
}

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
