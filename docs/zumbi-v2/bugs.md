# Bugs encontrados (zumbi-v2, Etapa 11)

Legenda: **corrigido**, **não reproduzido** ou **pendente (precisa de aprovação)**.

## Portas (Etapa 3)
- **Quadrado laranja na frente da porta aberta: corrigido.** O revisor R2 achou a causa: o **cadeado do portão** (0,5 × 0,5 m, cor 0x8a6a2a) ficava no grupo da porta, e não nas folhas. Quando o portão abria, as folhas corriam para os lados e o cadeado ficava boiando no meio do vão, a 1,5 m do chão (38 portões na Vila e 12 no Sanatório). Agora ele some quando o portão abre, inclusive para quem entra no meio da partida. A busca abaixo não o pegou porque o vermelho dele (138) ficava abaixo do limite da conta.
- **Primeira busca (sem achar):**
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

## Achados dos revisores (corrigidos)
- **Coice por arma vazava para o modo CS:** as armas do CS herdam a base das armas zumbi (tec9, r8, xm1014, sawedoff, negev, sg553, g3sg1). Agora o coice só vale no modo zumbi.
- **Recarga automática do último tiro na arma errada:** se o jogador trocava de arma logo depois do último tiro, a recarga começava na arma nova. Agora a recarga só começa se a arma da mão for a mesma do tiro.
- **Olympia com PaP II e III:** ficava com 3 no pente; agora fica com 2.

## Pendentes (mudança grande; precisam de aprovação)
- **Passagens secretas:** o painel é liso e numa cor fixa por mapa, sem a textura do muro. Na Vila ele destoa do muro escuro, e quem olha com atenção acha. Usar o material do tema da parede exige ler o material da parede da montagem do mapa.
- **Recuo de câmera:** nenhuma arma tem recuo de câmera; `G.punchP`/`G.punchY` nunca recebem soma. Criar recuo de verdade muda o jeito de jogar de todas as armas.
- **Kar98k:** 400 de dano para uma arma de ferrolho, menos que a Dragunov semiautomática. Sugestão: 600–700.
- **M16:** é o fuzil mais fraco da caixa (DPS 633). Sugestão: `rate` .32 → .22.
- **Olympia e Python:** a recarga sempre ejeta todas as cápsulas, mesmo depois de 1 tiro (estético).
- **Inspeção de arma de fogo:** não existe animação de inspeção para armas de fogo, só para a faca.
- **Mangas:** a manga clara aparece no canto da tela nas armas com empunhadura vertical (Thompson, MP5K, PM63).
