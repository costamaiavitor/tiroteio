// Objetivos do mapa: o que não pode sobrar de uma etapa para a seguinte nem de uma partida para a outra (revisor R1, 13/10).
// Cobre: o Nogueira do cliente sai da cena quando a etapa II acaba (a etapa do Vigia começa no mesmo mapa, sem montar o mapa de novo;
// antes ele ficava parado no Forte para sempre e quem entrava no meio não o via); a partida nova (time caído ou reinício) não herda o
// chefe de campo pendente das rodadas infinitas da anterior (CAMP_INFS), nem a etapa, o chefe, a fuga ou o evento.
// Rodar: ZV2_OBJ=1 node --test --test-concurrency=1 tests/objetivos-reinicio.test.mjs (o arquivo liga o ZV2_OBJ sozinho)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
process.env.ZV2_OBJ ||= '1';
const { abrirJogo, criarSala } = await import('./_jogo.mjs');

let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'vila', zdiff: 1 }); }, { timeout: 180000 });
after(async () => { await J?.fechar(); });

const AJUDA = `
  const rodada = () => { if (T.Z.phase !== 'round') { T.Z.phaseEnd = window.__simNow; T.sim(.05); } };
  const acaba = () => { T.Z.toSpawn = 0; for (const z of [...T.Z.zs.values()]) T.Z.zs.delete(z.id); T.sim(.1); };
  const quadro = s => { for (let t = 0; t < s; t += 1 / 30) { T.sim(1 / 30); T.campHud(1 / 30); } }; // o HUD do cliente (campNpcQuadro) roda por quadro
  const forca = ids => { for (const id of ids) T.campForca(id); };
  const p = T.S.players.get('h'); p.dwEnd = 1e12;
  const partida = () => { T.S.st = { ...T.S.st, zmode: 'campanha', zdiff: 1 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1); p.dwEnd = 1e12; rodada(); };`;
const rodar = corpo => J.page.evaluate(s => (new Function('T', s))(window.__T), AJUDA + corpo);

test('o Nogueira sai da cena do cliente quando a etapa II acaba (a do Vigia começa no mesmo mapa)', { timeout: 300000 }, async () => {
  const r = await rodar(`
    partida(); forca(['I.1', 'I.2']); T.sim(.3); acaba(); rodada();
    forca(['II.1', 'II.2', 'II.3']); quadro(1); // depois da escolta ele fica parado no Forte (II.4)
    const m = T.CAMP.c.npc?.model, antes = [T.CAMP_ATOS[T.CAMP.et].id, T.CAMP.c.npc?.id, !!m?.parent, m?.visible];
    forca(['II.4']); T.sim(.2); acaba(); rodada(); quadro(1);
    const depois = [T.CAMP_ATOS[T.CAMP.et].id, T.CAMP.c.npc, !!m?.parent, m?.visible];
    return { antes, depois };`);
  assert.deepEqual(r.antes, ['II', 'cabo', true, true], 'o Nogueira no Forte durante o II.4');
  assert.deepEqual(r.depois, ['C1', null, false, false], 'na etapa do Vigia o Nogueira não fica parado na cena');
  assert.deepEqual(J.erros, []);
});

test('partida nova depois das rodadas infinitas: nada da anterior (chefe de campo pendente, etapa, chefe, evento)', { timeout: 300000 }, async () => {
  const r = await rodar(`
    partida(); let g = 0;
    while (T.CAMP.modo === 'campanha' && g++ < 20) { for (let k = 0; k < 10; k++) forca(Object.keys(T.CAMP.obj).filter(id => T.CAMP.obj[id].st !== 'feito')); T.sim(.3); acaba(); rodada(); }
    const inf = T.CAMP.modo;
    acaba(); T.Z.round = 39; rodada(); T.sim(.1); // rodada 40: chefe de campo marcado para daqui a pouco
    const pend = T.CAMP_INFS.pend?.k ?? null;
    partida(); // o reinício (o time caiu antes de o chefe entrar)
    const novo = { modo: T.CAMP.modo, et: T.CAMP_ATOS[T.CAMP.et]?.id, round: T.Z.round, pend: T.CAMP_INFS.pend, vistoR: T.CAMP_INFS.vistoR, ch: !!T.CAMP_CH.z, ev: T.CAMP_EVS.id, objFim: T.CAMP.objFim, dog: T.Z.nextDog, boss: T.Z.nextBoss };
    T.sim(8);
    return { inf, pend, novo, ch: T.CAMP_CH.k };`);
  assert.equal(r.inf, 'infinito'); assert.equal(r.pend, 16, 'o Diretor da rodada 40 estava pendente');
  assert.deepEqual(r.novo, { modo: 'campanha', et: 'I', round: 1, pend: null, vistoR: 0, ch: false, ev: null, objFim: false, dog: 1e9, boss: 1e9 }, 'partida nova limpa: ' + JSON.stringify(r.novo));
  assert.equal(r.ch, -1, 'nenhum chefe de campo da partida anterior entra na nova');
  assert.deepEqual(J.erros, []);
});
