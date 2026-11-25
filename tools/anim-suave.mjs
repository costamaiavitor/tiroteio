// Mede descontinuidades das animações da arma em 1ª pessoa (60 Hz). Uso: REPO_DIR=. TAG=x node tools/anim-suave.mjs (IDS="ak47 ..." opcional)
// da câmera da arma. Salto = 2ª diferença (aceleração por quadro²) acima do limiar; quadros vizinhos marcados contam como um evento.
// Uso: REPO_DIR=<worktree> TAG=antes node suave.mjs   (IDS="ak47 p90 ..." opcional)
import { abrir, sala, dar, ev, wait } from './anim-lib.mjs';
import { writeFile } from 'node:fs/promises';
const TAG = process.env.TAG || 'x';
const IDS = (process.env.IDS || 'ak47 m4 galil p90 mp5 m249 glock deagle awp scout nova').split(' ');
const LIM = { p: .004, r: .035, h: .006 }; // m/quadro², rad/quadro², m/quadro² (mãos)
const { page, erros, fechar } = await abrir({ w: 640, h: 360 });
await sala(page, { mode: 'dm', map: 'dust', espera: 4000 });
await page.evaluate(() => { const cv = document.querySelector('canvas'); Object.defineProperty(document, 'pointerLockElement', { get: () => cv, configurable: true }); });
await ev(page, T => { T.scene.visible = false; });

// roda um cenário quadro a quadro; passos: [segundos, ação antes ('' nenhuma)]
const roda = (page, passos) => ev(page, (T, passos) => {
  const THREE = T.V3 && T.camera.constructor; const G = T.G, me = T.me;
  const keep = () => { me.vel.set(0, 0, 0); me.sprinting = false; me.crouch = false; T.S.phaseEnd = T.NOW + 1e7; const p = T.S.players.get('h'); if (p) p.hp = 100; };
  const acts = {
    draw: () => { T.equip('knife', true); T.sim(1 / 60); T.equip(window.__id, true); },
    rel: () => { const a = G.ammo[G.cur]; a.mag = Math.max(1, Math.floor(T.W[G.cur].mag / 2)); a.res = 90; T.startReload(); },
    relE: () => { const a = G.ammo[G.cur]; a.mag = 0; a.res = 90; T.startReload(); },
    insp: () => { G.gin = null; T.armaInspect(); },
    fire: () => { const a = G.ammo[G.cur]; if (a.mag < 1) a.mag = 5; G.nextFire = 0; G.trigger = true; },
    ads: () => { G.adsHold = true; }, noads: () => { G.adsHold = false; },
    run: () => { window.__run = 1; }, norun: () => { window.__run = 0; },
  };
  const out = [];
  const Mc = new T.camera.matrixWorld.constructor(), M = new T.camera.matrixWorld.constructor();
  const pv = (o) => { M.multiplyMatrices(Mc, o.matrixWorld); const e = M.elements; return [e[12], e[13], e[14], e[0], e[1], e[2], e[4], e[5], e[6]]; };
  for (const [s, a] of passos) {
    if (a) for (const k of a.split(',')) acts[k]();
    let mf = a && a.includes('fire') && !(T.G.reloadEnd);
    for (let t = 0; t < s - 1e-6; t += 1 / 60) {
      keep(); if (window.__run) { me.sprinting = true; }
      G.kick = 0; G.kickL = 0; T.sim(1 / 60); G.trigger = false;
      const g = T.vmGun; if (!g) { out.push(null); continue; }
      { let r = T.vmRoot; while (r.parent) r = r.parent; r.updateMatrixWorld(true); } T.vmCam.updateMatrixWorld(true); Mc.copy(T.vmCam.matrixWorld).invert();
      const F = g.userData.fps2, f = { g: pv(g), id: g.uuid };
      if (F?.body) f.b = pv(F.body);
      if (F?.ik) f.h = F.ik.arms.filter(x => x.hand).map(x => pv(x.hand).slice(0, 3));
      if (mf) { f.fire = 1; mf = false; }
      out.push(f);
    }
  }
  return out;
}, passos);

const CEN = {
  draw: [[.3, ''], [1.4, 'draw']],
  rel: [[.3, ''], [0, 'rel'], [0, ''], [6.5, '']],
  relE: [[.3, ''], [0, 'relE'], [6.5, '']],
  insp: [[.3, ''], [3.2, 'insp']],
  inspFire: [[.3, ''], [1.1, 'insp'], [1, 'fire']],
  inspAds: [[.3, ''], [1.1, 'insp'], [1, 'ads'], [.6, 'noads']],
  ads: [[.3, ''], [.8, 'ads'], [.8, 'noads']],
  relFire: [[.3, ''], [.9, 'rel'], [1.2, 'fire']],
};
function analisa(fr) {
  const ev = [], K = [['g', 0, LIM.p], ['g', 1, LIM.r], ['b', 0, LIM.p], ['b', 1, LIM.r], ['h', 0, LIM.h], ['h', 1, LIM.h]];
  const val = (f, k, i) => { if (!f || !f[k]) return null; if (k === 'h') return f.h[i] || null; return i === 0 ? f[k].slice(0, 3) : f[k].slice(3, 9); };
  let max = {}; const fi = fr.findIndex(f => f && f.fire); // recuo do tiro (fora da recarga): de propósito, fica de fora

  const sp = []; // saltos: aceleração de um quadro bem acima da dos vizinhos (degrau de velocidade / pose que pula), e não só movimento rápido
  for (const [k, i, lim] of K) {
    let last = -9, lastS = -9; const D = [];
    for (let n = 1; n < fr.length - 1; n++) {
      const a = val(fr[n - 1], k, i), b = val(fr[n], k, i), c = val(fr[n + 1], k, i); if (!a || !b || !c || fr[n - 1].id !== fr[n + 1].id || (fi >= 0 && n >= fi - 1 && n <= fi + 14)) continue;
      let d = 0; for (let j = 0; j < a.length; j++) d += (c[j] - 2 * b[j] + a[j]) ** 2; d = Math.sqrt(d); D[n] = d;
      const nome = k + (k === 'h' ? i : i ? 'r' : 'p'); max[nome] = Math.max(max[nome] || 0, d);
      if (d > lim) { if (n - last > 3) ev.push([n, nome, +d.toFixed(4)]); last = n; }
    }
    const nome = k + (k === 'h' ? i : i ? 'r' : 'p');
    for (let n = 0; n < D.length; n++) { const d = D[n]; if (d == null || d < lim / 2) continue; const v = Math.max(D[n - 3] ?? 0, D[n + 3] ?? 0, D[n - 4] ?? 0, D[n + 4] ?? 0);
      if (d > 2.5 * v + lim / 4) { if (n - lastS > 3) sp.push([n, nome, +d.toFixed(4), +v.toFixed(4)]); lastS = n; } }
  }
  return { n: ev.length, s: sp.length, sp: sp.slice(0, 12), ev: ev.slice(0, 12), max: Object.fromEntries(Object.entries(max).map(([k, v]) => [k, +v.toFixed(4)])) };
}
const R = {};
for (const id of IDS) {
  try {
    const r = await dar(page, id, { ms: 120000 });
    const pk = await ev(page, T => { const F = T.vmGun?.userData.fps2; return F?.P ? Object.keys(T.FPK).find(k => T.FPK[k] === F.P) : null; });
    await ev(page, (T, id) => { window.__id = id; window.__simNow = T.NOW; }, id);
    R[id] = { pk };
    for (const [c, passos] of Object.entries(CEN)) {
      await ev(page, T => { const G = T.G; G.reloadEnd = 0; G.reload = null; G.adsHold = false; G.gin = null; T.sim(.8); });
      const fr = await roda(page, passos); R[id][c] = analisa(fr);
      console.log(id, pk, c, 'acel', R[id][c].n, 'saltos', R[id][c].s, JSON.stringify(R[id][c].sp.slice(0, 6)), JSON.stringify(R[id][c].max));
    }
  } catch (e) { console.log(id, 'ERRO', String(e).slice(0, 200)); }
}
await writeFile(`${process.env.OUT || '.'}/suave_${TAG}.json`, JSON.stringify(R, null, 1));
const tot = {}; for (const id in R) for (const c in R[id]) if (R[id][c]?.n != null) { tot[c] = tot[c] || [0, 0]; tot[c][0] += R[id][c].n; tot[c][1] += R[id][c].s; }
console.log('TOTAL', JSON.stringify(tot), 'erros', erros.slice(0, 3));
await fechar();
