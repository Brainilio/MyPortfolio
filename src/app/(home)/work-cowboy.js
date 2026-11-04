import * as THREE from "three";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";

// Two of the Work section's scene-tester options, each a scene and camera of its own (work-scene.js swaps them in):
// C, a cowboy galloping on the spot in the middle of the frame, turned a little toward you, nothing else around him;
// E, a cowboy hat alone in the middle, turning slowly as the section scrolls. Real models from Poly Pizza (see
// public/models/CREDITS.md): Quaternius's "Horse" with its own Gallop clip, Quaternius's "Farmer" (who wears a cowboy
// hat) sat in the saddle by posing his skeleton, and J-Toastie's "Cowboy Hat".
const DEG=Math.PI/180;
function lights(scene){
  scene.add(new THREE.HemisphereLight("#ffe6c4","#5b3048",1.5));
  const key=new THREE.DirectionalLight("#ffc98a",2.6);key.position.set(-6,7,5);scene.add(key);
  const rim=new THREE.DirectionalLight("#ffd9c2",.9);rim.position.set(6,4,-6);scene.add(rim);
}
const flat=root=>root.traverse(o=>{if(!o.isMesh)return;o.frustumCulled=false;o.castShadow=o.receiveShadow=false;
  for(const m of [o.material].flat()){m.flatShading=true;m.metalness=0;m.roughness=1;m.needsUpdate=true;}});

// The rider's seat: legs astride the horse (thighs forward and out, shins hanging back down), hands low and forward
// on the reins. Rotations about each bone's own axes, applied over the Idle clip.
const SEAT={
  // (three.js drops the dots from bone names: UpperLeg.L is UpperLegL.)
  UpperLegL:[-80,0,-22],UpperLegR:[-80,0,22],LowerLegL:[75,0,0],LowerLegR:[75,0,0],
  UpperArmL:[-20,0,0],UpperArmR:[-20,0,0],LowerArmL:[-55,0,0],LowerArmR:[-55,0,0],
};

export function createCowboy({loader,onLoad}){
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,1,.3,100);lights(scene);
  // Galloping to the right, turned 30° toward you.
  const group=new THREE.Group();group.rotation.y=-30*DEG;scene.add(group);
  // A faint soft shadow under the hooves, so he isn't floating.
  const c=document.createElement("canvas");c.width=c.height=64;{const g=c.getContext("2d"),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,"rgba(60,30,40,.35)");r.addColorStop(1,"rgba(60,30,40,0)");g.fillStyle=r;g.fillRect(0,0,64,64);}
  const shadowTexture=new THREE.CanvasTexture(c),shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.4,2.6).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));shadow.position.y=.01;group.add(shadow);
  const mixers=[],seat=[],back=new THREE.Vector3(),rider=new THREE.Group(),saddle={bone:null,rest:new THREE.Vector3(),offset:new THREE.Vector3()};let horseRoot=null;
  let pending=2;const done=()=>{if(--pending===0)onLoad?.();};
  loader.load("/models/island/horse.glb",gltf=>{
    const model=gltf.scene,box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),k=2.1/size.y;
    flat(model);model.scale.setScalar(k);model.position.y=-box.min.y*k;
    // Turned so it gallops along the group's +x (the rider, modelled facing the other way, the other way round).
    horseRoot=new THREE.Group();horseRoot.rotation.y=Math.PI/2;horseRoot.add(model);group.add(horseRoot);
    const mixer=new THREE.AnimationMixer(model),clip=gltf.animations.find(a=>a.name==="Gallop")??gltf.animations[0];
    if(clip){mixer.clipAction(clip).play();mixers.push(mixer);}
    model.traverse(o=>{if(o.isBone&&o.name==="Back")saddle.bone=o;});
    group.updateMatrixWorld(true);if(saddle.bone)group.worldToLocal(saddle.bone.getWorldPosition(saddle.rest));
    done();
  },undefined,done);
  loader.load("/models/island/rider.glb",gltf=>{
    const model=gltf.scene,box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),k=1.75/size.y;
    flat(model);model.scale.setScalar(k);model.position.y=-box.min.y*k;rider.add(model);rider.rotation.y=-Math.PI/2;group.add(rider);
    const mixer=new THREE.AnimationMixer(model);if(gltf.animations[0]){mixer.clipAction(gltf.animations[0]).play();mixers.push(mixer);}
    model.traverse(o=>{if(o.isBone&&SEAT[o.name])seat.push([o,new THREE.Quaternion().setFromEuler(new THREE.Euler(...SEAT[o.name].map(v=>v*DEG))),o.quaternion.clone()]);});
    // Hips at the saddle: his standing hip height comes off his position.
    let hips=null;model.traverse(o=>{if(o.isBone&&o.name==="Hips")hips=o;});
    rider.updateMatrixWorld(true);if(hips){const p=hips.getWorldPosition(new THREE.Vector3());rider.worldToLocal(p);saddle.offset.set(0,-p.y,0);}
    done();
  },undefined,done);
  // (In the saddle, just behind the withers.)
  const seatAt=new THREE.Vector3(.6,.1,0);
  function update(dt){
    // Posed over the clip each frame (from the bind pose for any bone the clip leaves alone).
    for(const [bone,,bind] of seat)bone.quaternion.copy(bind);
    for(const m of mixers)m.update(dt);
    for(const [bone,q] of seat)bone.quaternion.multiply(q);
    // He rides the horse's back: follows the bone's rise and fall from its rest height.
    if(saddle.bone){group.updateMatrixWorld(true);group.worldToLocal(saddle.bone.getWorldPosition(back));
      rider.position.set(back.x+seatAt.x,back.y+seatAt.y+saddle.offset.y,back.z+seatAt.z);}
  }
  function frame(w,h){camera.aspect=w/h;const tall=camera.aspect<.85;camera.position.set(0,2.6,tall?15:9.5);camera.lookAt(0,1.25,0);camera.clearViewOffset();camera.updateProjectionMatrix();}
  return {scene,camera,update,frame,group,rider,seat,seatAt,SEAT,dispose(){shadowTexture.dispose();scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat())m?.dispose();});}};
}

export function createHat({loader,onLoad}){
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,1,.3,100);lights(scene);
  const hat=new THREE.Group();hat.rotation.x=14*DEG;scene.add(hat);
  loader.load("/models/island/hat.glb",gltf=>{
    const model=cloneSkinned(gltf.scene),box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),centre=box.getCenter(new THREE.Vector3()),k=2.4/Math.max(size.x,size.z);
    flat(model);model.scale.setScalar(k);model.position.copy(centre).multiplyScalar(-k);hat.add(model);onLoad?.();
  },undefined,()=>onLoad?.());
  // One slow turn over the whole section.
  function update(progress){hat.rotation.y=progress*Math.PI*2;}
  function frame(w,h){camera.aspect=w/h;const tall=camera.aspect<.85;camera.position.set(0,1.1,tall?12:8);camera.lookAt(0,0,0);camera.clearViewOffset();camera.updateProjectionMatrix();}
  return {scene,camera,update,frame,hat,dispose(){scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat())m?.dispose();});}};
}
