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
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { createRocketBoosters } from "../rocket-boosters";
import { createBlackHole } from "../black-hole";
import { restS, smooth, clamp, reveal, CHAPTERS } from "./timeline";
import { LAUNCH_PAD, ROCKET_HEIGHT, ASTRONAUT_HEIGHT, EARTH_CENTER, EARTH_RADIUS, EARTH_POLE, MOON, MOON_RADIUS, HOLE, LAST, frameAt, createFrame, pathIndex, rocketLead, shotAt } from "./flight";
import { createStars, createClouds, createMilkyWay, createAurora } from "./sky";
import { createGround, createEarth } from "./earth";
import { glowTexture, createFader, createSaturn, createMars, createSun, createMoon, createMoonJumper } from "./set-pieces";
import { createAlienGame } from "./alien-game";
import { createGalaxy, GALAXY } from "./galaxy";
import { GlitchShader } from "./glitch";
import { createLiquidLayer } from "./liquid";
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

export default function JourneyScene({ controls, flashRef, hudRef, scoreRef, onPhase }) {
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
    // Bloom on capable screens; the glitch pass only while a section cut plays (low tier renders directly otherwise).
    const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
    let bloom;if(!low){bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.85,.55,1);composer.addPass(bloom);}
    composer.addPass(new OutputPass());
    const glitch=new ShaderPass(GlitchShader);glitch.enabled=false;composer.addPass(glitch);
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
    const game=createAlienGame(glow);world.add(game.group);
    const blackHole=createBlackHole();blackHole.group.position.copy(HOLE);blackHole.group.scale.setScalar(24);world.add(blackHole.group);
    const holeFade=createFader(blackHole.group);
    const galaxy=createGalaxy(glow);scene.add(galaxy.group);

    // Actors.
    const rocket=new THREE.Group(),astronaut=new THREE.Group(),rocketModel=createRocket();rocket.add(rocketModel.group);scene.add(rocket,astronaut);
    const rocketFlame=createRocketBoosters();scene.add(rocketFlame.group);
    const jetpack=createJetpack();astronaut.add(jetpack.group);
    const boots=[createRocketBoosters(),createRocketBoosters()];boots.forEach(boot=>scene.add(boot.group));
    const tether=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:new THREE.Color(1.6,1,3.2),toneMapped:false}));
    tether.frustumCulled=false;tether.visible=false;scene.add(tether);
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
      // GLTFLoader strips '.' from node names, so the rig's "UpperArm.L" arrives as "UpperArmL".
      // Flight pose targets in body space (+Y head, +Z chest, +X the astronaut's left): elbows down at his
      // sides with hands up at the chest gripping the jetpack straps; legs trailing with a slight knee bend.
      const bone=name=>gltf.scene.getObjectByName(name);
      limbs=['L','R'].flatMap(side=>{const x=side==='L'?1:-1;return [
        // [bone, child, flying direction, floating direction (arms eased out)]. Legs always keep the idle pose:
        // aiming the shins stretches and twists the boots.
        [bone(`UpperArm${side}`),bone(`LowerArm${side}`),new THREE.Vector3(.22*x,-.75,.35),new THREE.Vector3(.42*x,-.9,.14)],
        [bone(`LowerArm${side}`),bone(`Wrist${side}`),new THREE.Vector3(-.3*x,.85,.45),new THREE.Vector3(.35*x,-.45,.55)],
        [bone(`UpperLeg${side}`),bone(`LowerLeg${side}`),null,null],
        [bone(`LowerLeg${side}`),bone(`Foot${side}`),null,null],
      ];}).filter(([a,b])=>a&&b).map(([a,b,f,d])=>[a,b,f?.normalize(),d?.normalize()]);
      rest=[...new Set(limbs.map(l=>l[0]))].map(b=>[b,b.quaternion.clone()]);
      boots.feet=[bone('FootL'),bone('FootR')];
      // The helmet's facing direction in Head-bone space, so the head can be aimed at things.
      if(headBone){gltf.scene.updateMatrixWorld(true);faceLocal.set(0,0,1).applyQuaternion(headBone.getWorldQuaternion(qw).invert().multiply(gltf.scene.getWorldQuaternion(qp)));}
      // Glossy visor glass so the close-up catches highlights instead of reading as a flat black hole.
      gltf.scene.traverse(child=>{if(child.material?.name==='Grey'){child.material.color.set(0x0c0a1c);child.material.metalness=1;child.material.roughness=.08;child.material.envMapIntensity=2.4;child.material.emissive?.set(0x0d0820);}});
    });


    const clock=new THREE.Clock(),ctx={s:0,time:0,astro:new THREE.Vector3(),rocket:new THREE.Vector3(),rocketPath:new THREE.Vector3(),moon:moon.group.position,frame:createFrame(),tmp:new THREE.Vector3()};
    const rframe=createFrame(),camPos=new THREE.Vector3(),camLook=new THREE.Vector3(),targetPos=new THREE.Vector3(),targetLook=new THREE.Vector3();
    const v1=new THREE.Vector3(),v2=new THREE.Vector3(),dir=new THREE.Vector3(),heading=new THREE.Vector3(),faceLocal=new THREE.Vector3(0,0,1),Y=new THREE.Vector3(0,1,0),Z=new THREE.Vector3(0,0,1);
    const head=new THREE.Vector3(),qGlide=new THREE.Quaternion(),qStand=new THREE.Quaternion(),qFly=new THREE.Quaternion(),qHole=new THREE.Quaternion(),qExtra=new THREE.Quaternion(),qTarget=new THREE.Quaternion(),basis=new THREE.Matrix4();
    const ax=new THREE.Vector3(),ay=new THREE.Vector3(),az=new THREE.Vector3(),camRight=new THREE.Vector3(),camUp=new THREE.Vector3();
    const skyLow=new THREE.Color(0x9cc4ea),skyHigh=new THREE.Color(0x2c5d99),space=new THREE.Color(0x04050d),alienSky=new THREE.Color(0x060b10),holeSky=new THREE.Color(0x0a0412);
    const view={s:0},pose={fly:0,drift:0};
    // About: he floats just above the atmosphere, Earth below him, facing the camera. Off to one side of the
    // launch, so he's out of frame until the camera drifts over to him.
    const ABOUT_SPOT=new THREE.Vector3(-25,184,38),qSway=new THREE.Euler();
    // The Sun is behind him there, so a soft key from the camera side keeps his visor and suit readable.
    const fill=new THREE.DirectionalLight(0xdcd6ff,0);fill.position.copy(ABOUT_SPOT).add(new THREE.Vector3(-3,2.5,-8));fill.target.position.copy(ABOUT_SPOT);scene.add(fill,fill.target);
    // Close-up: helmet and shoulders, straight on. The camera rides half of his float, so he bobs gently in
    // frame. On portrait screens a little further back, with the helmet above the copy.
    const aboutShot=(pos,look)=>{const tall=camera.aspect<.8,bob=(ctx.astro.y-ABOUT_SPOT.y)*.5;
      pos.copy(ABOUT_SPOT).add(v1.set(0,(tall?.5:.72)+bob,tall?-4.6:-2.1));look.copy(ABOUT_SPOT).add(v1.set(0,(tall?-.15:.6)+bob,0));};
    // Section changes play a transition (glitch, liquid or fade) as the final post pass, swapping the scene at
    // its peak. Sections that share a shot ('same') just continue.
    const CUTS={cut:[0,760],liquid:[1,1300],fade:[2,1100]};
    let shown=-1,cutAt=0,cutMode=0,cutLength=760,swapped=true;
    // Skills: a rocket streaks across behind him (left to right on screen); he watches, then drifts off after it,
    // mostly into the distance so he stays in the narrow close-up frame as he goes.
    const FLY_A=ABOUT_SPOT.clone().add(new THREE.Vector3(48,7,80)),FLY_B=ABOUT_SPOT.clone().add(new THREE.Vector3(-70,1,55));
    const departDir=new THREE.Vector3(-.28,.04,1).normalize(),qDepart=new THREE.Quaternion();
    // Aliens: he hangs back on the path, the rocket is parked ahead, and saucers arrive out of deep space beyond it.
    const alienFrame=createFrame(),alienAt=new THREE.Vector3(),alienRocket=new THREE.Vector3(),portalAt=new THREE.Vector3(),muzzle=new THREE.Vector3(),toTarget=new THREE.Vector3();
    frameAt(8.3,alienFrame);alienAt.copy(alienFrame.position);
    frameAt(8.5,rframe);alienRocket.copy(rframe.position).addScaledVector(rframe.side,1).addScaledVector(rframe.up,4);
    frameAt(9.6,rframe);portalAt.copy(rframe.position).addScaledVector(rframe.up,14);
    const mouseLook={x:0,y:0},watch={x:0,v:0};
    // Critically damped spring toward `target`: eases off, glides and settles in about 3.3×`lag` seconds.
    const spring=(state,target,lag,dt)=>{const w=2/lag,x=w*dt,decay=1/(1+x+.48*x*x+.235*x*x*x),change=state.x-target,temp=(state.v+w*change)*dt;state.v=(state.v-w*temp)*decay;state.x=target+(change+temp)*decay;};
    const liquid=createLiquidLayer(renderer,document.querySelector('.journey')??document.body);
    let first=true,time=0,endingStart=0,lastPhase='',started=false;
    const setPhase=value=>{if(value!==lastPhase){lastPhase=value;phase.current?.(value);}};
    // Pointer parallax: the camera leans slowly toward the mouse (mouse only; touch and reduced motion stay still).
    const pointer={x:0,y:0},lean={x:0,y:0};
    const onPointer=event=>{if(event.pointerType!=='mouse')return;pointer.x=event.clientX/window.innerWidth*2-1;pointer.y=event.clientY/window.innerHeight*2-1;};
    window.addEventListener('pointermove',onPointer,{passive:true});
    const rocketRise=(s,out)=>{const t=(s-1.08)/.56,rise=t<=0?0:t<=1?Math.pow(t,2.2):1+(t-1)*2.2;return out.copy(LAUNCH_PAD).setY(ROCKET_HEIGHT/2+rise*188);};
    const pa=new THREE.Vector3(),pb=new THREE.Vector3(),qd=new THREE.Quaternion(),qw=new THREE.Quaternion(),qp=new THREE.Quaternion(),qI=new THREE.Quaternion();
    // Rotate a bone (in world space) so it points along `direction`, blended by `weight`.
    const applyWorld=(bone,rotation)=>{bone.getWorldQuaternion(qw).premultiply(rotation);bone.parent.getWorldQuaternion(qp);bone.quaternion.copy(qp.invert().multiply(qw));bone.updateMatrixWorld(true);};
    const aimBone=(bone,child,direction,weight)=>{bone.getWorldPosition(pa);child.getWorldPosition(pb);qd.setFromUnitVectors(pb.sub(pa).normalize(),direction);applyWorld(bone,qI.identity().slerp(qd,weight));};
    // Turn the head (by `weight`) so the helmet faces `direction`.
    // The head never turns past NECK radians from where his body faces (no owl turns when the body swings away).
    const NECK=1,bodyFace=new THREE.Vector3(),qn=new THREE.Quaternion(),neckAxis=new THREE.Vector3();
    const limitNeck=direction=>{
      bodyFace.set(0,0,1).applyQuaternion(astronaut.quaternion);direction.normalize();
      const angle=bodyFace.angleTo(direction);if(angle<=NECK)return direction;
      neckAxis.crossVectors(bodyFace,direction).normalize();
      return direction.copy(bodyFace).applyQuaternion(qn.setFromAxisAngle(neckAxis,NECK));
    };
    const aimHead=(direction,weight)=>{limitNeck(direction);pa.copy(faceLocal).applyQuaternion(headBone.getWorldQuaternion(qw));qd.setFromUnitVectors(pa,v2.copy(direction).normalize());applyWorld(headBone,qI.identity().slerp(qd,weight));};
    const basisQuat=(q,up,forwardDown)=>{ay.copy(up).normalize();az.copy(forwardDown).addScaledVector(ay,-forwardDown.dot(ay)).normalize();ax.crossVectors(ay,az);basis.makeBasis(ax,ay,az);return q.setFromRotationMatrix(basis);};

    function draw(){raf=requestAnimationFrame(draw);if(!document.hidden)render(Math.min(clock.getDelta(),.05));}
    function render(dt) {
      const reduced=preference.matches,now=performance.now();
      if(!reduced)time+=dt;
      const story=controls.current.story;
      let cut=0,snap=first;
      if(cutAt){
        const k=(now-cutAt)/cutLength;
        if(!swapped&&k>=.45){shown=story.index;swapped=true;snap=true;}
        cut=k<.45?smooth(k/.45):1-smooth((k-.45)/.55);
        if(k>=1)cutAt=0;
      } else if(story.index!==shown){
        const next=story.index,enter=next===shown+1?CHAPTERS[next].enter:next===shown-1&&CHAPTERS[shown].enter==='same'?'same':'cut';
        if(first||reduced||shown<0){shown=next;snap=true;}
        else if(enter==='same')shown=next;
        else{[cutMode,cutLength]=CUTS[enter]??CUTS.cut;cutAt=now;swapped=false;}
      }
      const id=CHAPTERS[shown]?.id,closeUp=id==='summit'||id==='about'||id==='skills',aliensStage=id==='aliens',projectsStage=id==='projects';
      const progress=reduced?.5:story.progress[shown]??0;
      // Skills: idle, then the rocket streaks past (flyby), then he goes after it (depart).
      const skills=id==='skills'?progress:0,flyby=clamp((skills-.35)/.33,0,1),depart=reduced?0:clamp((skills-.7)/.3,0,1);
      // Sections rest at their story time, easing through it while their copy scrolls.
      const target=restS(shown,progress);
      view.s=snap?target:view.s+(target-view.s)*(1-Math.exp(-dt*2.5));
      const s=view.s;
      ctx.s=s;ctx.time=time;
      const flying=s>2.001&&!aliensStage?1:0;
      fill.intensity+=((closeUp?1.8:0)-fill.intensity)*(snap?1:1-Math.exp(-dt*3));

      // Ending: triggered by Contact submit, cancelled by scrolling back up.
      const c=controls.current;
      if(c.ending&&!endingStart)endingStart=now;
      if(!c.ending&&endingStart){endingStart=0;setPhase('');}
      if(endingStart&&s<6.5){c.ending=0;endingStart=0;setPhase('cancel');}
      const e=endingStart?(reduced?9:(now-endingStart)/1000):-1,galaxyMode=e>2.75;
      if(galaxyMode&&e>4.3)setPhase('galaxy');
      // Pose weights ease over time (not scroll), so scene cuts never pop his limbs.
      const easeIn=snap||reduced?1:1-Math.exp(-dt*5);
      // Floating (close-up, aliens) he hangs relaxed; chasing, he flies.
      const flyWant=closeUp?smooth(depart*1.4):flying*(galaxyMode?0:1);
      pose.fly+=(flyWant-pose.fly)*easeIn;pose.drift+=((closeUp||aliensStage?1:0)-pose.drift)*easeIn;

      const k=s<1.78?0:pathIndex(s);frameAt(k,ctx.frame);const fr=ctx.frame;
      const pull=smooth((s-6)/.95);

      // Rocket: on the pad, flying ahead along the path (figure-eights in Projects), finally orbiting the black hole.
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
      let rocketShown=true,thrust=s>1.02?1:0;
      if(closeUp){
        // The flyby: a straight streak across the background, nose first.
        ctx.rocket.copy(FLY_A).lerp(FLY_B,flyby);dir.copy(FLY_B).sub(FLY_A).normalize();rocketShown=flyby>0&&flyby<1;
      } else if(aliensStage){
        // Parked ahead, hovering on a low flame.
        ctx.rocket.copy(alienRocket);if(!reduced)ctx.rocket.y+=Math.sin(time*.8)*.25;dir.copy(Y);thrust=.45;
      }

      // Astronaut: floating in the close-up, flying the path, holding the line by the ship.
      if(closeUp){
        ctx.astro.copy(ABOUT_SPOT);if(!reduced)ctx.astro.y+=Math.sin(time*.55)*.12;
        ctx.astro.addScaledVector(departDir,smooth(depart)*16);
      } else if(aliensStage){ctx.astro.copy(alienAt);if(!reduced)ctx.astro.y+=Math.sin(time*.55)*.15;}
      else ctx.astro.copy(fr.position);
      rocketModel.setHatch(0);
      ctx.astro.lerp(HOLE,pull*.06);

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
      rocket.position.copy(ctx.rocket);rocket.quaternion.setFromUnitVectors(Y,dir).multiply(qExtra.setFromAxisAngle(Y,reduced||closeUp?0:time*.4*smooth((s-1.9)/.3)+Math.cos(theta)*1.1*eight));
      rocket.scale.setScalar(galaxyMode?1:1-dive*.95);rocket.visible=rocketShown||galaxyMode;
      rocketFlame.group.position.copy(ctx.rocket).addScaledVector(dir,-ROCKET_HEIGHT*.45*rocket.scale.x);rocketFlame.group.quaternion.copy(rocket.quaternion);
      rocketFlame.group.scale.setScalar(ROCKET_HEIGHT/2.3*thrust*rocket.scale.x);rocketFlame.group.visible=(thrust>0&&rocket.visible)||galaxyMode;
      rocketFlame.update(time,reduced);

      // Orientation: floating → superman flight → fighting the black hole.
      astronaut.position.copy(ctx.astro);
      // The close-up camera sits straight in front of him (-Z); elsewhere he turns to the camera, or (aliens) to the ship.
      if(aliensStage){toTarget.copy(alienRocket).sub(ctx.astro);qStand.setFromAxisAngle(Y,Math.atan2(toTarget.x,toTarget.z));}
      else qStand.setFromAxisAngle(Y,closeUp?Math.PI:Math.atan2(camera.position.x-ctx.astro.x,camera.position.z-ctx.astro.z));
      basisQuat(qFly,fr.tangent,v1.copy(fr.up).negate());
      basisQuat(qHole,v2.copy(ctx.astro).sub(HOLE),v1);
      basisQuat(qDepart,departDir,v1.set(0,-1,0));
      qTarget.copy(qStand).slerp(qFly,closeUp?0:pose.fly).slerp(qDepart,closeUp?smooth(depart*1.2)*.85:0).slerp(qHole,pull*.9);
      // A slow, weightless sway while he floats; never a tumble.
      if(closeUp&&!reduced)qTarget.multiply(qExtra.setFromEuler(qSway.set(Math.sin(time*.33)*.05,Math.sin(time*.21)*.08*(1-depart),Math.sin(time*.4)*.05)));
      if(snap||reduced)astronaut.quaternion.copy(qTarget);else astronaut.quaternion.slerp(qTarget,1-Math.exp(-dt*(closeUp?3:6)));
      const fly=pose.fly;
      const shrink=1-dive*.95;astronaut.scale.set(shrink*(1-pull*.15),shrink*(1+pull*.45),shrink*(1-pull*.15));
      astronaut.visible=!galaxyMode&&!!mixer;
      // The jetpack only shows once he's going somewhere; it ignites with a quick ramp rather than popping on.
      jetpack.group.visible=!(closeUp&&depart===0);jetpack.flame.group.visible=fly>.02&&!galaxyMode;jetpack.flame.group.scale.setScalar(.42*fly*(1+pull*.9));jetpack.flame.update(time,reduced);
      // Aliens: the game moves with the section's scroll; he tracks the nearest saucer.
      muzzle.copy(ctx.astro).addScaledVector(Y,.25).addScaledVector(toTarget.copy(alienRocket).sub(ctx.astro).normalize(),.6);
      const threat=aliensStage?game.update({p:progress,time,now,from:portalAt,to:alienRocket,muzzle,reduced}):null;
      game.group.visible=aliensStage;
      if(aliensStage)for(const shot of c.shots.splice(0))if(game.shoot(shot.x,shot.y,camera,window.innerWidth,window.innerHeight,now)&&scoreRef.current)scoreRef.current.textContent=`${game.zapped} zapped by you`;
      else c.shots.length=0;
      // The head follows the mouse a little, lagging well behind it.
      const lag=reduced?1:1-Math.exp(-dt*.9);mouseLook.x+=(lean.x-mouseLook.x)*lag;mouseLook.y+=(lean.y-mouseLook.y)*lag;
      if(mixer){
        const want='Idle';
        if(want!==current&&actions[want]){actions[want].reset().fadeIn(.4).play();actions[current]?.fadeOut(.4);current=want;}
        if(headBone)headBone.quaternion.copy(headRest);
        rest.forEach(([b,q])=>b.quaternion.copy(q));
        mixer.update(reduced?0:dt);
        // Blend into the flying pose: limbs aimed in body space, head tipped up to look where he's going.
        if(fly>.001||pose.drift>.001){
          astronaut.updateMatrixWorld(true);
          if(pose.drift>.001)for(const [b,child,,limp] of limbs)if(limp)aimBone(b,child,v1.copy(limp).applyQuaternion(astronaut.quaternion),pose.drift*(1-fly));
          for(const [b,child,local] of limbs)if(local)aimBone(b,child,v1.copy(local).applyQuaternion(astronaut.quaternion),fly);
          if(headBone&&!closeUp)aimHead(fr.tangent,.45*fly);
        }
        if(headBone&&(closeUp||aliensStage)){
          astronaut.updateMatrixWorld(true);headBone.getWorldPosition(head);
          if(aliensStage){if(threat)aimHead(v1.copy(threat).sub(head),.8);}
          else{
            // At the camera, nudged toward the mouse and the odd idle glance; then at the rocket as it passes.
            const glance=reduced?0:.45;
            v1.copy(camPos).sub(head).add(v2.set((Math.sin(time*.23)*1.5+Math.sin(time*.071)*.9)*glance-mouseLook.x*1.6,Math.sin(time*.17+.6)*.6*glance-mouseLook.y*.9,0));
            // The flyby: one smooth turn (on its own clock, not the scroll) to stare where the rocket is headed,
            // held until he sets off after it, instead of tracking the rocket back and forth.
            if(reduced)watch.x=0;else spring(watch,closeUp&&flyby>0&&depart<.34?1:0,.6,dt);
            if(watch.x>.001)v1.lerp(v2.copy(FLY_B).sub(head).normalize().multiplyScalar(v1.length()),clamp(watch.x,0,1));
            aimHead(v1,.85*(1-smooth(depart*1.5)*.6));
          }
        }
      }
      astronaut.updateMatrixWorld(true);
      // Boot thrusters fire with the jetpack while flying.
      boots.forEach((boot,i)=>{const foot=boots.feet?.[i];boot.group.visible=!!foot&&fly>.05&&!galaxyMode;if(!boot.group.visible)return;
        foot.getWorldPosition(boot.group.position);boot.group.quaternion.copy(astronaut.quaternion);boot.group.scale.setScalar(.14*fly*(1+pull*.6));boot.update(time+i*.37,reduced);});
      // Aim at the helmet's centre: the Head bone sits at the neck, so lift along the body's up axis.
      if(headBone)headBone.getWorldPosition(head).add(v2.copy(Y).applyQuaternion(astronaut.quaternion).multiplyScalar(.17));else head.copy(ctx.astro).addScaledVector(Y,.8);
      // Camera: each section's own shot, damped like a dolly on rails.
      const tall=camera.aspect<.8;
      if(galaxyMode){
        camPos.copy(GALAXY).add(v1.set(0,25+galaxyT*275,260-galaxyT*220));camLook.copy(GALAXY).add(v1.set(0,10-galaxyT*10,-60+galaxyT*60));
      } else {
        if(closeUp)aboutShot(targetPos,targetLook);
        else if(projectsStage){
          // Close behind him at first; after the first project the camera eases over to the rocket and keeps it
          // on the right (centred on portrait screens), the cards flowing down the left.
          const toRocket=smooth((progress-.16)/.22),offset=tall?0:9;
          v1.copy(ctx.astro).addScaledVector(fr.tangent,-4.2).addScaledVector(fr.up,1.1);
          v2.copy(ctx.astro).addScaledVector(fr.tangent,8).addScaledVector(fr.up,.4);
          targetPos.copy(ctx.rocketPath).addScaledVector(fr.tangent,-30).addScaledVector(fr.up,3).addScaledVector(fr.side,-offset*.35);
          targetLook.copy(ctx.rocketPath).addScaledVector(fr.tangent,10).addScaledVector(fr.up,1.6).addScaledVector(fr.side,-offset);
          targetPos.lerp(v1,1-toRocket);targetLook.lerp(v2,1-toRocket);
        } else if(aliensStage){
          // Over his left shoulder: him in the right foreground (clear of the copy), the ship and its swarm
          // upper centre.
          targetPos.copy(alienAt).addScaledVector(alienFrame.tangent,tall?-12:-4.2).addScaledVector(alienFrame.side,tall?-1.6:-2.4).addScaledVector(alienFrame.up,tall?2.2:1.2);
          targetLook.copy(alienRocket).addScaledVector(alienFrame.side,tall?0:-1).addScaledVector(alienFrame.up,tall?-4.5:-3.2);
        } else shotAt(ctx,targetPos,targetLook);
        if(e>0)targetLook.lerp(HOLE,smooth((e-1)/1.2));
        if(snap||reduced){camPos.copy(targetPos);camLook.copy(targetLook);}
        else{const rate=2.2;camPos.lerp(targetPos,1-Math.exp(-dt*rate));camLook.lerp(targetLook,1-Math.exp(-dt*(rate+.4)));}
      }
      // Lean toward the pointer: a small pan, proportional to how far away the subject is.
      const follow=reduced?0:1-Math.exp(-dt*1.4);
      lean.x+=((reduced?0:pointer.x)-lean.x)*(reduced?1:follow);lean.y+=((reduced?0:pointer.y)-lean.y)*(reduced?1:follow);
      dir.copy(camLook).sub(camPos);const reach=dir.length()*.035;dir.normalize();
      camRight.crossVectors(dir,Y).normalize();camUp.crossVectors(camRight,dir);
      camera.position.copy(camPos).addScaledVector(camRight,lean.x*reach).addScaledVector(camUp,-lean.y*reach*.6);
      camera.lookAt(v1.copy(camLook).addScaledVector(camRight,lean.x*reach*.35).addScaledVector(camUp,-lean.y*reach*.2));
      camera.fov=(closeUp?34:50)+(reduced?0:pull*6)+(galaxyMode?6:0);camera.updateProjectionMatrix();camera.updateMatrixWorld();

      // Sky, fog and stars follow altitude; the alien zone tints the sky.
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
      // The close-up fills the frame with white suit, so bloom is mostly off there.
      if(bloom)bloom.strength=galaxyMode?1.1:.85*smooth((y-110)/70)*(closeUp?.2:aliensStage?.55:1);

      world.visible=!galaxyMode;galaxy.group.visible=galaxyMode;galaxy.update(time,smooth((e-2.75)/1.4));
      // Clouds thin out as we climb past them instead of vanishing at a fixed height.
      clouds.material.opacity=1-smooth((y-120)/50);clouds.group.visible=clouds.material.opacity>.01;ground.group.visible=y<170;ground.beacon.visible=Math.sin(time*4)>0;
      // The globe appears above the cloud deck and stays behind us once the chase heads off.
      earthRig.visible=y>20;earthRig.position.copy(EARTH_CENTER);earth.uniforms.uTime.value=time;aurora.uniforms.uTime.value=time;aurora.uniforms.uOpacity.value=smooth((s-1.45)/.25);
      // Set pieces emerge from the dark with distance; they're only culled once they're behind us.
      // `presence` fades pieces in while the camera is still looking elsewhere (the path curls back on itself).
      // Deep space backdrop: Saturn and Mars ahead, the Moon and Sun back home. Faded with altitude.
      const deep=smooth((y-110)/80);
      // Saturn and Mars fade out as we head into the alien zone.
      const home=deep*smooth((s-2.3)/.5)*(1-smooth((s-5.18)/.14));
      saturn.fade(home);saturn.update(time);mars.fade(home);
      moon.update(camera,deep);
      jumper.update(s,camera,1);
      // The black hole only emerges once the alien zone is behind us.
      holeFade(reveal(camera.position.distanceTo(HOLE),380,720)*smooth((s-5.8)/.3));blackHole.update(time,Math.max(pull,dive),camera,reduced);
      // Tilt the disk into a diagonal sweep, rising to the right like Gargantua.
      blackHole.group.quaternion.multiply(qExtra.setFromAxisAngle(Z,.42));

      if(flashRef.current)flashRef.current.style.opacity=e>0?String(bell(e,2.3,2.75,3.5)):'0';
      if(hudRef.current)hudRef.current.textContent=`s ${s.toFixed(3)} · ${id}${id==='skills'?` · ${skills.toFixed(2)}`:''}${galaxyMode?' · galaxy':''}`;
      glitch.enabled=cut>.001;glitch.uniforms.uAmount.value=cut;glitch.uniforms.uMode.value=cutMode;glitch.uniforms.uTime.value=now/1000;
      if(bloom||glitch.enabled)composer.render(dt);else renderer.render(scene,camera);
      liquid.render(dt,time,reduced);
      first=false;
      if(!started){started=true;mount.dataset.ready='true';}
    }
    const resize=()=>{const w=window.innerWidth,h=window.innerHeight;renderer.setSize(w,h);composer.setSize(w,h);liquid.resize(w,h);bloom?.resolution.set(w/2,h/2);camera.aspect=w/h;camera.updateProjectionMatrix();};
    window.addEventListener('resize',resize);
    resize();
    // Compile every shader up front (hidden pieces included) so nothing hitches when it first appears.
    const precompile=root=>{const hidden=[];root.traverse(o=>{if(!o.visible){hidden.push(o);o.visible=true;}});renderer.compile(root,camera);hidden.forEach(o=>o.visible=false);};
    precompile(scene);
    draw();
    // ?debug: render frames on demand (background tabs throttle requestAnimationFrame).
    if(new URLSearchParams(window.location.search).has('debug')){window.__journeyStep=(frames=60)=>{for(let i=0;i<frames;i++)render(1/30);};window.__journey={scene,camera,clouds,ground,rocket,astronaut};}
    return()=>{
      disposed=true;cancelAnimationFrame(raf);delete window.__journeyStep;delete window.__journey;liquid.dispose();
      window.removeEventListener('resize',resize);window.removeEventListener('pointermove',onPointer);
      mixer?.stopAllAction();release(scene);resources.forEach(resource=>resource.dispose());composer.dispose();renderer.dispose();renderer.domElement.remove();
    };
  },[controls,flashRef,hudRef,scoreRef]);
  return <div className="journey-canvas" ref={host} aria-hidden="true" />;
}
