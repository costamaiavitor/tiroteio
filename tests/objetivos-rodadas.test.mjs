// Objetivos em rodadas certas (pedido do dono, 14/10): mais etapas (Vila: VA, VB, VC; Sanatório: SA, SB), cada uma começa na rodada
// dela (OBJ_RODADA) e, entre elas, a partida fica numa pausa sem objetivo ("Próximo objetivo na rodada N"); as portas não abrem mais
// sozinhas pelo objetivo (o time compra); Nogueira espera nas portas fechadas do caminho.
// Rodar: ZV2_OBJ=1 node --test --test-concurrency=1 tests/objetivos-rodadas.test.mjs
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
process.env.ZV2_OBJ ||= '1'; process.env.ZV2_NOVO ||= '1';
const { abrirJogo, criarSala, noJogo } = await import('./_jogo.mjs');

let J;
after(async () => { await J?.fechar(); });

// joga a cadeia inteira: cumpre a etapa com campForca e termina rodadas; anota em que rodada cada etapa começou
const corre = (T, arg) => {
  const p = T.S.players.get('h'); p.dwEnd = 1e12;
  const rodada = () => { if (T.Z.phase !== 'round') { T.Z.phaseEnd = window.__simNow; T.sim(.05); } };
  const acaba = () => { T.Z.toSpawn = 0; T.Z.zs.clear(); T.sim(.1); };
  T.S.st = { ...T.S.st, zmode: 'campanha', zdiff: 1 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1); rodada();
  const portas0 = [...T.Z.doors];
  const inicio = {}, pausas = [], hud = [];
  for (let k = 0; k < 40 && !T.CAMP.objFim; k++) {
    const A = T.CAMP_ATOS[T.CAMP.et];
    if (A && !A.pausa && !(A.id in inicio)) inicio[A.id] = T.Z.round;
    if (A?.pausa) { pausas.push(T.Z.round); T.sim(.3); const h = document.querySelector('#campObj')?.textContent || ''; if (h && !hud.includes(h)) hud.push(h); }
    else if (A) for (const id of A.objs) if (T.CAMP.obj[id] && T.CAMP.obj[id].st !== 'feito' && T.CAMP_OBJ[id].tipo !== 'escoltar') T.campForca(id); else if (T.CAMP.obj[id]?.st === 'ativo') T.campForca(id);
    acaba(); rodada();
  }
  return { inicio, pausas, hud, fim: T.CAMP.objFim, round: T.Z.round, portas0, portas: [...T.Z.doors] };
};

for (const map of ['vila', 'sanatorio']) {
  test(`${map}: cada etapa na rodada dela, pausa entre elas, portas só compradas`, { timeout: 300000 }, async () => {
    await J?.fechar(); J = await abrirJogo();
    await criarSala(J.page, { mode: 'zombies', map, zdiff: 1 });
    const r = await noJogo(J.page, corre);
    const R = await noJogo(J.page, T => ({ rod: T.OBJ_RODADA, cad: T.OBJ_MAPA }));
    for (const id of R.cad[map]) assert.equal(r.inicio[id], R.rod[id], `${id} começa na rodada ${R.rod[id]} (${JSON.stringify(r.inicio)})`);
    assert.ok(r.pausas.length > 0, 'houve pausa entre as etapas');
    assert.ok(r.hud.some(h => /Próximo objetivo na rodada \d+/.test(h)), 'painel da pausa: ' + r.hud.join(' | '));
    assert.equal(r.fim, true, 'objetivos concluídos');
    assert.ok(r.round <= 21, 'objetivos até a rodada 20: ' + r.round);
    assert.deepEqual(r.portas, r.portas0, 'nenhuma porta abriu sozinha');
  });
}

test('Vila: Nogueira não passa da porta F↔G fechada; anda depois de comprada', { timeout: 300000 }, async () => {
  await J?.fechar(); J = await abrirJogo();
  await criarSala(J.page, { mode: 'zombies', map: 'vila', zdiff: 1 });
  const r = await noJogo(J.page, T => {
    const p = T.S.players.get('h'); p.dwEnd = 1e12;
    T.S.st = { ...T.S.st, zmode: 'campanha', zdiff: 1 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    T.Z.phaseEnd = window.__simNow; T.sim(.05); T.Z.toSpawn = 50; T.Z.spawnT = 1e12;
    T.campEtapaPrepara(T.CAMP_ATOS.findIndex(a => a.id === 'II')); T.campForca('II.1'); T.campForca('II.2');
    const n = T.CAMP.npc, a = n.a; const anda = s => { for (let k = 0; k < s * 10; k++) { p.pos = [a.pos[0] + 1, 0, a.pos[2]]; T.sim(.1); } return n.feito; };
    const f0 = anda(3); const fech = { FG: T.Z.doors.has('FG'), IF: T.Z.doors.has('IF') };
    T.zAbrePorta('FG', p); T.zAbrePorta('IF', p); const f1 = anda(3);
    return { f0, f1, fech };
  });
  assert.deepEqual(r.fech, { FG: false, IF: false }, 'portas do caminho continuam fechadas');
  assert.equal(r.f0, 0, 'parado com o caminho fechado');
  assert.ok(r.f1 > 3, 'anda depois de comprar: ' + r.f1);
});

test('Vila: gerador só depois das 3 peças do motor (achar, pegar com F, levar ao gerador)', { timeout: 300000 }, async () => {
  await J?.fechar(); J = await abrirJogo();
  await criarSala(J.page, { mode: 'zombies', map: 'vila', zdiff: 1 });
  const r = await noJogo(J.page, T => {
    const p = T.S.players.get('h'); p.dwEnd = 1e12;
    const poe = (x, z) => { p.pos = [x, 0, z]; T.me.pos.set(x, 0, z); T.me.vel.set(0, 0, 0); };
    T.S.st = { ...T.S.st, zmode: 'campanha', zdiff: 1 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    T.Z.phaseEnd = window.__simNow; T.sim(.05); T.Z.toSpawn = 50; T.Z.spawnT = 1e12;
    const st = id => T.CAMP.obj[id]?.st, gi = T.ZD.zint.findIndex(o => o.id === 'gerador-pedreira');
    T.campForca('I.1'); T.sim(.3);
    const seta = document.querySelector('#campMark')?.innerHTML ?? T.CAMP.c.el?.mark?.innerHTML ?? '?';
    const zd0 = T.C.st.zdiff; T.C.st.zdiff = 0; T.sim(.3); const setaFacil = T.CAMP.c.el?.mark?.innerHTML ?? ''; T.C.st.zdiff = zd0;
    const depoisSino = { pecas: ['I.P1', 'I.P2', 'I.P3'].map(st), ger: st('I.2') };
    poe(47.7, -62); T.sim(.05); T.zInteract(0); const promptGer = T.ZC.act ? T.ZC.act.txt : null;
    T.srvZUse(p, { k: 'zint', id: gi }); T.sim(.1); const gerAntes = T.Z.zint[gi].st;
    const pecas = T.CAMP_VILA.pecas, txt = [], livres = [];
    for (const [k, pc] of pecas.entries()) {
      const i = T.ZD.zint.findIndex(o => o.id === pc.id), o = T.ZD.zint[i]; livres.push([T.zRoomAt(o.x, o.z), T.footFreeR(o.x, o.z, .5), o.x !== pc.x || o.z !== pc.z]);
      poe(o.x, o.z + .6); T.sim(.05); T.zInteract(0); txt.push(T.ZC.act ? T.ZC.act.txt : null);
      T.srvZUse(p, { k: 'zint', id: i }); T.sim(.1);
      txt.push(T.Z.zint[i].st);
      poe(47.6, -61.5); T.sim(.2); txt.push(T.CAMP.obj[pc.obj].st);
    }
    return { seta, setaFacil, depoisSino, promptGer, gerAntes, txt, livres, pecasFim: ['I.P1', 'I.P2', 'I.P3'].map(st), ger: st('I.2') };
  });
  assert.deepEqual(r.depoisSino, { pecas: ['ativo', 'ativo', 'ativo'], ger: 'oculto' }, 'depois do sino: as 3 peças, gerador ainda não');
  assert.equal(r.promptGer, null, 'sem F no gerador antes das peças'); assert.equal(r.gerAntes, 'pronto');
  for (const [sala, livre, sorteada] of r.livres) { assert.ok(['A', 'B', 'C', 'D', 'E'].includes(sala), 'peça na zona barata: ' + sala); assert.equal(livre, true, 'peça em chão livre'); assert.equal(sorteada, true, 'lugar sorteado'); }
  assert.equal(r.seta, '', 'Normal: sem seta nem distância'); assert.ok(r.setaFacil.length > 0, 'Fácil: com seta'); 
  assert.deepEqual(r.txt, ['Pegar a vela', 'levada', 'feito', 'Pegar a correia', 'levada', 'feito', 'Pegar o carburador', 'levada', 'feito']);
  assert.deepEqual(r.pecasFim, ['feito', 'feito', 'feito']); assert.equal(r.ger, 'ativo', 'com as 3 peças o gerador pode ser ligado');
});
