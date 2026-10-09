// Interativos novos da Frente C (Onda 2, O2-C09): barricadas reparáveis fora das janelas (docs/overhaul/interativos.md §1.7).
// Regras do host conferidas: montadas sem colisor (a grade dos zumbis e a do jogador não mudam: sem softlock); zumbi que passa
// anda a ZINT.barricada.lento e arranca uma tábua por passagem; zumbi chega ao jogador do outro lado com a barricada inteira;
// segurar F conserta uma tábua a cada conserto s, com ptsTabua pontos no teto das janelas; de longe, inteira ou com
// mensagem torta não faz nada; o hold do cliente vai como k:'zint'; quem entra no meio recebe as tábuas (zWorldState().zi).
// Os tipos são achados por t (nunca por índice). Rodar: pnpm test (todos) ou node --test tests/barricadas-zumbi.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); }, { timeout: 120000 });
after(async () => { await J?.fechar(); });

// prepara a cena dentro da página: rodada sem nascer zumbi novo, jogador num ponto, zumbis onde o teste mandar
const PREP = `(T => {
  const p = T.S.players.get('h'), L = T.ZD.zint, bar = L.map((o, i) => i).filter(i => L[i].t === 'barricada');
  const poe = (x, z) => { p.pos = [x, 0, z]; T.me.pos.set(x, 0, z); };
  const segura = () => { T.Z.toSpawn = 50; T.Z.spawnT = 1e12; T.Z.zs.clear(); };
  const zumbi = (x, z) => { const id = T.Z.nextId; T.zSpawnOne(); const zz = T.Z.zs.get(id); if (!zz) throw new Error('zSpawnOne não criou zumbi');
    zz.st = 'in'; zz.body.pos.set(x, 0, z); zz.body.vel.set(0, 0, 0); zz.sc = 0; zz.chkT = 1e12; return zz; };
  const em = (o, a) => [o.x + o.n[0] * a, o.z + o.n[1] * a]; // ponto a a metros ao longo da passagem
  const poeEst = (i, st) => { const E = T.Z.zint[i]; E.st = st; E.t = 0; T.zintMsg({ t: 'zint', i, st, s: 0, sync: 1 }); };
  const abre = o => { let best = null, bd = 1e9; for (const d of T.ZD.doors) { const dd = Math.hypot(d.x - o.x, d.z - o.z); if (dd < bd) { bd = dd; best = d; } }
    if (best && !T.Z.doors.has(best.id)) { const k = p.pos; p.money = 1e6; poe(best.x, best.z); T.srvZUse(p, { k: 'door', id: best.id }); p.pos = k; } return best; };
  return { p, L, bar, poe, segura, zumbi, em, poeEst, abre };
})`;

test('barricada: Vila monta 4, sem colisor (grades dos zumbis e do jogador iguais), inteira no host e no cliente', { timeout: 180000 }, async () => {
  await criarSala(J.page, { mode: 'zombies', map: 'vila', zdiff: 1 });
  const r = await noJogo(J.page, T => {
    if (T.Z.phase !== 'round') T.zStartRound(); T.sim(.2);
    const L = T.ZD.zint, E = T.ZC.world.zint, COL = T.COL(), b = L.map((o, i) => i).filter(i => L[i].t === 'barricada'), D = T.ZINT.barricada;
    // nada alto dentro da faixa da barricada, e a célula do meio continua andável na grade dos zumbis
    const livre = b.every(i => { const o = L[i], hw = o.w / 2 - .25, hd = D.fundo / 2, sx = Math.abs(o.n[0]) > 0;
      const x0 = o.x - (sx ? hd : hw), x1 = o.x + (sx ? hd : hw), z0 = o.z - (sx ? hw : hd), z1 = o.z + (sx ? hw : hd);
      return !COL.some(c => c.maxY > .3 && c.minY < 1.8 && c.maxX > x0 && c.minX < x1 && c.maxZ > z0 && c.minZ < z1); });
    const walk = b.every(i => T.FF.walk[T.ffCell(L[i].x, L[i].z)]);
    const visiveis = b.map(i => { let n = 0; for (let k = 0; k < D.tabuas; k++) if (E[i].im.instanceMatrix.array[k * 16] !== 0) n++; return n; });
    return { n: b.length, srv: b.every(i => T.Z.zint[i].st === 'pronto'), cli: b.every(i => T.ZC.zint[i].st === 'pronto'), semCol: b.every(i => !E[i].col), livre, walk, visiveis, tabuas: D.tabuas };
  });
  assert.equal(r.n, 4); assert.ok(r.srv && r.cli, 'estado inicial não é pronto'); assert.ok(r.semCol, 'barricada com colisor');
  assert.ok(r.livre, 'tem caixa alta dentro da faixa de alguma barricada'); assert.ok(r.walk, 'a célula da barricada não é andável');
  assert.deepEqual(r.visiveis, r.visiveis.map(() => r.tabuas));
});

test('barricada: zumbi passa a lento × a velocidade e arranca uma tábua por passagem (o cliente vê)', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, L, bar, poe, segura, zumbi, em, poeEst, abre } = (new Function('return ' + PREP)())(T), D = T.ZINT.barricada, i = bar[1], o = L[i];
    segura(); abre(o); p.dwEnd = 1e12; poe(...em(o, 12));
    const anda = st => { poeEst(i, st); T.Z.zs.clear(); const z = zumbi(...em(o, -.7)); z.speed = 1; z.hp = z.maxHp = 1e6; const [x0, z0] = [z.body.pos.x, z.body.pos.z];
      T.sim(.5); const d = (z.body.pos.x - x0) * o.n[0] + (z.body.pos.z - z0) * o.n[1]; return { d, st: T.Z.zint[i].st }; };
    const comT = anda('pronto'), semT = anda('0');
    // uma passagem inteira: só uma tábua; o cliente vê a tábua sumir
    poeEst(i, 'pronto'); T.Z.zs.clear(); const z = zumbi(...em(o, -3)); z.speed = 1.5; z.hp = z.maxHp = 1e6;
    T.sim(6); const passou = (z.body.pos.x - o.x) * o.n[0] + (z.body.pos.z - o.z) * o.n[1];
    let vis = 0; for (let k = 0; k < D.tabuas; k++) if (T.ZC.world.zint[i].im.instanceMatrix.array[k * 16] !== 0) vis++;
    return { comT, semT, lento: D.lento, passou, st: T.Z.zint[i].st, cli: T.ZC.zint[i].st, vis, tabuas: D.tabuas };
  }, PREP);
  assert.ok(r.semT.d > .2, `zumbi de controle não andou: ${r.semT.d}`);
  const k = r.comT.d / r.semT.d; assert.ok(Math.abs(k - r.lento) < .1, `razão ${k.toFixed(2)}, esperado ${r.lento}`);
  assert.equal(r.semT.st, '0', 'sem tábua, o estado mudou');
  assert.ok(r.passou > 1, `o zumbi não atravessou a barricada: ${r.passou}`);
  assert.equal(r.st, String(r.tabuas - 1), 'devia arrancar uma tábua só'); assert.equal(r.cli, r.st); assert.equal(r.vis, r.tabuas - 1);
});

test('barricada: sem softlock — zumbi chega ao jogador do outro lado com a barricada inteira; jogador atravessa', { timeout: 90000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, L, bar, poe, segura, zumbi, em, poeEst, abre } = (new Function('return ' + PREP)())(T), res = [];
    for (const i of bar) { const o = L[i]; segura(); abre(o); poeEst(i, 'pronto'); p.dwEnd = 1e12; p.hp = p.maxHp; poe(...em(o, 5));
      const z = zumbi(...em(o, -5)); z.hp = z.maxHp = 1e6; let t = 0, d = 1e9;
      for (; t < 25 && d > 1.6; t += .25) { T.sim(.25); d = Math.hypot(z.body.pos.x - p.pos[0], z.body.pos.z - p.pos[2]); poe(...em(o, 5)); p.hp = 100; p.downed = false; }
      res.push({ i, t, d: Math.round(d * 10) / 10, st: T.Z.zint[i].st }); }
    // o jogador atravessa: anda de um lado ao outro (física de verdade, sem colisor no meio)
    const o = L[bar[0]]; T.Z.zs.clear(); const [ax, az] = em(o, -2.5); T.me.pos.set(ax, 0, az); T.me.vel.set(0, 0, 0); T.me.yaw = Math.atan2(-o.n[0], -o.n[1]); T.me.pitch = 0;
    T.keys.KeyW = true; T.sim(2.5); T.keys.KeyW = false;
    const atravessou = (T.me.pos.x - o.x) * o.n[0] + (T.me.pos.z - o.z) * o.n[1];
    return { res, atravessou };
  }, PREP);
  for (const x of r.res) { assert.ok(x.d <= 1.6, `barricada ${x.i}: o zumbi não chegou ao jogador (${x.d} m em ${x.t} s)`); assert.equal(x.st, '4', 'uma passagem, uma tábua'); }
  assert.ok(r.atravessou > 1, `o jogador não atravessou a barricada: ${r.atravessou}`);
});

test('barricada: segurar F conserta 1 tábua a cada conserto s, com pontos no teto das janelas; longe, inteira e torta não', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, L, bar, poe, segura, em, poeEst } = (new Function('return ' + PREP)())(T), D = T.ZINT.barricada, i = bar[2], o = L[i], barril = L.findIndex(q => q.t === 'barril');
    segura(); T.Z.repPts = new Map(); T.Z.repT = {}; p.money = 0; poeEst(i, '1');
    poe(...em(o, D.srvR + 1)); T.srvZHold(p, { k: 'zint', id: i }); const longe = T.Z.zint[i].st;
    poe(...em(o, 1)); T.zInteract(0); const act = T.ZC.act && { k: T.ZC.act.k, id: T.ZC.act.id, hold: T.ZC.act.hold };
    T.srvZHold(p, { k: 'zint', id: i }); T.srvZHold(p, { k: 'zint', id: i }); const um = T.Z.zint[i].st, m1 = p.money; // a segunda chega cedo demais
    T.sim(D.conserto + .02); T.sendToHost({ t: 'hold', k: 'zint', id: i }); T.sim(.02); const dois = T.Z.zint[i].st, cli = T.ZC.zint[i].st; // pela rede (limitador)
    for (let k = 0; k < 6; k++) { T.sim(D.conserto + .02); T.srvZHold(p, { k: 'zint', id: i }); }
    const cheia = T.Z.zint[i].st, m2 = p.money; T.zInteract(0); const actCheia = T.ZC.act?.k === 'zint' && T.ZC.act?.id === i;
    // teto de pontos (o mesmo das janelas)
    poeEst(i, '0'); T.Z.repPts.set(p.id, D.ptsTeto); T.sim(D.conserto + .02); T.srvZHold(p, { k: 'zint', id: i }); const semPts = p.money - m2, teto = T.Z.zint[i].st;
    // mensagens tortas e tipo sem segura (barril): nada muda
    const antes = T.Z.zint.map(E => E.st).join();
    for (const id of [-1, 1.5, '3', 9999, barril]) { T.sim(D.conserto + .02); T.srvZHold(p, { k: 'zint', id }); }
    T.zintMsg({ t: 'zint', i, st: '7', s: 0 }); T.zintMsg({ t: 'zint', i, st: 'pavio', s: 0 });
    return { longe, act, um, m1, dois, cli, cheia, m2, actCheia, semPts, teto, torta: antes === T.Z.zint.map(E => E.st).join(), cliTorta: T.ZC.zint[i].st, pts: D.ptsTabua, tabuas: D.tabuas };
  }, PREP);
  assert.equal(r.longe, '1', 'consertou de longe');
  assert.deepEqual(r.act, { k: 'zint', id: r.act?.id, hold: 1 }); assert.ok(Number.isInteger(r.act.id));
  assert.equal(r.um, '2', 'devia pôr uma tábua (e só uma antes do tempo)'); assert.equal(r.m1, r.pts);
  assert.equal(r.dois, '3', 'o hold pela rede não consertou'); assert.equal(r.cli, '3', 'o cliente não soube');
  assert.equal(r.cheia, 'pronto'); assert.equal(r.m2, r.pts * (r.tabuas - 1), 'pontos errados (não pode ganhar com a barricada cheia)');
  assert.equal(r.actCheia, false, 'o F oferece consertar a barricada inteira');
  assert.equal(r.teto, '1'); assert.equal(r.semPts, 0, 'passou do teto de pontos por rodada');
  assert.ok(r.torta, 'mensagem torta mudou algum interativo'); assert.equal(r.cliTorta, '1', 'estado inválido aceito no cliente');
});

test('barricada: quem entra no meio recebe as tábuas; Sanatório monta 3', { timeout: 240000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { L, bar, poeEst } = (new Function('return ' + PREP)())(T), i = bar[3], D = T.ZINT.barricada;
    poeEst(i, 'pronto'); const E = T.Z.zint[i]; E.st = '2'; // só no host: o cliente "novo" ainda acha que está inteira
    T.zintSync(T.zWorldState().zi);
    let vis = 0; for (let k = 0; k < D.tabuas; k++) if (T.ZC.world.zint[i].im.instanceMatrix.array[k * 16] !== 0) vis++;
    return { cli: T.ZC.zint[i].st, vis, restos: T.ZC.world.zint[i].restos.visible, n: L.length };
  }, PREP);
  assert.equal(r.cli, '2'); assert.equal(r.vis, 2); assert.equal(r.restos, true);
  const J2 = await abrirJogo();
  try {
    await criarSala(J2.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 });
    const s = await noJogo(J2.page, (T, PREP) => { if (T.Z.phase !== 'round') T.zStartRound(); T.sim(.2);
      const { p, L, bar, poe, segura, zumbi, em, abre } = (new Function('return ' + PREP)())(T), b = bar, ok = b.every(i => T.Z.zint[i].st === 'pronto' && T.ZC.world.zint[i].im && !T.ZC.world.zint[i].col), res = [];
      for (const i of b) { const o = L[i]; segura(); abre(o); p.dwEnd = 1e12; poe(...em(o, 5)); const z = zumbi(...em(o, -5)); z.hp = z.maxHp = 1e6; let t = 0, d = 1e9; // sem softlock aqui também
        for (; t < 25 && d > 1.6; t += .25) { T.sim(.25); d = Math.hypot(z.body.pos.x - p.pos[0], z.body.pos.z - p.pos[2]); poe(...em(o, 5)); p.hp = 100; p.downed = false; }
        res.push({ i, d: Math.round(d * 10) / 10, st: T.Z.zint[i].st }); }
      return { n: b.length, v: b.map(i => L[i].v), ok, res }; }, PREP);
    assert.equal(s.n, 3); assert.ok(s.ok); assert.deepEqual(s.v, ['hospital', 'hospital', 'hospital']);
    for (const x of s.res) { assert.ok(x.d <= 1.6, `Sanatório, barricada ${x.i}: o zumbi não chegou ao jogador (${x.d} m)`); assert.equal(x.st, '4'); }
    assert.deepEqual(J2.erros, []);
  } finally { await J2.fechar(); }
  assert.deepEqual(J.erros, []);
});
