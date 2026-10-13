// Balanceamento dos objetivos do mapa (O3-D15, refeito em 13/10 para o modo de objetivos: cada mapa começa na rodada 1 e a sequência dura o
// quanto o time levar; depois, rodadas infinitas). Confere: as tabelas (CAMP_CURVA por mapa, CAMP_RITMO, CAMP_AGENDA, vida dos chefes)
// inteiras e coerentes; a curva no Normal com 1 jogador sobe com a rodada (não com a etapa) e chega no clássico sem degrau antes do infinito;
// nos dois mapas, uma medição rodada a rodada (1 a 40, terminando os objetivos cedo e tarde) sem rodada vazia, com cães e Carniceiro sempre
// voltando, eventos que acabam com a rodada, os tipos do mapa e a troca para o infinito sem dois sistemas ao mesmo tempo; e uma partida de
// verdade (relógio do jogo, zumbis morrendo) que atravessa a troca sem travar.
// Rodar: node --test tests/campanha-balanco.test.mjs (liga sozinho o modo de objetivos, ZV2_OBJ)
process.env.ZV2_OBJ ||= '1';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala } from './_jogo.mjs';

let J = null;
after(async () => { await J?.fechar(); });
async function abrir(map) { if (J) await J.fechar(); J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map, zdiff: 1 }); }

// a curva (Normal, 1 jogador) documentada: [mapa, rodada, vida do comum, zumbis na rodada] (quem mudar um número atualiza aqui)
const CURVA = [
  ['vila', 1, 135, 5], ['vila', 3, 329, 12], ['vila', 6, 650, 26], ['vila', 10, 1045, 36], ['vila', 20, 2710, 72],
  ['sanatorio', 1, 135, 5], ['sanatorio', 4, 424, 17], ['sanatorio', 8, 850, 31], ['sanatorio', 15, 1683, 54], ['sanatorio', 25, 4365, 90],
];
const CHEFES = { 14: 10450, 15: 40650, 16: 89483 }; // vida com 1 jogador no Normal (zHp(rodada) · (base + porJog) · hpChefe)

test('tabelas: curva por mapa (último ponto = clássico), estreias por mapa, agenda com cães e Carniceiro em todo ciclo, eventos que existem', { timeout: 240000 }, async () => {
  await abrir('sanatorio');
  const r = await J.page.evaluate(() => {
    const T = window.__T;
    return { curva: T.CAMP_CURVA, ritmo: T.CAMP_RITMO, agenda: T.CAMP_AGENDA, evs: Object.keys(T.CAMP_EV), agua: Object.fromEntries(Object.keys(T.CAMP_AGENDA).map(m => [m, T.CAMP_AGUA[m]?.length || 0])),
      zk: Object.fromEntries([7, 8, 9, 10, 11, 12, 13].map(k => [k, !!T.ZKIND[k] && !T.ZKIND[k].chefe])), mix: Object.keys(T.CAMP_MIX).map(Number),
      hpChefe: T.CAMP_CHEFE_BASE.hpChefe, tetoEsp: T.CAMP_ZKV.tetoEsp, nevoaAgua: T.CAMP_EV.nevoa.agua };
  });
  for (const m of ['vila', 'sanatorio']) {
    const C = r.curva[m]; assert.ok(C?.pts?.length >= 1, `curva de ${m}`);
    C.pts.forEach((p, i) => { assert.ok(!i || p[0] > C.pts[i - 1][0], `${m}: rodadas em ordem`); for (const v of [p[1], p[2]]) assert.ok(v >= .5 && v <= 2, `${m}: ${v} fora de 0,5–2`); });
    assert.deepEqual(C.pts.at(-1).slice(1), [1, 1], `${m}: o último ponto é o clássico (o infinito segue sem degrau)`);
    assert.ok(C.chefe > 0 && C.chefe <= 1, `${m}: fração da etapa de chefe`);
    const est = r.ritmo[m].estreia; assert.ok(Object.keys(est).length >= 3, `${m}: tipos novos`);
    for (const [k, e] of Object.entries(est)) { assert.ok(r.zk[k] && r.mix.includes(+k), `${m}: tipo ${k} existe`); assert.ok(e >= 3 && e <= 15, `${m}: estreia do ${k} na rodada ${e}`); }
    const A = r.agenda[m], [de, ate] = A.repete; assert.ok(de >= 1 && ate > de, `${m}: repetição`);
    for (const [rr, l] of Object.entries(A)) {
      if (rr === 'repete') continue;
      assert.ok(+rr >= 1 && +rr <= ate, `${m}: rodada ${rr} da agenda dentro da tabela`);
      if (l.ev) { assert.ok(r.evs.includes(l.ev), `${m}: evento ${l.ev}`); assert.ok(!l.caes, `${m} ${rr}: evento em rodada de cães`); if (l.ev === 'nevoa') assert.ok(r.agua[m] > 0, `${m}: Névoa sem água`); }
    }
    const ciclo = Object.entries(A).filter(([rr]) => +rr >= de && +rr <= ate).map(([, l]) => l);
    assert.ok(ciclo.filter(l => l.caes).length >= 2 && ciclo.filter(l => l.carn).length >= 1 && ciclo.filter(l => l.ev).length >= 3, `${m}: o ciclo que repete tem cães, Carniceiro e eventos`);
  }
  assert.deepEqual(Object.keys(r.ritmo.vila.estreia).map(Number), [7, 8, 9]); assert.deepEqual(Object.keys(r.ritmo.sanatorio.estreia).map(Number), [9, 10, 11, 12, 13]);
  assert.ok(r.ritmo.inf.caes[0] >= 1 && r.ritmo.inf.caes[1] >= r.ritmo.inf.caes[0] && r.ritmo.inf.carn >= 1 && r.ritmo.inf.ev >= 1, 'troca para o infinito');
  assert.equal(r.hpChefe, 1); assert.equal(r.tetoEsp, .5, 'teto de especiais ⌊n·0,5⌋ como no clássico'); assert.equal(r.nevoaAgua, 1);
});

test('curva no Normal com 1 jogador: sobe com a rodada nos dois mapas, = tabela documentada, chefe em fração da rodada; vida dos chefes', { timeout: 120000 }, async () => {
  const r = await J.page.evaluate(({ CURVA }) => {
    const T = window.__T, D = T.ZDIFF[1]; T.S.st = { ...T.S.st, zdiff: 1 };
    const curva = (m, r) => { const P = T.CAMP_CURVA[m].pts; let a = P[0], b = P[0]; for (const p of P) { b = p; if (r <= p[0]) break; a = p; } const u = b[0] > a[0] ? Math.min(1, Math.max(0, (r - a[0]) / (b[0] - a[0]))) : 1; return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; };
    const linha = (m, r, chefe) => { const [vk, qk] = curva(m, r); return { vida: Math.round(Math.round(T.zHp(r) * T.zHpK(r)) * vk), n: Math.max(1, Math.round(T.zCount(r, 1) * D.cnt * qk * (chefe ? T.CAMP_CURVA[m].chefe : 1))) }; };
    const serie = m => Array.from({ length: 40 }, (_, i) => linha(m, i + 1));
    const real = [1, 4, 8, 15].map(rr => { const c = T.campCurva(rr); return [rr, c.vidaK, c.qtdK]; }); // a função do jogo (mapa atual: Sanatório) = a conta daqui
    const chefes = {}; for (const k of [14, 15, 16]) { const c = T.CAMP_CHEFE[k]; chefes[k] = Math.round(T.zHp(c.rodada) * T.zHpK(c.rodada) * (c.base + c.porJog) * T.CAMP_CHEFE_BASE.hpChefe); }
    return { linhas: CURVA.map(([m, rr]) => linha(m, rr)), vila: serie('vila'), san: serie('sanatorio'), real, conta: [1, 4, 8, 15].map(rr => curva('sanatorio', rr)), chefeV: linha('vila', 10, 1).n, chefeS: linha('sanatorio', 13, 1).n, chefes };
  }, { CURVA });
  CURVA.forEach(([m, rod, vida, n], i) => { assert.equal(r.linhas[i].vida, vida, `${m} r${rod}: vida`); assert.equal(r.linhas[i].n, n, `${m} r${rod}: zumbis`); });
  for (const [m, s] of [['vila', r.vila], ['sanatorio', r.san]]) s.forEach((l, i) => { if (i) { assert.ok(l.vida > s[i - 1].vida, `${m}: vida sobe na ${i + 1}`); assert.ok(l.n >= s[i - 1].n, `${m}: quantidade não cai na ${i + 1}`); } });
  r.real.forEach(([rr, vk, qk], i) => { assert.ok(Math.abs(vk - r.conta[i][0]) < 1e-9 && Math.abs(qk - r.conta[i][1]) < 1e-9, `campCurva(${rr})`); });
  assert.ok(r.chefeV >= 14 && r.chefeV <= 20, `Vigia na 10: ${r.chefeV} comuns (antes 16 fixos)`); assert.ok(r.chefeS >= 16 && r.chefeS <= 22, `Foguista na 13: ${r.chefeS} comuns (antes 20 fixos)`);
  for (const k in CHEFES) assert.ok(Math.abs(r.chefes[k] - CHEFES[k]) <= CHEFES[k] * .002, `vida do chefe ${k}: ${r.chefes[k]}`);
});

// medição rodada a rodada: começa as rodadas pelo zStartRound, nasce tudo e fecha pelo zEndRound; os objetivos da etapa ficam prontos nas
// rodadas de "fins" (uma etapa por rodada; depois da última, o infinito)
async function medir(fins, ate) {
  return J.page.evaluate(({ fins, ate }) => {
    const T = window.__T, Z = T.Z, L = [], p = T.S.players.get('h'); p.maxHp = p.hp = 1e7;
    const limpa = () => { for (const z of [...Z.zs.values()]) { Z.zs.delete(z.id); T.broadcast({ t: 'zgone', id: z.id }); } Z.reQ = []; };
    for (const d of T.ZD.doors) Z.doors.add(d.id); T.zBuildWalk(); Z.ffT = 0;
    for (let r = 1; r <= ate; r++) {
      limpa(); Z.phase = 'break'; Z.round = r - 1; T.zStartRound(); Z.spawnT = 1e12; T.sim(.02); Z.spawnT = 1e12;
      const l = { r, modo: T.CAMP.modo, et: T.CAMP_ATOS[T.CAMP.et]?.id ?? null, ev: T.CAMP_EVS.id, dog: Z.dogRound, bo: Z.bossQ, n: Z.toSpawn, cont: {}, nan: 0 };
      for (let i = 0; i < 3000 && Z.toSpawn > 0; i++) { const id = Z.nextId; if (!T.zSpawnOne()) continue; const z = Z.zs.get(id); if (!(z.hp > 0) || !Number.isFinite(z.speed)) l.nan++; const k = z.dog ? 'c' : z.kind; l.cont[k] = (l.cont[k] || 0) + 1; Z.zs.delete(id); }
      l.resto = Z.toSpawn;
      if (fins.includes(r) && T.CAMP.modo === 'campanha') for (const id in T.CAMP.obj) T.CAMP.obj[id].st = 'feito';
      limpa(); Z.toSpawn = 0; T.zEndRound(); T.sim(.02); l.evDepois = T.CAMP_EVS.id; L.push(l);
    }
    return L;
  }, { fins, ate });
}
function confere(L, mapa, tipos, outros) {
  const inf0 = L.find(l => l.modo === 'infinito')?.r;
  assert.ok(inf0, `${mapa}: chegou ao infinito`);
  assert.ok(L.filter(l => l.r < inf0).every(l => l.modo === 'campanha') && L.filter(l => l.r >= inf0).every(l => l.modo === 'infinito' && l.et === null), `${mapa}: objetivos e depois só o infinito`);
  for (const l of L) {
    assert.ok(l.n > 0 && l.resto === 0 && l.nan === 0, `${mapa} r${l.r}: rodada com zumbis, todos nasceram, sem número quebrado (${l.n}, ${l.resto}, ${l.nan})`);
    assert.equal(l.evDepois, null, `${mapa} r${l.r}: o evento acaba com a rodada`);
    if (l.dog) assert.ok(!l.ev, `${mapa} r${l.r}: evento em rodada de cães`);
    for (const k of outros) assert.ok(!l.cont[k], `${mapa} r${l.r}: tipo ${k} de outro mapa`);
  }
  const caes = L.filter(l => l.dog).map(l => l.r), carn = L.filter(l => l.bo).map(l => l.r), evs = L.filter(l => l.ev).map(l => l.r);
  const buraco = (v, fim) => Math.max(...v.map((x, i) => i ? x - v[i - 1] : 0), fim - v.at(-1)); // o maior intervalo sem (depois do primeiro)
  assert.ok(caes.length >= 5 && caes[0] <= 11 && buraco(caes, L.length) <= 8, `${mapa}: cães sempre voltam (${caes})`); // o clássico: 5–7 e depois a cada 4–5
  assert.ok(carn.length >= 3 && carn[0] <= 14 && buraco(carn, L.length) <= 13, `${mapa}: Carniceiro sempre volta (${carn})`); // o clássico: 12 e depois a cada 10
  assert.ok(evs.length >= 6 && evs[0] <= 10 && buraco(evs, L.length) <= 8, `${mapa}: eventos durante toda a partida (${evs})`);
  for (const k of tipos) assert.ok(L.some(l => l.cont[k]), `${mapa}: o tipo ${k} aparece`);
  return { inf0, caes, carn, evs };
}

test('Vila rodada a rodada (1–40; objetivos até a 11, e um time lento até a 27): tipos da Vila, cães, Carniceiro e eventos sempre; troca para o infinito', { timeout: 600000 }, async () => {
  await abrir('vila');
  const L = await medir([4, 9, 11], 40); const c = confere(L, 'vila', [7, 8, 9], [10, 11, 12, 13]);
  assert.equal(c.inf0, 12); const semTrio = L.filter(l => l.r >= 7 && !l.dog && l.et !== 'C1' && !['estouro', 'silencio'].includes(l.ev)).filter(l => !(l.cont[8] >= 3 && l.cont[8] % 3 === 0));
  assert.deepEqual(semTrio.map(l => [l.r, l.ev, l.cont]), [], 'Soldado em trio em toda rodada comum depois da estreia (o Estouro e o Silêncio só deixam os especiais deles)');
  await abrir('vila');
  const L2 = await medir([25, 26, 27], 40); const c2 = confere(L2, 'vila-lento', [7, 8, 9], [10, 11, 12, 13]);
  assert.equal(c2.inf0, 28); const meio = L2.filter(l => l.r > 10 && l.r < 25); assert.ok(meio.some(l => l.dog) && meio.some(l => l.bo), 'agenda repetida: cães e Carniceiro com o time preso nos objetivos');
});

test('Sanatório rodada a rodada (1–40; objetivos até a 20, e um time rápido até a 7): tipos do Sanatório desde a 5, sem Névoa, troca para o infinito', { timeout: 600000 }, async () => {
  await abrir('sanatorio');
  const L = await medir([6, 12, 15, 20], 40); const c = confere(L, 'sanatorio', [10, 11, 12, 13], [7, 8, 9]);
  assert.equal(c.inf0, 21); assert.ok(L.every(l => l.ev !== 'nevoa'), 'sem Névoa no Sanatório'); assert.equal(L.find(l => l.r === 5).cont[10], 1, 'Enfermeiro estreia na 5');
  await abrir('sanatorio');
  const L2 = await medir([2, 4, 5, 7], 40); const c2 = confere(L2, 'sanatorio-rapido', [10, 11, 12, 13], [7, 8, 9]);
  assert.equal(c2.inf0, 8); assert.equal(L2.find(l => l.r === 12).cont[13], 1, 'no infinito o Pregador estreia na mesma rodada do mapa');
});

test('partida de verdade na Vila (relógio do jogo, zumbis morrendo, uma etapa por rodada): o infinito segue sem travar, com cães', { timeout: 900000 }, async () => {
  await abrir('vila');
  const r = await J.page.evaluate(() => {
    const T = window.__T, Z = T.Z, p = T.S.players.get('h'), log = [], agora = () => window.__simNow;
    p.maxHp = p.hp = 1e7; p.dwEnd = 1e12;
    let ultR = -1, t = 0, travou = 0, rT = 0;
    while (Z.round < 11 && t < 2400) {
      for (let i = 0; i < 30; i++) {
        T.sim(1 / 30); t += 1 / 30; p.hp = p.maxHp; p.alive = true; p.downed = false;
        if (Z.phase === 'round') for (const z of [...Z.zs.values()]) {
          if (z.st !== 'rise' && !(z.body.pos.y < -.5) && !z.sub) T.zHit(p, z.id, 1e9, 'body', 'm1911', false);
          else if (agora() - z.t0 > 25) { Z.zs.delete(z.id); T.broadcast({ t: 'zgone', id: z.id }); } // submerso ou preso no chão: some (o robô não chega na água)
        }
      }
      if (T.CAMP.modo === 'campanha') for (const id in T.CAMP.obj) T.CAMP.obj[id].st = 'feito'; // uma etapa por rodada (o chefe morre pelos tiros)
      if (Z.round !== ultR) { ultR = Z.round; rT = t; log.push({ r: Z.round, modo: T.CAMP.modo, et: T.CAMP_ATOS[T.CAMP.et]?.id ?? null, dog: Z.dogRound, ev: T.CAMP_EVS.id }); }
      if (t - rT > 300) { travou = Z.round; break; }
    }
    return { log, travou, t, round: Z.round, modo: T.CAMP.modo };
  });
  assert.equal(r.travou, 0, `rodada travada: ${r.travou} ${JSON.stringify(r.log.at(-1))}`);
  assert.ok(r.round >= 11, `chegou à rodada ${r.round} em ${Math.round(r.t)} s`);
  assert.equal(r.modo, 'infinito'); assert.deepEqual(r.log.slice(0, 3).map(l => l.et), ['I', 'II', 'C1'], 'uma etapa por rodada');
  assert.ok(r.log.some(l => l.dog && l.modo === 'infinito'), `cães no infinito ${JSON.stringify(r.log)}`); assert.ok(r.log.filter(l => l.modo === 'infinito').length >= 6);
  assert.deepEqual(J.erros.filter(e => !/WebGL|context/i.test(e)), [], 'sem erro na página');
});
