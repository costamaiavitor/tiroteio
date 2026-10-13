// Bench da campanha (Onda 3, O3-D15; docs/overhaul/campanha.md §10, §15, §16 e docs/overhaul/balanceamento.md).
// Joga cada etapa da campanha (I, II, C1, III, IV, C2, V) do começo, com o kit do checkpoint (CAMP_KIT), com 1 ou 2 jogadores
// controlados por um robô simples, e mede:
//   --modo balanco (padrão): relógio travado (T.sim, 60 Hz, sem placa de vídeo: roda no SwiftShader, como os testes). Por rodada:
//     duração (s de jogo), zumbis da rodada e quantos de cada tipo nasceram, vivos no máximo, dano recebido por jogador, quedas,
//     quedas do time (todos caídos ao mesmo tempo = recomeçaria do checkpoint), tiros (munição gasta), acertos, abates, pontos.
//     Por etapa: soma, tempo total (rodadas + intervalos + pré-rodada), tempo do chefe (do nascimento à morte), pontos no fim.
//   --modo curva: só lê as tabelas (sem jogar): vida do comum, zumbis da rodada, carga (vida × zumbis) e a do clássico na mesma rodada,
//     dano por segundo da melhor arma do kit e o "esforço" (carga ÷ dps, em s), vida do chefe; por dificuldade e jogadores.
//   --modo fps: jogo de verdade (loop real, placa de vídeo), o robô jogando em tempo real na rodada pedida de cada etapa
//     (--rodada; padrão: a última rodada do ato e a do chefe): FPS médio, 1% low, mediana/p90/p99 (ms), quadro máximo, chamadas de
//     desenho (média e máxima), triângulos, zumbis e lacaios, programas de shader antes e depois (programa novo = compilação na
//     partida), tempo de carga (montagem + aquecimento). Os quadros acima de --lento ms são listados com o que mudou neles.
//
// O robô (o mesmo nos dois modos) é deliberadamente simples, para comparar etapas e dificuldades entre si (não é um jogador bom):
//   - fica no ponto de nascimento; se um zumbi chega a menos de --kite m, recua a --kiteV m/s (5,1: a corrida do modo zumbi, RUN ×0,8)
//     pela grade de navegação (células andáveis das áreas abertas), sem passar de --coleira m de casa;
//   - sem zumbi à vista por --perdido s (empurrado para trás de uma parede, preso), volta para casa (contado em 'volta');
//   - ninguém vê zumbi há --caca s (20): com o chefe vivo, vai até perto dele ('vaiChefe'); sem ninguém para nascer, os últimos
//     zumbis (presos longe) caem como 'cacados' (o tempo de ir até eles não entra);
//   - faca (150) no zumbi a até 2 m que morre com 2 facadas (rodadas iniciais), como o jogador faz;
//   - atira no zumbi visível mais perto (linha livre do olho ao peito) com a melhor arma do inventário (maior dano por segundo), na
//     cadência da arma, pente e recarga dela (Speed Cola: metade); acerta --mira das vezes, e --cabeca dos acertos são na cabeça;
//     no chefe, com o ponto fraco aberto, metade dos acertos vão nele; o dano vai pelo zHit do host (mesmo caminho do zhit:
//     capacete, crosta, Silêncio, tetos do chefe); na Hora do Silêncio usa a faca (150, até 2,2 m); com o Diretor protegido,
//     atira nos tanques do Veio (a armadura dele); as outras fraquezas de arena (curto, válvulas, junções) ele não usa: o tempo dos
//     chefes medido é um teto (o jogador que usa a arena termina antes);
//   - vida virtual: o jogador do host fica com vida enorme (nunca cai de verdade, para a etapa ir até o fim) e o dano que ele
//     levaria é descontado de uma vida virtual com a regeneração do ZDIFF (atraso e vida por segundo); a vida virtual em 0 é uma
//     queda: com o parceiro em pé, volta em --reanimar s; sozinho com Quick Revive, em 6 s (até 3 vezes); senão é queda do time
//     (contada uma vez por rodada; no resto da rodada o dano não conta mais: no jogo o time recomeçaria do checkpoint);
//   - objetivos: todo objetivo que fica ativo é cumprido na hora (campForca), menos o 'matar' (o chefe é derrotado no tiro). Assim a
//     etapa dura as rodadas mínimas (rodMin); o tempo de andar até os objetivos NÃO está no tempo medido.
// O segundo jogador entra pelo caminho de quem entra no meio (join no intervalo de pré-rodada, recebe o kit da etapa).
//
// Uso:
//   node tools/bench/bench-campanha.mjs [--modo balanco|fps] [--etapas I,II,C1,III,IV,C2,V] [--dif 0,1,2] [--np 1,2] [--rep 1]
//        [--pagina index.html] [--saida bench-campanha.json] [--mira .7] [--cabeca .25] [--kite 3] [--kiteV 4.5] [--coleira 14]
//        [--reanimar 4] [--perdido 4] [--caca 20] [--teto 3600] [--rodadaMax 900] [--semente 1] [--ref 1] [--inicio N] [--inf vila --inicio 20 --ate 20 --etapas V]
//   modo fps: [--gfx medio|baixo|alto] [--seg 8] [--rodada N] [--lento 50] [--vsync 1] [--gpuDedicada 1]
// Comparar duas versões: rode as duas na mesma sessão, alternando (a máquina oscila até 30% entre sessões).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { ROBO_PADRAO, comecar, jogar } from './robo-campanha.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const PAGINA = path.resolve(arg('pagina', path.join(RAIZ, 'index.html')));
const MODO = arg('modo', 'balanco');
const ETAPAS = arg('etapas', 'I,II,C1,III,IV,C2,V').split(',');
const DIFS = arg('dif', MODO === 'fps' ? '1' : '0,1,2').split(',').map(Number);
const NPS = arg('np', MODO === 'fps' ? '1' : '1,2').split(',').map(Number);
const REP = +arg('rep', 1), SAIDA = arg('saida', 'bench-campanha-' + MODO + '.json');
const ROBO = Object.fromEntries(Object.entries(ROBO_PADRAO).map(([k, v]) => [k, +arg(k, v)])); // --mira, --cabeca, --kite, --kiteV, --coleira, --reanimar, --perdido, --caca, --semente
const INICIO = arg('inicio', null) == null ? null : +arg('inicio'); // modo balanço: começa a etapa nesta rodada (ex.: --etapas V --inicio 25 = só o Diretor)
const INF = arg('inf', null), ATE = arg('ate', null) == null ? null : +arg('ate'); // --inf vila|sanatorio --inicio R --ate R2 [--etapas IV]: o infinito nas rodadas R..R2 com o kit da etapa (chefes de campo 20/30/40)
const REF = +arg('ref', 0); // 1: cada ato também no clássico (mesmo mapa, mesmas rodadas, mesmo kit), como referência
const TETO = +arg('teto', 3600), RODMAX = +arg('rodadaMax', 900);
const GPUHP = +arg('gpuDedicada', 0); // modo fps: 1 = força a placa dedicada (notebook híbrido; sem isso o Chromium usa a integrada: ver balanceamento.md §6)
const VSYNC = +arg('vsync', 0); // modo fps: 1 = com vsync (como o jogador); 0 = sem teto (padrão dos benches; nas arenas leves dá travadas de fila da GPU, ver balanceamento.md §6)
const GFX = arg('gfx', 'medio'), SEG = +arg('seg', 8), RODADA = arg('rodada', null), LENTO = +arg('lento', 50);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.png': 'image/png', '.jpg': 'image/jpeg', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
const RAIZES = [path.dirname(PAGINA), RAIZ];
const srv = http.createServer((req, res) => {
  let rel; try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, ''); } catch { res.writeHead(400); return res.end(); }
  if (!rel) rel = path.basename(PAGINA);
  for (const r of RAIZES) { const f = path.resolve(r, rel); if (f.startsWith(r) && fs.existsSync(f) && fs.statSync(f).isFile()) { res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); return fs.createReadStream(f).pipe(res); } }
  res.writeHead(404); res.end();
});

// ---------- página ----------
async function abrir(br, gpu) {
  const pg = await br.newPage({ viewport: gpu ? { width: 1280, height: 720 } : { width: 960, height: 540 } });
  const erros = []; pg.on('pageerror', e => erros.push(String(e.stack || e).slice(0, 300)));
  await pg.route(u => !/^http:\/\/(localhost|127\.0\.0\.1)/.test(String(u)), r => r.abort()); // sem rede externa (Firebase, fontes, PeerJS)
  await pg.goto(`http://127.0.0.1:${srv.address().port}/${path.basename(PAGINA)}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await pg.waitForFunction(() => window.__T && window.__T.MAPS && window.__T.CAMP_ATOS && window.__T.campLibera && window.__T.CAMP_CH, null, { timeout: 240000 });
  return { pg, erros };
}
// ---------- modo balanço ----------
async function balanco(br) {
  const out = { pagina: path.relative(RAIZ, PAGINA) || PAGINA, modo: 'balanco', quando: new Date().toISOString(), robo: ROBO, medidas: [] };
  const lista = []; for (const etapa of ETAPAS) { if (!INF) lista.push([etapa, false]); if (REF && !/^C/.test(etapa)) lista.push([etapa, 'classico']); if (INF) lista.push([etapa, 'infinito']); }
  for (let rep = 0; rep < REP; rep++) for (const dif of DIFS) for (const np of NPS) for (const [etapa, ref] of lista) {
    const { pg, erros } = await abrir(br, false); const t0 = Date.now();
    try {
      const carga = await comecar(pg, { etapa, dif, np, ref, robo: ROBO, rodadaMax: RODMAX, rodada: INICIO, mapa: INF || null, ate: ATE });
      const { st, res } = await jogar(pg, { teto: TETO, semente: ROBO.semente + rep * 7919 + dif * 31 + np });
      const soma = k => res.rodadas.reduce((s, r) => s + (Array.isArray(r[k]) ? r[k].reduce((a, b) => a + b, 0) : r[k] || 0), 0);
      const M = { etapa, ref: ref || undefined, mapa: INF || undefined, dif, np, rep, cargaMs: carga, fim: st.fim, over: st.over, teto: st.teto, ...res, combateS: +soma('durS').toFixed(1), dano: soma('dano'), quedas: soma('quedas'), tiros: soma('tiros'), abates: soma('abates'), realS: Math.round((Date.now() - t0) / 1000) };
      if (erros.length) M.erros = erros.slice(0, 5);
      out.medidas.push(M);
      console.log(`${etapa}${ref ? ` (${ref}${INF ? ' ' + INF + ' r' + INICIO + '-' + ATE : ''})` : ''} dif ${dif} np ${np}: ${M.rodadas.length} rodadas, combate ${M.combateS} s, total ${M.tempoS} s, chefe ${M.chefe?.durS ?? '-'} s, dano ${M.dano}, quedas ${M.quedas}, time ${M.quedasTime}, tiros ${M.tiros}, abates ${M.abates}, pts ${M.pts.join('/')}${M.travadas ? ', TRAVADAS ' + M.travadas : ''}${st.teto ? ', TETO' : ''}${erros.length ? ', erros ' + erros.length : ''} (${M.realS} s reais)`);
    } catch (e) { out.medidas.push({ etapa, dif, np, rep, falha: String(e).slice(0, 300), erros }); console.log(etapa, dif, np, 'FALHOU', String(e).slice(0, 200)); }
    await pg.close();
    fs.writeFileSync(SAIDA, JSON.stringify(out, null, 1));
  }
  return out;
}

// ---------- modo fps ----------
const RODADA_PADRAO = { I: 4, II: 9, C1: 10, III: 15, IV: 19, C2: 20, V: 24 };
async function fps(br) {
  const out = { pagina: path.relative(RAIZ, PAGINA) || PAGINA, modo: 'fps', gfx: GFX, seg: SEG, quando: new Date().toISOString(), robo: ROBO, medidas: [] };
  for (let rep = 0; rep < REP; rep++) for (const dif of DIFS) for (const np of NPS) for (const etapa of ETAPAS) {
    const { pg, erros } = await abrir(br, true);
    try {
      const carga = await comecar(pg, { etapa, dif, np, gpu: true, gfx: GFX, robo: ROBO, rodadaMax: RODMAX }), rod = +(RODADA ?? RODADA_PADRAO[etapa]);
      await pg.evaluate(rod => { // pula para a rodada pedida (rodada de chefe: a própria) e solta o relógio; o robô joga a cada quadro
        const T = window.__T, B = window.__D15; if (T.Z.phase === 'pre' && rod > T.Z.round + 1) T.Z.round = rod - 1;
        T.sim(Math.max(0, T.Z.phaseEnd - window.__simNow) + .2); if (T.CAMP.c) T.CAMP.c.cena = null;
        window.__simLock = false; let last = performance.now() / 1000;
        // loop real: este rAF roda depois do quadro do jogo (registrado depois); o robô usa o relógio da página para a cadência
        const g = () => { const now = performance.now() / 1000, dt = Math.min(.1, now - last); last = now; B.depois(dt, now); B.passo(dt, now); B.antes(); requestAnimationFrame(g); };
        B.antes(); requestAnimationFrame(g);
      }, rod);
      await pg.waitForTimeout(5000); // os zumbis da rodada nascem e chegam (o chefe sobe)
      const m = await pg.evaluate(async ({ SEG, LENTO }) => {
        const T = window.__T, R = T.renderer, dts = [], calls = [], tris = [], zs = [], lac = [], lentos = []; const prog0 = R.info.programs?.length ?? 0; R.info.autoReset = false; R.info.reset();
        const estado = () => { const CH = T.CAMP_CH; return { z: T.Z.zs.size, lac: T.campChefeLacVivos(), f: CH?.fase ?? null, atk: CH?.atk?.a?.id ?? CH?.atk?.id ?? null, prog: R.info.programs?.length ?? 0, geo: R.info.memory.geometries, tex: R.info.memory.textures }; };
        let ant = estado();
        await new Promise(ok => { let last = performance.now(), t0 = last; const f = () => { const t = performance.now(), dt = t - last; dts.push(dt); last = t; calls.push(R.info.render.calls); tris.push(R.info.render.triangles); R.info.reset();
          const e = estado(); if (e.prog > ant.prog && R.info.programs) (window.__novos ||= []).push(...R.info.programs.slice(ant.prog).map(p => `${((t - t0) / 1000).toFixed(2)} s, ataque ${e.atk}: ${String(p.cacheKey || p.name || '').replace(/\s+/g, ' ').slice(0, 300)}`)); zs.push(e.z); /* O3-D16: chave de cada programa novo (compilação na luta) */ lac.push(e.lac); if (dt > LENTO && lentos.length < 40) { const dif = {}; for (const k in e) if (e[k] !== ant[k]) dif[k] = [ant[k], e[k]]; lentos.push({ t: +((t - t0) / 1000).toFixed(2), ms: +dt.toFixed(1), ...dif }); } ant = e;
          if (t - t0 < SEG * 1000) requestAnimationFrame(f); else ok(); }; requestAnimationFrame(f); });
        R.info.autoReset = true; dts.shift(); calls.shift(); tris.shift(); const s = [...dts].sort((a, b) => a - b), q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))];
        const media = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length), tot = dts.reduce((a, b) => a + b, 0), pior1 = s.slice(Math.floor(s.length * .99));
        return { fpsMedio: +(1000 * dts.length / tot).toFixed(1), fps1low: +(1000 / media(pior1)).toFixed(1), msMediana: +q(.5).toFixed(2), msP90: +q(.9).toFixed(2), msP99: +q(.99).toFixed(2), msMax: +s[s.length - 1].toFixed(1),
          drawCalls: Math.round(media(calls)), drawMax: Math.max(...calls), triangulos: Math.round(media(tris)), zumbis: +media(zs).toFixed(1), zumbisMax: Math.max(...zs), lacaiosMax: Math.max(...lac), programas: [prog0, R.info.programs?.length ?? 0], programasNovos: window.__novos || [], lentos,
          memJsMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null };
      }, { SEG, LENTO });
      const M = { etapa, dif, np, rep, rodada: rod, cargaMs: carga, ...m }; if (erros.length) M.erros = erros.slice(0, 5); out.medidas.push(M);
      console.log(`${etapa} r${rod} ${GFX}: ${m.fpsMedio} fps (1% ${m.fps1low}) ${m.msMediana}/${m.msP90}/${m.msP99} ms (máx ${m.msMax}), ${m.drawCalls} draws (máx ${m.drawMax}), ${m.zumbis} zumbis (máx ${m.zumbisMax}), lacaios máx ${m.lacaiosMax}, programas ${m.programas}, carga ${carga} ms, ${m.lentos.length} quadros > ${LENTO} ms${erros.length ? ', erros ' + erros.length : ''}`);
    } catch (e) { out.medidas.push({ etapa, dif, np, rep, falha: String(e).slice(0, 300), erros }); console.log(etapa, 'FALHOU', String(e).slice(0, 200)); }
    await pg.close();
    fs.writeFileSync(SAIDA, JSON.stringify(out, null, 1));
  }
  return out;
}

// ---------- modo curva: a curva que as tabelas dão (sem jogar), por rodada, dificuldade e jogadores ----------
async function curva(br) {
  const { pg } = await abrir(br, false);
  const t = await pg.evaluate(({ DIFS, NPS }) => {
    const T = window.__T, A = T.CAMP_ATOS, W = T.W, linhas = [];
    const dpsKit = id => { const K = T.CAMP_KIT[id] || {}; let m = 0; for (const w of [].concat(K.armas || [])) { const x = W[w]; if (x?.rate) m = Math.max(m, (x.dmg || 0) * (x.pellets || 1) / x.rate); } return Math.round(m); };
    for (const dif of DIFS) for (const np of NPS) {
      const D = T.ZDIFF[dif]; T.S.st = { ...(T.S.st || {}), zdiff: dif };
      for (const a of A) {
        const C = T.CAMP_CURVA[a.id] || {}, chs = Object.entries(T.CAMP_CHEFE);
        for (let r = a.rod0; r <= a.rodMin; r++) {
          const G = T.GAL7_RODADAS && a.mapa === 'galeria7' && r === T.GAL7_RODADAS.chefe ? T.GAL7_RODADAS : null, fx = C.fixos ?? G?.fixos; // rodada do Diretor: os fixos da arena (O3-D13)
          const vida = Math.round(T.zHp(r) * T.zHpK(r) * (C.vidaK || 1)), n = fx ? Math.max(1, Math.round(fx * D.cnt)) : Math.max(1, Math.round(T.zCount(r, np) * D.cnt * (C.qtdK || 1)));
          const cl = { vida: Math.round(T.zHp(r) * T.zHpK(r)), n: Math.max(1, Math.round(T.zCount(r, np) * D.cnt)) };
          const L = { dif, np, etapa: a.id, rodada: r, vida, n, carga: vida * n, cargaClassico: cl.vida * cl.n, dpsKit: dpsKit(a.id), esforcoS: Math.round(vida * n / Math.max(1, dpsKit(a.id))) };
          const ch = chs.find(([, c]) => c.rodada === r && (a.chefe || r === a.rodMin));
          if (ch) { const c = ch[1], B = T.CAMP_CHEFE_BASE; L.chefe = { k: +ch[0], nome: c.nome, vida: Math.round(T.zHp(c.rodada) * T.zHpK(c.rodada) * (c.base + c.porJog * np) * (B.hpChefe ?? 1)) }; L.chefe.esforcoS = Math.round(L.chefe.vida / Math.max(1, L.dpsKit)); }
          linhas.push(L);
        }
      }
    }
    return linhas;
  }, { DIFS, NPS });
  await pg.close();
  for (const L of t) console.log([L.dif, L.np, L.etapa, 'r' + L.rodada, 'vida ' + L.vida, 'n ' + L.n, 'carga ' + L.carga, '(clássico ' + L.cargaClassico + ')', 'dps ' + L.dpsKit, 'esforço ' + L.esforcoS + ' s', L.chefe ? L.chefe.nome + ' ' + L.chefe.vida + ' (' + L.chefe.esforcoS + ' s)' : ''].join(' '));
  return { pagina: path.relative(RAIZ, PAGINA) || PAGINA, modo: 'curva', linhas: t };
}

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const gpu = MODO === 'fps';
  const br = await chromium.launch({ args: gpu ? ['--use-angle=d3d11', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', ...(VSYNC ? [] : ['--disable-gpu-vsync', '--disable-frame-rate-limit']), ...(GPUHP ? ['--force_high_performance_gpu'] : []), '--autoplay-policy=no-user-gesture-required', '--enable-precise-memory-info']
    : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const out = gpu ? await fps(br) : MODO === 'curva' ? await curva(br) : await balanco(br);
  fs.writeFileSync(SAIDA, JSON.stringify(out, null, 1)); console.log('gravado em', SAIDA);
  await br.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
