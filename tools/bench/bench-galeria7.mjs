// Bench da arena Galeria 7 (O3-D13): a luta com o Diretor de verdade (loop do jogo, placa de vídeo), nas 3 fases, com os 12 comuns da
// rodada 25 e os lacaios (chamada, Afogados, Pregadores); fase 2 com a maré no ar; o jogador invulnerável na boca do cano, olhando o salão.
// Uso: node tools/bench/bench-galeria7.mjs [--pagina index.html] [--gfx medio|baixo] [--seg 8] [--saida bench-galeria7.json]
// Por fase: FPS médio, 1% low, mediana/p90/p99 (ms), chamadas de desenho e triângulos (todos os passes), zumbis, programas de shader
// antes e depois (programa novo no meio da luta = compilação na partida).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const PAGINA = path.resolve(arg('pagina', path.join(RAIZ, 'index.html'))), GFX = arg('gfx', 'medio'), SEG = +arg('seg', 8), SAIDA = arg('saida', 'bench-galeria7.json');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg' };
const RAIZES = [path.dirname(PAGINA), RAIZ];
const srv = http.createServer((req, res) => {
  let rel; try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, ''); } catch { res.writeHead(400); return res.end(); }
  if (!rel) rel = path.basename(PAGINA);
  for (const r of RAIZES) { const f = path.resolve(r, rel); if (f.startsWith(r) && fs.existsSync(f) && fs.statSync(f).isFile()) { res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); return fs.createReadStream(f).pipe(res); } }
  res.writeHead(404); res.end();
});
async function medir(pg) {
  return pg.evaluate(async SEG => {
    const T = window.__T, R = T.renderer, dts = [], calls = [], tris = [], zs = []; const prog0 = R.info.programs?.length ?? 0; R.info.autoReset = false; R.info.reset();
    await new Promise(ok => { let last = performance.now(), t0 = last; const f = () => { const t = performance.now(); dts.push(t - last); last = t; calls.push(R.info.render.calls); tris.push(R.info.render.triangles); R.info.reset(); zs.push(T.Z.zs.size); if (t - t0 < SEG * 1000) requestAnimationFrame(f); else ok(); }; requestAnimationFrame(f); });
    R.info.autoReset = true; dts.shift(); calls.shift(); tris.shift(); const s = [...dts].sort((a, b) => a - b), q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))];
    const media = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length), tot = dts.reduce((a, b) => a + b, 0), pior1 = s.slice(Math.floor(s.length * .99));
    return { fpsMedio: +(1000 * dts.length / tot).toFixed(1), fps1low: +(1000 / media(pior1)).toFixed(1), msMediana: +q(.5).toFixed(2), msP90: +q(.9).toFixed(2), msP99: +q(.99).toFixed(2),
      drawCalls: Math.round(media(calls)), drawMax: Math.max(...calls), triangulos: Math.round(media(tris)), zumbis: +media(zs).toFixed(1), lacaios: T.campChefeLacVivos(), programas: [prog0, R.info.programs?.length ?? 0] };
  }, SEG);
}
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port;
  const br = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit', '--autoplay-policy=no-user-gesture-required'] });
  const pg = await br.newPage({ viewport: { width: 1280, height: 720 } }); const erros = []; pg.on('pageerror', e => erros.push(String(e.stack || e).slice(0, 300)));
  await pg.route(u => !/^http:\/\/(localhost|127\.0\.0\.1)/.test(String(u)), r => r.abort());
  await pg.goto(`http://127.0.0.1:${port}/${path.basename(PAGINA)}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await pg.waitForFunction(() => window.__T && window.__T.MAPS && window.__T.MAPS.galeria7, null, { timeout: 240000 });
  const t0 = Date.now();
  await pg.evaluate(GFX => { const T = window.__T; T.CFG.gfx = GFX; try { T.applyQuality(); } catch { }
    T.campLibera(4, 3); // o Ato V começa na Galeria 7 (rodada 21)
    T.startHost({ map: 'galeria7', zmap: 'galeria7', mode: 'zombies', zmode: 'campanha', ato: 4, rounds: 8, frags: 20, bots: 0, diff: 1, zdiff: 1 }); }, GFX);
  await pg.waitForFunction(() => !document.getElementById('warmMsg') && window.__T.ZC.world, null, { timeout: 600000, polling: 250 });
  const carga = Date.now() - t0;
  await pg.evaluate(() => { const T = window.__T; window.__simLock = true; T.Z.round = 24; T.sim(T.Z.phaseEnd - (window.__simNow || 0) + .2); T.CAMP.c.cena = null; const p = T.S.players.get('h'); p.hp = 1e9; p.dwEnd = 1e12;
    p.pos = [13, 0, 16]; T.me.pos.set(13, 0, 16); T.me.yaw = Math.atan2(13, 18); T.me.pitch = -.05; window.__simLock = false; });
  await pg.waitForTimeout(6000); // o chefe sobe, os comuns chegam
  const out = { pagina: path.relative(RAIZ, PAGINA) || PAGINA, gfx: GFX, seg: SEG, cargaMs: carga, fases: [] };
  for (const f of [0, 1, 2]) {
    await pg.evaluate(f => { const T = window.__T, CH = T.CAMP_CH, z = CH.z; if (!z) return; const p = T.S.players.get('h'); p.hp = 1e9;
      if (f) { z.hp = z.maxHp * (f === 1 ? .65 : .32); T.campChefeFase(f); } CH.lacT = 0; if (T.Z.toSpawn < 8) T.Z.toSpawn = 8;
      const a = CH.def.ataques.find(x => x.id === (f ? 'mare' : 'chamada')); if (a) { CH.atk = null; CH.inv = 0; T.campChefeAtaca(z, a, p); } }, f);
    await pg.waitForTimeout(f === 1 ? 6000 : 4000); // fase 2: mergulho e a maré
    const m = await medir(pg); out.fases.push({ fase: f + 1, ...m });
    console.log(GFX, 'fase', f + 1, `${m.fpsMedio} fps (1% ${m.fps1low}) ${m.msMediana}/${m.msP90}/${m.msP99} ms, ${m.drawCalls} draws (máx ${m.drawMax}), ${m.triangulos} tri, ${m.zumbis} zumbis, ${m.lacaios} lacaios, programas ${m.programas}`);
  }
  out.erros = erros; fs.writeFileSync(SAIDA, JSON.stringify(out, null, 1)); console.log('carga', carga, 'ms; erros', erros.length);
  await br.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
