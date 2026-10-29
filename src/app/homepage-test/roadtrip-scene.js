"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { random, createPineGeometry, createBearMaterial, flatMaterial } from "./island-parts";

// Skills as a road trip through Yosemite: a loaded wagon idles on a winding valley road under granite walls
// (El Capitan, Half Dome, a waterfall). Brown park signs along the road each name a skill group. Clicking the car
// (or scrolling) hops it and drives it to the next sign; a chase camera follows.
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
const ROAD=new THREE.CatmullRomCurve3([[0,0,14],[-3,0,2],[1.5,0,-12],[9,0,-26],[6,0,-42],[-5,0,-56],[-8,0,-70],[-1,0,-86],[7,0,-100],[4,0,-116]].map(p=>new THREE.Vector3(...p)),false,"centripetal");
const STATIONS=[.08,.27,.46,.64,.82];
const GRANITE=["#b4aea3","#a39d92","#958f85","#c4bdb1"].map(c=>new THREE.Color(c));

// Half Dome: a dome with one side sheared off into a sheer face.
function createHalfDome(rng) {
  const g=new THREE.SphereGeometry(1,28,18,0,Math.PI,0,Math.PI/2).scale(1,1.15,.95),pos=g.attributes.position,colors=new Float32Array(pos.count*3);
  for(let i=0;i<pos.count;i++)pos.setXYZ(i,pos.getX(i)*(1+(rng()-.5)*.04),pos.getY(i),pos.getZ(i)*(1+(rng()-.5)*.04));
  for(let i=0;i<pos.count;i++){const c=GRANITE[Math.floor(pos.getY(i)*3.99)%4];colors.set([c.r,c.g,c.b],i*3);}
  g.setAttribute("color",new THREE.BufferAttribute(colors,3));g.deleteAttribute("uv");g.computeVertexNormals();
  const dome=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));
  // The sheer face: a flat cap closing the cut side.
  const face=new THREE.Mesh(new THREE.CircleGeometry(1,28,0,Math.PI).scale(1,1.15,1),new THREE.MeshStandardMaterial({color:"#9a948a",roughness:1,side:THREE.DoubleSide}));
  const group=new THREE.Group();group.add(dome,face);return group;
}
// A National Forest–style sign: a rust-brown shield (wider at the top, slanted crown, rounded corners) with a cream
// inset border, the skill group in a carved-looking script and the tools in spaced rounded caps.
// Fonts: Yellowtail and Varela Round (Google Fonts, OFL), the closest free match to router-bit park lettering.
const SIGN=[[-1.95,1.05],[1.95,.88],[1.5,-1.05],[-1.5,-1.05]];
function signPath(g,points,radius) {
  g.beginPath();
  points.forEach((p,i)=>{const prev=points[(i+points.length-1)%points.length],next=points[(i+1)%points.length];
    const a=[p[0]+(prev[0]-p[0])*radius,p[1]+(prev[1]-p[1])*radius],b=[p[0]+(next[0]-p[0])*radius,p[1]+(next[1]-p[1])*radius];
    if(i===0)g.moveTo(...a);else g.lineTo(...a);g.quadraticCurveTo(p[0],p[1],...b);});
  g.closePath();
}
function createSign(skill) {
  const W=1024,H=560,toCanvas=([x,y],inset=0)=>[W/2+x*(W/4.1)*(1-inset),H/2-y*(H/2.2)*(1-inset)];
  const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;
  const g=canvas.getContext("2d");
  const paint=()=>{
    g.clearRect(0,0,W,H);
    signPath(g,SIGN.map(p=>toCanvas(p)),.12);g.fillStyle="#8a4a2b";g.fill();
    // A faint grain, like painted wood.
    g.save();g.clip();g.globalAlpha=.06;for(let i=0;i<70;i++){g.fillStyle=i%2?"#000":"#fff";g.fillRect(0,(i*37)%H,W,1+(i%3));}g.restore();
    signPath(g,SIGN.map(p=>toCanvas(p,.1)),.14);g.lineWidth=12;g.strokeStyle="#f1e6cf";g.stroke();
    g.textAlign="center";
    // Router-carved look: a darker offset under the cream letters.
    const carve=(text,y,font)=>{g.font=font;g.fillStyle="#5a2c17";g.fillText(text,W/2+5,y+6);g.fillStyle="#f1e6cf";g.fillText(text,W/2,y);};
    carve(skill.title,262,"118px Yellowtail, Satoshi, sans-serif");
    g.letterSpacing="6px";carve(skill.items.join("  ·  ").toUpperCase(),372,"38px 'Varela Round', Satoshi, sans-serif");g.letterSpacing="0px";
  };
  paint();
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  // Re-letter once the sign fonts have loaded.
  Promise.all([document.fonts?.load("118px Yellowtail"),document.fonts?.load("38px 'Varela Round'")]).then(()=>{paint();texture.needsUpdate=true;}).catch(()=>{});
  const sign=new THREE.Group(),wood=new THREE.MeshStandardMaterial({color:"#5a2f1b",flatShading:true,roughness:1});
  // The board: the same shield shape extruded, with the lettered face on the front.
  const shape=new THREE.Shape();SIGN.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  const board=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSize:.04,bevelThickness:.03,bevelSegments:1}),wood);
  board.position.set(0,2.15,-.06);sign.add(board);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(W/(W/4.1)*1.0,H/(H/2.2)),new THREE.MeshStandardMaterial({map:texture,transparent:true,roughness:.9}));
  face.position.set(0,2.15,.1);sign.add(face);
  for(const x of [-1.1,1.1]){const post=new THREE.Mesh(new THREE.BoxGeometry(.18,1.4,.18),wood);post.position.set(x,.7,-.05);sign.add(post);}
  sign.userData.texture=texture;return sign;
}

export default function RoadTripScene({ state, skills, onCar }) {
  const host=useRef(null),carClick=useRef(onCar);
  carClick.current=onCar;
  useEffect(()=>{
    const mount=host.current;
    let renderer,disposed=false,raf=0;
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"}); } catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    mount.appendChild(renderer.domElement);
    const canvas=renderer.domElement;canvas.style.touchAction="pan-y";
    const preference=matchMedia("(prefers-reduced-motion: reduce)");
    // On screen while the director has the Skills section (2) live.
    const onScreen=()=>state.current.live.includes(2);
    const scene=new THREE.Scene();scene.fog=new THREE.Fog("#dbe2e3",45,230);
    const camera=new THREE.PerspectiveCamera(42,1,.1,500);
    const rng=random(9);

    // Cool morning light from up the valley, warm on the granite.
    scene.add(new THREE.HemisphereLight("#eef4ff","#4b5a3c",1.4));
    const sun=new THREE.DirectionalLight("#ffe3bd",2.6);sun.position.set(-30,40,-20);scene.add(sun);

    // The valley: one smooth landscape. Flat along the road, rising into rounded granite mountains on both sides and at
    // the far end, with the Merced-style river carved into the floor beside the road.
    const roadPoints=ROAD.getSpacedPoints(140);
    const nearest=(points,x,z)=>{let best=1e9;for(const p of points){const d=(p.x-x)**2+(p.z-z)**2;if(d<best)best=d;}return Math.sqrt(best);};
    const roadDistance=(x,z)=>nearest(roadPoints,x,z);
    // The river runs alongside the road, on its right, meandering a little.
    const riverPoints=roadPoints.map((p,i)=>{const t=ROAD.getTangentAt(Math.min(i/(roadPoints.length-1),.999)),s=new THREE.Vector3(-t.z,0,t.x);return p.clone().addScaledVector(s,8+2.2*Math.sin(i*.12));});
    const riverDistance=(x,z)=>nearest(riverPoints,x,z);
    const heightAt=(x,z)=>{
      const rd=roadDistance(x,z),vd=riverDistance(x,z);
      const ridges=.6+.4*Math.sin(x*.045+z*.03)*Math.cos(z*.04-x*.02)+.12*Math.sin(x*.13+z*.11);
      const valley=Math.pow(smooth((rd-9)/42),1.5)*50*ridges,end=smooth((-z-150)/45)*34;
      const floor=.22*Math.sin(x*.15+z*.1)*smooth((rd-4)/8),channel=-1.1*smooth(1-vd/3.4);
      return (floor+valley+end)*smooth((rd-2.2)/2.5)+channel;
    };
    const groundY=heightAt;
    {
      const g=new THREE.PlaneGeometry(280,320,170,190).rotateX(-Math.PI/2).translate(0,0,-80),pos=g.attributes.position,colors=new Float32Array(pos.count*3);
      for(let i=0;i<pos.count;i++)pos.setY(i,heightAt(pos.getX(i),pos.getZ(i))-.05);
      g.computeVertexNormals();
      const meadow=new THREE.Color("#93b166"),dry=new THREE.Color("#bdb57a"),forest=new THREE.Color("#4f7247"),granite=new THREE.Color("#a7a196"),pale=new THREE.Color("#d8d2c6"),bank=new THREE.Color("#8e8463"),c=new THREE.Color(),normal=g.attributes.normal;
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),steep=1-normal.getY(i),streak=.5+.5*Math.sin(x*1.3+z*.2);
        c.copy(meadow).lerp(dry,smooth(Math.sin(x*.07-z*.05)*.8)*.6);
        c.lerp(forest,smooth((y-1.5)/4));
        c.lerp(granite,smooth((y-14+steep*14)/8)).lerp(pale,smooth((y-30)/10)*streak*.8);
        if(riverDistance(x,z)<3.6)c.lerp(bank,.55);
        colors.set([c.r,c.g,c.b],i*3);
      }
      g.setAttribute("color",new THREE.BufferAttribute(colors,3));
      scene.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1})));
    }
    // The river: a flowing ribbon down its channel.
    const riverUniforms={uTime:{value:0}};
    {
      const positions=[],uvs=[],index=[];let length=0;
      riverPoints.forEach((p,i)=>{if(i)length+=p.distanceTo(riverPoints[i-1]);const n=riverPoints[Math.min(i+1,riverPoints.length-1)].clone().sub(riverPoints[Math.max(i-1,0)]).normalize(),s=new THREE.Vector3(-n.z,0,n.x),w=1.5+.4*Math.sin(i*.2);
        positions.push(p.x-s.x*w,-.5,p.z-s.z*w,p.x+s.x*w,-.5,p.z+s.z*w);uvs.push(0,length,1,length);if(i)index.push(i*2-2,i*2-1,i*2,i*2-1,i*2+1,i*2);});
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));g.setIndex(index);
      scene.add(new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:riverUniforms,transparent:true,
        vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`varying vec2 vUv;uniform float uTime;void main(){float across=abs(vUv.x-.5)*2.;float f=fract(vUv.y*.35+uTime*.35+sin(vUv.x*8.+vUv.y*.6)*.08);
          vec3 c=mix(vec3(.24,.52,.58),vec3(.48,.76,.78),1.-across)+smoothstep(.0,.06,f)*smoothstep(.16,.08,f)*.22*(1.-across)+smoothstep(.75,.98,across)*.3;
          gl_FragColor=vec4(c,.92*smoothstep(1.,.85,across));
          #include <colorspace_fragment>
        }`})));
    }
    // The road: asphalt ribbon with white edges and a dashed yellow centre line.
    {
      const pts=ROAD.getSpacedPoints(260),positions=[],uvs=[],index=[],side=new THREE.Vector3(),tan=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
      let length=0;
      pts.forEach((p,i)=>{if(i)length+=p.distanceTo(pts[i-1]);tan.subVectors(pts[Math.min(i+1,pts.length-1)],pts[Math.max(i-1,0)]).normalize();side.crossVectors(tan,up).normalize();
        const y=groundY(p.x,p.z)+.04;positions.push(p.x-side.x*1.7,y,p.z-side.z*1.7,p.x+side.x*1.7,y,p.z+side.z*1.7);uvs.push(0,length,1,length);if(i)index.push(i*2-2,i*2-1,i*2,i*2-1,i*2+1,i*2);});
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));g.setIndex(index);g.computeVertexNormals();
      const material=new THREE.ShaderMaterial({fog:true,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog]),
        vertexShader:`varying vec2 vUv;
          #include <fog_pars_vertex>
          void main(){vUv=uv;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
          #include <fog_vertex>
          }`,
        fragmentShader:`varying vec2 vUv;
          #include <fog_pars_fragment>
          void main(){
            vec3 c=vec3(.29,.29,.32);
            float edge=step(.9,abs(vUv.x-.5)*2.)*step(abs(vUv.x-.5)*2.,.96);
            float dash=step(abs(vUv.x-.5),.02)*step(fract(vUv.y*.25),.5);
            c=mix(c,vec3(.95,.93,.88),edge);c=mix(c,vec3(.98,.78,.2),dash);
            gl_FragColor=vec4(c,1.);
            #include <colorspace_fragment>
            #include <fog_fragment>
          }`});
      scene.add(new THREE.Mesh(g,material));
    }
    // Half Dome on the far ridge, and a waterfall down the left slope.
    const halfDome=createHalfDome(rng);halfDome.scale.setScalar(30);halfDome.position.set(16,heightAt(16,-205)-6,-205);halfDome.rotation.y=-Math.PI/2-.4;scene.add(halfDome);
    const fallUniforms={uTime:{value:0}};
    const fall=new THREE.Mesh(new THREE.PlaneGeometry(2.4,30,1,24),new THREE.ShaderMaterial({uniforms:fallUniforms,transparent:true,depthWrite:false,
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying vec2 vUv;uniform float uTime;void main(){float f=fract(vUv.y*6.+uTime*1.4+sin(vUv.x*12.)*.1);float a=(.55+.35*smoothstep(.0,.2,f)*smoothstep(.5,.25,f))*smoothstep(0.,.25,1.-abs(vUv.x-.5)*2.)*smoothstep(0.,.08,vUv.y);gl_FragColor=vec4(vec3(.92,.96,1.),a);}`}));
    fall.position.set(-27,heightAt(-27,-64)+13,-64);fall.rotation.y=Math.PI/2-.2;scene.add(fall);
    // Deep forest in layers: the meadow edge, up the slopes to the treeline, and the far ridges, hazier with distance.
    {
      const spots=[];
      const layer=(count,minD,maxD,scale,tint)=>{for(let k=0,n=0;k<count*8&&n<count;k++){const x=(rng()-.5)*200,z=24-rng()*230,rd=roadDistance(x,z);
        if(rd<minD||rd>maxD||riverDistance(x,z)<2.8)continue;const y=heightAt(x,z);if(y>32)continue;spots.push([x,y,z,scale*(.8+rng()*.5),tint]);n++;}};
      layer(150,5,15,1.3,new THREE.Color("#ffffff"));layer(320,15,34,1.9,new THREE.Color("#dfe8dc"));layer(260,34,70,2.6,new THREE.Color("#b9c8c2"));
      const pines=new THREE.InstancedMesh(createPineGeometry(21),flatMaterial(),spots.length),d=new THREE.Object3D();
      spots.forEach(([x,y,z,s,tint],i)=>{d.position.set(x,y-.1,z);d.rotation.y=rng()*6;d.scale.set(s,s*(1+rng()*.5),s);d.updateMatrix();pines.setMatrixAt(i,d.matrix);pines.setColorAt(i,tint);});
      scene.add(pines);
    }
    // Skill signs at each stop, beside the road on alternating sides, angled toward the approaching car.
    const frame={p:new THREE.Vector3(),t:new THREE.Vector3(),s:new THREE.Vector3()};
    const frameAt=(u,out=frame)=>{ROAD.getPointAt(THREE.MathUtils.clamp(u,0,1),out.p);ROAD.getTangentAt(THREE.MathUtils.clamp(u,0,.999),out.t).normalize();out.s.crossVectors(out.t,new THREE.Vector3(0,1,0)).normalize();return out;};
    const signs=skills.map((skill,i)=>{const sign=createSign(skill),f=frameAt(STATIONS[i]+.012),side=i%2?1:-1;
      sign.position.copy(f.p).addScaledVector(f.s,side*3.6);sign.position.y=groundY(sign.position.x,sign.position.z);
      sign.lookAt(sign.position.x-f.t.x*6-f.s.x*side*3,sign.position.y,sign.position.z-f.t.z*6-f.s.z*side*3);sign.userData.side=side;scene.add(sign);return sign;});

    // The car: the loaded wagon, wheels spun in the vertex shader around each wheel's own centre.
    const car=new THREE.Group(),body=new THREE.Group();car.add(body);scene.add(car);
    const wheelSpin={value:0};let carReady=false;
    new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load("/models/island/wagon.glb",gltf=>{
      if(disposed)return;
      const model=gltf.scene,box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
      // The wagon's length runs along x with its nose at -x; turn it so it faces +z (the way the car travels).
      const holder=new THREE.Group();holder.add(model);holder.rotation.y=Math.PI/2;
      model.position.set(-(box.min.x+box.max.x)/2,-box.min.y,-(box.min.z+box.max.z)/2);
      holder.scale.setScalar(2.6/size.x);body.add(holder);
      model.traverse(o=>{
        if(!o.isMesh)return;o.material=o.material.clone();o.material.flatShading=true;o.material.roughness=.8;o.material.metalness=0;
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
      carReady=true;
    },undefined,()=>{});
    // Wildlife (Poly Pizza, see public/models/CREDITS.md). Antelope graze on the meadow across from the river and bound
    // away from the passing car; a wolf pack trots a loop through the valley and gallops off when the car comes close.
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),antelope=[],wolves=[];
    const ANTELOPE={Graze:[0,1.2,.004,0,0,.05],Walk:[.34,3.8,.008,.55,.035,.08],Bound:[.62,8,.05,.9,.07,.12]};
    loader.load("/models/island/antelope.glb",gltf=>{
      if(disposed)return;
      const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3());
      for(let i=0;i<6;i++){
        const model=i?gltf.scene.clone():gltf.scene,root=new THREE.Group();let gait=null;
        model.traverse(o=>{if(!o.isMesh)return;
          // Pronghorn colouring: tan coat, cream belly and rump (from the baked colours' lightness).
          const c=o.geometry.attributes.color;if(c&&i===0){const tan=new THREE.Color("#b5733d"),cream=new THREE.Color("#efe4d0"),dark=new THREE.Color("#3a2416"),tmp=new THREE.Color();
            for(let k=0;k<c.count;k++){const l=(c.getX(k)+c.getY(k)+c.getZ(k))/3;tmp.copy(l<.02?dark:l<.25?tan:cream);c.setXYZ(k,tmp.r,tmp.g,tmp.b);}c.needsUpdate=true;}
          gait??=createBearMaterial(o.geometry,{hip:.42});o.material=gait.material;o.frustumCulled=false;});
        model.scale.setScalar(1.25/size.y);model.position.y=-box.min.y*1.25/size.y;root.add(model);scene.add(root);
        const f=frameAt(.14+i*.11),x=f.p.x-f.s.x*(7+rng()*7),z=f.p.z-f.s.z*(7+rng()*7);root.position.set(x,heightAt(x,z),z);
        antelope.push({root,gait,yaw:rng()*6,state:"graze",timer:rng()*5,gaitName:"Graze",swing:0,phase:rng()*6,target:new THREE.Vector2(x,z),speed:0,home:new THREE.Vector2(x,z)});
      }
    },undefined,()=>{});
    loader.load("/models/island/wolf.glb",gltf=>{
      if(disposed)return;
      const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3());
      for(let i=0;i<3;i++){
        const model=i?cloneSkinned(gltf.scene):gltf.scene,root=new THREE.Group();
        model.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.flatShading=true;o.material.roughness=.9;o.frustumCulled=false;}});
        model.scale.setScalar(.95/size.y);model.position.y=-box.min.y*.95/size.y;root.add(model);scene.add(root);
        const mixer=new THREE.AnimationMixer(model),actions={};for(const clip of gltf.animations)actions[clip.name]=mixer.clipAction(clip);
        wolves.push({root,mixer,actions,current:null,lag:i*.045,side:(i-1)*1.1});
      }
    },undefined,()=>{});
    const playWolf=(w,name)=>{if(w.current===name||!w.actions[name])return;w.actions[name].reset().fadeIn(.3).play();w.actions[w.current]?.fadeOut(.3);w.current=name;};
    const pack={a:0,pause:6,rest:0,run:0};
    function updateAnimals(dt,now,carPos){
      for(const a of antelope){
        const p=a.root.position,d=Math.hypot(p.x-carPos.x,p.z-carPos.z);a.timer-=dt;
        if(d<9&&a.state!=="bound"){const dx=(p.x-carPos.x)/(d||1),dz=(p.z-carPos.z)/(d||1);a.target.set(p.x+dx*9,p.z+dz*9);a.state="bound";a.gaitName="Bound";a.speed=5.5;}
        else if(a.state==="graze"&&a.timer<=0){const ang=rng()*Math.PI*2;a.target.set(a.home.x+Math.cos(ang)*4,a.home.y+Math.sin(ang)*4);a.state="walk";a.gaitName="Walk";a.speed=.7;}
        if(a.state!=="graze"){const dx=a.target.x-p.x,dz=a.target.y-p.z,dist=Math.hypot(dx,dz);
          if(dist<.2||(a.state==="bound"&&roadDistance(p.x,p.z)>26)){a.state="graze";a.gaitName="Graze";a.speed=0;a.timer=3+rng()*6;if(a.state==="graze")a.home.set(p.x,p.z);}
          else{const step=Math.min(dist,a.speed*dt);p.x+=dx/dist*step;p.z+=dz/dist*step;let turn=Math.atan2(dx,dz)-a.yaw;turn=Math.atan2(Math.sin(turn),Math.cos(turn));a.yaw+=turn*(1-Math.exp(-dt*6));}}
        const [swing,rate,bob,knee,lift,nod]=ANTELOPE[a.gaitName];a.swing+=(swing-a.swing)*(1-Math.exp(-dt*5));a.phase+=dt*rate;
        const u=a.gait.uniforms;u.uPhase.value=a.phase;u.uSwing.value=a.swing;u.uKnee.value=knee;u.uLift.value=lift*u.uHeight.value;u.uNod.value=nod;u.uHeadDown.value=a.gaitName==="Graze"?.45:0;
        u.uBob.value=0;
        // Bounding antelope pronk: springy hops clear of the ground.
        p.y=heightAt(p.x,p.z)+(a.gaitName==="Bound"?Math.abs(Math.sin(a.phase*.5))*.55:0);a.root.rotation.y=a.yaw;
      }
      if(wolves.length){
        // The pack trots a wide loop through the valley, sometimes stopping to look around; it gallops if the car is close.
        const lead=new THREE.Vector3(-16+Math.cos(pack.a)*10,0,-60+Math.sin(pack.a)*24),near=Math.hypot(lead.x-carPos.x,lead.z-carPos.z)<12;
        if(near)pack.run=3;pack.run=Math.max(0,pack.run-dt);pack.pause-=dt;
        let speed=pack.run>0?.22:.07;if(pack.pause<0&&pack.run<=0){speed=0;pack.rest+=dt;if(pack.rest>3){pack.rest=0;pack.pause=8+rng()*8;}}
        pack.a+=dt*speed;
        for(const w of wolves){
          const a=pack.a-w.lag,x=-16+Math.cos(a)*(10+w.side),z=-60+Math.sin(a)*(24+w.side),next=a+.02;
          w.root.position.set(x,heightAt(x,z),z);w.root.lookAt(-16+Math.cos(next)*(10+w.side),w.root.position.y,-60+Math.sin(next)*(24+w.side));
          playWolf(w,speed===0?"Idle":pack.run>0?"Gallop":"Walk");w.mixer.update(dt);
        }
      }
    }

    // Exhaust puffs.
    const puffMaterial=new THREE.MeshStandardMaterial({color:"#ffffff",roughness:1,transparent:true,opacity:.5,depthWrite:false});
    const puffs=Array.from({length:14},()=>{const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.09,1),puffMaterial.clone());m.visible=false;m.userData.life=-1;scene.add(m);return m;});
    let puffTimer=0;

    // Driving: the car eases along the road to the stop the director picks; a click hops it first.
    let u=STATIONS[0],uVel=0,hop=-1,camPos=new THREE.Vector3(),camLook=new THREE.Vector3(),first=true;
    const look=new THREE.Vector3(),offset=new THREE.Vector3(),tilt={pitch:0,roll:0};
    const raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2();let overCar=false;
    function onMove(event){const r=canvas.getBoundingClientRect();ndc.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(ndc,camera);overCar=carReady&&raycaster.intersectObject(car,true).length>0;canvas.style.cursor=overCar?"pointer":"default";}
    function onClick(){if(!overCar)return;hop=0;carClick.current?.();}
    canvas.addEventListener("pointermove",onMove);canvas.addEventListener("click",onClick);

    let tall=false;
    function frameSize(){const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;tall=camera.aspect<.85;camera.fov=tall?58:42;camera.updateProjectionMatrix();}
    const resize=new ResizeObserver(frameSize);resize.observe(mount);frameSize();

    const clock=new THREE.Clock();let time=0;
    function tick(dt){
      const reduced=preference.matches,step=reduced?0:dt;time+=step;
      // Scrolling through Skills drives from the first sign to the last (piecewise between the stops).
      const q=state.current.progress[2]*(STATIONS.length-1),k=Math.min(STATIONS.length-2,Math.floor(q)),target=STATIONS[k]+(STATIONS[k+1]-STATIONS[k])*(q-k);
      // Critically damped glide toward the stop: pulls away gently, cruises, brakes into the stop.
      const before=u;
      if(reduced)u=target;else{const w=2/.9,x=w*dt,decay=1/(1+x+.48*x*x+.235*x*x*x),change=u-target,temp=(uVel+w*change)*dt;uVel=(uVel-w*temp)*decay;u=target+(change+temp)*decay;}
      const speed=(u-before)/Math.max(dt,1/120)*ROAD.getLength();
      frameAt(u);
      car.position.copy(frame.p);car.position.y=groundY(frame.p.x,frame.p.z)+.02;car.lookAt(car.position.clone().add(frame.t));
      // Body: pitch back when pulling away, lean into curves, idle shudder, and the hop (squash and stretch).
      const ahead=frameAt(Math.min(1,u+.01),{p:new THREE.Vector3(),t:new THREE.Vector3(),s:new THREE.Vector3()}),curve=frame.t.clone().cross(ahead.t).y;
      tilt.pitch+=(THREE.MathUtils.clamp(-speed*.012,-.08,.08)-tilt.pitch)*(1-Math.exp(-dt*4));tilt.roll+=(THREE.MathUtils.clamp(curve*speed*.8,-.12,.12)-tilt.roll)*(1-Math.exp(-dt*4));
      body.rotation.set(tilt.pitch,0,tilt.roll);body.position.y=reduced?0:Math.sin(time*38)*.008;
      if(hop>=0){hop+=dt;const k=hop/.6;if(k>=1){hop=-1;body.scale.set(1,1,1);}else{body.position.y+=Math.sin(k*Math.PI)*.9;const sq=k<.12?1-k*2:k>.88?1-(1-k)*2:1+Math.sin(k*Math.PI)*.08;body.scale.set(1/Math.sqrt(sq),sq,1/Math.sqrt(sq));}}
      wheelSpin.value-=speed*step/.32;
      // Exhaust: a puff now and then idling, more often when moving.
      puffTimer-=step;if(puffTimer<=0&&carReady){puffTimer=Math.abs(speed)>.5?.12:.6;const p=puffs.find(x=>x.userData.life<0);if(p){p.userData.life=0;p.position.copy(car.position).addScaledVector(frame.t,-1.35).addScaledVector(frame.s,.35);p.position.y+=.35;p.visible=true;}}
      puffs.forEach(p=>{if(p.userData.life<0)return;p.userData.life+=step;const k=p.userData.life/.9;if(k>=1){p.userData.life=-1;p.visible=false;return;}p.position.y+=step*.6;p.scale.setScalar(1+k*1.8);p.material.opacity=.45*(1-k)*(1-k);});
      // Chase camera: behind and above, swinging away from the sign so car and sign share the frame.
      const nearest=Math.round(q),sign=signs[nearest],side=sign?.userData.side??1,near=smooth(1-Math.abs(u-STATIONS[nearest])*30);
      offset.copy(frame.t).multiplyScalar(tall?-10:-8).addScaledVector(frame.s,-side*(2.5+near*1.5)).add({x:0,y:tall?4.4:3.6,z:0});
      look.copy(car.position).addScaledVector(frame.t,4.5).addScaledVector(frame.s,side*near*2.2);look.y+=.9+near*.8;
      if(first){camPos.copy(car.position).add(offset);camLook.copy(look);first=false;}
      camPos.lerp(car.position.clone().add(offset),1-Math.exp(-dt*3));camLook.lerp(look,1-Math.exp(-dt*3.5));
      camera.position.copy(camPos);camera.lookAt(camLook);
      fallUniforms.uTime.value=time;riverUniforms.uTime.value=time;updateAnimals(step,time,car.position);
      renderer.render(scene,camera);
    }
    function draw(){raf=requestAnimationFrame(draw);const dt=Math.min(clock.getDelta(),.05);if(onScreen()&&!document.hidden&&!window.__roadHold)tick(dt);}
    draw();
    if(new URLSearchParams(window.location.search).has("debug"))window.__road={step:(n=30)=>{for(let i=0;i<n;i++)tick(1/30);},scene,camera,car,renderer,THREE};

    return()=>{
      disposed=true;cancelAnimationFrame(raf);resize.disconnect();delete window.__road;
      canvas.removeEventListener("pointermove",onMove);canvas.removeEventListener("click",onClick);
      scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat())if(m){m.map?.dispose();m.dispose();}});
      signs.forEach(s=>s.userData.texture.dispose());renderer.dispose();canvas.remove();
    };
  },[state,skills]);
  return <div className="ht-road-canvas" ref={host} aria-hidden="true" />;
}
