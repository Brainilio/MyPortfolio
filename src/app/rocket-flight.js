'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const clamp = THREE.MathUtils.clamp;
const cubic = (a,b,c,d,t) => (1-t)**3*a+3*(1-t)**2*t*b+3*(1-t)*t*t*c+t**3*d;
// Normalized screen coordinates: launch, one clockwise O, departure.
export function flightPoint(progress) {
  const p = clamp(progress, 0, 1);
  if (p < .18) {
    const t=p/.18;
    return [cubic(.12,.16,.35,.52,t),cubic(1.13,.9,.65,.65,t)];
  }
  if (p < .75) {
    const angle=Math.PI/2-(p-.18)/.57*Math.PI*2;
    return [.52+.18*Math.cos(angle),.45+.2*Math.sin(angle)];
  }
  const t=(p-.75)/.25;
  return [cubic(.52,.86,.9,1.25,t),cubic(.65,.65,.15,-.25,t)];
}

export default function RocketFlight() {
  const host = useRef(null);
  useEffect(() => {
    const mount=host.current;
    const section=mount.closest('section');
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
    let disposed=false,renderer,rocket,frame=0,initialized=false;
    let width=0,height=0,scene,camera,vehicle,exhaust,flames;
    let previousProgress=-1;
    const exhaustTransform=new THREE.Object3D();
    const flameTransform=new THREE.Object3D();
    const disposeObject=object => object?.traverse(child=>{
      child.geometry?.dispose();
      const materials=Array.isArray(child.material)?child.material:[child.material];
      materials.forEach(material=>{if(!material)return;Object.values(material).forEach(value=>{if(value?.isTexture)value.dispose()});material.dispose()});
    });
    const draw=()=>{
      frame=0;
      if(!renderer||!rocket||disposed||document.hidden||preference.matches)return;
      const rect=section.getBoundingClientRect();
      const progress=clamp((height*.85-rect.top)/(rect.height+height*.7),0,1);
      const visible=rect.top<height&&rect.bottom>0&&progress>0&&progress<1;
      mount.style.visibility=visible?'visible':'hidden';
      if(!visible||Math.abs(progress-previousProgress)<.0001)return;
      previousProgress=progress;
      const [x,y]=flightPoint(progress);
      const before=flightPoint(Math.max(0,progress-.0001));
      const after=flightPoint(Math.min(1,progress+.0001));
      vehicle.position.set((x-.5)*width,(.5-y)*height,0);
      vehicle.rotation.z=Math.atan2(-(after[0]-before[0])*width,-(after[1]-before[1])*height);
      const size=width<700?105:150;
      const scale=progress<.18?THREE.MathUtils.lerp(.65,1,progress/.18):progress>.75?THREE.MathUtils.lerp(1,.35,(progress-.75)/.25):1;
      vehicle.scale.setScalar(size*scale);
      rocket.rotation.y=.35+progress*1.8;
      // Scroll-scrubbed exhaust: expanding, fading puffs from both boosters.
      // No emitter timers or idle animation loop are needed.
      const phase=progress*18;
      for(let i=0;i<24;i++){
        const side=i%2===0?-1:1;
        const age=(Math.floor(i/2)/12+phase)%1;
        const spread=age*age;
        exhaustTransform.position.set(side*.13+Math.sin(i*2.399)*spread*.16,-.52-age*.7,Math.cos(i*1.7)*spread*.1);
        exhaustTransform.rotation.set(i*.7+age,i*.4,age*2);
        exhaustTransform.scale.setScalar(.32+age*1.3);
        exhaustTransform.updateMatrix();
        exhaust.setMatrixAt(i,exhaustTransform.matrix);
        exhaust.geometry.attributes.puffOpacity.setX(i,(1-age)**1.7*.52);
      }
      exhaust.instanceMatrix.needsUpdate=true;
      exhaust.geometry.attributes.puffOpacity.needsUpdate=true;
      const pulse=.9+Math.sin(progress*240)*.15;
      for(let i=0;i<4;i++){
        const core=i%2===1;
        const side=i<2?-1:1;
        const length=(core?.2:.32)*pulse;
        flameTransform.position.set(side*.13,-.47-length/2,core?.04:0);
        flameTransform.rotation.set(0,0,Math.PI);
        flameTransform.scale.set(core?.045:.075,length,core?.045:.075);
        flameTransform.updateMatrix();flames.setMatrixAt(i,flameTransform.matrix);
      }
      flames.instanceMatrix.needsUpdate=true;
      renderer.render(scene,camera);
    };
    const requestDraw=()=>{if(!frame)frame=requestAnimationFrame(draw)};
    const resize=()=>{
      width=window.innerWidth;height=window.innerHeight;
      if(!renderer)return;
      renderer.setSize(width,height);
      camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;
      camera.updateProjectionMatrix();previousProgress=-1;requestDraw();
    };
    const initialize=()=>{
      if(initialized||preference.matches||disposed)return;
      initialized=true;
      try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'})}catch{return}
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
      renderer.setClearColor(0x000000,0);
      renderer.toneMapping=THREE.ACESFilmicToneMapping;
      mount.appendChild(renderer.domElement);
      scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,2000);camera.position.z=1000;
      scene.add(new THREE.HemisphereLight(0xffffff,0x555577,2.3));
      const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(200,400,600);scene.add(light);
      vehicle=new THREE.Group();scene.add(vehicle);
      // Four tiny flames and 24 faceted smoke puffs share two draw calls.
      flames=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,7),new THREE.MeshBasicMaterial({transparent:true,opacity:.9,depthWrite:false}),4);
      flames.frustumCulled=false;
      flames.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      for(let i=0;i<4;i++)flames.setColorAt(i,new THREE.Color(i%2?0xffedd5:0xb69aff));
      vehicle.add(flames);
      const puffGeometry=new THREE.IcosahedronGeometry(.055,0);
      const opacityAttribute=new THREE.InstancedBufferAttribute(new Float32Array(24),1);
      opacityAttribute.setUsage(THREE.DynamicDrawUsage);puffGeometry.setAttribute('puffOpacity',opacityAttribute);
      const puffMaterial=new THREE.ShaderMaterial({
        transparent:true,depthWrite:false,
        vertexShader:`
          attribute float puffOpacity;
          varying float fade;
          varying float light;
          void main(){
            fade=puffOpacity;
            vec3 n=normalize(normalMatrix*mat3(instanceMatrix)*normal);
            light=.65+.35*max(dot(n,normalize(vec3(-.4,.7,1.))),0.);
            gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);
          }`,
        fragmentShader:`
          varying float fade;
          varying float light;
          void main(){
            gl_FragColor=vec4(vec3(.7,.66,.84)*light,fade);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      });
      exhaust=new THREE.InstancedMesh(puffGeometry,puffMaterial,24);
      exhaust.frustumCulled=false;exhaust.instanceMatrix.setUsage(THREE.DynamicDrawUsage);vehicle.add(exhaust);
      resize();
      new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load('/models/rocket.glb',gltf=>{
        if(disposed){disposeObject(gltf.scene);return}
        rocket=gltf.scene;
        const box=new THREE.Box3().setFromObject(rocket);const center=box.getCenter(new THREE.Vector3());
        const factor=1/box.getSize(new THREE.Vector3()).y;
        rocket.position.copy(center).multiplyScalar(-factor);rocket.scale.setScalar(factor);vehicle.add(rocket);requestDraw();
      },undefined,()=>{mount.style.visibility='hidden'});
    };
    const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){initialize();requestDraw()}},{rootMargin:'300px'});
    observer.observe(section);
    const preferenceChanged=()=>{mount.style.visibility='hidden';if(!preference.matches){initialize();previousProgress=-1;requestDraw()}};
    preference.addEventListener('change',preferenceChanged);
    window.addEventListener('scroll',requestDraw,{passive:true});window.addEventListener('resize',resize);
    document.addEventListener('visibilitychange',requestDraw);
    return()=>{
      disposed=true;cancelAnimationFrame(frame);observer.disconnect();
      window.removeEventListener('scroll',requestDraw);window.removeEventListener('resize',resize);
      document.removeEventListener('visibilitychange',requestDraw);preference.removeEventListener('change',preferenceChanged);
      disposeObject(scene);renderer?.dispose();renderer?.domElement.remove();
    };
  },[]);
  return <div ref={host} className="rocket-flight" aria-hidden="true"/>;
}
