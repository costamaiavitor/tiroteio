# Overhaul do modo zumbi: relatório final

Branch `overhaul-zumbi`, de `cbbeead` (antes) até o HEAD do fim da Onda 3. São 105 commits e 70 arquivos, nada enviado ao GitHub. Cada mudança é um commit pequeno: dá para recusar uma parte com `git revert <commit>`.

## 1. Resumo

| Onda | Frentes | O que entregou |
|---|---|---|
| Fase 0 | — | linha de base (bench reproduzível, testes de caracterização, mapa do projeto) |
| 1 | A, B, E | otimização: +20 a +137% de FPS, menu em ~2 s, menos memória de vídeo, 0 compilação na partida |
| 2 | C, E | auditoria e redistribuição dos itens, 10 tipos de interativos novos nos dois mapas |
| 3 | D, E | campanha com história (5 atos, 3 chefes em arenas próprias, 7 zumbis novos, 7 eventos, final e Infinito) |

**Validação final**
- **Testes:** 215 em 26 arquivos (eram 56), todos passando. O teste `tipos-zumbi` prova com semente fixa que o modo clássico ficou idêntico depois do refator.
- **Harness de regressão do modo zumbi:** sem erros de página na Vila e no Sanatório.
- **Auditoria de itens:** 0 erros e 0 avisos nos dois mapas.
- **Conferência de compra:** todos os itens comprados andando até eles (Vila 129/129, Sanatório 107/107).
- **Campanha de ponta a ponta com clientes falsos** (`tools/bench/ponta-campanha.mjs`): do Ato I ao lobby com o Infinito liberado, sem erro nem trava.

## 2. Desempenho antes e depois

Medido com `tools/bench/bench.mjs` no jogo rodando de verdade, as duas versões intercaladas na mesma sessão.

**Atenção:** sem a opção `--gpuDedicada 1`, o Chromium deste notebook usa a placa **integrada** (Intel UHD). Por isso todas as medidas das Ondas 1 e 2 são da integrada. A tabela final mostra as duas placas.

### 2.1 Fim da Onda 1 (integrada, 2 pares; detalhes em `onda1_resultados.md`)

| Situação | FPS antes → depois |
|---|---|
| Médio, zumbi | 41–44 → 49–62 (+20 a +48%) |
| Baixo, zumbi | 48–57 → 67–94 (+40 a +65%) |
| Alto, zumbi | 23–25 → 31–40 (+37 a +66%) |
| Horda r25 Médio (Vila / Sanatório) | 39 / 43 → 52 / 74 |
| Horda r25 Baixo (Vila / Sanatório) | 45 / 54 → 80 / 94 |
| PvP Arena Alto | 35 → 83 |

### 2.2 Final: antes do overhaul × fim da Onda 3

Bench de 10 s por medida, 1 par intercalado por placa (dados e script em `bench/final/`). FPS médio antes → depois, 1% low, chamadas de desenho.

| Placa | Gráfico | Mapa | Rodada | FPS | 1% low | Chamadas |
|---|---|---|---|---|---|---|
| integrada | Médio | Vila | 1 | 38,6 → 48,3 (+25%) | 15,3 → 35,4 | 810 → 662 |
| integrada | Médio | Vila | 10 | 40,5 → 44,8 (+11%) | 25,9 → 26,8 | 829 → 690 |
| integrada | Médio | Sanatório | 1 | 26,7 → 51,0 (+91%) | 14,3 → 34,3 | 790 → 513 |
| integrada | Médio | Sanatório | 10 | 26,7 → 46,0 (+72%) | 19,3 → 26,0 | 806 → 508 |
| integrada | Baixo | Vila | 1 | 43,9 → 54,4 (+24%) | 20,3 → 27,4 | 756 → 457 |
| integrada | Baixo | Vila | 10 | 43,0 → 52,4 (+22%) | 24,3 → 34,8 | 792 → 464 |
| integrada | Baixo | Sanatório | 1 | 52,9 → 87,9 (+66%) | 31,7 → 54,7 | 733 → 360 |
| integrada | Baixo | Sanatório | 10 | 52,9 → 77,0 (+46%) | 35,2 → 40,9 | 740 → 363 |
| integrada | Médio | horda Vila | 25 | 39,9 → 67,9 (+70%) | 14,1 → 28,2 | 652 → 241 |
| integrada | Médio | horda Sanatório | 25 | 43,9 → 77,6 (+77%) | 15,8 → 31,1 | 507 → 238 |
| integrada | Baixo | horda Vila | 25 | 61,8 → 77,8 (+26%) | 22,4 → 43,1 | 480 → 254 |
| integrada | Baixo | horda Sanatório | 25 | 50,4 → 85,3 (+69%) | 20,6 → 36,3 | 527 → 286 |
| dedicada | Médio | Vila | 1 | 55,6 → 63,3 (+14%) | 38,0 → 41,7 | 795 → 658 |
| dedicada | Médio | Vila | 10 | 53,7 → 62,7 (+17%) | 29,9 → 41,3 | 835 → 683 |
| dedicada | Médio | Sanatório | 1 | 60,5 → 71,0 (+17%) | 25,6 → 31,8 | 793 → 515 |
| dedicada | Médio | Sanatório | 10 | 57,2 → 77,6 (+36%) | 36,6 → 41,7 | 762 → 517 |
| dedicada | Baixo | Vila | 1 | 60,7 → 93,5 (+54%) | 31,0 → 58,7 | 758 → 455 |
| dedicada | Baixo | Vila | 10 | 55,5 → 90,5 (+63%) | 35,9 → 47,8 | 795 → 460 |
| dedicada | Baixo | Sanatório | 1 | 72,1 → 109,6 (+52%) | 27,4 → 42,0 | 735 → 361 |
| dedicada | Baixo | Sanatório | 10 | 70,7 → 114,5 (+62%) | 42,0 → 66,9 | 735 → 359 |
| dedicada | Médio | horda Vila | 25 | 47,4 → 53,5 (+13%) | 20,8 → 31,4 | 1042 → 653 |
| dedicada | Médio | horda Sanatório | 25 | 70,8 → 79,2 (+12%) | 36,1 → 31,5 | 455 → 347 |
| dedicada | Baixo | horda Vila | 25 | 61,5 → 67,3 (+9%) | 27,3 → 38,8 | 695 → 496 |
| dedicada | Baixo | horda Sanatório | 25 | 96,0 → 92,9 (−3%) | 42,5 → 52,2 | 348 → 275 |
| integrada / dedicada | Médio | PvP Arena | — | 207 → 210 / 520 → 495 | 3,6 → 8,8 / 49 → 98 | — |
| integrada / dedicada | Baixo | PvP Arena | — | 316 → 255 / 479 → 485 | 16,5 → 37,0 / 78 → 91 | — |

- **Modo zumbi:** ganho em todos os casos menos um (horda Sanatório Baixo na dedicada, −3%, dentro do ruído).
  - Na integrada: +11 a +91% de FPS.
  - Na dedicada: +9 a +63%.
  - 1% low melhor em quase tudo.
- **PvP:** já roda acima de 200 FPS. A Arena Baixo na integrada saiu −19%, numa medida de 1 par com chamadas de desenho variando por causa dos bots: no fim da Onda 1 ela tinha dado +30% no mesmo caso. Fica a confirmar num bench maior.
- **Meta de 60 FPS:**
  - na dedicada, o Baixo bate em tudo e o Médio bate no Sanatório e na Vila (62–63);
  - na integrada, o Médio fica em 45–51.

### 2.3 O que o conteúdo novo custou

- **Onda 2:** +9 a +27 chamadas de desenho (os interativos), cerca de −4 a −5% no Sanatório Médio em relação ao fim da Onda 1. Fica dentro do ganho da Onda 1.
- **Onda 3:** o clássico não ganhou nenhuma chamada de desenho (fim da Onda 2 513/674 → HEAD 513/671), e a diferença ficou no ruído.
- **Arenas dos chefes:**
  - na placa dedicada (RTX 4050, Médio): Forte 749 FPS, Forno 589, Galeria 7 749, sem nenhum quadro acima de 50 ms;
  - na integrada, as três arenas têm travadas (1% low de 2 a 6 FPS no Médio) dentro das chamadas de GL da própria placa, não no código;
  - nenhuma compila shader no meio da luta.

## 3. Mudanças por frente

### Frente A: otimização do modo zumbi (Onda 1)
- **Perfil primeiro:** os sistemas do modo zumbi (IA, rede, áudio, scripts) custam menos de 1 ms cada, e o gargalo era o custo de desenhar. Os agentes de sistema foram suspensos e a frente foi redirecionada para o desenho.
- **Mudanças:**
  - A10: raios (tiro, visão, apoio) sem alocar e só contra as caixas perto, de 0,1–0,3 para ~0,01 ms, com resultado idêntico;
  - A15: plano de dupla face numa passada só;
  - A30: matrizes paradas congeladas, −30% no `updateMatrixWorld`;
  - A33: menos troca de programa;
  - A34: 0 compilações na partida.
- **Revertido:** A31 (opacos ordenados por shader). Ele dobrava o tempo de GPU com a horda, porque perdia a ordem de frente para trás.

### Frente B: resto do jogo e mapas (Onda 1)
- **Mapas zumbi:**
  - B01/B02: junção de peças paradas por área e recorte além da névoa (o recorte respeita o céu desde o O2-B02s);
  - B03: oclusão por área;
  - B21: transparentes parados juntados.
- **Placa de vídeo:**
  - B05: sombra do Alto em cache, de 7–22 para menos de 1 ms;
  - B06: memória de vídeo, Vila Médio 270 → 214 MB;
  - B07: sem vazamento de geometria;
  - B10: cor por área sem cópia de tela;
  - B16: corte por pixel no Baixo.
- **Carga e menu:**
  - B08/B04pc: armas do PvP prontas antes da partida;
  - B11: menu em 1,4–2,4 s, antes 13–15 s;
  - B11b: aquecimento resiste a contexto perdido;
  - B15: troca de gráfico.
- **Visual:** B18 e B19 corrigiram problemas visuais da Vila e do Sanatório.

### Frente C: distribuição e interativos (Onda 2)
- **Auditoria** (`auditoria_itens.md`, ferramenta `tools/itens/auditoria.mjs`): o inventário dos dois mapas, 8 regras com números e uma ferramenta que reprova colisão, item sombreado, bloqueio de passagem e itens perto demais.
- **Redistribuição:**
  - bebidas fortes, PaP e Bowie foram para áreas de mais risco;
  - nenhuma arma de parede aparece mais de 2 vezes, e os gizes que sobravam viraram letais;
  - força × custo de portas (só compras): Sanatório 0,50, Vila 0,19.
- **Placas de giz:** cada placa mostra a silhueta do que vende.
- **Interativos novos,** com base comum `ZINT` (host valida, quem entra no meio recebe o estado):

| Tipo | Vila | Sanatório |
|---|---|---|
| Barril explosivo | 22 | 12 |
| Terminal com texto | 4 | 6 |
| Armadilha de fogo | 3 | — |
| Armadilha elétrica nova | 1 | 3 (presas à ala) |
| Interruptor | tranca da porteira | 3 alas |
| Atalho (corta-fogo, cerca, porteira) | 4 | 3 |
| Barricada reparável | 4 | 3 |
| Máquina de munição / Wunderfizz | munição | Wunderfizz |
| Baú / armário | baú do armeiro | armário de evidências |
| Sino da igreja (isca) | 1 | — |

### Frente D: campanha (Onda 3)
- **História** (`lore.md`): continua a bíblia da atmosfera (o Veio, a Galeria 7, o Dr. Aurélio, a quarentena) com os jogadores como a família 413. Inclui os textos dos 10 terminais, notas, rádio, falas e cenas.
- **Projeto** (`campanha.md`): 5 atos e 25 rodadas, cerca de 2 h. O menu passa a ter Clássico, Campanha e Infinito.

| Etapa | Mapa | Rodadas | Conteúdo |
|---|---|---|---|
| Ato I | Vila | 1–4 | sino, defender o gerador |
| Ato II | Vila | 5–9 | hospital, Estação, escoltar o Cabo Nogueira, alçapão |
| Chefe | Forte Velho | 10 | **O Vigia**: varredura que marca, rajada, pelotão, torre, baioneta |
| Ato III | Sanatório | 11–14 | livro, chave da Enfermeira-chefe, relatório 31, defender o Laboratório |
| Ato IV | Sanatório | 15–19 | Energia, três alas, registro da Torre d'água |
| Chefe | Casa do Forno | 20 | **O Foguista**: pá, porta do forno, brasa, apito, explosão; válvulas, esteira |
| Ato V | Galeria 7 | 21–25 | cargas, sobreviver; **O Diretor**: tanques, dose, maré, abraço, coro; fuga pela gaiola |
| Final | — | — | final (e "final completo" com os 22 documentos), créditos, Infinito liberado |

- **Zumbis novos:**
  - Vila: Penitente, Soldado, Afogado;
  - Sanatório: Enfermeiro, Contido, Carvoeiro, Pregador, e a elite Enfermeira-chefe.
  - Cada um tem uma contra-tática própria.
- **Eventos:** Apagão, Névoa do Veio, Estouro, Hora do Silêncio, Inchados, Contra o relógio e Lançamento aéreo, em agenda por rodada e a cada 5 rodadas no Infinito.
- **Infinito:** chefes de campo nas rodadas 20, 30 e 40, depois em rodízio com +25% de vida a cada volta; recorde por mapa.
- **Balanceamento:** curva em serrote, medida com robô em três dificuldades (`balanceamento.md`).
- **Clássico intocado:** todo código novo fica atrás de `CAMP.on`, e zumbis, chefes e eventos novos só aparecem na campanha e no Infinito.

### Frente E: validação contínua
- **Revisores ao fim de cada onda:**
  - A22 e B22: acharam o A31 e vazamentos;
  - E02: acharam o bug do baú;
  - D16: 9 correções.
- **Conferências e ferramentas novas:**
  - `auditoria.mjs` e `conferencia.mjs`, com `--camp`;
  - testes de integração da Onda 2;
  - campanha de ponta a ponta;
  - bench da campanha e das arenas;
  - `--gpuDedicada` no bench.
- **Ideias sem implementar:** `ideias.md`.

## 4. Bugs encontrados e corrigidos (principais)
- A31 dobrava o tempo de GPU na horda; foi revertido.
- O aquecimento quebrava quando o contexto WebGL era perdido (B11b).
- Vazamentos ao trocar de mapa e de gráfico (B07, B22).
- O recorte além da névoa apagava silhuetas contra o céu (O2-B02s).
- O baú trocava a arma errada (E02).
- Segurar F numa barricada consertava a janela de mesmo índice (C09).
- A placa de giz de toda letal desenhava um fuzil (C05).
- Na Hora do Silêncio, tiro com dano zero ainda dava pontos.
- O aviso de ataque dos chefes era desenhado duas vezes e reenviado.
- O pool de avisos e as brasas compilavam shader na luta.
- A nuvem de cal e a brasa repetiam a cada foto do mundo.
- A chave da Enfermeira-chefe às vezes não aparecia.
- Sete testes instáveis foram estabilizados sem ficar mais fracos.

## 5. Rede
O `PROTO` passou de 3 para 4: cliente e host de versões diferentes são recusados na sala. A lista das mensagens novas está em `notas: O3-D16/mensagens_rede.txt` e no relatório do D16.

## 6. Decisões tomadas pela recomendação (a confirmar)
1. **Meta de FPS:** 60 no Médio e no Baixo; a Vila Médio na integrada fica abaixo.
2. **Letais nos gizes:** gizes repetidos viraram letais (8 na Vila, 2 no Sanatório) para nenhuma arma aparecer mais de 2 vezes.
3. **Bebidas fortes nas áreas de fora:** Mule Kick, Dying Wish e outras foram para áreas de mais risco.
4. **Explosões no jogador:** o barril explosivo fere o jogador (como a granada); o fogo fere mesmo com PhD.
5. **Anel externo do Sanatório:** as lâmpadas falham até alguém pagar 1000 no interruptor.
6. **Arenas e campanha:**
   - as três arenas são mapas próprios;
   - a campanha atravessa os dois mapas;
   - as portas da história abrem de graça;
   - o progresso fica salvo no navegador;
   - os zumbis e chefes novos só aparecem fora do clássico.
7. **Carniceiro:** ganhou nome e história (Fermino); os textos dos terminais mudaram também no clássico.
8. **Vida dos chefes:** Foguista ×1,5 e Diretor ×1,7. As lutas ainda ficam abaixo da meta de tempo; o resto fica para o playtest.
9. **Final completo:** conta os documentos lidos pela sala nesta campanha.

## 7. Pendências
- **Possível exploit de pontos:** quem sai e entra de novo com outro nome recebe o kit da etapa outra vez. Sugestão: guardar os nomes que já receberam.
- **`maxK` da curva:** nenhum código lê esse campo. Ligar ou tirar.
- **Vazamento lento:** ~6 texturas por campanha inteira, origem não localizada.
- **Integrada nas arenas:** travadas na placa integrada. Opção: pedir a placa de alto desempenho ao navegador.
- **Carpinteiro:** não conserta as barricadas, só as janelas.
- **Quick Revive esgotado:** fica sem aviso.
- **Contraste dos gizes:** baixo nas paredes claras do Sanatório.
- **Mais ideias:** em `ideias.md`.
- **Push:** nada foi enviado; espera a aprovação.
