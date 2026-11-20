'use strict';

(function() {
  const canvas = document.getElementById('scene');
  const mvSkyPhoto = /[?&]cielo=foto/i.test(location.search);
  let mvMotionScale = 1, mvMotionTimer = 0, mvMotionResize = null;
  function mvMotionStart() {
    clearTimeout(mvMotionTimer);
    if (mvMotionScale !== .68) {
      mvMotionScale = .68;
      if (mvMotionResize) mvMotionResize();
    }
    mvMotionTimer = setTimeout(() => {
      mvMotionScale = 1;
      if (mvMotionResize) mvMotionResize();
    }, 260);
  }
  const mvUltra = /[?&](calidad=ultra|4k)(&|$|=)/i.test(location.search) || window.screen && window.screen.width * (window.devicePixelRatio || 1) >= 3800;
  console.info('ANILLOTV3D-LPS-PROFUNDIDAD-Y-ANCLAJE-20261111');
  const gl = canvas.getContext('webgl2', {
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  }) || canvas.getContext('webgl', {
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  if (!gl) {
    const notice = document.getElementById('notice');
    notice.querySelector('.notice-title').textContent = 'No se pudo iniciar WebGL';
    notice.querySelector('.notice-text').textContent = 'El navegador no pudo crear un contexto WebGL. Verifica la aceleración por hardware y chrome://gpu. Si la versión anterior abre, revisa la consola con F12.';
    notice.style.display = 'block';
    document.documentElement.classList.add('mv-scene-ready');
    return;
  }
  let graphicsContextLost = false;
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    graphicsContextLost = true;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    window.location.reload();
  });
  const vert = `\nattribute vec3 aPos; attribute vec3 aNormal; attribute vec3 aColor; attribute vec4 aData;\nuniform mat4 uVP; uniform float uTime; uniform float uAnimate; uniform float uLevels[36];\nuniform mat4 uLightVP; varying vec4 vShadowPos;\nvarying vec3 vNormal; varying vec3 vColor; varying vec3 vPos; varying vec4 vData;\nvarying float vTankFill;\nfloat getLevel(float id){\n  if(id < 0.5) return uLevels[0];\n  if(id < 1.5) return uLevels[1];\n  if(id < 2.5) return uLevels[2];\n  if(id < 3.5) return uLevels[3];\n  if(id < 4.5) return uLevels[4];\n  if(id < 5.5) return uLevels[5];\n  if(id < 6.5) return uLevels[6];\n  if(id < 7.5) return uLevels[7];\n  if(id < 8.5) return uLevels[8];\n  if(id < 9.5) return uLevels[9];\n  if(id < 10.5) return uLevels[10];\n  if(id < 11.5) return uLevels[11];\n  if(id < 12.5) return uLevels[12];\n  if(id < 13.5) return uLevels[13];\n  if(id < 14.5) return uLevels[14];\n  if(id < 15.5) return uLevels[15];\n  if(id < 16.5) return uLevels[16];\n  if(id < 17.5) return uLevels[17];\n  if(id < 18.5) return uLevels[18];\n  if(id < 19.5) return uLevels[19];\n  if(id < 20.5) return uLevels[20];\n  if(id < 21.5) return uLevels[21];\n  if(id < 22.5) return uLevels[22];\n  if(id < 23.5) return uLevels[23];\n  if(id < 24.5) return uLevels[24];\n  if(id < 25.5) return uLevels[25];\n  if(id < 26.5) return uLevels[26];\n  if(id < 27.5) return uLevels[27];\n  if(id < 28.5) return uLevels[28];\n  if(id < 29.5) return uLevels[29];\n  if(id < 30.5) return uLevels[30];\n  if(id < 31.5) return uLevels[31];\n  if(id < 32.5) return uLevels[32];\n  if(id < 33.5) return uLevels[33];\n  if(id < 34.5) return uLevels[34];\n  return uLevels[35];\n}\nvoid main(){\n  vec3 p=aPos;\n  vTankFill=1.0;\n  if((aData.z>4.5 && aData.z<6.5) || (aData.z>8.5 && aData.z<10.5)){\n\n    float level=clamp(getLevel(aData.y),.0,.94);\n    vTankFill=level;\n    p.y=.52+(p.y-.52)*level;\n    if(aData.z>8.5 && aData.z<9.5){\n      vec2 impact=aColor.xy;\n      float r=length(aPos.xz-impact);\n      float fade=exp(-r*1.9);\n      float wave=sin(r*18.0-uTime*4.4)*.024*fade;\n      float secondary=sin(r*32.0-uTime*6.2)*.008*fade;\n      p.y+=(wave+secondary)*smoothstep(.025,.20,level)*uAnimate;\n    }else if(aData.z>9.5 && aData.z<10.5){\n      vec2 impact=aColor.xy;\n      vec2 radial=aPos.xz-impact;\n      float originalR=length(radial);\n      float newR=mod(originalR+uTime*.34*uAnimate,.78);\n      p.xz=impact+normalize(radial+vec2(.00001))*(newR+.02);\n      p.y+=(.028+.009*sin(newR*17.0-uTime*2.0))*level;\n    }else if(aData.z>5.5){\n      p.y+=(.020*sin(aPos.x*3.1+uTime*.95)+.017*sin(aPos.z*4.1-uTime*.65))*level*uAnimate;\n    }\n  }\n  vPos=p;vNormal=aNormal;vColor=aColor;vData=aData;gl_Position=uVP*vec4(p,1.0);\n  vShadowPos=uLightVP*vec4(p,1.0);\n}`;
  const frag = `\nprecision highp float;\nvarying vec3 vNormal; varying vec3 vColor; varying vec3 vPos; varying vec4 vData;\nvarying float vTankFill;\nuniform vec3 uCamera; uniform float uTime; uniform float uAnimate; uniform float uTerrainDetail; uniform float uEvening;\nuniform sampler2D uTurfTex; uniform sampler2D uForestTex;\n\nuniform sampler2D uShadowMap; uniform float uShadowOn; uniform vec2 uShadowTexel; varying vec4 vShadowPos;\nuniform vec4 uTankAO[1]; uniform float uAOOn;\nuniform sampler2D uSkyRefl; uniform float uSkyReflReady; uniform float uProGrade;\nfloat mvShadow(vec3 N, vec3 L){\n  if(uShadowOn<.5) return 1.0;\n  vec3 s=vShadowPos.xyz/vShadowPos.w*.5+.5;\n  if(s.x<=.001||s.x>=.999||s.y<=.001||s.y>=.999||s.z>=1.0) return 1.0;\n  float ndl=clamp(dot(N,L),0.0,1.0);\n  float bias=.00045+.0016*(1.0-ndl);\n  vec2 t=uShadowTexel*1.35;\n  float sum=step(s.z-bias,texture2D(uShadowMap,s.xy+vec2(-.5,-1.5)*t).r)\n           +step(s.z-bias,texture2D(uShadowMap,s.xy+vec2(1.5,-.5)*t).r)\n           +step(s.z-bias,texture2D(uShadowMap,s.xy+vec2(.5,1.5)*t).r)\n           +step(s.z-bias,texture2D(uShadowMap,s.xy+vec2(-1.5,.5)*t).r);\n  float edge=smoothstep(.0,.04,min(min(s.x,1.0-s.x),min(s.y,1.0-s.y)));\n  return mix(1.0,sum*.25,edge);\n}\nfloat mvContactAO(){\n  float ao=1.0;\n  for(int i=0;i<1;i++){\n    vec4 t=uTankAO[i];\n    if(t.z<.001) continue;\n    float dd=max(length(vPos.xz-t.xy)-t.z,0.0);\n    ao*=1.0-.34*exp(-dd*1.45);\n  }\n  return ao;\n}\nvec3 mvSky(vec3 dir){\n  dir=normalize(vec3(dir.x,max(dir.y,.03),dir.z));\n  float az=atan(dir.z,dir.x);\n  float el=asin(clamp(dir.y,-1.0,1.0));\n  vec3 sky=mix(vec3(.78,.86,.93),vec3(.24,.48,.82),pow(clamp(dir.y,0.0,1.0),.55));\n  sky+=vec3(.25,.22,.16)*pow(max(dot(dir,normalize(vec3(-.42,.95,.56))),0.0),12.0);\n  return sky*mix(vec3(1.0),vec3(.45,.52,.66),uEvening);\n}\nvec3 mvGrade(vec3 c){\n  c=max(c,vec3(0.0));\n  float l=dot(c,vec3(.2126,.7152,.0722));\n  vec3 g=mix(vec3(l),c,1.07);\n  g=(g-.5)*1.055+.5+.006;\n  g*=vec3(1.012,1.0,.985);\n  return mix(c,clamp(g,0.0,1.0),uProGrade);\n}\nfloat hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}\nfloat noise2(vec2 p){\n  vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);\n  return mix(mix(hash2(i),hash2(i+vec2(1.,0.)),f.x),\n    mix(hash2(i+vec2(0.,1.)),hash2(i+vec2(1.,1.)),f.x),f.y);\n}\nfloat waterNoise(vec2 p){\n  float a=0.0;\n  a+=0.54*noise2(p);\n  a+=0.29*noise2(p*2.04+vec2(11.1,-7.2));\n  a+=0.17*noise2(p*4.15+vec2(-3.2,8.4));\n  return a;\n}\nvec3 mvUnifiedGrass(vec2 uv, vec3 N, vec3 L, vec3 V, float d, float d2){\n  if (uTerrainDetail < .5) {\n    float broad=noise2(uv*.065);\n    float medium=noise2(uv*.42+vec2(-14.2,9.3));\n    float fine=noise2(uv*2.4+vec2(4.3,17.9));\n    float layout=clamp(broad*.56+medium*.33+fine*.11,0.,1.);\n    vec3 dark=vec3(.075,.18,.08);\n    vec3 base=vec3(.135,.31,.12);\n    vec3 mid=vec3(.205,.42,.17);\n    vec3 soft=vec3(.295,.54,.23);\n    vec3 shade=mix(dark,base,smoothstep(.08,.52,layout));\n    shade=mix(shade,mid,smoothstep(.42,.78,layout));\n    shade=mix(shade,soft,smoothstep(.78,.97,layout)*.55);\n    float brush=abs(sin(uv.x*7.+uv.y*3.+medium*2.4));\n    shade+=vec3(.03,.045,.018)*smoothstep(.76,.96,brush)*.18;\n    shade-=vec3(.018,.014,.008)*fine*.035;\n    float sun=.84+.16*d+.06*d2;\n    return shade*sun;\n  }\n  vec2 drift=vec2(\n    noise2(uv*.045+vec2(8.7,-4.3))-.5,\n    noise2(uv*.045+vec2(-6.2,11.5))-.5\n  );\n  uv += drift*2.4;\n  float broad=noise2(uv*.065);\n  float broad2=noise2(uv*.14+vec2(22.4,-7.6));\n  float medium=noise2(uv*.42+vec2(-14.2,9.3));\n  float fine=noise2(uv*2.4+vec2(4.3,17.9));\n  float grain=noise2(uv*8.8+vec2(-8.6,5.4));\n  float brushA=pow(abs(sin(uv.x*7.0+uv.y*3.0+medium*2.4)),8.0)*.35;\n  float brushB=pow(abs(sin(uv.x*3.6-uv.y*6.4+fine*1.8)),10.0)*.18;\n  float brush=clamp(brushA+brushB,0.,1.);\n  float layout=clamp(broad*.46+broad2*.28+medium*.18+fine*.08,0.,1.);\n  vec3 dark=vec3(.075,.18,.08);\n  vec3 base=vec3(.135,.31,.12);\n  vec3 mid=vec3(.205,.42,.17);\n  vec3 soft=vec3(.295,.54,.23);\n  vec3 shade=mix(dark,base,smoothstep(.08,.52,layout));\n  shade=mix(shade,mid,smoothstep(.42,.78,layout));\n  shade=mix(shade,soft,smoothstep(.78,.97,layout)*.55);\n  shade += vec3(.030,.045,.018)*brush;\n  float speck=pow(grain,2.6)*.06;\n  shade -= vec3(.018,.014,.008)*speck;\n  float wear=smoothstep(.70,.95,noise2(uv*.18+vec2(30.0,-18.0)))*.10;\n  shade=mix(shade,shade*vec3(.96,.94,.88)+vec3(.01,.01,.005),wear);\n  float sheen=pow(max(dot(normalize(reflect(-L,N)),V),0.0),6.0)*.05;\n  float sun=.84+.16*d+.06*d2;\n  return shade*sun + vec3(.03,.045,.02)*sheen;\n}\n\nvoid main(){\nvec3 N=normalize(vNormal);vec3 L=normalize(vec3(-.42,.95,.56));vec3 L2=normalize(vec3(.7,.8,-.4));\nfloat d=max(dot(N,L),0.0), d2=max(dot(N,L2),0.0);\nfloat mvSh=mix(1.0,mvShadow(N,L),1.0-.55*uEvening); d*=mvSh; d2*=mix(1.0,mvSh,.30);\nvec3 V=normalize(uCamera-vPos), H=normalize(L+V);\nfloat spec=pow(max(dot(N,H),0.0),29.0)*mvSh;\nfloat fres=pow(1.0-max(dot(N,V),0.0),2.0);\nfloat shine=vData.x, kind=vData.z;\nif(((kind>4.5&&kind<6.5)||(kind>8.5&&kind<10.5)) && vTankFill<.018) discard;\nvec3 c=vColor*(0.36+0.55*d+0.22*d2)+vec3(.65,.86,1.0)*spec*.35;\nfloat outAlpha=vData.w;\nif(kind>.5&&kind<1.5){\n\n  float travel=vData.y-uTime*2.05*uAnimate;\n  float circumference=atan(N.z,N.y+.001);\n  float broad=waterNoise(vec2(travel*.45,circumference*.72+sin(travel*.28)));\n  float eddy=waterNoise(vec2(travel*1.32+broad*1.4,circumference*1.53-uTime*.20*uAnimate));\n  float micro=waterNoise(vec2(travel*3.9+eddy*2.0,circumference*2.6+broad));\n  float pigment=clamp(.16+.70*eddy+.24*micro,0.,1.);\n  vec3 deep=vec3(.008,.105,.35);\n  vec3 blue=vec3(.014,.36,.76);\n  vec3 highlight=vec3(.24,.72,.97);\n  c=mix(deep,blue,pigment);\n  c+=highlight*pow(smoothstep(.56,.93,micro+eddy*.13),2.2)*.30;\n  c+=vec3(.23,.61,.93)*pow(smoothstep(.59,.83,broad),3.0)*.18;\n  c+=vec3(.57,.83,1.)*(pow(max(dot(N,H),0.),33.)*.30+fres*.20);\n} else if(kind>8.5&&kind<9.5){\n\n  vec2 impact=vColor.xy;\n  float rr=length(vPos.xz-impact);\n  float t=uTime*uAnimate;\n  float crest=sin(rr*18.-t*4.4);\n  float crest2=sin(rr*31.-t*6.2+1.3);\n  float energy=exp(-rr*2.5)*smoothstep(.025,.22,vTankFill);\n  float churn=waterNoise(vPos.xz*3.0+vec2(t*.37,-t*.31));\n  c=mix(vec3(.012,.22,.57),vec3(.045,.45,.83),.35+.47*churn);\n  c+=vec3(.12,.35,.50)*max(0.,crest)*energy;\n  c+=vec3(.52,.84,.96)*pow(max(0.,crest2),6.)*energy*.30;\n  float foam=exp(-rr*rr*13.)*(.3+.7*waterNoise(vPos.xz*14.+vec2(t*.9,-t*.8)));\n  c=mix(c,vec3(.77,.93,1.),clamp(foam*.49,0.,.50));\n  c+=vec3(.25,.47,.65)*(spec*.42+fres*.18);\n} else if(kind>9.5&&kind<10.5){\n\n  float rr=length(vPos.xz-vColor.xy);\n  float fade=smoothstep(.02,.13,rr)*(1.0-smoothstep(.60,.80,rr));\n  float flicker=.76+.24*sin(uTime*3.1*uAnimate+rr*29.0);\n  c=vec3(.39,.78,.96)*(.68+.24*d+spec*.34)*flicker;\n  outAlpha*=fade*smoothstep(.02,.18,vTankFill);\n} else if((kind>1.5&&kind<2.5)||(kind>4.5&&kind<6.5)){\n  vec2 uv=vPos.xz;\n  float t=uTime*uAnimate;\n  float wave=waterNoise(uv*1.5+vec2(t*.41,-t*.29));\n  float caust=waterNoise(vec2(vPos.y*2.9-t*.85,vPos.x+vPos.z*.64));\n  c=mix(vec3(.005,.095,.34),vec3(.018,.35,.74),clamp(.10+.72*wave+.30*caust,0.,1.));\n  c+=vec3(.30,.68,.92)*pow(max(0.,caust-.51)*2.,2.)*.22;\n  c+=vec3(.12,.29,.48)*fres*.24;\n  if(kind>5.5){\n    c+=vec3(.23,.60,.87)*(.12+wave*.23);\n    c+=vec3(.61,.87,1.)*pow(max(dot(N,L),0.),3.)*.12;\n  }\n} else if(kind>2.5&&kind<3.5){\n  float pulse=.88+.12*sin(uTime*1.7*uAnimate+vPos.x*.55+vPos.z*.35);\n  c=vColor*(1.22+.58*pulse)+vec3(.08,.23,.10)*pulse;\n} else if(kind>3.5&&kind<4.5){\n\n  c=vec3(.12,.45,.56)*(.53+.18*d)+vec3(.55,.88,.98)*(fres*.92+spec*.45);\n  c+=vec3(.08,.36,.44)*.15;\n} else if(kind>6.5&&kind<7.5){\n  vec2 turfUV=vPos.xz*.073;\n  vec3 lawn=texture2D(uTurfTex,turfUV).rgb;\n  c=lawn*(.80+.18*d+.08*d2);\n} else if(kind>7.5&&kind<8.5){\n\n  float rim=pow(1.0-max(dot(N,V),0.0),2.3);\n  c=vColor*(.77+.19*d+.08*d2)+vec3(.15,.15,.16)*rim+.12*spec*vec3(1.0);\n} else if(kind>10.5&&kind<11.5){\n  vec2 pos=vPos.xz;\n  float radius=length(pos);\n  float woodland=smoothstep(68.0,104.0,radius);\n  vec3 closeGrass=texture2D(uTurfTex,pos*.073).rgb;\n  vec3 grassWide=texture2D(uTurfTex,pos*.024+vec2(.21,.57)).rgb;\n  vec3 grass= mix(closeGrass,grassWide,smoothstep(27.0,100.0,radius)*.45);\n  vec3 canopy=texture2D(uForestTex,pos*.018).rgb;\n  vec3 canopyLarge=texture2D(uForestTex,pos*.0065+vec2(.26,.14)).rgb;\n  float macro=noise2(pos*.018+vec2(17.1,8.2));\n  float medium=noise2(pos*.072+vec2(-6.8,4.3));\n  float slope=1.0-clamp(N.y,0.0,1.0);\n  vec3 hillside=mix(canopy,canopyLarge,.19);\n  hillside*=.87+.22*macro+.10*medium;\n  float sparse=smoothstep(.58,.93,macro+medium*.12)*.19;\n  hillside=mix(hillside,vec3(.23,.30,.16),sparse);\n  vec3 rock=vec3(.33,.36,.30)*(.80+.23*medium);\n  float rockCover=smoothstep(.43,.82,slope+.15*medium)*.27;\n  hillside=mix(hillside,rock,rockCover);\n  c=mix(grass,hillside,woodland);\n  c*=.65+.34*d+.07*d2;\n  float grassGlint=pow(max(dot(normalize(reflect(-L,N)),V),0.0),8.0)*.018;\n  c+=vec3(.018,.028,.012)*grassGlint;\n} else if(kind>11.5&&kind<12.5){\n  float cycle=mod(uTime+vData.y*3.35,8.4);\n  float lit=1.0-smoothstep(4.0,4.38,cycle)+smoothstep(8.05,8.4,cycle);\n  float glass=0.975+0.025*sin(uTime*3.2+vPos.x*7.8);\n  c=mix(vec3(.027,.054,.071),vec3(1.0,.78,.38)*glass,lit);\n  c+=vec3(.23,.16,.035)*lit;\n} else if(kind>12.5&&kind<13.5){\n  float cycle=mod(uTime+vData.y*3.35,8.4);\n  float lit=1.0-smoothstep(4.0,4.38,cycle)+smoothstep(8.05,8.4,cycle);\n  c=vec3(1.0,.65,.20);\n  outAlpha*=lit;\n}\nif((kind>3.5&&kind<4.5)||(kind>7.5&&kind<8.5)) c+=vec3(.08,.12,.14)*fres*(.60+.40*d);\n{\n  vec3 R=reflect(-V,N);\n  if(kind>3.5&&kind<4.5){\n    c=mix(c,mvSky(R)*.92,clamp(.04+fres*.30,0.0,.26)*(.35+.65*max(N.y,0.0)+.35*(1.0-abs(N.y))*(1.0-fres)));\n    c+=vec3(1.0,.97,.90)*pow(max(dot(N,H),0.0),220.0)*1.15*mvSh;\n  } else if((kind>1.5&&kind<2.5)||(kind>4.5&&kind<6.5)){\n    c=mix(c,mvSky(R)*.80,clamp(fres*.30,0.0,.24));\n    c+=vec3(1.0,.97,.90)*pow(max(dot(N,H),0.0),160.0)*.65*mvSh;\n  } else if(kind>7.5&&kind<8.5){\n    c+=mvSky(R)*fres*.10;\n  }\n  if(!((kind>.5&&kind<2.5)||(kind>2.5&&kind<3.5)||(kind>4.5&&kind<6.5)||(kind>8.5&&kind<10.5)||kind>11.5)) c*=1.0-(1.0-mvSh)*.34;\n  if(uAOOn>.5 && N.y>.55 && vPos.y<.62 && (kind<.5||(kind>6.5&&kind<7.5)||(kind>10.5&&kind<11.5))) c*=mvContactAO();\n}\nc*=mix(vec3(1.0),vec3(.66,.72,.83),uEvening);\nif(kind>14.5&&kind<15.5){\n  c=vec3(.028,.047,.033);\n}\nif(kind>13.5&&kind<14.5){\n  c=vec3(.98,.77,.46);\n  outAlpha=min(1.0,outAlpha*(1.0+2.6*uEvening));\n}\nc+=vColor*shine*.28*(1.0+uEvening*.82);\nfloat dist=length(vPos-uCamera);\nc=mix(c,mix(vec3(.37,.46,.48),vec3(.21,.27,.32),uEvening),clamp((dist-105.0)/155.0,0.,.10));\nc=mix(c,mix(vec3(.34,.44,.40),vec3(.17,.22,.26),uEvening),smoothstep(150.0,330.0,dist)*.62);\ngl_FragColor=vec4(mvGrade(c),outAlpha);\n}`;
  const fallbackVert = `\nattribute vec3 aPos; attribute vec3 aNormal; attribute vec3 aColor; attribute vec4 aData;\nuniform mat4 uVP; uniform float uTime; uniform float uLevels[36];\nvarying vec3 vNormal; varying vec3 vColor; varying vec3 vPos; varying vec4 vData;\nfloat getLevel(float id){\n  if(id < 0.5) return uLevels[0];\n  if(id < 1.5) return uLevels[1];\n  if(id < 2.5) return uLevels[2];\n  if(id < 3.5) return uLevels[3];\n  if(id < 4.5) return uLevels[4];\n  if(id < 5.5) return uLevels[5];\n  if(id < 6.5) return uLevels[6];\n  if(id < 7.5) return uLevels[7];\n  if(id < 8.5) return uLevels[8];\n  if(id < 9.5) return uLevels[9];\n  if(id < 10.5) return uLevels[10];\n  if(id < 11.5) return uLevels[11];\n  if(id < 12.5) return uLevels[12];\n  if(id < 13.5) return uLevels[13];\n  if(id < 14.5) return uLevels[14];\n  if(id < 15.5) return uLevels[15];\n  if(id < 16.5) return uLevels[16];\n  if(id < 17.5) return uLevels[17];\n  if(id < 18.5) return uLevels[18];\n  if(id < 19.5) return uLevels[19];\n  if(id < 20.5) return uLevels[20];\n  if(id < 21.5) return uLevels[21];\n  if(id < 22.5) return uLevels[22];\n  if(id < 23.5) return uLevels[23];\n  if(id < 24.5) return uLevels[24];\n  if(id < 25.5) return uLevels[25];\n  if(id < 26.5) return uLevels[26];\n  if(id < 27.5) return uLevels[27];\n  if(id < 28.5) return uLevels[28];\n  if(id < 29.5) return uLevels[29];\n  if(id < 30.5) return uLevels[30];\n  if(id < 31.5) return uLevels[31];\n  if(id < 32.5) return uLevels[32];\n  if(id < 33.5) return uLevels[33];\n  if(id < 34.5) return uLevels[34];\n  return uLevels[35];\n}\nvoid main(){\n  vec3 p=aPos;\n  if(aData.z>4.5 && aData.z<6.5){\n\n    float level=clamp(getLevel(aData.y),.0,.94);\n    p.y=.52+(p.y-.52)*level;\n    if(aData.z>5.5){\n      p.y+=(.025*sin(aPos.x*3.0+uTime*.87)+.019*sin(aPos.z*3.9-uTime*.72))*level;\n    }\n  }\n  vPos=p;vNormal=aNormal;vColor=aColor;vData=aData;gl_Position=uVP*vec4(p,1.0);\n}`;
  const fallbackFrag = `\nprecision highp float;\nvarying vec3 vNormal; varying vec3 vColor; varying vec3 vPos; varying vec4 vData;\nuniform vec3 uCamera; uniform float uTime; uniform float uAnimate; uniform float uTerrainDetail; uniform float uEvening;\nfloat hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}\nfloat noise2(vec2 p){\n  vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);\n  return mix(mix(hash2(i),hash2(i+vec2(1.,0.)),f.x),\n    mix(hash2(i+vec2(0.,1.)),hash2(i+vec2(1.,1.)),f.x),f.y);\n}\nfloat waterNoise(vec2 p){\n  float a=0.0;\n  a+=0.54*noise2(p);\n  a+=0.29*noise2(p*2.04+vec2(11.1,-7.2));\n  a+=0.17*noise2(p*4.15+vec2(-3.2,8.4));\n  return a;\n}\nvec3 mvUnifiedGrass(vec2 uv, vec3 N, vec3 L, vec3 V, float d, float d2){\n  if (uTerrainDetail < .5) {\n    float broad=noise2(uv*.065);\n    float medium=noise2(uv*.42+vec2(-14.2,9.3));\n    float fine=noise2(uv*2.4+vec2(4.3,17.9));\n    float layout=clamp(broad*.56+medium*.33+fine*.11,0.,1.);\n    vec3 dark=vec3(.075,.18,.08);\n    vec3 base=vec3(.135,.31,.12);\n    vec3 mid=vec3(.205,.42,.17);\n    vec3 soft=vec3(.295,.54,.23);\n    vec3 shade=mix(dark,base,smoothstep(.08,.52,layout));\n    shade=mix(shade,mid,smoothstep(.42,.78,layout));\n    shade=mix(shade,soft,smoothstep(.78,.97,layout)*.55);\n    float brush=abs(sin(uv.x*7.+uv.y*3.+medium*2.4));\n    shade+=vec3(.03,.045,.018)*smoothstep(.76,.96,brush)*.18;\n    shade-=vec3(.018,.014,.008)*fine*.035;\n    float sun=.84+.16*d+.06*d2;\n    return shade*sun;\n  }\n  vec2 drift=vec2(\n    noise2(uv*.045+vec2(8.7,-4.3))-.5,\n    noise2(uv*.045+vec2(-6.2,11.5))-.5\n  );\n  uv += drift*2.4;\n  float broad=noise2(uv*.065);\n  float broad2=noise2(uv*.14+vec2(22.4,-7.6));\n  float medium=noise2(uv*.42+vec2(-14.2,9.3));\n  float fine=noise2(uv*2.4+vec2(4.3,17.9));\n  float grain=noise2(uv*8.8+vec2(-8.6,5.4));\n  float brushA=pow(abs(sin(uv.x*7.0+uv.y*3.0+medium*2.4)),8.0)*.35;\n  float brushB=pow(abs(sin(uv.x*3.6-uv.y*6.4+fine*1.8)),10.0)*.18;\n  float brush=clamp(brushA+brushB,0.,1.);\n  float layout=clamp(broad*.46+broad2*.28+medium*.18+fine*.08,0.,1.);\n  vec3 dark=vec3(.075,.18,.08);\n  vec3 base=vec3(.135,.31,.12);\n  vec3 mid=vec3(.205,.42,.17);\n  vec3 soft=vec3(.295,.54,.23);\n  vec3 shade=mix(dark,base,smoothstep(.08,.52,layout));\n  shade=mix(shade,mid,smoothstep(.42,.78,layout));\n  shade=mix(shade,soft,smoothstep(.78,.97,layout)*.55);\n  shade += vec3(.030,.045,.018)*brush;\n  float speck=pow(grain,2.6)*.06;\n  shade -= vec3(.018,.014,.008)*speck;\n  float wear=smoothstep(.70,.95,noise2(uv*.18+vec2(30.0,-18.0)))*.10;\n  shade=mix(shade,shade*vec3(.96,.94,.88)+vec3(.01,.01,.005),wear);\n  float sheen=pow(max(dot(normalize(reflect(-L,N)),V),0.0),6.0)*.05;\n  float sun=.84+.16*d+.06*d2;\n  return shade*sun + vec3(.03,.045,.02)*sheen;\n}\n\nvoid main(){\nvec3 N=normalize(vNormal);vec3 L=normalize(vec3(-.42,.95,.56));vec3 L2=normalize(vec3(.7,.8,-.4));\nfloat d=max(dot(N,L),0.0), d2=max(dot(N,L2),0.0);\nvec3 V=normalize(uCamera-vPos), H=normalize(L+V);\nfloat spec=pow(max(dot(N,H),0.0),29.0);\nfloat fres=pow(1.0-max(dot(N,V),0.0),2.0);\nfloat shine=vData.x, kind=vData.z;\nfloat outAlpha=vData.w;\nvec3 c=vColor*(0.36+0.55*d+0.22*d2)+vec3(.65,.86,1.0)*spec*.35;\nif(kind>.5&&kind<1.5){\n\n  float s=vData.y;\n  float circumference=atan(N.z,N.y+.0001);\n  float travel=s-uTime*2.25*uAnimate;\n  float drift=waterNoise(vec2(travel*.58,circumference*.75+sin(travel*.21)));\n  float eddy=waterNoise(vec2(travel*1.30+drift*2.2,circumference*1.3-uTime*.26*uAnimate));\n  float fine=waterNoise(vec2(travel*3.55+eddy*1.6,circumference*2.0+drift*.8));\n  float luma=clamp(.18+eddy*.83+fine*.25,0.,1.);\n  vec3 deep=vec3(.012,.16,.41), aqua=vec3(.018,.43,.79), glassy=vec3(.45,.79,1.0);\n  c=mix(deep,aqua,luma);\n  c+=glassy*pow(smoothstep(.52,.91,fine+eddy*.17),2.4)*.44;\n  c+=vec3(.34,.83,.98)*pow(smoothstep(.56,.83,drift),3.)*.21;\n  float sheen=pow(max(dot(N,H),0.0),21.0);\n  c+=vec3(.68,.94,1.)*(sheen*.27+fres*.22);\n} else if((kind>1.5&&kind<2.5)||(kind>4.5&&kind<6.5)){\n\n  vec2 p=vPos.xz;\n  float wave=waterNoise(p*1.6+vec2(uTime*.65,-uTime*.42)*uAnimate);\n  float caust=waterNoise(vec2(vPos.y*3.0-uTime*1.4*uAnimate,vPos.x+vPos.z*.7));\n  c=mix(vec3(.008,.14,.38),vec3(.023,.46,.81),clamp(.22+.9*wave+.35*caust,0.,1.));\n  c+=vec3(.45,.95,1.)*pow(max(0.,caust-.48)*2.0,2.)*.35;\n  c+=vec3(.33,.74,.94)*fres*.18;\n  if(kind>5.5){c+=vec3(.21,.57,.89)*(.28+wave*.23);c+=vec3(.64,.98,1.0)*pow(max(dot(N,L),0.0),3.0)*.20;}\n} else if(kind>2.5&&kind<3.5){\n  float pulse=.88+.12*sin(uTime*1.7*uAnimate+vPos.x*.55+vPos.z*.35);\n  c=vColor*(1.22+.58*pulse)+vec3(.08,.23,.10)*pulse;\n} else if(kind>3.5&&kind<4.5){\n\n  c=vec3(.12,.45,.56)*(.53+.18*d)+vec3(.55,.88,.98)*(fres*.92+spec*.45);\n  c+=vec3(.08,.36,.44)*.15;\n} else if(kind>6.5&&kind<7.5){\n  c=mvUnifiedGrass(vPos.xz,N,L,V,d,d2);\n} else if(kind>7.5&&kind<8.5){\n\n  float rim=pow(1.0-max(dot(N,V),0.0),2.3);\n  c=vColor*(.77+.19*d+.08*d2)+vec3(.15,.15,.16)*rim+.12*spec*vec3(1.0);\n} else if(kind>10.5&&kind<11.5){\n  vec2 pos=vPos.xz;\n  float wooded=smoothstep(68.0,104.0,length(pos));\n  vec3 meadow=mvUnifiedGrass(pos,N,L,V,d,d2);\n  float shade=noise2(pos*.063+vec2(3.8,6.4));\n  float leaves=noise2(pos*.21+vec2(11.2,-9.5));\n  vec3 canopy=mix(vec3(.11,.24,.095),vec3(.21,.39,.15),shade*.65+leaves*.35);\n  c=mix(meadow,canopy*(.68+.34*d+.08*d2),wooded);\n} else if(kind>11.5&&kind<12.5){\n  float cycle=mod(uTime+vData.y*3.35,8.4);\n  float lit=1.0-smoothstep(4.0,4.38,cycle)+smoothstep(8.05,8.4,cycle);\n  float glass=0.975+0.025*sin(uTime*3.2+vPos.x*7.8);\n  c=mix(vec3(.027,.054,.071),vec3(1.0,.78,.38)*glass,lit);\n  c+=vec3(.23,.16,.035)*lit;\n} else if(kind>12.5&&kind<13.5){\n  float cycle=mod(uTime+vData.y*3.35,8.4);\n  float lit=1.0-smoothstep(4.0,4.38,cycle)+smoothstep(8.05,8.4,cycle);\n  c=vec3(1.0,.65,.20);\n  outAlpha*=lit;\n}\nif((kind>3.5&&kind<4.5)||(kind>7.5&&kind<8.5)) c+=vec3(.08,.12,.14)*fres*(.60+.40*d);\nc*=mix(vec3(1.0),vec3(.66,.72,.83),uEvening);\nif(kind>14.5&&kind<15.5){\n  c=vec3(.028,.047,.033);\n}\nif(kind>13.5&&kind<14.5){\n  c=vec3(.98,.77,.46);\n  outAlpha=min(1.0,outAlpha*(1.0+2.6*uEvening));\n}\nc+=vColor*shine*.28*(1.0+uEvening*.82);\nfloat dist=length(vPos-uCamera);\nc=mix(c,mix(vec3(.37,.46,.48),vec3(.21,.27,.32),uEvening),clamp((dist-105.0)/155.0,0.,.10));\nc=mix(c,mix(vec3(.34,.44,.40),vec3(.17,.22,.26),uEvening),smoothstep(150.0,330.0,dist)*.62);\ngl_FragColor=vec4(c,outAlpha);\n}`;
  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
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
      notice.style.display = 'block';
      document.documentElement.classList.add('mv-scene-ready');
      return;
    }
  }
  gl.useProgram(program);
  const loc = {
    pos: gl.getAttribLocation(program, 'aPos'),
    normal: gl.getAttribLocation(program, 'aNormal'),
    color: gl.getAttribLocation(program, 'aColor'),
    data: gl.getAttribLocation(program, 'aData'),
    vp: gl.getUniformLocation(program, 'uVP'),
    cam: gl.getUniformLocation(program, 'uCamera'),
    time: gl.getUniformLocation(program, 'uTime'),
    levels: gl.getUniformLocation(program, 'uLevels[0]'),
    anim: gl.getUniformLocation(program, 'uAnimate'),
    terrainDetail: gl.getUniformLocation(program, 'uTerrainDetail'),
    turf: gl.getUniformLocation(program, 'uTurfTex'),
    forest: gl.getUniformLocation(program, 'uForestTex'),
    evening: gl.getUniformLocation(program, 'uEvening')
  };
  function terrainRand(seed) {
    let value = seed >>> 0;
    return () => {
      value = Math.imul(value, 1664525) + 1013904223 >>> 0;
      return value / 4294967296;
    };
  }
  function terrainTextureResolution() {
    const textureLimit = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const deviceMemory = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : 6;
    const viewportPixels = Math.max(1, canvas.clientWidth * canvas.clientHeight);
    const terrainTextureScale = textureLimit >= 2048 && deviceMemory >= 8 && viewportPixels >= 3e6 ? 4 : textureLimit >= 1024 && deviceMemory >= 4 ? 2 : 1;
    return 512 * terrainTextureScale;
  }
  const terrainResolution = terrainTextureResolution();
  function terrainTextureCanvas(type) {
    const size = 512;
    const terrainTextureScale = terrainResolution / size;
    const cv = document.createElement('canvas');
    cv.width = size * terrainTextureScale;
    cv.height = size * terrainTextureScale;
    const ctx = cv.getContext('2d', {
      alpha: false
    });
    ctx.scale(terrainTextureScale, terrainTextureScale);
    const rand = terrainRand(type === 'turf' ? 380144 : 709123);
    if (type === 'turf') {
      ctx.fillStyle = '#456c33';
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 3200; i++) {
        const x = rand() * size, y = rand() * size;
        const r = 2 + rand() * 21;
        ctx.fillStyle = [ 'rgba(29,64,24,.13)', 'rgba(109,137,61,.11)', 'rgba(80,119,46,.16)', 'rgba(35,74,27,.10)' ][Math.floor(rand() * 4)];
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * (.35 + rand() * .5), rand() * 6.283, 0, 6.283);
        ctx.fill();
      }
      const colors = [ '#355b28', '#6b9148', '#749b4b', '#294e22', '#89a453', '#4e752f', '#587d39', '#a2a36a' ];
      ctx.lineCap = 'round';
      for (let i = 0; i < 37e3; i++) {
        const x = rand() * size, y = rand() * size;
        const len = 1.7 + rand() * 6;
        const angle = -.9 + rand() * 1.8;
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
        const dark = [ '#142e19', '#20391d', '#294925', '#183923' ][Math.floor(rand() * 4)];
        const crown = [ '#2c5126', '#3e652d', '#355d2c', '#476d36', '#426936', '#254925', '#587942' ][Math.floor(rand() * 7)];
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.ellipse(x + radius * .25, y + radius * .32, radius * 1.2, radius * .8, rand() * 3.14, 0, 6.283);
        ctx.fill();
        ctx.fillStyle = crown;
        ctx.beginPath();
        ctx.ellipse(x, y, radius * (.68 + rand() * .47), radius * (.66 + rand() * .42), rand() * 3.14, 0, 6.283);
        ctx.fill();
        ctx.fillStyle = 'rgba(132,170,87,.17)';
        ctx.beginPath();
        ctx.ellipse(x - radius * .24, y - radius * .31, radius * .45, radius * .33, 0, 0, 6.283);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(12,38,17,.24)';
      for (let i = 0; i < 3e3; i++) {
        const x = rand() * size, y = rand() * size;
        ctx.fillRect(x, y, 1 + rand() * 3, 1 + rand() * 3);
      }
    }
    return cv;
  }
  const terrainAnisotropy = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') || gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
  function makeTerrainTexture(type, unit) {
    const tex = gl.createTexture();
    gl.activeTexture(unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (terrainAnisotropy) gl.texParameterf(gl.TEXTURE_2D, terrainAnisotropy.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(terrainAnisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    const forest = type === 'forest';
    const baseColor = forest ? [44, 76, 42, 255] : [82, 112, 60, 255];
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(baseColor));
    gl.generateMipmap(gl.TEXTURE_2D);

    function upload(source) {
      if (gl.isContextLost()) return;
      const previousUnit = gl.getParameter(gl.ACTIVE_TEXTURE);
      gl.activeTexture(unit);
      const previousTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
      const previousFlip = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
      const previousAlpha = gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        gl.generateMipmap(gl.TEXTURE_2D);
      } finally {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, previousFlip);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, previousAlpha);
        gl.bindTexture(gl.TEXTURE_2D, previousTexture);
        gl.activeTexture(previousUnit);
      }
    }

    const image = new Image();
    image.decoding = 'async';
    image.onload = () => upload(image);
    image.onerror = () => {
      if (!gl.isContextLost()) upload(terrainTextureCanvas(type));
    };
    const material = forest ? 'bosque' : 'pasto';
    image.src = '/Telemetria/imagenes/' + material + '_3d_' + terrainResolution + '.webp';
    return tex;
  }
  const turfTexture = makeTerrainTexture('turf', gl.TEXTURE1);
  const forestTexture = makeTerrainTexture('forest', gl.TEXTURE2);
  gl.useProgram(program);
  if (loc.turf !== null) gl.uniform1i(loc.turf, 1);
  if (loc.forest !== null) gl.uniform1i(loc.forest, 2);
  const mvLoc = {
    lightVP: gl.getUniformLocation(program, 'uLightVP'),
    shadowMap: gl.getUniformLocation(program, 'uShadowMap'),
    shadowOn: gl.getUniformLocation(program, 'uShadowOn'),
    shadowTexel: gl.getUniformLocation(program, 'uShadowTexel'),
    tankAO: gl.getUniformLocation(program, 'uTankAO[0]'),
    aoOn: gl.getUniformLocation(program, 'uAOOn'),
    skyRefl: gl.getUniformLocation(program, 'uSkyRefl'),
    skyReflReady: gl.getUniformLocation(program, 'uSkyReflReady'),
    grade: gl.getUniformLocation(program, 'uProGrade')
  };
  if (mvLoc.shadowMap) gl.uniform1i(mvLoc.shadowMap, 3);
  if (mvLoc.skyRefl) gl.uniform1i(mvLoc.skyRefl, 4);
  if (mvLoc.grade) gl.uniform1f(mvLoc.grade, 1);
  let mvShadowDirty = true, mvShadowNext = 0, mvShadowTopView = null, mvAOReady = true;
  const mvShadow = (() => {
    if (!enhancedWaterShader || !mvLoc.lightVP || /[?&]sombras=0/i.test(location.search)) return null;
    const isGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    const depthExt = isGL2 ? null : gl.getExtension('WEBGL_depth_texture');
    if (!isGL2 && !depthExt) return null;
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const size = Math.min(maxTex, 4096);
    try {
      const depth = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, depth);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (isGL2) gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null); else gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
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
      gl.attachShader(sp, shader(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec4 vData;varying float vTankFill;void main(){float k=vData.z;if(vData.w<.10||(k>8.5&&k<10.5)||(k>.5&&k<1.5)||(k>2.5&&k<3.5)||(k>11.5&&k<13.5))discard;if(((k>4.5&&k<6.5))&&vTankFill<.018)discard;gl_FragColor=vec4(1.0);}'));
      for (const [name, index] of [ [ 'aPos', loc.pos ], [ 'aNormal', loc.normal ], [ 'aColor', loc.color ], [ 'aData', loc.data ] ]) if (index >= 0) gl.bindAttribLocation(sp, index, name);
      gl.linkProgram(sp);
      if (!gl.getProgramParameter(sp, gl.LINK_STATUS)) return null;
      const Ll = Math.hypot(-.42, .95, .56), L = [ -.42 / Ll, .95 / Ll, .56 / Ll ], center = [ 0, 0, 0 ], half = 58;
      const eye = [ center[0] + L[0] * 160, center[1] + L[1] * 160, center[2] + L[2] * 160 ];
      const ortho = [ 1 / half, 0, 0, 0, 0, 1 / half, 0, 0, 0, 0, -2 / 319, 0, 0, 0, -321 / 319, 1 ];
      return {
        fbo: fbo,
        depth: depth,
        size: size,
        lightVP: null,
        makeLightVP: () => new Float32Array(matMul(ortho, lookAt(eye, center, [ 0, 1, 0 ]))),
        program: sp,
        vp: gl.getUniformLocation(sp, 'uVP'),
        time: gl.getUniformLocation(sp, 'uTime'),
        levels: gl.getUniformLocation(sp, 'uLevels[0]'),
        anim: gl.getUniformLocation(sp, 'uAnimate'),
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
    if (top !== mvShadowTopView) {
      mvShadowTopView = top;
      mvShadowDirty = true;
    }
    let levelKey = 0;
    for (let i = 0; i < levelsUniform.length; i++) levelKey += levelsUniform[i] * (i + 1);
    if (Math.abs(levelKey - mvShadowNext) > 5e-4) {
      mvShadowNext = levelKey;
      mvShadowDirty = true;
    }
    if (!mvShadowDirty) return;
    mvShadowDirty = false;
    gl.bindFramebuffer(gl.FRAMEBUFFER, mvShadow.fbo);
    gl.viewport(0, 0, mvShadow.size, mvShadow.size);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.colorMask(false, false, false, false);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.6, 3);
    gl.useProgram(mvShadow.program);
    gl.uniformMatrix4fv(mvShadow.vp, false, mvShadow.lightVP);
    gl.uniformMatrix4fv(mvShadow.lvp, false, mvShadow.lightVP);
    gl.uniform1f(mvShadow.time, elapsed);
    gl.uniform1fv(mvShadow.levels, levelsUniform);
    gl.uniform1f(mvShadow.anim, 0);
    drawShadowCasters();
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.colorMask(true, true, true, true);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  function mvBindProUniforms() {
    if (!enhancedWaterShader) return;
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, mvShadow ? mvShadow.depth : null);
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, skyTexture);
    gl.activeTexture(gl.TEXTURE0);
    if (mvLoc.shadowOn) gl.uniform1f(mvLoc.shadowOn, mvShadow ? 1 : 0);
    if (mvShadow && mvShadow.lightVP) {
      gl.uniformMatrix4fv(mvLoc.lightVP, false, mvShadow.lightVP);
      gl.uniform2f(mvLoc.shadowTexel, 1 / mvShadow.size, 1 / mvShadow.size);
    }
    if (mvLoc.skyReflReady) gl.uniform1f(mvLoc.skyReflReady, skyReady ? 1 : 0);
    if (!mvAOReady && mvLoc.tankAO && tankLabels.length) {
      const ao = new Float32Array(56);
      tankLabels.slice(0, 14).forEach((p, i) => {
        ao[i * 4] = p.x;
        ao[i * 4 + 1] = p.z;
        ao[i * 4 + 2] = (p.radius || 1) * 1.04;
      });
      gl.uniform4fv(mvLoc.tankAO, ao);
      gl.uniform1f(mvLoc.aoOn, 1);
      mvAOReady = true;
    }
  }
  gl.activeTexture(gl.TEXTURE0);
  const skyVertex = `\nattribute vec2 aSkyPosition;\nvarying vec2 vSkyNdc;\nvoid main(){vSkyNdc=aSkyPosition;gl_Position=vec4(aSkyPosition,1.0,1.0);}`;
  const skyFragment = `\n#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\nvarying vec2 vSkyNdc;\nuniform sampler2D uSkyMap;\nuniform vec3 uSkyForward;\nuniform vec3 uSkyRight;\nuniform vec3 uSkyUp;\nuniform float uSkyAspect;\nuniform float uSkySeconds;\nuniform float uSkyReady;\nuniform float uEvening;\nuniform float uSkyProcedural;\nfloat mvH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat mvN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mvH(i),mvH(i+vec2(1,0)),f.x),mix(mvH(i+vec2(0,1)),mvH(i+vec2(1,1)),f.x),f.y);}\nfloat mvFbm(vec2 p){float a=.5,s=0.0;for(int i=0;i<5;i++){s+=a*mvN(p);p=p*2.03+vec2(17.3,-9.1);a*=.5;}return s;}\nvec3 mvProceduralSky(vec3 d,float t,float ev){\n  vec3 sunDir=normalize(vec3(-.42,.95,.56));\n  vec3 sunEve=normalize(vec3(-.80,.10,.58));\n  vec3 S=normalize(mix(sunDir,sunEve,ev));\n  float y=max(d.y,0.0);\n  float mu=max(dot(d,S),0.0);\n  vec3 zen=mix(vec3(.16,.40,.80),vec3(.10,.14,.30),ev);\n  vec3 hor=mix(vec3(.72,.83,.93),vec3(.95,.58,.36),ev);\n  vec3 sky=mix(hor,zen,pow(y,.48));\n  sky=mix(sky,hor*1.05,exp(-y*14.0)*.55);\n  sky+=mix(vec3(1.0,.93,.80),vec3(1.0,.55,.25),ev)*(pow(mu,6.0)*.22+pow(mu,48.0)*.35);\n  sky+=vec3(1.0,.96,.88)*smoothstep(.9994,.9998,mu)*3.0;\n  vec2 uv=d.xz/(y+.085)*.55+vec2(t*.010,t*.004);\n  float base=mvFbm(uv*1.15);\n  float detail=mvFbm(uv*3.4+vec2(base*1.6,-t*.006));\n  float cov=smoothstep(.50,.80,base*.78+detail*.32);\n  float shade=mvFbm(uv*1.15+S.xz*.18)-base;\n  vec3 lit=mix(vec3(1.0,.99,.97),vec3(1.0,.72,.50),ev);\n  vec3 dark=mix(vec3(.58,.64,.74),vec3(.36,.30,.40),ev);\n  vec3 cloud=mix(lit,dark,clamp(.45+shade*2.4+(1.0-detail)*.35,0.0,1.0));\n  cloud+=lit*pow(mu,10.0)*.25;\n  float fade=smoothstep(.0,.16,d.y);\n  sky=mix(sky,cloud,cov*fade*.92);\n  sky=mix(sky,hor*vec3(.94,.96,.98),exp(-max(d.y,0.0)*22.0)*.45);\n  if(d.y<0.0) sky=mix(hor*.86,vec3(.36,.42,.40),clamp(-d.y*6.0,0.0,1.0));\n  return sky;\n}\nvec3 mvFarGround(vec3 sky,vec3 d){float b=smoothstep(.006,-.03,d.y);vec3 g=mix(vec3(.34,.44,.40),vec3(.17,.29,.17),smoothstep(-.01,-.16,d.y));g=mix(g,g*vec3(.50,.58,.74),uEvening);return mix(sky,g,b);}\nvoid main(){\n  vec3 direction=normalize(uSkyForward+uSkyRight*(vSkyNdc.x*uSkyAspect*.404026)+uSkyUp*(vSkyNdc.y*.404026));\n  if(uSkyProcedural>.5){gl_FragColor=vec4(mvFarGround(mvProceduralSky(direction,uSkySeconds,uEvening),direction),1.0);return;}\n  float azimuth=atan(direction.z,direction.x);\n  float elevation=asin(clamp(direction.y,-1.0,1.0));\n  vec2 uv=vec2(fract(azimuth*.1591549431+uSkySeconds*.00120),clamp(.27+elevation*.68,.008,.992));\n  vec3 clearSky=mix(vec3(.76,.88,.95),vec3(.27,.56,.79),smoothstep(-.24,.82,direction.y));\n  vec3 photoSky=texture2D(uSkyMap,uv).rgb;\n  vec3 outputSky=mix(clearSky,photoSky,uSkyReady);\n  vec3 duskSky=mix(outputSky*vec3(.53,.62,.77),mix(vec3(.35,.40,.48),vec3(.18,.30,.46),smoothstep(-.15,.70,direction.y)),.26);\n  outputSky=mix(outputSky,duskSky,uEvening);\n  gl_FragColor=vec4(mvFarGround(outputSky,direction),1.0);\n}`;
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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ -1, -1, 3, -1, -1, 3 ]), gl.STATIC_DRAW);
    skyTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, skyTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([ 170, 211, 238, 255 ]));
    const skyImage = new Image;
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
        skyCanvas.getContext('2d', {
          alpha: false
        }).drawImage(skyImage, 0, 0, skyWidth, skyHeight);
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
    skyImage.onerror = () => {
      skyAssetSettled = true;
      console.warn('Cielo de Monterrey V no disponible');
    };
    skyImage.src = '/Telemetria/imagenes/cielo_monterrey_4k.jpg?v=90';
  } catch (skyError) {
    skyProgram = null;
    console.warn('Cielo dinámico no disponible:', skyError);
  }
  function renderSky(eye, target, seconds, aspect) {
    if (!skyProgram) return;
    const forward = norm(minus(target, eye));
    const right = norm(cross(forward, [ 0, 1, 0 ]));
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
  const colorCache = {};
  function rgb(h) {
    if (!colorCache[h]) {
      const hex = h.replace('#', '');
      colorCache[h] = [ parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255 ];
    }
    return colorCache[h];
  }
  let A = [ [], [], [] ];
  function vec(x, y, z) {
    return [ x, y, z ];
  }
  const plus = (a, b) => [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ];
  const minus = (a, b) => [ a[0] - b[0], a[1] - b[1], a[2] - b[2] ];
  const mul = (a, k) => [ a[0] * k, a[1] * k, a[2] * k ];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ];
  const norm = a => {
    const l = Math.hypot(...a) || 1;
    return mul(a, 1 / l);
  };

  function appendVertex(out, p, n, c, e = 0, s = 0, k = 0, a = 1) {
    const color = Array.isArray(c) ? c : rgb(c);
    out.push(p[0], p[1], p[2], n[0], n[1], n[2], color[0], color[1], color[2], e, s, k, a);
  }
  function tri(group, v1, n1, v2, n2, v3, n3, c, e = 0, s = 0, k = 0, a = 1) {
    const out = A[group];
    appendVertex(out, v1, n1, c, e, s, k, a);
    appendVertex(out, v2, n2, c, e, s, k, a);
    appendVertex(out, v3, n3, c, e, s, k, a);
  }
  function quad(g, a, b, c, d, n, col, emit = 0, kind = 0, alpha = 1) {
    tri(g, a, n, b, n, c, n, col, emit, 0, kind, alpha);
    tri(g, a, n, c, n, d, n, col, emit, 0, kind, alpha);
  }
  function box(cx, cy, cz, sx, sy, sz, col, g = 0, em = 0, alpha = 1) {
    const x = cx - sx / 2, X = cx + sx / 2, y = cy - sy / 2, Y = cy + sy / 2, z = cz - sz / 2, Z = cz + sz / 2;
    quad(g, [ x, Y, z ], [ X, Y, z ], [ X, Y, Z ], [ x, Y, Z ], [ 0, 1, 0 ], col, em, 0, alpha);
    quad(g, [ x, y, Z ], [ X, y, Z ], [ X, y, z ], [ x, y, z ], [ 0, -1, 0 ], col, em, 0, alpha);
    quad(g, [ x, y, Z ], [ X, y, Z ], [ X, Y, Z ], [ x, Y, Z ], [ 0, 0, 1 ], col, em, 0, alpha);
    quad(g, [ X, y, z ], [ x, y, z ], [ x, Y, z ], [ X, Y, z ], [ 0, 0, -1 ], col, em, 0, alpha);
    quad(g, [ X, y, Z ], [ X, y, z ], [ X, Y, z ], [ X, Y, Z ], [ 1, 0, 0 ], col, em, 0, alpha);
    quad(g, [ x, y, z ], [ x, y, Z ], [ x, Y, Z ], [ x, Y, z ], [ -1, 0, 0 ], col, em, 0, alpha);
  }
  function cylinder(cx, cy, cz, r, h, col, opt = {}) {
    const g = opt.g || 0, n = opt.seg || 24, start = opt.start || 0, end = opt.end === undefined ? Math.PI * 2 : opt.end, em = opt.em || 0, alpha = opt.alpha === undefined ? 1 : opt.alpha, k = opt.kind || 0;
    const steps = Math.max(3, Math.round(n * (end - start) / (Math.PI * 2)));
    const bottom = cy - h / 2, top = cy + h / 2, levelId = opt.levelId === undefined ? cy : opt.levelId;
    for (let i = 0; i < steps; i++) {
      const a = start + (end - start) * i / steps, b = start + (end - start) * (i + 1) / steps;
      const n1 = [ Math.cos(a), 0, Math.sin(a) ], n2 = [ Math.cos(b), 0, Math.sin(b) ];
      const p = [ cx + r * n1[0], bottom, cz + r * n1[2] ], q = [ cx + r * n2[0], bottom, cz + r * n2[2] ], P = [ p[0], top, p[2] ], Q = [ q[0], top, q[2] ];
      tri(g, p, n1, q, n2, Q, n2, col, em, levelId, k, alpha);
      tri(g, p, n1, Q, n2, P, n1, col, em, levelId, k, alpha);
      if (opt.caps !== false) {
        const up = [ 0, 1, 0 ], down = [ 0, -1, 0 ];
        tri(g, [ cx, top, cz ], up, P, up, Q, up, col, em, levelId, k, alpha);
        tri(g, [ cx, bottom, cz ], down, q, down, p, down, col, em, levelId, k, alpha);
      }
    }
  }
  function tube(points, r, col, opt = {}) {
    if (points.length < 2) return;
    const g = opt.g || 0, seg = opt.seg || 9, emit = opt.em || 0, alpha = opt.alpha === undefined ? 1 : opt.alpha, kind = opt.kind || 0, ph = opt.phase || 0;
    let distance = ph;
    let previous = null;
    for (let j = 0; j < points.length; j++) {
      const a = points[Math.max(0, j - 1)], b = points[Math.min(points.length - 1, j + 1)], t = norm(minus(b, a));
      const ref = Math.abs(t[1]) > .9 ? [ 1, 0, 0 ] : [ 0, 1, 0 ];
      const u = norm(cross(ref, t)), v = norm(cross(t, u));
      const point = points[j];
      const ring = [];
      for (let i = 0; i <= seg; i++) {
        const theta = i / seg * Math.PI * 2;
        const d = plus(mul(u, Math.cos(theta)), mul(v, Math.sin(theta)));
        ring.push({
          p: plus(point, mul(d, r)),
          n: d
        });
      }
      if (previous) {
        const section = Math.hypot(...minus(points[j], points[j - 1]));
        for (let i = 0; i < seg; i++) {
          const a0 = previous.ring[i], a1 = previous.ring[i + 1], b0 = ring[i], b1 = ring[i + 1];
          const out = A[g], c = rgb(col);
          appendVertex(out, a0.p, a0.n, c, emit, distance - section, kind, alpha);
          appendVertex(out, a1.p, a1.n, c, emit, distance - section, kind, alpha);
          appendVertex(out, b1.p, b1.n, c, emit, distance, kind, alpha);
          appendVertex(out, a0.p, a0.n, c, emit, distance - section, kind, alpha);
          appendVertex(out, b1.p, b1.n, c, emit, distance, kind, alpha);
          appendVertex(out, b0.p, b0.n, c, emit, distance, kind, alpha);
        }
      }
      previous = {
        ring: ring
      };
      if (j < points.length - 1) distance += Math.hypot(...minus(points[j + 1], points[j]));
    }
  }
  
  function roundPath(points, r = .6) {
    if (points.length <= 2) return points;
    const out = [ points[0] ];
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1], cur = points[i], next = points[i + 1];
      const u = minus(prev, cur), v = minus(next, cur), lu = Math.hypot(...u), lv = Math.hypot(...v);
      if (lu < .02 || lv < .02) continue;
      const len = Math.min(r, lu * .32, lv * .32);
      const entry = plus(cur, mul(norm(u), len)), exit = plus(cur, mul(norm(v), len));
      out.push(entry);
      for (let j = 1; j <= 6; j++) {
        const t = j / 6;
        out.push(plus(plus(mul(entry, (1 - t) * (1 - t)), mul(cur, 2 * (1 - t) * t)), mul(exit, t * t)));
      }
    }
    out.push(points[points.length - 1]);
    return out;
  }
  function bar(a, b, r, c, opt = {}) {
    tube([ a, b ], r, c, opt);
  }
  function ring(cx, y, cz, r, col, w = .04, opt = {}) {
    const pts = [];
    for (let i = 0; i <= 44; i++) {
      const t = i / 44 * Math.PI * 2;
      pts.push([ cx + Math.cos(t) * r, y, cz + Math.sin(t) * r ]);
    }
    tube(pts, w, col, {
      seg: 5,
      ...opt
    });
  }
  
  function mvSnapPipeToTanks(path, r) {
    if (!Array.isArray(path) || path.length < 2 || !tankLabels.length) return path;
    const out = path.map(p => [ p[0], p[1], p[2] ]);
    const snap = (endIndex, prevIndex) => {
      const e = out[endIndex];
      let best = null, bestD = Infinity;
      for (const t of tankLabels) {
        const d = Math.hypot(e[0] - t.x, e[2] - t.z);
        if (d < bestD) {
          bestD = d;
          best = t;
        }
      }
      if (!best) return null;
      const R = best.radius || 1.3;
      if (bestD <= R * .97 || bestD > R * 2.15) return null;
      const ux = (e[0] - best.x) / bestD, uz = (e[2] - best.z) / bestD;
      const wall = [ best.x + ux * R * .955, e[1], best.z + uz * R * .955 ];
      return {
        wall: wall,
        ux: ux,
        uz: uz,
        R: R
      };
    };
    const collars = [];
    const tail = snap(out.length - 1, out.length - 2);
    if (tail) {
      out.push(tail.wall);
      collars.push(tail);
    }
    const head = snap(0, 1);
    if (head) {
      out.unshift(head.wall);
      collars.push(head);
    }
    for (const c of collars) {
      const a = [ c.wall[0] + c.ux * c.R * .02, c.wall[1], c.wall[2] + c.uz * c.R * .02 ];
      const b = [ c.wall[0] + c.ux * (c.R * .02 + .2), c.wall[1], c.wall[2] + c.uz * (c.R * .02 + .2) ];
      tube([a, b], r + .17, '#7c8f99', {
        seg: 18,
        em: .05
      });
      const b2 = [ b[0] + c.ux * .05, b[1], b[2] + c.uz * .05 ];
      tube([b, b2], r + .21, '#5f707a', {
        seg: 18,
        em: .03
      });
    }
    return out;
  }
  const pipeWater = Tuberias3D.create(gl, [[loc.pos,3,0],[loc.normal,3,12],[loc.color,3,24],[loc.data,4,36]]);
  function attachedTank(p) {
    const matches = tankLabels.filter(t => Math.hypot(p[0]-t.x, p[2]-t.z) <= t.radius * 1.001);
    return matches.length === 1 ? matches[0].name : null;
  }
  function refreshPipeLevels(records) {
    pipeWater.update(name => {
      const row = records && records[name];
      return row && Tuberias3D.reference(row.nivel_m, row.estado, Number(row.capacidad_cm) / 100, 8, row.hora);
    });
  }
  function pipe(path, r, meta, index) {
    const joined = mvSnapPipeToTanks(path,r);
    const pts = roundPath(joined,.85);
    const from = meta.source || attachedTank(joined[0]);
    const to = meta.target || attachedTank(joined[joined.length-1]);
    const names = [...new Set([from,to].filter(Boolean))];
    const label = 'Tramo ' + (index+1) + (names.length ? ' · ' + names.join(' — ') : '');
    pipeWater.add(label, pts, r + .08, names);
    tube(pts, r + .105, '#bcc5c9', {seg:20, g:1, alpha:.30, em:.03, kind:0});
  }
  function inletAtTank(x, z, name, r) {
    let bestDistance = 1e9, dx = .73, dz = .25;
    for (const def of pipeDefs) {
      const related = def.source === name || def.target === name;
      for (let i = 0; i < def.nodes.length - 1; i++) {
        const p = def.nodes[i], q = def.nodes[i + 1];
        for (const [near, far] of [ [ p, q ], [ q, p ] ]) {
          const distance = Math.hypot(near[0] - x, near[2] - z) + (related ? -3 : 0);
          if (distance < bestDistance) {
            bestDistance = distance;
            const dirX = far[0] - x, dirZ = far[2] - z;
            const len = Math.hypot(dirX, dirZ) || 1;
            dx = dirX / len;
            dz = dirZ / len;
          }
        }
      }
    }
    return [ x + dx * r * .53, z + dz * r * .53 ];
  }
  function waterSurface(x, z, r, h, id, impact) {
    const spokes = 56, rings = 8, baseY = .52 + h;
    const packed = [ impact[0], impact[1], .45 ];
    const n = [ 0, 1, 0 ];
    for (let ringNo = 0; ringNo < rings; ringNo++) {
      const inner = ringNo / rings * r, outer = (ringNo + 1) / rings * r;
      for (let i = 0; i < spokes; i++) {
        const a = i / spokes * Math.PI * 2, b = (i + 1) / spokes * Math.PI * 2;
        const a0 = [ x + inner * Math.cos(a), baseY, z + inner * Math.sin(a) ];
        const a1 = [ x + inner * Math.cos(b), baseY, z + inner * Math.sin(b) ];
        const b0 = [ x + outer * Math.cos(a), baseY, z + outer * Math.sin(a) ];
        const b1 = [ x + outer * Math.cos(b), baseY, z + outer * Math.sin(b) ];
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
        const a0 = [ impact[0] + inner * Math.cos(a), baseY, impact[1] + inner * Math.sin(a) ];
        const a1 = [ impact[0] + inner * Math.cos(b), baseY, impact[1] + inner * Math.sin(b) ];
        const b0 = [ impact[0] + outer * Math.cos(a), baseY, impact[1] + outer * Math.sin(a) ];
        const b1 = [ impact[0] + outer * Math.cos(b), baseY, impact[1] + outer * Math.sin(b) ];
        tri(1, a0, n, b0, n, b1, n, packed, 0, id, 10, .36);
        tri(1, a0, n, b1, n, a1, n, packed, 0, id, 10, .36);
      }
    }
  }
  function pad(x, z, size = 3.85) {
    box(x, .09, z, size, .17, size, '#29343c');
    box(x, .195, z, size - .18, .055, size - .18, '#33444a');
    box(x, .035, z, size + .24, .035, size + .24, '#b28d5b', 0, .18);
  }
  function tank(x, z, name, level, scale = 1) {
    const R = 1.32 * scale, H = 3.2 * scale, ty = .28;
    pad(x, z, 3.55 * scale);
    const id = tankSpecs.length - 1, maxWaterHeight = H * .9;
    cylinder(x, .31, z, R * 1.13, .18, '#667c88', {
      seg: 36
    });
    cylinder(x, .43, z, R * .99, .07, '#2f5164', {
      seg: 36
    });
    cylinder(x, .52 + maxWaterHeight / 2, z, R * .93, maxWaterHeight, '#0c4b99', {
      seg: 48,
      kind: 5,
      em: .88,
      caps: false,
      levelId: id
    });
    if (enhancedWaterShader) {
      waterSurface(x, z, R * .93, maxWaterHeight, id, inletAtTank(x, z, name, R));
    } else {
      cylinder(x, .52 + maxWaterHeight, z, R * .94, .045, '#559bde', {
        seg: 48,
        em: 1.15,
        kind: 6,
        levelId: id
      });
    }
    cylinder(x, .52 + H * .46, z, R * .965, H * .92, '#9da3aa', {
      seg: 48,
      g: 1,
      alpha: .51,
      em: .02,
      kind: 8,
      caps: false
    });
    cylinder(x, .52 + H * .46, z, R * .985, H * .92, '#c4c9ce', {
      seg: 48,
      g: 2,
      alpha: .065,
      em: .035,
      kind: 8,
      caps: false
    });
    const wallRadius = R * 1.32;
    const screenY = .58 + H * .48;
    const displayW = 1.68 * scale, displayH = 1.1 * scale;
    const surfaceGap = .074 * scale;
    const screenSurface = z + wallRadius + surfaceGap;
    const frameR = R * 1.04, yBase = .52, yTop = ty + H + .45;
    ring(x, yBase, z, frameR, '#cadde1', .077, {
      seg: 8,
      em: .16
    });
    ring(x, yTop, z, frameR, '#e2ebee', .08, {
      seg: 8,
      em: .23
    });
    ring(x, yBase + .15, z, frameR, '#536c7b', .038, {
      seg: 7,
      em: .07
    });
    ring(x, yTop - .12, z, frameR, '#698899', .036, {
      seg: 7,
      em: .08
    });
    for (let i = 0; i < 8; i++) {
      const ang = i * Math.PI / 4, xp = x + Math.cos(ang) * frameR, zp = z + Math.sin(ang) * frameR;
      const material = i % 2 === 0 ? '#d1e2e8' : '#789aab';
      bar([ xp, yBase, zp ], [ xp, yTop, zp ], .047, material, {
        seg: 8,
        em: i % 2 === 0 ? .11 : .04
      });
      cylinder(xp, yTop, zp, .09, .11, '#e4eff3', {
        seg: 8
      });
      cylinder(xp, yBase, zp, .083, .09, '#8ca8b7', {
        seg: 8
      });
    }
    ring(x, ty + H * .53, z, frameR, '#597d8b', .025, {
      seg: 6,
      em: .05
    });
    const gold = '#eebd54', zr = z - R - .15, lx = x - R * .62;
    bar([ lx, .48, zr ], [ lx, yTop, zr ], .049, gold, {
      seg: 8
    });
    bar([ lx + .39, .48, zr ], [ lx + .39, yTop, zr ], .049, gold, {
      seg: 8
    });
    for (let y = .65; y < yTop - .13; y += .32) bar([ lx, y, zr ], [ lx + .39, y, zr ], .037, gold, {
      seg: 7
    });
    ring(x, .35, z, R * 1.24, '#94b6c2', .045, {
      seg: 6,
      em: .11
    });
    return {
      x: x,
      y: yTop,
      z: z,
      name: name,
      baseY: .52,
      height: H,
      radius: R,
      levelId: id,
      screenY: screenY,
      screenZ: screenSurface,
      screenW: displayW,
      screenH: displayH,
      wallRadius: wallRadius,
      surfaceGap: surfaceGap
    };
  }
  function orientedCylinder(a, b, r, col, opt = {}) {
    const d = minus(b, a), L = Math.hypot(...d);
    const t = norm(d);
    const ref = Math.abs(t[1]) > .93 ? [ 1, 0, 0 ] : [ 0, 1, 0 ], u = norm(cross(ref, t)), v = norm(cross(t, u)), S = opt.seg || 16;
    const g = opt.g || 0, em = opt.em || 0, alpha = opt.alpha === undefined ? 1 : opt.alpha;
    for (let i = 0; i < S; i++) {
      const theta = i / S * Math.PI * 2, beta = (i + 1) / S * Math.PI * 2;
      let n = plus(mul(u, Math.cos(theta)), mul(v, Math.sin(theta))), N = plus(mul(u, Math.cos(beta)), mul(v, Math.sin(beta)));
      const p = plus(a, mul(n, r)), q = plus(a, mul(N, r)), P = plus(b, mul(n, r)), Q = plus(b, mul(N, r));
      tri(g, p, n, q, N, Q, N, col, em);
      tri(g, p, n, Q, N, P, n, col, em);
      if (opt.caps !== false) {
        tri(g, a, mul(t, -1), q, mul(t, -1), p, mul(t, -1), col, em);
        tri(g, b, t, P, t, Q, t, col, em);
      }
    }
  }
  function pumpUnit(x, z, count = 3) {
    const w = 2.25 + count * .85;
    box(x, .25, z, w, .28, 2.45, '#263c53');
    box(x, .4, z, w - .18, .08, 2.22, '#46657b');
    for (let i = 0; i < count; i++) {
      const xx = x - w / 2 + .92 + i * .98;
      orientedCylinder([ xx - .42, .95, z ], [ xx + .42, .95, z ], .39, '#24709a', {
        seg: 18,
        em: .15
      });
      orientedCylinder([ xx + .38, .95, z ], [ xx + .65, .95, z ], .26, '#91b3c7');
      for (let d = -.28; d < .3; d += .145) orientedCylinder([ xx + d, .95, z ], [ xx + d + .035, .95, z ], .405, '#143f60', {
        seg: 18
      });
      box(xx, .48, z, .32, .15, 1.03, '#8aa7ba');
    }
    bar([ x - w / 2 + .4, 1.15, z + 1.12 ], [ x + w / 2 - .4, 1.15, z + 1.12 ], .115, '#19b9e0', {
      em: .72
    });
    bar([ x - w / 2 + .4, 1.15, z - 1.1 ], [ x + w / 2 - .4, 1.15, z - 1.1 ], .1, '#169abf', {
      em: .65
    });
    for (let i = 0; i < count; i++) {
      const xx = x - w / 2 + .92 + i * .98;
      bar([ xx, .92, z + .45 ], [ xx, 1.15, z + 1.12 ], .095, '#e1e5e8');
      bar([ xx, .92, z - .45 ], [ xx, 1.15, z - 1.1 ], .095, '#a2c2d1');
    }
    box(x, .14, z, w + .2, .035, 2.65, '#0289bc', 0, .7);
  }
  function port(x, y, z, side = 1) {
    orientedCylinder([ x - .18, y, z ], [ x + .18, y, z ], .37, '#9fc6d7');
    bar([ x, y, z ], [ x + side * .45, y, z ], .22, '#1ac7ea', {
      em: 1
    });
  }
  const grassBorder = [];
  const PLAY_HALF_W = 47.3, PLAY_HALF_D = 29.8;
  const siteRoadSegments = [ [ -46.1, -28.2, 46.1, -28.2, 1.55 ], [ -46.1, 28.2, 46.1, 28.2, 1.55 ], [ -46.1, -28.2, -46.1, 28.2, 1.55 ], [ 46.1, -28.2, 46.1, 28.2, 1.55 ] ];
  function distanceToSiteSegment(x, z, segment) {
    const vx = segment[2] - segment[0], vz = segment[3] - segment[1];
    const t = Math.max(0, Math.min(1, ((x - segment[0]) * vx + (z - segment[1]) * vz) / Math.max(1e-4, vx * vx + vz * vz)));
    return Math.hypot(x - segment[0] - vx * t, z - segment[1] - vz * t);
  }
  function onSiteRoad(x, z, margin = 0) {
    return siteRoadSegments.some(segment => distanceToSiteSegment(x, z, segment) < segment[4] * .5 + margin);
  }
  let grassSeed = 193710;
  function grassRand() {
    grassSeed = Math.imul(grassSeed, 1664525) + 1013904223 >>> 0;
    return grassSeed / 4294967296;
  }
  const grassPal = [ '#355e2c', '#406f32', '#52813a', '#568d3b', '#648e43', '#7a9850', '#2c5627' ];
  for (let i = 0; i < 10400; i++) {
    const x = -PLAY_HALF_W + grassRand() * (PLAY_HALF_W * 2);
    const z = -PLAY_HALF_D + grassRand() * (PLAY_HALF_D * 2);
    if (onSiteRoad(x, z, .16)) continue;
    const a = grassRand() * Math.PI * 2;
    const h = .034 + grassRand() * .08;
    const w = .022 + grassRand() * .032;
    const lean = .024 + grassRand() * .045;
    const p = [ x, -.039, z ];
    const vx = Math.cos(a), vz = Math.sin(a);
    const n = [ vz, .28, -vx ];
    const c = grassPal[Math.floor(grassRand() * grassPal.length)];
    tri(0, [ x - vx * w, -.038, z - vz * w ], n, [ x + vx * w, -.038, z + vz * w ], n, [ x + vx * lean, -.038 + h, z + vz * lean ], n, c);
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
    const roundedRelief = 29 * gradualSlope * silhouette * (.86 + .22 * broadValley);
    const naturalFolds = 4 * foothillSlope * (.28 + .72 * roundedHills);
    const ridges = terrainNoise(x * .018 + 22.4, z * .021 - 9.2);
    const longRidges = Math.pow(Math.abs(Math.sin(x * .027 + z * .011 + ridges * 3)), 2.5);
    const ridgeLift = 6.3 * gradualSlope * longRidges * (.42 + .58 * roundedHills);
    const localTexture = 1.75 * gradualSlope * (subtleGround - .5);
    return baseY + (roundedRelief + naturalFolds + ridgeLift + localTexture) * .18;
  };
  const terrainNormal = (x, z) => {
    const step = 1.65;
    return norm([ terrainHeight(x - step, z) - terrainHeight(x + step, z), 2 * step, terrainHeight(x, z - step) - terrainHeight(x, z + step) ]);
  };
  const terrainPoint = (x, z) => [ x, terrainHeight(x, z), z ];
  const terrainColor = (x, z, height) => {
    const moss = terrainNoise(x * .045 + 11, z * .043 - 4);
    const dry = terrainNoise(x * .11 - 14, z * .1 + 21);
    const altitude = smoothTerrain(15, 38, height);
    return [ .13 + .09 * moss + .042 * dry + .032 * altitude, .29 + .12 * moss - .025 * altitude + .018 * dry, .11 + .052 * moss + .004 * altitude ];
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
      row.push({
        p: p,
        n: terrainNormal(x, z),
        c: terrainColor(x, z, p[1])
      });
    }
    terrainGrid.push(row);
  }
  const terrainMesh = (() => {
    const columns = terrainStepsX + 1;
    const vertices = new Float32Array(columns * (terrainStepsZ + 1) * 13);
    for (let z = 0; z <= terrainStepsZ; z++) {
      for (let x = 0; x <= terrainStepsX; x++) {
        const {p, n, c} = terrainGrid[z][x];
        const offset = (z * columns + x) * 13;
        vertices.set(p, offset);
        vertices.set(n, offset + 3);
        vertices.set(c, offset + 6);
        vertices[offset + 11] = 11;
        vertices[offset + 12] = 1;
      }
    }
    const indices = new Uint16Array(terrainStepsX * terrainStepsZ * 6);
    let offset = 0;
    for (let z = 0; z < terrainStepsZ; z++) {
      for (let x = 0; x < terrainStepsX; x++) {
        const a = z * columns + x, b = a + 1, d = a + columns, c = d + 1;
        indices[offset++] = a;
        indices[offset++] = d;
        indices[offset++] = c;
        indices[offset++] = a;
        indices[offset++] = c;
        indices[offset++] = b;
      }
    }
    const buf = gl.createBuffer(), elements = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elements);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    return {buf, elements, count: indices.length, first: A[0].length / 13};
  })();
  let forestSeed = 781353;
  function forestRandom() {
    forestSeed = Math.imul(forestSeed, 1664525) + 1013904223 >>> 0;
    return forestSeed / 4294967296;
  }
  const forestColors = [ '#214622', '#2b5428', '#38632d', '#426b32', '#315a29', '#4a7034', '#254b24' ];
  for (let i = 0; i < 2600; i++) {
    const angle = forestRandom() * Math.PI * 2;
    const radius = 94 + Math.sqrt(forestRandom()) * 150;
    const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
    const ground = terrainHeight(x, z);
    if (ground < 2) continue;
    const scale = .62 + forestRandom() * 1.08;
    const crownY = ground + .55 * scale;
    const crownH = (1.2 + forestRandom() * .45) * scale;
    const width = (.68 + forestRandom() * .46) * scale;
    const top = [ x, crownY + crownH, z ];
    const bottom = [ x, crownY - .16 * scale, z ];
    const palette = forestColors[Math.floor(forestRandom() * forestColors.length)];
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3, b = (k + 1) * Math.PI / 3;
      const ra = width * (.82 + .16 * Math.sin(k * 2.3 + i * .7));
      const rb = width * (.82 + .16 * Math.sin((k + 1) * 2.3 + i * .7));
      const pa = [ x + Math.cos(a) * ra, crownY, z + Math.sin(a) * ra ];
      const pb = [ x + Math.cos(b) * rb, crownY, z + Math.sin(b) * rb ];
      const normal = norm([ Math.cos((a + b) * .5), .45, Math.sin((a + b) * .5) ]);
      tri(0, pa, normal, pb, normal, top, normal, palette);
      tri(0, pb, normal, pa, normal, bottom, normal, palette);
    }
  }
  const yy = 1.02;
  const ANILLO_LAYOUT_SPREAD = 1.085;
  const mapX = px => (px - 800) / 19 * ANILLO_LAYOUT_SPREAD;
  const mapZ = py => (py - 450) / 19 * ANILLO_LAYOUT_SPREAD;
  function at(px, py) {
    return [ mapX(px), yy, mapZ(py) ];
  }
  const pipeDefs = [];
  function pipeDiagram(nodes, r = .27, meta = {}) {
    pipeDefs.push({
      nodes: nodes.map(([px, py]) => at(px, py)),
      r: r,
      ...meta
    });
  }
  pipeDiagram([ [ 26, 140 ], [ 26, 219 ] ], .27);
  pipeDiagram([ [ 205, 88 ], [ 281, 88 ] ], .27);
  pipeDiagram([ [ 309, 113 ], [ 309, 132 ], [ 332, 166 ], [ 382, 166 ] ], .27);
  pipeDiagram([ [ 436, 174 ], [ 436, 282 ] ], .27);
  pipeDiagram([ [ 564, 138 ], [ 564, 224 ] ], .27);
  pipeDiagram([ [ 79, 282 ], [ 195, 282 ] ], .27);
  pipeDiagram([ [ 253, 282 ], [ 311, 282 ] ], .27);
  pipeDiagram([ [ 372, 282 ], [ 500, 282 ] ], .27);
  pipeDiagram([ [ 568, 282 ], [ 640, 282 ] ], .27);
  pipeDiagram([ [ 702, 282 ], [ 765, 282 ] ], .27);
  pipeDiagram([ [ 826, 282 ], [ 929, 282 ] ], .27);
  pipeDiagram([ [ 42, 302 ], [ 42, 327 ] ], .27);
  pipeDiagram([ [ 196, 302 ], [ 196, 340 ] ], .27);
  pipeDiagram([ [ 810, -46 ], [ 815, 5 ], [ 831, 105 ], [ 858, 212 ], [ 881, 301 ], [ 904, 411 ] ], .27);
  pipeDiagram([ [ 844, -46 ], [ 848, 5 ], [ 863, 105 ], [ 886, 212 ], [ 913, 301 ], [ 934, 411 ] ], .27);
  pipeDiagram([ [ 928, 282 ], [ 958, 244 ], [ 958, 221 ], [ 978, 203 ], [ 1067, 203 ] ], .27);
  pipeDiagram([ [ 1068, 159 ], [ 978, 159 ], [ 961, 144 ], [ 961, 126 ], [ 979, 104 ], [ 1020, 70 ] ], .27);
  pipeDiagram([ [ 1127, 181 ], [ 1155, 162 ] ], .27);
  pipeDiagram([ [ 1215, 144 ], [ 1281, 95 ] ], .27);
  pipeDiagram([ [ 1215, 173 ], [ 1334, 173 ] ], .27);
  pipeDiagram([ [ 1394, 162 ], [ 1484, 129 ] ], .27);
  pipeDiagram([ [ 1393, 209 ], [ 1463, 209 ], [ 1489, 232 ], [ 1491, 270 ], [ 1491, 697 ] ], .27);
  pipeDiagram([ [ 1072, 222 ], [ 1072, 253 ] ], .27);
  pipeDiagram([ [ 1018, 323 ], [ 1060, 323 ] ], .27);
  pipeDiagram([ [ 1009, 389 ], [ 1009, 414 ], [ 1053, 455 ] ], .27);
  pipeDiagram([ [ 1019, 373 ], [ 1120, 373 ], [ 1268, 373 ] ], .27);
  pipeDiagram([ [ 1150, 372 ], [ 1150, 338 ] ], .27);
  pipeDiagram([ [ 1177, 282 ], [ 1233, 282 ] ], .27);
  pipeDiagram([ [ 1271, 413 ], [ 1271, 475 ] ], .27);
  pipeDiagram([ [ 1491, 396 ], [ 1564, 396 ] ], .27);
  pipeDiagram([ [ 1491, 466 ], [ 1435, 466 ] ], .27);
  pipeDiagram([ [ 1389, 476 ], [ 1389, 480 ] ], .27);
  pipeDiagram([ [ 1619, 421 ], [ 1619, 455 ] ], .27);
  pipeDiagram([ [ 900, 456 ], [ 707, 456 ], [ 671, 427 ] ], .27);
  pipeDiagram([ [ 625, 417 ], [ 625, 424 ] ], .27);
  pipeDiagram([ [ 957, 483 ], [ 1050, 483 ] ], .27);
  pipeDiagram([ [ 1052, 509 ], [ 1052, 524 ] ], .27);
  pipeDiagram([ [ 1103, 509 ], [ 1103, 524 ] ], .27);
  pipeDiagram([ [ 910, 510 ], [ 910, 541 ], [ 884, 578 ] ], .27);
  pipeDiagram([ [ 423, 533 ], [ 829, 533 ] ], .27);
  pipeDiagram([ [ 423, 563 ], [ 828, 563 ] ], .27);
  pipeDiagram([ [ 243, 533 ], [ 361, 533 ] ], .27);
  pipeDiagram([ [ 181, 552 ], [ 181, 581 ] ], .27);
  pipeDiagram([ [ 363, 552 ], [ 363, 581 ] ], .27);
  pipeDiagram([ [ 511, 420 ], [ 530, 460 ], [ 583, 463 ], [ 613, 496 ], [ 613, 532 ] ], .27);
  pipeDiagram([ [ 463, 418 ], [ 463, 432 ] ], .27);
  pipeDiagram([ [ 613, 591 ], [ 644, 591 ], [ 822, 591 ] ], .27);
  pipeDiagram([ [ 612, 592 ], [ 613, 648 ], [ 564, 673 ] ], .27);
  pipeDiagram([ [ 1220, 568 ], [ 1190, 591 ], [ 1190, 688 ], [ 1160, 703 ], [ 1122, 703 ] ], .27);
  pipeDiagram([ [ 1278, 565 ], [ 1329, 565 ] ], .27);
  pipeDiagram([ [ 1274, 568 ], [ 1274, 680 ], [ 1334, 680 ] ], .27);
  pipeDiagram([ [ 1359, 701 ], [ 1359, 713 ] ], .27);
  pipeDiagram([ [ 1533, 723 ], [ 1577, 700 ], [ 1642, 669 ] ], .27);
  pipeDiagram([ [ 1533, 759 ], [ 1580, 810 ], [ 1641, 757 ] ], .27);
  pipeDiagram([ [ 1436, 768 ], [ 1300, 768 ], [ 1273, 738 ], [ 1273, 682 ] ], .27);
  pipeDiagram([ [ 94, 611 ], [ 177, 706 ], [ 206, 735 ] ], .27);
  pipeDiagram([ [ 18, 866 ], [ 111, 790 ], [ 206, 735 ] ], .27);
  pipeDiagram([ [ 78, 897 ], [ 160, 807 ], [ 204, 805 ] ], .27);
  pipeDiagram([ [ 205, 736 ], [ 235, 674 ], [ 504, 674 ] ], .27);
  pipeDiagram([ [ 562, 674 ], [ 607, 674 ], [ 615, 692 ], [ 615, 742 ] ], .27);
  pipeDiagram([ [ 230, 805 ], [ 404, 805 ] ], .27);
  pipeDiagram([ [ 459, 805 ], [ 607, 805 ] ], .27);
  pipeDiagram([ [ 432, 850 ], [ 432, 874 ], [ 395, 893 ], [ 346, 893 ] ], .27);
  pipeDiagram([ [ 618, 714 ], [ 960, 714 ] ], .27);
  pipeDiagram([ [ 641, 714 ], [ 641, 748 ] ], .27);
  pipeDiagram([ [ 615, 826 ], [ 615, 837 ] ], .27);
  pipeDiagram([ [ 864, 715 ], [ 864, 748 ] ], .27);
  pipeDiagram([ [ 841, 824 ], [ 841, 838 ] ], .27);
  pipeDiagram([ [ 900, 824 ], [ 900, 838 ] ], .27);
  pipeDiagram([ [ 900, 798 ], [ 980, 798 ] ], .27);
  pipeDiagram([ [ 986, 730 ], [ 986, 782 ], [ 980, 798 ], [ 980, 826 ], [ 988, 843 ], [ 1005, 861 ], [ 1026, 877 ] ], .27);
  pipeDiagram([ [ 1014, 741 ], [ 1014, 776 ] ], .27);
  pipeDiagram([ [ 1020, 707 ], [ 1034, 707 ], [ 1062, 676 ] ], .27);
  pipeDiagram([ [ 1123, 703 ], [ 1155, 703 ], [ 1190, 684 ] ], .27);
  pipeDiagram([ [ 1069, 735 ], [ 1069, 842 ] ], .27);
  pipeDiagram([ [ 1069, 842 ], [ 1130, 842 ], [ 1188, 858 ], [ 1225, 880 ], [ 1336, 879 ], [ 1454, 835 ], [ 1455, 783 ] ], .27);
  pipeDiagram([ [ 1491, 695 ], [ 1491, 697 ] ], .27);
  const tankLabels = [];
  const tankSpecs = [];
  function tankDiagram(px, py, name, water, scale = 1.1) {
    tankSpecs.push({
      name: name,
      baseFraction: 0,
      fraction: 0,
      meters: null,
      delta: null,
      capacityMeters: 8,
      state: 'sin_datos'
    });
    tankLabels.push(tank(mapX(px), mapZ(py), name, water, scale));
  }
  tankDiagram(45, 101, "LA CRUZ", 0, 1.1);
  tankDiagram(175, 76, "FRAILE 5", 0, 1.1);
  tankDiagram(52, 264, "GARCÍA 2", 0, 1.1);
  tankDiagram(223, 263, "GARCÍA 1", 0, 1.1);
  tankDiagram(341, 262, "FRAILE 2", 0, 1.1);
  tankDiagram(313, 78, "FRAILE 4", 0, 1.1);
  tankDiagram(411, 139, "FRAILE 3", 0, 1.1);
  tankDiagram(539, 263, "FRAILE 1", 0, 1.1);
  tankDiagram(550, 101, "REAL DE MINA", 0, 1.1);
  tankDiagram(671, 263, "ALIANZA REAL", 0, 1.1);
  tankDiagram(796, 264, "NUEVA CASTILLA AMP", 0, 1.1);
  tankDiagram(1096, 183, "NUEVA CASTILLA 3 RECTANGULAR", 0, 1.1);
  tankDiagram(1183, 160, "NUEVA CASTILLA 3 CIRCULAR", 0, 1.1);
  tankDiagram(1365, 186, "SANTA ROSA 2", 0, 1.1);
  tankDiagram(989, 345, "ESCOBEDO", 0, 1.1);
  tankDiagram(1150, 300, "APODACA", 0, 1.1);
  tankDiagram(1300, 383, "MIGUEL ALEMÁN", 0, 1.1);
  tankDiagram(1596, 391, "LA PAZ 2", 0, 1.1);
  tankDiagram(1412, 431, "LA PAZ 1", 0, 1.1);
  tankDiagram(1246, 521, "SAN ROQUE OTE", 0, 1.1);
  tankDiagram(1082, 473, "CAÑADA", 0, 1.1);
  tankDiagram(928, 472, "SAN NICOLÁS", 0, 1.1);
  tankDiagram(852, 564, "PENAL", 0, 1.1);
  tankDiagram(656, 382, "TOPO CHICO", 0, 1.1);
  tankDiagram(498, 383, "SAN MARTÍN 1", 0, 1.1);
  tankDiagram(212, 519, "SAN BERNABÉ RECTANGULAR", 0, 1.1);
  tankDiagram(395, 520, "SAN BERNABÉ CIRCULAR", 0, 1.1);
  tankDiagram(534, 669, "OBISPADO", 0, 1.1);
  tankDiagram(432, 813, "VALLE 2", 0, 1.1);
  tankDiagram(316, 881, "VALLE 4", 0, 1.1);
  tankDiagram(640, 784, "LOMA LARGA", 0, 1.1);
  tankDiagram(866, 784, "SUR", 0, 1.1);
  tankDiagram(986, 695, "ALTAMIRA 2", 0, 1.1);
  tankDiagram(1094, 673, "LA SILLA 1", 0, 1.1);
  tankDiagram(1359, 549, "JUÁREZ", 0, 1.1);
  tankDiagram(1364, 663, "ARBOLEDAS 2", 0, 1.1);
  const pumpGroups = [];
  function siteRoad(segment) {
    const [x1, z1, x2, z2, width] = segment;
    const horizontal = Math.abs(x2 - x1) >= Math.abs(z2 - z1);
    const length = Math.hypot(x2 - x1, z2 - z1);
    const centerX = (x1 + x2) * .5, centerZ = (z1 + z2) * .5;
    box(centerX, -.031, centerZ, horizontal ? length + width : width, .092, horizontal ? width : length + width, '#626d68');
    box(centerX, .018, centerZ, horizontal ? length + width : width - .14, .018, horizontal ? width - .14 : length + width, '#394b49');
    const edge = width * .5 - .035;
    for (const sign of [ -1, 1 ]) {
      box(centerX + (horizontal ? 0 : sign * edge), .037, centerZ + (horizontal ? sign * edge : 0), horizontal ? length : .055, .026, horizontal ? .055 : length, '#abb5ae');
    }
  }
  function siteGlow(x, z, radius, alpha) {
    const center = [ x, .04, z ];
    const normal = [ 0, 1, 0 ];
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const a = i / steps * Math.PI * 2, b = (i + 1) / steps * Math.PI * 2;
      tri(2, center, normal, [ x + Math.cos(a) * radius, center[1], z + Math.sin(a) * radius ], normal, [ x + Math.cos(b) * radius, center[1], z + Math.sin(b) * radius ], normal, '#ffe0a0', .34, 0, 14, alpha);
    }
  }
  function siteLamp(x, z) {
    for (const p of tankLabels) {
      if (Math.hypot(x - p.x, z - p.z) < p.radius + 2.1) return;
    }
    box(x, .01, z, .38, .06, .38, '#9ca59d');
    cylinder(x, .105, z, .11, .16, '#243b40', {
      seg: 9
    });
    cylinder(x, .565, z, .047, .83, '#3d5357', {
      seg: 9
    });
    box(x, 1.005, z, .19, .06, .19, '#35484b');
    box(x, 1.102, z, .235, .155, .235, '#ffe4a2', 0, 1.45);
    box(x, 1.19, z, .28, .05, .28, '#263b43');
    box(x, 1.098, z, .34, .23, .34, '#fff3c4', 1, .78, .17);
    siteGlow(x, z, .7, .055);
    siteGlow(x, z, 1.15, .018);
  }
  function siteTankFloorLights(p) {
    const offset = p.radius * 1.07;
    for (const xSign of [ -1, 1 ]) for (const zSign of [ -1, 1 ]) {
      const x = p.x + xSign * offset, z = p.z + zSign * offset;
      cylinder(x, .237, z, .095, .022, '#ffe3a3', {
        seg: 10,
        em: 1.2
      });
      cylinder(x, .228, z, .135, .013, '#9d9e91', {
        seg: 10,
        em: .08
      });
    }
  }
  function groundContactShadow(x, z, radius) {
    const radii = [ radius * .72, radius * 1.03, radius * 1.3, radius * 1.67 ];
    const opacity = [ .17, .15, .068, 0 ];
    const normal = [ 0, 1, 0 ];
    const y = .042;
    const steps = 28;
    for (let ringIndex = 0; ringIndex < radii.length - 1; ringIndex++) {
      const inner = radii[ringIndex], outer = radii[ringIndex + 1];
      const ai = opacity[ringIndex], ao = opacity[ringIndex + 1];
      const c = [ .018, .038, .024 ];
      for (let i = 0; i < steps; i++) {
        const a = i * 2 * Math.PI / steps;
        const b = (i + 1) * 2 * Math.PI / steps;
        const p = [ x + Math.cos(a) * inner, y, z + Math.sin(a) * inner ];
        const q = [ x + Math.cos(b) * inner, y, z + Math.sin(b) * inner ];
        const r = [ x + Math.cos(a) * outer, y, z + Math.sin(a) * outer ];
        const t = [ x + Math.cos(b) * outer, y, z + Math.sin(b) * outer ];
        const out = A[1];
        appendVertex(out, p, normal, c, 0, 0, 15, ai);
        appendVertex(out, t, normal, c, 0, 0, 15, ao);
        appendVertex(out, q, normal, c, 0, 0, 15, ai);
        appendVertex(out, p, normal, c, 0, 0, 15, ai);
        appendVertex(out, r, normal, c, 0, 0, 15, ao);
        appendVertex(out, t, normal, c, 0, 0, 15, ao);
      }
    }
  }
  function buildSiteEnvironment() {
    for (const p of tankLabels) groundContactShadow(p.x, p.z, p.radius * 1.12);
    for (const segment of siteRoadSegments) siteRoad(segment);
    for (let x = -39; x <= 39; x += 9.8) {
      siteLamp(x, -26.9);
      siteLamp(x, 26.9);
    }
    for (let z = -21; z <= 21; z += 8.4) {
      siteLamp(-44.9, z);
      siteLamp(44.9, z);
    }
    for (const p of tankLabels) siteTankFloorLights(p);
  }
  buildSiteEnvironment();
  const facilityLabels = [];
  function casetaLuz(a, b, c, d, normal, phase, glow = false, opacity = 1) {
    const group = glow ? 1 : 0;
    const kind = glow ? 13 : 12;
    const color = glow ? '#ffc56e' : '#60747e';
    tri(group, a, normal, b, normal, c, normal, color, 0, phase, kind, opacity);
    tri(group, a, normal, c, normal, d, normal, color, 0, phase, kind, opacity);
  }
  function casetaDiagram(px, py, name, scale = 1) {
    const x = mapX(px), z = mapZ(py), w = 5 * scale, d = 2.96 * scale;
    const frontZ = z + d * .5, rearZ = z - d * .5;
    const xL = x - (w * .5 + .21), xR = x + (w * .5 + .21);
    const frontEdge = frontZ + .22, rearEdge = rearZ - .22;
    const roofFrontY = 2.17 * scale, roofRearY = 2.22 * scale, roofThickness = .13 * scale;
    const doorX = x + w * .31, doorW = .72 * scale;
    box(x, .105, z, w + .48, .19, d + .38, '#a7b1b6');
    box(x, .235, z, w + .21, .1, d + .15, '#6d777e');
    box(x, 1.205 * scale, z, w, 1.78 * scale, d, '#c0c9cd');
    box(x - w * .5 + .09, 1.2 * scale, z, .18 * scale, 1.75 * scale, d + .02, '#a4b0b6');
    box(x + w * .5 - .09, 1.2 * scale, z, .18 * scale, 1.75 * scale, d + .02, '#a4b0b6');
    box(x, 1.955 * scale, frontZ + .028, w - .13, .14 * scale, .085 * scale, '#3f5059');
    box(x - .44 * scale, 1.735 * scale, frontZ + .052, w * .61, .25 * scale, .045 * scale, '#283843');
    box(x - .44 * scale, 1.575 * scale, frontZ + .048, w * .61, .045 * scale, .056 * scale, '#8dabb8');
    box(doorX, .805 * scale, frontZ + .057, doorW + .16 * scale, 1.19 * scale, .095 * scale, '#88969d');
    box(doorX, .812 * scale, frontZ + .117, doorW, 1.08 * scale, .065 * scale, '#344651');
    box(doorX + doorW * .31, .83 * scale, frontZ + .163, .045 * scale, .1 * scale, .022 * scale, '#d5d9dc');
    box(doorX, 1.47 * scale, frontZ + .12, doorW + .26 * scale, .09 * scale, .11 * scale, '#c5cbce');
    box(x - .95 * scale, 1.115 * scale, rearZ - .048, 1.5 * scale, .47 * scale, .06 * scale, '#263a47');
    box(x + .95 * scale, 1.115 * scale, rearZ - .048, 1.5 * scale, .47 * scale, .06 * scale, '#263a47');
    box(x + w * .5 + .035, 1.41 * scale, z - .41 * scale, .09 * scale, .49 * scale, .71 * scale, '#253843');
    box(x + w * .5 + .084, 1.41 * scale, z - .41 * scale, .025 * scale, .035 * scale, .7 * scale, '#9bb3bc');
    box(x - w * .5 - .035, 1.41 * scale, z + .39 * scale, .09 * scale, .49 * scale, .71 * scale, '#253843');
    box(x - w * .5 - .084, 1.41 * scale, z + .39 * scale, .025 * scale, .035 * scale, .7 * scale, '#9bb3bc');
    const phase = facilityLabels.length;
    const frontWindowZ = frontZ + .082 * scale;
    const rearWindowZ = rearZ - .086 * scale;
    for (const offset of [ -1.42, -.44, .54 ]) {
      const cx = x + offset * scale, cy = 1.735 * scale;
      const hw = .39 * scale, hh = .084 * scale;
      casetaLuz([ cx - hw, cy - hh, frontWindowZ ], [ cx + hw, cy - hh, frontWindowZ ], [ cx + hw, cy + hh, frontWindowZ ], [ cx - hw, cy + hh, frontWindowZ ], [ 0, 0, 1 ], phase);
    }
    for (const offset of [ -.95, .95 ]) {
      const cx = x + offset * scale, cy = 1.115 * scale;
      const hw = .61 * scale, hh = .16 * scale;
      casetaLuz([ cx + hw, cy - hh, rearWindowZ ], [ cx - hw, cy - hh, rearWindowZ ], [ cx - hw, cy + hh, rearWindowZ ], [ cx + hw, cy + hh, rearWindowZ ], [ 0, 0, -1 ], phase);
    }
    const rightX = x + w * .5 + .086 * scale;
    const leftX = x - w * .5 - .086 * scale;
    const sy0 = 1.245 * scale, sy1 = 1.575 * scale;
    const rz0 = z - .67 * scale, rz1 = z - .15 * scale;
    const lz0 = z + .13 * scale, lz1 = z + .65 * scale;
    casetaLuz([ rightX, sy0, rz1 ], [ rightX, sy0, rz0 ], [ rightX, sy1, rz0 ], [ rightX, sy1, rz1 ], [ 1, 0, 0 ], phase);
    casetaLuz([ leftX, sy0, lz0 ], [ leftX, sy0, lz1 ], [ leftX, sy1, lz1 ], [ leftX, sy1, lz0 ], [ -1, 0, 0 ], phase);
    const doorGlassZ = frontZ + .177 * scale;
    const doorGlassX = doorX - .095 * scale;
    casetaLuz([ doorGlassX - .16 * scale, 1.18 * scale, doorGlassZ ], [ doorGlassX + .16 * scale, 1.18 * scale, doorGlassZ ], [ doorGlassX + .16 * scale, 1.37 * scale, doorGlassZ ], [ doorGlassX - .16 * scale, 1.37 * scale, doorGlassZ ], [ 0, 0, 1 ], phase);
    const glowFrontZ = frontZ + .126 * scale;
    casetaLuz([ x - 1.92 * scale, 1.61 * scale, glowFrontZ ], [ x + 1.01 * scale, 1.61 * scale, glowFrontZ ], [ x + 1.01 * scale, 1.84 * scale, glowFrontZ ], [ x - 1.92 * scale, 1.84 * scale, glowFrontZ ], [ 0, 0, 1 ], phase, true, .13);
    const glowRearZ = rearZ - .128 * scale;
    for (const offset of [ -.95, .95 ]) {
      const cx = x + offset * scale;
      casetaLuz([ cx + .76 * scale, .88 * scale, glowRearZ ], [ cx - .76 * scale, .88 * scale, glowRearZ ], [ cx - .76 * scale, 1.35 * scale, glowRearZ ], [ cx + .76 * scale, 1.35 * scale, glowRearZ ], [ 0, 0, -1 ], phase, true, .065);
    }
    const top = [ [ xL, roofRearY, rearEdge ], [ xR, roofRearY, rearEdge ], [ xR, roofFrontY, frontEdge ], [ xL, roofFrontY, frontEdge ] ];
    const lower = top.map(p => [ p[0], p[1] - roofThickness, p[2] ]);
    const roofNormal = norm([ 0, frontEdge - rearEdge, roofRearY - roofFrontY ]);
    quad(0, top[0], top[1], top[2], top[3], roofNormal, '#94a3ad', .06);
    quad(0, lower[3], lower[2], lower[1], lower[0], [ 0, -1, 0 ], '#64727b');
    quad(0, lower[3], lower[2], top[2], top[3], [ 0, 0, 1 ], '#5f6d77');
    quad(0, lower[1], lower[0], top[0], top[1], [ 0, 0, -1 ], '#677680');
    quad(0, lower[0], lower[3], top[3], top[0], [ -1, 0, 0 ], '#71808a');
    quad(0, lower[2], lower[1], top[1], top[2], [ 1, 0, 0 ], '#71808a');
    bar(top[3], top[2], .045 * scale, '#d7dee1', {
      seg: 6
    });
    bar(top[0], top[1], .038 * scale, '#bdc8ce', {
      seg: 6
    });
    box(x - w * .27, .2 * scale, frontZ + .32 * scale, 1.8 * scale, .055 * scale, .38 * scale, '#afb5b7');
    facilityLabels.push({
      x: x,
      z: z,
      name: name,
      scale: scale,
      y: 2.6 * scale,
      signY: 1.03 * scale,
      signFrontZ: frontZ + .108 * scale,
      signRearZ: rearZ - .108 * scale,
      signX: x - w * .19,
      signW: 2.65 * scale,
      signH: .8 * scale
    });
  }
  casetaDiagram(1066, 876, 'PP LA BOCA', 1.02);
  casetaDiagram(1481, 734, 'PP SAN ROQUE', 1.04);
  function flowDiagram(name, lps, px, py, dx = 0, dy = 0) {
    return {
      name: name,
      lps: lps,
      x: mapX(px),
      z: mapZ(py),
      dx: dx,
      dy: dy
    };
  }
  const flowReadings = [ flowDiagram("ESCOBEDO RED DOWN 2", null, 1033.6, 306.9), flowDiagram("PENAL BOTTOM MANUAL", null, 512, 513), flowDiagram("LL A PENAL", null, 720, 595.8), flowDiagram("SAN BERN RECT ZERO", null, 166.4, 568.8), flowDiagram("LA SILLA1 DOWN MANUAL", null, 1072, 751), flowDiagram("LA PAZ2 DOWN ZERO", null, 1550.4, 433.8), flowDiagram("LA PAZ1 DOWN ZERO", null, 1376, 475.2), flowDiagram("SR A ESCOBEDO", null, 1244.8, 457.2), flowDiagram("PENAL-SANMARTIN", null, 640, 495), flowDiagram("5116", null, 791.2, 43.2), flowDiagram("4176", null, 852.8, 46.8), flowDiagram("267", null, 992, 54), flowDiagram("139", null, 1252.8, 73.8), flowDiagram("211", null, 1467.2, 125.1), flowDiagram("8766", null, 1430, 235), flowDiagram("DERIVACIONES MTYV", null, 1460, 250.7), flowDiagram("3013", null, 1460, 592.2), flowDiagram("167", null, 24, 334.8), flowDiagram("0A", null, 174.4, 342.9), flowDiagram("REDSB CIRCULAR", null, 339.2, 571.5), flowDiagram("RED SANMARTIN", null, 432, 423), flowDiagram("0C", null, 593.6, 423), flowDiagram("0D", null, 399, 306), flowDiagram("SALIDA FRAILE1", null, 441.6, 281.7), flowDiagram("542", null, 605, 245), flowDiagram("SANTA ROSA2 SALIDA", null, 1260, 212), flowDiagram("NVA CAST 3 DOWN", null, 1020.8, 253.8), flowDiagram("908", null, 743, 244), flowDiagram("304A", null, 1208, 263.7), flowDiagram("304B", null, 1039, 347), flowDiagram("304C", null, 1e3, 521.1), flowDiagram("304D", null, 1056, 521.1), flowDiagram("MIGUEL ALEMAN 0", null, 1272, 430.2), flowDiagram("ALIMENTADOR NORTE RED", null, 1164.8, 588.6), flowDiagram("SANTACATARINAQUINTAS", null, 56, 595.8), flowDiagram("ACHUASTECA", null, 118.4, 692.1), flowDiagram("1731", null, 208, 792.9), flowDiagram("560", null, 272, 756.9), flowDiagram("LOMALARGARED", null, 577.6, 832.5), flowDiagram("LOMALARGAOBISPADO", null, 609.6, 655.2), flowDiagram("LOMALARGAVALLE", null, 496, 784.8), flowDiagram("LLEGADAJUAREZ", null, 1293, 543), flowDiagram("SALIDAJUAREZ", null, 1388, 587), flowDiagram("SUR-RED36", null, 792, 819), flowDiagram("SUR-RED24", null, 854.4, 819), flowDiagram("1198B", null, 902.4, 782.1), flowDiagram("SANTIAGO CERO NUEVO", null, 924.8, 835.2), flowDiagram("A ALLTAMIRA3", null, 968, 747), flowDiagram("SANTIAGO2 CERO ARRIBA", null, 1056, 751.5), flowDiagram("304E", null, 1056, 793.8), flowDiagram("791", null, 1124.8, 795.6), flowDiagram("1140", null, 1238.4, 871.2), flowDiagram("MEDIDORBRECHA", null, 1177.6, 656.1), flowDiagram("ARB2-SALIDO-ARB3", null, 1246.4, 632.7), flowDiagram("EXTRACCION DELA BOCA", null, 1232, 810), flowDiagram("4236", null, 1363.2, 837), flowDiagram("4583", null, 1360, 756), flowDiagram("4271", null, 1516.8, 702.9), flowDiagram("2451", null, 1534.4, 782.1) ];
  const backendFlowKeys = [ "lps_escobedo_red_down_2", "lps_penal_bottom_manual", "lps_LL_A_PENAL", "lps_san_bern_rect_zero", "lps_la_silla1_down_manual", "lps_la_paz2_down_zero", "lps_la_paz1_down_zero", "lps_SR_A_ESCOBEDO", "lps_penal-sanmartin", "lps_5116", "lps_4176", "lps_267", "lps_139", "lps_211", "lps_8766", "lps_derivaciones_mtyv", "lps_3013", "lps_167", "lps_0a", "redSB_circular", "lps_red_SanMartin", "lps_0c", "lps_0d", "lps_salida_fraile1", "lps_542", "lps_santa_rosa2_salida", "lps_nva_cast_3_down", "lps_908", "lps_304a", "lps_304b", "lps_304c", "lps_304d", "lps_miguel_aleman_0", "lps_alimentador_norte_red", "SantaCatarinaQuintas", "ACHuasteca", "lps_1731", "lps_560", "lps_lomalargared", "lps_lomalargaobispado", "lps_lomalargavalle", "lps_llegadajuarez", "lps_salidajuarez", "lps_sur-red36", "lps_sur-red24", "lps_1198b", "lps_santiago_cero_nuevo", "lps_a_alltamira3", "lps_santiago2_cero_arriba", "lps_304e", "lps_791", "lps_1140", "lps_MEDIDORBRECHA", "arb2-salido-arb3", "extraccion_dela_boca", "lps_4236", "lps_4583", "lps_4271", "lps_2451" ];
  const flowDisplayNames = {
    lps_escobedo_red_down_2: "Escobedo → Red",
    lps_penal_bottom_manual: "Penal → San Bernabé",
    lps_LL_A_PENAL: "Loma Larga → Penal",
    lps_san_bern_rect_zero: "San Bernabé Rect. → Red",
    lps_la_silla1_down_manual: "La Silla 1 → Red Poniente",
    lps_la_paz2_down_zero: "La Paz 2 → Red",
    lps_la_paz1_down_zero: "La Paz 1 → Red",
    lps_SR_A_ESCOBEDO: "San Roque → Escobedo",
    "lps_penal-sanmartin": "Penal ↔ San Martín",
    lps_5116: "Acueducto Mina II",
    lps_4176: "Acueducto Mina I",
    lps_267: "N. Castilla III → Zuazua",
    lps_139: "N. Castilla III → Ciénega",
    lps_211: "Santa Rosa 2 → Pesquería",
    lps_8766: "Llegada Santa Rosa 2",
    lps_derivaciones_mtyv: "Derivaciones MTYV",
    lps_3013: "Salida Monterrey V",
    lps_167: "García 2 → Red 24″",
    lps_0a: "García 1 → Red",
    redSB_circular: "San Bernabé Circ. → Red",
    lps_red_SanMartin: "San Martín → Red",
    lps_0c: "Topo Chico → Red 20″",
    lps_0d: "Llegada Fraile 2",
    lps_salida_fraile1: "Salida Fraile 1",
    lps_542: "Llegada Alianza Real",
    lps_santa_rosa2_salida: "Santa Rosa 2 → N. Castilla III",
    lps_nva_cast_3_down: "N. Castilla III → N. Castilla AMP",
    lps_908: "Nueva Castilla AMP",
    lps_304a: "Apodaca → Red",
    lps_304b: "Escobedo → Red",
    lps_304c: "Cañada → Red 30″",
    lps_304d: "Cañada → Red 36″",
    lps_miguel_aleman_0: "Miguel Alemán → Red",
    lps_alimentador_norte_red: "Alimentador Norte → Red",
    SantaCatarinaQuintas: "Santa Catarina Las Quintas",
    ACHuasteca: "Acueducto Huasteca",
    lps_1731: "Macromedidor Horcones",
    lps_560: "Valle Poniente",
    lps_lomalargared: "Loma Larga → Red",
    lps_lomalargaobispado: "Loma Larga → Obispado",
    lps_lomalargavalle: "Loma Larga → Valle 2",
    lps_llegadajuarez: "Llegada Juárez",
    lps_salidajuarez: "Juárez → Red",
    "lps_sur-red36": "Sur → Red 36″",
    "lps_sur-red24": "Sur → Red 24″",
    lps_1198b: "Acueducto Santiago 1",
    lps_santiago_cero_nuevo: "Acueducto Santiago 1",
    lps_a_alltamira3: "Altamira 2 → Altamira 3",
    lps_santiago2_cero_arriba: "Acueducto Santiago 2",
    lps_304e: "Acueducto Santiago 2",
    lps_791: "Clarificadores La Boca",
    lps_1140: "Aportación La Boca",
    lps_MEDIDORBRECHA: "Medidor Brecha",
    "arb2-salido-arb3": "Arboledas 2 → Arboledas 3",
    extraccion_dela_boca: "Extracción La Boca",
    lps_4236: "Llegada PB5",
    lps_4583: "Llegada PB1 Linares",
    lps_4271: "PB San Roque → China 1",
    lps_2451: "PB San Roque → China 2"
  };
  flowReadings.forEach((f, i) => {
    f.backendKey = backendFlowKeys[i];
    f.name = flowDisplayNames[f.backendKey] || f.name;
    f.lps = null;
    f.connection = 'sin_datos';
  });
  for (const f of flowReadings) {
    const sx = f.x + (f.dx || 0) / 25, sz = f.z + (f.dy || 0) / 24.5;
    cylinder(sx, .065, sz, .18, .075, '#3c4c43', {
      seg: 10
    });
    bar([ sx, .1, sz ], [ sx, .34, sz ], .035, '#9fb4bb', {
      seg: 8,
      em: .05
    });
    cylinder(sx, .34, sz, .075, .045, '#cedfe2', {
      seg: 10
    });
  }
  box(mapX(90 * 16), .36, mapZ(77 * 9), 4.5, .7, 2.9, '#cbd8dd');
  box(mapX(90 * 16), .76, mapZ(77 * 9), 3.8, .1, 2.5, '#425867');
  box(mapX(65 * 16), .36, mapZ(96 * 9), 4.2, .7, 2.8, '#cbd8dd');
  box(mapX(65 * 16), .76, mapZ(96 * 9), 3.5, .1, 2.3, '#425867');
  function pump3D(x, z, active, ordinal) {
    const chrome = '#b9ccd7', silver = '#7d9aab', edge = '#d8e8ed', steel = '#476173', dark = '#172839';
    const light = active ? '#4afe59' : '#8696a5', lightBright = active ? '#81ff74' : '#a8b8c7';
    const core = active ? '#2bbb37' : '#516477';
    box(x, 1.35, z, .82, .13, .75, '#0b2236');
    box(x, 1.425, z, .76, .065, .68, '#617c8e');
    box(x, 1.47, z, .64, .052, .57, '#152b3d');
    for (const dx of [ -.31, .31 ]) for (const dz of [ -.26, .26 ]) {
      cylinder(x + dx, 1.51, z + dz, .036, .055, '#d3e2e8', {
        seg: 8
      });
    }
    cylinder(x, 1.62, z, .29, .29, '#2f4356', {
      seg: 20
    });
    cylinder(x, 1.7, z, .315, .065, silver, {
      seg: 20
    });
    cylinder(x, 1.92, z, .32, .42, '#6e8798', {
      seg: 24
    });
    cylinder(x, 1.78, z, .337, .055, '#1d2b38', {
      seg: 20
    });
    cylinder(x, 2.06, z, .338, .065, '#253745', {
      seg: 20
    });
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      const x1 = x + .325 * Math.cos(a), z1 = z + .325 * Math.sin(a);
      box(x1, 1.94, z1, .044, .2, .042, '#2e4352');
    }
    cylinder(x, 2.21, z, .355, .13, '#9fb6c3', {
      seg: 26
    });
    cylinder(x, 2.27, z, .365, .06, dark, {
      seg: 26
    });
    cylinder(x, 2.59, z, .316, .57, core, {
      seg: 26,
      em: active ? .45 : .03,
      kind: active ? 3 : 0
    });
    cylinder(x, 2.6, z, .323, .565, light, {
      seg: 26,
      g: 1,
      alpha: active ? .26 : .12,
      em: active ? .48 : .08
    });
    cylinder(x, 2.59, z, .365, .62, light, {
      seg: 16,
      g: 2,
      alpha: active ? .085 : .015,
      em: active ? 1.1 : .08
    });
    for (let i = 0; i < 8; i++) {
      const a = (i + .35) * Math.PI / 4;
      bar([ x + Math.cos(a) * .333, 2.35, z + Math.sin(a) * .333 ], [ x + Math.cos(a) * .333, 2.83, z + Math.sin(a) * .333 ], .023, active ? '#9aff75' : '#9baebb', {
        em: active ? 1.9 : .14
      });
    }
    cylinder(x, 2.94, z, .365, .095, '#283c4b', {
      seg: 24
    });
    cylinder(x, 3.06, z, .385, .21, chrome, {
      seg: 26
    });
    cylinder(x, 3.185, z, .355, .07, '#243947', {
      seg: 24
    });
    cylinder(x, 3.28, z, .33, .16, '#b6cbd5', {
      seg: 24
    });
    cylinder(x, 3.39, z, .257, .075, edge, {
      seg: 24
    });
    cylinder(x, 3.435, z, .19, .038, '#354c5c', {
      seg: 20
    });
    ring(x, 3.465, z, .213, active ? '#3c9f65' : '#75848e', .03, {
      em: active ? .28 : .04,
      seg: 12
    });
    cylinder(x, 3.468, z, .132, .024, '#99aeb9', {
      seg: 20
    });
    cylinder(x, 3.485, z, .078, .017, '#253d4b', {
      seg: 16
    });
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      bar([ x + Math.cos(a) * .09, 3.504, z + Math.sin(a) * .09 ], [ x + Math.cos(a) * .135, 3.504, z + Math.sin(a) * .135 ], .015, '#556b77', {
        seg: 6
      });
    }
    box(x + .3, 2.1, z + .18, .24, .4, .33, '#263646');
    box(x + .39, 2.11, z + .18, .14, .32, .27, '#a2b7c3');
    box(x + .465, 2.11, z + .18, .028, .22, .17, '#475b67');
    box(x + .485, 2.175, z + .18, .025, .055, .095, light, 0, active ? 1.3 : .1);
    box(x, 1.84, z + .336, .18, .24, .035, '#152838');
    for (let i = 0; i < 4; i++) box(x, 1.76 + i * .047, z + .357, .12, .02, .012, active ? '#50e361' : '#6b8293', 0, active ? 1.2 : .05);
    for (const side of [ -1, 1 ]) {
      tube([ [ x + side * .32, 3.04, z ], [ x + side * .49, 3.04, z ], [ x + side * .57, 2.97, z ], [ x + side * .57, 2.87, z ] ], .067, '#b3c9d4', {
        seg: 8,
        em: .05
      });
      orientedCylinder([ x + side * .28, 3.04, z ], [ x + side * .34, 3.04, z ], .1, '#40596b', {
        seg: 12
      });
    }
    ring(x, 2.27, z, .359, active ? '#62fe6d' : '#a1b3be', .033, {
      em: active ? 1.25 : .17,
      seg: 5
    });
    ring(x, 2.9, z, .362, active ? '#62ff73' : '#afbdc4', .033, {
      em: active ? 1.25 : .16,
      seg: 5
    });
    ring(x, 1.495, z, .43, active ? '#34d761' : '#5a8099', .027, {
      em: active ? .75 : .08,
      seg: 5
    });
    if (active) cylinder(x, 2.57, z, .4, .48, '#53fa56', {
      seg: 20,
      g: 2,
      alpha: .03,
      em: 1.1,
      caps: false
    });
  }
  const pumpMeshes = [];
  function pumpTopGeometry(mesh, x, z) {
    return mesh.map(group => {
      const vertices = new Float32Array(group);
      for (let k = 0; k < vertices.length; k += 13) {
        vertices[k] = x + (vertices[k] - x) * 1.03;
        vertices[k + 1] = 1.35 + (vertices[k + 1] - 1.35) * 1.3;
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
        group: group.name,
        index: i,
        x: x,
        z: z,
        on: on,
        off: off,
        topOn: pumpTopGeometry(on, x, z),
        topOff: pumpTopGeometry(off, x, z),
        active: null
      });
    });
  }
  const livePumpBuffers = [ 0, 1, 2 ].map(() => ({
    buf: gl.createBuffer(),
    count: 0
  }));
  const superiorPumpBuffers = [ 0, 1, 2 ].map(() => ({
    buf: gl.createBuffer(),
    count: 0
  }));
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
        normal.set(current, offset);
        superior.set(top, offset);
        offset += current.length;
      }
      for (const [output, arr] of [ [ livePumpBuffers[g], normal ], [ superiorPumpBuffers[g], superior ] ]) {
        gl.bindBuffer(gl.ARRAY_BUFFER, output.buf);
        gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW);
        output.count = arr.length / 13;
      }
    }
  }
  rebuildPumpBatches();
  const pipeBuffers = [ 0, 1, 2 ].map(() => ({
    buf: gl.createBuffer(),
    count: 0
  }));
  function rebuildPipeBuffers() {
    mvShadowDirty = true;
    const saved = A;
    A = [ [], [], [] ];
    pipeDefs.forEach((def, index) => pipe(def.nodes, def.r, def, index));
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
  refreshPipeLevels(null);
  const buffers = [];
  for (let group = 0; group < 3; group++) {
    const arr = new Float32Array(A[group]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
    buffers.push({
      buf: buf,
      count: arr.length / 13
    });
  }
  A.length = 0;
  function drawOpaqueScene() {
    const scene = buffers[0], first = terrainMesh.first;
    if (first > 0) {
      bindBuffer(scene);
      gl.drawArrays(gl.TRIANGLES, 0, first);
    }
    bindBuffer(terrainMesh);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, terrainMesh.elements);
    gl.drawElements(gl.TRIANGLES, terrainMesh.count, gl.UNSIGNED_SHORT, 0);
    if (scene.count > first) {
      bindBuffer(scene);
      gl.drawArrays(gl.TRIANGLES, first, scene.count - first);
    }
  }
  function bindBuffer(item) {
    gl.bindBuffer(gl.ARRAY_BUFFER, item.buf);
    const s = 13 * 4;
    gl.enableVertexAttribArray(loc.pos);
    gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, s, 0);
    gl.enableVertexAttribArray(loc.normal);
    gl.vertexAttribPointer(loc.normal, 3, gl.FLOAT, false, s, 12);
    gl.enableVertexAttribArray(loc.color);
    gl.vertexAttribPointer(loc.color, 3, gl.FLOAT, false, s, 24);
    gl.enableVertexAttribArray(loc.data);
    gl.vertexAttribPointer(loc.data, 4, gl.FLOAT, false, s, 36);
  }
  function perspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
    return [ f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0 ];
  }
  function lookAt(eye, center, up) {
    const z = norm(minus(eye, center)), x = norm(cross(up, z)), y = cross(z, x);
    return [ x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1 ];
  }
  function matMul(a, b) {
    const o = new Array(16);
    for (let col = 0; col < 4; col++) for (let row = 0; row < 4; row++) {
      let v = 0;
      for (let k = 0; k < 4; k++) v += a[k * 4 + row] * b[col * 4 + k];
      o[col * 4 + row] = v;
    }
    return o;
  }
  const focusAnchor = [ 0, 1.72, 1.05 ];
  const state = {
    yaw: 1.44,
    pitch: 1.02,
    dist: 41,
    zoom: 1.01,
    target: [ ...focusAnchor ],
    auto: false,
    water: true,
    flowSpeed: 1,
    labels: true,
    flowLabels: true,
    levels: true,
    userPanned: false
  };
  const initial = {
    yaw: 1.44,
    pitch: 1.02,
    zoom: 1.01,
    target: [ ...focusAnchor ]
  };
  const fitSamples = [];
  for (const p of tankLabels) {
    const extent = (p.radius || 1.6) + 1.15;
    for (const sx of [ -1, 1 ]) for (const sz of [ -1, 1 ]) {
      fitSamples.push([ p.x + sx * extent, 0, p.z + sz * extent ]);
      fitSamples.push([ p.x + sx * extent, p.y + .82, p.z + sz * extent ]);
    }
  }
  for (const f of flowReadings) {
    const x = f.x + (f.dx || 0) / 25, z = f.z + (f.dy || 0) / 24.5;
    fitSamples.push([ x - 2.2, .15, z - .9 ], [ x + 2.2, 1.5, z + .9 ]);
  }
  for (const item of facilityLabels) fitSamples.push([ item.x - 2.6, 0, item.z - 1.7 ], [ item.x + 2.6, 1.9, item.z + 1.7 ]);
  for (const pipe of pipeDefs) for (const p of pipe.nodes) fitSamples.push([ p[0], p[1], p[2] ]);
  function frameAxes(yaw, pitch) {
    const sp = Math.sin(pitch), cp = Math.cos(pitch), sy = Math.sin(yaw), cy = Math.cos(yaw);
    return {
      toward: [ sp * cy, cp, sp * sy ],
      right: [ sy, 0, -cy ],
      up: [ -cp * cy, sp, -cp * sy ]
    };
  }
  function frameParams() {
    const aspect = Math.max(.3, (vw || window.innerWidth) / (vh || window.innerHeight));
    const tanHalf = Math.tan(44 * Math.PI / 360);
    return {
      kx: tanHalf * aspect * (aspect < 1.05 ? 1.04 : 1.085),
      ky: tanHalf * (aspect < 1.05 ? 1.02 : 1.055)
    };
  }
  let fittedDistanceCache = null;
  function fitDistanceFromTarget(yaw, pitch, target) {
    if (fittedDistanceCache && fittedDistanceCache.yaw === yaw && fittedDistanceCache.pitch === pitch && fittedDistanceCache.w === vw && fittedDistanceCache.h === vh && fittedDistanceCache.x === target[0] && fittedDistanceCache.y === target[1] && fittedDistanceCache.z === target[2]) return fittedDistanceCache.distance;
    const {toward: toward, right: right, up: up} = frameAxes(yaw, pitch);
    const {kx: kx, ky: ky} = frameParams();
    let d = 15.5;
    for (const p of fitSamples) {
      const dx = p[0] - target[0], dy = p[1] - target[1], dz = p[2] - target[2];
      const near = toward[0] * dx + toward[1] * dy + toward[2] * dz;
      const px = right[0] * dx + right[2] * dz;
      const py = up[0] * dx + up[1] * dy + up[2] * dz;
      d = Math.max(d, near + Math.abs(px) / kx, near + Math.abs(py) / ky, near + 2);
    }
    const distance = Math.min(130, d + .18);
    fittedDistanceCache = {
      yaw: yaw,
      pitch: pitch,
      w: vw,
      h: vh,
      x: target[0],
      y: target[1],
      z: target[2],
      distance: distance
    };
    return distance;
  }
  let fittedPoseCache = null;
  function fitPose(yaw, pitch) {
    if (fittedPoseCache && fittedPoseCache.yaw === yaw && fittedPoseCache.pitch === pitch && fittedPoseCache.w === vw && fittedPoseCache.h === vh) return fittedPoseCache.result;
    const {toward: toward, right: right, up: up} = frameAxes(yaw, pitch);
    const {kx: kx, ky: ky} = frameParams();
    let rPlus = -Infinity, rMinus = Infinity, uPlus = -Infinity, uMinus = Infinity, maxNear = -Infinity;
    for (const p of fitSamples) {
      const dx = p[0] - focusAnchor[0], dy = p[1] - focusAnchor[1], dz = p[2] - focusAnchor[2];
      const near = toward[0] * dx + toward[1] * dy + toward[2] * dz;
      const r = right[0] * dx + right[2] * dz;
      const u = up[0] * dx + up[1] * dy + up[2] * dz;
      rPlus = Math.max(rPlus, r + kx * near);
      rMinus = Math.min(rMinus, r - kx * near);
      uPlus = Math.max(uPlus, u + ky * near);
      uMinus = Math.min(uMinus, u - ky * near);
      maxNear = Math.max(maxNear, near);
    }
    const shiftR = (rPlus + rMinus) * .5, shiftU = (uPlus + uMinus) * .5;
    const target = focusAnchor.map((v, i) => v + right[i] * shiftR + up[i] * shiftU);
    const distance = Math.max(15.5, (rPlus - rMinus) / (2 * kx), (uPlus - uMinus) / (2 * ky), maxNear + 1.55) + .18;
    const result = {
      target: target,
      dist: Math.min(140, distance)
    };
    fittedPoseCache = {
      yaw: yaw,
      pitch: pitch,
      w: vw,
      h: vh,
      result: result
    };
    return result;
  }
  function fitDistance(yaw, pitch) {
    return fitPose(yaw, pitch).dist;
  }
  const presentation = {
    active: false,
    paused: false,
    index: 0,
    clock: 0,
    interval: 9,
    rate: 1,
    transition: null,
    saved: null,
    dist: 18,
    sourceTime: '',
    sourceFresh: false,
    uiLast: -1
  };
  const presentationStartTank = tankSpecs.findIndex(tank => tank.name === 'SANTA ROSA 2');
  const presentationEndTank = tankSpecs.findIndex(tank => tank.name === 'LA CRUZ');
  const presentationOrder = presentationStartTank >= 0 && presentationEndTank >= 0 && tankSpecs.length > 2 ? [ ...Array.from({
    length: tankSpecs.length - presentationStartTank
  }, (_, i) => presentationStartTank + i), ...Array.from({
    length: presentationStartTank
  }, (_, i) => i + 1), presentationEndTank ].filter((index, i, all) => all.indexOf(index) === i) : tankSpecs.map((_, i) => i);
  const presentationPosition = () => Math.max(0, presentationOrder.indexOf(presentation.index));
  const presEl = id => document.getElementById(id);
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
  const presentationUi = {
    visible: true
  };
  const labelsHost = document.getElementById('labels');
  const topViewLayoutStyle = document.createElement('style');
  topViewLayoutStyle.textContent = `\n    #labels.top-view-active .top-card-tank{display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;min-height:43px;padding:0;border:1px solid #aebfc9;border-left:3px solid #005288;border-radius:3px;background:rgba(255,255,255,.97);color:#182b36;box-shadow:0 1px 3px rgba(15,31,40,.13);font-family:'Segoe UI',Arial,sans-serif;line-height:1.15;overflow:hidden}\n    #labels.top-view-active .top-tank-title{display:block;padding:3px 4px 2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;font-weight:600;letter-spacing:0;color:#253746;border-bottom:1px solid #e3eaf0}\n    #labels.top-view-active .top-tank-values{display:flex;align-items:center;justify-content:center;gap:5px;padding:3px 4px;min-width:0;white-space:nowrap}\n    #labels.top-view-active .top-tank-reading{font-size:12px;font-weight:600;color:#152b3a;font-variant-numeric:tabular-nums}\n    #labels.top-view-active .top-tank-delta{font-size:9px;font-weight:500;color:#17704f;font-variant-numeric:tabular-nums}\n    #labels.top-view-active .top-tank-delta.down{color:#b33436}\n    #labels.top-view-active .top-tank-delta.flat{color:#5d6d79}\n    #labels.top-view-active .top-card-flow{padding:3px 5px;min-width:0!important;border-color:#d1d9df;border-radius:2px;background:rgba(255,255,255,.95);box-shadow:0 1px 2px rgba(17,30,41,.10);overflow:hidden}\n    #labels.top-view-active .top-card-flow .n{display:block;font:500 9px/1.15 'Segoe UI',Arial,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:0;text-transform:none;color:#566470}\n    #labels.top-view-active .top-card-flow .v{font:600 11px/1.15 'Segoe UI',Arial,sans-serif;margin-top:2px;color:#203442}\n    #labels.top-view-active .top-card-flow .u{font-size:8px;font-weight:500;color:#566470}\n    #labels.top-view-active .top-card-name:not(.top-card-tank){padding:3px 6px;font:600 10px/1.2 'Segoe UI',Arial,sans-serif;max-width:132px;text-overflow:ellipsis;overflow:hidden}\n    .mv-alerts-strip{position:relative!important;overflow:visible!important}\n    .mv-alerts-strip>.mv-alerts-count{position:absolute!important;display:inline-flex!important;top:-5px!important;left:30px!important;z-index:10!important;align-items:center!important;justify-content:center!important;min-width:19px!important;height:19px!important;padding:0 3px!important;border:2px solid #fff!important;border-radius:12px!important;background:#d51c32!important;color:#fff!important;box-sizing:border-box!important;font:700 10px/1 'Segoe UI',Arial,sans-serif!important;white-space:nowrap!important;pointer-events:none!important;box-shadow:0 1px 3px #0003!important}\n    .mv-alerts-strip>.mv-alerts-count[hidden]{display:none!important}\n    @media(max-width:700px){#labels.top-view-active .top-card-tank{min-height:39px}#labels.top-view-active .top-tank-title{font-size:8px}#labels.top-view-active .top-tank-reading{font-size:11px}#labels.top-view-active .top-tank-delta{font-size:8px}.mv-alerts-strip>.mv-alerts-count{top:-4px!important;left:26px!important}}\n  `;
  document.head.appendChild(topViewLayoutStyle);
  const topViewUi = {
    built: false,
    tankCards: [],
    flowCards: [],
    facilityCards: [],
    visible: false,
    revision: -1,
    flags: '',
    matrix: null
  };
  let telemetryRevision = 0;
  let mvTopNextArrange = 0;
  let topViewSelected = false;
  function isTopViewMode() {
    return topViewSelected && !presentation.active;
  }
  function projectPointToScreen(x, y, z) {
    const w = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
    if (w <= .08) return null;
    return {
      x: (.5 + .5 * (vp[0] * x + vp[4] * y + vp[8] * z + vp[12]) / w) * vw,
      y: (.5 - .5 * (vp[1] * x + vp[5] * y + vp[9] * z + vp[13]) / w) * vh,
      w: w
    };
  }
  function buildTopViewOverlays() {
    if (topViewUi.built) return;
    topViewUi.built = true;
    labelsHost.innerHTML = '';
    topViewUi.tankCards = tankLabels.map(() => {
      const name = document.createElement('div');
      name.className = 'top-card top-card-tank';
      const title = document.createElement('span');
      title.className = 'top-tank-title';
      const values = document.createElement('div');
      values.className = 'top-tank-values';
      const reading = document.createElement('span');
      reading.className = 'top-tank-reading';
      const delta = document.createElement('span');
      delta.className = 'top-tank-delta';
      values.append(reading, delta);
      name.append(title, values);
      labelsHost.appendChild(name);
      return {
        name: name,
        title: title,
        reading: reading,
        delta: delta
      };
    });
    topViewUi.flowCards = flowReadings.map(() => {
      const el = document.createElement('div');
      el.className = 'top-card top-card-flow';
      el.innerHTML = '<span class="n">FLUJO</span><span class="v">N/D</span>';
      labelsHost.appendChild(el);
      return el;
    });
    topViewUi.facilityCards = facilityLabels.map(item => {
      const el = document.createElement('div');
      el.className = 'top-card top-card-name';
      el.textContent = item.name;
      labelsHost.appendChild(el);
      return el;
    });
  }
  function hideTopViewOverlays() {
    if (!topViewUi.visible) return;
    topViewUi.visible = false;
    labelsHost.classList.remove('top-view-active');
    if (!topViewUi.built) return;
    for (const card of topViewUi.tankCards) card.name.style.display = 'none';
    for (const el of topViewUi.flowCards) el.style.display = 'none';
    for (const el of topViewUi.facilityCards) el.style.display = 'none';
  }
  function updateTopViewOverlays() {
    buildTopViewOverlays();
    const flags = (state.labels ? '1' : '0') + (state.levels ? '1' : '0') + (state.flowLabels ? '1' : '0') + '|alertas:' + [ ...mvAlertsState.markers.keys() ].join('|');
    let unchanged = topViewUi.visible && topViewUi.revision === telemetryRevision && topViewUi.flags === flags && topViewUi.matrix !== null;
    if (unchanged) for (let i = 0; i < 16; i++) if (Math.abs(vp[i] - topViewUi.matrix[i]) > 2e-6) {
      unchanged = false;
      break;
    }
    if (unchanged) return;
    const topArrangeNow = performance.now();
    if (topViewUi.visible && topArrangeNow < mvTopNextArrange && topViewUi.revision === telemetryRevision && topViewUi.flags === flags) return;
    mvTopNextArrange = topArrangeNow + 105;
    topViewUi.visible = true;
    topViewUi.revision = telemetryRevision;
    topViewUi.flags = flags;
    if (!topViewUi.matrix) topViewUi.matrix = new Float32Array(16);
    topViewUi.matrix.set(vp);
    labelsHost.classList.add('top-view-active');
    const occupied = [];
    const padding = 5;
    const reserve = el => {
      if (!el || el.hidden || !el.getClientRects().length) return;
      const r = el.getBoundingClientRect();
      if (r.width && r.height) occupied.push({
        x1: r.left - 6,
        x2: r.right + 6,
        y1: r.top - 6,
        y2: r.bottom + 6
      });
    };
    reserve(document.getElementById('mvAlerts'));
    reserve(document.getElementById('controlsDock'));
    reserve(document.getElementById('mvLiveStatus'));
    reserve(document.getElementById('mvPanoramaHeading'));
    const visible = p => p && p.x >= -30 && p.x <= vw + 30 && p.y >= -30 && p.y <= vh + 30;
    const directions = [ [ 0, 0 ], [ 0, -1 ], [ 1, 0 ], [ 0, 1 ], [ -1, 0 ], [ .7, -.7 ], [ .7, .7 ], [ -.7, .7 ], [ -.7, -.7 ], [ .38, -.92 ], [ .92, -.38 ], [ .92, .38 ], [ .38, .92 ], [ -.38, .92 ], [ -.92, .38 ], [ -.92, -.38 ], [ -.38, -.92 ] ];
    const candidateOffsets = (el, maxRadius) => {
      const previousX = Number(el.dataset.offsetX), previousY = Number(el.dataset.offsetY);
      const points = [];
      if (Number.isFinite(previousX) && Number.isFinite(previousY)) points.push([ previousX, previousY ]);
      for (const radius of [ 0, 19, 38, 57, 78, 101, 126, maxRadius ]) {
        if (radius > maxRadius || radius < 0) continue;
        for (const [dx, dy] of directions) {
          if (radius === 0 && (dx || dy)) continue;
          points.push([ Math.round(dx * radius), Math.round(dy * radius) ]);
        }
      }
      return points;
    };
    const place = (el, pos, w, h, radius, strict = true, alertSpace = false) => {
      if (!visible(pos)) {
        el.style.display = 'none';
        return false;
      }
      let chosen = null, score = Infinity;
      for (const [dx, dy] of candidateOffsets(el, radius)) {
        const x = Math.max(w / 2 + 9, Math.min(vw - w / 2 - 9, pos.x + dx));
        const y = Math.max(h / 2 + 9, Math.min(vh - h / 2 - 9, pos.y + dy));
        const rect = {
          x1: x - w / 2 - padding,
          x2: x + w / 2 + padding,
          y1: y - h / 2 - padding - (alertSpace ? 17 : 0),
          y2: y + h / 2 + padding
        };
        let collisions = false;
        for (const used of occupied) {
          if (rect.x1 < used.x2 && rect.x2 > used.x1 && rect.y1 < used.y2 && rect.y2 > used.y1) {
            collisions = true;
            break;
          }
        }
        if (collisions) continue;
        const distance = Math.hypot(x - pos.x, y - pos.y);
        const cost = distance + Math.abs(y - pos.y) * .02;
        if (cost < score) {
          chosen = {
            x: x,
            y: y,
            rect: rect,
            dx: x - pos.x,
            dy: y - pos.y
          };
          score = cost;
        }
        if (distance < 3) break;
      }
      if (!chosen) {
        el.style.display = 'none';
        return false;
      }
      el.style.display = 'block';
      el.style.left = chosen.x.toFixed(1) + 'px';
      el.style.top = chosen.y.toFixed(1) + 'px';
      el.style.width = w.toFixed(0) + 'px';
      el.style.height = h.toFixed(0) + 'px';
      el.dataset.offsetX = chosen.dx.toFixed(0);
      el.dataset.offsetY = chosen.dy.toFixed(0);
      occupied.push(chosen.rect);
      return true;
    };
    const tanks = [];
    for (let i = 0; i < tankLabels.length; i++) {
      const p = tankLabels[i], spec = tankSpecs[i], card = topViewUi.tankCards[i];
      const pos = projectPointToScreen(p.x, .93, p.z);
      if (!visible(pos) || !state.labels && !state.levels) {
        card.name.style.display = 'none';
        continue;
      }
      const name = shortNames[spec.name] || spec.name;
      const meters = Number.isFinite(spec.meters) ? spec.meters : null;
      const delta = Number.isFinite(spec.delta) ? spec.delta : null;
      card.title.textContent = name;
      card.title.style.display = state.labels ? '' : 'none';
      card.reading.textContent = meters === null ? 'N/D' : meters.toFixed(2) + ' m';
      const trendDirection = mvTrendDirection(delta);
      card.delta.textContent = mvTrendDisplay(delta);
      card.delta.classList.toggle('down', trendDirection === 'down');
      card.delta.classList.toggle('flat', trendDirection === null);
      card.name.querySelector('.top-tank-values').style.display = state.levels ? '' : 'none';
      const width = Math.max(80, Math.min(142, Math.ceil(name.length * 5.15 + 18)));
      const height = state.labels && state.levels ? 44 : 26;
      tanks.push({
        card: card,
        pos: pos,
        width: width,
        height: height,
        hasAlert: mvAlertsState.markers.has(spec.name)
      });
    }
    for (const entry of tanks) {
      entry.density = tanks.filter(t => t !== entry && Math.hypot(t.pos.x - entry.pos.x, t.pos.y - entry.pos.y) < 100).length;
    }
    tanks.sort((a, b) => b.density - a.density || a.pos.x - b.pos.x);
    for (const entry of tanks) place(entry.card.name, entry.pos, entry.width, entry.height, 144, true, entry.hasAlert);
    for (let i = 0; i < facilityLabels.length; i++) {
      const item = facilityLabels[i], el = topViewUi.facilityCards[i];
      if (!state.labels) {
        el.style.display = 'none';
        continue;
      }
      const pos = projectPointToScreen(item.x, 2.4 * item.scale, item.z);
      if (!visible(pos)) {
        el.style.display = 'none';
        continue;
      }
      place(el, pos, Math.max(86, Math.min(128, item.name.length * 5.6 + 12)), 23, 92);
    }
    const flows = [];
    for (let i = 0; i < flowReadings.length; i++) {
      const f = flowReadings[i], el = topViewUi.flowCards[i];
      if (!state.flowLabels) {
        el.style.display = 'none';
        continue;
      }
      const pos = projectPointToScreen(f.x + (f.dx || 0) / 25, .55, f.z + (f.dy || 0) / 24.5);
      if (!visible(pos)) {
        el.style.display = 'none';
        continue;
      }
      const name = String(f.name || 'FLUJO').replace(/^RED\s+/i, '');
      const value = f.lps === null || !Number.isFinite(f.lps) ? 'N/D' : Math.round(f.lps).toLocaleString('es-MX');
      const title = el.querySelector('.n'), reading = el.querySelector('.v');
      if (title.textContent !== name) title.textContent = name;
      const number = value + ' <span class="u">LPS</span>';
      if (reading.innerHTML !== number) reading.innerHTML = number;
      el.title = name + ': ' + value + ' LPS';
      flows.push({
        pos: pos,
        el: el,
        width: Math.max(84, Math.min(121, name.length * 4.2 + 18)),
        priority: Number.isFinite(f.lps) && f.lps !== 0 ? 1 : 0
      });
    }
    flows.sort((a, b) => b.priority - a.priority);
    for (const item of flows) place(item.el, item.pos, item.width, 32, 126);
  }
  function setPresentationInfoVisible(visible, animate = true) {
    presentationUi.visible = !!visible;
    presEl('presentationPanel').hidden = !(presentation.active && presentationUi.visible);
    const info = presEl('presentationInfoToggle');
    info.disabled = !presentation.active;
    info.textContent = presentationUi.visible ? 'Ocultar información' : 'Mostrar información';
    info.setAttribute('aria-pressed', String(presentationUi.visible));
    info.setAttribute('title', presentationUi.visible ? 'Ocultar ficha y continuar la presentación' : 'Mostrar ficha del tanque actual');
    mvScheduleFitPresentation();
    if (presentation.active && presentationUi.visible) presentationData();
    if (presentation.active && animate) {
      const next = presentationPose(presentation.index);
      presentation.transition = {
        t0: performance.now(),
        duration: 550,
        from: {
          yaw: state.yaw,
          pitch: state.pitch,
          target: [ ...state.target ],
          dist: presentation.dist || state.dist
        },
        to: next
      };
    }
  }
  presEl('presentationInfoToggle').addEventListener('click', () => {
    if (presentation.active) setPresentationInfoVisible(!presentationUi.visible);
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
    'FRAILE 1': [ 'FRAILE 1 → FRAILE 3', 'BOMB. REAL DE MINAS' ],
    'FRAILE 2': [ 'FRAILE 2 → GARCÍA 1' ],
    'GARCÍA 1': [ 'GARCÍA 1 → GARCÍA 2' ],
    'ALIANZA REAL': [ 'ENTRADA ALIANZA REAL', 'BOMB. MITRAS PONIENTE' ],
    'NUEVA CASTILLA / AMP': [ 'ALIANZA REAL → NUEVA CASTILLA AMP' ],
    RECTANGULAR: [ 'NUEVA CASTILLA AMP → RECTANGULAR' ],
    'SANTA ROSA 2': [ 'RECTANGULAR → SANTA ROSA 2' ]
  };
  function pumpMiniature(state) {
    const icon = document.createElement('div');
    icon.className = 'presentation-pump-model';
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 64" aria-hidden="true" focusable="false">\n <rect x="7" y="56" width="40" height="5" rx="1" fill="#52616a"/>\n <rect x="12" y="53" width="31" height="3" fill="#8d9ba3"/>\n <rect x="13" y="16" width="29" height="37" rx="4" fill="#aab4bb" stroke="#64747f" stroke-width="1.4"/>\n <path d="M16 20h23v6H16zM16 31h23v5H16zM16 41h23v6H16z" fill="#7d8e98"/>\n <path d="M17 18h5v33h-5zM33 18h5v33h-5z" fill="#d9e0e4" opacity=".8"/>\n <path d="M11 24h33v5H11zM11 45h33v5H11z" fill="#4c5d67" stroke="#9fadb6" stroke-width=".6"/>\n <rect x="21" y="8" width="13" height="9" rx="2" fill="#7b8b96" stroke="#4d5e68"/>\n <ellipse cx="27" cy="7" rx="11" ry="4.4" fill="#a9b4bb" stroke="#566772" stroke-width="1.2"/>\n <ellipse cx="27" cy="7" rx="6" ry="2.2" fill="#42525f"/>\n <rect x="41" y="31" width="7" height="15" rx="1.2" fill="#6b7e89" stroke="#4d5b65" stroke-width="1"/>\n <path d="M45 33h2m-2 4h2m-2 4h2" stroke="#bac4c9" stroke-width=".7"/>\n <rect x="13" y="52" width="28" height="2" fill="#43535d"/>\n <rect class="pump-operation-core" x="24.5" y="31" width="5" height="13" rx="1" fill="#84939c"/>\n </svg>`;
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
      const block = document.createElement('section');
      block.className = 'presentation-pump-group';
      const title = document.createElement('div');
      title.className = 'presentation-pump-group-title';
      title.textContent = groupName;
      block.appendChild(title);
      const entries = document.createElement('div');
      entries.className = 'presentation-pump-grid mv-pump-count-' + Math.min(group.coords.length, 6);
      for (let i = 0; i < group.coords.length; i++) {
        const pump = pumpMeshes.find(p => p.group === groupName && p.index === i);
        const state = hasReceivedData && presentation.sourceFresh && pump ? pump.active : null;
        const category = state === true ? 'on' : state === false ? 'off' : 'unknown';
        const line = document.createElement('div');
        line.className = 'presentation-pump-item ' + category;
        line.setAttribute('aria-label', 'Equipo ' + (i + 1) + ': ' + (state === true ? 'Encendido' : state === false ? 'Apagado' : 'Sin dato'));
        line.appendChild(pumpMiniature(state));
        const number = document.createElement('span');
        number.className = 'presentation-pump-item-eq';
        number.textContent = 'Equipo ' + String(i + 1).padStart(2, '0');
        const status = document.createElement('span');
        status.className = 'presentation-pump-status ' + category;
        status.textContent = state === true ? 'Operando' : state === false ? 'Apagado' : 'Sin dato';
        line.append(number, status);
        entries.appendChild(line);
      }
      block.appendChild(entries);
      list.appendChild(block);
    }
    area.hidden = found === 0;
    note.hidden = !hasReceivedData || presentation.sourceFresh;
  }
  const presentationFlowMap = {
    "GARCÍA 2": [ [ "LPS 167", "lps_167" ] ],
    "GARCÍA 1": [ [ "LPS 0A", "lps_0a" ] ],
    "FRAILE 2": [ [ "LPS 0D", "lps_0d" ] ],
    "FRAILE 1": [ [ "LPS SALIDA FRAILE1", "lps_salida_fraile1" ] ],
    "ALIANZA REAL": [ [ "LPS 542", "lps_542" ] ],
    "NUEVA CASTILLA AMP": [ [ "LPS 908", "lps_908" ] ],
    "NUEVA CASTILLA 3 RECTANGULAR": [ [ "LPS NVA CAST 3 DOWN", "lps_nva_cast_3_down" ], [ "LPS 267", "lps_267" ] ],
    "NUEVA CASTILLA 3 CIRCULAR": [ [ "LPS 139", "lps_139" ] ],
    "SANTA ROSA 2": [ [ "LPS 8766", "lps_8766" ], [ "LPS SANTA ROSA2 SALIDA", "lps_santa_rosa2_salida" ], [ "LPS 211", "lps_211" ] ],
    ESCOBEDO: [ [ "LPS 304B", "lps_304b" ], [ "LPS ESCOBEDO RED DOWN 2", "lps_escobedo_red_down_2" ] ],
    APODACA: [ [ "LPS 304A", "lps_304a" ] ],
    "MIGUEL ALEMÁN": [ [ "LPS MIGUEL ALEMAN 0", "lps_miguel_aleman_0" ] ],
    "LA PAZ 2": [ [ "LPS LA PAZ2 DOWN ZERO", "lps_la_paz2_down_zero" ] ],
    "LA PAZ 1": [ [ "LPS LA PAZ1 DOWN ZERO", "lps_la_paz1_down_zero" ] ],
    "SAN ROQUE OTE": [ [ "Salida a Escobedo", "lps_SR_A_ESCOBEDO" ] ],
    "CAÑADA": [ [ "LPS 304C", "lps_304c" ], [ "LPS 304D", "lps_304d" ] ],
    PENAL: [ [ "Penal ↔ San Martín", "lps_penal-sanmartin" ], [ "LPS LL A PENAL", "lps_LL_A_PENAL" ], [ "LPS PENAL BOTTOM MANUAL", "lps_penal_bottom_manual" ] ],
    "TOPO CHICO": [ [ "LPS 0C", "lps_0c" ] ],
    "SAN MARTÍN 1": [ [ "LPS RED SANMARTIN", "lps_red_SanMartin" ], [ "LPS PENAL-SANMARTIN", "lps_penal-sanmartin" ] ],
    "SAN BERNABÉ RECTANGULAR": [ [ "LPS SAN BERN RECT ZERO", "lps_san_bern_rect_zero" ] ],
    "SAN BERNABÉ CIRCULAR": [ [ "REDSB CIRCULAR", "redSB_circular" ] ],
    "LOMA LARGA": [ [ "LPS LOMALARGAOBISPADO", "lps_lomalargaobispado" ], [ "LPS LOMALARGAVALLE", "lps_lomalargavalle" ], [ "LPS LOMALARGARED", "lps_lomalargared" ] ],
    "ALTAMIRA 2": [ [ "LPS A ALLTAMIRA3", "lps_a_alltamira3" ] ],
    "LA SILLA 1": [ [ "LPS LA SILLA1 DOWN MANUAL", "lps_la_silla1_down_manual" ] ],
    "JUÁREZ": [ [ "LPS LLEGADAJUAREZ", "lps_llegadajuarez" ], [ "LPS SALIDAJUAREZ", "lps_salidajuarez" ] ],
    "ARBOLEDAS 2": [ [ "ARB2-SALIDO-ARB3", "arb2-salido-arb3" ] ],
    SUR: [ [ "Sur → Red 36″", "lps_sur-red36" ], [ "Sur → Red 24″", "lps_sur-red24" ] ]
  };
  const presentationEligibleIndices = tankSpecs.map((tank, index) => index);
  let presentationFlowRecords = {};
  function renderPresentationFlows(tankName) {
    const host = presEl('presentationFlowReadings');
    host.replaceChildren();
    const refs = presentationFlowMap[tankName] || [];
    const section = host.closest('.presentation-flow');
    if (section) {
      section.hidden = refs.length === 0;
      section.style.display = refs.length ? '' : 'none';
    }
    if (!refs.length) return;
    const formatter = new Intl.NumberFormat('es-MX', {
      maximumFractionDigits: 2
    });
    for (const [name, key] of refs) {
      const record = key ? presentationFlowRecords[key] : null;
      const value = record ? numberOrNull(record.lps) : null;
      const valid = hasReceivedData && value !== null;
      const row = document.createElement('div');
      row.className = 'presentation-flow-row';
      const label = document.createElement('span');
      label.textContent = flowDisplayNames[key] || name;
      const reading = document.createElement('strong');
      reading.textContent = valid ? formatter.format(value) + ' LPS' : 'N/D';
      const stale = valid && (!presentation.sourceFresh || record.estado === 'sin_comunicacion');
      if (stale) {
        reading.classList.add('stale');
        reading.title = 'Última lectura disponible, comunicación no confirmada';
      }
      row.append(label, reading);
      if (stale) {
        const warning = document.createElement('small');
        warning.textContent = 'Sin comunicación confirmada';
        row.appendChild(warning);
      }
      host.appendChild(row);
    }
  }
  const MV_HISTORY_API_PATHS = [ '/Telemetria/Php/anillo_tv_3d_historial.php', '/Telemetria/php/anillo_tv_3d_historial.php' ];
  const MV_HISTORY_TTL_MS = 3e4;
  const MV_HISTORY_WINDOW_MS = 60 * 6e4;
  const mvHistoryLiveSamples = new Map;
  const mvHistoryLiveVersions = new Map;
  const mvHistoryCache = new Map;
  const mvHistoryClock = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Monterrey'
  });
  const mvHistoryNumber = new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 1
  });
  let mvHistoryCurrentTank = '';
  let mvHistoryFlowId = '';
  let mvHistoryRequest = null;
  let mvHistorySignature = '';
  const mvHistoryFormatTime = ms => mvHistoryClock.format(new Date(ms));
  const mvHistoryStyle = document.createElement('style');
  mvHistoryStyle.textContent = `\n    #presentationPanel .presentation-secondary-table{display:none!important}\n    #presentationPanel #presentationUpdated{display:none!important}\n    #presentationPanel .presentation-primary-value{font-weight:400!important}\n    #presentationPanel .presentation-flow-row strong{font-weight:400!important}\n    #presentationPanel .presentation-pumps{text-align:center}\n    #presentationPanel .presentation-pump-group-title{text-align:center}\n    #presentationPanel .presentation-pump-grid{grid-template-columns:repeat(2,minmax(0,1fr));justify-content:space-between}\n    #presentationPanel .mv-dual-history{margin:12px 0 8px;border:1px solid #d5d9dd;border-radius:2px;background:#ffffff;color:#111111;font-family:'Segoe UI',Tahoma,Arial,sans-serif;box-shadow:none;overflow:hidden}\n    #presentationPanel .mv-dh-body{display:block;padding:0 11px}\n    #presentationPanel .mv-dh-card{background:#fff;border:0;border-radius:0;padding:11px 0 9px;min-width:0;box-shadow:none}\n    #presentationPanel .mv-dh-flow{border-top:1px solid #dedede}\n    #presentationPanel .mv-dh-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 3px}\n    #presentationPanel .mv-dh-card-name{display:flex;align-items:center;gap:8px;color:#111111;font-size:11.5px;font-weight:400;letter-spacing:0}\n    #presentationPanel .mv-dh-symbol{display:none!important}\n    #presentationPanel .mv-dh-flow .mv-dh-symbol{background:#6c757d;box-shadow:none}\n    #presentationPanel .mv-dh-value{color:#111111;font-size:17px;font-weight:400;letter-spacing:0;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}\n    #presentationPanel .mv-dh-flow .mv-dh-value{color:#111111}\n    #presentationPanel .mv-dh-value small{color:#111111;font-size:10px;font-weight:500;letter-spacing:0}\n    #presentationPanel .mv-dh-flow-choice{display:block;width:100%;margin:3px 0 6px;min-height:26px;padding:3px 7px;border:1px solid #c6d4dc;border-radius:2px;background:#f8fafb;color:#314c5d;font:500 11px 'Segoe UI',Tahoma,Arial,sans-serif}\n    #presentationPanel .mv-dh-flow-choice[hidden]{display:none}\n    #presentationPanel .mv-dh-plot{position:relative;width:100%;height:137px;min-width:0;overflow:visible;background:transparent}\n    #presentationPanel .mv-dh-plot svg{width:100%;height:100%;display:block;overflow:hidden}\n    #presentationPanel .mv-dh-plot svg .mv-dh-solid-area{fill-opacity:1!important;opacity:1!important;mix-blend-mode:normal!important}\n    #presentationPanel .mv-dh-foot{display:flex;align-items:center;justify-content:flex-end;gap:7px;padding:5px 1px 0;border-top:1px solid #e4e4e4;color:#111111;font-size:10px;line-height:1.3}\n    #presentationPanel .mv-dh-foot span:first-child{display:none!important}\n    #presentationPanel .mv-dh-foot span:last-child{font-weight:500;text-align:right}\n    #presentationPanel .mv-dh-empty{display:flex;align-items:center;justify-content:center;min-height:100px;height:100%;padding:9px;text-align:center;color:#6b7c86;font-size:11px;line-height:1.5}\n    #presentationPanel .mv-dh-tooltip{position:absolute;z-index:5;pointer-events:none;background:#274455;border:0;color:#fff;padding:4px 7px;border-radius:2px;font-weight:600;font-size:10.5px;line-height:1.35;box-shadow:none;white-space:nowrap;transform:translate(-50%,-105%)}\n    #presentationPanel .mv-dh-tooltip[hidden]{display:none}\n    #presentationPanel .mv-dh-cursor{pointer-events:none}\n    #presentationPanel .mv-dh-message{margin:0 11px 10px;padding:7px 0;border:0;border-top:1px solid #e0e7ed;border-radius:0;background:#fff;color:#667b88;font-size:10px;line-height:1.45}\n    #presentationPanel .mv-dh-message[hidden]{display:none}\n    #presentationPanel .mv-dh-flow:empty{display:none}\n    @media(max-width:700px){#presentationPanel .mv-dh-body{padding:0 9px}#presentationPanel .mv-dh-card{padding:9px 0 8px}#presentationPanel .mv-dh-plot{height:121px}#presentationPanel .mv-dh-value{font-size:16px}}\n    #presentationPanel .presentation-pumps{text-align:left}\n    #presentationPanel .presentation-pumps-title{text-align:left;color:#263641;font-size:12px;font-weight:600}\n    #presentationPanel .presentation-pump-group{display:block;width:100%;box-sizing:border-box}\n    #presentationPanel .presentation-pump-group-title{width:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:7px;text-align:left;padding:5px 8px;margin-bottom:4px;background:#eff3f5;border-left:3px solid #57788c;color:#334854;font-size:10.5px;font-weight:600;line-height:1.25;letter-spacing:.01em}\n    #presentationPanel .mv-pump-group-count{font-size:9px;white-space:nowrap;color:#63737e;font-weight:400;letter-spacing:0}\n    #presentationPanel .presentation-pump-grid{display:grid;width:100%;box-sizing:border-box;grid-template-columns:repeat(2,minmax(0,1fr));justify-content:stretch;justify-items:stretch;column-gap:11px;row-gap:0;padding:0 5px}\n    #presentationPanel .presentation-pump-item{width:100%;max-width:none;min-width:0;box-sizing:border-box;text-align:left;justify-self:stretch;padding:4px 5px}\n    #presentationPanel .presentation-pump-item-eq{font-weight:500}\n    @media(max-width:390px){#presentationPanel .presentation-pump-grid{column-gap:5px;padding:0 2px}#presentationPanel .presentation-pump-item{padding:4px 1px}}\n\n    @media (min-width:701px) and (min-height:560px) {\n      #presentationPanel.mv-fit-no-scroll:not([hidden]){top:var(--mv-fit-top,9px)!important;right:13px!important;bottom:auto!important;transform:scale(var(--mv-fit-scale,1))!important;transform-origin:top right!important;width:min(444px,calc(100vw - 30px))!important;max-height:none!important;height:auto!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}\n      #presentationPanel.mv-fit-no-scroll.mv-presentation-lower:not([hidden]){top:var(--mv-fit-top,9px)!important;transform:scale(var(--mv-fit-scale,1))!important;}\n      #presentationPanel.mv-fit-no-scroll .presentation-head{flex:0 0 auto!important;padding:10px 14px 8px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-head-top{min-height:0!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-tank-title{margin:3px 0 0!important;font-size:20px!important;line-height:1.2!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-progress-track{flex:0 0 2px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-content{flex:0 0 auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;padding:7px 13px 6px!important;overscroll-behavior:contain}\n      #presentationPanel.mv-fit-no-scroll .presentation-readings{padding-bottom:6px!important;margin-bottom:4px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-reading{padding-top:0!important;padding-bottom:0!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-reading-label{margin-bottom:3px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-primary-value{font-weight:400!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-flow{padding:5px 0!important;margin:3px 0 5px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-flow-heading{margin-bottom:3px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-flow-row{padding:3px 0!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-flow-row strong{font-weight:400!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dual-history{margin:7px 0 5px!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-body{padding:0 11px!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-card{padding:6px 0 5px!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-card-head{margin-bottom:2px!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-plot{height:var(--mv-fit-plot-height,148px)!important;min-height:136px!important;flex:none!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-foot{padding-top:3px!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-message{margin:0 11px 6px!important;padding:4px 0!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pumps{margin-top:5px!important;padding-top:6px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pumps-title{font-size:12px!important;margin-bottom:4px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-group{margin-bottom:3px!important;padding-bottom:2px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-group+.presentation-pump-group{margin-top:3px!important;padding-top:5px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-group-title{font-size:10.5px!important;margin-bottom:4px!important;padding:4px 7px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-grid{width:100%!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;column-gap:11px!important;row-gap:1px!important;justify-content:stretch!important;justify-items:stretch!important;padding:0 5px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-grid.mv-fit-three{grid-template-columns:repeat(2,minmax(0,1fr))!important;column-gap:11px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-item{width:100%!important;max-width:none!important;justify-self:stretch!important;grid-template-columns:28px minmax(0,1fr)!important;grid-template-rows:16px 15px!important;column-gap:6px!important;min-height:35px!important;padding:1px 3px!important;white-space:nowrap!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-model{width:28px!important;height:32px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-model svg{width:27px!important;height:31px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-item-eq{font-size:10.5px!important;font-weight:500!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-status{font-size:10px!important;gap:3px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-status::before{width:5px!important;height:5px!important;flex-basis:5px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-actions{flex:0 0 auto!important;padding:7px 11px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-actions>button{min-height:32px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .presentation-content{flex:1 1 auto!important;display:flex!important;flex-direction:column!important;justify-content:center!important}\n      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .presentation-readings{margin-top:auto!important}\n      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .presentation-flow{display:none!important}\n      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .mv-dual-history{margin:9px 0!important}\n      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .presentation-pumps{display:none!important}\n      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .presentation-actions{margin-top:auto!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-head{padding:7px 12px 6px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-tank-title{font-size:18px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-content{padding:4px 12px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-readings{padding-bottom:4px!important;margin-bottom:2px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-flow{padding:3px 0!important;margin:2px 0!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-flow-row{padding:2px 0!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .mv-dual-history{margin:4px 0!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .mv-dh-card{padding:3px 0!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-pumps{margin-top:2px!important;padding-top:3px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-pump-item{grid-template-rows:14px 13px!important;min-height:29px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-pump-model{height:28px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-pump-model svg{height:27px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-actions{padding:5px 9px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-overflow .presentation-content{overflow:visible!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-overflow:not([hidden]){top:9px!important;max-height:calc(100dvh - 18px)!important;overflow-y:auto!important;overflow-x:hidden!important;transform:none!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-overflow .mv-dh-plot{height:148px!important;min-height:136px!important}\n    }\n    #presentationPanel .presentation-primary-value{font-weight:400!important}\n    #presentationPanel .presentation-pump-grid{display:flex!important;flex-wrap:wrap!important;align-items:flex-start!important;justify-content:center!important;gap:4px 9px!important;width:100%!important;max-width:100%!important}\n    #presentationPanel .presentation-pump-grid .presentation-pump-item{flex:0 1 calc((100% - 9px)/2)!important;box-sizing:border-box!important;min-width:0!important;max-width:none!important;width:auto!important;margin:0!important;justify-self:auto!important}\n    #presentationPanel .presentation-pump-grid.mv-pump-count-1 .presentation-pump-item{flex:0 1 170px!important}\n    #presentationPanel .presentation-pump-grid.mv-pump-count-2 .presentation-pump-item{flex:0 1 calc((100% - 9px)/2)!important}\n    #presentationPanel .presentation-pump-grid.mv-pump-count-3 .presentation-pump-item{flex:0 1 calc((100% - 18px)/3)!important}\n    #presentationPanel .presentation-pump-grid.mv-pump-count-5 .presentation-pump-item:last-child{flex:0 1 calc((100% - 9px)/2)!important}\n    #presentationPanel .presentation-pump-item.on .presentation-pump-model svg{filter:brightness(0) saturate(100%) invert(40%) sepia(52%) saturate(874%) hue-rotate(95deg) brightness(96%)!important}\n    #presentationPanel .presentation-pump-item.off .presentation-pump-model svg,#presentationPanel .presentation-pump-item.unknown .presentation-pump-model svg{filter:grayscale(1) brightness(.85)!important}\n    @media(max-width:700px){#presentationPanel .presentation-pump-grid.mv-pump-count-3 .presentation-pump-item{flex:0 1 calc((100% - 9px)/2)!important}}\n    #presentationPanel .presentation-flow-row strong{font-weight:400!important}\n    #presentationPanel .mv-dh-value{font-weight:400!important}\n\n    @media (min-width:701px) and (min-height:520px) {\n      #presentationPanel.mv-fit-no-scroll:not([hidden]){width:min(420px,calc(100vw - 30px))!important;top:var(--mv-fit-top,9px)!important;right:13px!important;bottom:auto!important;transform:scale(var(--mv-fit-scale,1))!important;transform-origin:top right!important;max-height:none!important;height:max-content!important;min-height:0!important;overflow:visible!important;contain:none!important;display:flex!important;flex-direction:column!important}\n      #presentationPanel.mv-fit-no-scroll.mv-presentation-lower:not([hidden]){top:var(--mv-fit-top,9px)!important;transform:scale(var(--mv-fit-scale,1))!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-content{flex:0 0 auto!important;height:auto!important;max-height:none!important;min-height:0!important;overflow:visible!important;padding:6px 13px 5px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-head{padding:9px 13px 7px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-tank-title{font-size:20px!important;line-height:1.2!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-actions{flex:0 0 auto!important;padding:7px 11px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-actions>button{min-height:31px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-readings{padding-bottom:6px!important;margin-bottom:3px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-reading{padding:2px 0!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-flow{margin:3px 0 5px!important;padding:3px 0!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-flow-heading{margin-bottom:2px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-flow-grid .presentation-flow-row{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:7px!important;min-width:0!important;padding:2px 0!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-flow-grid .presentation-flow-row span{min-width:0!important;white-space:normal!important;line-height:1.16!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-flow-grid .presentation-flow-row strong{flex:0 0 auto!important;font-size:11.5px!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dual-history{margin:6px 0 4px!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-body{padding:0 10px!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-card{min-width:0!important;padding:7px 0 5px!important;border:0!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-plot{height:var(--mv-fit-plot-height,174px)!important;min-height:0!important;max-height:none!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-card-head{margin-bottom:2px!important;min-height:22px!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-flow-choice{min-height:25px!important;margin:3px 0 5px!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-foot{padding-top:3px!important;white-space:nowrap!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-message{margin:0 10px 5px!important;padding:3px 0!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pumps{margin-top:5px!important;padding-top:5px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pumps-title{font-size:12px!important;margin:0 0 3px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-group{margin:0 0 3px!important;padding:3px 0!important;border:0!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-group-title{font-size:10px!important;margin:0 0 3px!important;padding:3px 7px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-grid{gap:1px 9px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-item{min-height:29px!important;padding:0 3px!important;grid-template-columns:25px minmax(0,1fr)!important;grid-template-rows:14px 13px!important;column-gap:6px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-model{height:28px!important;width:25px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-model svg{height:27px!important;width:25px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-item-eq{font-size:10.5px!important;font-weight:500!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-status{font-size:10px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-head{padding:6px 12px 5px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-content{padding:3px 11px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .mv-dh-card{padding:3px 0!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-flow-row{padding:1px 0!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-pump-group{margin-bottom:1px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-actions{padding:5px 9px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .presentation-content{display:flex!important;flex:1 1 auto!important;flex-direction:column!important;justify-content:center!important}\n      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .presentation-actions{margin-top:auto!important}\n    }\n    #presentationPanel .presentation-pump-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-items:start!important;justify-content:center!important;justify-items:stretch!important;column-gap:10px!important;row-gap:2px!important;width:min(100%,390px)!important;max-width:390px!important;margin:3px auto!important;padding:0 3px!important}\n    #presentationPanel .presentation-pump-grid .presentation-pump-item{width:100%!important;max-width:none!important;min-width:0!important;margin:0!important;justify-self:stretch!important;box-sizing:border-box!important;text-align:left!important}\n    #presentationPanel .presentation-pump-grid.mv-pump-count-1 .presentation-pump-item,#presentationPanel .presentation-pump-grid.mv-pump-count-3 .presentation-pump-item:last-child,#presentationPanel .presentation-pump-grid.mv-pump-count-5 .presentation-pump-item:last-child{grid-column:1/-1!important;justify-self:center!important;width:calc((100% - 10px)/2)!important}\n    #presentationPanel .presentation-pump-item.on .presentation-pump-model svg{filter:brightness(0) saturate(100%) invert(40%) sepia(58%) saturate(850%) hue-rotate(95deg) brightness(98%)!important}\n    #presentationPanel .presentation-pump-item.off .presentation-pump-model svg,#presentationPanel .presentation-pump-item.unknown .presentation-pump-model svg{filter:grayscale(1) brightness(.86)!important}\n    #presentationPanel .presentation-primary-value{font-weight:400!important}\n    #presentationPanel .presentation-flow-row strong{font-weight:400!important}\n    #presentationPanel .mv-dh-value{font-weight:400!important}\n  `;
  document.head.appendChild(mvHistoryStyle);
  const mvHistorySection = document.createElement('section');
  mvHistorySection.className = 'mv-dual-history';
  mvHistorySection.setAttribute('aria-label', 'Histórico de nivel y flujo del tanque');
  mvHistorySection.innerHTML = `\n    <div class="mv-dh-body">\n      <section class="mv-dh-card mv-dh-level" aria-label="Gráfica de nivel">\n        <div class="mv-dh-card-head"><span class="mv-dh-card-name"><i class="mv-dh-symbol" aria-hidden="true"></i>NIVEL</span><span class="mv-dh-value" id="mvDHLevelLatest">N/D</span></div>\n        <div class="mv-dh-plot" id="mvDHLevelPlot" role="img" aria-label="Evolución reciente del nivel en metros"></div>\n        <div class="mv-dh-foot"><span id="mvDHLevelCount">Consultando lecturas</span><span id="mvDHLevelTime">m</span></div>\n      </section>\n      <section class="mv-dh-card mv-dh-flow" aria-label="Gráfica de flujo">\n        <div class="mv-dh-card-head"><span class="mv-dh-card-name"><i class="mv-dh-symbol" aria-hidden="true"></i>FLUJO</span><span class="mv-dh-value" id="mvDHFlowLatest">N/D</span></div>\n        <select id="mvDHFlowChoice" class="mv-dh-flow-choice" aria-label="Medidor de flujo" hidden></select>\n        <div class="mv-dh-plot" id="mvDHFlowPlot" role="img" aria-label="Evolución reciente del flujo en litros por segundo"></div>\n        <div class="mv-dh-foot"><span id="mvDHFlowCount">Consultando lecturas</span><span id="mvDHFlowTime">LPS</span></div>\n      </section>\n    </div>\n    <div id="mvDHMessage" class="mv-dh-message" hidden></div>`;
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
    const desktop = window.innerWidth >= 701 && window.innerHeight >= 520;
    panel.classList.toggle('mv-fit-no-scroll', desktop);
    panel.classList.remove('mv-fit-tight', 'mv-fit-dense', 'mv-fit-overflow', 'mv-fit-dual-graphs');
    panel.style.removeProperty('--mv-fit-plot-height');
    panel.style.removeProperty('--mv-fit-scale');
    panel.style.removeProperty('--mv-fit-top');
    panel.style.removeProperty('transform');
    const flowHost = presEl('presentationFlowReadings');
    const flowCount = flowHost ? flowHost.children.length : 0;
    const pumpHost = presEl('presentationPumpList');
    const hasPumps = !!(pumpHost && pumpHost.children.length && !presEl('presentationPumps').hidden);
    const hasFlowChart = mvFlowCard.style.display !== 'none' && !mvFlowCard.hidden;
    const minimal = !hasFlowChart && !flowCount && !hasPumps;
    panel.classList.toggle('mv-center-minimal', minimal);
    if (!desktop || panel.hidden || !presentation.active || !presentationUi.visible) return;
    const space = Math.max(180, window.innerHeight - 18);
    const graphWidth = Math.max(250, mvLevelPlot.clientWidth || panel.clientWidth - 46);
    const graphHeight = hasFlowChart ? Math.max(158, Math.min(190, Math.round(graphWidth * .46))) : Math.max(180, Math.min(224, Math.round(graphWidth * .55)));
    panel.style.setProperty('--mv-fit-plot-height', graphHeight + 'px');
    const neededHeight = () => Math.ceil(Math.max(panel.scrollHeight, panel.getBoundingClientRect().height));
    let required = neededHeight();
    if (required > space) {
      panel.classList.add('mv-fit-dense');
      required = neededHeight();
    }
    if (required > space) {
      const graphMin = hasFlowChart ? 165 : 188;
      const reduced = Math.max(graphMin, graphHeight - Math.ceil((required - space) * .28));
      panel.style.setProperty('--mv-fit-plot-height', reduced + 'px');
      required = neededHeight();
    }
    const scale = Math.min(1, (space - 2) / Math.max(1, required));
    const visibleHeight = required * scale;
    const lower = panel.classList.contains('mv-presentation-lower') || minimal;
    const top = lower ? Math.max(9, (window.innerHeight - visibleHeight) / 2) : 9;
    panel.style.setProperty('--mv-fit-scale', scale.toFixed(5));
    panel.style.setProperty('--mv-fit-top', top.toFixed(1) + 'px');
    mvRefreshGraphGeometry();
  }
  function mvRefreshGraphGeometry() {
    if (!presentation.active || !presentationUi.visible || !mvHistoryCurrentTank) return;
    const plots = [ mvLevelPlot, mvFlowPlot ];
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
    "GARCÍA 2": {
      FL0000001: "lps_167"
    },
    "GARCÍA 1": {
      FL0000001: "lps_0a"
    },
    "FRAILE 2": {
      FL0000001: "lps_0d"
    },
    "FRAILE 1": {
      FL0000001: "lps_salida_fraile1"
    },
    "ALIANZA REAL": {
      FL0000001: "lps_542"
    },
    "NUEVA CASTILLA AMP": {
      FL0000001: "lps_908"
    },
    "SANTA ROSA 2": {
      FL0000001: "lps_8766",
      FL0000002: "lps_santa_rosa2_salida",
      FL0000003: "lps_211"
    },
    ESCOBEDO: {
      FL0000002: "lps_304b"
    },
    APODACA: {
      FL0000001: "lps_304a"
    },
    "MIGUEL ALEMÁN": {
      FL0000001: "lps_miguel_aleman_0"
    },
    "LA PAZ 2": {
      FL0000001: "lps_la_paz2_down_zero"
    },
    "LA PAZ 1": {
      FL0000001: "lps_la_paz1_down_zero"
    },
    "CAÑADA": {
      FL0000001: "lps_304c",
      FL0000002: "lps_304d"
    },
    PENAL: {
      FL0000001: "lps_LL_A_PENAL",
      FL0000003: "lps_penal_bottom_manual"
    },
    "TOPO CHICO": {
      FL0000001: "lps_0c"
    },
    "SAN MARTÍN 1": {
      FL0000001: "lps_red_SanMartin",
      FL0000002: "lps_penal-sanmartin"
    },
    "SAN BERNABÉ RECTANGULAR": {
      FL0000001: "lps_san_bern_rect_zero"
    },
    "LOMA LARGA": {
      FL0000002: "lps_lomalargaobispado",
      FL0000003: "lps_lomalargavalle",
      FL0000001: "lps_lomalargared"
    },
    "ALTAMIRA 2": {
      FL0000001: "lps_a_alltamira3"
    },
    "LA SILLA 1": {
      FL0000001: "lps_la_silla1_down_manual"
    },
    "JUÁREZ": {
      FL0000001: "lps_llegadajuarez",
      FL0000002: "lps_salidajuarez"
    },
    "ARBOLEDAS 2": {
      FL0000001: "arb2-salido-arb3"
    }
  };
  function mvRecordLiveHistory() {
    const now = Date.now();
    for (const spec of tankSpecs) {
      if (spec.state !== 'actual') continue;
      let live = mvHistoryLiveSamples.get(spec.name);
      if (!live) {
        live = {
          nivel: [],
          flujos: new Map
        };
        mvHistoryLiveSamples.set(spec.name, live);
      }
      let changed = false;
      const record = (series, value) => {
        if (!Number.isFinite(value)) return false;
        const last = series[series.length - 1];
        if (last && now - last[0] < 8e3) return false;
        series.push([ now, value ]);
        const minTime = now - MV_HISTORY_WINDOW_MS - 12e4;
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
    const recent = samples.filter(item => Array.isArray(item) && Number.isFinite(item[0]) && Number.isFinite(item[1]) && item[0] >= startTime && item[0] <= endTime + 6e4).sort((a, b) => a[0] - b[0]);
    if (!recent.length) return null;
    const isFlow = hue === 'flow';
    const fmt = v => unit === 'm' ? v.toFixed(2) : mvHistoryNumber.format(v);
    const values = recent.map(point => point[1]);
    const minValue = Math.min(...values), maxValue = Math.max(...values);
    const spread = Math.max(unit === 'm' ? .11 : 2, (maxValue - minValue) * .2);
    const low = Math.max(0, minValue - spread), high = Math.max(maxValue + spread, low + (unit === 'm' ? .2 : 3));
    const W = Math.max(200, Math.round(plot.clientWidth || 380)), H = Math.max(128, Math.round(plot.clientHeight || 145)), L = 42, R = 48, T = 10, B = 22;
    const pw = W - L - R, ph = H - T - B, base = T + ph;
    const xAt = t => L + (t - startTime) / (endTime - startTime) * pw;
    const yAt = v => T + (high - v) / (high - low) * ph;
    const coords = recent.map(point => [ xAt(point[0]), yAt(point[1]) ]);
    const color = isFlow ? '#4f5b66' : '#0058b7';
    const font = 'font-family="Segoe UI,Arial" font-size="10" style="font-variant-numeric:tabular-nums"';
    let grid = `<rect x="${L}" y="${T}" width="${pw}" height="${ph}" fill="#ffffff" stroke="#c3ccd4" stroke-width="1"/>`;
    for (let i = 0; i <= 4; i++) {
      const y = T + ph * i / 4;
      const value = high - (high - low) * i / 4;
      if (i > 0 && i < 4) grid += `<line x1="${L}" x2="${L + pw}" y1="${y.toFixed(2)}" y2="${y.toFixed(2)}" stroke="#e9eef2" stroke-width="1"/>`;
      grid += `<line x1="${L - 4}" x2="${L}" y1="${y.toFixed(2)}" y2="${y.toFixed(2)}" stroke="#8a98a5" stroke-width="1"/>`;
      grid += `<text x="${L - 7}" y="${(y + 3.5).toFixed(2)}" text-anchor="end" fill="#3d4852" ${font}>${unit === 'm' ? value.toFixed(2) : mvHistoryNumber.format(Math.round(value))}</text>`;
    }
    for (let i = 0; i <= 6; i++) {
      const x = L + pw * i / 6;
      const when = startTime + (endTime - startTime) * i / 6;
      if (i > 0 && i < 6) grid += `<line x1="${x.toFixed(2)}" x2="${x.toFixed(2)}" y1="${T}" y2="${base}" stroke="#f0f3f6" stroke-width="1"/>`;
      grid += `<line x1="${x.toFixed(2)}" x2="${x.toFixed(2)}" y1="${base}" y2="${base + 4}" stroke="#8a98a5" stroke-width="1"/>`;
      if (i % 2 === 0) grid += `<text x="${x.toFixed(2)}" y="${H - 6}" text-anchor="${i === 0 ? 'start' : i === 6 ? 'end' : 'middle'}" fill="#3d4852" ${font}>${mvHistoryFormatTime(when)}</text>`;
    }
    let strokes = '', dots = '', segment = [];
    const flush = () => {
      if (!segment.length) return;
      const path = segment.map((pt, index) => (index ? 'L' : 'M') + pt[0].toFixed(2) + ',' + pt[1].toFixed(2)).join(' ');
      if (segment.length > 1) {
        strokes += `<path d="${path} L${segment[segment.length - 1][0].toFixed(2)},${base} L${segment[0][0].toFixed(2)},${base} Z" fill="${color}" fill-opacity=".07"/>`;
        strokes += `<path d="${path}" fill="none" stroke="${color}" stroke-width="1.7" stroke-linejoin="miter"/>`;
      }
      for (const pt of segment) dots += `<rect x="${(pt[0] - 2).toFixed(2)}" y="${(pt[1] - 2).toFixed(2)}" width="4" height="4" fill="#ffffff" stroke="${color}" stroke-width="1.2"/>`;
      segment = [];
    };
    for (let i = 0; i < coords.length; i++) {
      if (i && recent[i][0] - recent[i - 1][0] > 20 * 6e4) flush();
      segment.push(coords[i]);
    }
    flush();
    const last = coords[coords.length - 1];
    const tagText = fmt(recent[recent.length - 1][1]);
    const tagW = Math.max(R - 4, tagText.length * 6.2 + 10);
    const tagY = Math.min(base - 8, Math.max(T + 8, last[1]));
    const lastDot = `<line x1="${last[0].toFixed(2)}" x2="${(L + pw).toFixed(2)}" y1="${last[1].toFixed(2)}" y2="${last[1].toFixed(2)}" stroke="${color}" stroke-width="1" stroke-dasharray="3 2"/>\n      <path d="M${(L + pw).toFixed(2)},${tagY.toFixed(2)} l5,-8 h${tagW.toFixed(2)} v16 h-${tagW.toFixed(2)} z" fill="${color}"/>\n      <text x="${(L + pw + 5 + tagW / 2).toFixed(2)}" y="${(tagY + 3.6).toFixed(2)}" text-anchor="middle" fill="#ffffff" font-family="Segoe UI,Arial" font-size="10" font-weight="700" style="font-variant-numeric:tabular-nums">${tagText}</text>\n      <rect x="${(last[0] - 3).toFixed(2)}" y="${(last[1] - 3).toFixed(2)}" width="6" height="6" fill="${color}"/>`;
    plot.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="presentation">${grid}${strokes}${dots}${lastDot}<g class="mv-dh-cursor" visibility="hidden"><line x1="0" x2="0" y1="${T}" y2="${base}" stroke="#1f2a33" stroke-width="1" stroke-dasharray="2 2"/><circle cx="0" cy="0" r="4" fill="white" stroke="${color}" stroke-width="2"/></g></svg><div class="mv-dh-tooltip" hidden></div>`;
    plot.dataset.mvChartSize = W + 'x' + H;
    const svg = plot.querySelector('svg');
    const cursor = svg.querySelector('.mv-dh-cursor');
    const guide = cursor.querySelector('line');
    const circle = cursor.querySelector('circle');
    const tooltip = plot.querySelector('.mv-dh-tooltip');
    const hide = () => {
      cursor.setAttribute('visibility', 'hidden');
      tooltip.hidden = true;
    };
    svg.addEventListener('pointermove', event => {
      const bounds = svg.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / Math.max(1, bounds.width) * W;
      if (x < L || x > W - R) return hide();
      const selectedTime = startTime + (x - L) / pw * (endTime - startTime);
      let left = 0, right = recent.length - 1;
      while (left < right) {
        const middle = left + right >>> 1;
        if (recent[middle][0] < selectedTime) left = middle + 1; else right = middle;
      }
      let index = left;
      if (index > 0 && Math.abs(recent[index - 1][0] - selectedTime) < Math.abs(recent[index][0] - selectedTime)) index--;
      if (Math.abs(recent[index][0] - selectedTime) > 20 * 6e4) return hide();
      const point = coords[index];
      cursor.setAttribute('visibility', 'visible');
      guide.setAttribute('x1', point[0].toFixed(2));
      guide.setAttribute('x2', point[0].toFixed(2));
      circle.setAttribute('cx', point[0].toFixed(2));
      circle.setAttribute('cy', point[1].toFixed(2));
      tooltip.textContent = mvHistoryFormatTime(recent[index][0]) + ' · ' + fmt(recent[index][1]) + ' ' + unit;
      const px = point[0] / W * bounds.width;
      tooltip.style.left = Math.min(bounds.width - 40, Math.max(40, px)) + 'px';
      tooltip.style.top = Math.max(28, point[1] / H * bounds.height) + 'px';
      tooltip.hidden = false;
    });
    svg.addEventListener('pointerleave', hide);
    return {
      count: recent.length,
      latest: recent[recent.length - 1][0],
      latestValue: recent[recent.length - 1][1]
    };
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
    const flowIds = [ ...new Set([ ...flowSeries.map(item => item.id), ...Object.keys(mapped) ]) ];
    const hasFlowSamples = id => {
      const measure = flowSeries.find(item => item.id === id);
      return mvHistoryPoints(tank, measure, 'flujo', id).some(point => point[0] <= Date.now() + 6e4);
    };
    const selectedFlowId = flowIds.includes(mvHistoryFlowId) ? mvHistoryFlowId : flowIds[0] || '';
    const availableFlowId = selectedFlowId && hasFlowSamples(selectedFlowId) ? selectedFlowId : flowIds.find(hasFlowSamples) || '';
    const flow = flowSeries.find(item => item.id === availableFlowId) || null;
    const hasFlow = !!availableFlowId;
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
    const signature = [ tank, mvHistoryFlowId, availableFlowId, stored ? stored.loadedAt : 0, mvHistoryLiveVersions.get(tank) || 0, Math.floor(Date.now() / 3e4) ].join('|');
    if (mvHistorySignature === signature) return;
    mvHistorySignature = signature;
    mvHistoryMessage.hidden = true;
    mvHistoryMessage.textContent = '';
    if (!stored || !data) {
      const msg = !stored ? 'Esperando datos del servidor...' : 'Sin historial disponible';
      const detail = !stored ? '' : stored.errorMessage || 'Sin respuesta del historial.';
      mvRenderHistoryMeasure(mvLevelPlot, null, 'm', 'level', mvLevelLatest, mvLevelCount, mvLevelTime, msg, tank, '');
      if (hasFlow) mvRenderHistoryMeasure(mvFlowPlot, null, 'LPS', 'flow', mvFlowLatest, mvFlowCount, mvFlowTime, msg, tank, availableFlowId);
      mvHistoryMessage.hidden = !detail;
      mvHistoryMessage.textContent = detail;
      mvScheduleFitPresentation();
      return;
    }
    mvRenderHistoryMeasure(mvLevelPlot, data.nivel, 'm', 'level', mvLevelLatest, mvLevelCount, mvLevelTime, 'Esperando nuevas lecturas de nivel', tank, '');
    if (hasFlow) mvRenderHistoryMeasure(mvFlowPlot, flow, 'LPS', 'flow', mvFlowLatest, mvFlowCount, mvFlowTime, 'Esperando nuevas lecturas de flujo', tank, availableFlowId);
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
    const freshness = existing && !existing.data ? 25e3 : MV_HISTORY_TTL_MS;
    if (existing && Date.now() - existing.loadedAt < freshness) return;
    if (mvHistoryRequest && mvHistoryRequest.tank === tank) return;
    if (mvHistoryRequest) mvHistoryRequest.controller.abort();
    const controller = new AbortController;
    const current = {
      tank: tank,
      controller: controller
    };
    mvHistoryRequest = current;
    const timeout = setTimeout(() => controller.abort(), 15e3);
    (async () => {
      let missing = 0;
      for (const endpoint of MV_HISTORY_API_PATHS) {
        let response;
        try {
          response = await fetch(endpoint + '?tanque=' + encodeURIComponent(tank) + '&horas=6&_=' + Date.now(), {
            credentials: 'same-origin',
            cache: 'no-store',
            signal: controller.signal,
            headers: {
              Accept: 'application/json'
            }
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
        throw new Error('Error 404: no se encuentra anillo_tv_3d_historial.php en Telemetria/Php. Comprueba que esté instalado en el servidor.');
      }
      throw new Error('No se pudo contactar con el servicio de historial.');
    })().then(body => {
      mvHistoryCache.set(tank, {
        data: body,
        loadedAt: Date.now()
      });
      if (presentation.active && presentationUi.visible && mvHistoryCurrentTank === tank) mvRenderTankHistory(tank);
    }).catch(error => {
      if (error.name === 'AbortError' && mvHistoryRequest !== current) return;
      const detail = error.name === 'AbortError' ? 'La consulta superó 15 segundos. Revisa el servidor de históricos.' : error.message || 'Error desconocido en el historial.';
      mvHistoryCache.set(tank, {
        data: null,
        errorMessage: detail,
        loadedAt: Date.now()
      });
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
  }, 3e4);
  function presentationData() {
    if (!presentation.active) return;
    const spec = tankSpecs[presentation.index];
    if (!spec) return;
    const fmt = n => Number(n).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    presEl('presentationCount').textContent = 'TANQUE ' + (presentationPosition() + 1) + ' DE ' + tankSpecs.length;
    presEl('presentationName').textContent = shortNames[spec.name] || spec.name;
    presEl('presentationLevel').textContent = hasReceivedData && Number.isFinite(spec.meters) ? fmt(spec.meters) + ' m' : 'N/D';
    const direction = mvTrendDirection(spec.delta);
    const dtxt = direction === null ? 'N/D' : mvTrendDisplay(spec.delta);
    const d = presEl('presentationDelta');
    d.textContent = hasReceivedData ? dtxt : 'N/D';
    d.className = 'presentation-primary-value ' + (hasReceivedData && direction !== null ? direction : 'warn');
    renderPresentationFlows(spec.name);
    const c = presEl('presentationConnection');
    const com = spec.state;
    c.textContent = !hasReceivedData ? 'Sin lecturas' : !presentation.sourceFresh ? 'Conexión no confirmada' : com === 'actual' ? 'Actual' : com === 'sin_comunicacion' ? 'Sin comunicación' : com === 'sin_datos' ? 'Sin datos' : com || 'N/D';
    c.className = !presentation.sourceFresh || com === 'sin_comunicacion' || com === 'sin_datos' ? 'warn' : '';
    const tankHour = hasReceivedData && spec.hora ? spec.hora : null;
    presEl('presentationUpdated').textContent = tankHour ? 'Hora registrada: ' + tankHour + ' · Consulta: ' + presentation.sourceTime : presentation.sourceTime ? 'Consulta: ' + presentation.sourceTime : 'Esperando respuesta de Telemetría';
    renderPresentationPumps(spec.name);
    mvScheduleTankHistory(spec.name);
    mvScheduleFitPresentation();
  }
  const presentationAngleCache = new Map;
  function tankCameraTarget(p, yaw, forPresentation) {
    const narrow = canvas.clientWidth < 850;
    const lateral = forPresentation && presentationUi.visible && !narrow ? canvas.clientWidth < 1150 ? 2.2 : 3.15 : 0;
    return [ p.x + Math.sin(yaw) * lateral, p.baseY + p.height * .51, p.z - Math.cos(yaw) * lateral ];
  }
  function cameraFromPose(pose) {
    const sp = Math.sin(pose.pitch);
    return [ pose.target[0] + pose.dist * sp * Math.cos(pose.yaw), pose.target[1] + pose.dist * Math.cos(pose.pitch), pose.target[2] + pose.dist * sp * Math.sin(pose.yaw) ];
  }
  function poseFromCamera(eye, target) {
    const dx = eye[0] - target[0], dy = eye[1] - target[1], dz = eye[2] - target[2];
    return {
      yaw: Math.atan2(dz, dx),
      pitch: Math.atan2(Math.hypot(dx, dz), dy),
      target: [ ...target ],
      dist: Math.max(1, Math.hypot(dx, dy, dz))
    };
  }
  function safeCameraScore(index, yaw, target, dist, pitch) {
    const subject = tankLabels[index];
    const eye = cameraFromPose({
      yaw: yaw,
      pitch: pitch,
      target: target,
      dist: dist
    });
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
      const limit = other.wallRadius + subject.wallRadius * (t > .65 ? .75 : .5);
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
    const center = [ 0, 0, .5 ];
    const outX = subject.x - center[0], outZ = subject.z - center[2];
    const outward = Math.hypot(outX, outZ);
    if (outward > 2) score += 2 * (1 - (Math.cos(yaw) * outX + Math.sin(yaw) * outZ) / outward);
    if (eyeToTank < subject.wallRadius + 2.1) score += 500;
    return score;
  }
  function presentationClearAngle(index) {
    if (presentationAngleCache.has(index)) return presentationAngleCache.get(index);
    const subject = tankLabels[index];
    const pitch = 1.44;
    const distance = Math.max(14.6, subject.radius * 8.25);
    let bestYaw = 1.28, bestScore = Infinity;
    for (let step = 0; step < 144; step++) {
      const yaw = step * Math.PI * 2 / 144;
      const target = tankCameraTarget(subject, yaw, true);
      const score = safeCameraScore(index, yaw, target, distance, pitch);
      if (score < bestScore) {
        bestScore = score;
        bestYaw = yaw;
      }
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
    const minimum = portrait ? 23.5 : compact ? 19.3 : width < 850 ? 16.8 : 14.6;
    const dist = Math.max(minimum, p.radius * (portrait ? 11.6 : compact ? 9.6 : 8.25));
    return {
      yaw: yaw,
      pitch: 1.44,
      target: target,
      dist: dist
    };
  }
  function craneCameraPose(from, to, progress) {
    const t = Math.max(0, Math.min(1, progress));
    const smooth = x => x * x * (3 - 2 * x);
    const a = cameraFromPose(from), b = cameraFromPose(to);
    const high = Math.max(15.5, a[1], b[1]);
    let eye;
    if (t < .28) {
      const u = smooth(t / .28);
      eye = [ a[0], a[1] + (high - a[1]) * u, a[2] ];
    } else if (t < .72) {
      const u = smooth((t - .28) / .44);
      eye = [ a[0] + (b[0] - a[0]) * u, high, a[2] + (b[2] - a[2]) * u ];
    } else {
      const u = smooth((t - .72) / .28);
      eye = [ b[0], high + (b[1] - high) * u, b[2] ];
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
    panoramaDuration: 20,
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
  panoramaTitle.textContent = 'ANILLO TV';
  const panoramaSubtitle = document.createElement('span');
  panoramaSubtitle.className = 'mv-panorama-subtitle';
  panoramaSubtitle.textContent = 'RECORRIDO GENERAL · 36 TANQUES';
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
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const panoramaTimeFormatter = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Monterrey',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  function updatePanoramaClock() {
    const now = new Date;
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
  panoramaHeading.setAttribute('aria-label', 'Mostrar controles de Anillo TV');
  document.body.appendChild(panoramaHeading);
  updatePanoramaClock();
  window.setInterval(updatePanoramaClock, 1e3);
  let manualCameraDistance = null;
  function makeHydraulicRoute() {
    const itinerary = [ [ 32, 90 ], [ 32, 261 ], [ 48, 261 ], [ 208, 261 ], [ 320, 261 ], [ 528, 261 ], [ 640, 261 ], [ 768, 261 ], [ 912, 261 ], [ 960, 207 ], [ 1040, 180 ], [ 1152, 162 ], [ 1264, 162 ], [ 1328, 180 ], [ 1424, 180 ], [ 1456, 207 ], [ 1456, 360 ], [ 1456, 450 ], [ 1456, 540 ], [ 1456, 675 ], [ 1328, 675 ], [ 1312, 630 ], [ 1312, 540 ], [ 1248, 540 ], [ 1216, 513 ], [ 1216, 612 ], [ 1072, 648 ], [ 1072, 729 ], [ 992, 729 ], [ 944, 675 ], [ 960, 729 ], [ 832, 765 ], [ 608, 765 ], [ 400, 765 ], [ 400, 855 ], [ 288, 855 ] ];
    const startIndex = itinerary.findIndex(([x, z]) => x === 1328 && z === 180);
    const routePoints = startIndex >= 0 ? itinerary.slice(startIndex).concat(itinerary.slice(0, -1).reverse()) : itinerary;
    return roundPath(routePoints.map(([x, z]) => [ mapX(x), 1.02, mapZ(z) ]), 1.1);
  }
  function buildHydraulicSamples(route) {
    const result = [];
    let distance = 0;
    for (let i = 0; i < route.length; i++) {
      if (i) distance += Math.hypot(route[i][0] - route[i - 1][0], route[i][2] - route[i - 1][2]);
      result.push({
        point: route[i],
        distance: distance
      });
    }
    return result;
  }
  function sampleHydraulicRoute(distance) {
    const items = guidedTour.samples;
    if (!items.length) return [ 0, 1.02, 0 ];
    const total = guidedTour.totalLength;
    const d = Math.max(0, Math.min(total, distance));
    let low = 0;
    let high = items.length - 1;
    while (low < high) {
      const middle = low + high >> 1;
      if (items[middle].distance < d) low = middle + 1; else high = middle;
    }
    if (low === 0) return [ ...items[0].point ];
    const a = items[low - 1];
    const b = items[low];
    const fraction = (d - a.distance) / Math.max(1e-4, b.distance - a.distance);
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
    const trackEye = [ position[0] - 6.45 - dx * 1.2, height, position[2] + 7.5 - dz * 1.2 ];
    const trackLook = [ ahead[0] + dx * .52, 2.15, ahead[2] + dz * .52 ];
    let chosen = -1;
    let separation = Infinity;
    for (let i = 0; i < tankLabels.length; i++) {
      const p = tankLabels[i];
      const gap = Math.hypot(p.x - position[0], p.z - position[2]);
      if (gap < separation) {
        separation = gap;
        chosen = i;
      }
    }
    if (chosen >= 0 && separation < 3.35) {
      const tank = tankLabels[chosen];
      const strength = .27 * (1 - Math.min(1, separation / 3.35));
      trackLook[0] += (tank.x - trackLook[0]) * strength;
      trackLook[1] += (tank.baseY + tank.height * .47 - trackLook[1]) * strength;
      trackLook[2] += (tank.z - trackLook[2]) * strength;
    }
    return {
      eye: trackEye,
      look: trackLook,
      focus: separation < 2.9 ? chosen : null
    };
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
    guidedTour.eye = cameraFromPose({
      yaw: state.yaw,
      pitch: state.pitch,
      dist: state.dist,
      target: [ ...state.target ]
    });
    guidedTour.look = [ ...state.target ];
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
    const pitch = .87;
    const fitted = fitPose(yaw, pitch);
    const distance = Math.max(fitted.dist + 1.8, fitted.dist * 1.075);
    return {
      eye: cameraFromPose({
        yaw: yaw,
        pitch: pitch,
        dist: distance,
        target: fitted.target
      }),
      look: [ ...fitted.target ]
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
      guidedTour.moveFromEye = [ ...guidedTour.eye ];
      guidedTour.moveFromLook = [ ...guidedTour.look ];
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
      guidedTour.phase = 'return';
      guidedTour.phaseClock = 0;
      guidedTour.moveFromEye = [ ...guidedTour.eye ];
      guidedTour.moveFromLook = [ ...guidedTour.look ];
      showPanoramaHeading(false);
      return;
    }
    guidedTour.phase = 'route';
    guidedTour.phaseClock = 0;
    guidedTour.entryClock = 2.3;
    guidedTour.distance = 0;
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
      if (!entering && guidedTour.distance >= guidedTour.totalLength) finishTourPhase();
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
    } else if (guidedTour.phase === 'return') {
      guidedTour.phaseClock = Math.min(5.2, guidedTour.phaseClock + dt);
      const t = smoothTourStep(guidedTour.phaseClock / 5.2);
      const target = hydraulicTourCamera(0);
      guidedTour.eye = mixTourPoint(guidedTour.moveFromEye, target.eye, t);
      guidedTour.look = mixTourPoint(guidedTour.moveFromLook, target.look, t);
      guidedTour.eye[1] = Math.max(guidedTour.eye[1], Math.min(guidedTour.moveFromEye[1], target.eye[1]) + 2.2 * Math.sin(t * Math.PI));
      if (guidedTour.phaseClock >= 5.2) finishTourPhase();
    }
    const current = poseFromCamera(guidedTour.eye, guidedTour.look);
    state.yaw = current.yaw;
    state.pitch = current.pitch;
    state.target = [ ...current.target ];
    state.dist = current.dist;
    guidedTour.dist = current.dist;
  }
  function presentationJump(position) {
    if (!presentationOrder.length) return;
    const normalized = (position % presentationOrder.length + presentationOrder.length) % presentationOrder.length;
    presentation.index = presentationOrder[normalized];
    presentation.clock = 0;
    const dest = presentationPose(presentation.index);
    presentation.transition = {
      t0: performance.now(),
      elapsed: 0,
      duration: 2200,
      from: {
        yaw: state.yaw,
        pitch: state.pitch,
        target: [ ...state.target ],
        dist: state.dist
      },
      to: dest
    };
    presentationData();
    presEl('presentationProgress').style.width = '0%';
  }
  function presentationJumpToTank(index) {
    const position = presentationOrder.indexOf(index);
    if (position >= 0) presentationJump(position);
  }
  function startPresentation() {
    if (freeNavigationActive) setFreeNavigation(false);
    if (aroundOrbit.active) stopAroundOrbit(true);
    if (guidedTour.active) stopGuidedTour(true);
    topViewSelected = false;
    if (presentation.active || tankSpecs.length === 0) return;
    presentation.saved = {
      yaw: state.yaw,
      pitch: state.pitch,
      target: [ ...state.target ],
      zoom: state.zoom,
      auto: state.auto,
      userPanned: state.userPanned
    };
    presentation.active = true;
    presentation.paused = false;
    presentation.sourceFresh = liveStatus.dataset.state !== 'error';
    document.body.classList.add('mv-anillo-presenting');
    const selectorPanelDuringPresentation = document.getElementById('anilloSystemSelectorPanel');
    if (selectorPanelDuringPresentation) selectorPanelDuringPresentation.hidden = true;
    document.querySelector('#anilloSystemSelector .az-trigger')?.setAttribute('aria-expanded', 'false');
    state.auto = false;
    presEl('spin').classList.remove('active');
    setPresentationInfoVisible(true, false);
    presEl('presentationToggle').classList.add('active');
    presEl('presentationToggle').setAttribute('aria-pressed', 'true');
    presEl('presentationPause').textContent = 'Pausar';
    setPresentationControlsOpen(false);
    presentationJump(0);
    const panel = presEl('controlsPanel'), toggle = presEl('controlsToggle');
    if (panel && toggle) {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Mostrar controles');
    }
  }
  function stopPresentation() {
    if (!presentation.active) return;
    presentation.active = false;
    presentation.transition = null;
    document.body.classList.remove('mv-anillo-presenting');
    setPresentationControlsOpen(false);
    setPresentationInfoVisible(false, false);
    presEl('presentationToggle').classList.remove('active');
    presEl('presentationToggle').setAttribute('aria-pressed', 'false');
    if (presentation.saved) {
      state.yaw = presentation.saved.yaw;
      state.pitch = presentation.saved.pitch;
      state.target = [ ...presentation.saved.target ];
      state.zoom = presentation.saved.zoom;
      state.auto = presentation.saved.auto;
      state.userPanned = presentation.saved.userPanned;
      presEl('spin').classList.toggle('active', state.auto);
    }
  }
  function tickPresentation(now, dt) {
    if (!presentation.active) return;
    if (!presentation.paused) presentation.clock += dt * presentation.rate;
    if (presentation.transition) {
      const tr = presentation.transition;
      tr.elapsed = (tr.elapsed || 0) + dt * presentation.rate * 1e3;
      const t = Math.max(0, Math.min(1, tr.elapsed / tr.duration));
      const u = t * t * t * (t * (t * 6 - 15) + 10);
      const pose = craneCameraPose(tr.from, tr.to, u);
      state.yaw = pose.yaw;
      state.pitch = pose.pitch;
      state.target = [ ...pose.target ];
      presentation.dist = pose.dist;
      if (t >= 1) presentation.transition = null;
    } else {
      const pose = presentationPose(presentation.index);
      state.yaw = pose.yaw;
      state.pitch = pose.pitch;
      state.target = [ ...pose.target ];
      presentation.dist = pose.dist;
    }
    presEl('presentationProgress').style.width = Math.min(100, presentation.clock / presentation.interval * 100).toFixed(1) + '%';
    if (!presentation.paused && presentation.clock >= presentation.interval) presentationJump(presentationPosition() + 1);
  }
  const aroundOrbitButton = document.createElement('button');
  aroundOrbitButton.id = 'mvOrbitAround';
  aroundOrbitButton.type = 'button';
  aroundOrbitButton.textContent = '↻ Giro alrededor';
  aroundOrbitButton.title = 'Girar continuamente alrededor de todo Anillo TV';
  aroundOrbitButton.setAttribute('aria-label', 'Iniciar giro alrededor de todo el mapa');
  aroundOrbitButton.setAttribute('aria-pressed', 'false');
  presEl('spin').insertAdjacentElement('afterend', aroundOrbitButton);
  let eveningEnabled = false;
  let eveningBlend = 0;
  const dayModeHtml = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg><span>Modo día</span>';
  const nightModeHtml = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.9 13.2A9 9 0 0 1 10.8 3.1a9 9 0 1 0 10.1 10.1Z"/></svg><span>Modo noche</span>';
  const modeToggle = document.createElement('button');
  modeToggle.id = 'anilloModeToggle';
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
    if (!freeNavigationActive) setFreeNavigation(true); else if (freeNavigationMode === 'move') {
      freeNavigationMode = 'rotate';
      updateFreeNavigationControls();
    } else setFreeNavigation(false);
  });
  const aroundOrbit = {
    active: false,
    angle: state.yaw,
    pitch: 1.2,
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
    if (aroundOrbit.active) stopAroundOrbit(true); else startAroundOrbit();
  });
  const giroSpeedButton = document.createElement('button');
  giroSpeedButton.id = 'mvGiroSpeed';
  giroSpeedButton.type = 'button';
  giroSpeedButton.title = 'Cambiar velocidad del recorrido por tuberías y del giro alrededor';
  giroSpeedButton.textContent = 'Giro: Normal';
  giroSpeedButton.setAttribute('aria-label', 'Velocidad de Giro 3D: Normal. Cambiar a rápida');
  presEl('spin').insertAdjacentElement('afterend', giroSpeedButton);
  giroSpeedButton.addEventListener('click', () => {
    guidedTour.rate = guidedTour.rate === 1 ? 1.6 : 1;
    const fast = guidedTour.rate > 1;
    giroSpeedButton.textContent = fast ? 'Giro: Rápida' : 'Giro: Normal';
    giroSpeedButton.setAttribute('aria-label', fast ? 'Velocidad de Giro 3D: Rápida. Cambiar a normal' : 'Velocidad de Giro 3D: Normal. Cambiar a rápida');
    giroSpeedButton.setAttribute('aria-pressed', String(fast));
  });
  giroSpeedButton.setAttribute('aria-pressed', 'false');
  const controlsOrder = [ 'reset', 'top', 'zoomIn', 'zoomOut', 'full', 'spin', 'mvGiroSpeed', 'mvOrbitAround', 'mvManosLibres', 'presentationToggle', 'presentationInfoToggle', 'water', 'flowSpeed', 'flowLabelsToggle', 'levelsToggle', 'labelsToggle', 'alertsVisibilityToggle', 'anilloModeToggle', 'dateTimeVisibilityToggle' ];
  const controlsPanel = presEl('controlsPanel');
  controlsOrder.forEach(id => {
    const control = document.getElementById(id);
    if (control && control.parentElement === controlsPanel) controlsPanel.appendChild(control);
  });
  const compactControlsLayout = document.createElement('style');
  compactControlsLayout.id = 'anilloControlsCompactFinal';
  compactControlsLayout.textContent = `\n    .controls-dock #controlsPanel.is-open{\n      display:grid!important;\n      grid-template-columns:repeat(10,minmax(0,1fr))!important;\n      grid-auto-flow:row!important;\n      width:min(1050px,calc(100vw - 28px))!important;\n      max-width:calc(100vw - 28px)!important;\n      min-width:0!important;\n      margin:0 auto!important;\n      box-sizing:border-box!important;\n      padding:9px!important;\n      gap:7px!important;\n      align-items:stretch!important;\n      justify-content:center!important;\n      max-height:calc(100dvh - 135px)!important;\n      overflow-x:hidden!important;\n      overflow-y:auto!important;\n    }\n    .controls-dock #controlsPanel.is-open > button{\n      grid-column:span 2!important;\n      grid-row:auto!important;\n      order:0!important;\n      box-sizing:border-box!important;\n      width:100%!important;\n      min-width:0!important;\n      height:46px!important;\n      min-height:46px!important;\n      padding:5px 7px!important;\n      display:flex!important;\n      justify-content:center!important;\n      align-items:center!important;\n      gap:6px!important;\n      text-align:center!important;\n      white-space:normal!important;\n      font-size:clamp(12px,.85vw,14px)!important;\n      line-height:1.15!important;\n    }\n    .controls-dock #controlsPanel.is-open > button svg{\n      flex-shrink:0!important;\n    }\n    .controls-dock #controlsPanel.is-open > #labelsToggle{\n      grid-column:2/span 2!important;\n    }\n    @media(max-width:1050px){\n      .controls-dock #controlsPanel.is-open{\n        grid-template-columns:repeat(8,minmax(0,1fr))!important;\n        width:min(760px,calc(100vw - 24px))!important;\n        gap:6px!important;\n        padding:8px!important;\n      }\n      .controls-dock #controlsPanel.is-open > button{height:43px!important;min-height:43px!important;font-size:12.5px!important}\n      .controls-dock #controlsPanel.is-open > #labelsToggle{grid-column:span 2!important}\n      .controls-dock #controlsPanel.is-open > #alertsVisibilityToggle{grid-column:2/span 2!important}\n    }\n    @media(max-width:680px){\n      .controls-dock #controlsPanel.is-open{\n        grid-template-columns:repeat(6,minmax(0,1fr))!important;\n        width:calc(100vw - 18px)!important;\n        padding:7px!important;\n        gap:5px!important;\n      }\n      .controls-dock #controlsPanel.is-open > #alertsVisibilityToggle{grid-column:span 2!important}\n      .controls-dock #controlsPanel.is-open > #dateTimeVisibilityToggle{grid-column:3/span 2!important}\n    }\n    @media(max-width:440px){\n      .controls-dock #controlsPanel.is-open{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:5px!important}\n      .controls-dock #controlsPanel.is-open > button{min-height:42px!important;height:auto!important;padding:6px 4px!important;font-size:11.5px!important}\n      .controls-dock #controlsPanel.is-open > #dateTimeVisibilityToggle{grid-column:span 2!important}\n      .controls-dock #controlsPanel.is-open > #dateTimeVisibilityToggle{grid-column:2/span 2!important}\n    }\n  `;
  document.head.appendChild(compactControlsLayout);
  const systemSelectorStyle = document.createElement('style');
  systemSelectorStyle.id = 'anilloSystemSelectorStyles';
  systemSelectorStyle.textContent = `\n    #anilloSystemSelector{position:fixed;left:14px;top:14px;z-index:1100;max-width:calc(100vw - 28px);font-family:'Segoe UI',Arial,sans-serif;color:#18313f;line-height:1.35}\n    body.mv-anillo-presenting #anilloSystemSelector{display:none!important}\n    #anilloSystemSelector *{box-sizing:border-box}\n    #anilloSystemSelector button{font-family:inherit;cursor:pointer}\n    #anilloSystemSelector .az-trigger{display:inline-flex;align-items:center;gap:8px;min-height:38px;padding:8px 13px;background:#fff;border:1px solid #bbc9d2;border-radius:6px;color:#203a49;font-size:13px;font-weight:500;box-shadow:0 1px 4px #20354522}\n    #anilloSystemSelector .az-trigger:hover{border-color:#0058b7}\n    #anilloSystemSelector .az-trigger:focus-visible,#anilloSystemSelector .az-item:focus-visible,#anilloSystemSelector .az-close:focus-visible{outline:2px solid #0058b7;outline-offset:2px}\n    #anilloSystemSelector .az-logo{display:block;flex:0 0 23px;width:23px;height:23px;object-fit:contain}\n    #anilloSystemSelector .az-panel{width:min(340px,calc(100vw - 28px));max-height:min(610px,calc(100dvh - 75px));overflow:auto;margin-top:7px;padding:12px;background:#fff;border:1px solid #c7d0d6;border-radius:8px;box-shadow:0 6px 20px #0002}\n    #anilloSystemSelector [hidden]{display:none!important}\n    #anilloSystemSelector .az-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:11px}\n    #anilloSystemSelector .az-head strong{font-size:15px;font-weight:600}\n    #anilloSystemSelector .az-close{width:28px;height:28px;background:#fff;color:#293d49;border:1px solid #cbd5db;border-radius:4px;font-size:18px;line-height:1}\n    #anilloSystemSelector .az-list{display:flex;flex-direction:column;gap:5px}\n    #anilloSystemSelector .az-item{width:100%;min-height:52px;display:flex;align-items:center;gap:10px;padding:8px 9px;text-align:left;color:#203747;background:#fff;border:1px solid #ccd5db;border-radius:5px}\n    #anilloSystemSelector .az-item:hover{background:#f4f8fb;border-color:#9ebbd0}\n    #anilloSystemSelector .az-item[aria-current="true"]{border-color:#0058b7;background:#f1f6fc}\n    #anilloSystemSelector .az-itemtext{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}\n    #anilloSystemSelector .az-itemtext strong{font-size:12px;font-weight:600}\n    #anilloSystemSelector .az-itemtext small{font-size:10.5px;color:#617583}\n    #anilloSystemSelector .az-arrow{font-size:15px;color:#4b6d80}\n    @media(max-width:600px){#anilloSystemSelector{left:9px;top:9px}#anilloSystemSelector .az-trigger{min-height:34px;font-size:11px;padding:6px 9px}#anilloSystemSelector .az-panel{max-height:calc(100dvh - 55px)}}\n  `;
  systemSelectorStyle.textContent += '#anilloSystemSelector .az-item:disabled{cursor:default;opacity:.65;background:#f5f7f8}#anilloSystemSelector .az-item:disabled .az-arrow{visibility:hidden}';
  document.head.appendChild(systemSelectorStyle);
  const systemSelector = document.createElement('nav');
  systemSelector.id = 'anilloSystemSelector';
  systemSelector.setAttribute('aria-label', 'Sistemas');
  const systemSelectorTrigger = document.createElement('button');
  systemSelectorTrigger.type = 'button';
  systemSelectorTrigger.className = 'az-trigger';
  systemSelectorTrigger.setAttribute('aria-controls', 'anilloSystemSelectorPanel');
  systemSelectorTrigger.setAttribute('aria-expanded', 'false');
  const systemSelectorLogo = document.createElement('img');
  systemSelectorLogo.className = 'az-logo';
  systemSelectorLogo.src = '/Telemetria/imagenes/logo_ayd_telemetria.png';
  systemSelectorLogo.alt = '';
  systemSelectorLogo.setAttribute('aria-hidden', 'true');
  const systemSelectorLabel = document.createElement('span');
  systemSelectorLabel.textContent = 'Sistemas';
  systemSelectorTrigger.append(systemSelectorLogo, systemSelectorLabel);
  const systemSelectorPanel = document.createElement('div');
  systemSelectorPanel.id = 'anilloSystemSelectorPanel';
  systemSelectorPanel.className = 'az-panel';
  systemSelectorPanel.hidden = true;
  const systemSelectorHead = document.createElement('div');
  systemSelectorHead.className = 'az-head';
  const systemSelectorTitle = document.createElement('strong');
  systemSelectorTitle.textContent = 'Sistemas';
  const systemSelectorClose = document.createElement('button');
  systemSelectorClose.type = 'button';
  systemSelectorClose.className = 'az-close';
  systemSelectorClose.textContent = '×';
  systemSelectorClose.setAttribute('aria-label', 'Cerrar selector de sistemas');
  systemSelectorHead.append(systemSelectorTitle, systemSelectorClose);
  const systemSelectorList = document.createElement('div');
  systemSelectorList.className = 'az-list';
  systemSelectorPanel.append(systemSelectorHead, systemSelectorList);
  systemSelector.append(systemSelectorTrigger, systemSelectorPanel);
  document.body.appendChild(systemSelector);
  const systemZoneItems = [ {
    id: 'china',
    title: 'Sistema China',
  }, {
    id: 'buenosaires',
    title: 'Sistema Buenos Aires',
  }, {
    id: 'santiago',
    title: 'Sistema Santiago I y II',
  }, {
    id: 'linares',
    title: 'Sistema Linares',
  }, {
    id: 'cuchillo',
    title: 'Sistema Cuchillo I y II',
  }, {
    id: 'mtyv',
    title: 'Monterrey V',
  } ];
  function setSystemSelectorOpen(open) {
    systemSelectorPanel.hidden = !open;
    systemSelectorTrigger.setAttribute('aria-expanded', String(open));
  }
  function selectSystemZone(id) {
    const routes = {
      mtyv: '/MTYV3D',
      linares: '/LINARES3D',
      cuchillo: '/CUCHILLO3D',
      santiago: '/SANTIAGO3D',
      buenosaires: '/BUENOSAIRES3D',
      china: '/CHINA3D'
    };
    if (routes[id]) window.location.assign(routes[id]);
  }
  systemZoneItems.forEach(zone => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'az-item';
    btn.setAttribute('aria-current', 'false');
    if (![ 'mtyv', 'linares', 'cuchillo', 'santiago', 'buenosaires', 'china' ].includes(zone.id)) {
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
      btn.title = 'En desarrollo';
    }
    const text = document.createElement('span');
    text.className = 'az-itemtext';
    const name = document.createElement('strong');
    name.textContent = zone.title;
    const detail = document.createElement('small');
    detail.textContent = zone.detail;
    text.append(name, detail);
    const arrow = document.createElement('span');
    arrow.className = 'az-arrow';
    arrow.textContent = '›';
    arrow.setAttribute('aria-hidden', 'true');
    btn.append(text, arrow);
    btn.addEventListener('click', () => selectSystemZone(zone.id));
    systemSelectorList.appendChild(btn);
  });
  systemSelectorTrigger.addEventListener('click', () => setSystemSelectorOpen(systemSelectorPanel.hidden));
  systemSelectorClose.addEventListener('click', () => setSystemSelectorOpen(false));
  document.addEventListener('pointerdown', e => {
    if (!systemSelectorPanel.hidden && !systemSelector.contains(e.target)) setSystemSelectorOpen(false);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !systemSelectorPanel.hidden) setSystemSelectorOpen(false);
  });
  document.getElementById('presentationToggle')?.addEventListener('click', () => setSystemSelectorOpen(false));
  const presentationSpeedButton = document.createElement('button');
  presentationSpeedButton.id = 'mvPresentationSpeed';
  presentationSpeedButton.type = 'button';
  presentationSpeedButton.textContent = 'Vel.: Normal';
  presentationSpeedButton.title = 'Cambiar la velocidad del carrusel de 36 tanques';
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
  presEl('presentationPrev').addEventListener('click', () => {
    if (presentation.active) presentationJump(presentationPosition() - 1);
  });
  presEl('presentationNext').addEventListener('click', () => {
    if (presentation.active) presentationJump(presentationPosition() + 1);
  });
  presEl('presentationPause').addEventListener('click', () => {
    if (!presentation.active) return;
    presentation.paused = !presentation.paused;
    presEl('presentationPause').textContent = presentation.paused ? 'Continuar' : 'Pausar';
  });
  const shortNames = {
    "LA CRUZ": "LA CRUZ",
    "FRAILE 5": "FRAILE 5",
    "GARCÍA 2": "GARCÍA 2",
    "GARCÍA 1": "GARCÍA 1",
    "FRAILE 2": "FRAILE 2",
    "FRAILE 4": "FRAILE 4",
    "FRAILE 3": "FRAILE 3",
    "FRAILE 1": "FRAILE 1",
    "REAL DE MINA": "REAL DE MINA",
    "ALIANZA REAL": "ALIANZA REAL",
    "NUEVA CASTILLA AMP": "NUEVA CASTILLA AMP",
    "NUEVA CASTILLA 3 RECTANGULAR": "NUEVA CASTILLA 3 RECTANGULAR",
    "NUEVA CASTILLA 3 CIRCULAR": "NUEVA CASTILLA 3 CIRCULAR",
    "SANTA ROSA 2": "SANTA ROSA 2",
    ESCOBEDO: "ESCOBEDO",
    APODACA: "APODACA",
    "MIGUEL ALEMÁN": "MIGUEL ALEMÁN",
    "LA PAZ 2": "LA PAZ 2",
    "LA PAZ 1": "LA PAZ 1",
    "SAN ROQUE OTE": "SAN ROQUE OTE",
    "CAÑADA": "CAÑADA",
    "SAN NICOLÁS": "SAN NICOLÁS",
    PENAL: "PENAL",
    "TOPO CHICO": "TOPO CHICO",
    "SAN MARTÍN 1": "SAN MARTÍN 1",
    "SAN BERNABÉ RECTANGULAR": "SAN BERNABÉ RECTANGULAR",
    "SAN BERNABÉ CIRCULAR": "SAN BERNABÉ CIRCULAR",
    OBISPADO: "OBISPADO",
    "VALLE 2": "VALLE 2",
    "VALLE 4": "VALLE 4",
    "LOMA LARGA": "LOMA LARGA",
    SUR: "SUR",
    "ALTAMIRA 2": "ALTAMIRA 2",
    "LA SILLA 1": "LA SILLA 1",
    "JUÁREZ": "JUÁREZ",
    "ARBOLEDAS 2": "ARBOLEDAS 2"
  };
  const LABEL_TILE_W = 512, LABEL_TILE_H = 128, LABEL_COLS = 8, LABEL_ROWS = 16;
  const labelMemory = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : 8;
  const labelSuperSample = gl.getParameter(gl.MAX_TEXTURE_SIZE) >= 8192 && gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) >= 8192 && labelMemory >= 8 && canvas.clientWidth * canvas.clientHeight >= 5e6 ? 2 : 1;
  const atlas = document.createElement('canvas');
  atlas.width = LABEL_COLS * LABEL_TILE_W * labelSuperSample;
  atlas.height = LABEL_ROWS * LABEL_TILE_H * labelSuperSample;
  const ink = atlas.getContext('2d');
  ink.scale(labelSuperSample, labelSuperSample);
  const plateCount = tankSpecs.length + flowReadings.length + facilityLabels.length;
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const labelAnisotropy = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
  if (labelAnisotropy) gl.texParameterf(gl.TEXTURE_2D, labelAnisotropy.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(labelAnisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  const roundRect = (x, y, w, h, r) => {
    ink.beginPath();
    ink.roundRect(x, y, w, h, r);
  };
  const writePlateText = (value, x, y, maxWidth) => {
    ink.save();
    ink.shadowBlur = 0;
    ink.shadowOffsetX = 0;
    ink.shadowOffsetY = 0;
    ink.lineJoin = 'round';
    ink.miterLimit = 2;
    ink.strokeStyle = ink.fillStyle === '#182c36' ? 'rgba(231,238,240,.82)' : 'rgba(18,38,48,.91)';
    ink.lineWidth = 1.3;
    if (maxWidth === undefined) {
      ink.strokeText(value, x, y);
      ink.fillText(value, x, y);
    } else {
      ink.strokeText(value, x, y, maxWidth);
      ink.fillText(value, x, y, maxWidth);
    }
    ink.restore();
  };
  const fit = (value, maxW, initialSize, min = 20) => {
    let size = initialSize;
    do {
      ink.font = '700 ' + size + 'px Segoe UI, Arial, sans-serif';
      if (ink.measureText(value).width < maxW || size <= min) break;
      size--;
    } while (true);
    return size;
  };
  function tileText(i, type, txt, aux = '', up = 0) {
    const col = i % LABEL_COLS, row = Math.floor(i / LABEL_COLS);
    const x = col * LABEL_TILE_W, y = row * LABEL_TILE_H;
    ink.clearRect(x, y, LABEL_TILE_W, LABEL_TILE_H);
    const bx = x + 7, by = y + 7, bw = LABEL_TILE_W - 14, bh = LABEL_TILE_H - 14;
    ink.save();
    ink.textAlign = 'center';
    ink.textBaseline = 'middle';
    const grd = ink.createLinearGradient(bx, by, bx, by + bh);
    if (type === 'facility') {
      grd.addColorStop(0, '#d6dde0');
      grd.addColorStop(1, '#bbc7cb');
      roundRect(bx, by, bw, bh, 8);
      ink.fillStyle = grd;
      ink.fill();
      ink.strokeStyle = '#77878e';
      ink.lineWidth = 2;
      ink.stroke();
      ink.fillStyle = '#182c36';
      ink.font = '800 38px Segoe UI,Arial,sans-serif';
      writePlateText('PP', x + 256, y + 37);
      ink.font = '900 ' + fit(txt.replace(/^PP\s+/, ''), bw - 38, 65, 40) + 'px Segoe UI,Arial,sans-serif';
      writePlateText(txt.replace(/^PP\s+/, ''), x + 256, y + 87, bw - 38);
    } else if (type === 'level') {
      grd.addColorStop(0, '#5c7680');
      grd.addColorStop(1, '#425f6a');
      roundRect(bx, by, bw, bh, 13);
      ink.fillStyle = grd;
      ink.fill();
      ink.lineWidth = 2.7;
      ink.strokeStyle = '#c3d2d7';
      ink.stroke();
      ink.fillStyle = mvTrendDirection(up) === null ? '#bac9d0' : mvTrendDirection(up) === 'up' ? '#69efa8' : '#ff919e';
      ink.fillRect(bx + 14, by + 16, 7, bh - 32);
      ink.shadowColor = 'transparent';
      ink.shadowBlur = 0;
      ink.fillStyle = '#d9e7eb';
      ink.font = '700 21px Segoe UI,Arial,sans-serif';
      writePlateText('NIVEL', x + 256, y + 24);
      ink.font = '800 60px Segoe UI,Arial,sans-serif';
      ink.fillStyle = '#ffffff';
      writePlateText(txt, x + 256, y + 70);
      ink.font = '800 32px Segoe UI,Arial,sans-serif';
      ink.fillStyle = mvTrendDirection(up) === null ? '#bac9d0' : mvTrendDirection(up) === 'up' ? '#7df5af' : '#ff9fa7';
      writePlateText(aux, x + 256, y + 104);
    } else {
      grd.addColorStop(0, type === 'name' ? '#668894' : '#627a82');
      grd.addColorStop(1, type === 'name' ? '#456775' : '#445d67');
      roundRect(bx, by, bw, bh, 13);
      ink.fillStyle = grd;
      ink.fill();
      ink.strokeStyle = type === 'name' ? '#c2d3d8' : '#b9c6cb';
      ink.lineWidth = 2.7;
      ink.stroke();
      ink.fillStyle = type === 'name' ? '#c7e3e7' : '#b6cbd3';
      ink.fillRect(bx + 11, by + 12, 4, bh - 24);
      ink.shadowColor = 'transparent';
      ink.shadowBlur = 0;
      if (type === 'name') {
        ink.fillStyle = '#ffffff';
        if (txt === 'NUEVA CASTILLA RECTANGULAR' || txt === 'NUEVA CASTILLA CIRCULAR') {
          ink.font = '800 ' + fit('NUEVA CASTILLA', bw - 34, 54, 29) + 'px Segoe UI,Arial,sans-serif';
          writePlateText('NUEVA CASTILLA', x + 256, y + 43, bw - 34);
          const tipo = txt === 'NUEVA CASTILLA RECTANGULAR' ? 'RECTANGULAR' : 'CIRCULAR';
          ink.font = '800 ' + fit(tipo, bw - 34, 54, 29) + 'px Segoe UI,Arial,sans-serif';
          writePlateText(tipo, x + 256, y + 93, bw - 34);
        } else {
          const words = String(txt).split(/\s+/).filter(Boolean);
          const singleSize = fit(txt, bw - 26, 72, 31);
          if (words.length > 2 && singleSize < 43) {
            let splitAt = 1, balance = Infinity;
            for (let j = 1; j < words.length; j++) {
              const first = words.slice(0, j).join(' ');
              const second = words.slice(j).join(' ');
              const cost = Math.max(ink.measureText(first).width, ink.measureText(second).width);
              if (cost < balance) {
                balance = cost;
                splitAt = j;
              }
            }
            for (const [line, yOffset] of [ [ words.slice(0, splitAt).join(' '), 42 ], [ words.slice(splitAt).join(' '), 91 ] ]) {
              ink.font = '800 ' + fit(line, bw - 32, 55, 31) + 'px Segoe UI,Arial,sans-serif';
              writePlateText(line, x + 256, y + yOffset, bw - 32);
            }
          } else {
            ink.font = '800 ' + singleSize + 'px Segoe UI,Arial,sans-serif';
            writePlateText(txt, x + 256, y + 64, bw - 32);
          }
        }
      } else {
        const words = String(txt).split(/\s+/).filter(Boolean);
        const lines = [];
        let current = '';
        for (const word of words) {
          const attempt = current ? current + ' ' + word : word;
          if (attempt.length > 23 && current) {
            lines.push(current);
            current = word;
          } else current = attempt;
        }
        if (current) lines.push(current);
        const visible = lines.length > 3 ? [ lines[0], lines[1], lines.slice(2).join(' ') ] : lines;
        const size = visible.length >= 3 ? 24 : visible.length === 2 ? 30 : 38;
        const lineHeight = visible.length >= 3 ? 23 : 29;
        const top = visible.length >= 3 ? 18 : visible.length === 2 ? 25 : 38;
        ink.fillStyle = '#e7f0f2';
        for (let k = 0; k < visible.length; k++) {
          ink.font = '650 ' + fit(visible[k], bw - 24, size, 20) + 'px Segoe UI,Arial,sans-serif';
          writePlateText(visible[k], x + 256, y + top + k * lineHeight, bw - 24);
        }
        ink.font = '750 ' + fit(aux, bw - 20, 42, 26) + 'px Segoe UI,Arial,sans-serif';
        ink.fillStyle = '#ffffff';
        writePlateText(aux, x + 256, y + 101, bw - 20);
      }
    }
    ink.restore();
  }
  const atlasSignatures = new Array(plateCount);
  const atlasStrip = document.createElement('canvas');
  atlasStrip.width = LABEL_TILE_W * LABEL_COLS * labelSuperSample;
  atlasStrip.height = LABEL_TILE_H * labelSuperSample;
  const atlasStripInk = atlasStrip.getContext('2d');
  let atlasInitialized = false, lastAtlas = -1;
  function updateAtlas(t) {
    if (lastAtlas >= 0) return;
    lastAtlas = t;
    const rows = new Set;
    function updateTile(i, type, value, auxiliary = '') {
      const signature = type + '' + value + '' + auxiliary;
      if (atlasSignatures[i] === signature) return;
      atlasSignatures[i] = signature;
      tileText(i, type, value, auxiliary);
      rows.add(Math.floor(i / LABEL_COLS));
    }
    for (let i = 0; i < tankSpecs.length; i++) {
      const sp = tankSpecs[i];
      updateTile(i, 'name', shortNames[sp.name] || sp.name);
    }
    for (let i = 0; i < flowReadings.length; i++) {
      const f = flowReadings[i];
      updateTile(i + tankSpecs.length, 'flow', f.name, f.lps === null ? 'N/D' : f.lps.toLocaleString('es-MX', {
        maximumFractionDigits: 2
      }) + ' LPS');
    }
    for (let i = 0; i < facilityLabels.length; i++) {
      const item = facilityLabels[i];
      updateTile(i + tankSpecs.length + flowReadings.length, 'facility', item.name);
    }
    if (atlasInitialized && !rows.size) return;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    if (!atlasInitialized) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
      atlasInitialized = true;
    } else {
      for (const row of rows) {
        atlasStripInk.clearRect(0, 0, atlasStrip.width, atlasStrip.height);
        atlasStripInk.drawImage(atlas, 0, row * LABEL_TILE_H * labelSuperSample, atlasStrip.width, atlasStrip.height, 0, 0, atlasStrip.width, atlasStrip.height);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, (LABEL_ROWS - 1 - row) * LABEL_TILE_H * labelSuperSample, gl.RGBA, gl.UNSIGNED_BYTE, atlasStrip);
      }
    }
    gl.generateMipmap(gl.TEXTURE_2D);
  }
  const levelTileW = 512, levelTileH = 256, levelCols = 8, levelRows = 8;
  const levelAtlas = document.createElement('canvas');
  levelAtlas.width = levelTileW * levelCols;
  levelAtlas.height = levelTileH * levelRows;
  const levelInk = levelAtlas.getContext('2d');
  const levelTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, levelTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const levelSignatures = new Array(tankSpecs.length);
  const levelStrip = document.createElement('canvas');
  levelStrip.width = levelTileW * levelCols;
  levelStrip.height = levelTileH;
  const levelStripInk = levelStrip.getContext('2d');
  let levelAtlasInitialized = false, lastLevelsAtlas = -1;
  function updateLevelAtlas(now) {
    if (lastLevelsAtlas >= 0) return;
    lastLevelsAtlas = now;
    const rows = new Set;
    for (let i = 0; i < tankSpecs.length; i++) {
      const spec = tankSpecs[i], col = i % levelCols, row = Math.floor(i / levelCols);
      const delta = spec.delta;
      const direction = mvTrendDirection(delta);
      const color = direction === null ? '#b7cbd3' : direction === 'up' ? '#52cf85' : '#e87b83';
      const meters = spec.meters === null ? 'N/D' : spec.meters.toFixed(2) + ' m';
      const trend = mvTrendDisplay(delta);
      const signature = meters + '' + trend + '' + color;
      if (levelSignatures[i] === signature) continue;
      levelSignatures[i] = signature;
      rows.add(row);
      const px = col * levelTileW, py = row * levelTileH;
      const c = levelInk;
      c.clearRect(px, py, levelTileW, levelTileH);
      c.save();
      c.translate(px, py);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.lineJoin = 'round';
      function engrave(str, y, font, fill, width = 7) {
        c.font = font;
        c.strokeStyle = 'rgba(51,78,90,.9)';
        c.lineWidth = width + 1;
        c.shadowColor = 'rgba(11,24,30,.22)';
        c.shadowBlur = 2;
        c.strokeText(str, 256, y);
        c.shadowBlur = 0;
        c.fillStyle = fill;
        c.fillText(str, 256, y);
      }
      const bx = 55, by = 33, bw = 402, bh = 191;
      c.save();
      c.shadowColor = 'rgba(0,0,0,.24)';
      c.shadowBlur = 7;
      c.shadowOffsetY = 3;
      const panel = c.createLinearGradient(0, by, 0, by + bh);
      panel.addColorStop(0, 'rgba(95,121,131,.97)');
      panel.addColorStop(1, 'rgba(59,87,99,.97)');
      c.fillStyle = panel;
      c.beginPath();
      c.moveTo(bx + 12, by);
      c.lineTo(bx + bw - 12, by);
      c.quadraticCurveTo(bx + bw, by, bx + bw, by + 12);
      c.lineTo(bx + bw, by + bh - 12);
      c.quadraticCurveTo(bx + bw, by + bh, bx + bw - 12, by + bh);
      c.lineTo(bx + 12, by + bh);
      c.quadraticCurveTo(bx, by + bh, bx, by + bh - 12);
      c.lineTo(bx, by + 12);
      c.quadraticCurveTo(bx, by, bx + 12, by);
      c.closePath();
      c.fill();
      c.shadowBlur = 0;
      c.shadowOffsetY = 0;
      c.strokeStyle = 'rgba(174,201,209,.84)';
      c.lineWidth = 3;
      c.stroke();
      c.fillStyle = color;
      c.fillRect(bx + 11, by + 14, 5, bh - 28);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = '#d9e5e9';
      c.font = '700 23px Segoe UI,Arial,sans-serif';
      c.fillText('NIVEL', 256, by + 25);
      c.fillStyle = '#ffffff';
      c.font = '800 82px Segoe UI,Arial,sans-serif';
      c.fillText(meters, 256, by + 97);
      c.strokeStyle = 'rgba(170,207,218,.30)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(bx + 39, by + 137);
      c.lineTo(bx + bw - 39, by + 137);
      c.stroke();
      c.textAlign = 'left';
      c.fillStyle = '#d9e5e9';
      c.font = '600 22px Segoe UI,Arial,sans-serif';
      c.fillText('TENDENCIA', bx + 36, by + 164);
      c.textAlign = 'right';
      c.fillStyle = direction === null ? '#e8eff2' : direction === 'up' ? '#77efad' : '#ff929c';
      c.font = '650 30px Segoe UI,Arial,sans-serif';
      c.fillText(trend, bx + bw - 30, by + 164, 185);
      c.restore();
      c.restore();
    }
    if (levelAtlasInitialized && !rows.size) return;
    gl.bindTexture(gl.TEXTURE_2D, levelTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    if (!levelAtlasInitialized) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, levelAtlas);
      levelAtlasInitialized = true;
    } else {
      for (const row of rows) {
        levelStripInk.clearRect(0, 0, levelStrip.width, levelTileH);
        levelStripInk.drawImage(levelAtlas, 0, row * levelTileH, levelStrip.width, levelTileH, 0, 0, levelStrip.width, levelTileH);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, (levelRows - 1 - row) * levelTileH, gl.RGBA, gl.UNSIGNED_BYTE, levelStrip);
      }
    }
    gl.generateMipmap(gl.TEXTURE_2D);
  }
  function exteriorWallAngle(p) {
    return Math.atan2(camera[2] - p.z, camera[0] - p.x);
  }
  function surfacePosition(p, lateralX, verticalY) {
    const radius = p.wallRadius + p.surfaceGap;
    const a = exteriorWallAngle(p) - Math.asin(Math.max(-.88, Math.min(.88, lateralX / radius)));
    return [ p.x + Math.cos(a) * radius, p.screenY + verticalY, p.z + Math.sin(a) * radius ];
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
      put(bl, U0, v0);
      put(br, U1, v0);
      put(tr, U1, v1);
      put(bl, U0, v0);
      put(tr, U1, v1);
      put(tl, U0, v1);
    }
  }
  function projectWorldQuadCorners(points) {
    let left = 1e9, right = -1e9, top = 1e9, bottom = -1e9;
    for (const p of points) {
      const w = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15];
      if (w < .08) return null;
      const sx = (.5 + .5 * (vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12]) / w) * vw;
      const sy = (.5 - .5 * (vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13]) / w) * vh;
      left = Math.min(left, sx);
      right = Math.max(right, sx);
      top = Math.min(top, sy);
      bottom = Math.max(bottom, sy);
    }
    return {
      left: left,
      right: right,
      top: top,
      bottom: bottom
    };
  }
  function fixedScreenRect(p) {
    const w = p.screenW * .98, h = p.screenH * .98;
    return projectWorldQuadCorners([ surfacePosition(p, -w / 2, -h / 2), surfacePosition(p, w / 2, -h / 2), surfacePosition(p, -w / 2, h / 2), surfacePosition(p, w / 2, h / 2), surfacePosition(p, 0, -h / 2), surfacePosition(p, 0, h / 2) ]);
  }
  let levelDisplayMatrix = null, levelDisplayIndex = -2, levelDisplayCount = 0;
  function renderWallDisplays(now) {
    if (!state.levels) return;
    updateLevelAtlas(now);
    const currentIndex = presentation.active ? presentation.index : -1;
    if (levelDisplayIndex !== currentIndex || !matrixIsCurrent(levelDisplayMatrix)) {
      const verts = [];
      for (let i = 0; i < tankLabels.length; i++) {
        if (currentIndex >= 0 && i !== currentIndex) continue;
        addWallPanelQuad(verts, i, tankLabels[i]);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, levelDisplayBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
      levelDisplayCount = verts.length / 5;
      levelDisplayIndex = currentIndex;
      if (!levelDisplayMatrix) levelDisplayMatrix = new Float32Array(16);
      levelDisplayMatrix.set(vp);
    }
    drawWorldText(null, levelTexture, true, levelDisplayBuffer, levelDisplayCount);
  }
  const externalWallsBuffer = gl.createBuffer();
  let externalWallsCount = 0, externalWallsUpdatedAt = -Infinity;
  const externalWallAngles = new Float32Array(tankLabels.length);
  function renderExternalWalls(now) {
    let cameraMoved = externalWallsCount === 0;
    if (!cameraMoved && now - externalWallsUpdatedAt >= 30) {
      for (let i = 0; i < tankLabels.length; i++) {
        const angle = exteriorWallAngle(tankLabels[i]);
        let difference = Math.abs(angle - externalWallAngles[i]);
        if (difference > Math.PI) difference = Math.PI * 2 - difference;
        if (difference > .018) {
          cameraMoved = true;
          break;
        }
      }
    }
    if (cameraMoved) {
      const tris = [];
      function emitQuad(a, b, c, d, normal, material, em = 0, opacity = 1) {
        appendVertex(tris, a, normal, material, em, 0, 0, opacity);
        appendVertex(tris, b, normal, material, em, 0, 0, opacity);
        appendVertex(tris, c, normal, material, em, 0, 0, opacity);
        appendVertex(tris, a, normal, material, em, 0, 0, opacity);
        appendVertex(tris, c, normal, material, em, 0, 0, opacity);
        appendVertex(tris, d, normal, material, em, 0, 0, opacity);
      }
      function curvedStrip(p, r, y1, y2, halfAngle, material, em = 0, opacity = 1) {
        const base = exteriorWallAngle(p), segments = 24;
        for (let i = 0; i < segments; i++) {
          const a = base - halfAngle + i * halfAngle * 2 / segments;
          const b = base - halfAngle + (i + 1) * halfAngle * 2 / segments;
          const v1 = [ p.x + r * Math.cos(a), y1, p.z + r * Math.sin(a) ], v2 = [ p.x + r * Math.cos(b), y1, p.z + r * Math.sin(b) ];
          const v3 = [ v2[0], y2, v2[2] ], v4 = [ v1[0], y2, v1[2] ];
          const normal = [ Math.cos((a + b) / 2), 0, Math.sin((a + b) / 2) ];
          emitQuad(v1, v2, v3, v4, normal, material, em, opacity);
        }
      }
      function verticalTrim(p, angle, thickness, color) {
        const r = p.wallRadius + .013, y1 = p.screenY - p.height * .4, y2 = p.screenY + p.height * .4;
        const ca = Math.cos(angle), sa = Math.sin(angle), t = [ -sa, 0, ca ];
        const center = [ p.x + r * ca, 0, p.z + r * sa ];
        const v1 = [ center[0] - thickness * t[0], y1, center[2] - thickness * t[2] ];
        const v2 = [ center[0] + thickness * t[0], y1, center[2] + thickness * t[2] ];
        const v3 = [ v2[0], y2, v2[2] ], v4 = [ v1[0], y2, v1[2] ];
        emitQuad(v1, v2, v3, v4, [ ca, 0, sa ], color, .3);
      }
      for (const p of tankLabels) {
        const a = exteriorWallAngle(p), half = .66;
        const y0 = .56, y1 = p.screenY + p.height * .37;
        curvedStrip(p, p.wallRadius, y0, y1, half, '#a3a9b0', .08, .42);
        curvedStrip(p, p.wallRadius + .025, y0, y0 + .064, half, '#b6bec5', .2);
        curvedStrip(p, p.wallRadius + .025, y1 - .066, y1, half, '#b6bec5', .2);
        verticalTrim(p, a - half, .05, '#b2bac0');
        verticalTrim(p, a + half, .05, '#b2bac0');
        const v = [ Math.cos(a), 0, Math.sin(a) ];
        const side = [ -Math.sin(a), 0, Math.cos(a) ];
        for (const d of [ -.47, .47 ]) {
          const cx = p.x + p.wallRadius * v[0] + d * side[0];
          const cz = p.z + p.wallRadius * v[2] + d * side[2];
          const x0 = cx - .045, x1 = cx + .045, z0 = cz - .045, z1 = cz + .045;
          emitQuad([ x0, .31, z1 ], [ x1, .31, z1 ], [ x1, y0, z1 ], [ x0, y0, z1 ], [ 0, 0, 1 ], '#7f9fab', .17);
        }
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, externalWallsBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tris), gl.DYNAMIC_DRAW);
      externalWallsCount = tris.length / 13;
      externalWallsUpdatedAt = now;
      for (let i = 0; i < tankLabels.length; i++) externalWallAngles[i] = exteriorWallAngle(tankLabels[i]);
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, externalWallsBuffer);
    const stride = 13 * 4;
    gl.enableVertexAttribArray(loc.pos);
    gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(loc.normal);
    gl.vertexAttribPointer(loc.normal, 3, gl.FLOAT, false, stride, 12);
    gl.enableVertexAttribArray(loc.color);
    gl.vertexAttribPointer(loc.color, 3, gl.FLOAT, false, stride, 24);
    gl.enableVertexAttribArray(loc.data);
    gl.vertexAttribPointer(loc.data, 4, gl.FLOAT, false, stride, 36);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.drawArrays(gl.TRIANGLES, 0, externalWallsCount);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }
  function drawWorldText(verts, whichTexture, depthTest = true, reusableBuffer = null, reusableCount = 0, cullFaces = false, solidDepth = false, opacity = 1) {
    const count = reusableBuffer ? reusableCount : verts.length / 5;
    if (!count || opacity <= .005) return;
    gl.useProgram(textProgram);
    gl.uniformMatrix4fv(txtVP, false, vp);
    gl.uniform1f(txtOpacity, opacity);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, whichTexture);
    gl.uniform1i(txtTex, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, reusableBuffer || textBuffer);
    if (!reusableBuffer) gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(txtPos);
    gl.vertexAttribPointer(txtPos, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(txtUV);
    gl.vertexAttribPointer(txtUV, 2, gl.FLOAT, false, 20, 12);
    if (depthTest) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    if (cullFaces) {
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      gl.frontFace(gl.CCW);
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(solidDepth);
    gl.drawArrays(gl.TRIANGLES, 0, count);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    if (cullFaces) gl.disable(gl.CULL_FACE);
  }
  const fragmentPrecision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT).precision > 0 ? 'highp' : 'mediump';
  const textVert = `attribute vec3 aPosition;attribute vec2 aTexCoord;uniform mat4 uVP;varying ${fragmentPrecision} vec2 vUV;\nvoid main(){gl_Position=uVP*vec4(aPosition,1.);vUV=aTexCoord;}`;
  const textFrag = `precision ${fragmentPrecision} float;varying ${fragmentPrecision} vec2 vUV;uniform sampler2D uAtlas;uniform float uOpacity;\nvoid main(){vec4 c=texture2D(uAtlas,vUV);float alpha=smoothstep(.11,.73,c.a)*uOpacity;if(alpha<.018)discard;gl_FragColor=vec4(c.rgb,alpha);}`;
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
  const levelDisplayBuffer = gl.createBuffer();
  const worldLabelBuffer = gl.createBuffer();
  const flowPlateStates = flowReadings.map((f, index) => {
    const label = String(f.name || 'FLUJO');
    return {
      index: index,
      x: f.x + (f.dx || 0) / 25,
      z: f.z + (f.dy || 0) / 24.5,
      y: .73,
      width: Math.min(3.9, Math.max(2.6, label.length * .069 + 1.5)),
      height: .78,
      visible: false,
      opacity: 0,
      rect: null
    };
  });
  let flowPlateFrame = 0, flowPlateLayoutFrame = -Infinity;
  function flowPlateScreenRect(x, y, z, width, height, offset = .015) {
    const basis = billboardBasis(x, y, z);
    const center = [ x + basis.front[0] * offset, y + basis.front[1] * offset, z + basis.front[2] * offset ];
    const position = (a, b) => plus(center, plus(mul(basis.right, a), mul(basis.up, b)));
    return projectWorldQuadCorners([ position(-width / 2, -height / 2), position(width / 2, -height / 2), position(-width / 2, height / 2), position(width / 2, height / 2) ]);
  }
  function flowPlateOverlap(a, b) {
    const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const aSize = (a.right - a.left) * (a.bottom - a.top);
    const bSize = (b.right - b.left) * (b.bottom - b.top);
    return width * height / Math.max(1, Math.min(aSize, bSize));
  }
  function flowPlateTankRects() {
    const rects = [];
    for (const tank of tankLabels) {
      const radius = (tank.radius || tank.wallRadius || 1.4) * .82;
      const corners = [];
      for (const dx of [ -radius, radius ]) for (const dz of [ -radius, radius ]) {
        corners.push([ tank.x + dx, .54, tank.z + dz ], [ tank.x + dx, tank.y - .12, tank.z + dz ]);
      }
      const rect = projectWorldQuadCorners(corners);
      if (rect) rects.push(rect);
    }
    return rects;
  }
  function updateFlowPlateVisibility(now, protectedRects, tankRects) {
    const dt = flowPlateFrame ? Math.min(.05, Math.max(0, (now - flowPlateFrame) / 1e3)) : .016;
    flowPlateFrame = now;
    const layoutInterval = currentMeanFrame > 30 ? 95 : currentMeanFrame > 23 ? 75 : 52;
    if (now - flowPlateLayoutFrame >= layoutInterval) {
      flowPlateLayoutFrame = now;
      const options = [];
      const occupied = [];
      for (const card of flowPlateStates) {
        const rect = flowPlateScreenRect(card.x, card.y, card.z, card.width, card.height);
        card.rect = rect;
        if (!rect) {
          card.visible = false;
          continue;
        }
        const distance = Math.hypot(camera[0] - card.x, camera[1] - card.y, camera[2] - card.z);
        options.push({
          card: card,
          rect: rect,
          distance: distance
        });
      }
      options.sort((a, b) => a.distance - (a.card.visible ? 2 : 0) - (b.distance - (b.card.visible ? 2 : 0)) || a.card.index - b.card.index);
      for (const {card: card, rect: rect} of options) {
        const area = Math.max(1, (rect.right - rect.left) * (rect.bottom - rect.top));
        const width = Math.max(0, Math.min(rect.right, vw - 7) - Math.max(rect.left, 7));
        const height = Math.max(0, Math.min(rect.bottom, vh - 7) - Math.max(rect.top, 7));
        let blocked = width * height / area < .78 || rect.right - rect.left < 64 || rect.bottom - rect.top < 17;
        const threshold = card.visible ? .2 : .085;
        if (!blocked) for (const other of protectedRects) {
          if (flowPlateOverlap(rect, other) > threshold) {
            blocked = true;
            break;
          }
        }
        if (!blocked) for (const other of tankRects) {
          if (flowPlateOverlap(rect, other) > (card.visible ? .65 : .47)) {
            blocked = true;
            break;
          }
        }
        if (!blocked) for (const other of occupied) {
          if (flowPlateOverlap(rect, other) > threshold) {
            blocked = true;
            break;
          }
        }
        card.visible = !blocked;
        if (!blocked) occupied.push(rect);
      }
    }
    for (const card of flowPlateStates) {
      if (!card.rect) card.visible = false;
      const target = card.visible ? 1 : 0;
      card.opacity += (target - card.opacity) * Math.min(1, dt * (card.visible ? 8.5 : 6.5));
      if (Math.abs(card.opacity - target) < .006) card.opacity = target;
    }
  }
  function drawFlowPlates() {
    const groups = Array.from({
      length: 8
    }, () => []);
    for (const card of flowPlateStates) {
      if (card.opacity < .045) continue;
      const bucket = Math.max(0, Math.min(7, Math.floor(card.opacity * 7.999)));
      const mvCardDist = Math.max(.001, Math.hypot(camera[0] - card.x, camera[1] - card.y, camera[2] - card.z));
      const mvCardPull = Math.min(1.6, mvCardDist * .35), mvCardScale = (mvCardDist - mvCardPull) / mvCardDist;
      addCameraPlate(groups[bucket], tankSpecs.length + card.index, card.x, card.y, card.z, card.width * mvCardScale, card.height * mvCardScale, mvCardPull);
    }
    for (let bucket = 0; bucket < groups.length; bucket++) {
      if (groups[bucket].length) drawWorldText(groups[bucket], texture, true, null, 0, false, false, (bucket + 1) / 8);
    }
  }
  function matrixIsCurrent(previous) {
    if (!previous) return false;
    for (let i = 0; i < 16; i++) if (Math.abs(previous[i] - vp[i]) > 2e-6) return false;
    return true;
  }
  function pushQuad(vertices, id, bl, br, tr, tl) {
    const col = id % LABEL_COLS, row = Math.floor(id / LABEL_COLS);
    const u0 = col / LABEL_COLS, u1 = (col + 1) / LABEL_COLS;
    const v1 = 1 - row / LABEL_ROWS, v0 = 1 - (row + 1) / LABEL_ROWS;
    const insert = (p, u, v) => vertices.push(p[0], p[1], p[2], u, v);
    insert(bl, u0, v0);
    insert(br, u1, v0);
    insert(tr, u1, v1);
    insert(bl, u0, v0);
    insert(tr, u1, v1);
    insert(tl, u0, v1);
  }
  function billboardBasis(x, y, z) {
    const front = norm([ camera[0] - x, camera[1] - y, camera[2] - z ]);
    const right = norm(cross([ 0, 1, 0 ], front));
    const up = norm(cross(front, right));
    return {
      front: front,
      right: right,
      up: up
    };
  }
  function addCameraPlate(vertices, id, x, y, z, width, height, offset = 0) {
    const basis = billboardBasis(x, y, z), center = [ x + basis.front[0] * offset, y + basis.front[1] * offset, z + basis.front[2] * offset ];
    const pos = (a, b) => plus(center, plus(mul(basis.right, a), mul(basis.up, b)));
    const hw = width * .5, hh = height * .5;
    pushQuad(vertices, id, pos(-hw, -hh), pos(hw, -hh), pos(hw, hh), pos(-hw, hh));
  }
  function screenQuad(x, y, z, width, height, offset = .05) {
    const basis = billboardBasis(x, y, z);
    const center = [ x + basis.front[0] * offset, y + basis.front[1] * offset, z + basis.front[2] * offset ];
    const corners = [];
    for (const [sx, sy] of [ [ -1, -1 ], [ 1, -1 ], [ 1, 1 ], [ -1, 1 ] ]) {
      const v = plus(center, plus(mul(basis.right, width * .5 * sx), mul(basis.up, height * .5 * sy)));
      const w = vp[3] * v[0] + vp[7] * v[1] + vp[11] * v[2] + vp[15];
      if (w <= .08) return null;
      const px = (.5 + .5 * (vp[0] * v[0] + vp[4] * v[1] + vp[8] * v[2] + vp[12]) / w) * vw;
      const py = (.5 - .5 * (vp[1] * v[0] + vp[5] * v[1] + vp[9] * v[2] + vp[13]) / w) * vh;
      corners.push([ px, py ]);
    }
    return {
      left: Math.min(...corners.map(c => c[0])),
      right: Math.max(...corners.map(c => c[0])),
      top: Math.min(...corners.map(c => c[1])),
      bottom: Math.max(...corners.map(c => c[1]))
    };
  }
  let worldLabelMatrix = null, worldLabelFlags = '', worldLabelCount = 0;
  function renderWorldLabels(now) {
    updateAtlas(now);
    const topMode = isTopViewMode();
    if (topMode) updateTopViewOverlays(); else hideTopViewOverlays();
    if (topMode) return;
    renderWallDisplays(now);
    if (state.flowLabels && !presentation.active) {
      const refreshLayout = now - flowPlateLayoutFrame >= (currentMeanFrame > 30 ? 95 : currentMeanFrame > 23 ? 75 : 52);
      const protectedRects = [];
      if (refreshLayout) {
        if (state.levels) for (const panel of tankLabels) {
          const rect = fixedScreenRect(panel);
          if (rect) protectedRects.push(rect);
        }
        if (state.labels) for (let i = 0; i < tankLabels.length; i++) {
          const p = tankLabels[i], name = shortNames[tankSpecs[i].name] || tankSpecs[i].name;
          const width = Math.min(5.45, Math.max(2.75, name.length * .235 + .9));
          const rect = flowPlateScreenRect(p.x, p.y + .54, p.z, width, .9, .18);
          if (rect) protectedRects.push(rect);
        }
        if (state.labels) for (const facility of facilityLabels) {
          const width = Math.min(5.2, Math.max(3.2, facility.name.length * .245 + .9));
          const rect = flowPlateScreenRect(facility.x, facility.y, facility.z, width, .9, .1);
          if (rect) protectedRects.push(rect);
        }
      }
      updateFlowPlateVisibility(now, protectedRects, refreshLayout ? flowPlateTankRects() : []);
      drawFlowPlates();
    } else {
      flowPlateFrame = now;
      flowPlateLayoutFrame = -Infinity;
      for (const card of flowPlateStates) {
        card.visible = false;
        card.opacity = 0;
      }
    }
    const flags = (state.labels ? '1' : '0') + (state.flowLabels ? '1' : '0') + (presentation.active ? 'p' + presentation.index : 'a');
    if (flags === worldLabelFlags && matrixIsCurrent(worldLabelMatrix)) {
      drawWorldText(null, texture, true, worldLabelBuffer, worldLabelCount);
      return;
    }
    const verts = [];
    if (state.labels) {
      for (let i = 0; i < tankLabels.length; i++) {
        if (presentation.active && i !== presentation.index) continue;
        const p = tankLabels[i], spec = tankSpecs[i], name = shortNames[spec.name] || spec.name;
        const w = Math.min(5.45, Math.max(2.75, name.length * .235 + .9));
        const y = p.y + .54;
        addCameraPlate(verts, i, p.x, y, p.z, w, .9, .18);
      }
    }
    if (state.labels) {
      for (let i = 0; i < facilityLabels.length; i++) {
        const item = facilityLabels[i];
        const w = Math.min(5.2, Math.max(3.2, item.name.length * .245 + .9));
        addCameraPlate(verts, tankSpecs.length + flowReadings.length + i, item.x, item.y, item.z, w, .9, .1);
      }
    }
    worldLabelFlags = flags;
    if (!worldLabelMatrix) worldLabelMatrix = new Float32Array(16);
    worldLabelMatrix.set(vp);
    gl.bindBuffer(gl.ARRAY_BUFFER, worldLabelBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
    worldLabelCount = verts.length / 5;
    drawWorldText(null, texture, true, worldLabelBuffer, worldLabelCount);
  }
  const mvAlertBox = document.getElementById('mvAlerts');
  const mvAlertPresentationStyle = document.createElement('style');
  mvAlertPresentationStyle.textContent = `\n    #mvAlerts.mv-present-positioned{position:fixed!important;left:var(--mv-present-alert-left,12px)!important;right:auto!important;top:var(--mv-present-alert-top,12px)!important;bottom:auto!important;max-width:var(--mv-present-alert-width,460px)!important;align-items:flex-start!important;z-index:85!important}\n    html.mv-present-alerts #mvAlerts{position:fixed!important;left:var(--mv-present-alert-left,12px)!important;right:auto!important;top:var(--mv-present-alert-top,12px)!important;bottom:auto!important;z-index:85!important}\n    #mvAlerts.mv-present-positioned .mv-alerts-strip{box-sizing:border-box!important;max-width:var(--mv-present-alert-width,460px)!important}\n    #mvAlerts.mv-present-short .mv-alerts-marquee,#mvAlerts.mv-present-short.is-cycle-open .mv-alerts-marquee{width:34px!important;flex:0 0 34px!important}\n    #mvAlerts.mv-present-short .mv-alerts-marquee-window{opacity:0!important;visibility:hidden!important;pointer-events:none!important}\n    #mvAlerts.mv-present-compact .mv-alerts-strip{position:relative!important;display:flex!important;align-items:center!important;justify-content:center!important;width:46px!important;min-width:46px!important;max-width:46px!important;height:46px!important;padding:4px!important;gap:0!important;overflow:visible!important}\n    #mvAlerts.mv-present-compact .mv-alerts-marquee,#mvAlerts.mv-present-compact.is-cycle-open .mv-alerts-marquee{width:34px!important;max-width:34px!important;flex:0 0 34px!important;height:34px!important}\n    #mvAlerts.mv-present-compact .mv-alerts-marquee-window{visibility:hidden!important;opacity:0!important;pointer-events:none!important}\n    #mvAlerts.mv-present-compact #mvAlertsToggle{position:absolute!important;inset:0!important;z-index:2!important;display:block!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;opacity:0!important;cursor:pointer!important}\n    #mvAlerts.mv-present-compact #mvAlertsCount:not([hidden]){position:absolute!important;top:-8px!important;right:-8px!important;z-index:3!important;display:flex!important;align-items:center!important;justify-content:center!important;min-width:19px!important;height:19px!important;padding:0 3px!important;border-radius:12px!important;background:#cc1735!important;color:white!important;font:700 11px/1 Arial,sans-serif!important;box-shadow:0 0 0 2px white!important;pointer-events:none!important}\n    #mvAlerts.mv-present-compact #mvAlertsCount[hidden]{display:none!important}\n    #mvAlerts.mv-present-compact .mv-alerts-panel{position:fixed!important;left:var(--mv-present-alert-list-left,12px)!important;right:auto!important;top:var(--mv-present-alert-list-top,65px)!important;bottom:auto!important;width:min(354px,calc(100vw - 24px))!important;max-height:min(52dvh,460px)!important}\n  `;
  document.head.appendChild(mvAlertPresentationStyle);
  let mvNextAlertPlacement = 0;
  let mvAlertPlacementState = '';
  function mvPositionAlertsForPresentation() {
    const panel = presEl('presentationPanel');
    const visible = presentation.active && mvAlertsEnabled;
    const stateKey = visible ? 'active' : 'inactive';
    const clock = performance.now();
    if (clock < mvNextAlertPlacement && mvAlertPlacementState === stateKey) return;
    mvNextAlertPlacement = clock + 120;
    mvAlertPlacementState = stateKey;
    document.documentElement.classList.toggle('mv-present-alerts', !!visible);
    mvAlertBox.classList.toggle('mv-present-positioned', !!visible);
    mvAlertBox.classList.remove('mv-present-short', 'mv-present-compact');
    if (!visible) {
      for (const property of [ 'left', 'right', 'top', 'bottom', 'position' ]) mvAlertBox.style.removeProperty(property);
      return;
    }
    const w = window.innerWidth, h = window.innerHeight;
    const panelRect = panel && !panel.hidden && presentationUi.visible ? panel.getBoundingClientRect() : null;
    const leftSpace = panelRect ? Math.max(0, panelRect.left - 22) : Math.max(0, w - 24);
    let x = 12, y = 12, width = Math.min(460, Math.max(46, leftSpace));
    if (leftSpace < 470) mvAlertBox.classList.add(leftSpace >= 180 ? 'mv-present-short' : 'mv-present-compact');
    if (leftSpace < 180) width = 46;
    const listTop = Math.min(h - 70, y + 54);
    mvAlertBox.style.setProperty('--mv-present-alert-left', x + 'px');
    mvAlertBox.style.setProperty('--mv-present-alert-top', y + 'px');
    mvAlertBox.style.setProperty('--mv-present-alert-width', width + 'px');
    mvAlertBox.style.setProperty('--mv-present-alert-list-left', x + 'px');
    mvAlertBox.style.setProperty('--mv-present-alert-list-top', listTop + 'px');
    mvAlertBox.style.setProperty('position', 'fixed', 'important');
    mvAlertBox.style.setProperty('left', x + 'px', 'important');
    mvAlertBox.style.setProperty('right', 'auto', 'important');
    mvAlertBox.style.setProperty('top', y + 'px', 'important');
    mvAlertBox.style.setProperty('bottom', 'auto', 'important');
  }
  const mvAlertToggle = document.getElementById('mvAlertsToggle');
  const mvAlertPanel = document.getElementById('mvAlertsPanel');
  const mvAlertClose = document.getElementById('mvAlertsClose');
  const mvAlertCount = document.getElementById('mvAlertsCount');
  document.querySelector('.mv-alerts-strip').appendChild(mvAlertCount);
  const mvAlertSummary = document.getElementById('mvAlertsSummary');
  const mvAlertTicker = document.getElementById('mvAlertsTicker');
  const mvAlertList = document.getElementById('mvAlertsList');
  const mvAlertFreshness = document.getElementById('mvAlertsFreshness');
  const mvAlertMarkers = document.getElementById('mvAlertMarkers');
  const mvAlertVisibilityControl = document.getElementById('alertsVisibilityToggle');
  const MV_ALERT_VISIBILITY_STORAGE = 'telemetria_anillo_tv_3d_alertas_visibles';
  let mvAlertsEnabled = true;
  try {
    mvAlertsEnabled = localStorage.getItem(MV_ALERT_VISIBILITY_STORAGE) !== '0';
  } catch (error) {
    console.warn('No se pudo leer la preferencia de alertas:', error.message);
  }
  const MV_ALERT_REVIEW_MS = 5 * 60 * 1e3;
  const MV_ALERT_TICKER_OPEN_MS = 3200;
  const MV_ALERT_TICKER_GAP_MS = 2500;
  const MV_ALERT_TICKER_TRANSITION_MS = 480;
  const MV_ALERT_STORAGE = 'telemetria_anillo_tv_3d_alertas_v2';
  const mvTypeLabels = {
    com: 'Sin comunicación',
    obs: 'Nivel fuera de parámetros',
    zero: 'Flujo 0'
  };
  const mvAlertPriority = {
    com: 0,
    obs: 1,
    zero: 2
  };
  const mvTankMarkerStyle = document.createElement('style');
  mvTankMarkerStyle.textContent = `\n    #mvAlertMarkers .mv-tank-alert{width:14px!important;height:14px!important;min-width:14px!important;min-height:14px!important;max-width:14px!important;max-height:14px!important;box-sizing:border-box!important;padding:0!important;border-width:2px!important;border-style:solid!important;border-radius:50%!important;background:rgba(17,23,27,.94)!important;box-shadow:0 0 0 2px rgba(0,0,0,.18)!important;transform:translate(-50%,-50%)!important;z-index:1}\n    #mvAlertMarkers .mv-tank-alert::after{content:"";position:absolute;inset:2px;border-radius:50%;background:currentColor;opacity:.95}\n    #mvAlertMarkers .mv-tank-alert.mv-alert-com{border-color:rgba(217,88,88,.9)!important;color:#ff6f6f!important}\n    #mvAlertMarkers .mv-tank-alert.mv-alert-obs{border-color:rgba(203,163,78,.94)!important;color:#ffd561!important}\n    #mvAlertMarkers .mv-tank-alert[hidden]{display:none!important}\n    #mvAlerts .mv-alert-com .mv-alert-pin{background:#d9555c!important}\n    #mvAlerts .mv-alert-obs .mv-alert-pin{background:#d2a12e!important}\n    #mvAlerts .mv-alert-item .mv-alert-pin,#mvAlerts .mv-alert-line .mv-alert-pin{display:block!important;flex:0 0 8px!important;width:8px!important;height:8px!important;border-radius:50%!important}\n  `;
  document.head.appendChild(mvTankMarkerStyle);
  const anilloAlarmColors = document.createElement('style');
  anilloAlarmColors.textContent = `\n    .mv-alert-zero .mv-alert-pin{background:#8a949b!important}\n    .mv-tank-alert.mv-alert-zero{border-color:#8a949b!important;color:#8a949b!important}\n  `;
  document.head.appendChild(anilloAlarmColors);
  const mvAlertsState = {
    items: [],
    received: false,
    fresh: false,
    open: false,
    lastReview: 0,
    lastVerified: 0,
    rotationIndex: 0,
    latestNew: new Set,
    highlightUntil: 0,
    markers: new Map,
    tickerTimer: 0
  };
  function mvTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
  function mvReadStoredAlerts() {
    try {
      const saved = JSON.parse(localStorage.getItem(MV_ALERT_STORAGE) || 'null');
      if (!saved || saved.version !== 2 || !Array.isArray(saved.items) || !Number.isFinite(saved.lastVerified) || Date.now() - saved.lastVerified > 24 * 60 * 60 * 1e3 || saved.lastVerified > Date.now() + 6e4) return;
      mvAlertsState.items = saved.items.filter(item => item && typeof item.id === 'string' && typeof item.tank === 'string' && Object.hasOwn(mvTypeLabels, item.type) && typeof item.detail === 'string').map(item => ({
        ...item,
        verified: false
      }));
      mvAlertsState.received = true;
      mvAlertsState.lastVerified = saved.lastVerified;
    } catch (error) {
      console.warn('No se pudo recuperar el estado de alertas:', error.message);
    }
  }
  function mvSaveAlerts() {
    try {
      localStorage.setItem(MV_ALERT_STORAGE, JSON.stringify({
        version: 2,
        lastVerified: mvAlertsState.lastVerified,
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
    presentationJumpToTank(index);
    presentation.paused = true;
    const pause = document.getElementById('presentationPause');
    if (pause) pause.textContent = 'Reanudar';
  }
  function mvSetAlert(next, type, tank, detail, identity, timestamp) {
    const id = type + '|' + identity;
    const old = next.get(id);
    next.set(id, {
      id: id,
      type: type,
      tank: tank,
      detail: detail,
      identity: identity,
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
      text.textContent = !mvAlertsState.received ? 'Esperando lecturas de Telemetría' : !mvAlertsState.fresh ? 'Sin verificación reciente' : 'Sin alertas activas';
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
          mvAlertsState.rotationIndex = active.length ? (active.findIndex(alert => alert.id === item.id) + 1 + active.length) % active.length : 0;
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
    mvAlertToggle.setAttribute('aria-label', mvAlertsState.open ? 'Cerrar lista de alertas' : 'Ver todas las alertas: ' + count + ' activas');
    mvAlertBox.classList.toggle('has-active-alerts', count > 0);
    mvAlertBox.dataset.ready = String(mvAlertsState.received && mvAlertsState.fresh);
    mvAlertBox.dataset.severity = items.some(item => item.type === 'com') ? 'com' : items.some(item => item.type === 'obs') ? 'obs' : items.some(item => item.type === 'zero') ? 'zero' : 'normal';
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
    const next = new Map(mvAlertsState.items.map(item => [ item.id, {
      ...item,
      verified: false
    } ]));
    const tanks = payload.tanques || {};
    for (const spec of tankSpecs) {
      const row = tanks[spec.name];
      if (!row) continue;
      const comId = 'com|' + spec.name;
      const obsId = 'obs|' + spec.name;
      if (row.estado === 'sin_comunicacion') {
        next.delete(obsId);
        mvSetAlert(next, 'com', spec.name, row.hora ? 'Última lectura ' + row.hora : 'Sin hora de lectura confirmada', spec.name, timestamp);
      } else if (row.estado === 'actual') {
        next.delete(comId);
        if (row.en_observacion === true) {
          const value = typeof row.nivel_m === 'number' && Number.isFinite(row.nivel_m) ? row.nivel_m.toFixed(2) + ' m' : '';
          mvSetAlert(next, 'obs', spec.name, value, spec.name, timestamp);
        } else {
          next.delete(obsId);
        }
      } else {
        next.delete(comId);
        next.delete(obsId);
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
    mvAlertsState.items = [ ...next.values() ].sort((a, b) => mvAlertPriority[a.type] - mvAlertPriority[b.type] || a.tank.localeCompare(b.tank, 'es') || a.id.localeCompare(b.id));
    const newOnes = mvAlertsState.items.filter(item => !previous.has(item.id));
    mvAlertsState.latestNew = new Set(newOnes.map(item => item.id));
    mvAlertsState.highlightUntil = newOnes.length ? timestamp + 6e3 : 0;
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
      const alarms = mvAlertsState.items.filter(item => item.tank === spec.name && (item.type === 'com' || item.type === 'obs'));
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
    const topMode = isTopViewMode();
    const protectedElements = [ presEl('presentationPanel'), mvAlertBox, document.getElementById('mvAlertsPanel'), document.getElementById('controlsDock'), document.getElementById('mvLiveStatus') ];
    const protectedRects = protectedElements.filter(el => el && !el.hidden && el.getClientRects().length).map(el => el.getBoundingClientRect());
    const overlapsUi = (x, y) => protectedRects.some(rect => x >= rect.left - 12 && x <= rect.right + 12 && y >= rect.top - 12 && y <= rect.bottom + 12);
    const nameBoxes = [];
    if (!topMode && state.labels) {
      for (let i = 0; i < tankLabels.length; i++) {
        if (presentation.active && i !== presentation.index) continue;
        const p = tankLabels[i], spec = tankSpecs[i];
        const name = shortNames[spec.name] || spec.name;
        const width = Math.min(5.45, Math.max(2.75, name.length * .235 + .9));
        const bounds = screenQuad(p.x, p.y + .54, p.z, width, .9, .18);
        if (bounds) nameBoxes.push({
          index: i,
          bounds: bounds
        });
      }
    }
    const candidates = [];
    for (let i = 0; i < tankLabels.length; i++) {
      const p = tankLabels[i];
      const marker = mvAlertsState.markers.get(tankSpecs[i].name);
      if (!marker) continue;
      marker.hidden = true;
      let x, y, depth;
      if (topMode && state.labels && topViewUi.visible) {
        const card = topViewUi.tankCards[i];
        const el = card && card.name;
        if (!el || el.style.display === 'none' || !el.getClientRects().length) continue;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        x = rect.left + rect.width / 2;
        y = rect.top - 12;
        depth = 0;
      } else if (state.labels && (!presentation.active || i === presentation.index)) {
        const box = nameBoxes.find(item => item.index === i);
        if (!box) continue;
        x = (box.bounds.left + box.bounds.right) * .5;
        y = box.bounds.top - 12;
        depth = 0;
      } else {
        const projected = projectPointToScreen(p.x, p.y + 1.44, p.z);
        if (!projected) continue;
        x = projected.x;
        y = projected.y - 10;
        depth = projected.w;
      }
      if (x < 10 || x > vw - 10 || y < 10 || y > vh - 10 || overlapsUi(x, y)) continue;
      if (nameBoxes.some(item => x > item.bounds.left - 8 && x < item.bounds.right + 8 && y > item.bounds.top - 7 && y < item.bounds.bottom + 8)) continue;
      candidates.push({
        marker: marker,
        x: x,
        y: y,
        red: marker.classList.contains('mv-alert-com'),
        depth: depth
      });
    }
    candidates.sort((a, b) => Number(b.red) - Number(a.red) || a.depth - b.depth);
    const placed = [];
    for (const entry of candidates) {
      if (placed.some(other => Math.hypot(other.x - entry.x, other.y - entry.y) < 18)) continue;
      placed.push(entry);
      entry.marker.style.left = entry.x.toFixed(1) + 'px';
      entry.marker.style.top = entry.y.toFixed(1) + 'px';
      entry.marker.hidden = false;
    }
  }
  function mvSetAlertVisibility(enabled, save = false) {
    mvAlertsEnabled = !!enabled;
    document.documentElement.classList.toggle('mv-alerts-off', !mvAlertsEnabled);
    mvAlertVisibilityControl.classList.toggle('active', mvAlertsEnabled);
    mvAlertVisibilityControl.setAttribute('aria-pressed', String(mvAlertsEnabled));
    mvAlertVisibilityControl.querySelector('.mv-alerts-control-label').textContent = mvAlertsEnabled ? 'Alertas: activadas' : 'Alertas: desactivadas';
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
  }, 1e3);
  mvSetAlertVisibility(mvAlertsEnabled);
  mvReadStoredAlerts();
  mvDrawAlerts();
  mvBuildMarkers();
  const liveStatus = document.getElementById('mvLiveStatus');
  const liveEndpoint = '/Telemetria/php/anillo_tv_3d_datos.php';
  const TELEMETRY_POLL_MS = 1e4;
  let liveRequestActive = false, hasReceivedData = false, initialTelemetryResolved = false;
  function numberOrNull(v) {
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  }
  function setStatus(message, mode) {
    liveStatus.textContent = message;
    liveStatus.dataset.state = mode;
  }
  async function reloadRealData() {
    if (liveRequestActive) return;
    liveRequestActive = true;
    try {
      const ctrl = new AbortController;
      const requestTimeout = setTimeout(() => ctrl.abort(), 8e3);
      let response, body;
      try {
        response = await fetch(liveEndpoint + '?t=' + Date.now(), {
          cache: 'no-store',
          credentials: 'same-origin',
          signal: ctrl.signal,
          headers: {
            Accept: 'application/json'
          }
        });
        const responseText = await response.text();
        try {
          body = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error('El servidor no devolvió JSON válido (revisar PHP y API).');
        }
      } finally {
        clearTimeout(requestTimeout);
      }
      if (!response.ok || !body || body.ok !== true) throw new Error(body && body.error ? body.error : 'API sin lecturas');
      for (const spec of tankSpecs) {
        const t = body.tanques && body.tanques[spec.name];
        spec.meters = t ? numberOrNull(t.nivel_m) : null;
        spec.delta = t ? numberOrNull(t.tendencia_m) : null;
        spec.state = t && t.estado ? t.estado : 'sin_datos';
        spec.hora = t && t.hora ? t.hora : null;
        if (t && Number.isFinite(Number(t.capacidad_cm)) && Number(t.capacidad_cm) > 0) spec.capacityMeters = Number(t.capacidad_cm) / 100;
        spec.fraction = spec.meters === null ? 0 : Math.max(0, Math.min(1, spec.meters / spec.capacityMeters));
        spec.baseFraction = spec.fraction;
      }
      presentationFlowRecords = body.flujos || {};
      mvRecordLiveHistory();
      for (const f of flowReadings) {
        const record = body.flujos && f.backendKey ? body.flujos[f.backendKey] : null;
        f.lps = record ? numberOrNull(record.lps) : null;
        f.connection = record && record.estado ? record.estado : 'sin_datos';
      }
      refreshPipeLevels(body.tanques);
      let pumpsChanged = !hasReceivedData;
      for (const p of pumpMeshes) {
        const oldActive = p.active;
        const group = body.bombas && body.bombas[p.group];
        const value = group && group.length > p.index ? group[p.index] : null;
        p.active = value === true ? true : value === false ? false : null;
        if (p.active !== oldActive) pumpsChanged = true;
      }
      if (pumpsChanged) rebuildPumpBatches();
      lastAtlas = -1;
      lastLevelsAtlas = -1;
      hasReceivedData = true;
      telemetryRevision++;
      presentation.sourceTime = body.consultado || body.actualizado || '';
      presentation.sourceFresh = true;
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
      setStatus('Conectado · ' + valid + '/36 tanques' + (lost ? ' · ' + lost + ' sin comunicación' : '') + ' · ' + body.consultado, 'ok');
    } catch (err) {
      refreshPipeLevels(null);
      if (mvAlertsState.fresh) {
        mvAlertsState.fresh = false;
        mvDrawAlerts();
        mvBuildMarkers();
      }
      setStatus('', 'silent');
      presentation.sourceFresh = false;
      presentationData();
      console.warn('Anillo TV 3D: no se recibieron datos actuales:', err.message);
    } finally {
      liveRequestActive = false;
      initialTelemetryResolved = true;
    }
  }
  reloadRealData();
  setInterval(reloadRealData, TELEMETRY_POLL_MS);
  let vp = new Float32Array(16), camera = [ 0, 0, 0 ], vw = 1, vh = 1, last = performance.now(), elapsed = 0;
  const levelsUniform = new Float32Array(tankSpecs.length);
  const cameraUniform = new Float32Array(3);
  let dynamicQuality = 1, qualityElapsed = 0, qualityFrames = 0, longestFrame = 0, qualityRecovery = 0, currentMeanFrame = 16.7;
  function mvResizeUltra() {
    const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight);
    const nativeDensity = Math.max(1, window.devicePixelRatio || 1);
    const pixels = width * height;
    const maximumDensity = Math.min(3, Math.sqrt(36e6 / pixels), maximumViewportDimensions[0] / width, maximumViewportDimensions[1] / height, maximumRenderbufferDimension / width, maximumRenderbufferDimension / height);
    const preferred = Math.max(nativeDensity, pixels >= 7e6 ? 1.5 : pixels >= 3e6 ? 1.8 : 2);
    const dpr = Math.min(maximumDensity, Math.max(.6, Math.max(.75, preferred * dynamicQuality) * mvMotionScale));
    const w = Math.max(1, Math.round(width * dpr)), h = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    lastDisplayDensity = window.devicePixelRatio || 1;
    vw = width;
    vh = height;
  }
  function adaptQuality(frameMs) {
    if (frameMs <= 0) return;
    const sample = Math.min(frameMs, 200);
    qualityElapsed += sample;
    longestFrame = Math.max(longestFrame, sample);
    qualityFrames++;
    if (qualityElapsed < 1450) return;
    const meanFrame = (qualityElapsed - longestFrame) / (qualityFrames - 1);
    longestFrame = 0;
    currentMeanFrame = currentMeanFrame * .54 + meanFrame * .46;
    let nextQuality = dynamicQuality;
    if (meanFrame > 41) {
      nextQuality = Math.max(.52, dynamicQuality - .18);
      qualityRecovery = 0;
    } else if (meanFrame > 29) {
      nextQuality = Math.max(.52, dynamicQuality - .11);
      qualityRecovery = 0;
    } else if (meanFrame > 23) {
      nextQuality = Math.max(.52, dynamicQuality - .065);
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
    const cap = mobile ? memory <= 2 ? 1 : 1.35 : 2;
    const maximumPixels = mobile ? 16e5 : memory >= 8 ? 135e5 : 108e5;
    const maximumDensity = Math.min(cap, Math.sqrt(maximumPixels / pixels), maximumViewportDimensions[0] / width, maximumViewportDimensions[1] / height, maximumRenderbufferDimension / width, maximumRenderbufferDimension / height);
    const preferredDensity = mobile ? nativeDensity : Math.max(nativeDensity, pixels >= 55e5 ? 1.21 : pixels >= 3e6 ? 1.48 : 1.8);
    const minimumDensity = mobile ? .65 : Math.min(maximumDensity, Math.max(.76, nativeDensity * .74));
    const dpr = Math.min(maximumDensity, Math.max(.6, Math.min(maximumDensity, Math.max(minimumDensity, preferredDensity * dynamicQuality)) * mvMotionScale));
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
      qualityElapsed = 0;
      qualityFrames = 0;
      longestFrame = 0;
      requestAnimationFrame(render);
      return;
    }
    adaptQuality(frameMs);
    if (!presentation.active) clamp();
    const dt = Math.min(frameMs / 1e3, .05);
    eveningBlend += (Number(eveningEnabled) - eveningBlend) * Math.min(1, dt * 2.3);
    tickGuidedTour(dt);
    tickPresentation(now, dt);
    tickAroundOrbit(dt);
    if (state.water) elapsed += dt * state.flowSpeed;
    for (let i = 0; i < tankSpecs.length; i++) levelsUniform[i] = tankSpecs[i].fraction;
    if (!presentation.active && !state.userPanned && !state.auto) {
      const optimal = fitPose(state.yaw, state.pitch);
      const mixCenter = Math.min(1, dt * 11);
      for (let i = 0; i < 3; i++) state.target[i] += (optimal.target[i] - state.target[i]) * mixCenter;
    }
    const desiredDistance = presentation.active ? presentation.dist : guidedTour.active && state.auto ? guidedTour.dist : aroundOrbit.active ? fitDistanceFromTarget(state.yaw, state.pitch, state.target) * aroundOrbit.zoomScale : manualCameraDistance !== null ? manualCameraDistance * state.zoom : fitDistanceFromTarget(state.yaw, state.pitch, state.target) * state.zoom;
    const rate = desiredDistance > state.dist ? 7.5 : 6.8;
    state.dist += (desiredDistance - state.dist) * Math.min(1, dt * (aroundOrbit.active ? 2.7 : presentation.active ? 10 : guidedTour.active && state.auto ? 5.2 : rate));
    const sp = Math.sin(state.pitch), cp = Math.cos(state.pitch);
    let viewTarget = presentation.active ? state.target : [ state.target[0], Math.max(.6, state.target[1]), state.target[2] ];
    camera = plus(viewTarget, [ state.dist * sp * Math.cos(state.yaw), state.dist * cp, state.dist * sp * Math.sin(state.yaw) ]);
    if (camera[1] < .85) camera[1] = .85;
    if (presentation.active || guidedTour.active) {
      for (const p of tankLabels) {
        if (camera[1] > p.baseY + p.height + 1) continue;
        const dx = camera[0] - p.x, dz = camera[2] - p.z;
        const distance = Math.hypot(dx, dz);
        const clearance = p.wallRadius + .68;
        if (distance < clearance) {
          const scale = clearance / Math.max(1e-4, distance);
          camera[0] = p.x + dx * scale;
          camera[2] = p.z + dz * scale;
        }
      }
    }
    if (!presentation.active && !guidedTour.active) keepCameraAboveTerrain(camera, viewTarget);
    if (guidedTour.active && guidedTour.eye && guidedTour.look && !presentation.active) {
      camera = [ ...guidedTour.eye ];
      viewTarget = [ ...guidedTour.look ];
    }
    vp.set(matMul(perspective(44 * Math.PI / 180, vw / vh, .15, 4e3), lookAt(camera, viewTarget, [ 0, 1, 0 ])));
    mvRenderShadowMap(now, () => {
      const pumpMesh = isTopViewMode() ? superiorPumpBuffers[0] : livePumpBuffers[0];
      drawOpaqueScene();
      if (pumpMesh.count) {
        bindBuffer(pumpMesh);
        gl.drawArrays(gl.TRIANGLES, 0, pumpMesh.count);
      }
      bindBuffer(pipeBuffers[0]);
      gl.drawArrays(gl.TRIANGLES, 0, pipeBuffers[0].count);
      bindBuffer(buffers[1]);
      gl.drawArrays(gl.TRIANGLES, 0, buffers[1].count);
    });
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(.63, .74, .82, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    renderSky(camera, viewTarget, now * .001, vw / vh);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, turfTexture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, forestTexture);
    gl.activeTexture(gl.TEXTURE0);
    gl.useProgram(program);
    gl.uniformMatrix4fv(loc.vp, false, vp);
    cameraUniform.set(camera);
    gl.uniform3fv(loc.cam, cameraUniform);
    gl.uniform1f(loc.time, elapsed);
    gl.uniform1fv(loc.levels, levelsUniform);
    gl.uniform1f(loc.anim, 1);
    if (loc.evening !== null) gl.uniform1f(loc.evening, eveningBlend);
    mvBindProUniforms();
    if (loc.terrainDetail !== null) gl.uniform1f(loc.terrainDetail, dynamicQuality >= .7 && currentMeanFrame < 29 ? 1 : 0);
    function drawPumps(part) {
      const mesh = isTopViewMode() ? superiorPumpBuffers[part] : livePumpBuffers[part];
      if (mesh.count) {
        bindBuffer(mesh);
        gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
      }
    }
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    drawOpaqueScene();
    pipeWater.draw(vp);
    drawPumps(0);
    bindBuffer(pipeBuffers[0]);
    gl.drawArrays(gl.TRIANGLES, 0, pipeBuffers[0].count);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.disable(gl.CULL_FACE);
    bindBuffer(buffers[1]);
    gl.drawArrays(gl.TRIANGLES, 0, buffers[1].count);
    drawPumps(1);
    bindBuffer(pipeBuffers[1]);
    gl.drawArrays(gl.TRIANGLES, 0, pipeBuffers[1].count);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    bindBuffer(buffers[2]);
    gl.drawArrays(gl.TRIANGLES, 0, buffers[2].count);
    drawPumps(2);
    bindBuffer(pipeBuffers[2]);
    gl.drawArrays(gl.TRIANGLES, 0, pipeBuffers[2].count);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    renderExternalWalls(now);
    renderWorldLabels(now);
    mvPositionAlertsForPresentation();
    mvPositionMarkers();
    if (!document.documentElement.classList.contains('mv-scene-ready') && initialTelemetryResolved && (skyAssetSettled || !skyProgram)) {
      document.documentElement.classList.add('mv-scene-ready');
    }
    requestAnimationFrame(render);
  }
  function clamp() {
    state.pitch = Math.max(.12, Math.min(freeNavigationActive ? 1.48 : 1.48, state.pitch));
    state.zoom = Math.max(freeNavigationActive ? .1 : .32, Math.min(freeNavigationActive ? 5 : 2.4, state.zoom));
  }
  function orbit(dx, dy) {
    topViewSelected = false;
    state.yaw -= dx * .006;
    state.pitch -= dy * .006;
    clamp();
  }
  function pan(dx, dy) {
    if (!presentation.active) state.userPanned = true;
    const sp = Math.sin(state.yaw), cp = Math.cos(state.yaw), horizontal = [ -sp, 0, cp ], right = mul(horizontal, -1), sens = state.dist * .00125;
    state.target = plus(state.target, plus(mul(right, dx * sens), [ 0, dy * sens, 0 ]));
    state.target[0] = Math.max(-32, Math.min(32, state.target[0]));
    state.target[1] = Math.max(.6, Math.min(12, state.target[1]));
    state.target[2] = Math.max(-23, Math.min(23, state.target[2]));
  }
  function freeMove(dx, dy) {
    state.userPanned = true;
    const yaw = state.yaw;
    const distanceScale = Math.max(3.5, state.dist) * .0013;
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
  let dragging = false, lastX = 0, lastY = 0, mode = 'orbit', pointers = new Map, prevTouch = null, downPoint = null;
  function navigationModeForPointer(e) {
    if (!freeNavigationActive) return e.button === 2 || e.shiftKey ? 'pan' : 'orbit';
    if (e.button === 1) return 'height';
    const alternative = e.button === 2 || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey;
    return freeNavigationMode === 'rotate' !== alternative ? 'orbit' : 'free-pan';
  }
  mvMotionResize = resize;
  canvas.addEventListener('pointermove', e => {
    if (e.buttons) mvMotionStart();
  }, {
    passive: true
  });
  canvas.addEventListener('wheel', mvMotionStart, {
    passive: true
  });
  canvas.addEventListener('touchmove', mvMotionStart, {
    passive: true
  });
  canvas.addEventListener('pointerdown', e => {
    if (presentation.active) stopPresentation();
    if (guidedTour.active) stopGuidedTour(true);
    if (freeNavigationActive && (e.button === 2 || e.button === 1)) e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY
    });
    lastX = e.clientX;
    lastY = e.clientY;
    downPoint = {
      x: e.clientX,
      y: e.clientY,
      id: e.pointerId,
      dragged: false
    };
    dragging = true;
    mode = navigationModeForPointer(e);
    canvas.classList.add('dragging');
    if (freeNavigationActive) canvas.style.cursor = mode === 'orbit' ? 'move' : 'grabbing';
    prevTouch = null;
  });
  canvas.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    const old = pointers.get(e.pointerId);
    if (downPoint && Math.hypot(e.clientX - downPoint.x, e.clientY - downPoint.y) > 5) downPoint.dragged = true;
    pointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY
    });
    const arr = [ ...pointers.values() ];
    if (aroundOrbit.active) {
      if (arr.length >= 2) {
        const d = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
        if (prevTouch) adjustAroundOrbitZoom(Math.exp((prevTouch.d - d) * .007));
        prevTouch = {
          d: d
        };
      } else if (dragging) {
        const dx = e.clientX - old.x, dy = e.clientY - old.y;
        if (mode === 'pan' || e.shiftKey) pan(dx, dy); else adjustAroundOrbitPitch(dy);
        prevTouch = null;
      } else prevTouch = null;
      return;
    }
    if (arr.length >= 2) {
      const d = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y), cx = (arr[0].x + arr[1].x) / 2, cy = (arr[0].y + arr[1].y) / 2;
      if (prevTouch) {
        state.zoom *= Math.exp((prevTouch.d - d) * .007);
        (freeNavigationActive ? freeMove : pan)(cx - prevTouch.cx, cy - prevTouch.cy);
        clamp();
      }
      prevTouch = {
        d: d,
        cx: cx,
        cy: cy
      };
    } else if (dragging) {
      const dx = e.clientX - old.x, dy = e.clientY - old.y;
      if (freeNavigationActive) {
        if (mode === 'orbit') orbit(dx, dy); else if (mode === 'height') freeHeight(dy); else freeMove(dx, dy);
      } else if (mode === 'pan' || e.shiftKey) pan(dx, dy); else orbit(dx, dy);
    }
  });
  function up(e) {
    pointers.delete(e.pointerId);
    if (!pointers.size) {
      dragging = false;
      canvas.classList.remove('dragging');
      updateFreeNavigationControls();
    }
    prevTouch = null;
    downPoint = null;
  }
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('lostpointercapture', up);
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (aroundOrbit.active) {
      adjustAroundOrbitZoom(Math.exp(e.deltaY * .001));
      return;
    }
    if (presentation.active) stopPresentation();
    if (guidedTour.active) stopGuidedTour(true);
    state.zoom *= Math.exp(e.deltaY * .001);
    clamp();
  }, {
    passive: false
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  document.getElementById('reset').addEventListener('click', () => {
    if (freeNavigationActive) setFreeNavigation(false);
    if (aroundOrbit.active) stopAroundOrbit(true);
    if (presentation.active) stopPresentation();
    if (guidedTour.active) stopGuidedTour(false);
    manualCameraDistance = null;
  });
  document.getElementById('reset').addEventListener('click', () => {
    topViewSelected = false;
    state.yaw = initial.yaw;
    state.pitch = initial.pitch;
    state.zoom = initial.zoom;
    state.target = [ ...fitPose(state.yaw, state.pitch).target ];
    state.userPanned = false;
    state.auto = false;
    document.getElementById('spin').classList.remove('active');
  });
  document.getElementById('top').addEventListener('click', () => {
    if (freeNavigationActive) setFreeNavigation(false);
    if (aroundOrbit.active) stopAroundOrbit(true);
    if (presentation.active) stopPresentation();
    if (guidedTour.active) stopGuidedTour(false);
    manualCameraDistance = null;
  });
  document.getElementById('top').addEventListener('click', () => {
    topViewSelected = true;
    state.yaw = Math.PI / 2;
    state.pitch = .45;
    state.zoom = initial.zoom;
    state.target = [ ...fitPose(state.yaw, state.pitch).target ];
    state.userPanned = false;
    state.auto = false;
    document.getElementById('spin').classList.remove('active');
  });
  document.getElementById('zoomIn').addEventListener('click', () => {
    if (aroundOrbit.active) {
      adjustAroundOrbitZoom(.84);
      return;
    }
    if (presentation.active) stopPresentation();
    if (guidedTour.active) stopGuidedTour(true);
    state.zoom *= .84;
    clamp();
  });
  document.getElementById('zoomOut').addEventListener('click', () => {
    if (aroundOrbit.active) {
      adjustAroundOrbitZoom(1.19);
      return;
    }
    if (presentation.active) stopPresentation();
    if (guidedTour.active) stopGuidedTour(true);
    state.zoom *= 1.19;
    clamp();
  });
  document.getElementById('spin').addEventListener('click', () => {
    if (aroundOrbit.active) stopAroundOrbit(true);
    if (guidedTour.active) stopGuidedTour(true); else startGuidedTour();
  });
  document.getElementById('water').addEventListener('click', e => {
    state.water = !state.water;
    e.currentTarget.classList.toggle('active', state.water);
    e.currentTarget.lastChild.textContent = state.water ? 'Agua animada' : 'Agua pausada';
  });
  document.getElementById('flowSpeed').addEventListener('click', e => {
    state.flowSpeed = state.flowSpeed === 1 ? 2 : state.flowSpeed === 2 ? 3 : 1;
    e.currentTarget.textContent = 'Velocidad visual ×' + state.flowSpeed;
  });
  document.getElementById('flowLabelsToggle').addEventListener('click', e => {
    state.flowLabels = !state.flowLabels;
    e.currentTarget.classList.toggle('active', state.flowLabels);
  });
  document.getElementById('levelsToggle').addEventListener('click', e => {
    state.levels = !state.levels;
    e.currentTarget.classList.toggle('active', state.levels);
  });
  document.getElementById('labelsToggle').addEventListener('click', e => {
    state.labels = !state.labels;
    e.currentTarget.classList.toggle('active', state.labels);
  });
  document.getElementById('full').addEventListener('click', async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    } else await document.documentElement.requestFullscreen().catch(() => {});
  });
  document.addEventListener('keydown', e => {
    if (!presentation.active) return;
    if (e.key === 'Escape') {
      stopPresentation();
      e.preventDefault();
    } else if (e.key.toLowerCase() === 'i' && presentation.active) {
      setPresentationInfoVisible(!presentationUi.visible);
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      presentationJump(presentationPosition() + 1);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      presentationJump(presentationPosition() - 1);
      e.preventDefault();
    } else if (e.key === ' ') {
      presentation.paused = !presentation.paused;
      presEl('presentationPause').textContent = presentation.paused ? 'Continuar' : 'Pausar';
      e.preventDefault();
    }
  }, true);
  document.addEventListener('keydown', e => {
    if (presentation.active) return;
    if (guidedTour.active && (e.key.toLowerCase() === 'r' || e.key === '+' || e.key === '=' || e.key === '-' || e.key.startsWith('Arrow'))) stopGuidedTour(true);
    if (aroundOrbit.active && (e.key === '+' || e.key === '=' || e.key === '-')) {
      e.preventDefault();
      adjustAroundOrbitZoom(e.key === '-' ? 1.12 : .88);
      return;
    }
    if (aroundOrbit.active && (e.key.toLowerCase() === 'r' || e.key.startsWith('Arrow'))) stopAroundOrbit(true);
    if (e.key.toLowerCase() === 'r') document.getElementById('reset').click();
    if (e.key.toLowerCase() === 'f') document.getElementById('full').click();
    if (e.key === '+' || e.key === '=') state.zoom *= .88;
    if (e.key === '-') state.zoom *= 1.12;
    if (e.key === 'ArrowLeft') {
      topViewSelected = false;
      state.yaw += .08;
    }
    if (e.key === 'ArrowRight') {
      topViewSelected = false;
      state.yaw -= .08;
    }
    if (e.key === 'ArrowUp') {
      topViewSelected = false;
      state.pitch -= .08;
    }
    if (e.key === 'ArrowDown') {
      topViewSelected = false;
      state.pitch += .08;
    }
    clamp();
  });
  window.addEventListener('resize', () => {
    presentationAngleCache.clear();
    resize();
  });
  if (typeof ResizeObserver !== 'undefined') {
    const sceneObserver = new ResizeObserver(() => {
      presentationAngleCache.clear();
      resize();
    });
    sceneObserver.observe(canvas);
  }
  resize();
  const initialFrame = fitPose(state.yaw, state.pitch);
  state.target = [ ...initialFrame.target ];
  state.dist = initialFrame.dist * state.zoom;
  requestAnimationFrame(render);
})();

(function() {
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
    launcher.setAttribute('aria-label', open ? 'Ocultar controles de Anillo TV' : 'Mostrar controles de Anillo TV');
    launcher.title = open ? 'Ocultar controles' : 'Mostrar controles';
    launcher.classList.toggle('is-open', open);
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Ocultar controles' : 'Mostrar controles');
    }
    if (!open) panel.querySelectorAll('button').forEach(b => {
      if (b === document.activeElement) b.blur();
    });
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

(function() {
  const heading = document.getElementById('mvPanoramaHeading');
  const dateLine = heading ? heading.querySelector('.mv-panorama-date-line') : null;
  const control = document.getElementById('dateTimeVisibilityToggle');
  const controlText = document.getElementById('mvDateTimeControlText');
  if (!heading || !dateLine || !control || !controlText) return;
  const storageKey = 'telemetria_anillo_tv_3d_fecha_hora_v1';
  function setVisible(visible, persist) {
    dateLine.hidden = !visible;
    heading.classList.toggle('mv-datetime-hidden', !visible);
    control.classList.toggle('active', visible);
    control.setAttribute('aria-pressed', String(visible));
    controlText.textContent = visible ? 'Fecha y hora: activadas' : 'Fecha y hora: desactivadas';
    control.title = visible ? 'Ocultar fecha y hora' : 'Mostrar fecha y hora';
    if (persist) {
      try {
        localStorage.setItem(storageKey, visible ? '1' : '0');
      } catch (error) {}
    }
  }
  let visible = true;
  try {
    visible = localStorage.getItem(storageKey) !== '0';
  } catch (error) {}
  setVisible(visible, false);
  control.addEventListener('click', () => setVisible(dateLine.hidden, true));
})();

(function() {
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
