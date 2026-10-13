#!/bin/bash
# Bench do relatório final: cbbeead (antes do overhaul) x HEAD (fim da Onda 3), intercalados, 1 par por placa.
D=/c/dev/tiroteio-notas/work/overhaul/final2
cd /c/dev/tiroteio
git show cbbeead:index.html > $D/antes.html
git show HEAD:index.html > $D/depois.html
for gpu in 0 1; do
  for gfx in medio baixo; do
    for v in antes depois; do
      node tools/bench/bench.mjs --pagina $D/$v.html --gfx $gfx --mapas vila,sanatorio,arena --rodadas 1,10 --seg 10 --gpuDedicada $gpu --saida $D/n_g${gpu}_${gfx}_${v}.json > $D/n_g${gpu}_${gfx}_${v}.log 2>&1
      echo "normal gpu$gpu $gfx $v rc=$?"
    done
    for v in antes depois; do
      node tools/bench/bench.mjs --pagina $D/$v.html --gfx $gfx --mapas vila,sanatorio --rodadas 25 --horda 1 --seg 10 --gpuDedicada $gpu --saida $D/h_g${gpu}_${gfx}_${v}.json > $D/h_g${gpu}_${gfx}_${v}.log 2>&1
      echo "horda gpu$gpu $gfx $v rc=$?"
    done
  done
done
echo FIM
