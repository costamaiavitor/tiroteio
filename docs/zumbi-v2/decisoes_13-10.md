# Decisões do dono de 13/10 (branch `zumbi-v2-decisoes`)

Respostas às 10 pendências do `relatorio_final.md` e os três pedidos seguintes. Um commit por mudança; valores de balanceamento em `zumbi_config.js`.

| # | Decisão | Onde | Verificação |
|---|---|---|---|
| 1 | Sem recuo de câmera | (nada mudou) | |
| 2 | Kar98k 600 de dano, só no zumbi | `ZBAL.armas.ajuste` (a Kar98k só existe no zumbi: não tem preço no CS) | o PaP é calculado a partir do valor novo |
| 3 | M16 `rate` .22 | `ZBAL.armas.ajuste` | |
| 4 | Passagens secretas bem secretas | `zFalsaCamufla` | fotos das 5 passagens dos dois lados; ~20 ms por passagem na montagem |
| 5 | Zumbi nunca mais rápido que o cão da dificuldade | `ZBAL.tamanho.velMax` | só o Veloz é afetado (tabela em `balanceamento.md`) |
| 6 | Energia sempre em área média | `ZBAL.lugares.energiaCusto` | 200 sorteios por mapa: 0 fora da faixa (Sanatório 9 lugares, Vila 2) |
| 7 | Traçante das armas maravilha no PaP II/III | `W[id + '_pap' + n].tracer` | |
| 8 | Inspeção, cápsulas, manga | `armaInspect`, `G.reloadVazias`, `VGRIP.pal` | fotos (pistola, SMG, fuzil, escopeta, arma maravilha) |
| 9 | Rodadas infinitas depois da campanha e escalada | `ZBAL.infinito`, `campInfContinua`, `zInfRodada`, `campInfChefeDe` | `tests/infinito-escalada.test.mjs`, `tests/campanha-final.test.mjs` (atualizado), partida simulada nas rodadas 25/41/49 do Pesadelo: 0 presos |
| 10 | PaP em oferta 1000/3000/5000 | `ZBAL.pap.oferta` | |
| + | Camuflagem do PaP por nível | `PAP_CORES` | fotos de M1911, Galil e Thompson nos 4 níveis |
| + | Pontos sem tiro para quem ligou/pegou | `ZBAL.pontos.semTiro`, `zKill(..., dono)` | `tests/pontos-sem-tiro.test.mjs` |
| + | Clique na recarga não atira sozinho | `updateWeapon` | `tests/gatilho-recarga.test.mjs` (reproduzido antes da correção) |

## Modo infinito

- **Depois da campanha:** quando os créditos acabam (ou o host dá Enter depois de pular), a partida não volta ao lobby: vai para o
  modo infinito no Sanatório (`ZBAL.infinito.mapa`), com as armas, pontos, bebidas e abates de cada um (`campBagagem`), contando da
  rodada em que a campanha parou. Quem sangrou no fim entra com a média dos pontos. Os créditos dizem "Rodadas infinitas em Ns".
- **Escalada (só no infinito):**
  - zumbis da rodada +2% por rodada depois da 15, até +40% (com +60% a rodada 49 do Pesadelo passava de 450 zumbis);
  - rodada mista a cada 6 rodadas desde a 25 (nunca na de chefe de campo nem na de cães): zumbis, cães (20% a mais) e Carniceiro;
  - Carniceiros por rodada de Carniceiro: 1 até a 39, 2 da 40, 3 da 55 (espaçados na rodada);
  - chefes de campo a cada 10 rodadas da 20 à 40 e depois a cada 5, em rodízio (+25% de vida a cada volta, como antes).
  O teto de zumbis vivos ao mesmo tempo não mudou (o jogo não fica mais pesado).
- O clássico não muda (teste `clássico: nenhuma escalada`).

## Protocolo de rede

`PROTO` 6: host e cliente precisam ser da mesma versão (créditos com o aviso do infinito, rodadas infinitas depois da campanha).
