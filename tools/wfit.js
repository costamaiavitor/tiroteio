// Ferramenta de desenvolvimento: mede modelos de arma (glTF) para encaixar nos braços dos pacotes.
// Renderiza vistas ortográficas num referencial escolhido (raiz do modelo ou um osso), com grade e valores nos eixos,
// e devolve a caixa dos vértices nesse referencial. As imagens vão por POST para http://127.0.0.1:8799.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export const S = {};
let env = null;
export async function load(key, url) {
  const g = await new GLTFLoader().loadAsync(url);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xd8d2c4); scene.add(g.scene);
  const r = window.__T.renderer;
  if (!env) env = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(r), .04).texture;
  scene.environment = env;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 1.5));
  g.scene.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
  const mixer = new THREE.AnimationMixer(g.scene);
  g.scene.updateMatrixWorld(true);
  S[key] = { g, scene, mixer };
  const bones = []; g.scene.traverse(o => { if (o.isBone) bones.push(o.name); });
  const meshes = []; g.scene.traverse(o => { if (o.isMesh) meshes.push(o.name + '/' + o.material.name); });
  return { anims: g.animations.map(a => a.name + ':' + a.duration.toFixed(2)), bones, meshes };
}
export function pose(key, name, t = 0) {
  const s = S[key]; s.mixer.stopAllAction();
  const c = s.g.animations.find(a => a.name.endsWith(name)); if (!c) return 'no clip';
  s.mixer.clipAction(c).play(); s.mixer.setTime(t); s.g.scene.updateMatrixWorld(true); return c.name;
}
// pontos (mundo) de todas as malhas que passam no filtro
export function points(key, filt = () => true, step = 1) {
  const out = [], v = new THREE.Vector3();
  S[key].g.scene.traverse(m => {
    if (!m.isMesh || !m.visible || !filt(m)) return;
    const p = m.geometry.attributes.position;
    for (let i = 0; i < p.count; i += step) { v.fromBufferAttribute(p, i); if (m.isSkinnedMesh) m.applyBoneTransform(i, v); out.push(v.clone().applyMatrix4(m.matrixWorld)); }
  });
  return out;
}
export function frameOf(key, bone) {
  if (!bone) return new THREE.Matrix4();
  let b = null; S[key].g.scene.traverse(o => { if (o.name === bone || o.name.startsWith(bone)) b = b || o; });
  return b.matrixWorld.clone();
}
// caixa dos pontos no referencial F
export function box(key, filt, bone) {
  const Fi = frameOf(key, bone).invert(), bb = new THREE.Box3();
  for (const p of points(key, filt, 1)) bb.expandByPoint(p.applyMatrix4(Fi));
  const r = a => a.toArray().map(x => +x.toFixed(4));
  return { min: r(bb.min), max: r(bb.max), size: r(bb.getSize(new THREE.Vector3())) };
}
// vista ortográfica olhando ao longo do eixo ax (0=x,1=y,2=z) do referencial F; grade com valores
export async function view(name, key, { filt = () => true, bone, ax = 0, sign = 1, w = 1100, marks = [], hide = () => false, pad = .08, win = null, grid = 10 } = {}) {
  const s = S[key], F = frameOf(key, bone), Fi = F.clone().invert();
  const hidden = []; s.g.scene.traverse(o => { if (o.isMesh && (hide(o) || !filt(o)) && o.visible) { o.visible = false; hidden.push(o); } });
  const bb = new THREE.Box3(); for (const p of points(key, filt, 2)) bb.expandByPoint(p.applyMatrix4(Fi));
  const b = (ax + 1) % 3, c = (ax + 2) % 3; // eixos da tela: horizontal = maior dos dois
  let hA = b, vA = c; const sz = bb.getSize(new THREE.Vector3()).toArray();
  if (sz[c] > sz[b]) { hA = c; vA = b; }
  const lo = bb.min.toArray(), hi = bb.max.toArray(), ctr = bb.getCenter(new THREE.Vector3());
  if (win) { // janela [centro horizontal, centro vertical, largura] para ampliar uma região
    const [hc, vc, sp] = win, vs = sp * .6; lo[hA] = hc - sp / 2; hi[hA] = hc + sp / 2; lo[vA] = vc - vs / 2; hi[vA] = vc + vs / 2;
    ctr.setComponent(hA, hc); ctr.setComponent(vA, vc); pad = 0;
  }
  const spanH = (hi[hA] - lo[hA]) * (1 + 2 * pad), spanV = (hi[vA] - lo[vA]) * (1 + 2 * pad) + spanH * .05;
  const hpx = Math.round(w * spanV / spanH);
  const cam = new THREE.OrthographicCamera(-spanH / 2, spanH / 2, spanV / 2, -spanV / 2, -100, 100);
  const dir = new THREE.Vector3(); dir.setComponent(ax, sign);
  const up = new THREE.Vector3(); up.setComponent(vA, 1);
  // câmera no referencial F: olha para -dir, com "up" no eixo vertical
  const eye = ctr.clone().addScaledVector(dir, 10);
  const L = new THREE.Matrix4().lookAt(eye, ctr, up); L.setPosition(eye);
  cam.matrixAutoUpdate = false; cam.matrix.copy(F).multiply(L); cam.matrixWorld.copy(cam.matrix); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
  cam.updateProjectionMatrix();
  const r = window.__T.renderer, rt = new THREE.WebGLRenderTarget(w, hpx, { samples: 4 }); rt.texture.colorSpace = THREE.SRGBColorSpace;
  const prev = r.getRenderTarget(); r.setRenderTarget(rt); r.clear(); r.render(s.scene, cam);
  const px = new Uint8Array(w * hpx * 4); r.readRenderTargetPixels(rt, 0, 0, w, hpx, px); r.setRenderTarget(prev); rt.dispose();
  for (const o of hidden) o.visible = true;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = hpx; const g = cv.getContext('2d'), id = g.createImageData(w, hpx);
  for (let y = 0; y < hpx; y++) id.data.set(px.subarray((hpx - 1 - y) * w * 4, (hpx - y) * w * 4), y * w * 4);
  g.putImageData(id, 0, 0);
  // projeta ponto do referencial F para pixel
  const P = p => { const v = new THREE.Vector3(...p).applyMatrix4(F).project(cam); return [(v.x + 1) / 2 * w, (1 - v.y) / 2 * hpx]; };
  const nice = span => { const r0 = span / grid, e = 10 ** Math.floor(Math.log10(r0)), m = r0 / e; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * e; };
  g.font = '12px monospace'; g.lineWidth = 1;
  const AX = 'xyz';
  for (const [A, B] of [[hA, vA], [vA, hA]]) {
    const st = nice(hi[A] - lo[A]);
    for (let t = Math.ceil((lo[A] - (hi[A] - lo[A]) * pad) / st) * st; t <= hi[A] + (hi[A] - lo[A]) * pad; t += st) {
      const p0 = ctr.toArray(), p1 = ctr.toArray(); p0[A] = p1[A] = t; p0[B] = -1e3; p1[B] = 1e3;
      const a = P(p0), q = P(p1); const zero = Math.abs(t) < st / 2;
      g.strokeStyle = zero ? 'rgba(200,0,0,.8)' : 'rgba(0,0,0,.22)'; g.beginPath(); g.moveTo(...a); g.lineTo(...q); g.stroke();
      g.fillStyle = '#004'; const lab = AX[A] + '=' + (+t.toFixed(4));
      if (A === hA) { const x = P(p0.map((v, i) => i === A ? t : i === vA ? lo[vA] : v))[0]; g.fillText(lab, x + 2, hpx - 4); }
      else { const y = P(p0.map((v, i) => i === A ? t : i === hA ? lo[hA] : v))[1]; g.fillText(lab, 2, y - 2); }
    }
  }
  // seta do eixo horizontal: para onde cresce
  const o0 = P(ctr.toArray()), o1 = P(ctr.toArray().map((v, i) => i === hA ? v + (hi[hA] - lo[hA]) * .1 : v));
  g.fillStyle = '#a00'; g.fillText('+' + AX[hA] + (o1[0] > o0[0] ? ' →' : ' ←') + '   +' + AX[vA] + ' ↑   olhando de ' + (sign > 0 ? '+' : '-') + AX[ax], 4, 14);
  for (const [p, col, lab] of marks) { const [x, y] = P(p); g.fillStyle = col; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); if (lab) g.fillText(lab, x + 7, y - 4); }
  const bl = await new Promise(res => cv.toBlob(res, 'image/png')); await fetch('http://127.0.0.1:8799/' + name + '.png', { method: 'POST', body: bl });
  return { h: AX[hA], v: AX[vA], min: lo.map(x => +x.toFixed(4)), max: hi.map(x => +x.toFixed(4)) };
}
// vista em perspectiva (para pacotes de braços: olho na origem olhando para o centro das malhas)
export async function persp(name, key, { eye = [0, 0, 0], target, fov = 62, w = 640, h = 360 } = {}) {
  const s = S[key], cam = new THREE.PerspectiveCamera(fov, w / h, .001, 100);
  if (!target) { const bb = new THREE.Box3(); for (const p of points(key, () => true, 7)) bb.expandByPoint(p); target = bb.getCenter(new THREE.Vector3()).toArray(); }
  cam.position.set(...eye); cam.lookAt(new THREE.Vector3(...target)); cam.updateMatrixWorld();
  const r = window.__T.renderer, rt = new THREE.WebGLRenderTarget(w, h, { samples: 4 }); rt.texture.colorSpace = THREE.SRGBColorSpace;
  const prev = r.getRenderTarget(); r.setRenderTarget(rt); r.clear(); r.render(s.scene, cam);
  const px = new Uint8Array(w * h * 4); r.readRenderTargetPixels(rt, 0, 0, w, h, px); r.setRenderTarget(prev); rt.dispose();
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'), id = g.createImageData(w, h);
  for (let y = 0; y < h; y++) id.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
  g.putImageData(id, 0, 0);
  const bl = await new Promise(res => cv.toBlob(res, 'image/png')); await fetch('http://127.0.0.1:8799/' + name + '.png', { method: 'POST', body: bl });
  return target;
}
