# Balanceamento dos zumbis (zumbi-v2, Etapa 1)

Todos os números ficam em `zumbi_config.js` (`ZBAL.tamanho`, `ZBAL.marcha`, `ZBAL.tipos`). O código (`zTamanho` no `index.html`) só aplica as fórmulas.

## Fórmulas

Seja `s` o tamanho do tipo (1 = zumbi comum):

- **Velocidade** = passo da marcha (anda / trota / corre, sorteado como antes pela rodada) × `s^-1,5` × velocidade da dificuldade.
- **Dano por golpe** = dano da dificuldade × `s^2,5`, preso entre 15 e 90.
- **Intervalo e preparo do golpe** = 1,2 s e 0,45 s × `s^1` × ritmo da dificuldade.

Consequências:

- DPS ∝ `s^1,5`: o grande bate mais forte, mas chega mais devagar.
- A "ameaça" (DPS × √ da velocidade relativa) fica perto da do zumbi comum em todos os tipos, de −12% a +7%.
- **Teto do golpe (90):** nenhum golpe derruba o jogador sem Juggernog (100 de vida) de uma vez. Antes, o Brutamonte no Pesadelo dava 120.
- **Piso do golpe (15):** nem o menor zumbi no Fácil fica inofensivo.
- **Marcha por tipo:** o Brutamonte e o Explosivo nunca correm, o Veloz sempre corre e o Gritador sempre trota.
- **Fora destas fórmulas:** o Carniceiro (chefe), os cães e os tipos da campanha mantêm a regra própria.

## Tabela (marcha máxima de cada tipo, média do sorteio de passo)

| Modo | Tipo | Tamanho | Marcha (máx.) | Velocidade m/s | Dano/golpe | Intervalo s | DPS | Ameaça (DPS·√(v/v₀)) | Golpes até cair (100 / Jug 250) |
|---|---|---|---|---|---|---|---|---|---|
| Fácil | Zumbi | 1 | corre | 4.83 | 34 | 1.68 | 20.2 | 20.2 | 3 / 8 |
| Fácil | Brutamonte | 1.32 | trota | 2.40 | 68 | 2.22 | 30.7 | 21.6 | 2 / 4 |
| Fácil | Explosivo | 1.05 | trota | 3.38 | 38 | 1.76 | 21.5 | 18.0 | 3 / 7 |
| Fácil | Veloz | 0.86 | corre | 6.06 | 23 | 1.44 | 15.9 | 17.8 | 5 / 11 |
| Fácil | Tóxico | 1 | corre | 4.83 | 34 | 1.68 | 20.2 | 20.2 | 3 / 8 |
| Fácil | Gritador | 1.04 | trota | 3.43 | 38 | 1.75 | 21.7 | 18.3 | 3 / 7 |
| Normal | Zumbi | 1 | corre | 5.25 | 50 | 1.44 | 34.7 | 34.7 | 2 / 5 |
| Normal | Brutamonte | 1.32 | trota | 2.60 | 90 | 1.90 | 47.3 | 33.3 | 2 / 3 |
| Normal | Explosivo | 1.05 | trota | 3.67 | 56 | 1.51 | 37.0 | 31.0 | 2 / 5 |
| Normal | Veloz | 0.86 | corre | 6.58 | 34 | 1.24 | 27.5 | 30.7 | 3 / 8 |
| Normal | Tóxico | 1 | corre | 5.25 | 50 | 1.44 | 34.7 | 34.7 | 2 / 5 |
| Normal | Gritador | 1.04 | trota | 3.72 | 55 | 1.50 | 36.7 | 30.9 | 2 / 5 |
| Difícil | Zumbi | 1 | corre | 5.51 | 60 | 1.26 | 47.6 | 47.6 | 2 / 5 |
| Difícil | Brutamonte | 1.32 | trota | 2.73 | 90 | 1.66 | 54.1 | 38.1 | 2 / 3 |
| Difícil | Explosivo | 1.05 | trota | 3.85 | 68 | 1.32 | 51.4 | 43.0 | 2 / 4 |
| Difícil | Veloz | 0.86 | corre | 6.91 | 41 | 1.08 | 37.8 | 42.4 | 3 / 7 |
| Difícil | Tóxico | 1 | corre | 5.51 | 60 | 1.26 | 47.6 | 47.6 | 2 / 5 |
| Difícil | Gritador | 1.04 | trota | 3.91 | 66 | 1.31 | 50.4 | 42.4 | 2 / 4 |
| Pesadelo | Zumbi | 1 | corre | 5.67 | 75 | 1.20 | 62.5 | 62.5 | 2 / 4 |
| Pesadelo | Brutamonte | 1.32 | trota | 2.81 | 90 | 1.58 | 56.8 | 40.0 | 2 / 3 |
| Pesadelo | Explosivo | 1.05 | trota | 3.96 | 85 | 1.26 | 67.5 | 56.4 | 2 / 3 |
| Pesadelo | Veloz | 0.86 | corre | 7.11 | 51 | 1.03 | 49.4 | 55.3 | 2 / 5 |
| Pesadelo | Tóxico | 1 | corre | 5.67 | 75 | 1.20 | 62.5 | 62.5 | 2 / 4 |
| Pesadelo | Gritador | 1.04 | trota | 4.02 | 83 | 1.25 | 66.5 | 56.0 | 2 / 4 |


## Antes × depois (Normal)

| Tipo | Antes: velocidade / golpe / intervalo | Depois |
|---|---|---|
| Brutamonte | 1,3–2,8 m/s (sobe com a rodada) / 80 / 1,5 s | 2,1–3,0 m/s / 90 / 1,9 s |
| Veloz | 6,0–6,5 m/s / 35 / 1,44 s | 6,3–6,9 m/s / 34 / 1,24 s |
| Explosivo, Gritador | ~3,2 m/s trotando / 50 / 1,44 s | 3,3–4,1 m/s / 56 / 1,5 s |
| Zumbi comum e Tóxico | sem mudança | sem mudança |
