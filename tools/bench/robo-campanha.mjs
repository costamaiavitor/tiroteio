// Robô da campanha (O3-D15): o jogador simulado do tools/bench/bench-campanha.mjs e do tests/campanha-balanco.test.mjs.
// Ver o cabeçalho do bench-campanha.mjs (o que ele faz e o que não faz). Funções para uma página do Playwright já com o jogo aberto
// (window.__T): comecar() monta a etapa com o kit do checkpoint (ou o clássico na mesma rodada, ref) e instala o robô; jogar() roda
// a etapa no relógio travado (T.sim) até ela acabar.
export const ROBO_PADRAO = { mira: .7, cabeca: .25, kite: 3, kiteV: 5.1, coleira: 30, reanimar: 4, perdido: 4, caca: 20, semente: 1 };
// ---------- o robô (roda dentro da página; o mesmo nos dois modos) ----------
export function instalarRobo(R) {
  const T = window.__T, V = T.me.pos.constructor, o = new V(), d = new V(), BIG = 1e6;
  let sem = R.semente >>> 0 || 1; const rnd = () => ((sem = (sem * 1664525 + 1013904223) >>> 0) / 4294967296); // sorteio do robô reproduzível
  const B = window.__D15 = { R, bots: [], conns: [], log: [], r: null, etapa: null, chefe: null, wipes: 0, ativo: false, rodAnt: -1, travadas: 0 };
  const W = T.W, dps = w => { const x = W[w]; return x && x.rate ? (x.dmg || 0) * (x.pellets || 1) / x.rate : 0; };
  function arma(p) { let best = null, bv = 0; for (const s of ['primary', 'secondary', 'third']) { const w = p.inv[s]; if (w && W[w] && dps(w) > bv) { bv = dps(w); best = w; } } return best || 'm1911'; }
  function vis(p, z) { // linha livre do olho ao peito (o host confere o mesmo no zhit)
    const P = z.body.pos, s = T.ZKIND[z.kind]?.sz || 1; o.set(p.pos[0], p.pos[1] + 1.6, p.pos[2]); d.set(P.x - o.x, P.y + 1.15 * s - o.y, P.z - o.z);
    const L = d.length(); if (L < .05) return true; d.multiplyScalar(1 / L); return T.trace(o, d, L).t >= L - .45;
  }
  const alvoOk = z => z.hp > 0 && !(z.body.pos.y < -.5) && !(z.st === 'rise' && z.body.pos.y < -.2); // submerso (Afogado) e nascendo: não dá para acertar
  B.novo = p => { const b = { p, w: null, mag: 0, recAte: 0, prox: 0, faca: 0, vh: p.maxHp, vmh: p.maxHp, lastHurt: -1e9, caido: 0, qr: 0, casa: [p.pos[0], p.pos[2]] }; B.bots.push(b); return b; };
  B.armar = b => { b.w = arma(b.p); b.mag = W[b.w].mag || 1; b.vmh = b.p.maxHp; b.vh = Math.min(b.vh, b.vmh); };
  B.antes = () => { for (const b of B.bots) { const p = b.p; if (!p.alive || p.downed) { p.alive = true; p.downed = false; } p.hp = BIG; } };
  B.depois = (dt, now) => { // dano da tick na vida virtual, quedas, regeneração
    const D = T.zDf(), r = B.r;
    for (const b of B.bots) {
      const p = b.p, dmg = BIG - p.hp; p.hp = BIG;
      if (B.semConta) continue;
      if (b.caido) { if (now >= b.caido) { b.caido = 0; b.vh = b.vmh; } continue; }
      if (dmg > 0 && dmg < 5000) { b.vh -= dmg; b.lastHurt = now; if (r) r.dano[B.bots.indexOf(b)] += dmg; }
      else if (b.vh < b.vmh && now - b.lastHurt > D.regen * (p.perks.includes('qr') ? .75 : 1)) b.vh = Math.min(b.vmh, b.vh + D.rgn * Math.sqrt(Math.max(100, b.vmh) / 100) * dt);
      if (b.vh <= 0) {
        if (r) r.quedas++;
        const outro = B.bots.some(q => q !== b && !q.caido);
        if (outro) b.caido = now + B.R.reanimar;
        else if (B.bots.length === 1 && p.perks.includes('qr') && b.qr < 3) { b.qr++; b.caido = now + 6; }
        else { B.wipes++; if (r) r.time++; B.semConta = true; for (const q of B.bots) { q.caido = 0; q.vh = q.vmh; } }
        if (b.caido) b.vh = 0;
      }
    }
  };
  let ativos = null, ativosR = -1;
  B.mover = (b, dt) => { // recua do zumbi mais perto pela grade, sem passar da coleira
    const p = b.p, x0 = p.pos[0], z0 = p.pos[2]; let dn = 1e9;
    for (const z of T.Z.zs.values()) { if (!alvoOk(z)) continue; const dd = Math.hypot(z.body.pos.x - x0, z.body.pos.z - z0); if (dd < dn) dn = dd; }
    if (dn > B.R.kite) return;
    if (ativosR !== T.Z.round || !ativos) { ativos = T.zActive(); ativosR = T.Z.round; }
    const passo = B.R.kiteV * dt; let bx = x0, bz = z0, bs = -1e9;
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8, x = x0 + Math.cos(a) * passo, zz = z0 + Math.sin(a) * passo, c = T.ffCell(x, zz);
      if (c < 0 || !T.FF.walk[c] || !T.footFreeR(x, zz, .35)) continue; const rm = T.zRoomAt(x, zz); if (rm && !ativos.has(rm)) continue;
      let m = 1e9; for (const z of T.Z.zs.values()) { if (!alvoOk(z)) continue; const dd = Math.hypot(z.body.pos.x - x, z.body.pos.z - zz); if (dd < m) m = dd; }
      const s = Math.min(m, 8) - .5 * Math.max(0, Math.hypot(x - b.casa[0], zz - b.casa[1]) - B.R.coleira);
      if (s > bs) { bs = s; bx = x; bz = zz; }
    }
    p.pos[0] = bx; p.pos[2] = bz; if (p.id === 'h') T.me.pos.set(bx, p.pos[1], bz);
  };
  B.atirar = (b, now) => {
    const p = b.p, r = B.r; if (b.caido || now < b.prox || now < b.recAte) return;
    if (T.drProtecao && T.CAMP_CH?.z && T.drProtecao() < 1 && B.tanque(b, now)) return; // Diretor protegido: os tanques primeiro (a armadura dele)
    let alvo = null, ad = 1e9; for (const z of T.Z.zs.values()) { if (!alvoOk(z)) continue; const dd = Math.hypot(z.body.pos.x - p.pos[0], z.body.pos.z - p.pos[2]); if (dd < ad && dd < 60 && vis(p, z)) { ad = dd; alvo = z; } }
    if (!alvo) { // nada à vista: empurrado para trás de parede (investida, onda) ou longe da briga; depois de --perdido s volta para casa
      if (r) r.semAlvo++; if (T.Z.zs.size && !b.perdido) b.perdido = now; else if (b.perdido && now - b.perdido > B.R.perdido) { b.perdido = 0; p.pos[0] = b.casa[0]; p.pos[2] = b.casa[1]; if (p.id === 'h') T.me.pos.set(b.casa[0], p.pos[1], b.casa[1]); if (r) r.volta++; }
      return;
    }
    b.perdido = 0; b.visto = now;
    const w = b.w, wd = W[w], K = T.ZKIND[alvo.kind] || {}, m = { t: 'zhit', v: alvo.id, w, z: 'body' };
    const silencio = T.CAMP.on && !T.campZhitOk(p, m, alvo); // Hora do Silêncio: só a faca
    if (silencio || (ad < 2 && alvo.hp <= 300 && !K.chefe)) {
      if (ad > 2.2 || now < b.faca) return; b.faca = now + .5; if (r) r.facadas++; if (rnd() < B.R.mira) { if (r) r.acertos++; T.zHit(p, alvo.id, 150, 'body', 'knife', false); } return;
    }
    b.prox = now + (wd.rate || .2); b.mag--; if (r) r.tiros++;
    if (b.mag <= 0) { b.mag = wd.mag || 1; b.recAte = now + (wd.reload || 2) * (p.perks.includes('speed') ? .5 : 1); }
    if (rnd() >= B.R.mira) return;
    if (r) r.acertos++;
    let zona = rnd() < B.R.cabeca ? 'head' : 'body', dmg = (wd.dmg || 0) * (wd.pellets || 1);
    if (K.chefe && T.campZona(alvo, p) === 'fraco' && rnd() < .5) { zona = 'fraco'; dmg *= T.campFracoK(alvo); }
    else if (zona === 'head') dmg *= Math.max(wd.head || 4, 1);
    T.zHit(p, alvo.id, dmg, zona, w, false);
  };
  B.tanque = (b, now) => { // tiro no tanque do Veio de pé mais perto e à vista (zint 'g7-tanque', pelo campDanoPilar como o zintTiro)
    const p = b.p, L = T.ZD?.zint || []; let best = -1, bd = 1e9;
    for (let i = 0; i < L.length; i++) { const o2 = L[i]; if (typeof o2.id !== 'string' || !o2.id.startsWith('g7-tanque') || T.Z.zint?.[i]?.st === 'caido') continue;
      const dd = Math.hypot(o2.x - p.pos[0], o2.z - p.pos[2]); if (dd >= bd) continue; o.set(p.pos[0], p.pos[1] + 1.6, p.pos[2]); d.set(o2.x - o.x, 1.2 - o.y, o2.z - o.z); const L2 = d.length(); d.multiplyScalar(1 / L2); if (T.trace(o, d, L2).t < L2 - 1.2) continue; bd = dd; best = i; }
    if (best < 0) return false;
    const wd = W[b.w]; b.prox = now + (wd.rate || .2); b.mag--; if (B.r) B.r.tiros++; if (b.mag <= 0) { b.mag = wd.mag || 1; b.recAte = now + (wd.reload || 2) * (p.perks.includes('speed') ? .5 : 1); }
    if (rnd() < B.R.mira) { if (B.r) { B.r.acertos++; B.r.tanque = (B.r.tanque || 0) + 1; } T.campDanoPilar(best, (wd.dmg || 0) * (wd.pellets || 1), 0, p); }
    return true;
  };
  B.cacar = now => { // ninguém vê zumbi há --caca s (o último preso longe, o chefe escondido): o jogador iria atrás dele
    const Z = T.Z, r = B.r; for (const b of B.bots) b.visto = now;
    const ch = [...Z.zs.values()].find(z => T.ZKIND[z.kind]?.chefe && z.kind !== 6);
    if (ch) { // vai até perto do chefe: célula andável a 6–12 m com linha livre (conta como 'vaiChefe')
      const P = ch.body.pos; for (let k = 0; k < 48; k++) { const a = k * .9, dd = 6 + (k % 6), x = P.x + Math.cos(a) * dd, zz = P.z + Math.sin(a) * dd, c = T.ffCell(x, zz);
        if (c < 0 || !T.FF.walk[c] || !T.footFreeR(x, zz, .35)) continue; const b = B.bots[0], p = b.p, sx = p.pos[0], sz = p.pos[2]; p.pos[0] = x; p.pos[2] = zz;
        if (vis(p, ch)) { for (const q of B.bots) { q.p.pos[0] = x; q.p.pos[2] = zz; q.casa = [x, zz]; if (q.p.id === 'h') T.me.pos.set(x, q.p.pos[1], zz); } if (r) r.vaiChefe = (r.vaiChefe || 0) + 1; return; }
        p.pos[0] = sx; p.pos[2] = sz; }
      return;
    }
    if (Z.toSpawn > 0) return; // ainda vem gente: espera
    let n = 0; for (const z of [...Z.zs.values()]) { T.zKill(z, null, 'body', 'm1911', false, true); n++; } // os últimos, presos longe: contam como caçados (sem o tempo de ir até eles)
    if (r) r.cacados = (r.cacados || 0) + n;
  };
  B.passo = (dt, now) => {
    const Z = T.Z;
    for (const c of B.conns) c.lastSeen = performance.now();
    for (const id in T.CAMP.obj) { const O = T.CAMP.obj[id], D = T.CAMP_OBJ[id]; if (O.st === 'ativo' && D && D.tipo !== 'matar') T.campForca(id); }
    if (Z.phase === 'round' && Z.round !== B.rodAnt) { // rodada nova
      B.fecha(now); B.rodAnt = Z.round; B.semConta = false; for (const b of B.bots) { B.armar(b); b.visto = now; }
      B.r = { rodada: Z.round, ev: T.CAMP_EVS?.id || null, caes: Z.dogRound ? 1 : 0, t0: now, n0: Z.toSpawn, mix: Z.mix ? [...Z.mix] : null, tipos: {}, lac: 0, vivosMax: 0, dano: B.bots.map(() => 0), quedas: 0, time: 0, tiros: 0, facadas: 0, acertos: 0, semAlvo: 0, volta: 0, abates0: B.bots.reduce((s, b) => s + (b.p.kills || 0), 0), vistos: new Set() };
    }
    const r = B.r;
    if (r && Z.phase === 'round') {
      for (const z of Z.zs.values()) if (!r.vistos.has(z.id)) { r.vistos.add(z.id); if (z.lac) r.lac++; else r.tipos[z.kind] = (r.tipos[z.kind] || 0) + 1; if (T.ZKIND[z.kind]?.chefe && z.kind !== 6 && !B.chefe) B.chefe = { k: z.kind, t0: now, hp: z.maxHp || z.hp, rodada: Z.round }; }
      if (Z.zs.size > r.vivosMax) r.vivosMax = Z.zs.size;
      if (now - r.t0 > B.R.rodadaMax && !r.travou) { r.travou = 1; B.travadas++; for (const z of [...Z.zs.values()]) if (!T.ZKIND[z.kind]?.chefe) T.zKill(z, null, 'body', 'm1911', false, true); Z.toSpawn = 0; }
      for (const b of B.bots) { if (!b.caido) B.mover(b, dt); B.atirar(b, now); }
      if (Z.zs.size && B.bots.every(b => now - (b.visto ?? now) > B.R.caca)) B.cacar(now);
    }
    if (B.chefe && !B.chefe.fim && T.CAMP_CH && !T.CAMP_CH.z && ![...Z.zs.values()].some(z => z.kind === B.chefe.k)) B.chefe.fim = now;
    if (Z.phase !== 'round' && r && !r.fim) B.fecha(now);
  };
  B.fecha = now => { const r = B.r; if (!r || r.fim) return; r.fim = now; r.durS = +(now - r.t0).toFixed(1); r.abates = B.bots.reduce((s, b) => s + (b.p.kills || 0), 0) - r.abates0; delete r.vistos; delete r.abates0; r.dano = r.dano.map(Math.round); r.pts = B.bots.map(b => b.p.money); B.log.push(r); };
  return true;
}

// começa a etapa (como o checkpoint: kit do ato, mundo do ato), o 2º jogador entra na pré-rodada; devolve o tempo de carga
export async function comecar(pg, { etapa, dif = 1, np = 1, gpu = false, gfx = 'medio', ref = false, robo = ROBO_PADRAO, rodadaMax = 900, rodada = null, mapa = null, ate = null }) {
  // rodada: começa nesta rodada (ex.: 25 = o Diretor); ref 'classico' | 'infinito' (true = 'classico'): o modo de referência no mapa
  // da etapa (ou mapa), da rodada (rodada ou rod0) até ate (ou rodMin), com o kit da etapa
  if (ref === true) ref = 'classico';
  const t0 = Date.now();
  const ok = await pg.evaluate(({ etapa, dif, gfx, gpu, ref, mapa }) => {
    const T = window.__T, A = T.CAMP_ATOS, e = A.findIndex(a => a.id === etapa); if (e < 0 || !T.MAPS[A[e].mapa]) return 'sem etapa ' + etapa;
    if (gpu) { T.CFG.gfx = gfx; try { T.applyQuality(); } catch { } }
    if (ref) { const m = mapa || A[e].mapa; if (ref === 'infinito') T.campLibera(4, 3, true); T.startHost({ map: m, zmap: m, mode: 'zombies', zmode: ref, rounds: 8, frags: 20, bots: 0, diff: 1, zdiff: dif }); window.__simLock = true; return true; } // referência: o clássico ou o infinito
    T.campLibera(4, 3); const sv = A.map(a => a.ato); for (let k = 0; k < e; k++) if (A[k].ato === A[e].ato) A[k].ato = -1; // só no bench: o ato começa nesta etapa (chefes de arena)
    try { T.startHost({ map: A[e].mapa, zmap: A[e].mapa, mode: 'zombies', zmode: 'campanha', ato: sv[e], rounds: 8, frags: 20, bots: 0, diff: 1, zdiff: dif }); } finally { A.forEach((a, k) => { a.ato = sv[k]; }); }
    window.__simLock = true; // o relógio do jogo só anda pelo T.sim (a carga lenta não deixa a rodada correr sem o robô)
    return T.CAMP.et === e ? true : 'etapa ' + T.CAMP.et + ' != ' + e;
  }, { etapa, dif, gfx, gpu, ref, mapa });
  if (ok !== true) throw new Error(ok);
  await pg.waitForFunction(() => !document.getElementById('warmMsg') && window.__T.ZC.world, null, { timeout: 600000, polling: 250 });
  const carga = Date.now() - t0;
  await pg.evaluate(({ np, R, ref, etapa, rodada, ate }) => {
    const T = window.__T; window.__simLock = true; (new Function('return ' + R.src)())(R); const B = window.__D15;
    for (let i = 1; i < np; i++) { // 2º jogador: join como quem entra no meio (na pré-rodada recebe o kit da etapa)
      const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; } };
      for (let pv = 3; pv < 12 && !c.pid; pv++) { c.out.length = 0; T.srvOnData(c, { t: 'join', v: 2, pv, name: 'Robô ' + (i + 1) }); }
      if (c.pid) B.conns.push(c);
    }
    if (T.Z.phase === 'round') { T.Z.zs.clear(); T.Z.round--; T.zStartRound(); } // a 1ª rodada começou no relógio real durante o aquecimento: recomeça no relógio travado
    T.sim(.1); // campEntradas: kit do 2º
    if (ref) { // clássico na mesma rodada, com o mesmo kit (armas, bebidas = só a vida do Juggernog, pontos)
      const A = T.CAMP_ATOS.find(a => a.id === etapa), K = T.CAMP_KIT[etapa] || {}, ar = [].concat(K.armas || []);
      for (const p of T.S.players.values()) { p.inv.primary = ar[0] || 'm1911'; p.inv.secondary = ar[1] || null; p.perks = [].concat(K.bebidas || []); p.maxHp = p.perks.includes('jug') ? 250 : 100; p.money = K.pts ?? T.zDf().pts; }
      T.Z.zs.clear(); T.Z.toSpawn = 0; T.Z.round = (rodada ?? A.rod0) - 1; T.Z.phase = 'pre'; T.Z.phaseEnd = window.__simNow + 1; B.ref = { fim: ate ?? A.rodMin };
    }
    if (rodada && !ref && T.Z.phase === 'pre' && rodada > T.Z.round + 1) T.Z.round = rodada - 1;
    for (const p of T.S.players.values()) { const b = B.novo(p); B.armar(b); }
    if (T.CAMP.c) T.CAMP.c.cena = null;
  }, { np, ref, etapa, rodada, ate, R: { ...ROBO_PADRAO, ...robo, rodadaMax, src: instalarRobo.toString() } });
  return carga;
}

// joga a etapa no relógio travado até o fim dela (ou o teto de tempo de jogo); devolve o estado final e as medidas do robô
export async function jogar(pg, { teto = 3600, semente = null } = {}) {
  if (semente != null) await pg.evaluate(rs => { window.__D15.R.semente = rs; }, semente);
  let st;
  for (;;) { // 30 s de jogo por chamada
    st = await pg.evaluate(({ TETO }) => {
      const T = window.__T, B = window.__D15, dt = 1 / 60; if (B.t0 == null) B.t0 = window.__simNow;
      for (let i = 0; i < 1800; i++) {
        B.antes(); T.sim(dt); const now = window.__simNow; B.depois(dt, now); B.passo(dt, now);
        if (T.CAMP.fim || T.S.phase === 'over' || now - B.t0 > TETO || (B.ref && (T.Z.round > B.ref.fim || (T.Z.round === B.ref.fim && T.Z.phase !== 'round')))) break;
      }
      const now = window.__simNow; return { fim: !!T.CAMP.fim || !!(B.ref && T.Z.round >= B.ref.fim && T.Z.phase !== 'round'), over: T.S.phase === 'over', teto: now - B.t0 > TETO, t: now - B.t0, round: T.Z.round, phase: T.Z.phase, vivos: T.Z.zs.size, toSpawn: T.Z.toSpawn };
    }, { TETO: teto });
    if (st.fim || st.over || st.teto) break;
  }
  const res = await pg.evaluate(() => { const T = window.__T, B = window.__D15, now = window.__simNow; B.fecha(now);
    return { tempoS: +(now - B.t0).toFixed(1), quedasTime: B.wipes, travadas: B.travadas, chefe: B.chefe ? { ...B.chefe, durS: B.chefe.fim ? +(B.chefe.fim - B.chefe.t0).toFixed(1) : null } : null, rodadas: B.log,
      pts: B.bots.map(b => b.p.money), kit: B.bots.map(b => ({ armas: [b.p.inv.primary, b.p.inv.secondary].filter(Boolean), arma: b.w, vida: b.vmh, bebidas: [...b.p.perks] })) }; });
  return { st, res };
}
