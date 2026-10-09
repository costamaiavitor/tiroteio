# Campanha do modo zumbi (Onda 3, Frente D): projeto técnico (O3-D01)

Projeto do O3-D01. A história, os personagens e todos os textos prontos para colar estão em `docs/overhaul/lore.md`. A base dos interativos (ZINT) está em `docs/overhaul/interativos.md`. Os números de linha mudam: procure pelo nome da função.

## 0. Resumo e decisões

- **Um modo novo, "Campanha", ao lado do "Clássico"** no menu do modo Zumbis. Depois do final, libera o "Infinito". O clássico não muda: todo código novo roda atrás de `CAMP.on` (falso no clássico), e o único código compartilhado mexido é o refator de tipos (D03), que não muda o comportamento.
- **A campanha atravessa os dois mapas e três arenas pequenas**, em 5 atos e 25 rodadas:
  - Vila: Atos I e II, rodadas 1 a 9;
  - arena **Forte Velho**: chefe 1, rodada 10;
  - Sanatório: Atos III e IV, rodadas 11 a 19;
  - arena **Casa do Forno**: chefe 2, rodada 20;
  - arena **Galeria 7**: Ato V, rodadas 21 a 24, chefe final na 25, depois fuga e final.
- **As arenas são mapas pequenos e dedicados** (`MAPS.forte`, `MAPS.forno`, `MAPS.galeria7`, com `zonly: 1, camp: 1`), carregados na transição entre atos. Nada é acrescentado à geometria da Vila nem do Sanatório.
- **Objetivos correm junto com as rodadas.** A rodada continua sendo a unidade de ritmo. O ato termina no fim da rodada em que o último objetivo é cumprido, e nunca antes da rodada mínima do ato.
- **Falhar um objetivo não acaba a partida**: o objetivo volta no próximo intervalo. Só o time inteiro caído acaba, e aí a partida recomeça do início do ato (checkpoint), com o kit do ato.
- **7 zumbis novos** (tipos 7 a 13) e **3 chefes novos** (14 a 16). O tipo passa de 3 para 5 bits na foto da rede. O Carniceiro (6) continua igual e ganha lore (Fermino, o magarefe).
- **Tudo é tabela**: atos, objetivos, rotas, kits, eventos, agenda, curva, tipos, chefes, ataques e textos. O código só lê as tabelas.

**Decisões minhas que o dono deveria confirmar** (também em §18):
1. A campanha atravessa os dois mapas, e as arenas são mapas à parte (não áreas novas dentro da Vila e do Sanatório).
2. Em cada ato, as portas do caminho da história abrem de graça; as outras continuam pagas.
3. Ao trocar de mapa sem morrer, o jogador leva pontos, armas (inclusive PaP) e bebidas. No checkpoint (recomeço do ato), recebe o kit fixo do ato.
4. O progresso é salvo por dificuldade, só no navegador. Quem cria a sala (host) só pode começar atos que ele mesmo já liberou.
5. A campanha tem 25 rodadas (cerca de 2 h). O infinito começa na rodada 1, com tudo o que a campanha acordou.
6. Os chefes novos e os zumbis novos não entram no clássico. Podem entrar depois, como opção.
7. O evento "só armas brancas" (Hora do Silêncio) bloqueia arma de fogo e explosivo no host.

---

## 1. Princípios

1. **Clássico intocado.** Cada gancho no código compartilhado é uma linha e começa com `CAMP.on &&` (ou chama uma função que devolve na hora quando `!CAMP.on`). O teste de caracterização do clássico (`tests/fluxos-zumbi.test.mjs`) e o harness de regressão `vila`/`sanatorio` precisam continuar idênticos.
2. **O host decide tudo.** Isso vale para:
   - objetivo, progresso e evento;
   - ataque de chefe e dano;
   - posição do NPC.
   O cliente só desenha e manda `use`, `hold` e `zhit`, que o host já confere hoje.
3. **Desempenho** (regras da Onda 1):
   - nenhum mapa pode ficar mais lento que a linha de base;
   - nada de `PointLight` por inimigo nem por ataque;
   - avisos de ataque e efeitos de área em `InstancedMesh` compartilhados;
   - modelos novos só com os materiais em cache (`mc`, `zGlow`), sem material novo e sem shader novo no meio da partida;
   - nada aloca por quadro.
4. **Todo valor de jogo em tabela** (§13). Número no meio do código é defeito de revisão.
5. **Assets só procedurais**: geometria, canvas e WebAudio, como no resto do modo zumbi.

## 2. Menu e modos

- `matchForm`, no modo Zumbis: uma linha nova "Modo" com três botões segmentados:

  | Botão | Disponível |
  |---|---|
  | **Clássico** | sempre (padrão) |
  | **Campanha** | sempre |
  | **Infinito** | com cadeado até concluir a campanha em qualquer dificuldade |

- **Campanha**:
  - os cartões de mapa somem e dão lugar a 5 cartões de ato ("I · A família 413" … "V · A Galeria 7");
  - cada cartão mostra o mapa onde começa e um cadeado se o ato não estiver liberado nessa dificuldade;
  - "Continuar" seleciona o último ato liberado;
  - a dificuldade continua sendo o `zdiff` de hoje.
- **Infinito**: os cartões de mapa voltam (só Vila e Sanatório; as arenas têm `camp: 1` e ficam fora da lista: filtro `!m.camp` em `maps`).
- **Estado da partida (`st`)**:
  - campos novos `zmode: 'classico' | 'campanha' | 'infinito'` (padrão `'classico'`) e `ato: 0..4`;
  - o `saneSt` aceita só esses valores, e o `ato` só até o liberado (conferido no host, §11);
  - com `zmode: 'campanha'`, o `map` vem de `CAMP_ATOS[ato].mapa`, e não da escolha;
  - o `lastSt` guarda `zmode` e `ato`.
- `srvStartMatch` → `zStartGame`: com `S.st.zmode !== 'classico'`, o gancho `campInicio()` liga o `CAMP` (§3.3) antes de o `zStartGame` seguir.

## 3. Estrutura: atos, mapas e transições

### 3.1 Por que atravessar os dois mapas

- A história é uma subida e uma descida: vila → morro → fundo da mina (`lore.md` §2.4). Ficar num mapa só jogaria fora metade do cenário que as fases 2 a 5 construíram.
- Os dois mapas já têm o que cada metade precisa:
  - a Vila tem o sino, a Pedreira com energia, o Hospital de campanha, a Estação e o Castelo;
  - o Sanatório tem a Recepção, o Laboratório, os interruptores de ala, as Caldeiras e a Torre.
- Uma troca de mapa custa uma carga (Vila 5 s, Sanatório 3 s, medidas da linha de base). São só 4 trocas em ~2 h, todas no intervalo, sem zumbi vivo e escondidas por uma cena.
- **Arenas à parte, e não áreas novas nos mapas grandes:**
  - não mexem na semente nem nos índices de rede da Vila e do Sanatório (janelas, paredes e caixas vão por posição);
  - não pesam no clássico;
  - são pequenas, então ficam bem acima da meta de FPS;
  - cada uma é de um agente só, sem conflito.
  - Custo: mais 3 cargas pequenas (~0,3 a 1 s, como os mapas PvP).

### 3.2 Os atos

| Ato | Nome | Mapa | Rodadas (mín.–máx. normal) | Objetivos | Marco (cena) |
|---|---|---|---|---|---|
| I | A família 413 | Vila | 1–4 | I.1 tocar o sino; I.2 ligar o gerador da Pedreira | `c1-fim` |
| II | A quarentena | Vila | 5–9 | II.1 a lista do Hospital; II.2 achar Nogueira; II.3 escoltá-lo ao Forte; II.4 abrir o alçapão | `c2-forte` → arena |
| chefe 1 | O Vigia | Forte Velho | 10 | matar o Tenente | `c2-fim` + `c3-abertura` |
| III | O Programa | Sanatório | 11–15 | III.1 o livro de admissões; III.2 a chave do Laboratório; III.3 abrir e ler o Laboratório; III.4 segurar o Laboratório | `c3-fim` |
| IV | O apito | Sanatório | 16–19 | IV.1 energia; IV.2 as três alas; IV.3 fechar o registro da Torre | `c4-forno` → arena |
| chefe 2 | O Foguista | Casa do Forno | 20 | matar Vicente | `c4-fim` + `c5-abertura` |
| V | A Galeria 7 | Galeria 7 | 21–24 | V.1 plantar 3 cargas; V.2 sobreviver à Névoa do Veio | – |
| final | O Diretor | Galeria 7 | 25 | matar o Diretor; fuga | `c5-fuga`, `c5-final` |

**Regras do ato** (dados em `CAMP_ATOS`):
- `rodMin`: o ato não termina antes do fim desta rodada, mesmo com tudo cumprido. Isso dá tempo de gastar pontos.
- `rodMax`: não é limite. Se o time passar dele sem cumprir os objetivos, as rodadas seguem com a curva subindo, e o rádio lembra o objetivo em cada intervalo. A pressão é a própria dificuldade, sem castigo extra.
- **Fim do ato**: no `zEndRound` da rodada em que o último objetivo fechou (e `round ≥ rodMin`), o gancho `campFimRodada()`:
  1. segura a pausa;
  2. manda a cena;
  3. salva o desbloqueio do ato seguinte;
  4. se o mapa do próximo ato for outro, faz a transição (§3.3);
  5. senão, começa a rodada seguinte normalmente depois da cena.
- **Rodadas de chefe** (10, 20, 25): o `toSpawn` é o da tabela do chefe (§7), e a rodada termina quando o chefe morre. Os lacaios vivos caem na hora, sem pontos ("o apito se cala"), passando por `zKill(..., nuke)` ou `zRecycle`, para não quebrar a regra do fim de rodada (`MAPA_ZUMBIS.md` §7.4).

### 3.3 Transição de mapa (técnico)

**No host**, ao fim do ato com mapa novo:

1. A cena começa (`{ t: 'camp', k: 'cena', id }`) e os jogadores ficam parados.
2. O host guarda a **bagagem** de cada jogador:

   | Leva | Zera |
   |---|---|
   | `money`, `inv` (armas, PaP, letais e munição), `perks`, `maxHp`, `bowie`, `lethal`, `clayHad` | portas, energia, Caixa, PaP em uso, armadilhas, drops, Claymores no chão e power-ups ativos |

   Quem está caído levanta com 100 de vida e sem bebidas, como o `zDown` faria. Quem sangrou volta com o kit do ato (§11).
3. Troca a partida: `S.st.map = CAMP_ATOS[novo].mapa` e `broadcast({ t: 'match', st: S.st })`. O caminho que já existe (`onMsg` `'match'` → `buildMap`) monta o mapa nos clientes, e o host monta o dele.
4. `srvStartMatch()` → `zStartGame()` → gancho `campInicio()`, que:
   - vê a bagagem guardada;
   - faz o `zReset` do mundo e põe cada jogador no `spawns` do mapa novo **sem** `zResetPlayer`, devolvendo a bagagem;
   - define `Z.round = CAMP_ATOS[novo].rod0 - 1`, para o `zStartRound` cair na rodada certa;
   - abre as portas iniciais do ato (§3.4).
5. A carga do mapa fica escondida pela cena: o cartão fica na tela até o `buildMap` acabar e o aquecimento (`warmUp`) terminar. Cada cliente manda `{ t: 'camp', k: 'pronto' }`; o host espera todos, ou no máximo `CAMP.cargaMaxS` (20 s), antes da pré-rodada (`phase 'pre'`, 5 s).

**No cliente**: o `buildMap` de hoje, sem mudança. A cena é um `div` por cima do canvas (HUD), que não depende do mapa.

**Quem entra durante a transição** recebe o `st` novo no `welcome` e entra como quem entra no meio (§12).

### 3.4 Portas da história

- Cada objetivo tem `abre: [idPorta, ...]`. Quando o objetivo fica ativo, o host abre essas portas de graça, pelo mesmo caminho da compra (`Z.doors.add`, `zdoor`, `zBuildWalk`), sem cobrar. Um gancho no `srvZUse` `door` reaproveita o código da abertura numa função `zAbrePorta(id, quem)` (refator de 1 linha no D02, combinado com a Frente C).
- No mapa, o caminho até o objetivo ganha um marcador no HUD (seta na borda da tela, como o `visScr` que já existe) e a porta aberta solta um `puff` de poeira.
- As portas fora da história continuam pagas. A Caixa, as bebidas e o PaP funcionam como no clássico.
- Os ids das portas de cada objetivo saem da cadeia de menor custo da `tools/itens/auditoria.mjs` entre o lugar do objetivo anterior e o do seguinte. O agente do ato grava a lista em `CAMP_OBJ[..].abre`.
- **Trava de campanha**: uma porta com `trava: 'camp:<chave>'` em `CAMP_TRAVAS[mapa]` só abre quando a chave existe (III.2). O `srvZUse` `door` e o `zInteract` já recusam porta travada (trava do O2-C08); o gancho só acrescenta o tipo `camp:`.

## 4. Objetivos

### 4.1 Motor genérico (`CAMP_OBJ`, código no D02)

Cada objetivo é uma entrada de tabela:

```js
{ id: 'I.2', tipo: 'defender', titulo: 'Ligar o gerador da Pedreira', abre: [...], radio: { ini: 'r1-energia', ok: 'r1-gerador-pegou', falha: 'r1-gerador-caiu' },
  alvo: { zint: 'gerador-pedreira' }, dura: 45, hp: 1500, hpPorJog: .35, atrai: .4, atraiR: 12, depois: ['I.3'] }
```

| Tipo | Sucesso | Falha | Campos |
|---|---|---|---|
| `usar` | F num interativo (ZINT) da campanha ou da Onda 2, de uma vez ou segurando (`segS`) | – (só interrompe; o progresso de segurar zera ao soltar ou cair) | `zint`, `segS`, `custo` |
| `ler` | qualquer jogador lê o terminal ou a nota (`E.lidos` do O2-C07) | – | `zint` |
| `chegar` | um jogador vivo entra na zona `{x, z, r}` | – | `zona` |
| `defender` | o objeto sobrevive `dura` s depois de ativado | o HP do objeto chega a 0; volta no próximo intervalo | `alvo`, `dura`, `hp`, `hpPorJog`, `atrai`, `atraiR` |
| `segurar` | soma `dura` s com pelo menos 1 jogador vivo e em pé na zona (o tempo só anda com alguém dentro) | – (o tempo não volta) | `zona`, `dura` |
| `escoltar` | o NPC chega ao fim da `rota` | o NPC cai; volta ao começo da rota no próximo intervalo | `npc`, `rota`, `hp`, `vel`, `perto` |
| `coletar` | o item é levado até o destino (F no destino) | – (quem carrega e cai deixa o item no chão) | `item`, `origem` (`elite` ou ponto), `destino` |
| `matar` | o chefe morre | – | `chefe` |
| `fugir` | pelo menos 1 jogador está na zona quando o tempo de embarque acaba | ninguém na zona quando acaba o `tempo`; a fuga recomeça | `zona`, `tempo`, `embarque` |

- **Ordem**: cada objetivo tem `depois` (os que liberam). Os que ficam ativos ao mesmo tempo aparecem juntos no HUD.
- **Estado no host** (`CAMP.obj[id]`):
  - `st`: `'oculto' | 'ativo' | 'feito' | 'falhou'`;
  - `p`: progresso de 0 a 1;
  - `v`: valor (HP, segundos);
  - `quem`: o portador, no `coletar`.
- **Rede**: a mudança vai em `{ t: 'camp', k: 'obj', id, st, p }`, limitada a 4 por segundo por objetivo. O estado completo vai no `zWorldState` (`cp`) para quem entra no meio.
- **HUD** (`campHud`, chamado pelo gancho no `zHud`):
  - painel no canto superior esquerdo, abaixo da rodada, com o título do ato, até 3 objetivos ativos e uma barra de progresso;
  - a seta de direção do objetivo mais próximo usa o `visScr`;
  - no mesmo estilo do HUD zumbi de hoje.
- **Alvos de campanha** (gerador, NPC, registro): objetos do host com `pos`, `hp` e `alive`, que entram como alvos falsos na escolha de alvo dos zumbis:
  - pelo gancho `campAlvos(tg)` no `zTickZombies`;
  - como fonte do campo de fluxo, pelo gancho `campFontes(src)` no `zFlowStart`.
  - Cada zumbi novo sorteia uma vez, com chance `atrai`, se persegue o alvo de campanha enquanto estiver a menos de `atraiR` dele.
  - O golpe num alvo falso vai para `campDanoAlvo(alvo, dmg)` (gancho de 1 linha no `zHurt`: `if (p.campAlvo) return campDanoAlvo(p, dmg, from)`).

### 4.2 Interativos novos da campanha (tipos ZINT, base do O2-C04)

Mesmo esquema da Onda 2: `ZINT.<tipo>`, `ZINT_FN.<tipo>`, `ZINT_MAPA.<mapa>.push`. Ficam visíveis **só com `CAMP.on`**: o `monta` devolve `null` sem campanha, e então o interativo não existe no clássico (o índice continua na lista, para a rede não mudar entre os modos).

| Tipo | Uso | Estados | Valores (tabela) |
|---|---|---|---|
| `nota` | F lê (igual ao terminal, mesma janela, texto em `CAMP_NOTA_TXT`) | `pronto` | `usoR 1,8`, `srvR 2,6` |
| `gerador` | F liga (defender) | `parado`, `pegando`, `ligado`, `afogado` | `hp`, `dura` no objetivo |
| `alcapao` | segurar F (`segS`) | `fechado`, `abrindo`, `aberto` | `segS 6` |
| `registro` | segurar F somando o tempo (volante gira) | `aberto`, `fechando`, `fechado` | `segS 12`, `chamaK 2` |
| `carga` | segurar F para plantar | `vazio`, `plantando`, `armada` | `segS 4` |
| `chave` | item no chão (F pega) e portador | `chao`, `levada`, `entregue` | – |
| `pilar` | destrutível por dano (tiro, explosão, golpe de chefe) | `inteiro`, `rachado`, `caido` | `hp`, `rachaPct` |
| `valvula` | F solta vapor (arena do Forno) | `pronta`, `vapor`, `recarga` | `vaporS 2`, `recarga 20`, `r 2,5` |
| `juncao` | destrutível por tiro (arena da Galeria 7) | `inteira`, `rompida` | `hp` |
| `gaiola` | zona da fuga, com contagem | `parada`, `embarque`, `subiu` | `embarque 10` |
| `curto` | F sobrecarrega o gerador do holofote (arena do Forte) | `pronto`, `recarga` | `atordoa 4`, `recarga 40` |

Pilar e junção recebem dano pelos ganchos que já existem: `zintTiro` (tiro do cliente conferido pelo host) e `zintExplosao`. O golpe do chefe chega por `campDanoPilar`.

### 4.3 Os objetivos de cada ato (dados; os agentes dos atos acertam posições com a sonda)

**Ato I · A família 413 (Vila, rodadas 1–4).** Cena `c0-abertura` antes da rodada 1. Rádio `r1-inicio` no começo da rodada 1.

| id | Tipo | O quê | Interativos que usa | Regras |
|---|---|---|---|---|
| I.1 | `usar` | tocar o sino da Igreja (B) | `sino` (O2-C10) | a primeira badalada da campanha sai grátis (gancho `campCusto` no `usar` do sino). Quando toca, os zumbis vão até a torre por 8 s (o efeito de hoje), e o jogador **aprende a isca**. Abre a porta A↔B. Rádio `r1-sino` |
| I.2 | `defender` | ligar o gerador da Pedreira (F), ao lado da Energia | `gerador` (novo) + Energia (`M.z.power`) | abre a cadeia até F. F no gerador: 45 s "pegando", HP 1500 × (1 + 0,35·(np−1)). 40% dos zumbis novos a menos de 12 m vão para o gerador. Cada golpe tira o dano do golpe ×1. Com o HP em 0, falha (rádio `r1-gerador-caiu`) e volta no próximo intervalo. Com sucesso, liga a Energia do mapa (`zPowerOn`, como a alavanca). Ajudam: as armadilhas de fogo do Acampamento e da Fazenda e as barricadas reparáveis do caminho F→J |
| I.3 | (marco) | – | – | no fim da rodada em que I.2 fechou (`rodMin` 4): cena `c1-fim` e nota `n-pedreira-dinamite` |

Notas do Ato I: `n-praca-cabo` (A), `n-pedreira-dinamite` (F). Terminal opcional: `vila-igreja`.

**Ato II · A quarentena (Vila, rodadas 5–9).** Rádio `r2-inicio`.

| id | Tipo | O quê | Interativos que usa | Regras |
|---|---|---|---|---|
| II.1 | `ler` | a lista de transferência do Hospital de campanha (K) | terminal `vila-hospital` (O2-C07) | abre a cadeia até K. Rádio `r2-lista` |
| II.2 | `chegar` | achar Nogueira na sala do telégrafo da Estação (G) | nota `n-estacao-cabo` | zona de 3 m. Rádio `r2-escolta` |
| II.3 | `escoltar` | levar Nogueira da Estação (G) ao Forte Velho (Castelo, I) | atalho `porteira-estacao` (O2-C08), barricadas, sino | ver as regras da escolta abaixo |
| II.4 | `usar` | abrir o alçapão da casamata no Castelo (I) | `alcapao` (novo), segurar F 6 s | durante o segurar, Nogueira "segura a porta" (fala `cabo-chegou`). Rádio `r2-forte`. Fim do ato: cena `c2-forte`, transição para a arena Forte Velho, rodada 10 |

**Regras da escolta (II.3)** — `CAMP_NPC.cabo`:
- **Rota**: lista de pontos `rota: [[x, z], ...]` escrita à mão pelo agente do ato. Cada trecho precisa ter linha livre (`segClearR`) e ficar a mais de 1 m de colisor. O NPC anda cinemático pelo traço: sem física, com a altura do chão pelo `groundAt`.
- **Velocidade e parada**:
  - anda a `vel` 2,6 m/s **só** com um jogador vivo e em pé a até `perto` 6 m; sem ninguém perto, para (fala `cabo-para`);
  - com zumbi a menos de 2 m, para e se defende (pistola: 1 tiro a cada 1,2 s, 60 de dano no zumbi mais perto, sem pontos).
- **Vida**:
  - HP 600 × (1 + 0,5·(np−1));
  - volta a 6/s depois de 5 s sem golpe;
  - abaixo de 30% solta `cabo-ferido` uma vez;
  - com o HP em 0, cai: o objetivo falha, e no próximo intervalo ele volta ao começo da rota (rádio `r2-escolta-caiu`).
- **Zumbis**: o NPC é alvo falso (§4.1). 50% dos zumbis novos a até 15 m o escolhem, e os Soldados (tipo 8) o preferem. O sino (I.1) puxa os zumbis para longe da rota: é a tática que o Ato I ensinou.
- **Visual**: o modelo de jogador do PvP com a farda da 3ª Cia (cores do `CAMP_NPC.cabo.skin`), 1 modelo, sem luz. Posição a 20 Hz na foto dos zumbis (campo `cn`, gancho no `zSnap`) e interpolação igual à dos zumbis.

Notas do Ato II: `n-castelo-foto` (I), `n-base-ordem` (c0, opcional, fora da rota), `n-estacao-cabo` (G).

**Chefe 1 · O Vigia (arena Forte Velho, rodada 10).** §7.2 e §8.1. Nota `n-forte-paiol`. Quando o chefe morre: cenas `c2-fim` e `c3-abertura` e transição para o Sanatório (rodada 11).

**Ato III · O Programa (Sanatório, rodadas 11–15).** Rádio `r3-inicio`. O jogador nasce na Recepção (A), o `start` de hoje.

| id | Tipo | O quê | Interativos que usa | Regras |
|---|---|---|---|---|
| III.1 | `ler` | o livro de admissões | terminal `san-recepcao` | rádio `r3-livro` |
| III.2 | `coletar` | a chave do Laboratório | `chave` (novo), elite | na rodada em que III.2 fica ativo, a 40% dela, nasce uma **Enfermeira-chefe**: Enfermeiro (tipo 10) com `elite: 1`, vida ×4, tamanho ×1,15 e a chave brilhando no pescoço (`zGlow`). Ela anda **para longe** dos jogadores (foge pelo campo de fluxo invertido enquanto houver caminho) e só ataca quando encurralada. Ao morrer, solta a `chave`. Quem pega vira portador (ícone no HUD de todos); se cair, a chave fica no chão onde ele caiu. Rádio `r3-chave` |
| III.3 | `usar` + `ler` | abrir o Laboratório (D) com a chave e ler o relatório 31 | porta D com `trava: 'camp:chave-lab'`, terminal `san-laboratorio` | a porta D só abre com o portador da chave (F na porta). As portas do caminho até D abrem de graça. Rádio `r3-laboratorio` |
| III.4 | `segurar` | segurar o Laboratório | zona = sala D | ler o relatório "solta o apito": evento **Estouro** (§5) até o fim da rodada, e 75 s somados com alguém dentro da sala D. Fim do ato (`rodMin` 15): cena `c3-fim` |

Notas do Ato III: `n-enfermaria-dose` (B), `n-biblioteca-sono` (N), `n-estabulo-fermino` (r11; o Carniceiro aparece na rodada 13, §6.4).

**Ato IV · O apito (Sanatório, rodadas 16–19).** Rádio `r4-inicio`.

| id | Tipo | O quê | Interativos que usa | Regras |
|---|---|---|---|---|
| IV.1 | `usar` | ligar a Energia nas Caldeiras (P) | Energia (`M.z.power`) | abre a cadeia até P |
| IV.2 | `usar` ×3 | ligar as três alas | interruptores `ala-oeste` (N), `ala-leste` (K), `ala-anel` (r5) (O2-C08) | preço de hoje (500/500/1000: ver decisão §18). Cada um conta 1/3. Rádio `r4-alas` a cada um. Libera as armadilhas elétricas das alas, que ajudam no IV.3 |
| IV.3 | `usar` (somando) | fechar o registro da Torre d'água (M) | `registro` (novo), 12 s somados | quem segura F "faz barulho": os zumbis a até 25 m o escolhem como alvo (`chamaK 2`: peso dobrado na escolha de alvo, gancho na escolha de alvo). Evento **Contra o relógio** na rodada 19 (§5.1). Rádio `r4-registro`. Fim do ato: cena `c4-forno` e transição para a arena Casa do Forno, rodada 20 |

Nota do Ato IV: `n-torre-registro` (M). As armadilhas de fogo e elétricas, os barris e as barricadas da Onda 2 são as ferramentas de defesa do IV.3.

**Chefe 2 · O Foguista (arena Casa do Forno, rodada 20).** §7.3 e §8.2. Nota `n-forno-pulseira`. Quando o chefe morre: cenas `c4-fim` e `c5-abertura` e transição para a Galeria 7 (rodada 21).

**Ato V · A Galeria 7 (arena, rodadas 21–24).** Rádio `r5-inicio`.

| id | Tipo | O quê | Interativos que usa | Regras |
|---|---|---|---|---|
| V.1 | `usar` ×3 | plantar as 3 cargas nos pilares da boca | `carga` (novo), segurar F 4 s cada | os pilares ficam nas três galerias de fora, que se abrem uma por rodada (21, 22 e 23) pelas portas da história. A carga plantada fica armada até o final (não pode ser destruída). Rádio `r5-cargas` |
| V.2 | `segurar` | sobreviver à rodada 24 (Névoa do Veio + Pregadores) | – | a rodada inteira (o `segurar` com zona = arena toda) |

**Final (rodada 25).** Chefe Diretor (§7.4), depois a fuga:
- **Fuga** (`fugir`): tempo de 75 s; zona = gaiola da mina; embarque de 10 s.
  - Durante a fuga, evento **Estouro** sem fim: o `toSpawn` repõe sozinho, e só os Afogados e os comuns correndo nascem.
  - A gaiola desce quando o Diretor morre (cena `c5-fuga`, 4 s).
  - O primeiro jogador que entra começa o embarque de 10 s. Quem está dentro quando acaba, escapa. Quem fica fora, fica (não estraga o final do time).
  - Se ninguém entrar em 75 s, a fuga recomeça (o chefe continua morto).
- **Final**: cenas `c5-final` (e `c5-final-completo` se a sala leu os 22 documentos), `c5-pos` e créditos. Depois, o desbloqueio do Infinito (§9).

## 5. Eventos especiais

### 5.1 Regras exatas (`CAMP_EV`)

Um evento vale **a rodada inteira** em que cai. Começa com o banner do `zRoundFx` (nome e subtítulo) e a linha de rádio. Nunca cai em rodada de cães nem em rodada de chefe (a fuga é exceção). O host decide e manda `{ t: 'camp', k: 'ev', id }` no `zround`. O cliente aplica o visual. O estado vai no `cp` para quem entra no meio.

| id | Nome no jogo | Regra no host | Visual e som no cliente | Pontos |
|---|---|---|---|---|
| `apagao` | Apagão | `toSpawn` ×0,85 | lâmpadas apagadas: o pool de luz com intensidade 0 e os bulbos emissivos a 10%; hemisférica e preenchimento ×0,35; névoa `far` ×0,6; olhos dos zumbis (`zGlow`) intactos; lanterna (L) liberada; som `lightning` no início | ×1,25 por abate |
| `nevoa` | Névoa do Veio | velocidade dos zumbis ×0,9; nascimento só por risers e pontos de água (`CAMP_AGUA[mapa]`), com janelas só se não houver nenhum; peso dos Afogados ×2 | `fog.far` = 16 m, cor 0x0c140f (o `zCull` corta junto: ganha FPS); céu na mesma cor (como o `zFogDog`); gemidos com +3 dB | ×1,15 |
| `estouro` | Estouro | comuns sempre `sc 2` a rand(5; 5,5)·spd; vida ×0,6; `toSpawn` ×1,3; `spawnDelay` ×0,5; `max` +4; especiais só Veloz | apito de vapor sintetizado a cada 8 s ao longe | ×1 |
| `silencio` | Hora do Silêncio | o `'zhit'` só aceita `w === 'knife'`; o `splash` não fere; granada, Semtex, Claymore, macaco e barril não ferem zumbi; faca ×3 (Bowie fica nos 1000); vida dos zumbis ×0,5 (mínimo 150); `toSpawn` ×0,6; especiais só o Contido; Insta-Kill e Nuke fora do saco | arma de fogo abaixada (o cliente bloqueia o tiro e mostra "Hora do Silêncio"; quem regra é o host); som do ambiente abafado | ×1,5 na faca |
| `inchados` | Inchados | 60% dos nascimentos são Explosivos (tipo 2); raio do estouro ×1,2 e dano em outros zumbis ×2 (corrente); dano no jogador igual | Explosivos com o brilho da barriga ×1,5 | ×1 |
| `relogio` | Contra o relógio | prazo T = 60 + 2,5·`toSpawn` s (com o `toSpawn` do começo da rodada). Antes do prazo: drop `max` garantido no último abate e +250 para cada jogador vivo. No prazo: os que faltam nascem com `spawnDelay` ×0,25, todos os comuns vivos passam a `sc 2` e entra 1 Brutamonte a mais | manômetro no HUD, que fica vermelho nos últimos 15 s; bipe a cada 1 s nos últimos 10 s | ×1 |
| `suprimento` | Lançamento aéreo | um caixote a cada 25 s (no máximo 5 por rodada), em célula andável de área aberta, a 10–30 m de um jogador sorteado; dura 40 s; F abre. Conteúdo: 60% power-up do saco (`zDrop(type, x, z, true)`); 25% munição cheia em todas as armas de quem abriu; 15% `perk` (só da rodada 5 em diante, senão vira power-up). `toSpawn` ×1,15 | caixote (caixa + paraquedas de plano) e fumaça vermelha (sprite do `puff`); bipe ao cair | ×1 |

**Fuga**: usa as regras do `estouro` e mais "reposição contínua" (`toSpawn` nunca abaixo de 6).

### 5.2 Agenda na campanha (`CAMP_AGENDA`)

| Rodada | Evento | Motivo |
|---|---|---|
| 3 | `nevoa` | apresentar o Veio, ainda leve |
| 6 | `suprimento` | o Exército ainda tenta (Ato II) |
| 8 | cães (do clássico) | os cães do cordão |
| 9 | `apagao` | antes do Forte |
| 13 | `silencio` | Ala Psiquiátrica, tubos de escuta |
| 14 | cães | os cães da Floresta (bíblia: "a rodada dos cães nasce aqui") |
| 15 | `estouro` | é o III.4 |
| 17 | `inchados` | – |
| 19 | `relogio` | é o IV.3 |
| 22 | `nevoa` | a água da Galeria |
| 24 | `nevoa` + Pregadores (V.2) | – |

Na campanha, as rodadas de cães do clássico (`nextDog`) ficam desligadas. Só valem as da agenda.

### 5.3 No infinito

Um evento a cada 5 rodadas a partir da 5ª, sorteado entre os 7, sem repetir os 2 últimos. Nunca cai em rodada de cães nem de chefe. A `relogio` não sai antes da rodada 10.

## 6. Zumbis novos

### 6.1 Mudanças técnicas (D03, refator sem mudar o comportamento)

1. **Tipo com 5 bits na foto**:
   - bits 7–9 (como hoje) mais bits 11–12, porque o bit 10 (1024) já é o `vault`;
   - no host (`zSnap`): `((z.kind & 7) << 7) | ((z.kind >> 3) << 11)`;
   - no cliente (`zNewClientZombie`): `((f >> 7) & 7) | (((f >> 11) & 3) << 3)`;
   - conferir no D03, com grep, que nada usa os bits 11+ do `f`.
2. **`ZKIND[k].chefe`** no lugar dos ~13 `kind === 6` (`MAPA_ZUMBIS.md` §7.2: Nuke, armadilha, explosões, golpe máximo, queda, `zFreeze`, alcance, fúria, `zRecycle`, barra do chefe, barril, fogo).
   - O Carniceiro ganha `chefe: 1, capGolpe: .12, capArmadilha: .06, capNuke: .2`, os números de hoje, agora na tabela.
   - Os chefes novos têm os próprios números.
   - Ramos que são **do Carniceiro** e não "de chefe" (golpe `zSlam`, modelo, som, queda 6) continuam com `kind === 6`.
3. **`Z.mix` e laços com o tamanho de `ZKIND`** em vez de 6.
4. **Ganchos de uma linha** que o D03 deixa prontos, todos devolvendo na hora no clássico:

   | Gancho | Onde | Para quê |
   |---|---|---|
   | `kind = campTipo(kind)` | `zSpawnOne`, depois do sorteio | tipos da campanha e eventos |
   | `if (campNasce(z, cands)) ...` | `zSpawnOne` | Afogado na água, elite, lacaio no portão |
   | `campStatus(z)` | fim do `zSpawnOne` | vida, velocidade, ataque por tipo |
   | `if (z.ck && campIA(z, dt, tgt)) continue;` | `zTickZombies` | comportamento próprio |
   | `* (z.cv \|\| 1)` | fórmula de velocidade | multiplicador da campanha |
   | `dmg = campDano(z, dmg, zone, w, p, splash)` | `zHit`, antes do `z.hp -=` | capacete, crosta, fraco, Silêncio |
   | `campMorte(z, p, zone, w)` | `zKill` | brasa, cal, chave, Pregador |
   | `campAlvos(tg)` / `campFontes(src)` | escolha de alvo / `zFlowStart` | alvos de campanha |
   | `if (CAMP.on && !campZhitOk(p, m, z)) return;` | `'zhit'` | Silêncio, zona `fraco` |

5. **Zona `fraco`**:
   - o cliente pode mandar `m.z === 'fraco'` no `zhit` quando acerta a caixa do ponto fraco de um chefe (`zBoxes`: uma esfera a mais por chefe);
   - o host aceita só se `z.fracoAte > now` (e, no Foguista, se o tiro vem de trás: ângulo entre a frente dele e o atirador > 110°);
   - o teto do `zhit` usa o multiplicador `CAMP_CHEFE[k].fracoK` (3).

### 6.2 Tabela dos tipos (`ZKIND` 7–13 e `CAMP_ZK`)

Os números são relativos ao comum da mesma rodada (`zHp(r)·zHpK(r)`) e às velocidades de hoje (andar 1,3–1,8; trotar 3,6–4,3; correr 5–5,5; Veloz 6–6,5).

| i | Nome | Estreia (rodada da campanha) | Vida × | Velocidade | pts / xp | sz / rad | Comportamento | Contra-tática |
|---|---|---|---|---|---|---|---|---|
| 7 | **Penitente** | 6 (Vila) | 1,2 | trota (3,4–3,8) | 50 / 3 | 1,0 / ,3 | a 4 m: aviso 0,6 s (ergue o balde), depois joga **cal** num cone de 3,5 m e 50°: 10 de dano e "cal nos olhos" (tela branca que some em 2,5 s; metade com a opção de reduzir flashes). Ao morrer, o balde quebra e solta nuvem de cal de 2,5 m por 4 s: zumbis dentro perdem o alvo e andam a ×0,5 | matar de longe; usar a nuvem da morte dele para segurar os outros |
| 8 | **Soldado** | 7 (Vila); lacaio do Vigia | 1,5 | trota | 60 / 4 | 1,02 / ,3 | **capacete**: o primeiro tiro na cabeça não tem multiplicador (`crack` metálico, o capacete voa) e os seguintes valem. Nasce em **trio** (os 3 juntos, do mesmo ponto); prefere o NPC e o jogador "marcado" | dois tiros na cabeça ou explosivo no trio; não deixar o trio chegar junto |
| 9 | **Afogado do Veio** | 8 (Vila, só onde há água); Ato V | 0,9 | submerso 4,5; fora d'água anda | 50 / 3 | ,95 / ,3 | nasce só em pontos de água (`CAMP_AGUA`) e anda **submerso** (estado `sub`, corpo a y −1,3): quase invisível e imune a tudo, menos explosão. Deixa um anel de ondas (instanciado). A 4,5 m: aviso 0,8 s (bolhas e anel maior), sai e **agarra**: 25 de dano e jogador a ×0,5 por 1,5 s. Fora d'água é um comum lento | olhar as ondas; mirar onde ele vai sair; granada na água; ficar longe das poças |
| 10 | **Enfermeiro** | 11 (Sanatório) | 1,0 | trota | 50 / 3 | 1,0 / ,3 | entre 5 e 9 m de um jogador com linha livre, para e **joga a seringa**: aviso 0,5 s (brilho na mão) e projétil em arco a 14 m/s, que desvia com passo lateral. Acerto: 15 de dano + 1 **dose** (×0,85 de velocidade por 4 s; acumula até 3; com 3, vinheta escura 2 s). O golpe corpo a corpo também aplica dose | prioridade de alvo; quebrar a linha de visão; Stamin-Up |
| 11 | **Contido** | 13 (Sanatório) | 2,0 | anda 2,2 | 70 / 4 | 1,1 / ,35 | não tem golpe. A 4–14 m com linha livre: para e treme por 0,9 s (aviso: tremor + `scream` baixo), depois **investe** em linha reta por até 14 m a 9 m/s. No jogador: 45 de dano e empurrão de 4 m. Em zumbi comum no caminho: derruba (sem pontos). Em parede ou pilar: fica **atordoado** 2 s e leva ×2 de dano | passo para o lado no fim do aviso; atraí-lo para a parede ou pilar e atirar no atordoado |
| 12 | **Carvoeiro** | 16 (Sanatório) | 1,4 | anda/trota | 60 / 4 | 1,05 / ,32 | **crosta**: corpo e pernas levam ×0,3; cabeça ×1. Fogo, armadilha de fogo e porta do forno: imune. Explosão: ×0,25. Ao morrer, deixa brasa no chão de 2 m por 3 s (15/s no jogador) | tiro na cabeça; não confiar em explosivo nem em armadilha |
| 13 | **Pregador do Veio** | 18 (Sanatório); Ato V; fase 3 do Diretor | 1,6 | anda; foge para 12 m dos jogadores | 100 / 6 | 1,05 / ,3 | a cada 6 s, se houver corpo de **comum** morto há menos de 8 s a até 10 m: canta (aviso 1,2 s: mãos acesas + coro sintetizado) e **levanta** o corpo com 40% da vida. No máximo 4 por Pregador. Tiro na cabeça durante o canto interrompe e atordoa por 1,5 s os levantados por ele | matar primeiro; flanquear; explosão destrói os corpos perto (não levantam) |

**Na estreia**, cada tipo é apresentado:
- a primeira aparição chega com uma linha de legenda ("PENITENTE: não deixe chegar perto do balde");
- e só 1 desse tipo na rodada de estreia.

**Quantidade** (`CAMP_MIX`, por ato):

| Tipo | Fração da rodada | Teto |
|---|---|---|
| Penitente | 6% → 10% | 4 vivos |
| Soldado | trios: 1 trio a cada 12 zumbis | 2 trios vivos |
| Afogado | 8% nos mapas com água | 4 vivos |
| Enfermeiro | 8% | – |
| Contido | 1 + ⌊(r − 13)/3⌋ | 3 |
| Carvoeiro | 8% → 12% | – |
| Pregador | 1 (rodadas 18–19) e 2 (Ato V) | – |

O teto total de especiais continua sendo ⌊n·0,5⌋, como no `zMix`.

### 6.3 Visual, animação e som (procedurais)

**Regras do modelo:**
- só `mc`/`zGlow`, sem transparência e com os ossos base;
- partes novas como `zbx`/`zcy`/`zsp` presas aos ossos, com a chave do molde por tipo em `zLook`;
- 2 chamadas de desenho por zumbi, como hoje;
- a esfera de recorte (`ZBS`) aumenta só para os chefes.

**Animação:** pelo gancho `campAnim(zc, dt)` no fim do `zAnimHuman`, só com a pose dos ossos e sem alocar.

| Tipo | Visual | Animação | Som (síntese de hoje) |
|---|---|---|---|
| Penitente | capuz cônico branco-cal, túnica cinza, balde de zinco na mão esquerda, cruz de cal no peito | balde balança; aviso: braço sobe | coro grave de 2 notas (como o `groan`, filtrado), `smoke` ao jogar |
| Soldado | capacete M1 (meia esfera + aba), farda verde-oliva, cinto, perneira | marcha rígida (`ws` próprio); capacete solta (osso escalado a 0 + pedaço que voa no pool de destroços) | `crack` agudo no capacete, `snarl` |
| Afogado | pele preta brilhante (cor quase preta, especular alto), roupa encharcada, boca aberta | submerso: só o anel de ondas (o modelo fica a y −1,3); sai como o `rise` de hoje, mais rápido | `gurgle`, bolhas (ruído com passa-baixa) |
| Enfermeiro | jaleco branco sujo, touca, máscara de pano, seringa com brilho verde (`zGlow`) | braço do arremesso; aviso: mão sobe e brilha | bipe agudo curto (`tn`) no aviso |
| Contido | camisa de força branca com fivelas e o número costurado nas costas (canvas da bíblia: 156-2 etc.), braços cruzados (ossos fixos) | tremor no aviso; corrida inclinada; queda atordoada | `scream` grave no aviso, `slam` na parede |
| Carvoeiro | pele preta com rachaduras laranja (`zGlow`) | rachaduras piscam quando leva tiro | `hiss` crepitando |
| Pregador | batina preta molhada, cálice, mãos que brilham no canto (`zGlow`) | braços abertos no canto | coro (3 `tn` em acorde menor, 1,2 s) |

**Gemidos:** os tipos novos ganham índices próprios em `ZGROAN`, depois dos comuns. Isso corrige o conflito do `7+id%3` (`MAPA_ZUMBIS.md` §4).

### 6.4 O Carniceiro na campanha

O mesmo de hoje (tipo 6, regras e números do clássico), só que em rodadas fixas pela agenda:
- 13 (ligado à nota do Estábulo);
- 18;
- 23 (Galeria 7).

O `ZSPEC.boss` e o `cada` não valem na campanha. Fala `carn-entrada` quando nasce.

## 7. Chefes

### 7.1 Base comum (`CAMP_CHEFE`, código no D07)

- Cada chefe é um tipo em `ZKIND` (14, 15 e 16) com `chefe: 1`.
- **Vida**: `zHp(rodada)·zHpK·(base + porJog·np)`, com a rodada fixa da tabela (assim o chefe tem a mesma vida mesmo se o time chegar atrasado).
- **Teto por golpe**: `capGolpe` 6% (no ponto fraco, `capFraco` 10%). Nuke tira 5%; armadilha 2% a cada 0,5 s; barril 8%. Insta-Kill só dobra.
- **Fases**: limites em % da vida. Na troca de fase:
  - **2 s invulnerável** (fala, mudança de visual, `{ t: 'camp', k: 'chefe', id, fase }`);
  - o ataque em curso é cancelado.
- **Vida baixa**: a última fase é o "comportamento com vida baixa" e sempre muda o jeito de lutar (não é só "mais rápido").
- **Ataques** (`ataques: [{ id, fases, peso, cd, aviso, ativo, rec, forma, dims, dano, efeito }]`):
  - o host sorteia por peso entre os que estão fora do cooldown e são válidos (alcance e linha de visão);
  - manda o aviso: `{ t: 'camp', k: 'tel', a, f: forma, x, z, ang, d1, d2, s: aviso, at: ativo }`;
  - aplica o dano ao fim do aviso, enquanto durar o ativo, conferindo forma e altura (um jogador num lugar 1,5 m acima do chão não é atingido por ataque de chão);
  - na recuperação (`rec`), pode abrir o ponto fraco (`fracoAte`).
- **Tempos de aviso por dificuldade**: Fácil ×1,25, Normal ×1, Difícil ×0,9, Pesadelo ×0,8. **Nunca abaixo de 0,6 s** (ping de 150 ms + reação).
- **Formas de aviso** (pool comum, D07):

  | Forma | Malha | Instâncias |
  |---|---|---|
  | `disco` | `InstancedMesh` de anel | 8 |
  | `linha` | retângulo | 8 |
  | `setor` | leque de 32 segmentos | 4 |

  Material Basic aditivo, `depthWrite: false`, a 3 cm do chão. Amarelo pulsando no aviso, vermelho no ativo e escondido fora disso: **3 chamadas de desenho no máximo**, só com ataque no ar. O material é compilado no `warmUp` da arena.
- **Lacaios**:
  - nascem pela tabela (`lacaios: { tipo, n, cada, max, onde }`), fora do `toSpawn`, marcados `lac: 1`;
  - não contam para o fim da rodada;
  - morrem sem pontos quando o chefe morre.
- **Barra do chefe**: a mesma do Carniceiro (`bo` na foto), com o nome e as marcas das fases.
- **Recompensa**: +500 para cada jogador; drop garantido de `max` e de `perk`; o desbloqueio do ato seguinte.
- **Versão de campo** (infinito, §9): os ataques e fases que não dependem da arena. Os elementos de arena são trocados por um efeito equivalente ou cortados (coluna `campo` das tabelas abaixo).

### 7.2 O Vigia (Tenente Brandão, tipo 14) — chefe do Ato II

**Números:**
- vida `zHp(10)·(6 + 4·np)`: sozinho 10 450; 4 jogadores 22 990 (no Normal);
- `sz` 1,45, `rad` ,45;
- anda a 2,2 (fase 3: 3,0).

**Modelo:** farda com dragonas, quepe, fuzil com baioneta e **o holofote preso às costas**: lente com `zGlow` branco forte e cone falso de luz (plano aditivo, sem luz real). O ponto fraco é a lente.

| Fase | Vida | Mudança |
|---|---|---|
| 1 | 100–66% | no chão do pátio; varredura, rajada, granada, pelotão (a cada 30 s) |
| 2 | 66–33% | sobe na **torre do holofote** (plataforma de 3 m, duas rampas) e atira de cima; varredura mais rápida; pelotão a cada 20 s |
| 3 (vida baixa) | < 33% | o holofote **quebra** (apagão local na arena: só os sinalizadores do muro); ele desce e passa à **investida de baioneta**; marca no escuro pelo som (quem correr fica marcado); pelotão a cada 15 s; leva ×1,15 de dano |

| Ataque | Fases | Aviso | Ativo | Rec. | Forma | Efeito | Campo |
|---|---|---|---|---|---|---|---|
| Varredura do holofote | 1, 2 | 1,0 s (setor de 60° e 22 m na direção inicial; zumbido `power`) | 2,4 s girando 120° (fase 2: 1,6 s e 150°) | 1,0 s | setor | quem fica ≥ 0,3 s dentro (com linha livre do holofote) fica **marcado** por 6 s: os Soldados e o Vigia o preferem, e a rajada só mira nele | sim |
| Rajada de fuzil | 1–3 | 0,8 s (linha de 30 m × 0,6 m; apito curto; brilho no cano) | 0,45 s (3 tiros) | 1,4 s, **fraco aberto** | linha | 22 por tiro (×`D.dmg`/50); pilar no caminho segura e perde HP | sim |
| Granada de cal | 1–3 | 1,2 s (disco de 3,5 m no alvo) | instantâneo | 0,8 s | disco | 35 + cal nos olhos 1,5 s | sim |
| Pelotão | 1–3 | 1,5 s (apito longo) | – | – | – | 3 Soldados (tipo 8) nos portões; máx. 6 vivos (fase 3: 9) | sim (perto dos jogadores) |
| Investida de baioneta | 3 | 0,7 s (linha de 14 m) | 9 m/s até 14 m | 1,2 s; se bate em pilar ou parede, **atordoado 2,5 s**, fraco aberto | linha | 55 + empurrão | sim |

**Fraquezas:**
1. **Lente do holofote** (fraco ×3), aberta na recuperação da rajada, quando atordoado e sempre por trás.
2. **Curto no gerador do holofote** (interativo `curto` da arena; F, recarga de 40 s): atordoa 4 s, cancela a varredura e abre o fraco. Na fase 3 não tem efeito (o holofote já quebrou).
3. **Barris do paiol** (tipo `barril` da Onda 2): 8% por explosão.

### 7.3 O Foguista (Vicente, tipo 15) — chefe do Ato IV

**Números:**
- vida `zHp(20)·(6 + 4·np)`: sozinho 27 110; 4 jogadores 59 642;
- `sz` 1,7, `rad` ,55;
- anda a 2,0 (fase 2: 2,6).

**Modelo:** macacão de foguista, avental de couro, luvas, pá de carvão e, **nas costas**, um tanque com manômetro (`zGlow`, do verde ao vermelho conforme a fase), que é o ponto fraco.

| Fase | Vida | Mudança |
|---|---|---|
| 1 | 100–60% | pá, porta do forno, brasa, apito (a cada 35 s) |
| 2 | 60–25% | "a pulseira queimou": a couraça racha; deixa rastro de brasa (chão em brasa por 2 s onde pisa); velocidade 2,6; apito a cada 25 s |
| 3 (vida baixa) | < 25% | "no vermelho": **explosão de pressão** a cada 15 s; apito a cada 20 s, com 1 Pregador junto |

| Ataque | Fases | Aviso | Ativo | Rec. | Forma | Efeito | Campo |
|---|---|---|---|---|---|---|---|
| Golpe de pá | 1–3 | 0,9 s (setor de 100° e 3,2 m) | instantâneo | 1,0 s | setor | 60 + empurrão de 4 m | sim |
| Porta do forno | 1–3 | 1,5 s (a porta escolhida brilha; retângulo de 10 × 2,4 m saindo dela) | 2,0 s | – | linha | jogador 25/s; **zumbi 200/s**, exceto Carvoeiro (o jogador pode puxar os lacaios para a frente da porta); escolhe o forno com mais jogadores na frente | não |
| Brasa lançada | 1–3 | 1,0 s (disco de 3 m no alvo) | chão em brasa 4 s | 0,6 s | disco | 15/s | sim |
| Apito | 1–3 | 2,0 s (o apito sobe de tom) | – | 1,5 s, **fraco aberto** de qualquer lado | – | 4 Carvoeiros pela calha de carvão (fase 3: + 1 Pregador); máx. 8 lacaios | sim |
| Explosão de pressão | 3 | 3,0 s (disco de 7 m crescendo; manômetro pisca) | instantâneo | 2,0 s, **fraco aberto** | disco | 80; **sem dano atrás de pilar** (linha do centro dele até o jogador bloqueada); pilar no caminho perde 1/3 do HP | sim (só a parte da linha de visão) |

**Fraquezas:**
1. **Tanque das costas** (fraco ×3): só por trás (ângulo > 110°), ou de qualquer lado na recuperação do apito e da explosão.
2. **Válvulas de vapor** (4 no teto; interativo `valvula`; F grátis; recarga de 20 s): coluna de 2,5 m por 2 s. Se ele estiver dentro: **atordoado 3 s** e fraco aberto de qualquer lado. Nos lacaios: 50/s.
3. **Esteira**: quem fica nela é levado a 1,5 m/s para o forno 4. Ele também é, se for atordoado em cima dela: perde 4%/s enquanto estiver na boca do forno.

### 7.4 O Diretor (Dr. Aurélio, Número 1, tipo 16) — chefe final

**Números:**
- vida `zHp(25)·(7 + 5·np)`: sozinho 52 392; 4 jogadores 117 882;
- a vida se divide em 30% / 35% / 35% pelas fases;
- `sz` 1,3 na fase 1 e 2,2 nas fases 2 e 3 (o tamanho por fase é mandado no `chefe`; o cliente escala a raiz e o `ZBS` próprio).

**Modelo:** fase 1, jaleco, óculos redondos, colete, pulseira sem número com `zGlow`. Fases 2 e 3: o mesmo corpo crescido, cinzento e escorrendo preto, com um **cano** (o cano-mestre) entrando no peito, que é o ponto fraco.

| Fase | Vida | Mudança |
|---|---|---|
| 1 "O Diretor" | 100–70% | no **púlpito** no meio do lago; **4 tanques do Veio** (pilares) o protegem. Com ≥ 1 tanque de pé, leva ×0,2 de dano (a barra mostra "PROTEGIDO"). Cada tanque tem vida = 6% da vida dele. Os 4 caídos (ou a vida em 70%) passam para a fase 2 |
| 2 "Número 1" | 70–35% | cai na água e volta grande; nada entre os poços; maré, onda, abraço; Afogados |
| 3 "Ainda não acabou" (vida baixa) | < 35% | luzes da arena caem (apagão local); 2 Pregadores nascem e cantam; **Coro** cura; todos os ataques anteriores com aviso ×0,8 (mínimo 0,6 s) |

| Ataque | Fases | Aviso | Ativo | Rec. | Forma | Efeito | Campo |
|---|---|---|---|---|---|---|---|
| Dose | 1, 3 | 0,6 s (3 linhas de 18 m em leque de 30°; brilho das seringas) | projéteis a 16 m/s | 0,8 s | linha ×3 | 20 + 1 dose (como o Enfermeiro) | sim |
| Chamada | 1, 3 | 1,8 s (fala `dir-chamada`) | – | – | – | 2 Enfermeiros + 4 comuns pelos poços; máx. 8 lacaios | sim |
| Corrente | 1 | 1,5 s (4 discos de 3 m nas placas do chão, azuis) | 0,5 s | – | disco ×4 | 35 | não |
| Maré | 2, 3 | 2,0 s (anel na água e som subindo) | 8 s | – | o chão baixo inteiro | o chão abaixo de y 0,5 vira Veio: 10/s e ×0,6 de velocidade; as **5 plataformas** (1,2–2 m) ficam secas | não |
| Onda | 2, 3 | 1,2 s (retângulo de 16 × 3 m) | instantâneo | 1,0 s | linha | 45 + empurrão de 5 m | sim |
| Abraço | 2, 3 | 0,8 s (o alvo mais perto a ≤ 3 m; disco no alvo) | segura 1,5 s | 1,5 s, **fraco aberto** | disco | 25/s e preso; outro jogador acertando o fraco solta na hora | sim |
| Coro | 3 | 2,0 s (fala `dir-coro`) | – | – | – | se houver ≥ 1 Pregador vivo, cura 3% da vida máxima; matar os Pregadores impede | sim |

**Fraquezas:**
1. **Tanques do Veio** (fase 1): pilares destrutíveis; são a "armadura".
2. **Junções do cano-mestre** (3 nas paredes; interativo `juncao`; HP = 4% da vida dele): destruir uma (tiro ou explosão) faz o cano no peito **romper**, e ele fica atordoado 5 s com o fraco ×3 aberto. Elas voltam inteiras na fase 3 (e podem ser rompidas de novo).
3. **Explosivos**: valem ×1 (sem desconto), mas com o teto de 6%.

**Morte:** cai na água (fala `dir-morte`). O pilar da boca com a primeira carga estoura, e começa a fuga (§4.3).

## 8. Arenas

**Regras comuns (D09, D11, D13):**
- entrada nova em `MAPS` com `zonly: 1, camp: 1`, escrita à mão com `B`/`zWall`, dentro da marca `// @@CAMP-MAPAS@@`, logo depois do `const MAPS`;
- `M.z` mínimo: `ff`, `start`, `rooms` + `floors`, `spawns`, `windows` (portões), `risers`, `doors` (as galerias da Galeria 7), `boxes` (1 lugar), `lamps`, `power` ausente (sempre ligada) e `traps` vazio;
- cada arena tem 1 Caixa, 1 máquina de munição (`ZINT.municao`, Onda 2) e **nenhuma** bebida nova; as bebidas vêm na bagagem;
- **Desempenho**: até 250 chamadas de desenho no Médio, sem sombra nova no Baixo, até 6 lâmpadas do pool;
- tema próprio (`theme`, `fog`, `sky`), sem `atmos` (o D09 confere que o `atmosBuild` aceita um mapa sem áreas).

### 8.1 Forte Velho (`MAPS.forte`) — Vigia

- **Desbloqueio**: alçapão da casamata (II.4), dentro do Castelo (I) da Vila.
- **Forma**: pátio de armas quadrado de 44 × 44 m, muralha de 6 m com ameias (fora do alcance), 4 portões fechados com grade (são as "janelas" por onde entram os zumbis e o pelotão), casamata ao sul (onde se nasce) e paiol a leste.
- **Elementos** (todos de tabela):

  | Elemento | Tipo | Quantos | O que faz |
  |---|---|---|---|
  | Torre do holofote | geometria | 1 | plataforma de 3 m no centro com 2 rampas: é a fase 2 do chefe. O jogador também pode subir (tiro de cima nos lacaios), mas fica exposto à rajada |
  | Pilares de sacos de areia | `pilar` | 6 | 1,1 m de altura (cobertura agachado), HP 1500 cada; a rajada e a granada gastam |
  | Muretas de pedra | `pilar` | 2 | 1,8 m, HP 4000 |
  | Arame farpado | zona de perigo | 2 faixas | jogador e zumbi a ×0,5 e 10/s (zumbi também: dá para puxar os lacaios por ali) |
  | Barris do paiol | `barril` da Onda 2 | 4 | 8% no chefe |
  | Gerador do holofote | `curto` | 1 | ver §7.2 |
  | Sinalizadores do muro | luz falsa | 8 | sprites aditivos; a única luz da fase 3 |

- **Rodada 10**: `toSpawn` 16 comuns (os lacaios ficam fora da conta), nascendo pelos portões.

### 8.2 Casa do Forno (`MAPS.forno`) — Foguista

- **Desbloqueio**: registro da Torre fechado (IV.3).
- **Forma**: salão de 36 × 50 m com teto de 7 m:
  - 4 fornos na parede norte (portas de ferro);
  - esteira de 3 m de largura no meio, do sul ao forno 4;
  - carvoeira elevada a leste (1,2 m, rampa de carvão);
  - poço de cinzas a oeste (zona lenta);
  - calha de carvão no alto da parede leste (de onde vêm os Carvoeiros do apito).
- **Elementos**:

  | Elemento | Tipo | Quantos | O que faz |
  |---|---|---|---|
  | Portas dos fornos | ataque do chefe | 4 | queimam os lacaios na linha da porta |
  | Válvulas de vapor | `valvula` | 4 | §7.3 |
  | Pilares de tijolo | `pilar` | 6 | HP 3000; a explosão de pressão tira 1/3 |
  | Esteira | zona móvel | 1 | 1,5 m/s para o forno 4; a boca do forno 4 dá 20/s no jogador |
  | Poço de cinzas | zona lenta | 1 | ×0,6 |
  | Barris de gás | `barril` (variante `gas`) | 2 | 8% no chefe |

### 8.3 Galeria 7 (`MAPS.galeria7`) — Ato V e Diretor

- **Desbloqueio**: o chefe 2 morto (o cano-mestre atrás do forno 3).
- **Forma**: caverna de ~80 × 80 m:
  - **anel de 3 galerias** de fora (uma por rodada, 21–23, abertas pelas portas da história; cada uma com um pilar da boca para a carga);
  - **salão central** com o lago do Veio (chão baixo), o púlpito no meio, 5 plataformas de rocha e andaime, os 4 tanques e as 3 junções do cano nas paredes;
  - **poço da gaiola** a sul (a fuga).
- **Elementos**:
  - água do Veio com o shader de água que já existe (`sfx`, Onda 1/atmosfera), sem material novo;
  - pontos de água para os Afogados (`CAMP_AGUA.galeria7`);
  - pilares das cargas (3);
  - tanques (4, `pilar`);
  - junções (3, `juncao`);
  - gaiola (`gaiola`).
- **Rodadas 21 a 24**: `max` vivos 20; ver a curva (§10).

## 9. Final e modo infinito

- **Final**: §4.3 (fuga) e `lore.md` §10.3.
  - Os créditos são uma tela de HUD (rolagem de texto) e podem ser pulados.
  - Depois dos créditos, a partida volta ao lobby e o host vê "Campanha concluída (dificuldade X) · Infinito liberado".
- **Infinito** (`zmode: 'infinito'`, Vila ou Sanatório):
  - começa na rodada 1, com 500 pontos (ou os da dificuldade), como o clássico;
  - **zumbis**: os tipos novos entram pela rodada, com a mesma curva de estreia da campanha (Penitente 6, Soldado 7, Afogado 8 onde há água, Enfermeiro 11, Contido 13, Carvoeiro 16, Pregador 18);
  - **eventos**: §5.3;
  - **chefes de campo**:
    - o Carniceiro como no clássico;
    - o **Vigia** na rodada 20, o **Foguista** na 30 e o **Diretor** na 40, nas versões de campo (só os ataques com "sim" na coluna Campo);
    - depois, um deles a cada 10 rodadas, em rodízio, com +25% de vida a cada volta;
    - nascem como o Carniceiro (raio em volta de um jogador), e a rodada não termina antes de ele morrer;
  - **recorde**: a maior rodada por mapa e dificuldade, guardada no navegador (§11) e mostrada no cartão do modo.

## 10. Curva de dificuldade

**Base** (Normal, 1 jogador, números do clássico):
- `zHp(r)`: 150, 250, 350, 450, 550 … 950 na rodada 9; 1045 na 10; ×1,1 por rodada depois;
- `zCount(r, 1)`: r1 6, r2 8, r3 13, r4 18, r5 24 … ×(r·0,15) da rodada 10 em diante;
- a dificuldade (`ZDIFF`) multiplica por cima, como hoje.

**Fatores da campanha (`CAMP_CURVA`):**
- `vidaK` e `qtdK` multiplicam o `zHp` e o `zCount`;
- o `max` vivos é o do `ZDIFF` com o `maxK` do ato.

| Ato | Rodadas | vidaK | qtdK | Vida do comum (Normal) | Zumbis na rodada (1 jogador) | maxK | Especiais novos | Eventos | Chefe | Estado esperado do jogador ao começar | Tempo esperado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| I | 1–4 | 0,9 | 0,9 | 135 → 405 | 5 → 16 | 1 | – (Veloz a partir da 4, como no clássico) | 3 Névoa | – | M1911, 500 pontos | 10–12 min |
| II | 5–9 | 1,0 | 1,0 | 550 → 950 | 24 → 34 | 1 | Penitente (6), Soldado (7), Afogado (8); Explosivo (6) | 6 Suprimento, 8 cães, 9 Apagão | – | 1 arma de parede, Energia, 1–2 bebidas, ~2000 pontos | 15–18 min |
| chefe 1 | 10 | 1,0 | 16 fixos | 1045 | 16 + lacaios | 1 | Soldado | – | Vigia, 10 450 | 2 armas, 2–3 bebidas | 3–5 min |
| III | 11–15 | 1,0 | 0,95 | 1150 → 1683 | 38 → 51 | 1 | Enfermeiro (11), Contido (13), Brutamonte (clássico, 8+) | 13 Silêncio, 14 cães, 15 Estouro | Carniceiro na 13 | arma da Caixa, Juggernog, ~4000 pontos | 18–22 min |
| IV | 16–19 | 1,05 | 1,0 | 1944 → 2587 | 58 → 68 | 1 | Carvoeiro (16), Pregador (18); Tóxico e Gritador (clássico) | 17 Inchados, 19 Relógio | Carniceiro na 18 | 1 arma com PaP, 3–4 bebidas | 18–22 min |
| chefe 2 | 20 | 1,05 | 20 fixos | 2847 | 20 + lacaios | 1 | Carvoeiro, Pregador | – | Foguista, 27 110 | 2 armas com PaP | 4–6 min |
| V | 21–24 | 1,1 | 0,8 | 3280 → 4366 | 60 → 69 | 20/24 vivos (Normal) | Afogado e Pregador em peso | 22 e 24 Névoa | Carniceiro na 23 | tudo | 16–20 min |
| final | 25 | 1,1 | 12 fixos | 4803 | 12 + lacaios | – | Enfermeiro, Afogado, Pregador | fuga = Estouro | Diretor, 52 392 | – | 6–9 min + 75 s |

**Princípios:**
- **Serrote, não rampa**: cada ato começa ~5% mais leve que o fim do anterior. O ato novo apresenta o tipo novo com só 1 na rodada de estreia e sobe até o fim.
- **A arena é mais curta e mais cheia de regra**; os comuns nela são poucos e fixos.
- **Mapa novo, vidaK igual**: a troca de mapa já é um "susto" (portas fechadas, caminhos novos). A curva não sobe na troca.
- **Teto de especiais** de ⌊n·0,5⌋, como no clássico.
- **Mais jogadores**: as fórmulas do clássico (`zCount` com np) e os chefes com `porJog`.
- **Dificuldades**: o `ZDIFF` como hoje, mais os tempos de aviso (§7.1).

**Metas medidas pelo D15** (harness com bots ou com o jogador invulnerável):
- tempo de cada ato dentro de ±30% da tabela;
- tempo do chefe com o kit do ato: Vigia 3–5 min, Foguista 4–6 min, Diretor 6–9 min (1 jogador, Normal);
- morte do time em menos de 50% das tentativas no Normal com o kit do checkpoint.

## 11. Persistência e checkpoints

**Chave no navegador** `tiroteio.campanha` (JSON, lido e gravado pelos `load`/`save` de hoje):

```js
{ v: 1,
  dif: { 0: { ato: 3, fim: false }, 1: { ato: 0, fim: false }, 2: {...}, 3: {...} }, // ato máximo liberado e campanha concluída, por dificuldade
  inf: { vila: { 1: 23 }, sanatorio: {} },                                           // recorde do infinito por mapa e dificuldade
  finalCompleto: false }
```

- Liberar um ato numa dificuldade libera o mesmo ato nas mais fáceis.
- Os documentos lidos continuam em `tiroteio.lore` (O2-C07). As notas entram na mesma lista, com o prefixo `n-`.
- **Checkpoint = começo do ato.** Quando o time inteiro cai:
  - a tela de fim mostra "Repetir o Ato N" (só o host clica; os clientes veem "Aguardando o host");
  - se o host não clicar em 15 s, a partida volta ao lobby.
  - Repetir recomeça o ato com o **kit do ato** (`CAMP_KIT`).
- **Kit do ato** (`CAMP_KIT`, dado; o D15 ajusta):

  | Ato | Pontos | Armas | Bebidas | Mundo |
  |---|---|---|---|---|
  | I | 500 (o do `ZDIFF`) | M1911 | – | – |
  | II | 2000 | M1911 + MP40 | Juggernog | Energia ligada, portas do Ato I abertas |
  | III | 3500 | Python + M14 | Juggernog | – (o mapa recomeça do zero, na Recepção) |
  | IV | 5000 | Python + Galil | Juggernog, Speed Cola | Energia desligada (ligá-la é o IV.1); portas do Ato III abertas |
  | V | 7000 | Python + STG-44 com PaP | Juggernog, Speed Cola, Quick Revive | – (o ato recomeça na entrada da Galeria) |
  | chefes | os do ato anterior + 1500 | idem | idem | arena inteira |

- **Quem libera**: no fim de cada ato o host manda `{ t: 'camp', k: 'salva', ato, dif }`. **Cada jogador** que estava na sala grava no próprio navegador (decisão: quem jogou o ato o liberou). Começar uma sala num ato depende só do salvo do **host**: o `saneSt` do host prende o `ato` ao liberado, e o cliente não manda `st`.

## 12. Multijogador

- **Até 4 jogadores**, como hoje. Tudo que é estado é do host (§1.2).
- **Quem entra no meio**:
  - **em rodada**: entra como espectador e nasce no próximo intervalo, como o "quem volta morto" do clássico;
  - **no intervalo ou na transição**: nasce com o kit do ato e com `max(kit.pontos, 50% da média dos pontos do time)`;
  - recebe o `cp` (estado da campanha: ato, objetivos, evento, NPC, chefe e fase, portador da chave) no `zWorldState`, e o `campSync` monta o HUD sem tocar a cena;
  - **numa rodada de chefe**, espera a próxima rodada (na arena, isso é a transição seguinte).
- **Quem sai**: os pontos dele saem com ele, como hoje.
  - Se era o portador da chave, ela cai onde ele estava.
  - Se só sobrou ele perto do NPC, o NPC para.
  - **Host saiu**: a partida acaba, como hoje (sem migração, ideia M3). O salvo do começo do ato permite voltar de lá.
- **Escala por jogador**:
  - vida do chefe (`porJog`), vida do NPC e do gerador (§4.3);
  - lacaios: `max` + 2 por jogador a partir do segundo.
- **Cenas**:
  - o host manda a cena e começa a contar;
  - cada cliente mostra e pode pular a sua;
  - o host não espera ninguém, a não ser na transição de mapa (`pronto`, §3.3).
- **Segurança**: tudo o que o cliente manda passa pelas conferências de hoje:
  - `use`/`hold` com distância e limitador;
  - `zhit` com arma, teto, alcance e visão, mais a zona `fraco` (§6.1) e o Silêncio;
  - o cliente nunca manda progresso de objetivo nem dano em objeto. O dano em `pilar` e `juncao` vem do `zintTiro`, que o host confere.

## 13. Dados × código

| Tabela (dado) | Conteúdo | Dono |
|---|---|---|
| `CAMP` (constantes) | `cargaMaxS`, `cenaMaxS`, tempo de repetir, limitadores | D02 |
| `CAMP_ATOS` | nome, mapa, `rod0`, `rodMin`, `rodMax`, cena de abertura e de fim, objetivos iniciais | D02 (estrutura), D10/D12/D14 (dados) |
| `CAMP_OBJ` | §4.1 | D10, D12, D14 |
| `CAMP_TRAVAS`, `CAMP_AGUA`, `CAMP_NPC`, rotas | por mapa | D10, D12, D09/D11/D13 |
| `CAMP_KIT` | §11 | D02 (estrutura), D15 (números) |
| `CAMP_EV`, `CAMP_AGENDA`, `CAMP_INF` | §5, §9 | D05, D14 |
| `CAMP_CURVA`, `CAMP_MIX` | §10, §6.2 | D02 (estrutura), D15 (números) |
| `ZKIND[7..16]`, `CAMP_ZK` | vida, velocidade, pts, tamanho, tempos e raios de cada comportamento | D06, D08 (tipos), D09/D11/D13 (chefes) |
| `CAMP_CHEFE` | fases, ataques (aviso/ativo/rec/forma/dano/efeito/campo), fraco, lacaios, `capGolpe` | D07 (estrutura), D09/D11/D13 |
| `ZINT.<tipos da campanha>` | §4.2 | dono de cada tipo |
| `MAPS.forte/forno/galeria7` | geometria e `M.z` | D09, D11, D13 |
| `CAMP_NOTA_TXT`, `CAMP_RADIO_TXT`, `CAMP_FALA_TXT`, `CAMP_CENA_TXT`, `ZINT_TERM_TXT` | `lore.md` | D04 |

**Código** (só lê tabela):
- motor de objetivos, de eventos, de fases e de ataques;
- IA de cada tipo (`campIA`), NPC, transição, HUD, cenas e persistência;
- refator de tipos;
- visual e animação procedurais.

## 14. Rede

| Mensagem | De → para | Campos |
|---|---|---|
| `{ t: 'camp', k: 'est' }` | host → todos | estado completo (no começo do ato e quando muda muito) |
| `k: 'obj'` | host → todos | `id`, `st`, `p` (no máximo 4/s por objetivo) |
| `k: 'ev'` | host → todos | `id` (com o `zround`) |
| `k: 'cena'` / `'radio'` / `'fala'` | host → todos | `id` (texto do lado do cliente, pela tabela: não vai texto pela rede) |
| `k: 'tel'` | host → todos | ataque, forma, posição, ângulo, medidas, `s`, `at` |
| `k: 'chefe'` | host → todos | `id`, `fase`, `sz`, `fracoS` |
| `k: 'pronto'` | cliente → host | fim da carga na transição (limitador: 1 por transição) |
| `k: 'salva'` | host → todos | `ato`, `dif` |
| `cn` na foto `zs` | host → todos | `[x, y, z, yaw, hp]` do NPC (só no II.3) |
| `cp` no `zWorldState` | host → quem entra | estado da campanha |

- O `onMsg` ganha 1 caso (`case 'camp': campMsg(m); break;`); o `srvHandle` ganha 1 caso para `pronto`.
- O cliente confere a forma de tudo (índice, id da tabela, números finitos), como o `zintMsg`.
- **`PROTO`** sobe **uma vez**, no fechamento da Onda 3, pelo coordenador. Mudam a foto (tipo com 5 bits, campo `cn`), as mensagens novas e os mapas novos.

## 15. Desempenho (orçamento)

| Item | Regra | Como medir |
|---|---|---|
| Vila e Sanatório na campanha | FPS médio e 1% low ≥ linha de base, dentro do ruído (±3%), na rodada equivalente (`bench.mjs --gfx medio`, com cenário `--camp 1 --rodada N`) | D15, com bench intercalado com o HEAD |
| Zumbis novos | 2 chamadas de desenho cada (como hoje); nada de luz; anel de ondas e nuvem de cal em `InstancedMesh` próprios (1 chamada cada) | contagem de chamadas no bench |
| Avisos de chefe | pool de 3 malhas instanciadas; escondidas quando não há ataque | idem |
| Arenas | ≥ 60 FPS de média no Médio e no Baixo neste PC; ≤ 250 chamadas | `bench.mjs --mapa forte` etc. |
| Eventos | Apagão e Névoa não podem custar mais (apagam luz e encurtam a névoa); Suprimento ≤ 5 caixotes; Inchados com o mesmo teto de vivos | bench com `--evento` |
| Shaders | zero compilação no meio da partida: material novo só na carga do mapa (aquecimento) | o contador do A34/B08 |
| Memória | sem alocação por quadro em `campIA`, `campAnim`, `campQuadro`, avisos e HUD (listas reaproveitadas) | profile de 60 s na horda |

## 16. Testes e validação

**Testes novos (Playwright, `node --test`, padrão `fluxos-zumbi.test.mjs`):**
1. `tests/campanha-zumbi.test.mjs`:
   - começar a campanha no Ato I;
   - cumprir cada objetivo por `__T.campForca(id)` e também pelo caminho de verdade (F no sino, defender o gerador com o jogador invulnerável);
   - transição para a arena e para o Sanatório sem erro de console;
   - bagagem levada certa;
   - checkpoint depois da morte;
   - o salvo no `localStorage`.
2. `tests/campanha-zumbis-novos.test.mjs`: cada tipo nasce na rodada de estreia; cada regra de dano (capacete, crosta, submerso, investida, levantar) com números da tabela; tipo com 5 bits na foto (cliente decodifica 7–16).
3. `tests/campanha-chefes.test.mjs`:
   - troca de fase no limite certo;
   - o aviso chega antes do dano com o tempo da tabela;
   - zona `fraco` recusada fora da janela;
   - lacaios caem quando o chefe morre e a rodada termina;
   - versão de campo no infinito.
4. `tests/campanha-eventos.test.mjs`: cada evento muda o que a tabela diz (Silêncio recusa `zhit` de arma de fogo; Relógio dispara a regra no prazo; Suprimento solta no máximo 5).
5. `tests/campanha-rede.test.mjs` (2 clientes, ideia M4): cliente vê objetivo, aviso e fase; quem entra no meio recebe o `cp`.

**Regressão do clássico** (obrigatória a cada agente):
- `tests/fluxos-zumbi.test.mjs` e `tests/interativos-zumbi.test.mjs` sem mudança;
- harness de regressão `vila`/`sanatorio`;
- bench do clássico intercalado com o HEAD.

**`window.__T` ganha:**
- `CAMP`, as tabelas;
- `campForca(objId)`, `campAto(n)`, `campEvento(id)`, `campChefe(k, fase)`;
- `campEstado()`, `campMsg`.

**Ferramentas:**
- `tools/itens/auditoria.mjs` lê os interativos da campanha pelo `zintAud` (com `CAMP.on` forçado);
- `tools/bench/bench.mjs` ganha `--camp`, `--rodada`, `--evento` e `--mapa forte|forno|galeria7` (com a Frente E).

**Fotos:** cada tipo novo e cada chefe em cada fase, nos 3 gráficos, e as 3 arenas.

**Revisor (D16):** lore × registro de números, regras de dano × tabela, clássico intacto, desempenho.

## 17. Ordem dos agentes de implementação

**Como o §3 do `interativos.md`:**
- cada agente trabalha numa cópia do `index.html`, só nos **blocos próprios**, e entrega um diff que o coordenador junta com o `integra2.py`;
- ganchos em código de outra frente são **de uma linha**, listados na tabela, e combinados antes com o dono (Frente A para o servidor e os zumbis no cliente, Frente C para o `srvZUse` e o ZINT, Frente B para o menu);
- no máximo **3 ao mesmo tempo**.

**Marcas** (o D02 cria todas, vazias, numa seção nova `// ===== O3: campanha =====` logo depois do fim do bloco `@@INTERATIVO-5@@`; a `@@CAMP-MAPAS@@` fica logo depois do fechamento do `const MAPS`):

| Marca | Dono |
|---|---|
| `// @@CAMP-MAPAS@@` | D09, D11, D13 (cada um põe o seu `MAPS.<arena> = ...` em sequência) |
| `// @@CAMP-BASE@@` | D02 |
| `// @@CAMP-TIPOS@@` | D03 (helpers do refator) |
| `// @@CAMP-LORE@@` | D04 |
| `// @@CAMP-EV@@` | D05 |
| `// @@CAMP-ZK-1@@` | D06 |
| `// @@CAMP-CHEFE@@` | D07 |
| `// @@CAMP-ZK-2@@` | D08 |
| `// @@CAMP-CHEFE-1@@` | D09 |
| `// @@CAMP-ATO-1@@` | D10 |
| `// @@CAMP-CHEFE-2@@` | D11 |
| `// @@CAMP-ATO-2@@` | D12 |
| `// @@CAMP-CHEFE-3@@` | D13 |
| `// @@CAMP-ATO-3@@` | D14 |

| Leva | Agente | Domínio (blocos próprios) | Ganchos de uma linha fora dos blocos | Roda junto com |
|---|---|---|---|---|
| 1 | **D02 base da campanha** | estado `CAMP`; motor de objetivos (§4.1) com os alvos falsos; HUD de objetivo e seta; painel de rádio/fala/cena (texto por id, sem os textos); transição de mapa com bagagem e `pronto`; persistência e checkpoint; menu (`zmode`/`ato`) e `saneSt`; `campMsg`/`cp`; tipos ZINT `gerador`, `alcapao`, `registro`, `carga`, `chave`, `gaiola` (sem posições); `zAbrePorta`; as marcas | `zStartGame` (`campInicio`), `zStartRound` (`campRodada`), `zEndRound` (`campFimRodada`), `zCheckOver`, `zWorldState`/`zSyncWorld` (`cp`), `onMsg`/`srvHandle` (`camp`), `zHud` (`campHud`), `zRoundFx`, `zHurt` (alvo falso), escolha de alvo (`campAlvos`), `zFlowStart` (`campFontes`), `srvZUse` `door` (trava `camp:` e `zAbrePorta`), `matchForm`/`saneSt` | D03, D04 |
| 1 | **D03 refator de tipos** (precisa do OK da Frente A) | `ZKIND[k].chefe` e números do Carniceiro na tabela; `Z.mix` com o tamanho do `ZKIND`; tipo com 5 bits (`zSnap`/`zNewClientZombie`); os ganchos `campTipo`, `campNasce`, `campStatus`, `campIA`, `z.cv`, `campDano`, `campMorte`, `campZhitOk` e a zona `fraco` (§6.1), todos devolvendo na hora no clássico | só nas funções da Frente A listadas no §6.1; prova de que o clássico não muda: os 7 testes + harness + bench | D02, D04 |
| 1 | **D04 lore em jogo** | troca do `ZINT_TERM_TXT` (`lore.md` §7); tipo ZINT `nota` (visual de papel, 3 variantes, mesma janela do terminal); tabelas `CAMP_NOTA_TXT`, `CAMP_RADIO_TXT`, `CAMP_FALA_TXT`, `CAMP_CENA_TXT`; som da estática do rádio, do apito ao longe e do coro (síntese) | nenhum (o painel do terminal já existe; o de rádio e cena é do D02) | D02, D03 |
| 2 | **D05 eventos especiais** | `CAMP_EV`, `CAMP_AGENDA` e `CAMP_INF` (só eventos); regras no host; visual no cliente (luzes, névoa, caixote, manômetro); banner | usa os ganchos do D02/D03; 1 linha no `visApply`/`zFogDog` para o Apagão e a Névoa (combinar com a Frente B) | D06, D07 |
| 2 | **D06 zumbis da Vila** | Penitente, Soldado e Afogado (7–9): `ZKIND`, `CAMP_ZK`, modelo (`campModelo`), animação (`campAnim`), IA (`campIA`), sons, nuvem de cal e anel de ondas instanciados, `CAMP_AGUA.vila` | `zLook`/`zBuildModel`/`zAnimHuman`/`zBoxes` (1 linha cada, combinado com a Frente A) | D05, D07 |
| 2 | **D07 base dos chefes** | `CAMP_CHEFE` (estrutura); fases; sorteio e envio dos ataques; pool de avisos (3 malhas); dano por forma; fraco; lacaios; barra; versão de campo; tipo ZINT `pilar` e `juncao` (genéricos) | `zKill` do chefe (fim da rodada de chefe), o `bo` do `zSnap` | D05, D06 |
| 3 | **D08 zumbis do Sanatório** | Enfermeiro, Contido, Carvoeiro e Pregador (10–13), e a elite da chave; projétil da seringa (pool); brasa no chão (pool) | como o D06 | D09, D10 |
| 3 | **D09 Forte Velho + Vigia** | `MAPS.forte`; tipo 14; ataques; tipo ZINT `curto`; posições dos pilares e barris; rodada 10 | `@@CAMP-MAPAS@@` | D08, D10 |
| 3 | **D10 atos da Vila** | `CAMP_ATOS[0..1]`, `CAMP_OBJ` I e II, rotas e portas, NPC Nogueira (rota, visual, pistola), posições do gerador, alçapão e notas da Vila; agenda das rodadas 1–9 | nenhum | D08, D09 |
| 4 | **D11 Casa do Forno + Foguista** | `MAPS.forno`; tipo 15; `valvula`; esteira; rodada 20 | `@@CAMP-MAPAS@@` | D12, D13 |
| 4 | **D12 atos do Sanatório** | `CAMP_ATOS[2..3]`, `CAMP_OBJ` III e IV, travas, elite e chave, registro, notas do Sanatório; agenda das rodadas 11–19 | nenhum | D11, D13 |
| 4 | **D13 Galeria 7 + Diretor** | `MAPS.galeria7`; tipo 16 com escala por fase; tanques, junções, maré, plataformas; rodadas 21–25 (arena) | `@@CAMP-MAPAS@@` | D11, D12 |
| 5 | **D14 Ato V, final e infinito** | `CAMP_ATOS[4]`, cargas, fuga, créditos, `c5-final-completo` (contagem dos documentos), desbloqueios, modo infinito (`CAMP_INF`: estreias, chefes de campo, recorde) | nenhum | D15 |
| 5 | **D15 balanceamento e medição** | números de `CAMP_CURVA`, `CAMP_MIX`, `CAMP_KIT`, vidas e tempos (sem mexer em código); cenário de bench e testes do §16 (com a Frente E) | só `tests/` e `tools/bench/` | D14 |
| 6 | **D16 revisor** | revisão completa (§16) e correções pequenas pedidas ao dono de cada bloco | – | sozinho |

**Depois de cada agente:**
- `node --check`;
- `pnpm test` (os novos e os do clássico);
- `auditoria.mjs` nos mapas que ele tocou;
- harness de regressão;
- bench intercalado com o HEAD (clássico e a parte da campanha que ele fez);
- fotos.

## 18. Riscos e perguntas para o dono

**Decisões tomadas aqui, para confirmar:**
1. A campanha **atravessa** Vila e Sanatório, com 3 arenas em **mapas pequenos à parte** (§3.1). A alternativa (arena dentro de cada mapa) pesa no clássico e mexe nos índices de rede.
2. **Portas da história de graça** (§3.4), mas os interruptores das alas (IV.2) continuam pagos (500/500/1000) para que os pontos ainda importem. Pode ser tudo grátis.
3. **Bagagem completa** entre mapas (§3.3) e **kit fixo** no checkpoint (§11).
4. **Salvo por dificuldade, local**. Cada jogador da sala libera o ato que jogou, e o host decide o que a sala pode começar (§11).
5. **25 rodadas, ~2 h**. Dá para encurtar tirando uma rodada de cada ato (20 rodadas, ~1h30).
6. **Tipos e chefes novos só na campanha e no infinito** (o clássico fica como está).
7. **Hora do Silêncio** bloqueia arma de fogo e explosivo de verdade no host (§5.1).
8. **Final completo** com os 22 documentos somados da sala (`lore.md` §10.3).
9. O Carniceiro ganhou nome e história (Fermino, o magarefe) e a fala `carn-entrada`, que pode valer também no clássico.

**Riscos:**
- **Refator de tipos (D03)**: mexe em ~13 lugares da Frente A; é o único ponto em que o clássico pode mudar. Mitigação: só renomear a condição, com os números iguais na tabela e prova pelos 7 testes, pelo harness e pelo bench.
- **Troca de mapa no meio da partida**: o caminho `match` → `buildMap` → `zStartGame` existe, mas nunca foi usado com estado guardado. Riscos de vazar estado antigo (`ZC`, pools, `MAPA_FRESCO`, `MAPA_CLI`, recorte, B05) e de alguém entrar no meio da carga. O D02 testa as 4 transições em sequência e mede a memória (sem crescer a cada troca, como o B22 mediu).
- **NPC de escolta** sem física (cinemático na rota): a rota precisa de conferência de linha livre (ferramenta do D10) e de altura do chão. Se a Vila mudar a geometria, a rota quebra: o teste de escolta pega isso.
- **Arena sem `atmos`**: conferir que `atmosBuild`, `B02`, `B05`, `B10` e `ATMOS_POST` aceitam um mapa novo sem entrada própria.
- **Bits da foto**: conferir que nada usa os bits 11+ do `f` antes do D03.
- **Tamanho do `index.html`**: ~6 a 8 mil linhas a mais (estimativa: 3 arenas ~1500, chefes ~1800, tipos ~1500, base ~1500, lore ~400, eventos ~600).
