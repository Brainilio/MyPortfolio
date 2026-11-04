import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createGeyser } from "./park-parts";
import { createIsland, createWater, createPineGeometry, createSwayingInstances, bakeProp, random } from "./island-parts";

// The Work section's island: a Yellowstone meadow at golden hour. A river rises at the foot of the peaks at the back,
// curls through the meadow and runs into a lake in the front-left; a low Teton-ish range (the hero's mountain model,
// recoloured grey-blue under white caps) stands along the back edge; pines line the bank and the mountains' foot; the
// open meadow right of the river is where the herd grazes.
const smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const PATH=new THREE.CatmullRomCurve3([[1.2,0,-2.75],[.75,0,-1.75],[-.15,0,-.95],[-.45,0,.05],[-1.05,0,.95],[-1.75,0,1.65]].map(p=>new THREE.Vector3(...p))).getSpacedPoints(60);
function riverAt(x,z){let best=1e9,at=0;PATH.forEach((p,i)=>{const d=(p.x-x)**2+(p.z-z)**2;if(d<best){best=d;at=i;}});return {d:Math.sqrt(best),t:at/(PATH.length-1)};}
// The lake: an oval about 22% of the island's ~10.8 diameter across and 16% deep, its rim wobbled by a few bumps.
export const LAKE={x:-2.15,z:2.05,rx:1.2,rz:.86};
const bump=a=>1+.07*Math.sin(7*a+.8)+.04*Math.sin(3*a+2.1)+.025*Math.sin(11*a);
// How far out from the lake's middle a point is, in lake radii (1 on the rim).
const lakeE=(x,z)=>{const dx=(x-LAKE.x)/LAKE.rx,dz=(z-LAKE.z)/LAKE.rz;return Math.hypot(dx,dz)/bump(Math.atan2(dz,dx));};
const LEVEL=-.15;
// Where the herd stands when it arrives (the last is the calf, beside its mother): the open meadow right of the river.
const SPOTS=[[1.2,.3],[.4,1.6],[2.2,1.1],[1.4,2.1],[.85,.9]];
// Fall trees (mid-island left of the river, and the front right), each its own colour, no two neighbours alike; and
// the two geysers (rear right at the mountains' foot, and mid right), kept clear of trees and the herd.
const FALL=[[-2.6,-.5],[-3.05,.45],[-1.75,-.15],[3.0,2.35],[2.25,3.15],[3.65,1.45],[1.25,3.4]];
const FALL_COLORS=["#e8742a","#d4a020","#c45820","#8b2020","#e8a030"];
export const GEYSERS=[[2.65,-1.55],[3.45,.55]];
// The range: (x, z, height, turn). The tallest is ~45% of the island's diameter.
const PEAKS=[[-1.4,-3.75,4.9,.35],[1.5,-3.8,3.6,2.2],[3.4,-2.75,2.5,1.1]];

export function createMeadow({outline,foliage,loader,onLoad}){
  const rng=random(23),group=new THREE.Group();
  function height(x,z){
    const edge=Math.hypot(x,z)/outline(Math.atan2(z,x));
    let h=.08*Math.sin(x*1.1+.4)*Math.cos(z*.9-.8)+.045*Math.sin(x*2.3+z*1.7+.6);
    // The ground climbs toward the peaks at the back.
    h+=.55*smooth(-2.2,-3.7,z);
    h-=.28*smooth(.8,1,edge);
    // The river's channel and the lake's basin: flat beds below the water, so it never runs underground.
    const cut=Math.max(smooth(1.05,.42,riverAt(x,z).d),smooth(1.25,.92,lakeE(x,z)));
    return h*(1-cut)-.36*cut;
  }
  const on=(x,z)=>new THREE.Vector3(x,height(x,z),z);
  // Pines: a loose line along the bank, and a stand at the mountains' foot.
  const trees=[];
  for(let tries=0;trees.length<8&&tries<300;tries++){const p=PATH[4+Math.floor(rng()*40)],a=rng()*Math.PI*2,r=1.1+rng()*.4,x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;
    if(riverAt(x,z).d<1.05||lakeE(x,z)<1.3||GEYSERS.some(([gx,gz])=>Math.hypot(x-gx,z-gz)<1)||FALL.some(([fx,fz])=>Math.hypot(x-fx,z-fz)<1)||Math.hypot(x,z)>outline(Math.atan2(z,x))*.82||SPOTS.some(([sx,sz])=>Math.hypot(x-sx,z-sz)<1.1)||trees.some(t=>Math.hypot(x-t.position.x,z-t.position.z)<.7))continue;
    trees.push({position:on(x,z),rotation:rng()*6,scale:.42+rng()*.2});}
  for(let tries=0;trees.length<18&&tries<300;tries++){const x=-3.6+rng()*7.2,z=-2.3-rng()*1.1;
    if(riverAt(x,z).d<1||Math.hypot(x,z)>outline(Math.atan2(z,x))*.86||trees.some(t=>Math.hypot(x-t.position.x,z-t.position.z)<.6))continue;
    trees.push({position:on(x,z),rotation:rng()*6,scale:.45+rng()*.25});}
  // And ten more in clumps of two to four, along the bank and the mountains' foot, each ±20% in height.
  for(let tries=0,added=0;added<10&&tries<200;tries++){
    const atBank=tries%2===0,p=PATH[6+Math.floor(rng()*40)],a=rng()*Math.PI*2,cx=atBank?p.x+Math.cos(a)*1.35:-3.2+rng()*6,cz=atBank?p.z+Math.sin(a)*1.35:-2.25-rng()*.8;
    const clump=Math.min(10-added,2+Math.floor(rng()*3));
    for(let k=0;k<clump;k++){const x=cx+(rng()-.5)*.7,z=cz+(rng()-.5)*.7;
      if(riverAt(x,z).d<1||lakeE(x,z)<1.3||Math.hypot(x,z)>outline(Math.atan2(z,x))*.84||GEYSERS.some(([gx,gz])=>Math.hypot(x-gx,z-gz)<1)||FALL.some(([fx,fz])=>Math.hypot(x-fx,z-fz)<1)||SPOTS.some(([sx,sz])=>Math.hypot(x-sx,z-sz)<1)||trees.some(t=>Math.hypot(x-t.position.x,z-t.position.z)<.32))continue;
      trees.push({position:on(x,z),rotation:rng()*6,scale:.5*(.8+rng()*.4)});added++;}}
  // Ground colour: golden meadow, greener and wetter toward the lake, darker and rockier at the mountains' foot,
  // a medium green under the pines; a dark wet band right round the lake.
  const GOLD=new THREE.Color("#c4a84a"),WET=new THREE.Color("#7a8f5a"),ROCKY=new THREE.Color("#6b7a5a"),GREEN=new THREE.Color("#8b9e5a");
  const paint=(x,z,c)=>{
    const e=lakeE(x,z),near=Math.min(...trees.map(t=>Math.hypot(x-t.position.x,z-t.position.z)));
    c.copy(GOLD).multiplyScalar(.93+rng()*.12);
    c.lerp(GREEN,.75*smooth(.9,.3,near));c.lerp(ROCKY,.8*smooth(-1.9,-2.9,z));c.lerp(WET,.85*smooth(2,1.1,e));
    if(e>.9&&e<1.12)c.multiplyScalar(.72);
  };
  const island=createIsland(13,{outline,heightAt:height,riverDistance:riverAt,depth:.85,sand:.75,hub:new THREE.Vector2(1.4,2),scatter:.8,grass:["#c4a84a"],edge:"#7f8a4c",paint});
  group.add(island.group);
  // The river: narrowing as it nears the lake and fading out under its surface, so the two run together.
  const water=createWater(PATH,outline,{width:.62,fade:.9,level:LEVEL,volume:.3,head:.04,pour:false,shape:k=>(.75+.1*Math.sin(k*18))*(1-.5*smooth(.7,1,k))});
  water.uniforms.uShallow.value.set("#7ec8e3");water.uniforms.uDeep.value.set("#4d93b8");group.add(water.group);
  // The lake: a flat sheet at the river's level, its rim bumped, with a slow shimmer (a 3 s swell, ±0.02) and a soft
  // reflection of a golden sky.
  const sky=document.createElement("canvas");sky.width=64;sky.height=32;{const g=sky.getContext("2d"),grad=g.createLinearGradient(0,0,0,32);[[0,"#6c6a9a"],[.45,"#f5a389"],[.5,"#f9c195"],[1,"#8b7340"]].forEach(([k,col])=>grad.addColorStop(k,col));g.fillStyle=grad;g.fillRect(0,0,64,32);}
  const skyTexture=new THREE.CanvasTexture(sky);skyTexture.mapping=THREE.EquirectangularReflectionMapping;skyTexture.colorSpace=THREE.SRGBColorSpace;
  const lakeShape=new THREE.CircleGeometry(1,40),lp=lakeShape.attributes.position;
  for(let i=1;i<lp.count;i++){const x=lp.getX(i),y=lp.getY(i),a=Math.atan2(y,x),k=bump(a);lp.setXY(i,x*LAKE.rx*k,y*LAKE.rz*k);}
  lakeShape.rotateX(-Math.PI/2);const rest=Float32Array.from(lakeShape.attributes.position.array);
  const lake=new THREE.Mesh(lakeShape,new THREE.MeshStandardMaterial({color:"#7ec8e3",emissive:"#2f6a80",emissiveIntensity:.25,roughness:.2,metalness:.1,envMap:skyTexture,envMapIntensity:.4,flatShading:true,transparent:true,opacity:.94}));
  lake.position.set(LAKE.x,LEVEL+.005,LAKE.z);group.add(lake);
  // The pines in three dark greens (#2d5a1b to #3d7a25), a third of them each.
  const pines=["#2d5a1b","#35691f","#3d7a25"].map((hex,k)=>{const g=createPineGeometry(11+k),c=g.attributes.color,green=new THREE.Color(hex);
    for(let i=0;i<c.count;i++)if(c.getY(i)>c.getX(i))c.setXYZ(i,green.r,green.g,green.b);
    const set=createSwayingInstances(g,trees.filter((_,i)=>i%3===k),foliage);group.add(set.mesh);return set;});
  // The fall trees: a faceted round crown on a short trunk, 60–80% of a pine's height, all one mesh.
  const crowns=[];
  {const parts=[],trunk=new THREE.Color("#6b4a3a"),paintAll=(g,col)=>{const a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3)a.set([col.r,col.g,col.b],i);g.setAttribute("color",new THREE.BufferAttribute(a,3));return g;};
    FALL.forEach(([x,z],i)=>{const tall=.68+rng()*.16,r=tall*.42,col=new THREE.Color(FALL_COLORS[i%FALL_COLORS.length]),y=height(x,z),top=y+tall-r;
      parts.push(paintAll(new THREE.CylinderGeometry(.03,.045,tall-r,5).translate(x,y+(tall-r)/2,z).toNonIndexed(),trunk));
      parts.push(paintAll(new THREE.IcosahedronGeometry(r,1).scale(1,.92,1).rotateY(rng()*6).translate(x,top,z).toNonIndexed(),col.clone().multiplyScalar(.95+rng()*.1)));
      crowns.push({x,y:top,z,r,color:col,next:2+rng()*6});});
    parts.forEach(g=>{g.deleteAttribute("uv");g.deleteAttribute("normal");});
    const merged=mergeGeometries(parts);merged.computeVertexNormals();parts.forEach(g=>g.dispose());
    group.add(new THREE.Mesh(merged,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true})));}
  // Their leaves: every 4–8 s a tree lets go of two or three, which flutter down and sideways for about 2 s and vanish.
  const LEAVES=36,leafMesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(.05,.035),new THREE.MeshLambertMaterial({side:THREE.DoubleSide}),LEAVES);leafMesh.frustumCulled=false;group.add(leafMesh);
  const leaves=Array.from({length:LEAVES},()=>({age:1,life:1,pos:new THREE.Vector3(),drift:new THREE.Vector2(),fall:0,spin:0})),leaf=new THREE.Object3D();
  for(let i=0;i<LEAVES;i++){leafMesh.setColorAt(i,new THREE.Color());leaf.scale.setScalar(0);leaf.updateMatrix();leafMesh.setMatrixAt(i,leaf.matrix);}
  function updateLeaves(dt){
    for(const t of crowns){t.next-=dt;if(t.next>0)continue;t.next=4+rng()*4;
      for(let n=2+Math.floor(rng()*2);n>0;n--){const i=leaves.findIndex(l=>l.age>=l.life);if(i<0)break;const l=leaves[i],a=rng()*Math.PI*2;
        l.pos.set(t.x+Math.cos(a)*t.r*.8,t.y-t.r*.3,t.z+Math.sin(a)*t.r*.8);l.age=0;l.life=1.8+rng()*.5;l.fall=(t.y-t.r*.3-height(t.x,t.z))/l.life;l.drift.set(Math.cos(a)*.12+.08,Math.sin(a)*.12);l.spin=rng()*6;
        leafMesh.setColorAt(i,t.color);leafMesh.instanceColor.needsUpdate=true;}}
    leaves.forEach((l,i)=>{let s=0;if(l.age<l.life){l.age+=dt;l.pos.x+=(l.drift.x+Math.sin(l.age*5+l.spin)*.08)*dt;l.pos.z+=l.drift.y*dt;l.pos.y-=l.fall*dt;s=l.age<l.life*.85?1:Math.max(0,(l.life-l.age)/(l.life*.15));}
      leaf.position.copy(l.pos);leaf.rotation.set(l.spin+l.age*3,l.age*2,Math.sin(l.age*6)*.8);leaf.scale.setScalar(s);leaf.updateMatrix();leafMesh.setMatrixAt(i,leaf.matrix);});
    leafMesh.instanceMatrix.needsUpdate=true;
  }
  // Reeds and cattails in clumps of two or three on the lake's rim, swaying ±3° over 2.5 s, each a beat apart.
  const reeds=[];
  [[.5,3],[2.3,2],[3.6,3],[5.3,2]].forEach(([a,n])=>{for(let k=0;k<n;k++){const b=a+(k-(n-1)/2)*.09,r=1.02+rng()*.05,k2=bump(b),x=LAKE.x+Math.cos(b)*LAKE.rx*k2*r,z=LAKE.z+Math.sin(b)*LAKE.rz*k2*r;
    reeds.push({x,z,y:Math.max(LEVEL,height(x,z)),tall:.32+rng()*.14,lean:rng()*6,phase:reeds.length*.7});}});
  const reedColor=new THREE.Color("#8b7340"),stalks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.008,.012,1,4).translate(0,.5,0),new THREE.MeshLambertMaterial({color:reedColor,flatShading:true}),reeds.length);
  const heads=new THREE.InstancedMesh(new THREE.SphereGeometry(1,6,4).scale(.022,.065,.022),new THREE.MeshLambertMaterial({color:reedColor.clone().multiplyScalar(.7),flatShading:true}),reeds.length);
  group.add(stalks,heads);const reedAt=new THREE.Object3D(),tip=new THREE.Vector3();
  function updateReeds(time){
    reeds.forEach((r,i)=>{const sway=3*Math.PI/180*Math.sin(time*Math.PI*2/2.5+r.phase);
      reedAt.position.set(r.x,r.y,r.z);reedAt.rotation.set(sway*Math.cos(r.lean),0,sway*Math.sin(r.lean));reedAt.scale.set(1,r.tall,1);reedAt.updateMatrix();stalks.setMatrixAt(i,reedAt.matrix);
      tip.set(0,r.tall,0).applyEuler(reedAt.rotation);reedAt.position.add(tip);reedAt.scale.setScalar(1);reedAt.updateMatrix();heads.setMatrixAt(i,reedAt.matrix);});
    stalks.instanceMatrix.needsUpdate=heads.instanceMatrix.needsUpdate=true;
  }
  // The peaks, loaded from the hero's kit (already in the cache): faces recoloured grey-blue, the snow left white.
  loader.load("/models/island/kit.glb",gltf=>{
    let node=null;gltf.scene.traverse(o=>{if(!node&&o.name.startsWith("Mountain"))node=o;});if(!node)return;
    node.position.set(0,0,0);const geometry=bakeProp(node);geometry.translate(0,-geometry.boundingBox.min.y,0);
    // Each peak coloured by which way its faces point once it's turned into place: lit blue-grey on the sun's side
    // (left, and the tops), deep shadow on the right, cool white snow on the high flat faces and the model's own
    // snow; at least twice as bright lit as shadowed.
    const size=geometry.boundingBox.getSize(new THREE.Vector3()),LIT=new THREE.Color("#8b9bb0"),MID=new THREE.Color("#6b7a8d"),SHADE=new THREE.Color("#3d4a5c"),SNOW=new THREE.Color("#f0f4f8"),tone=new THREE.Color();
    const material=new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true}),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3();
    PEAKS.forEach(([x,z,tall,turn])=>{
      const k=tall/size.y,g=geometry.clone().rotateY(turn).scale(k*.8,k,k*.8),pos=g.attributes.position,color=g.attributes.color,top=tall;
      for(let i=0;i<pos.count;i+=3){
        a.fromBufferAttribute(pos,i);b.fromBufferAttribute(pos,i+1);c.fromBufferAttribute(pos,i+2);n.subVectors(b,a).cross(c.clone().sub(a)).normalize();
        const white=color.getX(i)>.85&&color.getZ(i)>.85,high=Math.max(a.y,b.y,c.y)>top*.85;
        const snowy=white||(n.y>.7&&high);tone.copy(snowy?SNOW:n.x>.3?SHADE:n.x<-.3||n.y>.7?LIT:MID);if(!snowy)tone.multiplyScalar(.95+rng()*.1);
        for(let j=0;j<3;j++)color.setXYZ(i+j,tone.r,tone.g,tone.b);}
      color.needsUpdate=true;const peak=new THREE.Mesh(g,material);peak.position.set(x,height(x,z)-.3,z);group.add(peak);});
    geometry.dispose();
    onLoad?.();
  },undefined,()=>{});
  const blocked=(x,z,pad)=>riverAt(x,z).d<.95+pad||lakeE(x,z)<1.15+pad/LAKE.rz||z<-2.2+pad*.5||trees.some(t=>Math.hypot(x-t.position.x,z-t.position.z)<.3+pad)||FALL.some(([fx,fz])=>Math.hypot(x-fx,z-fz)<.3+pad)||GEYSERS.some(([gx,gz])=>Math.hypot(x-gx,z-gz)<.5+pad);
  updateReeds(0);
  // Two geysers (the Skills island's, at 60%): each goes off on its own every 12–20 s for 3–4 s, then steams harder
  // for 6–8 s. Their eruptions start at least 4 s apart, so they never blow together; a click sets one off at once
  // (or as soon as that allows).
  const geysers=GEYSERS.map(([x,z],i)=>{const uniforms={uTime:{value:0},uPower:{value:0},uScale:{value:360},uWisp:{value:0}},g=createGeyser(rng,{uniforms});
    g.group.scale.setScalar(.6);g.group.position.set(x,height(x,z)-.03,z);group.add(g.group);
    return {...g,t:-1,wait:5+i*7+rng()*5,dur:3,steam:7,started:-99};});
  let clock=0;
  function goOff(g){if(g.t>=0)return;const other=geysers.find(o=>o!==g),gap=clock-other.started;
    if(gap<4){g.wait=4-gap;return;}g.t=0;g.started=clock;g.dur=3+rng();g.steam=6+rng()*2;}
  function updateGeysers(time,dt){
    clock+=dt;
    for(const g of geysers){
      if(g.t<0){g.wait-=dt;if(g.wait<=0)goOff(g);}
      else{g.t+=dt;if(g.t>g.dur+g.steam){g.t=-1;g.wait=12+rng()*8;}}
      const t=g.t;g.uniforms.uTime.value=time;
      g.uniforms.uPower.value=t<0?0:smooth(0,.6,t)*(1-smooth(g.dur-1,g.dur,t));
      g.uniforms.uWisp.value=t<g.dur*.6?0:smooth(g.dur*.6,g.dur,t)*(1-smooth(g.dur,g.dur+g.steam,t));
    }
  }
  return {group,height,blocked,spots:SPOTS,swaying:pines,geysers:geysers.map(g=>g.cone),
    // Sets off the geyser whose cone this is (from a tap).
    erupt(cone){const g=geysers.find(x=>x.cone===cone);if(g){g.wait=0;goOff(g);}},
    erupting:()=>geysers.some(g=>g.t>=0),
    update(time,dt=0){
      updateLeaves(dt);updateReeds(time);updateGeysers(time,dt);
      water.uniforms.uTime.value=time;water.uniforms.uFlow.value=time*.7;
      const p=lakeShape.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,rest[i*3+1]+.02*Math.sin(time*Math.PI*2/3+rest[i*3]*2.4+rest[i*3+2]*1.7));p.needsUpdate=true;
    },
    dispose(){skyTexture.dispose();}};
}
