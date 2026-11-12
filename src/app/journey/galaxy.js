import * as THREE from 'three';

export const GALAXY=new THREE.Vector3(4000,0,0);

// The post-contact reveal: a spiral galaxy of ~70k points in one draw call.
export function createGalaxy(texture) {
  const count=70000,branches=5,radius=170,spin=1.35;
  const positions=new Float32Array(count*3),colors=new Float32Array(count*3),sizes=new Float32Array(count);
  const inside=new THREE.Color(1,.72,.42),outside=new THREE.Color(.42,.5,1),violet=new THREE.Color(.7,.45,1),c=new THREE.Color();
  let seed=5;const r=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  for(let i=0;i<count;i++){
    const distance=Math.pow(r(),1.6)*radius,branch=(i%branches)/branches*Math.PI*2,angle=branch+distance/radius*spin*Math.PI*2;
    const scatter=()=>Math.pow(r(),3)*(r()<.5?1:-1)*(6+distance*.22);
    positions[i*3]=Math.cos(angle)*distance+scatter();positions[i*3+1]=scatter()*.25;positions[i*3+2]=Math.sin(angle)*distance+scatter();
    c.copy(inside).lerp(outside,distance/radius).lerp(violet,r()*.35);
    const bright=1+r()*1.2;colors[i*3]=c.r*bright;colors[i*3+1]=c.g*bright;colors[i*3+2]=c.b*bright;
    sizes[i]=.6+Math.pow(r(),5)*3;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.setAttribute('size',new THREE.BufferAttribute(sizes,1));
  const uniforms={uOpacity:{value:0}};
  const points=new THREE.Points(geometry,new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`attribute vec3 color;attribute float size;varying vec3 vColor;void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(size*260./-mv.z,1.,7.);}`,
    fragmentShader:`uniform float uOpacity;varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5);float a=pow(1.-smoothstep(0.,.5,d),2.)*uOpacity;gl_FragColor=vec4(vColor*a,a);}`,
  }));
  points.frustumCulled=false;
  const core=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:0xffd6a0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));core.scale.setScalar(80);
  const group=new THREE.Group();group.add(points,core);group.position.copy(GALAXY);group.visible=false;
  return {group,update(time,opacity){group.rotation.y=time*.03;uniforms.uOpacity.value=opacity;core.material.opacity=opacity*.32;}};
}
