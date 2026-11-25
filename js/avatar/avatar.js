// Avatares procedurais do Dan Gun (v2): montarAvatar(cfg) -> THREE.Group.
// cfg = { corpo, preset, pele, cabelo, corCabelo, barba, chapeu, rosto:[...], tronco, calca, calcado, colete, luvas, mochila, camo,
//         cores:{ tronco, tronco2, calca, calcado, calcado2, colete, luvas, mochila, chapeu }, olho, arma }
// Toda opção está em OPCOES (base do editor). Valores de cor: '#hex', nome de camo (CAMOS) ou 'camo' (= cfg.camo).
import * as THREE from '../../vendor/three@0.160.0/build/three.module.js';
import { V, v, hx, mix, mul, sat, mk, child, wp, segFrame, ik, Bld, pl, bake, meshCubos, meshNets, rng } from './nucleo.js';
import { CAMOS, camoCfg } from './tex.js';
import { rosto, pele, cabelo, barba, chapeu, chapeuCobre, acessorio, CABELOS, CORES_CABELO, BARBAS, CHAPEUS, ROSTOS } from './cabeca.js';
import { tronco, calca, calcado, colete, luvas, mochila, arma, TRONCOS, TRONCO_COR, CALCAS, CALCA_COR, CALCADOS, CALCADO_COR, COLETES, COLETE_COR, LUVAS, LUVA_COR, MOCHILAS, MOCHILA_COR } from './roupas.js';

export const PELES = { porcelana: '#f6dcc6', clara: '#f0cfae', bege: '#e4b996', media: '#d2a07a', oliva: '#b98f66', morena: '#a8714a', canela: '#8d5a3a', parda: '#76472c', escura: '#5a3522', retinta: '#3e2418' };
export const OLHOS = { castanho: '#4a2f1c', mel: '#8a5a24', verde: '#4a6a3a', azul: '#3d6a9a', cinza: '#6a7680', preto: '#1c1410' };
export const OPCOES = { pele: PELES, corCabelo: CORES_CABELO, olho: OLHOS, cabelo: CABELOS, barba: BARBAS, chapeu: CHAPEUS, rosto: ROSTOS, tronco: TRONCOS, calca: CALCAS, calcado: CALCADOS, colete: COLETES, luvas: LUVAS, mochila: MOCHILAS, camo: Object.fromEntries(Object.entries(CAMOS).map(([k, d]) => [k, d.nome])), arma: { m4: 'M4', ak: 'AK' } };
const P0 = { ombro: 1, grossura: 1, mao: 1, cabeca: 1, perna: 1, tronco: 1, cintura: 1, quadril: 1, braco: 1, olho: 1 };
export const CORPOS = {
  fino: { nome: 'Voxel fino', malha: 'cubos', res: .0068, resCab: .0034, resMao: .0045, det: 2, jit: .035, jitCab: .02 },
  chunky: { nome: 'Voxel chunky heroico', malha: 'cubos', res: .019, det: 0, jit: .06, sat: 1.25, camo: .45, camoN: 3, pr: { ombro: 1.3, grossura: 1.28, mao: 1.3, cabeca: 1.12, perna: 1.04, tronco: 1.08, cintura: .84, olho: 1.7 } },
  tatico: { nome: 'Tático detalhado', malha: 'liso', res: .0062, resCab: .0034, resMao: .0045, det: 2, jit: .015 },
  cartoon: { nome: 'Cartunesco cabeção', malha: 'toon', res: .0085, resCab: .0055, det: 0, jit: 0, sat: 1.3, camo: .5, camoN: 3, pr: { cabeca: 1.75, perna: .7, tronco: .84, grossura: 1.18, mao: 1.4, ombro: .98, braco: .82, olho: 2.1 } },
};
export const PRESETS = {
  operador: { tronco: 'camisa_combate', calca: 'combate', calcado: 'coturno_deserto', colete: 'plate_carrier', luvas: 'tatica', mochila: 'hidratacao', chapeu: 'capacete_fast', camo: 'multicam', cabelo: 'curto', barba: 'cheia', pele: 'media' },
  camuflado: { tronco: 'farda_arregacada', calca: 'cargo', calcado: 'coturno', colete: 'chest_rig', chapeu: 'boina', camo: 'woodland', cores: { calca: 'camo', chapeu: '#3d4a2a' }, cabelo: 'raspado', barba: 'por_fazer', pele: 'morena' },
  urbano: { tronco: 'moletom', calca: 'jeans', calcado: 'tenis', mochila: 'urbana', chapeu: 'gorro', cores: { chapeu: '#2a2b2e' }, cabelo: 'cacheado_curto', barba: 'nenhuma', pele: 'bege' },
  balaclava: { tronco: 'jaqueta_campo', calca: 'cargo', calcado: 'coturno', colete: 'chest_rig', chapeu: 'balaclava', rosto: ['shemagh'], arma: 'ak', cores: { calca: '#8b7d5c' }, pele: 'oliva' },
  swat: { tronco: 'policia', calca: 'tatica', calcado: 'coturno', colete: 'swat', luvas: 'tatica', chapeu: 'capacete_swat', rosto: ['tatico'], cabelo: 'raspado', barba: 'cavanhaque', pele: 'escura' },
  zumbi: { tronco: 'flanela', calca: 'jeans_rasgado', calcado: 'bota_trabalho', colete: 'bandoleira', mochila: 'sobrevivencia', chapeu: 'bone', rosto: ['cicatriz'], arma: 'ak', cabelo: 'longo_solto', corCabelo: 'ruivo', barba: 'lenhador', pele: 'clara', cores: { chapeu: '#7a6a4a' } },
  ghillie: { tronco: 'ghillie', calca: 'ghillie', calcado: 'bota_selva', luvas: 'couro', chapeu: 'chapeu_selva', camo: 'woodland', rosto: ['pintura'], cores: { chapeu: '#4b5235' }, cabelo: 'curto', barba: 'curta', pele: 'canela' },
  casual: { tronco: 'camiseta', calca: 'jeans', calcado: 'tenis_cano_alto', cabelo: 'undercut', barba: 'curta', pele: 'parda', rosto: ['sol'], cores: { tronco: '#d6d1c4' } },
};
function esqueleto(pr) {
  const ts = pr.tronco, thL = .45 * pr.perna, shL = .43 * pr.perna, ankH = .085 * Math.max(.85, pr.perna);
  const ank = { 1: v(.15, ankH, .12), [-1]: v(-.15, ankH, -.13) };
  const reach = (thL + shL) * .962, hipJY = ankH + Math.sqrt(reach * reach - .134 * .134);
  const k = { thL, shL, ts };
  k.Fp = mk(v(0, hipJY + .055 * ts, -.005), [.06, -.2, 0]);
  k.Fw = child(k.Fp, [0, .11 * ts, 0], [.03, -.08, 0]);
  k.Fc = child(k.Fw, [0, .11 * ts, 0], [.04, -.1, 0]);
  k.Fn = child(k.Fc, [0, .3 * ts, -.015], [-.08, 0, 0]);
  k.Fh = child(k.Fn, [0, .065 * Math.min(1, ts), 0], [-.04, .3, 0], pr.cabeca);
  for (const s of [1, -1]) {
    const H = wp(k.Fp, [s * .09 * pr.quadril, -.06, 0]), pole = v(s * .25, 0, 1);
    const [K, A] = ik(H, ank[s], thL, shL, pole);
    k['th' + s] = segFrame(H, K, pole); k['sh' + s] = segFrame(K, A, pole);
    k['ft' + s] = mk(A, [0, s > 0 ? .2 : -.55, 0]); k['L' + s] = { thL, shL };
  }
  // arma: soleira no bolso do ombro direito, cano para a frente e para baixo
  const ombro = s => wp(k.Fc, [s * .185 * pr.ombro, .265 * ts, -.015]);
  k.Fr = mk(wp(k.Fc, [-.125 * pr.ombro, .225 * ts, .1]), [.27, .03, 0], pr.arma);
  const L1 = .29 * pr.braco, L2 = .26 * pr.braco;
  const hold = (s) => {
    const S = ombro(s); let G, W, dor;
    if (s < 0) { G = wp(k.Fr, [0, -.055, .29]); W = wp(k.Fr, [-.012, -.087, .222]); dor = v(-1, .25, 0).transformDirection(k.Fr); }
    else { let t = .62; for (; t > .38; t -= .01) { if (wp(k.Fr, [.03, -.065, t - .055]).distanceTo(S) < .97 * (L1 + L2)) break; } G = wp(k.Fr, [0, -.006, t]); W = wp(k.Fr, [.03, -.068, t - .055]); dor = v(.5, -1, -.1).transformDirection(k.Fr); }
    const [E, W2] = ik(S, W, L1, L2, s < 0 ? v(-.75, -1, -.35) : v(.45, -1, .05));
    const polo = v(s * .6, -.2, -.5);
    k['ua' + s] = segFrame(S, E, polo); k['la' + s] = segFrame(E, W2, polo); k['La' + s] = [S.distanceTo(E), E.distanceTo(W2)];
    k['hd' + s] = segFrame(W2, G, dor, pr.mao); k['S' + s] = S; k['G' + s] = G;
  };
  hold(-1); hold(1);
  return k;
}

// ---------- corpo nu (tag pele); a cabeça vem de cabeca.js ----------
function corpo(B, k, pr, c) {
  const g = pr.grossura, om = pr.ombro, SK = pele(c.pele);
  const o = (reg, side) => ({ reg, side, body: true, tag: 'pele' });
  B.ell(k.Fp, [0, 0, 0], [.162 * pr.quadril, .105, .115], null, SK, o('pelvis'));
  for (const s of [1, -1]) B.ell(k.Fp, [s * .07, -.03, -.035], [.078, .088, .075], null, SK, o('pelvis'));
  B.ell(k.Fw, [0, .03, .005], [.142 * pr.cintura * Math.max(1, om * .92), .13, .103], null, SK, o('abd'));
  B.ell(k.Fc, [0, .13, -.005], [.163 * om, .165, .113], null, SK, o('torso'));
  B.box(k.Fc, [0, .19, .064], [.128 * om, .055, .035], .03, null, SK, o('torso'));
  B.ell(k.Fc, [0, .17, -.03], [.172 * om, .12, .1], null, SK, o('torso'));
  B.box(k.Fc, [0, .2, .1], [.0025, .05, .03], 0, null, mul(hx(c.pele), .88), { kind: 'paint', on: ['pele'] });
  B.ell(k.Fw, [0, .045, .1], [.003, .004, .03], null, mul(hx(c.pele), .7), { kind: 'paint', on: ['pele'] });
  for (const s of [1, -1]) {
    B.ell(k.Fc, [s * .085 * om, .275 * k.ts, -.035], [.085 * om, .042, .062], [0, 0, -s * .3], SK, o('torso'));
    B.ell(null, [...k['S' + s].toArray()], [.056 * g, .06 * g, .056 * g], null, SK, o('uarm', s));
    B.cone(k.Fc, [s * .02, .29, .05], [s * .13 * om, .3, .02], .012, .01, SK, o('torso')); // clavícula
  }
  B.cone(null, wp(k.Fn, [0, -.01, 0]), wp(k.Fh, [0, .045, -.012]), .056 * g, .05 * g, SK, o('neck'));
  B.ell(null, wp(k.Fn, [0, .045, .042]).toArray(), [.011, .014, .01], null, SK, o('neck'));
  for (const s of [1, -1]) B.cone(null, wp(k.Fh, [s * .07, .07, -.01]), wp(k.Fn, [s * .02, .0, .05]), .014, .012, SK, o('neck'));
  for (const s of [1, -1]) {
    const [L1, L2] = k['La' + s], U = k['ua' + s], A = k['la' + s];
    B.cone(U, [0, 0, 0], [0, L1, 0], .056 * g, .043 * g, SK, o('uarm', s)); B.ell(U, [0, L1 * .48, 0], [.047 * g, .1, .046 * g], null, SK, o('uarm', s));
    B.cone(A, [0, 0, 0], [0, L2, 0], .046 * g, .031 * g, SK, o('larm', s)); B.ell(A, [0, L2 * .27, 0], [.05 * g, .085, .045 * g], null, SK, o('larm', s));
    B.ell(A, [0, L2 - .005, 0], [.034, .02, .024], null, SK, o('larm', s));
    mao(B, k['hd' + s], s, SK, o('hand', s), c);
  }
  for (const s of [1, -1]) {
    const T = k['th' + s], S = k['sh' + s], F = k['ft' + s], { thL, shL } = k['L' + s];
    B.cone(T, [0, 0, 0], [0, thL, 0], .094 * g, .06 * g, SK, o('thigh', s)); B.ell(T, [0, thL * .42, .012], [.083 * g, .17, .077 * g], null, SK, o('thigh', s));
    B.cone(S, [0, 0, 0], [0, shL, 0], .058 * g, .039 * g, SK, o('shin', s)); B.ell(S, [0, shL * .3, -.022], [.056 * g, .11, .054 * g], null, SK, o('shin', s));
    B.ell(S, [0, .01, .036], [.034, .034, .022], null, SK, o('shin', s));
    for (const x of [-1, 1]) B.ell(S, [x * .028, shL - .01, 0], [.012, .015, .012], null, SK, o('shin', s)); // tornozelos
    B.box(F, [0, -.045, .055], [.045, .034, .105], .028, null, SK, o('foot', s)); B.ell(F, [0, -.05, -.02], [.035, .035, .04], null, SK, o('foot', s));
  }
}
function mao(B, F, s, col, o, c) {
  const ts = s < 0 ? -1 : 1, P = hx(c.pele), unha = mix(P, [.95, .8, .78], .45), dob = mul(P, .7);
  B.box(F, [0, .045, 0], [.041, .046, .017], .013, null, col, o); B.ell(F, [0, .012, 0], [.034, .025, .019], null, col, o);
  B.ell(F, [ts * -.022, .03, -.012], [.016, .022, .01], null, col, o); // tenar
  for (let f = 0; f < 4; f++) {
    const x = ts * (.0293 - f * .0195), enc = f === 3 ? .88 : 1, dy = f === 3 ? -.007 : f === 0 ? -.002 : f === 1 ? .002 : 0;
    B.ell(F, [x, .089 + dy, .009], [.0108, .011, .0105], null, col, o);
    B.box(F, [x, .1 + dy, -.006], [.0086 * enc, .016, .011], .0078, [.25, 0, 0], col, o);
    B.box(F, [x, .101 + dy, -.031], [.0083 * enc, .011, .015], .0075, null, col, o);
    B.box(F, [x, .099 + dy, -.003], [.009, .0015, .012], 0, [.25, 0, 0], dob, { kind: 'paint', on: ['pele'] });
    B.box(F, [x, .086 + dy, -.04], [.006, .004, .006], 0, null, unha, { kind: 'paint', on: ['pele'] });
  }
  B.cone(F, [-ts * .036, .018, -.008], [-ts * .034, .058, -.034], .014, .011, col, o);
  B.ell(F, [-ts * .033, .066, -.04], [.011, .012, .011], null, col, o);
  B.ell(F, [-ts * .033, .074, -.042], [.006, .004, .007], null, unha, { kind: 'paint', on: ['pele'] });
}

// ---------- configuração ----------
const def = (o, d) => o ?? d;
export function normalizar(cfg0 = {}) {
  const p = cfg0.preset ? PRESETS[cfg0.preset] || {} : {};
  const cfg = { corpo: 'fino', pele: 'media', cabelo: 'curto', corCabelo: 'castanho_escuro', barba: 'nenhuma', chapeu: 'nenhum', rosto: [], tronco: 'camiseta', calca: 'cargo', calcado: 'coturno', colete: 'nenhum', luvas: 'nenhuma', mochila: 'nenhuma', camo: 'multicam', olho: 'castanho', arma: 'm4', ...p, ...cfg0, cores: { ...(p.cores || {}), ...(cfg0.cores || {}) } };
  if (!Array.isArray(cfg.rosto)) cfg.rosto = cfg.rosto ? [cfg.rosto] : [];
  return cfg;
}
export function construir(cfg0, rig = null) {
  const cfg = normalizar(cfg0), K = rig ? CORPOS.fino : CORPOS[cfg.corpo] || CORPOS.fino, pr = { ...P0, ...(K.pr || {}), arma: cfg.corpo === 'cartoon' && !rig ? .9 : 1 };
  if (rig) pr.braco = RIG.reach[0] / .29;
  camoCfg(K.camo || 1, K.camoN || 4);
  const cc = cfg.cores, rc = (part, tab, i = 0) => { let x = i ? cc[part + '2'] : cc[part]; if (x === undefined) x = (tab[cfg[part]] || [])[i]; return x === 'camo' ? cfg.camo : x; };
  const c = { pele: PELES[cfg.pele] || cfg.pele, cabelo: CORES_CABELO[cfg.corCabelo] || cfg.corCabelo, olho: OLHOS[cfg.olho] || cfg.olho, chapeu: (cc.chapeu === 'camo' ? cfg.camo : cc.chapeu) || ({ capacete_fast: cfg.camo, capacete_nvg: cfg.camo, capacete_pasgt: 'woodland', bone: '#3a3f45', bone_tras: '#a33a2c', gorro: '#3a3f45', boina: '#6e1f24', chapeu_selva: cfg.camo, capuz: '#4a4f57', faixa: '#7a1a1a', bandana: '#8a1c1c', cowboy: '#6b4a2b', quepe: '#1f2638' }[cfg.chapeu] || '#3a3f45'), logo: cc.logo };
  const B = new Bld(), k = rig ? esqueletoRig(pr, rig) : esqueleto(pr); k.pele = c.pele;
  corpo(B, k, pr, c); rosto(B, k.Fh, pr, c);
  cabelo(B, k.Fh, cfg.cabelo, c, chapeuCobre(cfg.chapeu)); barba(B, k.Fh, cfg.barba, c);
  tronco(B, k, pr, cfg.tronco, rc('tronco', TRONCO_COR), rc('tronco', TRONCO_COR, 1), K.det);
  calca(B, k, pr, cfg.calca, rc('calca', CALCA_COR), K.det);
  calcado(B, k, cfg.calcado, rc('calcado', CALCADO_COR), rc('calcado', CALCADO_COR, 1));
  luvas(B, k, cfg.luvas, rc('luvas', LUVA_COR)); colete(B, k, pr, cfg.colete, rc('colete', COLETE_COR), K.det); mochila(B, k, pr, cfg.mochila, rc('mochila', MOCHILA_COR));
  for (const r of cfg.rosto) acessorio(B, k.Fh, r, c);
  chapeu(B, k.Fh, cfg.chapeu, c, K.det);
  if (!rig) arma(B, k.Fr, cfg.arma);
  if (K.sat) for (const p of B.P) { const f = p.col; p.col = typeof f === 'function' ? (x, y, z, q) => sat(f(x, y, z, q), K.sat) : sat(hx(f), K.sat); }
  return { B, k, K, cfg };
}
let _grad;
export function montarAvatar(cfg0) {
  const { B, k, K } = construir(cfg0), g = new THREE.Group(), M = K.malha;
  const add = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const std = (o = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .82, metalness: 0, ...o });
  const maos = [k.hd1, k['hd-1']];
  const grupos = [
    [B.P.filter(p => p.F !== k.Fh && !maos.includes(p.F)), K.res],
    [B.P.filter(p => p.F === k.Fh), K.resCab || K.res],
    [B.P.filter(p => maos.includes(p.F)), K.resMao || K.res],
  ];
  for (const [P, res] of grupos) {
    if (!P.some(p => p.kind === 'add')) continue;
    const G = bake(P, res), jit = res === K.res ? K.jit : (K.jitCab ?? K.jit);
    if (M === 'cubos') add(meshCubos(G, { jit }), std());
    else if (M === 'liso') add(meshNets(G, { jit }), std({ roughness: .74 }));
    else if (M === 'toon') {
      if (!_grad) { _grad = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 255, 255, 255, 255]), 3, 1); _grad.minFilter = _grad.magFilter = THREE.NearestFilter; _grad.needsUpdate = true; }
      const geo = meshNets(G, { jit: 0 }); add(geo, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: _grad }));
      const om = new THREE.MeshBasicMaterial({ color: 0x17120f, side: THREE.BackSide }); om.onBeforeCompile = s => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normal * 0.0075;'); }; g.add(new THREE.Mesh(geo, om));
    }
  }
  g.userData.cfg = normalizar(cfg0); g.userData.marcos = { cab: wp(k.Fh, [0, .1, .03]), quadril: k.Fp.elements[13], maos: wp(k.hd1, [0, .06, 0]).lerp(wp(k['hd-1'], [0, .06, 0]), .5) };
  return g;
}

// ================= rig do jogo =================
// O boneco do jogo (playerModel no index.html) é animado por grupos: inner (tronco, cintura e pescoço), head, legL/legR (perna
// inteira, gira no quadril e encolhe no agachar) e, em cada braço, peças soltas que o IK de 2 ossos (tpArm) liga: ombro (sh),
// braço (up: cilindro de altura 1 esticado do ombro ao cotovelo), antebraço (fo: do cotovelo à mão) e mão (grupo na empunhadura,
// com a rotação da arma). gerarPartes monta o avatar num esqueleto de descanso com as mesmas medidas (quadril a 0,86 m,
// ombros a 1,38 m, braço 0,30 + 0,34 m até a empunhadura), separa as primitivas por osso e assa cada osso no espaço local da
// peça do jogo (frente = -z). As mãos saem já fechadas na empunhadura: a pose delas vem do esqueleto da arma (esqueleto()).
export const RIG = { quadril: .86, ombro: 1.38, reach: [.3, .34] };
export const NIVEIS = { // resolução (m) do corpo, da cabeça e das mãos; det = detalhes pequenos das roupas
  f: { res: .0068, cab: .0034, mao: .0045, jit: .035, jitCab: .02, det: 2 },
  m: { res: .017, cab: .012, mao: .014, jit: .03, jitCab: .02, det: 1 },
  l: { res: .032, cab: .024, mao: .026, jit: .02, jitCab: .02, det: 0 },
};
const RPI = new THREE.Matrix4().makeRotationY(Math.PI);
function esqueletoRig(pr) {
  const P = esqueleto(pr), k = {}; // P: pose com a arma (só as mãos saem dele)
  let ts = pr.tronco, p = pr.perna;
  for (let it = 0; it < 3; it++) { const ank = .085 * Math.max(.85, p); p = (RIG.quadril - ank) / (.88 * .985); }
  pr.perna = p;
  const thL = .45 * p, shL = .43 * p, ankH = .085 * Math.max(.85, p);
  const tronco = t => { const Fp = mk(v(0, RIG.quadril + .06, 0), [.03, 0, 0]), Fw = child(Fp, [0, .11 * t, 0], [.02, 0, 0]), Fc = child(Fw, [0, .11 * t, 0], [.03, 0, 0]); return { Fp, Fw, Fc }; };
  for (let it = 0; it < 4; it++) { const { Fp, Fc } = tronco(ts), S = wp(Fc, [.185 * pr.ombro, .265 * ts, -.015]), y0 = Fp.elements[13]; ts *= (RIG.ombro - y0) / (S.y - y0); }
  pr.tronco = ts; Object.assign(k, tronco(ts), { thL, shL, ts });
  k.Fn = child(k.Fc, [0, .3 * ts, -.015], [-.06, 0, 0]);
  k.Fh = child(k.Fn, [0, .065 * Math.min(1, ts), 0], [-.02, 0, 0], pr.cabeca);
  for (const s of [1, -1]) {
    const H = wp(k.Fp, [s * .09 * pr.quadril, -.06, 0]), A = v(s * .115, ankH, .012), pole = v(s * .2, 0, 1);
    const L = H.distanceTo(A), f = Math.min(.999, L / (thL + shL));
    const [K, A2] = ik(H, A, thL, shL, pole); void f;
    k['th' + s] = segFrame(H, K, pole); k['sh' + s] = segFrame(K, A2, pole); k['ft' + s] = mk(A2, [0, s * .08, 0]); k['L' + s] = { thL, shL }; k['H' + s] = H; k['A' + s] = A2;
    const S = wp(k.Fc, [s * .185 * pr.ombro, .265 * ts, -.015]), L1 = .29 * pr.braco, L2 = .26 * pr.braco;
    const d1 = v(s * .13, -1, .02).normalize(), d2 = v(s * .06, -1, .12).normalize(), E = S.clone().addScaledVector(d1, L1), W = E.clone().addScaledVector(d2, L2), polo = v(s * .5, 0, -1);
    k['ua' + s] = segFrame(S, E, polo); k['la' + s] = segFrame(E, W, polo); k['La' + s] = [L1, L2]; k['S' + s] = S; k['E' + s] = E; k['W' + s] = W;
    // mão: quadro da mão relativo à arma do esqueleto com pose, levado ao espaço da mão do jogo (origem = empunhadura, frente = -z)
    const Fi = P.Fr.clone().invert(), Gl = P['G' + s].clone().applyMatrix4(Fi);
    k['hd' + s] = RPI.clone().multiply(new THREE.Matrix4().makeTranslation(-Gl.x, -Gl.y, -Gl.z)).multiply(Fi).multiply(P['hd' + s]);
  }
  k.Fr = P.Fr;
  return k;
}
// avatar (x, y, z) -> jogo (-x, y, -z): o avatar olha para +z, o boneco do jogo para -z
const G3 = (p) => [-p.x, p.y, -p.z];
function ossos(k) {
  const O = {}, add = (n, o) => { O[n] = { n, ...o }; };
  add('inner', { p: [0, 0, 0], seg: [k.Fp, k.Fn], r: .14 });
  add('head', { p: G3(v(0, 0, 0).applyMatrix4(k.Fh)), seg: [k.Fh, k.Fh], r: .1, ponto: wp(k.Fh, [0, .1, .02]) });
  for (const s of [1, -1]) {
    const L = s > 0 ? 'L' : 'R'; // lado do avatar +x = esquerda dele = -x no jogo
    add('leg' + L, { p: G3(k['H' + s]), a: k['H' + s], b: k['A' + s], r: .07 });
    add('sh' + L, { p: G3(k['S' + s]), a: k['S' + s], b: k['S' + s], r: .03 });
    add('up' + L, { a: k['S' + s], b: k['E' + s], r: .05, len: RIG.reach[0] });
    add('fo' + L, { a: k['E' + s], b: k['W' + s], r: .04, len: RIG.reach[1] });
    add('h' + L, { mao: true });
  }
  O.head.a = O.head.b = O.head.ponto; O.inner.a = v(0, 0, 0).applyMatrix4(k.Fp); O.inner.b = v(0, 0, 0).applyMatrix4(k.Fn);
  return O;
}
const _c = new V(), _ab = new V();
function distSeg(p, a, b) { _ab.subVectors(b, a); const l2 = _ab.lengthSq(); const t = l2 > 1e-9 ? Math.max(0, Math.min(1, _c.subVectors(p, a).dot(_ab) / l2)) : 0; return _c.copy(a).addScaledVector(_ab, t).distanceTo(p); }
function centro(pr) {
  if (pr.t === 2) { const q = pr.p; return v((q[0] + q[3]) / 2, (q[1] + q[4]) / 2, (q[2] + q[5]) / 2).applyMatrix4(pr.M); }
  return v(0, 0, 0).applyMatrix4(pr.M);
}
// osso de cada primitiva: pelo quadro (F) em que foi feita; as feitas direto no mundo (F nulo), pelo osso mais perto
function osso(pr, k, O, mapa) {
  const o = mapa.get(pr.F); if (o) return o;
  const c = centro(pr); let best = 'inner', bd = 1e9;
  for (const b of Object.values(O)) { if (b.mao) continue; const d = distSeg(c, b.a, b.b) - b.r; if (d < bd) { bd = d; best = b.n; } }
  return best;
}
// peça do jogo: matriz 3x3 + deslocamento que leva posição e normal (do mundo do avatar) ao espaço local do osso
// (avatar -> jogo: (-x, y, -z); braço e antebraço: y ao longo do osso dividido pelo comprimento, que o tpSeg multiplica de volta)
function espaco(b) {
  if (b.mao) return null;
  if (!b.len) { const [px, py, pz] = b.p; return { m: [-1, 0, 0, 0, 1, 0, 0, 0, -1], t: [-px, -py, -pz], ny: 1 }; }
  const A = v(...G3(b.a)), B = v(...G3(b.b)), y = B.clone().sub(A).normalize(), fr = v(0, 0, -1), z = fr.addScaledVector(y, -fr.dot(y)).normalize(), x = new V().crossVectors(y, z);
  const L = b.len, mid = A.clone().addScaledVector(y, L / 2);
  // linha i de m = eixo local i aplicado ao ponto do jogo (-X, Y, -Z) - mid
  const m = [-x.x, x.y, -x.z, -y.x / L, y.y / L, -y.z / L, -z.x, z.y, -z.z];
  return { m, t: [-(x.x * mid.x + x.y * mid.y + x.z * mid.z), -(y.x * mid.x + y.y * mid.y + y.z * mid.z) / L, -(z.x * mid.x + z.y * mid.y + z.z * mid.z)], ny: L * L };
}
// gera as peças: { partes: { inner, head, legL, legR, shL, shR, upL, upR, foL, foR, hL, hR: { pos, nor, col, ind } }, rig, tri, ms }
export function gerarPartes(cfg0, nivel = 'm') {
  const t0 = (typeof performance !== 'undefined' ? performance : Date).now(), N = NIVEIS[nivel] || NIVEIS.m;
  CORPOS.fino.det = N.det;
  let B, k; try { ({ B, k } = construir(cfg0, true)); } finally { CORPOS.fino.det = 2; }
  const O = ossos(k), mapa = new Map([[k.Fp, 'inner'], [k.Fw, 'inner'], [k.Fc, 'inner'], [k.Fn, 'inner'], [k.Fh, 'head']]);
  for (const s of [1, -1]) { const L = s > 0 ? 'L' : 'R'; for (const f of ['th', 'sh', 'ft']) mapa.set(k[f + s], 'leg' + L); mapa.set(k['ua' + s], 'up' + L); mapa.set(k['la' + s], 'fo' + L); mapa.set(k['hd' + s], 'h' + L); }
  const grupos = {}; for (const n in O) grupos[n] = [];
  const soltas = []; // corte/pintura feitos no mundo: valem para todas as peças do mundo (não para as mãos, que têm espaço próprio)
  for (const p of B.P) { if (p.kind !== 'add' && !mapa.has(p.F)) { soltas.push(p); continue; } grupos[osso(p, k, O, mapa)].push(p); }
  const partes = {}, tr = []; let tri = 0;
  for (const n in grupos) {
    const b = O[n], P = b.mao ? grupos[n] : grupos[n].concat(soltas); if (!P.some(p => p.kind === 'add')) continue;
    const res = b.mao ? N.mao : n === 'head' ? N.cab : N.res, G = bake(P, res), m = meshCubos(G, { jit: n === 'head' ? N.jitCab : N.jit, cru: true }), E = espaco(b);
    const nv = m.pos.length / 3, pos = new Float32Array(m.pos), nor = new Int8Array(m.nor.length), col = new Uint16Array(m.col.length), MP = m.pos, MN = m.nor, MC = m.col;
    for (let j = 0; j < nv * 3; j += 3) {
      let X = MN[j], Y = MN[j + 1], Z = MN[j + 2];
      if (E) { const e = E.m, t = E.t, px = MP[j], py = MP[j + 1], pz = MP[j + 2];
        pos[j] = e[0] * px + e[1] * py + e[2] * pz + t[0]; pos[j + 1] = e[3] * px + e[4] * py + e[5] * pz + t[1]; pos[j + 2] = e[6] * px + e[7] * py + e[8] * pz + t[2];
        const a = e[0] * X + e[1] * Y + e[2] * Z, c = (e[3] * X + e[4] * Y + e[5] * Z) * E.ny, d = e[6] * X + e[7] * Y + e[8] * Z, l = Math.hypot(a, c, d) || 1; X = a / l; Y = c / l; Z = d / l; }
      nor[j] = Math.round(X * 127); nor[j + 1] = Math.round(Y * 127); nor[j + 2] = Math.round(Z * 127);
      for (let q = 0; q < 3; q++) { const c = MC[j + q]; col[j + q] = c >= 1 ? 65535 : c <= 0 ? 0 : Math.round(c * 65535); }
    }
    const ind = nv > 65535 ? new Uint32Array(m.ind) : new Uint16Array(m.ind);
    partes[n] = { pos, nor, col, ind }; tr.push(pos.buffer, nor.buffer, col.buffer, ind.buffer); tri += ind.length / 3;
  }
  const r = a => a.map(x => Math.round(x * 1e4) / 1e4);
  const rig = { head: r(O.head.p), legL: r(O.legL.p), legR: r(O.legR.p), shL: r(O.shL.p), shR: r(O.shR.p) };
  return { partes, rig, tri, ms: Math.round((typeof performance !== 'undefined' ? performance : Date).now() - t0), tr };
}

// ================= código compacto (rede e perfil) =================
// 'pe3.ol0.ca4...' : cada campo = 2 letras + índice (base 36) na ordem das chaves de OPCOES (só acrescentar opções no FIM das
// listas, nunca reordenar: o índice é o que viaja). ro = acessórios de rosto (índices com '+'); k0..k8 = cor por peça:
// 'x' + hex de 6, 'c' + índice da camuflagem, ou só 'c' (= a camuflagem geral). Valor fora da lista é ignorado (fica o padrão).
export const CAMPOS = [['pe', 'pele'], ['ol', 'olho'], ['ca', 'cabelo'], ['cc', 'corCabelo'], ['ba', 'barba'], ['ch', 'chapeu'], ['tr', 'tronco'], ['cl', 'calca'], ['cd', 'calcado'], ['co', 'colete'], ['lu', 'luvas'], ['mo', 'mochila'], ['cm', 'camo']];
export const PECAS_COR = ['tronco', 'tronco2', 'calca', 'calcado', 'calcado2', 'colete', 'luvas', 'mochila', 'chapeu'];
export const COD_MAX = 240, COD_RE = /^[a-z0-9.+]{0,240}$/;
const chaves = c => Object.keys(OPCOES[c]);
export function codificar(cfg0) {
  const cfg = normalizar(cfg0), out = [];
  for (const [k, c] of CAMPOS) { const i = chaves(c).indexOf(cfg[c]); if (i >= 0) out.push(k + i.toString(36)); }
  const ro = cfg.rosto.map(r => chaves('rosto').indexOf(r)).filter(i => i > 0).slice(0, 3); if (ro.length) out.push('ro' + ro.map(i => i.toString(36)).join('+'));
  PECAS_COR.forEach((p, n) => { const x = cfg.cores[p]; if (x == null) return; let v = null;
    if (x === 'camo') v = 'c'; else if (typeof x === 'string' && /^#[0-9a-f]{6}$/i.test(x)) v = 'x' + x.slice(1).toLowerCase(); else { const i = chaves('camo').indexOf(x); if (i >= 0) v = 'c' + i.toString(36); }
    if (v) out.push('k' + n + v); });
  return out.join('.');
}
export function decodificar(s) {
  const cfg = { cores: {} }; if (typeof s !== 'string' || !COD_RE.test(s)) return normalizar(cfg);
  for (const t of s.split('.').slice(0, 40)) {
    const k = t.slice(0, 2), v = t.slice(2), C = CAMPOS.find(c => c[0] === k);
    if (C) { const i = parseInt(v, 36), L = chaves(C[1]); if (/^[0-9a-z]{1,2}$/.test(v) && i >= 0 && i < L.length) cfg[C[1]] = L[i]; continue; }
    if (k === 'ro') { cfg.rosto = [...new Set(v.split('+').slice(0, 3).map(x => chaves('rosto')[parseInt(x, 36)]).filter(x => x && x !== 'nenhum'))]; continue; }
    if (t[0] === 'k' && /^[0-9]$/.test(t[1])) { const p = PECAS_COR[+t[1]], w = t.slice(2); if (!p) continue;
      if (w === 'c') cfg.cores[p] = 'camo'; else if (/^x[0-9a-f]{6}$/.test(w)) cfg.cores[p] = '#' + w.slice(1); else if (/^c[0-9a-z]{1,2}$/.test(w)) { const n = chaves('camo')[parseInt(w.slice(1), 36)]; if (n) cfg.cores[p] = n; } }
  }
  return normalizar(cfg);
}
// sorteio (bots, botão Aleatório): presets de vez em quando, o resto peça por peça com pesos (chapéu e colete são comuns)
export function aleatorio(seed) {
  const r = rng(seed >>> 0 || 1), um = l => l[Math.floor(r() * l.length) % l.length], ks = c => chaves(c);
  if (r() < .2) { const p = PRESETS[um(Object.keys(PRESETS))]; return normalizar({ ...p, cores: { ...(p.cores || {}) }, rosto: [...(p.rosto || [])] }); }
  const cfg = { cores: {} };
  for (const c of ['pele', 'olho', 'cabelo', 'barba', 'tronco', 'calca', 'calcado', 'camo']) cfg[c] = um(ks(c));
  cfg.corCabelo = r() < .85 ? um(['preto', 'castanho_escuro', 'castanho', 'castanho_claro', 'loiro', 'ruivo', 'grisalho']) : um(ks('corCabelo'));
  cfg.chapeu = r() < .3 ? 'nenhum' : um(ks('chapeu')); cfg.colete = r() < .3 ? 'nenhum' : um(ks('colete'));
  cfg.luvas = r() < .5 ? 'nenhuma' : um(ks('luvas')); cfg.mochila = r() < .55 ? 'nenhuma' : um(ks('mochila'));
  cfg.rosto = r() < .6 ? [] : [um(ks('rosto').filter(x => x !== 'nenhum'))];
  if (cfg.tronco === 'ghillie' || cfg.calca === 'ghillie') cfg.tronco = cfg.calca = 'ghillie';
  return normalizar(cfg);
}
export function hashTxt(t) { let h = 2166136261; for (const ch of String(t)) h = Math.imul(h ^ ch.codePointAt(0), 16777619); return h >>> 0; }
export { CAMOS };
