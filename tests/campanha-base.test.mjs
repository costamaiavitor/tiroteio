// Base da campanha (Onda 3, O3-D02; docs/overhaul/campanha.md §2–§4, §11, §12): menu e saneSt, salvo por dificuldade, o clássico
// sem mudança, o motor de objetivos com cada tipo (alvos falsos de teste nos interativos da campanha), checkpoint, quem entra no meio,
// e 4 trocas de mapa seguidas com bagagem e sem vazar estado do mapa anterior.
// Os objetivos e as posições são DE TESTE (os de verdade são dos agentes dos atos): injetados na página antes de a partida começar.
// Rodar: pnpm test (todos) ou node --test tests/campanha-base.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); }, { timeout: 120000 });
after(async () => { await J?.fechar(); });

// cena de teste no Sanatório (sala A, a Recepção): interativos da campanha com id e objetivos de cada tipo na etapa III
const PREP = `(T => {
  const p = T.S.players.get('h');
  const poe = (q, x, z) => { q.pos = [x, 0, z]; if (q === p) T.me.pos.set(x, 0, z); };
  const segura = () => { T.Z.toSpawn = 50; T.Z.spawnT = 1e12; for (const z of [...T.Z.zs.values()]) T.Z.zs.delete(z.id); };
  const idx = id => T.ZD.zint.findIndex(o => o.id === id);
  const zumbi = (x, z) => { const id = T.Z.nextId; T.Z.toSpawn++; T.zSpawnOne(); const zz = T.Z.zs.get(id); zz.st = 'in'; zz.body.pos.set(x, 0, z); zz.speed = 0; zz.sc = 0; zz.campS = 0; zz.chkT = 1e12; return zz; };
  const obj = id => T.campEstado().obj[id];
  return { p, poe, segura, idx, zumbi, obj };
})`;
const prep = `const { p, poe, segura, idx, zumbi, obj } = (new Function('return ' + arg.PREP)())(T);`;
const em = fn => `(T, arg) => { ${prep} return (${fn})(T, arg, p, poe, segura, idx, zumbi, obj); }`;
const rodar = (fn, a = {}) => J.page.evaluate(([src, arg]) => (new Function('T', 'arg', `return (${src})(T, arg)`))(window.__T, arg), [em(fn.toString()), { PREP, ...a }]);

test('menu: linha Modo, cartões dos atos com cadeado, Continuar, saída do formulário e saneSt', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, T => {
    localStorage.removeItem('tiroteio.campanha');
    T.campLibera(1, 1); // Normal: até o Ato II; Fácil também (libera nas mais fáceis); Difícil e Pesadelo não
    const sv = T.campSalvo();
    const el = document.createElement('div'); document.body.appendChild(el);
    const get = T.matchForm(el, { mode: 'zombies', zdiff: 1, zmode: 'campanha', ato: 3 }); // ato 3 ainda trancado: cai no liberado
    const o1 = get(), cards = [...el.querySelectorAll('[data-ato]')].map(b => [b.dataset.ato, b.disabled]);
    const modos = [...el.querySelectorAll('[data-zm]')].map(b => [b.dataset.zm, b.disabled]);
    el.querySelector('[data-ato="0"]').click(); const o2 = get();
    el.querySelector('[data-cont]').click(); const o3 = get();
    el.querySelector('[data-zm="classico"]').click(); const o4 = get(), mapasCl = [...el.querySelectorAll('[data-map]')].map(b => b.dataset.map);
    el.remove();
    return { sv: [sv.dif[0].ato, sv.dif[1].ato, sv.dif[2].ato, sv.dif[3].ato], o1, cards, modos, o2, o3, o4, mapasCl,
      s1: T.saneSt({ mode: 'zombies', map: 'vila', zmode: 'hack', ato: 99 }), s2: T.saneSt({ mode: 'zombies', map: 'vila', zmode: 'campanha', ato: 1.7 }),
      lixo: T.campSalvoSane({ dif: { 0: { ato: 'x' }, 1: { ato: 99, fim: 1 } }, inf: { vila: { 1: 1e9 } } }) };
  });
  assert.deepEqual(r.sv, [1, 1, 0, 0], 'liberar no Normal libera no Fácil, não nos mais difíceis');
  assert.equal(r.o1.zmode, 'campanha'); assert.equal(r.o1.ato, 1, 'ato trancado não passa'); assert.equal(r.o1.map, 'vila', 'o mapa vem da etapa');
  assert.deepEqual(r.cards.map(c => c[1]), [false, false, true, true, true], 'cadeado nos atos não liberados');
  assert.deepEqual(r.modos, [['classico', false], ['campanha', false], ['infinito', true]], 'infinito trancado sem concluir');
  assert.equal(r.o2.ato, 0); assert.equal(r.o3.ato, 1, 'Continuar = último liberado');
  assert.equal(r.o4.zmode, 'classico'); assert.ok(r.mapasCl.includes('vila') && r.mapasCl.includes('sanatorio'));
  assert.deepEqual([r.s1.zmode, r.s1.ato], ['classico', 4]); assert.deepEqual([r.s2.zmode, r.s2.ato], ['campanha', 1]);
  assert.equal(r.lixo.dif[0].ato, 0); assert.equal(r.lixo.dif[1].ato, 4); assert.equal(r.lixo.dif[1].fim, true); assert.equal(r.lixo.inf.vila[1], 999);
});

test('clássico sem mudança: CAMP desligado, sem cp no mundo, rodada e intervalo como antes', { timeout: 180000 }, async () => {
  await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 });
  const r = await noJogo(J.page, T => {
    if (T.Z.phase !== 'round') T.zStartRound();
    const r0 = T.Z.round; T.Z.toSpawn = 0; T.Z.zs.clear(); T.sim(1);
    const fase = T.Z.phase, fim = T.Z.phaseEnd - window.__simNow;
    return { on: T.CAMP.on, cp: 'cp' in T.zWorldState(), zmode: T.S.st.zmode, r0, r1: T.Z.round, fase, fim, nd: T.Z.nextDog < 100, nb: T.Z.nextBoss < 100,
      stub: T.ZD.zint.every(o => T.ZINT_FN[o.t]) };
  });
  assert.equal(r.on, false); assert.equal(r.cp, false, 'cp só na campanha');
  assert.equal(r.fase, 'break'); assert.ok(r.fim > 8.5 && r.fim <= 10, 'intervalo de 10 s'); assert.ok(r.nd && r.nb, 'cães e Carniceiro do clássico');
});

test('campanha: começa no Ato III com o kit, cena e objetivos de teste; quem entra no meio recebe o cp', { timeout: 180000 }, async () => {
  const r = await rodar((T, arg, p) => {
    T.ZINT_MAPA.sanatorio.push(
      { t: 'gerador', id: 'tz-ger', x: -6, z: -1, n: [1, 0] }, { t: 'alcapao', id: 'tz-alc', x: 5, z: 4, n: [0, 1] },
      { t: 'registro', id: 'tz-reg', x: 6, z: -6, n: [0, 1] }, { t: 'carga', id: 'tz-car', x: -4, z: 6, n: [0, -1] },
      { t: 'chave', id: 'tz-chv', chave: 'tz-chave', x: 2, z: 6, n: [0, 1] }, { t: 'gaiola', id: 'tz-gai', x: 5, z: -4, n: [0, 1], r: 2 });
    Object.assign(T.CAMP_OBJ, {
      'T.chegar': { tipo: 'chegar', titulo: 'Chegar', zona: { x: 6, z: 0, r: 1.5 } },
      'T.ler': { tipo: 'ler', titulo: 'Ler a ficha', alvo: { zint: 'san-recepcao' } },
      'T.alc': { tipo: 'usar', titulo: 'Abrir o alçapão', alvo: { zint: 'tz-alc' } },
      'T.reg': { tipo: 'usar', titulo: 'Fechar o registro', alvo: { zint: 'tz-reg' } },
      'T.car': { tipo: 'usar', titulo: 'Plantar', alvo: { zint: 'tz-car' } },
      'T.def': { tipo: 'defender', titulo: 'Gerador', alvo: { zint: 'tz-ger' }, dura: 8, hp: 400, hpPorJog: .35, atrai: 1, atraiR: 30, aoFeito: 'energia', radio: { ini: 'r1-energia', ok: 'r1-gerador-pegou', falha: 'r1-gerador-caiu' } },
      'T.seg': { tipo: 'segurar', titulo: 'Segurar', zona: { x: 0, z: -4, r: 3 }, dura: 3 },
      'T.esc': { tipo: 'escoltar', titulo: 'Escoltar', npc: 'cabo', rota: [[-3, 3], [3, 3], [3, 6]], hp: 300, hpPorJog: 0 },
      'T.col': { tipo: 'coletar', titulo: 'A chave', item: 'tz-chave', origem: { x: 2, z: 6 }, destino: { x: -6, z: 5, r: 1.5 } },
      'T.mat': { tipo: 'matar', titulo: 'Chefe', chefe: 14 },
      'T.fug': { tipo: 'fugir', titulo: 'Fuga', alvo: { zint: 'tz-gai' }, tempo: 20, embarque: 3 },
      'T.dep': { tipo: 'chegar', titulo: 'Depois', zona: { x: 0, z: 0, r: 30 } },
    });
    T.CAMP_OBJ['T.mat'].depois = ['T.dep'];
    const A = T.CAMP_ATOS[3]; A.objs = Object.keys(T.CAMP_OBJ).filter(k => k.startsWith('T.')); A.ini = ['T.mat'];
    T.campLibera(4, 3);
    T.S.st = { ...T.S.st, zmode: 'campanha', ato: 2 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    const e0 = T.campEstado(), ph0 = T.Z.phase, round0 = T.Z.round, cena = !!T.CAMP.c.cena;
    T.sim(T.Z.phaseEnd - window.__simNow + .2); // a cena de abertura (cartões do O3-D04) segura a pré-rodada
    const zi = T.ZD.zint.filter(o => o.id?.startsWith('tz-')).map(o => [o.id, !T.ZC.world.zint[T.ZD.zint.indexOf(o)].off]);
    const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; } };
    T.srvOnData(c, { t: 'join', v: 2, pv: 3, name: 'Meio' }); T.sim(.05);
    const st = c.out.filter(m => m.t === 'state' && m.z).pop(), q = T.S.players.get(c.pid);
    T.srvDrop(c);
    return { on: e0.on, et: e0.et, ph0, round0, round: T.Z.round, ph: T.Z.phase, cena, inv: p.inv, perks: p.perks, mh: p.maxHp, money: p.money, zi,
      ativos: Object.entries(T.campEstado().obj).filter(([, o]) => o.st === 'ativo').map(([k]) => k), cp: st?.z?.cp, qAlive: q?.alive, nextDog: T.Z.nextDog };
  });
  assert.equal(r.on, true); assert.equal(r.et, 3); assert.equal(r.ph0, 'pre'); assert.equal(r.round0, 10); assert.ok(r.cena, 'cena de abertura');
  assert.equal(r.round, 11, 'a etapa III começa na rodada 11'); assert.equal(r.ph, 'round');
  assert.equal(r.inv.primary, 'python'); assert.equal(r.inv.secondary, 'm14'); assert.deepEqual(r.perks, ['jug']); assert.equal(r.mh, 250); assert.equal(r.money, 3500);
  assert.ok(r.zi.length === 6 && r.zi.every(z => z[1]), 'interativos da campanha montados');
  assert.deepEqual(r.ativos, ['T.mat']); assert.ok(r.nextDog > 1e8, 'cães do clássico desligados');
  assert.ok(r.cp && r.cp.et === 3 && r.cp.ob.some(o => o[0] === 'T.mat' && o[1] === 'ativo'), 'quem entra recebe o cp');
  assert.equal(r.qAlive, false, 'quem entra em rodada espera a próxima (espectador)');
});

test('objetivos: matar libera o seguinte (depois); chegar; ler (terminal)', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, p, poe, segura, idx, zumbi, obj) => {
    segura(); T.campEvento('chefe', 14); T.sim(.1);
    const mat = obj('T.mat').st, dep = obj('T.dep').st;
    T.campObjAtiva('T.chegar'); T.campObjAtiva('T.ler'); poe(p, 0, -4); T.sim(.1); const longe = obj('T.chegar').st;
    poe(p, 6, 0); T.sim(.1); const perto = obj('T.chegar').st;
    poe(p, -7, 4); T.srvZUse(p, { k: 'zint', id: idx('san-recepcao') }); T.sim(.1);
    return { mat, dep, longe, perto, ler: obj('T.ler').st, cli: T.CAMP.c.obj['T.ler']?.st };
  });
  assert.equal(r.mat, 'feito'); assert.equal(r.dep, 'feito', 'T.dep (zona grande) ativado pelo depois e feito');
  assert.equal(r.longe, 'ativo'); assert.equal(r.perto, 'feito'); assert.equal(r.ler, 'feito'); assert.equal(r.cli, 'feito', 'o cliente soube');
});

test('objetivos usar (segurar F): alçapão zera ao soltar; registro soma e chama os zumbis; carga', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, p, poe, segura, idx, zumbi, obj) => {
    segura(); for (const k of ['T.alc', 'T.reg', 'T.car']) T.campObjAtiva(k);
    const hold = (i, s) => { for (let t = 0; t < s; t += .1) { T.srvZHold(p, { k: 'zint', id: i }); T.sim(.1); } };
    const ia = idx('tz-alc'), ir = idx('tz-reg'), ic = idx('tz-car');
    poe(p, 5, 3); hold(ia, 2); const meio = T.Z.zint[ia].st, prog = T.Z.zint[ia].prog; T.sim(1); const solto = [T.Z.zint[ia].st, T.Z.zint[ia].prog];
    hold(ia, 6.4); const alc = [T.Z.zint[ia].st, obj('T.alc').st, T.ZC.zint[ia].st];
    poe(p, 6, -5); hold(ir, 5); const chama = !!T.CAMP.chama; T.sim(1); const reg1 = [T.Z.zint[ir].st, T.Z.zint[ir].prog];
    hold(ir, 7.4); const reg = [T.Z.zint[ir].st, obj('T.reg').st];
    poe(p, -4, 5); hold(ic, 4.3);
    return { meio, prog, solto, alc, chama, reg1, reg, car: [T.Z.zint[ic].st, obj('T.car').st] };
  });
  assert.equal(r.meio, 'abrindo'); assert.ok(r.prog > 1.5); assert.deepEqual(r.solto, ['pronto', 0], 'soltou: zera');
  assert.deepEqual(r.alc, ['aberto', 'feito', 'aberto']);
  assert.equal(r.chama, true, 'quem segura o registro chama os zumbis'); assert.equal(r.reg1[0], 'pronto'); assert.ok(r.reg1[1] > 4.5, 'registro soma');
  assert.deepEqual(r.reg, ['fechado', 'feito']); assert.deepEqual(r.car, ['armada', 'feito']);
});

test('objetivo defender: alvo falso apanha dos zumbis, falha e volta no intervalo, depois liga a energia', { timeout: 90000 }, async () => {
  const r = await rodar((T, arg, p, poe, segura, idx, zumbi, obj) => {
    segura(); T.campObjAtiva('T.def'); const ig = idx('tz-ger');
    poe(p, 6, 6); T.srvZUse(p, { k: 'zint', id: ig }); const longe = T.Z.zint[ig].st;
    poe(p, -4.5, -1); T.srvZUse(p, { k: 'zint', id: ig }); const st1 = T.Z.zint[ig].st, alvo = T.CAMP.alvos[0], hp0 = alvo?.hp;
    poe(p, 6, 6); const z = zumbi(-4.9, -1); T.sim(3); const hp1 = alvo.hp, tgt = z.tgt === alvo;
    const src = [[0, 0]]; src.y = [0]; T.campFontes(src); const fonte = src.length === 2;
    alvo.hp = 0; T.sim(.1); const falhou = [obj('T.def').st, T.Z.zint[ig].st, T.CAMP.alvos.length];
    T.Z.zs.clear(); T.campFimRodada(); const volta = [obj('T.def').st, T.Z.zint[ig].st];
    T.zStartRound(); segura();
    poe(p, -4.5, -1); T.srvZUse(p, { k: 'zint', id: ig }); poe(p, 6, 6); T.sim(8.2);
    return { longe, st1, hp0, hp1, tgt, fonte, falhou, volta, fim: [obj('T.def').st, T.Z.zint[ig].st, T.Z.power, T.CAMP.alvos.length], radio: T.CAMP.c.radioQ.map(x => x[1]) };
  });
  assert.equal(r.longe, 'pronto', 'F de longe não liga'); assert.equal(r.st1, 'pegando'); assert.equal(r.hp0, 400);
  assert.equal(r.tgt, true, 'o zumbi perto escolheu o gerador'); assert.ok(r.hp1 < r.hp0, `o gerador não apanhou (${r.hp1})`); assert.equal(r.fonte, true, 'fonte do campo de fluxo');
  assert.deepEqual(r.falhou, ['falhou', 'afogado', 0]); assert.deepEqual(r.volta, ['ativo', 'pronto']);
  assert.deepEqual(r.fim, ['feito', 'ligado', true, 0]);
});

test('objetivos segurar, escoltar (NPC cinemático e alvo falso) e o limite de 4 mensagens por segundo', { timeout: 90000 }, async () => {
  const r = await rodar((T, arg, p, poe, segura, idx, zumbi, obj) => {
    segura();
    T.campObjAtiva('T.seg'); poe(p, 6, 6); T.sim(1); const fora = obj('T.seg').p;
    poe(p, 0, -4); let msgs = 0; const env = T.CAMP.obj['T.seg']; let last = env.envT;
    for (let i = 0; i < 32; i++) { T.sim(.1); if (env.envT !== last) { msgs++; last = env.envT; } }
    const seg = obj('T.seg').st;
    T.campObjAtiva('T.esc'); poe(p, 6, 6); T.sim(1); const parado = T.CAMP.npc?.a.pos.slice();
    const a = T.CAMP.npc.a; a.hp = 0; T.sim(.1); const falhou = obj('T.esc').st; T.campFimRodada(); const volta = [obj('T.esc').st, T.CAMP.npc.a.pos.slice(0, 1)[0]];
    poe(p, -2, 3); for (let i = 0; i < 80 && obj('T.esc').st === 'ativo'; i++) { const P = T.CAMP.npc?.a.pos; if (P) poe(p, P[0] + .8, P[2]); T.sim(.1); }
    return { fora, msgs, seg, parado, falhou, volta, esc: obj('T.esc').st, npcCli: !!T.CAMP.c.npc, falas: T.CAMP.c.radioQ.filter(x => x[0] === 'fala').map(x => x[1]) };
  });
  assert.equal(r.fora, 0, 'sem ninguém na zona o tempo não anda'); assert.equal(r.seg, 'feito'); assert.ok(r.msgs <= 4 * 3.2 + 2, `${r.msgs} mensagens em 3,2 s`);
  assert.deepEqual(r.parado, [-3, 0, 3], 'NPC sem ninguém perto não anda'); assert.equal(r.falhou, 'falhou'); assert.deepEqual(r.volta, ['ativo', -3], 'volta ao começo da rota');
  assert.equal(r.esc, 'feito'); assert.equal(r.npcCli, true, 'posição do NPC chega ao cliente');
});

test('objetivo coletar: chave no chão, portador cai e deixa o item, entrega; trava camp: na porta', { timeout: 90000 }, async () => {
  const r = await rodar((T, arg, p, poe, segura, idx, zumbi, obj) => {
    segura(); T.campObjAtiva('T.col'); const ik = idx('tz-chv'); const st0 = [T.Z.zint[ik].st, T.ZC.zint[ik].st, T.ZC.world.zint[ik].g.visible];
    const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; } };
    T.srvOnData(c, { t: 'join', v: 2, pv: 3, name: 'Portador' }); const q = T.S.players.get(c.pid); q.alive = true; q.downed = false; T.sim(.1);
    q.alive = true; q.downed = false; poe(q, 2, 5.5); T.srvZUse(q, { k: 'zint', id: ik }); T.sim(.1); const lev = [T.Z.zint[ik].st, obj('T.col').q === q.id];
    poe(q, 4, 1); T.sim(.1); q.downed = true; T.sim(.1); const caiu = [T.Z.zint[ik].st, T.ZD.zint[ik].x, T.ZD.zint[ik].z, obj('T.col').q];
    poe(p, 4, 1.2); T.srvZUse(p, { k: 'zint', id: ik }); T.sim(.1); poe(p, -6, 5); T.sim(.1);
    const fim = [obj('T.col').st, T.CAMP.chaves.has('tz-chave'), T.Z.zint[ik].st];
    // trava: porta AC só com a chave 'tz-trava'
    T.CAMP_TRAVAS.sanatorio.AC = 'camp:tz-trava'; poe(p, 8, 0); const m0 = p.money; T.srvZUse(p, { k: 'door', id: 'AC' }); const fechada = !T.Z.doors.has('AC');
    T.CAMP.chaves.add('tz-trava'); T.srvZUse(p, { k: 'door', id: 'AC' }); const aberta = T.Z.doors.has('AC'), gratis = p.money === m0;
    delete T.CAMP_TRAVAS.sanatorio.AC; T.srvDrop(c);
    return { st0, lev, caiu, fim, fechada, aberta, gratis };
  });
  assert.deepEqual(r.st0, ['chao', 'chao', true], 'origem: a chave aparece no chão');
  assert.deepEqual(r.lev, ['levada', true]); assert.deepEqual(r.caiu, ['chao', 4, 1, null], 'quem carrega e cai deixa o item onde estava');
  assert.deepEqual(r.fim, ['feito', true, 'entregue']);
  assert.equal(r.fechada, true, 'porta travada não abre sem a chave'); assert.equal(r.aberta, true); assert.equal(r.gratis, true);
});

test('objetivo fugir (gaiola: embarque) e fim da etapa na rodada mínima', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, p, poe, segura, idx, zumbi, obj) => {
    segura(); T.campObjAtiva('T.fug'); const ig = idx('tz-gai'); poe(p, -6, 6); T.sim(1); const fora = obj('T.fug').st;
    poe(p, 5, -4); T.sim(.2); const emb = T.Z.zint[ig].st; T.sim(3); const fug = [obj('T.fug').st, T.Z.zint[ig].st, T.CAMP.fugiram];
    for (const k in T.CAMP.obj) if (T.CAMP.obj[k].st !== 'feito') T.campForca(k);
    T.Z.round = 14; T.campFimRodada(); const antes = !!T.CAMP.fim; T.Z.round = 15; T.campFimRodada();
    return { fora, emb, fug, antes, fimEt: T.CAMP.fim, cena: T.CAMP.c.cena?.L.length, salvo: T.campSalvo().dif[1].ato };
  });
  assert.equal(r.fora, 'ativo'); assert.equal(r.emb, 'embarque'); assert.deepEqual(r.fug, ['feito', 'subiu', ['h']]);
  assert.equal(r.antes, false, 'não termina antes da rodada mínima'); assert.equal(r.fimEt.prox, 4, 'próxima etapa: IV'); assert.equal(r.fimEt.troca, false, 'mesmo mapa');
});

test('checkpoint: time caído -> Repetir o Ato recomeça a etapa com o kit', { timeout: 90000 }, async () => {
  const r = await rodar((T, arg, p, poe, segura) => {
    T.sim(T.CAMP.fim.t - window.__simNow + .2); const et = T.CAMP.et; // a cena acaba e a etapa IV começa
    const ini = T.CAMP_ATOS[et]; segura(); p.money = 99999; p.perks = []; p.dwEnd = 0; T.zHurt(p, 1e6, null); T.sim(.2);
    const over = [T.CAMP.over, T.S.phase, Math.round(T.S.phaseEnd - window.__simNow), T.CAMP.c.over?.et];
    T.campRepetir(); T.sim(.3);
    return { et, id: ini.id, over, depois: [T.S.phase, T.Z.phase, T.CAMP.et, T.Z.round, p.money, p.inv.secondary, p.perks.join(), T.CAMP.over] };
  });
  assert.equal(r.id, 'IV'); assert.deepEqual(r.over.slice(0, 3), [true, 'over', 15]); assert.equal(r.over[3], r.et);
  assert.deepEqual(r.depois, ['zombies', 'pre', r.et, 15, 5000, 'galil', 'jug,speed', false]);
});

test('4 trocas de mapa seguidas: bagagem (pontos, PaP, bebidas), caído levanta sem bebidas, morto ganha o kit, sem vazar estado', { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, p) => {
    T.CAMP_ATOS[4].mapa = 'vila'; T.CAMP_ATOS[5].mapa = 'sanatorio'; T.CAMP_ATOS[6].mapa = 'vila';
    T.CAMP_ATOS.push({ id: 'X', ato: 4, nome: 'Teste', mapa: 'sanatorio', rod0: 26, rodMin: 26, rodMax: 26, objs: [], ini: [] });
    T.CAMP_KIT.X = { pts: 111, armas: ['m1911'], bebidas: [] };
    T.CAMP_ATOS[3].objs = []; T.CAMP_ATOS[3].ini = [];
    T.S.st = { ...T.S.st, zmode: 'campanha', ato: 2 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    window.__trocas = []; window.__base = {};
    return T.CAMP.et;
  });
  assert.equal(r, 3);
  for (let k = 0; k < 4; k++) {
    const t = await rodar((T, arg, p) => {
      const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; } };
      const c2 = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; } };
      T.srvOnData(c, { t: 'join', v: 2, pv: 3, name: 'Caido' + arg.k }); T.srvOnData(c2, { t: 'join', v: 2, pv: 3, name: 'Morto' + arg.k });
      const q = T.S.players.get(c.pid), m = T.S.players.get(c2.pid); T.sim(.1);
      const dbg = [T.Z.phase, q.alive, q.money, T.CAMP.kitPend.has(q.id)];
      T.Z.zs.clear(); T.Z.toSpawn = 0;
      p.money = 12345 + arg.k; p.inv.secondary = 'galil_pap'; p.perks = ['jug', 'speed']; p.maxHp = 250; p.bowie = true;
      Object.assign(q, { alive: true, downed: true, perks: [], money: 777, bleedAt: 1e12 }); m.alive = false;
      T.Z.doors.add(T.ZD.doors[0].id);
      const e0 = T.CAMP.et; T.Z.round = T.CAMP_ATOS[e0].rodMin; T.campFimEtapa(); T.sim(T.CAMP.fim.t - window.__simNow + .05); // a cena acaba: troca
      const tr = T.CAMP.trans?.fase; T.sendToHost({ t: 'camp', k: 'pronto' }); T.srvOnData(c, { t: 'camp', k: 'pronto' }); T.srvOnData(c2, { t: 'camp', k: 'pronto' }); T.sim(.1);
      const liberou = !T.CAMP.trans; T.sim(5.1);
      const res = { dbg, e0, e1: T.CAMP.et, mapa: T.S.st.map, cli: T.C.st.map, tr, liberou, round: T.Z.round, ph: T.Z.phase,
        host: [p.money, p.inv.secondary, p.perks.join(), p.maxHp, p.bowie, p.alive, p.hp], q: [q.downed, q.perks.length, q.money, q.alive], m: [m.alive, m.money, m.inv.primary],
        doors: T.Z.doors.size, zs: T.Z.zs.size, zcs: T.ZC.zs.size, zint: T.Z.zint.length === T.ZD.zint.length && T.ZC.zint.length === T.ZD.zint.length, alvos: T.CAMP.alvos.length,
        col: T.COL().length, ff: T.FF.nx * T.FF.nz, geo: T.renderer.info.memory.geometries, tex: T.renderer.info.memory.textures, filhos: T.ZC.world ? 1 : 0 };
      T.srvDrop(c); T.srvDrop(c2);
      return res;
    }, { k });
    // primeira volta a cada mapa: guarda a base; depois compara (nada cresce de troca em troca)
    const key = t.mapa;
    const b = await J.page.evaluate(([k, v]) => { const B = window.__base; if (!B[k]) { B[k] = v; return null; } return B[k]; }, [key, { col: t.col, ff: t.ff, geo: t.geo, tex: t.tex }]);
    assert.notEqual(t.e1, t.e0, `troca ${k}: etapa não andou`); assert.equal(t.tr, 'carga', 'espera o pronto'); assert.equal(t.liberou, true, 'pronto de todos libera');
    assert.equal(t.mapa, t.cli, 'host e cliente no mesmo mapa'); assert.equal(t.ph, 'round'); assert.equal(t.round, [16, 20, 21, 26][k]);
    assert.deepEqual(t.host.slice(0, 6), [12345 + k, 'galil_pap', 'jug,speed', 250, true, true], `troca ${k}: bagagem do host`); assert.equal(t.host[6], 250);
    assert.deepEqual(t.q, [false, 0, 777, true], 'caído levanta sem bebidas, com os pontos ' + JSON.stringify(t.dbg) + ' k' + k); assert.equal(t.m[0], true, 'morto volta');
    assert.equal(t.doors, 0, 'portas do mapa anterior não vazam'); assert.equal(t.zs + t.zcs + t.alvos, 0); assert.equal(t.zint, true);
    if (b) { assert.equal(t.col, b.col, 'COL do mesmo mapa igual'); assert.equal(t.ff, b.ff); assert.ok(t.geo <= b.geo * 1.05 + 20, `geometrias cresceram ${b.geo} -> ${t.geo}`); assert.ok(t.tex <= b.tex + 4, `texturas cresceram ${b.tex} -> ${t.tex}`); }
  }
  const fim = await noJogo(J.page, T => ({ erros: null, salvo: T.campSalvo().dif[1].ato }));
  assert.equal(fim.salvo, 4, 'o salvo acompanhou os atos');
  assert.deepEqual(J.erros, []);
});

test('checkpoint sem resposta do host: volta ao lobby e desliga a campanha', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, p, poe, segura) => {
    segura(); p.perks = []; p.dwEnd = 0; T.zHurt(p, 1e6, null); T.sim(.2); const over = T.CAMP.over;
    T.sim(15.5);
    return { over, lobby: T.S.lobby, on: T.CAMP.on, zon: T.Z.on };
  });
  assert.equal(r.over, true); assert.deepEqual([r.lobby, r.on, r.zon], [true, false, false]);
  assert.deepEqual(J.erros, []);
});
