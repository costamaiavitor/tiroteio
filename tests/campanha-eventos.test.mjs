// Eventos especiais nos objetivos do mapa (O3-D05, refeito em 13/10 para o modo de objetivos; docs/overhaul/campanha.md §5): cada evento
// liga, aplica a regra no host, mostra o visual no cliente, desliga e desfaz; a agenda do mapa por rodada (eventos, cães e Carniceiro,
// com a repetição depois da tabela); cães e Carniceiro de uma etapa de chefe esperam a etapa acabar; a troca para as rodadas infinitas
// depois do último objetivo (só o sorteio do infinito, cães e Carniceiro do clássico); quem entra no meio recebe o evento ativo; o
// infinito antigo (zmode 'infinito'); e o clássico sem nenhum efeito (sem CAMP.on nada liga, o caixote é stub, 'ev' é ignorado).
// Rodar: node --test tests/campanha-eventos.test.mjs (liga sozinho o modo de objetivos, ZV2_OBJ)
process.env.ZV2_OBJ ||= '1';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 }); }, { timeout: 240000 });
after(async () => { await J?.fechar(); });

// apoio: funções de teste (a partida começa nos objetivos do Sanatório, rodada 1)
const PREP = `(T => {
  const p = T.S.players.get('h');
  const poe = (q, x, z) => { q.pos = [x, 0, z]; if (q === p) T.me.pos.set(x, 0, z); };
  const limpa = () => { for (const z of [...T.Z.zs.values()]) T.Z.zs.delete(z.id); T.Z.spawnT = 1e12; };
  // O3-D08: sem as cotas dos tipos novos (a rodada 11 é a estreia do Enfermeiro): o zumbi de teste é sempre o tipo pedido
  const zumbi = (x, z, k) => { if (T.CAMP_ZKS) { T.CAMP_ZKS.r = T.Z.round; T.CAMP_ZKS.rest = {}; T.CAMP_ZKS.trio = 0; } if (T.CAMP_ZK2S) T.CAMP_ZK2S.garR = T.Z.round; const id = T.Z.nextId, mx = T.Z.mix.slice(), mn = T.Z.mixN; T.Z.mixN = 0; T.Z.toSpawn++; T.zSpawnOne(); T.Z.mix = mx; T.Z.mixN = mn; const zz = T.Z.zs.get(id); if (!zz) return null; zz.st = 'in'; zz.body.pos.set(x, 0, z); zz.speed = 0; zz.sc = 0; zz.chkT = 1e12; if (k !== undefined) zz.kind = k; return zz; };
  const rodada = () => { limpa(); T.Z.toSpawn = 40; T.Z.mix = T.ZKIND.map(() => 0); T.Z.mix[1] = 2; T.Z.mix[2] = 3; T.Z.mix[3] = 4; T.Z.mixN = 9; T.Z.spawnDelay = 1; T.Z.reQ = []; };
  const ev = () => T.CAMP_EVS.id;
  const abre = () => { T.Z.doors = new Set(T.ZD.doors.map(d => d.id)); T.zBuildWalk(); T.Z.ffT = 0; };
  const pts = n => Math.round(n * T.ZDIFF[T.S.st.zdiff].gain);
  return { p, poe, limpa, zumbi, rodada, ev, abre, pts };
})`;
const prep = `const { p, poe, limpa, zumbi, rodada, ev, abre, pts } = (new Function('return ' + arg.PREP)())(T);`;
const rodar = (fn, a = {}) => J.page.evaluate(([corpo, arg]) => (new Function('T', 'arg', corpo))(window.__T, arg), [`${prep} return (${fn.toString()})(T, arg, p, poe, limpa, zumbi, rodada, ev, abre, pts);`, { PREP, ...a }]);

test('clássico: nenhum evento liga, o caixote é stub e uma mensagem "ev" não muda nada', { timeout: 180000 }, async () => {
  const r = await noJogo(J.page, T => {
    T.S.st = { ...T.S.st, zmode: 'classico' }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    if (T.Z.phase !== 'round') T.zStartRound(); T.sim(.2); T.Z.spawnT = 1e12; // sem nascer durante o teste (o toSpawn fica parado)
    const v0 = T.campEvVis(), toS = T.Z.toSpawn, liga = T.campEvLiga('apagao');
    T.campMsg({ k: 'ev', id: 'nevoa', r: T.Z.round }); T.campMsg({ k: 'cx', a: [[1, 0, 0, 0, 30]] }); T.sim(.3);
    const v1 = T.campEvVis(), i = T.ZD.zint.findIndex(o => o.t === 'suprimento');
    return { on: T.CAMP.on, liga, ev: T.CAMP_EVS.id, cli: T.CAMP_EVC.id, cx: T.CAMP_EVC.cx.length, toS, toS1: T.Z.toSpawn, cp: 'cp' in T.zWorldState(), v0, v1, i, off: !!T.ZC.world.zint[i]?.off,
      prompt: T.ZINT_FN.suprimento.prompt(T.ZD.zint[i], i, T.ZC.zint[i], T.ZINT.suprimento), tipo: T.campTipo(0), nd: T.Z.nextDog < 100 };
  });
  assert.equal(r.on, false); assert.equal(r.liga, false, 'campEvLiga sem campanha'); assert.equal(r.ev, null); assert.equal(r.cli, null, 'cliente ignora o ev no clássico');
  assert.equal(r.toS1, r.toS); assert.equal(r.cp, false); assert.ok(r.i >= 0 && r.off, 'interativo do caixote é stub no clássico'); assert.equal(r.prompt, null);
  assert.ok(Math.abs(r.v1.far / r.v0.far - 1) < .1, 'névoa como antes (o atmos respira)'); assert.notEqual(r.v1.cor, 0x0c140f); assert.equal(r.v1.anim, false, 'nada no MAP_ANIM'); assert.equal(r.tipo, 0); assert.ok(r.nd, 'cães do clássico');
});

test('objetivos do Sanatório: começam na rodada 1 com a etapa III, sem evento; Apagão (quantidade, pontos ×1,25, luzes, névoa) liga e desliga desfazendo tudo', { timeout: 180000 }, async () => {
  const r = await rodar((T, arg, p, poe, limpa, zumbi, rodada, ev) => {
    T.S.st = { ...T.S.st, zmode: 'campanha' }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    T.sim(T.Z.phaseEnd - window.__simNow + .2); // pré-rodada -> rodada 1
    p.dwEnd = 1e12; poe(p, 0, -1);
    const r0 = T.Z.round, ph = T.Z.phase, et = T.CAMP_ATOS[T.CAMP.et]?.id, modo = T.CAMP.modo, ev1 = ev(), nd = T.Z.nextDog, nb = T.Z.nextBoss;
    rodada(); T.sim(.3); const v0 = T.campEvVis();
    T.Z.dbl = 0; const z0 = zumbi(2, -3); const m0 = p.money; T.zHit(p, z0.id, 1e7, 'head', 'm1911', false); const d0 = p.money - m0;
    rodada(); const liga = T.campEvLiga('apagao'); const toS = T.Z.toSpawn, mixN = T.Z.mixN;
    const z1 = zumbi(2, -3); const m1 = p.money; T.zHit(p, z1.id, 1e7, 'head', 'm1911', false); const d1 = p.money - m1;
    limpa(); T.sim(.4); const v1 = T.campEvVis();
    T.campEvDesliga(); T.sim(.4); const v2 = T.campEvVis();
    T.Z.round = 10; // daqui em diante a curva do mapa é 1 (CAMP_CURVA.sanatorio chega em 1 na rodada 8): vida e quantidade como no clássico
    return { r0, ph, et, modo, ev1, nd, nb, liga, toS, mixN, d0, d1, v0, v1, v2, cli: T.CAMP_EVC.id, g: pts(100) };
  });
  assert.equal(r.r0, 1); assert.equal(r.ph, 'round'); assert.equal(r.et, 'III'); assert.equal(r.modo, 'campanha'); assert.equal(r.ev1, null, 'rodada 1 sem evento');
  assert.ok(r.nd > 1e8 && r.nb > 1e8, 'cães e Carniceiro do clássico desligados'); assert.equal(r.liga, true);
  assert.equal(r.toS, 34, 'toSpawn ×0,85'); assert.ok(r.mixN <= 17, 'mistura acompanha');
  assert.equal(r.d0, r.g); assert.equal(r.d1, r.g + Math.round(r.g * .25), 'pontos ×1,25 por abate');
  assert.ok(r.v1.pool.length && r.v1.pool.every(x => x === 0), 'pool de luz apagado');
  assert.ok(r.v1.hemi / r.v0.hemi > .3 && r.v1.hemi / r.v0.hemi < .4, `hemisférica ×0,35 (${r.v1.hemi} / ${r.v0.hemi})`);
  assert.ok(r.v1.far / r.v0.far > .5 && r.v1.far / r.v0.far < .7, `névoa far ×0,6 (${r.v1.far} / ${r.v0.far})`);
  assert.equal(r.v1.vis, 'apagao');
  assert.equal(r.cli, null); assert.equal(r.v2.vis, null);
  assert.ok(Math.abs(r.v2.hemi / r.v0.hemi - 1) < .08, 'hemisférica volta'); assert.ok(Math.abs(r.v2.far / r.v0.far - 1) < .15, 'névoa volta');
  assert.ok(r.v2.pool.some(x => x > 0), 'luzes voltam');
});

test('Névoa do Veio: velocidade ×0,9, nasce só do chão, cor e alcance da névoa, pontos ×1,15; desliga e volta', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, p, poe, limpa, zumbi, rodada, ev) => {
    abre(); rodada(); T.sim(.5); const v0 = T.campEvVis();
    T.campEvLiga('nevoa'); const toS = T.Z.toSpawn;
    const nz = []; for (let k = 0; k < 8; k++) { const id = T.Z.nextId; T.zSpawnOne(); const z = T.Z.zs.get(id); if (z) nz.push([z.st, z.cv, z.win]); }
    limpa(); const z1 = zumbi(2, -3); const m1 = p.money; T.zHit(p, z1.id, 1e7, 'head', 'm1911', false); const d1 = p.money - m1;
    T.sim(.3); const v1 = T.campEvVis();
    T.campEvDesliga(); T.sim(.3); const v2 = T.campEvVis();
    return { toS, nz, d1, v0, v1, v2, g: pts(100) };
  });
  assert.equal(r.toS, 40, 'a Névoa não muda a quantidade');
  assert.ok(r.nz.length >= 6 && r.nz.every(z => z[0] === 'rise' && z[2] === -1), 'nasce só pelo chão (risers): ' + JSON.stringify(r.nz));
  assert.ok(r.nz.every(z => Math.abs(z[1] - .9) < 1e-9), 'velocidade ×0,9 (z.cv)');
  assert.equal(r.d1, r.g + Math.round(r.g * .15), 'pontos ×1,15');
  assert.equal(r.v1.cor, 0x0c140f); assert.equal(r.v1.fundo, 0x0c140f); assert.ok(r.v1.far <= 16 * 1.25, 'far 16 m (o atmos respira em volta)');
  assert.notEqual(r.v2.cor, 0x0c140f, 'cor volta'); assert.ok(Math.abs(r.v2.far / r.v0.far - 1) < .15, 'alcance volta');
});

test('Estouro: quantidade ×1,3, ritmo ×0,5, só Veloz, comuns correndo com vida ×0,6 e max +4', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, p, poe, limpa, zumbi, rodada, ev) => {
    rodada(); T.campEvLiga('estouro');
    const toS = T.Z.toSpawn, dl = T.Z.spawnDelay, mix = T.Z.mix.slice(), mixN = T.Z.mixN;
    const zz = []; for (let k = 0; k < 6; k++) { const id = T.Z.nextId; T.zSpawnOne(); const z = T.Z.zs.get(id); if (z) zz.push([z.kind, z.sc, z.speed, z.hp]); }
    // max +4: enche até o máximo da dificuldade e deixa o tick soltar mais
    limpa(); const mx = T.ZDIFF[T.S.st.zdiff].max; T.Z.toSpawn = 100;
    while (T.Z.zs.size < mx) { if (!T.zSpawnOne()) break; } for (const z of T.Z.zs.values()) { z.chkT = 1e12; }
    T.Z.spawnT = window.__simNow; T.sim(2); const vivos = T.Z.zs.size;
    T.campEvDesliga(); limpa(); return { toS, dl, mix, mixN, zz, mx, vivos, hp0: Math.round(Math.round(T.zHp(T.Z.round) * T.zHpK(T.Z.round)) * T.ZBAL.comum.vida) }; // comum −7% (13/10)
  });
  assert.equal(r.toS, 52, 'toSpawn ×1,3'); assert.equal(r.dl, .5, 'spawnDelay ×0,5');
  assert.ok(r.mix.every((n, i) => i === 3 || !n) && r.mixN === r.mix[3], 'especiais só Veloz');
  assert.ok(r.zz.every(z => z[0] === 0 || z[0] === 3), 'só comuns e Velozes');
  for (const z of r.zz.filter(z => z[0] === 0)) { assert.equal(z[1], 2, 'comum correndo'); assert.ok(z[2] >= 5 * .95, 'velocidade de corrida'); assert.equal(z[3], Math.round(r.hp0 * .6), 'vida ×0,6'); }
  assert.ok(r.vivos > r.mx && r.vivos <= r.mx + 4, `max +4 (${r.vivos} vivos, máximo ${r.mx})`);
});

test('Hora do Silêncio: o host recusa arma de fogo e explosivo, faca ×3, vida ×0,5, sem Insta-Kill/Nuke; o cliente fica na faca', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, p, poe, limpa, zumbi, rodada, ev) => {
    rodada(); T.Z.insta = 1e12; T.Z.bag = ['insta', 'nuke']; T.campEvLiga('silencio');
    const toS = T.Z.toSpawn, insta = T.Z.insta, mix = T.Z.mix.slice();
    const z = zumbi(2, -3); const hp = z.hp;
    const zhitArma = T.campZhitOk(p, { w: 'm1911' }, z), zhitFaca = T.campZhitOk(p, { w: 'knife' }, z);
    const danoGran = T.campDano(z, 500, 'body', 'he', p, true), danoArma = T.campDano(z, 80, 'head', 'm1911', p, false), danoFaca = T.campDano(z, 150, 'body', 'knife', p, false);
    p.bowie = true; const danoBowie = T.campDano(z, 1000, 'body', 'knife', p, false); p.bowie = false;
    z.hp = 1e5; z.maxHp = 1e5; T.zExplode(new T.V3(z.body.pos.x, 1, z.body.pos.z), 'h', 6.5, 5000, 'he', false); T.sim(.05);
    const hpGran = T.Z.zs.get(z.id)?.hp, perna = T.Z.zs.get(z.id)?.crawler;
    z.hp = 100; const m0 = p.money; T.zHit(p, z.id, 150, 'body', 'knife', false); const dFaca = p.money - m0;
    const saco = T.Z.bag.slice();
    T.sim(.3); const cur = T.campEvVis().cur;
    T.campEvDesliga(); limpa();
    return { hp0: Math.round(Math.round(T.zHp(T.Z.round) * T.zHpK(T.Z.round)) * T.ZBAL.comum.vida), g: pts(130), toS, insta, mix, hp, zhitArma, zhitFaca, danoGran, danoArma, danoFaca, danoBowie, hpGran, perna, dFaca, saco, cur };
  });
  assert.equal(r.toS, 24, 'toSpawn ×0,6'); assert.equal(r.insta, 0, 'Insta-Kill ativo apagado');
  assert.ok(r.mix.every((n, i) => i === 11 || !n), 'especiais só o Contido');
  assert.equal(r.zhitArma, false, 'zhit de arma de fogo recusado'); assert.equal(r.zhitFaca, true);
  assert.equal(r.danoGran, 0); assert.equal(r.danoArma, 0); assert.equal(r.danoFaca, 450, 'faca ×3'); assert.equal(r.danoBowie, 1000, 'Bowie fica nos 1000');
  assert.equal(r.hpGran, 1e5, 'granada não fere'); assert.equal(r.perna, false, 'explosão não arranca perna');
  assert.equal(r.dFaca, r.g + Math.round(r.g * .5), 'pontos ×1,5 na faca');
  assert.ok(r.saco.length && r.saco.every(t => t !== 'insta' && t !== 'nuke'), 'Insta-Kill e Nuke fora do saco: ' + r.saco);
  assert.equal(r.cur, 'knife', 'cliente troca para a faca');
  assert.equal(r.hp, Math.max(150, Math.round(r.hp0 * .5)), 'vida ×0,5 (mínimo 150)');
});

test('Inchados: 60% Explosivos, estouro 1,2× mais longe e 2× nos zumbis; brilho da barriga ×1,5 e volta', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, p, poe, limpa, zumbi, rodada, ev) => {
    rodada(); T.campEvLiga('inchados'); let n2 = 0; const N = 400;
    for (let k = 0; k < N; k++) { const mix2 = T.Z.mix[2], mixN = T.Z.mixN; if (T.campTipo(0) === 2) { n2++; T.Z.mix[2] = mix2; T.Z.mixN = mixN; } }
    // estouro: um Explosivo e um comum a 5 m (fora dos 4,5 m do clássico, dentro dos 5,4 m)
    limpa(); const ex = zumbi(0, -3, 2), al = zumbi(5, -3, 0); al.hp = al.maxHp = 1e6; ex.hp = 1;
    T.zHit(p, ex.id, 100, 'body', 'm1911', false); const perda5 = 1e6 - (T.Z.zs.get(al.id)?.hp ?? 0);
    limpa(); const ex2 = zumbi(0, -3, 2), al2 = zumbi(3, -3, 0); al2.hp = al2.maxHp = 1e6; ex2.hp = 1;
    T.zHit(p, ex2.id, 100, 'body', 'm1911', false); const perda3 = 1e6 - (T.Z.zs.get(al2.id)?.hp ?? 0);
    const dz = T.zHp(T.Z.round) * T.zHpK(T.Z.round) * 1.4;
    // visual: um Explosivo no cliente cria o molde; o brilho sobe ×1,5 e volta no fim
    limpa(); T.campEvDesliga(); T.sim(.1); const ex3 = zumbi(1, -6, 2); T.sim(.3); const b0 = T.campEvVis().molde;
    T.campEvLiga('inchados'); T.sim(.7); const b1 = T.campEvVis().molde; T.campEvDesliga(); T.sim(.2); const b2 = T.campEvVis().molde; limpa();
    return { n2, N, perda5, perda3, dz, b0, b1, b2 };
  });
  assert.ok(Math.abs(r.n2 / r.N - .6) < .08, `60% dos comuns viram Explosivo (${r.n2}/${r.N})`);
  const f = (d, R) => d <= R ? 1 - d / (R * 1.3) : 0, k = r.dz;
  assert.ok(Math.abs(r.perda5 - 2 * k * f(5, 5.4)) < k * .02, `a 5 m (só o evento): ${r.perda5} ~ ${2 * k * f(5, 5.4)}`);
  assert.ok(Math.abs(r.perda3 - 2 * k * f(3, 5.4)) < k * .02, `a 3 m: o total é 2× com raio 1,2× (${r.perda3} ~ ${2 * k * f(3, 5.4)})`);
  assert.ok(r.b0 > 0 && Math.abs(r.b1 / r.b0 - 1.5) < .01, `brilho ×1,5 (${r.b1} / ${r.b0})`); assert.equal(r.b2, r.b0, 'brilho volta');
});

test('Contra o relógio: prazo 60 + 2,5·toSpawn; antes do prazo, Munição Máxima e +250; no prazo, ritmo ×0,25, comuns correm, +1 Brutamonte; manômetro', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, p, poe, limpa, zumbi, rodada, ev) => {
    rodada(); T.Z.toSpawn = 20; T.campEvLiga('relogio'); const prazo = T.CAMP_EVS.fim - window.__simNow;
    T.sim(.3); const v = T.campEvVis();
    // antes do prazo: o último abate da rodada
    T.Z.toSpawn = 1; const z = zumbi(2, -3); T.Z.toSpawn = 0; const m0 = p.money, dr0 = T.Z.drops.length;
    T.zHit(p, z.id, 1e7, 'body', 'm1911', false); const ganho = p.money - m0, drop = T.Z.drops.slice(dr0).map(d => d.type);
    // outra vez: deixa passar o prazo
    rodada(); T.Z.toSpawn = 10; T.campEvLiga('relogio'); const c = zumbi(3, -3, 0); c.sc = 0; c.speed = 1; const dl = T.Z.spawnDelay, toS = T.Z.toSpawn, m1 = T.Z.mix[1];
    T.Z.spawnT = 1e12; T.sim(T.CAMP_EVS.fim - window.__simNow + .03); T.Z.spawnT = 1e12;
    const est = { x: T.CAMP_EVS.estourou, dl: T.Z.spawnDelay / dl, toS: T.Z.toSpawn - toS, m1: T.Z.mix[1] - m1, sc: c.sc, sp: c.speed };
    T.sim(.2); const v2 = T.campEvVis(); T.campEvDesliga(); limpa(); T.sim(.1);
    return { prazo, v, ganho, drop, est, v2, v3: T.campEvVis(), g: pts(60) };
  });
  assert.ok(Math.abs(r.prazo - (60 + 2.5 * 20)) < .01, 'prazo 60 + 2,5·toSpawn');
  assert.ok(r.v.man, 'manômetro no HUD');
  assert.equal(r.ganho, r.g + 250, 'abate + 250 para cada jogador vivo'); assert.ok(r.drop.includes('max'), 'Munição Máxima garantida');
  assert.equal(r.est.x, true); assert.ok(Math.abs(r.est.dl - .25) < 1e-9, 'spawnDelay ×0,25'); assert.equal(r.est.toS, 1); assert.equal(r.est.m1, 1, '+1 Brutamonte');
  assert.equal(r.est.sc, 2, 'comum vivo passa a correr'); assert.ok(r.est.sp >= 5 * .95);
  assert.equal(r.v2.manTxt, 'NO VERMELHO'); assert.equal(r.v3.man, false, 'manômetro some');
});

test('Lançamento aéreo: caixote a cada 25 s (no máximo 5), em chão aberto a 10–30 m; F abre (host confere a distância); some em 40 s', { timeout: 180000 }, async () => {
  const r = await rodar((T, arg, p, poe, limpa, zumbi, rodada, ev) => {
    abre(); T.sim(.5); rodada(); T.campEvLiga('suprimento'); const toS = T.Z.toSpawn;
    T.Z.toSpawn = 500; T.Z.spawnT = 1e12; const E = T.CAMP_EVS;
    T.sim(10.2); const n1 = E.cx.length; const c1 = E.cx[0] && { d: Math.hypot(E.cx[0].x - p.pos[0], E.cx[0].z - p.pos[2]), cel: T.FF.walk[T.ffCell(E.cx[0].x, E.cx[0].z)] };
    for (let k = 0; k < 8; k++) { E.cxT = window.__simNow; T.sim(.05); }
    const nMax = E.cx.length, cxN = E.cxN; T.sim(.2);
    const cli = T.CAMP_EVC.cx.length, i = T.ZD.zint.findIndex(o => o.t === 'suprimento');
    // F: longe não abre; perto abre
    const alvo = E.cx[0]; T.srvZUse(p, { k: 'zint', id: i }); const longe = E.cx.length;
    poe(p, alvo.x + 1, alvo.z); T.sim(3); T.zInteract(0); const prompt = T.ZC.act?.txt;
    const m0 = p.money, pk0 = p.perks.length, dr0 = T.Z.drops.length; T.srvZUse(p, { k: 'zint', id: i }); const perto = E.cx.length, abriu = !E.cx.includes(alvo), algo = T.Z.drops.length > dr0 || p.perks.length > pk0 || true;
    T.sim(41); const fim = E.cx.length; T.sim(.2); const cliFim = T.CAMP_EVC.cx.length;
    T.campEvDesliga(); limpa();
    return { toS, n1, c1, nMax, cxN, cli, longe, prompt, perto, abriu, fim, cliFim };
  });
  assert.equal(r.toS, 46, 'toSpawn ×1,15');
  assert.equal(r.n1, 1, 'o primeiro cai'); assert.ok(r.c1.d >= 10 && r.c1.d <= 30 && r.c1.cel, `10–30 m, chão andável (${r.c1.d})`);
  assert.equal(r.nMax, 5, 'no máximo 5 por rodada'); assert.equal(r.cxN, 5); assert.equal(r.cli, 5, 'o cliente vê os 5');
  assert.equal(r.longe, 5, 'longe não abre'); assert.equal(r.prompt, 'Abrir o caixote'); assert.equal(r.perto, 4, 'perto abre'); assert.ok(r.abriu);
  assert.equal(r.fim, 0, 'somem em 40 s'); assert.equal(r.cliFim, 0);
});

test('agenda do Sanatório pela rodada do mapa: 3 Apagão, 6 Silêncio, 8 cães (sem evento), 9 Estouro, 12 Carniceiro, repete depois da 20; quem entra no meio recebe o evento', { timeout: 240000 }, async () => {
  const r = await rodar((T, arg, p, poe, limpa, zumbi, rodada, ev) => {
    const passa = rr => { limpa(); T.Z.round = rr - 1; T.Z.phase = 'round'; T.Z.toSpawn = 0; T.zEndRound(); const nd = T.Z.nextDog, nb = T.Z.nextBoss; T.zStartRound(); return { r: T.Z.round, ev: ev(), dog: T.Z.dogRound, bo: T.Z.bossQ, nd, nb, nd2: T.Z.nextDog, nb2: T.Z.nextBoss, et: T.CAMP_ATOS[T.CAMP.et]?.id }; };
    const a = {}; for (const rr of [2, 3, 4, 5, 6]) a[rr] = passa(rr);
    const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; } };
    T.srvOnData(c, { t: 'join', v: 2, pv: 9, name: 'Meio' }); T.sim(.05);
    const st = c.out.filter(m => m.t === 'state' && m.z).pop(); T.srvDrop(c);
    const cp = st?.z?.cp; T.CAMP_EVC.id = null; T.campSync(cp); const sync = T.CAMP_EVC.id;
    for (const rr of [7, 8, 9, 10, 11, 12, 13, 21, 22, 23, 24, 31, 32, 33]) a[rr] = passa(rr);
    const tab = T.CAMP_AGENDA.sanatorio, nevoa = Object.values(T.CAMP_AGENDA).some(A => false) || Object.entries(tab).some(([k, v]) => v?.ev === 'nevoa');
    return { a, cpEv: cp?.ev, sync, nevoa, cabe: [T.campEvCabe('nevoa'), T.campEvCabe('apagao')], vila: T.CAMP_AGENDA.vila };
  });
  const a = r.a;
  for (const rr of [2, 4, 5]) assert.equal(a[rr].ev, null, `rodada ${rr} sem evento`);
  assert.equal(a[3].ev, 'apagao'); assert.equal(a[6].ev, 'silencio'); assert.equal(a[9].ev, 'estouro');
  assert.deepEqual(r.cpEv?.slice(0, 2), ['silencio', 6], 'cp do evento para quem entra'); assert.equal(r.sync, 'silencio', 'campSync liga no cliente');
  assert.equal(a[8].nd, 8, 'cães marcados no fim da 7'); assert.equal(a[8].dog, true, 'cães da agenda na 8'); assert.equal(a[8].ev, null, 'evento nunca em rodada de cães');
  assert.equal(a[12].nb, 12, 'Carniceiro marcado no fim da 11'); assert.equal(a[12].bo, 1, 'Carniceiro na 12');
  for (const rr of [8, 12]) assert.ok(a[rr].nb2 > 1e8 && a[rr].nd2 > 1e8, `rodada ${rr}: clássico desligado de novo`);
  assert.equal(a[13].dog, true, 'cães na 13'); assert.equal(a[11].ev, 'inchados');
  // depois da 20 o trecho 11–20 repete: 21 = 11, 22 = 12 (Carniceiro), 23 = 13 (cães), 24 = 14 (Relógio); 31–33 de novo
  assert.equal(a[21].ev, 'inchados'); assert.equal(a[22].bo, 1); assert.equal(a[23].dog, true); assert.equal(a[24].ev, 'relogio');
  assert.equal(a[31].ev, 'inchados'); assert.equal(a[32].bo, 1); assert.equal(a[33].dog, true);
  for (const rr of Object.keys(a)) assert.equal(a[rr].et, 'III', 'os objetivos continuam (nenhum foi feito)');
  assert.equal(r.nevoa, false, 'sem Névoa na agenda do Sanatório (não tem água)'); assert.deepEqual(r.cabe, [false, true], 'campEvCabe: Névoa só com água');
  assert.deepEqual([r.vila[3]?.ev, r.vila[8]?.caes, r.vila[9]?.ev, r.vila.repete], ['nevoa', 1, 'apagao', [11, 20]], 'Vila: as rodadas 1–9 da campanha antiga e a repetição');
});

test('etapa de chefe: sem evento, cães e Carniceiro da agenda esperam; troca para o infinito depois do último objetivo (só os sistemas do infinito)', { timeout: 300000 }, async () => {
  const r = await rodar((T, arg, p, poe, limpa, zumbi, rodada, ev) => {
    p.maxHp = p.hp = 1e7; p.dwEnd = 1e12;
    const feito = () => { for (const id in T.CAMP.obj) T.CAMP.obj[id].st = 'feito'; };
    const passa = (rr, f) => { limpa(); T.Z.round = rr - 1; T.Z.phase = 'round'; T.Z.toSpawn = 0; if (f) feito(); T.zEndRound(); const nd = T.Z.nextDog, nb = T.Z.nextBoss; T.zStartRound(); T.Z.spawnT = 1e12; T.sim(.05); T.Z.spawnT = 1e12;
      return { r: T.Z.round, ev: ev(), dog: T.Z.dogRound, bo: T.Z.bossQ, nd, nb, et: T.CAMP_ATOS[T.CAMP.et]?.id ?? null, modo: T.CAMP.modo, pend: { ...T.CAMP_EVS.pend }, toS: T.Z.toSpawn, mista: T.Z.mistaCaes }; };
    const a = {};
    a[10] = passa(10); a[11] = passa(11, 1); a[12] = passa(12, 1); a[13] = passa(13); a[14] = passa(14); a[15] = passa(15, 1); a[16] = passa(16);
    const antes = { caes: T.CAMP_EVS.ultCaes, carn: T.CAMP_EVS.ultCarn };
    a[17] = passa(17, 1); const tr = { nd: T.Z.nextDog, nb: T.Z.nextBoss, prox: T.CAMP_EVS.inf.prox, cadeia: T.CAMP.cadeia, et: T.CAMP.et };
    for (let rr = 18; rr <= 32; rr++) a[rr] = passa(rr);
    limpa(); T.Z.bossQ = 0; T.Z.mistaCaes = 0; T.Z.dogRound = false; return { a, antes, tr }; // sem Carniceiro nem cães pendurados para os testes seguintes
  });
  const a = r.a;
  assert.equal(a[10].et, 'III'); assert.equal(a[11].et, 'IV'); assert.equal(a[11].ev, 'inchados', 'IV: a agenda segue pela rodada');
  assert.equal(a[12].et, 'C2', 'etapa de chefe'); assert.equal(a[12].bo, 0, 'Carniceiro da 12 espera'); assert.equal(a[12].pend.carn, 1);
  assert.equal(a[13].dog, false, 'cães da 13 esperam'); assert.equal(a[13].pend.caes, 1); assert.equal(a[14].ev, null, 'Relógio da 14: nenhum evento na etapa de chefe');
  assert.ok(a[12].toS < 25, `etapa de chefe: só uma fração dos comuns (${a[12].toS})`);
  assert.equal(a[15].et, 'V'); assert.equal(a[15].dog, true, 'os cães pendentes vêm na primeira rodada depois do chefe'); assert.equal(a[15].pend.carn, 1, 'o Carniceiro não cabe numa rodada de cães');
  assert.equal(a[16].bo, 1, 'e o Carniceiro na seguinte'); assert.deepEqual(a[16].pend, { caes: 0, carn: 0 }); assert.equal(a[16].ev, 'suprimento');
  // última etapa feita no fim da 16: infinito na 17
  assert.equal(a[17].modo, 'infinito'); assert.equal(a[17].et, null); assert.equal(r.tr.cadeia, null); assert.equal(r.tr.et, -1);
  assert.deepEqual(r.antes, { caes: 15, carn: 16 });
  assert.ok(r.tr.nb >= 16 + 6, `Carniceiro do infinito não cola no da agenda (${r.tr.nb})`); assert.ok(r.tr.nd >= 19 && r.tr.nd <= 20, `cães do infinito entre 19 e 20 (${r.tr.nd})`); assert.equal(r.tr.prox, 18, 'eventos do infinito a partir da 18');
  const R = Object.values(a).filter(x => x.r >= 17);
  assert.ok(R.every(x => x.modo === 'infinito'), 'continua no infinito');
  const evs = R.filter(x => x.ev).map(x => x.r);
  assert.ok(evs.length >= 2 && evs.length <= 3 && evs.every((v, i) => v >= 18 + 5 * i), `eventos só do sorteio do infinito (o k-ésimo a partir da 18 + 5k): ${evs}`);
  assert.ok(!R.some(x => x.r === 21 && x.ev === 'inchados' && !evs.includes(21)), 'a agenda não vale mais');
  assert.ok(R.some(x => x.dog), 'cães no infinito'); assert.ok(R.filter(x => x.bo).length >= 1, 'Carniceiro no infinito');
  const ev1 = R.find(x => x.ev); assert.notEqual(ev1.ev, 'suprimento', 'o primeiro evento do infinito não repete o último da agenda');
});

test('cada evento desliga e limpa: host sem regra (tipo, dano, zhit, vida, nascimento) e cliente sem visual', { timeout: 180000 }, async () => {
  const r = await rodar((T, arg, p, poe, limpa, zumbi, rodada, ev) => {
    const out = {};
    for (const id of Object.keys(T.CAMP_EV)) {
      rodada(); T.campEvLiga(id); T.sim(.3); const ligado = [ev(), T.CAMP_EVC.vis];
      T.campEvDesliga(); limpa(); T.Z.spawnDelay = 1; T.sim(.3);
      if (T.CAMP_ZKS) { T.CAMP_ZKS.rest = {}; T.CAMP_ZKS.r = T.Z.round; T.CAMP_ZKS.trio = 0; } // O3-D06: sem as cotas dos tipos novos (só a regra do evento); antes de nascer, senão o infinito pode sortear um tipo novo
      const z = zumbi(2, -3), base = Math.round(Math.round(Math.round(T.zHp(T.Z.round) * T.zHpK(T.Z.round)) * T.ZBAL.comum.vida) * (T.campCurva(T.Z.round)?.vidaK ?? 1)) /* com a curva do mapa (vidaK) */, v = T.campEvVis();
      let n2 = 0; for (let k = 0; k < 50; k++) if (T.campTipo(0) !== 0) n2++;
      out[id] = { ligado, ev: ev(), cli: T.CAMP_EVC.id, vis: v.vis, man: v.man, tipo: n2, dano: T.campDano(z, 77, 'body', 'he', p, true), zhit: T.campZhitOk(p, { w: 'm1911' }, z), hp: z.hp === base || [z.hp, base, z.kind, T.Z.round, T.CAMP.modo], cv: z.cv ?? 1, fog: T.ZC.fogDog };
      limpa();
    }
    return out;
  });
  for (const [id, o] of Object.entries(r)) {
    assert.deepEqual(o.ligado, [id, id], id + ' ligou no host e no cliente');
    assert.equal(o.ev, null, id); assert.equal(o.cli, null, id); assert.equal(o.vis, null, id); assert.equal(o.man, false, id);
    assert.equal(o.tipo, 0, id + ': tipo'); assert.equal(o.dano, 77, id + ': dano'); assert.equal(o.zhit, true, id + ': zhit'); assert.equal(o.hp, true, id + ': vida'); assert.equal(o.cv, 1, id + ': velocidade'); assert.equal(o.fog, false, id + ': névoa');
  }
});

test('infinito antigo (zmode infinito): evento a cada 5 rodadas a partir da 5ª (nunca o Relógio antes da 10ª, sem repetir os 2 últimos); a rodada seguinte desliga', { timeout: 180000 }, async () => {
  const r = await rodar((T, arg, p, poe, limpa, zumbi, rodada, ev) => {
    T.S.st = { ...T.S.st, zmode: 'infinito', map: 'sanatorio' }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    const on = [T.CAMP.on, T.CAMP.modo];
    const passa = rr => { limpa(); T.Z.round = rr - 1; T.Z.phase = 'round'; T.Z.toSpawn = 0; T.Z.nextDog = T.Z.nextBoss = 1e9; T.zEndRound(); T.sim(.05); T.zStartRound(); T.sim(.05); return ev(); };
    const L = []; for (let rr = 1; rr <= 21; rr++) L.push(passa(rr));
    const cli = T.CAMP_EVC.id;
    return { on, L, cli, ult: T.CAMP_EVS.inf.ult };
  });
  assert.deepEqual(r.on, [true, 'infinito']);
  const com = r.L.map((e, i) => [i + 1, e]).filter(x => x[1]);
  assert.deepEqual(com.map(x => x[0]), [5, 10, 15, 21], 'nas rodadas 5, 10, 15 e 21 (a 20 é de chefe de campo: fica para a seguinte)');
  assert.notEqual(r.L[4], 'relogio'); assert.notEqual(com[1][1], com[0][1]); assert.ok(com[2][1] !== com[1][1] && com[2][1] !== com[0][1], 'sem repetir os 2 últimos');
  assert.equal(r.cli, r.L[20], 'cliente com o evento da rodada');
});
