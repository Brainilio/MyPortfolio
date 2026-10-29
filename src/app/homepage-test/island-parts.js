import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// One palette for everything on the island, so downloaded props and procedural pieces read as one world.
export const PALETTE={
  grass:['#6aa66b','#78b56d','#5f9a63'],sand:'#e6c99c',edge:'#4f8a5c',dirt:'#8a5a44',
  rock:['#6d5f80','#5d506f','#4a405c','#3c344b'],water:'#5cc6d4',waterDeep:'#3a8db2',
  pine:['#2f7d5b','#3b9068'],trunk:'#6b4a3a',cloud:'#fbf6ff',bird:'#2a2140',
};
// Kit materials remapped onto the palette (by source material name).
export const KIT_COLORS={Stone:'#8e86a3',Snow:'#f4f0ff',Dirt:'#7a5646',Wood:'#6b4a3a',Orange:'#ee8a4f',LightOrange:'#f5b366',White:'#ece6dc',Black:'#3a3340',DarkGreen:'#3f8a5f',Green:'#76b76a'};

// Seeded random, so the island is the same on every visit.
export function random(seed) {
  let s=seed>>>0;
  return ()=>{s=(s+0x6d2b79f5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
}
const smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};

// Island layout: a wobbly outline, the mountain at the back left, a river curling to the front right edge.
export const RADIUS=7,MOUNTAIN=new THREE.Vector2(-1.6,-2.9);
export const outline=a=>RADIUS*(1+.07*Math.sin(3*a+.5)+.05*Math.sin(5*a+2)+.03*Math.sin(9*a));
const river=new THREE.CatmullRomCurve3([[-1.2,0,-.9],[-.2,0,.5],[1.2,0,1.5],[3,0,2.4],[4.9,0,3.6],[6.6,0,4.6]].map(p=>new THREE.Vector3(...p)));
const riverPoints=river.getSpacedPoints(80);
export function riverDistance(x,z) {
  let best=1e9,at=0;
  riverPoints.forEach((p,i)=>{const d=(p.x-x)**2+(p.z-z)**2;if(d<best){best=d;at=i;}});
  return {d:Math.sqrt(best),t:at/(riverPoints.length-1)};
}
export function heightAt(x,z) {
  const r=Math.hypot(x,z),edge=r/outline(Math.atan2(z,x));
  let h=.16*Math.sin(x*.9+1.3)*Math.cos(z*.8-.4)+.08*Math.sin(x*2.1+z*1.7);
  h+=.5*smooth(4.4,1.6,Math.hypot(x-MOUNTAIN.x,z-MOUNTAIN.y));
  h-=.22*smooth(.72,1,edge);
  const {d,t}=riverDistance(x,z);if(t>0)h-=.55*smooth(1.55,.55,d);
  return h;
}

// Builds a flat-shaded, per-face coloured mesh from a list of triangles.
function faceted(triangles,colorOf) {
  const positions=new Float32Array(triangles.length*9),colors=new Float32Array(triangles.length*9),c=new THREE.Color();
  triangles.forEach((tri,i)=>{
    colorOf(tri,c);
    tri.forEach((v,j)=>{positions.set([v.x,v.y,v.z],i*9+j*3);colors.set([c.r,c.g,c.b],i*9+j*3);});
  });
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  return geometry;
}
export const flatMaterial=()=>new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.95,metalness:0});

// The floating chunk: grassy top with a carved river bed, and a jagged, layered underside.
export function createIsland(seed=7) {
  const r=random(seed),SEG=64,RINGS=14,top=[],grid=[];
  for(let ring=0;ring<=RINGS;ring++){
    const row=[];
    for(let s=0;s<SEG;s++){
      const a=s/SEG*Math.PI*2,k=ring/RINGS,jitter=ring>0&&ring<RINGS?(r()-.5)*.25:0;
      const radius=outline(a)*k+jitter,x=Math.cos(a)*radius,z=Math.sin(a)*radius;
      row.push(new THREE.Vector3(x,heightAt(x,z),z));
      if(ring===0)break;
    }
    grid.push(row);
  }
  for(let ring=1;ring<=RINGS;ring++)for(let s=0;s<SEG;s++){
    const a=grid[ring][s],b=grid[ring][(s+1)%SEG];
    if(ring===1){top.push([grid[0][0],b,a]);continue;}
    const c=grid[ring-1][s],d=grid[ring-1][(s+1)%SEG];
    top.push([c,d,a],[d,b,a]);
  }
  const grassColors=PALETTE.grass.map(h=>new THREE.Color(h)),sand=new THREE.Color(PALETTE.sand),edgeGreen=new THREE.Color(PALETTE.edge);
  const topGeometry=faceted(top,(tri,c)=>{
    const x=(tri[0].x+tri[1].x+tri[2].x)/3,z=(tri[0].z+tri[1].z+tri[2].z)/3,{d,t}=riverDistance(x,z),edge=Math.hypot(x,z)/outline(Math.atan2(z,x));
    c.copy(grassColors[Math.floor(r()*grassColors.length)]);
    if(edge>.86)c.lerp(edgeGreen,.6);
    if(t>0&&d<1.6)c.copy(sand);
  });
  // Underside: shrinking, jittered rings down to a point, banded dirt then rock.
  const rings=[grid[RINGS]],layers=[[.97,-.7],[.82,-2],[.62,-3.6],[.4,-5.3],[.18,-7]];
  for(const [scale,y] of layers)rings.push(grid[RINGS].map(v=>new THREE.Vector3(v.x*scale*(.9+r()*.2),y+(r()-.5)*.7,v.z*scale*(.9+r()*.2))));
  const tip=new THREE.Vector3(.3,-8.6,-.2),under=[];
  for(let k=1;k<rings.length;k++)for(let s=0;s<SEG;s++){const a=rings[k-1][s],b=rings[k-1][(s+1)%SEG],c=rings[k][s],d=rings[k][(s+1)%SEG];under.push([a,b,c],[b,d,c]);}
  for(let s=0;s<SEG;s++)under.push([rings.at(-1)[s],rings.at(-1)[(s+1)%SEG],tip]);
  const dirt=new THREE.Color(PALETTE.dirt),rocks=PALETTE.rock.map(h=>new THREE.Color(h));
  const underGeometry=faceted(under,(tri,c)=>{const y=(tri[0].y+tri[1].y+tri[2].y)/3;if(y>-1.1)c.copy(dirt);else c.copy(rocks[Math.min(3,Math.floor(-y/2.2)+(r()<.3?1:0))]);});
  const material=flatMaterial(),group=new THREE.Group(),surface=new THREE.Mesh(topGeometry,material);
  group.add(surface,new THREE.Mesh(underGeometry,material));
  return {group,surface,material};
}

// River and waterfall: ribbons with a flowing, banded water shader.
export function createWater() {
  const uniforms={uTime:{value:0},uFlow:{value:0},uSurge:{value:0},uLength:{value:1},uShallow:{value:new THREE.Color(PALETTE.water)},uDeep:{value:new THREE.Color(PALETTE.waterDeep)}};
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:`varying vec2 vUv;uniform float uSurge,uTime;void main(){vUv=uv;vec3 p=position;p.y+=uSurge*.07*(1.+sin(uv.y*9.-uTime*8.));gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`varying vec2 vUv;uniform float uTime,uFlow,uSurge,uLength;uniform vec3 uShallow,uDeep;
      void main(){
        float across=abs(vUv.x-.5)*2.,flow=fract(vUv.y*1.6-uFlow*.5+sin(vUv.x*9.+vUv.y*5.)*.06);
        float band=smoothstep(.0,.08,flow)*smoothstep(.22,.1,flow)*(1.-across*.7);
        float foam=smoothstep(.72,.95,across+sin(vUv.y*16.-uTime*3.)*.04);
        vec3 color=mix(uDeep,uShallow,across*.7+.15)+band*(.3+uSurge*.5)+foam*(.55+uSurge*.4)+uSurge*.12;
        float fade=smoothstep(0.,.25,vUv.y)*(1.-smoothstep(uLength-.6,uLength,vUv.y));
        gl_FragColor=vec4(color,.92*fade);
        #include <colorspace_fragment>
      }`});
  const ribbon=(points,widthAt)=>{
    const positions=[],uvs=[],index=[],side=new THREE.Vector3(1,0,0),flat=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
    const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+points[i].distanceTo(points[i-1]));
    const total=lengths.at(-1);
    points.forEach((p,i)=>{
      // Side stays horizontal: from the flow direction while it runs flat, frozen once it pours straight down.
      flat.subVectors(points[Math.min(i+1,points.length-1)],points[Math.max(i-1,0)]).setY(0);
      if(flat.lengthSq()>.02)side.crossVectors(flat.normalize(),up).normalize();
      const k=lengths[i]/total,w=widthAt(k);
      positions.push(p.x-side.x*w,p.y,p.z-side.z*w,p.x+side.x*w,p.y,p.z+side.z*w);
      uvs.push(0,lengths[i]/4,1,lengths[i]/4);
      if(i)index.push(i*2-2,i*2-1,i*2,i*2-1,i*2+1,i*2);
    });
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(index);
    return g;
  };
  // The river runs until it leaves the island, then pours off the edge.
  const flowing=[];
  for(const p of riverPoints){const inside=Math.hypot(p.x,p.z)<outline(Math.atan2(p.z,p.x))-.05;flowing.push(new THREE.Vector3(p.x,-.2,p.z));if(!inside)break;}
  // One continuous sheet: the river curls over the lip and pours straight down.
  const lip=flowing.at(-1),out=new THREE.Vector3(lip.x,0,lip.z).normalize(),stream=[...flowing];
  [[.22,-.24],[.42,-.36],[.56,-.62],[.62,-1]].forEach(([o,y])=>stream.push(new THREE.Vector3(lip.x+out.x*o,y,lip.z+out.z*o)));
  for(let i=1;i<=20;i++){const t=i/20;stream.push(new THREE.Vector3(lip.x+out.x*(.62+t*t*1.3),-1-t*8,lip.z+out.z*(.62+t*t*1.3)));}
  const span=list=>list.reduce((sum,p,i)=>i?sum+p.distanceTo(list[i-1]):0,0),riverShare=span(flowing)/span(stream);
  const geometry=ribbon(stream,k=>k<riverShare?.62+.3*(k/riverShare)+.08*Math.sin(k*20):.92-(k-riverShare)*.45);
  uniforms.uLength.value=geometry.attributes.uv.array.at(-1);
  const group=new THREE.Group();group.add(new THREE.Mesh(geometry,material));
  return {group,uniforms,lip,path:flowing};
}

// Faceted pines: three stacked cones on a trunk, merged with vertex colours into one geometry.
export function createPineGeometry(seed) {
  const r=random(seed),parts=[],paint=(g,hex)=>{const c=new THREE.Color(hex),n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++)a.set([c.r,c.g,c.b],i*3);g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;};
  parts.push(paint(new THREE.CylinderGeometry(.08,.12,.6,5).translate(0,.3,0),PALETTE.trunk));
  [[.62,.9,.45],[.5,.8,.9],[.36,.7,1.3]].forEach(([radius,height,y],i)=>parts.push(paint(new THREE.ConeGeometry(radius*(.9+r()*.2),height,6).rotateY(r()*2).translate(0,y+height/2-.2,0),PALETTE.pine[i%2])));
  const merged=mergeGeometries(parts.map(g=>{const flat=g.toNonIndexed();flat.deleteAttribute('uv');flat.deleteAttribute('normal');return flat;}));
  merged.computeVertexNormals();
  return merged;
}

// Turns a loaded prop into one vertex-coloured geometry (palette colours baked in), ready to instance.
export function bakeProp(object) {
  const parts=[];object.updateMatrixWorld(true);
  object.traverse(child=>{
    if(!child.isMesh)return;
    const source=child.geometry,g=new THREE.BufferGeometry(),pos=source.attributes.position,n=pos.count;
    // Copy into plain floats (the GLB uses quantized attributes), then apply the node transform.
    const p=new Float32Array(n*3);for(let i=0;i<n;i++)p.set([pos.getX(i),pos.getY(i),pos.getZ(i)],i*3);
    g.setAttribute('position',new THREE.BufferAttribute(p,3));if(source.index)g.setIndex(source.index.clone());
    g.applyMatrix4(child.matrixWorld);
    const flat=g.toNonIndexed(),c=new THREE.Color(KIT_COLORS[child.material.name]??'#888888'),col=new Float32Array(flat.attributes.position.count*3);
    for(let i=0;i<flat.attributes.position.count;i++)col.set([c.r,c.g,c.b],i*3);
    flat.setAttribute('color',new THREE.BufferAttribute(col,3));parts.push(flat);
  });
  const merged=mergeGeometries(parts);merged.computeVertexNormals();merged.computeBoundingBox();
  return merged;
}

// Instanced foliage that sways: idle breeze plus a per-instance shake the pointer can kick.
export function createSwayingInstances(geometry,placements,material) {
  geometry.computeBoundingBox();
  const height=geometry.boundingBox.max.y,count=placements.length,sway=new Float32Array(count),phase=new Float32Array(count);
  const mesh=new THREE.InstancedMesh(geometry,material,count),dummy=new THREE.Object3D();
  placements.forEach((p,i)=>{dummy.position.copy(p.position);dummy.rotation.set(0,p.rotation,0);dummy.scale.setScalar(p.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);phase[i]=i*1.7;});
  geometry.setAttribute('aSway',new THREE.InstancedBufferAttribute(sway,1));geometry.setAttribute('aPhase',new THREE.InstancedBufferAttribute(phase,1));
  mesh.userData.placements=placements;
  return {mesh,sway,height,update(){geometry.attributes.aSway.needsUpdate=true;}};
}
// Shared foliage material: flat shaded, vertex coloured, with the sway in the vertex shader.
export function createFoliageMaterial(uniforms) {
  const material=flatMaterial();
  material.onBeforeCompile=shader=>{
    shader.uniforms.uTime=uniforms.uTime;shader.uniforms.uBreeze=uniforms.uBreeze;shader.uniforms.uGust=uniforms.uGust;
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime,uBreeze,uGust;attribute float aSway,aPhase;')
      .replace('#include <begin_vertex>',`#include <begin_vertex>
        float bend=max(position.y,0.);bend*=bend*.25;
        #ifdef USE_INSTANCING
          vec3 root=instanceMatrix[3].xyz;
        #else
          vec3 root=vec3(0.);
        #endif
        // A gust rolls across the island from one side: each tree leans in turn, then springs back.
        float wave=.5+.5*sin(uTime*1.15-root.x*.55-root.z*.3);wave=wave*wave*wave;
        transformed.x+=wave*uGust*bend;transformed.z+=wave*uGust*.45*bend;
        transformed.x+=(sin(uTime*1.3+aPhase)*uBreeze+sin(uTime*11.+aPhase)*aSway)*bend;
        transformed.z+=(cos(uTime*1.1+aPhase*.7)*uBreeze*.6+cos(uTime*9.+aPhase)*aSway*.7)*bend;`);
  };
  return material;
}

// Low-poly cloud: a cluster of squashed icosahedrons.
export function createCloud(seed) {
  const r=random(seed),parts=[];
  const puffs=4+Math.floor(r()*3);
  for(let i=0;i<puffs;i++){const s=.7+r()*.8;parts.push(new THREE.IcosahedronGeometry(s,0).scale(1,.7,1).translate((i-puffs/2)*.9+r()*.3,r()*.35,(r()-.5)*.8).toNonIndexed());}
  const g=mergeGeometries(parts);g.computeVertexNormals();
  return new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:PALETTE.cloud,flatShading:true,roughness:1,emissive:'#3b2a5c',emissiveIntensity:.25}));
}

// A tiny flapping bird: a body wedge and two hinged wings.
export function createBird(material) {
  const bird=new THREE.Group();
  const body=new THREE.Mesh(new THREE.ConeGeometry(.07,.36,4).rotateX(Math.PI/2),material);
  const wing=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,-.1),new THREE.Vector3(0,0,.12),new THREE.Vector3(.42,0,-.04)]);wing.computeVertexNormals();
  const left=new THREE.Mesh(wing,material),right=new THREE.Mesh(wing,material);right.scale.x=-1;
  bird.add(body,left,right);bird.userData.wings=[left,right];
  return bird;
}

// A soaring bald eagle: dark broad wings with fingered tips, white head and tail, yellow beak.
export function createEagle() {
  const brown=new THREE.MeshStandardMaterial({color:'#4a3426',flatShading:true,roughness:1,side:THREE.DoubleSide});
  const white=new THREE.MeshStandardMaterial({color:'#f4efe6',flatShading:true,roughness:1,side:THREE.DoubleSide});
  const yellow=new THREE.MeshStandardMaterial({color:'#f2b632',flatShading:true,roughness:1});
  const eagle=new THREE.Group();
  eagle.add(new THREE.Mesh(new THREE.ConeGeometry(.14,.7,5).rotateX(-Math.PI/2).scale(1,.8,1),brown));
  const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.12,0),white);head.position.set(0,.03,.4);eagle.add(head);
  const beak=new THREE.Mesh(new THREE.ConeGeometry(.04,.13,4).rotateX(Math.PI/2),yellow);beak.position.set(0,.01,.53);eagle.add(beak);
  const tail=new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,-.3),new THREE.Vector3(-.16,0,-.62),new THREE.Vector3(.16,0,-.62)]),white);tail.geometry.computeVertexNormals();eagle.add(tail);
  // Each wing: a broad inner panel and an outer hand with spread primaries, hinged at the shoulder.
  const shape=new THREE.Shape([[0,.14],[.55,.2],[1.05,.1],[1.2,.02],[1.12,-.04],[1.18,-.1],[1.06,-.12],[1.1,-.18],[.95,-.18],[.5,-.2],[0,-.14]].map(([x,y])=>new THREE.Vector2(x,y)));
  const wingGeometry=new THREE.ShapeGeometry(shape).rotateX(Math.PI/2);
  const wings=[1,-1].map(side=>{const pivot=new THREE.Group(),wing=new THREE.Mesh(wingGeometry,brown);wing.scale.x=side;pivot.add(wing);pivot.position.set(.05*side,.03,.05);eagle.add(pivot);return pivot;});
  eagle.userData.wings=wings;
  return eagle;
}

// The bear has no rig: its legs swing in the vertex shader (each quarter below the hips pivots at its hip).
export function createBearMaterial(geometry) {
  geometry.computeBoundingBox();
  const box=geometry.boundingBox,hip=box.min.y+(box.max.y-box.min.y)*.36,mid=(box.min.z+box.max.z)/2,pos=geometry.attributes.position;
  let front=0,back=0,nf=0,nb=0;
  for(let i=0;i<pos.count;i++){const y=pos.getY(i),z=pos.getZ(i);if(y<hip*.7){if(z>mid){front+=z;nf++;}else{back+=z;nb++;}}}
  const uniforms={uPhase:{value:0},uSwing:{value:0},uBob:{value:0},uHeight:{value:box.max.y-box.min.y},uHip:{value:hip},uMid:{value:mid},uFront:{value:nf?front/nf:mid+1},uBack:{value:nb?back/nb:mid-1},uCenterX:{value:(box.min.x+box.max.x)/2}};
  const material=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.95});
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uPhase,uSwing,uBob,uHeight,uHip,uMid,uFront,uBack,uCenterX;')
      .replace('#include <begin_vertex>',`#include <begin_vertex>
        if(transformed.y<uHip){
          bool front=transformed.z>uMid,left=transformed.x>uCenterX;
          // Diagonal pairs move together, like a trot.
          float offset=(front==left)?0.:3.14159;
          float a=sin(uPhase+offset)*uSwing*smoothstep(uHip,uHip*.55,transformed.y);
          float pivot=front?uFront:uBack,dy=transformed.y-uHip,dz=transformed.z-pivot;
          transformed.z=pivot+dz*cos(a)-dy*sin(a);transformed.y=uHip+dz*sin(a)+dy*cos(a);
        }
        // Bob is a fraction of body height (the compressed mesh lives in its own small unit space).
        transformed.y+=uBob*uHeight;`);
  };
  return {material,uniforms};
}

// A small river trout: a faceted body, a tail fin that wags, silvery with a pink flank.
export function createFish(seed) {
  const r=random(seed),fish=new THREE.Group();
  const colors=['#9fb9c4','#c2b28f','#e59a7d'];
  const body=new THREE.Mesh(new THREE.OctahedronGeometry(.1,0).scale(.6,.55,1.6),new THREE.MeshStandardMaterial({color:colors[Math.floor(r()*3)],flatShading:true,roughness:.5,metalness:.2}));
  const tailGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(0,.07,-.12),new THREE.Vector3(0,-.07,-.12)]);tailGeometry.computeVertexNormals();
  const tail=new THREE.Mesh(tailGeometry,new THREE.MeshStandardMaterial({color:'#7d93a3',flatShading:true,side:THREE.DoubleSide}));tail.position.z=-.14;
  fish.add(body,tail);fish.userData.tail=tail;
  return fish;
}
