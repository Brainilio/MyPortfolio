"use client";
import { useEffect, useRef, useState } from "react";

// A Work project card: the picture (or its looping preview), drawn by a shader so it can move like something soft:
// the faster the page scrolls, the more the card sways in a slight, fluid ripple, and when the scroll stops it eases
// back. On top: a faint drifting grain at rest and, under a mouse, a holographic foil
// (a rainbow whose hue turns with the cursor's angle round the card's centre, strongest at the cursor and gone by the
// edges) plus a small specular glint; hover fades in over 0.4 s, out over 0.6 s. Touch screens get the bend and the
// grain, no foil. The card's corners are drawn too, so they bend with it.
// All cards share ONE WebGL context (an unattached canvas): each frame, each card on screen is drawn into a corner of
// it at its own size and copied across to its own 2D canvas. Cards off screen, or a hidden tab, cost nothing. With
// reduced motion there's no bend and the grain holds still. Without WebGL the plain picture shows.
const MARGIN = .18; // the canvas reaches this fraction of the card's height above and below it, room to bend into
const RADIUS = 6; // corner radius, CSS pixels
const VERTEX = "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
const FRAGMENT = `precision mediump float;varying vec2 v;uniform sampler2D uTex;
uniform vec2 uMouse,uSize,uCover;uniform float uTime,uHover,uBend,uMargin,uRadius,uHas;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
vec3 hsl(float h,float s,float l){vec3 k=clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);return l+(1.-abs(2.*l-1.))*s*(k-.5);}
float box(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
void main(){
  // Card space: x 0-1 across, y 0-1 up the card. The bend is soft and fluid rather than a fold: a long, shallow
  // S-shaped sway across the card that drifts slowly (one side trails a little more than the other), never a peak.
  float h=1.-2.*uMargin;vec2 uv=vec2(v.x,(v.y-uMargin)/h);
  float x=uv.x,flow=sin(3.14159*x)*.55+sin(3.14159*(x+.5)+uTime*.6)*.3+(x-.5)*.25;
  uv.y+=uBend*flow;
  vec2 px=uv*vec2(uSize.x,uSize.y*h);
  float d=box(px-vec2(uSize.x,uSize.y*h)*.5,vec2(uSize.x,uSize.y*h)*.5,uRadius);
  float inside=1.-smoothstep(-.75,.75,d);
  vec3 pic=uHas>.5?texture2D(uTex,(uv-.5)*uCover+.5).rgb:mix(vec3(.55,.36,.93),vec3(.96,.63,.54),uv.x*.6+uv.y*.4);
  // Grain: three octaves of value noise, drifting slowly, large cells, white at 5% (8% on hover).
  vec2 drift=vec2(uTime*.08)*40.;
  float n=noise(px/5.+drift)*.55+noise(px/2.6-drift*1.3)*.3+noise(px/1.4+drift*.7)*.15;
  vec3 add=vec3(smoothstep(.35,.95,n)*mix(.05,.08,uHover));
  // Foil and glint (aspect-corrected distances to the cursor).
  vec2 dm=(uv-uMouse)*vec2(uSize.x/(uSize.y*h),1.);float r=length(dm);
  float hue=atan(uMouse.y-.5,uMouse.x-.5)/6.2832+.5+dot(uv-uMouse,vec2(.35,.2));
  add+=hsl(fract(hue),.9,.65)*.22*(1.-smoothstep(.3,.8,r))*uHover;
  add+=vec3(.3*exp(-r*r/(.15*.15)))*uHover;
  vec3 col=1.-(1.-pic)*(1.-add);
  // Premultiplied. (Its shadow is a CSS drop-shadow on the canvas, which follows the bent shape.)
  gl_FragColor=vec4(col*inside,inside);
}`;

let shared = null;
function getShared() {
  if (shared !== null) return shared;
  const canvas = document.createElement("canvas"), gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true });
  if (!gl) return (shared = false);
  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX)); gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return (shared = false);
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const at = gl.getAttribLocation(program, "p"); gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const u = name => gl.getUniformLocation(program, name);
  const uniforms = Object.fromEntries(["uMouse", "uSize", "uCover", "uTime", "uHover", "uBend", "uMargin", "uRadius", "uHas"].map(n => [n, u(n)]));
  const cards = new Set(), reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0, previous = 0, time = 0, idle = 0, lastY = window.scrollY;
  // The bend: a spring chasing the scroll speed, under-damped so it overshoots and wobbles back when you stop.
  const bend = { x: 0, v: 0 };

  function texture(c) {
    const picture = c.media();
    if (!picture) return false;
    const w = picture.videoWidth || picture.naturalWidth, h = picture.videoHeight || picture.naturalHeight;
    if (!w || !h) return false;
    if (!c.texture) {
      c.texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, c.texture);
      for (const [k, val] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]]) gl.texParameteri(gl.TEXTURE_2D, k, val);
    } else gl.bindTexture(gl.TEXTURE_2D, c.texture);
    // A still picture goes up once; a playing video every frame it's drawn.
    if (c.source !== picture || picture.tagName === "VIDEO") {
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, picture); c.source = picture; } catch { return false; }
    }
    c.aspect = w / h;
    return true;
  }

  function loop(now) {
    frame = 0;
    const dt = Math.min((now - (previous || now)) / 1000, .05); previous = now;
    const still = reduced.matches;
    if (!still) time += dt;
    // Scroll speed (px/s) → how far the middle of a card trails, as a fraction of its height.
    const y = window.scrollY, speed = dt > 0 ? (y - lastY) / dt : 0; lastY = y;
    const goal = still ? 0 : Math.max(-.055, Math.min(.055, speed / 26000));
    bend.v += ((goal - bend.x) * 90 - bend.v * 15) * dt; bend.x += bend.v * dt;
    const live = [...cards].filter(c => c.visible);
    if (document.hidden || !live.length) { previous = 0; return; }
    const moving = Math.abs(bend.x) > 2e-4 || Math.abs(bend.v) > 2e-3;
    const active = moving || live.some(c => c.hover > 0 || c.target > 0 || c.media()?.tagName === "VIDEO");
    idle += dt;
    if (active || idle >= 1 / 30 - .002 || live.some(c => c.dirty)) {
      idle = 0;
      for (const c of live) {
        c.hover = c.target ? Math.min(1, c.hover + dt / .4) : Math.max(0, c.hover - dt / .6);
        const w = c.canvas.width, h = c.canvas.height;
        if (!w || !h) continue;
        if (canvas.width < w || canvas.height < h) { canvas.width = Math.max(canvas.width, w); canvas.height = Math.max(canvas.height, h); }
        gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        const has = texture(c), cardH = h * (1 - 2 * MARGIN), box = w / cardH, pic = c.aspect || box;
        gl.uniform2f(uniforms.uCover, box < pic ? box / pic : 1, box < pic ? 1 : pic / box);
        gl.uniform1f(uniforms.uHas, has ? 1 : 0);
        const k = c.hover * c.hover * (3 - 2 * c.hover);
        gl.uniform2f(uniforms.uMouse, c.mouse[0], c.mouse[1]); gl.uniform2f(uniforms.uSize, w, h);
        gl.uniform1f(uniforms.uTime, time + c.seed); gl.uniform1f(uniforms.uHover, k);
        gl.uniform1f(uniforms.uBend, -bend.x); gl.uniform1f(uniforms.uMargin, MARGIN); gl.uniform1f(uniforms.uRadius, RADIUS * c.ratio);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        // The drawn corner is the bottom left of the GL canvas, i.e. its last h rows from the top.
        c.context.clearRect(0, 0, w, h);
        c.context.drawImage(canvas, 0, canvas.height - h, w, h, 0, 0, w, h);
        if (has) c.drawn = true;
        c.dirty = !has;
      }
    }
    if (!still || active || live.some(c => c.dirty)) frame = requestAnimationFrame(loop);
  }
  const wake = () => { if (!frame) frame = requestAnimationFrame(loop); };
  document.addEventListener("visibilitychange", wake);
  window.addEventListener("scroll", wake, { passive: true });
  reduced.addEventListener("change", wake);
  return (shared = {
    cards, wake,
    drop(c) { cards.delete(c); if (c.texture) gl.deleteTexture(c.texture); },
  });
}

// (tag: "span" when it sits inside a link of its own, as in the Work card tester's focused layout.)
export default function ShineCard({ index, href, name, children, tag: Tag = "a" }) {
  const card = useRef(null), canvas = useRef(null), [shown, setShown] = useState(false), [drawn, setDrawn] = useState(false);
  const state = useRef(null);
  useEffect(() => {
    const el = card.current, overlay = canvas.current, gl = getShared();
    // Entrance: the first time a fifth of the card is on screen.
    const enter = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setShown(true); enter.disconnect(); } }, { threshold: .2 });
    enter.observe(el);
    if (!gl) return () => enter.disconnect();
    const s = state.current = {
      canvas: overlay, context: overlay.getContext("2d"), visible: false, hover: 0, target: 0, mouse: [.5, .5], seed: index * 13.7, dirty: true, ratio: 1,
      media: () => el.querySelector("img,video"),
    };
    gl.cards.add(s);
    // Once the shader has drawn the picture, the plain one underneath is hidden (it stays as the texture's source).
    const ready = setInterval(() => { if (s.drawn) { setDrawn(true); clearInterval(ready); } }, 100);
    // The canvas's pixels match its size on screen (capped at 1.5x).
    const size = () => {
      const ratio = s.ratio = Math.min(devicePixelRatio, 1.5), w = Math.round(overlay.clientWidth * ratio), h = Math.round(overlay.clientHeight * ratio);
      if (overlay.width !== w || overlay.height !== h) { overlay.width = w; overlay.height = h; s.dirty = true; gl.wake(); }
    };
    const resize = new ResizeObserver(size); resize.observe(overlay); size();
    const seen = new IntersectionObserver(([entry]) => { s.visible = entry.isIntersecting; if (s.visible) { s.dirty = true; gl.wake(); } }, { rootMargin: "20% 0px" });
    seen.observe(el);
    return () => { clearInterval(ready); enter.disconnect(); resize.disconnect(); seen.disconnect(); gl.drop(s); };
  }, [index]);
  // A new picture (the still swapped for the video, or back): draw again.
  useEffect(() => { const s = state.current; if (s) { s.dirty = true; getShared().wake?.(); } });

  // Foil only for a real mouse (touch has no cursor to follow).
  const track = event => {
    const s = state.current; if (!s || event.pointerType !== "mouse") return;
    const r = card.current.getBoundingClientRect();
    s.mouse = [(event.clientX - r.left) / r.width, 1 - (event.clientY - r.top) / r.height];
    s.target = 1; getShared().wake?.();
  };
  const leave = () => { const s = state.current; if (s) { s.target = 0; getShared().wake?.(); } };

  const number = String(index + 1).padStart(2, "0");
  return (
    <Tag ref={card} href={Tag === "a" ? href : undefined} className={`ht-shine${index % 2 ? " is-right" : " is-left"}${shown ? " is-in" : ""}${drawn ? " is-drawn" : ""}`}
      aria-label={Tag === "a" ? `${name}: view the project` : undefined} onPointerEnter={track} onPointerMove={track} onPointerLeave={leave}>
      <span className="ht-shine-media">{children}</span>
      <canvas ref={canvas} className="ht-shine-overlay" aria-hidden="true" />
      <span className="ht-shine-pill" aria-hidden="true">{number} · {name} →</span>
    </Tag>
  );
}
