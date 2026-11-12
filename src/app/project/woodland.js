'use client';

import { useEffect, useRef } from 'react';

// A small procedural keepsake of the homepage. Static, lazy and rendered on demand.
export default function Woodland() {
  const host = useRef(null);
  useEffect(() => {
    const mount = host.current;
    let disposed = false, renderer, scene, visible = false, starting = false;
    const render = () => {
      if (!renderer || !visible || document.hidden) return;
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      const camera = scene.userData.camera, aspect = width / height;
      camera.left = -4.5 * aspect; camera.right = 4.5 * aspect;
      camera.updateProjectionMatrix(); renderer.render(scene, camera);
    };
    const observer = new IntersectionObserver(async ([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) return;
      if (renderer) { render(); return; }
      if (starting) return;
      starting = true;
      try {
        const THREE = await import('three');
        if (disposed) return;
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setClearColor(0, 0); renderer.toneMapping = THREE.ACESFilmicToneMapping;
        mount.appendChild(renderer.domElement);
        scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-6,6,4.5,-4.5,.1,80);
        camera.position.set(9,7,12); camera.lookAt(0,.8,0); scene.userData.camera = camera;
        scene.add(new THREE.HemisphereLight('#d8ddff','#48354d',1.25));
        const sun = new THREE.DirectionalLight('#ffe1b8',2.5); sun.position.set(-5,7,4); scene.add(sun);
        const material = color => new THREE.MeshStandardMaterial({ color, flatShading:true, roughness:1 });
        const ground = new THREE.Mesh(new THREE.CylinderGeometry(3.3,1.7,1.35,9),material('#514656'));
        ground.position.y=-.7; scene.add(ground);
        const meadow = new THREE.Mesh(new THREE.CylinderGeometry(3.32,3.32,.16,9),material('#86997c')); scene.add(meadow);
        const pool = new THREE.Mesh(new THREE.CircleGeometry(.95,9),material('#91bbca'));
        pool.rotation.x=-Math.PI/2;pool.position.set(.75,.1,.8);pool.scale.set(1.4,.7,1);scene.add(pool);
        const trunkGeo=new THREE.CylinderGeometry(.09,.13,1.3,5), crownGeo=new THREE.ConeGeometry(.65,1.8,6);
        const trunks=new THREE.InstancedMesh(trunkGeo,material('#77604d'),7);
        const crowns=new THREE.InstancedMesh(crownGeo,material('#3f6359'),7);
        const tops=new THREE.InstancedMesh(crownGeo,material('#688475'),7);
        const dummy=new THREE.Object3D();
        [[-1.9,-.8,1.15],[-.6,-1.5,1.35],[1,-1.6,.95],[2,-.8,.8],[-2,.8,.7],[-.8,.3,.85],[.2,-.4,1.05]].forEach(([x,z,k],i)=>{
          dummy.position.set(x,.65*k,z);dummy.scale.setScalar(k);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
          dummy.position.y=1.7*k;dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);
          dummy.position.y=2.3*k;dummy.scale.setScalar(k*.75);dummy.updateMatrix();tops.setMatrixAt(i,dummy.matrix);
        });
        scene.add(trunks,crowns,tops); render();
      } catch { /* The CSS sky remains a decorative fallback without WebGL. */ }
    }, {rootMargin:'200px'});
    observer.observe(mount);
    const resize=new ResizeObserver(render);resize.observe(mount);
    document.addEventListener('visibilitychange',render);
    return () => {
      disposed=true;observer.disconnect();resize.disconnect();document.removeEventListener('visibilitychange',render);
      const geometries=new Set(),materials=new Set();
      scene?.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)materials.add(object.material);object.dispose?.();});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer?.dispose();renderer?.domElement.remove();
    };
  }, []);
  return <div className="case-woodland" ref={host} aria-hidden="true" />;
}
