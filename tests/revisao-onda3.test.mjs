// Revisão final da Onda 3 (O3-D16): uma prova para cada correção pequena do revisor.
// - a chave da Enfermeira-chefe continua no pescoço quando a mensagem 'elite' chega antes do 1º quadro da animação do zumbi;
// - o aviso de ataque sem forma (maré, apito) que volta na foto do mundo (cp, ~1 vez por segundo para todos) não entra de novo;
// - a nuvem de cal (Penitente) e a brasa (Carvoeiro) da foto do mundo não se repetem a cada foto;
// - o disco da explosão de pressão (cresce) começa pequeno e cresce até o raio inteiro no aviso;
// - o estouro do Explosivo destrói os corpos que o Pregador levantaria (como a granada);
// - a seta do objetivo de coletar a chave aponta a Enfermeira-chefe enquanto a chave não caiu.
// Rodar: node --test tests/revisao-onda3.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala } from './_jogo.mjs';

let J;
before(async () => {
  J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 });
  await J.page.evaluate(() => { // campanha no Ato III (Sanatório), sem objetivos, eventos nem agenda (só o que cada teste monta)
    const T = window.__T; for (const A of T.CAMP_ATOS) { A.rodMin = 99; if (A.mapa === 'sanatorio') { A.objs = []; A.ini = []; } }
    if (T.CAMP_AGENDA) for (let r = 1; r <= 30; r++) delete T.CAMP_AGENDA[r];
    T.S.st = { ...T.S.st, zmode: 'campanha' }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1); // objetivos do mapa: o Sanatório começa na etapa III
    T.Z.phaseEnd = window.__simNow; T.sim(.2); T.Z.spawnT = 1e12; T.Z.toSpawn = 0; T.CAMP.c.radioQ.length = 0;
  });
}, { timeout: 240000 });
after(async () => { await J?.fechar(); });

const PREP = `(T => {
  const p = T.S.players.get('h'), Z = T.Z, agora = () => window.__simNow;
  const poe = (x, z) => { p.pos = [x, 0, z]; T.me.pos.set(x, 0, z); T.me.vel.set(0, 0, 0); };
  const limpa = () => { for (const z of [...Z.zs.values()]) { Z.zs.delete(z.id); T.broadcast({ t: 'zgone', id: z.id }); } Z.reQ = []; Z.toSpawn = 0; Z.spawnT = 1e12; };
  const vivo = () => { p.alive = true; p.downed = false; p.maxHp = p.hp = 5000; p.dwEnd = 1e12; };
  const um = (k, x, z) => { Z.reQ.push([k, 0, 0]); Z.toSpawn++; const id = Z.nextId; if (!T.zSpawnOne()) return null; const zz = Z.zs.get(id); zz.st = 'in'; zz.body.pos.set(x, 0, z); zz.chkT = 1e12; zz.speed = 0; zz.atkT = 1e12; return zz; };
  return { p, Z, agora, poe, limpa, vivo, um };
})`;
const rodar = (fn, a = {}) => J.page.evaluate(([src, arg]) => {
  const T = window.__T, H = (new Function('return ' + arg.PREP)())(T);
  return (new Function('T', 'H', 'arg', `return (${src})(T, H, arg)`))(T, H, arg);
}, [fn.toString(), { PREP, ...a }]);

test('campanha ligada no Sanatório (base dos testes)', { timeout: 60000 }, async () => {
  const r = await rodar(T => ({ on: T.CAMP.on, modo: T.CAMP.modo, mapa: T.S.st.map, ph: T.Z.phase }));
  assert.deepEqual([r.on, r.modo, r.mapa], [true, 'campanha', 'sanatorio']);
});

test('Enfermeira-chefe: a chave aparece mesmo com a mensagem elite antes do 1º quadro da animação', { timeout: 60000 }, async () => {
  const r = await rodar((T, H) => {
    H.limpa(); H.vivo(); H.poe(4, -4); const z = H.um(10, 5, -1); T.sim(.2); const zc = T.ZC.zs.get(z.id), o = { zc: !!zc };
    // o zumbi como recém-chegado no cliente (ainda sem a montagem do tipo) e a mensagem elite antes do quadro
    zc.zk2 = 0; zc.zkElite = 0; T.CAMP_ZK2C.elite.clear(); T.CAMP_ZKF.msg.elite({ id: z.id }); o.antes = zc.model.userData.chave.scale.x > .5;
    T.sim(.2); o.montou = zc.zk2 === 1; o.chave = zc.model.userData.chave.scale.x > .5; o.sz = +zc.sz.toFixed(2);
    T.CAMP_ZK2C.elite.clear(); H.limpa(); return o;
  });
  assert.equal(r.zc, true); assert.equal(r.antes, true); assert.equal(r.montou, true, 'a animação do tipo rodou');
  assert.equal(r.chave, true, 'a chave continua visível'); assert.equal(r.sz, 1.15);
});

test('aviso sem forma (maré, apito) na foto do mundo não entra de novo', { timeout: 60000 }, async () => {
  const r = await rodar((T, H) => {
    const Z = T.Z, ph0 = [Z.phase, Z.phaseEnd]; Z.phase = 'break'; Z.phaseEnd = 1e12; // objetivos do mapa: sem rodada mínima, o fim de rodada (sem zumbis) trocaria a etapa vazia e o 'est' recriaria o CAMP.c no meio do teste
    const c = T.CAMP.c; c.tel = []; const tel = T.CAMP_GANCHOS.msg.tel;
    const m = { a: 'mare', f: null, p: [[1, 0, 2, 0]], d1: 3, d2: 1, g: 0, s: 2, at: 4 };
    tel(m); T.sim(1 / 60); tel({ ...m, s: 2 - 1 / 60, at: 4 }); // o cp de 1 tick depois
    const n1 = c.tel.length;
    const d = { a: 'pa', f: 'disco', p: [[1, 0, 2, 0]], d1: 3, d2: 1, g: 0, s: 1, at: 0 }; tel(d); tel({ ...d }); const n2 = c.tel.length;
    tel({ ...m, s: 3 }); const n3 = c.tel.length; // outro aviso de maré (fim diferente): entra
    c.tel = []; [Z.phase, Z.phaseEnd] = ph0; return [n1, n2, n3];
  });
  assert.deepEqual(r, [1, 2, 3], 'uma vez só cada aviso; um aviso novo com o mesmo nome entra');
});

test('foto do mundo todo segundo: a nuvem de cal e a brasa não se repetem', { timeout: 60000 }, async () => {
  const r = await rodar((T, H) => {
    const N = T.CAMP_ZKC.nuvens, B = T.CAMP_ZK2C.brasas; N.length = 0; B.length = 0;
    const cp = { et: T.CAMP.et, ob: [], zk: { c: [], n: [[1, 2, 5]] }, zk2: { e: [], b: [[3, 0, 4, 5]] } };
    for (let i = 0; i < 3; i++) { T.campSync(cp); T.sim(.5); }
    const o = [N.length, B.length];
    T.campSync({ ...cp, zk: { c: [], n: [[1, 2, 5], [6, 6, 5]] }, zk2: { e: [], b: [] } }); o.push(N.length); // nuvem nova: entra
    N.length = 0; B.length = 0; return o;
  });
  assert.deepEqual(r, [1, 1, 2]);
});

test('explosão de pressão: o disco do aviso cresce de 15% até o raio inteiro', { timeout: 60000 }, async () => {
  const r = await rodar((T, H) => {
    const c = T.CAMP.c; c.tel = []; const a = T.CAMP_CHEFE[15]?.ataques.find(x => x.id === 'pressao');
    T.CAMP_GANCHOS.msg.tel({ a: 'pressao', f: 'disco', p: [[0, 0, 0, 0]], d1: 7, d2: 1, g: 0, s: 3, at: 0, cr: a?.cresce });
    const M = T.CAMP_AV.disco, m = new (T.camera.matrix.constructor)(), esc = () => { M.getMatrixAt(0, m); return +Math.hypot(m.elements[0], m.elements[1], m.elements[2]).toFixed(2); };
    T.sim(1 / 60); const e0 = esc(); T.sim(1.5); const e1 = esc(); T.sim(1.4); const e2 = esc(); T.sim(.2); const e3 = esc();
    c.tel = []; T.sim(.1); return { cresce: a?.cresce, e: [e0, e1, e2, e3] };
  });
  assert.equal(r.cresce, .15);
  assert.ok(r.e[0] < 1.3, 'começa pequeno ' + r.e); assert.ok(r.e[1] > 3.5 && r.e[1] < 5, 'na metade ' + r.e); assert.ok(r.e[2] > 6.5, 'quase inteiro ' + r.e); assert.equal(r.e[3], 7, 'ativo: o raio inteiro');
});

test('estouro do Explosivo destrói o corpo que o Pregador levantaria; longe não', { timeout: 60000 }, async () => {
  const r = await rodar((T, H) => {
    H.limpa(); H.vivo(); H.poe(-6, -4); const S2 = T.CAMP_ZK2S, now = H.agora();
    Object.assign(S2.corpos[0], { t: now, x: 2, y: 0, z: 2, hp: 100, res: 0 }); Object.assign(S2.corpos[1], { t: now, x: 12, y: 0, z: 2, hp: 100, res: 0 });
    const z = H.um(2, 2, 3); const o = { kind: z?.kind }; T.zHit(H.p, z.id, 1e8, 'body', 'm1911', false); T.sim(1 / 60);
    o.perto = S2.corpos[0].t; o.longe = S2.corpos[1].t === now;
    for (const c of S2.corpos) { c.t = -1e9; c.res = 0; } H.limpa(); return o;
  });
  assert.equal(r.kind, 2); assert.equal(r.perto, -1e9, 'o corpo perto foi destruído'); assert.equal(r.longe, true, 'o de longe fica');
});

test('seta do objetivo de coletar a chave: aponta a Enfermeira-chefe enquanto a chave não cai', { timeout: 60000 }, async () => {
  const r = await rodar((T, H) => {
    H.limpa(); H.vivo(); H.poe(-8, -4);
    for (const id in T.CAMP.obj) T.CAMP.obj[id].st = 'oculto'; for (const id in T.CAMP.c.obj) T.CAMP.c.obj[id].st = 'oculto';
    T.CAMP_OBJ['T.seta'] = { id: 'T.seta', tipo: 'coletar', titulo: 'Seta de teste', item: 'chave-seta', origem: 'elite', destino: { x: 0, z: 0, r: 1 } };
    T.CAMP.obj['T.seta'] = { st: 'oculto', p: 0 }; T.CAMP.itens['chave-seta'] = { st: 'oculto', x: 0, z: 0, quem: null, i: -1 }; T.CAMP.obj['T.seta'].st = 'ativo';
    T.broadcast({ t: 'camp', k: 'obj', id: 'T.seta', st: 'ativo', p: 0 }); T.sim(.1);
    const mk = () => document.getElementById('campMark')?.textContent || '';
    const o = { sem: /SETA DE TESTE/.test(mk()) };
    const z = H.um(10, 4, 6); T.sim(.2); T.CAMP_ZKF.msg.elite({ id: z.id }); T.sim(.2); o.com = mk();
    T.CAMP_ZK2C.elite.clear(); H.limpa(); T.sim(.2); o.depois = /SETA DE TESTE/.test(mk());
    delete T.CAMP.obj['T.seta']; delete T.CAMP_OBJ['T.seta']; delete T.CAMP.itens['chave-seta']; if (T.CAMP.c.obj['T.seta']) T.CAMP.c.obj['T.seta'].st = 'feito'; T.sim(.1);
    return o;
  });
  assert.equal(r.sem, false, 'sem a elite e sem a chave no chão: sem seta');
  assert.match(r.com, /SETA DE TESTE \d+m/, 'com a elite viva: a seta aponta ela'); assert.equal(r.depois, false);
  assert.deepEqual(J.erros, []);
});
