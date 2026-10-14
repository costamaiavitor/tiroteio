// Objetivos do mapa em multijogador (validador V3, 13/10): host + 3 jogadores falsos pela porta do host (srvOnData, como nos testes de
// rede), nos dois mapas, a sequência inteira até as rodadas infinitas. A cada passo (objetivo feito, intervalo da troca de etapa, chefe
// vivo, fase 2, chefe morto, fim dos objetivos) confere que o que cada conexão recebeu monta no cliente (campCliReset + campMsg/campSync,
// as funções de verdade do cliente) o mesmo estado que o cliente do próprio host vê: etapa, objetivos, portador, chefe e fase, "acabou".
// Quem entra no meio (no objetivo, com a etapa feita e a rodada correndo, no intervalo da troca, no chefe, na fase 2 e depois do fim) recebe
// tudo pela foto do mundo e entra jogando (não fica de espectador). A mensagem de fim chega uma vez para cada um; um caído não acaba a
// partida, todos caídos sim (como no clássico).
// Também: cp e mensagens 'camp' malformadas de um host editado ('__proto__', 'constructor', 'toString', tipos errados) não quebram o
// cliente nem escrevem no Object.prototype; quem entra no meio monta o mapa com a folga GRACE_MAPA (não se desconecta sozinho).
// Rodar: ZV2_OBJ=1 node --test --test-concurrency=1 tests/objetivos-rede.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
process.env.ZV2_OBJ ||= '1';
const { abrirJogo } = await import('./_jogo.mjs');
async function criarSala(page, { map, zdiff = 1 }) { // como o do _jogo.mjs, com o clique pelo DOM e espera longa (máquina carregada: montar o mapa trava a página > 30 s)
  await page.evaluate(([map, zdiff]) => { const q = s => document.querySelector(s); q('#hostForm [data-mode="zombies"]').click(); q(`#hostForm [data-map="${map}"]`).click(); q(`#hostForm [data-k="zdiff"][data-v="${zdiff}"]`).click(); q('#btnHost').click(); }, [map, zdiff]);
  await page.waitForSelector('#lbGo', { timeout: 120000 });
  await page.evaluate(() => setTimeout(() => document.querySelector('#lbGo').click(), 0));
  await page.waitForFunction(() => { const T = window.__T; return T.S.players.get('h')?.alive && T.Z.on; }, null, { timeout: 300000, polling: 1000 });
  await page.evaluate(() => { window.__T.sim(0.1); });
}

let J;
before(async () => { J = await abrirJogo(); }, { timeout: 180000 });
after(async () => { await J?.fechar(); });
const rodar = (fn, a = {}) => J.page.evaluate(([src, arg]) => (new Function('T', 'arg', `return (${src})(T, arg)`))(window.__T, arg), [fn.toString(), a]);

const AJ = `(T => {
  const p = T.S.players.get('h'), prob = [], log = [];
  const conn = nome => { const c = { open: true, out: [], send(m) { this.out.push(JSON.parse(JSON.stringify(m))); }, close() { this.open = false; }, peerConnection: null }; T.srvOnData(c, { t: 'join', v: 2, pv: 7, name: nome }); c.q = T.S.players.get(c.pid); c.grace = 1e15; return c; }; // grace: o falso não manda ping
  const segura = () => { T.Z.spawnT = 1e12; for (const q of T.S.players.values()) q.dwEnd = 1e12; };
  const rodada = () => { if (T.Z.phase !== 'round') { T.Z.phaseEnd = window.__simNow; T.sim(.1); } };
  const acaba = () => { for (const z of [...T.Z.zs.values()]) T.zKill(z, p, 'head', 'm1911', false, false); T.Z.toSpawn = 0; T.Z.reQ = []; T.sim(.3); };
  const foto = C => ({ et: C.et, fo: !!C.fo, ch: C.ch ? [C.ch.k, C.ch.z, C.ch.f, C.ch.campo] : null, obj: Object.fromEntries(Object.entries(C.obj).map(([k, o]) => [k, [o.st, o.q]])) });
  const veComo = (c, soFoto) => { // o cliente desta conexão: só com o que ela recebeu
    const salvo = T.CAMP.c, on0 = T.CAMP.on; let r;
    try { T.campCliReset();
      if (soFoto) { const st = c.out.filter(m => m.t === 'state' && m.z?.cp).pop(); if (st) T.campSync(st.z.cp); }
      else for (const m of c.out) { if (m.t === 'camp' && ['est', 'obj', 'chefe'].includes(m.k)) T.campMsg(m); else if (m.t === 'state' && m.z?.cp) T.campSync(m.z.cp); }
      r = foto(T.CAMP.c); } catch (e) { r = { erro: String(e.stack || e).slice(0, 300) }; }
    T.CAMP.c = salvo; T.CAMP.on = on0; return r;
  };
  const confere = (onde, c, soFoto) => { if (!T.NET.conns.has(c.pid)) prob.push(onde + ': conexão caiu'); T.S.stateT = 0; T.sim(1 / 30);
    const a = JSON.stringify(foto(T.CAMP.c)), b = JSON.stringify(veComo(c, soFoto)); if (a !== b) prob.push(onde + (soFoto ? ' (foto)' : '') + ': host=' + a + ' cli=' + b); };
  return { p, prob, log, conn, segura, rodada, acaba, veComo, confere };
})`;

const PARTIDA = (T, A) => {
  const H = (new Function('return ' + A.AJ)())(T), { p, prob, log, conn, segura, rodada, acaba, confere, veComo } = H;
  segura(); const cs = [conn('C1'), conn('C2'), conn('C3')]; T.sim(.3); segura();
  const todos = onde => { for (const c of cs) confere(onde + ' ' + c.q.name, c); };
  const entra = onde => { const c = conn('Meio'); T.sim(.3); segura(); const q = c.q;
    if (!q?.alive || q.downed) prob.push(onde + ': quem entrou não está jogando ' + JSON.stringify([q?.alive, q?.downed, T.Z.phase]));
    confere('entrou ' + onde, c, true); log.push(onde); T.srvDrop(c); T.sim(.1); };
  todos('começo'); entra('no 1º objetivo');
  let guarda = 0;
  while (guarda++ < 60 && T.CAMP.modo === 'campanha') {
    const A_ = T.CAMP_ATOS[T.CAMP.et], atv = Object.keys(T.CAMP.obj).filter(id => T.CAMP.obj[id].st === 'ativo');
    if (atv.length) {
      if (A_.chefe) {
        for (let k = 0; k < 60 && !T.CAMP_CH.z; k++) { T.sim(.25); segura(); }
        const z = T.CAMP_CH.z; if (!z) { prob.push(A_.id + ': o chefe não nasceu'); break; }
        todos(A_.id + ' chefe'); entra('no chefe ' + A_.id);
        const F = T.CAMP_CH.def.fases; if (F?.[1]) { z.hp = F[1].de * z.maxHp + 1; T.zHit(p, z.id, 50, 'body', 'm1911', false); T.sim(T.CAMP_CHEFE_BASE.invS + .3); segura(); }
        todos(A_.id + ' fase ' + T.CAMP_CH.fase); entra('na fase 2 do ' + A_.id);
        T.zKill(T.CAMP_CH.z, p, 'head', 'm1911', false, false); T.sim(.5); segura(); todos(A_.id + ' chefe morto');
      } else {
        for (const id of atv) T.campForca(id); T.sim(.2); segura(); todos(A_.id + ' ' + atv);
        const ag = Object.keys(T.CAMP.obj).filter(id => T.CAMP.obj[id].st === 'ativo'); if (ag.length) entra('no ' + ag);
      }
      continue;
    }
    entra('etapa ' + A_.id + ' feita, rodada correndo');
    acaba(); segura(); todos('intervalo depois de ' + A_.id); entra('no intervalo depois de ' + A_.id);
    if (T.CAMP.modo !== 'campanha') break;
    rodada(); segura(); todos('rodada ' + T.Z.round);
  }
  T.sim(.3); segura();
  const fimMsg = cs.map(c => c.out.filter(m => m.t === 'msg' && /OBJETIVOS CONCLU/.test(m.txt)).length);
  todos('fim'); entra('depois do fim');
  const tarde = conn('Tarde'); T.sim(.3); const vt = veComo(tarde, true); T.srvDrop(tarde);
  for (let r = 0; r < 2; r++) { rodada(); segura(); acaba(); } rodada(); segura();
  const rodadas = cs.map(c => c.out.filter(m => m.t === 'state' && m.z).pop()?.z?.r === T.Z.round);
  cs[0].q.dwEnd = 0; cs[0].q.perks = []; T.zHurt(cs[0].q, 1e6, null); T.sim(.2); const um = T.S.phase;
  for (const q of T.S.players.values()) { q.dwEnd = 0; q.perks = []; q.selfRev = 0; if (!q.downed) T.zHurt(q, 1e6, null); } T.sim(.3);
  return { prob, log, fimMsg, vt, rodadas, modo: T.CAMP.modo, um, todos: T.S.phase, zover: cs.map(c => c.out.some(m => m.t === 'zover')) };
};

for (const MAPA of ['vila', 'sanatorio']) {
  test(`${MAPA}: host + 3 pela rede, a sequência inteira; quem entra em cada momento; fim; um caído × todos caídos`, { timeout: 900000 }, async () => {
    if (MAPA === 'sanatorio') { await J.fechar(); J = await abrirJogo(); }
    await criarSala(J.page, { map: MAPA, zdiff: 1 });
    const r = await rodar(PARTIDA, { AJ });
    console.log(MAPA, r.log.join(' | '));
    assert.deepEqual(r.prob, []);
    assert.ok(r.log.length >= 8, 'entradas no meio: ' + r.log.length);
    assert.deepEqual(r.fimMsg, [1, 1, 1], 'OBJETIVOS CONCLUÍDOS uma vez para cada um');
    assert.equal(r.vt.et, -1); assert.equal(r.vt.fo, true, 'quem entra depois do fim sabe que os objetivos acabaram');
    assert.equal(r.modo, 'infinito'); assert.deepEqual(r.rodadas, [true, true, true], 'rodadas infinitas iguais para todos');
    assert.notEqual(r.um, 'over', 'um caído não acaba a partida'); assert.equal(r.todos, 'over', 'todos caídos: fim de jogo'); assert.deepEqual(r.zover, [true, true, true]);
    assert.deepEqual(J.erros, []);
  });
}

test('cliente: cp e mensagens malformadas de um host editado não quebram nem poluem o Object.prototype', { timeout: 120000 }, async () => {
  const r = await rodar(T => {
    const erros = [], salvo = T.CAMP.c, on0 = T.CAMP.on; const tenta = (k, f) => { try { f(); } catch (e) { erros.push(k + ': ' + String(e).slice(0, 200)); } };
    const cps = [{ fo: '1', eu: 'x' }, { fo: 1, et: 0 }, { fo: 1, et: -1, eu: 999 }, { et: '0' }, { et: 1e9 }, { ob: 'x' }, null, 5, [],
      { ob: [null, 5, ['I.1'], ['__proto__', 'ativo', 1, 1, 'x'], ['constructor', 'feito'], ['toString', 'ativo'], ['naoexiste', 'ativo'], ['I.1', 'feito', 'NaN', {}, { x: 1 }]] },
      { it: [[null], ['chave-lab', 1e9, 'chao', 'x', 'y']] }, { ch: ['x', 1, 2] }, { ch: [14, 'z', 1, 0, 0, 0, 1, '__proto__'] }, { ev: ['naoexiste', 1, 1, 1] }, { ev: [{}, {}] }, { cx: [[1, 2, 3]] }, { tel: [null, 1, { a: 'x', s: 1e9 }] }];
    for (const cp of cps) tenta('cp ' + JSON.stringify(cp), () => { T.campCliReset(); T.campSync(cp); });
    const ms = [{ k: 'obj', id: '__proto__', st: 'ativo', q: 'x' }, { k: 'obj', id: 'constructor', st: 'feito' }, { k: 'obj', id: 'naoexiste', st: 'ativo' }, { k: 'obj', id: {}, st: 'ativo' },
      { k: 'toString' }, { k: '__proto__' }, { k: 'constructor' }, { k: '__defineGetter__' }, { k: 'hasOwnProperty' }, { k: 'npc', id: 'cabo', p: [1, 2, 3, 4, 'x'] }, { k: 'item', i: 1e9 }, { k: 'chefe', id: 14, f: 1, z: 'x' }];
    for (const m of ms) tenta('msg ' + JSON.stringify(m), () => { T.campCliReset(); T.campMsg(m); });
    const poluiu = ['st', 'p', 'h', 'q'].filter(k => Object.hasOwn(Object.prototype, k) || Object.hasOwn(Object, k));
    const fora = Object.keys(T.CAMP.c.obj);
    T.CAMP.c = salvo; T.CAMP.on = on0; T.sim(.5); // o host continua (o for...in de CAMP.obj quebrava com o protótipo poluído)
    return { erros, poluiu, fora, vivo: T.Z.on };
  });
  assert.deepEqual(r.erros, []); assert.deepEqual(r.poluiu, [], 'Object.prototype intacto'); assert.deepEqual(r.fora, [], 'id fora da tabela não entra'); assert.ok(r.vivo);
  assert.deepEqual(J.erros, []);
});

test('quem entra no meio monta o mapa com a folga GRACE_MAPA (não se desconecta sozinho num PC lento)', { timeout: 300000 }, async () => {
  const r = await rodar(T => { // a página vira cliente (último teste: a sala do host deixa de valer)
    const st = { ...T.S.st }, t0 = performance.now(); T.NET.isHost = false; T.onMsg({ t: 'welcome', you: 'p9', st, code: 'ABCDE', hk: 'x', lobby: 0 });
    return Math.round(T.NET.lastHost - t0); // sem a folga: o lastHost era o da chegada do welcome (antes de montar)
  });
  assert.ok(r >= 44000, 'folga para montar o mapa: ' + r + ' ms');
});
