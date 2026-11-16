import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const W = 1280, H = 720;
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
const lerp = (a, b, u) => a + (b - a) * u;
const win = (t, a, b, f = 0.5) => clamp((t - a) / f) * clamp((b - t) / f);

// ---------- renderer ----------
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H, false); renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040811);
scene.fog = new THREE.FogExp2(0x060c18, 0.0075);
const camera = new THREE.PerspectiveCamera(40, W / H, 0.5, 900);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.85, 0.55, 0.55);
composer.addPass(bloom);
composer.addPass(new OutputPass());

scene.add(new THREE.HemisphereLight(0x6f94d0, 0x0a0f18, 1.4));
const moon = new THREE.DirectionalLight(0x9db8ff, 1.3); moon.position.set(-40, 80, 30); scene.add(moon);

// ---------- textures ----------
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const gridTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(62,160,255,0.55)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h);
  g.strokeStyle = 'rgba(62,160,255,0.16)'; g.lineWidth = 1;
  for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * w / 4, 0); g.lineTo(i * w / 4, h); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); }
});
gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping; gridTex.repeat.set(30, 30);
const flowTex = canvasTex(128, 16, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, '#0a3d8a'); gr.addColorStop(0.55, '#1f8cff'); gr.addColorStop(0.7, '#bfe9ff'); gr.addColorStop(0.78, '#1f8cff'); gr.addColorStop(1, '#0a3d8a');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
flowTex.wrapS = flowTex.wrapT = THREE.RepeatWrapping;
const winTex = canvasTex(256, 64, (g, w, h) => {
  g.fillStyle = '#0b1220'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 16; x++) { const on = rnd() > 0.35; g.fillStyle = on ? (rnd() > .3 ? '#ffd9a0' : '#9fd8ff') : '#16202e'; g.fillRect(4 + x * 16, 8 + y * 18, 10, 9); }
});

// ---------- ground & world ----------
const groundMat = new THREE.MeshStandardMaterial({ color: 0x0e1824, roughness: 0.95, emissive: 0xffffff, emissiveMap: gridTex, emissiveIntensity: 0.35 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), groundMat);
ground.rotation.x = -Math.PI / 2; scene.add(ground);
gridTex.repeat.set(600 / 8, 600 / 8);

const pad = new THREE.Mesh(new THREE.PlaneGeometry(98, 66), new THREE.MeshStandardMaterial({ color: 0x16222f, roughness: 0.9 }));
pad.rotation.x = -Math.PI / 2; pad.position.set(0, 0.02, -2); scene.add(pad);

// roads
const roadMat = new THREE.MeshStandardMaterial({ color: 0x0d131b, roughness: 0.8 });
const dashMat = new THREE.MeshBasicMaterial({ color: 0xffb35c });
function road(x1, z1, x2, z2) {
  const len = Math.hypot(x2 - x1, z2 - z1), ang = Math.atan2(z2 - z1, x2 - x1);
  const r = new THREE.Mesh(new THREE.PlaneGeometry(len + 4, 4.5), roadMat);
  r.rotation.x = -Math.PI / 2; r.rotation.z = -ang; r.position.set((x1 + x2) / 2, 0.04, (z1 + z2) / 2); scene.add(r);
  for (let s = 2; s < len; s += 5) {
    const d = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.18), dashMat);
    d.rotation.x = -Math.PI / 2; d.rotation.z = -ang; d.position.set(x1 + (x2 - x1) * s / len, 0.06, z1 + (z2 - z1) * s / len); scene.add(d);
  }
  // lamps
  for (let s = 0; s <= len; s += 12) {
    const px = x1 + (x2 - x1) * s / len - Math.sin(ang) * 3, pz = z1 + (z2 - z1) * s / len + Math.cos(ang) * 3;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4, 6), new THREE.MeshStandardMaterial({ color: 0x334455 }));
    pole.position.set(px, 2, pz); scene.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe3b0 }));
    bulb.position.set(px, 4.1, pz); scene.add(bulb);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(3.2, 24), new THREE.MeshBasicMaterial({ color: 0xffcf8a, transparent: true, opacity: 0.035, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(px, 0.07, pz); scene.add(pool);
  }
}
road(-52, 34, 52, 34); road(-52, -38, 52, -38); road(-52, -38, -52, 34); road(52, -38, 52, 34); road(-110, 2, -52, 2);

// fence glow
const fence = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-48, -35], [48, -35], [48, 31], [-48, 31]].map(p => new THREE.Vector3(p[0], 0.9, p[1]))), new THREE.LineBasicMaterial({ color: 0x2b6fb0, transparent: true, opacity: 0.6 }));
scene.add(fence);

// control building
const bld = new THREE.Group();
const bMat = new THREE.MeshStandardMaterial({ color: 0x1b2635, roughness: 0.6 });
const wMat = new THREE.MeshStandardMaterial({ color: 0x111, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 1.2 });
const bBox = new THREE.Mesh(new THREE.BoxGeometry(16, 5, 8), [wMat, wMat, bMat, bMat, wMat, wMat]);
bBox.position.y = 2.5; bld.add(bBox);
const roofE = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(16, 5, 8)), new THREE.LineBasicMaterial({ color: 0xff8a1f }));
roofE.position.y = 2.5; bld.add(roofE);
bld.position.set(-2, 0, 24); scene.add(bld);
// antenna
const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, 14, 6), new THREE.MeshStandardMaterial({ color: 0x55667a }));
ant.position.set(4, 12, 24); scene.add(ant);
const antL = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3b4e })); antL.position.set(4, 19.2, 24); scene.add(antL);

// trees
const treeGeo = new THREE.ConeGeometry(1.4, 4.5, 6); treeGeo.translate(0, 2.25, 0);
const trees = new THREE.InstancedMesh(treeGeo, new THREE.MeshStandardMaterial({ color: 0x0d2a22, roughness: 1 }), 420);
const m4 = new THREE.Matrix4();
for (let i = 0; i < 420; i++) {
  let x, z; do { x = (rnd() - .5) * 240; z = (rnd() - .5) * 200; } while (Math.abs(x) < 58 && Math.abs(z + 2) < 44 || (Math.abs(z - 2) < 5 && x < -50));
  const s = 0.7 + rnd() * 1.1; m4.compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion(), new THREE.Vector3(s, s * (0.8 + rnd() * .6), s)); trees.setMatrixAt(i, m4);
}
scene.add(trees);
// hills
for (let i = 0; i < 14; i++) {
  const a = i / 14 * Math.PI * 2 + rnd() * .3, r = 230 + rnd() * 60;
  const h = new THREE.Mesh(new THREE.SphereGeometry(60 + rnd() * 40, 16, 8), new THREE.MeshStandardMaterial({ color: 0x07111a, roughness: 1 }));
  h.scale.y = 0.35 + rnd() * .25; h.position.set(Math.cos(a) * r, -6, Math.sin(a) * r); scene.add(h);
}
// stars
{
  const g = new THREE.BufferGeometry(), p = [];
  for (let i = 0; i < 1500; i++) { const th = rnd() * Math.PI * 2, ph = rnd() * 0.45 * Math.PI; p.push(Math.cos(th) * Math.cos(ph) * 600, Math.sin(ph) * 600 + 20, Math.sin(th) * Math.cos(ph) * 600); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  const s = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xbfd6ff, size: 1.3, sizeAttenuation: false, fog: false }));
  scene.add(s);
}

// ---------- tanks ----------
const T = [
  { k: 'SR2', n: 'SANTA ROSA 2', x: -28, z: 12, r: 4, h: 8, l: 3.41, tr: -0.24 },
  { k: 'NCC', n: 'NUEVA CASTILLA CIRCULAR', x: -9, z: 13, r: 4.2, h: 8, l: 5.40, tr: -0.12 },
  { k: 'NCR', n: 'NUEVA CASTILLA RECTANG.', x: -12, z: -7, rect: true, w: 11, d: 6, h: 7, l: 3.68, tr: -0.10 },
  { k: 'CIR', n: 'CIRCULAR', x: -32, z: -12, r: 3.5, h: 7, l: 4.12, tr: 0.05 },
  { k: 'CAM', n: 'CASTILLA AMP.', x: -22, z: -25, r: 3, h: 6, l: 3.90, tr: -0.03 },
  { k: 'ALR', n: 'ALIANZA REAL', x: 2, z: -16, r: 3.2, h: 7, l: 4.80, tr: 0.02 },
  { k: 'GA1', n: 'GARCIA 1', x: 14, z: -6, r: 3.8, h: 8, l: 4.60, tr: 0.08 },
  { k: 'GA2', n: 'GARCIA 2', x: 6, z: 16, r: 4.5, h: 8, l: 2.90, tr: -0.05 },
  { k: 'LCZ', n: 'LA CRUZ', x: 26, z: 18, r: 5, h: 8, l: 2.03, tr: -0.06 },
  { k: 'F1', n: 'FRAILE 1', x: 24, z: -8, r: 2.6, h: 7, l: 4.40, tr: 0.01 },
  { k: 'F2', n: 'FRAILE 2', x: 32, z: -5, r: 2.6, h: 7, l: 4.62, tr: 0.03 },
  { k: 'F3', n: 'FRAILE 3', x: 26, z: -22, r: 2.6, h: 7, l: 3.95, tr: -0.02 },
  { k: 'F4', n: 'FRAILE 4', x: 38, z: -20, r: 2.6, h: 7, l: 4.05, tr: -0.16 },
  { k: 'F5', n: 'FRAILE 5', x: 33, z: -29, r: 2.6, h: 7, l: 4.21, tr: 0.00 },
];
const byK = {}; T.forEach(t => byK[t.k] = t);
const metal = new THREE.MeshStandardMaterial({ color: 0x8a9bb0, metalness: 0.6, roughness: 0.4 });
const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a2330, roughness: 0.8 });
const ladderMat = new THREE.MeshStandardMaterial({ color: 0xd98a2b, emissive: 0x8a4a00, emissiveIntensity: 0.4 });
const shells = [], waters = [], rims = [], ribsAll = [];

function waveGeo(r) { const g = new THREE.CircleGeometry(r, 40); g.rotateX(-Math.PI / 2); g.userData.base = g.attributes.position.array.slice(); return g; }

for (const t of T) {
  const g = new THREE.Group(); g.position.set(t.x, 0, t.z); scene.add(g); t.g = g;
  const sx = t.rect ? t.w / 2 + 1.6 : t.r + 1.4, sz = t.rect ? t.d / 2 + 1.6 : t.r + 1.4;
  const base = new THREE.Mesh(new THREE.BoxGeometry(sx * 2, 0.6, sz * 2), baseMat); base.position.y = 0.3; g.add(base);
  const be = new THREE.LineSegments(new THREE.EdgesGeometry(base.geometry), new THREE.LineBasicMaterial({ color: 0x2a7fd0, transparent: true, opacity: .7 })); be.position.y = .3; g.add(be);
  const maxL = t.h * 0.85; t.max = maxL;
  const shellMat = new THREE.MeshStandardMaterial({ color: 0xa8cdf0, transparent: true, opacity: 0.16, roughness: 0.15, metalness: 0.2, side: THREE.DoubleSide, depthWrite: false, emissive: 0x2a5d8f, emissiveIntensity: 0.15 });
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x0b5fd6, emissive: 0x0b55c8, emissiveIntensity: 0.55, transparent: true, opacity: 0.88, roughness: 0.2 });
  const topMat = new THREE.MeshStandardMaterial({ color: 0x2f8cff, emissive: 0x1a6ee8, emissiveIntensity: 0.9, transparent: true, opacity: 0.95, roughness: 0.1 });
  const rimMat = new THREE.MeshBasicMaterial({ color: 0x5fd0ff });
  let shell, water, top;
  if (t.rect) {
    shell = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), shellMat); shell.position.y = 0.6 + t.h / 2;
    water = new THREE.Mesh(new THREE.BoxGeometry(t.w * .97, 1, t.d * .95), waterMat);
    const tg = new THREE.PlaneGeometry(t.w * .97, t.d * .95, 30, 16); tg.rotateX(-Math.PI / 2); tg.userData.base = tg.attributes.position.array.slice();
    top = new THREE.Mesh(tg, topMat);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(shell.geometry), new THREE.LineBasicMaterial({ color: 0x5fd0ff, transparent: true, opacity: .8 })); e.position.copy(shell.position); g.add(e); rims.push(e);
  } else {
    shell = new THREE.Mesh(new THREE.CylinderGeometry(t.r, t.r, t.h, 48, 1, true), shellMat); shell.position.y = 0.6 + t.h / 2;
    water = new THREE.Mesh(new THREE.CylinderGeometry(t.r * .965, t.r * .965, 1, 40), waterMat);
    top = new THREE.Mesh(waveGeo(t.r * .965), topMat);
    for (const y of [0.65, 0.6 + t.h, 0.6 + t.h * 0.5]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(t.r + 0.05, y === 0.6 + t.h * 0.5 ? 0.03 : 0.09, 6, 64), rimMat);
      rim.rotation.x = Math.PI / 2; rim.position.y = y; g.add(rim); rims.push(rim);
    }
    const n = Math.round(t.r * 4); const ribs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, t.h, 0.12), metal.clone(), n);
    ribs.material.transparent = true;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; m4.makeTranslation(Math.cos(a) * (t.r + .06), 0.6 + t.h / 2, Math.sin(a) * (t.r + .06)); ribs.setMatrixAt(i, m4); }
    g.add(ribs); ribsAll.push(ribs);
    // ladder
    const la = new THREE.Group();
    for (const s of [-0.35, 0.35]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, t.h + 1.2, 0.08), ladderMat); rail.position.set(s, (t.h + 1.2) / 2 + 0.6, 0); la.add(rail); }
    for (let y = 1.2; y < t.h + 1.5; y += 0.6) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.05), ladderMat); st.position.set(0, y, 0); la.add(st); }
    la.position.set(t.r + 0.35, 0, 0); la.rotation.y = rnd() * 6; la.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), la.rotation.y + Math.PI / 2); g.add(la);
  }
  water.renderOrder = 1; shell.renderOrder = 3; top.renderOrder = 2;
  g.add(water, top, shell);
  t.shell = shell; t.water = water; t.top = top; t.shellMat = shellMat; t.rimMat = rimMat; t.waterMat = waterMat; t.topMat = topMat;
  shells.push(shell);
  // alert ring
  const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.25, 64), new THREE.MeshBasicMaterial({ color: 0xff2a40, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.7; g.add(ring); t.ring = ring;
  // scan disc
  const scan = new THREE.Mesh(new THREE.RingGeometry((t.r || 4) + 0.2, (t.r || 4) + 0.55, 64), new THREE.MeshBasicMaterial({ color: 0x7fe4ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  scan.rotation.x = -Math.PI / 2; g.add(scan); t.scan = scan;
}

// ---------- pumps ----------
const pumps = [];
function station(x0, z0, n, dx, dz, name) {
  const st = new THREE.Group(); scene.add(st);
  const len = n * 1.7 + 1.2;
  const padm = new THREE.Mesh(new THREE.BoxGeometry(dx ? len : 3.6, 0.4, dz ? len : 3.6), baseMat);
  padm.position.set(x0 + (dx ? (n - 1) * 1.7 / 2 : 0), 0.2, z0 + (dz ? (n - 1) * 1.7 / 2 : 0)); st.add(padm);
  for (let i = 0; i < n; i++) {
    const p = new THREE.Group(); p.position.set(x0 + i * 1.7 * dx, 0.4, z0 + i * 1.7 * dz);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 1.6, 20), new THREE.MeshStandardMaterial({ color: 0x26323f, metalness: .7, roughness: .35 })); body.position.y = 0.8; p.add(body);
    const bandM = new THREE.MeshBasicMaterial({ color: 0x35f08a });
    for (const y of [0.45, 1.1]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.67, 0.67, 0.14, 20), bandM); b.position.y = y; p.add(b); }
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.9, 16), new THREE.MeshStandardMaterial({ color: 0x3c4b5c, metalness: .6, roughness: .4 })); motor.position.y = 2.05; p.add(motor);
    const fan = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.14), new THREE.MeshBasicMaterial({ color: 0xbff7d6 })); fan.position.y = 2.55; p.add(fan);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.6, 10), metal); pipe.rotation.z = Math.PI / 2; pipe.position.set(0, 0.6, 0); if (dx) pipe.rotation.set(Math.PI / 2, 0, 0); p.add(pipe);
    st.add(p); pumps.push({ g: p, bandM, fan, standby: name === 'SR' && i === 4 });
  }
}
station(-21, 6.5, 6, 1, 0, 'SR');
station(-3, -9, 4, 0, 1, 'NC');
station(18.5, -2, 4, 1, 0, 'GA');
station(27, -16.6, 4, 1, 0, 'FR');

// ---------- pipes ----------
const pipeMats = [];
const flowLabels = [];
function pipe(pts, rad = 0.42, label) {
  const v = pts.map(p => new THREE.Vector3(p[0], 0.75, p[1]));
  const path = new THREE.CurvePath(); let L = 0;
  for (let i = 0; i < v.length - 1; i++) { path.add(new THREE.LineCurve3(v[i], v[i + 1])); L += v[i].distanceTo(v[i + 1]); }
  const tex = flowTex.clone(); tex.needsUpdate = true; tex.repeat.set(L / 3.2, 1);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.95 });
  const tube = new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(8, Math.round(L * 2)), rad, 10, false), mat); scene.add(tube);
  const glow = new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(8, Math.round(L * 2)), rad * 1.9, 10, false), new THREE.MeshBasicMaterial({ color: 0x1a7dff, transparent: true, opacity: 0.12, depthWrite: false }));
  scene.add(glow);
  // joint caps
  for (const p of v) { const c = new THREE.Mesh(new THREE.SphereGeometry(rad * 1.25, 12, 8), metal); c.position.copy(p); scene.add(c); }
  pipeMats.push({ tex, mat, glow, L });
  if (label) flowLabels.push({ pos: new THREE.Vector3(label[0], 1.6, label[1]), text: label[2] });
}
pipe([[-110, 2], [30, 2], [30, -14], [40, -14]], 0.6, [-62, 2, 'FLUJO A MONTERREY V · 3,188 LPS']);
pipe([[-28, 2], [-28, 7.8]], 0.38, [-28, 5, 'SANTA ROSA 2 · 1,894 LPS']);
pipe([[-21, 2], [-21, 6.5], [-12.4, 6.5], [-12.4, 9.5]], 0.32);
pipe([[-9, 2], [-9, 8.7]], 0.38);
pipe([[-12, 2], [-12, -3.8]], 0.38, [-12, -1, '1,303 LPS']);
pipe([[-3, 2], [-3, -9]], 0.3);
pipe([[-32, 2], [-32, -8.4]], 0.34);
pipe([[-22, 2], [-22, -21.9]], 0.32, [-22, -16, '412 LPS']);
pipe([[2, 2], [2, -12.7]], 0.32);
pipe([[14, 2], [14, -2.1]], 0.38);
pipe([[6, 2], [6, 11.4]], 0.38, [6, 7.5, 'GASTO GARCIA 2 A RED 24 · 163 LPS']);
pipe([[26, 2], [26, 12.9]], 0.4, [26, 8, '2,056 LPS']);
pipe([[24, -14], [24, -5.3]], 0.28);
pipe([[32, -14], [32, -2.3]], 0.28);
pipe([[26, -14], [26, -19.3]], 0.28);
pipe([[38, -14], [38, -17.3]], 0.28, [40, -12, 'FRAILES · 202 LPS']);
pipe([[33.5, -14], [33.5, -26.3]], 0.28);

// flow particles along trunk
const partGeo = new THREE.BufferGeometry(); const NP = 160; partGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(NP * 3), 3));
const parts = new THREE.Points(partGeo, new THREE.PointsMaterial({ color: 0xbfefff, size: 0.45, transparent: true, opacity: 0.9, depthWrite: false }));
scene.add(parts);
const trunk = [[-110, 2], [30, 2], [30, -14], [40, -14]].map(p => new THREE.Vector3(p[0], 1.45, p[1]));
const trunkLen = []; { let acc = 0; for (let i = 0; i < trunk.length - 1; i++) { trunkLen.push(acc); acc += trunk[i].distanceTo(trunk[i + 1]); } trunkLen.push(acc); }
function trunkAt(s) { s = ((s % trunkLen.at(-1)) + trunkLen.at(-1)) % trunkLen.at(-1); for (let i = 0; i < trunk.length - 1; i++) if (s <= trunkLen[i + 1]) return trunk[i].clone().lerp(trunk[i + 1], (s - trunkLen[i]) / (trunkLen[i + 1] - trunkLen[i])); return trunk.at(-1).clone(); }

// ---------- labels ----------
const labelsEl = document.getElementById('labels');
for (const t of T) {
  const d = document.createElement('div'); d.className = 'lbl'; d.innerHTML = `<div class="nm">${t.n}</div><div class="lv">${t.l.toFixed(2)} m <span style="color:${t.tr < 0 ? '#ff6b7a' : '#35f08a'}">${t.tr < 0 ? '▼' : '▲'}${Math.abs(t.tr).toFixed(2)}</span></div>`;
  labelsEl.appendChild(d); t.lbl = d;
}
for (const f of flowLabels) { const d = document.createElement('div'); d.className = 'flbl'; d.textContent = f.text; labelsEl.appendChild(d); f.el = d; }
const tlist = document.getElementById('tlist');
for (const t of T) { const r = document.createElement('div'); r.className = 'trow'; r.innerHTML = `<i class="dot"></i><span class="n">${t.n}</span><span class="m">${t.l.toFixed(2)} m</span><span class="tr" style="color:${t.tr < 0 ? '#ff6b7a' : '#35f08a'}">${t.tr < 0 ? '▼' : '▲'}${Math.abs(t.tr).toFixed(2)}</span>`; tlist.appendChild(r); t.row = r; }

// charts
function series(n, f) { return Array.from({ length: n }, (_, i) => f(i / (n - 1))); }
const lvlS = series(40, u => 3.68 - 0.27 * u + 0.05 * Math.sin(u * 9));
const flwS = series(40, u => 1650 + (u > 0.72 ? 380 : 0) + 90 * Math.sin(u * 14) + 40 * Math.cos(u * 31));
function drawChart(svg, s, prog, color, fill) {
  const w = 140, h = 62, mn = Math.min(...s), mx = Math.max(...s);
  const n = Math.max(2, Math.round(s.length * prog));
  const pts = s.slice(0, n).map((v, i) => `${(i / (s.length - 1) * w).toFixed(1)},${(h - 4 - (v - mn) / (mx - mn) * (h - 12)).toFixed(1)}`);
  const last = pts.at(-1).split(',');
  svg.innerHTML = `<line x1="0" y1="${h - 1}" x2="${w}" y2="${h - 1}" stroke="#ffffff18"/><line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="#ffffff0c"/>
  <polygon points="0,${h} ${pts.join(' ')} ${last[0]},${h}" fill="${fill}"/><polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="1.6"/>
  <circle cx="${last[0]}" cy="${last[1]}" r="2.6" fill="#fff"/>`;
}

// ---------- minimap ----------
const mapc = document.getElementById('mapc'), mg = mapc.getContext('2d');
const mx = x => 100 + x * 1.75, mz = z => 70 + z * 1.75;
function drawMap(t) {
  mg.clearRect(0, 0, 200, 136);
  mg.strokeStyle = '#ffffff10'; for (let i = 0; i < 200; i += 12) { mg.beginPath(); mg.moveTo(i, 0); mg.lineTo(i, 136); mg.stroke(); } for (let i = 0; i < 136; i += 12) { mg.beginPath(); mg.moveTo(0, i); mg.lineTo(200, i); mg.stroke(); }
  mg.strokeStyle = '#2b6fb0'; mg.strokeRect(mx(-48), mz(-35), 96 * 1.75, 66 * 1.75);
  mg.strokeStyle = '#1f8cff'; mg.lineWidth = 1.5; mg.beginPath(); mg.moveTo(0, mz(2)); mg.lineTo(mx(30), mz(2)); mg.lineTo(mx(30), mz(-14)); mg.lineTo(mx(40), mz(-14)); mg.stroke(); mg.lineWidth = 1;
  for (const k of T) {
    const al = k.k === 'F4' && t > 21; mg.fillStyle = al ? (Math.sin(t * 10) > 0 ? '#ff3b4e' : '#5a1520') : '#3ec8ff';
    if (k.rect) mg.fillRect(mx(k.x - k.w / 2), mz(k.z - k.d / 2), k.w * 1.75, k.d * 1.75);
    else { mg.beginPath(); mg.arc(mx(k.x), mz(k.z), Math.max(2.5, k.r * 1.6), 0, 7); mg.fill(); }
  }
  // camera
  const cx = mx(camera.position.x), cz = mz(camera.position.z);
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir); const a = Math.atan2(dir.z, dir.x);
  mg.fillStyle = 'rgba(255,138,31,.18)'; mg.beginPath(); mg.moveTo(cx, cz); mg.arc(cx, cz, 60, a - .38, a + .38); mg.closePath(); mg.fill();
  mg.fillStyle = '#ff8a1f'; mg.beginPath(); mg.arc(clamp(cx, 3, 197), clamp(cz, 3, 133), 3, 0, 7); mg.fill();
}

// ---------- camera choreography ----------
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const orbit = (c, r, h, a, fov = 40) => ({ p: V(c.x + Math.cos(a) * r, h, c.z + Math.sin(a) * r), t: c.clone(), fov });
const SR = V(-28, 4, 12), F4 = V(38, 3.5, -20), PU = V(-18, 1.6, 6.5);
const shots = [
  { t0: 0, t1: 9.2, f: u => orbit(V(0, 0, -2), lerp(118, 92, u), lerp(70, 52, u), lerp(0.95, 1.55, u)) },
  { t0: 9.2, t1: 11.4, fly: 1, arc: 6 },
  { t0: 11.4, t1: 15.6, f: u => orbit(SR, lerp(23, 19, u), lerp(10, 8, u), lerp(1.2, 1.75, u), 42) },
  { t0: 15.6, t1: 16.6, fly: 1, arc: 0 },
  { t0: 16.6, t1: 21.6, f: u => orbit(PU, lerp(17, 15, u), lerp(6.5, 8.5, u), lerp(1.45, 2.95, u), 46) },
  { t0: 21.6, t1: 23.8, fly: 1, arc: 18 },
  { t0: 23.8, t1: 28.0, f: u => orbit(F4, lerp(22, 17, u), lerp(12, 8, u), lerp(1.0, 1.75, u), 42) },
  { t0: 28.0, t1: 30.0, fly: 1, arc: 20 },
  { t0: 30.0, t1: 34.0, f: u => ({ p: V(lerp(-4, 4, u), lerp(140, 118, u), lerp(18, 12, u)), t: V(0, 0, -2), fov: 42 }) },
  { t0: 34.0, t1: 35.6, fly: 1, arc: 0 },
  { t0: 35.6, t1: 40, f: u => orbit(V(0, 2, -2), lerp(58, 74, u), lerp(9, 24, u), lerp(2.0, 2.45, u), 44) },
];
function shotAt(t) {
  for (let i = 0; i < shots.length; i++) {
    const s = shots[i]; if (t > s.t1 && i < shots.length - 1) continue;
    const u = clamp((t - s.t0) / (s.t1 - s.t0));
    if (!s.fly) return s.f(u);
    const a = shots[i - 1].f(1), b = shots[i + 1].f(0), e = ease(u);
    const p = a.p.clone().lerp(b.p, e); p.y += Math.sin(Math.PI * e) * s.arc;
    return { p, t: a.t.clone().lerp(b.t, e), fov: lerp(a.fov, b.fov, e) };
  }
}

// ---------- HUD timeline ----------
const $ = id => document.getElementById(id);
const LOG = [
  [0.2, 'in', 'SCADA', 'conexión establecida · 14/14 tanques en línea'],
  [1.0, 'ok', 'RTU-07', 'lectura de nivel recibida · Santa Rosa 2'],
  [2.0, 'ok', 'PLC', 'estación de bombeo SR · 5 equipos operando'],
  [4.5, 'in', 'FLUJO', 'Monterrey V · 3,188 LPS estable'],
  [7.0, 'ok', 'RTU-12', 'Nueva Castilla Rect. · 3.68 m'],
  [9.6, 'in', 'CAM', 'enfoque · Santa Rosa 2'],
  [12.2, 'ok', 'HIST', 'tendencia 24 h cargada · nivel / flujo'],
  [16.8, 'in', 'VISTA', 'modo corte / rayos X activado'],
  [18.5, 'ok', 'EQ-05', 'en respaldo · listo para arranque'],
  [21.2, 'wa', 'ALERTA', 'FRAILE 4 · nivel fuera de parámetros'],
  [22.4, 'wa', 'ALERTA', 'tendencia −0.16 m/h · notificación enviada'],
  [25.0, 'in', 'OPER', 'arranque remoto EQ-02 Frailes solicitado'],
  [27.0, 'ok', 'PLC', 'EQ-02 Frailes · operando'],
  [30.2, 'in', 'VISTA', 'vista planta · red de conducción'],
  [33.0, 'ok', 'SYS', 'balance hidráulico verificado'],
  [36.0, 'ok', 'SYS', 'sincronización completa'],
];
const clk = s => { const tot = 19 * 3600 + 24 * 60 + Math.floor(s); return [Math.floor(tot / 3600), Math.floor(tot / 60) % 60, tot % 60].map(n => String(n).padStart(2, '0')).join(':'); };
const TOASTS = [
  [9.5, 11.9, '', 'ENFOQUE · SANTA ROSA 2', 'acercamiento a tanque y estación de bombeo'],
  [16.7, 19.2, '', 'CORTE · RAYOS X', 'vista interior · nivel de agua y equipos de bombeo'],
  [21.3, 27.2, 'alert', '⚠ ALERTA · FRAILE 4', 'nivel fuera de parámetros · 4.05 m ▼ −0.16 m'],
  [30.1, 32.6, '', 'VISTA PLANTA', 'red de conducción · flujos en LPS'],
];
const MODES = [[0, 'VISTA GENERAL', '14 tanques · 26 bombas · 4 estaciones', 'aereo'], [9.4, 'TANQUE', 'Santa Rosa 2 · tanque 1 de 14', 'tanque'], [16.6, 'CORTE / RAYOS X', 'estación de bombeo Santa Rosa', 'corte'], [21.3, 'ALERTAS', '1 alerta activa · Fraile 4', 'alerta'], [29.8, 'VISTA PLANTA', 'red de conducción · 17 líneas', 'planta'], [35, 'VISTA GENERAL', 'sistema estable · 14/14 en línea', 'general']];
function slideIn(el, t, t0, dir) { const e = ease((t - t0) / 0.8); el.style.opacity = e; el.style.transform = `translate${dir === 'x' ? 'X' : 'Y'}(${(1 - e) * (el.id === 'kpi' || el.id === 'tanks' || el.id === 'log' ? -40 : 40)}px)`; }

const tmpV = new THREE.Vector3();
function updateHUD(t) {
  // intro
  const typed = 'MONTERREY V'; $('introT').textContent = typed.slice(0, Math.floor(clamp((t - 0.2) / 1.1) * typed.length));
  $('introL').style.width = (ease((t - 0.6) / 1.2) * 360) + 'px';
  $('introC').textContent = t < 1.6 ? 'INICIALIZANDO GEMELO DIGITAL…' : 'SISTEMA EN LÍNEA · 14/14 TANQUES';
  $('intro').style.opacity = 1 - ease((t - 2.4) / 0.9); $('intro').style.display = t > 3.4 ? 'none' : 'flex';
  $('clk').textContent = clk(t) + ' CST'; $('dclk').textContent = clk(t);
  slideIn($('kpi'), t, 3.2, 'x'); slideIn($('tanks'), t, 3.6, 'x'); slideIn($('ops'), t, 3.4, 'x'); slideIn($('log'), t, 3.9, 'y'); slideIn($('map'), t, 4.1, 'y');
  $('topbar').style.opacity = ease((t - 3.0) / 0.6); $('mode').style.opacity = ease((t - 4.2) / 0.6);
  // kpis
  const c = ease((t - 3.6) / 2.2);
  $('k1').textContent = Math.round(10250 * c).toLocaleString('en-US') + ' L/S'; $('b1').style.width = 78 * c + '%';
  $('k2').textContent = Math.round((3188 + (t > 6 ? Math.sin(t * 2) * 6 : 0)) * c).toLocaleString('en-US') + ' LPS'; $('b2').style.width = 64 * c + '%';
  const on = t > 27 ? 27 : 26; $('k3').textContent = Math.round(on * c); $('b3').style.width = on / 30 * 100 * c + '%';
  $('k4').textContent = Math.round(8 * c); $('b4').style.width = 8 / 30 * 100 * c + '%';
  $('k5').textContent = (4.0 * c).toFixed(2) + ' m'; $('b5').style.width = 57 * c + '%';
  $('k6').textContent = t > 21.2 ? '1' : '0';
  $('alt').style.width = clamp(camera.position.y / 140) * 100 + '%';
  // log
  const lines = LOG.filter(l => l[0] <= t).slice(-6);
  $('loglines').innerHTML = lines.map(l => `<div><span class="t">[${clk(l[0])}]</span> <span class="${l[1]}">${l[2].padEnd(6, ' ')}</span> ${l[3]}</div>`).join('');
  // modes
  let md = MODES[0]; for (const m of MODES) if (t >= m[0]) md = m;
  $('modeT').textContent = md[1]; $('modeS').textContent = md[2];
  document.querySelectorAll('.op[data-k]').forEach(o => o.classList.toggle('on', o.dataset.k === md[3]));
  // toast
  const ts = TOASTS.find(x => t >= x[0] - 0.3 && t <= x[1] + 0.3); const toast = $('toast');
  if (ts) { toast.className = ts[2]; toast.innerHTML = `${ts[3]}<small>${ts[4]}</small>`; const o = win(t, ts[0], ts[1], 0.3); toast.style.opacity = ts[2] === 'alert' ? o * (0.75 + 0.25 * Math.sin(t * 9)) : o; toast.style.transform = `translateX(-50%) translateY(${(1 - o) * -10}px)`; }
  else toast.style.opacity = 0;
  // detail
  const dv = win(t, 12.0, 16.2, 0.5); const d = $('detail'); d.style.opacity = dv; d.style.transform = `translateX(${(1 - dv) * 30}px)`;
  const prog = ease((t - 12.2) / 1.8);
  drawChart($('c1'), lvlS, prog, '#3ec8ff', 'rgba(31,140,255,.28)'); drawChart($('c2'), flwS, prog, '#9fb3c8', 'rgba(159,179,200,.18)');
  // tank rows
  for (const k of T) k.row.classList.toggle('alert', k.k === 'F4' && t > 21.2);
  // labels
  const planMode = win(t, 29.8, 34.2, 0.8);
  for (const k of T) {
    tmpV.set(k.x, 0.6 + k.h + 0.9, k.z).project(camera);
    const vis = tmpV.z < 1 && Math.abs(tmpV.x) < 1.1 && Math.abs(tmpV.y) < 1.1;
    const dist = camera.position.distanceTo(k.g.position);
    k.lbl.style.display = vis ? 'block' : 'none';
    k.lbl.style.left = ((tmpV.x + 1) / 2 * W) + 'px'; k.lbl.style.top = ((1 - tmpV.y) / 2 * H) + 'px';
    const sc = clamp(30 / dist, 0.8, 1.35) * (1 - planMode * 0.15);
    k.lbl.style.transform = `translate(-50%,-100%) scale(${sc})`; k.lbl.style.transformOrigin = '50% 100%';
    k.lbl.style.opacity = ease((t - 3.5) / 1) * (dist > 60 ? 0.85 : 1);
    k.lbl.style.zIndex = Math.round(1000 - dist);
    k.lbl.classList.toggle('alert', k.k === 'F4' && t > 21.2);
  }
  for (const f of flowLabels) {
    tmpV.copy(f.pos).project(camera); const vis = tmpV.z < 1 && Math.abs(tmpV.x) < 1.05 && Math.abs(tmpV.y) < 1.05;
    f.el.style.display = vis ? 'block' : 'none'; f.el.style.left = ((tmpV.x + 1) / 2 * W) + 'px'; f.el.style.top = ((1 - tmpV.y) / 2 * H) + 'px';
    f.el.style.opacity = ease((t - 5) / 1) * (0.55 + 0.45 * planMode) * (camera.position.distanceTo(f.pos) > 140 ? 0 : 1);
  }
  $('outro').style.opacity = ease((t - 37.0) / 1.0);
  drawMap(t);
}

// ---------- per-frame scene ----------
function updateScene(t) {
  const s = shotAt(t); camera.position.copy(s.p); camera.fov = s.fov; camera.updateProjectionMatrix(); camera.lookAt(s.t);
  const xray = win(t, 16.2, 22.0, 0.8);
  const plan = win(t, 29.8, 34.2, 0.8);
  const alertOn = t > 21.2;
  groundMat.emissiveIntensity = 0.45 + plan * 0.9;
  for (const k of T) {
    const lvl = k.l + 0.04 * Math.sin(t * 0.7 + k.x) * 0 + (k.k === 'F4' ? -clamp((t - 21) / 8) * 0.06 : 0);
    const hh = Math.max(0.05, lvl / k.h * (k.h * 0.98));
    k.water.scale.y = hh; k.water.position.y = 0.6 + hh / 2;
    k.top.position.y = 0.6 + hh + 0.01;
    // waves
    const g = k.top.geometry, b = g.userData.base, a = g.attributes.position.array;
    for (let i = 0; i < a.length; i += 3) a[i + 1] = b[i + 1] + 0.07 * Math.sin(b[i] * 1.6 + t * 2.4) * Math.cos(b[i + 2] * 1.3 + t * 1.9);
    g.attributes.position.needsUpdate = true;
    const focus = k.k === 'SR2' || k.k === 'NCC' ? 1 : 0.55;
    k.shellMat.opacity = 0.16 * (1 - xray * focus * 0.85);
    k.waterMat.emissiveIntensity = 0.55 + xray * 0.5 + plan * 0.4;
    // scan
    const su = clamp((t - 17.0) / 2.6); k.scan.material.opacity = (su > 0 && su < 1 ? 0.9 : 0) * focus; k.scan.position.y = 0.6 + su * k.h;
    // alert
    if (k.k === 'F4') {
      const pulse = alertOn ? 0.5 + 0.5 * Math.sin(t * 8) : 0;
      k.rimMat.color.setRGB(alertOn ? 1 : 0.37, alertOn ? 0.23 + 0.4 * (1 - pulse) * 0 : 0.82, alertOn ? 0.3 : 1);
      k.shellMat.emissive.setRGB(alertOn ? 0.6 * pulse : 0.16, alertOn ? 0.05 : 0.36, alertOn ? 0.08 : 0.56); k.shellMat.emissiveIntensity = alertOn ? 1 : 0.15;
      k.shellMat.opacity = alertOn ? 0.22 + 0.12 * pulse : k.shellMat.opacity;
      const rp = ((t - 21.2) * 0.6) % 1; k.ring.material.opacity = alertOn ? (1 - rp) * 0.9 : 0; k.ring.scale.setScalar(3 + rp * 6);
    }
  }
  for (const r of ribsAll) r.material.opacity = 1 - xray * 0.7;
  pumps.forEach((p, i) => {
    p.fan.rotation.y = p.standby ? 0 : t * 14 + i;
    const v = p.standby ? 0.5 + 0.5 * Math.sin(t * 4) : 0.75 + 0.25 * Math.sin(t * 3 + i);
    p.bandM.color.setRGB(p.standby ? 1 * v : 0.21 * v, p.standby ? 0.54 * v : 0.94 * v, p.standby ? 0.12 * v : 0.54 * v).multiplyScalar(1 + xray * 0.8);
  });
  for (const pm of pipeMats) { pm.tex.offset.x = -t * 1.1; pm.glow.material.opacity = 0.12 + plan * 0.25 + xray * 0.08; }
  const pa = partGeo.attributes.position.array;
  for (let i = 0; i < NP; i++) { const q = trunkAt(i / NP * trunkLen.at(-1) + t * 9); pa[i * 3] = q.x; pa[i * 3 + 1] = q.y - 0.75; pa[i * 3 + 2] = q.z; }
  partGeo.attributes.position.needsUpdate = true;
  antL.material.color.setScalar(Math.sin(t * 5) > 0 ? 1 : 0.2).multiply(new THREE.Color(1, .23, .3));
  bloom.strength = 0.8 + plan * 0.35;
}

window.renderAt = (t) => { updateScene(t); updateHUD(t); composer.render(); return true; };
window.ready = true;
const q = new URLSearchParams(location.search);
if (q.has('t')) window.renderAt(parseFloat(q.get('t')));
else { const t0 = performance.now(); const loop = () => { window.renderAt(((performance.now() - t0) / 1000) % 39); requestAnimationFrame(loop); }; loop(); }
