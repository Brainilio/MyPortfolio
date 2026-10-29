"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { random, createBearMaterial, createPineGeometry, createCloud, flatMaterial } from "./island-parts";
import { drawCard, createCardMaterial, videoTexture, coverCrop } from "./prairie-cards";

// Golden-hour prairie seen from eye level: Garden-of-the-Gods sandstone fins in front of a hazy range, a loose
// bison herd with a calf, prairie dogs, gliding hawks, and a feed basket you can fill. The camera holds still;
// the project cards ride a slow carousel ring among the rocks, and scrolling turns it.
const GROUND=-5.5,EYE=GROUND+1.8,CARD=new THREE.Vector2(4.6,2.3),BASKET=new THREE.Vector3(2.5,0,6.6);
const FIN_COLORS=["#8f3b22","#b04b2a","#c65e34","#d9774a","#e8c9a2"].map(c=>new THREE.Color(c));
// Bison gaits: leg swing (rad), stride rate, bob (fraction of height), knee fold, foot lift (fraction), nod.
const GAITS={Graze:[0,1.1,.003,0,0,.04],Walk:[.36,3.4,.006,.6,.035,.09],Trot:[.5,5.6,.014,.8,.05,.12],Run:[.62,7.5,.02,.95,.06,.14]};
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
// Near the camera the ground stays gentle (so the herd stays in view); further off it rolls into real hills.
const groundY=(x,z)=>{const far=smooth((-z-8)/45);return GROUND+(.2+far*1.7)*Math.sin(x*.06+1)*Math.cos(z*.05)+(.1+far*.6)*Math.sin(x*.17+z*.12)+far*1.4*Math.sin(z*.035+x*.02);};

// A sandstone fin: a thin, tall, jagged slab, slightly leaning, banded rust to cream like Garden of the Gods.
function createFin(rng,width,height,depth) {
  const points=[new THREE.Vector2(-width/2,0)],peaks=6+Math.floor(rng()*5),crest=.25+rng()*.5;
  for(let i=1;i<peaks;i++){const u=i/peaks,shape=Math.pow(1-Math.abs(u-crest)/Math.max(crest,1-crest),.7);
    points.push(new THREE.Vector2(-width/2+u*width,height*(.35+.65*shape)*(.82+rng()*.3)));}
  points.push(new THREE.Vector2(width/2,0));
  const geometry=new THREE.ExtrudeGeometry(new THREE.Shape(points),{depth,bevelEnabled:false,steps:1}).translate(0,0,-depth/2);
  const flat=geometry.toNonIndexed(),pos=flat.attributes.position,colors=new Float32Array(pos.count*3);
  for(let i=0;i<pos.count;i++){const y=pos.getY(i);pos.setX(i,pos.getX(i)+(rng()-.5)*width*.04);pos.setZ(i,pos.getZ(i)*(1-.4*y/height));}
  for(let i=0;i<pos.count;i+=3){const y=(pos.getY(i)+pos.getY(i+1)+pos.getY(i+2))/3/height,band=Math.min(3,Math.floor(y*5+rng()*.8));
    const c=FIN_COLORS[band===3&&rng()<.35?4:band];for(let k=0;k<3;k++)colors.set([c.r,c.g,c.b],(i+k)*3);}
  flat.setAttribute("color",new THREE.BufferAttribute(colors,3));flat.deleteAttribute("uv");flat.computeVertexNormals();
  return new THREE.Mesh(flat,flatMaterial());
}

// A woven basket: a lathe-turned bowl with alternating bands.
function createBasket() {
  const profile=[[0,.02],[.5,.02],[.62,.12],[.7,.3],[.74,.46],[.8,.5],[.76,.54],[.66,.5],[.6,.32],[.5,.14],[0,.12]].map(([x,y])=>new THREE.Vector2(x,y));
  const geometry=new THREE.LatheGeometry(profile,14).toNonIndexed(),pos=geometry.attributes.position,colors=new Float32Array(pos.count*3);
  const light=new THREE.Color("#c48a4a"),dark=new THREE.Color("#8e5a2c");
  for(let i=0;i<pos.count;i+=3){const y=(pos.getY(i)+pos.getY(i+1)+pos.getY(i+2))/3,a=Math.atan2(pos.getZ(i),pos.getX(i)),c=(Math.floor(y*14)+Math.floor((a+Math.PI)*2.2))%2?light:dark;for(let k=0;k<3;k++)colors.set([c.r,c.g,c.b],(i+k)*3);}
  geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));geometry.computeVertexNormals();
  return new THREE.Mesh(geometry,flatMaterial());
}

export default function PrairieScene({ state, projects }) {
  const host=useRef(null);
  useEffect(()=>{
    const mount=host.current;
    let renderer,disposed=false,raf=0;
    // On screen while the director has the Work section (1) live, including during the transitions in and out.
    const onScreen=()=>state.current.live.includes(1);
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"}); } catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    mount.appendChild(renderer.domElement);
    const canvas=renderer.domElement;canvas.style.touchAction="pan-y";
    const preference=matchMedia("(prefers-reduced-motion: reduce)");
    const scene=new THREE.Scene();scene.fog=new THREE.Fog("#f2c19a",45,170);
    const camera=new THREE.PerspectiveCamera(35,1,.1,400);
    const rng=random(5);

    scene.add(new THREE.HemisphereLight("#ffe6c4","#5b3048",1.3));
    const sun=new THREE.DirectionalLight("#ffc27a",3);sun.position.set(-25,14,-30);scene.add(sun);
    const fill=new THREE.DirectionalLight("#b8a2ff",.6);fill.position.set(10,8,20);scene.add(fill);

    // Rolling grassland: golds drifting into sage, smooth shaded.
    {
      const g=new THREE.PlaneGeometry(380,260,150,104).rotateX(-Math.PI/2).translate(0,0,-90),pos=g.attributes.position,colors=new Float32Array(pos.count*3);
      const gold=new THREE.Color("#d9a95c"),dry=new THREE.Color("#c99a55"),sage=new THREE.Color("#a6a66a"),c=new THREE.Color();
      for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,groundY(x,z));
        const n=.5+.5*Math.sin(x*.11+z*.07)*Math.cos(x*.05-z*.13);c.copy(gold).lerp(dry,.5+.5*Math.sin(x*.3+z*.21)).lerp(sage,smooth((n-.55)*2.5)*.7);colors.set([c.r,c.g,c.b],i*3);}
      g.setAttribute("color",new THREE.BufferAttribute(colors,3));g.computeVertexNormals();
      scene.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1})));
    }
    // A hazy violet range on the horizon, like the Front Range behind the rocks.
    {
      const points=[],base=GROUND-3;for(let i=0;i<=60;i++){const x=-230+i*460/60;points.push([x,base+9+7*Math.sin(i*.55+1)+5*Math.sin(i*1.7)+(rng()-.5)*4]);}
      const positions=[];for(let i=0;i<60;i++){const [x0,y0]=points[i],[x1,y1]=points[i+1];positions.push(x0,base,0,x1,base,0,x0,y0,0,x1,base,0,x1,y1,0,x0,y0,0);}
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
      const colors=new Float32Array(positions.length),low=new THREE.Color("#a993c4"),high=new THREE.Color("#cdbbd6"),c=new THREE.Color();
      for(let i=0;i<positions.length;i+=3){c.copy(low).lerp(high,THREE.MathUtils.clamp((positions[i+1]-base)/18,0,1));colors.set([c.r,c.g,c.b],i);}
      g.setAttribute("color",new THREE.BufferAttribute(colors,3));
      const range=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide}));range.position.z=-200;scene.add(range);
    }
    // Low-poly clouds drifting across the sky.
    const sky=[[-70,46,-180,5],[15,54,-200,6],[80,42,-170,4.5],[-25,38,-150,3.5]].map(([x,y,z,s],i)=>{const cloud=createCloud(80+i);cloud.material=new THREE.MeshBasicMaterial({color:"#fff3e6",fog:false,transparent:true,opacity:.85});cloud.position.set(x,y,z);cloud.scale.setScalar(s);scene.add(cloud);return cloud;});

    const glow=document.createElement("canvas");glow.width=glow.height=128;
    const gg=glow.getContext("2d"),gr=gg.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,"rgba(255,240,210,1)");gr.addColorStop(.25,"rgba(255,200,140,.5)");gr.addColorStop(1,"rgba(255,170,150,0)");gg.fillStyle=gr;gg.fillRect(0,0,128,128);
    const glowTexture=new THREE.CanvasTexture(glow);glowTexture.colorSpace=THREE.SRGBColorSpace;
    const glare=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,transparent:true}));glare.position.set(-50,14,-190);glare.scale.setScalar(80);scene.add(glare);

    // Sandstone fins with open sky between them, plus two tall spires standing among the card ring. [x, z, width, height, depth, lean]
    const HIDES=[[-18,-27,6,8.5,2,.06],[-6,-35,5,7.5,1.8,-.04],[6,-31,6.5,9,2.2,.05],[19,-37,5.5,8,1.8,-.07],[-7.2,1.5,2.4,8.5,1.4,.05],[6.6,-10.5,2.8,10,1.6,-.06]];
    const BACKDROP=[[-36,-72,12,17,3,.08],[-23,-86,6,10,2,-.1],[31,-80,14,19,3.2,-.06],[44,-66,6,9,2,.1],[8,-108,9,12,2.5,-.03]];
    [...HIDES,...BACKDROP].forEach(([x,z,w,h,d,lean])=>{const fin=createFin(rng,w,h,d);fin.position.set(x,groundY(x,z)-.4,z);fin.rotation.set(0,(rng()-.5)*.5,lean);scene.add(fin);});
    // Junipers clustered at the rocks and dotted across the hills; sagebrush clumps in the grass.
    {
      const spots=[];
      [...HIDES,...BACKDROP].forEach(([x,z,w])=>{for(let k=0;k<6;k++)spots.push([x+(rng()-.5)*w*1.6,z+1.5+rng()*3]);});
      for(let k=0;k<40;k++)spots.push([(rng()-.5)*140,-30-rng()*80]);
      const junipers=new THREE.InstancedMesh(createPineGeometry(11),flatMaterial(),spots.length),d=new THREE.Object3D();
      spots.forEach(([x,z],i)=>{d.position.set(x,groundY(x,z),z);d.rotation.set(0,rng()*6,0);const s=.6+rng()*.6;d.scale.set(s*1.3,s,s*1.3);d.updateMatrix();junipers.setMatrixAt(i,d.matrix);});
      scene.add(junipers);
      const parts=[];for(let k=0;k<4;k++)parts.push(new THREE.IcosahedronGeometry(.32+rng()*.18,0).scale(1,.62,1).translate((rng()-.5)*.55,.12+rng()*.1,(rng()-.5)*.55).toNonIndexed());
      const sageGeometry=mergeGeometries(parts);sageGeometry.computeVertexNormals();
      const count=240,bushes=new THREE.InstancedMesh(sageGeometry,new THREE.MeshStandardMaterial({flatShading:true,roughness:1}),count),tints=["#8a9a5c","#7a8b52","#94a066"].map(c=>new THREE.Color(c));
      for(let i=0;i<count;i++){let x=(rng()-.5)*90;const z=-2-rng()*75;if(Math.hypot(x-BASKET.x,z-BASKET.z)<2.5)x+=4;d.position.set(x,groundY(x,z),z);d.rotation.set(0,rng()*6,0);d.scale.setScalar(.45+rng()*.6);d.updateMatrix();bushes.setMatrixAt(i,d.matrix);bushes.setColorAt(i,tints[i%3]);}
      scene.add(bushes);
    }

    // The feed basket, its hay, and the pellets that drop into it.
    const basket=createBasket();basket.position.set(BASKET.x,groundY(BASKET.x,BASKET.z),BASKET.z);basket.scale.setScalar(.9);scene.add(basket);
    const hay=new THREE.Mesh(new THREE.IcosahedronGeometry(.62,1).scale(1,.4,1),new THREE.MeshStandardMaterial({color:"#e2c46a",flatShading:true,roughness:1}));
    hay.position.set(BASKET.x,basket.position.y+.3,BASKET.z);hay.visible=false;scene.add(hay);
    const PELLETS=48,pelletMesh=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.07,0),new THREE.MeshStandardMaterial({color:"#c9a24e",flatShading:true,roughness:1}),PELLETS);
    pelletMesh.frustumCulled=false;scene.add(pelletMesh);
    const pellets=Array.from({length:PELLETS},()=>({state:"idle",wait:0,t:0,pos:new THREE.Vector3(),vel:new THREE.Vector3(),spin:new THREE.Vector3()}));
    let food=0;const dummy=new THREE.Object3D();
    // Hay bits flicked out of the basket by the bites.
    const BITS=36,bitMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.18,.025,.025),new THREE.MeshStandardMaterial({color:"#e6c56c",flatShading:true,roughness:1}),BITS);
    bitMesh.frustumCulled=false;scene.add(bitMesh);
    const bits=Array.from({length:BITS},()=>({life:-1,pos:new THREE.Vector3(),vel:new THREE.Vector3(),spin:new THREE.Vector3()}));
    function flick(from){
      for(let n=0;n<2;n++){const bit=bits.find(x=>x.life<0);if(!bit)return;
        const toward=new THREE.Vector3(from.x-BASKET.x,0,from.z-BASKET.z).normalize();
        bit.pos.set(BASKET.x+toward.x*.45,basket.position.y+.5,BASKET.z+toward.z*.45);
        bit.vel.set(toward.x*.6+(rng()-.5)*.8,1.2+rng()*1.1,toward.z*.6+(rng()-.5)*.8);bit.spin.set(rng()*9,rng()*9,rng()*9);bit.life=0;}
    }
    function updateBits(dt){
      bits.forEach((bit,i)=>{
        if(bit.life>=0){bit.life+=dt;bit.vel.y-=6*dt;bit.pos.addScaledVector(bit.vel,dt);const floor=groundY(bit.pos.x,bit.pos.z)+.02;if(bit.pos.y<floor){bit.pos.y=floor;bit.vel.set(0,0,0);}if(bit.life>2.2)bit.life=-1;}
        dummy.position.copy(bit.pos);dummy.rotation.set(bit.vel.lengthSq()?bit.life*bit.spin.x:0,bit.life*bit.spin.y,bit.vel.lengthSq()?bit.life*bit.spin.z:0);
        dummy.scale.setScalar(bit.life<0?0:bit.life>1.7?Math.max(0,(2.2-bit.life)*2):1);dummy.updateMatrix();bitMesh.setMatrixAt(i,dummy.matrix);
      });
      bitMesh.instanceMatrix.needsUpdate=true;
    }
    function pour(){
      pellets.forEach((p,i)=>{p.state="wait";p.wait=i*.025;p.t=0;const a=rng()*Math.PI*2,r=rng()*.35;p.pos.set(BASKET.x+Math.cos(a)*r,basket.position.y+3.2+rng()*.8,BASKET.z+Math.sin(a)*r);p.vel.set(0,-1,0);p.spin.set(rng()*8,rng()*8,rng()*8);});
      callHerd();
    }
    function updatePellets(dt){
      pellets.forEach((p,i)=>{
        if(p.state==="wait"){p.wait-=dt;if(p.wait<=0)p.state="fall";}
        if(p.state==="fall"){p.t+=dt;p.vel.y-=9.8*dt;p.pos.addScaledVector(p.vel,dt);if(p.pos.y<hay.position.y+(.2+food*.8)*.25){food=Math.min(1,food+1.4/PELLETS);p.state="idle";}}
        dummy.position.copy(p.pos);dummy.rotation.set(p.t*p.spin.x,p.t*p.spin.y,p.t*p.spin.z);dummy.scale.setScalar(p.state==="fall"?1:0);
        dummy.updateMatrix();pelletMesh.setMatrixAt(i,dummy.matrix);
      });
      pelletMesh.instanceMatrix.needsUpdate=true;
      hay.scale.setScalar(.2+food*.8);hay.visible=food>.02;
    }

    // Project cards on a carousel ring: evenly spaced round an ellipse just below eye level.
    // Deep ellipse: the front card comes close and large, the back of the ring curves away among the herd and rocks.
    const RING={center:new THREE.Vector3(0,EYE+1.9,-7.5),rx:7.4,rz:7.5,tilt:1.2};
    const cards=projects.map((project,i)=>{
      const blank=document.createElement("canvas");blank.width=blank.height=4;
      const {material,uniforms}=createCardMaterial(new THREE.CanvasTexture(blank),CARD);
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(CARD.x,CARD.y,24,24),material);mesh.userData={project,i};scene.add(mesh);
      // Media: a looping muted video if the project has one (previewVideo), otherwise its preview image.
      let video=null;
      if(project.previewVideo){
        video=document.createElement("video");Object.assign(video,{src:project.previewVideo,muted:true,loop:true,playsInline:true,preload:"metadata"});
        video.addEventListener("loadedmetadata",()=>{if(disposed)return;uniforms.uMap.value.dispose();uniforms.uMap.value=videoTexture(video);coverCrop(video.videoWidth/video.videoHeight,CARD,uniforms.uCrop.value);},{once:true});
      } else {
        const image=new Image();image.decoding="async";
        const paint=img=>{if(disposed)return;uniforms.uMap.value.dispose();uniforms.uMap.value=drawCard(img);};
        image.onload=()=>paint(image);image.onerror=()=>paint(null);image.src=project.previewImage;
      }
      return {mesh,uniforms,video,hover:0,depth:1};
    });
    let spin=0,spinVelocity=0;

    // Everything loaded is from Poly Pizza (see public/models/CREDITS.md).
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    loader.load("/models/island/boulder.glb",gltf=>{
      if(disposed)return;gltf.scene.traverse(o=>{if(o.isMesh)o.material=new THREE.MeshStandardMaterial({color:"#c0663a",flatShading:true,roughness:1});});
      for(let i=0;i<8;i++){const x=(rng()-.5)*40,z=-3-rng()*26,b=gltf.scene.clone();b.scale.setScalar(.4+rng()*1.1);b.rotation.set(rng(),rng()*6,rng());b.position.set(x,groundY(x,z)+.05,z);scene.add(b);}
    },undefined,()=>{});

    // The herd: each bison grazes, ambles and now and then trots on its own, staying loosely together.
    // The calf is a scaled bison with a red coat (real calves are orange-red) that dashes around its mother.
    const herd=[],PEN={x:[-26,26],z:[-24,-11]};
    loader.load("/models/island/bison.glb",gltf=>{
      if(disposed)return;
      const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3());
      for(let i=0;i<9;i++){
        const calf=i===8,model=i?gltf.scene.clone():gltf.scene,root=new THREE.Group();let gait=null;
        model.traverse(o=>{if(!o.isMesh)return;
          if(calf){
            // Recolour a copy of the geometry: dark browns become the calf's rusty orange.
            const g=o.geometry.clone(),c=g.attributes.color,tint=new THREE.Color(),deep=new THREE.Color("#a24f22"),bright=new THREE.Color("#e08a4c");
            if(c)for(let k=0;k<c.count;k++){const l=(c.getX(k)+c.getY(k)+c.getZ(k))/3;tint.copy(deep).lerp(bright,Math.min(1,l*3));c.setXYZ(k,tint.r,tint.g,tint.b);}
            o.geometry=g;
          }
          gait??=createBearMaterial(o.geometry,{hip:.27});o.material=gait.material;o.frustumCulled=false;});
        const h=calf?1:1.9;model.scale.setScalar(h/size.y);model.position.y=-box.min.y*h/size.y;root.add(model);
        const x=PEN.x[0]+rng()*(PEN.x[1]-PEN.x[0]),z=PEN.z[0]+rng()*(PEN.z[1]-PEN.z[0]);root.position.set(x,groundY(x,z),z);scene.add(root);
        herd.push({root,gait,calf,yaw:rng()*6,state:"graze",timer:1+rng()*5,speed:0,gaitName:"Graze",swing:0,phase:rng()*6,head:0,target:new THREE.Vector2(x,z),face:null,feeding:false,eatUntil:0});
      }
    },undefined,()=>{});
    const centroid=new THREE.Vector2();
    function pickTarget(b){
      const p=b.root.position;
      if(b.calf){const mom=herd[0].root.position,a=rng()*Math.PI*2,r=1.4+rng()*2.4;return b.target.set(mom.x+Math.cos(a)*r,mom.z+Math.sin(a)*r);}
      centroid.set(0,0);let n=0;herd.forEach(o=>{if(!o.calf){centroid.x+=o.root.position.x;centroid.y+=o.root.position.z;n++;}});centroid.divideScalar(Math.max(1,n));
      // Wander, but drift back toward the herd when straying.
      const a=rng()*Math.PI*2,d=2+rng()*6,pull=Math.min(1,Math.hypot(p.x-centroid.x,p.z-centroid.y)/12);
      return b.target.set(THREE.MathUtils.clamp(THREE.MathUtils.lerp(p.x+Math.cos(a)*d,centroid.x,pull*.6),PEN.x[0],PEN.x[1]),THREE.MathUtils.clamp(THREE.MathUtils.lerp(p.z+Math.sin(a)*d,centroid.y,pull*.6),PEN.z[0],PEN.z[1]));
    }
    function go(b,gaitName,speed){b.state="move";b.gaitName=gaitName;b.speed=speed;}
    function callHerd(){
      // The nearest few adults, and always the calf, hurry over and stand around the far side of the basket.
      const adults=herd.filter(b=>!b.calf).sort((a,b)=>a.root.position.distanceTo(BASKET)-b.root.position.distanceTo(BASKET)).slice(0,4);
      const calf=herd.find(b=>b.calf),eaters=calf?[...adults,calf]:adults;
      eaters.forEach((b,k)=>{const a=Math.PI*(.12+.76*k/Math.max(1,eaters.length-1)),r=b.calf?1.05:1.75;
        b.target.set(BASKET.x+Math.cos(a)*r,BASKET.z-Math.sin(a)*r);b.feeding=true;b.face=null;go(b,"Run",b.calf?3:2.8);});
    }
    function updateBison(b,dt,now){
      const p=b.root.position;b.timer-=dt;
      if(b.state==="graze"&&b.timer<=0){pickTarget(b);const r=rng();if(b.calf)go(b,r<.55?"Run":"Walk",r<.55?2.4:.9);else go(b,r<.12?"Trot":"Walk",r<.12?1.5:.45+rng()*.3);}
      else if(b.state==="eat"&&now>b.eatUntil){b.feeding=false;b.face=null;pickTarget(b);go(b,"Walk",.55);}
      else if(b.state==="move"){
        const dx=b.target.x-p.x,dz=b.target.y-p.z,dist=Math.hypot(dx,dz);
        if(dist<.12){
          if(b.feeding){b.state="eat";b.gaitName="Graze";b.speed=0;b.eatUntil=now+5;b.face=Math.atan2(BASKET.x-p.x,BASKET.z-p.z);}
          else{b.state="graze";b.gaitName="Graze";b.speed=0;b.timer=b.calf?.6+rng()*1.6:3+rng()*7;}
        } else {
          const step=Math.min(dist,b.speed*dt*Math.min(1,dist*1.2+.25));p.x+=dx/dist*step;p.z+=dz/dist*step;
          let turn=Math.atan2(dx,dz)-b.yaw;turn=Math.atan2(Math.sin(turn),Math.cos(turn));b.yaw+=turn*(1-Math.exp(-dt*(b.speed>1.2?6:3)));
        }
      }
      if(b.face!==null){let turn=b.face-b.yaw;turn=Math.atan2(Math.sin(turn),Math.cos(turn));b.yaw+=turn*(1-Math.exp(-dt*4));}
      const [swing,rate,bob,knee,lift,nod]=GAITS[b.gaitName];
      b.swing+=(swing-b.swing)*(1-Math.exp(-dt*4));b.phase+=dt*rate*(b.gaitName==="Walk"?Math.max(.6,b.speed/.55):1)*(b.calf?1.25:1);
      // Head: nibbling while grazing or eating; at the basket, every few seconds it lifts to chew and glance aside.
      let headWant=0,turnWant=0,chew=0;
      if(b.state==="graze"||b.state==="eat"){
        b.eatT=(b.eatT??rng()*5)+dt;const cycle=b.eatT%(b.state==="eat"?3.6:5.5),up=b.state==="eat"&&cycle>2.5;
        headWant=up?.1:.5+Math.sin(b.eatT*5.2)*.08;turnWant=up?Math.sin(b.eatT*1.4+b.phase)*.28:Math.sin(b.eatT*.8)*.05;chew=up?Math.sin(b.eatT*13)*.025:0;
        // Bites at the basket flick out bits of hay.
        if(b.state==="eat"&&!up&&food>.05&&rng()<dt*2.2)flick(b.root.position);
      }
      b.head+=(headWant-b.head)*(1-Math.exp(-dt*6));b.turn=(b.turn??0)+(turnWant-(b.turn??0))*(1-Math.exp(-dt*3));
      b.tail=Math.sin(now*(b.state==="eat"?3.1:1.7)+b.phase*.3)*(b.state==="eat"?.45:.22);
      const on=Math.min(1,b.swing/.36),u=b.gait.uniforms;
      u.uPhase.value=b.phase;u.uSwing.value=b.swing;u.uKnee.value=Math.max(knee,GAITS.Walk[3]*on);u.uLift.value=Math.max(lift,GAITS.Walk[4]*on)*u.uHeight.value;u.uNod.value=nod;u.uHeadDown.value=b.head+chew;u.uHeadTurn.value=b.turn;u.uTail.value=b.tail;
      u.uBob.value=b.swing>.05?Math.abs(Math.sin(b.phase))*Math.max(bob,GAITS.Walk[2]*on):Math.sin(b.phase*.5)*bob;
      p.y=groundY(p.x,p.z);b.root.rotation.y=b.yaw;
    }
    function stampede(from){
      for(const b of herd){if(b.feeding)continue;const dx=b.root.position.x-from.x,dz=b.root.position.z-from.z,d=Math.hypot(dx,dz)||1;
        if(d<5&&b.gaitName!=="Run"){b.target.set(THREE.MathUtils.clamp(b.root.position.x+dx/d*7,PEN.x[0],PEN.x[1]),THREE.MathUtils.clamp(b.root.position.z+dz/d*5,PEN.z[0],PEN.z[1]));go(b,"Run",3.2);}}
    }

    // Prairie dogs on their mounds in the foreground.
    const dogs=[];
    loader.load("/models/island/prairiedog.glb",gltf=>{
      if(disposed)return;
      const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3());
      const moundMaterial=new THREE.MeshStandardMaterial({color:"#9a6a3e",flatShading:true,roughness:1}),hole=new THREE.MeshBasicMaterial({color:"#2b1a14"});
      [[-4.2,5],[-2,8],[2.2,8.5],[8.6,2.5],[-10,2.5],[10.5,6.5],[-6.5,7.5]].forEach(([x,z],i)=>{
        const y=groundY(x,z),mound=new THREE.Mesh(new THREE.CylinderGeometry(.22,.62,.26,7),moundMaterial);mound.position.set(x,y+.08,z);scene.add(mound);
        const opening=new THREE.Mesh(new THREE.CircleGeometry(.2,7).rotateX(-Math.PI/2),hole);opening.position.set(x,y+.22,z);scene.add(opening);
        const model=i?gltf.scene.clone():gltf.scene;model.traverse(o=>{if(o.isMesh)o.material=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1});});
        model.scale.setScalar(.62/size.y);model.position.y=-box.min.y*.62/size.y;
        const root=new THREE.Group();root.add(model);root.position.set(x,y-.7,z);root.rotation.y=rng()*6;scene.add(root);
        dogs.push({root,base:y,state:"down",timer:1+rng()*5,look:root.rotation.y,up:0});
      });
    },undefined,()=>{});
    function updateDog(d,dt){
      d.timer-=dt;
      if(d.state==="down"&&d.timer<=0){d.state="up";d.timer=2.5+rng()*4;}
      else if(d.state==="up"){if(d.timer<=0){d.state="down";d.timer=2+rng()*6;}else if(rng()<dt*.6)d.look+=(rng()-.5)*1.8;}
      d.up+=((d.state==="up"?.68:0)-d.up)*(1-Math.exp(-dt*(d.state==="up"?5:12)));
      d.root.position.y=d.base-.7+d.up;d.root.rotation.y+=(d.look-d.root.rotation.y)*(1-Math.exp(-dt*4));
    }

    // Hawks: a few slow wingbeats, then long glides on outstretched wings, banking around wide circles.
    const hawks=[];let glideAt=0,clipLength=1;
    loader.load("/models/island/hawk.glb",gltf=>{
      if(disposed)return;
      const clip=gltf.animations[0];clipLength=clip.duration;
      // The gliding pose is the frame with the widest wingspan.
      {const probe=new THREE.AnimationMixer(gltf.scene);probe.clipAction(clip).play();let best=-1;
        for(let t=0;t<clip.duration;t+=clip.duration/24){probe.setTime(t);gltf.scene.updateMatrixWorld(true);const w=new THREE.Box3().setFromObject(gltf.scene,true).getSize(new THREE.Vector3()).x;if(w>best){best=w;glideAt=t;}}
        probe.stopAllAction();probe.uncacheRoot(gltf.scene);}
      const size=new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
      for(let i=0;i<2;i++){
        const model=i?cloneSkinned(gltf.scene):gltf.scene;model.traverse(o=>{if(o.isMesh){o.material=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1,side:THREE.DoubleSide});o.frustumCulled=false;}});
        const root=new THREE.Group();model.scale.setScalar(2.2/size.x);root.add(model);scene.add(root);
        const mixer=new THREE.AnimationMixer(model),action=mixer.clipAction(clip);action.play();action.time=glideAt;
        hawks.push({root,mixer,action,a:i*3,r:18+i*8,y:9+i*2.5,speed:.07+i*.02,flap:i?3:0,glide:i?0:4});
      }
    },undefined,()=>{});
    function updateHawk(h,dt){
      if(h.flap>0){h.flap-=dt;h.action.timeScale=.6;if(h.flap<=0)h.glide=4+rng()*4;}
      else{const gap=((glideAt-h.action.time)%clipLength+clipLength)%clipLength;h.action.timeScale=gap>.03?Math.min(.6,gap*2+.05):0;h.glide-=dt;if(h.glide<=0)h.flap=1.6+rng()*1.4;}
      h.mixer.update(dt);
      h.a+=dt*h.speed;const x=Math.cos(h.a)*h.r,z=-28+Math.sin(h.a)*h.r*.5,y=h.y+Math.sin(h.a*2)*.6;
      h.root.position.set(x,y,z);h.root.lookAt(x-Math.sin(h.a)*h.r,y,z+Math.cos(h.a)*h.r*.5);h.root.rotateZ(-.25);
    }

    // Pointer: hover/click the cards, click the basket; sweeping across the grass spooks the herd and prairie dogs.
    const raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-GROUND),hit=new THREE.Vector3();
    const lean=new THREE.Vector2(),pointer=new THREE.Vector2();let hovered=null,onBasket=false;
    function onMove(event){
      const rect=canvas.getBoundingClientRect();ndc.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);pointer.copy(ndc);
      raycaster.setFromCamera(ndc,camera);
      const card=raycaster.intersectObjects(cards.filter(c=>c.depth>.3).map(c=>c.mesh),false)[0];
      hovered=card?cards.find(c=>c.mesh===card.object):null;
      if(card)hovered.uniforms.uMouse.value.copy(card.uv);
      onBasket=!hovered&&raycaster.intersectObjects([basket,hay],false).length>0;
      canvas.style.cursor=hovered||onBasket?"pointer":"default";
      if(!hovered&&!onBasket&&raycaster.ray.intersectPlane(groundPlane,hit)){stampede(hit);for(const d of dogs)if(Math.hypot(d.root.position.x-hit.x,d.root.position.z-hit.z)<3.5){d.state="down";d.timer=3+rng()*3;}}
    }
    function onClick(){if(hovered)window.location.href=`/project/${hovered.mesh.userData.project.slug}/`;else if(onBasket)pour();}
    canvas.addEventListener("pointermove",onMove);canvas.addEventListener("click",onClick);
    canvas.addEventListener("pointerleave",()=>{hovered=null;onBasket=false;pointer.set(0,0);});

    let tall=false;
    function frame(){const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;tall=camera.aspect<.85;camera.fov=tall?46:35;camera.updateProjectionMatrix();}
    const resize=new ResizeObserver(frame);resize.observe(mount);frame();

    const clock=new THREE.Clock();let time=0;
    function tick(dt){
      const reduced=preference.matches,step=reduced?0:dt;time+=step;
      lean.lerp(reduced?pointer.set(0,0):pointer,1-Math.exp(-dt*2));
      camera.position.set(lean.x*.6,EYE+.2+lean.y*.25,tall?12.5:15);camera.lookAt(lean.x*.3,EYE+1,-20);
      // The ring eases round to the chosen card rather than snapping, so it glides.
      // Scrolling through Work turns the ring from the first card to the last.
      const n=cards.length,card0=state.current.progress[1]*(n-1),target=-card0/n*Math.PI*2,before=spin;
      spin=reduced?target:spin+(target-spin)*(1-Math.exp(-dt*4));spinVelocity=(spin-before)/Math.max(dt,1/120);
      const rx=tall?3.6:RING.rx,rz=tall?5.5:RING.rz,cz=tall?-4.5:RING.center.z;
      cards.forEach((card,i)=>{
        const a=spin+i/n*Math.PI*2,depth=Math.cos(a);card.depth=depth;
        // Videos only play while their card is facing us.
        if(card.video){const play=!reduced&&depth>-.2;if(play&&card.video.paused)card.video.play().catch(()=>{});else if(!play&&!card.video.paused)card.video.pause();}
        card.hover+=((card===hovered?1:0)-card.hover)*(1-Math.exp(-dt*7));
        // The ring is seen slightly from above, as in the sketch: the back of it rides higher than the front.
        card.mesh.position.set(RING.center.x+Math.sin(a)*rx,RING.center.y-depth*RING.tilt+Math.sin(time*.5+i)*.06+card.hover*.12,cz+depth*rz+card.hover*.4);
        // Turn with the ring: each card faces outward along the circle's radius, so the front one faces you,
        // the sides swing edge-on and the back ones show their backs.
        card.mesh.rotation.set(0,Math.atan2(Math.sin(a)/rx,Math.cos(a)/rz)+lean.x*.05,0);
        // The card in focus grows as it comes round to the front.
        const focus=smooth((depth-.55)/.45);
        card.mesh.scale.setScalar((1+focus*(tall?.25:.38))*(1+card.hover*.04));
        const v=card.uniforms;v.uTime.value=time;v.uHover.value=card.hover;v.uShade.value=.62+.38*smooth((depth+1)/2);
        v.uVelocity.value=reduced?0:THREE.MathUtils.clamp(-spinVelocity*.6,-1,1);
      });
      // Food drains while the herd eats; the basket wobbles a little when hovered.
      updatePellets(step);updateBits(step);if(herd.some(b=>b.state==="eat"))food=Math.max(0,food-step*.18);
      basket.rotation.z=onBasket&&!reduced?Math.sin(time*9)*.03:0;
      herd.forEach(b=>updateBison(b,step,time));dogs.forEach(d=>updateDog(d,step));hawks.forEach(h=>updateHawk(h,step));
      sky.forEach((c,i)=>{c.position.x+=step*(.4+i*.15);if(c.position.x>120)c.position.x=-120;});
      renderer.render(scene,camera);
    }
    function draw(){raf=requestAnimationFrame(draw);const dt=Math.min(clock.getDelta(),.05);if(onScreen()&&!document.hidden&&!window.__prairieHold)tick(dt);}
    draw();
    if(new URLSearchParams(window.location.search).has("debug"))window.__prairie={step:(n=30)=>{for(let i=0;i<n;i++)tick(1/30);},pour,scene,camera,herd,dogs,cards,hawks,THREE,renderer};

    return()=>{
      disposed=true;cancelAnimationFrame(raf);resize.disconnect();delete window.__prairie;
      cards.forEach(c=>{if(c.video){c.video.pause();c.video.removeAttribute("src");c.video.load();}});
      canvas.removeEventListener("pointermove",onMove);canvas.removeEventListener("click",onClick);
      hawks.forEach(h=>h.mixer.stopAllAction());
      scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat())if(m){m.map?.dispose();m.uniforms?.uMap?.value?.dispose();m.dispose();}});
      glowTexture.dispose();renderer.dispose();canvas.remove();
    };
  },[state,projects]);
  return <div className="ht-prairie-canvas" ref={host} aria-hidden="true" />;
}
