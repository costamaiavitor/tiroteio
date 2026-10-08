#!/bin/bash
# Bench limpo do fim da Onda 1: cbbeead (antes) x HEAD, intercalados, 2 pares.
D=/c/dev/tiroteio/docs/overhaul/bench/onda1
cd /c/dev/tiroteio
git show cbbeead:index.html > $D/antes.html
git show HEAD:index.html > $D/depois.html
for par in 1 2; do
  for gfx in medio baixo alto; do
    for v in antes depois; do
      node tools/bench/bench.mjs --pagina $D/$v.html --gfx $gfx --mapas vila,sanatorio,arena --rodadas 1,10 --seg 10 --saida $D/n_${gfx}_${v}_$par.json > $D/n_${gfx}_${v}_$par.log 2>&1
      echo "normal $gfx $v $par rc=$?"
    done
  done
  for gfx in medio baixo; do
    for v in antes depois; do
      node tools/bench/bench.mjs --pagina $D/$v.html --gfx $gfx --mapas vila,sanatorio --rodadas 25 --horda 1 --seg 10 --saida $D/h_${gfx}_${v}_$par.json > $D/h_${gfx}_${v}_$par.log 2>&1
      echo "horda $gfx $v $par rc=$?"
    done
  done
done
echo FIM
