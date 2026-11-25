// Cabeça dos avatares: rosto, cabelos, barbas, chapéus e acessórios de rosto. Tudo no quadro da cabeça F (origem no topo do pescoço).
import { v, hx, mix, mul, vnoise, fbm, rng, pl } from './nucleo.js';
import { fab, liso, metal, couro, floral, camo, cor, xadrez } from './tex.js';

const C = [0, .125, -.012], R = [.082, .098, .1]; // crânio
const LINHA = { normal: [0, .148, .05], recuada: [0, .175, .03], baixa: [0, .128, .06] };
const sp = (th, ph, k = 1, kk = 0) => [C[0] + Math.sin(ph) * Math.sin(th) * (R[0] * k + kk), C[1] + Math.cos(ph) * (R[1] * k + kk), C[2] + Math.sin(ph) * Math.cos(th) * (R[2] * k + kk)];

export const pele = c => { const P = hx(c), Rr = mix(P, [.75, .3, .28], .25); return (x, y, z) => mix(P, Rr, Math.max(0, vnoise(x * 18, y * 18, z * 18) - .55) * .9); };

// ---------- rosto ----------
export function rosto(B, F, pr, c) {
  const SK = pele(c.pele), o = { reg: 'head', body: true, tag: 'rosto' }, ol = pr.olho, P = hx(c.pele);
  B.ell(F, C, R, null, SK, o);
  B.ell(F, [0, .14, .02], [.071, .062, .07], null, SK, o);
  B.box(F, [0, .072, .033], [.061, .045, .05], .03, null, SK, o);
  B.box(F, [0, .038, .038], [.054 * (pr.mandibula || 1), .028, .046], .027, null, SK, o);
  B.ell(F, [0, .022, .077], [.023, .019, .021], null, SK, o);
  B.ell(F, [0, .0215, .094], [.004, .006, .004], null, mul(P, .9), { kind: 'paint', on: ['rosto'] });
  for (const s of [1, -1]) {
    B.ell(F, [s * .045, .085, .066], [.023, .017, .021], null, SK, o); // maçã
    B.ell(F, [s * .084, .095, -.006], [.0115, .027, .017], [0, 0, s * .15], SK, o); // orelha
    B.ell(F, [s * .086, .072, -.003], [.0075, .0085, .0075], null, SK, o); // lóbulo
    B.ell(F, [s * .093, .097, -.004], [.006, .016, .009], null, mul(P, .62), { kind: 'paint', on: ['rosto'] });
    B.ell(F, [s * .091, .088, .006], [.004, .006, .004], null, SK, o); // trago
  }
  B.box(F, [0, .114, .082], [.054, .0095, .013], .008, null, SK, o); // arcada
  B.cone(F, [0, .108, .088], [0, .076, .103], .0085, .0115, SK, o); // dorso do nariz
  B.ell(F, [0, .071, .103], [.0112, .0095, .0105], null, SK, o); // ponta
  for (const s of [1, -1]) { B.ell(F, [s * .0115, .0685, .096], [.0078, .0072, .0082], null, SK, o); B.ell(F, [s * .0068, .0628, .0995], [.0042, .0026, .0055], null, mul(P, .38), { kind: 'paint', on: ['rosto'] }); }
  const L = mul(mix(P, [.6, .28, .26], .38), .93);
  B.ell(F, [0, .0528, .0925], [.0195, .0055, .0082], null, L, { ...o, bias: .001 }); B.ell(F, [0, .0432, .0905], [.0165, .0068, .0088], null, mul(L, 1.04), { ...o, bias: .001 });
  B.box(F, [0, .0483, .1], [.0178, .0013, .012], 0, null, mul(L, .45), { kind: 'paint', on: ['rosto', 'barba'] });
  for (const s of [1, -1]) B.ell(F, [s * .019, .0485, .093], [.0025, .0025, .006], null, mul(L, .6), { kind: 'paint', on: ['rosto'] });
  const sob = mul(hx(c.cabelo), .85), irisC = hx(c.olho);
  const iris = (x0) => (x, y, z, p) => { const l = p.loc(x, y, z), r = Math.hypot(l[0] - x0, l[1] - .0965) / (.0076 * Math.min(ol, 1.6)); return r < .42 ? [.03, .02, .02] : mul(irisC, r > .85 ? .55 : 1.05 - r * .3); };
  for (const s of [1, -1]) {
    const x0 = s * .031;
    B.ell(F, [x0, .097, .077], [.0122, .0102, .0115], null, '#e4ddd2', { tag: 'olho', bias: .002 });
    B.ell(F, [x0, .0965, .089], [.0076 * Math.min(ol, 1.6), .0079 * Math.min(ol, 1.6), .006], null, iris(x0), { kind: 'paint', on: ['olho'] });
    B.ell(F, [x0 + .0025, .099, .089], [.0016, .0016, .006], null, '#ffffff', { kind: 'paint', on: ['olho'] });
    B.ell(F, [x0, .1078, .0808], [.0152, .0054, .0112], [0, 0, -s * .1], SK, { ...o, bias: .003 }); // pálpebra superior
    B.ell(F, [x0, .0885, .0805], [.0138, .0038, .0092], null, SK, { ...o, bias: .003 }); // inferior
    B.box(F, [x0, .1031, .0895], [.0135, .0015, .012], 0, [0, 0, -s * .08], mul(hx(c.cabelo), .35), { kind: 'paint', on: ['rosto', 'olho'] }); // cílios
    B.box(F, [s * .0215, .1185, .092], [.0095, .0026, .012], 0, [0, 0, -s * .08], sob, { kind: 'paint', on: ['rosto'] }); // sobrancelha
    B.box(F, [s * .0405, .1188, .09], [.0105, .002, .012], 0, [0, 0, s * .22], sob, { kind: 'paint', on: ['rosto'] });
  }
}

// ---------- cabelos ----------
export const CABELOS = {
  careca: 'Careca', raspado: 'Raspado (máquina)', militar: 'Militar (high & tight)', curto: 'Curto', topete: 'Topete', moicano: 'Moicano', black_power: 'Black power',
  trancas_nago: 'Tranças nagô', dreads: 'Dreads', rabo: 'Rabo de cavalo', coque: 'Coque', longo_solto: 'Longo solto', franja: 'Franja', undercut: 'Undercut',
  ondulado: 'Ondulado', cacheado_curto: 'Cacheado curto', cacheado_longo: 'Cacheado longo', mullet: 'Mullet', calvicie: 'Calvície', espetado: 'Espetado', lateral: 'Penteado lateral', tigela: 'Tigelinha',
};
export const CORES_CABELO = { preto: '#141010', castanho_escuro: '#2e1f15', castanho: '#4d321f', castanho_claro: '#7a5434', loiro: '#b08a4e', platinado: '#d9cba2', ruivo: '#8e3e1c', acobreado: '#b4572a', grisalho: '#8a8580', branco: '#dcd9d2', azul: '#2a4f9a', rosa: '#c4507e', verde: '#3f7a3a' };
export function cabelo(B, F, tipo, c, chap) {
  const H = hx(c.cabelo), o = { tag: 'cabelo' }, r = rng(tipo.length * 31 + 5);
  const Hf = (x, y, z) => mul(H, .8 + .34 * vnoise(x * 240, y * 70, z * 240));
  const Hc = (x, y, z) => mul(H, .72 + .45 * fbm(x * 160, y * 160, z * 160, 2));
  const fade = (k = .5) => { const S = hx(c.pele); return (x, y, z) => mul(mix(S, H, k), .95 + .1 * vnoise(x * 300, y * 300, z * 300)); };
  const cap = (th, linha = 'normal', nuca = .072, extra = [], col = Hf) => B.ell(F, C, R, null, col, { ...o, inf: th, clip: [pl(F, LINHA[linha], [0, -.75, .66]), pl(F, [0, nuca, 0], [0, -1, 0]), ...extra] });
  const cost = (len = .016, col = fade(.75)) => { for (const s of [1, -1]) B.box(F, [s * .078, .09 - (len - .016) / 2, .027], [.005, len, .0065], .004, null, col, o); };
  const vol = (p, rr, rot, col = Hf, ex = {}) => B.ell(F, p, rr, rot, col, { ...o, ...ex });
  const cachos = (n, rmin, rmax, faixa, col = Hc) => { for (let i = 0; i < n; i++) { const th = r() * Math.PI * 2, ph = faixa[0] + r() * (faixa[1] - faixa[0]); if (Math.abs(Math.sin(th / 2)) < .38 && ph > .55) continue; const rr = rmin + r() * (rmax - rmin); vol(sp(th, ph, 1, .004), [rr, rr, rr], null, col); } };
  const S1 = [1, -1];
  switch (tipo) {
    case 'careca': B.ell(F, [-.02, .2, .03], [.025, .012, .02], null, '#ffffff', { kind: 'paint', on: ['rosto'] }); B.P[B.P.length - 1].col = mul(hx(c.pele), 1.12); break;
    case 'raspado': cap(.0022, 'normal', .072, [], fade(.55)); break;
    case 'militar': cap(.0016, 'normal', .075, [], fade(.42)); cap(.005, 'normal', .072, [pl(F, [0, .186, 0], [0, -1, 0])]); break;
    case 'curto': cap(.006); cost(); if (!chap) vol([0, .19, .012], [.074, .05, .085], [-.2, 0, 0], Hf, { clip: [pl(F, [0, .17, 0], [0, -1, 0])] }); break;
    case 'topete': cap(.0045); cost(); if (!chap) { vol([0, .2, .002], [.072, .042, .085]); vol([0, .214, .062], [.058, .036, .048], [-.7, 0, 0]); vol([0, .228, .075], [.04, .02, .03], [-.9, 0, 0]); } break;
    case 'moicano': cap(.0012, 'normal', .075, [], fade(.35)); cap(.008, 'normal', .07, [pl(F, [.022, 0, 0], [1, 0, 0]), pl(F, [-.022, 0, 0], [-1, 0, 0])]);
      if (!chap) for (let i = 0; i < 8; i++) { const a = .75 - i * .32, n = v(0, Math.cos(a), Math.sin(a)), p0 = v(0, C[1] + n.y * R[1], C[2] + n.z * R[2]); const p1 = p0.clone().addScaledVector(n, .055 - Math.abs(i - 2.5) * .004).add(v(0, .01, -.02)); B.cone(F, p0, p1, .019, .004, Hf, o); }
      break;
    case 'black_power':
      if (chap) { cap(.008, 'normal', .07, [], Hc); cachos(40, .014, .018, [.1, 1.5]); break; }
      vol([0, .158, -.022], [.135, .128, .138], null, Hc, { clip: [pl(F, [0, .15, .072], [0, -.75, .66]), pl(F, [0, .085, 0], [0, -1, 0])] });
      for (let i = 0; i < 70; i++) { const th = r() * Math.PI * 2, ph = r() * 1.7; if (Math.abs(Math.sin(th / 2)) < .4 && ph > .62) continue; const p = [Math.sin(ph) * Math.sin(th) * .132, .158 + Math.cos(ph) * .125, -.022 + Math.sin(ph) * Math.cos(th) * .135]; if (p[1] < .09) continue; vol(p, [.024, .024, .024], null, Hc); }
      break;
    case 'trancas_nago': cap(.0028, 'normal', .07, [], mul(H, .7));
      for (const x of [-.064, -.043, -.021, 0, .021, .043, .064]) { const f = Math.sqrt(1 - (x / (R[0] + .004)) ** 2); for (let i = 0; i < 17; i++) { const a = 1.0 - i * .17, y = C[1] + Math.cos(a) * (R[1] * f + .003), z = C[2] + Math.sin(a) * (R[2] * f + .003); if (y < .075) break;
        if (Math.sin(a) > .5 && y < .148 + .9 * (z - .05)) continue; vol([x + (i & 1 ? .0018 : -.0018), y, z], [.0078, .0078, .0078], null, Hf); } }
      break;
    case 'dreads': cap(.006, 'normal', .07, [], Hc);
      for (let i = 0; i < 38; i++) { const th = (i / 38) * Math.PI * 2 + r() * .1, ph = .55 + r() * .75; if (Math.abs(Math.sin(th / 2)) < .3) continue;
        const p0 = v(...sp(th, ph, 1, .002)), out = v(Math.sin(th), 0, Math.cos(th)), L = chap ? .13 : .16 + r() * .05; const p1 = p0.clone().add(v(0, -L, 0)).addScaledVector(out, .035 + r() * .02); if (p1.z > .03) p1.z = .03;
        const m = p0.clone().lerp(p1, .5).addScaledVector(out, .008); B.cone(F, p0, m, .0105, .0095, Hc, o); B.cone(F, m, p1, .0095, .0072, Hc, o); }
      break;
    case 'rabo': cap(.0055, 'normal', .065); cost(.016); B.tor(F, [0, .112, -.118], .013, .0045, [1.2, 0, 0], '#202020', o);
      B.cone(F, [0, .11, -.125], [0, .03, -.15], .021, .016, Hf, o); B.cone(F, [0, .03, -.15], [0, -.04, -.148], .016, .007, Hf, o); break;
    case 'coque': cap(.0055, 'normal', .068); cost(.016); if (chap) { vol([0, .075, -.112], [.028, .026, .026]); break; }
      vol([0, .216, -.062], [.03, .027, .03], [.4, 0, 0], Hc); B.tor(F, [0, .199, -.058], .02, .004, [.4, 0, 0], '#202020', o); break;
    case 'longo_solto': cap(.007, 'normal', .06); if (!chap) vol([0, .19, .0], [.075, .045, .09], [-.2, 0, 0], Hf, { clip: [pl(F, [0, .17, 0], [0, -1, 0])] });
      vol([0, .045, -.062], [.096, .15, .066], null, Hf, { clip: [pl(F, [0, 0, -.005], [0, 0, 1])] });
      for (const s of S1) { vol([s * .088, .06, -.002], [.022, .12, .052], [0, 0, s * .06]); vol([s * .07, .05, .045], [.014, .085, .02], [0, 0, s * .05]); }
      break;
    case 'franja': cap(.006); cost(); if (!chap) vol([0, .19, .0], [.074, .05, .085], [-.2, 0, 0], Hf, { clip: [pl(F, [0, .17, 0], [0, -1, 0])] });
      vol([0, .153, .075], [.075, .034, .034], [.3, 0, 0], Hf, { clip: [pl(F, [0, .124, 0], [0, -1, 0])] }); break;
    case 'undercut': cap(.0011, 'normal', .075, [], fade(.38)); if (!chap) vol([0, .188, -.004], [.081, .058, .113], null, (x, y, z) => mul(H, .8 + .35 * vnoise(x * 300, y * 120, z * 40)), { clip: [pl(F, [0, .168, 0], [0, -1, 0])] }); else cap(.006, 'normal', .07, [pl(F, [0, .168, 0], [0, -1, 0])]); break;
    case 'ondulado': { const W = (x, y, z) => mul(H, .86 + .12 * Math.sin(y * 260 + vnoise(x * 40, y * 40, z * 40) * 6) + .1 * vnoise(x * 200, y * 200, z * 200)); cap(.009, 'normal', .055, [], W);
      for (const s of S1) vol([s * .086, .105, -.02], [.022, .06, .07], null, W); vol([0, .075, -.078], [.088, .085, .05], null, W); if (!chap) vol([0, .195, .01], [.078, .05, .09], [-.15, 0, 0], W, { clip: [pl(F, [0, .17, 0], [0, -1, 0])] }); break; }
    case 'cacheado_curto': cap(.006, 'normal', .07, [], mul(H, .75)); cachos(chap ? 40 : 90, .013, .018, [.0, 1.45]); break;
    case 'cacheado_longo': cap(.007, 'normal', .065, [], mul(H, .75)); cachos(chap ? 40 : 90, .014, .019, [.0, 1.45]);
      for (let i = 0; i < 110; i++) { const th = r() * Math.PI * 2; if (Math.abs(Math.sin(th / 2)) < .42) continue; const y = .13 - r() * .17, rad = .1 + r() * .015; const rr = .016 + r() * .006;
        vol([Math.sin(th) * rad * .95, y, -.015 + Math.cos(th) * rad], [rr, rr, rr], null, Hc); }
      break;
    case 'mullet': cap(.0045, 'normal', .074); cost(.024); if (!chap) vol([0, .19, .01], [.07, .04, .08], [-.2, 0, 0], Hf, { clip: [pl(F, [0, .17, 0], [0, -1, 0])] });
      vol([0, .03, -.085], [.072, .1, .045], [.15, 0, 0], Hf, { clip: [pl(F, [0, 0, -.035], [0, 0, 1])] }); for (const s of S1) vol([s * .062, .02, -.075], [.03, .07, .03], null, Hf); break;
    case 'calvicie': cap(.0045, 'recuada', .072, [pl(F, [0, .183, 0], [0, 1, 0])]); cost(); B.ell(F, [-.02, .2, .02], [.03, .014, .03], null, mul(hx(c.pele), 1.12), { kind: 'paint', on: ['rosto'] }); break;
    case 'espetado': cap(.006); cost();
      for (let i = 0; i < 26; i++) { const th = r() * Math.PI * 2, ph = r() * .95; const p0 = v(...sp(th, ph, 1, .003)), n = p0.clone().sub(v(...C)).normalize().add(v(0, .5, -.25)).normalize(); B.cone(F, p0, p0.clone().addScaledVector(n, chap ? .015 : .035 + r() * .02), .013, .003, Hf, o); }
      break;
    case 'lateral': cap(.0065); cost(); if (!chap) vol([-.014, .19, .01], [.076, .048, .09], [-.15, 0, .16], Hf, { clip: [pl(F, [0, .168, 0], [0, -1, 0])] });
      B.box(F, [.032, .2, .01], [.0022, .06, .1], 0, null, mix(hx(c.pele), H, .3), { kind: 'paint', on: ['cabelo'] }); break;
    case 'tigela': cap(.011, 'baixa', .1, [pl(F, [0, .12, 0], [0, -1, 0])]); if (!chap) vol([0, .19, -.01], [.08, .05, .095], null, Hf, { clip: [pl(F, [0, .17, 0], [0, -1, 0])] }); break;
  }
}

// ---------- barbas ----------
export const BARBAS = { nenhuma: 'Nenhuma', por_fazer: 'Por fazer', bigode: 'Bigode', bigodao: 'Bigodão', cavanhaque: 'Cavanhaque', van_dyke: 'Van Dyke', mosca: 'Mosca', queixo: 'Barba de queixo', costeleta: 'Costeletas', curta: 'Barba curta', cheia: 'Barba cheia', longa: 'Barba longa', lenhador: 'Lenhador' };
export function barba(B, F, tipo, c) {
  if (tipo === 'nenhuma') return;
  const H = hx(c.cabelo), Hf = (x, y, z) => mul(H, .78 + .32 * vnoise(x * 240, y * 160, z * 240)), o = { tag: 'barba' };
  const base = [pl(F, [0, .074, 0], [0, 1, 0]), pl(F, [0, 0, -.02], [0, 0, -1])], bochecha = pl(F, [0, .06, .085], [0, .6, .8]);
  const mand = (inf, ex = []) => B.box(F, [0, .038, .038], [.054, .028, .046], .027, null, Hf, { ...o, inf, clip: [...base, ...ex] });
  const baixo = (inf, ex = []) => B.ell(F, [0, .072, .033], [.064, .045, .05], null, Hf, { ...o, inf, clip: [...base, bochecha, ...ex] });
  const queixo = inf => B.ell(F, [0, .022, .078], [.027, .025, .024], null, Hf, { ...o, inf });
  const bigode = (w = .024, h = .0055, inf = 0) => B.box(F, [0, .061, .098], [w, h, .01], .005, null, Hf, { ...o, inf });
  switch (tipo) {
    case 'por_fazer': B.ell(F, [0, .045, .035], [.068, .052, .078], null, mix(hx(c.pele), H, .3), { kind: 'paint', on: ['rosto'], clip: base }); B.box(F, [0, .061, .098], [.024, .006, .012], 0, null, mix(hx(c.pele), H, .3), { kind: 'paint', on: ['rosto'] }); break;
    case 'bigode': bigode(); break;
    case 'bigodao': B.ell(F, [0, .0605, .097], [.03, .0095, .013], null, Hf, o); for (const s of [1, -1]) B.cone(F, [s * .026, .058, .095], [s * .038, .046, .088], .0075, .0035, Hf, o); break;
    case 'cavanhaque': bigode(); queixo(.004); for (const s of [1, -1]) B.cone(F, [s * .022, .058, .094], [s * .02, .035, .088], .0055, .0055, Hf, o); break;
    case 'van_dyke': bigode(.026, .006); B.cone(F, [0, .036, .088], [0, .0, .08], .014, .004, Hf, o); break;
    case 'mosca': B.ell(F, [0, .034, .092], [.0075, .009, .006], null, Hf, o); break;
    case 'queixo': mand(.0045, [pl(F, [0, .03, 0], [0, 1, 0])]); queixo(.004); break;
    case 'costeleta': for (const s of [1, -1]) mand(.006, [pl(F, [s * .034, 0, 0], [-s, 0, 0])]); for (const s of [1, -1]) B.box(F, [s * .079, .09, .02], [.007, .03, .014], .005, null, Hf, o); bigode(.026); break;
    case 'curta': mand(.0035); baixo(.0025); queixo(.003); bigode(); break;
    case 'cheia': mand(.0055); baixo(.005); queixo(.005); bigode(.025, .006); break;
    case 'longa': mand(.006); baixo(.005); queixo(.006); bigode(.026, .0065); B.ell(F, [0, -.015, .07], [.048, .06, .036], [-.25, 0, 0], Hf, o); B.cone(F, [0, -.03, .075], [0, -.09, .085], .03, .008, Hf, o); break;
    case 'lenhador': mand(.011); baixo(.008); queixo(.012); bigode(.028, .008, .002); B.ell(F, [0, .01, .06], [.062, .045, .05], null, Hf, o); break;
  }
  if (tipo !== 'por_fazer' && tipo !== 'mosca' && tipo !== 'bigode' && tipo !== 'bigodao' && tipo !== 'queixo') B.box(F, [0, .0483, .11], [.017, .0015, .02], 0, null, mul(H, .3), { kind: 'paint', on: ['barba'] });
}

// ---------- chapéus ----------
export const CHAPEUS = { nenhum: 'Sem chapéu', capacete_fast: 'Capacete FAST', capacete_nvg: 'Capacete + NVG', capacete_pasgt: 'Capacete PASGT', capacete_swat: 'Capacete SWAT', bone: 'Boné', bone_tras: 'Boné para trás', gorro: 'Gorro', boina: 'Boina', bandana: 'Bandana', chapeu_selva: 'Chapéu de selva', cowboy: 'Cowboy', balaclava: 'Balaclava', mascara_gas: 'Máscara de gás', fone: 'Abafador / fone', faixa: 'Faixa', capuz: 'Capuz', ushanka: 'Ushanka', quepe: 'Quepe' };
export const chapeuCobre = t => !['nenhum', 'fone', 'faixa', 'mascara_gas'].includes(t); // achata o volume do cabelo
export function chapeu(B, F, tipo, c, det) {
  const o = { tag: 'chapeu', layer: 1 }, cc = cor(c.chapeu), Pc = fab(cc, .1, 2);
  const fast = (col) => {
    B.ell(F, [0, .15, -.008], [.108, .1, .12], null, col, { ...o, clip: [pl(F, [0, .108, 0], [0, -1, 0]), pl(F, [0, .135, .06], [0, -.78, .62])] });
    for (const s of [1, -1]) { B.box(F, [s * .1, .15, -.01], [.009, .011, .06], .003, [0, s * .04, 0], '#3a3a36', o); for (let i = 0; i < 4; i++) B.box(F, [s * .109, .15, -.05 + i * .027], [.003, .008, .004], 0, null, '#1e1e1e', { kind: 'paint', on: ['chapeu'] });
      B.cyl(F, [s * .1, .097, .0], .036, .012, .006, [0, 0, Math.PI / 2], '#26282a', o); B.cyl(F, [s * .108, .097, .0], .028, .008, .004, [0, 0, Math.PI / 2], '#1b1c1e', o); B.tor(F, [s * .113, .097, 0], .02, .003, [0, 0, Math.PI / 2], '#3a3c3e', o);
      B.cone(F, [s * .075, .12, -.02], [s * .055, .03, .05], .0045, .0045, '#1c1c1c', o); }
    B.cone(F, [.1, .085, .02], [.035, .058, .1], .005, .004, '#1b1c1e', o); B.ell(F, [.032, .057, .102], [.007, .006, .008], null, '#222', o);
    B.box(F, [0, .195, .113], [.024, .02, .009], .004, [-.45, 0, 0], '#232527', o);
    B.box(F, [0, .17, -.124], [.035, .022, .01], .004, [.15, 0, 0], '#2a2a26', { kind: 'paint', on: ['chapeu'] }); // velcro
    B.box(F, [0, .225, -.04], [.028, .018, .01], .004, [.6, 0, 0], '#3a3d33', o); B.box(F, [-.06, .2, -.085], [.012, .02, .012], .004, [0, .5, 0], '#7b8a3a', o); // bateria e estrobo
  };
  switch (tipo) {
    case 'capacete_fast': fast(Pc); break;
    case 'capacete_nvg': fast(Pc); B.box(F, [0, .17, .14], [.03, .016, .02], .006, [-.2, 0, 0], '#1d1f21', o); B.box(F, [0, .135, .15], [.04, .012, .012], .004, null, '#1d1f21', o);
      for (const s of [1, -1]) { B.cyl(F, [s * .021, .108, .14], .014, .028, .004, [Math.PI / 2, 0, 0], '#18191b', o); B.cyl(F, [s * .021, .108, .17], .011, .003, 0, [Math.PI / 2, 0, 0], '#1f5a3a', { kind: 'paint', on: ['chapeu'] }); } break;
    case 'capacete_swat': fast(liso('#141516')); B.ell(F, [0, .165, .0], [.114, .03, .128], null, '#2a3440', { ...o, clip: [pl(F, [0, 0, .07], [0, 0, -1])] }); break;
    case 'capacete_pasgt': B.ell(F, [0, .128, -.012], [.12, .114, .132], null, Pc, { ...o, clip: [pl(F, [0, .078, 0], [0, -1, 0]), pl(F, [0, .155, .07], [0, -.85, .53])] });
      B.ell(F, [0, .17, -.012], [.124, .012, .134], null, '#2b2b25', { ...o, clip: [pl(F, [0, .155, .07], [0, -.85, .53])] });
      for (let i = 0; i < 6; i++) B.box(F, [Math.sin(i) * .1, .18, Math.cos(i) * .11], [.012, .01, .004], .0, [0, i, 0], '#4a5a2a', o);
      for (const s of [1, -1]) B.cone(F, [s * .1, .1, -.01], [s * .055, .025, .05], .004, .004, '#2a2a22', o); break;
    case 'bone': case 'bone_tras': { const tr = tipo === 'bone_tras' ? Math.PI : 0;
      B.ell(F, [0, .152, -.004], [.092, .085, .104], null, Pc, { ...o, clip: [pl(F, [0, .135, 0], [0, -1, 0])] });
      for (let i = 0; i < 6; i++) B.box(F, [Math.sin(i * 1.047) * .06, .2, Math.cos(i * 1.047) * .07], [.0018, .05, .0018], 0, [0, i * 1.047, 0], mul(hx(typeof cc === 'string' ? cc : '#555'), .7), { kind: 'paint', on: ['chapeu'] });
      const ry = tr; B.box(F, [Math.sin(ry) * .118, .14, Math.cos(ry) * .118], [.075, .0045, .052], .0045, [-.08, ry, 0], fab(cc, .06), o);
      B.ell(F, [0, .238, -.004], [.009, .005, .009], null, mul(hx(typeof cc === 'string' ? cc : '#555'), .8), o);
      if (!tr) B.box(F, [0, .19, .098], [.03, .02, .02], 0, [-.4, 0, 0], c.logo || '#d8d2c4', { kind: 'paint', on: ['chapeu'] });
      break; }
    case 'gorro': { const rib = (x, y, z, p) => { const l = p.loc(x, y, z); return mul(hx(typeof cc === 'string' ? cc : '#3a3f45'), .8 + .2 * (Math.sin(Math.atan2(l[0], l[2]) * 70) > 0)); };
      B.ell(F, [0, .158, -.01], [.093, .105, .108], null, rib, { ...o, clip: [pl(F, [0, .11, 0], [0, -1, 0])] });
      B.ell(F, [0, .128, -.01], [.094, .03, .109], null, rib, { ...o, inf: .008, clip: [pl(F, [0, .11, 0], [0, -1, 0])] }); break; }
    case 'boina': B.ell(F, [-.022, .196, .0], [.112, .036, .108], [0, 0, .2], Pc, o); B.tor(F, [0, .165, -.008], .086, .0095, [0, 0, .06], '#2a1a14', o); B.ell(F, [-.035, .2, .098], [.015, .019, .02], null, '#c9a646', { kind: 'paint', on: ['chapeu'] }); break;
    case 'bandana': { const pa = floral(typeof cc === 'string' ? cc : '#8a1c1c', '#e8e2d6', '#111'); B.ell(F, C, R, null, pa, { ...o, inf: .006, clip: [pl(F, [0, .128, 0], [0, -1, 0]), pl(F, [0, .135, .06], [0, -.7, .7])] });
      B.ell(F, [0, .12, -.112], [.018, .014, .014], null, pa, o); for (const s of [1, -1]) B.cone(F, [s * .008, .115, -.115], [s * .03, .06, -.135], .012, .006, pa, o); break; }
    case 'chapeu_selva': B.cyl(F, [0, .205, -.01], .097, .045, .02, null, Pc, o); B.ell(F, [0, .165, -.01], [.175, .009, .175], [.06, 0, .04], Pc, o); B.cyl(F, [0, .177, -.01], .1, .008, .002, null, mul(hx(typeof cc === 'string' ? cc : '#4b5235'), .7), o);
      for (let i = 0; i < 8; i++) B.box(F, [Math.sin(i * .785) * .101, .178, -.01 + Math.cos(i * .785) * .101], [.006, .01, .003], 0, [0, i * .785, 0], '#2a2a20', o); break;
    case 'cowboy': { const cw = couro(typeof cc === 'string' ? cc : '#6b4a2b'); B.ell(F, [0, .215, -.01], [.083, .085, .1], null, cw, { ...o, clip: [pl(F, [0, .16, 0], [0, -1, 0])] });
      B.ell(F, [0, .3, -.01], [.02, .03, .07], null, cw, { kind: 'cut' }); B.ell(F, [0, .165, -.01], [.16, .009, .15], null, cw, o);
      for (const s of [1, -1]) B.ell(F, [s * .14, .185, -.01], [.04, .01, .15], [0, 0, -s * .7], cw, o); B.cyl(F, [0, .18, -.01], .087, .012, .002, null, '#2a1a10', o); break; }
    case 'balaclava': B.wear(['head'], .006, fab('#1b1b1c', .08, 2), { tag: 'bala', layer: 1 });
      B.box(F, [0, .099, .09], [.056, .016, .04], 0, null, pele2(c), { kind: 'paint', on: ['bala'] });
      for (const s of [1, -1]) { B.ell(F, [s * .031, .097, .092], [.0105, .0085, .03], null, '#e2dbd0', { kind: 'paint', on: ['bala'] }); B.ell(F, [s * .031, .0965, .1], [.0058, .0058, .02], null, c.olho, { kind: 'paint', on: ['bala'] }); }
      break;
    case 'mascara_gas': { const bo = liso('#1f2120', .1);
      B.ell(F, [0, .075, .062], [.074, .082, .058], null, bo, { ...o, clip: [pl(F, [0, 0, .02], [0, 0, -1])] });
      for (const s of [1, -1]) { B.cyl(F, [s * .031, .1, .113], .021, .006, .002, [Math.PI / 2, 0, 0], '#2b2b2b', o); B.cyl(F, [s * .031, .1, .119], .016, .002, 0, [Math.PI / 2, 0, 0], (x, y) => mix(hx('#1d3340'), [.7, .8, .85], Math.max(0, Math.sin(y * 300)) * .25), o); }
      B.cyl(F, [.035, .03, .118], .026, .022, .006, [Math.PI / 2 - .4, -.45, 0], liso('#4d5236'), o); B.cyl(F, [0, .05, .125], .013, .012, .004, [Math.PI / 2, 0, 0], '#2b2b2b', o);
      for (const a of [.2, .7]) B.tor(F, [0, .13, -.01], .098, .006, [a, 0, 0], '#1a1a1a', { ...o, clip: [pl(F, [0, 0, .04], [0, 0, 1])] }); break; }
    case 'fone': B.tor(F, [0, .12, -.005], .102, .008, [Math.PI / 2, 0, 0], '#2a2b2c', { ...o, clip: [pl(F, [0, .1, 0], [0, -1, 0])] });
      for (const s of [1, -1]) { B.cyl(F, [s * .1, .095, -.005], .04, .02, .008, [0, 0, Math.PI / 2], liso('#4a5036'), o); B.tor(F, [s * .088, .095, -.005], .03, .006, [0, 0, Math.PI / 2], '#1a1a1a', o); } break;
    case 'faixa': { const fx = fab(typeof cc === 'string' ? cc : '#7a1a1a', .2); B.ell(F, [0, .155, -.012], [.086, .015, .104], null, fx, o); B.ell(F, [0, .155, -.115], [.012, .012, .01], null, fx, o);
      for (const s of [1, -1]) B.cone(F, [s * .006, .152, -.118], [s * .02, .07, -.14], .009, .006, fx, o); break; }
    case 'capuz': { const cp = fab(cc, .25); B.ell(F, [0, .125, -.03], [.115, .135, .132], null, cp, { ...o, clip: [pl(F, [0, .12, .052], [0, .2, 1])] });
      B.ell(F, [0, .125, -.03], [.12, .14, .136], null, mul(hx(typeof cc === 'string' ? cc : '#4a4f57'), .82), { ...o, clip: [pl(F, [0, .12, .056], [0, .2, 1]), pl(F, [0, .12, .036], [0, -.2, -1])] });
      B.ell(F, [0, -.01, -.05], [.12, .07, .1], null, cp, o); break; }
    case 'ushanka': { const pe = (x, y, z) => mul(hx('#6b5440'), .75 + .4 * fbm(x * 220, y * 220, z * 220, 2)); B.ell(F, [0, .19, -.01], [.1, .08, .113], null, couro('#3a2e24'), o);
      B.box(F, [0, .2, .1], [.092, .036, .02], .015, [-.25, 0, 0], pe, o); B.ell(F, [0, .155, -.01], [.104, .03, .117], null, pe, o);
      for (const s of [1, -1]) B.ell(F, [s * .1, .1, -.012], [.026, .065, .052], null, pe, o); B.ell(F, [0, .12, -.11], [.07, .04, .022], null, pe, o); break; }
    case 'quepe': B.cyl(F, [0, .158, -.012], .093, .024, .004, null, '#151515', o); B.ell(F, [0, .19, -.002], [.112, .03, .124], null, fab(typeof cc === 'string' ? cc : '#1f2638', .06), o);
      B.box(F, [0, .152, .1], [.068, .004, .034], .004, [.12, 0, 0], liso('#0c0c0c', .3), o); B.ell(F, [0, .175, .098], [.012, .014, .02], null, '#c9a646', { kind: 'paint', on: ['chapeu'] }); B.box(F, [0, .148, .095], [.06, .0035, .01], 0, null, '#b89a3c', { kind: 'paint', on: ['chapeu'] }); break;
  }
}
const pele2 = c => pele(c.pele);

// ---------- acessórios de rosto ----------
export const ROSTOS = { nenhum: 'Nada', aviador: 'Óculos aviador', tatico: 'Óculos tático', sol: 'Óculos de sol', grau: 'Óculos de grau', mascara: 'Máscara cirúrgica', pintura: 'Pintura de guerra', cicatriz: 'Cicatriz', tapa_olho: 'Tapa-olho', bandana_rosto: 'Bandana no rosto', shemagh: 'Shemagh', charuto: 'Charuto' };
export function acessorio(B, F, tipo, c) {
  const o = { tag: 'oculos', layer: 1 }, lente = (a, b) => (x, y) => mix(hx(a), hx(b), Math.min(1, Math.max(0, (.105 - y) * 40)));
  const hastes = (col, y = .1) => { for (const s of [1, -1]) B.cone(F, [s * .052, y, .093], [s * .086, y + .003, .0], .0022, .0022, col, o); };
  switch (tipo) {
    case 'aviador': for (const s of [1, -1]) { B.ell(F, [s * .032, .093, .104], [.019, .016, .0035], [0, 0, s * .12], lente('#2b2218', '#7a5a38'), o); B.tor(F, [s * .032, .093, .104], .0175, .0017, [Math.PI / 2, 0, 0], '#c8a650', { ...o, bias: .002 }); }
      B.box(F, [0, .106, .104], [.014, .0015, .002], 0, null, '#c8a650', o); B.box(F, [0, .1, .107], [.01, .0015, .002], 0, null, '#c8a650', o); hastes('#c8a650'); break;
    case 'tatico': B.ell(F, [0, .097, .068], [.072, .02, .045], null, lente('#14181c', '#3a4650'), { ...o, clip: [pl(F, [0, 0, .088], [0, 0, -1])] }); B.box(F, [0, .116, .105], [.05, .003, .004], .002, null, '#111', o); hastes('#111', .102); break;
    case 'sol': for (const s of [1, -1]) { B.box(F, [s * .032, .096, .103], [.02, .0145, .003], .006, null, '#111', o); B.box(F, [s * .032, .095, .106], [.016, .011, .004], 0, null, lente('#0e1216', '#25323c'), { kind: 'paint', on: ['oculos'] }); }
      B.box(F, [0, .1, .104], [.008, .003, .003], .001, null, '#111', o); hastes('#111'); break;
    case 'grau': for (const s of [1, -1]) B.tor(F, [s * .032, .096, .102], .0155, .0019, [Math.PI / 2, 0, 0], '#5a3a22', o); B.box(F, [0, .099, .103], [.008, .0015, .002], 0, null, '#5a3a22', o); hastes('#5a3a22'); break;
    case 'mascara': { const m = listras('#a9c8dc', '#93b5cc', .012); B.ell(F, [0, .058, .062], [.062, .044, .05], null, m, { ...o, clip: [pl(F, [0, 0, .04], [0, 0, -1]), pl(F, [0, .088, 0], [0, 1, 0])] }); for (const s of [1, -1]) B.cone(F, [s * .06, .08, .045], [s * .085, .09, .0], .0018, .0018, '#e8e8e8', o); break; }
    case 'pintura': for (const s of [1, -1]) for (let i = 0; i < 3; i++) B.box(F, [s * (.036 + i * .004), .08 - i * .009, .09], [.022, .0032, .03], 0, [0, 0, -s * .25], i === 1 ? '#3c4a26' : '#121212', { kind: 'paint', on: ['rosto', 'barba'] });
      B.box(F, [0, .13, .095], [.05, .004, .03], 0, null, '#3c4a26', { kind: 'paint', on: ['rosto'] }); break;
    case 'cicatriz': B.box(F, [-.033, .095, .09], [.0022, .034, .03], 0, [0, 0, .35], '#8a4a40', { kind: 'paint', on: ['rosto', 'olho'] });
      for (let i = -2; i <= 2; i++) B.box(F, [-.033 + i * .005, .095 + i * .012, .09], [.006, .001, .03], 0, [0, 0, .35], '#5a2a24', { kind: 'paint', on: ['rosto'] }); break;
    case 'tapa_olho': B.ell(F, [-.031, .097, .093], [.017, .014, .006], null, '#151515', o); const pts = [[-.031, .097, .095], [-.08, .12, .03], [-.06, .15, -.09], [0, .16, -.112], [.06, .15, -.09], [.083, .12, .0], [.06, .115, .07]]; for (let i = 0; i < pts.length - 1; i++) B.cone(F, pts[i], pts[i + 1], .0022, .0022, '#151515', o); break;
    case 'bandana_rosto': { const pa = floral('#8a1c1c', '#e8e2d6', '#111'); B.ell(F, [0, .052, .045], [.07, .052, .062], null, pa, { ...o, clip: [pl(F, [0, .078, 0], [0, 1, 0])] }); B.box(F, [0, .012, .085], [.03, .02, .012], .008, [-.3, 0, Math.PI / 4], pa, o); break; }
    case 'shemagh': { const L = ['#e4dfd2', '#1f1f1f'], xz = (x, y, z, p) => { const l = p.loc(x, y, z); return hx((Math.floor((l[0] + l[1] + 1) / .014) & 1) ^ (Math.floor((l[0] - l[1] + 1) / .014) & 1) ? L[0] : L[1]); };
      B.ell(F, [0, .055, .03], [.075, .058, .07], null, xz, { ...o, clip: [pl(F, [0, .082, 0], [0, 1, 0])] }); B.ell(F, [0, -.01, .0], [.085, .045, .085], null, xz, o); break; }
    case 'charuto': B.cyl(F, [.022, .045, .11], .0045, .022, .001, [Math.PI / 2 - .3, .5, 0], '#5a3a22', o); B.cyl(F, [.032, .039, .128], .0047, .003, .001, [Math.PI / 2 - .3, .5, 0], '#c94a1a', o); break;
  }
}
const listras = (a, b, larg) => (x, y) => ((Math.floor((y + 9) / larg)) & 1) ? hx(b) : hx(a);
