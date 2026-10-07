# Overhaul do modo zumbi: mapa do projeto (Fase 0)

Branch de trabalho: `overhaul-zumbi`, saindo da `main` em `404d045`. Nada é enviado sem a aprovação do Caio.

## 1. Tecnologia e estrutura

- **Motor:** three.js r160 puro, sem engine nem build. Fica em `vendor/`, carregado com CSP.
- **Rede:** P2P com PeerJS, também em `vendor/`. O jogador que cria a sala (host) roda o servidor no próprio navegador; os outros são clientes.
- **Linguagem:** JavaScript num arquivo único, `index.html`, com cerca de 24 mil linhas. O código fica num `<script type="module">`.
- **Contas e perfil:** Firebase (`firestore.rules`). O jogo funciona sem ele.
- **Pastas:**

  | Pasta | O que tem |
  |---|---|
  | `assets/` | modelos glTF baixados (estilo CS), sons e texturas |
  | `tools/` | ferramentas de desenvolvimento, incluindo `tools/bench/` (este overhaul) |
  | `tests/` | testes Playwright com `node --test` |
  | `docs/` | documentação, incluindo `docs/atmosfera/` (fases 0–5) e `docs/overhaul/` |

- **Ganchos de teste:** `window.__T`, que só existe em localhost (`DEBUG`). Dá acesso ao estado do servidor (`S`, `Z`) e do cliente (`me`, `ZC`, `G`). A função `sim(seg)` avança o jogo com o relógio travado.
- **Mapa detalhado do modo zumbi:** `C:\dev\tiroteio-notas\MAPA_ZUMBIS.md`. Os números de linha dele são de uma versão antiga; os nomes de função continuam valendo.

## 2. Sistemas e onde ficam (linhas da `main` em 404d045, mudam com o tempo; use grep pelo nome)

| Sistema | Onde |
|---|---|
| Armas (dados) | `const W` (~582), `const ZWEAP` (~606) |
| Mapas (dados) | `const MAPS` (~685): **PvP** `arena`, `dust`, `armazem`, `favela`, `neve`; **zumbi** `sanatorio` (~1428) e `vila` (~1720), com `zonly: 1` |
| Regiões geradas dos mapas zumbi | `zGen` (~915), `SAN_GEN`, `VILA_GEN`, `zGenDeco` |
| Montagem dos mapas | `buildMap` (~15394), `buildSanatorio` (~1370), `buildVila` (~12337), `zBuildWorld` (~21026) e `zUpdateWorld` (~21213) para janelas, portas, máquinas e lâmpadas |
| Atmosfera (fases 2–5) | `atmosBuild`/`atmosApi`/`atmosTick` (~1994); áreas da Vila entre `@@ATMOS_AREAS@@` (~2388) e o FIM; Sanatório entre `@@ATMOS_SAN@@` (~7149) e o FIM; domínios visuais nos blocos `// ===== 3A-n` e `// ===== 5B-n` (`ATMOS_POST`) |
| Servidor zumbi (host) | `zStartGame` (~22079), `zStartRound` (~22088), `zSpawnOne` (~22189), `zTickZombies` (~22237, IA e campo de fluxo), `zKill` (~22434), `zDrop`/`zPower` (~22487), `srvZUse` (~22547, compras e portas) |
| Rede e protocolo | `srvHandle` (~19635), `srvTick` (~19937), `onMsg` (~22740), `startHost` (~19360) |
| Zumbis no cliente | `zModel` (~20913, modelos e tipos), `zAnim` (~21357, animação procedural), `zCull` (~15093, recorte por distância) |
| Tipos de zumbi | comum, 1–5 especiais (Brutamonte, Corredor, Tóxico, Gritador e outros) e 6 = Carniceiro (chefe a cada N rodadas: `Z.bossQ`/`bossAt`/`nextBoss`); cães nas rodadas de cão |
| Power-ups | `zDrop`/`zPower`: `max`, `insta`, `dbl`, `nuke`, `carp`, `fire`, `death`, `zblood`, `bonus`, `bonfire`, `perk` |
| Bebidas e Pack-a-Punch | `const PERKS` (~20070), Armeiro (`ATT`), `ZPK` |
| Arma na mão | `gunModel` (~16082), `vmSetWeapon` (~17910), `reloadAnim` (~18018), `updateViewmodel` (~18447) |
| Render e qualidade | `applyQuality` (~13057), `warmUp` (~15458), `renderScene` (~23913), `frame` (~23905), `tick` (~23918) |
| Som | `play` (~15788) e síntese procedural (`nz`/`tn`) |
| HUD zumbi | ~21871 |

## 3. Posse de código entre as frentes

Tudo está num arquivo só, então a posse é por **região de código** (funções e blocos), não por arquivo.

**Como os agentes trabalham:**
1. Cada agente trabalha numa CÓPIA do `index.html` e entrega um diff.
2. O coordenador junta o diff numa base que vai andando, com o script `integra2.py` da fase 6.
3. Se o agente precisar de uma região que não é dele, avisa o coordenador e não edita.

**Linhas compartilhadas:** tabelas como `ADS.recuo`, `FRAME_ARMA` e `LUZ_AREA` não são editadas no lugar. Cada agente acrescenta a sua entrada no próprio bloco (`TABELA.chave = …`).

| Frente | Regiões que pode editar |
|---|---|
| **A** (otimização do modo zumbi) | servidor zumbi (`zTickZombies`, `zSpawnOne`, campo de fluxo, `zKill`), zumbis no cliente (`zModel`, `zAnim`, `zCull` só para zumbis, pools de zumbi), projéteis e acertos (`shoot`, `trace` do lado zumbi), efeitos de sangue e partículas de combate, som do combate, HUD zumbi, alocações por quadro dessas regiões |
| **B** (restante do jogo e mapas) | `MAPS` PvP, `buildMap`, `warmUp`, `applyQuality`, `renderScene`/composer, sombras, texturas (`genTex`, `canvasTex`), `atmos*` e blocos 3A/5B (só desempenho), menus e lobby, rede (só desempenho), som global |
| **C** (distribuição e interativos) | dados `M.z` dos mapas zumbi (posições de itens, bebidas, armas de parede, Caixa, portas), `srvZUse`/`zBuildWorld`/`zUpdateWorld` para os interativos novos, armadilhas |
| **D** (campanha) | bloco novo de campanha (atos, objetivos, eventos), tipos de zumbi novos e chefes (`zSpawnOne` só pelo gancho que a Frente A deixar), arena de chefe, HUD de objetivo, lore (`docs/overhaul/lore.md`). O modo clássico continua intacto. |
| **E** (validação) | só `tests/`, `tools/bench/` e `docs/overhaul/ideias.md`; nunca o jogo |

## 4. Linha de base

- **Funcional:** `docs/overhaul/linha_de_base.md` (testes).
- **Desempenho:** `docs/overhaul/linha_de_base.md` (benchmark). Para repetir: `node tools/bench/bench.mjs --gfx medio` (ver o cabeçalho do script).
- **Metas:**
  - **FPS:** a meta ficou em branco no pedido do Caio (`[DEFINA O FPS ALVO]`). Enquanto ele não definir, vale 60 FPS no Médio e no Baixo neste PC (Intel UHD integrada, 1280×720), em todos os mapas e rodadas.
  - **Desempenho:** nenhuma frente pode deixar o jogo mais lento do que a linha de base.
