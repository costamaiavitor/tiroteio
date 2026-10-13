// Decisão do dono (13/10): clicar durante a recarga não dispara sozinho quando ela acaba. A escopeta com bala no tubo continua
// interrompendo a recarga com o tiro (como no CoD). Rodar: node --test tests/gatilho-recarga.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => {
  J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'sanatorio' });
  await J.page.evaluate(() => { const cv = document.querySelector('canvas'); Object.defineProperty(document, 'pointerLockElement', { get: () => cv, configurable: true }); }); // o jogo só lê o gatilho com o mouse preso
}, { timeout: 240000 });
after(async () => { await J?.fechar(); });

const clique = (id, mag) => noJogo(J.page, (T, a) => {
  const p = T.S.players.get('h'), id = a.id, sl = T.W[id].slot === 'secondary' ? 'secondary' : 'primary'; p.inv[sl] = id; T.G.inv[sl] = id; T.equip(id, true); T.sim(1);
  const am = T.G.ammo[id] || (T.G.ammo[id] = { mag: T.W[id].mag, res: T.W[id].res }); am.mag = a.mag; am.res = 40;
  T.G.reload = null; T.G.reloadEnd = 0; T.G.trigger = false; T.G.nextFire = 0; T.startReload(); T.sim(.3);
  T.G.trigger = true; // clique (aperta e solta) no meio da recarga
  const s0 = T.G.lastShot; T.sim((T.W[id].reload || 3) + 1.5);
  return T.G.lastShot !== s0;
}, { id, mag });

test('clique durante a recarga não atira sozinho no fim', { timeout: 180000 }, async () => {
  for (const [id, mag] of [['m1911', 3], ['galil', 10], ['olympia', 0], ['spas', 0]]) assert.equal(await clique(id, mag), false, id);
  assert.equal(await clique('spas', 2), true, 'escopeta com bala no tubo: o tiro interrompe a recarga');
  assert.deepEqual(J.erros, []);
});
