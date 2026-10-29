"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { PALETTE, MOUNTAIN, outline, heightAt, riverDistance, random, createIsland, createWater, createPineGeometry, bakeProp, createSwayingInstances, createFoliageMaterial, createCloud, createBird, createEagle, createBearMaterial, createFish } from "./island-parts";

// Animal sizes (world units tall) and gaits (units per second).
const ANIMALS={stag:{height:1.55,walk:.75,run:3.6},deer:{height:1.2,walk:.65,run:3.3},fox:{height:.66,walk:.8,run:3.8},bear:{height:1.3,walk:.6,run:3.2}};
// The bear has no rig: each gait is a leg swing (radians), a stride rate and a bob (fraction of body height).
const BEAR_GAITS={Idle:[0,2,.004],Eating:[0,1.4,.006],Walk:[.45,5.5,.012],Gallop:[.72,10,.035]};
const MOUNTAIN_SCALE=1.9,MOUNTAIN_CLEAR=3.6;

export default function IslandScene({ onEvent, active } = {}) {
  const host=useRef(null),event=useRef(onEvent),live=useRef(active);
  live.current=active;
  event.current=onEvent;
  useEffect(()=>{
    const mount=host.current;
    let renderer,disposed=false,raf=0,visible=true;
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"}); } catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    mount.appendChild(renderer.domElement);
    const preference=matchMedia("(prefers-reduced-motion: reduce)");
    const scene=new THREE.Scene();scene.fog=new THREE.Fog("#b98fc9",34,70);
    const camera=new THREE.PerspectiveCamera(32,1,.1,200);

    // Dusk light: a low warm sun behind and to the right (rim light), a cool violet fill from the front.
    scene.add(new THREE.HemisphereLight("#e2d4ff","#4a2f5c",1.35));
    const sun=new THREE.DirectionalLight("#ffb98a",3.2);sun.position.set(14,9,-8);scene.add(sun);
    const fill=new THREE.DirectionalLight("#9d8cff",.7);fill.position.set(-9,6,12);scene.add(fill);
    // The glare: a soft sun just behind the island.
    const glareCanvas=document.createElement("canvas");glareCanvas.width=glareCanvas.height=128;
    const g2=glareCanvas.getContext("2d"),grad=g2.createRadialGradient(64,64,0,64,64,64);
    grad.addColorStop(0,"rgba(255,236,214,1)");grad.addColorStop(.18,"rgba(255,190,150,.55)");grad.addColorStop(.5,"rgba(255,150,170,.14)");grad.addColorStop(1,"rgba(255,150,170,0)");
    g2.fillStyle=grad;g2.fillRect(0,0,128,128);
    const glareTexture=new THREE.CanvasTexture(glareCanvas);glareTexture.colorSpace=THREE.SRGBColorSpace;
    const glare=new THREE.Sprite(new THREE.SpriteMaterial({map:glareTexture,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,transparent:true}));
    glare.position.set(16,1.5,-42);glare.scale.setScalar(46);scene.add(glare);

    // The island and everything on it ride in one group, so it can float and be turned as a whole.
    const world=new THREE.Group();scene.add(world);
    const island=createIsland();world.add(island.group);
    const water=createWater();world.add(water.group);
    const shared={uTime:{value:0},uBreeze:{value:.035},uGust:{value:.07}};
    const foliage=createFoliageMaterial(shared);
    const rng=random(21);

    // Spots on the meadow away from the river, the mountain and the edge.
    const meadow=(minRiver=1.1,edge=.84)=>{for(let i=0;i<200;i++){const a=rng()*Math.PI*2,r=Math.sqrt(rng())*outline(a)*edge,x=Math.cos(a)*r,z=Math.sin(a)*r;
      if(Math.hypot(x-MOUNTAIN.x,z-MOUNTAIN.y)<MOUNTAIN_CLEAR)continue;const {d,t}=riverDistance(x,z);if(t>0&&d<minRiver)continue;return new THREE.Vector3(x,heightAt(x,z),z);}return new THREE.Vector3();};
    // Every tree and rock claims a footprint; new ones only go where they don't overlap.
    const occupied=[];
    const place=(n,scale,minRiver,edge,radius)=>{
      const out=[];
      for(let i=0;i<n;i++)for(let tries=0;tries<40;tries++){
        const position=meadow(minRiver,edge),s=scale*(.75+rng()*.5),r=radius*s;
        if(occupied.some(o=>Math.hypot(o.x-position.x,o.z-position.z)<o.r+r))continue;
        occupied.push({x:position.x,z:position.z,r});out.push({position,rotation:rng()*Math.PI*2,scale:s});break;
      }
      return out;
    };
    const swaying=[];
    swaying.push(createSwayingInstances(createPineGeometry(3),place(16,1.25,1.8,.88,.5),foliage));
    swaying.forEach(s=>world.add(s.mesh));

    // Little blob shadows under the animals ground them without real-time shadows.
    const shadowCanvas=document.createElement("canvas");shadowCanvas.width=shadowCanvas.height=64;
    const s2=shadowCanvas.getContext("2d"),sg=s2.createRadialGradient(32,32,0,32,32,32);sg.addColorStop(0,"rgba(30,15,45,.5)");sg.addColorStop(1,"rgba(30,15,45,0)");s2.fillStyle=sg;s2.fillRect(0,0,64,64);
    const shadowTexture=new THREE.CanvasTexture(shadowCanvas),shadowGeometry=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
    const shadowMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false});

    // Clouds drift around the island at different heights, some below it.
    // Kept to the sides and behind (never between the camera and the island), small enough to read as distance.
    const clouds=[[-2.1,14,-5.5,.95],[-1.3,17,-3.2,.7],[1.9,15,-6.5,1.05],[2.7,19,-2.5,.75],[-2.9,20,-1.2,.6],[3.5,16,-4.4,.85],[.4,22,-7.5,1.2]].map(([a,r,y,s],i)=>{
      const cloud=createCloud(40+i);cloud.userData={a,r,y,speed:.008+(i%3)*.003};cloud.scale.setScalar(s);scene.add(cloud);return cloud;});

    // Birds circling the peak.
    const birdMaterial=new THREE.MeshStandardMaterial({color:PALETTE.bird,flatShading:true,side:THREE.DoubleSide,roughness:1});
    const birds=Array.from({length:8},(_,i)=>{const bird=createBird(birdMaterial);Object.assign(bird.userData,{a:i/8*Math.PI*2,r:3+(i%3)*.8,h:4.6+(i%4)*.55,speed:.32+(i%5)*.05,flap:i*1.3});world.add(bird);return bird;});
    let scatter=0;
    // Fall leaves: a slow trickle from the autumn trees, and a flurry when one is shaken.
    const LEAVES=48,leafMesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(.18,.12),new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:1,flatShading:true}),LEAVES);
    leafMesh.frustumCulled=false;world.add(leafMesh);
    const leafColors=["#ee8a4f","#f5b366","#e0673a","#f7c96b"].map(c=>new THREE.Color(c));
    for(let i=0;i<LEAVES;i++)leafMesh.setColorAt(i,leafColors[i%4]);
    const leaves=Array.from({length:LEAVES},()=>({life:-1,pos:new THREE.Vector3(),ground:0,rest:0,phase:0,spin:new THREE.Vector3()}));
    let autumn=null,leafTimer=0;
    function dropLeaf(tree){
      const leaf=leaves.find(l=>l.life<0);if(!leaf||!autumn)return;
      const placements=autumn.mesh.userData.placements;if(!placements.length)return;
      const p=placements[tree??Math.floor(rng()*placements.length)],a=rng()*Math.PI*2,r=rng()*.55*p.scale;
      leaf.pos.set(p.position.x+Math.cos(a)*r,p.position.y+(1.1+rng()*.8)*p.scale*1.6,p.position.z+Math.sin(a)*r);
      leaf.ground=heightAt(leaf.pos.x,leaf.pos.z)+.02;leaf.life=0;leaf.rest=0;leaf.phase=rng()*6;leaf.spin.set(rng()*3,rng()*3,rng()*3);
    }
    function updateLeaves(dt){
      if(!autumn)return;
      leafTimer-=dt;if(leafTimer<=0){dropLeaf();leafTimer=.35+rng()*.5;}
      leaves.forEach((l,i)=>{
        if(l.life<0){dummy.scale.setScalar(0);}
        else{
          l.life+=dt;
          if(l.pos.y>l.ground){
            // Flutter: drift side to side as it falls, tumbling.
            l.pos.y=Math.max(l.ground,l.pos.y-dt*.45);l.pos.x+=Math.sin(l.life*2.4+l.phase)*dt*.35;l.pos.z+=Math.cos(l.life*1.9+l.phase)*dt*.25;
            dummy.rotation.set(l.life*l.spin.x,l.life*l.spin.y,l.life*l.spin.z);
          } else {l.rest+=dt;dummy.rotation.set(-Math.PI/2,0,l.phase);}
          dummy.position.copy(l.pos);dummy.scale.setScalar(l.rest>2?Math.max(0,1-(l.rest-2)):1);
          if(l.rest>3)l.life=-1;
        }
        dummy.updateMatrix();leafMesh.setMatrixAt(i,dummy.matrix);
      });
      leafMesh.instanceMatrix.needsUpdate=true;
    }
    // The avalanche: snow and rock chunks tumble down the mountain's face into the river, with dust and a splash.
    const CHUNKS=40,chunkMesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.13,0),new THREE.MeshStandardMaterial({flatShading:true,roughness:1}),CHUNKS);
    chunkMesh.frustumCulled=false;world.add(chunkMesh);
    const snowColor=new THREE.Color("#f6f2ff"),stoneColor=new THREE.Color("#8e86a3");
    for(let i=0;i<CHUNKS;i++)chunkMesh.setColorAt(i,i%4?snowColor:stoneColor);
    const chunks=Array.from({length:CHUNKS},()=>({start:new THREE.Vector3(),ctrl:new THREE.Vector3(),end:new THREE.Vector3(),delay:0,dur:1,size:1,axis:new THREE.Vector3(1,0,0)}));
    const puffCanvas=document.createElement("canvas");puffCanvas.width=puffCanvas.height=64;
    const p2=puffCanvas.getContext("2d"),pg=p2.createRadialGradient(32,32,0,32,32,32);pg.addColorStop(0,"rgba(255,255,255,.9)");pg.addColorStop(1,"rgba(255,255,255,0)");p2.fillStyle=pg;p2.fillRect(0,0,64,64);
    const puffTexture=new THREE.CanvasTexture(puffCanvas);
    const puffs=Array.from({length:10},()=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTexture,transparent:true,depthWrite:false,opacity:0}));s.visible=false;world.add(s);return s;});
    const splash=new THREE.Mesh(new THREE.RingGeometry(.55,.75,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:"#ffffff",transparent:true,depthWrite:false}));splash.visible=false;world.add(splash);
    const avalanche={clock:-1,splashAt:0,end:0,splashed:false};
    // The gush: when the avalanche lands the river surges (faster, foamier, swelling) and spray bursts up.
    let surge=0,flowTime=0;
    const SPRAY=44,sprayMesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.06,0),new THREE.MeshBasicMaterial({color:"#f4fbff"}),SPRAY);
    sprayMesh.frustumCulled=false;world.add(sprayMesh);
    const spray=Array.from({length:SPRAY},()=>({life:-1,pos:new THREE.Vector3(),vel:new THREE.Vector3(),size:1}));
    const rings=Array.from({length:3},()=>{const ring=new THREE.Mesh(new THREE.RingGeometry(.45,.62,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:"#ffffff",transparent:true,depthWrite:false}));ring.visible=false;ring.userData.at=-1;world.add(ring);return ring;});
    function gush(){
      surge=1;
      spray.forEach(s=>{const p=riverSource.getPoint(.05+rng()*.45);s.pos.set(p.x+(rng()-.5)*.5,-.15,p.z+(rng()-.5)*.5);s.vel.set((rng()-.5)*1.6,2.2+rng()*2.6,(rng()-.5)*1.6);s.life=0;s.size=.6+rng()*1.2;});
      rings.forEach((ring,i)=>{ring.position.copy(riverSource.getPoint(.1+i*.15)).setY(-.17);ring.userData.at=i*.18;ring.userData.t=0;});
      fishes.forEach(f=>{if(f.jump<0)f.jump=0;});
    }
    function updateGush(dt){
      let any=false;
      spray.forEach((s,i)=>{
        if(s.life>=0){s.life+=dt;s.vel.y-=9*dt;s.pos.addScaledVector(s.vel,dt);if(s.pos.y<-.25)s.life=-1;}
        dummy.position.copy(s.pos);dummy.rotation.set(0,0,0);dummy.scale.setScalar(s.life>=0?s.size:0);dummy.updateMatrix();sprayMesh.setMatrixAt(i,dummy.matrix);any||=s.life>=0;
      });
      sprayMesh.instanceMatrix.needsUpdate=true;sprayMesh.visible=any;
      rings.forEach(ring=>{if(ring.userData.at<0)return;ring.userData.t+=dt;const k=(ring.userData.t-ring.userData.at)/1.1;ring.visible=k>0&&k<1;
        if(ring.visible){ring.scale.setScalar(.5+k*2.6);ring.material.opacity=.85*(1-k);}if(k>=1)ring.userData.at=-1;});
    }

    // Trout in the river: they swim up and down it, wagging, and now and then leap out of the water.
    const riverPath=new THREE.CatmullRomCurve3(water.path),fishes=Array.from({length:6},(_,i)=>{
      const fish=createFish(70+i);fish.scale.setScalar(1.8);world.add(fish);
      return {fish,s:.1+i*.13,dir:i%2?1:-1,speed:.03+rng()*.03,phase:rng()*6,jump:-1,jumpIn:3+rng()*8,yaw:0};
    });
    const fishPoint=new THREE.Vector3(),fishAhead=new THREE.Vector3(),fishSide=new THREE.Vector3();
    function updateFish(dt){
      fishes.forEach(f=>{
        f.s+=f.dir*f.speed*dt;if(f.s>.9||f.s<.06){f.dir*=-1;f.s=THREE.MathUtils.clamp(f.s,.06,.9);}
        riverPath.getPointAt(f.s,fishPoint);riverPath.getPointAt(THREE.MathUtils.clamp(f.s+f.dir*.01,0,1),fishAhead);
        fishSide.subVectors(fishAhead,fishPoint).setY(0).normalize();
        const heading=Math.atan2(fishSide.x,fishSide.z);fishSide.set(fishSide.z,0,-fishSide.x);
        let turn=heading-f.yaw;turn=Math.atan2(Math.sin(turn),Math.cos(turn));f.yaw+=turn*(1-Math.exp(-dt*4));
        f.fish.position.copy(fishPoint).addScaledVector(fishSide,Math.sin(time*.9+f.phase)*.22);f.fish.position.y=-.21;
        let pitch=0;
        if(f.jump<0){f.jumpIn-=dt;if(f.jumpIn<=0)f.jump=0;}
        else{f.jump+=dt;const k=f.jump/.85;if(k>=1){f.jump=-1;f.jumpIn=4+rng()*9;}else{f.fish.position.y+=Math.sin(k*Math.PI)*.75;pitch=(k-.5)*2.2;}}
        f.fish.rotation.set(pitch,f.yaw,0);f.fish.userData.tail.rotation.y=Math.sin(time*(f.jump>=0?24:12)+f.phase)*.5;
      });
    }
    const riverSource=new THREE.CatmullRomCurve3([[-1.2,0,-.9],[-.2,0,.5],[1.2,0,1.5]].map(p=>new THREE.Vector3(...p)));
    const dummy=new THREE.Object3D(),bez=new THREE.Vector3();
    function startAvalanche(){
      if(avalanche.clock>=0)return;
      const source=riverSource.getPoint(.15);let first=1e9,last=0;
      chunks.forEach((c,i)=>{
        const k=.18+rng()*.25;
        c.start.copy(perch).lerp(source,k).add(new THREE.Vector3((rng()-.5)*1.6,.2+rng()*.4,(rng()-.5)*1.2));
        c.end.copy(riverSource.getPoint(.05+rng()*.45));c.end.x+=(rng()-.5)*.6;c.end.z+=(rng()-.5)*.6;c.end.y=-.2;
        c.ctrl.copy(c.start).lerp(c.end,.55);c.ctrl.y=Math.max(c.start.y*.55,c.end.y+1.2);
        c.delay=rng()*.7;c.dur=1.1+rng()*.7;c.size=.6+rng()*1.1;c.axis.set(rng()-.5,rng()-.5,rng()-.5).normalize();
        first=Math.min(first,c.delay+c.dur);last=Math.max(last,c.delay+c.dur);
      });
      avalanche.clock=0;avalanche.splashed=false;avalanche.splashAt=first;avalanche.end=last+1.6;
      splash.position.copy(riverSource.getPoint(.2)).setY(-.18);
    }
    function updateAvalanche(dt){
      if(avalanche.clock<0){chunkMesh.visible=false;return;}
      avalanche.clock+=dt;chunkMesh.visible=true;const now=avalanche.clock;
      chunks.forEach((c,i)=>{
        const k=(now-c.delay)/c.dur;
        if(k<0||k>1.05){dummy.scale.setScalar(0);}
        else{
          // Gravity: slow off the top, fast at the bottom, with a couple of hops on the way down.
          const e=Math.min(1,k)**1.7,u=1-e;
          bez.copy(c.start).multiplyScalar(u*u).addScaledVector(c.ctrl,2*u*e).addScaledVector(c.end,e*e);
          bez.y+=Math.abs(Math.sin(e*Math.PI*3))*.25*(1-e);
          dummy.position.copy(bez);dummy.quaternion.setFromAxisAngle(c.axis,now*9*c.size);dummy.scale.setScalar(c.size*(k>.92?Math.max(0,1-(k-.92)*12):1));
        }
        dummy.updateMatrix();chunkMesh.setMatrixAt(i,dummy.matrix);
      });
      chunkMesh.instanceMatrix.needsUpdate=true;
      // Snow dust rolls along behind the leading chunks.
      puffs.forEach((s,i)=>{const c=chunks[i*4],k=(now-c.delay)/c.dur;s.visible=k>0&&k<1.6;if(!s.visible)return;
        const e=Math.min(1,k)**1.7,u=1-e;s.position.copy(c.start).multiplyScalar(u*u).addScaledVector(c.ctrl,2*u*e).addScaledVector(c.end,e*e);s.position.y+=.25;
        s.scale.setScalar(.6+k*1.6);s.material.opacity=Math.max(0,.55*(1-k/1.6));});
      const sk=(now-avalanche.splashAt)/1.2;splash.visible=sk>0&&sk<1;
      if(sk>0&&!avalanche.splashed){avalanche.splashed=true;gush();}
      if(splash.visible){splash.scale.setScalar(.6+sk*2.2);splash.material.opacity=.8*(1-sk);}
      if(now>avalanche.end)avalanche.clock=-1;
    }
    // The bald eagle: perched on the peak (model) until startled, then soars (procedural) and comes back.
    const perched=new THREE.Group(),flyer=createEagle();flyer.visible=false;flyer.scale.setScalar(.85);world.add(perched,flyer);
    const eagle={state:"perched",clock:0,from:new THREE.Vector3(),pos:new THREE.Vector3(),look:new THREE.Vector3()};

    // Props and animals load in the background; the island shows as soon as the kit arrives.
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    let mountain=null;const animals=[],perch=new THREE.Vector3(MOUNTAIN.x,6,MOUNTAIN.y);
    const find=(root,prefix)=>{let hit=null;root.traverse(o=>{if(!hit&&o.name.startsWith(prefix))hit=o;});return hit;};
    loader.load("/models/island/kit.glb",gltf=>{
      if(disposed)return;
      const kit=gltf.scene;
      // Mountain: kept as its own mesh (it's clickable), recoloured onto the palette.
      const peak=find(kit,"Mountain");
      if(peak){peak.position.set(0,0,0);const geometry=bakeProp(peak);geometry.translate(0,-geometry.boundingBox.min.y,0);
        mountain=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.95}));
        mountain.scale.setScalar(MOUNTAIN_SCALE);mountain.position.set(MOUNTAIN.x,heightAt(MOUNTAIN.x,MOUNTAIN.y)-.25,MOUNTAIN.y);mountain.rotation.y=.5;world.add(mountain);
        // The highest point, where the eagle perches.
        const pos=geometry.attributes.position;let top=0;for(let i=1;i<pos.count;i++)if(pos.getY(i)>pos.getY(top))top=i;
        mountain.updateMatrix();peak.position.set(0,0,0);perch.fromBufferAttribute(pos,top).applyMatrix4(mountain.matrix);}
      // Trees and rocks: baked, then instanced.
      const tree=(prefix,n,scale,radius)=>{const node=find(kit,prefix);if(!node)return;node.position.set(0,0,0);const geometry=bakeProp(node);geometry.translate(0,-geometry.boundingBox.min.y,0);
        const set=createSwayingInstances(geometry,place(n,scale,1.8,.86,radius),foliage);swaying.push(set);world.add(set.mesh);return set;};
      autumn=tree("CommonTree_Autumn",6,.62,.85);tree("BirchTree",7,.55,.85);
      const rockNode=find(kit,"Rock");
      if(rockNode){rockNode.position.set(0,0,0);const geometry=bakeProp(rockNode);geometry.translate(0,-geometry.boundingBox.min.y*.7,0);
        // Rocks gather along the river banks and the rim.
        const spots=[];for(let i=0;i<16;i++){const p=i<10?riverBank(i):place(1,1,1.2,.95,.35)[0]?.position??meadow(1.2,.95);spots.push({position:p,rotation:rng()*6,scale:.8+rng()*1.1});}
        const set=createSwayingInstances(geometry,spots,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1}));world.add(set.mesh);}
      mount.dataset.ready="true";needsRender=true;
      loadAnimals();
      loader.load("/models/island/eagle.glb",gltf=>{
        if(disposed)return;
        const model=gltf.scene,box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
        model.traverse(o=>{if(o.isMesh)o.material=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.95});});
        model.scale.setScalar(.62/size.y);model.position.y=-box.min.y*.62/size.y;perched.add(model);
        perched.position.copy(perch);perched.rotation.y=.9;needsRender=true;
      },undefined,()=>{});
    },undefined,()=>{});
    function riverBank(i){const t=.08+i/10*.8,{x,z}=new THREE.CatmullRomCurve3([[-1.2,0,-.9],[-.2,0,.5],[1.2,0,1.5],[3,0,2.4],[4.9,0,3.6]].map(p=>new THREE.Vector3(...p))).getPoint(t),side=i%2?1:-1;
      const px=x+side*(1.15+rng()*.3),pz=z-side*(.55+rng()*.2);return new THREE.Vector3(px,heightAt(px,pz),pz);}

    function loadAnimals(){
      const kinds=[["stag",1],["deer",2],["fox",2],["bear",1]];
      kinds.forEach(([kind,count])=>loader.load(`/models/island/${kind}.glb`,gltf=>{
        if(disposed)return;
        const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3());
        for(let i=0;i<count;i++){
          const model=i?cloneSkinned(gltf.scene):gltf.scene,root=new THREE.Group(),body=new THREE.Group();
          body.add(model);body.scale.setScalar(ANIMALS[kind].height/size.y);model.position.y=-box.min.y;
          let gait=null;
          model.traverse(o=>{if(!o.isMesh)return;
            if(kind==="bear"){gait=createBearMaterial(o.geometry);o.material=gait.material;}
            else{o.material=o.material.clone();o.material.flatShading=true;o.material.roughness=.9;o.material.metalness=0;}
            o.frustumCulled=false;});
          const shadow=new THREE.Mesh(shadowGeometry,shadowMaterial);shadow.scale.setScalar(ANIMALS[kind].height*1.3);shadow.position.y=.03;
          root.add(body,shadow);world.add(root);
          const mixer=gltf.animations.length?new THREE.AnimationMixer(model):null,actions={};
          for(const clip of gltf.animations)actions[clip.name]=mixer.clipAction(clip);
          const animal={kind,root,mixer,actions,gait,swing:0,phase:0,bob:0,current:null,state:"idle",timer:1+rng()*4,target:new THREE.Vector2(),yaw:rng()*6,speed:0,cool:0};
          const start=kind==="bear"?new THREE.Vector3(-4.2,0,-4.2):meadow(1.4,.75);
          root.position.set(start.x,heightAt(start.x,start.z),start.z);
          // The bear waits behind the mountain until someone clicks it.
          if(kind==="bear"){animal.state="hidden";root.visible=false;}
          play(animal,"Idle",0);
          animals.push(animal);
        }
        needsRender=true;
      },undefined,()=>{}));
    }
    function play(animal,name,fade=.35){
      if(animal.gait){animal.current=name;return;}
      if(animal.current===name||!animal.actions[name])return;
      const next=animal.actions[name];next.reset().setEffectiveWeight(1).fadeIn(fade).play();
      animal.actions[animal.current]?.fadeOut(fade);animal.current=name;
    }
    const validSpot=(x,z)=>Math.hypot(x,z)<outline(Math.atan2(z,x))*.8&&Math.hypot(x-MOUNTAIN.x,z-MOUNTAIN.y)>MOUNTAIN_CLEAR;
    function wander(animal){
      for(let i=0;i<30;i++){const a=rng()*Math.PI*2,d=1.5+rng()*3,x=animal.root.position.x+Math.cos(a)*d,z=animal.root.position.z+Math.sin(a)*d;
        if(validSpot(x,z)){animal.target.set(x,z);animal.state="walk";animal.speed=ANIMALS[animal.kind].walk;play(animal,"Walk");return;}}
      animal.timer=2;
    }
    function flee(animal,from){
      if(animal.state==="hidden"||animal.state==="emerge"||animal.cool>0)return;
      const away=new THREE.Vector2(animal.root.position.x-from.x,animal.root.position.z-from.z).normalize();
      for(let i=0;i<12;i++){const turn=(rng()-.5)*1.4*(i/6),d=3.2+rng()*1.5,x=animal.root.position.x+(away.x*Math.cos(turn)-away.y*Math.sin(turn))*d,z=animal.root.position.z+(away.x*Math.sin(turn)+away.y*Math.cos(turn))*d;
        if(validSpot(x,z)){animal.target.set(x,z);break;}}
      animal.state="flee";animal.speed=ANIMALS[animal.kind].run;animal.cool=1.5;play(animal,"Gallop",.15);
    }
    // Clicking the mountain: the stag bolts out from behind it and joins the meadow.
    const emergePath=[new THREE.Vector2(-5.3,-1.4),new THREE.Vector2(-3.6,1.5),new THREE.Vector2(-1.4,3.3)];
    function startle(){
      scatter=1;bounce=1;startAvalanche();
      if(eagle.state==="perched"){eagle.state="flying";eagle.clock=0;eagle.from.copy(perch);}
      const bear=animals.find(a=>a.kind==="bear");
      if(bear&&bear.state==="hidden"){bear.root.visible=true;bear.state="emerge";bear.path=[...emergePath];bear.target.copy(bear.path.shift());bear.speed=ANIMALS.bear.run*.8;play(bear,"Gallop",0);event.current?.("bear");}
      else animals.forEach(a=>flee(a,new THREE.Vector3(MOUNTAIN.x,0,MOUNTAIN.y)));
    }
    function updateAnimal(animal,dt){
      animal.cool=Math.max(0,animal.cool-dt);
      if(animal.mixer)animal.mixer.update(dt);
      else if(animal.gait){
        // Ease into the gait; stride rate follows the actual pace.
        const [swing,rate,bob]=BEAR_GAITS[animal.current]??BEAR_GAITS.Idle,pace=animal.state==="walk"||animal.state==="flee"||animal.state==="emerge"?Math.max(.4,animal.speed/(animal.current==="Gallop"?ANIMALS.bear.run:ANIMALS.bear.walk)):1;
        const ease=1-Math.exp(-dt*6);animal.swing+=(swing-animal.swing)*ease;animal.bob+=(bob-animal.bob)*ease;animal.phase+=dt*rate*pace;
        const u=animal.gait.uniforms;u.uPhase.value=animal.phase;u.uSwing.value=animal.swing;u.uKnee.value=animal.swing*1.1;u.uLift.value=animal.swing*.05*u.uHeight.value;u.uNod.value=animal.swing*.15;u.uBob.value=animal.swing>.05?Math.abs(Math.sin(animal.phase))*animal.bob:Math.sin(animal.phase*.5)*animal.bob*.5;
      }
      const p=animal.root.position;
      if(animal.state==="idle"||animal.state==="eat"){animal.timer-=dt;if(animal.timer<=0)wander(animal);}
      else if(animal.state!=="hidden"){
        const dx=animal.target.x-p.x,dz=animal.target.y-p.z,dist=Math.hypot(dx,dz);
        if(dist<.12){
          if(animal.state==="emerge"&&animal.path.length){animal.target.copy(animal.path.shift());}
          else{const eat=rng()<.45;animal.state=eat?"eat":"idle";animal.timer=3+rng()*5;animal.speed=0;play(animal,eat?"Eating":"Idle",.5);}
        } else {
          // Ease into a run and out of it; turn smoothly toward where it's heading.
          const step=Math.min(dist,animal.speed*dt*Math.min(1,dist*1.5+.3));p.x+=dx/dist*step;p.z+=dz/dist*step;
          let turn=Math.atan2(dx,dz)-animal.yaw;turn=Math.atan2(Math.sin(turn),Math.cos(turn));animal.yaw+=turn*(1-Math.exp(-dt*(animal.state==="walk"?4:8)));
          // Walk cycle speed follows the actual pace, so feet don't skate.
          if(animal.current==="Walk"&&animal.actions.Walk)animal.actions.Walk.timeScale=animal.speed/ANIMALS[animal.kind].walk;
        }
      }
      p.y=heightAt(p.x,p.z);animal.root.rotation.y=animal.yaw;
    }

    // Take off with heavy flaps, ride a wide thermal around the island, then glide back to the perch.
    const SOAR=20,orbit=new THREE.Vector3();
    function updateEagle(dt){
      perched.visible=eagle.state==="perched";flyer.visible=!perched.visible;
      if(eagle.state==="perched")return;
      eagle.clock+=dt;const t=eagle.clock,a=t*.32+.6,radius=8.6;
      orbit.set(Math.cos(a)*radius,perch.y+1.6+Math.sin(t*.4)*.5,Math.sin(a)*radius);
      let flapStrength=.12,bank=.35;
      if(t<2.2){const k=t/2.2,e=k*k*(3-2*k);eagle.pos.copy(eagle.from).lerp(orbit,e);eagle.pos.y+=Math.sin(k*Math.PI)*1.2;flapStrength=.7;bank=.1;}
      else if(t<SOAR)eagle.pos.copy(orbit);
      else{const k=Math.min(1,(t-SOAR)/3),e=k*k*(3-2*k);eagle.pos.copy(orbit).lerp(perch,e);flapStrength=.25+k*.4;bank=.35*(1-k);if(k>=1){eagle.state="perched";return;}}
      eagle.look.copy(eagle.pos).sub(flyer.position);
      if(eagle.look.lengthSq()>1e-6){flyer.lookAt(world.localToWorld(eagle.look.copy(eagle.pos).add(eagle.look.normalize())));}
      flyer.position.copy(eagle.pos);flyer.rotateZ(-bank);
      // Mostly gliding, with a few lazy wingbeats now and then.
      const beat=Math.sin(time*7)*flapStrength*(t<2.2||t>SOAR?1:.4+.6*Math.max(0,Math.sin(time*.7)));
      flyer.userData.wings[0].rotation.z=beat+.08;flyer.userData.wings[1].rotation.z=-beat-.08;
    }

    // Pointer: stir the trees and scare the animals near it; drag to turn the island; click the mountain.
    const raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2(),hit=new THREE.Vector3();
    let pointerInside=false,lastX=0,lastY=0,lastMove=0,dragging=false,downX=0,yawVelocity=0,yaw=-.35,bounce=0,needsRender=true;
    const pick=(event,objects)=>{const rect=renderer.domElement.getBoundingClientRect();ndc.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(ndc,camera);return raycaster.intersectObjects(objects,false)[0];};
    function onMove(event){
      const now=performance.now(),dt=Math.max(16,now-lastMove),speed=Math.hypot(event.clientX-lastX,event.clientY-lastY)/dt;
      if(dragging||(event.buttons&1&&Math.abs(event.clientX-downX)>5)){dragging=true;yawVelocity+= (event.clientX-lastX)*.0009;}
      lastX=event.clientX;lastY=event.clientY;lastMove=now;
      const onMountain=mountain&&pick(event,[mountain]);
      renderer.domElement.style.cursor=dragging?"grabbing":onMountain?"pointer":"grab";
      const ground=pick(event,[island.surface]);
      if(!ground)return;
      hit.copy(world.worldToLocal(ground.point.clone()));pointerInside=true;
      const kick=Math.min(1,speed*.9);
      for(const set of swaying){const placements=set.mesh.userData.placements;placements.forEach((pl,i)=>{const d=Math.hypot(pl.position.x-hit.x,pl.position.z-hit.z);if(d<2.6){set.sway[i]=Math.min(.12,set.sway[i]+(1-d/2.6)*kick*.05);if(set===autumn&&kick>.15&&rng()<kick*.5)dropLeaf(i);}});}
      if(kick>.05)for(const animal of animals){if(Math.hypot(animal.root.position.x-hit.x,animal.root.position.z-hit.z)<2.3)flee(animal,hit);}
      needsRender=true;
    }
    function onDown(event){downX=event.clientX;lastX=event.clientX;lastY=event.clientY;dragging=false;}
    function onUp(event){
      if(!dragging&&mountain&&pick(event,[mountain]))startle();
      dragging=false;renderer.domElement.style.cursor="grab";needsRender=true;
    }
    const canvas=renderer.domElement;canvas.style.cursor="grab";canvas.style.touchAction="pan-y";
    canvas.addEventListener("pointermove",onMove);canvas.addEventListener("pointerdown",onDown);window.addEventListener("pointerup",onUp);
    canvas.addEventListener("pointerleave",()=>{pointerInside=false;});

    // Framing: the island sits right of the headline on wide screens and centred on tall ones.
    let tall=false;
    function frame(){
      const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;tall=camera.aspect<.85;
      const distance=tall?60:31;scene.fog.near=distance+3;scene.fog.far=distance*2.2+8;camera.position.set(.32,.36,.88).normalize().multiplyScalar(distance);
      camera.lookAt(0,tall?1.6:-.4,0);
      if(tall)camera.clearViewOffset();else camera.setViewOffset(w,h,-w*.17,h*.02,w,h);
      camera.updateProjectionMatrix();needsRender=true;
    }
    const resize=new ResizeObserver(frame);resize.observe(mount);frame();
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});observer.observe(mount);

    const clock=new THREE.Clock();let time=0;
    function draw(){
      raf=requestAnimationFrame(draw);
      const dt=Math.min(clock.getDelta(),.05);
      // Paused while another section is on screen (section 0 is the hero).
      if(!visible||document.hidden||(live.current&&!live.current.current.live.includes(0)))return;
      if(preference.matches&&!needsRender)return;
      tick(dt);
    }
    function tick(dt){
      const reduced=preference.matches,step=reduced?0:dt;time+=step;
      shared.uTime.value=time;shared.uBreeze.value=reduced?0:.035;shared.uGust.value=reduced?0:.07;
      surge*=Math.exp(-step*.9);flowTime+=step*(1+surge*3);water.uniforms.uTime.value=time;water.uniforms.uFlow.value=flowTime;water.uniforms.uSurge.value=surge;
      // Float and turn: a slow bob, drag inertia, and a lazy drift back toward the hero angle.
      yaw+=yawVelocity;yawVelocity*=Math.exp(-step*3.5);if(!dragging)yaw+=(-.35-yaw)*(1-Math.exp(-step*.25));
      world.rotation.y=yaw;world.position.y=Math.sin(time*.5)*.18;world.rotation.z=Math.sin(time*.31)*.012;
      for(const set of swaying){for(let i=0;i<set.sway.length;i++)set.sway[i]*=Math.exp(-step*2.2);set.update();}
      for(const animal of animals)updateAnimal(animal,step);
      // The mountain gives a little squash when clicked.
      if(mountain){bounce*=Math.exp(-step*4);const b=Math.sin(time*30)*bounce*.03;mountain.scale.set(MOUNTAIN_SCALE*(1+b),MOUNTAIN_SCALE*(1-b),MOUNTAIN_SCALE*(1+b));}
      scatter*=Math.exp(-step*.35);
      updateEagle(step);updateAvalanche(step);updateLeaves(step);updateGush(step);updateFish(step);
      birds.forEach(bird=>{const u=bird.userData,r=u.r+scatter*5,h=u.h+scatter*3.5;u.a+=step*u.speed*(1+scatter*1.8);
        const x=MOUNTAIN.x+Math.cos(u.a)*r,z=MOUNTAIN.y+Math.sin(u.a)*r,y=h+Math.sin(time*.9+u.flap)*.25;
        bird.position.set(x,y,z);bird.lookAt(world.localToWorld(new THREE.Vector3(MOUNTAIN.x+Math.cos(u.a+.2)*r,y,MOUNTAIN.y+Math.sin(u.a+.2)*r)));
        const flap=Math.sin(time*(9+scatter*8)+u.flap)*.75;bird.userData.wings[0].rotation.z=flap;bird.userData.wings[1].rotation.z=-flap;});
      clouds.forEach(cloud=>{const u=cloud.userData;u.a+=step*u.speed;cloud.position.set(Math.sin(u.a)*u.r,u.y+Math.sin(time*.2+u.r)*.3,-Math.abs(Math.cos(u.a))*u.r-2);});
      renderer.render(scene,camera);needsRender=false;
    }
    draw();
    // ?debug: step frames by hand (background tabs throttle requestAnimationFrame).
    if(new URLSearchParams(window.location.search).has("debug"))window.__islandStep=(frames=30)=>{for(let i=0;i<frames;i++)tick(1/30);return animals.map(a=>`${a.kind}:${a.state}`).join(" ");};
    if(window.__islandStep)window.__island={camera,animals,world,renderer,scene,THREE};

    return()=>{delete window.__islandStep;delete window.__island;
      disposed=true;cancelAnimationFrame(raf);resize.disconnect();observer.disconnect();
      canvas.removeEventListener("pointermove",onMove);canvas.removeEventListener("pointerdown",onDown);window.removeEventListener("pointerup",onUp);
      animals.forEach(a=>a.mixer.stopAllAction());
      scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat())if(m){m.map?.dispose();m.dispose();}});
      shadowTexture.dispose();glareTexture.dispose();puffTexture.dispose();renderer.dispose();canvas.remove();
    };
  },[]);
  return <div className="ht-canvas" ref={host} aria-hidden="true" />;
}
