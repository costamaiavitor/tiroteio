// Interativos novos da Frente C (Onda 2, O2-C04): base comum (ZINT / ZINT_MAPA / ZINT_FN) e o barril explosivo.
// Regras do host conferidas: F acende o pavio e o barril explode depois dele; tiro (mensagem 'shot' do cliente) detona na hora;
// a explosão mata o zumbi no raio e não age longe; machuca o jogador perto (não o de longe); a corrente acende o barril vizinho;
// o barril volta depois de ZINT.barril.voltaRodadas rodadas; quem entra no meio recebe o estado (zWorldState().zi).
// Rodar: pnpm test (todos) ou node --test tests/interativos-zumbi.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); }, { timeout: 120000 });
after(async () => { await J?.fechar(); });

// prepara a cena dentro da página: rodada sem nascer zumbi novo, jogador num ponto e barris sozinhos (sem vizinho a 12 m)
const PREP = `(T => {
  const p = T.S.players.get('h'), L = T.ZD.zint;
  const sozinhos = L.map((o, i) => i).filter(i => L.every((q, j) => j === i || Math.hypot(q.x - L[i].x, q.z - L[i].z) > 12));
  const par = (() => { for (let i = 0; i < L.length; i++) for (let j = 0; j < L.length; j++) if (i !== j && Math.hypot(L[i].x - L[j].x, L[i].z - L[j].z) < 4.6) return [i, j]; return null; })();
  const poe = (x, z) => { p.pos = [x, 0, z]; T.me.pos.set(x, 0, z); };
  const segura = () => { T.Z.toSpawn = 50; T.Z.spawnT = 1e12; };
  const zumbi = (x, z) => { const id = T.Z.nextId; T.zSpawnOne(); const zz = T.Z.zs.get(id); if (!zz) throw new Error('zSpawnOne não criou zumbi');
    zz.st = 'in'; zz.body.pos.set(x, 0, z); zz.speed = 0; zz.sc = 0; return zz; };
  return { p, L, sozinhos, par, poe, segura, zumbi };
})`;

test('barril: sala no Sanatório monta os barris (colisor no COL, estado pronto no host e no cliente)', { timeout: 180000 }, async () => {
  await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 });
  const r = await noJogo(J.page, T => {
    if (T.Z.phase !== 'round') T.zStartRound(); T.sim(.2);
    const L = T.ZD.zint, E = T.ZC.world.zint, COL = T.COL();
    return { n: L.length, tipos: [...new Set(L.map(o => o.t))], srv: T.Z.zint.every(e => e.st === 'pronto'), cli: T.ZC.zint.every(c => c.st === 'pronto'),
      col: E.every(e => COL.includes(e.col) && e.col.maxY === e.h), zi: T.zWorldState().zi.length };
  });
  assert.ok(r.n >= 8, `só ${r.n} barris`); assert.deepEqual(r.tipos, ['barril']);
  assert.ok(r.srv && r.cli, 'estado inicial não é pronto'); assert.ok(r.col, 'colisor fora do COL'); assert.equal(r.zi, r.n);
});

test('barril: F longe não faz nada; perto acende o pavio; depois dele explode, mata o zumbi no raio, não o de longe, e dá pontos', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, L, sozinhos, poe, segura, zumbi } = (new Function('return ' + PREP)())(T), D = T.ZINT.barril, i = sozinhos[0], o = L[i];
    segura(); p.perks = ['phd']; p.dwEnd = 1e12; // PhD: a explosão não machuca quem acendeu (o dano no jogador tem teste próprio)
    const sp = T.ZD.spawns.map(s => [s[0], s[1], Math.hypot(s[0] - o.x, s[1] - o.z)]).sort((a, b) => b[2] - a[2])[0];
    poe(sp[0], sp[1]); T.srvZUse(p, { k: 'zint', id: i }); const longe = T.Z.zint[i].st;
    poe(o.x + o.n[0] * 1.6, o.z + o.n[1] * 1.6); T.srvZUse(p, { k: 'zint', id: i }); const pavio = T.Z.zint[i].st, cliPavio = T.ZC.zint[i].st;
    const zn = zumbi(o.x + o.n[0] * 2.2, o.z + o.n[1] * 2.2), zl = zumbi(sp[0], sp[1]), m0 = p.money;
    T.sim(D.pavio * .5); const antes = T.Z.zint[i].st;
    T.sim(D.pavio * .5 + .3);
    return { longe, pavio, cliPavio, antes, depois: T.Z.zint[i].st, cli: T.ZC.zint[i].st, colY: T.ZC.world.zint[i].col.maxY, resto: D.restoH,
      perto: T.Z.zs.has(zn.id), longeVivo: T.Z.zs.has(zl.id), dLonge: Math.hypot(sp[0] - o.x, sp[1] - o.z), raio: D.raio, ganho: p.money - m0 };
  }, PREP);
  assert.equal(r.longe, 'pronto', 'F de longe acendeu'); assert.equal(r.pavio, 'pavio'); assert.equal(r.cliPavio, 'pavio', 'cliente não soube do pavio');
  assert.equal(r.antes, 'pavio', 'explodiu antes do fim do pavio'); assert.equal(r.depois, 'boom'); assert.equal(r.cli, 'boom');
  assert.equal(r.colY, r.resto, 'o colisor não baixou para os restos');
  assert.equal(r.perto, false, 'zumbi no raio sobreviveu'); assert.ok(r.dLonge > r.raio + 1); assert.equal(r.longeVivo, true, 'zumbi longe morreu');
  assert.ok(r.ganho > 0, 'abate da explosão não deu pontos a quem acendeu');
});

test('barril: tiro (shot do cliente com a bala parada no barril) detona na hora; bala longe dele não', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, L, sozinhos, poe, segura } = (new Function('return ' + PREP)())(T), i = sozinhos[1], o = L[i], V = T.ZINT_BARRIL[o.v] || T.ZINT_BARRIL.tambor;
    segura(); p.perks = ['phd']; T.sim(.4); // folga da cadência entre tiros
    poe(o.x + o.n[0] * 3, o.z + o.n[1] * 3); const olho = [p.pos[0], 1.62, p.pos[2]];
    T.sendToHost({ t: 'shot', w: 'm1911', o: olho, e: [[o.x + o.n[0] * 6, .5, o.z + o.n[1] * 6]] }); const errou = T.Z.zint[i].st;
    T.sim(.4);
    T.sendToHost({ t: 'shot', w: 'm1911', o: olho, e: [[o.x + o.n[0] * (V.r + .02), V.h * .5, o.z + o.n[1] * (V.r + .02)]] });
    return { errou, acertou: T.Z.zint[i].st };
  }, PREP);
  assert.equal(r.errou, 'pronto', 'bala longe do barril detonou'); assert.equal(r.acertou, 'boom', 'tiro no barril não detonou');
});

test('barril: explosão machuca o jogador perto (sem PhD) e não o de longe', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, L, sozinhos, poe, segura } = (new Function('return ' + PREP)())(T), D = T.ZINT.barril, a = L[sozinhos[2]], b = L[sozinhos[3]];
    segura(); p.perks = []; p.dwEnd = 0; p.maxHp = 100;
    p.hp = 100; poe(a.x + a.n[0] * 2, a.z + a.n[1] * 2); T.zintBarrilBoom(sozinhos[2], null); const perto = 100 - p.hp;
    p.hp = 100; poe(a.x + a.n[0] * 2, a.z + a.n[1] * 2); T.zintBarrilBoom(sozinhos[3], null); const longe = 100 - p.hp; // b fica longe de a
    return { perto, longe, esperado: Math.round(D.jogDano * (1 - 2 / D.jogR)), dist: Math.hypot(a.x - b.x, a.z - b.z) };
  }, PREP);
  assert.equal(r.perto, r.esperado, `dano perto ${r.perto}, esperado ${r.esperado}`); assert.ok(r.dist > 12); assert.equal(r.longe, 0, 'explosão longe machucou');
});

test('barril: corrente — explosão acende o pavio curto do vizinho, que explode; barril longe não muda', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, L, sozinhos, par, poe, segura } = (new Function('return ' + PREP)())(T), D = T.ZINT.barril; if (!par) return { semPar: true };
    segura(); p.perks = ['phd']; const sp = T.ZD.spawns[0]; poe(sp[0], sp[1]);
    const [a, b] = par, c = sozinhos.find(k => T.Z.zint[k].st === 'pronto');
    T.zintBarrilBoom(a, 'h'); const viz = T.Z.zint[b].st;
    T.sim(D.cadeia + .2);
    return { viz, depois: T.Z.zint[b].st, longe: T.Z.zint[c].st };
  }, PREP);
  assert.ok(!r.semPar, 'o mapa não tem barris em par');
  assert.equal(r.viz, 'pavio'); assert.equal(r.depois, 'boom'); assert.equal(r.longe, 'pronto');
});

test('barril: quem entra no meio recebe o estado; o barril volta depois de voltaRodadas rodadas', { timeout: 120000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, sozinhos, poe } = (new Function('return ' + PREP)())(T), D = T.ZINT.barril, i = sozinhos[0], E = T.ZC.world.zint[i];
    const sp = T.ZD.spawns[0]; poe(sp[0], sp[1]); p.perks = ['phd']; p.dwEnd = 1e12;
    T.ZC.zint[i].st = 'pronto'; E.col.maxY = E.h; T.zintSync(T.zWorldState().zi); // cliente "novo": só o estado do host
    const sync = { st: T.ZC.zint[i].st, colY: E.col.maxY, corpo: E.corpo.visible, restos: E.restos.visible };
    const rodadas = [];
    for (let k = 0; k < D.voltaRodadas; k++) { T.Z.toSpawn = 0; T.Z.zs.clear(); T.sim(12); T.Z.toSpawn = 50; T.Z.spawnT = 1e12; T.sim(.2); rodadas.push(T.Z.zint[i].st); }
    return { sync, rodadas, cli: T.ZC.zint[i].st, colY: E.col.maxY, h: E.h, corpo: E.corpo.visible, resto: D.restoH };
  }, PREP);
  assert.deepEqual(r.sync, { st: 'boom', colY: r.resto, corpo: false, restos: true });
  assert.equal(r.rodadas.at(-1), 'pronto', `não voltou: ${r.rodadas}`); assert.ok(r.rodadas.slice(0, -1).every(s => s === 'boom'), `voltou cedo: ${r.rodadas}`);
  assert.equal(r.cli, 'pronto'); assert.equal(r.colY, r.h); assert.equal(r.corpo, true);
  assert.deepEqual(J.erros, []);
});
