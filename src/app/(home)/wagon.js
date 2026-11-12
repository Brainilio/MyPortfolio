import * as THREE from "three";

// The loaded wagon (Poly Pizza, see public/models/CREDITS.md), shared by the road trips: scaled to `length`, facing
// +z, flat shaded, with its wheels spun in the vertex shader around each wheel's own centre. Returns the spin
// uniform at once; `done` gets the ready-to-add model when it has loaded.
export function loadWagon(loader,{length=2.6,shadows=false}={},done) {
  const wheelSpin={value:0};
  loader.load("/models/island/wagon.glb",gltf=>{
    const model=gltf.scene,box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
    // The wagon's length runs along x with its nose at -x; turn it so it faces +z (the way the car travels).
    const holder=new THREE.Group();holder.add(model);holder.rotation.y=Math.PI/2;
    model.position.set(-(box.min.x+box.max.x)/2,-box.min.y,-(box.min.z+box.max.z)/2);
    holder.scale.setScalar(length/size.x);
    model.traverse(o=>{
      if(!o.isMesh)return;o.castShadow=shadows;o.material=o.material.clone();o.material.flatShading=true;o.material.roughness=.8;o.material.metalness=0;
      // Tyres are the near-black material.
      const c=o.material.color,wheel=c.r<.03&&c.g<.03&&c.b<.03;
      if(!wheel)return;
      // Find the four wheel centres for this mesh (by quadrant), then spin vertices around them.
      const pos=o.geometry.attributes.position,b=new THREE.Box3().setFromBufferAttribute(pos),mid=b.getCenter(new THREE.Vector3()),sums=[0,1,2,3].map(()=>new THREE.Vector3()),counts=[0,0,0,0];
      for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),q=(x>mid.x?1:0)+(z>mid.z?2:0);sums[q].add(new THREE.Vector3(x,pos.getY(i),z));counts[q]++;}
      const centers=sums.map((v,q)=>counts[q]?v.divideScalar(counts[q]):mid.clone());
      o.material.onBeforeCompile=shader=>{
        shader.uniforms.uSpin=wheelSpin;shader.uniforms.uMid={value:mid};shader.uniforms.uCenters={value:centers};
        shader.vertexShader=shader.vertexShader.replace("#include <common>","#include <common>\nuniform float uSpin;uniform vec3 uMid;uniform vec3 uCenters[4];")
          .replace("#include <begin_vertex>",`#include <begin_vertex>
            int q=(transformed.x>uMid.x?1:0)+(transformed.z>uMid.z?2:0);vec3 c=uCenters[0];
            if(q==1)c=uCenters[1];else if(q==2)c=uCenters[2];else if(q==3)c=uCenters[3];
            vec2 d=transformed.xy-c.xy;float s=sin(uSpin),k=cos(uSpin);transformed.xy=c.xy+vec2(d.x*k-d.y*s,d.x*s+d.y*k);`);
      };
    });
    done(holder);
  },undefined,()=>{});
  return wheelSpin;
}
