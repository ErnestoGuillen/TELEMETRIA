'use strict';
(function () {
  const canvas = document.getElementById('scene');
  /* MV PRO: ?cielo=foto usa la imagen anterior; por defecto cielo procedural realista */
  const mvSkyPhoto = /[?&]cielo=foto/i.test(location.search);
  let mvMotionScale = 1, mvMotionTimer = 0, mvMotionResize = null;
  function mvMotionStart() {
    clearTimeout(mvMotionTimer);
    if (mvMotionScale !== .68) { mvMotionScale = .68; if (mvMotionResize) mvMotionResize(); }
    mvMotionTimer = setTimeout(() => { mvMotionScale = 1; if (mvMotionResize) mvMotionResize(); }, 260);
  }
  /* MV PRO: ?calidad=ultra (o ?4k) fuerza máxima resolución para videowall / pantallas 4K */
  const mvUltra = /[?&](calidad=ultra|4k)(&|$|=)/i.test(location.search) || (window.screen && window.screen.width * (window.devicePixelRatio || 1) >= 3800);
  const returnToAnillo = document.createElement('a');
  returnToAnillo.id = 'mvReturnAnillo';
  returnToAnillo.href = '/ANILLOTV3D';
  returnToAnillo.textContent = '← Regresar a Anillo TV';
  returnToAnillo.setAttribute('aria-label', 'Regresar a Anillo TV');
  returnToAnillo.title = 'Regresar a Anillo TV 3D';
  const returnToAnilloStyle = document.createElement('style');
  returnToAnilloStyle.id = 'mvReturnAnilloStyle';
  returnToAnilloStyle.textContent = `
    #mvReturnAnillo{position:fixed!important;top:14px!important;bottom:auto!important;left:14px!important;right:auto!important;z-index:2147483647!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:42px!important;max-width:calc(100vw - 28px)!important;padding:0 16px!important;margin:0!important;border:1px solid #c9d7de!important;border-radius:8px!important;background:rgba(255,255,255,.98)!important;color:#203e52!important;text-decoration:none!important;font:500 13px/1.25 Arial,sans-serif!important;letter-spacing:0!important;white-space:nowrap!important;box-shadow:0 3px 12px rgba(0,0,0,.18)!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;transform:none!important;isolation:isolate!important;cursor:pointer!important}
    #mvReturnAnillo:hover{background:#fff!important;border-color:#0058b7!important}
    #mvReturnAnillo:focus-visible{outline:3px solid #0058b7!important;outline-offset:3px!important}
    html.mv-present-alerts #mvReturnAnillo,body:has(#mvAlerts.mv-present-positioned) #mvReturnAnillo{top:auto!important;bottom:14px!important}
    @media(max-width:640px){#mvReturnAnillo{left:9px!important;top:9px!important;min-height:36px!important;padding:0 10px!important;font-size:11px!important}html.mv-present-alerts #mvReturnAnillo,body:has(#mvAlerts.mv-present-positioned) #mvReturnAnillo{bottom:9px!important;top:auto!important}}
  `;
  document.head.appendChild(returnToAnilloStyle);
  document.body.appendChild(returnToAnillo);
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, powerPreference: 'high-performance' }) || canvas.getContext('webgl', { antialias: true, alpha: true, powerPreference: 'high-performance' });
  if (!gl) { const notice = document.getElementById('notice'); notice.querySelector('.notice-title').textContent = 'No se pudo iniciar WebGL'; notice.querySelector('.notice-text').textContent = 'El navegador no pudo crear un contexto WebGL. Verifica la aceleración por hardware y chrome://gpu. Si la versión anterior abre, revisa la consola con F12.'; notice.style.display = 'block'; document.documentElement.classList.add('mv-scene-ready'); return; }
  let graphicsContextLost = false;
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); graphicsContextLost = true; });
  canvas.addEventListener('webglcontextrestored', () => { window.location.reload(); });
  const vert = `
attribute vec3 aPos; attribute vec3 aNormal; attribute vec3 aColor; attribute vec4 aData;
uniform mat4 uVP; uniform float uTime; uniform float uAnimate; uniform float uLevels[14];
uniform mat4 uLightVP; varying vec4 vShadowPos;
varying vec3 vNormal; varying vec3 vColor; varying vec3 vPos; varying vec4 vData;
varying float vTankFill;
float getLevel(float id){
  if(id < 0.5) return uLevels[0];
  if(id < 1.5) return uLevels[1];
  if(id < 2.5) return uLevels[2];
  if(id < 3.5) return uLevels[3];
  if(id < 4.5) return uLevels[4];
  if(id < 5.5) return uLevels[5];
  if(id < 6.5) return uLevels[6];
  if(id < 7.5) return uLevels[7];
  if(id < 8.5) return uLevels[8];
  if(id < 9.5) return uLevels[9];
  if(id < 10.5) return uLevels[10];
  if(id < 11.5) return uLevels[11];
  if(id < 12.5) return uLevels[12];
  return uLevels[13];
}
void main(){
  vec3 p=aPos;
  vTankFill=1.0;
  if((aData.z>4.5 && aData.z<6.5) || (aData.z>8.5 && aData.z<10.5)){

    float level=clamp(getLevel(aData.y),.0,.94);
    vTankFill=level;
    p.y=.52+(p.y-.52)*level;
    if(aData.z>8.5 && aData.z<9.5){
      vec2 impact=aColor.xy;
      float r=length(aPos.xz-impact);
      float fade=exp(-r*1.9);
      float wave=sin(r*18.0-uTime*4.4)*.024*fade;
      float secondary=sin(r*32.0-uTime*6.2)*.008*fade;
      p.y+=(wave+secondary)*smoothstep(.025,.20,level)*uAnimate;
    }else if(aData.z>9.5 && aData.z<10.5){
      vec2 impact=aColor.xy;
      vec2 radial=aPos.xz-impact;
      float originalR=length(radial);
      float newR=mod(originalR+uTime*.34*uAnimate,.78);
      p.xz=impact+normalize(radial+vec2(.00001))*(newR+.02);
      p.y+=(.028+.009*sin(newR*17.0-uTime*2.0))*level;
    }else if(aData.z>5.5){
      p.y+=(.020*sin(aPos.x*3.1+uTime*.95)+.017*sin(aPos.z*4.1-uTime*.65))*level*uAnimate;
    }
  }
  vPos=p;vNormal=aNormal;vColor=aColor;vData=aData;gl_Position=uVP*vec4(p,1.0);
  vShadowPos=uLightVP*vec4(p,1.0);
}`;
  const frag = `
precision highp float;
varying vec3 vNormal; varying vec3 vColor; varying vec3 vPos; varying vec4 vData;
varying float vTankFill;
uniform vec3 uCamera; uniform float uTime; uniform float uAnimate; uniform float uEvening;
uniform sampler2D uTurfTex; uniform sampler2D uForestTex;
/* MV PRO: sombras del sol, oclusión de contacto y reflejos del cielo */
uniform sampler2D uShadowMap; uniform float uShadowOn; uniform vec2 uShadowTexel; varying vec4 vShadowPos;
uniform vec4 uTankAO[14]; uniform float uAOOn;
uniform sampler2D uSkyRefl; uniform float uSkyReflReady; uniform float uProGrade;
float mvShadow(vec3 N, vec3 L){
  if(uShadowOn<.5) return 1.0;
  vec3 s=vShadowPos.xyz/vShadowPos.w*.5+.5;
  if(s.x<=.001||s.x>=.999||s.y<=.001||s.y>=.999||s.z>=1.0) return 1.0;
  float ndl=clamp(dot(N,L),0.0,1.0);
  float bias=.00045+.0016*(1.0-ndl);
  vec2 t=uShadowTexel*1.35;
  float sum=step(s.z-bias,texture2D(uShadowMap,s.xy+vec2(-.5,-1.5)*t).r)
           +step(s.z-bias,texture2D(uShadowMap,s.xy+vec2(1.5,-.5)*t).r)
           +step(s.z-bias,texture2D(uShadowMap,s.xy+vec2(.5,1.5)*t).r)
           +step(s.z-bias,texture2D(uShadowMap,s.xy+vec2(-1.5,.5)*t).r);
  float edge=smoothstep(.0,.04,min(min(s.x,1.0-s.x),min(s.y,1.0-s.y)));
  return mix(1.0,sum*.25,edge);
}
float mvContactAO(){
  float ao=1.0;
  for(int i=0;i<14;i++){
    vec4 t=uTankAO[i];
    if(t.z<.001) continue;
    float dd=max(length(vPos.xz-t.xy)-t.z,0.0);
    ao*=1.0-.34*exp(-dd*1.45);
  }
  return ao;
}
vec3 mvSky(vec3 dir){
  dir=normalize(vec3(dir.x,max(dir.y,.03),dir.z));
  float az=atan(dir.z,dir.x);
  float el=asin(clamp(dir.y,-1.0,1.0));
  vec3 sky=mix(vec3(.78,.86,.93),vec3(.24,.48,.82),pow(clamp(dir.y,0.0,1.0),.55));
  sky+=vec3(.25,.22,.16)*pow(max(dot(dir,normalize(vec3(-.42,.95,.56))),0.0),12.0);
  return sky*mix(vec3(1.0),vec3(.45,.52,.66),uEvening);
}
vec3 mvGrade(vec3 c){
  c=max(c,vec3(0.0));
  float l=dot(c,vec3(.2126,.7152,.0722));
  vec3 g=mix(vec3(l),c,1.07);
  g=(g-.5)*1.055+.5+.006;
  g*=vec3(1.012,1.0,.985);
  return mix(c,clamp(g,0.0,1.0),uProGrade);
}
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise2(vec2 p){
  vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash2(i),hash2(i+vec2(1.,0.)),f.x),
    mix(hash2(i+vec2(0.,1.)),hash2(i+vec2(1.,1.)),f.x),f.y);
}
float waterNoise(vec2 p){
  float a=0.0;
  a+=0.54*noise2(p);
  a+=0.29*noise2(p*2.04+vec2(11.1,-7.2));
  a+=0.17*noise2(p*4.15+vec2(-3.2,8.4));
  return a;
}
vec3 mvUnifiedGrass(vec2 uv, vec3 N, vec3 L, vec3 V, float d, float d2){
  vec2 drift=vec2(
    noise2(uv*.045+vec2(8.7,-4.3))-.5,
    noise2(uv*.045+vec2(-6.2,11.5))-.5
  );
  uv += drift*2.4;
  float broad=noise2(uv*.065);
  float broad2=noise2(uv*.14+vec2(22.4,-7.6));
  float medium=noise2(uv*.42+vec2(-14.2,9.3));
  float fine=noise2(uv*2.4+vec2(4.3,17.9));
  float grain=noise2(uv*8.8+vec2(-8.6,5.4));
  float brushA=pow(abs(sin(uv.x*7.0+uv.y*3.0+medium*2.4)),8.0)*.35;
  float brushB=pow(abs(sin(uv.x*3.6-uv.y*6.4+fine*1.8)),10.0)*.18;
  float brush=clamp(brushA+brushB,0.,1.);
  float layout=clamp(broad*.46+broad2*.28+medium*.18+fine*.08,0.,1.);
  vec3 dark=vec3(.075,.18,.08);
  vec3 base=vec3(.135,.31,.12);
  vec3 mid=vec3(.205,.42,.17);
  vec3 soft=vec3(.295,.54,.23);
  vec3 shade=mix(dark,base,smoothstep(.08,.52,layout));
  shade=mix(shade,mid,smoothstep(.42,.78,layout));
  shade=mix(shade,soft,smoothstep(.78,.97,layout)*.55);
  shade += vec3(.030,.045,.018)*brush;
  float speck=pow(grain,2.6)*.06;
  shade -= vec3(.018,.014,.008)*speck;
  float wear=smoothstep(.70,.95,noise2(uv*.18+vec2(30.0,-18.0)))*.10;
  shade=mix(shade,shade*vec3(.96,.94,.88)+vec3(.01,.01,.005),wear);
  float sheen=pow(max(dot(normalize(reflect(-L,N)),V),0.0),6.0)*.05;
  float sun=.84+.16*d+.06*d2;
  return shade*sun + vec3(.03,.045,.02)*sheen;
}

void main(){
vec3 N=normalize(vNormal);vec3 L=normalize(vec3(-.42,.95,.56));vec3 L2=normalize(vec3(.7,.8,-.4));
float d=max(dot(N,L),0.0), d2=max(dot(N,L2),0.0);
float mvSh=mix(1.0,mvShadow(N,L),1.0-.55*uEvening); d*=mvSh; d2*=mix(1.0,mvSh,.30);
vec3 V=normalize(uCamera-vPos), H=normalize(L+V);
float spec=pow(max(dot(N,H),0.0),29.0)*mvSh;
float fres=pow(1.0-max(dot(N,V),0.0),2.0);
float shine=vData.x, kind=vData.z;
if(((kind>4.5&&kind<6.5)||(kind>8.5&&kind<10.5)) && vTankFill<.018) discard;
vec3 c=vColor*(0.36+0.55*d+0.22*d2)+vec3(.65,.86,1.0)*spec*.35;
float outAlpha=vData.w;
if(kind>.5&&kind<1.5){

  float travel=vData.y-uTime*2.05*uAnimate;
  float circumference=atan(N.z,N.y+.001);
  float broad=waterNoise(vec2(travel*.45,circumference*.72+sin(travel*.28)));
  float eddy=waterNoise(vec2(travel*1.32+broad*1.4,circumference*1.53-uTime*.20*uAnimate));
  float micro=waterNoise(vec2(travel*3.9+eddy*2.0,circumference*2.6+broad));
  float pigment=clamp(.16+.70*eddy+.24*micro,0.,1.);
  vec3 deep=vec3(.008,.105,.35);
  vec3 blue=vec3(.014,.36,.76);
  vec3 highlight=vec3(.24,.72,.97);
  c=mix(deep,blue,pigment);
  c+=highlight*pow(smoothstep(.56,.93,micro+eddy*.13),2.2)*.30;
  c+=vec3(.23,.61,.93)*pow(smoothstep(.59,.83,broad),3.0)*.18;
  c+=vec3(.57,.83,1.)*(pow(max(dot(N,H),0.),33.)*.30+fres*.20);
} else if(kind>8.5&&kind<9.5){

  vec2 impact=vColor.xy;
  float rr=length(vPos.xz-impact);
  float t=uTime*uAnimate;
  float crest=sin(rr*18.-t*4.4);
  float crest2=sin(rr*31.-t*6.2+1.3);
  float energy=exp(-rr*2.5)*smoothstep(.025,.22,vTankFill);
  float churn=waterNoise(vPos.xz*3.0+vec2(t*.37,-t*.31));
  c=mix(vec3(.012,.22,.57),vec3(.045,.45,.83),.35+.47*churn);
  c+=vec3(.12,.35,.50)*max(0.,crest)*energy;
  c+=vec3(.52,.84,.96)*pow(max(0.,crest2),6.)*energy*.30;
  float foam=exp(-rr*rr*13.)*(.3+.7*waterNoise(vPos.xz*14.+vec2(t*.9,-t*.8)));
  c=mix(c,vec3(.77,.93,1.),clamp(foam*.49,0.,.50));
  c+=vec3(.25,.47,.65)*(spec*.42+fres*.18);
} else if(kind>9.5&&kind<10.5){

  float rr=length(vPos.xz-vColor.xy);
  float fade=smoothstep(.02,.13,rr)*(1.0-smoothstep(.60,.80,rr));
  float flicker=.76+.24*sin(uTime*3.1*uAnimate+rr*29.0);
  c=vec3(.39,.78,.96)*(.68+.24*d+spec*.34)*flicker;
  outAlpha*=fade*smoothstep(.02,.18,vTankFill);
} else if((kind>1.5&&kind<2.5)||(kind>4.5&&kind<6.5)){
  vec2 uv=vPos.xz;
  float t=uTime*uAnimate;
  float wave=waterNoise(uv*1.5+vec2(t*.41,-t*.29));
  float caust=waterNoise(vec2(vPos.y*2.9-t*.85,vPos.x+vPos.z*.64));
  c=mix(vec3(.005,.095,.34),vec3(.018,.35,.74),clamp(.10+.72*wave+.30*caust,0.,1.));
  c+=vec3(.30,.68,.92)*pow(max(0.,caust-.51)*2.,2.)*.22;
  c+=vec3(.12,.29,.48)*fres*.24;
  if(kind>5.5){
    c+=vec3(.23,.60,.87)*(.12+wave*.23);
    c+=vec3(.61,.87,1.)*pow(max(dot(N,L),0.),3.)*.12;
  }
} else if(kind>2.5&&kind<3.5){
  float pulse=.88+.12*sin(uTime*1.7*uAnimate+vPos.x*.55+vPos.z*.35);
  c=vColor*(1.22+.58*pulse)+vec3(.08,.23,.10)*pulse;
} else if(kind>3.5&&kind<4.5){

  c=vec3(.12,.45,.56)*(.53+.18*d)+vec3(.55,.88,.98)*(fres*.92+spec*.45);
  c+=vec3(.08,.36,.44)*.15;
} else if(kind>6.5&&kind<7.5){
  vec2 turfUV=vPos.xz*.073;
  vec3 lawn=texture2D(uTurfTex,turfUV).rgb;
  c=lawn*(.80+.18*d+.08*d2);
} else if(kind>7.5&&kind<8.5){

  float rim=pow(1.0-max(dot(N,V),0.0),2.3);
  c=vColor*(.77+.19*d+.08*d2)+vec3(.15,.15,.16)*rim+.12*spec*vec3(1.0);
} else if(kind>10.5&&kind<11.5){
  vec2 pos=vPos.xz;
  float radius=length(pos);
  float woodland=smoothstep(68.0,104.0,radius);
  vec3 closeGrass=texture2D(uTurfTex,pos*.073).rgb;
  vec3 grassWide=texture2D(uTurfTex,pos*.024+vec2(.21,.57)).rgb;
  vec3 grass= mix(closeGrass,grassWide,smoothstep(27.0,100.0,radius)*.45);
  vec3 canopy=texture2D(uForestTex,pos*.018).rgb;
  vec3 canopyLarge=texture2D(uForestTex,pos*.0065+vec2(.26,.14)).rgb;
  float macro=noise2(pos*.018+vec2(17.1,8.2));
  float medium=noise2(pos*.072+vec2(-6.8,4.3));
  float slope=1.0-clamp(N.y,0.0,1.0);
  vec3 hillside=mix(canopy,canopyLarge,.19);
  hillside*=.87+.22*macro+.10*medium;
  float sparse=smoothstep(.58,.93,macro+medium*.12)*.19;
  hillside=mix(hillside,vec3(.23,.30,.16),sparse);
  vec3 rock=vec3(.33,.36,.30)*(.80+.23*medium);
  float rockCover=smoothstep(.43,.82,slope+.15*medium)*.27;
  hillside=mix(hillside,rock,rockCover);
  c=mix(grass,hillside,woodland);
  c*=.65+.34*d+.07*d2;
  float grassGlint=pow(max(dot(normalize(reflect(-L,N)),V),0.0),8.0)*.018;
  c+=vec3(.018,.028,.012)*grassGlint;
}
if((kind>3.5&&kind<4.5)||(kind>7.5&&kind<8.5)) c+=vec3(.08,.12,.14)*fres*(.60+.40*d);
{
  vec3 R=reflect(-V,N);
  if(kind>3.5&&kind<4.5){
    c=mix(c,mvSky(R)*.92,clamp(.04+fres*.30,0.0,.26)*(.35+.65*max(N.y,0.0)+.35*(1.0-abs(N.y))*(1.0-fres)));
    c+=vec3(1.0,.97,.90)*pow(max(dot(N,H),0.0),220.0)*1.15*mvSh;
  } else if((kind>1.5&&kind<2.5)||(kind>4.5&&kind<6.5)){
    c=mix(c,mvSky(R)*.80,clamp(fres*.30,0.0,.24));
    c+=vec3(1.0,.97,.90)*pow(max(dot(N,H),0.0),160.0)*.65*mvSh;
  } else if(kind>7.5&&kind<8.5){
    c+=mvSky(R)*fres*.10;
  }
  if(!((kind>.5&&kind<2.5)||(kind>2.5&&kind<3.5)||(kind>4.5&&kind<6.5)||(kind>8.5&&kind<10.5)||kind>11.5)) c*=1.0-(1.0-mvSh)*.34;
  if(uAOOn>.5 && N.y>.55 && vPos.y<.62 && (kind<.5||(kind>6.5&&kind<7.5)||(kind>10.5&&kind<11.5))) c*=mvContactAO();
}
c*=mix(vec3(1.0),vec3(.66,.72,.83),uEvening);
if(kind>11.5&&kind<12.5){
  c=vec3(.98,.77,.46);
  outAlpha=min(1.0,outAlpha*(1.0+2.6*uEvening));
}
c+=vColor*shine*.28*(1.0+uEvening*.82);
float dist=length(vPos-uCamera);
c=mix(c,mix(vec3(.37,.46,.48),vec3(.21,.27,.32),uEvening),clamp((dist-105.0)/155.0,0.,.10));
gl_FragColor=vec4(mvGrade(c),outAlpha);
}`;
  const fallbackVert = `
attribute vec3 aPos; attribute vec3 aNormal; attribute vec3 aColor; attribute vec4 aData;
uniform mat4 uVP; uniform float uTime; uniform float uLevels[14];
varying vec3 vNormal; varying vec3 vColor; varying vec3 vPos; varying vec4 vData;
float getLevel(float id){
  if(id < 0.5) return uLevels[0];
  if(id < 1.5) return uLevels[1];
  if(id < 2.5) return uLevels[2];
  if(id < 3.5) return uLevels[3];
  if(id < 4.5) return uLevels[4];
  if(id < 5.5) return uLevels[5];
  if(id < 6.5) return uLevels[6];
  if(id < 7.5) return uLevels[7];
  if(id < 8.5) return uLevels[8];
  if(id < 9.5) return uLevels[9];
  if(id < 10.5) return uLevels[10];
  if(id < 11.5) return uLevels[11];
  if(id < 12.5) return uLevels[12];
  return uLevels[13];
}
void main(){
  vec3 p=aPos;
  if(aData.z>4.5 && aData.z<6.5){

    float level=clamp(getLevel(aData.y),.0,.94);
    p.y=.52+(p.y-.52)*level;
    if(aData.z>5.5){
      p.y+=(.025*sin(aPos.x*3.0+uTime*.87)+.019*sin(aPos.z*3.9-uTime*.72))*level;
    }
  }
  vPos=p;vNormal=aNormal;vColor=aColor;vData=aData;gl_Position=uVP*vec4(p,1.0);
}`;
  const fallbackFrag = `
precision highp float;
varying vec3 vNormal; varying vec3 vColor; varying vec3 vPos; varying vec4 vData;
uniform vec3 uCamera; uniform float uTime; uniform float uAnimate; uniform float uEvening;
uniform sampler2D uTurfTex; uniform sampler2D uForestTex;
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise2(vec2 p){
  vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash2(i),hash2(i+vec2(1.,0.)),f.x),
    mix(hash2(i+vec2(0.,1.)),hash2(i+vec2(1.,1.)),f.x),f.y);
}
float waterNoise(vec2 p){
  float a=0.0;
  a+=0.54*noise2(p);
  a+=0.29*noise2(p*2.04+vec2(11.1,-7.2));
  a+=0.17*noise2(p*4.15+vec2(-3.2,8.4));
  return a;
}
vec3 mvUnifiedGrass(vec2 uv, vec3 N, vec3 L, vec3 V, float d, float d2){
  vec2 drift=vec2(
    noise2(uv*.045+vec2(8.7,-4.3))-.5,
    noise2(uv*.045+vec2(-6.2,11.5))-.5
  );
  uv += drift*2.4;
  float broad=noise2(uv*.065);
  float broad2=noise2(uv*.14+vec2(22.4,-7.6));
  float medium=noise2(uv*.42+vec2(-14.2,9.3));
  float fine=noise2(uv*2.4+vec2(4.3,17.9));
  float grain=noise2(uv*8.8+vec2(-8.6,5.4));
  float brushA=pow(abs(sin(uv.x*7.0+uv.y*3.0+medium*2.4)),8.0)*.35;
  float brushB=pow(abs(sin(uv.x*3.6-uv.y*6.4+fine*1.8)),10.0)*.18;
  float brush=clamp(brushA+brushB,0.,1.);
  float layout=clamp(broad*.46+broad2*.28+medium*.18+fine*.08,0.,1.);
  vec3 dark=vec3(.075,.18,.08);
  vec3 base=vec3(.135,.31,.12);
  vec3 mid=vec3(.205,.42,.17);
  vec3 soft=vec3(.295,.54,.23);
  vec3 shade=mix(dark,base,smoothstep(.08,.52,layout));
  shade=mix(shade,mid,smoothstep(.42,.78,layout));
  shade=mix(shade,soft,smoothstep(.78,.97,layout)*.55);
  shade += vec3(.030,.045,.018)*brush;
  float speck=pow(grain,2.6)*.06;
  shade -= vec3(.018,.014,.008)*speck;
  float wear=smoothstep(.70,.95,noise2(uv*.18+vec2(30.0,-18.0)))*.10;
  shade=mix(shade,shade*vec3(.96,.94,.88)+vec3(.01,.01,.005),wear);
  float sheen=pow(max(dot(normalize(reflect(-L,N)),V),0.0),6.0)*.05;
  float sun=.84+.16*d+.06*d2;
  return shade*sun + vec3(.03,.045,.02)*sheen;
}

void main(){
vec3 N=normalize(vNormal);vec3 L=normalize(vec3(-.42,.95,.56));vec3 L2=normalize(vec3(.7,.8,-.4));
float d=max(dot(N,L),0.0), d2=max(dot(N,L2),0.0);
vec3 V=normalize(uCamera-vPos), H=normalize(L+V);
float spec=pow(max(dot(N,H),0.0),29.0);
float fres=pow(1.0-max(dot(N,V),0.0),2.0);
float shine=vData.x, kind=vData.z;
vec3 c=vColor*(0.36+0.55*d+0.22*d2)+vec3(.65,.86,1.0)*spec*.35;
float outAlpha=vData.w;
if(kind>.5&&kind<1.5){

  float s=vData.y;
  float circumference=atan(N.z,N.y+.0001);
  float travel=s-uTime*2.25*uAnimate;
  float drift=waterNoise(vec2(travel*.58,circumference*.75+sin(travel*.21)));
  float eddy=waterNoise(vec2(travel*1.30+drift*2.2,circumference*1.3-uTime*.26*uAnimate));
  float fine=waterNoise(vec2(travel*3.55+eddy*1.6,circumference*2.0+drift*.8));
  float luma=clamp(.18+eddy*.83+fine*.25,0.,1.);
  vec3 deep=vec3(.012,.16,.41), aqua=vec3(.018,.43,.79), glassy=vec3(.45,.79,1.0);
  c=mix(deep,aqua,luma);
  c+=glassy*pow(smoothstep(.52,.91,fine+eddy*.17),2.4)*.44;
  c+=vec3(.34,.83,.98)*pow(smoothstep(.56,.83,drift),3.)*.21;
  float sheen=pow(max(dot(N,H),0.0),21.0);
  c+=vec3(.68,.94,1.)*(sheen*.27+fres*.22);
} else if((kind>1.5&&kind<2.5)||(kind>4.5&&kind<6.5)){

  vec2 p=vPos.xz;
  float wave=waterNoise(p*1.6+vec2(uTime*.65,-uTime*.42)*uAnimate);
  float caust=waterNoise(vec2(vPos.y*3.0-uTime*1.4*uAnimate,vPos.x+vPos.z*.7));
  c=mix(vec3(.008,.14,.38),vec3(.023,.46,.81),clamp(.22+.9*wave+.35*caust,0.,1.));
  c+=vec3(.45,.95,1.)*pow(max(0.,caust-.48)*2.0,2.)*.35;
  c+=vec3(.33,.74,.94)*fres*.18;
  if(kind>5.5){c+=vec3(.21,.57,.89)*(.28+wave*.23);c+=vec3(.64,.98,1.0)*pow(max(dot(N,L),0.0),3.0)*.20;}
} else if(kind>2.5&&kind<3.5){
  float pulse=.88+.12*sin(uTime*1.7*uAnimate+vPos.x*.55+vPos.z*.35);
  c=vColor*(1.22+.58*pulse)+vec3(.08,.23,.10)*pulse;
} else if(kind>3.5&&kind<4.5){

  c=vec3(.12,.45,.56)*(.53+.18*d)+vec3(.55,.88,.98)*(fres*.92+spec*.45);
  c+=vec3(.08,.36,.44)*.15;
} else if(kind>6.5&&kind<7.5){
  vec2 turfUV=vPos.xz*.073;
  vec3 lawn=texture2D(uTurfTex,turfUV).rgb;
  c=lawn*(.80+.18*d+.08*d2);
} else if(kind>7.5&&kind<8.5){

  float rim=pow(1.0-max(dot(N,V),0.0),2.3);
  c=vColor*(.77+.19*d+.08*d2)+vec3(.15,.15,.16)*rim+.12*spec*vec3(1.0);
} else if(kind>10.5&&kind<11.5){
  vec2 pos=vPos.xz;
  float radius=length(pos);
  float woodland=smoothstep(68.0,104.0,radius);
  vec3 closeGrass=texture2D(uTurfTex,pos*.073).rgb;
  vec3 grassWide=texture2D(uTurfTex,pos*.024+vec2(.21,.57)).rgb;
  vec3 grass= mix(closeGrass,grassWide,smoothstep(27.0,100.0,radius)*.45);
  vec3 canopy=texture2D(uForestTex,pos*.018).rgb;
  vec3 canopyLarge=texture2D(uForestTex,pos*.0065+vec2(.26,.14)).rgb;
  float macro=noise2(pos*.018+vec2(17.1,8.2));
  float medium=noise2(pos*.072+vec2(-6.8,4.3));
  float slope=1.0-clamp(N.y,0.0,1.0);
  vec3 hillside=mix(canopy,canopyLarge,.19);
  hillside*=.87+.22*macro+.10*medium;
  float sparse=smoothstep(.58,.93,macro+medium*.12)*.19;
  hillside=mix(hillside,vec3(.23,.30,.16),sparse);
  vec3 rock=vec3(.33,.36,.30)*(.80+.23*medium);
  float rockCover=smoothstep(.43,.82,slope+.15*medium)*.27;
  hillside=mix(hillside,rock,rockCover);
  c=mix(grass,hillside,woodland);
  c*=.65+.34*d+.07*d2;
  float grassGlint=pow(max(dot(normalize(reflect(-L,N)),V),0.0),8.0)*.018;
  c+=vec3(.018,.028,.012)*grassGlint;
}
if((kind>3.5&&kind<4.5)||(kind>7.5&&kind<8.5)) c+=vec3(.08,.12,.14)*fres*(.60+.40*d);
c*=mix(vec3(1.0),vec3(.66,.72,.83),uEvening);
if(kind>11.5&&kind<12.5){
  c=vec3(.98,.77,.46);
  outAlpha=min(1.0,outAlpha*(1.0+2.6*uEvening));
}
c+=vColor*shine*.28*(1.0+uEvening*.82);
float dist=length(vPos-uCamera);
c=mix(c,mix(vec3(.37,.46,.48),vec3(.21,.27,.32),uEvening),clamp((dist-105.0)/155.0,0.,.10));
gl_FragColor=vec4(c,outAlpha);
}`;
  function shader(type, source) { const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  let program;
  let enhancedWaterShader = true;
  function createProgram(vertexSource, fragmentSource) {
    const p = gl.createProgram();
    gl.attachShader(p, shader(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'Error al enlazar shaders');
    return p;
  }
  try {
    program = createProgram(vert, frag);
  } catch (e) {
    console.error('Error del shader de agua mejorada:', e);
    try {
      enhancedWaterShader = false;
      program = createProgram(fallbackVert, fallbackFrag);
      console.warn('Renderizador de agua de compatibilidad activado. El modelo 3D seguirá funcionando.');
    } catch (fallbackError) {
      console.error('Error del renderizador de compatibilidad:', fallbackError);
      const notice = document.getElementById('notice');
      notice.querySelector('.notice-title').textContent = 'Error del motor gráfico';
      notice.querySelector('.notice-text').textContent = 'El navegador no puede iniciar los shaders del modelo. Abre F12 > Consola para ver el error específico.';
      notice.style.display = 'block'; document.documentElement.classList.add('mv-scene-ready'); return;
    }
  }
  gl.useProgram(program);
  const loc = { pos: gl.getAttribLocation(program, 'aPos'), normal: gl.getAttribLocation(program, 'aNormal'), color: gl.getAttribLocation(program, 'aColor'), data: gl.getAttribLocation(program, 'aData'), vp: gl.getUniformLocation(program, 'uVP'), cam: gl.getUniformLocation(program, 'uCamera'), time: gl.getUniformLocation(program, 'uTime'), levels: gl.getUniformLocation(program, 'uLevels[0]'), anim: gl.getUniformLocation(program, 'uAnimate'), turf: gl.getUniformLocation(program, 'uTurfTex'), forest: gl.getUniformLocation(program, 'uForestTex'), evening: gl.getUniformLocation(program, 'uEvening') };
  function terrainRand(seed) {
    let value = seed >>> 0;
    return () => {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }
  function terrainTextureCanvas(type) {
    const size = 512;
    const terrainTextureScale = gl.getParameter(gl.MAX_TEXTURE_SIZE) >= 1024 && (typeof navigator.deviceMemory !== 'number' || navigator.deviceMemory >= 4) ? 2 : 1;
    const cv = document.createElement('canvas');
    cv.width = size * terrainTextureScale;
    cv.height = size * terrainTextureScale;
    const ctx = cv.getContext('2d', { alpha: false });
    ctx.scale(terrainTextureScale, terrainTextureScale);
    const rand = terrainRand(type === 'turf' ? 380144 : 709123);
    if (type === 'turf') {
      ctx.fillStyle = '#456c33';
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 3200; i++) {
        const x = rand() * size, y = rand() * size;
        const r = 2 + rand() * 21;
        ctx.fillStyle = ['rgba(29,64,24,.13)', 'rgba(109,137,61,.11)', 'rgba(80,119,46,.16)', 'rgba(35,74,27,.10)'][Math.floor(rand() * 4)];
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * (.35 + rand() * .5), rand() * 6.283, 0, 6.283);
        ctx.fill();
      }
      const colors = ['#355b28', '#6b9148', '#749b4b', '#294e22', '#89a453', '#4e752f', '#587d39', '#a2a36a'];
      ctx.lineCap = 'round';
      for (let i = 0; i < 37000; i++) {
        const x = rand() * size, y = rand() * size;
        const len = 1.7 + rand() * 6.0;
        const angle = -.90 + rand() * 1.8;
        ctx.strokeStyle = colors[Math.floor(rand() * colors.length)];
        ctx.globalAlpha = .28 + rand() * .52;
        ctx.lineWidth = .35 + rand() * .8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * len, y - Math.sin(angle) * len);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#1c381b';
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 1550; i++) {
        const x = rand() * size, y = rand() * size;
        const radius = 3.8 + rand() * 10.7;
        const dark = ['#142e19', '#20391d', '#294925', '#183923'][Math.floor(rand() * 4)];
        const crown = ['#2c5126', '#3e652d', '#355d2c', '#476d36', '#426936', '#254925', '#587942'][Math.floor(rand() * 7)];
        ctx.fillStyle = dark;
        ctx.beginPath(); ctx.ellipse(x + radius * .25, y + radius * .32, radius * 1.2, radius * .8, rand() * 3.14, 0, 6.283); ctx.fill();
        ctx.fillStyle = crown;
        ctx.beginPath(); ctx.ellipse(x, y, radius * (.68 + rand() * .47), radius * (.66 + rand() * .42), rand() * 3.14, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(132,170,87,.17)';
        ctx.beginPath(); ctx.ellipse(x - radius * .24, y - radius * .31, radius * .45, radius * .33, 0, 0, 6.283); ctx.fill();
      }
      ctx.fillStyle = 'rgba(12,38,17,.24)';
      for (let i = 0; i < 3000; i++) {
        const x = rand() * size, y = rand() * size;
        ctx.fillRect(x, y, 1 + rand() * 3, 1 + rand() * 3);
      }
    }
    return cv;
  }
  const terrainAnisotropy = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') || gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
  function makeTerrainTexture(canvas, unit) {
    const tex = gl.createTexture();
    gl.activeTexture(unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (terrainAnisotropy) gl.texParameterf(gl.TEXTURE_2D, terrainAnisotropy.TEXTURE_MAX_ANISOTROPY_EXT,
      Math.min(16, gl.getParameter(terrainAnisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    return tex;
  }
  const turfTexture = makeTerrainTexture(terrainTextureCanvas('turf'), gl.TEXTURE1);
  const forestTexture = makeTerrainTexture(terrainTextureCanvas('forest'), gl.TEXTURE2);
  gl.useProgram(program);
  gl.uniform1i(loc.turf, 1);
  gl.uniform1i(loc.forest, 2);
  /* ===== MV PRO: sombras del sol (shadow map), oclusión de contacto y reflejos ===== */
  const mvLoc = {
    lightVP: gl.getUniformLocation(program, 'uLightVP'), shadowMap: gl.getUniformLocation(program, 'uShadowMap'),
    shadowOn: gl.getUniformLocation(program, 'uShadowOn'), shadowTexel: gl.getUniformLocation(program, 'uShadowTexel'),
    tankAO: gl.getUniformLocation(program, 'uTankAO[0]'), aoOn: gl.getUniformLocation(program, 'uAOOn'),
    skyRefl: gl.getUniformLocation(program, 'uSkyRefl'), skyReflReady: gl.getUniformLocation(program, 'uSkyReflReady'),
    grade: gl.getUniformLocation(program, 'uProGrade')
  };
  if (mvLoc.shadowMap) gl.uniform1i(mvLoc.shadowMap, 3);
  if (mvLoc.skyRefl) gl.uniform1i(mvLoc.skyRefl, 4);
  if (mvLoc.grade) gl.uniform1f(mvLoc.grade, 1);
  let mvShadowDirty = true, mvShadowNext = 0, mvShadowTopView = null, mvAOReady = false;
  const mvShadow = (() => {
    if (!enhancedWaterShader || !mvLoc.lightVP || /[?&]sombras=0/i.test(location.search)) return null;
    const isGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    const depthExt = isGL2 ? null : gl.getExtension('WEBGL_depth_texture');
    if (!isGL2 && !depthExt) return null;
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const size = Math.min(maxTex, mvUltra ? 4096 : 2048);
    try {
      const depth = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, depth);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (isGL2) gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      const color = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, color);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, size, size);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth, 0);
      const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, null);
      if (!ok) return null;
      const sp = gl.createProgram();
      gl.attachShader(sp, shader(gl.VERTEX_SHADER, vert));
      gl.attachShader(sp, shader(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec4 vData;varying float vTankFill;void main(){float k=vData.z;if(vData.w<.10||(k>8.5&&k<10.5)||(k>.5&&k<1.5)||(k>2.5&&k<3.5)||(k>11.5))discard;if(((k>4.5&&k<6.5))&&vTankFill<.018)discard;gl_FragColor=vec4(1.0);}'));
      for (const [name, index] of [['aPos', loc.pos], ['aNormal', loc.normal], ['aColor', loc.color], ['aData', loc.data]]) if (index >= 0) gl.bindAttribLocation(sp, index, name);
      gl.linkProgram(sp);
      if (!gl.getProgramParameter(sp, gl.LINK_STATUS)) return null;
      const Ll = Math.hypot(-.42, .95, .56), L = [-.42 / Ll, .95 / Ll, .56 / Ll], center = [0, 0, 0], half = 47;
      const eye = [center[0] + L[0] * 160, center[1] + L[1] * 160, center[2] + L[2] * 160];
      const ortho = [1 / half, 0, 0, 0, 0, 1 / half, 0, 0, 0, 0, -2 / 319, 0, 0, 0, -321 / 319, 1];
      return {
        fbo, depth, size, lightVP: null, makeLightVP: () => new Float32Array(matMul(ortho, lookAt(eye, center, [0, 1, 0]))), program: sp,
        vp: gl.getUniformLocation(sp, 'uVP'), time: gl.getUniformLocation(sp, 'uTime'),
        levels: gl.getUniformLocation(sp, 'uLevels[0]'), anim: gl.getUniformLocation(sp, 'uAnimate'),
        lvp: gl.getUniformLocation(sp, 'uLightVP')
      };
    } catch (error) {
      console.warn('MTYV 3D: sombras no disponibles en este equipo:', error && error.message);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return null;
    }
  })();
  function mvRenderShadowMap(now, drawShadowCasters) {
    if (!mvShadow) return;
    if (!mvShadow.lightVP) mvShadow.lightVP = mvShadow.makeLightVP();
    const top = isTopViewMode();
    if (top !== mvShadowTopView) { mvShadowTopView = top; mvShadowDirty = true; }
    let levelKey = 0; for (let i = 0; i < levelsUniform.length; i++) levelKey += levelsUniform[i] * (i + 1);
    if (Math.abs(levelKey - mvShadowNext) > .0005) { mvShadowNext = levelKey; mvShadowDirty = true; }
    if (!mvShadowDirty) return;
    mvShadowDirty = false;
    gl.bindFramebuffer(gl.FRAMEBUFFER, mvShadow.fbo);
    gl.viewport(0, 0, mvShadow.size, mvShadow.size);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); gl.disable(gl.BLEND);
    gl.colorMask(false, false, false, false);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.6, 3.0);
    gl.useProgram(mvShadow.program);
    gl.uniformMatrix4fv(mvShadow.vp, false, mvShadow.lightVP);
    gl.uniformMatrix4fv(mvShadow.lvp, false, mvShadow.lightVP);
    gl.uniform1f(mvShadow.time, elapsed); gl.uniform1fv(mvShadow.levels, levelsUniform); gl.uniform1f(mvShadow.anim, 0);
    drawShadowCasters();
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.colorMask(true, true, true, true);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  function mvBindProUniforms() {
    if (!enhancedWaterShader) return;
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, mvShadow ? mvShadow.depth : null);
    gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, skyTexture);
    gl.activeTexture(gl.TEXTURE0);
    if (mvLoc.shadowOn) gl.uniform1f(mvLoc.shadowOn, mvShadow ? 1 : 0);
    if (mvShadow && mvShadow.lightVP) { gl.uniformMatrix4fv(mvLoc.lightVP, false, mvShadow.lightVP); gl.uniform2f(mvLoc.shadowTexel, 1 / mvShadow.size, 1 / mvShadow.size); }
    if (mvLoc.skyReflReady) gl.uniform1f(mvLoc.skyReflReady, skyReady ? 1 : 0);
    if (!mvAOReady && mvLoc.tankAO && tankLabels.length) {
      const ao = new Float32Array(56);
      tankLabels.slice(0, 14).forEach((p, i) => { ao[i * 4] = p.x; ao[i * 4 + 1] = p.z; ao[i * 4 + 2] = (p.radius || 1) * 1.04; });
      gl.uniform4fv(mvLoc.tankAO, ao); gl.uniform1f(mvLoc.aoOn, 1); mvAOReady = true;
    }
  }
  gl.activeTexture(gl.TEXTURE0);
  const skyVertex = `
attribute vec2 aSkyPosition;
varying vec2 vSkyNdc;
void main(){vSkyNdc=aSkyPosition;gl_Position=vec4(aSkyPosition,1.0,1.0);}`;
  const skyFragment = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vSkyNdc;
uniform sampler2D uSkyMap;
uniform vec3 uSkyForward;
uniform vec3 uSkyRight;
uniform vec3 uSkyUp;
uniform float uSkyAspect;
uniform float uSkySeconds;
uniform float uSkyReady;
uniform float uEvening;
uniform float uSkyProcedural;
float mvH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float mvN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mvH(i),mvH(i+vec2(1,0)),f.x),mix(mvH(i+vec2(0,1)),mvH(i+vec2(1,1)),f.x),f.y);}
float mvFbm(vec2 p){float a=.5,s=0.0;for(int i=0;i<5;i++){s+=a*mvN(p);p=p*2.03+vec2(17.3,-9.1);a*=.5;}return s;}
vec3 mvProceduralSky(vec3 d,float t,float ev){
  vec3 sunDir=normalize(vec3(-.42,.95,.56));
  vec3 sunEve=normalize(vec3(-.80,.10,.58));
  vec3 S=normalize(mix(sunDir,sunEve,ev));
  float y=max(d.y,0.0);
  float mu=max(dot(d,S),0.0);
  vec3 zen=mix(vec3(.16,.40,.80),vec3(.10,.14,.30),ev);
  vec3 hor=mix(vec3(.72,.83,.93),vec3(.95,.58,.36),ev);
  vec3 sky=mix(hor,zen,pow(y,.48));
  sky=mix(sky,hor*1.05,exp(-y*14.0)*.55);
  sky+=mix(vec3(1.0,.93,.80),vec3(1.0,.55,.25),ev)*(pow(mu,6.0)*.22+pow(mu,48.0)*.35);
  sky+=vec3(1.0,.96,.88)*smoothstep(.9994,.9998,mu)*3.0;
  vec2 uv=d.xz/(y+.085)*.55+vec2(t*.010,t*.004);
  float base=mvFbm(uv*1.15);
  float detail=mvFbm(uv*3.4+vec2(base*1.6,-t*.006));
  float cov=smoothstep(.50,.80,base*.78+detail*.32);
  float shade=mvFbm(uv*1.15+S.xz*.18)-base;
  vec3 lit=mix(vec3(1.0,.99,.97),vec3(1.0,.72,.50),ev);
  vec3 dark=mix(vec3(.58,.64,.74),vec3(.36,.30,.40),ev);
  vec3 cloud=mix(lit,dark,clamp(.45+shade*2.4+(1.0-detail)*.35,0.0,1.0));
  cloud+=lit*pow(mu,10.0)*.25;
  float fade=smoothstep(.0,.16,d.y);
  sky=mix(sky,cloud,cov*fade*.92);
  sky=mix(sky,hor*vec3(.94,.96,.98),exp(-max(d.y,0.0)*22.0)*.45);
  if(d.y<0.0) sky=mix(hor*.86,vec3(.36,.42,.40),clamp(-d.y*6.0,0.0,1.0));
  return sky;
}
void main(){
  vec3 direction=normalize(uSkyForward+uSkyRight*(vSkyNdc.x*uSkyAspect*.404026)+uSkyUp*(vSkyNdc.y*.404026));
  if(uSkyProcedural>.5){gl_FragColor=vec4(mvProceduralSky(direction,uSkySeconds,uEvening),1.0);return;}
  float azimuth=atan(direction.z,direction.x);
  float elevation=asin(clamp(direction.y,-1.0,1.0));
  vec2 uv=vec2(fract(azimuth*.1591549431+uSkySeconds*.00120),clamp(.27+elevation*.68,.008,.992));
  vec3 clearSky=mix(vec3(.76,.88,.95),vec3(.27,.56,.79),smoothstep(-.24,.82,direction.y));
  vec3 photoSky=texture2D(uSkyMap,uv).rgb;
  vec3 outputSky=mix(clearSky,photoSky,uSkyReady);
  vec3 duskSky=mix(outputSky*vec3(.53,.62,.77),mix(vec3(.35,.40,.48),vec3(.18,.30,.46),smoothstep(-.15,.70,direction.y)),.26);
  outputSky=mix(outputSky,duskSky,uEvening);
  gl_FragColor=vec4(outputSky,1.0);
}`;
  let skyProgram = null, skyTexture = null, skyBuffer = null, skyReady = false, skyAssetSettled = false, skyLoc = null;
  try {
    skyProgram = createProgram(skyVertex, skyFragment);
    skyLoc = {
      pos: gl.getAttribLocation(skyProgram, 'aSkyPosition'),
      map: gl.getUniformLocation(skyProgram, 'uSkyMap'),
      forward: gl.getUniformLocation(skyProgram, 'uSkyForward'),
      right: gl.getUniformLocation(skyProgram, 'uSkyRight'),
      up: gl.getUniformLocation(skyProgram, 'uSkyUp'),
      aspect: gl.getUniformLocation(skyProgram, 'uSkyAspect'),
      seconds: gl.getUniformLocation(skyProgram, 'uSkySeconds'),
      ready: gl.getUniformLocation(skyProgram, 'uSkyReady'),
      evening: gl.getUniformLocation(skyProgram, 'uEvening'),
      procedural: gl.getUniformLocation(skyProgram, 'uSkyProcedural')
    };
    skyBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, skyBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    skyTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, skyTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([170, 211, 238, 255]));
    const skyImage = new Image();
    skyImage.onload = () => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, skyTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      const maximumTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      let skySource = skyImage;
      if (maximumTextureSize < skyImage.width || maximumTextureSize < skyImage.height) {
        const skyWidth = Math.min(skyImage.width, Math.pow(2, Math.floor(Math.log2(maximumTextureSize))));
        const skyHeight = skyWidth / 2;
        const skyCanvas = document.createElement('canvas');
        skyCanvas.width = skyWidth;
        skyCanvas.height = skyHeight;
        skyCanvas.getContext('2d', { alpha: false }).drawImage(skyImage, 0, 0, skyWidth, skyHeight);
        skySource = skyCanvas;
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, skySource);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
      const skyAnisotropy = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
      if (skyAnisotropy) {
        gl.texParameterf(gl.TEXTURE_2D, skyAnisotropy.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(skyAnisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      }
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      skyReady = true;
      skyAssetSettled = true;
    };
    skyImage.onerror = () => { skyAssetSettled = true; console.warn('Cielo 4K no encontrado en /Telemetria/imagenes/cielo_monterrey_4k.jpg'); };
    skyImage.src = '/Telemetria/imagenes/cielo_monterrey_4k.jpg?v=90';
  } catch (skyError) {
    skyProgram = null;
    console.warn('Cielo dinámico no disponible:', skyError);
  }
  function renderSky(eye, target, seconds, aspect) {
    if (!skyProgram) return;
    const forward = norm(minus(target, eye));
    const right = norm(cross(forward, [0, 1, 0]));
    const up = norm(cross(right, forward));
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.depthMask(false);
    gl.useProgram(skyProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, skyBuffer);
    gl.enableVertexAttribArray(skyLoc.pos);
    gl.vertexAttribPointer(skyLoc.pos, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, skyTexture);
    gl.uniform1i(skyLoc.map, 0);
    gl.uniform3fv(skyLoc.forward, new Float32Array(forward));
    gl.uniform3fv(skyLoc.right, new Float32Array(right));
    gl.uniform3fv(skyLoc.up, new Float32Array(up));
    gl.uniform1f(skyLoc.aspect, aspect);
    gl.uniform1f(skyLoc.seconds, seconds);
    gl.uniform1f(skyLoc.ready, skyReady ? 1 : 0);
    gl.uniform1f(skyLoc.evening, eveningBlend);
    gl.uniform1f(skyLoc.procedural, mvSkyPhoto ? 0 : 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
  }
  const colorCache = {}; function rgb(h) { if (!colorCache[h]) { h = h.replace('#', ''); colorCache[h] = [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255] } return colorCache[h] }
  let A = [[], [], []];
  function vec(x, y, z) { return [x, y, z] }; const plus = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; const minus = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k]; const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; const norm = a => { const l = Math.hypot(...a) || 1; return mul(a, 1 / l) };
  function vertex(v, n, c, e = 0, s = 0, k = 0, a = 1) { const col = Array.isArray(c) ? c : rgb(c); return [...v, ...n, ...col, e, s, k, a] }
  function tri(group, v1, n1, v2, n2, v3, n3, c, e = 0, s = 0, k = 0, a = 1) { const out = A[group]; out.push(...vertex(v1, n1, c, e, s, k, a), ...vertex(v2, n2, c, e, s, k, a), ...vertex(v3, n3, c, e, s, k, a)); }
  function quad(g, a, b, c, d, n, col, emit = 0, kind = 0, alpha = 1) { tri(g, a, n, b, n, c, n, col, emit, 0, kind, alpha); tri(g, a, n, c, n, d, n, col, emit, 0, kind, alpha) }
  function box(cx, cy, cz, sx, sy, sz, col, g = 0, em = 0, alpha = 1) {
    const x = cx - sx / 2, X = cx + sx / 2, y = cy - sy / 2, Y = cy + sy / 2, z = cz - sz / 2, Z = cz + sz / 2;
    quad(g, [x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z], [0, 1, 0], col, em, 0, alpha); quad(g, [x, y, Z], [X, y, Z], [X, y, z], [x, y, z], [0, -1, 0], col, em, 0, alpha);
    quad(g, [x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z], [0, 0, 1], col, em, 0, alpha); quad(g, [X, y, z], [x, y, z], [x, Y, z], [X, Y, z], [0, 0, -1], col, em, 0, alpha);
    quad(g, [X, y, Z], [X, y, z], [X, Y, z], [X, Y, Z], [1, 0, 0], col, em, 0, alpha); quad(g, [x, y, z], [x, y, Z], [x, Y, Z], [x, Y, z], [-1, 0, 0], col, em, 0, alpha)
  }
  function cylinder(cx, cy, cz, r, h, col, opt = {}) {
    const g = opt.g || 0, n = opt.seg || 24, start = opt.start || 0, end = opt.end === undefined ? Math.PI * 2 : opt.end, em = opt.em || 0, alpha = opt.alpha === undefined ? 1 : opt.alpha, k = opt.kind || 0; const steps = Math.max(3, Math.round(n * (end - start) / (Math.PI * 2))); const bottom = cy - h / 2, top = cy + h / 2, levelId = opt.levelId === undefined ? cy : opt.levelId;
    for (let i = 0; i < steps; i++) {
      const a = start + (end - start) * i / steps, b = start + (end - start) * (i + 1) / steps; const n1 = [Math.cos(a), 0, Math.sin(a)], n2 = [Math.cos(b), 0, Math.sin(b)]; const p = [cx + r * n1[0], bottom, cz + r * n1[2]], q = [cx + r * n2[0], bottom, cz + r * n2[2]], P = [p[0], top, p[2]], Q = [q[0], top, q[2]]; tri(g, p, n1, q, n2, Q, n2, col, em, levelId, k, alpha); tri(g, p, n1, Q, n2, P, n1, col, em, levelId, k, alpha);
      if (opt.caps !== false) { const up = [0, 1, 0], down = [0, -1, 0]; tri(g, [cx, top, cz], up, P, up, Q, up, col, em, levelId, k, alpha); tri(g, [cx, bottom, cz], down, q, down, p, down, col, em, levelId, k, alpha) }
    }
  }
  function tube(points, r, col, opt = {}) {
    if (points.length < 2) return; const g = opt.g || 0, seg = opt.seg || 9, emit = opt.em || 0, alpha = opt.alpha === undefined ? 1 : opt.alpha, kind = opt.kind || 0, ph = opt.phase || 0; let distance = ph;
    let previous = null;
    for (let j = 0; j < points.length; j++) {
      const a = points[Math.max(0, j - 1)], b = points[Math.min(points.length - 1, j + 1)], t = norm(minus(b, a)); const ref = Math.abs(t[1]) > .90 ? [1, 0, 0] : [0, 1, 0]; const u = norm(cross(ref, t)), v = norm(cross(t, u)); const point = points[j];
      const ring = []; for (let i = 0; i <= seg; i++) { const theta = i / seg * Math.PI * 2; const d = plus(mul(u, Math.cos(theta)), mul(v, Math.sin(theta))); ring.push({ p: plus(point, mul(d, r)), n: d }); }
      if (previous) { const section = Math.hypot(...minus(points[j], points[j - 1])); for (let i = 0; i < seg; i++) { const a0 = previous.ring[i], a1 = previous.ring[i + 1], b0 = ring[i], b1 = ring[i + 1]; const out = A[g], c = rgb(col); out.push(...vertex(a0.p, a0.n, c, emit, distance - section, kind, alpha), ...vertex(a1.p, a1.n, c, emit, distance - section, kind, alpha), ...vertex(b1.p, b1.n, c, emit, distance, kind, alpha), ...vertex(a0.p, a0.n, c, emit, distance - section, kind, alpha), ...vertex(b1.p, b1.n, c, emit, distance, kind, alpha), ...vertex(b0.p, b0.n, c, emit, distance, kind, alpha)) } }
      previous = { ring }; if (j < points.length - 1) distance += Math.hypot(...minus(points[j + 1], points[j]));
    }
  }
  function tubeVariable(points, radii, col, opt = {}) {
    if (points.length < 2) return; const g = opt.g || 0, seg = opt.seg || 9, emit = opt.em || 0, alpha = opt.alpha === undefined ? 1 : opt.alpha, kind = opt.kind || 0, ph = opt.phase || 0; let distance = ph;
    let previous = null;
    const radiusAt = (j, t) => Array.isArray(radii) ? radii[Math.min(radii.length - 1, j)] : (typeof radii === 'function' ? radii(t, j) : radii);
    for (let j = 0; j < points.length; j++) {
      const a = points[Math.max(0, j - 1)], b = points[Math.min(points.length - 1, j + 1)], tang = norm(minus(b, a)); const ref = Math.abs(tang[1]) > .90 ? [1, 0, 0] : [0, 1, 0]; const u = norm(cross(ref, tang)), v = norm(cross(tang, u)); const point = points[j];
      const ring = []; const t = points.length <= 1 ? 0 : j / (points.length - 1); const rr = Math.max(.001, radiusAt(j, t));
      for (let i = 0; i <= seg; i++) { const theta = i / seg * Math.PI * 2; const d = plus(mul(u, Math.cos(theta)), mul(v, Math.sin(theta))); ring.push({ p: plus(point, mul(d, rr)), n: d }); }
      if (previous) { const section = Math.hypot(...minus(points[j], points[j - 1])); for (let i = 0; i < seg; i++) { const a0 = previous.ring[i], a1 = previous.ring[i + 1], b0 = ring[i], b1 = ring[i + 1]; const out = A[g], c = rgb(col); out.push(...vertex(a0.p, a0.n, c, emit, distance - section, kind, alpha), ...vertex(a1.p, a1.n, c, emit, distance - section, kind, alpha), ...vertex(b1.p, b1.n, c, emit, distance, kind, alpha), ...vertex(a0.p, a0.n, c, emit, distance - section, kind, alpha), ...vertex(b1.p, b1.n, c, emit, distance, kind, alpha), ...vertex(b0.p, b0.n, c, emit, distance, kind, alpha)) } }
      previous = { ring }; if (j < points.length - 1) distance += Math.hypot(...minus(points[j + 1], points[j]));
    }
  }
  function roundPath(points, r = .6) { if (points.length <= 2) return points; const out = [points[0]]; for (let i = 1; i < points.length - 1; i++) { const prev = points[i - 1], cur = points[i], next = points[i + 1]; const u = minus(prev, cur), v = minus(next, cur), lu = Math.hypot(...u), lv = Math.hypot(...v); if (lu < .02 || lv < .02) continue; const len = Math.min(r, lu * .32, lv * .32); const entry = plus(cur, mul(norm(u), len)), exit = plus(cur, mul(norm(v), len)); out.push(entry); for (let j = 1; j <= 6; j++) { const t = j / 6; out.push(plus(plus(mul(entry, (1 - t) * (1 - t)), mul(cur, 2 * (1 - t) * t)), mul(exit, t * t))) } } out.push(points[points.length - 1]); return out }
  function bar(a, b, r, c, opt = {}) { tube([a, b], r, c, opt) }
  function ring(cx, y, cz, r, col, w = .04, opt = {}) { const pts = []; for (let i = 0; i <= 44; i++) { const t = i / 44 * Math.PI * 2; pts.push([cx + Math.cos(t) * r, y, cz + Math.sin(t) * r]) } tube(pts, w, col, { seg: 5, ...opt }) }

  function tankFractionByName(name) {
    if (!name) return .45;
    const spec = tankSpecs.find(s => s.name === name);
    return spec ? Math.max(0, Math.min(1, Number(spec.fraction) || 0)) : .45;
  }
  function pipe(path, r = .30, meta = {}) {
    const pts = roundPath(path, .85);
    const src = tankFractionByName(meta.source);
    const dst = meta.target ? tankFractionByName(meta.target) : src;
    const peak = Math.max(src, dst), low = Math.min(src, dst);
    const innerAt = t => {
      const fill = src + (dst - src) * t;
      return r * (0.06 + 0.88 * Math.max(0, fill));
    };

    tube(pts, r + 0.105, '#a6b7c2', { seg: 18, g: 1, alpha: .22, em: .06, kind: 4 });
    tube(pts, r + 0.135, '#dfe7eb', { seg: 14, g: 1, alpha: .08, em: .05, kind: 4 });

    tube(pts, Math.max(r * .12, .035), '#6c7b84', { seg: 12, g: 1, alpha: peak < .03 ? .12 : .05, em: 0, kind: 4 });
    if (peak > .02) {
      tubeVariable(pts, t => innerAt(t), '#1475c4', { seg: 20, em: .09 + .11 * peak, kind: 1 });
      tubeVariable(pts, t => innerAt(t) * .72, '#4b9fe6', { seg: 15, g: 1, alpha: .10, em: .07 + .07 * peak, kind: 1, phase: 2.7 });
      tubeVariable(pts, t => innerAt(t) * 1.04, '#90cfff', { seg: 12, g: 2, alpha: .028 + .024 * peak, em: .04 + .06 * peak, kind: 4 });
    }
    for (let i = 1; i < path.length - 1; i++) {
      const p = path[i];
      if (i % 2 === 0) cylinder(p[0], p[1], p[2], r + .11, .12, '#738791', { em: .05, seg: 12 });
    }
  }
  function inletAtTank(x, z, name, r) {
    let bestDistance = 1e9, dx = .73, dz = .25;
    for (const def of pipeDefs) {
      const related = def.source === name || def.target === name;
      for (let i = 0; i < def.nodes.length - 1; i++) {
        const p = def.nodes[i], q = def.nodes[i + 1];
        for (const [near, far] of [[p, q], [q, p]]) {
          const distance = Math.hypot(near[0] - x, near[2] - z) + (related ? -3 : 0);
          if (distance < bestDistance) {
            bestDistance = distance;
            const dirX = far[0] - x, dirZ = far[2] - z;
            const len = Math.hypot(dirX, dirZ) || 1;
            dx = dirX / len; dz = dirZ / len;
          }
        }
      }
    }
    return [x + dx * r * .53, z + dz * r * .53];
  }
  function waterSurface(x, z, r, h, id, impact) {
    const spokes = 56, rings = 8, baseY = .52 + h;
    const packed = [impact[0], impact[1], .45];
    const n = [0, 1, 0];
    for (let ringNo = 0; ringNo < rings; ringNo++) {
      const inner = ringNo / rings * r, outer = (ringNo + 1) / rings * r;
      for (let i = 0; i < spokes; i++) {
        const a = i / spokes * Math.PI * 2, b = (i + 1) / spokes * Math.PI * 2;
        const a0 = [x + inner * Math.cos(a), baseY, z + inner * Math.sin(a)];
        const a1 = [x + inner * Math.cos(b), baseY, z + inner * Math.sin(b)];
        const b0 = [x + outer * Math.cos(a), baseY, z + outer * Math.sin(a)];
        const b1 = [x + outer * Math.cos(b), baseY, z + outer * Math.sin(b)];
        tri(0, a0, n, b0, n, b1, n, packed, 0, id, 9, 1);
        tri(0, a0, n, b1, n, a1, n, packed, 0, id, 9, 1);
      }
    }

    const ringCount = 3, steps = 56;
    for (let j = 0; j < ringCount; j++) {
      const rad = .13 + j * .23;
      for (let i = 0; i < steps; i++) {
        const a = i / steps * Math.PI * 2, b = (i + 1) / steps * Math.PI * 2;
        const inner = rad, outer = rad + .018;
        const a0 = [impact[0] + inner * Math.cos(a), baseY, impact[1] + inner * Math.sin(a)];
        const a1 = [impact[0] + inner * Math.cos(b), baseY, impact[1] + inner * Math.sin(b)];
        const b0 = [impact[0] + outer * Math.cos(a), baseY, impact[1] + outer * Math.sin(a)];
        const b1 = [impact[0] + outer * Math.cos(b), baseY, impact[1] + outer * Math.sin(b)];
        tri(1, a0, n, b0, n, b1, n, packed, .0, id, 10, .36);
        tri(1, a0, n, b1, n, a1, n, packed, .0, id, 10, .36);
      }
    }
  }
  function pad(x, z, size = 3.85) { box(x, .09, z, size, .17, size, '#29343c'); box(x, .195, z, size - .18, .055, size - .18, '#33444a'); box(x, .035, z, size + .24, .035, size + .24, '#b28d5b', 0, .18) }
  function tank(x, z, name, level, scale = 1) {
    const R = 1.32 * scale, H = 3.20 * scale, ty = .28; pad(x, z, 3.55 * scale);
    const id = tankSpecs.length - 1, maxWaterHeight = H * .90;

    cylinder(x, .31, z, R * 1.13, .18, '#667c88', { seg: 36 });
    cylinder(x, .43, z, R * .99, .07, '#2f5164', { seg: 36 });

    cylinder(x, .52 + maxWaterHeight / 2, z, R * .93, maxWaterHeight, '#0c4b99',
      { seg: 48, kind: 5, em: .88, caps: false, levelId: id });
    if (enhancedWaterShader) {
      waterSurface(x, z, R * .93, maxWaterHeight, id, inletAtTank(x, z, name, R));
    } else {
      cylinder(x, .52 + maxWaterHeight, z, R * .94, .045, '#559bde', { seg: 48, em: 1.15, kind: 6, levelId: id });
    }

    cylinder(x, .52 + H * .46, z, R * .965, H * .92, '#9da3aa',
      { seg: 48, g: 1, alpha: .51, em: .02, kind: 8, caps: false });
    cylinder(x, .52 + H * .46, z, R * .985, H * .92, '#c4c9ce',
      { seg: 48, g: 2, alpha: .065, em: .035, kind: 8, caps: false });


    const wallRadius = R * 1.32;
    const screenY = .58 + H * .48;
    const displayW = 1.68 * scale, displayH = 1.10 * scale;
    const surfaceGap = .074 * scale;
    const screenSurface = z + wallRadius + surfaceGap;

    const frameR = R * 1.04, yBase = .52, yTop = ty + H + .45;
    ring(x, yBase, z, frameR, '#cadde1', .077, { seg: 8, em: .16 });
    ring(x, yTop, z, frameR, '#e2ebee', .080, { seg: 8, em: .23 });
    ring(x, yBase + .15, z, frameR, '#536c7b', .038, { seg: 7, em: .07 });
    ring(x, yTop - .12, z, frameR, '#698899', .036, { seg: 7, em: .08 });

    for (let i = 0; i < 8; i++) {
      const ang = i * Math.PI / 4, xp = x + Math.cos(ang) * frameR, zp = z + Math.sin(ang) * frameR;
      const material = i % 2 === 0 ? '#d1e2e8' : '#789aab';
      bar([xp, yBase, zp], [xp, yTop, zp], .047, material, { seg: 8, em: i % 2 === 0 ? .11 : .04 });
      cylinder(xp, yTop, zp, .09, .11, '#e4eff3', { seg: 8 });
      cylinder(xp, yBase, zp, .083, .09, '#8ca8b7', { seg: 8 });
    }

    ring(x, ty + H * .23, z, frameR, '#a6c3d0', .021, { seg: 6, em: .07 });
    ring(x, ty + H * .53, z, frameR, '#597d8b', .025, { seg: 6, em: .05 });
    ring(x, ty + H * .77, z, frameR, '#a6c3d0', .021, { seg: 6, em: .07 });
    for (let i = 0; i < 8; i++) {
      const ang = i * Math.PI / 4 + Math.PI / 8;
      const cx = x + Math.cos(ang) * frameR, cz = z + Math.sin(ang) * frameR;
      cylinder(cx, ty + H * .23, cz, .036, .054, '#d7e7eb', { seg: 7, em: .06 });
      cylinder(cx, ty + H * .77, cz, .036, .054, '#d7e7eb', { seg: 7, em: .06 });
    }

    const gold = '#eebd54', zr = z - R - .15, lx = x - R * .62;
    bar([lx, .48, zr], [lx, yTop, zr], .049, gold, { seg: 8 });
    bar([lx + .39, .48, zr], [lx + .39, yTop, zr], .049, gold, { seg: 8 });
    for (let y = .65; y < yTop - .13; y += .32)bar([lx, y, zr], [lx + .39, y, zr], .037, gold, { seg: 7 });

    ring(x, .35, z, R * 1.24, '#94b6c2', .045, { seg: 6, em: .11 });
    return { x, y: yTop, z, name, baseY: .52, height: H, radius: R, levelId: id, screenY, screenZ: screenSurface, screenW: displayW, screenH: displayH, wallRadius, surfaceGap };
  }
  function orientedCylinder(a, b, r, col, opt = {}) {
    const d = minus(b, a), L = Math.hypot(...d); const t = norm(d); const ref = Math.abs(t[1]) > .93 ? [1, 0, 0] : [0, 1, 0], u = norm(cross(ref, t)), v = norm(cross(t, u)), S = opt.seg || 16; const g = opt.g || 0, em = opt.em || 0, alpha = opt.alpha === undefined ? 1 : opt.alpha;
    for (let i = 0; i < S; i++) { const theta = i / S * Math.PI * 2, beta = (i + 1) / S * Math.PI * 2; let n = plus(mul(u, Math.cos(theta)), mul(v, Math.sin(theta))), N = plus(mul(u, Math.cos(beta)), mul(v, Math.sin(beta))); const p = plus(a, mul(n, r)), q = plus(a, mul(N, r)), P = plus(b, mul(n, r)), Q = plus(b, mul(N, r)); tri(g, p, n, q, N, Q, N, col, em); tri(g, p, n, Q, N, P, n, col, em); if (opt.caps !== false) { tri(g, a, mul(t, -1), q, mul(t, -1), p, mul(t, -1), col, em); tri(g, b, t, P, t, Q, t, col, em) } }
  }
  function pumpUnit(x, z, count = 3) {
    const w = 2.25 + count * .85; box(x, .25, z, w, .28, 2.45, '#263c53'); box(x, .40, z, w - .18, .08, 2.22, '#46657b'); for (let i = 0; i < count; i++) {
      const xx = x - w / 2 + .92 + i * .98; orientedCylinder([xx - .42, .95, z], [xx + .42, .95, z], .39, '#24709a', { seg: 18, em: .15 }); orientedCylinder([xx + .38, .95, z], [xx + .65, .95, z], .26, '#91b3c7');
      for (let d = -.28; d < .3; d += .145)orientedCylinder([xx + d, .95, z], [xx + d + .035, .95, z], .405, '#143f60', { seg: 18 }); box(xx, .48, z, .32, .15, 1.03, '#8aa7ba')
    }
    bar([x - w / 2 + .4, 1.15, z + 1.12], [x + w / 2 - .4, 1.15, z + 1.12], .115, '#19b9e0', { em: .72 }); bar([x - w / 2 + .4, 1.15, z - 1.10], [x + w / 2 - .4, 1.15, z - 1.10], .10, '#169abf', { em: .65 });
    for (let i = 0; i < count; i++) { const xx = x - w / 2 + .92 + i * .98; bar([xx, .92, z + .45], [xx, 1.15, z + 1.12], .095, '#e1e5e8'); bar([xx, .92, z - .45], [xx, 1.15, z - 1.10], .095, '#a2c2d1') }
    box(x, .14, z, w + .20, .035, 2.65, '#0289bc', 0, .7);
  }

  function port(x, y, z, side = 1) { orientedCylinder([x - .18, y, z], [x + .18, y, z], .37, '#9fc6d7'); bar([x, y, z], [x + side * .45, y, z], .22, '#1ac7ea', { em: 1 }); }


  const grassBorder = [];
  const PLAY_HALF_W = 35.2, PLAY_HALF_D = 18.8;
  const siteRoadSegments = [
    [-33.1, -13.8, 33.1, -13.8, 1.35],
    [-33.1, 16.6, 33.1, 16.6, 1.35],
    [-33.1, -13.8, -33.1, 16.6, 1.35],
    [33.1, -13.8, 33.1, 16.6, 1.35]
  ];
  function distanceToSiteSegment(x, z, segment) {
    const vx = segment[2] - segment[0], vz = segment[3] - segment[1];
    const t = Math.max(0, Math.min(1, ((x - segment[0]) * vx + (z - segment[1]) * vz) / Math.max(.0001, vx * vx + vz * vz)));
    return Math.hypot(x - segment[0] - vx * t, z - segment[1] - vz * t);
  }
  function onSiteRoad(x, z, margin = 0) {
    return siteRoadSegments.some(segment => distanceToSiteSegment(x, z, segment) < segment[4] * .5 + margin);
  }

  let grassSeed = 193710;
  function grassRand() { grassSeed = (Math.imul(grassSeed, 1664525) + 1013904223) >>> 0; return grassSeed / 4294967296; }
  const grassPal = ['#355e2c', '#406f32', '#52813a', '#568d3b', '#648e43', '#7a9850', '#2c5627'];
  for (let i = 0; i < 9800; i++) {
    const x = -PLAY_HALF_W + grassRand() * (PLAY_HALF_W * 2);
    const z = -PLAY_HALF_D + grassRand() * (PLAY_HALF_D * 2);
    if (onSiteRoad(x, z, .16)) continue;
    const a = grassRand() * Math.PI * 2;
    const h = .034 + grassRand() * .080;
    const w = .022 + grassRand() * .032;
    const lean = .024 + grassRand() * .045;
    const p = [x, -.039, z];
    const vx = Math.cos(a), vz = Math.sin(a);
    const n = [vz, .28, -vx];
    const c = grassPal[Math.floor(grassRand() * grassPal.length)];
    tri(0, [x - vx * w, -.038, z - vz * w], n, [x + vx * w, -.038, z + vz * w], n,
      [x + vx * lean, -.038 + h, z + vz * lean], n, c);
  }


  const terrainNoise = (x, z) => {
    const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
    const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
    const hash = (a, b) => {
      const n = Math.sin(a * 127.1 + b * 311.7 + 19.7) * 43758.5453;
      return n - Math.floor(n);
    };
    const a = hash(ix, iz) * (1 - sx) + hash(ix + 1, iz) * sx;
    const b = hash(ix, iz + 1) * (1 - sx) + hash(ix + 1, iz + 1) * sx;
    return a * (1 - sz) + b * sz;
  };
  const smoothTerrain = (a, b, value) => {
    const t = Math.min(1, Math.max(0, (value - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const terrainHeight = (x, z) => {
    const radius = Math.hypot(x, z);
    const baseY = -.048;
    if (radius <= 68) return baseY;
    const angle = Math.atan2(z, x);
    const gradualSlope = smoothTerrain(68, 208, radius);
    const foothillSlope = smoothTerrain(74, 152, radius);
    const broadValley = terrainNoise(x * .012 + 12.7, z * .014 - 3.1);
    const roundedHills = terrainNoise(x * .026 - 6.2, z * .024 + 17.4);
    const subtleGround = terrainNoise(x * .073 + 2.3, z * .065 - 11.8);
    const silhouette = .85 + .13 * Math.sin(angle * 3 + .36) + .08 * Math.sin(angle * 5 - 1.24);
    const roundedRelief = 29.0 * gradualSlope * silhouette * (.86 + .22 * broadValley);
    const naturalFolds = 4.0 * foothillSlope * (.28 + .72 * roundedHills);
    const ridges = terrainNoise(x * .018 + 22.4, z * .021 - 9.2);
    const longRidges = Math.pow(Math.abs(Math.sin(x * .027 + z * .011 + ridges * 3.0)), 2.5);
    const ridgeLift = 6.3 * gradualSlope * longRidges * (.42 + .58 * roundedHills);
    const localTexture = 1.75 * gradualSlope * (subtleGround - .5);
    return baseY + roundedRelief + naturalFolds + ridgeLift + localTexture;
  };
  const terrainNormal = (x, z) => {
    const step = 1.65;
    return norm([terrainHeight(x - step, z) - terrainHeight(x + step, z), 2 * step,
    terrainHeight(x, z - step) - terrainHeight(x, z + step)]);
  };
  const terrainPoint = (x, z) => [x, terrainHeight(x, z), z];
  const terrainColor = (x, z, height) => {
    const moss = terrainNoise(x * .045 + 11, z * .043 - 4);
    const dry = terrainNoise(x * .11 - 14, z * .10 + 21);
    const altitude = smoothTerrain(15, 38, height);
    return [.13 + .09 * moss + .042 * dry + .032 * altitude,
    .29 + .12 * moss - .025 * altitude + .018 * dry,
    .11 + .052 * moss + .004 * altitude];
  };
  const terrainWidth = 520, terrainDepth = 440, terrainStepsX = 160, terrainStepsZ = 136;
  const terrainDX = terrainWidth / terrainStepsX, terrainDZ = terrainDepth / terrainStepsZ;
  const terrainGrid = [];
  for (let iz = 0; iz <= terrainStepsZ; iz++) {
    const z = -terrainDepth * .5 + iz * terrainDZ;
    const row = [];
    for (let ix = 0; ix <= terrainStepsX; ix++) {
      const x = -terrainWidth * .5 + ix * terrainDX;
      const p = terrainPoint(x, z);
      row.push({ p, n: terrainNormal(x, z), c: terrainColor(x, z, p[1]) });
    }
    terrainGrid.push(row);
  }
  const terrainTri = (a, b, c) => {
    const out = A[0];
    out.push(...vertex(a.p, a.n, a.c, 0, 0, 11, 1),
      ...vertex(b.p, b.n, b.c, 0, 0, 11, 1),
      ...vertex(c.p, c.n, c.c, 0, 0, 11, 1));
  };
  for (let iz = 0; iz < terrainStepsZ; iz++) {
    for (let ix = 0; ix < terrainStepsX; ix++) {
      const x = -terrainWidth * .5 + (ix + .5) * terrainDX;
      const z = -terrainDepth * .5 + (iz + .5) * terrainDZ;
      const a = terrainGrid[iz][ix];
      const b = terrainGrid[iz][ix + 1];
      const c = terrainGrid[iz + 1][ix + 1];
      const d = terrainGrid[iz + 1][ix];
      terrainTri(a, d, c);
      terrainTri(a, c, b);
    }
  }

  let forestSeed = 781353;
  function forestRandom() {
    forestSeed = (Math.imul(forestSeed, 1664525) + 1013904223) >>> 0;
    return forestSeed / 4294967296;
  }
  const forestColors = ['#214622', '#2b5428', '#38632d', '#426b32', '#315a29', '#4a7034', '#254b24'];
  for (let i = 0; i < 2450; i++) {
    const angle = forestRandom() * Math.PI * 2;
    const radius = 94 + Math.sqrt(forestRandom()) * 150;
    const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
    const ground = terrainHeight(x, z);
    if (ground < 2.0) continue;
    const scale = .62 + forestRandom() * 1.08;
    const crownY = ground + .55 * scale;
    const crownH = (1.2 + forestRandom() * .45) * scale;
    const width = (.68 + forestRandom() * .46) * scale;
    const top = [x, crownY + crownH, z];
    const bottom = [x, crownY - .16 * scale, z];
    const palette = forestColors[Math.floor(forestRandom() * forestColors.length)];
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3, b = (k + 1) * Math.PI / 3;
      const ra = width * (.82 + .16 * Math.sin(k * 2.3 + i * .7));
      const rb = width * (.82 + .16 * Math.sin((k + 1) * 2.3 + i * .7));
      const pa = [x + Math.cos(a) * ra, crownY, z + Math.sin(a) * ra];
      const pb = [x + Math.cos(b) * rb, crownY, z + Math.sin(b) * rb];
      const normal = norm([Math.cos((a + b) * .5), .45, Math.sin((a + b) * .5)]);
      tri(0, pa, normal, pb, normal, top, normal, palette);
      tri(0, pb, normal, pa, normal, bottom, normal, palette);
    }
  }

  const yy = 1.02;
  const mapX = px => (px - 768) / 25;
  const mapZ = py => (py - 540) / 24.5;
  function at(px, py) { return [mapX(px), yy, mapZ(py)]; }
  const pipeDefs = [];
  function pipeDiagram(nodes, r = .30, meta = {}) { pipeDefs.push({ nodes: nodes.map(([px, py]) => at(px, py)), r, ...meta }); }

  pipeDiagram([[204, 337], [385, 337]], .30, { source: 'FRAILE 4', target: 'FRAILE 5' });
  pipeDiagram([[385, 337], [383, 381], [480, 427]], .30, { source: 'FRAILE 4', target: 'FRAILE 3' });
  pipeDiagram([[76, 522], [215, 522], [350, 522], [480, 522], [639, 522], [690, 465], [701, 419]], .30, { source: 'FRAILE 1', target: 'FRAILE 2' });
  pipeDiagram([[480, 427], [480, 522]], .30, { source: 'FRAILE 3', target: 'FRAILE 1' });
  pipeDiagram([[215, 522], [266, 584], [378, 584]], .30, { source: 'FRAILE 1', target: 'ALIANZA REAL' });
  pipeDiagram([[701, 419], [976, 438], [1311, 438]], .30, { source: 'FRAILE 2', target: 'GARCÍA 2' });
  pipeDiagram([[1250, 310], [1250, 361], [1275, 415], [1311, 438]], .30, { source: 'LA CRUZ', target: 'GARCÍA 2' });
  pipeDiagram([[701, 419], [716, 479], [755, 479]], .30, { source: 'FRAILE 2' });
  pipeDiagram([[976, 438], [1014, 491], [1105, 491]], .30, { source: 'GARCÍA 1' });
  pipeDiagram([[1311, 438], [1311, 486], [1365, 535], [1426, 535]], .30, { source: 'GARCÍA 2' });

  pipeDiagram([[215, 522], [75, 522], [22, 677], [22, 704], [88, 722], [258, 727]], .30, { source: 'ALIANZA REAL', target: 'FRAILE 1' });
  pipeDiagram([[258, 727], [400, 739], [602, 752], [785, 752], [944, 752]], .30, { source: 'ALIANZA REAL', target: 'RECTANGULAR' });
  pipeDiagram([[390, 737], [327, 797], [350, 824], [507, 855]], .30, { source: 'ALIANZA REAL', target: 'NUEVA CASTILLA 1' });
  pipeDiagram([[153, 846], [209, 846], [258, 785], [258, 727]], .30, { source: 'NUEVA CASTILLA 1', target: 'ALIANZA REAL' });
  pipeDiagram([[943, 752], [837, 666], [827, 645], [893, 580]], .30, { source: 'RECTANGULAR' });
  pipeDiagram([[944, 752], [1036, 700], [1086, 685]], .30, { source: 'RECTANGULAR', target: 'CIRCULAR' });
  pipeDiagram([[1086, 685], [1187, 628], [1257, 590]], .30, { source: 'CIRCULAR' });
  pipeDiagram([[944, 752], [1029, 790], [1110, 819], [1198, 850]], .30, { source: 'RECTANGULAR', target: 'SANTA ROSA 2' });
  pipeDiagram([[1198, 850], [1314, 770], [1411, 694]], .30, { source: 'SANTA ROSA 2' });
  pipeDiagram([[1198, 850], [1525, 850]], .30, { source: 'SANTA ROSA 2' });

  const tankLabels = [];
  const tankSpecs = [];
  function tankDiagram(px, py, name, water, scale = 1.20) {
    tankSpecs.push({ name, baseFraction: water, fraction: water, meters: 0, delta: 0, capacityMeters: 8 });
    tankLabels.push(tank(mapX(px), mapZ(py), name, water, scale));
  }
  tankDiagram(205, 334, 'FRAILE 5', .53);
  tankDiagram(385, 335, 'FRAILE 4', .49);
  tankDiagram(480, 426, 'FRAILE 3', .25, 1.14);
  tankDiagram(217, 508, 'FRAILE 1', .76, 1.22);
  tankDiagram(701, 414, 'FRAILE 2', .62, 1.20);
  tankDiagram(976, 413, 'GARCÍA 1', .71, 1.20);
  tankDiagram(1250, 310, 'LA CRUZ', .45, 1.18);
  tankDiagram(1311, 439, 'GARCÍA 2', .63, 1.20);
  tankDiagram(258, 724, 'ALIANZA REAL', .78, 1.22);
  tankDiagram(602, 743, 'NUEVA CASTILLA / AMP', .62, 1.22);
  tankDiagram(507, 849, 'NUEVA CASTILLA 1', .21, 1.14);
  tankDiagram(943, 749, 'RECTANGULAR', .56, 1.21);
  tankDiagram(1086, 692, 'CIRCULAR', .74, 1.19);
  tankDiagram(1198, 845, 'SANTA ROSA 2', .49, 1.21);

  function siteRoad(segment) {
    const [x1, z1, x2, z2, width] = segment;
    const horizontal = Math.abs(x2 - x1) >= Math.abs(z2 - z1);
    const length = Math.hypot(x2 - x1, z2 - z1);
    const centerX = (x1 + x2) * .5, centerZ = (z1 + z2) * .5;
    box(centerX, -.031, centerZ, horizontal ? length + width : width, .092, horizontal ? width : length + width, '#626d68');
    box(centerX, .018, centerZ, horizontal ? length + width : width - .14, .018, horizontal ? width - .14 : length + width, '#394b49');
    const edge = width * .5 - .035;
    for (const sign of [-1, 1]) {
      box(centerX + (horizontal ? 0 : sign * edge), .037, centerZ + (horizontal ? sign * edge : 0), horizontal ? length : .055, .026, horizontal ? .055 : length, '#abb5ae');
    }
  }
  function siteGlow(x, z, radius, alpha) {
    const center = [x, .040, z];
    const normal = [0, 1, 0];
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const a = i / steps * Math.PI * 2, b = (i + 1) / steps * Math.PI * 2;
      tri(2, center, normal,
        [x + Math.cos(a) * radius, center[1], z + Math.sin(a) * radius], normal,
        [x + Math.cos(b) * radius, center[1], z + Math.sin(b) * radius], normal,
        '#ffe0a0', .34, 0, 12, alpha);
    }
  }
  function siteLamp(x, z) {
    for (const p of tankLabels) {
      if (Math.hypot(x - p.x, z - p.z) < p.radius + 2.1) return;
    }
    for (const group of pumpGroups) {
      if (group.coords.some(position => Math.hypot(x - position[0], z - position[1]) < 1.15)) return;
    }
    box(x, .010, z, .38, .060, .38, '#9ca59d');
    cylinder(x, .105, z, .11, .16, '#243b40', { seg: 9 });
    cylinder(x, .565, z, .047, .83, '#3d5357', { seg: 9 });
    box(x, 1.005, z, .19, .06, .19, '#35484b');
    box(x, 1.102, z, .235, .155, .235, '#ffe4a2', 0, 1.45);
    box(x, 1.19, z, .28, .05, .28, '#263b43');
    box(x, 1.098, z, .34, .23, .34, '#fff3c4', 1, .78, .17);
    siteGlow(x, z, .70, .055);
    siteGlow(x, z, 1.15, .018);
  }
  function siteTankFloorLights(p) {
    const offset = p.radius * 1.07;
    for (const xSign of [-1, 1]) for (const zSign of [-1, 1]) {
      const x = p.x + xSign * offset, z = p.z + zSign * offset;
      cylinder(x, .237, z, .095, .022, '#ffe3a3', { seg: 10, em: 1.20 });
      cylinder(x, .228, z, .135, .013, '#9d9e91', { seg: 10, em: .08 });
    }
  }
  function buildSiteEnvironment() {
    for (const segment of siteRoadSegments) siteRoad(segment);
    for (let x = -28; x <= 29; x += 7.9) {
      siteLamp(x, -12.56);
      siteLamp(x, 15.36);
    }
    for (let z = -8.5; z <= 12.5; z += 7.0) {
      siteLamp(-31.95, z);
      siteLamp(31.95, z);
    }
    for (const p of tankLabels) siteTankFloorLights(p);
  }
  const realCapacityCm = {
    'FRAILE 5': 750, 'FRAILE 4': 750, 'FRAILE 3': 750, 'FRAILE 1': 750,
    'FRAILE 2': 750, 'GARCÍA 1': 850, 'LA CRUZ': 500, 'GARCÍA 2': 750,
    'ALIANZA REAL': 750, 'NUEVA CASTILLA / AMP': 730, 'NUEVA CASTILLA 1': 600,
    'RECTANGULAR': 750, 'CIRCULAR': 750, 'SANTA ROSA 2': 450
  };
  tankSpecs.forEach(spec => {
    spec.meters = null; spec.delta = null; spec.state = 'sin_datos';
    spec.capacityMeters = realCapacityCm[spec.name] / 100;
    spec.baseFraction = 0; spec.fraction = 0;
  });


  function pumpsDiagram(name, pxPositions, states) {
    if (pxPositions.length !== states.length) throw new Error('Conteo de bombas incoherente: ' + name);
    return { name, coords: pxPositions.map(([px, py]) => [mapX(px), mapZ(py)]), active: states };
  }
  const pumpGroups = [
    pumpsDiagram('FRAILE 1 → FRAILE 3', [[280, 522], [300, 522], [321, 522], [342, 522]], [false, true, true, true]),
    pumpsDiagram('BOMB. REAL DE MINAS', [[354, 584]], [true]),
    pumpsDiagram('FRAILE 2 → GARCÍA 1', [[831, 428], [851, 430], [873, 431], [894, 432]], [true, true, true, false]),
    pumpsDiagram('GARCÍA 1 → GARCÍA 2', [[1088, 438], [1109, 438], [1130, 438], [1151, 438]], [true, true, true, false]),
    pumpsDiagram('ENTRADA ALIANZA REAL', [[84, 720], [103, 723], [125, 725], [146, 726], [166, 727]], [true, true, true, false, false]),
    pumpsDiagram('ALIANZA REAL → NUEVA CASTILLA AMP', [[345, 735], [366, 738], [387, 740], [408, 742], [429, 744], [450, 745]], [false, false, true, true, true, true]),
    pumpsDiagram('NUEVA CASTILLA AMP → RECTANGULAR', [[684, 752], [706, 752], [728, 752], [750, 752], [772, 752], [792, 752]], [true, true, false, true, true, false]),
    pumpsDiagram('RECTANGULAR → SANTA ROSA 2', [[1022, 787], [1044, 796], [1065, 803], [1087, 811], [1108, 819], [1129, 828]], [true, true, true, true, true, true]),
    pumpsDiagram('BOMB. MITRAS PONIENTE', [[155, 846], [177, 846]], [false, true])
  ];
  buildSiteEnvironment();

  function flowDiagram(name, lps, px, py, dx = 0, dy = 0) { return { name, lps, x: mapX(px), z: mapZ(py), dx, dy }; }
  const flowReadings = [
    flowDiagram('SALIDA', null, 391, 499, 0, -17),
    flowDiagram('LLEGADA', null, 598, 495, 0, -17),
    flowDiagram('SALIDA A RED', null, 752, 492, 5, 18),
    flowDiagram('SALIDA A RED', null, 1153, 489, 0, 1),
    flowDiagram('SALIDA A RED', null, 1450, 531, -15, 2),
    flowDiagram('SALIDA', null, 126, 746, 0, 24),
    flowDiagram('SALIDA', null, 454, 756, 0, 25),
    flowDiagram('SALIDA', null, 752, 776, 0, 27),
    flowDiagram('RED A ZUAZUA', null, 915, 574, 7, -16),
    flowDiagram('RED A CIÉNEGA DE FLORES', null, 1300, 598, -7, -17),
    flowDiagram('RED A PESQUERÍA', null, 1420, 698, 0, -16),
    flowDiagram('SALIDA', null, 1017, 826, 0, 25),
    flowDiagram('LLEGADA', null, 1360, 831, 0, -16),
    flowDiagram('DERIVACIONES', null, 1418, 856, 0, 45),
    flowDiagram('SALIDA PPSR', null, 1500, 814, -35, 7)
  ];

  const backendFlowKeys = ["fraile1_salida", "fraile2_llegada", "fraile2_salida_red", "garcia1_red", "garcia2_red", "alianza_fraile1", "castilla_amp_alianza", "castilla3_amp", "zuazua", "cienega", "pesqueria", "santarosa_castilla3", "santarosa_llegada", "derivaciones", "monterreyv_salida"];
  const flowLegends = ["SALIDA FRAILE 1", "LLEGADA A FRAILE 2", "SALIDA A RED FRAILE 2", "GASTO GARCIA 1 A RED 24", "GASTO GARCIA 2 A RED 24", "GASTO ALIANZA REAL A FRAILE 1", "GASTO NUEVA CASTILLA I AMP A ALIANZA REAL", "GASTO NUEVA CASTILLA III A NUEVA CASTILLA I AMP", "NUEVA CASTILLA III A RED ZUAZUA", "NUEVA CASTILLA III A RED CIENEGA DE FLORES", "GASTO SANTA ROSA II A RED PESQUERIA", "GASTO SANTA ROSA II A NUEVA CASTILLA III", "GASTO DE LLEGADA A SANTA ROSA II", "DERIVACIONES", "FLUJO A MONTERREY V"];
  const flowFallbackKeys = {
    2: ["fraile2_red", "fraile2_salida_a_red", "salida_fraile2_red"],
    5: ["alianza_salida", "alianza_real_salida", "alianza_flujo", "alianza_real_fraile1"]
  };
  flowReadings.forEach((f, i) => { f.backendKey = backendFlowKeys[i]; f.legend = flowLegends[i]; f.fallbackKeys = flowFallbackKeys[i] || []; f.lps = null; f.connection = 'sin_datos'; });

  for (const f of flowReadings) {
    const sx = f.x + (f.dx || 0) / 25, sz = f.z + (f.dy || 0) / 24.5;
    cylinder(sx, .065, sz, .20, .09, '#3c4c43', { seg: 10 });
    bar([sx, .10, sz], [sx, .38, sz], .045, '#9fb4bb', { seg: 8, em: .05 });
    cylinder(sx, .37, sz, .078, .055, '#cedfe2', { seg: 10 });
  }

  function pump3D(x, z, active, ordinal) {
    const chrome = '#b9ccd7', silver = '#7d9aab', edge = '#d8e8ed', steel = '#476173', dark = '#172839';
    const light = active ? '#4afe59' : '#8696a5', lightBright = active ? '#81ff74' : '#a8b8c7';
    const core = active ? '#2bbb37' : '#516477';

    box(x, 1.35, z, .82, .13, .75, '#0b2236');
    box(x, 1.425, z, .76, .065, .68, '#617c8e');
    box(x, 1.47, z, .64, .052, .57, '#152b3d');
    for (const dx of [-.31, .31]) for (const dz of [-.26, .26]) {
      cylinder(x + dx, 1.51, z + dz, .036, .055, '#d3e2e8', { seg: 8 });
    }

    cylinder(x, 1.62, z, .29, .29, '#2f4356', { seg: 20 });
    cylinder(x, 1.70, z, .315, .065, silver, { seg: 20 });
    cylinder(x, 1.92, z, .32, .42, '#6e8798', { seg: 24 });
    cylinder(x, 1.78, z, .337, .055, '#1d2b38', { seg: 20 });
    cylinder(x, 2.06, z, .338, .065, '#253745', { seg: 20 });
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      const x1 = x + .325 * Math.cos(a), z1 = z + .325 * Math.sin(a);
      box(x1, 1.94, z1, .044, .20, .042, '#2e4352');
    }

    cylinder(x, 2.21, z, .355, .13, '#9fb6c3', { seg: 26 });
    cylinder(x, 2.27, z, .365, .06, dark, { seg: 26 });
    cylinder(x, 2.59, z, .316, .57, core, { seg: 26, em: active ? .45 : .03, kind: active ? 3 : 0 });
    cylinder(x, 2.60, z, .323, .565, light, { seg: 26, g: 1, alpha: active ? .26 : .12, em: active ? .48 : .08 });
    cylinder(x, 2.59, z, .365, .62, light, { seg: 16, g: 2, alpha: active ? .085 : .015, em: active ? 1.1 : 0.08 });

    for (let i = 0; i < 8; i++) {
      const a = (i + .35) * Math.PI / 4;
      bar([x + Math.cos(a) * .333, 2.35, z + Math.sin(a) * .333],
        [x + Math.cos(a) * .333, 2.83, z + Math.sin(a) * .333], .023,
        active ? '#9aff75' : '#9baebb', { em: active ? 1.9 : .14 });
    }
    cylinder(x, 2.94, z, .365, .095, '#283c4b', { seg: 24 });
    cylinder(x, 3.06, z, .385, .21, chrome, { seg: 26 });
    cylinder(x, 3.185, z, .355, .07, '#243947', { seg: 24 });
    cylinder(x, 3.28, z, .33, .16, '#b6cbd5', { seg: 24 });
    cylinder(x, 3.39, z, .257, .075, edge, { seg: 24 });
    cylinder(x, 3.435, z, .19, .038, '#354c5c', { seg: 20 });

    ring(x, 3.465, z, .213, active ? '#3c9f65' : '#75848e', .030, { em: active ? .28 : .04, seg: 12 });
    cylinder(x, 3.468, z, .132, .024, '#99aeb9', { seg: 20 });
    cylinder(x, 3.485, z, .078, .017, '#253d4b', { seg: 16 });
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      bar([x + Math.cos(a) * .09, 3.504, z + Math.sin(a) * .09],
        [x + Math.cos(a) * .135, 3.504, z + Math.sin(a) * .135], .015, '#556b77', { seg: 6 });
    }

    box(x + .30, 2.10, z + .18, .24, .40, .33, '#263646');
    box(x + .39, 2.11, z + .18, .14, .32, .27, '#a2b7c3');
    box(x + .465, 2.11, z + .18, .028, .22, .17, '#475b67');
    box(x + .485, 2.175, z + .18, .025, .055, .095, light, 0, active ? 1.3 : .1);
    box(x, 1.84, z + .336, .18, .24, .035, '#152838');
    for (let i = 0; i < 4; i++)box(x, 1.76 + i * .047, z + .357, .12, .020, .012, active ? '#50e361' : '#6b8293', 0, active ? 1.2 : .05);

    for (const side of [-1, 1]) {
      tube([[x + side * .32, 3.04, z], [x + side * .49, 3.04, z],
      [x + side * .57, 2.97, z], [x + side * .57, 2.87, z]], .067, '#b3c9d4', { seg: 8, em: .05 });
      orientedCylinder([x + side * .28, 3.04, z], [x + side * .34, 3.04, z], .10, '#40596b', { seg: 12 });
    }

    ring(x, 2.27, z, .359, active ? '#62fe6d' : '#a1b3be', .033, { em: active ? 1.25 : .17, seg: 5 });
    ring(x, 2.90, z, .362, active ? '#62ff73' : '#afbdc4', .033, { em: active ? 1.25 : .16, seg: 5 });
    ring(x, 1.495, z, .43, active ? '#34d761' : '#5a8099', .027, { em: active ? .75 : .08, seg: 5 });

    if (active) cylinder(x, 2.57, z, .40, .48, '#53fa56', { seg: 20, g: 2, alpha: .03, em: 1.1, caps: false });
  }

  const pumpMeshes = [];

  function pumpTopGeometry(mesh, x, z) {
    return mesh.map(group => {
      const vertices = new Float32Array(group);
      for (let k = 0; k < vertices.length; k += 13) {
        vertices[k] = x + (vertices[k] - x) * 1.03;
        vertices[k + 1] = 1.35 + (vertices[k + 1] - 1.35) * 1.30;
        vertices[k + 2] = z + (vertices[k + 2] - z) * 1.03;
      }
      return vertices;
    });
  }
  function makePumpMesh(x, z, active, ordinal) {
    const initialLengths = A.map(arr => arr.length);
    pump3D(x, z, active, ordinal);
    const mesh = [];
    for (let g = 0; g < 3; g++) {
      mesh.push(new Float32Array(A[g].slice(initialLengths[g])));
      A[g].length = initialLengths[g];
    }
    return mesh;
  }

  for (const group of pumpGroups) {
    group.liveStates = group.coords.map(() => null);
    group.coords.forEach(([x, z], i) => {
      const on = makePumpMesh(x, z, true, i), off = makePumpMesh(x, z, false, i);
      pumpMeshes.push({
        group: group.name, index: i, x, z, on, off,
        topOn: pumpTopGeometry(on, x, z), topOff: pumpTopGeometry(off, x, z), active: null
      });
    });
  }
  const livePumpBuffers = [0, 1, 2].map(() => ({ buf: gl.createBuffer(), count: 0 }));
  const superiorPumpBuffers = [0, 1, 2].map(() => ({ buf: gl.createBuffer(), count: 0 }));

  function rebuildPumpBatches() {
    mvShadowDirty = true;
    for (let g = 0; g < 3; g++) {
      let total = 0;
      for (const p of pumpMeshes) total += (p.active === true ? p.on : p.off)[g].length;
      const normal = new Float32Array(total), superior = new Float32Array(total);
      let offset = 0;
      for (const p of pumpMeshes) {
        const current = (p.active === true ? p.on : p.off)[g];
        const top = (p.active === true ? p.topOn : p.topOff)[g];
        normal.set(current, offset); superior.set(top, offset); offset += current.length;
      }
      for (const [output, arr] of [[livePumpBuffers[g], normal], [superiorPumpBuffers[g], superior]]) {
        gl.bindBuffer(gl.ARRAY_BUFFER, output.buf);
        gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW);
        output.count = arr.length / 13;
      }
    }
  }
  rebuildPumpBatches();
  const pipeBuffers = [0, 1, 2].map(() => ({ buf: gl.createBuffer(), count: 0 }));
  function rebuildPipeBuffers() {
    mvShadowDirty = true;
    const saved = A; A = [[], [], []];
    for (const def of pipeDefs) pipe(def.nodes, def.r, def);
    for (let group = 0; group < 3; group++) {
      const arr = new Float32Array(A[group]);
      const output = pipeBuffers[group];
      gl.bindBuffer(gl.ARRAY_BUFFER, output.buf);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW);
      output.count = arr.length / 13;
    }
    A = saved;
  }
  rebuildPipeBuffers();

  const buffers = []; for (let group = 0; group < 3; group++) { const arr = new Float32Array(A[group]); const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW); buffers.push({ buf, count: arr.length / 13 }); } A.length = 0;

  function bindBuffer(item) { gl.bindBuffer(gl.ARRAY_BUFFER, item.buf); const s = 13 * 4; gl.enableVertexAttribArray(loc.pos); gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, s, 0); gl.enableVertexAttribArray(loc.normal); gl.vertexAttribPointer(loc.normal, 3, gl.FLOAT, false, s, 12); gl.enableVertexAttribArray(loc.color); gl.vertexAttribPointer(loc.color, 3, gl.FLOAT, false, s, 24); gl.enableVertexAttribArray(loc.data); gl.vertexAttribPointer(loc.data, 4, gl.FLOAT, false, s, 36) }
  function perspective(fov, aspect, near, far) { const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far); return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0] }
  function lookAt(eye, center, up) { const z = norm(minus(eye, center)), x = norm(cross(up, z)), y = cross(z, x); return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1] }
  function matMul(a, b) { const o = new Array(16); for (let col = 0; col < 4; col++)for (let row = 0; row < 4; row++) { let v = 0; for (let k = 0; k < 4; k++)v += a[k * 4 + row] * b[col * 4 + k]; o[col * 4 + row] = v } return o }


  const focusAnchor = [0, 1.72, 1.05];
  const state = {
    yaw: 1.44, pitch: .79, dist: 41, zoom: 1.01, target: [...focusAnchor], auto: false, water: true,
    flowSpeed: 1, labels: true, flowLabels: true, levels: true, userPanned: false
  };
  const initial = { yaw: 1.44, pitch: .79, zoom: 1.01, target: [...focusAnchor] };
  const fitSamples = [];
  for (const p of tankLabels) {
    const extent = (p.radius || 1.6) + 1.15;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      fitSamples.push([p.x + sx * extent, .0, p.z + sz * extent]);
      fitSamples.push([p.x + sx * extent, p.y + .82, p.z + sz * extent]);
    }
  }
  for (const f of flowReadings) {
    const x = f.x + (f.dx || 0) / 25, z = f.z + (f.dy || 0) / 24.5;
    fitSamples.push([x - 2.2, .15, z - .9], [x + 2.2, 1.5, z + .9]);
  }
  for (const pipe of pipeDefs) for (const p of pipe.nodes) fitSamples.push([p[0], p[1], p[2]]);
  function frameAxes(yaw, pitch) {
    const sp = Math.sin(pitch), cp = Math.cos(pitch), sy = Math.sin(yaw), cy = Math.cos(yaw);
    return { toward: [sp * cy, cp, sp * sy], right: [sy, 0, -cy], up: [-cp * cy, sp, -cp * sy] };
  }
  function frameParams() {
    const aspect = Math.max(.30, (vw || window.innerWidth) / (vh || window.innerHeight));
    const tanHalf = Math.tan(44 * Math.PI / 360);

    return { kx: tanHalf * aspect * (aspect < 1.05 ? 1.040 : 1.085), ky: tanHalf * (aspect < 1.05 ? 1.020 : 1.055) };
  }
  function fitDistanceFromTarget(yaw, pitch, target) {
    const { toward, right, up } = frameAxes(yaw, pitch);
    const { kx, ky } = frameParams();
    let d = 15.5;
    for (const p of fitSamples) {
      const dx = p[0] - target[0], dy = p[1] - target[1], dz = p[2] - target[2];
      const near = toward[0] * dx + toward[1] * dy + toward[2] * dz;
      const px = right[0] * dx + right[2] * dz;
      const py = up[0] * dx + up[1] * dy + up[2] * dz;
      d = Math.max(d, near + Math.abs(px) / kx, near + Math.abs(py) / ky, near + 2.0);
    }
    return Math.min(130, d + .18);
  }


  function fitPose(yaw, pitch) {
    const { toward, right, up } = frameAxes(yaw, pitch);
    const { kx, ky } = frameParams();
    let rPlus = -Infinity, rMinus = Infinity, uPlus = -Infinity, uMinus = Infinity, maxNear = -Infinity;
    for (const p of fitSamples) {
      const dx = p[0] - focusAnchor[0], dy = p[1] - focusAnchor[1], dz = p[2] - focusAnchor[2];
      const near = toward[0] * dx + toward[1] * dy + toward[2] * dz;
      const r = right[0] * dx + right[2] * dz;
      const u = up[0] * dx + up[1] * dy + up[2] * dz;
      rPlus = Math.max(rPlus, r + kx * near); rMinus = Math.min(rMinus, r - kx * near);
      uPlus = Math.max(uPlus, u + ky * near); uMinus = Math.min(uMinus, u - ky * near);
      maxNear = Math.max(maxNear, near);
    }
    const shiftR = (rPlus + rMinus) * .5, shiftU = (uPlus + uMinus) * .5;
    const target = focusAnchor.map((v, i) => v + right[i] * shiftR + up[i] * shiftU);
    const distance = Math.max(15.5, (rPlus - rMinus) / (2 * kx), (uPlus - uMinus) / (2 * ky), maxNear + 1.55) + .18;
    return { target, dist: Math.min(140, distance) };
  }

  function fitDistance(yaw, pitch) { return fitPose(yaw, pitch).dist; }



  const presentation = {
    active: false, paused: false, index: 0, step: 0, entryClock: 0, clock: 0, interval: 9.0, rate: 1, transition: null, saved: null, dist: 18,
    sourceTime: '', sourceFresh: false, uiLast: -1
  };
  const presEl = id => document.getElementById(id);

  const presentationUi = { visible: true };
  const mvBriefTankName = 'NUEVA CASTILLA 1';
  const mvBriefTank = index => !!tankSpecs[index] && tankSpecs[index].name === mvBriefTankName;
  const labelsHost = document.getElementById('labels');
  function mvTrendDirection(delta) {
    if (!Number.isFinite(delta)) return null;
    return Number(delta.toFixed(2)) > 0 ? 'up' : 'down';
  }
  function mvTrendDisplay(delta) {
    const direction = mvTrendDirection(delta);
    if (direction === null) return 'SIN DATOS';
    const rounded = Number(delta.toFixed(2));
    return (direction === 'up' ? '▲ +' : rounded < 0 ? '▼ −' : '▼ ') + Math.abs(rounded).toFixed(2) + ' m';
  }
  const topViewUi = { built: false, tankCards: [], flowCards: [] };

  let topViewSelected = false;
  function isTopViewMode() { return topViewSelected && !presentation.active; }
  function projectPointToScreen(x, y, z) {
    const w = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
    if (w <= .08) return null;
    return {
      x: (.5 + .5 * (vp[0] * x + vp[4] * y + vp[8] * z + vp[12]) / w) * vw,
      y: (.5 - .5 * (vp[1] * x + vp[5] * y + vp[9] * z + vp[13]) / w) * vh,
      w
    };
  }
  function buildTopViewOverlays() {
    if (topViewUi.built) return;
    topViewUi.built = true;
    labelsHost.innerHTML = '';
    topViewUi.tankCards = tankLabels.map(() => {
      const root = document.createElement('div');
      root.className = 'top-card mv-top-tank';
      root.innerHTML = '<span class="mv-top-tank-name"></span><span class="mv-top-tank-reading"><span class="v">N/D</span><span class="s">SIN DATO</span></span>';
      labelsHost.appendChild(root);
      return { root, name: root.querySelector('.mv-top-tank-name'), reading: root.querySelector('.mv-top-tank-reading'), value: root.querySelector('.v'), delta: root.querySelector('.s'), position: null };
    });
    topViewUi.flowCards = flowReadings.map(() => {
      const el = document.createElement('div');
      el.className = 'top-card mv-top-flow';
      el.innerHTML = '<span class="mv-top-flow-name"></span><span class="mv-top-flow-reading"></span>';
      labelsHost.appendChild(el);
      return el;
    });
    if (!document.getElementById('mvTopViewCompactCss')) {
      const style = document.createElement('style');
      style.id = 'mvTopViewCompactCss';
      style.textContent = '.top-view-active .mv-top-tank,.top-view-active .mv-top-flow{position:absolute!important;box-sizing:border-box!important;transform:translate(-50%,-50%)!important;margin:0!important;border:1px solid #b9c8d0!important;border-radius:5px!important;background:#fff!important;box-shadow:0 1px 3px rgba(16,36,49,.12)!important;color:#162632!important;white-space:normal!important;letter-spacing:0!important;pointer-events:none!important;z-index:3!important}.top-view-active .mv-top-tank{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px 6px!important;gap:2px!important;min-height:39px!important;max-height:58px!important;text-align:center;overflow:visible!important}.mv-top-tank-name{display:block;width:100%;font:600 9px/1.08 "Segoe UI",Arial,sans-serif!important;color:#263d49!important;overflow-wrap:break-word}.mv-top-tank-reading{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1px;width:100%;min-width:0;max-width:100%;white-space:normal!important;font:500 10px/1 "Segoe UI",Arial,sans-serif!important;overflow:visible!important}.mv-top-tank-reading .v{display:block;max-width:100%;font:600 11px/1.15 "Segoe UI",Arial,sans-serif!important;color:#142935!important;white-space:nowrap!important}.mv-top-tank-reading .s{display:block;max-width:100%;font:500 9px/1.1 "Segoe UI",Arial,sans-serif!important;color:#168260!important;white-space:nowrap!important}.mv-top-tank-reading.down .s{color:#ba3944!important}.mv-top-tank-reading.flat .s{color:#647780!important}.top-view-active .mv-top-flow{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:2px!important;padding:4px 5px!important;text-align:center;min-height:30px!important;max-height:56px!important}.mv-top-flow-name{display:block;width:100%;font:500 8.2px/1.12 "Segoe UI",Arial,sans-serif!important;color:#42545e!important;overflow-wrap:normal;word-break:normal}.mv-top-flow-reading{display:block;font:600 11px/1.03 "Segoe UI",Arial,sans-serif!important;color:#192d37!important;white-space:nowrap!important}.mv-top-flow-reading .u{font:500 8.3px "Segoe UI",Arial,sans-serif!important;color:#5c6c74!important}';
      document.head.appendChild(style);
    }
  }
  function hideTopViewOverlays() {
    labelsHost.classList.remove('top-view-active');
    if (!topViewUi.built) return;
    for (const item of topViewUi.tankCards) { item.root.style.display = 'none'; item.position = null; }
    for (const el of topViewUi.flowCards) el.style.display = 'none';
  }
  let mvTopNextArrange = 0;
  function updateTopViewOverlays() {
    buildTopViewOverlays();
    labelsHost.classList.add('top-view-active');
    const timestamp = performance.now();
    if (timestamp < mvTopNextArrange) return;
    mvTopNextArrange = timestamp + 105;
    const occupied = [];
    const pad = 4;
    const minMargin = 6;
    const dock = { x1: vw * .34, x2: vw * .66, y1: vh - 108, y2: vh + 10 };
    const boxOverlap = (a, b) => Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) * Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
    function place(el, origin, w, h, preference, previous, isTank) {
      const candidates = [];
      if (previous && Number.isFinite(previous.x) && Number.isFinite(previous.y)) {
        candidates.push([previous.x - origin.x, previous.y - origin.y]);
      }
      for (const pair of preference) candidates.push(pair);
      for (const radius of [36, 60, 86, 113, 147, 185, 235]) {
        for (let angle = 0; angle < 12; angle++) {
          const a = (angle + (isTank ? 1.5 : 0)) * Math.PI / 6;
          candidates.push([Math.sin(a) * radius, Math.cos(a) * radius]);
        }
      }
      let best = null;
      let bestScore = Infinity;
      function consider(dx, dy) {
        const x = Math.max(w / 2 + minMargin, Math.min(vw - w / 2 - minMargin, origin.x + dx));
        const y = Math.max(h / 2 + minMargin, Math.min(vh - h / 2 - minMargin, origin.y + dy));
        const rect = { x1: x - w / 2 - pad, x2: x + w / 2 + pad, y1: y - h / 2 - pad - (isTank ? 6 : 0), y2: y + h / 2 + pad };
        let overlap = boxOverlap(rect, dock) * 1.5;
        for (const other of occupied) overlap += boxOverlap(rect, other);
        const distance = Math.hypot(x - origin.x, y - origin.y);
        const score = overlap * 160 + distance + (previous ? Math.hypot(x - previous.x, y - previous.y) * .12 : 0);
        if (score < bestScore) { bestScore = score; best = { x, y, rect, overlap }; }
        return overlap;
      }
      for (const [dx, dy] of candidates) consider(dx, dy);
      if (best && best.overlap > 0) {
        for (let x = w / 2 + 8; x <= vw - w / 2 - 8; x += Math.max(55, w * .60)) {
          for (let y = h / 2 + 8; y <= vh - h / 2 - 8; y += Math.max(35, h * .75)) {
            consider(x - origin.x, y - origin.y);
          }
        }
      }
      if (!best) { el.style.display = 'none'; return null; }
      el.style.display = 'flex';
      el.style.left = best.x.toFixed(1) + 'px';
      el.style.top = best.y.toFixed(1) + 'px';
      el.style.width = w.toFixed(1) + 'px';
      el.style.height = h.toFixed(1) + 'px';
      occupied.push(best.rect);
      return { x: best.x, y: best.y, w, h };
    }
    const tanks = [];
    for (let i = 0; i < tankLabels.length; i++) {
      const p = tankLabels[i], spec = tankSpecs[i], card = topViewUi.tankCards[i];
      const center = projectPointToScreen(p.x, .93, p.z);
      if (!center || center.x < -40 || center.x > vw + 40 || center.y < -40 || center.y > vh + 40 || (!state.labels && !state.levels)) {
        card.root.style.display = 'none'; card.position = null; continue;
      }
      const name = shortNames[spec.name] || spec.name;
      if (card.name.textContent !== name) card.name.textContent = name;
      const meters = Number.isFinite(spec.meters) ? spec.meters : null;
      const delta = Number.isFinite(spec.delta) ? spec.delta : null;
      const current = meters === null ? 'N/D' : meters.toFixed(2) + ' m';
      const variation = mvTrendDisplay(delta);
      const direction = mvTrendDirection(delta);
      if (card.value.textContent !== current) card.value.textContent = current;
      if (card.delta.textContent !== variation) card.delta.textContent = variation;
      card.reading.classList.toggle('down', direction === 'down');
      card.reading.classList.toggle('flat', direction === null);
      card.name.style.display = state.labels ? '' : 'none';
      card.reading.style.display = state.levels ? '' : 'none';
      const width = state.labels ? Math.min(156, Math.max(104, name.length * 4.65 + 18)) : 100;
      const height = state.labels && state.levels ? (name.length >= 23 ? 55 : 43) : state.labels ? (name.length >= 23 ? 35 : 26) : 35;
      tanks.push({ center, card, width, height });
    }
    for (const tank of tanks) {
      tank.card.position = place(tank.card.root, tank.center, tank.width, tank.height,
        [[0, -33], [0, 32], [-65, -20], [65, -20], [-65, 30], [65, 30], [0, -55], [0, 55]], tank.card.position, true);
    }
    for (let i = 0; i < flowReadings.length; i++) {
      const f = flowReadings[i], el = topViewUi.flowCards[i];
      if (!state.flowLabels) { el.style.display = 'none'; continue; }
      const x = f.x + (f.dx || 0) / 25, z = f.z + (f.dy || 0) / 24.5;
      const pos = projectPointToScreen(x, .55, z);
      if (!pos || pos.x < -40 || pos.x > vw + 40 || pos.y < -40 || pos.y > vh + 40) { el.style.display = 'none'; continue; }
      const name = String(f.legend || f.name || 'FLUJO');
      const nm = el.querySelector('.mv-top-flow-name');
      const rd = el.querySelector('.mv-top-flow-reading');
      if (nm.textContent !== name) nm.textContent = name;
      el.title = name;
      const amount = i === 2 ? '' : Number.isFinite(f.lps) ? Math.round(f.lps).toLocaleString('es-MX') + ' <span class="u">LPS</span>' : '<span class="u">SIN LECTURA</span>';
      if (rd.innerHTML !== amount) rd.innerHTML = amount;
      const width = Math.min(144, Math.max(89, name.length * 2.05 + 47));
      const approximateLines = Math.max(1, Math.ceil((name.length * 4.3) / Math.max(50, width - 12)));
      const height = 18 + Math.min(4, approximateLines) * 9.5;
      const previous = el._mvTopPosition || null;
      el._mvTopPosition = place(el, pos, width, height,
        [[0, 29], [0, -29], [0, 52], [0, -52], [74, 0], [-74, 0], [105, 32], [-105, 32], [105, -32], [-105, -32]], previous, false);
    }
  }
  function setPresentationInfoVisible(visible, animate = true) {
    presentationUi.visible = !!visible;
    const brief = presentation.active && mvBriefTank(presentation.index);
    presEl('presentationPanel').hidden = !(presentation.active && presentationUi.visible && !brief);
    const info = presEl('presentationInfoToggle');
    info.disabled = !presentation.active || brief;
    info.textContent = presentationUi.visible ? 'Ocultar información' : 'Mostrar información';
    info.setAttribute('aria-pressed', String(presentationUi.visible && !brief));
    info.setAttribute('title', brief ? 'Recorrido breve del tanque sin datos' : presentationUi.visible ? 'Ocultar ficha y continuar la presentación' : 'Mostrar ficha del tanque actual');
    mvScheduleFitPresentation();
    if (presentation.active && animate && !brief) {
      const next = presentationPose(presentation.index);
      presentation.transition = {
        t0: performance.now(), duration: 550,
        from: { yaw: state.yaw, pitch: state.pitch, target: [...state.target], dist: presentation.dist || state.dist }, to: next
      };
    }
  }
  presEl('presentationInfoToggle').addEventListener('click', () => {
    if (presentation.active) {
      setPresentationInfoVisible(!presentationUi.visible);
      if (presentationUi.visible) presentationData();
    }
  });
  function setPresentationControlsOpen(isOpen) {
    const extra = presEl('presentationExtraControls'), button = presEl('presentationOptions');
    extra.hidden = !isOpen;
    mvScheduleFitPresentation();
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? 'Ocultar controles de presentación' : 'Mostrar controles de presentación');
  }
  presEl('presentationOptions').addEventListener('click', () => {
    setPresentationControlsOpen(presEl('presentationExtraControls').hidden);
  });


  const pumpGroupsByTank = {
    'FRAILE 1': ['FRAILE 1 → FRAILE 3', 'BOMB. REAL DE MINAS'],
    'FRAILE 2': ['FRAILE 2 → GARCÍA 1'],
    'GARCÍA 1': ['GARCÍA 1 → GARCÍA 2'],
    'ALIANZA REAL': ['ENTRADA ALIANZA REAL', 'BOMB. MITRAS PONIENTE'],
    'NUEVA CASTILLA / AMP': ['ALIANZA REAL → NUEVA CASTILLA AMP'],
    'RECTANGULAR': ['NUEVA CASTILLA AMP → RECTANGULAR'],
    'SANTA ROSA 2': ['RECTANGULAR → SANTA ROSA 2']
  };

  function pumpMiniature(state) {
    const icon = document.createElement('div');
    icon.className = 'presentation-pump-model';
    const colors = state === true ? {
      base: '#267744', baseEdge: '#19542f', foot: '#2c7147', body: '#39bb61', bodyEdge: '#187742', middle: '#249b4f',
      stripes: '#27a754', bright: '#a9f2bb', rail: '#61d885', light: '#d3f9dc', top: '#57c879', topEdge: '#18633a',
      inlet: '#207b46', inletEdge: '#155a35', core: '#70eb94'
    } : {
      base: '#52616a', baseEdge: '#64747f', foot: '#8d9ba3', body: '#aab4bb', bodyEdge: '#64747f', middle: '#7d8e98',
      stripes: '#7d8e98', bright: '#d9e0e4', rail: '#4c5d67', light: '#bac4c9', top: '#7b8b96', topEdge: '#4d5e68',
      inlet: '#6b7e89', inletEdge: '#4d5b65', core: '#84939c'
    };
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 64" aria-hidden="true" focusable="false">
 <rect x="7" y="56" width="40" height="5" rx="1" fill="${colors.base}"/>
 <rect x="12" y="53" width="31" height="3" fill="${colors.foot}"/>
 <rect x="13" y="16" width="29" height="37" rx="4" fill="${colors.body}" stroke="${colors.bodyEdge}" stroke-width="1.4"/>
 <path d="M16 20h23v6H16zM16 31h23v5H16zM16 41h23v6H16z" fill="${colors.middle}"/>
 <path d="M17 18h5v33h-5zM33 18h5v33h-5z" fill="${colors.bright}" opacity=".8"/>
 <path d="M11 24h33v5H11zM11 45h33v5H11z" fill="${colors.rail}" stroke="${colors.topEdge}" stroke-width=".6"/>
 <rect x="21" y="8" width="13" height="9" rx="2" fill="${colors.top}" stroke="${colors.topEdge}"/>
 <ellipse cx="27" cy="7" rx="11" ry="4.4" fill="${colors.top}" stroke="${colors.topEdge}" stroke-width="1.2"/>
 <ellipse cx="27" cy="7" rx="6" ry="2.2" fill="${colors.topEdge}"/>
 <rect x="41" y="31" width="7" height="15" rx="1.2" fill="${colors.inlet}" stroke="${colors.inletEdge}" stroke-width="1"/>
 <path d="M45 33h2m-2 4h2m-2 4h2" stroke="${colors.light}" stroke-width=".7"/>
 <rect x="13" y="52" width="28" height="2" fill="${colors.baseEdge}"/>
 <rect class="pump-operation-core" x="24.5" y="31" width="5" height="13" rx="1" fill="${colors.core}"/>
 </svg>`;
    return icon;
  }
  function renderPresentationPumps(name) {
    const area = presEl('presentationPumps'), list = presEl('presentationPumpList'), note = presEl('presentationPumpsNote');
    const associated = pumpGroupsByTank[name] || [];
    list.replaceChildren();
    let found = 0;
    for (const groupName of associated) {
      const group = pumpGroups.find(g => g.name === groupName);
      if (!group) continue;
      found++;
      const block = document.createElement('section'); block.className = 'presentation-pump-group';
      const title = document.createElement('div'); title.className = 'presentation-pump-group-title';
      title.textContent = groupName; block.appendChild(title);
      const entries = document.createElement('div'); entries.className = 'presentation-pump-grid mv-pump-count-' + Math.min(group.coords.length, 5) + ((name === 'ALIANZA REAL' || name === 'FRAILE 1') ? ' mv-pump-aligned' : '');
      for (let i = 0; i < group.coords.length; i++) {
        const pump = pumpMeshes.find(p => p.group === groupName && p.index === i);
        const state = hasReceivedData && presentation.sourceFresh && pump ? pump.active : null;
        const category = state === true ? 'on' : state === false ? 'off' : 'unknown';
        const line = document.createElement('div'); line.className = 'presentation-pump-item ' + category;
        line.setAttribute('aria-label', 'Equipo ' + (i + 1) + ': ' + (state === true ? 'Encendido' : state === false ? 'Apagado' : 'Sin dato'));
        line.appendChild(pumpMiniature(state));
        const number = document.createElement('span'); number.className = 'presentation-pump-item-eq'; number.textContent = 'Equipo ' + String(i + 1).padStart(2, '0');
        const status = document.createElement('span'); status.className = 'presentation-pump-status ' + category;
        status.textContent = state === true ? 'Operando' : state === false ? 'Apagado' : 'Sin dato';
        line.append(number, status); entries.appendChild(line);
      }
      block.appendChild(entries); list.appendChild(block);
    }
    area.hidden = found === 0;
    note.hidden = !hasReceivedData || presentation.sourceFresh;
  }


  const presentationFlowMap = {
    'FRAILE 1': [['Salida', 'fraile1_salida']],
    'FRAILE 2': [['Llegada', 'fraile2_llegada']],
    'GARCÍA 1': [['Salida a red', 'garcia1_red']],
    'GARCÍA 2': [['Salida a red', 'garcia2_red']],
    'ALIANZA REAL': [['Tramo Alianza / Fraile 1', 'alianza_fraile1']],
    'NUEVA CASTILLA / AMP': [['Tramo Castilla / Alianza', 'castilla_amp_alianza']],
    'RECTANGULAR': [['Salida a red', 'castilla3_amp'], ['Red a Zuazua', 'zuazua']],
    'CIRCULAR': [['Red a Ciénega de Flores', 'cienega']],
    'SANTA ROSA 2': [['Tramo Castilla 3', 'santarosa_castilla3'], ['Llegada', 'santarosa_llegada'], ['Red a Pesquería', 'pesqueria'], ['Derivaciones', 'derivaciones']]
  };


  const presentationEligibleIndices = ['SANTA ROSA 2', 'CIRCULAR', 'RECTANGULAR', 'NUEVA CASTILLA / AMP', 'NUEVA CASTILLA 1', 'ALIANZA REAL', 'FRAILE 1', 'FRAILE 5', 'FRAILE 4', 'FRAILE 3', 'FRAILE 2', 'GARCÍA 1', 'GARCÍA 2', 'LA CRUZ'].map(name => tankSpecs.findIndex(tank => tank.name === name)).filter(index => index >= 0);
  let presentationFlowRecords = {};
  function renderPresentationFlows(tankName) {
    const host = presEl('presentationFlowReadings');
    host.replaceChildren();
    const refs = presentationFlowMap[tankName] || [];
    const section = host.closest('.presentation-flow');

    if (section) { section.hidden = refs.length === 0; section.style.display = refs.length ? '' : 'none'; }
    if (!refs.length) return;
    const formatter = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });
    for (const [name, key] of refs) {
      const record = key ? presentationFlowRecords[key] : null;
      const value = record ? numberOrNull(record.lps) : null;
      const valid = hasReceivedData && value !== null;
      const row = document.createElement('div'); row.className = 'presentation-flow-row';
      const label = document.createElement('span'); label.textContent = name;
      const reading = document.createElement('strong'); reading.textContent = valid ? formatter.format(value) + ' LPS' : 'N/D';
      const stale = valid && (!presentation.sourceFresh || record.estado === 'sin_comunicacion');
      if (stale) {
        reading.classList.add('stale');
        reading.title = 'Última lectura disponible, comunicación no confirmada';
      }
      row.append(label, reading);
      if (stale) { const warning = document.createElement('small'); warning.textContent = 'Sin comunicación confirmada'; row.appendChild(warning); }
      host.appendChild(row);
    }
  }
  const MV_HISTORY_API_PATHS = ['/Telemetria/Php/monterreyv_3d_historial.php', '/Telemetria/php/monterreyv_3d_historial.php'];
  const MV_HISTORY_TTL_MS = 30000;
  const MV_HISTORY_WINDOW_MS = 60 * 60000;
  const mvHistoryLiveSamples = new Map();
  const mvHistoryLiveVersions = new Map();
  const mvHistoryCache = new Map();
  const mvHistoryClock = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Monterrey' });
  const mvHistoryNumber = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });
  let mvHistoryCurrentTank = '';
  let mvHistoryFlowId = '';
  let mvHistoryRequest = null;
  let mvHistorySignature = '';
  const mvHistoryFormatTime = ms => mvHistoryClock.format(new Date(ms));

  const mvHistoryStyle = document.createElement('style');
  mvHistoryStyle.textContent = `
    #presentationPanel .presentation-secondary-table{display:none!important}
    #presentationPanel #presentationUpdated{display:none!important}
    #presentationPanel .mv-dual-history{margin:12px 0 8px;border:1px solid #c5d2dc;border-left:3px solid #275b7d;border-radius:3px;background:#fff;color:#21374a;font-family:'Segoe UI',Tahoma,Arial,sans-serif;box-shadow:none;overflow:hidden}
    #presentationPanel .mv-dh-body{display:block;padding:0 11px}
    #presentationPanel .mv-dh-card{background:#fff;border:0;border-radius:0;padding:11px 0 9px;min-width:0;box-shadow:none}
    #presentationPanel .mv-dh-flow{border-top:1px solid #d4dfe7}
    #presentationPanel .mv-dh-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 3px}
    #presentationPanel .mv-dh-card-name{display:flex;align-items:center;gap:8px;color:#111111;font-size:11.5px;font-weight:650;letter-spacing:.035em}
    #presentationPanel .mv-dh-symbol{display:block;width:3px;height:15px;border-radius:0;background:#005288;box-shadow:none;flex:none}
    #presentationPanel .mv-dh-flow .mv-dh-symbol{background:#6c757d;box-shadow:none}
    #presentationPanel .mv-dh-value{color:#111111;font-size:17px;font-weight:400;letter-spacing:0;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
    #presentationPanel .mv-dh-flow .mv-dh-value{color:#111111}
    #presentationPanel .mv-dh-value small{color:#111111;font-size:10px;font-weight:500;letter-spacing:0}
    #presentationPanel .mv-dh-flow-choice{display:block;width:100%;margin:3px 0 6px;min-height:26px;padding:3px 7px;border:1px solid #c6d4dc;border-radius:2px;background:#f8fafb;color:#314c5d;font:500 11px 'Segoe UI',Tahoma,Arial,sans-serif}
    #presentationPanel .mv-dh-flow-choice[hidden]{display:none}
    #presentationPanel .mv-dh-plot{position:relative;width:100%;height:137px;min-width:0;overflow:visible;background:#fcfdfe}
    #presentationPanel .mv-dh-plot svg{width:100%;height:100%;display:block;overflow:hidden}
    #presentationPanel .mv-dh-foot{display:flex;align-items:center;justify-content:flex-end;gap:7px;padding:5px 1px 0;border-top:1px solid #edf1f4;color:#111111;font-size:10px;line-height:1.3}
    #presentationPanel .mv-dh-foot span:first-child{display:none!important}
    #presentationPanel .mv-dh-foot span:last-child{font-weight:500;text-align:right}
    #presentationPanel .mv-dh-empty{display:flex;align-items:center;justify-content:center;min-height:100px;height:100%;padding:9px;text-align:center;color:#6b7c86;font-size:11px;line-height:1.5}
    #presentationPanel .mv-dh-tooltip{position:absolute;z-index:5;pointer-events:none;background:#274455;color:#fff;padding:5px 7px;border-radius:2px;font-size:10.5px;line-height:1.35;box-shadow:0 2px 7px rgba(0,0,0,.15);white-space:nowrap;transform:translate(-50%,-105%)}
    #presentationPanel .mv-dh-tooltip[hidden]{display:none}
    #presentationPanel .mv-dh-cursor{pointer-events:none}
    #presentationPanel .mv-dh-message{margin:0 11px 10px;padding:7px 0;border:0;border-top:1px solid #e0e7ed;border-radius:0;background:#fff;color:#667b88;font-size:10px;line-height:1.45}
    #presentationPanel .mv-dh-message[hidden]{display:none}
    @media(max-width:700px){#presentationPanel .mv-dh-body{padding:0 9px}#presentationPanel .mv-dh-card{padding:9px 0 8px}#presentationPanel .mv-dh-plot{height:136px;min-height:128px}#presentationPanel .mv-dh-value{font-size:16px}}
    #presentationPanel .presentation-pumps{text-align:center}
    #presentationPanel .presentation-pumps-title{text-align:center}
    #presentationPanel .presentation-pump-group{display:flex;flex-direction:column;align-items:center}
    #presentationPanel .presentation-pump-group-title{width:100%;text-align:center;font-weight:600;letter-spacing:.015em}
    #presentationPanel .presentation-pump-grid{justify-content:center;justify-items:center}
    #presentationPanel .presentation-pump-item{text-align:left;justify-self:center;width:min(100%,240px)}
    #presentationPanel .presentation-pump-grid{display:flex!important;flex-wrap:wrap!important;justify-content:center!important;align-items:flex-start!important;column-gap:8px!important;row-gap:4px!important;max-width:100%!important}
    #presentationPanel .presentation-pump-grid .presentation-pump-item{flex:0 1 calc((100% - 16px)/3)!important;box-sizing:border-box!important;min-width:0!important;max-width:none!important;margin:0!important;justify-self:auto!important}
    #presentationPanel .presentation-pump-grid.mv-pump-count-1 .presentation-pump-item{flex:0 1 180px!important}
    #presentationPanel .presentation-pump-grid.mv-pump-count-2 .presentation-pump-item,#presentationPanel .presentation-pump-grid.mv-pump-count-4 .presentation-pump-item{flex:0 1 calc((100% - 8px)/2)!important}
    #presentationPanel .presentation-pump-grid.mv-pump-count-3 .presentation-pump-item,#presentationPanel .presentation-pump-grid.mv-pump-count-5 .presentation-pump-item{flex:0 1 calc((100% - 16px)/3)!important}
    #presentationPanel .presentation-pump-grid .presentation-pump-model svg{filter:none!important}
    @media(max-width:380px){#presentationPanel .presentation-pump-grid.mv-pump-count-3 .presentation-pump-item,#presentationPanel .presentation-pump-grid.mv-pump-count-5 .presentation-pump-item{flex:0 1 calc((100% - 8px)/2)!important}}

    @media (min-width:701px) and (min-height:560px) {
      #presentationPanel.mv-fit-no-scroll:not([hidden]){top:9px!important;right:13px!important;bottom:auto!important;transform:none!important;width:min(444px,calc(100vw - 30px))!important;max-height:calc(100dvh - 18px)!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
      #presentationPanel.mv-fit-no-scroll .presentation-head{flex:0 0 auto!important;padding:10px 14px 8px!important}
      #presentationPanel.mv-fit-no-scroll .presentation-head-top{min-height:0!important}
      #presentationPanel.mv-fit-no-scroll .presentation-tank-title{margin:3px 0 0!important;font-size:20px!important;line-height:1.2!important}
      #presentationPanel.mv-fit-no-scroll .presentation-progress-track{flex:0 0 2px!important}
      #presentationPanel.mv-fit-no-scroll .presentation-content{flex:0 1 auto!important;min-height:0!important;overflow:hidden!important;padding:7px 13px 6px!important;overscroll-behavior:contain}
      #presentationPanel.mv-fit-no-scroll .presentation-readings{padding-bottom:6px!important;margin-bottom:4px!important}
      #presentationPanel.mv-fit-no-scroll .presentation-reading{padding-top:0!important;padding-bottom:0!important}
      #presentationPanel.mv-fit-no-scroll .presentation-reading-label{margin-bottom:3px!important}
      #presentationPanel.mv-fit-no-scroll .presentation-primary-value{font-weight:400!important}
      #presentationPanel.mv-fit-no-scroll .presentation-flow{padding:5px 0!important;margin:3px 0 5px!important}
      #presentationPanel.mv-fit-no-scroll .presentation-flow-heading{margin-bottom:3px!important}
      #presentationPanel.mv-fit-no-scroll .presentation-flow-row{padding:3px 0!important}
      #presentationPanel.mv-fit-no-scroll .presentation-flow-row strong{font-weight:400!important}
      #presentationPanel.mv-fit-no-scroll .mv-dual-history{margin:7px 0 5px!important}
      #presentationPanel.mv-fit-no-scroll .mv-dh-body{padding:0 11px!important}
      #presentationPanel.mv-fit-no-scroll .mv-dh-card{padding:6px 0 5px!important}
      #presentationPanel.mv-fit-no-scroll .mv-dh-card-head{margin-bottom:2px!important}
      #presentationPanel.mv-fit-no-scroll .mv-dh-plot{height:var(--mv-fit-plot-height,145px)!important;min-height:128px!important;flex-shrink:0!important}
      #presentationPanel.mv-fit-no-scroll .mv-dh-foot{padding-top:3px!important}
      #presentationPanel.mv-fit-no-scroll .mv-dh-message{margin:0 11px 6px!important;padding:4px 0!important}
      #presentationPanel.mv-fit-no-scroll .presentation-pumps{margin-top:5px!important;padding-top:6px!important}
      #presentationPanel.mv-fit-no-scroll .presentation-pumps-title{font-size:12px!important;margin-bottom:4px!important}
      #presentationPanel.mv-fit-no-scroll .presentation-pump-group{margin-bottom:3px!important;padding-bottom:2px!important}
      #presentationPanel.mv-fit-no-scroll .presentation-pump-group+.presentation-pump-group{margin-top:3px!important;padding-top:5px!important}
      #presentationPanel.mv-fit-no-scroll .presentation-pump-group-title{font-size:10.5px!important;margin-bottom:3px!important}
      #presentationPanel.mv-fit-no-scroll .presentation-pump-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;column-gap:8px!important;row-gap:1px!important}
      #presentationPanel.mv-fit-no-scroll .presentation-pump-grid.mv-fit-three{grid-template-columns:repeat(3,minmax(0,1fr))!important;column-gap:5px!important}
      #presentationPanel.mv-fit-no-scroll .presentation-pump-item{grid-template-columns:25px minmax(0,1fr)!important;grid-template-rows:16px 15px!important;column-gap:4px!important;min-height:34px!important;padding:1px 0!important;white-space:nowrap!important}
      #presentationPanel.mv-fit-no-scroll .presentation-pump-model{width:25px!important;height:31px!important}
      #presentationPanel.mv-fit-no-scroll .presentation-pump-model svg{width:24px!important;height:30px!important}
      #presentationPanel.mv-fit-no-scroll .presentation-pump-item-eq{font-size:10.5px!important;font-weight:500!important}
      #presentationPanel.mv-fit-no-scroll .presentation-pump-status{font-size:10px!important;gap:3px!important}
      #presentationPanel.mv-fit-no-scroll .presentation-pump-status::before{width:5px!important;height:5px!important;flex-basis:5px!important}
      #presentationPanel.mv-fit-no-scroll .presentation-actions{flex:0 0 auto!important;padding:7px 11px!important}
      #presentationPanel.mv-fit-no-scroll .presentation-actions>button{min-height:32px!important}
      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .presentation-content{flex:1 1 auto!important;display:flex!important;flex-direction:column!important;justify-content:center!important}
      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .presentation-readings{margin-top:auto!important}
      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .presentation-flow{display:none!important}
      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .mv-dual-history{margin:9px 0!important}
      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .presentation-pumps{display:none!important}
      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .presentation-actions{margin-top:auto!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-head{padding:7px 12px 6px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-tank-title{font-size:18px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-content{padding:4px 12px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-readings{padding-bottom:4px!important;margin-bottom:2px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-flow{padding:3px 0!important;margin:2px 0!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-flow-row{padding:2px 0!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .mv-dual-history{margin:4px 0!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .mv-dh-card{padding:3px 0!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-pumps{margin-top:2px!important;padding-top:3px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-pump-item{grid-template-rows:14px 13px!important;min-height:29px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-pump-model{height:28px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-pump-model svg{height:27px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-actions{padding:5px 9px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-overflow .presentation-content{overflow-y:auto!important}
    }
    @media (min-width:701px) and (min-height:560px) {
      #presentationPanel.mv-fit-no-scroll.mv-fit-flow-grid #presentationFlowReadings{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;column-gap:13px!important;align-items:center!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-flow-grid .presentation-flow-row{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:5px!important;min-width:0!important;padding:3px 0!important;white-space:nowrap!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-flow-grid .presentation-flow-row span{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-flow-grid .presentation-flow-row strong{flex:none!important;text-align:right!important;white-space:nowrap!important}
      #presentationPanel.mv-fit-no-scroll .presentation-pump-grid.mv-pump-count-6 .presentation-pump-item{flex-basis:calc((100% - 16px)/3)!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-head{padding-top:6px!important;padding-bottom:5px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-content{padding-top:4px!important;padding-bottom:3px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-flow{padding-top:3px!important;padding-bottom:3px!important;margin-top:1px!important;margin-bottom:2px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-flow-row{padding-top:2px!important;padding-bottom:2px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .mv-dual-history{margin-top:3px!important;margin-bottom:2px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .mv-dh-body{padding-left:9px!important;padding-right:9px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .mv-dh-card{padding-top:3px!important;padding-bottom:3px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .mv-dh-card-head{margin-bottom:1px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .mv-dh-foot{padding-top:2px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .mv-dh-flow-choice{margin-top:2px!important;margin-bottom:3px!important;min-height:25px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-pumps{margin-top:3px!important;padding-top:3px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-pumps-title{margin-bottom:2px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-pump-group{margin-bottom:2px!important;padding-bottom:1px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-pump-group+.presentation-pump-group{margin-top:1px!important;padding-top:3px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-pump-group-title{margin-bottom:2px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-pump-grid{row-gap:0!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-pump-item{min-height:30px!important;padding-top:0!important;padding-bottom:0!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-actions{padding-top:5px!important;padding-bottom:5px!important}
    }
    #presentationPanel .presentation-pump-grid.mv-pump-aligned{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-auto-flow:row!important;justify-content:center!important;justify-items:stretch!important;align-items:center!important;gap:3px 13px!important;width:min(100%,354px)!important;max-width:354px!important;margin:4px auto 2px!important;box-sizing:border-box!important}
    #presentationPanel .presentation-pump-grid.mv-pump-aligned .presentation-pump-item{display:grid!important;grid-template-columns:26px minmax(0,1fr)!important;grid-template-rows:15px 14px!important;column-gap:6px!important;row-gap:0!important;align-items:center!important;justify-self:stretch!important;min-width:0!important;max-width:none!important;width:100%!important;height:30px!important;min-height:30px!important;padding:0 3px!important;margin:0!important;flex:none!important;box-sizing:border-box!important;text-align:left!important;border:0!important}
    #presentationPanel .presentation-pump-grid.mv-pump-aligned .presentation-pump-model{grid-row:1/3!important;grid-column:1!important;width:25px!important;height:29px!important;margin:0!important;align-self:center!important}
    #presentationPanel .presentation-pump-grid.mv-pump-aligned .presentation-pump-model svg{display:block!important;width:25px!important;height:29px!important}
    #presentationPanel .presentation-pump-grid.mv-pump-aligned .presentation-pump-item-eq{grid-column:2!important;grid-row:1!important;display:block!important;font-size:10.5px!important;line-height:14px!important;min-width:0!important;white-space:nowrap!important;text-align:left!important}
    #presentationPanel .presentation-pump-grid.mv-pump-aligned .presentation-pump-status{grid-column:2!important;grid-row:2!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;font-size:10px!important;line-height:13px!important;min-width:0!important;white-space:nowrap!important;text-align:left!important}
    #presentationPanel .presentation-pump-grid.mv-pump-aligned.mv-pump-count-5 .presentation-pump-item:last-child,#presentationPanel .presentation-pump-grid.mv-pump-aligned.mv-pump-count-1 .presentation-pump-item{grid-column:1/-1!important;justify-self:center!important;width:calc((100% - 13px)/2)!important}
    #presentationPanel .presentation-pump-group:has(.mv-pump-aligned){width:100%!important;align-items:center!important}
    #presentationPanel .presentation-pump-grid.mv-pump-aligned.mv-fit-three{grid-template-columns:repeat(2,minmax(0,1fr))!important}
    @media(max-width:420px){#presentationPanel .presentation-pump-grid.mv-pump-aligned{width:min(100%,330px)!important;column-gap:8px!important}#presentationPanel .presentation-pump-grid.mv-pump-aligned.mv-pump-count-5 .presentation-pump-item:last-child,#presentationPanel .presentation-pump-grid.mv-pump-aligned.mv-pump-count-1 .presentation-pump-item{width:calc((100% - 8px)/2)!important}}
    #presentationPanel .presentation-primary-value{font-weight:400!important}
    #presentationPanel .presentation-flow-row strong{font-weight:400!important}
    #presentationPanel .mv-dh-value{font-weight:400!important}
    @media (min-width:701px) and (min-height:560px){
      #presentationPanel.mv-fit-no-scroll:not([hidden]){width:min(488px,calc(100vw - 30px))!important;height:max-content!important;min-height:0!important;max-height:none!important;overflow:visible!important;transform-origin:top right!important;contain:none!important}
      #presentationPanel.mv-fit-no-scroll .presentation-content{display:block!important;flex:0 0 auto!important;height:auto!important;max-height:none!important;min-height:0!important;overflow:visible!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-overflow .presentation-content{overflow:visible!important}
      #presentationPanel.mv-fit-no-scroll .presentation-actions{flex:0 0 auto!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dual-graphs .mv-dh-body{display:block!important;padding:0 10px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dual-graphs .mv-dh-card{min-width:0!important;padding:8px 0 6px!important;border:0!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dual-graphs .mv-dh-flow{border:0!important;border-top:1px solid #d4dfe7!important;padding:8px 0 0!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dual-graphs .mv-dh-plot{height:var(--mv-fit-plot-height,172px)!important;min-height:0!important;max-height:none!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dual-graphs .mv-dh-flow-choice{min-height:25px!important;margin-top:3px!important;margin-bottom:4px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dual-graphs .mv-dh-card-head{min-height:23px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dual-graphs .mv-dh-value{font-size:16px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-dual-graphs .mv-dh-foot{white-space:nowrap!important}
      #presentationPanel.mv-fit-no-scroll .presentation-pumps{margin-top:5px!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-flow-grid #presentationFlowReadings{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      #presentationPanel.mv-fit-no-scroll.mv-fit-flow-grid .presentation-flow-row span{text-overflow:clip!important}
    }
  `;
  document.head.appendChild(mvHistoryStyle);
  const mvHistorySection = document.createElement('section');
  mvHistorySection.className = 'mv-dual-history';
  mvHistorySection.setAttribute('aria-label', 'Histórico de nivel y flujo del tanque');
  mvHistorySection.innerHTML = `
    <div class="mv-dh-body">
      <section class="mv-dh-card mv-dh-level" aria-label="Gráfica de nivel">
        <div class="mv-dh-card-head"><span class="mv-dh-card-name"><i class="mv-dh-symbol" aria-hidden="true"></i>NIVEL</span><span class="mv-dh-value" id="mvDHLevelLatest">N/D</span></div>
        <div class="mv-dh-plot" id="mvDHLevelPlot" role="img" aria-label="Evolución reciente del nivel en metros"></div>
        <div class="mv-dh-foot"><span id="mvDHLevelCount">Consultando lecturas</span><span id="mvDHLevelTime">m</span></div>
      </section>
      <section class="mv-dh-card mv-dh-flow" aria-label="Gráfica de flujo">
        <div class="mv-dh-card-head"><span class="mv-dh-card-name"><i class="mv-dh-symbol" aria-hidden="true"></i>FLUJO</span><span class="mv-dh-value" id="mvDHFlowLatest">N/D</span></div>
        <select id="mvDHFlowChoice" class="mv-dh-flow-choice" aria-label="Medidor de flujo" hidden></select>
        <div class="mv-dh-plot" id="mvDHFlowPlot" role="img" aria-label="Evolución reciente del flujo en litros por segundo"></div>
        <div class="mv-dh-foot"><span id="mvDHFlowCount">Consultando lecturas</span><span id="mvDHFlowTime">LPS</span></div>
      </section>
    </div>
    <div id="mvDHMessage" class="mv-dh-message" hidden></div>`;
  const mvPumpsArea = presEl('presentationPumps');
  mvPumpsArea.parentElement.insertBefore(mvHistorySection, mvPumpsArea);
  const mvHistoryFlowChoice = document.getElementById('mvDHFlowChoice');
  const mvHistoryMessage = document.getElementById('mvDHMessage');
  const mvLevelPlot = document.getElementById('mvDHLevelPlot');
  const mvFlowPlot = document.getElementById('mvDHFlowPlot');
  const mvFlowCard = mvHistorySection.querySelector('.mv-dh-flow');
  const mvLevelLatest = document.getElementById('mvDHLevelLatest');
  const mvFlowLatest = document.getElementById('mvDHFlowLatest');
  const mvLevelCount = document.getElementById('mvDHLevelCount');
  const mvFlowCount = document.getElementById('mvDHFlowCount');
  const mvLevelTime = document.getElementById('mvDHLevelTime');
  const mvFlowTime = document.getElementById('mvDHFlowTime');

  let mvFitFrame = 0;
  function mvFitPresentationPanel() {
    const panel = presEl('presentationPanel');
    if (!panel) return;
    const desktop = window.innerWidth >= 701 && window.innerHeight >= 560;
    panel.classList.toggle('mv-fit-no-scroll', desktop);
    panel.classList.remove('mv-fit-tight', 'mv-fit-dense', 'mv-fit-overflow', 'mv-fit-dual-graphs');
    panel.style.removeProperty('--mv-fit-plot-height');
    panel.style.removeProperty('transform');
    const flowContainer = presEl('presentationFlowReadings');
    const flowCount = flowContainer ? flowContainer.children.length : 0;
    panel.classList.toggle('mv-fit-flow-grid', desktop && flowCount >= 3);
    const hasPumpBlocks = !!(presEl('presentationPumpList') && presEl('presentationPumpList').children.length && !presEl('presentationPumps').hidden);
    const hasFlowChart = mvFlowCard.style.display !== 'none' && !mvFlowCard.hidden;
    const minimalCard = !hasFlowChart && !flowCount && !hasPumpBlocks;
    panel.classList.toggle('mv-center-minimal', minimalCard);
    if (!desktop || panel.hidden || !presentation.active || !presentationUi.visible) return;
    panel.classList.toggle('mv-fit-dual-graphs', hasFlowChart);
    for (const grid of panel.querySelectorAll('.presentation-pump-grid')) {
      grid.classList.toggle('mv-fit-three', grid.children.length >= 5);
    }
    const available = Math.max(200, window.innerHeight - 18);
    const naturalHeight = () => Math.ceil(panel.getBoundingClientRect().height);
    const graphWidth = Math.max(240, mvLevelPlot.clientWidth || panel.clientWidth - 60);
    const initialHeight = hasFlowChart ? Math.max(150, Math.min(176, Math.round(graphWidth * .40))) : Math.max(190, Math.min(238, Math.round(graphWidth * .51)));
    panel.style.setProperty('--mv-fit-plot-height', initialHeight + 'px');
    let needed = naturalHeight();
    if (needed > available) {
      panel.classList.add('mv-fit-dense');
      needed = naturalHeight();
    }
    if (needed > available) {
      panel.classList.add('mv-fit-tight');
      needed = naturalHeight();
    }
    if (needed > available) {
      const minimumHeight = hasFlowChart ? 138 : 178;
      const reduced = Math.max(minimumHeight, initialHeight - Math.ceil((needed - available) * .28));
      panel.style.setProperty('--mv-fit-plot-height', reduced + 'px');
      needed = naturalHeight();
    }
    if (needed > available) {
      const scale = Math.max(.1, Math.min(1, (available - 2) / needed));
      panel.style.setProperty('transform', 'scale(' + scale.toFixed(5) + ')', 'important');
    }
    mvRefreshGraphGeometry();
  }
  function mvRefreshGraphGeometry() {
    if (!presentation.active || !presentationUi.visible || !mvHistoryCurrentTank) return;
    const plots = [mvLevelPlot, mvFlowPlot];
    const stale = plots.some(plot => {
      if (!plot.querySelector('svg') || plot.closest('.mv-dh-card').style.display === 'none') return false;
      const width = Math.max(200, Math.round(plot.clientWidth || 380));
      const height = Math.max(128, Math.round(plot.clientHeight || 145));
      return plot.dataset.mvChartSize !== width + 'x' + height;
    });
    if (stale) {
      mvHistorySignature = '';
      mvRenderTankHistory(mvHistoryCurrentTank);
    }
  }
  function mvScheduleFitPresentation() {
    if (mvFitFrame) cancelAnimationFrame(mvFitFrame);
    mvFitFrame = requestAnimationFrame(() => {
      mvFitFrame = 0;
      mvFitPresentationPanel();
      mvPositionAlertsForPresentation();
    });
  }
  window.addEventListener('resize', mvScheduleFitPresentation);
  presEl('presentationOptions').addEventListener('click', mvScheduleFitPresentation);

  const mvHistoryLiveFlowMap = {
    'FRAILE 1': { 'FL0000001': 'fraile1_salida' },
    'FRAILE 2': { 'FL0000001': 'fraile2_llegada' },
    'GARCÍA 1': { 'FL0000001': 'garcia1_red' },
    'GARCÍA 2': { 'FL0000001': 'garcia2_red' },
    'RECTANGULAR': { 'FL0000003': 'zuazua', 'FL0000001': 'castilla3_amp' },
    'CIRCULAR': { 'FL0000002': 'cienega' },
    'SANTA ROSA 2': { 'FL0000001': 'santarosa_llegada', 'FL0000003': 'pesqueria' }
  };

  function mvRecordLiveHistory() {
    const now = Date.now();
    for (const spec of tankSpecs) {
      if (spec.state !== 'actual') continue;
      let live = mvHistoryLiveSamples.get(spec.name);
      if (!live) {
        live = { nivel: [], flujos: new Map() };
        mvHistoryLiveSamples.set(spec.name, live);
      }
      let changed = false;
      const record = (series, value) => {
        if (!Number.isFinite(value)) return false;
        const last = series[series.length - 1];
        if (last && now - last[0] < 8000) return false;
        series.push([now, value]);
        const minTime = now - MV_HISTORY_WINDOW_MS - 120000;
        while (series.length && series[0][0] < minTime) series.shift();
        if (series.length > 520) series.splice(0, series.length - 520);
        return true;
      };
      if (record(live.nivel, spec.meters)) changed = true;
      const mapped = mvHistoryLiveFlowMap[spec.name] || {};
      for (const [id, key] of Object.entries(mapped)) {
        const entry = presentationFlowRecords[key];
        const value = entry ? numberOrNull(entry.lps) : null;
        if (!entry || entry.estado === 'sin_comunicacion' || entry.estado === 'sin_datos') continue;
        if (!live.flujos.has(id)) live.flujos.set(id, []);
        if (record(live.flujos.get(id), value)) changed = true;
      }
      if (changed) mvHistoryLiveVersions.set(spec.name, (mvHistoryLiveVersions.get(spec.name) || 0) + 1);
    }
  }

  function mvHistoryPoints(tank, measure, metric, flowId) {
    const from = Date.now() - MV_HISTORY_WINDOW_MS;
    const csv = measure && Array.isArray(measure.puntos) ? measure.puntos : [];
    const live = mvHistoryLiveSamples.get(tank);
    const current = live ? metric === 'nivel' ? live.nivel : live.flujos.get(flowId) || [] : [];
    const points = csv.concat(current).filter(point => Array.isArray(point) && Number.isFinite(point[0]) && Number.isFinite(point[1]) && point[0] >= from);
    points.sort((a, b) => a[0] - b[0]);
    return points;
  }

  function mvHistoryEmpty(plot, message) {
    plot.replaceChildren();
    const el = document.createElement('div');
    el.className = 'mv-dh-empty';
    el.textContent = message;
    plot.appendChild(el);
  }

  function mvHistoryChart(plot, samples, unit, hue) {
    const endTime = Date.now();
    const startTime = endTime - MV_HISTORY_WINDOW_MS;
    const recent = samples.filter(item => Array.isArray(item) && Number.isFinite(item[0]) && Number.isFinite(item[1]) && item[0] >= startTime && item[0] <= endTime + 60000).sort((a, b) => a[0] - b[0]);
    if (!recent.length) return null;
    const values = recent.map(point => point[1]);
    const minValue = Math.min(...values), maxValue = Math.max(...values);
    const spread = Math.max(unit === 'm' ? .11 : 2, (maxValue - minValue) * .20);
    const low = Math.max(0, minValue - spread), high = Math.max(maxValue + spread, low + (unit === 'm' ? .2 : 3));
    const W = Math.max(200, Math.round(plot.clientWidth || 380)), H = Math.max(128, Math.round(plot.clientHeight || 145)), L = 43, R = 11, T = 11, B = 24;
    const pw = W - L - R, ph = H - T - B;
    const xAt = t => L + (t - startTime) / (endTime - startTime) * pw;
    const yAt = v => T + (high - v) / (high - low) * ph;
    const coords = recent.map(point => [xAt(point[0]), yAt(point[1])]);
    let grid = '';
    const color = hue === 'flow' ? '#626c75' : '#0058b7';
    for (let i = 0; i <= 3; i++) {
      const y = T + ph * i / 3;
      const value = high - (high - low) * i / 3;
      grid += `<line x1="${L}" x2="${W - R}" y1="${y.toFixed(2)}" y2="${y.toFixed(2)}" stroke="#d5e0e7" stroke-width=".85"/>`;
      grid += `<text x="${L - 6}" y="${(y + 3.6).toFixed(2)}" text-anchor="end" fill="#111111" font-size="10" font-family="Segoe UI,Arial">${unit === 'm' ? value.toFixed(2) : mvHistoryNumber.format(value)}</text>`;
    }
    for (let i = 0; i <= 3; i++) {
      const x = L + pw * i / 3;
      grid += `<line x1="${x.toFixed(2)}" x2="${x.toFixed(2)}" y1="${T}" y2="${T + ph}" stroke="#e7edf1" stroke-width=".85"/>`;
      const when = startTime + (endTime - startTime) * i / 3;
      grid += `<text x="${x.toFixed(2)}" y="${H - 5}" text-anchor="${i === 0 ? 'start' : i === 3 ? 'end' : 'middle'}" fill="#111111" font-size="10" font-family="Segoe UI,Arial">${mvHistoryFormatTime(when)}</text>`;
    }
    let strokes = '', segment = [];
    const flush = () => {
      if (!segment.length) return;
      const path = segment.map((point, index) => (index ? 'L' : 'M') + point[0].toFixed(2) + ',' + point[1].toFixed(2)).join(' ');
      if (segment.length > 1) {
        const base = T + ph;
        strokes += `<path d="${path} L${segment[segment.length - 1][0].toFixed(2)},${base} L${segment[0][0].toFixed(2)},${base} Z" fill="${color}" fill-opacity="1"/>`;
        strokes += `<path d="${path}" fill="none" stroke="${color}" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>`;
      } else strokes += `<circle cx="${segment[0][0].toFixed(2)}" cy="${segment[0][1].toFixed(2)}" r="2.5" fill="${color}"/>`;
      segment = [];
    };
    for (let i = 0; i < coords.length; i++) {
      if (i && recent[i][0] - recent[i - 1][0] > 20 * 60000) flush();
      segment.push(coords[i]);
    }
    flush();
    const last = coords[coords.length - 1];
    plot.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="presentation">${grid}${strokes}<circle cx="${last[0].toFixed(2)}" cy="${last[1].toFixed(2)}" r="3.1" fill="#fff" stroke="${color}" stroke-width="1.8"/><g class="mv-dh-cursor" visibility="hidden"><line x1="0" x2="0" y1="${T}" y2="${T + ph}" stroke="${color}" stroke-dasharray="3 3" stroke-opacity=".7"/><circle cx="0" cy="0" r="4.4" fill="white" stroke="${color}" stroke-width="2"/></g></svg><div class="mv-dh-tooltip" hidden></div>`;
    plot.dataset.mvChartSize = W + 'x' + H;
    const svg = plot.querySelector('svg');
    const cursor = svg.querySelector('.mv-dh-cursor');
    const guide = cursor.querySelector('line');
    const circle = cursor.querySelector('circle');
    const tooltip = plot.querySelector('.mv-dh-tooltip');
    const hide = () => { cursor.setAttribute('visibility', 'hidden'); tooltip.hidden = true; };
    svg.addEventListener('pointermove', event => {
      const bounds = svg.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / Math.max(1, bounds.width) * W;
      if (x < L || x > W - R) return hide();
      const selectedTime = startTime + (x - L) / pw * (endTime - startTime);
      let left = 0, right = recent.length - 1;
      while (left < right) {
        const middle = (left + right) >>> 1;
        if (recent[middle][0] < selectedTime) left = middle + 1;
        else right = middle;
      }
      let index = left;
      if (index > 0 && Math.abs(recent[index - 1][0] - selectedTime) < Math.abs(recent[index][0] - selectedTime)) index--;
      if (Math.abs(recent[index][0] - selectedTime) > 20 * 60000) return hide();
      const point = coords[index];
      cursor.setAttribute('visibility', 'visible');
      guide.setAttribute('x1', point[0].toFixed(2));
      guide.setAttribute('x2', point[0].toFixed(2));
      circle.setAttribute('cx', point[0].toFixed(2));
      circle.setAttribute('cy', point[1].toFixed(2));
      tooltip.textContent = mvHistoryFormatTime(recent[index][0]) + ' · ' + (unit === 'm' ? recent[index][1].toFixed(2) : mvHistoryNumber.format(recent[index][1])) + ' ' + unit;
      const px = point[0] / W * bounds.width;
      tooltip.style.left = Math.min(bounds.width - 40, Math.max(40, px)) + 'px';
      tooltip.style.top = Math.max(28, point[1] / H * bounds.height) + 'px';
      tooltip.hidden = false;
    });
    svg.addEventListener('pointerleave', hide);
    return { count: recent.length, latest: recent[recent.length - 1][0], latestValue: recent[recent.length - 1][1] };
  }

  function mvRenderHistoryMeasure(plot, measure, unit, hue, valueEl, countEl, timeEl, fallback, tank, flowId) {
    const samples = mvHistoryPoints(tank, measure, hue === 'flow' ? 'flujo' : 'nivel', flowId);
    const chart = mvHistoryChart(plot, samples, unit, hue);
    if (!chart) {
      mvHistoryEmpty(plot, fallback);
      valueEl.textContent = 'N/D';
      countEl.textContent = 'Esperando lecturas recientes';
      timeEl.textContent = unit;
      return;
    }
    valueEl.replaceChildren();
    valueEl.append(unit === 'm' ? chart.latestValue.toFixed(2) : mvHistoryNumber.format(chart.latestValue));
    const suffix = document.createElement('small');
    suffix.textContent = ' ' + unit;
    valueEl.appendChild(suffix);
    countEl.textContent = chart.count + ' lecturas recientes';
    timeEl.textContent = 'Última ' + mvHistoryFormatTime(chart.latest);
  }

  function mvRenderTankHistory(tank) {
    const stored = mvHistoryCache.get(tank);
    const data = stored && stored.data;
    const flowSeries = data && Array.isArray(data.flujos) ? data.flujos : [];
    const mapped = mvHistoryLiveFlowMap[tank] || {};
    const firstMappedFlowId = Object.keys(mapped)[0] || '';
    const flow = flowSeries.find(item => item.id === mvHistoryFlowId) || flowSeries[0];
    const hasFlow = !!(flow || firstMappedFlowId);
    mvFlowCard.style.display = hasFlow ? '' : 'none';
    if (flow && flow.id !== mvHistoryFlowId) mvHistoryFlowId = flow.id;
    const options = flowSeries.map(item => item.id).join('|');
    const currentOptions = Array.from(mvHistoryFlowChoice.options).map(option => option.value).join('|');
    if (options !== currentOptions) {
      mvHistoryFlowChoice.replaceChildren();
      for (const item of flowSeries) {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.nombre || item.id;
        mvHistoryFlowChoice.appendChild(option);
      }
    }
    mvHistoryFlowChoice.hidden = flowSeries.length <= 1;
    if (flow) mvHistoryFlowChoice.value = mvHistoryFlowId;
    const signature = [tank, mvHistoryFlowId, stored ? stored.loadedAt : 0, mvHistoryLiveVersions.get(tank) || 0, Math.floor(Date.now() / 30000)].join('|');
    if (mvHistorySignature === signature) return;
    mvHistorySignature = signature;
    mvHistoryMessage.hidden = true;
    mvHistoryMessage.textContent = '';
    if (!stored || !data) {
      const msg = !stored ? 'Esperando datos del servidor...' : 'Sin historial disponible';
      const detail = !stored ? '' : stored.errorMessage || 'Sin respuesta del historial.';
      const mapped = mvHistoryLiveFlowMap[tank] || {};
      const firstFlow = Object.keys(mapped)[0] || '';
      mvFlowCard.style.display = firstFlow ? '' : 'none';
      mvRenderHistoryMeasure(mvLevelPlot, null, 'm', 'level', mvLevelLatest, mvLevelCount, mvLevelTime, msg, tank, '');
      if (firstFlow) mvRenderHistoryMeasure(mvFlowPlot, null, 'LPS', 'flow', mvFlowLatest, mvFlowCount, mvFlowTime, msg, tank, firstFlow);
      mvHistoryMessage.hidden = !detail;
      mvHistoryMessage.textContent = detail;
      mvScheduleFitPresentation();
      return;
    }
    mvRenderHistoryMeasure(mvLevelPlot, data.nivel, 'm', 'level', mvLevelLatest, mvLevelCount, mvLevelTime, 'Esperando nuevas lecturas de nivel', tank, '');
    if (hasFlow) mvRenderHistoryMeasure(mvFlowPlot, flow, 'LPS', 'flow', mvFlowLatest, mvFlowCount, mvFlowTime,
      'Esperando nuevas lecturas de flujo', tank, flow ? flow.id : firstMappedFlowId);
    if (!data.archivos_leidos) {
      mvHistoryMessage.hidden = false;
      mvHistoryMessage.textContent = 'No se localizaron lecturas históricas. Se mostrarán las mediciones actuales disponibles.';
    }
    mvScheduleFitPresentation();
  }

  function mvScheduleTankHistory(tank) {
    if (!presentation.active || !presentationUi.visible) return;
    if (mvHistoryCurrentTank !== tank) {
      mvHistoryCurrentTank = tank;
      mvHistoryFlowId = '';
      mvHistorySignature = '';
    }
    mvRenderTankHistory(tank);
    const existing = mvHistoryCache.get(tank);
    const freshness = existing && !existing.data ? 25000 : MV_HISTORY_TTL_MS;
    if (existing && Date.now() - existing.loadedAt < freshness) return;
    if (mvHistoryRequest && mvHistoryRequest.tank === tank) return;
    if (mvHistoryRequest) mvHistoryRequest.controller.abort();
    const controller = new AbortController();
    const current = { tank, controller };
    mvHistoryRequest = current;
    const timeout = setTimeout(() => controller.abort(), 15000);
    (async () => {
      let missing = 0;
      for (const endpoint of MV_HISTORY_API_PATHS) {
        let response;
        try {
          response = await fetch(endpoint + '?tanque=' + encodeURIComponent(tank) + '&horas=6&_=' + Date.now(), {
            credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
            headers: { Accept: 'application/json' }
          });
        } catch (error) {
          if (error.name === 'AbortError') throw error;
          missing++;
          continue;
        }
        if (response.status === 404) {
          missing++;
          continue;
        }
        if (!response.ok) throw new Error('El servicio de historial respondió HTTP ' + response.status + '.');
        let body;
        try {
          body = await response.json();
        } catch (error) {
          throw new Error('El archivo PHP no devolvió JSON válido. Revisa que se ejecute correctamente en el servidor.');
        }
        if (!body || body.ok !== true || body.tanque !== tank) {
          throw new Error(body && body.error ? String(body.error) : 'El servicio de historial devolvió datos no válidos.');
        }
        return body;
      }
      if (missing === MV_HISTORY_API_PATHS.length) {
        throw new Error('Error 404: no se encuentra monterreyv_3d_historial.php en Telemetria/Php. Comprueba que esté instalado en el servidor.');
      }
      throw new Error('No se pudo contactar con el servicio de historial.');
    })().then(body => {
      mvHistoryCache.set(tank, { data: body, loadedAt: Date.now() });
      if (presentation.active && presentationUi.visible && mvHistoryCurrentTank === tank) mvRenderTankHistory(tank);
    }).catch(error => {
      if (error.name === 'AbortError' && mvHistoryRequest !== current) return;
      const detail = error.name === 'AbortError'
        ? 'La consulta superó 15 segundos. Revisa el servidor de históricos.'
        : error.message || 'Error desconocido en el historial.';
      mvHistoryCache.set(tank, { data: null, errorMessage: detail, loadedAt: Date.now() });
      if (presentation.active && presentationUi.visible && mvHistoryCurrentTank === tank) mvRenderTankHistory(tank);
    }).finally(() => {
      clearTimeout(timeout);
      if (mvHistoryRequest === current) mvHistoryRequest = null;
    });
  }
  mvHistoryFlowChoice.addEventListener('change', () => {
    mvHistoryFlowId = mvHistoryFlowChoice.value;
    mvHistorySignature = '';
    mvRenderTankHistory(mvHistoryCurrentTank);
  });
  window.setInterval(() => {
    if (presentation.active && presentationUi.visible && mvHistoryCurrentTank) {
      mvHistorySignature = '';
      mvRenderTankHistory(mvHistoryCurrentTank);
      mvScheduleTankHistory(mvHistoryCurrentTank);
    }
  }, 30000);

  function presentationData() {
    if (!presentation.active || mvBriefTank(presentation.index)) return;
    const spec = tankSpecs[presentation.index];
    if (!spec) return;
    const fmt = n => Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    presEl('presentationCount').textContent = 'TANQUE ' + (presentation.step + 1) + ' DE ' + presentationEligibleIndices.length;
    presEl('presentationName').textContent = shortNames[spec.name] || spec.name;
    presEl('presentationLevel').textContent = hasReceivedData && Number.isFinite(spec.meters) ? fmt(spec.meters) + ' m' : 'N/D';
    const delta = spec.delta, direction = mvTrendDirection(delta);
    const dtxt = direction === null ? 'N/D' : mvTrendDisplay(delta);
    const d = presEl('presentationDelta'); d.textContent = hasReceivedData ? dtxt : 'N/D'; d.className = 'presentation-primary-value ' + (hasReceivedData && direction !== null ? direction : 'warn');
    renderPresentationFlows(spec.name);
    const c = presEl('presentationConnection');
    const com = spec.state;
    c.textContent = !hasReceivedData ? 'Sin lecturas' : !presentation.sourceFresh ? 'Conexión no confirmada' :
      com === 'actual' ? 'Actual' : com === 'sin_comunicacion' ? 'Sin comunicación' : com === 'sin_datos' ? 'Sin datos' : com || 'N/D';
    c.className = (!presentation.sourceFresh || com === 'sin_comunicacion' || com === 'sin_datos') ? 'warn' : '';
    renderPresentationPumps(spec.name);
    mvScheduleTankHistory(spec.name);
    mvScheduleFitPresentation();
  }


  const presentationAngleCache = new Map();
  function tankCameraTarget(p, yaw, forPresentation) {
    const narrow = canvas.clientWidth < 850;
    const lateral = forPresentation && presentationUi.visible && p.name !== mvBriefTankName && !narrow ? canvas.clientWidth < 1150 ? 2.20 : 3.15 : 0;
    return [p.x + Math.sin(yaw) * lateral, p.baseY + p.height * .51, p.z - Math.cos(yaw) * lateral];
  }
  function cameraFromPose(pose) {
    const sp = Math.sin(pose.pitch);
    return [pose.target[0] + pose.dist * sp * Math.cos(pose.yaw), pose.target[1] + pose.dist * Math.cos(pose.pitch), pose.target[2] + pose.dist * sp * Math.sin(pose.yaw)];
  }
  function poseFromCamera(eye, target) {
    const dx = eye[0] - target[0], dy = eye[1] - target[1], dz = eye[2] - target[2];
    return { yaw: Math.atan2(dz, dx), pitch: Math.atan2(Math.hypot(dx, dz), dy), target: [...target], dist: Math.max(1, Math.hypot(dx, dy, dz)) };
  }
  function safeCameraScore(index, yaw, target, dist, pitch) {
    const subject = tankLabels[index];
    const eye = cameraFromPose({ yaw, pitch, target, dist });
    const rayX = subject.x - eye[0], rayZ = subject.z - eye[2];
    const ray2 = Math.max(.001, rayX * rayX + rayZ * rayZ);
    const eyeToTank = Math.sqrt(ray2);
    let score = 1.8 * (1 - Math.cos(yaw - 1.28));
    for (let i = 0; i < tankLabels.length; i++) {
      const other = tankLabels[i];
      const dx = other.x - eye[0], dz = other.z - eye[2];
      const cameraGap = Math.hypot(dx, dz);
      const outer = other.wallRadius + .85;
      if (cameraGap < outer) score += 2500 * (outer - cameraGap + .4);
      if (i === index) continue;
      const t = (dx * rayX + dz * rayZ) / ray2;
      if (t <= .015 || t >= 1.04) continue;
      const crossGap = Math.hypot(dx - rayX * t, dz - rayZ * t);
      const limit = other.wallRadius + subject.wallRadius * (t > .65 ? .75 : .50);
      if (crossGap < limit) score += 175 * (limit - crossGap) ** 2 * (1.15 - Math.max(0, t) * .25);
    }
    for (const group of pumpGroups) {
      for (const point of group.coords) {
        const dx = point[0] - eye[0], dz = point[1] - eye[2];
        if (Math.hypot(dx, dz) < 1.3) score += 55;
        const t = (dx * rayX + dz * rayZ) / ray2;
        if (t <= 0 || t >= .97) continue;
        const crossGap = Math.hypot(dx - rayX * t, dz - rayZ * t);
        if (crossGap < 1.15) score += 11 * (1.15 - crossGap) ** 2;
      }
    }
    const center = [0, .0, .5];
    const outX = subject.x - center[0], outZ = subject.z - center[2];
    const outward = Math.hypot(outX, outZ);
    if (outward > 2) score += 2.0 * (1 - (Math.cos(yaw) * outX + Math.sin(yaw) * outZ) / outward);
    if (eyeToTank < subject.wallRadius + 2.1) score += 500;
    return score;
  }
  function presentationClearAngle(index) {
    if (presentationAngleCache.has(index)) return presentationAngleCache.get(index);
    const subject = tankLabels[index];
    const pitch = 1.34;
    const distance = Math.max(16.1, subject.radius * 9.05);
    let bestYaw = 1.28, bestScore = Infinity;
    for (let step = 0; step < 144; step++) {
      const yaw = step * Math.PI * 2 / 144;
      const target = tankCameraTarget(subject, yaw, true);
      const score = safeCameraScore(index, yaw, target, distance, pitch);
      if (score < bestScore) { bestScore = score; bestYaw = yaw; }
    }
    presentationAngleCache.set(index, bestYaw);
    return bestYaw;
  }
  function presentationPose(index) {
    const p = tankLabels[index];
    const yaw = presentationClearAngle(index);
    const target = tankCameraTarget(p, yaw, true);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const portrait = width < 700 && height > width;
    const compact = !portrait && height <= 520 && width <= 1100;
    const minimum = portrait ? 24.6 : compact ? 20.2 : width < 850 ? 17.6 : 16.1;
    const dist = Math.max(minimum, p.radius * (portrait ? 12.3 : compact ? 10.2 : 9.05));
    return { yaw, pitch: 1.34, target, dist };
  }
  function craneCameraPose(from, to, progress) {
    const t = Math.max(0, Math.min(1, progress));
    const smooth = x => x * x * (3 - 2 * x);
    const a = cameraFromPose(from), b = cameraFromPose(to);
    const high = Math.max(15.5, a[1], b[1]);
    let eye;
    if (t < .28) {
      const u = smooth(t / .28);
      eye = [a[0], a[1] + (high - a[1]) * u, a[2]];
    } else if (t < .72) {
      const u = smooth((t - .28) / .44);
      eye = [a[0] + (b[0] - a[0]) * u, high, a[2] + (b[2] - a[2]) * u];
    } else {
      const u = smooth((t - .72) / .28);
      eye = [b[0], high + (b[1] - high) * u, b[2]];
    }
    const u = smooth(t);
    const target = from.target.map((v, i) => v + (to.target[i] - v) * u);
    return poseFromCamera(eye, target);
  }

  const guidedTour = {
    active: false,
    route: [],
    samples: [],
    totalLength: 0,
    distance: 0,
    speed: 3.7,
    rate: 1,
    entryClock: 0,
    eye: null,
    look: null,
    dist: 32,
    focusTankIndex: null,
    phase: 'route',
    phaseClock: 0,
    panoramaClock: 0,
    panoramaDuration: 34,
    panoramaYawStart: 1.43,
    moveFromEye: null,
    moveFromLook: null
  };
  const panoramaHeading = document.createElement('div');
  panoramaHeading.id = 'mvPanoramaHeading';
  panoramaHeading.setAttribute('aria-hidden', 'true');
  panoramaHeading.setAttribute('role', 'button');
  panoramaHeading.setAttribute('tabindex', '0');
  panoramaHeading.setAttribute('aria-controls', 'controlsPanel');
  panoramaHeading.setAttribute('aria-expanded', 'false');
  panoramaHeading.title = 'Mostrar controles';
  const panoramaLogo = document.createElement('img');
  panoramaLogo.className = 'mv-panorama-logo';
  panoramaLogo.src = '/Telemetria/imagenes/logo_ayd_telemetria.png';
  panoramaLogo.alt = 'Servicios de Agua y Drenaje de Monterrey';
  panoramaLogo.decoding = 'async';
  const panoramaDivider = document.createElement('span');
  panoramaDivider.className = 'mv-panorama-divider';
  panoramaDivider.setAttribute('aria-hidden', 'true');
  const panoramaInfo = document.createElement('div');
  panoramaInfo.className = 'mv-panorama-info';
  const panoramaTitle = document.createElement('strong');
  panoramaTitle.className = 'mv-panorama-title';
  panoramaTitle.textContent = 'MONTERREY V';
  const panoramaSubtitle = document.createElement('span');
  panoramaSubtitle.className = 'mv-panorama-subtitle';
  panoramaSubtitle.textContent = 'RECORRIDO GENERAL · 14 TANQUES';
  const panoramaDateLine = document.createElement('div');
  panoramaDateLine.className = 'mv-panorama-date-line';
  const panoramaLiveLabel = document.createElement('span');
  panoramaLiveLabel.className = 'mv-panorama-live';
  panoramaLiveLabel.textContent = 'TIEMPO REAL';
  const panoramaClock = document.createElement('time');
  panoramaClock.className = 'mv-panorama-clock';
  panoramaClock.id = 'mvPanoramaClock';
  const panoramaDateFormatter = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Monterrey',
    day: '2-digit', month: 'short', year: 'numeric'
  });
  const panoramaTimeFormatter = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Monterrey',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
  function updatePanoramaClock() {
    const now = new Date();
    const date = panoramaDateFormatter.format(now).replace(/\./g, '').toUpperCase();
    const time = panoramaTimeFormatter.format(now).replace(/\u202f/g, ' ').toUpperCase();
    panoramaClock.dateTime = now.toISOString();
    panoramaClock.textContent = date + ' · ' + time;
  }
  function showPanoramaHeading() {
    panoramaHeading.classList.add('mv-panorama-visible');
    panoramaHeading.setAttribute('aria-hidden', 'false');
    updatePanoramaClock();
  }
  panoramaDateLine.append(panoramaLiveLabel, panoramaClock);
  panoramaInfo.append(panoramaTitle, panoramaSubtitle, panoramaDateLine);
  panoramaHeading.append(panoramaLogo, panoramaDivider, panoramaInfo);
  const panelIndicator = document.createElement('span');
  panelIndicator.className = 'mv-panel-indicator';
  panelIndicator.setAttribute('aria-hidden', 'true');
  panelIndicator.textContent = '⌃';
  panoramaHeading.append(panelIndicator);
  panoramaHeading.classList.add('mv-panorama-visible');
  panoramaHeading.setAttribute('aria-hidden', 'false');
  panoramaHeading.setAttribute('aria-label', 'Mostrar controles de Monterrey V');
  document.body.appendChild(panoramaHeading);
  updatePanoramaClock();
  window.setInterval(updatePanoramaClock, 1000);
  let manualCameraDistance = null;

  function makeHydraulicRoute() {
    const itinerary = [
      { name: 'LA CRUZ', nodes: [[1250, 310]] },
      { name: 'GARCÍA 2', nodes: [[1250, 361], [1275, 415], [1311, 438]] },
      { name: 'GARCÍA 1', nodes: [[1151, 438], [1088, 438], [976, 438]] },
      { name: 'FRAILE 2', nodes: [[894, 432], [831, 428], [701, 419]] },
      { name: 'FRAILE 3', nodes: [[690, 465], [639, 522], [480, 522], [480, 427]] },
      { name: 'FRAILE 4', nodes: [[383, 381], [385, 337]] },
      { name: 'FRAILE 5', nodes: [[204, 337]] },
      { name: 'FRAILE 1', nodes: [[199, 390], [206, 450], [215, 522]] },
      { name: 'ALIANZA REAL', nodes: [[75, 522], [22, 677], [22, 704], [88, 722], [258, 727]] },
      { name: 'NUEVA CASTILLA 1', nodes: [[390, 737], [327, 797], [350, 824], [507, 855]] },
      { name: 'NUEVA CASTILLA / AMP', nodes: [[520, 813], [553, 777], [602, 752]] },
      { name: 'RECTANGULAR', nodes: [[785, 752], [944, 752]] },
      { name: 'CIRCULAR', nodes: [[1036, 700], [1086, 685]] },
      { name: 'SANTA ROSA 2', nodes: [[1124, 730], [1161, 785], [1198, 850]] }
    ];
    const clean = [];
    for (const stop of itinerary) {
      for (const [x, z] of stop.nodes) {
        const point = [mapX(x), 1.02, mapZ(z)];
        const last = clean[clean.length - 1];
        if (!last || Math.hypot(point[0] - last[0], point[2] - last[2]) > .06) {
          clean.push(point);
        }
      }
    }
    return roundPath(clean.reverse(), 1.1);
  }

  function buildHydraulicSamples(route) {
    const result = [];
    let distance = 0;
    for (let i = 0; i < route.length; i++) {
      if (i) distance += Math.hypot(route[i][0] - route[i - 1][0], route[i][2] - route[i - 1][2]);
      result.push({ point: route[i], distance });
    }
    return result;
  }

  function sampleHydraulicRoute(distance) {
    const items = guidedTour.samples;
    if (!items.length) return [0, 1.02, 0];
    const total = guidedTour.totalLength;
    const d = Math.max(0, Math.min(total, distance));
    let low = 0;
    let high = items.length - 1;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (items[middle].distance < d) low = middle + 1;
      else high = middle;
    }
    if (low === 0) return [...items[0].point];
    const a = items[low - 1];
    const b = items[low];
    const fraction = (d - a.distance) / Math.max(.0001, b.distance - a.distance);
    return a.point.map((v, i) => v + (b.point[i] - v) * fraction);
  }

  function hydraulicTourCamera(distance) {
    const position = sampleHydraulicRoute(distance);
    const ahead = sampleHydraulicRoute(Math.min(guidedTour.totalLength, distance + 4.8));
    const behind = sampleHydraulicRoute(Math.max(0, distance - 2.1));
    let dx = ahead[0] - behind[0];
    let dz = ahead[2] - behind[2];
    const directionLength = Math.hypot(dx, dz) || 1;
    dx /= directionLength;
    dz /= directionLength;

    const height = 10.5 + .55 * Math.abs(dz);
    const trackEye = [position[0] - 6.45 - dx * 1.2, height, position[2] + 7.5 - dz * 1.2];
    const trackLook = [ahead[0] + dx * .52, 2.15, ahead[2] + dz * .52];
    let chosen = -1;
    let separation = Infinity;
    for (let i = 0; i < tankLabels.length; i++) {
      const p = tankLabels[i];
      const gap = Math.hypot(p.x - position[0], p.z - position[2]);
      if (gap < separation) { separation = gap; chosen = i; }
    }
    if (chosen >= 0 && separation < 3.35) {
      const tank = tankLabels[chosen];
      const strength = .27 * (1 - Math.min(1, separation / 3.35));
      trackLook[0] += (tank.x - trackLook[0]) * strength;
      trackLook[1] += (tank.baseY + tank.height * .47 - trackLook[1]) * strength;
      trackLook[2] += (tank.z - trackLook[2]) * strength;
    }
    return { eye: trackEye, look: trackLook, focus: separation < 2.9 ? chosen : null };
  }

  function startGuidedTour() {
    if (freeNavigationActive) setFreeNavigation(false);
    if (aroundOrbit.active) stopAroundOrbit(true);
    if (presentation.active) stopPresentation();
    guidedTour.route = makeHydraulicRoute();
    guidedTour.samples = buildHydraulicSamples(guidedTour.route);
    guidedTour.totalLength = guidedTour.samples.length ? guidedTour.samples[guidedTour.samples.length - 1].distance : 0;
    if (guidedTour.totalLength < 1) return;

    guidedTour.active = true;
    guidedTour.distance = 0;
    guidedTour.entryClock = 0;
    guidedTour.phase = 'route';
    guidedTour.phaseClock = 0;
    guidedTour.panoramaClock = 0;
    showPanoramaHeading(false);
    guidedTour.eye = cameraFromPose({ yaw: state.yaw, pitch: state.pitch, dist: state.dist, target: [...state.target] });
    guidedTour.look = [...state.target];
    guidedTour.dist = state.dist;
    guidedTour.focusTankIndex = null;
    manualCameraDistance = null;
    topViewSelected = false;
    state.userPanned = true;
    state.auto = true;
    presEl('spin').classList.add('active');
    presEl('spin').setAttribute('aria-pressed', 'true');
  }

  function stopGuidedTour(keepPose = true) {
    if (!guidedTour.active && !state.auto) return;
    guidedTour.active = false;
    guidedTour.eye = null;
    guidedTour.look = null;
    guidedTour.focusTankIndex = null;
    guidedTour.phase = 'route';
    showPanoramaHeading(false);
    state.auto = false;
    presEl('spin').classList.remove('active');
    presEl('spin').setAttribute('aria-pressed', 'false');
    if (keepPose) {
      state.userPanned = true;
      manualCameraDistance = state.dist / Math.max(.32, state.zoom);
    } else {
      manualCameraDistance = null;
      state.userPanned = false;
    }
  }

  function panoramicTourPose(yaw) {
    const pitch = .90;
    const fitted = fitPose(yaw, pitch);
    const distance = Math.max(fitted.dist + 2.5, fitted.dist * 1.11);
    return {
      eye: cameraFromPose({ yaw, pitch, dist: distance, target: fitted.target }),
      look: [...fitted.target]
    };
  }

  function smoothTourStep(value) {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  }

  function mixTourPoint(a, b, t) {
    return a.map((v, i) => v + (b[i] - v) * t);
  }

  function finishTourPhase() {
    if (guidedTour.phase === 'route') {
      guidedTour.phase = 'panorama-entry';
      guidedTour.phaseClock = 0;
      guidedTour.moveFromEye = [...guidedTour.eye];
      guidedTour.moveFromLook = [...guidedTour.look];
      const frame = fitPose(1.43, .87);
      const dx = guidedTour.eye[0] - frame.target[0];
      const dz = guidedTour.eye[2] - frame.target[2];
      let angle = Math.atan2(dz, dx);
      while (angle > Math.PI) angle -= Math.PI * 2;
      while (angle < -Math.PI) angle += Math.PI * 2;
      guidedTour.panoramaYawStart = angle;
      return;
    }
    if (guidedTour.phase === 'panorama-entry') {
      guidedTour.phase = 'panorama';
      guidedTour.panoramaClock = 0;
      showPanoramaHeading(true);
      return;
    }
    if (guidedTour.phase === 'panorama') {
      guidedTour.phase = 'route-return';
      guidedTour.phaseClock = 0;
      guidedTour.moveFromEye = [...guidedTour.eye];
      guidedTour.moveFromLook = [...guidedTour.look];
      guidedTour.distance = 0;
      guidedTour.focusTankIndex = null;
      return;
    }
    if (guidedTour.phase === 'route-return') {
      guidedTour.phase = 'route';
      guidedTour.phaseClock = 0;
      guidedTour.entryClock = 0;
      guidedTour.distance = 0;
      guidedTour.focusTankIndex = null;
    }
  }

  function tickGuidedTour(dt) {
    if (!guidedTour.active || !state.auto || presentation.active || !guidedTour.samples.length) return;
    dt *= guidedTour.rate;

    if (guidedTour.phase === 'route') {
      const entering = guidedTour.entryClock < 2.3;
      if (entering) {
        guidedTour.entryClock = Math.min(2.3, guidedTour.entryClock + dt);
      } else {
        guidedTour.distance = Math.min(guidedTour.totalLength, guidedTour.distance + guidedTour.speed * dt);
      }
      const pose = hydraulicTourCamera(guidedTour.distance);
      const ease = 1 - Math.exp(-dt * (entering ? 1.5 : 2.6));
      guidedTour.eye = mixTourPoint(guidedTour.eye, pose.eye, ease);
      guidedTour.look = mixTourPoint(guidedTour.look, pose.look, ease);
      guidedTour.eye[1] = Math.max(guidedTour.eye[1], 7.7);
      guidedTour.focusTankIndex = null;
      if (!entering && guidedTour.distance >= guidedTour.totalLength) {
        finishTourPhase();
      }
    } else if (guidedTour.phase === 'panorama-entry') {
      guidedTour.phaseClock = Math.min(4.6, guidedTour.phaseClock + dt);
      const t = smoothTourStep(guidedTour.phaseClock / 4.6);
      const target = panoramicTourPose(guidedTour.panoramaYawStart);
      guidedTour.eye = mixTourPoint(guidedTour.moveFromEye, target.eye, t);
      guidedTour.look = mixTourPoint(guidedTour.moveFromLook, target.look, t);
      guidedTour.eye[1] += Math.sin(t * Math.PI) * 2.6;
      if (guidedTour.phaseClock >= 4.6) finishTourPhase();
    } else if (guidedTour.phase === 'panorama') {
      guidedTour.panoramaClock = Math.min(guidedTour.panoramaDuration, guidedTour.panoramaClock + dt);
      const t = smoothTourStep(guidedTour.panoramaClock / guidedTour.panoramaDuration);
      const yaw = guidedTour.panoramaYawStart + t * Math.PI * 2;
      const target = panoramicTourPose(yaw);
      guidedTour.eye = target.eye;
      guidedTour.look = target.look;
      if (guidedTour.panoramaClock >= guidedTour.panoramaDuration) finishTourPhase();
    } else if (guidedTour.phase === 'route-return') {
      guidedTour.phaseClock = Math.min(4.8, guidedTour.phaseClock + dt);
      const t = smoothTourStep(guidedTour.phaseClock / 4.8);
      const target = hydraulicTourCamera(0);
      guidedTour.eye = mixTourPoint(guidedTour.moveFromEye, target.eye, t);
      guidedTour.look = mixTourPoint(guidedTour.moveFromLook, target.look, t);
      guidedTour.eye[1] += Math.sin(t * Math.PI) * 2.5;
      if (guidedTour.phaseClock >= 4.8) finishTourPhase();
    }

    if (!guidedTour.active || !guidedTour.eye || !guidedTour.look) return;
    const current = poseFromCamera(guidedTour.eye, guidedTour.look);
    state.yaw = current.yaw;
    state.pitch = current.pitch;
    state.target = [...current.target];
    state.dist = current.dist;
    guidedTour.dist = current.dist;
  }
  function presentationJump(index) {
    if (!tankSpecs.length) return;

    presentation.entryClock = 0;
    presentation.step = ((index % presentationEligibleIndices.length) + presentationEligibleIndices.length) % presentationEligibleIndices.length;
    presentation.index = presentationEligibleIndices[presentation.step];
    presentation.paused = false;
    presEl('presentationPause').textContent = 'Pausar';
    presentation.clock = 0;
    const brief = mvBriefTank(presentation.index);
    setPresentationInfoVisible(presentationUi.visible, false);
    if (brief) {
      mvHistoryCurrentTank = '';
      if (mvHistoryRequest) {
        mvHistoryRequest.controller.abort();
        mvHistoryRequest = null;
      }
    }
    const dest = presentationPose(presentation.index);
    presentation.transition = {
      t0: performance.now(), elapsed: 0, duration: brief ? 1450 : 2200,
      from: { yaw: state.yaw, pitch: state.pitch, target: [...state.target], dist: state.dist }, to: dest
    };
    if (!brief) presentationData();
    presEl('presentationProgress').style.width = '0%';
  }
  function startPresentation() {
    if (freeNavigationActive) setFreeNavigation(false);
    if (aroundOrbit.active) stopAroundOrbit(true);
    if (guidedTour.active) stopGuidedTour(true);
    topViewSelected = false;
    if (presentation.active || tankSpecs.length === 0) return;
    presentation.saved = { yaw: state.yaw, pitch: state.pitch, target: [...state.target], zoom: state.zoom, auto: state.auto, userPanned: state.userPanned };
    presentation.active = true; presentation.paused = false; presentation.sourceFresh = liveStatus.dataset.state !== 'error';
    state.auto = false; presEl('spin').classList.remove('active');
    setPresentationInfoVisible(true, false); presEl('presentationToggle').classList.add('active');
    presEl('presentationToggle').setAttribute('aria-pressed', 'true');
    presEl('presentationPause').textContent = 'Pausar';
    setPresentationControlsOpen(false);
    presentationJump(0);
    const panel = presEl('controlsPanel'), toggle = presEl('controlsToggle');
    if (panel && toggle) { panel.classList.remove('is-open'); panel.setAttribute('aria-hidden', 'true'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Mostrar controles'); }
  }
  function stopPresentation() {
    if (!presentation.active) return;
    presentation.active = false; presentation.transition = null;
    setPresentationControlsOpen(false);
    setPresentationInfoVisible(false, false); presEl('presentationToggle').classList.remove('active');
    presEl('presentationToggle').setAttribute('aria-pressed', 'false');
    if (presentation.saved) {
      state.yaw = presentation.saved.yaw; state.pitch = presentation.saved.pitch;
      state.target = [...presentation.saved.target]; state.zoom = presentation.saved.zoom;
      state.auto = presentation.saved.auto; state.userPanned = presentation.saved.userPanned; presEl('spin').classList.toggle('active', state.auto);
    }
  }
  function tickPresentation(now, dt) {
    if (!presentation.active) return;
    if (presentation.entryClock > 0) {
      if (!presentation.paused) presentation.entryClock = Math.max(0, presentation.entryClock - dt * presentation.rate);
      if (presentation.entryClock === 0) {
        setPresentationInfoVisible(true, false);
        presentationJump(0);
      }
      return;
    }
    if (!presentation.paused) presentation.clock += dt * presentation.rate;
    if (presentation.transition) {
      const tr = presentation.transition;
      tr.elapsed = (tr.elapsed || 0) + dt * presentation.rate * 1000;
      const t = Math.max(0, Math.min(1, tr.elapsed / tr.duration));
      const u = t * t * t * (t * (t * 6 - 15) + 10);
      const pose = craneCameraPose(tr.from, tr.to, u);
      state.yaw = pose.yaw;
      state.pitch = pose.pitch;
      state.target = [...pose.target];
      presentation.dist = pose.dist;
      if (t >= 1) presentation.transition = null;
    } else {
      const pose = presentationPose(presentation.index);
      state.yaw = pose.yaw;
      state.pitch = pose.pitch;
      state.target = [...pose.target]; presentation.dist = pose.dist;
    }
    const stopAfter = mvBriefTank(presentation.index) ? 3.3 : presentation.interval;
    presEl('presentationProgress').style.width = Math.min(100, presentation.clock / stopAfter * 100).toFixed(1) + '%';
    if (!presentation.paused && presentation.clock >= stopAfter) {
      presentationJump(presentation.step + 1);
    }
  }
  const aroundOrbitButton = document.createElement('button');
  aroundOrbitButton.id = 'mvOrbitAround';
  aroundOrbitButton.type = 'button';
  aroundOrbitButton.textContent = '↻ Giro alrededor';
  aroundOrbitButton.title = 'Girar continuamente alrededor de todo Monterrey V';
  aroundOrbitButton.setAttribute('aria-label', 'Iniciar giro alrededor de todo el mapa');
  aroundOrbitButton.setAttribute('aria-pressed', 'false');
  presEl('spin').insertAdjacentElement('afterend', aroundOrbitButton);

  let eveningEnabled = false;
  let eveningBlend = 0;
  const dayModeHtml = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg><span>Modo día</span>';
  const nightModeHtml = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.9 13.2A9 9 0 0 1 10.8 3.1a9 9 0 1 0 10.1 10.1Z"/></svg><span>Modo noche</span>';
  const modeToggle = document.createElement('button');
  modeToggle.id = 'mvModeToggle';
  modeToggle.type = 'button';
  modeToggle.style.setProperty('display', 'flex', 'important');
  modeToggle.style.setProperty('align-items', 'center', 'important');
  modeToggle.style.setProperty('justify-content', 'center', 'important');
  modeToggle.style.setProperty('text-align', 'center', 'important');
  modeToggle.style.setProperty('gap', '8px', 'important');
  modeToggle.style.setProperty('min-width', '0', 'important');
  modeToggle.style.setProperty('justify-self', 'stretch', 'important');
  modeToggle.style.setProperty('box-sizing', 'border-box', 'important');
  function refreshModeToggle() {
    modeToggle.classList.toggle('active', eveningEnabled);
    modeToggle.setAttribute('aria-pressed', String(eveningEnabled));
    modeToggle.innerHTML = eveningEnabled ? nightModeHtml : dayModeHtml;
    modeToggle.setAttribute('aria-label', eveningEnabled ? 'Cambiar a iluminación de día' : 'Cambiar a iluminación de noche');
    modeToggle.title = eveningEnabled ? 'Cambiar a modo día' : 'Cambiar a modo noche';
  }
  modeToggle.addEventListener('click', () => {
    eveningEnabled = !eveningEnabled;
    refreshModeToggle();
  });
  document.getElementById('controlsPanel').appendChild(modeToggle);
  refreshModeToggle();
  const fullScreenButton = document.getElementById('full');
  if (fullScreenButton && fullScreenButton.parentElement === modeToggle.parentElement) {
    fullScreenButton.insertAdjacentElement('beforebegin', modeToggle);
  }
  const freeNavigationButton = document.createElement('button');
  freeNavigationButton.id = 'mvManosLibres';
  freeNavigationButton.type = 'button';
  freeNavigationButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-right:5px" aria-hidden="true"><path d="M8 13V6a2 2 0 0 1 4 0v5-7a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v9c0 4-3 7-7 7h-2c-2 0-3.8-1-5-2.6L2.4 14a2 2 0 0 1 3-2.6L8 14"/></svg><span>Manos libres</span>';
  freeNavigationButton.setAttribute('aria-pressed', 'false');
  freeNavigationButton.setAttribute('aria-label', 'Activar navegación libre con el mouse');
  freeNavigationButton.title = 'Activar: izquierdo para mover, derecho para girar y rueda para zoom';
  aroundOrbitButton.insertAdjacentElement('afterend', freeNavigationButton);
  let freeNavigationActive = false;
  let freeNavigationMode = 'move';
  const freeNavigationButtonLabel = freeNavigationButton.querySelector('span');
  function updateFreeNavigationControls() {
    freeNavigationButtonLabel.textContent = !freeNavigationActive ? 'Manos libres' : freeNavigationMode === 'rotate' ? 'Manos libres: Girar' : 'Manos libres: Mover';
    freeNavigationButton.setAttribute('aria-label', !freeNavigationActive ? 'Activar manos libres para mover el mapa' : freeNavigationMode === 'move' ? 'Manos libres en Mover. Pulsar para girar con el mouse' : 'Manos libres en Girar. Pulsar para salir');
    freeNavigationButton.title = !freeNavigationActive ? 'Clic: Mover · Segundo clic: Girar · Tercer clic: Salir' : freeNavigationMode === 'move' ? 'Clic izquierdo: mover · Derecho o Mayús: girar · Clic otra vez en Manos libres: Girar' : 'Clic izquierdo: girar · Derecho o Mayús: mover · Clic otra vez en Manos libres: Salir';
    freeNavigationButton.dataset.navigationMode = freeNavigationActive ? freeNavigationMode : 'off';
    canvas.style.cursor = !freeNavigationActive ? '' : freeNavigationMode === 'rotate' ? 'move' : 'grab';
  }
  const freeMoveBounds = {
    minX: Math.min(...fitSamples.map(point => point[0])) - 16,
    maxX: Math.max(...fitSamples.map(point => point[0])) + 16,
    minZ: Math.min(...fitSamples.map(point => point[2])) - 16,
    maxZ: Math.max(...fitSamples.map(point => point[2])) + 16
  };
  function setFreeNavigation(active) {
    if (active) {
      if (presentation.active) stopPresentation();
      if (guidedTour.active) stopGuidedTour(true);
      if (aroundOrbit.active) stopAroundOrbit(true);
      state.auto = false;
      state.userPanned = true;
      topViewSelected = false;
      manualCameraDistance = state.dist / Math.max(.08, state.zoom);
      document.getElementById('spin').classList.remove('active');
    } else if (freeNavigationActive) {
      const zoom = Math.max(.32, Math.min(2.4, state.zoom));
      manualCameraDistance = state.dist / zoom;
      state.zoom = zoom;
    }
    freeNavigationActive = !!active;
    freeNavigationMode = 'move';
    freeNavigationButton.classList.toggle('active', freeNavigationActive);
    freeNavigationButton.setAttribute('aria-pressed', String(freeNavigationActive));
    updateFreeNavigationControls();
  }
  freeNavigationButton.addEventListener('click', () => {
    if (!freeNavigationActive) setFreeNavigation(true);
    else if (freeNavigationMode === 'move') {
      freeNavigationMode = 'rotate';
      updateFreeNavigationControls();
    } else setFreeNavigation(false);
  });

  const aroundOrbit = {
    active: false,
    angle: state.yaw,
    pitch: 1.20,
    elapsed: 0,
    zoomScale: 1.11,
    radiansPerSecond: Math.PI * 2 / 72
  };

  function adjustAroundOrbitZoom(factor) {
    aroundOrbit.zoomScale = Math.max(.68, Math.min(2.5, aroundOrbit.zoomScale * factor));
  }

  function adjustAroundOrbitPitch(deltaPixels) {
    aroundOrbit.pitch = Math.max(.72, Math.min(1.48, aroundOrbit.pitch - deltaPixels * .004));
    state.pitch = aroundOrbit.pitch;
  }

  function stopAroundOrbit(keepPose = true) {
    if (!aroundOrbit.active) return;
    aroundOrbit.active = false;
    aroundOrbitButton.classList.remove('active');
    aroundOrbitButton.setAttribute('aria-pressed', 'false');
    aroundOrbitButton.setAttribute('aria-label', 'Iniciar giro alrededor de todo el mapa');
    if (keepPose) {
      state.userPanned = true;
      manualCameraDistance = state.dist / Math.max(.32, state.zoom);
    } else {
      manualCameraDistance = null;
      state.userPanned = false;
    }
  }

  function startAroundOrbit() {
    if (freeNavigationActive) setFreeNavigation(false);
    if (presentation.active) stopPresentation();
    if (guidedTour.active) stopGuidedTour(true);
    state.auto = false;
    state.userPanned = true;
    topViewSelected = false;
    state.zoom = 1;
    manualCameraDistance = null;
    aroundOrbit.zoomScale = 1.11;
    aroundOrbit.active = true;
    aroundOrbit.angle = state.yaw;
    aroundOrbit.elapsed = 0;
    aroundOrbitButton.classList.add('active');
    aroundOrbitButton.setAttribute('aria-pressed', 'true');
    aroundOrbitButton.setAttribute('aria-label', 'Detener giro alrededor de todo el mapa');
  }

  function tickAroundOrbit(dt) {
    if (!aroundOrbit.active || presentation.active || guidedTour.active) return;
    aroundOrbit.elapsed += dt;
    const acceleration = Math.min(1, aroundOrbit.elapsed / 2);
    aroundOrbit.angle = (aroundOrbit.angle + dt * aroundOrbit.radiansPerSecond * guidedTour.rate * acceleration) % (Math.PI * 2);
    state.yaw = aroundOrbit.angle;
    const verticalMix = 1 - Math.exp(-dt * 2.2);
    state.pitch += (aroundOrbit.pitch - state.pitch) * verticalMix;
    const fitted = fitPose(state.yaw, state.pitch);
    const centerMix = 1 - Math.exp(-dt * 2.4);
    for (let i = 0; i < 3; i++) state.target[i] += (fitted.target[i] - state.target[i]) * centerMix;
  }

  aroundOrbitButton.addEventListener('click', () => {
    if (aroundOrbit.active) stopAroundOrbit(true);
    else startAroundOrbit();
  });

  const giroSpeedButton = document.createElement('button');
  giroSpeedButton.id = 'mvGiroSpeed';
  giroSpeedButton.type = 'button';
  giroSpeedButton.title = 'Cambiar velocidad del recorrido por tuberías y del giro alrededor';
  giroSpeedButton.textContent = 'Giro: Normal';
  giroSpeedButton.setAttribute('aria-label', 'Velocidad de Giro 3D: Normal. Cambiar a rápida');
  presEl('spin').insertAdjacentElement('afterend', giroSpeedButton);
  giroSpeedButton.addEventListener('click', () => {
    guidedTour.rate = guidedTour.rate === 1 ? 1.8 : 1;
    const fast = guidedTour.rate > 1;
    giroSpeedButton.textContent = fast ? 'Giro: Rápida' : 'Giro: Normal';
    giroSpeedButton.setAttribute('aria-label', fast ? 'Velocidad de Giro 3D: Rápida. Cambiar a normal' : 'Velocidad de Giro 3D: Normal. Cambiar a rápida');
    giroSpeedButton.setAttribute('aria-pressed', String(fast));
  });
  giroSpeedButton.setAttribute('aria-pressed', 'false');
  const controlsOrder = [
    'reset', 'top', 'zoomIn', 'zoomOut', 'full',
    'spin', 'mvGiroSpeed', 'mvOrbitAround', 'mvManosLibres', 'presentationToggle',
    'presentationInfoToggle', 'water', 'flowSpeed', 'flowLabelsToggle', 'levelsToggle',
    'labelsToggle', 'alertsVisibilityToggle', 'mvModeToggle', 'dateTimeVisibilityToggle'
  ];
  const controlsPanel = presEl('controlsPanel');
  controlsOrder.forEach(id => {
    const control = document.getElementById(id);
    if (control && control.parentElement === controlsPanel) controlsPanel.appendChild(control);
  });
  const compactControlsLayout = document.createElement('style');
  compactControlsLayout.id = 'mtyvControlsCompactFinal';
  compactControlsLayout.textContent = `
    .controls-dock #controlsPanel.is-open{
      display:grid!important;
      grid-template-columns:repeat(10,minmax(0,1fr))!important;
      grid-auto-flow:row!important;
      width:min(1050px,calc(100vw - 28px))!important;
      max-width:calc(100vw - 28px)!important;
      min-width:0!important;
      margin:0 auto!important;
      box-sizing:border-box!important;
      padding:9px!important;
      gap:7px!important;
      align-items:stretch!important;
      justify-content:center!important;
      max-height:calc(100dvh - 135px)!important;
      overflow-x:hidden!important;
      overflow-y:auto!important;
    }
    .controls-dock #controlsPanel.is-open > button{
      grid-column:span 2!important;
      grid-row:auto!important;
      order:0!important;
      box-sizing:border-box!important;
      width:100%!important;
      min-width:0!important;
      height:46px!important;
      min-height:46px!important;
      padding:5px 7px!important;
      display:flex!important;
      justify-content:center!important;
      align-items:center!important;
      gap:6px!important;
      text-align:center!important;
      white-space:normal!important;
      font-size:clamp(12px,.85vw,14px)!important;
      line-height:1.15!important;
    }
    .controls-dock #controlsPanel.is-open > button svg{
      flex-shrink:0!important;
    }
    .controls-dock #controlsPanel.is-open > #labelsToggle{
      grid-column:2/span 2!important;
    }
    @media(max-width:1050px){
      .controls-dock #controlsPanel.is-open{
        grid-template-columns:repeat(8,minmax(0,1fr))!important;
        width:min(760px,calc(100vw - 24px))!important;
        gap:6px!important;
        padding:8px!important;
      }
      .controls-dock #controlsPanel.is-open > button{height:43px!important;min-height:43px!important;font-size:12.5px!important}
      .controls-dock #controlsPanel.is-open > #labelsToggle{grid-column:span 2!important}
      .controls-dock #controlsPanel.is-open > #alertsVisibilityToggle{grid-column:2/span 2!important}
    }
    @media(max-width:680px){
      .controls-dock #controlsPanel.is-open{
        grid-template-columns:repeat(6,minmax(0,1fr))!important;
        width:calc(100vw - 18px)!important;
        padding:7px!important;
        gap:5px!important;
      }
      .controls-dock #controlsPanel.is-open > #alertsVisibilityToggle{grid-column:span 2!important}
      .controls-dock #controlsPanel.is-open > #dateTimeVisibilityToggle{grid-column:3/span 2!important}
    }
    @media(max-width:440px){
      .controls-dock #controlsPanel.is-open{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:5px!important}
      .controls-dock #controlsPanel.is-open > button{min-height:42px!important;height:auto!important;padding:6px 4px!important;font-size:11.5px!important}
      .controls-dock #controlsPanel.is-open > #dateTimeVisibilityToggle{grid-column:span 2!important}
      .controls-dock #controlsPanel.is-open > #dateTimeVisibilityToggle{grid-column:2/span 2!important}
    }
  `;
  document.head.appendChild(compactControlsLayout);

  const presentationSpeedButton = document.createElement('button');
  presentationSpeedButton.id = 'mvPresentationSpeed';
  presentationSpeedButton.type = 'button';
  presentationSpeedButton.textContent = 'Vel.: Normal';
  presentationSpeedButton.title = 'Cambiar la velocidad del carrusel de 14 tanques';
  presentationSpeedButton.setAttribute('aria-label', 'Velocidad de presentación: Normal. Cambiar a rápida');
  presEl('presentationExtraControls').appendChild(presentationSpeedButton);
  presentationSpeedButton.addEventListener('click', () => {
    presentation.rate = presentation.rate === 1 ? 1.6 : 1;
    const fast = presentation.rate > 1;
    presentationSpeedButton.textContent = fast ? 'Vel.: Rápida' : 'Vel.: Normal';
    presentationSpeedButton.setAttribute('aria-label', fast ? 'Velocidad de presentación: Rápida. Cambiar a normal' : 'Velocidad de presentación: Normal. Cambiar a rápida');
    presentationSpeedButton.setAttribute('aria-pressed', String(fast));
  });
  presentationSpeedButton.setAttribute('aria-pressed', 'false');

  const presentationMenu = presEl('presentationOptions');
  presentationMenu.textContent = '⋯';
  presentationMenu.title = 'Mostrar controles y velocidad';
  presentationMenu.setAttribute('aria-label', 'Mostrar controles y velocidad');
  Object.assign(presentationMenu.style, {
    flex: '0 0 32px',
    width: '32px',
    height: '31px',
    minHeight: '31px',
    padding: '0',
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: '22px',
    lineHeight: '1'
  });
  presentationMenu.parentElement.style.justifyContent = 'flex-end';
  const presentationExtra = presEl('presentationExtraControls');
  presentationExtra.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
  presentationSpeedButton.style.width = '100%';

  presEl('presentationToggle').addEventListener('click', () => presentation.active ? stopPresentation() : startPresentation());
  presEl('presentationClose').addEventListener('click', stopPresentation);
  presEl('presentationPrev').addEventListener('click', () => { if (presentation.active) presentationJump(presentation.step - 1) });
  presEl('presentationNext').addEventListener('click', () => { if (presentation.active) presentationJump(presentation.step + 1); });
  presEl('presentationPause').addEventListener('click', () => {
    if (!presentation.active) return;
    presentation.paused = !presentation.paused;
    presEl('presentationPause').textContent = presentation.paused ? 'Continuar' : 'Pausar';
  });


  const shortNames = {
    'FRAILE 5': 'FRAILE 5',
    'FRAILE 4': 'FRAILE 4',
    'FRAILE 3': 'FRAILE 3',
    'FRAILE 2': 'FRAILE 2',
    'FRAILE 1': 'FRAILE 1',
    'ALIANZA REAL': 'ALIANZA REAL',
    'NUEVA CASTILLA / AMP': 'NUEVA CASTILLA AMP',
    'NUEVA CASTILLA 1': 'NUEVA CASTILLA 1',
    'RECTANGULAR': 'NUEVA CASTILLA RECTANGULAR',
    'CIRCULAR': 'NUEVA CASTILLA CIRCULAR',
    'SANTA ROSA 2': 'SANTA ROSA 2',
    'GARCÍA 1': 'GARCIA 1',
    'GARCÍA 2': 'GARCIA 2',
    'LA CRUZ': 'LA CRUZ'
  };
  const LABEL_TILE_W = 512, LABEL_TILE_H = 128, LABEL_COLS = 4, LABEL_ROWS = 16;
  const mvAtlasHD = mvUltra && gl.getParameter(gl.MAX_TEXTURE_SIZE) >= 8192 ? 3 : gl.getParameter(gl.MAX_TEXTURE_SIZE) >= 4096 && (typeof navigator.deviceMemory !== 'number' || navigator.deviceMemory >= 4) ? 2 : 1;
  const mvTextureAnisotropy = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') || gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
  const mvApplyTextureQuality = () => {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (mvTextureAnisotropy) gl.texParameterf(gl.TEXTURE_2D, mvTextureAnisotropy.TEXTURE_MAX_ANISOTROPY_EXT,
      Math.min(16, gl.getParameter(mvTextureAnisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  };
  const mvTextureText = (ctx, value, x, y, maxWidth) => {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(12,25,36,.90)';
    ctx.lineWidth = 2.5;
    if (maxWidth === undefined) {
      ctx.strokeText(value, x, y);
      ctx.fillText(value, x, y);
    } else {
      ctx.strokeText(value, x, y, maxWidth);
      ctx.fillText(value, x, y, maxWidth);
    }
    ctx.restore();
  };
  const atlas = document.createElement('canvas'); atlas.width = 2048 * mvAtlasHD; atlas.height = 2048 * mvAtlasHD;
  const ink = atlas.getContext('2d');
  ink.scale(mvAtlasHD, mvAtlasHD);
  const plateCount = tankSpecs.length * 2 + flowReadings.length;
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  mvApplyTextureQuality();
  const roundRect = (x, y, w, h, r) => { ink.beginPath(); ink.roundRect(x, y, w, h, r) };
  const fit = (value, maxW, initialSize, min = 20) => {
    let size = initialSize;
    do { ink.font = '700 ' + size + 'px Segoe UI, Arial, sans-serif'; if (ink.measureText(value).width < maxW || size <= min) break; size-- } while (true);
    return size;
  };
  function tileText(i, type, txt, aux = '', up = 0) {
    const col = i % LABEL_COLS, row = Math.floor(i / LABEL_COLS);
    const x = col * LABEL_TILE_W, y = row * LABEL_TILE_H;
    ink.clearRect(x, y, LABEL_TILE_W, LABEL_TILE_H);
    const bx = x + 7, by = y + 7, bw = LABEL_TILE_W - 14, bh = LABEL_TILE_H - 14;
    ink.save(); ink.textAlign = 'center'; ink.textBaseline = 'middle';
    const grd = ink.createLinearGradient(bx, by, bx, by + bh);
    if (type === 'level') {

      grd.addColorStop(0, '#5c7680'); grd.addColorStop(1, '#425f6a');
      roundRect(bx, by, bw, bh, 13); ink.fillStyle = grd; ink.fill();
      ink.lineWidth = 2.7; ink.strokeStyle = '#c3d2d7'; ink.stroke();
      ink.fillStyle = up === null ? '#bac9d0' : mvTrendDirection(up) === 'up' ? '#69efa8' : '#ff919e';
      ink.fillRect(bx + 14, by + 16, 7, bh - 32);
      ink.shadowColor = 'rgba(31,52,62,.22)'; ink.shadowBlur = 2;
      ink.fillStyle = '#d9e7eb'; ink.font = '700 21px Segoe UI,Arial,sans-serif';
      mvTextureText(ink, 'NIVEL', x + 256, y + 24);
      ink.font = '800 60px Segoe UI,Arial,sans-serif'; ink.fillStyle = '#ffffff';
      mvTextureText(ink, txt, x + 256, y + 70);
      ink.font = '800 32px Segoe UI,Arial,sans-serif';
      ink.fillStyle = up === null ? '#bac9d0' : mvTrendDirection(up) === 'up' ? '#7df5af' : '#ff9fa7';
      mvTextureText(ink, aux, x + 256, y + 104);
    } else {
      grd.addColorStop(0, type === 'name' ? '#668894' : '#627a82');
      grd.addColorStop(1, type === 'name' ? '#456775' : '#445d67');
      roundRect(bx, by, bw, bh, 13); ink.fillStyle = grd; ink.fill();
      ink.strokeStyle = type === 'name' ? '#c2d3d8' : '#b9c6cb'; ink.lineWidth = 2.7; ink.stroke();
      ink.fillStyle = type === 'name' ? '#c7e3e7' : '#b6cbd3'; ink.fillRect(bx + 11, by + 12, 4, bh - 24);
      ink.shadowColor = 'rgba(0,0,0,.14)'; ink.shadowBlur = 2;
      if (type === 'name') {
        ink.fillStyle = '#ffffff';
        if (txt === 'NUEVA CASTILLA RECTANGULAR' || txt === 'NUEVA CASTILLA CIRCULAR') {
          ink.font = '800 ' + fit('NUEVA CASTILLA', bw - 34, 54, 29) + 'px Segoe UI,Arial,sans-serif';
          mvTextureText(ink, 'NUEVA CASTILLA', x + 256, y + 43, bw - 34);
          const tipo = txt === 'NUEVA CASTILLA RECTANGULAR' ? 'RECTANGULAR' : 'CIRCULAR';
          ink.font = '800 ' + fit(tipo, bw - 34, 54, 29) + 'px Segoe UI,Arial,sans-serif';
          mvTextureText(ink, tipo, x + 256, y + 93, bw - 34);
        } else {
          ink.font = '800 ' + fit(txt, bw - 26, 72, 31) + 'px Segoe UI,Arial,sans-serif';
          mvTextureText(ink, txt, x + 256, y + 64, bw - 32);
        }
      } else {
        const words = String(txt).split(/\s+/).filter(Boolean);
        const lines = [];
        let current = '';
        for (const word of words) {
          const attempt = current ? current + ' ' + word : word;
          if (attempt.length > 24 && current) { lines.push(current); current = word; }
          else current = attempt;
        }
        if (current) lines.push(current);
        const visible = lines.length > 3 ? [lines[0], lines[1], lines.slice(2).join(' ')] : lines;
        const size = visible.length >= 3 ? 24 : visible.length === 2 ? 30 : 37;
        const lineHeight = visible.length >= 3 ? 23 : 29;
        const top = visible.length >= 3 ? 19 : visible.length === 2 ? 25 : 37;
        ink.fillStyle = '#e7f0f2';
        for (let k = 0; k < visible.length; k++) {
          ink.font = '600 ' + fit(visible[k], bw - 20, size, 19) + 'px Segoe UI,Arial,sans-serif';
          mvTextureText(ink, visible[k], x + 256, y + top + k * lineHeight, bw - 22);
        }
        ink.font = '750 ' + fit(aux, bw - 18, 39, 24) + 'px Segoe UI,Arial,sans-serif';
        ink.fillStyle = '#ffffff'; mvTextureText(ink, aux, x + 256, y + 102);
      }
    }
    ink.restore();
  }
  let lastAtlas = -1;
  function updateAtlas(t) {
    if (lastAtlas >= 0) return;
    lastAtlas = t;
    for (let i = 0; i < tankSpecs.length; i++) {
      const sp = tankSpecs[i];
      tileText(i, 'name', shortNames[sp.name] || sp.name);
      const meters = sp.meters === null ? 'N/D' : sp.meters.toFixed(2) + ' m';
      const delta = mvTrendDisplay(sp.delta);

    }
    for (let i = 0; i < flowReadings.length; i++) {
      const f = flowReadings[i], line = f.legend || f.name;
      tileText(i + tankSpecs.length * 2, 'flow', line, i === 2 ? '' : f.lps === null ? 'SIN LECTURA' : f.lps.toLocaleString('es-MX', { maximumFractionDigits: 2 }) + ' LPS');
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  const levelTileW = 512, levelTileH = 256, levelCols = 4, levelRows = 4;
  const levelAtlas = document.createElement('canvas'); levelAtlas.width = 2048 * mvAtlasHD; levelAtlas.height = 1024 * mvAtlasHD;
  const levelInk = levelAtlas.getContext('2d');
  levelInk.scale(mvAtlasHD, mvAtlasHD);
  const levelTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, levelTexture);
  mvApplyTextureQuality();
  let lastLevelsAtlas = -1;
  function updateLevelAtlas(now) {
    if (lastLevelsAtlas >= 0) return;
    lastLevelsAtlas = now;
    for (let i = 0; i < tankSpecs.length; i++) {
      const spec = tankSpecs[i], col = i % 4, row = Math.floor(i / 4);
      const px = col * levelTileW, py = row * levelTileH;
      const c = levelInk;
      c.clearRect(px, py, levelTileW, levelTileH);
      c.save(); c.translate(px, py);
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      const delta = spec.delta;
      const direction = mvTrendDirection(delta);
      const color = direction === null ? '#bac9d0' : direction === 'up' ? '#79ffb8' : '#ff9da7';
      const meters = spec.meters === null ? 'N/D' : spec.meters.toFixed(2) + ' m';
      const trend = mvTrendDisplay(delta);
      function engrave(str, y, font, fill, width = 7) {
        c.font = font;
        c.strokeStyle = 'rgba(51,78,90,.9)'; c.lineWidth = width + 1;
        c.shadowColor = 'rgba(11,24,30,.22)'; c.shadowBlur = 2;
        c.strokeText(str, 256, y);
        c.shadowBlur = 0; c.fillStyle = fill; c.fillText(str, 256, y);
      }

      const bx = 55, by = 33, bw = 402, bh = 191;
      c.save();
      c.shadowColor = 'rgba(0,0,0,.24)'; c.shadowBlur = 7; c.shadowOffsetY = 3;
      const panel = c.createLinearGradient(0, by, 0, by + bh);
      panel.addColorStop(0, 'rgba(95,121,131,.97)');
      panel.addColorStop(1, 'rgba(59,87,99,.97)');
      c.fillStyle = panel;
      c.beginPath(); c.moveTo(bx + 12, by); c.lineTo(bx + bw - 12, by);
      c.quadraticCurveTo(bx + bw, by, bx + bw, by + 12);
      c.lineTo(bx + bw, by + bh - 12); c.quadraticCurveTo(bx + bw, by + bh, bx + bw - 12, by + bh);
      c.lineTo(bx + 12, by + bh); c.quadraticCurveTo(bx, by + bh, bx, by + bh - 12);
      c.lineTo(bx, by + 12); c.quadraticCurveTo(bx, by, bx + 12, by); c.closePath();
      c.fill(); c.shadowBlur = 0; c.shadowOffsetY = 0;
      c.strokeStyle = 'rgba(174,201,209,.84)'; c.lineWidth = 3; c.stroke();

      c.fillStyle = color; c.fillRect(bx + 11, by + 14, 5, bh - 28);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#d9e5e9'; c.font = '750 23px Segoe UI,Arial,sans-serif';
      mvTextureText(c, 'NIVEL', 256, by + 25);
      c.fillStyle = '#ffffff'; c.font = '900 86px Segoe UI,Arial,sans-serif';
      mvTextureText(c, meters, 256, by + 101);
      c.strokeStyle = 'rgba(170,207,218,.30)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(bx + 39, by + 143); c.lineTo(bx + bw - 39, by + 143); c.stroke();
      c.fillStyle = color; c.font = '850 33px Segoe UI,Arial,sans-serif';
      mvTextureText(c, trend, 256, by + 166);
      c.restore();
      c.restore();
    }
    gl.bindTexture(gl.TEXTURE_2D, levelTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, levelAtlas);
    gl.generateMipmap(gl.TEXTURE_2D);
  }
  function exteriorWallAngle(p) {

    return Math.atan2(camera[2] - p.z, camera[0] - p.x);
  }
  function surfacePosition(p, lateralX, verticalY) {

    const radius = p.wallRadius + p.surfaceGap;
    const a = exteriorWallAngle(p) - Math.asin(Math.max(-.88, Math.min(.88, lateralX / radius)));
    return [p.x + Math.cos(a) * radius, p.screenY + verticalY, p.z + Math.sin(a) * radius];
  }
  function addWallPanelQuad(vertices, id, p) {
    const w = p.screenW * .98, h = p.screenH * .98;
    const col = id % levelCols, row = Math.floor(id / levelCols);
    const u0 = col / levelCols, u1 = (col + 1) / levelCols;
    const v1 = 1 - row / levelRows, v0 = 1 - (row + 1) / levelRows;
    const put = (v, u, vv) => vertices.push(v[0], v[1], v[2], u, vv);

    const subdivisions = 16;
    for (let j = 0; j < subdivisions; j++) {
      const t0 = j / subdivisions, t1 = (j + 1) / subdivisions;
      const a0 = (t0 - .5) * w, a1 = (t1 - .5) * w;
      const bl = surfacePosition(p, a0, -h / 2), br = surfacePosition(p, a1, -h / 2);
      const tr = surfacePosition(p, a1, h / 2), tl = surfacePosition(p, a0, h / 2);
      const U0 = u0 + (u1 - u0) * t0, U1 = u0 + (u1 - u0) * t1;
      put(bl, U0, v0); put(br, U1, v0); put(tr, U1, v1);
      put(bl, U0, v0); put(tr, U1, v1); put(tl, U0, v1);
    }
  }
  function projectWorldQuadCorners(points) {
    let left = 1e9, right = -1e9, top = 1e9, bottom = -1e9;
    for (const p of points) {
      const w = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15];
      if (w < .08) return null;
      const sx = (.5 + .5 * (vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12]) / w) * vw;
      const sy = (.5 - .5 * (vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13]) / w) * vh;
      left = Math.min(left, sx); right = Math.max(right, sx); top = Math.min(top, sy); bottom = Math.max(bottom, sy);
    }
    return { left, right, top, bottom };
  }
  function fixedScreenRect(p) {
    const w = p.screenW * .98, h = p.screenH * .98;
    return projectWorldQuadCorners([
      surfacePosition(p, -w / 2, -h / 2), surfacePosition(p, w / 2, -h / 2),
      surfacePosition(p, -w / 2, h / 2), surfacePosition(p, w / 2, h / 2),
      surfacePosition(p, 0, -h / 2), surfacePosition(p, 0, h / 2)
    ]);
  }
  function renderWallDisplays(now) {
    if (!state.levels) return [];
    updateLevelAtlas(now);
    const verts = [], rects = [];
    for (let i = 0; i < tankLabels.length; i++) {
      if (presentation.active && (i !== presentation.index || mvBriefTank(presentation.index))) continue;
      const p = tankLabels[i];

      addWallPanelQuad(verts, i, p);
      const r = fixedScreenRect(p);
      if (r) rects.push(r);
    }
    if (!verts.length) return rects;
    drawWorldText(verts, levelTexture);
    return rects;
  }


  const externalWallsBuffer = gl.createBuffer();
  let externalWallsCount = 0, externalWallsCameraX = NaN, externalWallsCameraZ = NaN;
  function renderExternalWalls() {
    const cameraMoved = !Number.isFinite(externalWallsCameraX) || Math.hypot(camera[0] - externalWallsCameraX, camera[2] - externalWallsCameraZ) > .025;
    if (cameraMoved) {
      const tris = [];
      function emitQuad(a, b, c, d, normal, material, em = .0, opacity = 1) {
        tris.push(...vertex(a, normal, material, em, 0, 0, opacity), ...vertex(b, normal, material, em, 0, 0, opacity), ...vertex(c, normal, material, em, 0, 0, opacity));
        tris.push(...vertex(a, normal, material, em, 0, 0, opacity), ...vertex(c, normal, material, em, 0, 0, opacity), ...vertex(d, normal, material, em, 0, 0, opacity));
      }
      function curvedStrip(p, r, y1, y2, halfAngle, material, em = 0, opacity = 1) {
        const base = exteriorWallAngle(p), segments = 24;
        for (let i = 0; i < segments; i++) {
          const a = base - halfAngle + i * halfAngle * 2 / segments;
          const b = base - halfAngle + (i + 1) * halfAngle * 2 / segments;
          const v1 = [p.x + r * Math.cos(a), y1, p.z + r * Math.sin(a)], v2 = [p.x + r * Math.cos(b), y1, p.z + r * Math.sin(b)];
          const v3 = [v2[0], y2, v2[2]], v4 = [v1[0], y2, v1[2]];
          const normal = [Math.cos((a + b) / 2), 0, Math.sin((a + b) / 2)];
          emitQuad(v1, v2, v3, v4, normal, material, em, opacity);
        }
      }
      function verticalTrim(p, angle, thickness, color) {
        const r = p.wallRadius + .013, y1 = p.screenY - p.height * .40, y2 = p.screenY + p.height * .40;
        const ca = Math.cos(angle), sa = Math.sin(angle), t = [-sa, 0, ca];
        const center = [p.x + r * ca, 0, p.z + r * sa];
        const v1 = [center[0] - thickness * t[0], y1, center[2] - thickness * t[2]];
        const v2 = [center[0] + thickness * t[0], y1, center[2] + thickness * t[2]];
        const v3 = [v2[0], y2, v2[2]], v4 = [v1[0], y2, v1[2]];
        emitQuad(v1, v2, v3, v4, [ca, 0, sa], color, .30);
      }
      for (const p of tankLabels) {
        const a = exteriorWallAngle(p), half = .66;
        const y0 = .56, y1 = p.screenY + p.height * .37;

        curvedStrip(p, p.wallRadius, y0, y1, half, '#a3a9b0', .08, .42);

        curvedStrip(p, p.wallRadius + .025, y0, y0 + .064, half, '#b6bec5', .20);
        curvedStrip(p, p.wallRadius + .025, y1 - .066, y1, half, '#b6bec5', .20);
        verticalTrim(p, a - half, .050, '#b2bac0');
        verticalTrim(p, a + half, .050, '#b2bac0');

        const v = [Math.cos(a), 0, Math.sin(a)];
        const side = [-Math.sin(a), 0, Math.cos(a)];
        for (const d of [-.47, .47]) {
          const cx = p.x + p.wallRadius * v[0] + d * side[0];
          const cz = p.z + p.wallRadius * v[2] + d * side[2];
          const x0 = cx - .045, x1 = cx + .045, z0 = cz - .045, z1 = cz + .045;
          emitQuad([x0, .31, z1], [x1, .31, z1], [x1, y0, z1], [x0, y0, z1], [0, 0, 1], '#7f9fab', .17);
        }
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, externalWallsBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tris), gl.DYNAMIC_DRAW);
      externalWallsCount = tris.length / 13;
      externalWallsCameraX = camera[0];
      externalWallsCameraZ = camera[2];
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, externalWallsBuffer);
    const stride = 13 * 4;
    gl.enableVertexAttribArray(loc.pos); gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(loc.normal); gl.vertexAttribPointer(loc.normal, 3, gl.FLOAT, false, stride, 12);
    gl.enableVertexAttribArray(loc.color); gl.vertexAttribPointer(loc.color, 3, gl.FLOAT, false, stride, 24);
    gl.enableVertexAttribArray(loc.data); gl.vertexAttribPointer(loc.data, 4, gl.FLOAT, false, stride, 36);

    gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.drawArrays(gl.TRIANGLES, 0, externalWallsCount);
    gl.depthMask(true); gl.disable(gl.BLEND);
  }

  function drawWorldText(verts, whichTexture, depthTest = true, opacity = 1) {
    if (!verts.length || opacity <= .005) return;
    gl.useProgram(textProgram); gl.uniformMatrix4fv(txtVP, false, vp);
    gl.uniform1f(txtOpacity, opacity);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, whichTexture); gl.uniform1i(txtTex, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, textBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(txtPos); gl.vertexAttribPointer(txtPos, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(txtUV); gl.vertexAttribPointer(txtUV, 2, gl.FLOAT, false, 20, 12);
    if (depthTest) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false); gl.drawArrays(gl.TRIANGLES, 0, verts.length / 5);
    gl.depthMask(true); gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST);
  }
  const textPrecision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT).precision > 0 ? 'highp' : 'mediump';
  const textVert = `attribute vec3 aPosition;attribute vec2 aTexCoord;uniform mat4 uVP;varying ${textPrecision} vec2 vUV;
void main(){gl_Position=uVP*vec4(aPosition,1.);vUV=aTexCoord;}`;
  const textFrag = `precision ${textPrecision} float;varying ${textPrecision} vec2 vUV;uniform sampler2D uAtlas;uniform float uOpacity;
void main(){vec4 c=texture2D(uAtlas,vUV);float alpha=smoothstep(.035,.82,c.a)*uOpacity;if(alpha<.02)discard;gl_FragColor=vec4(c.rgb,alpha);}`;
  let textProgram = gl.createProgram();
  gl.attachShader(textProgram, shader(gl.VERTEX_SHADER, textVert));
  gl.attachShader(textProgram, shader(gl.FRAGMENT_SHADER, textFrag));
  gl.linkProgram(textProgram);
  if (!gl.getProgramParameter(textProgram, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(textProgram));
  const txtPos = gl.getAttribLocation(textProgram, 'aPosition');
  const txtUV = gl.getAttribLocation(textProgram, 'aTexCoord');
  const txtVP = gl.getUniformLocation(textProgram, 'uVP');
  const txtTex = gl.getUniformLocation(textProgram, 'uAtlas');
  const txtOpacity = gl.getUniformLocation(textProgram, 'uOpacity');
  const textBuffer = gl.createBuffer();
  function pushQuad(vertices, id, bl, br, tr, tl) {
    const col = id % LABEL_COLS, row = Math.floor(id / LABEL_COLS);
    const u0 = col / LABEL_COLS, u1 = (col + 1) / LABEL_COLS;
    const v1 = 1 - row / LABEL_ROWS, v0 = 1 - (row + 1) / LABEL_ROWS;
    const insert = (p, u, v) => vertices.push(p[0], p[1], p[2], u, v);
    insert(bl, u0, v0); insert(br, u1, v0); insert(tr, u1, v1);
    insert(bl, u0, v0); insert(tr, u1, v1); insert(tl, u0, v1);
  }

  function billboardBasis(x, y, z) {
    const front = norm([camera[0] - x, camera[1] - y, camera[2] - z]);
    const right = norm(cross([0, 1, 0], front));
    const up = norm(cross(front, right));
    return { front, right, up };
  }
  function addCameraPlate(vertices, id, x, y, z, width, height, offset = 0) {
    const basis = billboardBasis(x, y, z), center = [x + basis.front[0] * offset, y + basis.front[1] * offset, z + basis.front[2] * offset];
    const pos = (a, b) => plus(center, plus(mul(basis.right, a), mul(basis.up, b)));
    const hw = width * .5, hh = height * .5;
    pushQuad(vertices, id, pos(-hw, -hh), pos(hw, -hh), pos(hw, hh), pos(-hw, hh));
  }

  const mvFlowPlates = flowReadings.map((f, i) => {
    const label = String(f.legend || f.name);
    return {
      x: f.x + (f.dx || 0) / 25,
      z: f.z + (f.dy || 0) / 24.5,
      width: Math.min(4.05, Math.max(2.90, label.length * .073 + 1.65)),
      height: .84,
      opacity: 0,
      visible: false,
      index: i
    };
  });
  let mvFlowPlateFrame = 0;
  function mvPlateScreenRect(x, y, z, width, height, offset) {
    const b = billboardBasis(x, y, z);
    const center = [x + b.front[0] * offset, y + b.front[1] * offset, z + b.front[2] * offset];
    const corner = (a, v) => plus(center, plus(mul(b.right, a), mul(b.up, v)));
    return projectWorldQuadCorners([
      corner(-width / 2, -height / 2), corner(width / 2, -height / 2),
      corner(-width / 2, height / 2), corner(width / 2, height / 2)
    ]);
  }
  function mvOverlapProportion(a, b) {
    const overlapWidth = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const overlapHeight = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return overlapWidth * overlapHeight / Math.max(1, Math.min((a.right - a.left) * (a.bottom - a.top), (b.right - b.left) * (b.bottom - b.top)));
  }
  function mvTankBodyRects() {
    const rects = [];
    for (const p of tankLabels) {
      const radius = (p.radius || 1.4) * .85;
      const corners = [];
      for (const dx of [-radius, radius]) for (const dz of [-radius, radius]) {
        corners.push([p.x + dx, .64, p.z + dz], [p.x + dx, p.y - .12, p.z + dz]);
      }
      const rect = projectWorldQuadCorners(corners);
      if (rect) rects.push(rect);
    }
    return rects;
  }
  function mvFlowLabelVisibility(now, protectedRects, tankRects) {
    const dt = mvFlowPlateFrame ? Math.min(.05, Math.max(0, (now - mvFlowPlateFrame) / 1000)) : .016;
    mvFlowPlateFrame = now;
    const occupied = [];
    const options = [];
    for (const card of mvFlowPlates) {
      const rect = mvPlateScreenRect(card.x, .80, card.z, card.width, card.height, .015);
      if (!rect) { card.rect = null; continue; }
      card.rect = rect;
      const distance = Math.hypot(camera[0] - card.x, camera[1] - .80, camera[2] - card.z);
      options.push({ card, rect, distance });
    }
    options.sort((a, b) => (a.distance - (a.card.visible ? 2.5 : 0)) - (b.distance - (b.card.visible ? 2.5 : 0)) || a.card.index - b.card.index);
    for (const option of options) {
      const { card, rect } = option;
      const area = Math.max(1, (rect.right - rect.left) * (rect.bottom - rect.top));
      const visibleWidth = Math.max(0, Math.min(rect.right, vw - 7) - Math.max(rect.left, 7));
      const visibleHeight = Math.max(0, Math.min(rect.bottom, vh - 7) - Math.max(rect.top, 7));
      const enoughScreen = visibleWidth * visibleHeight / area >= .77 && rect.right - rect.left >= 64 && rect.bottom - rect.top >= 17;
      const threshold = card.visible ? .18 : .075;
      let blocked = !enoughScreen;
      if (!blocked) for (const other of protectedRects) {
        if (mvOverlapProportion(rect, other) > threshold) { blocked = true; break; }
      }
      if (!blocked) for (const other of tankRects) {
        if (mvOverlapProportion(rect, other) > (card.visible ? .64 : .46)) { blocked = true; break; }
      }
      if (!blocked) for (const other of occupied) {
        if (mvOverlapProportion(rect, other) > threshold) { blocked = true; break; }
      }
      card.visible = !blocked;
      if (!blocked) occupied.push(rect);
    }
    for (const card of mvFlowPlates) {
      if (!card.rect) card.visible = false;
      const nextOpacity = card.visible ? 1 : 0;
      const easing = Math.min(1, dt * (card.visible ? 9 : 7));
      card.opacity += (nextOpacity - card.opacity) * easing;
      if (Math.abs(card.opacity - nextOpacity) < .006) card.opacity = nextOpacity;
    }
  }
  function renderWorldLabels(now) {
    updateAtlas(now);
    const topMode = isTopViewMode();
    if (topMode) updateTopViewOverlays();
    else hideTopViewOverlays();
    if (topMode) return;

    const panelRects = renderWallDisplays(now);
    if (state.flowLabels && !presentation.active) {
      const protectedRects = panelRects.slice();
      if (state.labels) for (let i = 0; i < tankLabels.length; i++) {
        const p = tankLabels[i], name = shortNames[tankSpecs[i].name] || tankSpecs[i].name;
        const width = Math.min(5.45, Math.max(2.75, name.length * .235 + .90));
        const rect = mvPlateScreenRect(p.x, p.y + .54, p.z, width, .90, .18);
        if (rect) protectedRects.push(rect);
      }
      mvFlowLabelVisibility(now, protectedRects, mvTankBodyRects());
      for (const card of mvFlowPlates) {
        if (card.opacity < .012) continue;
        const vertices = [];
        const mvCardDist = Math.max(.001, Math.hypot(camera[0] - card.x, camera[1] - .80, camera[2] - card.z));
        const mvCardPull = Math.min(1.6, mvCardDist * .35), mvCardScale = (mvCardDist - mvCardPull) / mvCardDist;
        addCameraPlate(vertices, tankSpecs.length * 2 + card.index, card.x, .80, card.z, card.width * mvCardScale, card.height * mvCardScale, mvCardPull);
        drawWorldText(vertices, texture, true, card.opacity);
      }
    } else {
      mvFlowPlateFrame = now;
      for (const card of mvFlowPlates) { card.opacity = 0; card.visible = false; }
    }

    const nameVerts = [];
    if (state.labels) {
      for (let i = 0; i < tankLabels.length; i++) {
        if (presentation.active && i !== presentation.index) continue;
        const p = tankLabels[i], spec = tankSpecs[i], name = shortNames[spec.name] || spec.name;
        const width = Math.min(5.45, Math.max(2.75, name.length * .235 + .90));
        addCameraPlate(nameVerts, i, p.x, p.y + .54, p.z, width, .90, .18);
      }
    }
    drawWorldText(nameVerts, texture, true);
  }


  const mvAlertBox = document.getElementById('mvAlerts');
  const mvAlertToggle = document.getElementById('mvAlertsToggle');
  const mvAlertPanel = document.getElementById('mvAlertsPanel');
  const mvAlertClose = document.getElementById('mvAlertsClose');
  const mvAlertCount = document.getElementById('mvAlertsCount');
  const mvAlertSummary = document.getElementById('mvAlertsSummary');
  const mvAlertTicker = document.getElementById('mvAlertsTicker');
  const mvAlertList = document.getElementById('mvAlertsList');
  const mvAlertFreshness = document.getElementById('mvAlertsFreshness');
  const mvAlertMarkers = document.getElementById('mvAlertMarkers');
  const mvAlertVisibilityControl = document.getElementById('alertsVisibilityToggle');
  const mvAlertPresentationStyle = document.createElement('style');
  mvAlertPresentationStyle.textContent = `
    #mvAlerts.mv-present-positioned{position:fixed!important;left:var(--mv-present-alert-left,12px)!important;right:auto!important;top:var(--mv-present-alert-top,12px)!important;bottom:auto!important;max-width:var(--mv-present-alert-width,460px)!important;align-items:flex-start!important;z-index:85!important}
    #mvAlerts.mv-present-positioned .mv-alerts-strip{box-sizing:border-box!important;max-width:var(--mv-present-alert-width,460px)!important}
    #mvAlerts.mv-present-short .mv-alerts-marquee,#mvAlerts.mv-present-short.is-cycle-open .mv-alerts-marquee{width:34px!important;flex:0 0 34px!important}
    #mvAlerts.mv-present-short .mv-alerts-marquee-window{opacity:0!important;visibility:hidden!important;pointer-events:none!important}
    #mvAlerts.mv-present-compact .mv-alerts-strip{position:relative!important;display:flex!important;align-items:center!important;justify-content:center!important;width:46px!important;min-width:46px!important;max-width:46px!important;height:46px!important;padding:4px!important;gap:0!important;overflow:visible!important}
    #mvAlerts.mv-present-compact .mv-alerts-marquee,#mvAlerts.mv-present-compact.is-cycle-open .mv-alerts-marquee{width:34px!important;max-width:34px!important;flex:0 0 34px!important;height:34px!important}
    #mvAlerts.mv-present-compact .mv-alerts-marquee-window{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    #mvAlerts.mv-present-compact #mvAlertsToggle{position:absolute!important;inset:0!important;z-index:2!important;display:block!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;opacity:0!important;cursor:pointer!important}
    #mvAlerts.mv-present-compact #mvAlertsCount:not([hidden]){position:absolute!important;top:-8px!important;right:-8px!important;z-index:3!important;display:flex!important;align-items:center!important;justify-content:center!important;min-width:19px!important;height:19px!important;padding:0 3px!important;border-radius:12px!important;background:#cc1735!important;color:white!important;font:700 11px/1 Arial,sans-serif!important;box-shadow:0 0 0 2px white!important;pointer-events:none!important}
    #mvAlerts.mv-present-compact #mvAlertsCount[hidden]{display:none!important}
    #mvAlerts.mv-present-compact .mv-alerts-panel{position:fixed!important;left:var(--mv-present-alert-list-left,12px)!important;right:auto!important;top:var(--mv-present-alert-list-top,65px)!important;bottom:auto!important;width:min(354px,calc(100vw - 24px))!important;max-height:min(52dvh,460px)!important}
  `;
  document.head.appendChild(mvAlertPresentationStyle);
  function mvPositionAlertsForPresentation() {
    const panel = presEl('presentationPanel');
    const visible = presentation.active && presentationUi.visible && panel && !panel.hidden && mvAlertsEnabled;
    mvAlertBox.classList.toggle('mv-present-positioned', !!visible);
    mvAlertBox.classList.remove('mv-present-short', 'mv-present-compact');
    if (!visible) return;
    const r = panel.getBoundingClientRect();
    const w = window.innerWidth, h = window.innerHeight;
    const leftSpace = Math.max(0, r.left - 20);
    let x = 12, y = 12, width = Math.min(460, leftSpace);
    if (leftSpace < 480) {
      mvAlertBox.classList.add(leftSpace >= 180 ? 'mv-present-short' : 'mv-present-compact');
    }
    if (leftSpace < 180) {
      const size = 46, gap = 8;
      const choices = [
        [8, 8], [8, Math.max(8, h - size - 8)],
        [Math.max(8, w - size - 8), 8], [Math.max(8, w - size - 8), Math.max(8, h - size - 8)]
      ];
      const intersects = (px, py) => Math.max(0, Math.min(px + size, r.right + gap) - Math.max(px, r.left - gap)) *
        Math.max(0, Math.min(py + size, r.bottom + gap) - Math.max(py, r.top - gap));
      choices.sort((a, b) => intersects(a[0], a[1]) - intersects(b[0], b[1]));
      [x, y] = choices[0];
      width = size;
    }
    const listTop = y < h / 2 ? Math.min(h - 70, y + 54) : Math.max(8, y - Math.min(460, h * .52) - 8);
    mvAlertBox.style.setProperty('--mv-present-alert-left', x + 'px');
    mvAlertBox.style.setProperty('--mv-present-alert-top', y + 'px');
    mvAlertBox.style.setProperty('--mv-present-alert-width', Math.max(46, width) + 'px');
    mvAlertBox.style.setProperty('--mv-present-alert-list-left', Math.min(x, Math.max(8, w - 364)) + 'px');
    mvAlertBox.style.setProperty('--mv-present-alert-list-top', listTop + 'px');
  }
  const MV_ALERT_VISIBILITY_STORAGE = 'telemetria_monterrey_v_3d_alertas_visibles';
  let mvAlertsEnabled = true;
  try {
    mvAlertsEnabled = localStorage.getItem(MV_ALERT_VISIBILITY_STORAGE) !== '0';
  } catch (error) {
    console.warn('No se pudo leer la preferencia de alertas:', error.message);
  }
  const MV_ALERT_REVIEW_MS = 5 * 60 * 1000;
  const MV_ALERT_TICKER_OPEN_MS = 3200;
  const MV_ALERT_TICKER_GAP_MS = 2500;
  const MV_ALERT_TICKER_TRANSITION_MS = 480;
  const MV_ALERT_STORAGE = 'telemetria_monterrey_v_3d_alertas_v2';
  const mvTypeLabels = { com: 'Sin comunicación', obs: 'Nivel fuera de parámetros', zero: 'Flujo 0' };
  const mvAlertPriority = { com: 0, obs: 1, zero: 2 };
  const mvAlertsState = {
    items: [], received: false, fresh: false, open: false, lastReview: 0,
    lastVerified: 0, rotationIndex: 0, latestNew: new Set(), highlightUntil: 0,
    markers: new Map(), tickerTimer: 0
  };
  function mvTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  function mvReadStoredAlerts() {
    try {
      const saved = JSON.parse(localStorage.getItem(MV_ALERT_STORAGE) || 'null');
      if (!saved || saved.version !== 2 || !Array.isArray(saved.items) ||
        !Number.isFinite(saved.lastVerified) || Date.now() - saved.lastVerified > 24 * 60 * 60 * 1000 ||
        saved.lastVerified > Date.now() + 60000) return;
      const sinComGuardados = new Set(saved.items.filter(item => item && item.type === 'com').map(item => item.tank));
      mvAlertsState.items = saved.items.filter(item => item &&
        typeof item.id === 'string' && typeof item.tank === 'string' &&
        Object.hasOwn(mvTypeLabels, item.type) && typeof item.detail === 'string' &&
        !(item.type === 'obs' && sinComGuardados.has(item.tank)))
        .map(item => ({ ...item, verified: false }));
      mvAlertsState.received = true;
      mvAlertsState.lastVerified = saved.lastVerified;
    } catch (error) {
      console.warn('No se pudo recuperar el estado de alertas:', error.message);
    }
  }
  function mvSaveAlerts() {
    try {
      localStorage.setItem(MV_ALERT_STORAGE, JSON.stringify({
        version: 2, lastVerified: mvAlertsState.lastVerified,
        items: mvAlertsState.items
      }));
    } catch (error) {
      console.warn('No se pudo guardar el estado de alertas:', error.message);
    }
  }
  function mvAlertsOpen(open) {
    mvAlertsState.open = mvAlertsEnabled && !!open;
    mvAlertPanel.hidden = !mvAlertsState.open;
    mvAlertToggle.setAttribute('aria-expanded', String(mvAlertsState.open));
    mvAlertToggle.textContent = mvAlertsState.open ? 'CERRAR' : 'VER TODOS';
    if (mvAlertsState.open) mvRenderAlertsList();
  }
  function mvFocusAlert(tankName) {
    const index = tankSpecs.findIndex(tank => tank.name === tankName);
    if (index < 0) return;
    mvAlertsOpen(false);
    if (!presentation.active) startPresentation();
    presentationJump(presentationEligibleIndices.indexOf(index));
    presentation.paused = true;
    const pause = document.getElementById('presentationPause');
    if (pause) pause.textContent = 'Reanudar';
  }
  function mvSetAlert(next, type, tank, detail, identity, timestamp) {
    const id = type + '|' + identity;
    const old = next.get(id);
    next.set(id, {
      id, type, tank, detail, identity,
      since: old && Number.isFinite(old.since) ? old.since : timestamp,
      verified: true
    });
  }
  function mvClearTickerTimer() {
    if (mvAlertsState.tickerTimer) {
      clearTimeout(mvAlertsState.tickerTimer);
      mvAlertsState.tickerTimer = 0;
    }
  }
  function mvCreateAlertLine(item, expanded) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = (expanded ? 'mv-alert-item ' : 'mv-alert-line ') + 'mv-alert-' + item.type;
    if (!item.verified || !mvAlertsState.fresh) button.classList.add('is-unverified');
    if (mvAlertsState.latestNew.has(item.id) && Date.now() < mvAlertsState.highlightUntil) {
      button.classList.add('is-new');
    }
    button.title = 'Localizar ' + item.tank + ' en el circuito 3D';
    const dot = document.createElement('span');
    dot.className = 'mv-alert-pin';
    if (expanded) {
      const content = document.createElement('span');
      content.className = 'mv-alert-item-body';
      const heading = document.createElement('span');
      heading.className = 'mv-alert-item-title';
      const name = document.createElement('strong');
      name.textContent = item.tank;
      const kind = document.createElement('span');
      kind.textContent = mvTypeLabels[item.type];
      heading.append(name, kind);
      const detail = document.createElement('small');
      detail.textContent = (item.type === 'obs' ? item.detail.replace(/\s*·?\s*Nivel fuera de los límites configurados/gi, '').trim() : item.detail) + (item.verified ? '' : ' · Pendiente de verificar');
      content.append(heading, detail);
      button.append(dot, content);
    } else {
      const copy = document.createElement('span');
      copy.className = 'mv-alert-marquee-copy';
      const name = document.createElement('strong');
      name.textContent = item.tank;
      const kind = document.createElement('span');
      kind.className = 'mv-alert-label';
      kind.textContent = mvTypeLabels[item.type];
      copy.append(name, kind);
      button.append(dot, copy);
    }
    button.addEventListener('click', () => mvFocusAlert(item.tank));
    return button;
  }
  function mvRenderAlertsList() {
    mvAlertList.replaceChildren();
    if (!mvAlertsState.items.length) {
      const message = document.createElement('p');
      message.className = 'mv-alerts-empty';
      message.textContent = mvAlertsState.received ? 'No hay alertas registradas.' : 'Esperando primera revisión.';
      mvAlertList.appendChild(message);
      return;
    }
    for (const item of mvAlertsState.items) mvAlertList.appendChild(mvCreateAlertLine(item, true));
  }
  function mvRenderTickerItem(item) {
    mvAlertTicker.replaceChildren();
    if (!item) {
      const normal = document.createElement('div');
      normal.className = 'mv-alerts-normal' + (!mvAlertsState.received || !mvAlertsState.fresh ? ' is-waiting' : '');
      const dot = document.createElement('span');
      dot.className = 'mv-alert-pin';
      const text = document.createElement('span');
      text.textContent = !mvAlertsState.received ? 'Esperando lecturas de Telemetría' :
        !mvAlertsState.fresh ? 'Sin verificación reciente' : 'Sin alertas activas';
      normal.append(dot, text);
      mvAlertTicker.appendChild(normal);
      return;
    }
    mvAlertTicker.appendChild(mvCreateAlertLine(item, false));
  }
  function mvStartTickerCycle(resetIndex) {
    mvClearTickerTimer();
    mvAlertBox.classList.remove('is-cycle-open');
    if (!mvAlertsEnabled) return;
    const items = mvAlertsState.items;
    if (!items.length) {
      mvAlertsState.rotationIndex = 0;
      mvRenderTickerItem(null);
      return;
    }
    if (resetIndex === true || mvAlertsState.rotationIndex >= items.length) {
      mvAlertsState.rotationIndex = 0;
    }
    const item = items[mvAlertsState.rotationIndex];
    mvRenderTickerItem(item);
    mvAlertsState.tickerTimer = window.setTimeout(() => {
      mvAlertBox.classList.add('is-cycle-open');
      mvAlertsState.tickerTimer = window.setTimeout(() => {
        mvAlertBox.classList.remove('is-cycle-open');
        mvAlertsState.tickerTimer = window.setTimeout(() => {
          const active = mvAlertsState.items;
          mvAlertsState.rotationIndex = active.length
            ? (active.findIndex(alert => alert.id === item.id) + 1 + active.length) % active.length
            : 0;
          mvStartTickerCycle(false);
        }, MV_ALERT_TICKER_TRANSITION_MS);
      }, MV_ALERT_TICKER_OPEN_MS);
    }, MV_ALERT_TICKER_GAP_MS);
  }
  function mvDrawAlerts() {
    const items = mvAlertsState.items;
    const count = items.length;
    mvAlertCount.textContent = String(count);
    mvAlertCount.hidden = count === 0;
    mvAlertToggle.setAttribute('aria-label', mvAlertsState.open
      ? 'Cerrar lista de alertas'
      : 'Ver todas las alertas: ' + count + ' activas');
    mvAlertBox.classList.toggle('has-active-alerts', count > 0);
    mvAlertBox.dataset.ready = String(mvAlertsState.received && mvAlertsState.fresh);
    mvAlertBox.dataset.severity = items.some(item => item.type === 'com') ? 'com' :
      items.some(item => item.type === 'obs') ? 'obs' : items.some(item => item.type === 'zero') ? 'zero' : 'normal';
    if (count) {
      const com = items.filter(item => item.type === 'com').length;
      const obs = items.filter(item => item.type === 'obs').length;
      const zero = items.filter(item => item.type === 'zero').length;
      const parts = [];
      if (com) parts.push(com + ' sin comunicación');
      if (obs) parts.push(obs + ' en observación');
      if (zero) parts.push(zero + ' flujo 0');
      mvAlertSummary.textContent = parts.join(' · ');
    } else {
      mvAlertSummary.textContent = mvAlertsState.received && mvAlertsState.fresh ? 'Operación normal' : 'Estado pendiente de verificación';
    }
    if (!mvAlertsState.received) {
      mvAlertFreshness.textContent = 'Esperando primera revisión';
    } else if (!mvAlertsState.fresh) {
      mvAlertFreshness.textContent = 'Sin conexión · revisión anterior ' + mvTime(mvAlertsState.lastVerified);
    } else {
      mvAlertFreshness.textContent = 'Revisado ' + mvTime(mvAlertsState.lastVerified) + ' · cada 5 min';
    }
    if (mvAlertsState.open) mvRenderAlertsList();
    mvStartTickerCycle(false);
  }
  function mvReviewAlerts(payload) {
    const timestamp = Date.now();
    const previous = new Set(mvAlertsState.items.map(item => item.id));
    const next = new Map(mvAlertsState.items.map(item => [item.id, { ...item, verified: false }]));
    const tanks = payload.tanques || {};
    for (const spec of tankSpecs) {
      const row = tanks[spec.name];
      if (!row) continue;
      const comId = 'com|' + spec.name;
      const obsId = 'obs|' + spec.name;
      if (row.estado === 'sin_comunicacion') {
        next.delete(obsId);
        mvSetAlert(next, 'com', spec.name,
          row.hora ? 'Última lectura ' + row.hora : 'Sin hora de lectura confirmada', spec.name, timestamp);
      } else if (row.estado === 'actual') {
        next.delete(comId);
        if (row.en_observacion === true) {
          const value = typeof row.nivel_m === 'number' && Number.isFinite(row.nivel_m)
            ? row.nivel_m.toFixed(2) + ' m' : '';
          mvSetAlert(next, 'obs', spec.name,
            value, spec.name, timestamp);
        } else if (row.en_observacion === false) {
          next.delete(obsId);
        }
      }
    }
    const flowMap = payload.flujos || {};
    for (const [tank, entries] of Object.entries(presentationFlowMap)) {
      for (const [label, key] of entries) {
        const flow = flowMap[key];
        if (!flow || flow.estado !== 'actual' || typeof flow.lps !== 'number' || !Number.isFinite(flow.lps)) continue;
        if (flow.lps === 0) {
          mvSetAlert(next, 'zero', tank, label + ' · 0 LPS', key, timestamp);
        } else {
          next.delete('zero|' + key);
        }
      }
    }
    mvAlertsState.items = [...next.values()].sort((a, b) =>
      mvAlertPriority[a.type] - mvAlertPriority[b.type] ||
      a.tank.localeCompare(b.tank, 'es') || a.id.localeCompare(b.id));
    const newOnes = mvAlertsState.items.filter(item => !previous.has(item.id));
    mvAlertsState.latestNew = new Set(newOnes.map(item => item.id));
    mvAlertsState.highlightUntil = newOnes.length ? timestamp + 6000 : 0;
    mvAlertsState.received = true;
    mvAlertsState.fresh = true;
    mvAlertsState.lastReview = timestamp;
    mvAlertsState.lastVerified = timestamp;
    if (newOnes.length) {
      const focusIndex = mvAlertsState.items.findIndex(item => item.id === newOnes[0].id);
      if (focusIndex >= 0) mvAlertsState.rotationIndex = focusIndex;
    } else {
      mvAlertsState.rotationIndex = Math.min(mvAlertsState.rotationIndex, Math.max(0, mvAlertsState.items.length - 1));
    }
    mvSaveAlerts();
    mvDrawAlerts();
    mvBuildMarkers();
  }
  function mvBuildMarkers() {
    mvAlertMarkers.replaceChildren();
    mvAlertsState.markers.clear();
    for (const spec of tankSpecs) {
      const alarms = mvAlertsState.items.filter(item => item.tank === spec.name);
      if (!alarms.length) continue;
      const item = alarms[0];
      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = 'mv-tank-alert mv-alert-' + item.type;
      if (!item.verified || !mvAlertsState.fresh) marker.classList.add('is-unverified');
      if (mvAlertsState.latestNew.has(item.id) && Date.now() < mvAlertsState.highlightUntil) {
        marker.classList.add('is-new');
      }
      marker.title = spec.name + ' · ' + alarms.map(a => mvTypeLabels[a.type]).join(' / ');
      marker.setAttribute('aria-label', marker.title + '. Localizar tanque');
      const dot = document.createElement('span');
      dot.className = 'mv-alert-pin';
      marker.append(dot);
      marker.addEventListener('click', () => mvFocusAlert(spec.name));
      mvAlertMarkers.appendChild(marker);
      mvAlertsState.markers.set(spec.name, marker);
    }
  }
  function mvPositionMarkers() {
    if (!mvAlertsEnabled || !mvAlertsState.markers.size) return;
    const presentationBox = presentation.active && presentationUi.visible && !presEl('presentationPanel').hidden ? presEl('presentationPanel').getBoundingClientRect() : null;
    for (let i = 0; i < tankLabels.length; i++) {
      const p = tankLabels[i];
      const marker = mvAlertsState.markers.get(tankSpecs[i].name);
      if (!marker) continue;
      const labelCard = isTopViewMode() && topViewUi.built ? topViewUi.tankCards[i] : null;
      const labelPosition = labelCard && labelCard.root.style.display !== 'none' ? labelCard.position : null;
      const projected = labelPosition ? { x: labelPosition.x, y: labelPosition.y - labelPosition.h / 2 - 10 } : projectPointToScreen(p.x, p.y + 1.44, p.z);
      if (!projected || projected.x < -30 || projected.x > vw + 30 || projected.y < -30 || projected.y > vh + 30) {
        marker.hidden = true;
        continue;
      }
      if (presentationBox && projected.x >= presentationBox.left - 20 && projected.x <= presentationBox.right + 20 && projected.y >= presentationBox.top - 20 && projected.y <= presentationBox.bottom + 20) {
        marker.hidden = true;
        continue;
      }
      marker.hidden = false;
      marker.style.left = projected.x.toFixed(1) + 'px';
      marker.style.top = (projected.y - 4).toFixed(1) + 'px';
    }
  }
  function mvSetAlertVisibility(enabled, save = false) {
    mvAlertsEnabled = !!enabled;
    document.documentElement.classList.toggle('mv-alerts-off', !mvAlertsEnabled);
    mvAlertVisibilityControl.classList.toggle('active', mvAlertsEnabled);
    mvAlertVisibilityControl.setAttribute('aria-pressed', String(mvAlertsEnabled));
    mvAlertVisibilityControl.querySelector('.mv-alerts-control-label').textContent =
      mvAlertsEnabled ? 'Alertas: activadas' : 'Alertas: desactivadas';
    mvAlertVisibilityControl.title = mvAlertsEnabled ? 'Desactivar alertas visuales' : 'Activar alertas visuales';
    if (!mvAlertsEnabled) {
      mvAlertsOpen(false);
      mvClearTickerTimer();
      mvAlertBox.classList.remove('is-cycle-open');
    } else {
      mvStartTickerCycle(false);
    }
    if (save) {
      try {
        localStorage.setItem(MV_ALERT_VISIBILITY_STORAGE, mvAlertsEnabled ? '1' : '0');
      } catch (error) {
        console.warn('No se pudo guardar la preferencia de alertas:', error.message);
      }
    }
  }
  mvAlertVisibilityControl.addEventListener('click', () => mvSetAlertVisibility(!mvAlertsEnabled, true));
  mvAlertToggle.addEventListener('click', () => mvAlertsOpen(!mvAlertsState.open));
  mvAlertClose.addEventListener('click', () => mvAlertsOpen(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mvAlertsState.open) mvAlertsOpen(false);
  });
  window.setInterval(() => {
    if (mvAlertsState.highlightUntil && Date.now() >= mvAlertsState.highlightUntil) {
      mvAlertsState.latestNew.clear();
      mvAlertsState.highlightUntil = 0;
      mvBuildMarkers();
      mvStartTickerCycle(false);
    }
  }, 1000);
  mvSetAlertVisibility(mvAlertsEnabled);
  mvReadStoredAlerts();
  mvDrawAlerts();
  mvBuildMarkers();

  const liveStatus = document.getElementById('mvLiveStatus');
  const liveEndpoint = '/Telemetria/php/monterreyv_3d_datos.php';
  const TELEMETRY_POLL_MS = 10000;
  let liveRequestActive = false, hasReceivedData = false, initialTelemetryResolved = false;
  function numberOrNull(v) { return typeof v === 'number' && Number.isFinite(v) ? v : null; }
  function setStatus(message, mode) {
    liveStatus.textContent = message;
    liveStatus.dataset.state = mode;
  }
  let complementaryFlowActive = false;
  async function updateComplementaryFlow() {
    if (complementaryFlowActive) return;
    complementaryFlowActive = true;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      let response, payload;
      try {
        response = await fetch('/Telemetria/Php/monterreyv_3d_flujos_extra.php?t=' + Date.now(), {
          cache: 'no-store', credentials: 'same-origin', signal: controller.signal,
          headers: { Accept: 'application/json' }
        });
        if (response.ok) payload = await response.json();
      } finally { clearTimeout(timeout); }
      if (!payload || payload.ok !== true || !payload.flujos) return;
      const reading = payload.flujos.alianza_fraile1;
      if (!reading) return;
      const parsed = numberOrNull(reading.lps);
      if (parsed === null) return;
      const f = flowReadings[5];
      f.lps = parsed;
      f.connection = reading.estado || 'sin_datos';
      lastAtlas = -1;
    } catch (error) {
      if (error && error.name !== 'AbortError') console.warn('MTYV 3D: flujo complementario no disponible:', error.message);
    } finally { complementaryFlowActive = false; }
  }
  async function reloadRealData() {
    if (liveRequestActive) return;
    liveRequestActive = true;
    try {
      const ctrl = new AbortController();
      const requestTimeout = setTimeout(() => ctrl.abort(), 8000);
      let response, body;
      try {
        response = await fetch(liveEndpoint + '?t=' + Date.now(), {
          cache: 'no-store', credentials: 'same-origin', signal: ctrl.signal,
          headers: { 'Accept': 'application/json' }
        });
        const responseText = await response.text();
        try { body = JSON.parse(responseText) } catch (parseError) {
          throw new Error('El servidor no devolvió JSON válido (revisar PHP y API).');
        }
      } finally { clearTimeout(requestTimeout); }
      if (!response.ok || !body || body.ok !== true) throw new Error(body && body.error ? body.error : 'API sin lecturas');
      let pipesChanged = !hasReceivedData;
      for (const spec of tankSpecs) {
        const oldFraction = spec.fraction;
        const t = body.tanques && body.tanques[spec.name];
        spec.meters = t ? numberOrNull(t.nivel_m) : null;
        spec.delta = t ? numberOrNull(t.tendencia_m) : null;
        spec.state = t && t.estado ? t.estado : 'sin_datos';
        spec.hora = t && t.hora ? t.hora : null;
        if (t && Number.isFinite(Number(t.capacidad_cm)) && Number(t.capacidad_cm) > 0)
          spec.capacityMeters = Number(t.capacidad_cm) / 100;
        spec.fraction = spec.meters === null ? 0 : Math.max(0, Math.min(1, spec.meters / spec.capacityMeters));
        spec.baseFraction = spec.fraction;
        if (oldFraction !== spec.fraction) pipesChanged = true;
      }
      presentationFlowRecords = body.flujos || {};
      for (let i = 0; i < flowReadings.length; i++) {
        const f = flowReadings[i];
        let record = body.flujos && f.backendKey ? body.flujos[f.backendKey] : null;
        if (!record && body.flujos) {
          for (const alias of f.fallbackKeys) {
            if (body.flujos[alias] && typeof body.flujos[alias].lps === 'number') {
              record = body.flujos[alias];
              break;
            }
          }
        }
        if (i === 5 && !record && Number.isFinite(f.lps)) continue;
        f.lps = record ? numberOrNull(record.lps) : null;
        f.connection = record && record.estado ? record.estado : 'sin_datos';
      }
      updateComplementaryFlow();
      let pumpsChanged = !hasReceivedData;
      for (const p of pumpMeshes) {
        const oldActive = p.active;
        const group = body.bombas && body.bombas[p.group];
        const value = group && group.length > p.index ? group[p.index] : null;

        const sourceCode = {
          'FRAILE 1 → FRAILE 3': 'FRAILE 1', 'BOMB. REAL DE MINAS': 'FRAILE 1',
          'FRAILE 2 → GARCÍA 1': 'FRAILE 2', 'GARCÍA 1 → GARCÍA 2': 'GARCÍA 1',
          'ENTRADA ALIANZA REAL': 'ALIANZA REAL', 'ALIANZA REAL → NUEVA CASTILLA AMP': 'NUEVA CASTILLA / AMP',
          'NUEVA CASTILLA AMP → RECTANGULAR': 'RECTANGULAR',
          'RECTANGULAR → SANTA ROSA 2': 'SANTA ROSA 2',
          'BOMB. MITRAS PONIENTE': 'ALIANZA REAL'
        }[p.group];
        const isCurrent = body.tanques && body.tanques[sourceCode] && body.tanques[sourceCode].estado === 'actual';
        p.active = value === true ? true : value === false ? false : null;
        if (p.active !== oldActive) pumpsChanged = true;
      }
      if (pumpsChanged) rebuildPumpBatches();
      if (pipesChanged) rebuildPipeBuffers();
      lastAtlas = -1; lastLevelsAtlas = -1; hasReceivedData = true;
      presentation.sourceTime = body.consultado || body.actualizado || '';
      presentation.sourceFresh = true;
      mvRecordLiveHistory();
      if (!mvAlertsState.received || Date.now() - mvAlertsState.lastReview >= MV_ALERT_REVIEW_MS) {
        mvReviewAlerts(body);
      } else if (!mvAlertsState.fresh) {
        mvAlertsState.fresh = true;
        mvDrawAlerts();
        mvBuildMarkers();
      }
      presentationData();
      const valid = body.total_tanques_con_lectura || 0;
      const lost = body.tanques_sin_comunicacion || 0;
      setStatus('Conectado · ' + valid + '/14 tanques' + (lost ? ' · ' + lost + ' sin comunicación' : '') + ' · ' + body.consultado, 'ok');
    } catch (err) {
      if (mvAlertsState.fresh) {
        mvAlertsState.fresh = false;
        mvDrawAlerts();
        mvBuildMarkers();
      }
      setStatus('', 'silent');
      presentation.sourceFresh = false; presentationData();
      console.warn('Monterrey V 3D: no se recibieron datos actuales:', err.message);
    } finally { liveRequestActive = false; initialTelemetryResolved = true; }
  }
  reloadRealData();
  setInterval(reloadRealData, TELEMETRY_POLL_MS);

  let vp = new Float32Array(16), camera = [0, 0, 0], vw = 1, vh = 1, last = performance.now(), elapsed = 0;
  const levelsUniform = new Float32Array(tankSpecs.length);
  const cameraUniform = new Float32Array(3);
  let dynamicQuality = 1, qualityElapsed = 0, qualityFrames = 0, qualityRecovery = 0, currentMeanFrame = 16.7;
  function mvResizeUltra() {
    const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight);
    const nativeDensity = Math.max(1, window.devicePixelRatio || 1);
    const pixels = width * height;
    const maximumDensity = Math.min(3, Math.sqrt(36000000 / pixels), maximumViewportDimensions[0] / width, maximumViewportDimensions[1] / height, maximumRenderbufferDimension / width, maximumRenderbufferDimension / height);
    const preferred = Math.max(nativeDensity, pixels >= 7000000 ? 1.5 : pixels >= 3000000 ? 1.8 : 2.0);
    const dpr = Math.max(.6, Math.max(.75, Math.min(maximumDensity, preferred * Math.max(.82, dynamicQuality))) * mvMotionScale);
    const w = Math.max(1, Math.round(width * dpr)), h = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    lastDisplayDensity = window.devicePixelRatio || 1; vw = width; vh = height;
  }
  function adaptQuality(frameMs) {
    if (frameMs <= 0 || frameMs > 1000) return;
    qualityElapsed += Math.min(frameMs, 200);
    qualityFrames++;
    if (qualityElapsed < 1550) return;
    const meanFrame = qualityElapsed / Math.max(1, qualityFrames);
    currentMeanFrame = currentMeanFrame * .54 + meanFrame * .46;
    let nextQuality = dynamicQuality;
    if (meanFrame > 41) {
      nextQuality = Math.max(.55, dynamicQuality - .17);
      qualityRecovery = 0;
    } else if (meanFrame > 29) {
      nextQuality = Math.max(.55, dynamicQuality - .105);
      qualityRecovery = 0;
    } else if (meanFrame > 23) {
      nextQuality = Math.max(.55, dynamicQuality - .06);
      qualityRecovery = 0;
    } else if (meanFrame < 19.5 && dynamicQuality < 1) {
      qualityRecovery++;
      if (qualityRecovery >= 2) {
        nextQuality = Math.min(1, dynamicQuality + .06);
        qualityRecovery = 0;
      }
    } else {
      qualityRecovery = 0;
    }
    qualityElapsed = 0;
    qualityFrames = 0;
    if (Math.abs(nextQuality - dynamicQuality) > .001) {
      dynamicQuality = nextQuality;
      resize();
    }
  }
  let lastDisplayDensity = window.devicePixelRatio || 1, nextDisplayResolutionCheck = 0;
  const maximumViewportDimensions = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
  const maximumRenderbufferDimension = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
  function resize() {
    if (mvUltra) return mvResizeUltra();
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    const mobile = Math.min(width, height) <= 600 && (window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 600);
    const memory = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : 4;
    const nativeDensity = Math.max(1, window.devicePixelRatio || 1);
    const pixels = width * height;
    const cap = mobile ? (memory <= 2 ? 1 : 1.4) : 2.05;
    const maximumPixels = mobile ? 1700000 : memory >= 8 ? 15500000 : 12000000;
    const maximumDensity = Math.min(
      cap,
      Math.sqrt(maximumPixels / pixels),
      maximumViewportDimensions[0] / width,
      maximumViewportDimensions[1] / height,
      maximumRenderbufferDimension / width,
      maximumRenderbufferDimension / height
    );
    const preferredDensity = mobile ? nativeDensity : Math.max(nativeDensity, pixels >= 5500000 ? 1.17 : pixels >= 3000000 ? 1.44 : 1.76);
    const minimumDensity = mobile ? .65 : Math.min(maximumDensity, Math.max(.78, nativeDensity * .76));
    const dpr = Math.max(.6, Math.min(maximumDensity, Math.max(minimumDensity, preferredDensity * dynamicQuality)) * mvMotionScale);
    const w = Math.max(1, Math.round(width * dpr));
    const h = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    lastDisplayDensity = window.devicePixelRatio || 1;
    vw = width;
    vh = height;
  }
  function keepCameraAboveTerrain(eye, look) {
    const maxRadius = 176;
    const radius = Math.hypot(eye[0], eye[2]);
    if (radius > maxRadius) {
      const scale = maxRadius / radius;
      eye[0] *= scale;
      eye[2] *= scale;
    }
    let requiredHeight = .9;
    for (let i = 3; i <= 12; i++) {
      const fraction = i / 12;
      const x = look[0] + (eye[0] - look[0]) * fraction;
      const z = look[2] + (eye[2] - look[2]) * fraction;
      const distance = Math.hypot(x, z);
      const clearance = distance > 88 ? 5 : distance > 68 ? 3 : 1.15;
      const floorHeight = terrainHeight(x, z) + clearance;
      requiredHeight = Math.max(requiredHeight, (floorHeight - look[1] * (1 - fraction)) / fraction);
    }
    eye[1] = Math.max(eye[1], requiredHeight);
  }
  function render(now) {
    if (now >= nextDisplayResolutionCheck) {
      nextDisplayResolutionCheck = now + 1200;
      if ((window.devicePixelRatio || 1) !== lastDisplayDensity || canvas.clientWidth !== vw || canvas.clientHeight !== vh) resize();
    }
    const frameMs = Math.max(0, now - last);
    last = now;
    if (document.hidden || graphicsContextLost) {
      qualityElapsed = 0; qualityFrames = 0;
      requestAnimationFrame(render);
      return;
    }
    adaptQuality(frameMs);
    if (!presentation.active) clamp();
    const dt = Math.min(frameMs / 1000, .05);
    eveningBlend += (Number(eveningEnabled) - eveningBlend) * Math.min(1, dt * 2.3);
    tickGuidedTour(dt); tickPresentation(now, dt); tickAroundOrbit(dt); if (state.water) elapsed += dt * state.flowSpeed;

    for (let i = 0; i < tankSpecs.length; i++) levelsUniform[i] = tankSpecs[i].fraction;

    if (!presentation.active && !state.userPanned && !state.auto) {
      const optimal = fitPose(state.yaw, state.pitch);
      const mixCenter = Math.min(1, dt * 11);
      for (let i = 0; i < 3; i++)state.target[i] += (optimal.target[i] - state.target[i]) * mixCenter;
    }
    const desiredDistance = presentation.active ? presentation.dist : guidedTour.active && state.auto ? guidedTour.dist : aroundOrbit.active ? fitDistanceFromTarget(state.yaw, state.pitch, state.target) * aroundOrbit.zoomScale : manualCameraDistance !== null ? manualCameraDistance * state.zoom : fitDistanceFromTarget(state.yaw, state.pitch, state.target) * state.zoom;

    const rate = desiredDistance > state.dist ? 7.5 : 6.8;
    state.dist += (desiredDistance - state.dist) * Math.min(1, dt * (aroundOrbit.active ? 2.7 : presentation.active ? 10 : guidedTour.active && state.auto ? 5.2 : rate));
    const sp = Math.sin(state.pitch), cp = Math.cos(state.pitch);
    let viewTarget = presentation.active ? state.target : [state.target[0], Math.max(.60, state.target[1]), state.target[2]];
    camera = plus(viewTarget, [state.dist * sp * Math.cos(state.yaw), state.dist * cp, state.dist * sp * Math.sin(state.yaw)]);
    if (camera[1] < .85) camera[1] = .85;
    if (presentation.active || guidedTour.active) {
      for (const p of tankLabels) {
        if (camera[1] > p.baseY + p.height + 1.0) continue;
        const dx = camera[0] - p.x, dz = camera[2] - p.z;
        const distance = Math.hypot(dx, dz);
        const clearance = p.wallRadius + .68;
        if (distance < clearance) {
          const scale = clearance / Math.max(.0001, distance);
          camera[0] = p.x + dx * scale;
          camera[2] = p.z + dz * scale;
        }
      }
    }
    if (!presentation.active && !guidedTour.active) keepCameraAboveTerrain(camera, viewTarget);
    if (guidedTour.active && guidedTour.eye && guidedTour.look && !presentation.active) {
      camera = [...guidedTour.eye];
      viewTarget = [...guidedTour.look];
    }
    vp.set(matMul(perspective(44 * Math.PI / 180, vw / vh, .15, 4000), lookAt(camera, viewTarget, [0, 1, 0])));
    mvRenderShadowMap(now, () => {
      const pumpMesh = isTopViewMode() ? superiorPumpBuffers[0] : livePumpBuffers[0];
      bindBuffer(buffers[0]); gl.drawArrays(gl.TRIANGLES, 0, buffers[0].count);
      if (pumpMesh.count) { bindBuffer(pumpMesh); gl.drawArrays(gl.TRIANGLES, 0, pumpMesh.count); }
      bindBuffer(pipeBuffers[0]); gl.drawArrays(gl.TRIANGLES, 0, pipeBuffers[0].count);
      bindBuffer(buffers[1]); gl.drawArrays(gl.TRIANGLES, 0, buffers[1].count);
    });
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE); gl.clearColor(.63, .74, .82, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    renderSky(camera, viewTarget, now * .001, vw / vh);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, turfTexture);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, forestTexture);
    gl.activeTexture(gl.TEXTURE0);
    gl.useProgram(program); gl.uniformMatrix4fv(loc.vp, false, vp); cameraUniform.set(camera); gl.uniform3fv(loc.cam, cameraUniform); gl.uniform1f(loc.time, elapsed); gl.uniform1fv(loc.levels, levelsUniform); gl.uniform1f(loc.anim, 1); gl.uniform1f(loc.evening, eveningBlend); mvBindProUniforms();
    function drawPumps(part) {

      const mesh = isTopViewMode() ? superiorPumpBuffers[part] : livePumpBuffers[part];
      if (mesh.count) { bindBuffer(mesh); gl.drawArrays(gl.TRIANGLES, 0, mesh.count); }
    }
    gl.disable(gl.BLEND); gl.depthMask(true); bindBuffer(buffers[0]); gl.drawArrays(gl.TRIANGLES, 0, buffers[0].count); drawPumps(0); bindBuffer(pipeBuffers[0]); gl.drawArrays(gl.TRIANGLES, 0, pipeBuffers[0].count);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.disable(gl.CULL_FACE); bindBuffer(buffers[1]); gl.drawArrays(gl.TRIANGLES, 0, buffers[1].count); drawPumps(1); bindBuffer(pipeBuffers[1]); gl.drawArrays(gl.TRIANGLES, 0, pipeBuffers[1].count);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); bindBuffer(buffers[2]); gl.drawArrays(gl.TRIANGLES, 0, buffers[2].count); drawPumps(2); bindBuffer(pipeBuffers[2]); gl.drawArrays(gl.TRIANGLES, 0, pipeBuffers[2].count); gl.depthMask(true); gl.disable(gl.BLEND);

    renderExternalWalls();

    renderWorldLabels(now);
    mvPositionMarkers();
    if (!document.documentElement.classList.contains('mv-scene-ready') && initialTelemetryResolved && (skyAssetSettled || !skyProgram)) {
      document.documentElement.classList.add('mv-scene-ready');
    }
    requestAnimationFrame(render)
  }
  function clamp() { state.pitch = Math.max(.12, Math.min(1.48, state.pitch)); state.zoom = Math.max(freeNavigationActive ? .10 : .32, Math.min(freeNavigationActive ? 5 : 2.4, state.zoom)) }
  function orbit(dx, dy) { topViewSelected = false; state.yaw -= dx * .006; state.pitch -= dy * .006; clamp() }
  function pan(dx, dy) { if (!presentation.active) state.userPanned = true; const sp = Math.sin(state.yaw), cp = Math.cos(state.yaw), horizontal = [-sp, 0, cp], right = mul(horizontal, -1), sens = state.dist * .00125; state.target = plus(state.target, plus(mul(right, dx * sens), [0, dy * sens, 0])); state.target[0] = Math.max(-32, Math.min(32, state.target[0])); state.target[1] = Math.max(.60, Math.min(12, state.target[1])); state.target[2] = Math.max(-23, Math.min(23, state.target[2])) }
  function freeMove(dx, dy) {
    state.userPanned = true;
    const yaw = state.yaw;
    const distanceScale = Math.max(3.5, state.dist) * .00130;
    const verticalScale = Math.max(.35, Math.abs(Math.cos(state.pitch)));
    const horizontal = dx * distanceScale;
    const depth = dy * distanceScale / verticalScale;
    state.target[0] += -Math.sin(yaw) * horizontal - Math.cos(yaw) * depth;
    state.target[2] += Math.cos(yaw) * horizontal - Math.sin(yaw) * depth;
    state.target[0] = Math.max(freeMoveBounds.minX, Math.min(freeMoveBounds.maxX, state.target[0]));
    state.target[2] = Math.max(freeMoveBounds.minZ, Math.min(freeMoveBounds.maxZ, state.target[2]));
  }
  function freeHeight(dy) {
    state.userPanned = true;
    state.target[1] = Math.max(.6, Math.min(35, state.target[1] + dy * Math.max(3.5, state.dist) * .0013));
  }
  let dragging = false, lastX = 0, lastY = 0, mode = 'orbit', pointers = new Map(), prevTouch = null, downPoint = null;
  function navigationModeForPointer(e) {
    if (!freeNavigationActive) return e.button === 2 || e.shiftKey ? 'pan' : 'orbit';
    if (e.button === 1) return 'height';
    const alternative = e.button === 2 || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey;
    return (freeNavigationMode === 'rotate') !== alternative ? 'orbit' : 'free-pan';
  }
  mvMotionResize = resize;
  canvas.addEventListener('pointermove', e => { if (e.buttons) mvMotionStart(); }, { passive: true });
  canvas.addEventListener('wheel', mvMotionStart, { passive: true });
  canvas.addEventListener('touchmove', mvMotionStart, { passive: true });
  canvas.addEventListener('pointerdown', e => {
    if (presentation.active) stopPresentation();
    if (guidedTour.active) stopGuidedTour(true);
    if (freeNavigationActive && (e.button === 2 || e.button === 1)) e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastX = e.clientX;
    lastY = e.clientY;
    downPoint = { x: e.clientX, y: e.clientY, id: e.pointerId, dragged: false };
    dragging = true;
    mode = navigationModeForPointer(e);
    canvas.classList.add('dragging');
    if (freeNavigationActive) canvas.style.cursor = mode === 'orbit' ? 'move' : 'grabbing';
    prevTouch = null;
  });
  canvas.addEventListener('pointermove', e => { if (!pointers.has(e.pointerId)) return; const old = pointers.get(e.pointerId); if (downPoint && Math.hypot(e.clientX - downPoint.x, e.clientY - downPoint.y) > 5) downPoint.dragged = true; pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); const arr = [...pointers.values()]; if (aroundOrbit.active) { if (arr.length >= 2) { const d = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y); if (prevTouch) adjustAroundOrbitZoom(Math.exp((prevTouch.d - d) * .007)); prevTouch = { d }; } else if (dragging) { const dx = e.clientX - old.x, dy = e.clientY - old.y; if (mode === 'pan' || e.shiftKey) pan(dx, dy); else adjustAroundOrbitPitch(dy); prevTouch = null; } else prevTouch = null; return; } if (arr.length >= 2) { const d = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y), cx = (arr[0].x + arr[1].x) / 2, cy = (arr[0].y + arr[1].y) / 2; if (prevTouch) { state.zoom *= Math.exp((prevTouch.d - d) * .007); (freeNavigationActive ? freeMove : pan)(cx - prevTouch.cx, cy - prevTouch.cy); clamp() } prevTouch = { d, cx, cy } } else if (dragging) { const dx = e.clientX - old.x, dy = e.clientY - old.y; if (freeNavigationActive) { if (mode === 'orbit') orbit(dx, dy); else if (mode === 'height') freeHeight(dy); else freeMove(dx, dy); } else if (mode === 'pan' || e.shiftKey) pan(dx, dy); else orbit(dx, dy) } });
  function up(e) { pointers.delete(e.pointerId); if (!pointers.size) { dragging = false; canvas.classList.remove('dragging'); updateFreeNavigationControls(); } prevTouch = null; downPoint = null; }
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up); canvas.addEventListener('lostpointercapture', up);
  canvas.addEventListener('wheel', e => { e.preventDefault(); if (aroundOrbit.active) { adjustAroundOrbitZoom(Math.exp(e.deltaY * .001)); return; } if (presentation.active) stopPresentation(); if (guidedTour.active) stopGuidedTour(true); state.zoom *= Math.exp(e.deltaY * .001); clamp() }, { passive: false }); canvas.addEventListener('contextmenu', e => e.preventDefault());
  document.getElementById('reset').addEventListener('click', () => { if (freeNavigationActive) setFreeNavigation(false); if (aroundOrbit.active) stopAroundOrbit(true); if (presentation.active) stopPresentation(); if (guidedTour.active) stopGuidedTour(false); manualCameraDistance = null; });
  document.getElementById('reset').addEventListener('click', () => { topViewSelected = false; state.yaw = initial.yaw; state.pitch = initial.pitch; state.zoom = initial.zoom; state.target = [...fitPose(state.yaw, state.pitch).target]; state.userPanned = false; state.auto = false; document.getElementById('spin').classList.remove('active') });
  document.getElementById('top').addEventListener('click', () => { if (freeNavigationActive) setFreeNavigation(false); if (aroundOrbit.active) stopAroundOrbit(true); if (presentation.active) stopPresentation(); if (guidedTour.active) stopGuidedTour(false); manualCameraDistance = null; });
  document.getElementById('top').addEventListener('click', () => { topViewSelected = true; state.yaw = Math.PI / 2; state.pitch = .45; state.zoom = initial.zoom; state.target = [...fitPose(state.yaw, state.pitch).target]; state.userPanned = false; state.auto = false; document.getElementById('spin').classList.remove('active') });
  document.getElementById('zoomIn').addEventListener('click', () => { if (aroundOrbit.active) { adjustAroundOrbitZoom(.84); return; } if (presentation.active) stopPresentation(); if (guidedTour.active) stopGuidedTour(true); state.zoom *= .84; clamp() });
  document.getElementById('zoomOut').addEventListener('click', () => { if (aroundOrbit.active) { adjustAroundOrbitZoom(1.19); return; } if (presentation.active) stopPresentation(); if (guidedTour.active) stopGuidedTour(true); state.zoom *= 1.19; clamp() });
  document.getElementById('spin').addEventListener('click', () => { if (aroundOrbit.active) stopAroundOrbit(true); if (guidedTour.active) stopGuidedTour(true); else startGuidedTour(); });
  document.getElementById('water').addEventListener('click', e => { state.water = !state.water; e.currentTarget.classList.toggle('active', state.water); e.currentTarget.lastChild.textContent = state.water ? 'Agua animada' : 'Agua pausada' });
  document.getElementById('flowSpeed').addEventListener('click', e => { state.flowSpeed = state.flowSpeed === 1 ? 2 : state.flowSpeed === 2 ? 3 : 1; e.currentTarget.textContent = 'Velocidad visual ×' + state.flowSpeed });
  document.getElementById('flowLabelsToggle').addEventListener('click', e => { state.flowLabels = !state.flowLabels; e.currentTarget.classList.toggle('active', state.flowLabels) });
  document.getElementById('levelsToggle').addEventListener('click', e => { state.levels = !state.levels; e.currentTarget.classList.toggle('active', state.levels) });
  document.getElementById('labelsToggle').addEventListener('click', e => { state.labels = !state.labels; e.currentTarget.classList.toggle('active', state.labels) });
  document.getElementById('full').addEventListener('click', async () => { if (document.fullscreenElement) { await document.exitFullscreen().catch(() => { }); } else await document.documentElement.requestFullscreen().catch(() => { }); });
  document.addEventListener('keydown', e => {
    if (!presentation.active) return;
    if (e.key === 'Escape') { stopPresentation(); e.preventDefault() }
    else if (e.key.toLowerCase() === 'i' && presentation.active) { setPresentationInfoVisible(!presentationUi.visible); e.preventDefault() }
    else if (e.key === 'ArrowRight') { presentationJump(presentation.step + 1); e.preventDefault() }
    else if (e.key === 'ArrowLeft') { presentationJump(presentation.step - 1); e.preventDefault() }
    else if (e.key === ' ') {
      presentation.paused = !presentation.paused;
      presEl('presentationPause').textContent = presentation.paused ? 'Continuar' : 'Pausar';
      e.preventDefault();
    }
  }, true);
  document.addEventListener('keydown', e => { if (presentation.active) return; if (guidedTour.active && (e.key.toLowerCase() === 'r' || e.key === '+' || e.key === '=' || e.key === '-' || e.key.startsWith('Arrow'))) stopGuidedTour(true); if (aroundOrbit.active && (e.key === '+' || e.key === '=' || e.key === '-')) { e.preventDefault(); adjustAroundOrbitZoom(e.key === '-' ? 1.12 : .88); return; } if (aroundOrbit.active && (e.key.toLowerCase() === 'r' || e.key.startsWith('Arrow'))) stopAroundOrbit(true); if (e.key.toLowerCase() === 'r') document.getElementById('reset').click(); if (e.key.toLowerCase() === 'f') document.getElementById('full').click(); if (e.key === '+' || e.key === '=') state.zoom *= .88; if (e.key === '-') state.zoom *= 1.12; if (e.key === 'ArrowLeft') { topViewSelected = false; state.yaw += .08; } if (e.key === 'ArrowRight') { topViewSelected = false; state.yaw -= .08; } if (e.key === 'ArrowUp') { topViewSelected = false; state.pitch -= .08; } if (e.key === 'ArrowDown') { topViewSelected = false; state.pitch += .08; } clamp() });
  window.addEventListener('resize', () => { presentationAngleCache.clear(); resize(); });
  if (typeof ResizeObserver !== 'undefined') {
    const sceneObserver = new ResizeObserver(() => { presentationAngleCache.clear(); resize(); });
    sceneObserver.observe(canvas);
  }
  resize(); const initialFrame = fitPose(state.yaw, state.pitch); state.target = [...initialFrame.target]; state.dist = initialFrame.dist * state.zoom; requestAnimationFrame(render);
})();



(function () {

  const toggle = document.getElementById('controlsToggle');
  const launcher = document.getElementById('mvPanoramaHeading');
  const panel = document.getElementById('controlsPanel');
  const dock = document.getElementById('controlsDock');
  if (!launcher || !panel || !dock) return;
  function placePanel() {
    const box = launcher.getBoundingClientRect();
    dock.style.setProperty('--mv-menu-bottom', Math.ceil(window.innerHeight - box.top + 8) + 'px');
  }
  function setOpen(open) {
    placePanel();
    panel.classList.toggle('is-open', open);
    panel.setAttribute('aria-hidden', String(!open));
    launcher.setAttribute('aria-expanded', String(open));
    launcher.setAttribute('aria-label', open ? 'Ocultar controles de Monterrey V' : 'Mostrar controles de Monterrey V');
    launcher.title = open ? 'Ocultar controles' : 'Mostrar controles';
    launcher.classList.toggle('is-open', open);
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Ocultar controles' : 'Mostrar controles');
    }
    if (!open) panel.querySelectorAll('button').forEach(b => { if (b === document.activeElement) b.blur() });
  }
  setOpen(false);
  launcher.addEventListener('click', () => setOpen(launcher.getAttribute('aria-expanded') !== 'true'));
  launcher.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(launcher.getAttribute('aria-expanded') !== 'true');
    }
  });
  window.addEventListener('resize', placePanel);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) {
      setOpen(false);
      launcher.focus();
    }
  });
})();

(function () {
  const heading = document.getElementById('mvPanoramaHeading');
  const dateLine = heading ? heading.querySelector('.mv-panorama-date-line') : null;
  const control = document.getElementById('dateTimeVisibilityToggle');
  const controlText = document.getElementById('mvDateTimeControlText');
  if (!heading || !dateLine || !control || !controlText) return;

  const storageKey = 'telemetria_monterrey_v_3d_fecha_hora_v1';

  function setVisible(visible, persist) {
    dateLine.hidden = !visible;
    heading.classList.toggle('mv-datetime-hidden', !visible);
    control.classList.toggle('active', visible);
    control.setAttribute('aria-pressed', String(visible));
    controlText.textContent = visible ? 'Fecha y hora: activadas' : 'Fecha y hora: desactivadas';
    control.title = visible ? 'Ocultar fecha y hora' : 'Mostrar fecha y hora';
    if (persist) {
      try { localStorage.setItem(storageKey, visible ? '1' : '0'); } catch (error) { }
    }
  }

  let visible = true;
  try { visible = localStorage.getItem(storageKey) !== '0'; } catch (error) { }
  setVisible(visible, false);
  control.addEventListener('click', () => setVisible(dateLine.hidden, true));
})();


(function () {
  const panel = document.getElementById('presentationPanel');
  const collapse = document.getElementById('presentationMobileCollapse');
  if (!panel || !collapse) return;
  function setCollapsed(collapsed) {
    panel.classList.toggle('mv-presentation-collapsed', collapsed);
    collapse.setAttribute('aria-expanded', String(!collapsed));
    collapse.textContent = collapsed ? 'Ampliar' : 'Reducir';
    collapse.title = collapsed ? 'Ampliar ficha de presentación' : 'Reducir ficha de presentación';
  }
  collapse.addEventListener('click', () => setCollapsed(!panel.classList.contains('mv-presentation-collapsed')));
  document.getElementById('presentationToggle')?.addEventListener('click', () => setCollapsed(false));
})();
