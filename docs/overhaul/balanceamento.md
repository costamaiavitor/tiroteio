# Balanceamento da campanha (O3-D15)

Domínio do O3-D15 (`campanha.md` §17): os números de `CAMP_CURVA`, `CAMP_KIT`, `CAMP_MIX` e das vidas dos chefes, a medição (§10, §15) e os testes (§16). Este documento traz a curva que as tabelas dão, o que foi medido com o robô do bench, o que mudou e por quê, e o que fica para o playtest.

## 1. Ferramentas

| Arquivo | O que faz |
|---|---|
| `tools/bench/bench-campanha.mjs` | `--modo balanco` (padrão): joga cada etapa (I, II, C1, III, IV, C2, V) com o kit do checkpoint, no relógio travado (`T.sim`, 60 Hz, SwiftShader), 1 ou 2 jogadores, por dificuldade; mede por rodada a duração, os zumbis de cada tipo, o dano recebido, as quedas, a queda do time, tiros (munição gasta), abates, pontos; por etapa o tempo total e o da luta do chefe. `--ref 1` joga o clássico no mesmo mapa e nas mesmas rodadas, com o mesmo kit; `--inf vila --inicio 20 --ate 20` joga o infinito (chefes de campo); `--inicio 25` começa a etapa numa rodada (o Diretor sozinho). `--modo curva`: só lê as tabelas (vida, zumbis, carga, carga do clássico, dps do kit, vida dos chefes). `--modo fps`: jogo de verdade na placa de vídeo, com o robô jogando em tempo real, na rodada escolhida de cada etapa: FPS, 1% low, p50/p90/p99, quadro máximo, chamadas de desenho, zumbis e lacaios, programas, carga, e a lista dos quadros lentos com o que mudou neles |
| `tools/bench/robo-campanha.mjs` | o robô (usado pelo bench e pelo teste) |
| `tools/bench/resumo-campanha.mjs` | tabelas Markdown a partir dos JSON do bench (média ± desvio das repetições; `--rodadas 1` por rodada) |
| `tests/campanha-balanco.test.mjs` | tabelas inteiras e coerentes; a curva do §2 (Normal, 1 jogador) e a vida dos chefes; serrote pela arma do kit; o robô termina o Ato I e o Vigia sem rodada travada |

**O robô** (deliberadamente simples, para comparar etapas, versões e dificuldades entre si):
- fica no ponto de nascimento e recua (5,1 m/s, a corrida do modo zumbi) do zumbi a menos de 3 m, pela grade de navegação, até 30 m de casa;
- atira no zumbi visível mais perto com a melhor arma do kit (cadência, pente e recarga da arma, Speed Cola), 70% de acerto, 25% dos acertos na cabeça, metade dos acertos no ponto fraco aberto do chefe; o dano passa pelo `zHit` do host (capacete, crosta, Silêncio, tetos); faca no zumbi a 2 m que morre com duas facadas; faca na Hora do Silêncio;
- com o Diretor protegido, atira nos tanques; **não usa** o curto do Vigia, as válvulas do Foguista, as junções nem barris, granadas, armadilhas, Caixa ou compras (só o kit);
- vida virtual com a regeneração do ZDIFF: o jogador nunca cai de verdade (a etapa vai até o fim); quando a vida virtual zera conta uma queda; sozinho e sem Quick Revive é a **queda do time** (no jogo, o checkpoint), contada uma vez por rodada;
- objetivos cumpridos na hora (`campForca`), menos o `matar`: **o tempo de andar até os objetivos e de cumpri-los não está no tempo medido**;
- preso sem ver ninguém volta para casa; o último zumbi preso longe cai como "caçado"; o chefe escondido, ele vai até perto.

O robô é fraco na defesa (cai uma vez por rodada a partir do Ato II **também no clássico**, com o mesmo kit e nas mesmas rodadas) e forte no tiro (fogo contínuo, 70%). Por isso: os tempos de rodada e as comparações (HEAD × proposta, campanha × clássico, dificuldades, jogadores) valem; a taxa de queda do time **não** mede a meta do §10 ("morte do time em menos de 50% das tentativas"), que fica para o playtest.

## 2. A curva (tabelas, Normal, 1 jogador)

`node tools/bench/bench-campanha.mjs --modo curva --dif 1 --np 1`. Esforço = vida × zumbis ÷ dano por segundo da melhor arma do kit (sem errar): o "tamanho" da rodada para quem está com o kit do checkpoint.

| Etapa | Rodada | Vida do comum | Zumbis | Carga (clássico) | Arma do kit (dps) | Esforço |
|---|---|---|---|---|---|---|
| I | 1 → 4 | 135 → 405 | 5 → 16 | 675 → 6 480 (900 → 8 100) | M1911 (206) | 3 → 31 s |
| II | 5 → 9 | 550 → 950 | 24 → 34 | 13 200 → 32 300 (igual) | MP40 (500) | 26 → 65 s |
| C1 | 10 | 1 045 | 16 + lacaios | Vigia 10 450 | MP40 (500) | 33 s + 21 s do chefe |
| III | 11 → 15 | 1 150 → 1 683 | **36 → 49** (era 38 → 51) | 41 400 → 82 467 (46 000 → 90 882) | M14 (667) | **62** → 124 s |
| IV | 16 → 19 | 1 944 → 2 587 | 58 → 68 | 112 752 → 175 916 (107 358 → 167 552) | Galil (1 059) | 106 → 166 s |
| C2 | 20 | 2 846 | 20 + lacaios | Foguista **40 650** (era 27 100) | **Galil PaP (2 118)** | 27 s + 19 s do chefe |
| V | 21 → 24 | **3 131 → 4 166** (era 3 280 → 4 366) | 61 → 69 | 190 991 → 287 454 (226 632 → 341 248) | STG-44 PaP (2 000) | 95 → 144 s |
| final | 25 | 4 583 | 12 + lacaios | Diretor **89 483** (era 52 380) | STG-44 PaP (2 000) | 27 s + 45 s do chefe |

Serrote pela arma do kit: I acaba em 31 s e II começa em 26; II acaba em 65 e III começa em **62** (antes 66: o único ato que começava mais pesado que o fim do anterior); III acaba em 124 e IV começa em 106; IV acaba em 166 e V começa em 95. Dentro de cada ato a curva sobe.

`maxK` do `CAMP_CURVA` não é lido por nenhum código (o teto de vivos é o do `ZDIFF`; a Galeria 7 tem o próprio, `GAL7_RODADAS.vivos`). Ficou 1 em todas as etapas (sem efeito); ligar exigiria código (D02).

## 3. Medido (robô, Normal, 1 jogador)

Tempos em segundos de jogo. HEAD = f49d945 (com o O3-D14); proposta = HEAD + O3-D15. 2 repetições por etapa (C2 e o Diretor: 5 a 8). Desvio alto nas rodadas grandes: o robô às vezes fica preso numa sala.

| Etapa | Meta do §10 (min) | HEAD combate (s) | Proposta combate (s) | Chefe HEAD (s) | Chefe proposta (s) | Meta do chefe (s) |
|---|---|---|---|---|---|---|
| I | 10–12 | 158 ± 34 | 150 ± 7 | – | – | – |
| II | 15–18 | 324 ± 5 | 340 ± 39 | – | – | – |
| C1 Vigia | 3–5 | 310 ± 107 | 296 ± 138 | 310 ± 107 | 296 ± 138 | 180–300 |
| III | 18–22 | 551 ± 93 | 578 ± 0 | – | – | – |
| IV | 18–22 | 642 ± 108 | 644 ± 63 | – | – | – |
| C2 Foguista | 4–6 | 552 ± 335 (1 travada em 918) | 192 ± 17 / 207 ± 32 (5 rep.) | 552 ± 335 | 192–207 | 240–360 |
| V (21–24) + Diretor | 16–20 + 6–9 | 925 ± 83 | 887 ± 27 | 145 ± 11 | 179 ± 19 / 207 ± 78 (5 rep.) | 360–540 |

Por rodada (proposta, média): I 15 / 22 / 49 (Névoa) / 65; II 63 / 63 (Suprimento) / 109 / 16 (cães) / 89 (Apagão); III 131 / 105 / 49 (Silêncio) / 28 (cães) / 266 (Estouro); IV 127 / 147 (Inchados) / 190 / 179 (Relógio); V 149 / 123 (Névoa) / 219 / 212 (Névoa) / 183 (Diretor).

**Campanha × clássico** (`--ref 1`: mesmo mapa, mesmas rodadas, mesmo kit; 1 repetição, HEAD f3e1ec5, versão anterior do robô, coleira de 14 m): I 109–160 × 148; II 250–340 × 291; III 523–582 × 704; IV 595–682 × 550; V (21–25) 1 157 × 833. A campanha não fica mais pesada que o clássico até o Ato IV; o Ato V é mais longo por causa do Diretor.

**Tempo dos atos**: o combate medido é 25–50% da meta do §10 em todos os atos. A diferença é o que o robô não faz: andar até os objetivos, a defesa do gerador (45 s), a escolta, segurar o Laboratório (75 s), plantar as cargas, a fuga, comprar e abrir portas. A curva não deve compensar isso (mais zumbis deixariam a rodada mais difícil, não o ato mais longo); o tempo dos atos fica para o playtest.

**Chefes**: no robô, ~180 s da luta não dependem da vida (troca de fase invulnerável, subida na torre, mergulho e maré, aviso dos ataques, lacaios): com o Foguista a 27 100 a luta durou 187 s, a 40 650, 192–207 s. Por isso a vida subiu só ×1,5 (Foguista) e ×1,7 (Diretor): o jogador de verdade erra mais e dá menos tiro por segundo que o robô, e deve cair dentro da faixa; subir mais deixaria o chefe "esponja". O Vigia já estava na faixa com o kit do Ato II.

**Dificuldades e jogadores** (proposta, 1 repetição; combate s / chefe s / fração das rodadas com queda do time):

| Etapa | Fácil | Normal | Difícil | Normal, 2 jogadores |
|---|---|---|---|---|
| I | 128 / – / 0,00 | 150 / – / 0,25 | 176 / – / 0,50 | 138 / – / 0,00 |
| II | 229 / – / 0,20 | 340 / – / 0,70 | 381 / – / 0,60 | 317 / – / 0,20 |
| C1 | 167 / 167 / 1 | 296 / 296 / 1 | 579 / 579 / 1 | 151 / 151 / 0 |
| III | 296 / – / 0,80 | 578 / – / 1 | 814 / – / 1 | 437 / – / 0,80 |
| IV | 532 / – / 1 | 644 / – / 1 | 976 / – / 1 | 657 / – / 0,75 |
| C2 | 132 / 132 / 1 | 192 / 192 / 1 | 271 / 271 / 1 | 42 / 42 / 1 |
| V | 510 / 111 / 1 | 887 / 179 / 1 | 1 089 / 270 / 1 | 637 / 168 / 0,80 |

A ordem está certa em todas as etapas (Fácil < Normal < Difícil; 2 jogadores derrubam mais rápido e caem menos).

**Infinito** (chefes de campo, kit do Ato V, Normal, 1 jogador, 2 repetições): Vigia na 20 (Vila) 169–171 s (HEAD 100–155 s); Foguista na 30 (Sanatório) 228–580 s (a vida ×1,5 vale também na versão de campo: zHp(30) é 2,6× o da 20).

**Mistura dos tipos**: a garantia das cotas do D08 (`campZk2Garantia`) tira dos especiais do clássico, mas a mistura fica jogável: na rodada 16 saem ~22 especiais do clássico e ~8 novos (teto 29); na 19, ~18 do clássico e ~19 novos (o Carvoeiro com até 10); nenhum tipo do clássico zera. Inchados (17): 20–39 Explosivos de 61. `CAMP_MIX` sem mudança.

## 4. O que mudou (O3-D15.diff)

| Tabela | Antes | Depois | Por quê |
|---|---|---|---|
| `CAMP_CURVA.III.qtdK` | 0,95 | 0,90 | o Ato III começava mais pesado que o fim do II (esforço 66 × 65); agora 62 (serrote) |
| `CAMP_CURVA.V.vidaK` | 1,10 | 1,05 | o Ato V (com o Diretor) era o mais longo e o mais pesado em relação ao clássico (1 157 × 833 s); a vida do comum na 21 fica 3 131 |
| `CAMP_KIT.III.pts` | 3 500 | 4 000 | o estado esperado do §10 (~4 000) |
| `CAMP_KIT.C2` | Python + Galil, Jug + Speed | Python PaP + Galil PaP, Jug + Speed + Quick Revive | o estado esperado do §10 ("2 armas com PaP"); sem PaP a luta levava 552 ± 335 s (uma travou em 918) |
| `CAMP_CHEFE[15]` (Foguista) | base 6, porJog 4 | base 9, porJog 6 (×1,5) | com o kit de PaP a luta caía para ~190 s; meta 4–6 min |
| `CAMP_CHEFE[16]` (Diretor) | base 7, porJog 5 | base 12, porJog 8,5 (×1,7) | derrubando os tanques a luta durava ~145 s; meta 6–9 min |

Sem mudança, depois de medir: Atos I, II e IV, o Vigia, `CAMP_MIX`, os outros kits, os avisos dos chefes. Testes ajustados: `campanha-base` (kit do Ato III com 4 000), `campanha-diretor` e `campanha-foguista` (a vida vem da tabela).

## 5. Desempenho (`--modo fps`, robô jogando em tempo real)

Na placa dedicada (`--gpuDedicada 1`: o notebook é híbrido e o Chromium do Playwright usa a Intel UHD se não for forçado), 10 s por etapa, proposta:

| Etapa (rodada) | Médio: FPS (1% low) | p50 / p90 / p99 (ms) | Chamadas (máx) | Baixo: FPS (1% low) | Carga (ms) |
|---|---|---|---|---|---|
| I (4, Vila) | 66 (36) | 16,2 / 19,8 / 23,9 | 674 (691) | 86 (41) | 4 800–7 000 |
| III (15, Sanatório) | 108 (56) | 9,0 / 13,5 / 16,3 | 362 (427) | 119 (54) | 4 300–4 800 |
| C1 (10, Forte) | 749 (309) | 1,2 / 1,9 / 2,6 | 39 (40) | 795 (317) | 5 500–6 100 |
| C2 (20, Forno) | 589 (159) | 1,6 / 2,4 / 4,2 | 61 (73) | 583 (140) | 600–700 |
| V (24, Galeria 7) | 749 (182) | 1,1 / 2,1 / 3,7 | 60 (85) | 807 (183) | 600–700 |
| final (25, Diretor) | 529 (237) | 1,8 / 2,6 / 3,6 | 60 (62) | – | 6 000 |

Arenas: muito acima da meta do §15 (≥ 60 FPS, ≤ 250 chamadas). Nenhum quadro acima de 50 ms. Programas de shader: 0 novos no meio da luta, menos no Forno (47 → 49 no Médio, 44 → 46 no Baixo): o primeiro ataque `brasa` compila 2 programas na partida (pista para o D11/D16: aquecer o material da brasa no `warmUp` da arena).

## 6. O "1% low baixo nas arenas" (pendência do D09/D11/D13): é a placa integrada

Na Intel UHD (o padrão dos benches desta máquina), as três arenas têm quadros de 0,15 a 5 s a cada ~0,5–2 s (1% low 1,6–2,7 FPS no Médio, 11–38 no Baixo); Vila e Sanatório não (1% low 25–35). Medido:

1. O tempo está **dentro das chamadas de GL** do `renderer.render` (perfil de CPU de 8 s no Forno: `uniformMatrix4fv` 2,0 s, `texParameteri` 1,8 s, `bindVertexArray` 1,4 s, `drawElements` 1,1 s; o resto do quadro < 0,3 s). Não é JS, não é coleta de lixo, não é compilação (contador de programas parado), não é textura nova (só as texturas de ossos dos zumbis, 12×12 e 16×16, sobem a cada quadro, como na Vila).
2. **Não é a sombra do B05** (o B05 só roda no Alto; no Médio a sombra só é refeita quando um pilar muda de estado) **nem o modelo dos lacaios** (os quadros longos não coincidem com nascimento de zumbi, nem com troca de programa ou geometria).
3. Esconder cada grupo da cena (nuvens, avisos dos ataques, luzes, peças da arena) não tira as travadas. Elas também não somem com o backend GL do ANGLE (só D3D11 × GL), nem com vsync, nem depois de 2 min de partida.
4. O trabalho da GPU por quadro é pequeno (`gl.finish` depois do render: mediana 0,7 ms, p90 4,4 ms).
5. **Com `--force_high_performance_gpu` (RTX 4050), zero quadros acima de 50 ms**, máximo 5–40 ms, 1% low 140–317 FPS (tabela da seção 5).

Conclusão: é um comportamento do driver da Intel UHD (cena leve, quadro rápido: provável gerência de energia/clock da integrada), não um gargalo de código ou de número. As arenas são as únicas cenas leves o bastante para cair nisso. Proposta (fora do meu domínio, uma linha, para a Frente E/coordenador): os benches passarem `--force_high_performance_gpu` (ou medir as duas placas e dizer qual); e o D16 conferir num navegador com janela na integrada se o jogador vê as travadas (se vir, testar um teto de quadros nas arenas). O `bench-campanha.mjs` já tem `--gpuDedicada 1` e `--vsync 1`.

**Contador de lacaios 0 na Galeria 7**: não reproduz no host. No relógio travado, a chamada forçada põe 6 lacaios (2 Enfermeiros e 4 comuns) 1,8 s depois do aviso, o teto de 8 segura, e eles atravessam as trocas de fase 2 e 3 (2 Pregadores do coro entram como lacaios). No bench em tempo real, a primeira chamada sai depois da janela de medida. No HEAD com o O3-D14 o Diretor só sobe depois de V.1 e V.2: o `bench-galeria7.mjs` do D13 precisa forçar esses objetivos (o `bench-campanha.mjs` faz isso: `--etapas V --rodada 25`).

## 7. Para o playtest e o revisor (D16)

- O tempo dos atos depende dos objetivos (andar, defender, escoltar, segurar): medir com gente.
- A meta "morte do time < 50% com o kit" não dá para medir com este robô (cai também no clássico).
- O Foguista e o Diretor ficaram abaixo da faixa no robô (192–207 s e 179–207 s): se no playtest a luta ficar curta, subir `base`/`porJog` de novo; se ficar "esponja", voltar.
- `maxK` sem efeito (seção 2).
- Forno: o primeiro `brasa` compila 2 programas na partida (seção 5).
- Benches na placa integrada: as travadas das arenas são dela (seção 6).
- Normal com 2 jogadores, o Foguista caiu em 42 s numa repetição (2 robôs com Galil PaP): com gente, conferir se 2–4 jogadores não atropelam os chefes (o `porJog` foi mantido proporcional).
