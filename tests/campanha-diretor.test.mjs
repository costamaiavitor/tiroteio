// O Diretor e a arena Galeria 7 (Onda 3, O3-D13; docs/overhaul/campanha.md §7.4, §8.3): o clássico sem a arena (menu, ZKIND sem
// buraco), a chegada Sanatório -> Galeria 7 com bagagem (rodada 21), as galerias que abrem uma por rodada, o teto de vivos, a rodada 25
// (12 fixos, o objetivo do chefe, o Diretor no púlpito), cada fase (protegido pelos tanques, mergulho e escala 2,2, apagão e coro) e cada
// ataque com aviso antes do dano (dose, corrente, maré, onda, abraço, chamada, coro), junções e ponto fraco, quem entra no meio, a morte
// que dispara o evento do chefe final e a arena que monta e desmonta sem vazar.
// Rodar: node --test tests/campanha-diretor.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 }); }, { timeout: 240000 });
after(async () => { await J?.fechar(); });

const PREP = `(T => {
  const p = T.S.players.get('h'), CH = T.CAMP_CH, agora = () => window.__simNow;
  const poe = (q, x, z, y = 0) => { q.pos = [x, y, z]; if (q === p) { T.me.pos.set(x, y, z); T.me.vel.set(0, 0, 0); } };
  const quieto = () => { const z = CH.z; T.Z.reQ = []; if (z) { z.speed = 0; z.atkT = 1e12; z.chkT = 1e12; } CH.prox = 1e12; T.DRSRV.nadaT = 1e12; T.Z.spawnT = 1e12; T.Z.toSpawn = Math.max(T.Z.toSpawn, 5); for (const o of [...T.Z.zs.values()]) if (o !== z) T.Z.zs.delete(o.id); };
  const atk = id => CH.def.ataques.find(a => a.id === id);
  const idx = id => T.ZD.zint.findIndex(o => o.id === id);
  const limpa = () => { if (CH.atk) { CH.atk = null; T.broadcast({ t: 'camp', k: 'telx' }); } T.drSolta(); CH.prox = 1e12; CH.lacT = 1e12; for (const o of [...T.Z.zs.values()]) if (o !== CH.z && !o.drCoro) T.Z.zs.delete(o.id); };
  const tel = () => T.CAMP.c.tel[T.CAMP.c.tel.length - 1];
  const chao = (x, z) => { const D = CH.z; D.st = 'in'; T.DRSRV.modo = 'chao'; T.DRSRV.rota = []; D.body.pos.set(x, 0, z); D.atord = 0; D.fracoAte = 0; CH.inv = 0; };
  return { p, CH, agora, poe, quieto, atk, idx, limpa, tel, chao };
})`;
const em = fn => `(T, arg) => { const H = (new Function('return ' + arg.PREP)())(T); return (${fn})(T, arg, H); }`;
const rodar = (fn, a = {}) => J.page.evaluate(([src, arg]) => (new Function('T', 'arg', `return (${src})(T, arg)`))(window.__T, arg), [em(fn.toString()), { PREP, ...a }]);

test('clássico sem a arena: fora dos cartões e do formulário, ZKIND sem buraco, nada da arena no clássico', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, T => {
    const cards = [...document.querySelectorAll('#hostForm [data-map]')].map(b => b.dataset.map);
    const el = document.createElement('div'); document.body.appendChild(el);
    const g1 = T.matchForm(el, { mode: 'zombies', map: 'galeria7', zmap: 'galeria7', zmode: 'campanha', ato: 4, zdiff: 1 });
    el.querySelector('[data-zm="classico"]').click(); const o1 = g1(); const cardsZ = [...el.querySelectorAll('[data-map]')].map(b => b.dataset.map);
    const g2 = T.matchForm(el, { mode: 'dm', map: 'galeria7', cmap: 'galeria7' }); const o2 = g2(); el.remove();
    const buracos = []; for (let k = 0; k < T.ZKIND.length; k++) if (!(k in T.ZKIND)) buracos.push(k);
    const mix0 = [T.Z.mix, T.Z.mixN]; T.zMix(25, 40, 1); const mixN = T.Z.mixN; [T.Z.mix, T.Z.mixN] = mix0;
    return { cards, cardsZ, z1: [o1.map, o1.zmap, o1.zmode], m2: o2.map, buracos, mixN, on: T.CAMP.on, camp: T.MAPS.galeria7.camp, k16: [T.ZKIND[16].n, T.ZKIND[16].chefe, T.ZKIND[16].sz],
      ch: T.campChefeEstado().id, mapa: T.gal7Estado().mapa, tipo: T.gal7Tipo(11), agua: T.CAMP_AGUA.galeria7.length };
  });
  assert.ok(!r.cards.includes('galeria7') && !r.cardsZ.includes('galeria7'), 'a arena não aparece nos cartões'); assert.equal(r.camp, 1);
  assert.deepEqual(r.z1, ['vila', 'vila', 'classico']); assert.equal(r.m2, 'arena', 'PvP nunca na arena');
  assert.deepEqual(r.buracos, []); assert.ok(Number.isFinite(r.mixN) && r.mixN > 0, `especiais do clássico (${r.mixN})`);
  assert.equal(r.on, false); assert.deepEqual(r.k16, ['O Diretor', 1, 1.3]); assert.equal(r.ch, null); assert.equal(r.mapa, 'sanatorio');
  assert.equal(r.tipo, 11, 'fora da arena o filtro da rodada 25 não mexe'); assert.equal(r.agua, 10);
  assert.deepEqual(J.erros, []);
});

test('Sanatório -> Galeria 7: bagagem, rodada 21 (só a galeria oeste), energia ligada, sem PaP, 13 janelas, teto de 20 vivos', { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p } = H; T.campLibera(4, 3);
    T.S.st = { ...T.S.st, zmode: 'campanha', ato: 3 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    const o = { et0: T.CAMP.et, mapa0: T.gal7Estado().mapa };
    p.money = 4321; p.inv.secondary = 'galil_pap'; p.perks = ['jug']; p.maxHp = 250;
    T.Z.zs.clear(); T.Z.toSpawn = 0; T.campTrocaMapa(6); T.sim(.1); o.tr = T.CAMP.trans?.fase;
    T.sendToHost({ t: 'camp', k: 'pronto' }); T.sim(.1); T.sim(T.Z.phaseEnd - window.__simNow + .2);
    o.est = T.gal7Estado(); o.et = T.CAMP.et; o.round = T.Z.round; o.ph = T.Z.phase; o.bag = [p.money, p.inv.secondary, p.perks.join(), p.maxHp, p.alive];
    o.portas = [...T.Z.doors].sort(); o.zint = T.ZD.zint.map(x => x.id || x.t).join(); o.wins = T.ZD.windows.length; o.power = [T.Z.power, T.ZC.power];
    o.obj = T.campEstado().obj['F.1']?.st; o.ch = T.campChefeEstado().id;
    // teto de vivos: com 20 (Normal) o nascimento comum espera; lacaio e chefe não contam
    const fake = []; for (let i = 0; i < 20; i++) { const id = 90000 + i; fake.push(id); T.Z.zs.set(id, { id, kind: 0, body: { pos: { x: 0, y: 0, z: 0 } } }); }
    const c1 = [{ i: -1, x: 0, z: 0 }]; T.gal7Nasce({}, c1); T.Z.zs.get(90000).lac = 1; const c2 = [{ i: -1, x: 0, z: 0 }]; T.gal7Nasce({}, c2); for (const id of fake) T.Z.zs.delete(id);
    o.teto = [c1.length, c2.length];
    T.sim(6); o.zs = T.Z.zs.size;
    o.salas = [...new Set([...T.Z.zs.values()].map(z => T.zRoomAt(z.body.pos.x, z.body.pos.z)))].filter(Boolean).sort();
    return o;
  });
  assert.equal(r.mapa0, 'sanatorio'); assert.equal(r.et0, 4); assert.equal(r.tr, 'carga');
  assert.equal(r.est.mapa, 'galeria7'); assert.equal(r.et, 6); assert.equal(r.round, 21); assert.equal(r.ph, 'round');
  assert.deepEqual(r.bag, [4321, 'galil_pap', 'jug', 250, true], 'bagagem levada');
  assert.deepEqual(r.portas, ['g7-oeste'], 'rodada 21: só a galeria oeste'); assert.equal(r.wins, 13);
  assert.equal(r.zint, 'g7-tanque-1,g7-tanque-2,g7-tanque-3,g7-tanque-4,g7-juncao-1,g7-juncao-2,g7-juncao-3,g7-carga-1,g7-carga-2,g7-carga-3,g7-gaiola,municao,n-galeria-diretor');
  assert.deepEqual(r.power, [true, true]); assert.equal(r.est.pap, false, 'PaP escondido'); assert.equal(r.est.anim, true); assert.equal(r.est.agua, true);
  assert.equal(r.obj, 'oculto', 'o objetivo do chefe espera a rodada 25'); assert.equal(r.ch, null);
  assert.deepEqual(r.teto, [0, 1], 'com 20 vivos não nasce; lacaio não conta'); assert.ok(r.zs > 0, 'zumbis nascendo');
  assert.ok(r.salas.every(s => s === 'A' || s === 'G1'), 'só no salão e na galeria aberta ' + r.salas);
  assert.deepEqual(J.erros, []);
});

test('rodadas 22 e 23 abrem as galerias; rodada 25: 12 fixos, objetivo do chefe, o Diretor no púlpito, protegido pelos tanques', { timeout: 300000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH } = H; p.dwEnd = 1e12; const o = {}, fim = () => { for (const z of [...T.Z.zs.values()]) T.zKill(z, null, 'body', 'nuke', false, true); T.Z.toSpawn = 0; T.sim(.5); T.sim(T.Z.phaseEnd - window.__simNow + .2); };
    fim(); o.r22 = [T.Z.round, [...T.Z.doors].sort().join()]; fim(); o.r23 = [T.Z.round, [...T.Z.doors].sort().join()];
    T.campForca('V.1'); T.campForca('V.2'); T.sim(.1); // O3-D14: o Diretor só vem depois das cargas e da Névoa (V.1, V.2)
    T.Z.round = 24; fim(); o.round = T.Z.round; o.ts = T.Z.toSpawn + [...T.Z.zs.values()].filter(z => !z.lac && !T.ZKIND[z.kind]?.chefe).length; o.mixN = T.Z.mixN;
    o.obj = T.campEstado().obj['F.1']?.st;
    o.tipos = [T.gal7Tipo(11), T.gal7Tipo(12), T.gal7Tipo(10), T.gal7Tipo(13), T.gal7Tipo(9), T.gal7Tipo(0)]; o.rest = Object.keys(T.CAMP_ZKS.rest).map(Number).filter(k => ![9, 10, 13].includes(k));
    T.sim(1); const z = CH.z; T.sim(2.5);
    o.ch = T.campChefeEstado(); o.hp = [z?.maxHp, Math.round(T.zHp(25) * T.zHpK(25) * (T.CAMP_CHEFE[16].base + T.CAMP_CHEFE[16].porJog))]; o.pos = z && [z.body.pos.x, +z.body.pos.y.toFixed(2), z.body.pos.z]; o.modo = T.DRSRV.modo;
    o.tag = CH.tag; o.bar = document.getElementById('zboss').firstChild.nodeValue; o.sz = [T.ZKIND[16].sz, z.rad];
    o.tq = T.drIdx('g7-tanque').map(i => T.Z.zint[i].hpMax); o.jn = T.drIdx('g7-juncao').map(i => T.Z.zint[i].hpMax); o.esp = [Math.round(z.maxHp * .06), Math.round(z.maxHp * .04)];
    o.cli = T.CAMP.c.ch?.k;
    return o;
  });
  assert.deepEqual(r.r22, [22, 'g7-norte,g7-oeste']); assert.deepEqual(r.r23, [23, 'g7-leste,g7-norte,g7-oeste']);
  assert.equal(r.round, 25); assert.equal(r.ts, 12, '12 fixos (Normal) ' + JSON.stringify(r)); assert.equal(r.mixN, 0, 'sem especiais do clássico');
  assert.deepEqual(r.tipos, [0, 0, 10, 13, 9, 0], 'rodada 25: só Enfermeiro, Pregador e Afogado'); assert.deepEqual(r.rest, []);
  assert.equal(r.obj, 'ativo'); assert.equal(r.ch.k, 16); assert.equal(r.hp[0], r.hp[1], 'vida = zHp(25)·(12 + 8,5·1)'); assert.ok(Math.abs(r.hp[0] - 52392 / 12 * 20.5) < 40); // O3-D15: vida ×1,7
  assert.deepEqual(r.pos, [0, .9, -2], 'em cima do púlpito'); assert.equal(r.modo, 'pulpito'); assert.deepEqual(r.sz, [1.3, .4]);
  assert.equal(r.tag, 'protegido'); assert.equal(r.bar, 'O DIRETOR · FASE 1 · PROTEGIDO'); assert.equal(r.cli, 16);
  assert.deepEqual(r.tq, Array(4).fill(r.esp[0]), 'tanques com 6% da vida'); assert.deepEqual(r.jn, Array(3).fill(r.esp[1]), 'junções com 4%');
  assert.deepEqual(J.erros, []);
});

test('ataques da fase 1 com aviso antes do dano: dose (seringas que o tanque segura, 20 + dose), corrente nas placas (35), chamada pelos poços', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, atk, limpa, tel } = H; quieto(); limpa(); const z = CH.z; CH.inv = 0; p.dwEnd = 0; p.hp = p.maxHp = 1000; p.perks = []; p.crouch = 0; p.zkDose = null;
    const o = {};
    // dose: 3 seringas em leque; o jogador ao norte do púlpito (entre os tanques)
    poe(p, 0, -13); T.CAMP.c.tel = []; const h0 = p.hp; T.campChefeAtaca(z, atk('dose'), p); T.sim(1 / 60); o.td = [tel().s, tel().f, tel().p.length];
    T.sim(.55); o.dAntes = h0 - p.hp; T.sim(1.2); o.dose = h0 - p.hp; o.doses = (p.zkDose || []).filter(t => t > agora()).length; limpa(); T.sim(1);
    // atrás do tanque (4,2, -6,2): a linha para nele
    poe(p, 6.4, -9.4); const h1 = p.hp; T.campChefeAtaca(z, atk('dose'), p); T.sim(2); o.coberto = h1 - p.hp; limpa(); T.sim(1);
    // corrente: 4 placas (as mais perto); quem está numa leva 35 só no ativo
    poe(p, -6.5, -12); const h2 = p.hp; T.campChefeAtaca(z, atk('corrente'), p); T.sim(1 / 60); o.tc = [tel().s, tel().f, tel().p.length, tel().p.some(s => s[0] === -6.5 && s[2] === -12)];
    T.sim(1.4); o.cAntes = h2 - p.hp; T.sim(.4); o.corrente = h2 - p.hp; o.placas = T.GAL7_V.placas.visible; limpa(); T.sim(1);
    // chamada: 2 Enfermeiros e 4 comuns pelos poços, lacaios
    poe(p, 0, 14); T.campChefeAtaca(z, atk('chamada'), p); T.sim(1.7); o.lAntes = T.campChefeLacVivos(); T.sim(.3);
    const lac = [...T.Z.zs.values()].filter(x => x.lac); o.lac = [lac.length, lac.filter(x => x.kind === 10).length, lac.every(x => Math.min(...T.GAL7.pocos.map(w => Math.hypot(w[0] - x.body.pos.x, w[1] - x.body.pos.z))) < 4)];
    for (const x of lac) T.Z.zs.delete(x.id);
    // Pesadelo: o aviso de 0,6 s não cai (mínimo 0,6)
    T.S.st.zdiff = 3; limpa(); T.campChefeAtaca(z, atk('dose'), p); o.pesadelo = +(CH.atk.fa - CH.atk.t0).toFixed(3); limpa(); T.S.st.zdiff = 1;
    return o;
  });
  assert.deepEqual(r.td, [.6, 'linha', 3]); assert.equal(r.dAntes, 0, 'nada no aviso'); assert.equal(r.dose, 20); assert.equal(r.doses, 1, '1 dose do Enfermeiro');
  assert.ok(r.coberto <= 0, 'o tanque segurou a seringa ' + JSON.stringify(r));
  assert.deepEqual(r.tc, [1.5, 'disco', 4, true]); assert.equal(r.cAntes, 0); assert.equal(r.corrente, 35); assert.equal(r.placas, true, 'placas acesas');
  assert.equal(r.lAntes, 0); assert.deepEqual(r.lac, [6, 2, true], 'chamada pelos poços'); assert.equal(r.pesadelo, .6);
});

test('fase 1 -> 2: ×0,2 com tanque de pé; os 4 tanques caídos passam à fase 2: mergulho, volta por um poço com 2,2 de tamanho', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, quieto, limpa, poe } = H; quieto(); limpa(); const z = CH.z; CH.inv = 0; z.hp = z.maxHp; poe(p, 0, 14); p.dwEnd = 1e12;
    const o = {}, h = z.hp; T.zHit(p, z.id, 1000, 'body', 'm1911', false); o.prot = h - z.hp;
    const L = T.drIdx('g7-tanque'); for (const i of L.slice(0, 3)) T.campDanoPilar(i, 1e6, 0, p); T.sim(.1); o.f1 = [CH.fase, CH.tag];
    T.campDanoPilar(L[3], 1e6, 0, p); T.sim(.1); o.f2 = [CH.fase, CH.tag, T.DRSRV.modo, T.ZKIND[16].sz, z.rad]; o.vida = +(z.hp / z.maxHp).toFixed(2);
    T.sim(.8); o.fundo = +z.body.pos.y.toFixed(2); for (let k = 0; k < 60 && T.DRSRV.modo !== 'chao'; k++) T.sim(.05); o.sai = [T.DRSRV.modo, +z.body.pos.y.toFixed(2), +Math.min(...T.GAL7.pocos.map(w => Math.hypot(w[0] - z.body.pos.x, w[1] - z.body.pos.z))).toFixed(2)];
    T.sim(2); const zc = T.ZC.zs.get(z.id); o.cli = [T.CAMP.c.ch.f, +(zc?.sz ?? 0).toFixed(2)];
    CH.inv = 0; const h2 = z.hp; T.zHit(p, z.id, 1000, 'body', 'm1911', false); o.semProt = h2 - z.hp;
    T.campChefeLacaios(CH.def.lacaios); const af = [...T.Z.zs.values()].filter(x => x.lac), naAgua = af.every(x => T.GAL7.agua.some(a => Math.hypot(a[0] - x.body.pos.x, a[1] - x.body.pos.z) < 1.6)); T.sim(.1); o.afogados = [af.length, af.every(x => x.kind === 9 && T.Z.zs.has(x.id)), naAgua]; for (const x of af) T.Z.zs.delete(x.id); // O3-D16: a posição no nascimento (no T.sim o Afogado já anda submerso para o alvo)
    return o;
  });
  assert.equal(r.prot, 200, 'protegido: ×0,2'); assert.deepEqual(r.f1, [0, 'protegido']);
  assert.deepEqual(r.f2, [1, null, 'mergulho', 2.2, .7], JSON.stringify(r)); assert.equal(r.vida, 1, 'os tanques passam de fase sem a vida em 70%');
  assert.ok(r.fundo < -1, 'mergulhou (' + r.fundo + ')'); assert.deepEqual(r.sai.slice(0, 2), ['chao', 0]); assert.ok(r.sai[2] < 2.6, 'saiu na borda de um poço');
  assert.deepEqual(r.cli, [2, 2.2], 'o cliente cresceu'); assert.equal(r.semProt, 1000); assert.deepEqual(r.afogados, [2, true, true], 'Afogados pela água ' + JSON.stringify(r.afogados));
});

test('ataques das fases 2 e 3: maré (plataforma seca), onda (45 + empurrão), abraço (preso; o tiro no cano solta), nadar entre os poços', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, atk, limpa, tel, chao } = H; quieto(); limpa(); chao(0, 8); const z = CH.z; p.dwEnd = 0; p.hp = p.maxHp = 1000; p.perks = []; T.CAMP.c.tel = [];
    const o = {};
    // maré: aviso 2 s; no chão do salão 10/s; em cima da plataforma (1,2 m) nada
    poe(p, 0, 15); const h0 = p.hp; T.campChefeAtaca(z, atk('mare'), p); T.sim(1 / 60); o.tm = [tel().s, tel().f]; T.sim(1.9); o.mAntes = h0 - p.hp; o.subindo = T.gal7Estado().mareY > .1;
    T.sim(1.1); o.mare = h0 - p.hp; o.cliMare = T.DRCLI.mareAte > agora(); poe(p, -17, 9, 1.2); const h1 = p.hp; T.sim(2); o.seco = h1 - p.hp; o.cp = T.zWorldState?.()?.cp?.dr;
    T.sim(6); o.acabou = [T.DRSRV.mareAte > agora(), T.DRCLI.mareAte > agora()]; limpa(); T.sim(3); o.desce = T.gal7Estado().mare;
    // onda: retângulo de 16 x 3, 45 e empurrão de 5 m
    poe(p, 0, 3); const h2 = p.hp; T.me.lungeEnd = 0; T.campChefeAtaca(z, atk('onda'), p); T.sim(1 / 60); o.to = [tel().s, tel().f, tel().d1, tel().d2]; T.sim(1.1); o.oAntes = h2 - p.hp; T.sim(.2); o.onda = h2 - p.hp; o.emp = T.me.lungeEnd > agora(); limpa(); T.sim(1);
    // abraço: o alvo a 2 m fica preso 1,5 s (25/s) e o fraco abre já no abraço; outro jogador acertando o cano solta
    chao(0, 8); poe(p, 0, 6); const h3 = p.hp; T.campChefeAtaca(z, atk('abraco'), p); T.sim(1 / 60); o.ta = [tel().s, tel().f]; T.sim(.75); o.aAntes = h3 - p.hp; T.sim(.15);
    o.preso = [T.DRSRV.presos.includes('h'), T.DRCLI.presoAte > agora(), z.fracoAte > agora()];
    T.drDanoFraco(z, 10, 'fraco', 'm1911', { id: 'outro' }); T.sim(1 / 60); o.solto = [T.DRSRV.presos.length, T.DRCLI.presoAte > agora(), CH.atk?.fb <= agora() + 1e-6, z.fracoAte > agora()]; o.abraco = h3 - p.hp; limpa(); T.sim(2);
    // abraço inteiro: 1,5 s a 25/s
    chao(0, 8); poe(p, 0, 6); p.hp = p.maxHp; const h4 = p.hp; T.campChefeAtaca(z, atk('abraco'), p); T.sim(.8 + 1.6); o.inteiro = h4 - p.hp; o.solta = T.DRSRV.presos.length; limpa(); T.sim(2);
    // nadar: do lago até a borda do poço mais perto do alvo
    chao(2, 0); poe(p, 14, 10); T.DRSRV.nadaT = agora(); T.sim(1 / 30); o.nada = T.DRSRV.modo; for (let k = 0; k < 100 && T.DRSRV.modo !== 'chao'; k++) T.sim(.05); o.nadou = [T.DRSRV.modo, +Math.hypot(z.body.pos.x - 11, z.body.pos.z - 6).toFixed(2)]; T.DRSRV.nadaT = 1e12;
    return o;
  });
  assert.deepEqual(r.tm, [2, null], 'maré: aviso de 2 s (O3-D16: o cp não reenvia mais o aviso no ar)'); assert.equal(r.mAntes, 0); assert.ok(r.subindo, 'a água sobe no aviso'); assert.equal(r.mare, 10, 'maré 10/s ' + JSON.stringify(r)); assert.ok(r.cliMare);
  assert.equal(r.seco, 0, 'plataforma seca'); assert.ok(Array.isArray(r.cp) && r.cp[0] > 0, 'maré no cp'); assert.deepEqual(r.acabou, [false, false]); assert.equal(r.desce, false);
  assert.deepEqual(r.to, [1.2, 'linha', 16, 3]); assert.equal(r.oAntes, 0); assert.equal(r.onda, 45); assert.ok(r.emp, 'empurrão');
  assert.deepEqual(r.ta, [.8, 'disco']); assert.equal(r.aAntes, 0); assert.deepEqual(r.preso, [true, true, true]); assert.deepEqual(r.solto, [0, false, true, true], 'o tiro no cano soltou');
  assert.ok(r.abraco >= 0 && r.abraco <= 8, `pouco dano até soltar (${r.abraco}) ` + JSON.stringify(r)); assert.ok(Math.abs(r.inteiro - 37.5) <= 4, `1,5 s a 25/s (${r.inteiro})`); assert.equal(r.solta, 0);
  assert.equal(r.nada, 'mergulho'); assert.equal(r.nadou[0], 'chao'); assert.ok(r.nadou[1] < 2.6, 'saiu no poço mais perto do alvo ' + r.nadou[1]);
});

test('junção rompida atordoa 5 s com o fraco aberto; ponto fraco ×3 só aberto; fase 3: apagão, junções de volta, 2 Pregadores e o coro', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, atk, limpa, chao } = H; quieto(); limpa(); chao(0, 8); const z = CH.z; z.yaw = 0; p.dwEnd = 1e12; p.inv.secondary = p.inv.primary = 'm1911'; z.hp = z.maxHp * .6;
    const o = {}, tiro = (x, zz) => { poe(p, x, zz); T.sim(.6); const h = z.hp; T.sendToHost({ t: 'zhit', v: z.id, w: 'm1911', dmg: 1e6, z: 'fraco' }); T.sim(1 / 60); return +(h - z.hp).toFixed(2); };
    o.w = T.W.m1911.dmg; o.fechado = tiro(0, 2); z.fracoAte = agora() + 5; o.aberto = tiro(0, 2); z.fracoAte = 0; z.yaw = 0; o.tras = tiro(0, 14);
    // junção
    const j = T.drIdx('g7-juncao'); T.campChefeAtaca(z, atk('onda'), p); T.campDanoPilar(j[0], 1e6, 0, p); T.sim(1 / 60);
    o.rompe = [T.Z.zint[j[0]].st, +(z.atord - agora()).toFixed(1), z.fracoAte >= z.atord - 1e-6, CH.atk, T.CAMP.c.ch.at > agora()];
    z.atord = 0; z.fracoAte = 0;
    // fase 3
    CH.inv = 0; z.hp = z.maxHp * .36; T.zHit(p, z.id, 5000, 'body', 'm1911', false); T.sim(.2);
    o.f3 = [CH.fase, T.ZKIND[16].sz, T.drPregadores(), [...T.Z.zs.values()].filter(x => x.drCoro).map(x => x.kind).join()];
    o.juncoes = j.map(i => T.Z.zint[i].st); o.apagao = T.ZC.world.pool.every(P => P.L.intensity === 0);
    limpa(); T.campChefeAtaca(z, atk('onda'), p); o.avisoK = +(CH.atk.fa - CH.atk.t0).toFixed(3); limpa(); T.campChefeAtaca(z, atk('dose'), p); o.dose3 = +(CH.atk.fa - CH.atk.t0).toFixed(3); limpa();
    // coro: com Pregador vivo cura 3% (sem passar de 35%); sem nenhum, não vale
    CH.inv = 0; z.hp = z.maxHp * .2; const h = z.hp; T.campChefeAtaca(z, atk('coro'), p); T.sim(2.1); o.cura = +((z.hp - h) / z.maxHp).toFixed(3); limpa();
    for (const x of [...T.Z.zs.values()]) if (x.drCoro) T.Z.zs.delete(x.id); o.okSem = atk('coro').ok();
    z.hp = z.maxHp * .34; T.Z.zs.set(99999, { id: 99999, drCoro: 1 }); T.drCoro(z); T.Z.zs.delete(99999); o.teto = +(z.hp / z.maxHp).toFixed(3);
    return o;
  });
  const cap = 52380 / 12 * 20.5 * .06, capF = 52380 / 12 * 20.5 * .1; // O3-D15: vida do Diretor ×1,7 (base 12, porJog 8,5)
  assert.ok(Math.abs(r.fechado - Math.min(r.w * 1.1, cap)) < 2, `fechado: corpo (${r.fechado})`); assert.ok(Math.abs(r.aberto - Math.min(r.w * 3 * 1.1, capF)) < 2, `aberto: ×3 (${r.aberto})`);
  assert.ok(Math.abs(r.tras - r.fechado) < 2, 'por trás não abre (o fraco é o cano no peito)');
  assert.deepEqual(r.rompe, ['rompida', 5, true, null, true], 'rompida: atordoado 5 s, fraco, ataque cancelado');
  assert.deepEqual(r.f3.slice(0, 3), [2, 2.2, 2]); assert.equal(r.f3[3], '13,13', 'os 2 Pregadores do coro');
  assert.deepEqual(r.juncoes, ['pronto', 'pronto', 'pronto'], 'junções de volta'); assert.ok(r.apagao, 'apagão local');
  assert.equal(r.avisoK, .96, 'aviso ×0,8 na fase 3'); assert.equal(r.dose3, .6, 'nunca abaixo de 0,6');
  assert.equal(r.cura, .03); assert.equal(r.okSem, false); assert.equal(r.teto, .35, 'a cura não passa de 35%');
});

test('quem entra no meio: espectador, recebe o chefe na fase 3, o aviso no ar (uma vez só) e a maré', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, quieto, atk, limpa, chao, poe } = H; quieto(); limpa(); chao(0, 8); const z = CH.z; poe(p, 0, 14);
    T.campChefeAtaca(z, atk('mare'), p); T.sim(2.2); limpa(); T.campChefeAtaca(z, atk('onda'), p); T.sim(.1);
    const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; } };
    T.srvOnData(c, { t: 'join', v: 2, pv: 6, name: 'Meio' }); T.sim(.2);
    const q = T.S.players.get(c.pid), st = c.out.filter(m => m.t === 'state' && m.z).pop(), cp = st?.z?.cp;
    const o = { vivo: q?.alive, ch: cp?.ch?.slice(0, 3), tel: cp?.tel?.[0]?.a, dr: cp?.dr };
    T.srvDrop(c); T.campCliReset(); T.DRCLI.mareAte = 0; T.campSync(cp); T.campSync(cp); T.sim(1 / 60);
    o.cli = T.CAMP.c.ch && [T.CAMP.c.ch.k, T.CAMP.c.ch.f]; o.tels = T.CAMP.c.tel.filter(t => t.a === 'onda').length; o.mare = T.DRCLI.mareAte > window.__simNow;
    limpa(); return o;
  });
  assert.equal(r.vivo, false, 'espectador na rodada de chefe'); assert.deepEqual(r.ch, [16, r.ch[1], 3]); assert.equal(r.tel, 'onda'); assert.ok(r.dr?.[0] > 0);
  assert.deepEqual(r.cli, [16, 3]); assert.equal(r.tels, 1, 'o mesmo aviso uma vez só'); assert.ok(r.mare);
});

test('morte: lacaios e comuns caem, o objetivo do chefe fecha, o evento do chefe final (CAMP_GANCHOS.chefe com o 16) e a fuga (O3-D14)', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, quieto, limpa, chao, poe } = H; quieto(); limpa(); chao(0, 8); const z = CH.z; poe(p, 0, 14); p.dwEnd = 1e12;
    const visto = []; T.CAMP_GANCHOS.chefe.push((k, zz, q) => visto.push([k, zz === z, q === p]));
    T.campChefeLacaios({ tipo: 0, n: 2, max: 9 }); { T.Z.toSpawn++; T.zSpawnOne(); } T.Z.toSpawn = 3; T.campChefeAtaca(z, CH.def.ataques.find(a => a.id === 'mare'), p); T.sim(2.1);
    z.hp = 10; CH.inv = 0; T.zHit(p, z.id, 100, 'body', 'm1911', false);
    const o = { zs: T.Z.zs.size, ts: T.Z.toSpawn, obj: T.campEstado().obj['F.1']?.st, ch: T.CAMP_CH.z, visto, sz: T.ZKIND[16].sz, mare: T.DRSRV.mareAte };
    T.sim(.3); o.cliMare = T.DRCLI.mareAte > window.__simNow; o.ph = T.Z.phase; o.fim = T.CAMP.fim ? T.CAMP.fim.prox : T.CAMP.over ? 'concluida' : null; o.fuga = T.campVEstado().fase; o.salvo = T.campSalvo().dif[1];
    T.CAMP_GANCHOS.chefe.pop(); return o;
  });
  assert.equal(r.zs, 0); assert.equal(r.ts, 6, 'a fuga repõe (O3-D14)'); assert.equal(r.obj, 'feito'); assert.equal(r.ch, null);
  assert.deepEqual(r.visto, [[16, true, true]], 'CAMP_GANCHOS.chefe com o tipo 16'); assert.equal(r.sz, 1.3); assert.equal(r.mare, 0); assert.equal(r.cliMare, false);
  assert.equal(r.ph, 'round', 'a rodada segue na fuga'); assert.equal(r.fim, null); assert.equal(r.fuga, 'cena', 'cena c5-fuga (O3-D14)'); assert.ok(!r.salvo.fim, 'a conclusão só vem depois da gaiola');
  assert.deepEqual(J.erros, []);
});

test('a arena monta e desmonta sem vazar: Sanatório -> Galeria 7 -> Sanatório volta às mesmas contas', { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const ida = e => { T.Z.zs.clear(); T.Z.toSpawn = 0; T.CAMP.fim = null; T.campTrocaMapa(e); T.sim(.1); T.sendToHost({ t: 'camp', k: 'pronto' }); T.sim(.1); T.sim(T.Z.phaseEnd - window.__simNow + .2); };
    ida(4); const B = { mapa: T.gal7Estado().mapa, col: T.COL().length, geo: T.renderer.info.memory.geometries, tex: T.renderer.info.memory.textures };
    ida(6); const g = { mapa: T.gal7Estado().mapa, round: T.Z.round, anim: T.gal7Estado().anim };
    ida(4);
    return { B, g, mapa: T.gal7Estado().mapa, col: T.COL().length, geo: T.renderer.info.memory.geometries, tex: T.renderer.info.memory.textures, anim: T.gal7Estado().anim, agua: T.gal7Estado().agua };
  });
  assert.equal(r.B.mapa, 'sanatorio'); assert.deepEqual(r.g, { mapa: 'galeria7', round: 21, anim: true }); assert.equal(r.mapa, 'sanatorio');
  assert.equal(r.col, r.B.col, 'COL do Sanatório igual'); assert.ok(r.geo <= r.B.geo * 1.05 + 20, `geometrias ${r.B.geo} -> ${r.geo}`); assert.ok(r.tex <= r.B.tex + 4, `texturas ${r.B.tex} -> ${r.tex}`);
  assert.equal(r.anim, false); assert.equal(r.agua, false, 'a água da arena saiu da cena'); assert.deepEqual(J.erros, []);
});
