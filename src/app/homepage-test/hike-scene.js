"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { random, createBearMaterial, bakeProp, createBird } from "./island-parts";
import { paintGeometry, createForestPine, createSpruce, createRoundTree, createAspen, createBush, createSnag, createTuft, createLupine, createPoppy, createSwayMaterial } from "./forest-parts";

// Experience as a hike: I climb a forested mountain on a switchback trail toward the snowy summit. It isn't
// scrubbed by scroll; I just keep walking, stopping now and then to drink or look out over the valley. A bear
// sometimes ambles by on the slope above (I stop and wave), a mountain lion peeks out from behind a tree, a squirrel
// runs up a trunk, a rabbit bolts, birds pass over. The camera watches from the side, out over the valley, leaning
// toward the pointer; the career column sits on the left. Sun shafts slant through a mixed fall forest and the grass
// moves in the wind.
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
const PEAK=46,BASE=96;
const coneHeight=(x,z)=>{const r=Math.hypot(x,z);return PEAK*Math.pow(Math.max(0,1-r/BASE),1.3)+(1.8*Math.sin(x*.13+z*.07)*Math.cos(z*.11-x*.05)+.8*Math.sin(x*.31+1)*Math.sin(z*.27))*smooth(r/14);};
// The trail: switchbacks up the face of the mountain toward the camera. It traverses the slope one way, makes a
// U-turn and traverses back a little higher, eight legs in all, then a last climb to the summit. The stream runs
// down the middle of the face, so every leg crosses it on a plank bridge.
const FACE=.6,SECTOR=.6,LEGS=8;
const LEAD=Array.from({length:6},(_,i)=>{const r=104-i*5.3,a=FACE-SECTOR-.5+i*.1;return new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r);});
const TRAIL=new THREE.CatmullRomCurve3([...LEAD,...Array.from({length:LEGS*36+1},(_,i)=>{const u=i/36,r=72-62*u/LEGS,a=FACE-SECTOR*Math.cos(Math.PI*u);return new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r);}),new THREE.Vector3(Math.cos(FACE+SECTOR)*6,0,Math.sin(FACE+SECTOR)*6),new THREE.Vector3(Math.cos(FACE)*2.5,0,Math.sin(FACE)*2.5)]);
const STREAM=new THREE.CatmullRomCurve3(Array.from({length:24},(_,i)=>{const t=i/23,r=20+t*82,a=FACE+.12+.1*Math.sin(t*9);return new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r);}));
const WALK=1.2,START=26,BRIDGE=2.4,DECK=.32;

// The couple are chibi characters with no rig, so they walk in the vertex shader: the legs (below the hips) swing
// from the hip, the stubby arms swing from the shoulder and can be lifted (forward to drink, out to the side to
// wave), and the whole body bobs. Positions are in the model's own unit-height space, facing +z.
const HIP=.29,SHOULDER=new THREE.Vector2(.15,.42);
function createChibiMaterial(source) {
  const map=source.map;if(map){map.magFilter=THREE.NearestFilter;map.minFilter=THREE.NearestFilter;map.colorSpace=THREE.SRGBColorSpace;}
  const material=new THREE.MeshStandardMaterial({map,flatShading:true,roughness:.9});
  // The shadow pass uses its own material, posed the same way, so the shadows walk too.
  const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});
  const uniforms={uPhase:{value:0},uSwing:{value:0},uBob:{value:0},uArmA:{value:new THREE.Vector2()},uArmB:{value:new THREE.Vector2()}};
  material.onBeforeCompile=depth.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader=shader.vertexShader.replace("#include <common>",`#include <common>
      uniform float uPhase,uSwing,uBob;uniform vec2 uArmA,uArmB;
      vec3 rotX(vec3 p,vec3 c,float a){p-=c;float s=sin(a),k=cos(a);return c+vec3(p.x,p.y*k-p.z*s,p.y*s+p.z*k);}
      vec3 rotZ(vec3 p,vec3 c,float a){p-=c;float s=sin(a),k=cos(a);return c+vec3(p.x*k-p.y*s,p.x*s+p.y*k,p.z);}`)
      .replace("#include <begin_vertex>",`#include <begin_vertex>
        float side=transformed.x>0.?1.:-1.,step=sin(uPhase+(side>0.?0.:3.14159));
        if(transformed.y<${HIP}){transformed=rotX(transformed,vec3(0.,${HIP},0.),step*uSwing);}
        else if(abs(transformed.x)>${SHOULDER.x}&&transformed.y<.45){
          vec3 shoulder=vec3(side*${SHOULDER.x},${SHOULDER.y},0.);vec2 lift=side>0.?uArmA:uArmB;
          transformed=rotZ(transformed,shoulder,side*(lift.y-.62));
          transformed=rotX(transformed,shoulder,-step*uSwing*1.25-lift.x);
        }
        transformed.y+=uBob;`);
  };
  return {material,depth,uniforms};
}

export default function HikeScene({ state, altitude }) {
  const host=useRef(null);
  useEffect(()=>{
    const mount=host.current;
    let renderer,disposed=false,raf=0;
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"}); } catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    const preference=matchMedia("(prefers-reduced-motion: reduce)"),lite=matchMedia("(pointer: coarse)").matches;
    const onScreen=()=>state.current.live.includes(3);
    const scene=new THREE.Scene();scene.fog=new THREE.Fog("#dfe5d3",24,135);
    const camera=new THREE.PerspectiveCamera(36,1,.1,600);scene.add(camera);
    const rng=random(31),swayTime={value:0};

    // Morning light: a warm sun low over the shoulder of the mountain, a soft green-blue fill.
    scene.add(new THREE.HemisphereLight("#f1f3ff","#5d6a44",1.35));
    const fill=new THREE.DirectionalLight("#b3c0ff",.75);fill.position.set(40,25,-30);scene.add(fill);
    const SUN=new THREE.Vector3(-.7,.75,.35).normalize(),sun=new THREE.DirectionalLight("#ffd9a0",3.6);
    sun.castShadow=true;sun.shadow.mapSize.setScalar(lite?1024:2048);sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;sun.shadow.radius=4;
    Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:160});sun.shadow.camera.updateProjectionMatrix();scene.add(sun,sun.target);

    // Trail and stream, sampled for distance tests; the trail is benched into the slope and its height smoothed so
    // the hiker climbs steadily.
    const trailLength=TRAIL.getLength(),trailPoints=TRAIL.getSpacedPoints(1400),streamPoints=STREAM.getSpacedPoints(400);
    const raw=trailPoints.map(p=>coneHeight(p.x,p.z));
    trailPoints.forEach((p,i)=>{let sum=0,n=0;for(let k=-26;k<=26;k++){const j=THREE.MathUtils.clamp(i+k,0,raw.length-1);sum+=raw[j];n++;}p.y=sum/n;});
    // Distance (and nearest sample) to the trail and the stream, precomputed on a half-unit grid out to 10 units.
    const distanceField=points=>{
      const N=500,dist=new Float32Array(N*N).fill(10),near=new Int32Array(N*N);
      points.forEach((p,i)=>{const cx=Math.round((p.x+125)*2),cz=Math.round((p.z+125)*2);
        for(let dz=-20;dz<=20;dz++)for(let dx=-20;dx<=20;dx++){const x=cx+dx,z=cz+dz;if(x<0||z<0||x>=N||z>=N)continue;const k=z*N+x,d=Math.hypot(x/2-125-p.x,z/2-125-p.z);if(d<dist[k]){dist[k]=d;near[k]=i;}}});
      return (x,z)=>{const gx=Math.round((x+125)*2),gz=Math.round((z+125)*2);if(gx<0||gz<0||gx>=N||gz>=N)return [10,0];const k=gz*N+gx;return [dist[k],near[k]];};
    };
    const trailField=distanceField(trailPoints),streamField=distanceField(streamPoints);
    const nearestOn=(points,x,z)=>(points===trailPoints?trailField:streamField)(x,z);
    const heightAt=(x,z)=>{
      let h=coneHeight(x,z);
      const [ds]=streamField(x,z);h-=.7*smooth(1-ds/2.2);
      const [dt,at]=trailField(x,z);h+=(trailPoints[at].y-h)*smooth(1-(dt-1.4)/2.6);
      return h;
    };
    const trailAt=(s,out=new THREE.Vector3())=>{const u=THREE.MathUtils.clamp(s/trailLength,0,1),i=u*(trailPoints.length-1),k=Math.min(trailPoints.length-2,Math.floor(i));return out.lerpVectors(trailPoints[k],trailPoints[k+1],i-k);};
    const here=new THREE.Vector3(),ahead=new THREE.Vector3(),tangent=new THREE.Vector3(),outward=new THREE.Vector3();
    function trailFrame(s){trailAt(s,here);trailAt(s+.6,ahead);tangent.subVectors(ahead,here).setY(0).normalize();outward.set(here.x,0,here.z).normalize();}

    // Things I can step onto (bridge decks, log steps): a ray cast down at my feet finds their top.
    const walkables=[],footRay=new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(0,-1,0),0,3);
    // The mountain: grass and meadow below, forest floor, grey rock and a snow cap; a dirt trail ribbon on top.
    {
      const g=new THREE.PlaneGeometry(250,250,190,190).rotateX(-Math.PI/2),pos=g.attributes.position;
      for(let i=0;i<pos.count;i++)pos.setY(i,heightAt(pos.getX(i),pos.getZ(i)));
      g.computeVertexNormals();
      const meadow=new THREE.Color("#8cbf5a"),lush=new THREE.Color("#5f9a45"),rock=new THREE.Color("#8a8d93"),snow=new THREE.Color("#f4f6fb"),bank=new THREE.Color("#7c7158"),c=new THREE.Color(),colors=new Float32Array(pos.count*3),normal=g.attributes.normal;
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),steep=1-normal.getY(i),n=Math.sin(x*.4+z*.3)*.5+.5;
        c.copy(meadow).lerp(lush,smooth((y-3)/10)*.8+n*.15).lerp(rock,smooth((y-27+steep*18+n*4)/6)).lerp(snow,smooth((y-37+n*3)/3));
        if(nearestOn(streamPoints,x,z)[0]<2.6)c.lerp(bank,.5);
        colors.set([c.r,c.g,c.b],i*3);
      }
      g.setAttribute("color",new THREE.BufferAttribute(colors,3));
      const ground=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1}));ground.receiveShadow=true;scene.add(ground);
      // Trail ribbon.
      const positions=[],index=[],side=new THREE.Vector3(),tan=new THREE.Vector3();
      const ribbon=trailPoints.filter((_,i)=>i%3===0);
      ribbon.forEach((p,i)=>{tan.subVectors(ribbon[Math.min(i+1,ribbon.length-1)],ribbon[Math.max(i-1,0)]).setY(0).normalize();side.set(-tan.z,0,tan.x);
        const w=1.05+.15*Math.sin(i*.7);positions.push(p.x-side.x*w,heightAt(p.x-side.x*w,p.z-side.z*w)+.06,p.z-side.z*w,p.x+side.x*w,heightAt(p.x+side.x*w,p.z+side.z*w)+.06,p.z+side.z*w);if(i)index.push(i*2-2,i*2-1,i*2,i*2-1,i*2+1,i*2);});
      const trail=new THREE.BufferGeometry();trail.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));trail.setIndex(index);trail.computeVertexNormals();
      const path=new THREE.Mesh(trail,new THREE.MeshStandardMaterial({color:"#d6a77a",roughness:1}));path.receiveShadow=true;scene.add(path);
      // Log steps where it climbs steeply, and plank bridges where it crosses the stream.
      const steps=[],planks=[],rails=[];
      for(let i=18;i<trailPoints.length-6;i+=12){const a=trailPoints[i],b=trailPoints[i+6],climb=(b.y-a.y)/Math.max(.01,Math.hypot(b.x-a.x,b.z-a.z));
        if(nearestOn(streamPoints,a.x,a.z)[0]>=BRIDGE&&climb>.16)steps.push([a,b]);}
      // Plank bridges: a continuous deck wherever the trail crosses the stream, with log rails along both sides.
      for(let i=1;i<trailPoints.length-1;i++){const a=trailPoints[i];if(nearestOn(streamPoints,a.x,a.z)[0]>=BRIDGE)continue;
        if(i%2===0)planks.push([a,trailPoints[i+1]]);if(i%3===0)rails.push([a,trailPoints[i+1]]);}
      const d=new THREE.Object3D(),wood=new THREE.MeshStandardMaterial({color:"#7a4b2b",flatShading:true,roughness:1});
      const place=(list,geometry,lift)=>{const mesh=new THREE.InstancedMesh(geometry,wood,list.length);list.forEach(([a,b],i)=>{d.position.set(a.x,a.y+lift,a.z);d.rotation.set(0,Math.atan2(b.x-a.x,b.z-a.z)+Math.PI/2,0);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);});mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);walkables.push(mesh);return mesh;};
      place(steps,new THREE.BoxGeometry(2.3,.14,.18),.08);place(planks,new THREE.BoxGeometry(2.5,.1,.34),DECK-.05);
      // Rails: short log segments along each edge of the deck.
      {const mesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(.06,.06,1.1,6).rotateX(Math.PI/2),wood,rails.length*2);rails.forEach(([a,b],i)=>{const yaw=Math.atan2(b.x-a.x,b.z-a.z);
        for(const side of [-1,1]){d.position.set(a.x+Math.cos(yaw)*side*1.18,a.y+DECK+.42,a.z-Math.sin(yaw)*side*1.18);d.rotation.set(0,yaw,0);d.updateMatrix();mesh.setMatrixAt(i*2+(side>0?1:0),d.matrix);}});
        mesh.castShadow=true;scene.add(mesh);}
    }
    // The stream: flowing water down its gully.
    const waterUniforms={uTime:{value:0}};
    {
      const positions=[],uvs=[],index=[];let length=0;
      streamPoints.forEach((p,i)=>{if(i)length+=p.distanceTo(streamPoints[i-1]);const n=streamPoints[Math.min(i+1,streamPoints.length-1)].clone().sub(streamPoints[Math.max(i-1,0)]).normalize(),w=.9+.25*Math.sin(i*.3),sx=-n.z*w,sz=n.x*w;
        positions.push(p.x-sx,heightAt(p.x-sx,p.z-sz)+.12,p.z-sz,p.x+sx,heightAt(p.x+sx,p.z+sz)+.12,p.z+sz);uvs.push(0,length,1,length);if(i)index.push(i*2-2,i*2-1,i*2,i*2-1,i*2+1,i*2);});
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));g.setIndex(index);
      scene.add(new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:waterUniforms,transparent:true,depthWrite:false,
        vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`varying vec2 vUv;uniform float uTime;void main(){float across=abs(vUv.x-.5)*2.;float f=fract(vUv.y*.5-uTime*.9+sin(vUv.x*7.+vUv.y*.8)*.1);
          vec3 c=mix(vec3(.3,.6,.68),vec3(.62,.86,.88),1.-across)+smoothstep(0.,.05,f)*smoothstep(.14,.06,f)*.3;
          gl_FragColor=vec4(c,.9*smoothstep(1.,.75,across));
          #include <colorspace_fragment>
        }`})));
    }

    // Forest: a mixed wood, thick on the lower slopes and thinning toward the treeline: tall pines, slim spruces,
    // round leafy trees, the island kit's autumn trees and birches by the trail, and snags. Clear of the trail, the
    // stream and the camera's path out over the valley, except a few trees that sometimes sweep across the lens.
    const treeSpots=[],fallSpots=[];
    const cameraPath=trailPoints.filter((_,i)=>i%4===0).map(p=>{const o=new THREE.Vector3(p.x,0,p.z).normalize();return new THREE.Vector3(p.x+o.x*11.5,p.y+3.6,p.z+o.z*11.5);}),cameraField=distanceField(cameraPath);
    {
      const pines=[],spruces=[],rounds=[],aspens=[],snags=[],fall=[],grid=lite?2.8:1.9;
      for(let x=-120;x<120;x+=grid)for(let z=-120;z<120;z+=grid){
        const px=x+(rng()-.5)*grid*.9,pz=z+(rng()-.5)*grid*.9,r=Math.hypot(px,pz);if(r>118)continue;
        const y=coneHeight(px,pz),dense=1-smooth((y-15)/15);if(rng()>dense*.92)continue;
        const [dt,at]=nearestOn(trailPoints,px,pz);if(dt<2.6||nearestOn(streamPoints,px,pz)[0]<2.3)continue;
        // Packed close along the trail, thinner further off (where it's mostly hidden anyway).
        if(dt>9.5&&rng()<.45)continue;
        // Right by the trail on the valley side only the odd tree, so one sometimes sweeps across the frame.
        const t=trailPoints[at],side=((px-t.x)*t.x+(pz-t.z)*t.z)/Math.max(1,Math.hypot(t.x,t.z));const front=side>2.5;if(front&&(side>4.6||rng()>.12))continue;
        const h=heightAt(px,pz),pick=rng();let size=(6+rng()*5)*(1-y/PEAK*.45);
        // Under the camera's path, trees stay below the lens.
        const [dc,ci]=cameraField(px,pz);if(dc<4){const room=cameraPath[ci].y-1.2-h;if(room<2.5)continue;size=Math.min(size,room);}
        if(front){spruces.push([px,h,pz,Math.min(size,7)]);treeSpots.push(new THREE.Vector3(px,h,pz));continue;}
        if(y<18&&pick<.16&&dt<14&&fall.length<160&&size>=4)fall.push([px,h,pz,Math.min(size,4+rng()*3),pick<.08?0:1]);
        else if(pick<.36&&y<20)(pick<.24?rounds:aspens).push([px,h,pz,Math.min(size,pick<.24?3.5+rng()*2.5:5+rng()*3)]);
        else if(pick<.5)spruces.push([px,h,pz,size*1.1]);
        else (pick>.95?snags:pines).push([px,h,pz,size]);
        treeSpots.push(new THREE.Vector3(px,h,pz));
      }
      const pineMaterial=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.95});
      pineMaterial.onBeforeCompile=shader=>{shader.uniforms.uTime=swayTime;shader.vertexShader=shader.vertexShader.replace("#include <common>","#include <common>\nuniform float uTime;").replace("#include <begin_vertex>",`#include <begin_vertex>
        vec3 root=vec3(instanceMatrix[3]);float gust=.55+.45*sin(uTime*.55-(root.x+root.z)*.06);float k=transformed.y*transformed.y*(.5+gust);transformed.x+=sin(uTime*.9+root.x*.13+root.z*.1)*.026*k;transformed.z+=cos(uTime*.7+root.z*.12)*.014*k;`);};
      const place=(geometry,spots,material,tint)=>{const mesh=new THREE.InstancedMesh(geometry,material,spots.length),d=new THREE.Object3D(),c=new THREE.Color();
        spots.forEach(([x,y,z,h],i)=>{d.position.set(x,y-.15,z);d.rotation.set(0,rng()*6,0);d.scale.set(h*(.85+rng()*.3),h,h*(.85+rng()*.3));d.updateMatrix();mesh.setMatrixAt(i,d.matrix);
          mesh.setColorAt(i,tint?c.setHSL(.27+rng()*.08,.3+rng()*.25,.75+rng()*.25).lerp(new THREE.Color("#ffffff"),.35):c.set("#ffffff"));});
        mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);};
      place(createForestPine(rng),pines,pineMaterial,true);place(createSpruce(rng),spruces,pineMaterial,true);
      // Round trees in green and fall colours, and golden aspens.
      const leafy=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.95});leafy.onBeforeCompile=pineMaterial.onBeforeCompile;
      [["#a3c457","#8fb64e"],["#f0c03c","#dba12a"],["#ea8a2e","#d06a22"],["#c9452c","#a8361f"]].forEach((colors,k)=>place(createRoundTree(rng,colors),rounds.filter((_,i)=>i%4===k),leafy,false));
      place(createAspen(rng),aspens,leafy,false);
      for(const [x,y,z,h] of [...aspens,...rounds.filter((_,i)=>i%4)])fallSpots.push(new THREE.Vector3(x,y+h*.6,z));place(createSnag(),snags,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1}),false);
      new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load("/models/island/kit.glb",gltf=>{
        if(disposed)return;
        const find=prefix=>{let hit=null;gltf.scene.traverse(o=>{if(!hit&&o.name.startsWith(prefix))hit=o;});return hit;};
        ["CommonTree_Autumn","BirchTree"].forEach((name,kind)=>{const node=find(name);if(!node)return;node.position.set(0,0,0);const g=bakeProp(node);g.translate(0,-g.boundingBox.min.y,0);g.computeBoundingBox();const h=g.boundingBox.max.y;
          place(g,fall.filter(f=>f[4]===kind).map(([x,y,z,size])=>[x,y,z,size/h]),new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.95}),false);});
      },undefined,()=>{});
      // Undergrowth: grass everywhere below the rocks, California poppies in drifts by the trail, lupine, boulders.
      const scatter=(geometry,count,near,scale)=>{const mesh=new THREE.InstancedMesh(geometry,createSwayMaterial(swayTime),count),d=new THREE.Object3D();let n=0;
        for(let k=0;k<count*5&&n<count;k++){
          let x,z;if(near){const p=trailPoints[Math.floor(rng()*trailPoints.length)],a=rng()*6.28,r=1.3+rng()*near;x=p.x+Math.cos(a)*r;z=p.z+Math.sin(a)*r;}else{const a=rng()*6.28,r=Math.sqrt(rng())*110;x=Math.cos(a)*r;z=Math.sin(a)*r;}
          const y=coneHeight(x,z);if(y>30||nearestOn(trailPoints,x,z)[0]<1.25||nearestOn(streamPoints,x,z)[0]<1.4)continue;
          d.position.set(x,heightAt(x,z)-.02,z);d.rotation.y=rng()*6;d.scale.setScalar(scale*(.7+rng()*.6));d.updateMatrix();mesh.setMatrixAt(n++,d.matrix);}
        mesh.count=n;mesh.receiveShadow=true;scene.add(mesh);};
      const k=lite?.55:1;
      scatter(createTuft(rng),Math.round(7000*k),0,1.1);scatter(createTuft(rng),Math.round(4000*k),5,1.1);
      scatter(createPoppy(),Math.round(1800*k),4,1.9);
      // Lush ground cover along the trail.
      scatter(createBush(rng),Math.round(2600*k),7,.75);
      // Pebbles on the path.
      {const pebbles=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0).scale(1,.55,.85),new THREE.MeshStandardMaterial({color:"#c8c2b8",flatShading:true,roughness:1}),Math.round(1400*k)),d=new THREE.Object3D();
        for(let i=0;i<pebbles.count;i++){const p=trailPoints[Math.floor(rng()*trailPoints.length)],a=rng()*6.28,r=rng()*1.05,x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r,sz=.04+rng()*rng()*.14;
          d.position.set(x,heightAt(x,z)+.06,z);d.rotation.set(rng(),rng()*6,0);d.scale.setScalar(sz);d.updateMatrix();pebbles.setMatrixAt(i,d.matrix);}
        pebbles.receiveShadow=true;scene.add(pebbles);}
      // Fallen logs beside the trail.
      {const logs=new THREE.InstancedMesh(new THREE.CylinderGeometry(.22,.26,1,7).rotateZ(Math.PI/2),new THREE.MeshStandardMaterial({color:"#6a4630",flatShading:true,roughness:1}),18),d=new THREE.Object3D();
        for(let i=0;i<logs.count;i++){const s0=START+(i+.5)/logs.count*(trailLength-START);trailFrame(s0);const side=i%3?-2.2-rng()*2:2.4,x=here.x+outward.x*side,z=here.z+outward.z*side;
          d.position.set(x,heightAt(x,z)+.18,z);d.rotation.set(0,Math.atan2(tangent.x,tangent.z)+Math.PI/2+(rng()-.5)*1.2,(rng()-.5)*.15);d.scale.set(3+rng()*3,1,1);d.updateMatrix();logs.setMatrixAt(i,d.matrix);}
        logs.castShadow=logs.receiveShadow=true;scene.add(logs);}scatter(createLupine(),Math.round(500*k),6,.9);
      const rocks=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0).scale(1,.7,.9),new THREE.MeshStandardMaterial({color:"#7f818c",flatShading:true,roughness:1}),220),d=new THREE.Object3D();let n=0;
      for(let i=0;i<2000&&n<220;i++){const a=rng()*6.28,r=Math.sqrt(rng())*100,x=Math.cos(a)*r,z=Math.sin(a)*r;if(nearestOn(trailPoints,x,z)[0]<1.6)continue;
        const s=.25+rng()*rng()*(coneHeight(x,z)>24?2.4:1.2);d.position.set(x,heightAt(x,z)+s*.1,z);d.rotation.set(rng(),rng()*6,rng()*.4);d.scale.setScalar(s);d.updateMatrix();rocks.setMatrixAt(n++,d.matrix);}
      rocks.count=n;rocks.castShadow=rocks.receiveShadow=true;scene.add(rocks);
    }
    // The summit: a stone cairn and a little flag.
    const summit=trailAt(trailLength);let summitFlag=null;
    {
      const stones=new THREE.Group(),stone=new THREE.MeshStandardMaterial({color:"#9a9ca5",flatShading:true,roughness:1});
      [[.55,.3],[.42,.75],[.3,1.1],[.2,1.35]].forEach(([s,y],i)=>{const m=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0).scale(1,.65,1),stone);m.position.set(Math.sin(i)*.08,y,0);m.rotation.y=i;m.castShadow=true;stones.add(m);});
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,2.2,5),new THREE.MeshStandardMaterial({color:"#5a4030"}));pole.position.set(0,2.4,0);stones.add(pole);
      const flag=new THREE.Mesh(new THREE.PlaneGeometry(.7,.42,6,1).translate(.35,0,0),new THREE.MeshStandardMaterial({color:"#a78bfa",side:THREE.DoubleSide}));flag.position.set(.03,3.25,0);stones.add(flag);stones.userData.flag=flag;
      stones.position.set(summit.x+1.8,heightAt(summit.x+1.8,summit.z),summit.z+1.2);scene.add(stones);
      summitFlag=flag;
    }

    // Sun shafts: soft additive beams slanting down through the canopy around the hiker, breathing slowly. They
    // travel with the hiker.
    const glow=new THREE.Group();scene.add(glow);
    const rayUniforms={uTime:{value:0}};
    const rayMaterial=new THREE.ShaderMaterial({uniforms:rayUniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying vec2 vUv;uniform float uTime;uniform float uSeed;void main(){
        float edge=smoothstep(0.,.5,vUv.x)*smoothstep(1.,.5,vUv.x),fall=smoothstep(0.,.35,vUv.y)*smoothstep(1.,.6,vUv.y);
        float breathe=.6+.4*sin(uTime*.5+uSeed*6.)*sin(uTime*.23+uSeed*3.);
        gl_FragColor=vec4(vec3(1.,.88,.62)*edge*fall*breathe*.16,1.);}`});
    for(let i=0;i<9;i++){
      const beam=new THREE.Group(),m=rayMaterial.clone();m.uniforms={uTime:rayUniforms.uTime,uSeed:{value:rng()}};
      for(const turn of [0,Math.PI/2]){const plane=new THREE.Mesh(new THREE.PlaneGeometry(1.4+rng()*1.8,26),m);plane.rotation.y=turn;beam.add(plane);}
      beam.position.set((rng()-.5)*30,7,(rng()-.5)*30);beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),SUN);beam.renderOrder=5;glow.add(beam);
    }
    // A black veil in front of the lens, for the fade when the hike starts over.
    const veil=new THREE.Mesh(new THREE.PlaneGeometry(10,10),new THREE.MeshBasicMaterial({color:"#0b0a10",transparent:true,opacity:1,depthTest:false,depthWrite:false}));
    veil.position.z=-.5;veil.renderOrder=999;camera.add(veil);

    // The hiker: me ("Low Poly Characters (PACK)" by micaelsampaio, CC BY 4.0). Now and then I stop for a drink from
    // a water bottle or to look out over the valley.
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const makeWalker=(height,lag,lateral)=>({root:new THREE.Group(),height,lag,lateral,chibi:null,phase:rng()*6,swing:0,bob:0,yaw:0,armA:new THREE.Vector2(),armB:new THREE.Vector2(),bottle:null});
    const him=makeWalker(1.3,0,0),walkers=[him];
    const hiker={root:him.root,s:START,state:"walk",timer:0,nextStop:16+rng()*16,look:0,drinker:him};
    for(const w of walkers){scene.add(w.root);w.root.visible=false;}
    loader.load("/models/island/hiker.glb",gltf=>{
      if(disposed)return;
      for(const [w,name] of [[him,"him"]]){
        const node=gltf.scene.getObjectByName(name);if(!node)continue;
        node.traverse(o=>{if(!o.isMesh)return;
          // Bake the node's dequantizing transform into plain float positions, so the walk shader sees the unit-height
          // model space (feet at 0, head at 1).
          const pos=o.geometry.attributes.position,flat=new Float32Array(pos.count*3);for(let i=0;i<pos.count;i++)flat.set([pos.getX(i),pos.getY(i),pos.getZ(i)],i*3);
          o.updateMatrix();o.geometry.setAttribute("position",new THREE.BufferAttribute(flat,3));o.geometry.applyMatrix4(o.matrix);o.position.set(0,0,0);o.quaternion.identity();o.scale.set(1,1,1);
          w.chibi=createChibiMaterial(o.material);o.material=w.chibi.material;o.customDepthMaterial=w.chibi.depth;o.castShadow=true;o.frustumCulled=false;});
        // (The node's own scale and offset carry the mesh quantization, so size it with a wrapper.)
        const body=new THREE.Group();body.scale.setScalar(w.height);body.add(node);w.root.add(body);w.root.visible=true;
        const bottle=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.2,8),new THREE.MeshStandardMaterial({color:"#4fb3c9",roughness:.35}));bottle.visible=false;w.root.add(bottle);w.bottle=bottle;
      }
    },undefined,()=>{});
    // Where a lifted hand is (to hold the bottle), matching the shader's arm pose.
    const handAt=(w,out)=>{const h=w.height,lift=w.armA;out.set(.29,.3,0).sub({x:SHOULDER.x,y:SHOULDER.y,z:0});
      const sz=Math.sin(lift.y-.62),cz=Math.cos(lift.y-.62);out.set(out.x*cz-out.y*sz,out.x*sz+out.y*cz,out.z);
      const a=-lift.x,sx=Math.sin(a),cx=Math.cos(a);out.set(out.x,out.y*cx-out.z*sx,out.y*sx+out.z*cx);
      return out.add({x:SHOULDER.x,y:SHOULDER.y,z:0}).multiplyScalar(h);};

    const gait=(who,swing,rate,dt)=>{if(!who.gait)return;who.phase+=dt*rate;const u=who.gait.uniforms;u.uSwing.value+=(swing-u.uSwing.value)*(1-Math.exp(-dt*5));u.uPhase.value=who.phase;u.uKnee.value=u.uSwing.value*1.1;u.uLift.value=u.uSwing.value*.05*u.uHeight.value;u.uNod.value=u.uSwing.value*.15;u.uBob.value=0;};

    let fade=1,restart=false;
    function updateHiker(dt){
      const h=hiker;let nearBear=null;
      if(h.state==="walk"){
        h.s+=WALK*dt;
        if(h.s>=trailLength-.5){h.s=trailLength-.5;h.state="summit";h.timer=11;}
        else if((nearBear=bearNear())&&h.waved!==nearBear){h.state="wave";h.timer=3.4;h.waved=nearBear;}
        else if(h.s>h.nextStop){h.state=rng()<.55?"drink":"look";h.timer=h.state==="drink"?3.8:4.5;h.drinker=him;h.nextStop=h.s+20+rng()*28;}
      }else{
        h.timer-=dt;
        if(h.timer<=0){if(h.state==="summit")restart=true;else h.state="walk";}
      }
      // Looking out: both turn toward the valley (the camera side) for a moment.
      h.look+=((h.state==="look"||h.state==="summit"?1:h.state==="wave"?.6:0)-h.look)*(1-Math.exp(-dt*2.5));
      const walking=h.state==="walk";
      for(const w of walkers){
        trailFrame(Math.max(0,h.s-w.lag));
        const x=here.x+outward.x*w.lateral,z=here.z+outward.z*w.lateral;
        const walkYaw=Math.atan2(tangent.x,tangent.z),outYaw=Math.atan2(outward.x,outward.z);
        const want=h.state==="wave"?Math.atan2(h.waved.root.position.x-x,h.waved.root.position.z-z):walkYaw+Math.atan2(Math.sin(outYaw-walkYaw),Math.cos(outYaw-walkYaw))*h.look;
        w.yaw+=Math.atan2(Math.sin(want-w.yaw),Math.cos(want-w.yaw))*(1-Math.exp(-dt*5));
        // Stride: quick little steps; a gentle bob; the summit is a happy hop.
        w.swing+=((walking?.55:0)-w.swing)*(1-Math.exp(-dt*6));w.phase+=dt*(walking?8.5:2);
        let bob=walking?Math.abs(Math.sin(w.phase))*.035:Math.sin(time*2+w.lag)*.006;
        if(h.state==="summit"&&h.timer>6)bob=Math.abs(Math.sin(time*7+w.lag*2))*.22;
        // Arms: waving (out to the side, hand wagging) at the bear and on the summit; the drinker lifts the bottle.
        const waving=h.state==="wave"||(h.state==="summit"&&h.timer>4),drinking=h.state==="drink"&&h.drinker===w;
        const tA=new THREE.Vector2(drinking?2.1+Math.sin(time*2)*.08:0,waving?2.5+Math.sin(time*11+w.lag)*.35:0),tB=new THREE.Vector2(0,h.state==="summit"&&h.timer>6?2.3+Math.sin(time*11)*.3:0);
        w.armA.lerp(tA,1-Math.exp(-dt*7));w.armB.lerp(tB,1-Math.exp(-dt*7));
        // Walk on the trail's own smoothed height profile (the bench), not the sampled terrain, so steps don't jolt.
        // Feet: on the trail, or on top of whatever deck or step a ray cast straight down hits; eased like a step.
        const trailY=w.lateral?heightAt(x,z):here.y+.02;footRay.ray.origin.set(x,trailY+1.5,z);
        const hit=footRay.intersectObjects(walkables,false)[0],footY=hit?Math.max(trailY,hit.point.y):trailY;
        w.footY=w.footY===undefined||Math.abs(w.footY-footY)>2?footY:w.footY+(footY-w.footY)*(1-Math.exp(-dt*14));
        w.root.position.set(x,w.footY,z);w.root.rotation.y=w.yaw;
        if(w.chibi){const u=w.chibi.uniforms;u.uPhase.value=w.phase;u.uSwing.value=w.swing;u.uBob.value=bob;u.uArmA.value.copy(w.armA);u.uArmB.value.copy(w.armB);}
        if(w.bottle){w.bottle.visible=w.armA.x>.6;if(w.bottle.visible){handAt(w,w.bottle.position);w.bottle.position.y+=bob;w.bottle.rotation.x=-w.armA.x+.3;}}
      }
    }
    // Residents: animals that live along the trail, placed once and always there, each going about its own business
    // and reacting as I pass. Deer, foxes and rabbits graze or nibble and move off a little way when I come close;
    // squirrels forage by a tree and run up the trunk; bears amble back and forth on the slope (I stop and wave);
    // mountain lions lean out from behind a tree to watch. Models reused from the island and the valley.
    const residents=[],models={};
    const hopTo=(root,from,to,k,hops,height)=>{root.position.lerpVectors(from,to,k);root.position.y=heightAt(root.position.x,root.position.z)+Math.abs(Math.sin(k*Math.PI*hops))*height;};
    const faceTo=(r,x,z,dt,rate=4)=>{const want=Math.atan2(x-r.root.position.x,z-r.root.position.z);r.yaw+=Math.atan2(Math.sin(want-r.yaw),Math.cos(want-r.yaw))*(1-Math.exp(-dt*rate));r.root.rotation.y=r.yaw;};
    const KINDS={deer:{file:"deer",height:1.45,skinned:true},fox:{file:"fox",height:.6,skinned:true},rabbit:{file:"rabbit",height:.42},squirrel:{file:"squirrel",height:.38},bear:{file:"bear",height:1.3,hip:.36},cougar:{file:"cougar",height:.92,hip:.4}};
    // Along the trail, alternating kinds; mostly on the slope above it, where the camera sees them.
    {
      const plan=["deer","rabbit","squirrel","fox","bear","rabbit","deer","squirrel","cougar","rabbit","deer","fox","squirrel","bear","rabbit","deer","cougar","squirrel","rabbit","fox"];
      const step=(trailLength-START-30)/plan.length;
      plan.forEach((kind,i)=>{
        const s0=START+12+i*step+(rng()-.5)*step*.4;trailFrame(s0);
        const up=kind==="bear"?-5.5:kind==="cougar"?-4:-(2.4+rng()*3.2);
        const count=kind==="deer"?2:1;
        for(let k=0;k<count;k++){
          const at=here.clone().addScaledVector(outward,up-k*1.6).addScaledVector(tangent,k*2.2);
          if(kind==="squirrel"||kind==="cougar"){const tree=treeSpots.filter(t=>Math.hypot(t.x-at.x,t.z-at.z)<5).sort((a,b)=>a.distanceTo(at)-b.distanceTo(at))[0];if(!tree)continue;at.copy(tree).addScaledVector(outward,kind==="cougar"?-1:.9);}
          const r={kind,root:new THREE.Group(),home:at.clone(),yaw:rng()*6,state:"idle",t:rng()*5,phase:rng()*6,trailS:s0,from:new THREE.Vector3(),to:new THREE.Vector3(),tree:at.clone(),tangent:tangent.clone(),outward:outward.clone()};
          r.root.position.set(at.x,heightAt(at.x,at.z),at.z);r.root.rotation.y=r.yaw;scene.add(r.root);residents.push(r);
        }
      });
      for(const [kind,spec] of Object.entries(KINDS))loader.load(`/models/island/${spec.file}.glb`,gltf=>{
        if(disposed)return;
        const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3()),scale=spec.height/size.y;
        residents.filter(r=>r.kind===kind).forEach((r,i)=>{
          const model=spec.skinned?cloneSkinned(gltf.scene):i?gltf.scene.clone():gltf.scene;
          model.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.frustumCulled=false;
            if(spec.hip){r.gait??=createBearMaterial(o.geometry,{hip:spec.hip});o.material=r.gait.material;}
            else if(!spec.skinned)o.material=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.95});});
          model.scale.setScalar(scale);model.position.set(-(box.min.x+box.max.x)/2*scale,-box.min.y*scale,-(box.min.z+box.max.z)/2*scale);r.root.add(model);
          if(spec.skinned){r.mixer=new THREE.AnimationMixer(model);r.actions={};for(const clip of gltf.animations)r.actions[clip.name]=r.mixer.clipAction(clip);r.current=null;r.mixer.update(rng()*3);}
        });
      },undefined,()=>{});
    }
    const playClip=(r,name)=>{if(!r.actions?.[name]||r.current===name)return;r.actions[name].reset().fadeIn(.35).play();r.actions[r.current]?.fadeOut(.35);r.current=name;};
    const bearNear=()=>residents.find(r=>r.kind==="bear"&&r.root.position.distanceTo(him.root.position)<8);
    function updateResidents(dt){
      const me=him.root.position;
      for(const r of residents){
        const p=r.root.position,d=Math.hypot(p.x-me.x,p.z-me.z);if(d>40)continue;
        r.t+=dt;
        if(r.kind==="deer"||r.kind==="fox"){
          // Graze; look up as I approach; then walk off up the slope a few paces and graze again.
          if(r.state==="idle"){playClip(r,r.t%9<6?"Eating":"Idle");if(d<(r.kind==="deer"?7:5.5)){r.state="alert";r.t=0;}}
          else if(r.state==="alert"){playClip(r,"Idle");faceTo(r,me.x,me.z,dt);if(r.t>1.6){r.state="move";r.t=0;r.from.copy(p);r.to.copy(p).addScaledVector(r.outward,-4.5).addScaledVector(r.tangent,(rng()-.5)*5);}}
          else if(r.state==="move"){playClip(r,"Walk");faceTo(r,r.to.x,r.to.z,dt,6);const k=Math.min(1,r.t/3.2);p.lerpVectors(r.from,r.to,k);p.y=heightAt(p.x,p.z);if(k>=1){r.state="settle";r.t=0;}}
          else if(r.state==="settle"){playClip(r,"Eating");if(d>14)r.state="idle";}
          r.mixer?.update(dt);
        }else if(r.kind==="rabbit"){
          // Nibble; hop off a few hops when I get close; nibble there.
          if(r.state!=="hop"){p.y=heightAt(p.x,p.z)+Math.max(0,Math.sin(time*9+r.phase))*.015;if(r.state==="idle"&&d<3.6){r.state="hop";r.t=0;r.from.copy(p);r.to.copy(p).addScaledVector(r.outward,-3.5).addScaledVector(r.tangent,(rng()-.5)*3);r.yaw=Math.atan2(r.to.x-p.x,r.to.z-p.z);r.root.rotation.y=r.yaw;}if(r.state==="rest"&&d>12)r.state="idle";}
          else{const k=Math.min(1,r.t/1.4);hopTo(r.root,r.from,r.to,k,4,.3);if(k>=1)r.state="rest";}
        }else if(r.kind==="squirrel"){
          // Forage in little hops by the tree; run up the trunk as I pass, come down once I'm gone.
          const ground=heightAt(r.tree.x,r.tree.z);
          if(r.state==="idle"){const a=r.phase+r.t*.6,x=r.tree.x+Math.cos(a)*1.1,z=r.tree.z+Math.sin(a)*1.1;p.set(x,heightAt(x,z)+Math.abs(Math.sin(r.t*5))*.08,z);r.yaw=a+Math.PI;r.root.rotation.set(0,r.yaw,0);if(d<5){r.state="up";r.t=0;}}
          else{const climb=r.state==="up"?Math.min(1,r.t/1.2):Math.max(0,1-r.t/1.5);p.set(r.tree.x,ground+climb*3,r.tree.z);r.root.rotation.set(-Math.PI/2*Math.min(1,climb*5),r.yaw,0);
            if(r.state==="up"&&d>12){r.state="down";r.t=0;}if(r.state==="down"&&climb<=0){r.state="idle";r.t=0;}}
        }else if(r.gait){
          const u=r.gait.uniforms;
          if(r.kind==="bear"){
            // Amble back and forth along the slope, slowly.
            const k=(Math.sin(r.t*.18+r.phase)+1)/2,x=r.home.x+r.tangent.x*(k-.5)*9,z=r.home.z+r.tangent.z*(k-.5)*9;
            const dir=Math.cos(r.t*.18+r.phase)>0?1:-1;r.yaw=Math.atan2(r.tangent.x*dir,r.tangent.z*dir);r.root.rotation.y=r.yaw;p.set(x,heightAt(x,z),z);
            r.phase2=(r.phase2||0)+dt*4.5;u.uPhase.value=r.phase2;u.uSwing.value=.4;u.uKnee.value=.44;u.uLift.value=.02*u.uHeight.value;u.uNod.value=.06;
          }else{
            // Lean out from behind the tree and back, watching me when I'm near.
            const k=smooth((Math.sin(r.t*.5+r.phase)+.3)*1.4);p.copy(r.tree).addScaledVector(r.tangent,k*.9);p.y=heightAt(p.x,p.z);
            if(d<12)faceTo(r,me.x,me.z,dt,3);u.uHeadDown.value=.12;u.uSwing.value=0;
          }
        }
      }
    }
    // Falling leaves: gold and orange leaves drifting down from the fall trees around me, fluttering as they go.
    const leafCount=lite?40:90,leaves=new THREE.InstancedMesh(new THREE.PlaneGeometry(.16,.1),new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:.8}),leafCount),leafState=[];
    {const tones=["#f2c443","#e0a92c","#ea8a2e","#d06a22","#c9452c"].map(c=>new THREE.Color(c));for(let i=0;i<leafCount;i++){leaves.setColorAt(i,tones[i%tones.length]);leafState.push({p:new THREE.Vector3(),v:0,spin:rng()*6,seed:rng()*20,life:-1});}
      leaves.frustumCulled=false;leaves.castShadow=true;scene.add(leaves);}
    const leafDummy=new THREE.Object3D();
    function updateLeaves(dt){
      const me=him.root.position,near=fallSpots.filter(t=>Math.abs(t.x-me.x)<18&&Math.abs(t.z-me.z)<18);
      leafState.forEach((l,i)=>{
        if(l.life<0){if(!near.length||rng()>dt*1.5){leafDummy.scale.setScalar(0);leafDummy.updateMatrix();leaves.setMatrixAt(i,leafDummy.matrix);return;}
          const t=near[Math.floor(rng()*near.length)];l.p.set(t.x+(rng()-.5)*2.4,t.y+rng()*1.5,t.z+(rng()-.5)*2.4);l.v=.5+rng()*.4;l.life=0;}
        l.life+=dt;l.p.y-=l.v*dt;l.p.x+=Math.sin(time*1.6+l.seed)*dt*.7+dt*.35;l.p.z+=Math.cos(time*1.3+l.seed)*dt*.5;
        if(l.p.y<heightAt(l.p.x,l.p.z)+.05||l.life>14){l.life=-1;}
        leafDummy.position.copy(l.p);leafDummy.rotation.set(time*2+l.seed,time*1.4+l.spin,Math.sin(time*3+l.seed)*.8);leafDummy.scale.setScalar(1);leafDummy.updateMatrix();leaves.setMatrixAt(i,leafDummy.matrix);
      });
      leaves.instanceMatrix.needsUpdate=true;
    }
    // Birds: a little flock always wheeling over the slope ahead of me, wings beating and gliding.
    const birds=[],flockCenter=new THREE.Vector3();
    {
      const birdMaterial=new THREE.MeshStandardMaterial({color:"#3b3442",flatShading:true,side:THREE.DoubleSide});
      for(let i=0;i<7;i++){const bird=createBird(birdMaterial);bird.scale.setScalar(1.7);Object.assign(bird.userData,{a:i/7*Math.PI*2,r:6+(i%3)*2.2,h:7+(i%4)*1.1,speed:.28+(i%5)*.04,flap:i*1.7});scene.add(bird);birds.push(bird);}
    }
    function updateBirds(dt){
      trailFrame(hiker.s);const target=new THREE.Vector3().copy(him.root.position).addScaledVector(outward,-6).add({x:0,y:4,z:0});
      if(!flockCenter.lengthSq())flockCenter.copy(target);flockCenter.lerp(target,1-Math.exp(-dt*.3));
      for(const b of birds){const u=b.userData;u.a+=dt*u.speed;const x=flockCenter.x+Math.cos(u.a)*u.r*1.6,z=flockCenter.z+Math.sin(u.a)*u.r,y=flockCenter.y+u.h+Math.sin(u.a*2)*.6;
        b.position.set(x,y,z);b.rotation.set(0,Math.atan2(-Math.sin(u.a)*1.6,Math.cos(u.a))+Math.PI/2,Math.sin(u.a)*.25);
        const glide=Math.sin(time*.7+u.flap)>.3,flap=glide?.12:Math.sin(time*10+u.flap)*.6;b.userData.wings[0].rotation.z=flap;b.userData.wings[1].rotation.z=-flap;}
    }

    // Framing: the camera sits out over the valley from the hiker, a little behind and above, and looks at him; the
    // view is offset so he stands right of centre (lower on a phone, under the text).
    const camDir=new THREE.Vector3(),camLook=new THREE.Vector3();let first=true,tall=false,camY=0;
    // The camera leans a little toward the pointer, like on the prairie (window-wide: the career column sits on top).
    const pointer=new THREE.Vector2(),lean=new THREE.Vector2();
    const onPointer=event=>{if(event.pointerType==="mouse")pointer.set(event.clientX/window.innerWidth*2-1,-(event.clientY/window.innerHeight)*2+1);};
    window.addEventListener("pointermove",onPointer,{passive:true});
    function frameSize(){const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;tall=camera.aspect<.85;camera.fov=tall?50:36;
      if(tall)camera.setViewOffset(w,h*1.5,0,0,w,h);else camera.setViewOffset(w*1.32,h*1.1,0,0,w,h);camera.updateProjectionMatrix();
}
    const resize=new ResizeObserver(frameSize);resize.observe(mount);frameSize();

    let time=0;const clock=new THREE.Clock();
    function tick(dt){
      const reduced=preference.matches,step=reduced?0:dt;time+=step;
      if(!reduced){updateHiker(dt);updateResidents(dt);updateBirds(dt);updateLeaves(dt);}else{updateHiker(0);}
      // Start over after the summit: fade to black, back to the trailhead, fade in.
      if(restart){fade=Math.min(1,fade+dt*.8);if(fade>=1){restart=false;hiker.s=START;hiker.waved=null;hiker.state="walk";hiker.nextStop=16+rng()*16;first=true;camY=0;}}
      else fade=Math.max(0,fade-dt*.7);
      veil.material.opacity=fade;veil.visible=fade>.001;
      const p=hiker.root.position;trailFrame(hiker.s);
      // Locked on me: I stay put in the frame (right of centre, clear of the career column) and the world moves around me. The camera sits out over the
      // valley, square to the slope; only its viewing direction eases round as the trail turns.
      if(first){camDir.copy(outward);first=false;}
      camDir.lerp(outward,1-Math.exp(-dt*1.2)).normalize();
      lean.lerp(reduced?pointer.set(0,0):pointer,1-Math.exp(-dt*2.5));
      const side=new THREE.Vector3(-camDir.z,0,camDir.x);
      // Height eases (the climb is gentle anyway); side to side stays locked.
      camY=first===false&&camY?camY+(p.y-camY)*(1-Math.exp(-dt*2.5)):p.y;
      camLook.set(p.x,camY+.9,p.z);
      camera.position.copy(camLook).addScaledVector(camDir,tall?13:11.5).add({x:0,y:tall?4:2.8+lean.y*.8,z:0}).addScaledVector(side,lean.x*1.4);
      camera.lookAt(camLook);
      sun.target.position.copy(p);sun.position.copy(p).addScaledVector(SUN,80);
      glow.position.set(p.x,p.y,p.z);
      swayTime.value=time;waterUniforms.uTime.value=time;rayUniforms.uTime.value=time;
      if(summitFlag){const pos=summitFlag.geometry.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i);pos.setZ(i,Math.sin(time*6-x*8)*.06*x);}pos.needsUpdate=true;}
      if(altitude?.current)altitude.current.textContent=`${Math.round(4200+p.y/PEAK*5600).toLocaleString("en-US")} ft`;
      renderer.render(scene,camera);
    }
    function draw(){raf=requestAnimationFrame(draw);const dt=Math.min(clock.getDelta(),.05);if(onScreen()&&!document.hidden&&!window.__hikeHold)tick(dt);}
    draw();
    if(new URLSearchParams(window.location.search).has("debug"))window.__hike={step:(n=30)=>{for(let i=0;i<n;i++)tick(1/30);},hiker,him,residents,walkables,trailPoints,trailLength,scene,camera,renderer,THREE};

    return()=>{
      disposed=true;cancelAnimationFrame(raf);resize.disconnect();delete window.__hike;window.removeEventListener("pointermove",onPointer);
      scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat())if(m){m.map?.dispose();m.dispose();}});
      renderer.dispose();renderer.domElement.remove();
    };
  },[state,altitude]);
  return <div className="ht-hike-canvas" ref={host} aria-hidden="true" />;
}
