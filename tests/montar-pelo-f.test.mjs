// Montar a máquina pelo F de verdade (zInteract -> zUse -> mensagem 'use' -> srvZUse), como o jogador faz: pega as peças com F e aperta F
// na bancada. O zUse não mandava o 'maq' do prompt 'zbuild' e o host montava sempre a energia: o Pack-a-Punch nunca montava pelo F
// (os testes antigos chamavam o srvZUse direto, já com o maq). Cobre os objetivos do mapa (só peças do PaP) e o clássico (energia e PaP).
// Rodar: node --test --test-concurrency=1 tests/montar-pelo-f.test.mjs
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
process.env.ZV2_SORTEIO = '1';
const { abrirJogo, criarSala } = await import('./_jogo.mjs');

const abertos = [];
after(async () => { for (const J of abertos) await J.fechar(); });

const jogaMontagem = maqs => { // na página: pega cada peça e monta cada máquina só com o F do jogador (zUse)
  const T = window.__T, D = T.ZD, p = T.S.players.get('h');
  const poe = (x, z) => { p.pos[0] = x; p.pos[2] = z; T.me.pos.set(x, p.pos[1], z); T.me.vel.set(0, 0, 0); };
  const segura = () => { T.Z.toSpawn = 0; T.Z.spawnT = 1e12; T.Z.zs.clear(); p.dwEnd = 1e12; };
  const f = () => { T.sim(.1); const a = T.ZC.act; if (a && !a.hold) T.zUse(); T.sim(.2); return a ? { k: a.k, maq: a.maq, txt: a.txt } : null; };
  segura(); p.money = 1e5;
  const pecas = D.zint.map((o, i) => ({ o, i })).filter(x => x.o.t === 'peca'), viu = [];
  for (const { o } of pecas) { poe(o.x + (o.n?.[0] || 0) * 1.1, o.z + (o.n?.[1] || 0) * 1.1); segura(); viu.push(f()); }
  const out = { n: pecas.length, pegas: {}, prompt: {}, montada: {} };
  for (const maq of maqs) { out.pegas[maq] = T.zPecasPegas(maq) + '/' + D.pecas[maq]; const M = maq === 'pap' ? D.pap : D.power; poe(M.x + M.n[0] * 1.2, M.z + M.n[1] * 1.2); segura(); out.prompt[maq] = f(); out.montada[maq] = !!T.Z.built?.[maq] && T.zConstruida(maq); }
  out.viu = viu.map(a => a?.k);
  return out;
};

test('objetivos do mapa (Vila): pega as peças do PaP com F e monta o Pack-a-Punch com F', { timeout: 240000 }, async () => {
  process.env.ZV2_OBJ = '1';
  const J = await abrirJogo(); abertos.push(J); delete process.env.ZV2_OBJ;
  await criarSala(J.page, { mode: 'zombies', map: 'vila', zdiff: 1 });
  const r = await J.page.evaluate(jogaMontagem, ['pap']); const erros = [...J.erros]; await J.fechar(); abertos.pop();
  assert.equal(r.n, 3, 'Normal: 3 peças do PaP ' + JSON.stringify(r));
  assert.ok(r.viu.every(k => k === 'zint'), 'F em cada peça ' + JSON.stringify(r));
  assert.equal(r.pegas.pap, '3/3');
  assert.deepEqual(r.prompt.pap, { k: 'zbuild', maq: 'pap', txt: 'Montar o Pack-a-Punch' });
  assert.equal(r.montada.pap, true, 'o PaP monta pelo F ' + JSON.stringify(r));
  assert.deepEqual(erros, []);
});

test('clássico com sorteio (Sanatório): energia e Pack-a-Punch montam pelo F', { timeout: 240000 }, async () => {
  const J = await abrirJogo(); abertos.push(J);
  await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 });
  const r = await J.page.evaluate(jogaMontagem, ['power', 'pap']); const erros = [...J.erros]; await J.fechar(); abertos.pop();
  assert.equal(r.n, 6, 'Normal: 3 peças de cada máquina ' + JSON.stringify(r));
  assert.deepEqual([r.pegas.power, r.pegas.pap], ['3/3', '3/3']);
  assert.equal(r.prompt.power?.maq, 'power'); assert.equal(r.prompt.pap?.maq, 'pap');
  assert.deepEqual(r.montada, { power: true, pap: true }, 'as duas montam pelo F ' + JSON.stringify(r));
  assert.deepEqual(erros, []);
});
