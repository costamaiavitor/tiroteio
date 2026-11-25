// Texturas procedurais (cor por posição) usadas pelos avatares: tecido, camuflagens, xadrez, jeans, couro, malha, etc.
import { hx, mix, mul, vnoise, fbm, hash3 } from './nucleo.js';

const fn = c => typeof c === 'function' ? c : (() => { const h = hx(c); return () => h; })();
// tecido: rugas finas (linhas onde o ruído cruza 0,5) + trama
export const fab = (c, k = .14, f = 1) => { const C = fn(c);
  return (x, y, z, p) => { const b = C(x, y, z, p), n = vnoise(x * 11 * f, y * 26 * f, z * 11 * f), cr = Math.exp(-(((n - .5) * 13) ** 2)), m = vnoise(x * 140, y * 140, z * 140);
    return mul(b, 1 - k * cr + (m - .5) * .05); }; };
export const liso = (c, k = .06) => { const C = fn(c); return (x, y, z, p) => mul(C(x, y, z, p), 1 + (vnoise(x * 90, y * 90, z * 90) - .5) * k); };
export const metal = c => liso(c, .18);
export const couro = c => { const C = hx(c); return (x, y, z) => { const n = fbm(x * 30, y * 30, z * 30, 2); return mul(mix(C, [C[0] * 1.5, C[1] * 1.45, C[2] * 1.4], Math.max(0, n - .55) * 1.6), 1 - Math.exp(-(((vnoise(x * 9, y * 20, z * 9) - .5) * 12) ** 2)) * .25); }; };
export const madeira = c => { const C = hx(c); return (x, y, z, p) => { const l = p.loc(x, y, z); return mul(C, .85 + .3 * vnoise(l[0] * 30, l[1] * 30, l[2] * 2.5)); }; };
export const malha = (c, k = .2) => { const C = fn(c); return (x, y, z, p) => { const l = p.loc(x, y, z); return mul(C(x, y, z, p), 1 - k * (Math.sin(Math.atan2(l[0], l[2]) * 60) > 0) - .05 * (Math.sin(l[1] * 500) > 0)); }; };
export const denim = (c, gasto = .35) => { const C = hx(c); return fab((x, y, z) => mul(mix(C, [.82, .86, .93], fbm(x * 6, y * 5, z * 6) * gasto - .05), 1 + (vnoise(x * 200, y * 60, z * 200) - .5) * .14), .22); };
export const xadrez = (a, b, c2, e = .045) => { const A = hx(a), B = hx(b), C = hx(c2); return (x, y, z, p) => { const l = p.loc(x, y, z); const u = Math.floor((l[0] + l[2] + 9) / e) & 1, w = Math.floor((l[1] + 9) / e) & 1; let c = u && w ? C : u || w ? mix(A, B, .55) : A; if (((l[0] + l[2] + 9) / e % 1) < .12) c = mul(c, .8); return c; }; };
export const floral = (base, f1, f2) => { const B = hx(base), F1 = hx(f1), F2 = hx(f2); return (x, y, z) => { const n = vnoise(x * 28, y * 28, z * 28), m = vnoise(x * 28 + 7, y * 28 + 3, z * 28 + 5); return n > .72 ? F1 : m > .74 ? F2 : (n > .62 && m < .4) ? mul(F1, .55) : B; }; };
export const listras = (a, b, larg = .03, eixo = 1) => { const A = hx(a), B = hx(b); return (x, y, z, p) => { const l = p.loc(x, y, z); return ((Math.floor((l[eixo] + 9) / larg)) & 1) ? B : A; }; };
export const acolchoado = (c, passo = .045) => { const C = hx(c); return (x, y, z, p) => { const l = p.loc(x, y, z), f = ((l[1] / passo) % 1 + 1) % 1; return mul(C, f < .12 ? .62 : .95 + .1 * Math.sin(f * Math.PI)); }; };
export const molle = (c, k = .7) => { const C = hx(c); return (x, y, z, p) => { const l = p.loc(x, y, z), fy = ((l[1] * 38) % 1 + 1) % 1, fx = ((l[0] * 26) % 1 + 1) % 1; let m = fy < .4 ? k : 1; if (fy < .4 && fx < .1) m *= .8; return mul(C, m * (1 + (vnoise(x * 120, y * 120, z * 120) - .5) * .08)); }; };
export const sangue = (base, seed, dens = .62) => (x, y, z, p) => { const b = base(x, y, z, p); const n = fbm(x * 14 + seed, y * 14, z * 14); return n > dens ? mix(b, [.32, .05, .04], Math.min(1, (n - dens) * 9)) : n > dens - .05 ? mul(b, .8) : b; };
export const sujo = (base, k = .35) => (x, y, z, p) => { const b = base(x, y, z, p), n = fbm(x * 5, y * 5 + 3, z * 5); return mix(b, [.3, .24, .17], Math.max(0, n - .52) * k * 3); };

// ---------- camuflagens ----------
export const CAMOS = {
  multicam: { nome: 'MultiCam', p: ['#a89670', '#6f6b47', '#5a4632', '#cbbd94'], t: 'blob', e: 15 },
  woodland: { nome: 'Woodland', p: ['#6f6a49', '#3c4a2c', '#6a4b31', '#1d1c16'], t: 'blob', e: 12 },
  deserto: { nome: 'Deserto 3 cores', p: ['#c9b28a', '#a08560', '#e3d2ad', '#7d6a4e'], t: 'blob', e: 9 },
  urbano: { nome: 'Urbano', p: ['#7d8084', '#55585c', '#a3a5a8', '#2e3033'], t: 'blob', e: 13 },
  marpat: { nome: 'Digital floresta', p: ['#5d5f45', '#3f4532', '#7a6e52', '#24261d'], t: 'pixel', e: 15 },
  digital_deserto: { nome: 'Digital deserto', p: ['#c2ad86', '#a08a64', '#d9c9a5', '#6f604a'], t: 'pixel', e: 15 },
  tigre: { nome: 'Tigrado', p: ['#6f7550', '#3a4a2a', '#1e1f18', '#8a8460'], t: 'tigre', e: 10 },
  flecktarn: { nome: 'Flecktarn', p: ['#7a7a58', '#4f5a35', '#2f3a24', '#6d4e35', '#1b1b16'], t: 'pontos', e: 55 },
  neve: { nome: 'Neve', p: ['#e6e9ec', '#b8bcc0', '#8d9298', '#f6f7f8'], t: 'blob', e: 10 },
  selva: { nome: 'Selva tropical', p: ['#4d6b3a', '#2f4a25', '#7a8a4a', '#1e2a18'], t: 'blob', e: 14 },
  oceano: { nome: 'Digital marinho', p: ['#2f3e57', '#1d2738', '#4a5b78', '#121821'], t: 'pixel', e: 15 },
  escamas: { nome: 'Escamas (kryptek)', p: ['#8a8270', '#5e5848', '#35322b', '#a9a08a'], t: 'escamas', e: 20 },
  ghillie: { nome: 'Ghillie', p: ['#5d6a3b', '#3e4a28', '#7a6a42', '#2c2f1d'], t: 'blob', e: 14 },
};
let K = 1, N = 4; export const camoCfg = (k, n) => { K = k; N = n; };
export function camo(nome, seed = 0) {
  const d = CAMOS[nome], C = d.p.map(hx);
  return (x, y, z) => {
    const e = d.e * K;
    if (d.t === 'pixel') { const q = 1 / 85; x = Math.floor(x / q) * q; y = Math.floor(y / q) * q; z = Math.floor(z / q) * q; }
    if (d.t === 'tigre') { const s = Math.sin(y * e * 3.4 + fbm(x * 4, y * 2, z * 4) * 16 + (x + z) * 6), m = fbm(x * 5 + 3, y * 9, z * 5); let c = C[0]; if (fbm(x * e, y * e, z * e) > .6) c = C[3]; if (s > .55 && m > .42) c = C[1]; if (s > .82 && m > .5) c = C[2]; return c; }
    if (d.t === 'pontos') { const a = vnoise(x * e, y * e, z * e), b = vnoise(x * e * 1.7 + 9, y * e * 1.7, z * e * 1.7 + 4), g = fbm(x * 8, y * 8, z * 8); let c = C[0]; if (g > .58) c = C[1]; if (a > .7) c = C[2]; else if (b > .72) c = C[3]; else if (a < .2) c = C[4]; return c; }
    if (d.t === 'escamas') { const n = fbm(x * e * .4, y * e * .4, z * e * .4), m = vnoise(x * e, y * e, z * e); let c = n > .54 ? C[1] : C[0]; if (m > .62 && n > .5) c = C[3]; if (Math.abs(m - .62) < .03) c = C[2]; return c; }
    let c = C[0]; if (fbm(x * e + seed, y * e * .8, z * e) > .55) c = C[1]; if (N > 2 && fbm(x * e * 1.25 + 17, y * e + 5, z * e * 1.25 + 11) > .6) c = C[2]; if (N > 3 && fbm(x * e * 2 + 31, y * e * 1.7, z * e * 2 + 7) > .66) c = C[3]; return c;
  };
}
// valor de cor de peça: '#hex' | nome de camo | função
export const cor = v => typeof v === 'function' ? v : (typeof v === 'string' && CAMOS[v]) ? camo(v) : v;
export const ehCamo = v => typeof v === 'string' && !!CAMOS[v];
export const base = v => ehCamo(v) ? CAMOS[v].p[0] : v; // cor sólida representativa
export const escuro = (v, k = .7) => mul(hx(base(v)), k);
