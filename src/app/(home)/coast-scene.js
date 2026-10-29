"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { adaptivePixelRatio } from "./perf";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { random, createBird } from "./island-parts";
import { chunkSpots, paintGeometry, mergeFlat, createTuft, createBush, createSwayMaterial, createForestPine, createSpruce, createRoundTree } from "./forest-parts";

// Contact as the end of the road: Big Sur on a sunny late afternoon, a little haze and a fog bank on the horizon. Highway 1 hugs dark cliffs above the Pacific
// and crosses a canyon on a concrete arch bridge; sea stacks stand in the surf; fog banks roll in. Out on the point a
// lighthouse turns its beam through the gloom, and the pointer steers it: whatever the beam finds (an orca, sharks,
// sea lions, kayakers) lights up and counts as spotted. The orca breaches when it's caught in the light.
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
// The shoreline wanders in and out (x of the water's edge for each z); land is to the west (-x).
const shoreX=z=>8*Math.sin(z*.03)+3.5*Math.sin(z*.085+1.3)+2*Math.sin(z*.21);
const SHORE_GLSL=`float shoreX(float z){return 8.*sin(z*.03)+3.5*sin(z*.085+1.3)+2.*sin(z*.21);}`;
// The swell: long rollers running in toward the shore with sharp crests (a peaked sine), a cross swell and chop.
const WAVES_GLSL=`
  float peak(float x){return pow(.5+.5*sin(x),2.6)*2.-1.;}
  float swell(vec2 p,float t){return .95*peak(p.x*.085+p.y*.018+t*1.15)+.55*peak(p.x*.05-p.y*.04+t*.75+1.7)+.38*sin(p.x*.36+p.y*.29+t*2.1)+.3*sin(p.y*.42-p.x*.21-t*1.7);}
  float crest(vec2 p,float t){return max(peak(p.x*.085+p.y*.018+t*1.15),peak(p.x*.05-p.y*.04+t*.75+1.7));}
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}`;
const peak=x=>Math.pow(.5+.5*Math.sin(x),2.6)*2-1;
const swellAt=(x,z,t)=>.95*peak(x*.085+z*.018+t*1.15)+.55*peak(x*.05-z*.04+t*.75+1.7)+.38*Math.sin(x*.36+z*.29+t*2.1)+.3*Math.sin(z*.42-x*.21-t*1.7);
const CANYON=-72,LIGHTHOUSE=new THREE.Vector3(0,0,-112);
export const SIGHTINGS=["orca","shark","sea lion","kayaker"];

export default function CoastScene({ state, onSpot, onReady }) {
  // Tells the page this world is built (the loading screen builds the worlds one after another).
  const ready=useRef(onReady);ready.current=onReady;
  const host=useRef(null),spotted=useRef(onSpot);
  spotted.current=onSpot;
  useEffect(()=>{
    const mount=host.current;
    let renderer,disposed=false,raf=0;
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"}); } catch { ready.current?.(); return; }
    const adapt=adaptivePixelRatio(renderer,{onChange:()=>frameSize()});
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    mount.appendChild(renderer.domElement);
    const preference=matchMedia("(prefers-reduced-motion: reduce)"),lite=matchMedia("(pointer: coarse)").matches;
    const onScreen=()=>state.current.live.includes(4);
    const scene=new THREE.Scene();// Haze only in the distance: the foreground stays crisp, the far coast and the horizon melt into it.
    scene.fog=new THREE.Fog("#d4e0e7",150,700);
    const camera=new THREE.PerspectiveCamera(40,1,1,1800);
    const rng=random(77),time={value:0};

    // Late afternoon sun over the sea (from the west and a little south), a clear blue sky.
    scene.add(new THREE.HemisphereLight("#cfe6ff","#6a5a40",1.15));
    const SUN=new THREE.Vector3(.75,.55,-.35).normalize(),sun=new THREE.DirectionalLight("#ffe3b8",2.7);sun.position.copy(SUN).multiplyScalar(100);scene.add(sun);

    // The land: dark cliffs straight out of the sea, dry golden grass and chaparral on top, rising to the Santa Lucia
    // ridges; a canyon cuts down to a little cove with a beach.
    const canyon=z=>Math.exp(-(((z-CANYON)/9)**2));
    const landHeight=(x,z)=>{
      const d=shoreX(z)-x;if(d<0)return -3+d*.4;
      const cove=canyon(z),cliff=(16+6*Math.sin(z*.05)+4*Math.sin(z*.13))*(1-cove*.85);
      const ridge=smooth((d-14)/70)*(46+14*Math.sin(z*.02+1)+8*Math.sin(z*.07))*(1-cove*.5*smooth(1-(d-14)/50));
      const lumps=1.6*Math.sin(x*.21+z*.13)*Math.cos(z*.17-x*.09)*smooth((d-3)/6);
      return cliff*smooth(d/4.5)+ridge+lumps-cove*smooth((d-4)/30)*4;
    };
    {
      const g=new THREE.PlaneGeometry(220,340,180,240).rotateX(-Math.PI/2).translate(-90,0,-90),pos=g.attributes.position;
      for(let i=0;i<pos.count;i++)pos.setY(i,landHeight(pos.getX(i),pos.getZ(i)));
      g.computeVertexNormals();
      const rock=new THREE.Color("#6e655c"),ochre=new THREE.Color("#a98458"),grass=new THREE.Color("#b9ad6c"),scrub=new THREE.Color("#4a7a38"),sand=new THREE.Color("#d6c7a2"),c=new THREE.Color(),colors=new Float32Array(pos.count*3),normal=g.attributes.normal;
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),steep=1-normal.getY(i),d=shoreX(z)-x,n=.5+.5*Math.sin(x*.3+z*.23)*Math.cos(z*.11);
        // Mostly green chaparral and forest floor, with golden grass only in patches.
        c.copy(scrub).lerp(grass,smooth((n-.68)/.2)*.7).lerp(new THREE.Color("#355e2c"),smooth((d-25)/40)*.6);
        // Bare rock only on the sea cliffs; steep slopes inland are wooded (forest-floor green).
        const seaCliff=smooth((12-d)/6);c.lerp(rock,smooth((steep-.45)/.2)*seaCliff).lerp(ochre,smooth((steep-.5)/.25)*n*.6*seaCliff);
        if(d<6&&y<2.5)c.lerp(sand,canyon(z)*smooth((2.5-y)/1.5));
        colors.set([c.r,c.g,c.b],i*3);
      }
      g.setAttribute("color",new THREE.BufferAttribute(colors,3));
      scene.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1})));
    }
    // Sea stacks: tall jagged rocks standing in the surf, a few with a ring of foam.
    const stacks=[[-2,12,4.5,9],[6,-6,3,6],[9,-18,2.4,4],[-1,-62,5,11],[7,-80,3,7],[3,-108,4,8],[12,-40,2,3.5]];
    {
      const rock=new THREE.MeshStandardMaterial({color:"#57514c",flatShading:true,roughness:1});
      // Roughness comes from the position (not per vertex), so shared corners move together and faces stay closed.
      const craggy=(g,r,h,seed)=>{const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=.82+.18*Math.sin(x*5.1+seed)*Math.cos(z*4.3-y*2+seed)+.08*Math.sin(y*7+seed*2);p.setXYZ(i,x*k*r,(y+.6)*h*(.95+.08*Math.sin(x*3+z*3+seed)),z*k*r);}g.computeVertexNormals();return g;};
      for(const [dx,z,r,h] of stacks){const g=craggy(new THREE.DodecahedronGeometry(1,1),r,h,z);
        const m=new THREE.Mesh(g,rock);m.position.set(shoreX(z)+dx+r,-2.5,z);m.rotation.y=rng()*6;scene.add(m);}
    }

    // More rocks: small ones scattered through the surf, and boulders down the cliff slopes.
    {
      const rock=new THREE.MeshStandardMaterial({color:"#5f5852",flatShading:true,roughness:1}),d=new THREE.Object3D();
      const surfRocks=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0).scale(1,.75,.9),rock,lite?40:80);
      for(let i=0;i<surfRocks.count;i++){const z=30-rng()*230,x=shoreX(z)+.5+rng()*rng()*14,sz=.4+rng()*1.6;d.position.set(x,-.3+sz*.2,z);d.rotation.set(rng(),rng()*6,rng());d.scale.setScalar(sz);d.updateMatrix();surfRocks.setMatrixAt(i,d.matrix);}
      scene.add(surfRocks);
      const boulders=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0).scale(1,.7,.9),rock,lite?60:140);
      for(let i=0;i<boulders.count;i++){const z=30-rng()*230,x=shoreX(z)-1-rng()*40,sz=.5+rng()*rng()*2.2;d.position.set(x,landHeight(x,z)+sz*.15,z);d.rotation.set(rng(),rng()*6,rng()*.4);d.scale.setScalar(sz);d.updateMatrix();boulders.setMatrixAt(i,d.matrix);}
      scene.add(boulders);
    }
    // The Pacific: turquoise in the shallows to deep blue offshore. The swell is in the vertex shader; the fragment
    // shader adds fine ripples to the surface normal, reflects the sky at grazing angles, sparkles where the sun glints,
    // and rolls foam in along the shore and round the stacks.
    const ocean=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400,420,420).rotateX(-Math.PI/2).translate(1000,0,300),new THREE.ShaderMaterial({fog:true,
      uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uTime:{value:0},uSun:{value:SUN},uStacks:{value:stacks.map(([dx,z,r])=>new THREE.Vector3(shoreX(z)+dx+r,z,r))}}]),
      vertexShader:`uniform float uTime;varying vec3 vWorld;
        #include <fog_pars_vertex>
        ${WAVES_GLSL}
        void main(){vec3 p=position;vec4 world=modelMatrix*vec4(p,1.);world.y+=swell(world.xz,uTime);vWorld=world.xyz;vec4 mvPosition=viewMatrix*world;gl_Position=projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader:`uniform float uTime;uniform vec3 uSun;uniform vec3 uStacks[${stacks.length}];varying vec3 vWorld;
        #include <fog_pars_fragment>
        ${SHORE_GLSL}
        ${WAVES_GLSL}
        float h(vec2 p){return swell(p,uTime)+.05*sin(p.x*1.3+p.y*.7+uTime*2.1)+.04*sin(p.y*1.7-p.x*.9-uTime*2.6)+.025*sin((p.x-p.y)*2.9+uTime*3.3);}
        void main(){
          // Low-poly facets: the normal of each displaced triangle, so every facet catches the sun on its own.
          vec2 p=vWorld.xz;vec3 n=normalize(cross(dFdx(vWorld),dFdy(vWorld)));if(n.y<0.)n=-n;
          float d=vWorld.x-shoreX(vWorld.z);
          // Colour by wave height: deep teal and navy in the troughs to cyan and aquamarine on the peaks; turquoise
          // in the shallows.
          float hgt=swell(p,uTime);
          vec3 trough=vec3(.01,.12,.26),body=vec3(.02,.32,.48),crestC=vec3(.2,.72,.74);
          vec3 c=mix(trough,body,smoothstep(-1.,.1,hgt));c=mix(c,crestC,smoothstep(.15,1.2,hgt));
          c=mix(vec3(.16,.7,.66),c,smoothstep(1.,7.,d));
          float diffuse=.42+.85*max(dot(n,uSun),0.);c*=diffuse;
          vec3 v=normalize(cameraPosition-vWorld);float fres=pow(1.-max(dot(n,v),0.),4.);
          c=mix(c,vec3(.7,.8,.88),fres*.15);
          vec3 r=reflect(-uSun,n);float spec=pow(max(dot(r,v),0.),140.);float twinkle=step(.6,noise(p*3.+uTime*.8));
          c+=vec3(1.,.95,.82)*(spec*1.3+spec*twinkle*2.5);
          float caus=pow(abs(sin(p.x*.9+sin(p.y*.7+uTime)*1.5)*sin(p.y*.8+sin(p.x*.6-uTime*.8)*1.5)),3.);c+=vec3(.22,.32,.28)*caus*(1.-smoothstep(1.,6.,d));
          // Foam: whitecaps on the crests offshore, broken up by noise; lines of breakers rolling in; surf at the
          // cliffs and round the stacks; lacy streaks trailing behind.
          float n1=noise(p*.9+uTime*.3),n2=noise(p*3.1-uTime*.5);
          float caps=smoothstep(.93,.995,crest(p,uTime))*smoothstep(.55,.8,n1)*smoothstep(8.,25.,d)*.85;
          float breakers=smoothstep(.93,1.,sin(d*.42+uTime*1.35+sin(vWorld.z*.05)*1.6))*smoothstep(14.,3.,d)*smoothstep(.35,.65,n1*.6+n2*.6);
          float surf=smoothstep(6.,0.,d)*(.55+.45*sin(d*2.2+uTime*2.2+sin(vWorld.z*.2)*2.));
          for(int i=0;i<${stacks.length};i++){float rr=length(vWorld.xz-uStacks[i].xy)-uStacks[i].z*1.1;surf=max(surf,smoothstep(3.,0.,rr)*(.5+.5*sin(rr*3.-uTime*2.5)));}
          float lace=smoothstep(.66,.74,n2)*smoothstep(14.,2.,d)*.45;
          float foam=max(max(caps,breakers),max(smoothstep(.5,.9,surf),lace));
          c=mix(c,vec3(.94,.97,.97),foam);
          gl_FragColor=vec4(c,1.);
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`}));
    scene.add(ocean);

    // Highway 1 along the cliff top, and the arch bridge where it crosses the canyon.
    const roadPoints=[];for(let z=40;z>=-190;z-=2){const x=shoreX(z)-9-2*Math.sin(z*.04);roadPoints.push(new THREE.Vector3(x,0,z));}
    const deckY=landHeight(roadPoints[0].x,CANYON-14)*.5+landHeight(roadPoints[0].x,CANYON+14)*.5;
    const bridgeSpan=z=>smooth(1-(Math.abs(z-CANYON)-11)/3);
    roadPoints.forEach(p=>{const ground=landHeight(p.x,p.z)+.15,b=bridgeSpan(p.z);p.y=b>0?THREE.MathUtils.lerp(ground,Math.max(ground,deckY),b):ground;});
    {
      const positions=[],uvs=[],index=[];let length=0;
      roadPoints.forEach((p,i)=>{if(i)length+=p.distanceTo(roadPoints[i-1]);const n=roadPoints[Math.min(i+1,roadPoints.length-1)].clone().sub(roadPoints[Math.max(i-1,0)]).setY(0).normalize(),sx=-n.z*1.6,sz=n.x*1.6;
        positions.push(p.x-sx,p.y,p.z-sz,p.x+sx,p.y,p.z+sz);uvs.push(0,length*.25,1,length*.25);if(i)index.push(i*2-2,i*2-1,i*2,i*2-1,i*2+1,i*2);});
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));g.setIndex(index);g.computeVertexNormals();
      const strip=document.createElement("canvas");strip.width=64;strip.height=128;const m=strip.getContext("2d");m.fillStyle="#46474b";m.fillRect(0,0,64,128);m.fillStyle="#e9e6dc";m.fillRect(3,0,2,128);m.fillRect(59,0,2,128);m.fillStyle="#e6b52e";m.fillRect(29,0,2,128);m.fillRect(33,0,2,128);
      const markings=new THREE.CanvasTexture(strip);markings.colorSpace=THREE.SRGBColorSpace;markings.wrapT=THREE.RepeatWrapping;
      scene.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:markings,roughness:.9,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2})));
      // The bridge: an open-spandrel concrete arch springing from the canyon walls, columns up to the deck, and railings.
      const concrete=new THREE.MeshStandardMaterial({color:"#d7d3c8",flatShading:true,roughness:.85});
      const at=roadPoints.reduce((a,p)=>Math.abs(p.z-CANYON)<Math.abs(a.z-CANYON)?p:a),x=at.x,floor=landHeight(x,CANYON);
      const arch=new THREE.CatmullRomCurve3(Array.from({length:13},(_,i)=>{const t=i/12,z=CANYON+(t-.5)*24;return new THREE.Vector3(x,floor+(deckY-2.2-floor)*Math.sin(t*Math.PI)**.7,z);}));
      for(const side of [-1,1]){const tube=new THREE.Mesh(new THREE.TubeGeometry(arch,40,.45,6),concrete);tube.position.x=side*1.05;scene.add(tube);}
      const deck=new THREE.Mesh(new THREE.BoxGeometry(3.6,.6,28),concrete);deck.position.set(x,deckY-.3,CANYON);scene.add(deck);
      for(let i=-6;i<=6;i++){const z=CANYON+i*2,t=(z-CANYON)/24+.5,archY=t>0&&t<1?floor+(deckY-2.2-floor)*Math.sin(t*Math.PI)**.7:floor;
        for(const side of [-1,1]){const h=Math.max(.5,deckY-.6-archY),col=new THREE.Mesh(new THREE.BoxGeometry(.32,h,.32),concrete);col.position.set(x+side*1.05,archY+h/2,z);scene.add(col);}}
      for(const side of [-1,1]){const rail=new THREE.Mesh(new THREE.BoxGeometry(.15,.5,28),concrete);rail.position.set(x+side*1.7,deckY+.25,CANYON);scene.add(rail);}
    }
    // Coastal scrub and grass on the cliff tops, swaying in the sea wind (kept off Highway 1).
    const onRoad=(x,z,margin=2.6)=>Math.abs(x-(shoreX(z)-9-2*Math.sin(z*.04)))<margin;
    {
      const scatter=(geometry,count,scale,minD,maxD)=>{const mesh=new THREE.InstancedMesh(geometry,createSwayMaterial(time,1.4),count),d=new THREE.Object3D();let n=0;
        for(let k=0;k<count*4&&n<count;k++){const z=40-rng()*230,x=shoreX(z)-minD-rng()*(maxD-minD),y=landHeight(x,z);if(y<3||onRoad(x,z))continue;
          d.position.set(x,y-.05,z);d.rotation.y=rng()*6;d.scale.setScalar(scale*(.7+rng()*.6));d.updateMatrix();mesh.setMatrixAt(n++,d.matrix);}
        mesh.count=n;scene.add(mesh);};
      const k=lite?.5:1;scatter(createTuft(rng),Math.round(7000*k),1.4,3,70);scatter(createBush(rng),Math.round(4200*k),1.6,3,80);
      // Ice plant: low mats of orange and magenta spilling down the cliff tops.
      const icePlant=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0).scale(1,.18,1),new THREE.MeshStandardMaterial({flatShading:true,roughness:.8}),Math.round(1800*k)),d=new THREE.Object3D(),tones=["#e8642c","#d9467a","#f08a2a","#b8326a"].map(c=>new THREE.Color(c));let n=0;
      for(let i=0;i<icePlant.count*4&&n<icePlant.count;i++){const z=40-rng()*240,x=shoreX(z)-1-rng()*9,y=landHeight(x,z);if(y<2||onRoad(x,z))continue;d.position.set(x,y,z);d.rotation.set(0,rng()*6,0);d.scale.set(.35+rng()*.6,.6,.35+rng()*.6);d.updateMatrix();icePlant.setMatrixAt(n,d.matrix);icePlant.setColorAt(n,tones[n%4]);n++;}
      icePlant.count=n;scene.add(icePlant);
      // Monterey cypresses: windswept, flat-topped, leaning inland, in clumps just inland of the road (so the road
      // stays in view from the sea).
      const cypress=(()=>{const parts=[paintGeometry(new THREE.CylinderGeometry(.08,.14,1.4,5).translate(0,.7,0).rotateZ(.25),"#5a4030")];
        [[-.25,1.35,0,.55],[.2,1.5,.15,.6],[.45,1.3,-.1,.45],[0,1.65,-.2,.5]].forEach(([x,y,z,r],i)=>{const g=new THREE.IcosahedronGeometry(r,0).scale(1.4,.45,1.1).translate(x,y,z);parts.push(paintGeometry(g,i%2?"#2e4a2c":"#3a5a34"));});
        return mergeFlat(parts);})();
      const trees=new THREE.InstancedMesh(cypress,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.95}),Math.round(520*k));n=0;
      for(let i=0;i<trees.count*5&&n<trees.count;i++){const clump=Math.floor(rng()*24),zc=30-clump*9.5,z=zc+(rng()-.5)*6,x=shoreX(z)-13-rng()*5,y=landHeight(x,z);if(y<4||canyon(z)>.5)continue;
        if(onRoad(x,z,3.5))continue;const s=2+rng()*2;d.position.set(x,y-.1,z);d.rotation.set(0,Math.PI+(rng()-.5)*.6,0);d.scale.set(s,s*(.8+rng()*.4),s);d.updateMatrix();trees.setMatrixAt(n++,d.matrix);}
      trees.count=n;scene.add(trees);
      // A mixed California forest over the mountains: coast redwoods thick in the canyon and the ravines, pines on the
      // slopes and ridges, round coast live oaks on the gentler ground. Not on Highway 1 or the sheer cliff faces.
      const redwoods=[],pines=[],oaks=[],slope=(x,z)=>Math.hypot(landHeight(x+1,z)-landHeight(x-1,z),landHeight(x,z+1)-landHeight(x,z-1))/2;
      const grid=lite?3:1.9;
      for(let z=60;z>-240;z-=grid)for(let dd=6;dd<125;dd+=grid){
        const zz=z+(rng()-.5)*grid,x=shoreX(zz)-dd+(rng()-.5)*grid,y=landHeight(x,zz);if(y<3||onRoad(x,zz,3.2)||slope(x,zz)>(dd<12?1.25:3))continue;
        // Keep Highway 1 in view: no tall trees from the cliff edge to a few units inland of the road.
        if(dd<18)continue;
        const ravine=canyon(zz)+Math.max(0,Math.sin(zz*.09+1.2))**6,keep=dd<14?.5:.92;if(rng()>keep)continue;
        const pick=rng();
        if(pick<.25+ravine*.5)redwoods.push([x,y,zz,(9+rng()*7)*(dd<20?.7:1)]);
        else if(pick<.62)pines.push([x,y,zz,6+rng()*5]);
        else oaks.push([x,y,zz,3.2+rng()*2.4]);
      }
      const plant=(geometry,all,tint)=>{const material=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.95});
       for(const spots of chunkSpots(all,36)){const mesh=new THREE.InstancedMesh(geometry,material,spots.length),o=new THREE.Object3D(),c=new THREE.Color();
        spots.forEach(([x,y,z,h],i)=>{o.position.set(x,y-.2,z);o.rotation.set(0,rng()*6,0);o.scale.set(h*(.85+rng()*.3),h,h*(.85+rng()*.3));o.updateMatrix();mesh.setMatrixAt(i,o.matrix);mesh.setColorAt(i,c.setHSL(tint[0]+rng()*.04,tint[1]+rng()*.15,tint[2]+rng()*.15));});
        mesh.computeBoundingSphere();scene.add(mesh);}};
      plant(createSpruce(rng),redwoods,[.3,.25,.62]);plant(createForestPine(rng),pines,[.26,.3,.72]);plant(createRoundTree(rng,["#4f8a3a","#3e7330"]),oaks,[.25,.25,.8]);
    }

    // The lighthouse out on the point: a white tower on a rocky knoll, black lantern room, red roof, keeper's house.
    // Like Point Sur: a big rock standing off the coast, the light station on top.
    LIGHTHOUSE.x=shoreX(LIGHTHOUSE.z)+14;
    {const g=new THREE.DodecahedronGeometry(1,2),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=.85+.15*Math.sin(x*4+1)*Math.cos(z*3.5-y*2);p.setXYZ(i,x*k*11,Math.max(-.6,y)*13*(y>.55?.92:1),z*k*9);}g.computeVertexNormals();
      const rockMesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:"#5a544e",flatShading:true,roughness:1}));rockMesh.position.set(LIGHTHOUSE.x,-1,LIGHTHOUSE.z);scene.add(rockMesh);
      const cap=new THREE.Mesh(new THREE.CylinderGeometry(6,8,1.4,9),new THREE.MeshStandardMaterial({color:"#9d8f5e",flatShading:true,roughness:1}));cap.position.set(LIGHTHOUSE.x,10.6,LIGHTHOUSE.z);scene.add(cap);}
    LIGHTHOUSE.y=11.2;
    const lamp=new THREE.Vector3();
    {
      const g=new THREE.Group(),white=new THREE.MeshStandardMaterial({color:"#f1efe8",flatShading:true}),dark=new THREE.MeshStandardMaterial({color:"#2b2b2e",flatShading:true}),red=new THREE.MeshStandardMaterial({color:"#a8382c",flatShading:true});
      const tower=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.5,9,10),white);tower.position.y=4.5;g.add(tower);
      const gallery=new THREE.Mesh(new THREE.CylinderGeometry(1.7,1.7,.25,12),dark);gallery.position.y=9.1;g.add(gallery);
      const lantern=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1.5,10),new THREE.MeshStandardMaterial({color:"#fff3c4",emissive:"#ffd982",emissiveIntensity:2}));lantern.position.y=10;g.add(lantern);
      const roof=new THREE.Mesh(new THREE.ConeGeometry(1.25,1.2,10),red);roof.position.y=11.3;g.add(roof);
      const house=new THREE.Mesh(new THREE.BoxGeometry(4,2.6,3),white);house.position.set(-3.5,1.3,1.5);g.add(house);
      const houseRoof=new THREE.Mesh(new THREE.ConeGeometry(3.1,1.4,4).rotateY(Math.PI/4).scale(1,1,.8),red);houseRoof.position.set(-3.5,3.3,1.5);g.add(houseRoof);
      g.position.copy(LIGHTHOUSE);scene.add(g);lamp.copy(LIGHTHOUSE).add({x:0,y:10,z:0});
    }
    // The beam: a long soft cone of light from the lantern to where the pointer aims on the sea, plus a real spotlight
    // so the water and anything in the beam is lit.
    const beamUniforms={uTime:{value:0}};
    const beam=new THREE.Mesh(new THREE.ConeGeometry(1,1,24,1,true).translate(0,-.5,0).rotateX(-Math.PI/2),new THREE.ShaderMaterial({uniforms:beamUniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
      vertexShader:`varying vec3 vLocal;void main(){vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying vec3 vLocal;uniform float uTime;void main(){float along=-vLocal.z;float a=(1.-along)*.55*smoothstep(0.,.05,along)+.08;a*=.85+.15*sin(along*40.-uTime*3.);gl_FragColor=vec4(vec3(1.,.93,.75)*a,1.);}`}));
    beam.renderOrder=5;scene.add(beam);
    const spot=new THREE.SpotLight("#ffe7b0",900,0,.09,.5,1.6);spot.position.copy(lamp);scene.add(spot,spot.target);
    const aim=new THREE.Vector3(30,0,-90),aimTarget=aim.clone();

    // Spray: bursts of white water thrown up the seaward side of each stack as the swell hits, out of step.
    const sprayUniforms={uTime:{value:0},uScale:{value:600}};
    {
      const per=lite?24:40,n=stacks.length*per,pos=new Float32Array(n*3),seed=new Float32Array(n*3);
      stacks.forEach(([dx,z,r],k)=>{for(let i=0;i<per;i++){const j=k*per+i,a=(rng()-.5)*2.2;pos.set([shoreX(z)+dx+r+Math.cos(a)*r*1.05,0,z+Math.sin(a)*r*1.05],j*3);seed.set([rng(),rng(),k*.37],j*3);}});
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));g.setAttribute("aSeed",new THREE.BufferAttribute(seed,3));
      const spray=new THREE.Points(g,new THREE.ShaderMaterial({uniforms:sprayUniforms,transparent:true,depthWrite:false,
        vertexShader:`attribute vec3 aSeed;uniform float uTime,uScale;varying float vA;void main(){float cyc=fract(uTime*.32+aSeed.z),t=clamp((cyc-aSeed.x*.15)*2.2,0.,1.);
          vec3 p=position+vec3((aSeed.y-.3)*2.*t,(3.+aSeed.y*4.)*t-6.*t*t,(aSeed.x-.5)*1.5*t);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
          gl_PointSize=(.35+t*.9)*uScale/-mv.z;vA=step(.001,t)*(1.-t)*.85;}`,
        fragmentShader:`varying float vA;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(vec3(.96,.98,.99),vA*smoothstep(1.,.2,d));}`}));
      spray.frustumCulled=false;scene.add(spray);
    }
    // The coast beyond: headlands receding north in layers, each fainter in the haze.
    {
      const hill=new THREE.MeshStandardMaterial({color:"#55684a",flatShading:true,roughness:1});
      for(let k=0;k<6;k++){const z=105+k*55,g=new THREE.IcosahedronGeometry(1,2),p=g.attributes.position;
        for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),zz=p.getZ(i),w=.85+.15*Math.sin(x*3+k)*Math.cos(zz*2.5+k);p.setXYZ(i,x*w,Math.max(y,-.2)*w,zz*w);}g.computeVertexNormals();
        const m=new THREE.Mesh(g,hill);m.scale.set(55+k*6,38+(k%2)*14+k*4,40+k*5);m.position.set(-38-k*6+(k%2)*10,-6,z);scene.add(m);}
    }
    // Fog banks: big soft sprites drifting low over the water and up the cliffs.
    const fogUniforms={uTime:{value:0},uScale:{value:600}};
    {
      // Three layers: a bank on the horizon, the marine layer spilling over the ridges, and low mist on the water.
      const count=lite?70:140,pos=new Float32Array(count*3),seed=new Float32Array(count);
      for(let i=0;i<count;i++){const layer=i%3;seed[i]=rng();
        if(layer===0)pos.set([130+rng()*170,2+rng()*9,-60+rng()*240],i*3);
        else if(layer===1){const z=-120+rng()*300;pos.set([shoreX(z)-25-rng()*45,26+rng()*20,z],i*3);}
        else pos.set([18+rng()*60,.8+rng()*2.5,-195+rng()*120],i*3);}
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));g.setAttribute("aSeed",new THREE.BufferAttribute(seed,1));
      const fog=new THREE.Points(g,new THREE.ShaderMaterial({uniforms:fogUniforms,transparent:true,depthWrite:false,
        vertexShader:`attribute float aSeed;uniform float uTime,uScale;varying float vA;void main(){vec3 p=position;p.z+=mod(uTime*.8+aSeed*240.,240.)-120.;p.x+=sin(uTime*.1+aSeed*9.)*6.;
          vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(22.+aSeed*26.)*uScale/-mv.z;vA=.1+aSeed*.12;}`,
        fragmentShader:`varying float vA;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(vec3(.95,.97,.98),vA*smoothstep(1.,0.,d)*smoothstep(1.,.6,d));}`}));
      fog.frustumCulled=false;fog.renderOrder=4;scene.add(fog);
    }

    // Sea life (Poly Pizza, see public/models/CREDITS.md). Each sighting glows while the beam is on it.
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),creatures=[],found=new Set();
    const glowUp=(object,amount)=>object.traverse(o=>{if(o.isMesh&&o.material.emissive){o.material.emissive.setRGB(1,.85,.55);o.material.emissiveIntensity=amount*.55;}});
    const load=(file,height,build)=>loader.load(`/models/island/${file}.glb`,gltf=>{if(disposed)return;const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3()),scale=height/Math.max(size.x,size.y,size.z);build(gltf,scale,box);},undefined,()=>{});
    const holder=(model,scale,box)=>{const root=new THREE.Group();model.scale.setScalar(scale);model.position.set(-(box.min.x+box.max.x)/2*scale,-(box.min.y+box.max.y)/2*scale,-(box.min.z+box.max.z)/2*scale);
      model.traverse(o=>{if(o.isMesh){o.material=o.material.clone();if(!o.material.vertexColors&&!o.material.map)o.material.flatShading=true;}});root.add(model);scene.add(root);return root;};
    // Orca: cruises a loop offshore, surfacing to breathe, and breaches when the beam finds it.
    load("orca",5.5,(gltf,scale,box)=>{const root=holder(gltf.scene,scale,box);creatures.push({kind:"orca",root,a:0,t:0,breach:-1,center:new THREE.Vector3(48,0,-70),r:[26,40]});});
    // Sharks: two dorsal fins circling, the rest of the body under the surface.
    load("shark",3.2,(gltf,scale,box)=>{for(let i=0;i<2;i++){const model=i?cloneSkinned(gltf.scene):gltf.scene,root=holder(model,scale,box);const mixer=new THREE.AnimationMixer(model);gltf.animations[0]&&mixer.clipAction(gltf.animations[0]).play();
      creatures.push({kind:"shark",root,mixer,a:i*3,center:new THREE.Vector3(30+i*22,0,-30-i*50),r:[9+i*3,12+i*2]});}});
    // Sea lions: lounging on the sea stacks and the cove beach, lifting their heads now and then.
    load("sealion",1.8,(gltf,scale,box)=>{[[0,.98],[1,.9],[3,.95]].forEach(([s,f],i)=>{const [dx,z,r,h]=stacks[s],root=holder(i?gltf.scene.clone():gltf.scene,scale,box);
      root.position.set(shoreX(z)+dx+r,-2.5+h*f*1.05,z);root.rotation.y=rng()*6;creatures.push({kind:"sea lion",root,seed:rng()*6,base:root.rotation.clone()});});});
    // Kayakers: paddling slowly along the coast in bright kayaks.
    load("kayak",3.4,(gltf,scale,box)=>{["#e2683c","#f2c443","#3f8ac9"].forEach((color,i)=>{const root=holder(i?gltf.scene.clone():gltf.scene,scale,box);
      root.traverse(o=>{if(o.isMesh)o.material.color=new THREE.Color(color);});
      // The paddler: a jacketed torso, a head in a helmet and a double paddle that dips side to side.
      const torso=new THREE.Mesh(new THREE.CylinderGeometry(.2,.26,.6,6),new THREE.MeshStandardMaterial({color:i===1?"#3b6e8f":"#2f2f36",flatShading:true}));torso.position.y=.45;
      const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.17,0),new THREE.MeshStandardMaterial({color:"#d9a77e",flatShading:true}));head.position.y=.88;
      const helmet=new THREE.Mesh(new THREE.SphereGeometry(.19,8,4,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:color,flatShading:true}));helmet.position.y=.9;
      const paddle=new THREE.Group(),shaft=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,2.2,5).rotateZ(Math.PI/2),new THREE.MeshStandardMaterial({color:"#2b2b2b"}));paddle.add(shaft);
      for(const s of [-1,1]){const blade=new THREE.Mesh(new THREE.BoxGeometry(.04,.28,.12),new THREE.MeshStandardMaterial({color:"#f4f1ea"}));blade.position.x=s*1.1;paddle.add(blade);}
      paddle.position.y=.6;root.add(torso,head,helmet,paddle);
      creatures.push({kind:"kayaker",root,paddle,z:-10-i*34,lane:9+i*4,speed:.6+i*.15,seed:i*2});});});
    // The loaded wagon from the road trip, cruising Highway 1 up the coast and round again (the loop closes
    // out of sight: off the bottom of the frame and far up the coast in the haze).
    const road=new THREE.CatmullRomCurve3(roadPoints.slice().reverse()),drive={root:new THREE.Group(),u:.35,spin:{value:0}};
    loader.load("/models/island/wagon.glb",gltf=>{if(disposed)return;const model=gltf.scene,box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
      const holder=new THREE.Group();holder.add(model);holder.rotation.y=Math.PI/2;model.position.set(-(box.min.x+box.max.x)/2,-box.min.y,-(box.min.z+box.max.z)/2);holder.scale.setScalar(2.6/size.x);
      model.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.flatShading=true;}});drive.root.add(holder);scene.add(drive.root);drive.ready=true;},undefined,()=>{});
    // Gulls wheeling along the cliffs (procedural).
    const gulls=[];{const m=new THREE.MeshStandardMaterial({color:"#eef0f2",flatShading:true,side:THREE.DoubleSide});for(let i=0;i<8;i++){const b=createBird(m);b.scale.setScalar(1.6);Object.assign(b.userData,{a:i/8*6.28,r:8+(i%3)*4,h:20+(i%4)*3,z:-20-(i%3)*40,speed:.25+(i%4)*.05,flap:i});scene.add(b);gulls.push(b);}}
    // Splash: a burst of spray when the orca breaches.
    const splashUniforms={uT:{value:-1},uScale:{value:600}},splash=new THREE.Points((()=>{const n=120,p=new Float32Array(n*3),s=new Float32Array(n*3);for(let i=0;i<n;i++){s.set([rng(),rng(),rng()],i*3);}const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(p,3));g.setAttribute("aSeed",new THREE.BufferAttribute(s,3));return g;})(),
      new THREE.ShaderMaterial({uniforms:splashUniforms,transparent:true,depthWrite:false,vertexShader:`attribute vec3 aSeed;uniform float uT,uScale;varying float vA;void main(){float t=uT*(1.+aSeed.z*.5);float a=aSeed.x*6.2832,r=(.5+aSeed.y*3.)*t;vec3 p=vec3(cos(a)*r,(4.+aSeed.y*6.)*t-9.*t*t,sin(a)*r);
        vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(.25+aSeed.z*.35)*uScale/-mv.z;vA=uT<0.?0.:(1.-smoothstep(.5,1.2,uT))*step(-.1,p.y);}`,
        fragmentShader:`varying float vA;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(vec3(.95,.97,.98),vA*smoothstep(1.,.3,d));}`}));
    splash.frustumCulled=false;scene.add(splash);

    // Pointer: aims the beam at the sea under the cursor (an automatic sweep until the visitor moves the mouse).
    const raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2(),seaPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();let steering=0;
    const onPointer=event=>{const r=mount.getBoundingClientRect();ndc.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(ndc,camera);
      if(raycaster.ray.intersectPlane(seaPlane,hit)){hit.x=Math.max(hit.x,shoreX(hit.z)+4);hit.z=Math.max(hit.z,-175);
        // Not too close to the lighthouse (the beam would point straight down) nor too far out.
        const dx=hit.x-LIGHTHOUSE.x,dz=hit.z-LIGHTHOUSE.z,d=Math.hypot(dx,dz),k=THREE.MathUtils.clamp(d,22,120)/Math.max(d,1e-3);hit.set(LIGHTHOUSE.x+dx*k,0,LIGHTHOUSE.z+dz*k);aimTarget.copy(hit);steering=4;}};
    window.addEventListener("pointermove",onPointer,{passive:true});

    let tall=false;
    // The view window; its vertical offset follows the section hand-off, so the scene slides like the others.
    const view={w:1,h:1,full:[1,1]},applyView=()=>{const shift=state.current.shift?.[4]??0;camera.setViewOffset(view.full[0],view.full[1],0,shift*view.h*.28,view.w,view.h);};
    function frameSize(){const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;tall=camera.aspect<.85;camera.fov=tall?56:36;
      // The lighthouse and the open sea sit right of centre, clear of the contact card (lower on a phone, under it).
      view.w=w;view.h=h;view.full=tall?[w,h*1.4]:[w*1.2,h];applyView();camera.updateProjectionMatrix();
      const s=h*renderer.getPixelRatio()/(2*Math.tan(camera.fov*Math.PI/360));fogUniforms.uScale.value=s;splashUniforms.uScale.value=s;sprayUniforms.uScale.value=s;}
    const resize=new ResizeObserver(frameSize);resize.observe(mount);frameSize();

    // The view: from offshore to the south, looking up the coast: the sea and its horizon on the left, the cliffs,
    // Highway 1 and the lighthouse rock on the right, the coast fading into haze beyond.
    const camBase=new THREE.Vector3(52,31,-196),lookBase=new THREE.Vector3(4,6,-100),lean=new THREE.Vector2(),pointerN=new THREE.Vector2();
    const onLean=event=>{if(event.pointerType==="mouse")pointerN.set(event.clientX/window.innerWidth*2-1,-(event.clientY/window.innerHeight)*2+1);};
    window.addEventListener("pointermove",onLean,{passive:true});
    const clock=new THREE.Clock();let t=0;
    const toLamp=new THREE.Vector3(),toThing=new THREE.Vector3();
    function tick(dt){
      const reduced=preference.matches,step=reduced?0:dt;t+=step;time.value=t;
      lean.lerp(reduced?pointerN.set(0,0):pointerN,1-Math.exp(-dt*2));
      camera.position.copy(camBase).add({x:lean.x*3+(tall?10:0),y:lean.y*1.5+(tall?8:0),z:tall?-14:0});camera.lookAt(lookBase.x+lean.x*3,lookBase.y,lookBase.z);
      // Beam: follows the pointer; idles in a slow sweep across the sea.
      steering=Math.max(0,steering-dt);
      if(steering<=0){const a=Math.sin(t*.22)*.9;aimTarget.set(LIGHTHOUSE.x+45+Math.cos(a)*35,0,LIGHTHOUSE.z+10+Math.sin(a)*55);}
      aim.lerp(aimTarget,1-Math.exp(-dt*(steering>0?4:1.5)));
      const length=lamp.distanceTo(aim)+6;beam.position.copy(lamp);beam.lookAt(aim);beam.scale.set(length*.075,length*.075,length);
      spot.target.position.copy(aim);beamUniforms.uTime.value=t;
      toLamp.subVectors(aim,lamp).normalize();
      // Creatures.
      for(const c of creatures){
        if(c.kind==="orca"){
          c.a+=step*.05;const x=c.center.x+Math.cos(c.a)*c.r[0],z=c.center.z+Math.sin(c.a)*c.r[1],heading=Math.atan2(-Math.sin(c.a)*c.r[0],Math.cos(c.a)*c.r[1]);
          let y=-.6+swellAt(x,z,t)*.6+Math.max(0,Math.sin(t*.6))*.5,pitch=0;
          if(c.breach>=0){c.breach+=step;const k=c.breach/2.4;y=-1+Math.sin(k*Math.PI)*6;pitch=-Math.cos(k*Math.PI)*1.1;if(k>=1){c.breach=-1;splashUniforms.uT.value=0;splash.position.set(x,0,z);}}
          c.root.position.set(x,y,z);c.root.rotation.set(pitch,heading,0,"YXZ");
        }else if(c.kind==="shark"){c.a+=step*.18;const x=c.center.x+Math.cos(c.a)*c.r[0],z=c.center.z+Math.sin(c.a)*c.r[1];c.root.position.set(x,-.7+swellAt(x,z,t)*.8,z);c.root.rotation.y=Math.atan2(-Math.sin(c.a)*c.r[0],Math.cos(c.a)*c.r[1]);c.mixer.update(step);}
        else if(c.kind==="sea lion"){c.root.rotation.x=c.base.x+Math.max(0,Math.sin(t*.4+c.seed))*.18;}
        else if(c.kind==="kayaker"){c.z-=step*c.speed*.6;if(c.z<-170)c.z=30;const x=shoreX(c.z)+c.lane;c.root.position.set(x,.2+swellAt(x,c.z,t),c.z);c.root.rotation.set(Math.sin(t*1.1+c.seed)*.05,Math.PI,Math.sin(t*1.4+c.seed)*.06);
          c.paddle.rotation.z=Math.sin(t*2.2+c.seed)*.6;c.paddle.rotation.y=Math.sin(t*2.2+c.seed)*.25;}
        // In the beam?
        toThing.subVectors(c.root.position,lamp);const along=toThing.dot(toLamp),off=toThing.clone().addScaledVector(toLamp,-along).length(),inBeam=along>0&&off<along*.09+2;
        c.light=(c.light||0)+((inBeam?1:0)-(c.light||0))*(1-Math.exp(-dt*6));glowUp(c.root,c.light);
        if(inBeam&&steering>0&&!found.has(c.kind)){found.add(c.kind);spotted.current?.([...found]);}
        if(inBeam&&c.kind==="orca"&&c.breach<0&&!reduced&&(c.cool??0)<t){c.breach=0;c.cool=t+9;}
      }
      if(drive.ready){drive.u=(drive.u+step*7/road.getLength())%1;const p=road.getPointAt(drive.u),q=road.getPointAt(Math.min(.999,drive.u+.004));
        drive.root.position.set(p.x+(q.z-p.z)*.18,p.y+.02+Math.sin(t*30)*.01,p.z-(q.x-p.x)*.18);drive.root.lookAt(q.x+(q.z-p.z)*.18,p.y,q.z-(q.x-p.x)*.18);}
      if(splashUniforms.uT.value>=0)splashUniforms.uT.value+=step;if(splashUniforms.uT.value>1.4)splashUniforms.uT.value=-1;
      for(const b of gulls){const u=b.userData;u.a+=step*u.speed;b.position.set(shoreX(u.z)+Math.cos(u.a)*u.r,u.h+Math.sin(u.a*2),u.z+Math.sin(u.a)*u.r*1.4);b.rotation.set(0,-u.a,Math.sin(u.a)*.3);
        const glide=Math.sin(t*.8+u.flap)>.2,f=glide?.1:Math.sin(t*9+u.flap)*.55;u.wings[0].rotation.z=f;u.wings[1].rotation.z=-f;}
      ocean.material.uniforms.uTime.value=t;fogUniforms.uTime.value=t;sprayUniforms.uTime.value=t;
      applyView();renderer.render(scene,camera);
    }
    function draw(){raf=requestAnimationFrame(draw);const dt=Math.min(clock.getDelta(),.05);if(onScreen()&&!document.hidden&&!window.__coastHold){tick(dt);adapt(dt,state.current.live.length===1);}}
    draw();
    const readyTimer=setTimeout(()=>ready.current?.(),0);
    if(new URLSearchParams(window.location.search).has("debug"))window.__coast={step:(n=30)=>{for(let i=0;i<n;i++)tick(1/30);},scene,camera,creatures,renderer,aimTarget,THREE};

    return()=>{
      clearTimeout(readyTimer);
      disposed=true;cancelAnimationFrame(raf);resize.disconnect();delete window.__coast;window.removeEventListener("pointermove",onPointer);window.removeEventListener("pointermove",onLean);
      scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat())if(m){m.map?.dispose();m.dispose();}});
      renderer.dispose();renderer.domElement.remove();
    };
  },[state]);
  return <div className="ht-coast-canvas" ref={host} aria-hidden="true" />;
}
