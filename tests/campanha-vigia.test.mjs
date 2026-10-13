// O Vigia e a arena Forte Velho (Onda 3, O3-D09; docs/overhaul/campanha.md §7.2, §8.1): o clássico sem a arena (menu, ZKIND sem
// buraco), a troca Vila -> Forte -> Sanatório com bagagem, a rodada 10 (16 comuns, energia ligada, sem PaP), cada fase (torre na 2,
// apagão e descida na 3) e cada ataque com aviso antes do dano (varredura marca, rajada com cobertura, granada de cal, baioneta que
// atordoa no pilar, pelotão pelos portões com teto), ponto fraco (por trás e na janela) e o gerador do holofote ('curto'), arame
// farpado, quem entra no meio, a morte que encerra a etapa e leva ao Ato III, e a arena que monta e desmonta sem vazar.
// Rodar: node --test tests/campanha-vigia.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 }); }, { timeout: 240000 });
after(async () => { await J?.fechar(); });

const PREP = `(T => {
  const p = T.S.players.get('h'), CH = T.CAMP_CH, agora = () => window.__simNow;
  const poe = (q, x, z, y = 0) => { q.pos = [x, y, z]; if (q === p) { T.me.pos.set(x, y, z); T.me.vel.set(0, 0, 0); } };
  const quieto = () => { const z = CH.z; T.Z.reQ = []; if (z) { z.speed = 0; z.atkT = 1e12; z.chkT = 1e12; } CH.prox = 1e12; T.VGSRV.pelT = 1e12; T.Z.spawnT = 1e12; T.Z.toSpawn = Math.max(T.Z.toSpawn, 5); for (const o of [...T.Z.zs.values()]) if (o !== z) T.Z.zs.delete(o.id); };
  const atk = id => CH.def.ataques.find(a => a.id === id);
  const idx = id => T.ZD.zint.findIndex(o => o.id === id);
  const limpa = () => { if (CH.atk) { CH.atk = null; T.broadcast({ t: 'camp', k: 'telx' }); } };
  return { p, CH, agora, poe, quieto, atk, idx, limpa };
})`;
const em = fn => `(T, arg) => { const H = (new Function('return ' + arg.PREP)())(T); return (${fn})(T, arg, H); }`;
const rodar = (fn, a = {}) => J.page.evaluate(([src, arg]) => (new Function('T', 'arg', `return (${src})(T, arg)`))(window.__T, arg), [em(fn.toString()), { PREP, ...a }]);

test('clássico sem a arena: fora dos cartões e do formulário (mesmo partindo do st da arena), ZKIND sem buraco, especiais do clássico intactos', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, T => {
    const cards = [...document.querySelectorAll('#hostForm [data-map]')].map(b => b.dataset.map);
    const el = document.createElement('div'); document.body.appendChild(el);
    const g1 = T.matchForm(el, { mode: 'zombies', map: 'forte', zmap: 'forte', zmode: 'campanha', ato: 1, zdiff: 1 }); // lobby/pausa depois da arena
    el.querySelector('[data-zm="classico"]').click(); const o1 = g1(); const cardsZ = [...el.querySelectorAll('[data-map]')].map(b => b.dataset.map);
    const g2 = T.matchForm(el, { mode: 'dm', map: 'forte', cmap: 'forte' }); const o2 = g2(); el.remove();
    const buracos = []; for (let k = 0; k < T.ZKIND.length; k++) if (!(k in T.ZKIND)) buracos.push(k);
    const mix0 = [T.Z.mix, T.Z.mixN]; T.zMix(10, 30, 1); const mixN = T.Z.mixN; [T.Z.mix, T.Z.mixN] = mix0;
    return { cards, cardsZ, z1: [o1.map, o1.zmap, o1.zmode], m2: o2.map, buracos, mixN, on: T.CAMP.on, camp: T.MAPS.forte.camp, k14: [T.ZKIND[14].n, T.ZKIND[14].chefe], ch: T.campChefeEstado().id };
  });
  assert.ok(!r.cards.includes('forte') && !r.cardsZ.includes('forte'), 'a arena não aparece nos cartões'); assert.equal(r.camp, 1);
  assert.deepEqual(r.z1, ['vila', 'vila', 'classico'], 'partindo do st da arena, o clássico cai na Vila'); assert.equal(r.m2, 'arena', 'PvP nunca na arena');
  assert.deepEqual(r.buracos, [], 'ZKIND sem buraco (o zMix soma todos)'); assert.ok(Number.isFinite(r.mixN) && r.mixN > 0, `especiais do clássico na rodada 10 (${r.mixN})`);
  assert.equal(r.on, false); assert.deepEqual(r.k14, ['O Vigia', 1]); assert.equal(r.ch, null);
  assert.deepEqual(J.erros, []);
});

test('Vila -> Forte: bagagem, rodada 10 com 16 comuns pelos portões, energia ligada, sem PaP, o Vigia sobe da trincheira', { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p } = H; T.campLibera(4, 3); T.CAMP_ATOS[1].objs = []; T.CAMP_ATOS[1].ini = []; // Ato II sem objetivos (os de verdade são do O3-D10)
    T.S.st = { ...T.S.st, zmode: 'campanha', ato: 1 }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    const o = { et0: T.CAMP.et, mapa0: T.forteEstado().mapa };
    T.sim(T.Z.phaseEnd - window.__simNow + .2);
    p.money = 4321; p.inv.secondary = 'galil_pap'; p.perks = ['jug']; p.maxHp = 250;
    T.Z.zs.clear(); T.Z.toSpawn = 0; T.Z.round = 9; T.campFimEtapa(); o.fim = { prox: T.CAMP.fim?.prox, troca: T.CAMP.fim?.troca };
    T.sim(T.CAMP.fim.t - window.__simNow + .05); o.tr = T.CAMP.trans?.fase; o.mapa = T.forteEstado().mapa; o.et = T.CAMP.et;
    T.sendToHost({ t: 'camp', k: 'pronto' }); T.sim(.1); T.sim(T.Z.phaseEnd - window.__simNow + .2);
    o.round = T.Z.round; o.ph = T.Z.phase; o.ts = T.Z.toSpawn + [...T.Z.zs.values()].filter(x => !T.ZKIND[x.kind]?.chefe).length; o.mixN = T.Z.mixN; o.power = T.Z.power; o.cpower = T.ZC.power;
    o.bag = [p.money, p.inv.secondary, p.perks.join(), p.maxHp, p.alive];
    o.est = T.forteEstado(); o.zint = T.ZD.zint.map(x => x.t).join(); o.wins = T.ZD.windows.length;
    T.sim(3); const z = T.CAMP_CH.z;
    o.ch = T.campChefeEstado(); o.hp = z?.maxHp; o.esp = Math.round(T.zHp(10) * 10); o.obj = T.campEstado().obj['C1.1']?.st;
    o.portoes = [...T.Z.zs.values()].filter(x => x !== z).every(x => x.win >= 0); o.cli = T.CAMP.c.ch?.k; o.bar = document.getElementById('zboss').firstChild.nodeValue;
    return o;
  });
  assert.equal(r.mapa0, 'vila'); assert.equal(r.et0, 1); assert.deepEqual(r.fim, { prox: 2, troca: true });
  assert.equal(r.tr, 'carga'); assert.equal(r.mapa, 'forte'); assert.equal(r.et, 2);
  assert.equal(r.round, 10); assert.equal(r.ph, 'round'); assert.equal(r.ts, 16, '16 comuns (Normal) ' + JSON.stringify(r)); assert.equal(r.mixN, 0, 'sem especiais do clássico na arena');
  assert.equal(r.power, true); assert.equal(r.cpower, true); assert.equal(r.est.pap, false, 'PaP escondido'); assert.equal(r.est.anim, true);
  assert.deepEqual(r.bag, [4321, 'galil_pap', 'jug', 250, true], 'bagagem levada');
  assert.equal(r.zint, 'pilar,pilar,pilar,pilar,pilar,pilar,pilar,pilar,barril,barril,barril,barril,curto,municao,nota'); assert.equal(r.wins, 4);
  assert.equal(r.ch.k, 14); assert.equal(r.hp, r.esp, 'vida = zHp(10)·(6 + 4·1) = 10 450'); assert.equal(r.obj, 'ativo'); assert.ok(r.portoes, 'comuns pelos portões');
  assert.equal(r.cli, 14); assert.equal(r.bar, 'O VIGIA · FASE 1');
  assert.deepEqual(J.erros, []);
});

test('ataques com aviso antes do dano: varredura marca (0,3 s na luz), rajada (3 tiros; atrás da mureta não leva e a mureta gasta), granada de cal', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, atk, limpa } = H; quieto(); const z = CH.z; z.st = 'in'; CH.inv = 0; z.body.pos.set(0, 0, -10); p.hp = p.maxHp = 1000; p.dwEnd = 0; p.campMarca = 0; p.crouch = 0;
    const o = {}; const tel = () => T.CAMP.c.tel[T.CAMP.c.tel.length - 1];
    // varredura: o setor passa pelo jogador; marca depois de 0,3 s dentro
    z.body.pos.set(-4, 0, -10); poe(p, -4, -2); T.CAMP.c.tel = []; T.campChefeAtaca(z, atk('varredura'), p); T.sim(1 / 60); o.tv = { s: tel().s, f: tel().f, g: tel().g };
    T.sim(.9); o.marcaAviso = p.campMarca > agora(); T.sim(2.6); o.marca = p.campMarca > agora(); o.alvo = T.vgAlvo(z) === p; limpa(); p.campMarca = 0; T.sim(.1);
    // rajada: 22 × 3 no Normal, só depois de 0,8 s
    poe(p, -4, -2); const h0 = p.hp; T.campChefeAtaca(z, atk('rajada'), p); o.tr = tel().s; T.sim(.75); o.antes = h0 - p.hp; T.sim(.6); o.rajada = h0 - p.hp; o.fraco = z.fracoAte > agora();
    T.sim(1.5); limpa();
    // agachado atrás dos sacos (forte-sacos-1 em -9, -11): a linha do chefe (-9, -16) até o jogador passa pelos sacos
    z.body.pos.set(-11, 0, -9); poe(p, -19.5, -9); const h1 = p.hp, i1 = H.idx('forte-mureta-1'); T.campChefeAtaca(z, atk('rajada'), p); T.sim(1.5); o.coberto = h1 - p.hp; o.mureta = T.Z.zint[i1].hp; limpa(); T.sim(1.5);
    // granada de cal: disco no alvo (35) e a cal nos olhos (mensagem só para ele)
    z.body.pos.set(0, 0, -10); poe(p, 0, 0); const h2 = p.hp; T.campChefeAtaca(z, atk('granada'), p); o.tg = tel().s; T.sim(1.1); o.gAntes = h2 - p.hp; T.sim(.3); o.granada = h2 - p.hp; o.cal = T.VGCLI.calFim > agora() || !!document.getElementById('zkCal') || !!T.CAMP_ZKC?.calEl;
    limpa(); return o;
  });
  assert.deepEqual(r.tv, { s: 1, f: 'setor', g: 120 }); assert.equal(r.marcaAviso, false, 'aviso não marca'); assert.ok(r.marca && r.alvo, 'marcado e preferido ' + JSON.stringify(r));
  assert.equal(r.tr, .8); assert.equal(r.antes, 0); assert.equal(r.rajada, 66, 'rajada: 3 × 22'); assert.ok(r.fraco, 'recuperação da rajada abre o fraco');
  assert.equal(r.coberto, 0, 'atrás da mureta ' + JSON.stringify(r)); assert.equal(r.mureta, 4000 - 250, 'a mureta segurou a rajada (250)'); assert.equal(r.tg, 1.2); assert.equal(r.gAntes, 0); assert.equal(r.granada, 35); assert.ok(r.cal, 'cal nos olhos');
});

test('fases: 66% sobe na torre (3 m) pela escada; 33% o holofote quebra (apagão), ele desce, leva ×1,15 e investe de baioneta', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, atk, limpa } = H; quieto(); const z = CH.z; z.st = 'in'; CH.inv = 0; CH.fase = 0; z.hp = z.maxHp; z.body.pos.set(0, 0, -10); poe(p, 0, 12); p.dwEnd = 1e12;
    const o = {};
    T.zHit(p, z.id, z.maxHp * .5, 'body', 'm1911', false); z.hp = z.maxHp * .67; T.zHit(p, z.id, 5000, 'body', 'm1911', false);
    o.f2 = [CH.fase, T.VGSRV.modo]; T.sim(1.5); o.subindo = [T.VGSRV.modo, +z.body.pos.y.toFixed(2)];
    T.sim(9); o.torre = [T.VGSRV.modo, +z.body.pos.y.toFixed(2), +Math.hypot(z.body.pos.x, z.body.pos.z).toFixed(2)]; o.cli2 = T.CAMP.c.ch.f;
    T.sim(2); CH.inv = 0; z.hp = z.maxHp * .34; T.zHit(p, z.id, 5000, 'body', 'm1911', false);
    o.f3 = [CH.fase, T.VGSRV.modo, z.speed]; T.sim(.2); o.apagao = T.forteEstado().hemi; o.pool = T.ZC.world.pool.map(P => P.L.intensity).every(v => v === 0); o.cone = T.FORTE_V.cone.visible;
    T.sim(10); o.chao = [T.VGSRV.modo, +z.body.pos.y.toFixed(2)];
    CH.inv = 0; const h = z.hp; T.zHit(p, z.id, 100, 'body', 'm1911', false); o.k3 = h - z.hp;
    // baioneta: investe até o pilar (forte-sacos-2 em 9, -12) e fica atordoado com o fraco aberto
    quieto(); limpa(); z.body.pos.set(9, 0, -18); z.st = 'in'; poe(p, 9, -6); p.dwEnd = 0; p.hp = p.maxHp = 1000;
    T.campChefeAtaca(z, atk('baioneta'), p); o.tb = T.CAMP.c.tel[T.CAMP.c.tel.length - 1].s; T.sim(.65); o.bAntes = +z.body.pos.z.toFixed(2); T.sim(2.6);
    o.bat = [z.atord > agora(), z.fracoAte > agora(), +z.body.pos.z.toFixed(1), T.Z.zint[H.idx('forte-sacos-2')].hp];
    limpa(); return o;
  });
  assert.deepEqual(r.f2, [1, 'sobe']); assert.equal(r.subindo[0], 'sobe');
  assert.deepEqual(r.torre, ['torre', 3, 0], 'em cima da torre, no meio'); assert.equal(r.cli2, 2);
  assert.equal(r.f3[0], 2); assert.equal(r.f3[1], 'desce'); assert.equal(r.f3[2], 3, 'fase 3: 3,0 m/s');
  assert.ok(r.pool, 'apagão: o pool de luz da arena apaga'); assert.equal(r.cone, false, 'holofote quebrado: sem cone');
  assert.deepEqual(r.chao, ['chao', 0]); assert.equal(r.k3, 115, 'fase 3: ×1,15');
  assert.equal(r.tb, .7); assert.equal(r.bAntes, -18, 'parado no aviso'); assert.deepEqual(r.bat.slice(0, 2), [true, true], 'bateu no pilar: atordoado e fraco aberto');
  assert.ok(r.bat[2] < -12.5 && r.bat[2] > -16, `parou no pilar (${r.bat[2]})`); assert.equal(r.bat[3], 1500 - 600, 'o pilar levou o golpe (600) ' + JSON.stringify(r));
});

test('ponto fraco: por trás sempre; de frente só na janela; o gerador do holofote atordoa 4 s, recarrega 40 s e não vale na fase 3', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, atk, idx, limpa } = H; quieto(); limpa(); const z = CH.z; z.st = 'in'; CH.inv = 0; CH.fase = 0; z.atord = 0; z.fracoAte = 0; T.VGSRV.modo = 'chao';
    z.body.pos.set(0, 0, -10); z.yaw = 0; z.tgt = null; z.tgtT = 1e12; p.campMarca = 0; z.hp = z.maxHp * .9; p.dwEnd = 1e12; p.inv.secondary = p.inv.primary = 'm1911';
    const o = {}, tiro = (x, zz) => { poe(p, x, zz); T.sim(.6); const h = z.hp; T.sendToHost({ t: 'zhit', v: z.id, w: 'm1911', dmg: 1e6, z: 'fraco' }); T.sim(1 / 60); return +(h - z.hp).toFixed(2); };
    const w = T.W.m1911.dmg; o.w = w; o.frente = tiro(0, -16); o.tras = tiro(0, -4); // yaw 0: frente para -z (o jogador em -16 está na frente)
    // gerador (curto)
    const i = idx('forte-gerador'), g = T.ZD.zint[i]; quieto(); T.campChefeAtaca(z, atk('varredura'), p); poe(p, g.x + 1.6, g.z); T.srvZUse(p, { k: 'zint', id: i });
    o.curto = [T.Z.zint[i].st, +(z.atord - agora()).toFixed(2), z.fracoAte >= z.atord - 1e-6, CH.atk, T.ZC.zint[i].st];
    T.srvZUse(p, { k: 'zint', id: i }); o.recarga = +(T.Z.zint[i].t - agora()).toFixed(1); T.sim(40.2); o.volta = T.Z.zint[i].st;
    CH.fase = 2; T.srvZUse(p, { k: 'zint', id: i }); o.f3 = T.Z.zint[i].st; CH.fase = 0; z.atord = 0;
    return o;
  });
  assert.ok(Math.abs(r.frente - Math.min(r.w * 1.1, 10450 * .06)) < 1e-3, `de frente, fechado: vale corpo (${r.frente})`);
  assert.ok(Math.abs(r.tras - Math.min(r.w * 3 * 1.1, 10450 * .1)) < 1e-3, `por trás: ×3 (${r.tras}) ` + JSON.stringify(r));
  assert.deepEqual(r.curto, ['recarga', 4, true, null, 'recarga'], 'curto: atordoa 4 s, abre o fraco, cancela a varredura'); assert.equal(r.recarga, 40);
  assert.equal(r.volta, 'pronto'); assert.equal(r.f3, 'pronto', 'fase 3: sem efeito');
});

test('pelotão: apito (1,5 s), 3 Soldados pelos portões marcados lacaio, teto 6 (fase 3: 9), fora do toSpawn; o relógio chama a cada 30/20/15 s', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, atk, limpa } = H; quieto(); limpa(); const z = CH.z; z.st = 'in'; CH.inv = 0; CH.fase = 0; z.atord = 0; T.VGSRV.modo = 'chao'; z.body.pos.set(0, 0, -10); poe(p, 0, 10); p.dwEnd = 1e12;
    const o = {}, ts = T.Z.toSpawn;
    T.VGSRV.pelT = agora(); T.sim(1 / 30); o.tel = [CH.atk?.a.id, +(CH.atk.fa - CH.atk.t0).toFixed(2)]; T.sim(1.4); o.antes = T.campChefeLacVivos(); T.sim(.2);
    const lac = [...T.Z.zs.values()].filter(x => x.lac); o.lac = [lac.length, lac.every(x => x.win >= 0), [...new Set(lac.map(x => x.kind))].join()];
    o.prox = +(T.VGSRV.pelT - agora()).toFixed(1);
    o.dbg = []; for (let k = 0; k < 3; k++) { limpa(); T.campChefeAtaca(z, atk('pelotao'), p); T.sim(1.6); o.dbg.push([T.campChefeLacVivos(), T.Z.zs.size, CH.atk?.a.id, z.st, CH.z === z, T.Z.phase, T.CAMP.on]); } o.teto = T.campChefeLacVivos();
    CH.fase = 2; for (let k = 0; k < 2; k++) { limpa(); T.campChefeAtaca(z, atk('pelotao-3'), p); T.sim(1.6); } o.teto3 = T.campChefeLacVivos(); CH.fase = 0;
    o.ts = T.Z.toSpawn === ts; o.k8 = T.ZKIND[8] ? 8 : 0;
    for (const x of [...T.Z.zs.values()]) if (x.lac) T.Z.zs.delete(x.id); limpa(); T.VGSRV.pelT = 1e12;
    return o;
  });
  assert.deepEqual(r.tel, ['pelotao', 1.5]); assert.equal(r.antes, 0, 'nada antes do apito'); assert.equal(r.lac[0], 3); assert.ok(r.lac[1], 'pelos portões'); assert.equal(r.lac[2], String(r.k8), 'Soldados');
  assert.ok(r.prox > 28 && r.prox <= 30, JSON.stringify(r)); assert.equal(r.teto, 6); assert.equal(r.teto3, 9); assert.ok(r.ts, 'fora do toSpawn');
});

test('arame farpado: jogador 10/s; zumbi ×0,5 e 10/s; o chefe passa ileso', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, poe, quieto } = H; quieto(); const z = CH.z, A = T.FORTE.arame[0], x = (A[0] + A[1]) / 2, zz = (A[2] + A[3]) / 2;
    p.dwEnd = 0; p.hp = p.maxHp = 1000; p.perks = []; poe(p, x, zz); const h = p.hp; T.sim(1.02); const o = { jog: h - p.hp }; poe(p, 0, 12);
    const id = T.Z.nextId; T.Z.toSpawn++; T.zSpawnOne(); const c = T.Z.zs.get(id); c.st = 'in'; c.speed = 0; c.hp = c.maxHp = 1000; c.body.pos.set(x, 0, zz); c.cv = undefined;
    T.sim(1.02); o.dbg = [T.Z.zs.has(id), c.st, c.body.pos.x, c.body.pos.z, c.kind, T.Z.phase]; o.zumbi = [c.cv, 1000 - c.hp]; c.body.pos.set(0, 0, 0); T.sim(.1); o.sai = c.cv ?? null; T.Z.zs.delete(id);
    z.body.pos.set(x, 0, zz); z.st = 'in'; const hz = z.hp; T.sim(1); o.chefe = [hz - z.hp, z.cv ?? null]; z.body.pos.set(0, 0, -10);
    return o;
  });
  assert.equal(r.jog, 10, JSON.stringify(r)); assert.deepEqual(r.zumbi, [.5, 10], JSON.stringify(r)); assert.equal(r.sai, null, 'fora do arame volta ao normal'); assert.deepEqual(r.chefe, [0, null]);
});

test('quem entra no meio: espectador até a troca, recebe o chefe, a fase, o aviso no ar e o estado do gerador', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, poe, quieto, atk, idx, limpa } = H; quieto(); limpa(); const z = CH.z; z.st = 'in'; CH.inv = 0; CH.fase = 1; z.body.pos.set(0, 0, -10); poe(p, 0, 10);
    const i = idx('forte-gerador'); T.Z.zint[i].st = 'pronto'; T.zintPoe?.(i, 'recarga', 30, null); if (T.Z.zint[i].st !== 'recarga') { const g = T.ZD.zint[i]; poe(p, g.x + 1.6, g.z); T.srvZUse(p, { k: 'zint', id: i }); }
    T.campChefeAtaca(z, atk('rajada'), p); T.sim(.1);
    const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; } };
    T.srvOnData(c, { t: 'join', v: 2, pv: 5, name: 'Meio' }); T.sim(.2);
    const q = T.S.players.get(c.pid), st = c.out.filter(m => m.t === 'state' && m.z).pop(), cp = st?.z?.cp;
    const o = { vivo: q?.alive, ch: cp?.ch?.slice(0, 3), tel: cp?.tel?.[0]?.a, zint: st?.z?.zi?.[i]?.[0] ?? null };
    T.srvDrop(c); T.campCliReset(); T.campSync(cp); T.sim(1 / 60); o.cli = T.CAMP.c.ch && [T.CAMP.c.ch.k, T.CAMP.c.ch.f]; CH.fase = 0; limpa();
    return o;
  });
  assert.equal(r.vivo, false, 'espectador na rodada de chefe'); assert.deepEqual(r.ch, [14, r.ch[1], 2]); assert.equal(r.tel, 'rajada'); assert.deepEqual(r.cli, [14, 2]);
});

test('morte: lacaios e comuns caem, objetivo feito, cenas c2-fim + c3-abertura e a troca para o Sanatório (rodada 11) com bagagem', { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, poe, quieto, limpa } = H; quieto(); limpa(); const z = CH.z; z.st = 'in'; CH.inv = 0; CH.fase = 2; T.VGSRV.modo = 'chao'; z.body.pos.set(0, 0, -10); poe(p, 0, 10); p.dwEnd = 1e12;
    T.campChefeLacaios({ tipo: 0, n: 2, max: 9 }); { const id = T.Z.nextId; T.Z.toSpawn++; T.zSpawnOne(); } T.Z.toSpawn = 3;
    p.money = 7777; p.inv.secondary = 'galil_pap'; p.perks = ['jug', 'speed']; p.maxHp = 250;
    z.hp = 10; T.zHit(p, z.id, 100, 'body', 'm1911', false);
    const o = { zs: T.Z.zs.size, ts: T.Z.toSpawn, obj: T.campEstado().obj['C1.1']?.st, ch: T.CAMP_CH.z };
    const m0 = p.money; T.sim(.3); o.ph = T.Z.phase; o.fim = T.CAMP.fim && { prox: T.CAMP.fim.prox, troca: T.CAMP.fim.troca };
    o.cena = JSON.stringify(T.CAMP.c.cena?.L || '').includes('holofote se apaga') && JSON.stringify(T.CAMP.c.cena?.L || '').includes('SANATÓRIO');
    o.salvo = T.campSalvo().dif[1].ato;
    T.sim(T.CAMP.fim.t - window.__simNow + .05); T.sendToHost({ t: 'camp', k: 'pronto' }); T.sim(.1); T.sim(T.Z.phaseEnd - window.__simNow + .2);
    o.mapa = T.forteEstado().mapa; o.et = T.CAMP.et; o.round = T.Z.round; o.bag = [p.money >= m0, p.inv.secondary, p.perks.join(), p.maxHp];
    o.limpo = [T.forteEstado().anim, T.forteEstado().cone, T.CAMP_CH.z, T.VGSRV.z];
    window.__vgBase = { col: T.COL().length, geo: T.renderer.info.memory.geometries, tex: T.renderer.info.memory.textures };
    return o;
  });
  assert.equal(r.zs, 0); assert.equal(r.ts, 0); assert.equal(r.obj, 'feito'); assert.equal(r.ch, null);
  assert.notEqual(r.ph, 'round'); assert.deepEqual(r.fim, { prox: 3, troca: true }); assert.ok(r.cena, 'cenas c2-fim e c3-abertura'); assert.ok(r.salvo >= 2, 'Ato III liberado');
  assert.equal(r.mapa, 'sanatorio'); assert.equal(r.et, 3); assert.equal(r.round, 11); assert.deepEqual(r.bag, [true, 'galil_pap', 'jug,speed', 250]);
  assert.deepEqual(r.limpo, [false, false, null, null], 'nada da arena no Sanatório (o cone ficou fora da cena)');
  assert.deepEqual(J.erros, []);
});

test('a arena monta e desmonta sem vazar: Sanatório -> Forte -> Sanatório volta às mesmas contas', { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const ida = e => { T.Z.zs.clear(); T.Z.toSpawn = 0; T.campTrocaMapa(e); T.sim(.1); T.sendToHost({ t: 'camp', k: 'pronto' }); T.sim(.1); T.sim(T.Z.phaseEnd - window.__simNow + .2); };
    ida(2); const f = { mapa: T.forteEstado().mapa, round: T.Z.round, col: T.COL().length, ch: !!T.CAMP_CH.z || T.CAMP.obj['C1.1']?.st === 'ativo' };
    ida(3); const B = window.__vgBase;
    return { f, mapa: T.forteEstado().mapa, col: [B.col, T.COL().length], geo: [B.geo, T.renderer.info.memory.geometries], tex: [B.tex, T.renderer.info.memory.textures], anim: T.forteEstado().anim };
  });
  assert.equal(r.f.mapa, 'forte'); assert.equal(r.f.round, 10); assert.ok(r.f.ch); assert.equal(r.mapa, 'sanatorio');
  assert.equal(r.col[1], r.col[0], 'COL do Sanatório igual'); assert.ok(r.geo[1] <= r.geo[0] * 1.05 + 20, `geometrias ${r.geo}`); assert.ok(r.tex[1] <= r.tex[0] + 4, `texturas ${r.tex}`);
  assert.equal(r.anim, false); assert.deepEqual(J.erros, []);
});
