import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createGeyser, STEAM_VERTEX, SPRITE_FRAGMENT } from "./park-parts";
import { createWildlife } from "./work-wildlife";
import { createIsland, createWater, createPineGeometry, createSwayingInstances, random } from "./island-parts";

// The Work section's island: a Yellowstone meadow at golden hour. A river rises at the foot of the peaks at the back,
// curls through the meadow and runs into a lake in the front-left; a pine forest fills the back of the island; a
// Grand Prismatic-style hot spring steams left of the river; the open meadow right of the river is where the herd grazes.
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
const SPOTS=[[1.2,.3],[.4,1.6],[2.2,1.1],[2.0,-.25],[.85,.9]];
// Fall trees (two at the forest's edge, and the front right), each its own colour, no two neighbours alike; and the
// two geysers (rear right at the forest's edge, and mid right), kept clear of trees and the herd.
const FALL=[[-1.55,-2.05],[.15,-2.2],[3.0,2.35],[2.25,3.15],[3.65,1.45],[1.25,3.4]];
const FALL_COLORS=["#e8742a","#d4a020","#c45820","#8b2020","#e8a030"];
export const GEYSERS=[[2.65,-1.55],[3.45,.55]];
// The hot spring, after Grand Prismatic: left of the river, between the forest and the lake. r is the reach of its
// pale sinter apron; the pool itself is about 60% of that.
export const SPRING={x:-2.45,z:-.3,r:1.15};
const springD=(x,z)=>Math.hypot(x-SPRING.x,(z-SPRING.z)/.85);
// The deer, by the pines at the back; and the feed basket, out front where the herd can gather round it.
// (None for now: the island is kept to its strongest few elements.)
const DEER=[];
export const BASKET_SPOT=[.3,2.75];

export function createMeadow({outline,foliage,loader,onLoad}){
  const rng=random(23),group=new THREE.Group();
  function height(x,z){
    const edge=Math.hypot(x,z)/outline(Math.atan2(z,x));
    let h=.08*Math.sin(x*1.1+.4)*Math.cos(z*.9-.8)+.045*Math.sin(x*2.3+z*1.7+.6);
    // The ground climbs toward the peaks at the back.
    h+=.55*smooth(-2.2,-3.7,z);
    // A flat sinter terrace for the spring.
    const terrace=smooth(SPRING.r*1.15,SPRING.r*.7,springD(x,z));h=h*(1-terrace)+.04*terrace;
    h-=.28*smooth(.8,1,edge);
    // The river's channel and the lake's basin: flat beds below the water, so it never runs underground.
    const cut=Math.max(smooth(1.2,.55,riverAt(x,z).d),smooth(1.25,.92,lakeE(x,z)));
    return h*(1-cut)-.36*cut;
  }
  const on=(x,z)=>new THREE.Vector3(x,height(x,z),z);
  // Pines: a loose line along the bank, and a stand at the mountains' foot.
  const trees=[];
  for(let tries=0;trees.length<8&&tries<300;tries++){const p=PATH[4+Math.floor(rng()*40)],a=rng()*Math.PI*2,r=1.1+rng()*.4,x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;
    if(riverAt(x,z).d<1.05||lakeE(x,z)<1.3||springD(x,z)<SPRING.r+.45||GEYSERS.some(([gx,gz])=>Math.hypot(x-gx,z-gz)<1)||FALL.some(([fx,fz])=>Math.hypot(x-fx,z-fz)<1)||DEER.some(([dx,dz])=>Math.hypot(x-dx,z-dz)<.55)||Math.hypot(x,z)>outline(Math.atan2(z,x))*.82||SPOTS.some(([sx,sz])=>Math.hypot(x-sx,z-sz)<1.1)||trees.some(t=>Math.hypot(x-t.position.x,z-t.position.z)<.7))continue;
    trees.push({position:on(x,z),rotation:rng()*6,scale:.42+rng()*.2});}
  // The forest: a dense stand across the back of the island (where the river rises), and a wood round the left rim
  // behind the spring.
  const clear=(x,z,gap)=>riverAt(x,z).d>.8&&springD(x,z)>SPRING.r+.25&&lakeE(x,z)>1.3&&!GEYSERS.some(([gx,gz])=>Math.hypot(x-gx,z-gz)<.95)&&!FALL.some(([fx,fz])=>Math.hypot(x-fx,z-fz)<.55)&&!trees.some(t=>Math.hypot(x-t.position.x,z-t.position.z)<gap);
  for(let tries=0,n=0;n<46&&tries<900;tries++){const x=-4.4+rng()*8.8,z=-1.85-rng()*2.6;
    if(Math.hypot(x,z)>outline(Math.atan2(z,x))*.88||!clear(x,z,.42))continue;
    trees.push({position:on(x,z),rotation:rng()*6,scale:(.42+rng()*.22)*(1+.25*smooth(-2,-3.6,z))});n++;}
  for(let tries=0,n=0;n<12&&tries<500;tries++){const a=Math.PI*(.72+rng()*.5),r=outline(a)*(.68+rng()*.2),x=Math.cos(a)*r,z=Math.sin(a)*r;
    if(!clear(x,z,.4))continue;trees.push({position:on(x,z),rotation:rng()*6,scale:.42+rng()*.2});n++;}
  // And ten more in clumps of two to four, along the bank and the mountains' foot, each ±20% in height.
  for(let tries=0,added=0;added<10&&tries<200;tries++){
    const atBank=tries%2===0,p=PATH[6+Math.floor(rng()*40)],a=rng()*Math.PI*2,cx=atBank?p.x+Math.cos(a)*1.35:-3.2+rng()*6,cz=atBank?p.z+Math.sin(a)*1.35:-2.25-rng()*.8;
    const clump=Math.min(10-added,2+Math.floor(rng()*3));
    for(let k=0;k<clump;k++){const x=cx+(rng()-.5)*.7,z=cz+(rng()-.5)*.7;
      if(riverAt(x,z).d<1||lakeE(x,z)<1.3||Math.hypot(x,z)>outline(Math.atan2(z,x))*.84||springD(x,z)<SPRING.r+.45||GEYSERS.some(([gx,gz])=>Math.hypot(x-gx,z-gz)<1)||FALL.some(([fx,fz])=>Math.hypot(x-fx,z-fz)<1)||DEER.some(([dx,dz])=>Math.hypot(x-dx,z-dz)<.55)||SPOTS.some(([sx,sz])=>Math.hypot(x-sx,z-sz)<1)||trees.some(t=>Math.hypot(x-t.position.x,z-t.position.z)<.32))continue;
      trees.push({position:on(x,z),rotation:rng()*6,scale:.5*(.8+rng()*.4)});added++;}}
  // Ground colour: golden meadow, greener and wetter toward the lake, darker and rockier at the mountains' foot,
  // a medium green under the pines; a dark wet band right round the lake.
  const GOLD=new THREE.Color("#c4a84a"),WET=new THREE.Color("#7a8f5a"),FOREST=new THREE.Color("#6f8048"),GREEN=new THREE.Color("#8b9e5a"),SINTER=new THREE.Color("#ddd5c0");
  const paint=(x,z,c)=>{
    const e=lakeE(x,z),near=Math.min(...trees.map(t=>Math.hypot(x-t.position.x,z-t.position.z)));
    c.copy(GOLD).multiplyScalar(.93+rng()*.12);
    c.lerp(GREEN,.75*smooth(.9,.3,near));c.lerp(FOREST,.75*smooth(-1.7,-2.6,z));c.lerp(WET,.85*smooth(2,1.1,e));c.lerp(SINTER,.9*smooth(SPRING.r*1.2,SPRING.r*.85,springD(x,z)));
    if(e>.9&&e<1.12)c.multiplyScalar(.72);
  };
  const island=createIsland(13,{outline,heightAt:height,riverDistance:riverAt,depth:.85,sand:.75,hub:new THREE.Vector2(1.4,2),scatter:.8,grass:["#c4a84a"],edge:"#7f8a4c",paint});
  group.add(island.group);
  // The river: full the whole way, opening out into a mouth where it meets the lake, and fading only in its last
  // stretch, under the lake's surface, so the two run together.
  // Where it reaches the lake's shore (as a share of its length): from there its rounded body settles flat to the
  // lake's level, and it fades out over the open water, so nothing stands proud of the lake or ends in a line.
  const shore=PATH.findIndex(p=>lakeE(p.x,p.z)<1.05)/(PATH.length-1),riverLength=PATH.reduce((sum,p,i)=>i?sum+p.distanceTo(PATH[i-1]):0,0);
  const water=createWater(PATH,outline,{width:.82,fade:(1-shore)*riverLength/4+.02,level:LEVEL,volume:.3,head:.04,pour:false,
    swell:k=>smooth(shore,shore-.18,k),shape:k=>(.92+.08*Math.sin(k*18))*(1+.55*smooth(shore-.08,1,k))});
  water.uniforms.uShallow.value.set("#7ec8e3");water.uniforms.uDeep.value.set("#4d93b8");group.add(water.group);
  // The lake: a sheet at the river's level, its rim bumped, with a slow swell (3 s, ±0.02). Shaded like the river, in
  // the river's own blues (deep in the middle, shallow toward the shore, a broken line of foam at the rim), so where
  // one runs into the other there is no seam; the river's current carries on into it as slow rings spreading out from
  // the mouth, and now and then a fish rises somewhere, leaving a ring of its own.
  const lakeShape=new THREE.CircleGeometry(1,48,0,Math.PI*2),lp=lakeShape.attributes.position;
  // (Bumped as lakeE() measures it, so the sheet and the basin cut for it line up.)
  for(let i=1;i<lp.count;i++){const x=lp.getX(i),y=lp.getY(i),k=bump(Math.atan2(-y,x));lp.setXY(i,x*LAKE.rx*k,y*LAKE.rz*k);}
  lakeShape.rotateX(-Math.PI/2);
  const mouth=(()=>{for(const p of PATH)if(lakeE(p.x,p.z)<1)return new THREE.Vector2(p.x-LAKE.x,p.z-LAKE.z);return new THREE.Vector2();})();
  const rises=[0,1,2].map(i=>({at:new THREE.Vector4(0,0,9,0),wait:1+i*2.3}));
  const lakeUniforms={uTime:{value:0},uMouth:{value:mouth},uRadii:{value:new THREE.Vector2(LAKE.rx,LAKE.rz)},uRise:{value:rises.map(r=>r.at)},
    uShallow:{value:water.uniforms.uShallow.value},uDeep:{value:water.uniforms.uDeep.value}};
  const lake=new THREE.Mesh(lakeShape,new THREE.ShaderMaterial({uniforms:lakeUniforms,transparent:true,depthWrite:false,
    vertexShader:`uniform float uTime;varying vec2 vP;void main(){vec3 p=position;vP=p.xz;p.y+=.02*sin(uTime*2.094+p.x*2.4+p.z*1.7);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`uniform float uTime;uniform vec2 uMouth,uRadii;uniform vec4 uRise[3];uniform vec3 uShallow,uDeep;varying vec2 vP;
      void main(){
        vec2 q=vP/uRadii;float a=atan(q.y,q.x),e=length(q)/(1.+.07*sin(7.*a+.8)+.04*sin(3.*a+2.1)+.025*sin(11.*a));
        vec3 color=mix(uDeep*.78,uShallow*.96,smoothstep(.15,1.,e)*.8+.1);
        // The current: rings spreading from the mouth, fading as they go.
        float d=distance(vP,uMouth),f=fract(d/.42-uTime*.38);
        color+=smoothstep(0.,.08,f)*smoothstep(.24,.1,f)*(1.-smoothstep(.1,1.5,d))*.2;
        // At the mouth, the river's own shallow blue, blending into the lake's.
        color=mix(color,uShallow+.07,(1.-smoothstep(.05,1.,d))*.8);
        for(int i=0;i<3;i++){float r=uRise[i].z*.32,k=1.-smoothstep(0.,1.6,uRise[i].z);color+=smoothstep(.022,0.,abs(distance(vP,uRise[i].xy)-r))*k*.45;}
        float foam=smoothstep(.86,.99,e+.035*sin(a*13.+uTime*1.3));
        color=mix(color,vec3(1.),foam*.6*smoothstep(.35,.8,d));
        gl_FragColor=vec4(color,.94*smoothstep(1.06,1.,e));
        #include <colorspace_fragment>
      }`}));
  lake.position.set(LAKE.x,LEVEL+.005,LAKE.z);group.add(lake);
  function updateLake(time,dt){
    lakeUniforms.uTime.value=time;
    // A rise every few seconds, somewhere in the open water away from the mouth.
    for(const r of rises){
      if(r.at.z<9){r.at.z+=dt;if(r.at.z>1.6)r.at.z=9;continue;}
      r.wait-=dt;if(r.wait>0)continue;r.wait=3+rng()*5;
      const a=rng()*Math.PI*2,k=Math.sqrt(rng())*.65;r.at.set(Math.cos(a)*k*LAKE.rx,Math.sin(a)*k*LAKE.rz,0,0);if(Math.hypot(r.at.x-mouth.x,r.at.y-mouth.y)<.5)r.at.z=9;
    }
  }
  // The hot spring, after Grand Prismatic: a disc draped over its flat sinter terrace (so it never sinks or floats),
  // painted once on a canvas: a deep blue eye, a pale turquoise rim, then green, yellow, a broad orange band and rusty
  // mats running out across the pale apron in streaks. Steam drifts off it all the time, tinted by the blue below.
  const springSteam={uTime:{value:0},uPower:{value:0},uScale:{value:420},uWisp:{value:0},uColor:{value:new THREE.Color("#e4f2f6")}};
  const springTexture=(()=>{const S=512,m=S/2,c=document.createElement("canvas");c.width=c.height=S;const g=c.getContext("2d"),pick=random(7);
    // The apron, fading out at the edge.
    let grad=g.createRadialGradient(m,m,0,m,m,m);[[0,"rgba(236,230,214,1)"],[.75,"rgba(226,218,198,.9)"],[1,"rgba(220,210,190,0)"]].forEach(([k,col])=>grad.addColorStop(k,col));g.fillStyle=grad;g.fillRect(0,0,S,S);
    // The mats: wandering streaks from the pool's edge outward, orange to rust to nothing.
    g.lineCap="round";
    for(let i=0;i<170;i++){const a0=pick()*Math.PI*2,r0=130,r1=165+pick()*(pick()<.3?85:50);let a=a0;
      grad=g.createRadialGradient(m,m,r0,m,m,r1);grad.addColorStop(0,"rgba(238,140,52,.85)");grad.addColorStop(.45,"rgba(200,92,40,.65)");grad.addColorStop(1,"rgba(150,78,48,0)");
      g.strokeStyle=grad;g.lineWidth=3+pick()*9;g.beginPath();g.moveTo(m+Math.cos(a)*r0,m+Math.sin(a)*r0);
      for(let r=r0+12;r<=r1;r+=12){a+=(pick()-.5)*.08;g.lineTo(m+Math.cos(a)*r,m+Math.sin(a)*r);}g.stroke();}
    // The pool's rings.
    grad=g.createRadialGradient(m,m,0,m,m,150);
    [[0,"#0a3f78"],[.28,"#1166a8"],[.46,"#2f9ccc"],[.56,"#8fd6df"],[.62,"#c6e6c4"],[.68,"#cfd96a"],[.74,"#f1c443"],[.83,"#ef9536"],[.93,"#d0652b"],[1,"rgba(196,92,44,0)"]].forEach(([k,col])=>grad.addColorStop(k,col));
    g.fillStyle=grad;g.beginPath();g.arc(m,m,150,0,Math.PI*2);g.fill();
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;})();
  {const disc=new THREE.RingGeometry(.001,1,48,12),dp=disc.attributes.position;
    for(let i=0;i<dp.count;i++){const x=SPRING.x+dp.getX(i)*SPRING.r,z=SPRING.z-dp.getY(i)*SPRING.r*.85;dp.setXYZ(i,x,height(x,z)+.02,z);}
    group.add(new THREE.Mesh(disc,new THREE.MeshBasicMaterial({map:springTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2})));
    const pos=[],seed=[],params=[];for(let i=0;i<26;i++){const a=rng()*6.28,d=Math.sqrt(rng())*SPRING.r*.5,x=SPRING.x+Math.cos(a)*d,z=SPRING.z+Math.sin(a)*d*.85;pos.push(x,height(x,z)+.05,z);seed.push(rng(),rng(),rng());params.push(1.2,.55,0);}
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("aSeed",new THREE.Float32BufferAttribute(seed,3));g.setAttribute("aParams",new THREE.Float32BufferAttribute(params,3));
    const steam=new THREE.Points(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:springSteam,vertexShader:STEAM_VERTEX,fragmentShader:SPRITE_FRAGMENT}));
    steam.frustumCulled=false;steam.renderOrder=2;group.add(steam);}
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
  // The eagle's perch: the top of the tallest pine in the forest.
  const perch=(()=>{let best=null,top=-1;for(const t of trees){const y=t.position.y+t.scale*1.78;if(t.position.z<-1.8&&y>top){top=y;best=t;}}
    return best?best.position.clone().setY(top-.02):null;})();
  setTimeout(()=>onLoad?.(),0);
  const wildlife=createWildlife({group,height,lake:LAKE,level:LEVEL,loader,perch:()=>perch,perchSize:.24,deerSpots:DEER,dry:(x,z)=>riverAt(x,z).d>1.1&&lakeE(x,z)>1.25&&z>-2.6});
  const blocked=(x,z,pad)=>DEER.some(([dx,dz])=>Math.hypot(x-dx,z-dz)<.4+pad)||riverAt(x,z).d<.95+pad||lakeE(x,z)<1.15+pad/LAKE.rz||z<-2.2+pad*.5||trees.some(t=>Math.hypot(x-t.position.x,z-t.position.z)<.3+pad)||FALL.some(([fx,fz])=>Math.hypot(x-fx,z-fz)<.3+pad)||GEYSERS.some(([gx,gz])=>Math.hypot(x-gx,z-gz)<.5+pad)||springD(x,z)<SPRING.r+.15+pad;
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
      updateLeaves(dt);updateGeysers(time,dt);wildlife.update(dt,time);
      water.uniforms.uTime.value=time;water.uniforms.uFlow.value=time*.7;springSteam.uTime.value=time;updateLake(time,dt);
    },
    dispose(){springTexture.dispose();}};
}
