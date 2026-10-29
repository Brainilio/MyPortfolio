import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// The site's mascot: a friendly ranger bear (an original character) — a chunky brown bear walking upright in a
// khaki ranger shirt, violet bandana, olive bucket hat and boots, with a rust backpack and a rolled bedroll.
// Built from primitives at unit height, facing +z. Every vertex is tagged with its body part (aPart: 0 body,
// 1 left leg, 2 right leg, 3 left arm, 4 right arm) so the walk, the wave and the drink pose limbs in the shader.
export const BEAR_HIP=.3,BEAR_SHOULDER=new THREE.Vector3(.17,.5,0),BEAR_HAND=new THREE.Vector3(.23,.29,.02);
const part=(geometry,color,id)=>{
  const g=geometry.index?geometry.toNonIndexed():geometry;g.deleteAttribute("uv");g.deleteAttribute("normal");
  const n=g.attributes.position.count,c=new THREE.Color(color),colors=new Float32Array(n*3),parts=new Float32Array(n).fill(id);
  for(let i=0;i<n;i++)colors.set([c.r,c.g,c.b],i*3);
  g.setAttribute("color",new THREE.BufferAttribute(colors,3));g.setAttribute("aPart",new THREE.BufferAttribute(parts,1));return g;
};
const FUR="#7a4e2d",FUR_DARK="#5e3a20",MUZZLE="#d7b48a",SHIRT="#b9a77a",HAT="#5f6b3c",BANDANA="#8b6fd6",PACK="#b0532d",BEDROLL="#3f5f7a",BOOT="#3a2a1e",BLACK="#1c1512";
export function createRangerBearGeometry() {
  const parts=[];
  // Legs and boots.
  for(const [side,id] of [[1,1],[-1,2]]){
    parts.push(part(new THREE.CylinderGeometry(.075,.085,.26,7).translate(side*.09,.17,0),FUR,id));
    parts.push(part(new THREE.BoxGeometry(.13,.07,.19).translate(side*.09,.035,.025),BOOT,id));
  }
  // Body: a round tummy under the ranger shirt, with a tan belly peeking out.
  parts.push(part(new THREE.IcosahedronGeometry(.21,1).scale(1,1.05,.88).translate(0,.45,0),SHIRT,0));
  parts.push(part(new THREE.IcosahedronGeometry(.12,1).scale(1,1,.5).translate(0,.37,.14),MUZZLE,0));
  parts.push(part(new THREE.BoxGeometry(.05,.04,.02).translate(-.09,.52,.17),"#8e7c55",0));
  // Bandana: a violet triangle at the neck.
  parts.push(part(new THREE.ConeGeometry(.12,.1,3).rotateX(Math.PI).rotateY(Math.PI).scale(1.2,1,.4).translate(0,.59,.12),BANDANA,0));
  // Arms with dark paws, hanging a little out from the body.
  for(const [side,id] of [[1,4],[-1,3]]){
    const arm=new THREE.CylinderGeometry(.06,.055,.2,6),dir=new THREE.Vector3(BEAR_HAND.x*side-BEAR_SHOULDER.x*side,BEAR_HAND.y-BEAR_SHOULDER.y,BEAR_HAND.z).normalize();
    arm.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,-1,0),dir));arm.translate(side*(BEAR_SHOULDER.x+BEAR_HAND.x)/2,(BEAR_SHOULDER.y+BEAR_HAND.y)/2,BEAR_HAND.z/2);
    parts.push(part(arm,SHIRT,id));
    parts.push(part(new THREE.IcosahedronGeometry(.055,0).translate(side*BEAR_HAND.x,BEAR_HAND.y-.02,BEAR_HAND.z),FUR_DARK,id));
  }
  // Head: big and round, with a tan muzzle, black nose and eyes, round ears.
  parts.push(part(new THREE.IcosahedronGeometry(.2,1).scale(1,.92,.95).translate(0,.76,0),FUR,0));
  parts.push(part(new THREE.IcosahedronGeometry(.085,1).scale(1.15,.8,1).translate(0,.71,.17),MUZZLE,0));
  parts.push(part(new THREE.IcosahedronGeometry(.032,0).translate(0,.74,.25),BLACK,0));
  for(const side of [1,-1]){
    parts.push(part(new THREE.IcosahedronGeometry(.022,0).translate(side*.075,.8,.175),BLACK,0));
    parts.push(part(new THREE.IcosahedronGeometry(.06,0).scale(1,1,.6).translate(side*.15,.9,-.01),FUR_DARK,0));
  }
  // Olive bucket hat: a soft crown and a sloping brim.
  parts.push(part(new THREE.CylinderGeometry(.14,.17,.11,10).translate(0,.93,0),HAT,0));
  parts.push(part(new THREE.CylinderGeometry(.24,.25,.025,12).translate(0,.875,0),HAT,0));
  // Backpack with a rolled bedroll on top.
  parts.push(part(new THREE.BoxGeometry(.26,.3,.14).translate(0,.48,-.2),PACK,0));
  parts.push(part(new THREE.BoxGeometry(.18,.12,.04).translate(0,.42,-.28),"#8f4224",0));
  parts.push(part(new THREE.CylinderGeometry(.055,.055,.32,8).rotateZ(Math.PI/2).translate(0,.66,-.2),BEDROLL,0));
  const geometry=mergeGeometries(parts);geometry.computeBoundingBox();
  return geometry;
}

// Poses the limbs: legs swing from the hips, arms swing from the shoulders and can be lifted (x: forward, to drink;
// y: out to the side, to wave), and the whole bear bobs. The shadow pass uses a matching depth material.
export function createRangerBearMaterial() {
  const material=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.9});
  const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});
  const uniforms={uPhase:{value:0},uSwing:{value:0},uBob:{value:0},uArmA:{value:new THREE.Vector2()},uArmB:{value:new THREE.Vector2()}};
  material.onBeforeCompile=depth.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader=shader.vertexShader.replace("#include <common>",`#include <common>
      attribute float aPart;uniform float uPhase,uSwing,uBob;uniform vec2 uArmA,uArmB;
      vec3 rotX(vec3 p,vec3 c,float a){p-=c;float s=sin(a),k=cos(a);return c+vec3(p.x,p.y*k-p.z*s,p.y*s+p.z*k);}
      vec3 rotZ(vec3 p,vec3 c,float a){p-=c;float s=sin(a),k=cos(a);return c+vec3(p.x*k-p.y*s,p.x*s+p.y*k,p.z);}`)
      .replace("#include <begin_vertex>",`#include <begin_vertex>
        float side=(aPart==1.||aPart==4.)?1.:-1.,step=sin(uPhase+(side>0.?0.:3.14159));
        if(aPart>.5&&aPart<2.5)transformed=rotX(transformed,vec3(side*.09,${BEAR_HIP},0.),step*uSwing);
        else if(aPart>2.5){vec3 shoulder=vec3(side*${BEAR_SHOULDER.x},${BEAR_SHOULDER.y},0.);vec2 lift=side>0.?uArmA:uArmB;
          transformed=rotZ(transformed,shoulder,side*lift.y);transformed=rotX(transformed,shoulder,-step*uSwing*.9-lift.x);}
        // A little waddle: the body rolls side to side with each step.
        transformed=rotZ(transformed,vec3(0.,0.,0.),sin(uPhase)*uSwing*.06);
        transformed.y+=uBob;`);
  };
  return {material,depth,uniforms};
}

// Where the right paw is for a given arm lift (to hold the water bottle), matching the shader's pose.
export function bearHandAt(lift,out) {
  out.copy(BEAR_HAND).sub(BEAR_SHOULDER);
  const sz=Math.sin(lift.y),cz=Math.cos(lift.y);out.set(out.x*cz-out.y*sz,out.x*sz+out.y*cz,out.z);
  const a=-lift.x,sx=Math.sin(a),cx=Math.cos(a);out.set(out.x,out.y*cx-out.z*sx,out.y*sx+out.z*cx);
  return out.add(BEAR_SHOULDER);
}
