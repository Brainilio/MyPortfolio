import * as THREE from 'three';
import { track, trackLinear, smooth } from './timeline';

// World layout: the summit sits at the origin, space begins around y=190,
// then the chase runs sideways (-X) before turning forward into depth (-Z).
export const SUMMIT_SPOT=new THREE.Vector3(-1.6,0,.6);
export const LAUNCH_PAD=new THREE.Vector3(3,0,-4);
export const ROCKET_HEIGHT=8,ASTRONAUT_HEIGHT=1.8;
// A whole globe seen from afar, below and behind the ejection point (the chase flies away from it).
export const EARTH_RADIUS=1000,EARTH_CENTER=new THREE.Vector3(0,-1000,1400);
// Pole straight up: the camera sees ~40°N (Atlantic, Europe) with the auroral oval along the upper limb.
export const EARTH_POLE=new THREE.Vector3(0,1,0);
// Gargantua-scale: far enough off to be framed huge and partly off-screen.
export const HOLE=new THREE.Vector3(-800,232,-470);
// Deep-space backdrop. Looking back (+Z) toward home: Earth below, the Moon upper-left of it, the Sun upper-right.
// Looking ahead (-Z): Saturn far off behind the rocket-cam, Mars to the right.
export const MOON_RADIUS=110,MOON=new THREE.Vector3(900,700,3400);
export const SUN_DIRECTION=new THREE.Vector3(-.32,.3,.9).normalize(),SUN_DISTANCE=3600;
export const SATURN=new THREE.Vector3(-700,500,-5200),MARS=new THREE.Vector3(300,80,-1500);

// After Projects the path turns sideways (-X), so the Moon pass can be filmed in profile against home.
const points=[[0,186,6],[-12,190,-24],[-55,196,-55],[-110,199,-80],[-150,200,-115],[-165,200,-190],[-168,200,-290],[-176,200,-375],[-235,202,-418],[-320,204,-432],[-400,204,-432],[-470,204,-432],[-520,205,-432]].map(p=>new THREE.Vector3(...p));
export const curve=new THREE.CatmullRomCurve3(points,false,'centripetal');
export const LAST=points.length-1;
export const PORTAL_K=9;

// Story time → index along the flight path (control point k sits at story time keys).
const pathKeys=[[1.78,0],[2.05,1],[2.45,2],[2.8,3],[3.0,4],[3.33,5],[3.66,6],[4.0,7],[4.6,8],[5.3,9],[5.7,10],[6.05,11],[7.0,12]];
export const pathIndex=s=>trackLinear(s,pathKeys);
// How far ahead of the astronaut the rocket flies, in path indices.
const leadKeys=[[1.7,.3],[1.95,1.5],[2.5,1.0],[3.0,.5],[4.0,.5],[4.6,1.3],[5.15,.75],[5.5,1.1],[6.0,1.3]];
export const rocketLead=s=>track(s,leadKeys);

const worldUp=new THREE.Vector3(0,1,0);
export function frameAt(k,out) {
  const t=THREE.MathUtils.clamp(k/LAST,0,1);
  curve.getPoint(t,out.position);curve.getTangent(Math.min(t,.999),out.tangent).normalize();
  out.side.crossVectors(out.tangent,worldUp).normalize();
  out.up.crossVectors(out.side,out.tangent).normalize();
  return out;
}
export const createFrame=()=>({position:new THREE.Vector3(),tangent:new THREE.Vector3(),side:new THREE.Vector3(),up:new THREE.Vector3()});

// Camera shots. Each writes a position and a look-at target from the current actors.
const shots={
  establish(c,pos,look){const push=smooth(c.s/1.0);pos.set(15-push*7,6.5-push*3,30-push*14);look.set(1,1.4-push*.4,-3);},
  launch(c,pos,look){pos.set(c.rocket.x+13,Math.max(2.5,c.rocket.y-5),c.rocket.z+17);look.copy(c.rocket).add(c.tmp.set(0,4,0));},
  // Looking back past the tumbling astronaut at the whole Earth below.
  eject(c,pos,look){pos.copy(c.astro).addScaledVector(c.frame.tangent,4.6).addScaledVector(c.frame.up,1.2).addScaledVector(c.frame.side,1.8);
    look.copy(c.astro).addScaledVector(c.frame.tangent,-10).addScaledVector(c.frame.up,-2.2);},
  // Centred behind him, slightly above: a steady, solid hero framing.
  chase(c,pos,look){pos.copy(c.astro).addScaledVector(c.frame.tangent,-6).addScaledVector(c.frame.up,1.6);
    look.copy(c.astro).addScaledVector(c.frame.tangent,6).addScaledVector(c.frame.up,.2);},
  // Rocket-cam: the camera leaves the astronaut and rides behind the rocket's flight line,
  // so its figure-eights play out centre frame while the project cards pass on either side.
  rocket(c,pos,look){pos.copy(c.rocketPath).addScaledVector(c.frame.tangent,-34).addScaledVector(c.frame.up,2.5);
    look.copy(c.rocketPath).addScaledVector(c.frame.tangent,10).addScaledVector(c.frame.up,1.6);},
  // Over the shoulder toward the distant Moon, so the jump across its face reads as a silhouette.
  // Look back home: the astronaut flies toward camera, lower right, with Earth and the distant Moon behind him.
  // Profile: the camera trucks alongside him (on the far side from home), looking back at Earth and
  // the Moon as he crosses the frame. A little lead room ahead of him.
  moon(c,pos,look){pos.copy(c.astro).add(c.tmp.set(0,.2,-6.2));
    look.copy(c.astro).add(c.tmp.set(0,-.55,0));},
  // Interstellar framing: hang back and to one side so the astronaut is a small figure on the left and
  // the black hole fills the right of frame, its disk sweeping diagonally out of shot.
  wide(c,pos,look){pos.copy(c.astro).addScaledVector(c.frame.tangent,-34).addScaledVector(c.frame.side,17).addScaledVector(c.frame.up,5);
    look.copy(pos).addScaledVector(c.frame.tangent,96).addScaledVector(c.frame.side,-39).addScaledVector(c.frame.up,4);},
};
// Repeated times are hard cuts (the scene covers them with a short fade); different times blend.
const shotKeys=[[0,'establish'],[1.0,'establish'],[1.1,'launch'],[1.66,'launch'],[1.66,'eject'],[1.995,'eject'],[1.995,'chase'],[3.04,'chase'],[3.04,'rocket'],[3.95,'rocket'],[3.95,'moon'],[4.9,'moon'],[4.9,'chase'],[6.02,'chase'],[6.02,'wide']];
const a={pos:new THREE.Vector3(),look:new THREE.Vector3()},b={pos:new THREE.Vector3(),look:new THREE.Vector3()};
// Returns the name of the shot in use, so the scene can tell when a hard cut happens.
export function shotAt(c,pos,look) {
  let i=shotKeys.findIndex(([at])=>c.s<at);
  if(i===-1){shots[shotKeys.at(-1)[1]](c,pos,look);return shotKeys.at(-1)[1];}
  if(i===0){shots[shotKeys[0][1]](c,pos,look);return shotKeys[0][1];}
  const [fromS,from]=shotKeys[i-1],[toS,to]=shotKeys[i];
  if(from===to){shots[from](c,pos,look);return from;}
  shots[from](c,a.pos,a.look);shots[to](c,b.pos,b.look);
  const w=smooth((c.s-fromS)/(toS-fromS));
  // Mid-sweep, aim at the astronaut so he never leaves frame while the camera travels around him.
  orbitBlend(c.astro,a.pos,b.pos,w,pos);look.copy(a.look).lerp(b.look,w).lerp(c.astro,Math.sin(w*Math.PI)*.75);
  return w<.5?from:to;
}

// Blend two camera positions by sweeping around `center` (yaw the short way, radius and height lerped),
// so cuts between shots on opposite sides of the astronaut arc around him instead of passing through him.
const oa=new THREE.Vector3(),ob=new THREE.Vector3();
export function orbitBlend(center,from,to,w,out) {
  oa.copy(from).sub(center);ob.copy(to).sub(center);
  const ra=Math.hypot(oa.x,oa.z),rb=Math.hypot(ob.x,ob.z),ya=Math.atan2(oa.x,oa.z);
  let dy=Math.atan2(ob.x,ob.z)-ya;dy=Math.atan2(Math.sin(dy),Math.cos(dy));
  const yaw=ya+dy*w,r=THREE.MathUtils.lerp(ra,rb,w);
  return out.set(center.x+Math.sin(yaw)*r,center.y+THREE.MathUtils.lerp(oa.y,ob.y,w),center.z+Math.cos(yaw)*r);
}

// The dazed close-up: the helmet dead centre, the camera floating just in front of the visor.
export function closeUp(c,head,pos,look) {
  c.tmp.copy(c.frame.tangent).setY(0).normalize();
  pos.copy(head).addScaledVector(c.tmp,.95).add(c.tmp.set(0,.05,0));
  look.copy(head);
}
