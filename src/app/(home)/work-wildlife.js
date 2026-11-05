import * as THREE from "three";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { createEagle } from "./island-parts";

// The Work island's other animals (none of them care about the feed basket; only the bison do):
// - three mallards (Poly by Google, CC BY 3.0) drifting round the lake in a loose group, one now and then up-ending
//   to dabble (head under, tail up, back again over 1.5 s);
// - two deer (the Home island's Quaternius deer) by the pines at the back, grazing, looking about, now and then
//   taking a step or two;
// - the bald eagle (the Home island's, Poly by Google) perched on the tallest peak or pine, now and then opening its wings
//   in a stretch and folding them away again.
const rand=Math.random;
export function createWildlife({group,height,lake,level,loader,perch,perchSize=.42,deerSpots,dry}){
  const ducks=[],deer=[],eagle={root:new THREE.Group(),wings:[],next:6+rand()*6,t:-1};
  let swim=0;
  loader.load("/models/island/duck.glb",gltf=>{
    const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3()),k=.2/size.y;
    // (x, z) in the group, relative to its middle and its heading.
    [[0,0],[-.2,-.17],[.15,-.24]].forEach(([ox,oz],i)=>{
      const model=i?gltf.scene.clone():gltf.scene;
      model.traverse(o=>{if(o.isMesh){o.material=new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true});o.frustumCulled=false;}});
      // Sitting low in the water, pivoting about the waterline.
      model.scale.setScalar(k);model.position.y=-box.min.y*k-.07;
      const tilt=new THREE.Group();tilt.add(model);const root=new THREE.Group();root.add(tilt);group.add(root);
      ducks.push({root,tilt,ox,oz,phase:rand()*6,dip:-1,next:3+rand()*6});
    });
  },undefined,()=>{});
  if(deerSpots.length)loader.load("/models/island/deer.glb",gltf=>{
    const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3()),k=.82/size.y;
    deerSpots.forEach(([x,z],i)=>{
      const model=i?cloneSkinned(gltf.scene):gltf.scene,root=new THREE.Group();
      model.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.flatShading=true;o.material.metalness=0;o.material.roughness=.95;o.frustumCulled=false;}});
      model.scale.setScalar(k);model.position.y=-box.min.y*k;root.add(model);root.position.set(x,height(x,z),z);root.rotation.y=.4+i*1.9;group.add(root);
      const mixer=new THREE.AnimationMixer(model),actions={};for(const clip of gltf.animations)actions[clip.name]=mixer.clipAction(clip);
      const d={root,mixer,actions,current:null,state:"idle",timer:1+rand()*3};play(d,"Idle",0);deer.push(d);
    });
  },undefined,()=>{});
  function play(d,name,fade=.4){if(d.current===name||!d.actions[name])return;d.actions[name].reset().fadeIn(fade).play();d.actions[d.current]?.fadeOut(fade);d.current=name;}
  // The eagle, with a pair of the soaring eagle's wings folded away at its shoulders for the stretch.
  loader.load("/models/island/eagle.glb",gltf=>{
    const model=gltf.scene,box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),k=perchSize/size.y;
    model.traverse(o=>{if(o.isMesh)o.material=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.95});});
    model.scale.setScalar(k);model.position.y=-box.min.y*k;eagle.root.add(model);
    const spare=createEagle();eagle.wings=spare.userData.wings;
    // (Stood upright, so they open broad side on, just behind the body.)
    eagle.wings.forEach(w=>{w.position.set(0,.27*perchSize/.42,-.03*perchSize/.42);w.children[0].rotation.x=-Math.PI/2;w.scale.setScalar(.001);eagle.root.add(w);});
    eagle.root.visible=false;group.add(eagle.root);
  },undefined,()=>{});
  const ahead=new THREE.Vector2();
  function update(dt,time){
    // The ducks: their group's middle drifts slowly round an oval inside the lake; each keeps its place in it with a
    // little wander of its own, and faces where the group is going.
    swim+=dt*.07;
    const cx=lake.x+Math.cos(swim)*lake.rx*.42,cz=lake.z+Math.sin(swim*1.3)*lake.rz*.38;
    ahead.set(-Math.sin(swim)*lake.rx*.42,Math.cos(swim*1.3)*1.3*lake.rz*.38).normalize();
    const heading=Math.atan2(ahead.x,ahead.y);
    for(const d of ducks){
      const ox=d.ox+Math.sin(time*.4+d.phase)*.05,oz=d.oz+Math.cos(time*.33+d.phase)*.05;
      d.root.position.set(cx+ox*Math.cos(heading)+oz*Math.sin(heading),level+.012*Math.sin(time*1.6+d.phase),cz-ox*Math.sin(heading)+oz*Math.cos(heading));
      d.root.rotation.y=heading+.25*Math.sin(time*.5+d.phase);
      if(d.dip<0){d.next-=dt;if(d.next<=0)d.dip=0;}else{d.dip+=dt;if(d.dip>1.5){d.dip=-1;d.next=4+rand()*7;}}
      d.tilt.rotation.x=d.dip<0?0:1.2*Math.sin(Math.PI*d.dip/1.5);
    }
    // The deer: mostly grazing or standing with a look about (their clips), sometimes a step or two forward.
    for(const d of deer){
      d.mixer.update(dt);d.timer-=dt;
      // (Only onto dry ground, short of the water and the mountains' foot; otherwise it stops there.)
      if(d.state==="step"){const yaw=d.root.rotation.y,x=d.root.position.x+Math.sin(yaw)*.22*dt,z=d.root.position.z+Math.cos(yaw)*.22*dt;
        if(dry(x,z)){d.root.position.set(x,height(x,z),z);}else d.timer=0;}
      if(d.timer>0)continue;
      const r=rand();
      if(d.state!=="step"&&r<.25){d.state="step";d.timer=.9+rand()*.8;d.root.rotation.y+=(rand()-.5)*1.6;play(d,"Walk",.3);}
      else{const eat=rand()<.55;d.state=eat?"eat":"idle";d.timer=3+rand()*4;play(d,eat?"Eating":"Idle",.5);}
    }
    // The eagle: on the peak once it's known; every 8–14 s a stretch: wings out and up, a slow beat, folded away.
    if(perch()&&!eagle.root.visible&&eagle.wings.length){eagle.root.position.copy(perch());eagle.root.visible=true;}
    if(eagle.t<0){eagle.next-=dt;if(eagle.next<=0)eagle.t=0;}
    else{eagle.t+=dt;if(eagle.t>2.2){eagle.t=-1;eagle.next=8+rand()*6;}}
    const s=eagle.t<0?0:Math.sin(Math.PI*Math.min(1,eagle.t/2.2)),beat=eagle.t<0?0:.35*Math.sin(eagle.t*5);
    eagle.wings.forEach((w,i)=>{w.scale.setScalar(Math.max(.001,.4*s*perchSize/.42));w.rotation.z=(i?-1:1)*(.55+beat);});
  }
  return {update,eagle};
}
