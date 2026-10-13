#!/bin/bash
# Bench final do zumbi-v2: f18f032 (linha de base, main antes do zumbi-v2) x HEAD, intercalados, 2 pares, rodadas 1/10/20 + horda r25.
D=/c/dev/tiroteio-notas/work/zv2/final
mkdir -p $D
cd /c/dev/tiroteio
git show f18f032:index.html > $D/antes.html
cp index.html $D/depois.html
for par in 1 2; do
  for gfx in medio baixo; do
    for v in antes depois; do
      node tools/bench/bench.mjs --pagina $D/$v.html --gfx $gfx --mapas vila,sanatorio --rodadas 1,10,20 --seg 10 --saida $D/n_${gfx}_${v}_$par.json > $D/n_${gfx}_${v}_$par.log 2>&1
      echo "normal $gfx $v $par rc=$?"
      node tools/bench/bench.mjs --pagina $D/$v.html --gfx $gfx --mapas vila,sanatorio --rodadas 25 --horda 1 --seg 10 --saida $D/h_${gfx}_${v}_$par.json > $D/h_${gfx}_${v}_$par.log 2>&1
      echo "horda $gfx $v $par rc=$?"
    done
  done
done
echo FIM
