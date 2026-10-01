// Ferramenta de desenvolvimento: abre um glTF de braços de FPS (Sketchfab) num cenário à parte, toca uma animação e
// renderiza. As imagens vão por POST para http://127.0.0.1:8799 (tools/blender/recv.py).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export let G = null, mixer = null, scene = null, cam = null;
export async function load(url) {
  G = await new GLTFLoader().loadAsync(url);
  scene = new THREE.Scene(); scene.background = new THREE.Color(0xc9b48a); scene.add(G.scene);
  const r = window.__T.renderer, pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromScene(new RoomEnvironment(r), .04).texture;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 1.2)); const d = new THREE.DirectionalLight(0xfff2e0, 2); d.position.set(-1, 2, 1.5); scene.add(d);
  G.scene.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
  mixer = new THREE.AnimationMixer(G.scene);
  return { anims: G.animations.map(a => [a.name, +a.duration.toFixed(2)]) };
}
export function pose(name, t) {
  mixer.stopAllAction(); const clip = G.animations.find(a => a.name.includes(name)) || G.animations[0]; const a = mixer.clipAction(clip); a.play(); mixer.setTime(t); G.scene.updateMatrixWorld(true);
}
export function names() { const out = []; G.scene.traverse(o => out.push(o.type[0] + ':' + o.name)); return out; }
export function meshes() { const out = []; G.scene.traverse(o => { if (o.isMesh) out.push(o); }); return out; }
export const isArms = o => /arm|sleeve|glove|Male_|Manny|mesh_Mat/i.test(o.name + ' ' + o.material.name + ' ' + (o.geometry.name || ''));
// pontos do mundo de uma malha com esqueleto (amostrados)
export function pts(mesh, step = 5) {
  const v = new THREE.Vector3(), p = mesh.geometry.attributes.position, out = [];
  for (let i = 0; i < p.count; i += step) { v.fromBufferAttribute(p, i); if (mesh.isSkinnedMesh) mesh.applyBoneTransform(i, v); out.push(v.clone().applyMatrix4(mesh.matrixWorld)); }
  return out;
}
export async function shotCam(name, c, w = 960, h = 540, cross = true) {
  const r = window.__T.renderer;
  const rt = new THREE.WebGLRenderTarget(w, h, { samples: 4 }); rt.texture.colorSpace = THREE.SRGBColorSpace;
  const prev = r.getRenderTarget(); r.setRenderTarget(rt); r.clear(); r.render(scene, c);
  const px = new Uint8Array(w * h * 4); r.readRenderTargetPixels(rt, 0, 0, w, h, px); r.setRenderTarget(prev); rt.dispose();
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'), id = g.createImageData(w, h);
  for (let y = 0; y < h; y++) id.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
  g.putImageData(id, 0, 0);
  if (cross) { g.strokeStyle = '#0c0'; g.beginPath(); g.moveTo(w / 2 - 10, h / 2); g.lineTo(w / 2 + 10, h / 2); g.moveTo(w / 2, h / 2 - 10); g.lineTo(w / 2, h / 2 + 10); g.stroke(); }
  const b = await new Promise(res => cv.toBlob(res, 'image/png')); await fetch('http://127.0.0.1:8799/' + name + '.png', { method: 'POST', body: b });
}
export async function shot(name, _n, { fov = 62, asp = 16 / 9, w = 960, off, look } = {}) {
  cam = new THREE.PerspectiveCamera(fov, asp, .01, 200); cam.position.set(...off); cam.lookAt(new THREE.Vector3(...look)); cam.updateMatrixWorld();
  await shotCam(name, cam, w, Math.round(w / asp));
}
