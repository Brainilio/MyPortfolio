import * as THREE from "three";
import { createIsland, createWater, createPineGeometry, createSwayingInstances, bakeProp, random } from "./island-parts";

// Scene B of the Work section's scene tester: a Yellowstone meadow at golden hour on the same floating island. A
// river rises at the foot of the peaks at the back left, curls across the middle and pours off the front right edge;
// a low Teton-ish range (the hero's mountain model, recoloured grey-blue under white caps) stands along the back
// edge behind it; pines line the bank and the mountains' foot; the flat meadow on the near side of the river is
// where the herd grazes (work-scene.js moves its bison here while this scene is shown).
const smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const PATH=new THREE.CatmullRomCurve3([[-3.3,0,-2.5],[-2.4,0,-1.7],[-1.1,0,-1.25],[.3,0,-.75],[1.4,0,.25],[2.3,0,1.5],[3.3,0,2.9],[4.7,0,4.4]].map(p=>new THREE.Vector3(...p))).getSpacedPoints(70);
function riverAt(x,z){let best=1e9,at=0;PATH.forEach((p,i)=>{const d=(p.x-x)**2+(p.z-z)**2;if(d<best){best=d;at=i;}});return {d:Math.sqrt(best),t:at/(PATH.length-1)};}
// Where the herd stands when it arrives (the last is the calf, beside its mother).
const SPOTS=[[-1.5,.75],[-.15,1.5],[-2.7,.45],[-1.2,2.35],[-.85,1.2]];
// The range: (x, z, height, turn). The tallest is ~45% of the island's ~10.8 diameter.
const PEAKS=[[-1.4,-3.75,4.9,.35],[1.5,-3.8,3.6,2.2],[3.4,-2.75,2.5,1.1]];

export function createMeadow({outline,foliage,loader,onLoad}){
  const rng=random(23),group=new THREE.Group();
  function height(x,z){
    const edge=Math.hypot(x,z)/outline(Math.atan2(z,x));
    let h=.08*Math.sin(x*1.1+.4)*Math.cos(z*.9-.8)+.045*Math.sin(x*2.3+z*1.7+.6);
    // The ground climbs toward the peaks at the back.
    h+=.55*smooth(-2.2,-3.7,z);
    h-=.28*smooth(.8,1,edge);
    // The river's channel: a flat bed all the way, so the water never runs underground.
    const cut=smooth(1.05,.42,riverAt(x,z).d);
    return h*(1-cut)-.34*cut;
  }
  const island=createIsland(13,{outline,heightAt:height,riverDistance:riverAt,depth:.85,sand:.75,hub:new THREE.Vector2(-1.4,2),scatter:.8,grass:["#8b9e5a","#c4a84a","#a9a552","#98a35a"],edge:"#7f8a4c"});
  group.add(island.group);
  const water=createWater(PATH,outline,{width:.62,fall:2.4,fade:.75,level:-.15,volume:.3,head:.04});
  water.uniforms.uShallow.value.set("#7ec8e3");water.uniforms.uDeep.value.set("#4d93b8");group.add(water.group);
  const on=(x,z)=>new THREE.Vector3(x,height(x,z),z);
  // Pines: a loose line along the bank, and a stand at the mountains' foot.
  const trees=[];
  for(let tries=0;trees.length<8&&tries<300;tries++){const p=PATH[6+Math.floor(rng()*48)],a=rng()*Math.PI*2,r=1.1+rng()*.4,x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;
    if(riverAt(x,z).d<1.05||Math.hypot(x,z)>outline(Math.atan2(z,x))*.82||SPOTS.some(([sx,sz])=>Math.hypot(x-sx,z-sz)<1.1)||trees.some(t=>Math.hypot(x-t.position.x,z-t.position.z)<.7))continue;
    trees.push({position:on(x,z),rotation:rng()*6,scale:.42+rng()*.2});}
  for(let tries=0;trees.length<18&&tries<300;tries++){const x=-3.6+rng()*7.2,z=-2.3-rng()*1.1;
    if(riverAt(x,z).d<1||Math.hypot(x,z)>outline(Math.atan2(z,x))*.86||trees.some(t=>Math.hypot(x-t.position.x,z-t.position.z)<.6))continue;
    trees.push({position:on(x,z),rotation:rng()*6,scale:.45+rng()*.25});}
  const pines=createSwayingInstances(createPineGeometry(11),trees,foliage);group.add(pines.mesh);
  // The peaks, loaded from the hero's kit (already in the cache): faces recoloured grey-blue, the snow left white.
  loader.load("/models/island/kit.glb",gltf=>{
    let node=null;gltf.scene.traverse(o=>{if(!node&&o.name.startsWith("Mountain"))node=o;});if(!node)return;
    node.position.set(0,0,0);const geometry=bakeProp(node);geometry.translate(0,-geometry.boundingBox.min.y,0);
    const size=geometry.boundingBox.getSize(new THREE.Vector3()),color=geometry.attributes.color,slate=new THREE.Color("#6b7a8d"),snow=new THREE.Color("#f6f4f0"),tone=new THREE.Color();
    for(let i=0;i<color.count;i+=3){const white=color.getX(i)>.85&&color.getZ(i)>.85;tone.copy(white?snow:slate).multiplyScalar(white?1:.92+rng()*.16);for(let k=0;k<3;k++)color.setXYZ(i+k,tone.r,tone.g,tone.b);}
    const material=new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true});
    PEAKS.forEach(([x,z,tall,turn])=>{const peak=new THREE.Mesh(geometry,material),k=tall/size.y;peak.scale.set(k*.8,k,k*.8);peak.position.set(x,height(x,z)-.3,z);peak.rotation.y=turn;group.add(peak);});
    onLoad?.();
  },undefined,()=>{});
  const blocked=(x,z,pad)=>riverAt(x,z).d<.95+pad||z<-2.2+pad*.5||trees.some(t=>Math.hypot(x-t.position.x,z-t.position.z)<.3+pad);
  return {group,height,blocked,spots:SPOTS,swaying:pines,
    update(time){water.uniforms.uTime.value=time;water.uniforms.uFlow.value=time*.7;}};
}
