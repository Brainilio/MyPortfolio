import * as THREE from "three";

// A rig for the bison (Poly by Google's "Bison", which has no skeleton), done in the vertex shader. Joint places are
// fractions of the model's own size, measured from its mesh (work/island/bison-scan.mjs):
//  - Legs are separate columns only below ~30% of the height; above that the shoulder and thigh are part of the body.
//    The real joints sit inside it: the shoulder at ~55% height, the hip at ~58%, so a leg swings as a whole, with
//    the swing fading out through the shoulder/thigh around its column (the belly between the legs stays put).
//  - Front leg: knee (carpus) at ~17%, which folds the cannon BACK as the leg swings forward; fetlock at ~6%.
//  - Hind leg: hock at ~25%, set behind the column, which folds the cannon FORWARD and up; fetlock at ~6%.
//  - Head and neck pivot at the hump's front (~28% of the length back from the nose, ~55% up): nod and look about.
//  - The tail is a short stub high on the rump (~63-79% up, at the very back): it swishes and lifts.
// How a bison moves (as cattle do): the walk is a four-beat lateral sequence, left hind, left front, right hind, right
// front, each a quarter-cycle apart, a hoof down about two thirds of the time, the head bobbing with the front legs.
// At speed it gallops: the hinds land close together, then the fronts, a hoof down about a third of the time, the
// body rocking nose-up, nose-down, the tail raised. Lying down, the legs fold under and the body settles on them.
// Every leg goes through stance (hoof planted, leg sweeping from forward to back) then swing (joints fold, the hoof
// lifts and is carried forward), so the hooves are lifted by bending joints, not by sliding the leg up.
const LEGS = ["FL", "FR", "HL", "HR"];
const GAITS = {
  // offsets (fraction of a cycle) per leg, duty factor (stance share), upper swing (rad) front/hind, knee and hock
  // fold, fetlock flick, stride length (in body heights).
  walk: { offset: { HL: 0, FL: .25, HR: .5, FR: .75 }, duty: .64, upper: [.3, .26], fold: [1.05, .42], flick: .5, stride: .5 },
  run: { offset: { HL: 0, HR: .12, FR: .42, FL: .54 }, duty: .36, upper: [.6, .52], fold: [1.6, .7], flick: .75, stride: .8 },
};
const ease = t => t * t * (3 - 2 * t);
function legPose(p, g, front, out) {
  const A = g.upper[front ? 0 : 1], K = g.fold[front ? 0 : 1];
  if (p < g.duty) {
    const s = p / g.duty, heel = ease(Math.max(0, (s - .8) / .2));
    out[0] = A * (1 - 2 * s); out[1] = 0; out[2] = -.25 * heel;
  } else {
    const s = (p - g.duty) / (1 - g.duty), flex = Math.sin(Math.PI * Math.min(1, s * 1.12));
    out[0] = -A + 2 * A * ease(s);
    out[1] = front ? -K * flex : K * flex;
    out[2] = -g.flick * flex * (front ? 1 : .25);
  }
  return out;
}

export function createBisonRig(geometry) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox, H = box.max.y - box.min.y, L = box.max.z - box.min.z, W = box.max.x - box.min.x;
  const y0 = box.min.y, cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2, pos = geometry.attributes.position;
  // The four leg columns: centroids of everything below a fifth of the height, by side and end.
  const sums = { FL: [0, 0, 0], FR: [0, 0, 0], HL: [0, 0, 0], HR: [0, 0, 0] };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (y > y0 + H * .2) continue;
    const s = sums[(z > cz ? "F" : "H") + (x > cx ? "L" : "R")]; s[0] += x; s[1] += z; s[2]++;
  }
  const column = Object.fromEntries(LEGS.map(k => { const s = sums[k]; return [k, new THREE.Vector2(s[0] / Math.max(1, s[2]), s[1] / Math.max(1, s[2]))]; }));
  const v4 = () => ({ value: new THREE.Vector4() });
  const uniforms = {
    uUpper: v4(), uLower: v4(), uFlick: v4(), uNod: { value: 0 }, uTurn: { value: 0 }, uTail: { value: 0 }, uTailLift: { value: 0 },
    uBob: { value: 0 }, uPitch: { value: 0 }, uRest: { value: 0 }, uBreath: { value: 0 },
    // Columns (x, z) per leg, in FL FR HL HR order.
    uColX: { value: new THREE.Vector4(...LEGS.map(k => column[k].x)) }, uColZ: { value: new THREE.Vector4(...LEGS.map(k => column[k].y)) },
  };
  const C = n => n.toFixed(5);
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95 });
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
      uniform vec4 uUpper,uLower,uFlick,uColX,uColZ;uniform float uNod,uTurn,uTail,uTailLift,uBob,uPitch,uRest,uBreath;
      vec3 bend(vec3 p,vec2 pivot,float a,float w){a*=w;float dy=p.y-pivot.x,dz=p.z-pivot.y,c=cos(a),s=sin(a);return vec3(p.x,pivot.x+dz*s+dy*c,pivot.y+dz*c-dy*s);}
      float pick(vec4 v,int i){return i==0?v.x:i==1?v.y:i==2?v.z:v.w;}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
      {
        float Y0=${C(y0)},H=${C(H)},L=${C(L)},CX=${C(cx)},CZ=${C(cz)};
        vec3 p=transformed;float h=(p.y-Y0)/H;
        // Which leg: by side and end.
        bool front=p.z>CZ,left=p.x>CX;int i=front?(left?0:1):(left?2:3);
        float colX=pick(uColX,i),colZ=pick(uColZ,i);
        // How much of the leg's swing this vertex follows: all of it below the body; above, fading out through the
        // shoulder or thigh, and only near the leg's own column.
        float pivotH=front?.55:.58,reach=distance(vec2(p.x,p.z),vec2(colX,colZ))/L;
        float w=h<.3?1.:(1.-smoothstep(.3,pivotH,h))*(1.-smoothstep(.06,.13,reach));
        if(w>0.){
          float fet=Y0+H*.06,joint=Y0+H*(front?.17:.25),pivot=Y0+H*pivotH;
          float jointZ=colZ+L*(front?0.:-.058),pivotZ=colZ+L*(front?.01:.034);
          // Child joints first, in the rest pose: fetlock, then knee or hock, then the whole leg from the shoulder/hip.
          p=bend(p,vec2(fet,colZ),pick(uFlick,i),smoothstep(fet+H*.02,fet-H*.02,p.y));
          p=bend(p,vec2(joint,jointZ),pick(uLower,i),smoothstep(joint+H*.03,joint-H*.03,p.y));
          p=bend(p,vec2(pivot,pivotZ),pick(uUpper,i),w);
        }
        // Lying down: the legs fold flat under the body, which settles onto them (and a little to one side).
        if(uRest>0.){
          float J=Y0+H*.3;
          if(p.y<J){p.y=J-(J-p.y)*(1.-.82*uRest);p.x=CX+(p.x-CX)*(1.+.25*uRest);}
          p.y-=uRest*H*.245;
        }
        // Breathing: the barrel swells a touch.
        float barrel=smoothstep(.32,.5,h)*(1.-smoothstep(.75,.95,h));p.x=CX+(p.x-CX)*(1.+uBreath*barrel);
        // The body bobs and (galloping) rocks about its middle; planted hooves stay put.
        float body=smoothstep(.12,.35,h);
        p=bend(p,vec2(Y0+H*.5,CZ),uPitch,body);p.y+=uBob*H*body;
        // Head and neck: nod (and lower to graze) about the front of the hump, and turn to look about.
        float neckZ=${C(box.max.z)}-L*.28,neckY=Y0+H*.55,head=smoothstep(neckZ-L*.02,neckZ+L*.1,p.z)*step(.28,h);
        if(head>0.){
          p=bend(p,vec2(neckY,neckZ),-uNod,head);
          float t=uTurn*head,hx=p.x-CX,hz=p.z-neckZ;p.x=CX+hx*cos(t)+hz*sin(t);p.z=neckZ-hx*sin(t)+hz*cos(t);
        }
        // Tail: swishes side to side about its root (more toward the tip), and lifts when running.
        float rootZ=${C(box.min.z)}+L*.02,rootY=Y0+H*.78;
        if(p.z<rootZ&&abs(p.x-CX)<${C(W * .07)}&&h>.55){
          float k=smoothstep(rootZ,rootZ-L*.02,p.z),a=uTail*k,dx=p.x-CX,dz=p.z-rootZ;
          p.x=CX+dx*cos(a)-dz*sin(a);p.z=rootZ+dx*sin(a)+dz*cos(a);
          p=bend(p,vec2(rootY,rootZ),-uTailLift*k,1.);
        }
        transformed=p;
      }`);
  };

  const scratch = [0, 0, 0], walkPose = [0, 0, 0], runPose = [0, 0, 0];
  // Poses the rig. walk/run are blend weights (0 standing); phase is the stride cycle (in cycles).
  function pose({ phase, walk, run, nod, turn, tail, tailLift, rest, breath }) {
    for (let k = 0; k < 4; k++) {
      const leg = LEGS[k], front = leg[0] === "F";
      legPose(((phase + GAITS.walk.offset[leg]) % 1 + 1) % 1, GAITS.walk, front, walkPose);
      legPose(((phase + GAITS.run.offset[leg]) % 1 + 1) % 1, GAITS.run, front, runPose);
      for (let j = 0; j < 3; j++) scratch[j] = walkPose[j] * walk + runPose[j] * run;
      uniforms.uUpper.value.setComponent(k, scratch[0]); uniforms.uLower.value.setComponent(k, scratch[1]); uniforms.uFlick.value.setComponent(k, scratch[2]);
    }
    const c = phase * Math.PI * 2;
    // Walking: the body dips twice a stride and the head bobs with the front feet; galloping: the body rocks.
    uniforms.uBob.value = walk * .008 * Math.cos(2 * c) + run * .03 * Math.max(0, Math.sin(c - .6));
    uniforms.uPitch.value = run * .07 * Math.sin(c - 1.2);
    uniforms.uNod.value = nod + walk * .05 * Math.sin(2 * c + .8) + run * .08 * Math.sin(c);
    uniforms.uTurn.value = turn; uniforms.uTail.value = tail; uniforms.uTailLift.value = tailLift;
    uniforms.uRest.value = rest; uniforms.uBreath.value = breath;
  }
  return { material, uniforms, pose, stride: { walk: GAITS.walk.stride, run: GAITS.run.stride } };
}
