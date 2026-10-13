// zumbi-v2 (revisor R2): rede de segurança contra limpeza de código que apaga algo ainda usado.
// Monta todos os mapas e recarrega todas as armas do modo zumbi (e as versões do Pack-a-Punch) sem erro de página.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'sanatorio' }); }, { timeout: 180000 });
after(async () => { await J?.fechar(); });

test('todas as armas do modo zumbi (base e PaP 1–3) atiram e recarregam sem erro', { timeout: 300000 }, async () => {
  const erros0 = J.erros.length;
  const r = await noJogo(J.page, T => {
    const out = [], ids = Object.keys(T.W).filter(k => T.W[k].zw && !T.W[k].ls);
    for (const id of ids) {
      try {
        T.S.players.get('h').inv.primary = id; T.G.inv && (T.G.inv.primary = id);
        T.equip(id); T.sim(.5); const a = T.G.ammo[id] || (T.G.ammo[id] = { mag: T.W[id].mag, res: T.W[id].res });
        a.mag = Math.max(0, (a.mag || 1) - 1); T.startReload(); T.sim((T.W[id].reload || 3) + 1.5);
      } catch (e) { out.push(id + ': ' + String(e).slice(0, 120)); }
    }
    return { n: ids.length, out };
  });
  assert.ok(r.n >= 47 * 4 - 4, 'armas conferidas: ' + r.n);
  assert.deepEqual(r.out, []);
  assert.deepEqual(J.erros.slice(erros0), [], 'sem erro de página');
});

test('todos os mapas montam sem erro', { timeout: 300000 }, async () => {
  const erros0 = J.erros.length;
  const r = await noJogo(J.page, T => { const out = []; for (const id of Object.keys(T.MAPS)) { try { T.buildMap(id); } catch (e) { out.push(id + ': ' + String(e).slice(0, 120)); } } return { n: Object.keys(T.MAPS).length, out }; });
  assert.ok(r.n >= 10);
  assert.deepEqual(r.out, []);
  assert.deepEqual(J.erros.slice(erros0), [], 'sem erro de página');
});
