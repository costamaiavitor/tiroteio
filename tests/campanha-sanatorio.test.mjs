// Atos III e IV da campanha no Sanatório (Onda 3, O3-D12; docs/overhaul/campanha.md §4.3, textos em lore.md §8–§10): os objetivos de
// verdade jogados de ponta a ponta pelo host (livro da Recepção, a Enfermeira-chefe com a chave, o portador que sai e a chave no chão,
// a chave que cai fora do campo, a entrega na porta do Laboratório, o relatório 31 que solta o apito, segurar o Laboratório, Energia,
// as três alas pagas, o registro da Torre somando o tempo), a trava do Laboratório, as portas da história, as notas no ato certo, o
// rádio, o checkpoint do Ato IV, as trocas Forte -> Sanatório e Sanatório -> Forno com bagagem, as rotas sem softlock e o clássico
// (e o infinito) sem nada disto.
// Rodar: node --test tests/campanha-sanatorio.test.mjs (ou a suíte inteira)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); }, { timeout: 120000 });
after(async () => { await J?.fechar(); });

const PREP = `(T => {
  const p = T.S.players.get('h');
  const poe = (q, x, z) => { q.pos = [x, 0, z]; if (q === p) { T.me.pos.set(x, 0, z); T.me.vel.set(0, 0, 0); } };
  const segura = () => { T.Z.toSpawn = 50; T.Z.spawnT = 1e12; for (const z of [...T.Z.zs.values()]) if (!z.elite) T.Z.zs.delete(z.id); p.dwEnd = 1e12; };
  const idx = id => T.ZD.zint.findIndex(o => o.id === id);
  const obj = id => T.campEstado().obj[id];
  const ouve = () => { const q = T.CAMP.c.radioQ; if (!q.__ouve) { q.__ouve = 1; q.push = function (...a) { (window.__ouvidos ||= []).push(...a.map(x => x[1])); return Array.prototype.push.apply(this, a); }; } };
  const ouvidos = () => window.__ouvidos || [];
  const rodada = () => { if (T.Z.phase !== 'round') { T.Z.phaseEnd = window.__simNow; T.sim(.05); } segura(); }; // começa a próxima rodada já
  const acaba = () => { T.Z.toSpawn = 0; T.Z.zs.clear(); T.sim(.1); }; // a rodada acaba de verdade (zEndRound -> campFimRodada)
  const nota = id => T.zintNotaLigada(T.ZD.zint[idx(id)]);
  const porta = id => T.ZD.doors.find(d => d.id === id);
  const usa = (id, x, z) => { poe(p, x, z); T.srvZUse(p, { k: 'zint', id: idx(id) }); T.sim(.1); };
  const ativa = id => T.zActive().has(id);
  return { p, poe, segura, idx, obj, ouve, ouvidos, rodada, acaba, nota, porta, usa, ativa };
})`;
const prep = `const H = (new Function('return ' + arg.PREP)())(T);`;
const em = fn => `(T, arg) => { ${prep} return (${fn})(T, arg, H); }`;
const rodar = (fn, a = {}) => J.page.evaluate(([src, arg]) => (new Function('T', 'arg', `return (${src})(T, arg)`))(window.__T, arg), [em(fn.toString()), { PREP, ...a }]);
const NOTAS = ['n-enfermaria-dose', 'n-estabulo-fermino', 'n-biblioteca-sono', 'n-torre-registro'];

test('clássico: sem campanha no Sanatório (registro e chave { off: 1 }, notas desligadas, Laboratório com portas pagas comuns)', { timeout: 180000 }, async () => {
  await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 });
  const r = await rodar((T, arg, { p, poe, segura, idx, nota, porta }) => {
    segura();
    const off = ['registro-torre', 'chave-lab'].map(id => !!T.ZC.world.zint[idx(id)]?.off);
    const notas = arg.NOTAS.map(nota), bd = porta('BD'), trava = [!!bd.atalho, bd.trava ?? null, T.campSanTrancado()];
    poe(p, -7.5, 16); p.money = 1500; T.srvZUse(p, { k: 'door', id: 'BD' }); T.sim(.1);
    const comprou = [T.Z.doors.has('BD'), p.money]; T.campSanTick(); T.sim(.2);
    return { on: T.CAMP.on, off, notas, trava, comprou, obj: Object.keys(T.CAMP.obj).length, ids: ['registro-torre', 'chave-lab', ...arg.NOTAS].map(idx) };
  }, { NOTAS });
  assert.equal(r.on, false); assert.deepEqual(r.off, [true, true], 'interativos da campanha desligados no clássico');
  assert.deepEqual(r.notas, [false, false, false, false]); assert.deepEqual(r.trava, [false, null, false], 'porta B↔D sem trava no clássico');
  assert.deepEqual(r.comprou, [true, 500], 'B↔D continua custando 1000 no clássico'); assert.equal(r.obj, 0); assert.ok(r.ids.every(i => i >= 0));
  assert.deepEqual(J.erros, []);
});

test('Ato III: livro, Enfermeira-chefe, chave no chão, entrega abre o Laboratório, relatório solta o apito, segurar a sala; marco na 15', { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, poe, segura, idx, obj, ouve, ouvidos, rodada, acaba, nota, porta, usa, ativa } = H;
    T.campLibera(2, 1); T.S.st = { ...T.S.st, zmode: 'campanha', ato: 2 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1); ouve(); window.__ouvidos = [];
    const e0 = T.campEstado(), notas0 = arg.NOTAS.map(nota), kit = [p.money, p.inv.primary, p.inv.secondary];
    rodada(); const round0 = T.Z.round, hud = document.querySelector('#campObj')?.textContent || '';
    // a trava do Laboratório: o host recusa a porta paga e o F mostra "Trancada", sem preço
    p.money = 5000; poe(p, -7.5, 16); T.sim(.1); const act = { ...T.ZC.act }; T.srvZUse(p, { k: 'door', id: 'BD' }); T.srvZUse(p, { k: 'door', id: 'FD' }); T.sim(.1);
    const trava = [T.Z.doors.has('BD'), T.Z.doors.has('FD'), p.money, act.k, act.ok, act.txt, T.zintPortaTrava(porta('DI'), true)];
    // III.1: o livro de admissões (F no terminal da Recepção)
    usa('san-recepcao', -7, 4.25); const i1 = [obj('III.1').st, obj('III.2').st, T.Z.doors.has('AB'), ativa('B')];
    // III.2: a Enfermeira-chefe nasce a 40% da rodada (O3-D08), foge, morre e solta a chave
    const S2 = T.CAMP_ZK2S; S2.r = T.Z.round; S2.n0 = 20; T.Z.toSpawn = 2; T.sim(1 / 30); const el = S2.elite;
    const elite = [!!el, el?.kind, el?.elite]; T.Z.toSpawn = 50; T.Z.spawnT = 1e12;
    el.st = 'in'; el.body.pos.set(2, 0, 16); T.zHit(p, el.id, 1e9, 'body', 'm1911', false); T.sim(.1);
    const it = T.CAMP.itens['chave-lab'], ic = idx('chave-lab'), cai = [it.st, Math.round(it.x), Math.round(it.z), T.Z.zint[ic].st, T.ZC.zint[ic].st];
    usa('chave-lab', it.x + .5, it.z); const pega = [it.st, it.quem, obj('III.2').q, T.CAMP.c.obj['III.2']?.q];
    // quem carrega sai (ou cai): a chave fica no chão onde ele estava
    poe(p, 1, 14); T.sim(.1); it.quem = 'saiu'; T.sim(.1); const solta = [it.st, Math.round(it.x), Math.round(it.z), obj('III.2').q];
    // a elite morta do lado de fora da janela: a chave vem para a área aberta mais perto
    T.campItemSolta('chave-lab', 0, -8.6); T.sim(.1); const fora = [it.st, T.zRoomAt(it.x, it.z), T.zActive().has(T.zRoomAt(it.x, it.z)), Math.round(Math.hypot(it.x, it.z + 8.6))];
    usa('chave-lab', it.x, it.z + .4); const pega2 = it.st;
    poe(p, -7.6, 16); T.sim(.2); // o portador chega à porta B↔D
    const i2 = [obj('III.2').st, obj('III.3').st, T.CAMP.chaves.has('chave-lab'), T.Z.doors.has('BD'), T.campSanTrancado(), !!porta('FD').atalho, T.Z.zint[ic].st];
    poe(p, -18, 9.5); p.money = 3000; T.srvZUse(p, { k: 'door', id: 'FD' }); T.sim(.1); const fd = [T.Z.doors.has('FD'), p.money];
    // III.3: o relatório 31 solta o apito (Estouro nesta rodada)
    usa('san-laboratorio', -25, 17.25); const i3 = [obj('III.3').st, obj('III.4').st, T.CAMP_EVS.id, T.CAMP_EVS.r === T.Z.round];
    // III.4: 75 s somados com alguém dentro da sala D (fora dela o tempo não anda)
    poe(p, -3, 4); T.sim(.1); const a4 = obj('III.4').p; for (let t = 0; t < 5; t += .5) { segura(); T.sim(.5); } const fora4 = obj('III.4').p - a4;
    poe(p, -18, 16); for (let t = 0; t < 40; t += .5) { segura(); T.sim(.5); } const meio = [obj('III.4').st, Math.round(obj('III.4').p * 75)];
    acaba(); const intervalo = obj('III.4').p; T.sim(3); const parado = obj('III.4').p; rodada(); const ev = T.CAMP_EVS.id;
    for (let t = 0; t < 36 && obj('III.4').st === 'ativo'; t += .5) { segura(); T.sim(.5); }
    const i4 = obj('III.4').st;
    T.Z.round = 14; acaba(); const cedo = !!T.CAMP.fim; rodada(); const r15 = [T.Z.round, T.CAMP_EVS.id]; acaba();
    const fim = T.CAMP.fim ? { prox: T.CAMP.fim.prox, troca: T.CAMP.fim.troca } : null, cena = T.CAMP.c.cena?.L.map(x => x[0]).join('|') || '';
    T.sim(T.CAMP.fim.t - window.__simNow + .2); rodada();
    const e1 = T.campEstado();
    return { e0: [e0.et, e0.obj['III.1']?.st, Object.keys(e0.obj)], notas0, kit, round0, hud, trava, i1, elite, cai, pega, solta, fora, pega2, i2, fd, i3, fora4, meio, intervalo, parado, ev, i4, cedo, r15, fim, cena,
      e1: [e1.et, e1.obj['IV.1']?.st, T.Z.round], portas1: ['DI', 'HI', 'HP'].map(d => T.Z.doors.has(d)), notas1: arg.NOTAS.map(nota), salvo: T.campSalvo().dif[1].ato, ouvidos: ouvidos(), trancado1: T.campSanTrancado() };
  }, { NOTAS });
  assert.deepEqual(r.e0, [3, 'ativo', ['III.1', 'III.2', 'III.3', 'III.4']]); assert.deepEqual(r.kit, [4000, 'python', 'm14']); // O3-D15: kit do Ato III com 4000
  assert.deepEqual(r.notas0, [true, true, true, false], 'notas do Ato III aparecem; a da Torre (Ato IV) não');
  assert.equal(r.round0, 11); assert.ok(r.hud.includes('Ler o livro de admissões'), 'HUD com o objetivo: ' + r.hud);
  assert.deepEqual(r.trava.slice(0, 3), [false, false, 5000], 'Laboratório trancado: o host não abre nem cobra');
  assert.deepEqual(r.trava.slice(3, 5), ['door', false]); assert.ok(/Trancada/.test(r.trava[5]) && !/\[/.test(r.trava[5]), 'F mostra trancada, sem preço: ' + r.trava[5]);
  assert.ok(/Enfermeira-chefe/.test(r.trava[6]), 'D↔I também trancada');
  assert.deepEqual(r.i1, ['feito', 'ativo', true, true], 'III.1 lido: III.2 ativo e A↔B aberta de graça');
  assert.deepEqual(r.elite, [true, 10, 1], 'Enfermeira-chefe (Enfermeiro elite) a 40% da rodada');
  assert.deepEqual(r.cai, ['chao', 2, 16, 'chao', 'chao'], 'a chave cai onde ela morreu');
  assert.deepEqual(r.pega, ['levada', 'h', 'h', 'h'], 'quem pega vira portador (HUD de todos)');
  assert.deepEqual(r.solta, ['chao', 1, 14, null], 'portador saiu: a chave fica onde ele estava');
  assert.equal(r.fora[0], 'chao'); assert.equal(r.fora[2], true, 'chave fora da parede vem para uma área aberta: ' + r.fora); assert.ok(r.fora[3] <= 8);
  assert.equal(r.pega2, 'levada');
  assert.deepEqual(r.i2, ['feito', 'ativo', true, true, false, false, 'entregue'], 'entrega: III.3 ativo, B↔D aberta, Laboratório destrancado');
  assert.deepEqual(r.fd, [true, 2000], 'F↔D volta a ser paga (1000)');
  assert.deepEqual(r.i3, ['feito', 'ativo', 'estouro', true], 'relatório 31: III.4 ativo e o Estouro nesta rodada');
  assert.equal(r.fora4, 0, 'fora da sala o tempo não anda'); assert.equal(r.meio[0], 'ativo'); assert.ok(r.meio[1] >= 39 && r.meio[1] <= 41, 'soma 40 s: ' + r.meio[1]);
  assert.equal(r.intervalo, r.parado, 'no intervalo o tempo não anda'); assert.equal(r.i4, 'feito', 'III.4 com 75 s somados');
  assert.equal(r.cedo, false, 'o Ato III não acaba antes da rodada 15'); assert.deepEqual(r.r15, [15, 'estouro'], 'agenda: Estouro na 15');
  assert.deepEqual(r.fim, { prox: 4, troca: false }, 'Ato IV no mesmo mapa'); assert.ok(r.cena.startsWith('No Laboratório'), 'cena c3-fim: ' + r.cena);
  assert.deepEqual(r.e1, [4, 'ativo', 16]); assert.deepEqual(r.portas1, [true, true, true], 'IV.1 abre a cadeia até as Caldeiras');
  assert.deepEqual(r.notas1, [true, true, true, true], 'nota da Torre no Ato IV'); assert.equal(r.salvo, 3, 'Ato IV liberado'); assert.equal(r.trancado1, false);
  for (const id of ['r3-inicio', 'r3-livro', 'r3-chave', 'r3-laboratorio', 'ev-estouro', 'r4-inicio']) assert.ok(r.ouvidos.includes(id), 'rádio ' + id + ' em ' + r.ouvidos.join(','));
  assert.ok(r.ouvidos.indexOf('r3-livro') < r.ouvidos.indexOf('r3-chave') && r.ouvidos.indexOf('r3-chave') < r.ouvidos.indexOf('r3-laboratorio'), 'ordem do rádio');
  assert.deepEqual(J.erros, []);
});

test('Ato IV: Energia, três alas pagas (rádio a cada uma), registro somando com barulho, Relógio na 19; fim leva ao Forno com bagagem', { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, poe, segura, idx, obj, ouve, ouvidos, rodada, acaba, usa, ativa } = H;
    ouve(); window.__ouvidos = [];
    const P = T.ZD.power; poe(p, P.x, P.z - 1); T.srvZUse(p, { k: 'power' }); T.sim(.1);
    const iv1 = [obj('IV.1').st, obj('IV.2').st, ['GH', 'GN', 'AC', 'CK', 'Nr5'].map(d => T.Z.doors.has(d)), ['N', 'K', 'r5'].map(ativa)];
    p.money = 1700; usa('ala-oeste', -28.7, -31); usa('ala-leste', 35.75, 22.3); const duas = [obj('IV.2').st, Math.round(obj('IV.2').p * 3), p.money];
    usa('ala-anel', -99.25, -12.7); const pobre = [T.Z.zint[idx('ala-anel')].st, obj('IV.2').st]; // sem os 1000 pontos
    p.money = 1000; usa('ala-anel', -99.25, -12.7);
    const iv2 = [obj('IV.2').st, obj('IV.3').st, p.money, T.Z.doors.has('KM'), ativa('M'), ouvidos().filter(x => x === 'r4-alas').length];
    // IV.3: segurar F soma (soltar não zera); quem segura chama os zumbis
    const ir = idx('registro-torre'); poe(p, 41, -16.2); const hold = s => { for (let t = 0; t < s; t += .1) { T.srvZHold(p, { k: 'zint', id: ir }); T.sim(.1); } };
    hold(5); const chama = !!T.CAMP.chama && T.CAMP.chama.p === p; T.sim(1); const solto = [T.Z.zint[ir].st, Math.round(T.Z.zint[ir].prog * 10) / 10, Math.round(obj('IV.3').p * 120) / 10, !!T.CAMP.chama];
    hold(7.4); const iv3 = [T.Z.zint[ir].st, T.ZC.zint[ir].st, obj('IV.3').st];
    T.Z.round = 18; acaba(); const cedo = !!T.CAMP.fim; rodada(); const r19 = [T.Z.round, T.CAMP_EVS.id]; acaba();
    const fim = T.CAMP.fim ? { prox: T.CAMP.fim.prox, troca: T.CAMP.fim.troca } : null, cena = T.CAMP.c.cena?.L.map(x => x[0]).join('|') || '';
    p.money = 4321; p.inv.secondary = 'galil_pap'; p.perks = ['jug']; p.maxHp = 250;
    T.sim(T.CAMP.fim.t - window.__simNow + .1); T.sendToHost({ t: 'camp', k: 'pronto' }); T.sim(.2); T.sim(T.Z.phaseEnd - window.__simNow + .2);
    return { iv1, duas, pobre, iv2, chama, solto, iv3, cedo, r19, fim, cena, forno: !!T.MAPS.forno, depois: [T.CAMP.et, T.S.st.map, T.Z.round], bag: [p.money, p.inv.secondary, p.perks.join(), p.maxHp, p.alive],
      ouvidos: ouvidos(), salvo: T.campSalvo().dif[1].ato };
  });
  assert.deepEqual(r.iv1.slice(0, 2), ['feito', 'ativo'], 'Energia ligada: IV.2 ativo'); assert.deepEqual(r.iv1[2], [true, true, true, true, true], 'portas até N, K e r5');
  assert.deepEqual(r.iv1[3], [true, true, true], 'as três alas alcançáveis');
  assert.deepEqual(r.duas, ['ativo', 2, 700], 'duas alas: 2/3, 500 + 500 pagos');
  assert.deepEqual(r.pobre, ['pronto', 'ativo'], 'a ala do anel custa 1000');
  assert.deepEqual(r.iv2, ['feito', 'ativo', 0, true, true, 3], 'três alas: IV.3 ativo, K↔M aberta, rádio a cada ala');
  assert.equal(r.chama, true, 'quem segura o registro chama os zumbis');
  assert.equal(r.solto[0], 'pronto'); assert.ok(r.solto[1] >= 4.5 && r.solto[1] < 7, 'soltar não zera o registro: ' + r.solto[1]); assert.equal(r.solto[2], r.solto[1], 'progresso do IV.3 = tempo somado'); assert.equal(r.solto[3], false);
  assert.deepEqual(r.iv3, ['fechado', 'fechado', 'feito'], 'registro fechado com 12 s somados');
  assert.equal(r.cedo, false, 'o Ato IV não acaba antes da 19'); assert.deepEqual(r.r19, [19, 'relogio'], 'agenda: Contra o relógio na 19');
  assert.ok(r.forno, 'arena Casa do Forno (O3-D11)'); assert.deepEqual(r.fim, { prox: 5, troca: true }, 'fim do Ato IV: etapa C2 no Forno');
  assert.ok(r.cena.startsWith('CASA DO FORNO'), 'cena c4-forno: ' + r.cena);
  assert.deepEqual(r.depois, [5, 'forno', 20], 'Forno na rodada 20'); assert.deepEqual(r.bag, [4321, 'galil_pap', 'jug', 250, true], 'bagagem levada');
  assert.equal(r.salvo, 3);
  for (const id of ['r4-alas', 'r4-registro', 'ev-relogio']) assert.ok(r.ouvidos.includes(id), 'rádio ' + id + ' em ' + r.ouvidos.join(','));
  assert.deepEqual(J.erros, []);
});

test('checkpoint do Ato IV: kit, Energia desligada, portas do Ato III, notas; o time cai e recomeça o Ato IV', { timeout: 300000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, segura, obj, nota, ativa } = H;
    T.campLibera(3, 1); T.S.st = { ...T.S.st, map: 'sanatorio', zmode: 'campanha', ato: 3 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    const ini = { et: T.CAMP.et, round: T.Z.round, money: p.money, inv: [p.inv.primary, p.inv.secondary], perks: p.perks.join(), power: T.Z.power, portas: ['AB', 'BD', 'DI', 'HI', 'HP', 'GH', 'KM'].map(d => T.Z.doors.has(d)),
      iv1: obj('IV.1').st, notas: arg.NOTAS.map(nota), objs: Object.keys(T.campEstado().obj), lab: [ativa('D'), T.campSanTrancado()], reg: T.Z.zint[H.idx('registro-torre')].st };
    T.sim(T.Z.phaseEnd - window.__simNow + .2); segura(); T.campForca('IV.1'); T.campForca('IV.2'); T.sim(.2); const iv3 = obj('IV.3').st;
    p.money = 9999; p.perks = []; p.dwEnd = 0; T.zHurt(p, 1e6, null); T.sim(.2); const over = T.CAMP.over;
    T.campRepetir(); T.sim(.3);
    return { ini, iv3, over, depois: [T.CAMP.et, T.Z.round, p.money, p.inv.secondary, p.perks.join(), T.CAMP.over, obj('IV.1').st, obj('IV.2').st, obj('IV.3').st, T.Z.power, ['GH', 'KM'].map(d => T.Z.doors.has(d))] };
  }, { NOTAS });
  assert.equal(r.ini.et, 4); assert.equal(r.ini.round, 15, 'pré-rodada antes da 16'); assert.equal(r.ini.money, 5000); assert.deepEqual(r.ini.inv, ['python', 'galil']); assert.equal(r.ini.perks, 'jug,speed');
  assert.equal(r.ini.power, false, 'Energia desligada (ligá-la é o IV.1)'); assert.deepEqual(r.ini.portas, [true, true, true, true, true, false, false], 'portas do Ato III (A↔B, B↔D) e as do IV.1');
  assert.equal(r.ini.iv1, 'ativo'); assert.deepEqual(r.ini.notas, [true, true, true, true]); assert.deepEqual(r.ini.objs, ['IV.1', 'IV.2', 'IV.3']);
  assert.deepEqual(r.ini.lab, [true, false], 'Laboratório aberto e destrancado no Ato IV'); assert.equal(r.ini.reg, 'pronto');
  assert.equal(r.iv3, 'ativo'); assert.equal(r.over, true);
  assert.deepEqual(r.depois, [4, 15, 5000, 'galil', 'jug,speed', false, 'ativo', 'oculto', 'oculto', false, [false, false]], 'recomeça o Ato IV com o kit, sem as alas nem a Energia');
  assert.deepEqual(J.erros, []);
});

test('apito pendente: relatório lido no intervalo solta o Estouro na rodada seguinte; rotas: cada objetivo numa área aberta pela história', { timeout: 300000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, poe, segura, obj, rodada, acaba, usa, ativa } = H;
    T.S.st = { ...T.S.st, map: 'sanatorio', zmode: 'campanha', ato: 2 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    T.sim(T.Z.phaseEnd - window.__simNow + .2); segura();
    const sala = (x, z) => T.zRoomAt(x, z), rota = {};
    rota['III.1'] = ativa(sala(-7, 4.25)); T.campForca('III.1'); T.sim(.1);
    rota['III.2'] = ativa(sala(T.CAMP_SAN.entrega.x, T.CAMP_SAN.entrega.z)); T.campForca('III.2'); T.sim(.1);
    rota['III.3'] = ativa(sala(-25, 17.25)) && ativa(sala(T.CAMP_SAN.lab.x, T.CAMP_SAN.lab.z));
    acaba(); const fase = T.Z.phase; usa('san-laboratorio', -25, 17.25);
    const pend = [obj('III.3').st, T.CAMP_EVS.id, !!T.CAMP.obj['III.3'].apitoPend];
    rodada(); const depois = [T.CAMP_EVS.id, T.CAMP_EVS.r === T.Z.round, !!T.CAMP.obj['III.3'].apitoPend, T.Z.round];
    T.campForca('III.4'); T.Z.round = 15; acaba(); T.sim(T.CAMP.fim.t - window.__simNow + .2); segura();
    const P = T.ZD.power; rota['IV.1'] = ativa(sala(P.x, P.z - 1)); T.campForca('IV.1'); T.sim(.1);
    rota['IV.2'] = ['ala-oeste', 'ala-leste', 'ala-anel'].every(id => { const o = T.ZD.zint[H.idx(id)]; return ativa(sala(o.x + o.n[0] * 1.2, o.z + o.n[1] * 1.2)); }); T.campForca('IV.2'); T.sim(.1);
    rota['IV.3'] = ativa(sala(41, -16.2));
    const notas = ['n-enfermaria-dose', 'n-biblioteca-sono', 'n-torre-registro'].map(id => { const o = T.ZD.zint[H.idx(id)]; return ativa(sala(o.x + o.n[0] * .8, o.z + o.n[1] * .8)); });
    return { fase, pend, depois, rota, notas, et: T.CAMP.et };
  });
  assert.equal(r.fase, 'break'); assert.deepEqual(r.pend, ['feito', null, true], 'lido no intervalo: o apito fica pendente');
  assert.deepEqual(r.depois.slice(0, 3), ['estouro', true, false], 'Estouro na rodada seguinte'); assert.equal(r.et, 4);
  assert.deepEqual(r.rota, { 'III.1': true, 'III.2': true, 'III.3': true, 'IV.1': true, 'IV.2': true, 'IV.3': true }, 'cada objetivo numa área aberta pelas portas da história');
  assert.deepEqual(r.notas, [true, true, true], 'notas do caminho alcançáveis pela história (a do Estábulo é opcional, fora da rota)');
  assert.deepEqual(J.erros, []);
});

test('Forte -> Sanatório com bagagem (rodada 11, Ato III trancado, rádio de abertura); infinito sem trava nem interativos da campanha', { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, ouve, ouvidos, rodada, nota } = H;
    const o = { forte: !!T.MAPS.forte };
    T.S.st = { ...T.S.st, map: 'sanatorio', zmode: 'campanha', ato: 2 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    if (o.forte) { T.Z.zs.clear(); T.Z.toSpawn = 0; T.campTrocaMapa(2); T.sim(.1); T.sendToHost({ t: 'camp', k: 'pronto' }); T.sim(.1); T.sim(T.Z.phaseEnd - window.__simNow + .2); o.mapa0 = T.S.st.map; o.et0 = T.CAMP.et; }
    p.money = 7777; p.inv.secondary = 'galil_pap'; p.perks = ['jug', 'speed']; p.maxHp = 250;
    T.Z.zs.clear(); T.Z.toSpawn = 0; T.Z.round = 10; T.campFimEtapa(); o.fim = T.CAMP.fim && { prox: T.CAMP.fim.prox, troca: T.CAMP.fim.troca };
    o.cena = (T.CAMP.c.cena?.L || []).map(x => x[0]).join('|');
    ouve(); window.__ouvidos = [];
    T.sim(T.CAMP.fim.t - window.__simNow + .05); T.sendToHost({ t: 'camp', k: 'pronto' }); T.sim(.1); T.sim(T.Z.phaseEnd - window.__simNow + .2); rodada();
    o.depois = [T.S.st.map, T.CAMP.et, T.Z.round, T.campEstado().obj['III.1']?.st, T.campSanTrancado(), !!T.ZC.world.zint[H.idx('registro-torre')]?.off];
    o.bag = [p.money, p.inv.secondary, p.perks.join(), p.maxHp]; o.ouvidos = ouvidos(); o.notas = arg.NOTAS.map(nota);
    // infinito no Sanatório: nada do Ato III (sem trava, interativos { off: 1 }, notas desligadas)
    T.S.st = { ...T.S.st, map: 'sanatorio', zmode: 'infinito', ato: 0 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.3);
    const ir = H.idx('registro-torre'); o.inf = [T.CAMP.on, T.CAMP.modo, T.campSanTrancado(), !!T.ZD.doors.find(d => d.id === 'BD').atalho, T.ZINT_FN.registro.prompt(T.ZD.zint[ir], ir, T.ZC.zint[ir], T.ZINT.registro), arg.NOTAS.map(nota).some(Boolean), Object.keys(T.CAMP.obj).length];
    return o;
  }, { NOTAS });
  if (r.forte) { assert.equal(r.mapa0, 'forte'); assert.equal(r.et0, 2); }
  assert.deepEqual(r.fim, { prox: 3, troca: true }); if (r.forte) assert.ok(r.cena.includes('SANATÓRIO SANTA INÊS'), 'cenas c2-fim + c3-abertura: ' + r.cena);
  assert.deepEqual(r.depois, ['sanatorio', 3, 11, 'ativo', true, false], 'Sanatório, Ato III, rodada 11, Laboratório trancado, registro montado');
  assert.deepEqual(r.bag, [7777, 'galil_pap', 'jug,speed', 250], 'bagagem levada');
  assert.ok(r.ouvidos.includes('r3-inicio'), 'rádio de abertura do Ato III: ' + r.ouvidos.join(','));
  assert.deepEqual(r.notas, [true, true, true, false]);
  assert.deepEqual(r.inf, [true, 'infinito', false, false, null, false, 0], 'infinito: sem trava, registro inerte, sem notas nem objetivos do Sanatório');
  assert.deepEqual(J.erros, []);
});
