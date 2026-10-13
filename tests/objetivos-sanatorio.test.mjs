// Objetivos do Sanatório no modo zumbi (antigos Atos III e IV; decisão do dono de 13/10: objetivos dentro do mapa, sem troca de mapa,
// cena, kit nem checkpoint). Jogados de ponta a ponta pelo host desde a rodada 1 (500 pontos, M1911), nas 4 dificuldades: livro da
// Recepção, a Enfermeira-chefe (elite que nasce sozinha a 40% da rodada, mesmo antes da estreia do Enfermeiro), a chave no chão, o
// portador que sai, a chave que cai fora do campo, a entrega diante do Laboratório, o relatório 31 que solta o apito, segurar o
// Laboratório, a Energia nas Caldeiras (no lugar, sem peças), as três alas pagas, o registro da Torre somando o tempo, a passagem
// III -> IV e IV -> Foguista (C2, de outro bloco: só confere que a etapa troca). Também: a trava do Laboratório (host, F e a visão do
// cliente), o jogador de fora (cliente falso) lendo, pegando, saindo com a chave e comprando a porta trancada, o apito pendente, as
// rotas sem softlock, a Energia e as alas feitas antes da hora, o registro sem F antes do objetivo, e o clássico e o infinito sem nada.
// Rodar: node --test --test-concurrency=1 tests/objetivos-sanatorio.test.mjs (não depende de ZV2_OBJ: cada teste escolhe o modo)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); }, { timeout: 120000 });
after(async () => { await J?.fechar(); });

const PREP = `(T => {
  const p = T.S.players.get('h');
  const poe = (q, x, z) => { q.pos = [x, 0, z]; if (q === p) { T.me.pos.set(x, 0, z); T.me.vel.set(0, 0, 0); } };
  const segura = () => { T.Z.toSpawn = 50; T.Z.spawnT = 1e12; for (const z of [...T.Z.zs.values()]) if (!z.elite) T.Z.zs.delete(z.id); p.dwEnd = 1e12; p.hp = p.maxHp; };
  const idx = id => T.ZD.zint.findIndex(o => o.id === id);
  const obj = id => T.campEstado().obj[id];
  const sts = () => Object.entries(T.campEstado().obj).map(([k, v]) => k + ':' + v.st).join(' ');
  const etapa = () => T.CAMP_ATOS[T.CAMP.et]?.id ?? null;
  const ouve = () => { const q = T.CAMP.c.radioQ; if (!q.__ouve) { q.__ouve = 1; q.push = function (...a) { (window.__ouvidos ||= []).push(...a.map(x => x[1])); return Array.prototype.push.apply(this, a); }; } };
  const ouvidos = () => window.__ouvidos || [];
  const rodada = () => { if (T.Z.phase !== 'round') { T.Z.phaseEnd = window.__simNow; T.sim(.05); } segura(); }; // começa a próxima rodada já
  const acaba = () => { T.Z.toSpawn = 0; T.Z.zs.clear(); T.sim(.1); }; // a rodada acaba de verdade (zEndRound -> campFimRodada)
  const nota = id => T.zintNotaLigada(T.ZD.zint[idx(id)]);
  const porta = id => T.ZD.doors.find(d => d.id === id);
  const usa = (id, x, z) => { poe(p, x, z); T.srvZUse(p, { k: 'zint', id: idx(id) }); T.sim(.1); };
  const ativa = id => T.zActive().has(id);
  const prompt = (x, z) => { poe(p, x, z); T.sim(.1); return T.ZC.act ? { ...T.ZC.act } : null; };
  const comeca = dif => { delete window.__semObjetivos; T.S.st = { ...T.S.st, map: 'sanatorio', zmode: 'campanha', ato: 0, zdiff: dif }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1); };
  // joga de verdade (zumbis nascendo), matando os comuns e mantendo o host de pé, até cond()
  const joga = (cond, max = 300) => { for (let t = 0; t < max; t += .25) { p.hp = p.maxHp; p.dwEnd = 1e12; p.downed = false; if (cond()) return t;
    for (const z of [...T.Z.zs.values()]) if (!z.elite && z.st === 'in' && !z.chefeC) T.zHit(p, z.id, 1e9, 'head', 'm1911', false);
    if (T.Z.phase !== 'round' && T.Z.phaseEnd > window.__simNow + 1) T.Z.phaseEnd = window.__simNow + .3; T.sim(.25); } return -1; };
  const mataElite = () => { const el = T.CAMP_ZK2S.elite; let n = 0; while (el && T.Z.zs.has(el.id) && n++ < 2000) { p.hp = p.maxHp; T.zHit(p, el.id, 150, 'body', 'm1911', false); T.sim(.05); } return el; };
  return { p, poe, segura, idx, obj, sts, etapa, ouve, ouvidos, rodada, acaba, nota, porta, usa, ativa, prompt, comeca, joga, mataElite };
})`;
const prep = `const H = (new Function('return ' + arg.PREP)())(T);`;
const em = fn => `(T, arg) => { ${prep} return (${fn})(T, arg, H); }`;
const rodar = (fn, a = {}) => J.page.evaluate(([src, arg]) => (new Function('T', 'arg', `return (${src})(T, arg)`))(window.__T, arg), [em(fn.toString()), { PREP, ...a }]);
const NOTAS = ['n-enfermaria-dose', 'n-estabulo-fermino', 'n-biblioteca-sono', 'n-torre-registro'];
const SEM_CAMPANHA = /campanha|\bato\b|\batos\b/i; // nada na tela fala em campanha nem em atos

test('clássico: nada dos objetivos no Sanatório (registro e chave { off: 1 }, notas desligadas, Laboratório com portas pagas comuns)', { timeout: 180000 }, async () => {
  await J.page.evaluate(() => { window.__semObjetivos = true; });
  await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 });
  const r = await rodar((T, arg, { p, poe, segura, idx, nota, porta }) => {
    segura();
    const off = ['registro-torre', 'chave-lab'].map(id => !!T.ZC.world.zint[idx(id)]?.off);
    const notas = arg.NOTAS.map(nota), bd = porta('BD'), trava = [!!bd.atalho, bd.trava ?? null, T.campSanTrancado()];
    poe(p, -7.5, 16); p.money = 1500; T.srvZUse(p, { k: 'door', id: 'BD' }); T.sim(.1);
    const comprou = [T.Z.doors.has('BD'), p.money]; T.campSanTick(); T.sim(.2);
    return { zmode: T.S.st.zmode, on: T.CAMP.on, off, notas, trava, comprou, obj: Object.keys(T.CAMP.obj).length, ids: ['registro-torre', 'chave-lab', ...arg.NOTAS].map(idx) };
  }, { NOTAS });
  assert.equal(r.zmode, 'classico'); assert.equal(r.on, false); assert.deepEqual(r.off, [true, true], 'interativos dos objetivos desligados no clássico');
  assert.deepEqual(r.notas, [false, false, false, false]); assert.deepEqual(r.trava, [false, null, false], 'porta B↔D sem trava no clássico');
  assert.deepEqual(r.comprou, [true, 500], 'B↔D continua custando 1000 no clássico'); assert.equal(r.obj, 0); assert.ok(r.ids.every(i => i >= 0));
  assert.deepEqual(J.erros, []);
});

test('modo único: o Sanatório começa na rodada 1 como o clássico (500, M1911), com o livro ativo, o Laboratório trancado e sem falar em campanha', { timeout: 180000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, idx, obj, nota, porta, prompt, comeca, ouve, ouvidos, joga } = H;
    const form = {}; delete window.__semObjetivos; T.campForm0(form); // o formulário do menu: um modo só (objetivos)
    comeca(1); ouve(); window.__ouvidos = [];
    const e0 = T.campEstado(), ini = { zmode: T.S.st.zmode, modo: T.CAMP.modo, etapa: H.etapa(), cadeia: T.CAMP.cadeia.map(e => T.CAMP_ATOS[e].id), round: T.Z.round, money: p.money, inv: [p.inv.primary, p.inv.secondary], power: T.Z.power, pecas: T.ZD.pecas };
    joga(() => T.Z.phase === 'round' && T.Z.round === 1, 30);
    H.poe(p, -3, -4); T.sim(.2); const marca = document.querySelector('#campMark')?.textContent || '';
    const hud = document.querySelector('#campObj')?.textContent || '', banner = [...document.querySelectorAll('#zhud *')].map(e => e.textContent).join(' ');
    // a trava do Laboratório: o host recusa a porta paga e o F mostra "Trancada", sem preço
    p.money = 5000; const act = prompt(-7.5, 16); T.srvZUse(p, { k: 'door', id: 'BD' }); T.srvZUse(p, { k: 'door', id: 'FD' }); T.sim(.1);
    const trava = [T.Z.doors.has('BD'), T.Z.doors.has('FD'), p.money, act?.k, act?.ok, act?.txt, T.zintPortaTrava(porta('DI'), true)];
    const reg = prompt(41, -16.2)?.txt ?? null; // o registro da Torre não mostra F antes do objetivo dele
    return { form: form.zmode, marca, ini, obj: Object.fromEntries(Object.entries(e0.obj).map(([k, v]) => [k, v.st])), notas: arg.NOTAS.map(nota), hud, banner, trava, reg, ouvidos: ouvidos(), off: !!T.ZC.world.zint[idx('registro-torre')]?.off };
  }, { NOTAS });
  assert.equal(r.form, 'campanha', 'o menu escolhe o modo dos objetivos');
  assert.deepEqual(r.ini, { zmode: 'campanha', modo: 'campanha', etapa: 'III', cadeia: ['III', 'IV', 'C2', 'V'], round: 0, money: 500, inv: ['m1911', null], power: false, pecas: r.ini.pecas }, 'começo do clássico, primeira etapa III');
  assert.deepEqual(r.obj, { 'III.1': 'ativo', 'III.2': 'oculto', 'III.3': 'oculto', 'III.4': 'oculto' });
  assert.deepEqual(r.notas, [true, true, true, false], 'notas do livro em diante aparecem; a da Torre (registro) não');
  assert.ok(r.hud.includes('Ler o livro de admissões'), 'painel com o objetivo: ' + r.hud); assert.ok(!SEM_CAMPANHA.test(r.hud), 'painel sem "campanha"/"ato": ' + r.hud);
  assert.ok(!SEM_CAMPANHA.test(r.banner), 'HUD sem "campanha"/"ato"');
  assert.ok(/^.?LIVRO DE ADMISSÕES \d+m$/.test(r.marca), 'seta com o texto curto (sem cortar no meio): ' + r.marca);
  assert.deepEqual(r.trava.slice(0, 3), [false, false, 5000], 'Laboratório trancado: o host não abre nem cobra');
  assert.deepEqual(r.trava.slice(3, 5), ['door', false]); assert.ok(/Trancada/.test(r.trava[5]) && !/\[/.test(r.trava[5]), 'F mostra trancada, sem preço: ' + r.trava[5]);
  assert.ok(/Enfermeira-chefe/.test(r.trava[6]), 'D↔I também trancada');
  assert.equal(r.off, false, 'registro montado'); assert.equal(r.reg, null, 'sem F no registro antes do objetivo dele');
  assert.ok(r.ouvidos.includes('r3-inicio'), 'rádio de abertura na rodada 1: ' + r.ouvidos.join(','));
  assert.deepEqual(J.erros, []);
});

test('Normal: livro, Enfermeira-chefe na rodada 1, chave no chão, entrega, relatório e apito, segurar o Laboratório, Energia, alas, registro; troca para o Foguista', { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, poe, segura, idx, obj, sts, etapa, ouve, ouvidos, rodada, acaba, nota, usa, ativa, prompt, comeca, joga, mataElite } = H;
    comeca(1); ouve(); window.__ouvidos = [];
    joga(() => T.Z.phase === 'round', 30); const round0 = T.Z.round;
    // III.1: o livro de admissões (F no terminal da Recepção, na sala do começo)
    const livro = prompt(-7, 4.25)?.txt; usa('san-recepcao', -7, 4.25); const i1 = [obj('III.1').st, obj('III.2').st, T.Z.doors.has('AB'), ativa('B')];
    // III.2: a Enfermeira-chefe nasce sozinha a 40% da rodada (antes da estreia do Enfermeiro), foge e solta a chave ao morrer
    const tEl = joga(() => T.CAMP_ZK2S.elite, 240), el = T.CAMP_ZK2S.elite, elite = [tEl >= 0, T.Z.round, el?.kind, el?.elite, el && T.Z.zs.has(el.id)];
    mataElite(); const it = T.CAMP.itens['chave-lab'], ic = idx('chave-lab');
    const cai = [it.st, T.Z.zint[ic].st, T.ZC.zint[ic].st, ativa(T.zRoomAt(it.x, it.z)), Math.round(T.ZD.zint[ic].x) === Math.round(it.x)];
    poe(p, it.x + .4, it.z); T.srvZUse(p, { k: 'zint', id: ic }); T.sim(.1); const pega = [it.st, it.quem, obj('III.2').q, T.CAMP.c.obj['III.2']?.q];
    // quem carrega sai (ou cai): a chave fica no chão onde ele estava
    poe(p, 1, 14); T.sim(.1); it.quem = 'saiu'; T.sim(.1); const solta = [it.st, Math.round(it.x), Math.round(it.z), obj('III.2').q];
    // a elite morta do lado de fora da janela: a chave vem para a área aberta mais perto
    T.campItemSolta('chave-lab', 0, -8.6); T.sim(.1); const fora = [it.st, T.zActive().has(T.zRoomAt(it.x, it.z)), Math.round(Math.hypot(it.x, it.z + 8.6))];
    usa('chave-lab', it.x, it.z + .4); const pega2 = it.st;
    poe(p, -7.6, 16); T.sim(.2); // o portador chega diante da porta B↔D
    const i2 = [obj('III.2').st, obj('III.3').st, T.CAMP.chaves.has('chave-lab'), T.Z.doors.has('BD'), T.campSanTrancado(), !!H.porta('FD').atalho, T.Z.zint[ic].st];
    poe(p, -18, 9.5); p.money = 3000; T.srvZUse(p, { k: 'door', id: 'FD' }); T.sim(.1); const fd = [T.Z.doors.has('FD'), p.money];
    // III.3: o relatório 31 solta o apito (Estouro nesta rodada)
    const ev0 = T.CAMP_EVS.id; usa('san-laboratorio', -25, 17.25); const i3 = [obj('III.3').st, obj('III.4').st, ev0, T.CAMP_EVS.id, T.CAMP_EVS.r === T.Z.round];
    // III.4: 75 s somados com alguém dentro da sala D (fora dela e no intervalo o tempo não anda)
    poe(p, -3, 4); T.sim(.1); const a4 = obj('III.4').p; for (let t = 0; t < 5; t += .5) { segura(); T.sim(.5); } const fora4 = obj('III.4').p - a4;
    poe(p, -18, 16); for (let t = 0; t < 40; t += .5) { segura(); T.sim(.5); } const meio = [obj('III.4').st, Math.round(obj('III.4').p * 75)];
    acaba(); const intervalo = obj('III.4').p; T.sim(3); const parado = obj('III.4').p; rodada();
    for (let t = 0; t < 36 && obj('III.4').st === 'ativo'; t += .5) { segura(); T.sim(.5); }
    const i4 = [obj('III.4').st, etapa()]; const rIII = T.Z.round; acaba();
    // III -> IV no fim da rodada: portas até as Caldeiras, nota da Torre, Laboratório destrancado
    const e1 = [etapa(), sts(), T.Z.phase, T.Z.round === rIII], portas1 = ['DI', 'HI', 'HP'].map(d => T.Z.doors.has(d)), notas1 = arg.NOTAS.map(nota), trancado1 = T.campSanTrancado();
    rodada();
    // IV.1: a Energia fica no lugar e não tem peças
    const P = T.ZD.power, pw = prompt(P.x, P.z - 1); T.srvZUse(p, { k: 'power' }); T.sim(.1);
    const iv1 = [pw?.k, pw?.ok !== false, T.Z.power, obj('IV.1').st, obj('IV.2').st, ['GH', 'GN', 'AC', 'CK', 'Nr5'].map(d => T.Z.doors.has(d)), ['N', 'K', 'r5'].map(ativa)];
    // IV.2: três alas pagas (500, 500, 1000), rádio a cada uma
    p.money = 1700; usa('ala-oeste', -28.7, -31); usa('ala-leste', 35.75, 22.3); const duas = [obj('IV.2').st, Math.round(obj('IV.2').p * 3), p.money];
    const anelTxt = prompt(-99.25, -12.7)?.txt; usa('ala-anel', -99.25, -12.7); const pobre = [T.Z.zint[idx('ala-anel')].st, obj('IV.2').st]; // sem os 1000 pontos
    p.money = 1000; usa('ala-anel', -99.25, -12.7);
    const iv2 = [obj('IV.2').st, obj('IV.3').st, p.money, T.Z.doors.has('KM'), ativa('M'), ouvidos().filter(x => x === 'r4-alas').length];
    // IV.3: segurar F soma (soltar não zera); quem segura chama os zumbis
    const ir = idx('registro-torre'), regTxt = prompt(41, -16.2)?.txt; const hold = s => { for (let t = 0; t < s; t += .1) { segura(); T.srvZHold(p, { k: 'zint', id: ir }); T.sim(.1); } };
    hold(5); const chama = !!T.CAMP.chama && T.CAMP.chama.p === p; T.sim(1); const solto = [T.Z.zint[ir].st, Math.round(T.Z.zint[ir].prog * 10) / 10, Math.round(obj('IV.3').p * 120) / 10, !!T.CAMP.chama];
    hold(7.4); const iv3 = [T.Z.zint[ir].st, T.ZC.zint[ir].st, obj('IV.3').st, etapa()];
    acaba(); const depois = [etapa(), T.CAMP.modo, Object.values(T.campEstado().obj).some(o => o.st === 'ativo')];
    const hud = document.querySelector('#campObj')?.textContent || '';
    return { round0, livro, i1, elite, cai, pega, solta, fora, pega2, i2, fd, i3, fora4, meio, intervalo, parado, i4, e1, portas1, notas1, trancado1, iv1, duas, anelTxt, pobre, iv2, regTxt, chama, solto, iv3, depois, hud, ouvidos: ouvidos() };
  }, { NOTAS });
  assert.equal(r.round0, 1); assert.equal(r.livro, 'Ler o terminal');
  assert.deepEqual(r.i1, ['feito', 'ativo', true, true], 'III.1 lido: III.2 ativo e A↔B aberta de graça');
  assert.deepEqual(r.elite, [true, 1, 10, 1, true], 'Enfermeira-chefe (Enfermeiro elite) já na rodada 1');
  assert.deepEqual(r.cai, ['chao', 'chao', 'chao', true, true], 'a chave cai numa área aberta, host e cliente');
  assert.deepEqual(r.pega, ['levada', 'h', 'h', 'h'], 'quem pega vira portador (painel de todos)');
  assert.deepEqual(r.solta, ['chao', 1, 14, null], 'portador saiu: a chave fica onde ele estava');
  assert.deepEqual(r.fora.slice(0, 2), ['chao', true], 'chave fora da parede vem para uma área aberta'); assert.ok(r.fora[2] <= 8);
  assert.equal(r.pega2, 'levada');
  assert.deepEqual(r.i2, ['feito', 'ativo', true, true, false, false, 'entregue'], 'entrega: III.3 ativo, B↔D aberta, Laboratório destrancado');
  assert.deepEqual(r.fd, [true, 2000], 'F↔D volta a ser paga (1000)');
  assert.deepEqual(r.i3.slice(0, 2), ['feito', 'ativo'], 'relatório 31: III.4 ativo');
  if (r.i3[2] === null) assert.deepEqual(r.i3.slice(3), ['estouro', true], 'o apito solta o Estouro nesta rodada'); // (rodada com evento da agenda: fica pendente, ver o teste do apito)
  assert.equal(r.fora4, 0, 'fora da sala o tempo não anda'); assert.equal(r.meio[0], 'ativo'); assert.ok(r.meio[1] >= 39 && r.meio[1] <= 41, 'soma 40 s: ' + r.meio[1]);
  assert.equal(r.intervalo, r.parado, 'no intervalo o tempo não anda'); assert.deepEqual(r.i4, ['feito', 'III'], 'III.4 com 75 s; a etapa só troca no fim da rodada');
  assert.deepEqual(r.e1.slice(0, 3), ['IV', 'IV.1:ativo IV.2:oculto IV.3:oculto', 'break'], 'III -> IV no fim da rodada, sem cena nem rodada mínima'); assert.ok(r.e1[3]);
  assert.deepEqual(r.portas1, [true, true, true], 'IV.1 abre a cadeia até as Caldeiras'); assert.deepEqual(r.notas1, [true, true, true, true], 'nota da Torre no IV');
  assert.equal(r.trancado1, false);
  assert.deepEqual(r.iv1.slice(0, 5), ['power', true, true, 'feito', 'ativo'], 'Energia no lugar, sem peças: liga e fecha o IV.1');
  assert.deepEqual(r.iv1[5], [true, true, true, true, true], 'portas até N, K e r5'); assert.deepEqual(r.iv1[6], [true, true, true], 'as três alas alcançáveis');
  assert.deepEqual(r.duas, ['ativo', 2, 700], 'duas alas: 2/3, 500 + 500 pagos');
  assert.equal(r.anelTxt, 'Ligar o Anel externo [1000]');
  assert.deepEqual(r.pobre, ['pronto', 'ativo'], 'a ala do anel custa 1000');
  assert.deepEqual(r.iv2, ['feito', 'ativo', 0, true, true, 3], 'três alas: IV.3 ativo, K↔M aberta, rádio a cada ala');
  assert.equal(r.regTxt, 'Segure F — fechar o registro (faz barulho)');
  assert.equal(r.chama, true, 'quem segura o registro chama os zumbis');
  assert.equal(r.solto[0], 'pronto'); assert.ok(r.solto[1] >= 4.5 && r.solto[1] < 7, 'soltar não zera o registro: ' + r.solto[1]); assert.equal(r.solto[2], r.solto[1], 'progresso do IV.3 = tempo somado'); assert.equal(r.solto[3], false);
  assert.deepEqual(r.iv3, ['fechado', 'fechado', 'feito', 'IV'], 'registro fechado com 12 s somados');
  assert.deepEqual(r.depois, ['C2', 'campanha', true], 'fim do IV: a etapa do Foguista começa no mesmo mapa');
  assert.ok(!SEM_CAMPANHA.test(r.hud), 'painel sem "campanha"/"ato": ' + r.hud);
  for (const id of ['r3-inicio', 'r3-livro', 'r3-chave', 'r3-laboratorio', 'ev-estouro', 'r4-inicio', 'r4-alas', 'r4-registro']) assert.ok(r.ouvidos.includes(id), 'rádio ' + id + ' em ' + r.ouvidos.join(','));
  assert.ok(r.ouvidos.indexOf('r3-livro') < r.ouvidos.indexOf('r3-chave') && r.ouvidos.indexOf('r3-chave') < r.ouvidos.indexOf('r3-laboratorio'), 'ordem do rádio');
  assert.deepEqual(J.erros, []);
});

for (const dif of [0, 2, 3]) test(`dificuldade ${dif}: a sequência inteira desde a rodada 1, com a elite nascendo sozinha, até a etapa do Foguista`, { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, poe, idx, obj, etapa, usa, comeca, joga, mataElite } = H;
    comeca(arg.dif); const log = [[T.Z.round, p.money, p.inv.primary, etapa()]];
    joga(() => T.Z.phase === 'round', 30); usa('san-recepcao', -7, 4.25); log.push(obj('III.2').st);
    const t = joga(() => T.CAMP_ZK2S.elite, 240); log.push([t >= 0, T.CAMP_ZK2S.elite?.kind]); mataElite();
    const it = T.CAMP.itens['chave-lab']; log.push(it.st); poe(p, it.x + .3, it.z); T.srvZUse(p, { k: 'zint', id: idx('chave-lab') }); T.sim(.1);
    poe(p, -7.6, 16); T.sim(.2); log.push(obj('III.2').st);
    usa('san-laboratorio', -25, 17.25); log.push(obj('III.3').st);
    poe(p, -18, 16); log.push(joga(() => etapa() === 'IV', 900) >= 0);
    const P = T.ZD.power; poe(p, P.x, P.z - 1); T.srvZUse(p, { k: 'power' }); T.sim(.2); log.push(obj('IV.1').st);
    p.money = 2000; for (const [id, x, z] of [['ala-oeste', -28.7, -31], ['ala-leste', 35.75, 22.3], ['ala-anel', -99.25, -12.7]]) usa(id, x, z); log.push(obj('IV.2').st);
    const ir = idx('registro-torre'); poe(p, 41, -16.2); for (let s = 0; s < 13; s += .1) { p.hp = p.maxHp; T.srvZHold(p, { k: 'zint', id: ir }); T.sim(.1); } log.push(obj('IV.3').st);
    log.push(joga(() => etapa() === 'C2', 900) >= 0);
    return log;
  }, { dif });
  assert.deepEqual(r[0], [0, [1500, 500, 500, 500][dif], 'm1911', 'III'], 'começo do clássico da dificuldade');
  assert.deepEqual(r.slice(1), ['ativo', [true, 10], 'chao', 'feito', 'feito', true, 'feito', 'feito', 'feito', true]);
  assert.deepEqual(J.erros, []);
});

test('jogador de fora (cliente falso): lê o livro, não abre o Laboratório, pega a chave, sai com ela (fica no chão), vê a trava como o host', { timeout: 300000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, poe, segura, idx, obj, comeca, rodada } = H;
    comeca(1); rodada();
    const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; }, peerConnection: null };
    T.srvOnData(c, { t: 'join', v: 2, pv: 6, name: 'Cliente' }); const q = T.S.players.get(c.pid); if (!q) return { semJogador: true };
    q.alive = true; q.downed = false; q.dwEnd = 1e12; T.sim(.2); segura();
    const cli = () => { const h = T.NET.isHost; T.NET.isHost = false; try { return T.campSanTrancado(); } finally { T.NET.isHost = h; } }; // a regra do lado do cliente (CAMP.c)
    const t0 = [T.campSanTrancado(), cli()];
    poe(q, -7, 4.25); T.srvOnData(c, { t: 'use', k: 'zint', id: idx('san-recepcao') }); T.sim(.1); const i1 = obj('III.1').st;
    q.money = 5000; poe(q, -7.5, 16); T.srvOnData(c, { t: 'use', k: 'door', id: 'BD' }); T.sim(.1); const bd = [T.Z.doors.has('BD'), q.money];
    T.campItemSolta('chave-lab', -3, 8); T.sim(.1); const ic = idx('chave-lab');
    poe(q, -3, 8.4); T.srvOnData(c, { t: 'use', k: 'zint', id: ic }); T.sim(.1); const it = T.CAMP.itens['chave-lab'], pega = [it.st, it.quem === q.id, T.CAMP.c.obj['III.2'].q === q.id];
    poe(q, -2, 12); T.sim(.1); T.srvDrop(c); T.sim(.3); const saiu = [it.st, Math.round(it.x), Math.round(it.z), T.ZC.zint[ic].st, Math.round(T.ZD.zint[ic].x), Math.round(T.ZD.zint[ic].z)];
    const msgs = c.out.filter(m => m.t === 'camp').map(m => m.k + (m.id ? ':' + m.id + ':' + m.st : ''));
    poe(p, -2, 12.4); T.srvZUse(p, { k: 'zint', id: ic }); T.sim(.1); poe(p, -7.6, 16); T.sim(.2);
    const t1 = [T.campSanTrancado(), cli(), obj('III.2').st];
    return { t0, i1, bd, pega, saiu, msgs, t1 };
  });
  assert.ok(!r.semJogador, 'cliente falso entrou');
  assert.deepEqual(r.t0, [true, true], 'trancado no host e na visão do cliente');
  assert.equal(r.i1, 'feito', 'o livro lido pelo cliente conta');
  assert.deepEqual(r.bd, [false, 5000], 'o cliente não abre nem paga a porta trancada');
  assert.deepEqual(r.pega, ['levada', true, true], 'o cliente vira portador');
  assert.deepEqual(r.saiu, ['chao', -2, 12, 'chao', -2, 12], 'o cliente saiu: a chave fica no chão onde ele estava (host e cliente)');
  assert.ok(r.msgs.includes('obj:III.1:feito') && r.msgs.includes('obj:III.2:ativo'), 'o cliente recebe os objetivos: ' + r.msgs.join(','));
  assert.deepEqual(r.t1, [false, false, 'feito'], 'entregue: destrancado no host e no cliente');
  assert.deepEqual(J.erros, []);
});

test('apito pendente, rotas sem softlock, Energia e alas antes da hora, registro sem F antes do IV.3 e etapa que acaba no intervalo', { timeout: 300000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, poe, segura, idx, obj, etapa, rodada, acaba, usa, ativa, prompt, comeca } = H;
    comeca(1); rodada();
    const sala = (x, z) => T.zRoomAt(x, z), rota = {};
    rota['III.1'] = ativa(sala(-7, 4.25)); T.campForca('III.1'); T.sim(.1);
    rota['III.2'] = ativa(sala(T.CAMP_SAN.entrega.x, T.CAMP_SAN.entrega.z)); T.campForca('III.2'); T.sim(.1);
    rota['III.3'] = ativa(sala(-25, 17.25)) && ativa(sala(T.CAMP_SAN.lab.x, T.CAMP_SAN.lab.z));
    acaba(); const fase = T.Z.phase; usa('san-laboratorio', -25, 17.25);
    const pend = [obj('III.3').st, T.CAMP_EVS.id, !!T.CAMP.obj['III.3'].apitoPend];
    rodada(); const depois = [T.CAMP_EVS.id, T.CAMP_EVS.r === T.Z.round, !!T.CAMP.obj['III.3'].apitoPend];
    // Energia e uma ala ligadas antes do IV (o time comprou o caminho): o IV.1 fecha na hora e a ala já conta
    for (const d of ['AC', 'CK', 'BE', 'BJ', 'IJ', 'JL', 'KL', 'KM', 'HI', 'HP', 'GH', 'FG', 'AF', 'GN']) T.zAbrePorta(d, null);
    T.sim(.1); const reg0 = prompt(41, -16.2)?.txt ?? null; const ir = idx('registro-torre');
    for (let s = 0; s < 2; s += .1) { T.srvZHold(p, { k: 'zint', id: ir }); T.sim(.1); } const reg0st = [T.Z.zint[ir].st, !!T.CAMP.chama];
    const P = T.ZD.power; poe(p, P.x, P.z - 1); T.srvZUse(p, { k: 'power' }); T.sim(.1); p.money = 600; usa('ala-oeste', -28.7, -31);
    const antes = [T.Z.power, T.Z.zint[idx('ala-oeste')].st, etapa()];
    T.campForca('III.4'); acaba(); const iv = [etapa(), obj('IV.1').st, obj('IV.2').st, Math.round(obj('IV.2').p * 3)];
    rodada();
    rota['IV.1'] = ativa(sala(P.x, P.z - 1));
    rota['IV.2'] = ['ala-oeste', 'ala-leste', 'ala-anel'].every(id => { const o = T.ZD.zint[idx(id)]; return ativa(sala(o.x + o.n[0] * 1.2, o.z + o.n[1] * 1.2)); }); T.campForca('IV.2'); T.sim(.1);
    rota['IV.3'] = ativa(sala(41, -16.2));
    const notas = ['n-enfermaria-dose', 'n-biblioteca-sono', 'n-torre-registro'].map(id => { const o = T.ZD.zint[idx(id)]; return ativa(sala(o.x + o.n[0] * .8, o.z + o.n[1] * .8)); });
    // o registro fechado no intervalo já libera a etapa seguinte (sem esperar a próxima rodada inteira)
    acaba(); T.Z.phaseEnd = window.__simNow + 60; const fase2 = T.Z.phase; const reg1 = prompt(41, -16.2)?.txt ?? null;
    for (let s = 0; s < 13; s += .1) { p.hp = p.maxHp; T.srvZHold(p, { k: 'zint', id: ir }); T.sim(.1); }
    const fim = [fase2, T.Z.phase, obj('IV.3')?.st ?? null, etapa()];
    return { fase, pend, depois, reg0, reg0st, antes, iv, rota, notas, reg1, fim };
  });
  assert.equal(r.fase, 'break'); assert.deepEqual(r.pend, ['feito', null, true], 'lido no intervalo: o apito fica pendente');
  assert.deepEqual(r.depois, ['estouro', true, false], 'Estouro na rodada seguinte');
  assert.equal(r.reg0, null, 'registro sem F antes do IV.3'); assert.deepEqual(r.reg0st, ['pronto', false], 'segurar antes do IV.3 não mexe nem chama');
  assert.deepEqual(r.antes, [true, 'ligado', 'III'], 'Energia e Ala Oeste ligadas ainda no III');
  assert.deepEqual(r.iv, ['IV', 'feito', 'ativo', 1], 'IV.1 fecha na hora e a ala já ligada conta no IV.2');
  assert.deepEqual(r.rota, { 'III.1': true, 'III.2': true, 'III.3': true, 'IV.1': true, 'IV.2': true, 'IV.3': true }, 'cada objetivo numa área aberta pelas portas da história');
  assert.deepEqual(r.notas, [true, true, true], 'notas do caminho alcançáveis (a do Estábulo é opcional, fora da rota)');
  assert.equal(r.reg1, 'Segure F — fechar o registro (faz barulho)');
  assert.deepEqual(r.fim, ['break', 'break', null, 'C2'], 'IV.3 fechado no intervalo: a etapa do Foguista começa no mesmo intervalo');
  assert.deepEqual(J.erros, []);
});

test('infinito no Sanatório: sem trava, registro inerte, sem notas nem objetivos', { timeout: 300000 }, async () => {
  const r = await rodar((T, arg, H) => {
    T.S.st = { ...T.S.st, map: 'sanatorio', zmode: 'infinito', ato: 0 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.3);
    const ir = H.idx('registro-torre');
    return [T.CAMP.on, T.CAMP.modo, T.campSanTrancado(), !!H.porta('BD').atalho, T.ZINT_FN.registro.prompt(T.ZD.zint[ir], ir, T.ZC.zint[ir], T.ZINT.registro), arg.NOTAS.map(H.nota).some(Boolean), Object.keys(T.CAMP.obj).length];
  }, { NOTAS });
  assert.deepEqual(r, [true, 'infinito', false, false, null, false, 0]);
  assert.deepEqual(J.erros, []);
});
