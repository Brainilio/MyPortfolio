"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { createCloud } from "./island-parts";
import { useImageRatio, getImageRatio, fitWidth } from "../../lib/image-ratio";

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
const SHEETS = [
  { fx: .64, fy: .21, w: .17, pick: 1, ry: -.32, rz: .05, z: -1.6 },
  { fx: .85, fy: .63, w: .15, pick: 3, ry: -.5, rz: -.07, z: -1.1 },
  { fx: .19, fy: .72, w: .16, pick: 0, ry: .45, rz: .04, z: -1.3 },
];
const SHEET_VERTEX = `uniform float uBend,uWave,uTime;varying vec2 vUv;varying float vSlope;void main(){
  vUv=uv;vec3 p=position;float x=uv.x-.5,y=uv.y-.5,ph=uv.x*5.+uv.y*3.+uTime*2.4;
  // A sheet: curled toward you at the sides (more at the top than the foot), rippling as it moves.
  p.z+=uBend*(x*x*2.2+.5*y*y)+uWave*sin(ph);
  vSlope=uBend*4.4*x+uWave*5.*cos(ph);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
const SHEET_FRAGMENT = `uniform sampler2D uMap;uniform float uAlpha,uSunSide,uSun;varying vec2 vUv;varying float vSlope;void main(){
  vec3 c=texture2D(uMap,vUv).rgb;
  // Lit on the side that turns toward the sun, a warm sheen where it catches it, shade where it turns away.
  float lit=clamp(.5+.5*vSlope*uSunSide*1.6,0.,1.);
  c*=.84+.26*lit;c+=vec3(1.,.78,.52)*pow(lit,5.)*.22*uSun;
  // A hairline paper edge.
  float e=min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y)),w=fwidth(e);c=mix(vec3(1.,.96,.9),c,smoothstep(w*.8,w*1.8,e)*.7+.3*step(w*1.8,e));
  gl_FragColor=vec4(c,uAlpha);
  #include <colorspace_fragment>
}`;
// The clouds: x, y, depth, size, phase.
const CLOUDS = [[-6, -1, -8, .3, 0], [6.5, 1.6, -10, .36, 1.7], [9, -1.9, -7, .26, 3.1], [-9, 1.9, -12, .34, 4.4], [2.5, -2.3, -9, .28, 2.6], [12, .2, -14, .4, .8]];
// What a recruiter wants at a glance: its year and kind of work, and the first few tools (all from the project data).
// (Dates written in capitals in the data are shown in sentence case.)
const tidy = text => text && text === text.toUpperCase() ? text.charAt(0) + text.slice(1).toLowerCase() : text;
const metaOf = p => [tidy(p.dateCreated), p.category].filter(Boolean).join(" · ");

export default function WorkShowcase({ work, scene, slot, onReady }) {
  const root = useRef(null), back = useRef(null), front = useRef(null);
  const ready = useRef(onReady); ready.current = onReady;
  const [active, setActive] = useState(0);
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
    skyScene.add(new THREE.HemisphereLight("#fff1e0", "#6a4a7a", 1.3));
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
    const textureLoader = new THREE.TextureLoader(), textures = new Map();
    const textureOf = src => { if (!textures.has(src)) { const t = textureLoader.load(src); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; textures.set(src, t); } return textures.get(src); };
    const shadowTexture = glow([[0, "rgba(255,255,255,.9)"], [.55, "rgba(255,255,255,.35)"], [1, "rgba(255,255,255,0)"]], 64);
    const sheetGeometry = new THREE.PlaneGeometry(1, 1, 40, 24), shadowGeometry = new THREE.PlaneGeometry(1, 1);
    const sheets = SHEETS.map((spot, k) => {
      const uniforms = { uMap: { value: null }, uBend: { value: .16 }, uWave: { value: 0 }, uTime: { value: 0 }, uAlpha: { value: 0 }, uSunSide: { value: 0 }, uSun: { value: 1 } };
      const mesh = new THREE.Mesh(sheetGeometry, new THREE.ShaderMaterial({ uniforms, transparent: true, side: THREE.DoubleSide, vertexShader: SHEET_VERTEX, fragmentShader: SHEET_FRAGMENT }));
      const shadow = new THREE.Mesh(shadowGeometry, new THREE.MeshBasicMaterial({ map: shadowTexture, color: "#3a1638", transparent: true, depthWrite: false, opacity: 0 }));
      const group = new THREE.Group(); group.add(shadow, mesh); skyScene.add(group);
      return { spot, k, group, mesh, shadow, uniforms, ratio: 16 / 10, src: null, want: null, href: null, wantHref: null, hide: 1, wait: 0 };
    });
    const showProject = (project, first) => {
      const pics = [project.previewImage, ...(project.fullImages ?? [])];
      sheets.forEach(sheet => { sheet.want = pics[sheet.spot.pick % pics.length]; sheet.wantHref = `/project/${project.slug}/`; sheet.wait = first ? .3 + sheet.k * .12 : sheet.k * .09; });
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
    rig.add(new THREE.HemisphereLight("#ffe2c4", "#3a2a4a", 1.4));
    const sun = new THREE.DirectionalLight("#ffd2a0", 2.4); sun.position.set(-4, 6, 5); rig.add(sun, sun.target);
    const rim = new THREE.DirectionalLight("#b48cff", 1.2); rim.position.set(4, 2, -4); rig.add(rim, rim.target);
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
      if (!visible || document.hidden) return;
      const still = reduce.matches;
      // Its pace: idle, plus however fast you're scrolling, easing back down when you stop.
      const target = still ? 0 : .35 + Math.min(7, Math.abs(vel) * 5);
      speed += (target - speed) * Math.min(1, dt * 2.5);
      if (!still) { time += dt; circle += speed * dt; drift += dt * (.25 + Math.min(4, Math.abs(vel) * 2.5)); flap.value += dt * (5.5 + Math.min(10, Math.abs(vel) * 7)); }
      // The eagle: a slow circle round the middle (wider than deep), facing along it, banked into the turn.
      const a = circle * .55, bank = .32 + Math.min(.3, Math.abs(vel) * .1);
      flight.position.set(Math.cos(a) * 1.25 * flight.scale.x, (still ? 0 : Math.sin(time * 1.3) * .12) + .3, Math.sin(a) * 1.1 - .1);
      flight.rotation.set(0, -a, bank, "YXZ");
      // Behind the name on the far half of the circle, in front on the near half.
      if ((Math.sin(a) < -.1) !== behind) { behind = !behind; (behind ? skyScene : eagleScene).add(rig); }
      smoothMouse.lerp(aim.set(mouse.current.x, mouse.current.y), Math.min(1, dt * 5));
      // The sun: from low on the left up toward the right as the projects go by (eased, so it settles when you stop).
      sunAt += (progress - sunAt) * Math.min(1, dt * 3);
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(15)), sunDepth = -30, sunH = tanHalf * (9 - sunDepth), sunW = sunH * camera.aspect;
      sunSprite.position.set((-.55 + 1.1 * sunAt) * sunW, (-.5 + .55 * sunAt) * sunH + .2, sunDepth);
      // Its light on the letters: a warm band across the word where the sun stands behind it.
      const word = host.querySelector(".wl-a-word"), pin = skyCanvas.getBoundingClientRect();
      if (word) {
        const sunScreen = sunSprite.position.clone().project(camera), r = word.getBoundingClientRect();
        host.style.setProperty("--sun", `${((pin.left + (sunScreen.x + 1) / 2 * width - r.left) / r.width * 100).toFixed(1)}%`);
      }
      // The sheets: each swaps its picture by curling away and back (one after another), hangs at its spot at its own
      // shape, sways a little with the pointer, and bends and ripples more the faster you scroll.
      for (const sheet of sheets) {
        const { spot, uniforms } = sheet;
        if (sheet.want && sheet.want !== sheet.src) {
          if (sheet.wait > 0) sheet.wait -= dt;
          else if ((sheet.hide = Math.min(1, sheet.hide + dt / .35)) >= 1) {
            sheet.src = sheet.want; sheet.href = sheet.wantHref; uniforms.uMap.value = textureOf(sheet.src);
            const src = sheet.src; getImageRatio(src).then(r => { if (r && sheet.src === src) sheet.ratio = r; });
          }
        } else if (sheet.src) sheet.hide = Math.max(0, sheet.hide - dt / (still ? .01 : .7));
        const e = sheet.hide * sheet.hide * (3 - 2 * sheet.hide), halfH = tanHalf * (9 - spot.z), halfW = halfH * camera.aspect;
        const w = spot.w * 2 * halfW * fitWidth(1, sheet.ratio, { min: .65, max: 1.3 }), h = w / sheet.ratio;
        sheet.mesh.scale.set(w, h, 1); sheet.shadow.scale.set(w * 1.3, h * 1.4, 1); sheet.shadow.position.set(w * .07, -h * .1, -.2);
        sheet.group.position.set((spot.fx * 2 - 1) * halfW - smoothMouse.x * .2, (1 - 2 * spot.fy) * halfH + .2 - e * .9 + (still ? 0 : Math.sin(time * .6 + sheet.k * 2) * .05) - smoothMouse.y * .12, spot.z);
        sheet.group.rotation.set(e * 1.1 + smoothMouse.y * .08, spot.ry + smoothMouse.x * .14, spot.rz + e * .35);
        sheet.group.scale.setScalar(1 - e * .2);
        uniforms.uAlpha.value = 1 - e; sheet.shadow.material.opacity = .4 * (1 - e);
        uniforms.uBend.value = .14 + e * .9 + Math.min(.45, Math.abs(vel) * .14); uniforms.uWave.value = still ? 0 : .012 + Math.min(.1, Math.abs(vel) * .04);
        uniforms.uTime.value = time; uniforms.uSunSide.value = Math.max(-1, Math.min(1, (sunSprite.position.x * (9 - spot.z) / (9 - sunDepth) - sheet.group.position.x) / 3));
        uniforms.uSun.value = .5 + .5 * sunAt;
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
      skyRenderer.render(skyScene, camera); eagleRenderer.render(eagleScene, camera);
    }
    frame = requestAnimationFrame(loop);
    // (The loading screen waits on each section; this one is ready as soon as its canvases are.)
    ready.current?.();
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); seen.disconnect();
      clouds.forEach(c => { c.geometry.dispose(); c.material.dispose(); }); starGeometry.dispose(); stars.material.dispose();
      picker.current = null; sunTexture.dispose(); sunSprite.material.dispose(); shadowTexture.dispose(); sheetGeometry.dispose(); shadowGeometry.dispose();
      sheets.forEach(s => { s.mesh.material.dispose(); s.shadow.material.dispose(); }); textures.forEach(t => t.dispose());
      rig.traverse(o => o.geometry?.dispose()); eagleMaterials.forEach(m => m.dispose());
      skyRenderer.dispose(); eagleRenderer.dispose();
    };
  }, [scene, slot, n, work]);

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
    <div className="wl" ref={root} style={{ "--n": n }}>
      <div className="wl-pin" onPointerMove={onMove} onClick={onClick} onPointerLeave={() => { mouse.current = { x: 0, y: 0 }; }}>
        <canvas className="wl-canvas" ref={back} aria-hidden="true" />
        <canvas className="wl-canvas wl-front" ref={front} aria-hidden="true" />
        <div className="wl-head">
          <h2 id="ht-work-title" className="wl-title">Things I’ve built</h2>
          <p className="wl-pills">
            <a href="/projects/">All projects <span aria-hidden="true">→</span></a>
            <a href="/journey/">Lab experiments <span aria-hidden="true">→</span></a>
          </p>
        </div>

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
            <span className="wl-tags">{project.tags?.slice(0, 3).map(t => <em key={t}>{t}</em>)}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Phones: the heading and the projects as a plain list, scrolling over the sky (the eagle behind them). */}
      <div className="wl-phone-head">
        <h2 className="wl-title">Things I’ve built</h2>
        <p className="wl-pills">
          <a href="/projects/">All projects <span aria-hidden="true">→</span></a>
          <a href="/journey/">Lab experiments <span aria-hidden="true">→</span></a>
        </p>
      </div>
      <ul className="wl-phone">
        {work.map(p => (
          <li key={p.slug}>
            <a href={`/project/${p.slug}/`}>
              <WholePicture src={p.previewImage} />
              <strong>{p.name}</strong>
              <span>{metaOf(p)}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// A picture shown whole at its own shape.
function WholePicture({ src }) {
  const ratio = useImageRatio(src);
  return <img src={src} alt="" decoding="async" style={{ aspectRatio: ratio }} />;
}
