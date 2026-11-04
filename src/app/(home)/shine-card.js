"use client";
import { useEffect, useRef, useState } from "react";

// A Work project card: the picture (or its looping preview), a frosted name pill, and a shader overlay drawn into a
// small 2D canvas over it, blended with "screen" so black leaves the picture untouched.
// Idle, the overlay is a faint drifting grain, like film grain on a cinema frame. Under a mouse it adds a
// holographic foil: a rainbow whose hue turns with the cursor's angle round the card's centre, strongest at the
// cursor and gone by the edges, plus a small specular glint that follows it. Hover fades in over 0.4 s, out over
// 0.6 s. Touch screens keep the grain only.
// All cards share ONE WebGL context (an unattached canvas): each frame, each card on screen is drawn into a corner of
// it at its own size and copied across to the card's canvas. Cards off screen, or a hidden tab, cost nothing; with
// reduced motion the grain holds still.
const VERTEX = "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
const FRAGMENT = `precision mediump float;varying vec2 v;uniform vec2 uMouse,uSize;uniform float uTime,uHover;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
vec3 hsl(float h,float s,float l){vec3 k=clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);return l+(1.-abs(2.*l-1.))*s*(k-.5);}
void main(){
  // Grain: three octaves of value noise, drifting slowly, large cells (a few pixels), white at 5% (8% on hover).
  vec2 px=v*uSize,drift=vec2(uTime*.08)*40.;
  float n=noise(px/5.+drift)*.55+noise(px/2.6-drift*1.3)*.3+noise(px/1.4+drift*.7)*.15;
  vec3 col=vec3(smoothstep(.35,.95,n)*mix(.05,.08,uHover));
  // Foil: hue from the cursor's angle round the centre (shifted a little across the card so it reads as foil), fading
  // from the cursor to nothing by the edges; and a gaussian glint at the cursor. Aspect-corrected distances.
  vec2 aspect=vec2(uSize.x/uSize.y,1.),d=(v-uMouse)*aspect;float r=length(d);
  float hue=atan(uMouse.y-.5,uMouse.x-.5)/6.2832+.5+dot(v-uMouse,vec2(.35,.2));
  col+=hsl(fract(hue),.9,.65)*.22*(1.-smoothstep(.3,.8,r))*uHover;
  col+=vec3(.3*exp(-r*r/(.15*.15)))*uHover;
  gl_FragColor=vec4(col,1.);
}`;

let shared = null;
function getShared() {
  if (shared !== null) return shared;
  const canvas = document.createElement("canvas"), gl = canvas.getContext("webgl", { alpha: false, antialias: false, preserveDrawingBuffer: true });
  if (!gl) return (shared = false);
  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX)); gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program); gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const at = gl.getAttribLocation(program, "p"); gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
  const u = name => gl.getUniformLocation(program, name);
  const uniforms = { mouse: u("uMouse"), size: u("uSize"), time: u("uTime"), hover: u("uHover") };
  const cards = new Set(), reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0, previous = 0, time = 0, idle = 0;

  function loop(now) {
    frame = 0;
    const dt = Math.min((now - (previous || now)) / 1000, .1); previous = now;
    if (!reduced.matches) time += dt;
    const live = [...cards].filter(c => c.visible);
    if (document.hidden || !live.length) { previous = 0; return; }
    // Idle grain drifts so slowly that 30 fps is plenty; full rate while any card's foil is fading in, out or tracking.
    const active = live.some(c => c.hover > 0 || c.target > 0);
    idle += dt;
    if (active || idle >= 1 / 30 - .002 || live.some(c => c.dirty)) {
      idle = 0;
      for (const c of live) {
        // Hover strength: linear in time (0.4 s in, 0.6 s out), eased in the shader's input.
        c.hover = c.target ? Math.min(1, c.hover + dt / .4) : Math.max(0, c.hover - dt / .6);
        const w = c.canvas.width, h = c.canvas.height;
        if (!w || !h) continue;
        if (canvas.width < w || canvas.height < h) { canvas.width = Math.max(canvas.width, w); canvas.height = Math.max(canvas.height, h); }
        gl.viewport(0, 0, w, h);
        const k = c.hover * c.hover * (3 - 2 * c.hover);
        gl.uniform2f(uniforms.mouse, c.mouse[0], c.mouse[1]); gl.uniform2f(uniforms.size, w, h);
        gl.uniform1f(uniforms.time, time + c.seed); gl.uniform1f(uniforms.hover, k);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        // The drawn corner is the bottom left of the GL canvas, i.e. its last h rows from the top.
        c.context.clearRect(0, 0, w, h);
        c.context.drawImage(canvas, 0, canvas.height - h, w, h, 0, 0, w, h);
        c.dirty = false;
      }
    }
    if (!reduced.matches || active || live.some(c => c.dirty)) frame = requestAnimationFrame(loop);
  }
  const wake = () => { if (!frame) frame = requestAnimationFrame(loop); };
  document.addEventListener("visibilitychange", wake);
  reduced.addEventListener("change", wake);
  return (shared = { cards, wake });
}

export default function ShineCard({ index, href, name, children }) {
  const card = useRef(null), canvas = useRef(null), [shown, setShown] = useState(false);
  const state = useRef(null);
  useEffect(() => {
    const el = card.current, overlay = canvas.current, gl = getShared();
    // Entrance: the first time a fifth of the card is on screen.
    const enter = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setShown(true); enter.disconnect(); } }, { threshold: .2 });
    enter.observe(el);
    if (!gl) return () => enter.disconnect();
    const s = state.current = { canvas: overlay, context: overlay.getContext("2d"), visible: false, hover: 0, target: 0, mouse: [.5, .5], seed: index * 13.7, dirty: true };
    gl.cards.add(s);
    // The overlay's pixels match the card's (capped at 1.5x; the grain is soft, so more is wasted).
    const size = () => {
      const ratio = Math.min(devicePixelRatio, 1.5), w = Math.round(overlay.clientWidth * ratio), h = Math.round(overlay.clientHeight * ratio);
      if (overlay.width !== w || overlay.height !== h) { overlay.width = w; overlay.height = h; s.dirty = true; gl.wake(); }
    };
    const resize = new ResizeObserver(size); resize.observe(overlay); size();
    const seen = new IntersectionObserver(([entry]) => { s.visible = entry.isIntersecting; if (s.visible) { s.dirty = true; gl.wake(); } });
    seen.observe(el);
    return () => { enter.disconnect(); resize.disconnect(); seen.disconnect(); gl.cards.delete(s); };
  }, [index]);

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
    <a ref={card} href={href} className={`ht-shine${index % 2 ? " is-right" : " is-left"}${shown ? " is-in" : ""}`}
      aria-label={`${name}: view the project`} onPointerEnter={track} onPointerMove={track} onPointerLeave={leave}>
      {children}
      <canvas ref={canvas} className="ht-shine-overlay" aria-hidden="true" />
      <span className="ht-shine-pill" aria-hidden="true">{number} · {name} →</span>
    </a>
  );
}
