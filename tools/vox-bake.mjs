// Pré-calcula as armas em voxel (assets/vox/*.bin.gz) abrindo o jogo num Chromium sem tela e montando cada arma baixada.
// Uso: node tools/vox-bake.mjs [ids separados por vírgula]   (precisa do playwright; ver tests/)
import { chromium } from 'playwright';
import fs from 'fs'; import zlib from 'zlib'; import path from 'path';
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..') + '/';
const TYPES = { js: 'text/javascript', html: 'text/html', css: 'text/css', json: 'application/json', png: 'image/png', jpg: 'image/jpeg', gltf: 'model/gltf+json', bin: 'application/octet-stream', wav: 'audio/wav', gz: 'application/gzip' };
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 960, height: 540 } });
await ctx.route('**/*', r => { const u = new URL(r.request().url()); if (u.hostname !== 'localhost') return r.abort();
  const f = REPO + (u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname.slice(1)));
  if (/assets\/vox\//.test(f)) return r.fulfill({ status: 404, body: '' }); // sempre recalcula
  if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ body: fs.readFileSync(f), contentType: TYPES[f.split('.').pop()] }); });
const p = await ctx.newPage(); await p.goto('http://localhost/'); await p.waitForTimeout(3000);
await p.evaluate(() => document.querySelector('#btnHost').click()); await p.waitForTimeout(800);
await p.evaluate(() => { document.querySelector('#lbForm [data-mode="dm"]').click(); document.querySelector('#lbForm [data-map="arena"]').click(); });
await p.evaluate(() => document.querySelector('#lbGo').click()); await p.waitForTimeout(10000);
await p.evaluate(() => setInterval(() => { window.__T.me.hp = 100; }, 50));
let ids = process.argv[2]?.split(',') || await p.evaluate(() => { const T = window.__T; return Object.keys(T.W).filter(id => T.fpw(id) && ['primary', 'secondary'].includes(T.W[id].slot)); });
const feitos = new Set();
for (const id of ids) {
  const r = await p.evaluate(async id => { const T = window.__T, G = T.G, sl = T.W[id].slot; G.inv[sl] = id; G.ammo[id] = { mag: T.W[id].mag, res: 90 }; T.VX.ult = null;
    T.equip(id, true); for (let i = 0; i < 600 && !T.vmGun?.userData.fps2; i++) await new Promise(r => setTimeout(r, 100)); return T.vxExport(); }, id);
  if (!r) { console.log(id, 'sem arma montada'); continue; }
  if (feitos.has(r.nome)) { console.log(id, '=', r.nome); continue; } feitos.add(r.nome);
  const gz = zlib.gzipSync(Buffer.from(r.b64, 'base64'), { level: 9 }); fs.writeFileSync(REPO + 'assets/vox/' + r.nome + '.bin.gz', gz);
  console.log(id, '->', r.nome, (gz.length / 1024).toFixed(0) + ' KB');
}
// braços (mãos) em voxel: um arquivo por malha de braços (iguais em todos os pacotes que pegam os braços do mesmo pacote)
const br = await p.evaluate(() => window.__T.vxbExport?.() || []);
for (const r of br) { const gz = zlib.gzipSync(Buffer.from(r.b64, 'base64'), { level: 9 }); fs.writeFileSync(REPO + 'assets/vox/' + r.nome + '.bin.gz', gz); console.log('braços ->', r.nome, (gz.length / 1024).toFixed(0) + ' KB'); }
await b.close();
