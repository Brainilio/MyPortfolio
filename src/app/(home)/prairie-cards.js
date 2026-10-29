import * as THREE from 'three';

// Card artwork: just the project's image, cropped to fill the card (2:1).
export function drawCard(image) {
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=640;
  const g=canvas.getContext('2d');g.fillStyle='#2a1636';g.fillRect(0,0,1280,640);
  if(image){const scale=Math.max(1280/image.width,640/image.height),w=image.width*scale,h=image.height*scale;g.drawImage(image,(1280-w)/2,(640-h)/2,w,h);}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  return texture;
}

// A video plays straight from its element; the shader crops it to fill the card (see uCrop).
export function videoTexture(video) {const texture=new THREE.VideoTexture(video);texture.colorSpace=THREE.SRGBColorSpace;return texture;}
// Crop (offset x, offset y, scale x, scale y) that makes media of the given aspect fill a card of `size`, like object-fit: cover.
export function coverCrop(mediaAspect,size,out) {
  const cardAspect=size.x/size.y;
  if(mediaAspect>cardAspect){const s=cardAspect/mediaAspect;return out.set((1-s)/2,0,s,1);}
  const s=mediaAspect/cardAspect;return out.set(0,(1-s)/2,1,s);
}

// A card of liquid: the image gently ripples on its own, sloshes as the card moves, and rings out from the pointer on hover.
export function createCardMaterial(texture,size) {
  const uniforms={uMap:{value:texture},uCrop:{value:new THREE.Vector4(0,0,1,1)},uShade:{value:1},uTime:{value:0},uHover:{value:0},uVelocity:{value:0},uMouse:{value:new THREE.Vector2(.5,.5)},uSize:{value:new THREE.Vector2(size.x,size.y)}};
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,side:THREE.DoubleSide,
    vertexShader:`varying vec2 vUv;uniform float uVelocity,uHover,uTime;
      void main(){
        vUv=uv;vec3 p=position;
        p.z+=sin(uv.x*3.14159)*uVelocity*.6+sin(uv.x*4.+uTime*1.3)*sin(uv.y*3.+uTime)*.04;
        p.z+=uHover*.18*sin(uv.x*3.14159)*sin(uv.y*3.14159);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
      }`,
    fragmentShader:`varying vec2 vUv;uniform sampler2D uMap;uniform vec4 uCrop;uniform float uShade,uTime,uHover,uVelocity;uniform vec2 uMouse,uSize;
      void main(){
        vec2 uv=vUv;
        // Always a slow liquid drift; stronger when the card is moving.
        float wobble=.004+abs(uVelocity)*.02;
        uv+=vec2(sin(uv.y*9.+uTime*1.4),cos(uv.x*8.-uTime*1.2))*wobble;
        float d=distance(vUv,uMouse);
        uv+=(vUv-uMouse)*sin(d*38.-uTime*6.)*.016*uHover*exp(-d*4.);
        // Cards at the back of the ring sit a little dimmer and warmer, like the haze.
        vec3 color=mix(vec3(.95,.76,.6),texture2D(uMap,uCrop.xy+clamp(uv,.002,.998)*uCrop.zw).rgb,uShade);
        float r=.1;vec2 q=abs(vUv-.5)*uSize-(uSize*.5-r);float sd=length(max(q,0.))+min(max(q.x,q.y),0.)-r;
        // The back of the card (seen as it swings round the ring): deep violet with a soft sheen.
        if(!gl_FrontFacing)color=mix(vec3(.16,.09,.26),vec3(.36,.24,.6),.5+.5*sin((vUv.x-vUv.y)*6.+uTime*.6))*uShade+vec3(.5,.4,.8)*smoothstep(-.06,0.,sd)*.4;
        gl_FragColor=vec4(color,1.-smoothstep(-.01,.01,sd));
        #include <colorspace_fragment>
      }`});
  return {material,uniforms};
}
