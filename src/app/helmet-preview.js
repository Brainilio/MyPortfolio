"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export default function HelmetPreview({
  scrollDriven = false,
  decorative = false,
  followPointer = false,
}) {
  const host = useRef(null);
  const spin = useRef(true);
  const follow = useRef(followPointer);
  useEffect(() => {
    follow.current = followPointer;
  }, [followPointer]);
  const [spinning, setSpinning] = useState(true);
  const [status, setStatus] = useState("Loading your helmet…");
  useEffect(() => {
    const mount = host.current;
    let disposed = false;
    let model;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      setStatus(
        "Your browser could not start the 3D preview. Try enabling WebGL.",
      );
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    if (decorative) renderer.domElement.setAttribute("aria-hidden", "true");
    else
      renderer.domElement.setAttribute(
        "aria-label",
        "Spinning astronaut helmet. Drag to rotate.",
      );
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const pivot = new THREE.Group();
    scene.add(pivot);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
    camera.position.set(0, 0.15, 5.2);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enabled = !decorative;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.5;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    room.dispose();
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x87929f, 1));
    const key = new THREE.DirectionalLight(0xfff2dd, 3);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9ebfff, 2);
    rim.position.set(-4, 2, -2);
    scene.add(rim);
    const disposeModel = (object) =>
      object.traverse((child) => {
        if (!child.isMesh) return;
        child.geometry.dispose();
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.forEach((material) => {
          Object.values(material).forEach((value) => {
            if (value?.isTexture) value.dispose();
          });
          material.dispose();
        });
      });
    new GLTFLoader().load(
      "/astronaut_helmet/scene.gltf",
      (gltf) => {
        if (disposed) {
          disposeModel(gltf.scene);
          return;
        }
        model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const scale = 2.7 / Math.max(size.x, size.y, size.z);
        model.position.copy(center).multiplyScalar(-scale);
        model.scale.setScalar(scale);
        pivot.add(model);
        setStatus("");
      },
      undefined,
      () => {
        if (!disposed)
          setStatus(
            "The helmet could not load. Switch back to your portrait and try again.",
          );
      },
    );
    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    spin.current = !motionPreference.matches;
    setSpinning(spin.current);
    const preferenceChanged = (event) => {
      spin.current = !event.matches;
      setSpinning(spin.current);
    };
    motionPreference.addEventListener("change", preferenceChanged);
    let visible = true;
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibility.observe(mount);
    const section = mount.closest("section") || mount;
    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event) => {
      const rect = section.getBoundingClientRect();
      pointer.x = THREE.MathUtils.clamp(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -1,
        1,
      );
      pointer.y = THREE.MathUtils.clamp(
        ((event.clientY - rect.top) / rect.height) * 2 - 1,
        -1,
        1,
      );
    };
    const resetPointer = () => {
      pointer.x = 0;
      pointer.y = 0;
    };
    const releaseTouch = (event) => {
      if (event.pointerType !== "mouse") resetPointer();
    };
    section.addEventListener("pointermove", onPointerMove, { passive: true });
    section.addEventListener("pointerleave", resetPointer);
    section.addEventListener("pointerup", releaseTouch);
    section.addEventListener("pointercancel", resetPointer);
    let previousMode = follow.current;
    let previousTime;
    let scrollBoost = 0;
    let lastScroll = window.scrollY;
    let lastScrollTime = performance.now();
    let speed = scrollDriven ? 1.2 : 2.5;
    const onScroll = () => {
      const now = performance.now();
      const distance = Math.abs(window.scrollY - lastScroll);
      const elapsed = Math.max(now - lastScrollTime, 16);
      scrollBoost = Math.min(32, (distance / elapsed) * 12);
      lastScroll = window.scrollY;
      lastScrollTime = now;
    };
    if (scrollDriven)
      window.addEventListener("scroll", onScroll, { passive: true });
    renderer.setAnimationLoop((time) => {
      const delta =
        previousTime === undefined
          ? 0
          : Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
      if (!visible || document.hidden) return;
      if (previousMode !== follow.current) {
        controls.reset();
        previousMode = follow.current;
      }
      if (scrollDriven && !follow.current) {
        scrollBoost *= Math.exp(-delta * 3);
        const targetSpeed = 1.2 + scrollBoost;
        speed += (targetSpeed - speed) * (1 - Math.exp(-delta * 7));
        controls.autoRotateSpeed = speed;
      }
      const tracking = follow.current && spin.current;
      const smoothing = 1 - Math.exp(-delta * 5);
      pivot.rotation.y +=
        ((tracking ? pointer.x * 0.85 : 0) - pivot.rotation.y) * smoothing;
      pivot.rotation.x +=
        ((tracking ? pointer.y * 0.4 : 0) - pivot.rotation.x) * smoothing;
      controls.autoRotate = spin.current && !follow.current;
      controls.update(delta);
      renderer.render(scene, camera);
    });
    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      visibility.disconnect();
      motionPreference.removeEventListener("change", preferenceChanged);
      if (scrollDriven) window.removeEventListener("scroll", onScroll);
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerleave", resetPointer);
      section.removeEventListener("pointerup", releaseTouch);
      section.removeEventListener("pointercancel", resetPointer);
      controls.dispose();
      if (model) disposeModel(model);
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [scrollDriven, decorative]);
  return (
    <div className="helmet-preview">
      <div className="helmet-canvas" ref={host} />
      {status && !decorative && (
        <p className="helmet-status" role="status">
          {status}
        </p>
      )}
      {!decorative && (
        <div className="helmet-controls">
          <span>DRAG TO EXPLORE</span>
          <button
            type="button"
            aria-pressed={!spinning}
            onClick={() => {
              spin.current = !spin.current;
              setSpinning(spin.current);
            }}
          >
            {spinning ? "Pause spin" : "Spin helmet"}{" "}
            <span aria-hidden="true">{spinning ? "Ⅱ" : "↻"}</span>
          </button>
          <small className="helmet-credit">
            <a
              href="https://sketchfab.com/3d-models/astronaut-helmet-315605194a474c7b95cd2a9083985d22"
              target="_blank"
              rel="noreferrer"
            >
              Helmet by Medhatelo
            </a>{" "}
            ·{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC BY 4.0
            </a>
          </small>
        </div>
      )}
    </div>
  );
}
