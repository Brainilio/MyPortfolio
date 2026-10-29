"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { createRocketBoosters } from "../rocket-boosters";
import { createBlackHole } from "../black-hole";
import { storyAt, chapterProgress, smooth, clamp, reveal, CHAPTERS } from "./timeline";
import { SUMMIT_SPOT, LAUNCH_PAD, ROCKET_HEIGHT, ASTRONAUT_HEIGHT, EARTH_CENTER, EARTH_RADIUS, EARTH_POLE, MOON, MOON_RADIUS, HOLE, LAST, frameAt, createFrame, pathIndex, rocketLead, shotAt, closeUp, orbitBlend } from "./flight";
import { createStars, createClouds, createMilkyWay, createAurora } from "./sky";
import { createGround, createEarth } from "./earth";
import { glowTexture, createFader, createSaturn, createMars, createSun, createMoon, createMoonJumper, createPortal, createAliens } from "./set-pieces";
import { createGalaxy, GALAXY } from "./galaxy";
import { createRocket } from "./rocket";

const bell=(s,from,peak,to)=>s<peak?smooth((s-from)/(peak-from)):1-smooth((s-peak)/(to-peak));

function createJetpack() {
  const group=new THREE.Group(),metal=new THREE.MeshStandardMaterial({color:0x3d4152,metalness:.6,roughness:.4,flatShading:true});
  const pack=new THREE.Mesh(new THREE.BoxGeometry(.48,.6,.2),metal);pack.position.set(0,.16,-.27);
  const light=new THREE.Mesh(new THREE.BoxGeometry(.3,.04,.02),new THREE.MeshBasicMaterial({color:new THREE.Color(1.4,.9,3),toneMapped:false}));light.position.set(0,.3,-.38);
  group.add(pack,light);
  for(const x of [-.17,.17]){const tank=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.62,10),metal);tank.position.set(x,.12,-.4);group.add(tank);}
  // Shoulder straps: from the top of the pack, over the shoulders, down to the chest where the hands grip.
  const strap=new THREE.MeshStandardMaterial({color:0x2c2f3b,roughness:.8,flatShading:true});
  for(const x of [-.15,.15]){
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x,.4,-.26),new THREE.Vector3(x*1.1,.52,-.06),new THREE.Vector3(x*1.05,.42,.12),new THREE.Vector3(x*.9,.2,.17)]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,12,.022,5,false),strap));
  }
  const flame=createRocketBoosters();flame.group.position.set(0,-.24,-.36);flame.group.scale.setScalar(.3);group.add(flame.group);
  return {group,flame};
}

export default function JourneyScene({ sectionsRef, controls, flashRef, hudRef, aboutRef, onPhase }) {
  const host=useRef(null),phase=useRef(onPhase);
  phase.current=onPhase;
  useEffect(()=>{
    const mount=host.current;
    let renderer,disposed=false,raf=0;
    try { renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'}); } catch { return; }
    // Bloom only on capable screens; low tier renders directly.
    const low=window.innerWidth<760||(navigator.hardwareConcurrency||8)<=4;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,low?1:1.5));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.background=new THREE.Color();scene.fog=new THREE.FogExp2(0x9cc4ea,.0045);
    const camera=new THREE.PerspectiveCamera(50,1,.1,7000);
    const sun=new THREE.DirectionalLight(0xfff1e0,2.6);sun.position.set(-70,80,50);scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xbcd3ff,0x2a2440,1.4));
    const resources=[];
    const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);
    scene.environment=environment.texture;scene.environmentIntensity=.6;room.dispose();pmrem.dispose();resources.push(environment);
    let composer,bloom;
    if(!low){
      composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
      bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.85,.55,1);composer.addPass(bloom);composer.addPass(new OutputPass());
    }
    const preference=matchMedia('(prefers-reduced-motion: reduce)');
    const glow=glowTexture();resources.push(glow);

    // World set pieces, roughly in story order.
    const world=new THREE.Group();scene.add(world);
    const ground=createGround();world.add(ground.group);
    const clouds=createClouds();world.add(clouds.group);
    const earthRig=new THREE.Group(),earth=createEarth(renderer.capabilities.getMaxAnisotropy()),aurora=createAurora(new THREE.Vector3(),EARTH_RADIUS,EARTH_POLE);
    earthRig.add(earth.group,aurora.mesh);world.add(earthRig);resources.push(...earth.textures);
    const stars=createStars();scene.add(stars.group);
    const milkyWay=createMilkyWay();scene.add(milkyWay.mesh);
    const saturn=createSaturn(),mars=createMars();world.add(saturn.group,mars.group);
    const sunGlow=createSun(glow);scene.add(sunGlow.group,sunGlow.flares);sunGlow.occlude(EARTH_CENTER,EARTH_RADIUS*1.02);sunGlow.occlude(MOON,MOON_RADIUS);
    const moon=createMoon(glow);world.add(moon.group);resources.push(moon.map);
    const jumper=createMoonJumper(moon.group);world.add(jumper.sprite);resources.push(jumper.texture);
    const portal=createPortal();world.add(portal.group);
    const aliens=createAliens(glow);world.add(aliens.group);
    const blackHole=createBlackHole();blackHole.group.position.copy(HOLE);blackHole.group.scale.setScalar(24);world.add(blackHole.group);
    const holeFade=createFader(blackHole.group),alienFade=createFader(aliens.group);
    const galaxy=createGalaxy(glow);scene.add(galaxy.group);

    // Actors.
    const rocket=new THREE.Group(),astronaut=new THREE.Group(),rocketModel=createRocket();rocket.add(rocketModel.group);scene.add(rocket,astronaut);
    // A soft puff when the hatch blows.
    const puff=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:0xe8e4ff,transparent:true,opacity:0,depthWrite:false}));scene.add(puff);
    const rocketFlame=createRocketBoosters();scene.add(rocketFlame.group);
    const jetpack=createJetpack();astronaut.add(jetpack.group);
    const boots=[createRocketBoosters(),createRocketBoosters()];boots.forEach(boot=>scene.add(boot.group));
    const tether=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:new THREE.Color(1.6,1,3.2),toneMapped:false}));
    tether.frustumCulled=false;tether.visible=false;scene.add(tether);
    // "Seeing stars" after the ejection: three tiny glints circling the helmet.
    const dizzy=[0,1,2].map(()=>{const star=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:0xfff0b8,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));star.scale.setScalar(.045);scene.add(star);return star;});
    let mixer,actions={},current,headBone,headRest,limbs=[],rest=[];
    const release=object=>object.traverse(child=>{
      child.geometry?.dispose();
      for(const material of (Array.isArray(child.material)?child.material:[child.material])){
        if(!material)continue;
        for(const value of Object.values(material))if(value?.isTexture)value.dispose();
        material.dispose();
      }
    });
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    function load(url,height,parent,ready){loader.load(url,gltf=>{
      if(disposed){release(gltf.scene);return;}
      const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3());
      gltf.scene.position.sub(box.getCenter(new THREE.Vector3()));
      const wrapper=new THREE.Group();wrapper.add(gltf.scene);wrapper.scale.setScalar(height/size.y);parent.add(wrapper);
      ready?.(gltf);
    },undefined,()=>{});}
    load('/models/astronaut-rigged.glb',ASTRONAUT_HEIGHT,astronaut,gltf=>{
      mixer=new THREE.AnimationMixer(gltf.scene);
      for(const clip of gltf.animations)actions[clip.name.split('|').pop()]=mixer.clipAction(clip);
      renderer.compile(gltf.scene,camera);
      headBone=gltf.scene.getObjectByName('Head');headRest=headBone?.quaternion.clone();
      // Flight pose targets in body space (+Y head, +Z chest, +X the astronaut's left): elbows down at his
      // sides with hands up at the chest gripping the jetpack straps; legs trailing with a slight knee bend.
      const bone=name=>gltf.scene.getObjectByName(name);
      limbs=['L','R'].flatMap(side=>{const x=side==='L'?1:-1;return [
        // [bone, child, flying direction, limp drifting direction]
        [bone(`UpperArm.${side}`),bone(`LowerArm.${side}`),new THREE.Vector3(.22*x,-.75,.35),new THREE.Vector3(.85*x,-.35,.15)],
        [bone(`LowerArm.${side}`),bone(`Wrist.${side}`),new THREE.Vector3(-.3*x,.85,.45),new THREE.Vector3(.75*x,.05,.3)],
        [bone(`UpperLeg.${side}`),bone(`LowerLeg.${side}`),new THREE.Vector3(.1*x,-1,-.1),new THREE.Vector3(.28*x,-1,.08)],
        [bone(`LowerLeg.${side}`),bone(`Foot.${side}`),new THREE.Vector3(.08*x,-1,-.5),new THREE.Vector3(.2*x,-1,-.25)],
      ];}).filter(([a,b])=>a&&b).map(([a,b,f,d])=>[a,b,f.normalize(),d.normalize()]);
      rest=[...new Set(limbs.map(l=>l[0]))].map(b=>[b,b.quaternion.clone()]);
      boots.feet=[bone('Foot.L'),bone('Foot.R')];
      // The helmet's facing direction in Head-bone space, so the head can be aimed at things.
      if(headBone){gltf.scene.updateMatrixWorld(true);faceLocal.set(0,0,1).applyQuaternion(headBone.getWorldQuaternion(qw).invert().multiply(gltf.scene.getWorldQuaternion(qp)));}
      // Glossy visor glass so the close-up catches highlights instead of reading as a flat black hole.
      gltf.scene.traverse(child=>{if(child.material?.name==='Grey'){child.material.color.set(0x0c0a1c);child.material.metalness=1;child.material.roughness=.08;child.material.envMapIntensity=2.4;child.material.emissive?.set(0x0d0820);}});
    });


    const clock=new THREE.Clock(),ctx={s:0,time:0,astro:new THREE.Vector3(),rocket:new THREE.Vector3(),rocketPath:new THREE.Vector3(),moon:moon.group.position,frame:createFrame(),tmp:new THREE.Vector3()};
    const rframe=createFrame(),camPos=new THREE.Vector3(),camLook=new THREE.Vector3(),targetPos=new THREE.Vector3(),targetLook=new THREE.Vector3();
    const v1=new THREE.Vector3(),v2=new THREE.Vector3(),dir=new THREE.Vector3(),heading=new THREE.Vector3(),hatch=new THREE.Vector3(),faceLocal=new THREE.Vector3(0,0,1),Y=new THREE.Vector3(0,1,0),Z=new THREE.Vector3(0,0,1);
    const head=new THREE.Vector3(),qGlide=new THREE.Quaternion(),qStand=new THREE.Quaternion(),qFly=new THREE.Quaternion(),qHole=new THREE.Quaternion(),qExtra=new THREE.Quaternion(),qTarget=new THREE.Quaternion(),basis=new THREE.Matrix4();
    const ax=new THREE.Vector3(),ay=new THREE.Vector3(),az=new THREE.Vector3(),tumbleAxis=new THREE.Vector3(1,.4,.2).normalize();
    const skyLow=new THREE.Color(0x9cc4ea),skyHigh=new THREE.Color(0x2c5d99),space=new THREE.Color(0x04050d),alienSky=new THREE.Color(0x060b10),holeSky=new THREE.Color(0x0a0412);
    const view={s:0,about:0},pose={fly:0,drift:0};
    // A dark veil over the 3D (not the page UI) that softens hard camera cuts.
    const veil=document.createElement('div');veil.style.cssText='position:absolute;inset:0;background:#030409;opacity:0;pointer-events:none';mount.appendChild(veil);
    // Cloud mist for the climb: soft white banks that drift down past the lens as the rocket rises.
    const mist=document.createElement('div');
    mist.style.cssText='position:absolute;inset:-20% 0;opacity:0;pointer-events:none;background:radial-gradient(45% 30% at 25% 30%,#fff 0,rgba(255,255,255,0) 70%),radial-gradient(50% 28% at 75% 55%,#f4f7fc 0,rgba(244,247,252,0) 70%),radial-gradient(40% 25% at 40% 80%,#fff 0,rgba(255,255,255,0) 70%),rgba(226,234,245,.92);will-change:transform,opacity';
    mount.appendChild(mist);
    let lastShot='',cutAt=-1e9;
    let first=true,time=0,endingStart=0,lastPhase='',started=false,seenStart=-1;const from={s:0,about:0};
    const setPhase=value=>{if(value!==lastPhase){lastPhase=value;phase.current?.(value);}};
    const rocketRise=(s,out)=>{const t=(s-1.08)/.56,rise=t<=0?0:t<=1?Math.pow(t,2.2):1+(t-1)*2.2;return out.copy(LAUNCH_PAD).setY(ROCKET_HEIGHT/2+rise*188);};
    const pa=new THREE.Vector3(),pb=new THREE.Vector3(),qd=new THREE.Quaternion(),qw=new THREE.Quaternion(),qp=new THREE.Quaternion(),qI=new THREE.Quaternion();
    // Rotate a bone (in world space) so it points along `direction`, blended by `weight`.
    const applyWorld=(bone,rotation)=>{bone.getWorldQuaternion(qw).premultiply(rotation);bone.parent.getWorldQuaternion(qp);bone.quaternion.copy(qp.invert().multiply(qw));bone.updateMatrixWorld(true);};
    const aimBone=(bone,child,direction,weight)=>{bone.getWorldPosition(pa);child.getWorldPosition(pb);qd.setFromUnitVectors(pb.sub(pa).normalize(),direction);applyWorld(bone,qI.identity().slerp(qd,weight));};
    // Turn the head (by `weight`) so the helmet faces `direction`.
    const aimHead=(direction,weight)=>{pa.copy(faceLocal).applyQuaternion(headBone.getWorldQuaternion(qw));qd.setFromUnitVectors(pa,v2.copy(direction).normalize());applyWorld(headBone,qI.identity().slerp(qd,weight));};
    const basisQuat=(q,up,forwardDown)=>{ay.copy(up).normalize();az.copy(forwardDown).addScaledVector(ay,-forwardDown.dot(ay)).normalize();ax.crossVectors(ay,az);basis.makeBasis(ax,ay,az);return q.setFromRotationMatrix(basis);};

    function draw(){raf=requestAnimationFrame(draw);if(!document.hidden)render(Math.min(clock.getDelta(),.05));}
    function render(dt) {
      const reduced=preference.matches,now=performance.now();
      if(!reduced)time+=dt;
      // Story time comes from the director: timed transitions between chapters, and inside a tall chapter
      // a gently eased scrub of its internal scroll.
      const story=controls.current.story;
      if(story.start!==seenStart){seenStart=story.start;from.s=view.s;from.about=view.about;}
      const progress=reduced?.5:chapterProgress(sectionsRef.current?.[story.index]);
      const cue=storyAt(story,from,now,progress);
      if(cue.active||first||reduced){view.s=cue.s;view.about=cue.about;}
      else{view.s+=(cue.s-view.s)*(1-Math.exp(-dt*3));view.about=cue.about;}
      const s=view.s,about=view.about;
      ctx.s=s;ctx.time=time;
      // The About beat holds story time at 2.0. The push-in to the helmet starts during the end of the
      // ejection (s 1.82→2.0) so there's no dead zone, then eases back out at the end of the chapter.
      // Scenes, not blends: the drift (s 1.64–1.9), the helmet close-up (until About is 90% read), then flight.
      // Each change is a cut covered by a short fade.
      const daze=s>=1.9&&s<2.001&&about<.9?1:0,flying=about>=.9||s>2.001?1:0;

      // Ending: triggered by Contact submit, cancelled by scrolling back up.
      const c=controls.current;
      if(c.ending&&!endingStart)endingStart=now;
      if(!c.ending&&endingStart){endingStart=0;setPhase('');}
      if(endingStart&&s<6.5){c.ending=0;endingStart=0;setPhase('cancel');}
      const e=endingStart?(reduced?9:(now-endingStart)/1000):-1,galaxyMode=e>2.75;
      if(galaxyMode&&e>4.3)setPhase('galaxy');
      // Pose weights ease over time (not scroll), so scene cuts never pop his limbs.
      const easeIn=first||reduced?1:1-Math.exp(-dt*5);
      pose.fly+=(flying*(galaxyMode?0:1)-pose.fly)*easeIn;pose.drift+=((s>1.64&&!flying?1:0)-pose.drift)*easeIn;

      const k=s<1.78?0:pathIndex(s);frameAt(k,ctx.frame);const fr=ctx.frame;
      const pull=smooth((s-6)/.95);

      // Rocket: on the pad, rising, then flying ahead along the path, finally orbiting the black hole.
      const lift=smooth((s-1.66)/.3),orbit=smooth((s-5.95)/.35),orbitAngle=time*.35;
      rocketRise(Math.max(s,1.08),ctx.rocket);
      frameAt(Math.min(k+rocketLead(s),LAST),rframe);
      // Projects: two figure-eights (a lemniscate in the side/up plane) while it keeps flying forward.
      const eight=smooth((s-2.95)/.15)*(1-smooth((s-3.9)/.15)),theta=(s-3)*Math.PI*4,loop=7*eight;
      ctx.rocketPath.copy(rframe.position).addScaledVector(rframe.up,.8);
      v1.copy(ctx.rocketPath).addScaledVector(rframe.side,Math.sin(theta)*loop).addScaledVector(rframe.up,Math.sin(theta)*Math.cos(theta)*loop);
      ctx.rocket.lerp(v1,lift);
      // Heading follows the loop's velocity (forward travel is ~300 units per story unit here).
      heading.copy(rframe.tangent).addScaledVector(rframe.side,Math.cos(theta)*loop*.042).addScaledVector(rframe.up,Math.cos(2*theta)*loop*.042).normalize();
      v2.set(HOLE.x+150+Math.cos(orbitAngle)*40,HOLE.y+12+Math.sin(orbitAngle*.7)*6,HOLE.z+Math.sin(orbitAngle)*70);
      ctx.rocket.lerp(v2,orbit);
      dir.copy(Y).lerp(heading,lift).lerp(v1.set(-Math.sin(orbitAngle),0,Math.cos(orbitAngle)*.65),orbit).normalize();
      // Idle: a slow, gentle bob while it flies.
      if(!reduced)ctx.rocket.addScaledVector(rframe.up,Math.sin(time*.5)*.12*lift*(1-orbit));

      // Astronaut: summit, boards the rocket, gets thrown off, then flies the path.
      // Astronaut: walks to the pad and climbs aboard (hidden inside for the launch), is blown out of the
      // hatch at the ejection, tumbles clear, then flies the path.
      const standing=v2.copy(SUMMIT_SPOT).setY(ASTRONAUT_HEIGHT/2),aboard=s>1.05&&s<1.64;
      hatch.copy(ctx.rocket).add(rocketModel.exit);
      // He hops from the summit into the open hatch as the camera turns to the rocket.
      if(s<.9)ctx.astro.copy(standing);
      else if(s<1.64){const hop=smooth((s-.9)/.15);ctx.astro.copy(standing).lerp(hatch,hop);ctx.astro.y+=Math.sin(hop*Math.PI)*2.2;}
      // The ejection itself happens under the blackout: when the picture returns he's already adrift.
      else if(s<1.78){frameAt(0,rframe);ctx.astro.copy(rframe.position);}
      else ctx.astro.copy(fr.position);
      rocketModel.setHatch(bell(s,.82,.94,1.08));
      puff.visible=false;
      ctx.astro.lerp(HOLE,pull*.06);

      // Idle float: a slow drift up and down, in the close-up and in flight alike.
      // A barely-there float in flight; nothing that rocks back and forth.
      if(!reduced)ctx.astro.y+=Math.sin(time*.6)*.04*pose.fly;

      // Ending choreography.
      let dive=0;
      if(e>=0){
        const swoop=smooth(e/1.3);v1.copy(ctx.astro).addScaledVector(fr.side,3).addScaledVector(fr.up,1);
        ctx.rocket.lerp(v1,swoop);dir.lerp(fr.tangent,swoop).normalize();
        dive=smooth((e-1.3)/1.4);
        const spiral=Math.sin(dive*Math.PI)*6;
        for(const actor of [ctx.astro,ctx.rocket]){actor.lerp(HOLE,dive);actor.addScaledVector(fr.side,Math.sin(dive*12)*spiral).addScaledVector(fr.up,Math.cos(dive*12)*spiral);}
        tether.visible=e>.9&&e<2.75;
        tether.geometry.attributes.position.setXYZ(0,ctx.astro.x,ctx.astro.y,ctx.astro.z);tether.geometry.attributes.position.setXYZ(1,ctx.rocket.x,ctx.rocket.y,ctx.rocket.z);tether.geometry.attributes.position.needsUpdate=true;
      } else tether.visible=false;
      let galaxyT=0;
      if(galaxyMode){
        galaxyT=smooth((e-2.75)/6);const g=clamp((e-2.75)/10,0,1);
        ctx.rocket.copy(GALAXY).add(v1.set(-120+g*260,35,90-g*150));dir.set(260,0,-150).normalize();
      }
      rocket.position.copy(ctx.rocket);rocket.quaternion.setFromUnitVectors(Y,dir).multiply(qExtra.setFromAxisAngle(Y,reduced?0:time*.4*smooth((s-1.9)/.3)+Math.cos(theta)*1.1*eight));
      rocket.scale.setScalar(galaxyMode?1:1-dive*.95);
      rocketFlame.group.position.copy(ctx.rocket).addScaledVector(dir,-ROCKET_HEIGHT*.45*rocket.scale.x);rocketFlame.group.quaternion.copy(rocket.quaternion);
      rocketFlame.group.scale.setScalar(ROCKET_HEIGHT/2.3*smooth((s-1.02)/.06)*rocket.scale.x*(galaxyMode?1:1));rocketFlame.group.visible=s>1.02||galaxyMode;
      rocketFlame.update(time,reduced);

      // Orientation: standing → tumbling → superman flight → fighting the black hole.
      astronaut.position.copy(ctx.astro);
      qStand.setFromAxisAngle(Y,Math.atan2(camera.position.x-ctx.astro.x,camera.position.z-ctx.astro.z));
      basisQuat(qFly,fr.tangent,v1.copy(fr.up).negate());
      basisQuat(qHole,v2.copy(ctx.astro).sub(HOLE),v1);
      // Moon pass: classic side-on "superman" flight across the frame: body level, chest down,
      // head end raised slightly, so the profile camera sees the full horizontal silhouette.
      const glide=smooth((s-4.04)/.14)*(1-smooth((s-4.86)/.14));
      basisQuat(qGlide,v2.copy(fr.tangent).addScaledVector(Y,.22),v1.set(0,-1,0));
      qTarget.copy(qStand).slerp(qFly,pose.fly).slerp(qGlide,glide).slerp(qHole,pull*.9);
      if(!reduced){
        // Weightless drift after the ejection: a slow, self-running roll and pitch (calmed in the close-up).
        const limp=pose.drift*(1-daze);
        // One slow, continuous tumble (a full turn every ~25 s) that never reverses direction.
        qTarget.multiply(qExtra.setFromAxisAngle(tumbleAxis,(time*.25)%(Math.PI*2)*limp));
      }
      // Close-up: he faces the camera, still.
      if(daze>0)qTarget.slerp(qStand,daze);
      if(first||reduced)astronaut.quaternion.copy(qTarget);else astronaut.quaternion.slerp(qTarget,1-Math.exp(-dt*6));
      const fly=pose.fly;
      const shrink=1-dive*.95;astronaut.scale.set(shrink*(1-pull*.15),shrink*(1+pull*.45),shrink*(1-pull*.15));
      astronaut.visible=!galaxyMode&&!aboard;
      // The jetpack ignites with a quick ramp rather than popping on.
      jetpack.flame.group.visible=fly>.02&&!galaxyMode;jetpack.flame.group.scale.setScalar(.42*fly*(1+pull*.9));jetpack.flame.update(time,reduced);
      if(mixer){
        const want=s<.85&&!reduced?'Wave':'Idle';
        if(want!==current&&actions[want]){actions[want].reset().fadeIn(.4).play();actions[current]?.fadeOut(.4);current=want;}
        if(headBone)headBone.quaternion.copy(headRest);
        rest.forEach(([b,q])=>b.quaternion.copy(q));
        mixer.update(reduced?0:dt);
        // Blend into the flying pose: limbs aimed in body space, head tipped up to look where he's going.
        if(fly>.001||pose.drift>.001){
          astronaut.updateMatrixWorld(true);
          if(pose.drift>.001)for(const [b,child,,limp] of limbs)aimBone(b,child,v1.copy(limp).applyQuaternion(astronaut.quaternion),pose.drift*(1-fly));
          for(const [b,child,local] of limbs)aimBone(b,child,v1.copy(local).applyQuaternion(astronaut.quaternion),fly);
          // Look where he's going; on the Moon pass, look back at Earth, then up at the Moon.
          if(headBone){
            aimHead(fr.tangent,.45*fly*(1-glide));
            const toMoon=smooth((s-4.38)/.2);
            v1.copy(EARTH_CENTER).addScaledVector(Y,EARTH_RADIUS*.75).lerp(MOON,toMoon).sub(astronaut.position);
            if(glide>.001)aimHead(v1,.8*glide);
          }
        }
      }
      astronaut.updateMatrixWorld(true);
      // Boot thrusters fire with the jetpack while flying.
      boots.forEach((boot,i)=>{const foot=boots.feet?.[i];boot.group.visible=!!foot&&fly>.05&&!galaxyMode;if(!boot.group.visible)return;
        foot.getWorldPosition(boot.group.position);boot.group.quaternion.copy(astronaut.quaternion);boot.group.scale.setScalar(.14*fly*(1+pull*.6));boot.update(time+i*.37,reduced);});
      // Aim at the helmet's centre: the Head bone sits at the neck, so lift along the body's up axis.
      if(headBone)headBone.getWorldPosition(head).add(v2.copy(Y).applyQuaternion(astronaut.quaternion).multiplyScalar(.17));else head.copy(ctx.astro).addScaledVector(Y,.8);
      dizzy.forEach((star,i)=>{const a=time*3+i*2.09;star.position.copy(head).add(v1.set(Math.cos(a)*.34,.3+Math.sin(a*2)*.03,Math.sin(a)*.34));star.material.opacity=daze*.75;star.visible=daze>.01&&!reduced;});

      // Camera: blended shots, damped like a game chase cam, with sway and shake.
      if(galaxyMode){
        camPos.copy(GALAXY).add(v1.set(0,25+galaxyT*275,260-galaxyT*220));camLook.copy(GALAXY).add(v1.set(0,10-galaxyT*10,-60+galaxyT*60));
      } else {
        const shot=daze?'closeup':shotAt(ctx,targetPos,targetLook);if(daze)shotAt(ctx,targetPos,targetLook);
        if(daze>0){closeUp(ctx,head,v1,v2);orbitBlend(head,targetPos,v1,daze,targetPos);targetLook.lerp(v2,daze);}
        if(e>0)targetLook.lerp(HOLE,smooth((e-1)/1.2));
        // Hard cut: jump straight to the new framing and fade up from dark.
        const cut=!first&&shot!==lastShot;lastShot=shot;
        // One soft dip per cut; cuts close together (e.g. during a snap glide) share it instead of flashing.
        if(cut&&!reduced&&now-cutAt>700&&cue.mist<.3&&cue.dark<.3)cutAt=now;
        if(first||reduced||cut){camPos.copy(targetPos);camLook.copy(targetLook);}
        // Heavily damped, like a dolly on rails: no shake, no sway.
        // The launch camera is locked to the climbing rocket (lagging behind it reads as jitter); elsewhere it glides.
        else{const rate=shot==='launch'?14:2.8;camPos.lerp(targetPos,1-Math.exp(-dt*rate));camLook.lerp(targetLook,1-Math.exp(-dt*(rate+.4)));}
      }
      camera.position.copy(camPos);camera.lookAt(camLook);
      camera.fov=THREE.MathUtils.lerp(50+(reduced?0:pull*6)+(galaxyMode?6:0),34,daze);camera.updateProjectionMatrix();camera.updateMatrixWorld();
      // Drives the About photo card and panel fades.
      if(aboutRef.current){
        const el=aboutRef.current.style;
        el.setProperty('--about',about.toFixed(3));el.setProperty('--daze',daze.toFixed(3));
        document.documentElement.style.setProperty('--daze',daze.toFixed(3));
      }

      // Sky, fog and stars follow altitude; the portal tints the sky.
      const y=camPos.y;
      if(y<60)scene.background.copy(skyLow).lerp(skyHigh,smooth(y/60));
      else scene.background.copy(skyHigh).lerp(space,smooth((y-60)/110));
      scene.background.lerp(alienSky,smooth((s-5.28)/.06)*(1-smooth((s-6)/.3))).lerp(holeSky,smooth((s-6)/.4));
      if(galaxyMode)scene.background.copy(space);
      scene.fog.color.copy(scene.background);scene.fog.density=galaxyMode?0:.0045*(1-smooth((y-30)/110));
      stars.update(time,galaxyMode?1:smooth((y-70)/90),camera);milkyWay.update(galaxyMode?.6:smooth((y-100)/90),camera);
      // Glow belongs to space: no bloom against the bright daytime sky and snow.
      // Softer key light once we're in space, so white suits and hulls don't clip into bloom.
      sun.intensity=THREE.MathUtils.lerp(2.6,1.7,smooth((y-110)/70));
      if(bloom)bloom.strength=galaxyMode?1.1:.85*smooth((y-110)/70)*(1-daze*.75);

      world.visible=!galaxyMode;galaxy.group.visible=galaxyMode;galaxy.update(time,smooth((e-2.75)/1.4));
      // Clouds thin out as we climb past them instead of vanishing at a fixed height.
      clouds.material.opacity=1-smooth((y-120)/50);clouds.group.visible=clouds.material.opacity>.01;ground.group.visible=y<170;ground.beacon.visible=Math.sin(time*4)>0;
      // The globe appears above the cloud deck and stays behind us once the chase heads off.
      earthRig.visible=y>20;earthRig.position.copy(EARTH_CENTER);earth.uniforms.uTime.value=time;aurora.uniforms.uTime.value=time;aurora.uniforms.uOpacity.value=smooth((s-1.45)/.25);
      // Set pieces emerge from the dark with distance; they're only culled once they're behind us.
      // `presence` fades pieces in while the camera is still looking elsewhere (the path curls back on itself).
      // Deep space backdrop: Saturn and Mars ahead, the Moon and Sun back home. Faded with altitude.
      const deep=smooth((y-110)/80);
      // Saturn and Mars belong to our side of the portal; they're gone once you're through it.
      const home=deep*smooth((s-2.3)/.5)*(1-smooth((s-5.18)/.14));
      saturn.fade(home);saturn.update(time);mars.fade(home);
      moon.update(camera,deep);
      sunGlow.update(camera,galaxyMode?0:smooth((y-120)/70),reduced);
      jumper.update(s,camera,1);
      portal.update(time,camera);if(s>5.6)portal.group.visible=false;
      alienFade(s>6.4?0:reveal(camera.position.distanceTo(portal.group.position),150,380));v1.copy(ctx.astro).addScaledVector(fr.tangent,.8);aliens.update(time,s,v1);
      // The black hole only emerges once the alien zone is behind us.
      holeFade(reveal(camera.position.distanceTo(HOLE),380,720)*smooth((s-5.8)/.3));blackHole.update(time,Math.max(pull,dive),camera,reduced);
      // Tilt the disk into a diagonal sweep, rising to the right like Gargantua.
      blackHole.group.quaternion.multiply(qExtra.setFromAxisAngle(Z,.42));

      // Covers: the director's cuts (dark or cloud), plus a short dip on camera cuts inside a transition.
      veil.style.opacity=String(Math.max(cue.dark,.7*(1-smooth((now-cutAt)/700))));
      mist.style.opacity=String(cue.mist);if(cue.mist>0)mist.style.transform=`translateY(${((now-story.start)/story.duration-.65)*30}%)`;
      if(flashRef.current)flashRef.current.style.opacity=e>0?String(bell(e,2.3,2.75,3.5)):'0';
      if(hudRef.current)hudRef.current.textContent=`s ${s.toFixed(3)} · ${CHAPTERS[story.index].id}${about>0&&about<1?` · about ${about.toFixed(2)}`:''}${galaxyMode?' · galaxy':''}`;
      if(composer)composer.render(dt);else renderer.render(scene,camera);
      first=false;
      if(!started){started=true;mount.dataset.ready='true';}
    }
    const resize=()=>{const w=window.innerWidth,h=window.innerHeight;renderer.setSize(w,h);composer?.setSize(w,h);bloom?.resolution.set(w/2,h/2);camera.aspect=w/h;camera.updateProjectionMatrix();};
    window.addEventListener('resize',resize);
    resize();
    // Compile every shader up front (hidden pieces included) so nothing hitches when it first appears.
    const precompile=root=>{const hidden=[];root.traverse(o=>{if(!o.visible){hidden.push(o);o.visible=true;}});renderer.compile(root,camera);hidden.forEach(o=>o.visible=false);};
    precompile(scene);
    draw();
    // ?debug: render frames on demand (background tabs throttle requestAnimationFrame).
    if(new URLSearchParams(window.location.search).has('debug')){window.__journeyStep=(frames=60)=>{for(let i=0;i<frames;i++)render(1/30);};window.__journey={scene,camera,clouds,ground,rocket,astronaut};}
    return()=>{
      disposed=true;cancelAnimationFrame(raf);delete window.__journeyStep;delete window.__journey;veil.remove();mist.remove();
      window.removeEventListener('resize',resize);
      mixer?.stopAllAction();release(scene);resources.forEach(resource=>resource.dispose());composer?.dispose();renderer.dispose();renderer.domElement.remove();
    };
  },[sectionsRef,controls,flashRef,hudRef,aboutRef]);
  return <div className="journey-canvas" ref={host} aria-hidden="true" />;
}
