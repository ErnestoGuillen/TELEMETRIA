'use strict';

(function() {
  const mvSkyPhoto = /[?&]cielo=foto/i.test(location.search);
  const $ = id => document.getElementById(id);
  const config = {
    title: 'Acueducto Linares',
    nodes: [ [ 'li00', 'Presa Cerro Prieto', 'reservoir', 34, 14, 'PRESACP' ], [ 'li01', 'PB1 Linares', 'pump', 22, 12.6, 'LINPB001' ], [ 'li02', 'PB2 Linares', 'pump', 10, 10.6, 'LINPB002' ], [ 'li02a', 'PB2A Linares', 'pump', -1.5, 8.2, 'LINPB02A' ], [ 'li03', 'PB3 Linares', 'pump', -13, 4.4, 'LINPB003' ], [ 'li04a', 'Garrapatas', 'tank', -22, -1.6, 'TGRP0001' ], [ 'li05', 'Rompedor de carga', 'facility', -30, -.8, 'ROMPE001' ], [ 'li04', 'PB4 Linares', 'pump', -38.5, 2.4, 'LINPB004' ] ],
    lines: [ [ 'li00', 'li01' ], [ 'li01', 'li02' ], [ 'li02', 'li02a' ], [ 'li02a', 'li03' ], [ 'li03', 'li04a' ], [ 'li04a', 'li05' ], [ 'li05', 'li04' ] ]
  };
  const separateCasetaX = x => x >= 22 ? x : 22 + (x - 22) * 1.105;
  for (const node of config.nodes) {
    if (node[0] !== 'li00') node[3] = separateCasetaX(node[3]);
  }
  const mvNodeAngle = new Map, MV_PUMP_LANE = 6.2, MV_PIPE_LANE = 5.45;
  (() => {
    const layout = {
      li00: [ 57.8, 14 ],
      li01: [ 39, 5.2 ],
      li02: [ 22.8, 3.6 ],
      li02a: [ 6.6, 2.6 ],
      li03: [ -9.6, 2 ],
      li04a: [ -24.6, 5.6 ],
      li05: [ -21.6, -6.8 ],
      li04: [ -24, -21.5 ]
    };
    for (const n of config.nodes) {
      const q = layout[n[0]];
      if (q) {
        n[3] = q[0];
        n[4] = q[1];
      }
    }
    const order = [ 'li00', 'li01', 'li02', 'li02a', 'li03', 'li04a', 'li05', 'li04' ].map(id => config.nodes.find(n => n[0] === id)).filter(Boolean);
    order.forEach((n, i) => {
      const a = order[Math.max(0, i - 1)], b = order[Math.min(order.length - 1, i + 1)];
      const tx = b[3] - a[3], tz = b[4] - a[4], l = Math.hypot(tx, tz) || 1;
      mvNodeAngle.set(n[0], n[0] === 'li00' ? 0 : Math.atan2(-tz / l, -tx / l));
    });
  })();
  const nodeById = new Map(config.nodes.map((node, index) => [ node[0], {
    data: node,
    index: index
  } ]));
  const live = new Map;
  const canvas = $('scene');
  const mvUltra = /[?&](calidad=ultra|4k)(&|$|=)/i.test(location.search) || window.screen && window.screen.width * (window.devicePixelRatio || 1) >= 3800;
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
  const gl = canvas.getContext('webgl2', {
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  }) || canvas.getContext('webgl', {
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  if (!gl) {
    $('notice').hidden = false;
    $('notice').textContent = 'No se pudo iniciar WebGL. Activa la aceleración gráfica.';
    return;
  }
  canvas.addEventListener('webglcontextlost', e => e.preventDefault());
  canvas.addEventListener('webglcontextrestored', () => location.reload());
  let eveningBlend = 0;
  const vert = `\nattribute vec3 aPos; attribute vec3 aNormal; attribute vec3 aColor; attribute vec4 aData;\nuniform mat4 uVP; uniform float uTime; uniform float uAnimate; uniform float uLevels[36];\nuniform mat4 uLightVP; varying vec4 vShadowPos;\nvarying vec3 vNormal; varying vec3 vColor; varying vec3 vPos; varying vec4 vData;\nvarying float vTankFill;\nfloat getLevel(float id){\n  if(id < 0.5) return uLevels[0];\n  if(id < 1.5) return uLevels[1];\n  if(id < 2.5) return uLevels[2];\n  if(id < 3.5) return uLevels[3];\n  if(id < 4.5) return uLevels[4];\n  if(id < 5.5) return uLevels[5];\n  if(id < 6.5) return uLevels[6];\n  if(id < 7.5) return uLevels[7];\n  if(id < 8.5) return uLevels[8];\n  if(id < 9.5) return uLevels[9];\n  if(id < 10.5) return uLevels[10];\n  if(id < 11.5) return uLevels[11];\n  if(id < 12.5) return uLevels[12];\n  if(id < 13.5) return uLevels[13];\n  if(id < 14.5) return uLevels[14];\n  if(id < 15.5) return uLevels[15];\n  if(id < 16.5) return uLevels[16];\n  if(id < 17.5) return uLevels[17];\n  if(id < 18.5) return uLevels[18];\n  if(id < 19.5) return uLevels[19];\n  if(id < 20.5) return uLevels[20];\n  if(id < 21.5) return uLevels[21];\n  if(id < 22.5) return uLevels[22];\n  if(id < 23.5) return uLevels[23];\n  if(id < 24.5) return uLevels[24];\n  if(id < 25.5) return uLevels[25];\n  if(id < 26.5) return uLevels[26];\n  if(id < 27.5) return uLevels[27];\n  if(id < 28.5) return uLevels[28];\n  if(id < 29.5) return uLevels[29];\n  if(id < 30.5) return uLevels[30];\n  if(id < 31.5) return uLevels[31];\n  if(id < 32.5) return uLevels[32];\n  if(id < 33.5) return uLevels[33];\n  if(id < 34.5) return uLevels[34];\n  return uLevels[35];\n}\nvoid main(){\n  vec3 p=aPos;\n  vTankFill=1.0;\n  if((aData.z>4.5 && aData.z<6.5) || (aData.z>8.5 && aData.z<10.5)){\n\n    float level=clamp(getLevel(aData.y),.0,.94);\n    vTankFill=level;\n    p.y=.52+(p.y-.52)*level;\n    if(aData.z>8.5 && aData.z<9.5){\n      vec2 impact=aColor.xy;\n      float r=length(aPos.xz-impact);\n      float fade=exp(-r*1.9);\n      float wave=sin(r*18.0-uTime*4.4)*.024*fade;\n      float secondary=sin(r*32.0-uTime*6.2)*.008*fade;\n      p.y+=(wave+secondary)*smoothstep(.025,.20,level)*uAnimate;\n    }else if(aData.z>9.5 && aData.z<10.5){\n      vec2 impact=aColor.xy;\n      vec2 radial=aPos.xz-impact;\n      float originalR=length(radial);\n      float newR=mod(originalR+uTime*.34*uAnimate,.78);\n      p.xz=impact+normalize(radial+vec2(.00001))*(newR+.02);\n      p.y+=(.028+.009*sin(newR*17.0-uTime*2.0))*level;\n    }else if(aData.z>5.5){\n      p.y+=(.020*sin(aPos.x*3.1+uTime*.95)+.017*sin(aPos.z*4.1-uTime*.65))*level*uAnimate;\n    }\n  }\n  vec3 surfaceNormal=aNormal;\n  if(aData.z>11.5&&aData.z<12.5){\n    float t=uTime*uAnimate;\n    float edge=clamp(aData.x,0.0,1.0);\n    float p1=dot(aPos.xz,vec2(.46,.27))+t*.75;\n    float p2=dot(aPos.xz,vec2(-.21,.64))-t*1.02;\n    float p3=dot(aPos.xz,vec2(.93,-.73))+t*1.37;\n    float damLevel=uLevels[35];\n    if(damLevel>.0005)p.y+=(clamp(damLevel,0.0,1.0)-.85)*.55;\n    p.y+=edge*uAnimate*(.050*sin(p1)+.030*sin(p2)+.012*sin(p3));\n    vec2 slope=edge*uAnimate*(vec2(.46,.27)*(.034*cos(p1))+vec2(-.21,.64)*(.020*cos(p2))+vec2(.93,-.73)*(.008*cos(p3)));\n    surfaceNormal=normalize(vec3(-slope.x,1.0,-slope.y));\n  }\n  vPos=p;vNormal=surfaceNormal;vColor=aColor;vData=aData;\n  if(aData.z>18.5&&aData.z<19.5){\n    float active=getLevel(aData.y);\n    float enabled=smoothstep(.70,.95,active);\n    vColor=mix(vec3(.43,.49,.53),vec3(.075,.48,.255),enabled);\n    vData.x+=enabled*.22;\n  }\n  gl_Position=uVP*vec4(p,1.0);\n  vShadowPos=uLightVP*vec4(p,1.0);\n}`;
  const frag = `\nprecision highp float;\nvarying vec3 vNormal; varying vec3 vColor; varying vec3 vPos; varying vec4 vData;\nvarying float vTankFill;\nuniform vec3 uCamera; uniform float uTime; uniform float uAnimate; uniform float uTerrainDetail; uniform float uEvening;\nuniform float uCasetaLights[5];\nfloat casetaLamp(float id){\n  if(id<.5)return uCasetaLights[0];\n  if(id<1.5)return uCasetaLights[1];\n  if(id<2.5)return uCasetaLights[2];\n  if(id<3.5)return uCasetaLights[3];\n  return uCasetaLights[4];\n}\nuniform sampler2D uTurfTex; uniform sampler2D uForestTex;\n\nuniform sampler2D uShadowMap; uniform float uShadowOn; uniform vec2 uShadowTexel; varying vec4 vShadowPos;\nuniform vec4 uTankAO[14]; uniform float uAOOn;\nuniform sampler2D uSkyRefl; uniform float uSkyReflReady; uniform float uProGrade;\nfloat mvShadow(vec3 N, vec3 L){\n  if(uShadowOn<.5) return 1.0;\n  vec3 s=vShadowPos.xyz/vShadowPos.w*.5+.5;\n  if(s.x<=.001||s.x>=.999||s.y<=.001||s.y>=.999||s.z>=1.0) return 1.0;\n  float ndl=clamp(dot(N,L),0.0,1.0);\n  float bias=.00045+.0016*(1.0-ndl);\n  vec2 t=uShadowTexel*1.35;\n  float sum=step(s.z-bias,texture2D(uShadowMap,s.xy+vec2(-.5,-1.5)*t).r)\n           +step(s.z-bias,texture2D(uShadowMap,s.xy+vec2(1.5,-.5)*t).r)\n           +step(s.z-bias,texture2D(uShadowMap,s.xy+vec2(.5,1.5)*t).r)\n           +step(s.z-bias,texture2D(uShadowMap,s.xy+vec2(-1.5,.5)*t).r);\n  float edge=smoothstep(.0,.04,min(min(s.x,1.0-s.x),min(s.y,1.0-s.y)));\n  return mix(1.0,sum*.25,edge);\n}\nfloat mvContactAO(){\n  float ao=1.0;\n  for(int i=0;i<14;i++){\n    vec4 t=uTankAO[i];\n    if(t.z<.001) continue;\n    float dd=max(length(vPos.xz-t.xy)-t.z,0.0);\n    ao*=1.0-.34*exp(-dd*1.45);\n  }\n  return ao;\n}\nvec3 mvSky(vec3 dir){\n  dir=normalize(vec3(dir.x,max(dir.y,.03),dir.z));\n  float az=atan(dir.z,dir.x);\n  float el=asin(clamp(dir.y,-1.0,1.0));\n  vec3 sky=mix(vec3(.78,.86,.93),vec3(.24,.48,.82),pow(clamp(dir.y,0.0,1.0),.55));\n  sky+=vec3(.25,.22,.16)*pow(max(dot(dir,normalize(vec3(-.42,.95,.56))),0.0),12.0);\n  return sky*mix(vec3(1.0),vec3(.45,.52,.66),uEvening);\n}\nvec3 mvGrade(vec3 c){\n  c=max(c,vec3(0.0));\n  float l=dot(c,vec3(.2126,.7152,.0722));\n  vec3 g=mix(vec3(l),c,1.07);\n  g=(g-.5)*1.055+.5+.006;\n  g*=vec3(1.012,1.0,.985);\n  return mix(c,clamp(g,0.0,1.0),uProGrade);\n}\nfloat hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}\nfloat noise2(vec2 p){\n  vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);\n  return mix(mix(hash2(i),hash2(i+vec2(1.,0.)),f.x),\n    mix(hash2(i+vec2(0.,1.)),hash2(i+vec2(1.,1.)),f.x),f.y);\n}\nfloat waterNoise(vec2 p){\n  float a=0.0;\n  a+=0.54*noise2(p);\n  a+=0.29*noise2(p*2.04+vec2(11.1,-7.2));\n  a+=0.17*noise2(p*4.15+vec2(-3.2,8.4));\n  return a;\n}\nvec3 mvUnifiedGrass(vec2 uv, vec3 N, vec3 L, vec3 V, float d, float d2){\n  if (uTerrainDetail < .5) {\n    float broad=noise2(uv*.065);\n    float medium=noise2(uv*.42+vec2(-14.2,9.3));\n    float fine=noise2(uv*2.4+vec2(4.3,17.9));\n    float layout=clamp(broad*.56+medium*.33+fine*.11,0.,1.);\n    vec3 dark=vec3(.075,.18,.08);\n    vec3 base=vec3(.135,.31,.12);\n    vec3 mid=vec3(.205,.42,.17);\n    vec3 soft=vec3(.295,.54,.23);\n    vec3 shade=mix(dark,base,smoothstep(.08,.52,layout));\n    shade=mix(shade,mid,smoothstep(.42,.78,layout));\n    shade=mix(shade,soft,smoothstep(.78,.97,layout)*.55);\n    float brush=abs(sin(uv.x*7.+uv.y*3.+medium*2.4));\n    shade+=vec3(.03,.045,.018)*smoothstep(.76,.96,brush)*.18;\n    shade-=vec3(.018,.014,.008)*fine*.035;\n    float sun=.84+.16*d+.06*d2;\n    return shade*sun;\n  }\n  vec2 drift=vec2(\n    noise2(uv*.045+vec2(8.7,-4.3))-.5,\n    noise2(uv*.045+vec2(-6.2,11.5))-.5\n  );\n  uv += drift*2.4;\n  float broad=noise2(uv*.065);\n  float broad2=noise2(uv*.14+vec2(22.4,-7.6));\n  float medium=noise2(uv*.42+vec2(-14.2,9.3));\n  float fine=noise2(uv*2.4+vec2(4.3,17.9));\n  float grain=noise2(uv*8.8+vec2(-8.6,5.4));\n  float brushA=pow(abs(sin(uv.x*7.0+uv.y*3.0+medium*2.4)),8.0)*.35;\n  float brushB=pow(abs(sin(uv.x*3.6-uv.y*6.4+fine*1.8)),10.0)*.18;\n  float brush=clamp(brushA+brushB,0.,1.);\n  float layout=clamp(broad*.46+broad2*.28+medium*.18+fine*.08,0.,1.);\n  vec3 dark=vec3(.075,.18,.08);\n  vec3 base=vec3(.135,.31,.12);\n  vec3 mid=vec3(.205,.42,.17);\n  vec3 soft=vec3(.295,.54,.23);\n  vec3 shade=mix(dark,base,smoothstep(.08,.52,layout));\n  shade=mix(shade,mid,smoothstep(.42,.78,layout));\n  shade=mix(shade,soft,smoothstep(.78,.97,layout)*.55);\n  shade += vec3(.030,.045,.018)*brush;\n  float speck=pow(grain,2.6)*.06;\n  shade -= vec3(.018,.014,.008)*speck;\n  float wear=smoothstep(.70,.95,noise2(uv*.18+vec2(30.0,-18.0)))*.10;\n  shade=mix(shade,shade*vec3(.96,.94,.88)+vec3(.01,.01,.005),wear);\n  float sheen=pow(max(dot(normalize(reflect(-L,N)),V),0.0),6.0)*.05;\n  float sun=.84+.16*d+.06*d2;\n  return shade*sun + vec3(.03,.045,.02)*sheen;\n}\n\nvoid main(){\nvec3 N=normalize(vNormal);vec3 L=normalize(vec3(-.42,.95,.56));vec3 L2=normalize(vec3(.7,.8,-.4));\nfloat d=max(dot(N,L),0.0), d2=max(dot(N,L2),0.0);\nfloat mvSh=mix(1.0,mvShadow(N,L),1.0-.55*uEvening); d*=mvSh; d2*=mix(1.0,mvSh,.30);\nvec3 V=normalize(uCamera-vPos), H=normalize(L+V);\nfloat spec=pow(max(dot(N,H),0.0),29.0)*mvSh;\nfloat fres=pow(1.0-max(dot(N,V),0.0),2.0);\nfloat shine=vData.x, kind=vData.z;\nif(((kind>4.5&&kind<6.5)||(kind>8.5&&kind<10.5)) && vTankFill<.018) discard;\nvec3 c=vColor*(0.36+0.55*d+0.22*d2)+vec3(.65,.86,1.0)*spec*.35;\nfloat outAlpha=vData.w;\nif(kind>.5&&kind<1.5){\n\n  float travel=vData.y-uTime*2.05*uAnimate;\n  float circumference=atan(N.z,N.y+.001);\n  float broad=waterNoise(vec2(travel*.45,circumference*.72+sin(travel*.28)));\n  float eddy=waterNoise(vec2(travel*1.32+broad*1.4,circumference*1.53-uTime*.20*uAnimate));\n  float micro=waterNoise(vec2(travel*3.9+eddy*2.0,circumference*2.6+broad));\n  float pigment=clamp(.16+.70*eddy+.24*micro,0.,1.);\n  vec3 deep=vec3(.008,.105,.35);\n  vec3 blue=vec3(.014,.36,.76);\n  vec3 highlight=vec3(.24,.72,.97);\n  c=mix(deep,blue,pigment);\n  c+=highlight*pow(smoothstep(.56,.93,micro+eddy*.13),2.2)*.30;\n  c+=vec3(.23,.61,.93)*pow(smoothstep(.59,.83,broad),3.0)*.18;\n  c+=vec3(.57,.83,1.)*(pow(max(dot(N,H),0.),33.)*.30+fres*.20);\n} else if(kind>8.5&&kind<9.5){\n\n  vec2 impact=vColor.xy;\n  float rr=length(vPos.xz-impact);\n  float t=uTime*uAnimate;\n  float crest=sin(rr*18.-t*4.4);\n  float crest2=sin(rr*31.-t*6.2+1.3);\n  float energy=exp(-rr*2.5)*smoothstep(.025,.22,vTankFill);\n  float churn=waterNoise(vPos.xz*3.0+vec2(t*.37,-t*.31));\n  c=mix(vec3(.012,.22,.57),vec3(.045,.45,.83),.35+.47*churn);\n  c+=vec3(.12,.35,.50)*max(0.,crest)*energy;\n  c+=vec3(.52,.84,.96)*pow(max(0.,crest2),6.)*energy*.30;\n  float foam=exp(-rr*rr*13.)*(.3+.7*waterNoise(vPos.xz*14.+vec2(t*.9,-t*.8)));\n  c=mix(c,vec3(.77,.93,1.),clamp(foam*.49,0.,.50));\n  c+=vec3(.25,.47,.65)*(spec*.42+fres*.18);\n} else if(kind>9.5&&kind<10.5){\n\n  float rr=length(vPos.xz-vColor.xy);\n  float fade=smoothstep(.02,.13,rr)*(1.0-smoothstep(.60,.80,rr));\n  float flicker=.76+.24*sin(uTime*3.1*uAnimate+rr*29.0);\n  c=vec3(.39,.78,.96)*(.68+.24*d+spec*.34)*flicker;\n  outAlpha*=fade*smoothstep(.02,.18,vTankFill);\n} else if((kind>1.5&&kind<2.5)||(kind>4.5&&kind<6.5)){\n  vec2 uv=vPos.xz;\n  float t=uTime*uAnimate;\n  float wave=waterNoise(uv*1.5+vec2(t*.41,-t*.29));\n  float caust=waterNoise(vec2(vPos.y*2.9-t*.85,vPos.x+vPos.z*.64));\n  c=mix(vec3(.005,.095,.34),vec3(.018,.35,.74),clamp(.10+.72*wave+.30*caust,0.,1.));\n  c+=vec3(.30,.68,.92)*pow(max(0.,caust-.51)*2.,2.)*.22;\n  c+=vec3(.12,.29,.48)*fres*.24;\n  if(kind>5.5){\n    c+=vec3(.23,.60,.87)*(.12+wave*.23);\n    c+=vec3(.61,.87,1.)*pow(max(dot(N,L),0.),3.)*.12;\n  }\n} else if(kind>2.5&&kind<3.5){\n  float pulse=.88+.12*sin(uTime*1.7*uAnimate+vPos.x*.55+vPos.z*.35);\n  c=vColor*(1.22+.58*pulse)+vec3(.08,.23,.10)*pulse;\n} else if(kind>3.5&&kind<4.5){\n\n  c=vec3(.12,.45,.56)*(.53+.18*d)+vec3(.55,.88,.98)*(fres*.92+spec*.45);\n  c+=vec3(.08,.36,.44)*.15;\n} else if(kind>6.5&&kind<7.5){\n  vec2 turfUV=vPos.xz*.073;\n  vec3 lawn=texture2D(uTurfTex,turfUV).rgb;\n  c=lawn*(.80+.18*d+.08*d2);\n} else if(kind>7.5&&kind<8.5){\n\n  float rim=pow(1.0-max(dot(N,V),0.0),2.3);\n  c=vColor*(.77+.19*d+.08*d2)+vec3(.15,.15,.16)*rim+.12*spec*vec3(1.0);\n} else if(kind>11.5&&kind<12.5){\n  float t=uTime*uAnimate;\n  vec2 uv=vPos.xz;\n  \n  vec2 w1=vec2(t*.09,-t*.07),w2=vec2(-t*.21,t*.16);const float e=.30;\n  float h0=waterNoise(uv*.55+w1)+.5*waterNoise(uv*1.7+w2)+.25*waterNoise(uv*4.3-w1*2.0);\n  float hx=waterNoise((uv+vec2(e,0.))*.55+w1)+.5*waterNoise((uv+vec2(e,0.))*1.7+w2)+.25*waterNoise((uv+vec2(e,0.))*4.3-w1*2.0);\n  float hz=waterNoise((uv+vec2(0.,e))*.55+w1)+.5*waterNoise((uv+vec2(0.,e))*1.7+w2)+.25*waterNoise((uv+vec2(0.,e))*4.3-w1*2.0);\n  vec3 Nw=normalize(vec3(-(hx-h0)*2.2,1.0,-(hz-h0)*2.2)+(N-vec3(0.,1.,0.)));\n  float fr=.03+.97*pow(1.0-max(dot(Nw,V),0.0),5.0);\n  float shoreF=1.0-clamp(vData.x,0.0,1.0);\n  c=mix(vec3(.012,.085,.125),vec3(.055,.27,.30),clamp(.22*h0+.55*shoreF,0.,1.));\n  c=mix(c,mvSky(reflect(-V,Nw))*.95,clamp(fr*.9,0.,.78));\n  vec3 Hw=normalize(L+V);\n  c+=vec3(1.0,.96,.86)*(pow(max(dot(Nw,Hw),0.0),220.0)*2.4+pow(max(dot(Nw,Hw),0.0),36.0)*.18)*mvSh*(1.0-.75*uEvening);\n  float foam=smoothstep(.80,1.0,shoreF)*(.55+.45*sin(t*1.4+uv.x*.9+uv.y*.7));\n  c=mix(c,vec3(.86,.93,.93),foam*.38);\n} else if(kind>10.5&&kind<11.5){\n  vec2 pos=vPos.xz;\n  float radius=length(pos);\n  float woodland=smoothstep(68.0,104.0,radius);\n  vec3 closeGrass=texture2D(uTurfTex,pos*.073).rgb;\n  vec3 grassWide=texture2D(uTurfTex,pos*.024+vec2(.21,.57)).rgb;\n  vec3 grass= mix(closeGrass,grassWide,smoothstep(27.0,100.0,radius)*.45);\n  vec3 canopy=texture2D(uForestTex,pos*.018).rgb;\n  vec3 canopyLarge=texture2D(uForestTex,pos*.0065+vec2(.26,.14)).rgb;\n  float macro=noise2(pos*.018+vec2(17.1,8.2));\n  float medium=noise2(pos*.072+vec2(-6.8,4.3));\n  float slope=1.0-clamp(N.y,0.0,1.0);\n  vec3 hillside=mix(canopy,canopyLarge,.19);\n  hillside*=.87+.22*macro+.10*medium;\n  float sparse=smoothstep(.58,.93,macro+medium*.12)*.19;\n  hillside=mix(hillside,vec3(.23,.30,.16),sparse);\n  vec3 rock=vec3(.33,.36,.30)*(.80+.23*medium);\n  float rockCover=smoothstep(.43,.82,slope+.15*medium)*.27;\n  hillside=mix(hillside,rock,rockCover);\n  c=mix(grass,hillside,woodland);\n  float sillaZone=smoothstep(47.,78.,-vPos.x)*(1.0-smoothstep(65.,105.,abs(vPos.z-24.)));\n  float rocky=sillaZone*smoothstep(5.,18.,vPos.y)*(.42+.58*smoothstep(.08,.48,1.0-N.y));\n  c=mix(c,vColor,clamp(rocky*.94,0.,.94));\n  c*=.65+.34*d+.07*d2;\n  float grassGlint=pow(max(dot(normalize(reflect(-L,N)),V),0.0),8.0)*.018;\n  c+=vec3(.018,.028,.012)*grassGlint;\n  float banks=clamp(vData.x,0.,1.);\n  c=mix(c,vColor*(.74+.30*d+.07*d2),banks);\n} else if(kind>11.5&&kind<12.5){\n  float cycle=mod(uTime+vData.y*3.35,8.4);\n  float lit=1.0-smoothstep(4.0,4.38,cycle)+smoothstep(8.05,8.4,cycle);\n  float glass=0.975+0.025*sin(uTime*3.2+vPos.x*7.8);\n  c=mix(vec3(.027,.054,.071),vec3(1.0,.78,.38)*glass,lit);\n  c+=vec3(.23,.16,.035)*lit;\n} else if(kind>12.5&&kind<13.5){\n  float cycle=mod(uTime+vData.y*3.35,8.4);\n  float lit=1.0-smoothstep(4.0,4.38,cycle)+smoothstep(8.05,8.4,cycle);\n  c=vec3(1.0,.65,.20);\n  outAlpha*=lit;\n}\nif((kind>3.5&&kind<4.5)||(kind>7.5&&kind<8.5)) c+=vec3(.08,.12,.14)*fres*(.60+.40*d);\nif(kind>15.5&&kind<16.5){\n  float on=casetaLamp(vData.y);\n  float hot=smoothstep(.55,.83,vData.x);\n  vec3 dark=vColor*.29;\n  vec3 lit=mix(vColor*(.88+.10*d)+vec3(.24,.14,.055),vec3(1.0,.86,.52),hot);\n  c=mix(dark,lit,on);\n  outAlpha*=mix(.06,1.0,on);\n}\nif(kind>16.5&&kind<17.5){\n  float on=casetaLamp(vData.y);\n  c=mix(vec3(.33,.22,.10),vec3(1.0,.79,.45),clamp(vData.x,0.0,1.0));\n  outAlpha*=on;\n}\nif(kind>17.5&&kind<18.5){\n  float on=casetaLamp(vData.y);\n  c+=vec3(.46,.31,.13)*on*clamp(vData.x,0.0,1.0);\n}\nif(kind>18.5&&kind<19.5){\n  float operating=1.0-smoothstep(.16,.34,vColor.r);\n  c=mix(vec3(.30,.36,.39)*(.76+.24*d),vec3(.035,.75,.15)*(.75+.25*d),operating);\n  c+=vec3(.025,.28,.04)*operating;\n}\n{\n  vec3 R=reflect(-V,N);\n  bool glow=(kind>.5&&kind<1.5)||(kind>2.5&&kind<3.5)||(kind>8.5&&kind<10.5)||(kind>11.5&&kind<14.5)||(kind>15.5&&kind<18.5)||(kind>4.5&&kind<6.5);\n  if(!glow) c*=1.0-(1.0-mvSh)*.36;\n  if(kind>3.5&&kind<4.5){ c=mix(c,mvSky(R)*.92,clamp(.04+fres*.30,0.0,.26)); c+=vec3(1.0,.97,.90)*pow(max(dot(N,H),0.0),220.0)*1.0*mvSh; }\n  else if((kind>1.5&&kind<2.5)||(kind>4.5&&kind<6.5)){ c=mix(c,mvSky(R)*.80,clamp(fres*.30,0.0,.24)); c+=vec3(1.0,.97,.90)*pow(max(dot(N,H),0.0),160.0)*.6*mvSh; }\n  else if(kind>7.5&&kind<8.5){ c+=mvSky(R)*fres*.10; }\n}\nc*=mix(vec3(1.0),vec3(.66,.72,.83),uEvening);\nif(kind>14.5&&kind<15.5){\n  c=vec3(.028,.047,.033);\n}\nif(kind>13.5&&kind<14.5){\n  c=vec3(.98,.77,.46);\n  outAlpha=min(1.0,outAlpha*(1.0+2.6*uEvening));\n}\nif(kind>19.5&&kind<20.5){ c=mix(vec3(.78,.78,.72)*(.7+.3*d),vec3(1.0,.88,.62)*1.35,uEvening); }\nif(kind>20.5&&kind<21.5){ c=vec3(1.0,.80,.50); outAlpha*=uEvening; }\nc+=vColor*shine*.28*(1.0+uEvening*.82);\nfloat dist=length(vPos-uCamera);\nc=mix(c,mix(vec3(.37,.46,.48),vec3(.21,.27,.32),uEvening),clamp((dist-105.0)/155.0,0.,.10));\ngl_FragColor=vec4(mvGrade(c),outAlpha);\n}`;
  const fallbackVert = `\nattribute vec3 aPos; attribute vec3 aNormal; attribute vec3 aColor; attribute vec4 aData;\nuniform mat4 uVP; uniform float uTime; uniform float uAnimate; uniform float uLevels[36];\nvarying vec3 vNormal; varying vec3 vColor; varying vec3 vPos; varying vec4 vData;\nfloat getLevel(float id){\n  if(id < 0.5) return uLevels[0];\n  if(id < 1.5) return uLevels[1];\n  if(id < 2.5) return uLevels[2];\n  if(id < 3.5) return uLevels[3];\n  if(id < 4.5) return uLevels[4];\n  if(id < 5.5) return uLevels[5];\n  if(id < 6.5) return uLevels[6];\n  if(id < 7.5) return uLevels[7];\n  if(id < 8.5) return uLevels[8];\n  if(id < 9.5) return uLevels[9];\n  if(id < 10.5) return uLevels[10];\n  if(id < 11.5) return uLevels[11];\n  if(id < 12.5) return uLevels[12];\n  if(id < 13.5) return uLevels[13];\n  if(id < 14.5) return uLevels[14];\n  if(id < 15.5) return uLevels[15];\n  if(id < 16.5) return uLevels[16];\n  if(id < 17.5) return uLevels[17];\n  if(id < 18.5) return uLevels[18];\n  if(id < 19.5) return uLevels[19];\n  if(id < 20.5) return uLevels[20];\n  if(id < 21.5) return uLevels[21];\n  if(id < 22.5) return uLevels[22];\n  if(id < 23.5) return uLevels[23];\n  if(id < 24.5) return uLevels[24];\n  if(id < 25.5) return uLevels[25];\n  if(id < 26.5) return uLevels[26];\n  if(id < 27.5) return uLevels[27];\n  if(id < 28.5) return uLevels[28];\n  if(id < 29.5) return uLevels[29];\n  if(id < 30.5) return uLevels[30];\n  if(id < 31.5) return uLevels[31];\n  if(id < 32.5) return uLevels[32];\n  if(id < 33.5) return uLevels[33];\n  if(id < 34.5) return uLevels[34];\n  return uLevels[35];\n}\nvoid main(){\n  vec3 p=aPos;\n  if(aData.z>4.5 && aData.z<6.5){\n\n    float level=clamp(getLevel(aData.y),.0,.94);\n    p.y=.52+(p.y-.52)*level;\n    if(aData.z>5.5){\n      p.y+=(.025*sin(aPos.x*3.0+uTime*.87)+.019*sin(aPos.z*3.9-uTime*.72))*level;\n    }\n  }\n  vec3 surfaceNormal=aNormal;\n  if(aData.z>11.5&&aData.z<12.5){\n    float t=uTime*uAnimate;\n    float edge=clamp(aData.x,0.0,1.0);\n    float p1=dot(aPos.xz,vec2(.46,.27))+t*.75;\n    float p2=dot(aPos.xz,vec2(-.21,.64))-t*1.02;\n    float p3=dot(aPos.xz,vec2(.93,-.73))+t*1.37;\n    p.y+=edge*uAnimate*(.034*sin(p1)+.020*sin(p2)+.008*sin(p3));\n    vec2 slope=edge*uAnimate*(vec2(.46,.27)*(.034*cos(p1))+vec2(-.21,.64)*(.020*cos(p2))+vec2(.93,-.73)*(.008*cos(p3)));\n    surfaceNormal=normalize(vec3(-slope.x,1.0,-slope.y));\n  }\n  vPos=p;vNormal=surfaceNormal;vColor=aColor;vData=aData;\n  if(aData.z>18.5&&aData.z<19.5){\n    float active=getLevel(aData.y);\n    float enabled=smoothstep(.70,.95,active);\n    vColor=mix(vec3(.43,.49,.53),vec3(.075,.48,.255),enabled);\n    vData.x+=enabled*.22;\n  }\n  gl_Position=uVP*vec4(p,1.0);\n}`;
  const fallbackFrag = `\nprecision highp float;\nvarying vec3 vNormal; varying vec3 vColor; varying vec3 vPos; varying vec4 vData;\nuniform vec3 uCamera; uniform float uTime; uniform float uAnimate; uniform float uTerrainDetail; uniform float uEvening;\nuniform float uCasetaLights[5];\nfloat casetaLamp(float id){\n  if(id<.5)return uCasetaLights[0];\n  if(id<1.5)return uCasetaLights[1];\n  if(id<2.5)return uCasetaLights[2];\n  if(id<3.5)return uCasetaLights[3];\n  return uCasetaLights[4];\n}\nfloat hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}\nfloat noise2(vec2 p){\n  vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);\n  return mix(mix(hash2(i),hash2(i+vec2(1.,0.)),f.x),\n    mix(hash2(i+vec2(0.,1.)),hash2(i+vec2(1.,1.)),f.x),f.y);\n}\nfloat waterNoise(vec2 p){\n  float a=0.0;\n  a+=0.54*noise2(p);\n  a+=0.29*noise2(p*2.04+vec2(11.1,-7.2));\n  a+=0.17*noise2(p*4.15+vec2(-3.2,8.4));\n  return a;\n}\nvec3 mvUnifiedGrass(vec2 uv, vec3 N, vec3 L, vec3 V, float d, float d2){\n  if (uTerrainDetail < .5) {\n    float broad=noise2(uv*.065);\n    float medium=noise2(uv*.42+vec2(-14.2,9.3));\n    float fine=noise2(uv*2.4+vec2(4.3,17.9));\n    float layout=clamp(broad*.56+medium*.33+fine*.11,0.,1.);\n    vec3 dark=vec3(.075,.18,.08);\n    vec3 base=vec3(.135,.31,.12);\n    vec3 mid=vec3(.205,.42,.17);\n    vec3 soft=vec3(.295,.54,.23);\n    vec3 shade=mix(dark,base,smoothstep(.08,.52,layout));\n    shade=mix(shade,mid,smoothstep(.42,.78,layout));\n    shade=mix(shade,soft,smoothstep(.78,.97,layout)*.55);\n    float brush=abs(sin(uv.x*7.+uv.y*3.+medium*2.4));\n    shade+=vec3(.03,.045,.018)*smoothstep(.76,.96,brush)*.18;\n    shade-=vec3(.018,.014,.008)*fine*.035;\n    float sun=.84+.16*d+.06*d2;\n    return shade*sun;\n  }\n  vec2 drift=vec2(\n    noise2(uv*.045+vec2(8.7,-4.3))-.5,\n    noise2(uv*.045+vec2(-6.2,11.5))-.5\n  );\n  uv += drift*2.4;\n  float broad=noise2(uv*.065);\n  float broad2=noise2(uv*.14+vec2(22.4,-7.6));\n  float medium=noise2(uv*.42+vec2(-14.2,9.3));\n  float fine=noise2(uv*2.4+vec2(4.3,17.9));\n  float grain=noise2(uv*8.8+vec2(-8.6,5.4));\n  float brushA=pow(abs(sin(uv.x*7.0+uv.y*3.0+medium*2.4)),8.0)*.35;\n  float brushB=pow(abs(sin(uv.x*3.6-uv.y*6.4+fine*1.8)),10.0)*.18;\n  float brush=clamp(brushA+brushB,0.,1.);\n  float layout=clamp(broad*.46+broad2*.28+medium*.18+fine*.08,0.,1.);\n  vec3 dark=vec3(.075,.18,.08);\n  vec3 base=vec3(.135,.31,.12);\n  vec3 mid=vec3(.205,.42,.17);\n  vec3 soft=vec3(.295,.54,.23);\n  vec3 shade=mix(dark,base,smoothstep(.08,.52,layout));\n  shade=mix(shade,mid,smoothstep(.42,.78,layout));\n  shade=mix(shade,soft,smoothstep(.78,.97,layout)*.55);\n  shade += vec3(.030,.045,.018)*brush;\n  float speck=pow(grain,2.6)*.06;\n  shade -= vec3(.018,.014,.008)*speck;\n  float wear=smoothstep(.70,.95,noise2(uv*.18+vec2(30.0,-18.0)))*.10;\n  shade=mix(shade,shade*vec3(.96,.94,.88)+vec3(.01,.01,.005),wear);\n  float sheen=pow(max(dot(normalize(reflect(-L,N)),V),0.0),6.0)*.05;\n  float sun=.84+.16*d+.06*d2;\n  return shade*sun + vec3(.03,.045,.02)*sheen;\n}\n\nvoid main(){\nvec3 N=normalize(vNormal);vec3 L=normalize(vec3(-.42,.95,.56));vec3 L2=normalize(vec3(.7,.8,-.4));\nfloat d=max(dot(N,L),0.0), d2=max(dot(N,L2),0.0);\nvec3 V=normalize(uCamera-vPos), H=normalize(L+V);\nfloat spec=pow(max(dot(N,H),0.0),29.0);\nfloat fres=pow(1.0-max(dot(N,V),0.0),2.0);\nfloat shine=vData.x, kind=vData.z;\nfloat outAlpha=vData.w;\nvec3 c=vColor*(0.36+0.55*d+0.22*d2)+vec3(.65,.86,1.0)*spec*.35;\nif(kind>.5&&kind<1.5){\n\n  float s=vData.y;\n  float circumference=atan(N.z,N.y+.0001);\n  float travel=s-uTime*2.25*uAnimate;\n  float drift=waterNoise(vec2(travel*.58,circumference*.75+sin(travel*.21)));\n  float eddy=waterNoise(vec2(travel*1.30+drift*2.2,circumference*1.3-uTime*.26*uAnimate));\n  float fine=waterNoise(vec2(travel*3.55+eddy*1.6,circumference*2.0+drift*.8));\n  float luma=clamp(.18+eddy*.83+fine*.25,0.,1.);\n  vec3 deep=vec3(.012,.16,.41), aqua=vec3(.018,.43,.79), glassy=vec3(.45,.79,1.0);\n  c=mix(deep,aqua,luma);\n  c+=glassy*pow(smoothstep(.52,.91,fine+eddy*.17),2.4)*.44;\n  c+=vec3(.34,.83,.98)*pow(smoothstep(.56,.83,drift),3.)*.21;\n  float sheen=pow(max(dot(N,H),0.0),21.0);\n  c+=vec3(.68,.94,1.)*(sheen*.27+fres*.22);\n} else if((kind>1.5&&kind<2.5)||(kind>4.5&&kind<6.5)){\n\n  vec2 p=vPos.xz;\n  float wave=waterNoise(p*1.6+vec2(uTime*.65,-uTime*.42)*uAnimate);\n  float caust=waterNoise(vec2(vPos.y*3.0-uTime*1.4*uAnimate,vPos.x+vPos.z*.7));\n  c=mix(vec3(.008,.14,.38),vec3(.023,.46,.81),clamp(.22+.9*wave+.35*caust,0.,1.));\n  c+=vec3(.45,.95,1.)*pow(max(0.,caust-.48)*2.0,2.)*.35;\n  c+=vec3(.33,.74,.94)*fres*.18;\n  if(kind>5.5){c+=vec3(.21,.57,.89)*(.28+wave*.23);c+=vec3(.64,.98,1.0)*pow(max(dot(N,L),0.0),3.0)*.20;}\n} else if(kind>2.5&&kind<3.5){\n  float pulse=.88+.12*sin(uTime*1.7*uAnimate+vPos.x*.55+vPos.z*.35);\n  c=vColor*(1.22+.58*pulse)+vec3(.08,.23,.10)*pulse;\n} else if(kind>3.5&&kind<4.5){\n\n  c=vec3(.12,.45,.56)*(.53+.18*d)+vec3(.55,.88,.98)*(fres*.92+spec*.45);\n  c+=vec3(.08,.36,.44)*.15;\n} else if(kind>6.5&&kind<7.5){\n  c=mvUnifiedGrass(vPos.xz,N,L,V,d,d2);\n} else if(kind>7.5&&kind<8.5){\n\n  float rim=pow(1.0-max(dot(N,V),0.0),2.3);\n  c=vColor*(.77+.19*d+.08*d2)+vec3(.15,.15,.16)*rim+.12*spec*vec3(1.0);\n} else if(kind>11.5&&kind<12.5){\n  float t=uTime*uAnimate;\n  vec2 uv=vPos.xz;\n  float swell=waterNoise(uv*.18+vec2(t*.043,-t*.034));\n  float ripples=waterNoise(uv*.79+vec2(-t*.17,t*.12));\n  float fine=sin(uv.x*1.12+uv.y*.37+t*1.25)*sin(uv.y*.93-uv.x*.28-t*.91);\n  float shadow=clamp(.17+.61*swell+.18*ripples+.09*fine,0.,1.);\n  c=mix(vec3(.028,.143,.191),vec3(.109,.335,.364),shadow);\n  float crests=pow(smoothstep(.69,.93,ripples+.12*fine),2.0);\n  float reflection=pow(max(dot(N,H),0.),28.0)*(.42+.58*swell);\n  float horizon=pow(1.0-max(dot(N,V),0.0),3.0);\n  c+=vec3(.20,.37,.39)*(crests*.115+reflection*.52+horizon*.13);\n} else if(kind>10.5&&kind<11.5){\n  vec2 pos=vPos.xz;\n  float wooded=smoothstep(68.0,104.0,length(pos));\n  vec3 meadow=mvUnifiedGrass(pos,N,L,V,d,d2);\n  float shade=noise2(pos*.063+vec2(3.8,6.4));\n  float leaves=noise2(pos*.21+vec2(11.2,-9.5));\n  vec3 canopy=mix(vec3(.11,.24,.095),vec3(.21,.39,.15),shade*.65+leaves*.35);\n  c=mix(meadow,canopy*(.68+.34*d+.08*d2),wooded);\n  float banks=clamp(vData.x,0.,1.);\n  c=mix(c,vColor*(.74+.30*d+.07*d2),banks);\n} else if(kind>11.5&&kind<12.5){\n  float cycle=mod(uTime+vData.y*3.35,8.4);\n  float lit=1.0-smoothstep(4.0,4.38,cycle)+smoothstep(8.05,8.4,cycle);\n  float glass=0.975+0.025*sin(uTime*3.2+vPos.x*7.8);\n  c=mix(vec3(.027,.054,.071),vec3(1.0,.78,.38)*glass,lit);\n  c+=vec3(.23,.16,.035)*lit;\n} else if(kind>12.5&&kind<13.5){\n  float cycle=mod(uTime+vData.y*3.35,8.4);\n  float lit=1.0-smoothstep(4.0,4.38,cycle)+smoothstep(8.05,8.4,cycle);\n  c=vec3(1.0,.65,.20);\n  outAlpha*=lit;\n}\nif((kind>3.5&&kind<4.5)||(kind>7.5&&kind<8.5)) c+=vec3(.08,.12,.14)*fres*(.60+.40*d);\nif(kind>15.5&&kind<16.5){\n  float on=casetaLamp(vData.y);\n  float hot=smoothstep(.55,.83,vData.x);\n  vec3 dark=vColor*.29;\n  vec3 lit=mix(vColor*(.88+.10*d)+vec3(.24,.14,.055),vec3(1.0,.86,.52),hot);\n  c=mix(dark,lit,on);\n  outAlpha*=mix(.06,1.0,on);\n}\nif(kind>16.5&&kind<17.5){\n  float on=casetaLamp(vData.y);\n  c=mix(vec3(.33,.22,.10),vec3(1.0,.79,.45),clamp(vData.x,0.0,1.0));\n  outAlpha*=on;\n}\nif(kind>17.5&&kind<18.5){\n  float on=casetaLamp(vData.y);\n  c+=vec3(.46,.31,.13)*on*clamp(vData.x,0.0,1.0);\n}\nif(kind>18.5&&kind<19.5){\n  float operating=1.0-smoothstep(.16,.34,vColor.r);\n  c=mix(vec3(.30,.36,.39)*(.76+.24*d),vec3(.035,.75,.15)*(.75+.25*d),operating);\n  c+=vec3(.025,.28,.04)*operating;\n}\nc*=mix(vec3(1.0),vec3(.66,.72,.83),uEvening);\nif(kind>14.5&&kind<15.5){\n  c=vec3(.028,.047,.033);\n}\nif(kind>13.5&&kind<14.5){\n  c=vec3(.98,.77,.46);\n  outAlpha=min(1.0,outAlpha*(1.0+2.6*uEvening));\n}\nc+=vColor*shine*.28*(1.0+uEvening*.82);\nfloat dist=length(vPos-uCamera);\nc=mix(c,mix(vec3(.37,.46,.48),vec3(.21,.27,.32),uEvening),clamp((dist-105.0)/155.0,0.,.10));\ngl_FragColor=vec4(c,outAlpha);\n}`;
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
      notice.textContent = 'Error del motor gráfico: ' + fallbackError.message;
      notice.hidden = false;
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
    evening: gl.getUniformLocation(program, 'uEvening'),
    casetaLights: gl.getUniformLocation(program, 'uCasetaLights[0]')
  };
  const mvLoc = {
    lightVP: gl.getUniformLocation(program, 'uLightVP'),
    shadowMap: gl.getUniformLocation(program, 'uShadowMap'),
    shadowOn: gl.getUniformLocation(program, 'uShadowOn'),
    shadowTexel: gl.getUniformLocation(program, 'uShadowTexel'),
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
      gl.attachShader(sp, shader(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec4 vData;varying float vTankFill;void main(){float k=vData.z;if(vData.w<.10||(k>8.5&&k<11.5)||(k>.5&&k<1.5)||(k>2.5&&k<3.5)||(k>11.5&&k<14.5)||(k>15.5&&k<18.5)||k>19.5)discard;if((k>4.5&&k<6.5)&&vTankFill<.018)discard;gl_FragColor=vec4(1.0);}'));
      for (const [name, index] of [ [ 'aPos', loc.pos ], [ 'aNormal', loc.normal ], [ 'aColor', loc.color ], [ 'aData', loc.data ] ]) if (index >= 0) gl.bindAttribLocation(sp, index, name);
      gl.linkProgram(sp);
      if (!gl.getProgramParameter(sp, gl.LINK_STATUS)) return null;
      const Ll = Math.hypot(-.42, .95, .56), Lx = -.42 / Ll, Ly = .95 / Ll, Lz = .56 / Ll;
      const center = [ -28, 0, 4 ], half = 78, dist = 240;
      const eye = [ center[0] + Lx * dist, center[1] + Ly * dist, center[2] + Lz * dist ];
      const n = 1, f = 520;
      const ortho = [ 1 / half, 0, 0, 0, 0, 1 / half, 0, 0, 0, 0, -2 / (f - n), 0, 0, 0, -(f + n) / (f - n), 1 ];
      return {
        fbo: fbo,
        depth: depth,
        size: size,
        ortho: ortho,
        eye: eye,
        center: center,
        lightVP: null,
        program: sp,
        vp: gl.getUniformLocation(sp, 'uVP'),
        time: gl.getUniformLocation(sp, 'uTime'),
        levels: gl.getUniformLocation(sp, 'uLevels[0]'),
        anim: gl.getUniformLocation(sp, 'uAnimate')
      };
    } catch (error) {
      console.warn('Linares 3D: sombras no disponibles:', error && error.message);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return null;
    }
  })();
  function mvRenderShadowMap() {
    if (!mvShadow) return;
    if (!mvShadow.lightVP) {
      const zA = norm(minus(mvShadow.eye, mvShadow.center)), xA = norm(cross([ 0, 1, 0 ], zA)), yA = cross(zA, xA), e = mvShadow.eye;
      const v = [ xA[0], yA[0], zA[0], 0, xA[1], yA[1], zA[1], 0, xA[2], yA[2], zA[2], 0, -(xA[0] * e[0] + xA[1] * e[1] + xA[2] * e[2]), -(yA[0] * e[0] + yA[1] * e[1] + yA[2] * e[2]), -(zA[0] * e[0] + zA[1] * e[1] + zA[2] * e[2]), 1 ];
      const o = mvShadow.ortho, m = new Float32Array(16);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) sum += o[k * 4 + r] * v[c * 4 + k];
        m[c * 4 + r] = sum;
      }
      mvShadow.lightVP = m;
    }
    let key = 0;
    for (let i = 0; i < levelsUniform.length; i++) key += levelsUniform[i] * (i + 1);
    if (Math.abs(key - mvShadowKey) > 5e-4) {
      mvShadowKey = key;
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
    if (mvShadow.time) gl.uniform1f(mvShadow.time, 0);
    if (mvShadow.levels) gl.uniform1fv(mvShadow.levels, levelsUniform);
    if (mvShadow.anim) gl.uniform1f(mvShadow.anim, 0);
    drawGroup(0);
    drawGroup(1);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.colorMask(true, true, true, true);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
  }
  function mvBindProUniforms() {
    if (!enhancedWaterShader) return;
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, mvShadow ? mvShadow.depth : null);
    gl.activeTexture(gl.TEXTURE0);
    if (mvLoc.shadowOn) gl.uniform1f(mvLoc.shadowOn, mvShadow && mvShadow.lightVP ? 1 : 0);
    if (mvShadow && mvShadow.lightVP) {
      gl.uniformMatrix4fv(mvLoc.lightVP, false, mvShadow.lightVP);
      gl.uniform2f(mvLoc.shadowTexel, 1 / mvShadow.size, 1 / mvShadow.size);
    }
  }
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
  gl.activeTexture(gl.TEXTURE0);
  const skyVertex = `\nattribute vec2 aSkyPosition;\nvarying vec2 vSkyNdc;\nvoid main(){vSkyNdc=aSkyPosition;gl_Position=vec4(aSkyPosition,1.0,1.0);}`;
  const skyFragment = `\n#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\nvarying vec2 vSkyNdc;\nuniform sampler2D uSkyMap;\nuniform vec3 uSkyForward;\nuniform vec3 uSkyRight;\nuniform vec3 uSkyUp;\nuniform float uSkyAspect;\nuniform float uSkyFovScale;\nuniform float uSkySeconds;\nuniform float uSkyReady;\nuniform float uEvening;\nuniform float uSkyProcedural;\nfloat mvH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat mvN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mvH(i),mvH(i+vec2(1,0)),f.x),mix(mvH(i+vec2(0,1)),mvH(i+vec2(1,1)),f.x),f.y);}\nfloat mvFbm(vec2 p){float a=.5,s=0.0;for(int i=0;i<5;i++){s+=a*mvN(p);p=p*2.03+vec2(17.3,-9.1);a*=.5;}return s;}\nvec3 mvProceduralSky(vec3 d,float t,float ev){\n  vec3 sunDir=normalize(vec3(-.42,.95,.56));\n  vec3 sunEve=normalize(vec3(-.80,.10,.58));\n  vec3 S=normalize(mix(sunDir,sunEve,ev));\n  float y=max(d.y,0.0);\n  float mu=max(dot(d,S),0.0);\n  vec3 zen=mix(vec3(.16,.40,.80),vec3(.10,.14,.30),ev);\n  vec3 hor=mix(vec3(.72,.83,.93),vec3(.95,.58,.36),ev);\n  vec3 sky=mix(hor,zen,pow(y,.48));\n  sky=mix(sky,hor*1.05,exp(-y*14.0)*.55);\n  sky+=mix(vec3(1.0,.93,.80),vec3(1.0,.55,.25),ev)*(pow(mu,6.0)*.22+pow(mu,48.0)*.35);\n  sky+=vec3(1.0,.96,.88)*smoothstep(.9994,.9998,mu)*3.0;\n  vec2 uv=d.xz/(y+.085)*.55+vec2(t*.010,t*.004);\n  float base=mvFbm(uv*1.15);\n  float detail=mvFbm(uv*3.4+vec2(base*1.6,-t*.006));\n  float cov=smoothstep(.50,.80,base*.78+detail*.32);\n  float shade=mvFbm(uv*1.15+S.xz*.18)-base;\n  vec3 lit=mix(vec3(1.0,.99,.97),vec3(1.0,.72,.50),ev);\n  vec3 dark=mix(vec3(.58,.64,.74),vec3(.36,.30,.40),ev);\n  vec3 cloud=mix(lit,dark,clamp(.45+shade*2.4+(1.0-detail)*.35,0.0,1.0));\n  cloud+=lit*pow(mu,10.0)*.25;\n  float fade=smoothstep(.0,.16,d.y);\n  sky=mix(sky,cloud,cov*fade*.92);\n  sky=mix(sky,hor*vec3(.94,.96,.98),exp(-max(d.y,0.0)*22.0)*.45);\n  return sky;\n}\nvoid main(){\n  vec3 direction=normalize(uSkyForward+uSkyRight*(vSkyNdc.x*uSkyAspect*uSkyFovScale)+uSkyUp*(vSkyNdc.y*uSkyFovScale));\n  if(uSkyProcedural>.5){gl_FragColor=vec4(mvProceduralSky(direction,uSkySeconds,uEvening),1.0);return;}\n  float azimuth=atan(direction.z,direction.x);\n  float elevation=asin(clamp(direction.y,-1.0,1.0));\n  vec2 uv=vec2(fract(azimuth*.1591549431+uSkySeconds*.00120),clamp(.27+elevation*.68,.008,.992));\n  vec3 clearSky=mix(vec3(.76,.88,.95),vec3(.27,.56,.79),smoothstep(-.24,.82,direction.y));\n  vec3 photoSky=texture2D(uSkyMap,uv).rgb;\n  vec3 outputSky=mix(clearSky,photoSky,uSkyReady);\n  vec3 duskSky=mix(outputSky*vec3(.53,.62,.77),mix(vec3(.35,.40,.48),vec3(.18,.30,.46),smoothstep(-.15,.70,direction.y)),.26);\n  outputSky=mix(outputSky,duskSky,uEvening);\n  gl_FragColor=vec4(outputSky,1.0);\n}`;
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
      fovScale: gl.getUniformLocation(skyProgram, 'uSkyFovScale'),
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
        const skyHeight = skyWidth / 2;
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
      console.warn('Cielo 4K no encontrado en /Telemetria/imagenes/cielo_monterrey_4k.jpg');
    };
    skyImage.src = '/Telemetria/imagenes/cielo_monterrey_4k.jpg?v=90';
  } catch (skyError) {
    skyProgram = null;
    console.warn('Cielo dinámico no disponible:', skyError);
  }
  function renderSky(eye, target, seconds, aspect) {
    if (!skyProgram) return;
    const viewForward = norm(minus(target, eye));
    const horizontal = Math.hypot(viewForward[0], viewForward[2]);
    const forward = norm([ viewForward[0], Math.max(viewForward[1], -horizontal * Math.tan(Math.PI / 2 - 1.34)), viewForward[2] ]);
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
    gl.uniform1f(skyLoc.fovScale, Math.tan(Math.PI / 6.9));
    gl.uniform1f(skyLoc.seconds, seconds);
    gl.uniform1f(skyLoc.ready, skyReady ? 1 : 0);
    gl.uniform1f(skyLoc.evening, eveningBlend);
    gl.uniform1f(skyLoc.procedural, mvSkyPhoto ? 0 : 1);
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
  const vscale = (a, k) => [ a[0] * k, a[1] * k, a[2] * k ];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ];
  const norm = a => {
    const l = Math.hypot(...a) || 1;
    return vscale(a, 1 / l);
  };
  function vertex(v, n, c, e = 0, s = 0, k = 0, a = 1) {
    const col = Array.isArray(c) ? c : rgb(c);
    return [ ...v, ...n, ...col, e, s, k, a ];
  }
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
        const d = plus(vscale(u, Math.cos(theta)), vscale(v, Math.sin(theta)));
        ring.push({
          p: plus(point, vscale(d, r)),
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
      const entry = plus(cur, vscale(norm(u), len)), exit = plus(cur, vscale(norm(v), len));
      out.push(entry);
      for (let j = 1; j <= 6; j++) {
        const t = j / 6;
        out.push(plus(plus(vscale(entry, (1 - t) * (1 - t)), vscale(cur, 2 * (1 - t) * t)), vscale(exit, t * t)));
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
  
  const pipeWater = Tuberias3D.create(gl, [[loc.pos,3,0],[loc.normal,3,12],[loc.color,3,24],[loc.data,4,36]]);
  function tankDisplayScale(row) {
    const maximum = Number(row && row.maximum);
    const upper = maximum;
    return Number.isFinite(upper) && upper > 0 ? upper : 4;
  }
  function refreshPipeLevels(records) {
    pipeWater.update(name => {
      const node = config.nodes.find(n => n[1] === name);
      if (!node || !node[5]) return null;
      const tower = MV_TALL.find(t => t[0] === node[0]);
      if (node[2] !== 'tank' && !tower) return null;
      const row = records && records[node[5]];
      return row && Tuberias3D.reference(row.level, row.status, null, tower ? tower[4] : tankDisplayScale(row), row.updated);
    });
  }
  function pipe(path, r, meta, label) {
    const pts = roundPath(path,.85);
    const names = [...new Set([meta.source, meta.target].filter(Boolean))];
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
    const id = Math.max(0, tankSpecs.findIndex(s => s.name === name)), maxWaterHeight = H * .9;
    cylinder(x, .31, z, R * 1.13, .18, '#667c88', {
      seg: 36
    });
    cylinder(x, .43, z, R * .99, .07, '#2f5164', {
      seg: 36
    });
    cylinder(x, .52 + maxWaterHeight / 2, z, R * .94, maxWaterHeight, '#0869bc', {
      seg: 64,
      kind: 5,
      em: 1.08,
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
    const gaugeX = x + R * 1.38, gaugeZ = z + R * .37;
    bar([ gaugeX - .16, .51, gaugeZ ], [ gaugeX - .16, .52 + maxWaterHeight, gaugeZ ], .034, '#9db5bd', {
      seg: 7
    });
    bar([ gaugeX + .16, .51, gaugeZ ], [ gaugeX + .16, .52 + maxWaterHeight, gaugeZ ], .034, '#9db5bd', {
      seg: 7
    });
    bar([ gaugeX, .52 + maxWaterHeight, gaugeZ ], [ gaugeX, .52 + maxWaterHeight + .03, gaugeZ ], .17, '#d4e0e1', {
      seg: 9
    });
    cylinder(gaugeX, .52 + maxWaterHeight * .5, gaugeZ, .115, maxWaterHeight, '#128fd2', {
      seg: 16,
      kind: 5,
      levelId: id,
      em: .85,
      caps: false
    });
    for (let i = 0; i <= 5; i++) {
      const y = .52 + maxWaterHeight * i / 5;
      bar([ gaugeX - .17, y, gaugeZ + .12 ], [ gaugeX + .16, y, gaugeZ + .12 ], .018, '#d8e5e4', {
        seg: 6
      });
    }
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
  function mvScaleBuild(x, z, sx, sz, fn) {
    const st = A.map(g => g.length);
    fn();
    for (let g = 0; g < A.length; g++) {
      const arr = A[g];
      for (let i = st[g]; i < arr.length; i += 13) {
        arr[i] = x + (arr[i] - x) * sx;
        arr[i + 2] = z + (arr[i + 2] - z) * sz;
        const nx = arr[i + 3] / sx, ny = arr[i + 4], nz = arr[i + 5] / sz, nl = Math.hypot(nx, ny, nz) || 1;
        arr[i + 3] = nx / nl;
        arr[i + 4] = ny / nl;
        arr[i + 5] = nz / nl;
      }
    }
  }
  function mvFrustum(cx, cz, y0, y1, r0, r1, col, seg = 56, g = 0) {
    const sl = (r0 - r1) / Math.max(.001, y1 - y0);
    for (let i = 0; i < seg; i++) {
      const a = i / seg * Math.PI * 2, b = (i + 1) / seg * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      const na = norm([ ca, sl, sa ]), nb = norm([ cb, sl, sb ]);
      const p = [ cx + r0 * ca, y0, cz + r0 * sa ], q = [ cx + r0 * cb, y0, cz + r0 * sb ], P = [ cx + r1 * ca, y1, cz + r1 * sa ], Q = [ cx + r1 * cb, y1, cz + r1 * sb ];
      tri(g, p, na, q, nb, Q, nb, col, 0, y0, 0, 1);
      tri(g, p, na, Q, nb, P, na, col, 0, y0, 0, 1);
    }
  }
  function mvAnnulus(cx, cz, y, r0, r1, col, seg = 56) {
    const up = [ 0, 1, 0 ];
    for (let i = 0; i < seg; i++) {
      const a = i / seg * Math.PI * 2, b = (i + 1) / seg * Math.PI * 2;
      const p = [ cx + r0 * Math.cos(a), y, cz + r0 * Math.sin(a) ], q = [ cx + r0 * Math.cos(b), y, cz + r0 * Math.sin(b) ], P = [ cx + r1 * Math.cos(a), y, cz + r1 * Math.sin(a) ], Q = [ cx + r1 * Math.cos(b), y, cz + r1 * Math.sin(b) ];
      tri(0, p, up, Q, up, q, up, col, 0, y, 0, 1);
      tri(0, p, up, P, up, Q, up, col, 0, y, 0, 1);
    }
  }
  function mvSmallPresa(x, z, name) {
    const id = Math.max(0, tankSpecs.findIndex(s => s.name === name));
    const RX = 4.3, RZ = 3, H = 1.25, mw = H * .9, top = .52 + H + .12;
    mvScaleBuild(x, z, RX, RZ, () => {
      mvFrustum(x, z, -.08, top - .25, 1.34, 1.12, '#7f8d5f', 64);
      mvFrustum(x, z, top - .25, top, 1.12, 1.065, '#bdb8aa', 64);
      mvAnnulus(x, z, top, .99, 1.065, '#dcd8cc', 64);
      cylinder(x, (top + .5) / 2, z, .99, top - .5, '#8f9a94', {
        seg: 64,
        caps: false
      });
      cylinder(x, .5, z, .99, .04, '#24485c', {
        seg: 64
      });
      cylinder(x, .52 + mw / 2, z, .985, mw, '#0a5f9e', {
        seg: 64,
        kind: 5,
        em: 1,
        caps: false,
        levelId: id
      });
      cylinder(x, .52 + mw, z, .985, .04, '#3f93cf', {
        seg: 64,
        kind: 6,
        em: 1.12,
        levelId: id
      });
    });
    const gx = x - RX * .55, gz = z + RZ * .86;
    bar([ gx, .5, gz ], [ gx, .52 + mw + .25, gz ], .05, '#e8eef0', {
      seg: 6
    });
    for (let k = 0; k <= 5; k++) {
      const y = .52 + mw * k / 5;
      bar([ gx, y, gz ], [ gx + .32, y, gz + .02 ], k % 5 === 0 ? .03 : .02, k % 5 === 0 ? '#ff9c2a' : '#ffffff', {
        seg: 5,
        em: .4
      });
    }
    const vx = x + RX * .98, vz = z;
    box(vx, (top - .3) / 2 + .1, vz, .9, top - .3, 1.5, '#b4b0a3');
    box(vx + .15, top - .38, vz, .6, .08, 1.1, '#5d7b8a');
    box(x - RX * .2, top + .55, z - RZ * 1.02, 1.5, 1, 1.1, '#c9cec9');
    box(x - RX * .2, top + 1.1, z - RZ * 1.02, 1.7, .1, 1.3, '#62737b');
    box(x - RX * .2, top + .5, z - RZ * 1.02 + .56, .5, .7, .04, '#3e5a6a');
    for (let k = 0; k < 18; k++) {
      const a = k / 18 * Math.PI * 2, px = x + Math.cos(a) * RX * 1.035, pz = z + Math.sin(a) * RZ * 1.035;
      cylinder(px, top + .35, pz, .03, .7, '#a8b3b7', {
        seg: 5
      });
    }
    const rail = [];
    for (let k = 0; k <= 72; k++) {
      const a = k / 72 * Math.PI * 2;
      rail.push([ x + Math.cos(a) * RX * 1.035, top + .68, z + Math.sin(a) * RZ * 1.035 ]);
    }
    tube(rail, .025, '#c3ccd0', {
      seg: 5
    });
    return {
      x: x,
      y: top + .2,
      z: z,
      name: name,
      baseY: .52,
      height: H,
      radius: RZ * 1.12,
      levelId: id,
      screenY: top + .55,
      screenZ: z + RZ,
      screenW: 1.68,
      screenH: 1.1,
      wallRadius: RZ,
      surfaceGap: .07
    };
  }
  function orientedCylinder(a, b, r, col, opt = {}) {
    const d = minus(b, a), L = Math.hypot(...d);
    const t = norm(d);
    const ref = Math.abs(t[1]) > .93 ? [ 1, 0, 0 ] : [ 0, 1, 0 ], u = norm(cross(ref, t)), v = norm(cross(t, u)), S = opt.seg || 16;
    const g = opt.g || 0, em = opt.em || 0, alpha = opt.alpha === undefined ? 1 : opt.alpha, kind = opt.kind || 0, levelId = opt.levelId === undefined ? 0 : opt.levelId;
    for (let i = 0; i < S; i++) {
      const theta = i / S * Math.PI * 2, beta = (i + 1) / S * Math.PI * 2;
      let n = plus(vscale(u, Math.cos(theta)), vscale(v, Math.sin(theta))), N = plus(vscale(u, Math.cos(beta)), vscale(v, Math.sin(beta)));
      const p = plus(a, vscale(n, r)), q = plus(a, vscale(N, r)), P = plus(b, vscale(n, r)), Q = plus(b, vscale(N, r));
      tri(g, p, n, q, N, Q, N, col, em, levelId, kind, alpha);
      tri(g, p, n, Q, N, P, n, col, em, levelId, kind, alpha);
      if (opt.caps !== false) {
        tri(g, a, vscale(t, -1), q, vscale(t, -1), p, vscale(t, -1), col, em, levelId, kind, alpha);
        tri(g, b, t, P, t, Q, t, col, em, levelId, kind, alpha);
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
  const PLAY_HALF_W = 49.8, PLAY_HALF_D = 30.8;
  const siteRoadSegments = [];
  function siteRoad(segment) {
    const [x1, z1, x2, z2, width] = segment;
    const horizontal = Math.abs(x2 - x1) >= Math.abs(z2 - z1);
    const length = Math.hypot(x2 - x1, z2 - z1);
    const centerX = (x1 + x2) * .5;
    const centerZ = (z1 + z2) * .5;
    box(centerX, -.031, centerZ, horizontal ? length + width : width, .092, horizontal ? width : length + width, '#626d68');
    box(centerX, .018, centerZ, horizontal ? length + width : width - .14, .018, horizontal ? width - .14 : length + width, '#394b49');
    const edge = width * .5 - .035;
    for (const sign of [ -1, 1 ]) {
      box(centerX + (horizontal ? 0 : sign * edge), .037, centerZ + (horizontal ? sign * edge : 0), horizontal ? length : .055, .026, horizontal ? .055 : length, '#abb5ae');
    }
  }
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
  for (let i = 0; i < 7600; i++) {
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
  const sillaRelief = (x, z) => {
    const towardWest = smoothTerrain(40, 64, -x);
    if (towardWest < 1e-4 || Math.abs(z - 6) > 132 || x < -190) return 0;
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
    const serrations = 1 + .075 * Math.sin(x * .16 + z * .2) + .045 * Math.sin(x * .31 - z * .12);
    const crags = (terrainNoise(x * .13 + 5.4, z * .11 - 9.6) - .5) * 2.4;
    const westFade = 1 - smoothTerrain(150, 188, -x);
    const latFade = 1 - smoothTerrain(110, 130, Math.abs(z - 6));
    return Math.max(0, body * serrations + crags) * towardWest * westFade * latFade * .68;
  };
  const lakeOutline = [ [ 36.4, 4.1 ], [ 37.3, 11.6 ], [ 37.8, 20.8 ], [ 38.7, 29.7 ], [ 42.2, 35.1 ], [ 48.8, 37.8 ], [ 55.8, 38.9 ], [ 61.6, 41.5 ], [ 66.4, 45.1 ], [ 71.7, 47 ], [ 77, 46 ], [ 81.7, 44.1 ], [ 84.9, 40.6 ], [ 86.5, 36 ], [ 89.6, 33.6 ], [ 94.5, 31.3 ], [ 99.7, 29 ], [ 104.8, 24.2 ], [ 108.2, 18.6 ], [ 109.4, 12.1 ], [ 108.2, 6 ], [ 104.7, 2.7 ], [ 100.4, -.9 ], [ 95.8, -5.1 ], [ 91.2, -8.8 ], [ 86.8, -11.4 ], [ 80.6, -14 ], [ 74.1, -15.6 ], [ 66.2, -15.2 ], [ 57.8, -14.3 ], [ 49.1, -11.7 ], [ 43.2, -8 ], [ 39.2, -3.7 ] ];
  for (const q of lakeOutline) {
    q[0] = 104 + (q[0] - 104) * .66;
    q[1] = 14 + (q[1] - 14) * .78;
  }
  const lakeCenter = [ 104 + (73 - 104) * .66, 14.2 ];
  const lakeShore = [];
  for (let i = 0; i < lakeOutline.length; i++) {
    const p0 = lakeOutline[(i - 1 + lakeOutline.length) % lakeOutline.length];
    const p1 = lakeOutline[i];
    const p2 = lakeOutline[(i + 1) % lakeOutline.length];
    const p3 = lakeOutline[(i + 2) % lakeOutline.length];
    for (let j = 0; j < 5; j++) {
      const t = j / 5, t2 = t * t, t3 = t2 * t;
      const interpolate = k => .5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      lakeShore.push([ interpolate(0), interpolate(1) ]);
    }
  }
  const lakeDistance = (x, z) => {
    let inside = false, minSq = 1e10;
    for (let i = 0, j = lakeShore.length - 1; i < lakeShore.length; j = i++) {
      const a = lakeShore[i], b = lakeShore[j];
      const dx = b[0] - a[0], dz = b[1] - a[1], len = dx * dx + dz * dz;
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (len || 1)));
      minSq = Math.min(minSq, (x - a[0] - t * dx) ** 2 + (z - a[1] - t * dz) ** 2);
      if (a[1] > z !== b[1] > z && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return Math.sqrt(minSq) * (inside ? -1 : 1);
  };
  const shoreBlend = (x, z) => {
    if (x < 30 || x > 122 || z < -29 || z > 67) return 0;
    const d = lakeDistance(x, z);
    if (d < -.12 || d > 10) return 0;
    const patch = terrainNoise(x * .28 + 13.8, z * .24 - 7.4);
    const wet = terrainNoise(x * .57 - 3.2, z * .62 + 6.1);
    const inner = 1 - smoothTerrain(.9, 5.3 + 3.5 * patch, d);
    const mottled = .49 + .29 * patch + .18 * wet;
    return Math.max(0, Math.min(1, inner * mottled));
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
      const roundedRelief = 29 * gradualSlope * silhouette * (.86 + .22 * broadValley);
      const naturalFolds = 4 * foothillSlope * (.28 + .72 * roundedHills);
      const ridges = terrainNoise(x * .018 + 22.4, z * .021 - 9.2);
      const longRidges = Math.pow(Math.abs(Math.sin(x * .027 + z * .011 + ridges * 3)), 2.5);
      const ridgeLift = 6.3 * gradualSlope * longRidges * (.42 + .58 * roundedHills);
      const localTexture = 1.75 * gradualSlope * (subtleGround - .5);
      height += (roundedRelief + naturalFolds + ridgeLift + localTexture) * 1.9;
    }
    height += sillaRelief(x, z);
    if (x < -34) {
      const d = Math.abs(z + 20.6), entry = smoothTerrain(34, 43, -x);
      const floor = -.05 + Math.max(0, -x - 60) * .02;
      const open = 1 - smoothTerrain(4.5, 9.5, d);
      if (height > floor) height = floor + (height - floor) * (1 - open * entry);
    }
    if (x > 28 && x < 128 && z > -32 && z < 72) {
      const shore = lakeDistance(x, z);
      if (shore <= 0) return .43 - .89 * smoothTerrain(0, 3.7, -shore);
      if (shore < 9) {
        const t = smoothTerrain(0, 9, shore);
        const erosion = (terrainNoise(x * .24 + 6.4, z * .3 - 12.8) - .5) * .13 * 4 * t * (1 - t);
        return .46 + (height - .46) * t + erosion;
      }
    }
    return height;
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
    const grass = [ .13 + .09 * moss + .042 * dry + .032 * altitude, .29 + .12 * moss - .025 * altitude + .018 * dry, .11 + .052 * moss + .004 * altitude ];
    const rockySlope = smoothTerrain(2, 13, sillaRelief(x, z));
    const rockBlend = rockySlope * smoothTerrain(48, 75, -x) * (1 - smoothTerrain(69, 102, Math.abs(z - 24)));
    const strata = .82 + .23 * terrainNoise(x * .23 + z * .075, z * .11 - 4);
    const rock = [ (.3 + .09 * dry) * strata, (.29 + .055 * moss) * strata, (.255 + .045 * dry) * strata ];
    const base = grass.map((value, i) => value * (1 - rockBlend) + rock[i] * rockBlend);
    const blend = shoreBlend(x, z);
    const wet = terrainNoise(x * .42 + 3.4, z * .38 - 11.1);
    const gravel = terrainNoise(x * .19 - 19.2, z * .23 + 7.6);
    const earth = [ .23 + .08 * gravel, .23 + .09 * gravel, .18 + .06 * wet ];
    return base.map((v, i) => v * (1 - blend) + earth[i] * blend);
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
      row.push({
        p: p,
        n: terrainNormal(x, z),
        c: terrainColor(x, z, p[1])
      });
    }
    terrainGrid.push(row);
  }
  const terrainTri = (a, b, c) => {
    const out = A[0];
    appendVertex(out, a.p, a.n, a.c, shoreBlend(a.p[0], a.p[2]), 0, 11, 1);
    appendVertex(out, b.p, b.n, b.c, shoreBlend(b.p[0], b.p[2]), 0, 11, 1);
    appendVertex(out, c.p, c.n, c.c, shoreBlend(c.p[0], c.p[2]), 0, 11, 1);
  };
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
        vertices[offset + 9] = shoreBlend(p[0], p[2]);
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
  const terrainRingScales = [ 1, 1.08, 1.2, 1.5, 2, 3, 5, 8, 16, 32 ];
  const terrainExtentX = terrainWidth * .5 * terrainRingScales[terrainRingScales.length - 1];
  const terrainExtentZ = terrainDepth * .5 * terrainRingScales[terrainRingScales.length - 1];
  const terrainPerimeter = [];
  for (let ix = 0; ix < terrainStepsX; ix++) terrainPerimeter.push(terrainGrid[0][ix]);
  for (let iz = 0; iz < terrainStepsZ; iz++) terrainPerimeter.push(terrainGrid[iz][terrainStepsX]);
  for (let ix = terrainStepsX; ix > 0; ix--) terrainPerimeter.push(terrainGrid[terrainStepsZ][ix]);
  for (let iz = terrainStepsZ; iz > 0; iz--) terrainPerimeter.push(terrainGrid[iz][0]);
  const terrainRings = [ terrainPerimeter ];
  for (let level = 1; level < terrainRingScales.length; level++) {
    const scale = terrainRingScales[level];
    const ring = terrainPerimeter.map(({p: p}) => {
      const x = p[0] * scale, z = p[2] * scale, point = terrainPoint(x, z);
      return {
        p: point,
        n: terrainNormal(x, z),
        c: terrainColor(x, z, point[1])
      };
    });
    const inner = terrainRings[level - 1];
    for (let i = 0; i < ring.length; i++) {
      const next = (i + 1) % ring.length;
      terrainTri(inner[i], ring[next], ring[i]);
      terrainTri(inner[i], inner[next], ring[next]);
    }
    terrainRings.push(ring);
  }
  function terrainTriangleHeight(a, b, c, x, z) {
    const bx = b[0] - a[0], bz = b[2] - a[2], cx = c[0] - a[0], cz = c[2] - a[2];
    const determinant = bx * cz - cx * bz;
    if (Math.abs(determinant) < 1e-10) return null;
    const dx = x - a[0], dz = z - a[2], u = (dx * cz - cx * dz) / determinant, v = (bx * dz - dx * bz) / determinant;
    if (u < -1e-6 || v < -1e-6 || u + v > 1.000001) return null;
    return a[1] + u * (b[1] - a[1]) + v * (c[1] - a[1]);
  }
  function terrainSurfaceHeight(x, z) {
    const halfX = terrainWidth * .5, halfZ = terrainDepth * .5;
    if (Math.abs(x) <= halfX && Math.abs(z) <= halfZ) {
      const gx = (x + halfX) / terrainDX, gz = (z + halfZ) / terrainDZ;
      const ix = Math.min(terrainStepsX - 1, Math.max(0, Math.floor(gx))), iz = Math.min(terrainStepsZ - 1, Math.max(0, Math.floor(gz)));
      const u = gx - ix, v = gz - iz, a = terrainGrid[iz][ix].p, b = terrainGrid[iz][ix + 1].p, c = terrainGrid[iz + 1][ix + 1].p, d = terrainGrid[iz + 1][ix].p;
      return v >= u ? a[1] + v * (d[1] - a[1]) + u * (c[1] - d[1]) : a[1] + u * (b[1] - a[1]) + v * (c[1] - b[1]);
    }
    const scale = Math.max(Math.abs(x) / halfX, Math.abs(z) / halfZ);
    const level = terrainRingScales.findIndex(s => s >= scale);
    if (level > 0) {
      const inner = terrainRings[level - 1], outer = terrainRings[level];
      for (let i = 0; i < inner.length; i++) {
        const next = (i + 1) % inner.length;
        let height = terrainTriangleHeight(inner[i].p, outer[next].p, outer[i].p, x, z);
        if (height !== null) return height;
        height = terrainTriangleHeight(inner[i].p, inner[next].p, outer[next].p, x, z);
        if (height !== null) return height;
      }
    }
    return terrainHeight(x, z);
  }
  let forestSeed = 781353;
  function forestRandom() {
    forestSeed = Math.imul(forestSeed, 1664525) + 1013904223 >>> 0;
    return forestSeed / 4294967296;
  }
  const forestColors = [ '#214622', '#2b5428', '#38632d', '#426b32', '#315a29', '#4a7034', '#254b24' ];
  for (let i = 0; i < 1800; i++) {
    const angle = forestRandom() * Math.PI * 2;
    const radius = 94 + Math.sqrt(forestRandom()) * 150;
    const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
    if (Math.abs(x) > terrainExtentX - 3 || Math.abs(z) > terrainExtentZ - 3) continue;
    const ground = terrainSurfaceHeight(x, z);
    if (terrainHeight(x, z) < 2 || sillaRelief(x, z) > 16) continue;
    const scale = .62 + forestRandom() * 1.08;
    const crownY = ground + .55 * scale;
    const crownH = (1.2 + forestRandom() * .45) * scale;
    const width = (.68 + forestRandom() * .46) * scale;
    const top = [ x, crownY + crownH, z ];
    const bottom = [ x, ground - .02, z ];
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
  const tankNodes = config.nodes.filter(n => n[2] === 'tank');
  const tankSpecs = tankNodes.map(n => ({
    name: n[1]
  }));
  const pipeDefs = [];
  const tankLabels = [];
  const pointNodes = new Map(config.nodes.map(n => [ n[0], n ]));
  const customPipePaths = {
    'li00|li01': [ [ 34, 1.03, 14 ], [ 30.6, 1.03, 14 ], [ 26.4, 1.03, 13.5 ], [ 22, 1.03, 12.6 ] ],
    'li01|li02': [ [ 22, 1.03, 12.6 ], [ 18.4, 1.03, 12.2 ], [ 14.4, 1.03, 11.4 ], [ 10, 1.03, 10.6 ] ],
    'li02|li02a': [ [ 10, 1.03, 10.6 ], [ 7, 1.03, 10.2 ], [ 3.2, 1.03, 9.4 ], [ -1.5, 1.03, 8.2 ] ],
    'li02a|li03': [ [ -1.5, 1.03, 8.2 ], [ -5.8, 1.03, 7.2 ], [ -9.6, 1.03, 6 ], [ -13, 1.03, 4.4 ] ],
    'li03|li04a': [ [ -13, 1.03, 4.4 ], [ -15.2, 1.03, 2.8 ], [ -17.6, 1.03, 1.4 ], [ -19.8, 1.03, -.1 ], [ -22, 1.03, -1.6 ] ],
    'li04a|li05': [ [ -22, 1.03, -1.6 ], [ -24.2, 1.03, -1.5 ], [ -26.6, 1.03, -1.3 ], [ -28.4, 1.03, -1 ], [ -30, 1.03, -.8 ] ],
    'li05|li04': [ [ -30, 1.03, -.8 ], [ -32, 1.03, -.1 ], [ -34.2, 1.03, .7 ], [ -36.6, 1.03, 1.5 ], [ -38.5, 1.03, 2.4 ] ]
  };
  for (const [start, end] of config.lines) {
    const a = pointNodes.get(start), b = pointNodes.get(end);
    if (!a || !b) continue;
    const key = start + '|' + end;
    const mvAnchor = n => {
      if (n[2] !== 'pump') return [ n[3], n[4] ];
      const g = mvNodeAngle.get(n[0]) || 0;
      return [ n[3] - Math.sin(g) * MV_PIPE_LANE, n[4] + Math.cos(g) * MV_PIPE_LANE ];
    };
    const A0 = mvAnchor(a), B0 = mvAnchor(b);
    const aa = [ a[0], a[1], a[2], A0[0], A0[1] ], bb = [ b[0], b[1], b[2], B0[0], B0[1] ];
    const path = ((a, b) => key === 'li00|li01' ? [ [ a[3], 1.03, a[4] ], [ a[3] + 1.2, 1.03, a[4] - 4.6 ], [ b[3] + 5.2, 1.03, b[4] + .4 ], [ b[3], 1.03, b[4] ] ] : key === 'li03|li04a' ? [ [ a[3], 1.03, a[4] ], [ a[3] - 4.4, 1.03, a[4] + 1.4 ], [ b[3], 1.03, b[4] ] ] : [ [ a[3], 1.03, a[4] ], [ b[3], 1.03, b[4] ] ])(aa, bb);
    if (b[2] === 'pump' && (key === 'li00|li01' || key === 'li05|li04')) {
      const g = mvNodeAngle.get(b[0]) || 0, c = Math.cos(g), sn = Math.sin(g), k = (a[3] - b[3]) * c + (a[4] - b[4]) * sn >= 0 ? 10 : -10;
      path.splice(key === 'li00|li01' ? 2 : 1, key === 'li00|li01' ? 1 : 0, [ B0[0] + c * k, 1.03, B0[1] + sn * k ]);
    }
    const meta = {
      nodes: path,
      source: a[1],
      target: b[1]
    };
    pipeDefs.push(meta);
  }
  const mvInsideCaseta = (x, z) => config.nodes.some(n => {
    if (n[2] !== 'pump') return false;
    const a = mvNodeAngle.get(n[0]) || 0, c = Math.cos(a), sn = Math.sin(a), dx = x - n[3], dz = z - n[4];
    return Math.abs(dx * c + dz * sn) < 10.8 * .5 + 1.05 && Math.abs(-dx * sn + dz * c) < 8.15 * .5 - .05;
  });
  const mvPipeJobs = [];
  for (const def of pipeDefs) {
    const pts = def.nodes, parts = [];
    let cur = [];
    for (let i = 0; i < pts.length; i++) {
      if (i > 0) {
        const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(1, Math.ceil(L / .15));
        for (let k = 1; k <= n; k++) {
          const q = [ a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n, a[2] + (b[2] - a[2]) * k / n ];
          if (mvInsideCaseta(q[0], q[2])) {
            if (cur.length > 1) parts.push(cur);
            cur = [];
          } else {
            if (!cur.length || k === n || k % 6 === 0) cur.push(q);
          }
        }
      } else if (!mvInsideCaseta(pts[0][0], pts[0][2])) cur.push(pts[0]);
    }
    if (cur.length > 1) parts.push(cur);
    mvPipeJobs.push({
      parts: parts,
      r: .28,
      def: def
    });
  }
  const mvPB4 = pointNodes.get('li04'), mvG4 = mvNodeAngle.get('li04') || 0, mvP4 = [ mvPB4[3] - Math.sin(mvG4) * MV_PIPE_LANE, mvPB4[4] + Math.cos(mvG4) * MV_PIPE_LANE ];
  const mvCutY = x => terrainHeight(x, mvP4[1]) + 1.03;
  const mountainPipePath = [ [ mvP4[0], 1.03, mvP4[1] ] ];
  for (let x = Math.floor(mvP4[0]) - 2; x >= -190; x -= 4) mountainPipePath.push([ x, mvCutY(x), mvP4[1] ]);
  for (let x = -56; x >= -150; x -= 7) {
    const g = terrainHeight(x, mvP4[1]), y = mvCutY(x);
    box(x, (g + y - .31) / 2, mvP4[1], .5, Math.max(.05, y - .31 - g), .9, '#b7b2a6');
  }
  mvPipeJobs.push({
    parts: [ mountainPipePath ],
    r: .31,
    def: {
      source: 'PB4 Linares',
      target: 'PB4 Linares'
    }
  });
  function pumpStationScene(x, z) {
    pumpUnit(x, z, 4);
  }
  function facilityScene(x, z, type) {
    pad(x, z, 5.4);
    box(x, 1.37, z, 5.1, 2.3, 3.3, '#bac6cc');
    box(x, 2.6, z, 5.5, .24, 3.65, '#647f91');
    box(x, 1.4, z + 1.69, 1.15, 1.7, .12, '#3a5264');
    for (const dx of [ -1.62, -.43, .76 ]) box(x + dx, 1.98, z + 1.71, .65, .4, .05, '#7aa5bc');
    if (type === 'potabilizadora') {
      cylinder(x + 3.75, .83, z, 1.25, 1.2, '#92aab7', {
        seg: 30,
        g: 1,
        alpha: .45,
        kind: 8,
        caps: false
      });
      ring(x + 3.75, 1.46, z, 1.3, '#dfecf0', .08, {
        seg: 7
      });
      tube([ [ x + 3.75, .73, z ], [ x + 5.4, .73, z ] ], .24, '#a7b4b9', {
        seg: 16,
        kind: 0
      });
    }
  }
  function reservoirScene(x, z) {
    const waterY = .49;
    const up = [ 0, 1, 0 ];
    const lakeN = lakeShore.length;
    const shoreRand = n => {
      const q = Math.sin(n * 127.1 + 43.17) * 43758.5453;
      return q - Math.floor(q);
    };
    const shoreNormals = lakeShore.map((p, i) => {
      const before = lakeShore[(i + lakeN - 2) % lakeN], after = lakeShore[(i + 2) % lakeN];
      const dx = after[0] - before[0], dz = after[1] - before[1], length = Math.hypot(dx, dz) || 1;
      const outward = [ -dz / length, dx / length ];
      return lakeDistance(p[0] + outward[0] * 1.65, p[1] + outward[1] * 1.65) >= lakeDistance(p[0] - outward[0] * 1.65, p[1] - outward[1] * 1.65) ? outward : [ -outward[0], -outward[1] ];
    });
    const waterRings = 17;
    const waterColor = rgb('#18679a');
    const ringVertex = (ring, index) => {
      const t = ring / waterRings;
      const shore = lakeShore[index % lakeN], normal = shoreNormals[index % lakeN];
      const r = Math.pow(t, .92);
      const x = lakeCenter[0] + (shore[0] - lakeCenter[0]) * r + normal[0] * .605 * Math.pow(t, 11);
      const z = lakeCenter[1] + (shore[1] - lakeCenter[1]) * r + normal[1] * .605 * Math.pow(t, 11);
      const displacement = .96 * Math.min(1, (1 - t) * 7);
      return vertex([ x, waterY, z ], up, waterColor, displacement, 0, 12, 1);
    };
    for (let ring = 0; ring < waterRings; ring++) {
      for (let i = 0; i < lakeN; i++) {
        const next = (i + 1) % lakeN;
        const a = ringVertex(ring, i), b = ringVertex(ring, next);
        const c = ringVertex(ring + 1, next), d = ringVertex(ring + 1, i);
        A[0].push(...a, ...b, ...c, ...a, ...c, ...d);
      }
    }
    for (let i = 0; i < lakeN; i++) {
      if (i % 7 !== 1 && i % 11 !== 3) continue;
      const a = lakeShore[i], b = lakeShore[(i + 1) % lakeN], normal = shoreNormals[i], other = shoreNormals[(i + 1) % lakeN];
      const wa = [ a[0] + normal[0] * .12, a[1] + normal[1] * .12 ], wb = [ b[0] + other[0] * .12, b[1] + other[1] * .12 ];
      const start = [ wa[0] - normal[0] * .2, wa[1] - normal[1] * .2 ], end = [ wb[0] - other[0] * .2, wb[1] - other[1] * .2 ];
      quad(2, [ start[0], waterY + .009, start[1] ], [ end[0], waterY + .009, end[1] ], [ wb[0], waterY + .009, wb[1] ], [ wa[0], waterY + .009, wa[1] ], up, '#86afaa', .01, 16, .085 + .035 * shoreRand(i + 16));
    }
    const shoreDecorSeed = 82391;
    let decorSeed = shoreDecorSeed;
    const decorRand = () => {
      decorSeed = Math.imul(decorSeed, 1664525) + 1013904223 >>> 0;
      return decorSeed / 4294967296;
    };
    for (let k = 0; k < 105; k++) {
      const idx = Math.floor(decorRand() * lakeN);
      const p = lakeShore[idx];
      if (p[0] < 31 || p[0] > 116) continue;
      const normal = [ p[0] - lakeCenter[0], p[1] - lakeCenter[1] ];
      const normLen = Math.hypot(normal[0], normal[1]) || 1;
      const offset = 3.35 + decorRand() * 4.1;
      const x = p[0] + normal[0] / normLen * offset, z = p[1] + normal[1] / normLen * offset;
      if (lakeDistance(x, z) < .4) continue;
      const ground = terrainHeight(x, z), size = .1 + decorRand() * .33;
      if (decorRand() < .58) {
        const colors = [ '#858777', '#8b8e79', '#71776b', '#a4a18a' ];
        cylinder(x, ground + size * .16, z, size * (.8 + decorRand() * .3), size * .32, colors[Math.floor(decorRand() * colors.length)], {
          seg: 6
        });
      } else {
        const bushColor = [ '#436d36', '#4a6b38', '#55783e', '#315a31' ][Math.floor(decorRand() * 4)];
        for (let i = 0; i < 3; i++) {
          const ang = i * 2.094 + decorRand() * .6;
          const xx = x + Math.cos(ang) * size * .62, zz = z + Math.sin(ang) * size * .62;
          cylinder(xx, ground + size * .26, zz, size * .65, size * .49, bushColor, {
            seg: 6
          });
        }
      }
    }
    const shoreBands = [ 3.16, 3.7, 5.4, 7.4 ];
    const shoreRings = shoreBands.map((distance, layer) => lakeShore.map((p, i) => {
      const a = i / lakeN * Math.PI * 2;
      const variation = Math.sin(a * 7 + .8) * .21 + Math.sin(a * 13 + 2.1) * .115 + Math.sin(a * 23 - 1.5) * .047;
      const offset = Math.max(0, distance + (layer ? variation * Math.min(1, distance * .63) : 0));
      const normal = shoreNormals[i], xx = p[0] + normal[0] * offset, zz = p[1] + normal[1] * offset;
      const ground = terrainHeight(xx, zz);
      const sediment = terrainNoise(xx * .33 + 4.3, zz * .27 - 8.1), flecks = terrainNoise(xx * .97 - 5.2, zz * .82 + 6.7);
      const yy = ground + (layer === 0 ? .045 : layer === 1 ? .038 : layer === 2 ? .026 : .014);
      const damp = [ .3, .2, .1, 0 ][layer] * (.83 + .24 * sediment);
      const shade = terrainColor(xx, zz, ground);
      const earth = [ .235 + .105 * sediment + .045 * flecks, .25 + .092 * sediment, .19 + .078 * flecks + .022 * sediment ];
      const color = shade.map((v, k) => v * (1 - damp) + earth[k] * damp);
      const n = terrainNormal(xx, zz);
      return {
        p: [ xx, yy, zz ],
        n: norm([ n[0] * .28, .72 + n[1] * .28, n[2] * .28 ]),
        c: color,
        blend: damp * .78
      };
    }));
    for (let layer = 0; layer < shoreRings.length - 1; layer++) {
      for (let i = 0; i < lakeN; i++) {
        const next = (i + 1) % lakeN;
        const a = shoreRings[layer][i], b = shoreRings[layer][next];
        const c = shoreRings[layer + 1][next], d = shoreRings[layer + 1][i];
        const drawVertex = q => vertex(q.p, q.n, q.c, q.blend, 0, 11, 1);
        A[0].push(...drawVertex(a), ...drawVertex(b), ...drawVertex(c), ...drawVertex(a), ...drawVertex(c), ...drawVertex(d));
      }
    }
    const wallBase = .3, wallTop = 1.24, roadTop = 1.31;
    const wallInner = lakeShore.map((p, i) => [ p[0] + shoreNormals[i][0] * .62, p[1] + shoreNormals[i][1] * .62 ]);
    const wallOuter = lakeShore.map((p, i) => [ p[0] + shoreNormals[i][0] * 1.29, p[1] + shoreNormals[i][1] * 1.29 ]);
    const roadOuter = lakeShore.map((p, i) => [ p[0] + shoreNormals[i][0] * 2.52, p[1] + shoreNormals[i][1] * 2.52 ]);
    const roadFill = lakeShore.map((p, i) => [ p[0] + shoreNormals[i][0] * 3.14, p[1] + shoreNormals[i][1] * 3.14 ]);
    for (let i = 0; i < lakeN; i++) {
      const next = (i + 1) % lakeN;
      const a = wallInner[i], b = wallInner[next], c = wallOuter[next], d = wallOuter[i];
      const g = roadOuter[next], h = roadOuter[i], m = roadFill[i], n = roadFill[next];
      const normal = shoreNormals[i];
      const concrete = i % 19 < 10 ? '#adb5b2' : '#a6afac';
      const asphalt = i % 23 < 11 ? '#555d5f' : '#4f5658';
      const fill1 = Math.max(terrainHeight(m[0], m[1]) + .06, .16);
      const fill2 = Math.max(terrainHeight(n[0], n[1]) + .06, .16);
      quad(0, [ a[0], wallBase, a[1] ], [ b[0], wallBase, b[1] ], [ b[0], wallTop, b[1] ], [ a[0], wallTop, a[1] ], [ -normal[0], 0, -normal[1] ], concrete, .02);
      quad(0, [ c[0], wallBase, c[1] ], [ d[0], wallBase, d[1] ], [ d[0], wallTop, d[1] ], [ c[0], wallTop, c[1] ], [ normal[0], 0, normal[1] ], '#818c8a', .02);
      quad(0, [ a[0], wallTop, a[1] ], [ b[0], wallTop, b[1] ], [ c[0], wallTop, c[1] ], [ d[0], wallTop, d[1] ], [ 0, 1, 0 ], '#d9ddd7', .05);
      quad(0, [ d[0], roadTop, d[1] ], [ c[0], roadTop, c[1] ], [ g[0], roadTop, g[1] ], [ h[0], roadTop, h[1] ], [ 0, 1, 0 ], asphalt, .04);
      quad(0, [ h[0], roadTop, h[1] ], [ g[0], roadTop, g[1] ], [ n[0], fill2, n[1] ], [ m[0], fill1, m[1] ], [ normal[0], .16, normal[1] ], '#7e8785', .03);
      quad(0, [ m[0], fill1, m[1] ], [ n[0], fill2, n[1] ], [ g[0], fill2 - .08, g[1] ], [ h[0], fill1 - .08, h[1] ], [ 0, -1, 0 ], '#7b8482', .02);
      tube([ [ d[0], roadTop + .03, d[1] ], [ c[0], roadTop + .03, c[1] ] ], .028, '#ecefe8', {
        seg: 6
      });
      tube([ [ h[0], roadTop + .03, h[1] ], [ g[0], roadTop + .03, g[1] ] ], .022, '#d2d5cf', {
        seg: 6
      });
      if (i % 17 === 0) {
        tube([ [ a[0], .48, a[1] ], [ a[0], wallTop, a[1] ] ], .016, '#707b79', {
          seg: 5
        });
        tube([ [ d[0], .48, d[1] ], [ d[0], roadTop, d[1] ] ], .016, '#687573', {
          seg: 5
        });
      }
    }
    const mvDamStart = A.map(g => g.length);
    const damPoints = [ [ 37, -3.5 ], [ 35.9, 1.3 ], [ 35, 6.9 ], [ 34.7, 13.1 ], [ 35.2, 19.6 ], [ 36.2, 25.4 ], [ 38.7, 31.7 ] ];
    const ribbon = (path, width, top, bottom, color) => {
      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i], b = path[i + 1], dx = b[0] - a[0], dz = b[1] - a[1];
        const len = Math.hypot(dx, dz) || 1, px = -dz / len * width * .5, pz = dx / len * width * .5;
        const A = [ a[0] + px, top, a[1] + pz ], B = [ a[0] - px, top, a[1] - pz ];
        const C = [ b[0] - px, top, b[1] - pz ], D = [ b[0] + px, top, b[1] + pz ];
        quad(0, A, B, C, D, [ 0, 1, 0 ], color, .04);
        quad(0, [ a[0] + px, bottom, a[1] + pz ], [ b[0] + px, bottom, b[1] + pz ], D, A, [ px / width, 0, pz / width ], '#969b95', .03);
        quad(0, [ b[0] - px, bottom, b[1] - pz ], [ a[0] - px, bottom, a[1] - pz ], B, C, [ -px / width, 0, -pz / width ], '#b6b6ae', .03);
      }
    };
    ribbon(damPoints, 3.45, 1.72, -.24, '#c6c6bd');
    ribbon(damPoints, 2.37, 1.78, 1.7, '#555b5c');
    for (let i = 0; i < damPoints.length - 1; i++) {
      const a = damPoints[i], b = damPoints[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1;
      const p = [ -dz / len, dx / len ];
      for (const side of [ -1, 1 ]) {
        const q1 = [ a[0] + side * p[0] * 1.45, 2.02, a[1] + side * p[1] * 1.45 ];
        const q2 = [ b[0] + side * p[0] * 1.45, 2.02, b[1] + side * p[1] * 1.45 ];
        tube([ q1, q2 ], .049, '#e5e7df', {
          seg: 7
        });
        for (let k = 0; k < 4; k++) {
          const t = k / 4, rx = a[0] + dx * t + side * p[0] * 1.45, rz = a[1] + dz * t + side * p[1] * 1.45;
          bar([ rx, 1.78, rz ], [ rx, 2.1, rz ], .047, '#b9c3c2', {
            seg: 7
          });
        }
      }
    }
    for (let i = 0; i < 6; i++) {
      const t = (i + .5) / 6 * 5;
      const a = damPoints[Math.floor(t)], b = damPoints[Math.floor(t) + 1], k = t % 1;
      const px = a[0] + (b[0] - a[0]) * k, pz = a[1] + (b[1] - a[1]) * k;
      box(px - .95, .88, pz, .21, 1.31, 2, '#7c8a90');
      box(px - 1.08, .82, pz, .09, .75, 1.42, '#3d6880');
      box(px - 1.15, 1.36, pz, .28, .13, 1.73, '#d6d7cd');
    }
    const connectWallToDam = (wallIndex, damPointIndex, nextPointIndex) => {
      const wi = wallInner[wallIndex], wo = wallOuter[wallIndex];
      const a = damPoints[damPointIndex], b = damPoints[nextPointIndex];
      const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1;
      const px = -dz / len, pz = dx / len;
      const damWater = [ damPoints[damPointIndex][0] - px * 1.725, damPoints[damPointIndex][1] - pz * 1.725 ];
      const damLand = [ damPoints[damPointIndex][0] + px * 1.725, damPoints[damPointIndex][1] + pz * 1.725 ];
      quad(0, [ wi[0], wallTop, wi[1] ], [ wo[0], wallTop, wo[1] ], [ damLand[0], wallTop, damLand[1] ], [ damWater[0], wallTop, damWater[1] ], [ 0, 1, 0 ], '#d9ddd7', .05);
      quad(0, [ wi[0], wallBase, wi[1] ], [ damWater[0], wallBase, damWater[1] ], [ damWater[0], wallTop, damWater[1] ], [ wi[0], wallTop, wi[1] ], [ 0, 0, 1 ], '#aab2af', .03);
      quad(0, [ damLand[0], wallBase, damLand[1] ], [ wo[0], wallBase, wo[1] ], [ wo[0], wallTop, wo[1] ], [ damLand[0], wallTop, damLand[1] ], [ 0, 0, 1 ], '#7f8a88', .03);
      quad(0, [ wo[0], wallBase, wo[1] ], [ wi[0], wallBase, wi[1] ], [ damWater[0], wallBase, damWater[1] ], [ damLand[0], wallBase, damLand[1] ], [ 0, -1, 0 ], '#959d99', .02);
      tube([ [ wi[0], wallTop + .03, wi[1] ], [ damWater[0], wallTop + .03, damWater[1] ] ], .018, '#d8dbd5', {
        seg: 6
      });
      tube([ [ wo[0], wallTop + .03, wo[1] ], [ damLand[0], wallTop + .03, damLand[1] ] ], .018, '#c5cac5', {
        seg: 6
      });
    };
    connectWallToDam(161, 0, 1);
    connectWallToDam(16, 6, 5);
    box(34.5, 2.34, 10.7, 2.15, 1.11, 2.1, '#c4c6bd');
    box(34.5, 2.95, 10.7, 2.4, .2, 2.35, '#727c79');
    box(33.24, 2.42, 10.7, .07, .52, 1.08, '#4b6679');
    bar([ 32.45, 3.1, 8.3 ], [ 32.45, 3.1, 16.5 ], .07, '#dfb83e', {
      seg: 8
    });
    bar([ 32.45, 3.1, 8.3 ], [ 32.45, 4.1, 8.3 ], .065, '#d6ad35', {
      seg: 8
    });
    bar([ 32.45, 3.1, 16.5 ], [ 32.45, 4.1, 16.5 ], .065, '#d6ad35', {
      seg: 8
    });
    bar([ 32.45, 4.1, 8.3 ], [ 32.45, 4.1, 16.5 ], .078, '#e7ba3d', {
      seg: 9
    });
    for (let i = 0; i < 3; i++) {
      const gx = 32 + i * .2;
      box(gx, 1.63, 6.3 + i * 8.2, 1.4, .2, 2.2, '#aeb5b5');
    }
    for (let g = 0; g < A.length; g++) {
      const arr = A[g];
      for (let i = mvDamStart[g]; i < arr.length; i += 13) {
        arr[i] = 104 + (arr[i] - 104) * .66;
        arr[i + 2] = 14 + (arr[i + 2] - 14) * .78;
      }
    }
  }
  function flowMeterScene(x, z) {
    pad(x, z, 2.9);
    cylinder(x, .91, z, .68, 1.26, '#7d9baa', {
      seg: 24
    });
    ring(x, 1.52, z, .7, '#b8d1dc', .07, {
      seg: 7
    });
    box(x, 1.28, z + .62, .76, .56, .16, '#c6d6de');
    
    tube([ [ x - 2.2, .98, z ], [ x + 2.2, .98, z ] ], .32, '#b3d5e3', {
      seg: 14,
      g: 1,
      kind: 4,
      alpha: .22
    });
  }
  const casetaIds = [ 'li01', 'li02', 'li02a', 'li03', 'li04' ];
  const casetaCounts = [ 4, 5, 5, 5, 5 ];
  const casetaStarts = [ 0, 4, 9, 14, 19 ];
  const casetaDataCodes = [ 'LINPB001', 'LINPB002', 'LINPB02A', 'LINPB003', 'LINPB004' ];
  const casetaLightState = new Float32Array(5).fill(1);
  const casetaLightById = new Map(casetaIds.map((id, i) => [ id, i ]));
  function casetaGlazedQuad(a, b, c, d, color, alpha = .31) {
    quad(1, a, b, c, d, [ 0, 0, 1 ], color, .04, 8, alpha);
  }
  function casetaLightQuad(a, b, c, d, index, alpha = .37) {
    const n = [ 0, -1, 0 ];
    tri(1, a, n, b, n, c, n, '#ffd997', .18, index, 16, alpha);
    tri(1, a, n, c, n, d, n, '#ffd997', .18, index, 16, alpha);
  }
  function casetaLitQuad(a, b, c, d, n, color, index, strength = .3) {
    tri(0, a, n, b, n, c, n, color, strength, index, 18, 1);
    tri(0, a, n, c, n, d, n, color, strength, index, 18, 1);
  }
  function casetaGlowDisk(cx, cy, cz, rx, rz, index, opacity = .3) {
    const layers = [ 0, .33, .67, 1 ], segments = 20;
    for (let j = 0; j < layers.length - 1; j++) {
      const r0 = layers[j], r1 = layers[j + 1];
      const alpha0 = opacity * (1 - r0 * r0) * .76, alpha1 = opacity * (1 - r1 * r1) * .76;
      for (let i = 0; i < segments; i++) {
        const a = i * Math.PI * 2 / segments, b = (i + 1) * Math.PI * 2 / segments;
        const q0 = [ cx + Math.cos(a) * rx * r0, cy, cz + Math.sin(a) * rz * r0 ];
        const q1 = [ cx + Math.cos(b) * rx * r0, cy, cz + Math.sin(b) * rz * r0 ];
        const q2 = [ cx + Math.cos(b) * rx * r1, cy, cz + Math.sin(b) * rz * r1 ];
        const q3 = [ cx + Math.cos(a) * rx * r1, cy, cz + Math.sin(a) * rz * r1 ];
        const n = [ 0, 1, 0 ], out = A[1];
        appendVertex(out, q0, n, '#ffd992', .9, index, 17, alpha0);
        appendVertex(out, q1, n, '#ffd992', .9, index, 17, alpha0);
        appendVertex(out, q2, n, '#ffd992', .25, index, 17, alpha1);
        appendVertex(out, q0, n, '#ffd992', .9, index, 17, alpha0);
        appendVertex(out, q2, n, '#ffd992', .25, index, 17, alpha1);
        appendVertex(out, q3, n, '#ffd992', .25, index, 17, alpha1);
      }
    }
  }
  function linaresMotor3D(x, z, equipmentId) {
    box(x, .46, z, 1.2, .17, 1.25, '#263e4d');
    box(x, .56, z, 1.08, .09, 1.12, '#718d99');
    box(x, .63, z, .9, .08, .96, '#203646');
    for (const xx of [ -.4, .4 ]) for (const zz of [ -.42, .42 ]) {
      cylinder(x + xx, .65, z + zz, .058, .065, '#cbd7d9', {
        seg: 8
      });
    }
    cylinder(x, .91, z, .46, .51, '#344b5b', {
      seg: 22
    });
    cylinder(x, 1.18, z, .49, .11, '#a4b9c3', {
      seg: 22
    });
    cylinder(x, 1.47, z, .45, .47, '#6c889a', {
      seg: 26
    });
    cylinder(x, 1.29, z, .47, .08, '#1e3442', {
      seg: 22
    });
    for (let j = 0; j < 12; j++) {
      const a = j * Math.PI / 6;
      box(x + Math.cos(a) * .45, 1.49, z + Math.sin(a) * .45, .065, .35, .07, '#415c69');
    }
    cylinder(x, 1.78, z, .5, .14, '#afc3cb', {
      seg: 26
    });
    cylinder(x, 1.89, z, .52, .12, '#263b49', {
      seg: 26
    });
    cylinder(x, 2.48, z, .455, 1.11, '#36d84d', {
      seg: 26,
      kind: 19,
      levelId: equipmentId,
      em: .44
    });
    cylinder(x, 2.49, z, .472, 1.12, '#60ec68', {
      seg: 26,
      g: 1,
      alpha: .18,
      kind: 19,
      levelId: equipmentId,
      em: .28
    });
    for (let j = 0; j < 10; j++) {
      const a = j * Math.PI / 5;
      const px = x + .492 * Math.cos(a), pz = z + .492 * Math.sin(a);
      bar([ px, 1.99, pz ], [ px, 2.97, pz ], .028, '#a6b8bc', {
        seg: 7
      });
    }
    ring(x, 1.99, z, .49, '#bdced0', .052, {
      seg: 14
    });
    ring(x, 2.96, z, .49, '#bdced0', .052, {
      seg: 14
    });
    cylinder(x, 3.05, z, .51, .15, '#304957', {
      seg: 26
    });
    cylinder(x, 3.27, z, .52, .32, '#bdd1d8', {
      seg: 26
    });
    cylinder(x, 3.47, z, .49, .1, '#2b4555', {
      seg: 26
    });
    cylinder(x, 3.63, z, .43, .24, '#b4c8d0', {
      seg: 24
    });
    cylinder(x, 3.79, z, .34, .075, '#e1ebeb', {
      seg: 22
    });
    cylinder(x, 3.83, z, .24, .055, '#4e6878', {
      seg: 18
    });
    ring(x, 3.89, z, .275, '#9eafb8', .045, {
      seg: 12
    });
    box(x + .43, 1.61, z + .25, .24, .47, .36, '#304754');
    box(x + .56, 1.62, z + .25, .035, .29, .2, '#b2c5cb');
    box(x + .59, 1.72, z + .25, .04, .075, .13, '#3bb954', 0, .26);
    for (const side of [ -1, 1 ]) {
      tube([ [ x + side * .47, 3.29, z ], [ x + side * .72, 3.29, z ], [ x + side * .82, 3.19, z ], [ x + side * .82, 3.02, z ] ], .085, '#b6cbd0', {
        seg: 9
      });
    }
    tube([ [ x, 1.12, z + .48 ], [ x, 1.12, z + .93 ], [ x, 1.32, z + 1.11 ] ], .105, '#238cc2', {
      seg: 9
    });
    box(x, 1.23, z + 1.08, .58, .15, .33, '#879da6');
    bar([ x, 1.42, z + 1.06 ], [ x, 1.55, z + 1.06 ], .055, '#b5c9d1', {
      seg: 8
    });
  }
  function pumpCaseta(x, z, name, index) {
    const w = 10.8, d = 8.15, h = 5.35;
    const left = x - w * .5, right = x + w * .5, back = z - d * .5, front = z + d * .5;
    box(x, .095, z, w + .6, .18, d + .56, '#586970');
    box(x, .21, z, w + .35, .12, d + .33, '#b8c3c1');
    box(x, .29, z, w - .2, .075, d - .18, '#62747a');
    box(x, .346, z, w - .56, .033, d - .56, '#879797');
    for (const side of [ -1, 1 ]) {
      const px = x + side * (w * .5 - .16);
      box(px, 1.02, z, .35, 1.86, d - .22, '#aebcbd');
      box(px, 3.77, back + .84, .34, 2.95, 1.62, '#a9b9bc');
      box(px, 3.77, front - .84, .34, 2.95, 1.57, '#a9b9bc');
      box(px, 5.02, z, .4, .62, d + .16, '#a5b4b6');
      for (const zz of [ back + 1.15, back + 2.85, front - 2.85, front - 1.15 ]) {
        box(px + side * .075, 3.2, zz, .055, 1.75, 1.26, '#688494', 1, .09, .33);
        box(px + side * .085, 3.2, zz, .07, .083, 1.31, '#d8e6e5');
        box(px + side * .085, 3.2, zz, .07, 1.78, .07, '#d8e6e5');
      }
    }
    box(x, 1.3, back + .17, w - .4, 2.18, .32, '#b0bfc0');
    box(x, 3.77, back + .16, w - .4, 2.76, .32, '#a2b4b7');
    box(x, 5.23, back + .17, w + .06, .2, .41, '#d7dfde');
    box(x, 1.3, front - .17, w - .4, 2.18, .32, '#b0bfc0');
    box(x, 3.77, front - .16, w - .4, 2.76, .32, '#a2b4b7');
    for (const xx of [ left + 1.7, left + 3.9, right - 3.9, right - 1.7 ]) {
      box(xx, 3.25, front + .02, 1.4, 1.65, .06, '#688494', 1, .09, .33);
      box(xx, 3.25, front + .04, 1.46, .08, .07, '#d8e6e5');
      box(xx, 3.25, front + .04, .07, 1.7, .07, '#d8e6e5');
    }
    box(x, 1.3, front + .03, 1.5, 2, .08, '#56656c');
    box(x, 1.3, front + .06, .06, 2, .06, '#8b9aa0');
    for (let k = 0; k < 7; k++) {
      const xx = left + .65 + k * (w - 1.3) / 6;
      box(xx, 3.52, back + .365, .07, 2.2, .06, '#83959b');
    }
    for (const side of [ -1, 1 ]) {
      const px = x + side * (w * .5 - .19);
      box(px, 3.13, front - .2, .48, 4.2, .46, '#c4d1d1');
      box(px + side * .03, 3.14, front + .12, .1, 3.28, .1, '#627782');
    }
    for (const xx of [ left + 3, right - 3 ]) {
      box(xx, 4.89, front - .15, .19, .75, .48, '#d2dddc');
      box(xx, 4.9, front + .14, .06, .69, .09, '#556d78');
    }
    box(x, 5.05, front - .18, w + .24, .45, .55, '#a8b9bc');
    box(x, 5.36, front - .18, w + .5, .17, .64, '#e2e8e4');
    box(x, 5.39, back + .1, w + .5, .17, .55, '#acbbbd');
    for (const zz of [ back + .7, back + 2.3, z, z + 2.3, front - .65 ]) {
      box(x, 5.38, zz, w + .21, .09, .11, '#b6c6c8');
      box(x, 5.46, zz, w + .2, .028, .048, '#dce5e1');
    }
    for (const xx of [ left + .4, right - .4 ]) {
      box(xx, 5.36, z, .22, .2, d + .52, '#5c747d');
    }
    casetaGlazedQuad([ left + .43, 5.37, back + .42 ], [ right - .43, 5.37, back + .42 ], [ right - .43, 5.37, front - .46 ], [ left + .43, 5.37, front - .46 ], '#bad4d5', .075);
    const count = casetaCounts[index], start = casetaStarts[index];
    const centerOffset = (count - 1) * .5;
    for (let i = 0; i < count; i++) {
      const px = x + (i - centerOffset) * 1.75;
      const pz = z + .3;
      const dataId = 8 + start + i;
      const ez = z + MV_PUMP_LANE + .75;
      mvRotateBuild(px, ez, Math.PI, () => linaresMotor3D(px, ez, dataId));
      box(px, 1.05, ez - 1.32, .3, .34, .3, '#2c5f8f');
      cylinder(px, 1.38, ez - 1.32, .03, .34, '#b9c2c7', {
        seg: 6
      });
      ring(px, 1.57, ez - 1.32, .16, '#c62828', .025, {
        seg: 6
      });
      orientedCylinder([ px, 1.03, ez - 1.5 ], [ px, 1.03, ez - 1.62 ], .22, '#6f7f88', {
        seg: 16
      });
      box(px, .375, z - 1.58, 1.28, .012, .075, '#dce3e0');
      box(px, 1.01, front + .38, 1.23, .2, .63, '#61747b');
      box(px, 1.15, front + .38, 1.03, .07, .48, '#c2d1d0');
      cylinder(px, 1.34, front + .35, .15, .18, '#34c34b', {
        seg: 13,
        kind: 19,
        levelId: dataId,
        em: .34
      });
      cylinder(px, 1.53, front + .35, .11, .06, '#cededd', {
        seg: 12
      });
    }
    box(x, .16, z + MV_PUMP_LANE, w + .4, .26, 3.3, '#a9aea6');
    box(x, .3, z + MV_PUMP_LANE, w + .1, .04, 3, '#c3c7bf');
    box(left + .63, 1.74, back + .7, .66, 2.44, 1.09, '#435d67');
    box(left + .65, 1.98, back + 1.29, .48, 1.24, .075, '#90b0b9', 1, .13, .8);
    for (const yy of [ 1.59, 1.87, 2.12 ]) for (const dx of [ -.14, .12 ]) {
      box(left + .65 + dx, yy, back + 1.35, .075, .065, .036, yy === 1.87 ? '#e2bb61' : '#95aeb5');
    }
    box(right - .59, 3.6, back + .48, .58, .93, .13, '#536a75');
    for (const off of [ -.18, -.08, .03, .14 ]) box(right - .59 + off, 3.6, back + .56, .042, .67, .025, '#c5d6d5');
    box(x, 5.17, front + .36, 3.28, .45, .13, '#e5ebe8');
    for (const xx of [ x - 2.65, x, x + 2.65 ]) {
      box(xx, 5.17, front - .19, .8, .15, .24, '#697f87');
      cylinder(xx, 5.01, front + .01, .21, .13, '#f5e2b4', {
        seg: 16,
        kind: 16,
        levelId: index,
        em: 1.1
      });
      casetaGlowDisk(xx, .395, front - .5, 1.26, 1.65, index, .25);
    }
    for (const xx of [ x - 2.73, x + 2.73 ]) {
      cylinder(xx, 5.22, z, .32, .17, '#798e94', {
        seg: 15
      });
      cylinder(xx, 5.07, z, .34, .13, '#fae8c2', {
        seg: 18,
        kind: 16,
        levelId: index,
        em: 1.1
      });
      cylinder(xx, 4.96, z, .12, .035, '#f8eacb', {
        seg: 15,
        kind: 16,
        levelId: index,
        em: 1.1
      });
      casetaGlowDisk(xx, .39, z, .99, 2, index, .25);
    }
    casetaLitQuad([ left + .4, .37, back + .43 ], [ right - .4, .37, back + .43 ], [ right - .4, .37, front - .39 ], [ left + .4, .37, front - .39 ], [ 0, 1, 0 ], '#889494', index, .33);
    casetaLightQuad([ left + .42, 5.27, back + .6 ], [ right - .42, 5.27, back + .6 ], [ right - .42, 5.27, front - .6 ], [ left + .42, 5.27, front - .6 ], index, .08);
    for (const xx of [ left + 2.12, right - 2.12 ]) {
      box(xx, 4.62, front + .25, .69, .24, .39, '#667c84');
      cylinder(xx, 4.42, front + .38, .24, .14, '#f3e5c6', {
        seg: 14,
        kind: 16,
        levelId: index,
        em: 1.1
      });
      casetaGlowDisk(xx, .36, front + .62, .95, .95, index, .2);
    }
    box(x, .39, front + .6, 3.38, .14, 1.3, '#a7b3b2');
    box(x, .46, front + .66, 3.14, .1, 1.2, '#d1d8d5');
  }
  function mvRotateBuild(x, z, ang, fn) {
    const st = A.map(g => g.length);
    fn();
    const c = Math.cos(ang), sn = Math.sin(ang);
    for (let g = 0; g < A.length; g++) {
      const arr = A[g];
      for (let i = st[g]; i < arr.length; i += 13) {
        const dx = arr[i] - x, dz = arr[i + 2] - z;
        arr[i] = x + dx * c - dz * sn;
        arr[i + 2] = z + dx * sn + dz * c;
        const nx = arr[i + 3], nz = arr[i + 5];
        arr[i + 3] = nx * c - nz * sn;
        arr[i + 5] = nx * sn + nz * c;
      }
    }
  }
  const mvStationBounds = new Map, mvStationVisibility = new Map;
  config.nodes.forEach(n => {
    const starts = A.map(group => group.length);
    const [, name, type, x, z] = n;
    if (type === 'tank') tankLabels.push(mvSmallPresa(x, z, name)); else if (type === 'reservoir') reservoirScene(x, z); else if (type === 'pump') mvRotateBuild(x, z, mvNodeAngle.get(n[0]) || 0, () => pumpCaseta(x, z, name, casetaLightById.get(n[0]))); else if (type === 'meter') flowMeterScene(x, z); else mvRotateBuild(x, z, mvNodeAngle.get(n[0]) || 0, () => facilityScene(x, z, name.toLowerCase().includes('potabilizadora') ? 'potabilizadora' : 'facility'));
    const low = [ Infinity, Infinity, Infinity ], high = [ -Infinity, -Infinity, -Infinity ];
    const visible = [];
    for (let group = 0; group < A.length; group++) for (let i = starts[group]; i < A[group].length; i += 13) for (let axis = 0; axis < 3; axis++) {
      low[axis] = Math.min(low[axis], A[group][i + axis]);
      high[axis] = Math.max(high[axis], A[group][i + axis]);
      const water = n[2] === 'reservoir' && Math.abs(A[group][i + 1] - .49) < .001 && A[group][i + 11] === 12;
      if (axis === 0 && (water || n[2] !== 'reservoir' && A[group][i + 1] >= 1.2 && A[group][i + 1] <= 3.5)) {
        const p = A[group].slice(i, i + 3);
        p[1] = Math.max(1.2, p[1]);
        for (let side = 0; side < 4; side++) {
          const a = side < 2 ? 0 : 2, sign = side % 2 ? 1 : -1;
          if (!visible[side] || p[a] * sign > visible[side][a] * sign) visible[side] = p;
        }
      }
    }
    if (low.every(Number.isFinite)) {
      low[0] -= 1;
      low[2] -= 1;
      high[0] += 1;
      high[2] += 1;
      high[1] = Math.max(high[1] + .6, type === 'pump' ? 8.2 : type === 'tank' ? 7.5 : type === 'reservoir' ? 7.2 : 5.5);
      const corners = [];
      for (const px of [ low[0], high[0] ]) for (const py of [ low[1], high[1] ]) for (const pz of [ low[2], high[2] ]) corners.push([ px, py, pz ]);
      mvStationBounds.set(n[0], corners);
      mvStationVisibility.set(n[0], visible.filter(Boolean));
    }
  });
  const MV_TALL = [ [ 'li01', 'LINPB001', 2, 7.4, 7 ], [ 'li02', 'LINPB002', 3, 9.5, 26 ], [ 'li02a', 'LINPB02A', 4, 7.4, 7 ], [ 'li03', 'LINPB003', 5, 7.4, 7 ], [ 'li04', 'LINPB004', 6, 7.4, 7 ] ];
  const MV_TALL_WATER = H => H - .4;
  const mvTallPos = new Map;
  function mvTallTank(cx, cz, lid, H, cap) {
    const R = H > 10 ? 1.45 : 1.28, top = .52 + H, mw = MV_TALL_WATER(H);
    pad(cx, cz, 3.5);
    cylinder(cx, .31, cz, R * 1.13, .18, '#667c88', {
      seg: 36
    });
    cylinder(cx, .43, cz, R * .99, .07, '#2f5164', {
      seg: 36
    });
    cylinder(cx, .52 + mw / 2, cz, R * .93, mw, '#0869bc', {
      seg: 48,
      kind: 5,
      em: 1,
      caps: false,
      levelId: lid
    });
    cylinder(cx, .52 + mw, cz, R * .93, .045, '#4fa7e6', {
      seg: 48,
      kind: 6,
      em: 1.15,
      levelId: lid
    });
    cylinder(cx, .52 + H / 2, cz, R * .965, H, '#9da3aa', {
      seg: 48,
      g: 1,
      alpha: .5,
      em: .02,
      kind: 8,
      caps: false
    });
    cylinder(cx, .52 + H / 2, cz, R * .985, H, '#c4c9ce', {
      seg: 48,
      g: 2,
      alpha: .065,
      em: .035,
      kind: 8,
      caps: false
    });
    const fr = R * 1.04;
    for (const k of [ 0, .25, .5, .75, 1 ]) ring(cx, .52 + H * k, cz, fr, k === 0 || k === 1 ? '#e2ebee' : '#597d8b', k === 0 || k === 1 ? .08 : .03, {
      seg: 8,
      em: .12
    });
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, xp = cx + Math.cos(a) * fr, zp = cz + Math.sin(a) * fr;
      bar([ xp, .52, zp ], [ xp, top, zp ], .047, i % 2 ? '#789aab' : '#d1e2e8', {
        seg: 8,
        em: .08
      });
    }
    cylinder(cx, top + .12, cz, R * 1.02, .2, '#8fa3ad', {
      seg: 36
    });
    cylinder(cx, top + .32, cz, R * .55, .22, '#a9bcc4', {
      seg: 24
    });
    const gold = '#eebd54', zr = cz - R - .15, lx = cx - .2;
    bar([ lx, .48, zr ], [ lx, top + .2, zr ], .049, gold, {
      seg: 8
    });
    bar([ lx + .39, .48, zr ], [ lx + .39, top + .2, zr ], .049, gold, {
      seg: 8
    });
    for (let y = .65; y < top; y += .32) bar([ lx, y, zr ], [ lx + .39, y, zr ], .037, gold, {
      seg: 7
    });
    for (const k of [ .3, .55, .8 ]) ring(cx, .52 + H * k + .9, zr + .05, .42, gold, .03, {
      seg: 6
    });
    const gx = cx + R * 1.12, gz = cz + R * .62;
    bar([ gx, .52, gz ], [ gx, .52 + mw, gz ], .035, '#e8eef0', {
      seg: 6
    });
    for (let m = 0; m <= Math.floor(cap); m++) {
      const big = m % 5 === 0, y = .52 + m * mw / cap, L = big ? .42 : .22;
      if (!big && mw / cap < .45) continue;
      bar([ gx, y, gz ], [ gx + L * .86, y, gz + L * .5 ], big ? .03 : .018, big ? '#ff9c2a' : '#ffffff', {
        seg: 5,
        em: .4
      });
    }
  }
  for (const [id, code, lid, H, cap] of MV_TALL) {
    const n = pointNodes.get(id);
    if (!n) continue;
    const x = n[3], z = n[4], a = mvNodeAngle.get(id) || 0, c = Math.cos(a), sn = Math.sin(a), dx = 8.3, dz = MV_PIPE_LANE;
    mvRotateBuild(x, z, a, () => mvTallTank(x + dx, z + dz, lid, H, cap));
    mvTallPos.set(code, {
      x: x + dx * c - dz * sn,
      z: z + dx * sn + dz * c,
      r: H > 10 ? 1.45 : 1.28,
      H: H,
      cap: cap,
      mw: MV_TALL_WATER(H)
    });
  }
  (function mvLinaresEnvironment() {
    let seed = 90817;
    const rnd = () => {
      seed = Math.imul(seed, 1664525) + 1013904223 >>> 0;
      return seed / 4294967296;
    };
    const ground = (x, z) => Math.max(-.048, terrainHeight(x, z));
    const UP = [ 0, 1, 0 ];
    const route = [];
    for (const def of pipeDefs) for (const p of def.nodes) {
      const last = route[route.length - 1];
      if (!last || Math.hypot(last[0] - p[0], last[2] - p[2]) > .05) route.push([ p[0], 0, p[2] ]);
    }
    const resample = (pts, step) => {
      const out = [ pts[0] ];
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(1, Math.round(L / step));
        for (let k = 1; k <= n; k++) out.push([ a[0] + (b[0] - a[0]) * k / n, 0, a[2] + (b[2] - a[2]) * k / n ]);
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
    const angOf = n => typeof mvNodeAngle !== 'undefined' && mvNodeAngle.get(n[0]) || 0;
    const toWorld = (n, lx, lz) => {
      const a = angOf(n), c = Math.cos(a), sn = Math.sin(a);
      return [ n[3] + lx * c - lz * sn, n[4] + lx * sn + lz * c ];
    };
    const toLocal = (n, x, z) => {
      const a = angOf(n), c = Math.cos(a), sn = Math.sin(a), dx = x - n[3], dz = z - n[4];
      return [ dx * c + dz * sn, -dx * sn + dz * c ];
    };
    const inBox = (n, x, z, hx, hz) => {
      const l = toLocal(n, x, z);
      return Math.abs(l[0]) < hx && Math.abs(l[1]) < hz;
    };
    const routeC = route.reduce((acc, p) => [ acc[0] + p[0] / route.length, acc[1] + p[2] / route.length ], [ 0, 0 ]);
    const startIndex = route.findIndex(p => Math.hypot(p[0] - casetas[0][3], p[2] - casetas[0][4]) < .2);
    const base = resample(route.slice(Math.max(0, startIndex)), 1);
    const smooth = base.map((p, i) => {
      const a = base[Math.max(0, i - 3)], b = base[Math.min(base.length - 1, i + 3)];
      return [ (a[0] + p[0] * 2 + b[0]) / 4, 0, (a[2] + p[2] * 2 + b[2]) / 4 ];
    });
    const OFFSET = 8.2;
    const road = smooth.map((p, i) => {
      const a = smooth[Math.max(0, i - 1)], b = smooth[Math.min(smooth.length - 1, i + 1)];
      let tx = b[0] - a[0], tz = b[2] - a[2];
      const l = Math.hypot(tx, tz) || 1;
      tx /= l;
      tz /= l;
      let nx = -tz, nz = tx;
      if ((p[0] - routeC[0]) * nx + (p[2] - routeC[1]) * nz < 0) {
        nx = -nx;
        nz = -nz;
      }
      return {
        x: p[0] + nx * OFFSET,
        z: p[2] + nz * OFFSET,
        nx: nx,
        nz: nz,
        tx: tx,
        tz: tz
      };
    });
    const strip = (pts, off0, off1, y, col) => {
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const ya = ground(a.x, a.z) + y, yb = ground(b.x, b.z) + y;
        quad(0, [ a.x + a.nx * off0, ya, a.z + a.nz * off0 ], [ b.x + b.nx * off0, yb, b.z + b.nz * off0 ], [ b.x + b.nx * off1, yb, b.z + b.nz * off1 ], [ a.x + a.nx * off1, ya, a.z + a.nz * off1 ], UP, col);
      }
    };
    for (const n of casetas) {
      const x = n[3], z = n[4];
      if (n[2] === 'pump') {
        const hw = 6.9, hd = 9, hb = 5;
        const W = (lx, lz) => toWorld(n, lx, lz);
        const pts = [ [ -hw, -hb ], [ hw, -hb ], [ hw, hd ], [ -hw, hd ], [ -hw, -hb ] ];
        for (let s2 = 0; s2 < 4; s2++) {
          const p0 = pts[s2], p1 = pts[s2 + 1], L2 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), steps = Math.round(L2 / 1.6);
          for (let k = 0; k <= steps; k++) {
            const lx = p0[0] + (p1[0] - p0[0]) * k / steps, lz = p0[1] + (p1[1] - p0[1]) * k / steps, f = W(lx, lz);
            const gate = s2 === 2 && Math.abs(lx) < 2;
            if (!gate) cylinder(f[0], ground(f[0], f[1]) + .62, f[1], .045, 1.24, '#9aa5aa', {
              seg: 6
            });
            if (k > 0) {
              const gx = p0[0] + (p1[0] - p0[0]) * (k - 1) / steps, gz = p0[1] + (p1[1] - p0[1]) * (k - 1) / steps, g2 = W(gx, gz);
              const gateSeg = s2 === 2 && (Math.abs(lx) < 2 || Math.abs(gx) < 2);
              if (!gateSeg) for (const hy of [ .42, .82, 1.18 ]) bar([ g2[0], ground(g2[0], g2[1]) + hy, g2[1] ], [ f[0], ground(f[0], f[1]) + hy, f[1] ], .012, '#b9c3c7', {
                seg: 4
              });
            }
          }
        }
        for (const sx of [ -1, 1 ]) {
          const f = W(sx * 2, hd);
          cylinder(f[0], ground(f[0], f[1]) + .8, f[1], .09, 1.6, '#7e898e', {
            seg: 8
          });
        }
      }
    }
    const poleOff = 3.7, poles = [];
    let acc = 99;
    for (let i = 1; i < road.length; i++) {
      acc += Math.hypot(road[i].x - road[i - 1].x, road[i].z - road[i - 1].z);
      if (acc >= 10.5 && ground(road[i].x + road[i].nx * poleOff, road[i].z + road[i].nz * poleOff) < 1.2 && lakeDistance(road[i].x + road[i].nx * poleOff, road[i].z + road[i].nz * poleOff) > 5) {
        acc = 0;
        const r = road[i];
        poles.push({
          x: r.x + r.nx * poleOff,
          z: r.z + r.nz * poleOff,
          nx: r.nx,
          nz: r.nz
        });
      }
    }
    for (const p of poles) {
      const g = ground(p.x, p.z);
      cylinder(p.x, g + 3.4, p.z, .11, 6.8, '#6e5640', {
        seg: 8
      });
      bar([ p.x - p.nx * .95, g + 6.45, p.z - p.nz * .95 ], [ p.x + p.nx * .95, g + 6.45, p.z + p.nz * .95 ], .055, '#5b4634', {
        seg: 6
      });
      for (const o of [ -.8, 0, .8 ]) cylinder(p.x + p.nx * o, g + 6.6, p.z + p.nz * o, .05, .2, '#cfd8dc', {
        seg: 8
      });
      p.g = g;
    }
    for (let i = 1; i < poles.length; i++) {
      const a = poles[i - 1], b = poles[i];
      if (Math.hypot(b.x - a.x, b.z - a.z) > 16) continue;
      for (const o of [ -.8, 0, .8 ]) {
        const pts = [];
        for (let k = 0; k <= 8; k++) {
          const t = k / 8, sag = Math.sin(Math.PI * t) * .55;
          pts.push([ a.x + a.nx * o + (b.x + b.nx * o - a.x - a.nx * o) * t, a.g + (b.g - a.g) * t + 6.7 - sag, a.z + a.nz * o + (b.z + b.nz * o - a.z - a.nz * o) * t ]);
        }
        tube(pts, .016, '#2b3034', {
          seg: 4
        });
      }
    }
    const lamp = (x, z, dirx, dirz) => {
      const g = ground(x, z), H = 4.6;
      cylinder(x, g + H / 2, z, .07, H, '#7f8b90', {
        seg: 8
      });
      cylinder(x, g + .15, z, .16, .3, '#6b767b', {
        seg: 10
      });
      const hx = x + dirx * .85, hz = z + dirz * .85;
      bar([ x, g + H - .05, z ], [ hx, g + H - .05, hz ], .035, '#7f8b90', {
        seg: 6
      });
      box(hx, g + H - .14, hz, .52, .1, .3, '#4b5559');
      box(hx, g + H - .2, hz, .44, .03, .24, '#ffffff', 0, 0, 1);
      const lampVerts = A[0].length;
      box(hx, g + H - .215, hz, .42, .02, .22, '#ffffff');
      for (let i = lampVerts; i < A[0].length; i += 13) A[0][i + 11] = 20;
      const steps = 24, gy = g + .06, radii = [ 0, .6, 1.2, 1.9, 2.7, 3.6, 4.6 ], alphas = [ .55, .46, .35, .24, .14, .06, 0 ];
      for (let r = 0; r < radii.length - 1; r++) {
        const r0 = radii[r], r1 = radii[r + 1], al = (alphas[r] + alphas[r + 1]) * .5;
        for (let k = 0; k < steps; k++) {
          const a0 = k / steps * Math.PI * 2, a1 = (k + 1) / steps * Math.PI * 2;
          const p00 = [ hx + Math.cos(a0) * r0, gy, hz + Math.sin(a0) * r0 ], p01 = [ hx + Math.cos(a1) * r0, gy, hz + Math.sin(a1) * r0 ];
          const p10 = [ hx + Math.cos(a0) * r1, gy, hz + Math.sin(a0) * r1 ], p11 = [ hx + Math.cos(a1) * r1, gy, hz + Math.sin(a1) * r1 ];
          if (r0 > 0) tri(1, p00, UP, p10, UP, p11, UP, '#ffcc80', 0, 0, 21, al);
          tri(1, p00, UP, p11, UP, p01, UP, '#ffcc80', 0, 0, 21, al);
        }
      }
    };
    for (const n of config.nodes.filter(q => q[2] === 'pump')) {
      const hw = 6.6, hd = 8.7, a = angOf(n), c = Math.cos(a), sn = Math.sin(a);
      for (const [sx, sz] of [ [ -1, -1 ], [ 1, -1 ], [ 1, 1 ], [ -1, 1 ] ]) {
        const f = toWorld(n, sx * hw, sz > 0 ? hd : -5.3), dx = -sx * .7071, dz = -sz * .7071;
        lamp(f[0], f[1], dx * c - dz * sn, dx * sn + dz * c);
      }
    }
    {
      const pts = resample(route, 1);
      let accL = 6;
      for (let i = 1; i < pts.length; i++) {
        accL += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]);
        if (accL < 12) continue;
        const p = pts[i];
        if (casetas.some(n => inBox(n, p[0], p[2], 8.5, n[2] === 'pump' ? 10.5 : 7.5)) || lakeDistance(p[0], p[2]) < 2) continue;
        accL = 0;
        const a = pts[i - 1];
        let nx = -(p[2] - a[2]), nz = p[0] - a[0];
        const l = Math.hypot(nx, nz) || 1;
        nx /= l;
        nz /= l;
        if ((p[0] - routeC[0]) * nx + (p[2] - routeC[1]) * nz > 0) {
          nx = -nx;
          nz = -nz;
        }
        lamp(p[0] + nx * 2.2, p[2] + nz * 2.2, -nx, -nz);
      }
    }
    const nearCaseta = (x, z) => casetas.some(n => n[2] === 'pump' ? (() => {
      const l = toLocal(n, x, z);
      return Math.abs(l[0]) < 6.2 && l[1] > -5 && l[1] < 9.2;
    })() : inBox(n, x, z, 6.2, 5));
    for (const def of pipeDefs) {
      const pts = resample(def.nodes.map(p => [ p[0], 0, p[2] ]), 2.6);
      pts.forEach((p, i) => {
        if (nearCaseta(p[0], p[2]) || lakeDistance(p[0], p[2]) < 1.5) return;
        const g = ground(p[0], p[2]), top = 1.03 - .3;
        if (top - g > .05) {
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
          const horiz = Math.abs(b[0] - a[0]) > Math.abs(b[2] - a[2]);
          box(p[0], (g + top) / 2, p[2], horiz ? .42 : .78, top - g, horiz ? .78 : .42, '#b7b2a6');
          box(p[0], top - .02, p[2], horiz ? .5 : .86, .05, horiz ? .86 : .5, '#8e8a80');
        }
        if (i % 4 === 2) {
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
          let nx = -(b[2] - a[2]), nz = b[0] - a[0];
          const l = Math.hypot(nx, nz) || 1;
          nx /= l;
          nz /= l;
          if (nz < 0) {
            nx = -nx;
            nz = -nz;
          }
          const mx = p[0] + nx * 1.35, mz = p[2] + nz * 1.35;
          cylinder(mx, g + .55, mz, .055, 1.1, '#f0c419', {
            seg: 8
          });
          cylinder(mx, g + 1.14, mz, .075, .1, '#d9480f', {
            seg: 8
          });
        }
      });
    }
    const crownCols = [ '#3f5f2a', '#4a6b2f', '#55743a', '#5f7c3c', '#466332', '#6b8341' ];
    const shrubCols = [ '#5b6f38', '#6d7d42', '#4f6634', '#7a8549' ];
    const polePts = poles.map(p => [ p.x, 0, p.z ]);
    const keepOut = (x, z, margin) => {
      if (Math.hypot(x, z) > 93) return true;
      if (x < -40 && Math.abs(z + 20.6) < 15) return true;
      if (ground(x, z) > 1.2) return true;
      if (lakeDistance(x, z) < 3.5) return true;
      if (distToPoly(x, z, route) < 6.5 + margin) return true;
      if (distToPoly(x, z, polePts) < 2.2 + margin) return true;
      if (casetas.some(n => n[2] === 'pump' ? (() => {
        const l = toLocal(n, x, z);
        return Math.abs(l[0]) < 12.5 + margin && l[1] > -10 - margin && l[1] < 15 + margin;
      })() : inBox(n, x, z, 11 + margin, 11 + margin))) return true;
      return false;
    };
    const tree = (x, z, s) => {
      const g = ground(x, z), trunkH = (1 + rnd() * .6) * s;
      cylinder(x, g + trunkH / 2, z, .09 * s + .03, trunkH, '#5a4634', {
        seg: 6
      });
      const col = crownCols[Math.floor(rnd() * crownCols.length)];
      const lobes = 3 + Math.floor(rnd() * 2);
      for (let l = 0; l < lobes; l++) {
        const a = rnd() * Math.PI * 2, rr = (l ? .45 : 0) * s, cx = x + Math.cos(a) * rr, cz = z + Math.sin(a) * rr;
        const cy = g + trunkH + (.25 + rnd() * .35) * s, w = (.75 + rnd() * .45) * s, h = (.55 + rnd() * .35) * s;
        const top = [ cx, cy + h, cz ], bottom = [ cx, cy - h * .55, cz ];
        for (let k = 0; k < 7; k++) {
          const a0 = k / 7 * Math.PI * 2, a1 = (k + 1) / 7 * Math.PI * 2;
          const p0 = [ cx + Math.cos(a0) * w, cy, cz + Math.sin(a0) * w ], p1 = [ cx + Math.cos(a1) * w, cy, cz + Math.sin(a1) * w ];
          const nU = norm([ Math.cos((a0 + a1) / 2), .65, Math.sin((a0 + a1) / 2) ]), nD = norm([ Math.cos((a0 + a1) / 2), -.35, Math.sin((a0 + a1) / 2) ]);
          tri(0, p0, nU, p1, nU, top, nU, col);
          tri(0, p1, nD, p0, nD, bottom, nD, col);
        }
      }
    };
    let placed = 0;
    for (let i = 0; i < 2600 && placed < 380; i++) {
      const x = -92 + rnd() * 140, z = -60 + rnd() * 118;
      const cluster = .5 + .5 * Math.sin(x * .09 + 1.7) * Math.cos(z * .11 - .4);
      if (rnd() > .25 + cluster * .75) continue;
      if (keepOut(x, z, 0)) continue;
      tree(x, z, .75 + rnd() * .75);
      placed++;
    }
    for (let i = 0; i < 900; i++) {
      const x = -92 + rnd() * 140, z = -60 + rnd() * 118;
      if (keepOut(x, z, -2)) continue;
      const g = ground(x, z), w = .25 + rnd() * .35, h = .22 + rnd() * .28, col = shrubCols[Math.floor(rnd() * shrubCols.length)];
      const top = [ x, g + h, z ];
      for (let k = 0; k < 5; k++) {
        const a0 = k / 5 * Math.PI * 2, a1 = (k + 1) / 5 * Math.PI * 2, n = norm([ Math.cos((a0 + a1) / 2), .7, Math.sin((a0 + a1) / 2) ]);
        tri(0, [ x + Math.cos(a0) * w, g, z + Math.sin(a0) * w ], n, [ x + Math.cos(a1) * w, g, z + Math.sin(a1) * w ], n, top, n, col);
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
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  const levelsUniform = new Float32Array(36);
  function updateWaterLevels() {
    for (const [, code, lid, H, cap] of MV_TALL) {
      const v = live.get(code), lv = v && v.level !== null && Number.isFinite(Number(v.level)) ? Number(v.level) : null;
      if (lv === null || lv <= 0) {
        levelsUniform[lid] = 0;
        continue;
      }
      levelsUniform[lid] = Math.max(.02, Math.min(.94, lv / cap));
    }
    for (let i = 0; i < tankSpecs.length; i++) {
      const node = tankNodes[i];
      const value = node && node[5] ? live.get(node[5]) : null;
      const level = value && value.level !== null && Number.isFinite(Number(value.level)) ? Number(value.level) : null;
      const limit = tankDisplayScale(value);
      levelsUniform[i] = level === null || level <= 0 ? 0 : Math.max(0, Math.min(.94, level / limit * .9));
    }
    {
      const pr = live.get('PRESACP');
      let pct = null;
      if (pr && Array.isArray(pr.extra)) {
        const it = pr.extra.find(q => q && q.unit === '%');
        if (it && Number.isFinite(Number(it.value))) pct = Number(it.value);
      }
      levelsUniform[35] = pct === null ? 0 : Math.max(.001, Math.min(1, pct / 100));
    }
    for (let group = 0; group < casetaIds.length; group++) {
      const reading = live.get(casetaDataCodes[group]);
      for (let motor = 0; motor < casetaCounts[group]; motor++) {
        const pump = reading && Array.isArray(reading.pumps) ? reading.pumps[motor] : null;
        levelsUniform[8 + casetaStarts[group] + motor] = pump && typeof pump.on === 'boolean' ? pump.on ? 1 : 0 : .5;
      }
    }
  }
  updateWaterLevels();
  const mvPipeBufs = [ 0, 1, 2 ].map(() => ({
    buf: gl.createBuffer(),
    count: 0
  }));
  {
    const saved = A;
    A = [[], [], []];
    mvPipeJobs.forEach((job,index) => {
      const names = [...new Set([job.def.source,job.def.target].filter(Boolean))];
      const label = 'Tramo ' + (index+1) + ' · ' + (job.def.label || names.join(' — '));
      for (const part of job.parts) pipe(part, job.r, job.def, label);
    });
    for (let g=0;g<3;g++) {
      const data = new Float32Array(A[g]);
      gl.bindBuffer(gl.ARRAY_BUFFER, mvPipeBufs[g].buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      mvPipeBufs[g].count = data.length / 13;
    }
    A = saved;
  }
  refreshPipeLevels(null);
  const sceneAttributes = [[loc.pos, 0, 3], [loc.normal, 12, 3], [loc.color, 24, 3], [loc.data, 36, 4]];
  function bindBuffer(item) {
    gl.bindBuffer(gl.ARRAY_BUFFER, item.buf);
    for (const [attr, offset, size] of sceneAttributes) {
      if (attr < 0) continue;
      gl.enableVertexAttribArray(attr);
      gl.vertexAttribPointer(attr, size, gl.FLOAT, false, 52, offset);
    }
  }
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
  function drawGroup(group) {
    if (group === 0) drawOpaqueScene();
    else if (buffers[group].count) {
      bindBuffer(buffers[group]);
      gl.drawArrays(gl.TRIANGLES, 0, buffers[group].count);
    }
    const pipe = mvPipeBufs[group];
    if (pipe.count) {
      bindBuffer(pipe);
      gl.drawArrays(gl.TRIANGLES, 0, pipe.count);
    }
  }
  let mvOverviewFit = true, mvOverviewZoom = 1, mvAutoZoom = 1, mvFrameDistance = 0, mvFrameMode = '';
  let mvLastEye = null, mvLastTarget = null;
  function mvLeaveOverview() {
    if (!mvOverviewFit || !mvLastEye || !mvLastTarget) return;
    mvOverviewFit = false;
    mvFrameDistance = 0;
    mvZoomGoal = null;
    const e = mvLastEye, t = mvLastTarget, dx = e[0] - t[0], dy = e[1] - t[1], dz = e[2] - t[2], d = Math.max(CAMERA_LIMITS.minDist, Math.hypot(dx, dy, dz));
    state.target = [ Math.max(CAMERA_LIMITS.panXMin, Math.min(CAMERA_LIMITS.panXMax, t[0])), Math.max(.6, t[1]), Math.max(CAMERA_LIMITS.panZMin, Math.min(CAMERA_LIMITS.panZMax, t[2])) ];
    state.dist = Math.min(CAMERA_LIMITS.maxDist, d);
    state.yaw = Math.atan2(dz, dx);
    state.pitch = Math.acos(Math.max(-1, Math.min(1, dy / Math.hypot(dx, dy, dz))));
  }
  const stationCorners = Array.from(mvStationBounds.values()).flat();
  const stationSightlines = config.nodes.flatMap(n => mvStationVisibility.get(n[0]) || []);
  function mvCameraBounds(id) {
    if (id) return mvStationBounds.get(id) || [];
    return stationCorners;
  }
  function mvCameraSafeRect() {
    const canvasRect = canvas.getBoundingClientRect(), w = canvasRect.width, h = canvasRect.height;
    const mx = Math.max(18, w * .025), my = Math.max(18, h * .025);
    let free = {
      left: mx,
      top: my,
      right: w - mx,
      bottom: h - my
    };
    for (const id of [ 'mvPanoramaHeading', 'controlsPanel', 'presentationPanel', 'mvAlerts', 'alertBar', 'notice' ]) {
      const el = $(id);
      if (!el || el.hidden || !el.getClientRects().length) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const box = {
        left: r.left - canvasRect.left - 14,
        top: r.top - canvasRect.top - 14,
        right: r.right - canvasRect.left + 14,
        bottom: r.bottom - canvasRect.top + 14
      };
      if (box.right <= free.left || box.left >= free.right || box.bottom <= free.top || box.top >= free.bottom) continue;
      const options = [ {
        ...free,
        right: Math.min(free.right, box.left)
      }, {
        ...free,
        left: Math.max(free.left, box.right)
      }, {
        ...free,
        bottom: Math.min(free.bottom, box.top)
      }, {
        ...free,
        top: Math.max(free.top, box.bottom)
      } ].filter(q => q.right - q.left >= 100 && q.bottom - q.top >= 100);
      if (options.length) free = options.reduce((a, b) => (a.right - a.left) * (a.bottom - a.top) >= (b.right - b.left) * (b.bottom - b.top) ? a : b);
    }
    return free;
  }
  function mvCameraPoints() {
    if (state.auto !== 'spin' && state.auto !== 'presentation') return mvCameraBounds();
    const time = mvCine.clock, routeEnd = MV_LAKE_SECONDS + MV_ROUTE_IDS.length * MV_STOP_SECONDS;
    if (time >= routeEnd) {
      const lake = mvCameraBounds('li00'), center = [ 0, 1, 2 ].map(axis => lake.reduce((sum, p) => sum + p[axis], 0) / lake.length);
      const weight = 1 - mvEase((time - routeEnd - 3) / Math.max(1, MV_RETURN_SECONDS - 3));
      return [ ...lake, ...mvCameraBounds('li04').map(p => p.map((v, axis) => center[axis] + (v - center[axis]) * weight)) ];
    }
    const index = time < MV_LAKE_SECONDS ? -1 : Math.min(MV_ROUTE_IDS.length - 1, Math.floor((time - MV_LAKE_SECONDS) / MV_STOP_SECONDS));
    const id = index < 0 ? 'li00' : MV_ROUTE_IDS[index];
    const local = index < 0 ? time : time - MV_LAKE_SECONDS - index * MV_STOP_SECONDS;
    const duration = index < 0 ? MV_LAKE_SECONDS : MV_STOP_SECONDS;
    const points = mvCameraBounds(id).slice();
    const center = [ 0, 1, 2 ].map(axis => points.reduce((sum, p) => sum + p[axis], 0) / Math.max(1, points.length));
    const add = (other, weight) => {
      if (weight > 0) for (const p of mvCameraBounds(other)) points.push(p.map((v, axis) => center[axis] + (v - center[axis]) * weight));
    };
    if (index > 0) add(MV_ROUTE_IDS[index - 1], 1 - mvEase((local - 3.1) / 2));
    add(index + 1 < MV_ROUTE_IDS.length ? MV_ROUTE_IDS[index + 1] : 'li00', mvEase((local - duration + 2) / 2));
    return points;
  }
  function mvFitCamera(eye, look, dt) {
    const points = mvCameraPoints();
    if (!points.length) return look;
    const free = mvCameraSafeRect(), w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    const x0 = free.left / w * 2 - 1, x1 = free.right / w * 2 - 1, y0 = 1 - free.bottom / h * 2, y1 = 1 - free.top / h * 2;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, sx = Math.max(.04, (x1 - x0) / 2), sy = Math.max(.04, (y1 - y0) / 2);
    const ty = Math.tan(Math.PI / 6.9), tx = ty * w / h;
    const center = [ 0, 1, 2 ].map(axis => (Math.min(...points.map(p => p[axis])) + Math.max(...points.map(p => p[axis]))) / 2);
    let back = norm(minus(eye, look)), target = [ ...look ];
    const frameMode = state.auto || 'overview';
    if (mvFrameMode !== frameMode) {
      mvFrameMode = frameMode;
      mvFrameDistance = 0;
    }
    const focus = state.auto === 'spin' || state.auto === 'presentation' ? config.nodes[Math.max(0, mvCine.index)]?.[0] : null;
    const visibilityPoints = focus ? mvStationVisibility.get(focus) || [] : stationSightlines;
    for (let pass = 0; pass < 6; pass++) {
      const right = norm(cross([ 0, 1, 0 ], back)), up = norm(cross(back, right));
      let rPlus = -Infinity, rMinus = Infinity, uPlus = -Infinity, uMinus = Infinity, maxNear = -Infinity;
      for (const p of points) {
        const offset = minus(p, center), z = dot(offset, back), x = dot(offset, right), y = dot(offset, up);
        rPlus = Math.max(rPlus, x + x1 * tx * z);
        rMinus = Math.min(rMinus, x + x0 * tx * z);
        uPlus = Math.max(uPlus, y + y1 * ty * z);
        uMinus = Math.min(uMinus, y + y0 * ty * z);
        maxNear = Math.max(maxNear, z);
      }
      let distance = Math.max(12, (rPlus - rMinus) / (2 * sx * tx), (uPlus - uMinus) / (2 * sy * ty), maxNear + 1) * 1.035;
      const zoom = state.auto === 'around' ? mvAround.zoom : state.auto ? mvAutoZoom : mvOverviewZoom;
      distance = Math.max(maxNear + 1, distance * Math.max(.45, Math.min(1.16, zoom)));
      if (pass === 0) {
        if (distance >= mvFrameDistance || !mvFrameDistance) mvFrameDistance = distance; else mvFrameDistance += (distance - mvFrameDistance) * (1 - Math.exp(-dt * 3));
      }
      distance = Math.max(distance, mvFrameDistance);
      const shiftR = (rPlus + rMinus) / 2 - cx * tx * distance, shiftU = (uPlus + uMinus) / 2 - cy * ty * distance;
      target = center.map((v, i) => v + right[i] * shiftR + up[i] * shiftU);
      for (let i = 0; i < 3; i++) eye[i] = target[i] + back[i] * distance;
      const previous = [ ...eye ];
      for (const point of visibilityPoints) keepCameraAboveTerrain(eye, point, true);
      if (Math.hypot(...minus(eye, previous)) < .01) return target;
      back = norm(minus(eye, target));
    }
    return target;
  }
  const sub = minus;
  const CAMERA_LIMITS = {
    minDist: 10,
    maxDist: 84,
    maxPitch: 1.48,
    panXMin: -50,
    panXMax: 58,
    panZMin: -24,
    panZMax: 26
  };
  const state = {
    yaw: 1.44,
    pitch: 1.2,
    dist: 79,
    target: [ 10, 1.5, 0 ],
    auto: '',
    mode: 'orbit',
    night: false,
    names: true,
    flowNames: true,
    levels: true,
    alerts: true,
    date: true,
    showInfo: true,
    water: true,
    speed: 1,
    spinFast: false,
    selected: null,
    paused: false,
    pt: 0,
    presIndex: 0,
    presDuration: 9.5,
    quality: 1.1,
    frameCount: 0,
    frameElapsed: 0
  };
  const labels = new Map, flowLabels = new Map;
  const sillaLabel = document.createElement('div');
  sillaLabel.className = 'world-sign linares-silla-sign';
  sillaLabel.textContent = 'CERRO DE LA SILLA';
  sillaLabel.style.pointerEvents = 'none';
  sillaLabel.setAttribute('aria-hidden', 'true');
  $('labels').appendChild(sillaLabel);
  const fmt = (value, dec = 2) => value === null || value === undefined || !Number.isFinite(Number(value)) ? 'N/D' : Number(value).toLocaleString('es-MX', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec
  });
  const getData = n => n[5] ? live.get(n[5]) || null : null;
  for (const n of config.nodes) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'world-sign';
    b.setAttribute('aria-label', 'Información de ' + n[1]);
    const name = document.createElement('strong');
    name.textContent = n[1];
    b.appendChild(name);
    b.addEventListener('click', () => selectNode(n[0]));
    $('labels').appendChild(b);
    labels.set(n[0], {
      el: b
    });
    if (n[2] === 'meter') {
      const f = document.createElement('div');
      f.className = 'flow-sign';
      const title = document.createElement('span');
      title.textContent = 'FLUJO';
      const value = document.createElement('strong');
      value.textContent = 'N/D';
      f.append(title, value);
      $('labels').appendChild(f);
      flowLabels.set(n[0], {
        el: f,
        value: value
      });
    }
  }
  const garrapatasLevel = document.createElement('div');
  garrapatasLevel.className = 'linares-tank-face-reading';
  garrapatasLevel.style.cssText = 'position:absolute;transform:translate(-50%,-50%);padding:5px 9px;min-width:57px;text-align:center;background:rgba(30,49,56,.94);color:#fff;border:1px solid #91a6af;border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,.28);font:500 14px/1.3 Arial,sans-serif;white-space:nowrap;pointer-events:none;z-index:2;font-variant-numeric:tabular-nums';
  garrapatasLevel.textContent = 'N/D';
  $('labels').appendChild(garrapatasLevel);
  const proj = (fovy, aspect, near, far) => {
    const f = 1 / Math.tan(fovy / 2);
    return [ f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0 ];
  };
  const view = (eye, target) => {
    const z = norm(sub(eye, target)), x = norm(cross([ 0, 1, 0 ], z)), y = cross(z, x);
    return [ x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -x[0] * eye[0] - x[1] * eye[1] - x[2] * eye[2], -y[0] * eye[0] - y[1] * eye[1] - y[2] * eye[2], -z[0] * eye[0] - z[1] * eye[1] - z[2] * eye[2], 1 ];
  };
  const mul = (a, b) => {
    const m = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      m[c * 4 + r] = s;
    }
    return m;
  };
  const project = (p, m, w, h) => {
    const x = p[0], y = p[1], z = p[2], q = m[3] * x + m[7] * y + m[11] * z + m[15];
    if (q <= .05) return null;
    const px = (m[0] * x + m[4] * y + m[8] * z + m[12]) / q, py = (m[1] * x + m[5] * y + m[9] * z + m[13]) / q;
    if (Math.abs(px) > 1.13 || Math.abs(py) > 1.13) return null;
    return [ (px * .5 + .5) * w, (-py * .5 + .5) * h, q ];
  };
  const presentation = $('presentationPanel');
  let mvAlertReposition = () => {};
  let mvPresentationRate = 1;
  const mvPresentationStyle = document.createElement('style');
  mvPresentationStyle.textContent = `\n    #presentationPanel:not([hidden]){position:fixed!important;top:12px!important;right:12px!important;left:auto!important;bottom:auto!important;transform:none!important;box-sizing:border-box!important;width:min(488px,calc(100vw - 24px))!important;max-width:calc(100vw - 24px)!important;max-height:calc(100dvh - 24px)!important;height:auto!important;min-height:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;z-index:97!important}\n    #presentationPanel .presentation-head,#presentationPanel .presentation-progress-track{flex:0 0 auto!important}\n    #presentationPanel .presentation-content{flex:0 1 auto!important;min-height:0!important;max-height:none!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain!important}\n    #presentationPanel .presentation-actions{display:flex!important;flex:0 0 auto!important;flex-wrap:nowrap!important;position:relative!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;min-width:0!important;padding:8px 12px!important;margin:0!important;background:#fff!important}\n    #presentationPanel .presentation-actions #presentationOptions{flex:0 0 37px!important;min-width:37px!important;width:37px!important;max-width:37px!important;min-height:35px!important;margin:0 auto 0 0!important;padding:0!important;text-align:center!important;font-size:22px!important;line-height:1!important}\n    #presentationPanel .presentation-actions #presentationClose{flex:0 0 78px!important;min-width:78px!important;width:78px!important;min-height:35px!important;margin:0!important}\n    #presentationPanel #presentationMore{position:relative!important;inset:auto!important;order:initial!important;display:grid!important;flex:0 0 auto!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-auto-flow:row!important;gap:7px 8px!important;align-items:stretch!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;padding:5px 12px 11px!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;transform:none!important;background:#fff!important;visibility:visible!important;opacity:1!important;overflow:hidden!important}\n    #presentationPanel #presentationMore[hidden]{display:none!important}\n    #presentationPanel #presentationMore>button{box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;min-width:0!important;max-width:100%!important;width:100%!important;min-height:37px!important;margin:0!important;padding:6px 8px!important;border:1px solid #bdcbd3!important;border-radius:4px!important;background:#f7f9fa!important;color:#1d333e!important;font:400 13px/1.25 Arial,sans-serif!important;text-align:center!important;white-space:normal!important;overflow-wrap:anywhere!important;cursor:pointer!important}\n    #presentationPanel #presentationMore>button:hover{background:#eaf0f3!important}\n    #presentationPanel #presentationMore>button:focus-visible{outline:2px solid #0058b7!important;outline-offset:1px!important}\n    #presentationPanel.mv-linares-controls-open:not([hidden]){max-height:calc(100dvh - 24px)!important;height:auto!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}\n    #presentationPanel.mv-linares-controls-open .presentation-content{flex:0 1 auto!important;min-height:0!important;overflow-y:auto!important}\n    #labels .linares-silla-sign{font:600 13px/1.2 Arial,sans-serif!important;min-width:150px!important;max-width:210px!important;padding:8px 12px!important;background:rgba(78,107,121,.97)!important;border:1px solid #bfd3d9!important;box-shadow:0 3px 8px rgba(0,0,0,.30)!important;color:#fff!important;text-shadow:0 1px 2px #0006!important;pointer-events:none!important;z-index:4!important;white-space:nowrap!important}\n    #labels .linares-silla-sign[hidden]{display:none!important}\n    @media(max-width:700px){#presentationPanel:not([hidden]){top:8px!important;right:8px!important;left:auto!important;width:min(488px,calc(100vw - 16px))!important;max-width:calc(100vw - 16px)!important;max-height:calc(100dvh - 16px)!important}#presentationPanel #presentationMore{padding:5px 9px 9px!important}}\n    @media(max-height:530px){#presentationPanel:not([hidden]){top:7px!important;right:7px!important;max-height:calc(100dvh - 14px)!important}#presentationPanel #presentationMore>button{min-height:31px!important}#presentationPanel #presentationMore{gap:5px 7px!important;padding:4px 9px 6px!important}}\n  `;
  document.head.appendChild(mvPresentationStyle);
  const syncButtons = () => {
    for (const id of [ 'spin', 'around', 'free', 'presentationToggle' ]) $(id).classList.toggle('active', id === 'presentationToggle' ? state.auto === 'presentation' : id === 'free' ? state.mode === 'pan' : state.auto === id);
    for (const [id, value] of [ [ 'water', state.water ], [ 'flowLabelsToggle', state.flowNames ], [ 'levelsToggle', state.levels ], [ 'labelsToggle', state.names ], [ 'alertsToggle', state.alerts ], [ 'dateToggle', state.date ] ]) $(id).classList.toggle('active', value);
    $('modeToggle').textContent = state.night ? 'Modo noche' : 'Modo día';
    $('flowSpeed').textContent = 'Velocidad visual ×' + state.speed;
    $('hideInfo').textContent = state.showInfo ? 'Ocultar información' : 'Mostrar información';
    document.body.classList.toggle('night', state.night);
    document.body.classList.toggle('presentation-on', state.auto === 'presentation');
  };
  const showPanel = (show = true) => {
    presentation.hidden = !show || !state.showInfo;
    mvAlertReposition();
  };
  function selectNode(id) {
    const entry = nodeById.get(id);
    if (!entry) return;
    state.selected = id;
    const n = entry.data;
    updatePanel(n);
    showPanel();
    for (const [key, val] of labels) val.el.classList.toggle('selected', key === id);
    loadHistory(n);
    mvAlertReposition();
  }
  function updatePanel(n) {
    if (!n) return;
    const s = getData(n), idx = config.nodes.indexOf(n), kind = n[2];
    $('presentationStep').textContent = 'INSTALACIÓN ' + (idx + 1) + ' DE ' + config.nodes.length;
    $('presentationName').textContent = n[1];
    const hasLevel = !!s && Number.isFinite(Number(s.level)) && s.level !== null;
    const hasFlow = !!s && Number.isFinite(Number(s.flow)) && s.flow !== null;
    const isTank = kind === 'tank';
    const isReference = !n[5];
    $('primaryLabel').textContent = isTank || hasLevel ? 'Nivel actual' : kind === 'pump' ? 'Flujo de salida' : kind === 'meter' ? 'Flujo medido' : 'Referencia';
    $('primaryValue').textContent = isTank || hasLevel ? hasLevel ? fmt(s.level) + (kind === 'reservoir' ? ' msnm' : ' m') : 'N/D' : hasFlow ? fmt(s.flow, 0) + ' LPS' : 'N/D';
    if (kind === 'reservoir') {
      const pc = s && Array.isArray(s.extra) ? s.extra.find(q => q && q.unit === '%') : null;
      if (hasLevel) $('primaryLabel').textContent = 'Elevación'; else if (pc) {
        $('primaryLabel').textContent = 'Llenado';
        $('primaryValue').textContent = fmt(pc.value, 2) + ' %';
      }
    }
    $('flowValue').textContent = hasFlow ? fmt(s.flow, 0) + ' LPS' : 'N/D';
    $('stateValue').textContent = isReference ? 'Sin lectura' : !s || s.status === 'sin_datos' ? 'Sin datos' : s.status === 'sin_comunicacion' ? 'Sin comunicación' : s.observation ? 'Observación' : 'Actual';
    $('lastReading').textContent = s && s.updated ? 'Actualización: ' + s.updated : isReference ? 'Referencia hidráulica · sin sensor asociado' : 'Sin actualización';
    $('pumpSection').hidden = kind !== 'pump';
    $('pumpList').replaceChildren();
    if (kind === 'pump') {
      const index = casetaLightById.get(n[0]), count = index === undefined ? 0 : casetaCounts[index];
      for (let i = 0; i < count; i++) {
        const p = s && Array.isArray(s.pumps) ? s.pumps[i] : null;
        const chip = document.createElement('span');
        chip.className = p && typeof p.on === 'boolean' ? p.on ? 'on' : 'off' : 'unavailable';
        chip.textContent = 'EQ' + (i + 1) + (p && typeof p.on === 'boolean' ? p.on ? ' · Operando' : ' · Inactivo' : ' · Sin dato');
        $('pumpList').appendChild(chip);
      }
    }
    $('flowSection').hidden = !(hasLevel && hasFlow);
    const details = $('secondaryReadings');
    details.replaceChildren();
    const items = s && Array.isArray(s.extra) ? s.extra : [];
    for (const item of items) {
      if (!item || item.value === null || !Number.isFinite(Number(item.value))) continue;
      const row = document.createElement('div');
      row.className = 'linares-detail-row';
      const name = document.createElement('span');
      name.textContent = item.label;
      const value = document.createElement('strong');
      value.textContent = fmt(item.value, item.unit === 'kg/cm²' || item.unit === 'Mm³' ? 2 : item.unit === '%' ? 1 : 0) + ' ' + (item.unit || '');
      row.append(name, value);
      details.appendChild(row);
    }
    details.hidden = !details.childElementCount;
  }
  let historyRequest = 0, history = [], mvHistNode = null;
  async function loadHistory(n) {
    const request = ++historyRequest;
    if (mvHistNode !== n[0]) {
      history = [];
      $('graphSection').hidden = true;
    }
    mvHistNode = n[0];
    const code = n[5];
    if (!code) return;
    try {
      const resp = await fetch('/Telemetria/php/linares_3d_historial.php?codigo=' + encodeURIComponent(code) + '&horas=6', {
        cache: 'no-store'
      });
      if (!resp.ok) return;
      const obj = await resp.json();
      if (request !== historyRequest || state.selected !== n[0]) return;
      const key = n[2] === 'tank' || n[2] === 'reservoir' ? 'level' : 'flow';
      history = Array.isArray(obj[key]) ? obj[key] : [];
      if (history.length >= 2) {
        $('graphTitle').textContent = key === 'flow' ? 'FLUJO' : 'NIVEL';
        $('graphValue').textContent = history.length ? fmt(history[history.length - 1][1]) + (key === 'flow' ? ' LPS' : ' m') : '';
        $('graphSection').hidden = false;
        drawChart();
      }
    } catch (e) {}
  }
  function drawChart() {
    const el = $('graph');
    if ($('graphSection').hidden || history.length < 2) return;
    const rect = el.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(230, rect.width), h = Math.max(150, rect.height);
    el.width = Math.round(w * dpr);
    el.height = Math.round(h * dpr);
    const ctx = el.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const data = history.filter(v => Number.isFinite(v[0]) && Number.isFinite(v[1]));
    if (data.length < 2) return;
    const isFlow = $('graphTitle').textContent === 'FLUJO', color = isFlow ? '#4f5b66' : '#0058b7', dec = isFlow ? 0 : 2;
    const minX = data[0][0], maxX = data[data.length - 1][0] || minX + 1, vs = data.map(p => p[1]), minY = Math.min(...vs), maxY = Math.max(...vs);
    const span = Math.max(isFlow ? 4 : .1, maxY - minY), lo = Math.max(0, minY - span * .2), hi = maxY + span * .2;
    const L = 46, R = w - 50, T = 8, B = h - 24;
    const px = p => L + (p[0] - minX) / Math.max(1, maxX - minX) * (R - L), py = p => B - (p[1] - lo) / Math.max(1e-6, hi - lo) * (B - T);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(L, T, R - L, B - T);
    ctx.font = '10px "Segoe UI",Arial';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = Math.round(T + i * (B - T) / 4) + .5;
      if (i > 0 && i < 4) {
        ctx.strokeStyle = '#e9eef2';
        ctx.beginPath();
        ctx.moveTo(L, y);
        ctx.lineTo(R, y);
        ctx.stroke();
      }
      ctx.strokeStyle = '#8a98a5';
      ctx.beginPath();
      ctx.moveTo(L - 4, y);
      ctx.lineTo(L, y);
      ctx.stroke();
      ctx.fillStyle = '#3d4852';
      ctx.textAlign = 'right';
      ctx.fillText(fmt(hi - (hi - lo) * i / 4, dec), L - 7, y + 3.5);
    }
    for (let i = 0; i <= 6; i++) {
      const x = Math.round(L + i * (R - L) / 6) + .5;
      if (i > 0 && i < 6) {
        ctx.strokeStyle = '#f0f3f6';
        ctx.beginPath();
        ctx.moveTo(x, T);
        ctx.lineTo(x, B);
        ctx.stroke();
      }
      ctx.strokeStyle = '#8a98a5';
      ctx.beginPath();
      ctx.moveTo(x, B);
      ctx.lineTo(x, B + 4);
      ctx.stroke();
      if (i % 2 === 0) {
        const d = new Date(minX + i * (maxX - minX) / 6);
        ctx.fillStyle = '#3d4852';
        ctx.textAlign = i === 0 ? 'left' : i === 6 ? 'right' : 'center';
        ctx.fillText(d.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }), x, h - 6);
      }
    }
    ctx.strokeStyle = '#c3ccd4';
    ctx.strokeRect(L + .5, T + .5, R - L - 1, B - T - 1);
    ctx.beginPath();
    ctx.moveTo(px(data[0]), B);
    for (const p of data) ctx.lineTo(px(p), py(p));
    ctx.lineTo(px(data[data.length - 1]), B);
    ctx.closePath();
    ctx.globalAlpha = .07;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    data.forEach((p, i) => i ? ctx.lineTo(px(p), py(p)) : ctx.moveTo(px(p), py(p)));
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.7;
    ctx.lineJoin = 'miter';
    ctx.stroke();
    if (data.length <= 90) {
      ctx.lineWidth = 1.2;
      for (const p of data) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px(p) - 2, py(p) - 2, 4, 4);
        ctx.strokeStyle = color;
        ctx.strokeRect(px(p) - 2, py(p) - 2, 4, 4);
      }
    }
    const last = data[data.length - 1], lx = px(last), ly = py(last), tag = fmt(last[1], dec), tw = Math.max(40, ctx.measureText(tag).width + 12), ty = Math.min(B - 8, Math.max(T + 8, ly));
    ctx.setLineDash([ 3, 2 ]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(R, ly);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(R, ty);
    ctx.lineTo(R + 5, ty - 8);
    ctx.lineTo(R + 5 + tw, ty - 8);
    ctx.lineTo(R + 5 + tw, ty + 8);
    ctx.lineTo(R + 5, ty + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 10px "Segoe UI",Arial';
    ctx.textAlign = 'center';
    ctx.fillText(tag, R + 5 + tw / 2, ty + 3.6);
    ctx.fillStyle = color;
    ctx.fillRect(lx - 3, ly - 3, 6, 6);
    ctx.textAlign = 'left';
    $('graphLatest').textContent = 'Última ' + new Date(maxX).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
  function alertsRefresh() {
    const alerts = [];
    for (const n of config.nodes) {
      const s = getData(n);
      if (!s) continue;
      if (s.status === 'sin_comunicacion') alerts.push({
        id: n[0],
        name: n[1],
        type: 'Sin comunicación'
      }); else if (s.observation) alerts.push({
        id: n[0],
        name: n[1],
        type: 'Nivel fuera de parámetros'
      });
    }
    const bar = $('alertBar');
    bar.hidden = !state.alerts || !alerts.length;
    $('alertCount').hidden = !alerts.length;
    $('alertCount').textContent = alerts.length;
    $('alertSummary').textContent = alerts.length ? alerts[0].name + '   ' + alerts[0].type : '';
    $('alertsList').replaceChildren();
    for (const a of alerts) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = a.name + ' · ' + a.type;
      b.onclick = () => {
        selectNode(a.id);
        $('alertsList').hidden = true;
      };
      $('alertsList').appendChild(b);
    }
  }
  function updateData() {
    updateWaterLevels();
    const g = live.get('TGRP0001');
    const level = g && g.level !== null && Number.isFinite(Number(g.level)) ? Number(g.level) : null;
    garrapatasLevel.textContent = level === null ? 'N/D' : fmt(level) + ' m';
    garrapatasLevel.title = level === null ? 'Sin lectura válida de Garrapatas' : 'Nivel de Garrapatas' + (g.updated ? ' · ' + g.updated : '');
    for (const n of config.nodes) {
      const f = flowLabels.get(n[0]);
      if (f) {
        const s = getData(n);
        f.value.textContent = s && s.flow != null ? fmt(s.flow, 0) + ' LPS' : 'N/D';
      }
    }
    {
      const l = labels.get('li00'), pr = live.get('PRESACP');
      if (l) {
        let v = l.el.querySelector('.sign-value');
        if (!v) {
          v = document.createElement('span');
          v.className = 'sign-value';
          l.el.appendChild(v);
        }
        const pct = pr && Array.isArray(pr.extra) ? pr.extra.find(q => q && q.unit === '%') : null;
        const parts = [];
        if (pr && pr.level !== null && Number.isFinite(Number(pr.level))) parts.push(fmt(pr.level) + ' msnm');
        if (pct && Number.isFinite(Number(pct.value))) parts.push(fmt(pct.value, 1) + ' %');
        v.textContent = parts.length ? parts.join(' · ') : 'N/D';
      }
    }
    if (state.selected) updatePanel(nodeById.get(state.selected).data);
    alertsRefresh();
  }
  let retrieving = false;
  async function loadData() {
    if (retrieving) return;
    retrieving = true;
    try {
      const mvCtl = new AbortController, mvTo = setTimeout(() => mvCtl.abort(), 8e3);
      const r = await fetch('/Telemetria/php/linares_3d_datos.php?t=' + Date.now(), {
        cache: 'no-store',
        signal: mvCtl.signal
      }).finally(() => clearTimeout(mvTo));
      if (!r.ok) throw Error('Error HTTP');
      const obj = await r.json();
      if (!obj.items) throw Error('Datos incompletos');
      live.clear();
      for (const [code, item] of Object.entries(obj.items)) live.set(code, item);
      refreshPipeLevels(obj.items);
      updateData();
      $('notice').hidden = true;
    } catch (e) {
      refreshPipeLevels(null);
      live.clear();
      updateData();
      $('notice').textContent = 'Sin conexión con lecturas de Linares';
      $('notice').hidden = false;
    } finally {
      retrieving = false;
    }
  }
  function reset() {
    mvOverviewFit = true;
    mvOverviewZoom = 1;
    mvAutoZoom = 1;
    mvFrameDistance = 0;
    state.yaw = 1.44;
    state.pitch = 1.2;
    state.dist = 79;
    state.target = [ 10, 1.5, 0 ];
    state.auto = '';
    state.mode = 'orbit';
    state.selected = null;
    showPanel(false);
    syncButtons();
  }
  function startPresentation() {
    mvAutoZoom = 1;
    state.auto = 'presentation';
    state.pt = 0;
    state.presIndex = 0;
    state.paused = false;
    state.showInfo = true;
    $('presentationPause').textContent = 'Pausar';
    mvResetCinematic();
    selectNode(config.nodes[0][0]);
    showPanel();
    syncButtons();
    mvAlertReposition();
  }
  function endPresentation() {
    state.auto = '';
    state.paused = false;
    state.selected = null;
    showPanel(false);
    presentation.classList.remove('mv-linares-controls-open');
    $('presentationMore').hidden = true;
    $('presentationOptions').setAttribute('aria-expanded', 'false');
    syncButtons();
    mvAlertReposition();
  }
  function jumpPresentation(delta) {
    state.presIndex = (state.presIndex + delta + config.nodes.length) % config.nodes.length;
    mvCine.clock = state.presIndex === 0 ? 0 : MV_LAKE_SECONDS + (state.presIndex - 1) * MV_STOP_SECONDS + .2;
    mvCine.index = state.presIndex;
    state.pt = 0;
    state.paused = false;
    $('presentationPause').textContent = 'Pausar';
    selectNode(config.nodes[state.presIndex][0]);
    $('presentationProgress').style.width = '0%';
  }
  $('reset').onclick = reset;
  $('top').onclick = () => {
    mvOverviewFit = true;
    mvFrameDistance = 0;
    state.auto = '';
    state.pitch = .24;
    state.yaw = 1.56;
    state.dist = 82;
    state.target = [ 0, 1.5, 0 ];
    syncButtons();
  };
  $('zoomIn').onclick = () => state.dist = Math.max(CAMERA_LIMITS.minDist, state.dist * .8);
  $('zoomOut').onclick = () => state.dist = Math.min(CAMERA_LIMITS.maxDist, state.dist * 1.2);
  $('full').onclick = () => document.fullscreenElement ? document.exitFullscreen?.() : document.documentElement.requestFullscreen?.();
  $('spin').onclick = () => {
    state.auto = state.auto === 'spin' ? '' : 'spin';
    syncButtons();
  };
  $('spinSpeed').onclick = () => {
    state.spinFast = !state.spinFast;
    syncButtons();
  };
  $('around').onclick = () => {
    state.auto = state.auto === 'around' ? '' : 'around';
    syncButtons();
  };
  $('free').onclick = () => {
    state.auto = '';
    state.mode = state.mode === 'pan' ? 'orbit' : 'pan';
    syncButtons();
  };
  $('presentationToggle').onclick = () => state.auto === 'presentation' ? endPresentation() : startPresentation();
  $('hideInfo').onclick = () => {
    state.showInfo = !state.showInfo;
    showPanel(state.selected !== null);
    syncButtons();
  };
  $('water').onclick = () => {
    state.water = !state.water;
    syncButtons();
  };
  $('flowSpeed').onclick = () => {
    state.speed = state.speed === 1 ? 2 : state.speed === 2 ? 3 : 1;
    syncButtons();
  };
  $('flowLabelsToggle').onclick = () => {
    state.flowNames = !state.flowNames;
    syncButtons();
  };
  $('levelsToggle').onclick = () => {
    state.levels = !state.levels;
    updateData();
    syncButtons();
  };
  $('labelsToggle').onclick = () => {
    state.names = !state.names;
    syncButtons();
  };
  $('alertsToggle').onclick = () => {
    state.alerts = !state.alerts;
    alertsRefresh();
    syncButtons();
    mvAlertReposition();
  };
  $('dateToggle').onclick = () => {
    state.date = !state.date;
    $('clockText').hidden = !state.date;
    syncButtons();
  };
  $('modeToggle').onclick = () => {
    state.night = !state.night;
    syncButtons();
  };
  $('controlsToggle').onclick = () => {
    const panel = $('controlsPanel');
    const next = panel.hidden;
    panel.hidden = !next;
    panel.classList.toggle('is-open', next);
    panel.setAttribute('aria-hidden', String(!next));
    $('controlsToggle').setAttribute('aria-expanded', String(next));
    $('controlsToggle').setAttribute('aria-label', next ? 'Ocultar controles' : 'Mostrar controles');
    const footer = $('mvPanoramaHeading');
    if (footer) {
      footer.classList.toggle('is-open', next);
      footer.setAttribute('aria-expanded', String(next));
    }
  };
  $('presentationClose').onclick = endPresentation;
  const mvPresentationMore = $('presentationMore');
  const mvPresentationMenu = $('presentationOptions');
  presentation.appendChild(mvPresentationMore);
  mvPresentationMore.setAttribute('aria-label', 'Controles adicionales de presentación');
  const mvPresentationSpeed = document.createElement('button');
  mvPresentationSpeed.id = 'mvLinaresPresentationSpeed';
  mvPresentationSpeed.type = 'button';
  mvPresentationSpeed.textContent = 'Vel.: Normal';
  mvPresentationSpeed.title = 'Cambiar velocidad de presentación';
  mvPresentationSpeed.setAttribute('aria-pressed', 'false');
  mvPresentationMore.appendChild(mvPresentationSpeed);
  mvPresentationSpeed.onclick = () => {
    mvPresentationRate = mvPresentationRate === 1 ? 1.6 : 1;
    const fast = mvPresentationRate > 1;
    mvPresentationSpeed.textContent = fast ? 'Vel.: Rápida' : 'Vel.: Normal';
    mvPresentationSpeed.setAttribute('aria-pressed', String(fast));
  };
  $('presentationPrev').textContent = '◀ Anterior';
  $('presentationNext').textContent = 'Siguiente ▶';
  mvPresentationMenu.textContent = '⋯';
  mvPresentationMenu.setAttribute('aria-controls', 'presentationMore');
  mvPresentationMenu.title = 'Mostrar controles y velocidad';
  mvPresentationMenu.setAttribute('aria-expanded', 'false');
  mvPresentationMenu.setAttribute('aria-label', 'Mostrar controles de presentación');
  mvPresentationMenu.onclick = () => {
    const open = mvPresentationMore.hidden;
    mvPresentationMore.hidden = !open;
    presentation.classList.toggle('mv-linares-controls-open', open);
    mvPresentationMenu.setAttribute('aria-expanded', String(open));
    mvPresentationMenu.setAttribute('aria-label', open ? 'Ocultar controles de presentación' : 'Mostrar controles de presentación');
    mvAlertReposition();
  };
  $('presentationPrev').onclick = () => jumpPresentation(-1);
  $('presentationNext').onclick = () => jumpPresentation(1);
  $('presentationPause').onclick = () => {
    state.paused = !state.paused;
    $('presentationPause').textContent = state.paused ? 'Continuar' : 'Pausar';
  };
  $('alertsAll').onclick = () => {
    $('alertsList').hidden = !$('alertsList').hidden;
    $('alertsAll').setAttribute('aria-expanded', String(!$('alertsList').hidden));
  };
  let mvZoomGoal = null, mvFree = false, mvFreeMode = 'move';
  const mvTour = {
    rate: 1
  };
  const mvAround = {
    elapsed: 0,
    zoom: 1,
    pitch: 1.02,
    yaw0: 1.44,
    phase: 0
  };
  const MV_CENTER = [ 0, 1, 2 ].map(axis => {
    const points = mvCameraBounds();
    return (Math.min(...points.map(p => p[axis])) + Math.max(...points.map(p => p[axis]))) / 2;
  });
  const MV_AROUND_PATH = [ ...[ 'li04', 'li05', 'li04a', 'li03', 'li02a', 'li02', 'li01' ].map(id => config.nodes.find(n => n[0] === id)).filter(Boolean).map(n => [ n[3], n[4] ]), [ lakeCenter[0] - 6, lakeCenter[1] ] ];
  const MV_AROUND_LEN = (() => {
    const L = [ 0 ];
    for (let i = 1; i < MV_AROUND_PATH.length; i++) L.push(L[i - 1] + Math.hypot(MV_AROUND_PATH[i][0] - MV_AROUND_PATH[i - 1][0], MV_AROUND_PATH[i][1] - MV_AROUND_PATH[i - 1][1]));
    return L;
  })();
  function mvAroundTargetAt(d) {
    let i = 0;
    while (i < MV_AROUND_LEN.length - 2 && MV_AROUND_LEN[i + 1] < d) i++;
    const f = (d - MV_AROUND_LEN[i]) / Math.max(.001, MV_AROUND_LEN[i + 1] - MV_AROUND_LEN[i]), a = MV_AROUND_PATH[i], b = MV_AROUND_PATH[i + 1];
    return [ a[0] + (b[0] - a[0]) * f, 2, a[1] + (b[1] - a[1]) * f ];
  }
  function mvAroundTarget(e) {
    return mvAroundTargetAt((.5 - .5 * Math.cos(e * .034 + mvAround.phase)) * MV_AROUND_LEN[MV_AROUND_LEN.length - 1]);
  }
  const MV_LAKE_SECONDS = 22;
  const MV_STOP_SECONDS = 9;
  const MV_RETURN_SECONDS = 9;
  const MV_ROUTE_IDS = [ 'li01', 'li02', 'li02a', 'li03', 'li04a', 'li05', 'li04' ];
  const MV_CYCLE_SECONDS = MV_LAKE_SECONDS + MV_ROUTE_IDS.length * MV_STOP_SECONDS + MV_RETURN_SECONDS;
  const mvCine = {
    clock: 0,
    index: -1,
    eye: null,
    look: null
  };
  const mvMix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const mvEase = t => {
    const k = Math.max(0, Math.min(1, t));
    return k * k * (3 - 2 * k);
  };
  const mvSetPose = (eye, look) => {
    const dx = eye[0] - look[0], dy = eye[1] - look[1], dz = eye[2] - look[2], d = Math.max(.5, Math.hypot(dx, dy, dz));
    state.target = [ ...look ];
    state.dist = d;
    state.yaw = Math.atan2(dz, dx);
    state.pitch = Math.acos(Math.max(-1, Math.min(1, dy / d)));
  };
  function mvNodePose(id) {
    const n = pointNodes.get(id);
    if (!n) return {
      eye: [ 46, 16, 35 ],
      look: [ 39, 2.6, 5.2 ]
    };
    const pump = n[2] === 'pump', tank = n[2] === 'tank';
    const height = pump ? 3 : tank ? 2.7 : 1.75;
    const angle = tank ? 0 : mvNodeAngle.get(id) || 0, c = Math.cos(angle), s = Math.sin(angle);
    if (tank) return {
      eye: [ n[3] - 15, 13.5, n[4] + 19 ],
      look: [ n[3], 1.2, n[4] ]
    };
    return {
      eye: [ n[3] + 8 * c - 24.8 * s, pump ? 15.6 : 12.8, n[4] + 8 * s + 24.8 * c ],
      look: [ n[3], height, n[4] + .2 ]
    };
  }
  function mvLakePose(t) {
    const cx = lakeCenter[0], cz = lakeCenter[1], pb1 = pointNodes.get('li01') || [ 0, 0, 0, 39, 5.2 ];
    const K = [ {
      e: [ cx - 30, 26, cz + 40 ],
      l: [ cx, .5, cz ]
    }, {
      e: [ cx - 6, 14, cz + 33 ],
      l: [ cx + 2, .5, cz - 2 ]
    }, {
      e: [ cx + 17, 7.5, cz + 15 ],
      l: [ cx - 10, .8, cz + 2 ]
    }, {
      e: [ cx - 3, 5.6, cz + 11 ],
      l: [ cx - 25, 2, cz - 1 ]
    }, {
      e: [ cx - 17, 9, cz + 15 ],
      l: [ pb1[3], 3, pb1[4] ]
    } ];
    const u = Math.max(0, Math.min(1, t)) * (K.length - 1), i = Math.min(K.length - 2, Math.floor(u)), f = u - i;
    const cr = key => [ 0, 1, 2 ].map(a => {
      const p0 = K[Math.max(0, i - 1)][key][a], p1 = K[i][key][a], p2 = K[i + 1][key][a], p3 = K[Math.min(K.length - 1, i + 2)][key][a];
      return .5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
    });
    return {
      eye: cr('e'),
      look: cr('l')
    };
  }
  function mvCineFreeWeight() {
    if (state.auto !== 'spin') return 0;
    const t = mvCine.clock;
    return t < MV_LAKE_SECONDS ? mvEase(t / 2.5) : 1 - mvEase((t - MV_LAKE_SECONDS) / 3.1);
  }
  function mvCinePose(time) {
    if (time < MV_LAKE_SECONDS) {
      const p = time / MV_LAKE_SECONDS;
      return {
        ...state.auto === 'presentation' ? mvLakePose(.1 * p) : mvLakePose(.5 * p + .5 * mvEase(p)),
        index: 0,
        progress: p
      };
    }
    const routeEnd = MV_LAKE_SECONDS + MV_ROUTE_IDS.length * MV_STOP_SECONDS;
    if (time < routeEnd) {
      const elapsed = time - MV_LAKE_SECONDS;
      const index = Math.min(MV_ROUTE_IDS.length - 1, Math.floor(elapsed / MV_STOP_SECONDS));
      const local = elapsed - index * MV_STOP_SECONDS;
      const target = mvNodePose(MV_ROUTE_IDS[index]);
      const previous = index ? mvNodePose(MV_ROUTE_IDS[index - 1]) : mvLakePose(1);
      const mix = mvEase(local / 3.1);
      return {
        eye: mvMix(previous.eye, target.eye, mix),
        look: mvMix(previous.look, target.look, mix),
        index: index + 1,
        progress: local / MV_STOP_SECONDS
      };
    }
    const k = mvEase((time - routeEnd) / MV_RETURN_SECONDS);
    const a = mvNodePose(MV_ROUTE_IDS[MV_ROUTE_IDS.length - 1]);
    const b = mvLakePose(0);
    const eye = mvMix(a.eye, b.eye, k);
    eye[2] += 7 * Math.sin(Math.PI * k);
    return {
      eye: eye,
      look: mvMix(a.look, b.look, k),
      index: time - routeEnd < 3 ? 7 : 0,
      progress: k
    };
  }
  function mvResetCinematic() {
    mvCine.clock = 0;
    mvCine.index = -1;
    const sn = Math.sin(state.pitch);
    mvCine.eye = [ state.target[0] + Math.cos(state.yaw) * state.dist * sn, state.target[1] + Math.cos(state.pitch) * state.dist, state.target[2] + Math.sin(state.yaw) * state.dist * sn ];
    mvCine.look = [ ...state.target ];
  }
  function mvStopAll() {
    if (state.auto === 'presentation') endPresentation();
    state.auto = '';
    syncButtons();
    mvSyncNav();
  }
  function mvStartTour() {
    mvAutoZoom = 1;
    mvSetFree(false);
    if (state.auto === 'presentation') endPresentation();
    mvResetCinematic();
    state.auto = 'spin';
    syncButtons();
    mvSyncNav();
  }
  function mvStartAround() {
    mvSetFree(false);
    if (state.auto === 'presentation') endPresentation();
    mvLeaveOverview();
    mvOverviewFit = false;
    mvFrameDistance = 0;
    mvAround.elapsed = 0;
    mvAround.zoom = 1;
    mvAround.pitch = 1.02;
    {
      const y = Math.atan2(Math.sin(state.yaw), Math.cos(state.yaw));
      mvAround.yaw0 = Math.asin(Math.max(-1, Math.min(1, (y - 1.5) / 1)));
    }
    {
      const t = state.target, P = MV_AROUND_PATH, total = MV_AROUND_LEN[MV_AROUND_LEN.length - 1];
      let best = 0, bd = 1e9;
      for (let k = 0; k <= 40; k++) {
        const q = mvAroundTargetAt(k / 40 * total);
        const dd = Math.hypot(q[0] - t[0], q[2] - t[2]);
        if (dd < bd) {
          bd = dd;
          best = k / 40;
        }
      }
      mvAround.phase = Math.acos(Math.max(-1, Math.min(1, 1 - 2 * best)));
    }
    state.auto = 'around';
    syncButtons();
    mvSyncNav();
  }
  function mvTickNav(dt) {
    if (state.auto === 'spin' || state.auto === 'presentation') {
      const playing = state.auto !== 'presentation' || !state.paused;
      if (playing) mvCine.clock = (mvCine.clock + dt * (state.auto === 'spin' ? mvTour.rate : mvPresentationRate)) % MV_CYCLE_SECONDS;
      const pose = mvCinePose(mvCine.clock);
      if (mvCine.index !== pose.index) {
        mvCine.index = pose.index;
        if (state.auto === 'presentation') {
          state.presIndex = pose.index;
          selectNode(config.nodes[pose.index][0]);
        }
      }
      if (state.auto === 'presentation') {
        state.pt = pose.progress * state.presDuration;
        $('presentationProgress').style.width = (pose.progress * 100).toFixed(2) + '%';
      }
      const ease = 1 - Math.exp(-dt * 2.5);
      mvCine.eye = mvMix(mvCine.eye, pose.eye, ease);
      mvCine.look = mvMix(mvCine.look, pose.look, ease);
      if (mvCine.clock >= MV_LAKE_SECONDS) mvCine.eye[2] = Math.max(mvCine.eye[2], mvCine.look[2] + 12);
      mvSetPose(mvCine.eye, mvCine.look);
    } else if (state.auto === 'around') {
      mvAround.elapsed += dt * mvTour.rate;
      const smooth = 1 - Math.exp(-dt * 1.6);
      const e = mvAround.elapsed, ramp = mvEase(e / 4);
      let dy = 1.5 + 1 * Math.sin(e * .07 + mvAround.yaw0) - state.yaw;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      state.yaw += dy * smooth;
      state.pitch += (1.02 + .09 * Math.sin(e * .052) - state.pitch) * smooth;
      const goal = mvAroundTarget(e);
      for (let i = 0; i < 3; i++) state.target[i] += (goal[i] - state.target[i]) * smooth * (.35 + .65 * ramp);
      state.dist += ((38 + 9 * Math.sin(e * .061 + .8)) * mvAround.zoom - state.dist) * smooth;
    }
    if (mvZoomGoal !== null) {
      state.dist += (mvZoomGoal - state.dist) * Math.min(1, dt * 7);
      if (Math.abs(mvZoomGoal - state.dist) < .05) mvZoomGoal = null;
    }
  }
  function mvSetFree(on) {
    mvFree = !!on;
    if (mvFree) mvOverviewFit = false;
    mvFreeMode = 'move';
    state.mode = mvFree ? 'pan' : 'orbit';
    CAMERA_LIMITS.minDist = mvFree ? 4 : 10;
    if (mvFree) {
      if (state.auto === 'presentation') endPresentation();
      state.auto = '';
    }
    syncButtons();
    mvSyncNav();
  }
  function mvSyncNav() {
    const b = $('free');
    if (!b) return;
    const label = !mvFree ? 'Manos libres' : mvFreeMode === 'rotate' ? 'Manos libres: Girar' : 'Manos libres: Mover';
    const svg = b.querySelector('svg');
    b.textContent = '';
    if (svg) b.appendChild(svg);
    b.appendChild(document.createTextNode((svg ? ' ' : '') + label));
    b.title = !mvFree ? 'Clic: Mover · Segundo clic: Girar · Tercer clic: Salir' : mvFreeMode === 'move' ? 'Clic izquierdo: mover · Derecho o Mayús: girar · Clic otra vez: girar' : 'Clic izquierdo: girar · Derecho o Mayús: mover · Clic otra vez: salir';
    canvas.style.cursor = !mvFree ? '' : mvFreeMode === 'rotate' ? 'move' : 'grab';
    $('spinSpeed').textContent = mvTour.rate > 1 ? 'Giro: Rápida' : 'Giro: Normal';
  }
  const mvZoom = f => {
    if (state.auto === 'around') {
      mvAround.zoom = Math.max(.6, Math.min(1.5, mvAround.zoom * f));
      mvFrameDistance = 0;
      return;
    }
    if (state.auto === 'spin' || state.auto === 'presentation') {
      mvAutoZoom = Math.max(.6, Math.min(1.16, mvAutoZoom * f));
      mvFrameDistance = 0;
      return;
    }
    if (mvOverviewFit) {
      if (f < 1 && mvOverviewZoom <= .46) mvLeaveOverview(); else {
        mvOverviewZoom = Math.max(.45, Math.min(1.16, mvOverviewZoom * f));
        mvFrameDistance = 0;
        return;
      }
    }
    mvZoomGoal = Math.max(CAMERA_LIMITS.minDist, Math.min(CAMERA_LIMITS.maxDist, (mvZoomGoal ?? state.dist) * f));
  };
  $('zoomIn').onclick = () => mvZoom(.84);
  $('zoomOut').onclick = () => mvZoom(1.19);
  $('spin').onclick = () => state.auto === 'spin' ? mvStopAll() : mvStartTour();
  $('spinSpeed').onclick = () => {
    mvTour.rate = mvTour.rate === 1 ? 1.8 : 1;
    mvSyncNav();
  };
  $('around').onclick = () => state.auto === 'around' ? mvStopAll() : mvStartAround();
  $('free').onclick = () => {
    if (!mvFree) mvSetFree(true); else if (mvFreeMode === 'move') {
      mvFreeMode = 'rotate';
      mvSyncNav();
    } else mvSetFree(false);
  };
  {
    const r = $('reset').onclick, tp = $('top').onclick;
    $('reset').onclick = () => {
      mvSetFree(false);
      mvZoomGoal = null;
      r();
    };
    $('top').onclick = () => {
      mvSetFree(false);
      mvZoomGoal = null;
      tp();
    };
  }
  {
    const sp = $('presentationToggle').onclick;
    $('presentationToggle').onclick = () => {
      mvSetFree(false);
      sp();
    };
  }
  const mvOrbit = (dx, dy) => {
    if (mvOverviewFit && dy < 0 && state.pitch > 1.28) mvLeaveOverview();
    state.yaw -= dx * .006;
    state.pitch = Math.max(.18, Math.min(CAMERA_LIMITS.maxPitch, state.pitch - dy * .006));
  };
  const mvPan = (dx, dy) => {
    mvOverviewFit = false;
    const s = state.dist * .00125, sy = Math.sin(state.yaw), cy = Math.cos(state.yaw);
    state.target[0] = Math.max(CAMERA_LIMITS.panXMin, Math.min(CAMERA_LIMITS.panXMax, state.target[0] + sy * dx * s + cy * dy * s));
    state.target[2] = Math.max(CAMERA_LIMITS.panZMin, Math.min(CAMERA_LIMITS.panZMax, state.target[2] - cy * dx * s + sy * dy * s));
  };
  const mvFreeMove = (dx, dy) => {
    const ds = Math.max(3.5, state.dist) * .0013, vs = Math.max(.35, Math.abs(Math.cos(state.pitch))), h = dx * ds, dp = dy * ds / vs, y = state.yaw;
    state.target[0] = Math.max(CAMERA_LIMITS.panXMin - 16, Math.min(CAMERA_LIMITS.panXMax + 16, state.target[0] - Math.sin(y) * h - Math.cos(y) * dp));
    state.target[2] = Math.max(CAMERA_LIMITS.panZMin - 16, Math.min(CAMERA_LIMITS.panZMax + 16, state.target[2] + Math.cos(y) * h - Math.sin(y) * dp));
  };
  const mvFreeHeight = dy => {
    state.target[1] = Math.max(.6, Math.min(35, state.target[1] + dy * Math.max(3.5, state.dist) * .0013));
  };
  const mvPointers = new Map;
  let mvMode = 'orbit', mvPrevTouch = null;
  const mvModeFor = e => {
    if (!mvFree) return e.button === 2 || e.shiftKey ? 'pan' : 'orbit';
    if (e.button === 1) return 'height';
    const alt = e.button === 2 || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey;
    return mvFreeMode === 'rotate' !== alt ? 'orbit' : 'free-pan';
  };
  canvas.addEventListener('pointerdown', e => {
    if (state.auto === 'presentation') endPresentation();
    if (state.auto === 'spin') {
      state.auto = '';
      syncButtons();
    }
    if (mvFree && (e.button === 2 || e.button === 1)) e.preventDefault();
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (x) {}
    mvPointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY
    });
    mvMode = mvModeFor(e);
    mvPrevTouch = null;
    if (mvFree) canvas.style.cursor = mvMode === 'orbit' ? 'move' : 'grabbing';
  });
  canvas.addEventListener('pointermove', e => {
    if (!mvPointers.has(e.pointerId)) return;
    const old = mvPointers.get(e.pointerId);
    mvPointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY
    });
    const arr = [ ...mvPointers.values() ], dx = e.clientX - old.x, dy = e.clientY - old.y;
    if (state.auto === 'around') {
      if (arr.length >= 2) {
        const d = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
        if (mvPrevTouch) mvZoom(Math.exp((mvPrevTouch.d - d) * .007));
        mvPrevTouch = {
          d: d
        };
      } else if (mvMode === 'pan' || e.shiftKey) mvPan(dx, dy); else mvAround.pitch = Math.max(.35, Math.min(CAMERA_LIMITS.maxPitch, mvAround.pitch - dy * .004));
      return;
    }
    if (arr.length >= 2) {
      const d = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y), cx = (arr[0].x + arr[1].x) / 2, cy = (arr[0].y + arr[1].y) / 2;
      if (mvPrevTouch) {
        mvZoom(Math.exp((mvPrevTouch.d - d) * .007));
        if (!mvOverviewFit && Math.hypot(cx - mvPrevTouch.cx, cy - mvPrevTouch.cy) > 1) (mvFree ? mvFreeMove : mvPan)(cx - mvPrevTouch.cx, cy - mvPrevTouch.cy);
      }
      mvPrevTouch = {
        d: d,
        cx: cx,
        cy: cy
      };
      return;
    }
    if (mvFree) {
      if (mvMode === 'orbit') mvOrbit(dx, dy); else if (mvMode === 'height') mvFreeHeight(dy); else mvFreeMove(dx, dy);
    } else if (mvMode === 'pan' || e.shiftKey) mvPan(dx, dy); else mvOrbit(dx, dy);
  });
  const mvUp = e => {
    mvPointers.delete(e.pointerId);
    mvPrevTouch = null;
    if (!mvPointers.size) mvSyncNav();
  };
  canvas.addEventListener('pointerup', mvUp);
  canvas.addEventListener('pointercancel', mvUp);
  canvas.addEventListener('lostpointercapture', mvUp);
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    mvZoom(Math.exp(e.deltaY * .001));
  }, {
    passive: false
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
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
  mvSyncNav();
  document.addEventListener('keydown', e => {
    const target = e.target;
    if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
    if (state.auto === 'presentation') {
      if (e.key === 'Escape') {
        endPresentation();
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        jumpPresentation(1);
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        jumpPresentation(-1);
        e.preventDefault();
      } else if (e.key === ' ') {
        state.paused = !state.paused;
        $('presentationPause').textContent = state.paused ? 'Continuar' : 'Pausar';
        e.preventDefault();
      } else if (e.key.toLowerCase() === 'i') {
        state.showInfo = !state.showInfo;
        showPanel(state.selected !== null);
        syncButtons();
        e.preventDefault();
      }
      return;
    }
    if (![ 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown' ].includes(e.key)) return;
    if (state.auto === 'spin' || state.auto === 'around') mvStopAll();
    if (e.key === 'ArrowLeft') state.yaw += .08; else if (e.key === 'ArrowRight') state.yaw -= .08; else if (e.key === 'ArrowUp') state.pitch = Math.max(.18, state.pitch - .08); else if (e.key === 'ArrowDown') state.pitch = Math.min(CAMERA_LIMITS.maxPitch, state.pitch + .08);
    e.preventDefault();
  }, true);
  let vw = 0, vh = 0, density = 0, lastFrame = performance.now(), qualityFrames = 0, qualityMs = 0, longestFrame = 0;
  const maxSize = Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 4096, gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096);
  function resize() {
    const w = Math.max(1, Math.round(canvas.clientWidth)), h = Math.max(1, Math.round(canvas.clientHeight)), dpr = Math.max(1, window.devicePixelRatio || 1);
    const px = w * h, mobile = Math.min(w, h) <= 600 && (window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 600), pref = mvUltra ? Math.max(1.5, dpr) : mobile ? Math.min(dpr, 1.4) : Math.max(dpr, px >= 55e5 ? 1.17 : px >= 3e6 ? 1.44 : 1.76);
    let densityScale = Math.min(mvUltra ? 2.4 : 2.05, pref * state.quality);
    densityScale = Math.max(.65, Math.min(densityScale, Math.sqrt((mvUltra ? 3e7 : mobile ? 17e5 : 12e6) / px), maxSize / w, maxSize / h));
    densityScale = Math.max(.55, densityScale * mvMotionScale);
    const width = Math.max(1, Math.round(w * densityScale)), height = Math.max(1, Math.round(h * densityScale));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const viewportChanged = vw !== w || vh !== h || density !== dpr;
    vw = w;
    vh = h;
    density = dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (viewportChanged) drawChart();
  }
  function drawFlowLabels(mat) {
    if (!flowLabels.size) return;
    if (!state.names || !state.flowNames) {
      for (const f of flowLabels.values()) f.el.hidden = true;
      return;
    }
    const occupied = [];
    for (const n of config.nodes) {
      const f = flowLabels.get(n[0]);
      if (state.auto === 'presentation' && state.selected && n[0] !== state.selected) {
        if (f) f.el.hidden = true;
        continue;
      }
      const height = f ? 2.15 : n[2] === 'tank' ? 5 : n[2] === 'reservoir' ? 2.25 : n[2] === 'pump' ? 6.15 : 3.9;
      const p = project([n[3], height, n[4]], mat, vw, vh);
      if (!p) {
        if (f) f.el.hidden = true;
        continue;
      }
      const width = n[2] === 'pump' ? 184 : Math.min(180, Math.max(105, n[1].length * 6.1));
      const rect = [p[0] - width / 2, p[1] - 42, p[0] + width / 2, p[1]];
      const collision = occupied.some(q => rect[0] < q[2] + 7 && rect[2] > q[0] - 7 && rect[1] < q[3] + 5 && rect[3] > q[1] - 5);
      if (!collision || n[0] === state.selected) occupied.push(rect);
      if (!f) continue;
      const position = project([n[3] + 1.8, 1.4, n[4] + 2.2], mat, vw, vh);
      f.el.hidden = !position || collision;
      if (!f.el.hidden) {
        f.el.style.left = position[0] + 'px';
        f.el.style.top = position[1] + 'px';
      }
    }
  }
  function keepCameraAboveTerrain(eye, look, wide = false) {
    const radius = Math.hypot(eye[0], eye[2]);
    if (!wide && radius > 167) {
      const scale = 167 / radius;
      eye[0] *= scale;
      eye[2] *= scale;
    }
    let safeHeight = 2.4;
    for (let i = 2; i <= 15; i++) {
      const fraction = i / 15;
      const px = look[0] + (eye[0] - look[0]) * fraction;
      const pz = look[2] + (eye[2] - look[2]) * fraction;
      const distance = Math.hypot(px, pz);
      const clearance = distance > 96 ? 4.5 : distance > 70 ? 3 : 1.65;
      const required = terrainHeight(px, pz) + clearance;
      safeHeight = Math.max(safeHeight, (required - look[1] * (1 - fraction)) / fraction);
    }
    eye[1] = Math.max(eye[1], safeHeight);
  }
  function render(now) {
    if (document.hidden || gl.isContextLost()) {
      lastFrame = now;
      qualityMs = 0;
      qualityFrames = 0;
      longestFrame = 0;
      requestAnimationFrame(render);
      return;
    }
    const frameMs = Math.min(250, Math.max(0, now - lastFrame));
    const dt = Math.min(.06, Math.max(.001, frameMs / 1000));
    lastFrame = now;
    qualityFrames++;
    qualityMs += frameMs;
    longestFrame = Math.max(longestFrame, frameMs);
    if (qualityFrames >= 6 && (qualityMs >= 1250 || qualityFrames >= 90)) {
      const avg = (qualityMs - longestFrame) / (qualityFrames - 1);
      const old = state.quality;
      if (avg > 48) state.quality = Math.max(.68, old - .15);
      else if (avg > 29) state.quality = Math.max(.68, old - .08);
      else if (avg < 18) state.quality = Math.min(1.24, old + .03);
      qualityFrames = 0;
      qualityMs = 0;
      longestFrame = 0;
      if (Math.abs(state.quality - old) > .005) resize();
    }
    if (vw !== canvas.clientWidth || vh !== canvas.clientHeight || density !== Math.max(1, window.devicePixelRatio || 1)) resize();
    mvTickNav(dt);
    if (false) {
      const n = nodeById.get(state.selected).data;
      if (n[2] === 'pump') {
        const t = Math.min(1, dt * 1.25);
        state.target[0] += (n[3] - state.target[0]) * t;
        state.target[2] += (n[4] - state.target[2]) * t;
        state.target[1] += (2.8 - state.target[1]) * t;
        state.dist += (24 - state.dist) * t;
      }
    }
    state.dist = Math.max(CAMERA_LIMITS.minDist, Math.min(CAMERA_LIMITS.maxDist, state.dist));
    state.pitch = Math.max(.18, Math.min(CAMERA_LIMITS.maxPitch, state.pitch));
    const sn = Math.sin(state.pitch), cs = Math.cos(state.pitch), eye = [ state.target[0] + Math.cos(state.yaw) * state.dist * sn, Math.max(2.1, state.target[1] + state.dist * cs), state.target[2] + Math.sin(state.yaw) * state.dist * sn ];
    eye[0] = Math.max(-118, Math.min(119, eye[0]));
    eye[2] = Math.max(-64, Math.min(88, eye[2]));
    const mvFW = mvCineFreeWeight(), mvFreeEye = [ ...eye ];
    if (mvFW > 0) keepCameraAboveTerrain(mvFreeEye, state.target);
    if ((state.auto === 'presentation' || state.auto === 'spin') && mvFW < 1) eye[2] = Math.max(eye[2], state.target[2] + 11);
    let cameraTarget = state.target;
    if (state.auto === 'spin' || state.auto === 'presentation' || mvOverviewFit) {
      if (mvFW < 1) cameraTarget = mvFitCamera(eye, state.target, dt); else mvFrameDistance = 0;
      if (mvFW > 0) {
        for (let i = 0; i < 3; i++) eye[i] += (mvFreeEye[i] - eye[i]) * mvFW;
        cameraTarget = cameraTarget.map((v, i) => v + (state.target[i] - v) * mvFW);
      }
    } else {
      mvFrameDistance = 0;
      keepCameraAboveTerrain(eye, state.target);
    }
    mvLastEye = [ ...eye ];
    mvLastTarget = [ ...cameraTarget ];
    const mat = mul(proj(Math.PI / 3.45, canvas.width / Math.max(canvas.height, 1), .12, Math.max(4e3, Math.hypot(...minus(eye, cameraTarget)) + 600)), view(eye, cameraTarget));
    mvRenderShadowMap();
    gl.clearColor(.6, .78, .88, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    eveningBlend += (Number(state.night) - eveningBlend) * Math.min(1, Math.min(dt, .05) * 2.3);
    renderSky(eye, cameraTarget, now * .001, canvas.width / Math.max(1, canvas.height));
    gl.useProgram(program);
    gl.uniformMatrix4fv(loc.vp, false, mat);
    if (loc.cam !== null) gl.uniform3fv(loc.cam, new Float32Array(eye));
    if (loc.time !== null) gl.uniform1f(loc.time, now * .001 * state.speed);
    if (loc.anim !== null) gl.uniform1f(loc.anim, state.water ? 1 : 0);
    if (loc.evening !== null) gl.uniform1f(loc.evening, eveningBlend);
    mvBindProUniforms();
    if (loc.casetaLights !== null) gl.uniform1fv(loc.casetaLights, casetaLightState);
    if (loc.terrainDetail !== null) gl.uniform1f(loc.terrainDetail, state.quality > .8 ? 1 : 0);
    if (loc.levels !== null) gl.uniform1fv(loc.levels, levelsUniform);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, turfTexture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, forestTexture);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    drawGroup(0);
    pipeWater.draw(mat);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    drawGroup(1);
    drawGroup(2);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    drawFlowLabels(mat);
    mvPlatesDraw(mat, eye, cameraTarget);
    requestAnimationFrame(render);
  }
  const mvClockDate = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Monterrey',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }), mvClockTime = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Monterrey',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  const mvClockTick = () => {
    if (!state.date) return;
    const d = new Date;
    $('clockText').textContent = mvClockDate.format(d).replace(/\./g, '').toUpperCase() + ' · ' + mvClockTime.format(d).replace(/\u202f/g, ' ').toUpperCase();
  };
  mvClockTick();
  setInterval(mvClockTick, 1e3);
  window.addEventListener('resize', resize, {
    passive: true
  });
  window.addEventListener('resize', mvAlertReposition, {
    passive: true
  });
  window.addEventListener('visibilitychange', () => {
    lastFrame = performance.now();
  });
  let MV_HISTORY_WINDOW_MS = 60 * 6e4;
  const mvHistoryNumber = new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 1
  });
  const mvHistoryClock = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Monterrey'
  });
  const mvHistoryFormatTime = ms => mvHistoryClock.format(new Date(ms));
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
  function pumpMiniature(state) {
    const icon = document.createElement('div');
    icon.className = 'presentation-pump-model';
    const colors = state === true ? {
      base: '#267744',
      baseEdge: '#19542f',
      foot: '#2c7147',
      body: '#39bb61',
      bodyEdge: '#187742',
      middle: '#249b4f',
      stripes: '#27a754',
      bright: '#a9f2bb',
      rail: '#61d885',
      light: '#d3f9dc',
      top: '#57c879',
      topEdge: '#18633a',
      inlet: '#207b46',
      inletEdge: '#155a35',
      core: '#70eb94'
    } : {
      base: '#52616a',
      baseEdge: '#64747f',
      foot: '#8d9ba3',
      body: '#aab4bb',
      bodyEdge: '#64747f',
      middle: '#7d8e98',
      stripes: '#7d8e98',
      bright: '#d9e0e4',
      rail: '#4c5d67',
      light: '#bac4c9',
      top: '#7b8b96',
      topEdge: '#4d5e68',
      inlet: '#6b7e89',
      inletEdge: '#4d5b65',
      core: '#84939c'
    };
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 64" aria-hidden="true" focusable="false">\n <rect x="7" y="56" width="40" height="5" rx="1" fill="${colors.base}"/>\n <rect x="12" y="53" width="31" height="3" fill="${colors.foot}"/>\n <rect x="13" y="16" width="29" height="37" rx="4" fill="${colors.body}" stroke="${colors.bodyEdge}" stroke-width="1.4"/>\n <path d="M16 20h23v6H16zM16 31h23v5H16zM16 41h23v6H16z" fill="${colors.middle}"/>\n <path d="M17 18h5v33h-5zM33 18h5v33h-5z" fill="${colors.bright}" opacity=".8"/>\n <path d="M11 24h33v5H11zM11 45h33v5H11z" fill="${colors.rail}" stroke="${colors.topEdge}" stroke-width=".6"/>\n <rect x="21" y="8" width="13" height="9" rx="2" fill="${colors.top}" stroke="${colors.topEdge}"/>\n <ellipse cx="27" cy="7" rx="11" ry="4.4" fill="${colors.top}" stroke="${colors.topEdge}" stroke-width="1.2"/>\n <ellipse cx="27" cy="7" rx="6" ry="2.2" fill="${colors.topEdge}"/>\n <rect x="41" y="31" width="7" height="15" rx="1.2" fill="${colors.inlet}" stroke="${colors.inletEdge}" stroke-width="1"/>\n <path d="M45 33h2m-2 4h2m-2 4h2" stroke="${colors.light}" stroke-width=".7"/>\n <rect x="13" y="52" width="28" height="2" fill="${colors.baseEdge}"/>\n <rect class="pump-operation-core" x="24.5" y="31" width="5" height="13" rx="1" fill="${colors.core}"/>\n </svg>`;
    return icon;
  }
  const mvTrendDirection = d => !Number.isFinite(d) ? null : Number(d.toFixed(2)) > 0 ? 'up' : 'down';
  const mvTrendDisplay = d => {
    const dir = mvTrendDirection(d);
    if (dir === null) return 'SIN TENDENCIA';
    const r = Number(d.toFixed(2));
    return (dir === 'up' ? '▲ +' : r < 0 ? '▼ −' : '▼ ') + Math.abs(r).toFixed(2) + ' m';
  };
  const mvLnStyle = document.createElement('style');
  mvLnStyle.textContent = `\n    #presentationPanel .presentation-secondary-table{display:none!important}\n    #presentationPanel #presentationUpdated{display:none!important}\n    #presentationPanel .mv-dual-history{margin:12px 0 8px;border:1px solid #c5d2dc;border-left:3px solid #275b7d;border-radius:3px;background:#fff;color:#21374a;font-family:'Segoe UI',Tahoma,Arial,sans-serif;box-shadow:none;overflow:hidden}\n    #presentationPanel .mv-dh-body{display:block;padding:0 11px}\n    #presentationPanel .mv-dh-card{background:#fff;border:0;border-radius:0;padding:11px 0 9px;min-width:0;box-shadow:none}\n    #presentationPanel .mv-dh-flow{border-top:1px solid #d4dfe7}\n    #presentationPanel .mv-dh-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 3px}\n    #presentationPanel .mv-dh-card-name{display:flex;align-items:center;gap:8px;color:#111111;font-size:11.5px;font-weight:650;letter-spacing:.035em}\n    #presentationPanel .mv-dh-symbol{display:block;width:3px;height:15px;border-radius:0;background:#005288;box-shadow:none;flex:none}\n    #presentationPanel .mv-dh-flow .mv-dh-symbol{background:#6c757d;box-shadow:none}\n    #presentationPanel .mv-dh-value{color:#111111;font-size:17px;font-weight:400;letter-spacing:0;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}\n    #presentationPanel .mv-dh-flow .mv-dh-value{color:#111111}\n    #presentationPanel .mv-dh-value small{color:#111111;font-size:10px;font-weight:500;letter-spacing:0}\n    #presentationPanel .mv-dh-flow-choice{display:block;width:100%;margin:3px 0 6px;min-height:26px;padding:3px 7px;border:1px solid #c6d4dc;border-radius:2px;background:#f8fafb;color:#314c5d;font:500 11px 'Segoe UI',Tahoma,Arial,sans-serif}\n    #presentationPanel .mv-dh-flow-choice[hidden]{display:none}\n    #presentationPanel .mv-dh-plot{position:relative;width:100%;height:137px;min-width:0;overflow:visible;background:transparent}\n    #presentationPanel .mv-dh-plot svg{width:100%;height:100%;display:block;overflow:hidden}\n    #presentationPanel .mv-dh-foot{display:flex;align-items:center;justify-content:flex-end;gap:7px;padding:5px 1px 0;border-top:1px solid #edf1f4;color:#111111;font-size:10px;line-height:1.3}\n    #presentationPanel .mv-dh-foot span:first-child{display:none!important}\n    #presentationPanel .mv-dh-foot span:last-child{font-weight:500;text-align:right}\n    #presentationPanel .mv-dh-empty{display:flex;align-items:center;justify-content:center;min-height:100px;height:100%;padding:9px;text-align:center;color:#6b7c86;font-size:11px;line-height:1.5}\n    #presentationPanel .mv-dh-tooltip{position:absolute;z-index:5;pointer-events:none;background:#274455;color:#fff;padding:4px 7px;border-radius:2px;font-weight:600;font-size:10.5px;line-height:1.35;box-shadow:0 2px 7px rgba(0,0,0,.15);white-space:nowrap;transform:translate(-50%,-105%)}\n    #presentationPanel .mv-dh-tooltip[hidden]{display:none}\n    #presentationPanel .mv-dh-cursor{pointer-events:none}\n    #presentationPanel .mv-dh-message{margin:0 11px 10px;padding:7px 0;border:0;border-top:1px solid #e0e7ed;border-radius:0;background:#fff;color:#667b88;font-size:10px;line-height:1.45}\n    #presentationPanel .mv-dh-message[hidden]{display:none}\n    @media(max-width:700px){#presentationPanel .mv-dh-body{padding:0 9px}#presentationPanel .mv-dh-card{padding:9px 0 8px}#presentationPanel .mv-dh-plot{height:136px;min-height:128px}#presentationPanel .mv-dh-value{font-size:16px}}\n    #presentationPanel .presentation-pumps{text-align:center}\n    #presentationPanel .presentation-pumps-title{text-align:center}\n    #presentationPanel .presentation-pump-group{display:flex;flex-direction:column;align-items:center}\n    #presentationPanel .presentation-pump-group-title{width:100%;text-align:center;font-weight:600;letter-spacing:.015em}\n    #presentationPanel .presentation-pump-grid{justify-content:center;justify-items:center}\n    #presentationPanel .presentation-pump-item{text-align:left;justify-self:center;width:min(100%,240px)}\n    #presentationPanel .presentation-pump-grid{display:flex!important;flex-wrap:wrap!important;justify-content:center!important;align-items:flex-start!important;column-gap:8px!important;row-gap:4px!important;max-width:100%!important}\n    #presentationPanel .presentation-pump-grid .presentation-pump-item{flex:0 1 calc((100% - 16px)/3)!important;box-sizing:border-box!important;min-width:0!important;max-width:none!important;margin:0!important;justify-self:auto!important}\n    #presentationPanel .presentation-pump-grid.mv-pump-count-1 .presentation-pump-item{flex:0 1 180px!important}\n    #presentationPanel .presentation-pump-grid.mv-pump-count-2 .presentation-pump-item,#presentationPanel .presentation-pump-grid.mv-pump-count-4 .presentation-pump-item{flex:0 1 calc((100% - 8px)/2)!important}\n    #presentationPanel .presentation-pump-grid.mv-pump-count-3 .presentation-pump-item,#presentationPanel .presentation-pump-grid.mv-pump-count-5 .presentation-pump-item{flex:0 1 calc((100% - 16px)/3)!important}\n    #presentationPanel .presentation-pump-grid .presentation-pump-model svg{filter:none!important}\n    @media(max-width:380px){#presentationPanel .presentation-pump-grid.mv-pump-count-3 .presentation-pump-item,#presentationPanel .presentation-pump-grid.mv-pump-count-5 .presentation-pump-item{flex:0 1 calc((100% - 8px)/2)!important}}\n\n    @media (min-width:701px) and (min-height:560px) {\n      #presentationPanel.mv-fit-no-scroll:not([hidden]){top:9px!important;right:13px!important;bottom:auto!important;transform:none!important;width:min(444px,calc(100vw - 30px))!important;max-height:calc(100dvh - 18px)!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-head{flex:0 0 auto!important;padding:10px 14px 8px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-head-top{min-height:0!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-tank-title{margin:3px 0 0!important;font-size:20px!important;line-height:1.2!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-progress-track{flex:0 0 2px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-content{flex:0 1 auto!important;min-height:0!important;overflow:hidden!important;padding:7px 13px 6px!important;overscroll-behavior:contain}\n      #presentationPanel.mv-fit-no-scroll .presentation-readings{padding-bottom:6px!important;margin-bottom:4px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-reading{padding-top:0!important;padding-bottom:0!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-reading-label{margin-bottom:3px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-primary-value{font-weight:400!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-flow{padding:5px 0!important;margin:3px 0 5px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-flow-heading{margin-bottom:3px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-flow-row{padding:3px 0!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-flow-row strong{font-weight:400!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dual-history{margin:7px 0 5px!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-body{padding:0 11px!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-card{padding:6px 0 5px!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-card-head{margin-bottom:2px!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-plot{height:var(--mv-fit-plot-height,145px)!important;min-height:128px!important;flex-shrink:0!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-foot{padding-top:3px!important}\n      #presentationPanel.mv-fit-no-scroll .mv-dh-message{margin:0 11px 6px!important;padding:4px 0!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pumps{margin-top:5px!important;padding-top:6px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pumps-title{font-size:12px!important;margin-bottom:4px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-group{margin-bottom:3px!important;padding-bottom:2px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-group+.presentation-pump-group{margin-top:3px!important;padding-top:5px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-group-title{font-size:10.5px!important;margin-bottom:3px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;column-gap:8px!important;row-gap:1px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-grid.mv-fit-three{grid-template-columns:repeat(3,minmax(0,1fr))!important;column-gap:5px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-item{grid-template-columns:25px minmax(0,1fr)!important;grid-template-rows:16px 15px!important;column-gap:4px!important;min-height:34px!important;padding:1px 0!important;white-space:nowrap!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-model{width:25px!important;height:31px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-model svg{width:24px!important;height:30px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-item-eq{font-size:10.5px!important;font-weight:500!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-status{font-size:10px!important;gap:3px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-status::before{width:5px!important;height:5px!important;flex-basis:5px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-actions{flex:0 0 auto!important;padding:7px 11px!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-actions>button{min-height:32px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .presentation-content{flex:1 1 auto!important;display:flex!important;flex-direction:column!important;justify-content:center!important}\n      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .presentation-readings{margin-top:auto!important}\n      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .presentation-flow{display:none!important}\n      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .mv-dual-history{margin:9px 0!important}\n      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .presentation-pumps{display:none!important}\n      #presentationPanel.mv-fit-no-scroll.mv-center-minimal .presentation-actions{margin-top:auto!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-head{padding:7px 12px 6px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-tank-title{font-size:18px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-content{padding:4px 12px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-readings{padding-bottom:4px!important;margin-bottom:2px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-flow{padding:3px 0!important;margin:2px 0!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-flow-row{padding:2px 0!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .mv-dual-history{margin:4px 0!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .mv-dh-card{padding:3px 0!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-pumps{margin-top:2px!important;padding-top:3px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-pump-item{grid-template-rows:14px 13px!important;min-height:29px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-pump-model{height:28px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-pump-model svg{height:27px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-tight .presentation-actions{padding:5px 9px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-overflow .presentation-content{overflow-y:auto!important}\n    }\n    @media (min-width:701px) and (min-height:560px) {\n      #presentationPanel.mv-fit-no-scroll.mv-fit-flow-grid #presentationFlowReadings{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;column-gap:13px!important;align-items:center!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-flow-grid .presentation-flow-row{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:5px!important;min-width:0!important;padding:3px 0!important;white-space:nowrap!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-flow-grid .presentation-flow-row span{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-flow-grid .presentation-flow-row strong{flex:none!important;text-align:right!important;white-space:nowrap!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pump-grid.mv-pump-count-6 .presentation-pump-item{flex-basis:calc((100% - 16px)/3)!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-head{padding-top:6px!important;padding-bottom:5px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-content{padding-top:4px!important;padding-bottom:3px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-flow{padding-top:3px!important;padding-bottom:3px!important;margin-top:1px!important;margin-bottom:2px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-flow-row{padding-top:2px!important;padding-bottom:2px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .mv-dual-history{margin-top:3px!important;margin-bottom:2px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .mv-dh-body{padding-left:9px!important;padding-right:9px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .mv-dh-card{padding-top:3px!important;padding-bottom:3px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .mv-dh-card-head{margin-bottom:1px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .mv-dh-foot{padding-top:2px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .mv-dh-flow-choice{margin-top:2px!important;margin-bottom:3px!important;min-height:25px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-pumps{margin-top:3px!important;padding-top:3px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-pumps-title{margin-bottom:2px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-pump-group{margin-bottom:2px!important;padding-bottom:1px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-pump-group+.presentation-pump-group{margin-top:1px!important;padding-top:3px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-pump-group-title{margin-bottom:2px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-pump-grid{row-gap:0!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-pump-item{min-height:30px!important;padding-top:0!important;padding-bottom:0!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dense .presentation-actions{padding-top:5px!important;padding-bottom:5px!important}\n    }\n    #presentationPanel .presentation-pump-grid.mv-pump-aligned{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-auto-flow:row!important;justify-content:center!important;justify-items:stretch!important;align-items:center!important;gap:3px 13px!important;width:min(100%,354px)!important;max-width:354px!important;margin:4px auto 2px!important;box-sizing:border-box!important}\n    #presentationPanel .presentation-pump-grid.mv-pump-aligned .presentation-pump-item{display:grid!important;grid-template-columns:26px minmax(0,1fr)!important;grid-template-rows:15px 14px!important;column-gap:6px!important;row-gap:0!important;align-items:center!important;justify-self:stretch!important;min-width:0!important;max-width:none!important;width:100%!important;height:30px!important;min-height:30px!important;padding:0 3px!important;margin:0!important;flex:none!important;box-sizing:border-box!important;text-align:left!important;border:0!important}\n    #presentationPanel .presentation-pump-grid.mv-pump-aligned .presentation-pump-model{grid-row:1/3!important;grid-column:1!important;width:25px!important;height:29px!important;margin:0!important;align-self:center!important}\n    #presentationPanel .presentation-pump-grid.mv-pump-aligned .presentation-pump-model svg{display:block!important;width:25px!important;height:29px!important}\n    #presentationPanel .presentation-pump-grid.mv-pump-aligned .presentation-pump-item-eq{grid-column:2!important;grid-row:1!important;display:block!important;font-size:10.5px!important;line-height:14px!important;min-width:0!important;white-space:nowrap!important;text-align:left!important}\n    #presentationPanel .presentation-pump-grid.mv-pump-aligned .presentation-pump-status{grid-column:2!important;grid-row:2!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;font-size:10px!important;line-height:13px!important;min-width:0!important;white-space:nowrap!important;text-align:left!important}\n    #presentationPanel .presentation-pump-grid.mv-pump-aligned.mv-pump-count-5 .presentation-pump-item:last-child,#presentationPanel .presentation-pump-grid.mv-pump-aligned.mv-pump-count-1 .presentation-pump-item{grid-column:1/-1!important;justify-self:center!important;width:calc((100% - 13px)/2)!important}\n    #presentationPanel .presentation-pump-group:has(.mv-pump-aligned){width:100%!important;align-items:center!important}\n    #presentationPanel .presentation-pump-grid.mv-pump-aligned.mv-fit-three{grid-template-columns:repeat(2,minmax(0,1fr))!important}\n    @media(max-width:420px){#presentationPanel .presentation-pump-grid.mv-pump-aligned{width:min(100%,330px)!important;column-gap:8px!important}#presentationPanel .presentation-pump-grid.mv-pump-aligned.mv-pump-count-5 .presentation-pump-item:last-child,#presentationPanel .presentation-pump-grid.mv-pump-aligned.mv-pump-count-1 .presentation-pump-item{width:calc((100% - 8px)/2)!important}}\n    #presentationPanel .presentation-primary-value{font-weight:400!important}\n    #presentationPanel .presentation-flow-row strong{font-weight:400!important}\n    #presentationPanel .mv-dh-value{font-weight:400!important}\n    @media (min-width:701px) and (min-height:560px){\n      #presentationPanel.mv-fit-no-scroll:not([hidden]){width:min(488px,calc(100vw - 30px))!important;height:max-content!important;min-height:0!important;max-height:none!important;overflow:visible!important;transform-origin:top right!important;contain:none!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-content{display:block!important;flex:0 0 auto!important;height:auto!important;max-height:none!important;min-height:0!important;overflow:visible!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-overflow .presentation-content{overflow:visible!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-actions{flex:0 0 auto!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dual-graphs .mv-dh-body{display:block!important;padding:0 10px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dual-graphs .mv-dh-card{min-width:0!important;padding:8px 0 6px!important;border:0!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dual-graphs .mv-dh-flow{border:0!important;border-top:1px solid #d4dfe7!important;padding:8px 0 0!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dual-graphs .mv-dh-plot{height:var(--mv-fit-plot-height,172px)!important;min-height:0!important;max-height:none!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dual-graphs .mv-dh-flow-choice{min-height:25px!important;margin-top:3px!important;margin-bottom:4px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dual-graphs .mv-dh-card-head{min-height:23px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dual-graphs .mv-dh-value{font-size:16px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-dual-graphs .mv-dh-foot{white-space:nowrap!important}\n      #presentationPanel.mv-fit-no-scroll .presentation-pumps{margin-top:5px!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-flow-grid #presentationFlowReadings{grid-template-columns:repeat(2,minmax(0,1fr))!important}\n      #presentationPanel.mv-fit-no-scroll.mv-fit-flow-grid .presentation-flow-row span{text-overflow:clip!important}\n    }\n  \n    #presentationPanel .mv-ln-old{display:none!important}\n    #presentationPanel #mvLnPres{display:flex;flex-direction:column;gap:6px}\n    #presentationPanel #mvLnPres .presentation-primary-value.up{color:#167a45}\n    #presentationPanel #mvLnPres .presentation-primary-value.down{color:#c2283a}\n    #presentationPanel #mvLnPres .presentation-flow-row small{display:block;color:#a35a00;font-size:10px}\n    #presentationPanel #mvLnPres .presentation-flow-row strong.stale{color:#8a6a2a}\n    #labels .mv-ln-level-tile{position:absolute;transform:translate(-50%,-50%) scale(var(--mv-s,1));transform-origin:50% 50%;min-width:118px;padding:6px 13px 7px 22px;border-radius:7px;background:linear-gradient(#5c7680,#425f6a);border:1.5px solid #c3d2d7;color:#fff;text-align:center;font-family:"Segoe UI",Arial,sans-serif;box-shadow:0 3px 9px rgba(0,0,0,.3);pointer-events:none;white-space:nowrap}\n    #labels .mv-ln-level-tile::before{content:"";position:absolute;left:8px;top:8px;bottom:8px;width:4px;border-radius:2px;background:var(--mv-trend,#bac9d0)}\n    #labels .mv-ln-level-tile .k{display:block;font:700 9px/1.1 "Segoe UI",Arial,sans-serif;letter-spacing:.09em;color:#d9e7eb}\n    #labels .mv-ln-level-tile .v{display:block;font:800 23px/1.12 "Segoe UI",Arial,sans-serif;color:#fff}\n    #labels .mv-ln-level-tile .t{display:block;font:800 11px/1.2 "Segoe UI",Arial,sans-serif;color:var(--mv-trend-t,#bac9d0)}\n    #alertBar{display:none!important}\n  `;
  document.head.appendChild(mvLnStyle);
  const mvLnHist = new Map;
  async function mvLnFetchHistory(code) {
    if (!code) return null;
    try {
      const ctl = new AbortController, to = setTimeout(() => ctl.abort(), 9e3);
      const r = await fetch('/Telemetria/php/linares_3d_historial.php?codigo=' + encodeURIComponent(code) + '&horas=6&_=' + Date.now(), {
        cache: 'no-store',
        signal: ctl.signal
      }).finally(() => clearTimeout(to));
      if (!r.ok) return mvLnHist.get(code) || null;
      const o = await r.json();
      const v = {
        level: Array.isArray(o.level) ? o.level : [],
        flow: Array.isArray(o.flow) ? o.flow : [],
        at: Date.now()
      };
      mvLnHist.set(code, v);
      return v;
    } catch (e) {
      return mvLnHist.get(code) || null;
    }
  }
  const mvLnTrend = series => {
    if (!series || series.length < 2) return null;
    const last = series[series.length - 1];
    let ref = series[0];
    for (const p of series) {
      if (p[0] >= last[0] - 60 * 6e4) {
        ref = p;
        break;
      }
    }
    return last[1] - ref[1];
  };
  const mvPresContent = $('presentationPanel').querySelector('.presentation-content');
  $('presentationName').classList.add('presentation-tank-title');
  $('presentationStep').classList.add('presentation-kicker');
  const mvLnBox = document.createElement('div');
  mvLnBox.id = 'mvLnPres';
  mvLnBox.innerHTML = `<div class="presentation-readings"><div class="presentation-reading"><div class="presentation-reading-label" id="mvLnL1">Nivel actual</div><div class="presentation-primary-value" id="mvLnV1">N/D</div></div><div class="presentation-reading"><div class="presentation-reading-label" id="mvLnL2">Tendencia</div><div class="presentation-primary-value" id="mvLnV2">N/D</div></div></div>\n  <section class="presentation-flow" id="mvLnFlowSec"><div class="presentation-flow-heading" id="mvLnFlowHead">Flujo</div><div class="presentation-flow-list" id="mvLnFlows"></div></section>\n  <section class="mv-dual-history"><div class="mv-dh-body">\n    <section class="mv-dh-card mv-dh-level" id="mvLnLevelCard"><div class="mv-dh-card-head"><span class="mv-dh-card-name"><i class="mv-dh-symbol"></i><span id="mvLnLevelName">NIVEL</span></span><span class="mv-dh-value" id="mvLnLevelLatest">N/D</span></div><div class="mv-dh-plot" id="mvLnLevelPlot"></div><div class="mv-dh-foot"><span id="mvLnLevelCount"></span><span id="mvLnLevelTime">m</span></div></section>\n    <section class="mv-dh-card mv-dh-flow" id="mvLnFlowCard"><div class="mv-dh-card-head"><span class="mv-dh-card-name"><i class="mv-dh-symbol"></i>FLUJO</span><span class="mv-dh-value" id="mvLnFlowLatest">N/D</span></div><div class="mv-dh-plot" id="mvLnFlowPlot"></div><div class="mv-dh-foot"><span id="mvLnFlowCount"></span><span id="mvLnFlowTime">LPS</span></div></section>\n  </div></section>\n  <section class="presentation-pumps" id="mvLnPumps" hidden><div class="presentation-pumps-title">Equipos de bombeo</div><div id="mvLnPumpList"></div><p class="presentation-pumps-note" id="mvLnPumpNote" hidden>Último estado recibido; conexión sin confirmar.</p></section>`;
  mvPresContent.prepend(mvLnBox);
  for (const ch of [ ...mvPresContent.children ]) if (ch !== mvLnBox) ch.classList.add('mv-ln-old');
  const mvNum = new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 2
  });
  function mvLnChart(plot, series, unit, hue, latestEl, countEl, timeEl, label) {
    MV_HISTORY_WINDOW_MS = 60 * 6e4;
    const recent = (series || []).filter(p => p[0] >= Date.now() - MV_HISTORY_WINDOW_MS);
    if (recent.length < 2) MV_HISTORY_WINDOW_MS = 6 * 60 * 6e4;
    const c = series && series.length ? mvHistoryChart(plot, series, unit, hue) : null;
    if (!c) {
      mvHistoryEmpty(plot, 'Sin lecturas recientes');
      latestEl.textContent = 'N/D';
      countEl.textContent = 'Esperando lecturas recientes';
      timeEl.textContent = unit;
      return;
    }
    latestEl.replaceChildren(unit === 'LPS' ? mvHistoryNumber.format(c.latestValue) : c.latestValue.toFixed(2));
    const sm = document.createElement('small');
    sm.textContent = ' ' + unit;
    latestEl.appendChild(sm);
    countEl.textContent = c.count + ' lecturas ' + (MV_HISTORY_WINDOW_MS > 36e5 ? '(6 h)' : 'recientes');
    timeEl.textContent = 'Última ' + mvHistoryFormatTime(c.latest);
  }
  function mvLnRender(n) {
    if (!n) return;
    const s = getData(n), kind = n[2], code = n[5], h = code ? mvLnHist.get(code) : null;
    const num = v => v !== null && v !== undefined && Number.isFinite(Number(v));
    const ex = s && Array.isArray(s.extra) ? s.extra : [];
    const pct = ex.find(q => q && q.unit === '%'), sto = ex.find(q => q && q.unit === 'Mm³');
    const L1 = $('mvLnL1'), V1 = $('mvLnV1'), L2 = $('mvLnL2'), V2 = $('mvLnV2');
    const stateTxt = !code ? 'Referencia' : !s || s.status === 'sin_datos' ? 'Sin datos' : s.status === 'sin_comunicacion' ? 'Sin comunicación' : s.observation ? 'Observación' : 'Actual';
    V2.className = 'presentation-primary-value';
    const trend = h ? mvLnTrend(h.level) : null;
    if (kind === 'reservoir') {
      if (s && num(s.level)) {
        L1.textContent = 'Elevación';
        V1.textContent = fmt(s.level) + ' msnm';
        L2.textContent = 'Llenado';
        V2.textContent = pct ? fmt(pct.value, 2) + ' %' : 'N/D';
      } else {
        L1.textContent = 'Llenado';
        V1.textContent = pct ? fmt(pct.value, 2) + ' %' : 'N/D';
        L2.textContent = 'Almacenamiento';
        V2.textContent = sto ? fmt(sto.value, 2) + ' Mm³' : 'N/D';
      }
    } else if (s && num(s.level)) {
      L1.textContent = 'Nivel actual';
      V1.textContent = fmt(s.level) + ' m';
      L2.textContent = 'Tendencia';
      V2.textContent = trend === null ? 'N/D' : mvTrendDisplay(trend);
      const d = mvTrendDirection(trend);
      if (d) V2.classList.add(d);
    } else {
      L1.textContent = kind === 'pump' ? 'Flujo de salida' : kind === 'facility' ? 'Conducción 30"' : 'Flujo';
      V1.textContent = s && num(s.flow) ? fmt(s.flow, 0) + ' LPS' : 'N/D';
      L2.textContent = 'Comunicación';
      V2.textContent = stateTxt;
    }
    const rows = [];
    if (kind === 'reservoir') {
      if (sto) rows.push([ 'Almacenamiento', fmt(sto.value, 2) + ' Mm³' ]);
      if (pct) rows.push([ 'Llenado', fmt(pct.value, 2) + ' %' ]);
    } else {
      if (s && num(s.flow) && num(s.level)) rows.push([ kind === 'pump' ? 'Salida' : 'Flujo', fmt(s.flow, 0) + ' LPS' ]);
      for (const q of ex) {
        if (!q || !num(q.value)) continue;
        rows.push([ q.label, fmt(q.value, q.unit === 'kg/cm²' ? 2 : 0) + ' ' + q.unit ]);
      }
    }
    rows.push([ 'Comunicación', stateTxt + (s && s.updated ? ' · ' + s.updated : '') ]);
    $('mvLnFlowHead').textContent = kind === 'reservoir' ? 'Almacenamiento' : 'Lecturas';
    const host = $('mvLnFlows');
    host.replaceChildren();
    for (const [a, b] of rows) {
      const r = document.createElement('div');
      r.className = 'presentation-flow-row';
      const sp = document.createElement('span');
      sp.textContent = a;
      const st = document.createElement('strong');
      st.textContent = b;
      if (s && s.status === 'sin_comunicacion' && a !== 'Comunicación') st.classList.add('stale');
      r.append(sp, st);
      host.appendChild(r);
    }
    const lvlUnit = kind === 'reservoir' ? 'msnm' : 'm';
    $('mvLnLevelName').textContent = kind === 'reservoir' ? 'ELEVACIÓN' : 'NIVEL';
    const showLevel = kind === 'tank' || kind === 'reservoir' || s && num(s.level) || h && h.level.length > 1;
    const showFlow = kind !== 'tank' && kind !== 'reservoir' && (s && num(s.flow) || h && h.flow.length > 1);
    $('mvLnLevelCard').style.display = showLevel ? '' : 'none';
    $('mvLnFlowCard').style.display = showFlow ? '' : 'none';
    mvLnBox.querySelector('.mv-dual-history').style.display = (showLevel || showFlow) && code ? '' : 'none';
    if (showLevel) mvLnChart($('mvLnLevelPlot'), h ? h.level : null, lvlUnit, 'level', $('mvLnLevelLatest'), $('mvLnLevelCount'), $('mvLnLevelTime'));
    if (showFlow) mvLnChart($('mvLnFlowPlot'), h ? h.flow : null, 'LPS', 'flow', $('mvLnFlowLatest'), $('mvLnFlowCount'), $('mvLnFlowTime'));
    const pumps = $('mvLnPumps'), list = $('mvLnPumpList');
    list.replaceChildren();
    const idx = casetaLightById.get(n[0]);
    if (kind === 'pump' && idx !== undefined) {
      const block = document.createElement('section');
      block.className = 'presentation-pump-group';
      const title = document.createElement('div');
      title.className = 'presentation-pump-group-title';
      title.textContent = n[1].toUpperCase();
      block.appendChild(title);
      const count = casetaCounts[idx], grid = document.createElement('div');
      grid.className = 'presentation-pump-grid mv-pump-count-' + Math.min(count, 5);
      for (let i = 0; i < count; i++) {
        const p = s && Array.isArray(s.pumps) ? s.pumps[i] : null;
        const st = p && typeof p.on === 'boolean' ? p.on : null;
        const cat = st === true ? 'on' : st === false ? 'off' : 'unknown';
        const line = document.createElement('div');
        line.className = 'presentation-pump-item ' + cat;
        line.appendChild(pumpMiniature(st));
        const eq = document.createElement('span');
        eq.className = 'presentation-pump-item-eq';
        eq.textContent = 'Equipo ' + String(i + 1).padStart(2, '0');
        const sx = document.createElement('span');
        sx.className = 'presentation-pump-status ' + cat;
        sx.textContent = st === true ? 'Operando' : st === false ? 'Apagado' : 'Sin dato';
        line.append(eq, sx);
        grid.appendChild(line);
      }
      block.appendChild(grid);
      list.appendChild(block);
      pumps.hidden = false;
      $('mvLnPumpNote').hidden = true;
    } else pumps.hidden = true;
  }
  {
    const orig = updatePanel;
    updatePanel = function(n) {
      orig(n);
      mvLnRender(n);
    };
  }
  loadHistory = async function(n) {
    if (!n) return;
    const code = n[5];
    if (code) await mvLnFetchHistory(code);
    if (state.selected === n[0]) mvLnRender(n);
  };
  garrapatasLevel.className = 'mv-ln-level-tile';
  garrapatasLevel.style.cssText = '';
  garrapatasLevel.innerHTML = '<span class="k">NIVEL</span><span class="v">N/D</span><span class="t">SIN DATOS</span>';
  function mvLnTile() {
    const g = live.get('TGRP0001'), lv = g && g.level !== null && Number.isFinite(Number(g.level)) ? Number(g.level) : null;
    const h = mvLnHist.get('TGRP0001'), tr = h ? mvLnTrend(h.level) : null, dir = mvTrendDirection(tr);
    garrapatasLevel.innerHTML = '<span class="k">NIVEL</span><span class="v"></span><span class="t"></span>';
    garrapatasLevel.querySelector('.v').textContent = lv === null ? 'N/D' : lv.toFixed(2) + ' m';
    garrapatasLevel.querySelector('.t').textContent = mvTrendDisplay(tr);
    garrapatasLevel.style.setProperty('--mv-trend', dir === 'up' ? '#69efa8' : dir === 'down' ? '#ff919e' : '#bac9d0');
    garrapatasLevel.style.setProperty('--mv-trend-t', dir === 'up' ? '#7df5af' : dir === 'down' ? '#ff9fa7' : '#bac9d0');
  }
  {
    const orig = updateData;
    updateData = function() {
      orig();
      mvLnTile();
    };
  }
  setInterval(() => {
    mvLnFetchHistory('TGRP0001').then(mvLnTile);
  }, 6e4);
  mvLnFetchHistory('TGRP0001').then(mvLnTile);
  const mvAl = document.createElement('aside');
  mvAl.className = 'mv-alerts';
  mvAl.id = 'mvAlerts';
  mvAl.innerHTML = `<section class="mv-alerts-strip"><div class="mv-alerts-marquee"><div class="mv-alerts-chip"><svg class="mv-alerts-logo" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 5.2c-5.1 0-8.2 3.9-8.2 9v3.6c0 2.6-1.2 4.1-2.5 5.6-.4.5-.1 1.2.5 1.2h20.4c.6 0 .9-.7.5-1.2-1.3-1.5-2.5-3-2.5-5.6v-3.6c0-5.1-3.1-9-8.2-9z" fill="#f2b43b" stroke="#34454e" stroke-width="1.7" stroke-linejoin="round"/><path d="M12.6 26.5a3.4 3.4 0 0 0 6.8 0" fill="none" stroke="#34454e" stroke-width="1.8" stroke-linecap="round"/></svg></div><div class="mv-alerts-marquee-window"><div class="mv-alerts-ticker" id="mvAlertsTicker"></div></div></div><span class="mv-alerts-count" id="mvAlertsCount" hidden>0</span><button class="mv-alerts-toggle" id="mvAlertsToggle" type="button">VER TODOS</button></section><section class="mv-alerts-panel" id="mvAlertsPanel" hidden><div class="mv-alerts-heading"><strong>Alertas activas</strong><button type="button" id="mvAlertsClose">Cerrar</button></div><div class="mv-alerts-list" id="mvAlertsList"></div></section>`;
  document.body.appendChild(mvAl);
  const mvAlertPresentationStyle = document.createElement('style');
  mvAlertPresentationStyle.textContent = `\n    #mvAlerts.mv-present-positioned{position:fixed!important;left:var(--mv-present-alert-left,12px)!important;right:auto!important;top:var(--mv-present-alert-top,12px)!important;bottom:auto!important;max-width:var(--mv-present-alert-width,460px)!important;align-items:flex-start!important;z-index:85!important}\n    #mvAlerts.mv-present-positioned .mv-alerts-strip{box-sizing:border-box!important;max-width:var(--mv-present-alert-width,460px)!important}\n    #mvAlerts.mv-present-short .mv-alerts-marquee,#mvAlerts.mv-present-short.is-cycle-open .mv-alerts-marquee{width:34px!important;flex:0 0 34px!important}\n    #mvAlerts.mv-present-short .mv-alerts-marquee-window{opacity:0!important;visibility:hidden!important;pointer-events:none!important}\n    #mvAlerts.mv-present-compact .mv-alerts-strip{position:relative!important;display:flex!important;align-items:center!important;justify-content:center!important;width:46px!important;min-width:46px!important;max-width:46px!important;height:46px!important;padding:4px!important;gap:0!important;overflow:visible!important}\n    #mvAlerts.mv-present-compact .mv-alerts-marquee,#mvAlerts.mv-present-compact.is-cycle-open .mv-alerts-marquee{width:34px!important;max-width:34px!important;flex:0 0 34px!important;height:34px!important}\n    #mvAlerts.mv-present-compact .mv-alerts-marquee-window{visibility:hidden!important;opacity:0!important;pointer-events:none!important}\n    #mvAlerts.mv-present-compact #mvAlertsToggle{position:absolute!important;inset:0!important;z-index:2!important;display:block!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;opacity:0!important;cursor:pointer!important}\n    #mvAlerts.mv-present-compact #mvAlertsCount:not([hidden]){position:absolute!important;top:-8px!important;right:-8px!important;z-index:3!important;display:flex!important;align-items:center!important;justify-content:center!important;min-width:19px!important;height:19px!important;padding:0 3px!important;border-radius:12px!important;background:#cc1735!important;color:white!important;font:700 11px/1 Arial,sans-serif!important;box-shadow:0 0 0 2px white!important;pointer-events:none!important}\n    #mvAlerts.mv-present-compact #mvAlertsCount[hidden]{display:none!important}\n    #mvAlerts.mv-present-compact .mv-alerts-panel{position:fixed!important;left:var(--mv-present-alert-list-left,12px)!important;right:auto!important;top:var(--mv-present-alert-list-top,65px)!important;bottom:auto!important;width:min(354px,calc(100vw - 24px))!important;max-height:min(52dvh,460px)!important}\n  `;
  document.head.appendChild(mvAlertPresentationStyle);
  let mvAlertFitFrame = 0;
  function mvPositionAlertsForPresentation() {
    const panel = $('presentationPanel');
    const visible = state.auto === 'presentation' && state.alerts && panel && !panel.hidden;
    mvAl.classList.toggle('mv-present-positioned', !!visible);
    mvAl.classList.remove('mv-present-short', 'mv-present-compact');
    if (!visible) return;
    const r = panel.getBoundingClientRect();
    const w = window.innerWidth, h = window.innerHeight;
    const leftSpace = Math.max(0, r.left - 20);
    let x = 12, y = 12, width = Math.min(460, leftSpace);
    if (leftSpace < 480) mvAl.classList.add(leftSpace >= 180 ? 'mv-present-short' : 'mv-present-compact');
    if (leftSpace < 180) {
      const size = 46, gap = 8;
      const choices = [ [ 8, 8 ], [ 8, Math.max(8, h - size - 8) ], [ Math.max(8, w - size - 8), 8 ], [ Math.max(8, w - size - 8), Math.max(8, h - size - 8) ] ];
      const intersects = (px, py) => Math.max(0, Math.min(px + size, r.right + gap) - Math.max(px, r.left - gap)) * Math.max(0, Math.min(py + size, r.bottom + gap) - Math.max(py, r.top - gap));
      choices.sort((a, b) => intersects(a[0], a[1]) - intersects(b[0], b[1]));
      [x, y] = choices[0];
      width = size;
    }
    const listTop = y < h / 2 ? Math.min(h - 70, y + 54) : Math.max(8, y - Math.min(460, h * .52) - 8);
    mvAl.style.setProperty('--mv-present-alert-left', x + 'px');
    mvAl.style.setProperty('--mv-present-alert-top', y + 'px');
    mvAl.style.setProperty('--mv-present-alert-width', Math.max(46, width) + 'px');
    mvAl.style.setProperty('--mv-present-alert-list-left', Math.min(x, Math.max(8, w - 364)) + 'px');
    mvAl.style.setProperty('--mv-present-alert-list-top', listTop + 'px');
  }
  mvAlertReposition = () => {
    if (mvAlertFitFrame) cancelAnimationFrame(mvAlertFitFrame);
    mvAlertFitFrame = requestAnimationFrame(() => {
      mvAlertFitFrame = 0;
      mvPositionAlertsForPresentation();
    });
  };
  const mvAlLabels = {
    com: 'Sin comunicación',
    obs: 'Nivel fuera de parámetros',
    zero: 'Flujo 0'
  };
  let mvAlItems = [], mvAlIndex = 0, mvAlTimer = 0, mvAlReceived = false;
  const mvAlLine = (it, expanded) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = (expanded ? 'mv-alert-item ' : 'mv-alert-line ') + 'mv-alert-' + it.type;
    b.title = 'Localizar ' + it.name + ' en el modelo 3D';
    const dot = document.createElement('span');
    dot.className = 'mv-alert-pin';
    if (expanded) {
      const c = document.createElement('span');
      c.className = 'mv-alert-item-body';
      const hd = document.createElement('span');
      hd.className = 'mv-alert-item-title';
      const nm = document.createElement('strong');
      nm.textContent = it.name;
      const kd = document.createElement('span');
      kd.textContent = mvAlLabels[it.type];
      hd.append(nm, kd);
      const dt = document.createElement('small');
      dt.textContent = it.detail;
      c.append(hd, dt);
      b.append(dot, c);
    } else {
      const c = document.createElement('span');
      c.className = 'mv-alert-marquee-copy';
      const nm = document.createElement('strong');
      nm.textContent = it.name;
      const kd = document.createElement('span');
      kd.className = 'mv-alert-label';
      kd.textContent = mvAlLabels[it.type];
      c.append(nm, kd);
      b.append(dot, c);
    }
    b.addEventListener('click', () => {
      $('mvAlertsPanel').hidden = true;
      mvFocusAlert(it.id);
    });
    return b;
  };
  function mvFocusAlert(id) {
    const i = config.nodes.findIndex(n => n[0] === id);
    if (i < 0) return;
    if (state.auto !== 'presentation') startPresentation();
    jumpPresentation(i - state.presIndex);
    state.paused = true;
    $('presentationPause').textContent = 'Reanudar';
    syncButtons();
    mvAlertReposition();
  }
  function mvAlTicker() {
    clearTimeout(mvAlTimer);
    mvAl.classList.remove('is-cycle-open');
    const t = $('mvAlertsTicker');
    t.replaceChildren();
    if (!mvAlItems.length) {
      const d = document.createElement('div');
      d.className = 'mv-alerts-normal' + (mvAlReceived ? '' : ' is-waiting');
      const p = document.createElement('span');
      p.className = 'mv-alert-pin';
      const x = document.createElement('span');
      x.textContent = mvAlReceived ? 'Sin alertas activas' : 'Esperando lecturas de Telemetría';
      d.append(p, x);
      t.appendChild(d);
      return;
    }
    if (mvAlIndex >= mvAlItems.length) mvAlIndex = 0;
    const it = mvAlItems[mvAlIndex];
    t.appendChild(mvAlLine(it, false));
    mvAlTimer = setTimeout(() => {
      mvAl.classList.add('is-cycle-open');
      mvAlTimer = setTimeout(() => {
        mvAl.classList.remove('is-cycle-open');
        mvAlTimer = setTimeout(() => {
          mvAlIndex = (mvAlIndex + 1) % Math.max(1, mvAlItems.length);
          mvAlTicker();
        }, 480);
      }, 3200);
    }, 2500);
  }
  function mvAlList() {
    const l = $('mvAlertsList');
    l.replaceChildren();
    if (!mvAlItems.length) {
      const p = document.createElement('p');
      p.className = 'mv-alerts-empty';
      p.textContent = 'No hay alertas registradas.';
      l.appendChild(p);
      return;
    }
    for (const it of mvAlItems) l.appendChild(mvAlLine(it, true));
  }
  $('mvAlertsToggle').onclick = () => {
    const p = $('mvAlertsPanel');
    p.hidden = !p.hidden;
    if (!p.hidden) mvAlList();
    mvAlertReposition();
  };
  $('mvAlertsClose').onclick = () => {
    $('mvAlertsPanel').hidden = true;
    mvAlertReposition();
  };
  alertsRefresh = function() {
    const items = [];
    for (const n of config.nodes) {
      const s = getData(n);
      if (!s || !n[5]) continue;
      mvAlReceived = true;
      if (s.status === 'sin_comunicacion') items.push({
        id: n[0],
        name: n[1],
        type: 'com',
        detail: s.updated ? 'Última lectura ' + s.updated : 'Sin hora de lectura confirmada'
      }); else if (s.observation) items.push({
        id: n[0],
        name: n[1],
        type: 'obs',
        detail: Number.isFinite(Number(s.level)) ? fmt(s.level) + ' m' : ''
      }); else if (n[2] === 'pump' && s.status === 'operando' && Number(s.flow) === 0) items.push({
        id: n[0],
        name: n[1],
        type: 'zero',
        detail: 'Flujo 0 LPS'
      });
    }
    const changed = items.map(i => i.type + i.id).join() !== mvAlItems.map(i => i.type + i.id).join();
    mvAlItems = items;
    $('alertBar').hidden = true;
    mvAl.style.display = state.alerts ? '' : 'none';
    const c = $('mvAlertsCount');
    c.textContent = String(items.length);
    c.hidden = !items.length;
    mvAl.classList.toggle('has-active-alerts', items.length > 0);
    mvAl.dataset.ready = 'true';
    mvAl.dataset.severity = items.some(i => i.type === 'com') ? 'com' : items.some(i => i.type === 'obs') ? 'obs' : items.some(i => i.type === 'zero') ? 'zero' : 'normal';
    if (!$('mvAlertsPanel').hidden) mvAlList();
    if (changed || !mvAlTimer) mvAlTicker();
    mvAlertReposition();
  };
  alertsRefresh();
  const mvPl = {
    tiles: [],
    dirty: true,
    rects: []
  };
  {
    const mvTallHist = () => Promise.all(MV_TALL.filter(t => {
      const v = live.get(t[1]);
      return v && v.level !== null;
    }).map(t => mvLnFetchHistory(t[1]))).then(() => {
      mvPl.dirty = true;
    });
    setTimeout(mvTallHist, 4e3);
    setInterval(mvTallHist, 6e4);
  }
  const MV_TW = 512, MV_TH = 128, MV_COLS = 4, MV_ROWS = 8;
  const mvAtlas = document.createElement('canvas');
  mvAtlas.width = MV_TW * MV_COLS;
  mvAtlas.height = MV_TH * MV_ROWS;
  const mvInk = mvAtlas.getContext('2d');
  const mvTex = gl.createTexture();
  const mvPlProg = (() => {
    const p = gl.createProgram();
    gl.attachShader(p, shader(gl.VERTEX_SHADER, 'attribute vec3 aP;attribute vec2 aU;uniform mat4 uVP;varying vec2 vU;void main(){vU=aU;gl_Position=uVP*vec4(aP,1.0);}'));
    gl.attachShader(p, shader(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec2 vU;uniform sampler2D uT;uniform float uDim;void main(){vec4 c=texture2D(uT,vU);if(c.a<.04)discard;gl_FragColor=vec4(c.rgb*uDim,c.a);}'));
    gl.linkProgram(p);
    return p;
  })();
  const mvPlLoc = {
    p: gl.getAttribLocation(mvPlProg, 'aP'),
    u: gl.getAttribLocation(mvPlProg, 'aU'),
    vp: gl.getUniformLocation(mvPlProg, 'uVP'),
    t: gl.getUniformLocation(mvPlProg, 'uT'),
    dim: gl.getUniformLocation(mvPlProg, 'uDim')
  };
  const mvPlBuf = gl.createBuffer();
  function mvRound(x, y, w, h, r) {
    mvInk.beginPath();
    mvInk.moveTo(x + r, y);
    mvInk.arcTo(x + w, y, x + w, y + h, r);
    mvInk.arcTo(x + w, y + h, x, y + h, r);
    mvInk.arcTo(x, y + h, x, y, r);
    mvInk.arcTo(x, y, x + w, y, r);
    mvInk.closePath();
  }
  function mvFit(txt, maxW, big, small, weight) {
    let s = big;
    do {
      mvInk.font = weight + ' ' + s + 'px "Segoe UI",Arial,sans-serif';
      if (mvInk.measureText(txt).width <= maxW) break;
      s -= 2;
    } while (s > small);
    return s;
  }
  function mvTile(i, type, lines, trendDir) {
    const col = i % MV_COLS, row = Math.floor(i / MV_COLS), x = col * MV_TW, y = row * MV_TH;
    mvInk.clearRect(x, y, MV_TW, MV_TH);
    mvInk.save();
    mvInk.textAlign = 'center';
    mvInk.textBaseline = 'middle';
    if (type === 'post') {
      mvInk.fillStyle = '#55646b';
      mvInk.fillRect(x, y, MV_TW, MV_TH);
      mvInk.restore();
      return MV_TW;
    }
    let w;
    if (type === 'level') {
      w = 300;
      const bx = x + (MV_TW - w) / 2, by = y + 6, bh = MV_TH - 12;
      const g = mvInk.createLinearGradient(0, by, 0, by + bh);
      g.addColorStop(0, '#5c7680');
      g.addColorStop(1, '#425f6a');
      mvRound(bx, by, w, bh, 14);
      mvInk.fillStyle = g;
      mvInk.fill();
      mvInk.lineWidth = 4;
      mvInk.strokeStyle = '#c3d2d7';
      mvInk.stroke();
      const tc = trendDir === 'up' ? '#69efa8' : trendDir === 'down' ? '#ff919e' : '#bac9d0';
      mvInk.fillStyle = tc;
      mvInk.fillRect(bx + 14, by + 16, 7, bh - 32);
      mvInk.fillStyle = '#d9e7eb';
      mvInk.font = '700 19px "Segoe UI",Arial,sans-serif';
      mvInk.fillText('NIVEL', x + MV_TW / 2, y + 26);
      mvInk.fillStyle = '#fff';
      mvInk.font = '800 50px "Segoe UI",Arial,sans-serif';
      mvInk.fillText(lines[0], x + MV_TW / 2, y + 64);
      mvInk.fillStyle = trendDir === 'up' ? '#7df5af' : trendDir === 'down' ? '#ff9fa7' : '#bac9d0';
      mvInk.font = '800 24px "Segoe UI",Arial,sans-serif';
      mvInk.fillText(lines[1], x + MV_TW / 2, y + 100);
    } else {
      const two = lines.length > 1;
      const s = mvFit(lines[0], MV_TW - 70, two ? 46 : 58, 22, '800');
      mvInk.font = '800 ' + s + 'px "Segoe UI",Arial,sans-serif';
      let tw = mvInk.measureText(lines[0]).width;
      if (two) {
        mvInk.font = '600 28px "Segoe UI",Arial,sans-serif';
        tw = Math.max(tw, mvInk.measureText(lines[1]).width);
      }
      w = Math.min(MV_TW - 12, Math.max(170, tw + 64));
      const bx = x + (MV_TW - w) / 2, by = y + 8, bh = MV_TH - 16;
      const g = mvInk.createLinearGradient(0, by, 0, by + bh);
      g.addColorStop(0, '#668894');
      g.addColorStop(1, '#456775');
      mvRound(bx, by, w, bh, 13);
      mvInk.fillStyle = g;
      mvInk.fill();
      mvInk.lineWidth = 4;
      mvInk.strokeStyle = '#c2d3d8';
      mvInk.stroke();
      mvInk.fillStyle = '#c7e3e7';
      mvInk.fillRect(bx + 12, by + 14, 5, bh - 28);
      mvInk.fillStyle = '#fff';
      mvInk.font = '800 ' + s + 'px "Segoe UI",Arial,sans-serif';
      mvInk.fillText(lines[0], x + MV_TW / 2 + 4, y + (two ? 46 : 64));
      if (two) {
        mvInk.fillStyle = '#e4eef1';
        mvInk.font = '600 28px "Segoe UI",Arial,sans-serif';
        mvInk.fillText(lines[1], x + MV_TW / 2 + 4, y + 92);
      }
    }
    mvInk.restore();
    return w;
  }
  function mvPresaText() {
    const pr = live.get('PRESACP'), parts = [];
    if (pr && pr.level !== null && Number.isFinite(Number(pr.level))) parts.push(fmt(pr.level) + ' msnm');
    const pc = pr && Array.isArray(pr.extra) ? pr.extra.find(q => q && q.unit === '%') : null;
    if (pc && Number.isFinite(Number(pc.value))) parts.push(fmt(pc.value, 1) + ' %');
    return parts.length ? parts.join(' · ') : 'N/D';
  }
  function mvBuildPlates() {
    mvPl.tiles = [];
    let i = 0;
    mvTile(i, 'post', []);
    const POST = i++;
    for (const n of config.nodes) {
      const lines = [ n[1].toUpperCase() ];
      if (n[2] === 'reservoir') lines.push(mvPresaText());
      const w = mvTile(i, 'name', lines);
      let x = n[3], z = n[4], y, H, post = null;
      if (n[2] === 'reservoir') {
        x = lakeCenter[0];
        z = lakeCenter[1];
        H = 4.2;
        y = 2.4 + H / 2;
      } else if (n[2] === 'pump') {
        H = 1.7;
        y = 6 + H / 2;
        post = [ 5.4, 6.1 ];
      } else if (n[2] === 'tank') {
        const t = tankLabels[0];
        H = 1.3;
        y = (t ? t.y : 5) + .75 + H / 2;
        post = [ t ? t.y : 4.6, (t ? t.y : 4.6) + .8 ];
      } else {
        H = 1.3;
        y = 3.6 + H / 2;
        post = [ 2.6, 3.65 ];
      }
      mvPl.tiles.push({
        id: n[0],
        kind: 'name',
        tile: i,
        w: w,
        H: H,
        x: x,
        y: y,
        z: z,
        post: post,
        postTile: POST
      });
      i++;
    }
    {
      const w = mvTile(i, 'name', [ 'CERRO DE LA SILLA' ]);
      mvPl.tiles.push({
        id: 'silla',
        kind: 'silla',
        tile: i,
        w: w,
        H: 4.2,
        x: -70,
        y: terrainHeight(-76, 2) + 11,
        z: 1,
        post: null
      });
      i++;
    }
    {
      const g = live.get('TGRP0001'), lv = g && g.level !== null && Number.isFinite(Number(g.level)) ? Number(g.level) : null;
      const h = typeof mvLnHist !== 'undefined' ? mvLnHist.get('TGRP0001') : null;
      const tr = h && typeof mvLnTrend === 'function' ? mvLnTrend(h.level) : null;
      const w = mvTile(i, 'level', [ lv === null ? 'N/D' : lv.toFixed(2) + ' m', typeof mvTrendDisplay === 'function' ? mvTrendDisplay(tr) : '' ], typeof mvTrendDirection === 'function' ? mvTrendDirection(tr) : null);
      const t = tankLabels[0];
      if (t) mvPl.tiles.push({
        id: 'level',
        kind: 'level',
        tile: i,
        w: w,
        H: 1.25,
        x: t.x,
        y: t.screenY,
        z: t.z,
        r: t.radius,
        post: null
      });
      i++;
    }
    for (const [, code] of MV_TALL) {
      const v = live.get(code), lv = v && v.level !== null && Number.isFinite(Number(v.level)) ? Number(v.level) : null, p = mvTallPos.get(code);
      if (lv === null || !p) continue;
      const h = typeof mvLnHist !== 'undefined' ? mvLnHist.get(code) : null, tr = h && typeof mvLnTrend === 'function' ? mvLnTrend(h.level) : null;
      const w = mvTile(i, 'level', [ lv.toFixed(2) + ' m', typeof mvTrendDisplay === 'function' ? mvTrendDisplay(tr) : '' ], typeof mvTrendDirection === 'function' ? mvTrendDirection(tr) : null);
      mvPl.tiles.push({
        id: 'level',
        kind: 'level',
        tile: i,
        w: w,
        H: 1.25,
        x: p.x,
        y: .52 + Math.max(.7, Math.min(lv / p.cap, .94) * p.mw),
        z: p.z,
        r: p.r,
        post: null
      });
      i++;
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, mvTex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mvAtlas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const an = gl.getExtension('EXT_texture_filter_anisotropic');
    if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    mvPl.dirty = false;
  }
  const MV_SILLA_SPOTS = [ [ -60, 2 ], [ -62, -14 ], [ -62, 18 ], [ -64, 30 ], [ -64, -26 ], [ -68, 6 ], [ -70, -6 ], [ -70, 22 ] ];
  function mvPlatesDraw(mat, eye, look = state.target) {
    if (mvPl.dirty) mvBuildPlates();
    const v = [], rects = [], pres = state.auto === 'presentation';
    let mvTop = null;
    const uv = (tile, w) => {
      const col = tile % MV_COLS, row = Math.floor(tile / MV_COLS), u0 = (col * MV_TW + (MV_TW - w) / 2) / mvAtlas.width, u1 = (col * MV_TW + (MV_TW + w) / 2) / mvAtlas.width, v0 = row * MV_TH / mvAtlas.height, v1 = (row + 1) * MV_TH / mvAtlas.height;
      return [ u0, u1, v0, v1 ];
    };
    const quad = (cx, cy, cz, rx, rz, W, H, tile, w, up) => {
      const [u0, u1, v0, v1] = uv(tile, w), hw = W / 2, hh = H / 2;
      up = up || [ 0, 1, 0 ];
      const P = (a, b) => [ cx + rx * a + up[0] * b, cy + up[1] * b, cz + rz * a + up[2] * b ];
      const a = P(-hw, -hh), b = P(hw, -hh), c = P(hw, hh), d = P(-hw, hh);
      v.push(...a, u0, v1, ...b, u1, v1, ...c, u1, v0, ...a, u0, v1, ...c, u1, v0, ...d, u0, v0);
      return [ a, b, c, d ];
    };
    let cf = [ look[0] - eye[0], look[1] - eye[1], look[2] - eye[2] ];
    {
      const l = Math.hypot(...cf) || 1;
      cf = cf.map(q => q / l);
    }
    let camR = [ -cf[2], 0, cf[0] ];
    {
      const l = Math.hypot(...camR) || 1;
      camR = camR.map(q => q / l);
    }
    const camU = [ camR[1] * cf[2] - camR[2] * cf[1], camR[2] * cf[0] - camR[0] * cf[2], camR[0] * cf[1] - camR[1] * cf[0] ];
    for (const t of mvPl.tiles) {
      if (t.kind === 'name' && (!state.names || pres && state.selected !== t.id)) continue;
      if (t.kind === 'silla') {
        if (!state.names || pres) continue;
        let best = null, bd = 1e9;
        for (const [ax, az] of MV_SILLA_SPOTS) {
          const ay = terrainHeight(ax, az) + 4.5, q = project([ ax, ay, az ], mat, vw, vh);
          if (!q || q[0] < 110 || q[0] > vw - 110 || q[1] < 70 || q[1] > vh - 90) continue;
          const d = Math.hypot(q[0] - vw * .4, q[1] - vh * .35);
          if (d < bd) {
            bd = d;
            best = [ ax, ay, az ];
          }
        }
        if (!best) continue;
        t.x = best[0];
        t.y = best[1];
        t.z = best[2];
      }
      if (t.kind === 'level' && !state.levels) continue;
      let fx = eye[0] - t.x, fz = eye[2] - t.z;
      const fl = Math.hypot(fx, fz) || 1;
      fx /= fl;
      fz /= fl;
      const rx = fz, rz = -fx;
      let cx = t.x, cz = t.z;
      if (t.kind === 'level') {
        cx += fx * (t.r * 1.04);
        cz += fz * (t.r * 1.04);
      }
      if (t.kind === 'silla') {
        cx += fx * 11;
        cz += fz * 11;
      }
      const H = t.id === 'li00' && t.kind === 'name' ? t.H * Math.max(.38, Math.min(1, Math.hypot(eye[0] - t.x, eye[1] - t.y, eye[2] - t.z) / 60)) : t.H, W = H * t.w / (MV_TH - 16);
      if (t.post) {
        const pw = .09;
        quad(t.x, (t.post[0] + t.post[1]) / 2, t.z, camR[0], camR[2], pw, t.post[1] - t.post[0], t.postTile, MV_TW);
      }
      const v0 = v.length / 5, cs = quad(cx, t.y, cz, camR[0], camR[2], W, H, t.tile, t.w, camU);
      if (t.kind === 'silla') mvTop = [ v0, v.length / 5 - v0 ];
      if (t.kind === 'name') {
        const ps = cs.map(p => project(p, mat, vw, vh)).filter(Boolean);
        if (ps.length === 4) rects.push({
          id: t.id,
          x0: Math.min(...ps.map(p => p[0])),
          x1: Math.max(...ps.map(p => p[0])),
          y0: Math.min(...ps.map(p => p[1])),
          y1: Math.max(...ps.map(p => p[1]))
        });
      }
    }
    mvPl.rects = rects;
    if (!v.length) return;
    for (let a = 0; a < 8; a++) gl.disableVertexAttribArray(a);
    gl.useProgram(mvPlProg);
    gl.uniformMatrix4fv(mvPlLoc.vp, false, mat);
    gl.uniform1f(mvPlLoc.dim, 1 - .28 * eveningBlend);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, mvTex);
    gl.uniform1i(mvPlLoc.t, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, mvPlBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(mvPlLoc.p);
    gl.vertexAttribPointer(mvPlLoc.p, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(mvPlLoc.u);
    gl.vertexAttribPointer(mvPlLoc.u, 2, gl.FLOAT, false, 20, 12);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.CULL_FACE);
    if (mvTop) {
      gl.drawArrays(gl.TRIANGLES, 0, mvTop[0]);
      gl.drawArrays(gl.TRIANGLES, mvTop[0] + mvTop[1], v.length / 5 - mvTop[0] - mvTop[1]);
      gl.disable(gl.DEPTH_TEST);
      gl.drawArrays(gl.TRIANGLES, mvTop[0], mvTop[1]);
      gl.enable(gl.DEPTH_TEST);
    } else gl.drawArrays(gl.TRIANGLES, 0, v.length / 5);
    gl.disable(gl.BLEND);
    gl.disableVertexAttribArray(mvPlLoc.p);
    gl.disableVertexAttribArray(mvPlLoc.u);
    gl.useProgram(program);
  }
  {
    const orig = updateData;
    updateData = function() {
      orig();
      mvPl.dirty = true;

    };
  }
  setInterval(() => {
    mvPl.dirty = true;
  }, 6e4);
  {
    let down = null;
    canvas.addEventListener('pointerdown', e => {
      down = [ e.clientX, e.clientY ];
    });
    canvas.addEventListener('click', e => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
      const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const hit = mvPl.rects.find(q => x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1);
      if (hit) selectNode(hit.id);
    });
  }
  const mvPlStyle = document.createElement('style');
  mvPlStyle.textContent = '#labels .world-sign,#labels .mv-ln-level-tile,#labels .linares-tank-face-reading{display:none!important}';
  mvPlStyle.textContent += '@media(max-width:900px){#presentationPanel:not([hidden]),#presentationPanel.mv-fit-no-scroll:not([hidden]){max-height:44dvh!important;height:auto!important;min-height:0!important;overflow:hidden!important}#presentationPanel .presentation-content,#presentationPanel.mv-fit-no-scroll .presentation-content{flex:1 1 auto!important;min-height:0!important;max-height:30dvh!important;overflow-y:auto!important}}';
  document.head.appendChild(mvPlStyle);
  syncButtons();
  resize();
  loadData();
  mvAlertReposition();
  setInterval(loadData, 1e4);
  setInterval(() => {
    if (state.selected && !document.hidden) {
      const e = nodeById.get(state.selected);
      if (e) loadHistory(e.data);
    }
  }, 6e4);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loadData();
  });
  requestAnimationFrame(() => {
    requestAnimationFrame(render);
    setTimeout(() => document.documentElement.classList.add('mv-scene-ready'), 400);
  });
})();
