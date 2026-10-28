import * as THREE from 'three';

export function createRocketBoosters() {
  const group=new THREE.Group();
  const flameGeometry=new THREE.SphereGeometry(1,8,6);
  const outer=new THREE.Mesh(flameGeometry,new THREE.MeshBasicMaterial({color:0x9e78ff,transparent:true,opacity:.6,depthWrite:false}));
  const core=new THREE.Mesh(flameGeometry,new THREE.MeshBasicMaterial({color:0xfff1d9,transparent:true,opacity:.95,depthWrite:false}));
  outer.position.y=-.35;core.position.y=-.13;group.add(outer,core);
  const count=24,geometry=new THREE.IcosahedronGeometry(.065,1);
  const fades=new THREE.InstancedBufferAttribute(new Float32Array(count),1);
  fades.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('puffFade',fades);
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
    vertexShader:`attribute float puffFade;varying float fade;varying float lighting;
      void main(){fade=puffFade;vec3 n=normalize(normalMatrix*mat3(instanceMatrix)*normal);lighting=.65+.35*max(dot(n,normalize(vec3(-.4,.7,1.))),0.);gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,
    fragmentShader:`varying float fade;varying float lighting;void main(){gl_FragColor=vec4(vec3(.72,.69,.85)*lighting,fade);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  });
  const smoke=new THREE.InstancedMesh(geometry,material,count);smoke.frustumCulled=false;
  smoke.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.add(smoke);
  const puff=new THREE.Object3D();
  return {group,update(time,reduced){
    const pulse=reduced?1:1+Math.sin(time*12)*.12;
    outer.scale.set(.16,.46*pulse,.16);core.scale.set(.085,.24*pulse,.085);
    smoke.visible=!reduced;
    if(reduced)return;
    for(let i=0;i<count;i++){
      const age=(time*.65+i/count)%1;
      const spread=age*age*.4;
      puff.position.set(Math.sin(i*2.4+age*3)*spread,-.55-age*2.5,Math.cos(i*3.7+age*2)*spread);
      puff.rotation.set(i+age,i*2,age*2);
      puff.scale.setScalar(.55+age*3.2);puff.updateMatrix();smoke.setMatrixAt(i,puff.matrix);
      fades.setX(i,Math.sin(age*Math.PI)*(1-age)*.38);
    }
    smoke.instanceMatrix.needsUpdate=true;fades.needsUpdate=true;
  }};
}
