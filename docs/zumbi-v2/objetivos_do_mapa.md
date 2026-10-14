# Objetivos do mapa (pedido do dono, 13/10; branch `zumbi-objetivos`)

"A campanha do zumbi não é uma campanha, mas sim objetivos dentro do próprio mapa." O modo zumbi tem agora **um modo só**: a partida começa
como sempre (rodada 1, 500 pontos, M1911) e os objetivos do mapa escolhido vão se desbloqueando um depois do outro. Quando o último acaba,
aparece "OBJETIVOS CONCLUÍDOS" e as rodadas seguem infinitas, com a escalada do infinito. Nada na tela fala em campanha nem em atos.

## Sequência por mapa (`OBJ_MAPA`)

| Mapa | Etapas e objetivos |
|---|---|
| Vila | tocar o sino → ligar o gerador da Pedreira (defender) → lista do Hospital → achar Nogueira → escoltar Nogueira → alçapão da casamata → **Vigia** (chefe) |
| Sanatório | livro de admissões → chave da Enfermeira-chefe → relatório 31 → segurar o Laboratório → energia nas Caldeiras → 3 alas → registro da Torre → **Foguista** → 3 cargas (Torre, Caldeiras, Crematório) → Névoa → **Diretor** → fuga na ambulância da Portaria |

- A etapa seguinte começa no intervalo depois da anterior (sem rodada mínima, sem cena, sem troca de mapa).
- Chefes lutam no próprio mapa (versão de campo), com a vida da rodada em que entram × `ZBAL.chefes.vidaK` (2,5).
- Time inteiro caído = fim de jogo, como no clássico (sem checkpoint nem kit). Quem entra no meio entra como no clássico.
- Rádio, falas, notas e terminais continuam; cenas em tela cheia e créditos saíram.
- Curva, estreia dos tipos novos e agenda de eventos/cães/Carniceiro são **por mapa e por rodada** (`CAMP_CURVA`, `CAMP_RITMO`, `CAMP_AGENDA`).
- Sorteio do zumbi-v2: bebidas, PaP e caixa sorteiam; a energia fica no lugar (os objetivos dependem dela); peças só do Pack-a-Punch.

## Removido (limpeza A8)
Troca de mapa entre atos, as 3 arenas (Forte, Forno, Galeria 7), kit, checkpoint, progresso salvo e cartões de ato, cenas, créditos e o
seletor Clássico/Campanha/Infinito. PROTO 7. Detalhes em `limpeza.md`.

## Pedidos do mesmo dia
- Zumbi comum: 7% menos vida e golpe de no máximo 40 em todas as dificuldades (`ZBAL.comum`). Especiais e chefes como antes.
- Tipo novo **Tanque** (17): muita vida (6× o comum), pouco dano (metade), devagar, colete e capacete de aço; aparece desde a rodada 9
  (+1 a cada 5), em todos os modos (`ZBAL.tipos[17]`).
- Normal mais leve: 10% menos zumbis e a vida volta em 3 s (`ZBAL.dificuldade`).

## Validação (17 agentes)
- Onda 1 (7): Vila, Vigia, Sanatório, Foguista, final do Diretor, zumbis/eventos/curva, menu/HUD/rede.
- Onda 2 (1): limpeza.
- Onda 3 (5 de 9 planejados; o dono pediu menos gasto): partida completa na Vila (V1), no Sanatório (V2), multijogador (V3), regressão
  do clássico e do PvP (V4: idênticos a antes), desempenho (V5: nada mais pesado).
- Bugs achados pela validação e corrigidos: PaP nunca montava pelo F (já existia no zumbi-v2 publicado), chefes duravam segundos, fuga
  quase impossível em rodada alta, lacaios nascendo longe, mensagens malformadas, prompts de F fora de hora, notas sumindo, painel sobre as
  peças, etc. (ver o histórico de commits da branch).

## Decidido por mim (o dono deixou; ele corrige se ficar ruim)
- Vila: o interruptor da energia só liga depois do objetivo do gerador da Pedreira (antes ligava a luz e esvaziava o objetivo).
- II.3 agora diz "Levar Nogueira ao Castelo" (o Forte Velho era a arena; o rádio continua chamando o lugar de Forte Velho, como na história).
- "Hospital de campanha" fica: é o nome do lugar no mapa.
- No infinito depois dos objetivos ficam só os tipos novos do próprio mapa.
- A carga do Crematório continua cara (~6000 em portas): é a carga difícil de propósito.
- Munição de parede com o pente cheio: o cliente já não deixa comprar (o servidor não conhece a munição de cada um; o caso visto era um robô chamando o servidor direto).
