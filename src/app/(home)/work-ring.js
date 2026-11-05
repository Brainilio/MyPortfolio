import * as THREE from "three";

// The Work section's orbit layout: where the project cards sit on a ring round the island. The cards themselves are
// HTML (work-cards.js: real links, sharp text, the page's card design), drawn in two layers, one under the island's
// canvas (so the peaks pass in front of the cards going round the back) and one over it; this works out, every frame,
// where each card's anchor on the ring lands on screen, how big it looks there, which way it faces, and how near the
// front it is. The ring turns with the scroll (25° per 100px, eased); hovering a card holds it still.
export function createRingAnchors({count,radius=8.8,width=3.6,y=2.9}){
  const height=width*10/16,at=new THREE.Vector3(),top=new THREE.Vector3(),out=Array.from({length:count},()=>({x:0,y:0,h:0,deg:0,facing:1}));
  let angle=null,bias=0,heldAt=null;
  return {
    anchors:out,
    // goal: the scroll's angle in degrees; hold: whether a card is under the cursor; w, h: the stage's size in pixels.
    // Returns whether the ring is still moving.
    update(dt,goal,still,hold,camera,w,h){
      if(hold&&heldAt===null)heldAt=angle;else if(!hold)heldAt=null;
      if(heldAt!==null)bias=heldAt-goal;
      const target=goal+bias;
      angle=angle===null||still?target:angle+(target-angle)*(1-Math.exp(-dt*5));
      out.forEach((o,i)=>{
        const a=(i/count*360+angle)*Math.PI/180,sx=Math.sin(a),cz=Math.cos(a);
        at.set(radius*sx,y,radius*cz).project(camera);top.set(radius*sx,y+height/2,radius*cz).project(camera);
        o.x=(at.x+1)/2*w;o.y=(1-at.y)/2*h;o.h=Math.abs(top.y-at.y)*h;
        // Which way it faces (degrees from facing the camera, -180 to 180) and how much it faces the front (1 → -1).
        o.deg=Math.atan2(sx,cz)*180/Math.PI;o.facing=cz;
      });
      return Math.abs(target-angle)>.05;
    },
  };
}
