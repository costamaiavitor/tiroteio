# Mapa das áreas do modo Zumbis (Fase 0: reconhecimento)

Levantado em 02/10/2026 sobre a `main` no commit `5ee0def`; as linhas citadas são de `index.html`.

Os dados de cada área (área em m², janelas, objetos) foram extraídos do jogo carregado num navegador automático (Playwright). O script, `areas.mjs`, fica fora do repositório, em `C:\dev\tiroteio-notas\work\inventario\`.

## 1. Como o projeto monta os mapas

| Peça | Como é feita hoje | Onde |
|---|---|---|
| Engine | three.js r160 (CDN, importmap), tudo num único `index.html`, sem build | 273, 417–423 |
| Cenário com colisão | caixas `B(x,z,w,d,h,mat,y,c)`, que viram malha + colisor (`COL`). Nos mapas zumbi, as caixas do mesmo material são juntadas por bloco de 48 m | 563, `buildMap` 2155 |
| Paredes | `zWall`, com janelas (`zWin`) e vãos de porta (`zGap`) | 620–634 |
| Cenário só visual | função `build` de cada mapa (`buildVila` 1464, `buildSanatorio` 887): cilindros, telhados, instâncias (árvores, livros, lápides…) e grupos girados por distrito | |
| Áreas geradas | `zGen`, com um tema por região e semente fixa (temas listados abaixo); decoração em `zGenDeco` (árvores, água, pontes) | 645–819; `SAN_GEN` 821, `VILA_GEN` 1171 |
| Texturas | geradas em canvas (`genTex`), com bump | ~1900–1990 |
| Materiais | `worldMat`: Lambert no gráfico Baixo, Standard (PBR) no Médio e no Alto; o parâmetro `ao` escurece a base do que encosta no chão | 2001 |
| Luz | sol e hemisférica por mapa; lâmpadas do mundo zumbi num pool de 5 ou 8 `PointLight` reais (as demais são só o bulbo); luz de preenchimento e lanterna presas na câmera | `zBuildWorld`, `VIS` ~1767 |
| Névoa | `THREE.Fog` por mapa, ajustada por `visMap`; fica vermelha na rodada de cães (`zFogDog`) | 1818, 2165 |
| Pós-processamento | bloom (só no gráfico Alto) e `gradePass`: aberração cromática leve, contraste, tons quente/frio e granulação | 1880–1895 |
| Partículas e efeitos | `puff` (sprites) e `addFx`; o fogo da fogueira; os raios da armadilha | 2563, 2598 |
| Animação do cenário | lista `MAP_ANIM`, que roda a cada quadro: fogueira, moinho, bandeira e farol | 1410 |
| Som | totalmente sintetizado (`SND` com osciladores, `vox` para os zumbis); não há arquivos de áudio nem som ambiente por área | 2458 |
| Recorte | `zCull`: o que fica além da névoa não é desenhado | ~2120 |

**Temas do `zGen`:**
- abertos: `graves`, `forest`, `rocks`, `mine`, `ruins`, `military`, `swamp`, `river`, `island`, `field`, `junk`, `parking`, `yard`;
- fechados: `cells`, `tunnels`, `ovens`, `laundry`, `stables`.

**Texturas do `genTex`:** `grass`, `leaf`, `dirt`, `tile`, `concrete`, `brick`, `metal`, `wood`, `plaster`, `rock`, entre outras.

**Restrições que valem para todas as fases:**
- **Colisão:** toda peça com colisão mexe na navegação dos zumbis (`zBuildWalk`). Objeto novo deve ser só visual ou respeitar a regra de altura (`ZVAULT`/`ZTOP`).
- **Rede:** janelas, armas de parede e lugares da Caixa viajam pela rede pelo índice. Não reordenar essas listas.
- **Determinismo:** o cenário é montado igual em todas as máquinas. Sorteio visual precisa de semente (`mkRand`); colisão nunca pode ser sorteada com `Math.random`.
- **Desempenho:** a Vila já tem cerca de 2.800 colisores e 488 × 488 células de navegação.

## 2. Ordem de desbloqueio e áreas

"Custo" é o menor total de portas pagas a partir da área inicial. "Portas" é quantas portas há nesse caminho.

### Vila (33 áreas, 54 portas; o jogo começa na Praça)

| Ordem | Área (id) | Custo | Portas | Via | m² | Janelas / zumbis do chão | Estado visual hoje |
|---|---|---|---|---|---|---|---|
| 0 | Praça (A) | 0 | 0 | — | 640 | 0 / 4 | chafariz, 2 bancos, 4 postes, grade de ferro, chão pintado; Caixa e armadilha |
| 1 | Igreja (B) | 750 | 1 | AB | 1930 | 2 / 5 | igreja de reboco com telhado, 8 bancos, altar de pedra, vitrais, torre; uma casa |
| 1 | Lago (E) | 750 | 1 | AE | 1930 | 2 / 5 | lago (água), moinho girando, uma casa, poço |
| 1 | Fazenda (C) | 1000 | 1 | AC | 1880 | 2 / 5 | celeiro com telhado, 7 fardos de feno, trator, plantação (só visual) |
| 1 | Cemitério (D) | 1000 | 1 | AD | 1880 | 2 / 5 | 20 lápides (algumas com cruz), mausoléu com colunas, uma casa |
| 2 | Pedreira (F) | 2250 | 2 | BF | 4056 | 2 / 5 | pedras grandes, entrada de mina no muro, trilho, vagoneta, gerador (energia) |
| 2 | Acampamento (H) | 2250 | 2 | EH | 4056 | 2 / 5 | 3 barracas, fogueira acesa (animada), troncos, torre de vigia |
| 2 | Estação (G) | 2500 | 2 | CG | 4056 | 2 / 5 | prédio de tijolo com placa, trilhos, trem parado |
| 2 | Castelo (I) | 2500 | 2 | DI | 4056 | 2 / 5 | muralhas, 4 torres redondas com ameias, pátio com o Pack-a-Punch |
| 3 | Mina (J) | 4250 | 3 | FJ | 3220 | 5 / 4 | paredão de pedra, boca da mina, vagonetas, torre do poço com roda |
| 3 | Fábrica (L) | 4250 | 3 | FL | 3220 | 5 / 5 | galpão com telhado de metal, máquinas, caixotes |
| 3 | Farol (O) | 4250 | 3 | HO | 3220 | 5 / 5 | farol listrado com facho girando, pedras |
| 3 | Floresta (P) | 4250 | 3 | HP | 3220 | 5 / 4 | muitas árvores (46 colisores), tronco |
| 3 | Hospital de campanha (K) | 4500 | 3 | IK | 3220 | 5 / 5 | 3 barracas com cruz vermelha, macas, sacos de areia |
| 3 | Ferrovia (M) | 4500 | 3 | GM | 3220 | 5 / 4 | 3 vagões coloridos sobre trilhos, caixote |
| 3 | Porto (N) | 4500 | 3 | GN | 3220 | 5 / 4 | doca (água), caixotes |
| 3 | Serraria (Q) | 4500 | 3 | IQ | 3220 | 5 / 5 | toras, bancada, máquina |
| 4 | Base militar (c0) | 6750 | 4 | Jc0 | 6204 | 6 / 6 | tema `military`: contêineres, sacos de areia, barracas, torre |
| 4 | Vinhedo (c2) | 6750 | 4 | Oc2 | 6204 | 6 / 6 | tema `field`: 59 fileiras de sebe, celeiro, árvores |
| 4 | Pântano (c1) | 7000 | 4 | Mc1 | 6204 | 6 / 6 | tema `swamp`: poças, árvores secas, cabana |
| 4 | Ruínas da cidade (c3) | 7000 | 4 | Qc3 | 6204 | 6 / 6 | tema `ruins`: 51 pedaços de muro de tijolo, entulho, chaminé |
| 4 | Margem do rio (b10) | 7250 | 4 | Lb10 | 10440 | 6 / 6 | tema `river`: rio com 2 pontes, caixotes |
| 4 | Bairro queimado (b30) | 7250 | 4 | Pb30 | 10440 | 6 / 6 | tema `ruins` (igual às Ruínas da cidade, com 87 muros) |
| 4 | Encosta (b00) | 7500 | 4 | Kb00 | 10440 | 6 / 6 | tema `rocks`: 40 pedras, pilar alto |
| 4 | Cais (b20) | 7500 | 4 | Nb20 | 10440 | 6 / 6 | tema `yard`: caixotes, contêineres, galpão, mastros |
| 5 | Pico da montanha (b02) | 9750 | 5 | c0b02 | 11240 | 6 / 6 | tema `rocks` (igual à Encosta) |
| 5 | Estaleiro (b22) | 9750 | 5 | c2b22 | 11240 | 6 / 6 | tema `yard` (igual ao Cais) |
| 5 | Bosque (b12) | 10000 | 5 | c1b12 | 11240 | 6 / 6 | tema `forest`: 132 árvores, tronco, toras |
| 5 | Brejo negro (b32) | 10000 | 5 | c3b32 | 11240 | 6 / 6 | tema `swamp` (igual ao Pântano) |
| 5 | Ponte velha (b11) | 10750 | 5 | b10b11 | 10400 | 6 / 6 | tema `river` (igual à Margem do rio) |
| 5 | Quartel (b31) | 10750 | 5 | b30b31 | 10400 | 6 / 6 | tema `military` (igual à Base militar) |
| 5 | Mina velha (b01) | 11000 | 5 | b00b01 | 10400 | 6 / 6 | tema `mine`: pedras, escoras de madeira, vagonetas |
| 5 | Ilha do porto (b21) | 11000 | 5 | b20b21 | 10400 | 6 / 6 | tema `island`: água em volta, píer, torre de pedra, cabana, caixotes |

**Itens por área**

| Área | Itens |
|---|---|
| Praça | M14, Olympia, granadas |
| Igreja | Juggernog, Electric Cherry, Vulture Aid |
| Lago | Stamin-Up, Deadshot, Dying Wish |
| Fazenda | Speed Cola, Mule Kick, Widow's Wine |
| Cemitério | Double Tap, PhD, Timeslip |
| Pedreira | energia |
| Castelo | Pack-a-Punch |

Todas as áreas têm uma arma de parede e um lugar da Caixa.

### Sanatório (29 áreas, 40 portas; o jogo começa na Recepção)

| Ordem | Área (id) | Custo | Portas | Via | m² | Janelas / zumbis do chão | Estado visual hoje |
|---|---|---|---|---|---|---|---|
| 0 | Recepção (A) | 0 | 0 | — | 288 | 2 / 0 | 1 balcão; armadilha na porta para a Enfermaria |
| 1 | Capela (F) | 750 | 1 | AF | 288 | 1 / 0 | 3 bancos |
| 1 | Enfermaria (B) | 750 | 1 | AB | 288 | 0 / 0 | 4 macas de metal |
| 1 | Pátio (C) | 1000 | 1 | AC | 288 | 1 / 3 | 1 fonte de pedra |
| 2 | Laboratório (D) | 1750 | 2 | BD | 288 | 0 / 0 | 2 bancadas |
| 2 | Refeitório (G) | 2000 | 2 | FG | 1008 | 2 / 0 | 6 mesas compridas, balcão de servir, 2 colunas |
| 2 | Teatro (E) | 2000 | 2 | BE | 288 | 0 / 0 | 3 fileiras de poltronas |
| 2 | Ala Psiquiátrica (J) | 2250 | 2 | BJ | 720 | 2 / 0 | 3 divisórias de cela, 4 camas com lençol, posto de enfermagem |
| 2 | Jardim (K) | 2250 | 2 | CK | 1152 | 2 / 6 | chafariz com água, sebes, 2 bancos, árvores, 2 postes |
| 3 | Biblioteca (N) | 3000 | 3 | GN | 1008 | 3 / 0 | 8 estantes cheias de livros coloridos, mesa de leitura |
| 3 | Cozinha (H) | 3000 | 3 | GH | 864 | 2 / 0 | fogões, bancadas, geladeiras |
| 3 | Necrotério (I) | 3000 | 3 | DI | 360 | 1 / 0 | gavetas frias, 3 mesas de autópsia com lençol |
| 3 | Estufa (L) | 3250 | 3 | KL | 720 | 2 / 0 | 4 canteiros com plantas, armação de vidro |
| 3 | Torre d'água (M) | 3750 | 3 | KM | 1008 | 3 / 5 | torre de madeira com caixa d'água, escada, caixotes; Pack-a-Punch |
| 4 | Caldeiras (P) | 4500 | 4 | HP | 720 | 3 / 0 | 2 caldeiras com brilho de fornalha, canos no alto, tanque; energia |
| 4 | Cemitério (r1) | 5000 | 4 | Nr1 | 2196 | 3 / 6 | tema `graves`: 46 lápides, 2 mausoléus, árvores |
| 4 | Túneis de serviço (r5) | 5250 | 4 | Nr5 | 2920 | 5 / 3 | tema `tunnels`: paredes formando corredores, canos no chão |
| 4 | Brejo (r13) | 5250 | 4 | Ir13 | 2040 | 3 / 6 | tema `swamp` |
| 4 | Pedreira (r3) | 5750 | 4 | Mr3 | 2196 | 3 / 6 | tema `rocks` |
| 4 | Pomar (r10) | 5750 | 4 | Lr10 | 2440 | 4 / 6 | tema `field`: sebes, celeiro |
| 4 | Lavanderia (r9) | 6000 | 4 | Mr9 | 2920 | 5 / 3 | tema `laundry`: 68 máquinas em fileiras |
| 5 | Ferro-velho (r12) | 7000 | 5 | Pr12 | 2000 | 3 / 6 | tema `junk`: carros, contêineres |
| 5 | Portaria (r2) | 7500 | 5 | r1r2 | 2112 | 4 / 6 | tema `parking`: carros nas vagas |
| 5 | Anexo do asilo (r6) | 7750 | 5 | r5r6 | 2400 | 4 / 3 | tema `cells`: celas dos dois lados de um corredor, camas |
| 5 | Ruínas do convento (r4) | 8000 | 5 | r1r4 | 2112 | 4 / 6 | tema `ruins` |
| 5 | Ilha do lago (r14) | 8250 | 5 | r13r14 | 1960 | 4 / 6 | tema `island` |
| 5 | Floresta (r8) | 8750 | 5 | r3r8 | 2112 | 4 / 6 | tema `forest` |
| 5 | Estábulo (r11) | 8750 | 5 | r10r11 | 2400 | 4 / 3 | tema `stables`: baias, feno |
| 6 | Crematório (r7) | 11000 | 6 | r12r7 | 2400 | 4 / 3 | tema `ovens`: fornos em fila, caixões, 2 chaminés |

**Itens por área**

| Área | Itens |
|---|---|
| Capela | Double Tap, PhD |
| Enfermaria | Quick Revive, Electric Cherry |
| Pátio | Speed Cola, Deadshot |
| Laboratório | Juggernog |
| Refeitório | Timeslip |
| Teatro | Stamin-Up, Mule Kick |
| Ala Psiquiátrica | Vulture Aid |
| Jardim | Widow's Wine |
| Estufa | Dying Wish |
| Torre d'água | Pack-a-Punch |
| Caldeiras | energia |

## 3. Problemas encontrados (o que a atmosfera precisa resolver)

1. **Repetição por tema.** Regiões geradas com o mesmo tema saem com o mesmo conjunto de peças; só muda o sorteio. Isso fere a regra "nada de reaproveitar o mesmo conjunto entre salas".

   | Tema | Áreas que repetem o conjunto |
   |---|---|
   | `military` | Base militar e Quartel |
   | `yard` | Cais e Estaleiro |
   | `river` | Margem do rio e Ponte velha |
   | `rocks` | Encosta, Pico da montanha e a Pedreira do Sanatório |
   | `swamp` | Pântano, Brejo negro e o Brejo do Sanatório |
   | `ruins` | Ruínas da cidade, Bairro queimado e as Ruínas do convento |
   | `forest` | Bosque, a Floresta do Sanatório e, em parte, a Floresta da Vila |
   | `island` | Ilha do porto e Ilha do lago |

2. **Núcleo do Sanatório quase vazio.** As salas de 288 m² têm de 1 a 4 peças (um balcão, quatro macas, duas bancadas) e nenhuma história ambiental. Isso contradiz o "horror explícito" pedido.
3. **Distritos de fora da Vila com pouco cenário.** Mina, Fábrica, Farol, Hospital, Ferrovia, Porto e Serraria têm de 1 a 8 peças cada; o que domina são os muros.
4. **Cenário feito de caixas.** As texturas são genéricas (`stone`, `wall`, `wood`), sem desgaste próprio de cada área e sem decals (manchas, marcas, sujeira).
5. **Pouca animação ambiental.** Só há 4 itens em `MAP_ANIM` (fogueira, moinho, bandeira, farol), e nenhum objeto reage ao jogador.
6. **Luz igual em todo canto.** As lâmpadas são as mesmas em toda área, e o color grading é um só para o mapa inteiro, sem paleta por área.
7. **Sem som ambiente.** Só existem sons de ação; o terror sonoro precisa ser sintetizado do zero.
8. **Nenhuma escalada de tensão.** A primeira área e a última têm o mesmo tom visual.
9. **Limites técnicos para as próximas fases:**
   - luz real a mais pesa no shader: luz nova deve entrar no pool ou ser emissiva/sprite;
   - objeto com colisão muda a navegação e a regra de escalada dos zumbis;
   - a Vila é enorme: cenário novo deve usar instâncias e o recorte por distância (`cullAdd`/`zCull`).

## 4. Proposta de divisão de trabalho para as próximas fases

Como tudo está num único `index.html`, vários agentes não podem editar o mesmo arquivo ao mesmo tempo sem conflito. A proposta:
- **Uma função por área**, num bloco `ATMOS` novo, chamada pelo `build` de cada mapa.
- **Uma seção compartilhada** para materiais, texturas, partículas e sons novos.
- **Cada agente trabalha numa cópia** e entrega um patch só da sua seção; a integração aplica os patches em sequência.

Isso fica para decidir junto com a aprovação desta fase.
