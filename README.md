# Dan of Duty

FPS multiplayer que roda direto no navegador: x1 estilo Counter-Strike e um modo Zumbis cooperativo estilo Call of Duty. Cada um joga no seu computador!

## Como jogar

1. Abra o jogo (pelo link do GitHub Pages ou abrindo o `index.html` no Chrome/Edge).
2. Na aba **Jogar**, o host escolhe o modo, o mapa e as opções nos cartões e clica em **Criar sala**. Ele recebe um código de 5 letras.
3. O amigo digita o código em **Entrar em sala** (ou abre o link `...?sala=CODIGO`).

Funciona na mesma rede Wi-Fi ou em casas diferentes pela internet. A conexão é P2P (WebRTC via PeerJS): não precisa abrir porta no roteador nem ter servidor próprio. As duas máquinas precisam de internet para o pareamento inicial.

O host roda a partida no navegador dele. Se o host fechar a aba, a partida acaba.

Como a conexão funciona: posições (30 por segundo), bots e zumbis (20 por segundo) vão num canal sem retransmissão, para um pacote perdido não segurar os seguintes; compras, abates e placar vão num canal confiável. Quem recebe desenha os outros um pouco no passado (50 a 300 ms, medido pelo intervalo entre fotos e pela tremida da rede nos últimos segundos; numa rede boa fica perto de 100 ms) e interpola entre as fotos, para o movimento ficar liso. Se uma foto se perde ou atrasa, o boneco segue a última velocidade por até 0,2 s e, quando a foto chega, a diferença some aos poucos em vez de dar um tranco para trás; um salto grande (renascer) troca de uma vez, sem atravessar parede. O golpe de zumbi só vai para quem apanhou; os outros veem a vida no placar. O host confere o que cada cliente manda antes de repassar.

## Modos

- **Rodadas:** estilo CS. Uma vida por rodada, dinheiro, compra no começo da rodada.
- **Mata-mata:** renasce, tudo grátis.
- **Zumbis:** cooperativo (até 4), inspirado no CoD Zombies. Veja abaixo.

## Modo Zumbis

Dois mapas:

- **Vila** (aberta e colossal, ~480 m de lado, 33 áreas): três anéis em volta de uma praça com chafariz, onde vocês começam. No anel de dentro, portões de ferro levam à Igreja (norte), à Fazenda (leste), ao Cemitério (oeste) e ao Lago (sul). Portões no muro do meio (1500) levam ao anel do meio, que tem 4 áreas ligadas por portas nas sebes (1250): Pedreira (nordeste, com o gerador de energia), Estação de trem (sudeste), Acampamento com fogueira (sudoeste) e Castelo em ruínas (noroeste, com o Pack-a-Punch no pátio). Do anel do meio, corredores com portão (2000) atravessam o muro externo até oito distritos de fora, dois em cada lado, separados por uma porta (1500): Hospital de campanha e Mina (norte), Fábrica e Ferrovia (leste), Porto e Farol (sul), Floresta e Serraria (oeste). Dos distritos saem mais 16 áreas: nos quatro cantos, entre dois distritos, corredores com portão (2500) levam à Base militar (nordeste), ao Pântano (sudeste), ao Vinhedo (sudoeste) e às Ruínas da cidade (noroeste); atrás dos distritos e dos cantos, corredores (3000) chegam a um anel de 12 áreas lá fora, três por lado, ligadas entre si por portas de 3500 e 4000: Encosta, Mina velha e Pico da montanha (norte), Margem do rio e Ponte velha, com o rio e as pontes (leste), e o Bosque; Cais, Ilha do porto (só se chega à ilha pelo píer) e Estaleiro (sul); Bairro queimado, Quartel e Brejo negro (oeste). Cada área nova tem janelas, uma arma de parede, um lugar da Caixa e zumbis saindo do chão. Grades de ferro e a água deixam a bala passar, mas ninguém atravessa. Os zumbis pulam os muros pelas janelas de tábua ou saem do chão no meio das áreas.
- **Sanatório** (enorme, ~240 x 205 m, 29 áreas): vocês começam na Recepção. O núcleo antigo (Enfermaria, Pátio, Laboratório, Teatro e Capela) leva às alas novas: a oeste Refeitório, Biblioteca, Cozinha e Caldeiras (com o gerador de energia); ao norte Necrotério e Ala Psiquiátrica; a leste o Jardim com chafariz, a Estufa e a Torre d'água (com o Pack-a-Punch embaixo dela). Portas de 750 a 1500. Em volta do prédio, atrás de um vão por onde os zumbis chegam às janelas, fica um anel de 14 áreas novas: corredores com portão (2000 a 2500) saem da Biblioteca, da Torre d'água, da Estufa, das Caldeiras e do Necrotério, e as áreas se ligam por portas de 2500 a 4000. Ao norte o Cemitério, a Portaria (estacionamento) e a Pedreira; a oeste as Ruínas do convento, os Túneis de serviço, o Anexo do asilo (celas) e o Crematório; a leste a Floresta, a Lavanderia, o Pomar e o Estábulo; ao sul o Ferro-velho, o Brejo e a Ilha do lago (só pelo píer). Cada área nova tem janelas, uma arma de parede, um lugar da Caixa e zumbis saindo do chão (no Pátio, no Jardim e na Torre d'água também).

Todo mundo começa com uma M1911.

### Dificuldades

| | Fácil | Normal | Difícil | Pesadelo |
|---|---|---|---|---|
| Vida dos zumbis | 70% | 100% (CoD) | até 130% (cheia na rodada 6) | até 155% (cheia na rodada 10) |
| Dano do golpe / golpes para cair | 34 / 3 | 50 / 2 | 60 / 2 | 75 / 2 |
| Golpes para cair com Juggernog | 8 | 5 | 5 | 4 |
| Quantidade por rodada | 75% | 100% | 120% | 135% |
| Zumbis ao mesmo tempo (máx.) | 20 | 24 | 28 | 30 |
| Começam a correr | mais tarde | normal | mais cedo | parte já trota na rodada 1 |
| Pontos iniciais | 1500 | 500 | 500 | 500 |
| Pontos por acerto e por morte | +35% | normal | -10% | -20% |
| Vida volta depois de (sem levar golpe) | 2,5 s | 3,5 s | 4 s | 4,5 s |
| Tempo para encher 100 de vida | 4 s | 5 s | 5,6 s | 6,3 s |
| Tempo caído até sangrar | 60 s | 45 s | 35 s | 25 s |
| Power-ups | mais | normal | menos | bem menos |
| Especiais / Carniceiro | 2 rodadas depois, menos / rodada 14 | rodada 4+ / rodada 12 | 1 rodada antes / rodada 11 | 2 rodadas antes, mais / rodada 10 |

A dificuldade aparece no canto de cima, junto com o nome do mapa.

- **Rodadas infinitas.** A vida dos zumbis segue a fórmula do CoD (150 na rodada 1, +100 por rodada até a 9, depois ×1,1). A quantidade cresce a cada rodada. Os zumbis começam andando e passam a correr e disparar nas rodadas altas.
- **Pontos:** 10 por acerto; ao matar, 60 (corpo), 50 (pernas ou explosão), 100 (headshot) ou 130 (faca), mais o extra dos zumbis especiais (veja abaixo). Consertar janela dá 10 por tábua (até 500 por rodada).
- **Sem lugar seguro:** os zumbis sobem em tudo que você alcança com um pulo (chafariz, fogueira, balcão, maca, caixote, até 1,21 m) e batem em quem está em cima. Nos mapas de zumbi não dá para ficar de pé em nada mais alto que isso (muro, telhado, pilha de caixotes, pedra alta) nem andar sobre a água. Zumbi que fica preso longe de todos volta para a fila afundando no chão, e nunca some na frente de quem está vendo.
- **Janelas:** os zumbis vêm de fora, arrancam as tábuas e pulam para dentro. Segure F perto da janela para pregar as tábuas de volta. Na Vila (e nos lugares abertos do Sanatório) eles também saem do chão.
- **Portões, portas e entulho** (750 a 4000; quanto mais longe, mais caro) liberam novas áreas, com mais armas e mais janelas.
- **Armas de parede** (contorno de giz, na parede ou em placas de madeira): M14, Olympia, MP40, MP5K, AK-74u, Stakeout, granadas, Semtex, Claymores e Faca Bowie; nas alas novas do Sanatório, nos anéis de fora da Vila e nas áreas novas dos dois mapas também Dragunov, Galil, SPAS-12, FAL, Commando, HK21 e RPK. Se você já tem a arma, compra munição pela metade do preço (arma com Pack-a-Punch: 4500).
- **Caixa Misteriosa (950; 10 durante a Liquidação):** arma aleatória entre mais de 40:
  - Pistolas: CZ75, Python, Five-seven, B23R (rajada de 3) e Mauser C96.
  - Submetralhadoras: PPSh-41 (tambor de 71), Thompson, Spectre, Kiparis, Uzi e PM63.
  - Fuzis: Galil, Commando, FN FAL, STG-44, M16 (rajada de 3), AUG, Famas, G11 (rajada de 3, bem rápida) e Enfield.
  - Metralhadoras: RPK, HK21, MG42 e Stoner63. Escopetas: SPAS-12, Trench Gun, HS10 e KS-23.
  - Precisão: Dragunov, Kar98k (ferrolho, mira de ferro), L96A1 e PSG1. Explosivos: China Lake, M72 LAW e Besta (virote explosivo).
  - Armas maravilha (raras): Ray Gun, Ray Gun Mark II (rajada de 3), Arma Trovão, Wunderwaffe DG-2 (o raio pula de zumbi em zumbi, até 8; com Pack-a-Punch vira a DG-3 JZ, até 14) e Winter's Howl (cone de gelo de curto alcance: mata quem está perto e deixa lento quem sobrevive).
  - Macacos com Pratos. Às vezes sai o ursinho: você recebe os pontos de volta e a caixa muda de lugar (sempre para uma área já aberta).
  - Toda arma da caixa tem versão Pack-a-Punch com nome próprio (PPSh-41 vira The Reaper, Kar98k vira Armageddon, MG42 vira Barracuda FU-A11...).
- **Energia:** fica no gerador da Pedreira (Vila) ou nas Caldeiras (Sanatório). Ligue para ativar as bebidas e o Pack-a-Punch.
- **Bebidas** (máximo de 4 compradas; as máquinas ficam espalhadas pelas áreas): Juggernog (2500: vida vai a 250, 2,5 vezes mais golpes), Speed Cola (3000: recarrega na metade do tempo), Double Tap (2000: atira 33% mais rápido), Quick Revive (1500: reanima rápido; sozinho, te levanta até 3 vezes), Stamin-Up (2000: corre mais), e mais oito:
  - **PhD Flopper (2000):** suas explosões (granada, Ray Gun, China Lake, Mustang & Sally) não te machucam, e deslizar (correndo, aperte C) termina numa explosão em volta de você (raio de 4 m, uma a cada 2 s).
  - **Deadshot Daiquiri (1500):** ao começar a mirar (botão direito), a mira vai para a cabeça do zumbi mais perto do centro; menos dispersão e headshot 50% mais forte.
  - **Mule Kick (4000):** carrega uma terceira arma (tecla 5 ou a roda do mouse). Com as três cheias, a arma nova (parede, caixa) troca a que está na mão. Ao cair você perde o Mule Kick e a terceira arma, como no CoD.
  - **Electric Cherry (2000):** recarregar solta um choque em volta: quanto mais vazio o pente, maior o raio (até 4 m) e o dano (uma vez a cada 2,5 s).
  - **Vulture Aid (3000):** zumbi que você mata às vezes (12%) deixa uma carniça verde que só você vê: passe por cima para ganhar 20 a 50 pontos e meio pente da arma na mão (some em 15 s). Os power-ups no chão brilham através das paredes.
  - **Widow's Wine (4000):** quando um zumbi te acerta, solta uma teia que prende (anda a 20% por 5 s, e para de bater por 1 s) todos os zumbis a até 4,5 m. São 3 cargas (o número aparece no ícone), uma a cada 1,5 s no máximo; a Munição Máxima recarrega.
  - **Dying Wish (4000):** um golpe que te derrubaria te deixa de pé com 1 de vida e intocável por 4 s (a borda da tela fica vermelha e o tempo aparece em baixo); depois recarrega por 90 s (o ícone fica apagado).
  - **Timeslip (2000):** a Caixa Misteriosa gira em 2 s e o Pack-a-Punch fica pronto em 1,75 s (metade do tempo).
  - Máquinas novas: Vulture Aid na Ala Psiquiátrica, Widow's Wine no Jardim, Dying Wish na Estufa e Timeslip no Refeitório (Sanatório); Vulture Aid na Igreja, Widow's Wine na Fazenda, Dying Wish no Lago e Timeslip no Cemitério (Vila).
  - O limite continua 4 bebidas compradas, como no CoD clássico: com 13 máquinas a escolha faz parte da estratégia (a Bebida Grátis passa do limite).
  - Ao cair você perde todas as bebidas (e as cargas da teia).
- **Equipamentos de parede:** **Semtex (500)**, granada que gruda no que tocar (parede, chão ou zumbi) e explode em 2 s (raio de 5,5 m, mais forte que a HE; comprar Semtex troca as granadas HE e vice-versa; as +2 por rodada e a Munição Máxima repõem a que você tem). **Claymores (1000)**, 2 minas: com elas na mão (tecla 4), clique para pôr no chão à sua frente (até 2 no chão por jogador; o host confere distância, parede e lugar). Armam em 1 s e explodem quando um zumbi chega a 1,7 m (raio de 3,8 m, dano cresce com a rodada; não machucam você). Voltam a 2 a cada rodada e com a Munição Máxima. No Sanatório: Semtex na Capela e Claymores no Pátio; na Vila: Semtex no Lago e Claymores na Igreja.
- **Pack-a-Punch (5000; 1000 durante a oferta):** fica no pátio do Castelo (Vila) ou embaixo da Torre d'água (Sanatório). Dobra o dano, aumenta o pente e dá nome e camuflagem novos à arma (a M1911 vira a explosiva Mustang & Sally).
- **Power-ups:** caem dos zumbis e duram 26s no chão. São eles: Munição Máxima (enche também a terceira arma, os Macacos com Pratos, Semtex, Claymores e as cargas do Widow's Wine), Insta-Kill, Pontos em Dobro, Nuke (+400), Carpinteiro (+200), **Liquidação** (a Caixa Misteriosa custa 10 por 30 s e o ursinho não aparece), **Máquina da Morte** (quem pega fica 30 s com uma metralhadora giratória sem recarga e não troca de arma até acabar), **Pack-a-Punch em oferta** (1000 por 30 s; só cai com a energia ligada) **Sangue Zumbi** (15 s em que nenhum zumbi persegue quem pegou; a borda da tela fica vermelha), **Pontos Bônus** (+500 para quem pegou) e, rara, a partir da rodada 5, **Bebida Grátis** (cada um ganha uma bebida que não tem, mesmo passando do limite). O tempo que falta de cada power-up aparece em baixo, no centro, com uma barra.
- **Armadilha elétrica (1000):** uma por mapa, na porta entre a Recepção e a Enfermaria (Sanatório) e no portão da Praça para o Lago (Vila). Precisa da energia; aperte F na alavanca. Fica ligada 25 s (raios entre os dois postes) e depois recarrega por 60 s (a lâmpada da alavanca fica verde quando está pronta, azul ligada e vermelha recarregando). Mata todo zumbi que passa, sem dar pontos, e dá choque em quem entra (25 de dano a cada meio segundo).
- **Rodadas:** no começo de cada rodada aparece "RODADA N"; no canto de cima ficam os zumbis que faltam (ou a contagem para a próxima rodada). Matar 5, 10, 15... zumbis seguidos (até 2,5 s entre um e outro) mostra a série na tela.
- **Cães do inferno:** uma rodada especial de tempos em tempos. O último cão sempre solta Munição Máxima.
- **Zumbis especiais:** com as rodadas, parte da horda vira especial (nunca mais da metade da rodada, e nunca na rodada de cães). Cada um tem cor e forma próprias:

  | Tipo | A partir da rodada | Como é | Pontos extras ao matar |
  |---|---|---|---|
  | **Veloz** | 4 | Magro, olhos vermelhos. Corre mais que os cães, mas tem só 55% da vida | +20 |
  | **Explosivo** | 6 | Barriga inchada que brilha. Ao morrer estoura (4,5 m): tira muita vida dos zumbis em volta e um pouco de quem estiver perto (paredes e portas protegem) | +40 |
  | **Brutamonte** | 8 | Maior, com ombreiras de ferro. 3,5 vezes a vida, anda devagar, bate 60% mais forte e arranca tábuas mais rápido. Poucos por rodada | +100 |
  | **Tóxico** | 10 | Pele verde com pústulas. Ao morrer deixa uma nuvem verde por 7 s que tira vida de quem fica dentro | +40 |
  | **Gritador** | 12 | Pálido, cabeça comprida. De tempos em tempos grita e os zumbis em volta correm 30% mais por 5 s | +60 |

  No Fácil eles aparecem 2 rodadas mais tarde e em menor número; no Difícil uma rodada antes e no Pesadelo duas, em maior número. Os zumbis comuns também variam de tamanho, pele e roupa.
- **Carniceiro (chefe):** aparece na rodada 12 (Fácil 14, Difícil 11, Pesadelo 10) e volta a cada 10 rodadas (Difícil 9, Pesadelo 8; se cair numa rodada de cães, vem na seguinte), anunciado com um raio e uma barra de vida no alto da tela. Grande, de armadura e cutelo, muita vida (cresce com a rodada e com o número de jogadores), lento, mas fica 40% mais rápido abaixo da metade da vida. Quando ergue o cutelo, um anel vermelho aparece no chão: em 1 s ele bate e acerta todo mundo dentro do anel. Nenhum golpe tira mais de 12% da vida dele (vale para Arma Trovão e macaco), o Insta-Kill só dobra o dano e o Nuke tira 20% sem matar. Ao morrer dá 1000 pontos extras a quem matou, 300 a cada um dos outros e solta um power-up garantido. A rodada só acaba depois que ele morre.
- **Corpo e animações dos zumbis** (só visual, cada cliente desenha; o jeito de cada um vem do número dele, então todo mundo vê igual):
  - **Corpo:** cabeça arredondada com olhos fundos que brilham, nariz podre, dentes e mandíbula que abre; coxa, canela, braço e antebraço afinando, com joelho e cotovelo; mãos com dedos em garra; camisa rasgada com abas, manchas de sangue, às vezes costelas à mostra, pé descalço, braço sem a mão ou sem mandíbula; cabelo curto, comprido ou careca. Cada tipo tem silhueta própria (Veloz magro de braço comprido, Explosivo com barriga de bolhas e veias, Brutamonte enorme com ombreiras de cravos e placa no peito, Tóxico com pústulas e papo inchado, Gritador de cabeça comprida e dedos longos, Carniceiro de couraça, capacete, avental e cutelo; o cão é um galgo de peito fundo, focinho comprido, orelhas para trás e rabo).
  - **Andar** (sorteado): braços esticados para a frente, mancando, arrastando uma perna de pé torto, cambaleando de um lado para o outro ou curvado com os braços pendurados. **Correr:** braços esticados, bombeando ou para trás. Parado, balança o peso e a cabeça pende; de vez em quando a cabeça dá um tique e ele tropeça (os braços aparam).
  - **Golpe** (muda a cada um): patada com as duas mãos, garra de um braço com o tronco torcendo ou bote com mordida. Brutamonte ergue as duas mãos e soca o chão (poeira); Explosivo incha e treme; Carniceiro ergue o cutelo enquanto o anel cresce e desce junto com o estrondo (onda vermelha no chão).
  - **Por tipo:** Veloz salta de vez em quando enquanto corre; Explosivo anda gingando como pato; Brutamonte e Carniceiro pisam pesado com os ombros balançando, e o Carniceiro ruge ao chegar e, abaixo de 50%, corre furioso bufando fumaça; Tóxico tosse e vomita um jato verde; Gritador joga a cabeça para trás, abre os braços e solta uma onda de choque.
  - **Cães:** trotam (patas em diagonal) ou galopam (o corpo ondula), agacham e saltam no bote, uivam sentados ao surgir e quando param.
  - **Levar tiro:** tranco para trás ou para o lado conforme de onde veio; tiro na cabeça estala a cabeça para trás, na perna o joelho dobra; explosão e escopeta fazem cambalear. Vale para os seus tiros, a faca e os tiros dos outros jogadores.
  - **Janela e chão:** arranca as tábuas com um braço de cada vez e passa pelo batente encolhendo a perna; ao sair do chão arranha para cima com terra voando. Explosão que arranca as pernas deixa o zumbi rastejando sem as canelas (três jeitos: puxando com os dois braços, com um só, ou se arrastando).
  - **Morte:** de costas, de cara no chão, girando, caindo de joelhos ou, no tiro na cabeça, a cabeça some e o corpo desaba; rastejante esparrama; Carniceiro cai de joelhos e depois de cara; o cão rola e esperneia. O corpo afunda no chão antes de sumir.
  - As caixas de acerto acompanham a pose (inclinação, bote, tropeção, grito, salto do Veloz e do cão).
- **Vida:** a barra no centro de baixo da tela mostra a vida (com Juggernog vai até 250). Como no CoD, a vida volta sozinha e aos poucos: depois de alguns segundos sem levar golpe (3,5 s no Normal; o Quick Revive encurta em 25%) ela sobe até encher (100 de vida em 5 s no Normal; com Juggernog sobe mais rápido, 250 em ~8 s). Qualquer golpe reinicia a espera. A borda vermelha da tela mostra quanto falta e some aos poucos junto com a barra; com pouca vida ela pulsa. Toda rodada nova começa com a vida cheia.
- **Cair e reanimar:** com a vida zerada, você cai com uma pistola e tem 45 s (no Normal) para alguém segurar F em você (o tempo para enquanto alguém está reanimando). Quem sangra volta na rodada seguinte, com a M1911 e os mesmos pontos. Se todos caírem, fim de jogo.

## Skins

Aba **Skins** no menu.

- **Caixas:** você ganha XP jogando e, a cada 300 XP, recebe uma caixa. Conta nova começa com 2.
  - Abate: 10 XP (headshot 15; contra bot vale metade)
  - Zumbi morto: 3 (headshot 5); especiais dão mais (Veloz +2, Explosivo e Tóxico +3, Gritador +4, Brutamonte +6, Carniceiro +50)
  - Rodada de zumbi sobrevivida: 25
  - Reanimar alguém: 20
  - Fim de partida: 40 (vitória: 150)
  - Fim de jogo nos zumbis: 30 + 8 por rodada
- **Abrir caixa:** roleta no estilo CS. Raridades: Comum 60%, Incomum 25%, Rara 10%, Épica 4%, Lendária 1%. Faca só sai em Épica ou Lendária. Skin repetida vira 60 XP.
- **Acabamentos:** Floresta, Deserto, Urbano, Grafite, Areia, Oceano, Cereja, Carbono, Ártico, Tigre, Colmeia, Crepúsculo, Damasco, Neon, Lava, Asiimov, Esmeralda, Ouro, Dragão e Galáxia (Neon, Lava, Dragão e Galáxia brilham). Servem para todas as armas, menos as armas maravilha (Ray Gun, Ray Gun Mark II, Arma Trovão, Wunderwaffe DG-2 e Winter's Howl). Com Pack-a-Punch vale a camuflagem do Pack-a-Punch.
- **Coleção (estilo Valorant):** todas as armas aparecem ao mesmo tempo, em colunas por categoria (pistolas; SMGs e escopetas; rifles; precisão, pesadas e faca), cada uma desenhada com a skin que está equipada. Clique numa arma para abrir a tela dela: à esquerda as skins que você tem (e a Padrão), no centro a arma em 3D (arraste para girar), e o botão **Equipar**. Os outros jogadores veem a sua skin.
- **Conta:** com o Firebase configurado, entre com Google ou e-mail e senha; o inventário fica salvo na conta e aparece em qualquer computador. Sem conta, fica salvo só no navegador e passa para a conta no primeiro login.

- **Facas:** além da Faca (KA-BAR), tem a **Butterfly**. As duas usam os mesmos braços das armas: a mão direita segue uma animação de faca pronta (parado, saque, cortes alternando o lado, estocada no botão direito e inspeção no F) e fecha no cabo. Na Coleção, abra a arma e clique em **Usar esta faca**; equipar uma skin da butterfly também já troca a faca.

### Configurar as contas (Firebase, uma vez só)

Já configurado no projeto `tiroteio-237ee`. Os passos abaixo servem só para refazer em outro projeto.

1. Em https://console.firebase.google.com, crie um projeto (o Google Analytics pode ficar desligado).
2. **Authentication → Vamos começar → Método de login:** ative **Google** e **E-mail/senha**.
3. **Authentication → Configurações → Domínios autorizados:** adicione `costamaiavitor.github.io` (o `localhost` já vem).
4. **Firestore Database → Criar banco de dados** (modo de produção, qualquer região). Na aba **Regras**, cole e publique:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /players/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
       // usuário fixo de cada conta (o ID do documento é o usuário)
       match /usernames/{name} {
         allow read: if true;
         allow create: if request.auth != null && request.resource.data.uid == request.auth.uid && name.matches('^[a-z0-9_]{3,16}$');
         allow update: if request.auth != null && resource.data.uid == request.auth.uid && request.resource.data.uid == request.auth.uid;
       }
       // amizades: pedido (pending) e aceito (ok)
       match /friends/{id} {
         allow read, delete: if request.auth != null && request.auth.uid in resource.data.users;
         allow create: if request.auth != null && request.resource.data.from == request.auth.uid
           && request.auth.uid in request.resource.data.users && request.resource.data.users.size() == 2 && request.resource.data.st == 'pending';
         allow update: if request.auth != null && request.auth.uid in resource.data.users && request.auth.uid != resource.data.from
           && request.resource.data.st == 'ok' && request.resource.data.users == resource.data.users && request.resource.data.from == resource.data.from;
       }
       // convites para o lobby
       match /invites/{id} {
         allow read, delete: if request.auth != null && (request.auth.uid == resource.data.to || request.auth.uid == resource.data.from);
         allow create, update: if request.auth != null && request.resource.data.from == request.auth.uid;
       }
     }
   }
   ```

5. **Configurações do projeto (engrenagem) → Seus apps → Web (`</>`):** registre o app e copie o objeto `firebaseConfig`.
6. No `index.html`, troque `const FIREBASE_CONFIG = null;` por `const FIREBASE_CONFIG = { ...o que você copiou... };`.

A `apiKey` do Firebase não é segredo (ela identifica o projeto); quem protege os dados são as regras acima. Cada jogador só lê e grava o próprio inventário. Como o jogo roda no navegador, alguém que mexa no código consegue se dar skins. Para jogar entre amigos isso não importa.

## Amigos, lobby e convites

- **Usuário:** ao criar conta com e-mail, escolha um usuário (3 a 16 caracteres: letras minúsculas, números ou _). Ele é o seu ID fixo e o seu nome no jogo. Quem entra com Google escolhe o usuário na aba **Amigos**.
- **Amigos:** na aba **Amigos**, adicione pelo usuário. O outro aceita o pedido na mesma aba. A bolinha verde mostra quem está com o jogo aberto.
- **Lobby:** **Criar sala pública** (entra quem tiver o código) ou **Criar sala só com convite** (só entra quem o host convidar). No lobby o host convida amigos, escolhe modo e mapa, troca os jogadores de time no modo Rodadas e clica em **Começar partida**.
- **Convite:** aparece no topo da aba **Jogar** com o botão **Entrar**.
- **Entrar na sala de um amigo:** na lista de amigos aparece **Entrar na sala** quando ele está numa sala pública.
- **Fim da partida:** quem veio do lobby volta para o lobby (o host troca modo, mapa e times e começa de novo).
- **Ranking entre amigos:** na aba **Amigos** (vitórias, partidas, abates, K/D, headshots, zumbis e recorde de rodada), salvo na conta.
- **Rodadas:** compra só perto da base do seu time; AK e Glock são do Ataque, M4, USP e kit são da Defesa; **U** fala só com o time; morto só assiste o próprio time; o nome do lugar aparece embaixo do mini mapa.

## Gráficos

No menu, aba **Configurações**, ou em Esc → Configurações → **Gráficos**:

- **Baixo:** resolução reduzida e sem sombras, para notebook fraco.
- **Médio:** céu com degradê e nuvens (ou estrelas), texturas com relevo, faíscas, cápsulas e sangue no chão.
- **Alto:** tudo do Médio, mais brilho (bloom) nas luzes, olhos dos zumbis e clarões, sombras de jogadores e zumbis, e resolução cheia.

Na primeira vez, o jogo escolhe sozinho: Alto para placa de vídeo dedicada, Médio para integrada.

- **Brilho** (0,6 a 1,8; padrão 1): clareia ou escurece a imagem em todos os mapas, em qualquer nível.
- **Visibilidade nos Zumbis** (vale nos três níveis): os mapas de zumbi têm mais luz ambiente, a neblina começa mais longe e é um pouco mais clara (o zumbi distante vira silhueta em vez de sumir no escuro) e uma luz fraca acompanha o jogador, então quem chega perto aparece de frente. No Alto, o contraste final esmaga menos as sombras nesses mapas. Tecla **L** liga a lanterna (sem sombra, leve).
- **Marcadores (Zumbis):** com a opção ligada (padrão), a tela marca o gerador de energia enquanto ela está desligada, a Caixa Misteriosa por 15 s no começo e sempre que ela muda de lugar, e o Pack-a-Punch por 15 s quando a energia liga. Colega caído (✚ com a distância) fica preso na borda da tela quando está fora dela, e o nome dos colegas aparece através das paredes (só nos Zumbis). Power-ups no chão têm um facho de luz verde de 8 m.

## Controles

| Tecla | Ação |
|---|---|
| W A S D | Mover |
| Mouse / clique esquerdo | Mirar / atirar |
| Clique direito (segurar) | Mirar: a arma encosta no rosto e a mira dela fica no centro da tela (pistolas com 3 pontos luminosos, fuzis com anel de abertura e massa, M4/P90 com holográfica de anel e ponto, escopetas com conta). Zoom leve e mais precisão. Na sniper, luneta; na faca, golpe forte; na granada, rasteira |
| Espaço | Pular (morto: troca quem você assiste) |
| Ctrl ou C | Agachar. Ao clicar para jogar, o jogo entra em tela cheia e segura as teclas do jogo (Chrome/Edge, opção "Tela cheia ao jogar" nas Configurações, ligada por padrão): assim o Ctrl+W vira andar agachado e não fecha a aba. O Esc continua abrindo a pausa e saindo da tela cheia. Em navegadores sem esse recurso, o Ctrl+W mostra o aviso "Sair do site?": cancele e o jogo volta parado, na pausa |
| Shift | Andar em silêncio |
| R | Recarregar |
| 1 2 3 4 | Primária, pistola, faca, granadas |
| 5 | Zumbis: terceira arma (Mule Kick) |
| Q / roda do mouse | Arma anterior / trocar arma |
| B | Loja estilo Valorant: clique na arma ou equipamento para comprar; B ou Esc fecha |
| F | Com a faca: inspecionar (a karambit gira no dedo). Zumbis: comprar, abrir porta, usar a caixa; segure para consertar janela e reanimar |
| V | Zumbis: facada rápida (com um zumbi a até 3 m à frente, você dá um bote até ele) |
| L | Zumbis: lanterna (liga/desliga; fica salva) |
| Shift + W | Zumbis: correr (fôlego limitado, Stamin-Up dobra; atirar interrompe a corrida) |
| C correndo | Zumbis: deslizar (com PhD Flopper, explode no fim) |
| Tab | Placar |
| Y ou Enter | Chat |
| Esc | Pausa, configurações e troca de modo/mapa (host) |

## Problemas comuns

- **"Sala não encontrada":** confira o código. O código muda toda vez que o host cria uma sala nova.
- **Fica em "Conectando..." e dá tempo esgotado:** algumas redes (faculdade, empresa, 4G com CGNAT) bloqueiam conexão P2P. Tente outra rede ou roteie pelo celular.
- **Travando:** em Esc → Configurações, baixe **Gráficos** para Médio ou Baixo, ou desligue as sombras. O FPS aparece no rodapé; para quem entrou numa sala, o ping até o host aparece ao lado.
- **O servidor de pareamento caiu no meio da partida:** o jogo continua (a ligação entre vocês é direta); o host vê um aviso e a sala volta sozinha. Só ninguém novo consegue entrar até lá.

## Tecnologia

Um único arquivo `index.html`. Usa [three.js](https://threejs.org) para o 3D e [PeerJS](https://peerjs.com) para a conexão. Sons e mapas são gerados por código; os braços em primeira pessoa e os modelos das armas são arquivos glTF em `assets/` (veja os créditos abaixo).

## Créditos dos modelos 3D

Os braços animados e os modelos das armas e facas vêm do [Sketchfab](https://sketchfab.com), todos com licença [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (uso livre com atribuição). Foram reduzidos (texturas em 1024 px) e encaixados nos braços pelo jogo; os arquivos ficam em `assets/fps/`.

Braços e animações (um pacote por classe de arma):

- braços + AK-74M (AK-47): [FPS AK-74m animations](https://sketchfab.com/3d-models/fps-ak-74m-animations-94be8385c402474cacd39bc096c6ca14), de [Cransh](https://sketchfab.com/ccransh)
- braços de pistola: [FPS pistol animations](https://sketchfab.com/3d-models/fps-pistol-animations-0d7a343dcb6f401197a73c91aee93f6d), de [Cransh](https://sketchfab.com/ccransh)
- braços de submetralhadora: [SMG FPS Animations](https://sketchfab.com/3d-models/smg-fps-animations-ca37ea9148dc4fcc9cc632175d311b23), de [Cransh](https://sketchfab.com/ccransh)
- braços de fuzil: [Animated FPS hands (rifle animation pack)](https://sketchfab.com/3d-models/animated-fps-hands-rifle-animation-pack-5f2d0ed780a94724b36ab505f7564057), de [Cransh](https://sketchfab.com/ccransh)
- braços de rifle de precisão: [FPS animations sniper rifle](https://sketchfab.com/3d-models/fps-animations-sniper-rifle-c15ae8393d824f5b929e3f69691cdd31), de [Cransh](https://sketchfab.com/ccransh)
- braços + Remington (Nova): [FPS Arms remington (shotgun)](https://sketchfab.com/3d-models/fps-arms-remington-shotgun-e68ef617fe8a48cca8610d016ffd5881), de [Cransh](https://sketchfab.com/ccransh)
- animação das facas (a mão dos braços das armas segue o punho desta animação): [Knife animated](https://sketchfab.com/3d-models/knife-animated-5f83f0bd4b2c429aa14aa46461efe404), de [DJMaesen](https://sketchfab.com/bumstrum)

Armas e facas:

- AK-74u: [Low-Poly AKS-74U](https://sketchfab.com/3d-models/low-poly-aks-74u-4fc741a30b20477ea748f5d2837ac0b4), de [TastyTony](https://sketchfab.com/TastyTony)
- Arma Trovão: [Call of Duty Zombies: Classic Thundergun No Rig](https://sketchfab.com/3d-models/call-of-duty-zombies-classic-thundergun-no-rig-ede362de578c4ed9aac513604d05e857), de [TheShibeLord](https://sketchfab.com/TheShibeLord)
- AWP: [Low-Poly L118A1](https://sketchfab.com/3d-models/low-poly-l118a1-5e2f001d6e6245bcacf2b1e2de8892f4), de [TastyTony](https://sketchfab.com/TastyTony)
- China Lake: [China Lake Colored](https://sketchfab.com/3d-models/china-lake-colored-8e81aded97d94eebb369eb935c62cb93), de [TatumWilbanks](https://sketchfab.com/TatumWilbanks)
- Commando: [Low-Poly HK416](https://sketchfab.com/3d-models/low-poly-hk416-059e968f6f764357880807c62c117ab7), de [TastyTony](https://sketchfab.com/TastyTony)
- CZ75: [Low-Poly CZ-75 SP-01](https://sketchfab.com/3d-models/low-poly-cz-75-sp-01-7cf2a3a662d344ee989e343ccaee56e9), de [TastyTony](https://sketchfab.com/TastyTony)
- Desert Eagle: [Low-Poly Desert Eagle](https://sketchfab.com/3d-models/low-poly-desert-eagle-b81da261345f4462b2c4412352162287), de [TastyTony](https://sketchfab.com/TastyTony)
- Dragunov: [Low-Poly SVD Dragunov](https://sketchfab.com/3d-models/low-poly-svd-dragunov-fe40c5c2696441bc8696ed042056709e), de [TastyTony](https://sketchfab.com/TastyTony)
- Faca: [KA-BAR USMC Knife](https://sketchfab.com/3d-models/ka-bar-usmc-knife-73ddfa74144b49fd8bad8177646e5ed5), de [Urpo](https://sketchfab.com/Urpo)
- FN FAL: [Low-Poly FN FAL](https://sketchfab.com/3d-models/low-poly-fn-fal-c737946bdccf4441b558b97ede5d0e3b), de [TastyTony](https://sketchfab.com/TastyTony)
- Galil: [Low-Poly IMI Galil](https://sketchfab.com/3d-models/low-poly-imi-galil-4bc3146c48d34171ab0ea879757000b7), de [TastyTony](https://sketchfab.com/TastyTony)
- Glock-18: [glock 17](https://sketchfab.com/3d-models/glock-17-ccf58223a7804de8b15d1d35b7d0b587), de [Friendly](https://sketchfab.com/Friendly1)
- HK21: [Low-Poly M240B](https://sketchfab.com/3d-models/low-poly-m240b-657a3b8ce0194aae9c7c9036c18c54b9), de [TastyTony](https://sketchfab.com/TastyTony)
- Butterfly: [Butterfly Knife - Vanilla](https://sketchfab.com/3d-models/butterfly-knife-vanilla-514edc772445441083b3cd611fd4e65c), de [DjJaba](https://sketchfab.com/djjaba)
- M14: [Low-Poly M14](https://sketchfab.com/3d-models/low-poly-m14-30e47673a17b434386e9c3af54670bed), de [TastyTony](https://sketchfab.com/TastyTony)
- M1911: [Low-Poly M1911](https://sketchfab.com/3d-models/low-poly-m1911-117f542d21954ae0a59afaedadcff338), de [TastyTony](https://sketchfab.com/TastyTony)
- M4A4: [Low-Poly M4a1](https://sketchfab.com/3d-models/low-poly-m4a1-8cab1cbeb82c4396a154f9fc8771417b), de [TastyTony](https://sketchfab.com/TastyTony)
- MP40: [Low-Poly MP40](https://sketchfab.com/3d-models/low-poly-mp40-2b0a107a709a4004bbff310dba4af14b), de [TastyTony](https://sketchfab.com/TastyTony)
- MP5-SD: [Low-Poly HK MP5](https://sketchfab.com/3d-models/low-poly-hk-mp5-80980f757c2c463ebc73460a31611652), de [TastyTony](https://sketchfab.com/TastyTony)
- MP5K: [Low-Poly HK MP5K](https://sketchfab.com/3d-models/low-poly-hk-mp5k-091b4f73c00b4605b754f5c0b3fcdd26), de [TastyTony](https://sketchfab.com/TastyTony)
- Olympia: [Double Barrel Shotgun](https://sketchfab.com/3d-models/double-barrel-shotgun-04741a40f2224cffafc343b0236d5bbe), de [Sebastian Kansik](https://sketchfab.com/Pepego)
- P250: [Low-Poly Sig P226](https://sketchfab.com/3d-models/low-poly-sig-p226-0d90f858e9f74c418ce3aae61cef9f4e), de [TastyTony](https://sketchfab.com/TastyTony)
- P90: [Modular P90 Tactical](https://sketchfab.com/3d-models/modular-p90-tactical-080897fc0366455884b1a916684313fe), de [doomsentinel](https://sketchfab.com/doomsentinel)
- Python: [GameReady: Colt Python Revolver](https://sketchfab.com/3d-models/gameready-colt-python-revolver-3def6e3980e64dfa832f298004ce1b94), de [HYQQM](https://sketchfab.com/HYQQM)
- Ray Gun: [Ray Gun v1](https://sketchfab.com/3d-models/ray-gun-v1-fbbb221cb97f4e92a898e9b704e2c774), de [dev-shawn](https://sketchfab.com/dev-shawn)
- RPK: [Low-Poly RPK](https://sketchfab.com/3d-models/low-poly-rpk-acdc6fe399514c41aa4130f8044875fb), de [TastyTony](https://sketchfab.com/TastyTony)
- SPAS-12: [Low-Poly SPAS-12](https://sketchfab.com/3d-models/low-poly-spas-12-c95154ea2348443e9195250a6ad122cb), de [TastyTony](https://sketchfab.com/TastyTony)
- SSG 08: [Low-Poly Sako TRG-42](https://sketchfab.com/3d-models/low-poly-sako-trg-42-e1430b54583c41daa2695680347058bd), de [TastyTony](https://sketchfab.com/TastyTony)
- Stakeout: [Low-Poly Ithaca M37](https://sketchfab.com/3d-models/low-poly-ithaca-m37-74da1e6054cc40e3b61bed4b4d8eef61), de [TastyTony](https://sketchfab.com/TastyTony)
- USP-S: [low-poly HK USP 9mm](https://sketchfab.com/3d-models/low-poly-hk-usp-9mm-5a06cfce588d4c6b960b9eda658ec47d), de [D_U](https://sketchfab.com/DU1701)
