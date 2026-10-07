// Testes de caracterização do overhaul (Fase 0): os fluxos críticos do modo zumbi que o caracterizacao.test.mjs não cobre.
// Capturam o comportamento ATUAL: matar zumbi, pegar power-up, passar de rodada, aparecer o chefe (Carniceiro) e morrer.
// Rodar: pnpm test (todos) ou node --test tests/fluxos-zumbi.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); }, { timeout: 120000 });
after(async () => { await J?.fechar(); });

test('zumbis: sala no Sanatório e a rodada 1 começa', { timeout: 180000 }, async () => {
  await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 });
  const r = await noJogo(J.page, T => { if (T.Z.phase !== 'round') T.zStartRound(); T.S.players.get('h').dwEnd = 1e12; T.sim(6); return { round: T.Z.round, n: T.Z.zs.size }; });
  assert.ok(r.round >= 1); assert.ok(r.n > 0, 'nenhum zumbi nasceu');
});

test('matar zumbi: some do servidor e dá pontos ao jogador', async () => {
  const r = await noJogo(J.page, T => {
    const p = T.S.players.get('h'), z = [...T.Z.zs.values()][0], m0 = p.money, k0 = p.kills ?? 0;
    T.zKill(z, p, 'body', 'm1911');
    return { vivo: T.Z.zs.has(z.id), pontos: p.money - m0, kills: (p.kills ?? 0) - k0 };
  });
  assert.equal(r.vivo, false); assert.ok(r.pontos > 0, 'abate sem pontos');
});

test('power-up: Bônus no chão perto do jogador é coletado e dá +500', async () => {
  const r = await noJogo(J.page, T => {
    const p = T.S.players.get('h'), m0 = p.money, n0 = T.Z.drops.length;
    T.zDrop('bonus', p.pos[0] + .5, p.pos[2], true); const criado = T.Z.drops.length === n0 + 1;
    T.sim(.2);
    return { criado, sobrou: T.Z.drops.some(d => d.type === 'bonus'), ganho: p.money - m0 };
  });
  assert.ok(r.criado); assert.equal(r.sobrou, false, 'o power-up não foi coletado'); assert.ok(r.ganho >= 500, `ganhou ${r.ganho}`);
});

test('power-up: Munição Máxima repõe as granadas', async () => {
  const r = await noJogo(J.page, T => {
    const p = T.S.players.get('h'); p.inv.he = 0;
    T.zDrop('max', p.pos[0] + .5, p.pos[2], true); T.sim(.2);
    return { he: p.inv.he };
  });
  assert.equal(r.he, 4);
});

test('rodada: sem zumbis vivos nem por nascer, vai para o intervalo e a próxima rodada começa', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, T => {
    const r0 = T.Z.round; T.Z.toSpawn = 0; T.Z.zs.clear(); T.sim(1);
    const fase1 = T.Z.phase; T.sim(12);
    return { r0, fase1, r1: T.Z.round, fase2: T.Z.phase };
  });
  assert.equal(r.fase1, 'break'); assert.equal(r.r1, r.r0 + 1); assert.equal(r.fase2, 'round');
});

test('chefe: na rodada do Carniceiro ele entra na fila e nasce', { timeout: 120000 }, async () => {
  const r = await noJogo(J.page, T => {
    T.Z.nextBoss = T.Z.round + 1; T.Z.toSpawn = 0; T.Z.zs.clear(); T.sim(12); // fecha a rodada atual e começa a do chefe
    const fila = T.Z.bossQ; let viu = false;
    for (let i = 0; i < 120 && !viu; i++) { T.sim(1); for (const z of T.Z.zs.values()) if (z.kind === 6) viu = true; }
    return { fila, viu, round: T.Z.round };
  });
  assert.equal(r.fila, 1, 'o chefe não entrou na fila'); assert.ok(r.viu, 'o Carniceiro não nasceu');
});

test('morrer: dano letal derruba o jogador e, sozinho sem Quick Revive, a partida acaba', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, T => {
    const p = T.S.players.get('h'); p.dwEnd = 0; p.perks = []; T.zHurt(p, 1e6, null);
    const caiu = p.downed; T.sim(1);
    return { caiu, fase: T.Z.phase };
  });
  assert.equal(r.caiu, true); assert.equal(r.fase, 'over');
  assert.deepEqual(J.erros, []);
});
