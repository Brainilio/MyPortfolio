import * as THREE from "three";

// The homepage's one WebGL canvas: fixed, full screen, behind the page, drawn by one renderer in one frame loop that
// runs for the life of the page. It paints the sky (a five-stop vertical gradient, on the GPU), then every island
// whose section is on screen, each from its own scene and camera, into the rectangle its section's stage occupies
// right now. The stages are sticky, so an island holds still while its section is pinned and travels up and away with
// the page as the next one arrives; no layer is ever faded. The stage elements themselves stay in the page as
// transparent hit areas, so each island's pointer handling (drag to spin, taps, hover) works unchanged.
//
// An island registers { mount, scene, camera, draw(dt), exposure, fade? }: mount is its stage element, draw advances its
// animation (it decides how often) and returns true when anything changed, exposure its tone-mapping exposure, and
// fade ({ side, from }) fades it out toward one edge on wide screens.
let stage = null;

export function getStage() {
  if (!stage) stage = createStage();
  return stage;
}

function createStage() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" }); } catch { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.autoClear = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const canvas = renderer.domElement;
  canvas.className = "ht-world";
  canvas.setAttribute("aria-hidden", "true");

  // The sky: a quad over the whole screen, five colours from top to bottom (stops at 0, 30, 55, 80 and 100%).
  const colors = Array.from({ length: 5 }, () => new THREE.Color());
  const skyScene = new THREE.Scene(), skyCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: { uColors: { value: colors } },
    vertexShader: "varying float vY;void main(){vY=uv.y;gl_Position=vec4(position.xy,0.,1.);}",
    fragmentShader: `uniform vec3 uColors[5];varying float vY;void main(){
      float t=1.-vY;vec3 c=mix(uColors[0],uColors[1],smoothstep(0.,.3,t));c=mix(c,uColors[2],smoothstep(.3,.55,t));
      c=mix(c,uColors[3],smoothstep(.55,.8,t));c=mix(c,uColors[4],smoothstep(.8,1.,t));gl_FragColor=vec4(c,1.);}`,
  }));
  sky.frustumCulled = false; skyScene.add(sky);
  // An island can fade out toward one edge of its rectangle (toward the words beside it): the sky is painted back over
  // that strip with a rising alpha, which on an island floating in open sky is the same as fading the island itself.
  const veilUniforms = { uColors: { value: colors }, uScreen: { value: new THREE.Vector2(1, 1) }, uFrom: { value: .75 }, uDir: { value: 1 } };
  const veilScene = new THREE.Scene(), veil = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false, toneMapped: false, transparent: true, uniforms: veilUniforms,
    vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
    fragmentShader: `uniform vec3 uColors[5];uniform vec2 uScreen;uniform float uFrom,uDir;varying vec2 vUv;void main(){
      float t=1.-gl_FragCoord.y/uScreen.y;vec3 c=mix(uColors[0],uColors[1],smoothstep(0.,.3,t));c=mix(c,uColors[2],smoothstep(.3,.55,t));
      c=mix(c,uColors[3],smoothstep(.55,.8,t));c=mix(c,uColors[4],smoothstep(.8,1.,t));
      float x=uDir>0.?vUv.x:1.-vUv.x;gl_FragColor=vec4(c,smoothstep(uFrom,1.,x));}`,
  }));
  veil.frustumCulled = false; veilScene.add(veil);

  const entries = new Set(), last = new Map();
  let width = 0, height = 0, dirty = true, frame = 0, previous = performance.now(), host = null;
  const resize = () => {
    width = window.innerWidth; height = window.innerHeight;
    renderer.setSize(width, height, false); dirty = true;
  };
  window.addEventListener("resize", resize); resize();

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
    visible.sort((a, b) => (a[0].order ?? 1) - (b[0].order ?? 1));
    if (!dirty || document.hidden) return;
    dirty = false;
    renderer.setViewport(0, 0, width, height); renderer.clear(); renderer.render(skyScene, skyCamera);
    for (const [entry, r] of visible) {
      renderer.toneMappingExposure = entry.exposure ?? 1.05;
      renderer.clearDepth();
      // Three's viewport is in CSS pixels from the bottom left; it may run off the canvas, which simply clips it.
      renderer.setViewport(r.left, height - r.bottom, r.width, r.height);
      renderer.render(entry.scene, entry.camera);
      if (entry.fade) {
        veilUniforms.uScreen.value.set(width * renderer.getPixelRatio(), height * renderer.getPixelRatio());
        veilUniforms.uFrom.value = entry.fade.from; veilUniforms.uDir.value = entry.fade.side === "right" ? 1 : -1;
        renderer.render(veilScene, skyCamera);
      }
    }
  }

  return {
    renderer,
    // Put the canvas in the page (behind everything) and start the loop.
    attach(element) {
      if (host === element) return;
      host = element; element.prepend(canvas); element.classList.add("has-world");
      if (!frame) { previous = performance.now(); frame = requestAnimationFrame(loop); }
    },
    register(entry) { entries.add(entry); dirty = true; return () => { entries.delete(entry); last.delete(entry); dirty = true; }; },
    // The sky's five colours, each [r, g, b] 0–255.
    // (Written to the screen as given: the sky shader skips colour management, so these stay the exact sRGB values.)
    setSky(rgb) { rgb.forEach((c, i) => colors[i].setRGB(c[0] / 255, c[1] / 255, c[2] / 255)); dirty = true; },
    invalidate() { dirty = true; },
    // Paints an element's text (the hero's giant name) onto the canvas, behind the islands, so the peaks can rise in
    // front of it; the element stays in the page for screen readers and layout, its own text made invisible.
    text(element) {
      const paint = document.createElement("canvas"), texture = new THREE.CanvasTexture(paint);
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
      const layer = new THREE.Scene(), plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      plane.frustumCulled = false; layer.add(plane);
      let opacity = -1;
      const draw = () => {
        const r = element.getBoundingClientRect(), style = getComputedStyle(element), ratio = renderer.getPixelRatio(), g = paint.getContext("2d");
        paint.width = Math.max(1, Math.round(r.width * ratio)); paint.height = Math.max(1, Math.round(r.height * ratio));
        g.scale(ratio, ratio);
        g.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`; g.letterSpacing = style.letterSpacing;
        g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = element.dataset.color || "#fbf7ff";
        g.shadowColor = "rgba(255,190,170,.25)"; g.shadowBlur = 80;
        g.fillText(element.textContent, r.width / 2, r.height / 2);
        texture.needsUpdate = true; dirty = true;
      };
      element.classList.add("is-painted");
      draw(); document.fonts?.ready.then(draw);
      const onResize = () => draw(); window.addEventListener("resize", onResize);
      const entry = { mount: element, scene: layer, camera: skyCamera, order: 0, exposure: 1,
        // Follows the element's own fade (its entrance animation).
        draw() { const o = +getComputedStyle(element).opacity; if (o === opacity) return false; opacity = o; material.opacity = o; return true; } };
      const unregister = this.register(entry);
      return () => { unregister(); window.removeEventListener("resize", onResize); element.classList.remove("is-painted"); texture.dispose(); material.dispose(); };
    },
    detach() {
      cancelAnimationFrame(frame); frame = 0; host?.classList.remove("has-world"); host = null; canvas.remove();
    },
  };
}
