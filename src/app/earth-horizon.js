import * as THREE from 'three';

// A lightweight procedural Earth and atmosphere: no downloaded model or textures.
export function createEarthHorizon() {
  const group=new THREE.Group();group.position.set(0,-38,-36);
  const surface=new THREE.Mesh(new THREE.SphereGeometry(34,64,32),new THREE.ShaderMaterial({
    vertexShader:`varying vec3 n;varying vec3 localP;void main(){n=normalize(mat3(modelMatrix)*normal);localP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 n;varying vec3 localP;
      void main(){
        vec3 normal=normalize(n);float sun=max(dot(normal,normalize(vec3(-.7,.8,.5))),0.);
        float continents=sin(localP.x*.19+sin(localP.z*.16)*2.)*sin(localP.y*.23+localP.z*.12);
        vec3 ocean=vec3(.018,.095,.22),land=vec3(.09,.19,.18);
        vec3 color=mix(ocean,land,smoothstep(.25,.5,continents));
        float clouds=sin(localP.x*.64+sin(localP.z*.5)*3.)*sin(localP.z*.72+localP.y*.21);
        color=mix(color,vec3(.6,.72,.8),smoothstep(.6,.85,clouds)*.65);
        gl_FragColor=vec4(color*(.22+sun*.9),1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));group.add(surface);
  const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(34.65,64,32),new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`varying vec3 vN;varying vec3 vEye;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vEye=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`varying vec3 vN;varying vec3 vEye;void main(){float rim=pow(1.-max(dot(normalize(vN),normalize(vEye)),0.),5.);gl_FragColor=vec4(vec3(.12,.48,1.),rim*.65);}`,
  }));group.add(atmosphere);
  return group;
}
