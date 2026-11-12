import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { faceted, random } from "./island-parts";
import { paintGeometry, mergeFlat } from "./forest-parts";

// Low-poly pieces for the Skills road trip through the Southwest, seen side-on: rugged ridgelines, Monument Valley
// buttes, Joshua trees, junipers, cottonwoods, saguaros, prickly pear and scrub, a split-rail fence (broken here and
// there), an abandoned cabin, a cowboy hat, tumbleweeds, a pond, soft-focus foreground plants, and the rolling ground
// each depth layer stands on. Most builders return one merged, vertex-coloured geometry (one draw call per layer).

const shade = (hex, k) => new THREE.Color(hex).multiplyScalar(k);

// A rock in rings: closed oval rings of shared points (each jittered once, so the facets stay closed) stacked up and
// joined into a faceted solid with a flat top. rings: [[y, radius across, radius deep], ...] bottom to top.
function ringSolid(rng, rings, colorAt, segments = 9) {
  const pts = rings.map(([y, rx, rz], k) => Array.from({ length: segments }, (_, s) => {
    const a = s / segments * Math.PI * 2 + (k % 2) * .18, j = .9 + rng() * .2;
    return new THREE.Vector3(Math.cos(a) * rx * j, y + (k && k < rings.length - 1 ? (rng() - .5) * .08 : 0), Math.sin(a) * rz * j);
  }));
  const tris = [];
  for (let k = 1; k < pts.length; k++) for (let s = 0; s < segments; s++) {
    const a = pts[k - 1][s], b = pts[k - 1][(s + 1) % segments], c = pts[k][s], d = pts[k][(s + 1) % segments];
    tris.push([a, c, b], [b, c, d]);
  }
  const top = pts.at(-1), mid = new THREE.Vector3(0, rings.at(-1)[0], 0);
  for (let s = 0; s < segments; s++) tris.push([mid, top[(s + 1) % segments], top[s]]);
  return faceted(tris, (tri, c) => colorAt((tri[0].y + tri[1].y + tri[2].y) / 3, tri, c));
}

// A Monument Valley butte: a wide talus slope of fallen rock, and on it a cluster of sheer columns of different heights
// and widths (a broad block, a slimmer tower, sometimes a needle), each with a broken, uneven top rather than a flat
// lid, banded in deep red. One merged, faceted solid. width and height are the whole formation's.
export function createMonument(rng, width, height) {
  const parts = [], r = width / 2, base = height * (.24 + rng() * .1);
  const talusColor = new THREE.Color("#b25a2e"), wall = new THREE.Color("#8B3A1A"), band = new THREE.Color("#a24a26"), crown = new THREE.Color("#c06a38");
  // The talus: a low, lumpy mound wider than the rock above it.
  parts.push(ringSolid(rng, [[0, r * 1.5, r * .8], [base * .45, r * 1.12, r * .62], [base, r * .82, r * .48], [base * 1.04, r * .5, r * .3]],
    (y, tri, c) => c.copy(talusColor).multiplyScalar(.82 + y / base * .2 + rng() * .1), 11));
  // The columns, left to right across the talus.
  const count = 1 + Math.floor(rng() * 3), spots = [];
  for (let k = 0; k < count; k++) spots.push(count === 1 ? 0 : -r * .55 + r * 1.1 * k / (count - 1) + (rng() - .5) * r * .2);
  spots.forEach((x, k) => {
    const main = k === Math.floor(count / 2), h = height * (main ? .9 + rng() * .1 : .45 + rng() * .4);
    const w = (main ? r * .5 : r * .2 + rng() * r * .16) * (count === 1 ? 1.4 : 1), d = w * (.55 + rng() * .3);
    const rings = [[base * .7, w * 1.15, d * 1.15]];
    for (let j = 1; j <= 4; j++) { const t = j / 4; rings.push([base + (h - base) * t, w * (1 - t * .12 + (rng() - .5) * .14), d * (1 - t * .12 + (rng() - .5) * .14)]); }
    const solid = ringSolid(rng, rings, (y, tri, c) => {
      const t = (y - base) / Math.max(.01, h - base);
      c.copy(t > .93 ? crown : Math.floor(t * 6 + k) % 2 ? band : wall).multiplyScalar(.86 + rng() * .14);
    }, 6);
    // A broken top: lift some of the top ring's corners and drop others, so the crown is jagged and tilted.
    const pos = solid.attributes.position, jag = h * .1, lift = Array.from({ length: 7 }, () => (rng() - .4) * jag);
    for (let i = 0; i < pos.count; i++) if (Math.abs(pos.getY(i) - h) < 1e-4) {
      const x0 = pos.getX(i), z0 = pos.getZ(i), centre = Math.abs(x0) < 1e-6 && Math.abs(z0) < 1e-6;
      pos.setY(i, h + (centre ? lift[6] : lift[Math.round((Math.atan2(z0, x0) + Math.PI) / (Math.PI * 2) * 6) % 6]));
    }
    solid.translate(x, 0, (rng() - .5) * r * .2); parts.push(solid);
  });
  return mergeFlat(parts);
}

// A rugged ridgeline from `from` to `to`: a jagged crest (midpoint displacement, so big peaks carry smaller teeth), a
// row of shoulders part way down, and the foot, triangulated into facets that face every which way.
export function createRidge(rng, from, to, { height = 4, rough = .55, depth = 4, color = "#6a7a90", steps = 6 } = {}) {
  let crest = [height * (.4 + rng() * .4), height * (.4 + rng() * .4)];
  for (let s = 0, amp = height * .7; s < steps; s++, amp *= rough) {
    const next = [];
    for (let i = 0; i < crest.length - 1; i++) next.push(crest[i], Math.max(height * .12, (crest[i] + crest[i + 1]) / 2 + (rng() - .5) * amp * 2));
    next.push(crest.at(-1)); crest = next;
  }
  const n = crest.length, dx = (to - from) / (n - 1), tris = [], tone = new THREE.Color(color);
  const R = crest.map((y, i) => new THREE.Vector3(from + i * dx + (i && i < n - 1 ? (rng() - .5) * dx * .4 : 0), y, 0));
  const M = R.map(p => new THREE.Vector3(p.x + (rng() - .5) * dx * .8, p.y * (.35 + rng() * .25), depth * (.4 + rng() * .2)));
  const B = R.map(p => new THREE.Vector3(p.x, 0, depth));
  for (let i = 0; i < n - 1; i++) tris.push([R[i], M[i], R[i + 1]], [R[i + 1], M[i], M[i + 1]], [M[i], B[i], M[i + 1]], [M[i + 1], B[i], B[i + 1]]);
  return faceted(tris, (tri, c) => c.copy(tone).multiplyScalar(.88 + rng() * .18));
}

// A saguaro: a ribbed trunk with two arms, each out a little then up, at different heights.
export function createSaguaro(rng, height) {
  const g = "#3A5A18", r = height * .07, parts = [];
  const limb = (x, y, h, rad) => parts.push(paintGeometry(new THREE.CylinderGeometry(rad, rad * 1.05, h, 7).translate(x, y + h / 2, 0), g),
    paintGeometry(new THREE.SphereGeometry(rad, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2).translate(x, y + h, 0), g));
  limb(0, 0, height, r);
  [[-1, .38 + rng() * .1], [1, .52 + rng() * .12]].forEach(([side, at]) => {
    const y = height * at, out = r * 2.6, rad = r * .78;
    parts.push(paintGeometry(new THREE.CylinderGeometry(rad, rad, out, 6).rotateZ(Math.PI / 2).translate(side * out / 2, y, 0), g));
    limb(side * out, y, height * (.22 + rng() * .12), rad);
  });
  return mergeFlat(parts);
}

// A Joshua tree: a shaggy trunk that forks two or three times, each branch ending in a spiky ball of leaves.
export function createJoshua(rng, height) {
  const parts = [], bark = "#6b5a3e", leaves = ["#6f8a3a", "#7d9740", "#5f7a32"];
  const branch = (from, dir, len, rad, depth) => {
    const to = from.clone().addScaledVector(dir, len), mid = from.clone().lerp(to, .5);
    const g = new THREE.CylinderGeometry(rad * .8, rad, len, 5);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)).translate(mid.x, mid.y, mid.z);
    parts.push(paintGeometry(g, bark));
    if (depth <= 0) {
      const tuft = new THREE.ConeGeometry(rad * 3.2, rad * 4.5, 6).translate(0, rad * 1.6, 0);
      tuft.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)).translate(to.x, to.y, to.z);
      parts.push(paintGeometry(tuft, leaves[Math.floor(rng() * 3)]));
      parts.push(paintGeometry(new THREE.ConeGeometry(rad * 2.6, rad * 2.4, 6).rotateX(Math.PI).translate(to.x, to.y - rad * .2, to.z), "#4f5a2c"));
      return;
    }
    const forks = 2 + (rng() < .3 ? 1 : 0);
    for (let k = 0; k < forks; k++) {
      const a = (k / forks) * Math.PI * 2 + rng(), spread = .55 + rng() * .35;
      const d = new THREE.Vector3(Math.cos(a) * spread, 1, Math.sin(a) * spread * .6).normalize();
      branch(to, d, len * (.55 + rng() * .2), rad * .72, depth - 1);
    }
  };
  branch(new THREE.Vector3(), new THREE.Vector3(0, 1, 0), height * .45, height * .055, rng() < .5 ? 1 : 2);
  return mergeFlat(parts);
}

// A juniper: a short, twisted trunk under a lopsided crown of dusty sage-green lumps.
export function createJuniper(rng, size) {
  const parts = [paintGeometry(new THREE.CylinderGeometry(size * .06, size * .1, size * .5, 5).rotateZ((rng() - .5) * .4).translate(0, size * .25, 0), "#5a4430")];
  const greens = ["#4f6b3a", "#5d7a42", "#46603a"];
  for (let k = 0; k < 4 + Math.floor(rng() * 3); k++) {
    const r = size * (.22 + rng() * .18);
    parts.push(paintGeometry(new THREE.DodecahedronGeometry(r, 0).scale(1.2, .85, 1).translate((rng() - .5) * size * .6, size * (.5 + rng() * .4), (rng() - .5) * size * .4), greens[k % 3]));
  }
  return mergeFlat(parts);
}

// A cottonwood, the tree that grows where there's water: a pale trunk and a broad, bright crown.
export function createCottonwood(rng, height) {
  const parts = [paintGeometry(new THREE.CylinderGeometry(height * .05, height * .08, height * .5, 6).translate(0, height * .25, 0), "#8a7a62")];
  const greens = ["#8db24a", "#7aa23f", "#9cbf55"];
  for (let k = 0; k < 6; k++) {
    const r = height * (.2 + rng() * .1), a = k / 6 * Math.PI * 2;
    parts.push(paintGeometry(new THREE.IcosahedronGeometry(r, 0).translate(Math.cos(a) * height * .2, height * (.62 + rng() * .2), Math.sin(a) * height * .14), greens[k % 3]));
  }
  parts.push(paintGeometry(new THREE.IcosahedronGeometry(height * .26, 0).translate(0, height * .85, 0), greens[0]));
  return mergeFlat(parts);
}

// A prickly pear: a few flat paddles stacked at angles.
export function createPricklyPear(rng, size) {
  const parts = [], g = "#5d8a3a";
  const pad = (x, y, z, ry, rz, s) => parts.push(paintGeometry(new THREE.SphereGeometry(s, 6, 4).scale(1, 1.25, .28).rotateZ(rz).rotateY(ry).translate(x, y, z), rng() < .5 ? g : "#6a9a42"));
  pad(0, size * .45, 0, rng(), 0, size * .45);
  for (let k = 0; k < 3; k++) pad((k - 1) * size * .45, size * (.95 + rng() * .2), (rng() - .5) * size * .2, rng() * 2, (k - 1) * .5, size * .32);
  return mergeFlat(parts);
}

// Scrub: a low, wide lump of brush.
export function createScrub(rng, size) {
  return paintGeometry(new THREE.IcosahedronGeometry(size, 0).scale(1.3, .5, .9).translate(0, size * .2, 0), rng() < .5 ? "#6A7A30" : "#7a8638");
}

// The split-rail fence: posts every `step`, two rails per span. A run can end tidily or `broken` at either end
// ("start", "end" or both): there the last posts lean, a rail is missing and another hangs down to the ground.
export function createFence(from, to, { step = 1.5, height = 1, broken = [], seed = 1 } = {}) {
  const rng = random(seed), posts = [], rails = [], spans = Math.round((to - from) / step);
  const lean = i => (broken.includes("start") && i === 0 ? -.35 : 0) + (broken.includes("end") && i === spans ? .4 : 0) + (rng() - .5) * .08;
  for (let i = 0; i <= spans; i++) {
    const x = from + i * step, l = lean(i), h = height * (l ? .8 : 1);
    posts.push(new THREE.BoxGeometry(.08, h, .08).translate(0, h / 2, 0).rotateZ(-l).translate(x, 0, 0));
  }
  for (let i = 0; i < spans; i++) {
    const x = from + i * step, endSpan = broken.includes("end") && i === spans - 1, startSpan = broken.includes("start") && i === 0;
    for (const k of [.35, .65]) {
      if ((endSpan || startSpan) && k === .65) continue; // the top rail's gone
      if (endSpan || startSpan) {
        // The lower rail has come loose at the broken end and hangs to the ground.
        const len = Math.hypot(step, height * k), ang = Math.atan2(height * k, step) * (startSpan ? 1 : -1);
        rails.push(new THREE.BoxGeometry(len, .08, .06).rotateZ(ang).translate(x + step / 2, height * k / 2, .05));
        continue;
      }
      rails.push(new THREE.BoxGeometry(step, .08, .06).rotateZ((rng() - .5) * .04).translate(x + step / 2, height * k + (rng() - .5) * .04, .05));
    }
  }
  // A fallen rail in the grass by a broken end.
  if (broken.length) rails.push(new THREE.BoxGeometry(step * .9, .07, .06).rotateY(.5).translate(broken.includes("end") ? to + .6 : from - .6, .04, .4));
  return mergeFlat([paintGeometry(mergeGeometries(posts), "#5A3A18"), paintGeometry(mergeGeometries(rails), "#6A4820")]);
}

// A ground band between two depths, shaped by heightAt(x, z) (rolling rises and dips, with a little random lumpiness
// on top) and coloured from `near` at the front to `far` at the back. The front edge stays at 0 so it meets the band
// in front of it.
export function createGround(rng, { from, to, front, back, near, far, lump = 0, step = 2, heightAt = () => 0 }) {
  const cols = Math.ceil((to - from) / step), rows = Math.max(1, Math.ceil((front - back) / step)), a = new THREE.Color(near), b = new THREE.Color(far), tris = [];
  const p = [];
  for (let j = 0; j <= rows; j++) { p.push([]); for (let i = 0; i <= cols; i++) {
    const x = from + i * step + (j && i && i < cols ? (rng() - .5) * step * .5 : 0), z = front - (front - back) * j / rows;
    p[j].push(new THREE.Vector3(x, j === 0 ? 0 : heightAt(x, z) + lump * rng(), z));
  } }
  for (let j = 1; j <= rows; j++) for (let i = 1; i <= cols; i++) {
    const A = p[j - 1][i - 1], B = p[j - 1][i], C = p[j][i - 1], D = p[j][i];
    tris.push([A, B, C], [B, D, C]);
  }
  return faceted(tris, (tri, c) => { const t = (front - (tri[0].z + tri[1].z + tri[2].z) / 3) / Math.max(.01, front - back); c.copy(a).lerp(b, t).multiplyScalar(.93 + rng() * .1); });
}

// Rolling ground: a few overlapping swells (no two stretches alike), scaled by `amount`.
export const rolling = (amount, seed = 0) => (x, z) => amount * Math.max(0,
  .55 + .35 * Math.sin(x * .21 + seed) + .25 * Math.sin(x * .53 + z * .4 + seed * 2) + .2 * Math.sin(x * 1.1 - z * .7 + seed * 3) - .25);

// An abandoned homestead cabin: weathered plank walls, a sagging roof with a panel missing, a door hanging open,
// dark windows, a porch on two posts and a crooked stone chimney.
export function createCabin(rng) {
  const wood = "#6b4a2e", dark = "#4a3220", roof = "#5a4636", parts = [];
  const W = 2.4, D = 1.8, H = 1.25;
  // Walls in courses of planks, each a slightly different tone.
  for (let k = 0; k < 6; k++) {
    const y = k * H / 6, tone = new THREE.Color(wood).multiplyScalar(.85 + rng() * .25).getStyle();
    parts.push(paintGeometry(new THREE.BoxGeometry(W, H / 6 * .94, D).translate((rng() - .5) * .02, y + H / 12, 0), tone));
  }
  // Gables.
  const gable = new THREE.Shape([new THREE.Vector2(-D / 2, 0), new THREE.Vector2(D / 2, 0), new THREE.Vector2(0, .7)]);
  for (const x of [-W / 2, W / 2]) parts.push(paintGeometry(new THREE.ExtrudeGeometry(gable, { depth: .06, bevelEnabled: false }).rotateY(Math.PI / 2).translate(x - .03, H, 0), dark));
  // The roof: two slopes, the front one sagging in the middle and missing a panel.
  const slope = Math.hypot(D / 2 + .15, .7), ang = Math.atan2(.7, D / 2 + .15);
  for (const side of [-1, 1]) for (let k = 0; k < 4; k++) {
    if (side === 1 && k === 2) continue;
    const g = new THREE.BoxGeometry((W + .3) / 4 * .98, .06, slope).rotateX(side * ang).translate(-W / 2 - .15 + (W + .3) / 8 * (2 * k + 1), H + .35 - (side === 1 && (k === 1 || k === 3) ? .06 : 0), side * (D / 4 + .04));
    parts.push(paintGeometry(g, new THREE.Color(roof).multiplyScalar(.85 + rng() * .3).getStyle()));
  }
  // Door ajar, windows dark, a porch and its posts, a chimney.
  parts.push(paintGeometry(new THREE.BoxGeometry(.5, .95, .04).translate(.25, .475, 0).rotateY(-.9).translate(-.35, 0, D / 2 + .02), "#3e2a1a"));
  parts.push(paintGeometry(new THREE.BoxGeometry(.5, .95, .02).translate(-.35 + .25, .475, D / 2 + .005), "#140c06"));
  for (const x of [.55, -W / 2 + .4]) parts.push(paintGeometry(new THREE.BoxGeometry(.4, .34, .02).translate(x, .72, D / 2 + .006), "#1c140c"));
  parts.push(paintGeometry(new THREE.BoxGeometry(W + .2, .06, .7).translate(0, .06, D / 2 + .35), dark));
  for (const x of [-W / 2, W / 2 - .1]) parts.push(paintGeometry(new THREE.BoxGeometry(.07, H, .07).rotateZ(x < 0 ? .05 : -.08).translate(x, H / 2, D / 2 + .65), dark));
  parts.push(paintGeometry(new THREE.BoxGeometry(W + .2, .05, .75).rotateX(-.25).translate(0, H + .02, D / 2 + .38), roof));
  parts.push(paintGeometry(new THREE.BoxGeometry(.32, 2.1, .32).rotateZ(.05).translate(W / 2 + .1, 1.05, -.3), "#8a7f74"));
  return mergeFlat(parts);
}

// A cowboy hat: a crown with a dent in it and a brim curled up at the sides, with a band.
export function createHat() {
  const brim = new THREE.CylinderGeometry(.42, .42, .03, 14, 1), pos = brim.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), r = Math.hypot(x, z); if (r > .2) pos.setY(i, pos.getY(i) + Math.pow(Math.abs(x) / .42, 2) * .12 - z * z * .1); }
  brim.scale(1, 1, .85);
  const crown = new THREE.CylinderGeometry(.18, .22, .26, 10).translate(0, .14, 0), cp = crown.attributes.position;
  for (let i = 0; i < cp.count; i++) if (cp.getY(i) > .2 && Math.abs(cp.getX(i)) < .05) cp.setY(i, cp.getY(i) - .05);
  crown.scale(1, 1, .8);
  const band = new THREE.CylinderGeometry(.205, .215, .05, 10).scale(1, 1, .8).translate(0, .05, 0);
  return mergeFlat([paintGeometry(brim, "#b07a44"), paintGeometry(crown, "#9e6a38"), paintGeometry(band, "#3a2214")]);
}

// A tumbleweed: a loose, airy ball of dry twigs (crossed thin boxes in a sphere).
export function createTumbleweed(rng, radius) {
  const twigs = [];
  for (let k = 0; k < 26; k++) {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rng() * 6, rng() * 6, rng() * 6));
    twigs.push(new THREE.BoxGeometry(radius * (1.4 + rng() * .6), .025, .025).applyQuaternion(q).translate((rng() - .5) * radius * .4, (rng() - .5) * radius * .4, (rng() - .5) * radius * .4));
  }
  const core = new THREE.IcosahedronGeometry(radius * .7, 0);
  return mergeFlat([paintGeometry(mergeGeometries(twigs), "#b08a52"), paintGeometry(core, "#9a7848")]);
}

// A pond: a soft, irregular pool with a darker muddy rim and reeds, as a flat disk the sky can glint on.
export function createPond(rng, rx, rz) {
  const n = 14, shape = new THREE.Shape(), rim = new THREE.Shape();
  const at = (k, grow) => { const a = k / n * Math.PI * 2, j = .85 + ((k * 7) % 5) * .06; return [Math.cos(a) * rx * j * grow, Math.sin(a) * rz * j * grow]; };
  for (let k = 0; k <= n; k++) { const [x, z] = at(k % n, 1), [X, Z] = at(k % n, 1.18); k ? (shape.lineTo(x, z), rim.lineTo(X, Z)) : (shape.moveTo(x, z), rim.moveTo(X, Z)); }
  const water = new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2).translate(0, .03, 0);
  const mud = paintGeometry(new THREE.ShapeGeometry(rim).rotateX(-Math.PI / 2).translate(0, .015, 0), "#8a6a3e");
  const reeds = [];
  for (let k = 0; k < 16; k++) { const [x, z] = at(Math.floor(rng() * n), 1.05 + rng() * .1), h = .3 + rng() * .35; reeds.push(new THREE.ConeGeometry(.03, h, 3).translate(x, h / 2, z)); }
  return { water, banks: mergeFlat([mud, paintGeometry(mergeGeometries(reeds), "#6a7a34")]) };
}

// A soft-focus foreground plant: a silhouette painted on a canvas and blurred, for a sprite right in front of the lens,
// like a camera focused on the road beyond it. kind: "saguaro", "agave" or "grass".
export function blurredPlant(kind, { blur = 14, color = "#3f5226", rim = "#c9a35a" } = {}) {
  const W = 256, H = 512, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d"); g.filter = `blur(${blur}px)`;
  const draw = fill => {
    g.fillStyle = fill; g.strokeStyle = fill; g.lineCap = "round";
    if (kind === "saguaro") {
      g.lineWidth = 64; g.beginPath(); g.moveTo(128, H + 20); g.lineTo(128, 90); g.stroke();
      g.lineWidth = 44; g.beginPath(); g.moveTo(128, 300); g.lineTo(54, 300); g.lineTo(54, 190); g.stroke();
      g.beginPath(); g.moveTo(128, 250); g.lineTo(204, 250); g.lineTo(204, 150); g.stroke();
    } else if (kind === "agave") {
      for (let k = -5; k <= 5; k++) { g.beginPath(); g.moveTo(128, H); g.quadraticCurveTo(128 + k * 14, H - 160, 128 + k * 22, H - 260 + Math.abs(k) * 22); g.lineTo(128 + k * 22 + 10, H - 250 + Math.abs(k) * 22); g.closePath(); g.lineWidth = 18; g.stroke(); }
    } else {
      for (let k = 0; k < 18; k++) { const x = 30 + k * 11; g.lineWidth = 8; g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + (k % 3 - 1) * 20, H - 120, x + (k % 5 - 2) * 30, H - 200 - (k * 37) % 120); g.stroke(); }
    }
  };
  // A warm edge of light (the sun behind it), then the dark body over it.
  g.save(); g.translate(6, -4); draw(rim); g.restore(); draw(color);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export { shade };
