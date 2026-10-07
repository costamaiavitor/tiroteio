# Onda 1: fila dos agentes (Frente A: modo zumbi; Frente B: restante do jogo e mapas)

**Linha de base, gráfico Médio:**
- mapas zumbi com ~49–54 FPS de média e 22–34 FPS no 1% low;
- ~800 draw calls;
- a CPU é o limite.

**Meta:** 60 FPS no Médio e no Baixo neste PC. Os agentes A22 e B22 são os revisores e rodam no fim da onda.

## Frente A: otimização do modo zumbi

| id | Sistema | Foco e pistas |
|---|---|---|
| A01 | IA: campo de fluxo e decisão (`zTickZombies`) | custo por zumbi e por quadro no host; IA escalonada em lotes |
| A02 | Pathfinding e destrave (`navPath`, `stuck`, `segClearH`, LOS) | LOS e raios por quadro; cache |
| A03 | Spawn e pooling dos objetos de zumbi no servidor (`zSpawnOne`, `z` e `body`) | alocação por spawn |
| A04 | Pooling dos modelos de zumbi no cliente (`zModel`, criar e descartar) | pico ao nascer ou morrer; reaproveitar malhas e materiais por tipo |
| A05 | Colisões e física dos zumbis (zumbi × mundo, zumbi × zumbi, `zCrowded`) | busca espacial em grade |
| A06 | Animação procedural (`zAnim`) | custo por zumbi; quadros mais espaçados de longe |
| A07 | Render dos zumbis: LOD (malha simples de longe) | triângulos e draw calls por zumbi |
| A08 | Render dos zumbis: draw calls por zumbi (juntar peças, instancing por tipo) e skinning | um zumbi = quantos draws? |
| A09 | Culling dos zumbis (frustum, distância, área fechada) e sombras dos zumbis | |
| A10 | Projéteis e acertos (`shoot`, `trace`, `zHit`, caixas de acerto, `segClearH`) | raios contra todos os zumbis? Grade |
| A11 | Partículas, sangue e efeitos de combate (`puff`, `zBoomFx`, decals de tiro, explosão "cúpula laranja chapada" do w11) | alocação por efeito, pool |
| A12 | Áudio do combate (vozes, passos, gemidos, polifonia, nós WebAudio criados por som) | |
| A13 | HUD e UI de rodada (DOM por quadro, pontos, contadores) | escrever só quando muda |
| A14 | Limpeza de entidades mortas, cadáveres, drops e memória entre rodadas e partidas (`dispose`) | vazamento ao longo de 15 rodadas |
| A15 | Alocações por quadro e GC no cliente zumbi (o g03 achou ~20 materiais com `needsUpdate` a cada quadro, custando 1–1,5 ms) | |
| A16 | Scripts por quadro do servidor (`srvTick`, `srvState`, snapshots, `zUpdateWorld` no host) | |
| A17 | Rede do modo zumbi (tamanho e frequência do snapshot dos zumbis, decodificação no cliente) | |
| A18 | Interativos por quadro: janelas e tábuas, portas, máquinas, power-ups no chão (`zUpdateWorld`, `zDropAdd`) | |
| A19 | Cães, especiais (Tóxico com nuvens, Gritador) e chefe: custos próprios | |
| A20 | Horda cheia: limite de entidades ativas e teste de estresse nas rodadas 20–30 (o bench só mede o início da rodada) | criar o cenário de estresse no bench numa cópia; limite sem mudar o balanceamento |
| A21 | Terceira pessoa no zumbi e jogadores remotos (o w22 que sobrou da fase 6: faca remota, supressor, clarão depois da troca) e custo dos remotos | |
| A22 | Revisor de desempenho da Frente A (no fim) | |

## Frente B: restante do jogo e mapas

| id | Sistema | Foco e pistas |
|---|---|---|
| B01 | Vila: draw calls (226 → 580 com o conteúdo; ~800 com a cena). Juntar as malhas paradas de cada área por material, respeitando `dyn` e o corte | o maior ganho esperado |
| B02 | Sanatório: draw calls (mesmo trabalho) | |
| B03 | Mapas zumbi: esconder áreas ainda fechadas (portas não compradas) e oclusão por área | |
| B04 | Mapas PvP: Arena, Dust, Armazém, Favela, Neve (carga, 1% low baixo, primeiro quadro) | |
| B05 | Iluminação e sombras (resolução, frequência, quem projeta; o g01/g02 já mexeu no Alto) | |
| B06 | Texturas: memória (Vila 82 → 104 MB), tamanhos, atlas, nuvens corrompidas, liberar ao trocar de mapa | |
| B07 | Malhas e geometria do cenário: triângulos, LOD do cenário, vegetação | |
| B08 | Carregamento e streaming: glTF dos braços, sons, texturas de canvas; pico ao entrar nas áreas (60–900 ms); engasgo depois do aquecimento | |
| B09 | Shaders e compilação: programas restantes fora do aquecimento (composer do Alto), variantes | |
| B10 | Pós-processamento: devolver a cor por área no Médio da Vila de forma barata (`POS_MEDIO_FORA`); custo do composer | |
| B11 | Menus, lobby e HUD geral: tempo até o menu, `#warmMsg` sobrepondo "Clique para jogar" | |
| B12 | Rede global (lobby, PeerJS, `srvHandle` fora do zumbi) | só desempenho |
| B13 | Áudio global (`play`, síntese `nz`/`tn`, contexto, nós por som) | |
| B14 | Scripts globais por quadro: `tick`, `atmosTick`, `anim`/`trigger`/`amb` das áreas (raio `perto`, closures; a fogueira do Acampamento) | |
| B15 | Troca de gráfico em jogo, resize, DPR, aba escondida (vazamentos); `VIS.sh.r` que fica de um mapa zumbi para um PvP | |
| B16 | Gráfico Baixo como modo leve garantido (60 FPS em máquina fraca): o que o Baixo ainda faz que não precisa | |
| B17 | Céu, nuvens e água em todos os mapas (custo e corrupção das nuvens) | |
| B18 | Vila: legibilidade dos zumbis (neblina, luar) e defeitos visuais pontuais (g11 + g21 da fase 6) | sem custo novo |
| B19 | Sanatório: legibilidade e brilho (salas claras, forros pretos, Caldeiras no Baixo) e defeitos visuais pontuais (g12 + g20) | |
| B20 | Arma na mão: luz e material (manga clara `sleeve` 1,45, `vmRim`, envMap leitoso) e enquadramento (Python na mira, antebraço na Thompson/PM63): w20 + w21 da fase 6 | |
| B21 | Partículas de ambiente e efeitos das áreas (PART, névoa, fachos): custo | |
| B22 | Revisor de desempenho da Frente B (no fim) | |
