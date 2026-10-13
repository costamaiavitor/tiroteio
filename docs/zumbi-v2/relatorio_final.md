# zumbi-v2: relatório final

Branch `zumbi-v2`, saída da `main` em f18f032. São 12 commits, 28 arquivos (+685 −350 linhas). Nada foi enviado ao GitHub. O balanceamento novo fica todo em `zumbi_config.js`.

**Validação:**
- 223 testes passando, 8 deles novos, em `tests/zumbi-v2.test.mjs` e `tests/mapas-armas.test.mjs`.
- 3 revisores independentes; os achados deles foram corrigidos.
- Medição de desempenho alternando antes × depois (seção 3).

## 1. Mudanças por etapa

| Etapa | O que mudou | Onde |
|---|---|---|
| 0 | Arquivo único de balanceamento, mapa dos sistemas, medição de base (rodadas 1/10/20) e testes de caracterização (os 7 de `fluxos-zumbi` já existiam e passam) | `zumbi_config.js`, `docs/zumbi-v2/mapa_sistemas.md` |
| 1 | Velocidade, dano e ritmo do golpe por fórmula do tamanho; golpe entre 15 e 90 | `zTamanho`, `ZBAL.tamanho` (tabela em `balanceamento.md`) |
| 2 | 47 armas revisadas por 10 agentes (5 armas cada) + correções no código comum | ver §2 |
| 3 | Cadeado do portão que boiava no vão (o "quadrado laranja"); todas as portas conferidas | `zUpdateWorld`, `tools/itens/portas.mjs` |
| 4 | Zumbi encostado nas tábuas; quebra mais rápida e mais rápida ainda em grupo (até 3, curva configurável); os outros esperam atrás | `ZBAL.janela` |
| 5 | Alvo sempre o jogador; quem está fora mas já na área jogável (ou com o jogador colado) larga a janela; estilos de andar (errático, cambaleante, pesado) com variação por zumbi; reavaliação escalonada | `zForaJanela`, `ZBAL.alvo`, `ZBAL.estilos` |
| 6 | Minimapa removido por inteiro; marcador da energia e do PaP só no Fácil; 5 passagens secretas (paredes falsas) | `ZBAL.dicas`, `ZINT_PORTAS` (`secreta-*`) |
| 7 | Caixa vai para qualquer lugar válido depois do ursinho; bebidas, PaP e energia sorteados a cada partida (semente igual em todos os PCs) | `zSorteiaLugares`, `ZBAL.lugares`, `ZBAL.caixa` |
| 8 | Energia e PaP montados com peças espalhadas em áreas baratas ou médias; quantidade e distância pela dificuldade; HUD com a contagem | `zSorteiaPecas`, interativo `peca`, `ZBAL.construcao` |
| 9 | Pack-a-Punch com 3 níveis (5000 / 10000 / 20000): mais dano, munição e cadência, traçante e nome (II/III); trava no 3 | `papProx`, `PAP_IDS`, `ZBAL.pap` |
| 10 | ~25 KB de código sem uso removidos (minimapa + 8 funções mortas) | `docs/zumbi-v2/limpeza.md` |
| 11 | Bugs registrados e corrigidos | `docs/zumbi-v2/bugs.md` |

**Protocolo de rede 5:** host e cliente de versões diferentes são recusados.

## 2. Armas (Etapa 2)

**Por arma:**
- **Python:** o cão tapava a mira.
- **MP40, MG42, Stoner, HS10, Arma Trovão:** a arma enchia a tela na mira.
- **Dragunov e SMGs de parede:** perda de dano por distância trocada pela das armas de precisão e das SMGs, respectivamente.
- **Kiparis:** som de supressor errado.
- **HK21:** som de 5,56 trocado pelo de 7,62.
- **C96:** carregador na frente do gatilho.
- **AUG:** empunhadura solta.
- **Famas, Winter's Howl e Ray Gun Mk II:** alça flutuando.
- **LAW e besta:** a recarga acabava antes do tempo.
- **Thompson:** mais pesada.
- **MG42:** dano 120 → 80 (DPS era 2400).
- **Pack-a-Punch:** Ray Gun 40/200 e Olympia com 2 no pente.

**Código comum:**
- Coice por arma (`ZBAL.armas.coice`, só no modo zumbi).
- Escopeta com PaP recarrega 10% mais rápido.
- A L96 saca devagar.
- A bomba da escopeta não é mais cortada no último cartucho.
- A G11 não ejeta cápsula.
- O ferrolho da PM63 anima na recarga vazia.
- O projétil da LAW e da besta some depois do tiro.
- A recarga automática não cai na arma trocada.

**Conferido pelo revisor R2:** 188 armas (47 bases × 4 níveis de PaP):
- atirar e recarregar com o pente parcial e vazio;
- trocar de arma no meio da recarga;
- mira centrada (0 px de desvio).

Nenhum problema.

## 3. Desempenho antes × depois

Medição feita com `tools/bench/bench.mjs`, alternando f18f032 (antes do zumbi-v2) e o HEAD na mesma sessão, 2 pares, 10 s por medida, placa integrada. Dados e script em `docs/zumbi-v2/bench/`.

| Gráfico | Mapa | Rodada | FPS médio | FPS mínimo | 1% low | Memória JS (MB) | Geometrias/texturas | Carga (s) |
|---|---|---|---|---|---|---|---|---|
| medio | vila | r1 | 44.4 → 44.3 (0%) | 19.3 → 25.1 | 25.9 → 27.7 | 208 → 214 | 2393/257 → 2399/260 | 13.6 → 13.3 |
| medio | vila | r10 | 36.3 → 44.0 (+22%) | 13.5 → 25.6 | 18.4 → 27.9 | 206 → 224 | 2403/262 → 2408/261 | 0.0 → 0.0 |
| medio | vila | r20 | 37.1 → 44.6 (+20%) | 21.2 → 21.9 | 22.7 → 27.1 | 216 → 213 | 2420/265 → 2424/265 | 0.0 → 0.0 |
| medio | sanatorio | r1 | 43.8 → 52.7 (+20%) | 29.3 → 32.4 | 30.8 → 36.5 | 160 → 168 | 1882/265 → 1890/266 | 7.2 → 6.4 |
| medio | sanatorio | r10 | 46.4 → 48.0 (+3%) | 24.3 → 25.8 | 27.7 → 27.9 | 173 → 176 | 1893/271 → 1901/271 | 0.0 → 0.0 |
| medio | sanatorio | r20 | 47.3 → 49.2 (+4%) | 23.9 → 27.9 | 28.0 → 31.3 | 165 → 179 | 1905/273 → 1913/272 | 0.0 → 0.0 |
| baixo | vila | r1 | 66.7 → 63.5 (-5%) | 19.5 → 22.8 | 35.5 → 35.2 | 192 → 189 | 2388/253 → 2391/252 | 9.9 → 9.8 |
| baixo | vila | r10 | 57.2 → 59.8 (+4%) | 29.1 → 24.5 | 33.8 → 36.0 | 191 → 192 | 2399/257 → 2403/258 | 0.0 → 0.0 |
| baixo | vila | r20 | 57.0 → 56.8 (0%) | 31.5 → 30.5 | 34.4 → 33.0 | 186 → 193 | 2413/260 → 2422/262 | 0.0 → 0.0 |
| baixo | sanatorio | r1 | 69.4 → 82.3 (+19%) | 38.8 → 53.1 | 42.2 → 58.2 | 171 → 155 | 1866/252 → 1873/252 | 5.4 → 5.3 |
| baixo | sanatorio | r10 | 66.1 → 68.5 (+4%) | 30.5 → 34.1 | 34.8 → 36.5 | 169 → 158 | 1872/255 → 1884/257 | 0.0 → 0.0 |
| baixo | sanatorio | r20 | 72.5 → 75.5 (+4%) | 37.0 → 35.0 | 40.9 → 39.0 | 171 → 162 | 1887/260 → 1901/260 | 0.0 → 0.0 |
| medio | vila | r25 (horda) | 43.2 → 50.5 (+17%) | 16.9 → 16.8 | 18.9 → 18.3 | 214 → 191 | 2473/280 → 2462/280 | 12.2 → 11.6 |
| medio | sanatorio | r25 (horda) | 61.1 → 65.2 (+7%) | 19.9 → 23.4 | 22.0 → 25.9 | 178 → 173 | 1958/289 → 1962/289 | 6.4 → 6.5 |
| baixo | vila | r25 (horda) | 70.7 → 69.5 (-2%) | 28.6 → 21.3 | 33.2 → 26.2 | 200 → 200 | 2454/275 → 2461/275 | 9.5 → 9.6 |
| baixo | sanatorio | r25 (horda) | 80.3 → 83.0 (+3%) | 26.3 → 35.5 | 31.7 → 39.6 | 165 → 166 | 1940/275 → 1940/275 | 5.5 → 4.5 |


- **FPS médio:** igual ou maior em 14 das 16 medidas. As duas abaixo (−5% e −2%, Vila no Baixo) ficam dentro do ruído desta máquina, que varia até 30% entre corridas da mesma versão.
- **1% low:** melhor na maioria dos casos.
- **Memória JS:** igual dentro do ruído, de −16 a +18 MB conforme a corrida e sem tendência. Geometrias e texturas iguais: +4 a +14 geometrias, que são as peças e as bancadas da Etapa 8.
- **Carga:** igual ou um pouco menor.
- **Conclusão:** o jogo não ficou mais pesado.

## 4. Tabelas de balanceamento

Estão em `docs/zumbi-v2/balanceamento.md`: modo × tipo × tamanho × velocidade × dano × ciclo × DPS.

| Modo | Peças por máquina |
|---|---|
| Fácil | 2 |
| Normal | 3 |
| Difícil | 4 |
| Pesadelo | 5 |

- **Peças em áreas de custo até:** 2500 no Fácil e no Normal, 3000 no Difícil e no Pesadelo.
- **Pack-a-Punch:**
  - nível 2: dano ×1,5, pente ×1,25, cadência ×0,9;
  - nível 3: dano ×2,2, pente ×1,5, cadência ×0,8.

## 5. Itens removidos

Detalhes em `docs/zumbi-v2/limpeza.md`.
- **Minimapa:** 19,3 KB, mais CSS e 3 elementos.
- **`W_NAME` e 8 funções mortas:** ~5,5 KB.
- **Assets:** nenhum sem uso.
- **Na dúvida (decisão sua):** `docs/zumbi-v2/limpeza_duvidosa.md`.

## 6. Bugs corrigidos

Lista completa em `docs/zumbi-v2/bugs.md`. Os principais:
- O quadrado laranja das portas.
- A fila da janela que travava.
- 20 defeitos de armas.
- Achados dos revisores:
  - energia sem parede atrás;
  - peça dentro de barril;
  - HUD sobreposto;
  - coice vazando para o modo CS;
  - Arma Trovão PaP II/III;
  - caixa da campanha.
- **Erro meu, corrigido:** a primeira limpeza apagou 4 funções que ainda eram usadas. O revisor R2 pegou, elas voltaram, e agora há um teste que monta todos os mapas e recarrega todas as armas.

## 7. Resultado dos revisores

| Revisor | Etapas | Resultado |
|---|---|---|
| R1 | 1, 4, 5 | Nenhum golpe derruba de uma vez (menor golpe 23, maior 90). Janelas: 1 zumbi 5,1 s, 2 zumbis 3,2–3,5 s, 3 zumbis 2,7–3,7 s (antes 9,1 s com 1). Fila travada corrigida. Nenhum zumbi ignora o jogador. Hordas chegam espalhadas. IA sem custo extra. |
| R2 | 2, 3 | 188 armas sem problema. Portas: as 106 abrem e o vão fica livre. Achou o cadeado e a limpeza errada. |
| R3 | 6–9 | HUD limpo. 80 sementes por mapa: tudo alcançável e sem sobreposição. Peças: quantidade certa e nunca em área cara. Partida do início ao PaP nível 3 no Pesadelo sem travar. |

## 8. Pendências (decisão sua)

1. **Recuo de câmera:** hoje não existe em nenhuma arma, só o coice visual. Criar recuo muda o jeito de jogar.
2. **Kar98k:** dano 400 → sugestão 600–700.
3. **M16:** `rate` .32 → .22 (é o fuzil mais fraco).
4. **Passagens secretas:** usar a textura do muro (hoje é um painel liso de cor fixa, que destoa na Vila).
5. **Veloz no Pesadelo:** chega a 6,6–8,0 m/s, mais rápido que os cães.
6. **Energia:** pode sair para o lugar de um giz em área cara. Opção: limitar ao custo médio, como as peças.
7. **Traçante das armas maravilha:** o PaP II e III troca o traçante próprio delas (a Ray Gun fica laranja ou vermelha).
8. **Sem animação:** inspeção de arma de fogo, ejeção parcial de cápsulas na Olympia e na Python, e a manga clara no canto da tela nas armas com empunhadura vertical.
