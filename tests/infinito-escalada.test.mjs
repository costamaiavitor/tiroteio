// Decisões do dono (13/10): escalada do modo infinito (ZBAL.infinito, zumbi_config.js) e o clássico sem mudança.
// Rodada mista (zumbis + cães + Carniceiro), mais zumbis por rodada, mais de um Carniceiro, chefe de campo a cada 5 rodadas depois da 40.
// Rodar: node --test tests/infinito-escalada.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 }); }, { timeout: 240000 });
after(async () => { await J?.fechar(); });

// ajudante dentro da página: começa a rodada r (a anterior acaba na hora) e devolve o que o zStartRound montou
const AJUDA = `(T => {
  const p = T.S.players.get('h'); p.dwEnd = 1e12;
  const limpa = () => { for (const z of [...T.Z.zs.values()]) T.zKill(z, null, 'body', 'nuke', false, true); T.Z.toSpawn = 0; T.Z.reQ = []; T.Z.mistaCaes = 0; T.Z.bossQ = 0; };
  const rodada = (r, o = {}) => {
    limpa(); T.Z.round = r - 1; T.Z.phase = 'break'; T.Z.phaseEnd = 0; T.Z.nextDog = o.cao ? r : 1e9; T.Z.nextBoss = o.carn ? r : 1e9;
    T.sim(.05);
    return { r: T.Z.round, n: T.Z.toSpawn, caes: T.Z.mistaCaes, carn: T.Z.bossQ, dog: T.Z.dogRound };
  };
  return { p, limpa, rodada };
})`;
const rodar = fn => J.page.evaluate(([src, aj]) => { const T = window.__T, H = (new Function('return ' + aj)())(T); return (new Function('T', 'H', `return (${src})(T, H)`))(T, H); }, [fn.toString(), AJUDA]);
const esperaMapa = m => J.page.waitForFunction(m => window.__T.S.st.map === m && window.__T.ZC.world && !document.getElementById('warmMsg'), m, { timeout: 600000, polling: 300 });

test('clássico: nenhuma escalada (sem rodada mista, um Carniceiro só, contagem do clássico)', { timeout: 120000 }, async () => {
  const r = await rodar((T, H) => {
    const a = H.rodada(25), b = H.rodada(40, { carn: 1 });
    return { a, b, conta40: Math.max(1, Math.round(T.zCount(40, 1) * T.zDf().cnt)) + 1, modo: T.CAMP.modo };
  });
  assert.equal(r.modo, null);
  assert.equal(r.a.caes, 0); assert.equal(r.b.carn, 1); assert.equal(r.b.n, r.conta40, 'contagem do clássico');
  assert.deepEqual(J.erros, []);
});

test('infinito: mais zumbis, rodada mista com cães e Carniceiro, mais Carniceiros e chefes a cada 5 depois da 40', { timeout: 600000 }, async () => {
  await rodar(T => { T.S.st = { ...T.S.st, zmode: 'infinito', map: 'sanatorio', zmap: 'sanatorio' }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1); });
  await esperaMapa('sanatorio');
  const r = await rodar((T, H) => {
    const I = T.ZBAL.infinito, o = { modo: T.CAMP.modo };
    // mais zumbis: rodada 45 (teto de +60%) contra a conta do clássico (sem rodada mista, sem Carniceiro)
    const r45 = H.rodada(44); o.n44 = [r45.n, Math.max(1, Math.round(T.zCount(44, 1) * T.zDf().cnt))];
    // rodada mista (25): cães misturados, Carniceiro garantido, nenhum evento; os cães nascem de verdade e a rodada termina
    const m = H.rodada(25); o.mista = m; o.ev = T.CAMP_EVS.id;
    let caes = 0, carn = 0, vistos = new Set();
    for (let k = 0; k < 400 && (T.Z.toSpawn > 0 || T.Z.zs.size); k++) {
      for (const z of T.Z.zs.values()) if (!vistos.has(z.id)) { vistos.add(z.id); if (z.dog) caes++; if (z.kind === 6) carn++; }
      for (const z of [...T.Z.zs.values()]) T.zKill(z, null, 'body', 'nuke', false, true);
      T.Z.spawnT = 0; T.sim(.3);
    }
    o.nasceram = { caes, carn, fim: T.Z.phase, falta: T.Z.toSpawn, mc: T.Z.mistaCaes };
    // Carniceiros: 2 na 40, 3 na 55 (rodadas de Carniceiro que não são mistas nem de chefe)
    o.carn = [H.rodada(39, { carn: 1 }).carn, H.rodada(41, { carn: 1 }).carn, H.rodada(56, { carn: 1 }).carn];
    // chefes de campo: 20, 30, 40, depois a cada 5
    o.chefes = [20, 30, 35, 40, 45, 50, 55].map(r => !!T.campInfChefeDe(r));
    // rodada de cães continua só de cães
    o.caoR = H.rodada(33, { cao: 1 }); H.limpa();
    return o;
  });
  assert.equal(r.modo, 'infinito');
  assert.ok(r.n44[0] >= Math.round(r.n44[1] * 1.55) && r.n44[0] <= Math.round(r.n44[1] * 1.65) + 1, 'rodada 44: +58% ' + r.n44);
  assert.ok(r.mista.caes >= 1 && r.mista.carn >= 1 && !r.mista.dog, 'rodada mista ' + JSON.stringify(r.mista)); assert.equal(r.ev, null, 'sem evento na mista');
  assert.equal(r.nasceram.caes, r.mista.caes, 'todos os cães nasceram ' + JSON.stringify(r.nasceram)); assert.equal(r.nasceram.carn, r.mista.carn); assert.equal(r.nasceram.mc, 0);
  assert.notEqual(r.nasceram.fim, 'round', 'a rodada mista termina');
  assert.deepEqual(r.carn, [1, 2, 3]);
  assert.deepEqual(r.chefes, [true, true, false, true, true, true, true]);
  assert.equal(r.caoR.dog, true); assert.equal(r.caoR.caes, 0);
  assert.deepEqual(J.erros, []);
});
