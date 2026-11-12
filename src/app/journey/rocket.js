import * as THREE from 'three';
import { ROCKET_HEIGHT } from './flight';

// A retro rocket built from lathe profiles: faceted cream hull, violet fins and band, a glowing
// porthole and a side hatch the astronaut is ejected through. Centred on its origin, ROCKET_HEIGHT tall.
export function createRocket() {
  const group=new THREE.Group(),half=ROCKET_HEIGHT/2;
  // Matte-ish materials: shiny facets sparkle under bloom as the rocket turns.
  const hull=new THREE.MeshStandardMaterial({color:0xe9e4da,roughness:.7,metalness:0,flatShading:true});
  const accent=new THREE.MeshStandardMaterial({color:0x7360c8,roughness:.7,metalness:0,flatShading:true});
  const metal=new THREE.MeshStandardMaterial({color:0x4a4e5c,roughness:.6,metalness:.3,flatShading:true});
  const lathe=(points,material,segments=28)=>{
    const mesh=new THREE.Mesh(new THREE.LatheGeometry(points.map(([r,y])=>new THREE.Vector2(r,y-half)),segments),material);
    group.add(mesh);return mesh;
  };
  // Hull: slim waist, full belly, long ogive nose.
  lathe([[.82,.75],[1.02,1.3],[1.16,2.4],[1.2,3.6],[1.12,4.8],[.92,5.9],[.62,6.9],[.3,7.6],[0,8]],hull);
  lathe([[.84,.72],[.9,.95]],accent);
  lathe([[1.135,4.45],[1.165,4.45],[1.165,4.95],[1.115,4.95]],accent,28);
  // Engine bell.
  lathe([[.38,.05],[.62,.22],[.7,.45],[.64,.62],[.5,.78]],metal);
  // Three swept fins.
  const fin=new THREE.Shape();fin.moveTo(0,0);fin.lineTo(1.25,-.55);fin.lineTo(1.35,-.15);fin.lineTo(.45,1.9);fin.lineTo(0,2.3);fin.closePath();
  const finGeometry=new THREE.ExtrudeGeometry(fin,{depth:.12,bevelEnabled:false});finGeometry.translate(0,0,-.06);
  for(let i=0;i<3;i++){
    const mesh=new THREE.Mesh(finGeometry,accent),a=i/3*Math.PI*2+Math.PI/6;
    mesh.position.set(Math.cos(a)*.9,.9-half,Math.sin(a)*.9);mesh.rotation.y=-a;group.add(mesh);
  }
  // Porthole facing the launch camera, with a softly lit glass.
  const facing=Math.atan2(13,17),place=(object,radius,y)=>{object.position.set(Math.sin(facing)*radius,y-half,Math.cos(facing)*radius);object.rotation.y=facing;group.add(object);};
  place(new THREE.Mesh(new THREE.TorusGeometry(.34,.07,8,20),metal),1.13,5.55);
  place(new THREE.Mesh(new THREE.CircleGeometry(.32,20),new THREE.MeshStandardMaterial({color:0x2a2350,emissive:0x8c74ff,emissiveIntensity:.35,roughness:.4,metalness:.2})),1.12,5.55);
  // Hatch: hinged on its left edge so it swings open at the ejection.
  const hinge=new THREE.Group(),door=new THREE.Mesh(new THREE.BoxGeometry(.72,1.15,.06),hull);
  door.position.x=.36;hinge.add(door);
  const frame=new THREE.Mesh(new THREE.BoxGeometry(.82,1.25,.04),metal);
  place(frame,1.19,3.25);
  hinge.position.set(Math.sin(facing)*1.23-Math.cos(facing)*.36,3.25-half,Math.cos(facing)*1.23+Math.sin(facing)*.36);hinge.rotation.y=facing;group.add(hinge);
  // Where the astronaut comes out, in rocket space.
  const exit=new THREE.Vector3(Math.sin(facing)*1.9,3.25-half,Math.cos(facing)*1.9);
  return {group,exit,setHatch(open){hinge.rotation.y=facing-open*1.9;}};
}
