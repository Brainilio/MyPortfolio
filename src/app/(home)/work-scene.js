"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getStage } from "./stage";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { random, createSpin, tilted, createFoliageMaterial, createBird, createCloud } from "./island-parts";
import { createBasket } from "./park-parts";
import { createBisonRig, createBisonAnimator } from "./bison-rig";
import { createMeadow, BASKET_SPOT } from "./work-meadow";
import { createCardRing } from "./work-ring";

// Work: a Yellowstone meadow at golden hour (work-meadow.js: the island, its peaks, river and lake, trees, geysers,
// ducks, deer and eagle), with a bison herd and a feed basket: click it and the herd comes running. The project cards
// ride over it (work-cards.js, in the page). No real-time shadows; full rate while feed falls, the herd runs or a
// geyser blows, 30 fps otherwise, only while the section is on screen.
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
const outline=a=>5.4*(1+.06*Math.sin(2*a+.9)+.05*Math.sin(5*a+1.7)+.03*Math.sin(9*a));
const BASKET=new THREE.Vector3(BASKET_SPOT[0],0,BASKET_SPOT[1]);

export default function WorkScene({ state, slot = 2, side = "left", projects = [], onReady }) {
  const ready=useRef(onReady);ready.current=onReady;
  const host=useRef(null);
  useEffect(()=>{
    const mount=host.current;
    let disposed=false,visible=true;
    // Drawn on the page's one shared canvas (stage.js), into this stage's rectangle; the stage is the hit area.
    const shared_=getStage();if(!shared_){ready.current?.();return;}const renderer=shared_.renderer;
    const canvas=mount;canvas.style.touchAction="pan-y";
    const preference=matchMedia("(prefers-reduced-motion: reduce)");
    const scene=new THREE.Scene();scene.fog=new THREE.Fog("#eec08e",40,80);
    const camera=new THREE.PerspectiveCamera(30,1,.3,200);
    const rng=random(5);

    // Golden hour: the sun low on the left (where it hangs in the sky) and little ambient, so the peaks' lit and
    // shadowed sides stand apart; a warm golden sky light with earth-coloured bounce from below.
    scene.add(new THREE.AmbientLight("#ffe8c0",.35),new THREE.HemisphereLight("#ffd4a0","#8b7340",.4));
    const sun=new THREE.DirectionalLight("#ffd580",2.2);sun.position.set(-8,12,6);scene.add(sun);

    // The island, spun by dragging (world), scaled up as a whole (its root group); the camera's distance suits it.
    const world=new THREE.Group();scene.add(world);
    const shared={uTime:{value:0},uBreeze:{value:.3},uGust:{value:.3}},foliage=createFoliageMaterial(shared);
    const meadow=createMeadow({outline,foliage,loader:new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),onLoad:()=>{needsRender=true;}});
    const GROW=1.3;meadow.group.scale.setScalar(GROW);world.add(meadow.group);
    const land=meadow.group,bushes=meadow.swaying,height=meadow.height;
    const on=(x,z)=>new THREE.Vector3(x,height(x,z),z);
    // The orbit card layout (work-ring.js): the project cards on a ring round the island, shown while it's chosen.
    const ring=createCardRing({projects,onLoad:()=>{needsRender=true;}});ring.group.visible=false;scene.add(ring.group);let ringMoving=false;
    // A few birds wheeling high over the peaks.
    const birdMaterial=new THREE.MeshStandardMaterial({color:"#3b2b33",flatShading:true,roughness:1,side:THREE.DoubleSide});
    const birds=Array.from({length:5},(_,i)=>{const bird=createBird(birdMaterial);bird.scale.setScalar(.9);Object.assign(bird.userData,{a:i/5*Math.PI*2,r:2.2+(i%3)*.7,h:6.4+(i%2)*.8,speed:.28+(i%4)*.05,flap:i*1.7});world.add(bird);return bird;});
    const ahead=new THREE.Vector3();
    // Sunrise: you've come from a night by the campfire, so as the section scrolls on, the sun climbs (deep orange low
    // down, paler gold as it rises). It rides with the camera, low on the left, so it stays in view.
    const sunCanvas=document.createElement("canvas");sunCanvas.width=sunCanvas.height=256;
    {const g=sunCanvas.getContext("2d"),grad=g.createRadialGradient(128,128,0,128,128,128);
      [[0,"rgba(255,248,226,1)"],[.16,"rgba(255,236,190,1)"],[.2,"rgba(255,206,150,.65)"],[.45,"rgba(255,170,120,.22)"],[1,"rgba(255,150,110,0)"]].forEach(([k,c])=>grad.addColorStop(k,c));
      g.fillStyle=grad;g.fillRect(0,0,256,256);}
    const sunTexture=new THREE.CanvasTexture(sunCanvas);sunTexture.colorSpace=THREE.SRGBColorSpace;
    const sunDisc=new THREE.Sprite(new THREE.SpriteMaterial({map:sunTexture,color:"#ffffff",transparent:true,depthWrite:false,fog:false,toneMapped:false}));
    sunDisc.scale.setScalar(16);sunDisc.renderOrder=-1;scene.add(camera);camera.add(sunDisc);
    const LOW=new THREE.Color("#ff8a4c"),HIGH=new THREE.Color("#fff2d6");let risen=-1;
    // A few warm clouds drifting round the peaks, lit pink and gold from below.
    const clouds=[[7.5,2.6,.8,0],[8.5,3.6,.65,1.7],[9,1.6,.7,3.4],[8,4.4,.55,4.8]].map(([r,y,k,a],i)=>{
      const cloud=createCloud(70+i);cloud.material.color.set("#fff1e6");cloud.material.emissive.set("#b4604a");cloud.material.emissiveIntensity=.22;
      cloud.scale.setScalar(k);cloud.userData={r,y,a,speed:.012+(i%2)*.006};scene.add(cloud);return cloud;});

    // The feed basket, its hay, and the pellets that pour into it.
    const basket=createBasket();basket.position.copy(on(BASKET.x,BASKET.z));basket.scale.setScalar(.34);basket.rotation.y=.4;land.add(basket);
    const hay=new THREE.Mesh(new THREE.IcosahedronGeometry(.2,1).scale(1,.4,1),new THREE.MeshStandardMaterial({color:"#e2c46a",flatShading:true,roughness:1}));
    hay.position.copy(basket.position).y+=.1;hay.visible=false;land.add(hay);
    const PELLETS=30,pelletMesh=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.028,0),new THREE.MeshStandardMaterial({color:"#c9a24e",flatShading:true,roughness:1}),PELLETS);
    pelletMesh.frustumCulled=false;land.add(pelletMesh);
    const pellets=Array.from({length:PELLETS},()=>({state:"idle",wait:0,t:0,pos:new THREE.Vector3(),vel:new THREE.Vector3(),spin:new THREE.Vector3()}));
    let food=0;const dummy=new THREE.Object3D();
    function pour(){
      if(preference.matches){food=1;needsRender=true;return callHerd();}
      pellets.forEach((p,i)=>{p.state="wait";p.wait=i*.03;p.t=0;const a=rng()*Math.PI*2,r=rng()*.12;p.pos.set(BASKET.x+Math.cos(a)*r,basket.position.y+1.4+rng()*.3,BASKET.z+Math.sin(a)*r);p.vel.set(0,-.5,0);p.spin.set(rng()*8,rng()*8,rng()*8);});
      callHerd();
    }
    function updatePellets(dt){
      let falling=false;
      pellets.forEach((p,i)=>{
        if(p.state==="wait"){p.wait-=dt;falling=true;if(p.wait<=0)p.state="fall";}
        if(p.state==="fall"){falling=true;p.t+=dt;p.vel.y-=6*dt;p.pos.addScaledVector(p.vel,dt);if(p.pos.y<hay.position.y+food*.05){food=Math.min(1,food+1.4/PELLETS);p.state="idle";}}
        dummy.position.copy(p.pos);dummy.rotation.set(p.t*p.spin.x,p.t*p.spin.y,p.t*p.spin.z);dummy.scale.setScalar(p.state==="fall"?1:0);
        dummy.updateMatrix();pelletMesh.setMatrixAt(i,dummy.matrix);
      });
      pelletMesh.instanceMatrix.needsUpdate=true;
      hay.scale.setScalar(.2+food*.8);hay.visible=food>.02;
      return falling;
    }

    // Dust: soft tan puffs kicked up by a wallowing bison, swelling as they rise and drift off, then fading away.
    const DUST=40,dustMesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshLambertMaterial({color:"#dcc296",flatShading:true,transparent:true,opacity:.55,depthWrite:false}),DUST);
    dustMesh.frustumCulled=false;land.add(dustMesh);
    const dust=Array.from({length:DUST},()=>({life:0,age:0,pos:new THREE.Vector3(),vel:new THREE.Vector3(),size:0,spin:0})),puff=new THREE.Object3D();let dustNext=0;
    function emitDust(b,amount,dt){
      dustNext-=amount*dt*18;
      while(dustNext<0){dustNext+=1;const d=dust.find(x=>x.age>=x.life);if(!d)break;const a=Math.random()*Math.PI*2,r=b.length*(.15+Math.random()*.35),p=b.root.position;
        d.pos.set(p.x+Math.cos(a)*r,p.y+.05,p.z+Math.sin(a)*r);d.vel.set(Math.cos(a)*.25,.35+Math.random()*.35,Math.sin(a)*.25);
        d.age=0;d.life=1.4+Math.random()*.9;d.size=b.height*(.08+Math.random()*.08);d.spin=Math.random()*6;}
    }
    function updateDust(dt){
      let any=false;
      dust.forEach((d,i)=>{
        if(d.age<d.life){any=true;d.age+=dt;d.pos.addScaledVector(d.vel,dt);d.vel.multiplyScalar(Math.exp(-dt*1.6));d.vel.y-=.05*dt;}
        const u=Math.min(1,d.age/d.life),grow=d.age<d.life?d.size*(1+u*2.2)*Math.sin(Math.PI*Math.min(1,u*1.15+.05)):0;
        puff.position.copy(d.pos);puff.rotation.set(d.spin+u,d.spin*.7,0);puff.scale.setScalar(Math.max(0,grow));puff.updateMatrix();dustMesh.setMatrixAt(i,puff.matrix);
      });
      dustMesh.instanceMatrix.needsUpdate=true;return any;
    }
    // The herd: big, cartoon-scale bison, each a little different in size, grazing and ambling about the meadow; one
    // or two lying down; the red calf (55% of its mother) never more than a body length and a half from her. The rig
    // and the animation are in bison-rig.js; this decides where each one goes and what it's doing.
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),herd=[],LIMIT=.72,SIZES=[.98,.9,.82,.93];let leash=1;
    const blocked=(x,z,pad)=>meadow.blocked(x,z,pad)||Math.hypot(x-BASKET.x,z-BASKET.z)<pad+.3;
    const inside=(x,z,pad=.55)=>Math.hypot(x,z)<outline(Math.atan2(z,x))*LIMIT&&!blocked(x,z,pad);
    loader.load("/models/island/bison.glb",gltf=>{
      if(disposed)return;
      const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3());
      meadow.spots.forEach(([x,z],i)=>{
        const calf=i===meadow.spots.length-1,model=i?gltf.scene.clone():gltf.scene,root=new THREE.Group();let rig=null;
        model.traverse(o=>{if(!o.isMesh)return;
          if(calf){const g=o.geometry.clone(),c=g.attributes.color,tint=new THREE.Color(),deep=new THREE.Color("#a24f22"),bright=new THREE.Color("#e08a4c");
            if(c)for(let k=0;k<c.count;k++){const l=(c.getX(k)+c.getY(k)+c.getZ(k))/3;tint.copy(deep).lerp(bright,Math.min(1,l*3));c.setXYZ(k,tint.r,tint.g,tint.b);}o.geometry=g;}
          rig??=createBisonRig(o.geometry);o.material=rig.material;o.frustumCulled=false;o.castShadow=o.receiveShadow=false;});
        const h=calf?SIZES[0]*.55:SIZES[i];model.scale.setScalar(h/size.y);model.position.y=-box.min.y*h/size.y;root.add(model);
        root.position.copy(on(x,z));land.add(root);
        // Each with its own random seed: its stride starts at a random point, its timers are offset, its pace ±8%.
        // One adult starts the scene lying down.
        const resting=i===2,seed=random(40+i*7),anim=createBisonAnimator(rig,{calf,seed,resting});
        herd.push({root,anim,calf,height:h,length:h*size.z/size.y,radius:h*size.z/size.y*.4,yaw:seed()*6,state:resting?"rest":"graze",timer:1+seed()*5,gait:"walk",
          target:new THREE.Vector2(x,z),feeding:false,face:null,eatUntil:0,resting,restUntil:resting?40+seed()*40:0,startAt:0,alarmUntil:0});
      });
      // The calf stays within a body length and a half (of its mother's) of her.
      leash=herd[0].length*1.5;
      needsRender=true;
    },undefined,()=>{});
    // Feeding time: the standing bison look up (alarm), brace, then trot over and stand round the far side of the
    // basket; the calf notices a moment after its mother. Bison lying down stay down.
    function callHerd(){
      const now=time,going=herd.filter(b=>!b.resting),adults=going.filter(b=>!b.calf);
      going.forEach(b=>{const k=adults.indexOf(b),a=b.calf?Math.PI*.15-.45:Math.PI*(.12+.76*k/Math.max(1,adults.length-1)),r=b.calf?.85:1.05;
        b.target.set(BASKET.x+Math.cos(a)*r,BASKET.z-Math.sin(a)*r);b.feeding=true;b.face=null;b.state="move";b.gait="trot";
        b.startAt=now+.8+(b.calf?.3:0);b.alarmUntil=b.startAt;});
    }
    function tapBison(b){if(b.resting)return;b.alarmUntil=time+1.6;if(b.state==="move"&&!b.feeding){b.state="graze";b.timer=1.8;}}
    // A spot is free if it's on open ground and clear of every other bison (where it stands, and where it's headed).
    const free=(b,x,z)=>inside(x,z,b.radius+.15)&&herd.every(o=>o===b||(Math.hypot(x-o.root.position.x,z-o.root.position.z)>b.radius+o.radius+.3&&(o.state!=="move"||Math.hypot(x-o.target.x,z-o.target.y)>b.radius+o.radius+.3)));
    function wander(b,from,min,max){for(let tries=0;tries<20;tries++){const a=Math.random()*Math.PI*2,r=min+Math.random()*(max-min),x=from.x+Math.cos(a)*r,z=from.z+Math.sin(a)*r;if(free(b,x,z)){b.target.set(x,z);return true;}}return false;}
    function updateBison(b,dt,now){
      const p=b.root.position,mother=herd[0];b.timer-=dt;
      if(b.state==="eat"){if(now>b.eatUntil){b.state="graze";b.feeding=false;b.face=null;b.timer=1+Math.random()*2;}}
      else if(b.state==="rest"){if(now>b.restUntil-(b.wallowing?1.6:0))b.wallowing=false;if(now>b.restUntil){b.resting=false;if(b.anim.state.rest<.04){b.state="graze";b.timer=2;}}}
      else if(b.state==="graze"&&b.timer<=0){
        const r=Math.random();
        if(!b.calf&&r<.08&&!herd.some(o=>o.wallowing)){
          // A dust bath: down, a few rolls onto its side with the legs kicking, then back up.
          b.state="rest";b.resting=true;b.wallowing=true;b.restUntil=now+9;}
        else if(!b.calf&&r<.18&&herd.filter(o=>o.resting).length<2){b.state="rest";b.resting=true;b.restUntil=now+30+Math.random()*40;}
        // The calf's play: a burst of two to four gallops darting here and there round its mother.
        else if(b.calf&&r<.7){b.dashes=1+Math.floor(Math.random()*3);if(wander(b,mother.root.position,leash*.35,leash*.95)){b.state="move";b.gait="gallop";}else b.timer=.6;}
        else if(wander(b,b.calf?mother.root.position:p,b.calf?leash*.3:.8,b.calf?leash*.7:2.2)){b.state="move";b.gait=b.calf?"trot":"walk";}
        else b.timer=1;
      } else if(b.state==="move"&&now>=b.startAt){
        const dx=b.target.x-p.x,dz=b.target.y-p.z,dist=Math.hypot(dx,dz);
        // Someone already standing on the spot: stop short of them.
        const taken=herd.some(o=>o!==b&&o.state!=="move"&&Math.hypot(b.target.x-o.root.position.x,b.target.y-o.root.position.z)<b.radius+o.radius&&Math.hypot(p.x-o.root.position.x,p.z-o.root.position.z)<(b.radius+o.radius)*1.3);
        if(dist<.08||taken){
          if(b.feeding){b.state="eat";b.eatUntil=now+6;b.face=Math.atan2(BASKET.x-p.x,BASKET.z-p.z);}
          // (Mid-burst, the calf darts straight off again.)
          else if(b.calf&&b.gait==="gallop"&&b.dashes>0&&wander(b,mother.root.position,leash*.35,leash*.95)){b.dashes--;}
          else{b.state="graze";b.timer=b.calf?1+Math.random()*2:4+Math.random()*7;}
        } else {
          // Steering: head for the target, bending the path round any bison in the way ahead (passing on whichever
          // side it's already on), then walk where it's facing, slowing into turns, at the pace its stride sets.
          const ux=dx/dist,uz=dz/dist,px=-uz,pz=ux;let wx=ux,wz=uz;
          for(const o of herd){if(o===b)continue;const rx=o.root.position.x-p.x,rz=o.root.position.z-p.z,d=Math.hypot(rx,rz),reach=(b.radius+o.radius)*2.4;
            if(d>reach||d>dist+o.radius)continue;const ahead=(rx*ux+rz*uz)/Math.max(d,1e-3);if(ahead<=0)continue;
            // Push the heading sideways, away from the side the other is on.
            const side=rx*px+rz*pz>0?1:-1,k=(1-d/reach)*ahead*1.8;wx-=px*side*k;wz-=pz*side*k;}
          const head=Math.atan2(wx,wz);let turn=head-b.yaw;turn=Math.atan2(Math.sin(turn),Math.cos(turn));
          b.yaw+=turn*(1-Math.exp(-dt*(dist<.4?6:3)));
          const pace=b.anim.speed(b.gait,b.height*.55)*(.35+.65*Math.max(0,Math.cos(Math.min(Math.abs(turn),1.5))));
          const step=Math.min(dist,pace*dt);p.x+=Math.sin(b.yaw)*step;p.z+=Math.cos(b.yaw)*step;
        }
      }
      // The calf follows its mother: if she's more than a body length and a half away it goes after her (trotting if
      // she's well away, galloping if far), a beat after it notices.
      if(b.calf&&!b.feeding&&mother){const m=mother.root.position,away=Math.hypot(p.x-m.x,p.z-m.z);
        if(away>leash&&(b.state!=="move"||Math.hypot(b.target.x-m.x,b.target.y-m.z)>leash*.8)){
          const a=Math.atan2(p.z-m.z,p.x-m.x);b.target.set(m.x+Math.cos(a)*leash*.5,m.z+Math.sin(a)*leash*.5);
          if(b.state!=="move")b.startAt=now+.3;b.state="move";b.gait=away>leash*1.3?"gallop":"trot";}}
      if(b.face!==null){let turn=b.face-b.yaw;turn=Math.atan2(Math.sin(turn),Math.cos(turn));b.yaw+=turn*(1-Math.exp(-dt*3));}
      // Big bodies never overlap: pushed apart from any neighbour that's too close (all the way if the other is lying
      // down and won't budge, halfway otherwise; the other takes the other half on its turn).
      for(const o of herd){if(o===b)continue;const dx=p.x-o.root.position.x,dz=p.z-o.root.position.z,d=Math.hypot(dx,dz),min=b.radius+o.radius;
        if(d<min&&d>1e-4&&!b.resting){const push=(min-d)*(o.resting?1:.5)*Math.min(1,dt*10);p.x+=dx/d*push;p.z+=dz/d*push;}}
      b.anim.update(dt,{moving:b.state==="move"&&now>=b.startAt&&b.anim.state.rest<.05,gait:b.gait,eating:b.state==="eat",resting:b.resting,alarmed:now<b.alarmUntil,wallow:!!b.wallowing});
      if(b.anim.state.dust>.05)emitDust(b,b.anim.state.dust,dt);
      p.y=height(p.x,p.z);b.root.rotation.y=b.yaw;
    }

    // Pointer: drag to spin the island; hover the basket to wobble it, tap it to pour in feed; tap a geyser to set it
    // off; tap a bison to startle it.
    const raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2();let onBasket=false;
    const pick=(event,objects)=>{const rect=canvas.getBoundingClientRect();ndc.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(ndc,camera);return raycaster.intersectObjects(objects,true)[0];};
    const spin=createSpin(canvas,{rest:0,
      over:event=>{
        // A card under the cursor lifts (and holds the ring); otherwise the basket, the herd and the geysers are tappable.
        const card=ring.group.visible?pick(event,ring.meshes):null;ring.hover(card?ring.indexOf(card.object):-1);if(card){needsRender=true;return true;}
        return (onBasket=!!pick(event,[basket,hay]))||!!pick(event,herd.map(b=>b.root))||!!pick(event,meadow.geysers);},
      onTap:event=>{
        const card=ring.group.visible&&pick(event,ring.meshes);if(card){const p=ring.project(ring.indexOf(card.object));if(p)window.location.href=`/project/${p.slug}/`;return;}
        if(pick(event,[basket,hay])){pour();return;}
        const vent=pick(event,meadow.geysers);if(vent){meadow.erupt(vent.object);needsRender=true;return;}
        const owner=(hit,list)=>list.find(x=>{let o=hit.object;while(o&&o!==x.root)o=o.parent;return o===x.root;});
        // Tap a bison and it startles: head up, tail up, a brace.
        const struck=pick(event,herd.map(b=>b.root));if(struck){const b=owner(struck,herd);if(b){tapBison(b);needsRender=true;}}
      }});
    canvas.addEventListener("pointerleave",()=>{onBasket=false;ring.hover(-1);});
    // Hover (a mouse only): the pines near the cursor stir, the faster the cursor the more. Passive under the drag.
    const ground=land.children[0].children[0],hover=new THREE.Vector3();let hoverX=0,hoverY=0,hoverAt=0;
    function onHover(event){
      if(event.pointerType!=="mouse"||event.buttons||preference.matches)return;
      const now=performance.now(),speed=Math.hypot(event.clientX-hoverX,event.clientY-hoverY)/Math.max(16,now-hoverAt);hoverX=event.clientX;hoverY=event.clientY;hoverAt=now;
      const kick=Math.min(1,speed*.9);if(kick<.03)return;
      const hit=pick(event,[ground]);if(!hit)return;land.worldToLocal(hover.copy(hit.point));
      for(const set of bushes)set.mesh.userData.placements.forEach((p,i)=>{const d=Math.hypot(p.position.x-hover.x,p.position.z-hover.z);if(d<1.4)set.sway[i]=Math.min(.22,set.sway[i]+(1-d/1.4)*kick*.09);});
      needsRender=true;
    }
    canvas.addEventListener("pointermove",onHover);

    // Framing: the island in the middle, the camera on an orbit round it; only its attitude (steeper arriving, lower
    // leaving) changes.
    let tall=false,attitude=0;const VIEW=new THREE.Vector3(0,.34,1).normalize(),focus=new THREE.Vector3(0,.9,0),viewDir=new THREE.Vector3();
    let closeUp=null;// (?debug only: { from, at } to inspect something up close)
    function placeCamera(){if(closeUp){camera.position.copy(closeUp.from);camera.lookAt(closeUp.at);return;}camera.position.copy(tilted(VIEW,attitude,viewDir)).multiplyScalar(distance).add(focus);camera.lookAt(focus);}
    // How far back the camera sits, from the screen's shape: the island spans about half the width on a desktop
    // screen (80% on a phone), whatever its proportions. (Measured: at 27 units back and 4:3, the unscaled island
    // spans 59% of the width, so its width on screen is ~21.2 / (distance × aspect).)
    let distance=27;
    const fit=aspect=>THREE.MathUtils.clamp(21.2*GROW/((aspect<.85?.8:.5)*aspect),24,90);
    function frame(){
      const w=mount.clientWidth,h=mount.clientHeight;camera.aspect=w/h;tall=camera.aspect<.85;distance=fit(camera.aspect);scene.fog.near=distance+12;scene.fog.far=distance*2.4+20;
      if(tall)camera.setViewOffset(w,h,0,h*.2,w,h);else camera.setViewOffset(w,h,side==="center"?0:(side==="left"?.17:-.17)*w,side==="center"?-h*.01:h*.07,w,h);
      camera.updateProjectionMatrix();placeCamera();needsRender=true;
    }
    const resize=new ResizeObserver(frame);resize.observe(mount);
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});observer.observe(mount);

    let time=0,since=0,needsRender=true;
    function tick(dt){
      const reduced=preference.matches,step=reduced?0:dt;time+=step;
      const falling=updatePellets(dt);
      // Food drains while the herd eats.
      if(herd.some(b=>b.state==="eat"))food=Math.max(0,food-dt*.12);
      basket.rotation.z=onBasket&&!reduced?Math.sin(time*9)*.04:0;
      world.rotation.y=spin.update(dt);
      const goal=reduced?0:state.current.tilt[slot];attitude+=(goal-attitude)*(1-Math.exp(-dt*6));placeCamera();
      herd.forEach(b=>updateBison(b,step,time));
      const dusty=updateDust(step);
      world.position.y=Math.sin(time*.45)*.1;meadow.update(time,step);
      // The card ring: turned by the scroll through the section (25° per 100px).
      ring.group.visible=state.current.cardLayout==="A";
      if(ring.group.visible){const run=Math.max(1,(mount.closest("section")?.offsetHeight??innerHeight)-innerHeight);ringMoving=ring.update(dt,-state.current.progress[slot]*run/100*25,reduced);}else ringMoving=false;
      // The sun's climb follows the scroll through the section (reduced motion: already up).
      const rise=reduced?1:smooth(state.current.progress[slot]/.75);
      if(Math.abs(rise-risen)>1e-3){risen=rise;sunDisc.position.set(-15+rise*2,-6+rise*9,-40);sunDisc.material.color.copy(LOW).lerp(HIGH,rise);}
      clouds.forEach(cloud=>{const u=cloud.userData;u.a+=step*u.speed;cloud.position.set(Math.cos(u.a)*u.r,u.y+Math.sin(time*.2+u.r)*.2,-Math.abs(Math.sin(u.a))*u.r-1.5);});
      shared.uTime.value=time;shared.uBreeze.value=reduced?0:.3;shared.uGust.value=reduced?0:.3;
      for(const set of bushes){for(let i=0;i<set.sway.length;i++)set.sway[i]*=Math.exp(-dt*2.2);set.update();}
      birds.forEach(bird=>{const u=bird.userData;u.a+=step*u.speed;const x=-.2+Math.cos(u.a)*u.r,z=-2+Math.sin(u.a)*u.r,y=u.h+Math.sin(time*.8+u.flap)*.25;
        bird.position.set(x,y,z);bird.lookAt(world.localToWorld(ahead.set(-.2+Math.cos(u.a+.2)*u.r,y,-2+Math.sin(u.a+.2)*u.r)));
        const flap=Math.sin(time*8+u.flap)*.7;u.wings[0].rotation.z=flap;u.wings[1].rotation.z=-flap;});
      needsRender=false;
      return ringMoving||falling||dusty||onBasket||spin.busy||meadow.erupting()||herd.some(b=>(b.feeding&&b.state==="move")||b.alarmUntil>time)||Math.abs(goal-attitude)>.05||bushes.some(set=>set.sway.some(v=>v>.003));
    }
    // Full rate while feed falls, the herd runs to it or the basket is hovered, 30 fps for the grazing in between.
    let busy=true;
    // Called by the shared frame loop; returns whether anything changed (so the canvas needs redrawing).
    function draw(dt){
      dt=Math.min(dt,.05);since+=dt;
      if(!visible||document.hidden||!state.current.live.includes(slot))return false;
      if(preference.matches&&!needsRender&&!onBasket&&!spin.busy&&!pellets.some(p=>p.state!=="idle"))return false;
      if(!busy&&since<1/30-.002)return false;
      busy=tick(Math.min(since,.1));since=0;return true;
    }
    frame();tick(0);mount.dataset.ready="true";
    const entry={mount,scene,camera,draw,exposure:1.05,fade:null},unregister=shared_.register(entry);
    // (No fade toward an edge: the island sits in the middle, the cards round it.)
    const readyTimer=setTimeout(()=>ready.current?.(),0);
    if(new URLSearchParams(window.location.search).has("debug"))window.__work={camera,herd,world,scene,renderer,pour,THREE,meadow,ring,closeUp:v=>{closeUp=v;}};

    return()=>{
      clearTimeout(readyTimer);delete window.__work;disposed=true;unregister();resize.disconnect();observer.disconnect();
      spin.dispose();canvas.removeEventListener("pointermove",onHover);
      scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat())m?.dispose();});
      sunTexture.dispose();meadow.dispose();ring.dispose();
    };
  },[state,slot]);
  return <div className="ht-canvas" ref={host} aria-hidden="true" />;
}
