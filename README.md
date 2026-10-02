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
- **Pontos:** 10 por acerto; ao matar, 60 (corpo), 50 (pernas ou explosão), 100 (headshot) ou 130 (faca). Consertar janela dá 10 por tábua (até 500 por rodada).
- **Janelas:** os zumbis vêm de fora, arrancam as tábuas e pulam para dentro. Segure F perto da janela para pregar as tábuas de volta. Na Vila (e no Pátio do Sanatório) eles também saem do chão.
- **Portões, portas e entulho** (750 a 1500) liberam novas áreas, com mais armas e mais janelas.
- **Armas de parede** (contorno de giz, na parede ou em placas de madeira): M14, Olympia, MP40, MP5K, AK-74u, Stakeout, granadas e Faca Bowie; no anel de fora da Vila também Dragunov, Galil, SPAS-12 e FAL. Se você já tem a arma, compra munição pela metade do preço (arma com Pack-a-Punch: 4500).
- **Caixa Misteriosa (950):** arma aleatória: Ray Gun, Arma Trovão, Galil, Commando, FAL, RPK, HK21, SPAS-12, Python, CZ75, Dragunov, China Lake ou Macacos com Pratos. Às vezes sai o ursinho: você recebe os pontos de volta e a caixa muda de lugar.
- **Energia:** fica no gerador da Pedreira (Vila) ou no Laboratório (Sanatório). Ligue para ativar as bebidas e o Pack-a-Punch.
- **Bebidas** (máximo de 4): Juggernog (vida vai a 250: 2,5 vezes mais golpes), Speed Cola (recarrega na metade do tempo), Double Tap (atira 33% mais rápido), Quick Revive (reanima rápido; sozinho, te levanta até 3 vezes) e Stamin-Up (corre mais).
- **Pack-a-Punch (5000):** fica no pátio do Castelo (Vila) ou no Teatro (Sanatório). Dobra o dano, aumenta o pente e dá nome e camuflagem novos à arma (a M1911 vira a explosiva Mustang & Sally).
- **Power-ups:** caem dos zumbis e duram 26s no chão. São eles: Munição Máxima, Insta-Kill, Pontos em Dobro, Nuke (+400) e Carpinteiro (+200).
- **Cães do inferno:** uma rodada especial de tempos em tempos. O último cão sempre solta Munição Máxima.
- **Vida:** a barra no centro de baixo da tela mostra a vida (com Juggernog vai até 250). Toda rodada nova começa com a vida cheia.
- **Cair e reanimar:** com a vida zerada, você cai com uma pistola e tem 45 s (no Normal) para alguém segurar F em você (o tempo para enquanto alguém está reanimando). Quem sangra volta na rodada seguinte, com a M1911 e os mesmos pontos. Se todos caírem, fim de jogo.

## Skins

Aba **Skins** no menu.

- **Caixas:** você ganha XP jogando e, a cada 300 XP, recebe uma caixa. Conta nova começa com 2.
  - Abate: 10 XP (headshot 15; contra bot vale metade)
  - Zumbi morto: 3 (headshot 5)
  - Rodada de zumbi sobrevivida: 25
  - Reanimar alguém: 20
  - Fim de partida: 40 (vitória: 150)
  - Fim de jogo nos zumbis: 30 + 8 por rodada
- **Abrir caixa:** roleta no estilo CS. Raridades: Comum 60%, Incomum 25%, Rara 10%, Épica 4%, Lendária 1%. Faca só sai em Épica ou Lendária. Skin repetida vira 60 XP.
- **Acabamentos:** Floresta, Deserto, Urbano, Grafite, Areia, Oceano, Cereja, Carbono, Ártico, Tigre, Colmeia, Crepúsculo, Damasco, Neon, Lava, Asiimov, Esmeralda, Ouro, Dragão e Galáxia (Neon, Lava, Dragão e Galáxia brilham). Servem para todas as armas, menos Ray Gun e Arma Trovão. Com Pack-a-Punch vale a camuflagem do Pack-a-Punch.
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
