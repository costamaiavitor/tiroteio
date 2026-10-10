// O3-D03 (refator de tipos da campanha): prova de que o modo clássico não mudou.
// Roda uma partida clássica com sorteio e relógio fixos (Math.random com semente e contador, performance.now falso) e compara com a
// referência gravada no HEAD de antes do refator (tests/ref/tipos-zumbi-classico.json): tipos sorteados, vida, velocidade, dano, posições
// depois de N s de simulação, pontos, quantos sorteios foram consumidos e a foto de rede (f da foto 'zs' e o tipo lido no cliente) dos
// tipos 0 a 6 e do cão. Também confere os ganchos da campanha (devolvem na hora sem CAMP.on e funcionam com CAMP.on).
// Regravar a referência (só numa versão que se sabe igual ao clássico): GRAVAR_REF=1 node --test tests/tipos-zumbi.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

const REF = new URL('./ref/tipos-zumbi-classico.json', import.meta.url);
let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 }); }, { timeout: 180000 });
after(async () => { await J?.fechar(); });

// tudo numa avaliação só: sem quadro do navegador no meio (nada fora da simulação consome sorteio)
const cenario = T => {
  let s = 0x2f6e2b1, n = 0; const R0 = Math.random, P0 = performance.now, L0 = Error.stackTraceLimit;
  // A sequência fixa é a do servidor (host): o que o desenho do cliente sorteia (uuid dos objetos do three.js, som, atmosfera, animação
  // e efeitos dos zumbis, mensagens que o host recebe de si mesmo) depende do que o navegador fez antes de o relógio travar (cache,
  // recorte pela câmera, relógios da atmosfera), então tira do sorteio de verdade. O tremor da câmera (2 por quadro) fica na sequência.
  const cliente = /\bat (generateUUID|nz|atmosTick|play|onMsg|updateZombies|renderScene) /; Error.stackTraceLimit = 40;
  Math.random = () => { if (cliente.test(new Error().stack)) return R0(); n++; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let pc = 0; performance.now = () => (pc += 1e-3); // fatias por tempo (campo de fluxo) andam sempre o mesmo tanto
  const out = { fotos: [], hits: [], snap: [] };
  try {
    window.__simNow = 5000; T.sim(0);
    const Z = T.Z, S = T.S, p = S.players.get('h'), ZC = T.ZC;
    for (const zc of [...ZC.zs.values()]) { zc.model.parent?.remove(zc.model); ZC.zs.delete(zc.id); }
    Z.zs.clear(); Z.nextId = 100000; Z.drops.length = 0; Z.clouds.length = 0; Z.vult.length = 0; Z.clays.length = 0; Z.reQ = [];
    Z.boards = Z.boards.map(() => 6); Z.winT.forEach(w => { w.tear = 0; w.climb = 0; w.busy = false; });
    Z.insta = Z.dbl = Z.fire = Z.bf = 0; Z.lure = null; Z.dropScore = 0; Z.dropsRound = 0;
    Z.zsT = 0; Z.ffT = 0; S.stateT = 0; // relógios acumulados (foto 20 Hz, campo de fluxo, estado) começam no mesmo ponto
    const sp = T.ZD.spawns[0]; T.me.pos.set(sp[0], 0, sp[1]); T.me.vel.set(0, 0, 0); p.pos[0] = sp[0]; p.pos[1] = 0; p.pos[2] = sp[1];
    // o jogador fica preso no ponto (a física dele no cliente e o tranco dos golpes não entram na conta)
    const passo = seg => { for (let i = 0, k = Math.round(seg * 60); i < k; i++) { T.me.pos.set(sp[0], 0, sp[1]); T.me.vel.set(0, 0, 0); p.pos[0] = sp[0]; p.pos[1] = 0; p.pos[2] = sp[1]; T.sim(1 / 60); } };
    p.alive = true; p.downed = false; p.hp = p.maxHp = 100; p.money = 0; p.kills = 0; p.hs = 0; p.perks = []; p.zbEnd = 0; p.dwEnd = 1e12; // invulnerável (Dying Wish)
    Z.round = 13; Z.nextBoss = 14; Z.nextDog = 99; Z.phase = 'break'; T.zStartRound(); // rodada 14: todos os especiais e o Carniceiro
    const now = () => window.__simNow;
    const foto = k => ({ k, rnd: n, ts: Z.toSpawn, mixN: Z.mixN, mix: Z.mix.slice(0, 6), mixExtraZero: Z.mix.slice(6).every(x => x === 0), bossQ: Z.bossQ,
      zs: [...Z.zs.values()].sort((a, b) => a.id - b.id).map(z => [z.id, z.kind, z.hp, z.maxHp, z.speed, z.sc, z.st, z.crawler ? 1 : 0, z.dog ? 1 : 0, z.body.pos.x, z.body.pos.y, z.body.pos.z, z.yaw, z.slowT || 0, z.buffT || 0]),
      pl: [p.hp, p.money, p.kills, p.hs] });
    for (let k = 0; k < 14; k++) {
      passo(5);
      if (k === 4) { // golpes em todos (zonas, armas e explosão variadas: perna arrancada é sorteio)
        const zs = [...Z.zs.values()].sort((a, b) => a.id - b.id);
        zs.forEach((z, i) => T.zHit(p, z.id, 250 + 50 * (i % 5), ['head', 'legs', 'body'][i % 3], i % 2 ? 'm1911' : 'he', i % 2 === 0));
        out.hits.push(zs.map(z => [z.id, z.hp]));
      }
      if (k === 6 || k === 8) { // Carniceiro: golpe enorme (teto), Insta-Kill (só dobra), explosão sem dono (teto), 'zhit' pela rede (zona 'fraco' vale corpo)
        const c = [...Z.zs.values()].find(z => z.kind === 6);
        if (c) {
          T.zHit(p, c.id, 1e6, 'body', 'm1911', false); const h1 = c.hp;
          Z.insta = now() + 3; T.zHit(p, c.id, 900, 'head', 'm1911', false); Z.insta = 0; const h2 = c.hp;
          T.zExplode(c.body.pos.clone(), null, 6, 5000, 'he'); const h3 = c.hp;
          for (const zz of ['head', 'fraco', 'body', 'legs']) T.sendToHost({ t: 'zhit', v: c.id, w: 'm1911', dmg: 80, z: zz });
          out.hits.push(['carn', h1, h2, h3, c.hp, c.sc, c.slowT || 0]);
        } else out.hits.push(['carn', null]);
        const o = [...Z.zs.values()].find(z => z.kind !== 6); if (o) { for (const zz of ['fraco', 'head']) T.sendToHost({ t: 'zhit', v: o.id, w: 'm1911', dmg: 80, z: zz }); out.hits.push(['zhit', o.id, o.hp]); }
      }
      if (k === 10) for (const z of Z.zs.values()) z.nukeAt = now() + .2; // Nuke: o Carniceiro perde 20%, os outros morrem
      out.fotos.push(foto(k));
    }
    // foto de rede: um de cada tipo (0-6, pela fila de volta) e um cão
    Z.zs.clear(); Z.reQ = []; Z.bossQ = 0; Z.mixN = 0; Z.toSpawn = 0; Z.spawnT = 1e12;
    for (const zc of [...ZC.zs.values()]) { zc.model.parent?.remove(zc.model); ZC.zs.delete(zc.id); }
    const ids = [];
    for (let k = 0; k <= 6; k++) { Z.reQ.push([k, 0, 0]); Z.toSpawn++; const id = Z.nextId; const ok = T.zSpawnOne(); ids.push([k, ok ? id : null]); }
    Z.dogRound = true; Z.toSpawn++; { const id = Z.nextId; ids.push(['cão', T.zSpawnOne() ? id : null]); } Z.dogRound = false;
    passo(.25);
    for (const [k, id] of ids) { const z = Z.zs.get(id), zc = ZC.zs.get(id); out.snap.push([k, z ? z.kind : null, zc ? zc.f : null, zc ? zc.kind : null, zc ? zc.dog : null, zc ? zc.sz : null]); }
    out.rnd = n;
  } finally { Math.random = R0; performance.now = P0; Error.stackTraceLimit = L0; }
  return out;
};

test('clássico idêntico ao HEAD de antes do refator (sorteios, vida, dano, velocidade, posições, foto de rede)', { timeout: 300000 }, async () => {
  const r = await noJogo(J.page, cenario);
  assert.equal(J.erros.length, 0, J.erros.join('\n'));
  // sanidade do cenário: o Carniceiro nasceu e apanhou, especiais de todos os tipos apareceram
  const tipos = new Set(r.fotos.flatMap(f => f.zs.map(z => z[1])));
  for (const k of [0, 1, 2, 3, 4, 5, 6]) assert.ok(tipos.has(k), `o cenário não teve o tipo ${k}`);
  assert.ok(r.hits.some(h => h[0] === 'carn' && h[1] != null), 'o Carniceiro não apanhou');
  assert.ok(r.fotos.every(f => f.mixExtraZero));
  for (const [k, kind, f, ck] of r.snap) { assert.notEqual(f, null, `tipo ${k} sem foto`); if (k !== 'cão') { assert.equal(kind, k); assert.equal(ck, k); assert.equal((f >> 7) & 7, k); } }
  if (process.env.GRAVAR_REF) { mkdirSync(new URL('./ref/', import.meta.url), { recursive: true }); writeFileSync(REF, JSON.stringify(r)); return; }
  const ref = JSON.parse(readFileSync(REF, 'utf8'));
  assert.equal(r.rnd, ref.rnd, 'quantidade de sorteios (Math.random) diferente');
  assert.deepEqual(r.snap, ref.snap, 'foto de rede dos tipos 0-6 diferente');
  assert.deepEqual(r.hits, ref.hits, 'dano diferente');
  for (let i = 0; i < ref.fotos.length; i++) assert.deepEqual(r.fotos[i], ref.fotos[i], `estado diferente depois de ${(i + 1) * 5} s`);
});

test('ganchos da campanha: sem CAMP.on devolvem na hora; com CAMP.on chamam o que foi registrado', async t => {
  const tem = await noJogo(J.page, T => !!T.zfTipo);
  if (!tem) return t.skip('versão sem o refator (HEAD de antes do O3-D03)');
  const r = await noJogo(J.page, T => {
    const { CAMP, CAMP_G, CAMP_IA, ZKIND, Z, S } = T, p = S.players.get('h'), o = {};
    // tipo com 5 bits: ida e volta de 0 a 31, sem tocar nos bits 0-6 e 10 (vault)
    o.ida = []; for (let k = 0; k < 32; k++) { const f = T.zfTipo(k) | 1024 | 127; o.ida.push(T.zTipoDeF(f) === k && (f & 1024) === 1024 && (f & 127) === 127 && (k > 7 || T.zfTipo(k) === k << 7)); }
    o.carn = ['chefe', 'capGolpe', 'capArmadilha', 'capNuke', 'alc', 'furia'].map(c => ZKIND[6][c]);
    o.chefes = ZKIND.map((K, i) => K?.chefe ? i : -1).filter(i => i >= 0 && i < 7); // O3-D09: os chefes da campanha (14+) e os tipos ainda vazios (null) ficam fora
    // clássico: devolvem na hora, sem chamar nada registrado
    let chamou = 0; const reg = () => { chamou++; };
    CAMP_G.tipo.push(k => (reg(), 3)); CAMP_G.dano.push((z, d) => (reg(), d * 2)); CAMP_G.nasce.push((z, c) => (reg(), c.length = 0)); CAMP_G.status.push(z => { reg(); z.cv = 2; }); CAMP_G.morte.push(reg); CAMP_G.zhit.push(() => (reg(), false));
    CAMP_IA[0] = () => (reg(), true);
    const z = { kind: 0, hp: 100, maxHp: 100, body: { pos: { x: 0, y: 0, z: 0 } }, yaw: 0 }, cands = [{ i: 0 }];
    o.off = [CAMP.on, T.campTipo(1), T.campDano(z, 50, 'body', 'm1911', p, false), T.campNasce(z, cands), cands.length, (T.campStatus(z), z.ck ?? null, z.cv ?? null), T.campMorte(z, p, 'body', 'm1911') ?? null, T.campZona(z, p), chamou];
    // campanha ligada (só neste teste): os ganchos rodam
    CAMP.on = true;
    try {
      o.on = [T.campTipo(1), T.campDano(z, 50, 'body', 'm1911', p, false), T.campNasce(z, cands), cands.length, (T.campStatus(z), z.ck, z.cv), T.campIA(z, 1 / 60, null), T.campZhitOk(p, {}, z)];
      // zona 'fraco' e teto: só chefe, só com a janela aberta ou por trás (fracoTras)
      const now = window.__simNow, K = ZKIND[6]; K.fracoTras = 110; K.capFraco = .3; K.fracoK = 4;
      const b = { kind: 6, hp: 1000, maxHp: 1000, yaw: 0, body: { pos: { x: 0, y: 0, z: 0 } } }; // yaw 0: frente para -z
      const at = (x, zz) => ({ pos: [x, 0, zz] });
      o.fraco = [T.campZona(b, at(0, -5)), T.campZona(b, at(0, 5)), T.campZona(b, at(5, 0)), (b.fracoAte = now + 1, T.campZona(b, at(0, -5))), T.campZona(z, at(0, 5)), T.campFracoK(b), (delete K.fracoK, T.campFracoK(b))];
      delete K.fracoTras; delete K.capFraco;
    } finally { CAMP.on = false; for (const k in CAMP_G) CAMP_G[k].length = 0; CAMP_IA.length = 0; }
    o.depois = [T.campTipo(1), CAMP_G.tipo.length];
    return o;
  });
  assert.ok(r.ida.every(Boolean), 'tipo com 5 bits não volta igual');
  assert.deepEqual(r.carn, [1, .12, .06, .2, 2.3, 1.4]); assert.deepEqual(r.chefes, [6]);
  assert.deepEqual(r.off, [false, 1, 50, false, 1, null, null, 'body', 0], 'no clássico os ganchos não devolvem na hora');
  assert.deepEqual(r.on, [3, 100, true, 0, 2, true, false]);
  assert.deepEqual(r.fraco, ['body', 'fraco', 'body', 'fraco', 'body', 4, 3]);
  assert.deepEqual(r.depois, [1, 0]);
});
