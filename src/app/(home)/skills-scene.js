"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getStage } from "./stage";
import { eagleHandoff } from "./eagle-handoff";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { random, createCloud } from "./island-parts";
import { createSign } from "./park-parts";
import { loadWagon } from "./wagon";
import { createBisonRig, createBisonAnimator } from "./bison-rig";
import { createMonument, createRidge, createSaguaro, createJoshua, createJuniper, createCottonwood, createPricklyPear, createScrub, createFence, createGround, rolling, createCabin, createHat, createTumbleweed, createPond, blurredPlant } from "./desert-parts";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { mergeFlat } from "./forest-parts";

// Skills as a road trip through the Southwest, seen side-on like a diorama cross-section. The camera never moves along
// the road: the world slides past it in depth layers (far mountains, red-rock buttes, pines and saguaros, then the
// fence, the bison behind it, the road, the park signs and the wagon), the far ones slower, so it parallaxes. Each
// scroll stop drives the wagon up to the next sign. Arriving from Work, the camera starts up in the sky with the
// eagle and the clouds and pulls back and down to the road; the eagle stays overhead. No real-time shadows; it draws
// at full rate while driving and 30 fps otherwise, only while the section is on screen.

// How far the world slides per stop, and where the wagon sits on screen (it stays put; the road moves under it).
const STEP = 12, WAGON_X = -.6, SIGN_AHEAD = 2.4;
// The layers behind the road: each slides at this fraction of the road's speed. (Everything standing on the near
// ground, the fence, the bison, the road, the signs and the wagon, moves with it, so nothing slides along the ground.)
const SPEED = { far: .08, rocks: .18, plants: .35, near: 1, front: 2.2 };
const smooth = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
const glow = (stops, size = 128) => {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const g = c.getContext("2d"), r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([k, col]) => r.addColorStop(k, col)); g.fillStyle = r; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

export default function SkillsScene({ state, skills, onCar, slot = 3, onReady }) {
  const ready = useRef(onReady); ready.current = onReady;
  const host = useRef(null), carClick = useRef(onCar); carClick.current = onCar;
  useEffect(() => {
    const mount = host.current;
    let disposed = false, visible = true;
    // Drawn on the page's one shared canvas (stage.js), into this stage's rectangle; the stage is the hit area.
    const shared = getStage(); if (!shared) { ready.current?.(); return; }
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const scene = new THREE.Scene(); scene.fog = new THREE.Fog("#efc49a", 40, 160);
    const camera = new THREE.PerspectiveCamera(30, 1, .5, 220);
    const rng = random(53), textures = [];
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95, metalness: 0, side: THREE.DoubleSide });

    // Golden hour: the sun low on the right, warm sky light from above and a warm bounce off the red earth.
    scene.add(new THREE.HemisphereLight("#d8e5ff", "#946246", .85));
    const sunLight = new THREE.DirectionalLight("#ffdbab", 2.5); sunLight.position.set(8, 10, 5); scene.add(sunLight);
    // Cool open-sky fill separates cactus and wagon facets from the warm earth.
    const skyFill = new THREE.DirectionalLight("#bed8ff", .4); skyFill.position.set(-12, 6, -8); scene.add(skyFill);

    // The layers, each a group slid left as you drive.
    const layers = Object.fromEntries(Object.keys(SPEED).map(k => { const g = new THREE.Group(); scene.add(g); return [k, g]; }));
    const add = (layer, geometry, mat = material) => { const m = new THREE.Mesh(geometry, mat); layers[layer].add(m); return m; };

    // Far: two rugged ranges, the back one in blue haze, on a rolling plain.
    add("far", createGround(rng, { from: -70, to: 90, front: -20, back: -80, near: "#c58d5e", far: "#b59486", lump: .4, step: 6, heightAt: rolling(2.2, 1) }));
    add("far", createRidge(rng, -60, 70, { height: 12, depth: 8, color: "#7a88a6", rough: .6, steps: 6 }).translate(0, 0, -52));
    add("far", createRidge(rng, -50, 60, { height: 6.5, depth: 6, color: "#a8705a", rough: .62, steps: 6 }).translate(0, 0, -38));
    // Rocks: Monument Valley buttes (no two alike) on a low red ridge, with a band of dust haze along their feet.
    const rocksAt = rolling(1, 2);
    add("rocks", createGround(rng, { from: -45, to: 60, front: -12, back: -20, near: "#cf9150", far: "#c58d5e", lump: .2, step: 2.5, heightAt: rocksAt }));
    add("rocks", createRidge(rng, -40, 55, { height: 2.6, depth: 3, color: "#a95a34", rough: .65, steps: 5 }).translate(0, 0, -24));
    add("rocks", mergeGeometries([[-13, 5.2, 4.2], [-3.5, 3, 5.4], [7.5, 6.4, 3.6], [15.5, 1.6, 4.4], [22.5, 5, 4.8], [31, 3.6, 3.2]].map(([x, w, h], i) =>
      createMonument(random(300 + i * 7), w, h).translate(x, rocksAt(x, -16.5) - .25, -16 - rng()))));
    {
      // Dense at the ground, thinning upward.
      const c = document.createElement("canvas"); c.width = 4; c.height = 64; const g = c.getContext("2d"), grad = g.createLinearGradient(0, 64, 0, 0);
      grad.addColorStop(0, "rgba(216,160,96,.6)"); grad.addColorStop(1, "rgba(216,160,96,0)"); g.fillStyle = grad; g.fillRect(0, 0, 4, 64);
      const haze = new THREE.CanvasTexture(c); haze.colorSpace = THREE.SRGBColorSpace; textures.push(haze);
      const band = new THREE.Mesh(new THREE.PlaneGeometry(120, 2.6), new THREE.MeshBasicMaterial({ map: haze, transparent: true, depthWrite: false, fog: false }));
      band.position.set(10, 1.2, -12.6); layers.rocks.add(band);
    }
    // Plants: Joshua trees, junipers and saguaros scattered unevenly (clumps and open stretches), prickly pear and scrub.
    const plantsAt = rolling(.6, 3);
    add("plants", createGround(rng, { from: -30, to: 50, front: -7, back: -12, near: "#d39a52", far: "#cf9150", lump: .1, step: 2, heightAt: plantsAt }));
    {
      const parts = [], put = (g, x, z) => parts.push(g.translate(x, plantsAt(x, z) - .08, z));
      for (const [x, h] of [[-11, 2.6], [-9.6, 1.8], [1.5, 2.2], [12.8, 2.9], [13.9, 2], [25, 2.4]]) put(createJoshua(rng, h).rotateY(rng() * 6), x, -9 - rng() * 2);
      for (const x of [-6.5, -5.4, 4.8, 9, 19.5, 20.6, 28]) put(createJuniper(rng, .9 + rng() * .7).rotateY(rng() * 6), x, -8 - rng() * 2.6);
      for (const x of [-2.5, 7, 17, 23.5]) put(createSaguaro(rng, 1.3 + rng() * 1.4).rotateY(rng() * 6), x, -8.5 - rng() * 2);
      for (let i = 0; i < 14; i++) { const x = -14 + i * 3.2 + rng() * 2; put(createScrub(rng, .2 + rng() * .25), x, -7.6 - rng() * 3.6); }
      add("plants", mergeFlat(parts));
    }
    // Near: the ground from the camera back past the fence (flat along the road, rolling in front of it and behind the
    // herd), the road and its dashes, the fence (in runs, some ending broken), and what stands by the road.
    const POND = { x: 7.4, z: -5.6, rx: 2.5, rz: 1.3 };
    const nearAt = (x, z) => {
      const behind = smooth((-3.7 - z) / 2.5), front = smooth((z - 1.8) / 4), pond = smooth(Math.hypot((x - POND.x) / (POND.rx * 1.25), (z - POND.z) / (POND.rz * 1.6)) - 1);
      return rolling(.7, 4)(x, z) * behind * pond + rolling(.3, 5)(x, z) * front;
    };
    add("near", createGround(rng, { from: -20, to: 90, front: 26, back: -8, near: "#d6a050", far: "#C8903A", step: 1.6, heightAt: nearAt }));
    {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(110, 1.8).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#3A2E1E", roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      road.position.set(35, .02, 0); layers.near.add(road);
      const dashes = []; for (let x = -18; x < 88; x += 2) dashes.push(new THREE.BoxGeometry(.4, .02, .06).translate(x, .03, 0));
      layers.near.add(new THREE.Mesh(mergeGeometries(dashes), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: .4 })));
    }
    add("near", mergeFlat([
      createFence(-15, 3, { broken: ["end"], seed: 3 }), createFence(7.5, 22.5, { broken: ["start"], seed: 4 }),
      createFence(30, 40.5, { broken: ["start", "end"], seed: 5 }), createFence(46.5, 64.5, { broken: ["start"], seed: 6 }),
    ]).translate(0, 0, -2.4));
    {
      const parts = [], put = (g, x, z, sink = .06) => parts.push(g.translate(x, nearAt(x, z) - sink, z));
      // The pond the herd drinks at, cottonwoods by it.
      const pond = createPond(rng, POND.rx, POND.rz); parts.push(pond.banks.translate(POND.x, 0, POND.z));
      const water = new THREE.Mesh(pond.water.translate(POND.x, 0, POND.z), new THREE.MeshStandardMaterial({ color: "#3f93c4", roughness: .12, metalness: .15, emissive: "#2a6e9e", emissiveIntensity: .35 }));
      layers.near.add(water);
      put(createCottonwood(rng, 2.6), 5.2, -7.5); put(createCottonwood(rng, 2.1), 10.2, -7.7); put(createJuniper(rng, .8), 9, -7.9);
      // The abandoned homestead, alone in the field.
      put(createCabin(random(77)).rotateY(.28), 42, -5.9, .1);
      // By the road: a Joshua tree, saguaros, prickly pear, scrub, unevenly spaced.
      put(createJoshua(rng, 2.4), -4.6, -4.4); put(createSaguaro(rng, 1.9), 1.6, -5); put(createSaguaro(rng, 1.3), 44, -4.5); put(createJoshua(rng, 1.9), 52.5, -5.6);
      for (const [x, z] of [[-3, 1.9], [9.6, 2.5], [27.8, 1.6], [33, 2.8], [47.2, 2]]) put(createPricklyPear(rng, .3 + rng() * .15).rotateY(rng() * 6), x, z);
      for (let i = 0; i < 22; i++) { const x = -12 + i * 3.1 + rng() * 2.4, z = rng() < .5 ? 1.6 + rng() * 3 : -3 - rng() * 1.5; put(createScrub(rng, .18 + rng() * .2), x, z); }
      add("near", mergeFlat(parts));
    }
    // Front: soft-focus plants right in front of the lens, like a camera focused on the road beyond them; they sweep
    // past faster than anything else, at the edge of the frame at some stops and none at others.
    const front = [["saguaro", -2.6, 2.2, 4.6], ["saguaro", 39, 2, 4.2], ["agave", 55.4, 2.6, 2.6], ["grass", 82, 3.2, 1.9], ["agave", 103.4, 2.4, 2.4]].map(([kind, x, w, h], i) => {
      const map = blurredPlant(kind, { blur: 12 + (i % 2) * 4 }); textures.push(map);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, fog: false, opacity: .94 }));
      m.position.set(x, h / 2 - .1, 11.6); m.renderOrder = 10; layers.front.add(m); return m;
    });

    // The sky: the sun low on the right (it doesn't parallax), clouds drifting slowly at a few depths.
    const sunTexture = glow([[0, "rgba(255,246,214,1)"], [.14, "rgba(255,240,160,1)"], [.2, "rgba(255,214,140,.7)"], [.45, "rgba(255,180,110,.22)"], [1, "rgba(255,160,100,0)"]]); textures.push(sunTexture);
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTexture, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
    sun.scale.setScalar(14); sun.position.set(13, 9, -60); scene.add(sun);
    const clouds = [[-14, 9, -30, .9], [-2, 11.5, -36, 1.1], [9, 8.5, -26, .8], [20, 12, -40, 1.2], [-24, 12.5, -42, 1], [30, 9.5, -34, .9], [4, 14, -30, .8]].map(([x, y, z, k], i) => {
      const cloud = createCloud(120 + i); cloud.material.color.set("#fff1e6"); cloud.material.emissive.set("#b4604a"); cloud.material.emissiveIntensity = .22; cloud.material.fog = false;
      cloud.scale.setScalar(k); cloud.userData = { x, y, z }; scene.add(cloud); return cloud;
    });

    // The bald eagle (Robert Mirabelle, CC BY 3.0), the same bird as over the Work section, circling high over the
    // road; its wings beat in the vertex shader, bending more toward the tips.
    const handoffPoint = new THREE.Vector3(), handoffView = new THREE.Vector3(), handoffRotation = new THREE.Quaternion();
    const handoff = { top: 0, x: 0, y: 0, depth: 1, fov: 30, rotation: handoffRotation };
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder), flap = { value: 0 }, flight = new THREE.Group(); scene.add(flight);
    loader.load("/models/island/eagle-flying.glb", gltf => {
      if (disposed) return;
      const model = gltf.scene;
      model.traverse(o => {
        if (!o.isMesh) return;
        const m = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
        m.onBeforeCompile = shader => {
          shader.uniforms.uFlap = flap;
          shader.vertexShader = "uniform float uFlap;\n" + shader.vertexShader.replace("#include <begin_vertex>",
            "#include <begin_vertex>\nfloat span=abs(transformed.x),bend=max(0.,span-.1);transformed.y+=sin(uFlap-span*1.3)*pow(bend,1.3)*.38;");
        };
        o.material = m; o.frustumCulled = false;
      });
      const box = new THREE.Box3().setFromObject(model), dims = box.getSize(new THREE.Vector3()), k = 1.6 / Math.max(dims.x, dims.y, dims.z), c = box.getCenter(new THREE.Vector3());
      model.scale.multiplyScalar(k); model.position.sub(c.multiplyScalar(k)); model.rotation.y = Math.PI; flight.add(model);
    }, undefined, () => {});

    // The park signs, one per skill group, on the far verge just ahead of where the wagon pulls up; a warm glow behind
    // the one you're at.
    const haloTexture = glow([[0, "rgba(255,208,128,.9)"], [.4, "rgba(255,208,128,.35)"], [1, "rgba(255,208,128,0)"]]); textures.push(haloTexture);
    const signs = skills.map((skill, i) => {
      const sign = createSign(skill, i), holder = new THREE.Group();
      sign.scale.setScalar(.4); sign.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = false; });
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture, transparent: true, depthWrite: false, opacity: 0, fog: false }));
      halo.position.set(0, .94, -.25); halo.scale.set(3, 2, 1);
      holder.add(halo, sign); holder.position.set(i * STEP + WAGON_X + SIGN_AHEAD, 0, -1.4);
      // Turned a little toward the wagon as it comes up the road, so the boards read with some depth.
      holder.rotation.y = -.34;
      // A cowboy hat left hanging on one sign's post.
      if (i === 2) { const hat = new THREE.Mesh(createHat(), material); hat.scale.setScalar(.85); hat.position.set(.74, 1.4, .04); hat.rotation.set(.3, .3, -.55); holder.add(hat); }
      layers.near.add(holder); textures.push(sign.userData.texture);
      return { holder, sign, halo, on: 0 };
    });

    // Bison behind the fence (Poly by Google, CC BY 3.0, rigged in bison-rig.js), grazing on their own clocks; one
    // looks up as the wagon rattles past, then goes back to grazing.
    const herd = [];
    loader.load("/models/island/bison.glb", gltf => {
      if (disposed) return;
      const box = new THREE.Box3().setFromObject(gltf.scene), size = box.getSize(new THREE.Vector3());
      // Not everywhere: three at the pond (two drinking), one lying down a way off, then a lone bull much further on.
      [[5.4, -3.4, 1, "graze"], [7, -4.5, 1, "drink"], [9.3, -4.4, -1, "drink"], [11.2, -6.6, -1, "rest"], [51, -3.4, -1, "graze"]].forEach(([x, z, face, mood], i) => {
        const model = i ? gltf.scene.clone() : gltf.scene, root = new THREE.Group(); let rig = null;
        model.traverse(o => { if (!o.isMesh) return; rig ??= createBisonRig(o.geometry); o.material = rig.material; o.frustumCulled = false; });
        const h = 1.12 + (i % 3) * .06; model.scale.setScalar(h / size.y); model.position.y = -box.min.y * h / size.y; root.add(model);
        // Side-on, turned a little toward the road so you see a bit of the face.
        root.position.set(x, 0, z); root.rotation.y = face * (Math.PI / 2 - .3); layers.near.add(root);
        herd.push({ root, mood, anim: createBisonAnimator(rig, { seed: random(70 + i * 5), resting: mood === "rest" }), alarmUntil: -1 });
      });
      needsRender = true;
    }, undefined, () => {});

    // A horse (Quaternius, CC0) loose by the gap in the fence, grazing, now and then lifting its head to look about.
    let horseMixer = null, horseClips = null, horseClock = 6;
    loader.load("/models/island/horse.glb", gltf => {
      if (disposed) return;
      const model = gltf.scene; model.updateMatrixWorld(true);
      model.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.material.color?.multiplyScalar(1.7); o.material.flatShading = true; o.material.needsUpdate = true; } });
      const box = new THREE.Box3().setFromObject(model), k = 1.55 / Math.max(.001, box.max.y - box.min.y);
      model.scale.multiplyScalar(k); model.position.y = -box.min.y * k;
      const root = new THREE.Group(); root.add(model); root.position.set(28.6, 0, -3.7); root.rotation.y = -Math.PI / 2 + .35; layers.near.add(root);
      horseMixer = new THREE.AnimationMixer(model);
      horseClips = Object.fromEntries(gltf.animations.map(c => [c.name, horseMixer.clipAction(c)]));
      horseClips.Eating?.play(); needsRender = true;
    }, undefined, () => {});

    // Tumbleweeds: now and then one rolls across in the wind, bouncing, from the left to the right.
    const weeds = [0, 1].map(i => {
      const r = .26 + i * .08, m = new THREE.Mesh(createTumbleweed(random(90 + i), r), material);
      m.visible = false; m.userData = { r, wait: 2 + i * 7, x: 0, z: 0, v: 0, hop: 0 }; layers.near.add(m); return m;
    });

    // The wagon on the near lane, facing the way it drives, with a blob shadow and a little dust off the back wheels.
    const car = new THREE.Group(), body = new THREE.Group(); car.add(body); car.rotation.y = Math.PI / 2; car.position.z = .38; layers.near.add(car);
    let carReady = false; const LENGTH = 2;
    const wheelSpin = loadWagon(loader, { length: LENGTH }, holder => { if (disposed) return; body.add(holder); carReady = true; needsRender = true; });
    const shadowTexture = glow([[0, "rgba(60,30,10,.4)"], [1, "rgba(60,30,10,0)"]], 64); textures.push(shadowTexture);
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(2.1, .9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }));
    blob.position.set(0, .03, .38); layers.near.add(blob);
    const dustMaterial = new THREE.MeshBasicMaterial({ color: "#e6c79a", transparent: true, depthWrite: false }), dustGeometry = new THREE.IcosahedronGeometry(.07, 0);
    const dust = Array.from({ length: 10 }, () => { const m = new THREE.Mesh(dustGeometry, dustMaterial.clone()); m.visible = false; m.userData = { age: 9 }; layers.near.add(m); return m; });
    let dustClock = 0, nextDust = 0;

    // Clicking the wagon drives on to the next sign.
    const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const overCar = event => {
      if (!carReady) return false;
      const r = mount.getBoundingClientRect(); ndc.set((event.clientX - r.left) / r.width * 2 - 1, -(event.clientY - r.top) / r.height * 2 + 1);
      raycaster.setFromCamera(ndc, camera); return raycaster.intersectObject(car, true).length > 0;
    };
    const onMove = event => { mount.style.cursor = overCar(event) ? "pointer" : ""; };
    const onClick = event => { if (overCar(event)) carClick.current?.(); };
    mount.addEventListener("pointermove", onMove); mount.addEventListener("click", onClick);

    // Framing: side-on, the road in the lower third. Tall screens stand further back with a wider lens.
    let tall = false;
    const restPos = new THREE.Vector3(), restAim = new THREE.Vector3(), skyPos = new THREE.Vector3(), skyAim = new THREE.Vector3(), aim = new THREE.Vector3();
    let restFov = 30, skyFov = 24;
    function frame() {
      const w = mount.clientWidth, h = mount.clientHeight; if (!w || !h) return;
      camera.aspect = w / h; tall = camera.aspect < .85;
      if (tall) camera.setViewOffset(w, h, 0, h * .29, w, h);
      else camera.clearViewOffset();
      if (tall) { restPos.set(.4, 2.6, 30); restAim.set(.4, 1.9, 0); restFov = 36; skyPos.set(.4, 9, 26); skyAim.set(.4, 9.6, 0); skyFov = 30; }
      else { restPos.set(0, 2.3, 18); restAim.set(0, 2.5, 0); restFov = 30; skyPos.set(0, 8, 15); skyAim.set(0, 9.2, 0); skyFov = 24; }
      needsRender = true;
    }
    const resize = new ResizeObserver(frame); resize.observe(mount);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }); observer.observe(mount);

    // Driving: the world eases (slowly, cinematically) to where the scroll says; the wagon's wheels turn with it.
    let drive = 0, time = 0, since = 0, needsRender = true, snap = true, wasLive = false, speed = 0, arrive = 1, leave = 0;
    const fade = { side: "bottom", from: 1 };
    function tick(dt) {
      const reduced = preference.matches, step = reduced ? 0 : dt; time += step;
      const goal = state.current.progress[slot] * (skills.length - 1) * STEP;
      if (snap || reduced) { snap = false; drive = goal; }
      const before = drive; drive += (goal - drive) * (1 - Math.exp(-dt * 3.7));
      if (Math.abs(goal - drive) < .002) drive = goal;
      speed = dt > 0 ? (drive - before) / dt : 0;
      for (const [k, g] of Object.entries(layers)) g.position.x = -drive * SPEED[k];
      const wagonX = drive + WAGON_X;
      car.position.x = wagonX; blob.position.x = wagonX;
      // Road judder while rolling, and a slow sway at rest.
      body.position.y = reduced ? 0 : Math.sin(time * Math.PI * 2 / 2.5) * .03 * Math.min(1, .3 + Math.abs(speed)) + Math.sin(time * 41) * .006 * Math.min(1, Math.abs(speed));
      wheelSpin.value -= (drive - before) / (LENGTH * .13);

      // Dust off the back wheels while it rolls: puffs left on the road, drifting up and fading.
      dustClock += step;
      if (Math.abs(speed) > .4 && dustClock > nextDust) {
        nextDust = dustClock + .09; const puff = dust.find(d => d.userData.age > .9);
        if (puff) { puff.userData = { age: 0, rise: .3 + rng() * .3, s: .6 + rng() * .7 }; puff.position.set(wagonX - LENGTH * .42, .12, .38 + (rng() - .5) * .3); puff.visible = true; }
      }
      for (const puff of dust) {
        const u = puff.userData; if (u.age > .9) { puff.visible = false; continue; }
        u.age += step; const t = u.age / .9; puff.position.y += u.rise * step; puff.scale.setScalar(u.s * (1 + t * 1.6)); puff.material.opacity = .55 * (1 - t);
      }

      // The sign you're at glows and breathes.
      signs.forEach((s, i) => {
        const near = smooth(1 - Math.abs(drive - i * STEP) / 4);
        s.on += (near - s.on) * (1 - Math.exp(-dt * 4));
        const pulse = reduced ? 0 : (1 - Math.cos(time * Math.PI * 2 / 1.5)) / 2;
        s.holder.scale.setScalar(1 + .04 * pulse * s.on); s.halo.material.opacity = .75 * s.on;
      });

      // Bison graze; the one the wagon is passing looks up for a moment.
      for (const b of herd) {
        if (Math.abs(b.root.position.x - wagonX) < 4 && Math.abs(speed) > .5) b.alarmUntil = time + 2.2;
        b.anim.update(step, { moving: false, gait: "walk", eating: b.mood === "drink", resting: b.mood === "rest", alarmed: b.mood !== "rest" && time < b.alarmUntil });
      }

      // The horse grazes, every so often lifting its head for a look round.
      if (horseMixer) {
        horseClock -= step;
        if (horseClock < 0 && horseClips.Idle_Headlow && horseClips.Eating) {
          const eating = horseClips.Eating.isRunning(), next = eating ? horseClips.Idle_Headlow : horseClips.Eating;
          next.reset().play(); (eating ? horseClips.Eating : horseClips.Idle_Headlow).crossFadeTo(next, .8, false);
          horseClock = eating ? 3.3 : 8 + rng() * 6;
        }
        horseMixer.update(step);
      }

      // Tumbleweeds roll through on the wind (they keep their own pace whether you drive or not).
      for (const w of weeds) {
        const u = w.userData;
        if (!w.visible) { u.wait -= step; if (u.wait > 0 || reduced) continue; w.visible = true; u.x = -13 - layers.near.position.x; u.z = rng() < .5 ? -1.6 + rng() * .6 : 1.4 + rng() * 1.6; u.v = 1.4 + rng() * .9; u.hop = rng() * 6; }
        u.x += u.v * step; u.hop += step * (2.4 + u.v);
        w.position.set(u.x, u.r + Math.abs(Math.sin(u.hop)) * .32 + nearAt(u.x, u.z), u.z); w.rotation.z -= u.v * step / u.r; w.rotation.x += step * .7;
        if (u.x + layers.near.position.x > 14) { w.visible = false; u.wait = 6 + rng() * 10; }
      }

      // Clouds drift, a touch of parallax as you drive.
      clouds.forEach((c, i) => { const u = c.userData; c.position.set(u.x + time * .12 * (1 + i % 3 * .3) - drive * .04, u.y + Math.sin(time * .2 + i) * .15, u.z); });

      // Read this frame's scroll position before positioning the arriving bird.
      const box = mount.getBoundingClientRect(), top = box.top / Math.max(1, window.innerHeight);
      arrive = reduced ? 0 : smooth(top * 1.15);
      // The eagle: a slow wide circle high over the road, banked into the turn.
      if (!reduced) flap.value += dt * 5.5;
      // (Top centre, in the open sky between the heading and the stop's words, so it never crosses the text.)
      const a = time * .22, cx = tall ? .8 : -1.4;
      // Keep the desert orbit intact. Work carries its bird directly to this projected pose.
      flight.visible = reduced || top <= 0;
      if (top > 0 && eagleHandoff.flap !== null) flap.value = eagleHandoff.flap;
      flight.position.set(cx + Math.cos(a) * (tall ? 2.2 : 1), (tall ? 6.2 : 5.9) + Math.sin(time * .9) * .2, -6 + Math.sin(a) * 2);
      flight.rotation.set(0, -a + Math.PI, -.35, "YXZ");

      // Arriving, the camera starts up in the sky with the eagle and the clouds, then pulls back and settles on the
      // road as the section comes up the screen.
      // Leaving for the coast: the camera lifts back toward the sky and the land fades out from the bottom up into the
      // sky behind, so the coast rises into open sky rather than meeting a hard edge of desert.
      leave = smooth(1 - box.bottom / Math.max(1, window.innerHeight));
      const lift = Math.max(arrive, reduced ? 0 : leave * .55);
      camera.position.lerpVectors(restPos, skyPos, lift); aim.lerpVectors(restAim, skyAim, lift); camera.lookAt(aim);
      fade.from = 1 - .8 * smooth(leave * 1.6);
      const fov = restFov + (skyFov - restFov) * lift; if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
      camera.updateMatrixWorld();
      handoffPoint.copy(flight.position).project(camera);
      handoffView.copy(flight.position).applyMatrix4(camera.matrixWorldInverse);
      handoff.top = box.top;
      handoff.x = handoffPoint.x;
      handoff.y = 1 - 2 * (box.top + (1 - handoffPoint.y) * box.height / 2) / window.innerHeight;
      handoff.depth = -handoffView.z;
      handoff.fov = camera.fov;
      handoffRotation.copy(camera.quaternion).invert().multiply(flight.quaternion);
      eagleHandoff.target = handoff;
      needsRender = false;
      return Math.abs(goal - drive) > .002 || (arrive > 0 && arrive < 1) || (leave > 0 && leave < 1) || dust.some(d => d.visible) || weeds.some(w => w.visible);
    }

    // Full rate while driving or arriving, 30 fps when it's just the bison and the eagle.
    let busy = true;
    function draw(dt) {
      dt = Math.min(dt, .05); since += dt;
      const live = visible && !document.hidden && state.current.live.includes(slot);
      // Back on screen after a while away: start where the scroll is, rather than driving there.
      if (live && !wasLive) snap = Math.abs(state.current.progress[slot] * (skills.length - 1) * STEP - drive) > STEP;
      wasLive = live;
      if (!live) return false;
      const goal = state.current.progress[slot] * (skills.length - 1) * STEP;
      if (preference.matches && !needsRender && !snap && drive === goal) return false;
      if (!busy && since < 1 / 30 - .002) return false;
      busy = tick(Math.min(since, .1)); since = 0; return true;
    }
    frame(); tick(0); mount.dataset.ready = "true";
    // (Drawn past its top edge, for the eagle and the clouds coming in from the sky, but not past its bottom, where the coast comes up.)
    const unregister = shared.register({ mount, scene, camera, draw, exposure: 1.05, fade, overscan: { top: .5, bottom: 0 } });
    const readyTimer = setTimeout(() => ready.current?.(), 0);
    if (new URLSearchParams(window.location.search).has("debug")) window.__skills = { camera, car, layers, scene, herd, signs, THREE };

    return () => {
      if (eagleHandoff.target === handoff) eagleHandoff.target = null;
      clearTimeout(readyTimer); delete window.__skills; disposed = true; unregister(); resize.disconnect(); observer.disconnect();
      mount.removeEventListener("pointermove", onMove); mount.removeEventListener("click", onClick);
      scene.traverse(o => { o.geometry?.dispose(); for (const m of [o.material].flat()) if (m) { m.map?.dispose(); m.dispose(); } });
      textures.forEach(t => t.dispose());
    };
  }, [state, skills, slot]);
  return <div className="ht-canvas" ref={host} aria-hidden="true" />;
}
