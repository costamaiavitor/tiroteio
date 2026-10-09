// O2-E01 (+ O2-C08: caminho de portas sem os atalhos, RAIZ por variável; O2-E02: interruptor da ala antes da armadilha, preço por armadilha, seção zint2): conferência de gameplay das redistribuições (C02 Vila, C03 Sanatório).
// Anda de verdade (teclas W/Espaço no laço do jogo, colisão real) do nascimento até cada item, abrindo as portas com F,
// e compra com F (zUse -> srvZUse). Uso: node conferencia.mjs <mapa> [saida.json] [--so perk,pap,wall,box]
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire('C:/dev/tiroteio/package.json');
const { chromium } = require('playwright');
const RAIZ = process.env.RAIZ || 'C:/dev/tiroteio'; // O2-C08: RAIZ=<cópia do repositório>
const MAPA = process.argv[2] || 'sanatorio', SAIDA = process.argv[3] || null;
const SO = (process.argv.includes('--so') ? process.argv[process.argv.indexOf('--so') + 1] : 'power,perk,pap,wall,box,trap,zint,zint2').split(','); // O2-E02: trap e zint2 (outros interativos e atalhos) no padrão // O2-C10: zint = interativos do C10 (munição, Wunderfizz, baú, sino)
const SEMGPU = process.argv.includes('--sem-gpu');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.png': 'image/png', '.jpg': 'image/jpeg', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
const srv = http.createServer((req, res) => {
  let rel; try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, ''); } catch { res.writeHead(400); return res.end(); }
  if (!rel) rel = 'index.html';
  const f = path.resolve(RAIZ, rel); if (f.startsWith(path.resolve(RAIZ)) && fs.existsSync(f) && fs.statSync(f).isFile()) { res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); return fs.createReadStream(f).pipe(res); }
  res.writeHead(404); res.end();
});

// ---------------- dentro da página ----------------
function instalar() {
  const T = window.__T, E = window.__E = {};
  const h = () => T.S.players.get('h');
  E.h = h;
  // mantém o teste limpo: sem zumbis, sem dano, pontos de sobra
  E.calmo = () => { T.Z.zs.clear(); T.Z.toSpawn = 0; if (T.Z.phase === 'break') T.Z.phaseEnd = 1e12; const p = h(); p.dwEnd = 1e12; p.hp = Math.max(p.hp, 100); if (p.money < 1e6) { p.money = 1e7; } T.me.money = p.money; };
  E.passo = (dt = 1 / 30) => { E.calmo(); T.sim(dt, 1 / 60); };
  // grade do jogador (0,5 m). modo 'pe': só passa por cima do que o degrau sobe; 'pulo': o que não é zHigh (dá para pular)
  const S = .5, H = 1.7;
  E.grade = (modo, abertas = new Set()) => {
    const COL = T.COL(), FF = T.FF, nx = Math.round(FF.nx / S), nz = Math.round(FF.nz / S), g = new Uint8Array(nx * nz).fill(1), r = T.PR + .08;
    const fora = new Set(); for (const id of abertas) { const o = T.ZC.world.doors.get(id); if (o?.col) fora.add(o.col); }
    for (const b of COL) {
      if (fora.has(b)) continue;
      if (b.maxY <= .05 || b.minY >= H) continue;
      if (modo === 'pe' ? !(b.maxY > T.STEP || T.zHigh(b)) : !T.zHigh(b)) continue;
      const i0 = Math.max(0, Math.floor((b.minX - r - FF.x0) / S - .5) + 1), i1 = Math.min(nx - 1, Math.ceil((b.maxX + r - FF.x0) / S - .5) - 1);
      const j0 = Math.max(0, Math.floor((b.minZ - r - FF.z0) / S - .5) + 1), j1 = Math.min(nz - 1, Math.ceil((b.maxZ + r - FF.z0) / S - .5) - 1);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) g[i * nz + j] = 0;
    }
    return { g, nx, nz, x0: FF.x0, z0: FF.z0 };
  };
  const cel = (G, x, z) => { const i = Math.floor((x - G.x0) / S), j = Math.floor((z - G.z0) / S); return i < 0 || j < 0 || i >= G.nx || j >= G.nz ? -1 : i * G.nz + j; };
  const ctr = (G, c) => { const i = (c / G.nz) | 0, j = c % G.nz; return [G.x0 + (i + .5) * S, G.z0 + (j + .5) * S]; };
  const livreProx = (G, c, k = 3) => { if (c >= 0 && G.g[c]) return c; const nz = G.nz, i0 = (c / nz) | 0, j0 = c % nz; for (let kk = 1; kk <= k; kk++) for (let di = -kk; di <= kk; di++) for (let dj = -kk; dj <= kk; dj++) { const i = i0 + di, j = j0 + dj; if (i >= 0 && j >= 0 && i < G.nx && j < nz && G.g[i * nz + j]) return i * nz + j; } return -1; };
  // caminho (Dijkstra com baldes, reto 5, diagonal 7, sem cortar quina)
  E.caminho = (G, ax, az, bx, bz) => {
    const a = livreProx(G, cel(G, ax, az)), b = livreProx(G, cel(G, bx, bz), 2); if (a < 0 || b < 0) return null;
    const { g, nx, nz } = G, D = new Int32Array(nx * nz).fill(2e9), P = new Int32Array(nx * nz).fill(-1), B = [];
    D[a] = 0; B[0] = [a];
    for (let d = 0; d < B.length; d++) { const q = B[d]; if (!q) continue; for (const c of q) { if (D[c] !== d) continue; if (c === b) { d = B.length; break; } const i = (c / nz) | 0, j = c - i * nz;
      const wl = i > 0 && g[c - nz], wr = i < nx - 1 && g[c + nz], wd = j > 0 && g[c - 1], wu = j < nz - 1 && g[c + 1];
      const t = (n, nd) => { if (nd < D[n]) { D[n] = nd; P[n] = c; (B[nd] ||= []).push(n); } };
      if (wl) t(c - nz, d + 5); if (wr) t(c + nz, d + 5); if (wd) t(c - 1, d + 5); if (wu) t(c + 1, d + 5);
      if (wl && wd && g[c - nz - 1]) t(c - nz - 1, d + 7); if (wl && wu && g[c - nz + 1]) t(c - nz + 1, d + 7); if (wr && wd && g[c + nz - 1]) t(c + nz - 1, d + 7); if (wr && wu && g[c + nz + 1]) t(c + nz + 1, d + 7);
    } B[d] = null; }
    if (D[b] >= 2e9) return null;
    const cs = []; for (let c = b; c >= 0; c = P[c]) cs.push(c); cs.reverse();
    // encurta: pula para o ponto mais longe em linha reta livre na grade
    const reto = (c1, c2) => { const [x1, z1] = ctr(G, c1), [x2, z2] = ctr(G, c2), n = Math.ceil(Math.hypot(x2 - x1, z2 - z1) / (S / 3)); for (let k = 1; k < n; k++) { const x = x1 + (x2 - x1) * k / n, z = z1 + (z2 - z1) * k / n; const c = cel(G, x, z); if (c < 0 || !g[c]) return false; for (const [ox, oz] of [[.2, .2], [-.2, .2], [.2, -.2], [-.2, -.2]]) { const cc = cel(G, x + ox, z + oz); if (cc < 0 || !g[cc]) return false; } } return true; };
    const out = []; let i = 0; while (i < cs.length - 1) { let j = Math.min(cs.length - 1, i + 60); while (j > i + 1 && !reto(cs[i], cs[j])) j--; out.push(ctr(G, cs[j])); i = j; }
    return { pts: out, m: D[b] / 5 * S };
  };
  // anda pelos pontos com as teclas do jogo (W e, se travar, Espaço). Devolve {ok, t, travou}
  E.andar = (pts, alvo, tol = .45, teto = 240) => {
    const me = T.me, K = T.keys; let t = 0, k = 0, parado = 0, ultimo = [me.pos.x, me.pos.z], pulos = 0;
    const fim = () => { K.KeyW = false; K.Space = false; K.ShiftLeft = false; };
    while (t < teto) {
      if (k >= pts.length) break;
      const [x, z] = pts[k], dx = x - me.pos.x, dz = z - me.pos.z, d = Math.hypot(dx, dz);
      if (d < (k === pts.length - 1 ? tol : .6)) { k++; continue; }
      me.yaw = Math.atan2(-dx, -dz); K.KeyW = true; K.Space = false;
      E.passo(1 / 30); t += 1 / 30;
      const mv = Math.hypot(me.pos.x - ultimo[0], me.pos.z - ultimo[1]); ultimo = [me.pos.x, me.pos.z];
      if (mv < .02) parado += 1 / 30; else parado = 0;
      if (parado > .25) { K.Space = true; E.passo(1 / 30); K.Space = false; t += 1 / 30; pulos++; parado = 0; if (pulos > 60) break; }
      if (!me.alive || me.downed) break;
    }
    fim(); E.passo(1 / 15);
    const [ax, az] = alvo; return { ok: k >= pts.length, t: Math.round(t * 10) / 10, pulos, longe: Math.round(Math.hypot(me.pos.x - ax, me.pos.z - az) * 100) / 100, pos: [Math.round(me.pos.x * 10) / 10, Math.round(me.pos.z * 10) / 10] };
  };
  // vai até (x,z): tenta a pé; se não der, com pulos
  E.ir = (x, z, abertas) => {
    const me = T.me; let G = E.grade('pe', abertas ?? T.ZC.doors), c = E.caminho(G, me.pos.x, me.pos.z, x, z), modo = 'pe';
    if (!c) { G = E.grade('pulo', abertas ?? T.ZC.doors); c = E.caminho(G, me.pos.x, me.pos.z, x, z); modo = 'pulo'; }
    if (!c) return { ok: false, motivo: 'sem caminho na grade', pos: [me.pos.x, me.pos.z] };
    const r = E.andar(c.pts, [x, z]); r.modo = modo; r.m = Math.round(c.m); return r;
  };
  // portas até cada área (grafo de M.z.doors, como a auditoria)
  E.portasAte = () => { const ZD = T.ZD, start = ZD.start || 'A', custo = { [start]: 0 }, ate = { [start]: [] }; let mud = true; while (mud) { mud = false; for (const d of ZD.doors) if (!d.atalho) for (const [a, b] of [[d.rooms[0], d.rooms[1]], [d.rooms[1], d.rooms[0]]]) if (custo[a] != null && (custo[b] == null || custo[a] + d.cost < custo[b])) { custo[b] = custo[a] + d.cost; ate[b] = [...ate[a], d.id]; mud = true; } } return { custo, ate }; };
  E.zona = (x, z) => T.ZD.zoneAt ? T.ZD.zoneAt(x, z) : T.zRoomAt(x, z);
  // prompt atual (zInteract roda no tick)
  E.act = () => { const a = T.ZC.act; return a ? { k: a.k, id: a.id, txt: a.txt, ok: a.ok, cost: a.cost, hold: a.hold } : null; }; // O2-E02: hold (barricada)
  // chega perto do ponto de uso até o F escolher o item certo
  E.mirar = (alvo, cond) => {
    const me = T.me; E.passo(1 / 30); if (cond(E.act())) return { ok: true, passos: 0 };
    for (let k = 0; k < 40; k++) { const dx = alvo[0] - me.pos.x, dz = alvo[1] - me.pos.z; if (Math.hypot(dx, dz) < .3) break; me.yaw = Math.atan2(-dx, -dz); T.keys.KeyW = true; E.passo(1 / 30); T.keys.KeyW = false; E.passo(1 / 60); if (cond(E.act())) return { ok: true, passos: k + 1 }; }
    T.keys.KeyW = false; return { ok: false, act: E.act() };
  };
  E.F = () => { const m0 = h().money; T.zUse(); E.passo(.2); return m0 - h().money; };
  E.abrirPorta = id => {
    const d = T.ZD.doors.find(q => q.id === id); if (T.ZC.doors.has(id)) return { ok: true, ja: true };
    const n = d.rot != null ? [Math.sin(d.rot), Math.cos(d.rot)] : d.axis === 'z' ? [1, 0] : [0, 1];
    // lado de cá: o ponto (±1,4 m) com caminho
    let melhor = null; const me = T.me;
    for (const s of [1, -1]) for (const dd of [1.3, 1.8, .9]) { const x = d.x + n[0] * s * dd, z = d.z + n[1] * s * dd; const G = E.grade('pulo'), c = E.caminho(G, me.pos.x, me.pos.z, x, z); if (c && (!melhor || c.m < melhor.m)) melhor = { x, z, m: c.m }; }
    if (!melhor) return { ok: false, motivo: 'porta sem lado alcançável', id };
    const w = E.ir(melhor.x, melhor.z);
    const mi = E.mirar([d.x, d.z], a => a?.k === 'door' && a.id === id);
    if (!mi.ok) return { ok: false, motivo: 'prompt da porta não aparece', act: mi.act, w, id };
    const txt = E.act().txt, pago = E.F();
    return { ok: T.ZC.doors.has(id) && pago === d.cost, txt, pago, preco: d.cost, w, id };
  };
  E.abrirAte = zona => { const { ate } = E.portasAte(), L = ate[zona]; if (!L) return { ok: false, motivo: 'zona sem caminho de portas: ' + zona }; const r = []; for (const id of L) { const o = E.abrirPorta(id); r.push(o); if (!o.ok) return { ok: false, portas: r }; } return { ok: true, cadeia: L, portas: r.filter(o => !o.ja).map(o => o.id), detalhes: r.filter(o => !o.ja) }; };
  E.inicio = () => { const p = h(); E.spawn = [T.me.pos.x, T.me.pos.z]; return { spawn: E.spawn, start: T.ZD.start, portas: T.ZD.doors.length }; };
  E.volta = () => { const p = h(); T.me.pos.set(E.spawn[0], T.me.pos.y, E.spawn[1]); T.me.vel.set(0, 0, 0); p.pos = [T.me.pos.x, T.me.pos.y, T.me.pos.z]; p.pb = null; p.ph = []; p.anom = null; E.passo(.2); };
  // O2-E02: liga a energia andando até a alavanca (se ainda não estiver ligada)
  E.ligarEnergia = () => {
    if (T.Z.power) return null; const P = T.ZD.power, x = P.x + P.n[0], z = P.z + P.n[1], portas = E.abrirAte(E.zona(x, z));
    if (!portas.ok) return { item: 'energia', ok: false, portas };
    const w = E.ir(x, z), mi = E.mirar([P.x, P.z], a => a?.k === 'power'); T.zUse(); E.passo(.3); E.volta();
    return { item: 'energia', andou: w, ok: mi.ok && !!T.Z.power && !!T.ZC.power };
  };
  // O2-E02: interruptor (por id do interruptor ou pela ala): anda até ele e liga com F, conferindo preço e estado no host e no cliente
  E.ligarInterruptor = (pred, nome) => {
    const L = T.ZD.zint, i = L.findIndex(o => o.t === 'interruptor' && pred(o)); if (i < 0) return { item: 'interruptor ' + nome, ok: false, motivo: 'interruptor não existe' };
    const o = L[i], D = T.ZINT.interruptor, custo = o.custo ?? D.custo; if (T.Z.zint[i].st === 'ligado') return null;
    if (o.energia) { const r = E.ligarEnergia(); if (r && !r.ok) return { item: 'interruptor ' + o.id, ok: false, energia: r }; }
    const x = o.x + o.n[0] * 1.2, z = o.z + o.n[1] * 1.2, zona = E.zona(x, z), portas = E.abrirAte(zona);
    if (!portas.ok) return { item: 'interruptor ' + o.id, ok: false, portas };
    const w = E.ir(x, z), mi = E.mirar([o.x, o.z], a => a?.k === 'zint' && a.id === i), act = E.act(), pago = mi.ok && act.ok !== false ? E.F() : 0;
    const res = { item: 'interruptor ' + o.id, zona, portas: portas.portas, andou: w, prompt: act?.txt, precoDado: custo, pago, estado: T.Z.zint[i].st, cli: T.ZC.zint[i].st,
      ok: mi.ok && pago === custo && T.Z.zint[i].st === 'ligado' && T.ZC.zint[i].st === 'ligado' && (!o.ala || T.zintAla(o.ala) && T.zintAlaCli(o.ala)), mirou: mi.ok ? true : mi.act };
    E.volta(); return res;
  };
  E.ligarAla = ala => E.ligarInterruptor(o => o.ala === ala, 'ala ' + ala);
}

async function main() {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port;
  const args = SEMGPU ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-angle=d3d11', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'];
  const br = await chromium.launch({ args: [...args, '--autoplay-policy=no-user-gesture-required'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } });
  const erros = []; pg.on('pageerror', e => erros.push(String(e.stack || e).slice(0, 300)));
  pg.on('console', m => { if (m.type() === 'warning' && /O2-C0/.test(m.text())) erros.push('console: ' + m.text()); });
  await pg.route(u => !/^http:\/\/(localhost|127\.0\.0\.1)/.test(String(u)), r => r.abort());
  await pg.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await pg.waitForFunction(() => window.__T && window.__T.MAPS, null, { timeout: 240000 });
  await pg.evaluate(mapa => { const T = window.__T; T.CFG.gfx = 'baixo'; try { T.applyQuality(); } catch { } T.startHost({ map: mapa, zmap: mapa, mode: 'zombies', rounds: 8, frags: 20, bots: 0, diff: 1, zdiff: 1 }); }, MAPA);
  await pg.waitForFunction(() => !document.getElementById('warmMsg') && window.__T.ZC.world && window.__T.S.players.get('h')?.alive, null, { timeout: 600000, polling: 250 });
  await pg.evaluate(() => { window.__T.sim(.1); });
  await pg.evaluate(instalar);
  const out = { mapa: MAPA, quando: new Date().toISOString(), inicio: await pg.evaluate(() => window.__E.inicio()), itens: [], erros };
  const ev = (fn, a) => pg.evaluate(([s, a]) => (new Function('T', 'E', 'arg', `return (${s})(T, E, arg)`))(window.__T, window.__E, a), [fn.toString(), a]);
  const log = o => { out.itens.push(o); console.log(JSON.stringify(o)); };

  // inventário
  const inv = await ev((T, E) => {
    const ZD = T.ZD, W = T.W, n = e => e.n;
    return { perks: ZD.perks.map(p => ({ k: p.k, x: p.x, z: p.z, n: n(p), nome: T.ZPERKS[p.k]?.name, preco: T.ZPERKS[p.k]?.cost })),
      pap: { x: ZD.pap.x, z: ZD.pap.z, n: ZD.pap.n }, power: { x: ZD.power.x, z: ZD.power.z, n: ZD.power.n },
      wall: ZD.wall.map((w, i) => ({ i, w: w.w, nome: W[w.w]?.name || w.w, cost: w.cost, x: w.x, z: w.z, n: w.n, post: !!w.post })),
      boxes: ZD.boxes.map((b, i) => ({ i, x: b.x, z: b.z, n: b.n })), boxLoc: T.ZC.box.loc, maxPerks: T.ZMAXPERKS };
  });
  out.inventario = inv;

  // 0) estático: só com a cadeia de portas do item aberta (antes de abrir qualquer porta)
  out.estatico = await ev((T, E, inv) => {
    const { ate, custo } = E.portasAte(), res = [], sp = E.spawn;
    const pts = [['energia', inv.power, 1], ['pap', inv.pap, 1.2], ...inv.perks.map(p => ['bebida ' + p.k, p, 1.1]), ...inv.wall.map(w => ['parede ' + w.i + ' ' + w.w, w, w.post ? .82 : .8]), ...inv.boxes.map(b => ['caixa ' + b.i, b, 1.3])];
    for (const [id, o, d] of pts) { const x = o.x + o.n[0] * d, z = o.z + o.n[1] * d, zona = E.zona(x, z), cad = ate[zona] || null;
      const G = E.grade('pulo', new Set(cad || [])), c = cad ? E.caminho(G, sp[0], sp[1], x, z) : null;
      res.push({ id, zona, custo: custo[zona] ?? null, cadeia: cad, alcanca: !!c, m: c ? Math.round(c.m) : null }); }
    return res;
  }, inv);
  for (const e of out.estatico) if (!e.alcanca) console.log('ESTATICO sem caminho:', JSON.stringify(e));
  console.log('estático: ' + out.estatico.filter(e => e.alcanca).length + '/' + out.estatico.length + ' alcançáveis só com a própria cadeia de portas');
  // 1) energia
  if (SO.includes('power') || SO.includes('perk') || SO.includes('pap')) {
    const r = await ev((T, E, P) => {
      const x = P.x + P.n[0] * 1, z = P.z + P.n[1] * 1, zona = E.zona(x, z), portas = E.abrirAte(zona);
      if (!portas.ok) return { item: 'energia', ok: false, portas };
      const w = E.ir(x, z); const mi = E.mirar([P.x, P.z], a => a?.k === 'power'); const txt = E.act()?.txt; T.zUse(); E.passo(.3);
      return { item: 'energia', zona, portas: portas.portas, andou: w, prompt: txt, ok: !!T.ZC.power && !!T.Z.power, mirou: mi.ok };
    }, inv.power);
    log(r);
    await ev((T, E) => E.volta());
  }
  // 2) bebidas
  if (SO.includes('perk')) for (const pk of inv.perks) {
    const r = await ev((T, E, pk) => {
      const h = E.h(); h.perks = []; T.ZC.perks.length = 0;
      const x = pk.x + pk.n[0] * 1.1, z = pk.z + pk.n[1] * 1.1, zona = E.zona(x, z), portas = E.abrirAte(zona);
      if (!portas.ok) return { item: 'bebida ' + pk.k, ok: false, portas };
      const w = E.ir(x, z);
      const mi = E.mirar([pk.x, pk.z], a => a?.k === 'perk' && a.id === pk.k);
      const act = E.act(); const pago = mi.ok ? E.F() : 0; E.passo(.5);
      const tem = h.perks.includes(pk.k) && T.ZC.perks.includes(pk.k);
      const res = { item: 'bebida ' + pk.k, nome: pk.nome, zona, portas: portas.portas, andou: w, prompt: act?.txt, precoDado: pk.preco, pago, ok: mi.ok && tem && pago === (pk.k === 'qr' ? 500 : pk.preco), mirou: mi.ok ? true : mi.act };
      h.perks = []; T.ZC.perks.length = 0; E.volta(); return res;
    }, pk);
    log(r);
  }
  // 3) Pack-a-Punch (com a pistola inicial)
  if (SO.includes('pap')) {
    const r = await ev((T, E, P) => {
      const h = E.h(), x = P.x + P.n[0] * 1.2, z = P.z + P.n[1] * 1.2, zona = E.zona(x, z), portas = E.abrirAte(zona);
      if (!portas.ok) return { item: 'pap', ok: false, portas };
      const w = E.ir(x, z);
      const cur = T.G.cur; const mi = E.mirar([P.x, P.z], a => a?.k === 'pap');
      const act = E.act(); const pago = mi.ok && act.ok !== false ? E.F() : 0;
      const st1 = T.Z.pap.st; E.passo(4.2); const st2 = T.Z.pap.st;
      const mi2 = E.mirar([P.x, P.z], a => a?.k === 'paptake'); const act2 = E.act(); if (mi2.ok) E.F(); E.passo(.5);
      const res = { item: 'pap', zona, portas: portas.portas, andou: w, arma: cur, prompt: act?.txt, prompt2: act2?.txt, pago, estados: [st1, st2, T.Z.pap.st], temPap: !!T.W[cur + '_pap'] && [h.inv.primary, h.inv.secondary, h.inv.third].includes(cur + '_pap'), ok: false };
      res.ok = mi.ok && pago === 5000 && st1 === 'work' && st2 === 'ready' && res.temPap; E.volta(); return res;
    }, inv.pap);
    log(r);
  }
  // 4) armas de parede
  if (SO.includes('wall')) for (const wb of inv.wall) {
    const r = await ev((T, E, wb) => {
      const h = E.h(), d = wb.post ? .23 + T.PR + .35 : T.PR + .45, x = wb.x + wb.n[0] * d, z = wb.z + wb.n[1] * d, zona = E.zona(x, z), portas = E.abrirAte(zona);
      if (!portas.ok) return { item: 'parede ' + wb.i, w: wb.w, ok: false, portas };
      // estado limpo: sem letais, sem Bowie, armas iniciais
      h.inv.he = 0; h.inv.semtex = 0; h.inv.clay = 0; T.G.inv.he = 0; T.G.inv.semtex = 0; T.G.inv.clay = 0; h.bowie = false; T.ZC.bowie = false;
      const w = E.ir(x, z);
      const mi = E.mirar([wb.x, wb.z], a => a?.k === 'wall' && a.id === wb.i);
      const act = E.act(); const pago = mi.ok && act.ok !== false ? E.F() : 0; E.passo(.3);
      let recebeu;
      if (wb.w === 'he' || wb.w === 'semtex') recebeu = h.inv[wb.w] === 4 && T.G.inv[wb.w] === 4 && h.lethal === wb.w;
      else if (wb.w === 'clay') recebeu = h.inv.clay === 2 && T.G.inv.clay === 2;
      else if (wb.w === 'bowie') recebeu = !!h.bowie && !!T.ZC.bowie;
      else recebeu = [h.inv.primary, h.inv.secondary, h.inv.third].includes(wb.w) && [T.G.inv.primary, T.G.inv.secondary, T.G.inv.third].includes(wb.w);
      const res = { item: 'parede ' + wb.i, w: wb.w, nome: wb.nome, zona, portas: portas.portas, andou: w, prompt: act?.txt, precoDado: wb.cost, pago, recebeu, ok: mi.ok && recebeu && pago === wb.cost, mirou: mi.ok ? true : mi.act };
      // devolve as armas iniciais (não deixa a compra mudar a próxima)
      if (!['he', 'semtex', 'clay', 'bowie'].includes(wb.w)) { for (const s of ['primary', 'secondary', 'third']) { if (h.inv[s] === wb.w) h.inv[s] = null; if (T.G.inv[s] === wb.w) T.G.inv[s] = null; } }
      E.volta(); return res;
    }, wb);
    log(r);
  }
  // 4b) armadilhas: prompt certo na alavanca e compra (depois da energia). O2-E02: preço por armadilha (t.cost ?? ZTRAP.cost) e, nas
  // armadilhas de uma ala (O2-C06/C08: Refeitório, Estufa, Lavanderia), antes anda até o interruptor da ala e liga com F (sem isso a
  // alavanca recusa: "ligue a Ala ...")
  if (SO.includes('trap')) {
    const traps = await ev(T => (T.ZD.traps || []).map((t, i) => ({ i, sx: t.sx, sz: t.sz, n: t.n, post: !!t.post, custo: t.cost ?? T.ZTRAP.cost, ala: t.ala || null })));
    for (const t of traps) {
      if (t.ala) { const r = await ev((T, E, ala) => E.ligarAla(ala), t.ala); if (r) log(r); }
      log(await ev((T, E, t) => {
        const x = t.sx + t.n[0] * (t.post ? .9 : .8), z = t.sz + t.n[1] * (t.post ? .9 : .8), zona = E.zona(x, z), portas = E.abrirAte(zona);
        if (!portas.ok) return { item: 'armadilha ' + t.i, ok: false, portas };
        const w = E.ir(x, z); const mi = E.mirar([t.sx, t.sz], a => a?.k === 'trap' && a.id === t.i); const act = E.act();
        const pago = mi.ok && act.ok !== false ? E.F() : 0; const st = T.Z.traps[t.i]?.st;
        const res = { item: 'armadilha ' + t.i, ala: t.ala, zona, andou: w, prompt: act?.txt, precoDado: t.custo, pago, estado: st, ok: mi.ok && pago === t.custo && st === 'on', mirou: mi.ok ? true : mi.act };
        for (let k = 0; k < T.ZTRAP.on + T.ZTRAP.cool + 1; k++) E.passo(1); E.volta(); return res; }, t));
    }
  }
  // 5) Caixa: cada lugar (põe a Caixa lá como o jogo faz e compra)
  if (SO.includes('box')) for (const b of inv.boxes) {
    const r = await ev((T, E, b) => {
      const h = E.h(); T.Z.box.loc = b.i; T.Z.box.st = 'idle'; T.zBoxPlace(b.i); T.zBuildWalk?.(); E.passo(.1);
      const x = b.x + b.n[0] * 1.3, z = b.z + b.n[1] * 1.3, zona = E.zona(x, z), portas = E.abrirAte(zona);
      if (!portas.ok) return { item: 'caixa ' + b.i, ok: false, portas };
      const w = E.ir(x, z);
      const mi = E.mirar([b.x, b.z], a => a?.k === 'box');
      const act = E.act(); const pago = mi.ok ? E.F() : 0; const st = T.Z.box.st;
      E.passo(4.5); const st2 = T.Z.box.st;
      const res = { item: 'caixa ' + b.i, zona, portas: portas.portas, andou: w, prompt: act?.txt, pago, estados: [st, st2], ok: mi.ok && pago === 950 && st === 'roll' && (st2 === 'offer' || st2 === 'teddy') };
      T.Z.box.st = 'idle'; T.Z.box.uses = 0; E.passo(.1); E.volta(); return res;
    }, b);
    log(r);
  }
  // 6) O2-C10: anda até cada interativo novo, compra com F e confere preço e estado (baú: pega a arma também)
  if (SO.includes('zint')) {
    { const r = await ev((T, E) => E.ligarEnergia()); if (r) log(r); } // O2-E02: munição e Wunderfizz precisam de energia (com --so zint sozinho)
    const L = await ev(T => T.ZD.zint.map((o, i) => ({ i, t: o.t, x: o.x, z: o.z, n: o.n })).filter(o => ['municao', 'wunderfizz', 'bau', 'sino'].includes(o.t)));
    for (const o of L) log(await ev((T, E, o) => {
      const h = E.h(), x = o.x + o.n[0] * 1.3, z = o.z + o.n[1] * 1.3, zona = E.zona(x, z), portas = E.abrirAte(zona);
      if (!portas.ok) return { item: o.t + ' ' + o.i, ok: false, portas };
      h.perks = []; T.ZC.perks.length = 0; h.inv.monkey = 0; T.G.inv.monkey = 0;
      for (const s of ['primary', 'secondary', 'third']) { const w = T.G.inv[s]; if (w) T.G.ammo[w] = { mag: 0, res: 0 }; } // munição vazia (senão o F diz "cheia")
      const w = E.ir(x, z); const mi = E.mirar([o.x, o.z], a => a?.k === 'zint' && a.id === o.i); const act = E.act();
      const pago = mi.ok && act.ok !== false ? E.F() : 0; const st = T.Z.zint[o.i].st, cli = T.ZC.zint[o.i].st, D = T.ZINT[o.t];
      const esp = { municao: 'uso', wunderfizz: 'gira:', bau: 'gira', sino: 'tocando' }[o.t];
      const res = { item: o.t + ' ' + o.i, zona, portas: portas.portas, andou: w, prompt: act?.txt, precoDado: D.custo, pago, estado: st, ok: mi.ok && pago === (o.t === 'municao' ? act.cost : D.custo) && [D.custo, D.custoPap].includes(pago) && st.startsWith(esp) && cli === st, mirou: mi.ok ? true : mi.act };
      if (o.t === 'wunderfizz') res.ok &&= h.perks.length === 1 && T.ZC.perks.length === 1;
      if (o.t === 'municao') res.ok &&= ['primary', 'secondary', 'third'].every(s => !T.G.inv[s] || T.G.ammo[T.G.inv[s]].res > 0);
      if (o.t === 'bau') { E.passo(D.giraS + .2); const of = T.Z.zint[o.i].st; const mi2 = E.mirar([o.x, o.z], a => a?.k === 'zint' && a.id === o.i && /^Pegar/.test(a.txt)); const act2 = E.act(); if (mi2.ok) E.F(); E.passo(.3);
        const arma = of.slice(7); res.oferta = of; res.prompt2 = act2?.txt;
        res.recebeu = arma === 'monkey' ? h.inv.monkey === 3 : arma === 'semtex' ? h.inv.semtex === 4 : arma === 'clay' ? h.inv.clay === 2 : [h.inv.primary, h.inv.secondary, h.inv.third].includes(arma);
        res.ok &&= mi2.ok && res.recebeu && T.Z.zint[o.i].st === 'pronto';
        for (const s of ['primary', 'secondary', 'third']) { if (h.inv[s] === arma) h.inv[s] = null; if (T.G.inv[s] === arma) T.G.inv[s] = null; } }
      h.perks = []; T.ZC.perks.length = 0; E.volta(); return res;
    }, o));
  }
  // 7) O2-E02: os outros tipos (C04 barril, C06 fogo, C07 terminal, C08 interruptor e atalhos, C09 barricada): anda até cada um, o F
  // escolhe o item certo e o uso dá o estado esperado no host e no cliente (barricada: tábuas arrancadas e conserto segurando F)
  if (SO.includes('zint2')) {
    const L = await ev(T => T.ZD.zint.map((o, i) => ({ i, t: o.t, id: o.id, x: o.x, z: o.z, n: o.n })).filter(o => ['barril', 'fogo', 'terminal', 'interruptor', 'barricada'].includes(o.t)));
    for (const o of L) {
      if (o.t === 'interruptor') { const r = await ev((T, E, id) => E.ligarInterruptor(q => q.id === id, id), o.id); log(r || { item: 'interruptor ' + o.id, ok: true, ja: 'ligado antes (armadilha da ala)' }); continue; }
      log(await ev((T, E, o) => {
        const h = E.h(), D = T.ZINT[o.t], d = o.t === 'barricada' ? 1.4 : 1.2, x = o.x + o.n[0] * d, z = o.z + o.n[1] * d, zona = E.zona(x, z), portas = E.abrirAte(zona);
        if (!portas.ok) return { item: o.t + ' ' + o.i, ok: false, portas };
        if (o.t === 'barril' && T.Z.zint[o.i].st !== 'pronto') { T.Z.zint[o.i].st = 'pronto'; T.zintMsg({ i: o.i, st: 'pronto', s: 0, sync: 1 }); } // o par já explodiu na corrente do vizinho: volta (como depois de voltaRodadas)
        if (o.t === 'barricada') { T.Z.zint[o.i].st = '2'; T.zintMsg({ i: o.i, st: '2', s: 0 }); } // 3 tábuas arrancadas (host e cliente)
        const w = E.ir(x, z); const mi = E.mirar([o.x, o.z], a => a?.k === 'zint' && a.id === o.i), act = E.act(), res = { item: o.t + ' ' + o.i, zona, portas: portas.portas, andou: w, prompt: act?.txt, mirou: mi.ok ? true : mi.act };
        if (o.t === 'barricada') { // segurar F = 'hold' k:'zint' (o zInteract só manda com a trava do mouse: aqui manda o que ele mandaria)
          const m0 = h.money; let n = 0; while (T.Z.zint[o.i].st !== 'pronto' && n++ < 40) { T.srvZHold(h, { k: 'zint', id: o.i }); E.passo(.15); }
          res.ganho = h.money - m0; res.estado = T.Z.zint[o.i].st; res.ok = mi.ok && act.hold === 1 && res.estado === 'pronto' && T.ZC.zint[o.i].st === 'pronto' && res.ganho >= 0; E.volta(); return res;
        }
        const pago = mi.ok && act.ok !== false ? E.F() : 0, st = T.Z.zint[o.i].st, cli = T.ZC.zint[o.i].st; Object.assign(res, { precoDado: D.custo, pago, estado: st, cli });
        if (o.t === 'terminal') { res.painel = T.ZLORE.i === o.i; res.ok = mi.ok && pago === 0 && res.painel && st === 'pronto'; T.zintLoreFecha(false); }
        else if (o.t === 'fogo') { res.ok = mi.ok && pago === D.custo && st === 'aceso' && cli === 'aceso'; E.volta(); for (let k = 0; k < D.dura + D.recarga + 1; k++) E.passo(1); res.volta = T.Z.zint[o.i].st; res.ok &&= res.volta === 'pronto'; }
        else if (o.t === 'barril') { res.ok = mi.ok && pago === 0 && st === 'pavio'; E.volta(); E.passo(D.pavio + .5); res.depois = T.Z.zint[o.i].st; res.ok &&= res.depois === 'boom' && T.ZC.zint[o.i].st === 'boom'; }
        E.volta(); return res;
      }, o));
    }
    // atalhos: abre as duas áreas pelo caminho de portas, liga a trava (se tiver) e derruba/abre o atalho com F
    const A = await ev(T => T.ZD.doors.filter(d => d.atalho).map(d => ({ id: d.id, rooms: d.rooms, trava: d.trava || null, cost: d.cost })));
    for (const d of A) {
      if (d.trava) { const r = await ev((T, E, id) => E.ligarInterruptor(q => q.id === id, id), d.trava); if (r) log(r); }
      log(await ev((T, E, d) => { const a = E.abrirAte(d.rooms[0]), b = E.abrirAte(d.rooms[1]); if (!a.ok || !b.ok) return { item: 'atalho ' + d.id, ok: false, a, b };
        const r = E.abrirPorta(d.id); E.volta(); return { item: 'atalho ' + d.id, precoDado: d.cost, ...r, ok: r.ok }; }, d));
    }
  }
  out.portasAbertas = await ev(T => [...T.ZC.doors]);
  if (SAIDA) fs.writeFileSync(SAIDA, JSON.stringify(out, null, 1));
  const ruins = out.itens.filter(o => !o.ok);
  console.log(`\n${MAPA}: ${out.itens.length} itens, ${ruins.length} com problema; erros da página: ${erros.length}`);
  for (const e of erros) console.log('  ', e);
  await br.close(); srv.close();
}
main().catch(e => { console.error(e); process.exit(1); });
