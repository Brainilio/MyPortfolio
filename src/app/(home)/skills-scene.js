"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { random, createIsland, createPineGeometry, createSwayingInstances, createFoliageMaterial, flatMaterial, createSpin } from "./island-parts";
import { paintGeometry } from "./forest-parts";
import { createSign, createTetons } from "./park-parts";
import { loadWagon } from "./wagon";

// Skills as the road trip in miniature, the island's daytime cousin: a floating patch of national park with a road
// winding in from the island's edge, a park sign at every stop, a hot spring, pines, the geyser by the last stop and a
// little Teton range at the back. Scrolling (or clicking the wagon) drives it to the next sign; the island stays put
// and centred while the camera swings a few degrees round it to follow the wagon. No real-time shadows; it renders at full rate while driving and 30 fps when idle, only
// while the section is on screen. The full-size road trip lives in the Lab.
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
const outline=a=>6*(1+.07*Math.sin(3*a+2)+.05*Math.sin(5*a+.6)+.03*Math.sin(9*a));
// The road comes in right at the island's rim (its first point sits on the outline), winds past every sign, swings by
// the geyser and runs on out over the far rim: the trip goes on. The wagon's last stop is just before the geyser.
const rim=a=>[Math.cos(a)*outline(a),0,Math.sin(a)*outline(a)];
const ENTRY=Math.atan2(2.6,-4.9),EXIT=Math.atan2(3.4,3.2);
const DRIVEN=[rim(ENTRY),[-2.9,0,3.7],[-.6,0,3.1],[.3,0,1.3],[-.7,0,-.5],[.5,0,-2.3],[2.6,0,-2.5],[4.1,0,-1.1]];
const ROAD=new THREE.CatmullRomCurve3([...DRIVEN,[3.35,0,.45],[3.45,0,2.1],rim(EXIT)].map(p=>new THREE.Vector3(...p)),false,"centripetal");
// The stops, as fractions of the whole road (they were laid out along the part up to the geyser).
const STATIONS=(()=>{const driven=new THREE.CatmullRomCurve3(DRIVEN.map(p=>new THREE.Vector3(...p)),false,"centripetal").getLength()/ROAD.getLength();return [.05,.27,.49,.71,.92].map(u=>u*driven);})();
const roadPoints=ROAD.getSpacedPoints(180);
const roadDistance=(x,z)=>{let best=1e9;for(const p of roadPoints)best=Math.min(best,(p.x-x)**2+(p.z-z)**2);return Math.sqrt(best);};
const RANGE=new THREE.Vector2(-2.6,-3),POOL=new THREE.Vector2(-2.6,.9),GEYSER=new THREE.Vector2(4.6,.3);
function heightAt(x,z) {
  const edge=Math.hypot(x,z)/outline(Math.atan2(z,x));
  let h=.12*Math.sin(x*.8+1.1)*Math.cos(z*.7-.3)+.05*Math.sin(x*2.1+z*1.6);
  // Flat where the road runs, a rise under the range, a shallow bowl for the spring.
  const road=roadDistance(x,z);h*=smooth((road-.5)/1.2);
  h+=.3*smooth(1-Math.hypot(x-RANGE.x,z-RANGE.y)/3)-.12*smooth(1-Math.hypot(x-POOL.x,z-POOL.y)/1.3);
  return h-.2*smooth((edge-.74)/.26);
}
// No river on this one: the "river" the island builder asks for is the road, so its banks don't turn to sand.
const noRiver=()=>({d:99,t:0});

export default function SkillsScene({ state, skills, onCar, slot = 3, side = "right", onReady }) {
  const ready=useRef(onReady);ready.current=onReady;
  const host=useRef(null),carClick=useRef(onCar);carClick.current=onCar;
  useEffect(()=>{
    const mount=host.current;
    let renderer,disposed=false,raf=0,visible=true;
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"}); } catch { ready.current?.(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    mount.appendChild(renderer.domElement);
    const canvas=renderer.domElement,preference=matchMedia("(prefers-reduced-motion: reduce)");
    const scene=new THREE.Scene();scene.fog=new THREE.Fog("#f2d3b2",40,80);
    const camera=new THREE.PerspectiveCamera(30,1,.3,200);
    const rng=random(31);

    // Warm late morning: a high sun from the right, a soft peach sky light.
    scene.add(new THREE.HemisphereLight("#fff1dc","#7b6a52",1.5));
    const sun=new THREE.DirectionalLight("#fff0d6",2.6);sun.position.set(9,14,6);scene.add(sun);

    const world=new THREE.Group();scene.add(world);
    const island=createIsland(9,{outline,heightAt,riverDistance:noRiver,depth:.7});world.add(island.group);
    const on=(x,z,lift=0)=>new THREE.Vector3(x,heightAt(x,z)+lift,z);
    const shared={uTime:{value:0},uBreeze:{value:.03},uGust:{value:.05}};

    // The road: a dark ribbon with cream edge lines and white centre dashes, painted once on a canvas. Each cross-section
    // has five points, every one set on the ground (plus a hair) so it hugs the terrain without floating or flickering.
    {const c=document.createElement("canvas");c.width=64;c.height=256;const g=c.getContext("2d");
      g.fillStyle="#57505e";g.fillRect(0,0,64,256);g.fillStyle="#efe2bf";g.fillRect(4,0,3,256);g.fillRect(57,0,3,256);g.fillStyle="#f8f5ee";g.fillRect(30,0,4,140);
      const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;
      const positions=[],uvs=[],index=[],side=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),ACROSS=[-1,-.5,0,.5,1],W=ACROSS.length,HALF=.42;let length=0;
      roadPoints.forEach((p,i)=>{if(i)length+=p.distanceTo(roadPoints[i-1]);ROAD.getTangentAt(Math.min(.999,i/(roadPoints.length-1)),side);side.cross(up).normalize();
        // Kept inside the rim, so where the road meets the edge it stops flush with it instead of hanging over.
        for(const k of ACROSS){let x=p.x+side.x*HALF*k,z=p.z+side.z*HALF*k;const r=Math.hypot(x,z),edge=outline(Math.atan2(z,x))*.99;if(r>edge){x*=edge/r;z*=edge/r;}positions.push(x,heightAt(x,z)+.02,z);uvs.push((k+1)/2,length/1.4);}
        if(i)for(let j=0;j<W-1;j++){const a=(i-1)*W+j,b=a+1,c2=i*W+j,d=c2+1;index.push(a,b,c2,b,d,c2);}});
      const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(index);geometry.computeVertexNormals();
      const asphalt=new THREE.MeshStandardMaterial({map:texture,roughness:.95,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
      world.add(new THREE.Mesh(geometry,asphalt));}

    // The Tetons at the back, a hot spring in rings of colour, and the geyser's sinter cone where the road ends.
    const tetons=createTetons(rng);tetons.position.copy(on(RANGE.x,RANGE.y,-.2));tetons.rotation.y=.42;tetons.scale.setScalar(.95);world.add(tetons);
    {const c=document.createElement("canvas");c.width=c.height=128;const g=c.getContext("2d"),grad=g.createRadialGradient(64,64,0,64,64,64);
      [[0,"#1f6f9a"],[.35,"#3fa7c4"],[.55,"#8fd1b0"],[.7,"#f2d36a"],[.84,"#e9883e"],[.96,"#c4572e"],[1,"rgba(196,87,46,0)"]].forEach(([k,col])=>grad.addColorStop(k,col));g.fillStyle=grad;g.fillRect(0,0,128,128);
      const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
      const pool=new THREE.Mesh(new THREE.CircleGeometry(1.1,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));pool.position.copy(on(POOL.x,POOL.y,.04));pool.scale.set(1,1,.8);world.add(pool);}
    const geyserAt=on(GEYSER.x,GEYSER.y);
    const cone=new THREE.Mesh(paintGeometry(new THREE.CylinderGeometry(.2,.62,.32,10,1,true).translate(0,.16,0),"#ddd5c3"),new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1,side:THREE.DoubleSide}));
    cone.position.copy(geyserAt);world.add(cone);
    const vent=new THREE.Mesh(new THREE.CircleGeometry(.2,10).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:"#3f6f86"}));vent.position.y=.31;cone.add(vent);
    // Steam off the spring and the vent; during an eruption (uPower 0→1→0) the spray column shoots up and rains back.
    const particles={uTime:{value:0},uPower:{value:0},uScale:{value:600}};
    const spriteFragment=`varying float vAlpha;uniform vec3 uColor;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(uColor,vAlpha*smoothstep(1.,.2,d));}`;
    {const pos=[],seed=[],params=[],emit=(p,r,count,height,size,boost)=>{for(let i=0;i<count;i++){const a=rng()*6.28,d=Math.sqrt(rng())*r;pos.push(p.x+Math.cos(a)*d,p.y+.1,p.z+Math.sin(a)*d);seed.push(rng(),rng(),rng());params.push(height,size,boost);}};
      emit(on(POOL.x,POOL.y),.8,16,1.6,.5,0);emit(geyserAt.clone().setY(geyserAt.y+.3),.12,22,.9,.3,1);
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("aSeed",new THREE.Float32BufferAttribute(seed,3));g.setAttribute("aParams",new THREE.Float32BufferAttribute(params,3));
      const steam=new THREE.Points(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{...particles,uColor:{value:new THREE.Color("#ffffff")}},
        vertexShader:`attribute vec3 aSeed,aParams;uniform float uTime,uPower,uScale;varying float vAlpha;void main(){
          float boost=1.+aParams.z*uPower*3.,t=fract(uTime*(.12+aSeed.x*.08)+aSeed.z);
          vec3 p=position+vec3(t*t*.9+sin(t*4.+aSeed.y*6.)*.15,t*aParams.x*boost,sin(t*3.+aSeed.x*6.)*.15);
          vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
          gl_PointSize=aParams.y*(.6+t*1.8)*(1.+aParams.z*uPower*1.5)*uScale/-mv.z;vAlpha=sin(t*3.14159)*(.3+aParams.z*uPower*.25);}`,
        fragmentShader:spriteFragment}));
      steam.frustumCulled=false;steam.renderOrder=2;world.add(steam);}
    {const count=140,pos=new Float32Array(count*3),seed=[];for(let i=0;i<count;i++){pos.set([geyserAt.x,geyserAt.y+.3,geyserAt.z],i*3);seed.push(rng(),rng(),rng());}
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));g.setAttribute("aSeed",new THREE.Float32BufferAttribute(seed,3));
      const spray=new THREE.Points(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{...particles,uColor:{value:new THREE.Color("#ffffff")}},
        vertexShader:`attribute vec3 aSeed;uniform float uTime,uPower,uScale;varying float vAlpha;void main(){
          float t=fract(uTime*(.55+aSeed.y*.25)+aSeed.z),h=5.5*uPower*(.7+.3*aSeed.y),a=aSeed.x*6.2832;
          float y=h*(1.-pow((t-.62)/.62,2.)),r=(.05+aSeed.y*.3)*t*t*(1.+h*.12);
          vec3 p=position+vec3(cos(a)*r+t*t*.5,y,sin(a)*r);
          vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
          gl_PointSize=(.12+t*.55)*uScale/-mv.z;vAlpha=uPower*(1.-t*.8)*.85;}`,
        fragmentShader:spriteFragment}));
      spray.frustumCulled=false;spray.renderOrder=3;world.add(spray);}
    const geyser={t:-1,wait:9};const erupt=()=>{if(geyser.t<0)geyser.t=0;};

    // Where the camera looks from (flat), so signs face it and sit on the far side of the road from it.
    const VIEW=new THREE.Vector3(.38,.56,.86).normalize(),viewFlat=new THREE.Vector3(VIEW.x,0,VIEW.z).normalize();
    const signs=skills.map((skill,i)=>{
      const sign=createSign(skill,i),p=ROAD.getPointAt(STATIONS[i]+.015),t=ROAD.getTangentAt(STATIONS[i]+.015),s=new THREE.Vector3(-t.z,0,t.x);
      if(s.dot(viewFlat)>0)s.negate();
      sign.scale.setScalar(.4);sign.position.copy(on(p.x+s.x*.95,p.z+s.z*.95));sign.rotation.y=Math.atan2(viewFlat.x,viewFlat.z);world.add(sign);return sign;
    });

    // Pines where nothing else is: off the road, clear of the signs, the spring and the geyser.
    const spots=[];
    for(let tries=0;spots.length<20&&tries<800;tries++){
      const a=rng()*Math.PI*2,r=Math.sqrt(rng())*outline(a)*.88,x=Math.cos(a)*r,z=Math.sin(a)*r;
      if(roadDistance(x,z)<1.1||Math.hypot(x-RANGE.x,z-RANGE.y)<2.3||Math.hypot(x-POOL.x,z-POOL.y)<1.5||Math.hypot(x-GEYSER.x,z-GEYSER.y)<1.4)continue;
      // Nothing tall between the camera and a sign, or right beside the road on the camera's side.
      const hides=sign=>{const dx=x-sign.position.x,dz=z-sign.position.z,along=dx*viewFlat.x+dz*viewFlat.z,across=Math.abs(dx*viewFlat.z-dz*viewFlat.x);return Math.hypot(dx,dz)<1.3||along>0&&along<9&&across<1.8;};
      if(signs.some(hides)||spots.some(p=>Math.hypot(p.position.x-x,p.position.z-z)<.9))continue;
      spots.push({position:on(x,z),rotation:rng()*Math.PI*2,scale:.7+rng()*.45});
    }
    const pines=createSwayingInstances(createPineGeometry(6),spots,createFoliageMaterial(shared));world.add(pines.mesh);
    {const stone=new THREE.DodecahedronGeometry(1,0),rocks=new THREE.InstancedMesh(stone,new THREE.MeshStandardMaterial({color:"#8f8a96",flatShading:true,roughness:1}),14),d=new THREE.Object3D();
      for(let i=0;i<14;i++){let x,z;do{const a=rng()*Math.PI*2,r=Math.sqrt(rng())*outline(a)*.85;x=Math.cos(a)*r;z=Math.sin(a)*r;}while(roadDistance(x,z)<.8);
        const s=.1+rng()*.16;d.position.copy(on(x,z,s*.2));d.rotation.set(rng(),rng()*6,rng());d.scale.set(s,s*.7,s);d.updateMatrix();rocks.setMatrixAt(i,d.matrix);}
      world.add(rocks);}
    // Low shrubs fill the open ground (short enough never to hide a sign).
    {const tints=["#7f9a58","#6f8c4e","#8aa35f","#9aa968"].map(c=>new THREE.Color(c)),count=40,shrubs=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0).scale(1,.6,1),new THREE.MeshStandardMaterial({flatShading:true,roughness:1}),count),d=new THREE.Object3D();let n=0;
      for(let tries=0;n<count&&tries<500;tries++){const a=rng()*Math.PI*2,r=Math.sqrt(rng())*outline(a)*.9,x=Math.cos(a)*r,z=Math.sin(a)*r;
        if(roadDistance(x,z)<.7||Math.hypot(x-POOL.x,z-POOL.y)<1.3||Math.hypot(x-GEYSER.x,z-GEYSER.y)<.9||Math.hypot(x-RANGE.x,z-RANGE.y)<2)continue;
        const s=.12+rng()*.14;d.position.copy(on(x,z,s*.2));d.rotation.y=rng()*6;d.scale.setScalar(s);d.updateMatrix();shrubs.setMatrixAt(n,d.matrix);shrubs.setColorAt(n,tints[n%4]);n++;}
      shrubs.count=n;world.add(shrubs);}

    // A moose grazing by the hot spring (Poly Pizza, see public/models/CREDITS.md).
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    loader.load("/models/island/moose.glb",gltf=>{if(disposed)return;const model=gltf.scene,box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
      const k=.75/size.y;model.scale.setScalar(k);model.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.flatShading=true;o.material.metalness=0;}});
      model.position.copy(on(POOL.x+1.5,POOL.y-.7));model.position.y-=box.min.y*k;model.rotation.y=-2.2;world.add(model);needsRender=true;},undefined,()=>{});
    // The wagon, with a blob shadow that rides along under it.
    const car=new THREE.Group(),body=new THREE.Group();car.add(body);world.add(car);let carReady=false;
    const wheelSpin=loadWagon(loader,{length:.95},holder=>{if(disposed)return;body.add(holder);carReady=true;needsRender=true;});
    const shadowCanvas=document.createElement("canvas");shadowCanvas.width=shadowCanvas.height=64;
    const s2=shadowCanvas.getContext("2d"),sg=s2.createRadialGradient(32,32,0,32,32,32);sg.addColorStop(0,"rgba(60,40,30,.45)");sg.addColorStop(1,"rgba(60,40,30,0)");s2.fillStyle=sg;s2.fillRect(0,0,64,64);
    const shadowTexture=new THREE.CanvasTexture(shadowCanvas),blob=new THREE.Mesh(new THREE.PlaneGeometry(.8,1.3).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));world.add(blob);

    // Drag to spin the diorama; tapping the wagon hops it and drives on, tapping the geyser sets it off.
    const raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2();let overCar=false,overGeyser=false;
    function aimAt(event){const r=canvas.getBoundingClientRect();ndc.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(ndc,camera);
      overCar=carReady&&raycaster.intersectObject(car,true).length>0;overGeyser=!overCar&&raycaster.intersectObject(cone,false).length>0;return overCar||overGeyser;}
    const spin=createSpin(canvas,{rest:0,over:aimAt,onTap:event=>{aimAt(event);if(overGeyser){erupt();needsRender=true;return;}if(!overCar)return;hop=0;carClick.current?.();}});

    // Framing: the whole diorama to one side (the words scroll past on the other), further off when tall.
    let tall=false,orbit=0;const target=new THREE.Vector3(0,.2,0),aim=new THREE.Vector3(),Y=new THREE.Vector3(0,1,0),BASE=Math.atan2(VIEW.x,VIEW.z),SWING=THREE.MathUtils.degToRad(9);
    function frame(){
      const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;tall=camera.aspect<.85;
      if(tall)camera.setViewOffset(w,h,0,h*.14,w,h);else camera.setViewOffset(w,h,(side==="left"?.17:-.17)*w,h*.03,w,h);
      camera.updateProjectionMatrix();particles.uScale.value=h*renderer.getPixelRatio()/(2*Math.tan(camera.fov*Math.PI/360));needsRender=true;
    }
    const resize=new ResizeObserver(frame);resize.observe(mount);
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});observer.observe(mount);

    // Driving: the wagon glides (critically damped) to where the scroll says; at the last stop it swings round to
    // face the geyser, which goes off as it pulls up.
    let facing=0,u=STATIONS[0],uVel=0,hop=-1,turn=0,time=0,since=0,needsRender=true,snap=true,wasLive=false,arrived=false;
    const point=new THREE.Vector3(),tangent=new THREE.Vector3();
    function tick(dt){
      const reduced=preference.matches,step=reduced?0:dt;time+=step;
      const q=state.current.progress[slot]*(STATIONS.length-1),k=Math.min(STATIONS.length-2,Math.floor(q)),goal=STATIONS[k]+(STATIONS[k+1]-STATIONS[k])*(q-k);
      const jump=snap;
      if(snap||reduced){snap=false;u=goal;uVel=0;}
      else{const w=2/.8,x=w*dt,decay=1/(1+x+.48*x*x+.235*x*x*x),change=u-goal,temp=(uVel+w*change)*dt;uVel=(uVel-w*temp)*decay;u=goal+(change+temp)*decay;}
      ROAD.getPointAt(THREE.MathUtils.clamp(u,0,1),point);ROAD.getTangentAt(THREE.MathUtils.clamp(u,0,.999),tangent);
      car.position.copy(on(point.x,point.z,.03));car.lookAt(car.position.clone().add(tangent));
      const end=goal>=STATIONS.at(-1)-1e-4&&Math.abs(u-STATIONS.at(-1))<.03;
      turn+=((end&&!reduced?1:0)-turn)*(1-Math.exp(-step*3));
      {let face=Math.atan2(GEYSER.x-point.x,GEYSER.y-point.z)-Math.atan2(tangent.x,tangent.z);face=Math.atan2(Math.sin(face),Math.cos(face));body.rotation.y=turn*face;facing=face;}
      body.position.y=reduced?0:Math.sin(time*38)*.003;
      if(hop>=0){hop+=dt;const h=hop/.6;if(h>=1){hop=-1;body.scale.set(1,1,1);}else{body.position.y+=Math.sin(h*Math.PI)*.35;const sq=h<.12?1-h*2:h>.88?1-(1-h)*2:1+Math.sin(h*Math.PI)*.08;body.scale.set(1/Math.sqrt(sq),sq,1/Math.sqrt(sq));}}
      wheelSpin.value-=uVel*step*ROAD.getLength()/.12;
      blob.position.set(car.position.x,car.position.y+.01,car.position.z);blob.rotation.y=Math.atan2(tangent.x,tangent.z)+turn*facing;
      // Geyser: as the wagon closes on the last sign, when clicked, and now and then on its own.
      const approaching=q>STATIONS.length-1.6&&!reduced;if(approaching&&!arrived)geyser.wait=Math.min(geyser.wait,.3);arrived=approaching;
      if(geyser.t<0){geyser.wait-=step;if(geyser.wait<=0)erupt();}else{geyser.t+=step;if(geyser.t>6){geyser.t=-1;geyser.wait=18+rng()*10;}}
      particles.uTime.value=time;particles.uPower.value=geyser.t<0?0:smooth(geyser.t/.8)*(1-smooth((geyser.t-3.8)/2.2));
      shared.uTime.value=time;shared.uBreeze.value=reduced?0:.03;pines.update();
      // The island stays centred. The camera orbits it at a fixed distance, swinging a little toward the side the wagon is
      // on (at most 9° either way, 18° in all), eased so it settles in about the time the wagon takes to pull up.
      world.position.y=Math.sin(time*.45)*.1;world.rotation.y=spin.update(dt);world.updateMatrixWorld();
      car.getWorldPosition(aim);let lean=Math.atan2(aim.x,aim.z)-BASE;lean=Math.atan2(Math.sin(lean),Math.cos(lean));
      const goalYaw=reduced?0:THREE.MathUtils.clamp(lean*.3,-SWING,SWING);orbit+=(goalYaw-orbit)*(jump?1:1-Math.exp(-dt*5));
      camera.position.copy(VIEW).applyAxisAngle(Y,orbit).multiplyScalar(tall?33:27.5).add(target);camera.lookAt(target);
      renderer.render(scene,camera);needsRender=false;
      return spin.busy||Math.abs(uVel)>1e-4||hop>=0||geyser.t>=0||Math.abs(turn-(end?1:0))>.01;
    }
    // Full rate while something is moving, 30 fps when it's just the breeze.
    let busy=true;const clock=new THREE.Clock();
    function draw(){
      raf=requestAnimationFrame(draw);
      const dt=Math.min(clock.getDelta(),.05);since+=dt;
      const live=visible&&!document.hidden&&state.current.live.includes(slot);if(live&&!wasLive)snap=true;wasLive=live;
      if(!live)return;
      if(preference.matches&&!needsRender&&!snap&&!spin.busy)return;
      if(!busy&&since<1/30-.002)return;
      busy=tick(Math.min(since,.1));since=0;
    }
    frame();tick(0);mount.dataset.ready="true";draw();
    const readyTimer=setTimeout(()=>ready.current?.(),0);
    if(new URLSearchParams(window.location.search).has("debug"))window.__skills={camera,car,world,scene,renderer,THREE};

    return()=>{
      clearTimeout(readyTimer);delete window.__skills;disposed=true;cancelAnimationFrame(raf);resize.disconnect();observer.disconnect();
      spin.dispose();
      scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat())if(m){m.map?.dispose();m.dispose();}});
      signs.forEach(sign=>sign.userData.texture.dispose());shadowTexture.dispose();renderer.dispose();canvas.remove();
    };
  },[state,skills,slot]);
  return <div className="ht-canvas" ref={host} aria-hidden="true" />;
}
