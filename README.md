# Dan of Duty

FPS multiplayer que roda direto no navegador: x1 estilo Counter-Strike e um modo Zumbis cooperativo estilo Call of Duty. Cada um joga no seu computador!

## Como jogar

1. Abra o jogo (pelo link do GitHub Pages ou abrindo o `index.html` no Chrome/Edge).
2. Na aba **Jogar**, o host escolhe o modo, o mapa e as opções nos cartões e clica em **Criar sala**. Ele recebe um código de 5 letras.
3. O amigo digita o código em **Entrar em sala** (ou abre o link `...?sala=CODIGO`).

Funciona na mesma rede Wi-Fi ou em casas diferentes pela internet. A conexão é P2P (WebRTC via PeerJS): não precisa abrir porta no roteador nem ter servidor próprio. As duas máquinas precisam de internet para o pareamento inicial.

O host roda a partida no navegador dele. Se o host fechar a aba, a partida acaba.

Como a conexão funciona: posições (30 por segundo), bots e zumbis (20 por segundo) vão num canal sem retransmissão, para um pacote perdido não segurar os seguintes; compras, abates e placar vão num canal confiável. Quem recebe desenha os outros um pouco no passado (80 a 300 ms, conforme a regularidade da rede) e interpola entre as fotos, para o movimento ficar liso. O host confere o que cada cliente manda antes de repassar.

## Modos

- **Rodadas:** estilo CS. Uma vida por rodada, dinheiro, compra no começo da rodada.
- **Mata-mata:** renasce, tudo grátis.
- **Zumbis:** cooperativo (até 4), inspirado no CoD Zombies. Veja abaixo.

## Modo Zumbis

Dois mapas:

- **Vila** (aberta e gigante, ~300 m de lado, 17 áreas): três anéis em volta de uma praça com chafariz, onde vocês começam. No anel de dentro, portões de ferro levam à Igreja (norte), à Fazenda (leste), ao Cemitério (oeste) e ao Lago (sul). Portões no muro do meio (1500) levam ao anel do meio, que tem 4 áreas ligadas por portas nas sebes (1250): Pedreira (nordeste, com o gerador de energia), Estação de trem (sudeste), Acampamento com fogueira (sudoeste) e Castelo em ruínas (noroeste, com o Pack-a-Punch no pátio). Do anel do meio, corredores com portão (2000) atravessam o muro externo até oito distritos de fora, dois em cada lado, separados por uma porta (1500): Hospital de campanha e Mina (norte), Fábrica e Ferrovia (leste), Porto e Farol (sul), Floresta e Serraria (oeste). Grades de ferro deixam a bala passar, mas ninguém atravessa. Os zumbis pulam os muros pelas janelas de tábua ou saem do chão no meio das áreas.
- **Sanatório** (fechado e enorme, ~125 x 100 m, 15 alas): vocês começam na Recepção. O núcleo antigo (Enfermaria, Pátio, Laboratório, Teatro e Capela) leva às alas novas: a oeste Refeitório, Biblioteca, Cozinha e Caldeiras (com o gerador de energia); ao norte Necrotério e Ala Psiquiátrica; a leste o Jardim com chafariz, a Estufa e a Torre d'água (com o Pack-a-Punch embaixo dela). Portas de 750 a 1500. Zumbis saem do chão no Pátio, no Jardim e na Torre d'água.

Todo mundo começa com uma M1911.

### Dificuldades

| | Fácil | Normal | Difícil | Pesadelo |
|---|---|---|---|---|
| Vida dos zumbis | 70% | 100% (CoD) | 135% | 180% |
| Golpes para cair (sem Juggernog) | 3 | 2 | 2 | 1 |
| Quantidade por rodada | 75% | 100% | 125% | 150% |
| Começam a correr | mais tarde | normal | mais cedo | desde a rodada 1 |
| Pontos iniciais | 1500 | 500 | 500 | 250 |
| Tempo caído até sangrar | 60 s | 45 s | 35 s | 25 s |
| Power-ups | mais | normal | menos | bem menos |

A dificuldade aparece no canto de cima, junto com o nome do mapa.

- **Rodadas infinitas.** A vida dos zumbis segue a fórmula do CoD (150 na rodada 1, +100 por rodada até a 9, depois ×1,1). A quantidade cresce a cada rodada. Os zumbis começam andando e passam a correr e disparar nas rodadas altas.
- **Pontos:** 10 por acerto; ao matar, 60 (corpo), 50 (pernas ou explosão), 100 (headshot) ou 130 (faca), mais o extra dos zumbis especiais (veja abaixo). Consertar janela dá 10 por tábua (até 500 por rodada).
- **Janelas:** os zumbis vêm de fora, arrancam as tábuas e pulam para dentro. Segure F perto da janela para pregar as tábuas de volta. Na Vila (e nos lugares abertos do Sanatório) eles também saem do chão.
- **Portões, portas e entulho** (750 a 2000) liberam novas áreas, com mais armas e mais janelas.
- **Armas de parede** (contorno de giz, na parede ou em placas de madeira): M14, Olympia, MP40, MP5K, AK-74u, Stakeout, granadas e Faca Bowie; nas alas novas do Sanatório e nos anéis de fora da Vila também Dragunov, Galil, SPAS-12, FAL, Commando, HK21 e RPK. Se você já tem a arma, compra munição pela metade do preço (arma com Pack-a-Punch: 4500).
- **Caixa Misteriosa (950; 10 durante a Liquidação):** arma aleatória entre mais de 40:
  - Pistolas: CZ75, Python, Five-seven, B23R (rajada de 3) e Mauser C96.
  - Submetralhadoras: PPSh-41 (tambor de 71), Thompson, Spectre, Kiparis, Uzi e PM63.
  - Fuzis: Galil, Commando, FN FAL, STG-44, M16 (rajada de 3), AUG, Famas, G11 (rajada de 3, bem rápida) e Enfield.
  - Metralhadoras: RPK, HK21, MG42 e Stoner63. Escopetas: SPAS-12, Trench Gun, HS10 e KS-23.
  - Precisão: Dragunov, Kar98k (ferrolho, mira de ferro), L96A1 e PSG1. Explosivos: China Lake, M72 LAW e Besta (virote explosivo).
  - Armas maravilha (raras): Ray Gun, Ray Gun Mark II (rajada de 3), Arma Trovão, Wunderwaffe DG-2 (o raio pula de zumbi em zumbi, até 8; com Pack-a-Punch vira a DG-3 JZ, até 14) e Winter's Howl (cone de gelo de curto alcance: mata quem está perto e deixa lento quem sobrevive).
  - Macacos com Pratos. Às vezes sai o ursinho: você recebe os pontos de volta e a caixa muda de lugar.
  - Toda arma da caixa tem versão Pack-a-Punch com nome próprio (PPSh-41 vira The Reaper, Kar98k vira Armageddon, MG42 vira Barracuda FU-A11...).
- **Energia:** fica no gerador da Pedreira (Vila) ou nas Caldeiras (Sanatório). Ligue para ativar as bebidas e o Pack-a-Punch.
- **Bebidas** (máximo de 4 compradas; as máquinas ficam espalhadas pelas áreas): Juggernog (2500: vida vai a 250, 2,5 vezes mais golpes), Speed Cola (3000: recarrega na metade do tempo), Double Tap (2000: atira 33% mais rápido), Quick Revive (1500: reanima rápido; sozinho, te levanta até 3 vezes), Stamin-Up (2000: corre mais), e mais quatro:
  - **PhD Flopper (2000):** suas explosões (granada, Ray Gun, China Lake, Mustang & Sally) não te machucam, e deslizar (correndo, aperte C) termina numa explosão em volta de você (raio de 4 m, uma a cada 2 s).
  - **Deadshot Daiquiri (1500):** ao começar a mirar (botão direito), a mira vai para a cabeça do zumbi mais perto do centro; menos dispersão e headshot 50% mais forte.
  - **Mule Kick (4000):** carrega uma terceira arma (tecla 5 ou a roda do mouse). Com as três cheias, a arma nova (parede, caixa) troca a que está na mão. Ao cair você perde o Mule Kick e a terceira arma, como no CoD.
  - **Electric Cherry (2000):** recarregar solta um choque em volta: quanto mais vazio o pente, maior o raio (até 4 m) e o dano (uma vez a cada 2,5 s).
  - Ao cair você perde todas as bebidas.
- **Pack-a-Punch (5000; 1000 durante a oferta):** fica no pátio do Castelo (Vila) ou embaixo da Torre d'água (Sanatório). Dobra o dano, aumenta o pente e dá nome e camuflagem novos à arma (a M1911 vira a explosiva Mustang & Sally).
- **Power-ups:** caem dos zumbis e duram 26s no chão. São eles: Munição Máxima (enche também a terceira arma e os Macacos com Pratos), Insta-Kill, Pontos em Dobro, Nuke (+400), Carpinteiro (+200), **Liquidação** (a Caixa Misteriosa custa 10 por 30 s e o ursinho não aparece), **Máquina da Morte** (quem pega fica 30 s com uma metralhadora giratória sem recarga e não troca de arma até acabar), **Pack-a-Punch em oferta** (1000 por 30 s; só cai com a energia ligada) e, rara, a partir da rodada 5, **Bebida Grátis** (cada um ganha uma bebida que não tem, mesmo passando do limite). O tempo que falta de cada power-up aparece em baixo, no centro, com uma barra.
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
- **Vida:** a barra no centro de baixo da tela mostra a vida (com Juggernog vai até 250). Toda rodada nova começa com a vida cheia.
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

- **Facas:** além da Faca, tem o **Karambit** (lâmina em garra, com anel). Os braços de primeira pessoa das facas foram feitos no Blender (`assets/arms.glb`) a partir de um humano do [MPFB/MakeHuman](https://static.makehumancommunity.org/mpfb.html) (licença CC0), com animações no estilo do CS2: parado, saque (a karambit gira no dedo), cortes alternando o lado, estocada no botão direito e inspeção no F. Nas armas de fogo os mesmos braços seguram a arma por IK: a mão direita fecha no punho com o indicador no gatilho e a esquerda fica por baixo do guarda-mão, acompanhando as recargas. Os scripts que geram o arquivo ficam em `tools/blender/` (`pipeline.sh` refaz tudo com o Blender em segundo plano). Na Coleção, abra a arma e clique em **Usar esta faca**; equipar uma skin de karambit também já troca a faca.

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
     }
   }
   ```

5. **Configurações do projeto (engrenagem) → Seus apps → Web (`</>`):** registre o app e copie o objeto `firebaseConfig`.
6. No `index.html`, troque `const FIREBASE_CONFIG = null;` por `const FIREBASE_CONFIG = { ...o que você copiou... };`.

A `apiKey` do Firebase não é segredo (ela identifica o projeto); quem protege os dados são as regras acima. Cada jogador só lê e grava o próprio inventário. Como o jogo roda no navegador, alguém que mexa no código consegue se dar skins. Para jogar entre amigos isso não importa.

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
| C | Agachar. Ctrl também agacha, mas só na tela cheia do menu (Esc → Tela cheia), onde o jogo segura o teclado; fora dela o navegador não deixa o jogo impedir que Ctrl+W feche a aba, então o Ctrl não agacha |
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

Um único arquivo `index.html`. Usa [three.js](https://threejs.org) para o 3D e [PeerJS](https://peerjs.com) para a conexão. Gráficos, sons e mapas são gerados por código, sem arquivos externos.
