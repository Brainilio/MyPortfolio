import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const rand=seed=>{let s=seed;return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646;};};

// Twinkling star points; one draw call per layer. Bloom turns the brightest into soft glints.
function starLayer({count,seed,place,size,fixedSize}) {
  const r=rand(seed),positions=new Float32Array(count*3),colors=new Float32Array(count*3),extras=new Float32Array(count*2);
  const palette=[0xbfd4ff,0xffe1b8,0xe4d9ff,0xffffff,0x9fc3ff].map(c=>new THREE.Color(c));
  const p=new THREE.Vector3();
  for(let i=0;i<count;i++){
    place(r,p);p.toArray(positions,i*3);
    const c=palette[Math.floor(r()*palette.length)],bright=.55+r()*.9;
    colors[i*3]=c.r*bright;colors[i*3+1]=c.g*bright;colors[i*3+2]=c.b*bright;
    extras[i*2]=r()*6.28;extras[i*2+1]=Math.pow(r(),6)*2.4+.6;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  geometry.setAttribute('extra',new THREE.BufferAttribute(extras,2));
  const uniforms={uTime:{value:0},uOpacity:{value:0},uSize:{value:size}};
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`attribute vec3 color;attribute vec2 extra;uniform float uTime;uniform float uSize;varying vec3 vColor;varying float vTwinkle;
      void main(){vColor=color;vTwinkle=.65+.35*sin(uTime*(1.2+extra.x*.4)+extra.x*7.);
        vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
        gl_PointSize=${fixedSize?'uSize*extra.y':'clamp(uSize*extra.y*120./-mv.z,1.,uSize*4.)'};}`,
    fragmentShader:`uniform float uOpacity;varying vec3 vColor;varying float vTwinkle;
      void main(){float d=length(gl_PointCoord-.5);float core=1.-smoothstep(0.,.5,d);gl_FragColor=vec4(vColor*vTwinkle*(core*core*1.6),core*uOpacity);}`,
  });
  const points=new THREE.Points(geometry,material);points.frustumCulled=false;
  return {points,uniforms};
}

export function createStars() {
  // Far layer rides with the camera like a skybox, with a dense Milky Way band.
  const bandNormal=new THREE.Vector3(.3,.85,.42).normalize(),u=new THREE.Vector3(),v=new THREE.Vector3();
  u.set(1,0,0).cross(bandNormal).normalize();v.crossVectors(bandNormal,u);
  const far=starLayer({count:9000,seed:7,size:2.1,fixedSize:true,place(r,p){
    if(r()<.55){const a=r()*Math.PI*2,spread=(r()+r()+r()-1.5)*.22;
      p.copy(u).multiplyScalar(Math.cos(a)).addScaledVector(v,Math.sin(a)).addScaledVector(bandNormal,spread).normalize().multiplyScalar(6200);}
    else p.set(r()*2-1,r()*2-1,r()*2-1).normalize().multiplyScalar(6200);
  }});
  // Near layer is spread along the route for parallax as the astronaut flies past.
  const near=starLayer({count:3500,seed:3,size:1.6,place(r,p){p.set(-330+r()*420,90+r()*260,-960+r()*1060);}});
  const group=new THREE.Group();group.add(far.points,near.points);
  return {group,update(time,opacity,camera){
    far.points.position.copy(camera.position);
    for(const layer of [far,near]){layer.uniforms.uTime.value=time;layer.uniforms.uOpacity.value=opacity;}
  }};
}

// Low-poly 3D clouds: clusters of faceted puffs, lit by the sun so they read crisp and sculpted
// (matching the mountains and rocket) instead of soft blurred sprites. Three cluster shapes, instanced.
function cloudShape(r,puffs) {
  const parts=[];
  for(let i=0;i<puffs;i++){
    const t=i/(puffs-1)-.5,size=1-Math.abs(t)*1.1+r()*.25;
    const g=new THREE.IcosahedronGeometry(size,1);
    g.translate(t*3.4+(r()-.5)*.6,size*.35+(r()-.5)*.25,(r()-.5)*1.2);parts.push(g);
  }
  // A flattened base so clusters sit like real cumulus.
  const base=new THREE.IcosahedronGeometry(1.6,1);base.scale(1.5,.42,.9);base.translate(0,-.05,0);parts.push(base);
  const merged=mergeGeometries(parts.map(g=>g.toNonIndexed()));parts.forEach(g=>g.dispose());
  merged.computeVertexNormals();
  return merged;
}
export function createClouds() {
  const r=rand(11),group=new THREE.Group();
  const material=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x5d6f8c,emissiveIntensity:.35,roughness:1,flatShading:true,transparent:true});
  const shapes=[cloudShape(r,5),cloudShape(r,6),cloudShape(r,4)],dummy=new THREE.Object3D();
  const placements=shapes.map(()=>[]);
  // Clouds the rocket climbs past: kept clear of the rocket's climb and the launch camera's path.
  for(let i=0;i<54;i++){
    const angle=r()*Math.PI*2,radius=34+r()*95;
    placements[i%3].push({x:8+Math.cos(angle)*radius,y:34+r()*72,z:4+Math.sin(angle)*radius,scale:7+r()*9});
  }
  // A sea of clouds below the summit.
  for(let i=0;i<40;i++)placements[i%3].push({x:-170+r()*340,y:-32+r()*6,z:-210+r()*200,scale:14+r()*12,flat:true});
  shapes.forEach((shape,i)=>{
    const mesh=new THREE.InstancedMesh(shape,material,placements[i].length);
    placements[i].forEach((p,j)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,r()*Math.PI*2,0);dummy.scale.set(p.scale,p.scale*(p.flat?.55:.8),p.scale);dummy.updateMatrix();mesh.setMatrixAt(j,dummy.matrix);});
    group.add(mesh);
  });
  return {group,material};
}

// Aurora curtains: an open cylinder hugging a high-latitude ring of the Earth, with animated folds.
export function createAurora(earthCenter,radius,axis) {
  const latitude=THREE.MathUtils.degToRad(70),ringRadius=radius*Math.cos(latitude),height=radius*.045;
  const geometry=new THREE.CylinderGeometry(ringRadius*1.04,ringRadius,height,220,1,true);
  geometry.translate(0,radius*Math.sin(latitude)+height/2,0);
  const uniforms={uTime:{value:0},uOpacity:{value:1}};
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vUv;uniform float uTime;uniform float uOpacity;
      float h(float x){return fract(sin(x*127.1)*43758.5);}
      float n(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(h(i),h(i+1.),f);}
      void main(){
        float x=vUv.x*90.;
        float fold=n(x*.6+uTime*.25)*.6+n(x*1.9-uTime*.4)*.4;
        float rays=.55+.45*n(x*14.+uTime*1.3);
        float bands=smoothstep(.35,.9,fold)*rays;
        float base=smoothstep(0.,.06,vUv.y)*exp(-vUv.y*2.6);
        vec3 green=vec3(.3,.9,.58),violet=vec3(.5,.38,.9);
        vec3 color=mix(green,violet,smoothstep(.15,.8,vUv.y));
        float a=bands*base*uOpacity;
        gl_FragColor=vec4(color*a*1.3,a);
      }`,
  });
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.copy(earthCenter);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis.clone().normalize());
  return {mesh,uniforms};
}

// A faint Milky Way: a soft band with a warm core and dark dust lanes. Kept dim so it reads as
// depth, not colour; it rides with the camera like the far star layer.
export function createMilkyWay() {
  const normal=new THREE.Vector3(.3,.85,.42).normalize(),u=new THREE.Vector3(1,0,0).cross(normal).normalize(),v=new THREE.Vector3().crossVectors(normal,u);
  const uniforms={uOpacity:{value:0},uNormal:{value:normal},uU:{value:u},uV:{value:v}};
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(6100,64,32),new THREE.ShaderMaterial({uniforms,side:THREE.BackSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,
    vertexShader:`varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float uOpacity;uniform vec3 uNormal;uniform vec3 uU;uniform vec3 uV;varying vec3 vDir;
      float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
      float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
        return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
      float fbm(vec3 p){float s=0.,a=.5;for(int i=0;i<6;i++){s+=a*n3(p);p=p*2.07+1.3;a*=.5;}return s;}
      void main(){
        vec3 d=normalize(vDir);
        float b=dot(d,uNormal),along=atan(dot(d,uV),dot(d,uU));
        float core=exp(-pow(along/.9,2.));
        float width=.08+.07*core;
        float band=exp(-b*b/(width*width));
        float clouds=fbm(d*7.),dust=fbm(d*16.+4.);
        float lanes=smoothstep(.48,.72,dust)*exp(-b*b/(width*width*.18));
        vec3 warm=vec3(.62,.42,.3),cool=vec3(.3,.34,.55);
        vec3 color=mix(cool,warm,core)*band*(.35+.9*clouds)*(1.-lanes*.9);
        color+=vec3(.75,.55,.4)*exp(-b*b/.0016)*core*.25;
        gl_FragColor=vec4(color*.3*uOpacity,1.);
      }`}));
  mesh.renderOrder=-1;mesh.frustumCulled=false;
  return {mesh,update(opacity,camera){mesh.position.copy(camera.position);uniforms.uOpacity.value=opacity;}};
}
