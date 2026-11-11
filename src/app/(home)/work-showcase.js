"use client";
import { eagleHandoff } from "./eagle-handoff";
import ProjectThumbnail from "../project/project-thumbnail";
import TechChip, { Icon, Roll } from "../tech-chip";
import WorkIndex from "./work-cards";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { createCloud } from "./island-parts";

// The Work section: one pinned screen, the scroll picking the project (in step with the section pill's counter): the
// project names huge on the left, the one you're on solid, and its thumbnail loop as a big screen on the right
// (work-cards.js). Behind, the page's own sky turns to sunrise as you go, a sun rising with it, low-poly clouds drifting
// across and the last of the About section's stars fading; a bald eagle circles in the open sky above, faster (and
// beating its wings faster) the faster you scroll, then flies on into the Skills section.
// Two canvases of its own (the clouds behind the words, the eagle in front of them): drawn only while on screen and the
// tab is visible; reduced motion stops the flight and the drift. Phones get the sky and a plain list.
// Where the eagle circles: centred, and this far above the middle (world units; about 2.4 from the middle to the top).
const EAGLE_UP = 1.15;
// The clouds: x, y, depth, size, phase.
const CLOUDS = [[-6, -1, -8, .3, 0], [6.5, 1.6, -10, .36, 1.7], [9, -1.9, -7, .26, 3.1], [-9, 1.9, -12, .34, 4.4], [2.5, -2.3, -9, .28, 2.6], [12, .2, -14, .4, .8]];
// What a recruiter wants at a glance: its year and kind of work, and the first few tools (all from the project data).
// (Dates written in capitals in the data are shown in sentence case.)
const tidy = text => text && text === text.toUpperCase() ? text.charAt(0) + text.slice(1).toLowerCase() : text;
// The line under the heading.
const INTRO = "What I've built and worked on most recently, from my own app to a large platform. The rest is on the work page.";
const metaOf = p => [tidy(p.dateCreated), p.role || p.category].filter(Boolean).join(" · ");

export default function WorkShowcase({ work, scene, slot, onReady }) {
  const root = useRef(null), back = useRef(null), front = useRef(null);
  const ready = useRef(onReady); ready.current = onReady;
  const [active, setActive] = useState(0);
  const mouse = useRef({ x: 0, y: 0 });
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

    // Behind: the islands' low-poly clouds, tinted for the sunrise, at a few depths, drifting left to right
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

    // The sun, low behind everything, rising up and across as you scroll through the projects.
    const glow = (stops, size = 128) => { const c = document.createElement("canvas"); c.width = c.height = size; const g = c.getContext("2d"), r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); stops.forEach(([k, col]) => r.addColorStop(k, col)); g.fillStyle = r; g.fillRect(0, 0, size, size); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
    const sunTexture = glow([[0, "rgba(255,246,222,1)"], [.12, "rgba(255,232,190,1)"], [.16, "rgba(255,196,140,.75)"], [.4, "rgba(255,160,110,.25)"], [1, "rgba(255,140,100,0)"]]);
    const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTexture, transparent: true, depthWrite: false, toneMapped: false }));
    sunSprite.scale.setScalar(16); skyScene.add(sunSprite);

    // The bald eagle in flight (Robert Mirabelle, CC BY 3.0), lit warm from the upper left. Its wings (along x, the beak
    // toward -z) beat in the vertex shader, bending more toward the tips, the tips a little behind.
    // (It and its lights are one rig, moved into the clouds' scene for the far half of its circle, so it passes behind
    // the clouds there and in front of them on the near half.)
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
      if (at !== shown) { if (shown >= 0) speed += 2.2; shown = at; setActive(at); }
      const destination = eagleHandoff.target;
      const crossing = !reduce.matches && destination && destination.top > 0 && destination.top < window.innerHeight;
      if (document.hidden) return;
      if (!visible && !crossing) { eagleRenderer.clear(); return; }
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
      flight.position.set(Math.cos(a) * 1.25 * baseScale, (still ? 0 : Math.sin(time * 1.3) * .12) + .3 + EAGLE_UP, Math.sin(a) * 1.1 - .1);
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
      eagleHandoff.flap = null;
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); seen.disconnect();
      clouds.forEach(c => { c.geometry.dispose(); c.material.dispose(); }); starGeometry.dispose(); stars.material.dispose();
      sunTexture.dispose(); sunSprite.material.dispose();
      rig.traverse(o => o.geometry?.dispose()); eagleMaterials.forEach(m => m.dispose());
      skyRenderer.dispose(); eagleRenderer.dispose();
    };
  }, [scene, slot, n]);

  // Pointer, relative to the pinned screen (-1..1, y up): the clouds shift a little with it.
  const onMove = e => {
    const r = e.currentTarget.getBoundingClientRect();
    mouse.current = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -(((e.clientY - r.top) / r.height) * 2 - 1) };
  };

  return (
    <div className="wl" ref={root} style={{ "--n": n }}>
      <div className="wl-pin" onPointerMove={onMove} onPointerLeave={() => { mouse.current = { x: 0, y: 0 }; }}>
        <canvas className="wl-canvas" ref={back} aria-hidden="true" />
        <canvas className="wl-canvas wl-front" ref={front} aria-hidden="true" />
        <div className="wl-head">
          <h2 id="ht-work-title" className="wl-title">Latest work</h2>
          <p className="wl-intro">{INTRO}</p>
          <p className="wl-pills">
            <a className="ui-btn" href="/projects/"><Roll>All work</Roll><Icon src="/icons/tech/tabler--arrow-right.svg" /></a>
            <a className="ui-btn ui-btn--secondary" href="/journey/"><Roll>Lab</Roll><Icon src="/icons/tech/tabler--arrow-right.svg" /></a>
          </p>
        </div>
        <WorkIndex work={work} active={active} />
      </div>

      {/* Phones: the heading and the projects as a plain list, scrolling over the sky (the eagle behind them). */}
      <div className="wl-phone-head">
        <h2 className="wl-title">Latest work</h2>
        <p className="wl-intro">{INTRO}</p>
        <p className="wl-pills">
          <a className="ui-btn" href="/projects/"><Roll>All work</Roll><Icon src="/icons/tech/tabler--arrow-right.svg" /></a>
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

