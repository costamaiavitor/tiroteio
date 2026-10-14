// O Vigia (tipo 14, Tenente Brandão) como último objetivo da Vila (etapa C1, objetivo C1.1 'matar'), lutando na própria Vila na
// versão de campo (decisão do dono, 13/10: as arenas saem do modo zumbi). Cobre: a passagem real II -> C1 (II.4 feito -> no intervalo a
// etapa C1 começa -> o Vigia nasce na rodada seguinte), a rodada do chefe (comuns da curva, sem especiais, sem cães nem Carniceiro da
// agenda), o nascimento em lugar alcançável perto de um jogador, cada ataque com aviso antes do dano no mapa aberto (varredura marca,
// rajada com cobertura de parede, granada de cal, baioneta que atordoa na parede, pelotão perto dos jogadores com teto), as fases sem a
// torre e sem o apagão, o ponto fraco, as telas do cliente fora da arena (marca, 3 tiros da rajada), a barra do chefe, quem entra no
// meio, e a morte: recompensa, objetivo feito, "OBJETIVOS CONCLUÍDOS" e as rodadas infinitas com a escalada.
// O que era só da arena Forte Velho (torre do holofote, apagão, cone, gerador 'curto', arame farpado, 16 comuns pelos portões, troca de
// mapa com bagagem) saiu do jogo na limpeza A8 (docs/zumbi-v2/limpeza.md): aqui só se confere que não existe mais.
// Rodar: ZV2_OBJ=1 node --test --test-concurrency=1 tests/campanha-vigia.test.mjs (o arquivo liga o ZV2_OBJ sozinho)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
process.env.ZV2_OBJ ||= '1'; // objetivos do mapa (sem o __semObjetivos dos testes antigos)
const { abrirJogo, criarSala } = await import('./_jogo.mjs');

let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'vila', zdiff: 1 }); }, { timeout: 240000 });
after(async () => { await J?.fechar(); });

const PREP = `(T => {
  const p = T.S.players.get('h'), CH = T.CAMP_CH, agora = () => window.__simNow;
  const poe = (q, x, z, y = 0) => { q.pos = [x, y, z]; if (q === p) { T.me.pos.set(x, y, z); T.me.vel.set(0, 0, 0); } };
  const quieto = () => { const z = CH.z; T.Z.reQ = []; if (z) { z.speed = 0; z.atkT = 1e12; z.chkT = 1e12; } CH.prox = 1e12; T.VGSRV.pelT = 1e12; T.Z.spawnT = 1e12; T.Z.toSpawn = Math.max(T.Z.toSpawn, 5); for (const o of [...T.Z.zs.values()]) if (o !== z) T.Z.zs.delete(o.id); };
  const atk = id => CH.def.ataques.find(a => a.id === id);
  const limpa = () => { if (CH.atk) { CH.atk = null; T.broadcast({ t: 'camp', k: 'telx' }); } };
  const livre = (x, z) => { const c = T.ffCell(x, z); return c >= 0 && !!T.FF.walk[c] && isFinite(T.FF.dist[c]) && T.footFreeR(x, z, .6) && T.zActive().has(T.zRoomAt(x, z)); }; // chão andável, alcançável, numa sala aberta
  const ve = (a, b, ya = 1.4, yb = 1.4) => T.losClear(new T.V3(a[0], ya, a[1]), new T.V3(b[0], yb, b[1]));
  const reto = (a, b) => ve(a, b) && T.segClearR(a[0], a[1], b[0], b[1]);
  // um lugar aberto da Vila em volta do ponto de partida: o chefe em B, com chão livre e linha reta para os pontos pedidos (dx, dz)
  // (antes, o jogador volta ao ponto de partida e o campo de fluxo dos zumbis é refeito: 'livre' pede distância finita até ele)
  const aberto = (difs) => { const s = [-2.5, 6]; poe(p, s[0], s[1]); T.sim(.4);
    for (let r = 0; r < 40; r += 2) for (let a = 0; a < 16; a++) { const B = [s[0] + Math.cos(a * Math.PI / 8) * r, s[1] + Math.sin(a * Math.PI / 8) * r]; if (!livre(...B)) continue;
      if (difs.every(([dx, dz]) => { const Q = [B[0] + dx, B[1] + dz]; return livre(...Q) && reto(B, Q); })) return B; }
    return null; };
  const tel = () => T.CAMP.c.tel[T.CAMP.c.tel.length - 1];
  const ateRodada = () => { for (let k = 0; k < 400 && T.Z.phase !== 'round'; k++) T.sim(.25); };
  const fimRodada = () => { T.Z.zs.clear(); T.Z.reQ = []; T.Z.toSpawn = 0; for (let k = 0; k < 40 && T.Z.phase === 'round'; k++) T.sim(.1); };
  return { p, CH, agora, poe, quieto, atk, limpa, livre, ve, reto, aberto, tel, ateRodada, fimRodada };
})`;
const em = fn => `(T, arg) => { const H = (new Function('return ' + arg.PREP)())(T); return (${fn})(T, arg, H); }`;
const rodar = (fn, a = {}) => J.page.evaluate(([src, arg]) => (new Function('T', 'arg', `return (${src})(T, arg)`))(window.__T, arg), [em(fn.toString()), { PREP, ...a }]);

test('Vila: I -> II -> C1; II.4 feito -> a etapa C1 começa no intervalo e o Vigia nasce na rodada seguinte (sem cães, Carniceiro nem especiais da agenda)', { timeout: 300000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, livre } = H; p.dwEnd = 1e12; p.hp = p.maxHp = 1e6;
    const o = { cadeia: T.CAMP.cadeia.map(e => T.CAMP_ATOS[e].id), et0: T.CAMP_ATOS[T.CAMP.et].id, modo: T.CAMP.modo, c1: [T.CAMP_ATOS[2].mapa, T.CAMP_ATOS[2].objs.join()] };
    H.fimRodada(); H.ateRodada(); // rodada 2
    T.CAMP.etR = T.Z.round; T.campEtapaPrepara(1, false); // Ato II (os objetivos de verdade são do outro bloco: aqui só a cadeia)
    for (const id of ['II.1', 'II.2', 'II.3', 'II.4']) T.campForca(id);
    o.ii = Object.values(T.CAMP.obj).every(O => O.st === 'feito'); o.etII = T.CAMP.et;
    T.Z.round = 12; // a próxima (13) é de Carniceiro e evento na agenda; a 14, de cães
    H.fimRodada(); o.ph = T.Z.phase; o.et = T.CAMP_ATOS[T.CAMP.et]?.id; o.obj = T.campEstado().obj['C1.1']?.st; o.nd = [T.Z.nextDog, T.Z.nextBoss];
    o.chAntes = !!CH.z;
    H.ateRodada(); o.round = T.Z.round; o.dog = !!T.Z.dogRound; o.boss = T.Z.bossQ; o.ev = T.CAMP_EVS.id;
    o.ts = T.Z.toSpawn + [...T.Z.zs.values()].filter(x => !T.ZKIND[x.kind]?.chefe).length; o.mixN = T.Z.mixN; o.espTs = (() => { const K = T.campCurva(T.Z.round), D = T.zDf(), np = Math.max(1, T.S.players.size), b = T.zCount(T.Z.round, np) * D.cnt * K.qtdK; return Math.max(1, Math.round(Math.min(b, Math.max(b * K.chefe, K.chefeMin * D.cnt * (1 + .25 * (np - 1)))))); })(); // a curva do mapa na rodada do chefe (CAMP_CURVA: fração com piso)
    T.sim(1); const z = CH.z; o.k = z?.kind; o.campo = CH.campo; o.encerra = CH.encerra;
    if (z) { const P = z.body.pos, d = Math.min(...[...T.S.players.values()].map(q => Math.hypot(q.pos[0] - P.x, q.pos[2] - P.z)));
      o.nasce = { livre: livre(P.x, P.z), d: +d.toFixed(1) }; o.hp = z.maxHp; T.sim(3); o.nasce.y = +P.y.toFixed(2); o.nasce.st = z.st; }
    o.esp = Math.round(T.zHp(T.Z.round) * T.zHpK(T.Z.round) * 10 * T.ZBAL.chefes.vidaK); // vida da rodada em que ele entra (vidaAtual, 13/10)
    o.cli = T.CAMP.c.ch && [T.CAMP.c.ch.k, T.CAMP.c.ch.f, T.CAMP.c.ch.campo]; o.bar = document.getElementById('zboss').firstChild.nodeValue;
    o.arena = [T.ZD.zint.some(x => x.t === 'curto'), 'forte' in T.MAPS || 'curto' in T.ZINT || typeof T.FORTE !== 'undefined', T.S.st.map];
    return o;
  });
  assert.deepEqual(r.cadeia, ['I', 'II', 'C1']); assert.equal(r.et0, 'I'); assert.equal(r.modo, 'campanha'); assert.deepEqual(r.c1, ['vila', 'C1.1']);
  assert.ok(r.ii); assert.notEqual(r.ph, 'round'); assert.equal(r.et, 'C1', 'no intervalo a etapa C1 começa'); assert.equal(r.obj, 'ativo'); assert.equal(r.chAntes, false, 'nada de chefe no intervalo');
  assert.deepEqual(r.nd, [1e9, 1e9], 'sem cães nem Carniceiro da agenda na etapa do Vigia');
  assert.equal(r.round, 13); assert.equal(r.dog, false); assert.equal(r.boss, 0); assert.equal(r.ev, null, 'sem evento na rodada do chefe');
  assert.equal(r.ts, r.espTs, 'comuns da etapa de chefe pela curva do mapa (fração da rodada com piso) ' + JSON.stringify(r)); assert.ok(r.ts >= 8 && r.ts < 47, 'metade da rodada 13, acima do piso da Vila'); assert.equal(r.mixN, 0, 'sem especiais na rodada do chefe');
  assert.equal(r.k, 14); assert.equal(r.campo, true, 'versão de campo'); assert.equal(r.encerra, true, 'a rodada acaba quando ele morre');
  assert.ok(r.nasce.livre, 'nasce em chão andável, alcançável, numa sala aberta ' + JSON.stringify(r.nasce)); assert.ok(Math.abs(r.nasce.y) < .3, JSON.stringify(r));
  assert.ok(r.nasce.d >= 8 && r.nasce.d <= 17, 'perto de um jogador (9 a 16 m) ' + JSON.stringify(r.nasce));
  assert.equal(r.hp, r.esp, 'vida = zHp(rodada em que entra)·(6 + 4·1)');
  assert.deepEqual(r.cli, [14, 1, true]); assert.equal(r.bar, 'O VIGIA · FASE 1', 'barra do chefe no cliente');
  assert.deepEqual(r.arena, [false, false, 'vila'], 'nada da arena na Vila');
  assert.deepEqual(J.erros, []);
});

test('ataques no mapa aberto, com aviso antes do dano: varredura marca (e a tela da marca aparece fora da arena), rajada (3 tiros no cliente; a parede cobre), granada de cal', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, atk, limpa, tel, livre, ve } = H; quieto(); limpa(); const z = CH.z; z.st = 'in'; CH.inv = 0; p.hp = p.maxHp = 1000; p.dwEnd = 0; p.campMarca = 0; p.crouch = 0;
    const B = H.aberto([[0, 8]]); if (!B) return { semLugar: 1 }; const o = {};
    z.body.pos.set(B[0], 0, B[1]); poe(p, B[0], B[1] + 8);
    // varredura: o setor passa pelo jogador; marca depois de 0,3 s dentro
    T.CAMP.c.tel = []; T.campChefeAtaca(z, atk('varredura'), p); T.sim(1 / 60); o.tv = { s: tel().s, f: tel().f, g: tel().g };
    T.sim(.9); o.marcaAviso = p.campMarca > agora(); T.sim(2.6); o.marca = p.campMarca > agora(); o.alvo = T.vgAlvo(z) === p;
    const el = document.getElementById('vgMarca'); o.tela = el ? [el.parentElement?.id, +el.style.opacity > .4] : null;
    limpa(); p.campMarca = 0; T.VGCLI.marcaFim = 0; T.sim(.1); o.telaSome = el ? el.style.opacity : null;
    // rajada: 22 × 3 no Normal, só depois de 0,8 s; no cliente, os 3 tiros (fora do forteAnim)
    poe(p, B[0], B[1] + 8); const h0 = p.hp; T.campChefeAtaca(z, atk('rajada'), p); T.sim(1 / 60); const t = tel(); o.tr = t.s; T.sim(.73); o.antes = h0 - p.hp; T.sim(.6); o.rajada = h0 - p.hp; o.fraco = z.fracoAte > agora(); T.sim(.1); o.tiros = t.vgN;
    T.sim(1.5); limpa();
    // atrás de uma parede (sem linha do peito à boca do fuzil), dentro do alcance: não leva
    let C = null; for (let rr = 4; rr <= 24 && !C; rr += 1) for (let a = 0; a < 24 && !C; a++) { const Q = [B[0] + Math.cos(a * Math.PI / 12) * rr, B[1] + Math.sin(a * Math.PI / 12) * rr]; if (livre(...Q) && !ve(B, Q, 1.2, 1.3)) C = Q; }
    o.temParede = !!C;
    if (C) { poe(p, C[0], C[1]); const h1 = p.hp; T.campChefeAtaca(z, atk('rajada'), p); T.sim(1.5); o.coberto = h1 - p.hp; limpa(); T.sim(1.5); }
    // granada de cal: disco no alvo (35) e a cal nos olhos
    poe(p, B[0], B[1] + 8); const h2 = p.hp; T.campChefeAtaca(z, atk('granada'), p); T.sim(1 / 60); o.tg = tel().s; T.sim(1.1); o.gAntes = h2 - p.hp; T.sim(.3); o.granada = h2 - p.hp;
    o.cal = T.VGCLI.calFim > agora() || !!document.getElementById('zkCal') || !!T.CAMP_ZKC?.calEl;
    limpa(); return o;
  });
  assert.ok(!r.semLugar, 'achou um lugar aberto');
  assert.deepEqual(r.tv, { s: 1, f: 'setor', g: 120 }); assert.equal(r.marcaAviso, false, 'aviso não marca'); assert.ok(r.marca && r.alvo, 'marcado e preferido ' + JSON.stringify(r));
  assert.deepEqual(r.tela, ['zhud', true], 'a tela da marca aparece na Vila (dentro do HUD)'); assert.equal(r.telaSome, '0');
  assert.equal(r.tr, .8); assert.equal(r.antes, 0); assert.equal(r.rajada, 66, 'rajada: 3 × 22'); assert.ok(r.fraco, 'recuperação da rajada abre o fraco'); assert.equal(r.tiros, 3, 'os 3 tiros no cliente');
  assert.ok(r.temParede, 'achou uma parede perto'); assert.ok(r.coberto <= 0, 'atrás da parede (a vida pode voltar no meio) ' + JSON.stringify(r));
  assert.equal(r.tg, 1.2); assert.equal(r.gAntes, 0); assert.equal(r.granada, 35); assert.ok(r.cal, 'cal nos olhos');
  assert.deepEqual(J.erros, []);
});

test('fases sem a arena: 66% (sem torre: fica no chão), 33% (sem apagão; ×1,15; 3 m/s); baioneta acerta e atordoa na parede', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, atk, limpa, livre } = H; quieto(); limpa(); const z = CH.z; z.st = 'in'; CH.inv = 0; CH.fase = 0; z.hp = z.maxHp; p.dwEnd = 1e12; p.hp = p.maxHp = 1e6;
    const B = H.aberto([[0, 8]]); z.body.pos.set(B[0], 0, B[1]); poe(p, B[0], B[1] + 8);
    const o = { hemi: T.ZC.world.pool.some(P => P.L.intensity > 0) };
    T.zHit(p, z.id, z.maxHp * .5, 'body', 'm1911', false); z.hp = z.maxHp * .67; T.zHit(p, z.id, 5000, 'body', 'm1911', false);
    o.f2 = [CH.fase, T.VGSRV.modo ?? 'chao']; T.sim(4); o.chao2 = ['chao', +z.body.pos.y.toFixed(2)]; o.cli2 = T.CAMP.c.ch.f; // a torre saiu com a arena (VGSRV sem modo)
    CH.inv = 0; z.hp = z.maxHp * .34; T.zHit(p, z.id, 5000, 'body', 'm1911', false);
    o.f3 = [CH.fase, T.VGSRV.modo ?? 'chao', z.speed]; T.sim(.3); o.hemi3 = T.ZC.world.pool.some(P => P.L.intensity > 0); o.cone = typeof T.FORTE_V !== 'undefined';
    CH.inv = 0; const h = z.hp; T.zHit(p, z.id, 100, 'body', 'm1911', false); o.k3 = h - z.hp;
    // baioneta no jogador: 55 (Normal)
    quieto(); limpa(); z.body.pos.set(B[0], 0, B[1]); z.st = 'in'; z.atord = 0; poe(p, B[0], B[1] + 6); p.dwEnd = 0; p.hp = p.maxHp = 1000;
    T.campChefeAtaca(z, atk('baioneta'), p); T.sim(1 / 60); o.tb = H.tel().s; const z0 = z.body.pos.z; T.sim(.6); o.bAntes = +(z.body.pos.z - z0).toFixed(2); T.sim(2.2); o.bJog = 1000 - p.hp; limpa();
    // baioneta para a parede: uma direção com chão livre e parede a 3–10 m; atordoado com o fraco aberto
    let alvo = null, P0 = null;
    for (let rr = 0; rr < 40 && !alvo; rr += 2) for (let a0 = 0; a0 < 16 && !alvo; a0++) { const Q = [-2.5 + Math.cos(a0 * Math.PI / 8) * rr, 6 + Math.sin(a0 * Math.PI / 8) * rr]; if (!livre(...Q)) continue;
      for (let a = 0; a < 16 && !alvo; a++) { const fx = Math.cos(a * Math.PI / 8), fz = Math.sin(a * Math.PI / 8); let d = .25; while (d < 12 && T.ffCell(Q[0] + fx * d, Q[1] + fz * d) >= 0 && T.FF.walk[T.ffCell(Q[0] + fx * d, Q[1] + fz * d)]) d += .25;
        if (d >= 3 && d <= 10) { P0 = Q; alvo = { pos: [Q[0] + fx * 13, 0, Q[1] + fz * 13], alive: true, downed: false, id: 'falso' }; o.parede = d; } } }
    if (alvo) { quieto(); z.body.pos.set(P0[0], 0, P0[1]); z.st = 'in'; z.atord = 0; z.fracoAte = 0; T.campChefeAtaca(z, atk('baioneta'), alvo); T.sim(.75); T.sim(2);
      o.bat = [z.atord > agora(), z.fracoAte > agora(), +Math.hypot(z.body.pos.x - P0[0], z.body.pos.z - P0[1]).toFixed(1)]; }
    limpa(); CH.fase = 0; z.atord = 0; z.speed = 0; return o;
  });
  assert.deepEqual(r.f2, [1, 'chao'], 'fase 2 sem torre'); assert.ok(r.chao2[0] === 'chao' && Math.abs(r.chao2[1]) < .05, 'continua no chão'); assert.equal(r.cli2, 2);
  assert.equal(r.f3[0], 2); assert.equal(r.f3[1], 'chao'); assert.ok(Math.abs(r.f3[2] - 3 * .95) < 1e-9, `fase 3: 3,0 m/s × 0,95 do Normal (balanceamento final 13/10): ${r.f3[2]}`); assert.equal(r.hemi3, r.hemi, 'sem apagão fora da arena'); assert.ok(!r.cone, 'sem cone');
  assert.equal(r.k3, 115, 'fase 3: ×1,15');
  assert.equal(r.tb, .7); assert.equal(r.bAntes, 0, 'parado no aviso'); assert.equal(r.bJog, 55, 'a baioneta acerta ' + JSON.stringify(r));
  assert.ok(r.bat, 'achou uma parede'); assert.deepEqual(r.bat.slice(0, 2), [true, true], 'bateu na parede: atordoado e fraco aberto ' + JSON.stringify(r));
  assert.ok(r.bat[2] <= r.parede + .1, `parou na parede (${r.bat[2]} de ${r.parede})`);
  assert.deepEqual(J.erros, []);
});

test('pelotão na Vila: apito (1,5 s), 3 Soldados perto dos jogadores (alcançáveis), lacaios fora do toSpawn, teto 6 (fase 3: 9)', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, atk, limpa, livre } = H; quieto(); limpa(); const z = CH.z; z.st = 'in'; z.hp = z.maxHp; CH.inv = 0; CH.fase = 0; z.atord = 0; p.dwEnd = 1e12; p.hp = p.maxHp = 1e6;
    const B = H.aberto([[0, 8]]); z.body.pos.set(B[0], 0, B[1]); poe(p, B[0], B[1] + 8);
    const o = {}, ts = T.Z.toSpawn;
    T.VGSRV.pelT = agora(); T.sim(1 / 30); o.tel = [CH.atk?.a.id, +(CH.atk.fa - CH.atk.t0).toFixed(2)]; T.sim(1.4); o.antes = T.campChefeLacVivos(); T.sim(.2);
    const lac = [...T.Z.zs.values()].filter(x => x.lac);
    o.lac = [lac.length, [...new Set(lac.map(x => x.kind))].join()];
    o.onde = lac.map(x => { const P = x.body.pos; return [livre(P.x, P.z) || x.win >= 0, +Math.hypot(P.x - p.pos[0], P.z - p.pos[2]).toFixed(1)]; });
    o.prox = +(T.VGSRV.pelT - agora()).toFixed(1);
    for (let k = 0; k < 3; k++) { limpa(); T.campChefeAtaca(z, atk('pelotao'), p); T.sim(1.6); } o.teto = T.campChefeLacVivos();
    CH.fase = 2; for (let k = 0; k < 2; k++) { limpa(); T.campChefeAtaca(z, atk('pelotao-3'), p); T.sim(1.6); } o.teto3 = T.campChefeLacVivos(); CH.fase = 0;
    o.ts = T.Z.toSpawn === ts; o.k8 = T.ZKIND[8] ? 8 : 0;
    for (const x of [...T.Z.zs.values()]) if (x.lac) T.Z.zs.delete(x.id); limpa(); T.VGSRV.pelT = 1e12;
    return o;
  });
  assert.deepEqual(r.tel, ['pelotao', 1.5], JSON.stringify(r)); assert.equal(r.antes, 0, 'nada antes do apito'); assert.equal(r.lac[0], 3); assert.equal(r.lac[1], String(r.k8), 'Soldados');
  assert.ok(r.onde.every(([ok, d]) => ok && d <= 16), 'perto dos jogadores, em chão alcançável ' + JSON.stringify(r));
  assert.ok(r.prox > 28 && r.prox <= 30, JSON.stringify(r)); assert.equal(r.teto, 6); assert.equal(r.teto3, 9); assert.ok(r.ts, 'fora do toSpawn');
  assert.deepEqual(J.erros, []);
});

test('ponto fraco (a lente nas costas) na Vila; o que era da arena não existe: sem arame farpado nem gerador do holofote', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, poe, quieto, limpa } = H; quieto(); limpa(); const z = CH.z; z.st = 'in'; CH.inv = 0; CH.fase = 0; z.atord = 0; z.fracoAte = 0;
    const B = H.aberto([[0, -6], [0, 6]]); if (!B) return { semLugar: 1 };
    z.body.pos.set(B[0], 0, B[1]); z.yaw = 0; z.tgt = null; z.tgtT = 1e12; p.campMarca = 0; z.hp = z.maxHp * .9; p.dwEnd = 1e12; p.inv.secondary = p.inv.primary = 'm1911';
    const o = { maxHp: z.maxHp }, tiro = (x, zz) => { poe(p, x, zz); T.sim(.6); const h = z.hp; T.sendToHost({ t: 'zhit', v: z.id, w: 'm1911', dmg: 1e6, z: 'fraco' }); T.sim(1 / 60); return +(h - z.hp).toFixed(2); };
    o.w = T.W.m1911.dmg; o.frente = tiro(B[0], B[1] - 6); o.tras = tiro(B[0], B[1] + 6); // yaw 0: frente para -z
    // arame farpado (regra da arena): saiu do jogo com a arena
    o.arame = typeof T.vgArameTick === 'undefined' && typeof T.FORTE === 'undefined' ? 0 : 1;
    o.curto = T.ZD.zint.filter(x => x.t === 'curto').length;
    return o;
  });
  assert.ok(!r.semLugar, 'achou um lugar aberto');
  assert.ok(Math.abs(r.frente - Math.min(r.w * 1.1, r.maxHp * .06)) < 1e-3, `de frente, fechado: vale corpo (${r.frente})`);
  assert.ok(Math.abs(r.tras - Math.min(r.w * 3 * 1.1, r.maxHp * .1)) < 1e-3, `por trás: ×3 (${r.tras}) ` + JSON.stringify(r));
  assert.equal(r.arame, 0, 'sem arame farpado'); assert.equal(r.curto, 0);
  assert.deepEqual(J.erros, []);
});

test('quem entra no meio recebe o chefe (versão de campo), a fase e o aviso no ar', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, poe, quieto, atk, limpa } = H; quieto(); limpa(); const z = CH.z; z.st = 'in'; CH.inv = 0; CH.fase = 1;
    const B = H.aberto([[0, 8]]); z.body.pos.set(B[0], 0, B[1]); poe(p, B[0], B[1] + 8);
    T.campChefeAtaca(z, atk('rajada'), p); T.sim(.1);
    const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; } };
    T.srvOnData(c, { t: 'join', v: 2, pv: 7, name: 'Meio' }); T.sim(.2);
    const st = c.out.filter(m => m.t === 'state' && m.z).pop(), cp = st?.z?.cp;
    const o = { ch: cp?.ch?.slice(0, 3), campo: cp?.ch?.[6], tel: cp?.tel?.[0]?.a };
    T.srvDrop(c); T.campCliReset(); T.campSync(cp); T.sim(1 / 60); o.cli = T.CAMP.c.ch && [T.CAMP.c.ch.k, T.CAMP.c.ch.f, T.CAMP.c.ch.campo]; CH.fase = 0; limpa();
    return o;
  });
  assert.deepEqual(r.ch, [14, r.ch[1], 2]); assert.equal(r.campo, 1); assert.equal(r.tel, 'rajada'); assert.deepEqual(r.cli, [14, 2, true]);
  assert.deepEqual(J.erros, []);
});

test('morte: recompensa, lacaios e comuns caem, a rodada acaba, objetivo feito, "OBJETIVOS CONCLUÍDOS" e as rodadas seguem infinitas (escalada)', { timeout: 300000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, poe, quieto, limpa } = H; quieto(); limpa(); const z = CH.z; z.st = 'in'; CH.inv = 0; CH.fase = 2; p.dwEnd = 1e12; p.hp = p.maxHp = 1e6;
    const B = H.aberto([[0, 8]]); z.body.pos.set(B[0], 0, B[1]); poe(p, B[0], B[1] + 8);
    T.campChefeLacaios({ tipo: 0, n: 2, max: 9 }); { T.Z.toSpawn++; T.zSpawnOne(); } T.Z.toSpawn = 3;
    const m0 = p.money, d0 = T.Z.drops.length, r0 = T.Z.round;
    z.hp = 10; T.zHit(p, z.id, 100, 'body', 'm1911', false);
    const o = { zs: T.Z.zs.size, ts: T.Z.toSpawn, obj: T.campEstado().obj['C1.1']?.st, ch: CH.z, vg: T.VGSRV.z, pts: p.money - m0, drops: T.Z.drops.slice(d0).map(d => d.type).sort().join() };
    T.sim(.5); o.ph = T.Z.phase; o.modo = T.CAMP.modo; o.et = T.CAMP.et; o.center = document.getElementById('center').textContent;
    o.prox = [T.Z.nextBoss - r0, T.CAMP_EVS.inf.prox - r0];
    o.cli = T.CAMP.c.ch ?? null;
    H.ateRodada(); o.r1 = T.Z.round; o.ts1 = T.Z.toSpawn; T.sim(2); o.inf2 = T.CAMP_INFS.vistoR; o.chefe2 = !!CH.z;
    H.fimRodada(); H.ateRodada(); o.r2 = T.Z.round; o.modo2 = T.CAMP.modo;
    return o;
  });
  assert.equal(r.zs, 0, 'lacaios e comuns caem'); assert.equal(r.ts, 0); assert.equal(r.obj, 'feito'); assert.equal(r.ch, null); assert.equal(r.vg, null);
  assert.ok(r.pts >= 500, 'recompensa: +500 ' + r.pts); assert.equal(r.drops, 'max,perk', 'drops garantidos');
  assert.notEqual(r.ph, 'round'); assert.equal(r.modo, 'infinito'); assert.equal(r.et, -1); assert.ok(r.center.includes('OBJETIVOS CONCLUÍDOS'), r.center);
  assert.deepEqual(r.prox, [2, 2], 'Carniceiro e eventos do infinito a partir de 2 rodadas'); assert.equal(r.cli, null, 'a barra do chefe some no cliente');
  assert.equal(r.r1, 14); assert.ok(r.ts1 > 0); assert.equal(r.inf2, 14, 'campInfTick viu a rodada'); assert.equal(r.chefe2, false, 'nada de Vigia de novo antes da rodada de chefe do infinito');
  assert.equal(r.r2, 15); assert.equal(r.modo2, 'infinito');
  assert.deepEqual(J.erros, []);
});
