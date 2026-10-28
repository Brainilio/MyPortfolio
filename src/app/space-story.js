"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createEarthHorizon } from "./earth-horizon";
import { createRocketBoosters } from "./rocket-boosters";
import { createBlackHole } from "./black-hole";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const clamp = THREE.MathUtils.clamp;
const smooth = t => { t=clamp(t,0,1); return t*t*(3-2*t); };
function track(p, keys) {
  for(let i=1;i<keys.length;i++) if(p<=keys[i][0]) {
    return THREE.MathUtils.lerp(keys[i-1][1],keys[i][1],smooth((p-keys[i-1][0])/(keys[i][0]-keys[i-1][0])));
  }
  return keys.at(-1)[1];
}

export default function SpaceStory({ ending }) {
  const host=useRef(null), endingRef=useRef(ending), finish=useRef(null);
  useEffect(()=>{endingRef.current=ending;finish.current?.();},[ending]);
  useEffect(()=>{
    const mount=host.current;
    let renderer,disposed=false,frame=0,astronaut,rocket,endingStart=0;
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
    try { renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'}); } catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.4));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.background=new THREE.Color('#080b18');
    scene.fog=new THREE.FogExp2('#080b18',.008);
    const camera=new THREE.PerspectiveCamera(48,1,.1,180);
    const light=new THREE.DirectionalLight(0xe6dcff,3);light.position.set(-5,18,15);scene.add(light);
    scene.add(new THREE.HemisphereLight(0xc2d7ff,0x27213b,2.5));
    const resources=[];
    const room=new RoomEnvironment();
    const environmentGenerator=new THREE.PMREMGenerator(renderer);
    const environment=environmentGenerator.fromScene(room,.04);
    scene.environment=environment.texture;scene.environmentIntensity=.65;
    room.dispose();environmentGenerator.dispose();resources.push(environment);
    const release=object=>object.traverse(child=>{
      child.geometry?.dispose();
      child.skeleton?.dispose();
      for(const material of (Array.isArray(child.material)?child.material:[child.material])){
        if(!material)continue;
        for(const value of Object.values(material))if(value?.isTexture)value.dispose();
        material.dispose();
      }
    });
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    function load(url,size,ready){loader.load(url,gltf=>{
      if(disposed){release(gltf.scene);return;}
      const box=new THREE.Box3().setFromObject(gltf.scene),center=box.getCenter(new THREE.Vector3());
      gltf.scene.position.sub(center);
      const group=new THREE.Group();group.add(gltf.scene);group.scale.setScalar(size/Math.max(...box.getSize(new THREE.Vector3()).toArray()));
      group.userData.size=Math.max(...box.getSize(new THREE.Vector3()).toArray());
      scene.add(group);ready(group);requestDraw();
    },undefined,()=>{});}
    load('/models/astronaut.glb',2.5,model=>astronaut=model);
    load('/models/rocket.glb',2.3,model=>rocket=model);
    const earth=createEarthHorizon();scene.add(earth);
    // One draw call for the stars. Their depth makes forward travel readable.
    const stars=new Float32Array(430*3),starColors=new Float32Array(430*3);
    const starPalette=[new THREE.Color(0xc3d8ff),new THREE.Color(0xffddb2),new THREE.Color(0xe4d9ff),new THREE.Color(0xf7f7ef)];
    for(let i=0;i<430;i++){
      const rand=n=>{const x=Math.sin((i+1)*n)*43758.5453;return x-Math.floor(x);};
      starPalette[i%4].toArray(starColors,i*3);
      stars[i*3]=(rand(12.98)-.5)*95;stars[i*3+1]=(rand(78.23)-.5)*65+11;stars[i*3+2]=18-rand(39.42)*125;
    }
    const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.BufferAttribute(stars,3));
    starGeometry.setAttribute('color',new THREE.BufferAttribute(starColors,3));
    const starMaterial=new THREE.PointsMaterial({vertexColors:true,size:.065,transparent:true,opacity:0,sizeAttenuation:true});
    scene.add(new THREE.Points(starGeometry,starMaterial));
    // Soft procedural cloud texture, reused across a handful of sprites.
    const cloudCanvas=document.createElement('canvas');cloudCanvas.width=256;cloudCanvas.height=128;
    const ctx=cloudCanvas.getContext('2d');
    for(const [x,y,r] of [[65,76,50],[120,54,52],[175,75,48]]){
      const gradient=ctx.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,'rgba(255,255,255,.8)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,256,128);
    }
    const cloudTexture=new THREE.CanvasTexture(cloudCanvas);resources.push(cloudTexture);
    const cloudMaterial=new THREE.SpriteMaterial({map:cloudTexture,transparent:true,depthWrite:false,opacity:.8});
    const clouds=[];
    for(let i=0;i<10;i++){
      const cloud=new THREE.Sprite(cloudMaterial);cloud.position.set((i%2?1:-1)*(2+i*.65),2+i*.9,9-(i%3)*2);cloud.scale.set(12,6,1);scene.add(cloud);clouds.push(cloud);
    }
    const blackHole=createBlackHole();
    const hole=blackHole.group;hole.position.set(0,11,-58);scene.add(hole);
    const boosters=createRocketBoosters();scene.add(boosters.group);boosters.group.visible=false;
    const sky=new THREE.Color('#a7c9e6'),stratosphere=new THREE.Color('#234f80'),night=new THREE.Color('#080b18');
    const forward=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3();
    const rocketTarget=new THREE.Vector3(),returnTarget=new THREE.Vector3(),exhaustDirection=new THREE.Vector3();
    const rocketTurn=new THREE.Quaternion(),rocketEuler=new THREE.Euler();
    // Deliberate changes of direction, with quiet framing around readable cards.
    const cameraX=[[0,0],[.2,-1.5],[.32,-1.5],[.45,-2.5],[.55,-2.5],[.66,2.5],[.78,-1.5],[.9,1],[1,0]];
    const cameraY=[[0,0],[.2,11],[.43,11],[.55,12],[.67,10.5],[.8,11.5],[1,11]];
    const cameraZ=[[0,24],[.2,18],[.34,13],[.43,5],[.52,-3],[.62,-6],[.74,-17],[.84,-26],[1,-44]];
    const headingX=[[0,0],[.2,.8],[.45,.8],[.55,.8],[.67,-.8],[.8,.4],[1,0]];
    const headingY=[[0,1],[.2,0],[.55,0],[.67,.3],[.8,0],[1,0]];
    function draw(now=0){
      frame=0;if(disposed||document.hidden)return;
      let p=clamp(window.scrollY/Math.max(1,document.documentElement.scrollHeight-window.innerHeight),0,1);
      const reduced=preference.matches;
      if(reduced)p=p<.18?0:p<.4?.26:p<.83?.6:.98;
      const atmosphere=smooth((p-.09)/.14);
      if(p<.15)scene.background.copy(sky).lerp(stratosphere,smooth(p/.15));
      else scene.background.copy(stratosphere).lerp(night,smooth((p-.15)/.09));
      scene.fog.color.copy(scene.background);
      const travel=reduced?.15:1;
      camera.position.set(track(p,cameraX)*travel,track(p,cameraY),track(p,cameraZ));
      const gravity=smooth((p-.83)/.17);
      camera.position.z-=gravity*1.4;
      camera.fov=48-gravity*4;
      camera.updateProjectionMatrix();
      camera.lookAt(camera.position.x+track(p,headingX)*travel,camera.position.y+track(p,headingY)*travel,camera.position.z-18);
      camera.getWorldDirection(forward);right.set(1,0,0).applyQuaternion(camera.quaternion);up.set(0,1,0).applyQuaternion(camera.quaternion);
      starMaterial.opacity=atmosphere*.85;cloudMaterial.opacity=smooth((p-.025)/.035)*(1-smooth((p-.11)/.07))*.8;
      clouds.forEach(cloud=>cloud.visible=p<.24);
      blackHole.update(performance.now()*.001,gravity,camera,reduced);
      // Approach from the upper-right distance, instead of switching on at Contact.
      const holeApproach=smooth((p-.78)/.16);
      hole.position.set(THREE.MathUtils.lerp(28,0,holeApproach),THREE.MathUtils.lerp(25,11,holeApproach),THREE.MathUtils.lerp(-250,-58,holeApproach));
      hole.visible=p>.76;
      if(rocket){
        const mobile=window.innerWidth<=700;
        const chase=smooth((p-.31)/.115),departure=smooth((p-.81)/.07);
        const wobble=reduced?0:Math.sin(p*160)*(1-smooth((p-.4)/.09))*.1;
        // One complete O, including the ship's turn; scrolling backward reverses it.
        const loop=reduced?0:smooth((p-.355)/.07)*Math.PI*2;
        const radius=mobile?.65:1.25;
        const side=0;
        const height=mobile?-2.8:0;
        rocketTarget.copy(camera.position).addScaledVector(forward,9)
          .addScaledVector(right,side+Math.sin(loop)*radius)
          .addScaledVector(up,height+(1-Math.cos(loop))*radius+departure*2)
          .addScaledVector(forward,departure*24);
        rocket.position.copy(camera.position).addScaledVector(forward,20).addScaledVector(right,15).addScaledVector(up,9).lerp(rocketTarget,chase);
        rocket.scale.setScalar((2.3/rocket.userData.size)*(mobile?.65:1));
        // Pitch the nose into depth and bank on departure; preserve its actual size.
        rocketEuler.set(.08-departure*Math.PI*.52,(reduced?0:Math.sin(loop)*.3)+departure*.45,loop+wobble*.3-departure*.5);
        rocket.quaternion.copy(camera.quaternion).multiply(rocketTurn.setFromEuler(rocketEuler));
        rocket.visible=p>.28&&p<.91;
        exhaustDirection.set(0,1,0).applyQuaternion(rocket.quaternion);
        boosters.group.position.copy(rocket.position).addScaledVector(exhaustDirection,mobile?-.68:-1.05);
        boosters.group.quaternion.copy(rocket.quaternion);
        boosters.group.scale.setScalar(mobile?.65:1);boosters.group.visible=rocket.visible;
        boosters.update(performance.now()*.001,reduced);
      }
      if(astronaut){
        const returnToCamera=smooth((p-.86)/.06);
        const flight=endingStart&&p>.88?(reduced?1:smooth((performance.now()-endingStart)/2300)):0;
        const astronautEntry=smooth((p-.14)/.09),astronautExit=smooth((p-.35)/.075);
        astronaut.position.copy(camera.position).addScaledVector(forward,14).addScaledVector(right,13).addScaledVector(up,-6);
        returnTarget.set(1.6,11,4);
        if(window.innerWidth<=700)returnTarget.copy(camera.position).addScaledVector(forward,14).addScaledVector(right,1.35).addScaledVector(up,-1.4);
        astronaut.position.lerp(returnTarget,astronautEntry);
        astronaut.position.addScaledVector(right,-astronautExit*16).addScaledVector(up,astronautExit*3);
        if(p>.8){
          returnTarget.copy(camera.position).addScaledVector(forward,7).addScaledVector(right,window.innerWidth<=700?.35:.9);
          astronaut.position.copy(returnTarget).addScaledVector(right,(1-returnToCamera)*13).addScaledVector(up,(1-returnToCamera)*4);
        }
        astronaut.position.lerp(hole.position,flight);
        if(!reduced&&flight>0){
          const spiral=Math.sin(flight*Math.PI)*.7;
          astronaut.position.addScaledVector(right,Math.sin(flight*Math.PI*4)*spiral);
          astronaut.position.addScaledVector(up,Math.cos(flight*Math.PI*4)*spiral);
        }
        astronaut.scale.setScalar((2.5/astronaut.userData.size||1)*(1-flight*.97)*(window.innerWidth<=700?1-returnToCamera*.28:1));
        if(!reduced){astronaut.scale.x*=1-flight*.55;astronaut.scale.y*=1+Math.sin(flight*Math.PI)*.55;}
        astronaut.rotation.set(.05,track(p,[[0,0],[.32,0],[.42,-1],[.82,-1],[.9,0],[1,.3]])+flight*3,reduced?0:Math.sin(p*18)*.12);
        astronaut.visible=p>.13&&(!(p>.44&&p<.83))&&flight<.99;
        if(flight>0&&flight<1)requestDraw();
      }
      renderer.render(scene,camera);
      // Animate only active boosters or the black hole; quiet chapters stay on demand.
      if(((hole.visible&&p>.8)||boosters.group.visible)&&!reduced)requestDraw();
    }
    function requestDraw(){if(!frame&&!disposed)frame=requestAnimationFrame(draw);}
    finish.current=()=>{if(endingRef.current){endingStart=performance.now();requestDraw();}};
    const resize=()=>{renderer.setSize(window.innerWidth,window.innerHeight);camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();requestDraw();};
    const onVisible=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else requestDraw();};
    window.addEventListener('scroll',requestDraw,{passive:true});window.addEventListener('resize',resize);document.addEventListener('visibilitychange',onVisible);preference.addEventListener('change',requestDraw);resize();
    return()=>{disposed=true;finish.current=null;cancelAnimationFrame(frame);window.removeEventListener('scroll',requestDraw);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',onVisible);preference.removeEventListener('change',requestDraw);release(scene);resources.forEach(resource=>resource.dispose());renderer.dispose();renderer.domElement.remove();};
  },[]);
  return <div className="space-story" ref={host} aria-hidden="true" />;
}
