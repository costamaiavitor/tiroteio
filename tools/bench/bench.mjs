// Benchmark reproduzível (overhaul, Fase 0): mede cada mapa e o modo zumbi nas rodadas pedidas, com o jogo rodando de verdade
// (loop do jogo, não a simulação travada dos testes) num Chromium com a placa de vídeo da máquina.
//
// Uso:
//   node tools/bench/bench.mjs [--pagina index.html] [--gfx medio] [--mapas vila,sanatorio,arena,dust,armazem,favela,neve]
//                              [--rodadas 1,5,10,15] [--seg 10] [--saida bench-resultado.json] [--repetir 1]
//                              [--horda 1] [--zdiff 1] [--espera 150] [--arma mp40] [--gpuDedicada 1]
// Por medida: FPS médio, FPS mínimo, "1% low", quadro mediano/p90/p99 (ms), draw calls e triângulos médios,
// zumbis ativos, memória JS e de vídeo (geometrias/texturas) e tempos de carga (montagem + aquecimento).
// --horda 1 (A20, estresse): em vez dos primeiros segundos da rodada, espera os zumbis vivos chegarem ao teto da dificuldade
// (--zdiff: 0 Fácil 20, 1 Normal 24, 2 Difícil 28, 3 Pesadelo 30; até --espera s) com o jogador atirando sem parar (--arma, munição
// reposta, mira no zumbi mais perto: sangue, cápsulas, acertos e mortes) e a rodada sem fim (a fila de nascimento não acaba);
// especiais e o Carniceiro vêm como na rodada. Use com --rodadas 20,25,30. Sem --horda nada muda.
// Zumbi: o jogador fica parado no ponto de nascimento, invulnerável, com todas as portas abertas; a rodada N começa como
// começaria no jogo (mesmo número de zumbis e mesma vida) e os zumbis vêm até ele. PvP: mata-mata com 4 bots.
// Comparar duas versões: rode as duas na MESMA sessão, alternando (a máquina oscila até 30% entre sessões).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const PAGINA = path.resolve(arg('pagina', path.join(RAIZ, 'index.html')));
const GFX = arg('gfx', 'medio');
const MAPAS = arg('mapas', 'vila,sanatorio,arena,dust,armazem,favela,neve').split(',');
const RODADAS = arg('rodadas', '1,5,10,15').split(',').map(Number);
const SEG = +arg('seg', 10), REP = +arg('repetir', 1);
const SAIDA = arg('saida', 'bench-resultado.json');
const ZUMBI = new Set(['vila', 'sanatorio']);
const HORDA = +arg('horda', 0), ZDIFF = +arg('zdiff', 1), ESPERA = +arg('espera', 150), ARMA = arg('arma', 'mp40');
const GPUHP = +arg('gpuDedicada', 0); // O3-D16: 1 = força a placa dedicada (notebook híbrido; sem isso o Chromium usa a integrada, como no bench-campanha)
const TETO = [20, 24, 28, 30][ZDIFF] ?? 24; // zDf().max de cada dificuldade (ZDIFF do jogo)

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.png': 'image/png', '.jpg': 'image/jpeg', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
const RAIZES = [path.dirname(PAGINA), RAIZ];
const srv = http.createServer((req, res) => {
  let rel; try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, ''); } catch { res.writeHead(400); return res.end(); }
  if (!rel) rel = path.basename(PAGINA);
  for (const r of RAIZES) { const f = path.resolve(r, rel); if (f.startsWith(r) && fs.existsSync(f) && fs.statSync(f).isFile()) { res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); return fs.createReadStream(f).pipe(res); } }
  res.writeHead(404); res.end();
});

// mede SEG segundos de quadros reais (rAF) e devolve estatísticas
async function medir(pg) {
  return pg.evaluate(async SEG => {
    const T = window.__T, R = T.renderer, dts = [], calls = [], tris = [], zs = []; R.info.autoReset = false; R.info.reset(); // soma todos os passes do quadro (cena, arma, pós)
    await new Promise(ok => { let last = performance.now(), t0 = last;
      const f = () => { const t = performance.now(); dts.push(t - last); last = t; calls.push(R.info.render.calls); tris.push(R.info.render.triangles); R.info.reset(); if (T.Z?.zs) zs.push(T.Z.zs.size);
        if (t - t0 < SEG * 1000) requestAnimationFrame(f); else ok(); };
      requestAnimationFrame(f); });
    R.info.autoReset = true; dts.shift(); calls.shift(); tris.shift(); const s = [...dts].sort((a, b) => a - b), q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))];
    const media = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0, tot = dts.reduce((a, b) => a + b, 0);
    const pior1 = s.slice(Math.floor(s.length * .99)); // 1% piores quadros
    return {
      quadros: dts.length, fpsMedio: +(1000 * dts.length / tot).toFixed(1), fpsMin: +(1000 / s[s.length - 1]).toFixed(1),
      fps1low: +(1000 / media(pior1)).toFixed(1), msMediana: +q(.5).toFixed(2), msP90: +q(.9).toFixed(2), msP99: +q(.99).toFixed(2), msMax: +s[s.length - 1].toFixed(1),
      drawCalls: Math.round(media(calls)), triangulos: Math.round(media(tris)), zumbisAtivos: +media(zs).toFixed(1), zumbisMax: zs.length ? Math.max(...zs) : 0,
      memJsMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null,
      geometrias: R.info.memory.geometries, texturas: R.info.memory.textures, programas: R.info.programs?.length ?? null,
    };
  }, SEG);
}

async function abrir(br, port) {
  const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
  const erros = []; pg.on('pageerror', e => erros.push(String(e.stack || e).slice(0, 300)));
  await pg.route(u => !/^http:\/\/(localhost|127\.0\.0\.1)/.test(String(u)), r => r.abort()); // sem rede externa: Firebase, fontes e PeerJS ficam de fora
  await pg.goto(`http://127.0.0.1:${port}/${path.basename(PAGINA)}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await pg.waitForFunction(() => window.__T && window.__T.MAPS, null, { timeout: 240000 });
  return { pg, erros };
}

async function carregar(pg, mapa) {
  const t = await pg.evaluate(({ mapa, GFX, zumbi, ZDIFF }) => {
    const T = window.__T; T.CFG.gfx = GFX; try { T.applyQuality(); } catch { }
    const t0 = performance.now();
    if (zumbi) T.startHost({ map: mapa, zmap: mapa, mode: 'zombies', rounds: 8, frags: 20, bots: 0, diff: 1, zdiff: ZDIFF });
    else T.startHost({ map: mapa, mode: 'dm', rounds: 8, frags: 999, bots: 4, diff: 1 });
    return performance.now() - t0;
  }, { mapa, GFX, zumbi: ZUMBI.has(mapa), ZDIFF });
  const tw = Date.now();
  await pg.waitForFunction(() => !document.getElementById('warmMsg'), null, { timeout: 600000, polling: 250 });
  return { montagemMs: Math.round(t), aquecimentoMs: Date.now() - tw };
}

// A20: horda cheia. Depois do zStartRound: arma automática na mão (inventário no host + mensagem 'inv' como no jogo),
// rodada sem fim e um laço por quadro que mira no zumbi vivo mais perto (peito) e atira pelo shoot() do jogo, com munição reposta.
async function horda(pg, rod) {
  const t0 = Date.now();
  await pg.evaluate(({ ARMA }) => {
    const T = window.__T, p = T.S.players.get('h'); p.hp = 1e9; // o zStartRound devolve a vida cheia; o Dying Wish (dwEnd) segura os golpes
    if (ARMA && T.W[ARMA]) { p.inv.secondary = ARMA; T.onMsg({ t: 'inv', inv: p.inv, m: p.money, got: ARMA }); }
    const A = window.__a20 = { on: true, tiros: 0, spawn0: 0 }, G = T.G, me = T.me, cam = T.camera;
    const loop = () => { if (!A.on) return;
      if (T.Z.toSpawn < 40) T.Z.toSpawn = 40; // rodada sem fim: a fila de nascimento nunca acaba
      let best = null, bd = 1e9; for (const zc of T.ZC.zs.values()) { if (zc.dead) continue; const dx = zc.pos.x - cam.position.x, dz = zc.pos.z - cam.position.z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = zc; } }
      if (best) { const dx = best.pos.x - cam.position.x, dz = best.pos.z - cam.position.z, dy = best.pos.y + 1.2 - cam.position.y; me.yaw = Math.atan2(-dx, -dz); me.pitch = Math.atan2(dy, Math.hypot(dx, dz)); }
      const a = G.ammo[G.cur]; if (a) { a.mag = Math.max(a.mag, 5); a.res = 999; }
      if (best && G.cur !== 'knife' && !G.reloadEnd && !(G.switchEnd > performance.now() / 1000) && performance.now() / 1000 >= G.nextFire) { try { T.shoot(); A.tiros++; } catch (e) { } }
      requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }, { ARMA });
  await pg.waitForFunction(teto => window.__T.Z.zs.size >= teto, TETO, { timeout: ESPERA * 1000, polling: 250 }).catch(() => {});
  await pg.waitForTimeout(1500); // o último a nascer chega à tela
  return { esperaS: Math.round((Date.now() - t0) / 1000), ...(await pg.evaluate(() => { const T = window.__T, A = window.__a20; A.zmin = 1e9; A.zmon = setInterval(() => { A.zmin = Math.min(A.zmin, T.Z.zs.size); }, 100);
    return { tiros0: A.tiros, id0: T.Z.nextId, vivos0: T.Z.zs.size, t0: performance.now() }; })) };
}
async function hordaFim(pg, h) {
  return pg.evaluate(h => { const T = window.__T, A = window.__a20; A.on = false; clearInterval(A.zmon); const s = (performance.now() - h.t0) / 1000, esp = {};
    for (const z of T.Z.zs.values()) if (z.kind) esp[z.kind] = (esp[z.kind] || 0) + 1;
    return { esperaS: h.esperaS, zumbisMin: A.zmin, tirosS: +((A.tiros - h.tiros0) / s).toFixed(1), mortes: (T.Z.nextId - h.id0) - (T.Z.zs.size - h.vivos0), especiais: esp, nuvens: T.Z.clouds.length, caes: [...T.Z.zs.values()].filter(z => z.dog).length, arma: T.G.cur }; }, h);
}

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port;
  const br = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit', '--autoplay-policy=no-user-gesture-required', '--enable-precise-memory-info', ...(GPUHP ? ['--force_high_performance_gpu'] : [])] });
  const out = { pagina: path.relative(RAIZ, PAGINA) || PAGINA, gfx: GFX, seg: SEG, quando: new Date().toISOString(), medidas: [] };
  for (let rep = 0; rep < REP; rep++) for (const mapa of MAPAS) {
    const { pg, erros } = await abrir(br, port);
    try {
      const carga = await carregar(pg, mapa);
      if (ZUMBI.has(mapa)) {
        for (const rod of RODADAS) {
          await pg.evaluate(rod => {
            const T = window.__T, p = T.S.players.get('h'); p.money = 1e8; p.dwEnd = 1e12; p.hp = 1e9;
            for (const d of T.ZD.doors) { const k = [p.pos[0], p.pos[1], p.pos[2]]; p.pos[0] = d.x; p.pos[2] = d.z; T.srvZUse(p, { k: 'door', id: d.id }); p.pos[0] = k[0]; p.pos[2] = k[2]; }
            T.Z.zs.clear(); T.Z.round = rod - 1; T.zStartRound(); window.__simLock = false; // daqui em diante o loop real do jogo roda
          }, rod);
          if (HORDA) { const h = await horda(pg, rod); const m = await medir(pg), d = await hordaFim(pg, h);
            out.medidas.push({ mapa, modo: 'horda', rodada: rod, zdiff: ZDIFF, teto: TETO, rep, ...(rod === RODADAS[0] ? carga : {}), ...m, ...d });
            console.log(mapa, 'r' + rod, `horda ${m.zumbisAtivos}/${TETO} (min ${d.zumbisMin}) em ${d.esperaS} s`, `${m.fpsMedio} fps (min ${m.fpsMin}, 1% ${m.fps1low}) ${m.msMediana}/${m.msP90} ms, ${m.drawCalls} draws,`,
              `${d.tirosS} tiros/s, ${d.mortes} mortes, especiais ${JSON.stringify(d.especiais)}, nuvens ${d.nuvens}`);
            continue; }
          await pg.waitForTimeout(4000); // os zumbis da rodada começam a nascer e a vir
          const m = await medir(pg);
          out.medidas.push({ mapa, modo: 'zumbi', rodada: rod, rep, ...(rod === RODADAS[0] ? carga : {}), ...m });
          console.log(mapa, 'r' + rod, `${m.fpsMedio} fps (min ${m.fpsMin}, 1% ${m.fps1low}) ${m.msMediana}/${m.msP90} ms, ${m.drawCalls} draws, ${m.zumbisAtivos} zumbis`);
        }
      } else {
        await pg.evaluate(() => { window.__simLock = false; });
        await pg.waitForTimeout(3000);
        const m = await medir(pg);
        out.medidas.push({ mapa, modo: 'pvp', rep, ...carga, ...m });
        console.log(mapa, `${m.fpsMedio} fps (min ${m.fpsMin}, 1% ${m.fps1low}) ${m.msMediana}/${m.msP90} ms, ${m.drawCalls} draws`);
      }
      if (erros.length) { out.medidas.at(-1).erros = erros; console.log('  erros:', erros.length); }
    } catch (e) { out.medidas.push({ mapa, rep, falha: String(e).slice(0, 300), erros }); console.log(mapa, 'FALHOU', String(e).slice(0, 200)); }
    await pg.close();
  }
  fs.writeFileSync(SAIDA, JSON.stringify(out, null, 1)); console.log('gravado em', SAIDA);
  await br.close(); srv.close();
})();
