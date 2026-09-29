# Tiroteio

FPS multiplayer estilo Counter-Strike que roda direto no navegador. Feito para x1 com amigos, cada um no seu computador.

## Como jogar

1. Abra o jogo (pelo link do GitHub Pages ou abrindo o `index.html` no Chrome/Edge).
2. Um jogador clica em **Criar sala** e recebe um código de 5 letras.
3. O amigo digita o código em **Entrar em sala** (ou abre o link `...?sala=CODIGO`).

Funciona na mesma rede Wi-Fi ou em casas diferentes pela internet. A conexão é P2P (WebRTC via PeerJS): não precisa abrir porta no roteador nem ter servidor próprio. As duas máquinas precisam de internet para o pareamento inicial.

O host roda a partida no navegador dele. Se o host fechar a aba, a partida acaba.

## Conteúdo

- **Modos:** Rodadas (estilo CS: uma vida por rodada, dinheiro, compra no começo da rodada) e Mata-mata (renasce, tudo grátis).
- **Mapas:** Arena, Deserto, Armazém, Favela, Posto de Neve.
- **Armas:** Faca, Glock-18, USP-S, P250, Desert Eagle, MP5-SD, P90, Nova, AK-47, M4A4, SSG 08, AWP, granada HE, fumaça, colete e capacete.
- **Bots** (0 a 7, três dificuldades) para treinar sozinho ou completar a sala.
- Headshot, recuo, dispersão por movimento, dano por distância, colete, som posicional (dá pra ouvir passos).

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
| Tab | Placar |
| Y ou Enter | Chat |
| Esc | Pausa, configurações e troca de mapa (host) |

## Problemas comuns

- **"Sala não encontrada":** confira o código. O código muda toda vez que o host cria uma sala nova.
- **Fica em "Conectando..." e dá tempo esgotado:** algumas redes (faculdade, empresa, 4G com CGNAT) bloqueiam conexão P2P. Tente outra rede ou roteie pelo celular.
- **Travando:** desligue as sombras nas configurações.

## Tecnologia

Um único arquivo `index.html`. Usa [three.js](https://threejs.org) para o 3D e [PeerJS](https://peerjs.com) para a conexão. Gráficos, sons e mapas são gerados por código, sem arquivos externos.
