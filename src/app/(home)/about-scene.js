"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { random, faceted, createIsland, createWater, createPineGeometry, createSwayingInstances, createFoliageMaterial, flatMaterial } from "./island-parts";
import { paintGeometry, mergeFlat } from "./forest-parts";
import { createRangerBearGeometry, createRangerBearMaterial, bearHandAt } from "./ranger-bear";

// About as a little diorama, the island's evening cousin: a floating riverbank where the ranger bear sits on a log
// with a fishing rod, a campfire crackling beside him and his tent behind. It's meant to be still: the fire
// flickers, sparks and smoke rise, the river runs off the edge, fireflies drift, and every so often the bobber
// dips and he gives the rod a tug. No real-time shadows (blob shadows and the firelight do the grounding), and it
// renders at 30 fps, only while the section is on screen.
const smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const outline=a=>4.4*(1+.08*Math.sin(3*a+1)+.05*Math.sin(5*a+.3)+.03*Math.sin(8*a));
// The river comes in at the back and leaves over the front right edge, toward the camera.
const riverPoints=new THREE.CatmullRomCurve3([[-2.1,0,-3.5],[-1.5,0,-2.6],[-.3,0,-.8],[.8,0,.9],[1.9,0,2.6],[3,0,4.6]].map(p=>new THREE.Vector3(...p))).getSpacedPoints(60);
function riverDistance(x,z) {
  let best=1e9,at=0;
  riverPoints.forEach((p,i)=>{const d=(p.x-x)**2+(p.z-z)**2;if(d<best){best=d;at=i;}});
  return {d:Math.sqrt(best),t:at/(riverPoints.length-1)};
}
function heightAt(x,z) {
  const edge=Math.hypot(x,z)/outline(Math.atan2(z,x));
  let h=.12*Math.sin(x*1.1+.4)*Math.cos(z*.9-.8)+.06*Math.sin(x*2.3+z*1.9);
  h+=.35*smooth(3.4,1.2,Math.hypot(x+2.2,z+2.6));
  h-=.2*smooth(.72,1,edge);
  const {d,t}=riverDistance(x,z);if(t>0)h-=.5*smooth(1.25,.45,d);
  return h;
}
// Where things sit (x, z): the bear on his log on the near bank, facing the water; the fire to his left; the tent behind.
const SEAT=new THREE.Vector2(-.75,1.35),FIRE=new THREE.Vector2(-2,.35),TENT=new THREE.Vector2(-2.3,-1.7);

export default function AboutScene({ state, slot = 1, onReady }) {
  const ready=useRef(onReady);ready.current=onReady;
  const host=useRef(null);
  useEffect(()=>{
    const mount=host.current;
    let renderer,raf=0,visible=true;
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"}); } catch { ready.current?.(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
    mount.appendChild(renderer.domElement);
    const preference=matchMedia("(prefers-reduced-motion: reduce)");
    const scene=new THREE.Scene();scene.fog=new THREE.Fog("#2b2150",30,60);
    const camera=new THREE.PerspectiveCamera(30,1,.3,150);
    const rng=random(11);

    // Blue hour: a dim violet sky light, a cool moon from behind, and the fire doing most of the work up close.
    scene.add(new THREE.HemisphereLight("#8f86d6","#2a1d3c",1.1));
    const moon=new THREE.DirectionalLight("#b9c4ff",1.1);moon.position.set(-6,9,-10);scene.add(moon);
    const rim=new THREE.DirectionalLight("#ff9fb8",.45);rim.position.set(10,4,-4);scene.add(rim);

    const world=new THREE.Group();scene.add(world);
    const island=createIsland(5,{outline,heightAt,riverDistance,depth:.62,sand:.7});world.add(island.group);
    const water=createWater(riverPoints,outline,{width:.55,fall:3.2});world.add(water.group);
    const shared={uTime:{value:0},uBreeze:{value:.025},uGust:{value:.04}};
    const on=(x,z,lift=0)=>new THREE.Vector3(x,heightAt(x,z)+lift,z);

    // Pines on the high ground at the back and along the far bank, clear of the river, the camp and the edge.
    const spots=[];
    for(let tries=0;spots.length<11&&tries<400;tries++){
      const a=rng()*Math.PI*2,r=Math.sqrt(rng())*outline(a)*.86,x=Math.cos(a)*r,z=Math.sin(a)*r;
      if(riverDistance(x,z).d<1.2||z>1.6&&x<1||Math.hypot(x-FIRE.x,z-FIRE.y)<1.4||Math.hypot(x-TENT.x,z-TENT.y)<1.3||Math.hypot(x-SEAT.x,z-SEAT.y)<1.4)continue;
      if(spots.some(p=>Math.hypot(p.x-x,p.z-z)<.95))continue;
      spots.push({position:on(x,z),rotation:rng()*Math.PI*2,scale:.95+rng()*.55});
    }
    const pines=createSwayingInstances(createPineGeometry(4),spots,createFoliageMaterial(shared));world.add(pines.mesh);

    // Bank rocks, the fire ring, the log seat and a few stones along the water.
    const stone=new THREE.DodecahedronGeometry(1,0);
    const rocks=[];
    for(let i=0;i<8;i++){const p=riverPoints[8+i*6],side=i%2?1:-1;rocks.push([p.x+side*(.8+rng()*.25),p.z+(rng()-.5)*.4,.12+rng()*.14]);}
    for(let k=0;k<8;k++){const a=k/8*Math.PI*2;rocks.push([FIRE.x+Math.cos(a)*.34,FIRE.y+Math.sin(a)*.34,.08+rng()*.03]);}
    const rockMesh=new THREE.InstancedMesh(stone,new THREE.MeshStandardMaterial({color:"#6d6488",flatShading:true,roughness:1}),rocks.length),d=new THREE.Object3D();
    rocks.forEach(([x,z,s],i)=>{d.position.copy(on(x,z,s*.2));d.rotation.set(rng(),rng()*6,rng());d.scale.set(s,s*.7,s);d.updateMatrix();rockMesh.setMatrixAt(i,d.matrix);});
    world.add(rockMesh);

    // The fire: three crossed logs, a flame of stacked cones (it flickers by rescaling), a glow on the ground, a warm light.
    const fireAt=on(FIRE.x,FIRE.y);
    const wood=[0,1,2].map(k=>paintGeometry(new THREE.CylinderGeometry(.04,.05,.5,5).rotateZ(1.05).rotateY(k*2.1).translate(0,.12,0),k%2?"#5a3a26":"#6d4630"));
    const camp=new THREE.Mesh(mergeFlat(wood),flatMaterial());camp.position.copy(fireAt);world.add(camp);
    const flames=[["#ff5a2a",.2,.55],["#ff9a3c",.15,.42],["#ffe08a",.08,.28]].map(([color,radius,height],i)=>{
      const mesh=new THREE.Mesh(new THREE.ConeGeometry(radius,height,6).translate(0,height/2,0),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.92-i*.05,depthWrite:false}));
      mesh.position.copy(fireAt).add(new THREE.Vector3(0,.06,0));mesh.renderOrder=2+i;world.add(mesh);return mesh;
    });
    const glowCanvas=document.createElement("canvas");glowCanvas.width=glowCanvas.height=64;
    const g2=glowCanvas.getContext("2d"),grad=g2.createRadialGradient(32,32,0,32,32,32);
    grad.addColorStop(0,"rgba(255,190,110,.9)");grad.addColorStop(.35,"rgba(255,130,70,.35)");grad.addColorStop(1,"rgba(255,120,60,0)");g2.fillStyle=grad;g2.fillRect(0,0,64,64);
    const glowTexture=new THREE.CanvasTexture(glowCanvas);glowTexture.colorSpace=THREE.SRGBColorSpace;
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
    glow.position.copy(fireAt).add(new THREE.Vector3(0,.35,0));glow.scale.setScalar(2.4);world.add(glow);
    const firelight=new THREE.PointLight("#ff9446",9,7,1.6);firelight.position.copy(fireAt).add(new THREE.Vector3(0,.6,0));world.add(firelight);
    // Sparks: little embers that rise, drift and wink out, then start again at the fire.
    const SPARKS=22,sparkPositions=new Float32Array(SPARKS*3),sparks=Array.from({length:SPARKS},()=>({t:rng()*2,life:1.2+rng()*1.2,dx:(rng()-.5)*.3,dz:(rng()-.5)*.3}));
    const sparkGeometry=new THREE.BufferGeometry();sparkGeometry.setAttribute("position",new THREE.BufferAttribute(sparkPositions,3));
    const sparkPoints=new THREE.Points(sparkGeometry,new THREE.PointsMaterial({color:"#ffc46b",size:.06,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));world.add(sparkPoints);
    // Smoke: soft puffs that drift up and away, swelling and fading.
    const puffCanvas=document.createElement("canvas");puffCanvas.width=puffCanvas.height=64;
    const p2=puffCanvas.getContext("2d"),pg=p2.createRadialGradient(32,32,0,32,32,32);pg.addColorStop(0,"rgba(210,200,230,.55)");pg.addColorStop(1,"rgba(210,200,230,0)");p2.fillStyle=pg;p2.fillRect(0,0,64,64);
    const puffTexture=new THREE.CanvasTexture(puffCanvas);
    const puffs=Array.from({length:5},(_,i)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTexture,transparent:true,depthWrite:false,opacity:0}));s.userData.t=i/5*4;world.add(s);return s;});

    // The tent: an olive A-frame with a dark doorway, pitched behind the fire.
    {const w=.62,h=.78,l=.6,v=(x,y,z)=>new THREE.Vector3(x,y,z),a=v(-w,0,-l),b=v(w,0,-l),c=v(0,h,-l),d=v(-w,0,l),e=v(w,0,l),f=v(0,h,l),door=[v(-.24,0,l+.01),v(.24,0,l+.01),v(0,.5,l+.01)];
      const olive=new THREE.Color("#66733f"),shade=new THREE.Color("#55613a"),dark=new THREE.Color("#2a2232");
      const tent=new THREE.Mesh(faceted([[a,d,f],[a,f,c],[b,c,f],[b,f,e],[a,c,b],[d,e,f],door],(tri,color)=>color.copy(tri===door?dark:tri[0]===b?shade:olive)),new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.95,side:THREE.DoubleSide}));
      tent.position.copy(on(TENT.x,TENT.y));tent.rotation.y=.9;world.add(tent);}

    // Blob shadows under the bear, the log and the tent.
    const shadowCanvas=document.createElement("canvas");shadowCanvas.width=shadowCanvas.height=64;
    const s2=shadowCanvas.getContext("2d"),sg=s2.createRadialGradient(32,32,0,32,32,32);sg.addColorStop(0,"rgba(20,10,35,.55)");sg.addColorStop(1,"rgba(20,10,35,0)");s2.fillStyle=sg;s2.fillRect(0,0,64,64);
    const shadowTexture=new THREE.CanvasTexture(shadowCanvas),shadowMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false});
    for(const [x,z,w,h] of [[SEAT.x,SEAT.y,1.5,.9],[TENT.x,TENT.y,1.8,1.6]]){const blob=new THREE.Mesh(new THREE.PlaneGeometry(w,h).rotateX(-Math.PI/2),shadowMaterial);blob.position.copy(on(x,z,.03));world.add(blob);}

    // The ranger bear on his log, facing the river, rod out over the water. His right paw holds the rod.
    const seatAt=on(SEAT.x,SEAT.y),facing=Math.atan2(riverPoints[34].x-SEAT.x,riverPoints[34].z-SEAT.y)-.35;
    const log=new THREE.Mesh(paintGeometry(new THREE.CylinderGeometry(.18,.2,1.2,7).rotateZ(Math.PI/2),"#6a4630"),flatMaterial());
    log.position.copy(seatAt).add(new THREE.Vector3(0,.17,0));log.rotation.y=facing;world.add(log);
    const bear=createRangerBearMaterial(),BEAR=1.45,hold=new THREE.Vector2(1.05,-.32),rest=new THREE.Vector2(.85,-.25);
    const ranger=new THREE.Mesh(createRangerBearGeometry(),bear.material);
    ranger.scale.setScalar(BEAR);ranger.position.copy(seatAt).add(new THREE.Vector3(0,.36-BEAR*.3,-.04));ranger.rotation.y=facing;world.add(ranger);
    bear.uniforms.uSit.value=1.45;bear.uniforms.uArmA.value.copy(hold);bear.uniforms.uArmB.value.copy(rest);
    const rod=new THREE.Group(),ROD=2.1/BEAR,tip=new THREE.Vector3(0,ROD,0);
    rod.add(new THREE.Mesh(paintGeometry(new THREE.CylinderGeometry(.008,.02,ROD,5).translate(0,ROD/2,0),"#3a2a1e"),flatMaterial()));
    rod.add(new THREE.Mesh(paintGeometry(new THREE.CylinderGeometry(.035,.035,.08,8).rotateZ(Math.PI/2).translate(0,.25,0),"#a78bfa"),flatMaterial()));
    ranger.add(rod);
    const hand=new THREE.Vector3(),aim=new THREE.Quaternion(),forward=new THREE.Vector3(0,.62,1).normalize();
    aim.setFromUnitVectors(new THREE.Vector3(0,1,0),forward);rod.quaternion.copy(aim);
    // The line hangs from the rod tip to a red-and-white bobber floating in the current.
    const bobber=new THREE.Mesh(mergeFlat([paintGeometry(new THREE.SphereGeometry(.06,8,6,0,Math.PI*2,0,Math.PI/2),"#e8463a"),paintGeometry(new THREE.SphereGeometry(.06,8,6,0,Math.PI*2,Math.PI/2,Math.PI/2),"#f6f1ea")]),flatMaterial());world.add(bobber);
    const linePositions=new Float32Array(6),line=new THREE.Line(new THREE.BufferGeometry().setAttribute("position",new THREE.BufferAttribute(linePositions,3)),new THREE.LineBasicMaterial({color:"#efe9ff",transparent:true,opacity:.6}));world.add(line);
    const tipWorld=new THREE.Vector3(),float=new THREE.Vector3();
    // Fireflies over the water.
    const FLIES=18,flyPositions=new Float32Array(FLIES*3),flies=Array.from({length:FLIES},()=>{const p=riverPoints[Math.floor(rng()*50)+5];return {x:p.x+(rng()-.5)*2.4,z:p.z+(rng()-.5)*2.4,y:.4+rng()*.9,phase:rng()*9};});
    const flyGeometry=new THREE.BufferGeometry();flyGeometry.setAttribute("position",new THREE.BufferAttribute(flyPositions,3));
    const flyMaterial=new THREE.PointsMaterial({color:"#e7ff9a",size:.07,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
    world.add(new THREE.Points(flyGeometry,flyMaterial));

    // Framing: the diorama right of centre on wide screens (the words sit on the left), centred and further off when tall.
    let tall=false,lean=new THREE.Vector2(),leanTarget=new THREE.Vector2();
    const view={w:1,h:1};
    function frame(){
      const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;tall=camera.aspect<.85;view.w=w;view.h=h;
      if(tall)camera.setViewOffset(w,h,0,-h*.2,w,h);else camera.setViewOffset(w,h,-w*.2,0,w,h);
      camera.updateProjectionMatrix();place();needsRender=true;
    }
    function place(){
      const distance=tall?48:29;camera.position.set(.42+lean.x*.06,.4+lean.y*.04,.8).normalize().multiplyScalar(distance);camera.lookAt(0,tall?-.4:.3,0);
    }
    const resize=new ResizeObserver(frame);resize.observe(mount);
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});observer.observe(mount);
    const onPointer=event=>{leanTarget.set(event.clientX/window.innerWidth*2-1,event.clientY/window.innerHeight*2-1);};
    window.addEventListener("pointermove",onPointer,{passive:true});

    let time=0,needsRender=true,bite={t:-1,wait:5+rng()*5},since=0,flow=0;
    const clock=new THREE.Clock();
    function tick(dt){
      const reduced=preference.matches,step=reduced?0:dt;time+=step;flow+=step;
      shared.uTime.value=time;shared.uBreeze.value=reduced?0:.025;shared.uGust.value=reduced?0:.04;pines.update();
      water.uniforms.uTime.value=time;water.uniforms.uFlow.value=flow;
      world.position.y=Math.sin(time*.45)*.12;world.rotation.y=-.25+Math.sin(time*.13)*.03;
      lean.lerp(leanTarget,1-Math.exp(-dt*1.5));place();
      // Fire: each cone flickers on its own beat; the light breathes with it.
      flames.forEach((flame,i)=>{const f=.8+.2*Math.sin(time*(9+i*3)+i)+.12*Math.sin(time*(23+i*5));flame.scale.set(1+.1*Math.sin(time*13+i),f,1+.1*Math.cos(time*11+i));flame.rotation.y=time*(.6+i*.3);});
      firelight.intensity=9+2.2*Math.sin(time*11)+1.4*Math.sin(time*27);glow.material.opacity=.75+.15*Math.sin(time*9);
      sparks.forEach((spark,i)=>{spark.t+=step;if(spark.t>spark.life){spark.t=0;spark.life=1.2+rng()*1.2;spark.dx=(rng()-.5)*.3;spark.dz=(rng()-.5)*.3;}
        const k=spark.t/spark.life;sparkPositions.set([fireAt.x+spark.dx*k+Math.sin(time*3+i)*.05*k,fireAt.y+.2+k*1.5,fireAt.z+spark.dz*k],i*3);});
      sparkGeometry.attributes.position.needsUpdate=true;sparkPoints.material.opacity=.9;
      puffs.forEach(puff=>{const u=puff.userData;u.t=(u.t+step)%4;const k=u.t/4;puff.position.set(fireAt.x+k*.5,fireAt.y+.7+k*2.2,fireAt.z-k*.3);puff.scale.setScalar(.35+k*1.1);puff.material.opacity=Math.sin(k*Math.PI)*.35;});
      // The bobber rides the current; now and then a fish bites, it dips twice and he tugs the rod.
      bite.wait-=step;if(bite.wait<0&&bite.t<0)bite.t=0;
      let dip=0,tug=0;
      if(bite.t>=0){bite.t+=step;const t=bite.t;dip=(t<.5?Math.sin(t/.5*Math.PI):t<1.1?Math.sin((t-.6)/.5*Math.PI)*1.4:0)*.06;tug=t>1.1&&t<1.9?Math.sin((t-1.1)/.8*Math.PI):0;if(t>2.4){bite.t=-1;bite.wait=7+rng()*8;}}
      bear.uniforms.uArmA.value.set(hold.x+tug*.35,hold.y);bear.uniforms.uArmB.value.set(rest.x+tug*.3,rest.y);
      bear.uniforms.uBob.value=Math.sin(time*1.6)*.006;
      bearHandAt(bear.uniforms.uArmA.value,hand);rod.position.copy(hand);
      rod.quaternion.copy(aim);rod.rotateX(-tug*.25);
      ranger.updateMatrixWorld(true);tipWorld.copy(tip);rod.localToWorld(tipWorld);world.worldToLocal(tipWorld);
      const river=riverPoints[34];float.set(river.x+.25+Math.sin(time*.7)*.06,-.2+Math.sin(time*2.1)*.012-dip,river.z-.2+Math.cos(time*.6)*.05);
      bobber.position.copy(float);
      linePositions.set([tipWorld.x,tipWorld.y,tipWorld.z,float.x,float.y+.04,float.z]);line.geometry.attributes.position.needsUpdate=true;
      flies.forEach((fly,i)=>{flyPositions.set([fly.x+Math.sin(time*.4+fly.phase)*.4,fly.y+Math.sin(time*.9+fly.phase)*.15,fly.z+Math.cos(time*.35+fly.phase)*.4],i*3);});
      flyGeometry.attributes.position.needsUpdate=true;flyMaterial.opacity=.55+.45*Math.sin(time*1.7);
      renderer.render(scene,camera);needsRender=false;
    }
    // 30 fps is plenty for a scene this calm; paused while another section is on screen.
    function draw(){
      raf=requestAnimationFrame(draw);
      const dt=Math.min(clock.getDelta(),.05);since+=dt;
      if(!visible||document.hidden||!state.current.live.includes(slot))return;
      if(preference.matches&&!needsRender)return;
      if(since<1/30-.002)return;
      tick(Math.min(since,.1));since=0;
    }
    frame();tick(0);mount.dataset.ready="true";draw();
    const readyTimer=setTimeout(()=>ready.current?.(),0);

    return()=>{
      clearTimeout(readyTimer);cancelAnimationFrame(raf);resize.disconnect();observer.disconnect();window.removeEventListener("pointermove",onPointer);
      scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat())if(m){m.map?.dispose();m.dispose();}});
      glowTexture.dispose();puffTexture.dispose();shadowTexture.dispose();renderer.dispose();renderer.domElement.remove();
    };
  },[state,slot]);
  return <div className="ht-canvas" ref={host} aria-hidden="true" />;
}
