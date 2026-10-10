// Resumo de um ou mais resultados do bench-campanha.mjs (modo balanço) em tabelas Markdown (O3-D15).
// Uso: node tools/bench/resumo-campanha.mjs a.json [b.json ...] [--rodadas 1]
// Agrupa por página, etapa (e "clássico" na referência), dificuldade e jogadores: média (e desvio) das repetições.
// Colunas: repetições, tempo de combate (s de jogo, só as rodadas), tempo total (rodadas + intervalos + pré-rodada), luta do chefe,
// quedas do time por rodada (fração das rodadas em que o time inteiro caiu), dano recebido por jogador e por rodada, tiros por abate,
// pontos no fim. Com --rodadas 1, também a duração média de cada rodada.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2), arqs = args.filter(a => a.endsWith('.json')), porRodada = args.includes('--rodadas');
const G = new Map();
for (const f of arqs) {
  const o = JSON.parse(fs.readFileSync(f, 'utf8')), pag = path.basename(o.pagina || f).replace(/\.html$/, '');
  for (const m of o.medidas || []) {
    if (m.falha) { console.error('falha', f, m.etapa, m.falha); continue; }
    const k = [pag, m.etapa + (m.ref ? ` (${m.ref}${m.mapa ? ' ' + m.mapa + ' r' + (m.rodadas[0]?.rodada ?? '?') : ''})` : ''), m.dif, m.np].join('|');
    if (!G.has(k)) G.set(k, []); G.get(k).push(m);
  }
}
const med = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const dp = a => { if (a.length < 2) return 0; const m = med(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const f0 = x => Number.isFinite(x) ? Math.round(x).toString() : '–', f2 = x => Number.isFinite(x) ? x.toFixed(2).replace('.', ',') : '–';
const mdp = a => a.length ? `${f0(med(a))} ± ${f0(dp(a))}` : '–';
console.log('| página | etapa | dif | jog | rep | combate (s) | total (s) | chefe (s) | queda do time / rodada | dano / jog / rodada | tiros / abate | pontos no fim |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|');
const linhas = [...G.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt'));
for (const [k, L] of linhas) {
  const [pag, et, dif, np] = k.split('|'), nr = L.map(m => m.rodadas.length || 1);
  const ch = L.map(m => m.chefe?.durS).filter(Number.isFinite);
  const qt = L.map((m, i) => m.rodadas.filter(r => r.time).length / nr[i]);
  const dn = L.map((m, i) => m.dano / (+np) / nr[i]);
  const ta = L.map(m => m.abates ? m.tiros / m.abates : NaN).filter(Number.isFinite);
  const pt = L.map(m => med(m.pts));
  console.log(`| ${pag} | ${et} | ${dif} | ${np} | ${L.length} | ${mdp(L.map(m => m.combateS))} | ${mdp(L.map(m => m.tempoS))} | ${mdp(ch)} | ${f2(med(qt))} | ${f0(med(dn))} | ${f2(med(ta))} | ${f0(med(pt))} |`);
}
if (porRodada) {
  console.log('\n| página | etapa | dif | jog | rodada | evento | duração (s) | zumbis | vivos máx | dano / jog | queda do time |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const [k, L] of linhas) {
    const [pag, et, dif, np] = k.split('|'), R = new Map();
    for (const m of L) for (const r of m.rodadas) { if (!R.has(r.rodada)) R.set(r.rodada, []); R.get(r.rodada).push(r); }
    for (const [rod, rs] of [...R.entries()].sort((a, b) => a[0] - b[0]))
      console.log(`| ${pag} | ${et} | ${dif} | ${np} | ${rod} | ${[...new Set(rs.map(r => r.ev || (r.caes ? 'cães' : '')))].filter(Boolean).join(', ')} | ${mdp(rs.map(r => r.durS))} | ${f0(med(rs.map(r => r.n0)))} | ${f0(med(rs.map(r => r.vivosMax)))} | ${f0(med(rs.map(r => r.dano.reduce((a, b) => a + b, 0) / +np)))} | ${f2(med(rs.map(r => r.time ? 1 : 0)))} |`);
  }
}
