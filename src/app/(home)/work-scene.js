"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { random, createIsland, createBearMaterial, createSpin } from "./island-parts";
import { createFin, createBasket } from "./park-parts";

// Work as the prairie in miniature, the island's golden-hour cousin: rolling prairie with Garden-of-the-Gods fins and
// scattered sandstone boulders, a small
// bison herd with a calf, prairie dogs on their mounds, and a feed basket: click it and the herd comes running. The
// project cards themselves roll down an arc beside it (in the page). No real-time shadows; full rate while feed
// falls or the basket is hovered, 30 fps otherwise, only while the section is on screen. The full-size prairie lives
// in the Lab.
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
const outline=a=>5.4*(1+.06*Math.sin(2*a+.9)+.05*Math.sin(5*a+1.7)+.03*Math.sin(9*a));
// Rolling prairie: the back rises into a bench where the fins stand, swells and little knolls roll across the middle,
// and a shallow dry wash winds through the front. Several sizes of roll at once, so no one or two big humps.
function heightAt(x,z) {
  const edge=Math.hypot(x,z)/outline(Math.atan2(z,x));
  let h=.42*smooth((-z-.6)/2.6)*(.8+.2*Math.sin(x*1.3));
  h+=.13*Math.sin(x*1.15+.4)*Math.cos(z*1.35-.7)+.07*Math.sin(x*2.6-z*2.1+1.3)+.035*Math.sin(x*5.1+z*4.3);
  for(const [kx,kz,r,k] of KNOLLS)h+=k*smooth(1-Math.hypot(x-kx,z-kz)/r);
  const wash=z-1.15-.45*Math.sin(x*.85+.6);h-=.2*Math.exp(-wash*wash/.18);
  return h-.3*smooth((edge-.84)/.16);
}
const noRiver=()=>({d:99,t:0});
// Bison gaits: leg swing (rad), stride rate, bob (fraction of height), knee fold, foot lift (fraction), nod.
const GAITS={Graze:[0,1.1,.003,0,0,.04],Walk:[.36,3.4,.006,.6,.035,.09],Run:[.62,7.5,.02,.95,.06,.14]};
// Fins along the back bench and a few smaller ones out toward the sides (x, z, width, height, depth, lean); knolls
// (x, z, radius, height); the prairie dogs' mounds and the feed basket near the front.
const FINS=[[-2.6,-2.4,1.5,2.6,.6,.05],[-1.1,-3.3,1.1,1.9,.5,-.04],[2.4,-2.6,1.3,2.2,.55,.06],[.7,-3.7,.7,1.3,.35,.03],[3.6,-.9,.8,1.25,.4,-.08],[-3.7,-.6,.75,1.1,.38,.07]];
const KNOLLS=[[-1.6,.2,1.1,.16],[1.8,.1,1.2,.13],[.1,-1.4,.9,.1],[-2.8,2,.9,.08]];
const MOUNDS=[[2.4,1.3],[-2.9,1.2],[-.6,3]],BASKET=new THREE.Vector3(1.1,0,2);
const blocked=(x,z,pad)=>FINS.some(([fx,fz,w])=>Math.hypot(x-fx,z-fz)<w*.55+pad)||Math.hypot(x-BASKET.x,z-BASKET.z)<pad+.3;

export default function WorkScene({ state, slot = 2, side = "left", onReady }) {
  const ready=useRef(onReady);ready.current=onReady;
  const host=useRef(null);
  useEffect(()=>{
    const mount=host.current;
    let renderer,disposed=false,raf=0,visible=true;
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"}); } catch { ready.current?.(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    mount.appendChild(renderer.domElement);
    const canvas=renderer.domElement;canvas.style.touchAction="pan-y";
    const preference=matchMedia("(prefers-reduced-motion: reduce)");
    const scene=new THREE.Scene();scene.fog=new THREE.Fog("#eeae94",40,80);
    const camera=new THREE.PerspectiveCamera(30,1,.3,200);
    const rng=random(5);

    // Golden hour: a low warm sun from the back left, a peach sky light.
    scene.add(new THREE.HemisphereLight("#ffe6c4","#5b3048",1.35));
    const sun=new THREE.DirectionalLight("#ffc27a",3);sun.position.set(-10,7,-8);scene.add(sun);
    const fill=new THREE.DirectionalLight("#ffd9c2",.8);fill.position.set(6,5,10);scene.add(fill);

    const world=new THREE.Group();scene.add(world);
    const island=createIsland(13,{outline,heightAt,riverDistance:noRiver,depth:.85,hub:new THREE.Vector2(-1.1,-3.3),scatter:.8,grass:["#b89a52","#c4a65a","#a98d4c"],edge:"#9a7c46"});world.add(island.group);
    const on=(x,z,lift=0)=>new THREE.Vector3(x,heightAt(x,z)+lift,z);
    FINS.forEach(([x,z,w,h,d,lean])=>{const fin=createFin(rng,w,h,d);fin.position.copy(on(x,z,-.15));fin.rotation.set(0,(rng()-.5)*.6,lean);world.add(fin);});
    // Sandstone boulders: scree piled at the foot of each fin, and a few loners out on the grass.
    {const tints=["#a8562f","#bd6a3e","#8f4426","#c98a5a"].map(c=>new THREE.Color(c)),spots=[];
      FINS.forEach(([fx,fz,w])=>{for(let k=0;k<4;k++){const a=rng()*Math.PI*2,r=w*.5+.15+rng()*.35;spots.push([fx+Math.cos(a)*r,fz+Math.sin(a)*r*.7,.07+rng()*.12]);}});
      [[-1.5,-1.4,.22],[-1.15,-1.7,.13],[1.9,-1,.17],[.6,.7,.12],[-.4,-2.2,.16],[2.9,.9,.1],[-2.2,1.6,.13]].forEach(p=>spots.push(p));
      const rocks=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshStandardMaterial({flatShading:true,roughness:1}),spots.length),d=new THREE.Object3D();
      spots.forEach(([x,z,s],i)=>{d.position.copy(on(x,z,s*.25));d.rotation.set(rng(),rng()*6,rng());d.scale.set(s,s*.7,s*(.8+rng()*.4));d.updateMatrix();rocks.setMatrixAt(i,d.matrix);rocks.setColorAt(i,tints[i%4]);});
      world.add(rocks);}
    // Sage bushes dotted over the grass.
    {const tints=["#8a9a5c","#7a8b52","#94a066"].map(c=>new THREE.Color(c)),count=34,bushes=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0).scale(1,.6,1),new THREE.MeshStandardMaterial({flatShading:true,roughness:1}),count),d=new THREE.Object3D();let n=0;
      for(let tries=0;n<count&&tries<400;tries++){const a=rng()*Math.PI*2,r=Math.sqrt(rng())*outline(a)*.88,x=Math.cos(a)*r,z=Math.sin(a)*r;
        if(blocked(x,z,.3)||MOUNDS.some(([mx,mz])=>Math.hypot(x-mx,z-mz)<.6))continue;
        const s=.1+rng()*.14;d.position.copy(on(x,z,s*.2));d.rotation.y=rng()*6;d.scale.setScalar(s);d.updateMatrix();bushes.setMatrixAt(n,d.matrix);bushes.setColorAt(n,tints[n%3]);n++;}
      bushes.count=n;world.add(bushes);}

    // The feed basket, its hay, and the pellets that pour into it.
    const basket=createBasket();basket.position.copy(on(BASKET.x,BASKET.z));basket.scale.setScalar(.34);basket.rotation.y=.4;world.add(basket);
    const hay=new THREE.Mesh(new THREE.IcosahedronGeometry(.2,1).scale(1,.4,1),new THREE.MeshStandardMaterial({color:"#e2c46a",flatShading:true,roughness:1}));
    hay.position.copy(basket.position).y+=.1;hay.visible=false;world.add(hay);
    const PELLETS=30,pelletMesh=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.028,0),new THREE.MeshStandardMaterial({color:"#c9a24e",flatShading:true,roughness:1}),PELLETS);
    pelletMesh.frustumCulled=false;world.add(pelletMesh);
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

    // The herd: a few bison grazing and ambling about the mesa, the calf (red coat) never far from its mother.
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),herd=[],LIMIT=.72;
    const inside=(x,z)=>Math.hypot(x,z)<outline(Math.atan2(z,x))*LIMIT&&!blocked(x,z,.35);
    loader.load("/models/island/bison.glb",gltf=>{
      if(disposed)return;
      const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3());
      const spots=[[-1.4,.2],[.4,-.9],[1.6,.4],[-.3,1.1],[-.8,-.6]];
      spots.forEach(([x,z],i)=>{
        const calf=i===spots.length-1,model=i?gltf.scene.clone():gltf.scene,root=new THREE.Group();let gait=null;
        model.traverse(o=>{if(!o.isMesh)return;
          if(calf){const g=o.geometry.clone(),c=g.attributes.color,tint=new THREE.Color(),deep=new THREE.Color("#a24f22"),bright=new THREE.Color("#e08a4c");
            if(c)for(let k=0;k<c.count;k++){const l=(c.getX(k)+c.getY(k)+c.getZ(k))/3;tint.copy(deep).lerp(bright,Math.min(1,l*3));c.setXYZ(k,tint.r,tint.g,tint.b);}o.geometry=g;}
          gait??=createBearMaterial(o.geometry,{hip:.27});o.material=gait.material;o.frustumCulled=false;});
        const h=calf?.32:.55;model.scale.setScalar(h/size.y);model.position.y=-box.min.y*h/size.y;root.add(model);
        root.position.copy(on(x,z));world.add(root);
        herd.push({root,gait,calf,yaw:rng()*6,state:"graze",timer:1+rng()*5,speed:0,gaitName:"Graze",swing:0,phase:rng()*6,head:0,turn:0,eatT:rng()*5,target:new THREE.Vector2(x,z),feeding:false,face:null,eatUntil:0});
      });
      needsRender=true;
    },undefined,()=>{});
    // Feeding time: the adults and the calf trot over and stand round the far side of the basket.
    function callHerd(){
      herd.forEach((b,k)=>{const a=Math.PI*(.15+.7*k/Math.max(1,herd.length-1)),r=b.calf?.42:.62;
        b.target.set(BASKET.x+Math.cos(a)*r,BASKET.z-Math.sin(a)*r);b.feeding=true;b.face=null;b.state="move";b.gaitName="Run";b.speed=b.calf?1:.85;});
    }
    function updateBison(b,dt,now){
      const p=b.root.position;b.timer-=dt;
      if(b.state==="eat"){if(now>b.eatUntil){b.state="graze";b.feeding=false;b.face=null;b.timer=0;}}
      else if(b.state==="graze"&&b.timer<=0){
        // Wander a little; the calf stays by its mother (the first bison).
        for(let tries=0;tries<12;tries++){const from=b.calf?herd[0].root.position:p,a=rng()*Math.PI*2,r=b.calf?.4+rng()*.5:.6+rng()*1.4,x=from.x+Math.cos(a)*r,z=from.z+Math.sin(a)*r;if(inside(x,z)){b.target.set(x,z);break;}}
        b.state="move";const run=b.calf&&rng()<.5;b.gaitName=run?"Run":"Walk";b.speed=run?.9:.22+rng()*.1;
      } else if(b.state==="move"){
        const dx=b.target.x-p.x,dz=b.target.y-p.z,dist=Math.hypot(dx,dz);
        if(dist<.04){
          b.gaitName="Graze";b.speed=0;
          if(b.feeding){b.state="eat";b.eatUntil=now+6;b.face=Math.atan2(BASKET.x-p.x,BASKET.z-p.z);}
          else{b.state="graze";b.timer=b.calf?.8+rng()*1.6:3+rng()*7;}
        }
        else{const step=Math.min(dist,b.speed*dt);p.x+=dx/dist*step;p.z+=dz/dist*step;let turn=Math.atan2(dx,dz)-b.yaw;turn=Math.atan2(Math.sin(turn),Math.cos(turn));b.yaw+=turn*(1-Math.exp(-dt*4));}
      }
      if(b.face!==null){let turn=b.face-b.yaw;turn=Math.atan2(Math.sin(turn),Math.cos(turn));b.yaw+=turn*(1-Math.exp(-dt*4));}
      const [swing,rate,bob,knee,lift,nod]=GAITS[b.gaitName];
      b.swing+=(swing-b.swing)*(1-Math.exp(-dt*4));b.phase+=dt*rate*(b.calf?1.25:1);
      const grazing=b.state==="graze"||b.state==="eat";b.eatT+=dt;
      b.head+=((grazing?.5+Math.sin(b.eatT*5.2)*.08:0)-b.head)*(1-Math.exp(-dt*6));b.turn+=((grazing?Math.sin(b.eatT*.8)*.05:0)-b.turn)*(1-Math.exp(-dt*3));
      const walking=Math.min(1,b.swing/.36),u=b.gait.uniforms;
      u.uPhase.value=b.phase;u.uSwing.value=b.swing;u.uKnee.value=Math.max(knee,GAITS.Walk[3]*walking);u.uLift.value=Math.max(lift,GAITS.Walk[4]*walking)*u.uHeight.value;u.uNod.value=nod;
      u.uHeadDown.value=b.head;u.uHeadTurn.value=b.turn;u.uTail.value=Math.sin(now*1.7+b.phase*.3)*.22;
      u.uBob.value=b.swing>.05?Math.abs(Math.sin(b.phase))*Math.max(bob,GAITS.Walk[2]*walking):Math.sin(b.phase*.5)*bob;
      p.y=heightAt(p.x,p.z);b.root.rotation.y=b.yaw;
    }
    // Prairie dogs pop up from their mounds, look about, and duck back down.
    const dogs=[];
    loader.load("/models/island/prairiedog.glb",gltf=>{
      if(disposed)return;
      const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3()),k=.22/size.y;
      const moundMaterial=new THREE.MeshStandardMaterial({color:"#9a6a3e",flatShading:true,roughness:1}),hole=new THREE.MeshBasicMaterial({color:"#2b1a14"});
      MOUNDS.forEach(([x,z],i)=>{
        const y=heightAt(x,z),mound=new THREE.Mesh(new THREE.CylinderGeometry(.08,.22,.09,7),moundMaterial);mound.position.set(x,y+.03,z);world.add(mound);
        const opening=new THREE.Mesh(new THREE.CircleGeometry(.07,7).rotateX(-Math.PI/2),hole);opening.position.set(x,y+.08,z);world.add(opening);
        const model=i?gltf.scene.clone():gltf.scene;model.traverse(o=>{if(o.isMesh)o.material=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1});});
        model.scale.setScalar(k);model.position.y=-box.min.y*k;
        const root=new THREE.Group();root.add(model);root.position.set(x,y-.25,z);root.rotation.y=rng()*6;world.add(root);
        dogs.push({root,base:y,state:"down",timer:1+rng()*5,look:root.rotation.y,up:0});
      });
    },undefined,()=>{});
    function updateDog(d,dt){
      d.timer-=dt;
      if(d.state==="down"&&d.timer<=0){d.state="up";d.timer=2.5+rng()*4;}
      else if(d.state==="up"){if(d.timer<=0){d.state="down";d.timer=2+rng()*6;}else if(rng()<dt*.6)d.look+=(rng()-.5)*1.8;}
      d.up+=((d.state==="up"?.25:0)-d.up)*(1-Math.exp(-dt*(d.state==="up"?5:12)));
      d.root.position.y=d.base-.25+d.up;d.root.rotation.y+=(d.look-d.root.rotation.y)*(1-Math.exp(-dt*4));
    }

    // Pointer: drag to spin the mesa; hover the basket to wobble it, tap it to pour in feed; tap a prairie dog to send it
    // down its hole.
    const raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2();let onBasket=false;
    const pick=(event,objects)=>{const rect=canvas.getBoundingClientRect();ndc.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(ndc,camera);return raycaster.intersectObjects(objects,true)[0];};
    const spin=createSpin(canvas,{rest:0,
      over:event=>(onBasket=!!pick(event,[basket,hay]))||!!pick(event,dogs.map(d=>d.root)),
      onTap:event=>{
        if(pick(event,[basket,hay])){pour();return;}
        const hit=pick(event,dogs.map(d=>d.root));if(!hit)return;
        const dog=dogs.find(d=>{let o=hit.object;while(o&&o!==d.root)o=o.parent;return o===d.root;});
        if(dog){dog.state="down";dog.timer=3+rng()*3;needsRender=true;}
      }});
    canvas.addEventListener("pointerleave",()=>{onBasket=false;});

    // Framing: the mesa to one side (the words scroll past on the other), further off when tall.
    let tall=false;const VIEW=new THREE.Vector3(0,.34,1).normalize(),focus=new THREE.Vector3(0,.9,0);
    function frame(){
      const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;tall=camera.aspect<.85;
      if(tall)camera.setViewOffset(w,h,0,h*.2,w,h);else camera.setViewOffset(w,h,(side==="left"?.17:-.17)*w,h*.07,w,h);
      camera.updateProjectionMatrix();camera.position.copy(VIEW).multiplyScalar(tall?54:24).add(focus);camera.lookAt(focus);needsRender=true;
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
      herd.forEach(b=>updateBison(b,step,time));dogs.forEach(d=>updateDog(d,step));
      world.position.y=Math.sin(time*.45)*.1;
      renderer.render(scene,camera);needsRender=false;
      return falling||onBasket||spin.busy||herd.some(b=>b.feeding&&b.state==="move");
    }
    // Full rate while feed falls, the herd runs to it or the basket is hovered, 30 fps for the grazing in between.
    let busy=true;const clock=new THREE.Clock();
    function draw(){
      raf=requestAnimationFrame(draw);
      const dt=Math.min(clock.getDelta(),.05);since+=dt;
      if(!visible||document.hidden||!state.current.live.includes(slot))return;
      if(preference.matches&&!needsRender&&!onBasket&&!spin.busy&&!pellets.some(p=>p.state!=="idle"))return;
      if(!busy&&since<1/30-.002)return;
      busy=tick(Math.min(since,.1));since=0;
    }
    frame();tick(0);mount.dataset.ready="true";draw();
    const readyTimer=setTimeout(()=>ready.current?.(),0);
    if(new URLSearchParams(window.location.search).has("debug"))window.__work={camera,herd,world,scene,renderer,pour,THREE};

    return()=>{
      clearTimeout(readyTimer);delete window.__work;disposed=true;cancelAnimationFrame(raf);resize.disconnect();observer.disconnect();
      spin.dispose();
      scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat())m?.dispose();});
      renderer.dispose();canvas.remove();
    };
  },[state,slot]);
  return <div className="ht-canvas" ref={host} aria-hidden="true" />;
}
