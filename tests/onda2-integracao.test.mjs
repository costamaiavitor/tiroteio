// Integração da Onda 2 (O2-E02, revisor da Frente C): partida inteira com todos os interativos, nos dois mapas.
// - Partida 1→16+ (Vila e Sanatório): a cada rodada o host usa cada interativo que estiver pronto (energia, interruptores, atalhos,
//   fogo, barris, elétricas, munição, Wunderfizz, baú, sino, terminais, barricadas) com zumbis por perto; confere a cada passo que os
//   pontos ficam finitos e nunca negativos, que todo estado é da lista do tipo, que o cliente do host vê o mesmo estado global do host,
//   que nada fica preso (todo interativo com tempo volta a 'pronto'; barril volta depois de voltaRodadas) e que não há erro na página.
// - Interações: Pack-a-Punch → munição cobra custoPap; Munição Máxima e Nuke com fogo aceso, barricada e sino; Carniceiro no fogo.
// - Multijogador (jogador falso pela porta do host, como nos testes de rede): o cliente usa cada tipo por mensagem; os estados
//   pessoais (munição 'usado', baú 'meu', terminal 'lido') vão só para quem usou; o host não vê o 'meu' do outro; segurar F (hold).
// - Fim de jogo e recomeço: zReset/zreset deixam tudo como no começo (host e cliente: estados, peças, isca, alas, travas, painel).
// Rodar (cópia): PAGINA=<index.html> node --test tests/onda2-integracao.test.mjs  (sem PAGINA: o index.html do repositório)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_e02.mjs';

let J;
before(async () => { J = await abrirJogo(); }, { timeout: 150000 });
after(async () => { await J?.fechar(); });

// ajudas dentro da página (T = window.__T)
const AJ = `(T => {
  const p = T.S.players.get('h'), L = T.ZD.zint, de = t => L.map((o, i) => i).filter(i => L[i].t === t), prob = [];
  const poe = (q, x, z) => { q.pos = [x, 0, z]; if (q.id === 'h') { T.me.pos.set(x, 0, z); T.me.vel.set(0, 0, 0); } };
  const frente = (i, d = 1.2) => [L[i].x + L[i].n[0] * d, L[i].z + L[i].n[1] * d];
  const zumbi = (x, z, hp) => { const id = T.Z.nextId; T.Z.toSpawn++; T.zSpawnOne(); const zz = T.Z.zs.get(id); if (!zz) return null; zz.st = 'in'; zz.body.pos.set(x, 0, z); zz.sc = 0; if (hp) zz.hp = zz.maxHp = hp; return zz; };
  const confere = (onde) => { // invariantes: pontos, estados válidos, cliente = host no estado global
    for (const q of T.S.players.values()) if (!Number.isFinite(q.money) || q.money < 0) prob.push(onde + ': pontos ' + q.id + ' = ' + q.money);
    if (!Number.isFinite(T.me.money) || T.me.money < 0) prob.push(onde + ': pontos no cliente = ' + T.me.money);
    L.forEach((o, i) => { const F = T.ZINT_FN[o.t], h = T.Z.zint[i]?.st, c = T.ZC.zint[i]?.st;
      if (!F.est.includes(h)) prob.push(onde + ': estado do host inválido ' + o.t + ':' + i + ' = ' + h);
      if (h !== c) prob.push(onde + ': cliente ' + c + ' ≠ host ' + h + ' em ' + o.t + ':' + i); });
  };
  return { p, L, de, poe, frente, zumbi, confere, prob };
})`;

// partida: rodadas 1..N, usando tudo; devolve problemas achados
const PARTIDA = async (T, A) => {
  const { p, L, de, poe, frente, zumbi, confere, prob } = (new Function('return ' + A.AJ)())(T);
  const usos = {}, gastos = {}, conta = (k, v) => { usos[k] = (usos[k] || 0) + 1; gastos[k] = (gastos[k] || 0) + v; };
  p.dwEnd = 1e12; // invulnerável (Dying Wish eterno): a partida não acaba por dano
  const usa = (i, extra) => { const o = L[i], m0 = p.money; poe(p, ...frente(i, o.t === 'barricada' ? 1.4 : 1.2)); T.srvZUse(p, { k: 'zint', id: i, ...extra }); T.sim(.05); const g = m0 - p.money; if (g < 0 && o.t !== 'bau') prob.push(`r${T.Z.round}: ${o.t}:${i} DEU ${-g} pontos`); conta(o.t, g); return g; };
  const abreTudo = () => { for (const d of T.ZD.doors) if (!d.atalho && !T.Z.doors.has(d.id)) { T.Z.doors.add(d.id); T.broadcast({ t: 'zdoor', id: d.id }); } T.zBuildWalk(); };
  const fimRodada = () => { for (const z of [...T.Z.zs.values()]) T.zKill(z, p, 'head', 'm1911', false, false); T.Z.toSpawn = 0; T.sim(.2); if (T.Z.phase === 'break') { T.Z.phaseEnd = 0; T.sim(.1); } };
  const visto = {};
  for (let r = 1; r <= A.N; r++) {
    if (T.Z.phase !== 'round') { T.Z.phaseEnd = 0; T.sim(.1); }
    if (T.Z.round !== r) prob.push(`esperava rodada ${r}, está na ${T.Z.round} (${T.Z.phase})`);
    T.Z.spawnT = 1e12; p.money += 20000;
    if (r === 2) { // energia e todas as portas comuns
      T.Z.power = true; T.broadcast({ t: 'zpower' }); abreTudo(); T.sim(.1);
    }
    if (r === 3) for (const i of de('interruptor')) usa(i);
    if (r === 4) for (const d of T.ZD.doors.filter(d => d.atalho)) { const m0 = p.money; poe(p, d.x + (d.axis === 'x' ? 0 : 1.5), d.z + (d.axis === 'x' ? 1.5 : 0)); T.srvZUse(p, { k: 'door', id: d.id }); T.sim(.05); if (!T.Z.doors.has(d.id)) prob.push('atalho não abriu: ' + d.id + ' ' + (T.zintPortaTrava(d, true) || '')); conta('atalho', m0 - p.money); }
    if (r === 5) { // Pack-a-Punch na pistola: a munição passa a custar custoPap
      p.inv.secondary = p.inv.secondary || 'mp40'; p.inv.primary = 'm1911_pap'; T.sim(.05);
    }
    // zumbis espalhados perto dos interativos (fogo, barricada, sino, barril)
    for (const i of de('fogo').concat(de('barricada'), de('barril').slice(0, 4))) { const o = L[i]; const z = zumbi(o.a ? o.a[0] : o.x, o.a ? o.a[1] : o.z, r >= 12 ? 1e5 : 0); if (z) z.speed = 1.5; }
    if (r === 7 && de('fogo').length) { const o = L[de('fogo')[0]]; const zz = zumbi(o.a[0], o.a[1]); if (zz) { zz.kind = 6; zz.maxHp = zz.hp = 50000; } } // Carniceiro no fogo
    // usa tudo o que estiver pronto (o barril às vezes por tiro: zintTiro com a bala parada nele)
    for (let i = 0; i < L.length; i++) {
      const o = L[i], st = T.Z.zint[i].st;
      if (o.t === 'interruptor' || o.t === 'terminal' && r % 4) continue;
      if (o.t === 'barricada') { if (st !== 'pronto') { poe(p, ...frente(i, 1.4)); for (let k = 0; k < 12; k++) { T.srvZHold(p, { k: 'zint', id: i }); T.sim(.55); } } continue; }
      if (st !== 'pronto') continue;
      if (o.t === 'barril' && r % 2) { const E = T.ZC.world.zint[i], c = E.col; T.zintTiro(p, [o.x + o.n[0] * 6, 1.2, o.z + o.n[1] * 6], [[(c.minX + c.maxX) / 2, .5, (c.minZ + c.maxZ) / 2]]); T.sim(.05); conta('barril-tiro', 0); continue; }
      if (o.t === 'municao') for (const w of ['m1911', 'm1911_pap', 'mp40']) T.G.ammo[w] = { mag: 0, res: 0 };
      if (o.t === 'wunderfizz' && p.perks.length >= T.ZMAXPERKS) { p.perks = []; T.ZC.perks.length = 0; p.maxHp = 100; }
      const esp = o.t === 'municao' ? !T.Z.power ? 0 : (['primary', 'secondary', 'third'].some(k => T.W[p.inv[k]]?.pap) ? T.ZINT.municao.custoPap : T.ZINT.municao.custo) : null;
      const g = usa(i);
      if (o.t === 'municao' && g !== esp) prob.push(`r${r}: munição cobrou ${g} (esperado ${esp})`);
      if (o.t === 'bau' && T.Z.zint[i].st === 'gira') { T.sim(T.ZINT.bau.giraS + .1); if (T.Z.zint[i].st.startsWith('oferta:') && r % 3) { usa(i); } } // às vezes deixa a oferta expirar
      visto[o.t] = (visto[o.t] || 0) + 1;
    }
    if (r === 6) { T.zDrop('max', p.pos[0], p.pos[2], true); T.sim(.3); } // Munição Máxima no meio de tudo
    if (r === 8) { T.zDrop('nuke', p.pos[0], p.pos[2], true); T.sim(2); } // Nuke com fogo aceso e zumbi na barricada
    if (r === 9) { T.zDrop('carp', p.pos[0], p.pos[2], true); T.sim(.3); }
    confere('r' + r + ' depois dos usos');
    T.sim(3); confere('r' + r + ' +3 s');
    fimRodada(); confere('r' + r + ' fim');
    // nada preso: depois de 100 s sem usar, tudo o que tem tempo volta a pronto (barril: só com rodadas; barricada: só com conserto)
    if (r === A.N) { T.Z.spawnT = 1e12; T.Z.phaseEnd = 1e12; T.sim(100); L.forEach((o, i) => { const st = T.Z.zint[i].st; if (!['barril', 'barricada', 'interruptor'].includes(o.t) && st !== 'pronto') prob.push('preso: ' + o.t + ':' + i + ' = ' + st); }); }
  }
  // barris: os que explodiram voltam depois de voltaRodadas
  const boom = de('barril').filter(i => T.Z.zint[i].st === 'boom');
  for (let k = 0; k < T.ZINT.barril.voltaRodadas + 1; k++) { T.Z.phaseEnd = 0; T.sim(.1); poe(p, ...T.ZD.spawns[0]); T.sim(.5); fimRodada(); }
  const naoVoltou = boom.filter(i => T.Z.zint[i].st === 'boom');
  if (naoVoltou.length) prob.push('barris que não voltaram: ' + naoVoltou.join(','));
  confere('fim');
  return { prob: prob.slice(0, 40), nprob: prob.length, usos, gastos, visto, rodada: T.Z.round, dinheiro: p.money };
};

// fim de jogo e recomeço: tudo volta ao começo, no host e no cliente
const RECOMECO = async (T, A) => {
  const { p, L, de, prob } = (new Function('return ' + A.AJ)())(T);
  p.dwEnd = 0; for (const q of T.S.players.values()) { q.perks = []; T.zHurt(q, 1e6, null); }
  const over = T.S.phase; T.sim(13); // fim de jogo (12 s) e sala nova
  for (let k = 0; k < 40 && !(T.Z.on && T.ZC.world && T.Z.phase); k++) await new Promise(r => setTimeout(r, 250));
  T.sim(.2);
  const L2 = T.ZD.zint, W = T.ZC.world, ruim = [];
  L2.forEach((o, i) => { if (T.Z.zint[i].st !== 'pronto') ruim.push('host ' + o.t + ':' + i + '=' + T.Z.zint[i].st); if (T.ZC.zint[i].st !== 'pronto') ruim.push('cli ' + o.t + ':' + i + '=' + T.ZC.zint[i].st);
    const e = W.zint[i]; if (o.t === 'barril' && (!e.corpo.visible || e.restos.visible || e.col.maxY !== e.h)) ruim.push('barril visual ' + i);
    if (o.t === 'fogo' && e.chamas.visible) ruim.push('fogo aceso ' + i); if (o.t === 'bau' && e.holder.visible) ruim.push('baú aberto ' + i);
    if (o.t === 'barricada' && e.n !== T.ZINT.barricada.tabuas) ruim.push('barricada ' + i + ' com ' + e.n); if (o.t === 'interruptor' && e.alav.rotation.x < 0) ruim.push('interruptor ligado ' + i);
    if (T.ZC.zint[i].usei != null && T.ZC.zint[i].usei >= 0) ruim.push('usei sobrou ' + o.t + ':' + i); });
  if (T.Z.lure) ruim.push('isca sobrou'); if (W.alas?.size) ruim.push('alas ligadas: ' + [...W.alas]); if (T.ZC.doors.size || T.Z.doors.size) ruim.push('portas abertas');
  if (T.ZLORE.i >= 0) ruim.push('painel do terminal aberto');
  return { over, ruim, fase: T.Z.phase, round: T.Z.round, prob };
};

// multijogador: o jogador falso usa cada tipo por mensagem; estados pessoais só para ele
const MULTI = async (T, A) => {
  const { p, L, de, poe, frente, prob } = (new Function('return ' + A.AJ)())(T);
  const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; }, peerConnection: null };
  T.srvOnData(c, { t: 'join', v: 2, pv: 3, name: 'Cliente' }); const q = T.S.players.get(c.pid); if (!q) return { semJogador: true };
  q.alive = true; q.downed = false; q.dwEnd = 1e12; q.money = 1e6; T.Z.power = true; T.broadcast({ t: 'zpower' }); T.sim(.1);
  const res = {}, pess = { municao: 'usado', bau: 'meu', terminal: 'lido' };
  for (const t of ['interruptor', 'fogo', 'barril', 'municao', 'wunderfizz', 'bau', 'sino', 'terminal', 'barricada']) for (const i of de(t).slice(0, 1)) {
    const E = T.Z.zint[i]; E.st = 'pronto'; E.t = 0; E.rod = {}; T.zintMsg({ i, st: 'pronto', s: 0 }); T.ZC.zint[i].usei = -1; T.ZC.zint[i].meu = false;
    q.perks = []; q.inv.primary = 'mp40'; q.inv.monkey = 0; poe(q, ...frente(i, t === 'barricada' ? 1.4 : 1.2)); poe(p, ...T.ZD.spawns[0]);
    if (t === 'barricada') { E.st = '1'; T.zintMsg({ i, st: '1', s: 0 }); }
    c.out.length = 0; const m0 = q.money, mh = p.money;
    if (t === 'barricada') for (let k = 0; k < 10; k++) { T.srvOnData(c, { t: 'hold', k: 'zint', id: i }); T.sim(.55); }
    else { T.srvOnData(c, { t: 'use', k: 'zint', id: i }); T.sim(.05); }
    const meus = c.out.filter(m => m.t === 'zint' && m.i === i).map(m => m.st), stH = T.Z.zint[i].st;
    const r = res[t] = { gasto: m0 - q.money, host: stH, cliHost: T.ZC.zint[i].st, recebeu: meus, hostPagou: mh - p.money };
    if (pess[t]) { r.pessoal = meus.includes(pess[t]); r.hostViu = t === 'municao' ? T.ZC.zint[i].usei === T.ZC.round : t === 'bau' ? !!T.ZC.zint[i].meu : T.ZLORE.i === i; }
    if (t === 'bau') { T.sim(T.ZINT.bau.giraS + .1); r.oferta = T.Z.zint[i].st; poe(p, ...frente(i, 1)); T.srvZUse(p, { k: 'zint', id: i }); r.hostRoubou = T.Z.zint[i].st !== r.oferta;
      T.zInteract(0); r.promptHost = T.ZC.act?.txt; c.out.length = 0; T.srvOnData(c, { t: 'use', k: 'zint', id: i }); T.sim(.05); r.pegou = T.Z.zint[i].st; r.inv = c.out.filter(m => m.t === 'inv').length; }
    if (t === 'wunderfizz') r.bebida = q.perks.slice();
    if (t === 'municao') r.ammo = c.out.filter(m => m.t === 'ammo').map(m => m.w);
  }
  // quem entra no meio (terceiro jogador) recebe o mesmo estado global
  const c3 = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; }, peerConnection: null };
  T.srvOnData(c3, { t: 'join', v: 2, pv: 3, name: 'Terceiro' }); T.sim(1.2);
  const zi = c3.out.filter(x => x.t === 'state' && Array.isArray(x.z?.zi)).pop()?.z.zi, est = T.zintEstado();
  res.meio = { tem: !!zi, igual: !!zi && zi.every((s, k) => s[0] === est[k][0]), pessoalVazou: !!zi && zi.some(s => ['usado', 'meu', 'lido'].includes(s[0])) };
  T.srvDrop?.(c); T.srvDrop?.(c3); T.sim(.2);
  return { res, prob };
};

for (const MAPA of ['vila', 'sanatorio']) {
  test(`${MAPA}: partida 1→16 usando todos os interativos (pontos, estados, cliente = host, nada preso, barris voltam)`, { timeout: 900000 }, async () => {
    if (MAPA === 'sanatorio') { await J.fechar(); J = await abrirJogo(); }
    await criarSala(J.page, { mode: 'zombies', map: MAPA, zdiff: 1 });
    const r = await noJogo(J.page, PARTIDA, { AJ, N: 16 });
    console.log(MAPA, JSON.stringify({ ...r, prob: undefined }));
    for (const x of r.prob) console.log('  PROBLEMA', x);
    assert.equal(r.nprob, 0, r.prob.join('\n')); assert.deepEqual(J.erros, []);
  });
  test(`${MAPA}: multijogador — cliente usa cada tipo; estados pessoais só para ele; quem entra no meio`, { timeout: 300000 }, async () => {
    const r = await noJogo(J.page, MULTI, { AJ });
    console.log(MAPA, JSON.stringify(r.res));
    for (const [t, v] of Object.entries(r.res)) if (v.pessoal !== undefined) { assert.ok(v.pessoal, `${t}: o cliente não recebeu o estado pessoal`); assert.ok(!v.hostViu, `${t}: o host viu o estado pessoal do outro`); }
    for (const [t, v] of Object.entries(r.res)) if (v.hostPagou) assert.fail(`${t}: o host pagou pelo uso do cliente`);
    if (r.res.bau) { assert.ok(!r.res.bau.hostRoubou, 'o host pegou a oferta do cliente'); assert.equal(r.res.bau.pegou, 'pronto'); }
    assert.ok(r.res.meio.tem && r.res.meio.igual && !r.res.meio.pessoalVazou, JSON.stringify(r.res.meio));
    assert.deepEqual(J.erros, []);
  });
  test(`${MAPA}: fim de jogo e recomeço deixam tudo como no começo (host e cliente)`, { timeout: 300000 }, async () => {
    const r = await noJogo(J.page, RECOMECO, { AJ });
    console.log(MAPA, JSON.stringify(r));
    assert.equal(r.over, 'over'); assert.deepEqual(r.ruim, []); assert.deepEqual(J.erros, []);
  });
}
