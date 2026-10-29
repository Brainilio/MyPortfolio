import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Shared forest builders for the road trip and the hike: tall tiered pines, snags, grass, wildflowers. All
// vertex-coloured and meant to be instanced.
// A tall forest pine (height 1): a long bare trunk, then six drooping tiers of boughs narrowing to a spire.
export function paintGeometry(g,hex){const c=new THREE.Color(hex),n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++)a.set([c.r,c.g,c.b],i*3);g.setAttribute("color",new THREE.BufferAttribute(a,3));return g;}
export function mergeFlat(parts){const merged=mergeGeometries(parts.map(g=>{const flat=g.index?g.toNonIndexed():g;flat.deleteAttribute("uv");flat.deleteAttribute("normal");return flat;}));merged.computeVertexNormals();return merged;}
export function createForestPine(rng) {
  const parts=[paintGeometry(new THREE.CylinderGeometry(.012,.026,1,5).translate(0,.5,0),"#6e3f26")];
  for(let k=0;k<6;k++){const f=k/6,radius=.2*(1-f*.8),height=.2-f*.05;
    parts.push(paintGeometry(new THREE.ConeGeometry(radius*(.9+rng()*.2),height,7).rotateY(rng()*2).translate(0,.3+f*.6+height/2,0),k%2?"#3f6b2c":"#4f7d33"));}
  return mergeFlat(parts);
}
export function createSnag() {
  const parts=[paintGeometry(new THREE.CylinderGeometry(.006,.022,1,5).translate(0,.5,0),"#7a4a30")];
  for(let k=0;k<5;k++){const y=.35+k*.12,a=k*2.4;parts.push(paintGeometry(new THREE.CylinderGeometry(.003,.006,.12,4).rotateZ(Math.PI/2.3).rotateY(a).translate(Math.cos(a)*.05,y,-Math.sin(a)*.05),"#7a4a30"));}
  return mergeFlat(parts);
}
// Undergrowth: a tuft of grass blades, a lupine spike and a daisy (normals point up so they light evenly).
export function upright(g){const n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++)a.set([0,1,0],i*3);g.setAttribute("normal",new THREE.BufferAttribute(a,3));return g;}
export function createTuft(rng) {
  const pos=[],col=[],base=new THREE.Color("#3e6a27"),tip=new THREE.Color("#a9c95a");
  for(let k=0;k<6;k++){const a=rng()*Math.PI*2,h=.16+rng()*.2,lean=.06+rng()*.08,w=.03,x=Math.cos(a)*.06,z=Math.sin(a)*.06,c=Math.cos(a+1.57)*w,d=Math.sin(a+1.57)*w;
    pos.push(x-c,0,z-d,x+c,0,z+d,x+Math.cos(a)*lean,h,z+Math.sin(a)*lean);col.push(base.r,base.g,base.b,base.r,base.g,base.b,tip.r,tip.g,tip.b);}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("color",new THREE.Float32BufferAttribute(col,3));return upright(g);
}
export function createLupine() {
  const stem=paintGeometry(new THREE.CylinderGeometry(.008,.01,.45,3).translate(0,.22,0),"#4b7a2e"),spike=paintGeometry(new THREE.ConeGeometry(.05,.24,5).translate(0,.55,0),"#8b6fd6");
  return upright(mergeGeometries([stem,spike].map(g=>{g.deleteAttribute("uv");g.deleteAttribute("normal");return g.index?g.toNonIndexed():g;})));
}
export function createDaisy() {
  const stem=paintGeometry(new THREE.CylinderGeometry(.006,.008,.28,3).translate(0,.14,0),"#4b7a2e"),petals=paintGeometry(new THREE.CircleGeometry(.06,6).rotateX(-Math.PI/2).translate(0,.285,0),"#f6f3ea"),eye=paintGeometry(new THREE.CircleGeometry(.022,5).rotateX(-Math.PI/2).translate(0,.29,0),"#f2c13a");
  return upright(mergeGeometries([stem,petals,eye].map(g=>{g.deleteAttribute("uv");g.deleteAttribute("normal");return g.index?g.toNonIndexed():g;})));
}

// A slim spruce (height 1): a short trunk under one long narrow spire of dark blue-green tiers.
export function createSpruce(rng) {
  const parts=[paintGeometry(new THREE.CylinderGeometry(.012,.022,.3,5).translate(0,.15,0),"#5e3a25")];
  for(let k=0;k<8;k++){const f=k/8,radius=.13*(1-f*.85)+.015,height=.16;
    parts.push(paintGeometry(new THREE.ConeGeometry(radius*(.9+rng()*.2),height,6).rotateY(rng()*2).translate(0,.14+f*.78+height/2,0),k%2?"#2d5a3c":"#35684a"));}
  return mergeFlat(parts);
}
// A round leafy tree (height 1): a trunk with three faceted blobs of canopy, in the given pair of colours
// (spring green, or fall gold, orange and red).
export function createRoundTree(rng,[light,dark]=["#a3c457","#8fb64e"]) {
  const parts=[paintGeometry(new THREE.CylinderGeometry(.025,.04,.5,5).translate(0,.25,0),"#7a5235")];
  [[0,.62,0,.26],[.12,.52,.06,.18],[-.1,.5,-.05,.17]].forEach(([x,y,z,r],k)=>parts.push(paintGeometry(new THREE.IcosahedronGeometry(r*(.9+rng()*.2),0).translate(x,y,z),k?dark:light)));
  return mergeFlat(parts);
}
// An aspen (height 1): a slim white trunk with dark knots and a tall narrow crown of golden leaves.
export function createAspen(rng) {
  const parts=[paintGeometry(new THREE.CylinderGeometry(.014,.022,.75,5).translate(0,.375,0),"#e8e4da")];
  for(let k=0;k<3;k++)parts.push(paintGeometry(new THREE.BoxGeometry(.03,.02,.03).translate(0,.15+k*.18,0),"#3b3530"));
  [[0,.82,0,.12],[.04,.66,.02,.13],[-.04,.52,-.02,.11]].forEach(([x,y,z,r],k)=>parts.push(paintGeometry(new THREE.IcosahedronGeometry(r*(.9+rng()*.2),0).scale(1,1.35,1).translate(x,y,z),k%2?"#e0a92c":"#f2c443")));
  return mergeFlat(parts);
}

// A ground-cover bush (height 1): a low mound of three faceted green blobs.
export function createBush(rng) {
  const parts=[];[[0,.42,0,.45],[.32,.3,.12,.32],[-.3,.28,-.1,.3]].forEach(([x,y,z,r],k)=>parts.push(paintGeometry(new THREE.IcosahedronGeometry(r*(.9+rng()*.2),0).scale(1,.75,1).translate(x,y,z),k?"#3f7a34":"#4d8c3c")));
  return mergeFlat(parts);
}

// California poppy: an orange cup of four petals on a short stem.
export function createPoppy() {
  const stem=paintGeometry(new THREE.CylinderGeometry(.008,.01,.14,3).translate(0,.07,0),"#5d8a3a"),parts=[stem];
  for(let k=0;k<4;k++)parts.push(paintGeometry(new THREE.CircleGeometry(.075,6,-.7,1.4).rotateX(-Math.PI/2+.7).translate(0,.015,.03).rotateY(k*Math.PI/2+.4).translate(0,.14,0),k%2?"#f0861a":"#f7a52a"));
  return upright(mergeGeometries(parts.map(g=>{g.deleteAttribute("uv");g.deleteAttribute("normal");return g.index?g.toNonIndexed():g;})));
}

// Undergrowth material: sways in the breeze from its root up (vertex shader, per-instance phase), harder in the
// gusts that roll across the slope.
export function createSwayMaterial(time,strength=1) {
  const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide});
  m.onBeforeCompile=shader=>{shader.uniforms.uTime=time;shader.vertexShader=shader.vertexShader.replace("#include <common>","#include <common>\nuniform float uTime;").replace("#include <begin_vertex>",`#include <begin_vertex>
    vec3 root=vec3(instanceMatrix[3]);float gust=.55+.45*sin(uTime*.55-(root.x+root.z)*.06);float k=transformed.y*transformed.y*${strength.toFixed(2)}*(.5+gust);
    transformed.x+=sin(uTime*1.7+root.x*.35+root.z*.27)*.3*k;transformed.z+=cos(uTime*1.3+root.x*.21)*.14*k;`);};
  return m;
}
