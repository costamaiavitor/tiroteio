# Onda 1: resultados (Frentes A, B e E)

Branch `overhaul-zumbi`, de `cbbeead` (antes) até o HEAD do fim da Onda 1. Nada foi enviado para o GitHub.

## Como foi medido

- `tools/bench/bench.mjs` no jogo rodando de verdade (laço real, placa de vídeo desta máquina), 10 s por medida.
- As duas versões foram intercaladas na mesma sessão, em 2 pares, sem nenhum outro agente rodando. Cada número é a média dos 2 pares.
- Na horda, o jogador fica atirando sem parar, com o teto de 24 zumbis vivos (Normal), na rodada 25. As duas versões tiveram 24/24 zumbis.
- Dados brutos, script e tabela: `bench/onda1/` (`bash bench_final.sh` e depois `node tab.mjs`).

## Resumo

| Situação | FPS antes → depois |
|---|---|
| Médio, zumbi (Vila / Sanatório) | 41–44 → 49–62 (+20 a +48%) |
| Baixo, zumbi | 48–57 → 67–94 (+40 a +65%) |
| Alto, zumbi | 23–25 → 31–40 (+37 a +66%) |
| Horda r25, Médio | 39 / 43 → 52 / 74 (+34% / +70%) |
| Horda r25, Baixo | 45 / 54 → 80 / 94 (+78% / +75%) |
| PvP (Arena), Médio / Baixo / Alto | 188 / 267 / 35 → 233 / 347 / 83 |

- **Meta de 60 FPS no Médio e no Baixo (adotada por padrão, a confirmar):**
  - no Baixo, cumprida em todos os casos;
  - no Médio, cumprida no Sanatório (r1) e na horda do Sanatório; ficam abaixo a Vila Médio (48–55) e o Sanatório r10 (59).

## Tabelas completas

### Rodadas normais (r1, r10)

| gráfico | mapa | rodada | FPS | 1% low | quadro mediano ms | p90 ms | draws | carga s |
|---|---|---|---|---|---|---|---|---|
| médio | vila | 1 | 43.5 → 55.0 (+26%) | 20.8 → 32.0 | 22.9 → 18.1 | 27.4 → 21.1 | 817 → 648 | 13.6 → 12.4 |
| médio | vila | 10 | 40.5 → 48.5 (+20%) | 24.6 → 29.9 | 24.6 → 20.5 | 29.4 → 23.9 | 830 → 678 | |
| médio | sanatório | 1 | 41.5 → 61.5 (+48%) | 24.3 → 47.9 | 24.2 → 16.0 | 27.7 → 17.6 | 791 → 488 | 8.8 → 7.1 |
| médio | sanatório | 10 | 41.5 → 59.4 (+43%) | 27.3 → 35.6 | 23.9 → 16.6 | 27.6 → 18.5 | 808 → 492 | |
| médio | arena | - | 188 → 233 (+24%) | 4.2 → 7.3 | 2.5 → 2.6 | 5.0 → 5.0 | 150 → 150 | 0.8 → 3.4 |
| baixo | vila | 1 | 53.3 → 74.4 (+40%) | 36.7 → 53.3 | 19.4 → 13.6 | 21.9 → 15.2 | 755 → 443 | 9.5 → 9.3 |
| baixo | vila | 10 | 47.6 → 66.7 (+40%) | 29.6 → 42.0 | 20.8 → 14.8 | 22.6 → 16.1 | 792 → 451 | |
| baixo | sanatório | 1 | 56.5 → 93.5 (+65%) | 38.6 → 67.9 | 17.7 → 11.1 | 19.6 → 12.0 | 734 → 337 | 7.0 → 5.4 |
| baixo | sanatório | 10 | 54.5 → 85.0 (+56%) | 36.2 → 48.9 | 18.0 → 11.6 | 20.3 → 12.6 | 740 → 331 | |
| baixo | arena | - | 267 → 347 (+30%) | 25.6 → 38.5 | 3.2 → 2.5 | 5.2 → 4.3 | 207 → 138 | 0.6 → 2.4 |
| alto | vila | 1 | 22.7 → 31.2 (+37%) | 12.3 → 17.7 | 42.0 → 31.4 | 51.2 → 39.7 | 1115 → 922 | 11.3 → 13.1 |
| alto | vila | 10 | 23.2 → 31.9 (+37%) | 18.1 → 18.3 | 41.8 → 30.8 | 48.6 → 38.4 | 1157 → 970 | |
| alto | sanatório | 1 | 24.2 → 40.2 (+66%) | 17.5 → 26.9 | 40.2 → 24.4 | 48.5 → 27.1 | 919 → 660 | 9.6 → 7.0 |
| alto | sanatório | 10 | 25.1 → 39.1 (+56%) | 15.0 → 24.4 | 38.3 → 25.1 | 47.7 → 28.0 | 944 → 671 | |
| alto | arena | - | 35.0 → 83.0 (+137%) | 1.5 → 3.3 | 6.6 → 4.0 | 18.6 → 8.3 | 347 → 210 | 1.4 → 2.7 |

### Horda (r25, 24 zumbis, atirando)

| gráfico | mapa | FPS | 1% low | quadro mediano ms | p90 ms | draws |
|---|---|---|---|---|---|---|
| médio | vila | 38.8 → 51.8 (+34%) | 16.8 → 19.8 | 25.8 → 18.8 | 33.7 → 26.9 | 770 → 528 |
| médio | sanatório | 43.3 → 73.7 (+70%) | 16.5 → 28.7 | 22.3 → 12.9 | 32.8 → 20.8 | 574 → 297 |
| baixo | vila | 45.2 → 80.3 (+78%) | 15.9 → 41.2 | 21.8 → 11.8 | 30.3 → 14.9 | 771 → 266 |
| baixo | sanatório | 53.7 → 93.8 (+75%) | 21.7 → 36.3 | 18.3 → 9.9 | 25.0 → 14.6 | 553 → 234 |

## Outras medidas (dos relatórios de cada agente)

| Medida | Antes → depois |
|---|---|
| Menu pronto para clicar | 13–15 s → 1,4–2,4 s (B11) |
| Memória de vídeo, Vila Médio | 270 → 214 MB; Arena depois de outros mapas 229 → 134 MB (B06) |
| Buffers após 15 rodadas | 26,8 → 18,9 MB (B07) |
| Geometrias presas após trocar de mapa e gráfico | 925 → 699 (B22) |
| GPU da sombra no Alto | 7–22 → 0,6–0,8 ms (B05) |
| Compilação de shader no meio da partida | → 0 (A34, B04pc, B08) |
| Raios (tiro, visão, apoio) | 0,1–0,3 → ~0,01 ms por quadro, resultado idêntico em 2,98 mi de comparações (A10) |

## O que piorou

- **Carga da Arena** +1,5 a 2,6 s: o B08 espera as armas baixadas ficarem prontas antes de entrar, em troca de 0 travadas de compilação na partida.
- **Carga da Vila no Alto** +1,8 s.

## O que foi revertido ou ficou de fora

- **A31 (opacos ordenados por shader):** revertido. Tirava a ordem de frente para trás e quase dobrava o tempo de GPU na horda (Sanatório 11,2 → 6,2 ms sem ele).
- **B01b:** recusado, porque disparava gatilhos e animações durante a montagem.
- **Agentes de sistemas da Frente A** (IA, rede, áudio etc.): suspensos, porque o profile mostrou cada sistema custando menos de 1 ms.

## Comportamento e balanceamento

- Nenhum commit da Onda 1 muda dano, vida, velocidade, tempos, sorteios, rede ou colisão. Os dois revisores (A22 e B22) conferiram commit a commit.
- 56/56 testes, incluindo os 7 de caracterização do modo zumbi.
- Harness de regressão do modo zumbi sem erros na Vila e no Sanatório.

## Decisões pendentes

1. **Meta de FPS:** adotei 60 no Médio e no Baixo. A Vila Médio fica em 48–55.
2. **Recorte além da névoa do B02 (Sanatório):** apaga pilares e o portão ao longe quando estão contra o céu (até 196 px em 5 de 10 pontos). As opções são:
   - limitar o recorte a peças abaixo do muro;
   - desligá-lo (perde ~48 draws);
   - aceitar como está.
3. **Pendências anteriores** (em `onda1.md`):
   - texturas dos braços 2×2048 (44 MB);
   - névoa mais curta no Baixo;
   - a troca para o Baixo no meio da partida só vale inteira no próximo mapa;
   - pool de luzes virtual;
   - sangue instanciado;
   - B10 no Sanatório.
