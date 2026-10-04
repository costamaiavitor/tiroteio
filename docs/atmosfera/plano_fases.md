# Plano das fases (atmosfera + armas)

Atualizado em 03/10/2026, depois do merge da `main` do Vitor (`6df6338`): Armeiro, menu novo, lobby e segurança. Estado das fases revisto em 04/10/2026, na validação final (todas as fases feitas).

| Fase | O quê | Estado |
|---|---|---|
| 0 | Reconhecimento: `mapa_areas.md` | feita |
| 1 | Bíblia de terror: `biblia_terror.md` (62 fichas) | feita |
| 2 | Conteúdo da Vila: 9 agentes, 3–4 áreas cada, código em `ATMOS.vila.<id>` | feita (`de6057e`): as 33 áreas com cenário, assinatura, animações, som e aparência próprios |
| 3A | Visual e realismo do cenário: 15 agentes (texturas, desgaste, materiais, luz, névoa, partículas, pós, animação, shaders, vegetação, revisor) | feita e integrada (`c2717a9`), com o revisor v15 (desempenho); texturas novas só nos mapas de zumbi; domínios em `mapa_areas.md` §5 |
| **3B** | **Armas na mão: 15 agentes (abaixo)** | **feita e integrada (`c2717a9`), com o revisor a15; pendências no fim deste arquivo** |
| 4 | Integração e validação (cenário + armas) | feita em 04/10/2026 (`f9db2bb`): cenário da Vila validado por código e scripts node (portas e custos iguais, 16 colisores ok, gatilhos, repetições; 4 correções no jogo), resultado em `mapa_areas.md` §6; armas: regressão de zumbis da integração ok (`log_fase3_*`) |
| 5 | Sanatório (repete 2 a 4 com mais intensidade) | feita: marcadores `@@ATMOS_SAN@@` (`5ea2142`); 5A, conteúdo das 29 áreas em 8 grupos (`ed2a517`); 5B, visual em 9 domínios + revisor (`918270f`), domínios em `mapa_areas.md` §7 |
| 4 (dois mapas) | Validação final: desempenho limpo (Médio, Alto e Baixo, nos dois mapas), decisão de corte, smoke do PvP e do menu, registro de números | feita em 04/10/2026 (sem commit; o coordenador faz): resultado em `mapa_areas.md` §8 |

## O que mudou com o trabalho do Vitor e como o plano se adapta

- **Armeiro (modo Zumbi).** Cada arma tem nível (até 14) e acessórios: mira reflex/holográfica no trilho do receptor, supressor, laser, empunhaduras, carregadores e coronha.
  - Os acessórios só vão nas armas feitas em código. As armas baixadas (glTF do Sketchfab) nunca recebem acessório.
  - Mudam o pente (`wMag`), a recarga, a dispersão, o tranco, a velocidade e o zoom da mira e a queda de dano.
  - Por isso a fase 3B precisa testar cada arma com e sem acessórios, inclusive com Pack-a-Punch.
- **Segurança.**
  - **Ganchos de teste:** `window.__T` só existe em `localhost` (DEBUG). Os testes automáticos continuam funcionando porque rodam em `localhost`.
  - **Validação no host:** o host passou a conferir posições e acertos PvP.
  - **Bibliotecas locais:** three.js e PeerJS agora vêm de `vendor/`, com CSP. Código novo não pode depender de outro domínio.
- **Menu novo, lobby e amigos.** Não mexem nos mapas de zumbi. A atmosfera não depende do menu.
- **Correções anteriores:** as dos zumbis (escalada, `zHigh`, sumiços) continuam na `main` do Vitor e nesta branch.

## Fase 3B: armas na mão (15 agentes)

**Objetivo:** cada arma bem colocada na mão, com animações (saque, tiro, recarga, inspeção, corrida, mira) e miras sem bugs, em primeira pessoa, nos modos Zumbi e Rodadas, com e sem os acessórios do Armeiro.

**Como trabalham:**
- Cada agente cuida de um grupo de armas ou de um sistema.
- Escreve um patch isolado; a integração aplica em sequência, como na fase 2.
- Testa com fotos no Playwright: posição de quadril, mira, recarga no meio e corrida, nos gráficos Médio e Alto.
- Compara antes e depois.

| # | Domínio |
|---|---|
| 1 | Pistolas (M1911, Glock, USP, P250, Deagle, CZ75, Python…) |
| 2 | SMGs (MP5, MP5K, MP40, AK-74u, P90, Uzi, Thompson…) |
| 3 | Fuzis da família AK e Galil (AK-47, RPK, Galil, FAL) |
| 4 | Fuzis M4, Commando, M14, M16, AUG, Famas, G11, STG-44 |
| 5 | Escopetas (Nova/Remington, Olympia, SPAS-12, Stakeout, KS-23, HS10) e as animações de cartucho a cartucho |
| 6 | Precisão (AWP, SSG, Dragunov, Kar98k, L96, PSG1) e lunetas |
| 7 | Metralhadoras (HK21, RPK, MG42, Stoner) e LMGs da Caixa |
| 8 | Armas maravilha e explosivos (Ray Gun, Mk II, Arma Trovão, Wunderwaffe, Winter's Howl, China Lake, LAW, besta, macaco, granadas, Semtex, Claymore) |
| 9 | Facas (KA-BAR, Butterfly, Bowie, karambit) e a facada rápida / bote |
| 10 | Miras de ferro e ponto de mira (ADS) em todas as armas: a mira da arma no centro da tela, sem desalinhamento |
| 11 | Acessórios do Armeiro: posição da mira óptica no trilho, retículo, supressor na boca, laser e feixe, nas armas com Pack-a-Punch e camuflagem |
| 12 | Animações de recarga e saque: tempos iguais aos do jogo (`reload`, Speed Cola, carregador rápido), mão esquerda no lugar, sem atravessar a arma |
| 13 | Corrida, deslize, pulo, agachar e balanço ao andar (viewmodel), sem clipping |
| 14 | Visão dos outros jogadores: arma no modelo de 3ª pessoa e efeitos de tiro remotos (inclusive o supressor no co-op) |
| 15 | Revisor: consistência entre armas, desempenho (troca de arma sem engasgo) e regressões |

**Regras:**
- Não muda dano, cadência nem regras de jogo, só o visual e as animações.
- Não quebra a validação do host.
- Segue o estilo do código do Vitor (`FPG`, `GRIP`, `FRAME`, `attParts`, `tools/blender` quando o ajuste for no modelo).

## Validação final (04/10/2026)

- **Desempenho medido limpo** (um navegador por vez, placa de vídeo da máquina, quadro sem vsync), nos dois mapas, em Médio, Alto e Baixo, contra "antes de tudo" e "só conteúdo": tabelas e conclusões em `mapa_areas.md` §8.
- **Corte aplicado:** a Vila saiu do passe de cor do Médio (`POS_MEDIO_FORA`, perto de `posLeve`). Os outros cortes testados (densidade e distância da vegetação da Vila no Médio; piso do 5B-2 em Lambert e 5B-7 desligado no Médio do Sanatório) não deram ganho mensurável e não foram aplicados.
- **Números:** duas colisões corrigidas no jogo (balança do Estábulo 412 kg → 418 kg; lotes "L. 31"/"L. 40" dos Túneis → "L. 42"/"L. 45"); números novos registrados em `biblia_terror.md` §6.
- **PvP e menu:** smoke contra `4eded8b` (ver `mapa_areas.md` §8).

## Pendências conhecidas (depois da validação final)

- **Desempenho na máquina de teste (Intel UHD integrada):** o custo maior não é o visual (fases 3 e 5B) e sim o conteúdo das áreas (fases 2 e 5A): as chamadas de desenho passam de ~230 para ~500 na Vila e de ~110 para ~380 no Sanatório, e o envio delas domina o quadro. Juntar as malhas paradas de cada área (por material) é o próximo ganho grande; não foi feito aqui por ser uma mudança de estrutura.
- **Baixo mais lento que o Médio no Sanatório** (16,0 ms contra 9,4 ms; vem do conteúdo da 5A): investigar.
- **Engasgos no Alto:** p90 acima de 100 ms nos dois mapas desde o conteúdo (fases 2 e 5A); a mediana cabe no Sanatório e não na Vila.
- **Decisão do Caio:** no Médio, a Vila ficou sem o look por área (só no Alto), em troca de ~15% de quadro. Voltar é tirar `vila` de `POS_MEDIO_FORA`.
- **Picos de quadro ao entrar numa área** (p90 bem acima da mediana nas tomadas logo depois de mudar de lugar): o aquecimento (`warmUp`) já cobre os materiais da montagem, mas texturas e materiais criados depois (assinaturas, `A.dyn`) ainda compilam na hora.
- **Armas (do revisor a15):** penetração de 8 a 21 mm na recarga vazia de LMG, AK e M4; antebraços das escopetas no estilo CS na mira; Python sem mão de apoio; SMG e Winter's Howl perto do olho (`FRAME`); cache das mãos procedurais (`compileAsync`).
- **Cenário da Vila:** opacidade dos bancos de neblina, estalo do relógio da Estação a cada 60 s, closure por quadro da fogueira do Acampamento (código do Vitor); ver `mapa_areas.md` §6, "Em aberto".
- **Sanatório:** a tampa da caixa da Ilha do porto (Vila) que "bate por dentro" repete o motivo das batidas de dentro do Necrotério (gaveta 214); decidir se fica como eco ou troca. Fichas da bíblia que o jogo implementou diferente (colmeias 4–6, placas SL-…) já foram acertadas na bíblia.
- **Rede:** nada da atmosfera viaja pela rede; o smoke de PvP foi feito só com o host local (sem segundo jogador).
