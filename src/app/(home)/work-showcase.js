"use client";
import { eagleHandoff } from "./eagle-handoff";
import ProjectThumbnail from "../project/project-thumbnail";
import TechChip, { Icon, Roll } from "../tech-chip";
import WorkCards from "./work-cards";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { createCloud } from "./island-parts";
import { getImageRatio, fitWidth } from "../../lib/image-ratio";

// The Work section: one pinned screen, the scroll picking the project (in step with the section pill's counter). The
// project's name runs huge across the middle, lit by a sun that rises behind it as you scroll; three of its pictures
// hang round it as thin sheets, bent and warping (more the faster you scroll), sheened by that sun; a bald eagle flies
// a slow circle, behind the name and in front of it, faster (and beating its wings faster) the faster you scroll.
// Behind, the page's own sky turns to sunrise as you go, with low-poly clouds drifting across it and the last of the
// About section's stars fading.
// Two canvases of its own (the page's shared one sits above the words' layer, and the eagle has to pass in front of the
// name while the clouds stay behind it): drawn only while on screen and the tab is visible; reduced motion stops the
// flight and the drift. Phones get the sky and a plain list.

// The three sheets: where they hang (fraction of the screen), how wide (fraction of the screen's width, before their
// own shape adjusts it), which of the project's pictures, their turn and tilt, and depth.
// Four layouts to compare (?work=1|2|3|4, with a switcher top-right of the section; 1 by default):
// 1: three of the project's landscape screenshots hanging round the name (no phone screens, no thumbnail);
// 2: the thumbnail loop alone, as one wide curved screen low behind the name;
// 3: the thumbnail loop alone, as one tilted card floating to the right of the name;
// 4: no big name or sheets: all three projects side by side as cards, the one the scroll is on lifted;
// 5–8 (work-cards.js): one big card at a time, a deck, a numbered index with a card, a 3D cover flow. Just the name,
// what I did and the tech on each.
const LAYOUTS = {
  1: [
    { fx: .64, fy: .21, w: .17, pick: 0, ry: -.32, rz: .05, z: -1.6 },
    { fx: .85, fy: .63, w: .15, pick: 1, ry: -.5, rz: -.07, z: -1.1 },
    { fx: .19, fy: .72, w: .16, pick: 2, ry: .45, rz: .04, z: -1.3 },
  ],
  2: [{ fx: .5, fy: .6, w: .3, pick: "thumb", ry: 0, rz: 0, z: -3.2, bend: .3 }],
  3: [{ fx: .74, fy: .46, w: .23, pick: "thumb", ry: -.42, rz: .035, z: -1.2 }],
  4: [], 5: [], 6: [], 7: [], 8: [],
};
const LAYOUT_NAMES = [["1", "Sheets"], ["2", "Curved screen"], ["3", "Tilted card"], ["4", "Side by side"], ["5", "Big card"], ["6", "Deck"], ["7", "Index"], ["8", "Cover flow"]];
const HTML_LAYOUTS = ["4", "5", "6", "7", "8"];
// A project's landscape pictures, all different: its gallery screenshots first (no phone screens, not the thumbnail),
// then its videos' posters, then its combined phone-screens picture if it still needs more.
const landscapes = project => {
  const media = project.media ?? [], plain = item => item.layout !== "portrait" && !item.presentation;
  const shots = media.filter(item => item.type === "image" && plain(item) && !/\/(m-|m\d|screens)/.test(item.src)).map(item => item.src);
  const posters = media.filter(item => item.type === "video" && item.poster && plain(item)).map(item => item.poster);
  const combined = media.filter(item => item.type === "image" && /\/screens/.test(item.src)).map(item => item.src);
  return [...new Set([...shots, ...posters, ...combined])].filter(src => src !== project.previewImage);
};
const SHEET_VERTEX = `uniform float uBend,uWave,uTime;varying vec2 vUv;varying float vSlope;void main(){
  vUv=uv;vec3 p=position;float x=uv.x-.5,y=uv.y-.5,ph=uv.x*5.+uv.y*3.+uTime*2.4;
  // A sheet: curled toward you at the sides (more at the top than the foot), rippling as it moves.
  p.z+=uBend*(x*x*2.2+.5*y*y)+uWave*sin(ph);
  vSlope=uBend*4.4*x+uWave*5.*cos(ph);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
const SHEET_FRAGMENT = `uniform sampler2D uMap,uNext;uniform float uAlpha,uSunSide,uSun,uMix,uRatio,uRatioA,uRatioB;varying vec2 vUv;varying float vSlope;
// A picture filling the sheet (the sheet's shape eases from one picture's to the next's while they change over, so each
// is fitted by cropping only as much as that takes; at rest the sheet is exactly its picture's shape).
vec2 fill(vec2 uv,float r){vec2 k=r>uRatio?vec2(uRatio/r,1.):vec2(1.,r/uRatio);return (uv-.5)*k+.5;}
void main(){
  // Changing over: the next picture is revealed by a band of warm light sweeping across from the upper left, its edge
  // softened with a little grain, then the light passes on.
  float edge=vUv.x*.62+(1.-vUv.y)*.38+(fract(sin(dot(floor(vUv*90.),vec2(12.9898,78.233)))*43758.5453)-.5)*.035,front=uMix*1.3-.15;
  float m=smoothstep(edge-.09,edge+.01,front);
  vec3 c=mix(texture2D(uMap,fill(vUv,uRatioA)).rgb,texture2D(uNext,fill(vUv,uRatioB)).rgb,m);
  c+=vec3(1.,.82,.58)*exp(-pow((front-edge)/.035,2.))*.55*step(.001,uMix)*step(uMix,.999);
  // Lit on the side that turns toward the sun, a warm sheen where it catches it, shade where it turns away.
  float lit=clamp(.5+.5*vSlope*uSunSide*1.6,0.,1.);
  c*=.84+.26*lit;c+=vec3(1.,.78,.52)*pow(lit,5.)*.22*uSun;
  gl_FragColor=vec4(c,uAlpha);
  #include <colorspace_fragment>
}`;
// The clouds: x, y, depth, size, phase.
const CLOUDS = [[-6, -1, -8, .3, 0], [6.5, 1.6, -10, .36, 1.7], [9, -1.9, -7, .26, 3.1], [-9, 1.9, -12, .34, 4.4], [2.5, -2.3, -9, .28, 2.6], [12, .2, -14, .4, .8]];
// What a recruiter wants at a glance: its year and kind of work, and the first few tools (all from the project data).
// (Dates written in capitals in the data are shown in sentence case.)
const tidy = text => text && text === text.toUpperCase() ? text.charAt(0) + text.slice(1).toLowerCase() : text;
const metaOf = p => [tidy(p.dateCreated), p.role || p.category].filter(Boolean).join(" · ");

export default function WorkShowcase({ work, scene, slot, onReady }) {
  const root = useRef(null), back = useRef(null), front = useRef(null);
  const ready = useRef(onReady); ready.current = onReady;
  const [active, setActive] = useState(0), [layoutKey, setLayoutKey] = useState("1");
  useEffect(() => { const key = new URLSearchParams(location.search).get("work"); if (LAYOUTS[key]) setLayoutKey(key); }, []);
  const chooseLayout = key => { setLayoutKey(key); const url = new URL(location.href); url.searchParams.set("work", key); history.replaceState(history.state, "", url); };
  const mouse = useRef({ x: 0, y: 0 }), picker = useRef(null);
  const n = work.length;

  useEffect(() => {
    const host = root.current, skyCanvas = back.current, eagleCanvas = front.current;
    if (!host || !skyCanvas || !eagleCanvas) return;
    let skyRenderer, eagleRenderer;
    try {
      skyRenderer = new THREE.WebGLRenderer({ canvas: skyCanvas, antialias: true, alpha: true });
      eagleRenderer = new THREE.WebGLRenderer({ canvas: eagleCanvas, antialias: true, alpha: true });
    } catch { ready.current?.(); return; }
    for (const r of [skyRenderer, eagleRenderer]) { r.setClearColor(0, 0); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; }
    skyRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25)); eagleRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const camera = new THREE.PerspectiveCamera(30, 1, .1, 100); camera.position.set(0, .35, 9); camera.lookAt(0, .2, 0);

    // Behind the name: the islands' low-poly clouds, tinted for the sunrise, at a few depths, drifting left to right
    // and wrapping round; and the About section's stars carried on into the top of this one, twinkling, fading out as
    // you scroll in.
    const skyScene = new THREE.Scene(), clouds = [], starUniforms = { uTime: { value: 0 }, uPixel: { value: 1 }, uFade: { value: 1 } };
    skyScene.add(new THREE.HemisphereLight("#e1e7ff", "#75516a", .9));
    const skyLight = new THREE.DirectionalLight("#ffd9b0", 1.8); skyLight.position.set(-4, 6, 5); skyScene.add(skyLight);
    CLOUDS.forEach(([x, y, z, k, p], i) => {
      const cloud = createCloud(90 + i); cloud.material.color.set("#fff1e6"); cloud.material.emissive.set("#b4604a"); cloud.material.emissiveIntensity = .22;
      cloud.scale.setScalar(k); cloud.userData = { x, y, z, p, depth: 9 / (9 - z) }; skyScene.add(cloud); clouds.push(cloud);
    });
    const STARS = 140, starPositions = new Float32Array(STARS * 3), starSeeds = new Float32Array(STARS);
    for (let i = 0; i < STARS; i++) { starPositions.set([(Math.random() - .5) * 60, -2 + Math.pow(Math.random(), .6) * 14, -30], i * 3); starSeeds[i] = Math.random(); }
    const starGeometry = new THREE.BufferGeometry(); starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3)); starGeometry.setAttribute("aSeed", new THREE.BufferAttribute(starSeeds, 1));
    const stars = new THREE.Points(starGeometry, new THREE.ShaderMaterial({ uniforms: starUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      vertexShader: `attribute float aSeed;uniform float uTime,uPixel,uFade;varying float vAlpha;void main(){
        vAlpha=uFade*(.35+.65*aSeed)*(.6+.4*sin(uTime*(1.+aSeed*2.)+aSeed*40.))*smoothstep(-2.,4.,position.y);gl_PointSize=(1.2+aSeed*2.3)*uPixel;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(1.,.97,.9,vAlpha*smoothstep(1.,0.,d));}` }));
    stars.frustumCulled = false; skyScene.add(stars);

    // The sun, low behind everything, rising up and across as you scroll through the projects; it lights the letters
    // (see the loop) and the sheets.
    const glow = (stops, size = 128) => { const c = document.createElement("canvas"); c.width = c.height = size; const g = c.getContext("2d"), r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); stops.forEach(([k, col]) => r.addColorStop(k, col)); g.fillStyle = r; g.fillRect(0, 0, size, size); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
    const sunTexture = glow([[0, "rgba(255,246,222,1)"], [.12, "rgba(255,232,190,1)"], [.16, "rgba(255,196,140,.75)"], [.4, "rgba(255,160,110,.25)"], [1, "rgba(255,140,100,0)"]]);
    const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTexture, transparent: true, depthWrite: false, toneMapped: false }));
    sunSprite.scale.setScalar(16); skyScene.add(sunSprite);

    // The sheets: the project's pictures on thin bent planes (a soft shadow behind each), shown whole at their own shape.
    const textureLoader = new THREE.TextureLoader(), textures = new Map(), movies = new Map();
    const textureOf = src => {
      if (!textures.has(src)) {
        const poster = textureLoader.load(src); poster.colorSpace = THREE.SRGBColorSpace; poster.anisotropy = 4; textures.set(src, poster);
        const project = work.find(project => project.previewImage === src && project.thumbnailVideo);
        if (project) {
          const video = document.createElement("video");
          Object.assign(video, { muted:true, loop:true, playsInline:true, preload:"none" });
          const texture = new THREE.VideoTexture(video); texture.colorSpace = THREE.SRGBColorSpace;
          movies.set(src, { video, texture, url:project.thumbnailVideo, pending:false, blocked:false });
        }
      }
      const movie = movies.get(src);
      return !reduce.matches && window.innerWidth > 760 && movie?.video.readyState >= 2 ? movie.texture : textures.get(src);
    };
    const syncMovies = enabled => {
      for (const [src, movie] of movies) {
        const active = enabled && !reduce.matches && window.innerWidth > 760 && sheets.some(sheet => sheet.src === src || sheet.next === src);
        if (!active) { movie.video.pause(); continue; }
        if (!movie.video.getAttribute("src")) movie.video.src = movie.url;
        if (movie.video.paused && !movie.pending && !movie.blocked) {
          movie.pending = true;
          movie.video.play().catch(() => { movie.blocked = true; }).finally(() => { movie.pending = false; });
        }
      }
    };
    const pauseHiddenMovies = () => { if (document.hidden || reduce.matches) syncMovies(false); };
    document.addEventListener("visibilitychange", pauseHiddenMovies);
    reduce.addEventListener("change", pauseHiddenMovies);
    const shadowTexture = glow([[0, "rgba(255,255,255,.9)"], [.55, "rgba(255,255,255,.35)"], [1, "rgba(255,255,255,0)"]], 64);
    const sheetGeometry = new THREE.PlaneGeometry(1, 1, 40, 24), shadowGeometry = new THREE.PlaneGeometry(1, 1);
    const layout = LAYOUTS[layoutKey] ?? LAYOUTS[1];
    const sheets = layout.map((spot, k) => {
      const uniforms = { uMap: { value: null }, uNext: { value: null }, uMix: { value: 0 }, uRatio: { value: 1.6 }, uRatioA: { value: 1.6 }, uRatioB: { value: 1.6 }, uBend: { value: .16 }, uWave: { value: 0 }, uTime: { value: 0 }, uAlpha: { value: 0 }, uSunSide: { value: 0 }, uSun: { value: 1 } };
      const mesh = new THREE.Mesh(sheetGeometry, new THREE.ShaderMaterial({ uniforms, transparent: true, side: THREE.DoubleSide, vertexShader: SHEET_VERTEX, fragmentShader: SHEET_FRAGMENT }));
      const shadow = new THREE.Mesh(shadowGeometry, new THREE.MeshBasicMaterial({ map: shadowTexture, color: "#3a1638", transparent: true, depthWrite: false, opacity: 0 }));
      const group = new THREE.Group(); group.add(shadow, mesh); skyScene.add(group);
      return { spot, k, group, mesh, shadow, uniforms, ratio: 16 / 10, nextRatio: 16 / 10, src: null, next: null, want: null, href: null, wantHref: null, appear: 0, mix: 0, wait: 0 };
    });
    const showProject = (project, first) => {
      const pics = landscapes(project), fallback = [project.previewImage];
      sheets.forEach(sheet => { sheet.want = sheet.spot.pick === "thumb" ? project.previewImage : (pics.length ? pics : fallback)[sheet.spot.pick % (pics.length || 1)]; sheet.wantHref = `/project/${project.slug}/`; sheet.wait = first ? .25 + sheet.k * .14 : sheet.k * .12; });
    };
    // (Clicking a sheet opens its project; the pointer turns to a hand over one.)
    const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
    picker.current = (x, y) => { ndc.set(x, y); raycaster.setFromCamera(ndc, camera); const hit = raycaster.intersectObjects(sheets.filter(s => s.uniforms.uAlpha.value > .5).map(s => s.mesh))[0]; return hit ? sheets.find(s => s.mesh === hit.object).href : null; };

    // In front of the name: the bald eagle in flight (Robert Mirabelle, CC BY 3.0), lit warm from the upper left. Its
    // wings (along x, the beak toward -z) beat in the vertex shader, bending more toward the tips, the tips a little
    // behind.
    // (It and its lights are one rig, moved into the clouds' scene for the far half of its circle, so it passes behind
    // the name there and in front of it on the near half.)
    const eagleScene = new THREE.Scene(), rig = new THREE.Group(), flight = new THREE.Group(), flap = { value: 0 }, eagleMaterials = [];
    rig.add(new THREE.HemisphereLight("#dce7ff", "#493448", .85));
    const sun = new THREE.DirectionalLight("#ffddb5", 2.2); sun.position.set(-4, 6, 5); rig.add(sun, sun.target);
    const rim = new THREE.DirectionalLight("#b7caff", .65); rim.position.set(4, 2, -4); rig.add(rim, rim.target);
    rig.add(flight); eagleScene.add(rig);
    let behind = false;
    let disposed = false;
    new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load("/models/island/eagle-flying.glb", gltf => {
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
        o.material = m; o.frustumCulled = false; eagleMaterials.push(m);
      });
      // 2.5 across the wings, centred, turned to face along its flight.
      const box = new THREE.Box3().setFromObject(model), dims = box.getSize(new THREE.Vector3()), k = 2.5 / Math.max(dims.x, dims.y, dims.z), c = box.getCenter(new THREE.Vector3());
      model.scale.multiplyScalar(k); model.position.sub(c.multiplyScalar(k)); model.rotation.y = Math.PI;
      flight.add(model);
    }, undefined, () => {});

    let width = 0, height = 0, visible = true, frame = 0, last = performance.now();
    let drift = 0, time = 0, circle = 0, speed = .35, vel = 0, sunAt = scene.current.progress[slot] ?? 0, prevProgress = scene.current.progress[slot] ?? 0, shown = -1;
    const smoothMouse = new THREE.Vector2(), aim = new THREE.Vector2();
    // A fixed foreground canvas follows one bird across both sections, then hands over at an identical pose.
    const orbitRotation = new THREE.Quaternion(), exitRotation = new THREE.Quaternion(), pose = new THREE.Euler(0,0,0,"YXZ");
    const screenPoint = new THREE.Vector3(), viewPoint = new THREE.Vector3();
    const easeFlight = (value, from, to) => {
      const t = THREE.MathUtils.clamp((value - from) / (to - from), 0, 1);
      return t * t * t * (t * (t * 6 - 15) + 10);
    };
    const resize = () => {
      width = skyCanvas.clientWidth; height = skyCanvas.clientHeight; if (!width || !height) return;
      skyRenderer.setSize(width, height, false); eagleRenderer.setSize(width, height, false);
      camera.aspect = width / height; camera.updateProjectionMatrix();
      flight.scale.setScalar(Math.min(1, camera.aspect / 1.2));
    };
    const observer = new ResizeObserver(resize); observer.observe(skyCanvas); resize();
    const seen = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: "100px" }); seen.observe(host);

    function loop(now) {
      frame = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, .1); last = now;
      const progress = scene.current.progress[slot] ?? 0;
      // Scroll speed in projects per second, smoothed; a new project gives the eagle a kick.
      const rate = dt > 0 ? (progress - prevProgress) / dt * (n - 1) : 0; prevProgress = progress;
      vel += (rate - vel) * Math.min(1, dt * 6);
      const at = Math.min(n - 1, Math.max(0, Math.round(progress * (n - 1))));
      if (at !== shown) { if (shown >= 0) speed += 2.2; showProject(work[at], shown < 0); shown = at; setActive(at); }
      const destination = eagleHandoff.target;
      const crossing = !reduce.matches && destination && destination.top > 0 && destination.top < window.innerHeight;
      if (document.hidden) { syncMovies(false); return; }
      if (!visible && !crossing) { syncMovies(false); eagleRenderer.clear(); return; }
      const still = reduce.matches;
      // Its pace: idle, plus however fast you're scrolling, easing back down when you stop.
      const target = still ? 0 : .35 + Math.min(7, Math.abs(vel) * 5);
      speed += (target - speed) * Math.min(1, dt * 2.5);
      if (!still) { time += dt; circle += speed * dt; drift += dt * (.25 + Math.min(4, Math.abs(vel) * 2.5)); flap.value += dt * (5.5 + Math.min(10, Math.abs(vel) * 7)); }
      const pin = skyCanvas.getBoundingClientRect();
      // Arrival is measured against Skills itself, including its gap and the taller phone project list.
      const travel = still || !destination ? 0 : THREE.MathUtils.clamp(1 - destination.top / height, 0, 1);
      const blend = easeFlight(travel, 0, 1);
      const a = circle * .55, bank = .32 + Math.min(.3, Math.abs(vel) * .1);
      const baseScale = Math.min(1, camera.aspect / 1.2);
      flight.position.set(Math.cos(a) * 1.25 * baseScale, (still ? 0 : Math.sin(time * 1.3) * .12) + .3, Math.sin(a) * 1.1 - .1);
      orbitRotation.setFromEuler(pose.set(0, -a, bank, "YXZ"));
      flight.quaternion.copy(orbitRotation);
      flight.scale.setScalar(baseScale);
      flight.visible = pin.bottom > 0 || crossing;
      const nextBehind = Math.sin(a) < -.1 && travel === 0;
      if (nextBehind !== behind) { behind = nextBehind; (behind ? skyScene : eagleScene).add(rig); }
      if (!behind) {
        camera.updateMatrixWorld();
        screenPoint.copy(flight.position).project(camera);
        viewPoint.copy(flight.position).applyMatrix4(camera.matrixWorldInverse);
        const depth = -viewPoint.z;
        // The Work orbit scrolls with its section, then arcs gently into the destination orbit.
        screenPoint.y -= pin.top / height * 2;
        const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        let scale = baseScale * 9 / depth;
        if (travel > 0) {
          screenPoint.x = THREE.MathUtils.lerp(screenPoint.x, destination.x, blend) + Math.sin(Math.PI * travel) * .18;
          screenPoint.y = THREE.MathUtils.lerp(screenPoint.y, destination.y, blend);
          const destinationScale = (1.6 / 2.5) * 9 * tan / (destination.depth * Math.tan(THREE.MathUtils.degToRad(destination.fov / 2)));
          scale = THREE.MathUtils.lerp(scale, destinationScale, blend);
          exitRotation.copy(camera.quaternion).multiply(destination.rotation);
          // Lead with the turn: establish the glide heading before most of the crossing.
          flight.quaternion.slerp(exitRotation, easeFlight(travel, 0, .32));
          eagleHandoff.flap = flap.value;
        }
        viewPoint.set(screenPoint.x * 9 * tan * camera.aspect, screenPoint.y * 9 * tan, -9).applyMatrix4(camera.matrixWorld);
        flight.position.copy(viewPoint); flight.scale.setScalar(scale);
      }
      if (destination && destination.top <= 0 && pin.top < 0) flight.visible = false;
      smoothMouse.lerp(aim.set(mouse.current.x, mouse.current.y), Math.min(1, dt * 5));
      // The sun: from low on the left up toward the right as the projects go by (eased, so it settles when you stop).
      sunAt += (progress - sunAt) * Math.min(1, dt * 3);
      // The heading follows the sun up: white on the night sky you arrive under, warming slowly to a pale peach while
      // the sky is still dark, then (once the sky behind it is light enough) turning to plum over a short stretch, so it
      // only briefly passes through the sky's own mauve.
      const step = (a, b) => { const t = Math.min(1, Math.max(0, (sunAt - a) / (b - a))); return (t * t * (3 - 2 * t)).toFixed(3); };
      host.style.setProperty("--warm", step(0, .7)); host.style.setProperty("--rise", step(.68, .9));
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(15)), sunDepth = -30, sunH = tanHalf * (9 - sunDepth), sunW = sunH * camera.aspect;
      sunSprite.position.set((-.55 + 1.1 * sunAt) * sunW, (-.5 + .55 * sunAt) * sunH + .2, sunDepth);
      // Its light on the letters: a warm band across the word where the sun stands behind it.
      const word = host.querySelector(".wl-a-word");
      if (word) {
        const sunScreen = sunSprite.position.clone().project(camera), r = word.getBoundingClientRect();
        host.style.setProperty("--sun", `${((pin.left + (sunScreen.x + 1) / 2 * width - r.left) / r.width * 100).toFixed(1)}%`);
      }
      // The sheets: each swaps its picture by curling away and back (one after another), hangs at its spot at its own
      // shape, sways a little with the pointer, and bends and ripples more the faster you scroll.
      // The sheets: the first time, each fades in, rising a touch and settling; after that a new project's picture is
      // revealed on the same sheet by a sweep of light (one sheet after another) while the sheet eases to its shape
      // and breathes, curling a little as the light passes. They sway with the pointer, and bend and ripple more the
      // faster you scroll.
      const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      for (const sheet of sheets) {
        const { spot, uniforms } = sheet;
        if (sheet.wait > 0) sheet.wait -= dt;
        else if (!sheet.src && sheet.want) {
          sheet.src = sheet.want; sheet.href = sheet.wantHref; uniforms.uMap.value = textureOf(sheet.src);
          const src = sheet.src; getImageRatio(src).then(r => { if (r && sheet.src === src && !sheet.next) sheet.ratio = r; });
        } else if (sheet.src && !sheet.next && sheet.want !== sheet.src) {
          sheet.next = sheet.want; sheet.href = sheet.wantHref; sheet.mix = 0; uniforms.uNext.value = textureOf(sheet.next); sheet.nextRatio = sheet.ratio;
          const next = sheet.next; getImageRatio(next).then(r => { if (r && sheet.next === next) sheet.nextRatio = r; });
        }
        if (sheet.src) sheet.appear = Math.min(1, sheet.appear + dt / (still ? .01 : 1.1));
        if (sheet.next) {
          sheet.mix = Math.min(1, sheet.mix + dt / (still ? .01 : 1.15));
          if (sheet.mix >= 1) { sheet.src = sheet.next; sheet.ratio = sheet.nextRatio; uniforms.uMap.value = uniforms.uNext.value; sheet.next = null; sheet.mix = 0; }
        }
        const a = ease(sheet.appear), m = sheet.next ? ease(sheet.mix) : 0, breath = Math.sin(Math.PI * m);
        const ratio = sheet.next ? sheet.ratio + (sheet.nextRatio - sheet.ratio) * m : sheet.ratio;
        uniforms.uMix.value = m; uniforms.uRatio.value = ratio; uniforms.uRatioA.value = sheet.ratio; uniforms.uRatioB.value = sheet.nextRatio;
        const halfH = tanHalf * (9 - spot.z), halfW = halfH * camera.aspect;
        const w = spot.w * 2 * halfW * fitWidth(1, ratio, { min: .65, max: 1.3 }), h = w / ratio;
        sheet.mesh.scale.set(w, h, 1); sheet.shadow.scale.set(w * 1.3, h * 1.4, 1); sheet.shadow.position.set(w * (.07 + breath * .03), -h * (.1 + breath * .04), -.2);
        sheet.group.position.set((spot.fx * 2 - 1) * halfW - smoothMouse.x * .2, (1 - 2 * spot.fy) * halfH + .2 - (1 - a) * .18 + (still ? 0 : Math.sin(time * .6 + sheet.k * 2) * .05) - smoothMouse.y * .12, spot.z + breath * .12);
        sheet.group.rotation.set(smoothMouse.y * .08, spot.ry + smoothMouse.x * .14 + breath * .06, spot.rz);
        sheet.group.scale.setScalar(.96 + .04 * a);
        uniforms.uAlpha.value = a; sheet.shadow.material.opacity = .4 * a;
        uniforms.uBend.value = (spot.bend ?? .14) + (1 - a) * .2 + breath * .12 + Math.min(.45, Math.abs(vel) * .14); uniforms.uWave.value = still ? 0 : .012 + Math.min(.1, Math.abs(vel) * .04);
        uniforms.uTime.value = time; uniforms.uSunSide.value = Math.max(-1, Math.min(1, (sunSprite.position.x * (9 - spot.z) / (9 - sunDepth) - sheet.group.position.x) / 3));
        uniforms.uSun.value = .5 + .5 * sunAt;
      }
      syncMovies(visible && !document.hidden);
      for (const sheet of sheets) {
        if (sheet.src) sheet.uniforms.uMap.value = textureOf(sheet.src);
        if (sheet.next) sheet.uniforms.uNext.value = textureOf(sheet.next);
      }
      const span = Math.tan(THREE.MathUtils.degToRad(15)) * camera.aspect;
      for (const cloud of clouds) {
        const u = cloud.userData, w = span * (9 - u.z) + 3, x = u.x + drift * .35 * u.depth;
        cloud.position.set(((x + w) % (2 * w) + 2 * w) % (2 * w) - w - smoothMouse.x * .5 * u.depth, u.y + Math.sin(time * .2 + u.p) * .2 + smoothMouse.y * .25 * u.depth, u.z);
        cloud.rotation.y = Math.sin(time * .05 + u.p) * .2;
      }
      // Stars: full while the section comes up the screen, gone a third of the way through it.
      const arriving = Math.max(0, Math.min(1, host.getBoundingClientRect().top / height));
      starUniforms.uFade.value = Math.max(0, 1 - progress / .3) * (.55 + .45 * arriving);
      starUniforms.uTime.value = time; starUniforms.uPixel.value = skyRenderer.getPixelRatio();
      skyRenderer.render(skyScene, camera);
      eagleRenderer.render(eagleScene, camera);
    }
    frame = requestAnimationFrame(loop);
    // (The loading screen waits on each section; this one is ready as soon as its canvases are.)
    ready.current?.();
    return () => {
      document.removeEventListener("visibilitychange", pauseHiddenMovies);
      reduce.removeEventListener("change", pauseHiddenMovies);
      eagleHandoff.flap = null;
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); seen.disconnect();
      clouds.forEach(c => { c.geometry.dispose(); c.material.dispose(); }); starGeometry.dispose(); stars.material.dispose();
      picker.current = null; sunTexture.dispose(); sunSprite.material.dispose(); shadowTexture.dispose(); sheetGeometry.dispose(); shadowGeometry.dispose();
      sheets.forEach(s => { s.mesh.material.dispose(); s.shadow.material.dispose(); }); textures.forEach(t => t.dispose());
      for (const movie of movies.values()) { movie.video.pause(); movie.video.removeAttribute("src"); movie.video.load(); movie.texture.dispose(); }
      rig.traverse(o => o.geometry?.dispose()); eagleMaterials.forEach(m => m.dispose());
      skyRenderer.dispose(); eagleRenderer.dispose();
    };
  }, [scene, slot, n, work, layoutKey]);

  // Pointer, relative to the pinned screen (-1..1, y up).
  const onMove = e => {
    const r = e.currentTarget.getBoundingClientRect();
    mouse.current = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -(((e.clientY - r.top) / r.height) * 2 - 1) };
    e.currentTarget.style.cursor = !e.target.closest("a") && picker.current?.(mouse.current.x, mouse.current.y) ? "pointer" : "";
  };
  // A click on a sheet (not on a link or button over it) opens its project.
  const onClick = e => {
    if (e.target.closest("a, button")) return;
    const r = e.currentTarget.getBoundingClientRect(), href = picker.current?.(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    if (href) window.location.href = href;
  };
  const project = work[active] ?? work[0];

  return (
    <div className="wl" ref={root} style={{ "--n": n }} data-layout={layoutKey} data-html={HTML_LAYOUTS.includes(layoutKey) ? "" : undefined}>
      <div className="wl-pin" onPointerMove={onMove} onClick={onClick} onPointerLeave={() => { mouse.current = { x: 0, y: 0 }; }}>
        <canvas className="wl-canvas" ref={back} aria-hidden="true" />
        <canvas className="wl-canvas wl-front" ref={front} aria-hidden="true" />
        <div className="wl-head">
          <h2 id="ht-work-title" className="wl-title">Selected work</h2>
          <p className="wl-pills">
            <a className="ui-btn ui-btn--secondary" href="/projects/"><Roll>All work</Roll><Icon src="/icons/tech/tabler--arrow-right.svg" /></a>
            <a className="ui-btn ui-btn--secondary" href="/journey/"><Roll>Lab</Roll><Icon src="/icons/tech/tabler--arrow-right.svg" /></a>
          </p>
        </div>
        <div className="wl-switch" role="group" aria-label="Work layout">
          {LAYOUT_NAMES.map(([key, label]) => <button key={key} type="button" aria-pressed={layoutKey === key} onClick={() => chooseLayout(key)}>{key} · {label}</button>)}
        </div>

        {/* 4: the three projects side by side, the one the scroll is on lifted. */}
        {layoutKey === "4" && <ol className="wl-cards">
          {work.map((p, i) => (
            <li key={p.slug} className={i === active ? "is-active" : undefined}>
              <ProjectThumbnail project={p} href={`/project/${p.slug}/`} />
              <a href={`/project/${p.slug}/`}><strong>{p.name}</strong><span>{metaOf(p)}</span></a>
            </li>
          ))}
        </ol>}

        {["5", "6", "7", "8"].includes(layoutKey) && <WorkCards layout={layoutKey} work={work} active={active} />}

        {/* The name, its letters rising in one after another (and lifting away for the next). */}
        <a className="wl-a-name" href={`/project/${project.slug}/`} aria-label={`${project.name}: view the project`}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={project.slug} className="wl-a-word" aria-hidden="true" style={{ "--n": [...project.name].length }}>
              {[...project.name].map((ch, i) => (
                <motion.span key={i} className="wl-a-char" style={{ "--i": i }}
                  initial={{ y: "110%", opacity: 0, filter: "blur(10px)" }}
                  animate={{ y: "0%", opacity: 1, filter: "blur(0px)", transition: { delay: i * .028, type: "spring", stiffness: 260, damping: 24 } }}
                  exit={{ y: "-110%", opacity: 0, filter: "blur(10px)", transition: { delay: i * .015, duration: .28, ease: [.6, 0, .9, .4] } }}>
                  {ch === " " ? "\u00A0" : ch}
                </motion.span>
              ))}
            </motion.span>
          </AnimatePresence>
        </a>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={project.slug} className="wl-a-meta"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: .25, duration: .5, ease: [.2, .8, .2, 1] } }} exit={{ opacity: 0, y: -10, transition: { duration: .2 } }}>
            <span>{metaOf(project)}</span>
            {project.highlight && <span className="wl-contribution">{project.highlight}</span>}
            <ul className="wl-tags ui-chips">{project.tags?.slice(0, 4).map(t => <TechChip key={t} name={t} />)}</ul>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Phones: the heading and the projects as a plain list, scrolling over the sky (the eagle behind them). */}
      <div className="wl-phone-head">
        <h2 className="wl-title">Selected work</h2>
        <p className="wl-pills">
          <a className="ui-btn ui-btn--secondary" href="/projects/"><Roll>All work</Roll><Icon src="/icons/tech/tabler--arrow-right.svg" /></a>
          <a className="ui-btn ui-btn--secondary" href="/journey/"><Roll>Lab</Roll><Icon src="/icons/tech/tabler--arrow-right.svg" /></a>
        </p>
      </div>
      <ul className="wl-phone">
        {work.map(p => (
          <li key={p.slug}>
            <ProjectThumbnail project={p} href={`/project/${p.slug}/`} />
            <a href={`/project/${p.slug}/`}>
              <strong>{p.name}</strong>{p.highlight && <span>{p.highlight}</span>}
              <span>{metaOf(p)}</span>
              <ul className="wl-tags ui-chips">{p.tags?.slice(0,4).map(tag=><TechChip key={tag} name={tag} />)}</ul>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

