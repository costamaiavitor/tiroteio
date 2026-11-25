// Núcleo dos avatares procedurais: primitivas SDF em camadas -> campo de distância numa grade -> malha
// (cubos voxel com AO por vértice, "surface nets" liso ou facetado). Sem dependência do jogo além do three.
import * as THREE from '../../vendor/three@0.160.0/build/three.module.js';
export const V = THREE.Vector3, M4 = THREE.Matrix4;
export const v = (x, y, z) => new V(x, y, z);
const _q = new THREE.Quaternion(), _e = new THREE.Euler();

// ---------- cores (sRGB 0..1) ----------
export const hx = h => { if (Array.isArray(h)) return h; if (typeof h === 'string') h = parseInt(h.replace('#', ''), 16); return [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255]; };
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const sat = (c, k) => { const l = c[0] * .3 + c[1] * .59 + c[2] * .11; return c.map(x => Math.max(0, Math.min(1, l + (x - l) * k))); };

// ---------- ruído ----------
export function hash3(x, y, z) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1440662683); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
export function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf), t = zf * zf * (3 - 2 * zf);
  const l = (a, b, k) => a + (b - a) * k, h = hash3;
  return l(l(l(h(xi, yi, zi), h(xi + 1, yi, zi), u), l(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u), w),
    l(l(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u), l(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u), w), t);
}
export function fbm(x, y, z, o = 3) { let a = 0, amp = .5, f = 1, n = 0; for (let i = 0; i < o; i++) { a += amp * vnoise(x * f, y * f, z * f); n += amp; f *= 2.03; amp *= .5; } return a / n; }
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s = Math.imul(s ^ (s >>> 15), 2246822519) + 0x9e3779b9 >>> 0; s ^= s >>> 13; return (s >>> 0) / 4294967296; }; }

// ---------- quadros (frames) ----------
export function mk(pos, rot = [0, 0, 0], s = 1) { _e.set(rot[0], rot[1], rot[2], 'YXZ'); return new M4().compose(pos.isVector3 ? pos.clone() : v(...pos), _q.setFromEuler(_e).clone(), v(s, s, s)); }
export const child = (F, pos, rot, s) => F.clone().multiply(mk(pos, rot, s));
export const wp = (F, p) => v(...p).applyMatrix4(F);
export function segFrame(A, B, pole, s = 1) { // y ao longo de A->B, z para o polo
  const y = B.clone().sub(A).normalize(), z = pole.clone().addScaledVector(y, -pole.dot(y)).normalize(), x = new V().crossVectors(y, z);
  const m = new M4().makeBasis(x.multiplyScalar(s), y.clone().multiplyScalar(s), z.multiplyScalar(s)); m.setPosition(A); return m;
}
export function ik(S, T, L1, L2, pole) {
  const d = T.clone().sub(S); let L = Math.min(d.length(), L1 + L2 - 1e-3); d.normalize();
  const x = (L1 * L1 - L2 * L2 + L * L) / (2 * L), h = Math.sqrt(Math.max(0, L1 * L1 - x * x));
  const pv = pole.clone().addScaledVector(d, -pole.dot(d)).normalize();
  return [S.clone().addScaledVector(d, x).addScaledVector(pv, h), S.clone().addScaledVector(d, L)];
}
const ID = new M4();

// ---------- construtor de primitivas ----------
// tipos: 0 elipsoide, 1 caixa arredondada, 2 cone arredondado, 3 cilindro, 4 toro
// kind: add (geometria), cut (subtrai), paint (só cor, na superfície já pronta, filtrável por tag do dono com `on`)
export class Bld {
  constructor() { this.P = []; }
  _add(t, F, L, p, col, o = {}) {
    F = F || ID; const M = F.clone().multiply(L);
    const pr = { t, M, F, p, col, inf: o.inf || 0, bias: o.bias || 0, kind: o.kind || 'add', reg: o.reg, side: o.side, tag: o.tag || '', layer: o.layer || 0, on: o.on, body: !!o.body, clips: [] };
    if (o.clip) for (const c of o.clip) pr.clips.push(c.F ? planeW(c.F, c.o, c.n) : c);
    this.P.push(pr); return pr;
  }
  ell(F, pos, r, rot, col, o) { return this._add(0, F, mk(pos, rot || [0, 0, 0]), r, col, o); }
  box(F, pos, h, rr, rot, col, o) { return this._add(1, F, mk(pos, rot || [0, 0, 0]), [...h, rr], col, o); }
  cone(F, a, b, ra, rb, col, o) { return this._add(2, F, new M4(), [...(a.isVector3 ? a.toArray() : a), ...(b.isVector3 ? b.toArray() : b), ra, rb], col, o); }
  cyl(F, pos, r, h, rr, rot, col, o) { return this._add(3, F, mk(pos, rot || [0, 0, 0]), [r, h, rr], col, o); }
  tor(F, pos, R, r, rot, col, o) { return this._add(4, F, mk(pos, rot || [0, 0, 0]), [R, r], col, o); }
  // veste: copia as primitivas do corpo das regiões dadas, infladas, com outra cor/tag (e cortes por plano)
  wear(regs, inf, col, o = {}) {
    const out = [];
    for (const p of this.P.slice()) if (p.body && regs.includes(p.reg) && (!o.side || p.side === o.side)) {
      const q = { ...p, inf: p.inf + inf + (o.extra?.(p) || 0), col, tag: o.tag || 'roupa', body: false, bias: o.bias || 0, layer: o.layer || 0, kind: 'add', clips: [...p.clips] };
      const c = o.clip?.(p); if (c) for (const k of c) if (k) q.clips.push(k.F ? planeW(k.F, k.o, k.n) : k);
      if (o.clip?.(p) === false) continue;
      this.P.push(q); out.push(q);
    }
    return out;
  }
}
export function planeW(F, o, n) { const O = v(...o).applyMatrix4(F); const N = v(...n).transformDirection(F); return { O, N }; }
export const pl = (F, o, n) => ({ F, o, n });

// ---------- SDF ----------
function sdf(t, p, x, y, z) {
  switch (t) {
    case 0: { const k0 = Math.hypot(x / p[0], y / p[1], z / p[2]), k1 = Math.hypot(x / (p[0] * p[0]), y / (p[1] * p[1]), z / (p[2] * p[2])); return k1 < 1e-9 ? -Math.min(p[0], p[1], p[2]) : k0 * (k0 - 1) / k1; }
    case 1: { const r = p[3], qx = Math.abs(x) - p[0] + r, qy = Math.abs(y) - p[1] + r, qz = Math.abs(z) - p[2] + r; return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r; }
    case 2: { // cone arredondado (iq)
      const ax = p[0], ay = p[1], az = p[2], bx = p[3] - ax, by = p[4] - ay, bz = p[5] - az, r1 = p[6], r2 = p[7];
      const l2 = bx * bx + by * by + bz * bz, rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
      const px = x - ax, py = y - ay, pz = z - az, yy = px * bx + py * by + pz * bz, zz = yy - l2;
      const cx = px * l2 - bx * yy, cy = py * l2 - by * yy, cz = pz * l2 - bz * yy, x2 = cx * cx + cy * cy + cz * cz;
      const y2 = yy * yy * l2, z2 = zz * zz * l2, k = Math.sign(rr) * rr * rr * x2;
      if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
      if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
      return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - r1;
    }
    case 3: { const r = p[2], dx = Math.hypot(x, z) - p[0] + r, dy = Math.abs(y) - p[1] + r; return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) - r; }
    case 4: return Math.hypot(Math.hypot(x, z) - p[0], y) - p[1];
  }
}
function laabb(t, p) {
  switch (t) {
    case 0: return [-p[0], -p[1], -p[2], p[0], p[1], p[2]];
    case 1: return [-p[0], -p[1], -p[2], p[0], p[1], p[2]];
    case 2: { const r = Math.max(p[6], p[7]); return [Math.min(p[0], p[3]) - r, Math.min(p[1], p[4]) - r, Math.min(p[2], p[5]) - r, Math.max(p[0], p[3]) + r, Math.max(p[1], p[4]) + r, Math.max(p[2], p[5]) + r]; }
    case 3: return [-p[0], -p[1], -p[0], p[0], p[1], p[0]];
    case 4: return [-p[0] - p[1], -p[1], -p[0] - p[1], p[0] + p[1], p[1], p[0] + p[1]];
  }
}
function prep(pr) {
  if (pr._ok) return; pr._ok = true;
  pr.s = pr.M.getMaxScaleOnAxis(); const Mi = pr.M.clone().invert(); pr.Mi = Mi.elements.slice();
  pr.Fi = pr.F.clone().invert().elements.slice();
  pr.lc = pr.clips.map(c => { const o = c.O.clone().applyMatrix4(Mi), n = c.N.clone().transformDirection(Mi); return [o.x, o.y, o.z, n.x, n.y, n.z]; });
  const b = laabb(pr.t, pr.p), i = pr.inf / pr.s, mn = v(1e9, 1e9, 1e9), mx = v(-1e9, -1e9, -1e9), c = new V();
  for (let k = 0; k < 8; k++) { c.set(k & 1 ? b[3] + i : b[0] - i, k & 2 ? b[4] + i : b[1] - i, k & 4 ? b[5] + i : b[2] - i).applyMatrix4(pr.M); mn.min(c); mx.max(c); }
  pr.bb = [mn.x, mn.y, mn.z, mx.x, mx.y, mx.z];
  pr.loc = (x, y, z) => { const e = pr.Fi; return [e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]]; };
}

// ---------- campo ----------
export function bake(P, res, pad = 3) {
  P.forEach(prep);
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (const p of P) if (p.kind === 'add') for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], p.bb[a]); mx[a] = Math.max(mx[a], p.bb[a + 3]); }
  const o = mn.map(m => m - pad * res), n = [0, 1, 2].map(a => Math.ceil((mx[a] - mn[a]) / res) + 2 * pad);
  const [nx, ny, nz] = n, N = nx * ny * nz;
  const D = new Float32Array(N).fill(1), S = new Float32Array(N).fill(1), O = new Int32Array(N).fill(-1), PT = new Int32Array(N).fill(-1);
  const ordem = P.map((p, k) => k).sort((a, b) => (P[a].kind === 'paint') - (P[b].kind === 'paint') || a - b);
  for (const k of ordem) {
    const p = P[k], m = p.kind === 'paint' ? 0 : 2, e = p.Mi, s = p.s, t = p.t, pp = p.p, inf = p.inf, lc = p.lc, nc = lc.length, bias = p.bias;
    const i0 = Math.max(0, Math.floor((p.bb[0] - o[0]) / res) - m), i1 = Math.min(nx - 1, Math.ceil((p.bb[3] - o[0]) / res) + m);
    const j0 = Math.max(0, Math.floor((p.bb[1] - o[1]) / res) - m), j1 = Math.min(ny - 1, Math.ceil((p.bb[4] - o[1]) / res) + m);
    const k0 = Math.max(0, Math.floor((p.bb[2] - o[2]) / res) - m), k1 = Math.min(nz - 1, Math.ceil((p.bb[5] - o[2]) / res) + m);
    const on = p.on ? new Set(p.on) : null;
    for (let kk = k0; kk <= k1; kk++) { const z = o[2] + (kk + .5) * res;
      for (let jj = j0; jj <= j1; jj++) { const y = o[1] + (jj + .5) * res; let idx = jj * nx + kk * nx * ny + i0;
        for (let ii = i0; ii <= i1; ii++, idx++) { const x = o[0] + (ii + .5) * res;
          const lx = e[0] * x + e[4] * y + e[8] * z + e[12], ly = e[1] * x + e[5] * y + e[9] * z + e[13], lz = e[2] * x + e[6] * y + e[10] * z + e[14];
          let d = sdf(t, pp, lx, ly, lz);
          for (let c = 0; c < nc; c++) { const L = lc[c]; const dc = (lx - L[0]) * L[3] + (ly - L[1]) * L[4] + (lz - L[2]) * L[5]; if (dc > d) d = dc; }
          d = d * s - inf;
          if (p.kind === 'add') { if (d < D[idx]) D[idx] = d; if (d - bias < S[idx] && d < res * 1.5) { S[idx] = d - bias; O[idx] = k; } }
          else if (p.kind === 'cut') { if (-d > D[idx]) D[idx] = -d; }
          else if (d <= 0 && O[idx] >= 0 && (!on || on.has(P[O[idx]].tag))) PT[idx] = k;
        } } }
  }
  return { D, O, PT, nx, ny, nz, o, res, P };
}

const lin = c => c.map(x => Math.pow(x, 2.2));
function corCelula(G, idx, x, y, z) {
  let k = G.PT[idx]; if (k < 0) k = G.O[idx]; if (k < 0) return [1, 0, 1];
  const p = G.P[k]; return typeof p.col === 'function' ? p.col(x, y, z, p) : (p._c || (p._c = hx(p.col)));
}

// AO de cavidade: fração de células cheias em volta (0,5 = parede plana)
function aoCav(G, sol, i, j, k, R, st) {
  const { nx, ny, nz } = G; let c = 0, t = 0;
  for (let dz = -R; dz <= R; dz += st) for (let dy = -R; dy <= R; dy += st) for (let dx = -R; dx <= R; dx += st) {
    const a = i + dx, b = j + dy, e = k + dz; t++; if (a < 0 || b < 0 || e < 0 || a >= nx || b >= ny || e >= nz) continue; c += sol[a + nx * (b + ny * e)];
  }
  const f = c / t; return Math.max(.42, Math.min(1.12, 1 - (f - .46) * 1.5));
}

// ---------- malha de cubos (voxel com AO por vértice) ----------
const DIRS = [[0, 1, 2, 1], [0, 2, 1, -1], [1, 2, 0, 1], [1, 0, 2, -1], [2, 0, 1, 1], [2, 1, 0, -1]]; // eixo, t1, t2, sinal (t1×t2 = n)
export function meshCubos(G, { jit = .05, cru = false } = {}) {
  const { D, nx, ny, nz, o, res } = G, N = nx * ny * nz, sol = new Uint8Array(N);
  for (let i = 0; i < N; i++) sol[i] = D[i] <= 0;
  const S = (i, j, k) => (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz) ? 0 : sol[i + nx * (j + ny * k)];
  const pos = [], nor = [], col = [], ind = []; let nv = 0;
  const R = Math.max(1, Math.min(4, Math.round(.026 / res))), st = R > 2 ? 2 : 1;
  const AOV = [.5, .68, .84, 1];
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const idx = i + nx * (j + ny * k); if (!sol[idx]) continue;
    let cc = null;
    for (const [ax, t1, t2, sg] of DIRS) {
      const c = [i, j, k]; c[ax] += sg; if (S(c[0], c[1], c[2])) continue;
      if (!cc) { const x = o[0] + (i + .5) * res, y = o[1] + (j + .5) * res, z = o[2] + (k + .5) * res; cc = corCelula(G, idx, x, y, z); const h = 1 + (hash3(i, j, k) - .5) * 2 * jit; cc = lin(mul(cc, h)); }
      const cav = aoCav(G, sol, c[0], c[1], c[2], R, st);
      const ao = [];
      for (let q = 0; q < 4; q++) {
        const u = (q === 1 || q === 2) ? 1 : 0, w = (q >= 2) ? 1 : 0;
        const a = c.slice(); a[t1] += u ? 1 : -1; const s1 = S(a[0], a[1], a[2]);
        const b = c.slice(); b[t2] += w ? 1 : -1; const s2 = S(b[0], b[1], b[2]);
        const d = c.slice(); d[t1] += u ? 1 : -1; d[t2] += w ? 1 : -1; const s3 = S(d[0], d[1], d[2]);
        ao.push(s1 && s2 ? 0 : 3 - s1 - s2 - s3);
        const p = [i, j, k]; if (sg > 0) p[ax] += 1; p[t1] += u; p[t2] += w;
        pos.push(o[0] + p[0] * res, o[1] + p[1] * res, o[2] + p[2] * res);
        const nn = [0, 0, 0]; nn[ax] = sg; nor.push(...nn);
        const f = AOV[ao[q]] * cav; col.push(cc[0] * f, cc[1] * f, cc[2] * f);
      }
      if (ao[0] + ao[2] >= ao[1] + ao[3]) ind.push(nv, nv + 1, nv + 2, nv, nv + 2, nv + 3); else ind.push(nv + 1, nv + 2, nv + 3, nv + 1, nv + 3, nv);
      nv += 4;
    }
  }
  return cru ? { pos, nor, col, ind } : geo(pos, nor, col, ind);
}
function geo(pos, nor, col, ind) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (nor) g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(ind, 1) : new THREE.Uint16BufferAttribute(ind, 1));
  return g;
}

// ---------- surface nets (liso / facetado) ----------
export function meshNets(G, { flat = false, jit = .02 } = {}) {
  const { D, nx, ny, nz, o, res } = G, N = nx * ny * nz, sol = new Uint8Array(N);
  for (let i = 0; i < N; i++) sol[i] = D[i] <= 0;
  const VI = new Int32Array(N).fill(-1), pos = [], col = [], ind = [];
  const R = Math.max(1, Math.min(4, Math.round(.026 / res))), st = R > 2 ? 2 : 1;
  const sx = 1, sy = nx, sz = nx * ny, cor = [0, sx, sy, sx + sy, sz, sz + sx, sz + sy, sz + sx + sy];
  const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cp = k => [k & 1, (k >> 1) & 1, (k >> 2) & 1];
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const idx = i + nx * (j + ny * k); let m = 0; for (let c = 0; c < 8; c++) if (sol[idx + cor[c]]) m |= 1 << c;
    if (m === 0 || m === 255) continue;
    let ax = 0, ay = 0, az = 0, n = 0;
    for (const [a, b] of E) { if (((m >> a) & 1) === ((m >> b) & 1)) continue; const da = D[idx + cor[a]], db = D[idx + cor[b]], t = da / (da - db), A = cp(a), B = cp(b); ax += A[0] + (B[0] - A[0]) * t; ay += A[1] + (B[1] - A[1]) * t; az += A[2] + (B[2] - A[2]) * t; n++; }
    const x = o[0] + (i + .5 + ax / n) * res, y = o[1] + (j + .5 + ay / n) * res, z = o[2] + (k + .5 + az / n) * res;
    let best = -1, bd = -1e9; for (let c = 0; c < 8; c++) { const q = idx + cor[c]; if (sol[q] && D[q] > bd) { bd = D[q]; best = q; } }
    let cc = corCelula(G, best, x, y, z); cc = lin(mul(cc, 1 + (hash3(i, j, k) - .5) * 2 * jit));
    const f = aoCav(G, sol, i + Math.round(ax / n), j + Math.round(ay / n), k + Math.round(az / n), R, st);
    VI[idx] = pos.length / 3; pos.push(x, y, z); col.push(cc[0] * f, cc[1] * f, cc[2] * f);
  }
  const P = new V(), Q = new V(), Rr = new V();
  const quad = (a, b, c, d, nd) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    P.fromArray(pos, a * 3); Q.fromArray(pos, b * 3).sub(P); Rr.fromArray(pos, c * 3).sub(P); const cr = Q.cross(Rr);
    if (cr.getComponent(nd[0]) * nd[1] < 0) ind.push(a, d, c, a, c, b); else ind.push(a, b, c, a, c, d);
  };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const idx = i + nx * (j + ny * k), s0 = sol[idx];
    if (s0 !== sol[idx + sx]) quad(VI[idx - sy - sz], VI[idx - sz], VI[idx], VI[idx - sy], [0, s0 ? 1 : -1]);
    if (s0 !== sol[idx + sy]) quad(VI[idx - sx - sz], VI[idx - sx], VI[idx], VI[idx - sz], [1, s0 ? 1 : -1]);
    if (s0 !== sol[idx + sz]) quad(VI[idx - sx - sy], VI[idx - sy], VI[idx], VI[idx - sx], [2, s0 ? 1 : -1]);
  }
  let g = geo(pos, null, col, ind);
  if (flat) { g = g.toNonIndexed(); const c = g.attributes.color.array; for (let t = 0; t < c.length; t += 9) for (let a = 0; a < 3; a++) { const m = (c[t + a] + c[t + 3 + a] + c[t + 6 + a]) / 3; c[t + a] = c[t + 3 + a] = c[t + 6 + a] = m; } }
  g.computeVertexNormals();
  return g;
}
