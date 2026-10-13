// O2-E02: apoio para rodar os testes do revisor contra uma CÓPIA do jogo (PAGINA=<arquivo .html>, padrão o index.html do repositório),
// com os outros arquivos (vendor, modelos) servidos do repositório. Mesmo navegador dos testes (tests/_jogo.mjs).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const REPO = process.env.REPO || 'C:/dev/tiroteio';
const require = createRequire(REPO + '/package.json');
const { chromium } = require('playwright');
const PAGINA = path.resolve(process.env.PAGINA || REPO + '/index.html');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.css': 'text/css' };

export async function abrirJogo({ console: log = false } = {}) {
  const srv = http.createServer((req, res) => {
    let rel; try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, ''); } catch { res.writeHead(400); return res.end(); }
    const f = !rel || rel === 'index.html' ? PAGINA : path.resolve(REPO, rel);
    if (f !== PAGINA && !f.startsWith(path.resolve(REPO))) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  await ctx.route(/peerjs/, r => r.abort());
  if (!process.env.ZV2_SORTEIO) await ctx.addInitScript(() => { window.__semSorteio = true; }); // zumbi-v2: lugares fixos e sem peças nos testes antigos (os do sorteio ligam ZV2_SORTEIO ou chamam o sorteio direto)
  if (!process.env.ZV2_OBJ) await ctx.addInitScript(() => { window.__semObjetivos = true; }); // objetivos do mapa (13/10): os testes antigos jogam o clássico; os novos ligam ZV2_OBJ
  const page = await ctx.newPage(), erros = [];
  page.on('pageerror', e => erros.push(String(e.stack || e).slice(0, 400)));
  if (log) page.on('console', m => console.log('[pág]', m.text()));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__T && !document.querySelector('#btnHost').disabled, null, { timeout: 90000 });
  return { page, browser, erros, fechar: async () => { await browser.close(); srv.close(); } };
}
export { criarSala, noJogo } from 'file:///C:/dev/tiroteio/tests/_jogo.mjs';
