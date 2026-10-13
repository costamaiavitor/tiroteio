// O Foguista e a arena Casa do Forno (Onda 3, O3-D11; docs/overhaul/campanha.md §7.3, §8.2): o clássico sem a arena (menu, ZKIND sem
// buraco), a troca Sanatório -> Forno com bagagem (rodada 20: 20 comuns pelas grades, energia ligada, sem PaP), cada ataque com aviso
// (≥ 0,6 s) antes do dano (pá, porta do forno com o pilar cortando o fogo e os zumbis queimando, brasa no chão, apito com os lacaios
// pela calha e o fraco aberto, explosão de pressão que não passa pelo pilar e tira 1/3 dele), as fases (2: 2,6 m/s e rastro de brasa;
// 3: relógio da explosão e o Pregador no apito; manômetro e rachaduras no cliente), as válvulas de vapor (atordoa, fraco, cancela o
// ataque, zumbis a 50/s, recarga), a esteira (leva o atordoado para a boca do forno 4: 4%/s; a boca dá 20/s no jogador; o cliente
// anda na lona), o poço de cinzas, o ponto fraco (por trás e na janela), quem entra no meio, a morte que encerra a etapa (Galeria 7
// ou o fim da campanha) e a arena que monta e desmonta sem vazar.
// Rodar: node --test tests/campanha-foguista.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 }); }, { timeout: 240000 });
after(async () => { await J?.fechar(); });

const PREP = `(T => {
  const p = T.S.players.get('h'), CH = T.CAMP_CH, agora = () => window.__simNow;
  const poe = (q, x, z, y = 0) => { q.pos = [x, y, z]; if (q === p) { T.me.pos.set(x, y, z); T.me.vel.set(0, 0, 0); } };
  const quieto = () => { const z = CH.z; T.Z.reQ = []; if (z) { z.speed = 0; z.atkT = 1e12; z.chkT = 1e12; } CH.prox = 1e12; T.FGSRV.apT = T.FGSRV.prT = 1e12; T.Z.spawnT = 1e12; T.Z.toSpawn = Math.max(T.Z.toSpawn, 5); for (const o of [...T.Z.zs.values()]) if (o !== z) T.Z.zs.delete(o.id); };
  const atk = id => CH.def.ataques.find(a => a.id === id);
  const idx = id => T.ZD.zint.findIndex(o => o.id === id);
  const limpa = () => { if (CH.atk) { CH.atk = null; T.broadcast({ t: 'camp', k: 'telx' }); } };
  const tel = () => T.CAMP.c.tel[T.CAMP.c.tel.length - 1];
  const comum = (x, zz, hp = 1000) => { const id = T.Z.nextId; T.Z.toSpawn++; T.zSpawnOne(); const c = T.Z.zs.get(id); c.st = 'in'; c.speed = 0; c.hp = c.maxHp = hp; c.body.pos.set(x, 0, zz); c.atkT = 1e12; return c; };
  const pronto = () => { const z = CH.z; z.st = 'in'; z.atord = 0; z.fracoAte = 0; CH.inv = 0; p.dwEnd = 0; p.hp = p.maxHp = 1000; p.perks = []; p.crouch = 0; return z; };
  return { p, CH, agora, poe, quieto, atk, idx, limpa, tel, comum, pronto };
})`;
const em = fn => `(T, arg) => { const H = (new Function('return ' + arg.PREP)())(T); return (${fn})(T, arg, H); }`;
const rodar = (fn, a = {}) => J.page.evaluate(([src, arg]) => (new Function('T', 'arg', `return (${src})(T, arg)`))(window.__T, arg), [em(fn.toString()), { PREP, ...a }]);

test('clássico sem a arena: fora dos cartões e do formulário (mesmo partindo do st da arena), ZKIND sem buraco, especiais do clássico intactos', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, T => {
    const cards = [...document.querySelectorAll('#hostForm [data-map]')].map(b => b.dataset.map);
    const el = document.createElement('div'); document.body.appendChild(el);
    const g1 = T.matchForm(el, { mode: 'zombies', map: 'forno', zmap: 'forno', zmode: 'campanha', ato: 3, zdiff: 1 }); // lobby/pausa depois da arena
    el.querySelector('[data-zm="classico"]').click(); const o1 = g1(); const cardsZ = [...el.querySelectorAll('[data-map]')].map(b => b.dataset.map);
    const g2 = T.matchForm(el, { mode: 'dm', map: 'forno', cmap: 'forno' }); const o2 = g2(); el.remove();
    const buracos = []; for (let k = 0; k < T.ZKIND.length; k++) if (!(k in T.ZKIND)) buracos.push(k);
    const mix0 = [T.Z.mix, T.Z.mixN]; T.zMix(20, 40, 1); const mixN = T.Z.mixN; [T.Z.mix, T.Z.mixN] = mix0;
    return { cards, cardsZ, z1: [o1.map, o1.zmap, o1.zmode], m2: o2.map, buracos, mixN, on: T.CAMP.on, camp: T.MAPS.forno.camp, zonly: T.MAPS.forno.zonly, k15: [T.ZKIND[15].n, T.ZKIND[15].chefe, T.ZKIND[15].sz], ch: T.campChefeEstado().id, mapa: T.fornoEstado().mapa, zint: (T.ZINT_MAPA[T.fornoEstado().mapa] || []).some(o => o.t === 'valvula') };
  });
  assert.ok(!r.cards.includes('forno') && !r.cardsZ.includes('forno'), 'a arena não aparece nos cartões'); assert.equal(r.camp, 1); assert.equal(r.zonly, 1);
  assert.deepEqual(r.z1, ['vila', 'vila', 'classico'], 'partindo do st da arena, o clássico cai na Vila'); assert.equal(r.m2, 'arena', 'PvP nunca na arena');
  assert.deepEqual(r.buracos, [], 'ZKIND sem buraco (o zMix soma todos)'); assert.ok(Number.isFinite(r.mixN) && r.mixN > 0, `especiais do clássico na rodada 20 (${r.mixN})`);
  assert.equal(r.on, false); assert.deepEqual(r.k15, ['O Foguista', 1, 1.7]); assert.equal(r.ch, null); assert.equal(r.mapa, 'sanatorio'); assert.equal(r.zint, false, 'nenhuma válvula no Sanatório');
  assert.deepEqual(J.erros, []);
});

test('Sanatório -> Forno: bagagem, rodada 20 com 20 comuns pelas grades, energia ligada, sem PaP, o Foguista sobe na frente do forno 3', { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p } = H; T.campLibera(4, 3); T.CAMP_ATOS[4].objs = []; T.CAMP_ATOS[4].ini = []; // Ato IV sem objetivos (os de verdade são do O3-D12)
    T.S.st = { ...T.S.st, zmode: 'campanha', ato: 3 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    const o = { et0: T.CAMP.et, mapa0: T.fornoEstado().mapa };
    T.sim(T.Z.phaseEnd - window.__simNow + .2);
    p.money = 4321; p.inv.secondary = 'galil_pap'; p.perks = ['jug']; p.maxHp = 250;
    T.Z.zs.clear(); T.Z.toSpawn = 0; T.Z.round = 19; T.campFimEtapa(); o.fim = { prox: T.CAMP.fim?.prox, troca: T.CAMP.fim?.troca };
    o.cena = JSON.stringify(T.CAMP.c.cena?.L || '').includes('CASA DO FORNO');
    T.sim(T.CAMP.fim.t - window.__simNow + .05); o.tr = T.CAMP.trans?.fase; o.mapa = T.fornoEstado().mapa; o.et = T.CAMP.et;
    T.sendToHost({ t: 'camp', k: 'pronto' }); T.sim(.1); T.sim(T.Z.phaseEnd - window.__simNow + .2);
    for (let k = 0; k < 100 && !T.CAMP_CH.z; k++) T.sim(.05); { const c = T.CAMP_CH.z; window.__fgNasce = c && [Math.round(c.body.pos.x), Math.round(c.body.pos.z)]; }
    o.round = T.Z.round; o.ph = T.Z.phase; o.ts = T.Z.toSpawn + [...T.Z.zs.values()].filter(x => !T.ZKIND[x.kind]?.chefe).length; o.mixN = T.Z.mixN; o.power = T.Z.power; o.cpower = T.ZC.power;
    o.bag = [p.money, p.inv.secondary, p.perks.join(), p.maxHp, p.alive];
    o.est = T.fornoEstado(); o.zint = T.ZD.zint.map(x => x.t).join(); o.wins = T.ZD.windows.length;
    T.sim(4); const z = T.CAMP_CH.z;
    o.ch = T.campChefeEstado(); o.hp = z?.maxHp; o.pos = window.__fgNasce; o.esp = Math.round(T.zHp(20) * (T.CAMP_CHEFE[15].base + T.CAMP_CHEFE[15].porJog)); /* O3-D15: a vida vem da tabela */ o.obj = T.campEstado().obj['C2.1']?.st;
    o.grades = [...T.Z.zs.values()].filter(x => x !== z).every(x => x.win >= 0); o.cli = T.CAMP.c.ch?.k; o.bar = document.getElementById('zboss').firstChild.nodeValue;
    o.modelo = !!T.ZC.zs.get(z.id)?.model.userData.tanque;
    return o;
  });
  assert.equal(r.mapa0, 'sanatorio'); assert.equal(r.et0, 4); assert.deepEqual(r.fim, { prox: 5, troca: true }); assert.ok(r.cena, 'cena c4-forno');
  assert.equal(r.tr, 'carga'); assert.equal(r.mapa, 'forno'); assert.equal(r.et, 5);
  assert.equal(r.round, 20); assert.equal(r.ph, 'round'); assert.equal(r.ts, 20, '20 comuns (Normal) ' + JSON.stringify(r)); assert.equal(r.mixN, 0, 'sem especiais do clássico na arena');
  assert.equal(r.power, true); assert.equal(r.cpower, true); assert.equal(r.est.pap, false, 'PaP escondido'); assert.equal(r.est.power, false, 'chave de energia escondida'); assert.equal(r.est.anim, true);
  assert.deepEqual(r.bag, [4321, 'galil_pap', 'jug', 250, true], 'bagagem levada');
  assert.equal(r.zint, 'pilar,pilar,pilar,pilar,pilar,pilar,valvula,valvula,valvula,valvula,barril,barril,municao,nota'); assert.equal(r.wins, 5);
  assert.equal(r.ch.k, 15); assert.equal(r.hp, r.esp, 'vida = zHp(20)·(base + porJog·1)'); assert.equal(r.obj, 'ativo'); assert.ok(r.pos && Math.hypot(r.pos[0], r.pos[1] + 17) <= 1.5, 'sobe na frente do forno 3 ' + r.pos); assert.ok(r.grades, 'comuns pelas grades');
  assert.equal(r.cli, 15); assert.equal(r.bar, 'O FOGUISTA · FASE 1'); assert.ok(r.modelo, 'modelo do Foguista (tanque nas costas)');
  assert.deepEqual(J.erros, []);
});

test('ataques com aviso (≥ 0,6 s) antes do dano: pá (60 e empurrão), porta do forno (25/s; o pilar corta o fogo; zumbis a 200/s), brasa no chão (15/s)', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, atk, limpa, tel, comum, pronto } = H; quieto(); limpa(); const z = pronto(); const o = {};
    // pá: setor de 100° e 3,2 m na frente dele
    z.body.pos.set(-8, 0, -4); poe(p, -8, -1.5); let h = p.hp; T.campChefeAtaca(z, atk('pa'), p); T.sim(1 / 60); o.tp = [tel().a, tel().f, tel().s, tel().d1, tel().d2];
    T.sim(.8); o.paAntes = h - p.hp; T.sim(.2); o.pa = h - p.hp; o.emp = T.me.lungeEnd > agora(); T.sim(1.2); limpa(); T.sim(.1);
    // porta do forno: o jogador na frente do forno 2 (x -6); o pilar 1 (-6, -15) corta o fogo para quem está atrás dele
    poe(p, -6, -19); h = p.hp; T.campChefeAtaca(z, atk('forno'), p); T.sim(1 / 60); o.tf = [tel().a, tel().f, tel().s, tel().at, tel().p[0][0], tel().p[0][2]];
    const c1 = comum(-6.3, -20, 300), c2 = comum(-6, -13, 300); // um na frente do pilar, um atrás
    T.sim(1.2); o.fAntes = [h - p.hp, c1.hp]; T.sim(2.4); o.forno = h - p.hp; o.zumbis = [T.Z.zs.has(c1.id), T.Z.zs.has(c2.id), c2.hp]; o.len = +(T.CAMP_CH.atk?.len?.[0] ?? -1).toFixed(2);
    for (const c of [c1, c2]) T.Z.zs.delete(c.id); limpa(); T.sim(.1);
    poe(p, -6, -12.5); p.hp = p.maxHp; h = p.hp; T.campChefeAtaca(z, atk('forno'), p); T.sim(3.6); o.atras = h - p.hp; limpa();
    o.imune = [T.fgImune({ kind: 12 }), T.fgImune({ kind: 0 })];
    // brasa: disco de 3 m no alvo, chão em brasa 4 s a 15/s
    z.body.pos.set(-8, 0, -4); poe(p, -8, 4); p.hp = p.maxHp; h = p.hp; T.campChefeAtaca(z, atk('brasa'), p); T.sim(1 / 60); o.tb = [tel().a, tel().f, tel().s, tel().at, tel().d1];
    T.sim(.95); o.bAntes = h - p.hp; T.sim(2.05); o.brasa = h - p.hp; T.sim(.3); o.emb = T.FG_FX.emb?.count ?? 0; limpa();
    return o;
  });
  assert.deepEqual(r.tp, ['pa', 'setor', .9, 3.2, 100]); assert.equal(r.paAntes, 0, 'nada no aviso'); assert.equal(r.pa, 60); assert.ok(r.emp, 'empurrão');
  assert.deepEqual(r.tf, ['forno', 'linha', 1.5, 2, -6, -22.4], 'o forno 2 (com o jogador na frente)'); assert.deepEqual(r.fAntes, [0, 300], 'nada no aviso');
  assert.ok(r.forno >= 44 && r.forno <= 50, `porta do forno: 25/s por 2 s (${r.forno})`); assert.deepEqual(r.zumbis.slice(0, 2), [false, true], 'queima o da frente, o de trás do pilar fica ' + JSON.stringify(r));
  assert.equal(r.zumbis[2], 300); assert.equal(r.atras, 0, 'atrás do pilar o fogo não chega'); assert.deepEqual(r.imune, [true, false], 'Carvoeiro imune ao forno');
  assert.deepEqual(r.tb, ['brasa', 'disco', 1, 4, 3]); assert.equal(r.bAntes, 0); assert.ok(r.brasa >= 26 && r.brasa <= 30, `brasa: 15/s por 2 s (${r.brasa})`); assert.ok(r.emb > 0, 'brasas no chão (cliente)');
  assert.deepEqual(J.erros, []);
});

test('apito (aviso 2 s): 4 lacaios pela calha, marcados, fora do toSpawn, teto 8, fraco aberto na recuperação; o relógio chama a cada 35 s', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, atk, limpa, tel, pronto } = H; quieto(); limpa(); const z = pronto(); CH.fase = 0; z.body.pos.set(-8, 0, -4); poe(p, -8, 6); p.dwEnd = 1e12;
    const o = {}, ts = T.Z.toSpawn;
    T.FGSRV.apT = agora(); T.sim(1 / 30); o.tel = [CH.atk?.a.id, +(CH.atk.fa - CH.atk.t0).toFixed(2), tel().s]; T.sim(1.9); o.antes = T.campChefeLacVivos(); T.sim(.2);
    const lac = [...T.Z.zs.values()].filter(x => x.lac), L = T.FORNO.lacaio;
    o.lac = [lac.length, lac.every(x => Math.hypot(x.body.pos.x - L.x, x.body.pos.z - L.z) < 2), [...new Set(lac.map(x => x.kind))].join()]; o.fraco = z.fracoAte > agora();
    o.prox = +(T.FGSRV.apT - agora()).toFixed(1);
    for (let k = 0; k < 2; k++) { limpa(); T.campChefeAtaca(z, atk('apito'), p); T.sim(2.1); } o.teto = T.campChefeLacVivos();
    o.ts = T.Z.toSpawn === ts; o.k12 = T.ZKIND[12] ? 12 : 0;
    for (const x of [...T.Z.zs.values()]) if (x.lac) T.Z.zs.delete(x.id); limpa(); T.FGSRV.apT = 1e12;
    return o;
  });
  assert.deepEqual(r.tel, ['apito', 2, 2]); assert.equal(r.antes, 0, 'nada antes do apito'); assert.equal(r.lac[0], 4); assert.ok(r.lac[1], 'no pé da calha'); assert.equal(r.lac[2], String(r.k12), 'Carvoeiros (ou comuns sem o O3-D08)');
  assert.ok(r.fraco, 'recuperação do apito abre o fraco'); assert.ok(r.prox > 32 && r.prox <= 35, JSON.stringify(r)); assert.equal(r.teto, 8); assert.ok(r.ts, 'fora do toSpawn');
});

test('fases: 60% (inv 2 s, 2,6 m/s, rastro de brasa a 15/s, rachaduras), 25% (manômetro vermelho, explosão de pressão pelo relógio: 80, atrás do pilar nada, o pilar perde 1/3; Pregador no apito)', { timeout: 180000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, atk, idx, limpa, tel, pronto } = H; quieto(); limpa(); const z = pronto(); CH.fase = 0; z.hp = z.maxHp; z.body.pos.set(-8, 0, -4); poe(p, -8, 8); p.dwEnd = 1e12;
    const o = {}, ud = () => T.ZC.zs.get(z.id)?.model.userData, vis = b => b.scale.x > .5;
    T.sim(.1); o.mano1 = ud().mano.map(vis); o.racha1 = ud().racha.map(vis);
    z.hp = z.maxHp * .61; T.zHit(p, z.id, 5000, 'body', 'm1911', false); o.f2 = [CH.fase, +(z.hp / z.maxHp).toFixed(3), z.speed, +(CH.inv - agora()).toFixed(1)];
    const h0 = z.hp; T.zHit(p, z.id, 100, 'body', 'm1911', false); o.inv = h0 - z.hp; T.sim(2.1); o.cli2 = T.CAMP.c.ch.f; o.mano2 = ud().mano.map(vis); o.racha2 = ud().racha.map(vis);
    // rastro: ele anda 4 m; o jogador em cima do rastro leva 15/s
    z.atord = 0; z.body.pos.set(-8, 0, -4); T.FGSRV.rx = -8; T.FGSRV.rz = -4; T.sim(1 / 60);
    for (let k = 1; k <= 5; k++) { z.body.pos.set(-8, 0, -4 + k); T.sim(1 / 60); }
    o.rastro = T.FGSRV.rastro.length; z.body.pos.set(-8, 0, -12); z.speed = 0; p.dwEnd = 0; p.hp = 1000; poe(p, -8, -2.4); T.sim(1); o.rastroDano = 1000 - p.hp; p.dwEnd = 1e12;
    // fase 3
    CH.inv = 0; z.hp = z.maxHp * .26; T.zHit(p, z.id, 5000, 'body', 'm1911', false); o.f3 = [CH.fase, +(T.FGSRV.prT - agora()).toFixed(1)]; T.sim(2.1); o.mano3 = ud().mano.map(vis);
    // explosão de pressão pelo relógio (5 s depois da troca): aviso 3 s, disco de 7 m; atrás do pilar 3 (1, -7) não pega e o pilar perde 1/3
    quieto(); CH.prox = 1e12; z.body.pos.set(1, 0, -10); z.atord = 0; poe(p, 1, -4.5); p.dwEnd = 0; p.hp = 1000; const i3 = idx('forno-pilar-3'), hp3 = T.Z.zint[i3].hp ?? 3000;
    T.FGSRV.prT = agora(); T.FGSRV.apT = 1e12; T.sim(1 / 30); o.tp = [CH.atk?.a.id, tel().f, tel().s, tel().d1]; T.sim(2.9); o.pAntes = 1000 - p.hp; T.sim(.2); o.atras = 1000 - p.hp; o.pilar = [hp3, T.Z.zint[i3].hp]; o.fraco = z.fracoAte > agora();
    o.prox = +(T.FGSRV.prT - agora()).toFixed(1); T.sim(2.1); limpa();
    poe(p, -3, -10); p.hp = 1000; T.campChefeAtaca(z, atk('pressao'), p); T.sim(3.1); o.aberto = 1000 - p.hp; limpa();
    // apito da fase 3: o Pregador (ou comum sem o O3-D08) primeiro, depois os Carvoeiros
    for (const x of [...T.Z.zs.values()]) if (x.lac) T.Z.zs.delete(x.id);
    T.campChefeAtaca(z, atk('apito'), p); T.sim(2.1); o.lac3 = [...T.Z.zs.values()].filter(x => x.lac).length; o.k13 = [...T.Z.zs.values()].some(x => x.lac && x.kind === (T.ZKIND[13] ? 13 : 0));
    for (const x of [...T.Z.zs.values()]) if (x.lac) T.Z.zs.delete(x.id); limpa(); CH.fase = 0; T.FGSRV.prT = T.FGSRV.apT = 1e12; z.hp = z.maxHp * .9;
    return o;
  });
  assert.deepEqual(r.mano1, [true, false, false], 'manômetro verde'); assert.deepEqual(r.racha1, [false, false, false]);
  assert.equal(r.f2[0], 1); assert.equal(r.f2[1], .6, 'o golpe para no limite da fase'); assert.equal(r.f2[2], 2.6, 'fase 2: 2,6 m/s'); assert.equal(r.f2[3], 2, 'invulnerável 2 s'); assert.equal(r.inv, 0);
  assert.equal(r.cli2, 2); assert.deepEqual(r.mano2, [false, true, false]); assert.deepEqual(r.racha2, [true, true, true], 'couraça rachada');
  assert.ok(r.rastro >= 4, `rastro de brasa (${r.rastro})`); assert.ok(r.rastroDano >= 10 && r.rastroDano <= 15, `rastro: 15/s (${r.rastroDano})`);
  assert.equal(r.f3[0], 2); assert.equal(r.f3[1], 5); assert.deepEqual(r.mano3, [false, false, true], 'manômetro no vermelho');
  assert.deepEqual(r.tp, ['pressao', 'disco', 3, 7]); assert.equal(r.pAntes, 0); assert.equal(r.atras, 0, 'atrás do pilar ' + JSON.stringify(r)); assert.deepEqual(r.pilar, [3000, 2000], 'o pilar perdeu 1/3');
  assert.ok(r.fraco, 'a explosão abre o fraco'); assert.ok(r.prox > 11 && r.prox <= 15, `a cada 15 s (${r.prox})`); assert.equal(r.aberto, 80, 'no aberto: 80');
  assert.equal(r.lac3, 5, '4 Carvoeiros + 1 Pregador'); assert.ok(r.k13);
  assert.deepEqual(J.erros, []);
});

test('válvulas de vapor (atordoa 3 s, fraco aberto, cancela o ataque, zumbis 50/s, recarga 20 s) e a esteira (leva o atordoado à boca do forno 4: 4%/s; a boca dá 20/s; a lona leva o jogador); poço de cinzas', { timeout: 180000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, atk, idx, limpa, comum, pronto } = H; quieto(); limpa(); const z = pronto(); CH.fase = 0; z.hp = z.maxHp * .9; p.dwEnd = 1e12;
    const o = {}, i = idx('forno-valvula-1'), v = T.ZD.zint[i], [cx, cz] = T.fgValvC(v);
    // vapor: ele em cima da esteira, debaixo do bocal; um comum dentro da coluna
    z.body.pos.set(cx, 0, cz); poe(p, v.x + 1.2, v.z + 1); T.campChefeAtaca(z, atk('brasa'), p); const c = comum(cx + 1.5, cz + .5, 400);
    T.srvZUse(p, { k: 'zint', id: i }); T.sim(1 / 60); o.vapor = [T.Z.zint[i].st, T.ZC.zint[i].st, T.ZC.world.zint[i].vap.visible];
    o.atord = [+(z.atord - agora()).toFixed(1), z.fracoAte >= z.atord - 1e-6, CH.atk];
    T.srvZUse(p, { k: 'zint', id: i }); o.duplo = T.Z.zint[i].st;
    T.sim(1); o.esteira = +z.body.pos.z.toFixed(2); o.comum = c.hp; T.sim(1.05); o.rec = [T.Z.zint[i].st, +(T.Z.zint[i].t - agora()).toFixed(0), T.ZC.world.zint[i].vap.visible]; o.comumMorto = !T.Z.zs.has(c.id);
    z.atord = 0; z.body.pos.set(-8, 0, -4); T.srvZUse(p, { k: 'zint', id: i }); o.recUsa = T.Z.zint[i].st; T.sim(20); o.volta = T.Z.zint[i].st;
    // boca do forno 4: atordoado na esteira, perto da boca: 4%/s
    const fz = T.fornoFace(); z.body.pos.set(6, 0, fz + 1.5); z.atord = agora() + 2; CH.inv = 0; const h = z.hp; T.sim(2);
    o.boca = [+((h - z.hp) / z.maxHp).toFixed(3), +z.body.pos.z.toFixed(2)]; z.atord = 0; z.body.pos.set(-8, 0, -4);
    // jogador na boca: 20/s
    p.dwEnd = 0; p.hp = 1000; poe(p, 6, fz + 1); T.sim(2); o.bocaJog = 1000 - p.hp; p.dwEnd = 1e12;
    // cliente: a lona leva o jogador 1,5 m/s para o norte
    poe(p, 6, 10); const z0 = T.me.pos.z; for (let k = 0; k < 60; k++) T.fornoAnim(1 / 60); o.lona = +(z0 - T.me.pos.z).toFixed(2);
    poe(p, 0, 10); const z1 = T.me.pos.z; for (let k = 0; k < 30; k++) T.fornoAnim(1 / 60); o.foraLona = +(z1 - T.me.pos.z).toFixed(2);
    // poço de cinzas: ×0,6 no zumbi (e volta ao sair)
    const P = T.FORNO.poco, c2 = comum((P[0] + P[1]) / 2, (P[2] + P[3]) / 2, 400); c2.cv = undefined; T.sim(.1); o.poco = c2.cv; c2.body.pos.set(0, 0, 10); T.sim(.1); o.sai = +(c2.cv ?? 1).toFixed(3); T.Z.zs.delete(c2.id);
    limpa(); return o;
  });
  assert.deepEqual(r.vapor, ['vapor', 'vapor', true]); assert.deepEqual(r.atord, [3, true, null], 'atordoado 3 s, fraco aberto, o ataque caiu'); assert.equal(r.duplo, 'vapor');
  assert.ok(r.esteira < -18.9 && r.esteira > -19.3, `a esteira leva o atordoado 1,5 m/s (${r.esteira})`); assert.ok(r.comum > 330 && r.comum < 360, `zumbi no vapor 50/s (${r.comum})`);
  assert.deepEqual(r.rec, ['recarga', 20, false]); assert.equal(r.comumMorto, false); assert.equal(r.recUsa, 'recarga'); assert.equal(r.volta, 'pronto');
  assert.ok(r.boca[0] >= .078 && r.boca[0] <= .082, '4%/s por 2 s na boca ' + JSON.stringify(r)); assert.ok(r.boca[1] <= -21.8, 'chegou à boca');
  assert.ok(r.bocaJog >= 35 && r.bocaJog <= 40, `boca: 20/s no jogador (${r.bocaJog})`);
  assert.ok(Math.abs(r.lona - 1.5) < .05, `lona: 1,5 m em 1 s (${r.lona})`); assert.equal(r.foraLona, 0);
  assert.equal(r.poco, .6); assert.equal(r.sai, 1);
  assert.deepEqual(J.erros, []);
});

test('ponto fraco: por trás sempre (×3); de frente só na janela (recuperação ou atordoado)', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, limpa, pronto } = H; quieto(); limpa(); const z = pronto(); CH.fase = 0; z.body.pos.set(-8, 0, -2); z.yaw = 0; z.tgt = null; z.tgtT = 1e12; z.hp = z.maxHp * .9; p.dwEnd = 1e12; p.inv.secondary = p.inv.primary = 'm1911';
    const o = {}, tiro = (x, zz) => { poe(p, x, zz); T.sim(.6); const h = z.hp; T.sendToHost({ t: 'zhit', v: z.id, w: 'm1911', dmg: 1e6, z: 'fraco' }); T.sim(1 / 60); return +(h - z.hp).toFixed(2); };
    o.w = T.W.m1911.dmg; o.max = z.maxHp; o.frente = tiro(-8, -9); o.tras = tiro(-8, 5); // yaw 0: frente para -z
    z.fracoAte = agora() + 5; o.janela = tiro(-8, -9); z.fracoAte = 0; z.yaw = 0;
    return o;
  });
  assert.ok(Math.abs(r.frente - Math.min(r.w * 1.1, r.max * .06)) < 1e-3, `de frente, fechado: vale corpo (${r.frente}) ` + JSON.stringify(r));
  assert.ok(Math.abs(r.tras - Math.min(r.w * 3 * 1.1, r.max * .1)) < 1e-3, `por trás: ×3 (${r.tras}) ` + JSON.stringify(r));
  assert.ok(Math.abs(r.janela - r.tras) < 1e-3, `de frente com a janela aberta: ×3 (${r.janela})`);
});

test('quem entra no meio: espectador na rodada de chefe; recebe o chefe, a fase, o aviso no ar e a válvula em recarga', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, poe, quieto, atk, idx, limpa, pronto } = H; quieto(); limpa(); const z = pronto(); CH.fase = 1; z.body.pos.set(-8, 0, -4); poe(p, -6, -19);
    const i = idx('forno-valvula-2'), v = T.ZD.zint[i]; poe(p, v.x + 1, v.z); T.srvZUse(p, { k: 'zint', id: i }); T.sim(2.2); poe(p, -6, -19);
    T.campChefeAtaca(z, atk('forno'), p); T.sim(.1);
    const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; } };
    T.srvOnData(c, { t: 'join', v: 2, pv: 6, name: 'Meio' }); T.sim(.2);
    const q = T.S.players.get(c.pid), st = c.out.filter(m => m.t === 'state' && m.z).pop(), cp = st?.z?.cp;
    const o = { vivo: q?.alive, ch: cp?.ch?.slice(0, 3), tel: cp?.tel?.[0]?.a, zint: st?.z?.zi?.[i]?.[0] ?? null };
    T.srvDrop(c); T.campCliReset(); T.campSync(cp); T.sim(1 / 60); o.cli = T.CAMP.c.ch && [T.CAMP.c.ch.k, T.CAMP.c.ch.f]; CH.fase = 0; limpa(); T.sim(20);
    return o;
  });
  assert.equal(r.vivo, false, 'espectador na rodada de chefe'); assert.deepEqual(r.ch, [15, r.ch[1], 2]); assert.equal(r.tel, 'forno'); assert.equal(r.zint, 'recarga'); assert.deepEqual(r.cli, [15, 2]);
});

test('morte: lacaios e comuns caem sem pontos, objetivo feito, cena c4-fim e a etapa acaba (Galeria 7 com bagagem ou o fim da campanha)', { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, poe, quieto, limpa, pronto } = H; quieto(); limpa(); const z = pronto(); CH.fase = 2; z.body.pos.set(-8, 0, -4); poe(p, 0, 10); p.dwEnd = 1e12;
    T.campChefeLacaios({ tipo: 0, n: 2, max: 9 }); { T.Z.toSpawn++; T.zSpawnOne(); } T.Z.toSpawn = 3;
    p.money = 7777; p.inv.secondary = 'galil_pap'; p.perks = ['jug', 'speed']; p.maxHp = 250;
    z.hp = 10; const m0 = p.money; T.zHit(p, z.id, 100, 'body', 'm1911', false);
    const o = { zs: T.Z.zs.size, ts: T.Z.toSpawn, obj: T.campEstado().obj['C2.1']?.st, ch: T.CAMP_CH.z, srv: T.FGSRV.z, pts: p.money - m0 };
    T.sim(.3); o.ph = T.Z.phase; o.fim = T.CAMP.fim && { prox: T.CAMP.fim.prox, troca: T.CAMP.fim.troca }; o.gal = !!T.MAPS.galeria7;
    o.cena = JSON.stringify(T.CAMP.c.cena?.L || '').includes('O apito se cala');
    T.sim(T.CAMP.fim.t - window.__simNow + .05);
    if (o.gal) { T.sendToHost({ t: 'camp', k: 'pronto' }); T.sim(.1); T.sim(T.Z.phaseEnd - window.__simNow + .2); o.mapa = T.fornoEstado().mapa; o.et = T.CAMP.et; o.round = T.Z.round; o.bag = [p.money >= m0, p.inv.secondary, p.perks.join(), p.maxHp]; }
    else { o.over = T.CAMP.over; o.fimCamp = T.campSalvo().dif[1].fim; }
    return o;
  });
  assert.equal(r.zs, 0); assert.equal(r.ts, 0); assert.equal(r.obj, 'feito'); assert.equal(r.ch, null); assert.equal(r.srv, null); assert.ok(r.pts >= 500, 'recompensa +500');
  assert.notEqual(r.ph, 'round'); assert.ok(r.cena, 'cena c4-fim');
  if (r.gal) { assert.deepEqual(r.fim, { prox: 6, troca: true }); assert.equal(r.mapa, 'galeria7'); assert.equal(r.et, 6); assert.equal(r.round, 21); assert.deepEqual(r.bag, [true, 'galil_pap', 'jug,speed', 250]); }
  else { assert.deepEqual(r.fim, { prox: -1, troca: false }); assert.equal(r.over, true, 'sem a Galeria 7: fim da campanha'); assert.equal(r.fimCamp, true); }
  assert.deepEqual(J.erros, []);
});

test('a arena monta e desmonta sem vazar: Sanatório -> Forno -> Sanatório volta às mesmas contas', { timeout: 900000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const ida = e => { T.Z.zs.clear(); T.Z.toSpawn = 0; T.campTrocaMapa(e); T.sim(.1); T.sendToHost({ t: 'camp', k: 'pronto' }); T.sim(.1); T.sim(T.Z.phaseEnd - window.__simNow + .2); };
    ida(4); const B = { mapa: T.fornoEstado().mapa, col: T.COL().length, geo: T.renderer.info.memory.geometries, tex: T.renderer.info.memory.textures };
    ida(5); const f = { mapa: T.fornoEstado().mapa, round: T.Z.round, col: T.COL().length, ch: !!T.CAMP_CH.z || T.CAMP.obj['C2.1']?.st === 'ativo', anim: T.fornoEstado().anim };
    ida(4);
    return { B, f, mapa: T.fornoEstado().mapa, col: T.COL().length, geo: T.renderer.info.memory.geometries, tex: T.renderer.info.memory.textures, est: T.fornoEstado(), v: [T.FORNO_V.portas, T.FORNO_V.chama] };
  });
  assert.equal(r.B.mapa, 'sanatorio'); assert.equal(r.f.mapa, 'forno'); assert.equal(r.f.round, 20); assert.ok(r.f.ch); assert.ok(r.f.anim); assert.equal(r.mapa, 'sanatorio');
  assert.equal(r.col, r.B.col, 'COL do Sanatório igual'); assert.ok(r.geo <= r.B.geo * 1.05 + 20, `geometrias ${r.B.geo} -> ${r.geo}`); assert.ok(r.tex <= r.B.tex + 4, `texturas ${r.B.tex} -> ${r.tex}`);
  assert.equal(r.est.anim, false); assert.notEqual(r.est.chama, true, 'o fogo ficou fora da cena'); assert.deepEqual(r.v, [null, null], 'peças da arena soltas');
  assert.deepEqual(J.erros, []);
});
