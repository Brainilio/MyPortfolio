// Cuts between two scenes, as the final post pass while a transition plays. The scene is swapped while the
// effect is at full strength, so the cut itself is hidden. uMode: 0 glitch, 1 liquid, 2 fade.
// - glitch: sliced rows jumping sideways, displaced blocks, an RGB split, scanlines and grain.
// - liquid: the frame melts into flowing ripples (layered warps + a soft smear), then resolves.
// - fade: a plain dip to the dark of space.
export const GlitchShader = {
  uniforms: { tDiffuse: { value: null }, uAmount: { value: 0 }, uTime: { value: 0 }, uMode: { value: 0 } },
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `
uniform sampler2D tDiffuse;uniform float uAmount,uTime;uniform int uMode;varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
vec3 glitch(float a){
  float t=floor(uTime*20.);vec2 uv=vUv;
  float band=floor(uv.y*mix(10.,46.,hash(vec2(t,1.))));
  float shift=(hash(vec2(band,t))-.5)*.2*a*step(1.-a*.8,hash(vec2(band,t+7.)));
  uv.x+=shift;
  vec2 block=floor(vUv*vec2(14.,9.));
  if(hash(block+t)<a*.16)uv+=(vec2(hash(block+t+1.),hash(block+t+2.))-.5)*.09*a;
  float split=.014*a+abs(shift)*.25;
  vec3 c=vec3(texture2D(tDiffuse,uv+vec2(split,0.)).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-vec2(split,0.)).b);
  c*=1.-a*.22*step(.5,fract(vUv.y*220.));
  c+=(hash(vUv*vec2(913.,577.)+t)-.5)*.22*a;
  return mix(c,c*vec3(.75,.85,1.3),a*.35);
}
vec3 liquid(float a){
  vec2 uv=vUv,p=uv*3.;float t=uTime*.6;
  // Domain-warped flow: the picture is pushed around by slow currents, harder as the cut peaks.
  vec2 flow=vec2(noise(p+vec2(t,0.)),noise(p+vec2(0.,t)+5.2))-.5;
  vec2 flow2=vec2(noise(p*2.1+flow*3.+t),noise(p*2.1-flow*3.-t+1.7))-.5;
  vec2 d=(flow*.9+flow2*.6)*.16*a;
  // Rings spreading from the centre.
  vec2 c=uv-.5;float r=length(c);d+=normalize(c+1e-4)*sin(r*30.-uTime*6.)*.012*a;
  vec3 col=vec3(0.);
  for(int i=0;i<5;i++){float k=float(i)/4.;col+=vec3(texture2D(tDiffuse,uv+d*(1.+k*.6)+vec2(.004*a*k,0.)).r,texture2D(tDiffuse,uv+d*(1.+k*.5)).g,texture2D(tDiffuse,uv+d*(1.+k*.4)-vec2(.004*a*k,0.)).b);}
  col/=5.;
  // A violet sheen in the folds.
  return mix(col,col*.6+vec3(.42,.3,.85)*length(flow2)*1.4,a*.35);
}
void main(){
  float a=uAmount;vec3 c;
  if(uMode==0)c=glitch(a);
  else if(uMode==1)c=liquid(a);
  else c=texture2D(tDiffuse,vUv).rgb*(1.-a);
  gl_FragColor=vec4(c,1.);
}`,
};
