# Bugs encontrados (zumbi-v2, Etapa 11)

Legenda: **corrigido**, **não reproduzido** ou **pendente (precisa de aprovação)**.

## Portas (Etapa 3)
- **Quadrado laranja na frente da porta aberta: não reproduzido no jogo.**
  - Foram fotografadas todas as 98 portas (Sanatório 40, Vila 58), fechadas e abertas, de 3 m, com placa de vídeo. Uma conta automática procurou pixels laranja no vão de cada porta aberta: nenhum.
  - O único laranja ligado às portas era o **traço laranja das portas no minimapa**, que foi removido na Etapa 6.
  - Ferramentas: `tools/itens/portas.mjs` e `laranja.mjs` (pasta de trabalho). Se o quadrado aparecer de novo, mande uma foto com o nome do mapa e o lugar.
- **Porta onde o jogador não chega perto: não reproduzido.** `tools/itens/portas.mjs` procura, dos dois lados de cada porta, o ponto livre mais perto onde o jogador fica de pé. Nas 98 portas ele fica dentro do alcance do F (2,6 m).

## Armas (Etapa 2)
Todos corrigidos; detalhes no relatório final.
- **Python:** o cão tapava a mira.
- **MP40, MG42, Stoner, HS10, Arma Trovão:** na mira, a arma enchia o pé da tela.
- **SMGs de parede e Dragunov:** perdiam dano com a distância como fuzil (ficaram sem `rm` próprio).
- **Kiparis:** tinha som de supressor sem ter supressor.
- **HK21:** usava som de 5,56.
- **C96:** a recarga tirava o carregador do punho.
- **AUG:** a empunhadura vertical ficava solta no ar.
- **Famas:** o anel da mira flutuava.
- **Winter's Howl e Ray Gun Mk II:** a alça flutuava.
- **LAW e besta:** o projétil continuava visível depois do tiro, e a recarga acabava antes do tempo.
- **Escopetas:** a bomba era cortada no último cartucho.
- **Escopetas com PaP:** não recarregavam mais rápido.
- **L96:** sacava rápido como pistola.
- **G11:** ejetava cápsula mesmo sendo sem estojo.
- **PM63:** o ferrolho não animava na recarga vazia.
- **Recuo:** todas as armas tinham o mesmo coice; agora o coice é por arma.
- **Pack-a-Punch:**
  - Ray Gun: munição do Porter's X2.
  - Olympia: pente de 2 cartuchos.
- **MG42:** DPS 2400 (o dobro das outras); dano 120 → 80.

## Integração (achados durante o trabalho)
- **Minimapa removido:** a referência `ZMM` que sobrou nos ganchos de teste impedia o jogo de carregar. Corrigido.
- **Três linhas de código cortadas por comentários de edição:** a inicialização do Z, o `lobbyStart` e a versão PaP das armas. Todas corrigidas antes do commit.

## Pendentes (mudança grande; precisam de aprovação)
- **Recuo de câmera:** nenhuma arma tem recuo de câmera; `G.punchP`/`G.punchY` nunca recebem soma. Criar recuo de verdade muda o jeito de jogar de todas as armas.
- **Kar98k:** 400 de dano para uma arma de ferrolho, menos que a Dragunov semiautomática. Sugestão: 600–700.
- **M16:** é o fuzil mais fraco da caixa (DPS 633). Sugestão: `rate` .32 → .22.
- **Olympia e Python:** a recarga sempre ejeta todas as cápsulas, mesmo depois de 1 tiro (estético).
- **Inspeção de arma de fogo:** não existe animação de inspeção para armas de fogo, só para a faca.
- **Mangas:** a manga clara aparece no canto da tela nas armas com empunhadura vertical (Thompson, MP5K, PM63).
