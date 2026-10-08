// Tabela do bench limpo: média dos 2 pares, antes (cbbeead) x depois (HEAD).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const D = fileURLToPath(new URL('./', import.meta.url));
const ler = f => fs.existsSync(D + f) ? JSON.parse(fs.readFileSync(D + f, 'utf8')).medidas : [];
const med = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN;
const f1 = x => isNaN(x) ? '-' : x.toFixed(1);
const linhas = [];
for (const [tipo, gfxs] of [['n', ['medio', 'baixo', 'alto']], ['h', ['medio', 'baixo']]]) {
  linhas.push(`\n### ${tipo === 'n' ? 'Rodadas normais (r1, r10)' : 'Horda (r25, teto de zumbis, atirando)'}\n`);
  linhas.push('| gráfico | mapa | rodada | FPS antes → depois | 1% low antes → depois | quadro mediano ms | p90 ms | draws | memória vídeo (geo/tex) | carga (montagem+aquec.) s |');
  linhas.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const g of gfxs) {
    const A = [1, 2].flatMap(p => ler(`${tipo}_${g}_antes_${p}.json`));
    const B = [1, 2].flatMap(p => ler(`${tipo}_${g}_depois_${p}.json`));
    const chaves = [...new Set(A.map(m => m.mapa + '|' + (m.rodada ?? '')))];
    for (const k of chaves) {
      const [mapa, rod] = k.split('|');
      const a = A.filter(m => m.mapa + '|' + (m.rodada ?? '') === k), b = B.filter(m => m.mapa + '|' + (m.rodada ?? '') === k);
      const c = (arr, f) => med(arr.map(f).filter(v => v != null && !isNaN(v)));
      const par = f => `${f1(c(a, f))} → ${f1(c(b, f))}`;
      const pct = f => { const x = c(a, f), y = c(b, f); return isNaN(x) || !x ? '' : ` (${y >= x ? '+' : ''}${Math.round((y / x - 1) * 100)}%)`; };
      linhas.push(`| ${g} | ${mapa} | ${rod || '-'} | ${par(m => m.fpsMedio)}${pct(m => m.fpsMedio)} | ${par(m => m.fps1low)} | ${par(m => m.msMediana)} | ${par(m => m.msP90)} | ${Math.round(c(a, m => m.drawCalls))} → ${Math.round(c(b, m => m.drawCalls))} | ${Math.round(c(a, m => m.geometrias))}/${Math.round(c(a, m => m.texturas))} → ${Math.round(c(b, m => m.geometrias))}/${Math.round(c(b, m => m.texturas))} | ${f1(c(a, m => (m.montagemMs + m.aquecimentoMs) / 1000))} → ${f1(c(b, m => (m.montagemMs + m.aquecimentoMs) / 1000))} |`);
    }
  }
}
console.log(linhas.join('\n'));
