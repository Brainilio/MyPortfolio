import * as THREE from 'three';

// The journey is a sequence of scenes. Each chapter rests at a story time `s` (or scrubs through an
// [from, to] range when it's taller than the viewport and scrolls internally). Moving between chapters is
// a timed transition the 3D plays on its own clock, so scrolling never lands on an in-between frame.
// `about` is the close-up's progress: 0 before it, .5 in it (photo and copy shown), 1 once flying.
export const CHAPTERS=[
  {id:'summit',label:'Summit',altitude:'0 m',s:0},
  {id:'about',label:'About',altitude:'100 km',s:2,about:.5},
  {id:'chase',label:'The chase',altitude:'400 km',s:2.5},
  {id:'projects',label:'Projects',altitude:'36,000 km',s:[3.06,3.9],vh:340},
  {id:'moon',label:'Moon pass',altitude:'384,400 km',s:[4.1,4.84],vh:260},
  {id:'portal',label:'The portal',altitude:'??? km',s:[5.1,5.9],vh:240},
  {id:'blackhole',label:'Contact',altitude:'∞',s:7},
];

export const clamp=THREE.MathUtils.clamp;
export const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const easeInOut=t=>{t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};

export const restS=(i,progress)=>{const s=CHAPTERS[i].s;return Array.isArray(s)?THREE.MathUtils.lerp(s[0],s[1],progress):s;};
export const restAbout=i=>i<1?0:CHAPTERS[i].about??1;
// How far through its internal scroll a chapter is (0 for single-screen chapters).
export function chapterProgress(section) {
  if(!section)return 0;
  const runway=section.offsetHeight-window.innerHeight;if(runway<2)return 0;
  return clamp((window.scrollY-(section.getBoundingClientRect().top+window.scrollY))/runway,0,1);
}

// Where the story is at `now`. `from` holds the story time when the transition began.
// Returns s, about, and the covers: `mist` (white cloud) and `dark` (veil) for cuts.
export function storyAt(story,from,now,progress) {
  const toS=restS(story.index,progress),toAbout=restAbout(story.index);
  const t=story.duration?(now-story.start)/story.duration:1;
  if(!story.start||t>=1)return {s:toS,about:toAbout,mist:0,dark:0,active:false};
  if(story.kind==='launch'){
    // Push in and hop aboard, then the rocket climbs (its own curve accelerates it) into the cloud deck;
    // under the thickest cloud the picture cuts to the close-up in orbit.
    const s=t<.22?1.08*easeInOut(t/.22):t<.8?1.08+.54*(t-.22)/.58:toS;
    return {s,about:t<.8?0:toAbout,mist:smooth((t-.5)/.24)*(1-smooth((t-.84)/.16)),dark:0,active:true};
  }
  if(story.kind==='cut'){
    const cover=smooth(t/.4)*(1-smooth((t-.5)/.5)),after=t>=.45;
    return {s:after?toS:from.s,about:after?toAbout:from.about,mist:story.mist?cover:0,dark:story.mist?0:cover,active:true};
  }
  return {s:THREE.MathUtils.lerp(from.s,toS,easeInOut(t)),about:toAbout,mist:0,dark:0,active:true};
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
