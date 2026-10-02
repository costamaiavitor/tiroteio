# Relatório da auditoria de segurança — Dan of Duty (tiroteio)

Fase 1 do endurecimento, 02/10/2026, branch `security-hardening` (base `origin/main` 12a9328). Dez auditorias independentes, só leitura, uma por área; os relatórios completos (com cenário, linhas e correção detalhada) estão em `docs/seguranca/auditoria/01…10`. Este documento junta tudo, tira as duplicatas (o mesmo problema visto por áreas diferentes vira um achado só, com os ids de origem) e ordena por severidade. Linhas são de `index.html` em 7bb7797.

Premissas confirmadas pelas dez áreas: o host é um jogador qualquer rodando o servidor no próprio navegador (sem backend), o cliente é sempre editável, e o `pid` de cada mensagem vem da conexão (ninguém fala em nome de outro, exceto o host). Logo: a defesa real é a validação no host; o que roda no cliente (ganchos, ofuscação, regras locais) é só dificultação.

## 1. Números

| Severidade | Achados consolidados | Origem (ids por área) |
|---|---|---|
| Crítica | 2 | C1, C3, G3, G5, Z4, Z6 |
| Alta | 7 | C2, C4, C6, C7, G4, G6, Z5, Z8, R3–R8, R10, R11, R18, I1, I5, I6, I7, A3, A11, Z1, Z2, Z3, C8, D1, D3, D4, A7, A8, S4, D6, Z9, P1, P2, P3, R15, F1, S1, R1, S2, S5 |
| Média | 9 | C10, G1, F2, Z7, F3, A1, R13, G7, I2, I3, I4, R12, A4, S3, D2, A6, A5, F7, F5, F6, D9, G10, P4, P5, P6 |
| Baixa | 6 | C5, Z10, R9, A2, R14, A9, A10, D5, D7, D8, D10, G8, R2, F4, F8, F9, P7, P8, P9, G2, G9, C11, R16, R17, I8 |

Conferido e sem achado (vale registrar): `chat` sempre com o `pid` da conexão e escapado no DOM; `boxtake`/`paptake`/`pap` exigem o mesmo usuário; `buy`, `bomb`, `zfx`, `zclay`, `nade` bem validados; `join` só uma vez por conexão; nenhum `eval`/`new Function`; `?sala=` nunca vai para HTML; senha nunca gravada; e-mail/uid não trafegam na rede; TLS/DTLS em tudo; `pnpm audit` limpo; nenhum `.env`/chave privada em nenhum commit.

## 2. Achados por severidade

Legenda das colunas "Muda?": **não** = invisível para quem joga limpo; **visível** = o jogador percebe (texto, limite, botão); **arquitetura** = exige backend ou mudança de desenho (não será implementado sem aprovação). "Manual" = ação do dono fora do código.

### Críticas

#### V01 — `hit` (x1 / mata-mata / rodadas): um tiro mata qualquer jogador vivo, de qualquer lugar
- Origem: C3, G5, Z4, Z10 (parte). Linhas 5324–5328, 5346–5363.
- O host só limita `dmg` a 500 e exige atacante vivo (ou morto há < 0,6 s). Não confere arma no inventário, cadência, distância, linha de visão, direção, munição, zona nem fase (`end`/`over` ainda contam abate e dinheiro). `dmg: 500, z: 'head', w: 'knife'` mata com colete e dá 1 500 $ por abate. Um laço no console elimina toda a sala a cada respawn.
- Correção (host, não muda): `w` tem de ser `knife`, `p.inv.primary` ou `p.inv.secondary`; teto = `dmg × head × pellets × 1,1` (mesma fórmula do `zhit`, l. 5304); balde de cadência por arma igual ao do `zhit` (l. 5309), extraído para uma função; faca ≤ 4,5 m; armas de fogo com `losClear` dos olhos do atacante até 3 pontos da vítima (cabeça, tronco, pés), contra a posição atual **e** a de ~200 ms atrás (anel de 8 posições por jogador, gravado no `pos`: compensação de lag mínima); recusar em `end`/`over`; atacante morto só com `ts` anterior a `diedAt`. Recusa é silenciosa e contada (V17).

#### V02 — `pos` sem limite de velocidade, altura ou posição: teleporte, voo, invencibilidade e interação a distância
- Origem: C1, G3, Z6, R9. Linhas 5286–5292; consumidores de `p.pos` em 5305, 5334, 5340, 7420, 7534, 7540, 7340, 7235, 7246.
- O host só exige vetor finito. Flutuar 1,6 m acima do chão torna o jogador intocável pelos zumbis (`zTryAttack` exige `dy < 1,5`) enquanto ele continua pontuando; um `pos` ao lado da porta/caixa/bebida/colega caído + `use`/`hold` + `pos` de volta compra, abre, reanima e planta a bomba sem sair do lugar; em PvP é speedhack/noclip. O `ts` do cliente alimenta o único detector de velocidade (`fastT`), então ele é enganável.
- Correção (host, não muda): balde de distância horizontal no **relógio do host** (reabastece a 14 m/s nos Zumbis e 10 m/s em CS/DM, teto 1,5 s de rajada: cobre deslize a 9,5 m/s, bote da faca e soluços de rede); balde vertical só para subida (8 m/s, teto 12 m: cobre pulo de 1,21 m, degraus e rampas); `zRoomAt(x,z) === null` ou `ffCell < 0` → recusar (fora do mapa); `blockedAt` 3× seguidas → anomalia (noclip); zerar no `srvSpawn`. `use`/`hold`/`bomb`/`nade` passam a usar a posição **já validada** (a última aceita), e o anel de posições serve ao V01. `ts`: só `finN`, com `dt` limitado a 1,5× o tempo real do host. Nunca "corrigir" a posição (rubber-band puniria quem tem lag): só recusar e contar.

### Altas

#### V03 — `zhit` e armas de área: o cliente escolhe o alvo; o host não confere distância, visão nem estado do zumbi
- Origem: C2, C7, G4, Z5. Linhas 5298–5318, 6609–6655, 7282–7304.
- A base existente é boa (arma, teto, cadência por zumbi e por arma, nº de alvos), mas qualquer `id` de `Z.zs` serve, inclusive zumbi ainda no subsolo (`rise`, y −1,8) e atrás de paredes; `z:'head'` e `sp:1` são bits livres. Arma Trovão (`cap` 1e7, 48 alvos, sem balde por zumbi) e Winter's Howl têm o cone calculado no cliente: uma mensagem por zumbi mata o mapa inteiro; Ray Gun chega a ~195 000 de dano/s.
- Correção (host, não muda): recusar `rise` com y < −1; teto absoluto 260 m; para acerto direto (`sp = 0`, sem `chain/frost/thunder`) `losClear` em 3 pontos contra a posição atual e a de ~150 ms atrás do zumbi (`z.prev` no `zTick`); `sp` só para armas com `splash` e exigindo o zumbi a ≤ `splash.r + 2` m de um alvo direto do mesmo tiro ou de um ponto de `shot`; Trovão/Howl: recalcular cone (distância ≤ `range + 1`, `cos ≥ cosA − 0,05`, LOS) no host a partir de `p.pos/yaw/pitch`; primeiro alvo da Wunderwaffe com LOS; `head` só com `head > 1`. Estatística (só marcar): headshot > 95 % com ≥ 40 acertos, `dmg ≥ cap × 0,999`.

#### V04 — Munição, recarga e cadência de `shot` não existem no host; `shot` é repassado sem limite e sem posse da arma
- Origem: C4, C6, G6, R6, Z8. Linhas 5293–5297, 4700–4706, 4950–4957.
- `shot` só valida a forma e retransmite a todos (até 12 pontos; para armas com `splash` cada ponto vira uma explosão em cada cliente: 2 400 explosões/s por cliente a 200 msg/s). Não há munição no host (`G.ammo` é só do cliente), nem cadência de `shot`/`hit`, nem posse da arma, nem `alive`. `p.shotT` libera o Electric Cherry sem atirar. `W` é mutável via `__T`.
- Correção (host, não muda): exigir `p.alive && !p.downed`, arma do inventário (como em `zhit`), `|o − (p.pos + olho)| ≤ 1,5 m`; `e` cortado em `pellets || 1`; o mesmo balde de cadência por arma (V01); excedente descartado e contado, não retransmitido; `pos.w` só do inventário. Munição **inferida** (só contar, não recusar, até calibrar): tiros desde o último reabastecimento conhecido pelo host (spawn, parede, caixa, PaP, Munição Máxima) ≤ `mag + res`. `Object.freeze` em `W`, `ZWEAP`, `ZPK`, `ZKIND` após montar.

#### V05 — Negação de serviço: sem limite por conexão, sem teto de jogadores, sem timeout antes do `join`, sem limite de tamanho
- Origem: R3, R4, R5, R7, R8, R10, R11, R18, I6, A3, A11. Linhas 5062, 5173–5181, 5247–5277, 5342, 5545–5548.
- `chat` e `shot` são amplificados ×N sem cadência (um laço no console congela o host e enche os clientes de timers); `join` sem teto custa O(N²) e, acima de ~100 jogadores, o `state` passa de 16 KB e ninguém mais recebe estado; conexões que nunca mandam `join` ficam para sempre (teto de `RTCPeerConnection` do navegador) e recebem `pong`; `JSON.parse` sem limite de tamanho no canal rápido; `S.left` cresce sem teto; `pong` ecoa `d.c` de qualquer tipo; cliente que só manda `ping` conta como jogador.
- Correção (host; **visível só o teto de jogadores**): um limitador por conexão e por tipo em `srvOnData` antes do `switch` (sugestão: `pos` 40/s, `shot` 20/s, `zhit` 30/s, `chat` 2/s com rajada 5, `skins` 1/s, `ping` 5/s, resto 10/s; excedente descartado em silêncio; reincidência extrema → `srvDrop`); teto de jogadores humanos (**decisão: 12?**) respondendo `{t:'err', txt:'Sala cheia'}` + `close()` (o cliente já mostra "Conexão recusada"); `setTimeout` de 10 s fechando conexão sem `join` e teto de 16 pendentes; `pong` só após o `join` e com `finN(d.c)`; canal rápido ignora `e.data` > 2 KB; `S.left` com 32 entradas e expiração de 5 min; `srvState()` do `join` via `S.stateT = 0` (debounce). Jogo normal (≤ 8 pessoas, 30 `pos`/s) não chega perto de nenhum limite.

#### V06 — XSS nos clientes por campos "numéricos" do host interpolados sem `esc()`; injeção de CSS pela cor; `localStorage` sem filtro
- Origem: I1, I5, I7, A10. Linhas 6803, 6806, 6817, 7816–7817, 7842, 7861–7866 (sinks); 7608–7613, 7724, 7727, 6230–6256 (origens); 451, 8059–8068.
- `state.pl[].m/k/d/hs/dw/rvs`, `state.sc`, `state.r`, `st.frags`, `pts.m`, `zs.rem` entram em `innerHTML` sem `esc()` nem conversão: um host (ou quem tomou o id da sala, V13) manda `m: '<img src=x onerror=…>'` e roda script na origem do jogo em todos os clientes (acesso ao `localStorage`, ao token do Firebase e a `profSave`). `p.c` entra em `style=` (esc não barra `;`: beacon por `background:url()` ou sobreposição de tela). `tiroteio.name` é lido sem filtro e `lastSt.frags/rounds` sem validação (self-XSS do host, propagado por `welcome`).
- Correção (cliente, não muda): normalizar uma vez em `onMsg` (`|0`, `+x || 0`) todo número de `state`/`pts`/`inv`/`zs`/`welcome.st`; `pl.c` por regex `^#[0-9a-f]{6}$`, `pl.tm` ∈ {t, ct}; `CFG.name` com o mesmo filtro do `oninput`; `matchForm` prendendo `rounds/frags/bots/diff` às listas permitidas. Regra geral: todo `${…}` em `setHTML` passa por `esc()` ou é número.

#### V07 — Progresso (XP, caixas, skins) decidido, sorteado e gravado pelo próprio cliente; regras do Firestore sem validação
- Origem: Z1, Z2, Z3, C8, D1, D3, D4, A7, A8, S4, D6, Z9. Linhas 8138–8146, 8150–8169, 8221–8236, 8366–8390; README l. 134–146.
- Não há backend de progressão: `grantXP` roda ao receber mensagens (`zdie`, `mend`, `kill`…), a caixa é sorteada com `Math.random` local e o documento inteiro é gravado por `setDoc` com regras que só conferem o `uid`. `__T.PROF.data.cases = 999`, `__T.grantAllSkins()` (qualquer conta) ou um `setDoc` externo com a config pública valem na próxima leitura. Sem limite de taxa de escrita (esgota a cota Spark de todos). `OWNERS` é um e-mail pessoal no cliente. Skins anunciadas na rede não são conferidas (inerente ao P2P).
- Correção em duas partes. **Código (não muda)**: `firestore.rules` versionado no repositório com validação de forma, tipos e tamanhos (texto completo em `07-dados-banco.md` D1: `hasOnly`, `xp` em [0, 300), `items` ≤ 1200 no formato `arma:skin`, `equipped` ≤ 80 chaves, `upd/created == request.time`, `delete` negado), intervalo mínimo de 1 s entre escritas (D3) e tetos de incremento por escrita (D4: `cases` ≤ anterior + 10, só cai 1 quando `opened` sobe 1, `items` ≤ anterior + 1; `create` com tetos absolutos); `grantAllSkins` e `PROF` fora de `__T` em produção (V10); `OWNERS` por exceção de uid na regra ou só em memória (**decisão**); tetos de plausibilidade em `grantXP` (`zover` com `r ≤ 200`). **Manual**: publicar as regras no console (testar no simulador com os dois payloads reais antes). **Arquitetura (não será feito sem aprovação)**: Cloud Function que concede XP/sorteia a caixa; só isso fecha de verdade.

#### V08 — Código de terceiros por CDN sem SRI, sem CSP, com `document.write` e uma versão flutuante
- Origem: P1, P2, P3, R15, F1. Linhas 3–9, 274–276, 3559, 8174–8175.
- ≈2,1 MB de JavaScript (PeerJS, three.js + addons, Firebase) chegam em tempo de execução de três CDNs sem `integrity`; o `@webxr-input-profiles/assets@1.0` resolve para a última 1.0.x; o fallback do PeerJS por `document.write` dobra as origens confiadas e o Chrome o bloqueia em rede lenta. Sem CSP, qualquer script injetado (V06, CDN comprometida, extensão) fala com qualquer servidor; sem `Referrer-Policy` o `?sala=` pode sair no `Referer`.
- Correção (**decisão**): (a) vendorizar `peerjs@1.5.4` e `three@0.160.0` (build + `examples/jsm` inteiro) em `vendor/` a partir do tarball do npm, com `vendor/HASHES.md` (SHA-384 já calculados em `08-dependencias.md`), importmap apontando para `./vendor/…`, Firebase mantido no gstatic (domínio do próprio Google); fixar `@webxr-input-profiles/assets@1.0.20` ou vendorizar os dois `.glb`; trocar o `document.write` por `createElement('script')` com `integrity`. Ou (b) ficar na CDN com `integrity` só no PeerJS (importmap/`import()` não aceitam SRI de forma portátil). Recomendação: (a). Em seguida a `<meta http-equiv="Content-Security-Policy">` proposta em `09-configuracao.md` F1 (fase 1 com `'unsafe-inline'` para os três scripts inline; fase 2 com hashes recalculados por script) + `<meta name="referrer" content="strict-origin-when-cross-origin">`, **testada** em: login Google, salvar progresso, duas abas na mesma sala, mão VR, `pnpm test`.

#### V09 — Credenciais do TURN (Metered) no código, no histórico e no site publicado
- Origem: S1, R1, S2, S5. Linhas 5046–5051; commit 58b2d6e; credenciais antigas `openrelayproject` em 740dbd3.
- `username`/`credential` de longa duração do plano grátis: qualquer um usa o relay como proxy ou esgota a cota (e então quem está atrás de NAT simétrico não entra mais). Remover do código não remove do histórico público (forks, branches `claude/*`, caches).
- Correção: **manual** — rotacionar a credencial no painel da Metered, ligar alerta de cota e, se o plano permitir, restringir domínios. **Arquitetura (decisão)**: credenciais temporárias (TURN REST) por uma função serverless mínima; sem isso, a credencial nova continuará pública por natureza (é assim que o WebRTC no navegador funciona). Código: mover `ICE` para um bloco de configuração no topo, documentado, e parar de repetir valores em docs (já redigidos em `01-segredos.md`).

### Médias

#### V10 — Ganchos de depuração `window.__T`, `__simLock`, `__simNow` em produção
- Origem: C10, G1, F2, Z7 (parte), F3. Linhas 8560–8562, 8492, 8502, 5088, 3699.
- Expõem `S`, `Z`, `sendToHost`, `zHit`, `zHurt`, `broadcast`, `grantAllSkins`, `PROF`, `W` (referência viva) e `sim()`: no host, `__simLock = true` congela a partida de todos e `sim(600)` avança 10 minutos de uma vez. Não cria poder novo (o arquivo é editável), mas reduz a trapaça a uma linha no console.
- Correção (não muda): `const DEBUG = ['localhost','127.0.0.1','[::1]'].includes(location.hostname)` e `if (DEBUG) window.__T = …`; `__simLock/__simNow` só com `DEBUG`; `ARMS_VER` e `debug` do PeerJS no mesmo flag. Os testes rodam em `127.0.0.1` e continuam iguais. Sem `?debug` (devolveria o acesso a quem souber).

#### V11 — Reentrada identificada só pelo nome; nomes repetidos permitidos (personificação)
- Origem: A1, R13, G7. Linhas 5253, 5257–5261, 5272, 6981.
- Quem entra com o nome de quem acabou de sair (o toast "saiu" avisa todos) herda pontos, armas e bebidas por 5 minutos, e a vítima volta do zero. Dois jogadores podem ter o mesmo nome no placar e no chat.
- Correção: token aleatório (`crypto.randomUUID()`) gerado no cliente ao entrar, guardado em `localStorage` por código de sala (10 min) e enviado no `join`; `S.left` chaveado por nome + token (só casa se os dois baterem; token ausente = sem recuperação, nunca erro); nome repetido ganha ` (2)` como os bots já fazem (**visível**, só para o segundo); normalizar o nome (`NFKC`, sem caracteres invisíveis). Quem limpar o armazenamento entre sair e voltar perde a recuperação (raro).

#### V12 — Chaves herdadas (`constructor`, `__proto__`) e mensagens malformadas derrubam o cliente
- Origem: I2, I3, I4. Linhas 8150, 8154, 2731–2740, 7601–7755, 7685, 7725, 7669, 5483.
- `cleanSk` aceita `{ak47:'constructor'}` (W e SKIN_BY são objetos simples), o host repassa no `state` e `skinTex` lança `TypeError` em todos os clientes a cada `state` (placar congelado, fantasmas, mundo dessincronizado): **qualquer jogador** explora. `zperk` com `k:'constructor'` congela o HUD (`tick` sem try/catch); `ztrap` com `i:'__proto__'` polui `Array.prototype`; `msg` com `dur: NaN` fica permanente.
- Correção (não muda): `Object.hasOwn` em `cleanSk`, `cleanProf.items`, `gunMats`, `srvBuy`, `ammo`, `zperk`, `ztrap` (`Number.isInteger`); `onMsg` com `try/catch` por mensagem; validação de forma por tipo (`Array.isArray(m.pl)`, `vec3(m.p)`, `clamp(dur, 0, 30)`); `ZC.perks` filtrado.

#### V13 — Sequestro do id da sala quando o host perde o pareamento; host sem autenticação
- Origem: R12, A4. Linhas 5155, 5161–5172, 5203, 5207.
- Se o socket do host cair, outro pode registrar `tiroteio-br-v1-CODIGO`; o host fica em `unavailable-id` silencioso e todo novo jogador cai no impostor, que manda o que quiser (V06 vira XSS remoto).
- Correção: ao receber `unavailable-id` com `NET.online`, avisar o host na tela e abrir um código novo (`{t:'room', code}` aos conectados, HUD atualizado); segredo do host no link (`?sala=CODE&h=…`, repetido no `welcome` e conferido por quem entrou pelo link), **visível** (link maior; decisão). Sem backend não há verificação completa.

#### V14 — Firebase sem App Check, chave de API sem restrição, enumeração de e-mail, cadastro aberto
- Origem: S3, D2, A6, A5, F7. Linhas 8129–8136, 8174–8181, 8204–8217.
- Qualquer script fora do site inicializa o projeto, cria contas em massa e consome a cota de Auth/Firestore; mensagens de erro distinguem "sem conta" de "senha errada".
- Correção: **manual**: restrição de referenciador e de APIs na chave (Google Cloud → Credenciais), domínios autorizados só `costamaiavitor.github.io` e `localhost`, *Email enumeration protection*, App Check com reCAPTCHA v3 (primeiro em modo monitorar; exige uma chamada `initializeAppCheck` no código e entradas na CSP). Opcional: unificar as mensagens `user-not-found`/`wrong-password` (visível, decisão).

#### V15 — Repositório e GitHub Pages: `main` sem proteção publica direto; `tools/`, `tests/` e `docs/seguranca` saem publicados
- Origem: F5, F6. Verificado por `gh api`: Pages `legacy` na raiz da `main`, `rulesets: []`, sem `.github/`.
- Qualquer push (três identidades, uma automatizada) vira o jogo de todos em segundos; a auditoria inteira (com linhas) seria servida ao lado do jogo ao mesclar; `.py` com caminhos locais do autor.
- Correção: `_config.yml` com `exclude: [tools, tests, docs, package.json, pnpm-lock.yaml, README.md]` (**decisão**: muda o que o Pages publica, não o jogo); `.gitignore` completo; **manual**: ruleset da `main` (sem force-push/exclusão, PR obrigatório), secret scanning + push protection, Dependabot, CodeQL; CI (`pnpm test`) em PR.

#### V16 — `storageBucket` configurado sem o Storage ser usado
- Origem: D9. Linha 8133.
- Se o bucket existir com regras padrão, qualquer conta nova hospeda arquivos no projeto. **Manual**: conferir no console; se existir, `allow read, write: if false`; opcional remover `storageBucket`/`messagingSenderId` do config.

#### V17 — Sem contador de anomalias, aviso ao host nem expulsão manual
- Origem: G10. Linhas 5283 (todo `return` silencioso), 5268.
- Com V01–V05 recusando em silêncio, o host precisa saber e poder agir; hoje só fecha a aba.
- Correção: `p.anom` com decaimento (1 ponto/30 s); 5 em 60 s → toast só no host ("Fulano: 5 mensagens fora do esperado"), no máximo 1/min; 20 em 120 s → botão "Expulsar" no placar da pausa (`srvDrop` + lista da sala). **Visível** (UI nova, só para o host; decisão). Nunca expulsar automaticamente.

#### V18 — Firebase SDK 10.12.2 (duas majors atrás, linha sem lançamentos) e three.js 0.160.0
- Origem: P4, P5, P6. Nenhum advisory aplicável hoje (OSV/npm conferidos). Recomendação: **não** atualizar nesta frente (risco de regressão visual/comportamental sem ganho de segurança); registrar e acompanhar.

### Baixas

#### V19 — `selfdmg`/`suicide` sem cadência nem fase; `hit` aceito em `end`/`over` (C5, Z10)
Correção (não muda): `selfdmg` só dentro de 1 s de uma explosão própria conhecida pelo host e com cadência de 0,3 s; Dying Wish só por dano de zumbi/armadilha; `suicide` só `alive && !downed && phase !== 'over'` e, nos zumbis, cai em vez de morrer; `hit` recusado em `end`/`over` (as armas já não disparam nessas fases).

#### V20 — Código da sala com `Math.random()` e enumerável pela API do PeerJS (A2, R14)
Correção: `crypto.getRandomValues` (não muda). Aumentar para 6 caracteres multiplica o espaço por 32 (**visível**; decisão: recomendo manter 5 por enquanto, com o teto de jogadores de V05 reduzindo o dano).

#### V21 — Sessão do Firebase persistente, cache do perfil por uid, sem exclusão de conta/LGPD, XP dos últimos 3 s perdido ao sair (A9, A10, D5, D7, D8, D10)
Correção: `profSave(true)` em `leaveGame` (não muda; é correção de perda de dado do jogador honesto); o resto é opcional/informativo (nota de privacidade no README; "manter conectado"; parar de gravar `name` do Google).

#### V22 — Protocolo sem número de versão (G8)
Clientes e host em revisões diferentes jogam juntos com tabelas divergentes e as validações novas acusariam honestos. Correção: `PROTO` inteiro no `join`/`welcome`; divergência → "Versão diferente da do host: recarregue com Ctrl+F5" (**visível** só nesse caso; decisão: recomendo sim).

#### V23 — Exposição do IP público entre jogadores (R2)
Inerente ao WebRTC em estrela. Correção: documentar no README; opcional "só por relay" (depende de V09).

#### V24 — Ferramentas e testes (F8, F9, P7, P9, G9, I8)
`tests/servidor.mjs`: `decodeURIComponent` sem try/catch derruba o processo e serve a raiz inteira (corrigir: try/catch + bloquear `.git`, `node_modules`, `tests`, `tools`, `docs`); `recv.py` referenciado não existe (versionar ou tirar as referências); fontes do Google sem SRI (opcional vendorizar); ofuscação/minificação **não recomendada** (sem ganho, quebra o fluxo de arquivo único).

## 3. Decisões que dependem do dono (antes da Fase 2)

| # | Decisão | Recomendação | Se "não" |
|---|---|---|---|
| 1 | Vendorizar PeerJS + three.js em `vendor/` (≈2,1 MB no repositório) | Sim; Firebase fica no gstatic | SRI só no PeerJS + CSP |
| 2 | Ativar a CSP por `<meta>` (fase 1, com `'unsafe-inline'`) | Sim, com os cinco testes listados em V08 | Só `Referrer-Policy` |
| 3 | Teto de jogadores humanos por sala | 12 (editável no formulário da sala) | Sem teto; só o limitador por conexão |
| 4 | Nome repetido ganha " (2)" (visível para o segundo) | Sim | Token sem desambiguar o rótulo |
| 5 | Aviso de anomalias + botão "Expulsar" para o host (UI nova) | Sim, mínimo (toast + botão na pausa) | Só `console.info` no host |
| 6 | Publicar as regras novas do Firestore (manual) e tratar `OWNERS` | Sim; exceção por uid na regra | Skins do dono só em memória |
| 7 | Segredo do host no link de convite (`&h=…`, link maior) | Sim | Só aviso + código novo ao perder o id |
| 8 | Número de versão do protocolo com mensagem "recarregue" | Sim | Nada |
| 9 | `_config.yml` excluindo `tools/tests/docs` do Pages | Sim | Mover `docs/seguranca` para fora da `main` |
| 10 | TURN: só rotacionar (manual) ou backend mínimo para credencial temporária | Rotacionar agora; backend é arquitetura, decidir depois | — |
| 11 | Cloud Function para XP/caixas (arquitetura) | Adiar; regras do Firestore limitam o salto por escrita | — |
| 12 | Código de sala com 6 caracteres | Não (manter 5) | — |

## 4. Plano proposto para a Fase 2

Tudo em `index.html` (um arquivo), então as edições nele são **serializadas** (um agente por vez, cada um dono de uma região de linhas, `pnpm test` depois de cada commit); só arquivos novos/separados andam em paralelo. Um commit por correção, com teste que prova a falha fechada (`tests/seguranca-*.test.mjs`, no mesmo harness da linha de base).

| Lote | Achados | Região / arquivos | Agente |
|---|---|---|---|
| A (Críticas) | V01, V02 (+ base: função de balde, anel de posições, `losClear` reutilizável, contador de anomalias de V17 sem UI) | servidor 5232–5680 | host-1 |
| B (Altas, host) | V03, V04, V05, V19, V20, V11 (lado host) | servidor 5232–5680 e zumbis 6664–7596 | host-2 (depois de A) |
| C (Altas, cliente) | V06, V12, V10, V11 (lado cliente), V21 (`leaveGame`), V22 | cliente 7601–8122, conta 8123–8430, boot 8440–8565 | cliente-1 (depois de B) |
| D (Supply chain) | V08 (vendor/, importmap, CSP, referrer), V13 | `<head>` 1–280, `vendor/`, `_config.yml` | infra-1 (regiões distintas; commit depois de C para não conflitar) |
| E (Dados/repo) | V07 (`firestore.rules`, README), V09/V14/V15/V16 (lista de ações manuais), `tests/servidor.mjs` (V24) | arquivos novos e docs | dados-1 (paralelo) |
| F (Fase 3) | revisor de regressão (linha de base + novos), revisor adversarial (re-explora V01–V13), revisor de compatibilidade (protocolo `v:2`, `state` enxuto, saves do `localStorage`, documento antigo do Firestore) | — | 3 revisores |

Não entra na Fase 2 sem aprovação explícita: Cloud Function (V07), backend do TURN (V09), servidor autoritativo (C9/Z7), mudanças de regra de jogo (zona de compra em `rounds`, C11).
