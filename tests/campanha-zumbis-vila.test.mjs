// O3-D06: zumbis da Vila nos objetivos do mapa (docs/overhaul/campanha.md §6.2–§6.3; refeito em 13/10 para o modo de objetivos):
// Penitente (7), Soldado (8) e Afogado do Veio (9). Confere: os números da tabela (ZKIND, CAMP_ZK, CAMP_RITMO), que cada tipo nasce nos
// objetivos da Vila pela rodada do mapa (estreia, cota, trio, água aberta) e nunca no clássico, que os tipos do Sanatório nunca nascem na
// Vila (nem no infinito depois dos objetivos) e que o Soldado não some quando o teto de especiais enche; a IA de cada um (cal no cone,
// nuvem que cega, capacete, preferência pelo NPC, submerso imune, aviso, agarrão, "longe da água"), a foto de rede (o cliente lê o tipo
// 7–9), as caixas de acerto do submerso, o modelo e os sons.
// Rodar: node --test tests/campanha-zumbis-vila.test.mjs (liga sozinho o modo de objetivos, ZV2_OBJ)
process.env.ZV2_OBJ ||= '1';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'vila', zdiff: 1 }); }, { timeout: 240000 });
after(async () => { await J?.fechar(); });

// cena: jogador parado num ponto (host e cliente), com muita vida, e zumbis limpos
const PREP = `(T => {
  const p = T.S.players.get('h'), Z = T.Z;
  const poe = (x, z) => { p.pos = [x, 0, z]; T.me.pos.set(x, 0, z); T.me.vel.set(0, 0, 0); };
  const passo = (seg, x, z) => { for (let i = 0, k = Math.round(seg * 60); i < k; i++) { if (x !== undefined) poe(x, z); T.sim(1 / 60); } };
  const limpa = () => { for (const z of [...Z.zs.values()]) { Z.zs.delete(z.id); T.broadcast({ t: 'zgone', id: z.id }); } Z.reQ = []; Z.toSpawn = 0; Z.spawnT = 1e12; Z.lure = null; const S_ = T.CAMP_ZKS; S_.nuvens.length = 0; S_.rest = {}; S_.r = Z.round; S_.trio = 0; S_.calN = 0; };
  const vivo = () => { p.alive = true; p.downed = false; p.maxHp = p.hp = 5000; p.dwEnd = 0; p.perks = []; p.zbEnd = 0; };
  // um zumbi do tipo k pela fila de volta (o mesmo caminho do nascimento) e posto em (x, z), parado
  const um = (k, x, z) => { Z.reQ.push([k, 0, 0]); Z.toSpawn++; const id = Z.nextId; if (!T.zSpawnOne()) return null; const zz = Z.zs.get(id); if (x !== undefined) { if (zz.st !== 'rise' || !zz.sub) { zz.st = 'in'; zz.body.pos.y = 0; } zz.body.pos.x = x; zz.body.pos.z = z; } zz.chkT = 1e12; zz.campS = 1; return zz; };
  return { p, Z, poe, passo, limpa, vivo, um };
})`;
const rodar = (fn, a = {}) => J.page.evaluate(([src, arg]) => {
  const T = window.__T, H = (new Function('return ' + arg.PREP)())(T);
  return (new Function('T', 'H', 'arg', `return (${src})(T, H, arg)`))(T, H, arg);
}, [fn.toString(), { PREP, ...a }]);

// volta aos objetivos da Vila (partida nova, etapa I) e abre a porta Praça -> Lago (água para o Afogado)
async function objetivosVila() {
  return rodar((T, H) => {
    T.S.st = { ...T.S.st, zmode: 'campanha' }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    H.vivo(); H.poe(0, 6); T.sim(.5);
    return { on: T.CAMP.on, modo: T.CAMP.modo, et: T.CAMP_ATOS[T.CAMP.et]?.id, mapa: T.S.st.map, round: T.Z.round };
  });
}
const abreLago = () => rodar(T => { T.Z.doors.add('AE'); T.broadcast({ t: 'zdoor', id: 'AE' }); T.zBuildWalk(); T.Z.ffT = 0; T.sim(.2); });
// agenda da Vila fora das rodadas medidas (sem eventos nem cães nelas); devolve a original para restaurar
const semAgenda = rr => rodar((T, H, a) => { const A = T.CAMP_AGENDA.vila, g = {}; for (const r of a.rr) { g[r] = A[r]; delete A[r]; } window.__agVila = g; }, { rr });
const voltaAgenda = () => rodar(T => { Object.assign(T.CAMP_AGENDA.vila, window.__agVila || {}); });

test('tabela: ZKIND 7–9 e CAMP_ZK com os números do §6.2, água da Vila em células andáveis', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, T => {
    const K = T.ZKIND, Z = T.CAMP_ZK, A = T.CAMP_AGUA.vila;
    const andavel = A.filter(([x, z]) => { const c = T.ffCell(x, z); return c >= 0 && T.FF.walk[c]; }).length;
    return { k: [7, 8, 9].map(i => [K[i].n, K[i].hp, K[i].pts, K[i].xp, K[i].sz, K[i].rad, !!K[i].chefe]), len: K.length, buraco: [...K.keys()].filter(i => !(i in K)).length,
      pen: [Z[7].vel, Z[7].cal.alcance, Z[7].cal.aviso, Z[7].cal.cone, Z[7].cal.abre, Z[7].cal.dano, Z[7].cal.olhoS, Z[7].nuvem.r, Z[7].nuvem.s, Z[7].nuvem.lento],
      sol: [Z[8].vel, Z[8].trio], afo: [Z[9].vel, Z[9].sub.vel, Z[9].sub.y, Z[9].sub.aviso, Z[9].sub.avisoR, Z[9].sub.dano, Z[9].sub.lento, Z[9].sub.lentoS],
      mix: [T.CAMP_MIX[7].estreia, T.CAMP_MIX[8].estreia, T.CAMP_MIX[9].estreia], ritmo: T.CAMP_RITMO.vila.estreia, agua: A.length, andavel,
      fala: ['penitente-estreia', 'soldado-estreia', 'afogado-estreia'].every(id => T.CAMP_FALA_TXT[id]?.txt) };
  });
  assert.deepEqual(r.k, [['Penitente', 1.2, 50, 3, 1, .3, false], ['Soldado', 1.5, 60, 4, 1.02, .3, false], ['Afogado do Veio', .9, 50, 3, .95, .3, false]]);
  assert.ok(r.len >= 10, 'ZKIND vai pelo menos até o 9 (D08: 10–13; D09/D11/D13: chefes 14–16)'); assert.equal(r.buraco, 0, 'sem buraco no ZKIND (O3-D09: os tipos que faltam são null)');
  assert.deepEqual(r.pen, [[3.4, 3.8], 4, .6, 3.5, 50, 10, 2.5, 2.5, 4, .5]);
  assert.deepEqual(r.sol, [[3.6, 4.3], 3]);
  assert.deepEqual(r.afo, [[1.3, 1.8], 4.5, -1, .8, 4.5, 25, .5, 1.5]);
  assert.deepEqual(r.mix, [6, 7, 8], 'estreias do infinito antigo'); assert.deepEqual(r.ritmo, { 7: 6, 8: 7, 9: 8 }, 'estreias nos objetivos da Vila (rodada do mapa)');
  assert.ok(r.agua >= 20 && r.andavel === r.agua, `pontos de água fora do chão andável: ${r.andavel}/${r.agua}`);
  assert.ok(r.fala, 'legenda da estreia');
});

test('clássico: os tipos 7–9 nunca nascem (rodadas 6 a 12 inteiras), o campTipo devolve o mesmo', { timeout: 120000 }, async () => {
  const r = await rodar((T, H) => {
    T.S.st = { ...T.S.st, zmode: 'classico' }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    const { Z } = H; const vistos = new Set(); let n = 0;
    for (let r = 6; r <= 12; r++) {
      H.limpa(); Z.round = r - 1; Z.phase = 'break'; Z.nextDog = 99; T.zStartRound();
      for (let i = 0; i < 80 && Z.toSpawn > 0; i++) { const id = Z.nextId; if (T.zSpawnOne()) { const z = Z.zs.get(id); vistos.add(z.kind); n++; Z.zs.delete(id); } }
    }
    H.limpa();
    return { on: T.CAMP.on, vistos: [...vistos].sort(), n, tipo: [0, 1, 7, 9].map(k => T.campTipo(k)) };
  });
  assert.equal(r.on, false);
  assert.ok(r.n > 100, 'nasceu pouco no cenário');
  assert.ok(r.vistos.every(k => k <= 6 || k === 17), `tipo novo no clássico: ${r.vistos}`); // 17: o Tanque é do clássico (13/10)
  assert.deepEqual(r.tipo, [0, 1, 7, 9]);
});

test('objetivos da Vila: estreia de cada tipo pela rodada do mapa (só 1 / 1 trio), trio no mesmo ponto, Afogado na água, cota sem mexer na mistura do clássico, legenda', { timeout: 300000 }, async () => {
  const c = await objetivosVila();
  assert.deepEqual([c.on, c.modo, c.mapa, c.et], [true, 'campanha', 'vila', 'I']); assert.ok(c.round <= 1, 'a Vila começa na rodada 1');
  await abreLago(); await semAgenda([6, 7, 8, 9]);
  const r = await rodar((T, H) => {
    const { Z } = H, out = {};
    for (const r of [6, 7, 8, 9]) {
      H.limpa(); Z.round = r - 1; Z.phase = 'break'; Z.dogRound = false; T.zStartRound(); Z.dogRound = false;
      const mixN0 = Z.mixN, mix0 = Z.mix.slice(0, 7), tot = Z.toSpawn, nasc = [];
      for (let i = 0; i < 200 && Z.toSpawn > 0; i++) { const id = Z.nextId; if (T.zSpawnOne()) { const z = Z.zs.get(id); nasc.push({ k: z.kind, st: z.st, y: z.body.pos.y, x: z.body.pos.x, z: z.body.pos.z, win: z.win, hp: z.hp, sp: z.speed, sc: z.sc, sub: z.sub || 0, cap: z.capacete || 0 }); } }
      const cont = {}; for (const z of nasc) cont[z.k] = (cont[z.k] || 0) + 1;
      out[r] = { tot, cont, mixN0, mixN1: Z.mixN, mix0, mix1: Z.mix.slice(0, 7), nasc: nasc.filter(z => z.k >= 7), hpComum: Math.round(T.zHp(r) * 1) };
    }
    out.falas = Object.keys(T.CAMP.falaT); // campFala: o limitador guarda quem falou
    // Névoa (O3-D05, campEvPeso): a cota do Afogado dobra; Estouro (só Veloz): nenhum tipo novo
    if (T.CAMP_EVS) { const S_ = T.CAMP_ZKS, cota = id => { T.CAMP_EVS.id = id; Z.round = 9; Z.toSpawn = 60; Z.mixN = 0; S_.r = -1; T.campZkCotas(); return { ...S_.rest }; };
      out.nevoa = [cota(null)[9], cota('nevoa')[9]]; out.estouro = cota('estouro'); T.CAMP_EVS.id = null; S_.r = Z.round; S_.rest = {}; Z.toSpawn = 0; }
    out.vistos = [...T.CAMP_ZKS.vistos]; out.et = T.CAMP_ATOS[T.CAMP.et]?.id;
    H.limpa();
    return out;
  });
  await voltaAgenda();
  assert.equal(r.et, 'I', 'os tipos estreiam pela rodada, mesmo com o time ainda na primeira etapa');
  // estreia: rodada 6 só 1 Penitente; 7: 1 trio de Soldados; 8: Afogados (na água); 9: todos
  assert.equal(r[6].cont[7], 1, 'Penitente na estreia: 1'); assert.ok(!r[6].cont[8] && !r[6].cont[9]);
  assert.equal(r[7].cont[8], 3, 'Soldado na estreia: 1 trio'); assert.ok(r[7].cont[7] >= 1);
  const trio = r[7].nasc.filter(z => z.k === 8); assert.ok(trio.every(z => z.win === trio[0].win), 'trio do mesmo ponto');
  if (trio[0].win < 0) assert.ok(trio.every(z => Math.hypot(z.x - trio[0].x, z.z - trio[0].z) < 3), 'trio do mesmo riser');
  assert.equal(r[8].cont[9], 1, 'Afogado na estreia: 1');
  assert.ok(r[9].cont[9] >= 1 && r[9].cont[8] % 3 === 0 && r[9].cont[8] >= 3 && r[9].cont[7] >= 1, JSON.stringify(r[9].cont));
  for (const rr of [6, 7, 8, 9]) { assert.equal(r[rr].mixN1, 0, `rodada ${rr}: os especiais do clássico saíram todos`); assert.equal(Object.values(r[rr].cont).reduce((a, b) => a + b, 0), r[rr].tot); }
  const esp = rr => Object.entries(r[rr].cont).filter(([k]) => +k > 0 && +k !== 6).reduce((a, [, v]) => a + v, 0);
  for (const rr of [6, 7, 8, 9]) assert.ok(esp(rr) <= Math.floor(r[rr].tot * .5), `teto de especiais na rodada ${rr}: ${esp(rr)} de ${r[rr].tot} ${JSON.stringify(r[rr].cont)} mixN0 ${r[rr].mixN0}`);
  // números: vida = comum × vidaK (CAMP_CURVA.vila: 1 a partir da rodada 6) × ZKIND.hp; velocidade da tabela; Afogado submerso ('rise', y -1)
  for (const z of r[9].nasc.filter(z => z.k >= 7 && z.k <= 9)) { // os tipos da Vila (o Tanque, 17, é do clássico)
    const hp = Math.round(Math.round(r[9].hpComum) * { 7: 1.2, 8: 1.5, 9: .9 }[z.k]);
    assert.ok(Math.abs(z.hp - hp) <= 1, `vida do tipo ${z.k}: ${z.hp} x ${hp}`);
    if (z.k === 7) assert.ok(z.sp >= 3.4 && z.sp <= 3.8 && z.sc === 1);
    if (z.k === 8) assert.ok(z.sp >= 3.6 && z.sp <= 4.3 && z.sc === 1 && z.cap === 1);
    if (z.k === 9) assert.ok(z.st === 'rise' && z.y === -1 && z.sub === 1 && z.sp >= 1.3 && z.sp <= 1.8);
  }
  assert.ok(r[8].nasc.filter(z => z.k === 9).every(z => z.x > 0 && z.x < 24 && z.z > 22 && z.z < 42), 'Afogado nasce na margem do Lago');
  assert.deepEqual(r.vistos.sort(), [7, 8, 9]);
  assert.ok(['penitente', 'soldado', 'afogado'].every(id => r.falas.includes(id)), `legendas: ${r.falas}`);
  if (r.nevoa) { assert.ok(r.nevoa[1] > r.nevoa[0] && r.nevoa[1] <= 2 * r.nevoa[0] + 1 /* arredondamento das cotas */, `Névoa: Afogado com peso ×2, dentro do teto de especiais (${r.nevoa})`); assert.deepEqual(r.estouro, {}, 'Estouro: só Veloz'); }
});

test('Afogado só com água aberta (a cota não fica presa), tipos do Sanatório nunca na Vila, Soldado com 1 trio mesmo com o teto cheio (também no infinito)', { timeout: 300000 }, async () => {
  await objetivosVila(); await semAgenda([9, 12, 20]);
  const r = await rodar((T, H) => {
    const { Z } = H, S_ = T.CAMP_ZKS, o = {};
    const rodada = (r, nasce) => { H.limpa(); S_.r = -1; if (T.CAMP_ZK2S) T.CAMP_ZK2S.garR = -1; Z.round = r - 1; Z.phase = 'break'; Z.dogRound = false; Z.nextDog = Z.nextBoss = 1e9; T.zStartRound(); Z.dogRound = false; Z.spawnT = 1e12;
      const cont = {}; let rest = null; for (let i = 0; i < 400 && Z.toSpawn > 0; i++) { const id = Z.nextId; if (!T.zSpawnOne()) continue; if (!rest) rest = { ...S_.rest }; const z = Z.zs.get(id); if (!nasce) { Z.zs.delete(id); } cont[z.kind] = (cont[z.kind] || 0) + 1; if (nasce) Z.zs.delete(id); }
      return { cont, rest, n: Object.values(cont).reduce((a, b) => a + b, 0) }; };
    o.fechado = rodada(9); // só a área inicial aberta: nenhuma água
    T.Z.doors.add('AE'); T.broadcast({ t: 'zdoor', id: 'AE' }); T.zBuildWalk(); T.Z.ffT = 0;
    o.aberto = rodada(9);
    o.r20 = rodada(20);
    const et = T.CAMP.et; T.CAMP.modo = 'infinito'; T.CAMP.et = -1; // o infinito depois dos objetivos (as regras de rodada; a troca é do teste de eventos)
    o.inf12 = rodada(12); o.inf20 = rodada(20);
    T.CAMP.modo = 'campanha'; T.CAMP.et = et; H.limpa();
    return o;
  });
  await voltaAgenda();
  assert.ok(!r.fechado.rest?.[9] && !r.fechado.cont[9], `sem água aberta: nenhum Afogado na cota (${JSON.stringify(r.fechado.rest)})`);
  assert.ok(r.aberto.cont[9] >= 1, `com o Lago aberto: Afogado (${JSON.stringify(r.aberto.cont)})`);
  for (const k of ['r20', 'inf12', 'inf20']) {
    const c = r[k].cont;
    assert.ok([10, 11, 12, 13].every(t => !c[t]), `${k}: tipo do Sanatório na Vila ${JSON.stringify(c)}`);
    assert.ok(c[8] >= 3 && c[8] % 3 === 0, `${k}: Soldado em trio (${JSON.stringify(c)})`);
    assert.ok(c[7] >= 1 && c[9] >= 1, `${k}: Penitente e Afogado (${JSON.stringify(c)})`);
    const esp = Object.entries(c).filter(([t]) => +t > 0 && +t !== 6).reduce((a, [, v]) => a + v, 0);
    assert.ok(esp <= Math.floor(r[k].n * .5) + 1, `${k}: teto de especiais (${esp} de ${r[k].n})`);
  }
});

test('Penitente: aviso de 0,6 s (balde, sc 3), cal no cone (10 de dano + tela branca), fora do cone nada; nuvem da morte cega e atrasa', { timeout: 120000 }, async () => {
  const r = await rodar((T, H) => {
    const { Z, p } = H, o = {}; H.limpa(); H.vivo(); Z.phase = 'round'; H.poe(0, 6); T.sim(.1);
    const z = H.um(7, 0, 9.2); z.speed = 0; z.yaw = 0; z.atkT = 1e12; // de frente para o jogador (-z), 3,2 m
    const hp0 = p.hp; T.sim(1 / 60); H.poe(0, 6);
    o.aviso = [!!z.calA, z.sc, z.atkWind > 0, Math.round((z.calA - window.__simNow) * 100) / 100];
    const zc = () => T.ZC.zs.get(z.id); H.passo(.1, 0, 6); o.cli = [zc()?.kind, zc() && (zc().f & 3), zc() && !!(zc().f & 4)];
    H.passo(.3, 0, 6); o.antes = hp0 - p.hp; H.passo(.35, 0, 6); o.dano = hp0 - p.hp; o.olho = T.CAMP_ZKC.calAte > window.__simNow; o.depois = [z.calA, z.sc];
    // fora do cone: jogador ao lado (90°), cal não pega
    z.calCd = 0; z.sc = 1; const hp1 = p.hp; H.poe(0, 6); T.sim(1 / 60); const lado = !!z.calA; H.passo(.8, 3.2, 9.2); o.lado = [lado, hp1 - p.hp];
    // morte: nuvem de cal; zumbi comum dentro perde o alvo e anda a ×0,5; fora volta
    const c = H.um(0, 1, 9.2); c.st = 'in'; const v0 = c.cv || 1;
    T.zHit(p, z.id, 1e6, 'body', 'm1911', false); o.nuvem = T.CAMP_ZKS.nuvens.length; o.nuvemCli = T.CAMP_ZKC.nuvens.length;
    T.sim(1 / 30); o.dentro = [c.tgt, c.cv / v0, c.calIn];
    c.body.pos.x = 8; T.sim(1 / 30); o.fora = [c.cv / v0, c.calIn];
    H.passo(4.2, 0, 6); o.some = T.CAMP_ZKS.nuvens.length;
    H.limpa(); return o;
  });
  assert.deepEqual(r.aviso.slice(0, 3), [true, 3, true]); assert.ok(Math.abs(r.aviso[3] - .6) < .03, `aviso ${r.aviso[3]}`);
  assert.deepEqual(r.cli, [7, 3, true], 'o cliente vê o aviso (sc 3 + bit 4)');
  assert.equal(r.antes, 0, 'nada antes do fim do aviso'); assert.equal(r.dano, 10, 'cal: 10 no Normal'); assert.ok(r.olho, 'tela branca no cliente');
  assert.deepEqual(r.depois, [0, 1]);
  assert.deepEqual(r.lado, [true, 0], 'saiu do cone de 50° durante o aviso: nada');
  assert.equal(r.nuvem, 1); assert.equal(r.nuvemCli, 1);
  assert.deepEqual(r.dentro, [null, .5, 1]); assert.deepEqual(r.fora, [1, 0]); assert.equal(r.some, 0, 'nuvem dura 4 s');
});

test('Soldado: capacete segura o 1º tiro na cabeça (e voa no cliente), o 2º vale inteiro; prefere o NPC e o jogador marcado', { timeout: 120000 }, async () => {
  const r = await rodar((T, H) => {
    const { Z, p } = H, o = {}; H.limpa(); H.vivo(); Z.phase = 'round'; H.poe(0, 6); T.sim(.1);
    const z = H.um(8, 0, 12); z.speed = 0; z.hp = z.maxHp = 10000; T.sim(.1);
    const wh = T.W.m1911.head || 4, d = Math.round(T.W.m1911.dmg * wh);
    T.sendToHost({ t: 'zhit', v: z.id, w: 'm1911', dmg: d, z: 'head' }); o.h1 = 10000 - z.hp; o.cap = z.capacete;
    const zc = T.ZC.zs.get(z.id); o.osso = zc.model.userData.capacete.scale.x < .01; o.voa = T.CAMP_ZKC.caps.some(c => c.g.visible);
    T.sim(.6); const h = z.hp; T.sendToHost({ t: 'zhit', v: z.id, w: 'm1911', dmg: d, z: 'head' }); o.h2 = h - z.hp; o.esp = [d, d / wh];
    // NPC: alvo falso perto -> o Soldado vai nele; jogador marcado -> vai nele mesmo mais longe
    const a = { campAlvo: 1, pos: [2, 0, 14], alive: true, hp: 600, maxHp: 600, r: .4, atrai: 0, atraiR: 0, lastHit: 0 };
    T.CAMP.npc = { a }; z.tgt = p; T.CAMP_IA[8](z, 1 / 60, p); o.npc = z.tgt === a; T.CAMP.npc = null;
    const q2 = { id: 'x', alive: true, downed: false, pos: [0, 0, 30], campMarca: window.__simNow + 5 }; T.S.players.set('x', q2); z.tgt = p; T.CAMP_IA[8](z, 1 / 60, p); o.marca = z.tgt === q2; T.S.players.delete('x');
    z.tgt = p; T.CAMP_IA[8](z, 1 / 60, p); o.nada = z.tgt === p;
    H.limpa(); return o;
  });
  assert.equal(r.cap, 0); assert.ok(Math.abs(r.h1 - r.esp[1]) < 1.5, `1º tiro na cabeça sem multiplicador: ${r.h1} x ${r.esp[1]}`);
  assert.ok(r.osso && r.voa, 'capacete some do modelo e voa');
  assert.equal(r.h2, r.esp[0], '2º tiro na cabeça inteiro');
  assert.ok(r.npc, 'prefere o NPC'); assert.ok(r.marca, 'prefere o jogador marcado'); assert.ok(r.nada, 'sem NPC nem marcado: o alvo do clássico');
});

test('Afogado: submerso imune (tiro recusado sem pontos, explosão fere), anda a 4,5 m/s, aviso de 0,8 s a 4,5 m, sai e agarra (25 e ×0,5)', { timeout: 120000 }, async () => {
  const r = await rodar((T, H) => {
    const { Z, p } = H, o = {}; H.limpa(); H.vivo(); Z.phase = 'round'; H.poe(12, 18); T.sim(.1);
    const z = H.um(9); o.nasce = [z.st, z.sub, z.body.pos.y, Math.round(z.body.pos.x), Math.round(z.body.pos.z)];
    z.body.pos.set(12, -1, 24.5); z.aguaX = 12; z.aguaZ = 25.3; z.hp = z.maxHp = 3000; T.sim(.1);
    // tiro: recusado, sem pontos; o cliente não tem caixa
    const m0 = p.money; T.sendToHost({ t: 'zhit', v: z.id, w: 'm1911', dmg: 100, z: 'body' }); o.tiro = [3000 - z.hp, p.money - m0];
    const zc = T.ZC.zs.get(z.id); o.cli = [zc.kind, !!(zc.f & 64), T.zBoxes(zc)[0][1].maxY < -50, T.campBoxes(zc) !== null];
    T.zExplode(z.body.pos.clone().setY(0.2), 'h', 6, 500, 'he'); o.granada = 3000 - z.hp > 0;
    // velocidade submerso: 1 s em direção ao jogador (longe: 12,18 -> está a ~6,5 m)
    H.poe(12, 4); z.body.pos.set(12, -1, 24); T.sim(1 / 60); let dd = 0, ux = z.body.pos.x, uz = z.body.pos.z; for (let i = 0; i < 30; i++) { H.passo(1 / 60, 12, 4); dd += Math.hypot(z.body.pos.x - ux, z.body.pos.z - uz); ux = z.body.pos.x; uz = z.body.pos.z; } o.vel = dd / .5;
    // aviso a 4,5 m: chega perto, avisa (sc 3 + bit 4), sai e agarra
    H.poe(12, 17); z.body.pos.set(12, -1, 23); z.sub = 1; z.subChk = 1e12; const hp0 = p.hp;
    let t = 0; while (z.sub === 1 && t < 3) { H.passo(1 / 60, 12, 17); t += 1 / 60; }
    o.aviso = [z.sub, z.sc, z.atkWind > 0, Math.round(Math.hypot(z.body.pos.x - 12, z.body.pos.z - 17) * 10) / 10];
    const zc2 = T.ZC.zs.get(z.id); H.passo(.05, 12, 17); o.avisoCli = [zc2.f & 3, !!(zc2.f & 4), !!(zc2.f & 64)];
    H.passo(.6, 12, 17); o.durante = hp0 - p.hp; H.passo(.6, 12, 17);
    o.sai = [z.sub, z.st, z.body.pos.y, hp0 - p.hp, !!T.CAMP_ZKC.agarra, T.CAMP_ZKC.agarra?.v, Math.round(z.speed * 10) / 10];
    // fora da água (longe demais): sai sem agarrar
    const y = H.um(9); y.body.pos.set(12, -1, 25); y.aguaX = 12; y.aguaZ = 25.3; y.subChk = 1e12; H.poe(6, 4); p.hp = p.maxHp; const hp1 = p.hp, lh = p.lastHurt; T.CAMP_ZKC.agarra = null;
    let u = 0; while (y.sub && u < 8) { H.passo(1 / 30, 6, 4); u += 1 / 30; }
    o.longe = [y.sub, y.st, Math.round(Math.hypot(y.body.pos.x - 12, y.body.pos.z - 25.3)), p.lastHurt === lh ? 0 : hp1 - p.hp];
    H.limpa(); return o;
  });
  assert.equal(r.nasce[0], 'rise'); assert.equal(r.nasce[1], 1); assert.equal(r.nasce[2], -1);
  assert.deepEqual(r.tiro, [0, 0], 'tiro na água: nada, sem pontos');
  assert.deepEqual(r.cli, [9, true, true, true], 'cliente: tipo 9, submerso, sem caixa de acerto');
  assert.ok(r.granada, 'granada na água fere');
  assert.ok(Math.abs(r.vel - 4.5) < .35, `velocidade submerso ${r.vel}`);
  assert.equal(r.aviso[0], 2); assert.equal(r.aviso[1], 3); assert.ok(r.aviso[2]); assert.ok(r.aviso[3] <= 4.6 && r.aviso[3] >= 3.8, `aviso a ${r.aviso[3]} m`);
  assert.deepEqual(r.avisoCli, [3, true, true]);
  assert.equal(r.durante, 0, 'nada durante o aviso');
  assert.deepEqual(r.sai.slice(0, 2), [0, 'in']); assert.ok(Math.abs(r.sai[2]) < .05, `fora d'água no chão: ${r.sai[2]}`); assert.equal(r.sai[3], 25, 'agarrão: 25'); assert.ok(r.sai[4]); assert.equal(r.sai[5], .5);
  assert.ok(r.sai[6] >= 1.3 && r.sai[6] <= 1.8, 'fora d\'água anda como comum lento');
  assert.deepEqual(r.longe.slice(0, 2), [0, 'in']); assert.ok(r.longe[2] >= 13 && r.longe[2] <= 16, `saiu a ${r.longe[2]} m da água`); assert.equal(r.longe[3], 0, 'longe: sai sem agarrar');
});

test('modelo, foto de rede (tipo 7–9 no cliente), quem entra no meio e sons', { timeout: 120000 }, async () => {
  const r = await rodar(async (T, H) => {
    const { Z } = H, o = {}; H.limpa(); Z.phase = 'round';
    o.mod = [7, 8, 9].map(k => { const g = T.zombieModel(false, k, 77), ud = g.userData; let sk = 0; g.traverse(x => { if (x.isSkinnedMesh) sk++; }); return [sk, !!ud.balde, !!ud.capacete, g.scale.x]; });
    const ids = [7, 8, 9].map(k => H.um(k, 3 + k, 8)); T.sim(.15);
    o.foto = ids.map(z => { const zc = T.ZC.zs.get(z.id); return [z.kind, zc?.kind, zc && T.zTipoDeF(zc.f)]; });
    ids[1].capacete = 0; T.CAMP_ZKS.nuvens.push({ x: 1, z: 2, fim: window.__simNow + 3 }); const cp = T.zWorldState().cp;
    o.cp = [cp.zk.c.includes(ids[1].id), cp.zk.n.length];
    T.CAMP_ZKC.semCap.clear(); T.CAMP_ZKC.nuvens.length = 0; T.zSyncWorld?.(T.zWorldState()); o.sync = [T.CAMP_ZKC.semCap.has(ids[1].id), T.CAMP_ZKC.nuvens.length];
    o.som = await T.campSomTeste(['penitente', 'capacete', 'bolhas', 'afogado']);
    H.limpa(); return o;
  });
  assert.deepEqual(r.mod.map(m => m[0]), [2, 2, 2], '2 chamadas de desenho por zumbi');
  assert.ok(r.mod[0][1] && r.mod[1][2]); assert.deepEqual(r.mod.map(m => m[3]), [1, 1.02, .95]);
  assert.deepEqual(r.foto, [[7, 7, 7], [8, 8, 8], [9, 9, 9]]);
  assert.deepEqual(r.cp, [true, 1]); assert.deepEqual(r.sync, [true, 1]);
  for (const [k, v] of Object.entries(r.som)) assert.ok(v.fin && !v.err && v.rms > 1e-4, `som ${k}: ${JSON.stringify(v)}`);
  assert.equal(J.erros.length, 0, J.erros.join('\n'));
});
