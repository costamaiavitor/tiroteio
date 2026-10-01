// Ferramenta de teste da primeira pessoa (só para desenvolvimento). No console do jogo:
//   const m = await import('./tools/vmtest.js'); await m.start('dust'); await m.crop('nome', x0, y0, x1, y1)
// As imagens vão por POST para http://127.0.0.1:8799 (tools/blender/recv.py), já que a aba pode estar sem tela visível.
import * as THREE from 'three';
const T = () => window.__T;
const POST = 'http://127.0.0.1:8799/';
let scene = null;
const wait = ms => new Promise(r => setTimeout(r, ms));
export async function start(map = 'dust', weapon = null) {
  const q = s => document.querySelector(s);
  q('#hostForm [data-mode="dm"]').click(); q(`#hostForm [data-map="${map}"]`).click(); q('#hostForm [data-k="bots"][data-v="0"]').click(); q('#btnHost').click();
  await wait(4500); q('#click')?.classList.add('hidden');
  window.errs = []; addEventListener('error', e => window.errs.push(e.message + ' ' + e.lineno));
  const t = T(); t.me.pitch = -.05; t.equip(weapon || t.G.inv.primary, true); await wait(1000);
  let s = t.vmRoot; while (s.parent) s = s.parent; scene = s;
  return window.errs;
}
// trava o tempo e avança um quadro (para a arma e os braços ficarem parados na pose)
export function settle(n = 1) { const t = T(); window.__simLock = true; window.__simNow = window.__simNow || performance.now() / 1000; t.G.switchEnd = 0; for (let i = 0; i < n; i++) t.sim(1 / 60); }
export function release() { window.__simLock = false; }
export function equip(id) { const t = T(), w = t.W[id]; if (w.slot === 'primary') t.G.inv.primary = id; else if (w.slot === 'secondary') t.G.inv.secondary = id; t.equip(id, true); settle(); }
async function rtShot(name, cam, w, h, cross) {
  const r = T().renderer, rt = new THREE.WebGLRenderTarget(w, h, { samples: 4 }); rt.texture.colorSpace = THREE.SRGBColorSpace;
  const prev = r.getRenderTarget(), cc = r.getClearColor(new THREE.Color()), ca = r.getClearAlpha();
  r.setRenderTarget(rt); r.setClearColor(0xc9b48a, 1); r.clear(); r.render(scene, cam);
  const px = new Uint8Array(w * h * 4); r.readRenderTargetPixels(rt, 0, 0, w, h, px); r.setRenderTarget(prev); r.setClearColor(cc, ca); rt.dispose();
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'), id = g.createImageData(w, h);
  for (let y = 0; y < h; y++) id.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
  g.putImageData(id, 0, 0);
  if (cross) { g.strokeStyle = '#0c0'; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2 - 12, h / 2); g.lineTo(w / 2 + 12, h / 2); g.moveTo(w / 2, h / 2 - 12); g.lineTo(w / 2, h / 2 + 12); g.stroke(); }
  const b = await new Promise(res => cv.toBlob(res, 'image/png')); await fetch(POST + name + '.png', { method: 'POST', body: b });
}
// tela inteira do jogo (só a primeira pessoa), proporção asp
export async function full(name, asp = 16 / 9, w = 1280) { const c = T().vmCam.clone(); c.aspect = asp; c.updateProjectionMatrix(); await rtShot(name, c, w, Math.round(w / asp), true); }
// recorte da tela do jogo (coordenadas 0..1), em alta resolução
export async function crop(name, x0, y0, x1, y1, w = 1000) {
  const FW = 3840, FH = 2160, c = T().vmCam.clone(); c.aspect = 16 / 9; c.setViewOffset(FW, FH, x0 * FW, y0 * FH, (x1 - x0) * FW, (y1 - y0) * FH); c.updateProjectionMatrix();
  await rtShot(name, c, w, Math.round(w * (y1 - y0) * FH / ((x1 - x0) * FW)), false);
}
// câmera livre em volta de um objeto (off nos eixos da câmera do jogador)
export async function around(name, obj, off, fov = 30, size = 600) {
  const t = T(), c = new THREE.PerspectiveCamera(fov, 1, .005, 10), p = obj.getWorldPosition(new THREE.Vector3()), q = t.vmRoot.getWorldQuaternion(new THREE.Quaternion());
  c.up.set(0, 1, 0).applyQuaternion(q); c.position.copy(p).add(new THREE.Vector3(...off).applyQuaternion(q)); c.lookAt(p); c.updateMatrixWorld();
  await rtShot(name, c, size, size, false);
}
// onde caem na tela (16:9) a boca do cano e os alvos das mãos
export function probe() {
  const t = T(), ud = t.vmGun.userData, c = t.vmCam.clone(); c.aspect = 16 / 9; c.updateProjectionMatrix(); t.vmRoot.updateMatrixWorld(true);
  const P = v => { const p = v.clone().project(c); return [+((p.x + 1) / 2).toFixed(3), +((1 - p.y) / 2).toFixed(3)]; };
  const tip = new THREE.Vector3(0, 0, 1e9), cc = new THREE.Vector3();
  t.vmGun.children[0].traverse(o => { if (!o.isMesh || !o.visible) return; o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; for (let i = 0; i < 8; i++) { cc.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(o.matrixWorld); if (cc.z < tip.z) tip.copy(cc); } });
  const out = { muzzle: P(tip) };
  if (ud.armsGun) { out.lh = P(ud.armsGun.lt.getWorldPosition(new THREE.Vector3())); out.rh = P(ud.armsGun.rt.getWorldPosition(new THREE.Vector3())); }
  return out;
}
