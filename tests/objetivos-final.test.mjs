// Objetivos do mapa (13/10), o fim da sequência do Sanatório (o antigo Ato V e o final, que eram na arena Galeria 7): V.1 plantar as 3
// cargas no Sanatório (Torre d'água, Caldeiras, Crematório), V.2 sobreviver à Névoa, F.1 o Diretor na versão de campo (sem púlpito,
// tanques, junções, maré nem corrente), F.2 fugir segurando a zona da ambulância da Portaria e o fim da sequência -> "OBJETIVOS
// CONCLUÍDOS" e rodadas infinitas com a escalada e os chefes de campo. Sem cena, créditos, salvo nem "campanha" na tela.
// Substitui tests/campanha-diretor.test.mjs e tests/campanha-final.test.mjs (o que era só da arena saiu: ver o relatório do A5).
// Rodar: node --test --test-concurrency=1 tests/objetivos-final.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
process.env.ZV2_OBJ = '1'; // o modo dos objetivos (o _jogo.mjs liga o clássico de antes sem isto)
const { abrirJogo, criarSala, noJogo } = await import('./_jogo.mjs');

let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 }); await J.page.evaluate(() => localStorage.removeItem('tiroteio.campanha')); }, { timeout: 240000 });
after(async () => { await J?.fechar(); });

const PREP = `(T => {
  const p = T.S.players.get('h'), CH = T.CAMP_CH, agora = () => window.__simNow;
  const poe = (q, x, z, y = 0) => { q.pos = [x, y, z]; if (q === p) { T.me.pos.set(x, y, z); T.me.vel.set(0, 0, 0); } };
  const idx = id => T.ZD.zint.findIndex(o => o.id === id);
  const fim = () => { for (const z of [...T.Z.zs.values()]) T.zKill(z, null, 'body', 'nuke', false, true); T.Z.toSpawn = 0; T.Z.reQ = []; T.sim(.5); T.sim(Math.max(0, T.Z.phaseEnd - agora()) + .2); };
  const ob = id => T.campEstado().obj[id]?.st;
  const atk = id => CH.def.ataques.find(a => a.id === id);
  const tel = () => T.CAMP.c.tel[T.CAMP.c.tel.length - 1];
  const limpa = () => { if (CH.atk) { CH.atk = null; T.broadcast({ t: 'camp', k: 'telx' }); } T.drSolta(); CH.prox = 1e12; CH.lacT = 1e12; for (const o of [...T.Z.zs.values()]) if (o !== CH.z && !o.drCoro) T.Z.zs.delete(o.id); };
  const quieto = () => { const z = CH.z; T.Z.reQ = []; if (z) { z.speed = 0; z.atkT = 1e12; z.chkT = 1e12; } CH.prox = 1e12; T.Z.spawnT = 1e12; T.Z.toSpawn = Math.max(T.Z.toSpawn, 5); for (const o of [...T.Z.zs.values()]) if (o !== z) T.Z.zs.delete(o.id); };
  const chao = (x, z) => { const D = CH.z; D.st = 'in'; D.body.pos.set(x, 0, z); D.atord = 0; D.fracoAte = 0; CH.inv = 0; };
  return { p, CH, agora, poe, idx, fim, ob, atk, tel, limpa, quieto, chao };
})`;
const em = fn => `(T, arg) => { const H = (new Function('return ' + arg.PREP)())(T); return (${fn})(T, arg, H); }`;
const rodar = (fn, a = {}) => J.page.evaluate(([src, arg]) => (new Function('T', 'arg', `return (${src})(T, arg)`))(window.__T, arg), [em(fn.toString()), { PREP, ...a }]);
const CARGAS = ['san-carga-torre', 'san-carga-caldeiras', 'san-carga-crematorio'];

test('Sanatório: a sequência termina no V; as 3 cargas estão no mapa, sem "Segure F" antes do V.1; nada da arena', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { idx } = H, o = { cadeia: T.CAMP.cadeia.map(e => T.CAMP_ATOS[e].id), mapaV: T.CAMP_ATOS[6].mapa, et: T.CAMP_ATOS[T.CAMP.et].id };
    o.cargas = arg.CARGAS.map(id => { const i = idx(id), Z0 = T.ZD.zint[i], e = T.ZC.world.zint[i], c = T.ZC.zint[i]; return [i >= 0, Z0?.t, !e?.off, T.campZintVez(Z0), T.ZINT_FN.carga.prompt(Z0, i, c, T.ZINT.carga)]; });
    o.zonas = arg.CARGAS.map(id => { const Z0 = T.ZD.zint[idx(id)]; return T.ZD.zoneAt(Z0.x + Z0.n[0], Z0.z + Z0.n[1]); });
    o.longe = Math.min(...[[0, 1], [0, 2], [1, 2]].map(([a, b]) => { const A = T.ZD.zint[idx(arg.CARGAS[a])], B = T.ZD.zint[idx(arg.CARGAS[b])]; return Math.hypot(A.x - B.x, A.z - B.z); }));
    o.fugaZona = [T.ZD.zoneAt(T.CAMP_V.fuga.zona.x, T.CAMP_V.fuga.zona.z), T.CAMP_OBJ['F.2'].zona.x === T.CAMP_V.fuga.zona.x && T.CAMP_OBJ['F.2'].zona.r === T.ZBAL.fuga.raio, T.CAMP_OBJ['F.2'].alvo];
    o.radio = ['r5s-inicio', 'r5s-cargas', 'r5s-fuga'].map(id => /gaiola|galeria/i.test(T.CAMP_RADIO_TXT[id]?.txt ?? 'gaiola'));
    o.textos = [T.CAMP_OBJ['V.1'].titulo, T.CAMP_OBJ['V.2'].titulo, T.CAMP_OBJ['F.1'].titulo, T.CAMP_OBJ['F.2'].titulo].join(' | ');
    o.arena = ['galeria7' in T.MAPS || typeof T.gal7Estado !== 'undefined' || typeof T.GAL7 !== 'undefined', typeof T.drArena !== 'undefined']; // a arena saiu do jogo (limpeza A8)
    return o;
  }, { CARGAS });
  assert.deepEqual(r.cadeia, ['III', 'IV', 'C2', 'V']); assert.equal(r.mapaV, 'sanatorio'); assert.equal(r.et, 'III');
  for (const c of r.cargas) assert.deepEqual(c, [true, 'carga', true, false, null], 'montada, sem prompt fora do V.1 ' + JSON.stringify(c));
  assert.deepEqual(r.zonas, ['M', 'P', 'r7']); assert.ok(r.longe > 50, 'longe umas das outras ' + r.longe);
  assert.deepEqual(r.fugaZona, ['r2', true, undefined], 'a fuga é uma zona na Portaria, sem gaiola');
  assert.deepEqual(r.radio, [false, false, false], 'as falas do Sanatório não falam em gaiola nem galeria');
  assert.doesNotMatch(r.textos, /campanha|\bato\b|gaiola|galeria/i);
  assert.deepEqual(r.arena, [false, false]); assert.deepEqual(J.erros, []);
});

test('V.1 (cargas, segurar F) -> V.2 (a rodada da Névoa) -> F.1: o Diretor entra na rodada seguinte, na versão de campo', { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, poe, idx, fim, ob, agora } = H; p.dwEnd = 1e12;
    T.CAMP.etR = T.Z.round; T.campEtapaPrepara(T.CAMP_ATOS.findIndex(a => a.id === 'V'), false); T.sim(.2);
    const o = { et: T.CAMP_ATOS[T.CAMP.et].id, ob0: ['V.1', 'V.2', 'F.1', 'F.2'].map(ob), radioIni: T.CAMP_ATOS[T.CAMP.et].radioIni };
    o.vez = arg.CARGAS.map(id => { const i = idx(id); return [T.campZintVez(T.ZD.zint[i]), T.ZINT_FN.carga.prompt(T.ZD.zint[i], i, T.ZC.zint[i], T.ZINT.carga)?.hold]; });
    // carga da Torre pelo caminho de verdade: segurar F 4 s ao lado dela
    const i1 = idx(arg.CARGAS[0]), c1 = T.ZD.zint[i1]; poe(p, c1.x + c1.n[0] * 1.1, c1.z + c1.n[1] * 1.1);
    const tr = []; for (let k = 0; k < 30 && T.Z.zint[i1].st !== 'armada'; k++) { T.sendToHost({ t: 'hold', k: 'zint', id: i1 }); T.sim(.15); if (k === 5) tr.push(T.Z.zint[i1].st); }
    o.c1 = [tr[0], T.Z.zint[i1].st, T.ZC.zint[i1].st, +T.campEstado().obj['V.1'].p.toFixed(2)];
    o.prompt1 = T.ZINT_FN.carga.prompt(c1, i1, T.ZC.zint[i1], T.ZINT.carga); // armada: sem prompt
    for (const id of arg.CARGAS.slice(1)) T.zintPoe(idx(id), 'armada', 0, 'h'); T.sim(.2);
    o.v = [ob('V.1'), ob('V.2'), ob('F.1')];
    fim(); o.r2 = [T.CAMP_VS.v2 === T.Z.round, T.Z.phase, T.CAMP_EVS.id, ob('V.2')]; T.sim(1); o.v2p = T.campEstado().obj['V.2'].p;
    fim(); o.r3 = [ob('V.2'), ob('F.1')]; T.sim(.6);
    const z = CH.z; o.dr = [z?.kind, CH.campo, T.DRSRV.modo ?? 'chao', CH.tag ?? null, T.drProtecao?.() ?? 1, T.ZKIND[16].sz, z ? Math.round(Math.hypot(z.body.pos.x - p.pos[0], z.body.pos.z - p.pos[2])) : -1, z?.body.pos.y];
    o.cli = [T.CAMP.c.ch?.k, T.CAMP.c.ch?.f];
    return o;
  }, { CARGAS });
  assert.deepEqual([r.et, r.ob0], ['V', ['ativo', 'oculto', 'oculto', 'oculto']]); assert.equal(r.radioIni, 'r5s-inicio');
  assert.deepEqual(r.vez, [[true, 1], [true, 1], [true, 1]], 'no V.1 as 3 cargas mostram o "Segure F"');
  assert.deepEqual(r.c1, ['plantando', 'armada', 'armada', .33], JSON.stringify(r)); assert.equal(r.prompt1, null);
  assert.deepEqual(r.v, ['feito', 'ativo', 'oculto']);
  assert.deepEqual(r.r2, [true, 'round', 'nevoa', 'ativo'], 'a rodada da Névoa ' + JSON.stringify(r.r2)); assert.ok(r.v2p >= 0 && r.v2p <= 1);
  assert.deepEqual(r.r3, ['feito', 'ativo']);
  assert.equal(r.dr[0], 16, 'o Diretor entrou ' + JSON.stringify(r.dr)); assert.deepEqual(r.dr.slice(1, 6), [true, 'chao', null, 1, 1.3], 'versão de campo: no chão, sem PROTEGIDO');
  assert.ok(r.dr[7] < .5, 'no chão do Sanatório'); assert.deepEqual(r.cli, [16, 1]); assert.deepEqual(J.erros, []);
});

test('Diretor de campo: dose, onda, abraço (o tiro no cano solta) e chamada; sem maré nem corrente; fases 2 e 3 sem mergulho; coro', { timeout: 180000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, atk, limpa, tel, chao } = H; quieto(); limpa(); T.campEvDesliga(); /* sem o evento da agenda da rodada (o Apagão da 3 no Sanatório apagaria as luzes: aqui se mede o Diretor) */ chao(18, 4); const z = CH.z; p.dwEnd = 0; p.hp = p.maxHp = 1000; p.perks = []; p.crouch = 0; p.zkDose = null; T.CAMP.c.tel = [];
    const o = { semCampo: ['mare', 'corrente'].map(id => [atk(id) ? atk(id).campo : 0, !!atk(id)?.ok?.()]) }; // os ataques da arena saíram do Diretor
    // dose: 3 seringas em leque; 20 + 1 dose do Enfermeiro, nada no aviso
    poe(p, 18, -3); z.yaw = 0; const h0 = p.hp; T.campChefeAtaca(z, atk('dose'), p); T.sim(1 / 60); o.td = [tel().s, tel().f, tel().p.length];
    T.sim(.55); o.dAntes = h0 - p.hp; T.sim(1.2); o.dose = h0 - p.hp; o.doses = (p.zkDose || []).filter(t => t > agora()).length; limpa(); T.sim(1);
    // onda: 45 e empurrão
    chao(18, 4); poe(p, 18, 0); const h2 = p.hp; T.me.lungeEnd = 0; T.campChefeAtaca(z, atk('onda'), p); T.sim(1.1); o.oAntes = h2 - p.hp; T.sim(.2); o.onda = h2 - p.hp; o.emp = T.me.lungeEnd > agora(); limpa(); T.sim(1);
    // abraço: preso, o fraco abre; outro jogador acertando o cano solta
    chao(18, 4); poe(p, 18, 2); T.campChefeAtaca(z, atk('abraco'), p); T.sim(.9); o.preso = [T.DRSRV.presos.includes('h'), T.DRCLI.presoAte > agora(), z.fracoAte > agora()];
    T.drDanoFraco(z, 10, 'fraco', 'm1911', { id: 'outro' }); T.sim(1 / 60); o.solto = [T.DRSRV.presos.length, T.DRCLI.presoAte > agora()]; limpa(); T.sim(2);
    // chamada: 2 Enfermeiros e 4 comuns perto (sem poços)
    chao(18, 4); poe(p, 18, -2); T.campChefeAtaca(z, atk('chamada'), p); T.sim(2); const lac = [...T.Z.zs.values()].filter(x => x.lac);
    o.lac = [lac.length, lac.filter(x => x.kind === 10).length]; for (const x of lac) T.Z.zs.delete(x.id); limpa();
    // fase 2: sem tanques (dano cheio), sem mergulho, tamanho 2,2; lacaios comuns (os Afogados eram da água da arena)
    poe(p, 18, -4); p.dwEnd = 1e12; CH.inv = 0; z.hp = z.maxHp; const h = z.hp, g = Math.round(z.maxHp * .05); T.zHit(p, z.id, g, 'body', 'm1911', false); o.semProt = [h - z.hp, g]; // 5% da vida: abaixo do limite da fase
    CH.inv = 0; z.hp = z.maxHp * .71; T.zHit(p, z.id, 5000, 'body', 'm1911', false); T.sim(.1); o.f2 = [CH.fase, T.DRSRV.modo ?? 'chao', T.ZKIND[16].sz, +z.body.pos.y.toFixed(2)];
    T.sim(.5); o.semNado = T.DRSRV.modo ?? 'chao'; // o mergulho entre os poços saiu com a arena
    T.campChefeLacaios(CH.def.lacaios); const af = [...T.Z.zs.values()].filter(x => x.lac); o.lacF2 = [af.length, af.every(x => x.kind === 0)]; for (const x of af) T.Z.zs.delete(x.id);
    // fase 3: 2 Pregadores perto, coro cura 3%; nada de apagão nem das junções fora da arena
    CH.inv = 0; z.hp = z.maxHp * .36; T.zHit(p, z.id, 5000, 'body', 'm1911', false); T.sim(.2);
    o.f3 = [CH.fase, T.drPregadores(), [...T.Z.zs.values()].filter(x => x.drCoro).map(x => x.kind).join(), T.ZC.world.pool.some(P => P.L.intensity > 0)];
    limpa(); CH.inv = 0; z.hp = z.maxHp * .2; const hc = z.hp; T.campChefeAtaca(z, atk('coro'), p); T.sim(2.1); o.cura = +((z.hp - hc) / z.maxHp).toFixed(3); limpa();
    return o;
  });
  assert.deepEqual(r.semCampo, [[0, false], [0, false]], 'maré e corrente não existem fora da arena');
  assert.deepEqual(r.td, [.6, 'linha', 3]); assert.equal(r.dAntes, 0); assert.equal(r.dose, 20); assert.equal(r.doses, 1);
  assert.equal(r.oAntes, 0); assert.equal(r.onda, 45); assert.ok(r.emp, 'empurrão');
  assert.deepEqual(r.preso, [true, true, true]); assert.deepEqual(r.solto, [0, false], 'o tiro no cano soltou');
  assert.deepEqual(r.lac, [6, 2], 'chamada perto dos jogadores');
  assert.equal(r.semProt[0], r.semProt[1], 'sem tanques: dano cheio'); assert.deepEqual(r.f2, [1, 'chao', 2.2, 0], 'fase 2 no chão, grande');
  assert.equal(r.semNado, 'chao', 'não nada entre poços fora da arena'); assert.deepEqual(r.lacF2, [2, true]);
  assert.deepEqual(r.f3, [2, 2, '13,13', true], 'fase 3: Pregadores, sem apagão'); assert.equal(r.cura, .03);
  assert.deepEqual(J.erros, []);
});

test('morte do Diretor: fuga na hora (sem cena), Estouro sem fim, quem entra no meio; segurar a zona da Portaria; fim -> rodadas infinitas', { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, poe, fim, ob, agora, limpa } = H; p.dwEnd = 1e12; limpa(); T.Z.spawnT = agora();
    const z = CH.z; z.hp = 10; CH.inv = 0; CH.fase = CH.def.fases.length - 1; T.zHit(p, z.id, 100, 'body', 'm1911', false); T.sim(.1);
    const o = { morte: [CH.z, ob('F.1'), ob('F.2'), T.CAMP_VS.fase, T.CAMP_EVS.id, T.CAMP_EVS.fuga, T.Z.phase, T.Z.toSpawn > 0, T.CAMP.c.cena ?? null] };
    // quem entra no meio na fuga
    const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; } };
    T.srvOnData(c, { t: 'join', v: 2, pv: 7, name: 'Meio' }); T.sim(.2);
    const st = c.out.filter(m => m.t === 'state' && m.z).pop(), cp = st?.z?.cp;
    o.meio = [cp?.ob?.find(x => x[0] === 'F.2')?.[1], cp?.ev?.[0]];
    T.srvDrop(c); T.sim(.2);
    // a zona: segurar o embarque (quem sai recomeça)
    const Zn = T.CAMP_V.fuga.zona, O = () => T.campEstado().obj['F.2'];
    poe(p, Zn.x, Zn.z); T.sim(5); o.meia = +O().p.toFixed(1);
    const pAntes = +O().p.toFixed(1); poe(p, 0, 0); T.sim(.3); o.saiu = [+O().p.toFixed(1) === pAntes, ob('F.2')]; // zona vazia: o embarque pausa
    poe(p, Zn.x, Zn.z); for (let k = 0; k < 120 && ob('F.2') !== 'feito'; k++) T.sim(.1);
    o.fugiu = [ob('F.2'), T.CAMP_VS.fase, T.Z.zs.size, T.Z.toSpawn, T.CAMP_EVS.id];
    T.sim(.6);
    o.fim = [T.CAMP.modo, T.CAMP.et, T.Z.phase, T.S.phase, !!document.getElementById('campCred'), !!document.getElementById('campCena'), localStorage.getItem('tiroteio.campanha')];
    o.tela = document.body.innerText.includes('OBJETIVOS CONCLUÍDOS');
    const hud = document.getElementById('campHud'); o.hudTxt = hud ? hud.innerText : '';
    // rodadas infinitas: a escalada (zInfRodada) e os chefes de campo continuam do jeito do infinito
    const r0 = T.Z.round; T.sim(Math.max(0, T.Z.phaseEnd - agora()) + .2); o.inf = [T.Z.round === r0 + 1, T.Z.phase, T.CAMP.modo, T.Z.nextDog < 1e9];
    return o;
  });
  assert.deepEqual(r.morte, [null, 'feito', 'ativo', 'fuga', 'estouro', true, 'round', true, null], 'fuga na hora ' + JSON.stringify(r.morte));
  assert.deepEqual(r.meio, ['ativo', 'estouro'], 'quem entra no meio recebe o F.2 e o Estouro da fuga');
  assert.ok(r.meia > .3 && r.meia < .7, 'metade do embarque ' + r.meia); assert.deepEqual(r.saiu, [true, 'ativo'], 'quem sai da zona: o embarque pausa (não recomeça)');
  assert.deepEqual(r.fugiu, ['feito', 'fim', 0, 0, null], 'fugiram: os zumbis caem, o Estouro acaba');
  assert.deepEqual(r.fim, ['infinito', -1, 'break', 'zombies', false, false, null], 'rodadas infinitas, sem créditos, cena nem salvo ' + JSON.stringify(r.fim));
  assert.ok(r.tela, 'OBJETIVOS CONCLUÍDOS na tela'); assert.doesNotMatch(r.hudTxt, /campanha|\bato\b/i);
  assert.deepEqual(r.inf, [true, 'round', 'infinito', true]); assert.deepEqual(J.erros, []);
});

test('depois dos objetivos: estreias dos tipos, legenda do rádio, chefe de campo (Vigia na 20, Foguista na 30, Diretor no chão) e rodízio', { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, fim } = H; p.dwEnd = 1e12; const o = { modo: T.CAMP.modo, et: T.CAMP.et };
    const cota = (k, r) => { const P = T.CAMP_ZKV.peso, P0 = { ...P }; for (const j of Object.keys(T.CAMP_MIX)) P[j] = +j === k ? 1 : 0; T.Z.round = r; T.Z.dogRound = false; T.Z.toSpawn = 60; T.Z.mixN = 0; T.campZkCotas(); for (const j in P) delete P[j]; Object.assign(P, P0); return T.CAMP_ZKS.rest[k] | 0; };
    const E = T.campRitmo().estreia; // estreia por mapa (CAMP_RITMO): a mesma dos objetivos; tipo fora da lista do mapa nunca nasce
    o.est = Object.keys(T.CAMP_MIX).map(Number).map(k => E[k] == null ? [k, Math.max(...[5, 12, 20, 30].map(r => cota(k, r))), 0, false] : [k, cota(k, E[k] - 1), cota(k, E[k]), cota(k, E[k] + 3) >= 1]); o.agua = T.CAMP_AGUA.sanatorio.length > 0; o.estMapa = E; // o Afogado pede ponto de água
    T.Z.round = 18; fim(); fim(); o.r20 = [T.Z.round, T.CAMP_INFS.pend?.k]; T.sim(5.5);
    const z = T.CAMP_CH.z; o.vigia = [z?.kind, T.CAMP_CH.campo];
    for (const x of [...T.Z.zs.values()]) if (x !== z) T.zKill(x, null, 'body', 'nuke', false, true); T.Z.toSpawn = 0; T.sim(1); o.segue = [T.Z.phase, T.Z.zs.has(z.id)];
    z.hp = 1; T.CAMP_CH.inv = 0; T.CAMP_CH.fase = T.CAMP_CH.def.fases.length - 1; T.zHit(p, z.id, 50, 'body', 'm1911', false); T.sim(.5); o.morto = [T.CAMP_CH.z, T.Z.phase];
    T.sim(Math.max(0, T.Z.phaseEnd - window.__simNow) + .2); T.Z.round = 29; fim(); o.r30 = T.Z.round; T.sim(5.5); o.foguista = [T.CAMP_CH.z?.kind, T.CAMP_CH.campo];
    for (const x of [...T.Z.zs.values()]) T.zKill(x, null, 'body', 'nuke', false, true); T.campChefeLimpa?.();
    { T.Z.round = 40; T.Z.phase = 'round'; T.Z.toSpawn = Math.max(T.Z.toSpawn, 3); const d = T.campChefeNasce(16, { campo: 1, rodada: 40 }); T.CAMP_CH.prox = 0; T.sim(8); o.diretor = [d?.kind, T.CAMP_CH.campo, T.DRSRV.modo ?? 'chao', !!T.CAMP_CH.z]; for (const x of [...T.Z.zs.values()]) T.zKill(x, null, 'body', 'nuke', false, true); }
    o.rod = [20, 30, 40, 50, 60, 70, 80, 25].map(r => { const c = T.campInfChefeDe(r); return c ? [c.k, c.vidaK] : null; });
    return o;
  });
  assert.deepEqual([r.modo, r.et], ['infinito', -1]);
  assert.deepEqual(r.est, [7, 8, 9, 10, 11, 12, 13].map(k => r.estMapa[k] == null || (k === 9 && !r.agua) ? [k, 0, 0, false] : [k, 0, 1, true]), JSON.stringify(r.est)); // no Sanatório: Penitente e Soldado nunca; Afogado só com água
  assert.deepEqual(Object.keys(r.estMapa).map(Number), [9, 10, 11, 12, 13], 'tipos do Sanatório');
  assert.deepEqual(r.r20, [20, 14]); assert.deepEqual(r.vigia, [14, true]); assert.deepEqual(r.segue, ['round', true], 'a rodada não termina com o chefe vivo');
  assert.equal(r.morto[0], null); assert.notEqual(r.morto[1], 'round');
  assert.equal(r.r30, 30); assert.deepEqual(r.foguista, [15, true]);
  assert.deepEqual(r.diretor, [16, true, 'chao', true]);
  assert.deepEqual(r.rod, [[14, 1], [15, 1], [16, 1], [15, 1.25], [14, 1.5], [16, 1.5], [15, 1.75], null]);
  assert.deepEqual(J.erros, []);
});

test('clássico: as cargas não existem no mundo, nada do V, do Diretor nem da fuga', { timeout: 600000 }, async () => {
  await rodar(T => { T.S.st = { ...T.S.st, zmode: 'classico' }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1); });
  await J.page.waitForFunction(() => window.__T.S.st.zmode === 'classico' && window.__T.Z.on && window.__T.ZC.world && !document.getElementById('warmMsg'), null, { timeout: 600000, polling: 300 });
  const r = await rodar((T, arg, H) => {
    const { p, idx, fim } = H; p.dwEnd = 1e12; const o = { on: T.CAMP.on, modo: T.CAMP.modo };
    o.cargas = arg.CARGAS.map(id => { const i = idx(id); return [i >= 0, !!T.ZC.world.zint[i]?.off, T.campZintVez(T.ZD.zint[i]), T.ZINT_FN.carga.prompt(T.ZD.zint[i], i, T.ZC.zint[i], T.ZINT.carga)]; });
    T.Z.round = 24; fim(); o.r = [T.Z.round, T.CAMP_CH.z, T.CAMP_EVS.id];
    return o;
  }, { CARGAS });
  assert.deepEqual([r.on, r.modo], [false, null]);
  for (const c of r.cargas) assert.deepEqual(c, [true, true, false, null]);
  assert.deepEqual(r.r, [25, null, null]); assert.deepEqual(J.erros, []);
});
