# Plano das fases (atmosfera + armas)

Atualizado em 03/10/2026, depois do merge da `main` do Vitor (`6df6338`): Armeiro, menu novo, lobby e segurança.

| Fase | O quê | Estado |
|---|---|---|
| 0 | Reconhecimento: `mapa_areas.md` | feita |
| 1 | Bíblia de terror: `biblia_terror.md` (62 fichas) | feita |
| 2 | Conteúdo da Vila: 9 agentes, 3–4 áreas cada, código em `ATMOS.vila.<id>` | em andamento |
| 3A | Visual e realismo do cenário: 15 agentes (texturas, desgaste, materiais, luz, névoa, partículas, pós, animação, shaders, vegetação, revisor) | depois da 2 |
| **3B** | **Armas na mão: 15 agentes (abaixo)** | **depois da 2, junto com a 3A** |
| 4 | Integração e validação (cenário + armas) | |
| 5 | Sanatório (repete 2 a 4 com mais intensidade) | |

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
