import * as THREE from "three";

const VERTEX = `
uniform vec4 uRect;
uniform vec2 uPointer;
uniform float uBend;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec2 p = position.xy;
  float fold = (1.0 - p.x * p.x) * (1.0 - 0.4 * p.y * p.y);
  p.x += uPointer.x * 0.026 * p.y;
  p.y += (uPointer.y * 0.024 + uBend) * fold;
  gl_Position = vec4(uRect.xy + p * uRect.zw, 0.0, 1.0);
}
`;

const FRAGMENT = `
uniform sampler2D uPoster, uVideo;
uniform vec2 uSize, uPosterCrop, uVideoCrop;
uniform float uVideoBlend;
varying vec2 vUv;

void main() {
  vec2 q = abs((vUv - 0.5) * uSize) - uSize * 0.5 + 20.0;
  float edge = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 20.0;
  if (edge > 1.0) discard;
  vec4 poster = texture2D(uPoster, (vUv - 0.5) * uPosterCrop + 0.5);
  vec4 color = poster;
  if (uVideoBlend > 0.0) {
    vec4 frame = texture2D(uVideo, (vUv - 0.5) * uVideoCrop + 0.5);
    color = mix(poster, sRGBTransferEOTF(frame), uVideoBlend);
  }
  color.rgb = mix(color.rgb, vec3(0.86, 0.80, 0.96), 0.32 * smoothstep(-2.0, 0.0, edge));
  gl_FragColor = vec4(color.rgb, 1.0 - smoothstep(-0.75, 1.0, edge));
  #include <colorspace_fragment>
}
`;

// Render a single sheet on the existing sky canvas. The empty link anchor supplies the responsive rectangle
// and a CSS poster while a texture loads or WebGL is unavailable.
export function createWorkSheet(renderer, canvas, anchor, projects) {
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const geometry = new THREE.PlaneGeometry(2, 2, 24, 12);
  const uniforms = {
    uRect: { value: new THREE.Vector4() },
    uPointer: { value: new THREE.Vector2() },
    uBend: { value: 0 },
    uSize: { value: new THREE.Vector2() },
    uPoster: { value: null },
    uVideo: { value: null },
    uPosterCrop: { value: new THREE.Vector2(1, 1) },
    uVideoCrop: { value: new THREE.Vector2(1, 1) },
    uVideoBlend: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT,
    transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  let current = -1, poster = null, posterReady = false, disposed = false, contextLost = false;
  let video = null, videoTexture = null, videoStarted = 0, videoFailed = false;
  const loader = new THREE.TextureLoader();
  const ready = value => { anchor.dataset.sheetReady = String(value); };
  const crop = (target, width, height) => {
    const ratio = (width / height) / (uniforms.uSize.value.x / uniforms.uSize.value.y);
    target.set(Math.min(1, 1 / ratio), Math.min(1, ratio));
  };
  const resize = () => {
    const sheet = anchor.getBoundingClientRect(), view = canvas.getBoundingClientRect();
    uniforms.uSize.value.set(sheet.width, sheet.height);
    if (!sheet.width || !sheet.height || !view.width || !view.height) return;
    uniforms.uRect.value.set(
      (sheet.left - view.left + sheet.width / 2) * 2 / view.width - 1,
      1 - (sheet.top - view.top + sheet.height / 2) * 2 / view.height,
      sheet.width / view.width, sheet.height / view.height,
    );
    if (posterReady) crop(uniforms.uPosterCrop.value, poster.image.width, poster.image.height);
    if (video?.videoWidth) crop(uniforms.uVideoCrop.value, video.videoWidth, video.videoHeight);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  observer.observe(anchor);
  resize();

  function stopVideo() {
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
    videoTexture?.dispose();
    video = videoTexture = null;
    uniforms.uVideo.value = null;
    uniforms.uVideoBlend.value = 0;
    videoStarted = 0;
  }

  function showProject(index) {
    stopVideo();
    poster?.dispose();
    posterReady = videoFailed = false;
    current = index;
    ready(false);
    const pending = loader.load(projects[index].previewImage, texture => {
      if (disposed || poster !== texture) {
        texture.dispose();
        return;
      }
      posterReady = true;
      uniforms.uPoster.value = texture;
      resize();
    });
    pending.colorSpace = THREE.SRGBColorSpace;
    poster = pending;
  }

  function startVideo(src) {
    const media = document.createElement("video");
    media.muted = true;
    media.loop = true;
    media.playsInline = true;
    media.src = src;
    video = media;
    videoTexture = new THREE.VideoTexture(media);
    uniforms.uVideo.value = videoTexture;
    const fail = () => {
      if (video !== media) return;
      videoFailed = true;
      stopVideo();
    };
    media.addEventListener("error", fail, { once: true });
    media.play().catch(fail);
  }

  const onLost = () => { contextLost = true; stopVideo(); ready(false); };
  const onRestored = () => { contextLost = false; resize(); };
  const onVisibility = () => { if (document.hidden) stopVideo(); };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  document.addEventListener("visibilitychange", onVisibility);

  return {
    render(index, { visible, reduced, pointer, speed, now }) {
      if (!visible || contextLost || !uniforms.uSize.value.x) {
        if (video) stopVideo();
        return;
      }
      if (current !== index) showProject(index);
      if (!posterReady) return;
      if (reduced && video) stopVideo();
      const source = projects[index].thumbnailVideo;
      if (source && !reduced && !video && !videoFailed) startVideo(source);
      if (video?.readyState >= 2 && !video.paused) {
        if (!videoStarted) {
          videoStarted = now;
          crop(uniforms.uVideoCrop.value, video.videoWidth, video.videoHeight);
        }
        uniforms.uVideoBlend.value = Math.min(1, (now - videoStarted) / 260);
      }
      uniforms.uPointer.value.copy(pointer).multiplyScalar(reduced ? 0 : 1);
      uniforms.uBend.value = reduced ? 0 : Math.min(0.025, Math.abs(speed) * 0.008);
      const clear = renderer.autoClear;
      renderer.autoClear = false;
      renderer.render(scene, camera);
      renderer.autoClear = clear;
      if (anchor.dataset.sheetReady !== "true") ready(true);
    },
    dispose() {
      disposed = true;
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      document.removeEventListener("visibilitychange", onVisibility);
      stopVideo();
      poster?.dispose();
      geometry.dispose();
      material.dispose();
      ready(false);
    },
  };
}
