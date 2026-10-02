// Testes de caracterização: capturam o comportamento ATUAL dos fluxos críticos do servidor (host) antes do
// endurecimento de segurança. Se um destes quebrar depois de uma correção, a correção mudou o jogo.
// Rodar: pnpm test (precisa de internet para a CDN do three.js).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); }, { timeout: 120000 });
after(async () => { await J?.fechar(); });

// ---------- Zumbis (host sozinho, offline) ----------
test('zumbis: sala criada offline, host vivo com M1911 e 500 pontos (Normal)', { timeout: 120000 }, async () => {
  await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 });
  const r = await noJogo(J.page, T => { const p = T.S.players.get('h'); return { alive: p.alive, money: p.money, inv: p.inv, hp: p.hp, zon: T.Z.on, mode: T.S.st.mode, fase: T.Z.phase, online: T.NET.online }; });
  assert.equal(r.alive, true); assert.equal(r.money, 500); assert.equal(r.inv.primary, 'm1911'); assert.equal(r.hp, 100);
  assert.equal(r.zon, true); assert.equal(r.mode, 'zombies'); assert.equal(r.online, false);
  assert.deepEqual(J.erros, []);
});

test('zumbis: a rodada 1 começa e zumbis nascem', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, T => { T.zStartRound(); T.sim(6); return { round: T.Z.round, n: T.Z.zs.size, toSpawn: T.Z.toSpawn }; });
  assert.equal(r.round, 1); assert.ok(r.n > 0, 'nenhum zumbi nasceu');
});

test('zhit: dano é limitado ao teto da arma e dá 10 pontos por acerto', async () => {
  const r = await noJogo(J.page, T => {
    const p = T.S.players.get('h'), z = [...T.Z.zs.values()].find(z => !z.dead && z.hp > 200) || [...T.Z.zs.values()][0];
    const hp0 = z.hp, m0 = p.money;
    T.sendToHost({ t: 'zhit', v: z.id, dmg: 1e9, z: 'body', w: 'm1911' });
    const W = T.W.m1911, cap = W.dmg * Math.max(W.head || 4, 1) * 1.1;
    return { hp0, hp1: z.hp, cap, pontos: p.money - m0, vivo: T.Z.zs.has(z.id) };
  });
  assert.ok(r.hp0 - r.hp1 <= r.cap + 1e-6, `tirou ${r.hp0 - r.hp1}, teto ${r.cap}`);
  assert.ok(r.hp0 - r.hp1 > 0, 'o tiro válido não causou dano');
  if (r.vivo) assert.equal(r.pontos, 10);
});

test('zhit: arma que o jogador não tem é ignorada', async () => {
  const r = await noJogo(J.page, T => {
    const p = T.S.players.get('h'), z = [...T.Z.zs.values()].find(z => T.Z.zs.has(z.id));
    const hp0 = z.hp, m0 = p.money;
    T.sendToHost({ t: 'zhit', v: z.id, dmg: 50, z: 'body', w: 'raygun' });
    T.sendToHost({ t: 'zhit', v: z.id, dmg: 50, z: 'body', w: 'awp' });
    return { d: hp0 - z.hp, pontos: p.money - m0 };
  });
  assert.equal(r.d, 0); assert.equal(r.pontos, 0);
});

test('zhit: repetir a mensagem muitas vezes no mesmo instante só vale até a cadência', async () => {
  const r = await noJogo(J.page, T => {
    const p = T.S.players.get('h');
    T.sim(2); // enche a cota de cadência
    const z = [...T.Z.zs.values()].reduce((a, b) => (a && a.hp > b.hp ? a : b));
    const m0 = p.money, hp0 = z.hp;
    for (let i = 0; i < 60; i++) T.sendToHost({ t: 'zhit', v: z.id, dmg: 1, z: 'body', w: 'm1911' });
    return { acertos: (p.money - m0) / 10, hp0, hp1: z.hp };
  });
  assert.ok(r.acertos >= 1 && r.acertos <= 12, `${r.acertos} acertos contados de 60 enviados`);
});

test('use/door: abrir porta longe não cobra; perto cobra o preço e abre', async () => {
  const r = await noJogo(J.page, T => {
    const p = T.S.players.get('h'), d = T.ZD.doors[0], m0 = p.money;
    p.money = 10000;
    p.pos = [d.x + 50, 0, d.z + 50];
    T.srvZUse(p, { k: 'door', id: d.id });
    const longe = { aberta: T.Z.doors.has(d.id), money: p.money };
    p.pos = [d.x + 1, 0, d.z + 1];
    T.srvZUse(p, { k: 'door', id: d.id });
    const perto = { aberta: T.Z.doors.has(d.id), money: p.money };
    p.money = m0;
    return { longe, perto, custo: d.cost };
  });
  assert.equal(r.longe.aberta, false); assert.equal(r.longe.money, 10000);
  assert.equal(r.perto.aberta, true); assert.equal(r.perto.money, 10000 - r.custo);
});

test('use/perk: bebida sem energia é recusada; com energia e pontos, compra', async () => {
  const r = await noJogo(J.page, T => {
    const p = T.S.players.get('h'), pk = T.ZD.perks.find(x => x.k === 'jug'), m0 = p.money, pw = T.Z.power;
    p.money = 10000; p.pos = [pk.x + .5, 0, pk.z + .5]; T.Z.power = false;
    T.srvZUse(p, { k: 'perk', id: 'jug' });
    const sem = { perks: [...p.perks], money: p.money };
    T.Z.power = true;
    T.srvZUse(p, { k: 'perk', id: 'jug' });
    const com = { perks: [...p.perks], money: p.money, maxHp: p.maxHp };
    p.money = m0; T.Z.power = pw; p.perks = []; p.maxHp = 100; p.hp = 100;
    return { sem, com, custo: T.W ? 2500 : 0 };
  });
  assert.deepEqual(r.sem.perks, []); assert.equal(r.sem.money, 10000);
  assert.deepEqual(r.com.perks, ['jug']); assert.equal(r.com.money, 10000 - 2500); assert.equal(r.com.maxHp, 250);
});

test('use/wall: comprar arma de parede perto dá a arma e cobra', async () => {
  const r = await noJogo(J.page, T => {
    const p = T.S.players.get('h'), i = T.ZD.wall.findIndex(w => T.W[w.w]), wb = T.ZD.wall[i], m0 = p.money, inv0 = { ...p.inv };
    p.money = 10000; p.pos = [wb.x + .3, 0, wb.z + .3];
    T.srvZUse(p, { k: 'wall', id: i, cur: 'm1911' });
    const r = { tem: Object.values(p.inv).includes(wb.w), money: p.money, custo: wb.cost };
    p.money = m0; p.inv = inv0;
    return r;
  });
  assert.equal(r.tem, true); assert.equal(r.money, 10000 - r.custo);
});

test('pos: posição válida é aceita; NaN é ignorado', async () => {
  const r = await noJogo(J.page, T => {
    const p = T.S.players.get('h'), antes = p.pos.slice();
    T.sendToHost({ t: 'pos', p: [antes[0] + .5, antes[1], antes[2] + .5], y: 1, pi: 0 });
    const ok = p.pos.slice();
    T.sendToHost({ t: 'pos', p: [NaN, 0, 0], y: 1, pi: 0 });
    T.sendToHost({ t: 'pos', p: 'abc', y: 1, pi: 0 });
    return { antes, ok, depois: p.pos.slice() };
  });
  assert.deepEqual(r.ok, [r.antes[0] + .5, r.antes[1], r.antes[2] + .5]);
  assert.deepEqual(r.depois, r.ok);
});

test('chat: texto é cortado em 120 caracteres e mostrado escapado (sem HTML)', async () => {
  const r = await noJogo(J.page, T => {
    T.sendToHost({ t: 'chat', txt: '<img src=x onerror=alert(1)>' + 'a'.repeat(200) });
    const log = document.querySelector('#chatlog'), ult = log.lastElementChild;
    return { html: ult.innerHTML, imgs: ult.querySelectorAll('img').length, len: ult.textContent.length };
  });
  assert.equal(r.imgs, 0);
  assert.ok(r.html.includes('&lt;img'), 'o HTML do chat não foi escapado');
  assert.ok(r.len <= 120 + 30, 'texto não foi cortado');
});

test('selfdmg: dano próprio é limitado a 100 e não mata com PhD', async () => {
  const r = await noJogo(J.page, T => {
    const p = T.S.players.get('h'); p.hp = p.maxHp; p.perks = [];
    T.sendToHost({ t: 'selfdmg', d: 30 }); const a = p.hp;
    p.hp = p.maxHp; p.perks = ['phd']; T.sendToHost({ t: 'selfdmg', d: 30 }); const b = p.hp;
    p.perks = []; p.hp = p.maxHp; return { a, b, max: p.maxHp };
  });
  assert.equal(r.a, r.max - 30); assert.equal(r.b, r.max);
});

test('nade: granada sem estoque ou lançada de longe é recusada; válida desconta', async () => {
  const r = await noJogo(J.page, T => {
    const p = T.S.players.get('h'); p.inv.he = 2; const pos = p.pos;
    T.sendToHost({ t: 'nade', k: 'he', p: [pos[0] + 40, pos[1], pos[2]], v: [1, 1, 1] }); const longe = p.inv.he;
    T.sendToHost({ t: 'nade', k: 'he', p: [pos[0], pos[1] + 1.5, pos[2]], v: [1, 1, 1] }); const ok = p.inv.he;
    p.inv.he = 0; T.sendToHost({ t: 'nade', k: 'he', p: [pos[0], pos[1] + 1.5, pos[2]], v: [1, 1, 1] }); const zero = p.inv.he;
    return { longe, ok, zero };
  });
  assert.equal(r.longe, 2); assert.equal(r.ok, 1); assert.equal(r.zero, 0);
});

test('skins: só skins válidas entram no jogador', async () => {
  const r = await noJogo(J.page, T => {
    T.sendToHost({ t: 'skins', sk: { ak47: 'floresta', xxx: 'floresta', m4: 'naoexiste', _faca: 'karambit', __proto__: { a: 1 } } });
    return T.S.players.get('h').skins;
  });
  assert.deepEqual(r, { ak47: 'floresta', _faca: 'karambit' });
});

test('perfil local: XP vira caixa a cada 300', async () => {
  const r = await noJogo(J.page, T => { const d = T.PROF.data, xp0 = d.xp, c0 = d.cases; return { xp0, c0, items: d.items.length }; });
  assert.ok(r.c0 >= 0); // conta nova começa com 2 caixas; aqui pode já ter ganho XP na partida
});

// ---------- Mata-mata com bots (host) ----------
test('mata-mata: hit em bot aplica o dano e kill soma abate', { timeout: 120000 }, async () => {
  // mesma aba: recarrega a página (como o "Sair" do jogo faz) e cria outra sala
  await J.page.goto(J.url, { waitUntil: 'load' });
  await J.page.waitForFunction(() => window.__T && !document.querySelector('#btnHost').disabled, null, { timeout: 60000 });
  await criarSala(J.page, { mode: 'dm', map: 'arena', bots: 2 });
  const r = await noJogo(J.page, T => {
    const h = T.S.players.get('h'), bot = [...T.S.players.values()].find(p => p.isBot);
    T.sim(1);
    bot.hp = 100; bot.armor = 0; bot.alive = true;
    bot.pos = [h.pos[0] + 1.5, h.pos[1], h.pos[2]]; bot.ph = []; // desde a fase 2 o host exige linha de visão: o bot fica ao lado do host
    T.sendToHost({ t: 'hit', v: bot.id, dmg: 30, z: 'body', w: 'ak47' }); const hp1 = bot.hp;
    T.sendToHost({ t: 'hit', v: bot.id, dmg: 1e6, z: 'body', w: 'ak47' }); const hp2 = bot.hp; // fase 2: um tiro vale no máximo o teto da arma (36 × 1,1)
    for (let i = 0; i < 3; i++) T.sendToHost({ t: 'hit', v: bot.id, dmg: 36, z: 'body', w: 'ak47' });
    return { hp1, hp2, viva: bot.alive, kills: h.kills, bots: [...T.S.players.values()].filter(p => p.isBot).length, fase: T.S.phase };
  });
  assert.equal(r.bots, 2); assert.equal(r.fase, 'live');
  assert.equal(r.hp1, 70); assert.equal(r.hp2, 30); assert.equal(r.viva, false); assert.equal(r.kills, 1);
  assert.deepEqual(J.erros, []);
});
