import * as THREE from 'three';

// Stylized gravitational lensing and plasma, without ray marching or bloom passes.
export function createBlackHole() {
  const group=new THREE.Group();
  const uniforms={uTime:{value:0},uPull:{value:0}};
  const material=new THREE.ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`varying vec2 vUv;
      void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform float uPull;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){
        vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);
      }
      void main(){
        vec2 p=(vUv-.5)*vec2(3.,2.);
        p.y+=p.x*.045;
        float r=length(p),a=atan(p.y,p.x);
        float t=uTime*(.3+uPull*.2);
        // Differential rotation and turbulent bands in the thin accretion disk.
        vec2 diskP=vec2(p.x,p.y*7.5);
        float dr=length(diskP),da=atan(diskP.y,diskP.x);
        float turbulence=noise(vec2(dr*35.-t*3.,sin(da)*6.+t));
        float filaments=.55+.25*sin(dr*210.+da*4.-t*10.)+.2*turbulence;
        float disk=smoothstep(.28,.37,dr)*(1.-smoothstep(.65,1.42,dr));
        disk*=filaments*(.65+.35*cos(da-.6));
        vec3 warm=mix(vec3(.55,.24,.13),vec3(1.,.84,.52),exp(-max(dr-.3,0.)*2.8));
        vec3 color=warm*disk*1.6;
        float alpha=disk;
        // The back of the disk appears bent above/below the event horizon.
        float bend=exp(-pow((r-.335)/.027,2.));
        float arcTexture=.75+.25*noise(vec2(a*18.-t*2.,r*130.+t));
        float arc=bend*arcTexture*(.55+.45*smoothstep(-.1,.2,p.y));
        float photon=exp(-abs(r-.309)*550.);
        float corona=exp(-abs(r-.328)*27.)*.25;
        color+=vec3(1.,.72,.35)*arc*1.7+vec3(1.,.94,.77)*photon*1.5;
        color+=mix(vec3(.28,.15,.48),vec3(.7,.32,.1),.7)*corona;
        alpha=max(alpha,clamp(arc+photon+corona,0.,1.));
        // Keep a truly dark center; the foreground plasma crosses its lower lip.
        float shadow=1.-smoothstep(.296,.307,r);
        float foreground=(1.-smoothstep(-.01,.01,p.y))*disk;
        color=mix(color,vec3(.0005,.0006,.0015),shadow*(1.-foreground*.75));
        alpha=max(alpha,shadow);
        float equatorialGlow=exp(-abs(p.y)*45.)*exp(-abs(p.x)*1.6)*.22;
        color+=vec3(.85,.44,.18)*equatorialGlow;
        alpha=max(alpha,equatorialGlow);
        alpha*=smoothstep(0.,.06,vUv.x)*smoothstep(0.,.06,1.-vUv.x)*smoothstep(0.,.08,vUv.y)*smoothstep(0.,.08,1.-vUv.y);
        gl_FragColor=vec4(color,alpha);
      }`,
  });
  const disk=new THREE.Mesh(new THREE.PlaneGeometry(24,16),material);
  group.add(disk);
  // An opaque core keeps distant stars from showing through the horizon.
  group.add(new THREE.Mesh(new THREE.SphereGeometry(2.38,24,16),new THREE.MeshBasicMaterial({color:0x000001})));
  const count=240,seeds=new Float32Array(count),positions=new Float32Array(count*3);
  for(let i=0;i<count;i++)seeds[i]=(i+.5)/count;
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('seed',new THREE.BufferAttribute(seeds,1));
  const particleMaterial=new THREE.ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,
    vertexShader:`attribute float seed;uniform float uTime;uniform float uPull;varying float fade;
      void main(){
        float phase=fract(seed+uTime*(.035+uPull*.035));
        float radius=mix(10.5,2.55,phase*phase);
        float angle=seed*165.0+phase*phase*8.0+uTime*.1;
        vec3 p=vec3(cos(angle)*radius,sin(angle)*radius*.45,sin(seed*50.)*.8);
        fade=sin(phase*3.14159)*(.3+uPull*.5)*smoothstep(2.6,3.1,length(p.xy));
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(23./max(1.,-mv.z),1.,3.);
      }`,
    fragmentShader:`varying float fade;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(1.,.72,.4,fade*(1.-smoothstep(.1,.5,d)));}`,
  });
  const particles=new THREE.Points(geometry,particleMaterial);particles.frustumCulled=false;group.add(particles);
  return {
    group,
    update(time,pull,camera,reduced){
      group.quaternion.copy(camera.quaternion);
      uniforms.uTime.value=reduced?0:time;
      uniforms.uPull.value=pull;
      particles.visible=!reduced;
    },
  };
}
