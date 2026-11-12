import * as THREE from 'three';
import { MOON, MOON_RADIUS, SATURN, MARS, SUN_DIRECTION, SUN_DISTANCE } from './flight';

const hash=n=>{const s=Math.sin(n*91.7)*43758.5453;return s-Math.floor(s);};
export function glowTexture() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');
  const g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(canvas);
}
// Fades a whole set piece in and out (materials with a uOpacity uniform, or plain opacity),
// so objects emerge from the dark instead of popping into view.
export function createFader(root) {
  const entries=[],seen=new Set();
  root.traverse(object=>{for(const material of [object.material].flat()){
    if(!material||seen.has(material))continue;seen.add(material);
    if(material.uniforms?.uOpacity)entries.push({material,uniform:material.uniforms.uOpacity,base:material.uniforms.uOpacity.value});
    else{material.transparent=true;entries.push({material,base:material.opacity});}
  }});
  let last=-1;
  return alpha=>{
    root.visible=alpha>.002;if(Math.abs(alpha-last)<.001)return;last=alpha;
    for(const e of entries){if(e.uniform)e.uniform.value=e.base*alpha;else e.material.opacity=e.base*alpha;}
  };
}

const sphereVertex=`varying vec2 vUv;varying vec3 vDir;varying vec3 vN;varying vec3 vView;
  void main(){vUv=uv;vDir=normalize(position);vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vView=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}`;
const noiseChunk=`float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
  float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
    return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
  float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<6;i++){v+=a*n3(p);p=p*2.03+1.7;a*=.5;}return v;}`;
const KEY_LIGHT=new THREE.Vector3(-.6,.68,.43).normalize();

// Saturn: soft cream and tan cloud bands, and a banded ring system with the Cassini division.
export function createSaturn() {
  const radius=300,group=new THREE.Group(),uniforms={uOpacity:{value:1},uLight:{value:KEY_LIGHT}};
  group.add(new THREE.Mesh(new THREE.SphereGeometry(radius,96,64),new THREE.ShaderMaterial({uniforms,transparent:true,vertexShader:sphereVertex,
    fragmentShader:`uniform float uOpacity;uniform vec3 uLight;varying vec3 vDir;varying vec3 vN;${noiseChunk}
      void main(){
        float lat=vDir.y+fbm(vDir*vec3(3.,1.,3.))*.04;
        float bands=sin(lat*38.)*.5+.5,fine=sin(lat*120.+fbm(vDir*8.)*3.)*.5+.5;
        vec3 color=mix(vec3(.78,.66,.47),vec3(.9,.83,.66),bands)*(.92+.08*fine);
        color=mix(color,vec3(.62,.55,.45),smoothstep(.75,.95,abs(vDir.y)));
        float light=max(dot(normalize(vN),uLight),0.);
        gl_FragColor=vec4(color*(.03+light*1.05),uOpacity);
        #include <colorspace_fragment>
      }`})));
  const ring=new THREE.Mesh(new THREE.RingGeometry(radius*1.24,radius*2.3,192,1),new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:`varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float uOpacity;varying vec2 vP;
      float h(float x){return fract(sin(x*91.3)*43758.5);}
      void main(){
        float r=(length(vP)/${radius.toFixed(1)}-1.24)/1.06;
        float bands=.55+.45*h(floor(r*90.));
        float cassini=smoothstep(.52,.55,r)*(1.-smoothstep(.58,.61,r));
        float alpha=bands*(1.-cassini*.92)*smoothstep(0.,.05,r)*(1.-smoothstep(.9,1.,r))*mix(.55,.9,smoothstep(.2,.5,r));
        vec3 color=mix(vec3(.62,.55,.45),vec3(.88,.8,.65),bands);
        gl_FragColor=vec4(color*.85,alpha*uOpacity);
        #include <colorspace_fragment>
      }`}));
  ring.rotation.x=Math.PI/2-.42;group.add(ring);
  group.rotation.z=.32;group.position.copy(SATURN);
  return {group,fade:createFader(group),update(time){group.children[0].rotation.y=time*.02;}};
}

// Mars: rust with dark albedo regions and a small polar cap, far to one side.
export function createMars() {
  const uniforms={uOpacity:{value:1},uLight:{value:KEY_LIGHT}};
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(70,64,48),new THREE.ShaderMaterial({uniforms,transparent:true,vertexShader:sphereVertex,
    fragmentShader:`uniform float uOpacity;uniform vec3 uLight;varying vec3 vDir;varying vec3 vN;varying vec3 vView;${noiseChunk}
      void main(){
        vec3 color=mix(vec3(.55,.24,.12),vec3(.74,.4,.22),fbm(vDir*3.));
        color=mix(color,vec3(.28,.14,.09),smoothstep(.55,.7,fbm(vDir*2.+5.))*.7);
        color=mix(color,vec3(.9,.88,.86),smoothstep(.9,.94,vDir.y));
        vec3 n=normalize(vN);float light=max(dot(n,uLight),0.);
        float rim=pow(1.-max(dot(n,normalize(vView)),0.),3.)*light;
        gl_FragColor=vec4(color*(.03+light*1.05)+vec3(.8,.45,.3)*rim*.25,uOpacity);
        #include <colorspace_fragment>
      }`}));
  mesh.position.copy(MARS);
  return {group:mesh,fade:createFader(mesh)};
}

// The distant Moon near Earth, with NASA's LRO colour map. The near side is turned toward the camera.
export function createMoon(texture) {
  const group=new THREE.Group();
  const map=new THREE.TextureLoader().load('/textures/moon-2k.jpg');map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
  const uniforms={uOpacity:{value:1},uMap:{value:map}};
  const moon=new THREE.Mesh(new THREE.SphereGeometry(MOON_RADIUS,96,64),new THREE.ShaderMaterial({uniforms,transparent:true,vertexShader:sphereVertex,
    fragmentShader:`uniform float uOpacity;uniform sampler2D uMap;varying vec2 vUv;varying vec3 vN;varying vec3 vView;
      void main(){
        vec3 albedo=texture2D(uMap,vUv).rgb;
        vec3 n=normalize(vN),v=normalize(vView);
        float light=.3+.9*max(dot(n,normalize(v+vec3(.25,.25,0.))),0.);
        gl_FragColor=vec4(albedo*light*pow(max(dot(n,v),0.),.3)*1.35,uOpacity);
        #include <colorspace_fragment>
      }`}));
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:0x8d8aa8,transparent:true,opacity:.14,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
  glow.scale.setScalar(MOON_RADIUS*4);
  group.add(glow,moon);group.position.copy(MOON);
  const fade=createFader(group),toCamera=new THREE.Vector3(),X=new THREE.Vector3(1,0,0);
  return {group,map,update(camera,presence){
    moon.quaternion.setFromUnitVectors(X,toCamera.copy(camera.position).sub(group.position).normalize());
    fade(presence);
  }};
}

// A far, glowing Sun: hot core, wide halo and a few soft lens-flare ghosts along the line through
// the screen centre. Ghosts fade as the Sun leaves the frame or slips behind Earth or the Moon.
export function createSun(texture) {
  const group=new THREE.Group();
  const sprite=(color,size,opacity,overlay=false)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color,transparent:true,opacity,depthWrite:false,depthTest:!overlay,blending:THREE.AdditiveBlending,fog:false}));s.scale.setScalar(size);if(overlay)s.renderOrder=5;return s;};
  const core=sprite(0xfff4e0,200,1),inner=sprite(0xffd9a8,460,.45),halo=sprite(0xffb877,1300,.12);
  group.add(halo,inner,core);
  const ghosts=[[.55,.12,0x9ab4ff],[.25,.06,0xffd2a0],[-.2,.09,0xb7a3ff],[-.55,.16,0x8fd0c8]].map(([t,size,color])=>{const g=sprite(color,1,0,true);g.userData={t,size};return g;});
  const flares=new THREE.Group();ghosts.forEach(g=>flares.add(g));
  const ndc=new THREE.Vector3(),ray=new THREE.Ray(),occluders=[];
  return {group,flares,occlude:(center,radius)=>occluders.push({center,radius}),update(camera,strength,reduced){
    // `strength` fades the whole Sun in and out (no popping at a fixed altitude).
    group.visible=flares.visible=strength>.005;if(!group.visible)return;
    core.material.opacity=strength;inner.material.opacity=.45*strength;halo.material.opacity=.12*strength;
    group.position.copy(camera.position).addScaledVector(SUN_DIRECTION,SUN_DISTANCE);
    const pulse=reduced?1:1+Math.sin(performance.now()*.0011)*.03;core.scale.setScalar(200*pulse);
    ray.set(camera.position,SUN_DIRECTION);
    const hidden=occluders.some(o=>ray.distanceSqToPoint(o.center)<o.radius*o.radius&&o.center.clone().sub(camera.position).dot(SUN_DIRECTION)>0);
    group.visible=!hidden;
    ndc.copy(group.position).project(camera);
    const onScreen=ndc.z<1&&Math.abs(ndc.x)<1.2&&Math.abs(ndc.y)<1.2&&!hidden;
    const flare=onScreen?Math.max(0,1-Math.hypot(ndc.x,ndc.y)/1.3):0;
    for(const g of ghosts){
      const {t,size}=g.userData;
      g.position.set(ndc.x*t,ndc.y*t,.5).unproject(camera);
      const d=g.position.distanceTo(camera.position);g.scale.setScalar(size*d);
      g.material.opacity=flare*.14*strength;
    }
  }};
}

// The Easter egg: a far-off silhouette jumping across the face of the Moon.
export function createMoonJumper(moon) {
  const texture=new THREE.TextureLoader().load('/images/nika-silhouette.webp');texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.SpriteMaterial({map:texture,color:0x000000,transparent:true,depthWrite:false,fog:false,opacity:0});
  const sprite=new THREE.Sprite(material);sprite.renderOrder=2;
  const toCamera=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3();
  const size=MOON_RADIUS*.78;sprite.scale.set(size*1.2,size,1);
  return {sprite,texture,update(s,camera,dimmed){
    const j=(s-4.28)/.5;sprite.visible=j>0&&j<1;if(!sprite.visible)return;
    right.setFromMatrixColumn(camera.matrixWorld,0);up.setFromMatrixColumn(camera.matrixWorld,1);
    toCamera.copy(camera.position).sub(moon.position).normalize();
    // Ballistic leap: constant sideways speed, parabolic height, peaking over the upper half of the disc.
    sprite.position.copy(moon.position).addScaledVector(toCamera,MOON_RADIUS*1.3)
      .addScaledVector(right,THREE.MathUtils.lerp(-1.6,1.6,j)*MOON_RADIUS)
      .addScaledVector(up,(-.7+1.05*Math.sin(Math.PI*j))*MOON_RADIUS);
    material.rotation=(.5-j)*.55;
    material.opacity=Math.min(1,j/.05,(1-j)/.05)*dimmed;
  }};
}
