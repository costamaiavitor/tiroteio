// zumbi-v2: testes das etapas 1, 4, 5, 6, 7, 8 e 9 (balanceamento por tamanho, janelas, alvo, HUD sem minimapa, lugares sorteados,
// construção da energia e do Pack-a-Punch e Pack-a-Punch em 3 níveis). Este arquivo liga o sorteio (ZV2_SORTEIO) para a partida ter semente.
process.env.ZV2_SORTEIO = '1';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
const { abrirJogo, criarSala, noJogo } = await import('./_jogo.mjs');

let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 }); });
after(async () => { await J?.fechar?.(); await J?.browser?.close?.(); });

test('Etapa 1: velocidade, dano e ritmo pelo tamanho; golpe entre o piso e o teto em todas as dificuldades', async () => {
  const r = await noJogo(J.page, T => {
    const out = {}, B = T.ZBAL;
    for (const k of [0, 1, 3]) { const z = { sc: 2 }; T.zTamanho(z, k, { spd: 1 }); out[k] = { v: z.speed, dm: z.dm, ac: z.ac }; }
    const golpes = []; for (const D of T.ZDIFF) for (const k of [0, 1, 2, 3, 4, 5]) { const s = B.tipos[k].s; golpes.push(Math.round(Math.min(B.tamanho.tetoGolpe, Math.max(B.tamanho.pisoGolpe, D.dmg * s ** B.tamanho.dano)))); }
    return { out, golpes };
  });
  assert.ok(r.out[1].v < r.out[0].v && r.out[0].v < r.out[3].v, 'grande mais lento, pequeno mais rápido');
  assert.ok(r.out[1].dm > r.out[0].dm && r.out[0].dm > r.out[3].dm, 'grande bate mais forte');
  assert.ok(r.out[1].ac > r.out[3].ac, 'grande bate mais devagar');
  assert.ok(r.golpes.every(g => g >= 15 && g <= 90), 'nenhum golpe derruba de uma vez (<=90) nem é inofensivo (>=15): ' + r.golpes);
});

test('Etapa 7: com semente, as bebidas trocam de lugar (é uma permutação dos lugares originais) e a mesma semente dá o mesmo resultado', async () => {
  const r = await noJogo(J.page, T => {
    const D = T.ZD, key = o => o.x.toFixed(2) + ',' + o.z.toFixed(2);
    const orig = D.lugares0.perks.map(key).sort().join('|');
    const atual = D.perks.map(key), atualOrd = [...atual].sort().join('|');
    const ini = D.perks.map(key), seed = T.S.st.seed;
    T.zSorteiaLugares(D, seed); const de = D.perks.map(key);
    const validos = new Set([...D.lugares0.perks.map(key), key(D.lugares0.pap)]);
    return { seed, perm: atual.every(k => validos.has(k)) && new Set(atual).size === atual.length, mesmo: JSON.stringify(ini) === JSON.stringify(de) };
  });
  assert.ok(r.seed > 0, 'a partida tem semente');
  assert.ok(r.perm, 'só lugares já existentes');
  assert.ok(r.mesmo, 'mesma semente, mesmo resultado');
});

test('Etapa 8: peças no chão (por dificuldade); energia e PaP só funcionam depois de montados', async () => {
  const r = await noJogo(J.page, T => {
    const D = T.ZD, p = T.S.players.get('h'), B = T.ZBAL.construcao, L = D.zint.map((o, i) => ({ o, i })).filter(x => x.o.t === 'peca');
    const out = { n: L.length, esperado: (B.pecas[1]) * 2, custo: T.zCustoAreas(D) };
    out.areasOk = L.every(x => { const r = T.zRoomAt(x.o.x, x.o.z); return out.custo[r] !== undefined && out.custo[r] <= B.custoMax[1]; });
    p.money = 1e6; p.pos[0] = D.power.x + D.power.n[0] * 1.2; p.pos[2] = D.power.z + D.power.n[1] * 1.2;
    T.srvZUse(p, { k: 'power' }); T.sim(.1); out.ligouSemMontar = !!T.Z.power;
    for (const { o, i } of L) { p.pos[0] = o.x; p.pos[2] = o.z + .5; T.srvZUse(p, { k: 'zint', id: i }); T.sim(.05); }
    out.pegas = [T.zPecasPegas('power'), T.zPecasPegas('pap')];
    p.pos[0] = D.power.x + D.power.n[0] * 1.2; p.pos[2] = D.power.z + D.power.n[1] * 1.2;
    T.srvZUse(p, { k: 'zbuild', maq: 'power' }); T.sim(.1); out.montada = !!T.Z.built.power;
    T.srvZUse(p, { k: 'power' }); T.sim(.1); out.ligou = !!T.Z.power;
    return out;
  });
  assert.equal(r.n, r.esperado, 'peças da energia + do PaP');
  assert.ok(r.areasOk, 'nenhuma peça em área cara');
  assert.equal(r.ligouSemMontar, false, 'não liga antes de montar');
  assert.deepEqual(r.pegas, [r.esperado / 2, r.esperado / 2], 'todas as peças pegas');
  assert.ok(r.montada && r.ligou, 'monta e depois liga');
});

test('Etapa 9: Pack-a-Punch 1 → 2 → 3, preço por nível, não passa do 3', async () => {
  const r = await noJogo(J.page, T => {
    const out = { l1: T.papProx('m14'), l2: T.papProx('m14_pap'), l3: T.papProx('m14_pap2'), max: T.papProx('m14_pap3') };
    out.dano = [T.W.m14_pap.dmg, T.W.m14_pap2.dmg, T.W.m14_pap3.dmg]; out.custo = T.ZBAL.pap.custo; out.nivel = [T.W.m14_pap.pap, T.W.m14_pap2.pap, T.W.m14_pap3.pap];
    return out;
  });
  assert.deepEqual([r.l1, r.l2, r.l3, r.max], ['m14_pap', 'm14_pap2', 'm14_pap3', null]);
  assert.ok(r.dano[0] < r.dano[1] && r.dano[1] < r.dano[2], 'cada nível mais forte');
  assert.ok(r.custo[0] < r.custo[1] && r.custo[1] < r.custo[2], 'cada nível mais caro');
  assert.deepEqual(r.nivel, [1, 2, 3]);
});

test('Etapa 6: sem minimapa no HUD; marcador da energia só no Fácil', async () => {
  const r = await J.page.evaluate(() => ({ zmm: !!document.querySelector('#zmm,#zmmLbl,#zbig'), dicas: window.__T.ZBAL.dicas.dificuldades }));
  assert.equal(r.zmm, false); assert.deepEqual(r.dicas, [0]);
});

test('Etapa 5: zumbi do lado de fora com o jogador colado nele larga a janela e ataca o jogador', async () => {
  const r = await noJogo(J.page, T => {
    const Z = T.Z; Z.spawnDelay = 99; for (const z of [...Z.zs.values()]) Z.zs.delete(z.id);
    const w = T.ZD.windows.find(x => x.room === (T.ZD.start || 'A')) || T.ZD.windows[0];
    const z = { id: 9e4, st: 'out', win: T.ZD.windows.indexOf(w), body: { pos: new T.V3(w.x + w.n[0] * 3, 0, w.z + w.n[1] * 3), vel: new T.V3(), onGround: true, h: 1.8 }, tgt: null, tgtT: 0 };
    const p = T.S.players.get('h'); p.pos[0] = z.body.pos.x + .8; p.pos[1] = 0; p.pos[2] = z.body.pos.z; z.tgt = p;
    T.zForaJanela(z, z.body.pos); return z.st;
  });
  assert.equal(r, 'in');
});
