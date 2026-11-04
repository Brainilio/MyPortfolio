"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { random, faceted, createIsland, createWater, createPineGeometry, createSwayingInstances, createFoliageMaterial, flatMaterial, createSpin } from "./island-parts";
import { paintGeometry, mergeFlat, createAspen } from "./forest-parts";
import { createRangerBearGeometry, createRangerBearMaterial, bearHandAt } from "./ranger-bear";

// About as a little diorama, the island's evening cousin: a floating riverbank where the ranger bear sits on a log by
// the campfire, toasting a marshmallow on a stick, his tent behind him. The marshmallow browns as it toasts; he eats
// it when it's golden, and now and then lets one catch fire and has to shake it out. Tap him (or it) and he eats it
// there and then; tap the fire to stoke it; tap the tent and it wobbles; drag to spin the island. No real-time
// shadows (blob shadows and the firelight do the grounding); 30 fps when calm, only while the section is on screen.
const smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const outline=a=>4.4*(1+.08*Math.sin(3*a+1)+.05*Math.sin(5*a+.3)+.03*Math.sin(8*a));
// The river rises from a spring in the hillside at the back and leaves over the front right edge, toward the camera.
const SPRING=new THREE.Vector3(-1.75,0,-2.85);
const riverPoints=new THREE.CatmullRomCurve3([[SPRING.x,0,SPRING.z],[-1.5,0,-2.6],[-.3,0,-.8],[.8,0,.9],[1.9,0,2.6],[3,0,4.6]].map(p=>new THREE.Vector3(...p))).getSpacedPoints(60);
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
  // The river's channel: a flat bed the whole way from the spring, so the water never runs underground.
  const {d}=riverDistance(x,z),cut=smooth(1.2,.42,d);
  return h*(1-cut)-.36*cut;
}
// Where things sit (x, z): the fire up front on the near bank, the bear on his log just behind it (so he faces you
// across the flames), the tent behind him.
const SEAT=new THREE.Vector2(-1.75,1.05),FIRE=new THREE.Vector2(-.95,1.85),TENT=new THREE.Vector2(-2.7,-.35);
const RAW=new THREE.Color("#fbf3e6"),GOLDEN=new THREE.Color("#e0a050"),CHARRED=new THREE.Color("#3b2a22");

export default function AboutScene({ state, slot = 1, side = "right", onReady }) {
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
    const water=createWater(riverPoints,outline,{width:.72,fall:1.5,fade:.7,level:-.13,volume:.32,head:.04});world.add(water.group);
    const shared={uTime:{value:0},uBreeze:{value:.025},uGust:{value:.04}};
    const on=(x,z,lift=0)=>new THREE.Vector3(x,heightAt(x,z)+lift,z);

    // Pines on the high ground at the back and along the far bank, clear of the river, the camp and the edge.
    const spots=[];
    for(let tries=0;spots.length<11&&tries<400;tries++){
      const a=rng()*Math.PI*2,r=Math.sqrt(rng())*outline(a)*.86,x=Math.cos(a)*r,z=Math.sin(a)*r;
      if(riverDistance(x,z).d<1.2||z>.6&&x<1||Math.hypot(x-FIRE.x,z-FIRE.y)<1.4||Math.hypot(x-TENT.x,z-TENT.y)<1.3||Math.hypot(x-SEAT.x,z-SEAT.y)<1.4)continue;
      if(spots.some(p=>Math.hypot(p.x-x,p.z-z)<.95))continue;
      spots.push({position:on(x,z),rotation:rng()*Math.PI*2,scale:.95+rng()*.55});
    }
    const pines=createSwayingInstances(createPineGeometry(4),spots,createFoliageMaterial(shared));world.add(pines.mesh);
    // A few aspens among them, already gold; they shed a leaf or two when the cursor brushes past.
    const aspenSpots=[];
    for(let tries=0;aspenSpots.length<5&&tries<400;tries++){
      const a=rng()*Math.PI*2,r=Math.sqrt(rng())*outline(a)*.84,x=Math.cos(a)*r,z=Math.sin(a)*r;
      if(riverDistance(x,z).d<1.1||z>.6&&x<1||Math.hypot(x-FIRE.x,z-FIRE.y)<1.4||Math.hypot(x-TENT.x,z-TENT.y)<1.2||Math.hypot(x-SEAT.x,z-SEAT.y)<1.3)continue;
      if([...spots,...aspenSpots].some(p=>Math.hypot(p.position.x-x,p.position.z-z)<.8))continue;
      aspenSpots.push({position:on(x,z),rotation:rng()*Math.PI*2,scale:.8+rng()*.3});
    }
    const aspens=createSwayingInstances(createAspen(rng).scale(1.9,1.9,1.9),aspenSpots,createFoliageMaterial(shared));world.add(aspens.mesh);
    const LEAVES=24,leafMesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(.12,.08),new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:1,flatShading:true}),LEAVES);
    leafMesh.frustumCulled=false;world.add(leafMesh);
    {const colors=["#f2c443","#e0a92c","#f5b366"].map(c=>new THREE.Color(c));for(let i=0;i<LEAVES;i++)leafMesh.setColorAt(i,colors[i%3]);}
    const leaves=Array.from({length:LEAVES},()=>({life:-1,pos:new THREE.Vector3(),ground:0,rest:0,phase:0,spin:new THREE.Vector3()})),leafDummy=new THREE.Object3D();
    function dropLeaf(tree){
      const leaf=leaves.find(l=>l.life<0),p=aspenSpots[tree];if(!leaf||!p)return;
      const a=rng()*Math.PI*2,r=rng()*.3*p.scale;
      leaf.pos.set(p.position.x+Math.cos(a)*r,p.position.y+(1.1+rng()*.6)*p.scale,p.position.z+Math.sin(a)*r);
      leaf.ground=Math.max(heightAt(leaf.pos.x,leaf.pos.z),-.12)+.02;leaf.life=0;leaf.rest=0;leaf.phase=rng()*6;leaf.spin.set(rng()*3,rng()*3,rng()*3);
    }
    function updateLeaves(dt){
      leaves.forEach((l,i)=>{
        if(l.life<0)leafDummy.scale.setScalar(0);
        else{
          l.life+=dt;
          if(l.pos.y>l.ground){l.pos.y=Math.max(l.ground,l.pos.y-dt*.4);l.pos.x+=Math.sin(l.life*2.4+l.phase)*dt*.3;l.pos.z+=Math.cos(l.life*1.9+l.phase)*dt*.22;leafDummy.rotation.set(l.life*l.spin.x,l.life*l.spin.y,l.life*l.spin.z);}
          else{l.rest+=dt;leafDummy.rotation.set(-Math.PI/2,0,l.phase);}
          leafDummy.position.copy(l.pos);leafDummy.scale.setScalar(l.rest>2?Math.max(0,1-(l.rest-2)):1);
          if(l.rest>3)l.life=-1;
        }
        leafDummy.updateMatrix();leafMesh.setMatrixAt(i,leafDummy.matrix);
      });
      leafMesh.instanceMatrix.needsUpdate=true;
    }

    // Bank rocks, the fire ring, the log seat and a few stones along the water.
    const stone=new THREE.DodecahedronGeometry(1,0);
    const rocks=[];
    for(let i=0;i<8;i++){const p=riverPoints[8+i*6],side=i%2?1:-1;rocks.push([p.x+side*(.8+rng()*.25),p.z+(rng()-.5)*.4,.12+rng()*.14]);}
    for(let k=0;k<8;k++){const a=k/8*Math.PI*2;rocks.push([FIRE.x+Math.cos(a)*.34,FIRE.y+Math.sin(a)*.34,.08+rng()*.03]);}
    // The spring: boulders banked up behind the head of the river, the water welling out from between them.
    {const back=new THREE.Vector3().subVectors(SPRING,riverPoints[4]).setY(0).normalize(),across=new THREE.Vector3(-back.z,0,back.x);
      [[.55,0,.3],[.42,.5,.22],[.42,-.5,.24],[.2,.78,.16],[.2,-.8,.15],[.75,.32,.18],[.72,-.3,.17]].forEach(([b,c,size])=>rocks.push([SPRING.x+back.x*b+across.x*c,SPRING.z+back.z*b+across.z*c,size]));}
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
    let tent;{const w=.62,h=.78,l=.6,v=(x,y,z)=>new THREE.Vector3(x,y,z),a=v(-w,0,-l),b=v(w,0,-l),c=v(0,h,-l),d=v(-w,0,l),e=v(w,0,l),f=v(0,h,l),door=[v(-.24,0,l+.01),v(.24,0,l+.01),v(0,.5,l+.01)];
      const olive=new THREE.Color("#66733f"),shade=new THREE.Color("#55613a"),dark=new THREE.Color("#2a2232");
      tent=new THREE.Mesh(faceted([[a,d,f],[a,f,c],[b,c,f],[b,f,e],[a,c,b],[d,e,f],door],(tri,color)=>color.copy(tri===door?dark:tri[0]===b?shade:olive)),new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.95,side:THREE.DoubleSide}));
      tent.position.copy(on(TENT.x,TENT.y));tent.rotation.y=.9;world.add(tent);}

    // Blob shadows under the bear, the log and the tent.
    const shadowCanvas=document.createElement("canvas");shadowCanvas.width=shadowCanvas.height=64;
    const s2=shadowCanvas.getContext("2d"),sg=s2.createRadialGradient(32,32,0,32,32,32);sg.addColorStop(0,"rgba(20,10,35,.55)");sg.addColorStop(1,"rgba(20,10,35,0)");s2.fillStyle=sg;s2.fillRect(0,0,64,64);
    const shadowTexture=new THREE.CanvasTexture(shadowCanvas),shadowMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false});
    for(const [x,z,w,h] of [[SEAT.x,SEAT.y,1.5,.9],[TENT.x,TENT.y,1.8,1.6]]){const blob=new THREE.Mesh(new THREE.PlaneGeometry(w,h).rotateX(-Math.PI/2),shadowMaterial);blob.position.copy(on(x,z,.03));world.add(blob);}

    // The ranger bear on his log, facing the fire, a roasting stick in his right paw held out over the flames.
    const seatAt=on(SEAT.x,SEAT.y),facing=Math.atan2(FIRE.x-SEAT.x,FIRE.y-SEAT.y);
    const log=new THREE.Mesh(paintGeometry(new THREE.CylinderGeometry(.18,.2,1.2,7).rotateZ(Math.PI/2),"#6a4630"),flatMaterial());
    log.position.copy(seatAt).add(new THREE.Vector3(0,.17,0));log.rotation.y=facing;world.add(log);
    const bear=createRangerBearMaterial(),BEAR=1.45,hold=new THREE.Vector2(.95,-.18),rest=new THREE.Vector2(.55,-.2);
    const ranger=new THREE.Mesh(createRangerBearGeometry(),bear.material);
    ranger.scale.setScalar(BEAR);ranger.position.copy(seatAt).add(new THREE.Vector3(0,.36-BEAR*.3,-.04));ranger.rotation.y=facing;world.add(ranger);
    bear.uniforms.uSit.value=1.45;bear.uniforms.uArmA.value.copy(hold);bear.uniforms.uArmB.value.copy(rest);
    // Everything on the stick lives in the bear's own space: from his paw toward a point just above the flames.
    ranger.updateMatrix();
    const hand=new THREE.Vector3(),overFire=on(FIRE.x,FIRE.y,.42).applyMatrix4(ranger.matrix.clone().invert()),mouth=new THREE.Vector3(0,.71,.27);
    bearHandAt(hold,hand);const STICK=overFire.distanceTo(hand)+.04;
    const stick=new THREE.Mesh(paintGeometry(new THREE.CylinderGeometry(.006,.009,STICK,5).translate(0,STICK/2,0),"#9a7448"),flatMaterial());ranger.add(stick);
    const mallowMaterial=new THREE.MeshStandardMaterial({color:RAW,roughness:.8,emissive:"#ff8a3a",emissiveIntensity:0});
    const mallow=new THREE.Mesh(new THREE.CylinderGeometry(.032,.032,.055,9),mallowMaterial);ranger.add(mallow);
    const mallowFlame=new THREE.Mesh(new THREE.ConeGeometry(.04,.13,6).translate(0,.065,0),new THREE.MeshBasicMaterial({color:"#ffa040",transparent:true,opacity:.9,depthWrite:false}));
    mallowFlame.visible=false;ranger.add(mallowFlame);
    const up=new THREE.Vector3(0,1,0),toFire=new THREE.Vector3(),lifted=new THREE.Vector3(.15,1,.45).normalize(),dir=new THREE.Vector3(),tipAt=new THREE.Vector3();
    // Roasting: toast runs 0 (raw) → 1 (golden) → 1.3 (on fire). treat: the eating sequence, -1 when not eating.
    const roast={toast:0,treat:-1,burning:-1,shake:-1,cycle:0,wait:0};
    function eat(){if(roast.treat<0){roast.treat=0;roast.burning=-1;mallowFlame.visible=false;needsRender=true;}}
    // Fireflies over the water.
    const FLIES=18,flyPositions=new Float32Array(FLIES*3),flies=Array.from({length:FLIES},()=>{const p=riverPoints[Math.floor(rng()*50)+5];return {x:p.x+(rng()-.5)*2.4,z:p.z+(rng()-.5)*2.4,y:.4+rng()*.9,phase:rng()*9};});
    const flyGeometry=new THREE.BufferGeometry();flyGeometry.setAttribute("position",new THREE.BufferAttribute(flyPositions,3));
    const flyMaterial=new THREE.PointsMaterial({color:"#e7ff9a",size:.07,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
    world.add(new THREE.Points(flyGeometry,flyMaterial));
    flies.forEach(fly=>{fly.hx=fly.x;fly.hz=fly.z;});

    // The fire can be stoked: it flares, throws a shower of sparks and toasts faster for a while.
    let flare=0,tentWobble=0;
    function stoke(){flare=1;sparks.forEach(spark=>{spark.t=rng()*.15;spark.life=.7+rng()*.8;spark.dx=(rng()-.5)*.7;spark.dz=(rng()-.5)*.7;});needsRender=true;}
    // Pointer: drag to spin; tap the bear or his marshmallow, the fire, or the tent.
    const raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2(),canvas=renderer.domElement;
    const pick=(event,objects)=>{const rect=canvas.getBoundingClientRect();ndc.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(ndc,camera);return raycaster.intersectObjects(objects,false).length>0;};
    const bearParts=[ranger,stick,mallow,mallowFlame,log],fireParts=[camp,...flames];
    const onMoon=event=>{const rect=canvas.getBoundingClientRect(),p=moonDisc.position.clone().project(camera),x=(p.x+1)/2*rect.width+rect.left,y=(1-p.y)/2*rect.height+rect.top;return Math.hypot(event.clientX-x,event.clientY-y)<40;};
    const spin=createSpin(canvas,{rest:-.25,
      over:event=>onMoon(event)||pick(event,[...bearParts,...fireParts,tent]),
      onTap:event=>{if(onMoon(event))shoot();else if(pick(event,bearParts))eat();else if(pick(event,fireParts))stoke();else if(pick(event,[tent])){tentWobble=1;needsRender=true;}}});
    // Hover (a mouse only; touch keeps to the idle life): the trees near the cursor stir, the aspens shed a leaf or two,
    // the fireflies drift out of the way and the bear gives a little wave. Passive: a drag spins the island instead.
    const hover=new THREE.Vector3(),shedAt=new Float32Array(aspenSpots.length).fill(-9);
    let waving=-1,lastWave=-9,hoverX=0,hoverY=0,hoverAt=0;
    function onHover(event){
      if(event.pointerType!=="mouse"||event.buttons||preference.matches)return;
      const now=performance.now(),speed=Math.hypot(event.clientX-hoverX,event.clientY-hoverY)/Math.max(16,now-hoverAt);hoverX=event.clientX;hoverY=event.clientY;hoverAt=now;
      const rect=canvas.getBoundingClientRect();ndc.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(ndc,camera);
      const hit=raycaster.intersectObject(island.surface,false)[0],kick=Math.min(1,speed*.9);if(!hit||kick<.03)return;
      world.worldToLocal(hover.copy(hit.point));
      for(const set of [pines,aspens])set.mesh.userData.placements.forEach((p,i)=>{
        const d=Math.hypot(p.position.x-hover.x,p.position.z-hover.z);if(d>=1.5)return;
        set.sway[i]=Math.min(.1,set.sway[i]+(1-d/1.5)*kick*.05);
        if(set===aspens&&time-shedAt[i]>.8){shedAt[i]=time;dropLeaf(i);if(rng()<.5)dropLeaf(i);}
      });
      flies.forEach(fly=>{const dx=fly.x-hover.x,dz=fly.z-hover.z,d=Math.hypot(dx,dz);if(d<1.5&&d>.01){fly.x+=dx/d*(1.5-d)*.4;fly.z+=dz/d*(1.5-d)*.4;}});
      if(Math.hypot(hover.x-SEAT.x,hover.z-SEAT.y)<1.5&&time-lastWave>4&&roast.treat<0){waving=0;lastWave=time;}
      needsRender=true;
    }
    canvas.addEventListener("pointermove",onHover);

    // The night sky behind it all (it stays put while the island spins): twinkling stars on a wall far back past the
    // island, a little moon with a halo, and now and then a shooting star, or one on demand when you tap the moon.
    const back=new THREE.Vector3(.42,.4,.8).normalize().negate(),skyRight=new THREE.Vector3().crossVectors(back,new THREE.Vector3(0,1,0)).normalize().negate(),skyUp=new THREE.Vector3().crossVectors(skyRight,back).negate();
    const skyAt=(x,y,out=new THREE.Vector3())=>out.copy(back).multiplyScalar(55).addScaledVector(skyRight,x).addScaledVector(skyUp,y);
    const STARS=160,starPositions=new Float32Array(STARS*3),starSeeds=new Float32Array(STARS),star=new THREE.Vector3();
    for(let i=0;i<STARS;i++){skyAt((rng()-.5)*110,-4+Math.pow(rng(),.7)*34,star);starPositions.set([star.x,star.y,star.z],i*3);starSeeds[i]=rng();}
    const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute("position",new THREE.BufferAttribute(starPositions,3));starGeometry.setAttribute("aSeed",new THREE.BufferAttribute(starSeeds,1));
    const starUniforms={uTime:{value:0},uPixel:{value:1}};
    scene.add(new THREE.Points(starGeometry,new THREE.ShaderMaterial({uniforms:starUniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:`attribute float aSeed;uniform float uTime,uPixel;varying float vAlpha;void main(){
        vAlpha=(.35+.65*aSeed)*(.6+.4*sin(uTime*(1.+aSeed*2.)+aSeed*40.));gl_PointSize=(1.2+aSeed*2.3)*uPixel;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(1.,.97,.9,vAlpha*smoothstep(1.,0.,d));}`})));
    const moonCanvas=document.createElement("canvas");moonCanvas.width=moonCanvas.height=128;
    {const g=moonCanvas.getContext("2d"),halo=g.createRadialGradient(64,64,10,64,64,64);halo.addColorStop(0,"rgba(255,240,210,.5)");halo.addColorStop(1,"rgba(255,240,210,0)");g.fillStyle=halo;g.fillRect(0,0,128,128);
      g.fillStyle="#fff4dc";g.beginPath();g.arc(64,64,17,0,Math.PI*2);g.fill();
      g.fillStyle="rgba(214,196,170,.7)";for(const [x,y,r] of [[58,58,4],[70,68,3],[62,72,2.2],[71,56,1.8]]){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}}
    const moonTexture=new THREE.CanvasTexture(moonCanvas);moonTexture.colorSpace=THREE.SRGBColorSpace;
    const moonDisc=new THREE.Sprite(new THREE.SpriteMaterial({map:moonTexture,transparent:true,depthWrite:false,fog:false}));skyAt(-22,14,moonDisc.position);moonDisc.scale.setScalar(5.5);scene.add(moonDisc);
    // The shooting star: a streak sprite that slides down across the sky and burns out.
    const streakCanvas=document.createElement("canvas");streakCanvas.width=256;streakCanvas.height=16;
    {const g=streakCanvas.getContext("2d"),grad=g.createLinearGradient(0,0,256,0);grad.addColorStop(0,"rgba(255,255,255,0)");grad.addColorStop(.85,"rgba(255,244,220,.8)");grad.addColorStop(1,"rgba(255,255,255,1)");
      g.fillStyle=grad;g.beginPath();g.moveTo(0,8);g.lineTo(250,4);g.arc(250,8,4,-Math.PI/2,Math.PI/2);g.lineTo(0,8);g.fill();}
    const streakTexture=new THREE.CanvasTexture(streakCanvas);
    const streak=new THREE.Mesh(new THREE.PlaneGeometry(1,.06),new THREE.MeshBasicMaterial({map:streakTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,opacity:0}));
    streak.visible=false;scene.add(streak);
    const shooting={t:-1,wait:4+rng()*6,from:new THREE.Vector3(),to:new THREE.Vector3()};
    function shoot(){if(shooting.t>=0)return;const x=(rng()-.2)*60,y=14+rng()*12,dx=(rng()<.5?-1:1)*(16+rng()*10);skyAt(x,y,shooting.from);skyAt(x+dx,y-7-rng()*5,shooting.to);shooting.t=0;streak.visible=true;needsRender=true;}
    function updateShooting(dt){
      if(shooting.t<0){shooting.wait-=dt;if(shooting.wait<=0)shoot();return;}
      shooting.t+=dt;const k=shooting.t/1.1;
      if(k>=1){shooting.t=-1;shooting.wait=7+rng()*10;streak.visible=false;return;}
      const head=new THREE.Vector3().lerpVectors(shooting.from,shooting.to,k),dir=new THREE.Vector3().subVectors(shooting.to,shooting.from).normalize(),len=4+k*5;
      streak.position.copy(head).addScaledVector(dir,-len/2);streak.scale.set(len,1,1);streak.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),dir);
      // Face the camera but keep pointing along its path.
      const a=head.clone().project(camera),b=head.clone().sub(dir).project(camera);streak.quaternion.copy(camera.quaternion);streak.rotateZ(Math.atan2((a.y-b.y)/camera.aspect,(a.x-b.x)));
      streak.material.opacity=Math.sin(k*Math.PI);
    }

    // Framing: the diorama to one side on wide screens (the words scroll past on the other), centred and further off when tall.
    let tall=false,lean=new THREE.Vector2(),leanTarget=new THREE.Vector2();
    const view={w:1,h:1};
    function frame(){
      const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;tall=camera.aspect<.85;view.w=w;view.h=h;
      if(tall)camera.setViewOffset(w,h,0,h*.14,w,h);else camera.setViewOffset(w,h,(side==="left"?.22:-.22)*w,0,w,h);
      camera.updateProjectionMatrix();place();starUniforms.uPixel.value=renderer.getPixelRatio();needsRender=true;
    }
    function place(){
      const distance=tall?42:21.5;camera.position.set(.42+lean.x*.06,.4+lean.y*.04,.8).normalize().multiplyScalar(distance);camera.lookAt(0,tall?-.4:.3,0);
    }
    const resize=new ResizeObserver(frame);resize.observe(mount);
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});observer.observe(mount);
    const onPointer=event=>{leanTarget.set(event.clientX/window.innerWidth*2-1,event.clientY/window.innerHeight*2-1);};
    window.addEventListener("pointermove",onPointer,{passive:true});

    let time=0,needsRender=true,since=0,flow=0;
    const clock=new THREE.Clock();
    function tick(dt){
      const reduced=preference.matches,step=reduced?0:dt;time+=step;flow+=step;
      shared.uTime.value=time;shared.uBreeze.value=reduced?0:.025;shared.uGust.value=reduced?0:.04;
      for(const set of [pines,aspens]){for(let i=0;i<set.sway.length;i++)set.sway[i]*=Math.exp(-dt*2.2);set.update();}
      updateLeaves(step);flies.forEach(fly=>{const k=1-Math.exp(-step*.4);fly.x+=(fly.hx-fly.x)*k;fly.z+=(fly.hz-fly.z)*k;});
      water.uniforms.uTime.value=time;water.uniforms.uFlow.value=flow;
      world.position.y=Math.sin(time*.45)*.12;world.rotation.y=spin.update(dt)+Math.sin(time*.13)*.03;
      lean.lerp(leanTarget,1-Math.exp(-dt*1.5));place();
      // Fire: each cone flickers on its own beat; the light breathes with it.
      flare*=Math.exp(-dt*.7);const big=1+flare*.9;
      flames.forEach((flame,i)=>{const f=(.8+.2*Math.sin(time*(9+i*3)+i)+.12*Math.sin(time*(23+i*5)))*big;flame.scale.set((1+.1*Math.sin(time*13+i))*(1+flare*.3),f,(1+.1*Math.cos(time*11+i))*(1+flare*.3));flame.rotation.y=time*(.6+i*.3);});
      firelight.intensity=(9+2.2*Math.sin(time*11)+1.4*Math.sin(time*27))*(1+flare*.6);glow.material.opacity=.75+.15*Math.sin(time*9);glow.scale.setScalar(2.4*(1+flare*.4));
      tentWobble*=Math.exp(-dt*2.5);{const w=Math.sin(time*22)*tentWobble;tent.scale.set(1+w*.06,1-w*.08,1+w*.06);tent.rotation.z=w*.05;}
      sparks.forEach((spark,i)=>{spark.t+=step;if(spark.t>spark.life){spark.t=0;spark.life=1.2+rng()*1.2;spark.dx=(rng()-.5)*.3;spark.dz=(rng()-.5)*.3;}
        const k=spark.t/spark.life;sparkPositions.set([fireAt.x+spark.dx*k+Math.sin(time*3+i)*.05*k,fireAt.y+.2+k*1.5,fireAt.z+spark.dz*k],i*3);});
      sparkGeometry.attributes.position.needsUpdate=true;sparkPoints.material.opacity=.9;
      puffs.forEach(puff=>{const u=puff.userData;u.t=(u.t+step)%4;const k=u.t/4;puff.position.set(fireAt.x+k*.5,fireAt.y+.7+k*2.2,fireAt.z-k*.3);puff.scale.setScalar(.35+k*1.1);puff.material.opacity=Math.sin(k*Math.PI)*.35;});
      // The marshmallow: it toasts over the fire (faster when stoked). Golden, he usually eats it; every third one he
      // forgets, it catches fire, and he gives it a shake to put it out before eating it anyway.
      let pull=0,shakeAngle=0,chew=0,mallowScale=1;
      if(roast.treat<0){
        roast.toast+=step*(.085+flare*.25);
        if(roast.burning<0&&roast.shake<0){
          if(roast.toast>=1&&roast.cycle%3!==2){roast.wait+=step;if(roast.wait>1.2)eat();}
          else if(roast.toast>=1.3){roast.burning=0;mallowFlame.visible=true;}
        }
        if(roast.burning>=0){roast.burning+=step;if(roast.burning>1.6){roast.burning=-1;roast.shake=0;}}
        if(roast.shake>=0){roast.shake+=step;const k=roast.shake/.9;shakeAngle=Math.sin(k*Math.PI*5)*(1-k)*.5;pull=Math.sin(Math.min(1,k)*Math.PI)*.4;
          if(k>=1){roast.shake=-1;mallowFlame.visible=false;eat();}}
      }
      if(roast.treat>=0){
        // Up comes the stick (0–.4 s), the marshmallow pops into his mouth (.4–1.1), he chews, a fresh one goes on (1.4–1.8)
        // and the stick goes back over the fire (1.8–2.4).
        const t=roast.treat+=dt;
        pull=t<.4?smooth(0,.4,t):t<1.8?1:1-smooth(1.8,2.4,t);
        chew=t>1&&t<1.8?Math.abs(Math.sin((t-1)*12))*.012:0;
        if(t>1.1&&t<1.4){mallowScale=0;}else if(t>=1.4&&t<1.8){if(roast.toast>0){roast.toast=0;roast.wait=0;roast.cycle++;}mallowScale=smooth(1.4,1.8,t);}
        if(t>2.4)roast.treat=-1;
      }
      let wave=0;if(waving>=0){waving+=dt;wave=smooth(0,.35,waving)*(1-smooth(1.4,1.8,waving));if(waving>1.8)waving=-1;}
      bear.uniforms.uArmA.value.set(hold.x+pull*.35,hold.y);bear.uniforms.uArmB.value.set(rest.x+wave*2.1,rest.y+wave*(.5+Math.sin(time*11)*.35));
      bear.uniforms.uBob.value=Math.sin(time*1.6)*.006+chew;
      bearHandAt(bear.uniforms.uArmA.value,hand);stick.position.copy(hand);
      toFire.subVectors(overFire,hand).normalize();dir.copy(toFire).lerp(lifted,pull).normalize();
      stick.quaternion.setFromUnitVectors(up,dir);stick.rotateZ(shakeAngle);stick.rotateX(Math.sin(time*.9)*.04);
      tipAt.set(0,STICK-.035,0).applyQuaternion(stick.quaternion).add(hand);
      // Flying to his mouth on a little arc, shrinking as it goes in.
      const fly=roast.treat>=.4&&roast.treat<1.1?smooth(.4,1.1,roast.treat):0;
      if(fly>0){mallow.position.lerpVectors(tipAt,mouth,fly);mallow.position.y+=Math.sin(fly*Math.PI)*.12;mallowScale=1-smooth(.7,1,fly);}
      else mallow.position.copy(tipAt);
      mallow.quaternion.copy(stick.quaternion);mallow.scale.setScalar(Math.max(.001,mallowScale));
      mallowFlame.position.copy(tipAt).addScaledVector(dir,.03);
      if(mallowFlame.visible){const f=1+.25*Math.sin(time*19)+.1*Math.sin(time*31),out=roast.shake<0?1:Math.max(.01,1-roast.shake/.9*2.5);mallowFlame.scale.set(out,f*out,out);}
      const toast=roast.toast;mallowMaterial.color.copy(RAW).lerp(GOLDEN,Math.min(1,toast));if(toast>1)mallowMaterial.color.lerp(CHARRED,Math.min(1,(toast-1)/.3));
      mallowMaterial.emissiveIntensity=(1-pull)*(.12+flare*.2);
      flies.forEach((fly,i)=>{flyPositions.set([fly.x+Math.sin(time*.4+fly.phase)*.4,fly.y+Math.sin(time*.9+fly.phase)*.15,fly.z+Math.cos(time*.35+fly.phase)*.4],i*3);});
      flyGeometry.attributes.position.needsUpdate=true;starUniforms.uTime.value=time;if(!reduced||shooting.t>=0)updateShooting(dt);flyMaterial.opacity=.55+.45*Math.sin(time*1.7);
      renderer.render(scene,camera);needsRender=false;
    }
    // 30 fps is plenty while it's calm, full rate while dragged or while he's eating; paused while another section is on screen.
    function draw(){
      raf=requestAnimationFrame(draw);
      const dt=Math.min(clock.getDelta(),.05);since+=dt;
      if(!visible||document.hidden||!state.current.live.includes(slot))return;
      const busy=spin.busy||shooting.t>=0||roast.treat>=0||roast.shake>=0||flare>.05||tentWobble>.02||waving>=0||leaves.some(l=>l.life>=0)||[...pines.sway,...aspens.sway].some(v=>v>.003);
      if(preference.matches&&!needsRender&&!busy)return;
      if(!busy&&since<1/30-.002)return;
      tick(Math.min(since,.1));since=0;
    }
    frame();tick(0);mount.dataset.ready="true";draw();
    const readyTimer=setTimeout(()=>ready.current?.(),0);
    if(new URLSearchParams(window.location.search).has("debug"))window.__about={camera,renderer,ranger,stick,mallow,roast,eat,stoke,view,wave:()=>{waving=0;},dropLeaf,aspens};

    return()=>{
      clearTimeout(readyTimer);delete window.__about;cancelAnimationFrame(raf);resize.disconnect();observer.disconnect();window.removeEventListener("pointermove",onPointer);canvas.removeEventListener("pointermove",onHover);spin.dispose();
      scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat())if(m){m.map?.dispose();m.dispose();}});
      glowTexture.dispose();puffTexture.dispose();shadowTexture.dispose();renderer.dispose();renderer.domElement.remove();
    };
  },[state,slot]);
  return <div className="ht-canvas" ref={host} aria-hidden="true" />;
}
