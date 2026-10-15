// Objetivos da Vila (antigos Atos I e II; O3-D10 + objetivos do mapa de 13/10): a partida começa como a do clássico (rodada 1,
// 500 pontos, M1911) e os objetivos vêm em sequência dentro do mapa: I.1 sino (grátis, abre A↔B), I.2 gerador da Pedreira (defender,
// abre B↔F, liga a Energia), II.1 lista do Hospital (abre I↔F e I↔K), II.2 Nogueira na Estação (abre F↔G), II.3 escolta ao Forte
// Velho, II.4 alçapão da casamata. Cobre: cada objetivo jogado pelo host com F/segurar F de verdade, as falhas (gerador cai e volta no
// intervalo; escolta cai e volta ao começo da rota), a passagem I → II no fim da rodada, a etapa seguinte da cadeia depois do II, as
// notas (inclusive nas rodadas infinitas), o F escondido do alçapão e do gerador fora do objetivo, nada de "ato"/"campanha" no centro da
// tela, as 4 dificuldades do começo ao fim, o cliente pela rede (mesmo estado do host, quem entra no meio) e o clássico sem nada disto.
// Rodar: ZV2_OBJ=1 node --test --test-concurrency=1 tests/objetivos-vila.test.mjs
// (sem ZV2_OBJ o _jogo.mjs liga o __semObjetivos e a partida seria o clássico: este arquivo liga e desliga sozinho onde precisa)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
process.env.ZV2_OBJ ||= '1';
const { abrirJogo, criarSala } = await import('./_jogo.mjs');

let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'vila', zdiff: 1 }); }, { timeout: 180000 });
after(async () => { await J?.fechar(); });

const PREP = `(T => {
  const p = T.S.players.get('h');
  const poe = (q, x, z) => { q.pos = [x, 0, z]; if (q === p) { T.me.pos.set(x, 0, z); T.me.vel.set(0, 0, 0); } };
  const segura = () => { T.Z.toSpawn = 50; T.Z.spawnT = 1e12; for (const z of [...T.Z.zs.values()]) T.Z.zs.delete(z.id); p.dwEnd = 1e12; };
  const idx = id => T.ZD.zint.findIndex(o => o.id === id);
  const obj = id => T.CAMP.obj[id]?.st;
  const ouve = () => { const q = T.CAMP.c.radioQ; if (!q.__ouve) { q.__ouve = 1; q.push = function (...a) { (window.__ouvidos ||= []).push(...a.map(x => x[1])); const n = Array.prototype.push.apply(this, a); if (this.length > 4) this.splice(0, this.length - 4); return n; }; } }; // o HUD só consome a fila entre quadros (e o evaluate não deixa quadro rodar): guarda as 4 últimas para a fila não encher
  const ouvidos = () => window.__ouvidos || [];
  const rodada = () => { if (T.Z.phase !== 'round') { T.Z.phaseEnd = window.__simNow; T.sim(.05); } }; // começa a próxima rodada já
  const acaba = () => { T.Z.toSpawn = 0; T.Z.zs.clear(); T.sim(.1); }; // a rodada acaba de verdade (zEndRound -> campFimRodada)
  const tela = () => { const t = (window.__tela ||= []); for (const s of ['#center', '#campObj']) { const v = document.querySelector(s)?.textContent?.trim(); if (v && !t.includes(v)) t.push(v); } return t; };
  const prompt = (x, z) => { poe(p, x, z); T.sim(.05); T.zInteract(0); return T.ZC.act ? T.ZC.act.txt : null; };
  const partida = zdiff => { T.S.st = { ...T.S.st, zmode: 'campanha', zdiff }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1); rodada(); window.__tela = []; };
  const mata = (x, z, r) => { let n = 0; for (const zz of [...T.Z.zs.values()]) if (zz.st === 'in' && Math.hypot(zz.body.pos.x - x, zz.body.pos.z - z) < r) { T.zKill(zz, p, 'head', 'm1911', false, false); n++; } return n; };
  const notas = () => T.ZD.zint.filter(o => o.t === 'nota').map(o => T.zintNotaLigada(o));
  return { p, poe, segura, idx, obj, ouve, ouvidos, rodada, acaba, tela, prompt, partida, mata, notas };
})`;
const NOMES = 'p, poe, segura, idx, obj, ouve, ouvidos, rodada, acaba, tela, prompt, partida, mata, notas';
const em = fn => `async (T, arg) => { const { ${NOMES} } = (new Function('return ' + arg.PREP)())(T); return await (${fn})(T, arg, { ${NOMES} }); }`;
const rodar = (fn, a = {}) => J.page.evaluate(([src, arg]) => (new Function('T', 'arg', `return (${src})(T, arg)`))(window.__T, arg), [em(fn.toString()), { PREP, ...a }]);
const SEM_ATO = /\bATO\b|CAMPANHA|\bAto [IV]/; // nada de "ato" nem "campanha" no centro da tela nem no painel ("Hospital de campanha" é o nome do lugar)

test('começo: rodada 1, 500 pontos e M1911; I.1 ativo, A↔B aberta, sino grátis; F escondido no gerador e no alçapão; só a nota da Praça', { timeout: 180000 }, async () => {
  const r = await rodar((T, arg, { p, poe, idx, obj, prompt, segura, tela, notas, partida }) => {
    partida(1); segura();
    const ini = { round: T.Z.round, fase: T.Z.phase, money: p.money, inv: [p.inv.primary, p.inv.secondary], et: T.CAMP.et, cadeia: T.CAMP.cadeia.map(e => T.CAMP_ATOS[e].id), obj: [obj('I.1'), obj('I.2')],
      portas: ['AB', 'BF', 'IF', 'IK', 'FG'].map(d => T.Z.doors.has(d)), power: T.Z.power, notas: notas() };
    T.sim(.3); const hud = document.querySelector('#campObj')?.textContent || '';
    const sino = prompt(12.2, -36.9), alc = prompt(-50, -50.8), ger = prompt(47.7, -62);
    const ia = idx('alcapao-casamata'); for (let k = 0; k < 70; k++) { T.srvZHold(p, { k: 'zint', id: ia }); T.sim(.1); } // segurar fora do objetivo não faz nada
    const ig = idx('gerador-pedreira'); poe(p, 47.7, -62); T.srvZUse(p, { k: 'zint', id: ig }); T.sim(.1);
    return { ini, hud, sino, alc, ger, alcSt: T.Z.zint[ia].st, gerSt: T.Z.zint[ig].st, tela: tela() };
  });
  assert.deepEqual([r.ini.round, r.ini.fase, r.ini.money, r.ini.inv], [1, 'round', 500, ['m1911', null]], 'a partida começa como a do clássico');
  assert.deepEqual(r.ini.cadeia.slice(0, 2), ['I', 'II'], 'cadeia da Vila: I, II (e o que vier depois)'); assert.equal(r.ini.et, 0);
  assert.deepEqual(r.ini.obj, ['ativo', 'oculto']); assert.deepEqual(r.ini.portas, [true, false, false, false, false], 'I.1 abre só A↔B'); assert.equal(r.ini.power, false);
  assert.deepEqual(r.ini.notas, [true, false, false, false, false], 'só a nota da Praça (ato 0) no começo');
  assert.ok(r.hud.includes('Tocar o sino da Igreja'), 'painel: ' + r.hud);
  assert.equal(r.sino, 'Tocar o sino (chama o rádio; atrai os zumbis)', 'F no sino: grátis no I.1');
  assert.equal(r.alc, null, 'alçapão sem F antes do II.4'); assert.equal(r.ger, null, 'gerador sem F antes do I.2');
  assert.equal(r.alcSt, 'pronto'); assert.equal(r.gerSt, 'pronto');
  for (const t of r.tela) assert.ok(!SEM_ATO.test(t), 'texto na tela: ' + t);
  assert.deepEqual(J.erros, []);
});

test('I.1 → I.2 → II: sino grátis abre B↔F; gerador falha e volta no intervalo, liga a Energia; no fim da rodada começa o II (I↔F, I↔K, notas, rádio)', { timeout: 300000 }, async () => {
  const r = await rodar((T, arg, { p, poe, segura, idx, obj, ouve, ouvidos, rodada, acaba, prompt, tela, partida, notas }) => {
    partida(1); ouve(); window.__ouvidos = []; segura(); const din0 = p.money;
    const is = idx('sino-igreja'); poe(p, 12.2, -36.9); T.srvZUse(p, { k: 'zint', id: is }); T.sim(.1);
    const i1 = [obj('I.1'), obj('I.2'), T.Z.zint[is].st, p.money === din0, T.Z.doors.has('BF'), !!T.Z.lure];
    const ig = idx('gerador-pedreira'), pg = prompt(47.7, -62); T.srvZUse(p, { k: 'zint', id: ig }); T.sim(.1);
    const alvo = T.CAMP.alvos[0], hp0 = alvo?.hp, st1 = T.Z.zint[ig].st, pPeg = prompt(47.7, -62);
    alvo.hp = 0; T.sim(.1); const falha = [obj('I.2'), T.Z.zint[ig].st, T.CAMP.alvos.length, prompt(47.7, -62)];
    acaba(); const volta = [obj('I.2'), T.Z.zint[ig].st, T.Z.phase, T.CAMP.et, prompt(47.7, -62)]; // fim da rodada 1: volta no intervalo, sem passar de etapa
    rodada(); segura(); poe(p, 47.7, -62); T.srvZUse(p, { k: 'zint', id: ig }); for (let t = 0; t < 46; t += .5) { segura(); T.sim(.5); }
    const i2 = [obj('I.2'), T.Z.zint[ig].st, T.Z.power, T.ZC.power, T.CAMP.alvos.length, T.CAMP.et];
    const r2 = T.Z.round; acaba();
    const passa = [T.Z.phase, T.CAMP.et, T.CAMP.modo, obj('II.1'), ['IF', 'IK', 'FG'].map(d => T.Z.doors.has(d)), notas(), T.CAMP.c.et];
    rodada(); T.sim(.2);
    return { i1, pg, hp0, st1, pPeg, falha, volta, i2, r2, passa, round: T.Z.round, ouvidos: ouvidos(), tela: tela() };
  });
  assert.deepEqual(r.i1, ['feito', 'ativo', 'tocando', true, true, true], 'sino grátis: I.1 feito, I.2 ativo, B↔F aberta, zumbis atraídos');
  assert.equal(r.pg, 'Ligar o gerador'); assert.equal(r.hp0, 1500, 'HP do gerador (1 jogador)'); assert.equal(r.st1, 'pegando'); assert.match(r.pPeg, /^Pegando/);
  assert.deepEqual(r.falha, ['falhou', 'afogado', 0, 'O gerador afogou: tentem depois desta leva']);
  assert.deepEqual(r.volta, ['ativo', 'pronto', 'break', 0, 'Ligar o gerador'], 'volta no intervalo e a etapa não passa');
  assert.deepEqual(r.i2, ['feito', 'ligado', true, true, 0, 0], 'gerador pegou: liga a Energia do mapa e solta o alvo falso');
  assert.equal(r.r2, 2);
  assert.deepEqual(r.passa.slice(0, 5), ['break', 1, 'campanha', 'ativo', [true, true, false]], 'no fim da rodada: II.1 ativo, I↔F e I↔K abertas');
  assert.deepEqual(r.passa[5], [true, true, true, true, true], 'notas do II aparecem'); assert.equal(r.passa[6], 1, 'o cliente do host sabe da etapa');
  assert.equal(r.round, 3, 'o II começa logo na rodada seguinte');
  for (const id of ['r1-sino', 'r1-energia', 'r1-gerador-caiu', 'r1-gerador-pegou', 'r2-inicio']) assert.ok(r.ouvidos.includes(id), 'rádio ' + id + ' em ' + r.ouvidos.join(','));
  assert.ok(r.ouvidos.indexOf('r1-sino') < r.ouvidos.indexOf('r1-energia') && r.ouvidos.indexOf('r1-gerador-pegou') < r.ouvidos.indexOf('r2-inicio'), 'ordem do rádio');
  for (const t of r.tela) assert.ok(!SEM_ATO.test(t), 'texto na tela: ' + t);
  assert.deepEqual(J.erros, []);
});

test('II: lista, Estação, escolta (para sem ninguém, cai e volta, pistola, Soldado), alçapão com a fala; depois a etapa seguinte e, no fim, as notas continuam', { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, { p, poe, segura, idx, obj, ouve, ouvidos, rodada, acaba, prompt, tela, partida, notas }) => {
    partida(1); segura(); const cadeia = T.CAMP.cadeia.slice();
    for (const id of ['I.1', 'I.2']) T.campForca(id); acaba(); rodada(); segura(); ouve(); window.__ouvidos = [];
    const it = idx('vila-hospital'); poe(p, -23.31 - 1.2, -115.75); T.srvZUse(p, { k: 'zint', id: it }); T.sim(.1);
    const ii1 = [obj('II.1'), obj('II.2'), T.Z.doors.has('FG')];
    T.sim(1.2); const npc0 = T.CAMP.c.npc ? [Math.round(T.CAMP.c.npc.tx * 10) / 10, Math.round(T.CAMP.c.npc.tz * 10) / 10, !!T.CAMP.c.npc.model?.visible] : null; // Nogueira esperando na Estação
    poe(p, 60, 10); T.sim(.2); const longe = obj('II.2');
    poe(p, 64, 40.5); T.sim(.2); const ii2 = [obj('II.2'), obj('II.3')];
    const R = T.CAMP_OBJ['II.3'].rota, a = T.CAMP.npc.a, hpN = a.hp;
    poe(p, 20, 20); T.sim(.1); const pa = [a.pos[0], a.pos[2]]; T.sim(2); const parado = Math.hypot(a.pos[0] - pa[0], a.pos[2] - pa[1]); // ninguém perto: não anda
    for (let t = 0; t < 4; t += .1) { poe(p, a.pos[0] + 1, a.pos[2]); T.sim(.1); } const andou = Math.hypot(a.pos[0] - R[0][0], a.pos[2] - R[0][1]);
    a.hp = 0; T.sim(.1); const caiu = [obj('II.3'), T.CAMP.alvos.length]; T.sim(3.5); const some = !T.CAMP.c.npc?.model?.visible;
    acaba(); const volta = [obj('II.3'), T.CAMP.npc.a.pos[0], T.CAMP.npc.a.pos[2], T.CAMP.et]; rodada(); segura();
    // pistola: zumbi colado leva o tiro (sem pontos)
    const b = T.CAMP.npc.a, m0 = p.money, id = T.Z.nextId; T.Z.toSpawn++; T.zSpawnOne(); const zz = T.Z.zs.get(id); zz.st = 'in'; zz.body.pos.set(b.pos[0] + 1.2, 0, b.pos[2]); zz.speed = 0; zz.sc = 0; zz.chkT = 1e12;
    const zhp = zz.hp; T.sim(.3); const tiro = [zhp - (T.Z.zs.get(id)?.hp ?? 0) >= 60 || !T.Z.zs.has(id), p.money === m0]; T.Z.zs.clear();
    // Soldado (O3-D06, tipo 8) a 12 m caça o Cabo mesmo sem ter sorteado o alvo falso (campS alto) e o golpe vai no HP do Cabo
    let sold = null; if (T.CAMP_IA?.[8]) { const id2 = T.Z.nextId; T.Z.toSpawn++; T.zSpawnOne(); const s = T.Z.zs.get(id2); s.kind = 8; s.ck = 1; s.st = 'in'; s.campS = .99; s.hp = s.maxHp = 1e7; s.body.pos.set(b.pos[0] + 12, 0, b.pos[2]); s.chkT = 1e12;
      poe(p, b.pos[0] + 40, b.pos[2] + 10); const hb = b.hp; let alvo = false; for (let k = 0; k < 120; k++) { T.sim(.1); if (s.tgt === b) alvo = true; } // nas primeiras rodadas o Soldado ainda anda (1,4 m/s)
      sold = [alvo, b.hp < hb]; b.hp = b.maxHp; T.Z.zs.clear(); }
    // a escolta inteira com um jogador do lado
    let t = 0, minY = 9, maxY = -9; const t0 = window.__simNow;
    while (obj('II.3') === 'ativo' && t < 160) { const P = T.CAMP.npc?.a.pos; if (!P) break; poe(p, P[0] + .9, P[2] + .4); segura(); T.sim(.2); t += .2; minY = Math.min(minY, P[1]); maxY = Math.max(maxY, P[1]); }
    const esc = [obj('II.3'), obj('II.4'), Math.round(window.__simNow - t0), T.CAMP.alvos.length];
    T.sim(1.2); const npc1 = T.CAMP.c.npc ? [Math.round(T.CAMP.c.npc.tx), Math.round(T.CAMP.c.npc.tz)] : null; // e fica no Forte segurando a porta
    const ia = idx('alcapao-casamata'), pa4 = prompt(-50, -50.8);
    for (let k = 0; k < 66 && T.Z.zint[ia].st !== 'aberto'; k++) { T.srvZHold(p, { k: 'zint', id: ia }); T.sim(.1); }
    const ii4 = [obj('II.4'), T.Z.zint[ia].st, T.ZC.zint[ia].st, prompt(-50, -50.8)];
    const hud = document.querySelector('#campObj')?.textContent || '';
    acaba(); const prox = cadeia[cadeia.indexOf(1) + 1];
    const depois = [T.CAMP.et, T.CAMP.modo, prox === undefined ? -1 : prox, notas().every(Boolean)];
    // fim dos objetivos do mapa (a etapa seguinte forçada): rodadas infinitas; as notas continuam no host e no cliente (inclusive quem entra no meio)
    for (const id in T.CAMP.obj) T.campForca(id); rodada(); segura(); acaba();
    const c3 = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; }, peerConnection: null };
    T.srvOnData(c3, { t: 'join', v: 2, pv: 9, name: 'Terceiro' }); T.sim(1.2); T.S.stateT = 0; T.sim(1 / 60);
    const cp = c3.out.filter(x => x.t === 'state' && x.z?.cp).pop()?.z.cp; T.srvDrop?.(c3); T.sim(.1);
    const inf = [T.CAMP.modo, T.CAMP.et, T.CAMP.c.et, notas().every(Boolean), cp?.et, cp?.eu];
    return { ii1, npc0, longe, ii2, hpN, parado, R0: R[0], andou, caiu, some, volta, tiro, sold, esc, minY, maxY, npc1, pa4, ii4, hud, depois, inf, ouvidos: ouvidos(), tela: tela() };
  });
  assert.deepEqual(r.ii1, ['feito', 'ativo', true], 'II.1 lido: II.2 ativo e F↔G aberta');
  assert.deepEqual(r.npc0, [64.8, 42.5, true], 'Nogueira desenhado na Estação');
  assert.equal(r.longe, 'ativo'); assert.deepEqual(r.ii2, ['feito', 'ativo']);
  assert.equal(r.hpN, 600, 'HP do Nogueira (1 jogador)'); assert.equal(r.parado, 0, 'sem ninguém perto o Nogueira não anda');
  assert.ok(r.andou > 8, `andou ${r.andou} m em 4 s com alguém do lado`);
  assert.deepEqual(r.caiu, ['falhou', 0], 'caiu: falhou e soltou o alvo falso'); assert.equal(r.some, true, 'caído, some do mapa (o cliente esconde)');
  assert.deepEqual(r.volta, ['ativo', r.R0[0], r.R0[1], 1], 'caiu: volta ao começo da rota no intervalo, na mesma etapa');
  assert.deepEqual(r.tiro, [true, true], 'pistola no zumbi colado, sem pontos');
  if (r.sold) assert.deepEqual(r.sold, [true, true], 'o Soldado (O3-D06) caça o Cabo e o golpe tira HP dele');
  assert.deepEqual(r.esc.slice(0, 2), ['feito', 'ativo'], 'escolta chegou ao Forte'); assert.ok(r.esc[2] >= 70 && r.esc[2] <= 100, `escolta em ${r.esc[2]} s`); assert.equal(r.esc[3], 0, 'alvo falso solto na chegada');
  assert.ok(r.minY > -.3 && r.maxY < 1.5, `altura do chão na rota ${r.minY}..${r.maxY}`);
  assert.deepEqual(r.npc1, [-47, -50], 'Nogueira fica no Forte');
  assert.equal(r.pa4, 'Segure F — abrir o alçapão');
  assert.deepEqual(r.ii4, ['feito', 'aberto', 'aberto', null], 'alçapão aberto segurando F (e o F some)');
  assert.ok(r.hud.includes('Objetivos cumpridos'), 'painel com tudo cumprido: ' + r.hud);
  assert.deepEqual(r.depois.slice(0, 2), [r.depois[2], r.depois[2] < 0 ? 'infinito' : 'campanha'], 'fim do II: a etapa seguinte da cadeia (ou as rodadas infinitas)');
  assert.equal(r.depois[3], true, 'notas continuam');
  assert.deepEqual(r.inf, ['infinito', -1, -1, true, -1, r.inf[5]], 'rodadas infinitas: as notas continuam'); assert.ok(r.inf[5] >= 1, 'quem entra no meio recebe a última etapa (eu) para as notas');
  for (const id of ['r2-lista', 'r2-escolta', 'r2-escolta-caiu', 'cabo-anda', 'cabo-chegou', 'r2-forte']) assert.ok(r.ouvidos.includes(id), 'rádio/fala ' + id + ' em ' + r.ouvidos.join(','));
  assert.ok(r.ouvidos.lastIndexOf('cabo-chegou') > r.ouvidos.indexOf('r2-forte'), 'Nogueira segura a porta (fala) durante o alçapão');
  for (const t of r.tela) assert.ok(!SEM_ATO.test(t), 'texto na tela: ' + t);
  assert.deepEqual(J.erros, []);
});

test('as 4 dificuldades: a Vila do sino ao alçapão com zumbis de verdade (o jogador mata os que chegam perto), sem travar', { timeout: 900000 }, async () => {
  const res = [];
  for (const zdiff of [0, 1, 2, 3]) res.push(await rodar((T, arg, { p, poe, idx, obj, rodada, acaba, partida, mata }) => {
    partida(arg.zdiff); p.dwEnd = 1e12; const log = [], falhas = {}, t0 = window.__simNow;
    const passo = (s = .25) => { T.sim(s); if (T.Z.phase !== 'round') rodada(); for (const id in T.CAMP.obj) if (T.CAMP.obj[id].st === 'falhou') { falhas[id] = (falhas[id] || 0) + 1; acaba(); rodada(); } };
    const ate = (id, f, lim = 400) => { let t = 0; while (obj(id) !== 'feito' && t < lim) { f(); passo(); t += .25; } log.push([id, obj(id), T.Z.round]); };
    ate('I.1', () => { poe(p, 12.2, -36.9); T.srvZUse(p, { k: 'zint', id: idx('sino-igreja') }); mata(12.2, -38, 8); });
    ate('I.2', () => { poe(p, 47.7, -61.5); if (T.Z.zint[idx('gerador-pedreira')].st === 'pronto') T.srvZUse(p, { k: 'zint', id: idx('gerador-pedreira') }); mata(47.7, -62, 6); });
    let t = 0; while (T.CAMP.et === 0 && t < 400) { T.Z.toSpawn = 0; mata(0, 0, 1e4); passo(); t += .25; } log.push(['passa', T.CAMP.et, T.Z.round]);
    ate('II.1', () => { poe(p, -24.5, -115.75); T.srvZUse(p, { k: 'zint', id: idx('vila-hospital') }); mata(-24, -115, 8); });
    ate('II.2', () => { poe(p, 64, 40.5); mata(64, 40, 8); });
    ate('II.3', () => { const P = T.CAMP.npc?.a.pos; if (P) { poe(p, P[0] + .9, P[2] + .4); mata(P[0], P[2], 7); } }, 600);
    ate('II.4', () => { poe(p, -50, -50.8); T.srvZHold(p, { k: 'zint', id: idx('alcapao-casamata') }); mata(-50, -51, 8); });
    rodada(); acaba(); T.sim(.3); // o fim da rodada passa da etapa
    return { zdiff: arg.zdiff, log, falhas, et: T.CAMP.et, power: T.Z.power, min: Math.round((window.__simNow - t0) / 60), hpGer: T.CAMP_OBJ['I.2'].hp };
  }, { zdiff }));
  console.log('dificuldades:', JSON.stringify(res.map(r => [r.zdiff, r.log.map(l => l[0] + '@' + l[2]).join(' '), r.falhas, r.min + ' min'])));
  for (const r of res) {
    for (const [id, st] of r.log.filter(l => l[0] !== 'passa')) assert.equal(st, 'feito', `dificuldade ${r.zdiff}: ${id} não completou (${JSON.stringify(r.log)})`);
    assert.equal(r.log.find(l => l[0] === 'passa')[1], 1, `dificuldade ${r.zdiff}: passou para o II`);
    assert.notEqual(r.et, 1, `dificuldade ${r.zdiff}: o II acabou e a cadeia seguiu (${r.et})`); assert.equal(r.power, true);
  }
  assert.deepEqual(J.erros, []);
});

test('cliente pela rede: toca o sino de graça, liga o gerador, vê os objetivos iguais aos do host; quem entra no meio recebe a etapa', { timeout: 300000 }, async () => {
  const r = await rodar((T, arg, { p, poe, segura, idx, obj, rodada, acaba, partida }) => {
    partida(1); segura();
    const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; }, peerConnection: null };
    T.srvOnData(c, { t: 'join', v: 2, pv: 9, name: 'Cliente' }); const q = T.S.players.get(c.pid); if (!q) return { semJogador: true };
    q.alive = true; q.downed = false; q.dwEnd = 1e12; T.sim(.3);
    const visto = () => { const o = {}; for (const m of c.out) { if (m.t === 'camp' && m.k === 'est') { for (const k in o) delete o[k]; for (const x of m.ob || []) o[x[0]] = x[1]; } if (m.t === 'camp' && m.k === 'obj') o[m.id] = m.st; } return JSON.stringify(o); };
    const host = () => JSON.stringify(Object.fromEntries(Object.entries(T.CAMP.obj).map(([k, v]) => [k, v.st])));
    const passos = []; const ck = n => passos.push([n, visto() === host(), host()]);
    c.out.length = 0; const m0 = q.money, mh = p.money;
    poe(q, 12.2, -36.9); T.srvOnData(c, { t: 'use', k: 'zint', id: idx('sino-igreja') }); T.sim(.2); ck('sino'); const gratis = [q.money === m0, p.money === mh];
    const ig = idx('gerador-pedreira'); poe(q, 47.7, -62); T.srvOnData(c, { t: 'use', k: 'zint', id: ig }); T.sim(.2); ck('gerador');
    const zint = c.out.filter(m => m.t === 'zint' && m.i === ig).map(m => m.st);
    T.CAMP.obj['I.2'].alvo.hp = 0; T.sim(.2); ck('falhou'); acaba(); ck('volta'); rodada(); segura();
    T.srvOnData(c, { t: 'use', k: 'zint', id: ig }); for (let t = 0; t < 50 && obj('I.2') === 'ativo'; t += .5) { segura(); T.sim(.5); } ck('ligado');
    const pw = c.out.some(m => m.t === 'zpower');
    acaba(); ck('II'); rodada(); segura(); T.campForca('II.1'); T.sim(1.2); ck('II.1');
    const npc = c.out.filter(m => m.t === 'camp' && m.k === 'npc' && m.id === 'cabo').length;
    const c3 = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; }, peerConnection: null };
    T.srvOnData(c3, { t: 'join', v: 2, pv: 9, name: 'Terceiro' }); T.sim(1.2); T.S.stateT = 0; T.sim(1 / 60);
    const cp = c3.out.filter(x => x.t === 'state' && x.z?.cp).pop()?.z.cp;
    T.srvDrop?.(c); T.srvDrop?.(c3); T.sim(.2);
    return { passos, gratis, zint, pw, npc, meio: cp ? [cp.et, cp.eu, JSON.stringify(cp.ob.map(o => [o[0], o[1]]))] : null };
  });
  assert.ok(!r.semJogador, 'jogador falso entrou');
  for (const [n, igual, h] of r.passos) assert.ok(igual, `${n}: cliente vê o mesmo que o host (${h})`);
  assert.deepEqual(r.gratis, [true, true], 'o sino do I.1 sai grátis para o cliente (e o host não paga)');
  assert.deepEqual(r.zint, ['pegando'], 'o cliente recebe o gerador pegando'); assert.equal(r.pw, true, 'e a Energia');
  assert.ok(r.npc >= 1, 'o cliente recebe o Nogueira parado na Estação');
  assert.deepEqual(r.meio, [1, 1, JSON.stringify([['II.1', 'feito'], ['II.2', 'ativo'], ['II.3', 'oculto'], ['II.4', 'oculto']])], 'quem entra no meio recebe a etapa e os objetivos');
  assert.deepEqual(J.erros, []);
});

test('rota da escolta e lugares: trechos livres (segClearR), no chão, na grade dos zumbis; Nogueira desenhado com rádio, pistola e nome', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, { idx }) => {
    const R = T.CAMP_OBJ['II.3'].rota, seg = [], FF = T.FF; let fora = 0;
    for (let k = 1; k < R.length; k++) { seg.push(T.segClearR(R[k - 1][0], R[k - 1][1], R[k][0], R[k][1]));
      const d = Math.hypot(R[k][0] - R[k - 1][0], R[k][1] - R[k - 1][1]); for (let s = 0; s <= d; s += .5) { const x = R[k - 1][0] + (R[k][0] - R[k - 1][0]) * s / d, z = R[k - 1][1] + (R[k][1] - R[k - 1][1]) * s / d, i = Math.floor(x - FF.x0), j = Math.floor(z - FF.z0); if (!FF.walk[i * FF.nz + j]) fora++; } }
    const chao = R.map(([x, z]) => T.campChao(x, 0, z));
    const zona = T.CAMP_OBJ['II.2'].zona, est = T.CAMP_VILA.estacao, dz = Math.hypot(zona.x - est[0], zona.z - est[1]);
    const g = T.CAMP_NPC.cabo.monta(), ud = g.userData; let malhas = 0; g.traverse(o => { if (o.isMesh) malhas++; });
    const n = { x: 0, z: 0, model: g }; T.CAMP_NPC.cabo.quadro(n, 1 / 60); n.x = .05; T.CAMP_NPC.cabo.quadro(n, 1 / 60);
    const ok = { tag: !!ud.tag && ud.tag.material.depthTest === false, pistola: ud.gh.children.length > 0, malhas, perna: ud.legL.rotation.x !== 0 };
    const zonas = ['sino-igreja', 'gerador-pedreira', 'vila-hospital', 'alcapao-casamata'].map(id => { const o = T.ZD.zint[idx(id)]; return T.ZD.zoneAt(o.x + (o.n?.[0] || 0) * 1.2, o.z + (o.n?.[1] || 0) * 1.2); });
    return { seg, fora, chao, dz, ok, zonas, rota: R.map(([x, z]) => T.ZD.zoneAt(x, z)) };
  });
  assert.ok(r.seg.every(Boolean), 'cada trecho com linha livre: ' + r.seg); assert.equal(r.fora, 0, 'rota na grade dos zumbis');
  assert.ok(r.chao.every(y => Math.abs(y) < 1.2), 'chão da rota: ' + r.chao);
  assert.ok(r.dz < 3, 'Nogueira dentro da zona do II.2');
  assert.deepEqual(r.zonas, ['B', 'F', 'K', 'I'], 'cada interativo na área que a porta do objetivo anterior abre (A↔B, B↔F, I↔K, I↔F)');
  assert.ok(r.rota.every(z => ['G', 'F', 'I'].includes(z)), 'a escolta só passa por G, F e I (portas F↔G e I↔F abertas pelos objetivos): ' + r.rota);
  assert.equal(r.ok.tag, true); assert.equal(r.ok.pistola, true); assert.equal(r.ok.perna, true); assert.ok(r.ok.malhas > 20);
  assert.deepEqual(J.erros, []);
});

test('clássico: sem objetivos na Vila (interativos { off: 1 }, notas desligadas, sino pago, nenhum NPC)', { timeout: 180000 }, async () => {
  await J.page.evaluate(() => { window.__semObjetivos = true; });
  const r = await rodar((T, arg, { p, poe, idx, segura }) => {
    T.S.st = { ...T.S.st, zmode: 'classico', zdiff: 1 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.2);
    segura(); T.CAMP.c.npc = null; const ids = ['gerador-pedreira', 'alcapao-casamata', 'n-praca-cabo', 'n-estacao-cabo'];
    const off = ids.map(id => !!T.ZC.world.zint[idx(id)]?.off || (T.ZD.zint[idx(id)].t === 'nota' && !T.ZC.world.zint[idx(id)].g));
    const notaLig = T.zintNotaLigada(T.ZD.zint[idx('n-praca-cabo')]);
    const is = idx('sino-igreja'); poe(p, 12.2, -38.1); p.money = 600; T.srvZUse(p, { k: 'zint', id: is }); T.sim(.1);
    const sino = [T.Z.zint[is].st, p.money]; T.campVilaTick(); T.sim(.6);
    return { on: T.CAMP.on, off, notaLig, sino, npc: !!T.CAMP.c.npc }; // nenhuma posição do Nogueira chega no clássico
  });
  await J.page.evaluate(() => { delete window.__semObjetivos; });
  assert.equal(r.on, false); assert.deepEqual(r.off, [true, true, true, true], 'interativos dos objetivos desligados no clássico');
  assert.equal(r.notaLig, false); assert.deepEqual(r.sino, ['tocando', 100], 'o sino continua custando 500 no clássico'); assert.ok(!r.npc);
  assert.deepEqual(J.erros, []);
});
