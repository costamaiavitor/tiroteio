# 10 — Integridade do cliente

Auditoria de 02/10/2026 na branch `security-hardening` (`index.html`, 8565 linhas). Área: ofuscação, verificação de integridade, proteção contra edição local e detecção de valores impossíveis **no host**.

**Premissa**: o cliente roda no navegador do jogador e é sempre editável (DevTools, extensão, proxy, cópia local do HTML hospedada em outro lugar). O DataChannel vai cifrado por DTLS, então não dá para alterar mensagens "no fio", mas o atacante não precisa disso: no próprio navegador ele pode trocar `RTCDataChannel.prototype.send` ou servir uma cópia editada do `index.html`. O escopo do módulo (`<script type="module">`) só esconde as variáveis do console, não da edição do arquivo. Logo, as únicas defesas reais são as conferências no host; as camadas abaixo são extras e foram avaliadas com esse realismo.

---

### [G1] Ganchos de depuração `window.__T`, `__simLock` e `__simNow` expostos em produção
- Arquivo e linha: `index.html` l. 8560–8562 (`window.__T`), l. 8492 e 8502 (`__simLock`/`__simNow` no worker e no `frame`), l. 8510 (`tick`).
- Descrição: `__T` expõe o estado do servidor (`S`, `Z`), `sendToHost` (chama `srvHandle('h', m)` direto no host), `zHit`, `zStartRound`, `zHurt`, `grantAllSkins`, `PROF`, `W` (referência viva: `T.W.ak47.dmg = 9999`) e `sim(seg)`. `sim` liga `__simLock` e chama `tick(dt)` em laço com `now` manual. Confirmado no código: no **host**, `tick` chama `srvTick(dt)` (l. 8511), que move zumbis, fecha rodadas e emite `srvState` a cada 0,25 s simulados — `T.sim(60)` avança a partida de **todos** 60 s de uma vez (240 `state` + `zs` em rajada). No **cliente**, `sim(60)` roda `updateMe`/`sendPos` 60 s e manda 1800 `pos` com `ts` crescente que o host aceita (só rejeita `ts` menor que o anterior, l. 5288). Está disponível para qualquer pessoa no console do site publicado.
- Cenário de exploração: jogador abre o console no GitHub Pages e chama `__T.sendToHost({t:'zhit', ...})` em cadência, `__T.grantAllSkins()`, ou, sendo host, `__T.Z.insta = 1e9`, `__T.zHit(...)`. Nada disso dá poder que a edição local do arquivo já não desse, mas baixa a barra de "editar HTML" para "colar uma linha".
- Severidade: Baixa
- Correção sugerida: expor os ganchos só em desenvolvimento: `if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || new URLSearchParams(location.search).has('dev')) window.__T = ...` (os testes usam `http://127.0.0.1:PORTA`, `tests/servidor.mjs` l. 1, então continuam funcionando; `ARMS_VER` l. 3699 já testa só `'localhost'` — incluir os dois). `__simLock`/`__simNow` ficam dentro do mesmo bloco (hoje são lidos em todo quadro). Não muda a experiência. A conferência de velocidade de G3 deve usar o relógio do **host** justamente para que `sim()` num cliente não compre deslocamento.

### [G2] Sem `__T` o vetor continua sendo a cópia local do arquivo (não há integridade verificável)
- Arquivo e linha: `index.html` todo; `join` l. 5206 (`v: 2`), `srvOnData` l. 5252.
- Descrição: não existe build, SRI no HTML principal (não se aplica), CSP, nem qualquer prova de que o cliente roda o código publicado. O host não tem como distinguir um cliente honesto de um `index.html` editado servido de `file://` ou de outro domínio (o PeerJS aceita qualquer origem). Isso é inerente ao modelo e não tem correção técnica; registra-se para fixar que **tudo** o que chega de um cliente é entrada não confiável, inclusive campos "internos" como `z` (zona), `dmg`, `sp`, `c` (agachado) e `ts`.
- Cenário de exploração: atacante baixa o HTML, troca `RUN = 6.4` por `20`, `w.head` por `100`, remove `a.mag--` em `shoot` (l. 4705) e abre a cópia local; entra na sala com o código normal.
- Severidade: Baixa (informativo; o risco real está medido em G3–G6)
- Correção sugerida: nenhuma camada no cliente; tratar como premissa. Ver G8 para a verificação de versão entre clientes **honestos** e G9 sobre ofuscação.

### [G3] `pos` aceita qualquer velocidade, altura e posição (teleporte, voo, fora do mapa)
- Arquivo e linha: `srvHandle` `case 'pos'` l. 5285–5291; constantes l. 460–461 (`GRAV 22, JUMP_V 7.3, RUN 6.4, PR .34, STEP .5`); velocidades reais em `updateMe` l. 4847–4859; deslize l. 4834 e 4856; bote da faca l. 4751; `zPush` l. 6667–6676; `moveBody` l. 2354.
- Descrição: o host só exige vetor finito com |x| < 1e4 (`vec3`, l. 5280) e `ts` não decrescente. A única noção de velocidade é `p.fastT` (> 3,5 m/s), usada apenas para liberar o PhD, e calculada com o `dt` do **relógio do cliente** (`m.ts - ts0`), que o cliente controla. Não há conferência de distância entre mensagens, de chão sob os pés, de "dentro de um colisor" (`blockedAt`, l. 2351, existe e roda no host) nem de "dentro do mapa" (`zRoomAt`, l. 7100, já é usada para a Claymore). Velocidades máximas legítimas lidas do código: CS 6,4 m/s (RUN × `speed` 1); Zumbis correndo com Stamin-Up 6,4 × 0,8 × 1,07 × 1,45 = **7,94 m/s**; deslize começa em 3,5 + 6 = **9,5 m/s** e cai a 3,5 em 0,6 s; bote da faca até (3,4 − 2,2 + 0,3)/0,18 ≈ **8,3 m/s** por 0,18 s; `zPush` desloca até 0,62 m num quadro; degrau 0,5 m instantâneo. Vertical: pulo 7,3 m/s → altura máxima 7,3²/(2 × 22) = **1,21 m**; queda sem limite (de 25 m chega a ~33 m/s). Em `moveBody` nada impede um `pos` com y = 50.
- Cenário de exploração: (a) **invencível no Zumbis**: enviar y = p.pos[1] + 3: `zTryAttack` só machuca com `|dy| < 1,5` (l. 7236, 7241) e a explosão do Explosivo com `|dy| < 1,6` (l. 7247); os zumbis ficam "unreach" (l. 7229) e o jogador continua atirando (o `zhit` não olha a posição, G4). (b) Fora do mapa: `zFlowStart` (l. 6916) não acha célula → zumbis sem caminho. (c) Teleporte/speedhack em CS/DM e ESP implícito (as posições de todos chegam a todos). (d) Com `T.sim(60)` no cliente (G1) o deslocamento de 60 s chega num instante com `ts` plausível.
- Severidade: Alta
- Correção sugerida (recusar a mensagem e contar, nunca "corrigir" a posição: o host não simula jogadores e um rubber-band puniria quem tem lag):
  1. **Balde de distância horizontal por jogador, no relógio do host** (mesmo mecanismo da cadência do `zhit`, l. 5309): reabastece a `VREF` m/s e guarda até `VREF × 1,5` m; cada `pos` consome `hypot(dx, dz)`. `VREF` = 14 m/s no Zumbis (1,5× o pico do deslize, 1,75× a corrida) e 10 m/s em CS/DM (1,55× RUN), teto 21 m / 15 m. Justificativa da folga: rajada de 1,5 s de mensagens após soluço da rede passa inteira; teleporte de 30 m e velocidade sustentada acima de 14 m/s não passam. Usar o relógio do host (`now`), não `m.ts`: `ts` é do cliente e vale só como ordenação. Zerar o balde em `srvSpawn` (l. 5375: já reseta `posTs`).
  2. **Subida**: balde vertical só para `dy > 0`: 8 m/s, teto 12 m (cobre pulo de 1,21 m, degraus de 0,5 m e escadas/rampas a 45° na corrida). Pega o "y = 50" de uma vez e o voo sustentado.
  3. **Chão sob os pés** (1×/s por jogador, não por mensagem): `trace(new V3(x, y + .1, z), DOWN, 3, null)` com `COL` do host. Sem apoio a até 3 m por mais de 0,8 s **e** sem queda de ≥ 2 m nesse período → anomalia (não recusar: lugares altos legítimos existem, l. 7229). Depois de 0,8 s no ar sem apoio a gravidade já teria descido 7 m.
  4. **Dentro do mapa**: no Zumbis, `zRoomAt(x, z) === null` → recusar (margem 0: as salas são retângulos e o jogador fica ≥ PR da parede). `ffCell(x, z) < 0` (l. 6910) → recusar nos dois modos que têm `ff`. **Não** usar `FF.walk` como "célula andável": `zBuildWalk` (l. 6901) pinta bloqueada toda célula a ≤ 0,45 m de um colisor, então quem encosta na parede honestamente está em célula "não andável" — daria falso positivo a cada esquina.
  5. **Dentro de parede**: `blockedAt(x, y + .3, z, H_CROUCH)` verdadeiro → contar como anomalia (noclip); recusar só se repetir 3× seguidas (step-up e agachar na borda produzem um quadro de sobreposição legítimo).
  6. O campo `c` (agachado) altera a hitbox que os outros clientes usam (`hitboxes`, l. 2401, via `rp.crouch`): hoje não há como conferir; baixo impacto, só registrar.
  Muda a experiência: quem tem lag forte (> 1,5 s de fila) verá o próprio avatar "parar" para os outros até a rede normalizar, em vez de teleportar; é o mesmo que já acontece visualmente hoje.

### [G4] `zhit` sem distância, linha de visão nem estado do zumbi; estatística de headshot e dano no teto não observadas
- Arquivo e linha: `srvHandle` `case 'zhit'` l. 5300–5318; `trace` no cliente com alcance 250 m l. 4714; `zCands` l. 6503 (lista todo zumbi não morto, inclusive `rise`/`out`); nascimento l. 7138 e 7162 (`st = 'rise'`, y de −1,8 a 0 em 1,6 s); `losClear` l. 2417 (já usada no host em `srvZFx` l. 7502 e `zChain` l. 7301); `zBoxes` l. 6494.
- Descrição: o host confere arma na mão, teto de dano (`cap` = dmg × head × pellets × 1,1 + splash, l. 5305), cadência (balde, l. 5309) e número de alvos (l. 5311–5314) — boa base. Falta: posição do jogador em relação ao zumbi (só a facada tem distância, l. 5306), linha de visão, e o estado do zumbi: um zumbi em `rise` com `P.y = −1,8` está inteiro abaixo do chão e mesmo assim `Z.zs.get(+m.v)` o devolve. Como o cliente recebe a posição de todos os zumbis em `zs` (l. 7566), o "wallhack" é implícito: basta mandar `zhit` para qualquer id. Também não há estatística: `z: 'head'` em 100 % dos tiros, ou `dmg` sempre igual ao teto, passam sem registro.
- Cenário de exploração: cliente modificado itera `ZC.zs` e manda `zhit` com `z: 'head'` e `dmg = cap` para cada zumbi, respeitando o balde de cadência (o host informa o `rate` em `W`); mata a rodada inteira de dentro da sala inicial, inclusive zumbis que ainda nem saíram do chão, sem gastar munição (G6). Pontos → Pack-a-Punch → XP (o XP é calculado no cliente, outra auditoria).
- Severidade: Média (cooperativo: afeta pontos, placar e XP, não a vida de outro jogador)
- Correção sugerida:
  1. **Estado**: recusar quando `z.st === 'rise' && z.body.pos.y < −1,0` (com y ≥ −1,0 a cabeça, caixa 1,44–1,84 acima de P.y, já está visível: tiro legítimo). Zumbi `out`/`tear`/`climb` (atrás da janela) é alvo legítimo no CoD: manter.
  2. **Distância**: o cliente traça até 250 m (l. 4714), então "alcance da arma + 10 m" não existe como regra do jogo; usar 260 m como teto absoluto (pega só o absurdo) e deixar o filtro real para a LOS.
  3. **Linha de visão** só para acerto direto (`sp = 0`, armas sem `chain`/`frost`/`thunder`): `losClear(olho, alvo)` com olho = `p.pos + (0, EYE_STAND ou EYE_CROUCH, 0)` e alvo testado em 3 pontos (cabeça `P.y + 1,6`, tronco `P.y + 1,1`, pés `P.y + 0,4`, com `zBoxes` para cão/rastejante); aceitar se **qualquer** um estiver livre. Margem para latência: testar também contra a posição do zumbi de ~150 ms atrás (guardar `z.prev` no `zTick`) — o cliente mira no que viu. Se ambas falharem: recusar e contar. `losClear` ignora caixas `ns` e só considera `smokes` (CS), então não há falso positivo por fumaça no Zumbis. Custo: um `rayBox` por colisor por tiro; no mapa grande (grade 488 × 488) usar `colQuery` como `blockedAt` faz, ou limitar a LOS a tiros com distância > 6 m.
  4. **Splash** (`sp = 1`): sem LOS do jogador; exigir que o zumbi esteja a ≤ `splash.r + 2` m de **algum** zumbi acertado diretamente no mesmo tiro ou de um ponto de impacto enviado em `shot` (`m.e`); hoje `sp` é só um bit livre.
  5. **Estatística** (marcar, nunca recusar): por jogador e arma, `hs/hits`; com ≥ 40 acertos e proporção > 0,95 em arma que não é escopeta → anomalia. `dmg ≥ cap × 0,999` → anomalia imediata: o teto tem ×1,1 e o `rm` por distância (l. 4718) impede um tiro honesto de chegar nele.
  Muda a experiência: nada perceptível em jogo honesto; LOS com margem de 150 ms cobre ping até ~300 ms (TURN).

### [G5] `hit` (CS/DM) sem LOS, distância, cadência nem munição; dano até 500 por mensagem
- Arquivo e linha: `srvHandle` `case 'hit'` l. 5327–5331; `srvDamage` l. 5343–5352; `knifeAttack` l. 4752–4762 (faca: 40/65, costas 90/180); `remoteCands` l. 4688.
- Descrição: o único limite é `clamp(dmg, 0, 500)` e a janela de 0,6 s depois de morrer. Não confere a arma contra o inventário (`isW` aceita qualquer id de `W`, inclusive `l96` com `dmg 900` e `thundergun`), cadência, distância, LOS, nem se a vítima está na mesma... o alvo `m.v` é livre. A AWP (115 × head 4 = 460) é a única arma que chega perto de 500; qualquer pistola com `dmg: 500, z: 'head'` mata com um `hit`.
- Cenário de exploração: mata-mata: loop `for id of C.players` → `sendToHost({t:'hit', v: id, dmg: 500, z:'head', w:'awp'})` a cada 100 ms, de qualquer lugar do mapa, sem atirar (`shot` é cosmético, G6). Toda a sala morre em um segundo, para sempre, por um jogador anônimo (G7, G10).
- Severidade: Alta (PvP: decide a partida dos outros)
- Correção sugerida (recusar + contar):
  1. **Arma e teto**: `w` deve ser `p.inv.primary`, `p.inv.secondary` ou `knife` (como o `zhit` já faz, l. 5304); `cap = wd.dmg × (wd.head || 4) × (wd.pellets || 1) × 1,1` (faca: 180); `dmg = clamp(dmg, 0, cap)` em vez de 500.
  2. **Cadência**: o mesmo balde do `zhit` (`gap = rate × 0,6`, folga de 0,5 s, l. 5309), por jogador; `nova` tem `pellets 9` numa mensagem só, então o balde é por tiro, não por bago.
  3. **Distância e LOS**: faca ≤ 2,2 + 2,3 = 4,5 m (deslocamento da vítima + ping, igual ao l. 5306); armas de fogo: `losClear(olho do atacante, vítima)` em 3 pontos (`hitboxes`, l. 2401) contra a posição **atual** e a de ~200 ms atrás da vítima (anel de 8 posições por jogador gravado no `case 'pos'`: compensação de lag mínima; sem isso, quem tem 250 ms de ping perde tiros legítimos em alvo que virou a esquina). Vítima deve estar `alive` e, no modo rounds, do outro time (já existe em `srvDamage`).
  4. **Estatística** como em G4 (headshot > 95 % com ≥ 30 acertos; `dmg ≥ cap × 0,999`).
  Muda a experiência: a compensação por anel de posições é o que define a folga; com 200 ms cobre ping típico, e acima disso (TURN, ~300 ms) alguns tiros em alvo correndo lateralmente serão recusados — aceitável, e é melhor do que nada. Comunicar como "o host valida acertos".

### [G6] Munição e cadência de `shot` não existem no host; `shot` é repassado sem limite
- Arquivo e linha: `srvHandle` `case 'shot'` l. 5296–5300; `shoot` l. 4700–4707 (`a.mag--`, `G.nextFire`); recarga l. 4786–4793 (nunca é comunicada ao host); `W[w].mag/res/reload` l. 465–547.
- Descrição: a munição vive só em `G.ammo` no cliente. O host não recebe `reload`, então não consegue saber quando o carregador foi trocado; `shot` só valida a forma (vetores finitos, até 12 pontos) e faz `broadcast` para todos. `zhit`/`hit` não exigem um `shot` correspondente. Resultado: um cliente editado tem munição infinita e cadência livre em `shot` (o `zhit` tem balde; o `hit` não, G5).
- Cenário de exploração: (a) remover `a.mag--` e `G.nextFire` em `shoot`: tiro contínuo sem recarga; o `zhit` do host corta o excedente pelo balde, mas a cadência nominal (ex.: `rpk` 100 balas a 11/s) já é o teto e nunca mais há 4,5 s de recarga. (b) Flood: `shot` com 12 vetores a 1000/s, repassado a N jogadores — amplificação ×N no host, que também é o jogador mais sensível a travar.
- Severidade: Média
- Correção sugerida:
  1. **Cadência de `shot`**: mesmo balde do `zhit` (`gap = rate × 0,6`, folga 0,5 s), por jogador e arma; excedente é descartado silenciosamente (não repassado) e contado.
  2. **Pontos por tiro**: `e.slice(0, wd.pellets || 1)` em vez de 12 — poupa o broadcast.
  3. **Munição inferida** (contar, não recusar, até ganhar confiança): o host conhece o inventário e `W[w].mag`; por arma, `p.mag[w]` começa em `mag` no spawn/compra/caixa/parede e decrementa a cada `shot`/`zhit`; quando chega a 0, o próximo tiro só é aceito após `reload × 0,8` s (folga: `reload` é fixo no cliente; Speed Cola ×0,5 — usar `p.perks.includes('speed')`). Reabastece em `max` (Munição Máxima, `zDrop`), compra na parede (`srvZUse`) e Pack-a-Punch, todos decididos pelo host. O que o host não vê: recarga parcial antes de esvaziar — por isso o modelo é "tiros desde o último evento de reabastecimento ≤ mag + res", que é um teto, e não uma contagem exata. Tiros acima de `mag + res` por ciclo → anomalia.
  Muda a experiência: nada em jogo honesto, porque é um teto; o item 1 só corta o que a arma não dispararia.

### [G7] Identidade: reentrada e chat pelo nome; nomes repetidos permitidos
- Arquivo e linha: `srvOnData` l. 5250–5263 (`S.left.get(name)`, herda `money`, `inv`, `kills`, `hs`, `downs`, `revives`); `srvDrop` l. 5272 (`S.left.set(name, ...)`); `zStartGame` l. 6981; `nameOf` l. 3425; chat l. 7752; nenhuma checagem de nome repetido no `join`.
- Descrição: a única identidade do jogador é o `pid` sequencial dado pelo host **e** o nome livre que ele declara. A reentrada (até 5 min, "mesmo nome") devolve pontos, armas, perks... pelo nome: quem entrar com o nome de quem saiu herda tudo. Dois jogadores podem ter o mesmo nome ao mesmo tempo; no chat e no feed aparecem iguais (`nameOf` por `id`, mas o texto é o mesmo), e o `S.left` por nome é sobrescrito pelo último a sair. Também não há limite de jogadores, então o impostor nem precisa esperar vaga.
- Cenário de exploração: jogador vê no feed "Vitor saiu" (l. 5276, `info` para todos) e entra como "Vitor" em menos de 5 min: recebe os 30 000 pontos, a Ray Gun PaP e os perks. Ou entra com o nome do host e escreve no chat em nome dele.
- Severidade: Média
- Correção sugerida (sem mudar a reentrada legítima):
  1. **Token de sessão**: no cliente, `tok = localStorage['tiroteio.rejoin.' + code]` ou `crypto.randomUUID()` gravado na hora de entrar (por código de sala, com `at`; `localStorage` e não `sessionStorage` para que abrir outra aba ou fechar o navegador ainda recupere; apagar após 10 min). Enviar `tok` no `join`. No host, `S.left` passa a ser chaveado por `name + '\0' + tok` e só casa se **nome e token** baterem; `tok` ausente ou inválido (`/^[0-9a-f-]{36}$/`) = sem recuperação, nunca erro. Nunca usar o `uid` do Firebase como token (vazaria a conta para o host).
  2. **Nome repetido**: no `join`, se já existe `p.name === name` ativo, o host acrescenta ` (2)`, ` (3)` (como `syncBots` faz com os bots, l. 5389) — muda só o rótulo do segundo, e o `S.left` continua funcionando porque o token diferencia.
  3. **Chat**: prefixar com a cor do jogador já acontece (`colorOf`); com o item 2 o nome vira único na sala.
  Muda a experiência: quem apagar o armazenamento do navegador entre sair e voltar perde a recuperação (hoje recupera); raro e aceitável.

### [G8] Versão de protocolo: só `v: 2` no `join`, sem conferência de versão entre host e clientes
- Arquivo e linha: `joinRoom` l. 5206 (`v: 2`); `srvOnData` l. 5252 (`conn.v = +d.v || 1`); `srvState` l. 5540 (único uso: `state` enxuto); `onMsg` l. 7601 (sem `default`: tipo desconhecido é ignorado em silêncio).
- Descrição: `v` só escolhe o formato do `state`. Host e clientes em revisões diferentes do `index.html` (GitHub Pages com cache, aba aberta há dias) jogam juntos com tabelas `W`, `MAPS`, preços e mensagens divergentes: o cliente antigo calcula dano com `W` velho, o host corta pelo `cap` novo, mapas com colisores diferentes dão "atravessou a parede" para um e não para o outro. Um cliente **modificado** pode declarar qualquer `v`, então isso não é segurança; é higiene contra mistura honesta.
- Cenário de exploração: não é exploração; é confusão: um jogador com a versão antiga aparece "trapaceando" (atravessa a porta que no mapa novo mudou de lugar) e as conferências de G3–G5 acusam anomalias em quem está honesto.
- Severidade: Baixa
- Correção sugerida: constante `PROTO = 3` (número inteiro, subido à mão a cada mudança de mensagem, `W` ou `MAPS`) enviada no `join` (`pv`) e devolvida no `welcome`; divergência → host responde `{t:'err', txt:'Versão diferente da do host: recarregue com Ctrl+F5'}` e fecha a conexão, e o cliente mostra isso no `#joinStatus`. Um "hash do protocolo" calculado de `JSON.stringify(W) + Object.keys(MAPS)` dispensa lembrar de subir o número e pega edições ingênuas de `W` numa cópia local (não as deliberadas: quem edita o arquivo também edita o hash enviado). Vale pelo custo (10 linhas); não vender como anti-trapaça.

### [G9] Ofuscação / minificação do `index.html`
- Arquivo e linha: `index.html` inteiro; `mapa_sistema.md` §1 (sem build, bundler ou lint).
- Descrição: o código é legível e comentado em português. Isso facilita encontrar `a.mag--` ou `RUN`, mas não é o que torna a trapaça possível. Quem ataca não precisa ler o código: o formato das mensagens é observável trocando `RTCDataChannel.prototype.send`/`JSON.stringify` por uma extensão, e três.js/PeerJS continuam com nomes públicos. A ofuscação é revertida pelo "Pretty print" do DevTools e por qualquer desofuscador em minutos; a minificação quebraria o fluxo do projeto (arquivo único editado à mão, sem build nem CI) e os números de linha usados nesta auditoria e nos testes.
- Cenário de exploração: inalterado com ou sem ofuscação.
- Severidade: Baixa (recomendação: **não** ofuscar nem minificar)
- Correção sugerida: alternativas baratas que valem: (1) G1 (ganchos só em dev); (2) `Object.freeze` em `W`, `ZWEAP`, `ZPK` e nas entradas de `MAPS` depois de montadas — não impede a cópia editada, mas elimina a edição ao vivo via `__T.W` (único caminho de dentro do módulo) e pega bug acidental; (3) um cabeçalho com a versão/hash exibido no menu, para que o host saiba o que cada um está rodando (G8). Se um dia houver build (ex.: para SRI dos CDNs), minificar passa a ser de graça, mas ainda sem ganho de segurança.

### [G10] Sem contador de anomalias, sem aviso ao host e sem expulsão manual
- Arquivo e linha: `srvHandle` l. 5283 (todo `return` silencioso); `srvDrop` l. 5268 (único caminho de saída: só por timeout ou erro de conexão); `mapa_sistema.md` §6 ("não há papel de administrador, moderação, kick ou ban").
- Descrição: as conferências que existem (`zhit` cap e balde, `nade`, `zclay`) só descartam a mensagem; nada é registrado, o host nunca fica sabendo e não tem como tirar alguém da sala. Com as regras de G3–G6 isso vira essencial: recusar em silêncio é certo (não dá pistas ao trapaceiro e não pune lag), mas sem contagem e sem um botão para o host, uma sala invadida só termina quando o host fecha a aba.
- Cenário de exploração: jogador anônimo (G7) entra, mata todos (G5) ou se torna invencível (G3); a sala não tem resposta além de acabar.
- Severidade: Média
- Correção sugerida (política conservadora):
  1. `p.anom = { n: 0, by: {}, last: 0 }`; cada recusa de G3–G6 chama `srvAnom(p, 'pos:vel')`: `n++`, `by[k]++`, decaimento de 1 ponto a cada 30 s de jogo (um jogador honesto com rede ruim acumula 1–2 por minuto e nunca sobe).
  2. Limiares: **5 em 60 s** → `sendTo(host, {t:'warn', ...})` e toast só no host: "Fulano: 5 mensagens fora do esperado (posição ×4, tiro ×1)"; repetir no máximo 1 aviso por minuto por jogador. **20 em 120 s** → o aviso ganha um botão "Expulsar" (e a entrada do placar na pausa também). **Nunca** expulsar automaticamente: a confirmação é sempre do host, e o primeiro aviso é informativo.
  3. Expulsar = `srvDrop(conn)` + lembrar `tok`/nome em `S.banned` pela duração da sala (sem token confiável, só o nome: a pessoa volta com outro nome; o objetivo é dar ao host uma ação, não impedir a volta).
  4. `console.info` no host com o detalhe de cada recusa (tipo, valores, limite) para calibrar os números com partidas reais antes de apertar.
  Muda a experiência: só o host vê avisos; os limites propostos foram escolhidos para que ping de 300 ms e soluços de 1,5 s não gerem nem o primeiro toast.

---

## Resumo

| Id | Severidade | Título |
|---|---|---|
| G1 | Baixa | `window.__T`, `__simLock`/`__simNow` expostos em produção (`sim()` no host avança a partida de todos) |
| G2 | Baixa | Sem `__T` o vetor é a cópia local do HTML: não há integridade verificável do cliente (premissa) |
| G3 | Alta | `pos` sem limite de velocidade, altura ou posição no mapa (invencível no Zumbis, teleporte, voo) |
| G4 | Média | `zhit` sem distância, LOS nem estado do zumbi (`rise` no subsolo); sem estatística de headshot/dano no teto |
| G5 | Alta | `hit` (CS/DM) sem arma do inventário, LOS, distância, cadência; dano até 500 por mensagem |
| G6 | Média | Munição e cadência de `shot` inexistentes no host; `shot` repassado sem limite (amplificação) |
| G7 | Média | Reentrada (`S.left`) e chat pelo nome; nomes repetidos permitidos (impersonação) |
| G8 | Baixa | Versão de protocolo só `v: 2`; sem conferência entre host e clientes honestos |
| G9 | Baixa | Ofuscação/minificação: não recomendada (sem ganho real; alternativas baratas listadas) |
| G10 | Média | Sem contador de anomalias, aviso ao host nem expulsão manual |

Ordem sugerida de implementação: G5 → G3 → G10 (os três se apoiam no mesmo balde/contador) → G7 → G4 → G6 → G1 → G8. G2 e G9 são decisões, não tarefas.
