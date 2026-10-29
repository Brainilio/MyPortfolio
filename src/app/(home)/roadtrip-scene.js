"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { adaptivePixelRatio, snapToTexels } from "./perf";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { random, createBearMaterial, createFish, bakeProp } from "./island-parts";
import { chunkSpots, paintGeometry, createForestPine, createSnag, createTuft, createLupine, createDaisy, createSwayMaterial } from "./forest-parts";

// Skills as a road trip through a national park: a loaded wagon idles on a winding road through deep forest under
// granite walls, past hot springs to a geyser at the end. Park entrance signs along the road each name a skill group. Clicking the car
// (or scrolling) hops it and drives it to the next sign; a chase camera follows.
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
const ROAD=new THREE.CatmullRomCurve3([[0,0,14],[-3,0,2],[1.5,0,-12],[9,0,-26],[6,0,-42],[-5,0,-56],[-8,0,-70],[-1,0,-86],[7,0,-100],[4,0,-116]].map(p=>new THREE.Vector3(...p)),false,"centripetal");
const STATIONS=[.08,.27,.46,.64,.82];
// Yellowstone on the way: a hot-spring basin (a big Grand Prismatic–style pool and two small ones; each is [road u,
// distance to the left of the road, radius]) and a geyser just past the end of the road.
const SPRINGS=[[.42,14,4.2],[.38,9,1.5],[.462,8.6,1.1]],GEYSER={r:1.6,at:(()=>{const p=ROAD.getPointAt(1),t=ROAD.getTangentAt(.999);return new THREE.Vector2(p.x+t.x*12,p.z+t.z*12);})()};
const leftOf=([u,d])=>{const p=ROAD.getPointAt(u),t=ROAD.getTangentAt(u);return new THREE.Vector2(p.x+t.z*d,p.z-t.x*d);};
const GRANITE=["#b4aea3","#a39d92","#958f85","#c4bdb1"].map(c=>new THREE.Color(c));

// Half Dome: a dome with one side sheared off into a sheer face.
function createHalfDome(rng) {
  const g=new THREE.SphereGeometry(1,28,18,0,Math.PI,0,Math.PI/2).scale(1,1.15,.95),pos=g.attributes.position,colors=new Float32Array(pos.count*3);
  for(let i=0;i<pos.count;i++)pos.setXYZ(i,pos.getX(i)*(1+(rng()-.5)*.04),pos.getY(i),pos.getZ(i)*(1+(rng()-.5)*.04));
  for(let i=0;i<pos.count;i++){const c=GRANITE[Math.floor(pos.getY(i)*3.99)%4];colors.set([c.r,c.g,c.b],i*3);}
  g.setAttribute("color",new THREE.BufferAttribute(colors,3));g.deleteAttribute("uv");g.computeVertexNormals();
  const dome=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));
  // The sheer face: a flat cap closing the cut side.
  const face=new THREE.Mesh(new THREE.CircleGeometry(1,28,0,Math.PI).scale(1,1.15,1),new THREE.MeshStandardMaterial({color:"#9a948a",roughness:1,side:THREE.DoubleSide}));
  const group=new THREE.Group();group.add(dome,face);return group;
}
// A national-park entrance sign: a dark-stained plank board with a routed cream border and lettering, held up by two
// log posts set in a stone footing. Lettering is Bitter (Google Fonts, OFL), a sturdy slab close to park signage.
// Every line is measured and shrunk to fit inside the border, and a long tool list wraps onto two lines.
const BOARD={w:4.4,h:2.2,r:.14};
function roundedRect(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function createSign(skill,index) {
  const W=1024,H=512,canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;
  const g=canvas.getContext("2d"),CREAM="#efe2bf",SHADOW="#24130a",family="Bitter, Georgia, serif";
  // Largest size (up to max) at which the text fits the width.
  const fit=(text,weight,max,width,spacing=0)=>{let size=max;for(;size>18;size-=2){g.font=`${weight} ${size}px ${family}`;g.letterSpacing=`${spacing*size}px`;if(g.measureText(text).width<=width)break;}return size;};
  const carve=(text,y,weight,size,spacing=0)=>{g.font=`${weight} ${size}px ${family}`;g.letterSpacing=`${spacing*size}px`;g.fillStyle=SHADOW;g.fillText(text,W/2+3,y+4);g.fillStyle=CREAM;g.fillText(text,W/2,y);};
  const paint=()=>{
    g.clearRect(0,0,W,H);
    roundedRect(g,0,0,W,H,32);g.fillStyle="#4e2f1d";g.fill();
    // Three planks: seams and a little grain.
    g.save();g.clip();
    for(let i=0;i<90;i++){g.globalAlpha=.05+(i%4)*.015;g.fillStyle=i%3?"#1d0f07":"#8a5a3a";g.fillRect(0,(i*53.7)%H,W,1+(i%3));}
    g.globalAlpha=.5;g.fillStyle="#24130a";for(const y of [H/3,H*2/3])g.fillRect(0,y-2,W,4);
    g.restore();g.globalAlpha=1;
    roundedRect(g,26,26,W-52,H-52,20);g.lineWidth=7;g.strokeStyle=SHADOW;g.save();g.translate(2,3);g.stroke();g.restore();g.strokeStyle=CREAM;g.stroke();
    g.textAlign="center";g.textBaseline="alphabetic";
    const inner=W-150;
    carve(`SKILLS  ·  STOP ${String(index+1).padStart(2,"0")}`,112,600,fit(`SKILLS  ·  STOP 00`,600,30,inner,.2),.2);
    carve(skill.title,262,800,fit(skill.title,800,140,inner,-.01),-.01);
    g.fillStyle=CREAM;g.fillRect(W/2-60,292,120,5);
    // The tools: one line if it fits at a readable size, otherwise split into two balanced lines.
    const one=skill.items.join("  ·  ").toUpperCase(),size=fit(one,600,40,inner,.08);
    if(size>=32)carve(one,380,600,size,.08);
    else{const half=Math.ceil(skill.items.length/2),lines=[skill.items.slice(0,half),skill.items.slice(half)].map(x=>x.join("  ·  ").toUpperCase());
      const s=Math.min(...lines.map(l=>fit(l,600,38,inner,.08)));carve(lines[0],360,600,s,.08);carve(lines[1],360+s*1.25,600,s,.08);}
  };
  paint();
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
  // Re-letter once the sign font has loaded.
  Promise.all([document.fonts?.load(`800 140px Bitter`),document.fonts?.load(`600 40px Bitter`)]).then(()=>{paint();texture.needsUpdate=true;}).catch(()=>{});
  const sign=new THREE.Group(),wood=new THREE.MeshStandardMaterial({color:"#3d2416",flatShading:true,roughness:1});
  const {w,h,r}=BOARD,shape=new THREE.Shape();
  shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
  shape.lineTo(-w/2+r,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  const board=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.14,bevelEnabled:true,bevelSize:.035,bevelThickness:.03,bevelSegments:1}),wood);
  board.position.set(0,2.35,-.08);sign.add(board);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,transparent:true,roughness:.85}));
  face.position.set(0,2.35,.1);sign.add(face);
  // Log posts with rounded tops, in a footing of piled stones.
  const log=new THREE.MeshStandardMaterial({color:"#6b4630",flatShading:true,roughness:1}),stones=[];
  for(const x of [-1.75,1.75]){
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.17,.2,3.6,7),log);post.position.set(x,1.8,-.22);sign.add(post);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.17,7,4,0,Math.PI*2,0,Math.PI/2),log);cap.position.set(x,3.6,-.22);sign.add(cap);
    for(let k=0;k<6;k++){const a=k/6*Math.PI*2+index,s=.22+((k*7+index*3)%5)*.04;stones.push(new THREE.DodecahedronGeometry(s,0).scale(1,.7,1).translate(x+Math.cos(a)*.34,s*.45,-.22+Math.sin(a)*.3));}
  }
  const footing=new THREE.Mesh(mergeGeometries(stones),new THREE.MeshStandardMaterial({color:"#8d8b8f",flatShading:true,roughness:1}));sign.add(footing);
  sign.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});sign.userData.texture=texture;return sign;
}

export default function RoadTripScene({ state, skills, onCar, onReady }) {
  // Tells the page this world is built (the loading screen builds the worlds one after another).
  const ready=useRef(onReady);ready.current=onReady;
  const host=useRef(null),carClick=useRef(onCar);
  carClick.current=onCar;
  useEffect(()=>{
    const mount=host.current;
    let renderer,disposed=false,raf=0;
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"}); } catch { ready.current?.(); return; }
    const adapt=adaptivePixelRatio(renderer,{onChange:()=>frameSize()});
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    const canvas=renderer.domElement;canvas.style.touchAction="pan-y";
    const preference=matchMedia("(prefers-reduced-motion: reduce)");
    // On screen while the director has the Skills section (2) live.
    const onScreen=()=>state.current.live.includes(2);
    const scene=new THREE.Scene();scene.fog=new THREE.Fog("#ead2b8",40,210);
    const camera=new THREE.PerspectiveCamera(42,1,.5,900);
    const rng=random(9);

    // Golden hour: a low warm sun from the side of the valley, so the pines lay long soft shadows across the road
    // with sunlit gaps between them. The shadow map only covers the stretch around the car and moves with it (smaller on phones).
    const lite=matchMedia("(pointer: coarse)").matches;
    scene.add(new THREE.HemisphereLight("#ffe6cf","#6b5d4c",1.6));
    const SUN=new THREE.Vector3(-1,.85,-.45).normalize(),sun=new THREE.DirectionalLight("#ffc890",3.2);
    sun.castShadow=true;sun.shadow.mapSize.setScalar(lite?1024:2048);sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;sun.shadow.radius=4;
    Object.assign(sun.shadow.camera,{left:-38,right:38,top:38,bottom:-38,near:1,far:180});sun.shadow.camera.updateProjectionMatrix();scene.add(sun,sun.target);

    // The valley: one smooth landscape. Flat along the road, rising into rounded granite mountains on both sides and at
    // the far end, with the Merced-style river carved into the floor beside the road.
    const roadPoints=ROAD.getSpacedPoints(140);
    const nearest=(points,x,z)=>{let best=1e9;for(const p of points){const d=(p.x-x)**2+(p.z-z)**2;if(d<best)best=d;}return Math.sqrt(best);};
    // The valley carries on straight past the end of the road (no road on it), so it opens toward the peaks.
    const valleyPoints=[...roadPoints,...(()=>{const p=ROAD.getPointAt(1),t=ROAD.getTangentAt(.999);return Array.from({length:70},(_,i)=>p.clone().addScaledVector(t,4+i*3));})()];
    const roadDistance=(x,z)=>nearest(valleyPoints,x,z);
    // The river runs alongside the road, on its right, meandering a little.
    const riverPoints=roadPoints.map((p,i)=>{const t=ROAD.getTangentAt(Math.min(i/(roadPoints.length-1),.999)),s=new THREE.Vector3(-t.z,0,t.x);return p.clone().addScaledVector(s,8+2.2*Math.sin(i*.12));});
    const riverDistance=(x,z)=>nearest(riverPoints,x,z);
    const springs=SPRINGS.map(x=>({at:leftOf(x),r:x[2]})),geyserAt=GEYSER.at,basins=[...springs,{at:geyserAt,r:GEYSER.r}];
    const basinDistance=(x,z)=>Math.min(...basins.map(b=>Math.hypot(x-b.at.x,z-b.at.y)-b.r));
    const rawHeight=(x,z)=>{
      const rd=roadDistance(x,z),vd=riverDistance(x,z);
      const ridges=.6+.4*Math.sin(x*.045+z*.03)*Math.cos(z*.04-x*.02)+.12*Math.sin(x*.13+z*.11);
      const valley=Math.pow(smooth((rd-9)/42),1.5)*50*ridges;
      const floor=.22*Math.sin(x*.15+z*.1)*smooth((rd-4)/8),channel=-1.1*smooth(1-vd/3.4);
      return (floor+valley)*smooth((rd-2.2)/2.5)+channel;
    };
    // The basins sit on level sinter terraces.
    basins.forEach(b=>{b.y=rawHeight(b.at.x,b.at.y);});
    const heightAt=(x,z)=>{let h=rawHeight(x,z);for(const b of basins){const w=smooth((b.r*1.8+3-Math.hypot(x-b.at.x,z-b.at.y))/3);if(w>0)h+=(b.y-h)*w;}return h;};
    const groundY=heightAt;
    {
      const g=new THREE.PlaneGeometry(280,320,170,190).rotateX(-Math.PI/2).translate(0,0,-80),pos=g.attributes.position,colors=new Float32Array(pos.count*3);
      for(let i=0;i<pos.count;i++)pos.setY(i,heightAt(pos.getX(i),pos.getZ(i))-.05);
      g.computeVertexNormals();
      const meadow=new THREE.Color("#86b552"),dry=new THREE.Color("#a9b865"),forest=new THREE.Color("#47703a"),sinter=new THREE.Color("#e4ddcc"),mat=new THREE.Color("#c9773f"),shade=new THREE.Color("#55823e"),granite=new THREE.Color("#a7a196"),pale=new THREE.Color("#d8d2c6"),bank=new THREE.Color("#8e8463"),c=new THREE.Color(),normal=g.attributes.normal;
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),steep=1-normal.getY(i),streak=.5+.5*Math.sin(x*1.3+z*.2);
        c.copy(meadow).lerp(dry,smooth(Math.sin(x*.07-z*.05)*.8)*.5).lerp(shade,smooth((roadDistance(x,z)-5)/6)*.7);
        c.lerp(forest,smooth((y-1.5)/4));
        c.lerp(granite,smooth((y-14+steep*14)/8)).lerp(pale,smooth((y-30)/10)*streak*.8);
        if(riverDistance(x,z)<3.6)c.lerp(bank,.55);
        // Hot-spring sinter: pale terraces, with orange bacterial mats running off the pools.
        const bd=basinDistance(x,z);if(bd<5){c.lerp(sinter,smooth((5-bd)/2.5));c.lerp(mat,smooth(1-Math.abs(bd-.6)/1.4)*.75*(.6+.4*Math.sin(Math.atan2(z,x)*9+x)));}
        colors.set([c.r,c.g,c.b],i*3);
      }
      g.setAttribute("color",new THREE.BufferAttribute(colors,3));
      const ground=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));ground.receiveShadow=true;scene.add(ground);
    }
    // The river: a flowing ribbon down its channel.
    const riverUniforms={uTime:{value:0}};
    {
      const positions=[],uvs=[],index=[];let length=0;
      riverPoints.forEach((p,i)=>{if(i)length+=p.distanceTo(riverPoints[i-1]);const n=riverPoints[Math.min(i+1,riverPoints.length-1)].clone().sub(riverPoints[Math.max(i-1,0)]).normalize(),s=new THREE.Vector3(-n.z,0,n.x),w=1.5+.4*Math.sin(i*.2);
        positions.push(p.x-s.x*w,-.5,p.z-s.z*w,p.x+s.x*w,-.5,p.z+s.z*w);uvs.push(0,length,1,length);if(i)index.push(i*2-2,i*2-1,i*2,i*2-1,i*2+1,i*2);});
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));g.setIndex(index);
      scene.add(new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:riverUniforms,transparent:true,
        vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`varying vec2 vUv;uniform float uTime;void main(){float across=abs(vUv.x-.5)*2.;float f=fract(vUv.y*.35+uTime*.35+sin(vUv.x*8.+vUv.y*.6)*.08);
          vec3 c=mix(vec3(.24,.52,.58),vec3(.48,.76,.78),1.-across)+smoothstep(.0,.06,f)*smoothstep(.16,.08,f)*.22*(1.-across)+smoothstep(.75,.98,across)*.3;
          gl_FragColor=vec4(c,.92*smoothstep(1.,.85,across));
          #include <colorspace_fragment>
        }`})));
    }
    // The road: asphalt ribbon with white edges and a dashed yellow centre line.
    {
      const pts=ROAD.getSpacedPoints(260),positions=[],uvs=[],index=[],side=new THREE.Vector3(),tan=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
      let length=0;
      pts.forEach((p,i)=>{if(i)length+=p.distanceTo(pts[i-1]);tan.subVectors(pts[Math.min(i+1,pts.length-1)],pts[Math.max(i-1,0)]).normalize();side.crossVectors(tan,up).normalize();
        const y=groundY(p.x,p.z)+.04;positions.push(p.x-side.x*1.7,y,p.z-side.z*1.7,p.x+side.x*1.7,y,p.z+side.z*1.7);uvs.push(0,length,1,length);if(i)index.push(i*2-2,i*2-1,i*2,i*2-1,i*2+1,i*2);});
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));g.setIndex(index);g.computeVertexNormals();
      // Markings painted on a strip that repeats along the road: white edges and a dashed yellow centre line.
      const strip=document.createElement("canvas");strip.width=128;strip.height=256;const m=strip.getContext("2d");
      m.fillStyle="#4b4a50";m.fillRect(0,0,128,256);m.fillStyle="#f2eee4";m.fillRect(6,0,4,256);m.fillRect(118,0,4,256);m.fillStyle="#f6c234";m.fillRect(62,0,4,128);
      const markings=new THREE.CanvasTexture(strip);markings.colorSpace=THREE.SRGBColorSpace;markings.wrapT=THREE.RepeatWrapping;markings.anisotropy=8;
      const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)*.25);
      const material=new THREE.MeshStandardMaterial({map:markings,roughness:.9,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
      const road=new THREE.Mesh(g,material);road.receiveShadow=true;scene.add(road);
    }
    // Half Dome on the far ridge.
    const halfDome=createHalfDome(rng);halfDome.scale.setScalar(30);halfDome.position.set(62,heightAt(62,-185)-6,-185);halfDome.rotation.y=-Math.PI/2-.4;scene.add(halfDome);
    // Deep forest: tall pines packed right up to the road shoulders and on up the slopes, with dead snags among them,
    // grass, lupine and daisies underfoot, rocks and split-rail fences. Clearings stay open for the river, the
    // hot springs, the signs and the antelope meadows. Phones get a thinner forest.
    const swayTime={value:0};let autumnSpots;
    const signSpots=STATIONS.map((u,i)=>{const p=ROAD.getPointAt(u+.012),t=ROAD.getTangentAt(u+.012),side=i%2?1:-1;return new THREE.Vector2(p.x-t.z*side*3.6,p.z+t.x*side*3.6);});
    const MEADOWS=[.13,.2,.27,.58,.66,.74].map(u=>leftOf([u,10.5])),MOOSE=new THREE.Vector2(-18,-64);
    const open=(x,z,clear=0)=>riverDistance(x,z)<3.4+clear||basinDistance(x,z)<4+clear||Math.hypot(x-geyserAt.x,z-geyserAt.y)<6||signSpots.some(p=>Math.hypot(x-p.x,z-p.y)<5)||MEADOWS.some(p=>Math.hypot(x-p.x,z-p.y)<6.5)||Math.hypot(x-MOOSE.x,z-MOOSE.y)<11;
    {
      const trees=[],snags=[],grid=lite?3.6:2.5;
      autumnSpots=[];
      for(let x=-140;x<140;x+=grid)for(let z=26;z>-210;z-=grid){
        const px=x+(rng()-.5)*grid*.9,pz=z+(rng()-.5)*grid*.9,rd=roadDistance(px,pz);
        // Dense near the road, thinning with distance; nothing on the bare granite.
        if(rd<5.4||rd>78||rng()>(rd<40?.92:.55)||open(px,pz))continue;
        // A ragged treeline partway up the walls, so bare granite and the peaks behind show above the forest.
        const y=heightAt(px,pz);if(y>11+5*Math.sin(px*.21+pz*.13)+rng()*3)continue;
        // Younger, shorter trees line the road so the peaks show over them; the old giants stand further back.
        const height=(rd<11?4.5+rng()*3:7+rng()*6)*(rd>40?1.3:1),pick=rng();
        // The kit's autumn trees and birches are detailed, so only a couple of hundred, near the road.
        if(rd<16&&pick<.2&&autumnSpots.length<200)autumnSpots.push([px,y,pz,(4+rng()*3)*(pick<.11?1:1.15),pick<.11?0:1]);else(pick>.93?snags:trees).push([px,y,pz,height]);
      }
      const place=(geometry,all,tint)=>{const material=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.95});
       for(const spots of chunkSpots(all)){const mesh=new THREE.InstancedMesh(geometry,material,spots.length),d=new THREE.Object3D(),c=new THREE.Color();
        spots.forEach(([x,y,z,h],i)=>{d.position.set(x,y-.15,z);d.rotation.set((rng()-.5)*.06,rng()*6,(rng()-.5)*.06);d.scale.set(h*(.85+rng()*.3),h,h*(.85+rng()*.3));d.updateMatrix();mesh.setMatrixAt(i,d.matrix);
          mesh.setColorAt(i,tint?c.setHSL(.24+rng()*.06,.25+rng()*.25,.8+rng()*.2).lerp(new THREE.Color("#ffffff"),.4):c.set("#ffffff"));});
        mesh.computeBoundingSphere();mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);}};
      place(createForestPine(rng),trees,true);place(createSnag(),snags,false);
      // Fall colour among the pines, and snowy peaks past the valley walls: the island's own kit (autumn trees, birches,
      // the mountain), baked to vertex colours. The peaks skip the fog and carry their own haze instead.
      new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load("/models/island/kit.glb",gltf=>{
        if(disposed)return;
        const find=prefix=>{let hit=null;gltf.scene.traverse(o=>{if(!hit&&o.name.startsWith(prefix))hit=o;});return hit;};
        const bake=node=>{node.position.set(0,0,0);const g=bakeProp(node);g.translate(0,-g.boundingBox.min.y,0);g.computeBoundingBox();return g;};
        ["CommonTree_Autumn","BirchTree"].forEach((name,kind)=>{const node=find(name);if(!node)return;const g=bake(node),h=g.boundingBox.max.y;
          place(g,autumnSpots.filter(f=>f[4]===kind).map(([x,y,z,size])=>[x,y,z,size/h]),false);});
        const peak=find("Mountain");if(!peak)return;
        const g=bake(peak),h=g.boundingBox.max.y,haze=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1,fog:false,color:"#ffffff",emissive:"#dfe4f0",emissiveIntensity:.55});
        // A ring of big snowy peaks around the valley, and the tallest right behind the geyser at the end of the road.
        const end=new THREE.Vector2().copy(geyserAt).sub(new THREE.Vector2(0,-50)).normalize();
        const ring=[...Array(9)].map((_,i)=>{const a=i/9*Math.PI*2+.3;return [Math.cos(a)*300,-50+Math.sin(a)*300,200+(i*37%5)*22,i*1.7];});
        for(const [x,z,size,turn] of [[geyserAt.x+end.x*360,geyserAt.y+end.y*360,135,.6],...ring]){
          const m=new THREE.Mesh(g,haze);m.scale.setScalar(size/h);m.position.set(x,-12,z);m.rotation.y=turn;scene.add(m);}
      },undefined,()=>{});
      // Undergrowth sways in the breeze (vertex shader, per-instance phase).
      const swaying=()=>createSwayMaterial(swayTime);
      const scatter=(geometry,count,minD,maxD,scale)=>{const mesh=new THREE.InstancedMesh(geometry,swaying(),count),d=new THREE.Object3D();let n=0;
        for(let k=0;k<count*6&&n<count;k++){const along=ROAD.getPointAt(rng()),x=along.x+(rng()-.5)*maxD*2,z=along.z+(rng()-.5)*maxD*2,rd=roadDistance(x,z);
          if(rd<minD||rd>maxD||riverDistance(x,z)<2.2||basinDistance(x,z)<2)continue;
          d.position.set(x,heightAt(x,z)-.03,z);d.rotation.y=rng()*6;d.scale.setScalar(scale*(.7+rng()*.6));d.updateMatrix();mesh.setMatrixAt(n++,d.matrix);}
        mesh.count=n;mesh.receiveShadow=true;scene.add(mesh);};
      const scale=lite?.6:1;
      scatter(createTuft(rng),Math.round(9000*scale),2,22,1);scatter(createTuft(rng),Math.round(3000*scale),2.3,9,1.2);
      scatter(createLupine(),Math.round(900*scale),2.2,18,.9);scatter(createDaisy(),Math.round(700*scale),2.2,14,.8);
      // Rocks: grey-blue boulders along the shoulders and in the woods.
      {const rocks=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0).scale(1,.65,.9),new THREE.MeshStandardMaterial({color:"#7e7f8e",flatShading:true,roughness:1}),160),d=new THREE.Object3D();let n=0;
        for(let k=0;k<1200&&n<160;k++){const along=ROAD.getPointAt(rng()),x=along.x+(rng()-.5)*40,z=along.z+(rng()-.5)*40,rd=roadDistance(x,z);if(rd<2.6||riverDistance(x,z)<2.5||basinDistance(x,z)<3)continue;
          const s=.2+rng()*rng()*1.1;d.position.set(x,heightAt(x,z)+s*.15,z);d.rotation.set(rng(),rng()*6,rng()*.4);d.scale.setScalar(s);d.updateMatrix();rocks.setMatrixAt(n++,d.matrix);}
        rocks.count=n;rocks.castShadow=rocks.receiveShadow=true;scene.add(rocks);}
      // Split-rail fences along a few stretches of the road.
      {const posts=[],rails=[];
        for(const [from,to,side] of [[0,.06,-1],[0,.06,1],[.13,.22,1],[.68,.78,1]]){let last=null;
          for(let u=from;u<=to;u+=2.6/ROAD.getLength()){const p=ROAD.getPointAt(u),t=ROAD.getTangentAt(u),x=p.x-t.z*side*3,z=p.z+t.x*side*3,y=heightAt(x,z);
            posts.push([x,y,z]);if(last)rails.push([last,[x,y,z]]);last=[x,y,z];}}
        const wood=new THREE.MeshStandardMaterial({color:"#7b4a2c",flatShading:true,roughness:1}),d=new THREE.Object3D();
        const postMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.16,1.15,.16).translate(0,.57,0),wood,posts.length);
        posts.forEach(([x,y,z],i)=>{d.position.set(x,y,z);d.rotation.set(0,rng()*.3,0);d.scale.setScalar(1);d.updateMatrix();postMesh.setMatrixAt(i,d.matrix);});
        const railMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.08,.1,1),wood,rails.length*2);
        rails.forEach(([a,b],i)=>{for(const [k,h] of [[0,.45],[1,.88]]){d.position.set((a[0]+b[0])/2,(a[1]+b[1])/2+h,(a[2]+b[2])/2);d.rotation.set(0,Math.atan2(b[0]-a[0],b[2]-a[2]),0);d.scale.set(1,1,Math.hypot(b[0]-a[0],b[2]-a[2])+.1);d.updateMatrix();railMesh.setMatrixAt(i*2+k,d.matrix);}});
        postMesh.castShadow=railMesh.castShadow=true;scene.add(postMesh,railMesh);}
    }
    // Hot springs: each pool is a disc whose shader paints Grand Prismatic's rings, deep blue in the middle through
    // teal, green and yellow to an orange rim with streaky fingers, with a slow shimmer over the deep water.
    const poolUniforms={uTime:{value:0}};
    const poolMaterial=new THREE.ShaderMaterial({uniforms:poolUniforms,transparent:true,polygonOffset:true,polygonOffsetFactor:-2,
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying vec2 vUv;uniform float uTime;void main(){
        vec2 d=vUv-.5;float r=length(d)*2.,a=atan(d.y,d.x);
        float rr=r+(.035*sin(a*23.)+.025*sin(a*41.+1.)+.02*sin(a*7.+2.))*smoothstep(.45,.9,r);
        vec3 c=vec3(.05,.3,.62);
        c=mix(c,vec3(.2,.66,.78),smoothstep(.28,.44,rr));c=mix(c,vec3(.55,.76,.46),smoothstep(.5,.58,rr));
        c=mix(c,vec3(.95,.8,.32),smoothstep(.6,.68,rr));c=mix(c,vec3(.88,.45,.17),smoothstep(.72,.82,rr));c=mix(c,vec3(.64,.3,.15),smoothstep(.88,.96,rr));
        c+=.07*sin(r*28.-uTime*1.4+sin(a*3.)*1.5)*(1.-smoothstep(.25,.5,r));
        gl_FragColor=vec4(c,1.-smoothstep(.96,1.,rr));
        #include <colorspace_fragment>
      }`});
    springs.forEach((b,i)=>{const pool=new THREE.Mesh(new THREE.CircleGeometry(1,48).rotateX(-Math.PI/2),poolMaterial);pool.scale.set(b.r,1,b.r*(i?1:.9));pool.rotation.y=i*1.7;pool.position.set(b.at.x,b.y+.05,b.at.y);scene.add(pool);});
    // The geyser: a low sinter cone with a vent, clickable.
    const geyserCone=new THREE.Mesh(paintGeometry(new THREE.CylinderGeometry(.5,GEYSER.r,.7,12,1,true).translate(0,.35,0),"#ddd5c3"),new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1,side:THREE.DoubleSide}));
    geyserCone.receiveShadow=true;geyserCone.position.set(geyserAt.x,basins.at(-1).y-.05,geyserAt.y);scene.add(geyserCone);
    const vent=new THREE.Mesh(new THREE.CircleGeometry(.5,12).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:"#3f6f86"}));vent.position.set(0,.68,0);geyserCone.add(vent);
    // Steam and spray are soft point sprites animated entirely in the shader. Steam drifts up off every pool and the
    // vent; during an eruption (uPower 0→1→0) the vent steam billows and the spray column shoots up and rains back.
    const particleUniforms={uTime:{value:0},uPower:{value:0},uScale:{value:600}};
    const spriteFragment=`varying float vAlpha;uniform vec3 uColor;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(uColor,vAlpha*smoothstep(1.,.2,d));}`;
    {
      const pos=[],seed=[],params=[];
      const emit=(x,y,z,r,count,height,size,boost)=>{for(let i=0;i<count;i++){const a=rng()*6.28,d=Math.sqrt(rng())*r;pos.push(x+Math.cos(a)*d,y,z+Math.sin(a)*d);seed.push(rng(),rng(),rng());params.push(height,size,boost);}};
      springs.forEach(b=>emit(b.at.x,b.y+.1,b.at.y,b.r*.75,Math.round(b.r*16),b.r*1.6+2,b.r*.5+1.2,0));
      emit(geyserAt.x,basins.at(-1).y+.7,geyserAt.y,.3,50,3,1.4,1);
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("aSeed",new THREE.Float32BufferAttribute(seed,3));g.setAttribute("aParams",new THREE.Float32BufferAttribute(params,3));
      const steam=new THREE.Points(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{...particleUniforms,uColor:{value:new THREE.Color("#f4f6f7")}},
        vertexShader:`attribute vec3 aSeed,aParams;uniform float uTime,uPower,uScale;varying float vAlpha;void main(){
          float boost=1.+aParams.z*uPower*3.,t=fract(uTime*(.12+aSeed.x*.08)+aSeed.z);
          vec3 p=position+vec3(t*t*2.2+sin(t*4.+aSeed.y*6.)*.4,t*aParams.x*boost,sin(t*3.+aSeed.x*6.)*.4);
          vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
          gl_PointSize=aParams.y*(.6+t*1.8)*(1.+aParams.z*uPower*1.5)*uScale/-mv.z;vAlpha=sin(t*3.14159)*(.28+aParams.z*uPower*.25);}`,
        fragmentShader:spriteFragment}));
      steam.frustumCulled=false;steam.renderOrder=2;scene.add(steam);
    }
    {
      const count=lite?160:320,pos=new Float32Array(count*3),seed=[];
      for(let i=0;i<count;i++){pos.set([geyserAt.x,basins.at(-1).y+.7,geyserAt.y],i*3);seed.push(rng(),rng(),rng());}
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));g.setAttribute("aSeed",new THREE.Float32BufferAttribute(seed,3));
      const spray=new THREE.Points(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{...particleUniforms,uColor:{value:new THREE.Color("#ffffff")}},
        vertexShader:`attribute vec3 aSeed;uniform float uTime,uPower,uScale;varying float vAlpha;void main(){
          float t=fract(uTime*(.55+aSeed.y*.25)+aSeed.z),h=16.*uPower*(.7+.3*aSeed.y),a=aSeed.x*6.2832;
          float y=h*(1.-pow((t-.62)/.62,2.)),r=(.15+aSeed.y*.9)*t*t*(1.+h*.12);
          vec3 p=position+vec3(cos(a)*r+t*t*1.6,y,sin(a)*r);
          vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
          gl_PointSize=(.35+t*1.6)*uScale/-mv.z;vAlpha=uPower*(1.-t*.8)*.8;}`,
        fragmentShader:spriteFragment}));
      spray.frustumCulled=false;spray.renderOrder=3;scene.add(spray);
    }
    const geyser={t:-1,wait:8},geyserFocus=new THREE.Vector3(geyserAt.x,basins.at(-1).y+9,geyserAt.y);
    const erupt=()=>{if(geyser.t<0)geyser.t=0;};
    // Skill signs at each stop, beside the road on alternating sides, angled toward the approaching car.
    const frame={p:new THREE.Vector3(),t:new THREE.Vector3(),s:new THREE.Vector3()};
    const frameAt=(u,out=frame)=>{ROAD.getPointAt(THREE.MathUtils.clamp(u,0,1),out.p);ROAD.getTangentAt(THREE.MathUtils.clamp(u,0,.999),out.t).normalize();out.s.crossVectors(out.t,new THREE.Vector3(0,1,0)).normalize();return out;};
    const signs=skills.map((skill,i)=>{const sign=createSign(skill,i),f=frameAt(STATIONS[i]+.012),side=i%2?1:-1;
      sign.position.copy(f.p).addScaledVector(f.s,side*3.6);sign.position.y=groundY(sign.position.x,sign.position.z);
      sign.lookAt(sign.position.x-f.t.x*6-f.s.x*side*3,sign.position.y,sign.position.z-f.t.z*6-f.s.z*side*3);sign.userData.side=side;scene.add(sign);return sign;});

    // The car: the loaded wagon, wheels spun in the vertex shader around each wheel's own centre.
    const car=new THREE.Group(),body=new THREE.Group();car.add(body);scene.add(car);
    const wheelSpin={value:0};let carReady=false;
    new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load("/models/island/wagon.glb",gltf=>{
      if(disposed)return;
      const model=gltf.scene,box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
      // The wagon's length runs along x with its nose at -x; turn it so it faces +z (the way the car travels).
      const holder=new THREE.Group();holder.add(model);holder.rotation.y=Math.PI/2;
      model.position.set(-(box.min.x+box.max.x)/2,-box.min.y,-(box.min.z+box.max.z)/2);
      holder.scale.setScalar(2.6/size.x);body.add(holder);
      model.traverse(o=>{
        if(!o.isMesh)return;o.castShadow=true;o.material=o.material.clone();o.material.flatShading=true;o.material.roughness=.8;o.material.metalness=0;
        // Tyres are the near-black material.
        const c=o.material.color,wheel=c.r<.03&&c.g<.03&&c.b<.03;
        if(!wheel)return;
        // Find the four wheel centres for this mesh (by quadrant), then spin vertices around them.
        const pos=o.geometry.attributes.position,b=new THREE.Box3().setFromBufferAttribute(pos),mid=b.getCenter(new THREE.Vector3()),sums=[0,1,2,3].map(()=>new THREE.Vector3()),counts=[0,0,0,0];
        for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),q=(x>mid.x?1:0)+(z>mid.z?2:0);sums[q].add(new THREE.Vector3(x,pos.getY(i),z));counts[q]++;}
        const centers=sums.map((v,q)=>counts[q]?v.divideScalar(counts[q]):mid.clone());
        o.material.onBeforeCompile=shader=>{
          shader.uniforms.uSpin=wheelSpin;shader.uniforms.uMid={value:mid};shader.uniforms.uCenters={value:centers};
          shader.vertexShader=shader.vertexShader.replace("#include <common>","#include <common>\nuniform float uSpin;uniform vec3 uMid;uniform vec3 uCenters[4];")
            .replace("#include <begin_vertex>",`#include <begin_vertex>
              int q=(transformed.x>uMid.x?1:0)+(transformed.z>uMid.z?2:0);vec3 c=uCenters[0];
              if(q==1)c=uCenters[1];else if(q==2)c=uCenters[2];else if(q==3)c=uCenters[3];
              vec2 d=transformed.xy-c.xy;float s=sin(uSpin),k=cos(uSpin);transformed.xy=c.xy+vec2(d.x*k-d.y*s,d.x*s+d.y*k);`);
        };
      });
      carReady=true;
    },undefined,()=>{});
    // Wildlife (Poly Pizza, see public/models/CREDITS.md). Antelope graze on the meadow across from the river and bound
    // away from the passing car; a wolf pack trots a loop through the valley and gallops off when the car comes close.
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),antelope=[],wolves=[];
    const ANTELOPE={Graze:[0,1.2,.004,0,0,.05],Walk:[.34,3.8,.008,.55,.035,.08],Bound:[.62,8,.05,.9,.07,.12]};
    loader.load("/models/island/antelope.glb",gltf=>{
      if(disposed)return;
      const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3());
      for(let i=0;i<6;i++){
        const model=i?gltf.scene.clone():gltf.scene,root=new THREE.Group();let gait=null;
        model.traverse(o=>{if(!o.isMesh)return;
          // Pronghorn colouring: tan coat, cream belly and rump (from the baked colours' lightness).
          const c=o.geometry.attributes.color;if(c&&i===0){const tan=new THREE.Color("#b5733d"),cream=new THREE.Color("#efe4d0"),dark=new THREE.Color("#3a2416"),tmp=new THREE.Color();
            for(let k=0;k<c.count;k++){const l=(c.getX(k)+c.getY(k)+c.getZ(k))/3;tmp.copy(l<.02?dark:l<.25?tan:cream);c.setXYZ(k,tmp.r,tmp.g,tmp.b);}c.needsUpdate=true;}
          gait??=createBearMaterial(o.geometry,{hip:.42});o.material=gait.material;o.frustumCulled=false;});
        model.scale.setScalar(1.25/size.y);model.position.y=-box.min.y*1.25/size.y;root.add(model);scene.add(root);
        const x=MEADOWS[i].x+(rng()-.5)*4,z=MEADOWS[i].y+(rng()-.5)*4;root.position.set(x,heightAt(x,z),z);
        antelope.push({root,gait,yaw:rng()*6,state:"graze",timer:rng()*5,gaitName:"Graze",swing:0,phase:rng()*6,target:new THREE.Vector2(x,z),speed:0,home:new THREE.Vector2(x,z)});
      }
    },undefined,()=>{});
    loader.load("/models/island/wolf.glb",gltf=>{
      if(disposed)return;
      const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3());
      for(let i=0;i<3;i++){
        const model=i?cloneSkinned(gltf.scene):gltf.scene,root=new THREE.Group();
        model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.material=o.material.clone();o.material.flatShading=true;o.material.roughness=.9;o.frustumCulled=false;}});
        model.scale.setScalar(.95/size.y);model.position.y=-box.min.y*.95/size.y;root.add(model);scene.add(root);
        const mixer=new THREE.AnimationMixer(model),actions={};for(const clip of gltf.animations)actions[clip.name]=mixer.clipAction(clip);
        wolves.push({root,mixer,actions,current:null,lag:i*.045,side:(i-1)*1.1});
      }
    },undefined,()=>{});
    const playWolf=(w,name)=>{if(w.current===name||!w.actions[name])return;w.actions[name].reset().fadeIn(.3).play();w.actions[w.current]?.fadeOut(.3);w.current=name;};
    const pack={a:0,pause:6,rest:0,run:0};
    // A bull moose stands his ground in a grassy clearing while the wolves circle him; he turns to face the nearest.
    let moose=null;
    loader.load("/models/island/moose.glb",gltf=>{
      if(disposed)return;
      const model=gltf.scene,box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),root=new THREE.Group();let gait=null;
      model.traverse(o=>{if(!o.isMesh)return;gait??=createBearMaterial(o.geometry,{hip:.45});o.material=gait.material;o.castShadow=true;o.frustumCulled=false;});
      model.scale.setScalar(2.6/size.y);model.position.y=-box.min.y*2.6/size.y;root.add(model);root.position.set(MOOSE.x,heightAt(MOOSE.x,MOOSE.y),MOOSE.y);scene.add(root);
      moose={root,gait,yaw:0,phase:0,swing:0,alert:0};
    },undefined,()=>{});
    const fishes=Array.from({length:12},(_,i)=>{const fish=createFish(40+i);fish.scale.setScalar(3.2);fish.traverse(o=>{if(o.isMesh)o.castShadow=true;});scene.add(fish);return {fish,s:i/12,speed:.004+rng()*.004,jumpIn:rng()*8};});
    function updateAnimals(dt,now,carPos){
      for(const a of antelope){
        const p=a.root.position,d=Math.hypot(p.x-carPos.x,p.z-carPos.z);a.timer-=dt;
        if(d<9&&a.state!=="bound"){const dx=(p.x-carPos.x)/(d||1),dz=(p.z-carPos.z)/(d||1);a.target.set(p.x+dx*9,p.z+dz*9);a.state="bound";a.gaitName="Bound";a.speed=5.5;}
        else if(a.state==="graze"&&a.timer<=0){const ang=rng()*Math.PI*2;a.target.set(a.home.x+Math.cos(ang)*4,a.home.y+Math.sin(ang)*4);a.state="walk";a.gaitName="Walk";a.speed=.7;}
        if(a.state!=="graze"){const dx=a.target.x-p.x,dz=a.target.y-p.z,dist=Math.hypot(dx,dz);
          if(dist<.2||(a.state==="bound"&&roadDistance(p.x,p.z)>26)){a.state="graze";a.gaitName="Graze";a.speed=0;a.timer=3+rng()*6;if(a.state==="graze")a.home.set(p.x,p.z);}
          else{const step=Math.min(dist,a.speed*dt);p.x+=dx/dist*step;p.z+=dz/dist*step;let turn=Math.atan2(dx,dz)-a.yaw;turn=Math.atan2(Math.sin(turn),Math.cos(turn));a.yaw+=turn*(1-Math.exp(-dt*6));}}
        const [swing,rate,bob,knee,lift,nod]=ANTELOPE[a.gaitName];a.swing+=(swing-a.swing)*(1-Math.exp(-dt*5));a.phase+=dt*rate;
        const u=a.gait.uniforms;u.uPhase.value=a.phase;u.uSwing.value=a.swing;u.uKnee.value=knee;u.uLift.value=lift*u.uHeight.value;u.uNod.value=nod;u.uHeadDown.value=a.gaitName==="Graze"?.45:0;
        u.uBob.value=0;
        // Bounding antelope pronk: springy hops clear of the ground.
        p.y=heightAt(p.x,p.z)+(a.gaitName==="Bound"?Math.abs(Math.sin(a.phase*.5))*.55:0);a.root.rotation.y=a.yaw;
      }
      if(wolves.length){
        // The pack trots a wide loop through the valley, sometimes stopping to look around; it gallops if the car is close.
        const lead=new THREE.Vector3(MOOSE.x+Math.cos(pack.a)*7,0,MOOSE.y+Math.sin(pack.a)*8),near=Math.hypot(lead.x-carPos.x,lead.z-carPos.z)<12;
        if(near)pack.run=3;pack.run=Math.max(0,pack.run-dt);pack.pause-=dt;
        let speed=pack.run>0?.5:.16;if(pack.pause<0&&pack.run<=0){speed=0;pack.rest+=dt;if(pack.rest>3){pack.rest=0;pack.pause=8+rng()*8;}}
        pack.a+=dt*speed;
        for(const w of wolves){
          const a=pack.a-w.lag*3,x=MOOSE.x+Math.cos(a)*(7+w.side),z=MOOSE.y+Math.sin(a)*(8+w.side),next=a+.02;
          w.root.position.set(x,heightAt(x,z),z);w.root.lookAt(MOOSE.x+Math.cos(next)*(7+w.side),w.root.position.y,MOOSE.y+Math.sin(next)*(8+w.side));
          playWolf(w,speed===0?"Idle":pack.run>0?"Gallop":"Walk");w.mixer.update(dt);
        }
      }
      if(moose){
        // Face the nearest wolf: a slow, heavy turn with a few steps; head up and wary.
        const p=moose.root.position;let target=moose.yaw,turning=0;
        if(wolves.length){const w=wolves.reduce((a,b)=>a.root.position.distanceToSquared(p)<b.root.position.distanceToSquared(p)?a:b);target=Math.atan2(w.root.position.x-p.x,w.root.position.z-p.z);}
        let turn=Math.atan2(Math.sin(target-moose.yaw),Math.cos(target-moose.yaw));moose.yaw+=turn*(1-Math.exp(-dt*.9));turning=Math.min(1,Math.abs(turn)*2);
        moose.swing+=(turning*.3-moose.swing)*(1-Math.exp(-dt*4));moose.phase+=dt*2.4*turning;
        const u=moose.gait.uniforms;u.uPhase.value=moose.phase;u.uSwing.value=moose.swing;u.uKnee.value=.4;u.uLift.value=.03*u.uHeight.value;u.uNod.value=.05;u.uBob.value=0;
        u.uHeadDown.value+=((turning<.2?.15:0)-u.uHeadDown.value)*(1-Math.exp(-dt*2));moose.root.rotation.y=moose.yaw;
      }
      // Fish swim up the river and leap now and then.
      for(const f of fishes){
        f.s=(f.s+dt*f.speed)%1;const i=f.s*(riverPoints.length-1),k=Math.floor(i),a=riverPoints[k],b=riverPoints[Math.min(k+1,riverPoints.length-1)];
        f.fish.position.lerpVectors(a,b,i-k);f.fish.lookAt(f.fish.position.x+(b.x-a.x),f.fish.position.y,f.fish.position.z+(b.z-a.z));
        f.jumpIn-=dt;let y=-.62;
        if(f.jumpIn<0){const t=-f.jumpIn/.9;if(t>=1){f.jumpIn=2+rng()*7;}else{y=-.6+Math.sin(t*Math.PI)*1.4;f.fish.rotateX(-Math.cos(t*Math.PI)*.9);}}
        f.fish.position.y=y;f.fish.visible=y>-.55;f.fish.userData.tail.rotation.y=Math.sin(now*14+f.s*40)*.5;
      }
    }

    // Exhaust puffs.
    const puffMaterial=new THREE.MeshStandardMaterial({color:"#ffffff",roughness:1,transparent:true,opacity:.5,depthWrite:false});
    const puffs=Array.from({length:40},()=>{const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.09,1),puffMaterial.clone());m.visible=false;m.userData.life=-1;scene.add(m);return m;});
    let puffTimer=0;

    // Driving: the car eases along the road to the stop the director picks; a click hops it first.
    let ending=false,drift=0,driftVel=0,u=STATIONS[0],uVel=0,hop=-1,camPos=new THREE.Vector3(),camLook=new THREE.Vector3(),first=true;
    const look=new THREE.Vector3(),offset=new THREE.Vector3(),tilt={pitch:0,roll:0};
    const raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2();let overCar=false,overGeyser=false,arrived=false;
    function onMove(event){const r=canvas.getBoundingClientRect();ndc.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(ndc,camera);overCar=carReady&&raycaster.intersectObject(car,true).length>0;overGeyser=!overCar&&raycaster.intersectObject(geyserCone,true).length>0;canvas.style.cursor=overCar||overGeyser?"pointer":"default";}
    function onClick(){if(overGeyser){erupt();return;}if(!overCar)return;hop=0;carClick.current?.();}
    canvas.addEventListener("pointermove",onMove);canvas.addEventListener("click",onClick);

    let tall=false;
    // The section hand-off slides the view inside the camera (no canvas edge shows), by the same amount as the others.
    const view={w:1,h:1},applyView=()=>{const shift=state.current.shift?.[2]??0;camera.setViewOffset(view.w,view.h,0,shift*view.h*.28,view.w,view.h);};
    function frameSize(){const w=mount.clientWidth,h=mount.clientHeight;view.w=w;view.h=h;renderer.setSize(w,h,false);camera.aspect=w/h;tall=camera.aspect<.85;camera.fov=tall?58:42;camera.updateProjectionMatrix();particleUniforms.uScale.value=h*renderer.getPixelRatio()/(2*Math.tan(camera.fov*Math.PI/360));}
    const resize=new ResizeObserver(frameSize);resize.observe(mount);frameSize();

    const clock=new THREE.Clock();let time=0;
    function tick(dt){
      const reduced=preference.matches,step=reduced?0:dt;time+=step;
      // Scrolling through Skills drives from the first sign to the last (piecewise between the stops).
      const q=state.current.progress[2]*(STATIONS.length-1),k=Math.min(STATIONS.length-2,Math.floor(q)),target=STATIONS[k]+(STATIONS[k+1]-STATIONS[k])*(q-k);
      // Critically damped glide toward the stop: pulls away gently, cruises, brakes into the stop.
      const before=u;
      // Coming back on screen (say, scrolling up from Experience): jump straight to where the scroll says, rather than
      // replaying the whole drive from wherever the wagon was left.
      if(snap){snap=false;u=target;uVel=0;first=true;const end=target>=STATIONS.at(-1)-1e-4;ending=end&&!reduced;drift=ending?1:0;driftVel=0;arrived=ending;}
      if(reduced)u=target;else{const w=2/.9,x=w*dt,decay=1/(1+x+.48*x*x+.235*x*x*x),change=u-target,temp=(uVel+w*change)*dt;uVel=(uVel-w*temp)*decay;u=target+(change+temp)*decay;}
      const speed=(u-before)/Math.max(dt,1/120)*ROAD.getLength();
      frameAt(u);
      car.position.copy(frame.p);car.position.y=groundY(frame.p.x,frame.p.z)+.02;car.lookAt(car.position.clone().add(frame.t));
      // Body: pitch back when pulling away, lean into curves, idle shudder, and the hop (squash and stretch).
      const ahead=frameAt(Math.min(1,u+.01),{p:new THREE.Vector3(),t:new THREE.Vector3(),s:new THREE.Vector3()}),curve=frame.t.clone().cross(ahead.t).y;
      tilt.pitch+=(THREE.MathUtils.clamp(-speed*.012,-.08,.08)-tilt.pitch)*(1-Math.exp(-dt*4));tilt.roll+=(THREE.MathUtils.clamp(curve*speed*.8,-.12,.12)-tilt.roll)*(1-Math.exp(-dt*4));
      // The finale: braking into the last stop, the back end steps out and the wagon skids to a halt broadside,
      // nose toward the geyser (an underdamped spring, so it rocks as it settles). Scrolling back straightens it.
      const last=STATIONS.at(-1),toEnd=target>=last-1e-4;ending=toEnd&&!reduced&&(ending||Math.abs(u-last)<.03);
      driftVel+=((ending?1:0)-drift)*26*step-driftVel*5.5*step;drift+=driftVel*step;if(reduced)drift=0;
      body.rotation.set(tilt.pitch,drift*1.25,tilt.roll-driftVel*.06);body.position.x=-drift*.6;body.position.y=reduced?0:Math.sin(time*38)*.008;
      if(hop>=0){hop+=dt;const k=hop/.6;if(k>=1){hop=-1;body.scale.set(1,1,1);}else{body.position.y+=Math.sin(k*Math.PI)*.9;const sq=k<.12?1-k*2:k>.88?1-(1-k)*2:1+Math.sin(k*Math.PI)*.08;body.scale.set(1/Math.sqrt(sq),sq,1/Math.sqrt(sq));}}
      wheelSpin.value-=speed*step/.32;
      // Exhaust: a puff now and then idling, more often when moving.
      // Tyre dust while it skids.
      if(Math.abs(driftVel)>.35&&carReady)for(const side of [-1,1]){const p=puffs.find(x=>x.userData.life<0);if(p){p.userData.life=0;p.material.color.set("#d9c3a0");p.position.copy(car.position).addScaledVector(frame.t,-1).addScaledVector(frame.s,side*.7);p.position.y+=.15;p.visible=true;}}
      puffTimer-=step;if(puffTimer<=0&&carReady){puffTimer=Math.abs(speed)>.5?.12:.6;const p=puffs.find(x=>x.userData.life<0);if(p){p.userData.life=0;p.material.color.set("#ffffff");p.position.copy(car.position).addScaledVector(frame.t,-1.35).addScaledVector(frame.s,.35);p.position.y+=.35;p.visible=true;}}
      puffs.forEach(p=>{if(p.userData.life<0)return;p.userData.life+=step;const k=p.userData.life/.9;if(k>=1){p.userData.life=-1;p.visible=false;return;}p.position.y+=step*.6;p.scale.setScalar(1+k*1.8);p.material.opacity=.45*(1-k)*(1-k);});
      // Chase camera: behind and above, swinging away from the sign so car and sign share the frame.
      const nearest=Math.round(q),sign=signs[nearest],side=sign?.userData.side??1,near=smooth(1-Math.abs(u-STATIONS[nearest])*30);
      offset.copy(frame.t).multiplyScalar(tall?-10:-8).addScaledVector(frame.s,-side*(2.5+near*1.5)).add({x:0,y:tall?4.4:3.6,z:0});
      look.copy(car.position).addScaledVector(frame.t,4.5).addScaledVector(frame.s,side*near*2.2);look.y+=1.5+near*.8;
      // At the finale the camera backs off to the right and frames the wagon and the geyser together.
      if(drift>.01){const k=Math.min(1,drift);look.lerp(geyserFocus,.42*k);offset.addScaledVector(frame.t,-4*k).addScaledVector(frame.s,3*k).add({x:0,y:.6*k,z:0});}
      if(first){camPos.copy(car.position).add(offset);camLook.copy(look);first=false;}
      camPos.lerp(car.position.clone().add(offset),1-Math.exp(-dt*3));camLook.lerp(look,1-Math.exp(-dt*3.5));
      camera.position.copy(camPos);camera.lookAt(camLook);
      snapToTexels(sun.target.position.copy(car.position).addScaledVector(frame.t,14),SUN,76/sun.shadow.mapSize.x);sun.position.copy(sun.target.position).addScaledVector(SUN,90);
      riverUniforms.uTime.value=time;poolUniforms.uTime.value=time;particleUniforms.uTime.value=time;swayTime.value=time;updateAnimals(step,time,car.position);
      // The geyser goes off when the wagon pulls up at the last sign, when clicked, and now and then on its own.
      // The geyser goes off as the wagon closes on the last sign (before it stops), so the eruption has time to play
      // before the page moves on.
      const approaching=q>STATIONS.length-1.6&&!reduced;if(approaching&&!arrived)geyser.wait=Math.min(geyser.wait,.05);arrived=approaching;
      if(geyser.t<0){geyser.wait-=step;if(geyser.wait<=0)erupt();}
      else{geyser.t+=step;if(geyser.t>7){geyser.t=-1;geyser.wait=20+rng()*10;}}
      particleUniforms.uPower.value=geyser.t<0?0:smooth(geyser.t/.8)*(1-smooth((geyser.t-4.5)/2.5));
      applyView();renderer.render(scene,camera);
    }
    let snap=true,wasLive=false;
    function draw(){raf=requestAnimationFrame(draw);const dt=Math.min(clock.getDelta(),.05),live=onScreen()&&!document.hidden;if(live&&!wasLive)snap=true;wasLive=live;if(live&&!window.__roadHold){tick(dt);adapt(dt,state.current.live.length===1);}}
    draw();
    const readyTimer=setTimeout(()=>ready.current?.(),0);
    if(new URLSearchParams(window.location.search).has("debug"))window.__road={step:(n=30)=>{for(let i=0;i<n;i++)tick(1/30);},erupt,scene,camera,car,renderer,THREE};

    return()=>{
      clearTimeout(readyTimer);
      disposed=true;cancelAnimationFrame(raf);resize.disconnect();delete window.__road;
      canvas.removeEventListener("pointermove",onMove);canvas.removeEventListener("click",onClick);
      scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat())if(m){m.map?.dispose();m.dispose();}});
      signs.forEach(s=>s.userData.texture.dispose());renderer.dispose();canvas.remove();
    };
  },[state,skills]);
  return <div className="ht-road-canvas" ref={host} aria-hidden="true" />;
}
