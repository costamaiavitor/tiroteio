// Pedido do dono (13/10): a passagem secreta só "aparece" (rachaduras e o F) quando os requisitos estão ok: as duas áreas abertas (e o
// interruptor, se houver). Até lá é muro igual ao vizinho. Rodar: node --test tests/passagem-secreta.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'sanatorio' }); }, { timeout: 240000 });
after(async () => { await J?.fechar(); });

test('passagem secreta: rachaduras e F só com as duas áreas abertas; depois de aberta, somem', { timeout: 120000 }, async () => {
  const r = await noJogo(J.page, T => {
    const out = [], sec = T.ZD.doors.filter(d => d.secreta), W = T.ZC.world.doors;
    const vis = d => W.get(d.id).g.userData.rach?.[0]?.visible;
    const salvo = new Set(T.ZC.doors);
    for (const d of sec) {
      T.ZC.doors.clear(); for (const id of salvo) T.ZC.doors.add(id); T.zFalsaRevela(); const antes = vis(d);
      // abre (só no cliente) portas comuns até as duas áreas ficarem ativas
      for (const o of T.ZD.doors) if (!o.atalho) T.ZC.doors.add(o.id); T.zFalsaRevela(); const ok = vis(d), trava = T.zintPortaTrava(d, false);
      T.ZC.doors.add(d.id); T.zFalsaRevela(); const aberta = vis(d);
      out.push({ id: d.id, temRach: !!W.get(d.id).g.userData.rach, antes, ok, trava, aberta });
    }
    T.ZC.doors.clear(); for (const id of salvo) T.ZC.doors.add(id); T.zFalsaRevela();
    return out;
  });
  assert.equal(r.length, 3, JSON.stringify(r));
  for (const x of r) { assert.ok(x.temRach, x.id); assert.equal(x.antes, false, 'no começo da partida: muro ' + JSON.stringify(x)); assert.equal(x.ok, !x.trava, 'com as áreas abertas: aparece ' + JSON.stringify(x)); assert.equal(x.aberta, false, 'aberta: some ' + JSON.stringify(x)); }
  assert.deepEqual(J.erros, []);
});
