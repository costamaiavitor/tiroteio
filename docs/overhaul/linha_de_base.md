# Overhaul: linha de base (Fase 0, 07/10/2026)

## Funcional
- **Testes do repositório** (`pnpm test`, 49 testes de segurança e caracterização): 48 passam e 1 falha na `main`. O que falha é `seguranca-host` "zumbis: sala": o clique em "Começar partida" passa de 30 s porque a sala zumbi monta devagar no navegador de teste (SwiftShader). Fica registrado como instável e já conhecido.
- **Testes novos de fluxo do modo zumbi** (`tests/fluxos-zumbi.test.mjs`): 7 de 7 passam. Cobrem iniciar, matar zumbi, power-up (Bônus e Munição Máxima), passar de rodada, chefe (Carniceiro) e morrer.

## Desempenho
- **Ferramenta:** `node tools/bench/bench.mjs --gfx medio --seg 10`.
- **Ambiente:** Chromium com a placa de vídeo desta máquina (Intel UHD integrada, ANGLE/D3D11), 1280×720, sem vsync.
- **Método:**
  - Gráfico Médio.
  - Em cada célula, a mediana de 2 rodadas, alternando as versões na mesma sessão.
  - **Zumbi:** jogador parado no ponto de nascimento, invulnerável, todas as portas abertas; a rodada N começa como no jogo; mede 10 s depois de 4 s.
  - **PvP:** mata-mata com 4 bots.
- **Como ler:**
  - O "FPS mín." (um único quadro) oscila muito: no PvP o primeiro quadro depois do aquecimento chega a 0,5 FPS. Por isso a tabela mostra o "1% low", a média do 1% de quadros piores.
  - Nas rodadas 10 e 15 havia poucos zumbis vivos (6–8), porque eles ainda estavam nascendo: o cenário mede os primeiros 14 s da rodada. A Frente E vai acrescentar um cenário de horda cheia.

### `main` (404d045): é a linha de base oficial
| Mapa / rodada | FPS médio | FPS 1% low | Quadro mediano / p90 (ms) | Draw calls | Zumbis ativos | Memória JS (MB) | Montagem / aquecimento (s) |
|---|---|---|---|---|---|---|---|
| vila r1 | 49.8 | 28.3 | 19.4 / 25.9 | 808 | 4.1 | 184 | 5.0 / 6.3 |
| vila r5 | 50.2 | 30.8 | 19.8 / 24.6 | 836 | 5.2 | 179 |  |
| vila r10 | 50.5 | 31.3 | 19.6 / 25.0 | 798 | 6.4 | 175 |  |
| vila r15 | 53.9 | 33.0 | 17.9 / 23.0 | 815 | 8.1 | 199 |  |
| sanatorio r1 | 49.5 | 22.3 | 19.8 / 24.6 | 791 | 4.2 | 187 | 3.0 / 4.9 |
| sanatorio r5 | 49.3 | 33.4 | 20.0 / 24.1 | 817 | 4.4 | 187 |  |
| sanatorio r10 | 49.0 | 31.3 | 20.1 / 24.3 | 812 | 5.5 | 175 |  |
| sanatorio r15 | 50.0 | 30.0 | 19.5 / 23.9 | 814 | 8.1 | 185 |  |
| arena | 187.3 | 5.4 | 3.2 / 6.2 | 129 | — | 120 | 0.3 / 0.6 |
| dust | 160.8 | 4.8 | 4.4 / 9.7 | 133 | — | 123 | 0.4 / 1.1 |
| armazem | 156.0 | 12.9 | 5.7 / 9.2 | 177 | — | 116 | 0.3 / 1.4 |
| favela | 175.8 | 6.4 | 3.2 / 8.8 | 113 | — | 111 | 0.4 / 1.4 |
| neve | 147.8 | 8.9 | 6.5 / 9.8 | 235 | — | 113 | 0.4 / 1.2 |

### Base da fase 6 (25 correções de armas e gráficos, ainda fora da branch), medida na mesma sessão
| Mapa / rodada | FPS médio | FPS 1% low | Quadro mediano / p90 (ms) | Draw calls | Zumbis ativos | Memória JS (MB) | Montagem / aquecimento (s) |
|---|---|---|---|---|---|---|---|
| vila r1 | 40.4 | 22.3 | 26.6 / 31.7 | 816 | 4.2 | 181 | 5.0 / 7.7 |
| vila r5 | 48.0 | 26.4 | 19.8 / 28.0 | 825 | 5.3 | 176 |  |
| vila r10 | 51.1 | 31.6 | 19.4 / 24.0 | 815 | 6.2 | 176 |  |
| vila r15 | 50.4 | 31.0 | 19.2 / 25.5 | 831 | 8.2 | 198 |  |
| sanatorio r1 | 51.0 | 29.0 | 18.9 / 23.5 | 792 | 4.2 | 163 | 2.3 / 4.8 |
| sanatorio r5 | 48.2 | 33.6 | 20.6 / 24.9 | 801 | 4.8 | 151 |  |
| sanatorio r10 | 50.1 | 32.6 | 19.6 / 23.8 | 761 | 6.4 | 147 |  |
| sanatorio r15 | 51.5 | 34.6 | 19.2 / 23.1 | 755 | 8.2 | 157 |  |
| arena | 205.2 | 7.6 | 3.0 / 6.2 | 107 | — | 114 | 0.3 / 0.6 |
| dust | 187.7 | 5.7 | 3.1 / 6.6 | 116 | — | 110 | 0.3 / 0.6 |
| armazem | 155.9 | 13.6 | 5.2 / 9.2 | 184 | — | 128 | 0.4 / 1.2 |
| favela | 172.2 | 8.3 | 3.8 / 9.2 | 152 | — | 125 | 0.4 / 1.1 |
| neve | 152.0 | 8.0 | 6.3 / 10.5 | 222 | — | 121 | 0.4 / 1.0 |

## Leitura
- **Mapas zumbi no Médio:** ficam em ~49–54 FPS de média e ~22–34 FPS no 1% low, com ~800 draw calls. Estão **abaixo da meta de 60 FPS**. O limite é a CPU (draw calls), como o agente g03 da fase 6 mediu.
- **Mapas PvP:** passam de 140 FPS de média, mas o 1% low é baixo por causa do primeiro quadro.
- **Fase 6 contra a `main`:** empatam dentro do ruído, com uma rodada pior na Vila r1 (aquecimento). A fase 6 não deixou o jogo mais lento.
- **Meta adotada:** 60 FPS no Médio e no Baixo. O Caio deixou `[DEFINA O FPS ALVO]` em branco.
