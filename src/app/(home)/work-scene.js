"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getStage } from "./stage";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { random, createIsland, createSpin, tilted, createSwayingInstances, createFoliageMaterial, createBird, createCloud } from "./island-parts";
import { paintGeometry } from "./forest-parts";
import { createBasket } from "./park-parts";
import { createBisonRig } from "./bison-rig";

// Work as the prairie in miniature, the island's golden-hour cousin: rolling prairie climbing to a mesa shelf at the
// back, where flat-topped sandstone buttes stand (Monument Valley), rounded boulders at their feet, a small bison herd
// with a calf, prairie dogs on their mounds, and a feed basket: click it and the herd comes running. The project cards
// are a deck of postcards beside it (in the page). No real-time shadows; full rate while feed
// falls or the basket is hovered, 30 fps otherwise, only while the section is on screen. The full-size prairie lives
// in the Lab.
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
const outline=a=>5.4*(1+.06*Math.sin(2*a+.9)+.05*Math.sin(5*a+1.7)+.03*Math.sin(9*a));
// Rolling prairie: the back third steps up onto a mesa shelf where the buttes stand, a few low swells roll across the
// middle and front, and a shallow dry wash winds through the foreground.
function heightAt(x,z) {
  const edge=Math.hypot(x,z)/outline(Math.atan2(z,x));
  let h=.55*smooth((-z-1.4)/.9)*(.9+.1*Math.sin(x*1.3));
  h+=.06*Math.sin(x*1.15+.4)*Math.cos(z*1.35-.7)+.03*Math.sin(x*2.6-z*2.1+1.3)+.015*Math.sin(x*5.1+z*4.3);
  for(const [kx,kz,r,k] of SWELLS)h+=k*smooth(1-Math.hypot(x-kx,z-kz)/r);
  const wash=z-1.7-.45*Math.sin(x*.85+.6);h-=.14*Math.exp(-wash*wash/.18);
  // The watering hole: a shallow bowl in the grass.
  h-=.24*smooth(1-Math.hypot(x-POND.x,z-POND.z)/(POND.r+.75));
  return h-.3*smooth((edge-.84)/.16);
}
const noRiver=()=>({d:99,t:0});
// Monument Valley, from real low-poly models (public/models/island/buttes.glb): Kenney's "Large Rock Formation" (CC0) as
// the West Mitten, Danni Bittman's "Desert Pillar" (CC BY 3.0) as the East Mitten, and Poly by Google's layered "Cliff"
// (CC BY 3.0) as the mesa. (x, z, node, height, turn, widen, foot radius): kept cartoon-small, like the hero island's peaks: the West
// Mitten ~38% of the island's ~10.8 diameter tall at the back left; the East Mitten ~27% at the back right, sky between
// them; the mesa ~13%, stretched wider than tall, mid-left in front. The right and the front stay open for the herd. Swells (x, z, radius, height);
// the prairie dogs' mounds and the feed basket near the front.
const BUTTES=[[-2,-2.6,"WestMitten",4.1,.3,1,1.1],[2.2,-2.6,"EastMitten",2.9,-.6,1,.95],[-3.2,.6,"Mesa",1.4,.9,1.7,1.2]];
const footOf=b=>b[6];
const SWELLS=[[-1.4,.5,1.7,.13],[1.9,.6,1.6,.11],[.1,2.9,1.4,.08]];
const MOUNDS=[[2.4,1.3],[0,2.5],[-.6,3.15]],BASKET=new THREE.Vector3(1.1,0,2);
// A small watering hole on the open right of the prairie, where the herd wanders over now and then to drink.
const POND={x:2.4,z:-.2,r:.95};
const blocked=(x,z,pad)=>BUTTES.some(b=>Math.hypot(x-b[0],z-b[1])<footOf(b)+pad)||Math.hypot(x-BASKET.x,z-BASKET.z)<pad+.3||Math.hypot(x-POND.x,z-POND.z)<POND.r+pad;

export default function WorkScene({ state, slot = 2, side = "left", onReady }) {
  const ready=useRef(onReady);ready.current=onReady;
  const host=useRef(null);
  useEffect(()=>{
    const mount=host.current;
    let disposed=false,visible=true;
    // Drawn on the page's one shared canvas (stage.js), into this stage's rectangle; the stage is the hit area.
    const shared_=getStage();if(!shared_){ready.current?.();return;}const renderer=shared_.renderer;
    const canvas=mount;canvas.style.touchAction="pan-y";
    const preference=matchMedia("(prefers-reduced-motion: reduce)");
    const scene=new THREE.Scene();scene.fog=new THREE.Fog("#eec08e",40,80);
    const camera=new THREE.PerspectiveCamera(30,1,.3,200);
    const rng=random(5);

    // Golden hour: a low warm sun from the back left, a peach sky light.
    scene.add(new THREE.HemisphereLight("#ffe6c4","#5b3048",1.35));
    const sun=new THREE.DirectionalLight("#ffc27a",3);sun.position.set(-10,7,-8);scene.add(sun);
    const fill=new THREE.DirectionalLight("#ffd9c2",.8);fill.position.set(6,5,10);scene.add(fill);

    const world=new THREE.Group();scene.add(world);
    const island=createIsland(13,{outline,heightAt,riverDistance:noRiver,depth:.85,hub:new THREE.Vector2(-1.1,-3.3),scatter:.8,grass:["#b89a52","#c4a65a","#a98d4c"],edge:"#9a7c46"});world.add(island.group);
    const on=(x,z,lift=0)=>new THREE.Vector3(x,heightAt(x,z)+lift,z);
    // The buttes: each model's faces recoloured by which way they face, in three sandstone tones: sun-bleached tops,
    // deep shadowed cliffs, and the mid-tone talus round the foot. Each sits on the lowest ground under its foot, so no
    // edge floats on the slope.
    const TOP=new THREE.Color("#d4854a"),CLIFF=new THREE.Color("#8b3a1a"),TALUS=new THREE.Color("#b5602e");
    new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load("/models/island/buttes.glb",gltf=>{
      if(disposed)return;
      gltf.scene.updateMatrixWorld(true);
      const shapes={};
      for(const name of ["WestMitten","EastMitten","Mesa"]){
        const node=gltf.scene.getObjectByName(name),parts=[];if(!node)continue;
        node.traverse(o=>{if(!o.isMesh)return;
          // The positions are quantized (small integers, Meshopt); read them as floats, unindexed, in world space.
          const src=o.geometry.attributes.position,index=o.geometry.index,count=index?index.count:src.count,out=new Float32Array(count*3),v=new THREE.Vector3();
          for(let i=0;i<count;i++){v.fromBufferAttribute(src,index?index.getX(i):i).applyMatrix4(o.matrixWorld);out.set([v.x,v.y,v.z],i*3);}
          const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(out,3));parts.push(g);});
        const geometry=parts.length>1?mergeGeometries(parts):parts[0];geometry.computeBoundingBox();
        const box=geometry.boundingBox,size=box.getSize(new THREE.Vector3()),centre=box.getCenter(new THREE.Vector3());
        geometry.translate(-centre.x,-box.min.y,-centre.z);
        const pos=geometry.attributes.position,colors=new Float32Array(pos.count*3),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3(),tone=new THREE.Color();
        for(let f=0;f<pos.count;f+=3){
          a.fromBufferAttribute(pos,f);b.fromBufferAttribute(pos,f+1);c.fromBufferAttribute(pos,f+2);
          n.subVectors(b,a).cross(c.clone().sub(a)).normalize();
          const low=Math.min(a.y,b.y,c.y)/size.y;
          tone.copy(n.y>.7?TOP:low<.16&&n.y>.15?TALUS:low<.1?TALUS:CLIFF).multiplyScalar(.93+rng()*.14);
          for(let k=0;k<3;k++)colors.set([tone.r,tone.g,tone.b],(f+k)*3);
        }
        geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));geometry.computeVertexNormals();
        shapes[name]={geometry,size};
      }
      const material=new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true});
      BUTTES.forEach(([x,z,name,height,turn,widen,foot])=>{
        const shape=shapes[name];if(!shape)return;
        const butte=new THREE.Mesh(shape.geometry,material),k=height/shape.size.y;
        // Scaled to its height; the mesa also stretched sideways so it reads wider than tall.
        butte.scale.set(k*widen,k,k*widen);butte.castShadow=butte.receiveShadow=false;
        let low=heightAt(x,z);
        for(let k=0;k<12;k++){const a=k/12*Math.PI*2;low=Math.min(low,heightAt(x+Math.cos(a)*foot*.8,z+Math.sin(a)*foot*.8));}
        butte.position.set(x,low-.05,z);butte.rotation.y=turn;world.add(butte);
      });
      needsRender=true;
    },undefined,()=>{});
    // Loose boulders tumbled off the talus, in the buttes' colours.
    {const base=new THREE.Color("#9e5226"),spots=[];
      [[0,.7],[0,2.3],[1,1],[1,2.6],[2,.4],[2,2],[0,-.6]].forEach(([k,a])=>{const b=BUTTES[k],r=footOf(b)*(.92+rng()*.15);spots.push([b[0]+Math.cos(a)*r,b[1]+Math.sin(a)*r,(.22+rng()*.24)*(k===2?.7:1)]);});
      const rocks=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshLambertMaterial({flatShading:true}),spots.length),d=new THREE.Object3D();
      spots.forEach(([x,z,s],i)=>{d.position.copy(on(x,z,s*.25));d.rotation.set(rng()*.4,rng()*6,rng()*.4);d.scale.set(s*(1.05+rng()*.3),s*.7,s*(.85+rng()*.25));d.updateMatrix();rocks.setMatrixAt(i,d.matrix);rocks.setColorAt(i,base.clone().multiplyScalar(.9+rng()*.2));});
      world.add(rocks);}
    // Sage bushes dotted over the grass; they sway in the breeze and stir when the cursor brushes past, like the trees.
    const shared={uTime:{value:0},uBreeze:{value:.03},uGust:{value:.05}},foliage=createFoliageMaterial(shared),bushes=[];
    {const tints=["#8a9a5c","#7a8b52","#94a066"],spots=tints.map(()=>[]);let n=0;
      for(let tries=0;n<34&&tries<400;tries++){const a=rng()*Math.PI*2,r=Math.sqrt(rng())*outline(a)*.88,x=Math.cos(a)*r,z=Math.sin(a)*r;
        if(blocked(x,z,.3)||MOUNDS.some(([mx,mz])=>Math.hypot(x-mx,z-mz)<.6))continue;
        spots[n%3].push({position:on(x,z),rotation:rng()*6,scale:(.1+rng()*.14)/3});n++;}
      // Built three times taller than it's placed, so the sway (which grows with height) shows on something this low.
      tints.forEach((tint,k)=>{const geometry=paintGeometry(new THREE.IcosahedronGeometry(3,0).scale(1,.6,1).translate(0,1.2,0),tint),set=createSwayingInstances(geometry,spots[k],foliage);bushes.push(set);world.add(set.mesh);});}
    // A tumbleweed: a loose ball of dry, bent stems (a dozen thin rings at random angles, two straw tones). Brush the
    // cursor through it and it gets kicked the way you swiped, rolling and hopping across the grass; it bounces off the
    // buttes and the basket and off an invisible fence short of the island's edge, so it never falls off. Now and then
    // a gust nudges it along by itself.
    const TUMBLE=.19,tumble={pos:new THREE.Vector3(-1.2,0,2.3),vel:new THREE.Vector2(),hop:0,lift:0,gust:4};
    const tumbleweed=(()=>{const parts=[],straw=[new THREE.Color("#c9a467"),new THREE.Color("#a98349"),new THREE.Color("#dcbd84")],q=new THREE.Quaternion(),e=new THREE.Euler();
      for(let i=0;i<13;i++){
        const r=TUMBLE*(.72+rng()*.32),g=new THREE.TorusGeometry(r,.011+rng()*.006,3,9,Math.PI*(1.3+rng()*.7));
        g.scale(1,.8+rng()*.4,1).applyQuaternion(q.setFromEuler(e.set(rng()*6.3,rng()*6.3,rng()*6.3)));
        const c=straw[i%3],colors=new Float32Array(g.attributes.position.count*3);for(let k=0;k<colors.length;k+=3)colors.set([c.r,c.g,c.b],k);
        g.setAttribute("color",new THREE.BufferAttribute(colors,3));g.deleteAttribute("uv");parts.push(g);}
      const mesh=new THREE.Mesh(mergeGeometries(parts),new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true}));
      parts.forEach(g=>g.dispose());return mesh;})();
    tumbleweed.position.copy(on(tumble.pos.x,tumble.pos.z,TUMBLE));world.add(tumbleweed);
    const rollAxis=new THREE.Vector3(),rollTurn=new THREE.Quaternion();
    function updateTumble(dt){
      const t=tumble,p=t.pos,v=t.vel;
      p.x+=v.x*dt;p.z+=v.y*dt;v.multiplyScalar(Math.exp(-dt*1.1));
      // The fence near the edge: bounce back in.
      const a=Math.atan2(p.z,p.x),edge=outline(a)*.8,r=Math.hypot(p.x,p.z);
      if(r>edge){const nx=p.x/r,nz=p.z/r,out=v.x*nx+v.y*nz;p.x=nx*edge;p.z=nz*edge;if(out>0){v.x-=1.6*out*nx;v.y-=1.6*out*nz;t.hop=Math.max(t.hop,out*.6);}}
      // The buttes and the basket: bounce off them.
      for(const [bx,bz,stop] of [...BUTTES.map(b=>[b[0],b[1],footOf(b)+TUMBLE*.6]),[BASKET.x,BASKET.z,.3+TUMBLE],[POND.x,POND.z,POND.r+TUMBLE*.4]]){
        const dx=p.x-bx,dz=p.z-bz,d=Math.hypot(dx,dz);if(d>=stop||d<1e-4)continue;
        const nx=dx/d,nz=dz/d,into=v.x*nx+v.y*nz;p.x=bx+nx*stop;p.z=bz+nz*stop;if(into<0){v.x-=1.6*into*nx;v.y-=1.6*into*nz;}}
      // Hops: a little upward kick that gravity brings back down.
      t.lift+=t.hop*dt;t.hop-=9*dt;if(t.lift<=0){t.lift=0;t.hop=Math.abs(t.hop)>.5?Math.abs(t.hop)*.35:0;}
      tumbleweed.position.set(p.x,heightAt(p.x,p.z)+TUMBLE*.85+t.lift,p.z);
      // Roll: turn about the axis across its path by the distance travelled.
      const speed=v.length();
      if(speed>1e-3){rollAxis.set(v.y,0,-v.x).normalize();rollTurn.setFromAxisAngle(rollAxis,speed*dt/TUMBLE);tumbleweed.quaternion.premultiply(rollTurn);}
      // The sage it rolls through stirs.
      if(speed>.15)for(const set of bushes)set.mesh.userData.placements.forEach((q,i)=>{if(Math.hypot(q.position.x-p.x,q.position.z-p.z)<.35)set.sway[i]=Math.min(.22,set.sway[i]+speed*dt*.6);});
      return speed>.02||t.lift>0;
    }
    function kickTumble(dx,dz,strength){
      const d=Math.hypot(dx,dz)||1,v=tumble.vel,push=Math.min(2.6,strength*2.2);
      v.x+=dx/d*push;v.y+=dz/d*push;if(v.length()>3)v.setLength(3);tumble.hop=Math.max(tumble.hop,.9+push*.5);tumble.gust=7+rng()*8;
    }
    // Wind: a steady breeze through the sage, and every few seconds a gust that rolls across the island (the bushes and
    // reeds lean hard as it passes) and often shoves the tumbleweed.
    let gustIn=2,gustPower=0;
    function updateWind(dt){
      if((gustIn-=dt)<=0){
        gustIn=3.5+rng()*4;gustPower=1;
        if(rng()<.6){tumble.vel.x+=.5+rng()*.5;tumble.vel.y+=(rng()-.3)*.4;tumble.hop=Math.max(tumble.hop,.8);}
      }
      gustPower=Math.max(0,gustPower-dt*.5);
      return gustPower>.01;
    }
    // The watering hole: a shallow pool sunk in its bowl, a muddy rim, and a few reeds that sway with the sage.
    // (The water's level comes from the ground mesh itself, which is coarser than the bowl: just below the lowest
    // point of its rim, so it fills the bowl and its jagged edge tucks under the slopes.)
    {const probe=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);island.group.updateMatrixWorld(true);
      const groundY=(x,z)=>{probe.set(new THREE.Vector3(x,5,z),down);return probe.intersectObject(island.surface,true)[0]?.point.y??heightAt(x,z);};
      let floor=groundY(POND.x,POND.z),rim=Infinity;
      for(let k=0;k<12;k++){const a=k/12*Math.PI*2;floor=Math.min(floor,groundY(POND.x+Math.cos(a)*.2,POND.z+Math.sin(a)*.2));rim=Math.min(rim,groundY(POND.x+Math.cos(a)*(POND.r+.25),POND.z+Math.sin(a)*(POND.r+.25)));}
      const level=Math.max(floor+.04,rim-.03),shape=new THREE.CircleGeometry(POND.r+.08,14),pos=shape.attributes.position;
      for(let k=1;k<pos.count;k++){const x=pos.getX(k),y=pos.getY(k),j=1+.12*Math.sin(Math.atan2(y,x)*3+.8)+.06*Math.sin(Math.atan2(y,x)*5);pos.setXY(k,x*j,y*j*.8);}
      const water=new THREE.Mesh(shape.rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({color:"#7fb9c2",emissive:"#2f5a68",emissiveIntensity:.35,flatShading:true}));
      water.position.set(POND.x,level,POND.z);world.add(water);
      const reeds=[];for(let k=0;k<9;k++){const a=-.6+k*.32+rng()*.2,r=POND.r*(.95+rng()*.2);
        reeds.push({position:on(POND.x+Math.cos(a)*r*1.05,POND.z+Math.sin(a)*r*.85),rotation:rng()*6,scale:(.05+rng()*.035)});}
      const set=createSwayingInstances(paintGeometry(new THREE.ConeGeometry(.22,3,4).translate(0,1.5,0),"#7f8f4a"),reeds,foliage);bushes.push(set);world.add(set.mesh);}
    // A few birds wheeling high over the Mittens.
    const birdMaterial=new THREE.MeshStandardMaterial({color:"#3b2b33",flatShading:true,roughness:1,side:THREE.DoubleSide});
    const birds=Array.from({length:5},(_,i)=>{const bird=createBird(birdMaterial);bird.scale.setScalar(.9);Object.assign(bird.userData,{a:i/5*Math.PI*2,r:2.2+(i%3)*.7,h:6.4+(i%2)*.8,speed:.28+(i%4)*.05,flap:i*1.7});world.add(bird);return bird;});
    const ahead=new THREE.Vector3();
    // Sunrise: you've come from a night by the campfire, so as the section scrolls on, the sun climbs out from behind
    // the mesa (deep orange low down, paler gold as it rises), its light warming the scene with it. It sits in the
    // scene, not on the island, so it stays put when the island is spun.
    const sunCanvas=document.createElement("canvas");sunCanvas.width=sunCanvas.height=256;
    {const g=sunCanvas.getContext("2d"),grad=g.createRadialGradient(128,128,0,128,128,128);
      [[0,"rgba(255,248,226,1)"],[.16,"rgba(255,236,190,1)"],[.2,"rgba(255,206,150,.65)"],[.45,"rgba(255,170,120,.22)"],[1,"rgba(255,150,110,0)"]].forEach(([k,c])=>grad.addColorStop(k,c));
      g.fillStyle=grad;g.fillRect(0,0,256,256);}
    const sunTexture=new THREE.CanvasTexture(sunCanvas);sunTexture.colorSpace=THREE.SRGBColorSpace;
    const sunDisc=new THREE.Sprite(new THREE.SpriteMaterial({map:sunTexture,color:"#ffffff",transparent:true,depthWrite:false,fog:false,toneMapped:false}));
    sunDisc.scale.setScalar(16);sunDisc.renderOrder=-1;scene.add(sunDisc);
    const LOW=new THREE.Color("#ff8a4c"),HIGH=new THREE.Color("#fff2d6");let risen=-1;
    // A few warm clouds drifting round the mesa, lit pink and gold from below.
    const clouds=[[7.5,2.6,.8,0],[8.5,3.6,.65,1.7],[9,1.6,.7,3.4],[8,4.4,.55,4.8]].map(([r,y,k,a],i)=>{
      const cloud=createCloud(70+i);cloud.material.color.set("#fff1e6");cloud.material.emissive.set("#b4604a");cloud.material.emissiveIntensity=.22;
      cloud.scale.setScalar(k);cloud.userData={r,y,a,speed:.012+(i%2)*.006};scene.add(cloud);return cloud;});

    // The feed basket, its hay, and the pellets that pour into it.
    const basket=createBasket();basket.position.copy(on(BASKET.x,BASKET.z));basket.scale.setScalar(.34);basket.rotation.y=.4;world.add(basket);
    const hay=new THREE.Mesh(new THREE.IcosahedronGeometry(.2,1).scale(1,.4,1),new THREE.MeshStandardMaterial({color:"#e2c46a",flatShading:true,roughness:1}));
    hay.position.copy(basket.position).y+=.1;hay.visible=false;world.add(hay);
    const PELLETS=30,pelletMesh=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.028,0),new THREE.MeshStandardMaterial({color:"#c9a24e",flatShading:true,roughness:1}),PELLETS);
    pelletMesh.frustumCulled=false;world.add(pelletMesh);
    const pellets=Array.from({length:PELLETS},()=>({state:"idle",wait:0,t:0,pos:new THREE.Vector3(),vel:new THREE.Vector3(),spin:new THREE.Vector3()}));
    let food=0;const dummy=new THREE.Object3D();
    function pour(){
      if(preference.matches){food=1;needsRender=true;return callHerd();}
      pellets.forEach((p,i)=>{p.state="wait";p.wait=i*.03;p.t=0;const a=rng()*Math.PI*2,r=rng()*.12;p.pos.set(BASKET.x+Math.cos(a)*r,basket.position.y+1.4+rng()*.3,BASKET.z+Math.sin(a)*r);p.vel.set(0,-.5,0);p.spin.set(rng()*8,rng()*8,rng()*8);});
      callHerd();
    }
    function updatePellets(dt){
      let falling=false;
      pellets.forEach((p,i)=>{
        if(p.state==="wait"){p.wait-=dt;falling=true;if(p.wait<=0)p.state="fall";}
        if(p.state==="fall"){falling=true;p.t+=dt;p.vel.y-=6*dt;p.pos.addScaledVector(p.vel,dt);if(p.pos.y<hay.position.y+food*.05){food=Math.min(1,food+1.4/PELLETS);p.state="idle";}}
        dummy.position.copy(p.pos);dummy.rotation.set(p.t*p.spin.x,p.t*p.spin.y,p.t*p.spin.z);dummy.scale.setScalar(p.state==="fall"?1:0);
        dummy.updateMatrix();pelletMesh.setMatrixAt(i,dummy.matrix);
      });
      pelletMesh.instanceMatrix.needsUpdate=true;
      hay.scale.setScalar(.2+food*.8);hay.visible=food>.02;
      return falling;
    }

    // The herd: a few bison grazing and ambling about the mesa, the calf (red coat) never far from its mother.
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),herd=[],LIMIT=.72;let leash=.4;
    const inside=(x,z)=>Math.hypot(x,z)<outline(Math.atan2(z,x))*LIMIT&&!blocked(x,z,.35);
    loader.load("/models/island/bison.glb",gltf=>{
      if(disposed)return;
      const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3());
      const spots=[[.2,.5],[.5,-.4],[1.5,.9],[-.3,1.5],[.5,.85]];
      // The calf keeps within a length and a half of its mother's width of her.
      leash=Math.max(.32,1.5*size.x*.55/size.y);
      spots.forEach(([x,z],i)=>{
        const calf=i===spots.length-1,model=i?gltf.scene.clone():gltf.scene,root=new THREE.Group();let gait=null;
        model.traverse(o=>{if(!o.isMesh)return;
          if(calf){const g=o.geometry.clone(),c=g.attributes.color,tint=new THREE.Color(),deep=new THREE.Color("#a24f22"),bright=new THREE.Color("#e08a4c");
            if(c)for(let k=0;k<c.count;k++){const l=(c.getX(k)+c.getY(k)+c.getZ(k))/3;tint.copy(deep).lerp(bright,Math.min(1,l*3));c.setXYZ(k,tint.r,tint.g,tint.b);}o.geometry=g;}
          gait??=createBisonRig(o.geometry);o.material=gait.material;o.frustumCulled=false;});
        const h=calf?.3:.55;model.scale.setScalar(h/size.y);model.position.y=-box.min.y*h/size.y;root.add(model);
        root.position.copy(on(x,z));world.add(root);
        // One of the herd starts the scene lying down, chewing.
        const resting=i===2;
        herd.push({root,gait,calf,height:h,yaw:rng()*6,state:resting?"rest":"graze",timer:1+rng()*5,speed:0,gaitName:"Graze",walk:0,run:0,phase:rng(),head:0,eatT:rng()*5,
          target:new THREE.Vector2(x,z),feeding:false,face:null,eatUntil:0,dipNext:2+rng()*4,dipUntil:0,shift:rng()*6,
          look:0,lookGoal:0,lookNext:rng()*3,tail:0,tailV:0,flickNext:1+rng()*4,lift:0,rest:resting?1:0,resting,restUntil:resting?14+rng()*10:0,frolicUntil:0});
      });
      needsRender=true;
    },undefined,()=>{});
    // Feeding time: the adults and the calf trot over and stand round the far side of the basket.
    function callHerd(){
      // The calf squeezes in at its mother's side.
      const adults=herd.filter(b=>!b.calf);
      herd.forEach(b=>{const k=adults.indexOf(b),a=b.calf?Math.PI*.15-.45:Math.PI*(.15+.7*k/Math.max(1,adults.length-1)),r=b.calf?.45:.62;
        b.target.set(BASKET.x+Math.cos(a)*r,BASKET.z-Math.sin(a)*r);b.feeding=true;b.drink=false;b.resting=false;b.face=null;b.state="move";b.gaitName="Run";b.speed=.85;});
    }
    function updateBison(b,dt,now){
      const p=b.root.position;b.timer-=dt;
      if(b.state==="eat"){if(now>b.eatUntil){b.state="graze";b.feeding=false;b.drink=false;b.face=null;b.timer=0;}}
      else if(b.state==="rest"){
        // Lying down: it stays down a while, then gets up (legs first unfold, then it stands and goes on grazing).
        if(b.resting&&now>b.restUntil)b.resting=false;
        if(!b.resting&&b.rest<.03){b.state="graze";b.timer=1+rng()*2;}
      }
      else if(b.state==="graze"&&b.timer<=0&&rng()<(b.calf?.12:.15)&&herd.filter(o=>o.resting).length<2&&(!b.calf||herd[0].resting)){
        // Now and then one lies down for a rest (the calf, when its mother does).
        b.state="rest";b.resting=true;b.restUntil=b.calf?herd[0].restUntil:now+12+rng()*16;
      }
      else if(b.state==="graze"&&b.timer<=0&&!b.calf&&rng()<.3&&!herd.some(o=>o.drink)){
        // Now and then one wanders over to the watering hole for a drink, from whichever side it's on.
        const a=Math.atan2(p.z-POND.z,p.x-POND.x);b.target.set(POND.x+Math.cos(a)*(POND.r+.38),POND.z+Math.sin(a)*(POND.r+.38));
        b.drink=true;b.state="move";b.gaitName="Walk";b.speed=.24;
      }
      else if(b.state==="graze"&&b.timer<=0&&b.calf&&rng()<.4){
        // The calf's games: a quick gallop off, a loop, and back to its mother.
        for(let tries=0;tries<12;tries++){const a=rng()*Math.PI*2,r=leash*(1.8+rng()*1.2),x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;if(inside(x,z)){b.target.set(x,z);break;}}
        b.state="move";b.gaitName="Run";b.speed=.75+rng()*.2;b.frolicUntil=now+2.5;
      }
      else if(b.state==="graze"&&b.timer<=0){
        // Wander a little; the calf stays by its mother (the first bison).
        for(let tries=0;tries<12;tries++){const from=b.calf?herd[0].root.position:p,a=rng()*Math.PI*2,r=b.calf?leash*(.6+rng()*.35):.6+rng()*1.4,x=from.x+Math.cos(a)*r,z=from.z+Math.sin(a)*r;if(inside(x,z)){b.target.set(x,z);break;}}
        b.state="move";b.gaitName="Walk";b.speed=b.calf?.3:.22+rng()*.1;
      } else if(b.state==="move"){
        const dx=b.target.x-p.x,dz=b.target.y-p.z,dist=Math.hypot(dx,dz);
        if(dist<.04){
          b.gaitName="Graze";b.speed=0;
          if(b.feeding){b.state="eat";b.eatUntil=now+6;b.face=Math.atan2(BASKET.x-p.x,BASKET.z-p.z);}
          else if(b.drink){b.state="eat";b.eatUntil=now+4+rng()*3;b.face=Math.atan2(POND.x-p.x,POND.z-p.z);}
          else{b.state="graze";b.timer=b.calf?.8+rng()*1.6:3+rng()*7;}
        }
        else{
          // (Getting up first if it was lying down.) It turns toward where it's going, and slows into the turn.
          let turn=Math.atan2(dx,dz)-b.yaw;turn=Math.atan2(Math.sin(turn),Math.cos(turn));b.yaw+=turn*(1-Math.exp(-dt*4));
          const step=Math.min(dist,b.speed*dt*(1-b.rest)**2*(.55+.45*Math.cos(Math.min(Math.abs(turn),1.5))));p.x+=dx/dist*step;p.z+=dz/dist*step;
        }
      }
      // The calf follows when its mother wanders off: it trots (or runs, if she's well away) back to her side.
      if(b.calf&&!b.feeding&&b.state!=="rest"&&now>b.frolicUntil){const m=herd[0].root.position,away=Math.hypot(p.x-m.x,p.z-m.z);
        if(away>leash&&(b.state!=="move"||Math.hypot(b.target.x-m.x,b.target.y-m.z)>leash*.9)){
          const a=Math.atan2(p.z-m.z,p.x-m.x);b.target.set(m.x+Math.cos(a)*leash*.6,m.z+Math.sin(a)*leash*.6);b.state="move";
          const off=Math.hypot(b.target.x-POND.x,b.target.y-POND.z);if(off<POND.r+.2){const k=(POND.r+.25)/Math.max(off,1e-3);b.target.set(POND.x+(b.target.x-POND.x)*k,POND.z+(b.target.y-POND.z)*k);}
          const run=away>leash*1.4;b.gaitName=run?"Run":"Walk";b.speed=run?.9:.35;}}
      if(b.face!==null){let turn=b.face-b.yaw;turn=Math.atan2(Math.sin(turn),Math.cos(turn));b.yaw+=turn*(1-Math.exp(-dt*4));}

      // Gait: blend weights ease toward the current one; the stride cycle advances by distance over stride length, so
      // the hooves keep pace with the ground.
      const moving=b.state==="move"&&b.rest<.05,goalWalk=moving&&b.gaitName==="Walk"?1:0,goalRun=moving&&b.gaitName==="Run"?1:0;
      b.walk+=(goalWalk-b.walk)*(1-Math.exp(-dt*5));b.run+=(goalRun-b.run)*(1-Math.exp(-dt*5));
      const stride=b.height*(b.walk*b.gait.stride.walk+b.run*b.gait.stride.run)/Math.max(.001,b.walk+b.run);
      b.phase+=dt*(moving?b.speed*(1-b.rest)**2:.15*(b.walk+b.run))/Math.max(.05,stride);
      // Lying down and getting up.
      b.rest+=((b.resting?1:0)-b.rest)*(1-Math.exp(-dt*1.6));
      // Head: down to graze every few seconds, down at the basket or the water; up and looking about otherwise.
      b.eatT+=dt;
      if(b.state==="graze"&&now>b.dipNext){b.dipUntil=now+1.6+rng()*.8;b.dipNext=now+4+rng()*3;}
      const down=b.state==="eat"?.62+Math.sin(b.eatT*5.2)*.06:b.state==="graze"&&now<b.dipUntil?.66+Math.sin(b.eatT*5.2)*.05:b.state==="rest"?.08:b.state==="graze"?.08:.12*b.walk;
      b.head+=(down-b.head)*(1-Math.exp(-dt*(down>b.head?2.6:1.8)));
      // Looking about: every few seconds it turns its head to something new (just a little while walking, not at all
      // galloping or with its nose down), and back.
      if(now>b.lookNext){const still=b.state!=="move";b.lookGoal=still&&rng()<.75?(rng()-.5)*1.3:(rng()-.5)*.25;b.lookNext=now+(still?1.8+rng()*3:2.5+rng()*3);}
      const lookGoal=b.lookGoal*(1-b.run)*(1-Math.min(1,b.head/.6)*.7);b.look+=(lookGoal-b.look)*(1-Math.exp(-dt*2.2));
      // Tail: a lazy sway, and every few seconds a flick at a fly (a quick swish that dies away), raised when galloping.
      if(now>b.flickNext){b.tailV+=(rng()<.5?-1:1)*(5+rng()*4);b.flickNext=now+2+rng()*5;}
      b.tailV+=(-b.tail*60-b.tailV*5)*dt;b.tail+=b.tailV*dt;
      b.lift+=(b.run*.9-b.lift)*(1-Math.exp(-dt*3));
      b.gait.pose({phase:b.phase,walk:b.walk,run:b.run,nod:b.head+b.rest*.05,turn:b.look,tail:b.tail+Math.sin(now*1.3+b.shift)*.12,tailLift:b.lift,rest:b.rest,
        breath:.012*Math.sin(now*(1.5+b.run*2)+b.shift)});
      p.y=heightAt(p.x,p.z);b.root.rotation.y=b.yaw;
    }
    // Prairie dogs pop up from their mounds, look about, and duck back down.
    const dogs=[];
    loader.load("/models/island/prairiedog.glb",gltf=>{
      if(disposed)return;
      const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3()),k=.22/size.y;
      const moundMaterial=new THREE.MeshStandardMaterial({color:"#9a6a3e",flatShading:true,roughness:1}),hole=new THREE.MeshBasicMaterial({color:"#2b1a14"});
      MOUNDS.forEach(([x,z],i)=>{
        const y=heightAt(x,z),mound=new THREE.Mesh(new THREE.CylinderGeometry(.08,.22,.09,7),moundMaterial);mound.position.set(x,y+.03,z);world.add(mound);
        const opening=new THREE.Mesh(new THREE.CircleGeometry(.07,7).rotateX(-Math.PI/2),hole);opening.position.set(x,y+.08,z);world.add(opening);
        const model=i?gltf.scene.clone():gltf.scene;model.traverse(o=>{if(o.isMesh)o.material=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1});});
        model.scale.setScalar(k);model.position.y=-box.min.y*k;
        const root=new THREE.Group();root.add(model);root.position.set(x,y-.25,z);root.rotation.y=rng()*6;world.add(root);
        dogs.push({root,base:y,state:"down",timer:1+rng()*5,look:root.rotation.y,up:0});
      });
    },undefined,()=>{});
    function updateDog(d,dt){
      d.timer-=dt;
      if(d.state==="down"&&d.timer<=0){d.state="up";d.timer=2.5+rng()*4;}
      else if(d.state==="up"){if(d.timer<=0){d.state="down";d.timer=2+rng()*6;}else if(rng()<dt*.6)d.look+=(rng()-.5)*1.8;}
      d.up+=((d.state==="up"?.25:0)-d.up)*(1-Math.exp(-dt*(d.state==="up"?5:12)));
      d.root.position.y=d.base-.25+d.up;d.root.rotation.y+=(d.look-d.root.rotation.y)*(1-Math.exp(-dt*4));
    }

    // Pointer: drag to spin the mesa; hover the basket to wobble it, tap it to pour in feed; tap a prairie dog to send it
    // down its hole.
    const raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2();let onBasket=false;
    const pick=(event,objects)=>{const rect=canvas.getBoundingClientRect();ndc.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(ndc,camera);return raycaster.intersectObjects(objects,true)[0];};
    const spin=createSpin(canvas,{rest:0,
      over:event=>(onBasket=!!pick(event,[basket,hay]))||!!pick(event,dogs.map(d=>d.root)),
      onTap:event=>{
        if(pick(event,[basket,hay])){pour();return;}
        const hit=pick(event,dogs.map(d=>d.root));if(!hit)return;
        const dog=dogs.find(d=>{let o=hit.object;while(o&&o!==d.root)o=o.parent;return o===d.root;});
        if(dog){dog.state="down";dog.timer=3+rng()*3;needsRender=true;}
      }});
    canvas.addEventListener("pointerleave",()=>{onBasket=false;hadHover=false;});
    // Hover (a mouse only): the sage near the cursor stirs, the faster the cursor the more. Passive under the drag.
    // Brushing through the tumbleweed kicks it the way the cursor was going.
    const hover=new THREE.Vector3(),lastHover=new THREE.Vector3();let hoverX=0,hoverY=0,hoverAt=0,hadHover=false;
    function onHover(event){
      if(event.pointerType!=="mouse"||event.buttons||preference.matches)return;
      const now=performance.now(),speed=Math.hypot(event.clientX-hoverX,event.clientY-hoverY)/Math.max(16,now-hoverAt);hoverX=event.clientX;hoverY=event.clientY;hoverAt=now;
      const hit=pick(event,[island.surface,tumbleweed]),kick=Math.min(1,speed*.9);if(!hit){hadHover=false;return;}
      lastHover.copy(hover);world.worldToLocal(hover.copy(hit.point));
      const fresh=hadHover;hadHover=true;
      if(fresh&&kick>.05&&(hit.object===tumbleweed||Math.hypot(hover.x-tumble.pos.x,hover.z-tumble.pos.z)<TUMBLE+.3)){kickTumble(hover.x-lastHover.x,hover.z-lastHover.z,kick);needsRender=true;}
      if(kick<.03)return;
      for(const set of bushes)set.mesh.userData.placements.forEach((p,i)=>{const d=Math.hypot(p.position.x-hover.x,p.position.z-hover.z);if(d<1.4)set.sway[i]=Math.min(.22,set.sway[i]+(1-d/1.4)*kick*.09);});
      needsRender=true;
    }
    canvas.addEventListener("pointermove",onHover);

    // Framing: the mesa to one side (the words scroll past on the other), further off when tall.
    let tall=false,attitude=0;const VIEW=new THREE.Vector3(0,.34,1).normalize(),focus=new THREE.Vector3(0,.9,0),viewDir=new THREE.Vector3();
    // The camera sits on an orbit round the mesa; only its attitude (steeper arriving, lower leaving) changes.
    let closeUp=null;// (?debug only: { from, at } to inspect something up close)
    function placeCamera(){if(closeUp){camera.position.copy(closeUp.from);camera.lookAt(closeUp.at);return;}camera.position.copy(tilted(VIEW,attitude,viewDir)).multiplyScalar(tall?60:27).add(focus);camera.lookAt(focus);}
    function frame(){
      const w=mount.clientWidth,h=mount.clientHeight;camera.aspect=w/h;tall=camera.aspect<.85;
      if(tall)camera.setViewOffset(w,h,0,h*.2,w,h);else camera.setViewOffset(w,h,side==="center"?0:(side==="left"?.17:-.17)*w,side==="center"?-h*.13:h*.07,w,h);
      camera.updateProjectionMatrix();placeCamera();needsRender=true;
    }
    const resize=new ResizeObserver(frame);resize.observe(mount);
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});observer.observe(mount);

    let time=0,since=0,needsRender=true;
    function tick(dt){
      const reduced=preference.matches,step=reduced?0:dt;time+=step;
      const falling=updatePellets(dt);
      // Food drains while the herd eats.
      if(herd.some(b=>b.state==="eat"))food=Math.max(0,food-dt*.12);
      basket.rotation.z=onBasket&&!reduced?Math.sin(time*9)*.04:0;
      world.rotation.y=spin.update(dt);
      const goal=reduced?0:state.current.tilt[slot];attitude+=(goal-attitude)*(1-Math.exp(-dt*6));placeCamera();
      herd.forEach(b=>updateBison(b,step,time));dogs.forEach(d=>updateDog(d,step));
      const rolling=updateTumble(step),windy=reduced?false:updateWind(step);
      world.position.y=Math.sin(time*.45)*.1;
      // The sun's climb follows the scroll through the section (reduced motion: already up).
      const rise=reduced?1:smooth(state.current.progress[slot]/.75);
      if(Math.abs(rise-risen)>1e-3){risen=rise;sunDisc.position.set(-15+rise*2,-4+rise*9,-32);sunDisc.material.color.copy(LOW).lerp(HIGH,rise);
        sun.intensity=1.8+rise*1.4;sun.color.copy(LOW).lerp(HIGH,rise*.8);}
      clouds.forEach(cloud=>{const u=cloud.userData;u.a+=step*u.speed;cloud.position.set(Math.cos(u.a)*u.r,u.y+Math.sin(time*.2+u.r)*.2,-Math.abs(Math.sin(u.a))*u.r-1.5);});
      shared.uTime.value=time;shared.uBreeze.value=reduced?0:.3;shared.uGust.value=reduced?0:.3+gustPower*.9;
      for(const set of bushes){for(let i=0;i<set.sway.length;i++)set.sway[i]*=Math.exp(-dt*2.2);set.update();}
      birds.forEach(bird=>{const u=bird.userData;u.a+=step*u.speed;const x=-.2+Math.cos(u.a)*u.r,z=-2+Math.sin(u.a)*u.r,y=u.h+Math.sin(time*.8+u.flap)*.25;
        bird.position.set(x,y,z);bird.lookAt(world.localToWorld(ahead.set(-.2+Math.cos(u.a+.2)*u.r,y,-2+Math.sin(u.a+.2)*u.r)));
        const flap=Math.sin(time*8+u.flap)*.7;u.wings[0].rotation.z=flap;u.wings[1].rotation.z=-flap;});
      needsRender=false;
      return falling||rolling||windy||onBasket||spin.busy||herd.some(b=>b.feeding&&b.state==="move")||Math.abs(goal-attitude)>.05||bushes.some(set=>set.sway.some(v=>v>.003));
    }
    // Full rate while feed falls, the herd runs to it or the basket is hovered, 30 fps for the grazing in between.
    let busy=true;
    // Called by the shared frame loop; returns whether anything changed (so the canvas needs redrawing).
    function draw(dt){
      dt=Math.min(dt,.05);since+=dt;
      if(!visible||document.hidden||!state.current.live.includes(slot))return false;
      if(preference.matches&&!needsRender&&!onBasket&&!spin.busy&&!pellets.some(p=>p.state!=="idle"))return false;
      if(!busy&&since<1/30-.002)return false;
      busy=tick(Math.min(since,.1));since=0;return true;
    }
    frame();tick(0);mount.dataset.ready="true";
    // On wide screens it fades out toward the words beside it.
    const entry={mount,scene,camera,draw,exposure:1.05,fade:null},unregister=shared_.register(entry);
    const wide=matchMedia("(min-width: 761px)"),syncFade=()=>{entry.fade=wide.matches?{side:"right",from:.75}:null;shared_.invalidate();};
    syncFade();wide.addEventListener("change",syncFade);
    const readyTimer=setTimeout(()=>ready.current?.(),0);
    if(new URLSearchParams(window.location.search).has("debug"))window.__work={camera,herd,world,scene,renderer,pour,THREE,tumble,tumbleweed,kickTumble,gust:()=>{gustIn=0;},closeUp:v=>{closeUp=v;}};

    return()=>{
      clearTimeout(readyTimer);delete window.__work;disposed=true;unregister();wide.removeEventListener("change",syncFade);resize.disconnect();observer.disconnect();
      spin.dispose();canvas.removeEventListener("pointermove",onHover);
      scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat())m?.dispose();});
      sunTexture.dispose();
      
    };
  },[state,slot]);
  return <div className="ht-canvas" ref={host} aria-hidden="true" />;
}
