# Mapa das áreas do modo Zumbis (Fase 0: reconhecimento)

Levantado em 02/10/2026 sobre a `main` no commit `5ee0def` (a coluna de estado visual da Vila foi atualizada na fase 4 e a do Sanatório na validação final, ambas em 04/10/2026, branch `atmosfera`); as linhas citadas são de `index.html` e foram conferidas de novo no mesmo dia, depois das fichas da bíblia (arquivo com 8.630 linhas).

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

Estado depois da fase 5 (conteúdo 5A em `ed2a517`, visual 5B em `918270f`). Vale para todas as salas do núcleo: paredes clínicas por sala (barra de azulejo, lambri, tinta a óleo ou cimento, desgaste crescendo da Recepção às Caldeiras), forro a 4,46 m nas salas cobertas, batentes descascando, pisos próprios por área, luminária e personalidade de luz por área com a escalada de escuridão, luar pelas janelas, luz de emergência nas áreas fundas, névoa e partículas por área, desgaste e decalques, céu encoberto e o pós que piora até o Crematório (ver §7).

| Ordem | Área (id) | Custo | Portas | Via | m² | Janelas / zumbis do chão | Estado visual (depois da fase 5) |
|---|---|---|---|---|---|---|---|
| 0 | Recepção (A) | 0 | 0 | — | 288 | 2 / 0 | lambri envernizado e forro, luz quente (a sala mais clara): retrato do Dr. Aurélio "DIRETOR · 1949", livro de admissões aberto (a última linha vira "Família 413" na assinatura), copos-de-leite, quadro de 40 pulseiras, cartaz do Programa, banco com a mala 117, relógio parado às 03:17, rádio de válvula tocando a valsa, samambaia viva demais; poeira nos fachos de luar |
| 1 | Capela (F) | 750 | 1 | AF | 288 | 1 / 0 | parede caiada com barra azulada, forro: Cristo cinzento com pulseira em branco, atril com a Bíblia e a campainha, galheta escorrendo o Veio, genuflexório com correias, 30 velas votivas numeradas (22 acesas), Via-Sacra do Programa (14 quadrinhos), missais numerados nos bancos; assinatura "a bênção" (sombra da mão erguida) |
| 1 | Enfermaria (B) | 750 | 1 | AB | 288 | 0 / 0 | azulejo branco-esverdeado até 1,5 m, calhas fluorescentes: biombos cujo pano respira, colchão de oleado que afunda (assinatura "alguém se deita"), soro do Veio no pedestal, pranchetas 61-2/77-1/118-1/214-3, seringas "dose 3", painéis de chamada, chinelos "61", quadro de febre |
| 1 | Pátio (C) | 1000 | 1 | AC | 288 | 1 / 3 | embasamento de cimento, céu encoberto: cacos de garrafa nos muros, chapéu de palha preso no muro sul, fonte seca com crosta preta e caneca acorrentada, trilha gasta em volta da fonte, bilhetes em pedras (família 88), relógio de sol raspado, campainha de recolhimento, escada sem os degraus de cima; redemoinho de areia; assinatura "os muros calam" |
| 2 | Laboratório (D) | 1750 | 2 | BD | 288 | 0 / 0 | branco clínico até 1,8 m, o mais limpo do prédio: potes de formol com mãos (Pote 1: chapa 17, a mão que bate), quadro-negro da "curva do despertar", microscópio com a lâmina 117-2, destilador e Erlenmeyer no Bunsen, quimógrafo girando, armário "VEIO — LOTE 12", relatório Nº 31, ralo de inox limpo |
| 2 | Refeitório (G) | 2000 | 2 | FG | 1008 | 2 / 0 | barra verde a óleo, forro, calhas: 48 lugares postos iguais (bandeja, colher, caneca numerada por mesa com água preta), mural dos "recuperados" e cardápio de giz, 40 pares de pés na fila, pianola de rolo rasgado em loop de 3,2 s, panelão com vapor e três moscas; assinatura "a hora da sopa" |
| 2 | Teatro (E) | 2000 | 2 | BE | 288 | 0 / 0 | lambri vermelho com moldura dourada gasta, forro: teatrinho de fantoches (o Doutor, a Enfermeira, Joãozinho com o 7), programas mimeografados roxos, caixotes de leite com nomes a giz, balões murchos, pote "PRÊMIO PARA QUEM DORMIR"; assinatura "a lanterna mágica"; flauta doce desafinada |
| 2 | Ala Psiquiátrica (J) | 2250 | 2 | BJ | 720 | 2 / 0 | barra verde de lona, forro, lâmpada do posto verde-acinzentada: colchões de crina nas divisórias, tubos acústicos de latão até o posto, gravador de fio, aparelho de eletroconvulsão, metrônomo que se adianta, camisas de força 156-2/162-1/171-3/189-1, pauta riscada a unha, amarras nas camas; assinatura "os tubos falam" |
| 2 | Jardim (K) | 2250 | 2 | CK | 1152 | 2 / 6 | mato seco e sebes com buracos de espiar: busto do Dr. Aurélio cuja cabeça segue o jogador, espelhos convexos nos cantos, placas esmaltadas, caderno de observação (nº 44 e 51), corujas anilhadas nos postes, silhuetas de enfermeira nas janelas altas; assinatura "as sebes olham" |
| 3 | Biblioteca (N) | 3000 | 3 | GN | 1008 | 3 / 0 | estantes com 30% de livros-prontuário cinzentos, fichário com a gaveta que anda, escada de rodinhas que desliza, abajur verde rachado, "Do sono sem sonho" com os óculos, cadeiras "S.I.", carrinho de devolução com a pulseira 216-2; luz de emergência sobre a porta; assinatura "a cadeira que vem ler" |
| 3 | Cozinha (H) | 3000 | 3 | GH | 864 | 2 / 0 | o alto tomado: vigas e grade de ganchos baixa com panelas, coifa de cobre a 2,1 m, câmara fria com unhas e avental na fresta, monta-pratos com o sapato, caixotes "DOAÇÃO DO PROGRAMA", marmita amarrada que bate, carrinho térmico ainda soltando vapor; vapor rasteiro; assinatura "a cozinha encolhe" |
| 3 | Necrotério (I) | 3000 | 3 | DI | 360 | 1 / 0 | azulejo frio, calhas, névoa fria: gavetas numeradas (214 amassada de dentro, 117 aberta com o pé cinzento), corpos sob lençóis (uma mão pende), pia de mármore com fio preto, ralo com crosta, livro de óbitos, ataduras e mordaças, carrinho-maca com correias que esticam, bacia de pulseiras cortadas; assinatura: a gaveta 214 bate três vezes |
| 3 | Estufa (L) | 3250 | 3 | KL | 720 | 2 / 0 | tudo cresce bem demais: tomates quase pretos, plaquinhas de canteiro (Fam. 31, 66), regadores de água preta "TORRE · IRRIGAÇÃO", farinha de osso, nebulização a 3,6 m, bolo de fubá morno, aquário com peixinho vivo, mudas com raízes de dedo, termômetro em 37,0 °C; assinatura "a rega" |
| 3 | Torre d'água (M) | 3750 | 3 | KM | 1008 | 3 / 5 | escorrimentos pretos no tanque e poça ao pé, cano do Veio com régua de nível, marcas de mãos subindo, 12 baldes de esmalte numerados com água preta, caixotes "CLORO · MINISTÉRIO DA SAÚDE" vazios, galo do cata-vento girando ao contrário, cadeado cortado; Pack-a-Punch; assinatura "alguém sobe a escada" |
| 4 | Caldeiras (P) | 4500 | 4 | HP | 720 | 3 / 0 | lâmpadas de gaiola, calor: painel de seis manômetros (ANEXO e FORNO no vermelho), volantes vermelhos, carvão com ficha meio queimada, óculos do foguista ("ainda não acabou"), tanque "NÃO BEBER", grade do túnel com arrasto atrás, apito de vapor; ar quente ondulando; energia; assinatura "a caldeira respira" |
| 4 | Cemitério (r1) | 5000 | 4 | Nr1 | 2196 | 3 / 6 | lápides de concreto lavado com os marcos 301 a 346, plaquetas de lata 347 a 352 e a cova aberta que anda (assinatura "a cova seguinte"), sulco de carrinho de mão em volta, lâmpada nua de extensão, carrinho de cal, demarcação das próximas covas, seis pás iguais; golpes de pá a cada 14 s |
| 4 | Túneis de serviço (r5) | 5250 | 4 | Nr5 | 2920 | 5 / 3 | forro de concreto a 3,3 m, trilho aéreo com ganchos, cano-mestre do Veio vazando num ralo, setas de cal (ANEXO, CONVENTO, FORNO), portinholas ao rés do chão, padiola "CARGA 22 → FORNO", canos com amianto, 14 lâmpadas de gaiola; assinatura "o apagar em fila" |
| 4 | Brejo (r13) | 5250 | 4 | Ir13 | 2040 | 3 / 6 | água oleosa quase preta com bordas de concreto, manilha de esgoto escorrendo, frascos âmbar boiando que andam (assinatura "os frascos chegam"), bote do serviço meio afundado, estacas de sondagem, tripé de dragagem, aguapés cinzentos, barba-de-velho nas 7 árvores secas, canaleta até o Necrotério; sem sapos |
| 4 | Pedreira (r3) | 5750 | 4 | Mr3 | 2196 | 3 / 6 | granito talhado com furos de broca, argolas com chapinhas (143-2…257-5), riscos de contagem e "ainda não acabou", pau-de-carga com cesto no alto do pilar, marmitas numeradas, escada de corda cortada, ninho de pedras com estopa; cascalho escorrendo; assinatura "a refeição" (o cesto desce) |
| 4 | Pomar (r10) | 5750 | 4 | Lr10 | 2440 | 4 / 6 | laranjeiras caiadas com copa lustrosa e laranjas de miolo cinza, pitangueiras, placa "LABORTERAPIA", escada de colheita, gaiola com o pássaro de corda, cestos etiquetados (leitos 12–16), banco com casaco, colmeias 4–6 com abelhas mortas, canaletas de rega; assinatura "o canto" (20 s de silêncio) |
| 4 | Lavanderia (r9) | 6000 | 4 | Mr9 | 2920 | 5 / 3 | 68 máquinas com tambor girando, dois trilhos de camisolas 347–360 (a primeira, "Antônio"), pilhas carimbadas 361–378, calandra, rol de roupa e carimbo, tina de anil, cestos de roupa cinza, luvas de borracha, véu de vapor alto; assinatura "a fila das camisolas" |
| 5 | Ferro-velho (r12) | 7000 | 5 | Pr12 | 2000 | 3 / 6 | sucata desbotada com placas "SL-…" da vila, porta de carro com 9 placas de famílias levadas, baú da ambulância sobre calços com o negatoscópio (assinatura), cilindros de éter, tambores de resíduo vazando, maletas de médico, girafa com sondas, porta que bate com o vento; flocos de ferrugem |
| 5 | Portaria (r2) | 7500 | 5 | r1r2 | 2112 | 4 / 6 | ambulância branca com o motor ligado, guarita com cúpula de vigia, prancheta, quadro de 20 crachás em ENTRADA, números das famílias nas vagas (101–140) e a vaga 413 vazia, cadeira de rodas de vime, bomba de gasolina pingando preto, mudança no teto de 5 carros, placa no muro sul |
| 5 | Anexo do asilo (r6) | 7750 | 5 | r5r6 | 2400 | 4 / 3 | divisórias com azulejo até 1,5 m, calhas: amarelinha C-01 a C-10 com a pedrinha que avança, sapatinhos à porta (C-07 só a etiqueta), caminhas de grade, desenhos de giz de cera, pia com dez escovas, balanço de tábua, quadro "DIAS PARA IR PARA CASA", tigelas de mingau intactas; caixinha de música |
| 5 | Ruínas do convento (r4) | 8000 | 5 | r1r4 | 2112 | 4 / 6 | tijolo caiado descascado e cantaria, arcos do claustro, roda dos expostos ("recebido — 412"), esteira com livro de horas, hábito pendurado, sineta da portaria com fita roxa, nichos de santas de rosto caiado, terços numerados, campas das irmãs (as 3 últimas em branco), ~40 tocos de vela; pó de reboco caindo |
| 5 | Ilha do lago (r14) | 8250 | 5 | r13r14 | 1960 | 4 / 6 | água lisa e espelhada, píer envernizado, gramofone (colisão baixa) com a valsa, chá posto para dois, cadeira de vime com charuto fumegando, cavalete com a aquarela do Sanatório, barco "REPOUSO", sinos de vento de vidro parados, lanternas de papel, partituras boiando; assinatura: a música corta no píer |
| 5 | Floresta (r8) | 8750 | 5 | r3r8 | 2112 | 4 / 6 | tiras de camisola listrada marcando a fuga, cocho dos cães e guia cortada, armadilha sobre um tamanco, cerca farpada tombada, quepe e lanterna acesa no musgo, folhiço, covinha de cal com o sapato do guarda, vaga-lumes; assinatura: pegadas descalças que acompanham |
| 5 | Estábulo (r11) | 8750 | 5 | r10r11 | 2400 | 4 / 3 | tábuas escuras arranhadas, feno manchado, cavalo sob a lona que respira (o casco escorrega), fichas de baia A-01…A-11, tronco de contenção com cintas, cocho de leite talhado, ferraduras "1956", cabrestos com eletrodos, balança de gado "peso antes / depois"; moscas |
| 6 | Crematório (r7) | 11000 | 6 | r12r7 | 2400 | 4 / 3 | tijolo refratário com fuligem, lâmpadas de gaiola, neve de cinza: portas de ferro com visor de mica (forno 3 entreaberto com a pulseira Nº 1), mesas de rolos, carrinho de cinzas, arquibancada de urnas numeradas, livro da lista (413-1 a 413-4 em branco), caixões de pinho, painel em 900 °C, fumaça das chaminés; assinatura "a chamada" |

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

## 7. Fase 5B (visual do Sanatório)

Integrada no commit `918270f` (branch `atmosfera`), sobre o conteúdo da 5A (`ed2a517`). Como na 3A, cada domínio é um bloco próprio marcado `// ===== 5B-n` que entra por `ATMOS_POST` com `mapId === 'sanatorio'`; a Vila e os mapas PvP não mudam (texturas novas pela variante `s:` do `genTex`). As linhas são do `index.html` em `918270f` (23.974 linhas).

| Domínio | O que faz | Onde fica no código |
|---|---|---|
| 5B-1 arquitetura | paredes clínicas por sala (azulejo, lambri, barra a óleo, embasamento de cimento; desgaste da Recepção às Caldeiras), forro a 4,46 m em A, F, B, D, G, E, J, N, H, I e P (estuque ou tábuas, vigas, infiltração, buracos), batentes descascando | `SAN1`, `genSan` (texturas `s:`), `san1Parede`, `san1Teto`; bloco 15127–15390 |
| 5B-2 pisos e materiais | piso próprio por cômodo e região, preso ao mundo, com caminho gasto entre portas e itens, sujeira junto das paredes, mancha úmida perto de ralos e janelas e abandono crescendo até o Crematório; materiais `san_*` nas caixas de metal; 2ª amostra do piso (`PISO_MIX`) só no Alto | `SANP_TEX`, `genPisoSan`, `SANP_ZONA`; bloco 13606–13901 |
| 5B-3 luz | personalidade da lâmpada por área, luminárias visíveis (calha fluorescente, prato, gaiola, capa), escalada de escuridão pela ordem de desbloqueio, luar pelas janelas, luz de emergência vermelha nas áreas fundas, arma na mão com a cor da área | `SAN_LUZ` e o seu `ATMOS_POST`; bloco 2238–2387 |
| 5B-4 névoa e volume | cor da névoa por área, névoa que fecha nas bordas das regiões, rasteira, véus de vapor e fumaça, 20 fachos de luar | `NEV.cor/baixa/fecha.sanatorio`, `NEV.san`, `nevFecha`; bloco 12014–12091 |
| 5B-5 partículas | o campo de pontos da 3A-10 com a mistura de cada área (poeira, cal, esporos, moscas, mariposas, ferrugem, cinza); sem partículas no Baixo | `PART.sanatorio`; bloco 12158–12198 |
| 5B-6 desgaste e decalques | mofo, infiltração (abaixo do forro), ferrugem, umidade brilhante, rodas de maca, arrasto, pegadas de cal, unhas, sangue velho, azulejos faltando; densidade crescendo com a ordem; nada sobre o que a 5A já desenhou | `DESG_SAN`, `desgSanAtlas`; bloco 20391–20777 |
| 5B-7 shaders especiais | o ramo do Sanatório da 3A-13: azulejo que sua (Enfermaria; Necrotério com estrias do Veio; só a camada transparente, o azulejo é o do 5B-1), vidro das janelas quebrado e embaçado, mofo que respira nos Túneis, o Veio vivo nas poças e no Brejo, metal em brasa nas Caldeiras, fendas e ar tremendo no Crematório; mesma troca do Baixo e o mesmo `sfxTick` | `SAN_SUOR`, `SAN_VIDRO`; bloco 14812–15014 |
| 5B-8 céu e pós | noite encoberta; o pós (tint, saturação, vinheta, grão) piora pela ordem de desbloqueio até o Crematório; o Sanatório passa pelo passe de cor leve do Médio (`posLeve`) | `ceuNublado` 12947, `SAN_PIORA`/`sanPiora` 12985–13014 |
| 5B-9 exterior e vegetação | mato seco, hera morta, árvores secas retorcidas, muros, cerca, postes tortos e fachadas vistas pelas janelas, em pedaços com distância de desenho e o LOD do miúdo da 3A-15 | `VSAN`, `vsHeraGeo`, `vsArvGeo`; bloco 14060–14597 |
| 5B-10 revisor | conflitos entre domínios (fio da luminária com o forro, faixa de azulejo duplicada do 5B-7, infiltração acima do forro, fachos do 5B-3 iguais aos do 5B-4) e desempenho (grão sem ler o canvas, piso sala a sala, `PISO_MIX` só no Alto, sem partículas no Baixo, raios do desgaste só no alcance) | marcas "5B-10" espalhadas pelos blocos acima |

## 8. Validação final (fase 4 dos dois mapas)

Feita em 04/10/2026 sobre `918270f`, com um navegador por vez e nenhum outro agente rodando. Scripts e dados em `C:\dev\tiroteio-notas\work\valfinal\` (`perf.cjs`, `run2.sh`, `run3.sh`, `md.py`, `pvp2.cjs`; resultados em `perf2`, `perf2c`, `perf3`, `pvp`).

**Como foi medido.** Chromium sem janela (Playwright) com a placa de vídeo da máquina (ANGLE D3D11, **Intel UHD Graphics integrada**), tela 1280 × 720, sem vsync e sem limite de quadros (`--disable-gpu-vsync --disable-frame-rate-limit`), então o intervalo entre quadros é o custo real do quadro (lógica + desenho). Todas as portas abertas, sem zumbis. Tomadas fixas: 5 por área (4 dentro da área, olhando para o centro, e 1 de cima), em 8 áreas da Vila (A, B, F, J, L, c1, c3, b01) e 10 do Sanatório (A, B, G, I, H, P, r5, r9, r7, r2); em cada tomada, 120 quadros. Duas rodadas alternadas (antes, conteúdo, final, final, conteúdo, antes); na Vila em Baixo vale só a primeira rodada (a segunda coincidiu com um build de outro projeto na mesma máquina; refeita depois, com a máquina mais lenta, deu a mesma ordem: 8,8 → 27,4 → 19,5 ms). "Quadro mediano" é a mediana das medianas das tomadas; "p90" é a mediana dos p90 das tomadas (mede os engasgos). "Montagem" é o `startHost` do mapa; "aquecimento" é o tempo até sumir o "Carregando o mapa…" (`warmUp`).

Versões comparadas (todas tiradas com `git show <commit>:index.html`): **antes de tudo** = `27301df` na Vila (o `4eded8b` pedido já tem a fase 2: só difere do `de6057e` por 2 linhas, o gancho `ATMOS_POST`) e `5ea2142` no Sanatório; **só conteúdo** = `de6057e` (fase 2) na Vila e `ed2a517` (5A) no Sanatório; **final** = `918270f` nos dois.

Uma primeira série foi descartada: um laço de medição anterior continuou rodando em paralelo e as duas medições disputaram a placa (os números saíam quase o dobro). Tudo abaixo é da série limpa.

### Desempenho

| Mapa | Gráfico | Versão | Quadro mediano (ms) | p90 (ms) | FPS (mediana) | Draw calls (mediana / máx.) | Montagem (s) | Aquecimento (s) |
|---|---|---|---|---|---|---|---|---|
| Vila | Médio | antes de tudo (`27301df`) | 4,4 | 6,7 | 227 | 226 / 416 | 0,7 | 2,0 |
| Vila | Médio | só conteúdo (`de6057e`) | 8,9 | 13,4 | 112 | 502 / 946 | 2,2 | 6,8 |
| Vila | Médio | final (`918270f`) | 12,2 | 18,4 | 82 | 580 / 1084 | 5,8 | 9,7 |
| Vila | Alto | antes de tudo (`27301df`) | 9,6 | 17,1 | 104 | 524 / 785 | 1,7 | 2,0 |
| Vila | Alto | só conteúdo (`de6057e`) | 16,4 | 113,0 | 61 | 723 / 1343 | 2,2 | 7,7 |
| Vila | Alto | final (`918270f`) | 19,8 | 103,8 | 51 | 758 / 1383 | 5,7 | 9,9 |
| Vila | Baixo | antes de tudo (`27301df`) | 4,5 | 6,6 | 220 | 370 / 859 | 0,6 | 2,0 |
| Vila | Baixo | só conteúdo (`de6057e`) | 10,9 | 15,1 | 92 | 946 / 2010 | 1,4 | 4,1 |
| Vila | Baixo | final (`918270f`) | 8,9 | 12,4 | 112 | 548 / 1022 | 5,4 | 4,9 |
| Sanatório | Médio | antes de tudo (`5ea2142`) | 3,0 | 5,0 | 333 | 113 / 203 | 0,5 | 3,1 |
| Sanatório | Médio | só conteúdo (`ed2a517`) | 9,8 | 14,8 | 103 | 376 / 754 | 2,8 | 10,3 |
| Sanatório | Médio | final (`918270f`) | 9,4 | 13,2 | 106 | 470 / 834 | 3,4 | 8,7 |
| Sanatório | Alto | antes de tudo (`5ea2142`) | 4,8 | 7,9 | 208 | 194 / 309 | 0,7 | 2,4 |
| Sanatório | Alto | só conteúdo (`ed2a517`) | 12,9 | 23,2 | 77 | 465 / 866 | 1,8 | 6,4 |
| Sanatório | Alto | final (`918270f`) | 14,1 | 107,3 | 71 | 552 / 961 | 3,3 | 9,2 |
| Sanatório | Baixo | antes de tudo (`5ea2142`) | 4,4 | 5,6 | 227 | 113 / 199 | 1,3 | 3,4 |
| Sanatório | Baixo | só conteúdo (`ed2a517`) | 13,9 | 19,6 | 72 | 374 / 743 | 3,0 | 8,9 |
| Sanatório | Baixo | final (`918270f`) | 16,0 | 20,2 | 62 | 424 / 794 | 5,8 | 10,2 |


**Vila, Médio, quadro mediano por área (ms): antes → só conteúdo → final (sem corte)**

| Área | A | B | F | J | L | c1 | c3 | b01 |
|---|---|---|---|---|---|---|---|---|
| ms | 7,0 → 12,9 → 16,2 | 5,0 → 12,1 → 16,4 | 4,8 → 10,8 → 15,2 | 3,2 → 7,9 → 10,9 | 4,0 → 8,1 → 12,2 | 4,0 → 7,7 → 11,3 | 3,4 → 8,1 → 11,1 | 3,0 → 6,5 → 8,8 |

**Sanatório, Médio, quadro mediano por área (ms): antes → só conteúdo → final (sem corte)**

| Área | A | B | G | I | H | P | r5 | r9 | r7 | r2 |
|---|---|---|---|---|---|---|---|---|---|---|
| ms | 4,6 → 18,9 → 13,1 | 3,1 → 11,4 → 12,0 | 3,3 → 11,2 → 11,4 | 3,3 → 11,8 → 10,4 | 2,5 → 11,9 → 9,9 | 3,2 → 9,0 → 8,8 | 2,4 → 7,1 → 6,5 | 2,2 → 6,7 → 7,2 | 2,2 → 6,0 → 6,7 | 2,0 → 8,1 → 7,9 |

### Cortes do Médio

A meta era ficar abaixo de ~12 ms de mediana e de 16,7 ms de p90 no Médio. O Sanatório ficou abaixo (9,4 / 13,2 ms) e não teve corte. A Vila ficou acima nas três séries em que o final foi medido (mediana 12,2 a 13,1 ms; p90 17,5 a 19,9 ms) e recebeu os cortes já identificados, medidos um a um (Vila, Médio, duas rodadas alternadas, `perf3`):

| Variante | Quadro mediano (ms) | p90 (ms) | Praça (A) | Igreja (B) |
|---|---|---|---|---|
| final, sem corte | 12,6 | 17,5 | 15,6 | 15,7 |
| V1: vegetação do Médio com 75% da densidade e distância de desenho no meio do caminho até a do Baixo | 11,8 | 16,8 | 15,8 | 15,1 |
| V2: sem o passe de cor do Médio na Vila | **10,7** | **14,4** | 15,3 | 15,6 |
| V1 + V2 | 10,5 | 14,2 | 13,8 | 14,4 |

- **Aplicado: só o V2** (`POS_MEDIO_FORA = { vila: 1 }`, junto de `posLeve`). Sozinho ele já põe a Vila dentro da meta (−15% de mediana, −18% de p90). O look por área da Vila (tint, saturação, vinheta, granulação) passa a existir só no Alto, como antes da integração da fase 3; o Sanatório continua com o passe no Médio.
- **Não aplicado: V1.** Ganho de 0,2 ms sobre o V2, dentro do ruído, tirando mato e árvores.
- **Sanatório, testados e não aplicados:** piso do 5B-2 em Lambert no Médio e superfícies vivas (5B-7/3A-13) desligadas no Médio. Juntos deram 9,8 ms contra 9,4 do final (sem ganho; `perf2c`).

### Conclusões

- **60 FPS nesta máquina (Intel UHD integrada).**
  - **Médio:** cabe. Sanatório com 9,4 ms de mediana (106 FPS) e p90 de 13,2 ms. Vila, com o corte, 10,7 ms (93 FPS) e p90 de 14,4 ms. A folga é pequena nas áreas mais carregadas: Praça e Igreja ficam em ~15,5 ms de mediana, logo abaixo dos 16,7 ms.
  - **Alto:** não cabe na Vila (19,8 ms, 51 FPS). No Sanatório a mediana cabe (14,1 ms, 71 FPS), mas o p90 passa de 100 ms nos dois mapas: há engasgos longos no Alto que já existem desde o "só conteúdo" (no "antes de tudo" o p90 era 17 ms na Vila e 8 ms no Sanatório). O Alto não é para esta placa.
  - **Baixo:** na Vila cabe (8,9 ms, 112 FPS, p90 12,4 ms; a fase 3 até baixou o custo do Baixo, de 10,9 para 8,9 ms, ao tirar bancos de neblina e feixes e reduzir o miúdo). No Sanatório o Baixo fica **mais lento que o Médio**: 16,0 ms (62 FPS) e p90 de 20,2 ms, no limite. Isso já vem do conteúdo (a 5A no Baixo dá 13,9 ms, contra 9,8 no Médio). Fica como pendência investigar o motivo: o Baixo usa Lambert e escala 0,8, e mesmo assim desenha mais devagar.
- **De onde vem o custo.** O visual (fases 3 e 5B) custa pouco perto do conteúdo das áreas (fases 2 e 5A):
  - na Vila, no Médio: 4,4 → 8,9 ms com o conteúdo e → 12,2 ms com o visual (10,7 ms depois do corte);
  - no Sanatório: 3,0 → 9,8 ms com o conteúdo, e o 5B fica empatado (9,4 ms; as otimizações do revisor 5B-10 pagaram o próprio domínio).

  O que pesa é o número de chamadas de desenho: na Vila, de ~230 para ~500 com o conteúdo e ~580 com o visual; no Sanatório, de ~110 para ~380 e ~470. Nesta placa, o custo cresce com as chamadas, e não com os shaders: os cortes de shader e de pós do Sanatório não mudaram nada.
  - O próximo ganho grande é juntar as malhas paradas de cada área por material. Fica como recomendação: é mudança de estrutura, não um corte barato.
- **Montagem e aquecimento:**
  - a montagem do mapa sobe de 0,7 s para 5,8 s na Vila (Médio) e de 0,5 s para 3,4 s no Sanatório;
  - o aquecimento de shaders sobe de 2 s para ~10 s na Vila e de 3 s para ~9 s no Sanatório.

  Os dois acontecem atrás da tela "Carregando o mapa…", e nenhuma tomada teve erro de página.
- **Meta de +8%.** Contra o "só conteúdo", no Médio:
  - a Vila final fica em +36%, e em +20% com o corte;
  - o Sanatório fica em −3%.

  A meta só não foi atingida na Vila, e o que sobra depois do corte é o próprio visual da fase 3 (paredes, telhados, vegetação, desgaste e luz), sem outro corte barato.

### PvP e menu (contra `4eded8b`)

Smoke com `pvp2.cjs`: host local, câmera fixa no primeiro ponto de nascimento, 4 direções, gráfico Médio, duas rodadas alternadas por versão (`4eded8b` e o `index.html` final com as correções desta validação).

| Mapa / modo | Erros de página | Quadro (ms, as 4 direções) | Draw calls | Imagem |
|---|---|---|---|---|
| Arena, mata-mata (`dm`) | 0 nas duas | 1,3–2,2 (4eded8b 1,4–2,2) | 10–33 nas duas | cenário igual |
| Duna, Rodadas (`rounds`) | 0 nas duas | 1,4–2,8 (4eded8b 1,7–2,7) | 9–69 nas duas | cenário igual |
| Menu (sem partida) | 0 nas duas | — | — | idêntico (diferença 0 pixel) |

As diferenças de imagem entre versões ficam na mesma faixa que entre duas rodadas da mesma versão. Elas vêm de duas coisas:
- as texturas de canvas (rachaduras), sorteadas a cada carga;
- a arma na mão, que mudou de propósito na fase 3B (a pose de repouso do 4eded8b ainda tinha o braço esquerdo cobrindo a tela, corrigido pelo a15).

As únicas falhas de rede são os 4 recursos externos que o script de teste bloqueia, iguais nas duas versões.

### Números (bíblia §6)

Duas colisões corrigidas no jogo:
- balança do Estábulo: "412 kg" virou "418 kg";
- setas dos Túneis: os lotes "L. 31" e "L. 40" viraram "L. 42" e "L. 45".

Os números novos da fase 5 foram registrados em `biblia_terror.md` §6.
