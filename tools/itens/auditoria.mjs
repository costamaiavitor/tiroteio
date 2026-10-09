// Auditoria dos itens e interativos dos mapas zumbi (overhaul, Onda 2, Frente C, O2-C01).
// Abre o jogo de verdade num Chromium (como o tools/bench/bench.mjs), monta o mapa como host, trava o relógio e lê o mundo
// já montado (ZD = M.z, COL, ZC.world). Nada do jogo é alterado: as grades são pintadas a partir de cópias do COL.
//
// Uso:
//   node tools/itens/auditoria.mjs [--pagina index.html] [--mapas sanatorio,vila] [--min 3] [--perto 6] [--desvio 2]
//                                  [--risco 3] [--saida auditoria-itens.json] [--png docs/overhaul/img] [--gfx baixo]
//                                  [--falhar-em erro|aviso] [--sem-gpu] [--quieto]
//   --min     distância mínima (m) entre dois itens que se enxergam: abaixo dela é ERRO (atrás de parede é aviso)
//   --perto   lista os pares abaixo desta distância (aviso para os que se enxergam)
//   --desvio  desvio máximo (m) que os itens podem causar no caminho a pé (campo dos zumbis) antes de virar ERRO
//   --risco   raio (m) de "nasce em cima": janela (lado de dentro) ou zumbi que sai do chão perto de um item
//   --png     pasta onde grava a planta de cima de cada mapa (<mapa>.png) com os itens marcados
//   --falhar-em  código de saída 1 com algum ERRO (padrão) ou com qualquer aviso
// Saída: relatório legível no terminal, JSON com o inventário e os achados (--saida) e código de saída 0 (tudo certo) ou 1.
//
// O que confere (cada item: armas de parede, bebidas, Pack-a-Punch, energia, armadilhas, lugares da Caixa e portas):
//  1. colisão: o corpo do item (as mesmas caixas que o zBuildWorld põe no COL) atravessando outra caixa; desenho de giz ou
//     alavanca sem parede atrás; lugar para o jogador ficar na frente (mesmo raio PR do jogador);
//  2. alcance: ponto de uso alcançável a pé a partir do nascimento com todas as portas abertas (grade do jogador, 0,5 m, que
//     sobe no que dá para pular, e grade dos zumbis, a mesma do zBuildWalk) e área inicial que não vaza sem abrir porta;
//  3. bloqueio de passagem: campo de distância a partir do nascimento com e sem os itens (e com a Caixa em cada lugar);
//     célula que fica sem caminho, desvio maior que 2× --desvio ou mais de 4 células com desvio > --desvio é ERRO (até 4 células
//     com desvio pequeno = aviso: um vão estreito atrás do item); a Caixa em cada lugar é comparada com o mapa sem a Caixa;
//  4. distância 2D entre todos os pares, com visada (mesmo lado da parede ou não) e "prompt sombreado" (o F escolhe o mais
//     perto: item sem nenhum ponto livre onde ele seja o escolhido é ERRO);
//  5. regiões (zoneAt) sem nenhum interativo, Caixa com 'n' que não aponta para dentro, portas cujos lados não batem com rooms;
//  6. força × risco: custo de portas até o item, caminho a pé desde o nascimento e pontos de nascimento de zumbi por perto.
// Interativos novos (O2-C04: ZINT_MAPA do jogo, barris e os próximos tipos) entram pelo __T.zintAud(), sem mexer aqui; tipo novo só ganha cor e legenda.
// Ganchos: usa os do O2-C01 em window.__T quando existem (zBuildWalk, footFreeR, ZPERKS...); sem eles, refaz as mesmas contas.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d; };
const flag = k => process.argv.includes('--' + k);
const PAGINA = path.resolve(arg('pagina', path.join(RAIZ, 'index.html')));
const MAPAS = arg('mapas', 'sanatorio,vila').split(',');
const CFG = { min: +arg('min', 3), perto: +arg('perto', 6), desvio: +arg('desvio', 2), risco: +arg('risco', 3) };
const SAIDA = arg('saida', null), PNG = arg('png', null), GFX = arg('gfx', 'baixo'), FALHAR = arg('falhar-em', 'erro'), QUIETO = flag('quieto');

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.png': 'image/png', '.jpg': 'image/jpeg', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
const RAIZES = [path.dirname(PAGINA), RAIZ];
const srv = http.createServer((req, res) => {
  let rel; try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, ''); } catch { res.writeHead(400); return res.end(); }
  if (!rel) rel = path.basename(PAGINA);
  for (const r of RAIZES) { const f = path.resolve(r, rel); if (f.startsWith(r) && fs.existsSync(f) && fs.statSync(f).isFile()) { res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); return fs.createReadStream(f).pipe(res); } }
  res.writeHead(404); res.end();
});

// ---------------------------------------------------------------------------------------------------------------
// Roda DENTRO da página (precisa ser autocontida). Devolve { inventario, achados, regioes, pares, forca, grade, png }.
// ---------------------------------------------------------------------------------------------------------------
function auditar(cfg) {
  const T = window.__T, ZD = T.ZD, COL = T.COL(), FF = T.FF, Wd = T.ZC.world;
  const PR = T.PR ?? .34, ZTOP = T.ZTOP ?? (7.3 * 7.3 / 44), H = 1.7;
  const zHigh = T.zHigh ?? (b => b.maxY > ZTOP || (b.ns && b.minY < .1));
  const zona = (x, z) => { if (ZD.zoneAt) return ZD.zoneAt(x, z) ?? null; for (const k in ZD.rooms) { const r = ZD.rooms[k]; if (x >= r[0] && x <= r[1] && z >= r[2] && z <= r[3]) return k; } return null; };
  const nomeZ = id => id == null ? '—' : (ZD.roomNames?.[id] ? `${id} ${ZD.roomNames[id]}` : id);
  const r2 = v => Math.round(v * 100) / 100, hyp = Math.hypot;
  const aabb = (x, z, n, w, d, h) => { const sw = Math.abs(n[0]) > 0; const hw = (sw ? d : w) / 2, hd = (sw ? w : d) / 2; return { minX: x - hw, maxX: x + hw, minY: 0, maxY: h, minZ: z - hd, maxZ: z + hd }; }; // igual ao zBuildWorld
  const igual = (a, b) => Math.abs(a.minX - b.minX) < 1e-4 && Math.abs(a.maxX - b.maxX) < 1e-4 && Math.abs(a.minZ - b.minZ) < 1e-4 && Math.abs(a.maxZ - b.maxZ) < 1e-4 && Math.abs(a.maxY - b.maxY) < 1e-4;
  const PERK = T.ZPERKS || {}, TRAP = T.ZTRAP || { cost: 1000 };
  const W = T.W, nomeW = w => w === 'he' ? 'Granadas' : w === 'semtex' ? 'Semtex' : w === 'clay' ? 'Claymore' : w === 'bowie' ? 'Faca Bowie' : W[w]?.name || w;
  const achados = [], ach = (grav, cod, txt, ids = []) => achados.push({ grav, cod, txt, ids });

  // ---------- espaço: hash das caixas (2 m) para consultas rápidas ----------
  const HS = 2, HX = new Map(), hk = (i, j) => i * 100003 + j;
  COL.forEach((b, k) => { for (let i = Math.floor(b.minX / HS); i <= Math.floor(b.maxX / HS); i++) for (let j = Math.floor(b.minZ / HS); j <= Math.floor(b.maxZ / HS); j++) { const key = hk(i, j); let a = HX.get(key); if (!a) HX.set(key, a = []); a.push(k); } });
  const perto = (x0, x1, z0, z1) => { const s = new Set(); for (let i = Math.floor(x0 / HS); i <= Math.floor(x1 / HS); i++) for (let j = Math.floor(z0 / HS); j <= Math.floor(z1 / HS); j++) for (const k of HX.get(hk(i, j)) || []) s.add(k); return [...s]; };

  // ---------- inventário ----------
  const itens = [];
  const add = o => { o.zona = zona(o.ux ?? o.x, o.uz ?? o.z); o.nomeZona = nomeZ(o.zona); itens.push(o); return o; };
  const uso = (o, dist) => { o.ux = o.x + o.n[0] * dist; o.uz = o.z + o.n[1] * dist; }; // ponto onde o jogador fica para usar
  const colDe = c => { if (!c) return -1; return COL.findIndex(b => b === c || igual(b, c)); };
  ZD.doors.forEach(d => {
    const o = Wd?.doors.get(d.id), nrm = d.rot != null ? [Math.sin(d.rot), Math.cos(d.rot)] : d.axis === 'z' ? [1, 0] : [0, 1];
    add({ id: 'porta:' + d.id, tipo: 'porta', cat: 'porta', x: d.x, z: d.z, n: nrm, ux: d.x, uz: d.z, preco: d.cost, efeito: `${d.kind === 'debris' ? 'entulho' : d.kind === 'gate' ? 'portão' : 'porta'}: ${nomeZ(d.rooms[0])} ↔ ${nomeZ(d.rooms[1])}`, kind: d.kind, rooms: d.rooms,
      raio: 2.6, col: o ? colDe(o.col) : -1, fonte: 'M.z.doors' });
  });
  ZD.wall.forEach((wb, i) => {
    const o = { id: 'parede:' + i, tipo: wb.w === 'he' || wb.w === 'semtex' || wb.w === 'clay' ? 'letal' : wb.w === 'bowie' ? 'bowie' : 'arma_parede', cat: 'item', x: wb.x, z: wb.z, n: wb.n, w: wb.w, nome: nomeW(wb.w), preco: wb.cost,
      efeito: wb.w === 'he' || wb.w === 'semtex' ? '4 granadas' : wb.w === 'clay' ? '2 Claymores' : wb.w === 'bowie' ? 'faca 1000 de dano' : `arma (munição ${Math.round(wb.cost / 2)}; com PaP 4500)`,
      post: !!wb.post, raio: 2, fonte: 'M.z.wall' + (i >= 0 ? `[${i}]` : '') };
    if (wb.post) { const px = wb.x - wb.n[0] * .08, pz = wb.z - wb.n[1] * .08; o.corpo = aabb(px, pz, wb.n, 2.1, .3, 2.3); o.col = colDe(o.corpo); uso(o, .23 + PR + .25); }
    else { o.parede = { y: 1.6 }; uso(o, PR + .3); }
    add(o);
  });
  ZD.perks.forEach(pk => { const P = PERK[pk.k] || {}; const o = { id: 'bebida:' + pk.k, tipo: 'bebida', cat: 'item', x: pk.x, z: pk.z, n: pk.n, k: pk.k, nome: P.name || pk.k, preco: P.cost ?? null, efeito: P.desc || '', raio: 2.2, fonte: 'M.z.perks', corpo: aabb(pk.x, pk.z, pk.n, 1.1, .9, 2.2) }; o.col = colDe(o.corpo); uso(o, .45 + PR + .25); add(o); });
  { const P = ZD.pap, o = { id: 'pap', tipo: 'pap', cat: 'item', x: P.x, z: P.z, n: P.n, nome: 'Pack-a-Punch', preco: 5000, efeito: 'melhora a arma na mão (1000 na oferta); precisa de energia', raio: 2.4, fonte: 'M.z.pap', corpo: aabb(P.x, P.z, P.n, 1.6, 1, 1.8) }; o.col = colDe(o.corpo); uso(o, .5 + PR + .25); add(o); }
  { const P = ZD.power, o = { id: 'energia', tipo: 'energia', cat: 'item', x: P.x, z: P.z, n: P.n, nome: 'Energia', preco: 0, efeito: 'liga bebidas, PaP e armadilhas (uma vez)', raio: 2.2, fonte: 'M.z.power', parede: { y: 1.3 } }; uso(o, .08 + PR + .3); add(o); }
  (ZD.traps || []).forEach((t, i) => { const o = { id: 'armadilha:' + i, tipo: 'armadilha', cat: 'item', x: t.sx, z: t.sz, n: t.n, nome: 'Armadilha elétrica', preco: t.cost ?? TRAP.cost, efeito: `choque em ${t.w}×${t.d} m por ${TRAP.on ?? 25} s, recarga ${TRAP.cool ?? 60} s; precisa de energia`, area: [t.x, t.z, t.w, t.d], raio: 2.2, fonte: 'M.z.traps', post: !!t.post };
    if (t.post) { o.corpo = aabb(t.sx, t.sz, t.n, .5, .4, 2.3); o.col = colDe(o.corpo); uso(o, .2 + PR + .25); } else { o.parede = { y: 1.3 }; uso(o, .08 + PR + .3); }
    add(o); });
  // O2-C04: interativos novos (ZINT_MAPA do jogo): corpo = a caixa que ele põe no COL, ponto de uso na frente (n)
  for (const q of (T.zintAud?.() || [])) { const o = { ...q, cat: 'item' }; o.col = colDe(o.corpo); uso(o, (q.usoDist ?? .3) + PR + .25); add(o); }
  const boxCur = Wd?.boxCol ? colDe(Wd.boxCol) : -1;
  ZD.boxes.forEach((L, i) => { const sw = Math.abs(L.n[0]) > 0, hw = sw ? .45 : .9, hd = sw ? .9 : .45;
    const o = { id: 'caixa:' + i, tipo: 'caixa', cat: 'item', x: L.x, z: L.z, n: L.n, nome: 'Caixa misteriosa' + (i === 0 ? ' (início)' : ''), preco: 950, efeito: 'arma sorteada (10 na Liquidação); muda de lugar depois do ursinho', raio: 2.3, fonte: 'M.z.boxes',
      corpo: { minX: L.x - hw, maxX: L.x + hw, minY: 0, maxY: .9, minZ: L.z - hd, maxZ: L.z + hd }, col: i === T.ZC.box.loc ? boxCur : -1, alterna: true };
    uso(o, .45 + PR + .25); add(o); });
  const extras = [];
  ZD.windows.forEach((w, i) => extras.push({ id: 'janela:' + i, tipo: 'janela', x: w.x, z: w.z, n: w.n, ix: w.ix, iz: w.iz, ox: w.ox, oz: w.oz, zona: zona(w.ix, w.iz), sala: w.room }));
  (ZD.risers || []).forEach((r, i) => extras.push({ id: 'chao:' + i, tipo: 'zumbi_do_chao', x: r[0], z: r[1], zona: zona(r[0], r[1]), sala: r[2] }));
  const spawns = (ZD.spawns || T.MAPS[T.curMapId]?.spawns || [[0, 0]]);
  spawns.forEach((s, i) => extras.push({ id: 'jogador:' + i, tipo: 'nascimento_jogador', x: s[0], z: s[1], zona: zona(s[0], s[1]) }));
  const lamps = (ZD.lamps || []).map(l => ({ x: l.x, z: l.z, y: l.y, luz: !!l.base, fogo: !!l.fire }));
  itens.forEach(o => { o.zonaUso = zona(o.ux, o.uz); });
  const ownCols = new Set(itens.filter(o => o.col >= 0).map(o => o.col));
  const doorCols = new Set(itens.filter(o => o.tipo === 'porta' && o.col >= 0).map(o => o.col));
  const itemCols = new Set(itens.filter(o => o.cat === 'item' && o.col >= 0).map(o => o.col));

  // ---------- grades (mesma pintura do zBuildWalk; s = tamanho da célula, r = raio, filtro = que caixa bloqueia) ----------
  const gx0 = FF.x0, gz0 = FF.z0, GW = FF.nx, GD = FF.nz;
  function pintar(s, r, bloqueia, fora) {
    const nx = Math.round(GW / s), nz = Math.round(GD / s), g = new Uint8Array(nx * nz).fill(1);
    COL.forEach((b, k) => {
      if (fora.has(k) || !bloqueia(b)) return;
      const i0 = Math.max(0, Math.floor((b.minX - r - gx0) / s - .5) + 1), i1 = Math.min(nx - 1, Math.ceil((b.maxX + r - gx0) / s - .5) - 1);
      const j0 = Math.max(0, Math.floor((b.minZ - r - gz0) / s - .5) + 1), j1 = Math.min(nz - 1, Math.ceil((b.maxZ + r - gz0) / s - .5) - 1);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) g[i * nz + j] = 0;
    });
    return { g, nx, nz, s };
  }
  const bloqZ = b => !(b.maxY <= .05 || b.minY >= 1.7); // zumbi (zBuildWalk)
  const bloqJ = b => b.maxY > .05 && b.minY < H && zHigh(b); // jogador num mapa zumbi: o que não dá para pular é parede
  const cel = (G, x, z) => { const i = Math.floor((x - gx0) / G.s), j = Math.floor((z - gz0) / G.s); return i < 0 || j < 0 || i >= G.nx || j >= G.nz ? -1 : i * G.nz + j; };
  // Dijkstra com baldes (reto 5, diagonal 7, sem cortar quina), como o zFlowStep, mas sem limite de distância
  function campo(G, fontes) {
    const { g, nx, nz } = G, N = nx * nz, D = new Float32Array(N).fill(Infinity), B = [];
    const push = (c, d) => { (B[d] ||= []).push(c); };
    for (const [x, z] of fontes) { let c = cel(G, x, z); if (c < 0) continue; if (!g[c]) c = livreProx(G, c); if (c >= 0 && D[c] > 0) { D[c] = 0; push(c, 0); } }
    for (let d = 0; d < B.length; d++) { const q = B[d]; if (!q) continue;
      for (let qi = 0; qi < q.length; qi++) { const c = q[qi]; if (D[c] !== d) continue; const i = (c / nz) | 0, j = c - i * nz;
        const wl = i > 0 && g[c - nz], wr = i < nx - 1 && g[c + nz], wd = j > 0 && g[c - 1], wu = j < nz - 1 && g[c + 1]; let nb;
        const t = (nb, nd) => { if (nd < D[nb]) { D[nb] = nd; push(nb, nd); } };
        if (wl) t(c - nz, d + 5); if (wr) t(c + nz, d + 5); if (wd) t(c - 1, d + 5); if (wu) t(c + 1, d + 5);
        if (wl && wd && g[nb = c - nz - 1]) t(nb, d + 7); if (wl && wu && g[nb = c - nz + 1]) t(nb, d + 7); if (wr && wd && g[nb = c + nz - 1]) t(nb, d + 7); if (wr && wu && g[nb = c + nz + 1]) t(nb, d + 7);
      } B[d] = null; }
    for (let c = 0; c < N; c++) if (D[c] !== Infinity) D[c] = D[c] / 5 * G.s; // metros
    return D;
  }
  function livreProx(G, c) { const nz = G.nz, i0 = (c / nz) | 0, j0 = c % nz; for (let k = 1; k <= 3; k++) for (let di = -k; di <= k; di++) for (let dj = -k; dj <= k; dj++) { const i = i0 + di, j = j0 + dj; if (i >= 0 && j >= 0 && i < G.nx && j < nz && G.g[i * nz + j]) return i * nz + j; } return -1; }
  const dist = (G, D, x, z) => { const c = cel(G, x, z); if (c < 0) return Infinity; if (G.g[c]) return D[c]; let best = Infinity; const nz = G.nz, i0 = (c / nz) | 0, j0 = c % nz; // ponto em cima de algo: a célula livre mais perto (até 1 célula)
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { const i = i0 + di, j = j0 + dj; if (i >= 0 && j >= 0 && i < G.nx && j < nz && G.g[i * nz + j]) best = Math.min(best, D[i * nz + j]); } return best; };

  const nada = new Set();
  const Zfech = pintar(1, .45, bloqZ, nada); // grade dos zumbis como o jogo começa (portas fechadas, Caixa no lugar 0)
  let mesmaDoJogo = null;
  if (T.zBuildWalk) { T.zBuildWalk(); mesmaDoJogo = Zfech.g.length === FF.walk.length && Zfech.g.every((v, i) => v === FF.walk[i]); }
  const Zab = pintar(1, .45, bloqZ, doorCols), Jab = pintar(.5, PR, bloqJ, doorCols), Jfech = pintar(.5, PR, bloqJ, nada);
  const Dz = campo(Zab, spawns), Dj = campo(Jab, spawns), Djf = campo(Jfech, spawns);

  // ---------- 2. área inicial sem abrir porta ----------
  const start = ZD.start || 'A', vaza = new Map();
  for (let c = 0; c < Djf.length; c++) if (Djf[c] !== Infinity) { const i = (c / Jfech.nz) | 0, j = c % Jfech.nz, x = gx0 + (i + .5) * .5, z = gz0 + (j + .5) * .5, zz = zona(x, z); if (zz && zz !== start) vaza.set(zz, (vaza.get(zz) || 0) + .25); }
  for (const [zz, m2] of vaza) if (m2 >= 4) ach('erro', 'vaza', `Sem abrir porta nenhuma o jogador chega a ${r2(m2)} m² de ${nomeZ(zz)} (área inicial é ${nomeZ(start)})`, []);

  // custo de portas até cada área (grafo de M.z.doors, como o zActive)
  const custo = { [start]: 0 }, portasAte = { [start]: [] }; { let mud = true; while (mud) { mud = false; for (const d of ZD.doors) for (const [a, b] of [[d.rooms[0], d.rooms[1]], [d.rooms[1], d.rooms[0]]]) if (custo[a] != null && (custo[b] == null || custo[a] + d.cost < custo[b])) { custo[b] = custo[a] + d.cost; portasAte[b] = [...portasAte[a], d.id]; mud = true; } } }

  // ---------- 1. colisão e lugar para ficar ----------
  const dentroParede = (x, y, z) => perto(x - .05, x + .05, z - .05, z + .05).some(k => { const b = COL[k]; return x >= b.minX - .05 && x <= b.maxX + .05 && z >= b.minZ - .05 && z <= b.maxZ + .05 && y >= b.minY && y <= b.maxY; });
  const livre = (x, z, r, ign) => !perto(x - r, x + r, z - r, z + r).some(k => { if (ign && ign.has(k)) return false; const b = COL[k]; return b.maxY > .5 && b.minY < H && x + r > b.minX && x - r < b.maxX && z + r > b.minZ && z - r < b.maxZ; });
  for (const o of itens) {
    o.problemas = [];
    if (o.corpo) { // corpo atravessando outra caixa
      const c = o.corpo, viz = perto(c.minX, c.maxX, c.minZ, c.maxZ).filter(k => k !== o.col && !(o.alterna && k === boxCur));
      const bate = [];
      for (const k of viz) { const b = COL[k]; if (b.maxY <= .05 || b.minY >= c.maxY) continue;
        const px = Math.min(c.maxX, b.maxX) - Math.max(c.minX, b.minX), pz = Math.min(c.maxZ, b.maxZ) - Math.max(c.minZ, b.minZ);
        if (px > .03 && pz > .03) { const dono = itens.find(q => q.col === k); bate.push({ k, px: r2(px), pz: r2(pz), dono: dono?.id || null, caixa: [r2(b.minX), r2(b.maxX), r2(b.minZ), r2(b.maxZ), r2(b.maxY)] }); } }
      if (bate.length) { o.problemas.push('colisao'); o.colisao = bate; ach('erro', 'colisao', `${o.id} (${o.nome}) atravessa ${bate.length} caixa(s): ${bate.slice(0, 3).map(b => (b.dono ? b.dono + ' ' : '') + b.px + '×' + b.pz + ' m').join('; ')}`, [o.id]); }
    }
    if (o.parede) { // desenho de giz / alavanca precisa de parede atrás
      const ok = dentroParede(o.x - o.n[0] * .12, o.parede.y, o.z - o.n[1] * .12) || dentroParede(o.x - o.n[0] * .3, o.parede.y, o.z - o.n[1] * .3);
      if (!ok) { o.problemas.push('sem_parede'); ach('erro', 'sem_parede', `${o.id} (${o.nome}) sem parede atrás: fica no ar em (${r2(o.x)}, ${r2(o.z)})`, [o.id]); }
    }
    if (o.tipo === 'porta') continue;
    const ign = new Set([o.col]); if (o.alterna) ign.add(boxCur);
    o.usoLivre = livre(o.ux, o.uz, PR, ign);
    if (!o.usoLivre) { // tenta de lado e mais longe, dentro do raio do F
      const t = [-o.n[1], o.n[0]]; let alt = null;
      for (const k of [.4, -.4, .8, -.8]) for (const e of [0, .3, .6]) { const x = o.ux + t[0] * k + o.n[0] * e, z = o.uz + t[1] * k + o.n[1] * e; if (!alt && hyp(x - o.x, z - o.z) < o.raio - .1 && livre(x, z, PR, ign)) alt = [x, z]; }
      if (alt) { o.problemas.push('apertado'); ach('aviso', 'apertado', `${o.id} (${o.nome}): a frente está ocupada; só dá para usar de lado`, [o.id]); o.ux = alt[0]; o.uz = alt[1]; }
      else { o.problemas.push('sem_lugar'); ach('erro', 'sem_lugar', `${o.id} (${o.nome}): nenhum lugar livre na frente para o jogador ficar`, [o.id]); }
    }
  }

  // ---------- 2. alcance (portas abertas) ----------
  for (const o of itens) {
    o.caminhoJ = r2(dist(Jab, Dj, o.ux, o.uz)); o.caminhoZ = r2(dist(Zab, Dz, o.ux, o.uz));
    o.custoPortas = custo[o.zonaUso] ?? custo[o.zona] ?? null; o.portas = portasAte[o.zonaUso] ?? portasAte[o.zona] ?? null;
    if (o.tipo === 'porta') { // os dois lados precisam ser alcançáveis com tudo aberto
      const a = dist(Jab, Dj, o.x + o.n[0] * 2.5, o.z + o.n[1] * 2.5), b = dist(Jab, Dj, o.x - o.n[0] * 2.5, o.z - o.n[1] * 2.5);
      if (a === Infinity || b === Infinity) ach('erro', 'inalcancavel', `${o.id}: um dos lados não é alcançável mesmo com tudo aberto`, [o.id]);
      const za = zona(o.x + o.n[0] * 2.5, o.z + o.n[1] * 2.5), zb = zona(o.x - o.n[0] * 2.5, o.z - o.n[1] * 2.5);
      if (!(new Set([za, zb]).has(o.rooms[0]) && new Set([za, zb]).has(o.rooms[1]))) ach('aviso', 'porta_lados', `${o.id}: os lados são ${nomeZ(za)} / ${nomeZ(zb)}, mas a porta diz ${o.rooms.join('/')} (o zActive abre as áreas da lista)`, [o.id]);
      continue;
    }
    if (o.caminhoJ === Infinity || o.caminhoJ == null) { o.problemas.push('inalcancavel'); ach('erro', 'inalcancavel', `${o.id} (${o.nome}) não é alcançável a pé desde o nascimento, nem com todas as portas abertas`, [o.id]); }
    if (o.custoPortas == null) { o.problemas.push('sem_porta'); ach('erro', 'sem_porta', `${o.id} (${o.nome}) está em ${nomeZ(o.zonaUso)}, área que nenhuma porta abre (o zActive nunca a ativa)`, [o.id]); }
  }
  // Caixa: lugar 0 na área inicial; 'n' para dentro de uma área (zTickObjects usa zoneAt(x+n, z+n) para escolher o lugar novo)
  ZD.boxes.forEach((L, i) => { const zz = zona(L.x + L.n[0], L.z + L.n[1]);
    if (i === 0 && zz !== start) ach('erro', 'caixa_inicio', `caixa:0 precisa estar na área inicial (${nomeZ(start)}); está em ${nomeZ(zz)}`, ['caixa:0']);
    if (zz == null) ach('erro', 'caixa_n', `caixa:${i}: zoneAt(x+n, z+n) é nulo: a Caixa nunca é sorteada para cá`, ['caixa:' + i]);
    else if (custo[zz] == null) ach('erro', 'caixa_n', `caixa:${i} aponta para ${nomeZ(zz)}, área que nenhuma porta abre`, ['caixa:' + i]); });
  // janelas e zumbis do chão: o lado de dentro precisa estar no campo dos zumbis
  for (const e of extras) { if (e.tipo === 'nascimento_jogador') { e.livre = dist(Jab, Dj, e.x, e.z) === 0 || dist(Jab, Dj, e.x, e.z) < 1; continue; }
    const px = e.tipo === 'janela' ? e.ix : e.x, pz = e.tipo === 'janela' ? e.iz : e.z, d = dist(Zab, Dz, px, pz); e.caminhoZ = r2(d);
    if (d === Infinity) ach(e.tipo === 'janela' ? 'erro' : 'aviso', 'nascimento_fora', `${e.id} (${nomeZ(e.zona)}): o ponto ${e.tipo === 'janela' ? 'de dentro' : ''} não está no campo de fluxo dos zumbis (zumbi preso)`, [e.id]); }

  // ---------- 3. bloqueio de passagem: com e sem os itens ----------
  const semItens = new Set([...doorCols, ...itemCols]);
  const Zsem = pintar(1, .45, bloqZ, semItens), Dsem = campo(Zsem, spawns);
  function comparar(Gc, Dc, rotulo, Db = Dsem) { // Db: campo de referência (sem o que está sendo testado)
    let perdidas = 0, maxDes = 0, nDes = 0, pior = null; const porItem = new Map();
    for (let c = 0; c < Db.length; c++) { if (Db[c] === Infinity || !Gc.g[c]) continue;
      const i = (c / Gc.nz) | 0, j = c % Gc.nz, x = gx0 + i + .5, z = gz0 + j + .5, des = Dc[c] - Db[c];
      if (Dc[c] === Infinity || des > cfg.desvio) { if (Dc[c] === Infinity) perdidas++; else { nDes++; if (des > maxDes) { maxDes = des; pior = [x, z]; } }
        let bi = null, bd = 1e9; for (const o of itens) if (o.cat === 'item') { const dd = hyp(o.x - x, o.z - z); if (dd < bd) { bd = dd; bi = o.id; } } porItem.set(bi, (porItem.get(bi) || 0) + 1); } }
    return { rotulo, perdidas, desvios: nDes, maxDesvio: r2(maxDes), pior: pior && [r2(pior[0]), r2(pior[1])], porItem: Object.fromEntries(porItem) };
  }
  const bloqueio = [comparar(Zab, Dz, 'itens (Caixa no lugar ' + T.ZC.box.loc + ')')];
  // a Caixa em cada lugar possível (só uma de cada vez), comparada com o mapa com os outros itens e sem a Caixa
  const semCaixa = new Set([...doorCols, boxCur]), Dbase = campo(pintar(1, .45, bloqZ, semCaixa), spawns);
  ZD.boxes.forEach((L, i) => { if (i === T.ZC.box.loc) return; const o = itens.find(q => q.id === 'caixa:' + i);
    COL.push(o.corpo); const k = COL.length - 1; const G = pintar(1, .45, bloqZ, semCaixa); const D = campo(G, spawns); COL.pop(); void k;
    bloqueio.push(comparar(G, D, 'caixa:' + i, Dbase)); });
  // sem caminho, desvio grande (> 2× o limite) ou muitas células = ERRO; poucas células (≤ 4) com desvio pequeno (um vão estreito atrás do item) = aviso
  for (const b of bloqueio) if (b.perdidas || b.desvios) ach(b.perdidas || b.maxDesvio > 2 * cfg.desvio || b.desvios > 4 ? 'erro' : 'aviso', 'bloqueio', `${b.rotulo}: ${b.perdidas} célula(s) de 1 m ficam sem caminho e ${b.desvios} com desvio > ${cfg.desvio} m (máx ${b.maxDesvio} m${b.pior ? ' em ' + b.pior.join(', ') : ''}); itens mais perto: ${JSON.stringify(b.porItem)}`, Object.keys(b.porItem));

  // ---------- 4. pares, visada e prompt sombreado ----------
  const visada = (ax, az, bx, bz) => { const d = hyp(bx - ax, bz - az), n = Math.max(1, Math.ceil(d / .25)); for (let i = 1; i < n; i++) { const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t; if (perto(x, x, z, z).some(k => { const b = COL[k]; return !ownCols.has(k) && k !== boxCur && b.maxY > 1.2 && b.minY < 1.5 && x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ; })) return false; } return true; };
  const pares = [];
  for (let a = 0; a < itens.length; a++) for (let b = a + 1; b < itens.length; b++) {
    const A = itens[a], B = itens[b]; if (A.tipo === 'porta' && B.tipo === 'porta') continue; if (A.tipo === 'caixa' && B.tipo === 'caixa') continue;
    const d = hyp(A.x - B.x, A.z - B.z); if (d >= cfg.perto) continue;
    const vis = visada(A.ux, A.uz, B.ux, B.uz), dUso = hyp(A.ux - B.ux, A.uz - B.uz);
    const grav = d < cfg.min && vis && A.tipo !== 'porta' && B.tipo !== 'porta' ? 'erro' : 'aviso';
    pares.push({ a: A.id, b: B.id, d: r2(d), dUso: r2(dUso), visada: vis, grav });
  }
  pares.sort((p, q) => p.d - q.d);
  for (const p of pares) if (p.grav === 'erro') ach('erro', 'perto', `${p.a} e ${p.b} a ${p.d} m um do outro (mesmo lado, mínimo ${cfg.min} m)`, [p.a, p.b]);
  // o F escolhe o candidato mais perto: existe algum ponto livre onde o item é o escolhido?
  const cands = itens.filter(o => o.tipo !== 'caixa' || o.col === boxCur || o.id === 'caixa:' + T.ZC.box.loc);
  for (const o of itens) { if (o.tipo === 'porta') continue;
    const outros = itens.filter(q => q !== o && (q.tipo !== 'caixa' || (o.tipo !== 'caixa' && q.id === 'caixa:' + T.ZC.box.loc)));
    let pontos = 0, ganha = 0, quem = new Map(); const ign = new Set([o.col]); if (o.alterna) ign.add(boxCur);
    for (let dx = -o.raio; dx <= o.raio; dx += .25) for (let dz = -o.raio; dz <= o.raio; dz += .25) { const x = o.x + dx, z = o.z + dz, d = hyp(dx, dz); if (d >= o.raio || !livre(x, z, PR, ign)) continue;
      if (dist(Jab, Dj, x, z) === Infinity) continue; pontos++;
      let melhor = null, md = d; for (const q of outros) { const dq = hyp(q.x - x, q.z - z); if (dq < q.raio && dq < md) { md = dq; melhor = q; } }
      if (!melhor) ganha++; else quem.set(melhor.id, (quem.get(melhor.id) || 0) + 1); }
    o.pontosF = pontos; o.pontosGanha = ganha;
    if (pontos && ganha === 0) { o.problemas.push('sombreado'); ach('erro', 'sombreado', `${o.id} (${o.nome}): em nenhum ponto livre o F escolhe ele (perde para ${[...quem.keys()].join(', ')})`, [o.id, ...quem.keys()]); }
    else if (pontos && ganha / pontos < .5) { o.problemas.push('meio_sombreado'); ach('aviso', 'sombreado', `${o.id} (${o.nome}): o F escolhe outro em ${Math.round(100 * (1 - ganha / pontos))}% dos pontos de uso (${[...quem.keys()].join(', ')})`, [o.id, ...quem.keys()]); }
  }
  void cands;
  // nascimento de zumbi em cima do item
  for (const o of itens) { if (o.tipo === 'porta') continue; const viz = [];
    for (const e of extras) { if (e.tipo === 'nascimento_jogador') continue; const px = e.tipo === 'janela' ? e.ix : e.x, pz = e.tipo === 'janela' ? e.iz : e.z, d = hyp(px - o.ux, pz - o.uz); if (d < cfg.risco) viz.push(`${e.id} ${r2(d)} m`); }
    if (viz.length) { o.problemas.push('nasce_em_cima'); ach('aviso', 'nasce_em_cima', `${o.id} (${o.nome}): zumbi nasce a menos de ${cfg.risco} m do ponto de uso (${viz.join(', ')})`, [o.id]); } }

  // ---------- 5. regiões ----------
  const reg = new Map(); const R = id => { let r = reg.get(id); if (!r) reg.set(id, r = { id, nome: nomeZ(id), m2: 0, sx: 0, sz: 0, itens: [], portas: [], janelas: 0, chao: 0, custo: custo[id] ?? null }); return r; };
  for (let c = 0; c < Dz.length; c++) if (Dz[c] !== Infinity) { const i = (c / Zab.nz) | 0, j = c % Zab.nz, x = gx0 + i + .5, z = gz0 + j + .5, id = zona(x, z); if (id == null) continue; const r = R(id); r.m2++; r.sx += x; r.sz += z; }
  for (const o of itens) { if (o.tipo === 'porta') { for (const id of o.rooms) R(id).portas.push(o.id); } else R(o.zonaUso ?? o.zona).itens.push(o.id); }
  for (const e of extras) { if (e.tipo === 'janela') R(e.zona).janelas++; else if (e.tipo === 'zumbi_do_chao') R(e.zona).chao++; }
  const regioes = [...reg.values()].map(r => ({ ...r, cx: r.m2 ? r2(r.sx / r.m2) : null, cz: r.m2 ? r2(r.sz / r.m2) : null, sx: undefined, sz: undefined })).sort((a, b) => (a.custo ?? 1e9) - (b.custo ?? 1e9) || b.m2 - a.m2);
  for (const r of regioes) if (!r.itens.length && r.m2 >= 60) ach('aviso', 'regiao_vazia', `${r.nome}: ${r.m2} m² andáveis sem nenhum interativo (só ${r.portas.length} porta(s), ${r.janelas} janela(s))`, []);
  const faltaBebida = Object.keys(PERK).filter(k => !ZD.perks.some(p => p.k === k)); if (faltaBebida.length) ach('aviso', 'bebida_ausente', `bebidas que não existem no mapa: ${faltaBebida.join(', ')}`, []);

  // ---------- 6. força × risco ----------
  const forca = o => { const p = o.preco ?? 0; if (o.forca0 != null) return o.forca0; // O2-C04: interativo novo traz a força da tabela ZINT
    if (o.tipo === 'pap') return 5; if (o.tipo === 'caixa') return 4; if (o.tipo === 'energia') return 3; if (o.tipo === 'armadilha') return 3; if (o.tipo === 'bowie') return 4; if (o.tipo === 'letal') return 2;
    if (o.tipo === 'bebida') return p >= 4000 ? 5 : p >= 2500 ? 4 : p >= 2000 ? 3 : 2;
    if (o.tipo === 'arma_parede') return p >= 2000 ? 4 : p >= 1500 ? 3 : p >= 1000 ? 2 : 1; return 0; };
  const fx = [];
  for (const o of itens) { if (o.tipo === 'porta') continue;
    let nasc = 0; for (const e of extras) { if (e.tipo === 'nascimento_jogador') continue; const px = e.tipo === 'janela' ? e.ix : e.x, pz = e.tipo === 'janela' ? e.iz : e.z; if (hyp(px - o.ux, pz - o.uz) < 15) nasc++; }
    o.forca = forca(o); o.nascPerto = nasc;
    fx.push({ id: o.id, nome: o.nome, tipo: o.tipo, forca: o.forca, custoPortas: o.custoPortas, portas: o.portas?.length ?? null, caminho: o.caminhoJ, nasc15: nasc, zona: o.nomeZona }); }
  const rank = a => { const s = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]), r = new Array(a.length); for (let i = 0; i < s.length;) { let j = i; while (j + 1 < s.length && s[j + 1][0] === s[i][0]) j++; for (let k = i; k <= j; k++) r[s[k][1]] = (i + j) / 2; i = j + 1; } return r; };
  const spear = (a, b) => { const ra = rank(a), rb = rank(b), n = a.length, ma = ra.reduce((s, v) => s + v, 0) / n, mb = rb.reduce((s, v) => s + v, 0) / n; let num = 0, da = 0, db = 0; for (let i = 0; i < n; i++) { num += (ra[i] - ma) * (rb[i] - mb); da += (ra[i] - ma) ** 2; db += (rb[i] - mb) ** 2; } return da && db ? r2(num / Math.sqrt(da * db)) : 0; };
  const fxv = fx.filter(f => f.tipo !== 'caixa' || f.id === 'caixa:0');
  const correl = { forca_x_custoPortas: spear(fxv.map(f => f.forca), fxv.map(f => f.custoPortas ?? 0)), forca_x_caminho: spear(fxv.map(f => f.forca), fxv.map(f => f.caminho === Infinity ? 999 : f.caminho)), forca_x_nascimentos: spear(fxv.map(f => f.forca), fxv.map(f => f.nasc15)), n: fxv.length };
  for (const f of fxv) if (f.forca >= 4 && (f.custoPortas ?? 0) <= 1000 && f.caminho < 30 && f.tipo !== 'caixa') ach('aviso', 'forte_seguro', `${f.id} (${f.nome}, força ${f.forca}) a ${f.caminho} m do nascimento com ${f.custoPortas} pontos de porta`, [f.id]);

  // ---------- planta (PNG) ----------
  let png = null;
  if (cfg.png) {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let c = 0; c < Dz.length; c++) if (Dz[c] !== Infinity) { const i = (c / Zab.nz) | 0, j = c % Zab.nz, x = gx0 + i, z = gz0 + j; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    x0 -= 8; x1 += 9; z0 -= 8; z1 += 9;
    const esc = Math.max(2, Math.min(7, Math.floor(2600 / Math.max(x1 - x0, z1 - z0)))), LEG = 300, cw = Math.ceil((x1 - x0) * esc) + LEG, ch = Math.ceil((z1 - z0) * esc) + 40;
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const g = cv.getContext('2d');
    const X = x => (x - x0) * esc, Y = z => (z - z0) * esc + 30;
    g.fillStyle = '#121416'; g.fillRect(0, 0, cw, ch);
    const hue = id => { let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % 360; };
    for (let c = 0; c < Dz.length; c++) { if (Dz[c] === Infinity) continue; const i = (c / Zab.nz) | 0, j = c % Zab.nz, x = gx0 + i, z = gz0 + j, id = zona(x + .5, z + .5);
      g.fillStyle = id == null ? '#3a3d40' : `hsl(${hue(id)},28%,${(custo[id] ?? 0) === 0 ? 34 : 26}%)`; g.fillRect(X(x), Y(z), esc + .5, esc + .5); }
    for (const [k, b] of COL.entries()) { if (b.maxY <= .05) continue; if (doorCols.has(k)) continue;
      g.fillStyle = itemCols.has(k) || k === boxCur ? 'rgba(0,0,0,0)' : b.maxY > ZTOP ? '#060708' : '#55504a'; g.fillRect(X(b.minX), Y(b.minZ), Math.max(1, (b.maxX - b.minX) * esc), Math.max(1, (b.maxZ - b.minZ) * esc)); }
    const txt = (s, x, y, cor, tam = 11, alin = 'left') => { g.font = `bold ${tam}px Arial`; g.textAlign = alin; g.lineWidth = 3; g.strokeStyle = '#000'; g.strokeText(s, x, y); g.fillStyle = cor; g.fillText(s, x, y); };
    for (const r of regioes) if (r.cx != null && r.m2 > 30) txt(r.nome, X(r.cx), Y(r.cz), 'rgba(255,255,255,.55)', 12, 'center');
    for (const e of extras) { if (e.tipo === 'janela') { g.fillStyle = '#4fd1ff'; g.fillRect(X(e.x) - 2, Y(e.z) - 2, 5, 5); }
      else if (e.tipo === 'zumbi_do_chao') { g.fillStyle = '#b06cff'; g.beginPath(); g.arc(X(e.x), Y(e.z), 2.5, 0, 7); g.fill(); }
      else { g.fillStyle = '#4cff6a'; g.beginPath(); g.arc(X(e.x), Y(e.z), 4, 0, 7); g.fill(); } }
    const COR = { porta: '#ff9a2e', arma_parede: '#f2f2f2', letal: '#ffd84a', bowie: '#ffd84a', bebida: '#ff4f9a', pap: '#a77bff', energia: '#ffe14a', armadilha: '#5fd0ff', caixa: '#3fe0c0', barril: '#ff6a3d', terminal: '#9fe870', fogo: '#ffb020' };
    const rot = o => o.tipo === 'porta' ? `${o.id.slice(6)} ${o.preco}` : o.tipo === 'caixa' ? `?${o.id.slice(6)}` : o.tipo === 'bebida' ? o.nome : o.tipo === 'pap' ? 'PaP' : o.tipo === 'energia' ? 'ENERGIA' : o.tipo === 'armadilha' ? 'armadilha' : o.tipo === 'barril' ? 'barril' : `${o.nome} ${o.preco}`;
    for (const o of itens) { const c = COR[o.tipo] || '#fff', ruim = o.problemas?.some(p => p !== 'meio_sombreado' && p !== 'nasce_em_cima' && p !== 'apertado');
      if (o.tipo === 'porta') { const t = [-o.n[1], o.n[0]]; g.strokeStyle = c; g.lineWidth = 4; g.beginPath(); g.moveTo(X(o.x - t[0] * 2), Y(o.z - t[1] * 2)); g.lineTo(X(o.x + t[0] * 2), Y(o.z + t[1] * 2)); g.stroke(); txt(rot(o), X(o.x) + 4, Y(o.z) - 4, c, 10); continue; }
      if (o.area) { const [ax, az, aw, ad] = o.area; g.fillStyle = 'rgba(95,208,255,.25)'; g.fillRect(X(ax - aw / 2), Y(az - ad / 2), aw * esc, ad * esc); }
      g.fillStyle = c; g.beginPath(); if (o.tipo === 'caixa') g.rect(X(o.x) - 4, Y(o.z) - 4, 8, 8); else g.arc(X(o.x), Y(o.z), o.tipo === 'pap' || o.tipo === 'energia' ? 6 : 4.5, 0, 7); g.fill();
      g.strokeStyle = c; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(o.x), Y(o.z)); g.lineTo(X(o.x + o.n[0] * 1.6), Y(o.z + o.n[1] * 1.6)); g.stroke();
      if (ruim) { g.strokeStyle = '#ff2a2a'; g.lineWidth = 2.5; g.beginPath(); g.arc(X(o.x), Y(o.z), 9, 0, 7); g.stroke(); }
      txt(rot(o), X(o.x) + 7, Y(o.z) + 4, c, 10); }
    for (const p of pares) if (p.grav === 'erro') { const A = itens.find(o => o.id === p.a), B = itens.find(o => o.id === p.b); g.strokeStyle = '#ff2a2a'; g.lineWidth = 2; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(X(A.x), Y(A.z)); g.lineTo(X(B.x), Y(B.z)); g.stroke(); g.setLineDash([]); }
    // legenda
    const lx = cw - LEG + 14; let ly = 50; g.fillStyle = '#1d2023'; g.fillRect(cw - LEG, 0, LEG, ch);
    txt(`${T.curMapId ?? ''} — planta dos interativos`, lx, 28, '#fff', 15);
    const leg = [['porta', 'porta / portão / entulho (preço)'], ['arma_parede', 'arma de parede (preço)'], ['letal', 'granada, Semtex, Claymore, Bowie'], ['bebida', 'bebida'], ['pap', 'Pack-a-Punch'], ['energia', 'energia'], ['armadilha', 'armadilha (área do choque)'], ['caixa', 'lugar da Caixa (?n)'], ['barril', 'barril explosivo (O2-C04)'], ['terminal', 'terminal com lore (O2-C07)'], ['fogo', 'armadilha de fogo (O2-C06)']];
    for (const [k, s] of leg) { g.fillStyle = COR[k]; g.beginPath(); g.arc(lx + 5, ly - 4, 5, 0, 7); g.fill(); txt(s, lx + 16, ly, '#ddd', 12); ly += 20; }
    for (const [cor, s] of [['#4fd1ff', 'janela (zumbi entra)'], ['#b06cff', 'zumbi sai do chão'], ['#4cff6a', 'nascimento do jogador'], ['#ff2a2a', 'problema (círculo) / perto demais (tracejado)']]) { g.fillStyle = cor; g.fillRect(lx, ly - 9, 10, 10); txt(s, lx + 16, ly, '#ddd', 12); ly += 20; }
    ly += 6; txt('fundo: área andável (cor por região;', lx, ly, '#aaa', 11); txt('mais clara = área inicial)', lx, ly + 14, '#aaa', 11); txt('preto = parede; marrom = dá para pular', lx, ly + 28, '#aaa', 11); txt('traço = para onde o item está virado', lx, ly + 42, '#aaa', 11);
    txt(`escala: ${esc} px/m; grade ${10} m`, lx, ly + 62, '#aaa', 11);
    g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1; for (let x = Math.ceil(x0 / 10) * 10; x < x1; x += 10) { g.beginPath(); g.moveTo(X(x), 30); g.lineTo(X(x), ch); g.stroke(); } for (let z = Math.ceil(z0 / 10) * 10; z < z1; z += 10) { g.beginPath(); g.moveTo(0, Y(z)); g.lineTo(cw - LEG, Y(z)); g.stroke(); }
    png = cv.toDataURL('image/png');
  }

  const limpa = o => { const { corpo, parede, alterna, cat, forca0, usoDist, ...r } = o; void forca0; void usoDist; void corpo; void parede; void alterna; void cat; for (const k of ['x', 'z', 'ux', 'uz']) if (typeof r[k] === 'number') r[k] = r2(r[k]); return r; };
  return { inventario: { itens: itens.map(limpa), nascimentos: extras, lampadas: lamps, start, ff: { x0: gx0, z0: gz0, nx: GW, nz: GD }, colisores: COL.length },
    grade: { mesmaDoJogo, areaInicialM2: r2([...Djf].filter(v => v !== Infinity).length * .25) }, achados, regioes, pares, forca: { itens: fx, correl }, bloqueio, png };
}

// ---------------------------------------------------------------------------------------------------------------
async function abrir(br, port) {
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } });
  const erros = []; pg.on('pageerror', e => erros.push(String(e.stack || e).slice(0, 300)));
  await pg.route(u => !/^http:\/\/(localhost|127\.0\.0\.1)/.test(String(u)), r => r.abort()); // sem rede externa
  await pg.goto(`http://127.0.0.1:${port}/${path.basename(PAGINA)}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await pg.waitForFunction(() => window.__T && window.__T.MAPS, null, { timeout: 240000 });
  return { pg, erros };
}
async function carregar(pg, mapa) {
  await pg.evaluate(({ mapa, GFX }) => { const T = window.__T; T.CFG.gfx = GFX; try { T.applyQuality(); } catch { }
    T.startHost({ map: mapa, zmap: mapa, mode: 'zombies', rounds: 8, frags: 20, bots: 0, diff: 1, zdiff: 1 });
    window.__simLock = true; T.curMapId = mapa; }, { mapa, GFX }); // relógio travado: nenhum zumbi nasce nem a Caixa muda durante a leitura
  await pg.waitForFunction(() => !document.getElementById('warmMsg') && window.__T.ZC.world, null, { timeout: 600000, polling: 250 });
}

const fmt = v => v === Infinity || v == null ? '—' : String(v).replace('.', ',');
function relatorio(mapa, r) {
  const L = [], it = r.inventario.itens, cont = {}; for (const o of it) cont[o.tipo] = (cont[o.tipo] || 0) + 1;
  const nasc = {}; for (const e of r.inventario.nascimentos) nasc[e.tipo] = (nasc[e.tipo] || 0) + 1;
  L.push(`\n=== ${mapa} ===`);
  L.push(`inventário: ${Object.entries(cont).map(([k, v]) => `${k} ${v}`).join(', ')}; ${Object.entries(nasc).map(([k, v]) => `${k} ${v}`).join(', ')}; lâmpadas ${r.inventario.lampadas.length}; colisores ${r.inventario.colisores}`);
  L.push(`grade dos zumbis igual à do jogo (zBuildWalk): ${r.grade.mesmaDoJogo == null ? 'sem gancho O2-C01' : r.grade.mesmaDoJogo ? 'sim' : 'NÃO'}; área inicial a pé: ${fmt(r.grade.areaInicialM2)} m²`);
  if (!QUIETO) {
    L.push('itens (id | zona | preço | caminho a pé m | portas até lá | força | problemas):');
    for (const o of it) if (o.tipo !== 'porta') L.push(`  ${o.id.padEnd(14)} ${String(o.nome).slice(0, 22).padEnd(22)} ${String(o.nomeZona).slice(0, 24).padEnd(24)} ${String(o.preco ?? '').padStart(5)}  ${fmt(o.caminhoJ).padStart(6)}  ${String(o.custoPortas ?? '—').padStart(5)}  f${o.forca ?? '-'}  ${(o.problemas || []).join(',')}`);
    L.push(`pares abaixo de ${CFG.perto} m (${r.pares.length}; ${r.pares.filter(p => p.d < CFG.min).length} abaixo de ${CFG.min} m):`);
    for (const p of r.pares) L.push(`  ${p.grav === 'erro' ? 'ERRO ' : '     '}${p.a} — ${p.b}: ${fmt(p.d)} m${p.visada ? '' : ' (parede no meio)'}`);
    L.push('bloqueio de passagem (campo de fluxo com × sem itens):');
    for (const b of r.bloqueio) if (b.perdidas || b.desvios || b.rotulo.startsWith('itens')) L.push(`  ${b.rotulo}: ${b.perdidas} sem caminho, ${b.desvios} com desvio > ${CFG.desvio} m, máx ${fmt(b.maxDesvio)} m`);
    L.push(`força × risco (Spearman, n=${r.forca.correl.n}): × custo de portas ${fmt(r.forca.correl.forca_x_custoPortas)}, × caminho ${fmt(r.forca.correl.forca_x_caminho)}, × nascimentos a 15 m ${fmt(r.forca.correl.forca_x_nascimentos)}`);
    L.push('regiões (custo de portas | m² | itens):');
    for (const g of r.regioes) L.push(`  ${String(g.nome).slice(0, 28).padEnd(28)} ${String(g.custo ?? '—').padStart(5)} ${String(g.m2).padStart(6)}  ${g.itens.length ? g.itens.join(' ') : '(nenhum)'}`);
  }
  const e = r.achados.filter(a => a.grav === 'erro'), a = r.achados.filter(a => a.grav === 'aviso');
  L.push(`achados: ${e.length} erro(s), ${a.length} aviso(s)`);
  for (const x of [...e, ...a]) L.push(`  ${x.grav === 'erro' ? 'ERRO ' : 'aviso'} [${x.cod}] ${x.txt}`);
  return L.join('\n');
}

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port;
  const args = flag('sem-gpu') ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-angle=d3d11', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'];
  const br = await chromium.launch({ args: [...args, '--autoplay-policy=no-user-gesture-required'] });
  const out = { pagina: path.relative(RAIZ, PAGINA) || PAGINA, quando: new Date().toISOString(), cfg: CFG, mapas: {} };
  let falhou = false;
  for (const mapa of MAPAS) {
    const { pg, erros } = await abrir(br, port);
    try {
      await carregar(pg, mapa);
      const r = await pg.evaluate(auditar, { ...CFG, png: !!PNG });
      if (PNG && r.png) { fs.mkdirSync(PNG, { recursive: true }); const f = path.join(PNG, `itens_${mapa}.png`); fs.writeFileSync(f, Buffer.from(r.png.split(',')[1], 'base64')); r.pngArquivo = f; }
      delete r.png; if (erros.length) r.errosPagina = erros;
      out.mapas[mapa] = r;
      console.log(relatorio(mapa, r));
      if (r.achados.some(a => a.grav === 'erro' || FALHAR === 'aviso')) falhou = true;
    } catch (e) { out.mapas[mapa] = { falha: String(e).slice(0, 500), erros }; console.log(mapa, 'FALHOU', String(e).slice(0, 300)); falhou = true; }
    await pg.close();
  }
  if (SAIDA) { fs.writeFileSync(SAIDA, JSON.stringify(out, (k, v) => v === Infinity ? null : v, 1)); console.log('\ngravado em', SAIDA); }
  await br.close(); srv.close();
  console.log(falhou ? '\nRESULTADO: FALHOU (há erros)' : '\nRESULTADO: OK');
  process.exit(falhou ? 1 : 0);
})();
