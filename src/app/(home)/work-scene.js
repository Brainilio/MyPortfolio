"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { random, createIsland, createBearMaterial } from "./island-parts";
import { createFin } from "./park-parts";
import { drawCard, createCardMaterial, videoTexture, coverCrop } from "./prairie-cards";

// Work as the prairie in miniature, the island's golden-hour cousin: a floating mesa with Garden-of-the-Gods fins,
// a small bison herd with a calf and prairie dogs on their mounds. The project cards orbit it like a ring, the
// front one large and facing you; scrolling turns the ring, and a card opens its project. No real-time shadows;
// full rate while the ring turns or a card is hovered, 30 fps otherwise, only while the section is on screen.
// The full-size prairie lives in the Lab.
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
const outline=a=>5.4*(1+.08*Math.sin(3*a+.4)+.05*Math.sin(5*a+1.7)+.03*Math.sin(8*a));
function heightAt(x,z) {
  const edge=Math.hypot(x,z)/outline(Math.atan2(z,x));
  return .14*Math.sin(x*.9+.6)*Math.cos(z*.8-.2)+.06*Math.sin(x*2.2+z*1.7)-.2*smooth((edge-.74)/.26);
}
const noRiver=()=>({d:99,t:0});
const CARD=new THREE.Vector2(4.2,2.1);
// Bison gaits: leg swing (rad), stride rate, bob (fraction of height), knee fold, foot lift (fraction), nod.
const GAITS={Graze:[0,1.1,.003,0,0,.04],Walk:[.36,3.4,.006,.6,.035,.09],Run:[.62,7.5,.02,.95,.06,.14]};
// Fins at the back of the mesa (x, z, width, height, depth, lean) and the prairie dogs' mounds near the front.
const FINS=[[-2.6,-2.4,1.5,2.6,.6,.05],[-1.1,-3.3,1.1,1.9,.5,-.04],[2.4,-2.6,1.3,2.2,.55,.06]],MOUNDS=[[2.2,1.6],[-2.8,1.4],[.4,2.8]];

export default function WorkScene({ state, projects, slot = 2, side = "left", onReady }) {
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
    const island=createIsland(13,{outline,heightAt,riverDistance:noRiver,depth:.62,grass:["#b89a52","#c4a65a","#a98d4c"],edge:"#9a7c46"});world.add(island.group);
    const on=(x,z,lift=0)=>new THREE.Vector3(x,heightAt(x,z)+lift,z);
    FINS.forEach(([x,z,w,h,d,lean])=>{const fin=createFin(rng,w,h,d);fin.position.copy(on(x,z,-.15));fin.rotation.set(0,(rng()-.5)*.6,lean);world.add(fin);});
    // Sage bushes dotted over the grass.
    {const tints=["#8a9a5c","#7a8b52","#94a066"].map(c=>new THREE.Color(c)),count=34,bushes=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0).scale(1,.6,1),new THREE.MeshStandardMaterial({flatShading:true,roughness:1}),count),d=new THREE.Object3D();let n=0;
      for(let tries=0;n<count&&tries<400;tries++){const a=rng()*Math.PI*2,r=Math.sqrt(rng())*outline(a)*.88,x=Math.cos(a)*r,z=Math.sin(a)*r;
        if(FINS.some(([fx,fz])=>Math.hypot(x-fx,z-fz)<1)||MOUNDS.some(([mx,mz])=>Math.hypot(x-mx,z-mz)<.6))continue;
        const s=.1+rng()*.14;d.position.copy(on(x,z,s*.2));d.rotation.y=rng()*6;d.scale.setScalar(s);d.updateMatrix();bushes.setMatrixAt(n,d.matrix);bushes.setColorAt(n,tints[n%3]);n++;}
      bushes.count=n;world.add(bushes);}

    // The project cards, on a ring around the mesa.
    const cards=projects.map((project,i)=>{
      const blank=document.createElement("canvas");blank.width=blank.height=4;
      const {material,uniforms}=createCardMaterial(new THREE.CanvasTexture(blank),CARD);
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(CARD.x,CARD.y,24,24),material);mesh.userData={project,i};world.add(mesh);
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

    // The herd: a few bison grazing and ambling about the mesa, the calf (red coat) never far from its mother.
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),herd=[],LIMIT=.72;
    const inside=(x,z)=>Math.hypot(x,z)<outline(Math.atan2(z,x))*LIMIT&&!FINS.some(([fx,fz])=>Math.hypot(x-fx,z-fz)<1.1);
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
        herd.push({root,gait,calf,yaw:rng()*6,state:"graze",timer:1+rng()*5,speed:0,gaitName:"Graze",swing:0,phase:rng()*6,head:0,turn:0,eatT:rng()*5,target:new THREE.Vector2(x,z)});
      });
      needsRender=true;
    },undefined,()=>{});
    function updateBison(b,dt,now){
      const p=b.root.position;b.timer-=dt;
      if(b.state==="graze"&&b.timer<=0){
        // Wander a little; the calf stays by its mother (the first bison).
        for(let tries=0;tries<12;tries++){const from=b.calf?herd[0].root.position:p,a=rng()*Math.PI*2,r=b.calf?.4+rng()*.5:.6+rng()*1.4,x=from.x+Math.cos(a)*r,z=from.z+Math.sin(a)*r;if(inside(x,z)){b.target.set(x,z);break;}}
        b.state="move";const run=b.calf&&rng()<.5;b.gaitName=run?"Run":"Walk";b.speed=run?.9:.22+rng()*.1;
      } else if(b.state==="move"){
        const dx=b.target.x-p.x,dz=b.target.y-p.z,dist=Math.hypot(dx,dz);
        if(dist<.04){b.state="graze";b.gaitName="Graze";b.speed=0;b.timer=b.calf?.8+rng()*1.6:3+rng()*7;}
        else{const step=Math.min(dist,b.speed*dt);p.x+=dx/dist*step;p.z+=dz/dist*step;let turn=Math.atan2(dx,dz)-b.yaw;turn=Math.atan2(Math.sin(turn),Math.cos(turn));b.yaw+=turn*(1-Math.exp(-dt*4));}
      }
      const [swing,rate,bob,knee,lift,nod]=GAITS[b.gaitName];
      b.swing+=(swing-b.swing)*(1-Math.exp(-dt*4));b.phase+=dt*rate*(b.calf?1.25:1);
      const grazing=b.state==="graze";b.eatT+=dt;
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

    // Pointer: hover a card to ripple it, click to open its project.
    const raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2();let hovered=null;
    function onMove(event){
      const rect=canvas.getBoundingClientRect();ndc.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
      raycaster.setFromCamera(ndc,camera);
      const card=raycaster.intersectObjects(cards.filter(c=>c.depth>.3).map(c=>c.mesh),false)[0];
      hovered=card?cards.find(c=>c.mesh===card.object):null;if(card)hovered.uniforms.uMouse.value.copy(card.uv);
      canvas.style.cursor=hovered?"pointer":"default";
    }
    function onClick(){if(hovered)window.location.href=`/project/${hovered.mesh.userData.project.slug}/`;}
    canvas.addEventListener("pointermove",onMove);canvas.addEventListener("click",onClick);
    canvas.addEventListener("pointerleave",()=>{hovered=null;});

    // Framing: the mesa and its ring to one side (the words scroll past on the other), further off when tall.
    let tall=false;const VIEW=new THREE.Vector3(0,.34,1).normalize(),focus=new THREE.Vector3(0,.9,0);
    function frame(){
      const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;tall=camera.aspect<.85;
      if(tall)camera.setViewOffset(w,h,0,h*.14,w,h);else camera.setViewOffset(w,h,(side==="left"?.2:-.2)*w,-h*.05,w,h);
      camera.updateProjectionMatrix();camera.position.copy(VIEW).multiplyScalar(tall?50:33).add(focus);camera.lookAt(focus);needsRender=true;
    }
    const resize=new ResizeObserver(frame);resize.observe(mount);
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});observer.observe(mount);

    let spin=0,spinVelocity=0,time=0,since=0,needsRender=true,snap=true,wasLive=false;
    function tick(dt){
      const reduced=preference.matches,step=reduced?0:dt;time+=step;
      // Scrolling through Work turns the ring from the first card to the last; it eases round rather than snapping.
      const n=cards.length,turnTo=-state.current.progress[slot]*(n-1)/n*Math.PI*2,before=spin;
      if(snap){snap=false;spin=turnTo;}
      spin=reduced?turnTo:spin+(turnTo-spin)*(1-Math.exp(-dt*4));spinVelocity=(spin-before)/Math.max(dt,1/120);
      const rx=tall?4.4:6.6,rz=tall?5.4:6,lift=tall?1.1:1.2;
      cards.forEach((card,i)=>{
        const a=spin+i/n*Math.PI*2,depth=Math.cos(a);card.depth=depth;
        // Videos only play while their card is facing us.
        if(card.video){const play=!reduced&&depth>-.2;if(play&&card.video.paused)card.video.play().catch(()=>{});else if(!play&&!card.video.paused)card.video.pause();}
        card.hover+=((card===hovered?1:0)-card.hover)*(1-Math.exp(-dt*7));
        // Seen a little from above, the back of the ring rides higher than the front.
        card.mesh.position.set(Math.sin(a)*rx,lift-depth*.55+Math.sin(time*.5+i)*.05+card.hover*.1,depth*rz+card.hover*.3);
        card.mesh.rotation.set(0,Math.atan2(Math.sin(a)/rx,Math.cos(a)/rz),0);
        // The card in focus grows as it comes round to the front.
        const front=smooth((depth-.55)/.45);card.mesh.scale.setScalar(((tall?.8:.6)+front*(tall?.85:.62))*(1+card.hover*.04));
        const v=card.uniforms;v.uTime.value=time;v.uHover.value=card.hover;v.uShade.value=.62+.38*smooth((depth+1)/2);
        v.uVelocity.value=reduced?0:THREE.MathUtils.clamp(-spinVelocity*.6,-1,1);
      });
      herd.forEach(b=>updateBison(b,step,time));dogs.forEach(d=>updateDog(d,step));
      world.position.y=Math.sin(time*.45)*.1;
      renderer.render(scene,camera);needsRender=false;
      return Math.abs(spinVelocity)>.01||cards.some(c=>c.hover>.01);
    }
    // Full rate while the ring turns or a card is hovered, 30 fps for the grazing in between.
    let busy=true;const clock=new THREE.Clock();
    function draw(){
      raf=requestAnimationFrame(draw);
      const dt=Math.min(clock.getDelta(),.05);since+=dt;
      const live=visible&&!document.hidden&&state.current.live.includes(slot);if(live&&!wasLive)snap=true;wasLive=live;
      if(!live)return;
      if(preference.matches&&!needsRender&&!snap)return;
      if(!busy&&since<1/30-.002)return;
      busy=tick(Math.min(since,.1));since=0;
    }
    frame();tick(0);mount.dataset.ready="true";draw();
    const readyTimer=setTimeout(()=>ready.current?.(),0);
    if(new URLSearchParams(window.location.search).has("debug"))window.__work={camera,cards,herd,world,scene,renderer,THREE};

    return()=>{
      clearTimeout(readyTimer);delete window.__work;disposed=true;cancelAnimationFrame(raf);resize.disconnect();observer.disconnect();
      cards.forEach(c=>{if(c.video){c.video.pause();c.video.removeAttribute("src");c.video.load();}});
      canvas.removeEventListener("pointermove",onMove);canvas.removeEventListener("click",onClick);
      scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat())if(m){m.map?.dispose();m.uniforms?.uMap?.value?.dispose();m.dispose();}});
      renderer.dispose();canvas.remove();
    };
  },[state,projects,slot]);
  return <div className="ht-canvas" ref={host} aria-hidden="true" />;
}
