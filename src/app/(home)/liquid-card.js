"use client";
import { useEffect, useRef } from "react";

// A project card: just the preview, with a shader ripple that runs through it when the pointer passes over (or when it
// first lands). Rings spread out from the pointer like a drop in water, with a little digital glitch on top: thin
// horizontal slices that jump sideways and an RGB split that follows the ripple's strength. It's drawn by a tiny
// WebGL canvas laid exactly over the picture, created on first use, only visible and only running while the ripple
// lasts; the picture itself (image or playing video) is its texture. Reduced motion, or no WebGL: no ripple.
const VERTEX = "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
const FRAGMENT = `precision mediump float;varying vec2 v;uniform sampler2D t;uniform vec2 m,cover;uniform float a,time,aspect;
float hash(float x){return fract(sin(x*91.7)*43758.5453);}
void main(){
  vec2 uv=v;vec2 d=uv-m;d.x*=aspect;float r=length(d);
  // Water: rings racing out from the pointer, strongest close to it.
  float wave=sin(r*42.-time*11.)*exp(-r*3.2)*a;
  uv+=normalize(d+1e-5)/vec2(aspect,1.)*wave*.03;
  // Glitch: a few thin bands slip sideways now and then.
  float band=floor(uv.y*32.+floor(time*14.)*7.),slip=step(.9-a*.12,hash(band))*(hash(band+3.)-.5)*.07*a;
  uv.x+=slip;
  // Cover-fit the picture, then split its channels by the ripple's strength.
  vec2 q=(uv-.5)*cover+.5,s=vec2((.006+abs(wave)*.03)*a,0.);
  float cr=texture2D(t,q+s).r,cg=texture2D(t,q).g,cb=texture2D(t,q-s).b;
  gl_FragColor=vec4(cr,cg,cb,1.);
}`;

export default function LiquidCard({ id, href, label, placed, children }) {
  const media = useRef(null), canvas = useRef(null);
  const state = useRef({ amount: 0, frame: 0, time: 0, gl: null, mouse: [.5, .5], x: 0, y: 0, t: 0 });

  // Set up the shader the first time it's needed.
  const setup = () => {
    const s = state.current;
    if (s.gl !== null) return s.gl;
    const el = canvas.current, gl = el?.getContext("webgl", { premultipliedAlpha: false, antialias: false });
    if (!gl) { s.gl = false; return false; }
    const shader = (type, src) => { const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh); return sh; };
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX)); gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program); gl.useProgram(program);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const at = gl.getAttribLocation(program, "p"); gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    for (const [k, v] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    const u = name => gl.getUniformLocation(program, name);
    s.gl = { gl, texture, uniforms: { m: u("m"), cover: u("cover"), a: u("a"), time: u("time"), aspect: u("aspect") } };
    return s.gl;
  };

  const run = () => {
    const s = state.current;
    if (s.frame || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = setup();
    if (!ctx) return;
    let previous = performance.now();
    const step = now => {
      const dt = Math.min((now - previous) / 1000, .05); previous = now;
      s.amount *= Math.exp(-dt * 2.2); s.time += dt;
      const el = canvas.current, picture = media.current?.querySelector("img,video");
      if (!el || !picture || s.amount < .02) { s.amount = 0; s.frame = 0; if (el) el.style.opacity = "0"; return; }
      const w = el.clientWidth, h = el.clientHeight, ratio = Math.min(devicePixelRatio, 2);
      if (el.width !== Math.round(w * ratio)) { el.width = Math.round(w * ratio); el.height = Math.round(h * ratio); }
      const { gl, uniforms } = ctx, pw = picture.videoWidth || picture.naturalWidth, ph = picture.videoHeight || picture.naturalHeight;
      if (pw && ph) {
        try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, picture); } catch { s.amount = 0; }
        // Cover fit: show the middle of the picture at the card's shape, like object-fit: cover.
        const box = w / h, pic = pw / ph;
        gl.uniform2f(uniforms.cover, box < pic ? box / pic : 1, box < pic ? 1 : pic / box);
        gl.viewport(0, 0, el.width, el.height);
        gl.uniform2f(uniforms.m, s.mouse[0], s.mouse[1]); gl.uniform1f(uniforms.a, Math.min(1, s.amount));
        gl.uniform1f(uniforms.time, s.time); gl.uniform1f(uniforms.aspect, box);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); el.style.opacity = "1";
      }
      s.frame = requestAnimationFrame(step);
    };
    s.frame = requestAnimationFrame(step);
  };
  const stir = amount => { const s = state.current; s.amount = Math.min(1.2, Math.max(s.amount, amount)); run(); };

  // A ripple from the middle when it first lands.
  useEffect(() => { if (placed) { state.current.mouse = [.5, .5]; stir(.9); } }, [placed]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => {
    const s = state.current; cancelAnimationFrame(s.frame);
    if (s.gl) s.gl.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }, []);

  const onMove = event => {
    const s = state.current, rect = media.current.getBoundingClientRect(), now = performance.now(), dt = Math.max(16, now - s.t);
    const speed = Math.hypot(event.clientX - s.x, event.clientY - s.y) / dt;
    s.x = event.clientX; s.y = event.clientY; s.t = now;
    s.mouse = [(event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height];
    stir(Math.min(1.2, .35 + speed * .6));
  };

  return (
    <a href={href} aria-label={label} className="ht-liquid" onPointerEnter={() => stir(.7)} onPointerMove={onMove}>
      <span className="ht-liquid-media" ref={media}>
        {children}
        <canvas ref={canvas} className="ht-liquid-shader" aria-hidden="true" />
      </span>
    </a>
  );
}
