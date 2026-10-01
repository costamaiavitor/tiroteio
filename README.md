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

- **Vila** (aberto, ~170 m de lado): dois anéis de área em volta de uma praça com chafariz, onde vocês começam. No anel de dentro, portões de ferro levam à Igreja (norte), à Fazenda (leste), ao Cemitério (oeste) e ao Lago (sul). Portões no muro do meio (1500) levam ao anel de fora, que tem 4 áreas ligadas por portas nas sebes: Pedreira (nordeste, com o gerador de energia), Estação de trem (sudeste), Acampamento com fogueira (sudoeste) e Castelo em ruínas (noroeste, com o Pack-a-Punch no pátio). Grades de ferro deixam a bala passar, mas ninguém atravessa. Os zumbis pulam os muros pelas janelas de tábua ou saem do chão no meio das áreas.
- **Sanatório** (fechado): seis cômodos com portas e janelas. Vocês começam na Recepção.

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
- **Janelas:** os zumbis vêm de fora, arrancam as tábuas e pulam para dentro. Segure F perto da janela para pregar as tábuas de volta. Na Vila (e no Pátio do Sanatório) eles também saem do chão.
- **Portões, portas e entulho** (750 a 1500) liberam novas áreas, com mais armas e mais janelas.
- **Armas de parede** (contorno de giz, na parede ou em placas de madeira): M14, Olympia, MP40, MP5K, AK-74u, Stakeout, granadas e Faca Bowie; no anel de fora da Vila também Dragunov, Galil, SPAS-12 e FAL. Se você já tem a arma, compra munição pela metade do preço (arma com Pack-a-Punch: 4500).
- **Caixa Misteriosa (950):** arma aleatória: Ray Gun, Arma Trovão, Galil, Commando, FAL, RPK, HK21, SPAS-12, Python, CZ75, Dragunov, China Lake ou Macacos com Pratos. Às vezes sai o ursinho: você recebe os pontos de volta e a caixa muda de lugar.
- **Energia:** fica no gerador da Pedreira (Vila) ou no Laboratório (Sanatório). Ligue para ativar as bebidas e o Pack-a-Punch.
- **Bebidas** (máximo de 4): Juggernog (vida vai a 250: 2,5 vezes mais golpes), Speed Cola (recarrega na metade do tempo), Double Tap (atira 33% mais rápido), Quick Revive (reanima rápido; sozinho, te levanta até 3 vezes) e Stamin-Up (corre mais).
- **Pack-a-Punch (5000):** fica no pátio do Castelo (Vila) ou no Teatro (Sanatório). Dobra o dano, aumenta o pente e dá nome e camuflagem novos à arma (a M1911 vira a explosiva Mustang & Sally).
- **Power-ups:** caem dos zumbis e duram 26s no chão. São eles: Munição Máxima, Insta-Kill, Pontos em Dobro, Nuke (+400) e Carpinteiro (+200).
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
- **Acabamentos:** Floresta, Deserto, Urbano, Grafite, Areia, Oceano, Cereja, Carbono, Ártico, Tigre, Colmeia, Crepúsculo, Damasco, Neon, Lava, Asiimov, Esmeralda, Ouro, Dragão e Galáxia (Neon, Lava, Dragão e Galáxia brilham). Servem para todas as armas, menos Ray Gun e Arma Trovão. Com Pack-a-Punch vale a camuflagem do Pack-a-Punch.
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
| Q / roda do mouse | Arma anterior / trocar arma |
| B | Loja estilo Valorant: clique na arma ou equipamento para comprar; B ou Esc fecha |
| F | Com a faca: inspecionar (a karambit gira no dedo). Zumbis: comprar, abrir porta, usar a caixa; segure para consertar janela e reanimar |
| V | Zumbis: facada rápida |
| Shift + W | Zumbis: correr (fôlego limitado, Stamin-Up dobra; atirar interrompe a corrida) |
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
