// Interativos novos da Frente C (Onda 2, O2-C06): armadilha de fogo (Vila) e armadilhas elétricas novas (Vila e Sanatório).
// Regras do host conferidas: F longe não faz nada; sem pontos não acende; com pontos acende (cobra ZINT.fogo.custo) e o
// cliente sabe; zumbi na faixa morre (sem pontos), o de fora não; quem saiu da faixa ainda queima ZINT.fogo.queima s e anda
// mais devagar; o Carniceiro perde só uma fração; o jogador na faixa leva dano mesmo com PhD; apaga depois de dura s, recusa F
// na recarga e volta a pronto; quem entra no meio recebe o estado (zWorldState().zi). Elétricas novas: montadas, cobram o
// custo opcional da entrada (t.cost ?? ZTRAP.cost), matam na área e não fora.
// Rodar: pnpm test (todos) ou node --test tests/interativos-fogo.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); }, { timeout: 120000 });
after(async () => { await J?.fechar(); });

// prepara a cena dentro da página: rodada sem nascer zumbi novo, jogador num ponto, zumbis parados onde o teste mandar
const PREP = `(T => {
  const p = T.S.players.get('h'), L = T.ZD.zint, fogos = L.map((o, i) => i).filter(i => L[i].t === 'fogo');
  const poe = (x, z) => { p.pos = [x, 0, z]; T.me.pos.set(x, 0, z); };
  const segura = () => { T.Z.toSpawn = 50; T.Z.spawnT = 1e12; T.Z.zs.clear(); };
  const zumbi = (x, z) => { const id = T.Z.nextId; T.zSpawnOne(); const zz = T.Z.zs.get(id); if (!zz) throw new Error('zSpawnOne não criou zumbi');
    zz.st = 'in'; zz.body.pos.set(x, 0, z); zz.speed = 0; zz.sc = 0; return zz; };
  const uso = o => [o.x + o.n[0] * 1.2, o.z + o.n[1] * 1.2]; // onde o jogador fica para usar (fora da faixa)
  const zera = i => { const E = T.Z.zint[i]; E.st = 'pronto'; E.t = 0; T.zintMsg({ t: 'zint', i, st: 'pronto', s: 0 }); };
  return { p, L, fogos, poe, segura, zumbi, uso, zera };
})`;

test('fogo: sala na Vila monta as 3 armadilhas de fogo (tanque no COL, faixa sem colisor) e a elétrica nova', { timeout: 180000 }, async () => {
  await criarSala(J.page, { mode: 'zombies', map: 'vila', zdiff: 1 });
  const r = await noJogo(J.page, T => {
    if (T.Z.phase !== 'round') T.zStartRound(); T.sim(.2);
    const L = T.ZD.zint, E = T.ZC.world.zint, COL = T.COL(), f = L.map((o, i) => i).filter(i => L[i].t === 'fogo');
    const semColNaFaixa = f.every(i => { const [ax, az, aw, ad] = L[i].a; return !COL.some(b => b !== COL[0] && b.maxY > .3 && b.minY < 1.8 && b.maxX > ax - aw / 2 + .1 && b.minX < ax + aw / 2 - .1 && b.maxZ > az - ad / 2 + .1 && b.minZ < az + ad / 2 - .1); });
    return { n: f.length, srv: f.every(i => T.Z.zint[i].st === 'pronto'), cli: f.every(i => T.ZC.zint[i].st === 'pronto'), col: f.every(i => COL.includes(E[i].col)),
      chamas: f.every(i => !E[i].chamas.visible), semColNaFaixa, traps: T.ZD.traps.length, trapsSrv: T.Z.traps.length, trapsCli: T.ZC.traps.length, wd: T.ZC.world.traps.length };
  });
  assert.equal(r.n, 3); assert.ok(r.srv && r.cli, 'estado inicial não é pronto'); assert.ok(r.col, 'tanque fora do COL'); assert.ok(r.chamas, 'chamas acesas sem uso');
  assert.ok(r.semColNaFaixa, 'tem caixa alta dentro de alguma faixa de fogo');
  assert.equal(r.traps, 2, 'a Vila devia ter 2 armadilhas elétricas'); assert.equal(r.trapsSrv, 2); assert.equal(r.trapsCli, 2); assert.equal(r.wd, 2);
});

test('fogo: F longe e sem pontos não acende; com pontos acende, cobra o preço e o cliente sabe', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, L, fogos, poe, segura, uso } = (new Function('return ' + PREP)())(T), D = T.ZINT.fogo, i = fogos[0], o = L[i];
    segura(); const sp = T.ZD.spawns[0]; poe(sp[0], sp[1]); p.money = 5000; T.srvZUse(p, { k: 'zint', id: i }); const longe = T.Z.zint[i].st;
    poe(...uso(o)); p.money = D.custo - 1; T.srvZUse(p, { k: 'zint', id: i }); const pobre = T.Z.zint[i].st, m1 = p.money;
    p.money = 5000; T.srvZUse(p, { k: 'zint', id: i });
    return { longe, pobre, m1, custo: D.custo, aceso: T.Z.zint[i].st, cli: T.ZC.zint[i].st, gasto: 5000 - p.money, chamas: T.ZC.world.zint[i].chamas.visible };
  }, PREP);
  assert.equal(r.longe, 'pronto', 'F de longe acendeu'); assert.equal(r.pobre, 'pronto', 'acendeu sem pontos'); assert.equal(r.m1, r.custo - 1);
  assert.equal(r.aceso, 'aceso'); assert.equal(r.cli, 'aceso', 'cliente não soube'); assert.equal(r.gasto, r.custo); assert.equal(r.chamas, true);
});

test('fogo: mata o zumbi na faixa (pontos para quem acendeu) na rodada 10 em ~1 s; o de fora vive; quem saiu queima e anda mais devagar', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, L, fogos, poe, segura, zumbi, uso, zera } = (new Function('return ' + PREP)())(T), D = T.ZINT.fogo, i = fogos[1], o = L[i], [ax, az, aw, ad] = o.a;
    segura(); zera(i); T.Z.round = 10; p.money = 5000; p.dwEnd = 1e12; poe(...uso(o)); T.srvZUse(p, { k: 'zint', id: i }); const m0 = p.money;
    const dentro = zumbi(ax, az), fora = zumbi(ax + aw / 2 + 3.5, az + ad / 2 + 3.5); const hp0 = dentro.hp;
    T.sim(.5); const meio = T.Z.zs.has(dentro.id) ? dentro.hp / hp0 : 0;
    T.sim(D.mataS * .7);
    // queimando fora da faixa: dano e lentidão por queima s
    const saiu = zumbi(ax, az); saiu.hp = saiu.maxHp = 1e6; T.sim(.1); saiu.body.pos.set(ax + aw / 2 + 2, 0, az);
    const resta = saiu.fogoT - window.__simNow; T.sim(.5); const h1 = saiu.hp; T.sim(D.queima); const h2 = saiu.hp; T.sim(.5);
    return { meio, morreu: !T.Z.zs.has(dentro.id), foraVivo: T.Z.zs.has(fora.id), pontos: p.money - m0, semTiro: T.ZBAL.pontos.semTiro, resta, queima: D.queima, h1, h2, h3: saiu.hp };
  }, PREP);
  assert.ok(r.meio > .2 && r.meio < .8, `em 0,5 s devia estar no meio da vida: ${r.meio}`); assert.equal(r.morreu, true, 'zumbi na faixa não morreu');
  assert.equal(r.foraVivo, true, 'zumbi fora da faixa morreu'); assert.equal(r.pontos, r.semTiro, 'abate do fogo: pontos para quem acendeu (decisão do dono, 13/10)');
  assert.ok(Math.abs(r.resta - r.queima) < .05, `queima depois de sair: ${r.resta}`);
  assert.ok(r.h1 < 1e6, 'quem saiu da faixa não continuou queimando'); assert.ok(r.h2 < r.h1, 'parou de queimar cedo'); assert.equal(r.h3, r.h2, 'queimou além de queima s');
});

test('fogo: lentidão — zumbi queimando anda a ZINT.fogo.lento da velocidade (mesmo caminho, lado a lado)', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, poe, segura, zumbi } = (new Function('return ' + PREP)())(T), D = T.ZINT.fogo;
    segura(); p.dwEnd = 1e12; const sp = T.ZD.spawns[0]; poe(sp[0], sp[1]);
    const a = zumbi(sp[0] - 6, sp[1]), b = zumbi(sp[0] + 6, sp[1]); for (const z of [a, b]) { z.speed = 2; z.hp = z.maxHp = 1e6; }
    const xa = a.body.pos.x, xb = b.body.pos.x;
    for (let k = 0; k < 60; k++) { b.fogoT = 1e12; b.fogoI = -1; T.sim(1 / 30); } // b queimando o tempo todo (fogoI -1: nenhuma faixa tira vida)
    return { da: Math.abs(a.body.pos.x - xa), db: Math.abs(b.body.pos.x - xb), lento: D.lento };
  }, PREP);
  assert.ok(r.da > .5, `o zumbi de controle não andou: ${r.da}`);
  const k = r.db / r.da; assert.ok(Math.abs(k - r.lento) < .12, `razão ${k.toFixed(2)}, esperado ${r.lento}`);
});

test('fogo: Carniceiro perde só dpsBoss por segundo; jogador na faixa leva dano mesmo com PhD; fora, não', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, L, fogos, poe, segura, zumbi, zera } = (new Function('return ' + PREP)())(T), D = T.ZINT.fogo, i = fogos[2], o = L[i], [ax, az] = o.a;
    segura(); zera(i); p.money = 5000; p.dwEnd = 0; p.perks = ['phd']; p.maxHp = 100; p.hp = 100;
    poe(o.x + o.n[0] * 1.2, o.z + o.n[1] * 1.2); T.srvZUse(p, { k: 'zint', id: i }); T.sim(.6); const fora = 100 - p.hp;
    const [, , aw, ad] = o.a, boss = zumbi(ax - aw / 2 + .4, az - ad / 2 + .4); boss.kind = 6; boss.hp = boss.maxHp = 10000; // longe do jogador (não bate nele)
    p.hp = 100; poe(ax + aw / 2 - .4, az + ad / 2 - .4); T.sim(1); const dentro = 100 - p.hp;
    return { fora, dentro, boss: 1 - boss.hp / 10000, esp: D.dpsBoss, jog: D.jogDps, vivo: T.Z.zs.has(boss.id) };
  }, PREP);
  assert.equal(r.fora, 0, 'jogador fora da faixa levou dano');
  assert.ok(r.dentro >= r.jog * .9 && r.dentro <= r.jog * 1.7, `dano no jogador em 1 s: ${r.dentro}`);
  assert.ok(r.vivo, 'Carniceiro morreu no fogo'); assert.ok(Math.abs(r.boss - r.esp) < r.esp * .35, `Carniceiro perdeu ${r.boss}, esperado ~${r.esp}`);
});

test('fogo: apaga depois de dura s, recusa F na recarga, não queima apagada e volta a pronto; quem entra no meio recebe o estado', { timeout: 120000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, L, fogos, poe, segura, zumbi, uso, zera } = (new Function('return ' + PREP)())(T), D = T.ZINT.fogo, i = fogos[0], o = L[i], [ax, az] = o.a, E = T.ZC.world.zint[i];
    segura(); zera(i); p.money = 5000; p.dwEnd = 1e12; poe(...uso(o)); T.srvZUse(p, { k: 'zint', id: i });
    T.sim(D.dura * .5);
    // cliente "novo": só o estado do host
    T.ZC.zint[i].st = 'pronto'; E.chamas.visible = false; T.zintSync(T.zWorldState().zi); const sync = { st: T.ZC.zint[i].st, chamas: E.chamas.visible, fim: Math.round(T.ZC.zint[i].end - (window.__simNow ?? 0)) };
    T.sim(D.dura * .5 + .2); const rec = T.Z.zint[i].st, cliRec = T.ZC.zint[i].st, apagou = !E.chamas.visible;
    T.sim(D.queima + .3); const z = zumbi(ax, az), hp0 = z.hp; const m0 = p.money; T.srvZUse(p, { k: 'zint', id: i }); const recusa = T.Z.zint[i].st, m1 = p.money;
    T.sim(1); const frio = z.hp === hp0;
    T.sim(D.recarga); return { sync, rec, cliRec, apagou, recusa, cobrou: m0 - m1, frio, volta: T.Z.zint[i].st, cliVolta: T.ZC.zint[i].st, metade: Math.round(D.dura * .5) };
  }, PREP);
  assert.equal(r.sync.st, 'aceso'); assert.equal(r.sync.chamas, true, 'quem entrou no meio não vê o fogo'); assert.ok(Math.abs(r.sync.fim - r.metade) <= 1, `fim do fogo no cliente: ${r.sync.fim}`);
  assert.equal(r.rec, 'recarga'); assert.equal(r.cliRec, 'recarga'); assert.ok(r.apagou, 'as chamas não apagaram');
  assert.equal(r.recusa, 'recarga'); assert.equal(r.cobrou, 0, 'cobrou na recarga'); assert.ok(r.frio, 'apagada e queimou');
  assert.equal(r.volta, 'pronto'); assert.equal(r.cliVolta, 'pronto');
});

test('elétrica nova (Vila): cobra o custo opcional da entrada, mata na área e não fora', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, poe, segura, zumbi } = (new Function('return ' + PREP)())(T), i = T.ZD.traps.length - 1, t = T.ZD.traps[i];
    segura(); T.Z.power = true; T.ZC.power = true; p.dwEnd = 1e12; p.money = 5000; t.cost = 400; // custo opcional (só neste teste)
    poe(t.sx + t.n[0] * 1, t.sz + t.n[1] * 1); T.zInteract(0); const txt = T.ZC.act?.txt || '';
    T.srvZUse(p, { k: 'trap', id: i }); const gasto = 5000 - p.money; delete t.cost;
    const dentro = zumbi(t.x, t.z), fora = zumbi(t.x + t.w / 2 + 3, t.z + t.d / 2 + 3); T.sim(.3);
    return { txt, gasto, st: T.Z.traps[i].st, dentro: T.Z.zs.has(dentro.id), fora: T.Z.zs.has(fora.id) };
  }, PREP);
  assert.match(r.txt, /\[400\]/, `texto do F sem o custo da entrada: ${r.txt}`); assert.equal(r.gasto, 400); assert.equal(r.st, 'on');
  assert.equal(r.dentro, false, 'zumbi na área sobreviveu'); assert.equal(r.fora, true, 'zumbi fora da área morreu');
  assert.deepEqual(J.erros, []);
});

test('elétricas novas (Sanatório): 4 armadilhas montadas; cada nova liga com o custo padrão e mata na área', { timeout: 240000 }, async () => {
  const J2 = await abrirJogo();
  try {
    await criarSala(J2.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 });
    const r = await noJogo(J2.page, (T, PREP) => {
      if (T.Z.phase !== 'round') T.zStartRound(); T.sim(.2);
      const { p, poe, segura, zumbi } = (new Function('return ' + PREP)())(T); segura(); T.Z.power = true; T.ZC.power = true; p.dwEnd = 1e12;
      (T.ZD.zint || []).forEach((o, k) => { if (o.t === 'interruptor') { p.money = 5000; poe(o.x + o.n[0], o.z + o.n[1]); T.srvZUse(p, { k: 'zint', id: k }); } }); // O2-C08: as novas dependem do interruptor da ala
      const res = [];
      for (let i = 1; i < T.ZD.traps.length; i++) { const t = T.ZD.traps[i]; p.money = 5000; poe(t.sx + t.n[0], t.sz + t.n[1]); T.srvZUse(p, { k: 'trap', id: i });
        const gasto = 5000 - p.money, z = zumbi(t.x, t.z); T.sim(.3); res.push({ i, gasto, st: T.Z.traps[i].st, morto: !T.Z.zs.has(z.id) }); T.Z.zs.clear(); } // gasto antes do abate (o abate dá pontos a quem ligou)
      return { n: T.ZD.traps.length, wd: T.ZC.world.traps.length, res, custo: T.ZTRAP.cost };
    }, PREP);
    assert.equal(r.n, 4); assert.equal(r.wd, 4);
    for (const x of r.res) { assert.equal(x.gasto, r.custo, `armadilha ${x.i} cobrou ${x.gasto}`); assert.equal(x.st, 'on'); assert.equal(x.morto, true, `armadilha ${x.i} não matou`); }
    assert.deepEqual(J2.erros, []);
  } finally { await J2.fechar(); }
});
