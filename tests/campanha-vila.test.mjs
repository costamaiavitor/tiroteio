// Atos I e II da campanha na Vila (Onda 3, O3-D10; docs/overhaul/campanha.md §4.3, textos em lore.md §8–§10): os objetivos de
// verdade jogados de ponta a ponta pelo host (sino, gerador com falha e volta, lista do Hospital, Estação, escolta do Nogueira com
// queda e volta, alçapão), as portas da história, as notas no ato certo, a fala e o rádio nos momentos certos, o checkpoint do Ato II,
// o fim do Ato II levando à etapa seguinte (C1 ou, sem a arena, o Sanatório) e o clássico sem nada disto.
// Rodar: node --test tests/campanha-vila.test.mjs (ou a suíte inteira)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); }, { timeout: 120000 });
after(async () => { await J?.fechar(); });

const PREP = `(T => {
  const p = T.S.players.get('h');
  const poe = (q, x, z) => { q.pos = [x, 0, z]; if (q === p) { T.me.pos.set(x, 0, z); T.me.vel.set(0, 0, 0); } };
  const segura = () => { T.Z.toSpawn = 50; T.Z.spawnT = 1e12; for (const z of [...T.Z.zs.values()]) T.Z.zs.delete(z.id); p.dwEnd = 1e12; };
  const idx = id => T.ZD.zint.findIndex(o => o.id === id);
  const obj = id => T.campEstado().obj[id];
  const ouve = () => { const q = T.CAMP.c.radioQ; if (!q.__ouve) { q.__ouve = 1; q.push = function (...a) { (window.__ouvidos ||= []).push(...a.map(x => x[1])); return Array.prototype.push.apply(this, a); }; } };
  const ouvidos = () => window.__ouvidos || [];
  const rodada = () => { if (T.Z.phase !== 'round') { T.Z.phaseEnd = window.__simNow; T.sim(.05); } segura(); }; // começa a próxima rodada já
  const acaba = () => { T.Z.toSpawn = 0; T.Z.zs.clear(); T.sim(.1); }; // a rodada acaba de verdade (zEndRound -> campFimRodada)
  return { p, poe, segura, idx, obj, ouve, ouvidos, rodada, acaba };
})`;
const prep = `const { p, poe, segura, idx, obj, ouve, ouvidos, rodada, acaba } = (new Function('return ' + arg.PREP)())(T);`;
const em = fn => `(T, arg) => { ${prep} return (${fn})(T, arg, { p, poe, segura, idx, obj, ouve, ouvidos, rodada, acaba }); }`;
const rodar = (fn, a = {}) => J.page.evaluate(([src, arg]) => (new Function('T', 'arg', `return (${src})(T, arg)`))(window.__T, arg), [em(fn.toString()), { PREP, ...a }]);

test('clássico: sem campanha na Vila (interativos { off: 1 }, notas desligadas, sino pago, nenhum NPC)', { timeout: 180000 }, async () => {
  await criarSala(J.page, { mode: 'zombies', map: 'vila', zdiff: 1 });
  const r = await rodar((T, arg, { p, poe, idx, segura }) => {
    segura(); const ids = ['gerador-pedreira', 'alcapao-casamata', 'n-praca-cabo', 'n-estacao-cabo'];
    const off = ids.map(id => !!T.ZC.world.zint[idx(id)]?.off || (T.ZD.zint[idx(id)].t === 'nota' && !T.ZC.world.zint[idx(id)].g));
    const notaLig = T.zintNotaLigada(T.ZD.zint[idx('n-praca-cabo')]);
    const is = idx('sino-igreja'); poe(p, 12.2, -38.1); p.money = 600; T.srvZUse(p, { k: 'zint', id: is }); T.sim(.1);
    const sino = [T.Z.zint[is].st, p.money]; T.campVilaTick(); T.sim(.6);
    return { on: T.CAMP.on, off, notaLig, sino, npc: !!T.CAMP.c.npc, ns: T.CAMP_OBJ['I.1'] && T.ZD.zint.length };
  });
  assert.equal(r.on, false); assert.deepEqual(r.off, [true, true, true, true], 'interativos da campanha desligados no clássico');
  assert.equal(r.notaLig, false); assert.deepEqual(r.sino, ['tocando', 100], 'o sino continua custando 500 no clássico'); assert.equal(r.npc, false);
});

test('Ato I: sino grátis abre A↔B e passa ao gerador; gerador falha, volta no intervalo e liga a Energia; marco na rodada 4', { timeout: 300000 }, async () => {
  const r = await rodar((T, arg, { p, poe, segura, idx, obj, ouve, ouvidos, rodada, acaba }) => {
    T.S.st = { ...T.S.st, zmode: 'campanha', ato: 0 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1); ouve(); window.__ouvidos = [];
    const e0 = T.campEstado(), portas0 = ['AB', 'BF'].map(d => T.Z.doors.has(d)), din0 = p.money;
    const notas0 = ['n-praca-cabo', 'n-pedreira-dinamite', 'n-estacao-cabo'].map(id => T.zintNotaLigada(T.ZD.zint[idx(id)]));
    rodada(); const round0 = T.Z.round;
    const hud = document.querySelector('#campObj')?.textContent || '';
    // I.1: o sino (F de verdade no host), primeira badalada grátis
    const is = idx('sino-igreja'); poe(p, 12.2, -38.1); T.sim(.1); const act = { ...T.ZC.act }; T.srvZUse(p, { k: 'zint', id: is }); T.sim(.1);
    const i1 = [obj('I.1').st, obj('I.2').st, T.Z.zint[is].st, p.money === din0, T.Z.doors.has('BF'), !!T.Z.lure];
    // I.2: F no gerador -> pegando (alvo falso com o HP do projeto), falha com o HP em 0 e volta no intervalo
    const ig = idx('gerador-pedreira'); poe(p, 47.7, -62.2); T.srvZUse(p, { k: 'zint', id: ig }); T.sim(.1);
    const alvo = T.CAMP.alvos[0], hp0 = alvo?.hp, st1 = T.Z.zint[ig].st;
    alvo.hp = 0; T.sim(.1); const falha = [obj('I.2').st, T.Z.zint[ig].st, T.CAMP.alvos.length];
    acaba(); const volta = [obj('I.2').st, T.Z.zint[ig].st, T.Z.phase]; // fim da rodada 1: volta no intervalo
    rodada(); const r2 = T.Z.round;
    T.srvZUse(p, { k: 'zint', id: ig }); for (let t = 0; t < 46; t += .5) { segura(); T.sim(.5); }
    const i2 = [obj('I.2').st, T.Z.zint[ig].st, T.Z.power, T.ZC.power];
    acaba(); const cedo = !!T.CAMP.fim; // rodada 2: a etapa só acaba na 4
    rodada(); acaba(); rodada(); const r4 = T.Z.round; acaba(); const fim = T.CAMP.fim ? { prox: T.CAMP.fim.prox, troca: T.CAMP.fim.troca } : null;
    T.sim(T.CAMP.fim.t - window.__simNow + .2); rodada();
    const e1 = T.campEstado();
    return { e0: [e0.et, e0.obj['I.1']?.st], portas0, notas0, round0, hud, rr: [r2, r4], act: [act.k, act.cost, act.txt], i1, hp0, st1, falha, volta, i2, cedo, fim, e1: [e1.et, e1.obj['II.1']?.st],
      portas1: ['IF', 'IK', 'FG'].map(d => T.Z.doors.has(d)), notas1: ['n-pedreira-dinamite', 'n-estacao-cabo', 'n-castelo-foto', 'n-base-ordem'].map(id => T.zintNotaLigada(T.ZD.zint[idx(id)])),
      salvo: T.campSalvo().dif[1].ato, ouvidos: ouvidos(), round: T.Z.round };
  });
  assert.deepEqual(r.e0, [0, 'ativo']); assert.deepEqual(r.portas0, [true, false], 'I.1 abre A↔B de graça, e só');
  assert.deepEqual(r.notas0, [true, false, false], 'só a nota do Ato I aparece no Ato I');
  assert.equal(r.round0, 1); assert.ok(r.hud.includes('Tocar o sino da Igreja'), 'HUD com o objetivo: ' + r.hud);
  assert.deepEqual(r.act, ['zint', 0, 'Tocar o sino (chama o rádio; atrai os zumbis)'], 'F no sino: grátis no I.1');
  assert.deepEqual(r.i1, ['feito', 'ativo', 'tocando', true, true, true], 'sino grátis: I.1 feito, I.2 ativo, B↔F aberta, zumbis atraídos');
  assert.equal(r.hp0, 1500, 'HP do gerador (1 jogador)'); assert.equal(r.st1, 'pegando');
  assert.deepEqual(r.falha, ['falhou', 'afogado', 0]); assert.deepEqual(r.volta, ['ativo', 'pronto', 'break'], 'volta no intervalo'); assert.deepEqual(r.rr, [2, 4]);
  assert.deepEqual(r.i2, ['feito', 'ligado', true, true], 'gerador pegou: liga a Energia do mapa');
  assert.equal(r.cedo, false, 'não acaba antes da rodada mínima'); assert.deepEqual(r.fim, { prox: 1, troca: false }, 'Ato II no mesmo mapa');
  assert.deepEqual(r.e1, [1, 'ativo']); assert.deepEqual(r.portas1, [true, true, false], 'II.1 abre a cadeia até o Hospital (I↔F, I↔K)');
  assert.deepEqual(r.notas1, [true, true, true, true], 'notas do Ato II (e a da Pedreira, do marco I.3) aparecem no Ato II');
  assert.equal(r.salvo, 1, 'Ato II liberado');
  for (const id of ['r1-inicio', 'r1-sino', 'r1-energia', 'r1-gerador-caiu', 'r1-gerador-pegou', 'r2-inicio']) assert.ok(r.ouvidos.includes(id), 'rádio ' + id + ' em ' + r.ouvidos.join(','));
  assert.ok(r.ouvidos.indexOf('r1-sino') < r.ouvidos.indexOf('r1-energia'), 'ordem do rádio');
  assert.equal(r.round, 5, 'o Ato II começa na rodada 5'); assert.deepEqual(J.erros, []);
});

test('Ato II: lista, Estação, escolta (para sem ninguém, cai e volta, chega), alçapão com a fala; fim leva à etapa seguinte', { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, { p, poe, segura, idx, obj, ouve, ouvidos, rodada, acaba }) => {
    ouve(); window.__ouvidos = []; rodada();
    const it = idx('vila-hospital'); poe(p, -23.31 - 1.2, -115.75); T.srvZUse(p, { k: 'zint', id: it }); T.sim(.1);
    const ii1 = [obj('II.1').st, obj('II.2').st, T.Z.doors.has('FG')];
    T.sim(1.2); const npc0 = T.CAMP.c.npc ? [Math.round(T.CAMP.c.npc.tx * 10) / 10, Math.round(T.CAMP.c.npc.tz * 10) / 10, !!T.CAMP.c.npc.model?.visible] : null; // Nogueira esperando na Estação
    poe(p, 60, 10); T.sim(.2); const longe = obj('II.2').st;
    poe(p, 64, 40.5); T.sim(.2); const ii2 = [obj('II.2').st, obj('II.3').st];
    const R = T.CAMP_OBJ['II.3'].rota, a = T.CAMP.npc.a, hpN = a.hp;
    poe(p, 20, 20); T.sim(.1); const pa = [a.pos[0], a.pos[2]]; T.sim(2); const parado = Math.hypot(a.pos[0] - pa[0], a.pos[2] - pa[1]); // ninguém perto: não anda
    poe(p, a.pos[0] + 1, a.pos[2]); for (let t = 0; t < 4; t += .1) { poe(p, a.pos[0] + 1, a.pos[2]); T.sim(.1); } const andou = Math.hypot(a.pos[0] - R[0][0], a.pos[2] - R[0][1]);
    a.hp = 0; T.sim(.1); const caiu = obj('II.3').st; acaba(); const volta = [obj('II.3').st, T.CAMP.npc.a.pos[0], T.CAMP.npc.a.pos[2]]; rodada();
    // pistola: zumbi colado leva o tiro (sem pontos)
    const b = T.CAMP.npc.a, m0 = p.money, id = T.Z.nextId; T.Z.toSpawn++; T.zSpawnOne(); const zz = T.Z.zs.get(id); zz.st = 'in'; zz.body.pos.set(b.pos[0] + 1.2, 0, b.pos[2]); zz.speed = 0; zz.sc = 0; zz.chkT = 1e12;
    const zhp = zz.hp; T.sim(.3); const tiro = [zhp - (T.Z.zs.get(id)?.hp ?? 0) >= 60 || !T.Z.zs.has(id), p.money === m0]; T.Z.zs.clear();
    // Soldado (O3-D06, tipo 8) a 12 m caça o Cabo mesmo sem ter sorteado o alvo falso (campS alto) e o golpe vai no HP do Cabo
    let sold = null; if (T.CAMP_IA?.[8]) { const id2 = T.Z.nextId; T.Z.toSpawn++; T.zSpawnOne(); const s = T.Z.zs.get(id2); s.kind = 8; s.ck = 1; s.st = 'in'; s.campS = .99; s.hp = s.maxHp = 1e7; s.body.pos.set(b.pos[0] + 12, 0, b.pos[2]); s.chkT = 1e12;
      poe(p, b.pos[0] + 40, b.pos[2] + 10); const hb = b.hp; let alvo = false; for (let k = 0; k < 60; k++) { T.sim(.1); if (s.tgt === b) alvo = true; }
      sold = [alvo, b.hp < hb]; b.hp = b.maxHp; T.Z.zs.clear(); }
    // a escolta inteira com um jogador do lado
    let t = 0, minY = 9, maxY = -9; const t0 = window.__simNow;
    while (obj('II.3').st === 'ativo' && t < 160) { const P = T.CAMP.npc?.a.pos; if (!P) break; poe(p, P[0] + .9, P[2] + .4); segura(); T.sim(.2); t += .2; minY = Math.min(minY, P[1]); maxY = Math.max(maxY, P[1]); }
    const esc = [obj('II.3').st, obj('II.4').st, Math.round(window.__simNow - t0)];
    T.sim(1.2); const npc1 = T.CAMP.c.npc ? [Math.round(T.CAMP.c.npc.tx), Math.round(T.CAMP.c.npc.tz)] : null; // e fica no Forte segurando a porta
    const ia = idx('alcapao-casamata'); poe(p, -50, -50.8);
    for (let k = 0; k < 66 && T.Z.zint[ia].st !== 'aberto'; k++) { T.srvZHold(p, { k: 'zint', id: ia }); T.sim(.1); }
    const ii4 = [obj('II.4').st, T.Z.zint[ia].st, T.ZC.zint[ia].st];
    T.Z.round = 8; acaba(); const cedo = !!T.CAMP.fim; rodada(); const r9 = T.Z.round; acaba();
    const fim = T.CAMP.fim ? { prox: T.CAMP.fim.prox, troca: T.CAMP.fim.troca } : null, cena = T.CAMP.c.cena?.L.map(x => x[0]).join('|') || '';
    const esperado = T.campProxEtapa(1);
    T.sim(T.CAMP.fim.t - window.__simNow + .1); // a cena acaba: troca de mapa (bagagem) para a etapa seguinte
    T.sendToHost({ t: 'camp', k: 'pronto' }); T.sim(.2);
    return { sold, r9, ii1, npc0, longe, ii2, hpN, parado, R0: R[0], andou, caiu, volta, tiro, esc, minY, maxY, npc1, ii4, cedo, fim, esperado, cena, depois: [T.CAMP.et, T.S.st.map], ouvidos: ouvidos(), forte: !!T.MAPS.forte };
  });
  assert.deepEqual(r.ii1, ['feito', 'ativo', true], 'II.1 lido: II.2 ativo e F↔G aberta');
  assert.ok(r.npc0, 'Nogueira desenhado na Estação'); assert.deepEqual(r.npc0, [64.8, 42.5, true]);
  assert.equal(r.longe, 'ativo'); assert.deepEqual(r.ii2, ['feito', 'ativo']);
  assert.equal(r.hpN, 600, 'HP do Nogueira (1 jogador)'); assert.equal(r.parado, 0, 'sem ninguém perto o Nogueira não anda');
  assert.ok(r.andou > 8, `andou ${r.andou} m em 4 s com alguém do lado`);
  assert.equal(r.caiu, 'falhou'); assert.deepEqual(r.volta, ['ativo', r.R0[0], r.R0[1]], 'caiu: volta ao começo da rota no intervalo');
  assert.deepEqual(r.tiro, [true, true], 'pistola no zumbi colado, sem pontos');
  assert.ok(r.sold, 'Soldado do O3-D06 presente'); assert.deepEqual(r.sold, [true, true], 'o Soldado (O3-D06) caça o Cabo e o golpe tira HP dele');
  assert.deepEqual(r.esc.slice(0, 2), ['feito', 'ativo'], 'escolta chegou ao Forte'); assert.ok(r.esc[2] >= 70 && r.esc[2] <= 100, `escolta em ${r.esc[2]} s`);
  assert.ok(r.minY > -.3 && r.maxY < 1.5, `altura do chão na rota ${r.minY}..${r.maxY}`);
  assert.deepEqual(r.npc1, [-47, -50], 'Nogueira fica no Forte');
  assert.deepEqual(r.ii4, ['feito', 'aberto', 'aberto'], 'alçapão aberto segurando F');
  assert.equal(r.r9, 9); assert.equal(r.cedo, false, 'o Ato II não acaba antes da rodada 9'); assert.deepEqual(r.fim, { prox: r.esperado, troca: true });
  assert.equal(r.esperado, r.forte ? 2 : 3, 'fim do Ato II: etapa C1 (Forte Velho) ou, sem a arena, o Sanatório');
  assert.ok(r.cena.startsWith('FORTE VELHO · CASAMATA'), 'cena c2-forte: ' + r.cena); assert.equal(r.depois[0], r.esperado); assert.equal(r.depois[1], r.forte ? 'forte' : 'sanatorio');
  for (const id of ['r2-lista', 'r2-escolta', 'r2-escolta-caiu', 'cabo-anda', 'cabo-chegou', 'r2-forte']) assert.ok(r.ouvidos.includes(id), 'rádio/fala ' + id + ' em ' + r.ouvidos.join(','));
  assert.ok(r.ouvidos.lastIndexOf('cabo-chegou') > r.ouvidos.indexOf('r2-forte'), 'Nogueira segura a porta (fala) durante o alçapão');
  assert.deepEqual(J.erros, []);
});

test('checkpoint do Ato II: kit, Energia, portas do Ato I e notas; o time cai e recomeça o Ato II', { timeout: 300000 }, async () => {
  const r = await rodar((T, arg, { p, segura, idx, obj }) => {
    T.campLibera(1, 1); T.S.st = { ...T.S.st, map: 'vila', zmode: 'campanha', ato: 1 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    const ini = { et: T.CAMP.et, round: T.Z.round, money: p.money, inv: [p.inv.primary, p.inv.secondary], perks: p.perks.join(), power: T.Z.power, portas: ['AB', 'BF', 'IF', 'IK', 'FG'].map(d => T.Z.doors.has(d)), ii1: obj('II.1').st,
      notas: ['n-praca-cabo', 'n-estacao-cabo'].map(id => T.zintNotaLigada(T.ZD.zint[idx(id)])), objs: Object.keys(T.campEstado().obj) };
    T.sim(T.Z.phaseEnd - window.__simNow + .2); segura(); T.campForca('II.1'); T.campForca('II.2'); T.sim(.2); const esc = !!T.CAMP.npc;
    p.money = 9999; p.perks = []; p.dwEnd = 0; T.zHurt(p, 1e6, null); T.sim(.2); const over = T.CAMP.over;
    T.campRepetir(); T.sim(.3);
    return { ini, esc, over, depois: [T.CAMP.et, T.Z.round, p.money, p.inv.secondary, p.perks.join(), T.CAMP.over, obj('II.1').st, obj('II.3').st, !!T.CAMP.npc, T.Z.power] };
  });
  assert.equal(r.ini.et, 1); assert.equal(r.ini.round, 4, 'pré-rodada antes da 5'); assert.equal(r.ini.money, 2000); assert.deepEqual(r.ini.inv, ['m1911', 'mp40']); assert.equal(r.ini.perks, 'jug');
  assert.equal(r.ini.power, true, 'Energia ligada no kit'); assert.deepEqual(r.ini.portas, [true, true, true, true, false], 'portas do Ato I e as do II.1');
  assert.equal(r.ini.ii1, 'ativo'); assert.deepEqual(r.ini.notas, [true, true]); assert.deepEqual(r.ini.objs, ['II.1', 'II.2', 'II.3', 'II.4']);
  assert.equal(r.esc, true); assert.equal(r.over, true);
  assert.deepEqual(r.depois, [1, 4, 2000, 'mp40', 'jug', false, 'ativo', 'oculto', false, true], 'recomeça o Ato II com o kit, sem escolta pela metade');
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
    return { seg, fora, chao, dz, ok, rotas: R.length, ids: ['gerador-pedreira', 'alcapao-casamata', 'sino-igreja', 'vila-hospital'].map(idx) };
  });
  assert.ok(r.seg.every(Boolean), 'cada trecho com linha livre: ' + r.seg); assert.equal(r.fora, 0, 'rota na grade dos zumbis');
  assert.ok(r.chao.every(y => Math.abs(y) < 1.2), 'chão da rota: ' + r.chao);
  assert.ok(r.dz < 3, 'Nogueira dentro da zona do II.2'); assert.ok(r.ids.every(i => i >= 0), 'interativos dos objetivos existem');
  assert.equal(r.ok.tag, true); assert.equal(r.ok.pistola, true); assert.equal(r.ok.perna, true); assert.ok(r.ok.malhas > 20);
  assert.deepEqual(J.erros, []);
});
