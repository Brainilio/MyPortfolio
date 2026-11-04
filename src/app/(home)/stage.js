import * as THREE from "three";

// The homepage's one WebGL canvas: fixed, full screen and transparent, drawn by one renderer in one frame loop that
// runs for the life of the page. It sits above the sky and the hero's giant name (both plain HTML/CSS, so the name
// stays pin-sharp and the peaks still rise in front of it) and below the words. Into it goes every island whose
// section is on screen, each from its own scene and camera, into the rectangle its section's stage occupies right
// now. The stages are sticky, so an island holds still while its section is pinned and travels up and away with the
// page as the next one arrives; no layer is ever faded. The canvas lets the pointer through; the stage elements stay
// in the page as transparent hit areas, so each island's pointer handling (drag to spin, taps, hover) works unchanged.
//
// An island registers { mount, scene, camera, draw(dt), exposure, fade?, overscan? }: mount is its stage element, draw
// advances its animation (it decides how often) and returns true when anything changed, exposure its tone-mapping
// exposure, and fade ({ side: left, right or top, from }) fades it out toward that edge.
let stage = null;
const OVERSCAN = .5, saved = new THREE.Matrix4(), squeeze = new THREE.Matrix4();

export function getStage() {
  if (!stage) stage = createStage();
  return stage;
}

function createStage() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); } catch { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.autoClear = false; renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const canvas = renderer.domElement;
  canvas.className = "ht-world";
  canvas.setAttribute("aria-hidden", "true");

  // An island can fade out toward one edge of its rectangle (toward the words beside it): a quad over its rectangle
  // that erases what's drawn there with a rising strength, so the island melts into the sky behind the canvas.
  const flat = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const veilUniforms = { uFrom: { value: .75 }, uDir: { value: 1 }, uAxis: { value: 0 } };
  const veilScene = new THREE.Scene(), veil = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false, toneMapped: false, transparent: true, uniforms: veilUniforms,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
    fragmentShader: `uniform float uFrom,uDir,uAxis;varying vec2 vUv;void main(){
      float u=uAxis>.5?vUv.y:vUv.x,x=uDir>0.?u:1.-u;gl_FragColor=vec4(0.,0.,0.,smoothstep(uFrom,1.,x));}`,
  }));
  veil.frustumCulled = false; veilScene.add(veil);

  const entries = new Set(), last = new Map();
  let width = 0, height = 0, dirty = true, frame = 0, previous = performance.now(), host = null;
  const resize = () => {
    // The page's own width (window.innerWidth would include a scrollbar, stretching the drawing and shifting it off the
    // islands' stages by that much at the right edge).
    width = document.documentElement.clientWidth; height = window.innerHeight;
    renderer.setSize(width, height, false); dirty = true;
  };
  window.addEventListener("resize", resize); resize();
  // (A scrollbar coming or going changes the page width without a window resize.)
  new ResizeObserver(() => { if (document.documentElement.clientWidth !== width) resize(); }).observe(document.documentElement);

  function loop(now) {
    frame = requestAnimationFrame(loop);
    const dt = Math.min((now - previous) / 1000, .1); previous = now;
    const visible = [];
    for (const entry of entries) {
      if (entry.draw(dt)) dirty = true;
      const r = entry.mount.getBoundingClientRect();
      const key = `${r.left.toFixed(1)},${r.top.toFixed(1)},${r.width.toFixed(1)},${r.height.toFixed(1)}`;
      if (last.get(entry) !== key) { last.set(entry, key); dirty = true; }
      if (r.width > 0 && r.bottom > 0 && r.top < height) visible.push([entry, r]);
    }
    if (!dirty || document.hidden) return;
    dirty = false;
    renderer.setViewport(0, 0, width, height); renderer.clear();
    for (const [entry, r] of visible) {
      renderer.toneMappingExposure = entry.exposure ?? 1.05;
      renderer.clearDepth();
      // Three's viewport is in CSS pixels from the bottom left; it may run off the canvas, which simply clips it.
      {
        // An island: drawn into its rectangle grown by half its height above and below, with the projection squeezed to
        // match, so it lands exactly where it would but anything reaching past the stage's edge (the underside of an
        // island as it travels) isn't cut off.
        // (A scene that fills its frame edge to edge, like the coast, sets overscan: 0 and stays inside its rectangle.)
        const over = entry.overscan ?? OVERSCAN, grow = 1 + over * 2, projection = entry.camera.projectionMatrix;
        renderer.setViewport(r.left, height - r.bottom - r.height * over, r.width, r.height * grow);
        saved.copy(projection); projection.premultiply(squeeze.makeScale(1, 1 / grow, 1));
        renderer.render(entry.scene, entry.camera);
        projection.copy(saved);
        renderer.setViewport(r.left, height - r.bottom, r.width, r.height);
      }
      if (entry.fade) {
        veilUniforms.uFrom.value = entry.fade.from; veilUniforms.uDir.value = entry.fade.side === "left" ? -1 : 1; veilUniforms.uAxis.value = entry.fade.side === "top" ? 1 : 0;
        renderer.render(veilScene, flat);
      }
    }
  }

  return {
    renderer,
    // Put the canvas in the page and start the loop.
    attach(element) {
      if (host === element) return;
      host = element; element.prepend(canvas);
      if (!frame) { previous = performance.now(); frame = requestAnimationFrame(loop); }
    },
    register(entry) { entries.add(entry); dirty = true; return () => { entries.delete(entry); last.delete(entry); dirty = true; }; },
    invalidate() { dirty = true; },
    detach() {
      cancelAnimationFrame(frame); frame = 0; host = null; canvas.remove();
    },
  };
}
