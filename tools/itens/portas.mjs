// zumbi-v2 (Etapa 3): conferência de todas as portas dos mapas zumbi.
// Para cada porta: (1) dos dois lados, o ponto livre mais perto onde o jogador fica de pé e a distância até o centro (tem de dar
// para usar o F: menos que o alcance do zInteract) e (2) depois de abrir todas as portas, as malhas visíveis perto do vão
// (procura o "quadrado laranja": peça que sobra na frente da porta aberta).
// Uso: node tools/itens/portas.mjs [--mapas vila,sanatorio] [--pagina <html>]
import { abrirJogo, criarSala, noJogo } from '../../tests/_e02.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
if (arg('pagina')) process.env.PAGINA = arg('pagina');
const mapas = arg('mapas', 'vila,sanatorio').split(',');
let falhas = 0;
for (const mapa of mapas) {
  const { page, fechar, erros } = await abrirJogo();
  await criarSala(page, { mode: 'zombies', map: mapa });
  const r = await noJogo(page, (T) => {
    const out = [], ZD = T.ZD, REACH = 2.6, PR = .32;
    for (const d of ZD.doors) {
      const ang = d.rot != null ? d.rot : d.axis === 'z' ? Math.PI / 2 : 0; // normal da porta: perpendicular ao vão
      const nx = Math.sin(ang), nz = Math.cos(ang), lados = [];
      for (const s of [-1, 1]) {
        let best = null;
        for (let t = .3; t <= 4.01 && !best; t += .05) for (const off of [0, .4, -.4, .8, -.8]) {
          const x = d.x + s * nx * t + nz * off, z = d.z + s * nz * t - nx * off;
          if (T.footFreeR(x, z, PR)) { best = { t: +Math.hypot(x - d.x, z - d.z).toFixed(2), x: +x.toFixed(2), z: +z.toFixed(2) }; break; }
        }
        lados.push(best);
      }
      out.push({ id: d.id, kind: d.kind || 'porta', atalho: !!d.atalho, rot: d.rot, axis: d.axis, x: d.x, z: d.z, lados, ok: lados.every(l => l && l.t <= REACH - .1) });
    }
    return out;
  });
  // abre todas as portas e procura peças visíveis no vão
  const sobra = await noJogo(page, (T) => {
    for (const d of T.ZD.doors) { T.Z.doors.add(d.id); T.onMsg({ t: 'zdoor', id: d.id }); }
    T.sim(4);
    const out = [], v = new T.V3();
    for (const d of T.ZD.doors) {
      const perto = [];
      T.scene.traverse(o => {
        if (!o.isMesh || !o.visible) return; let p = o; while (p) { if (!p.visible) return; p = p.parent; }
        o.getWorldPosition(v); if (Math.hypot(v.x - d.x, v.z - d.z) > 2.2 || v.y > 3.5) return;
        const m = Array.isArray(o.material) ? o.material[0] : o.material, c = m?.color, e = m?.emissive;
        const lar = c && c.r > .6 && c.g > .25 && c.g < .7 && c.b < .35;
        const el = e && e.r > .3 && e.g > .1 && e.b < .3 && e.r > e.b * 2;
        if (lar || el) perto.push({ nome: o.name || o.parent?.name || '', tipo: o.geometry?.type, cor: c?.getHexString(), emis: e?.getHexString(), y: +v.y.toFixed(2), d: +Math.hypot(v.x - d.x, v.z - d.z).toFixed(2), op: m.opacity, transp: m.transparent });
      });
      if (perto.length) out.push({ id: d.id, perto });
    }
    return out;
  });
  const ruins = r.filter(p => !p.ok);
  console.log(`== ${mapa}: ${r.length} portas, ${ruins.length} sem lugar para usar o F dos dois lados`);
  for (const p of ruins) console.log('  ', JSON.stringify(p));
  console.log(`   peças laranja/brilhando perto do vão depois de aberta: ${sobra.length} portas`);
  for (const s of sobra.slice(0, 40)) console.log('  ', JSON.stringify(s));
  console.log('   erros de página:', erros.length);
  falhas += ruins.length + sobra.length + erros.length;
  await fechar();
}
process.exitCode = falhas ? 1 : 0;
