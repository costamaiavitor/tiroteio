# Tiroteio

FPS multiplayer que roda direto no navegador: x1 estilo Counter-Strike e um modo Zumbis cooperativo estilo Call of Duty. Cada um joga no seu computador.

## Como jogar

1. Abra o jogo (pelo link do GitHub Pages ou abrindo o `index.html` no Chrome/Edge).
2. Um jogador clica em **Criar sala** e recebe um código de 5 letras.
3. O amigo digita o código em **Entrar em sala** (ou abre o link `...?sala=CODIGO`).

Funciona na mesma rede Wi-Fi ou em casas diferentes pela internet. A conexão é P2P (WebRTC via PeerJS): não precisa abrir porta no roteador nem ter servidor próprio. As duas máquinas precisam de internet para o pareamento inicial.

O host roda a partida no navegador dele. Se o host fechar a aba, a partida acaba.

## Modos

- **Rodadas:** estilo CS. Uma vida por rodada, dinheiro, compra no começo da rodada.
- **Mata-mata:** renasce, tudo grátis.
- **Zumbis:** cooperativo (até 4), inspirado no CoD Zombies. Veja abaixo.

## Modo Zumbis

Mapa **Sanatório**, com seis cômodos. Vocês começam na Recepção com uma M1911 e 500 pontos.

- **Rodadas infinitas.** A vida dos zumbis segue a fórmula do CoD (150 na rodada 1, +100 por rodada até a 9, depois ×1,1). A quantidade cresce a cada rodada. Os zumbis começam andando e passam a correr e disparar nas rodadas altas.
- **Pontos:** 10 por acerto; ao matar, 60 (corpo), 100 (headshot) ou 130 (faca). Consertar janela dá 10 por tábua.
- **Janelas:** os zumbis vêm de fora, arrancam as tábuas e pulam para dentro. Segure F perto da janela para pregar as tábuas de volta. No Pátio eles também saem do chão.
- **Portas e entulho** (750 a 1250) liberam novos cômodos, com mais armas e mais janelas.
- **Armas de parede** (contorno de giz): M14, Olympia, MP40, MP5K, AK-74u, Stakeout, granadas e Faca Bowie. Se você já tem a arma, compra munição pela metade do preço.
- **Caixa Misteriosa (950):** arma aleatória: Ray Gun, Arma Trovão, Galil, Commando, FAL, RPK, HK21, SPAS-12, Python, CZ75, Dragunov, China Lake ou Macacos com Pratos. Às vezes sai o ursinho: você recebe os pontos de volta e a caixa muda de lugar.
- **Energia:** fica no Laboratório. Ligue para ativar as bebidas e o Pack-a-Punch.
- **Bebidas** (máximo de 4): Juggernog (aguenta 5 golpes), Speed Cola (recarrega rápido), Double Tap (atira mais rápido), Quick Revive (reanima rápido; sozinho, te levanta até 3 vezes) e Stamin-Up (corre mais).
- **Pack-a-Punch (5000):** fica no Teatro. Dobra o dano, aumenta o pente e dá nome e camuflagem novos à arma (a M1911 vira a explosiva Mustang & Sally).
- **Power-ups:** caem dos zumbis e duram 26s no chão. São eles: Munição Máxima, Insta-Kill, Pontos em Dobro, Nuke (+400) e Carpinteiro (+200).
- **Cães do inferno:** uma rodada especial de tempos em tempos. O último cão sempre solta Munição Máxima.
- **Cair e reanimar:** com a vida zerada, você cai com uma pistola e tem 45s para alguém segurar F em você. Quem sangra volta na rodada seguinte, com a M1911 e os mesmos pontos. Se todos caírem, fim de jogo.

## Controles

| Tecla | Ação |
|---|---|
| W A S D | Mover |
| Mouse / clique esquerdo | Mirar / atirar |
| Clique direito | Mira da sniper, facada forte, granada rasteira |
| Espaço | Pular (morto: troca quem você assiste) |
| C | Agachar (Ctrl também funciona, mas Ctrl+W fecha a aba fora da tela cheia) |
| Shift | Andar em silêncio |
| R | Recarregar |
| 1 2 3 4 | Primária, pistola, faca, granadas |
| Q / roda do mouse | Arma anterior / trocar arma |
| B | Menu de compra (números escolhem) |
| F | Zumbis: comprar, abrir porta, usar a caixa; segure para consertar janela e reanimar |
| V | Zumbis: facada rápida |
| Tab | Placar |
| Y ou Enter | Chat |
| Esc | Pausa, configurações e troca de modo/mapa (host) |

## Problemas comuns

- **"Sala não encontrada":** confira o código. O código muda toda vez que o host cria uma sala nova.
- **Fica em "Conectando..." e dá tempo esgotado:** algumas redes (faculdade, empresa, 4G com CGNAT) bloqueiam conexão P2P. Tente outra rede ou roteie pelo celular.
- **Travando:** desligue as sombras nas configurações. O FPS aparece no rodapé.

## Tecnologia

Um único arquivo `index.html`. Usa [three.js](https://threejs.org) para o 3D e [PeerJS](https://peerjs.com) para a conexão. Gráficos, sons e mapas são gerados por código, sem arquivos externos.
