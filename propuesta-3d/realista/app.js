import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const W = 1920, H = 1080;
const Q = new URLSearchParams(location.search);
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sst = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const ease = x => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
const lerp = (a, b, u) => a + (b - a) * u;
const win = (t, a, b, f = 0.6) => clamp((t - a) / f) * clamp((b - t) / f);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

// ---------------- noise ----------------
function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) & 0xffff) / 0xffff; }
function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v); }
function fbm(x, y, o = 5) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }
function ridged(x, y) { let s = 0, a = 0.55, f = 1; for (let i = 0; i < 6; i++) { s += a * (1 - Math.abs(vnoise(x * f, y * f) * 2 - 1)) ** 2; f *= 2.1; a *= 0.5; } return s; }

// ---------------- renderer ----------------
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setSize(W, H, false); renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.6;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xa9c4dc, 0.00042);
const camera = new THREE.PerspectiveCamera(40, W / H, 0.3, 9000);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.35, 0.6, 0.92); composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------------- sky / sun ----------------
const sky = new Sky(); sky.scale.setScalar(6000); scene.add(sky);
const envScene = new THREE.Scene(); const sky2 = new Sky(); sky2.scale.setScalar(1000); envScene.add(sky2);
const envGround = new THREE.Mesh(new THREE.CircleGeometry(900, 32), new THREE.MeshBasicMaterial({ color: 0x3a4a30 })); envGround.rotation.x = -Math.PI / 2; envGround.position.y = -20; envScene.add(envGround);
for (const s of [sky, sky2]) { const u = s.material.uniforms; u.turbidity.value = 3; u.rayleigh.value = 2.2; u.mieCoefficient.value = 0.004; u.mieDirectionalG.value = 0.82; }
const pmrem = new THREE.PMREMGenerator(renderer);
let envRT = null, lastEnvKey = 1e9;
const sunDir = new THREE.Vector3();
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -85, right: 85, top: 85, bottom: -85, near: 10, far: 500 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xcfe3ff, 0x4d5a3a, 0.6); scene.add(hemi);
const moonL = new THREE.DirectionalLight(0x9ab8ff, 0); moonL.position.set(120, 160, 140); scene.add(moonL);

function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
const radialTex = (inner, outer) => canvasTex(128, 128, (g, w) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
const glowTex = radialTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)');
const glowSoft = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
// lens flare
const flare = new Lensflare();
flare.addElement(new LensflareElement(glowTex, 380, 0, new THREE.Color(1, 0.95, 0.85)));
for (const [s, d] of [[60, 0.4], [90, 0.6], [140, 0.85], [50, 1.0]]) flare.addElement(new LensflareElement(glowSoft, s, d, new THREE.Color(0.6, 0.75, 1)));
const flareLight = new THREE.PointLight(0xffffff, 0, 1); flareLight.add(flare); scene.add(flareLight);

// stars + moon
const stars = (() => { const g = new THREE.BufferGeometry(), p = [], c = []; for (let i = 0; i < 4000; i++) { const th = rnd() * 6.283, ph = Math.asin(rnd()) ; p.push(Math.cos(th) * Math.cos(ph) * 3000, Math.sin(ph) * 3000, Math.sin(th) * Math.cos(ph) * 3000); const b = 0.5 + rnd() * 0.5; c.push(b, b, b * (0.9 + rnd() * .2)); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  const m = new THREE.Points(g, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, fog: false, depthWrite: false })); scene.add(m); return m; })();
const moonTex = canvasTex(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 30, 128, 128, 128); gr.addColorStop(0, 'rgba(230,238,255,1)'); gr.addColorStop(0.24, 'rgba(220,230,255,.95)'); gr.addColorStop(0.27, 'rgba(160,190,255,.25)'); gr.addColorStop(1, 'rgba(120,160,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); g.fillStyle = 'rgba(160,170,190,.35)'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(100 + rnd() * 56, 100 + rnd() * 56, 4 + rnd() * 9, 0, 7); g.fill(); } });
const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, transparent: true, opacity: 0, fog: false, depthWrite: false })); moon.scale.setScalar(260); moon.position.set(900, 1100, 1500); scene.add(moon);
// clouds
const cloudTex = canvasTex(256, 128, (g) => { for (let i = 0; i < 26; i++) { const x = 40 + rnd() * 176, y = 50 + rnd() * 40, r = 16 + rnd() * 34; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 128); } });
const clouds = [];
for (let i = 0; i < 26; i++) { const m = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.8, fog: false, depthWrite: false }); const s = new THREE.Sprite(m); const a = rnd() * 6.283, r = 700 + rnd() * 1500; s.position.set(Math.cos(a) * r, 260 + rnd() * 260, Math.sin(a) * r); const sc = 380 + rnd() * 520; s.scale.set(sc, sc * 0.42, 1); s.userData.v = 2 + rnd() * 3; scene.add(s); clouds.push(s); }

// ---------------- textures ----------------
const grassTex = canvasTex(512, 512, (g, w, h) => { const id = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = fbm(x / 32, y / 32, 4), m = hash(x, y); const i = (y * w + x) * 4; id.data[i] = 92 + n * 50 + m * 26; id.data[i + 1] = 108 + n * 52 + m * 26; id.data[i + 2] = 58 + n * 22 + m * 14; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); });
const concTex = canvasTex(256, 256, (g, w, h) => { const id = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = fbm(x / 20, y / 20, 4) * 40 + hash(x, y) * 18; const i = (y * w + x) * 4; id.data[i] = id.data[i + 1] = 150 + n; id.data[i + 2] = 145 + n; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); });
const asphTex = canvasTex(256, 256, (g, w, h) => { const id = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = fbm(x / 14, y / 14, 3) * 18 + hash(x, y) * 22; const i = (y * w + x) * 4; id.data[i] = id.data[i + 1] = id.data[i + 2] = 38 + n; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); });
const waterN = canvasTex(256, 256, (g, w, h) => { const hgt = (x, y) => fbm(x / 22, y / 22, 4) + 0.5 * vnoise(x / 6, y / 6); const id = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = hgt((x + 1) % w, y) - hgt((x - 1 + w) % w, y), dy = hgt(x, (y + 1) % h) - hgt(x, (y - 1 + h) % h); const n = V(-dx * 6, -dy * 6, 1).normalize(); const i = (y * w + x) * 4; id.data[i] = (n.x * .5 + .5) * 255; id.data[i + 1] = (n.y * .5 + .5) * 255; id.data[i + 2] = (n.z * .5 + .5) * 255; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); }, false);
const fenceTex = canvasTex(64, 64, (g) => { g.strokeStyle = 'rgba(190,200,210,1)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(64, 64); g.moveTo(64, 0); g.lineTo(0, 64); g.stroke(); });
const flowTex = canvasTex(256, 16, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(40,150,255,0)'); gr.addColorStop(0.6, 'rgba(60,170,255,.5)'); gr.addColorStop(0.82, 'rgba(210,245,255,1)'); gr.addColorStop(0.9, 'rgba(60,170,255,.4)'); gr.addColorStop(1, 'rgba(40,150,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const winTex = canvasTex(512, 128, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); for (let y = 0; y < 2; y++) for (let x = 0; x < 20; x++) { if (rnd() < 0.3) continue; g.fillStyle = rnd() > .4 ? '#ffd9a8' : '#cfe6ff'; g.fillRect(8 + x * 25, 20 + y * 56, 19, 34); } });

// ---------------- terrain ----------------
function G(x, z, cx, cz, s, h) { return h * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (2 * s * s)); }
function terrainH(x, z) {
  const dx = Math.max(0, Math.abs(x) - 60), dz = Math.max(0, Math.abs(z + 2) - 46);
  let d = Math.hypot(dx, dz);
  if (x < -40) d = Math.min(d, Math.max(0, Math.abs(z - 4) - 9));
  const hills = sst(0, 60, d) * (6 + 26 * fbm(x * 0.011 + 3, z * 0.011));
  const r = Math.hypot(x, z);
  const mtn = sst(650, 1150, r) * (30 + 230 * ridged(x * 0.0022, z * 0.0022));
  // cerro de la silla (este)
  const silla = G(x, z, 1150, -520, 120, 330) + G(x, z, 1240, -340, 110, 300) + G(x, z, 1200, -430, 170, 170);
  return hills + mtn + silla + (d > 2 ? (fbm(x * .08, z * .08, 3) - 0.5) * 0.8 * sst(2, 14, d) : 0);
}
{
  const geo = new THREE.PlaneGeometry(3600, 3600, 320, 320); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, col = [];
  const cA = new THREE.Color(0x86a35a), cB = new THREE.Color(0x4f7038), cR = new THREE.Color(0x6e7466), cC = new THREE.Color(0x8aa860);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i); const h = terrainH(x, z); p.setY(i, h);
    const c = cA.clone().lerp(cB, clamp(h / 30) * 0.9).lerp(cC, fbm(x * 0.02, z * 0.02, 3) * 0.35).lerp(cR, sst(70, 220, h)); col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  grassTex.repeat.set(360, 360);
  const ter = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: grassTex, vertexColors: true, roughness: 1, metalness: 0 }));
  ter.receiveShadow = true; scene.add(ter);
}
// plant pad (gravel/concrete) & roads
const matConc = new THREE.MeshStandardMaterial({ map: concTex, color: 0xd8d4cc, roughness: 0.92 });
const matAsph = new THREE.MeshStandardMaterial({ map: asphTex, color: 0x9a9a9a, roughness: 0.85 });
asphTex.repeat.set(8, 1);
const lineMat = new THREE.MeshStandardMaterial({ color: 0xf2f2e8, roughness: 0.6 });
const yLineMat = new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.6 });
const lampPos = [];
function road(x1, z1, x2, z2, w = 6) {
  const len = Math.hypot(x2 - x1, z2 - z1), ang = Math.atan2(z2 - z1, x2 - x1);
  const r = new THREE.Mesh(new THREE.PlaneGeometry(len + w, w), matAsph.clone()); r.material.map = asphTex.clone(); r.material.map.repeat.set((len + w) / 8, 1); r.material.map.needsUpdate = true;
  r.rotation.set(-Math.PI / 2, 0, -ang); r.position.set((x1 + x2) / 2, 0.05, (z1 + z2) / 2); r.receiveShadow = true; scene.add(r);
  for (const off of [-w / 2 + 0.25, w / 2 - 0.25]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(len + w - 0.5, 0.14), lineMat); l.rotation.set(-Math.PI / 2, 0, -ang); l.position.set((x1 + x2) / 2 - Math.sin(ang) * off, 0.07, (z1 + z2) / 2 + Math.cos(ang) * off); scene.add(l); }
  for (let s = 1; s < len; s += 4.5) { const d = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.15), yLineMat); d.rotation.set(-Math.PI / 2, 0, -ang); d.position.set(x1 + (x2 - x1) * s / len, 0.07, z1 + (z2 - z1) * s / len); scene.add(d); }
  for (let s = 4; s <= len; s += 16) lampPos.push([x1 + (x2 - x1) * s / len - Math.sin(ang) * (w / 2 + 0.8), z1 + (z2 - z1) * s / len + Math.cos(ang) * (w / 2 + 0.8), ang]);
}
const padM = new THREE.Mesh(new THREE.PlaneGeometry(108, 76), new THREE.MeshStandardMaterial({ map: concTex.clone(), color: 0xa9ab9c, roughness: 1 }));
padM.material.map.repeat.set(12, 9); padM.material.map.needsUpdate = true;
padM.rotation.x = -Math.PI / 2; padM.position.set(0, 0.03, -2); padM.receiveShadow = true; scene.add(padM);
road(-55, 36, 55, 36); road(-55, -40, 55, -40); road(-55, -40, -55, 36); road(55, -40, 55, 36); road(-400, 9, -55, 9); road(-12, 28, -12, 36, 5);

// lamps
const steel = new THREE.MeshStandardMaterial({ color: 0xaab4bf, metalness: 0.85, roughness: 0.32 });
const darkSteel = new THREE.MeshStandardMaterial({ color: 0x4a525c, metalness: 0.7, roughness: 0.45 });
const lampHeadMat = new THREE.MeshStandardMaterial({ color: 0x222, emissive: 0xffd9a0, emissiveIntensity: 0 });
const poolTex = radialTex('rgba(255,210,150,0.9)', 'rgba(255,190,120,0)');
const pools = [];
for (const [x, z, a] of lampPos) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 7, 8), darkSteel); pole.position.set(x, 3.5, z); pole.castShadow = true; scene.add(pole);
  const dirx = Math.sin(a), dirz = -Math.cos(a);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.8), darkSteel); arm.position.set(x + dirx * 0.9, 7, z + dirz * 0.9); arm.rotation.y = -a; scene.add(arm);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.9), lampHeadMat); head.position.set(x + dirx * 1.8, 6.95, z + dirz * 1.8); head.rotation.y = -a; scene.add(head);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(x + dirx * 2, 0.12, z + dirz * 2); scene.add(pool); pools.push(pool);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc98a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.setScalar(2.2); halo.position.copy(head.position); halo.position.y -= 0.2; scene.add(halo); pools.push(halo);
}

// fence
{
  fenceTex.repeat.set(1, 1);
  const fm = new THREE.MeshStandardMaterial({ map: fenceTex, alphaTest: 0.4, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.5, color: 0xdde3ea });
  const segs = [[-51, -37, 51, -37], [51, -37, 51, 33], [51, 33, -51, 33], [-51, 33, -51, 14], [-51, 4, -51, -37]];
  for (const [x1, z1, x2, z2] of segs) {
    const len = Math.hypot(x2 - x1, z2 - z1), ang = Math.atan2(z2 - z1, x2 - x1);
    const t = fenceTex.clone(); t.needsUpdate = true; t.repeat.set(len / 0.35, 2.2 / 0.35);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 2.2), fm.clone()); m.material.map = t; m.rotation.y = -ang; m.position.set((x1 + x2) / 2, 1.2, (z1 + z2) / 2); scene.add(m);
    for (let s = 0; s <= len; s += 3) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 6), steel); p.position.set(x1 + (x2 - x1) * s / len, 1.25, z1 + (z2 - z1) * s / len); scene.add(p); }
  }
}

// trees (instanced, trunk + crown)
{
  const N = 1400;
  const blob = (r, x, y, z) => { const g = new THREE.IcosahedronGeometry(r, 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + (vnoise(p.getX(i) * 2.2 + x * 7, p.getY(i) * 2.2 + p.getZ(i) * 1.7 + z * 5) - 0.5) * 0.32; p.setXYZ(i, p.getX(i) * k + x, p.getY(i) * k * 1.05 + y, p.getZ(i) * k + z); } return g; };
  const crownGeo = mergeGeometries([blob(1.5, 0, 3.7, 0), blob(1.1, 0.9, 3.2, 0.3), blob(1.05, -0.8, 3.3, -0.4), blob(1.0, 0.1, 4.7, 0.2), blob(0.95, 0.2, 3.1, -1.0)]); crownGeo.computeVertexNormals();
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.24, 2.6, 6); trunkGeo.translate(0, 1.3, 0);
  const crowns = new THREE.InstancedMesh(crownGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), N);
  const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ color: 0x5a4430, roughness: 1 }), N);
  const m4 = new THREE.Matrix4(), c = new THREE.Color(); let n = 0;
  while (n < N) {
    const x = (rnd() - .5) * 700, z = (rnd() - .5) * 700;
    if (Math.abs(x) < 64 && Math.abs(z + 2) < 50) continue; if (x < -40 && Math.abs(z - 6) < 14) continue;
    const h = terrainH(x, z); if (h > 120) continue; if (fbm(x * 0.02, z * 0.02, 3) < 0.42 && Math.hypot(x, z) > 90) continue;
    const s = 0.8 + rnd() * 1.1; m4.compose(V(x, h - 0.2, z), new THREE.Quaternion().setFromAxisAngle(UP, rnd() * 6.28), V(s, s * (0.85 + rnd() * .5), s));
    crowns.setMatrixAt(n, m4); trunks.setMatrixAt(n, m4); c.setHSL(0.22 + rnd() * 0.07, 0.35 + rnd() * 0.2, 0.12 + rnd() * 0.08); crowns.setColorAt(n, c); n++;
  }
  crowns.castShadow = true; trunks.castShadow = true; crowns.receiveShadow = true; scene.add(crowns, trunks);
}

// ---------------- tanks ----------------
const T = [
  { k: 'SR2', n: 'SANTA ROSA 2', x: -28, z: 12, r: 4.2, h: 8, l: 3.41, tr: -0.24 },
  { k: 'NCC', n: 'NUEVA CASTILLA CIRCULAR', x: -9, z: 13, r: 4.4, h: 8, l: 5.40, tr: -0.12 },
  { k: 'NCR', n: 'NUEVA CASTILLA RECTANGULAR', x: -12, z: -8, rect: true, w: 12, d: 7, h: 7, l: 3.68, tr: -0.10 },
  { k: 'CIR', n: 'CIRCULAR', x: -33, z: -12, r: 3.6, h: 7, l: 4.12, tr: 0.05 },
  { k: 'CAM', n: 'CASTILLA AMP.', x: -22, z: -26, r: 3.2, h: 6.5, l: 3.90, tr: -0.03 },
  { k: 'ALR', n: 'ALIANZA REAL', x: 2, z: -17, r: 3.4, h: 7, l: 4.80, tr: 0.02 },
  { k: 'GA1', n: 'GARCIA 1', x: 14, z: -6, r: 3.9, h: 8, l: 4.60, tr: 0.08 },
  { k: 'GA2', n: 'GARCIA 2', x: 6, z: 16, r: 4.6, h: 8, l: 2.90, tr: -0.05 },
  { k: 'LCZ', n: 'LA CRUZ', x: 27, z: 18, r: 5.2, h: 8, l: 2.03, tr: -0.06 },
  { k: 'F1', n: 'FRAILE 1', x: 24, z: -8, r: 2.8, h: 7, l: 4.40, tr: 0.01 },
  { k: 'F2', n: 'FRAILE 2', x: 33, z: -5, r: 2.8, h: 7, l: 4.62, tr: 0.03 },
  { k: 'F3', n: 'FRAILE 3', x: 26, z: -23, r: 2.8, h: 7, l: 3.95, tr: -0.02 },
  { k: 'F4', n: 'FRAILE 4', x: 39, z: -20, r: 2.8, h: 7, l: 4.05, tr: -0.16 },
  { k: 'F5', n: 'FRAILE 5', x: 33, z: -30, r: 2.8, h: 7, l: 4.21, tr: 0.00 },
];
const byK = Object.fromEntries(T.map(t => [t.k, t]));
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.2, roughness: 0.03, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.6, side: THREE.DoubleSide, depthWrite: false, emissive: 0x1d6fd0, emissiveIntensity: 0 });
const waterBodyMat = new THREE.MeshPhysicalMaterial({ color: 0x0b56b0, roughness: 0.15, transparent: true, opacity: 0.93, emissive: 0x0a4ea8, emissiveIntensity: 0.08, clearcoat: 0.6 });
waterN.repeat.set(0.7, 0.7);
const waterTopMat = new THREE.MeshPhysicalMaterial({ color: 0x165fae, roughness: 0.18, metalness: 0.0, normalMap: waterN, normalScale: new THREE.Vector2(0.1, 0.1), clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6, emissive: 0x0b4a9a, emissiveIntensity: 0.12 });
const ledMat = new THREE.MeshStandardMaterial({ color: 0x0a1a28, emissive: 0x52c8ff, emissiveIntensity: 0 });
const ladderMat = new THREE.MeshStandardMaterial({ color: 0xe0902a, metalness: 0.4, roughness: 0.5 });
const galv = new THREE.MeshStandardMaterial({ color: 0xc4ccd4, metalness: 0.9, roughness: 0.28 });
const foamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.6 });

function signTex(text, alert = false) {
  return canvasTex(1024, 200, (g, w, h) => {
    g.fillStyle = alert ? '#7a0f18' : '#0f2d55'; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 26); g.fill();
    g.strokeStyle = alert ? '#ff6a78' : '#9cc9ff'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#fff'; let fs = 104; g.font = `800 ${fs}px Inter`; while (g.measureText(text).width > w - 80) { fs -= 4; g.font = `800 ${fs}px Inter`; }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 4);
  });
}
function levelTex(t, alert) {
  return canvasTex(512, 220, (g, w, h) => {
    g.fillStyle = 'rgba(8,18,32,.86)'; g.beginPath(); g.roundRect(6, 6, w - 12, h - 12, 30); g.fill();
    g.strokeStyle = alert ? '#ff5a6a' : '#5cc8ff'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#fff'; g.font = '800 104px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t.l.toFixed(2) + ' m', w / 2, 92);
    g.font = '700 46px Inter'; g.fillStyle = t.tr < 0 ? '#ff6b78' : '#47e394'; g.fillText((t.tr < 0 ? '▼ −' : '▲ +') + Math.abs(t.tr).toFixed(2) + ' m', w / 2, 170);
  });
}
const FACE = V(-70, 0, 90);
for (const t of T) {
  const g = new THREE.Group(); g.position.set(t.x, 0, t.z); scene.add(g); t.g = g;
  const yaw = Math.atan2(FACE.x - t.x, FACE.z - t.z); t.yaw = yaw;
  const R = t.rect ? Math.max(t.w, t.d) / 2 : t.r;
  // concrete pad + footing
  const padW = t.rect ? t.w + 3.2 : t.r * 2 + 3, padD = t.rect ? t.d + 3.2 : t.r * 2 + 3;
  const pad = new THREE.Mesh(new THREE.BoxGeometry(padW, 0.5, padD), matConc); pad.position.y = 0.25; pad.receiveShadow = pad.castShadow = true; g.add(pad);
  const base = 0.5;
  let topY = base + t.h;
  if (t.rect) {
    const shell = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), glassMat); shell.position.y = base + t.h / 2; shell.renderOrder = 5; g.add(shell);
    t.water = new THREE.Mesh(new THREE.BoxGeometry(t.w - 0.15, 1, t.d - 0.15), waterBodyMat); t.water.castShadow = true; g.add(t.water);
    const tg = new THREE.PlaneGeometry(t.w - 0.15, t.d - 0.15); tg.rotateX(-Math.PI / 2); t.top = new THREE.Mesh(tg, waterTopMat); g.add(t.top);
    // steel frame
    const fr = []; const hw = t.w / 2, hd = t.d / 2;
    for (const [x, z] of [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]]) fr.push([x, z]);
    for (let x = -hw; x <= hw + 0.01; x += t.w / 4) { fr.push([x, -hd]); fr.push([x, hd]); }
    for (let z = -hd; z <= hd + 0.01; z += t.d / 2) { fr.push([-hw, z]); fr.push([hw, z]); }
    for (const [x, z] of fr) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.22, t.h + 0.2, 0.22), galv); c.position.set(x, base + t.h / 2, z); c.castShadow = true; g.add(c); }
    for (const y of [base + 0.1, base + t.h * 0.5, base + t.h]) for (const [sx, sz, px, pz] of [[t.w, 0.2, 0, -hd], [t.w, 0.2, 0, hd], [0.2, t.d, -hw, 0], [0.2, t.d, hw, 0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(sx + 0.2, 0.2, sz + 0.2), galv); b.position.set(px, y, pz); b.castShadow = true; g.add(b); }
    const led = new THREE.Mesh(new THREE.BoxGeometry(t.w + 0.3, 0.08, t.d + 0.3), ledMat); led.position.y = topY + 0.15; g.add(led);
    const ledIn = new THREE.Mesh(new THREE.BoxGeometry(t.w - 0.3, 0.06, t.d - 0.3), ledMat); ledIn.position.y = topY + 0.15; ledIn.scale.set(1, 1, 1); g.add(ledIn);
  } else {
    const r = t.r;
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(r, r, t.h, 72, 1, true), glassMat); shell.position.y = base + t.h / 2; shell.renderOrder = 5; g.add(shell);
    t.water = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.08, r - 0.08, 1, 64), waterBodyMat); t.water.castShadow = true; g.add(t.water);
    const tg = new THREE.CircleGeometry(r - 0.08, 64); tg.rotateX(-Math.PI / 2); t.top = new THREE.Mesh(tg, waterTopMat); g.add(t.top);
    t.foam = new THREE.Mesh(new THREE.TorusGeometry(r - 0.12, 0.05, 6, 72), foamMat); t.foam.rotation.x = Math.PI / 2; g.add(t.foam);
    // steel ring footing
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.35, r + 0.45, 0.35, 72), darkSteel); foot.position.y = base + 0.17; foot.castShadow = true; g.add(foot);
    // columns (I-beam look: two boxes)
    const nC = Math.max(10, Math.round(r * 3.2));
    const colGeo = mergeGeometries([new THREE.BoxGeometry(0.26, t.h + 0.3, 0.06).translate(0, 0, 0.1), new THREE.BoxGeometry(0.26, t.h + 0.3, 0.06).translate(0, 0, -0.1), new THREE.BoxGeometry(0.05, t.h + 0.3, 0.2)]);
    const cols = new THREE.InstancedMesh(colGeo, galv, nC); const m4 = new THREE.Matrix4();
    for (let i = 0; i < nC; i++) { const a = i / nC * Math.PI * 2; m4.compose(V(Math.cos(a) * (r + 0.15), base + t.h / 2, Math.sin(a) * (r + 0.15)), new THREE.Quaternion().setFromAxisAngle(UP, -a), V(1, 1, 1)); cols.setMatrixAt(i, m4); }
    cols.castShadow = true; g.add(cols);
    for (const y of [base + t.h * 0.34, base + t.h * 0.67]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.17, 0.07, 6, 80), galv); ring.rotation.x = Math.PI / 2; ring.position.y = y; g.add(ring); }
    const topRing = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.35, r + 0.35, 0.3, 72, 1, true), galv); topRing.position.y = topY; topRing.castShadow = true; g.add(topRing);
    // catwalk + railing
    const walk = new THREE.Mesh(new THREE.RingGeometry(r + 0.3, r + 1.25, 72), new THREE.MeshStandardMaterial({ color: 0x5f6870, metalness: 0.7, roughness: 0.55, side: THREE.DoubleSide })); walk.rotation.x = -Math.PI / 2; walk.position.y = topY + 0.12; walk.castShadow = true; g.add(walk);
    for (const yy of [0.55, 1.1]) { const rail = new THREE.Mesh(new THREE.TorusGeometry(r + 1.2, 0.04, 6, 90), ladderMat); rail.rotation.x = Math.PI / 2; rail.position.y = topY + 0.12 + yy; g.add(rail); }
    const nP = Math.round(r * 4); const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 5), ladderMat, nP);
    for (let i = 0; i < nP; i++) { const a = i / nP * Math.PI * 2; m4.makeTranslation(Math.cos(a) * (r + 1.2), topY + 0.67, Math.sin(a) * (r + 1.2)); posts.setMatrixAt(i, m4); } g.add(posts);
    // LED rings (night)
    for (const y of [topY + 0.32, base + 0.4]) { const led = new THREE.Mesh(new THREE.TorusGeometry(r + 0.37, 0.045, 6, 96), ledMat); led.rotation.x = Math.PI / 2; led.position.y = y; g.add(led); }
    // ladder with cage
    const la = new THREE.Group(); const lh = t.h + 0.7;
    for (const s of [-0.3, 0.3]) { const rl = new THREE.Mesh(new THREE.BoxGeometry(0.06, lh, 0.06), ladderMat); rl.position.set(s, base + lh / 2, 0); la.add(rl); }
    for (let y = base + 0.4; y < base + lh; y += 0.32) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 4), ladderMat); st.rotation.z = Math.PI / 2; st.position.set(0, y, 0); la.add(st); }
    for (let y = base + 2.4; y < base + lh; y += 0.9) { const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.025, 4, 16, Math.PI), ladderMat); hoop.rotation.x = Math.PI / 2; hoop.position.set(0, y, 0.25); la.add(hoop); }
    for (const a of [0.4, 1.57, 2.7]) { const sb = new THREE.Mesh(new THREE.BoxGeometry(0.03, lh - 2.4, 0.03), ladderMat); sb.position.set(Math.cos(a) * 0.45, base + 2.4 + (lh - 2.4) / 2, 0.25 + Math.sin(a) * 0.45); la.add(sb); }
    const la_a = yaw + 0.9; la.position.set(Math.sin(la_a) * (r + 0.45), 0, Math.cos(la_a) * (r + 0.45)); la.rotation.y = la_a; g.add(la);
    // inlet pipe going over top (detail)
    const ia = yaw - 1.0; const ix = Math.sin(ia) * (r + 0.8), iz = Math.cos(ia) * (r + 0.8);
    const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, topY + 0.6, 12), new THREE.MeshStandardMaterial({ color: 0x2066c8, metalness: 0.35, roughness: 0.35 })); riser.position.set(ix, (topY + 0.6) / 2, iz); riser.castShadow = true; g.add(riser);
    const over = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.7, 12), riser.material); over.quaternion.setFromUnitVectors(UP, V(Math.sin(ia), 0, Math.cos(ia))); over.position.set(Math.sin(ia) * (r - 0.05), topY + 0.6, Math.cos(ia) * (r - 0.05)); g.add(over); const elb = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 8), riser.material); elb.position.set(ix, topY + 0.6, iz); g.add(elb);
    t.inlet = V(Math.sin(ia) * (r - 0.8), topY + 0.6, Math.cos(ia) * (r - 0.8));
    // gauge panel on side
    const gp = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.2), new THREE.MeshStandardMaterial({ color: 0xdfe5ea, metalness: 0.3, roughness: 0.5 })); const ga = yaw - 0.35; gp.position.set(Math.sin(ga) * (r + 0.8), 1.6, Math.cos(ga) * (r + 0.8)); gp.rotation.y = ga; gp.castShadow = true; g.add(gp);
    const gpl = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), darkSteel); gpl.position.set(gp.position.x, 0.8, gp.position.z); g.add(gpl);
    t.statusLed = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0x3ee08a })); t.statusLed.position.copy(gp.position).add(V(Math.sin(ga) * 0.12, 0.3, Math.cos(ga) * 0.12)); g.add(t.statusLed);
  }
  t.topY = topY;
  // sign board on posts above tank
  t.signTex = signTex(t.n); t.signTexA = signTex(t.n, true);
  const sw = Math.min(9, Math.max(5.2, t.n.length * 0.34)) * (t.rect ? 1.15 : 1);
  t.signMat = new THREE.MeshStandardMaterial({ map: t.signTex, roughness: 0.5, metalness: 0.1, emissive: 0xffffff, emissiveMap: t.signTex, emissiveIntensity: 0.12 });
  const sign = new THREE.Group();
  const board = new THREE.Mesh(new THREE.PlaneGeometry(sw, sw * 200 / 1024), t.signMat); board.position.y = 1.6; sign.add(board);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(sw, sw * 200 / 1024), t.signMat); back.position.set(0, 1.6, -0.02); back.rotation.y = Math.PI; sign.add(back);
  for (const s of [-sw * 0.35, sw * 0.35]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.08), darkSteel); p.position.set(s, 0.6, -0.03); sign.add(p); }
  sign.position.set(0, topY + 0.15, t.rect ? 0 : 0); sign.rotation.y = yaw; sign.rotation.x = 0; g.add(sign); t.sign = sign;
  sign.children.forEach(c => c.castShadow = true);
  // level display sprite
  t.lvlTex = levelTex(t, false); t.lvlTexA = levelTex(t, true);
  t.lvl = new THREE.Sprite(new THREE.SpriteMaterial({ map: t.lvlTex, transparent: true, depthWrite: false }));
  const ls = t.rect ? 3.4 : Math.min(3.2, t.r * 0.75); t.lvl.scale.set(ls, ls * 220 / 512, 1);
  t.lvl.position.set(Math.sin(yaw) * (R + 0.9), base + t.h * 0.42, Math.cos(yaw) * (R + 0.9)); t.lvl.renderOrder = 10; g.add(t.lvl);
  // alert ring
  t.ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.15, 72), new THREE.MeshBasicMaterial({ color: 0xff2a40, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  t.ring.rotation.x = -Math.PI / 2; t.ring.position.y = 0.55; g.add(t.ring);
  // underwater light (night)
  t.uw = new THREE.Mesh(new THREE.CircleGeometry(R * 0.85, 40), new THREE.MeshBasicMaterial({ map: glowTex, color: 0x2fa6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); t.uw.rotation.x = -Math.PI / 2; t.uw.position.y = base + 0.08; g.add(t.uw);
}
// beacon on Fraile 4
const F4 = byK.F4;
const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0x400, emissive: 0xff2030, emissiveIntensity: 0 })); beacon.position.set(F4.x, F4.topY + 2.9, F4.z); scene.add(beacon);
const beaconHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff3040, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); beaconHalo.position.copy(beacon.position); beaconHalo.scale.setScalar(5); scene.add(beaconHalo);
const alertLight = new THREE.PointLight(0xff2a3a, 0, 40, 1.6); alertLight.position.set(F4.x, F4.topY + 3, F4.z); scene.add(alertLight);
// inflow jet on Santa Rosa 2
const SR2 = byK.SR2;
const jetTex = canvasTex(64, 256, (g, w, h) => { for (let i = 0; i < 40; i++) { const x = rnd() * w, y = rnd() * h, l = 20 + rnd() * 60; const gr = g.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(230,245,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x, y, 3 + rnd() * 5, l); } });
const jetH = SR2.topY + 0.4 - (0.5 + SR2.l);
const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, jetH, 16, 1, true), new THREE.MeshBasicMaterial({ map: jetTex, color: 0xcfe9ff, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
jet.position.copy(SR2.inlet).add(SR2.g.position); jet.position.y = SR2.topY + 0.4 - jetH / 2; scene.add(jet);
const splash = new THREE.Mesh(new THREE.RingGeometry(0.2, 1.3, 40), new THREE.MeshBasicMaterial({ map: radialTex('rgba(255,255,255,.95)', 'rgba(255,255,255,0)'), transparent: true, opacity: 0.8, depthWrite: false }));
splash.rotation.x = -Math.PI / 2; splash.position.set(jet.position.x, 0.5 + SR2.l + 0.04, jet.position.z); scene.add(splash);

// ---------------- pumps ----------------
const pumps = [];
const motorMat = new THREE.MeshStandardMaterial({ color: 0x2f7d55, metalness: 0.45, roughness: 0.42 });
const pumpMat = new THREE.MeshStandardMaterial({ color: 0x2a5fb0, metalness: 0.5, roughness: 0.4 });
const guardMat = new THREE.MeshStandardMaterial({ color: 0xf0a020, metalness: 0.3, roughness: 0.5 });
const finGeo = (() => { const gs = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; gs.push(new THREE.BoxGeometry(0.05, 1.3, 0.12).translate(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5).rotateY(0)); } return mergeGeometries(gs); })();
function pumpUnit(x, z, rot, standby) {
  const p = new THREE.Group(); p.position.set(x, 0, z); p.rotation.y = rot;
  const skid = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 3.6), darkSteel); skid.position.y = 0.65; p.add(skid);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 3.9), matConc); plinth.position.y = 0.25; p.add(plinth);
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 1.4, 28), motorMat); motor.rotation.x = Math.PI / 2; motor.position.set(0, 1.4, -0.8); p.add(motor);
  const fins = new THREE.Mesh(finGeo, motorMat); fins.rotation.x = Math.PI / 2; fins.position.copy(motor.position); p.add(fins);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.46, 0.25, 28), motorMat); cap.rotation.x = Math.PI / 2; cap.position.set(0, 1.4, -1.6); p.add(cap);
  const fanC = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 20), new THREE.MeshStandardMaterial({ color: 0x1a1f25, metalness: .4, roughness: .6 })); fanC.rotation.x = Math.PI / 2; fanC.position.set(0, 1.4, -1.74); p.add(fanC);
  const tb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), motorMat); tb.position.set(0, 2.0, -0.7); p.add(tb);
  const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.7, 16, 1, false, 0, Math.PI), guardMat); guard.rotation.x = Math.PI / 2; guard.position.set(0, 1.35, 0.25); p.add(guard);
  const vol = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.24, 12, 24), pumpMat); vol.position.set(0, 1.35, 0.95); p.add(vol);
  const volc = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.4, 20), pumpMat); volc.rotation.x = Math.PI / 2; volc.position.set(0, 1.35, 0.95); p.add(volc);
  const suc = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.9, 14), pumpMat); suc.rotation.x = Math.PI / 2; suc.position.set(0, 1.35, 1.55); p.add(suc);
  const dis = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 1.6, 14), pumpMat); dis.position.set(0, 2.3, 0.95); p.add(dis);
  const fl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16), steel); fl.position.set(0, 3.0, 0.95); p.add(fl);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 20), new THREE.MeshStandardMaterial({ color: 0xcc2222, metalness: .3, roughness: .5 })); wheel.position.set(0, 3.3, 0.95); wheel.rotation.x = Math.PI / 2; p.add(wheel);
  const vstem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6), steel); vstem.position.set(0, 3.15, 0.95); p.add(vstem);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x111, emissive: standby ? 0xffae42 : 0x3ee08a, emissiveIntensity: 2 });
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 10), lampMat); lamp.position.set(0.2, 2.27, -0.7); p.add(lamp);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: standby ? 0xffae42 : 0x3ee08a, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); halo.position.copy(lamp.position); halo.scale.setScalar(0.9); p.add(halo);
  p.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(p); pumps.push({ p, fanC, lampMat, halo, standby });
}
function station(x0, z0, n, dx, dz, rot, name) {
  for (let i = 0; i < n; i++) pumpUnit(x0 + i * 2.3 * dx, z0 + i * 2.3 * dz, rot, name === 'SR' && i === 4);
  // canopy roof
  const len = n * 2.3 + 1.4; const cx = x0 + (n - 1) * 2.3 * dx / 2, cz = z0 + (n - 1) * 2.3 * dz / 2;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(dx ? len : 5.2, 0.15, dz ? len : 5.2), new THREE.MeshStandardMaterial({ color: 0xd8dde2, metalness: 0.6, roughness: 0.35 })); roof.position.set(cx, 5.2, cz); roof.castShadow = true; scene.add(roof);
  for (const s of [-1, 1]) for (const e of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5.2, 0.2), galv); c.position.set(cx + (dx ? s * len / 2 : e * 2.4), 2.6, cz + (dz ? s * len / 2 : e * 2.4)); c.castShadow = true; scene.add(c); }
}
station(-22.5, 4.6, 6, 1, 0, Math.PI, 'SR');
station(-3, -12, 4, 0, 1, Math.PI / 2, 'NC');
station(17, -0.6, 4, 1, 0, Math.PI, 'GA');
station(25.5, -15.6, 4, 1, 0, 0, 'FR');

// ---------------- pipes ----------------
const pipeMat = new THREE.MeshStandardMaterial({ color: 0x1f63c9, metalness: 0.35, roughness: 0.33 });
const flows = [];
function pipe(pts, rad = 0.4, y = 1.0) {
  const v = pts.map(p => V(p[0], y, p[1]));
  const path = new THREE.CurvePath(); let L = 0;
  for (let i = 0; i < v.length - 1; i++) {
    const a = v[i], b = v[i + 1]; path.add(new THREE.LineCurve3(a, b)); const l = a.distanceTo(b); L += l;
    const dir = b.clone().sub(a).normalize(), q = new THREE.Quaternion().setFromUnitVectors(UP, dir);
    for (let s = 0; s <= l; s += 6) {
      const p = a.clone().addScaledVector(dir, s);
      const fl = new THREE.Mesh(new THREE.CylinderGeometry(rad * 1.32, rad * 1.32, 0.14, 20), pipeMat); fl.position.copy(p); fl.quaternion.copy(q); fl.castShadow = true; scene.add(fl);
      if (s > 0.5 && s < l - 0.5) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.5, y - rad, rad * 2.4), matConc); sp.position.set(p.x, (y - rad) / 2, p.z); sp.rotation.y = Math.atan2(dir.x, dir.z); sp.castShadow = sp.receiveShadow = true; scene.add(sp); }
    }
  }
  const tube = new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(16, Math.round(L * 1.5)), rad, 18, false), pipeMat); tube.castShadow = true; tube.receiveShadow = true; scene.add(tube);
  for (const p of v.slice(1, -1)) { const e = new THREE.Mesh(new THREE.SphereGeometry(rad * 1.06, 18, 12), pipeMat); e.position.copy(p); scene.add(e); }
  const tex = flowTex.clone(); tex.needsUpdate = true; tex.repeat.set(L / 5, 1);
  const fm = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, color: 0x8fd4ff });
  const ft = new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(16, Math.round(L * 1.5)), rad * 1.12, 12, false), fm); scene.add(ft);
  flows.push({ tex, fm });
}
pipe([[-400, 3], [30, 3], [30, -13], [42, -13]], 0.62, 1.15);
pipe([[-28, 3], [-28, 7.4]], 0.36);
pipe([[-9, 3], [-9, 8.2]], 0.36);
pipe([[-14, 3], [-14, -4.2]], 0.36);
pipe([[-33, 3], [-33, -8.1]], 0.32);
pipe([[-22, 3], [-22, -22.5]], 0.3);
pipe([[2, 3], [2, -13.3]], 0.3);
pipe([[14, 3], [14, -1.8]], 0.34);
pipe([[6, 3], [6, 11.1]], 0.36);
pipe([[27, 3], [27, 12.5]], 0.38);
pipe([[24, -13], [24, -4.9]], 0.26);
pipe([[33, -13], [33, -1.9]], 0.26);
pipe([[26, -13], [26, -19.9]], 0.26);
pipe([[39, -13], [39, -16.9]], 0.26);
pipe([[36, -13], [36, -27], [35.8, -27]], 0.26);

// valves on stubs
for (const [x, z] of [[-28, 5.2], [-9, 5.6], [-14, 0.5], [-33, -2], [-22, -10], [2, -6], [14, 0.6], [6, 7], [27, 7.5]]) {
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.7), pipeMat); body.position.set(x, 1.0, z); body.castShadow = true; scene.add(body);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 6), steel); stem.position.set(x, 1.9, z); scene.add(stem);
  const wh = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 6, 24), new THREE.MeshStandardMaterial({ color: 0xc81e1e, roughness: .5 })); wh.rotation.x = Math.PI / 2; wh.position.set(x, 2.4, z); wh.castShadow = true; scene.add(wh);
}

// ---------------- buildings & details ----------------
const wallMat = new THREE.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.85 });
const winMat = new THREE.MeshPhysicalMaterial({ color: 0x1d3347, roughness: 0.05, metalness: 0.2, envMapIntensity: 1.8, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 0, clearcoat: 1 });
function building(x, z, w, h, d, rot = 0, withWin = true) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat); b.position.y = h / 2; b.castShadow = b.receiveShadow = true; g.add(b);
  const par = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.5, d + 0.3), new THREE.MeshStandardMaterial({ color: 0x9aa3ab, roughness: 0.6 })); par.position.y = h + 0.1; par.castShadow = true; g.add(par);
  if (withWin) for (const s of [-1, 1]) { const wb = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, h * 0.55), winMat); wb.position.set(0, h * 0.52, s * (d / 2 + 0.02)); if (s < 0) wb.rotation.y = Math.PI; g.add(wb); }
  for (let i = 0; i < 3; i++) { const ac = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.1), new THREE.MeshStandardMaterial({ color: 0xb9c0c7, metalness: 0.5, roughness: 0.4 })); ac.position.set(-w / 3 + i * w / 3, h + 0.8, 0); ac.castShadow = true; g.add(ac); }
  return g;
}
building(-2, 26, 18, 5.5, 8);
building(18, 26, 9, 4, 6, 0, true);
// small horizontal chlorine tanks
for (let i = 0; i < 3; i++) { const ct = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, 2.4, 6, 16), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, metalness: 0.3, roughness: 0.35 })); ct.rotation.z = Math.PI / 2; ct.position.set(24.5, 1.1, 23 + i * 1.8); ct.castShadow = true; scene.add(ct); }
// antenna mast lattice
{
  const mx = 9, mz = 27, mh = 26; const legs = [[-0.6, -0.6], [0.6, -0.6], [0.6, 0.6], [-0.6, 0.6]];
  for (const [a, b] of legs) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, mh, 6), new THREE.MeshStandardMaterial({ color: 0xd04030, roughness: .5 })); l.position.set(mx + a * 0.6, mh / 2, mz + b * 0.6); l.castShadow = true; scene.add(l); }
  for (let y = 1; y < mh; y += 1.6) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.8), new THREE.MeshStandardMaterial({ color: (Math.floor(y / 3.2) % 2) ? 0xf0f0f0 : 0xd04030, wireframe: true })); r.position.set(mx, y, mz); scene.add(r); }
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.9, 20, 10, 0, Math.PI * 2, 0, Math.PI / 3), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, side: THREE.DoubleSide })); dish.rotation.x = -Math.PI / 2.4; dish.position.set(mx + 0.4, 20, mz - 0.6); scene.add(dish);
  var mastLight = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff3030, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); mastLight.position.set(mx, mh + 0.4, mz); mastLight.scale.setScalar(3); scene.add(mastLight);
}
// flag (Mexico) waving
const flagTex = canvasTex(300, 171, (g, w, h) => { g.fillStyle = '#006847'; g.fillRect(0, 0, w / 3, h); g.fillStyle = '#fff'; g.fillRect(w / 3, 0, w / 3, h); g.fillStyle = '#ce1126'; g.fillRect(2 * w / 3, 0, w / 3, h); g.fillStyle = '#8a5a2b'; g.beginPath(); g.ellipse(w / 2, h / 2, 18, 22, 0, 0, 7); g.fill(); g.fillStyle = '#3d7a3a'; g.beginPath(); g.ellipse(w / 2, h / 2 + 18, 22, 6, 0, 0, 7); g.fill(); });
const flagGeo = new THREE.PlaneGeometry(4.2, 2.4, 24, 8); flagGeo.translate(2.1, 0, 0); flagGeo.userData.base = flagGeo.attributes.position.array.slice();
const flag = new THREE.Mesh(flagGeo, new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.8 })); flag.position.set(-17, 11.5, 31); flag.castShadow = true; scene.add(flag);
const fpole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 13, 8), steel); fpole.position.set(-17, 6.5, 31); fpole.castShadow = true; scene.add(fpole);
// cars
const carCols = [0xf2f2f2, 0x1d1f23, 0xb02020, 0x7f8a96, 0x2050a0, 0xf2f2f2, 0x40464f];
carCols.forEach((c, i) => {
  const g = new THREE.Group(); const m = new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.6, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 4.3), m); body.position.y = 0.65; g.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 2.3), new THREE.MeshPhysicalMaterial({ color: 0x111820, metalness: 0.2, roughness: 0.05, clearcoat: 1, envMapIntensity: 2 })); cab.position.set(0, 1.25, -0.2); g.add(cab);
  for (const [x, z] of [[-0.85, 1.4], [0.85, 1.4], [-0.85, -1.4], [0.85, -1.4]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.28, 14), new THREE.MeshStandardMaterial({ color: 0x111 })); w.rotation.z = Math.PI / 2; w.position.set(x, 0.36, z); g.add(w); }
  g.position.set(-24 + i * 2.8, 0, 27.5); g.traverse(o => o.isMesh && (o.castShadow = true)); scene.add(g);
});
// parking lines
for (let i = 0; i < 9; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 5), lineMat); l.rotation.x = -Math.PI / 2; l.position.set(-25.4 + i * 2.8, 0.06, 27.5); scene.add(l); }
// substation
{
  const sx = -42, sz = 24;
  for (let i = 0; i < 2; i++) { const tr = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.4, 1.6), new THREE.MeshStandardMaterial({ color: 0x8c949c, metalness: .5, roughness: .45 })); tr.position.set(sx + i * 3.6, 1.6, sz); tr.castShadow = true; scene.add(tr);
    for (let j = 0; j < 3; j++) { const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.1, 8), new THREE.MeshStandardMaterial({ color: 0x7a4a2a, roughness: .3 })); ins.position.set(sx + i * 3.6 - 0.6 + j * 0.6, 3.35, sz); scene.add(ins); } }
  const pz = new THREE.Mesh(new THREE.BoxGeometry(9, 0.3, 5), matConc); pz.position.set(sx + 1.8, 0.15, sz); pz.receiveShadow = true; scene.add(pz);
  for (const [a, b] of [[-3, -3], [10, -3]]) { const tw = new THREE.Mesh(new THREE.BoxGeometry(0.3, 9, 0.3), galv); tw.position.set(sx + a / 1.4, 4.5, sz + b + 1); tw.castShadow = true; scene.add(tw); }
}

// ---------------- night point lights ----------------
const nightLights = [[-28, 7, 6], [-18, 7, 1], [-9, 7, 7], [-12, 7, -2], [16, 7, 2], [27, 7, 10], [28, 7, -14], [-2, 6, 21]].map(([x, y, z]) => { const l = new THREE.PointLight(0xffd6a0, 0, 28, 1.7); l.position.set(x, y, z); scene.add(l); return l; });

// ---------------- camera choreography ----------------
const orbit = (c, r, h, a, fov = 40) => ({ p: V(c.x + Math.cos(a) * r, c.y + h, c.z + Math.sin(a) * r), t: c.clone(), fov });
const SRc = V(-28, 4.2, 12), PU = V(-17, 1.6, 4.6), F4c = V(39, 4, -20);
const shots = [
  { t0: 0, t1: 7.5, f: u => ({ p: V(lerp(-175, -105, u), lerp(40, 30, u), lerp(120, 82, u)), t: V(lerp(-10, -4, u), lerp(26, 3, ease(u)), lerp(-10, -2, u)), fov: 38 }) },
  { t0: 7.5, t1: 15.5, f: u => orbit(V(-2, 0, -4), lerp(118, 88, u), lerp(32, 40, u), lerp(2.48, 1.2, u), 38) },
  { t0: 15.5, t1: 17.5, fly: 1, arc: 4 },
  { t0: 17.5, t1: 23.5, f: u => orbit(SRc, lerp(17, 14, u), lerp(9.5, 8.2, u), lerp(1.0, 2.05, u), 44) },
  { t0: 23.5, t1: 25, fly: 1, arc: 0 },
  { t0: 25, t1: 30, f: u => ({ p: V(lerp(-25, -12.5, u), lerp(3.4, 2.8, u), lerp(10.2, 9.6, u)), t: V(lerp(-21.5, -9.5, u), 1.5, 4.6), fov: 50 }) },
  { t0: 30, t1: 32, fly: 1, arc: 18 },
  { t0: 32, t1: 41, f: u => orbit(V(0, 0, -4), lerp(96, 104, u), lerp(46, 52, u), lerp(0.6, 1.55, u), 40) },
  { t0: 41, t1: 43, fly: 1, arc: 12 },
  { t0: 43, t1: 48, f: u => orbit(F4c, lerp(22, 17, u), lerp(9, 6.5, u), lerp(0.35, 1.25, u), 42) },
  { t0: 48, t1: 49.5, fly: 1, arc: 10 },
  { t0: 49.5, t1: 55, f: u => orbit(V(0, 2, -4), lerp(70, 92, u), lerp(14, 30, u), lerp(2.05, 2.5, u), 42) },
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
// sun schedule
function sunElev(t) { if (t < 33) return 42; if (t < 36) return lerp(42, 14, ease((t - 33) / 3)); if (t < 39.3) return lerp(14, 3, (t - 36) / 3.3); if (t < 41.5) return lerp(3, -10, ease((t - 39.3) / 2.2)); return -10; }
function sunAz(t) { return lerp(205, 248, clamp((t - 33) / 8)); }

// ---------------- HUD ----------------
const $ = id => document.getElementById(id);
function series(n, f) { return Array.from({ length: n }, (_, i) => f(i / (n - 1))); }
const lvlS = series(48, u => 3.68 - 0.27 * u + 0.05 * Math.sin(u * 9));
const flwS = series(48, u => 1650 + (u > 0.72 ? 380 : 0) + 90 * Math.sin(u * 14) + 40 * Math.cos(u * 31));
function drawChart(svg, s, prog, color, fill) {
  const w = 200, h = 80, mn = Math.min(...s), mx = Math.max(...s); const n = Math.max(2, Math.round(s.length * prog));
  const pts = s.slice(0, n).map((v, i) => `${(i / (s.length - 1) * w).toFixed(1)},${(h - 6 - (v - mn) / (mx - mn) * (h - 16)).toFixed(1)}`); const last = pts.at(-1).split(',');
  svg.innerHTML = `<polygon points="0,${h} ${pts.join(' ')} ${last[0]},${h}" fill="${fill}"/><polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="${last[0]}" cy="${last[1]}" r="4" fill="#fff"/>`;
}
const CAPS = [[7.8, 15.2, 'GIRO 3D', 'Vista orbital del sistema', '14 tanques · 4 estaciones de bombeo · red de conducción'], [17.8, 23.2, 'ACERCAMIENTO', 'Tanque Santa Rosa 2', 'Nivel en tiempo real · llegada de agua · tendencia 24 h'], [25.2, 29.8, 'EQUIPOS DE BOMBEO', 'Estación Santa Rosa', '5 equipos operando · 1 en respaldo'], [32.4, 40.6, 'MODO DÍA / NOCHE', 'Ciclo de iluminación real', 'Sol, sombras y cielo calculados según la hora'], [43.4, 47.8, 'ALERTAS', 'Fraile 4', 'Detección automática y aviso en el modelo 3D']];
const CHIPS = [[0, 'general'], [7.5, 'giro'], [16, 'acercar'], [24, 'bombeo'], [30.5, 'dia'], [38.5, 'noche'], [42.5, 'alertas'], [48.5, 'general']];
const fmtClock = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m) % 60).padStart(2, '0')}`;
function updateHUD(t, night) {
  const ti = 1 - ease((t - 4.6) / 1.4); $('title').style.opacity = ti * ease(t / 1.0); $('title').style.transform = `translateY(${(1 - ease(t / 1.4)) * 20}px)`; $('title').style.display = ti <= 0 ? 'none' : 'flex';
  const hudIn = ease((t - 5.4) / 1.0);
  for (const id of ['brand', 'clock', 'kpi', 'bar']) { const el = $(id); el.style.opacity = hudIn; }
  $('brand').style.transform = `translateX(${(1 - hudIn) * -30}px)`; $('kpi').style.transform = `translateX(${(1 - hudIn) * 30}px)`; $('bar').style.transform = `translateX(-50%) translateY(${(1 - hudIn) * 30}px)`;
  // clock: 10:24 -> 20:36 during timelapse
  const mins = lerp(10 * 60 + 24, 20 * 60 + 36, clamp((t - 33) / 8.5)) + t / 6;
  $('clk').textContent = fmtClock(mins);
  $('wx').textContent = night > 0.5 ? 'Monterrey, N.L. · 26 °C · Despejado ☾' : (t > 37 ? 'Monterrey, N.L. · 29 °C · Atardecer' : 'Monterrey, N.L. · 31 °C · Soleado ☀');
  const c = ease((t - 5.6) / 2.2);
  $('k1').innerHTML = Math.round(10250 * c).toLocaleString('en-US') + '<small>L/S</small>'; $('b1').style.width = 78 * c + '%';
  $('k2').innerHTML = Math.round((3188 + Math.sin(t * 1.3) * 5) * c).toLocaleString('en-US') + '<small>LPS</small>'; $('b2').style.width = 64 * c + '%';
  $('k3').textContent = Math.round(26 * c) + ' / 30'; $('b3').style.width = 86 * c + '%';
  $('k4').innerHTML = (4.0 * c).toFixed(2) + '<small>m</small>'; $('b4').style.width = 57 * c + '%';
  const al = t > 42.6; $('k5').textContent = al ? '1' : '0'; $('k5').style.color = al ? '#ff4d5e' : '#eef5fc';
  let ck = 'general'; for (const [a, k] of CHIPS) if (t >= a) ck = k;
  document.querySelectorAll('.chip').forEach(ch => ch.classList.toggle('on', ch.dataset.k === ck || (ch.dataset.k === 'flujos' && night > 0.5)));
  const cp = CAPS.find(x => t >= x[0] - 0.5 && t <= x[1] + 0.5);
  if (cp) { const o = win(t, cp[0], cp[1], 0.5); $('cap').style.opacity = o; $('cap').style.transform = `translateX(${(1 - o) * -20}px)`; $('capA').textContent = cp[2]; $('capB').textContent = cp[3]; $('capC').textContent = cp[4]; } else $('cap').style.opacity = 0;
  const dv = win(t, 18.8, 24.2, 0.6); $('detail').style.opacity = dv; $('detail').style.transform = `translateX(${(1 - dv) * 30}px)`;
  const pr = ease((t - 19.0) / 2.0); drawChart($('c1'), lvlS, pr, '#4cc3ff', 'rgba(76,195,255,.22)'); drawChart($('c2'), flwS, pr, '#cfd8e2', 'rgba(207,216,226,.14)');
  const to = win(t, 42.8, 48.2, 0.4); $('toast').style.opacity = to * (0.85 + 0.15 * Math.sin(t * 8)); $('toast').style.transform = `translateX(-50%) translateY(${(1 - to) * -16}px)`;
  $('end').style.opacity = ease((t - 52.4) / 1.2);
}

// ---------------- update ----------------
const cDay = new THREE.Color(0xfff6ea), cSet = new THREE.Color(0xffa060), fogDay = new THREE.Color(0xa6c4e4), fogSet = new THREE.Color(0xe0a882), fogNight = new THREE.Color(0x0a1220);
let curAlert = null;
function updateScene(t) {
  const s = shotAt(t); camera.position.copy(s.p); camera.fov = s.fov; camera.updateProjectionMatrix(); camera.lookAt(s.t);
  const el = sunElev(t), az = sunAz(t);
  const phi = THREE.MathUtils.degToRad(90 - el), th = THREE.MathUtils.degToRad(az);
  sunDir.setFromSphericalCoords(1, phi, th);
  for (const sk of [sky, sky2]) sk.material.uniforms.sunPosition.value.copy(sunDir);
  const night = sst(3, -7, el), dayF = sst(-3, 12, el), golden = sst(22, 4, el) * sst(-4, 2, el);
  const envKey = Math.round(el * 2);
  if (envKey !== lastEnvKey) { lastEnvKey = envKey; envGround.material.color.setRGB(0.23 * dayF + 0.01, 0.29 * dayF + 0.012, 0.19 * dayF + 0.02); if (envRT) envRT.dispose(); envRT = pmrem.fromScene(envScene, 0.02); scene.environment = envRT.texture; }
  scene.environmentIntensity = lerp(0.18, 1.0, dayF);
  sun.position.copy(camera.position.clone().setY(0)).addScaledVector(sunDir, 250); sun.target.position.copy(camera.position.clone().setY(0));
  sun.position.copy(sunDir).multiplyScalar(250); sun.target.position.set(0, 0, 0);
  sun.intensity = 3.4 * sst(-2, 4, el); sun.color.copy(cDay).lerp(cSet, golden);
  hemi.intensity = lerp(0.08, 0.55, dayF); hemi.color.setHex(0xcfe3ff).lerp(new THREE.Color(0x3a5590), night);
  moonL.intensity = 0.55 * night;
  scene.fog.color.copy(fogDay).lerp(fogSet, golden * 0.8).lerp(fogNight, night); scene.fog.density = lerp(0.00042, 0.0009, night);
  renderer.toneMappingExposure = lerp(0.55, 0.78, golden) * (1 + night * 0.9);
  for (const sk of [sky, sky2]) { sk.material.uniforms.rayleigh.value = lerp(2.2, 3, golden); sk.material.uniforms.turbidity.value = lerp(3, 8, golden); }
  stars.material.opacity = night; moon.material.opacity = night;
  flareLight.position.copy(sunDir).multiplyScalar(2500); flareLight.visible = el > -1; flare.visible = el > -1;
  for (const c of clouds) { c.position.x += 0; c.material.color.setRGB(1, 1, 1).lerp(new THREE.Color(1, 0.62, 0.45), golden).lerp(new THREE.Color(0.12, 0.15, 0.22), night); c.material.opacity = 0.75 - night * 0.45; c.position.x = c.userData.x0 ?? (c.userData.x0 = c.position.x); c.position.x = c.userData.x0 + t * c.userData.v; }
  // night lighting
  lampHeadMat.emissiveIntensity = night * 6; for (const p of pools) p.material.opacity = night * (p.isSprite ? 0.9 : 0.55);
  for (const l of nightLights) l.intensity = night * 70;
  ledMat.emissiveIntensity = night * 5; glassMat.emissiveIntensity = night * 0.15; waterBodyMat.emissiveIntensity = 0.08 + night * 0.7; waterTopMat.emissiveIntensity = 0.12 + night * 0.6;
  winMat.emissiveIntensity = night * 2.2; for (const f of flows) { f.fm.opacity = night * 0.85; f.tex.offset.x = -t * 0.9; }
  bloom.threshold = lerp(0.92, 0.6, night); bloom.strength = lerp(0.3, 0.75, night);
  mastLight.material.opacity = night * (Math.sin(t * 4) > 0 ? 1 : 0.15);
  for (const tk of T) { tk.uw.material.opacity = night * 0.6; tk.signMat.emissiveIntensity = 0.12 + night * 0.9; }
  // water
  waterN.offset.set(t * 0.03, t * 0.021); waterN.rotation = 0;
  for (const tk of T) {
    const hh = tk.l; tk.water.scale.y = hh; tk.water.position.y = 0.5 + hh / 2; tk.top.position.y = 0.5 + hh + 0.01; if (tk.foam) tk.foam.position.y = 0.5 + hh + 0.02;
  }
  jetTex.offset.y = t * 1.8; splash.scale.setScalar(1 + 0.08 * Math.sin(t * 9)); splash.rotation.z = t * 0.6;
  // pumps
  for (const p of pumps) { p.fanC.rotation.y = p.standby ? 0 : t * 30; p.lampMat.emissiveIntensity = p.standby ? 1 + Math.sin(t * 4) : 2 + night * 2; p.halo.material.opacity = 0.35 + night * 0.5; }
  // flag
  { const g = flag.geometry, b = g.userData.base, a = g.attributes.position.array; for (let i = 0; i < a.length; i += 3) { const x = b[i]; a[i + 2] = Math.sin(x * 1.6 - t * 5) * 0.18 * (x / 4.2) + Math.sin(b[i + 1] * 2 + t * 3) * 0.05 * (x / 4.2); } g.attributes.position.needsUpdate = true; g.computeVertexNormals(); }
  // alert
  const alertOn = t > 42.6, pulse = 0.5 + 0.5 * Math.sin(t * 7);
  if (alertOn !== curAlert) { curAlert = alertOn; F4.signMat.map = F4.signMat.emissiveMap = alertOn ? F4.signTexA : F4.signTex; F4.signMat.needsUpdate = true; F4.lvl.material.map = alertOn ? F4.lvlTexA : F4.lvlTex; F4.lvl.material.needsUpdate = true; if (F4.statusLed) F4.statusLed.material.color.setHex(alertOn ? 0xff2a3a : 0x3ee08a); }
  beacon.material.emissiveIntensity = alertOn ? 4 + 4 * pulse : 0; beaconHalo.material.opacity = alertOn ? 0.5 + 0.5 * pulse : 0; beaconHalo.scale.setScalar(4 + 3 * pulse);
  alertLight.intensity = alertOn ? 60 * pulse : 0;
  const rp = ((t - 42.6) * 0.55) % 1; F4.ring.material.opacity = alertOn ? (1 - rp) * 0.95 : 0; F4.ring.scale.setScalar(3 + rp * 9);
  if (F4.signMat) F4.signMat.emissiveIntensity = alertOn ? 0.6 + 0.6 * pulse : F4.signMat.emissiveIntensity;
  return night;
}

window.renderAt = (t) => { const n = updateScene(t); updateHUD(t, n); composer.render(); return true; };
window.ready = true;
if (Q.has('t')) window.renderAt(parseFloat(Q.get('t')));
else { const t0 = performance.now(); const loop = () => { window.renderAt(((performance.now() - t0) / 1000) % 55); requestAnimationFrame(loop); }; loop(); }
