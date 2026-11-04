import * as THREE from "three";
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
    if(riverAt(x,z).d<1.05||lakeE(x,z)<1.3||Math.hypot(x,z)>outline(Math.atan2(z,x))*.82||SPOTS.some(([sx,sz])=>Math.hypot(x-sx,z-sz)<1.1)||trees.some(t=>Math.hypot(x-t.position.x,z-t.position.z)<.7))continue;
    trees.push({position:on(x,z),rotation:rng()*6,scale:.42+rng()*.2});}
  for(let tries=0;trees.length<18&&tries<300;tries++){const x=-3.6+rng()*7.2,z=-2.3-rng()*1.1;
    if(riverAt(x,z).d<1||Math.hypot(x,z)>outline(Math.atan2(z,x))*.86||trees.some(t=>Math.hypot(x-t.position.x,z-t.position.z)<.6))continue;
    trees.push({position:on(x,z),rotation:rng()*6,scale:.45+rng()*.25});}
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
  const pines=createSwayingInstances(createPineGeometry(11),trees,foliage);group.add(pines.mesh);
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
  const blocked=(x,z,pad)=>riverAt(x,z).d<.95+pad||lakeE(x,z)<1.15+pad/LAKE.rz||z<-2.2+pad*.5||trees.some(t=>Math.hypot(x-t.position.x,z-t.position.z)<.3+pad);
  return {group,height,blocked,spots:SPOTS,swaying:pines,
    update(time){
      water.uniforms.uTime.value=time;water.uniforms.uFlow.value=time*.7;
      const p=lakeShape.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,rest[i*3+1]+.02*Math.sin(time*Math.PI*2/3+rest[i*3]*2.4+rest[i*3+2]*1.7));p.needsUpdate=true;
    },
    dispose(){skyTexture.dispose();}};
}
