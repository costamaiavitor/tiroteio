// O Foguista (tipo 15, Vicente) como objetivo do Sanatório (objetivos do mapa, 13/10): a etapa C2 (objetivo C2.1 'matar') vem depois do
// IV, no próprio Sanatório, na versão de campo (nada da arena Casa do Forno). Confere: a passagem IV -> C2 -> V pelo intervalo; a rodada do
// chefe (os comuns da curva do mapa, sem os especiais do clássico); onde ele nasce (perto, em chão andável de sala aberta, com caminho até o
// jogador) e que chega até o jogador; a vida pela rodada em que entra (vidaAtual); a barra e o modelo no cliente; os ataques de campo com
// aviso (pá, brasa, apito pelo relógio com os lacaios perto dos jogadores, explosão de pressão que a parede corta); o fogo da porta do
// forno (ataque só da arena) não existe mais; as fases (60%: 2,6 m/s, rastro; 25%: manômetro vermelho, explosão a cada 15 s, Pregador no apito); o ponto fraco;
// quem entra no meio; a morte (lacaios e comuns caem sem pontos, +500, objetivo feito, a rodada acaba, a etapa V entra no intervalo) e
// que as peças só da arena (esteira, boca do forno, poço, válvulas, calha, fornoAnim) não existem mais (saíram na limpeza A8).
// Rodar: node --test tests/campanha-foguista.test.mjs   (liga ZV2_OBJ sozinho: o modo dos objetivos)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
process.env.ZV2_OBJ ||= '1'; // antes do abrirJogo: sem o __semObjetivos (o _jogo.mjs lê na hora de abrir)
const { abrirJogo, criarSala, noJogo } = await import('./_jogo.mjs');

let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 }); }, { timeout: 240000 });
after(async () => { await J?.fechar(); });

const PREP = `(T => {
  const p = T.S.players.get('h'), CH = T.CAMP_CH, agora = () => window.__simNow;
  const poe = (q, x, z, y = 0) => { q.pos = [x, y, z]; if (q === p) { T.me.pos.set(x, y, z); T.me.vel.set(0, 0, 0); } };
  const quieto = () => { const z = CH.z; T.Z.reQ = []; if (z) { z.speed = 0; z.atkT = 1e12; z.chkT = 1e12; } CH.prox = 1e12; T.FGSRV.apT = T.FGSRV.prT = 1e12; T.Z.spawnT = 1e12; T.Z.toSpawn = Math.max(T.Z.toSpawn, 5); for (const o of [...T.Z.zs.values()]) if (o !== z) T.Z.zs.delete(o.id); };
  const atk = id => CH.def.ataques.find(a => a.id === id);
  const limpa = () => { if (CH.atk) { CH.atk = null; T.broadcast({ t: 'camp', k: 'telx' }); } };
  const tel = () => T.CAMP.c.tel[T.CAMP.c.tel.length - 1];
  const pronto = () => { const z = CH.z; z.st = 'in'; z.atord = 0; z.fracoAte = 0; CH.inv = 0; p.dwEnd = 0; p.hp = p.maxHp = 1000; p.perks = []; p.crouch = 0; return z; };
  const anda = (x, z) => { const c = T.ffCell(x, z); return c >= 0 && !!T.FF.walk[c] && isFinite(T.FF.dist[c]) && T.zActive().has(T.zRoomAt(x, z)); };
  const ve = (ax, az, bx, bz) => T.losClear(new T.V3(ax, 1.2, az), new T.V3(bx, 1.2, bz));
  // um centro de chão aberto: em 16 direções, até R metros, tudo andável e à vista do centro (os ataques e o ponto fraco precisam de espaço)
  const livre = (R = 6) => { const c0 = [...T.S.players.values()][0].pos; let best = null, bd = 1e9;
    for (let c = 0; c < T.FF.walk.length; c++) { if (!T.FF.walk[c]) continue; const x = T.FF.x0 + Math.floor(c / T.FF.nz) + .5, z = T.FF.z0 + (c % T.FF.nz) + .5, d = Math.hypot(x - c0[0], z - c0[2]); if (d >= bd || !anda(x, z)) continue;
      let ok = true; for (let k = 0; k < 16 && ok; k++) { const a = k / 16 * Math.PI * 2; for (let r = 1; r <= R && ok; r++) { const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (!anda(px, pz) || !ve(x, z, px, pz)) ok = false; } }
      if (ok) { best = [x, z]; bd = d; } }
    return best; };
  return { p, CH, agora, poe, quieto, atk, limpa, tel, pronto, anda, ve, livre };
})`;
const em = fn => `(T, arg) => { const H = (new Function('return ' + arg.PREP)())(T); return (${fn})(T, arg, H); }`;
const rodar = (fn, a = {}) => J.page.evaluate(([src, arg]) => (new Function('T', 'arg', `return (${src})(T, arg)`))(window.__T, arg), [em(fn.toString()), { PREP, ...a }]);

test('Sanatório: a sequência é III, IV, C2, V; tipo 15 registrado; nada da arena no mapa (sem válvula, sem fornoAnim)', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, T => {
    const buracos = []; for (let k = 0; k < T.ZKIND.length; k++) if (!(k in T.ZKIND)) buracos.push(k);
    return { on: T.CAMP.on, modo: T.CAMP.modo, cad: (T.CAMP.cadeia || []).map(e => T.CAMP_ATOS[e].id), et: T.CAMP_ATOS[T.CAMP.et]?.id, buracos, k15: [T.ZKIND[15].n, T.ZKIND[15].chefe, T.ZKIND[15].sz],
      c2: [T.CAMP_ATOS.find(a => a.id === 'C2').mapa, T.CAMP_OBJ['C2.1'].tipo, T.CAMP_OBJ['C2.1'].chefe, T.CAMP_OBJ['C2.1'].titulo], vidaAtual: T.CAMP_CHEFE[15].vidaAtual,
      zint: (T.ZINT_MAPA.sanatorio || []).filter(o => o.t === 'valvula').length + T.ZD.zint.filter(o => o.t === 'valvula').length, anim: 'forno' in T.MAPS || 'valvula' in T.ZINT || typeof T.fornoEstado !== 'undefined', mapa: T.S.st.map, ch: T.campChefeEstado().id };
  });
  assert.equal(r.on, true); assert.equal(r.modo, 'campanha', 'modo dos objetivos'); assert.deepEqual(r.cad, ['III', 'IV', 'C2', 'V']); assert.equal(r.et, 'III');
  assert.deepEqual(r.buracos, [], 'ZKIND sem buraco'); assert.deepEqual(r.k15, ['O Foguista', 1, 1.7]);
  assert.deepEqual(r.c2, ['sanatorio', 'matar', 15, 'Derrube o Foguista']); assert.equal(r.vidaAtual, 1);
  assert.equal(r.zint, 0, 'nenhuma válvula no Sanatório'); assert.equal(r.anim, false, 'nada da arena (mapa, válvula, fornoAnim)'); assert.equal(r.mapa, 'sanatorio'); assert.equal(r.ch, null);
  assert.deepEqual(J.erros, []);
});

test('IV -> C2 pelo intervalo: na rodada seguinte, os comuns da curva (fração com piso) sem especiais do clássico e o Foguista de campo nasce perto, com caminho, vida da rodada, barra e modelo no cliente; chega até o jogador', { timeout: 600000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p } = H, o = { seq: [] }; p.dwEnd = 1e12;
    const ate = ph => { for (let k = 0; k < 600 && T.Z.phase !== ph; k++) T.sim(.1); };
    const acaba = () => { T.Z.zs.clear(); T.Z.toSpawn = 0; T.Z.reQ = []; T.sim(.3); };
    // III e IV de verdade: os objetivos feitos (campForca) e a rodada acaba; a etapa seguinte entra no intervalo
    for (let i = 0; i < 2; i++) { ate('round'); o.seq.push(T.CAMP_ATOS[T.CAMP.et].id); for (const id in T.CAMP.obj) T.campForca(id); acaba(); o.seq.push(T.Z.phase + ':' + T.CAMP_ATOS[T.CAMP.et].id); }
    o.obj = T.campEstado().obj['C2.1']?.st; o.ch0 = !!T.CAMP_CH.z;
    ate('round'); o.round = T.Z.round;
    o.ts = T.Z.toSpawn + [...T.Z.zs.values()].filter(x => !T.ZKIND[x.kind]?.chefe).length; o.mixN = T.Z.mixN; o.espTs = (() => { const K = T.campCurva(T.Z.round), D = T.zDf(), np = Math.max(1, T.S.players.size), b = T.zCount(T.Z.round, np) * D.cnt * K.qtdK; return Math.max(1, Math.round(Math.min(b, Math.max(b * K.chefe, K.chefeMin * D.cnt * (1 + .25 * (np - 1)))))); })(); // a curva do mapa na rodada do chefe (CAMP_CURVA: fração com piso)
    for (let k = 0; k < 100 && !T.CAMP_CH.z; k++) T.sim(.05);
    const z = T.CAMP_CH.z; if (!z) return o;
    o.chao = H.anda(z.body.pos.x, z.body.pos.z); o.d = Math.hypot(z.body.pos.x - p.pos[0], z.body.pos.z - p.pos[2]); // onde nasceu (depois ele anda, empurrado pelos comuns)
    T.sim(3.5); const P = z.body.pos;
    o.st = z.st; o.campo = T.CAMP_CH.campo; o.enc = T.CAMP_CH.encerra; o.k = z.kind;
    o.hp = z.maxHp; o.esp = Math.round(T.zHp(o.round) * T.zHpK(o.round) * (T.CAMP_CHEFE[15].base + T.CAMP_CHEFE[15].porJog) * T.CAMP_CHEFE_BASE.hpChefe * T.ZBAL.chefes.vidaK);
    o.cli = T.CAMP.c.ch && [T.CAMP.c.ch.k, T.CAMP.c.ch.f, T.CAMP.c.ch.campo]; o.bar = document.getElementById('zboss').firstChild.nodeValue; o.barVis = !document.getElementById('zboss').classList.contains('hidden');
    o.modelo = !!T.ZC.zs.get(z.id)?.model.userData.tanque; o.bo = T.campChefeBo(0);
    // chega até o jogador (parado, invulnerável): nenhum ataque nesse meio tempo
    T.CAMP_CH.prox = 1e12; T.FGSRV.apT = 1e12; let dmin = 1e9; for (let k = 0; k < 300; k++) { T.sim(.1); dmin = Math.min(dmin, Math.hypot(P.x - p.pos[0], P.z - p.pos[2])); if (dmin < 2) break; }
    o.dmin = dmin; o.vivo = T.Z.zs.has(z.id);
    return o;
  });
  assert.deepEqual(r.seq, ['III', 'break:IV', 'IV', 'break:C2'], JSON.stringify(r)); assert.equal(r.obj, 'ativo'); assert.equal(r.ch0, false, 'no intervalo ainda não');
  assert.equal(r.ts, r.espTs, 'comuns da etapa de chefe pela curva do mapa (fração da rodada com piso) ' + JSON.stringify(r)); assert.ok(r.ts >= Math.round(10 * .9), 'piso do Sanatório (× 0,9 do Normal): 10 comuns no Normal mesmo com o chefe cedo (rodada ' + r.round + ')'); assert.equal(r.mixN, 0, 'sem especiais do clássico na rodada do chefe');
  assert.equal(r.st, 'in'); assert.equal(r.k, 15); assert.equal(r.campo, true, 'versão de campo'); assert.equal(r.enc, true, 'a morte encerra a rodada');
  assert.ok(r.chao, 'nasce em chão andável de sala aberta, com caminho'); assert.ok(r.d < 20, `perto dos jogadores (${r.d})`);
  assert.equal(r.hp, r.esp, 'vida = zHp(rodada atual)·(base + porJog·1)'); assert.deepEqual(r.cli, [15, 1, true]); assert.equal(r.bar, 'O FOGUISTA · FASE 1'); assert.ok(r.barVis, 'barra à vista');
  assert.ok(r.modelo, 'modelo do Foguista (tanque nas costas)'); assert.equal(r.bo, 1);
  assert.ok(r.vivo && r.dmin < 3.5, `chega até o jogador, ao alcance do golpe (${r.dmin})`); // grande (1,6): para a ~3 m para bater
  assert.deepEqual(J.erros, []);
});

test('ataques de campo com aviso (≥ 0,6 s) antes do dano: pá (60 e empurrão), brasa no chão (15/s); o fogo da porta do forno não existe mais', { timeout: 180000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, atk, limpa, tel, pronto, livre } = H; quieto(); limpa(); const z = pronto(); const o = {}, C = livre(6); o.C = C; if (!C) return o;
    const [cx, cz] = C;
    // pá: setor de 100° e 3,2 m na frente dele
    z.body.pos.set(cx, 0, cz); poe(p, cx, cz - 1.5); let h = p.hp; T.campChefeAtaca(z, atk('pa'), p); T.sim(1 / 60); o.tp = [tel().a, tel().f, tel().s, tel().d1, tel().d2];
    T.sim(.8); o.paAntes = h - p.hp; T.sim(.2); o.pa = h - p.hp; o.emp = T.me.lungeEnd > agora(); T.sim(1.2); limpa(); T.sim(.1);
    // brasa: disco de 3 m no alvo, chão em brasa 4 s a 15/s
    poe(p, cx, cz + 5); p.hp = p.maxHp; h = p.hp; T.campChefeAtaca(z, atk('brasa'), p); T.sim(1 / 60); o.tb = [tel().a, tel().f, tel().s, tel().at, tel().d1];
    T.sim(.95); o.bAntes = h - p.hp; T.sim(2.05); o.brasa = h - p.hp; T.sim(.3); o.emb = T.FG_FX.emb?.count ?? 0; limpa();
    // forno: o ataque da porta do forno (só da arena) saiu; o sorteio só escolhe pá ou brasa
    o.fornoOk = typeof T.fgFornoOk === 'function'; o.forno = !!atk('forno');
    const vistos = new Set(); for (let k = 0; k < 40; k++) { CH.cd = {}; CH.atk = null; poe(p, cx + (k % 2 ? 1.5 : 0), cz + (k % 2 ? 0 : 6)); T.campChefeSorteia(z); if (CH.atk) vistos.add(CH.atk.a.id); CH.atk = null; }
    T.broadcast({ t: 'camp', k: 'telx' }); o.vistos = [...vistos].sort();
    return o;
  });
  assert.ok(r.C, 'achou um lugar aberto no Sanatório');
  assert.deepEqual(r.tp, ['pa', 'setor', .9, 3.2, 100]); assert.equal(r.paAntes, 0, 'nada no aviso'); assert.equal(r.pa, 60); assert.ok(r.emp, 'empurrão');
  assert.deepEqual(r.tb, ['brasa', 'disco', 1, 4, 3]); assert.equal(r.bAntes, 0); assert.ok(r.brasa >= 26 && r.brasa <= 30, `brasa: 15/s por 2 s (${r.brasa})`); assert.ok(r.emb > 0, 'brasas no chão (cliente)');
  assert.equal(r.fornoOk, false); assert.equal(r.forno, false, 'sem o ataque do forno'); assert.deepEqual(r.vistos, ['brasa', 'pa'], 'só pá e brasa no sorteio de campo');
  assert.deepEqual(J.erros, []);
});

test('apito pelo relógio (aviso 2 s): 4 lacaios perto dos jogadores, marcados, fora do toSpawn, teto 8, fraco aberto na recuperação; o próximo em 35 s', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, atk, limpa, tel, pronto, livre } = H; quieto(); limpa(); const z = pronto(); CH.fase = 0; const [cx, cz] = livre(6); z.body.pos.set(cx, 0, cz); poe(p, cx, cz + 5); p.dwEnd = 1e12;
    const o = {}, ts = T.Z.toSpawn, B = T.CAMP_CHEFE_BASE;
    T.FGSRV.apT = agora(); T.sim(1 / 30); o.tel = [CH.atk?.a.id, +(CH.atk.fa - CH.atk.t0).toFixed(2), tel().s]; T.sim(1.9); o.antes = T.campChefeLacVivos(); T.sim(.2);
    const lac = [...T.Z.zs.values()].filter(x => x.lac);
    o.lac = [lac.length, lac.every(x => { const d = Math.hypot(x.body.pos.x - p.pos[0], x.body.pos.z - p.pos[2]); return d >= B.lacPerto[0] - .5 && d <= B.lacPerto[1] + .5 && H.anda(x.body.pos.x, x.body.pos.z); }), [...new Set(lac.map(x => x.kind))].join()];
    o.fraco = z.fracoAte > agora(); o.prox = +(T.FGSRV.apT - agora()).toFixed(1);
    for (let k = 0; k < 2; k++) { limpa(); T.campChefeAtaca(z, atk('apito'), p); T.sim(2.1); } o.teto = T.campChefeLacVivos();
    o.ts = T.Z.toSpawn === ts; o.k12 = T.ZKIND[12] ? 12 : 0;
    T.broadcast({ t: 'camp', k: 'fg', e: 'calha' }); T.sim(1 / 60); // a calha só existe na arena: no Sanatório o cliente ignora sem erro
    for (const x of [...T.Z.zs.values()]) if (x.lac) T.Z.zs.delete(x.id); limpa(); T.FGSRV.apT = 1e12;
    return o;
  });
  assert.deepEqual(r.tel, ['apito', 2, 2]); assert.equal(r.antes, 0, 'nada antes do apito'); assert.equal(r.lac[0], 4); assert.ok(r.lac[1], 'perto dos jogadores, em chão andável ' + JSON.stringify(r)); assert.equal(r.lac[2], String(r.k12), 'Carvoeiros');
  assert.ok(r.fraco, 'recuperação do apito abre o fraco'); assert.ok(r.prox > 32 && r.prox <= 35, JSON.stringify(r)); assert.equal(r.teto, 8); assert.ok(r.ts, 'fora do toSpawn');
  assert.deepEqual(J.erros, []);
});

test('fases: 60% (inv 2 s, 2,6 m/s, rastro de brasa a 15/s, rachaduras), 25% (manômetro vermelho, explosão de pressão pelo relógio: 80 no aberto, nada atrás da parede, a cada 15 s; Pregador no apito)', { timeout: 180000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, atk, limpa, tel, pronto, livre, anda } = H; quieto(); limpa(); const z = pronto(); CH.fase = 0; z.hp = z.maxHp; const [cx, cz] = livre(6); z.body.pos.set(cx, 0, cz); poe(p, cx, cz + 5); p.dwEnd = 1e12;
    const o = {}, ud = () => T.ZC.zs.get(z.id)?.model.userData, vis = b => b.scale.x > .5;
    T.sim(.1); o.mano1 = ud().mano.map(vis); o.racha1 = ud().racha.map(vis);
    z.hp = z.maxHp * .61; T.zHit(p, z.id, 5000, 'body', 'm1911', false); o.f2 = [CH.fase, +(z.hp / z.maxHp).toFixed(3), z.speed, +(CH.inv - agora()).toFixed(1)];
    const h0 = z.hp; T.zHit(p, z.id, 100, 'body', 'm1911', false); o.inv = h0 - z.hp; T.sim(2.1); o.cli2 = T.CAMP.c.ch.f; o.mano2 = ud().mano.map(vis); o.racha2 = ud().racha.map(vis);
    o.bar2 = document.getElementById('zboss').firstChild.nodeValue;
    // rastro: ele anda 5 m; o jogador em cima do rastro leva 15/s
    z.atord = 0; z.body.pos.set(cx - 3, 0, cz); T.FGSRV.rx = cx - 3; T.FGSRV.rz = cz; T.sim(1 / 60);
    for (let k = 1; k <= 5; k++) { z.body.pos.set(cx - 3 + k, 0, cz); T.sim(1 / 60); }
    o.rastro = T.FGSRV.rastro.length; z.body.pos.set(cx, 0, cz + 5.5); z.speed = 0; p.dwEnd = 0; p.hp = 1000; poe(p, cx - .6, cz); T.sim(1); o.rastroDano = 1000 - p.hp; p.dwEnd = 1e12;
    // fase 3
    CH.inv = 0; z.hp = z.maxHp * .26; T.zHit(p, z.id, 5000, 'body', 'm1911', false); o.f3 = [CH.fase, +(T.FGSRV.prT - agora()).toFixed(1)]; T.sim(2.1); o.mano3 = ud().mano.map(vis);
    // explosão de pressão pelo relógio: aviso 3 s, disco de 7 m; no aberto 80
    quieto(); CH.prox = 1e12; z.body.pos.set(cx, 0, cz); z.atord = 0; poe(p, cx + 3, cz); p.dwEnd = 0; p.hp = 1000;
    T.FGSRV.prT = agora(); T.FGSRV.apT = 1e12; T.sim(1 / 30); o.tp = [CH.atk?.a.id, tel().f, tel().s, tel().d1]; T.sim(2.9); o.pAntes = 1000 - p.hp; T.sim(.2); o.aberto = 1000 - p.hp; o.fraco = z.fracoAte > agora();
    o.prox = +(T.FGSRV.prT - agora()).toFixed(1); T.sim(2.1); limpa();
    // atrás da parede: ele num chão andável e o jogador a 2–5 m, também andável, sem linha de vista (a parede corta a explosão, como o pilar na arena)
    let W = null; const B = T.CAMP_CHEFE_BASE;
    for (let c = 0; c < T.FF.walk.length && !W; c++) { if (!T.FF.walk[c]) continue; const bx = T.FF.x0 + Math.floor(c / T.FF.nz) + .5, bz = T.FF.z0 + (c % T.FF.nz) + .5; if (Math.hypot(bx - cx, bz - cz) > 40 || !anda(bx, bz)) continue;
      for (let k = 0; k < 16 && !W; k++) for (let d = 2; d <= 5 && !W; d++) { const x = bx + Math.cos(k / 16 * Math.PI * 2) * d, zz = bz + Math.sin(k / 16 * Math.PI * 2) * d;
        if (anda(x, zz) && !T.losClear(new T.V3(bx, B.origemY, bz), new T.V3(x, B.peito[0], zz))) W = [bx, bz, x, zz]; } }
    o.W = !!W; if (W) { z.body.pos.set(W[0], 0, W[1]); poe(p, W[2], W[3]); p.hp = 1000; T.campChefeAtaca(z, atk('pressao'), p); T.sim(3.1); o.atras = 1000 - p.hp; limpa(); z.body.pos.set(cx, 0, cz); }
    // apito da fase 3: o Pregador primeiro, depois os Carvoeiros
    poe(p, cx, cz + 5); for (const x of [...T.Z.zs.values()]) if (x.lac) T.Z.zs.delete(x.id);
    T.campChefeAtaca(z, atk('apito'), p); T.sim(2.1); o.lac3 = [...T.Z.zs.values()].filter(x => x.lac).length; o.k13 = [...T.Z.zs.values()].some(x => x.lac && x.kind === (T.ZKIND[13] ? 13 : 0));
    for (const x of [...T.Z.zs.values()]) if (x.lac) T.Z.zs.delete(x.id); limpa(); CH.fase = 0; T.FGSRV.prT = T.FGSRV.apT = 1e12; z.hp = z.maxHp * .9; p.dwEnd = 1e12;
    return o;
  });
  assert.deepEqual(r.mano1, [true, false, false], 'manômetro verde'); assert.deepEqual(r.racha1, [false, false, false]);
  assert.equal(r.f2[0], 1); assert.equal(r.f2[1], .6, 'o golpe para no limite da fase'); assert.ok(Math.abs(r.f2[2] - 2.6 * .95) < 1e-9, `fase 2: 2,6 m/s × 0,95 do Normal (balanceamento final 13/10): ${r.f2[2]}`); assert.equal(r.f2[3], 2, 'invulnerável 2 s'); assert.equal(r.inv, 0);
  assert.equal(r.cli2, 2); assert.deepEqual(r.mano2, [false, true, false]); assert.deepEqual(r.racha2, [true, true, true], 'couraça rachada'); assert.equal(r.bar2, 'O FOGUISTA · FASE 2');
  assert.ok(r.rastro >= 4, `rastro de brasa (${r.rastro})`); assert.ok(r.rastroDano >= 10 && r.rastroDano <= 15, `rastro: 15/s (${r.rastroDano})`);
  assert.equal(r.f3[0], 2); assert.equal(r.f3[1], 5); assert.deepEqual(r.mano3, [false, false, true], 'manômetro no vermelho');
  assert.deepEqual(r.tp, ['pressao', 'disco', 3, 7]); assert.equal(r.pAntes, 0); assert.equal(r.aberto, 80, 'no aberto: 80'); assert.ok(r.fraco, 'a explosão abre o fraco'); assert.ok(r.prox > 11 && r.prox <= 15, `a cada 15 s (${r.prox})`);
  assert.ok(r.W, 'achou um lugar atrás da parede'); assert.equal(r.atras, 0, 'atrás da parede a explosão não chega');
  assert.equal(r.lac3, 5, '4 Carvoeiros + 1 Pregador'); assert.ok(r.k13);
  assert.deepEqual(J.erros, []);
});

test('ponto fraco: por trás sempre (×3); de frente só na janela (recuperação)', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, limpa, pronto, livre } = H; quieto(); limpa(); const z = pronto(); CH.fase = 0; const [cx, cz] = livre(6); z.body.pos.set(cx, 0, cz); z.yaw = 0; z.tgt = null; z.tgtT = 1e12; z.hp = z.maxHp * .9; p.dwEnd = 1e12; p.inv.secondary = p.inv.primary = 'm1911';
    const o = {}, tiro = (x, zz) => { poe(p, x, zz); T.sim(.6); const h = z.hp; T.sendToHost({ t: 'zhit', v: z.id, w: 'm1911', dmg: 1e6, z: 'fraco' }); T.sim(1 / 60); return +(h - z.hp).toFixed(2); };
    o.w = T.W.m1911.dmg; o.max = z.maxHp; o.frente = tiro(cx, cz - 5); o.tras = tiro(cx, cz + 5); // yaw 0: frente para -z
    z.fracoAte = agora() + 5; o.janela = tiro(cx, cz - 5); z.fracoAte = 0; z.yaw = 0;
    return o;
  });
  assert.ok(Math.abs(r.frente - Math.min(r.w * 1.1, r.max * .06)) < 1e-3, `de frente, fechado: vale corpo (${r.frente}) ` + JSON.stringify(r));
  assert.ok(Math.abs(r.tras - Math.min(r.w * 3 * 1.1, r.max * .1)) < 1e-3, `por trás: ×3 (${r.tras}) ` + JSON.stringify(r));
  assert.ok(Math.abs(r.janela - r.tras) < 1e-3, `de frente com a janela aberta: ×3 (${r.janela})`);
});

test('peças só da arena não existem: esteira, boca do forno, poço, válvulas e fornoAnim saíram; o Foguista atordoado não anda sozinho; o PaP continua à vista', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, agora, poe, quieto, limpa, pronto, livre } = H; quieto(); limpa(); const z = pronto(); const o = {}, C = livre(6) || [0, 0];
    // o Foguista atordoado num lugar aberto: a IA da base o segura parado e nada o queima (a esteira e a boca do forno saíram com a arena)
    z.body.pos.set(C[0], 0, C[1]); z.atord = agora() + 2; const h = z.hp, z0 = z.body.pos.z; o.ia = CH.def.ia ? CH.def.ia(z, .1, p, CH) : false; T.sim(2); o.boca = [h - z.hp, Math.abs(+(z.body.pos.z - z0).toFixed(2))]; z.atord = 0;
    o.bocaJog = 0; o.fgBo = p.fgBo || 0; o.poco = [true, !z.fgPo];
    o.pap = T.ZC.world.pap?.g ? T.ZC.world.pap.g.visible : null; o.est = { anim: ['FORNO', 'FORNO_V', 'fornoAnim', 'fornoEsconde', 'fornoEstado', 'fgArenaTick', 'fgIA', 'fgEsteira'].some(k => typeof T[k] !== 'undefined') || 'valvula' in T.ZINT }; o.v = [null, null, null];
    for (let k = 0; k < 10; k++) T.fgHud();
    return o;
  });
  assert.equal(r.ia, false, 'a IA do Foguista não toma conta fora da arena'); assert.deepEqual(r.boca, [0, 0], 'nem esteira nem boca do forno');
  assert.equal(r.bocaJog, 0); assert.equal(r.fgBo, 0); assert.deepEqual(r.poco, [true, true], 'sem poço de cinzas');
  assert.notEqual(r.pap, false, 'o PaP do Sanatório continua à vista'); assert.equal(r.est.anim, false); assert.deepEqual(r.v, [null, null, null], 'nenhuma peça da arena montada');
  assert.deepEqual(J.erros, []);
});

test('quem entra no meio: recebe o chefe de campo, a fase e o aviso no ar; o cliente monta a barra', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, poe, quieto, atk, limpa, pronto, livre } = H; quieto(); limpa(); const z = pronto(); CH.fase = 1; const [cx, cz] = livre(6); z.body.pos.set(cx, 0, cz); poe(p, cx, cz + 5); p.dwEnd = 1e12;
    T.campChefeAtaca(z, atk('brasa'), p); T.sim(.1);
    const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; } };
    T.srvOnData(c, { t: 'join', v: 2, pv: 7, name: 'Meio' }); T.sim(.2);
    const q = T.S.players.get(c.pid), st = c.out.filter(m => m.t === 'state' && m.z).pop(), cp = st?.z?.cp;
    const o = { entrou: !!q, ch: cp?.ch?.slice(0, 3), campo: cp?.ch?.[6], tel: cp?.tel?.[0]?.a };
    T.srvDrop(c); T.campCliReset(); T.campSync(cp); T.sim(1 / 60); o.cli = T.CAMP.c.ch && [T.CAMP.c.ch.k, T.CAMP.c.ch.f, T.CAMP.c.ch.campo]; o.bar = document.getElementById('zboss').firstChild.nodeValue;
    CH.fase = 0; limpa(); T.sim(.2);
    return o;
  });
  assert.ok(r.entrou); assert.deepEqual(r.ch, [15, r.ch[1], 2]); assert.equal(r.campo, 1, 'versão de campo'); assert.equal(r.tel, 'brasa');
  assert.deepEqual(r.cli, [15, 2, true]); assert.equal(r.bar, 'O FOGUISTA · FASE 2');
  assert.deepEqual(J.erros, []);
});

test('morte: lacaios e comuns caem sem pontos, +500 e 2 drops, objetivo feito, a rodada acaba e a etapa V entra no intervalo (sem cena, sem troca de mapa)', { timeout: 300000 }, async () => {
  const r = await rodar((T, arg, H) => {
    const { p, CH, poe, quieto, limpa, pronto, livre } = H; quieto(); limpa(); const z = pronto(); CH.fase = 2; const [cx, cz] = livre(6); z.body.pos.set(cx, 0, cz); poe(p, cx, cz + 5); p.dwEnd = 1e12;
    T.campChefeLacaios({ tipo: 0, n: 2, max: 9 }); { T.Z.toSpawn++; T.zSpawnOne(); } T.Z.toSpawn = 3;
    const d0 = (T.Z.drops || T.Z.pw || []).length;
    z.hp = 10; const m0 = p.money; T.zHit(p, z.id, 100, 'body', 'm1911', false);
    const o = { zs: T.Z.zs.size, ts: T.Z.toSpawn, obj: T.campEstado().obj['C2.1']?.st, ch: T.CAMP_CH.z, srv: T.FGSRV.z, pts: p.money - m0, drops: (T.Z.drops || T.Z.pw || []).length - d0 };
    T.sim(.3); o.ph = T.Z.phase; o.fim = !!document.getElementById('campCena'); o.trans = T.CAMP.trans ?? null; o.mapa = T.S.st.map; o.et = T.CAMP_ATOS[T.CAMP.et]?.id; o.modo = T.CAMP.modo;
    o.objV = Object.entries(T.campEstado().obj).filter(([, v]) => v.st === 'ativo').map(([k]) => k);
    o.cliCh = T.CAMP.c.ch ?? null; o.barOculta = document.getElementById('zboss').classList.contains('hidden');
    for (let k = 0; k < 600 && T.Z.phase !== 'round'; k++) T.sim(.1); T.sim(5); o.depois = [T.Z.phase, T.CAMP_ATOS[T.CAMP.et]?.id, T.CAMP_CH.z ? T.CAMP_CH.k : null];
    return o;
  });
  assert.equal(r.zs, 0, 'lacaios e comuns caíram'); assert.equal(r.ts, 0); assert.equal(r.obj, 'feito'); assert.equal(r.ch, null); assert.equal(r.srv, null);
  assert.ok(r.pts >= 500, `recompensa +500 (${r.pts})`); assert.equal(r.drops, 2, 'Munição Máxima e bebida');
  assert.equal(r.ph, 'break', 'a rodada do chefe acabou'); assert.equal(r.fim, false, 'sem cena'); assert.equal(r.trans, null, 'sem troca de mapa'); assert.equal(r.mapa, 'sanatorio');
  assert.equal(r.et, 'V', 'a etapa V no intervalo'); assert.equal(r.modo, 'campanha'); assert.deepEqual(r.objV, ['V.1']);
  assert.equal(r.cliCh, null, 'o cliente tira o chefe'); assert.ok(r.barOculta, 'a barra some');
  assert.deepEqual(r.depois, ['round', 'V', null], 'na rodada seguinte o Foguista não volta');
  assert.deepEqual(J.erros, []);
});
