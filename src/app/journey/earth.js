import * as THREE from 'three';
import { EARTH_RADIUS, LAUNCH_PAD } from './flight';

const hash=(x,z)=>{const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);};
function noise(x,z){const ix=Math.floor(x),iz=Math.floor(z);let fx=x-ix,fz=z-iz;fx=fx*fx*(3-2*fx);fz=fz*fz*(3-2*fz);
  const a=hash(ix,iz),b=hash(ix+1,iz),c=hash(ix,iz+1),d=hash(ix+1,iz+1);return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz;}
const fbm=(x,z)=>{let v=0,amp=.5,f=1;for(let i=0;i<5;i++){v+=amp*noise(x*f,z*f);f*=2.03;amp*=.5;}return v;};
const peaks=[[-70,-60,52,34],[55,-95,58,40],[-120,10,40,38],[100,-20,36,30],[-20,-150,64,48],[140,-140,50,44],[-150,-120,46,40]];

// Summit at the origin; every other peak stays below it so the hero shot reads "top of the world".
export function heightAt(x,z) {
  const r=Math.hypot(x,z);
  let h=62*Math.exp(-((r/32)**2))-62;
  for(const [px,pz,height,width] of peaks)h=Math.max(h,height*Math.exp(-(((x-px)**2+(z-pz)**2)/width**2))-66);
  h+=(fbm(x/22,z/22)-.5)*16*THREE.MathUtils.smoothstep(r,4,30);
  h+=Math.abs(fbm(x/7,z/7)-.5)*-5;
  if(r>5)h=Math.min(h,-(r-5)*.32);
  return THREE.MathUtils.lerp(h,0,THREE.MathUtils.smoothstep(7-r,0,3));
}

export function createGround() {
  const group=new THREE.Group();
  const geometry=new THREE.PlaneGeometry(460,460,170,170);geometry.rotateX(-Math.PI/2);geometry.translate(0,0,-60);
  const position=geometry.attributes.position,colors=new Float32Array(position.count*3);
  const rock=new THREE.Color(0x5b6170),forest=new THREE.Color(0x1f3a32),snow=new THREE.Color(0xf3f6ff),color=new THREE.Color();
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),z=position.getZ(i),y=heightAt(x,z);position.setY(i,y);
    const snowLine=THREE.MathUtils.smoothstep(y,-26+noise(x*.2,z*.2)*8,-12);
    color.copy(forest).lerp(rock,THREE.MathUtils.smoothstep(y,-60,-38)).lerp(snow,snowLine);color.toArray(colors,i*3);
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.computeVertexNormals();
  group.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.95})));
  // Low-poly pines on the lower slopes: one instanced draw call.
  const pines=new THREE.InstancedMesh(new THREE.ConeGeometry(1.2,4.2,6),new THREE.MeshStandardMaterial({color:0x1b3b30,flatShading:true}),420);
  const dummy=new THREE.Object3D();let placed=0;
  for(let i=0;placed<420&&i<6000;i++){
    const x=(hash(i,1)-.5)*400,z=(hash(i,2)-.5)*300-70,y=heightAt(x,z);
    if(y>-36||y<-75)continue;
    dummy.position.set(x,y+1.8,z);dummy.scale.setScalar(.7+hash(i,3)*1.1);dummy.updateMatrix();pines.setMatrixAt(placed++,dummy.matrix);
  }
  pines.count=placed;group.add(pines);
  // Launch pad and a small service tower.
  const metal=new THREE.MeshStandardMaterial({color:0x8c90a3,metalness:.4,roughness:.5,flatShading:true});
  const pad=new THREE.Mesh(new THREE.CylinderGeometry(3.6,4.2,.8,10),metal);pad.position.copy(LAUNCH_PAD).add(new THREE.Vector3(0,-.4,0));
  const tower=new THREE.Mesh(new THREE.BoxGeometry(.8,10,.8),metal);tower.position.copy(LAUNCH_PAD).add(new THREE.Vector3(3.6,5,-.6));
  const beacon=new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),new THREE.MeshBasicMaterial({color:0xff5a6a}));beacon.position.copy(tower.position).add(new THREE.Vector3(0,5.2,0));
  group.add(pad,tower,beacon);
  return {group,beacon};
}

// Earth from NASA Blue Marble (day) and Black Marble (night lights), with shader-side detail,
// ocean glint, a soft procedural cloud layer and a blue-violet atmosphere rim.
// Tilted so the view below the ejection is the North Sea at ~58°N, under the auroral oval.
const noise3=`
  float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
  float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
    return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
  float fbm(vec3 p,int o){float v=0.,a=.5;for(int i=0;i<8;i++){if(i>=o)break;v+=a*n3(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return v;}`;
const vertex=`varying vec2 vUv;varying vec3 vDir;varying vec3 vN;varying vec3 vView;
  void main(){vUv=uv;vDir=normalize(position);vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vView=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}`;
// Light on Earth comes from screen-right in the look-back shots, leaving the left half on its night side.
export const SUN=new THREE.Vector3(-.8,.5,.33).normalize();

export function createEarth(anisotropy=8) {
  const loader=new THREE.TextureLoader(),load=url=>{const t=loader.load(url);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=anisotropy;return t;};
  const day=load('/textures/earth-day-4k.jpg'),night=load('/textures/earth-night-2k.jpg');
  const uniforms={uTime:{value:0},uSun:{value:SUN},uDay:{value:day},uNight:{value:night}};
  const group=new THREE.Group();
  const surface=new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS,320,160),new THREE.ShaderMaterial({uniforms,vertexShader:vertex,
    fragmentShader:`uniform vec3 uSun;uniform sampler2D uDay;uniform sampler2D uNight;varying vec2 vUv;varying vec3 vDir;varying vec3 vN;varying vec3 vView;${noise3}
      void main(){
        vec3 albedo=texture2D(uDay,vUv).rgb;
        float water=smoothstep(.01,.06,albedo.b-max(albedo.r,albedo.g)*.92);
        // Fine terrain grain the 4k map can't hold at orbital close range.
        albedo*=.92+.16*fbm(vDir*300.,3)*(1.-water*.7);
        vec3 n=normalize(vN),v=normalize(vView);
        float sun=dot(n,uSun),light=max(sun,0.);
        vec3 color=albedo*(.015+light*1.15);
        // Warm band at the terminator.
        color+=albedo*vec3(.5,.22,.08)*smoothstep(-.08,.0,sun)*(1.-smoothstep(0.,.12,sun))*.6;
        color+=vec3(1.,.92,.8)*pow(max(dot(reflect(-uSun,n),v),0.),70.)*water*.75;
        vec3 lights=pow(texture2D(uNight,vUv).rgb,vec3(1.8))*vec3(1.,.78,.5);
        color+=lights*(1.-smoothstep(-.15,.05,sun))*2.2;
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`}));
  const clouds=new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS*1.006,320,160),new THREE.ShaderMaterial({uniforms,vertexShader:vertex,transparent:true,depthWrite:false,
    fragmentShader:`uniform vec3 uSun;uniform float uTime;varying vec2 vUv;varying vec3 vDir;varying vec3 vN;varying vec3 vView;${noise3}
      void main(){
        vec3 d=vDir;float t=uTime*.003;
        vec3 q=vec3(d.x*cos(t)-d.z*sin(t),d.y,d.x*sin(t)+d.z*cos(t));
        // Long streaky weather systems rather than round blobs.
        vec3 w=vec3(q.x*1.8,q.y*4.,q.z*1.8);
        float c=fbm(w*2.2+fbm(q*3.+5.,4)*1.8,7);
        c=smoothstep(.46,.74,c)*.88;
        float sun=max(dot(normalize(vN),uSun),0.);
        gl_FragColor=vec4(vec3(.96,.97,1.)*(.03+sun*1.05),c*(.08+sun*.92));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`}));
  const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS*1.03,256,128),new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:vertex,
    fragmentShader:`uniform vec3 uSun;varying vec3 vN;varying vec3 vView;void main(){vec3 n=normalize(vN);float rim=pow(1.-max(dot(n,normalize(vView)),0.),2.6);float lit=smoothstep(-.35,.35,dot(n,uSun));gl_FragColor=vec4(vec3(.32,.45,1.)*rim*(.25+lit)*1.1,rim);}`}));
  group.add(surface,clouds,atmosphere);
  // Greenwich meridian toward the camera (pole up, see EARTH_POLE).
  group.rotation.set(0,Math.PI/2,0);
  return {group,uniforms,textures:[day,night]};
}
