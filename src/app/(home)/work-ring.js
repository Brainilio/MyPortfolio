import * as THREE from "three";

// The Work section's orbit layout: the project cards on a ring round the island, in the island's own 3D scene, so
// they pass in front of it and behind the peaks. Each card is a curved strip of the ring's cylinder showing the
// project's picture with the same numbered pill as the page's cards (drawn into a canvas texture, corners rounded);
// seen from behind, a card is a darkened mirror of itself. The ring turns with the scroll (25° per 100px, eased);
// hovering a card lifts it and holds the ring; tapping one opens the project.
const DEG=Math.PI/180;
export function createCardRing({projects,radius=8.8,width=3.1,y=2.9,onLoad}){
  const group=new THREE.Group(),cards=[],arc=width/radius,height=width*10/16;
  projects.forEach((project,i)=>{
    const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=640;
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
    const geometry=new THREE.CylinderGeometry(radius,radius,height,32,1,true,-arc/2,arc);
    const front=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.FrontSide,toneMapped:false}));
    const back=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.BackSide,color:"#4a3a5a",toneMapped:false}));
    const card=new THREE.Group();card.add(front,back);card.position.y=y;group.add(card);
    cards.push({card,front,texture,project,base:i/projects.length*Math.PI*2,lift:0});
    // The picture (cover-fitted), the corners rounded off, and the pill in the bottom left.
    const image=new Image();image.decoding="async";
    image.onload=()=>{
      const g=canvas.getContext("2d"),w=canvas.width,h=canvas.height,r=26;
      g.clearRect(0,0,w,h);g.save();g.beginPath();g.roundRect(0,0,w,h,r);g.clip();
      const k=Math.max(w/image.width,h/image.height);g.drawImage(image,(w-image.width*k)/2,(h-image.height*k)/2,image.width*k,image.height*k);g.restore();
      const label=`${String(i+1).padStart(2,"0")} · ${project.name} →`;g.font="500 30px Inter, system-ui, sans-serif";
      const tw=g.measureText(label).width,px=36,ph=62,py=h-36-ph;
      g.fillStyle="rgba(0,0,0,.5)";g.beginPath();g.roundRect(px,py,tw+52,ph,ph/2);g.fill();
      g.strokeStyle="rgba(255,255,255,.18)";g.lineWidth=2;g.stroke();
      g.fillStyle="#fff";g.textBaseline="middle";g.fillText(label,px+26,py+ph/2+1);
      texture.needsUpdate=true;onLoad?.();
    };
    image.src=project.previewImage;
  });
  let angle=null,hovered=-1,bias=0,held=null;
  return {group,meshes:cards.map(c=>c.front),
    // Which card a raycast hit, or -1.
    indexOf(object){return cards.findIndex(c=>c.front===object);},
    project:i=>cards[i]?.project,
    hover(i){if(i===hovered)return;hovered=i;held=i>=0?angle:null;},
    // goal: the scroll's angle (degrees); returns whether it's still moving.
    update(dt,goal,still){
      if(held!==null)bias=held-goal;
      const target=goal+bias;
      angle=angle===null||still?target:angle+(target-angle)*(1-Math.exp(-dt*5));
      let moving=Math.abs(target-angle)>.05;
      cards.forEach((c,i)=>{
        c.card.rotation.y=c.base+angle*DEG;
        const lift=i===hovered?1:0;c.lift+=(lift-c.lift)*(still?1:1-Math.exp(-dt*10));if(Math.abs(lift-c.lift)>.002)moving=true;
        c.card.position.y=y+.18*c.lift;c.card.scale.setScalar(1+.06*c.lift);
      });
      return moving;
    },
    dispose(){cards.forEach(c=>{c.texture.dispose();c.front.geometry.dispose();c.front.material.dispose();c.card.children[1].material.dispose();});}};
}
