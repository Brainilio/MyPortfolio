import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { faceted } from "./island-parts";
import { paintGeometry, mergeFlat } from "./forest-parts";

// Low-poly pieces for the Skills road trip through the Southwest, seen side-on: hazy far mountains, red-rock buttes,
// saguaros, pines and scrub, a split-rail fence, and the ground bands each depth layer stands on. Each builder returns
// one merged, vertex-coloured geometry (one draw call per layer).

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

// A butte: a talus skirt of fallen rock, a sheer banded cliff, and a cap of paler sandstone just overhanging it.
export function createButte(rng, width, height) {
  const r = width / 2, d = r * .55, skirt = height * .28, cap = height * .9;
  const rings = [
    [0, r * 1.55, d * 1.5], [skirt * .5, r * 1.25, d * 1.25], [skirt, r * 1.02, d * 1.02],
    [height * .5, r * .99, d], [height * .72, r * .97, d * .98], [cap, r * .95, d * .96],
    [cap + .01, r * 1.04, d * 1.05], [height, r * 1.02, d * 1.03],
  ];
  const wall = new THREE.Color("#8B3A1A"), band = new THREE.Color("#9e4824"), talus = new THREE.Color("#a5552c"), top = new THREE.Color("#D4854A");
  return ringSolid(rng, rings, (y, tri, c) => {
    if (y > cap - .02) c.copy(top).multiplyScalar(.94 + rng() * .1);
    else if (y < skirt) c.copy(talus).multiplyScalar(.9 + rng() * .14);
    else c.copy(Math.floor(y / height * 7) % 2 ? band : wall).multiplyScalar(.92 + rng() * .1);
  }, 10);
}

// The far range: overlapping low-poly peaks, each two faces toward the viewer (lit and shaded flanks), in haze blue.
export function createRange(rng, from, to, count) {
  const tris = [], haze = new THREE.Color("#6a7a90");
  for (let i = 0; i < count; i++) {
    const x = from + (to - from) * (i + rng() * .6) / count, h = 2 + rng() * 3, w = h * (1.1 + rng() * .6), z = -rng() * 2;
    const apex = new THREE.Vector3(x + (rng() - .5) * w * .4, h, z), left = new THREE.Vector3(x - w, 0, z), right = new THREE.Vector3(x + w, 0, z), front = new THREE.Vector3(x + (rng() - .5) * w * .3, 0, z + w * .5);
    // A shoulder on one flank, so the ridgeline isn't a row of perfect triangles.
    const shoulder = new THREE.Vector3(x + (rng() < .5 ? -1 : 1) * w * .55, h * (.45 + rng() * .15), z + w * .15);
    const side = shoulder.x < x ? [[left, shoulder, front], [shoulder, apex, front], [apex, right, front]] : [[left, apex, front], [apex, shoulder, front], [shoulder, right, front]];
    tris.push(...side);
  }
  return faceted(tris, (tri, c) => c.copy(haze).multiplyScalar(tri[0].x < tri[1].x && tri[1].y > tri[0].y ? .92 : 1.06));
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

// A pine: a short trunk and three stacked cones, small on top.
export function createPine(rng, height) {
  const greens = ["#2D5A1B", "#356a20", "#3D7A25"], parts = [paintGeometry(new THREE.CylinderGeometry(height * .03, height * .045, height * .25, 5).translate(0, height * .125, 0), "#5a3a1e")];
  [[.62, .18, .42], [.44, .42, .36], [.28, .66, .3]].forEach(([w, y, h], k) =>
    parts.push(paintGeometry(new THREE.ConeGeometry(height * w * .5, height * h, 7).rotateY(rng() * 2).translate(0, height * y + height * h / 2, 0), greens[(k + Math.floor(rng() * 2)) % 3])));
  return mergeFlat(parts);
}

// Scrub: a low, wide lump of brush.
export function createScrub(rng, size) {
  return paintGeometry(new THREE.IcosahedronGeometry(size, 0).scale(1.3, .5, .9).translate(0, size * .2, 0), rng() < .5 ? "#6A7A30" : "#7a8638");
}

// The split-rail fence along the road: posts every `step`, two rails per span (at 35% and 65% of the post's height).
export function createFence(from, to, { step = 1.5, height = 1 } = {}) {
  const posts = [], rails = [];
  for (let x = from; x <= to; x += step) {
    posts.push(new THREE.BoxGeometry(.08, height, .08).translate(x, height / 2, 0));
    if (x + step <= to) for (const k of [.35, .65]) rails.push(new THREE.BoxGeometry(step, .08, .06).translate(x + step / 2, height * k, .05));
  }
  return mergeFlat([paintGeometry(mergeGeometries(posts), "#5A3A18"), paintGeometry(mergeGeometries(rails), "#6A4820")]);
}

// A ground band: flat land between two depths, gently lumpy (more so further back), coloured from `near` at the front
// to `far` at the back.
export function createGround(rng, { from, to, front, back, near, far, lump = 0, step = 2 }) {
  const cols = Math.ceil((to - from) / step), rows = Math.max(1, Math.ceil((front - back) / step)), a = new THREE.Color(near), b = new THREE.Color(far), tris = [];
  const p = [];
  for (let j = 0; j <= rows; j++) { p.push([]); for (let i = 0; i <= cols; i++) {
    const edge = j === 0 ? 0 : lump * (.4 + rng() * .6);
    p[j].push(new THREE.Vector3(from + i * step + (j && i && i < cols ? (rng() - .5) * step * .5 : 0), edge, front - (front - back) * j / rows));
  } }
  for (let j = 1; j <= rows; j++) for (let i = 1; i <= cols; i++) {
    const A = p[j - 1][i - 1], B = p[j - 1][i], C = p[j][i - 1], D = p[j][i];
    tris.push([A, B, C], [B, D, C]);
  }
  return faceted(tris, (tri, c) => { const t = (front - (tri[0].z + tri[1].z + tri[2].z) / 3) / Math.max(.01, front - back); c.copy(a).lerp(b, t).multiplyScalar(.95 + rng() * .08); });
}

export { shade };
