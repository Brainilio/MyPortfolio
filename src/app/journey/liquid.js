import * as THREE from 'three';

// Liquid cards: every <img data-liquid> on the page gets a WebGL twin drawn over the 3D scene, exactly on
// top of the image's box (one unit = one CSS pixel at z=0). The DOM image keeps layout, alt text and
// links; it's hidden once its twin is ready. The planes bend with scroll speed, ripple under the pointer
// and breathe very slightly, so photos feel like they live in the scene rather than on top of it.
// `data-depth` (e.g. .15) adds parallax: deeper cards drift against the scroll.
const vertexShader=`
uniform float uVelocity,uTime,uHover,uMotion;uniform vec2 uMouse;
varying vec2 vUv;varying float vShade;
void main(){
  vUv=uv;vec3 p=position;
  // Bend like a sheet: the middle trails behind the scroll.
  p.y+=sin(uv.x*3.14159)*uVelocity*.06*uMotion;
  // A slow swell across the surface.
  float swell=(sin(uv.x*4.+uTime*.9)+sin(uv.y*3.5-uTime*.7))*.5*uMotion;
  // Rings spreading from the pointer while hovered.
  float d=distance(uv,uMouse),ring=sin(d*26.-uTime*4.)*exp(-d*4.)*uHover*uMotion;
  p.z+=swell*6.+ring*18.;
  vShade=ring*.12+swell*.015;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`;
const fragmentShader=`
uniform sampler2D uMap;uniform vec2 uSize,uCover;uniform float uVelocity,uHover,uRadius,uOpacity,uTime,uMotion;uniform vec2 uMouse;
varying vec2 vUv;varying float vShade;
void main(){
  // object-fit: cover, plus a touch of zoom so the ripple never shows an edge.
  vec2 uv=(vUv-.5)*uCover*.96+.5;
  float d=distance(vUv,uMouse);
  uv+=normalize(vUv-uMouse+1e-4)*sin(d*26.-uTime*4.)*exp(-d*4.)*uHover*.006*uMotion;
  // A colour fringe that grows with scroll speed.
  float split=abs(uVelocity)*.012*uMotion+uHover*.002;
  vec3 color=vec3(texture2D(uMap,uv+vec2(0.,split)).r,texture2D(uMap,uv).g,texture2D(uMap,uv-vec2(0.,split)).b);
  color+=vShade;
  // Rounded corners, antialiased in pixels.
  vec2 q=abs(vUv-.5)*uSize-(uSize*.5-uRadius);
  float alpha=1.-smoothstep(-.75,.75,length(max(q,0.))-uRadius);
  gl_FragColor=vec4(color,alpha*uOpacity);
  #include <colorspace_fragment>
}`;

export function createLiquidLayer(renderer,root) {
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,1,1,6000);
  const geometry=new THREE.PlaneGeometry(1,1,32,32),loader=new THREE.TextureLoader(),cards=new Map();
  let width=1,height=1,velocity=0,lastY=window.scrollY;
  const pointer={x:-1,y:-1};

  function add(img) {
    const material=new THREE.ShaderMaterial({vertexShader,fragmentShader,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,uniforms:{
      uMap:{value:null},uSize:{value:new THREE.Vector2(1,1)},uCover:{value:new THREE.Vector2(1,1)},uVelocity:{value:0},uTime:{value:0},
      uHover:{value:0},uMouse:{value:new THREE.Vector2(.5,.5)},uRadius:{value:parseFloat(img.dataset.radius)||10},uOpacity:{value:0},uMotion:{value:1},
    }});
    const mesh=new THREE.Mesh(geometry,material);mesh.visible=false;mesh.frustumCulled=false;scene.add(mesh);
    const card={mesh,material,hover:0,depth:parseFloat(img.dataset.depth)||0,texture:null};
    cards.set(img,card);
    loader.load(img.currentSrc||img.src,texture=>{
      if(!cards.has(img)){texture.dispose();return;}
      texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
      card.texture=texture;material.uniforms.uMap.value=texture;card.aspect=texture.image.width/texture.image.height;
      img.dataset.liquidReady='';
    });
  }
  function remove(img) {
    const card=cards.get(img);if(!card)return;
    scene.remove(card.mesh);card.material.dispose();card.texture?.dispose();cards.delete(img);delete img.dataset.liquidReady;
  }
  const scan=()=>{
    const found=new Set(root.querySelectorAll('img[data-liquid]'));
    for(const img of found)if(!cards.has(img))add(img);
    for(const img of [...cards.keys()])if(!found.has(img))remove(img);
  };
  const observer=new MutationObserver(scan);observer.observe(root,{childList:true,subtree:true});scan();
  const onPointer=event=>{pointer.x=event.clientX;pointer.y=event.clientY;};
  window.addEventListener('pointermove',onPointer,{passive:true});

  return {
    resize(w,h){width=w;height=h;camera.aspect=w/h;camera.position.set(0,0,h/2/Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));camera.updateProjectionMatrix();},
    // Sync each twin to its image's box, then draw over whatever is already on screen.
    render(dt,time,reduced) {
      const y=window.scrollY,speed=dt>0?(y-lastY)/dt:0;lastY=y;
      velocity+=(THREE.MathUtils.clamp(speed/2500,-1,1)-velocity)*(1-Math.exp(-dt*6));
      for(const [img,card] of cards){
        const {mesh,material}=card,u=material.uniforms,r=img.getBoundingClientRect();
        const onScreen=card.texture&&r.width>0&&r.bottom>-80&&r.top<height+80&&getComputedStyle(img).visibility!=='hidden';
        mesh.visible=!!onScreen;if(!onScreen)continue;
        const shift=card.depth*((r.top+r.height/2)-height/2);
        mesh.position.set(r.left+r.width/2-width/2,height/2-(r.top+r.height/2)+shift,0);mesh.scale.set(r.width,r.height,1);
        u.uSize.value.set(r.width,r.height);
        const box=r.width/r.height;u.uCover.value.set(box>card.aspect?1:box/card.aspect,box>card.aspect?card.aspect/box:1);
        // Hover is read from the pointer against the box (the canvas itself takes no pointer events).
        const inside=pointer.x>=r.left&&pointer.x<=r.right&&pointer.y>=r.top-shift&&pointer.y<=r.bottom-shift;
        card.hover+=((inside?1:0)-card.hover)*(1-Math.exp(-dt*4));
        if(inside)u.uMouse.value.set((pointer.x-r.left)/r.width,1-(pointer.y-r.top+shift)/r.height);
        u.uHover.value=card.hover;u.uVelocity.value=velocity;u.uTime.value=time;u.uMotion.value=reduced?0:1;
        u.uOpacity.value=Math.min(1,u.uOpacity.value+dt*2.5);
      }
      const clear=renderer.autoClear;renderer.autoClear=false;renderer.render(scene,camera);renderer.autoClear=clear;
    },
    dispose(){observer.disconnect();window.removeEventListener('pointermove',onPointer);for(const img of [...cards.keys()])remove(img);geometry.dispose();},
  };
}
