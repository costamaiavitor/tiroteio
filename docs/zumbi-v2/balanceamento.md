# Balanceamento dos zumbis (zumbi-v2, Etapa 1)

Todos os números ficam em `zumbi_config.js` (`ZBAL.tamanho`, `ZBAL.marcha`, `ZBAL.tipos`). O código (`zTamanho` no `index.html`) só aplica as fórmulas.

## Fórmulas

Seja `s` o tamanho do tipo (1 = zumbi comum):

- **Velocidade** = passo da marcha (anda / trota / corre, sorteado como antes pela rodada) × `s^-1,5` × velocidade da dificuldade.
- **Dano por golpe** = dano da dificuldade × `s^2,5`, preso entre 15 e 90.
- **Intervalo e preparo do golpe** = 1,2 s e 0,45 s × `s^1` × ritmo da dificuldade.

Consequências:

- DPS ∝ `s^1,5`: o grande bate mais forte, mas chega mais devagar.
- A "ameaça" (DPS × √ da velocidade relativa) fica perto da do zumbi comum, menos onde o teto de 90 corta (ver a tabela).
- **Teto do golpe (90):** nenhum golpe derruba o jogador sem Juggernog (100 de vida) de uma vez. Antes, o Brutamonte no Pesadelo dava 120.
- **Piso do golpe (15):** nem o menor zumbi no Fácil fica inofensivo.
- **Marcha por tipo:** o Brutamonte e o Explosivo nunca correm, o Veloz sempre corre e o Gritador sempre trota.
- **Fora destas fórmulas:** o Carniceiro (chefe), os cães e os tipos da campanha mantêm a regra própria.

## Tabela (marcha máxima de cada tipo, média do sorteio de passo)

**Medido pelo revisor R1:** o ciclo de um golpe é o intervalo × o ritmo da dificuldade **mais** o preparo do golpe.

| Modo | Tipo | Tamanho | Marcha (máx.) | Velocidade m/s | Dano/golpe | Ciclo do golpe s | DPS | Golpes até cair (100 / Jug 250) |
|---|---|---|---|---|---|---|---|---|
| Fácil | Zumbi | 1 | corre | 4.83 | 34 | 2.13 | 16.0 | 3 / 8 |
| Fácil | Brutamonte | 1.32 | trota | 2.40 | 68 | 2.81 | 24.2 | 2 / 4 |
| Fácil | Explosivo | 1.05 | trota | 3.38 | 38 | 2.24 | 17.0 | 3 / 7 |
| Fácil | Veloz | 0.86 | corre | 6.06 | 23 | 1.83 | 12.6 | 5 / 11 |
| Fácil | Tóxico | 1 | corre | 4.83 | 34 | 2.13 | 16.0 | 3 / 8 |
| Fácil | Gritador | 1.04 | trota | 3.43 | 38 | 2.22 | 17.2 | 3 / 7 |
| Normal | Zumbi | 1 | corre | 5.25 | 50 | 1.89 | 26.5 | 2 / 5 |
| Normal | Brutamonte | 1.32 | trota | 2.60 | 90 | 2.49 | 36.1 | 2 / 3 |
| Normal | Explosivo | 1.05 | trota | 3.67 | 56 | 1.98 | 28.2 | 2 / 5 |
| Normal | Veloz | 0.86 | corre | 6.58 | 34 | 1.63 | 20.9 | 3 / 8 |
| Normal | Tóxico | 1 | corre | 5.25 | 50 | 1.89 | 26.5 | 2 / 5 |
| Normal | Gritador | 1.04 | trota | 3.72 | 55 | 1.97 | 28.0 | 2 / 5 |
| Difícil | Zumbi | 1 | corre | 5.51 | 60 | 1.71 | 35.1 | 2 / 5 |
| Difícil | Brutamonte | 1.32 | trota | 2.73 | 90 | 2.26 | 39.9 | 2 / 3 |
| Difícil | Explosivo | 1.05 | trota | 3.85 | 68 | 1.80 | 37.9 | 2 / 4 |
| Difícil | Veloz | 0.86 | corre | 6.91 | 41 | 1.47 | 27.9 | 3 / 7 |
| Difícil | Tóxico | 1 | corre | 5.51 | 60 | 1.71 | 35.1 | 2 / 5 |
| Difícil | Gritador | 1.04 | trota | 3.91 | 66 | 1.78 | 37.1 | 2 / 4 |
| Pesadelo | Zumbi | 1 | corre | 5.67 | 75 | 1.65 | 45.5 | 2 / 4 |
| Pesadelo | Brutamonte | 1.32 | trota | 2.81 | 90 | 2.18 | 41.3 | 2 / 3 |
| Pesadelo | Explosivo | 1.05 | trota | 3.96 | 85 | 1.73 | 49.1 | 2 / 3 |
| Pesadelo | Veloz | 0.86 | corre | 7.11 | 51 | 1.42 | 35.9 | 2 / 5 |
| Pesadelo | Tóxico | 1 | corre | 5.67 | 75 | 1.65 | 45.5 | 2 / 4 |
| Pesadelo | Gritador | 1.04 | trota | 4.02 | 83 | 1.72 | 48.4 | 2 / 4 |


- **Teto de 90:** o Brutamonte no Difícil e no Pesadelo fica abaixo da fórmula (ameaça −20% e −36% em relação ao comum). É a escolha "nada derruba de um golpe".
- **O teto só vale para os tipos do clássico:** os chefes da campanha mantêm o golpe próprio.
- **Brutamonte nas rodadas baixas:** anda a 0,86–1,19 m/s (antes 1,35) e só trota a partir das rodadas em que os zumbis trotam.

## Antes × depois (Normal)

| Tipo | Antes: velocidade / golpe / intervalo | Depois |
|---|---|---|
| Brutamonte | 1,3–2,8 m/s (sobe com a rodada) / 80 / 1,5 s | 2,1–3,0 m/s / 90 / 1,9 s |
| Veloz | 6,0–6,5 m/s / 35 / 1,44 s | 6,3–6,9 m/s / 34 / 1,24 s |
| Explosivo, Gritador | ~3,2 m/s trotando / 50 / 1,44 s | 3,3–4,1 m/s / 56 / 1,5 s |
| Zumbi comum e Tóxico | sem mudança | sem mudança |

## Teto de velocidade (decisão do dono, 13/10)

Nenhum zumbi do clássico passa do cão mais rápido da dificuldade (`ZBAL.tamanho.velMax`): Fácil 5,6, Normal 6,1, Difícil 6,4 e Pesadelo 6,4 m/s.
Quem passaria do teto fica entre 96% e 100% dele. Na prática só o Veloz é afetado (média antes: 6,06 / 6,58 / 6,91 / 7,11 m/s; máximo no Pesadelo
chegava a 8). O jogador correndo faz 7,4 m/s com arma leve, então sempre consegue abrir distância de um Veloz; andando (5,1) não.

## Pack-a-Punch em oferta

Com o poder da fogueira (PaP em oferta, 30 s) os níveis custam 1000, 3000 e 5000 (`ZBAL.pap.oferta`), em vez de 5000, 10000 e 20000.

## Energia

A energia cai sempre numa área de custo médio: custo somado das portas até a área entre 1500 e 3500 (`ZBAL.lugares.energiaCusto`), no lugar
original dela (se for médio) ou trocando com um giz de parede. Sanatório: 9 lugares possíveis (áreas D, E, G, H, I, J, K, L, N); Vila: 2 (F e G).

## Ajustes de arma

`ZBAL.armas.ajuste`: Kar98k 600 de dano (era 400) e M16 com `rate` .22 (era .32). Só existem no modo zumbi; o PaP é calculado a partir daí.

## Balanceamento final 13/10

Pedido do dono: "deixa os modos mais balanceados, o médio [Normal] está MUITO DIFÍCIL"; o infinito "desafiador mas balanceado". Medido no
estado final dos objetivos do mapa (comum −7% de vida e golpe máx. 40, Normal ×0,9 de zumbis e vida voltando em 3 s, Tanque, chefes ×2,5,
fuga com zona de 4,5 m que pausa) e ajustado **só por valores** no `zumbi_config.js`. Nenhuma linha do `index.html` mudou.

### Como foi medido

- Robô do validador V2 (`bot.js`: anda pela grade, atira com a tabela de armas, recua de quem chega perto; o host não cai: cada vez que a vida
  chegaria a 0 conta uma **queda virtual** e a vida volta cheia). Dois perfis:
  - **médio** (o jogador médio do pedido): 69/60/45% de acerto (perto/meio/longe), 16% na cabeça, 1 s sem atirar a cada 4 (para se mexer),
    recua de quem estiver a menos de 3 m, fica a até 12 m do ponto, compra munição quando acaba;
  - **bom**: 92/80/60% de acerto, 40% na cabeça, atira sem parar (o robô original do V2).
- Pressão: uma janela de 120 s de cada rodada (depois dos 10 s iniciais), todas as portas abertas, energia ligada, robô no ponto de
  nascimento, kit de quem chega na rodada: r<4 M14 + M1911; r<8 MP40 + M14 + Juggernog; r<13 Galil + MP40 + Jug + Speed; r<18 Galil PaP +
  FAL + 4 bebidas; r<23 Galil PaP + FAL PaP; r<28 Galil PaP II + FAL PaP; r<33 Galil PaP II + FAL PaP II; depois Galil PaP III.
  "obj" = com a primeira etapa ativa (agenda e curva do mapa); "inf" = depois dos objetivos (escalada do infinito).
- Medidas: mediana do dano recebido por minuto, mediana das quedas virtuais por minuto, % das amostras com alguma queda e a duração estimada
  da rodada (pelo ritmo de abates). 2 a 5 amostras por célula; a variação entre amostras é grande (uma amostra em que o robô fica encurralado
  soma várias quedas), por isso a mediana e o "% com queda".
- O robô fica parado lutando num ponto: leva mais dano que um jogador que anda e treina os zumbis, e não desvia dos ataques avisados dos
  chefes. Os números servem para **comparar** dificuldades e versões, não como o que um jogador vai sentir.
- Scripts e saídas: `C:\dev\tiroteio-notas\work\obj\R2\` (`pr.mjs`, `lote.mjs`, `ch.mjs`, `fu.mjs`, `tab.mjs`, `pr.txt`, `ch.txt`).

### O que mudou

| Valor (`ZBAL`) | Antes | Agora | Por quê |
|---|---|---|---|
| Normal: quantidade (`dificuldade[1].cnt`) | 0,9 | 0,85 | menos zumbis por rodada |
| Normal: vida (`hp`) | 1 | 0,9 | o robô médio matava mais devagar do que eles chegavam (Sanatório r10: ~25 abates/min contra ~48 nascendo/min) |
| Normal: velocidade (`spd`) | 1 | 0,95 | ainda mais rápido que o Fácil (0,92) |
| Normal: correr (`run`) | 0 | −8 | todos correndo a partir da r10 em vez da r9 |
| Normal: intervalo do golpe (`atk`) | 1,2 | 1,3 | um golpe a cada 1,56 s em vez de 1,44 s |
| Normal: vivos ao mesmo tempo (`max`) | 24 | 20 | a pressão vinha do enxame que se acumula quando o jogador não acompanha |
| Normal: espaço entre nascimentos (`spawn`) | 1 | 1,15 | a onda chega mais espaçada |
| Normal: vida volta (`regen` / `rgn`) | 3 s / 20 por s | 3 s / 22 por s | volta 10% mais rápido |
| Normal: texto do menu (`desc`) | "um pouco menos de zumbis…" | "menos zumbis e um pouco mais fracos que no clássico, começam a correr mais tarde…" | o texto acompanha os números |
| Chefes dos objetivos (`chefes.vidaK`) | 2,5 | 2,8 | a vida do chefe também passa pelo `hp` da dificuldade: compensa os 10% a menos do Normal |
| Fácil, Difícil, Pesadelo, comum, Tanque, fuga, infinito | — | sem mudança | ver abaixo |

A vida e a velocidade do Normal valem para tudo o que passa pela dificuldade: cães, Carniceiro e especiais do Normal também ficam com 90% da
vida, e os chefes andam 5% mais devagar no Normal (a tabela de fases dos chefes é a velocidade × a da dificuldade; os testes das fases
foram atualizados para o × 0,95). O clássico (`__semObjetivos`, só nos testes) usa a mesma tabela: a referência do `tipos-zumbi` foi
regravada depois de conferir que, com o `zumbi_config.js` de antes, ela batia (2/2) e que as diferenças são só vida × 0,9, quantidades
e velocidades.

### Pressão do Normal, antes × depois (robô médio)

Mediana das quedas por minuto / % das amostras com queda.

| Rodada | Sanatório antes | Sanatório agora | Vila antes | Vila agora |
|---|---|---|---|---|
| 5 (obj) | 1,0 / 100% | 0 / 0% | 0 / 33% | 0 / 25% |
| 10 (obj) | 6,7 / 100% | 0,3 / 50% | 0 / 33% | 0,4 / 50% |
| 15 (obj) | 6,0 / 100% | 0,5 / 75% | 0 / 0% | 0,4 / 50% |
| 20 (inf) | 30 / 100% | 4,5 / 100% | 3,8 / 50% | 9,3 / 100% |
| 30 (inf) | 38,8 / 100% | 24,2 / 100% | 11,8 / 100% | 5,8 / 100% |

Antes o Normal era dois jogos diferentes: tranquilo na Vila e impossível no Sanatório (6–7 quedas por minuto já na r10, ou seja, um jogador
médio caindo várias vezes por rodada). Agora os dois mapas ficam parecidos até a r15: menos de meia queda por minuto do robô parado, que um
jogador andando evita. A Vila não mudou de forma mensurável (as diferenças estão dentro da variação de 3–4 amostras). Um passo intermediário
(só `cnt` .85, `spd`, `atk`, `max`, `spawn`, `rgn`, sem `hp` e `run`) deixou o Sanatório r15 ainda em 4 quedas/min: por isso a vida e a corrida.

### Por dificuldade (final)

Mediana das quedas por minuto (% com queda). Fácil, Difícil e Pesadelo não mudaram: os números são da medição de antes; Normal é a de agora.

| Mapa, rodada | Fácil (médio) | Normal (médio) | Difícil (médio) | Difícil (bom) | Pesadelo (médio) | Pesadelo (bom) |
|---|---|---|---|---|---|---|
| Sanatório 5 | 0 (0%) | 0 (0%) | 20,4 (100%) | 0 (0%) | 5,4 (100%) | 1,1 (50%) |
| Sanatório 10 | 0 (0%) | 0,3 (50%) | 18,6 (100%) | 3,0 (100%) | 18,2 (100%) | 5,7 (100%) |
| Sanatório 15 | 0 (0%) | 0,5 (75%) | 14,0 (100%) | 0 (0%) | 39,5 (100%) | 3,2 (50%) |
| Vila 5 | 0 (0%) | 0 (25%) | 3,5 (50%) | 0 (0%) | 9,9 (100%) | 1,5 (50%) |
| Vila 10 | 0 (0%) | 0,4 (50%) | 3,3 (100%) | 0 (0%) | 11,5 (100%) | 5,0 (100%) |
| Vila 15 | 0 (0%) | 0,4 (50%) | 0,9 (100%) | 0,3 (50%) | 8,3 (100%) | 0 (0%) |
| Sanatório 20 inf | 2,5 | 4,5 | 32 | 1,5 | 72 | 14 |
| Sanatório 30 inf | 15,8 | 24,2 | 53 | 37 | 76 | 31 |
| Vila 20 inf | 0,6 | 9,3 | 12,5 | 2,1 | 31,5 | 12,7 |
| Vila 30 inf | 1,7 | 5,8 | 26 | 20 | 6,3 | 9,2 |

- **Fácil**: nenhuma queda do robô médio até a r15 nos dois mapas; fica fácil.
- **Normal**: desafiador, mas o jogador médio passa da r15 sem cair (robô parado: até meia queda por minuto). O robô bom não cai até a r25 do
  infinito.
- **Difícil e Pesadelo**: para o jogador médio, bem mais duros (Difícil 1–20 quedas/min, Pesadelo 5–40). Para o jogador bom, o Difícil fica
  parecido com o Normal do médio e o Pesadelo segue duro (1–6 quedas/min nos objetivos). Ficaram como estavam: "bem mais duros" é o pedido.

### Chefes (robô médio, versão de campo, rodada em que se costuma chegar a eles)

| Chefe | Dificuldade | Rodada, kit | Antes (vidaK 2,5) | Agora (vidaK 2,8) |
|---|---|---|---|---|
| Vigia (Vila) | Fácil | r9, Galil + MP40 | 0,9 min | ~1,0 min (estimado: vida +12%) |
| Vigia | Normal | r9, Galil + MP40 | 1,4 e 1,8 min | 1,7 min |
| Foguista (Sanatório) | Normal | r11, Galil + MP40 | 1,4 e 1,7 min | 2,1 min |
| Diretor (Sanatório) | Normal | r13, Galil PaP + FAL | 1,6 e 1,3 min | 1,5 min |
| Vigia | Pesadelo | r9 | 3,4 min | ~3,8 min (estimado) |
| Foguista | Pesadelo | r11 | — | 2,9 min |
| Diretor | Pesadelo | r13 | 1,8 min | ~2,0 min (estimado) |

O robô médio não para de atirar para desviar dos ataques avisados nem cai; um jogador comum leva ~1,3–1,5× isso: no Normal, ~2–3 min,
no meio do 1,5–4 min do projeto. O robô bom mata o Vigia do Normal em ~25 s (com 2,5): para quem joga bem o chefe não segura. No Pesadelo
a luta passa de 3 min; não ficou interminável. O dano que o robô parado leva do chefe (30–100 quedas virtuais por luta) não serve de medida:
quem desvia dos avisos não leva a maior parte.

### Fuga

Na rodada 14–15 com Galil PaP + FAL e 4 bebidas, começando ao lado da ambulância: a fuga termina em ~10 s (o embarque) sem queda, no Normal e
no Pesadelo. Com a zona de 4,5 m e o embarque que só pausa, a dificuldade da fuga é chegar até a Portaria no Estouro sem fim, não segurar a
zona. Sem mudança.

### Infinito

Normal, robô bom: nenhuma queda até a r25; ~5 quedas/min na r30 e r35; ~9–11 na r40 (mediana de 2 amostras), com a rodada passando de 15 min (zumbi comum com ~15 mil de vida
na r40 do Normal contra a Galil PaP III). A escalada (+2% de zumbis por rodada depois da 15, até +40%) não é o que pesa: com +1,5% por rodada até +30%
as medidas ficaram iguais dentro da variação (r30: 2,5–3,5 quedas/min contra 4,5–5,5; r40: 13,5–46 contra 9–11, uma amostra por célula na versão reduzida). O que cresce é a vida do zumbi
(10% por rodada, como no CoD) contra o teto das armas. Fica como estava: cresce sem explodir até a r35 e vira muro perto da r40, o que é o
infinito do CoD. Com o Normal mais leve, o infinito do Normal também ficou mais leve (Sanatório r20: 30 → 4,5 quedas/min do robô médio).

### Limites desta medição

- 2 a 5 amostras por célula; a comparação da escalada reduzida do infinito teve uma amostra por célula: é indicação, não medida.
- O robô não joga os objetivos durante a medição de pressão (fica lutando); a partida inteira com objetivos não foi rejogada depois do ajuste.
- Os chefes foram medidos uma vez por dificuldade depois do ajuste; os "estimados" escalam a vida medida antes.
