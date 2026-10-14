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

## Revisão da madrugada (13→14/10)
- Passagem secreta só aparece com os requisitos ok: muro igual ao vizinho até as duas áreas estarem abertas (e o interruptor); então surgem rachaduras finas e o F. Teste `passagem-secreta`.
- Revisão de código (R1): Nogueira ficava congelado na cena depois da escolta (corrigido); chefe de campo pendente e o aviso de fim passavam para a partida seguinte (corrigido); teste `objetivos-reinicio`.
- Balanceamento medido com robô (R2): Normal bem mais leve (Sanatório r10: de 6,7 para 0,3 queda/min do jogador médio); chefes dos objetivos ×2,8 (lutas de ~1,5–3 min). Detalhes em `balanceamento.md`, seção "Balanceamento final 13/10".
- Bateria inteira: 236/236.
- Fica para o dono (fora do modo zumbi, não mexi): em `w18Mola` (arma em primeira pessoa, igual no PvP) um comentário `//` antigo engole a mola do pulo da arma; existe desde antes da main.

## Pedido de 14/10: mais objetivos, em rodadas certas, portas só compradas
- **Portas:** nenhum objetivo abre porta sozinho (o campo `abre` ficou só como a lista das portas do caminho). O time compra; a porta trancada pela chave do Laboratório continua abrindo com a chave. Na escolta, Nogueira espera diante de F↔G e I↔F até o time comprar (`II.3.portas`).
- **Etapas e rodadas** (`OBJ_MAPA`, `OBJ_RODADA`): cada etapa começa na rodada dela; a que acaba antes deixa a partida numa pausa ("Próximo objetivo na rodada N", etapas `P0`–`P4`, uma por ato para as notas). Se o time atrasar, a seguinte começa no fim da anterior.

| Mapa | Rodada: etapa |
|---|---|
| Vila | 1 sino e gerador (I) · **4 Igreja (VA)** · 7 lista, Nogueira e escolta (II) · **11 Farol (VB)** · **14 Mina velha (VC)** · 18 Vigia |
| Sanatório | 1 livro, chave e Laboratório (III) · **4 Necrotério (SA)** · 7 energia, alas e registro (IV) · 10 Foguista · **13 Ala Psiquiátrica (SB)** · 16 cargas, Névoa, Diretor e fuga (V) |

- Etapas novas: ler o terminal do lugar (a leitura de antes do objetivo não conta) e segurar a sala diante dele (45–60 s, só durante a rodada). Aviso "NOVO OBJETIVO" / "CHEFE À VISTA" no começo de cada etapa.
- Teste: `tests/objetivos-rodadas.test.mjs`.

## Pedido de 14/10 (tarde): peças do motor e objetivos sem dica
- **Gerador da Pedreira:** depois do sino, o motor está desmontado. É preciso achar 3 peças (vela de ignição, correia, carburador), pegar com F e levar até o gerador; só com as 3 entregues o gerador pode ser ligado (e defendido). Quem cai carregando uma peça deixa a peça no chão.
- **Lugares sorteados:** cada partida sorteia o lugar de cada peça num chão livre da zona barata (salas A–E, portas de 750 e 1000), longe de interativos, portas, janelas e das outras peças (`campLugarSorteado`, `CAMP_VILA.pecaSalas`).
- **Sem dica fora do Fácil:** seta e distância dos objetivos, brilho e giro dos itens no chão só no Fácil (`campDica`). Nas outras dificuldades o item fica parado no chão, em metal escuro, e o painel só diz o que fazer.
- Teste: `tests/objetivos-rodadas.test.mjs` (peças, zona barata, seta só no Fácil).
