"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { getStage } from "./stage";
import { random, createIsland, createWater, createPineGeometry, createSwayingInstances, createFoliageMaterial, flatMaterial } from "./island-parts";
import { paintGeometry } from "./forest-parts";
import { createRangerBearGeometry, createRangerBearMaterial } from "./ranger-bear";
import { loadWagon } from "./wagon";

// The page's last diorama, behind the closing card: the end of the trip. A floating clearing in the pines at dusk, a
// log cabin on the right with its windows lit and smoke off the chimney, the wagon from the Skills road parked beside
// it, a stream running past, and the ranger bear on a log by the water with a little gray cat sitting next to him.
// The sun is going down behind it and the first stars are out. Nothing to press here: it only breathes (smoke,
// water, fireflies, the trees). No real-time shadows; 30 fps, only while it's on screen; still with reduced motion.
const smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const outline=a=>4.6*(1+.07*Math.sin(3*a+.4)+.05*Math.sin(5*a+1.3)+.03*Math.sin(8*a));
// The stream comes out of the trees at the back left and leaves over the front edge.
const riverPoints=new THREE.CatmullRomCurve3([[-3.1,0,-2.5],[-2.5,0,-1.9],[-1.6,0,-.4],[-1.1,0,1.1],[-.3,0,2.7],[.6,0,4.9]].map(p=>new THREE.Vector3(...p))).getSpacedPoints(60);
function riverDistance(x,z) {
  let best=1e9,at=0;
  riverPoints.forEach((p,i)=>{const d=(p.x-x)**2+(p.z-z)**2;if(d<best){best=d;at=i;}});
  return {d:Math.sqrt(best),t:at/(riverPoints.length-1)};
}
// Where things sit (x, z): the cabin on the right at the back, the wagon parked in front of it, the bear's log on
// the near bank of the stream.
const CABIN=new THREE.Vector2(2.05,-1.45),WAGON=new THREE.Vector2(2.55,1.05),SEAT=new THREE.Vector2(.35,1.35),YARD=.08;
function heightAt(x,z) {
  const edge=Math.hypot(x,z)/outline(Math.atan2(z,x));
  let h=.1*Math.sin(x*1.1+.4)*Math.cos(z*.9-.8)+.05*Math.sin(x*2.3+z*1.9);
  h+=.3*smooth(3.2,1.2,Math.hypot(x+2.6,z+3));
  h-=.2*smooth(.72,1,edge);
  // Level ground under the cabin and the wagon.
  const yard=Math.max(smooth(2.3,1.3,Math.hypot(x-CABIN.x,z-CABIN.y)),smooth(1.5,.8,Math.hypot(x-WAGON.x,z-WAGON.y)));
  h=h*(1-yard)+YARD*yard;
  const {d}=riverDistance(x,z),cut=smooth(1.1,.4,d);
  return h*(1-cut)-.34*cut;
}
const disc=(stops,size=128)=>{
  const canvas=document.createElement("canvas");canvas.width=canvas.height=size;
  const g=canvas.getContext("2d"),grad=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
  stops.forEach(([at,color])=>grad.addColorStop(at,color));g.fillStyle=grad;g.fillRect(0,0,size,size);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
};

export default function CabinScene() {
  const host=useRef(null);
  useEffect(()=>{
    const mount=host.current;
    let visible=false,disposed=false;
    const shared_=getStage();if(!shared_)return;const renderer=shared_.renderer;
    const preference=matchMedia("(prefers-reduced-motion: reduce)");
    const scene=new THREE.Scene();scene.fog=new THREE.Fog("#4a2f66",30,62);
    const camera=new THREE.PerspectiveCamera(30,1,.3,150);
    const rng=random(23);

    // Dusk: a violet sky light, the last of the sun low and orange from behind on the left, a cool fill from the front.
    scene.add(new THREE.HemisphereLight("#b9a9e6","#4a2c3c",.95));
    const sunLight=new THREE.DirectionalLight("#ffa462",2.1);sunLight.position.set(-9,3.2,-7);scene.add(sunLight);
    const fill=new THREE.DirectionalLight("#b4bdf0",.85);fill.position.set(4,6,10);scene.add(fill);

    const world=new THREE.Group();scene.add(world);
    const island=createIsland(9,{outline,heightAt,riverDistance,depth:.62,sand:.6});world.add(island.group);
    const water=createWater(riverPoints,outline,{width:.66,fall:1.5,fade:.7,level:-.13,volume:.2,head:.04});world.add(water.group);
    water.uniforms.uShallow.value.set("#4fb0b4");water.uniforms.uDeep.value.set("#2c5fa8");water.uniforms.uBright.value=.8;
    const shared={uTime:{value:0},uBreeze:{value:.02},uGust:{value:.03}};
    const on=(x,z,lift=0)=>new THREE.Vector3(x,heightAt(x,z)+lift,z);
    const clear=(x,z)=>riverDistance(x,z).d>1.05&&Math.hypot(x-CABIN.x,z-CABIN.y)>1.75&&Math.hypot(x-WAGON.x,z-WAGON.y)>1.35&&Math.hypot(x-SEAT.x,z-SEAT.y)>1.3;

    // The forest: pines all round the clearing, thickest at the back, leaving the view of the cabin and the bank open.
    const spots=[];
    for(let tries=0;spots.length<24&&tries<900;tries++){
      const a=rng()*Math.PI*2,r=Math.sqrt(rng())*outline(a)*.88,x=Math.cos(a)*r,z=Math.sin(a)*r;
      if(!clear(x,z)||x+z>2.2&&x>-.6||z>1.8&&x>-2)continue;
      if(spots.some(p=>Math.hypot(p.position.x-x,p.position.z-z)<.8))continue;
      spots.push({position:on(x,z),rotation:rng()*Math.PI*2,scale:(z<-1?1.15:.9)+rng()*.6});
    }
    const pines=createSwayingInstances(createPineGeometry(6),spots,createFoliageMaterial(shared));world.add(pines.mesh);

    // Stones along the stream.
    const rocks=[];
    for(let i=0;i<9;i++){const p=riverPoints[6+i*6],side=i%2?1:-1;rocks.push([p.x+side*(.72+rng()*.25),p.z+(rng()-.5)*.4,.1+rng()*.13]);}
    const rockMesh=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:"#7c6f8f",flatShading:true,roughness:1}),rocks.length),d=new THREE.Object3D();
    rocks.forEach(([x,z,s],i)=>{d.position.copy(on(x,z,s*.2));d.rotation.set(rng(),rng()*6,rng());d.scale.set(s,s*.7,s);d.updateMatrix();rockMesh.setMatrixAt(i,d.matrix);});
    world.add(rockMesh);

    // Blob shadows (no shadow maps here).
    const shadowTexture=disc([[0,"rgba(24,12,40,.55)"],[1,"rgba(24,12,40,0)"]],64),shadowMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false});
    for(const [x,z,w,h] of [[SEAT.x,SEAT.y,1.9,1.1],[CABIN.x,CABIN.y,4.4,3.6],[WAGON.x,WAGON.y,2.5,1.7]]){const blob=new THREE.Mesh(new THREE.PlaneGeometry(w,h).rotateX(-Math.PI/2),shadowMaterial);blob.position.copy(on(x,z,.035));world.add(blob);}

    // The cabin (Poly Pizza, see public/models/CREDITS.md), turned to face the clearing, its windows lit: a warm
    // light just outside the door, a glow on the wall and smoke drifting off the roof.
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const CABIN_WIDTH=3,cabinAt=on(CABIN.x,CABIN.y),cabinTurn=-.5;
    const cabin=new THREE.Group();cabin.position.copy(cabinAt);cabin.rotation.y=cabinTurn;world.add(cabin);
    const chimney=new THREE.Vector3(0,2.3,0);
    loader.load("/models/island/cabin.glb",gltf=>{
      if(disposed)return;
      const model=gltf.scene,box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),k=CABIN_WIDTH/Math.max(size.x,size.z);
      model.position.set(-(box.min.x+box.max.x)/2*k,-box.min.y*k,-(box.min.z+box.max.z)/2*k);model.scale.setScalar(k);
      model.traverse(o=>{if(o.isMesh)o.material=flatMaterial();});
      chimney.set(0,size.y*k,0);cabin.add(model);needsRender=true;
    },undefined,()=>{});
    const glowTexture=disc([[0,"rgba(255,206,130,.95)"],[.35,"rgba(255,150,80,.4)"],[1,"rgba(255,130,70,0)"]],64);
    const porch=new THREE.Vector3(Math.sin(cabinTurn),0,Math.cos(cabinTurn)),porchAt=cabinAt.clone().addScaledVector(porch,1.2).add(new THREE.Vector3(Math.cos(cabinTurn),0,-Math.sin(cabinTurn)).multiplyScalar(.85));
    const windowGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
    windowGlow.position.copy(porchAt).add(new THREE.Vector3(0,.55,0));windowGlow.scale.setScalar(2);world.add(windowGlow);
    const lamp=new THREE.PointLight("#ffab5c",5,4.2,1.8);lamp.position.copy(porchAt).add(new THREE.Vector3(0,.8,0));world.add(lamp);
    const puffTexture=disc([[0,"rgba(226,212,236,.55)"],[1,"rgba(226,212,236,0)"]],64);
    const puffs=Array.from({length:6},(_,i)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTexture,transparent:true,depthWrite:false,opacity:0}));s.userData.t=i/6*6;world.add(s);return s;});

    // The wagon from the Skills road, parked by the cabin for the night.
    const car=new THREE.Group();car.position.copy(on(WAGON.x,WAGON.y));car.rotation.y=-2.2;world.add(car);
    loadWagon(loader,{length:1.9},holder=>{if(disposed)return;car.add(holder);needsRender=true;});

    // The ranger bear on a log on the bank, looking down the stream, and the cat sat beside him.
    const seatAt=on(SEAT.x,SEAT.y),facing=Math.atan2(-.12,1),along=new THREE.Vector3(Math.cos(facing),0,-Math.sin(facing));
    const log=new THREE.Mesh(paintGeometry(new THREE.CylinderGeometry(.18,.2,1.7,7).rotateZ(Math.PI/2),"#6a4630"),flatMaterial());
    log.position.copy(seatAt).add(new THREE.Vector3(0,.17,0)).addScaledVector(along,.3);log.rotation.y=facing;world.add(log);
    const bear=createRangerBearMaterial(),BEAR=1.45;
    const ranger=new THREE.Mesh(createRangerBearGeometry(),bear.material);
    ranger.scale.setScalar(BEAR);ranger.position.copy(seatAt).add(new THREE.Vector3(0,.36-BEAR*.3,0));ranger.rotation.y=facing;world.add(ranger);
    bear.uniforms.uSit.value=1.45;bear.uniforms.uArmA.value.set(.5,-.12);bear.uniforms.uArmB.value.set(.5,-.12);
    // (Poly Pizza; its slate-blue coat turned a soft gray, the white and the black left as they are.)
    const CAT=.52,cat=new THREE.Group();cat.position.copy(seatAt).addScaledVector(along,.78).add(new THREE.Vector3(0,.34,0));cat.rotation.y=facing+Math.PI;world.add(cat);
    loader.load("/models/island/cat.glb",gltf=>{
      if(disposed)return;
      const model=gltf.scene;
      model.traverse(o=>{
        if(!o.isMesh)return;
        const colors=o.geometry.attributes.color,gray=new THREE.Color("#c3c4cc").convertSRGBToLinear();
        if(colors)for(let i=0;i<colors.count;i++){const r=colors.getX(i),g=colors.getY(i),b=colors.getZ(i);if(Math.max(r,g,b)-Math.min(r,g,b)>.04)colors.setXYZ(i,gray.r,gray.g,gray.b);}
        o.material=flatMaterial();
      });
      const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),k=CAT/size.y;
      model.position.set(-(box.min.x+box.max.x)/2*k,-box.min.y*k,-(box.min.z+box.max.z)/2*k);model.scale.setScalar(k);
      cat.add(model);cat.userData.model=model;needsRender=true;
    },undefined,()=>{});

    // Fireflies over the water and the grass.
    const FLIES=16,flyPositions=new Float32Array(FLIES*3),flies=Array.from({length:FLIES},()=>{const p=riverPoints[Math.floor(rng()*46)+6];return {x:p.x+(rng()-.5)*2.6,z:p.z+(rng()-.5)*2.6,y:.35+rng()*.9,phase:rng()*9};});
    const flyGeometry=new THREE.BufferGeometry();flyGeometry.setAttribute("position",new THREE.BufferAttribute(flyPositions,3));
    const flyMaterial=new THREE.PointsMaterial({color:"#f3ffa6",size:.07,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
    world.add(new THREE.Points(flyGeometry,flyMaterial));

    // The sky behind it, on a wall far back past the island: the first stars (none down in the glow near the
    // horizon) and the sun, low on the left with a wide warm halo.
    const back=new THREE.Vector3(.42,.4,.8).normalize().negate(),skyRight=new THREE.Vector3().crossVectors(back,new THREE.Vector3(0,1,0)).normalize().negate(),skyUp=new THREE.Vector3().crossVectors(skyRight,back).negate();
    const skyAt=(x,y,out=new THREE.Vector3())=>out.copy(back).multiplyScalar(55).addScaledVector(skyRight,x).addScaledVector(skyUp,y);
    const STARS=150,starPositions=new Float32Array(STARS*3),starSeeds=new Float32Array(STARS*2),star=new THREE.Vector3();
    for(let i=0;i<STARS;i++){const y=-2+Math.pow(rng(),.8)*34;skyAt((rng()-.5)*120,y,star);starPositions.set([star.x,star.y,star.z],i*3);starSeeds.set([rng(),smooth(0,16,y)],i*2);}
    const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute("position",new THREE.BufferAttribute(starPositions,3));starGeometry.setAttribute("aSeed",new THREE.BufferAttribute(starSeeds,2));
    const starUniforms={uTime:{value:0},uPixel:{value:1}};
    scene.add(new THREE.Points(starGeometry,new THREE.ShaderMaterial({uniforms:starUniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:`attribute vec2 aSeed;uniform float uTime,uPixel;varying float vAlpha;void main(){
        vAlpha=aSeed.y*(.35+.65*aSeed.x)*(.6+.4*sin(uTime*(1.+aSeed.x*2.)+aSeed.x*40.));gl_PointSize=(1.2+aSeed.x*2.3)*uPixel;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(1.,.97,.9,vAlpha*smoothstep(1.,0.,d));}`})));
    const sunTexture=disc([[0,"rgba(255,246,214,1)"],[.11,"rgba(255,226,160,1)"],[.13,"rgba(255,176,104,.62)"],[.4,"rgba(255,140,96,.24)"],[1,"rgba(255,130,110,0)"]],256);
    const sun=new THREE.Sprite(new THREE.SpriteMaterial({map:sunTexture,transparent:true,depthWrite:false,fog:false}));sun.scale.setScalar(30);scene.add(sun);

    // Framing: on wide screens the clearing sits to the right (the card is on the left); on tall ones it sits above
    // the card, in a block of its own.
    let tall=false;
    function frame(){
      const w=mount.clientWidth,h=mount.clientHeight;if(!w||!h)return;
      camera.aspect=w/h;tall=camera.aspect<.9;
      if(tall)camera.clearViewOffset();else camera.setViewOffset(w,h,-.2*w,h*.02,w,h);
      camera.updateProjectionMatrix();
      camera.position.set(.42,.4,.8).normalize().multiplyScalar(Math.max(24,5.5/(.268*camera.aspect)));camera.lookAt(0,tall?.2:.5,0);
      skyAt(tall?10:14,tall?-7:-3,sun.position);
      starUniforms.uPixel.value=renderer.getPixelRatio();needsRender=true;
    }
    const resize=new ResizeObserver(frame);resize.observe(mount);
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;needsRender=true;});observer.observe(mount);

    let time=0,needsRender=true,since=0;
    function tick(dt){
      const reduced=preference.matches,step=reduced?0:dt;time+=step;
      shared.uTime.value=time;shared.uBreeze.value=reduced?0:.02;shared.uGust.value=reduced?0:.03;pines.update();
      water.uniforms.uTime.value=time;water.uniforms.uFlow.value=time;
      world.position.y=Math.sin(time*.4)*.1;world.rotation.y=-.2+Math.sin(time*.11)*.025;
      // He breathes; so does the cat, a little quicker.
      bear.uniforms.uBob.value=Math.sin(time*1.3)*.006;
      const kitty=cat.userData.model;if(kitty)cat.scale.set(1,1+Math.sin(time*2.1)*.012,1);
      lamp.intensity=5+.4*Math.sin(time*5.3)+.3*Math.sin(time*11.7);windowGlow.material.opacity=.8+.08*Math.sin(time*5.3);
      puffs.forEach(puff=>{const u=puff.userData;u.t=(u.t+step)%6;const k=u.t/6;
        puff.position.copy(cabinAt).add(chimney).add(new THREE.Vector3(k*.9+Math.sin(k*5+u.t)*.06,.1+k*2.6,-k*.4));puff.scale.setScalar(.3+k*1.2);puff.material.opacity=Math.sin(k*Math.PI)*.3;});
      flies.forEach((fly,i)=>{flyPositions.set([fly.x+Math.sin(time*.4+fly.phase)*.4,fly.y+Math.sin(time*.9+fly.phase)*.15,fly.z+Math.cos(time*.35+fly.phase)*.4],i*3);});
      flyGeometry.attributes.position.needsUpdate=true;flyMaterial.opacity=.55+.45*Math.sin(time*1.7);
      starUniforms.uTime.value=time;
      needsRender=false;
    }
    // Called by the shared frame loop; returns whether anything changed (so the canvas needs redrawing).
    function draw(dt){
      dt=Math.min(dt,.05);since+=dt;
      if(!visible||document.hidden)return false;
      if(preference.matches&&!needsRender)return false;
      if(!needsRender&&since<1/30-.002)return false;
      tick(Math.min(since,.1));since=0;return true;
    }
    frame();tick(0);
    const unregister=shared_.register({mount,scene,camera,draw,exposure:1.1,overscan:{top:0,bottom:.4}});
    if(new URLSearchParams(window.location.search).has("debug"))window.__cabin={camera,scene,world,cabin,cat,ranger,sun,frame};

    return()=>{
      disposed=true;delete window.__cabin;unregister();resize.disconnect();observer.disconnect();
      scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat())if(m){m.map?.dispose();m.dispose();}});
      shadowTexture.dispose();glowTexture.dispose();puffTexture.dispose();sunTexture.dispose();
    };
  },[]);
  return <div className="ht-outro-scene" ref={host} aria-hidden="true" />;
}
