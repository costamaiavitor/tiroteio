# Mapa das áreas do modo Zumbis (Fase 0: reconhecimento)

Levantado em 02/10/2026 sobre a `main` no commit `5ee0def` (a coluna de estado visual da Vila foi atualizada na fase 4, em 04/10/2026, branch `atmosfera`); as linhas citadas são de `index.html` e foram conferidas de novo no mesmo dia, depois das fichas da bíblia (arquivo com 8.630 linhas).

Os dados de cada área (área em m², janelas, objetos) foram extraídos do jogo carregado num navegador automático (Playwright). O script, `areas.mjs`, fica fora do repositório, em `C:\dev\tiroteio-notas\work\inventario\`.

## 1. Como o projeto monta os mapas

| Peça | Como é feita hoje | Onde |
|---|---|---|
| Engine | three.js r160 (CDN, importmap), tudo num único `index.html`, sem build | importmap 276; imports 420–431 |
| Cenário com colisão | caixas `B(x,z,w,d,h,mat,y,c)`, que viram malha + colisor (`COL`). Nos mapas zumbi, as caixas do mesmo material são juntadas por bloco de 48 m | 563, `buildMap` 2155 |
| Paredes | `zWall`, com janelas (`zWin`) e vãos de porta (`zGap`) | `zWall` 657–670; `zWin`/`zGap` 671 |
| Cenário só visual | função `build` de cada mapa (`buildVila` 1464, `buildSanatorio` 887): cilindros, telhados, instâncias (árvores, livros, lápides…) e grupos girados por distrito | |
| Áreas geradas | `zGen`, com um tema por região e semente fixa (temas listados abaixo); decoração em `zGenDeco` (árvores, água, pontes) | `zGen` 682–836 (temas no `switch`, 762–827); `zGenZone`/`zGenJoin` 837–841; `zGenDeco` 843–856; `SAN_GEN` 858; `VILA_GEN` 1208–1233 |
| Texturas | geradas em canvas (`genTex`), com bump | `genTex` 1919; tabelas `BUMP`/`TEXS` 1986–1989 |
| Materiais | `worldMat`: Lambert no gráfico Baixo, Standard (PBR) no Médio e no Alto; o parâmetro `ao` escurece a base do que encosta no chão | 2001 |
| Luz | sol e hemisférica por mapa; lâmpadas do mundo zumbi num pool de 5 ou 8 `PointLight` reais (as demais são só o bulbo); luz de preenchimento e lanterna presas na câmera | `zBuildWorld` 5968, `VIS` 1807 |
| Névoa | `THREE.Fog` por mapa, ajustada por `visMap`; fica vermelha na rodada de cães (`zFogDog`) | 1818, 2165 |
| Pós-processamento | bloom (só no gráfico Alto) e `gradePass`: aberração cromática leve, contraste, tons quente/frio e granulação | `bloomPass` 1880, `gradePass` 1882–1895 |
| Partículas e efeitos | `puff` (sprites) e `addFx`; o fogo da fogueira; os raios da armadilha | 2563, 2598 |
| Animação do cenário | lista `MAP_ANIM`, que roda a cada quadro: fogueira, moinho, bandeira e farol | 1410 |
| Som | totalmente sintetizado (`SND` com osciladores, `vox` para os zumbis); não há arquivos de áudio nem som ambiente por área | 2458 |
| Recorte | `zCull`: o que fica além da névoa não é desenhado | `zCull` 2122 |

**Temas do `zGen`:**
- abertos: `graves`, `forest`, `rocks`, `mine`, `ruins`, `military`, `swamp`, `river`, `island`, `field`, `junk`, `parking`, `yard`;
- fechados: `cells`, `tunnels`, `ovens`, `laundry`, `stables`.

**Texturas do `genTex`:** `grass`, `leaf`, `dirt`, `tile`, `concrete`, `brick`, `metal`, `wood`, `plaster`, `rock`, entre outras.

**Restrições que valem para todas as fases:**
- **Colisão:** toda peça com colisão mexe na navegação dos zumbis (`zBuildWalk`). Objeto novo deve ser só visual ou respeitar a regra de altura (`ZVAULT`/`ZTOP`).
- **Rede:** janelas, armas de parede e lugares da Caixa viajam pela rede pelo índice. Não reordenar essas listas.
- **Determinismo:** o cenário é montado igual em todas as máquinas. Sorteio visual precisa de semente (`mkRand`); colisão nunca pode ser sorteada com `Math.random`.
- **Desempenho:** a Vila já tem cerca de 2.800 colisores e 488 × 488 células de navegação.
- **Sorteio compartilhado do `zGen`:** o sorteador `rr()` (linha 683) é um só para todas as regiões, na ordem em que são geradas. Mudar quantos sorteios uma região faz (tirar ou pôr um `put`, um `scatter`, um `rn`) desloca a arma de parede, a Caixa, as lâmpadas e os risers de todas as regiões seguintes. Variação por área deve trocar só cor ou material depois do sorteio, ou usar um `mkRand` próprio fora do `zGen`.
- **Paleta por área:** o `gradePass` (1882–1895) só tem os uniforms `time` e `sc`. Tom quente ou frio, saturação, vinheta ou paleta por área exigem uniforms novos no shader.
- **Água das regiões geradas:** em `zGenDeco` (852–853) toda a água é um material único (`MeshPhongMaterial` 0x1d3440). Água diferente por área (preta, oleosa, parada, com correnteza) exige guardar a região em `deco.water` e criar um material por região.

## 2. Ordem de desbloqueio e áreas

"Custo" é o menor total de portas pagas a partir da área inicial. "Portas" é quantas portas há nesse caminho.

### Vila (33 áreas, 54 portas; o jogo começa na Praça)

| Ordem | Área (id) | Custo | Portas | Via | m² | Janelas / zumbis do chão | Estado visual (depois das fases 2 e 3) |
|---|---|---|---|---|---|---|---|
| 0 | Praça (A) | 0 | 0 | — | 640 | 0 / 4 | bandeirinhas tremulando, faixa "FESTA DE SÃO LÁZARO" a 3,5 m, carrinho de pipoca e pipoca derramada, 7 pombos (voam para a Igreja; da 3ª rodada em diante encaram o jogador), marcas de pneu da ambulância, mural da prefeitura, caixa de engraxate, barquinho de papel e anel de lodo no chafariz |
| 1 | Igreja (B) | 750 | 1 | AB | 1930 | 2 / 5 | quadro de cânticos 214–216, mantilhas de renda, folhetos da missa que deslizam, dois círios acesos, pia de água benta preta, sino à vista no campanário (assinatura "o sino que responde"), cruz de cal na casa paroquial, poço lacrado com balde girando; órgão e tom frio na nave |
| 1 | Lago (E) | 750 | 1 | AE | 1930 | 2 / 5 | lago escuro e oleoso com mancha negra, cadeira de balanço com xale, duas varas (uma linha vibrando), samburá com traíras no barco, lençóis quarando sobre grama morta, caixote "AMOSTRA 3", rede rasgada de dentro para fora, pano preto na pá do moinho; assinatura "alguém saiu da água" (pegadas molhadas) |
| 1 | Fazenda (C) | 1000 | 1 | AC | 1880 | 2 / 5 | espantalho com o macacão "118" que anda fora do olhar, 20% do milharal cinzento e balançando, arado, latões de água preta, corrente de cachorro que estica e afrouxa, forcado que troca de lugar, galinheiro vazio, etiqueta 118, porta lateral que range |
| 1 | Cemitério (D) | 1000 | 1 | AD | 1880 | 2 / 5 | cova aberta com tábuas e paletó, cruz provisória "ainda não acabou", harmônio no mausoléu (assinatura: o hino vem da cova), sininho de cova, cruzes de ferro da prefeitura, moringas, montes de terra rachados, lista do coveiro (31) que levanta a ponta |
| 2 | Pedreira (F) | 2250 | 2 | BF | 4056 | 2 / 5 | mastro de detonação com corneta de chifre, bornais com os nomes, lata com as cartas, carroça de pedras (colisor), arame farpado e placa INTERDITADO na galeria, 23 marcos de pedra, cavalete com 7 paletós (colisor), lona e fogareiro; redemoinho de poeira; assinatura "o vale fecha" |
| 2 | Acampamento (H) | 2250 | 2 | EH | 4056 | 2 / 5 | 8 mochilas da Patrulha Lobo (401–408), bonequinhos de barro na fogueira, desenhos a carvão na lona, flâmula, varal de lenços numerados, bolinhas de gude, apito girando, lenha que não diminui, fagulhas; assinatura "a fila na lona" (8 sombras e 3 apitos) |
| 2 | Estação (G) | 2500 | 2 | CG | 4056 | 2 / 5 | janelas dos vagões que apagam e acendem e o passageiro de chapéu, relógio que volta às 17h12 (loop de 60 s), quadro "PARTIDAS" 8× cancelado, malas e bilhetes 0412, bancos verdes com o jornal "O VALE", semáforo de braço, carrinho de bagagem, placa "S. LÁZARO" |
| 2 | Castelo (I) | 2500 | 2 | DI | 4056 | 2 / 5 | estandarte "3ª Cia — 14º BC", holofote varrendo (assinatura: acha o jogador, clique e obturador), luneta, mesa com mapa de alfinetes e lista do Programa, cofre de cadernetas, 36 fotos 3×4 no muro, câmera de fole, placa "PROIBIDO FOTOGRAFAR"; rádio lendo números |
| 3 | Mina (J) | 4250 | 3 | FJ | 3220 | 5 / 4 | quadro de chapas da lampisteria (a 17 vazia; colisor), lacre da Galeria 7 com tábuas estufadas e cal, chamada a fuligem, filete e poça do Veio, garrafões empalhados, 7 lanternas de carbureto balançando, caixote de dinamite, vagonetas (botas / Veio), roda do poço; assinatura "o fôlego da galeria" |
| 3 | Fábrica (L) | 4250 | 3 | FL | 3220 | 5 / 5 | esteira com 24 garrafas em loop (rótulo 0356, uma de cabeça para baixo), lâmpadas que seguem a garrafa, relógio de ponto, 12 aventais em uníssono, lousa "META 400", prelo e cascata de rótulos, cuba de água preta, anel de fumaça a cada 9 s; tac-tac da linha; assinatura "o turno recomeça" |
| 3 | Farol (O) | 4250 | 3 | HO | 3220 | 5 / 5 | bóia-sino encalhada (colisor baixo), buzina de nevoeiro, 14 conchas numeradas, chave de telégrafo e farol piscando "AINDA NAO ACABOU" em Morse, âncora arrastada com sulco, lente de Fresnel rachada, escafandro; areia correndo; assinatura "o mar dentro da torre" |
| 3 | Floresta (P) | 4250 | 3 | HP | 3220 | 5 / 4 | roupas da família 61 que andam de árvore em árvore até a cabana, alarme de latas, porta barricada "61", trempe com panela, trilha de 60 pedrinhas de cal, pinheiro com as alturas das crianças, rede vazia embalando, fifó aceso; folhas caindo, galhos estalando atrás |
| 3 | Hospital de campanha (K) | 4500 | 3 | IK | 3220 | 5 / 5 | varal de 40 cartões de triagem, lista do Programa (assinatura "a vaga 41"), máquina de escrever, estojo de vacinação pingando, lençóis com silhueta de cinza, balança "Família 117 · 0 kg", cesto de pulseiras, tonel de cal com pegadas de coturno, ambulância verde-oliva cujas portas fecham sozinhas |
| 3 | Ferrovia (M) | 4500 | 3 | GM | 3220 | 5 / 4 | faixa de embarque, 14 cadeiras com cartão SADIO, vagão-dormitório iluminado com renda e porta amarrada, garrafa térmica e xícaras fumegando, cancela "LIVRE TRÂNSITO", sinal anão, telegrama, mangote pingando preto; xote ao fundo; assinatura "via livre" |
| 3 | Porto (N) | 4500 | 3 | GN | 3220 | 5 / 4 | barco que pesa (6 cm mais fundo) com sapatos molhados, balança romana em 64 kg, banco da travessia afundado, corda até o barco, cabide de coletes com um preto pingando, remo molhado, esteiras em V na água, tabela de preços; assinatura: passos invisíveis no píer |
| 3 | Serraria (Q) | 4500 | 3 | IQ | 3220 | 5 / 5 | toras que sangram (203–208), tora pendurada descascada, quadro de luvas com nomes, caixotes-esquife S.S.I. 207–209, serragem com cabelo, rebolo com dentes, ferros de marcar, pó no feixe da lâmpada; assinatura "a serra morde" |
| 4 | Base militar (c0) | 6750 | 4 | Jc0 | 6204 | 6 / 6 | torre de vigia com sirene de manivela, quadro das chaves das casas, binóculo em tripé (assinatura: segue quem fica parado), alto-falantes e rádio com o "número", livro de saídas, cavalos de frisa, placa "ZONA DE QUARENTENA", cantis "NÃO BEBER", fotos de casas |
| 4 | Vinhedo (c2) | 6750 | 4 | Oc2 | 6204 | 6 / 6 | sebes viram videiras (estacas, arame, uva preta), 14 cestinhos 62–75, lagar de caldo preto com moscas, ciranda de estacas com fitas (assinatura: mãozinhas pretas), lousinha "PAPAI DORME MUITO", caderno de caligrafia, carrocinha com boneca de sabugo, gangorra |
| 4 | Pântano (c1) | 7000 | 4 | Mc1 | 6204 | 6 / 6 | água com lentilha, ~240 taboas balançando, touceira que se abre (assinatura "os juncos se abrem"), pinguela, jangada com trouxa, guarda-chuva 77, covo girando, lençol "SOMOS 5", rastro de pés descalços até a poça, vara com pano branco, névoa rasteira, sapos |
| 4 | Ruínas da cidade (c3) | 7000 | 4 | Qc3 | 6204 | 6 / 6 | tijolo frio com remendos de cal, mesa telefônica (assinatura: campainha onde não há telefone), cabine telefônica (colisor), letreiro do cinema, balcão da farmácia (colisor), coluna de correio com 30 envelopes, caixa registradora 0·4·1·2, rolo de filme subindo o muro, forno da padaria |
| 4 | Margem do rio (b10) | 7250 | 4 | Lb10 | 10440 | 6 / 6 | água com correnteza, pontes baixas com corda, lajes de bater roupa com sobrenomes, bacias de ágata com água preta, sabão de cinza, canoa 12–15, régua de enchente 03/1957, ferro a brasa, cestos de vime, espuma; 9 trouxas que andam fora do olhar |
| 4 | Bairro queimado (b30) | 7250 | 4 | Pb30 | 10440 | 6 / 6 | muros carbonizados com brasa, telhas vitrificadas, batentes com cruz de cal e coroa de arame, 3 piras com fumaça (uma é a lâmpada), andor queimado, estandarte "PURGAI", matracas, baldes de cal, páginas de missal planando; assinatura: procissão de brasas |
| 4 | Encosta (b00) | 7500 | 4 | Kb00 | 10440 | 6 / 6 | pedras avermelhadas e sulcos de erosão, postes de telégrafo com fios cortados, trilha de bagagem "77", marco "NÃO HÁ SAÍDA", cadeirinha de vime, espelho de barbear (assinatura "o sinal sem resposta"), recados no pilar e fogueira de sinal, capim, cascalho rolando |
| 4 | Cais (b20) | 7500 | 4 | Nb20 | 10440 | 6 / 6 | pilhas de contêineres lacrados (2ª e 3ª camadas só visuais), contêiner entreaberto com arranhões e barco a giz, correntes com lacre, baldes sanitários, respiros que apagam (assinatura), lonas alcatroadas, rede de carga, quadro "EMBARQUE 000" |
| 5 | Pico da montanha (b02) | 9750 | 5 | c0b02 | 11240 | 6 / 6 | granito com geada, alpendre com transmissor, cobertores e bilhetes "RESGATE CONFIRMADO", braseiro (a lâmpada vira fogo), mastro de rádio (base baixa sólida), placa "AQUI É SEGURO", cruzeiro com ex-votos (base sólida), silhueta do Sanatório cujas janelas apagam (assinatura); samba-canção no rádio |
| 5 | Estaleiro (b22) | 9750 | 5 | c2b22 | 11240 | 6 / 6 | barracões de tábua, pilhas de tábua, casco da "Arca de São Lázaro" com o nome repintado 5×, carreira de dormentes, quadro de 12 marretas "S.L.", calendário "14 SET", caldeirão de piche, talha; ciclo de 12 s (marteladas, a tábua escorrega e cai) enquanto alguém olha |
| 5 | Bosque (b12) | 10000 | 5 | c1b12 | 11240 | 6 / 6 | 30 plaquinhas numeradas nas árvores, olhos a cal virados para as portas, 3 jiraus com jaleco e touca, tabuleta de ronda, laço "ADULTO Nº 233", 6 lanternas de ronda; assinatura: a lanterna que acompanha a 40 m; folhas caindo |
| 5 | Brejo negro (b32) | 10000 | 5 | c3b32 | 11240 | 6 / 6 | água preta com película de óleo, formas pálidas sob a água (assinatura "o que boia"), árvores escuras com nós cor de pele, boi inchado (colisor baixo) com moscas, dedos na lama, sacos de lona boiando, placa "DEPÓSITO", mudas de pele nos galhos, bolhas |
| 5 | Ponte velha (b11) | 10750 | 5 | b10b11 | 10400 | 6 / 6 | água parada, sacos de cimento, ponte coberta escura, guarda-corpo com 26 fitas de luto, para-lama da ambulância, barranco com nichos e velas, placa de dois braços, bicicleta de padeiro, marco "KM 0", marcas de pneu; assinatura: o caminhão passa por cima |
| 5 | Quartel (b31) | 10750 | 5 | b30b31 | 10400 | 6 / 6 | câmaras de fumigação brancas com vapor, sacos de cal, caixa d'água de descontaminação, chuveiros (assinatura "o banho de cal"), tanque com peneira de pertences, mesa de triagem com carimbo, padiolas "POSITIVO", cartaz em quadrinhos, 12 máscaras que viram para o jogador (4 colisores), pés de cal até a porta |
| 5 | Mina velha (b01) | 11000 | 5 | b00b01 | 10400 | 6 / 6 | altar de vagoneta com o vidro do Veio, pórticos de capacetes acesos, 20 nichos de carbureto, espiral de 48 compoteiras, inscrições a carvão, círculo de picaretas com fitas, bateia de comunhão, estandarte "N. SRA. DO VEIO" que se ergue; assinatura: a congregação |
| 5 | Ilha do porto (b21) | 11000 | 5 | b20b21 | 10400 | 6 / 6 | bandeira Q esfarrapada, farolete apagado, barco sem remos com água preta, caixa de mantimentos vazia, boia de lata, cabana do barqueiro (3 paredes sólidas) com a lista "… EU", remos-cruz com nomes, cabaças lacradas, tamancos na beira d'água, névoa no mar; assinatura: o barco que vem |

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
| 4 | Cemitério (r1) | 5000 | 4 | Nr1 | 2196 | 3 / 6 | tema `graves`: 46 lápides, 1 árvore seca (os 2 mausoléus do tema não aparecem) |
| 4 | Túneis de serviço (r5) | 5250 | 4 | Nr5 | 2920 | 5 / 3 | tema `tunnels`: paredes formando corredores, canos no chão |
| 4 | Brejo (r13) | 5250 | 4 | Ir13 | 2040 | 3 / 6 | tema `swamp`: 2 poças, 7 árvores secas (a cabana do tema não aparece) |
| 4 | Pedreira (r3) | 5750 | 4 | Mr3 | 2196 | 3 / 6 | tema `rocks`: 5 pedras grandes e o pilar de 12 m (a laje de metal do tema não aparece) |
| 4 | Pomar (r10) | 5750 | 4 | Lr10 | 2440 | 4 / 6 | tema `field`: 11 sebes, 2 árvores (o celeiro do tema não aparece) |
| 4 | Lavanderia (r9) | 6000 | 4 | Mr9 | 2920 | 5 / 3 | tema `laundry`: 68 máquinas em fileiras |
| 5 | Ferro-velho (r12) | 7000 | 5 | Pr12 | 2000 | 3 / 6 | tema `junk`: carros, contêineres |
| 5 | Portaria (r2) | 7500 | 5 | r1r2 | 2112 | 4 / 6 | tema `parking`: carros nas vagas |
| 5 | Anexo do asilo (r6) | 7750 | 5 | r5r6 | 2400 | 4 / 3 | tema `cells`: celas dos dois lados de um corredor, camas |
| 5 | Ruínas do convento (r4) | 8000 | 5 | r1r4 | 2112 | 4 / 6 | tema `ruins`: 18 muros de tijolo, 10 pedras (o pilar central do tema não aparece) |
| 5 | Ilha do lago (r14) | 8250 | 5 | r13r14 | 1960 | 4 / 6 | tema `island`: água em volta e píer (a torre e a cabana do tema não aparecem) |
| 5 | Floresta (r8) | 8750 | 5 | r3r8 | 2112 | 4 / 6 | tema `forest`: 21 árvores, 6 toras (o bloco central do tema não aparece) |
| 5 | Estábulo (r11) | 8750 | 5 | r10r11 | 2400 | 4 / 3 | tema `stables`: baias, feno |
| 6 | Crematório (r7) | 11000 | 6 | r12r7 | 2400 | 4 / 3 | tema `ovens`: 4 fornos em fila (2 dos 6 do tema não aparecem), 10 caixões, 2 chaminés |

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
9. **Peças prometidas pelo tema que não aparecem.** O `put` do `zGen` só coloca uma peça quando acha espaço livre; quando não acha, ela some sem aviso. Ficaram de fora:
   - **Vila:** a cabana do Pântano e a do Brejo negro, o celeiro do Vinhedo, a tora central do Bosque, a cabana da Ilha do porto e o pilar do Pico da montanha;
   - **Sanatório:** os 2 mausoléus do Cemitério, a cabana do Brejo, a torre e a cabana da Ilha do lago, o celeiro do Pomar, o pilar central das Ruínas do convento, o bloco central da Floresta, a laje de metal da Pedreira e 2 dos 6 fornos do Crematório.

   As fichas da bíblia já contam com essa ausência; quem quiser essas peças precisa abrir espaço no tema sem mudar a quantidade de sorteios (ver as restrições da seção 1).
10. **Limites técnicos para as próximas fases:**
   - luz real a mais pesa no shader: luz nova deve entrar no pool ou ser emissiva/sprite;
   - objeto com colisão muda a navegação e a regra de escalada dos zumbis;
   - a Vila é enorme: cenário novo deve usar instâncias e o recorte por distância (`cullAdd`/`zCull`).

## 4. Proposta de divisão de trabalho para as próximas fases

Como tudo está num único `index.html`, vários agentes não podem editar o mesmo arquivo ao mesmo tempo sem conflito. A proposta:
- **Uma função por área**, num bloco `ATMOS` novo, chamada pelo `build` de cada mapa.
- **Uma seção compartilhada** para materiais, texturas, partículas e sons novos.
- **Cada agente trabalha numa cópia** e entrega um patch só da sua seção; a integração aplica os patches em sequência.

Isso fica para decidir junto com a aprovação desta fase.

## 5. Fase 3 (visual da Vila)

Integrada no commit `c2717a9` (branch `atmosfera`). As linhas abaixo são do `index.html` depois da fase 4 (17.349 linhas). Texturas e materiais novos valem só nos mapas de zumbi (variante `z:` do `genTex`, `texZ = curMapId === 'vila'`); os mapas PvP e o Sanatório continuam com o desenho original até a fase 5.

| Domínio | O que faz | Onde fica no código |
|---|---|---|
| 3A-1 paredes | reboco, pedra e tijolo envelhecidos da Vila (`vila_reboco`, `vila_pedra`, `vila_tijolo`), mais gastos além da segunda volta de muros | `genParede` 8146 (bloco "paredes da Vila" 8116); `marcas` e `theme` de `MAPS.vila` 1722 |
| 3A-2 chão | detalhe de grama, terra e calçamento pelo mundo, grama morta junto dos muros, praça de paralelepípedo | `chaoShader` 8611 e `ATMOS_POST` 8623; chão pintado de `buildVila` (`vilaGround`) |
| 3A-3 telhados | telha de barro, tabuinha e zinco envelhecidos (instâncias; a colisão não muda) | `TEL` 7393, dentro de `buildVila` 7305 |
| 3A-4 desgaste | marcas pontuais por área (cruz de cal, arranhão, fuligem, sangue, giz, Veio, arrasto) em paredes e chão, longe dos itens (`atLivre`) | `DESG` 13871 e `ATMOS_POST` 14025 |
| 3A-5 madeira e tecido | `madeira_podre`, `tabua_pintada`, `tecido`, `lona`, `estopa`, `crate`; `panoSujo` | `genMadTec` 8649 (bloco 8637) |
| 3A-6 metal, vidro e cerâmica | `ferrugem`, `zinco`, `latao`, `chapa`, `vidro`, `vidro_sujo`, `esmalte`, `ceramica`, `pintado` | `PROP` 8345, `propMat` 8457 |
| 3A-7 luz principal | noite de luar (céu, estrelas, lua baixa) e sombra que segue o jogador | `MAPS.vila` 1720 (`sky`, `sunC`, `shR`), `VIS` 7808, `visShadowTick` |
| 3A-8 luzes pontuais | personalidade da lâmpada por área (vela, lampião, poste, neon, falha), halos e poças de luz, janelas acesas | `LUZ_FK` 2135, `LUZ_AREA` 2142, `ATMOS_POST` 2182; `zUpdateWorld` (`zLampFk`) |
| 3A-9 névoa e volume | cor da névoa por área, respiração, névoa rasteira, bancos de neblina, feixes sob as lâmpadas | `NEV` 7003, `nevFog` e `ATMOS_POST` 7036; linha de névoa do `atmosTick` |
| 3A-10 partículas | campo de pontos que acompanha a câmera (poeira, cinza, fuligem, cal, pólen, esporos, moscas, mariposas, gotas, vaga-lumes) com mistura por área | `PART` 7107, shaders 7168/7209, `ATMOS_POST` 7225 |
| 3A-11 pós e `A.look` | tint, saturação, vinheta, contraste, granulação, aberração, bloom, cor de sombra e de alta por área | `gradePass` 7905; núcleo em `atmosTick` 2090 |
| 3A-12 animação de props | 10 animações novas dentro das áreas (A, D, F, K, M, c1, c3, b20, b01, b21), marcadas "3A-12 (v12)" | blocos `ATMOS.vila.<id>` |
| 3A-13 shaders especiais | água viva, superfície que respira, calor, umidade escorrendo, espelhos; desliga no gráfico Baixo | `SFX` 8835, `ATMOS_POST` 8940, `sfxTick` 9024 (até "3A-13 fim") |
| 3A-14 vegetação | copas, galhos, capim, mato, folhas no chão, arbustos, sebes, trepadeiras | `VEG` 1095 (bloco "v14" 1091) e `zGenDeco` |
| 3A-15 revisor | desempenho (LOD do miúdo, matrizes paradas, sombra que segue o jogador, sem bancos e feixes no Baixo) | marcas "3A-15" espalhadas pelos blocos acima |

As armas na mão (3B) não mexem no cenário; o estado delas está em `plano_fases.md`.

## 6. Fase 4: validação

Feita em 04/10/2026 só por leitura de código e scripts node (sem navegador). Scripts em `C:\dev\tiroteio-notas\work\fase4\`:
- `extrai.mjs`: avalia em node o trecho do `index.html` que monta `MAPS.vila` e grava portas, janelas, armas de parede, bebidas, Caixa, PaP, energia, armadilha, risers, spawns e as caixas do mapa;
- `colisores.mjs`: confere os colisores novos contra esses dados (resultado em `colisores.txt`);
- `gatilhos.mjs`: lista os 154 `A.trigger`/`A.anim`/`A.amb`/`MAP_ANIM` e marca alocação, LOS e volume (resultado em `gatilhos.tsv`);
- `textos.mjs`: procura textos e placas repetidos entre áreas;
- `fase4_fix.py`: as correções aplicadas no jogo.

### Portas e custos
`MAPS.vila.z` igual ao do commit `4eded8b` (antes da fase 3): 54 portas com os mesmos custos, 152 janelas, 38 armas de parede, 13 bebidas, 33 lugares da Caixa, PaP, energia, armadilha, 176 risers, spawns e as 1.821 caixas do mapa.

### Colisores novos (fases 2 e 3)
A fase 3 não acrescentou colisor (só trocou o material da cabine telefônica de c3). Os 16 `A.solid` são todos da fase 2. Nenhum fica a menos de 2,5 m de um item (o mais perto está a 6,5 m). Com `ZTOP` = 1,21 m, o jogador não fica de pé em nada mais alto e os zumbis escalam o resto: não há lugar alto e seguro.

| Área | Peça | Centro (x, z) | w × d × h (m) | Item mais perto | Vão < 3 m | Veredito |
|---|---|---|---|---|---|---|
| F | carroça de pedras | (25; −78) | 2,4 × 1,4 × 1,05 | porta FJ, 8,7 m | nenhum | ok (degrau escalável) |
| F | cavalete de paletós | (20; −68) | 2,6 × 0,5 × 1,75 | riser, 8,9 m | nenhum | ok (parede solta) |
| J | painel da lampisteria | (49,65; −128) | 2,9 × 2,6 × 2,6 | riser, 8,2 m | encostado no paredão | ok (fecha o vão atrás do painel) |
| O | bóia-sino | (−46; 120) | 2,2 × 1,4 × 1,1 | riser, 8,8 m | nenhum | ok |
| c3 | cabine telefônica | (−101,85; −119,2) | 1 × 1 × 2,4 | riser, 8,5 m | 0,33 m até um muro baixo (fresta onde ninguém cabe; a passagem do outro lado continua livre) | ok |
| c3 | balcão da farmácia | (−134; −87,62) | 2,4 × 0,6 × 1 | riser, 6,5 m | 3 cm do muro (encostado) | ok |
| b02 | base do mastro de rádio | (156; −214) | 1,6 × 1,6 × 0,5 | riser, 16,7 m | nenhum | ok (degrau) |
| b02 | base do cruzeiro | (216; −190) | 1,5 × 1,5 × 0,8 | arma de parede, 14,5 m | nenhum | ok |
| b32 | boi inchado | (−220; −130) | 3,2 × 1,8 × 1,1 | Caixa, 17,6 m | nenhum | ok |
| b31 | tanque de cal | (−184; −68) | 3 × 1,5 × 0,6 | riser, 16,8 m | nenhum | ok |
| b31 | mesa de triagem | (−202; 16) | 1,8 × 0,8 × 0,76 | riser, 9,1 m | nenhum | ok |
| b31 | cartaz do Exército | (−178; −8) | 2,3 × 0,3 × 2,4 | riser, 7,9 m | nenhum | ok |
| b31 | cabide de máscaras | (−226; −20) | 3,3 × 0,3 × 1,95 | janela 142, 11,2 m | nenhum | ok |
| b21 | cabana: parede norte | (−66; 207,7) | 4 × 0,3 × 2,4 | riser, 7,7 m | nenhum | ok |
| b21 | cabana: parede oeste | (−68; 206) | 0,3 × 3,4 × 2,4 | riser, 7,8 m | nenhum | ok |
| b21 | cabana: parede leste | (−64; 206) | 0,3 × 3,4 × 2,4 | riser, 9,7 m | nenhum | ok (a cabana fica aberta para o sul: é um recanto de 3,7 × 3,1 m onde os zumbis entram) |

### Gatilhos, animações e sons
- 31 gatilhos, 53 `anim` de área, 61 `amb`, 2 `anim` da névoa e o `sfxTick`. Nenhum mexe em `me.pos`/`me.vel`, `keys`, pointer lock, FOV, câmera, `Z` ou `ZC` do servidor; só leem. Os que mudam o mundo mexem em peças visuais (lâmpadas do pool, portas da ambulância, vagão, barcos).
- O "vale fecha" da Pedreira abafa o som do jogo inteiro, mas só sem zumbi a menos de 20 m e sem outro jogador a menos de 25 m, solta em 0,3 s quando um chega e tem trava de 45 s (cânone da bíblia, nº 20).
- Volume: o mais alto é o caminhão da Ponte velha (dente-de-serra 0,32 com passa-baixa de 260 Hz). O resto fica abaixo de 0,25 ou é filtrado e distante (apitos do Acampamento a 30–38 m, ronco da Mina com passa-baixa de 120 Hz). O tiro do jogo fica perto de 1.
- Jumpscares (súbito com som): g3 Castelo (holofote: clique e obturador), g4 Farol (sino atrás do jogador), g5 Serraria (a serra morde), g8 Brejo negro (o que boia), g9 Ponte velha (o caminhão). Nenhum grupo passa de 1; g1, g2, g6 e g7 não têm.
- Corrigido nesta fase:
  - Ruínas da cidade (c3): a campainha fazia raio de visada a cada quadro enquanto tocava e criava um array por quadro para a lâmpada da mesa. Agora o raio é 5× por segundo (como no núcleo) e a posição da lâmpada é calculada uma vez por toque.
  - Bairro queimado (b30): o `quando` da procissão criava um array por quadro; virou constante.
  - 3A-8: as janelas acesas usavam `forEach` com closure a cada quadro; virou laço simples.

### Props repetidos
- Corrigido: a Ilha do porto (b21) tinha um rastro de pés descalços da cabana até a água, o mesmo motivo do rastro do Pântano (c1) e a mesma malha e textura de pegada do Quartel (b31). Virou um par de tamancos de madeira na beira da água.
- Conferidos e mantidos (forma e história distintas, como pede a seção 7 da bíblia):
  - "ainda não acabou" (Mina, Fábrica, Farol, Hospital, Ferrovia, Vinhedo, Cemitério, Mina velha): motivo do cânone, cada um num meio;
  - "QUARENTENA": placa da Base militar, carimbo dos envelopes das Ruínas, portas dos contêineres do Cais;
  - pegadas de cal: coturno do Hospital (cânone) e pés descalços do Quartel;
  - "AGOSTO DE 1958": placa do Cemitério e cartaz do cinema das Ruínas.
- Para a fase 5: a tampa da caixa de mantimentos da Ilha do porto (3A-12) "bate como se algo empurrasse por dentro", sem som. É o motivo das "batidas de dentro" (nº 26), que fica no Necrotério; conferir quando o Sanatório for montado.
- As funções de grupo (`g2Barra`, `g3Quads`, `g4.cabo`, `G5.cel`, `G6.pl`, `pUV`, `H.beam`…) só montam primitivas; nenhuma monta o mesmo conjunto de peças em duas áreas. Os pares de tema do `zGen` (Base militar/Quartel, Cais/Estaleiro, Margem/Ponte velha, Encosta/Pico, Pântano/Brejo negro, Ruínas/Bairro queimado) ficaram com peças, materiais e água próprios.

### Em aberto
- Bancos de neblina em pé (3A-9) têm opacidade 0,32 de longe: deixam ver o zumbi atrás, mas apagam um pouco. Medir em jogo na fase 5.
- O relógio da Estação dá um estalo (0,5, passa-banda curto) a cada 60 s para quem está a menos de 20 m: é o loop da área, mas pode cansar.
- `MAP_ANIM` da fogueira do Acampamento (código do Vitor, fora da atmosfera) ainda cria uma closure por quadro (`fl.forEach`).
