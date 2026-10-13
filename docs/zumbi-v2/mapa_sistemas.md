# Mapa dos sistemas do modo zumbi (zumbi-v2, Etapa 0)

O jogo é um arquivo só: `index.html`, com o módulo three.js. O balanceamento novo fica em `zumbi_config.js`. As linhas abaixo são aproximadas: procure pelo nome. O mapa completo da arquitetura está em `docs/overhaul/mapa_projeto.md`.

| Sistema | Onde (nomes no index.html) |
|---|---|
| Tipos de zumbi (vida, tamanho) | `ZKIND`, `ZBAL.tipos` (zumbi_config.js), `zTamanho` |
| Dificuldades | `ZDIFF`, `zDf`, `zHpK`, `ZSPEC` |
| Nascimento | `zSpawnOne`, `ZD.windows`, `ZD.risers`, `zActive` |
| IA, alvo, movimento | `zTickZombies` (estados `out`/`in`/`rise`), `zChase`, campo de fluxo `zFlowStart`/`zFlowDir`/`FF`, `zBuildWalk` |
| Ataque e dano no jogador | `zTryAttack`, `zSlam`, `zHurt` |
| Dano no zumbi | `zHit`, `zKill`, `zExplode` |
| Janelas e barricadas | `Z.boards`, `wt.tear` no `zTickZombies`, `srvZHold` (`repair`), tábuas no `zBuildWorld`/`zUpdateWorld` |
| Portas | `M.z.doors`, `srvZUse` (`door`), `zdoor`, visual no `zBuildWorld`/`zUpdateWorld`, `zDoorOpen` |
| Armas do modo zumbi | `ZWEAP` (47 armas), `W`, `shoot`, `startReload`, viewmodel `FPW`/`FPM`/`FRAME`/`gunModel` |
| Mira e HUD | `#xhair` (CSS no topo), `zHud` |
| Minimapa | `ZMM` (radar e mapa grande, tecla M) |
| Marcadores de energia e PaP | `zPowerMark` e os marcadores "ENERGIA nm" (`zHud`) |
| Caixa misteriosa | `ZD.boxes`, `zBoxPlace`, urso no `srvZUse` (`box`) |
| Bebidas | `ZPERKS`, `M.z.perks`, `zperk` |
| Energia | `M.z.power`, `srvZUse` (`power`) |
| Pack-a-Punch | `M.z.pap`, `ZPK`, `srvZUse` (`pap`) |
| Interativos da Onda 2 | `ZINT`, `ZINT_MAPA`, `ZINT_FN` |
| Campanha (Onda 3) | `CAMP`, blocos `@@CAMP-…@@` |

**Testes:** `pnpm test` roda 215 testes em `tests/`, incluindo `fluxos-zumbi` (fluxos críticos) e `tipos-zumbi` (o clássico com semente fixa).
**Bench:** `tools/bench/bench.mjs` (FPS, memória e carga por mapa e rodada; `--rodadas 1,10,20`).
