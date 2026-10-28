'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Texture-free, deliberately faceted planets; scroll is the only animation clock.
export default function SpaceBackdrop() {
  const host=useRef(null);
  useEffect(()=>{
    const mount=host.current,region=mount.parentElement;
    let renderer;
    try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'})}catch{return}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.25));
    renderer.setClearColor(0x000000,0);mount.appendChild(renderer.domElement);
    const scene=new THREE.Scene();
    const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,30);camera.position.z=10;
    scene.add(new THREE.HemisphereLight(0xb8b1ff,0x080916,1.5));
    const sunlight=new THREE.DirectionalLight(0xd6caff,3);sunlight.position.set(-3,5,5);scene.add(sunlight);
    const saturn=new THREE.Group();
    const sphere=new THREE.Mesh(new THREE.IcosahedronGeometry(.23,2),new THREE.MeshStandardMaterial({color:0x8b72c9,roughness:1,flatShading:true}));
    saturn.add(sphere);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.31,.44,48),new THREE.MeshBasicMaterial({color:0x9d8bc7,side:THREE.DoubleSide,transparent:true,opacity:.45}));
    ring.rotation.set(1.12,.22,-.4);saturn.add(ring);scene.add(saturn);
    const moon=new THREE.Mesh(new THREE.IcosahedronGeometry(.14,1),new THREE.MeshStandardMaterial({color:0x58718f,roughness:1,flatShading:true}));scene.add(moon);
    // Keep the Easter egg in this same persistent 3D background as the planets.
    const nikaMoon=new THREE.Mesh(new THREE.IcosahedronGeometry(1,2),new THREE.MeshStandardMaterial({color:0xd4cee8,emissive:0x80769f,emissiveIntensity:.35,roughness:1,flatShading:true}));
    scene.add(nikaMoon);
    const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;
    const context=glowCanvas.getContext('2d');
    const gradient=context.createRadialGradient(32,32,8,32,32,32);
    gradient.addColorStop(0,'rgba(180,160,240,.35)');gradient.addColorStop(1,'rgba(180,160,240,0)');
    context.fillStyle=gradient;context.fillRect(0,0,64,64);
    const glowTexture=new THREE.CanvasTexture(glowCanvas);
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,transparent:true,depthWrite:false}));
    scene.add(glow);
    const nikaMaterial=new THREE.SpriteMaterial({transparent:true,depthWrite:false,opacity:0});
    const nika=new THREE.Sprite(nikaMaterial);scene.add(nika);
    let disposed=false;
    const nikaTexture=new THREE.TextureLoader().load('/images/nika-silhouette.webp',()=>{if(disposed){nikaTexture.dispose();return}update()});
    nikaMaterial.map=nikaTexture;
    const phases=[0,.14,.32,.66,.82,1];
    const interpolate=(progress,values)=>{
      for(let i=1;i<phases.length;i++)if(progress<=phases[i]){
        let t=THREE.MathUtils.clamp((progress-phases[i-1])/(phases[i]-phases[i-1]),0,1);t=t*t*(3-2*t);
        return THREE.MathUtils.lerp(values[i-1],values[i],t);
      }
      return values[values.length-1];
    };
    let frame=0,visible=false,dirty=true;
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
    const draw=()=>{
      frame=0;if(!visible||document.hidden||!dirty)return;dirty=false;
      const bounds=region.getBoundingClientRect();
      mount.style.clipPath=`inset(${Math.max(0,bounds.top)}px 0 ${Math.max(0,window.innerHeight-bounds.bottom)}px 0)`;
      const aspect=window.innerWidth/window.innerHeight;
      const progress=THREE.MathUtils.clamp(-bounds.top/Math.max(bounds.height,1),0,1);
      const drift=preference.matches?0:progress*.65;
      saturn.position.set(aspect*.78,.48+drift,0);saturn.rotation.z=-.2;
      moon.position.set(-aspect*.84,-.62+drift*.7,-1);
      sphere.rotation.y=preference.matches?0:progress*.4;
      const diameter=window.innerWidth<=700?76:THREE.MathUtils.clamp(window.innerWidth*.08,80,104);
      const radius=diameter/window.innerHeight;
      nikaMoon.scale.setScalar(radius);
      nikaMoon.position.set(-aspect*.67,.25+drift*.12,0);
      nikaMoon.rotation.y=preference.matches?0:progress*.6;
      glow.position.copy(nikaMoon.position);glow.position.z=-.5;glow.scale.setScalar(radius*3.7);
      const section=region.querySelector('#now');
      const sectionBounds=section?.getBoundingClientRect();
      const jump=sectionBounds?THREE.MathUtils.clamp((window.innerHeight*.65-sectionBounds.top)/(sectionBounds.height-window.innerHeight*.3),0,1):0;
      const spriteWidth=radius*1.28,spriteHeight=spriteWidth*640/768;
      nika.scale.set(spriteWidth,spriteHeight,1);
      nika.position.copy(nikaMoon.position);nika.position.z=.5;
      if(!preference.matches){
        nika.position.x+=interpolate(jump,[-2.1,-.9,0,0,.95,2.6])*spriteWidth;
        nika.position.y+=interpolate(jump,[-.85,.35,0,0,.35,1.6])*spriteHeight;
      }
      nikaMaterial.rotation=preference.matches?.087:THREE.MathUtils.degToRad(-interpolate(jump,[-24,-12,-5,-5,10,22]));
      nikaMaterial.opacity=preference.matches?1:Math.min(THREE.MathUtils.clamp(jump/.12,0,1),THREE.MathUtils.clamp((1-jump)/.18,0,1));
      renderer.render(scene,camera);
    };
    const update=()=>{dirty=true;if(!frame)frame=requestAnimationFrame(draw)};
    const resize=()=>{
      const w=window.innerWidth,h=window.innerHeight;
      renderer.setSize(w,h);camera.left=-w/h;camera.right=w/h;camera.updateProjectionMatrix();update();
    };
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;mount.style.visibility=visible?'visible':'hidden';if(visible)update()});observer.observe(region);
    window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',resize);
    document.addEventListener('visibilitychange',update);preference.addEventListener('change',update);resize();
    return()=>{
      disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',update);window.removeEventListener('resize',resize);
      document.removeEventListener('visibilitychange',update);preference.removeEventListener('change',update);
      glowTexture.dispose();nikaTexture.dispose();
      scene.traverse(object=>{object.geometry?.dispose();object.material?.dispose()});renderer.dispose();renderer.domElement.remove();
    };
  },[]);
  return <div className="space-backdrop" ref={host} aria-hidden="true"/>;
}
