// Roupas e equipamentos trocáveis: tronco, calça, calçado, colete, luvas, mochila e arma.
import { v, hx, mix, mul, vnoise, rng, pl, wp } from './nucleo.js';
import { fab, liso, metal, couro, madeira, malha, denim, xadrez, floral, acolchoado, molle, sujo, camo, cor, base, escuro } from './tex.js';

const PT = (on, ex = {}) => ({ kind: 'paint', on: Array.isArray(on) ? on : [on], ...ex });
const FONTE = { P: ['111', '101', '111', '100', '100'], O: ['111', '101', '101', '101', '111'], L: ['100', '100', '100', '100', '111'], I: ['111', '010', '010', '010', '111'], C: ['111', '100', '100', '100', '111'], E: ['111', '100', '110', '100', '111'], S: ['111', '100', '111', '001', '111'], W: ['101', '101', '101', '111', '101'], A: ['010', '101', '111', '101', '101'], T: ['111', '010', '010', '010', '010'], R: ['110', '101', '110', '101', '101'] };
export function letreiro(B, F, txt, cx, cy, z, cs, col, on, layer = 1) {
  const sx = z < 0 ? -1 : 1, w = txt.length * 4 * cs - cs; let x0 = cx - sx * (w / 2 - cs / 2);
  for (const ch of txt) { FONTE[ch].forEach((row, r) => [...row].forEach((b, c) => { if (b === '1') B.box(F, [x0 + sx * c * cs, cy - r * cs, z], [cs * .55, cs * .55, .05], 0, null, col, { kind: 'paint', on, layer }); })); x0 += sx * 4 * cs; }
}
const cotovelo = (k, s) => wp(k['ua' + s], [0, k['La' + s][0], 0]);
function patchBraco(B, k, s, col, on, t = .36, tam = [.021, .024, .021]) { // emblema na face de fora do braço
  const S = k['S' + s], E = cotovelo(k, s), a = S.clone().lerp(E, t), out = a.clone().sub(wp(k.Fc, [0, .15, 0])); out.y = 0; out.normalize();
  return B.box(null, a.addScaledVector(out, .056).toArray(), tam, 0, null, col, PT(on));
}

// ================= TRONCO =================
export const TRONCOS = { camisa_combate: 'Camisa de combate', farda: 'Farda (gandola)', farda_arregacada: 'Farda arregaçada', camiseta: 'Camiseta', camiseta_longa: 'Camiseta manga longa', regata: 'Regata', polo: 'Polo', moletom: 'Moletom', jaqueta_couro: 'Jaqueta de couro', jaqueta_campo: 'Jaqueta de campo M65', flanela: 'Flanela aberta', havaiana: 'Camisa havaiana', sueter: 'Suéter militar', policia: 'Uniforme policial', puffer: 'Jaqueta puffer', corta_vento: 'Corta-vento', sem_camisa: 'Sem camisa', ghillie: 'Ghillie (parte de cima)' };
export const TRONCO_COR = { camisa_combate: ['camo', '#a09478'], farda: ['camo'], farda_arregacada: ['camo'], camiseta: ['#59604c'], camiseta_longa: ['#2f3540'], regata: ['#d9d4c8'], polo: ['#1f2a44'], moletom: ['#5d6066'], jaqueta_couro: ['#2a211c', '#d8d2c4'], jaqueta_campo: ['#5a5c3f'], flanela: [['#7c2a26', '#2f2f2f', '#c9b38a'], '#d9d4c8'], havaiana: ['#2f6f8a'], sueter: ['#4a5036'], policia: ['#1f2532'], puffer: ['#c0462f'], corta_vento: ['#1d4f7a', '#e0b030'], sem_camisa: [], ghillie: ['ghillie'] };
// manga de cada parte de cima (braços da primeira pessoa no jogo): longa até o punho, arregaçada no meio do antebraço, curta, nenhuma
export const TRONCO_MANGA = { camisa_combate: 'longa', farda: 'longa', farda_arregacada: 'arregacada', camiseta: 'curta', camiseta_longa: 'longa', regata: 'nenhuma', polo: 'curta', moletom: 'longa', jaqueta_couro: 'longa', jaqueta_campo: 'longa', flanela: 'arregacada', havaiana: 'curta', sueter: 'longa', policia: 'longa', puffer: 'longa', corta_vento: 'longa', sem_camisa: 'nenhuma', ghillie: 'longa' };
export function tronco(B, k, pr, tipo, c1, c2, det) {
  if (tipo === 'sem_camisa') { B.tor(k.Fn, [0, -.005, .01], .07, .0016, [.5, 0, 0], '#9a9a9a', { tag: 'plaq' }); B.box(k.Fc, [.0, .2, .12], [.013, .02, .003], .002, [-.2, 0, 0], metal('#a8a8a8'), { tag: 'plaq' }); return; }
  const F = k.Fc, Fw = k.Fw, tag = 'camisa';
  const C1 = cor(c1), E1 = escuro(c1, .62);
  const W = (regs, inf, col, o = {}) => B.wear(regs, inf, col, { tag, ...o });
  const pulso = (p, d = .012) => p.reg === 'larm' ? [pl(p.F, [0, k['La' + p.side][1] - d, 0], [0, 1, 0])] : null;
  const manga = (m, inf, col, ex = {}) => {
    if (m === 'nenhuma') return;
    if (m === 'longa') { W(['uarm', 'larm'], inf, col, { clip: p => pulso(p), ...ex }); for (const s of [1, -1]) { const L2 = k['La' + s][1]; B.cone(k['la' + s], [0, L2 - .04, 0], [0, L2 - .012, 0], .037 + inf, .036 + inf, ex.punho || col, { tag }); } }
    if (m === 'curta') { W(['uarm'], inf, col, { clip: p => p.side ? [pl(k['ua' + p.side], [0, k['La' + p.side][0] * .48, 0], [0, 1, 0])] : null, ...ex }); for (const s of [1, -1]) { const L1 = k['La' + s][0]; B.cone(k['ua' + s], [0, L1 * .4, 0], [0, L1 * .48, 0], .05 + inf, .049 + inf, ex.punho || col, { tag }); } }
    if (m === 'arregacada') { W(['uarm', 'larm'], inf, col, { clip: p => p.reg === 'larm' ? [pl(p.F, [0, .12, 0], [0, 1, 0])] : null, ...ex }); for (const s of [1, -1]) { B.cone(k['la' + s], [0, .085, 0], [0, .135, 0], .054, .049, ex.rolo || col, { tag }); B.tor(k['la' + s], [0, .11, 0], .051, .004, null, mul(hx(base(c1)), .7), PT(tag)); } }
  };
  const corpo = (inf, col, solto = false, o = {}) => { W(['torso', 'abd'], inf, col, o); W(['pelvis'], solto ? Math.max(inf, .0005) + .0125 : inf * .7, col, { clip: () => [pl(k.Fp, [0, solto ? -.03 : .03, 0], [0, -1, 0]), ...(o.clip ? o.clip() : [])], ...o, ...(o.clip ? { clip: () => [pl(k.Fp, [0, solto ? -.03 : .03, 0], [0, -1, 0]), ...o.clip()] } : {}) }); if (solto) B.tor(k.Fp, [0, -.028, 0], .148, .0025, null, mul(hx(base(Array.isArray(c1) ? c1[0] : c1)), .6), PT(o.tag || tag)); };
  const costuras = (col = mul(hx(base(c1)), .55)) => { for (const s of [1, -1]) { B.box(F, [s * .175, .12, 0], [.05, .2, .0016], 0, null, col, PT(tag)); B.tor(k['ua' + s], [0, .03, 0], .066, .0018, null, col, PT(tag)); B.box(F, [s * .07, .3, -.015], [.05, .0016, .1], 0, null, col, PT(tag)); } };
  const bolso = (Fr, p, w, h, col, flap = true, but = true, rot = [-.05, 0, 0], d = .009) => { B.box(Fr, p, [w, h, d], .004, rot, col, { tag });
    if (flap) B.box(Fr, [p[0], p[1] + h * .85, p[2] + .004], [w + .003, h * .3, d + .002], .004, rot, mul(hx(base(c1)), .92), { tag });
    if (but) B.ell(Fr, [p[0], p[1] + h * .7, p[2] + d + .004], [.0045, .0045, .004], null, '#2a2620', { tag }); };
  const botoes = (n, x0 = 0, y0 = .27, dy = .055, F0 = F, z = .125) => { B.box(F0, [x0, y0 - dy * (n - 1) / 2, z], [.009, dy * n / 2 + .01, .03], 0, null, mul(hx(base(c1)), .82), PT(tag)); for (let i = 0; i < n; i++) B.ell(F0, [x0, y0 - i * dy, z], [.0042, .0042, .03], null, '#d9d2c2', PT(tag)); };
  const ziper = (x = 0, col = '#9a9a9a') => { B.box(F, [x, .14, .13], [.0028, .2, .05], 0, null, col, PT(tag)); B.box(Fw, [x, .0, .12], [.0028, .1, .05], 0, null, col, PT(tag)); B.box(F, [x + .004, .29, .135], [.004, .009, .004], .001, null, metal('#b0b0b0'), { tag }); };
  const golaColar = (col) => { for (const s of [1, -1]) B.box(k.Fn, [s * .035, .0, .045], [.03, .014, .006], .004, [.35, s * .55, s * .15], col, { tag }); B.ell(k.Fn, [0, .015, -.02], [.068, .018, .055], null, col, { tag, clip: [pl(k.Fn, [0, 0, .02], [0, 0, 1])] }); };
  const golaCareca = (col, inf = .006) => B.tor(k.Fn, [0, -.008, -.005], .057 + inf, .006, [.25, 0, 0], col, { tag });
  const golaAlta = (col) => B.cone(null, wp(k.Fn, [0, -.01, -.008]), wp(k.Fn, [0, .045, -.01]), .066, .062, col, { tag });
  const decote = (col, prof = .06) => B.box(F, [0, .305 - prof / 2, .1], [.03, prof / 2, .05], 0, [0, 0, Math.PI / 4], col, PT(tag));
  const SK = hx('#000');
  switch (tipo) {
    case 'camisa_combate': { const T = fab(cor(c2 || '#a09478'), .14); corpo(.0065, T); manga('longa', .0068, fab(C1, .22), { punho: fab(C1, .2) }); golaAlta(fab(C1, .1)); B.box(k.Fn, [0, .02, .065], [.003, .03, .02], 0, null, '#2a2a2a', PT(tag));
      for (const s of [1, -1]) { patchBraco(B, k, s, escuro(c1, .75), tag, .32, [.024, .03, .024]); patchBraco(B, k, s, s > 0 ? '#3b4a2c' : '#2a2a26', tag, .3, [.015, .012, .015]); B.ell(k['la' + s], [0, .01, 0], [.05, .045, .05], null, fab(C1, .2), { tag }); }
      costuras(); break; }
    case 'farda': case 'farda_arregacada': { const T = fab(C1, .2); corpo(.008, T, true); manga(tipo === 'farda' ? 'longa' : 'arregacada', .0085, fab(C1, .26)); golaColar(T); botoes(5, 0, .27, .06, F, .124); botoes(2, 0, .1, .07, Fw, .118);
      for (const s of [1, -1]) bolso(F, [s * .07, .2, .118], .034, .036, T); if (det >= 1) { B.box(F, [-.07, .25, .14], [.03, .006, .02], 0, null, '#1b1b1b', PT(tag)); B.box(F, [.07, .25, .14], [.03, .006, .02], 0, null, '#2a3a1a', PT(tag)); }
      costuras(); break; }
    case 'camiseta': case 'camiseta_longa': { const T = fab(C1, .16); corpo(.0055, T, true); manga(tipo === 'camiseta' ? 'curta' : 'longa', .006, fab(C1, .2)); golaCareca(mul(hx(base(c1)), .85)); costuras(); if (c2) B.box(F, [.06, .2, .12], [.03, .03, .03], 0, [-.05, 0, 0], c2, PT(tag)); break; }
    case 'regata': { const T = fab(C1, .1); corpo(.0045, T, true, { clip: p => [1, -1].map(s => pl(F, [s * .085, .27, 0], [s * .62, .78, 0])) }); decote(hx('#000'), .07); B.P[B.P.length - 1].col = (x, y, z) => hx(base(c1)); B.P.pop(); break; }
    case 'polo': { const T = fab(C1, .14); corpo(.0055, T, true); manga('curta', .006, fab(C1, .18), { punho: mul(hx(base(c1)), .8) }); golaColar(mul(hx(base(c1)), .9)); botoes(3, 0, .29, .028); B.box(F, [.065, .21, .12], [.02, .02, .03], 0, null, c2 || '#c9a646', PT(tag)); costuras(); break; }
    case 'moletom': { const T = fab(C1, .26); corpo(.014, T, true); manga('longa', .013, fab(C1, .3), { punho: malha(mul(hx(base(c1)), .85)) }); B.ell(k.Fp, [0, -.035, 0], [.17, .022, .125], null, malha(mul(hx(base(c1)), .85)), { tag, inf: .014 });
      B.ell(F, [0, .3, -.085], [.12, .07, .075], [.3, 0, 0], fab(C1, .35), { tag }); B.ell(F, [0, .3, -.098], [.07, .045, .05], [.3, 0, 0], mul(hx(base(c1)), .5), { tag, bias: .004 });
      B.box(Fw, [0, -.02, .124], [.09, .055, .008], .008, null, T, { tag }); for (const s of [1, -1]) { B.box(Fw, [s * .088, -.02, .132], [.004, .05, .004], 0, [0, 0, s * .5], mul(hx(base(c1)), .55), PT(tag)); B.cone(F, [s * .025, .29, .1], [s * .03, .17, .138], .004, .004, '#e8e4da', { tag }); }
      if (c2) B.box(F, [0, .17, .13], [.06, .03, .04], 0, null, c2, PT(tag)); break; }
    case 'jaqueta_couro': { const T = couro(base(c1)); corpo(.013, T, true); manga('longa', .012, T, { punho: T }); for (const s of [1, -1]) B.box(F, [s * .055, .245, .132], [.045, .05, .008], .006, [-.1, 0, s * .55], couro(mul(hx(base(c1)), 1.1)), { tag });
      golaColar(T); B.box(F, [-.03, .1, .135], [.0028, .2, .05], 0, [0, 0, .25], '#a8a8a8', PT(tag)); B.box(F, [0, .275, .135], [.04, .025, .02], 0, null, c2 || '#d8d2c4', PT(tag));
      for (const s of [1, -1]) { B.box(F, [s * .12, .3, -.01], [.03, .006, .02], .003, [0, 0, -s * .25], T, { tag }); B.box(Fw, [s * .07, .0, .118], [.03, .0025, .04], 0, [0, 0, s * .3], '#a8a8a8', PT(tag)); } break; }
    case 'jaqueta_campo': { const T = fab(C1, .24); corpo(.012, T, true); manga('longa', .012, fab(C1, .28)); golaColar(T); ziper(0, '#6b6b5c'); botoes(5, .012, .27, .06, F, .128);
      for (const s of [1, -1]) { bolso(F, [s * .072, .19, .125], .036, .038, T); bolso(Fw, [s * .075, -.02, .122], .042, .042, T); B.box(F, [s * .12, .3, -.01], [.03, .006, .02], .003, [0, 0, -s * .25], T, { tag }); }
      costuras(); break; }
    case 'flanela': { const [a, b, c3] = Array.isArray(c1) ? c1 : ['#7c2a26', '#2f2f2f', '#c9b38a'], X = fab(xadrez(a, b, c3), .22), Ti = fab(cor(c2 || '#d9d4c8'), .1);
      corpo(.0045, Ti, true, { tag: 'regata' }); for (const lado of [1, -1]) corpo(.01, X, true, { clip: () => [pl(F, [lado * .02, 0, 0], [-lado, 0, 0])] });
      W(['torso', 'abd'], .01, X, { clip: () => [pl(F, [0, 0, -.02], [0, 0, 1])] }); manga('arregacada', .01, X, { rolo: X }); golaColar(X); costuras(mul(hx(a), .6)); break; }
    case 'havaiana': { const T = fab(floral(base(c1), '#e8d24a', '#e8e2d6'), .1); corpo(.0055, T, true); manga('curta', .006, T); golaColar(T); decote(hx(c1 || '#2f6f8a'), .05); B.P[B.P.length - 1].col = '#000'; B.P.pop(); botoes(4, 0, .24, .055); break; }
    case 'sueter': { const T = malha(base(c1), .18), Pt = fab(mul(hx(base(c1)), .75), .1); corpo(.011, T, false); manga('longa', .011, malha(base(c1), .18)); golaAlta(malha(base(c1), .25));
      for (const s of [1, -1]) { B.ell(F, [s * .13, .275, -.01], [.07, .028, .09], [0, 0, -s * .3], Pt, { tag, clip: [pl(F, [0, .255, 0], [0, -1, 0])] }); B.ell(k['ua' + s], [0, k['La' + s][0] * .95, 0], [.06, .04, .06], null, Pt, { tag }); } break; }
    case 'policia': { const T = fab(C1, .14); corpo(.006, T); manga('longa', .0065, fab(C1, .18)); golaColar(T); botoes(5, 0, .27, .06);
      for (const s of [1, -1]) { bolso(F, [s * .07, .2, .118], .032, .034, T); patchBraco(B, k, s, '#c9a646', tag, .24, [.022, .026, .022]); patchBraco(B, k, s, '#2a3e6a', tag, .24, [.016, .019, .016]); }
      B.ell(F, [.07, .245, .135], [.012, .014, .03], null, '#d8b84a', PT(tag)); B.box(F, [-.07, .245, .135], [.024, .006, .03], 0, null, '#d8d4c8', PT(tag)); costuras(); break; }
    case 'puffer': { const T = acolchoado(base(c1)); corpo(.022, T, true); manga('longa', .02, acolchoado(base(c1), .05)); golaAlta(acolchoado(base(c1), .03)); ziper(0, '#2a2a2a'); break; }
    case 'corta_vento': { const A = hx(base(c1)), Bc = hx(c2 || '#e0b030'), T = fab((x, y, z, p) => p.loc(x, y, z)[1] > .2 ? Bc : A, .2); corpo(.009, T, true); manga('longa', .009, fab((x, y, z, p) => p.loc(x, y, z)[1] < .12 ? Bc : A, .25)); golaAlta(fab(A, .2)); ziper(0, '#1b1b1b');
      B.ell(F, [0, .31, -.07], [.09, .04, .05], null, fab(A, .2), { tag }); break; }
    case 'ghillie': { tronco(B, k, pr, 'camisa_combate', c1, '#5a5a44', 0); ghillieFios(B, k, pr, 'tronco'); break; }
  }
}
export function ghillieFios(B, k, pr, parte) {
  const r = rng(parte === 'tronco' ? 11 : 23), cols = ['#5d6a3b', '#3e4a28', '#7a6a42', '#2c2f1d', '#6f5a3a', '#4f5a2f', '#8a7a4c'].map(hx);
  const fio = (A, d) => { const L = .05 + r() * .08, dir = d.clone().normalize().multiplyScalar(.35).add(v(0, -1, 0)).normalize(); B.cone(null, A, A.clone().addScaledVector(dir, L), .011 + r() * .006, .003, mul(cols[(r() * cols.length) | 0], .8 + r() * .35), { tag: 'ghillie', layer: 1 }); };
  const anel = (Fr, n, rad, y0, y1) => { for (let i = 0; i < n; i++) { const th = r() * Math.PI * 2, y = y0 + r() * (y1 - y0); const p = wp(Fr, [Math.cos(th) * rad[0], y, Math.sin(th) * rad[1]]); fio(p, p.clone().sub(wp(Fr, [0, y, 0]))); } };
  if (parte === 'tronco') { anel(k.Fc, 260, [.19 * pr.ombro, .15], 0, .34); anel(k.Fw, 90, [.165, .13], -.05, .09); for (const s of [1, -1]) { anel(k['ua' + s], 55, [.062, .062], 0, k['La' + s][0]); anel(k['la' + s], 30, [.05, .05], 0, k['La' + s][1] * .7); } }
  else for (const s of [1, -1]) { anel(k['th' + s], 70, [.095, .095], 0, k['L' + s].thL); anel(k['sh' + s], 40, [.07, .07], 0, k['L' + s].shL * .6); }
}

// ================= CALÇA =================
export const CALCAS = { cargo: 'Cargo', combate: 'Combate (joelheira)', jeans: 'Jeans', jeans_rasgado: 'Jeans rasgado', jogger: 'Jogger / moletom', bermuda: 'Bermuda cargo', social: 'Social', tatica: 'Tática lisa', couro_moto: 'Couro (motoqueiro)', shorts: 'Shorts esportivo', ghillie: 'Ghillie (parte de baixo)' };
export const CALCA_COR = { cargo: ['#6b5a42'], combate: ['camo'], jeans: ['#3b5372'], jeans_rasgado: ['#5a7394'], jogger: ['#4a4c50'], bermuda: ['#8a7a5a'], social: ['#2a2c33'], tatica: ['#1c1d20'], couro_moto: ['#1a1716'], shorts: ['#1f3f8a'], ghillie: ['ghillie'] };
export function calca(B, k, pr, tipo, c1, det) {
  const tag = 'calca', C1 = cor(c1);
  let col = fab(C1, .2);
  if (tipo === 'jeans' || tipo === 'jeans_rasgado') col = denim(base(c1), tipo === 'jeans_rasgado' ? .55 : .35);
  if (tipo === 'couro_moto') col = couro(base(c1)); if (tipo === 'jogger') col = fab(malha(base(c1), .06), .28); if (tipo === 'social') col = liso(base(c1), .05);
  const curto = tipo === 'bermuda' ? .6 : tipo === 'shorts' ? .42 : 0;
  B.wear(['pelvis', 'thigh', 'shin'], tipo === 'social' ? .006 : .0075, col, { tag, clip: p => {
    if (curto && p.reg === 'shin') return false;
    if (curto && p.reg === 'thigh') return [pl(p.F, [0, k['L' + p.side].thL * curto, 0], [0, 1, 0])];
    return p.reg === 'shin' ? [pl(p.F, [0, k['L' + p.side].shL - .02, 0], [0, 1, 0])] : null; } });
  const E = escuro(c1, .62);
  for (const s of [1, -1]) {
    const T = k['th' + s], S = k['sh' + s], L = k['L' + s], o = -s; // o = lado de fora no quadro da coxa
    if (curto) { B.cone(T, [0, L.thL * curto - .03, 0], [0, L.thL * curto, 0], .078, .074, col, { tag }); B.tor(T, [0, L.thL * curto - .004, 0], .074, .0025, null, E, PT(tag)); }
    else { for (let i = 0; i < 2; i++) B.tor(S, [0, L.shL - .05 - i * .028, 0], .046 + i * .002, .005, [.15 * (i ? 1 : -1), 0, 0], col, { tag }); }
    B.box(T, [o * .072, .06, .0], [.02, .07, .0016], 0, null, E, PT(tag)); // costura lateral
    if (['cargo', 'combate', 'bermuda', 'ghillie'].includes(tipo)) { B.box(T, [o * .088, .2, .012], [.016, .055, .045], .012, [0, 0, -o * .04], col, { tag }); B.box(T, [o * .099, .152, .012], [.009, .014, .048], .006, null, mul(hx(base(c1)), .9), { tag }); B.ell(T, [o * .108, .155, .012], [.004, .004, .004], null, '#2a2a22', { tag }); }
    if (tipo === 'combate') { B.box(S, [0, .035, .058], [.046, .058, .018], .016, [.12, 0, 0], liso('#3a352c'), { tag: 'joelh', layer: 1 }); B.box(T, [0, L.thL * .55, .07], [.05, .1, .02], 0, null, E, PT(tag)); }
    if (tipo === 'couro_moto') { B.box(S, [0, .04, .056], [.042, .06, .016], .014, [.12, 0, 0], couro('#2a2624'), { tag: 'joelh' }); for (let i = 0; i < 3; i++) B.box(S, [0, .01 + i * .025, .075], [.04, .002, .02], 0, null, '#0e0e0e', PT('joelh')); }
    if (tipo === 'jeans' || tipo === 'jeans_rasgado') { B.box(T, [o * .075, .2, 0], [.02, .2, .0018], 0, null, '#b8743a', PT(tag)); B.box(k.Fp, [s * .065, -.065, -.11], [.035, .04, .006], .004, [.2, 0, 0], col, { tag }); B.box(k.Fp, [s * .065, -.035, -.118], [.032, .002, .02], 0, null, '#b8743a', PT(tag)); B.box(k.Fp, [s * .1, .03, .09], [.002, .04, .04], 0, [0, 0, s * .6], '#b8743a', PT(tag)); }
    if (tipo === 'jeans_rasgado') { B.ell(S, [0, -.01 + s * .01, .07], [.03, .018, .02], null, hx('#ffffff'), PT(tag)); B.P[B.P.length - 1].col = (x, y) => ((y * 300) % 1 + 1) % 1 < .45 ? hx('#e6e2da') : mul(hx('#b0866a'), .9); B.ell(T, [.01, L.thL * .4, .085], [.02, .012, .02], null, '#e6e2da', PT(tag)); }
    if (tipo === 'social') B.box(T, [0, L.thL * .5, .09], [.0022, L.thL * .55, .03], 0, null, mul(hx(base(c1)), 1.35), PT(tag));
    if (tipo === 'jogger') { B.cone(S, [0, L.shL - .05, 0], [0, L.shL - .015, 0], .043, .039, malha(mul(hx(base(c1)), .85)), { tag }); B.box(T, [o * .07, L.thL * .5, 0], [.05, L.thL * .55, .009], 0, null, '#e0e0e0', PT(tag)); B.box(S, [o * .05, L.shL * .45, 0], [.04, L.shL * .5, .009], 0, null, '#e0e0e0', PT(tag)); } // faixa lateral contínua (a caixa atravessa a superfície da perna)
    if (tipo === 'shorts') B.box(T, [o * .07, .08, 0], [.05, .1, .009], 0, null, '#f0f0f0', PT(tag));
    if (tipo === 'tatica') { B.box(T, [o * .085, .22, .02], [.004, .05, .03], 0, null, E, PT(tag)); B.box(T, [o * .087, .24, -.01], [.012, .03, .02], .006, null, col, { tag }); }
  }
  B.box(k.Fp, [0, .02, .125], [.0025, .045, .03], 0, null, mul(hx(base(c1)), .55), PT(tag)); // braguilha
  if (tipo === 'ghillie') ghillieFios(B, k, pr, 'calca');
  // cinto
  const cint = { cargo: 'tatico', combate: 'tatico', tatica: 'tatico', bermuda: 'lona', jeans: 'couro', jeans_rasgado: 'couro', social: 'couro', couro_moto: 'couro', ghillie: 'lona' }[tipo];
  if (cint) cinto(B, k, pr, cint);
  else B.ell(k.Fp, [0, .07, 0], [.168, .015, .122], null, malha(mul(hx(base(c1)), .9)), { tag, inf: .008 });
}
function cinto(B, k, pr, t) {
  const F = k.Fp, o = { tag: 'cinto', layer: 1 }, col = t === 'couro' ? couro('#4a2e1a') : t === 'lona' ? fab('#4a4636', .05) : fab('#22221f', .05);
  B.ell(F, [0, .072, .0], [.17 * pr.quadril, .07, .124], null, col, { ...o, inf: .0035, clip: [pl(F, [0, t === 'tatico' ? .097 : .09, 0], [0, 1, 0]), pl(F, [0, .052, 0], [0, -1, 0])] });
  if (t === 'tatico') { B.box(F, [0, .074, .13], [.03, .02, .007], .004, null, metal('#3a3a3a'), o); B.box(F, [0, .074, .136], [.012, .008, .003], .002, null, metal('#6a6a6a'), o); }
  else { B.box(F, [0, .072, .13], [.022, .017, .004], .003, null, metal('#b49650'), o); B.box(F, [0, .072, .134], [.014, .01, .003], .0, null, '#4a2e1a', o); }
  for (const x of [-.12, -.05, .05, .12]) B.box(F, [x, .072, .11 - Math.abs(x) * .3], [.005, .022, .03], 0, null, mul(hx('#000'), 1), { kind: 'paint', on: ['calca'] });
}

// ================= CALÇADO =================
export const CALCADOS = { coturno: 'Coturno', coturno_deserto: 'Coturno deserto', bota_selva: 'Bota de selva', tenis: 'Tênis', tenis_cano_alto: 'Tênis cano alto', bota_trabalho: 'Bota de trabalho', sapato_social: 'Sapato social', galocha: 'Galocha', chinelo: 'Chinelo', bota_cowboy: 'Bota cowboy' };
export const CALCADO_COR = { coturno: ['#1e1d1b'], coturno_deserto: ['#a08460'], bota_selva: ['#1b1b1a', '#4e5634'], tenis: ['#e7e4dd', '#c03a30'], tenis_cano_alto: ['#b22a2a', '#f0ede6'], bota_trabalho: ['#9a6a3a'], sapato_social: ['#121212'], galocha: ['#3e5a2a'], chinelo: ['#1d5aa8'], bota_cowboy: ['#6b3e20'] };
export function calcado(B, k, tipo, c1, c2) {
  const o = { tag: 'bota', layer: 1 }, Cc = hx(base(c1));
  for (const s of [1, -1]) {
    const S = k['sh' + s], F = k['ft' + s], L = k['L' + s].shL;
    const sola = (h = .013, col = '#1c1a18', bico = 1, salto = .016) => { const cs = (x, y, z, p) => { const l = p.loc(x, y, z); return mul(hx(col), ((l[2] * 70) % 1 + 1) % 1 < .3 && l[1] < -.07 ? .6 : 1); };
      B.box(F, [0, -.074, .058], [.056, h, .128 * bico], .007, null, cs, o); B.box(F, [0, -.076, -.034], [.05, salto, .04], .007, null, cs, o); };
    const cadarco = (col, y0 = .02, y1 = .13, base = cS) => (x, y, z, p) => { const l = p.loc(x, y, z), b = base(x, y, z, p); return l[2] > .022 && Math.abs(l[0]) < .015 && ((l[1] * 75) % 1 + 1) % 1 < .45 ? hx(col) : b; };
    const cS = liso(Cc, .12);
    const cano = (alt, inf, col) => B.wear(['shin'], inf, col, { tag: 'bota', layer: 1, side: s, clip: p => [pl(p.F, [0, L - alt, 0], [0, -1, 0])] });
    const pe = (inf, col, bico = 1) => { B.box(F, [0, -.04, .058 + (bico - 1) * .05], [.052, .042, .118 * bico], .03, null, col, o); B.wear(['foot'], inf, col, { tag: 'bota', layer: 1, side: s }); };
    switch (tipo) {
      case 'coturno': case 'coturno_deserto': case 'bota_selva': {
        const lc = (x, y, z, p) => { const l = p.loc(x, y, z), b = tipo === 'bota_selva' && l[1] < L - .07 ? liso(c2 || '#4e5634', .1)(x, y, z, p) : cS(x, y, z, p); return l[2] > .02 && Math.abs(l[0]) < .016 && ((l[1] * 70) % 1 + 1) % 1 < .45 ? mul(b, .45) : b; };
        cano(.155, .013, lc); pe(.004, (x, y, z, p) => { const l = p.loc(x, y, z); const b = cS(x, y, z, p); return l[2] > .035 && l[2] < .1 && Math.abs(l[0]) < .014 && ((l[2] * 75) % 1 + 1) % 1 < .45 ? mul(b, .45) : l[2] > .12 ? mul(b, .8) : b; });
        sola(.013, tipo === 'coturno_deserto' ? '#6b5a42' : '#1c1a18'); B.tor(S, [0, L - .15, 0], .052, .007, null, mul(Cc, .75), o);
        for (let i = 0; i < 5; i++) for (const x of [-1, 1]) B.ell(S, [x * .017, L - .03 - i * .025, .05], [.0035, .0035, .0035], null, metal('#5a5a5a'), o);
        if (tipo === 'bota_selva') for (const x of [-1, 1]) B.ell(F, [x * .052, -.03, .02], [.004, .004, .004], null, metal('#888'), o);
        break; }
      case 'bota_trabalho': { const lc = cadarco('#d8c060', 0, 0, (x, y, z, p) => mul(cS(x, y, z, p), .9 + .2 * vnoise(x * 60, y * 60, z * 60))); cano(.12, .014, lc); pe(.006, lc); sola(.018, '#3a2a1a', 1.02, .02); B.box(F, [0, -.054, .058], [.056, .003, .128], 0, null, '#e0c070', PT('bota')); B.tor(S, [0, L - .115, 0], .054, .008, null, couro('#5a3a1a'), o); break; }
      case 'tenis': case 'tenis_cano_alto': { const alt = tipo === 'tenis' ? .045 : .13; const lc = cadarco('#f0f0f0', 0, 0, liso(Cc, .05)); cano(alt, .008, lc); pe(.006, lc); sola(.017, c2 && tipo === 'tenis_cano_alto' ? c2 : '#efece4', 1, .017);
        B.box(F, [s * .055, -.04, .045], [.006, .014, .055], 0, [0, 0, 0], c2 || '#d8d8d8', PT('bota')); B.box(F, [0, -.04, .158], [.05, .03, .02], .01, null, liso(c2 && tipo === 'tenis' ? '#efece4' : '#efece4'), o);
        if (tipo === 'tenis_cano_alto') B.ell(S, [-s * .045, L - .07, 0], [.015, .015, .015], null, '#efece4', PT('bota')); break; }
      case 'sapato_social': { const lc = liso(Cc, .35); pe(.005, lc); B.wear(['shin'], .005, lc, { tag: 'bota', layer: 1, side: s, clip: p => [pl(p.F, [0, L - .035, 0], [0, -1, 0])] }); sola(.008, '#0a0a0a', 1.02, .014); B.box(F, [0, -.02, .09], [.012, .005, .03], 0, null, '#050505', PT('bota')); break; }
      case 'galocha': { const lc = liso(Cc, .3); cano(.3, .016, lc); pe(.008, lc); sola(.014, '#121212'); B.tor(S, [0, L - .3, 0], .062, .008, null, mul(Cc, .8), o); break; }
      case 'chinelo': { for (let i = 0; i < 5; i++) { const x = -s * (-.032 + i * .016) * -1, r = i === 0 ? .011 : .0085 - i * .0006; B.ell(F, [s * (.03 - i * .015), -.055, .155 - i * .006 - (i ? .006 : 0)], [r, .009, .011], null, hx(k.pele || '#c38a60'), { tag: 'pele' }); }
        B.box(F, [0, -.071, .07], [.055, .007, .135], .005, null, liso(Cc, .1), o); B.cone(F, [s * .045, -.055, .05], [0, -.05, .13], .004, .004, liso(c2 || '#f0f0f0'), o); B.cone(F, [-s * .045, -.055, .05], [0, -.05, .13], .004, .004, liso(c2 || '#f0f0f0'), o); break; }
      case 'bota_cowboy': { const lc = (x, y, z, p) => { const l = p.loc(x, y, z), b = couro(base(c1))(x, y, z, p); return Math.abs(Math.sin(l[1] * 140 + Math.abs(l[0]) * 200)) < .1 ? hx('#d8b070') : b; }; cano(.2, .014, lc); pe(.005, lc, 1.12); B.box(F, [0, -.074, .07], [.05, .008, .14], .006, null, '#2a1a10', o); B.box(F, [0, -.082, -.03], [.04, .022, .035], .006, null, '#2a1a10', o); break; }
    }
  }
}

// ================= COLETE / EQUIPAMENTO =================
export const COLETES = { nenhum: 'Nenhum', plate_carrier: 'Plate carrier', chest_rig: 'Chest rig', swat: 'Colete SWAT pesado', colete_leve: 'Colete multibolsos', suspensorio: 'Suspensório LBV', bandoleira: 'Bandoleira', policia: 'Colete POLICIA', imprensa: 'Colete PRESS', coldre_ombro: 'Coldre de ombro' };
export const COLETE_COR = { plate_carrier: ['#7d6c50'], chest_rig: ['#4e4b37'], swat: ['#18191b'], colete_leve: ['#6b6450'], suspensorio: ['#4b5235'], bandoleira: ['#5a4630'], policia: ['#1a1c22'], imprensa: ['#2d5aa0'], coldre_ombro: ['#3a2416'] };
export function colete(B, k, pr, tipo, c1, det) {
  if (tipo === 'nenhum') return;
  const F = k.Fc, om = pr.ombro, o = { tag: 'colete', layer: 1 }, Vc = molle(base(c1)), Pc = fab(cor(c1), .12, 1.5), esc = mul(hx(base(c1)), .72);
  const mag = (x, y, z, ak = false, w = .029) => { B.box(F, [x, y, z], [w, .052, .023], .008, [-.05, 0, 0], Pc, o); B.box(F, [x, y + .05, z + .002], [w + .002, .012, .026], .006, [-.05, 0, 0], esc, o);
    if (det >= 1) { B.box(F, [x, y + .068, z - .004], [w * .72, .012, .013], .003, [-.05, 0, 0], ak ? '#6a4a2a' : '#1e1e1e', o); B.box(F, [x, y + .032, z + .026], [.006, .018, .004], .002, null, '#151515', o); } };
  const placas = (gross = 0) => { B.box(F, [0, .165, .148], [.128 * om, .135, .029 + gross], .02, [-.05, 0, 0], Vc, o); B.box(F, [0, .165, -.158], [.132 * om, .14, .03 + gross], .02, [.05, 0, 0], Vc, o);
    B.ell(F, [0, .075, -.005], [.186 * om, .1, .147], null, Vc, { ...o, clip: [pl(F, [0, .14, 0], [0, 1, 0]), pl(F, [0, .012, 0], [0, -1, 0])] });
    for (const s of [1, -1]) { B.ell(F, [s * .086 * om, .287, -.006], [.036, .032, .152], null, Pc, { ...o, clip: [pl(F, [0, .258, 0], [0, -1, 0])] }); B.box(F, [s * .086 * om, .265, .17], [.03, .02, .006], .003, null, metal('#2a2a2a'), o); } };
  const coldrePerna = () => { const T = k['th-1']; B.box(T, [.085, .12, .0], [.02, .075, .042], .01, [0, 0, .05], liso('#1d1e1f'), o); B.box(T, [.095, .045, .0], [.018, .03, .02], .008, null, '#2a2b2c', o); B.box(T, [.098, .04, .0], [.008, .012, .014], .003, null, metal('#555'), o);
    for (const y of [.15, .25]) B.ell(T, [0, y, 0], [.1, .012, .098], null, '#1d1e1f', { ...o, clip: [pl(T, [0, y + .01, 0], [0, 1, 0]), pl(T, [0, y - .01, 0], [0, -1, 0])] }); };
  const radio = () => { B.box(F, [.118 * om, .115, -.192], [.028, .062, .025], .008, null, Pc, o); B.box(F, [.118 * om, .19, -.192], [.016, .016, .016], .004, null, '#202122', o); B.cone(F, [.12 * om, .2, -.19], [.13 * om, .5, -.23], .0035, .0025, '#151515', o); B.cone(F, [.11 * om, .2, -.17], [.1 * om, .32, .06], .004, .004, '#151515', o); B.box(F, [.1 * om, .27, .17], [.014, .022, .012], .004, [-.3, 0, 0], '#1a1a1a', o); };
  switch (tipo) {
    case 'plate_carrier': placas(); for (const x of [-.065, 0, .065]) mag(x * om, .075, .19); B.box(F, [0, .222, .185], [.085 * om, .04, .016], .008, [-.05, 0, 0], Pc, o); B.box(F, [-.05, .228, .204], [.024, .016, .02], 0, null, '#3b4a2c', PT('colete', { layer: 1 })); B.box(F, [.04, .228, .204], [.03, .014, .02], 0, null, '#2a2a26', PT('colete', { layer: 1 }));
      radio(); B.box(F, [-.02, .155, -.2], [.095 * om, .11, .026], .015, [.05, 0, 0], Vc, o); B.ell(F, [0, .305, -.175], [.04, .011, .012], null, '#1d1d1d', o);
      if (det >= 1) { B.box(F, [-.11 * om, .12, .19], [.022, .04, .02], .006, null, '#3c3f30', o); B.cyl(F, [-.11 * om, .17, .19], .006, .012, .002, null, '#9a8a2a', o); B.box(F, [.16 * om, .07, .05], [.018, .045, .04], .008, [0, -.4, 0], Pc, o); B.box(F, [-.15, .06, .09], [.02, .05, .035], .008, [0, .5, 0], Pc, o); }
      coldrePerna(); break;
    case 'swat': placas(.006); B.ell(F, [0, .31, -.01], [.15 * om, .03, .14], null, Pc, { ...o, clip: [pl(F, [0, .29, 0], [0, -1, 0]), pl(F, [0, .3, .06], [0, 0, 1])] });
      for (const s of [1, -1]) B.ell(null, [...k['S' + s].toArray()], [.08, .05, .08], null, Pc, { ...o, clip: [pl(F, [0, .26, 0], [0, -1, 0])] });
      for (const x of [-.065, 0, .065]) mag(x * om, .075, .195); B.box(F, [0, .222, .19], [.085 * om, .04, .016], .008, [-.05, 0, 0], Pc, o); radio(); coldrePerna();
      letreiro(B, F, 'SWAT', 0, .25, -.2, .0128, '#e9e9e4', ['colete']); letreiro(B, F, 'POLICE', 0, .245, .21, .0062, '#e9e9e4', ['colete']); break;
    case 'chest_rig': B.box(F, [0, .09, .132], [.12 * om, .065, .02], .012, [-.04, 0, 0], Pc, o); for (const x of [-.06, 0, .06]) mag(x * om, .07, .16, true, .026);
      for (const s of [1, -1]) { B.box(F, [s * .105 * om, .07, .14], [.022, .035, .02], .006, null, Pc, o); B.ell(F, [s * .09 * om, .29, -.01], [.025, .03, .145], null, Pc, { ...o, clip: [pl(F, [0, .255, 0], [0, -1, 0])] }); B.cone(F, [s * .09 * om, .29, -.13], [-s * .12 * om, .07, -.125], .013, .013, Pc, o); }
      break;
    case 'colete_leve': { const T = fab(cor(c1), .18); B.wear(['torso', 'abd'], .016, T, { tag: 'colete', layer: 1, clip: p => [pl(F, [0, .27, 0], [0, 1, 0])] }).forEach(p => { if (p.reg === 'abd') p.clips.push(...[]); });
      for (const s of [1, -1]) { B.box(F, [s * .07, .18, .14], [.035, .04, .012], .005, null, T, o); B.box(F, [s * .07, .22, .145], [.037, .01, .014], .004, null, mul(hx(base(c1)), .85), o); B.box(k.Fw, [s * .075, .0, .135], [.045, .045, .014], .006, null, T, o); B.box(F, [s * .12, .08, .12], [.02, .05, .014], .005, [0, s * .4, 0], T, o); B.ell(F, [s * .09, .29, -.01], [.025, .03, .15], null, T, { ...o, clip: [pl(F, [0, .25, 0], [0, -1, 0])] }); }
      B.box(F, [0, .14, .15], [.003, .14, .02], 0, null, '#2a2a2a', PT('colete', { layer: 1 })); break; }
    case 'suspensorio': { const T = fab(cor(c1), .1); for (const s of [1, -1]) { B.cone(F, [s * .07, .0, .145], [s * .09, .29, .06], .018, .018, T, { ...o }); B.cone(F, [s * .09, .29, .06], [s * .08, .28, -.1], .018, .018, T, o); B.cone(F, [s * .08, .28, -.1], [0, .1, -.155], .018, .018, T, o); }
      cinto(B, k, pr, 'lona'); for (const [x, z, ry] of [[.11, .1, .6], [-.11, .1, -.6], [.15, -.03, 1.3], [-.15, -.03, -1.3]]) { B.box(k.Fp, [x, .03, z], [.03, .04, .022], .008, [0, ry, 0], T, o); B.box(k.Fp, [x, .07, z + .004 * Math.sign(z)], [.032, .01, .024], .005, [0, ry, 0], mul(hx(base(c1)), .85), o); }
      B.cyl(k.Fp, [.0, .02, -.14], .03, .04, .01, [0, 0, Math.PI / 2], fab('#3a3f2a', .1), o); break; }
    case 'bandoleira': { const T = couro(base(c1)); const A = wp(F, [.13, .31, .02]), Bp = wp(k.Fw, [-.15, -.02, .03]), Cp = wp(k.Fw, [-.14, -.02, -.06]), Dp = wp(F, [.11, .31, -.1]);
      B.cone(null, A, Bp, .02, .02, T, o); B.cone(null, Dp, Cp, .02, .02, T, o); B.cone(null, A, Dp, .02, .02, T, o);
      for (let i = 0; i < 12; i++) { const p = A.clone().lerp(Bp, .08 + i * .075), n = wp(F, [0, 0, 1]).sub(wp(F, [0, 0, 0])); B.cyl(null, p.addScaledVector(n, .016).toArray(), .0065, .016, .002, [0, 0, .7], metal(i % 2 ? '#b8963a' : '#a8862a'), o); } break; }
    case 'policia': case 'imprensa': { const T = fab(cor(c1), .1); B.box(F, [0, .17, .14], [.12 * om, .13, .022], .02, [-.05, 0, 0], T, o); B.box(F, [0, .17, -.15], [.125 * om, .135, .022], .02, [.05, 0, 0], T, o);
      B.ell(F, [0, .08, -.005], [.178 * om, .09, .142], null, T, { ...o, clip: [pl(F, [0, .13, 0], [0, 1, 0]), pl(F, [0, .03, 0], [0, -1, 0])] }); for (const s of [1, -1]) B.ell(F, [s * .08 * om, .285, -.006], [.032, .028, .148], null, T, { ...o, clip: [pl(F, [0, .26, 0], [0, -1, 0])] });
      const txt = tipo === 'policia' ? 'POLICIA' : 'PRESS', tc = tipo === 'policia' ? '#f0f0ea' : '#f4f4f0';
      letreiro(B, F, txt, 0, .23, -.2, tipo === 'policia' ? .0078 : .0115, tc, ['colete']); letreiro(B, F, txt, 0, .2, .2, .0068, tc, ['colete']);
      if (tipo === 'policia') { B.ell(F, [.07, .26, .165], [.012, .014, .03], null, '#d8b84a', PT('colete', { layer: 1 })); coldrePerna(); } break; }
    case 'coldre_ombro': { const T = couro(base(c1)); for (const s of [1, -1]) { const top = wp(F, [s * .1, .3, .0]); B.cone(null, top, wp(F, [s * .17, .1, .06]), .012, .012, T, o); B.cone(null, top, wp(F, [s * .16, .1, -.08]), .012, .012, T, o); }
      B.cone(null, wp(F, [-.1, .3, .0]), wp(F, [.1, .3, 0]), .01, .01, T, { ...o, clip: [pl(F, [0, 0, -.05], [0, 0, 1])] });
      B.box(F, [.175, .08, .02], [.02, .06, .04], .01, [0, 0, .2], T, o); B.box(F, [.18, .11, .03], [.014, .02, .02], .006, null, metal('#2a2a2a'), o); B.box(F, [-.175, .08, .02], [.018, .045, .03], .008, null, T, o); break; }
  }
}

// ================= LUVAS =================
export const LUVAS = { nenhuma: 'Sem luvas', tatica: 'Tática', meio_dedo: 'Meio dedo', couro: 'Couro', latex: 'Látex', inverno: 'Inverno' };
export const LUVA_COR = { tatica: ['#2a2926'], meio_dedo: ['#1d1d1d'], couro: ['#6b4424'], latex: ['#5a8ac8'], inverno: ['#3a3d36'] };
export function luvas(B, k, tipo, c1) {
  if (tipo === 'nenhuma') return;
  const col = tipo === 'couro' ? couro(base(c1)) : tipo === 'latex' ? liso(base(c1), .15) : fab(cor(c1), .06), o = { tag: 'luva', layer: 1 };
  const inf = { tatica: .0035, meio_dedo: .0035, couro: .003, latex: .0012, inverno: .008 }[tipo];
  B.wear(['hand'], inf, col, { tag: 'luva', layer: 1, clip: p => tipo === 'meio_dedo' ? [pl(p.F, [0, .094, 0], [0, 1, 0])] : null });
  for (const s of [1, -1]) { const A = k['la' + s], L2 = k['La' + s][1], H = k['hd' + s];
    B.cone(A, [0, L2 - (tipo === 'inverno' ? .06 : .035), 0], [0, L2 + .012, 0], .037 + inf, .035 + inf, col, o);
    if (tipo === 'tatica') { B.box(H, [0, .088, .019], [.04, .012, .006], .004, null, '#151515', o); B.box(A, [0, L2 - .01, 0], [.045, .01, .045], .004, null, '#151515', { ...o, kind: 'paint', on: ['luva'] }); }
    if (tipo === 'meio_dedo') B.box(H, [0, .05, .019], [.036, .02, .004], .003, null, '#2c2c2c', o);
    if (tipo === 'inverno') B.tor(A, [0, L2 - .055, 0], .045, .008, null, mul(hx(base(c1)), .8), o);
  }
}

// ================= MOCHILA =================
export const MOCHILAS = { nenhuma: 'Sem mochila', assalto: 'Assalto 3 dias', hidratacao: 'Hidratação', radio: 'Rádio de longo alcance', sobrevivencia: 'Sobrevivência (com saco)', urbana: 'Urbana' };
export const MOCHILA_COR = { assalto: ['#5a5440'], hidratacao: ['#4b5235'], radio: ['#3c4030'], sobrevivencia: ['#56502f'], urbana: ['#26282c'] };
export function mochila(B, k, pr, tipo, c1) {
  if (tipo === 'nenhuma') return;
  const F = k.Fc, o = { tag: 'mochila', layer: 1 }, P = fab(cor(c1), .12, 1.4), E = escuro(c1, .78), om = pr.ombro;
  const alcas = (z = -.02, w = .03) => { for (const s of [1, -1]) B.ell(F, [s * .08 * om, .27, z], [w, .05, .155], null, P, { ...o, clip: [pl(F, [0, .24, 0], [0, -1, 0])] }); };
  switch (tipo) {
    case 'assalto': B.box(F, [0, .12, -.24], [.13 * om, .17, .075], .04, [.06, 0, 0], molle(base(c1)), o); B.box(F, [0, .05, -.32], [.1, .07, .025], .015, null, P, o); B.box(F, [0, .3, -.24], [.11, .015, .06], .01, null, E, o);
      for (const s of [1, -1]) { B.box(F, [s * .14 * om, .1, -.24], [.02, .1, .045], .01, null, P, o); B.cone(F, [s * .11, .28, -.3], [s * .11, -.05, -.3], .004, .004, '#1a1a1a', o); } alcas(); break;
    case 'hidratacao': B.box(F, [0, .14, -.205], [.075, .14, .03], .025, [.05, 0, 0], P, o); B.cone(F, [-.05, .26, -.19], [-.13, .3, .02], .005, .005, '#1a1a1a', o); B.cone(F, [-.13, .3, .02], [-.11, .2, .15], .005, .005, '#1a1a1a', o); break;
    case 'radio': B.box(F, [0, .13, -.235], [.11 * om, .15, .06], .02, [.05, 0, 0], P, o); B.box(F, [.05, .3, -.24], [.03, .02, .03], .006, null, '#202020', o); B.cone(F, [.05, .32, -.24], [.08, .85, -.33], .004, .002, '#111', o); B.box(F, [-.04, .2, -.3], [.04, .03, .006], 0, null, '#5a6a4a', PT('mochila', { layer: 1 })); alcas(); break;
    case 'sobrevivencia': B.box(F, [0, .1, -.24], [.13 * om, .18, .075], .045, [.06, 0, 0], P, o); B.box(F, [0, .02, -.32], [.1, .07, .02], .015, null, E, o); B.cyl(F, [0, .32, -.24], .045, .14, .02, [0, 0, Math.PI / 2], fab('#5f6b4a', .15), o);
      for (const x of [-.08, .08]) B.tor(F, [x, .32, -.24], .047, .004, [0, 0, Math.PI / 2], '#2a2a2a', o); B.cyl(F, [.14, .12, -.24], .022, .06, .006, null, metal('#7a7a72'), o); alcas(); break;
    case 'urbana': B.box(F, [0, .12, -.23], [.115 * om, .16, .06], .05, [.06, 0, 0], P, o); B.box(F, [0, .05, -.29], [.085, .06, .015], .02, null, E, o); B.box(F, [0, .23, -.29], [.06, .002, .01], 0, null, '#b0b0b0', PT('mochila', { layer: 1 })); alcas(.0, .025); break;
  }
}

// ================= ARMA =================
export function arma(B, F, tipo) {
  const o = { tag: 'arma', layer: 1 }, P = metal('#1f2022'), P2 = metal('#2c2e31');
  if (tipo === 'ak') {
    const W = madeira('#7b4a28');
    B.box(F, [0, -.01, .1], [.019, .04, .1], .01, [-.12, 0, 0], W, o); B.box(F, [0, -.018, .006], [.021, .05, .008], .004, null, '#2a1b12', o);
    B.box(F, [0, .03, .32], [.02, .03, .12], .005, null, P2, o); B.box(F, [0, .058, .33], [.017, .008, .1], .006, null, P, o); B.box(F, [.021, .035, .3], [.002, .012, .03], 0, null, '#111', o);
    B.box(F, [0, -.035, .27], [.014, .04, .017], .007, [-.3, 0, 0], W, o);
    B.box(F, [0, -.05, .38], [.013, .05, .028], .006, [.22, 0, 0], metal('#3a2c22'), o); B.box(F, [0, -.13, .41], [.013, .045, .026], .006, [.5, 0, 0], metal('#3a2c22'), o);
    B.box(F, [0, .022, .55], [.022, .025, .09], .015, null, W, o); B.cyl(F, [0, .065, .55], .011, .08, .004, [Math.PI / 2, 0, 0], W, o);
    B.cyl(F, [0, .03, .74], .008, .13, .003, [Math.PI / 2, 0, 0], P, o); B.box(F, [0, .055, .76], [.004, .02, .006], .002, null, P, o); B.cyl(F, [0, .03, .87], .011, .014, .003, [Math.PI / 2, 0, 0], P, o);
    return;
  }
  const C = metal('#6e5f48');
  B.box(F, [0, -.005, .08], [.022, .044, .068], .012, [-.05, 0, 0], C, o); B.box(F, [0, -.012, .008], [.024, .054, .008], .004, null, '#151515', o);
  B.cyl(F, [0, .035, .17], .016, .09, .004, [Math.PI / 2, 0, 0], P, o);
  B.box(F, [0, .012, .33], [.018, .03, .085], .004, null, P2, o); B.box(F, [0, .052, .335], [.0195, .022, .1], .004, null, P, o); B.box(F, [-.02, .052, .33], [.002, .01, .035], 0, null, '#0e0e0e', o);
  B.box(F, [0, .079, .44], [.012, .006, .22], .002, null, (x, y, z, p) => { const l = p.loc(x, y, z); return mul(hx('#1a1b1d'), ((l[2] * 90) % 1 + 1) % 1 < .45 ? .6 : 1.1); }, o);
  B.box(F, [0, -.047, .283], [.014, .045, .018], .007, [-.35, 0, 0], C, o); B.box(F, [0, -.025, .315], [.004, .004, .032], .002, null, P, o);
  B.box(F, [0, -.045, .372], [.012, .045, .029], .005, [.12, 0, 0], P2, o); B.box(F, [0, -.12, .384], [.012, .036, .028], .005, [.3, 0, 0], P2, o);
  B.cyl(F, [0, .046, .565], .027, .14, .007, [Math.PI / 2, 0, 0], (x, y, z, p) => { const l = p.loc(x, y, z); return mul(hx('#6e5f48'), ((l[1] * 40) % 1 + 1) % 1 < .25 ? .7 : 1); }, o);
  B.cyl(F, [0, .046, .76], .0085, .07, .003, [Math.PI / 2, 0, 0], P, o); B.cyl(F, [0, .046, .845], .013, .022, .004, [Math.PI / 2, 0, 0], P, o);
  B.box(F, [0, .092, .7], [.006, .012, .008], .003, null, P, o);
  B.cyl(F, [0, .112, .37], .019, .032, .006, [Math.PI / 2, 0, 0], P, o); B.box(F, [0, .09, .37], [.012, .01, .02], .003, null, P, o);
  B.cyl(F, [0, .112, .404], .014, .002, 0, [Math.PI / 2, 0, 0], '#c23a2a', { kind: 'paint', on: ['arma'] });
}
