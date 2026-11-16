'use strict';
(function(){
  const $=id=>document.getElementById(id);
  const config={
    title:'Acueducto Linares',
    nodes:[
      ['li00','Presa Cerro Prieto','reservoir',34,14,null],
      ['li01','PB1 Linares','pump',22,12.6,'LINPB001'],
      ['li02','PB2 Linares','pump',10,10.6,'LINPB002'],
      ['li02a','PB2A Linares','pump',-1.5,8.2,'LINPB02A'],
      ['li03','PB3 Linares','pump',-13,4.4,'LINPB003'],
      ['li04a','Tanque Garrapatas','tank',-22,-1.6,'TGRP0001'],
      ['li05','Rompedor de carga','facility',-30,-0.8,'ROMPE001'],
      ['li04','PB4 Linares','pump',-38.5,2.4,'LINPB004']
    ],
    lines:[
      ['li00','li01'],['li01','li02'],['li02','li02a'],['li02a','li03'],
      ['li03','li04a'],['li04a','li05'],['li05','li04']
    ]
  };
  const separateCasetaX=x=>x>=22?x:22+(x-22)*1.105;
  for(const node of config.nodes){if(node[0]!=='li00')node[3]=separateCasetaX(node[3]);}
  const nodeById = new Map(config.nodes.map((node, index) => [node[0], { data: node, index }]));
  const live = new Map();
  const canvas=$('scene');
  /* MV PRO: ?calidad=ultra (o ?4k) para videowall; ?cielo=foto usa la imagen anterior; ?sombras=0 apaga sombras */
  const mvUltra = /[?&](calidad=ultra|4k)(&|$|=)/i.test(location.search) || (window.screen && window.screen.width * (window.devicePixelRatio || 1) >= 3800);
  const mvSkyPhoto = /[?&]cielo=foto/i.test(location.search);
  let mvMotionScale = 1, mvMotionTimer = 0, mvMotionResize = null;
  function mvMotionStart() {
    clearTimeout(mvMotionTimer);
    if (mvMotionScale !== .68) { mvMotionScale = .68; if (mvMotionResize) mvMotionResize(); }
    mvMotionTimer = setTimeout(() => { mvMotionScale = 1; if (mvMotionResize) mvMotionResize(); }, 260);
  }
  const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'})||canvas.getContext('webgl',{antialias:true,alpha:false,powerPreference:'high-performance'});
  if(!gl){$('notice').hidden=false;$('notice').textContent='No se pudo iniciar WebGL. Activa la aceleración gráfica.';return;}
  canvas.addEventListener('webglcontextlost',e=>e.preventDefault());
  canvas.addEventListener('webglcontextrestored',()=>location.reload());
  let eveningBlend=0;
  const vert = `
attribute vec3 aPos; attribute vec3 aNormal; attribute vec3 aColor; attribute vec4 aData;
uniform mat4 uVP; uniform float uTime; uniform float uAnimate; uniform float uLevels[36];
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
  if(id < 13.5) return uLevels[13];
  if(id < 14.5) return uLevels[14];
  if(id < 15.5) return uLevels[15];
  if(id < 16.5) return uLevels[16];
  if(id < 17.5) return uLevels[17];
  if(id < 18.5) return uLevels[18];
  if(id < 19.5) return uLevels[19];
  if(id < 20.5) return uLevels[20];
  if(id < 21.5) return uLevels[21];
  if(id < 22.5) return uLevels[22];
  if(id < 23.5) return uLevels[23];
  if(id < 24.5) return uLevels[24];
  if(id < 25.5) return uLevels[25];
  if(id < 26.5) return uLevels[26];
  if(id < 27.5) return uLevels[27];
  if(id < 28.5) return uLevels[28];
  if(id < 29.5) return uLevels[29];
  if(id < 30.5) return uLevels[30];
  if(id < 31.5) return uLevels[31];
  if(id < 32.5) return uLevels[32];
  if(id < 33.5) return uLevels[33];
  if(id < 34.5) return uLevels[34];
  return uLevels[35];
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
  vec3 surfaceNormal=aNormal;
  if(aData.z>11.5&&aData.z<12.5){
    float t=uTime*uAnimate;
    float edge=clamp(aData.x,0.0,1.0);
    float p1=dot(aPos.xz,vec2(.46,.27))+t*.75;
    float p2=dot(aPos.xz,vec2(-.21,.64))-t*1.02;
    float p3=dot(aPos.xz,vec2(.93,-.73))+t*1.37;
    p.y+=edge*uAnimate*(.034*sin(p1)+.020*sin(p2)+.008*sin(p3));
    vec2 slope=edge*uAnimate*(vec2(.46,.27)*(.034*cos(p1))+vec2(-.21,.64)*(.020*cos(p2))+vec2(.93,-.73)*(.008*cos(p3)));
    surfaceNormal=normalize(vec3(-slope.x,1.0,-slope.y));
  }
  vPos=p;vNormal=surfaceNormal;vColor=aColor;vData=aData;
  if(aData.z>18.5&&aData.z<19.5){
    float active=getLevel(aData.y);
    float enabled=smoothstep(.70,.95,active);
    vColor=mix(vec3(.43,.49,.53),vec3(.075,.48,.255),enabled);
    vData.x+=enabled*.22;
  }
  gl_Position=uVP*vec4(p,1.0);
  vShadowPos=uLightVP*vec4(p,1.0);
}`;
  const frag = `
precision highp float;
varying vec3 vNormal; varying vec3 vColor; varying vec3 vPos; varying vec4 vData;
varying float vTankFill;
uniform vec3 uCamera; uniform float uTime; uniform float uAnimate; uniform float uTerrainDetail; uniform float uEvening;
uniform float uCasetaLights[5];
float casetaLamp(float id){
  if(id<.5)return uCasetaLights[0];
  if(id<1.5)return uCasetaLights[1];
  if(id<2.5)return uCasetaLights[2];
  if(id<3.5)return uCasetaLights[3];
  return uCasetaLights[4];
}
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
  if (uTerrainDetail < .5) {
    float broad=noise2(uv*.065);
    float medium=noise2(uv*.42+vec2(-14.2,9.3));
    float fine=noise2(uv*2.4+vec2(4.3,17.9));
    float layout=clamp(broad*.56+medium*.33+fine*.11,0.,1.);
    vec3 dark=vec3(.075,.18,.08);
    vec3 base=vec3(.135,.31,.12);
    vec3 mid=vec3(.205,.42,.17);
    vec3 soft=vec3(.295,.54,.23);
    vec3 shade=mix(dark,base,smoothstep(.08,.52,layout));
    shade=mix(shade,mid,smoothstep(.42,.78,layout));
    shade=mix(shade,soft,smoothstep(.78,.97,layout)*.55);
    float brush=abs(sin(uv.x*7.+uv.y*3.+medium*2.4));
    shade+=vec3(.03,.045,.018)*smoothstep(.76,.96,brush)*.18;
    shade-=vec3(.018,.014,.008)*fine*.035;
    float sun=.84+.16*d+.06*d2;
    return shade*sun;
  }
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
} else if(kind>11.5&&kind<12.5){
  float t=uTime*uAnimate;
  vec2 uv=vPos.xz;
  float swell=waterNoise(uv*.18+vec2(t*.043,-t*.034));
  float ripples=waterNoise(uv*.79+vec2(-t*.17,t*.12));
  float fine=sin(uv.x*1.12+uv.y*.37+t*1.25)*sin(uv.y*.93-uv.x*.28-t*.91);
  float shadow=clamp(.17+.61*swell+.18*ripples+.09*fine,0.,1.);
  c=mix(vec3(.028,.143,.191),vec3(.109,.335,.364),shadow);
  float crests=pow(smoothstep(.69,.93,ripples+.12*fine),2.0);
  float reflection=pow(max(dot(N,H),0.),28.0)*(.42+.58*swell);
  float horizon=pow(1.0-max(dot(N,V),0.0),3.0);
  c+=vec3(.20,.37,.39)*(crests*.115+reflection*.52+horizon*.13);
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
  float sillaZone=smoothstep(47.,78.,-vPos.x)*(1.0-smoothstep(65.,105.,abs(vPos.z-24.)));
  float rocky=sillaZone*smoothstep(5.,18.,vPos.y)*(.42+.58*smoothstep(.08,.48,1.0-N.y));
  c=mix(c,vColor,clamp(rocky*.94,0.,.94));
  c*=.65+.34*d+.07*d2;
  float grassGlint=pow(max(dot(normalize(reflect(-L,N)),V),0.0),8.0)*.018;
  c+=vec3(.018,.028,.012)*grassGlint;
  float banks=clamp(vData.x,0.,1.);
  c=mix(c,vColor*(.74+.30*d+.07*d2),banks);
} else if(kind>11.5&&kind<12.5){
  float cycle=mod(uTime+vData.y*3.35,8.4);
  float lit=1.0-smoothstep(4.0,4.38,cycle)+smoothstep(8.05,8.4,cycle);
  float glass=0.975+0.025*sin(uTime*3.2+vPos.x*7.8);
  c=mix(vec3(.027,.054,.071),vec3(1.0,.78,.38)*glass,lit);
  c+=vec3(.23,.16,.035)*lit;
} else if(kind>12.5&&kind<13.5){
  float cycle=mod(uTime+vData.y*3.35,8.4);
  float lit=1.0-smoothstep(4.0,4.38,cycle)+smoothstep(8.05,8.4,cycle);
  c=vec3(1.0,.65,.20);
  outAlpha*=lit;
}
if((kind>3.5&&kind<4.5)||(kind>7.5&&kind<8.5)) c+=vec3(.08,.12,.14)*fres*(.60+.40*d);
if(kind>15.5&&kind<16.5){
  float on=casetaLamp(vData.y);
  float hot=smoothstep(.55,.83,vData.x);
  vec3 dark=vColor*.29;
  vec3 lit=mix(vColor*(.88+.10*d)+vec3(.24,.14,.055),vec3(1.0,.86,.52),hot);
  c=mix(dark,lit,on);
  outAlpha*=mix(.06,1.0,on);
}
if(kind>16.5&&kind<17.5){
  float on=casetaLamp(vData.y);
  c=mix(vec3(.33,.22,.10),vec3(1.0,.79,.45),clamp(vData.x,0.0,1.0));
  outAlpha*=on;
}
if(kind>17.5&&kind<18.5){
  float on=casetaLamp(vData.y);
  c+=vec3(.46,.31,.13)*on*clamp(vData.x,0.0,1.0);
}
if(kind>18.5&&kind<19.5){
  float operating=1.0-smoothstep(.16,.34,vColor.r);
  c=mix(vec3(.30,.36,.39)*(.76+.24*d),vec3(.035,.75,.15)*(.75+.25*d),operating);
  c+=vec3(.025,.28,.04)*operating;
}
{
  vec3 R=reflect(-V,N);
  bool glow=(kind>.5&&kind<1.5)||(kind>2.5&&kind<3.5)||(kind>8.5&&kind<10.5)||(kind>11.5&&kind<14.5)||(kind>15.5&&kind<18.5)||(kind>4.5&&kind<6.5);
  if(!glow) c*=1.0-(1.0-mvSh)*.36;
  if(kind>3.5&&kind<4.5){ c=mix(c,mvSky(R)*.92,clamp(.04+fres*.30,0.0,.26)); c+=vec3(1.0,.97,.90)*pow(max(dot(N,H),0.0),220.0)*1.0*mvSh; }
  else if((kind>1.5&&kind<2.5)||(kind>4.5&&kind<6.5)){ c=mix(c,mvSky(R)*.80,clamp(fres*.30,0.0,.24)); c+=vec3(1.0,.97,.90)*pow(max(dot(N,H),0.0),160.0)*.6*mvSh; }
  else if(kind>7.5&&kind<8.5){ c+=mvSky(R)*fres*.10; }
}
c*=mix(vec3(1.0),vec3(.66,.72,.83),uEvening);
if(kind>14.5&&kind<15.5){
  c=vec3(.028,.047,.033);
}
if(kind>13.5&&kind<14.5){
  c=vec3(.98,.77,.46);
  outAlpha=min(1.0,outAlpha*(1.0+2.6*uEvening));
}
if(kind>19.5&&kind<20.5){ c=mix(vec3(.78,.78,.72)*(.7+.3*d),vec3(1.0,.88,.62)*1.35,uEvening); }
if(kind>20.5&&kind<21.5){ c=vec3(1.0,.80,.50); outAlpha*=uEvening; }
c+=vColor*shine*.28*(1.0+uEvening*.82);
float dist=length(vPos-uCamera);
c=mix(c,mix(vec3(.37,.46,.48),vec3(.21,.27,.32),uEvening),clamp((dist-105.0)/155.0,0.,.10));
gl_FragColor=vec4(mvGrade(c),outAlpha);
}`;
  const fallbackVert = `
attribute vec3 aPos; attribute vec3 aNormal; attribute vec3 aColor; attribute vec4 aData;
uniform mat4 uVP; uniform float uTime; uniform float uAnimate; uniform float uLevels[36];
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
  if(id < 13.5) return uLevels[13];
  if(id < 14.5) return uLevels[14];
  if(id < 15.5) return uLevels[15];
  if(id < 16.5) return uLevels[16];
  if(id < 17.5) return uLevels[17];
  if(id < 18.5) return uLevels[18];
  if(id < 19.5) return uLevels[19];
  if(id < 20.5) return uLevels[20];
  if(id < 21.5) return uLevels[21];
  if(id < 22.5) return uLevels[22];
  if(id < 23.5) return uLevels[23];
  if(id < 24.5) return uLevels[24];
  if(id < 25.5) return uLevels[25];
  if(id < 26.5) return uLevels[26];
  if(id < 27.5) return uLevels[27];
  if(id < 28.5) return uLevels[28];
  if(id < 29.5) return uLevels[29];
  if(id < 30.5) return uLevels[30];
  if(id < 31.5) return uLevels[31];
  if(id < 32.5) return uLevels[32];
  if(id < 33.5) return uLevels[33];
  if(id < 34.5) return uLevels[34];
  return uLevels[35];
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
  vec3 surfaceNormal=aNormal;
  if(aData.z>11.5&&aData.z<12.5){
    float t=uTime*uAnimate;
    float edge=clamp(aData.x,0.0,1.0);
    float p1=dot(aPos.xz,vec2(.46,.27))+t*.75;
    float p2=dot(aPos.xz,vec2(-.21,.64))-t*1.02;
    float p3=dot(aPos.xz,vec2(.93,-.73))+t*1.37;
    p.y+=edge*uAnimate*(.034*sin(p1)+.020*sin(p2)+.008*sin(p3));
    vec2 slope=edge*uAnimate*(vec2(.46,.27)*(.034*cos(p1))+vec2(-.21,.64)*(.020*cos(p2))+vec2(.93,-.73)*(.008*cos(p3)));
    surfaceNormal=normalize(vec3(-slope.x,1.0,-slope.y));
  }
  vPos=p;vNormal=surfaceNormal;vColor=aColor;vData=aData;
  if(aData.z>18.5&&aData.z<19.5){
    float active=getLevel(aData.y);
    float enabled=smoothstep(.70,.95,active);
    vColor=mix(vec3(.43,.49,.53),vec3(.075,.48,.255),enabled);
    vData.x+=enabled*.22;
  }
  gl_Position=uVP*vec4(p,1.0);
}`;
  const fallbackFrag = `
precision highp float;
varying vec3 vNormal; varying vec3 vColor; varying vec3 vPos; varying vec4 vData;
uniform vec3 uCamera; uniform float uTime; uniform float uAnimate; uniform float uTerrainDetail; uniform float uEvening;
uniform float uCasetaLights[5];
float casetaLamp(float id){
  if(id<.5)return uCasetaLights[0];
  if(id<1.5)return uCasetaLights[1];
  if(id<2.5)return uCasetaLights[2];
  if(id<3.5)return uCasetaLights[3];
  return uCasetaLights[4];
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
  if (uTerrainDetail < .5) {
    float broad=noise2(uv*.065);
    float medium=noise2(uv*.42+vec2(-14.2,9.3));
    float fine=noise2(uv*2.4+vec2(4.3,17.9));
    float layout=clamp(broad*.56+medium*.33+fine*.11,0.,1.);
    vec3 dark=vec3(.075,.18,.08);
    vec3 base=vec3(.135,.31,.12);
    vec3 mid=vec3(.205,.42,.17);
    vec3 soft=vec3(.295,.54,.23);
    vec3 shade=mix(dark,base,smoothstep(.08,.52,layout));
    shade=mix(shade,mid,smoothstep(.42,.78,layout));
    shade=mix(shade,soft,smoothstep(.78,.97,layout)*.55);
    float brush=abs(sin(uv.x*7.+uv.y*3.+medium*2.4));
    shade+=vec3(.03,.045,.018)*smoothstep(.76,.96,brush)*.18;
    shade-=vec3(.018,.014,.008)*fine*.035;
    float sun=.84+.16*d+.06*d2;
    return shade*sun;
  }
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
float outAlpha=vData.w;
vec3 c=vColor*(0.36+0.55*d+0.22*d2)+vec3(.65,.86,1.0)*spec*.35;
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
  c=mvUnifiedGrass(vPos.xz,N,L,V,d,d2);
} else if(kind>7.5&&kind<8.5){

  float rim=pow(1.0-max(dot(N,V),0.0),2.3);
  c=vColor*(.77+.19*d+.08*d2)+vec3(.15,.15,.16)*rim+.12*spec*vec3(1.0);
} else if(kind>11.5&&kind<12.5){
  float t=uTime*uAnimate;
  vec2 uv=vPos.xz;
  float swell=waterNoise(uv*.18+vec2(t*.043,-t*.034));
  float ripples=waterNoise(uv*.79+vec2(-t*.17,t*.12));
  float fine=sin(uv.x*1.12+uv.y*.37+t*1.25)*sin(uv.y*.93-uv.x*.28-t*.91);
  float shadow=clamp(.17+.61*swell+.18*ripples+.09*fine,0.,1.);
  c=mix(vec3(.028,.143,.191),vec3(.109,.335,.364),shadow);
  float crests=pow(smoothstep(.69,.93,ripples+.12*fine),2.0);
  float reflection=pow(max(dot(N,H),0.),28.0)*(.42+.58*swell);
  float horizon=pow(1.0-max(dot(N,V),0.0),3.0);
  c+=vec3(.20,.37,.39)*(crests*.115+reflection*.52+horizon*.13);
} else if(kind>10.5&&kind<11.5){
  vec2 pos=vPos.xz;
  float wooded=smoothstep(68.0,104.0,length(pos));
  vec3 meadow=mvUnifiedGrass(pos,N,L,V,d,d2);
  float shade=noise2(pos*.063+vec2(3.8,6.4));
  float leaves=noise2(pos*.21+vec2(11.2,-9.5));
  vec3 canopy=mix(vec3(.11,.24,.095),vec3(.21,.39,.15),shade*.65+leaves*.35);
  c=mix(meadow,canopy*(.68+.34*d+.08*d2),wooded);
  float banks=clamp(vData.x,0.,1.);
  c=mix(c,vColor*(.74+.30*d+.07*d2),banks);
} else if(kind>11.5&&kind<12.5){
  float cycle=mod(uTime+vData.y*3.35,8.4);
  float lit=1.0-smoothstep(4.0,4.38,cycle)+smoothstep(8.05,8.4,cycle);
  float glass=0.975+0.025*sin(uTime*3.2+vPos.x*7.8);
  c=mix(vec3(.027,.054,.071),vec3(1.0,.78,.38)*glass,lit);
  c+=vec3(.23,.16,.035)*lit;
} else if(kind>12.5&&kind<13.5){
  float cycle=mod(uTime+vData.y*3.35,8.4);
  float lit=1.0-smoothstep(4.0,4.38,cycle)+smoothstep(8.05,8.4,cycle);
  c=vec3(1.0,.65,.20);
  outAlpha*=lit;
}
if((kind>3.5&&kind<4.5)||(kind>7.5&&kind<8.5)) c+=vec3(.08,.12,.14)*fres*(.60+.40*d);
if(kind>15.5&&kind<16.5){
  float on=casetaLamp(vData.y);
  float hot=smoothstep(.55,.83,vData.x);
  vec3 dark=vColor*.29;
  vec3 lit=mix(vColor*(.88+.10*d)+vec3(.24,.14,.055),vec3(1.0,.86,.52),hot);
  c=mix(dark,lit,on);
  outAlpha*=mix(.06,1.0,on);
}
if(kind>16.5&&kind<17.5){
  float on=casetaLamp(vData.y);
  c=mix(vec3(.33,.22,.10),vec3(1.0,.79,.45),clamp(vData.x,0.0,1.0));
  outAlpha*=on;
}
if(kind>17.5&&kind<18.5){
  float on=casetaLamp(vData.y);
  c+=vec3(.46,.31,.13)*on*clamp(vData.x,0.0,1.0);
}
if(kind>18.5&&kind<19.5){
  float operating=1.0-smoothstep(.16,.34,vColor.r);
  c=mix(vec3(.30,.36,.39)*(.76+.24*d),vec3(.035,.75,.15)*(.75+.25*d),operating);
  c+=vec3(.025,.28,.04)*operating;
}
c*=mix(vec3(1.0),vec3(.66,.72,.83),uEvening);
if(kind>14.5&&kind<15.5){
  c=vec3(.028,.047,.033);
}
if(kind>13.5&&kind<14.5){
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
      const notice=document.getElementById('notice');notice.textContent='Error del motor gráfico: '+fallbackError.message;notice.hidden=false;return;
    }
  }
  gl.useProgram(program);
  const loc = { pos: gl.getAttribLocation(program, 'aPos'), normal: gl.getAttribLocation(program, 'aNormal'), color: gl.getAttribLocation(program, 'aColor'), data: gl.getAttribLocation(program, 'aData'), vp: gl.getUniformLocation(program, 'uVP'), cam: gl.getUniformLocation(program, 'uCamera'), time: gl.getUniformLocation(program, 'uTime'), levels: gl.getUniformLocation(program, 'uLevels[0]'), anim: gl.getUniformLocation(program, 'uAnimate'), terrainDetail: gl.getUniformLocation(program, 'uTerrainDetail'), turf: gl.getUniformLocation(program, 'uTurfTex'), forest: gl.getUniformLocation(program, 'uForestTex'), evening: gl.getUniformLocation(program, 'uEvening'), casetaLights: gl.getUniformLocation(program, 'uCasetaLights[0]') };
  /* ===== MV PRO: sombras del sol ===== */
  const mvLoc = {
    lightVP: gl.getUniformLocation(program, 'uLightVP'), shadowMap: gl.getUniformLocation(program, 'uShadowMap'),
    shadowOn: gl.getUniformLocation(program, 'uShadowOn'), shadowTexel: gl.getUniformLocation(program, 'uShadowTexel'),
    grade: gl.getUniformLocation(program, 'uProGrade')
  };
  if (mvLoc.shadowMap) gl.uniform1i(mvLoc.shadowMap, 3);
  if (mvLoc.grade) gl.uniform1f(mvLoc.grade, 1);
  let mvShadowDirty = true, mvShadowKey = -1;
  const mvShadow = (() => {
    if (!enhancedWaterShader || !mvLoc.lightVP || /[?&]sombras=0/i.test(location.search)) return null;
    const isGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    if (!isGL2 && !gl.getExtension('WEBGL_depth_texture')) return null;
    const size = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 4096);
    try {
      const depth = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, depth);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (isGL2) gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      const color = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, color); gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, size, size);
      const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth, 0);
      const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.bindTexture(gl.TEXTURE_2D, null);
      if (!ok) return null;
      const sp = gl.createProgram();
      gl.attachShader(sp, shader(gl.VERTEX_SHADER, vert));
      gl.attachShader(sp, shader(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec4 vData;varying float vTankFill;void main(){float k=vData.z;if(vData.w<.10||(k>8.5&&k<11.5)||(k>.5&&k<1.5)||(k>2.5&&k<3.5)||(k>11.5&&k<14.5)||(k>15.5&&k<18.5)||k>19.5)discard;if((k>4.5&&k<6.5)&&vTankFill<.018)discard;gl_FragColor=vec4(1.0);}'));
      for (const [name, index] of [['aPos', loc.pos], ['aNormal', loc.normal], ['aColor', loc.color], ['aData', loc.data]]) if (index >= 0) gl.bindAttribLocation(sp, index, name);
      gl.linkProgram(sp);
      if (!gl.getProgramParameter(sp, gl.LINK_STATUS)) return null;
      const Ll = Math.hypot(-.42, .95, .56), Lx = -.42 / Ll, Ly = .95 / Ll, Lz = .56 / Ll;
      const center = [-28, 0, 4], half = 78, dist = 240;
      const eye = [center[0] + Lx * dist, center[1] + Ly * dist, center[2] + Lz * dist];
      const n = 1, f = 520;
      const ortho = [1 / half, 0, 0, 0, 0, 1 / half, 0, 0, 0, 0, -2 / (f - n), 0, 0, 0, -(f + n) / (f - n), 1];
      return { fbo, depth, size, ortho, eye, center, lightVP: null, program: sp,
        vp: gl.getUniformLocation(sp, 'uVP'), time: gl.getUniformLocation(sp, 'uTime'), levels: gl.getUniformLocation(sp, 'uLevels[0]'), anim: gl.getUniformLocation(sp, 'uAnimate') };
    } catch (error) { console.warn('Linares 3D: sombras no disponibles:', error && error.message); gl.bindFramebuffer(gl.FRAMEBUFFER, null); return null; }
  })();
  function mvRenderShadowMap() {
    if (!mvShadow) return;
    if (!mvShadow.lightVP) {
      const zA = norm(minus(mvShadow.eye, mvShadow.center)), xA = norm(cross([0, 1, 0], zA)), yA = cross(zA, xA), e = mvShadow.eye;
      const v = [xA[0], yA[0], zA[0], 0, xA[1], yA[1], zA[1], 0, xA[2], yA[2], zA[2], 0, -(xA[0] * e[0] + xA[1] * e[1] + xA[2] * e[2]), -(yA[0] * e[0] + yA[1] * e[1] + yA[2] * e[2]), -(zA[0] * e[0] + zA[1] * e[1] + zA[2] * e[2]), 1];
      const o = mvShadow.ortho, m = new Float32Array(16);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let sum = 0; for (let k = 0; k < 4; k++) sum += o[k * 4 + r] * v[c * 4 + k]; m[c * 4 + r] = sum; }
      mvShadow.lightVP = m;
    }
    let key = 0; for (let i = 0; i < levelsUniform.length; i++) key += levelsUniform[i] * (i + 1);
    if (Math.abs(key - mvShadowKey) > .0005) { mvShadowKey = key; mvShadowDirty = true; }
    if (!mvShadowDirty) return;
    mvShadowDirty = false;
    gl.bindFramebuffer(gl.FRAMEBUFFER, mvShadow.fbo); gl.viewport(0, 0, mvShadow.size, mvShadow.size);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); gl.disable(gl.BLEND); gl.colorMask(false, false, false, false);
    gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.6, 3.0);
    gl.useProgram(mvShadow.program);
    gl.uniformMatrix4fv(mvShadow.vp, false, mvShadow.lightVP);
    if (mvShadow.time) gl.uniform1f(mvShadow.time, 0); if (mvShadow.levels) gl.uniform1fv(mvShadow.levels, levelsUniform); if (mvShadow.anim) gl.uniform1f(mvShadow.anim, 0);
    drawGroup(0); drawGroup(1);
    gl.disable(gl.POLYGON_OFFSET_FILL); gl.colorMask(true, true, true, true);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
  }
  function mvBindProUniforms() {
    if (!enhancedWaterShader) return;
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, mvShadow ? mvShadow.depth : null); gl.activeTexture(gl.TEXTURE0);
    if (mvLoc.shadowOn) gl.uniform1f(mvLoc.shadowOn, mvShadow && mvShadow.lightVP ? 1 : 0);
    if (mvShadow && mvShadow.lightVP) { gl.uniformMatrix4fv(mvLoc.lightVP, false, mvShadow.lightVP); gl.uniform2f(mvLoc.shadowTexel, 1 / mvShadow.size, 1 / mvShadow.size); }
  }
  function terrainRand(seed) {
    let value = seed >>> 0;
    return () => {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }
  function terrainTextureCanvas(type) {
    const size = 512;
    const textureLimit = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const deviceMemory = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : 6;
    const viewportPixels = Math.max(1, canvas.clientWidth * canvas.clientHeight);
    const terrainTextureScale = textureLimit >= 2048 && deviceMemory >= 8 && viewportPixels >= 3000000 ? 4 : textureLimit >= 1024 && deviceMemory >= 4 ? 2 : 1;
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
  if (loc.turf !== null) gl.uniform1i(loc.turf, 1);
  if (loc.forest !== null) gl.uniform1i(loc.forest, 2);
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
        const skyHeight = Math.max(1, Math.round(skyWidth * skyImage.height / skyImage.width));
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
    skyImage.onerror = () => { skyAssetSettled = true; console.warn('Cielo de Monterrey V no disponible'); };
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
    if (skyLoc.evening !== null) gl.uniform1f(skyLoc.evening, eveningBlend);
    if (skyLoc.procedural) gl.uniform1f(skyLoc.procedural, mvSkyPhoto ? 0 : 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
  }
  const colorCache = {}; function rgb(h) { if (!colorCache[h]) { h = h.replace('#', ''); colorCache[h] = [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255] } return colorCache[h] }
  let A = [[], [], []];
  function vec(x, y, z) { return [x, y, z] }; const plus = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; const minus = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; const vscale = (a, k) => [a[0] * k, a[1] * k, a[2] * k]; const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; const norm = a => { const l = Math.hypot(...a) || 1; return vscale(a, 1 / l) };
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
      const ring = []; for (let i = 0; i <= seg; i++) { const theta = i / seg * Math.PI * 2; const d = plus(vscale(u, Math.cos(theta)), vscale(v, Math.sin(theta))); ring.push({ p: plus(point, vscale(d, r)), n: d }); }
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
      for (let i = 0; i <= seg; i++) { const theta = i / seg * Math.PI * 2; const d = plus(vscale(u, Math.cos(theta)), vscale(v, Math.sin(theta))); ring.push({ p: plus(point, vscale(d, rr)), n: d }); }
      if (previous) { const section = Math.hypot(...minus(points[j], points[j - 1])); for (let i = 0; i < seg; i++) { const a0 = previous.ring[i], a1 = previous.ring[i + 1], b0 = ring[i], b1 = ring[i + 1]; const out = A[g], c = rgb(col); out.push(...vertex(a0.p, a0.n, c, emit, distance - section, kind, alpha), ...vertex(a1.p, a1.n, c, emit, distance - section, kind, alpha), ...vertex(b1.p, b1.n, c, emit, distance, kind, alpha), ...vertex(a0.p, a0.n, c, emit, distance - section, kind, alpha), ...vertex(b1.p, b1.n, c, emit, distance, kind, alpha), ...vertex(b0.p, b0.n, c, emit, distance, kind, alpha)) } }
      previous = { ring }; if (j < points.length - 1) distance += Math.hypot(...minus(points[j + 1], points[j]));
    }
  }
  function roundPath(points, r = .6) { if (points.length <= 2) return points; const out = [points[0]]; for (let i = 1; i < points.length - 1; i++) { const prev = points[i - 1], cur = points[i], next = points[i + 1]; const u = minus(prev, cur), v = minus(next, cur), lu = Math.hypot(...u), lv = Math.hypot(...v); if (lu < .02 || lv < .02) continue; const len = Math.min(r, lu * .32, lv * .32); const entry = plus(cur, vscale(norm(u), len)), exit = plus(cur, vscale(norm(v), len)); out.push(entry); for (let j = 1; j <= 6; j++) { const t = j / 6; out.push(plus(plus(vscale(entry, (1 - t) * (1 - t)), vscale(cur, 2 * (1 - t) * t)), vscale(exit, t * t))) } } out.push(points[points.length - 1]); return out }
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
    const id = Math.max(0,tankSpecs.findIndex(s=>s.name===name)), maxWaterHeight = H * .90;

    cylinder(x, .31, z, R * 1.13, .18, '#667c88', { seg: 36 });
    cylinder(x, .43, z, R * .99, .07, '#2f5164', { seg: 36 });

    cylinder(x, .52 + maxWaterHeight / 2, z, R * .94, maxWaterHeight, '#0869bc',
      { seg: 64, kind: 5, em: 1.08, caps: false, levelId: id });
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

    ring(x, ty + H * .53, z, frameR, '#597d8b', .025, { seg: 6, em: .05 });
    const gaugeX=x+R*1.38,gaugeZ=z+R*.37;
    bar([gaugeX-.16,.51,gaugeZ],[gaugeX-.16,.52+maxWaterHeight,gaugeZ],.034,'#9db5bd',{seg:7});
    bar([gaugeX+.16,.51,gaugeZ],[gaugeX+.16,.52+maxWaterHeight,gaugeZ],.034,'#9db5bd',{seg:7});
    bar([gaugeX,.52+maxWaterHeight,gaugeZ],[gaugeX,.52+maxWaterHeight+.03,gaugeZ],.17,'#d4e0e1',{seg:9});
    cylinder(gaugeX,.52+maxWaterHeight*.50,gaugeZ,.115,maxWaterHeight,'#128fd2',{seg:16,kind:5,levelId:id,em:.85,caps:false});
    for(let i=0;i<=5;i++){const y=.52+maxWaterHeight*i/5;bar([gaugeX-.17,y,gaugeZ+.12],[gaugeX+.16,y,gaugeZ+.12],.018,'#d8e5e4',{seg:6});}

    const gold = '#eebd54', zr = z - R - .15, lx = x - R * .62;
    bar([lx, .48, zr], [lx, yTop, zr], .049, gold, { seg: 8 });
    bar([lx + .39, .48, zr], [lx + .39, yTop, zr], .049, gold, { seg: 8 });
    for (let y = .65; y < yTop - .13; y += .32)bar([lx, y, zr], [lx + .39, y, zr], .037, gold, { seg: 7 });

    ring(x, .35, z, R * 1.24, '#94b6c2', .045, { seg: 6, em: .11 });
    return { x, y: yTop, z, name, baseY: .52, height: H, radius: R, levelId: id, screenY, screenZ: screenSurface, screenW: displayW, screenH: displayH, wallRadius, surfaceGap };
  }
  function orientedCylinder(a, b, r, col, opt = {}) {
    const d = minus(b, a), L = Math.hypot(...d); const t = norm(d); const ref = Math.abs(t[1]) > .93 ? [1, 0, 0] : [0, 1, 0], u = norm(cross(ref, t)), v = norm(cross(t, u)), S = opt.seg || 16; const g = opt.g || 0, em = opt.em || 0, alpha = opt.alpha === undefined ? 1 : opt.alpha, kind=opt.kind||0, levelId=opt.levelId===undefined?0:opt.levelId;
    for (let i = 0; i < S; i++) { const theta = i / S * Math.PI * 2, beta = (i + 1) / S * Math.PI * 2; let n = plus(vscale(u, Math.cos(theta)), vscale(v, Math.sin(theta))), N = plus(vscale(u, Math.cos(beta)), vscale(v, Math.sin(beta))); const p = plus(a, vscale(n, r)), q = plus(a, vscale(N, r)), P = plus(b, vscale(n, r)), Q = plus(b, vscale(N, r)); tri(g, p, n, q, N, Q, N, col, em, levelId, kind, alpha); tri(g, p, n, Q, N, P, n, col, em, levelId, kind, alpha); if (opt.caps !== false) { tri(g, a, vscale(t, -1), q, vscale(t, -1), p, vscale(t, -1), col, em, levelId, kind, alpha); tri(g, b, t, P, t, Q, t, col, em, levelId, kind, alpha) } }
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
  const PLAY_HALF_W = 49.8, PLAY_HALF_D = 30.8;
  const siteRoadSegments = [
  ];  function siteRoad(segment) {
    const [x1, z1, x2, z2, width] = segment;
    const horizontal = Math.abs(x2 - x1) >= Math.abs(z2 - z1);
    const length = Math.hypot(x2 - x1, z2 - z1);
    const centerX = (x1 + x2) * .5;
    const centerZ = (z1 + z2) * .5;
    box(centerX, -.031, centerZ, horizontal ? length + width : width, .092, horizontal ? width : length + width, '#626d68');
    box(centerX, .018, centerZ, horizontal ? length + width : width - .14, .018, horizontal ? width - .14 : length + width, '#394b49');
    const edge = width * .5 - .035;
    for (const sign of [-1, 1]) {
      box(centerX + (horizontal ? 0 : sign * edge), .037, centerZ + (horizontal ? sign * edge : 0), horizontal ? length : .055, .026, horizontal ? .055 : length, '#abb5ae');
    }
  }
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
  for (let i = 0; i < 7600; i++) {
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
  const sillaRelief = (x, z) => {
    const towardWest = smoothTerrain(40, 64, -x);
    if (towardWest < .0001 || Math.abs(z - 6) > 132 || x < -190) return 0;
    const gaussian = (cx, cz, rx, rz) => {
      const dx = (x - cx) / rx, dz = (z - cz) / rz;
      return Math.exp(-.5 * (dx * dx + dz * dz));
    };
    const baseMass = gaussian(-83, 6, 33, 126) * 14;
    const westernWall = gaussian(-89, 6, 18, 122) * 10;
    const longBack = gaussian(-97, 4, 26, 136) * 8;
    const northShoulder = gaussian(-80, -72, 24, 30) * 16;
    const northCrown = gaussian(-74, -28, 21, 23) * 27;
    const northSpine = gaussian(-77, -6, 25, 18) * 15;
    const southCrown = gaussian(-74, 40, 20, 21) * 26;
    const southTail = gaussian(-80, 86, 26, 32) * 18;
    const southSpine = gaussian(-78, 18, 26, 18) * 15;
    const apron = gaussian(-70, 7, 21, 118) * 7;
    const splitPass = gaussian(-80, 8, 34, 9) * 24 + gaussian(-98, 8, 22, 10) * 11 + gaussian(-63, 7, 18, 8) * 10;
    const body = baseMass + westernWall + longBack + northShoulder + northCrown + northSpine + southCrown + southTail + southSpine + apron - splitPass;
    const serrations = 1 + .075 * Math.sin(x * .16 + z * .20) + .045 * Math.sin(x * .31 - z * .12);
    const crags = (terrainNoise(x * .13 + 5.4, z * .11 - 9.6) - .5) * 2.4;
    const westFade = 1 - smoothTerrain(150, 188, -x);
    const latFade = 1 - smoothTerrain(110, 130, Math.abs(z - 6));
    return Math.max(0, body * serrations + crags) * towardWest * westFade * latFade * .68;
  };
  const lakeOutline=[
    [36.4,4.1],[37.3,11.6],[37.8,20.8],[38.7,29.7],[42.2,35.1],[48.8,37.8],
    [55.8,38.9],[61.6,41.5],[66.4,45.1],[71.7,47.0],[77.0,46.0],[81.7,44.1],
    [84.9,40.6],[86.5,36.0],[89.6,33.6],[94.5,31.3],[99.7,29.0],[104.8,24.2],
    [108.2,18.6],[109.4,12.1],[108.2,6.0],[104.7,2.7],[100.4,-0.9],[95.8,-5.1],
    [91.2,-8.8],[86.8,-11.4],[80.6,-14.0],[74.1,-15.6],[66.2,-15.2],[57.8,-14.3],
    [49.1,-11.7],[43.2,-8.0],[39.2,-3.7]
  ];
  const lakeCenter=[73.0,14.2];
  const lakeShore=[];
  for(let i=0;i<lakeOutline.length;i++){
    const p0=lakeOutline[(i-1+lakeOutline.length)%lakeOutline.length];
    const p1=lakeOutline[i];
    const p2=lakeOutline[(i+1)%lakeOutline.length];
    const p3=lakeOutline[(i+2)%lakeOutline.length];
    for(let j=0;j<5;j++){
      const t=j/5,t2=t*t,t3=t2*t;
      const interpolate=k=>.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3);
      lakeShore.push([interpolate(0),interpolate(1)]);
    }
  }
  const lakeDistance=(x,z)=>{
    let inside=false,minSq=1e10;
    for(let i=0,j=lakeShore.length-1;i<lakeShore.length;j=i++){
      const a=lakeShore[i],b=lakeShore[j];
      const dx=b[0]-a[0],dz=b[1]-a[1],len=dx*dx+dz*dz;
      const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(len||1)));
      minSq=Math.min(minSq,(x-a[0]-t*dx)**2+(z-a[1]-t*dz)**2);
      if(((a[1]>z)!==(b[1]>z))&&(x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0]))inside=!inside;
    }
    return Math.sqrt(minSq)*(inside?-1:1);
  };
  const shoreBlend=(x,z)=>{
    if(x<30||x>122||z<-29||z>67)return 0;
    const d=lakeDistance(x,z);
    if(d<-.12||d>10)return 0;
    const patch=terrainNoise(x*.28+13.8,z*.24-7.4);
    const wet=terrainNoise(x*.57-3.2,z*.62+6.1);
    const inner=1-smoothTerrain(.9,5.3+3.5*patch,d);
    const mottled=.49+.29*patch+.18*wet;
    return Math.max(0,Math.min(1,inner*mottled));
  };
  const terrainHeight = (x, z) => {
    const radius = Math.hypot(x, z);
    let height = -.048;
    if (radius > 68) {
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
      height += roundedRelief + naturalFolds + ridgeLift + localTexture;
    }
    height+=sillaRelief(x,z);
    if(x>28&&x<128&&z>-32&&z<72){
      const shore=lakeDistance(x,z);
      if(shore<=0)return .43-.89*smoothTerrain(0,3.7,-shore);
      if(shore<9.0){
        const t=smoothTerrain(0,9.0,shore);
        const erosion=(terrainNoise(x*.24+6.4,z*.30-12.8)-.5)*.13*4*t*(1-t);
        return .46+(height-.46)*t+erosion;
      }
    }
    return height;
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
    const grass = [.13 + .09 * moss + .042 * dry + .032 * altitude,
      .29 + .12 * moss - .025 * altitude + .018 * dry,
      .11 + .052 * moss + .004 * altitude];
    const rockySlope = smoothTerrain(2, 13, sillaRelief(x, z));
    const rockBlend = rockySlope * smoothTerrain(48, 75, -x) * (1 - smoothTerrain(69, 102, Math.abs(z - 24)));
    const strata = .82 + .23 * terrainNoise(x * .23 + z * .075, z * .11 - 4);
    const rock = [(.30 + .09 * dry) * strata, (.29 + .055 * moss) * strata, (.255 + .045 * dry) * strata];
    const base=grass.map((value, i) => value * (1 - rockBlend) + rock[i] * rockBlend);
    const blend=shoreBlend(x,z);
    const wet=terrainNoise(x*.42+3.4,z*.38-11.1);
    const gravel=terrainNoise(x*.19-19.2,z*.23+7.6);
    const earth=[.23+.08*gravel,.23+.09*gravel,.18+.06*wet];
    return base.map((v,i)=>v*(1-blend)+earth[i]*blend);
  };
  const terrainWidth = 520, terrainDepth = 440, terrainStepsX = 198, terrainStepsZ = 168;
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
    out.push(...vertex(a.p,a.n,a.c,shoreBlend(a.p[0],a.p[2]),0,11,1),
      ...vertex(b.p,b.n,b.c,shoreBlend(b.p[0],b.p[2]),0,11,1),
      ...vertex(c.p,c.n,c.c,shoreBlend(c.p[0],c.p[2]),0,11,1));
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
  for (let i = 0; i < 1800; i++) {
    const angle = forestRandom() * Math.PI * 2;
    const radius = 94 + Math.sqrt(forestRandom()) * 150;
    const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
    const ground = terrainHeight(x, z);
    if (ground < 2.0 || sillaRelief(x, z) > 16) continue;
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


  const tankSpecs=config.nodes.filter(n=>n[2]==='tank').map(n=>({name:n[1],fraction:0.45}));
  const pipeDefs=[];
  const tankLabels=[];
  const pointNodes=new Map(config.nodes.map(n=>[n[0],n]));
  const customPipePaths={
    'li00|li01':[[34,1.03,14],[30.6,1.03,14.0],[26.4,1.03,13.5],[22,1.03,12.6]],
    'li01|li02':[[22,1.03,12.6],[18.4,1.03,12.2],[14.4,1.03,11.4],[10,1.03,10.6]],
    'li02|li02a':[[10,1.03,10.6],[7.0,1.03,10.2],[3.2,1.03,9.4],[-1.5,1.03,8.2]],
    'li02a|li03':[[ -1.5,1.03,8.2],[-5.8,1.03,7.2],[-9.6,1.03,6.0],[-13,1.03,4.4]],
    'li03|li04a':[[ -13,1.03,4.4],[-15.2,1.03,2.8],[-17.6,1.03,1.4],[-19.8,1.03,-0.1],[-22,1.03,-1.6]],
    'li04a|li05':[[ -22,1.03,-1.6],[-24.2,1.03,-1.5],[-26.6,1.03,-1.3],[-28.4,1.03,-1.0],[-30,1.03,-0.8]],
    'li05|li04':[[ -30,1.03,-0.8],[-32.0,1.03,-0.1],[-34.2,1.03,0.7],[-36.6,1.03,1.5],[-38.5,1.03,2.4]]
  };
  for(const [start,end] of config.lines){
    const a=pointNodes.get(start),b=pointNodes.get(end);
    if(!a||!b)continue;
    const key=start+'|'+end;
    const path=customPipePaths[key]?customPipePaths[key].map(point=>[separateCasetaX(point[0]),point[1],point[2]]):[[a[3],1.03,a[4]],[b[3],1.03,b[4]]];
    const meta={nodes:path,source:a[1],target:b[1]};
    pipeDefs.push(meta);
  }
  /* MV PRO: la tubería principal se corta dentro de las casetas para que se vean todos los equipos */
  const mvInsideCaseta=(x,z)=>config.nodes.some(n=>n[2]==='pump'&&Math.abs(x-n[3])<10.8*.5-.05&&Math.abs(z-n[4])<8.15*.5-.05);
  for(const def of pipeDefs){
    const pts=def.nodes,parts=[];let cur=[];
    for(let i=0;i<pts.length;i++){
      if(i>0){const a=pts[i-1],b=pts[i],L=Math.hypot(b[0]-a[0],b[2]-a[2]),n=Math.max(1,Math.ceil(L/.15));
        for(let k=1;k<=n;k++){const q=[a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n,a[2]+(b[2]-a[2])*k/n];
          if(mvInsideCaseta(q[0],q[2])){if(cur.length>1)parts.push(cur);cur=[];}else{if(!cur.length||k===n||k%6===0)cur.push(q);}}}
      else if(!mvInsideCaseta(pts[0][0],pts[0][2]))cur.push(pts[0]);
    }
    if(cur.length>1)parts.push(cur);
    for(const part of parts)pipe(part,.28,def);
  }
  const mountainPipePath = [
    [-98, terrainHeight(-98, 8) + 1.38, 8],
    [-90, terrainHeight(-90, 8) + 1.22, 8],
    [-80, terrainHeight(-80, 8) + .98, 8],
    [-70, terrainHeight(-70, 8) + .84, 8],
    [-60, terrainHeight(-60, 7) + .60, 7],
    [-52, Math.max(terrainHeight(-52, 5.8) + .38, 1.18), 5.8],
    [-48.8, 1.08, 3.7],
    [pointNodes.get('li04')[3], 1.03, 2.4]
  ];
  pipe(mountainPipePath, .31, { source: 'PB4 Linares', target: 'PB4 Linares' });
  function pumpStationScene(x,z){pumpUnit(x,z,4);}
  function facilityScene(x,z,type){
    pad(x,z,5.4);
    box(x,1.37,z,5.1,2.3,3.3,'#bac6cc');
    box(x,2.60,z,5.5,.24,3.65,'#647f91');
    box(x,1.4,z+1.69,1.15,1.7,.12,'#3a5264');
    for(const dx of [-1.62,-.43,.76])box(x+dx,1.98,z+1.71,.65,.4,.05,'#7aa5bc');
    if(type==='potabilizadora'){
      cylinder(x+3.75,.83,z,1.25,1.20,'#92aab7',{seg:30,g:1,alpha:.45,kind:8,caps:false});
      ring(x+3.75,1.46,z,1.3,'#dfecf0',.08,{seg:7});
      tube([[x+3.75,.73,z],[x+5.4,.73,z]],.24,'#1475c4',{seg:16,kind:1});
    }
  }
  function reservoirScene(x,z){
    const waterY=.49;
    const up=[0,1,0];
    const lakeN=lakeShore.length;
    const shoreRand=(n)=>{const q=Math.sin(n*127.1+43.17)*43758.5453;return q-Math.floor(q);};
    const shoreNormals=lakeShore.map((p,i)=>{
      const before=lakeShore[(i+lakeN-2)%lakeN],after=lakeShore[(i+2)%lakeN];
      const dx=after[0]-before[0],dz=after[1]-before[1],length=Math.hypot(dx,dz)||1;
      const outward=[-dz/length,dx/length];
      return lakeDistance(p[0]+outward[0]*1.65,p[1]+outward[1]*1.65)>=lakeDistance(p[0]-outward[0]*1.65,p[1]-outward[1]*1.65)?outward:[-outward[0],-outward[1]];
    });
    const waterRings=17;
    const waterColor=rgb('#18679a');
    const ringVertex=(ring,index)=>{
      const t=ring/waterRings;
      const shore=lakeShore[index%lakeN],normal=shoreNormals[index%lakeN];
      const r=Math.pow(t,.92);
      const x=lakeCenter[0]+(shore[0]-lakeCenter[0])*r+normal[0]*.605*Math.pow(t,11);
      const z=lakeCenter[1]+(shore[1]-lakeCenter[1])*r+normal[1]*.605*Math.pow(t,11);
      const displacement=.96*Math.min(1,(1-t)*7.0);
      return vertex([x,waterY,z],up,waterColor,displacement,0,12,1);
    };
    for(let ring=0;ring<waterRings;ring++){
      for(let i=0;i<lakeN;i++){
        const next=(i+1)%lakeN;
        const a=ringVertex(ring,i),b=ringVertex(ring,next);
        const c=ringVertex(ring+1,next),d=ringVertex(ring+1,i);
        A[0].push(...a,...b,...c,...a,...c,...d);
      }
    }
    for(let i=0;i<lakeN;i++){
      if(i%7!==1&&i%11!==3)continue;
      const a=lakeShore[i],b=lakeShore[(i+1)%lakeN],normal=shoreNormals[i],other=shoreNormals[(i+1)%lakeN];
      const wa=[a[0]+normal[0]*.12,a[1]+normal[1]*.12],wb=[b[0]+other[0]*.12,b[1]+other[1]*.12];
      const start=[wa[0]-normal[0]*.20,wa[1]-normal[1]*.20],end=[wb[0]-other[0]*.20,wb[1]-other[1]*.20];
      quad(2,[start[0],waterY+.009,start[1]],[end[0],waterY+.009,end[1]],[wb[0],waterY+.009,wb[1]],[wa[0],waterY+.009,wa[1]],up,'#86afaa',.01,16,.085+.035*shoreRand(i+16));
    }
    const shoreDecorSeed=82391;
    let decorSeed=shoreDecorSeed;
    const decorRand=()=>{decorSeed=(Math.imul(decorSeed,1664525)+1013904223)>>>0;return decorSeed/4294967296;};
    for(let k=0;k<105;k++){
      const idx=Math.floor(decorRand()*lakeN);
      const p=lakeShore[idx];
      if(p[0]<31||p[0]>116)continue;
      const normal=[p[0]-lakeCenter[0],p[1]-lakeCenter[1]];
      const normLen=Math.hypot(normal[0],normal[1])||1;
      const offset=3.35+decorRand()*4.1;
      const x=p[0]+normal[0]/normLen*offset,z=p[1]+normal[1]/normLen*offset;
      if(lakeDistance(x,z)<.4)continue;
      const ground=terrainHeight(x,z),size=.10+decorRand()*.33;
      if(decorRand()<.58){
        const colors=['#858777','#8b8e79','#71776b','#a4a18a'];
        cylinder(x,ground+size*.16,z,size*(.80+decorRand()*.3),size*.32,colors[Math.floor(decorRand()*colors.length)],{seg:6});
      }else{
        const bushColor=['#436d36','#4a6b38','#55783e','#315a31'][Math.floor(decorRand()*4)];
        for(let i=0;i<3;i++){
          const ang=i*2.094+decorRand()*.6;
          const xx=x+Math.cos(ang)*size*.62,zz=z+Math.sin(ang)*size*.62;
          cylinder(xx,ground+size*.26,zz,size*.65,size*.49,bushColor,{seg:6});
        }
      }
    }
    const shoreBands=[3.16,3.7,5.4,7.4];
    const shoreRings=shoreBands.map((distance,layer)=>lakeShore.map((p,i)=>{
      const a=i/lakeN*Math.PI*2;
      const variation=Math.sin(a*7+.8)*.21+Math.sin(a*13+2.1)*.115+Math.sin(a*23-1.5)*.047;
      const offset=Math.max(0,distance+(layer?variation*Math.min(1,distance*.63):0));
      const normal=shoreNormals[i],xx=p[0]+normal[0]*offset,zz=p[1]+normal[1]*offset;
      const ground=terrainHeight(xx,zz);
      const sediment=terrainNoise(xx*.33+4.3,zz*.27-8.1),flecks=terrainNoise(xx*.97-5.2,zz*.82+6.7);
      const yy=ground+(layer===0?.045:layer===1?.038:layer===2?.026:.014);
      const damp=[.30,.20,.10,0][layer]*(.83+.24*sediment);
      const shade=terrainColor(xx,zz,ground);
      const earth=[.235+.105*sediment+.045*flecks,.25+.092*sediment,.19+.078*flecks+.022*sediment];
      const color=shade.map((v,k)=>v*(1-damp)+earth[k]*damp);
      const n=terrainNormal(xx,zz);
      return {p:[xx,yy,zz],n:norm([n[0]*.28,.72+n[1]*.28,n[2]*.28]),c:color,blend:damp*.78};
    }));
    for(let layer=0;layer<shoreRings.length-1;layer++){
      for(let i=0;i<lakeN;i++){
        const next=(i+1)%lakeN;
        const a=shoreRings[layer][i],b=shoreRings[layer][next];
        const c=shoreRings[layer+1][next],d=shoreRings[layer+1][i];
        const drawVertex=q=>vertex(q.p,q.n,q.c,q.blend,0,11,1);
        A[0].push(...drawVertex(a),...drawVertex(b),...drawVertex(c),...drawVertex(a),...drawVertex(c),...drawVertex(d));
      }
    }
    const wallBase=.30,wallTop=1.24,roadTop=1.31;
    const wallInner=lakeShore.map((p,i)=>[
      p[0]+shoreNormals[i][0]*.62,
      p[1]+shoreNormals[i][1]*.62
    ]);
    const wallOuter=lakeShore.map((p,i)=>[
      p[0]+shoreNormals[i][0]*1.29,
      p[1]+shoreNormals[i][1]*1.29
    ]);
    const roadOuter=lakeShore.map((p,i)=>[
      p[0]+shoreNormals[i][0]*2.52,
      p[1]+shoreNormals[i][1]*2.52
    ]);
    const roadFill=lakeShore.map((p,i)=>[
      p[0]+shoreNormals[i][0]*3.14,
      p[1]+shoreNormals[i][1]*3.14
    ]);
    for(let i=0;i<lakeN;i++){
      const next=(i+1)%lakeN;
      const a=wallInner[i],b=wallInner[next],c=wallOuter[next],d=wallOuter[i];
      const g=roadOuter[next],h=roadOuter[i],m=roadFill[i],n=roadFill[next];
      const normal=shoreNormals[i];
      const concrete=i%19<10?'#adb5b2':'#a6afac';
      const asphalt=i%23<11?'#555d5f':'#4f5658';
      const fill1=Math.max(terrainHeight(m[0],m[1])+.06,.16);
      const fill2=Math.max(terrainHeight(n[0],n[1])+.06,.16);
      quad(0,[a[0],wallBase,a[1]],[b[0],wallBase,b[1]],
        [b[0],wallTop,b[1]],[a[0],wallTop,a[1]],[-normal[0],0,-normal[1]],concrete,.02);
      quad(0,[c[0],wallBase,c[1]],[d[0],wallBase,d[1]],
        [d[0],wallTop,d[1]],[c[0],wallTop,c[1]],[normal[0],0,normal[1]],'#818c8a',.02);
      quad(0,[a[0],wallTop,a[1]],[b[0],wallTop,b[1]],
        [c[0],wallTop,c[1]],[d[0],wallTop,d[1]],[0,1,0],'#d9ddd7',.05);
      quad(0,[d[0],roadTop,d[1]],[c[0],roadTop,c[1]],[g[0],roadTop,g[1]],[h[0],roadTop,h[1]],[0,1,0],asphalt,.04);
      quad(0,[h[0],roadTop,h[1]],[g[0],roadTop,g[1]],[n[0],fill2,n[1]],[m[0],fill1,m[1]],[normal[0],.16,normal[1]],'#7e8785',.03);
      quad(0,[m[0],fill1,m[1]],[n[0],fill2,n[1]],[g[0],fill2-.08,g[1]],[h[0],fill1-.08,h[1]],[0,-1,0],'#7b8482',.02);
      tube([[d[0],roadTop+.03,d[1]],[c[0],roadTop+.03,c[1]]],.028,'#ecefe8',{seg:6});
      tube([[h[0],roadTop+.03,h[1]],[g[0],roadTop+.03,g[1]]],.022,'#d2d5cf',{seg:6});
      if(i%17===0){
        tube([[a[0],.48,a[1]],[a[0],wallTop,a[1]]],.016,'#707b79',{seg:5});
        tube([[d[0],.48,d[1]],[d[0],roadTop,d[1]]],.016,'#687573',{seg:5});
      }
    }
    const damPoints=[[37.0,-3.5],[35.9,1.3],[35.0,6.9],[34.7,13.1],[35.2,19.6],[36.2,25.4],[38.7,31.7]];
    const ribbon=(path,width,top,bottom,color)=>{
      for(let i=0;i<path.length-1;i++){
        const a=path[i],b=path[i+1],dx=b[0]-a[0],dz=b[1]-a[1];
        const len=Math.hypot(dx,dz)||1,px=-dz/len*width*.5,pz=dx/len*width*.5;
        const A=[a[0]+px,top,a[1]+pz],B=[a[0]-px,top,a[1]-pz];
        const C=[b[0]-px,top,b[1]-pz],D=[b[0]+px,top,b[1]+pz];
        quad(0,A,B,C,D,[0,1,0],color,.04);
        quad(0,[a[0]+px,bottom,a[1]+pz],[b[0]+px,bottom,b[1]+pz],D,A,[px/width,0,pz/width],'#969b95',.03);
        quad(0,[b[0]-px,bottom,b[1]-pz],[a[0]-px,bottom,a[1]-pz],B,C,[-px/width,0,-pz/width],'#b6b6ae',.03);
      }
    };
    ribbon(damPoints,3.45,1.72,-.24,'#c6c6bd');
    ribbon(damPoints,2.37,1.78,1.70,'#555b5c');
    for(let i=0;i<damPoints.length-1;i++){
      const a=damPoints[i],b=damPoints[i+1],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1;
      const p=[-dz/len,dx/len];
      for(const side of [-1,1]){
        const q1=[a[0]+side*p[0]*1.45,2.02,a[1]+side*p[1]*1.45];
        const q2=[b[0]+side*p[0]*1.45,2.02,b[1]+side*p[1]*1.45];
        tube([q1,q2],.049,'#e5e7df',{seg:7});
        for(let k=0;k<4;k++){
          const t=k/4,rx=a[0]+dx*t+side*p[0]*1.45,rz=a[1]+dz*t+side*p[1]*1.45;
          bar([rx,1.78,rz],[rx,2.10,rz],.047,'#b9c3c2',{seg:7});
        }
      }
    }
    for(let i=0;i<6;i++){
      const t=(i+.5)/6*5;
      const a=damPoints[Math.floor(t)],b=damPoints[Math.floor(t)+1],k=t%1;
      const px=a[0]+(b[0]-a[0])*k,pz=a[1]+(b[1]-a[1])*k;
      box(px-.95,.88,pz,.21,1.31,2.0,'#7c8a90');
      box(px-1.08,.82,pz,.09,.75,1.42,'#3d6880');
      box(px-1.15,1.36,pz,.28,.13,1.73,'#d6d7cd');
    }
    const connectWallToDam=(wallIndex,damPointIndex,nextPointIndex)=>{
      const wi=wallInner[wallIndex],wo=wallOuter[wallIndex];
      const a=damPoints[damPointIndex],b=damPoints[nextPointIndex];
      const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1;
      const px=-dz/len,pz=dx/len;
      const damWater=[damPoints[damPointIndex][0]-px*1.725,damPoints[damPointIndex][1]-pz*1.725];
      const damLand=[damPoints[damPointIndex][0]+px*1.725,damPoints[damPointIndex][1]+pz*1.725];
      quad(0,[wi[0],wallTop,wi[1]],[wo[0],wallTop,wo[1]],[damLand[0],wallTop,damLand[1]],[damWater[0],wallTop,damWater[1]],[0,1,0],'#d9ddd7',.05);
      quad(0,[wi[0],wallBase,wi[1]],[damWater[0],wallBase,damWater[1]],[damWater[0],wallTop,damWater[1]],[wi[0],wallTop,wi[1]],[0,0,1],'#aab2af',.03);
      quad(0,[damLand[0],wallBase,damLand[1]],[wo[0],wallBase,wo[1]],[wo[0],wallTop,wo[1]],[damLand[0],wallTop,damLand[1]],[0,0,1],'#7f8a88',.03);
      quad(0,[wo[0],wallBase,wo[1]],[wi[0],wallBase,wi[1]],[damWater[0],wallBase,damWater[1]],[damLand[0],wallBase,damLand[1]],[0,-1,0],'#959d99',.02);
      tube([[wi[0],wallTop+.03,wi[1]],[damWater[0],wallTop+.03,damWater[1]]],.018,'#d8dbd5',{seg:6});
      tube([[wo[0],wallTop+.03,wo[1]],[damLand[0],wallTop+.03,damLand[1]]],.018,'#c5cac5',{seg:6});
    };
    connectWallToDam(161,0,1);
    connectWallToDam(16,6,5);
    box(34.5,2.34,10.7,2.15,1.11,2.1,'#c4c6bd');
    box(34.5,2.95,10.7,2.4,.20,2.35,'#727c79');
    box(33.24,2.42,10.7,.07,.52,1.08,'#4b6679');
    bar([32.45,3.10,8.3],[32.45,3.10,16.5],.07,'#dfb83e',{seg:8});
    bar([32.45,3.10,8.3],[32.45,4.1,8.3],.065,'#d6ad35',{seg:8});
    bar([32.45,3.10,16.5],[32.45,4.1,16.5],.065,'#d6ad35',{seg:8});
    bar([32.45,4.1,8.3],[32.45,4.1,16.5],.078,'#e7ba3d',{seg:9});
    for(let i=0;i<3;i++){
      const gx=32.0+i*.2;
      box(gx,1.63,6.3+i*8.2,1.4,.20,2.2,'#aeb5b5');
    }
    ribbon([[32.8,13.0],[30.0,12.8],[27.6,12.5]],2.25,1.60,.04,'#8e9999');
    tube([[32.9,1.08,14.0],[30.8,1.07,13.5],[27.4,1.04,13.0]],.32,'#167ab3',{seg:18,kind:1});
  }
  function flowMeterScene(x,z){
    pad(x,z,2.9);
    cylinder(x,.91,z,.68,1.26,'#7d9baa',{seg:24});
    ring(x,1.52,z,.70,'#b8d1dc',.07,{seg:7});
    box(x,1.28,z+.62,.76,.56,.16,'#c6d6de');
    tube([[x-2.2,.98,z],[x+2.2,.98,z]],.21,'#1682c9',{seg:16,kind:1});
    tube([[x-2.2,.98,z],[x+2.2,.98,z]],.32,'#b3d5e3',{seg:14,g:1,kind:4,alpha:.22});
  }
  const casetaIds=['li01','li02','li02a','li03','li04'];
  const casetaCounts=[4,5,5,5,5];
  const casetaStarts=[0,4,9,14,19];
  const casetaDataCodes=['LINPB001','LINPB002','LINPB02A','LINPB003','LINPB004'];
  const casetaLightState=new Float32Array(5).fill(1);
  const casetaLightById=new Map(casetaIds.map((id,i)=>[id,i]));
  function casetaGlazedQuad(a,b,c,d,color,alpha=.31){
    quad(1,a,b,c,d,[0,0,1],color,.04,8,alpha);
  }
  function casetaLightQuad(a,b,c,d,index,alpha=.37){
    const n=[0,-1,0];
    tri(1,a,n,b,n,c,n,'#ffd997',.18,index,16,alpha);
    tri(1,a,n,c,n,d,n,'#ffd997',.18,index,16,alpha);
  }
  function casetaLitQuad(a,b,c,d,n,color,index,strength=.30){
    tri(0,a,n,b,n,c,n,color,strength,index,18,1);
    tri(0,a,n,c,n,d,n,color,strength,index,18,1);
  }
  function casetaGlowDisk(cx,cy,cz,rx,rz,index,opacity=.30){
    const layers=[0,.33,.67,1],segments=20;
    for(let j=0;j<layers.length-1;j++){
      const r0=layers[j],r1=layers[j+1];
      const alpha0=opacity*(1-r0*r0)*.76,alpha1=opacity*(1-r1*r1)*.76;
      for(let i=0;i<segments;i++){
        const a=i*Math.PI*2/segments,b=(i+1)*Math.PI*2/segments;
        const q0=[cx+Math.cos(a)*rx*r0,cy,cz+Math.sin(a)*rz*r0];
        const q1=[cx+Math.cos(b)*rx*r0,cy,cz+Math.sin(b)*rz*r0];
        const q2=[cx+Math.cos(b)*rx*r1,cy,cz+Math.sin(b)*rz*r1];
        const q3=[cx+Math.cos(a)*rx*r1,cy,cz+Math.sin(a)*rz*r1];
        const n=[0,1,0],out=A[1];
        out.push(...vertex(q0,n,'#ffd992',.9,index,17,alpha0),...vertex(q1,n,'#ffd992',.9,index,17,alpha0),...vertex(q2,n,'#ffd992',.25,index,17,alpha1));
        out.push(...vertex(q0,n,'#ffd992',.9,index,17,alpha0),...vertex(q2,n,'#ffd992',.25,index,17,alpha1),...vertex(q3,n,'#ffd992',.25,index,17,alpha1));
      }
    }
  }
  function linaresMotor3D(x,z,equipmentId){
    box(x,.46,z,1.20,.17,1.25,'#263e4d');
    box(x,.56,z,1.08,.09,1.12,'#718d99');
    box(x,.63,z,.90,.08,.96,'#203646');
    for(const xx of [-.40,.40])for(const zz of [-.42,.42]){
      cylinder(x+xx,.65,z+zz,.058,.065,'#cbd7d9',{seg:8});
    }
    cylinder(x,.91,z,.46,.51,'#344b5b',{seg:22});
    cylinder(x,1.18,z,.49,.11,'#a4b9c3',{seg:22});
    cylinder(x,1.47,z,.45,.47,'#6c889a',{seg:26});
    cylinder(x,1.29,z,.47,.08,'#1e3442',{seg:22});
    for(let j=0;j<12;j++){
      const a=j*Math.PI/6;
      box(x+Math.cos(a)*.45,1.49,z+Math.sin(a)*.45,.065,.35,.07,'#415c69');
    }
    cylinder(x,1.78,z,.50,.14,'#afc3cb',{seg:26});
    cylinder(x,1.89,z,.52,.12,'#263b49',{seg:26});
    cylinder(x,2.48,z,.455,1.11,'#36d84d',{seg:26,kind:19,levelId:equipmentId,em:.44});
    cylinder(x,2.49,z,.472,1.12,'#60ec68',{seg:26,g:1,alpha:.18,kind:19,levelId:equipmentId,em:.28});
    for(let j=0;j<10;j++){
      const a=j*Math.PI/5;
      const px=x+.492*Math.cos(a),pz=z+.492*Math.sin(a);
      bar([px,1.99,pz],[px,2.97,pz],.028,'#a6b8bc',{seg:7});
    }
    ring(x,1.99,z,.49,'#bdced0',.052,{seg:14});
    ring(x,2.96,z,.49,'#bdced0',.052,{seg:14});
    cylinder(x,3.05,z,.51,.15,'#304957',{seg:26});
    cylinder(x,3.27,z,.52,.32,'#bdd1d8',{seg:26});
    cylinder(x,3.47,z,.49,.10,'#2b4555',{seg:26});
    cylinder(x,3.63,z,.43,.24,'#b4c8d0',{seg:24});
    cylinder(x,3.79,z,.34,.075,'#e1ebeb',{seg:22});
    cylinder(x,3.83,z,.24,.055,'#4e6878',{seg:18});
    ring(x,3.89,z,.275,'#9eafb8',.045,{seg:12});
    box(x+.43,1.61,z+.25,.24,.47,.36,'#304754');
    box(x+.56,1.62,z+.25,.035,.29,.20,'#b2c5cb');
    box(x+.59,1.72,z+.25,.04,.075,.13,'#3bb954',0,.26);
    for(const side of [-1,1]){
      tube([[x+side*.47,3.29,z],[x+side*.72,3.29,z],[x+side*.82,3.19,z],[x+side*.82,3.02,z]],.085,'#b6cbd0',{seg:9});
    }
    tube([[x,1.12,z+.48],[x,1.12,z+.93],[x,1.32,z+1.11]],.105,'#238cc2',{seg:9});
    box(x,1.23,z+1.08,.58,.15,.33,'#879da6');
    bar([x,1.42,z+1.06],[x,1.55,z+1.06],.055,'#b5c9d1',{seg:8});
  }
  function pumpCaseta(x,z,name,index){
    const w=10.8,d=8.15,h=5.35;
    const left=x-w*.5,right=x+w*.5,back=z-d*.5,front=z+d*.5;
    box(x,.095,z,w+.60,.18,d+.56,'#586970');
    box(x,.21,z,w+.35,.12,d+.33,'#b8c3c1');
    box(x,.29,z,w-.20,.075,d-.18,'#62747a');
    box(x,.346,z,w-.56,.033,d-.56,'#879797');
    for(const side of [-1,1]){
      const px=x+side*(w*.5-.16);
      box(px,1.02,z,.35,1.86,d-.22,'#aebcbd');
      box(px,3.77,back+.84,.34,2.95,1.62,'#a9b9bc');
      box(px,3.77,front-.84,.34,2.95,1.57,'#a9b9bc');
      box(px,5.02,z,.40,.62,d+.16,'#a5b4b6');
      for(const zz of [back+1.15,back+2.85,front-2.85,front-1.15]){
        box(px+side*.075,3.20,zz,.055,1.75,1.26,'#688494',1,.09,.33);
        box(px+side*.085,3.20,zz,.070,.083,1.31,'#d8e6e5');
        box(px+side*.085,3.20,zz,.070,1.78,.07,'#d8e6e5');
      }
    }
    box(x,1.30,back+.17,w-.40,2.18,.32,'#b0bfc0');
    box(x,3.77,back+.16,w-.40,2.76,.32,'#a2b4b7');
    box(x,5.23,back+.17,w+.06,.20,.41,'#d7dfde');
    for(let k=0;k<7;k++){
      const xx=left+.65+k*(w-1.3)/6;
      box(xx,3.52,back+.365,.07,2.20,.06,'#83959b');
    }
    for(const side of [-1,1]){
      const px=x+side*(w*.5-.19);
      box(px,3.13,front-.20,.48,4.20,.46,'#c4d1d1');
      box(px+side*.03,3.14,front+.12,.10,3.28,.10,'#627782');
    }
    for(const xx of [left+3.0,right-3.0]){
      box(xx,4.89,front-.15,.19,.75,.48,'#d2dddc');
      box(xx,4.90,front+.14,.06,.69,.09,'#556d78');
    }
    box(x,5.05,front-.18,w+.24,.45,.55,'#a8b9bc');
    box(x,5.36,front-.18,w+.50,.17,.64,'#e2e8e4');
    box(x,5.39,back+.10,w+.50,.17,.55,'#acbbbd');
    for(const zz of [back+.70,back+2.30,z,z+2.30,front-.65]){
      box(x,5.38,zz,w+.21,.09,.11,'#b6c6c8');
      box(x,5.46,zz,w+.20,.028,.048,'#dce5e1');
    }
    for(const xx of [left+.40,right-.40]){
      box(xx,5.36,z,.22,.20,d+.52,'#5c747d');
    }
    casetaGlazedQuad([left+.43,5.37,back+.42],[right-.43,5.37,back+.42],[right-.43,5.37,front-.46],[left+.43,5.37,front-.46],'#bad4d5',.075);
    const count=casetaCounts[index],start=casetaStarts[index];
    const centerOffset=(count-1)*.5;
    for(let i=0;i<count;i++){
      const px=x+(i-centerOffset)*1.75;
      const pz=z+.30;
      const dataId=8+start+i;
      linaresMotor3D(px,pz,dataId);
      box(px,.375,z-1.58,1.28,.012,.075,'#dce3e0');
      box(px,1.01,front+.38,1.23,.20,.63,'#61747b');
      box(px,1.15,front+.38,1.03,.07,.48,'#c2d1d0');
      cylinder(px,1.34,front+.35,.15,.18,'#34c34b',{seg:13,kind:19,levelId:dataId,em:.34});
      cylinder(px,1.53,front+.35,.11,.06,'#cededd',{seg:12});
      /* MV PRO: sin tubo de descarga visible; sólo el equipo */
    }
    tube([[left+.50,1.35,z+1.48],[right-.50,1.35,z+1.48]],.18,'#1486b9',{seg:14});
    tube([[left+.50,1.01,z-1.35],[right-.50,1.01,z-1.35]],.13,'#4194b2',{seg:12});
    box(left+.63,1.74,back+.70,.66,2.44,1.09,'#435d67');
    box(left+.65,1.98,back+1.29,.48,1.24,.075,'#90b0b9',1,.13,.80);
    for(const yy of [1.59,1.87,2.12])for(const dx of [-.14,.12]){
      box(left+.65+dx,yy,back+1.35,.075,.065,.036,yy===1.87?'#e2bb61':'#95aeb5');
    }
    box(right-.59,3.60,back+.48,.58,.93,.13,'#536a75');
    for(const off of [-.18,-.08,.03,.14])box(right-.59+off,3.60,back+.56,.042,.67,.025,'#c5d6d5');
    box(x,5.17,front+.36,3.28,.45,.13,'#e5ebe8');
    for(const xx of [x-2.65,x,x+2.65]){
      box(xx,5.17,front-.19,.80,.15,.24,'#697f87');
      cylinder(xx,5.01,front+.01,.21,.13,'#f5e2b4',{seg:16,kind:16,levelId:index,em:1.1});
      casetaGlowDisk(xx,.395,front-.50,1.26,1.65,index,.25);
    }
    for(const xx of [x-2.73,x+2.73]){
      cylinder(xx,5.22,z,.32,.17,'#798e94',{seg:15});
      cylinder(xx,5.07,z,.34,.13,'#fae8c2',{seg:18,kind:16,levelId:index,em:1.1});
      cylinder(xx,4.96,z,.12,.035,'#f8eacb',{seg:15,kind:16,levelId:index,em:1.1});
      casetaGlowDisk(xx,.39,z,.99,2.0,index,.25);
    }
    casetaLitQuad([left+.40,.37,back+.43],[right-.40,.37,back+.43],[right-.40,.37,front-.39],[left+.40,.37,front-.39],[0,1,0],'#889494',index,.33);
    casetaLightQuad([left+.42,5.27,back+.60],[right-.42,5.27,back+.60],[right-.42,5.27,front-.60],[left+.42,5.27,front-.60],index,.08);
    for(const xx of [left+2.12,right-2.12]){
      box(xx,4.62,front+.25,.69,.24,.39,'#667c84');
      cylinder(xx,4.42,front+.38,.24,.14,'#f3e5c6',{seg:14,kind:16,levelId:index,em:1.1});
      casetaGlowDisk(xx,.36,front+.62,.95,.95,index,.20);
    }
    bar([left,1.31,z-.80],[left-1.30,1.31,z-.80],.26,'#1d6fb8',{seg:16});
    orientedCylinder([left-.05,1.31,z-.80],[left-.22,1.31,z-.80],.38,'#7d8c94',{seg:18});
    orientedCylinder([left-1.00,1.31,z-.80],[left-1.10,1.31,z-.80],.36,'#6f7f88',{seg:18});
    bar([right,1.29,z+.78],[right+1.30,1.29,z+.78],.26,'#1d6fb8',{seg:16});
    orientedCylinder([right+.05,1.29,z+.78],[right+.22,1.29,z+.78],.38,'#7d8c94',{seg:18});
    orientedCylinder([right+1.00,1.29,z+.78],[right+1.10,1.29,z+.78],.36,'#6f7f88',{seg:18});
    box(x,.39,front+.60,3.38,.14,1.30,'#a7b3b2');
    box(x,.46,front+.66,3.14,.10,1.20,'#d1d8d5');
  }
  config.nodes.forEach(n=>{
    const [,name,type,x,z]=n;
    if(type==='tank')tankLabels.push(tank(x,z,name,0,1.40));
    else if(type==='reservoir')reservoirScene(x,z);
    else if(type==='pump')pumpCaseta(x,z,name,casetaLightById.get(n[0]));
    else if(type==='meter')flowMeterScene(x,z);
    else facilityScene(x,z,name.toLowerCase().includes('potabilizadora')?'potabilizadora':'facility');
  });
  /* ===== MV PRO: entorno del acueducto (camino de servicio, línea eléctrica, soportes, señalización, cercas, vegetación) ===== */
  (function mvLinaresEnvironment() {
    let seed = 90817;
    const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const ground = (x, z) => Math.max(-.048, terrainHeight(x, z));
    const UP = [0, 1, 0];
    // ruta del acueducto (de la presa a PB4)
    const route = [];
    for (const def of pipeDefs) for (const p of def.nodes) { const last = route[route.length - 1]; if (!last || Math.hypot(last[0] - p[0], last[2] - p[2]) > .05) route.push([p[0], 0, p[2]]); }
    const resample = (pts, step) => {
      const out = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(1, Math.round(L / step));
        for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, 0, a[2] + (b[2] - a[2]) * k / n]);
      }
      return out;
    };
    const distToPoly = (x, z, pts) => {
      let best = 1e9;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dz = b[2] - a[2], len = dx * dx + dz * dz || 1;
        const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[2]) * dz) / len));
        best = Math.min(best, Math.hypot(x - a[0] - t * dx, z - a[2] - t * dz));
      }
      return best;
    };
    const casetas = config.nodes.filter(n => n[2] === 'pump' || n[2] === 'tank' || n[2] === 'facility');
    // camino de servicio paralelo (lado frontal), de PB1 a PB4
    const startIndex = route.findIndex(p => Math.hypot(p[0] - casetas[0][3], p[2] - casetas[0][4]) < .2);
    const base = resample(route.slice(Math.max(0, startIndex)), 1.0);
    const smooth = base.map((p, i) => { const a = base[Math.max(0, i - 3)], b = base[Math.min(base.length - 1, i + 3)]; return [(a[0] + p[0] * 2 + b[0]) / 4, 0, (a[2] + p[2] * 2 + b[2]) / 4]; });
    const OFFSET = 8.2;
    const road = smooth.map((p, i) => {
      const a = smooth[Math.max(0, i - 1)], b = smooth[Math.min(smooth.length - 1, i + 1)];
      let tx = b[0] - a[0], tz = b[2] - a[2]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      let nx = -tz, nz = tx; if (nz < 0) { nx = -nx; nz = -nz; }
      return { x: p[0] + nx * OFFSET, z: p[2] + nz * OFFSET, nx, nz, tx, tz };
    });
    const strip = (pts, off0, off1, y, col) => {
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const ya = ground(a.x, a.z) + y, yb = ground(b.x, b.z) + y;
        quad(0, [a.x + a.nx * off0, ya, a.z + a.nz * off0], [b.x + b.nx * off0, yb, b.z + b.nz * off0], [b.x + b.nx * off1, yb, b.z + b.nz * off1], [a.x + a.nx * off1, ya, a.z + a.nz * off1], UP, col);
      }
    };
    // cercas de cada caseta
    for (const n of casetas) {
      const x = n[3], z = n[4];
      // cerca perimetral con portón
      if (n[2] === 'pump') {
        const hw = 6.9, hd = 5.6, posts = [];
        const pts = [[x - hw, z - hd], [x + hw, z - hd], [x + hw, z + hd], [x - hw, z + hd], [x - hw, z - hd]];
        for (let s = 0; s < 4; s++) {
          const p0 = pts[s], p1 = pts[s + 1], L2 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), steps = Math.round(L2 / 1.6);
          for (let k = 0; k <= steps; k++) {
            const fx = p0[0] + (p1[0] - p0[0]) * k / steps, fz = p0[1] + (p1[1] - p0[1]) * k / steps;
            const gate = s === 2 && Math.abs(fx - x) < 2.0;
            if (!gate) cylinder(fx, ground(fx, fz) + .62, fz, .045, 1.24, '#9aa5aa', { seg: 6 });
            if (k > 0) {
              const gx = p0[0] + (p1[0] - p0[0]) * (k - 1) / steps, gz = p0[1] + (p1[1] - p0[1]) * (k - 1) / steps;
              const gateSeg = s === 2 && (Math.abs(fx - x) < 2.0 || Math.abs(gx - x) < 2.0);
              if (!gateSeg) for (const hy of [.42, .82, 1.18]) bar([gx, ground(gx, gz) + hy, gz], [fx, ground(fx, fz) + hy, fz], .012, '#b9c3c7', { seg: 4 });
            }
          }
        }
        for (const sx of [-1, 1]) cylinder(x + sx * 2.0, ground(x, z + hd) + .8, z + hd, .09, 1.6, '#7e898e', { seg: 8 });
      }
    }
    // línea eléctrica (postes de madera con cruceta, aisladores y cables con catenaria)
    const poleOff = 3.7, poles = [];
    let acc = 99;
    for (let i = 1; i < road.length; i++) {
      acc += Math.hypot(road[i].x - road[i - 1].x, road[i].z - road[i - 1].z);
      if (acc >= 10.5) { acc = 0; const r = road[i]; poles.push({ x: r.x + r.nx * poleOff, z: r.z + r.nz * poleOff, nx: r.nx, nz: r.nz }); }
    }
    for (const p of poles) {
      const g = ground(p.x, p.z);
      cylinder(p.x, g + 3.4, p.z, .11, 6.8, '#6e5640', { seg: 8 });
      bar([p.x - p.nx * .95, g + 6.45, p.z - p.nz * .95], [p.x + p.nx * .95, g + 6.45, p.z + p.nz * .95], .055, '#5b4634', { seg: 6 });
      for (const o of [-.8, 0, .8]) cylinder(p.x + p.nx * o, g + 6.6, p.z + p.nz * o, .05, .2, '#cfd8dc', { seg: 8 });
      p.g = g;
    }
    for (let i = 1; i < poles.length; i++) {
      const a = poles[i - 1], b = poles[i];
      for (const o of [-.8, 0, .8]) {
        const pts = [];
        for (let k = 0; k <= 8; k++) {
          const t = k / 8, sag = Math.sin(Math.PI * t) * .55;
          pts.push([a.x + a.nx * o + (b.x + b.nx * o - a.x - a.nx * o) * t, a.g + (b.g - a.g) * t + 6.7 - sag, a.z + a.nz * o + (b.z + b.nz * o - a.z - a.nz * o) * t]);
        }
        tube(pts, .016, '#2b3034', { seg: 4 });
      }
    }


    // lámparas para modo noche (postes con luminaria y halo en el piso)
    const lamp = (x, z, dirx, dirz) => {
      const g = ground(x, z), H = 4.6;
      cylinder(x, g + H / 2, z, .07, H, '#7f8b90', { seg: 8 });
      cylinder(x, g + .15, z, .16, .3, '#6b767b', { seg: 10 });
      const hx = x + dirx * .85, hz = z + dirz * .85;
      bar([x, g + H - .05, z], [hx, g + H - .05, hz], .035, '#7f8b90', { seg: 6 });
      box(hx, g + H - .14, hz, .52, .1, .3, '#4b5559');
      box(hx, g + H - .2, hz, .44, .03, .24, '#ffffff', 0, 0, 1);
      const lampVerts = A[0].length;
      box(hx, g + H - .215, hz, .42, .02, .22, '#ffffff');
      for (let i = lampVerts; i < A[0].length; i += 13) A[0][i + 11] = 20;
      const steps = 24, gy = g + .06, radii = [0, .6, 1.2, 1.9, 2.7, 3.6, 4.6], alphas = [.55, .46, .35, .24, .14, .06, 0];
      for (let r = 0; r < radii.length - 1; r++) {
        const r0 = radii[r], r1 = radii[r + 1], al = (alphas[r] + alphas[r + 1]) * .5;
        for (let k = 0; k < steps; k++) {
          const a0 = k / steps * Math.PI * 2, a1 = (k + 1) / steps * Math.PI * 2;
          const p00 = [hx + Math.cos(a0) * r0, gy, hz + Math.sin(a0) * r0], p01 = [hx + Math.cos(a1) * r0, gy, hz + Math.sin(a1) * r0];
          const p10 = [hx + Math.cos(a0) * r1, gy, hz + Math.sin(a0) * r1], p11 = [hx + Math.cos(a1) * r1, gy, hz + Math.sin(a1) * r1];
          if (r0 > 0) tri(1, p00, UP, p10, UP, p11, UP, '#ffcc80', 0, 0, 21, al);
          tri(1, p00, UP, p11, UP, p01, UP, '#ffcc80', 0, 0, 21, al);
        }
      }
    };
    for (const n of config.nodes.filter(q => q[2] === 'pump')) {
      const x = n[3], z = n[4], hw = 6.6, hd = 5.3;
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) lamp(x + sx * hw, z + sz * hd, -sx * .7071, -sz * .7071);
    }
    {
      const pts = resample(route, 1.0); let accL = 6;
      for (let i = 1; i < pts.length; i++) {
        accL += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]);
        if (accL < 12) continue;
        const p = pts[i];
        if (casetas.some(n => Math.abs(p[0] - n[3]) < 8.5 && Math.abs(p[2] - n[4]) < 7.5) || lakeDistance(p[0], p[2]) < 2) continue;
        accL = 0;
        const a = pts[i - 1]; let nx = -(p[2] - a[2]), nz = p[0] - a[0]; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l; if (nz > 0) { nx = -nx; nz = -nz; }
        lamp(p[0] + nx * 2.2, p[2] + nz * 2.2, -nx, -nz);
      }
    }
    // soportes de concreto bajo la tubería y señalización de ducto
    const nearCaseta = (x, z) => casetas.some(n => Math.abs(x - n[3]) < 6.2 && Math.abs(z - n[4]) < 5.0);
    for (const def of pipeDefs) {
      const pts = resample(def.nodes.map(p => [p[0], 0, p[2]]), 2.6);
      pts.forEach((p, i) => {
        if (nearCaseta(p[0], p[2]) || lakeDistance(p[0], p[2]) < 1.5) return;
        const g = ground(p[0], p[2]), top = 1.03 - .30;
        if (top - g > .05) {
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
          const horiz = Math.abs(b[0] - a[0]) > Math.abs(b[2] - a[2]);
          box(p[0], (g + top) / 2, p[2], horiz ? .42 : .78, top - g, horiz ? .78 : .42, '#b7b2a6');
          box(p[0], top - .02, p[2], horiz ? .5 : .86, .05, horiz ? .86 : .5, '#8e8a80');
        }
        if (i % 4 === 2) {
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
          let nx = -(b[2] - a[2]), nz = b[0] - a[0]; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l; if (nz < 0) { nx = -nx; nz = -nz; }
          const mx = p[0] + nx * 1.35, mz = p[2] + nz * 1.35;
          cylinder(mx, g + .55, mz, .055, 1.1, '#f0c419', { seg: 8 });
          cylinder(mx, g + 1.14, mz, .075, .1, '#d9480f', { seg: 8 });
        }
      });
    }
    // vegetación del llano (mezquites, huizaches y matorral)
    const crownCols = ['#3f5f2a', '#4a6b2f', '#55743a', '#5f7c3c', '#466332', '#6b8341'];
    const shrubCols = ['#5b6f38', '#6d7d42', '#4f6634', '#7a8549'];
    const polePts = poles.map(p => [p.x, 0, p.z]);
    const keepOut = (x, z, margin) => {
      if (Math.hypot(x, z) > 93) return true;
      if (ground(x, z) > 1.2) return true;
      if (lakeDistance(x, z) < 3.5) return true;
      if (distToPoly(x, z, route) < 6.5 + margin) return true;
      if (distToPoly(x, z, polePts) < 2.2 + margin) return true;
      if (casetas.some(n => Math.abs(x - n[3]) < 8 + margin && Math.abs(z - n[4]) < 7 + margin)) return true;
      return false;
    };
    const tree = (x, z, s) => {
      const g = ground(x, z), trunkH = (1.0 + rnd() * .6) * s;
      cylinder(x, g + trunkH / 2, z, .09 * s + .03, trunkH, '#5a4634', { seg: 6 });
      const col = crownCols[Math.floor(rnd() * crownCols.length)];
      const lobes = 3 + Math.floor(rnd() * 2);
      for (let l = 0; l < lobes; l++) {
        const a = rnd() * Math.PI * 2, rr = (l ? .45 : 0) * s, cx = x + Math.cos(a) * rr, cz = z + Math.sin(a) * rr;
        const cy = g + trunkH + (.25 + rnd() * .35) * s, w = (.75 + rnd() * .45) * s, h = (.55 + rnd() * .35) * s;
        const top = [cx, cy + h, cz], bottom = [cx, cy - h * .55, cz];
        for (let k = 0; k < 7; k++) {
          const a0 = k / 7 * Math.PI * 2, a1 = (k + 1) / 7 * Math.PI * 2;
          const p0 = [cx + Math.cos(a0) * w, cy, cz + Math.sin(a0) * w], p1 = [cx + Math.cos(a1) * w, cy, cz + Math.sin(a1) * w];
          const nU = norm([Math.cos((a0 + a1) / 2), .65, Math.sin((a0 + a1) / 2)]), nD = norm([Math.cos((a0 + a1) / 2), -.35, Math.sin((a0 + a1) / 2)]);
          tri(0, p0, nU, p1, nU, top, nU, col); tri(0, p1, nD, p0, nD, bottom, nD, col);
        }
      }
    };
    let placed = 0;
    for (let i = 0; i < 2600 && placed < 380; i++) {
      const x = -92 + rnd() * 140, z = -60 + rnd() * 118;
      const cluster = .5 + .5 * Math.sin(x * .09 + 1.7) * Math.cos(z * .11 - .4);
      if (rnd() > .25 + cluster * .75) continue;
      if (keepOut(x, z, 0)) continue;
      tree(x, z, .75 + rnd() * .75); placed++;
    }
    for (let i = 0; i < 900; i++) {
      const x = -92 + rnd() * 140, z = -60 + rnd() * 118;
      if (keepOut(x, z, -2)) continue;
      const g = ground(x, z), w = .25 + rnd() * .35, h = .22 + rnd() * .28, col = shrubCols[Math.floor(rnd() * shrubCols.length)];
      const top = [x, g + h, z];
      for (let k = 0; k < 5; k++) {
        const a0 = k / 5 * Math.PI * 2, a1 = (k + 1) / 5 * Math.PI * 2, n = norm([Math.cos((a0 + a1) / 2), .7, Math.sin((a0 + a1) / 2)]);
        tri(0, [x + Math.cos(a0) * w, g, z + Math.sin(a0) * w], n, [x + Math.cos(a1) * w, g, z + Math.sin(a1) * w], n, top, n, col);
      }
    }
    for (let i = 0; i < 140; i++) {
      const x = -92 + rnd() * 140, z = -60 + rnd() * 118;
      if (keepOut(x, z, -3)) continue;
      const s = .12 + rnd() * .3, g = ground(x, z);
      box(x, g + s * .35, z, s * (1.2 + rnd()), s * .7, s * (1 + rnd()), rnd() > .5 ? '#9a978c' : '#85827a');
    }
  })();

  for (const segment of siteRoadSegments) siteRoad(segment);
  const buffers=[];
  for(let group=0;group<3;group++){
    const arr=new Float32Array(A[group]);
    const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,arr,gl.STATIC_DRAW);
    buffers.push({buf,count:arr.length/13});
  }
  A.length=0;
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  const levelsUniform=new Float32Array(36);
  function updateWaterLevels(){
    for(let i=0;i<tankSpecs.length;i++){
      const node=config.nodes.filter(n=>n[2]==='tank')[i];
      const value=node&&node[5]?live.get(node[5]):null;
      const level=value&&value.level!==null&&Number.isFinite(Number(value.level))?Number(value.level):null;
      const maximum=value&&value.maximum!==null&&Number.isFinite(Number(value.maximum))?Number(value.maximum):null;
      const modelHeight=3.2*1.40*.90;
      const normalizedMaximum=maximum!==null&&maximum>25?maximum/100:maximum;
      const limit=normalizedMaximum!==null&&normalizedMaximum>0&&normalizedMaximum>=level?normalizedMaximum:modelHeight;
      levelsUniform[i]=level===null||level<=0?0:Math.max(0,Math.min(.94,level/limit*.90));
    }
    for(let group=0;group<casetaIds.length;group++){
      const reading=live.get(casetaDataCodes[group]);
      for(let motor=0;motor<casetaCounts[group];motor++){
        const pump=reading&&Array.isArray(reading.pumps)?reading.pumps[motor]:null;
        levelsUniform[8+casetaStarts[group]+motor]=pump&&typeof pump.on==='boolean'?(pump.on?1:0):.5;
      }
    }
  }
  function drawGroup(group){
    const b=buffers[group];if(!b||!b.count)return;
    gl.bindBuffer(gl.ARRAY_BUFFER,b.buf);
    for(const [attr,offset,size] of [[loc.pos,0,3],[loc.normal,12,3],[loc.color,24,3],[loc.data,36,4]]){
      if(attr<0)continue;gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,size,gl.FLOAT,false,52,offset);
    }
    gl.drawArrays(gl.TRIANGLES,0,b.count);
  }
  const sub=minus;
  const CAMERA_LIMITS={minDist:10,maxDist:118,maxPitch:1.24,panXMin:-58,panXMax:40,panZMin:-24,panZMax:26};
  const state={yaw:.75,pitch:.98,dist:79,target:[0,1.5,0],auto:'',mode:'orbit',night:false,names:true,flowNames:true,levels:true,alerts:true,date:true,showInfo:true,water:true,speed:1,spinFast:false,selected:null,paused:false,pt:0,presIndex:0,presDuration:9.5,quality:1.1,frameCount:0,frameElapsed:0};
  const labels=new Map(),flowLabels=new Map();
  const sillaLabel=document.createElement('div');
  sillaLabel.className='world-sign';
  sillaLabel.textContent='CERRO DE LA SILLA';
  sillaLabel.style.pointerEvents='none';
  sillaLabel.setAttribute('aria-hidden','true');
  $('labels').appendChild(sillaLabel);
  const fmt=(value,dec=2)=>value===null||value===undefined||!Number.isFinite(Number(value))?'N/D':Number(value).toLocaleString('es-MX',{minimumFractionDigits:dec,maximumFractionDigits:dec});
  const getData=n=>n[5]?(live.get(n[5])||null):null;
  for(const n of config.nodes){
    const b=document.createElement('button');b.type='button';b.className='world-sign';
    b.setAttribute('aria-label','Información de '+n[1]);
    const name=document.createElement('strong');name.textContent=n[1];
    b.appendChild(name);
    b.addEventListener('click',()=>selectNode(n[0]));
    $('labels').appendChild(b);
    labels.set(n[0],{el:b});
    if(n[2]==='meter'){
      const f=document.createElement('div');f.className='flow-sign';
      const title=document.createElement('span');title.textContent='FLUJO';
      const value=document.createElement('strong');value.textContent='N/D';
      f.append(title,value);$('labels').appendChild(f);flowLabels.set(n[0],{el:f,value});
    }
  }
  const garrapatasLevel=document.createElement('div');
  garrapatasLevel.className='linares-tank-face-reading';
  garrapatasLevel.style.cssText='position:absolute;transform:translate(-50%,-50%);padding:5px 9px;min-width:57px;text-align:center;background:rgba(30,49,56,.94);color:#fff;border:1px solid #91a6af;border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,.28);font:500 14px/1.3 Arial,sans-serif;white-space:nowrap;pointer-events:none;z-index:2;font-variant-numeric:tabular-nums';
  garrapatasLevel.textContent='N/D';
  $('labels').appendChild(garrapatasLevel);
  const proj=(fovy,aspect,near,far)=>{const f=1/Math.tan(fovy/2);return [f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]};
  const view=(eye,target)=>{const z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-x[0]*eye[0]-x[1]*eye[1]-x[2]*eye[2],-y[0]*eye[0]-y[1]*eye[1]-y[2]*eye[2],-z[0]*eye[0]-z[1]*eye[1]-z[2]*eye[2],1]};
  const mul=(a,b)=>{const m=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];m[c*4+r]=s;}return m};
  const project=(p,m,w,h)=>{const x=p[0],y=p[1],z=p[2],q=m[3]*x+m[7]*y+m[11]*z+m[15];if(q<=.05)return null;const px=(m[0]*x+m[4]*y+m[8]*z+m[12])/q,py=(m[1]*x+m[5]*y+m[9]*z+m[13])/q;if(Math.abs(px)>1.13||Math.abs(py)>1.13)return null;return [(px*.5+.5)*w,(-py*.5+.5)*h,q]};
  const presentation=$('presentationPanel');
  const syncButtons=()=>{for(const id of ['spin','around','free','presentationToggle'])$(id).classList.toggle('active',id==='presentationToggle'?state.auto==='presentation':id==='free'?state.mode==='pan':state.auto===id);for(const [id,value] of [['water',state.water],['flowLabelsToggle',state.flowNames],['levelsToggle',state.levels],['labelsToggle',state.names],['alertsToggle',state.alerts],['dateToggle',state.date]])$(id).classList.toggle('active',value);$('modeToggle').textContent=state.night?'Modo noche':'Modo día';$('spinSpeed').textContent=state.spinFast?'Giro: Rápido':'Giro: Normal';$('flowSpeed').textContent='Velocidad visual ×'+state.speed;$('hideInfo').textContent=state.showInfo?'Ocultar información':'Mostrar información';document.body.classList.toggle('night',state.night);document.body.classList.toggle('presentation-on',state.auto==='presentation');};
  const showPanel=(show=true)=>{presentation.hidden=!show||!state.showInfo;};
  function selectNode(id){const entry=nodeById.get(id);if(!entry)return;state.selected=id;const n=entry.data;updatePanel(n);showPanel();for(const [key,val]of labels)val.el.classList.toggle('selected',key===id);loadHistory(n);}
  const casetaControl=document.createElement('div');
  casetaControl.style.cssText='display:none;align-items:center;justify-content:space-between;gap:12px;padding:10px 13px;margin-top:8px;background:#f4f6f6;border:1px solid #cfd8dc;border-radius:4px;font:13px Arial,sans-serif;color:#24333a';
  const casetaControlText=document.createElement('span');
  const casetaControlButton=document.createElement('button');
  casetaControlButton.type='button';
  casetaControlButton.style.cssText='border:1px solid #8e9fa7;background:#fff;color:#263840;border-radius:4px;min-height:33px;padding:5px 13px;font:13px Arial,sans-serif;cursor:pointer;white-space:nowrap';
  casetaControlButton.setAttribute('aria-label','Encender o apagar el foco de la caseta seleccionada');
  casetaControl.append(casetaControlText,casetaControlButton);
  $('presentationPanel').querySelector('.presentation-content').appendChild(casetaControl);
  function refreshCasetaControl(n){
    const id=n&&n[0],index=casetaLightById.get(id);
    if(index===undefined){casetaControl.style.display='none';return;}
    const on=casetaLightState[index]>.5;
    casetaControl.style.display='flex';
    casetaControlText.textContent='Iluminación interior · '+(on?'Encendida':'Apagada');
    casetaControlButton.textContent=on?'Apagar foco':'Encender foco';
    casetaControlButton.setAttribute('aria-pressed',String(on));
  }
  casetaControlButton.onclick=()=>{
    const index=casetaLightById.get(state.selected);
    if(index===undefined)return;
    casetaLightState[index]=casetaLightState[index]>.5?0:1;
    refreshCasetaControl(nodeById.get(state.selected).data);
  };
  function updatePanel(n){
    if(!n)return;
    refreshCasetaControl(n);
    const s=getData(n),idx=config.nodes.indexOf(n),kind=n[2];
    $('presentationStep').textContent='INSTALACIÓN '+(idx+1)+' DE '+config.nodes.length;
    $('presentationName').textContent=n[1];
    const hasLevel=!!s&&Number.isFinite(Number(s.level))&&s.level!==null;
    const hasFlow=!!s&&Number.isFinite(Number(s.flow))&&s.flow!==null;
    const isTank=kind==='tank';
    const isReference=!n[5];
    $('primaryLabel').textContent=isTank||hasLevel?'Nivel actual':kind==='pump'?'Flujo de salida':kind==='meter'?'Flujo medido':'Referencia';
    $('primaryValue').textContent=isTank||hasLevel?(hasLevel?fmt(s.level)+' m':'N/D'):(hasFlow?fmt(s.flow,0)+' LPS':'N/D');
    $('flowValue').textContent=hasFlow?fmt(s.flow,0)+' LPS':'N/D';
    $('stateValue').textContent=isReference?'Sin lectura':!s||s.status==='sin_datos'?'Sin datos':s.status==='sin_comunicacion'?'Sin comunicación':s.observation?'Observación':'Actual';
    $('lastReading').textContent=s&&s.updated?'Actualización: '+s.updated:isReference?'Referencia hidráulica · sin sensor asociado':'Sin actualización';
    $('pumpSection').hidden=kind!=='pump';
    $('pumpList').replaceChildren();
    if(kind==='pump'){const index=casetaLightById.get(n[0]),count=index===undefined?0:casetaCounts[index];for(let i=0;i<count;i++){const p=s&&Array.isArray(s.pumps)?s.pumps[i]:null;const chip=document.createElement('span');chip.className=p&&typeof p.on==='boolean'?(p.on?'on':'off'):'unavailable';chip.textContent='EQ'+(i+1)+(p&&typeof p.on==='boolean'?(p.on?' · Operando':' · Inactivo'):' · Sin dato');$('pumpList').appendChild(chip);}}
    $('flowSection').hidden=!(hasLevel&&hasFlow);
    const details=$('secondaryReadings');details.replaceChildren();
    const items=s&&Array.isArray(s.extra)?s.extra:[];
    for(const item of items){if(!item||item.value===null||!Number.isFinite(Number(item.value)))continue;
      const row=document.createElement('div');row.className='linares-detail-row';
      const name=document.createElement('span');name.textContent=item.label;
      const value=document.createElement('strong');value.textContent=fmt(item.value,item.unit==='kg/cm²'?2:0)+' '+(item.unit||'');
      row.append(name,value);details.appendChild(row);
    }
    details.hidden=!details.childElementCount;
  }
  let historyRequest=0,history=[];
  async function loadHistory(n){const request=++historyRequest;history=[];$('graphSection').hidden=true;const code=n[5];if(!code)return;try{const resp=await fetch('/Telemetria/php/linares_3d_historial.php?codigo='+encodeURIComponent(code)+'&horas=6',{cache:'no-store'});if(!resp.ok)return;const obj=await resp.json();if(request!==historyRequest||state.selected!==n[0])return;const key=n[2]==='tank'||n[2]==='reservoir'?'level':'flow';history=Array.isArray(obj[key])?obj[key]:[];if(history.length>=2){$('graphTitle').textContent=key==='flow'?'FLUJO':'NIVEL';$('graphValue').textContent=history.length?fmt(history[history.length-1][1])+(key==='flow'?' LPS':' m'):'';$('graphSection').hidden=false;drawChart();}}catch(e){}}
  function drawChart(){
    /* MV PRO: gráfica estilo tendencia SCADA (igual que Monterrey V / Anillo TV) */
    const el=$('graph');if($('graphSection').hidden||history.length<2)return;
    const rect=el.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(230,rect.width),h=Math.max(150,rect.height);
    el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);
    const ctx=el.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const data=history.filter(v=>Number.isFinite(v[0])&&Number.isFinite(v[1]));if(data.length<2)return;
    const isFlow=$('graphTitle').textContent==='FLUJO',color=isFlow?'#4f5b66':'#0058b7',dec=isFlow?0:2;
    const minX=data[0][0],maxX=data[data.length-1][0]||minX+1,vs=data.map(p=>p[1]),minY=Math.min(...vs),maxY=Math.max(...vs);
    const span=Math.max(isFlow?4:.1,maxY-minY),lo=Math.max(0,minY-span*.20),hi=maxY+span*.20;
    const L=46,R=w-50,T=8,B=h-24;
    const px=p=>L+(p[0]-minX)/Math.max(1,maxX-minX)*(R-L),py=p=>B-(p[1]-lo)/Math.max(1e-6,hi-lo)*(B-T);
    ctx.fillStyle='#ffffff';ctx.fillRect(L,T,R-L,B-T);
    ctx.font='10px "Segoe UI",Arial';ctx.lineWidth=1;
    for(let i=0;i<=4;i++){const y=Math.round(T+i*(B-T)/4)+.5;if(i>0&&i<4){ctx.strokeStyle='#e9eef2';ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(R,y);ctx.stroke();}
      ctx.strokeStyle='#8a98a5';ctx.beginPath();ctx.moveTo(L-4,y);ctx.lineTo(L,y);ctx.stroke();
      ctx.fillStyle='#3d4852';ctx.textAlign='right';ctx.fillText(fmt(hi-(hi-lo)*i/4,dec),L-7,y+3.5);}
    for(let i=0;i<=6;i++){const x=Math.round(L+i*(R-L)/6)+.5;if(i>0&&i<6){ctx.strokeStyle='#f0f3f6';ctx.beginPath();ctx.moveTo(x,T);ctx.lineTo(x,B);ctx.stroke();}
      ctx.strokeStyle='#8a98a5';ctx.beginPath();ctx.moveTo(x,B);ctx.lineTo(x,B+4);ctx.stroke();
      if(i%2===0){const d=new Date(minX+i*(maxX-minX)/6);ctx.fillStyle='#3d4852';ctx.textAlign=i===0?'left':i===6?'right':'center';ctx.fillText(d.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',hour12:false}),x,h-6);}}
    ctx.strokeStyle='#c3ccd4';ctx.strokeRect(L+.5,T+.5,R-L-1,B-T-1);
    ctx.beginPath();ctx.moveTo(px(data[0]),B);for(const p of data)ctx.lineTo(px(p),py(p));ctx.lineTo(px(data[data.length-1]),B);ctx.closePath();
    ctx.globalAlpha=.07;ctx.fillStyle=color;ctx.fill();ctx.globalAlpha=1;
    ctx.beginPath();data.forEach((p,i)=>i?ctx.lineTo(px(p),py(p)):ctx.moveTo(px(p),py(p)));ctx.strokeStyle=color;ctx.lineWidth=1.7;ctx.lineJoin='miter';ctx.stroke();
    if(data.length<=90){ctx.lineWidth=1.2;for(const p of data){ctx.fillStyle='#ffffff';ctx.fillRect(px(p)-2,py(p)-2,4,4);ctx.strokeStyle=color;ctx.strokeRect(px(p)-2,py(p)-2,4,4);}}
    const last=data[data.length-1],lx=px(last),ly=py(last),tag=fmt(last[1],dec),tw=Math.max(40,ctx.measureText(tag).width+12),ty=Math.min(B-8,Math.max(T+8,ly));
    ctx.setLineDash([3,2]);ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(R,ly);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(R,ty);ctx.lineTo(R+5,ty-8);ctx.lineTo(R+5+tw,ty-8);ctx.lineTo(R+5+tw,ty+8);ctx.lineTo(R+5,ty+8);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ffffff';ctx.font='700 10px "Segoe UI",Arial';ctx.textAlign='center';ctx.fillText(tag,R+5+tw/2,ty+3.6);
    ctx.fillStyle=color;ctx.fillRect(lx-3,ly-3,6,6);ctx.textAlign='left';
    $('graphLatest').textContent='Última '+new Date(maxX).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',hour12:false});
  }
  function alertsRefresh(){const alerts=[];for(const n of config.nodes){const s=getData(n);if(!s)continue;if(s.status==='sin_comunicacion')alerts.push({id:n[0],name:n[1],type:'Sin comunicación'});else if(s.observation)alerts.push({id:n[0],name:n[1],type:'Nivel fuera de parámetros'});}const bar=$('alertBar');bar.hidden=!state.alerts||!alerts.length;$('alertCount').hidden=!alerts.length;$('alertCount').textContent=alerts.length;$('alertSummary').textContent=alerts.length?alerts[0].name+'   '+alerts[0].type:'';$('alertsList').replaceChildren();for(const a of alerts){const b=document.createElement('button');b.type='button';b.textContent=a.name+' · '+a.type;b.onclick=()=>{selectNode(a.id);$('alertsList').hidden=true};$('alertsList').appendChild(b);}}
  function updateData(){
    const g=live.get('TGRP0001');
    const level=g&&g.level!==null&&Number.isFinite(Number(g.level))?Number(g.level):null;
    garrapatasLevel.textContent=level===null?'N/D':fmt(level)+' m';
    garrapatasLevel.title=level===null?'Sin lectura válida de Garrapatas':'Nivel del Tanque Garrapatas'+(g.updated?' · '+g.updated:'');
    for(const n of config.nodes){
      const f=flowLabels.get(n[0]);
      if(f){const s=getData(n);f.value.textContent=s&&s.flow!=null?fmt(s.flow,0)+' LPS':'N/D';}
    }
    if(state.selected)updatePanel(nodeById.get(state.selected).data);
    alertsRefresh();
  }
  let retrieving=false;
  async function loadData(){if(retrieving)return;retrieving=true;try{const r=await fetch('/Telemetria/php/linares_3d_datos.php?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('Error HTTP');const obj=await r.json();if(!obj.items)throw Error('Datos incompletos');live.clear();for(const [code,item]of Object.entries(obj.items))live.set(code,item);updateData();$('notice').hidden=true;}catch(e){live.clear();updateData();$('notice').textContent='Sin conexión con lecturas de Linares';$('notice').hidden=false;}finally{retrieving=false;}}
  function reset(){state.yaw=.75;state.pitch=.98;state.dist=79;state.target=[0,1.5,0];state.auto='';state.mode='orbit';state.selected=null;showPanel(false);syncButtons();}
  function startPresentation(){state.auto='presentation';state.pt=0;state.presIndex=0;state.paused=false;state.showInfo=true;selectNode(config.nodes[0][0]);showPanel();syncButtons();}
  function endPresentation(){state.auto='';state.paused=false;state.selected=null;showPanel(false);syncButtons();}
  function jumpPresentation(delta){state.presIndex=(state.presIndex+delta+config.nodes.length)%config.nodes.length;state.pt=0;selectNode(config.nodes[state.presIndex][0]);}
  $('reset').onclick=reset;
  $('top').onclick=()=>{state.auto='';state.pitch=.24;state.yaw=1.56;state.dist=82;state.target=[0,1.5,0];syncButtons();};
  $('zoomIn').onclick=()=>state.dist=Math.max(CAMERA_LIMITS.minDist,state.dist*.80);
  $('zoomOut').onclick=()=>state.dist=Math.min(CAMERA_LIMITS.maxDist,state.dist*1.20);
  $('full').onclick=()=>document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.();
  $('spin').onclick=()=>{state.auto=state.auto==='spin'?'':'spin';syncButtons();};
  $('spinSpeed').onclick=()=>{state.spinFast=!state.spinFast;syncButtons();};
  $('around').onclick=()=>{state.auto=state.auto==='around'?'':'around';syncButtons();};
  $('free').onclick=()=>{state.auto='';state.mode=state.mode==='pan'?'orbit':'pan';syncButtons();};
  $('presentationToggle').onclick=()=>state.auto==='presentation'?endPresentation():startPresentation();
  $('hideInfo').onclick=()=>{state.showInfo=!state.showInfo;showPanel(state.selected!==null);syncButtons();};
  $('water').onclick=()=>{state.water=!state.water;syncButtons();};
  $('flowSpeed').onclick=()=>{state.speed=state.speed===1?2:state.speed===2?3:1;syncButtons();};
  $('flowLabelsToggle').onclick=()=>{state.flowNames=!state.flowNames;syncButtons();};
  $('levelsToggle').onclick=()=>{state.levels=!state.levels;updateData();syncButtons();};
  $('labelsToggle').onclick=()=>{state.names=!state.names;syncButtons();};
  $('alertsToggle').onclick=()=>{state.alerts=!state.alerts;alertsRefresh();syncButtons();};
  $('dateToggle').onclick=()=>{state.date=!state.date;$('clockText').hidden=!state.date;syncButtons();};
  $('modeToggle').onclick=()=>{state.night=!state.night;syncButtons();};
  $('controlsToggle').onclick=()=>{
    const panel=$('controlsPanel');
    const next=panel.hidden;
    panel.hidden=!next;
    panel.classList.toggle('is-open',next);
    panel.setAttribute('aria-hidden',String(!next));
    $('controlsToggle').setAttribute('aria-expanded',String(next));
    $('controlsToggle').setAttribute('aria-label',next?'Ocultar controles':'Mostrar controles');
    const footer=$('mvPanoramaHeading');
    if(footer){footer.classList.toggle('is-open',next);footer.setAttribute('aria-expanded',String(next));}
  };
  $('presentationClose').onclick=endPresentation;
  $('presentationOptions').onclick=()=>$('presentationMore').hidden=!$('presentationMore').hidden;
  $('presentationPrev').onclick=()=>jumpPresentation(-1);
  $('presentationNext').onclick=()=>jumpPresentation(1);
  $('presentationPause').onclick=()=>{state.paused=!state.paused;$('presentationPause').textContent=state.paused?'Continuar':'Pausar';};
  $('alertsAll').onclick=()=>{$('alertsList').hidden=!$('alertsList').hidden;$('alertsAll').setAttribute('aria-expanded',String(!$('alertsList').hidden));};
  let pointer=null;
  mvMotionResize = resize;
  canvas.addEventListener('pointermove', e => { if (e.buttons) mvMotionStart(); }, { passive: true });
  canvas.addEventListener('wheel', mvMotionStart, { passive: true });
  canvas.addEventListener('touchmove', mvMotionStart, { passive: true });
  canvas.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY,button:e.button};try{canvas.setPointerCapture(e.pointerId);}catch(x){}if(state.auto!=='presentation')state.auto='';syncButtons();});
  canvas.addEventListener('pointerup',()=>pointer=null);canvas.addEventListener('pointercancel',()=>pointer=null);
  canvas.addEventListener('pointermove',e=>{if(!pointer)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer.x=e.clientX;pointer.y=e.clientY;if(state.mode==='pan'||e.button===2||pointer.button===2||e.shiftKey){const speed=state.dist*.0012;state.target[0]=Math.max(CAMERA_LIMITS.panXMin,Math.min(CAMERA_LIMITS.panXMax,state.target[0]+Math.sin(state.yaw)*dx*speed));state.target[2]=Math.max(CAMERA_LIMITS.panZMin,Math.min(CAMERA_LIMITS.panZMax,state.target[2]-Math.cos(state.yaw)*dx*speed+dy*speed));}else{state.yaw-=dx*.005;state.pitch=Math.max(.18,Math.min(CAMERA_LIMITS.maxPitch,state.pitch-dy*.005));}});
  canvas.addEventListener('wheel',e=>{e.preventDefault();state.dist=Math.max(CAMERA_LIMITS.minDist,Math.min(CAMERA_LIMITS.maxDist,state.dist*Math.exp(e.deltaY*.001)));},{passive:false});canvas.addEventListener('contextmenu',e=>e.preventDefault());
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.auto==='presentation')endPresentation();else if(e.key==='ArrowLeft')state.yaw-=.1;else if(e.key==='ArrowRight')state.yaw+=.1;});
  let vw=0,vh=0,density=0,lastFrame=performance.now(),qualityFrames=0,qualityMs=0;
  const maxSize=Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)||4096,gl.getParameter(gl.MAX_TEXTURE_SIZE)||4096);
  function resize(){const w=Math.max(1,Math.round(canvas.clientWidth)),h=Math.max(1,Math.round(canvas.clientHeight)),dpr=Math.max(1,window.devicePixelRatio||1);let densityScale=Math.min(mvUltra?2.4:1.65,(mvUltra?Math.max(1.5,dpr):dpr)*state.quality);densityScale=Math.max(.65,Math.min(densityScale,Math.sqrt((mvUltra?30000000:9500000)/(w*h)),maxSize/w,maxSize/h));densityScale=Math.max(.55,densityScale*mvMotionScale);canvas.width=Math.max(1,Math.round(w*densityScale));canvas.height=Math.max(1,Math.round(h*densityScale));vw=w;vh=h;density=dpr;gl.viewport(0,0,canvas.width,canvas.height);drawChart();}
  function drawLabels(mat,eye){
    const tankInfo=tankLabels[0];
    const direction=tankInfo?Math.hypot(eye[0]-tankInfo.x,eye[2]-tankInfo.z)||1:1;
    const tankReading=tankInfo?project([tankInfo.x+(eye[0]-tankInfo.x)/direction*tankInfo.radius*1.03,tankInfo.screenY,tankInfo.z+(eye[2]-tankInfo.z)/direction*tankInfo.radius*1.03],mat,vw,vh):null;
    garrapatasLevel.hidden=!state.names||!tankReading||(state.auto==='presentation'&&state.selected!=='li04a');
    if(!garrapatasLevel.hidden){garrapatasLevel.style.left=tankReading[0]+'px';garrapatasLevel.style.top=tankReading[1]+'px';}
    const occupied=[];for(const n of config.nodes){const l=labels.get(n[0]),isMeter=n[2]==='meter';if(state.auto==='presentation'&&state.selected&&n[0]!==state.selected){l.el.hidden=true;continue;}if(!state.names){l.el.hidden=true;const f=flowLabels.get(n[0]);if(f)f.el.hidden=true;continue;}const p=project([n[3],isMeter?2.15:n[2]==='tank'?5.0:n[2]==='reservoir'?2.25:n[2]==='pump'?6.15:3.9,n[4]],mat,vw,vh);if(!p){l.el.hidden=true;if(isMeter)flowLabels.get(n[0]).el.hidden=true;continue;}const x=p[0],y=p[1],wid=n[2]==='pump'?184:Math.min(180,Math.max(105,n[1].length*6.1)),rect=[x-wid/2,y-42,x+wid/2,y];let collision=occupied.some(q=>rect[0]<q[2]+7&&rect[2]>q[0]-7&&rect[1]<q[3]+5&&rect[3]>q[1]-5);if(collision&&n[0]!==state.selected){l.el.hidden=true;}else{l.el.hidden=false;l.el.style.left=x+'px';l.el.style.top=y+'px';occupied.push(rect);}if(isMeter){const f=flowLabels.get(n[0]);const fp=project([n[3]+1.8,1.4,n[4]+2.2],mat,vw,vh);f.el.hidden=!state.flowNames||!fp||collision;if(!f.el.hidden){f.el.style.left=fp[0]+'px';f.el.style.top=fp[1]+'px';}}}}
  function keepCameraAboveTerrain(eye,look){
    const radius=Math.hypot(eye[0],eye[2]);
    if(radius>167){const scale=167/radius;eye[0]*=scale;eye[2]*=scale;}
    let safeHeight=2.4;
    for(let i=2;i<=15;i++){
      const fraction=i/15;
      const px=look[0]+(eye[0]-look[0])*fraction;
      const pz=look[2]+(eye[2]-look[2])*fraction;
      const distance=Math.hypot(px,pz);
      const clearance=distance>96?4.5:distance>70?3.0:1.65;
      const required=terrainHeight(px,pz)+clearance;
      safeHeight=Math.max(safeHeight,(required-look[1]*(1-fraction))/fraction);
    }
    eye[1]=Math.max(eye[1],safeHeight);
  }
  function render(now){const dt=Math.min(.06,Math.max(.001,(now-lastFrame)/1000));lastFrame=now;qualityFrames++;qualityMs+=dt*1000;if(qualityFrames>=90){const avg=qualityMs/qualityFrames,old=state.quality;if(avg>29)state.quality=Math.max(.75,state.quality-.08);else if(avg<18)state.quality=Math.min(1.24,state.quality+.03);qualityFrames=0;qualityMs=0;if(Math.abs(state.quality-old)>.005)resize();}if(vw!==canvas.clientWidth||vh!==canvas.clientHeight||density!==(window.devicePixelRatio||1))resize();
    if(state.auto==='spin'||state.auto==='around')state.yaw+=dt*(state.spinFast?.33:.20)*(state.auto==='spin'?1:.68);
    if(state.auto==='presentation') {if(!state.paused){state.pt+=dt;if(state.pt>=state.presDuration)jumpPresentation(1);}const n=config.nodes[state.presIndex],t=Math.min(1,dt*1.8),pump=n[2]==='pump',reservoir=n[2]==='reservoir',tank=n[2]==='tank';const lateral=pump&&vw>1020&&state.showInfo?2.8:0;state.target[0]+=(n[3]+Math.sin(state.yaw)*lateral-state.target[0])*t;state.target[2]+=(n[4]-Math.cos(state.yaw)*lateral-state.target[2])*t;state.target[1]+=((pump?2.8:tank?2.3:1.4)-state.target[1])*t;state.dist+=((pump?23.0:tank?15.6:reservoir?27:20)-state.dist)*t;state.pitch+=((pump?1.06:tank?1.04:1.03)-state.pitch)*t;state.yaw+=dt*(pump?.075:.035);$('presentationProgress').style.width=(state.pt/state.presDuration*100).toFixed(2)+'%';}
    if(state.auto==='spin'&&state.selected){const n=nodeById.get(state.selected).data;if(n[2]==='pump'){const t=Math.min(1,dt*1.25);state.target[0]+=(n[3]-state.target[0])*t;state.target[2]+=(n[4]-state.target[2])*t;state.target[1]+=(2.8-state.target[1])*t;state.dist+=(24.0-state.dist)*t;}}
    state.dist=Math.max(CAMERA_LIMITS.minDist,Math.min(CAMERA_LIMITS.maxDist,state.dist));
    state.pitch=Math.max(.18,Math.min(CAMERA_LIMITS.maxPitch,state.pitch));
    const sn=Math.sin(state.pitch),cs=Math.cos(state.pitch),eye=[state.target[0]+Math.cos(state.yaw)*state.dist*sn,Math.max(2.1,state.target[1]+state.dist*cs),state.target[2]+Math.sin(state.yaw)*state.dist*sn];
    eye[0]=Math.max(-118,Math.min(72,eye[0]));
    eye[2]=Math.max(-64,Math.min(58,eye[2]));
    keepCameraAboveTerrain(eye,state.target);
    const mat=mul(proj(Math.PI/3.45,canvas.width/Math.max(canvas.height,1),.12,600),view(eye,state.target));
    mvRenderShadowMap();
    gl.clearColor(.60,.78,.88,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    eveningBlend+=(Number(state.night)-eveningBlend)*Math.min(1,dt*2.6);
    renderSky(eye,state.target,now*.001,canvas.width/Math.max(1,canvas.height));
    gl.useProgram(program);gl.uniformMatrix4fv(loc.vp,false,mat);
    if(loc.cam!==null)gl.uniform3fv(loc.cam,new Float32Array(eye));
    if(loc.time!==null)gl.uniform1f(loc.time,now*.001*state.speed);
    if(loc.anim!==null)gl.uniform1f(loc.anim,state.water?1:0);
    if(loc.evening!==null)gl.uniform1f(loc.evening,eveningBlend);
    mvBindProUniforms();
    if(loc.casetaLights!==null)gl.uniform1fv(loc.casetaLights,casetaLightState);
    if(loc.terrainDetail!==null)gl.uniform1f(loc.terrainDetail,state.quality>.80?1:0);
    updateWaterLevels();if(loc.levels!==null)gl.uniform1fv(loc.levels,levelsUniform);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,turfTexture);
    gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,forestTexture);
    gl.enable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.depthMask(true);
    drawGroup(0);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
    drawGroup(1);drawGroup(2);
    gl.depthMask(true);gl.disable(gl.BLEND);
    drawLabels(mat,eye);
    const sillaPosition=project([-84,30,10],mat,vw,vh);
    sillaLabel.hidden=!state.names||!sillaPosition||state.auto==='presentation';
    if(!sillaLabel.hidden){sillaLabel.style.left=sillaPosition[0]+'px';sillaLabel.style.top=sillaPosition[1]+'px';}
    requestAnimationFrame(render);
  }
  setInterval(()=>{if(state.date)$('clockText').textContent=new Date().toLocaleString('es-MX',{timeZone:'America/Monterrey',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})},1000);
  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('visibilitychange',()=>{lastFrame=performance.now();});
  syncButtons();resize();loadData();setInterval(loadData,60000);requestAnimationFrame(render);
})();
