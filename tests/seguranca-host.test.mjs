// Testes de segurança do host (fase 2): provam que as falhas corrigidas ficaram fechadas e que o jogo honesto
// continua igual. Cada bloco cita o achado do relatório (docs/seguranca/relatorio_auditoria.md).
// Atenção: os bots andam e atiram durante T.sim(); por isso o bot é reposicionado (vivo, ao lado do host) depois
// de cada sim e antes de cada tiro, e o host é mantido vivo.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); }, { timeout: 120000 });
after(async () => { await J?.fechar(); });

// Instala na página: prep(seg) = avança seg, mantém o host vivo, põe o bot ao lado do host num ponto com linha de visão
const instalar = () => J.page.evaluate(() => {
  const T = window.__T;
  window.__prep = (seg = 0) => {
    if (seg) T.sim(seg);
    const h = T.S.players.get('h'), bot = [...T.S.players.values()].find(p => p.isBot);
    h.alive = true; h.hp = 100; T.me.alive = true; h.pos = [T.me.pos.x, T.me.pos.y, T.me.pos.z]; h.pb = null; h.ph = []; h.anom = null; h.hb = null;
    const V3 = T.camera.position.constructor, eye = new V3(h.pos[0], h.pos[1] + 1.62, h.pos[2]);
    for (const [dx, dz] of [[1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5], [2.5, 0], [-2.5, 0], [0, 2.5], [0, -2.5]]) {
      const c = new V3(h.pos[0] + dx, h.pos[1] + 1.15, h.pos[2] + dz), d = c.clone().sub(eye), dist = d.length(); d.divideScalar(dist);
      if (T.trace(eye, d, dist, null).t >= dist - .05) { bot.pos = [h.pos[0] + dx, h.pos[1], h.pos[2] + dz]; bot.hp = 100; bot.armor = 0; bot.alive = true; bot.ph = []; return { h, bot }; }
    }
    throw new Error('sem lugar com visão ao lado do host');
  };
});

test('mata-mata: sala com 2 bots', { timeout: 120000 }, async () => {
  await criarSala(J.page, { mode: 'dm', map: 'arena', bots: 2 });
  await instalar();
});

test('V01 hit: acerto honesto (arma do inventário, perto, com visão) continua valendo', async () => {
  const r = await noJogo(J.page, T => { const { h, bot } = __prep(.5); T.sendToHost({ t: 'hit', v: bot.id, dmg: 30, z: 'body', w: 'ak47' }); return { hp: bot.hp, anom: h.anom?.n || 0 }; });
  assert.equal(r.hp, 70); assert.equal(r.anom, 0);
});

test('V01 hit: dano acima do teto da arma é preso ao teto (ak47 corpo = 36 × 1,1)', async () => {
  const r = await noJogo(J.page, T => { const { bot } = __prep(.5); T.sendToHost({ t: 'hit', v: bot.id, dmg: 500, z: 'body', w: 'ak47' }); return bot.hp; });
  assert.equal(r, 60);
});

test('V01 hit: arma que o jogador não tem é recusada e conta anomalia', async () => {
  const r = await noJogo(J.page, T => { const { h, bot } = __prep(.5); T.sendToHost({ t: 'hit', v: bot.id, dmg: 100, z: 'head', w: 'awp' }); return { hp: bot.hp, by: h.anom?.by }; });
  assert.equal(r.hp, 100); assert.equal(r.by?.['hit:arma'], 1);
});

test('V01 hit: sem linha de visão (vítima embaixo do chão) é recusado', async () => {
  const r = await noJogo(J.page, T => { const { h, bot } = __prep(.5); bot.pos = [h.pos[0], h.pos[1] - 50, h.pos[2]]; T.sendToHost({ t: 'hit', v: bot.id, dmg: 30, z: 'body', w: 'ak47' }); return { hp: bot.hp, by: h.anom?.by }; });
  assert.equal(r.hp, 100); assert.equal(r.by?.['hit:visao'], 1);
});

test('V01 hit: repetir 60 vezes no mesmo instante só vale até a cadência da arma', async () => {
  const r = await noJogo(J.page, T => { const { bot } = __prep(2); for (let i = 0; i < 60; i++) T.sendToHost({ t: 'hit', v: bot.id, dmg: 1, z: 'body', w: 'ak47' }); return bot.hp; });
  assert.ok(r >= 80 && r <= 95, `hp ${r}: aceitou ${100 - r} de 60`);
});

test('V01 hit: fora da rodada (fase over) é recusado', async () => {
  const r = await noJogo(J.page, T => { const { bot } = __prep(.5); const f = T.S.phase; T.S.phase = 'over'; T.sendToHost({ t: 'hit', v: bot.id, dmg: 30, z: 'body', w: 'ak47' }); T.S.phase = f; return bot.hp; });
  assert.equal(r, 100);
});

test('V02 pos: andar normal (o próprio cliente do host a 30 Hz) é aceito sem anomalia', async () => {
  const r = await noJogo(J.page, T => { const { h } = __prep(.1); h.anom = null; const x0 = T.me.pos.x; for (let i = 1; i <= 30; i++) { T.me.pos.x = x0 + .2 * i; T.sim(1 / 30); } return { d: h.pos[0] - x0, anom: h.anom?.n || 0 }; });
  assert.ok(r.d > 5 && r.d <= 6.5, `andou ${r.d}`); assert.equal(r.anom, 0);
});

test('V02 pos: teleporte de 50 m numa mensagem é ignorado e conta anomalia', async () => {
  const r = await noJogo(J.page, T => { const { h } = __prep(.1); h.anom = null; const p0 = h.pos.slice(); T.sendToHost({ t: 'pos', p: [p0[0] + 50, p0[1], p0[2]], y: 0, pi: 0 }); return { igual: h.pos[0] === p0[0], by: h.anom?.by }; });
  assert.equal(r.igual, true); assert.equal(r.by?.['pos:veloc'], 1);
});

test('V02 pos: voar (subir 30 m) é ignorado; pular (1,2 m) é aceito', async () => {
  const r = await noJogo(J.page, T => { const { h } = __prep(.1); h.anom = null; const p0 = h.pos.slice(); T.sendToHost({ t: 'pos', p: [p0[0], p0[1] + 30, p0[2]], y: 0, pi: 0 }); const voo = h.pos[1]; T.sendToHost({ t: 'pos', p: [p0[0], p0[1] + 1.2, p0[2]], y: 0, pi: 0 }); const pulo = h.pos[1]; return { p0y: p0[1], voo, pulo, by: h.anom?.by }; });
  assert.equal(r.voo, r.p0y); assert.ok(Math.abs(r.pulo - (r.p0y + 1.2)) < 1e-6); assert.equal(r.by?.['pos:sobe'], 1);
});

test('V02 pos: depois de um soluço longo da rede, o deslocamento acumulado plausível é aceito', async () => {
  const r = await noJogo(J.page, T => { const { h } = __prep(.1); h.anom = null; const p0 = h.pos.slice(); h.posAt -= 5; T.sendToHost({ t: 'pos', p: [p0[0] + 30, p0[1], p0[2]], y: 0, pi: 0 }); return { d: h.pos[0] - p0[0], anom: h.anom?.n || 0 }; }); // 30 m em 5 s = 6 m/s
  assert.ok(Math.abs(r.d - 30) < 1e-6); assert.equal(r.anom, 0);
});

test('V02 pos: ts inválido (Infinity) não trava as posições seguintes', async () => {
  const r = await noJogo(J.page, T => { const { h } = __prep(.1); const p0 = h.pos.slice(); T.sendToHost({ t: 'pos', p: [p0[0] + .1, p0[1], p0[2]], y: 0, pi: 0, ts: Infinity }); T.sendToHost({ t: 'pos', p: [p0[0] + .2, p0[1], p0[2]], y: 0, pi: 0, ts: 1 }); return h.pos[0] - p0[0]; });
  assert.ok(Math.abs(r - .2) < 1e-6);
});

test('V17 anomalias: com 5 mensagens fora do esperado o host recebe um aviso com o nome', async () => {
  const r = await noJogo(J.page, T => { const { h } = __prep(.1); h.anom = null; const p0 = h.pos.slice(); for (let i = 0; i < 6; i++) T.sendToHost({ t: 'pos', p: [p0[0] + 50, p0[1], p0[2]], y: 0, pi: 0 }); return { n: h.anom.n, toast: document.querySelector('#toast').textContent }; });
  assert.ok(r.n >= 5); assert.ok(r.toast.includes('fora do esperado'), r.toast);
  assert.deepEqual(J.erros, []);
});

// ---------- zumbis ----------
test('zumbis: sala', { timeout: 120000 }, async () => {
  await J.page.goto(J.url, { waitUntil: 'load' });
  await J.page.waitForFunction(() => window.__T && !document.querySelector('#btnHost').disabled, null, { timeout: 60000 });
  await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 });
});

test('V02 pos (zumbis): posição fora da grade do mapa é ignorada', async () => {
  const r = await noJogo(J.page, T => { const h = T.S.players.get('h'); h.anom = null; T.sim(.1); const p0 = h.pos.slice(); h.posAt -= 1e4; T.sendToHost({ t: 'pos', p: [9000, 0, 9000], y: 0, pi: 0 }); return { igual: h.pos[0] === p0[0], by: h.anom?.by }; });
  assert.equal(r.igual, true); assert.equal(r.by?.['pos:fora'], 1);
});

test('V03 zhit (zumbis): o acerto honesto continua valendo e o balde por arma continua igual', async () => {
  const r = await noJogo(J.page, T => { T.zStartRound(); T.sim(6); const p = T.S.players.get('h'), z = [...T.Z.zs.values()][0]; const hp0 = z.hp, m0 = p.money; T.sendToHost({ t: 'zhit', v: z.id, dmg: 20, z: 'body', w: 'm1911' }); return { d: hp0 - z.hp, pts: p.money - m0, vivo: T.Z.zs.has(z.id) }; });
  assert.equal(r.d, 20); if (r.vivo) assert.equal(r.pts, 10);
  assert.deepEqual(J.erros, []);
});
