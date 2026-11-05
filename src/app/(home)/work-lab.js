"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "motion/react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { bakeProp } from "./island-parts";

// The Work section without a diorama: three options to compare (A/B/C), each a pinned screen over a live shader
// background, scroll picking the project (in step with the section pill's counter).
// A: a single autumn tree on a rock (the hero's kit, Quaternius, CC0) spins in the middle, idly, faster the faster you
//    scroll through the projects; the project's name, huge, runs across it in difference blending; a silk shader
//    flows behind, faster with the scroll and turning with each project.
// B: an index: the four names, big, over a topographic-map shader whose contours swell round the pointer; hovering a
//    name brings its picture along under the pointer on a spring, otherwise it rests on the right for the project the
//    scroll is on.
// C: dusk in the forest: pine ridges in parallax and fireflies (all shader), the tree spinning on the left, and the
//    projects as a stack of cards on the right that peel away one by one as you scroll.
// Its own WebGL canvas (the page's shared one sits above the words' layer): drawn only while on screen and the tab is
// visible; reduced motion stops the spin and the flow. Phones get the background and a plain list.

const NOISE = `
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 r=mat2(.8,-.6,.6,.8);for(int i=0;i<5;i++){v+=a*noise(p);p=r*p*2.02;a*=.5;}return v;}`;
const HEAD = `uniform float uTime,uFlow,uIndex,uVel,uHover;uniform vec2 uRes,uMouse;varying vec2 vUv;${NOISE}`;
const BACKGROUNDS = {
  // Silk: domain-warped noise in dusk violets with peach and gold where it folds, turned a little per project.
  a: `${HEAD}
    void main(){
      vec2 p=(vUv-.5)*vec2(uRes.x/uRes.y,1.);float c=cos(uIndex*.7),s=sin(uIndex*.7);p=mat2(c,-s,s,c)*p;
      float t=uFlow;
      vec2 q=vec2(fbm(p*1.3+vec2(0.,t*.12)),fbm(p*1.3+vec2(5.2,1.3)-t*.1));
      vec2 r=vec2(fbm(p*1.5+2.4*q+vec2(1.7,9.2)+t*.15),fbm(p*1.5+2.4*q+vec2(8.3,2.8)-t*.12));
      float f=fbm(p*1.1+2.1*r);
      vec3 col=mix(vec3(.07,.04,.13),vec3(.33,.18,.52),smoothstep(.15,.75,f));
      col=mix(col,vec3(.98,.58,.46),smoothstep(.38,.9,f*length(r)*1.3)*.9);
      col+=vec3(1.,.8,.5)*pow(smoothstep(.55,1.,f),2.)*.5;
      col+=.05*sin(f*38.+t*1.5)*smoothstep(.35,.75,f);
      vec2 m=uMouse*vec2(uRes.x/uRes.y,1.)*.5;col+=vec3(1.,.66,.5)*exp(-dot(p-m*.3,p-m*.3)*4.)*.16;
      col*=1.-.35*dot(p,p);
      col+=(hash(vUv*uRes+fract(uTime*7.))-.5)*.04;
      gl_FragColor=vec4(col,1.);
    }`,
  // Topographic map: contour lines of a drifting height field, every fifth one heavier, swelling round the pointer.
  b: `${HEAD}
    void main(){
      float aspect=uRes.x/uRes.y;vec2 p=(vUv-.5)*vec2(aspect,1.)*2.4,m=uMouse*vec2(aspect,1.)*1.2;
      float dm=length(p-m);p-=(p-m)*.32*exp(-dm*dm*2.5)*uHover;
      float h=fbm(p*.75+vec2(uFlow*.04,uIndex*.3))+.3*fbm(p*1.8+3.1-uFlow*.02);
      float k=h*16.,w=fwidth(k);
      float line=1.-smoothstep(0.,w*1.3,.5-abs(fract(k)-.5));
      float major=1.-smoothstep(0.,w*1.8,(.5-abs(fract(k/5.)-.5))*5.);
      vec3 col=mix(vec3(.07,.1,.09),vec3(.15,.1,.2),vUv.y);
      col+=vec3(.95,.62,.42)*smoothstep(.6,.85,h)*.08;
      float near=exp(-dm*dm*1.6)*uHover;
      vec3 ink=mix(vec3(.55,.7,.58),vec3(1.,.72,.5),near);
      col+=ink*(line*.16+major*.3)*(1.+near*1.6);
      col*=1.-.25*dot(vUv-.5,vUv-.5)*4.;
      col+=(hash(vUv*uRes+fract(uTime*7.))-.5)*.035;
      gl_FragColor=vec4(col,1.);
    }`,
  // Dusk in the forest: a violet sky with a low moon, three ridges of pines in parallax, mist, fireflies.
  c: `${HEAD}
    float ridge(float x,float base,float freq,float tall,float seed){
      float i=floor(x*freq),f=fract(x*freq),h=hash(vec2(i,seed));
      float tooth=(1.-abs(f*2.-1.))*tall*(.55+.45*h);
      return base+.05*fbm(vec2(x*1.5,seed))+tooth;}
    void main(){
      float aspect=uRes.x/uRes.y;vec2 uv=vUv;float x=uv.x*aspect;
      vec3 col=mix(vec3(.32,.18,.33),vec3(.04,.04,.1),smoothstep(.2,1.,uv.y));
      vec2 moon=vec2(.72*aspect,.74);float dmoon=length(vec2(x,uv.y)-moon);
      col+=vec3(1.,.85,.7)*(smoothstep(.055,.05,dmoon)*.85+exp(-dmoon*7.)*.22);
      vec3 layers[3];layers[0]=vec3(.17,.11,.24);layers[1]=vec3(.1,.07,.16);layers[2]=vec3(.035,.03,.07);
      for(int i=0;i<3;i++){float fi=float(i),shift=uFlow*(.04+fi*.05);
        float y=ridge(x+shift+fi*3.7,.34-fi*.1,5.+fi*4.,.12+fi*.05,fi*11.);
        float edge=smoothstep(y+.003,y-.003,uv.y);col=mix(col,layers[i],edge);
        col+=vec3(.5,.35,.6)*.06*exp(-max(0.,uv.y-y)*30.)*(1.-edge)*(2.-fi);}
      // Fireflies: one per cell, wandering, pulsing.
      for(int l=0;l<2;l++){float fl=float(l),d=7.+fl*5.;vec2 g=vec2(x,uv.y)*d+vec2(uFlow*(.2+fl*.15),0.);vec2 id=floor(g);
        float h=hash(id+fl*17.);if(h>.28)continue;
        vec2 pos=id+.5+.35*vec2(sin(uTime*(.6+h)+h*40.),cos(uTime*(.5+h*.7)+h*21.));
        float dd=length(g-pos),pulse=.5+.5*sin(uTime*(1.5+h*2.)+h*30.);
        col+=vec3(1.,.88,.42)*(exp(-dd*dd*120.)*1.+exp(-dd*dd*10.)*.07)*pulse*smoothstep(.65,.15,uv.y);}
      col+=(hash(uv*uRes+fract(uTime*7.))-.5)*.035;
      gl_FragColor=vec4(col,1.);
    }`,
};

// What a recruiter wants at a glance: its year and kind of work, and the first few tools (all from the project data).
// (Dates written in capitals in the data are shown in sentence case.)
const tidy = text => text && text === text.toUpperCase() ? text.charAt(0) + text.slice(1).toLowerCase() : text;
const metaOf = p => [tidy(p.dateCreated), p.category].filter(Boolean).join(" · ");

export default function WorkLab({ variant, work, scene, slot, onReady }) {
  const root = useRef(null), canvas = useRef(null), front = useRef(null), stack = useRef(null);
  const ready = useRef(onReady); ready.current = onReady;
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(-1);
  const mouse = useRef({ x: 0, y: 0, inside: false });
  // The pointer-following preview (B): springs toward the pointer.
  const px = useMotionValue(0), py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 220, damping: 26, mass: .6 }), sy = useSpring(py, { stiffness: 220, damping: 26, mass: .6 });
  const n = work.length;

  useEffect(() => {
    const host = root.current, el = canvas.current, fg = front.current;
    if (!host || !el) return;
    // Two canvases: the shader background, and over it (and over A's name) the tree, on a transparent one.
    let renderer, treeRenderer = null;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: el, antialias: false, powerPreference: "high-performance" });
      if (fg) { treeRenderer = new THREE.WebGLRenderer({ canvas: fg, antialias: true, alpha: true }); treeRenderer.setClearColor(0, 0); }
    } catch { ready.current?.(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    if (treeRenderer) { treeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); treeRenderer.toneMapping = THREE.ACESFilmicToneMapping; treeRenderer.toneMappingExposure = 1.05; }
    const flat = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), backScene = new THREE.Scene();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const scene3 = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
    camera.position.set(0, .35, 9); camera.lookAt(0, .2, 0);
    const uniforms = { uTime: { value: 0 }, uFlow: { value: 0 }, uIndex: { value: 0 }, uVel: { value: 0 }, uHover: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uMouse: { value: new THREE.Vector2() } };
    const background = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms, depthTest: false, depthWrite: false, toneMapped: false,
      vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,.999,1.);}",
      fragmentShader: BACKGROUNDS[variant] }));
    background.frustumCulled = false; backScene.add(background);

    // The tree on its rock (A in the middle, C on the left), lit warm from the upper left.
    const piece = new THREE.Group(), spinner = new THREE.Group(); piece.add(spinner);
    let pieceGeometries = [];
    if (variant !== "b") {
      scene3.add(new THREE.HemisphereLight("#ffe2c4", "#3a2a4a", 1.4));
      const sun = new THREE.DirectionalLight("#ffd2a0", 2.4); sun.position.set(-4, 6, 5); scene3.add(sun);
      const rim = new THREE.DirectionalLight("#b48cff", 1.2); rim.position.set(4, 2, -4); scene3.add(rim);
      scene3.add(piece);
      new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load("/models/island/kit.glb", gltf => {
        if (disposed) return;
        const find = name => { let found = null; gltf.scene.traverse(o => { if (!found && o.name.startsWith(name)) found = o; }); return found; };
        const treeNode = find("CommonTree_Autumn"), rockNode = find("Rock");
        if (!treeNode || !rockNode) return;
        const material = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
        treeNode.position.set(0, 0, 0); rockNode.position.set(0, 0, 0);
        const tree = bakeProp(treeNode), rock = bakeProp(rockNode);
        // The tree 2.2 tall; the rock under it, half again as wide as the trunk's spread, its top just under the roots.
        tree.computeBoundingBox(); const tb = tree.boundingBox, ts = 2.2 / (tb.max.y - tb.min.y), tc = tb.getCenter(new THREE.Vector3());
        tree.translate(-tc.x, -tb.min.y, -tc.z).scale(ts, ts, ts);
        rock.computeBoundingBox(); const rb = rock.boundingBox, rw = Math.max(rb.max.x - rb.min.x, rb.max.z - rb.min.z), rs = 1.5 / rw, rc = rb.getCenter(new THREE.Vector3());
        rock.translate(-rc.x, -rb.max.y, -rc.z).scale(rs, rs * 1.1, rs);
        rock.translate(0, .08, 0);
        pieceGeometries = [tree, rock];
        spinner.add(new THREE.Mesh(tree, material), new THREE.Mesh(rock, material));
        spinner.position.y = -1.05;
        dirty = true;
      }, undefined, () => {});
    }

    let width = 0, height = 0, dirty = true, disposed = false, visible = true, frame = 0, last = performance.now();
    let flow = 0, time = 0, spin = 0, speed = .35, vel = 0, prevProgress = scene.current.progress[slot] ?? 0, shown = -1, index = 0;
    const smoothMouse = new THREE.Vector2(), hoverAmount = { v: 0 };
    const resize = () => {
      width = el.clientWidth; height = el.clientHeight; if (!width || !height) return;
      renderer.setSize(width, height, false); treeRenderer?.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
      uniforms.uRes.value.set(width * renderer.getPixelRatio(), height * renderer.getPixelRatio());
      // A: the tree in the middle; C: in the left third (in the frame's own width at the piece's depth).
      const half = Math.tan(THREE.MathUtils.degToRad(15)) * 9 * camera.aspect;
      piece.position.x = variant === "c" ? -half * .42 : 0;
      piece.scale.setScalar(Math.min(1, camera.aspect / 1.2) * (variant === "c" ? .9 : 1));
      dirty = true;
    };
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    const seen = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: "100px" }); seen.observe(host);

    function loop(now) {
      frame = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, .1); last = now;
      const progress = scene.current.progress[slot] ?? 0;
      // Scroll speed in projects per second, smoothed.
      const rate = dt > 0 ? (progress - prevProgress) / dt * (n - 1) : 0; prevProgress = progress;
      vel += (rate - vel) * Math.min(1, dt * 6);
      const at = Math.min(n - 1, Math.max(0, Math.round(progress * (n - 1))));
      if (at !== shown) { if (shown >= 0) speed += 2.2; shown = at; setActive(at); }
      if (!visible || document.hidden) return;
      const still = reduce.matches;
      // The spin: idle, plus however fast you're scrolling, easing back down when you stop.
      const target = still ? 0 : .35 + Math.min(7, Math.abs(vel) * 5);
      speed += (target - speed) * Math.min(1, dt * 2.5);
      if (!still) { time += dt; spin += speed * dt; flow += dt * (.25 + Math.min(4, Math.abs(vel) * 2.5)); }
      index += (progress * (n - 1) - index) * Math.min(1, dt * 4);
      spinner.rotation.y = spin; piece.position.y = still ? 0 : Math.sin(time * 1.1) * .06; piece.rotation.z = Math.max(-.12, Math.min(.12, -vel * .05));
      smoothMouse.lerp(new THREE.Vector2(mouse.current.x, mouse.current.y), Math.min(1, dt * 5));
      hoverAmount.v += ((mouse.current.inside ? 1 : 0) - hoverAmount.v) * Math.min(1, dt * 4);
      uniforms.uTime.value = time; uniforms.uFlow.value = flow; uniforms.uIndex.value = index; uniforms.uVel.value = vel;
      uniforms.uMouse.value.copy(smoothMouse); uniforms.uHover.value = hoverAmount.v;
      // C: the stack of cards, set straight on their styles (no React work per frame).
      if (variant === "c" && stack.current) {
        const c = progress * (n - 1), skew = Math.max(-6, Math.min(6, vel * 3));
        [...stack.current.children].forEach((card, i) => {
          const d = i - c;
          if (d < 0) { // peeling away up and over to the left
            const k = Math.min(1, -d);
            card.style.transform = `translate3d(${-k * 18}%, ${-k * 115}%, 0) rotate(${-k * 14 + skew}deg)`;
            card.style.opacity = String(1 - Math.max(0, k - .55) / .45);
          } else { // waiting underneath, each one a little further back
            card.style.transform = `translate3d(${d * 4}%, ${d * 5}%, 0) scale(${1 - d * .06}) rotate(${d * 3 + skew * (d < 1 ? 1 - d : 0)}deg)`;
            card.style.opacity = d > 2.6 ? "0" : "1";
          }
          card.style.zIndex = String(100 - i);
          card.style.filter = d > 0 ? `brightness(${1 - Math.min(.45, d * .18)})` : "none";
        });
      }
      renderer.render(backScene, flat); treeRenderer?.render(scene3, camera); dirty = false;
    }
    frame = requestAnimationFrame(loop);
    // (The loading screen waits on each section; this one is ready as soon as its canvas is.)
    ready.current?.();
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); seen.disconnect();
      background.geometry.dispose(); background.material.dispose(); pieceGeometries.forEach(g => g.dispose());
      spinner.children.forEach(m => m.material?.dispose?.()); renderer.dispose(); treeRenderer?.dispose();
    };
  }, [variant, scene, slot, n]);

  // Pointer, relative to the pinned screen (-1..1, y up).
  const onMove = e => {
    const r = root.current?.querySelector(".wl-pin")?.getBoundingClientRect(); if (!r) return;
    mouse.current = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -(((e.clientY - r.top) / r.height) * 2 - 1), inside: true };
    if (hover >= 0) { px.set(e.clientX - r.left); py.set(e.clientY - r.top); }
  };
  // B: away from the names, the preview rests on the right (springing back there).
  useEffect(() => {
    if (variant !== "b" || hover >= 0) return;
    const dock = () => { const r = root.current?.querySelector(".wl-pin")?.getBoundingClientRect(); if (r) { px.set(r.width * .73); py.set(r.height * .54); } };
    dock(); window.addEventListener("resize", dock); return () => window.removeEventListener("resize", dock);
  }, [variant, hover, px, py]);
  const onLeave = () => { mouse.current.inside = false; setHover(-1); };
  const project = work[active] ?? work[0];
  const shownB = hover >= 0 ? hover : active;
  const pills = (
    <p className="wl-pills">
      <a href="/projects/">All projects <span aria-hidden="true">→</span></a>
      <a href="/journey/">Lab experiments <span aria-hidden="true">→</span></a>
    </p>
  );

  return (
    <div className={`wl wl-${variant}`} ref={root} style={{ "--n": n }}>
      <div className="wl-pin" onPointerMove={onMove} onPointerLeave={onLeave}>
        <canvas className="wl-canvas" ref={canvas} aria-hidden="true" />
        {variant !== "b" && <canvas className="wl-canvas wl-front" ref={front} aria-hidden="true" />}
        <div className="wl-head">
          <h2 id="ht-work-title" className="wl-title">Things I’ve built</h2>
          {pills}
        </div>

        {variant === "a" && (
          <>
            <a className="wl-a-name" href={`/project/${project.slug}/`} aria-label={`${project.name}: view the project`}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={project.slug} className="wl-a-word" aria-hidden="true">
                  {[...project.name].map((ch, i) => (
                    <motion.span key={i} className="wl-a-char"
                      initial={{ y: "110%", opacity: 0, filter: "blur(10px)" }}
                      animate={{ y: "0%", opacity: 1, filter: "blur(0px)", transition: { delay: i * .028, type: "spring", stiffness: 260, damping: 24 } }}
                      exit={{ y: "-110%", opacity: 0, filter: "blur(10px)", transition: { delay: i * .015, duration: .28, ease: [.6, 0, .9, .4] } }}>
                      {ch === " " ? " " : ch}
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
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.a key={project.slug} className="wl-a-card" href={`/project/${project.slug}/`} tabIndex={-1} aria-hidden="true"
                initial={{ clipPath: "inset(100% 0% 0% 0% round 18px)", rotate: 4, y: 40 }}
                animate={{ clipPath: "inset(0% 0% 0% 0% round 18px)", rotate: -3, y: 0, transition: { duration: .8, ease: [.16, 1, .3, 1] } }}
                exit={{ clipPath: "inset(0% 0% 100% 0% round 18px)", y: -40, transition: { duration: .45, ease: [.7, 0, .84, 0] } }}>
                <img src={project.previewImage} alt="" decoding="async" />
              </motion.a>
            </AnimatePresence>
          </>
        )}

        {variant === "b" && (
          <>
            <ol className="wl-b-list" onPointerLeave={() => setHover(-1)}>
              {work.map((p, i) => (
                <li key={p.slug} className={`${i === active ? "is-active" : ""} ${hover >= 0 && hover !== i ? "is-dim" : ""}`}>
                  <a href={`/project/${p.slug}/`} onPointerEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(-1)}>
                    <span className="wl-b-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                    <span className="wl-b-name">{p.name}</span>
                    <span className="wl-b-meta">{metaOf(p)}</span>
                  </a>
                </li>
              ))}
            </ol>
            <motion.div className="wl-b-preview" aria-hidden="true" style={{ x: sx, y: sy }}
              animate={{ scale: hover >= 0 ? .62 : 1, rotate: hover >= 0 ? -4 : 0 }} transition={{ type: "spring", stiffness: 200, damping: 22 }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.img key={work[shownB].slug} src={work[shownB].previewImage} alt="" decoding="async"
                  initial={{ opacity: 0, scale: 1.18, filter: "blur(14px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: .55, ease: [.16, 1, .3, 1] } }}
                  exit={{ opacity: 0, scale: .94, filter: "blur(8px)", transition: { duration: .3 } }} />
              </AnimatePresence>
            </motion.div>
          </>
        )}

        {variant === "c" && (
          <>
            <div className="wl-c-stack" ref={stack}>
              {work.map((p, i) => (
                <a key={p.slug} className="wl-c-card" href={`/project/${p.slug}/`} tabIndex={i === active ? 0 : -1} aria-hidden={i === active ? undefined : "true"}>
                  <img src={p.previewImage} alt="" decoding="async" />
                  <span className="wl-c-info">
                    <strong>{p.name}</strong>
                    <span>{metaOf(p)}</span>
                    <span className="wl-tags">{p.tags?.slice(0, 3).map(t => <em key={t}>{t}</em>)}</span>
                  </span>
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Phones: the projects as a plain list over the background. */}
      <ul className="wl-phone">
        {work.map(p => (
          <li key={p.slug}>
            <a href={`/project/${p.slug}/`}>
              <img src={p.previewImage} alt="" decoding="async" />
              <strong>{p.name}</strong>
              <span>{metaOf(p)}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
