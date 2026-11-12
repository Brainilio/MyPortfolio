import * as THREE from 'three';

// Uninvited guests: saucers stream in from deep space toward the parked rocket as you scroll. Click one to
// zap it; anything you leave alone, the astronaut zaps himself just before it reaches the ship, so simply
// scrolling through plays the whole scene. Scrolling back above a saucer's arrival resets it.
const COUNT=10,hash=n=>{const s=Math.sin(n*91.7)*43758.5453;return s-Math.floor(s);};
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};

export function createAlienGame(texture) {
  const group=new THREE.Group();
  const saucerGeometry=new THREE.SphereGeometry(2.2,24,12);saucerGeometry.scale(1,.3,1);
  const domeGeometry=new THREE.SphereGeometry(.95,16,8,0,Math.PI*2,0,Math.PI/2);domeGeometry.translate(0,.4,0);
  const saucers=new THREE.InstancedMesh(saucerGeometry,new THREE.MeshStandardMaterial({color:0x9aa3b5,metalness:.75,roughness:.3}),COUNT);
  const domes=new THREE.InstancedMesh(domeGeometry,new THREE.MeshBasicMaterial({color:new THREE.Color(.35,1.9,.7),toneMapped:false}),COUNT);
  saucers.frustumCulled=domes.frustumCulled=false;group.add(saucers,domes);
  const laserPositions=new Float32Array(COUNT*6),laserGeometry=new THREE.BufferGeometry();
  laserGeometry.setAttribute('position',new THREE.BufferAttribute(laserPositions,3));
  const lasers=new THREE.LineSegments(laserGeometry,new THREE.LineBasicMaterial({color:new THREE.Color(.6,3,.9),toneMapped:false}));lasers.frustumCulled=false;group.add(lasers);
  const aliens=[...Array(COUNT)].map((_,i)=>{
    const spawn=.04+i*.07;
    const boom=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:0x9dffb0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));
    group.add(boom);
    // Where it leaves the portal (spread wide), and its slot in the swarm circling the ship.
    return {spawn,auto:spawn+.22,hitAt:0,boom,phase:hash(i+3)*6,
      exit:new THREE.Vector3((hash(i)-.5)*26,(hash(i+9)-.5)*16,(hash(i+2)-.5)*26),
      angle:i/COUNT*Math.PI*2,radius:6+hash(i+4)*4,height:(hash(i+5)-.35)*7,position:new THREE.Vector3(),zap:0};
  });
  const dummy=new THREE.Object3D(),screen=new THREE.Vector3(),swirl=new THREE.Vector3();
  let zapped=0;
  return {group,
    // p: the section's scroll progress; from/to: portal and rocket positions; muzzle: where his shots start.
    update({p,time,now,from,to,muzzle,reduced}) {
      let nearest=null,best=Infinity;
      aliens.forEach((alien,i)=>{
        if(p<alien.spawn-.02&&alien.hitAt){if(alien.byYou)zapped--;alien.hitAt=0;alien.byYou=false;}
        // Scrolled past its deadline: he fires. The blast plays out on the clock either way, so stopping
        // mid-scroll never freezes an explosion on screen.
        if(!alien.hitAt&&p>alien.auto)alien.hitAt=now;
        if(alien.hitAt&&!alien.byYou&&p<alien.auto-.02)alien.hitAt=0;
        const approach=smooth((p-alien.spawn)/.3);
        // Curving in from the portal, then circling the ship, probing for a way in.
        const a=alien.angle+(reduced?0:time*.35);
        screen.copy(to).add(swirl.set(Math.cos(a)*alien.radius,alien.height,Math.sin(a)*alien.radius));
        alien.position.copy(from).add(alien.exit).lerp(screen,approach);
        alien.position.y+=Math.sin(approach*Math.PI)*6;
        if(!reduced)alien.position.y+=Math.sin(time*1.6+alien.phase)*.5;
        // Zapped by a click (on its own clock) or, failing that, by him as you scroll past.
        alien.zap=alien.hitAt?clampUnit((now-alien.hitAt)/700):0;
        const alive=alien.live=p>alien.spawn&&alien.zap===0;
        const scale=p<alien.spawn-.01?0:1-smooth(alien.zap*4);
        dummy.position.copy(alien.position);dummy.rotation.set(Math.sin(time+alien.phase)*.15,time*1.5+alien.phase,0);dummy.scale.setScalar(Math.max(scale,.0001));dummy.updateMatrix();
        saucers.setMatrixAt(i,dummy.matrix);domes.setMatrixAt(i,dummy.matrix);
        const firing=alien.zap>0&&alien.zap<.3;
        (firing?muzzle:alien.position).toArray(laserPositions,i*6);alien.position.toArray(laserPositions,i*6+3);
        alien.boom.position.copy(alien.position);alien.boom.scale.setScalar(3+alien.zap*12);alien.boom.material.opacity=alien.zap>0&&alien.zap<1?(1-alien.zap)*1.2:0;
        if(alive){const d=alien.position.distanceToSquared(muzzle);if(d<best){best=d;nearest=alien.position;}}
      });
      saucers.instanceMatrix.needsUpdate=domes.instanceMatrix.needsUpdate=true;laserGeometry.attributes.position.needsUpdate=true;
      return nearest;
    },
    // A click at (x, y) in CSS pixels: zap the live saucer closest to it on screen, if it's close enough.
    shoot(x,y,camera,width,height,now) {
      let hit=null,best=Infinity;
      for(const alien of aliens){
        if(!alien.live)continue;
        screen.copy(alien.position).project(camera);if(screen.z>1)continue;
        const sx=(screen.x+1)/2*width,sy=(1-screen.y)/2*height;
        const radius=Math.max(36,2.4/alien.position.distanceTo(camera.position)*height);
        const d=Math.hypot(sx-x,sy-y);if(d<radius&&d<best){best=d;hit=alien;}
      }
      if(!hit)return false;
      hit.hitAt=now;hit.byYou=true;zapped++;return true;
    },
    get zapped(){return zapped;},
    total:COUNT,
  };
}
const clampUnit=v=>THREE.MathUtils.clamp(v,0,1);
