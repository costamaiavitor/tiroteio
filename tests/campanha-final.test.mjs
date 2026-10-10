// Ato V, o final e o modo infinito (Onda 3, O3-D14; docs/overhaul/campanha.md §4.3, §9, §11; lore.md §10.3): o clássico sem nada disso,
// o Ato V de ponta a ponta (cargas, Névoa, o Diretor só depois do V.2, a morte que abre a fuga, a gaiola, o final, os créditos e o
// Infinito liberado no salvo), o final completo com os 22 documentos e sem eles, quem entra no meio na fuga e o infinito (estreias,
// legenda do rádio, chefe de campo na 20 e na 30, rodízio e recorde no cartão do mapa).
// Rodar: node --test tests/campanha-final.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 }); await J.page.evaluate(() => localStorage.removeItem('tiroteio.campanha')); }, { timeout: 240000 });
after(async () => { await J?.fechar(); });

const PREP = `(T => {
  const p = T.S.players.get('h'), agora = () => window.__simNow;
  const poe = (q, x, z, y = 0) => { q.pos = [x, y, z]; if (q === p) { T.me.pos.set(x, y, z); T.me.vel.set(0, 0, 0); } };
  const idx = id => T.ZD.zint.findIndex(o => o.id === id);
  const fim = () => { for (const z of [...T.Z.zs.values()]) T.zKill(z, null, 'body', 'nuke', false, true); T.Z.toSpawn = 0; T.Z.reQ = []; T.sim(.5); T.sim(Math.max(0, T.Z.phaseEnd - agora()) + .2); };
  const ob = id => T.campEstado().obj[id]?.st;
  return { p, agora, poe, idx, fim, ob };
})`;
const em = fn => `(T, arg) => { const H = (new Function('return ' + arg.PREP)())(T); return (${fn})(T, arg, H); }`;
const rodar = (fn, a = {}) => J.page.evaluate(([src, arg]) => (new Function('T', 'arg', `return (${src})(T, arg)`))(window.__T, arg), [em(fn.toString()), { PREP, ...a }]);
const esperaMapa = m => J.page.waitForFunction(m => window.__T.S.st.map === m && window.__T.ZC.world && !document.getElementById('warmMsg'), m, { timeout: 600000, polling: 300 });

test('clássico: nada do final nem do infinito (sem chefe de campo, recorde, legenda, gaiola nem Infinito no menu)', { timeout: 120000 }, async () => {
  const r = await noJogo(J.page, T => {
    const el = document.createElement('div'); document.body.appendChild(el);
    T.matchForm(el, { mode: 'zombies', zmap: 'vila', zmode: 'infinito', zdiff: 1 });
    const inf = el.querySelector('[data-zm="infinito"]'), o = { infOff: inf?.disabled, zm: el.querySelector('[data-zm].on')?.dataset.zm, rec: el.querySelectorAll('.rec').length, aviso: /Campanha concluída/.test(el.textContent) }; el.remove();
    T.Z.round = 19; for (const z of [...T.Z.zs.values()]) T.zKill(z, null, 'body', 'nuke', false, true); T.Z.toSpawn = 0; T.sim(.5); T.sim(Math.max(0, T.Z.phaseEnd - window.__simNow) + .2); T.sim(7);
    Object.assign(o, { round: T.Z.round, on: T.CAMP.on, ch: T.CAMP_CH.z, pend: T.CAMP_INFS.pend, inf: JSON.stringify(T.campSalvo().inf), radio: !!document.getElementById('campInfRadio'), cred: !!document.getElementById('campCred'),
      ganchos: [T.CAMP_VS.fase, T.campInfChefeDe(20)?.k], cp: !!T.zWorldState().cp });
    return o;
  });
  assert.equal(r.infOff, true, 'Infinito trancado sem campanha concluída'); assert.equal(r.zm, 'classico'); assert.equal(r.rec, 0); assert.equal(r.aviso, false);
  assert.equal(r.round, 20); assert.equal(r.on, false); assert.equal(r.ch, null, 'sem chefe de campo no clássico'); assert.equal(r.pend, null);
  assert.equal(r.inf, '{"vila":{},"sanatorio":{}}', 'sem recorde no clássico'); assert.equal(r.radio, false); assert.equal(r.cred, false);
  assert.deepEqual(r.ganchos, [null, 14]); assert.equal(r.cp, false); assert.deepEqual(J.erros, []);
});

test('Ato V: cargas, Névoa, o Diretor só depois do V.2, fuga pela gaiola, final, créditos e Infinito liberado', { timeout: 900000 }, async () => {
  await rodar(T => { T.campLibera(4, 1); T.S.st = { ...T.S.st, zmode: 'campanha', ato: 4 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1); });
  await esperaMapa('galeria7');
  const a = await rodar((T, arg, H) => {
    const { p, poe, idx, fim, ob, agora } = H; p.dwEnd = 1e12; T.CAMP.c.cena = null; T.CAMP.c.radioQ.length = 0;
    T.sim(Math.max(0, T.Z.phaseEnd - agora()) + .2); T.sim(.2);
    const o = { et: T.CAMP.et, round: T.Z.round, ob: ['V.1', 'V.2', 'F.1', 'F.2'].map(ob), chefeR: T.GAL7_RODADAS.chefe, radio: T.CAMP.c.radioQ.map(x => x[1]).concat(T.CAMP.c.radio ? ['(no ar)'] : []) };
    // carga 1 pelo caminho de verdade: segurar F 4 s ao lado dela
    const i1 = idx('g7-carga-1'), c1 = T.ZD.zint[i1]; poe(p, c1.x + c1.n[0] * 1, c1.z + c1.n[1] * 1);
    for (let k = 0; k < 30; k++) { T.sendToHost({ t: 'hold', k: 'zint', id: i1 }); T.sim(.15); }
    o.c1 = T.Z.zint[i1].st; o.p1 = T.campEstado().obj['V.1'].p;
    for (const id of ['g7-carga-2', 'g7-carga-3']) T.zintPoe(idx(id), 'armada', 0, 'h'); T.sim(.2);
    o.v = [ob('V.1'), ob('V.2')];
    fim(); fim(); o.r23 = [T.Z.round, ob('V.2'), T.campVEstado().v2]; // 22 e 23: o V.2 ainda espera a 24
    fim(); o.r24 = [T.Z.round, ob('V.2'), T.campVEstado().v2, T.CAMP_EVS.id]; T.sim(3); { const vs = [...T.Z.zs.values()]; for (const z of vs.slice(0, Math.ceil(vs.length / 2))) T.zKill(z, null, 'body', 'nuke', false, true); } T.sim(.4); o.p24 = T.campEstado().obj['V.2'].p;
    fim(); o.r25 = [T.Z.round, ob('V.2'), ob('F.1'), T.GAL7_RODADAS.chefe]; T.sim(4); const z = T.CAMP_CH.z; o.dr = z?.kind;
    // morte do Diretor: a rodada segue, cena da fuga, o pilar estoura, a gaiola desce
    poe(p, 0, 14); z.hp = 10; T.CAMP_CH.inv = 0; T.CAMP_CH.fase = T.CAMP_CH.def.fases.length - 1; T.zHit(p, z.id, 100, 'body', 'm1911', false); T.sim(.1);
    o.morte = [ob('F.1'), ob('F.2'), T.Z.phase, T.Z.toSpawn >= 6, T.campVEstado().fase, T.CAMP.c.cena?.L.length, +(T.CAMP.c.cena?.L.reduce((s, c) => s + c[1], 0) ?? 0).toFixed(2)];
    T.sim(2); o.gaiolaMeio = T.campVEstado().gaiolaY; T.sim(2.1);
    o.fuga = [ob('F.2'), T.CAMP_EVS.id, T.CAMP_EVS.fuga, T.Z.phase, T.campVEstado().gaiolaY];
    T.sim(3); o.zs = T.Z.zs.size;
    // embarque: o host entra na gaiola; 10 s depois ela sobe
    p.dwEnd = 1e12; const g = T.ZD.zint[idx('g7-gaiola')]; poe(p, g.x, g.z); T.sim(.2); o.emb = T.Z.zint[idx('g7-gaiola')].st;
    for (let k = 0; k < 11; k++) { poe(p, g.x, g.z); T.sim(1); }
    o.final = [ob('F.2'), T.Z.zs.size, T.Z.toSpawn, T.CAMP_EVS.id, T.campVEstado().fase, T.campVEstado().completo, T.CAMP.fugiram?.includes('h'), T.CAMP.c.cena?.L.length];
    o.salvo = T.campSalvo().dif; o.infLib = T.campInfLiberado();
    T.sim(T.CAMP.fim.t - agora() + .3); T.sim(.2);
    o.cred = [T.S.phase, T.campVEstado().cred, T.campVEstado().credVis, T.CAMP.over];
    return o;
  });
  assert.equal(a.et, 6); assert.equal(a.round, 21); assert.deepEqual(a.ob, ['ativo', 'oculto', 'oculto', 'oculto']); assert.equal(a.chefeR, Infinity, 'o Diretor espera o V.2');
  assert.ok(a.radio.includes('r5-cargas'), 'rádio das cargas ' + a.radio);
  assert.equal(a.c1, 'armada'); assert.ok(Math.abs(a.p1 - 1 / 3) < .01, 'V.1 em 1/3');
  assert.deepEqual(a.v, ['feito', 'ativo']); assert.deepEqual(a.r23, [23, 'ativo', 0]);
  assert.deepEqual(a.r24, [24, 'ativo', 24, 'nevoa']); assert.ok(a.p24 > 0 && a.p24 < 1, 'progresso da Névoa ' + a.p24);
  assert.deepEqual(a.r25, [25, 'feito', 'ativo', 25]); assert.equal(a.dr, 16);
  assert.deepEqual(a.morte, ['feito', 'ativo', 'round', true, 'cena', 3, 4], 'F.2 já no HUD; a cena de 4 s');
  assert.ok(a.gaiolaMeio > 0 && a.gaiolaMeio < 9, 'a gaiola descendo ' + a.gaiolaMeio);
  assert.deepEqual(a.fuga, ['ativo', 'estouro', true, 'round', 0]); assert.ok(a.zs > 0, 'a fuga repõe zumbis');
  assert.equal(a.emb, 'embarque');
  assert.deepEqual(a.final, ['feito', 0, 0, null, 'final', false, true, 4], 'sem os documentos: c5-final (3) + c5-pos (1)');
  assert.ok(a.salvo[1].fim && a.salvo[0].fim && !a.salvo[2].fim, 'concluída no Normal e nas mais fáceis'); assert.equal(a.infLib, true);
  assert.deepEqual(a.cred, ['over', true, true, true]);
  // créditos: pular esconde (Enter); o host com Enter de novo volta ao lobby; o formulário mostra o Infinito liberado
  await J.page.keyboard.press('Enter');
  const b = await rodar((T, arg, H) => { T.sim(.1); const o = { pulou: T.campVEstado().pulou, txt: document.querySelector('#campCred .fim')?.textContent }; return o; });
  assert.equal(b.pulou, true); assert.match(b.txt, /CAMPANHA CONCLUÍDA.*Normal.*Infinito liberado/);
  await J.page.keyboard.press('Enter');
  const c = await rodar((T, arg, H) => { T.sim(.2); T.sim(.2);
    const el = document.createElement('div'); document.body.appendChild(el); T.matchForm(el, { mode: 'zombies', zmap: 'vila', zmode: 'infinito', zdiff: 1 });
    const o = { lobby: T.S.lobby, on: T.CAMP.on, inf: el.querySelector('[data-zm="infinito"]')?.disabled, zm: el.querySelector('[data-zm].on')?.dataset.zm, txt: el.textContent, cred: T.campVEstado().credVis }; el.remove(); return o; });
  assert.equal(c.lobby, true, 'de volta ao lobby'); assert.equal(c.on, false); assert.equal(c.inf, false, 'Infinito liberado'); assert.equal(c.zm, 'infinito');
  assert.match(c.txt, /Campanha concluída \(Normal\) · Infinito liberado/); assert.match(c.txt, /O VALE AINDA CHAMA/); assert.match(c.txt, /Sem recorde/);
  assert.deepEqual(J.erros, []);
  // de volta ao jogo para os próximos testes (o lobby recomeça a partida)
  await J.page.evaluate(() => { const T = window.__T; T.S.st.zmode = 'campanha'; T.S.st.ato = 4; T.S.st.map = 'galeria7'; T.S.st.zmap = 'galeria7'; T.LB.getForm = () => ({ ...T.S.st }); });
  await J.page.click('#lbGo'); await esperaMapa('galeria7');
  await J.page.waitForFunction(() => window.__T.Z.on && window.__T.CAMP.et === 6, null, { timeout: 60000 });
});

test('final completo com os 22 documentos (salvo finalCompleto) e sem eles', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { agora } = H; const o = {}, ids = [...Object.keys(T.ZINT_TERM_TXT), ...Object.keys(T.CAMP_NOTA_TXT)].filter(id => !/teste/.test(id));
    o.tot = T.campDocs().total; o.n = ids.length;
    const roda = docs => { T.sim(.1); T.CAMP.c.cena = null; T.CAMP.fim = null; T.CAMP_VS.fase = 'fuga'; T.CAMP.docs = new Set(docs); T.campVFinal(); T.sim(.05); const L = T.CAMP.c.cena?.L.length; const v = T.campVEstado(); T.CAMP.fim = null; T.CAMP.c.cena = null; return [L, v.completo, v.docs]; };
    o.sem = roda(ids.slice(0, ids.length - 1)); o.salvo0 = T.campSalvo().finalCompleto;
    o.com = roda(ids); o.salvo1 = T.campSalvo().finalCompleto;
    o.lixo = roda([...ids.slice(0, ids.length - 1), 'inventado']); // id que não é da lore não conta
    T.CAMP_VS.fase = null; return o;
  });
  assert.equal(r.tot, 22); assert.equal(r.n, 22);
  assert.deepEqual(r.sem, [4, false, 21]); assert.equal(r.salvo0, false);
  assert.deepEqual(r.com, [7, true, 22], 'c5-final (3) + c5-final-completo (3) + c5-pos (1)'); assert.equal(r.salvo1, true);
  assert.deepEqual(r.lixo, [4, false, 21]);
});

test('quem entra no meio na fuga: espectador, recebe o F.2, o Estouro da fuga e a gaiola já embaixo', { timeout: 300000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, ob, agora } = H; p.dwEnd = 1e12; T.CAMP.c.cena = null;
    T.Z.phaseEnd = agora(); T.sim(.2); T.Z.round = 24; for (const id of ['V.1', 'V.2']) T.campForca(id); T.sim(.1); // o Diretor na rodada seguinte (25)
    for (const z of [...T.Z.zs.values()]) T.zKill(z, null, 'body', 'nuke', false, true); T.Z.toSpawn = 0; T.sim(.2); T.Z.phaseEnd = agora(); T.sim(.2); T.sim(3.5); // (intervalo encurtado: o teste é a fuga)
    const z = T.CAMP_CH.z; z.hp = 10; T.CAMP_CH.inv = 0; T.CAMP_CH.fase = T.CAMP_CH.def.fases.length - 1; T.zHit(p, z.id, 100, 'body', 'm1911', false); T.sim(4.3); T.CAMP.c.cena = null;
    const o = { fase: T.campVEstado().fase, f2: ob('F.2') };
    const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; } };
    T.srvOnData(c, { t: 'join', v: 2, pv: 3, name: 'Meio' }); T.sim(.2);
    const q = T.S.players.get(c.pid), st = c.out.filter(m => m.t === 'state' && m.z).pop(), cp = st?.z?.cp;
    Object.assign(o, { vivo: q?.alive, ob: cp?.ob?.find(x => x[0] === 'F.2')?.[1], ev: cp?.ev?.[0], fg: cp?.fg?.[0] });
    T.srvDrop(c); T.campCliReset(); T.CAMP_VC.fuga = 0; T.campSync(cp); T.sim(1 / 60);
    o.cli = [T.CAMP.c.obj['F.2']?.st, T.campVEstado().gaiolaY];
    return o;
  });
  assert.deepEqual([r.fase, r.f2], ['fuga', 'ativo']);
  assert.equal(r.vivo, false, 'espectador na rodada do chefe'); assert.equal(r.ob, 'ativo'); assert.equal(r.ev, 'estouro'); assert.equal(r.fg, 'fuga');
  assert.deepEqual(r.cli, ['ativo', 0], 'o HUD e a gaiola embaixo'); assert.deepEqual(J.erros, []);
});

test('infinito: estreias dos tipos, legenda do rádio, chefe de campo (Vigia na 20, Foguista na 30), rodízio e recorde', { timeout: 900000 }, async () => {
  await rodar(T => { T.CAMP_VS.fase = null; T.S.st = { ...T.S.st, zmode: 'infinito', map: 'vila', zmap: 'vila' }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1); });
  await esperaMapa('vila');
  const r = await rodar((T, arg, H) => {
    const { p, fim, agora } = H; p.dwEnd = 1e12; const o = { modo: T.CAMP.modo, et: T.CAMP.et, round: T.Z.round };
    // estreias (a mesma curva da campanha): o tipo entra na rodada da estreia (só 1) e não antes
    // (cada tipo sozinho: os pesos dos outros a 0, para o teto de especiais não esconder a estreia)
    const cota = (k, r) => { const P = T.CAMP_ZKV.peso, P0 = { ...P }; for (const j of Object.keys(T.CAMP_MIX)) P[j] = +j === k ? 1 : 0; T.Z.round = r; T.Z.dogRound = false; T.Z.toSpawn = 60; T.Z.mixN = 0; T.campZkCotas(); for (const j in P) delete P[j]; Object.assign(P, P0); return T.CAMP_ZKS.rest[k] | 0; };
    o.est = Object.entries(T.CAMP_MIX).map(([k, M]) => [+k, cota(+k, M.estreia - 1), cota(+k, M.estreia), cota(+k, M.estreia + 3) >= 1]); o.tabela = T.CAMP_INF.estreia;
    // a legenda (fala e rádio) aparece no infinito
    T.campFala('penitente-estreia'); T.sim(.2); o.radio = T.campVEstado().radioInf;
    // chefe de campo na 20: Vigia, versão de campo, vida da rodada 20
    T.Z.round = 18; fim(); fim(); o.r20 = [T.Z.round, T.CAMP_INFS.pend?.k, T.CAMP_EVS.id]; T.sim(5.5);
    const z = T.CAMP_CH.z; o.vigia = [z?.kind, T.CAMP_CH.campo, z && z.maxHp === Math.round(T.zHp(20) * T.zHpK(20) * (T.CAMP_CHEFE[14].base + T.CAMP_CHEFE[14].porJog))];
    for (const x of [...T.Z.zs.values()]) if (x !== z) T.zKill(x, null, 'body', 'nuke', false, true); T.Z.toSpawn = 0; T.sim(1); o.segue = [T.Z.phase, T.Z.zs.has(z.id)];
    z.hp = 1; T.CAMP_CH.inv = 0; T.CAMP_CH.fase = T.CAMP_CH.def.fases.length - 1; T.zHit(p, z.id, 50, 'body', 'm1911', false); T.sim(.5); o.morto = [T.CAMP_CH.z, T.Z.phase];
    o.rec = T.campSalvo().inf.vila[1];
    T.sim(Math.max(0, T.Z.phaseEnd - agora()) + .2); T.Z.round = 29; fim(); o.r30 = T.Z.round; T.sim(5.5); o.foguista = [T.CAMP_CH.z?.kind, T.CAMP_CH.campo];
    { const zz = T.CAMP_CH.z; for (const x of [...T.Z.zs.values()]) T.zKill(x, null, 'body', 'nuke', false, true); T.campChefeLimpa?.(); }
    { T.Z.round = 40; T.Z.phase = 'round'; T.Z.toSpawn = Math.max(T.Z.toSpawn, 3); const d = T.campChefeNasce(16, { campo: 1, rodada: 40 }); T.CAMP_CH.prox = 0; T.sim(8); o.diretor = [d?.kind, T.CAMP_CH.campo, T.DRSRV.modo, !!T.CAMP_CH.z]; for (const x of [...T.Z.zs.values()]) T.zKill(x, null, 'body', 'nuke', false, true); }
    o.rod = [20, 30, 40, 50, 60, 70, 80, 25].map(r => { const c = T.campInfChefeDe(r); return c ? [c.k, c.vidaK] : null; });
    o.rec2 = T.campSalvo().inf.vila[1];
    const el = document.createElement('div'); document.body.appendChild(el); T.matchForm(el, { mode: 'zombies', zmap: 'vila', zmode: 'infinito', zdiff: 1 });
    o.cartao = ['vila', 'sanatorio'].map(m => el.querySelector(`[data-map="${m}"] .rec`)?.textContent); el.remove();
    return o;
  });
  assert.deepEqual([r.modo, r.et], ['infinito', -1]);
  assert.deepEqual(r.est, [7, 8, 9, 10, 11, 12, 13].map(k => [k, 0, 1, true]), 'cada tipo: nenhum antes da estreia, só 1 na estreia (o trio conta 1), e segue depois ' + JSON.stringify(r.est));
  assert.deepEqual(r.tabela, { 7: 6, 8: 7, 9: 8, 10: 11, 11: 13, 12: 16, 13: 18 });
  assert.equal(r.radio[0], '1'); assert.match(r.radio[1], /PENITENTE/);
  assert.deepEqual(r.r20, [20, 14, null], 'rodada 20: o Vigia pendente, sem evento');
  assert.deepEqual(r.vigia, [14, true, true]); assert.deepEqual(r.segue, ['round', true], 'a rodada não termina com o chefe vivo');
  assert.equal(r.morto[0], null); assert.notEqual(r.morto[1], 'round', 'a rodada termina quando ele morre');
  assert.equal(r.r30, 30); assert.deepEqual(r.foguista, [15, true]);
  assert.deepEqual(r.diretor, [16, true, 'chao', true], 'o Diretor de campo anda no chão, sem púlpito'); assert.deepEqual(r.rod, [[14, 1], [15, 1], [16, 1], [14, 1.25], [15, 1.25], [16, 1.25], [14, 1.5], null]);
  assert.ok(r.rec >= 20 && r.rec2 >= 30, `recorde ${r.rec} -> ${r.rec2}`); assert.deepEqual(r.cartao, ['Recorde: rodada ' + r.rec2, 'Sem recorde']);
  assert.deepEqual(J.erros, []);
});
