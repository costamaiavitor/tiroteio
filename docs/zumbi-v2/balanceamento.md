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
