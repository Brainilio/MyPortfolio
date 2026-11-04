import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { faceted, flatMaterial } from "./island-parts";

// National-park pieces shared by the full-size worlds (in the Lab) and the homepage dioramas.
const GRANITE=["#b4aea3","#a39d92","#958f85","#c4bdb1"].map(c=>new THREE.Color(c));

// Half Dome: a dome with one side sheared off into a sheer face.
export function createHalfDome(rng) {
  const g=new THREE.SphereGeometry(1,28,18,0,Math.PI,0,Math.PI/2).scale(1,1.15,.95),pos=g.attributes.position,colors=new Float32Array(pos.count*3);
  for(let i=0;i<pos.count;i++)pos.setXYZ(i,pos.getX(i)*(1+(rng()-.5)*.04),pos.getY(i),pos.getZ(i)*(1+(rng()-.5)*.04));
  for(let i=0;i<pos.count;i++){const c=GRANITE[Math.floor(pos.getY(i)*3.99)%4];colors.set([c.r,c.g,c.b],i*3);}
  g.setAttribute("color",new THREE.BufferAttribute(colors,3));g.deleteAttribute("uv");g.computeVertexNormals();
  const dome=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));
  // The sheer face: a flat cap closing the cut side.
  const face=new THREE.Mesh(new THREE.CircleGeometry(1,28,0,Math.PI).scale(1,1.15,1),new THREE.MeshStandardMaterial({color:"#9a948a",roughness:1,side:THREE.DoubleSide}));
  const group=new THREE.Group();group.add(dome,face);return group;
}
// A national-park entrance sign: a dark-stained plank board with a routed cream border and lettering, held up by two
// log posts set in a stone footing. Lettering is Bitter (Google Fonts, OFL), a sturdy slab close to park signage.
// Every line is measured and shrunk to fit inside the border, and a long tool list wraps onto two lines.
const BOARD={w:4.4,h:2.2,r:.14};
function roundedRect(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
export function createSign(skill,index) {
  const W=1024,H=512,canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;
  const g=canvas.getContext("2d"),CREAM="#efe2bf",SHADOW="#24130a",family="Bitter, Georgia, serif";
  // Largest size (up to max) at which the text fits the width.
  const fit=(text,weight,max,width,spacing=0)=>{let size=max;for(;size>18;size-=2){g.font=`${weight} ${size}px ${family}`;g.letterSpacing=`${spacing*size}px`;if(g.measureText(text).width<=width)break;}return size;};
  const carve=(text,y,weight,size,spacing=0)=>{g.font=`${weight} ${size}px ${family}`;g.letterSpacing=`${spacing*size}px`;g.fillStyle=SHADOW;g.fillText(text,W/2+3,y+4);g.fillStyle=CREAM;g.fillText(text,W/2,y);};
  const paint=()=>{
    g.clearRect(0,0,W,H);
    roundedRect(g,0,0,W,H,32);g.fillStyle="#4e2f1d";g.fill();
    // Three planks: seams and a little grain.
    g.save();g.clip();
    for(let i=0;i<90;i++){g.globalAlpha=.05+(i%4)*.015;g.fillStyle=i%3?"#1d0f07":"#8a5a3a";g.fillRect(0,(i*53.7)%H,W,1+(i%3));}
    g.globalAlpha=.5;g.fillStyle="#24130a";for(const y of [H/3,H*2/3])g.fillRect(0,y-2,W,4);
    g.restore();g.globalAlpha=1;
    roundedRect(g,26,26,W-52,H-52,20);g.lineWidth=7;g.strokeStyle=SHADOW;g.save();g.translate(2,3);g.stroke();g.restore();g.strokeStyle=CREAM;g.stroke();
    g.textAlign="center";g.textBaseline="alphabetic";
    const inner=W-150;
    carve(skill.title,222,800,fit(skill.title,800,150,inner,-.01),-.01);
    g.fillStyle=CREAM;g.fillRect(W/2-60,262,120,5);
    // The tools: one line if it fits at a readable size, otherwise split into two balanced lines.
    const one=skill.items.join("  ·  "),size=fit(one,600,48,inner,.02);
    if(size>=38)carve(one,360,600,size,.02);
    else{const half=Math.ceil(skill.items.length/2),lines=[skill.items.slice(0,half),skill.items.slice(half)].map(x=>x.join("  ·  "));
      const s=Math.min(...lines.map(l=>fit(l,600,46,inner,.02)));carve(lines[0],340,600,s,.02);carve(lines[1],340+s*1.3,600,s,.02);}
  };
  paint();
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
  // Re-letter once the sign font has loaded.
  Promise.all([document.fonts?.load(`800 140px Bitter`),document.fonts?.load(`600 40px Bitter`)]).then(()=>{paint();texture.needsUpdate=true;}).catch(()=>{});
  const sign=new THREE.Group(),wood=new THREE.MeshStandardMaterial({color:"#3d2416",flatShading:true,roughness:1});
  const {w,h,r}=BOARD,shape=new THREE.Shape();
  shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
  shape.lineTo(-w/2+r,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  const board=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.14,bevelEnabled:true,bevelSize:.035,bevelThickness:.03,bevelSegments:1}),wood);
  board.position.set(0,2.35,-.08);sign.add(board);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,transparent:true,roughness:.85}));
  face.position.set(0,2.35,.1);sign.add(face);
  // Log posts with rounded tops, in a footing of piled stones.
  const log=new THREE.MeshStandardMaterial({color:"#6b4630",flatShading:true,roughness:1}),stones=[];
  for(const x of [-1.75,1.75]){
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.17,.2,3.6,7),log);post.position.set(x,1.8,-.22);sign.add(post);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.17,7,4,0,Math.PI*2,0,Math.PI/2),log);cap.position.set(x,3.6,-.22);sign.add(cap);
    for(let k=0;k<6;k++){const a=k/6*Math.PI*2+index,s=.22+((k*7+index*3)%5)*.04;stones.push(new THREE.DodecahedronGeometry(s,0).scale(1,.7,1).translate(x+Math.cos(a)*.34,s*.45,-.22+Math.sin(a)*.3));}
  }
  const footing=new THREE.Mesh(mergeGeometries(stones),new THREE.MeshStandardMaterial({color:"#8d8b8f",flatShading:true,roughness:1}));sign.add(footing);
  sign.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});sign.userData.texture=texture;return sign;
}

const FIN_COLORS=["#8f3b22","#a8462a","#bd5631","#cc6a3e"].map(c=>new THREE.Color(c));
// A sandstone fin, built the way the island's underside is: rings of shared points stacked up a slim oval
// cross-section, each point jittered once (so the facets stay closed and smooth), tapering into a jagged crest that
// peaks off-centre. Banded rust to cream by height, like Garden of the Gods.
export function createFin(rng,width,height,depth) {
  const SEG=16,RINGS=7,crest=.25+rng()*.5,rings=[];
  const crestAt=u=>Math.pow(Math.max(0,1-Math.abs(u-crest)/Math.max(crest,1-crest)),.75);
  for(let k=0;k<=RINGS;k++){
    const t=k/RINGS,ring=[];
    for(let s=0;s<SEG;s++){
      const a=s/SEG*Math.PI*2,u=.5+.5*Math.cos(a);
      // The top ring follows the crest line; lower rings taper and thin toward it.
      const rise=k===RINGS?height*(.42+.58*crestAt(u))*(.9+rng()*.18):height*t*(.55+.45*crestAt(u));
      const rx=width/2*(1-t*.18)*(.94+rng()*.1),rz=depth/2*(1-t*.55)*(.9+rng()*.16);
      ring.push(new THREE.Vector3(Math.cos(a)*rx,Math.max(0,rise+(k&&k<RINGS?(rng()-.5)*height*.04:0)),Math.sin(a)*rz));
    }
    rings.push(ring);
  }
  const tris=[];
  for(let k=1;k<rings.length;k++)for(let s=0;s<SEG;s++){const a=rings[k-1][s],b=rings[k-1][(s+1)%SEG],c=rings[k][s],d=rings[k][(s+1)%SEG];tris.push([a,b,c],[b,d,c]);}
  // Cap the crest: a ridge line joining the two sides of the top ring.
  const top=rings.at(-1);tris.push([top[0],top[1],top[SEG-1]]);for(let s=1;s<SEG/2;s++){const a=top[s],b=top[s+1],c=top[SEG-s],d=top[SEG-s-1];tris.push([a,b,c],[b,d,c]);}
  const geometry=faceted(tris,(tri,c)=>{const y=(tri[0].y+tri[1].y+tri[2].y)/3/height,band=Math.min(3,Math.floor(y*4.4+rng()*.5));c.copy(FIN_COLORS[band]);});
  return new THREE.Mesh(geometry,flatMaterial());
}

// A woven basket: a lathe-turned bowl with alternating bands.
export function createBasket() {
  const profile=[[0,.02],[.5,.02],[.62,.12],[.7,.3],[.74,.46],[.8,.5],[.76,.54],[.66,.5],[.6,.32],[.5,.14],[0,.12]].map(([x,y])=>new THREE.Vector2(x,y));
  const geometry=new THREE.LatheGeometry(profile,14).toNonIndexed(),pos=geometry.attributes.position,colors=new Float32Array(pos.count*3);
  const light=new THREE.Color("#c48a4a"),dark=new THREE.Color("#8e5a2c");
  for(let i=0;i<pos.count;i+=3){const y=(pos.getY(i)+pos.getY(i+1)+pos.getY(i+2))/3,a=Math.atan2(pos.getZ(i),pos.getX(i)),c=(Math.floor(y*14)+Math.floor((a+Math.PI)*2.2))%2?light:dark;for(let k=0;k<3;k++)colors.set([c.r,c.g,c.b],(i+k)*3);}
  geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));geometry.computeVertexNormals();
  return new THREE.Mesh(geometry,flatMaterial());
}

