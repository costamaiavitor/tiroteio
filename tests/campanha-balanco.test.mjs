// Balanceamento da campanha (O3-D15; docs/overhaul/campanha.md §10, §11 e §16; números e medidas em docs/overhaul/balanceamento.md).
// Confere: as tabelas que o D15 ajusta (CAMP_CURVA, CAMP_KIT, CAMP_MIX, vida dos chefes) estão inteiras e coerentes; a curva que elas
// dão no Normal com 1 jogador é a da tabela do balanceamento.md (quem mudar um número atualiza o documento e este teste); e o robô do
// bench (tools/bench/robo-campanha.mjs) joga o Ato I e o Vigia até o fim, sem rodada travada e sem erro na página.
// Rodar: node --test tests/campanha-balanco.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo } from './_jogo.mjs';
import { comecar, jogar } from '../tools/bench/robo-campanha.mjs';

let J;
before(async () => { J = await abrirJogo(); }, { timeout: 120000 });
after(async () => { await J?.fechar(); });

// a curva (Normal, 1 jogador) que o balanceamento.md documenta: [etapa, rodada, vida do comum, zumbis na rodada]
const CURVA = [
  ['I', 1, 135, 5], ['I', 4, 405, 16], ['II', 5, 550, 24], ['II', 9, 950, 34], ['C1', 10, 1045, 16],
  ['III', 11, 1150, 36], ['III', 15, 1683, 49], ['IV', 16, 1944, 58], ['IV', 19, 2587, 68], ['C2', 20, 2846, 20],
  ['V', 21, 3131, 61], ['V', 24, 4166, 69],
];
const CHEFES = { 14: 10450, 15: 40650, 16: 89483 }; // vida com 1 jogador no Normal (zHp(rodada) · (base + porJog) · hpChefe)

test('tabelas do balanceamento: cada etapa com curva e kit válidos, mistura com estreias do §6.2', { timeout: 60000 }, async () => {
  const r = await J.page.evaluate(() => {
    const T = window.__T, W = T.W, dps = w => W[w]?.rate ? (W[w].dmg || 0) * (W[w].pellets || 1) / W[w].rate : 0;
    return { etapas: T.CAMP_ATOS.map(a => {
      const C = T.CAMP_CURVA[a.id], K = T.CAMP_KIT[a.id];
      return { id: a.id, chefe: !!a.chefe, C, K, armasOk: [].concat(K?.armas || []).every(w => !!W[w]), bebOk: [].concat(K?.bebidas || []).every(b => Object.hasOwn(T.ZPERKS, b)),
        nBeb: [].concat(K?.bebidas || []).length, dps: Math.max(0, ...[].concat(K?.armas || []).map(dps)), pap: [].concat(K?.armas || []).filter(w => W[w]?.pap).length };
    }), maxPerks: T.ZMAXPERKS, estreias: Object.fromEntries(Object.entries(T.CAMP_MIX).map(([k, m]) => [k, m.estreia])), hpChefe: T.CAMP_CHEFE_BASE.hpChefe, tetoEsp: T.CAMP_ZKV.tetoEsp };
  });
  let pts = 0, dps = 0;
  for (const e of r.etapas) {
    assert.ok(e.C && e.K, `curva e kit da etapa ${e.id}`);
    for (const k of ['vidaK', 'qtdK']) assert.ok(e.C[k] >= .5 && e.C[k] <= 2, `${e.id}.${k} = ${e.C[k]} fora de 0,5–2`);
    assert.equal(!!e.C.fixos, e.chefe, `fixos só nas etapas de chefe (${e.id})`);
    assert.ok(e.armasOk && e.bebOk && e.nBeb <= r.maxPerks, `kit de ${e.id}: armas e bebidas existem`);
    const p = e.K.pts ?? 0; assert.ok(p >= pts, `pontos do kit não caem (${e.id})`); pts = p;
    assert.ok(e.dps >= dps * .9, `a melhor arma do kit não piora ao longo da campanha (${e.id}: ${Math.round(e.dps)} < ${Math.round(dps)})`); dps = Math.max(dps, e.dps);
  }
  assert.equal(r.etapas.find(e => e.id === 'C2').pap, 2, 'Foguista: kit com 2 armas com PaP (§10, estado esperado)');
  assert.deepEqual(r.estreias, { 7: 6, 8: 7, 9: 8, 10: 11, 11: 13, 12: 16, 13: 18 }, 'estreias do §6.2');
  assert.equal(r.hpChefe, 1); assert.equal(r.tetoEsp, .5, 'teto de especiais ⌊n·0,5⌋ como no clássico');
});

test('curva no Normal com 1 jogador = tabela do balanceamento.md (serrote: cada ato começa mais leve que o fim do anterior, pela arma do kit)', { timeout: 60000 }, async () => {
  const r = await J.page.evaluate(({ CURVA }) => {
    const T = window.__T, W = T.W; T.S.st = { ...(T.S.st || {}), zdiff: 1 }; const D = T.ZDIFF[1];
    const dps = id => Math.max(...[].concat(T.CAMP_KIT[id].armas).map(w => W[w].dmg * (W[w].pellets || 1) / W[w].rate));
    const linha = (id, r) => { const C = T.CAMP_CURVA[id]; const vida = Math.round(T.zHp(r) * T.zHpK(r) * C.vidaK), n = C.fixos ? Math.round(C.fixos * D.cnt) : Math.max(1, Math.round(T.zCount(r, 1) * D.cnt * C.qtdK)); return { vida, n, esforco: vida * n / dps(id) }; };
    const chefes = {}; for (const k of [14, 15, 16]) { const c = T.CAMP_CHEFE[k]; chefes[k] = Math.round(T.zHp(c.rodada) * T.zHpK(c.rodada) * (c.base + c.porJog) * T.CAMP_CHEFE_BASE.hpChefe); }
    return { linhas: CURVA.map(([id, r]) => linha(id, r)), chefes };
  }, { CURVA });
  CURVA.forEach(([id, rod, vida, n], i) => { assert.equal(r.linhas[i].vida, vida, `${id} r${rod}: vida`); assert.equal(r.linhas[i].n, n, `${id} r${rod}: zumbis`); });
  for (const k in CHEFES) assert.ok(Math.abs(r.chefes[k] - CHEFES[k]) <= CHEFES[k] * .002, `vida do chefe ${k}: ${r.chefes[k]}`);
  const es = id => CURVA.map(([e], i) => e === id ? r.linhas[i].esforco : null).filter(x => x != null); // [começo, fim] do ato
  for (const id of ['I', 'II', 'III', 'IV', 'V']) { const [a, b] = es(id); assert.ok(b > a, `${id} sobe dentro do ato`); }
  for (const [ant, prox] of [['I', 'II'], ['II', 'III'], ['III', 'IV'], ['IV', 'V']]) {
    const fim = es(ant)[1], ini = es(prox)[0];
    assert.ok(ini <= fim, `serrote: ${prox} começa (${ini.toFixed(0)} s de tiro) sem passar do fim de ${ant} (${fim.toFixed(0)} s)`);
  }
});

test('robô do bench: Ato I no Normal acaba na rodada mínima, sem rodada travada; o Vigia cai dentro do teto', { timeout: 600000 }, async () => {
  await comecar(J.page, { etapa: 'I', dif: 1, np: 1 });
  const { st, res } = await jogar(J.page, { teto: 900, semente: 11 });
  assert.ok(st.fim && !st.teto && !st.over, 'Ato I acabou (fim da etapa)');
  assert.deepEqual(res.rodadas.map(x => x.rodada), [1, 2, 3, 4], 'rodadas 1 a 4 (rodMin 4)');
  assert.equal(res.travadas, 0, 'nenhuma rodada travada');
  for (const x of res.rodadas) assert.ok(x.abates >= x.n0 * .8, `r${x.rodada}: o robô matou a rodada (${x.abates}/${x.n0})`);
  await comecar(J.page, { etapa: 'C1', dif: 1, np: 1 });
  const c = await jogar(J.page, { teto: 1500, semente: 12 });
  assert.ok(c.st.fim, 'o Vigia morreu e a etapa acabou');
  assert.equal(c.res.chefe?.k, 14); assert.ok(c.res.chefe.durS > 30, `luta de ${c.res.chefe.durS} s`); // a duração varia muito com o robô (150–860 s): a meta é medida no bench, não aqui
  assert.deepEqual(J.erros.filter(e => !/WebGL|context/i.test(e)), [], 'sem erro na página');
});
