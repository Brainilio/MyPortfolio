import * as THREE from "three";
import { random } from "./island-parts";

// Scene C of the Work section's scene tester: no island. Open prairie runs from the bottom third of the frame back to
// a hazy horizon of flat-topped mesas, the page's sky showing above it; a worn trail crosses the middle ground and a
// cowboy canters along it, left to right, about eight seconds across, kicking up dust, then comes round again from the
// left. All from primitives, in its own scene with its own camera (work-scene.js swaps them in while it's shown).
const HORSE="#3d2b1f",RIDER="#4a3728",HAT="#8b6914",DIRT=new THREE.Color("#c4a060");
const CROSS=8,FROM=-11,TO=11,CYCLE=.62;

function box(w,h,d,color,taper=1){
  const g=new THREE.BoxGeometry(w,h,d,2,1,1);
  // Tapered ends: the faces at either end of its length pulled in.
  if(taper!==1){const p=g.attributes.position;for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i))>w*.49)p.setXYZ(i,p.getX(i),p.getY(i)*taper,p.getZ(i)*taper);}
  return new THREE.Mesh(g,new THREE.MeshLambertMaterial({color,flatShading:true}));
}
const limb=(r1,r2,len,color)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,len,5).translate(0,-len/2,0),new THREE.MeshLambertMaterial({color,flatShading:true}));return m;};

// A horse and rider facing +x, hooves at y = 0. Legs are two-joint chains (shoulder/hip, then knee/hock).
function createRider(){
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);
  const barrel=box(1.5,.56,.46,HORSE,.72);barrel.position.y=1.2;body.add(barrel);
  const neck=new THREE.Group();neck.position.set(.62,1.32,0);body.add(neck);
  const neckMesh=box(.3,.78,.26,HORSE,1);neckMesh.position.set(.12,.3,0);neckMesh.rotation.z=-.62;neck.add(neckMesh);
  const mane=box(.08,.7,.1,"#241810",1);mane.position.set(.0,.36,0);mane.rotation.z=-.62;neck.add(mane);
  const head=box(.6,.24,.22,HORSE,.75);head.position.set(.5,.62,0);head.rotation.z=-.75;neck.add(head);
  [-.06,.06].forEach(z=>{const ear=new THREE.Mesh(new THREE.ConeGeometry(.04,.13,4),new THREE.MeshLambertMaterial({color:HORSE,flatShading:true}));ear.position.set(.32,.86,z);ear.rotation.z=-.3;neck.add(ear);});
  // Tail: two tapering segments with a slight curve.
  const tail=new THREE.Group();tail.position.set(-.74,1.36,0);body.add(tail);
  const tail1=limb(.07,.05,.45,"#241810");tail1.rotation.z=-.7;tail.add(tail1);
  const tail2=new THREE.Group();tail2.position.set(-.29,-.34,0);tail.add(tail2);const tail2m=limb(.05,.015,.45,"#241810");tail2m.rotation.z=-.25;tail2.add(tail2m);
  const legs=[];
  // (front?, x, z)
  [[true,.55,.13],[true,.55,-.13],[false,-.55,.13],[false,-.55,-.13]].forEach(([front,x,z])=>{
    const upper=new THREE.Group();upper.position.set(x,1.12,z);body.add(upper);
    upper.add(limb(.08,.06,.55,HORSE));
    const lower=new THREE.Group();lower.position.y=-.55;upper.add(lower);
    lower.add(limb(.05,.045,.5,HORSE));
    const hoof=box(.12,.08,.1,"#1d140e",1);hoof.position.set(.02,-.52,0);lower.add(hoof);
    legs.push({front,upper,lower,hoof,down:false});
  });
  // The rider, sitting upright, hat on, arms a little out.
  const rider=new THREE.Group();rider.position.set(.05,1.48,0);body.add(rider);
  const torso=box(.28,.55,.36,RIDER,1);torso.position.y=.32;rider.add(torso);
  [-.15,.15].forEach(z=>{const thigh=box(.36,.14,.13,RIDER,1);thigh.position.set(.12,0,z*1.45);rider.add(thigh);const shin=box(.12,.42,.12,RIDER,1);shin.position.set(.26,-.24,z*1.6);rider.add(shin);});
  const arms=[-1,1].map(s=>{const arm=new THREE.Group();arm.position.set(0,.55,s*.2);rider.add(arm);const a=box(.1,.42,.1,RIDER,1);a.position.y=-.2;arm.add(a);arm.rotation.set(s*-.35,0,.55);return arm;});
  const face=new THREE.Mesh(new THREE.IcosahedronGeometry(.12,0),new THREE.MeshLambertMaterial({color:"#c99a72",flatShading:true}));face.position.y=.72;rider.add(face);
  const hat=new THREE.Group();hat.position.y=.82;rider.add(hat);
  const brim=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.03,10),new THREE.MeshLambertMaterial({color:HAT,flatShading:true}));hat.add(brim);
  const crown=new THREE.Mesh(new THREE.ConeGeometry(.14,.2,6),new THREE.MeshLambertMaterial({color:HAT,flatShading:true}));crown.position.y=.11;hat.add(crown);
  root.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=false;});
  return {root,body,neck,tail,tail2,legs,rider,arms};
}

export function createCowboy(){
  const rng=random(31),scene=new THREE.Scene();scene.fog=new THREE.Fog("#f3c49a",24,90);
  const camera=new THREE.PerspectiveCamera(30,1,.3,300);
  scene.add(new THREE.HemisphereLight("#ffe6c4","#6b4a3a",1.5));
  const sun=new THREE.DirectionalLight("#ffc98a",2.6);sun.position.set(-10,6,4);scene.add(sun);

  // The prairie: one big plane, its facets nudged up and down and each tinted ±10% around the base dirt colour.
  {const g=new THREE.PlaneGeometry(260,140,70,36).rotateX(-Math.PI/2).toNonIndexed(),p=g.attributes.position,colors=new Float32Array(p.count*3),c=new THREE.Color();
    for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+Math.sin(p.getX(i)*.37+p.getZ(i)*.21)*.12+Math.sin(p.getX(i)*1.3-p.getZ(i)*.9)*.05);
    for(let i=0;i<p.count;i+=3){c.copy(DIRT).multiplyScalar(.9+rng()*.2);for(let k=0;k<3;k++)colors.set([c.r,c.g,c.b],(i+k)*3);}
    g.setAttribute("color",new THREE.BufferAttribute(colors,3));g.computeVertexNormals();
    const ground=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true}));ground.position.z=-55;scene.add(ground);}
  const trailZ=x=>.35*Math.sin(x*.18+.6);
  // The trail: a worn, paler strip winding left to right across the middle ground.
  {const pts=[],uv=[],idx=[];for(let i=0;i<=60;i++){const x=-30+i,z=trailZ(x),w=.55+.12*Math.sin(i*1.7);pts.push(x,.02,z-w,x,.02,z+w);if(i)idx.push(i*2-2,i*2-1,i*2,i*2-1,i*2+1,i*2);uv.push(0,0,0,0);}
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pts,3));g.setIndex(idx);g.computeVertexNormals();
    const trail=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:"#d9bd85",flatShading:true,polygonOffset:true,polygonOffsetFactor:-2}));scene.add(trail);
    // Two darker wheel ruts along it.
    [-.22,.22].forEach(o=>{const r=[],ri=[];for(let i=0;i<=60;i++){const x=-30+i,z=trailZ(x)+o;r.push(x,.03,z-.05,x,.03,z+.05);if(i)ri.push(i*2-2,i*2-1,i*2,i*2-1,i*2+1,i*2);}
      const rg=new THREE.BufferGeometry();rg.setAttribute("position",new THREE.Float32BufferAttribute(r,3));rg.setIndex(ri);rg.computeVertexNormals();
      scene.add(new THREE.Mesh(rg,new THREE.MeshLambertMaterial({color:"#b89466",polygonOffset:true,polygonOffsetFactor:-3})));});}
  // Sparse sage: low dark lumps scattered over the plain, never on the trail.
  {const n=70,shrubs=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshLambertMaterial({flatShading:true}),n),d=new THREE.Object3D(),sage=new THREE.Color("#66734f");let k=0;
    for(let tries=0;k<n&&tries<600;tries++){const x=-34+rng()*68,z=6-rng()*46;if(Math.abs(z-trailZ(x))<1.3)continue;const s=.18+rng()*.26;
      d.position.set(x,s*.3,z);d.rotation.set(0,rng()*6,0);d.scale.set(s*(1+rng()*.5),s*.65,s*(1+rng()*.4));d.updateMatrix();shrubs.setMatrixAt(k,d.matrix);shrubs.setColorAt(k,sage.clone().multiplyScalar(.85+rng()*.3));k++;}
    shrubs.count=k;scene.add(shrubs);}
  // The horizon: distant flat-topped mesas, just silhouettes in a hazy, desaturated red-brown.
  {const haze=new THREE.MeshBasicMaterial({color:new THREE.Color("#9b6b4a").lerp(new THREE.Color("#f0c4a0"),.45),fog:false});
    [[-70,3,26,9],[-38,1.8,14,8],[-12,3.6,30,4],[24,2.2,18,6],[52,4,34,10],[88,2,20,7]].forEach(([x,h,w,d])=>{
      const g=new THREE.CylinderGeometry(w*.42,w*.5,h,7,1).translate(0,h/2,0);g.scale(1,1,d/w);const m=new THREE.Mesh(g,haze);m.position.set(x,-.4,-118);scene.add(m);});}

  const horse=createRider();scene.add(horse.root);
  // Dust: small beige puffs left behind each hoof as it lands, swelling and fading into the ground colour.
  const DUST=24,dustMesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshLambertMaterial({flatShading:true,transparent:true,opacity:.7,depthWrite:false}),DUST);
  dustMesh.frustumCulled=false;scene.add(dustMesh);
  const dust=Array.from({length:DUST},()=>({age:1,life:1,pos:new THREE.Vector3(),vel:new THREE.Vector3(),size:.1})),puff=new THREE.Object3D(),beige=new THREE.Color("#e3cfa4"),tint=new THREE.Color(),at=new THREE.Vector3();
  let next=0;
  function kick(x,y,z){for(let n=0;n<2;n++){const d=dust[next];next=(next+1)%DUST;d.age=0;d.life=.8+rng()*.5;d.size=.07+rng()*.06;d.pos.set(x-.1,y+.05,z+(rng()-.5)*.15);d.vel.set(-.6-rng()*.6,.3+rng()*.35,(rng()-.5)*.4);}}

  let t=0,phase=0;
  function update(dt){
    t+=dt;phase+=dt/CYCLE*Math.PI*2;
    const u=(t%CROSS)/CROSS,x=FROM+(TO-FROM)*u;
    horse.root.position.set(x,0,trailZ(x));horse.root.rotation.y=-Math.atan(.35*.18*Math.cos(x*.18+.6));
    // The legs: the diagonal pairs (near fore with off hind, off fore with near hind) swing in turn; each knee folds
    // as its leg comes forward.
    horse.legs.forEach((leg,i)=>{const p=phase+(i===0||i===3?0:Math.PI),swing=Math.sin(p),forward=Math.max(0,Math.cos(p));
      leg.upper.rotation.z=(leg.front?.5:.42)*swing+(leg.front?.05:-.08);
      leg.lower.rotation.z=leg.front?-1.1*forward:.75*forward;
      // A hoof landing (the leg just past its furthest reach forward): dust.
      const down=Math.cos(p)<0;if(down&&!leg.down){leg.hoof.getWorldPosition(at);kick(at.x,0,at.z);}leg.down=down;});
    // Body and rider bob twice a stride (once per diagonal pair), the head nods, the tail swings.
    const bob=Math.abs(Math.sin(phase));horse.body.position.y=.08*bob;horse.body.rotation.z=.04*Math.sin(phase*2);
    horse.neck.rotation.z=.12*Math.sin(phase*2+.6);horse.rider.position.y=1.48+.05*Math.abs(Math.sin(phase+.5));
    horse.tail.rotation.z=.15*Math.sin(phase*2+1);horse.tail2.rotation.z=.25*Math.sin(phase*2+.2);
    horse.arms.forEach((arm,k)=>{arm.rotation.z=.55+.12*Math.sin(phase*2+k);});
    dust.forEach((d,i)=>{let s=0;if(d.age<d.life){d.age+=dt;d.pos.addScaledVector(d.vel,dt);d.vel.multiplyScalar(Math.exp(-dt*2));const k=d.age/d.life;s=d.size*(1+k*2.5)*(1-k*k);}
      puff.position.copy(d.pos);puff.scale.setScalar(Math.max(0,s));puff.updateMatrix();dustMesh.setMatrixAt(i,puff.matrix);
      dustMesh.setColorAt(i,tint.copy(beige).lerp(DIRT,Math.min(1,d.age/d.life)));});
    dustMesh.instanceMatrix.needsUpdate=true;if(dustMesh.instanceColor)dustMesh.instanceColor.needsUpdate=true;
  }
  // Static, a little above the ground, looking slightly down at the trail; the frame is shifted so the ground fills
  // the bottom third and the sky the rest.
  function frame(w,h){
    camera.aspect=w/h;const tall=camera.aspect<.85;
    camera.position.set(0,2.1,tall?24:15);camera.lookAt(0,1.3,0);
    camera.setViewOffset(w,h,0,-h*.27,w,h);camera.updateProjectionMatrix();
  }
  update(0);
  return {scene,camera,update,frame,dispose(){scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat())m?.dispose();});}};
}
