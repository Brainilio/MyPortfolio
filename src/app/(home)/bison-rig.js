import * as THREE from "three";

// The Work island's bison: a rig and its animation (walk, idle and grazing, alert and trot, lying down).
//
// THE MODEL (Poly by Google's "Bison", one mesh, no skeleton), measured with work/island/bison-scan.mjs:
//  - The hump peak is the highest point (100% of the height, 53% of the length from the rear): correct.
//  - FLAGGED: the hindquarters are nearly as tall as the hump (the rump reaches ~91%), so the back is close to
//    level instead of sloping down from the hump. Corrected in the rest pose: SPINE_1 dips the rump.
//  - FLAGGED: the head is carried high (the muzzle sits at ~49% of the height). Corrected in the rest pose: the
//    neck angles forward and down from the hump.
//  - The neck is thick and the front shaggy (fine). Forelegs and hindlegs are about the same length in this mesh.
//  - No separate jaw or ears, so there's no chewing or ear flicking (per the brief: not faked).
// The mesh is not altered.
//
// THE RIG: the mesh is one piece, so body parts can't be parented to pivot objects; instead each vertex is skinned
// in the vertex shader to this hierarchy of pivots (placed from the measurements, as fractions of length and height),
// applied child first, so each joint carries everything below it:
//   ROOT
//   └─ PELVIS (bob, weight-shift roll, pitch)
//      ├─ SPINE_1 (rump) ─ TAIL_BASE ─ TAIL_TIP
//      ├─ SPINE_2 (breathing) ─ HUMP (pitch) ─ NECK_BASE (pitch, yaw) ─ NECK_MID ─ HEAD
//      ├─ FRONT_LEG_L/R (shoulder) ─ FRONT_LOWER (knee) ─ FRONT_HOOF
//      └─ REAR_LEG_L/R (hip) ─ REAR_LOWER (hock) ─ REAR_HOOF
// A leg swings as a whole from its shoulder or hip inside the body (the legs are separate columns only below ~30%
// of the height), its swing fading out through the shoulder or thigh.
const LEGS = ["FL", "FR", "HL", "HR"];
const DEG = Math.PI / 180;
// Footfalls. Walk: the lateral four-beat, rear-left, front-left, rear-right, front-right, a quarter-cycle apart.
// (A hoof is down 76% of each cycle: with four legs a quarter apart, three hooves stay down only if each is down at
// least 75%, so the brief's 65% is raised to keep three on the ground.) Trot: diagonal pairs together.
const WALK = { offset: { HL: 0, FL: .25, HR: .5, FR: .75 }, duty: .76, upper: 18 * DEG, lower: 35 * DEG, cycle: 1.8 };
const TROT = { offset: { FL: 0, HR: 0, FR: .5, HL: .5 }, duty: .5, upper: 35 * DEG, lower: 55 * DEG, cycle: .7 };
// Lying (as bison do, on the belly), legs folded compactly under the body, nothing sticking out: fore legs under the
// chest, the knee just forward and the cannon tucked back flat beneath; hind legs folded tight under the haunch, the
// thigh barely forward and the hock folded right up so the cannon lies under the thigh. (upper, lower, hoof) per front
// / hind, tuned side-on against a photo of a resting bison.
const LIE = { front: [18 * DEG, -165 * DEG, -20 * DEG], hind: [12 * DEG, 150 * DEG, 10 * DEG] };
const smooth = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };

// One leg through its cycle, all on sine curves: in stance the hoof is down and the leg sweeps from forward to back
// (lingering at the ends); in swing the lower leg folds under the body and the leg reaches forward again. The hoof
// stays flat to the ground in stance (within ±8°).
function legPose(p, g, front, out) {
  if (p < g.duty) {
    const s = p / g.duty;
    out[0] = g.upper * Math.cos(Math.PI * s); out[1] = 0;
    out[2] = Math.max(-8 * DEG, Math.min(8 * DEG, -out[0]));
  } else {
    const s = (p - g.duty) / (1 - g.duty), fold = Math.sin(Math.PI * s);
    out[0] = -g.upper * Math.cos(Math.PI * s);
    // Folding under: the front hoof tucks back toward the chest, the rear hoof forward under the belly.
    out[1] = (front ? -1 : 1) * g.lower * fold; out[2] = (front ? -1 : 1) * 8 * DEG * fold;
  }
  return out;
}

export function createBisonRig(geometry) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox, H = box.max.y - box.min.y, L = box.max.z - box.min.z, W = box.max.x - box.min.x;
  const y0 = box.min.y, z0 = box.min.z, cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2, pos = geometry.attributes.position;
  // The four leg columns: centroids of everything below a fifth of the height, by side and end.
  const sums = { FL: [0, 0, 0], FR: [0, 0, 0], HL: [0, 0, 0], HR: [0, 0, 0] };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (y > y0 + H * .2) continue;
    const s = sums[(z > cz ? "F" : "H") + (x > cx ? "L" : "R")]; s[0] += x; s[1] += z; s[2]++;
  }
  const col = LEGS.map(k => [sums[k][0] / Math.max(1, sums[k][2]), sums[k][1] / Math.max(1, sums[k][2])]);
  const f = n => ({ value: n }), v4 = () => f(new THREE.Vector4());
  const uniforms = {
    uUpper: v4(), uLower: v4(), uHoof: v4(),
    uBob: f(0), uRoll: f(0), uPelvis: f(0), uSway: f(0), uRump: f(0), uBreath: f(0), uHump: f(0),
    uNeckBase: f(0), uNeckYaw: f(0), uNeckMid: f(0), uHead: f(0), uTailYaw: f(0), uTailLift: f(0), uTailTip: f(0), uRest: f(0), uWallow: f(0), uWallowLift: f(0),
    uColX: f(new THREE.Vector4(...col.map(c => c[0]))), uColZ: f(new THREE.Vector4(...col.map(c => c[1]))),
  };
  const C = n => n.toFixed(5);
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95 });
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
      uniform vec4 uUpper,uLower,uHoof,uColX,uColZ;
      uniform float uBob,uRoll,uPelvis,uSway,uRump,uBreath,uHump,uNeckBase,uNeckYaw,uNeckMid,uHead,uTailYaw,uTailLift,uTailTip,uRest,uWallow,uWallowLift;
      // Pitch about a pivot (y, z): positive raises what's in front of it.
      vec3 pitch(vec3 p,vec2 o,float a){float dy=p.y-o.x,dz=p.z-o.y,c=cos(a),s=sin(a);return vec3(p.x,o.x+dz*s+dy*c,o.y+dz*c-dy*s);}
      // Yaw about a vertical axis through (x, z).
      vec3 yaw(vec3 p,vec2 o,float a){float dx=p.x-o.x,dz=p.z-o.y,c=cos(a),s=sin(a);return vec3(o.x+dx*c+dz*s,p.y,o.y-dx*s+dz*c);}
      // Roll about a lengthwise axis through (x, y).
      vec3 roll(vec3 p,vec2 o,float a){float dx=p.x-o.x,dy=p.y-o.y,c=cos(a),s=sin(a);return vec3(o.x+dx*c-dy*s,o.y+dx*s+dy*c,p.z);}
      float pick(vec4 v,int i){return i==0?v.x:i==1?v.y:i==2?v.z:v.w;}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
      {
        float Y0=${C(y0)},Z0=${C(z0)},H=${C(H)},L=${C(L)},CX=${C(cx)},CZ=${C(cz)};
        vec3 p=transformed;float h=(p.y-Y0)/H,zf=(p.z-Z0)/L;
        // How much of the body (not the planted lower legs) a vertex is.
        float body=smoothstep(.12,.36,h);

        // LEGS: hoof, then knee or hock, then the whole leg from its shoulder or hip.
        bool front=p.z>CZ,left=p.x>CX;int i=front?(left?0:1):(left?2:3);
        float colX=pick(uColX,i),colZ=pick(uColZ,i),pivotH=front?.55:.58,reach=distance(vec2(p.x,p.z),vec2(colX,colZ))/L;
        float w=h<.3?1.:(1.-smoothstep(.3,pivotH,h))*(1.-smoothstep(.06,.13,reach));
        if(w>0.){
          float hoof=Y0+H*.06,joint=Y0+H*(front?.17:.25),hip=Y0+H*pivotH;
          p=pitch(p,vec2(hoof,colZ),pick(uHoof,i)*smoothstep(hoof+H*.02,hoof-H*.02,p.y));
          p=pitch(p,vec2(joint,colZ+L*(front?0.:-.058)),pick(uLower,i)*smoothstep(joint+H*.03,joint-H*.03,p.y));
          p=pitch(p,vec2(hip,colZ+L*(front?.01:.034)),pick(uUpper,i)*w);
        }
        // Lying down, the legs are folded at their joints (by the animation); the hind legs also lie out a little
        // to the sides, under the hips.
        if(uRest>0.&&!front&&h<.4)p.x=CX+(p.x-CX)*(1.+.22*uRest*(1.-smoothstep(.2,.4,h)));

        // TAIL (a short stub high at the rear): the tip lags, the base swings side to side and lifts.
        float rootZ=Z0+L*.02,rootY=Y0+H*.78;
        if(p.z<rootZ&&abs(p.x-CX)<${C(W * .07)}&&h>.55){
          float k=smoothstep(rootZ,rootZ-L*.02,p.z);
          p=yaw(p,vec2(CX,rootZ-L*.008),uTailTip*smoothstep(rootZ-L*.008,rootZ-L*.02,p.z));
          p=yaw(p,vec2(CX,rootZ),uTailYaw*k);
          p=pitch(p,vec2(rootY,rootZ),-uTailLift*k);
        }

        // HEAD and NECK (head, then neck mid, then neck base with its turn), angled forward and down from the hump.
        float up=smoothstep(.28,.4,h);
        p=pitch(p,vec2(Y0+H*.58,Z0+L*.88),-uHead*smoothstep(.86,.93,zf)*up);
        p=pitch(p,vec2(Y0+H*.62,Z0+L*.8),-uNeckMid*smoothstep(.77,.86,zf)*up);
        float neck=smoothstep(.66,.78,zf)*up;
        p=pitch(p,vec2(Y0+H*.72,Z0+L*.7),-uNeckBase*neck);
        p=yaw(p,vec2(CX,Z0+L*.7),uNeckYaw*neck);

        // HUMP: the front half pitches about the hump (it bounces at a trot, leans forward when bracing).
        p=pitch(p,vec2(Y0+H*.55,Z0+L*.53),-uHump*smoothstep(.45,.62,zf)*up);
        // SPINE_1: the rump dips, so the back slopes down from the hump.
        p=pitch(p,vec2(Y0+H*.6,Z0+L*.32),uRump*(1.-smoothstep(.2,.36,zf))*up);
        // SPINE_2: breathing, the barrel and hump rise and fall a touch.
        float barrel=smoothstep(.3,.45,h)*smoothstep(.25,.4,zf)*(1.-smoothstep(.75,.9,zf));p.y=Y0+H*.45+(p.y-Y0-H*.45)*(1.+uBreath*barrel);

        // PELVIS: sway of the front about the middle, pitch about the hips, weight-shift roll, bob; all body only.
        p=yaw(p,vec2(CX,Z0+L*.45),uSway*smoothstep(.45,.9,zf)*body);
        p=pitch(p,vec2(Y0+H*.58,Z0+L*.16),uPelvis*body);
        p=roll(p,vec2(CX,Y0+H*.1),uRoll*body);
        // Lying: the whole animal settles until its belly is on the ground (nothing sinks below it).
        p.y+=uBob*H*body-uRest*H*.3;
        p.y=mix(p.y,max(p.y,Y0+H*.004),uRest);
        // Wallowing: it rolls onto its side about its middle, lifted or lowered so it keeps touching the ground.
        if(uWallow!=0.){p=roll(p,vec2(CX,Y0+H*.33),uWallow);p.y+=uWallowLift*H;}
        transformed=p;
      }`);
  };
  return { material, uniforms, size: { height: H, length: L } };
}

// The animation for one bison. Each frame the scene says what it's doing (standing, walking or trotting, eating,
// lying down, alarmed); this turns that into joint angles on sine curves, with timers randomised per bison.
export function createBisonAnimator(rig, { calf = false, seed = Math.random } = {}) {
  const r = seed, u = rig.uniforms, legA = [0, 0, 0], legB = [0, 0, 0];
  const s = {
    phase: r(), walk: 0, trot: 0, rest: 0, time: r() * 10,
    speedFactor: 1 + (r() - .5) * .16, // walk speed ±8%
    // Graze dip: every 4-7 s (calf 3-5), +28° (calf 18°): 1.2 s down, a hold, 1.8 s back up.
    dip: 0, dipStage: "wait", dipT: 2 + r() * 4, dipHold: 1,
    // Weight shift: every 6-10 s (calf 3-6), the pelvis rolls ±4° (calf ±6°) over 2 s and one front hoof lifts.
    shift: 0, shiftFrom: 0, shiftTo: 0, shiftT: 1 + r() * 6, shiftRun: 0,
    tailFlick: 0, flickT: 1 + r() * 6, look: 0, lookGoal: 0, lookT: 2 + r() * 4,
    alert: 0, brace: 0, alertAt: -1, tailTip: 0, tipT: r() * 4, wallow: 0, wallowT: 0, roll: 0, dust: 0, lie: { front: [...LIE.front], hind: [...LIE.hind] }, tailSeed: r() * 6.3,
  };
  const walkCycle = (calf ? 1.4 : WALK.cycle) / s.speedFactor;

  // Ground speed that keeps the hooves planted: in stance a hoof sweeps 2·sin(swing)·leg length, and the body covers
  // that much once (walk) or twice (trot, diagonal pairs taking turns) per cycle. legHeight is in scene units.
  function speed(gait, legHeight) {
    return gait === "trot" ? 2 * 2 * Math.sin(TROT.upper) * legHeight / TROT.cycle : 2 * Math.sin(WALK.upper) * legHeight / walkCycle;
  }

  // inputs: { moving, gait: "walk" | "trot", eating, resting, alarmed, wallow }
  function update(dt, inputs) {
    s.time += dt;
    const t = s.time, moving = inputs.moving, still = !moving && !inputs.resting;
    s.walk += ((moving && inputs.gait !== "trot" ? 1 : 0) - s.walk) * (1 - Math.exp(-dt * 5));
    s.trot += ((moving && inputs.gait === "trot" ? 1 : 0) - s.trot) * (1 - Math.exp(-dt * 6));
    s.rest += ((inputs.resting ? 1 : 0) - s.rest) * (1 - Math.exp(-dt * 1.4));
    const going = s.walk + s.trot;
    s.phase += dt * (s.walk / walkCycle + s.trot / TROT.cycle);

    // Alert: the head snaps up, the tail rises (0-0.4 s); then the weight goes back onto the hindquarters (0.4-0.8 s).
    if (inputs.alarmed && s.alertAt < 0) s.alertAt = t;
    if (!inputs.alarmed) s.alertAt = -1;
    const since = s.alertAt < 0 ? -1 : t - s.alertAt;
    s.alert += ((since >= 0 ? 1 : 0) - s.alert) * (1 - Math.exp(-dt * (since >= 0 ? 12 : 2)));
    s.brace += ((since >= .4 && !moving ? 1 : 0) - s.brace) * (1 - Math.exp(-dt * 6));
    const calm = 1 - s.alert;

    // Graze dip (idle only, not while eating at the basket or the water, which holds the head down).
    const dipDepth = (calf ? 18 : 28) * DEG;
    if (still && !inputs.eating && s.alert < .1) {
      s.dipT -= dt;
      if (s.dipStage === "wait" && s.dipT <= 0) { s.dipStage = "down"; s.dipT = 1.2; }
      else if (s.dipStage === "down") { s.dip = 1 - Math.cos(Math.PI / 2 * (1 - Math.max(0, s.dipT) / 1.2)); if (s.dipT <= 0) { s.dipStage = "hold"; s.dipT = .8 + r() * .7; s.dip = 1; } }
      else if (s.dipStage === "hold" && s.dipT <= 0) { s.dipStage = "up"; s.dipT = 1.8; }
      else if (s.dipStage === "up") { s.dip = Math.cos(Math.PI / 2 * (1 - Math.max(0, s.dipT) / 1.8)); if (s.dipT <= 0) { s.dipStage = "wait"; s.dip = 0; s.dipT = (calf ? 3 : 4) + r() * (calf ? 2 : 3); } }
    } else { s.dip *= Math.exp(-dt * 2); if (s.dipStage !== "wait") { s.dipStage = "wait"; s.dipT = 2 + r() * 3; } }
    const eat = inputs.eating ? 1 : 0;

    // Weight shift (idle).
    s.shiftT -= dt;
    if (still && s.shiftT <= 0) { s.shiftFrom = s.shift; s.shiftTo = (r() < .5 ? -1 : 1) * (calf ? 6 : 4) * DEG; s.shiftRun = 0; s.shiftT = (calf ? 3 : 6) + r() * (calf ? 3 : 4); }
    if (s.shiftRun < 1) s.shiftRun = Math.min(1, s.shiftRun + dt / 2);
    s.shift = (s.shiftFrom + (s.shiftTo - s.shiftFrom) * smooth(s.shiftRun)) * (still ? 1 : Math.exp(-dt * 3));
    if (!still) s.shiftTo = s.shift;

    // Tail: drift (±12° walking at half the stride rate, ±8° standing) plus flicks at flies (to 35° and back in 0.3 s).
    s.flickT -= dt; if (s.flickT <= 0) { s.tailFlick = 0; s.flickT = 3 + r() * 5; }
    s.tailFlick = Math.min(1, s.tailFlick + dt / .3);
    const flick = s.tailFlick < 1 ? Math.sin(Math.PI * s.tailFlick) * 35 * DEG * (s.flickT % 2 > 1 ? 1 : -1) : 0;
    // (Its own clock at half the stride rate, not the footfalls, with its own random start.)
    const drift = Math.sin(t * Math.PI / walkCycle + s.tailSeed), tailDrift = (8 + 4 * s.walk) * DEG * drift;
    s.tipT -= dt; if (s.tipT <= 0) { s.tipT = 2 + r() * 5; s.tailTip = (r() - .5) * .6; }

    // Looking about: standing or lying, the head turns now and then (slowly, 15-25° lying down).
    s.lookT -= dt;
    if (s.lookT <= 0) { s.lookT = 2.5 + r() * 4; s.lookGoal = (still || inputs.resting) && s.dip < .2 && r() < .7 ? (r() < .5 ? -1 : 1) * (15 + r() * 10) * DEG : 0; }
    s.look += (s.lookGoal * calm * (1 - going) - s.look) * (1 - Math.exp(-dt * 1.5));

    // Wallowing (once it's down): it rolls over onto its side and back, three times, legs kicking, raising dust,
    // then rights itself.
    const rolling = inputs.wallow && s.rest > .85;
    s.wallow += ((rolling ? 1 : 0) - s.wallow) * (1 - Math.exp(-dt * 3));
    if (rolling) s.wallowT += dt; else s.wallowT = 0;
    const before = s.roll;
    s.roll = s.wallow * 1.35 * (.5 - .5 * Math.cos(Math.PI * 2 * s.wallowT / 1.6)) * (s.side ??= r() < .5 ? -1 : 1);
    s.dust = s.wallow * Math.min(1, Math.abs(s.roll - before) / Math.max(dt, 1e-3) / 2.5);
    // Legs: walk and trot poses blended by how much it's doing each (standing: straight), plus the idle weight shift
    // lifting one front hoof, and the brace (front hooves stepping in place).
    for (let k = 0; k < 4; k++) {
      const leg = LEGS[k], front = leg[0] === "F";
      legPose(((s.phase + WALK.offset[leg]) % 1 + 1) % 1, WALK, front, legA);
      legPose(((s.phase + TROT.offset[leg]) % 1 + 1) % 1, TROT, front, legB);
      let lower = legA[1] * s.walk + legB[1] * s.trot;
      if (front && still) {
        // Weight shift: the hoof on the side it shifts away from lifts a little (+6°).
        if ((leg === "FL") === (s.shift < 0)) lower -= Math.abs(s.shift) / (calf ? 6 : 4) * 6 * DEG;
        // Bracing: the fronts step in place.
        lower -= s.brace * Math.max(0, Math.sin(t * 9 + (leg === "FL" ? 0 : Math.PI))) * 20 * DEG;
      }
      // Lying: blend to the folded pose; wallowing on its side, the legs kick in the air.
      const lie = s.lie[front ? "front" : "hind"], kick = s.wallow * Math.min(1, Math.abs(s.roll) / .9);
      let upper = (legA[0] * s.walk + legB[0] * s.trot) * (1 - s.rest) + lie[0] * s.rest;
      lower = lower * (1 - s.rest) + lie[1] * s.rest;
      upper += kick * .6 * Math.sin(t * 7 + k * 1.7) - kick * lie[0] * .7; lower -= kick * lie[1] * .55 * (.6 + .4 * Math.sin(t * 6 + k));
      u.uUpper.value.setComponent(k, upper);
      u.uLower.value.setComponent(k, lower);
      u.uHoof.value.setComponent(k, (legA[2] * s.walk + legB[2] * s.trot) * (1 - s.rest) + lie[2] * s.rest);
    }

    const c = s.phase * Math.PI * 2;
    // Body: bob twice a stride (±2.5% walking, ±5% trotting), sway ±1.5° once a stride a quarter-cycle off the bob,
    // the hump bouncing at a trot; breathing ±1.2% every 3.5 s.
    u.uBob.value = s.walk * .025 * Math.sin(2 * c) + s.trot * .05 * Math.sin(2 * c);
    u.uSway.value = s.walk * 1.5 * DEG * Math.cos(c);
    u.uHump.value = s.trot * 3 * DEG * Math.sin(2 * c - .6) + s.brace * 6 * DEG;
    u.uBreath.value = .012 * Math.sin(t * Math.PI * 2 / 3.5);
    u.uRoll.value = s.shift + s.rest * 5 * DEG * (s.side ?? 1);
    u.uPelvis.value = s.brace * 8 * DEG;
    // Rest pose: the rump dips (the back slopes down from the hump) and the neck angles forward and down.
    u.uRump.value = 4 * DEG;
    // Neck and head: carried low; a ±4° nod walking (±8° trotting); down to graze; down at the basket or water; up and
    // forward when alarmed; low and level lying down.
    const nod = s.walk * 4 * DEG * Math.sin(c) + s.trot * 8 * DEG * Math.sin(2 * c);
    u.uNeckBase.value = 10 * DEG * calm - 4 * DEG * s.alert + s.rest * 4 * DEG;
    u.uNeckMid.value = (dipDepth * .6 * s.dip + 18 * DEG * eat) * calm - 10 * DEG * s.alert + s.rest * 8 * DEG;
    u.uHead.value = (dipDepth * .4 * s.dip + 12 * DEG * eat + nod) * calm - 20 * DEG * s.alert + eat * Math.sin(t * 5.2) * 3 * DEG * calm;
    u.uNeckYaw.value = s.look;
    u.uTailYaw.value = (tailDrift + flick) * calm;
    u.uTailLift.value = 25 * DEG * Math.max(s.alert, s.trot);
    u.uTailTip.value += ((s.tailTip + flick * .4) - u.uTailTip.value) * (1 - Math.exp(-dt * 4));
    u.uRest.value = s.rest;
    const a = Math.abs(s.roll);
    u.uWallow.value = s.roll; u.uWallowLift.value = a > 0 ? .33 * Math.cos(a) + .22 * Math.sin(a) - .33 : 0;
  }
  return { update, speed, state: s, uniforms: u };
}
