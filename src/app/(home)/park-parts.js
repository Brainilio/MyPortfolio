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
// A Monument Valley butte (the Mittens): a convex talus skirt of fallen rock, a sheer, nearly vertical cliff shaft
// with two or three strata ledges, and a flat cap with a broken, eroded top edge, optionally with a "thumb" spire on
// its right. Three colours tell it: the dark shadowed cliffs, the mid-tone talus catching the light, and the
// sun-bleached top. height is the whole butte's; width (optional) sets the cap's diameter, for a wide mesa stub.
const MITTEN={talus:"#b5602e",cliff:"#8b3a1a",cap:"#d4854a"};
// A closed ring-built solid: rings of [y, radius] from the bottom up, each radius nudged per side by the same wobble so
// the walls stay straight, with an optional bump per ring and per side for an eroded edge. Faces coloured by ring.
function ringSolid(rng,rings,sides,wobble,colorOf,{bottom=false,top=false,topJitter=null}={}) {
  const pts=rings.map(([y,r,jag],k)=>Array.from({length:sides},(_,s)=>{
    const a=s/sides*Math.PI*2,k2=wobble[s]*(1+(jag?(rng()-.5)*2*jag:0));
    return new THREE.Vector3(Math.cos(a)*r*k2,y+(top&&k===rings.length-1&&topJitter?topJitter(rng):0),Math.sin(a)*r*k2);}));
  const tris=[],paint=new Map(),add=(tri,c)=>{tris.push(tri);paint.set(tri,c);};
  for(let k=0;k<pts.length-1;k++)for(let s=0;s<sides;s++){
    const a=pts[k][s],b=pts[k][(s+1)%sides],c=pts[k+1][(s+1)%sides],d=pts[k+1][s],col=colorOf(k);
    add([a,c,b],col);add([a,d,c],col);}
  const last=pts.at(-1),cy=last.reduce((m,v)=>m+v.y,0)/sides,centre=new THREE.Vector3(0,cy,0);
  if(top)for(let s=0;s<sides;s++)add([last[s],centre,last[(s+1)%sides]],colorOf(-1));
  if(bottom)for(let s=0;s<sides;s++)add([pts[0][(s+1)%sides],new THREE.Vector3(0,pts[0][0].y,0),pts[0][s]],colorOf(0));
  return faceted(tris,(tri,color)=>color.set(paint.get(tri)));
}
export function createButte(rng,height,{width=null,thumb=false}={}) {
  const H=height,shaft=width?width/2:.18*H,talusH=.2*H,shaftH=.75*H,capH=.05*H,skirt=shaft+.27*H;
  const parts=[];
  // The talus skirt: wide at the ground, curving in (convex) to meet the cliff, its outer edge ragged.
  const skirtWobble=Array.from({length:11},()=>.92+rng()*.16);
  parts.push(ringSolid(rng,[[0,skirt,.08],[talusH*.35,shaft+(skirt-shaft)*.55],[talusH*.75,shaft+(skirt-shaft)*.18],[talusH,shaft*1.02]],11,skirtWobble,()=>MITTEN.talus,{bottom:true}));
  // The cliff shaft: an uneven 8-sided column, barely leaning in, with strata ledges at irregular heights.
  const sides=8,wobble=Array.from({length:sides},()=>.86+rng()*.26),rings=[[talusH*.9,shaft]],top=shaft*(width?.97:.9);
  const radiusAt=t=>shaft+(top-shaft)*t;
  const ledges=Array.from({length:2+(rng()<.5?1:0)},(_,i,_a)=>.22+i*.26+rng()*.12);
  for(const t of ledges){const y=talusH+t*shaftH,r=radiusAt(t),bump=r*(.03+rng()*.02),tall=shaftH*(.04+rng()*.02);
    rings.push([y-tall/2,r],[y-tall/2+.001,r+bump],[y+tall/2,r+bump],[y+tall/2+.001,r]);}
  rings.push([talusH+shaftH,top]);
  parts.push(ringSolid(rng,rings,sides,wobble,()=>MITTEN.cliff));
  // The cap: a thin slab of the lighter rock, its top edge broken (some corners up, some down).
  parts.push(ringSolid(rng,[[talusH+shaftH,top*1.03],[talusH+shaftH+capH,top*1.03]],sides,wobble,()=>MITTEN.cap,
    {top:true,topJitter:r=>r()<.6?r()*.08*H:-r()*.05*H}));
  // The West Mitten's thumb: a slim spire standing against the right side of the shaft.
  if(thumb){const h=.25*H,r=shaft*.3,tw=Array.from({length:6},()=>.85+rng()*.3);
    const spire=ringSolid(rng,[[talusH*.8,r],[talusH*.8+h*.9,r*.85],[talusH*.8+h,r*.85]],6,tw,k=>k===1||k<0?MITTEN.cap:MITTEN.cliff,{top:true,topJitter:q=>q()*.03*H});
    spire.translate(shaft*1.05,0,shaft*.15);parts.push(spire);}
  const material=new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(mergeGeometries(parts),material);mesh.userData.foot=skirt;
  return mesh;
}

export function createBasket() {
  const profile=[[0,.02],[.5,.02],[.62,.12],[.7,.3],[.74,.46],[.8,.5],[.76,.54],[.66,.5],[.6,.32],[.5,.14],[0,.12]].map(([x,y])=>new THREE.Vector2(x,y));
  const geometry=new THREE.LatheGeometry(profile,14).toNonIndexed(),pos=geometry.attributes.position,colors=new Float32Array(pos.count*3);
  const light=new THREE.Color("#c48a4a"),dark=new THREE.Color("#8e5a2c");
  for(let i=0;i<pos.count;i+=3){const y=(pos.getY(i)+pos.getY(i+1)+pos.getY(i+2))/3,a=Math.atan2(pos.getZ(i),pos.getX(i)),c=(Math.floor(y*14)+Math.floor((a+Math.PI)*2.2))%2?light:dark;for(let k=0;k<3;k++)colors.set([c.r,c.g,c.b],(i+k)*3);}
  geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));geometry.computeVertexNormals();
  return new THREE.Mesh(geometry,flatMaterial());
}

// A little Teton range: a cluster of jagged, faceted peaks round a tall central spire (the Grand), closed all the way
// round so it holds up from any side. Slate blue rock, snow streaked over the upper facets.
const SLATE=["#4a5577","#56618a","#69739a"].map(c=>new THREE.Color(c)),SNOW=new THREE.Color("#eceaf4");
export function createTetons(rng,peaks=[[0,0,1.15,3.3],[-1.15,.25,.95,2.3],[1.05,.15,.9,2.6],[-2.1,.45,.85,1.5],[2,.4,.75,1.7]]) {
  const tris=[],SEG=7;
  for(const [px,pz,r,h] of peaks){
    const rings=[[0,1],[.38,.66],[.72,.3]].map(([t,k])=>Array.from({length:SEG},(_,s)=>{const a=s/SEG*Math.PI*2+(rng()-.5)*.5,rr=r*k*(.75+rng()*.5);return new THREE.Vector3(px+Math.cos(a)*rr,h*t*(.9+rng()*.2),pz+Math.sin(a)*rr*.75);}));
    const tip=new THREE.Vector3(px+(rng()-.5)*r*.25,h,pz+(rng()-.5)*r*.2);
    for(let k=1;k<rings.length;k++)for(let s=0;s<SEG;s++){const a=rings[k-1][s],b=rings[k-1][(s+1)%SEG],c=rings[k][s],d=rings[k][(s+1)%SEG];tris.push([a,b,c],[b,d,c]);}
    for(let s=0;s<SEG;s++)tris.push([rings[2][s],rings[2][(s+1)%SEG],tip]);
    tris.forEach(tri=>{tri.peak??=h;});
  }
  const geometry=faceted(tris,(tri,c)=>{
    const k=(tri[0].y+tri[1].y+tri[2].y)/3/tri.peak;
    c.copy(SLATE[Math.floor(rng()*3)]);
    if(k>.55&&rng()<(k-.45)*1.6)c.lerp(SNOW,.8+rng()*.15);
  });
  return new THREE.Mesh(geometry,flatMaterial());
}
