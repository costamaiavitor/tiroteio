// O3-D08: zumbis do Sanatório nos objetivos do mapa (docs/overhaul/campanha.md §6.2–§6.3 e §4.3 III.2; refeito em 13/10 para o modo de
// objetivos): Enfermeiro (10), Contido (11), Carvoeiro (12), Pregador do Veio (13) e a Enfermeira-chefe (elite da chave).
// Confere: os números da tabela (ZKIND, CAMP_ZK, CAMP_RITMO), que cada tipo estreia nos objetivos do Sanatório pela rodada do mapa (o
// Sanatório começa na rodada 1: antes a estreia era a da campanha de 25 rodadas e nada nascia até a 11) e nunca no clássico, a cota do
// Pregador (nRod), os tipos da Vila nunca no Sanatório (nem no infinito depois dos objetivos), a IA e a contra-tática de cada um (seringa
// que desvia com passo lateral, dose e vinheta, investida que bate na parede, crosta, fogo, brasa, canto que levanta e é cortado pelo tiro
// na cabeça, explosão que destrói os corpos), a elite com a chave, a foto de rede (o cliente lê o tipo 10–13), quem entra no meio, o
// modelo (2 chamadas de desenho) e os sons.
// Rodar: node --test tests/campanha-zumbis-sanatorio.test.mjs (liga sozinho o modo de objetivos, ZV2_OBJ)
process.env.ZV2_OBJ ||= '1';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 }); }, { timeout: 240000 });
after(async () => { await J?.fechar(); });

// cena: jogador parado num ponto (host e cliente), com muita vida, e zumbis limpos
const PREP = `(T => {
  const p = T.S.players.get('h'), Z = T.Z, agora = () => window.__simNow;
  const poe = (x, z) => { p.pos = [x, 0, z]; T.me.pos.set(x, 0, z); T.me.vel.set(0, 0, 0); };
  const passo = (seg, x, z) => { for (let i = 0, k = Math.round(seg * 60); i < k; i++) { if (x !== undefined) poe(x, z); T.sim(1 / 60); } };
  const limpa = () => { for (const z of [...Z.zs.values()]) { Z.zs.delete(z.id); T.broadcast({ t: 'zgone', id: z.id }); } Z.reQ = []; Z.toSpawn = 0; Z.spawnT = 1e12; Z.lure = null;
    const S_ = T.CAMP_ZKS; if (S_) { S_.nuvens.length = 0; S_.rest = {}; S_.r = Z.round; S_.trio = 0; S_.calN = 0; }
    const S2 = T.CAMP_ZK2S; if (S2) { for (const s of S2.ser) s.on = 0; for (const c of S2.corpos) { c.t = -1e9; c.res = 0; } S2.brasas.length = 0; S2.elite = null; }
    const C2 = T.CAMP_ZK2C; if (C2) { C2.dose.fill(0); C2.brasas.length = 0; for (const s of C2.ser) s.on = 0; } if (p.zkDose) p.zkDose.fill(0); };
  const vivo = () => { p.alive = true; p.downed = false; p.maxHp = p.hp = 5000; p.dwEnd = 0; p.perks = []; p.zbEnd = 0; };
  // um zumbi do tipo k pela fila de volta (o mesmo caminho do nascimento) e posto em (x, z), parado
  const um = (k, x, z) => { Z.reQ.push([k, 0, 0]); Z.toSpawn++; const id = Z.nextId; if (!T.zSpawnOne()) return null; const zz = Z.zs.get(id); if (x !== undefined) { zz.st = 'in'; zz.body.pos.set(x, 0, z); } zz.chkT = 1e12; return zz; };
  return { p, Z, agora, poe, passo, limpa, vivo, um };
})`;
const rodar = (fn, a = {}) => J.page.evaluate(([src, arg]) => {
  const T = window.__T, H = (new Function('return ' + arg.PREP)())(T);
  return (new Function('T', 'H', 'arg', `return (${src})(T, H, arg)`))(T, H, arg);
}, [fn.toString(), { PREP, ...a }]);

// volta aos objetivos do Sanatório (partida nova, etapa III), sem eventos nem cães da agenda nas rodadas medidas, com as portas da Recepção abertas
async function objetivosSanatorio() {
  return rodar((T, H) => {
    const A = T.CAMP_AGENDA.sanatorio; window.__agSan = { ...A }; for (let r = 1; r <= 30; r++) delete A[r];
    T.S.st = { ...T.S.st, zmode: 'campanha' }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    for (const d of ['AB', 'AC', 'AF', 'CK']) { T.Z.doors.add(d); T.broadcast({ t: 'zdoor', id: d }); } T.zBuildWalk(); T.Z.ffT = 0;
    H.vivo(); H.poe(0, -4); T.sim(.5);
    return { on: T.CAMP.on, modo: T.CAMP.modo, et: T.CAMP_ATOS[T.CAMP.et]?.id, mapa: T.S.st.map, round: T.Z.round };
  });
}
const voltaAgenda = () => rodar(T => { Object.assign(T.CAMP_AGENDA.sanatorio, window.__agSan || {}); });

test('tabela: ZKIND 10–13 e CAMP_ZK com os números do §6.2, estreias e legendas', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, T => {
    const K = T.ZKIND, Z = T.CAMP_ZK;
    return { k: [10, 11, 12, 13].map(i => [K[i].n, K[i].hp, K[i].pts, K[i].xp, K[i].sz, K[i].rad, !!K[i].chefe]), len: K.length,
      enf: [Z[10].vel, Z[10].ser.min, Z[10].ser.max, Z[10].ser.aviso, Z[10].ser.vel, Z[10].ser.dano, Z[10].dose.lento, Z[10].dose.s, Z[10].dose.max, Z[10].dose.vinhetaS, Z[10].elite.quando, Z[10].elite.vida, Z[10].elite.sz],
      con: [Z[11].vel, Z[11].inv.min, Z[11].inv.max, Z[11].inv.aviso, Z[11].inv.dist, Z[11].inv.vel, Z[11].inv.dano, Z[11].inv.empurra, Z[11].inv.atordoa, Z[11].inv.danoK],
      car: [Z[12].crosta.corpo, Z[12].crosta.cabeca, Z[12].crosta.explosao, Z[12].brasa.r, Z[12].brasa.s, Z[12].brasa.dps, Z[12].imuneFogo],
      pre: [Z[13].vel, Z[13].perto, Z[13].canto.cada, Z[13].canto.aviso, Z[13].canto.corpoS, Z[13].canto.r, Z[13].canto.vida, Z[13].canto.max, Z[13].canto.atordoa],
      mix: [10, 11, 12, 13].map(i => T.CAMP_MIX[i].estreia), ritmo: T.CAMP_RITMO.sanatorio.estreia, agua: T.CAMP_AGUA.sanatorio.length,
      fala: ['enfermeiro-estreia', 'contido-estreia', 'carvoeiro-estreia', 'pregador-estreia'].every(id => T.CAMP_FALA_TXT[id]?.txt?.length <= 160) };
  });
  assert.deepEqual(r.k, [['Enfermeiro', 1, 50, 3, 1, .3, false], ['Contido', 2, 70, 4, 1.1, .35, false], ['Carvoeiro', 1.4, 60, 4, 1.05, .32, false], ['Pregador do Veio', 1.6, 100, 6, 1.05, .3, false]]);
  assert.ok(r.len >= 14, 'ZKIND vai até o 13');
  assert.deepEqual(r.enf, [[3.6, 4.3], 5, 9, .5, 14, 15, .85, 4, 3, 2, .4, 4, 1.15]);
  assert.deepEqual(r.con, [[2.2, 2.2], 4, 14, .9, 14, 9, 45, 4, 2, 2]);
  assert.deepEqual(r.car, [.3, 1, .25, 2, 3, 15, 1]);
  assert.deepEqual(r.pre, [[1.3, 1.8], 12, 6, 1.2, 8, 10, .4, 4, 1.5]);
  assert.deepEqual(r.mix, [11, 13, 16, 18], 'estreias do infinito antigo'); assert.deepEqual(r.ritmo, { 9: 8, 10: 5, 11: 7, 12: 10, 13: 12 }, 'estreias nos objetivos do Sanatório (rodada do mapa; o Afogado só com água)');
  assert.equal(r.agua, 0, 'o §6 não pede água no Sanatório (o Afogado é da Vila e do Ato V)');
  assert.ok(r.fala, 'legendas da estreia');
});

test('clássico: os tipos 10–13 nunca nascem (rodadas 11 a 20 inteiras), campTipo devolve o mesmo, nenhum zumbi com IA da campanha', { timeout: 120000 }, async () => {
  const r = await rodar((T, H) => {
    T.S.st = { ...T.S.st, zmode: 'classico' }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    const { Z } = H; const vistos = new Set(); let n = 0, ck = 0;
    for (let r = 11; r <= 20; r++) {
      H.limpa(); Z.round = r - 1; Z.phase = 'break'; Z.nextDog = 99; T.zStartRound(); Z.dogRound = false;
      for (let i = 0; i < 120 && Z.toSpawn > 0; i++) { const id = Z.nextId; if (T.zSpawnOne()) { const z = Z.zs.get(id); vistos.add(z.kind); if (z.ck) ck++; n++; Z.zs.delete(id); } }
    }
    const L = T.CAMP_ZK2S.corpos.filter(c => c.t > -1e8).length; H.limpa();
    return { on: T.CAMP.on, vistos: [...vistos].sort((a, b) => a - b), n, ck, corpos: L, tipo: [0, 1, 10, 13].map(k => T.campTipo(k)) };
  });
  assert.equal(r.on, false);
  assert.ok(r.n > 200, 'nasceu pouco no cenário');
  assert.ok(r.vistos.every(k => k <= 6), `tipo novo no clássico: ${r.vistos}`);
  assert.equal(r.ck, 0, 'nenhum zumbi do clássico passa pela IA da campanha');
  assert.equal(r.corpos, 0);
  assert.deepEqual(r.tipo, [0, 1, 10, 13]);
});

test('objetivos do Sanatório: estreia de cada tipo pela rodada do mapa (só 1), quantidades da CAMP_MIX, legenda; Pregador pela nRod; infinito depois dos objetivos só com os tipos do mapa', { timeout: 300000 }, async () => {
  const c = await objetivosSanatorio();
  assert.deepEqual([c.on, c.modo, c.mapa, c.et], [true, 'campanha', 'sanatorio', 'III']); assert.ok(c.round <= 1, 'o Sanatório começa na rodada 1');
  const r = await rodar((T, H) => {
    const { Z } = H, out = {};
    const conta = r => { H.limpa(); T.CAMP_ZKS.r = -1; T.CAMP_ZK2S.garR = -1; Z.round = r - 1; Z.phase = 'break'; Z.dogRound = false; Z.nextDog = Z.nextBoss = 1e9; T.zStartRound(); Z.dogRound = false; Z.bossQ = 0;
      const tot = Z.toSpawn, cont = {};
      for (let i = 0; i < 300 && Z.toSpawn > 0; i++) { const id = Z.nextId; if (T.zSpawnOne()) { const z = Z.zs.get(id); cont[z.kind] = (cont[z.kind] || 0) + 1; if (z.kind >= 10) out['hp' + z.kind] = [z.hp, Math.round(T.zHp(r) * T.zHpK(r)), z.speed, z.sc, T.campCurva(r).vidaK]; Z.zs.delete(id); } }
      return { tot, cont }; };
    for (const r of [4, 5, 6, 7, 10, 12, 13, 16]) out[r] = conta(r);
    out.et = T.CAMP_ATOS[T.CAMP.et]?.id; out.falas = Object.keys(T.CAMP.falaT);
    const M = T.CAMP_MIX[13], q = r => T.campZkQtd(M, 13, r, 80, T.CAMP_ATOS[T.CAMP.et], false);
    out.preg = [11, 12, 13, 14, 15, 30].map(q);
    // o infinito depois dos objetivos (as regras de rodada; a troca é do teste de eventos): os mesmos tipos, pela mesma estreia
    const m0 = T.CAMP.modo, et0 = T.CAMP.et; T.CAMP.modo = 'infinito'; T.CAMP.et = -1; out.inf = {};
    for (const r of [12, 22]) { T.campEvDesliga?.(); out.inf[r] = conta(r).cont; }
    T.CAMP.modo = m0; T.CAMP.et = et0; T.CAMP_ZKS.rest = {}; T.CAMP_ZKS.r = Z.round; Z.toSpawn = 0; Z.round = 11;
    H.limpa(); return out;
  });
  await voltaAgenda();
  assert.equal(r.et, 'III', 'os tipos estreiam pela rodada, mesmo com o time ainda na primeira etapa');
  assert.ok([10, 11, 12, 13].every(k => !r[4].cont[k]), `nada antes da 5: ${JSON.stringify(r[4].cont)}`);
  assert.equal(r[5].cont[10], 1, 'Enfermeiro na estreia (5): 1'); assert.ok(!r[5].cont[11] && !r[5].cont[12] && !r[5].cont[13]);
  assert.ok(r[6].cont[10] >= 2, `Enfermeiro 8% na 6: ${JSON.stringify(r[6])}`);
  assert.equal(r[7].cont[11], 1, 'Contido na estreia (7): 1');
  assert.equal(r[10].cont[12], 1, 'Carvoeiro na estreia (10): 1'); assert.equal(r[10].cont[11], 2, 'Contido: 1 + ⌊(10 − 7)/3⌋');
  assert.equal(r[12].cont[13], 1, 'Pregador na estreia (12): 1');
  assert.equal(r[16].cont[11], 3, 'Contido: teto 3'); assert.equal(r[16].cont[13], 2, 'Pregador: 2 a partir da 4ª rodada depois da estreia');
  assert.equal(r[16].cont[12], Math.round(r[16].tot * .12), `Carvoeiro 12% no fim da rampa: ${r[16].cont[12]} de ${r[16].tot}`);
  for (const rr of [4, 5, 6, 7, 10, 12, 13, 16]) {
    const c = r[rr].cont, esp = Object.entries(c).filter(([k]) => +k > 0 && +k !== 6).reduce((a, [, v]) => a + v, 0);
    assert.ok(esp <= Math.floor(r[rr].tot * .5), `teto de especiais na ${rr}`); assert.equal(Object.values(c).reduce((a, b) => a + b, 0), r[rr].tot);
    assert.ok(!c[7] && !c[8] && !c[9], `rodada ${rr}: tipo da Vila no Sanatório ${JSON.stringify(c)}`);
  }
  assert.ok(r[4].tot < r[16].tot && r[16].tot > 0, 'a quantidade sobe com a rodada');
  // vida = comum × vidaK da curva do mapa (1 a partir da 8) × ZKIND.hp; velocidade da tabela
  for (const [k, hp] of [[10, 1], [11, 2], [12, 1.4], [13, 1.6]]) { const h = r['hp' + k]; assert.ok(Math.abs(h[0] - Math.round(Math.round(h[1] * h[4]) * hp)) <= 2, `vida do tipo ${k}: ${h}`); }
  assert.ok(r.hp10[2] >= 3.6 && r.hp10[2] <= 4.3 && r.hp10[3] === 1); assert.ok(Math.abs(r.hp11[2] - 2.2) < 1e-6 && r.hp11[3] === 0);
  assert.ok((r.hp12[3] === 0 && r.hp12[2] <= 1.8) || (r.hp12[3] === 1 && r.hp12[2] >= 3.6)); assert.ok(r.hp13[2] >= 1.3 && r.hp13[2] <= 1.8);
  assert.ok(['enfermeiro', 'contido', 'carvoeiro', 'pregador'].every(id => r.falas.includes(id)), `legendas: ${r.falas}`);
  assert.deepEqual(r.preg, [0, 1, 1, 1, 2, 2], 'Pregador (nRod): 1 nas 3 primeiras rodadas, depois 2');
  assert.equal(r.inf[12][13], 1, `infinito: estreia do Pregador com 1 ${JSON.stringify(r.inf[12])}`); assert.equal(r.inf[22][13], 2, `infinito: 2 Pregadores na 22 ${JSON.stringify(r.inf[22])}`);
  assert.ok(r.inf[22][10] >= 1 && r.inf[22][11] >= 1 && r.inf[22][12] >= 1, `infinito: os tipos do Sanatório nascem ${JSON.stringify(r.inf[22])}`);
  assert.ok(!r.inf[22][7] && !r.inf[22][8] && !r.inf[22][9], `infinito: sem os tipos da Vila nem Afogado sem água ${JSON.stringify(r.inf[22])}`);
});

test('Enfermeiro: aviso de 0,5 s, seringa em arco (15 + dose), passo lateral desvia, fora da faixa não joga; doses acumulam, lentidão e vinheta', { timeout: 120000 }, async () => {
  const r = await rodar((T, H) => {
    const { Z, p } = H, o = {}; H.limpa(); H.vivo(); H.poe(5, -4); T.sim(.1); Z.phase = 'round';
    const z = H.um(10, 5, 3); z.speed = 0; z.atkT = 1e12; z.yaw = 0; // 7 m
    const hp0 = p.hp; H.passo(1 / 60, 5, -4);
    o.aviso = [!!z.serA, z.sc, z.atkWind > 0, Math.round((z.serA - H.agora()) * 100) / 100];
    const zc = () => T.ZC.zs.get(z.id); H.passo(.1, 5, -4); o.cli = [zc()?.kind, zc() && (zc().f & 3), zc() && !!(zc().f & 4), zc() && zc().model.userData.serBr.scale.x > .5];
    H.passo(.35, 5, -4); o.antes = hp0 - p.hp; H.passo(.1, 5, -4); o.voa = [T.CAMP_ZK2S.ser.some(s => s.on), T.CAMP_ZK2C.ser.some(s => s.on)];
    H.passo(.6, 5, -4); o.dano = hp0 - p.hp; o.dose = [p.zkDose.filter(t => t > H.agora()).length, T.CAMP_ZK2C.dose.filter(t => t > H.agora()).length]; o.fim = T.CAMP_ZK2S.ser.some(s => s.on);
    // passo lateral no fim do aviso: a seringa vai onde ele estava
    z.serCd = 0; z.serChk = 0; p.zkDose.fill(0); const hp1 = p.hp; H.passo(1 / 60, 5, -4); const av = !!z.serA; H.passo(.55, 5, -4); H.passo(1, 7, -4); o.lado = [av, hp1 - p.hp];
    // fora da faixa (3 m e 12 m): não joga
    z.serCd = 0; z.serChk = 0; z.body.pos.set(5, 0, -1); H.passo(.3, 5, -4); o.perto = !!z.serA || z.serCd > H.agora(); z.serCd = 0; z.serChk = 0; z.body.pos.set(5, 0, 8); H.poe(5, -4.2); H.passo(.3, 5, -4.2); o.longe = !!z.serA;
    // 3 doses: vinheta; a lentidão desfaz parte do passo (0,85^n)
    z.serCd = 1e12; T.campZk2Dose(p); T.campZk2Dose(p); T.sim(1 / 60); const C_ = T.CAMP_ZK2C; T.sim(1 / 60);
    C_.dx = T.me.pos.x; C_.dz = T.me.pos.z; const xa = T.me.pos.x; T.me.pos.x += 1; C_.raf = 0; T.campZk2Loop(); o.lento2 = Math.round((T.me.pos.x - xa) * 1000) / 1000;
    T.campZk2Dose(p); T.sim(1 / 60); const el = document.getElementById('campDose'); o.vinheta = [C_.dose.filter(t => t > H.agora()).length, !!el, Math.round((C_.vinAte - H.agora()) * 10) / 10];
    H.passo(4.2, 5, -4.2); o.passou = C_.dose.filter(t => t > H.agora()).length;
    // golpe corpo a corpo também dá dose (o zTryAttack do zChase)
    p.zkDose.fill(0); z.serCd = 1e12; z.atkT = 0; z.speed = 3.8; z.body.pos.set(5, 0, -3); const hp2 = p.hp; H.passo(2, 5, -4.2); o.golpe = [hp2 - p.hp > 0, p.zkDose.filter(t => t > H.agora()).length];
    H.limpa(); return o;
  });
  assert.deepEqual(r.aviso.slice(0, 3), [true, 3, true]); assert.ok(Math.abs(r.aviso[3] - .5) < .03, `aviso ${r.aviso[3]}`);
  assert.deepEqual(r.cli, [10, 3, true, true], 'o cliente vê o aviso (sc 3 + bit 4) e a mão brilha');
  assert.equal(r.antes, 0, 'nada antes do fim do aviso'); assert.deepEqual(r.voa, [true, true], 'seringa no ar (host e cliente)');
  assert.equal(r.dano, 15, 'seringa: 15 no Normal'); assert.deepEqual(r.dose, [1, 1], '1 dose (host e cliente)'); assert.equal(r.fim, false);
  assert.deepEqual(r.lado, [true, 0], 'passo lateral de 2 m no fim do aviso: a seringa passa');
  assert.equal(r.perto, false, 'a 3 m não joga'); assert.equal(r.longe, false, 'a 12 m não joga');
  assert.ok(Math.abs(r.lento2 - .85 * .85) < .002, `2 doses: passo × ${r.lento2}`);
  assert.deepEqual(r.vinheta.slice(0, 2), [3, true]); assert.ok(r.vinheta[2] > 1.8 && r.vinheta[2] <= 2, `vinheta escura de 2 s com 3 doses: ${r.vinheta[2]}`);
  assert.equal(r.passou, 0, 'a dose dura 4 s');
  assert.deepEqual(r.golpe, [true, 1], 'golpe corpo a corpo dá dose');
});

test('Contido: sem golpe; aviso de 0,9 s; investida (45 + empurrão, comum derrubado sem pontos), parede = atordoado ×2; passo lateral desvia; 14 m sem parede', { timeout: 120000 }, async () => {
  const r = await rodar((T, H) => {
    const { Z, p } = H, o = {}; H.limpa(); H.vivo(); H.poe(5, -4); T.sim(.1); Z.phase = 'round';
    // sem golpe: colado no jogador por 2 s, nada (recua para poder investir)
    const z = H.um(11, 5, -2.6); z.ctCd = 1e12; const hp0 = p.hp; H.passo(2, 5, -4); o.semGolpe = [hp0 - p.hp, Math.round(Math.hypot(z.body.pos.x - 5, z.body.pos.z + 4) * 10) / 10];
    // investida: jogador em (0, -5), Contido em (0, 3.5); comum no caminho
    z.ctCd = 0; z.ctChk = 0; z.body.pos.set(5, 0, 3.5); z.yaw = 0; const c = H.um(0, 5, 0); c.speed = 0; c.atkT = 1e12; const m0 = p.money, hp1 = p.hp;
    H.passo(1 / 60, 5, -5); o.aviso = [!!z.ctA, z.sc, z.atkWind > 0, Math.round((z.ctA - H.agora()) * 100) / 100];
    const zc = T.ZC.zs.get(z.id); H.passo(.1, 5, -5); o.cli = [zc.kind, zc.f & 3, !!(zc.f & 4)];
    const x0 = z.body.pos.z; H.passo(.7, 5, -5); o.parado = Math.abs(z.body.pos.z - x0) < .05;
    H.passo(.15, 5, -5); o.corre = [z.ctI, z.sc]; H.passo(.85, 5, -5);
    o.hit = [hp1 - p.hp, T.me.lungeEnd > H.agora() || T.me.lungeZ < 0 ? 1 : 0, Z.zs.has(c.id), p.money - m0];
    H.passo(.6, 5, -5); o.parede = [z.ctI, z.ctAt > H.agora(), z.sc, z.atkWind, Math.round(z.body.pos.z * 10) / 10];
    const zc2 = T.ZC.zs.get(z.id); o.cliTonto = [zc2.f & 3, !!(zc2.f & 4)];
    const hz = z.hp; T.zHit(p, z.id, 100, 'body', 'm1911', false); o.x2 = hz - z.hp;
    H.passo(2.2, 5, -5); const hz2 = z.hp; T.zHit(p, z.id, 100, 'body', 'm1911', false); o.x1 = hz2 - z.hp; o.voltou = z.sc;
    // passo lateral no fim do aviso
    z.ctCd = 0; z.ctChk = 0; z.ctR = 0; z.body.pos.set(5, 0, 4); p.hp = p.maxHp; const hp2 = p.hp; H.passo(1 / 60, 5, -5); const av = !!z.ctA; H.passo(.95, 5, -5); H.passo(1.5, 7.5, -5); o.lado = [av, hp2 - p.hp];
    // 14 m sem parede (sala K): jogador na linha até a investida começar, depois sai
    z.ctAt = 0; z.ctCd = 0; z.ctChk = 0; z.ctR = 0; z.sc = z.scB; H.poe(37, 4); z.body.pos.set(31, 0, 4); T.sim(.4); Z.ffT = 0;
    let t = 0; while (!z.ctI && t < 3) { H.passo(1 / 60, 37, 4); t += 1 / 60; } const x1 = z.body.pos.x; H.poe(37, 11); H.passo(2, 37, 11);
    o.longe = [Math.round((z.body.pos.x - x1) * 10) / 10, z.ctI, z.ctAt > H.agora(), z.ctR > 0];
    H.limpa(); return o;
  });
  assert.equal(r.semGolpe[0], 0, 'Contido não tem golpe'); assert.ok(r.semGolpe[1] >= 2, `recuou: ${r.semGolpe[1]} m`);
  assert.deepEqual(r.aviso.slice(0, 3), [true, 3, true]); assert.ok(Math.abs(r.aviso[3] - .9) < .03, `aviso ${r.aviso[3]}`);
  assert.deepEqual(r.cli, [11, 3, true]); assert.ok(r.parado, 'parado tremendo');
  assert.deepEqual(r.corre, [1, 2], 'investida (sc 2)');
  assert.equal(r.hit[0], 45, 'investida: 45 no Normal'); assert.equal(r.hit[1], 1, 'empurrão no cliente'); assert.equal(r.hit[2], false, 'comum no caminho derrubado'); assert.equal(r.hit[3], 0, 'sem pontos');
  assert.equal(r.parede[0], 0); assert.ok(r.parede[1], 'atordoado na parede'); assert.equal(r.parede[2], 3); assert.equal(r.parede[3], 0); assert.ok(r.parede[4] > -7.5 && r.parede[4] < -5.5, `parou na parede: ${r.parede[4]}`);
  assert.deepEqual(r.cliTonto, [3, false], 'cliente: atordoado = sc 3 sem o bit 4');
  assert.equal(r.x2, 200, 'atordoado leva ×2'); assert.equal(r.x1, 100, 'depois volta a ×1'); assert.equal(r.voltou, 0);
  assert.deepEqual(r.lado, [true, 0], 'passo lateral no fim do aviso: passa');
  assert.ok(Math.abs(r.longe[0] - 14) < .2, `investida de 14 m: ${r.longe[0]}`); assert.equal(r.longe[1], 0); assert.equal(r.longe[2], false, 'sem parede: não fica atordoado'); assert.ok(r.longe[3]);
});

test('Carvoeiro: crosta (corpo ×0,3, cabeça ×1, explosão ×0,25), fogo imune, brasa de 2 m por 3 s (15/s)', { timeout: 120000 }, async () => {
  const r = await rodar((T, H) => {
    const { Z, p } = H, o = {}; H.limpa(); H.vivo(); H.poe(5, -4); T.sim(.1); Z.phase = 'round';
    const z = H.um(12, 5, 4); z.speed = 0; z.atkT = 1e12; z.hp = z.maxHp = 100000; T.sim(.05);
    const d = (fn) => { const h = z.hp; fn(); return Math.round((h - z.hp) * 100) / 100; };
    o.corpo = d(() => T.zHit(p, z.id, 100, 'body', 'm1911', false)); o.pernas = d(() => T.zHit(p, z.id, 100, 'legs', 'm1911', false)); o.cabeca = d(() => T.zHit(p, z.id, 100, 'head', 'm1911', false));
    o.expl = d(() => T.zHit(p, z.id, 100, 'body', 'he', true));
    // fogo: a armadilha tira vida direto e marca fogoT; no tick seguinte volta (e não fica lento)
    T.sim(1 / 60); const h0 = z.hp; z.fogoT = H.agora() + 2; z.fogoI = 0; z.hp -= 5000; T.sim(1 / 60); o.fogo = [h0 - z.hp, z.fogoT];
    const tiroFogo = d(() => { z.fogoT = H.agora() + 2; T.zHit(p, z.id, 100, 'body', 'm1911', false); z.hp -= 3000; T.sim(1 / 60); }); o.tiroFogo = tiroFogo;
    // brasa: morre e deixa brasa; jogador dentro perde 15/s; acaba em 3 s
    H.poe(5, 3.2); T.sim(.05); z.body.pos.set(5, 0, 4); T.zHit(p, z.id, 1e7, 'head', 'm1911', false); o.brasa = [T.CAMP_ZK2S.brasas.length, T.CAMP_ZK2C.brasas.length];
    const hp0 = p.hp; H.passo(1, 5, 3.2); o.dps = hp0 - p.hp; H.passo(2.1, 5, 3.2); o.some = T.CAMP_ZK2S.brasas.length; const hp1 = p.hp; H.passo(.5, 5, 3.2); o.depois = hp1 - p.hp;
    H.limpa(); return o;
  });
  assert.equal(r.corpo, 30); assert.equal(r.pernas, 30); assert.ok(r.cabeca >= 100, `cabeça ×1 (com o multiplicador da arma): ${r.cabeca}`); assert.equal(r.expl, 25);
  assert.deepEqual(r.fogo, [0, 0], 'fogo imune, sem a lentidão de queimar');
  assert.equal(r.tiroFogo, 30, 'queimando, o tiro ainda vale (e o fogo não)');
  assert.deepEqual(r.brasa, [1, 1]); assert.ok(r.dps >= 14 && r.dps <= 16, `brasa: ${r.dps}/s`); assert.equal(r.some, 0); assert.equal(r.depois, 0);
});

test('Pregador: mantém 12 m (foge), canta 1,2 s e levanta o corpo com 40%; no máximo 4; tiro na cabeça corta e atordoa; explosão destrói o corpo', { timeout: 120000 }, async () => {
  const r = await rodar((T, H) => {
    const { Z, p } = H, o = {}; H.limpa(); H.vivo(); H.poe(5, -6); T.sim(.1); Z.phase = 'round';
    const z = H.um(13, 5, 6.5); z.atkT = 1e12; z.speed = 1.5;
    // faixa de 12–16 m: parado olhando, sem corpo não canta
    const z0 = z.body.pos.z; H.passo(.6, 5, -6); o.parado = [Math.abs(z.body.pos.z - z0) < .1, !!z.prA];
    // corpo de comum morto a ~3 m dele: canta 1,2 s e levanta com 40%
    const c = H.um(0, 6, 6); const mh = c.maxHp; T.zHit(p, c.id, 1e7, 'body', 'm1911', false); o.corpo = T.CAMP_ZK2S.corpos.filter(k => k.t > -1e8).length;
    H.passo(.3, 5, -6); o.canta = [!!z.prA, z.sc, z.atkWind > 0]; const zc = T.ZC.zs.get(z.id); o.cli = [zc.kind, zc.f & 3, !!(zc.f & 4), zc.model.userData.maos[0].scale.x > .5];
    const ids0 = new Set(Z.zs.keys()); H.passo(1.4, 5, -6);
    const lev = [...Z.zs.values()].filter(k => !ids0.has(k.id)); o.lev = [lev.length, lev[0]?.kind, lev[0]?.lev === z.id, lev[0] && Math.round(lev[0].maxHp) === Math.max(1, Math.round(mh * .4)), lev[0]?.st, z.levN, !!z.prA];
    // tiro na cabeça no canto: corta e atordoa os levantados por ele
    const l = lev[0]; for (let i = 0; i < 100 && l.st !== 'in'; i++) H.passo(1 / 30, 5, -6); l.speed = 4; l.atkT = 1e12;
    const c2 = H.um(0, 4, 6); T.zHit(p, c2.id, 1e7, 'body', 'm1911', false); z.prCd = 0; H.passo(.3, 5, -6); const cantando = !!z.prA;
    T.zHit(p, z.id, 50, 'head', 'm1911', false); const lp = l.body.pos.clone(); H.passo(1, 5, -6);
    o.corta = [cantando, !!z.prA, l.zkAt > H.agora() - 1, Math.round(l.body.pos.distanceTo(lp) * 100) / 100]; H.passo(1, 5, -6); o.anda = l.body.pos.distanceTo(lp) > .3;
    // máximo de 4 por Pregador
    z.levN = 4; z.prCd = 0; const c3 = H.um(0, 6, 5); T.zHit(p, c3.id, 1e7, 'body', 'm1911', false); H.passo(.5, 5, -6); o.max4 = !!z.prA; z.levN = 1;
    // explosão destrói o corpo (e o comum morto por ela não deixa corpo)
    for (const k of T.CAMP_ZK2S.corpos) k.t = -1e9; const c4 = H.um(0, 6, 5); T.zHit(p, c4.id, 1e7, 'body', 'm1911', false); T.zExplode(new T.V3(6, .5, 5), 'h', 4, 10, 'he');
    const c5 = H.um(0, 4, 5); c5.hp = 1; T.zExplode(new T.V3(4, .5, 5), 'h', 4, 500, 'he'); o.expl = [T.CAMP_ZK2S.corpos.filter(k => k.t > -1e8).length, Z.zs.has(c5.id)];
    z.prCd = 0; H.passo(.5, 5, -6); o.semCorpo = !!z.prA;
    // perto: foge (a distância cresce)
    for (const k of [...Z.zs.values()]) if (k !== z) Z.zs.delete(k.id); z.body.pos.set(5, 0, 0); z.prCd = 1e12; H.poe(5, -5); T.sim(.4); const d0 = Math.hypot(z.body.pos.x - 5, z.body.pos.z + 5); H.passo(2.5, 5, -5);
    o.foge = [Math.round(d0 * 10) / 10, Math.round(Math.hypot(z.body.pos.x - 5, z.body.pos.z + 5) * 10) / 10];
    H.limpa(); return o;
  });
  assert.deepEqual(r.parado, [true, false], 'a 12,5 m: parado, sem corpo não canta');
  assert.equal(r.corpo, 1);
  assert.deepEqual(r.canta, [true, 3, true]); assert.deepEqual(r.cli, [13, 3, true, true], 'cliente: canto (sc 3 + bit 4) e mãos acesas');
  assert.equal(r.lev[0], 1, 'levantou 1'); assert.equal(r.lev[1], 0); assert.ok(r.lev[2], 'marcado com o Pregador'); assert.ok(r.lev[3], '40% da vida'); assert.equal(r.lev[4], 'rise'); assert.equal(r.lev[5], 1); assert.equal(r.lev[6], false);
  assert.deepEqual(r.corta.slice(0, 3), [true, false, true], 'tiro na cabeça cortou o canto e atordoou'); assert.ok(r.corta[3] < .05, `atordoado parado: ${r.corta[3]}`); assert.ok(r.anda, 'depois de 1,5 s volta a andar');
  assert.equal(r.max4, false, 'no máximo 4 por Pregador');
  assert.deepEqual(r.expl, [0, false], 'explosão destrói o corpo; o comum morto por ela não deixa corpo'); assert.equal(r.semCorpo, false);
  assert.ok(r.foge[1] > r.foge[0] + 1.5, `fugiu: ${r.foge}`);
});

test('Enfermeira-chefe: nasce a 40% da rodada com o objetivo, vida ×4, maior e com a chave, foge, só briga encurralada, solta a chave', { timeout: 120000 }, async () => {
  const r = await rodar((T, H) => {
    const { Z, p } = H, o = {}; H.limpa(); H.vivo(); H.poe(5, -4); T.sim(.1); Z.phase = 'round';
    T.CAMP_OBJ['T.chave'] = { id: 'T.chave', tipo: 'coletar', titulo: 'teste', item: 'chave-teste', origem: 'elite', destino: { x: 0, z: 0, r: 1 } };
    T.CAMP.obj['T.chave'] = { st: 'ativo', p: 0 }; T.CAMP.itens['chave-teste'] = { st: 'oculto', x: 0, z: 0, quem: null, i: -1 };
    const S2 = T.CAMP_ZK2S; S2.r = Z.round; S2.n0 = 20; Z.toSpawn = 15; Z.phase = 'round'; T.sim(1 / 30); o.cedo = !!S2.elite;
    Z.toSpawn = 12; T.sim(1 / 30); const e = S2.elite; o.nasce = [!!e, e?.kind, e?.elite, Z.toSpawn];
    const nor = H.um(10, 6, 6); o.vida = Math.round(e.maxHp / nor.maxHp * 100) / 100; Z.zs.delete(nor.id); T.broadcast({ t: 'zgone', id: nor.id });
    T.sim(.2); const zc = T.ZC.zs.get(e.id); o.cli = [zc?.kind, zc?.sz, zc?.model.scale.x, zc?.model.userData.chave.scale.x > .5];
    // foge do jogador perto (campo de fluxo invertido)
    e.st = 'in'; e.body.pos.set(5, 0, 2); e.chkT = 1e12; e.atkT = 0; H.poe(5, -2); T.sim(.4); const d0 = Math.hypot(e.body.pos.x - 5, e.body.pos.z + 2), hp0 = p.hp; H.passo(2, 5, -2);
    o.foge = [Math.round(d0 * 10) / 10, Math.round(Math.hypot(e.body.pos.x - 5, e.body.pos.z + 2) * 10) / 10, hp0 - p.hp];
    // encurralada (sem caminho para longe): briga
    e.encAte = H.agora() + 3; e.body.pos.set(5, 0, -1); const hp1 = p.hp; H.passo(2, 5, -2); o.briga = hp1 - p.hp > 0;
    // reciclada sem morrer: nasce de novo; morta: a chave cai onde ela morreu
    Z.zs.delete(e.id); T.sim(1 / 30); const e2 = S2.elite; o.denovo = !!e2 && e2 !== e;
    e2.body.pos.set(3, 0, 3); T.zHit(p, e2.id, 1e8, 'body', 'm1911', false); const it = T.CAMP.itens['chave-teste']; o.chave = [it.st, Math.round(it.x), Math.round(it.z), S2.elite];
    T.sim(1 / 30); o.depois = !!S2.elite;
    // a elite só existe com o objetivo: sem ele, nada
    delete T.CAMP_OBJ['T.chave']; delete T.CAMP.obj['T.chave']; delete T.CAMP.itens['chave-teste'];
    H.limpa(); S2.r = Z.round; S2.n0 = 20; Z.toSpawn = 2; Z.phase = 'round'; T.sim(1 / 30); o.semObj = !!S2.elite; Z.toSpawn = 0;
    H.limpa(); return o;
  });
  assert.equal(r.cedo, false, 'antes de 40% da rodada, não');
  assert.deepEqual(r.nasce, [true, 10, 1, 12], 'nasce a 40%, fora do toSpawn');
  assert.equal(r.vida, 4, 'vida ×4');
  assert.equal(r.cli[0], 10); assert.ok(Math.abs(r.cli[1] - 1.15) < 1e-6 && Math.abs(r.cli[2] - 1.15) < 1e-6, 'tamanho ×1,15'); assert.ok(r.cli[3], 'a chave aparece');
  assert.ok(r.foge[1] > r.foge[0] + 2, `fugiu: ${r.foge}`); assert.equal(r.foge[2], 0, 'não ataca fugindo');
  assert.ok(r.briga, 'encurralada: briga');
  assert.ok(r.denovo, 'sumiu sem morrer: nasce de novo');
  assert.deepEqual(r.chave, ['chao', 3, 3, null], 'morta: solta a chave onde morreu');
  assert.equal(r.depois, false, 'com a chave no chão, não nasce outra');
  assert.equal(r.semObj, false);
});

test('modelo, foto de rede (tipo 10–13 no cliente), quem entra no meio e sons', { timeout: 120000 }, async () => {
  const r = await rodar(async (T, H) => {
    const { Z } = H, o = {}; H.limpa(); Z.phase = 'round';
    o.mod = [10, 11, 12, 13].map(k => { const g = T.zombieModel(false, k, 77), ud = g.userData; let sk = 0; g.traverse(x => { if (x.isSkinnedMesh) sk++; }); return [sk, g.scale.x, !!ud.ser && !!ud.serBr && !!ud.chave, ud.nums?.length || 0, ud.rachaB?.length || 0, ud.maos?.length || 0]; });
    const zs = [10, 11, 12, 13].map((k, i) => H.um(k, -6 + i * 3, 5)); T.sim(.15);
    o.foto = zs.map(z => { const zc = T.ZC.zs.get(z.id); return [z.kind, zc?.kind, zc && T.zTipoDeF(zc.f), T.zTipoDeF(T.zfTipo(z.kind))]; });
    const zc11 = T.ZC.zs.get(zs[1].id); o.num = zc11.model.userData.nums.filter(b => b.scale.x > .5).length; o.maos = zc11.model.userData.handL.scale.x < .01;
    // quem entra no meio: elite viva e brasas
    zs[0].elite = 1; T.CAMP_ZK2S.elite = zs[0]; T.CAMP_ZK2S.brasas.push({ x: 1, y: 0, z: 2, fim: H.agora() + 2 }); const cp = T.zWorldState().cp; o.cp = [cp.zk2.e[0] === zs[0].id, cp.zk2.b.length];
    T.CAMP_ZK2C.elite.clear(); T.CAMP_ZK2C.brasas.length = 0; T.ZC.zs.get(zs[0].id).zkElite = 0; T.zSyncWorld?.(T.zWorldState());
    o.sync = [T.CAMP_ZK2C.elite.has(zs[0].id), T.CAMP_ZK2C.brasas.length, T.ZC.zs.get(zs[0].id).sz];
    o.som = await T.campSomTeste(['enfermeiro', 'enfBipe', 'seringa', 'dose', 'contidoG', 'contido', 'carvoeiro', 'brasa', 'pregador', 'levanta', 'coro']);
    H.limpa(); return o;
  });
  assert.deepEqual(r.mod.map(m => m[0]), [2, 2, 2, 2], '2 chamadas de desenho por zumbi');
  assert.deepEqual(r.mod.map(m => m[1]), [1, 1.1, 1.05, 1.05]);
  assert.ok(r.mod[0][2]); assert.equal(r.mod[1][3], 4); assert.ok(r.mod[2][4] >= 6); assert.equal(r.mod[3][5], 2);
  assert.deepEqual(r.foto, [[10, 10, 10, 10], [11, 11, 11, 11], [12, 12, 12, 12], [13, 13, 13, 13]]);
  assert.equal(r.num, 1, 'um número nas costas'); assert.ok(r.maos, 'Contido sem mãos');
  assert.deepEqual(r.cp, [true, 1]); assert.equal(r.sync[0], true); assert.equal(r.sync[1], 1); assert.ok(Math.abs(r.sync[2] - 1.15) < 1e-6);
  for (const [k, v] of Object.entries(r.som)) assert.ok(v.fin && !v.err && v.rms > 1e-4, `som ${k}: ${JSON.stringify(v)}`);
  assert.equal(J.erros.length, 0, J.erros.join('\n'));
});
