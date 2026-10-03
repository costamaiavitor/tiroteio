# 06 — Rede e comunicação

Auditoria somente leitura de `index.html` (branch `security-hardening`), camada de rede (l. 5041–5230), entrada do servidor (`srvOnData`/`srvDrop`/`srvHandle`, l. 5247–5345) e `srvState`/`srvCheckTimeouts` (l. 5521–5548). Comportamento do PeerJS citado de memória da versão 1.5.4 (não há `node_modules`); os pontos incertos estão marcados com "(a confirmar)".

### [R1] Credencial do TURN fixa no código (abuso da cota e uso como relay)
- Arquivo e linha: `index.html` l. 5049–5050 (`ICE`), também no histórico do git (commit `58b2d6e` e credenciais antigas `openrelayproject`).
- Descrição: `username`/`credential` de longa duração da Metered (plano grátis, cota mensal pequena) estão em texto claro numa página pública. Qualquer pessoa pode copiá-las e usar o relay para tráfego próprio (TURN repassa qualquer UDP/TCP entre dois pontos que o próprio atacante controla), ou simplesmente esgotar a cota.
- Cenário de exploração: um script abre `RTCPeerConnection` com `iceTransportPolicy: 'relay'` entre duas abas e transfere dados até a cota acabar; a partir daí quem está atrás de NAT simétrico/firewall não consegue mais entrar nas salas (o jogo fica "Tempo esgotado: a rede bloqueou a ligação com o host", l. 5199). Também dá para usar o relay como proxy anônimo em nome do projeto.
- Severidade: Média
- Correção sugerida: credenciais temporárias (TURN REST, `username = expiração:usuário`, senha = HMAC) geradas por uma função serverless mínima que confere a origem e devolve `iceServers` com validade de 1–2 h — isso exige um backend pequeno (mudança de arquitetura). Enquanto não houver: rotacionar a credencial (a atual já está no histórico público), ligar o alerta de cota na Metered e, se o plano permitir, restringir os domínios autorizados (a confirmar no painel da Metered). Nenhuma mudança visível no jogo.

### [R2] Exposição do IP público dos jogadores (inerente ao WebRTC)
- Arquivo e linha: `index.html` l. 5046–5051 (STUN/TURN), 5155 e 5203 (ligações diretas host ↔ cliente).
- Descrição: a topologia é estrela: cada cliente liga só ao host, então o host vê o IP público de todos e cada cliente vê o do host (candidatos `srflx`; os IPs locais já saem mascarados por mDNS nos navegadores atuais). O TURN e o servidor de pareamento (`0.peerjs.com`) também veem os IPs. Isso é da natureza do P2P, não é um bug.
- Cenário de exploração: um jogador hostil lê os candidatos ICE (`chrome://webrtc-internals` ou `getStats`) e obtém o IP do host para ataques de DoS fora do jogo ou geolocalização aproximada.
- Severidade: Baixa
- Correção sugerida: documentar no README ("quem hospeda expõe o IP para quem entra"); opcionalmente uma preferência "só por relay" (`iceTransportPolicy: 'relay'`) para quem quiser esconder o IP, com o custo de latência e de cota do TURN (depende de R1 estar resolvido). Sem backend, não há como esconder o IP do host sem relay.

### [R3] Sem limite de jogadores: flood de `join` custa O(N²) ao host e quebra o `state` de todos
- Arquivo e linha: `index.html` l. 5251–5264 (`srvOnData` join), 5173–5181 (`peer.on('connection')`), 5521–5541 (`srvState`), 7612–7618 (cliente cria um modelo 3D por jogador), 7004–7005 e 7121 (zumbis escalam com `S.players.size`).
- Descrição: qualquer conexão que mande `{t:'join'}` vira jogador, sem teto. Cada join dispara `broadcast(info)` e `srvState()` completo para todas as conexões (l. 5256, 5263): com N conexões o custo acumulado é O(N²). O `state` cresce ~150 B por jogador (mais skins); com ~100 jogadores passa dos 16 KB que o canal JSON do PeerJS aceita (`chunkedMTU`, erro `message-too-big` emitido no remetente — mesma causa do comentário em l. 5279), e o host passa a falhar silenciosamente em todo envio de `state` (o `try/catch` em l. 5540 engole; o erro em l. 5180 só loga). Os clientes ficam sem `state` (vida, pontos, fase, mundo dos zumbis) enquanto tudo o mais continua. No cliente, cada jogador do `state` vira um `playerModel` (l. 4889) na cena e uma etiqueta; no modo zumbis o número e a vida dos zumbis crescem com `S.players.size` (l. 7005, 7121), e `zSpawnPoint` reaproveita pontos (`i % length`), empilhando fantasmas no spawn.
- Cenário de exploração: um script abre 200 `Peer`s e manda `join` com nomes diferentes (`'p' + i`). Em segundos: 200 toasts em cada cliente, 200 modelos na cena de todos, `state` acima de 16 KB (ninguém mais recebe estado), rodada de zumbis com centenas de zumbis de vida multiplicada, host a 100 % de CPU. Num modo com rodadas, 200 jogadores "vivos" parados impedem o fim da rodada até serem mortos.
- Severidade: Alta
- Correção sugerida: teto de jogadores humanos (`st.maxPlayers`, padrão 12, editável no formulário da sala) e, acima dele, responder `{t:'err', txt:'Sala cheia'}` e `conn.close()` — o cliente já mostra "Conexão recusada" quando fecha antes do `welcome` (l. 5208). Debounce do `srvState()` do join (marcar `S.stateT = 0` em vez de chamar direto: no máximo 4/s). Limitar conexões simultâneas por `conn.peer` de origem (1) e por sala (p. ex. 32 incluindo as sem join, ver R4). Nada disso muda a experiência de uma sala normal (≤ 8 pessoas).

### [R4] Conexões abertas sem `join` nunca expiram nem contam
- Arquivo e linha: `index.html` l. 5173–5181 (handlers por conexão), 5252 (`NET.conns.set` só no join), 5545–5548 (`srvCheckTimeouts` só percorre `NET.conns`).
- Descrição: o PeerJS aceita toda `DataConnection` de entrada automaticamente (não há passo de aceite). Uma conexão que abre e não manda `join` fica fora de `NET.conns`, logo fora do timeout de 12 s; ela só some se o próprio remoto fechar ou a ligação WebRTC cair (l. 5178). Cada uma custa ao host um `RTCPeerConnection` inteiro (ICE + DTLS + SCTP, memória de MB) e, em `attachFast`, um `setInterval` de 500 ms por até 10 s (l. 5063). O Chromium limita o número de `RTCPeerConnection` por página (≈500, a confirmar); atingido o teto, `new RTCPeerConnection` lança e nenhum jogador legítimo entra mais. O `ping` pré-join (l. 5250) é respondido mesmo sem `pid`, então a conexão parece "viva" sem nunca jogar.
- Cenário de exploração: um script cria 500 `Peer`s e chama `peer.connect(PEER_PREFIX + code)` sem mandar nada. O host gasta CPU/memória nos handshakes, bate no teto do navegador e a sala fica fechada para novos jogadores sem nenhum aviso ao host (nada aparece no HUD, que conta `S.players.size`).
- Severidade: Média
- Correção sugerida: em `peer.on('connection')`, `setTimeout(() => { if (!conn.pid) { try { conn.close(); } catch {} } }, 10000)`; manter um contador de conexões pendentes (sem `pid`) e fechar na hora acima de 16; responder `ping` só depois do `join`. Opcional: mostrar no HUD do host "N conexões aguardando" quando passar de 4. Sem impacto para quem entra normalmente (o `join` sai no `open`, l. 5206, muito antes de 10 s).

### [R5] Flood de `chat`: amplificação ×N no canal confiável, sem limite por conexão
- Arquivo e linha: `index.html` l. 5342 (`case 'chat'`), 5136–5139 (`broadcast`), 7752 e 7771–7775 (`chatAdd` no cliente), 8560 (`__T.sendToHost` exposto no console).
- Descrição: cada `chat` recebido vira um `conn.send` para todas as N conexões (o PeerJS faz um `JSON.stringify` por envio) mais `onMsg` local. Não há cadência, nem contagem, nem tamanho mínimo entre mensagens — só o corte em 120 caracteres. No cliente, cada mensagem cria um `<div>`, toca um som e agenda dois `setTimeout` (9 s e 9,7 s), que se acumulam mesmo com o log limitado a 7 linhas.
- Cenário de exploração: no console, `for(;;) __T.sendToHost({t:'chat',txt:'x'.repeat(120)})` com `await` de 0 ms. A ~5.000 msg/s, o host faz 5.000×N envios/s (~1 MB/s por cliente de subida) e seus clientes ficam com dezenas de milhares de timers vivos; o quadro do host trava (o laço `tick` e o `srvTick` dos zumbis param de acompanhar) e a partida congela para todos.
- Severidade: Alta
- Correção sugerida: balde de fichas por conexão e por tipo em `srvOnData` (antes do `switch`): `chat` 2/s com rajada 5 (mensagens acima disso são descartadas em silêncio; acima de 50/s a conexão é derrubada com `srvDrop`). Mesmo mecanismo para os demais tipos (R6–R8, R18). Jogo normal não chega perto disso.

### [R6] Flood de `shot`: 1 mensagem → até 12 explosões em cada cliente, com arma que o jogador não tem
- Arquivo e linha: `index.html` l. 5293–5297 (`case 'shot'`), 4950–4957 (`remoteShot`: `tracer` ×4 e `zBoomFx` para cada ponto de `e` quando a arma tem `splash`).
- Descrição: o host só confere `vec3(m.o)` e `isW(m.w)`; não confere se o jogador possui a arma, se está vivo, nem cadência (ao contrário de `zhit`, l. 5303–5313). `e` é cortado em 12 pontos, mas para armas com `splash` o cliente desenha uma explosão (partículas + som) por ponto. Tudo é retransmitido a N clientes pelo canal confiável.
- Cenário de exploração: `sendToHost({t:'shot', w:'<arma de splash>', o:[0,1,0], e:[12 pontos]})` em laço: cada mensagem rende 12 efeitos de explosão em cada cliente; a 200 msg/s são 2.400 explosões/s por cliente — a GPU/CPU de todos cai a poucos FPS, sem o atacante precisar de pontos, arma ou estar vivo.
- Severidade: Alta
- Correção sugerida: em `shot`, exigir `p.alive` e a mesma verificação de posse de arma usada em `zhit` (l. 5303) — no modo CS, `p.inv.primary/secondary` ou faca; limitar `e` a `wd.pellets || 1` (escopeta) e a 1 para armas de `splash`; balde por conexão de 20 tiros/s (rajada 30), bem acima da arma mais rápida (`rate` ≥ 0,05 s ≈ 20/s). Nenhuma mudança visível.

### [R7] Flood de `pos`: o canal rápido descarta por receptor, mas o host paga por mensagem e o canal confiável não descarta
- Arquivo e linha: `index.html` l. 5286–5292 (`case 'pos'`), 5066–5075 (`sendFastTo`/`broadcastFast`), 5069 (fallback para `conn.send` sem limite).
- Descrição: o cliente legítimo manda 30/s (l. 4873), mas o host aceita qualquer taxa. Por mensagem: validação, um `JSON.stringify` e N tentativas de envio. O descarte por `bufferedAmount > 32000` (l. 5068) protege a banda de cada receptor, não a CPU do host; e quando o receptor ainda não tem `fastOk` (cliente antigo ou canal rápido que não abriu), cai em `conn.send` no canal confiável, onde o PeerJS enfileira em memória sem teto (`BufferedConnection._buffer`, a confirmar) e a ordem obrigatória segura as mensagens seguintes (os "travões" do comentário em l. 5053).
- Cenário de exploração: `pos` em laço a milhares por segundo. O host gasta a maior parte do quadro em parse/stringify/envio; clientes sem canal rápido acumulam memória e atrasam todo o canal confiável (`state`, `spawn`, `kill`).
- Severidade: Média
- Correção sugerida: balde de 40 `pos`/s com rajada 60 por conexão (descartar o excesso); no fallback confiável de `sendFastTo`, não enviar se `conn.dataChannel?.bufferedAmount > 64000` (getter público na 1.5.4, a confirmar). Visível para ninguém: 30/s continua passando inteiro.

### [R8] Mensagens grandes: `JSON.parse` sem limite de tamanho nos dois canais
- Arquivo e linha: `index.html` l. 5062 (`dc.onmessage` → `JSON.parse(e.data)` no canal rápido), 5203 (`serialization: 'json'`: o PeerJS faz o parse antes de `srvOnData`), 5180 (`message-too-big` só loga).
- Descrição: o `message-too-big` do PeerJS é um erro do remetente (envio ≥ 16 KB no canal JSON), não uma proteção de recepção. Na recepção, o limite é o da SCTP negociada (≈256 KiB por mensagem no Chromium; o Firefox anuncia bem mais, a confirmar), e um cliente que fale WebRTC direto (fora do PeerJS) pode mandar esse tamanho em cada mensagem. Cada uma custa ao host um parse de centenas de KB (alguns ms) antes de qualquer validação; um JSON com 100 mil chaves ou aninhamento profundo é o pior caso. Nenhum campo retransmitido escapa das validações (`vec3`, `slice`, `cleanSk`), então o dano fica no host.
- Cenário de exploração: canal rápido `negotiated: true, id: 101` aberto pelo atacante com `send('['.repeat(1e5) + ']'.repeat(1e5))` em laço: cada mensagem custa um parse profundo (pode até estourar a pilha do `JSON.parse`, que é só um `catch`); a 100/s já come o quadro.
- Severidade: Baixa
- Correção sugerida: no canal rápido, `if (typeof e.data !== 'string' || e.data.length > 2048) return;` antes do parse (pos/ping/zs cabem em < 500 B). No canal confiável, somar `e.data.length` por segundo num `addEventListener('message')` em `conn.dataChannel` (não substitui o handler do PeerJS; a confirmar na 1.5.4) e derrubar a conexão acima de 64 KB/s — um cliente normal manda menos de 10 KB/s.

### [R9] `ts` de `pos` vem do relógio do remetente: trava as próprias posições e engana o detector de velocidade
- Arquivo e linha: `index.html` l. 5289 (`m.ts < p.posTs` rejeita), 5290 (`dt = m.ts - ts0` para `p.fastT`), 5376 (`posTs = 0` só no spawn), 5086–5095 (`netTime` nos clientes).
- Descrição: `m.ts` não é validado além de `finN` no broadcast. `ts = Infinity` passa (`Infinity && Infinity < 0` é falso) e grava `p.posTs = Infinity`: toda posição seguinte é rejeitada até o próximo spawn. Só afeta o próprio remetente (o `pid` é da conexão), então é auto-sabotagem — útil, no máximo, para "ficar parado no servidor enquanto anda no cliente", sem vantagem porque os acertos nele não dependem de posição. O uso real é o `dt` do l. 5290: com `ts` crescendo 100 s por mensagem, `dist/dt` fica minúsculo e `p.fastT` nunca marca, anulando a conferência de deslize do PhD (área de trapaça, registrado aqui por ser rede). Nos clientes, `netTime` zera o offset quando o salto passa de 5 s (l. 5090); `ts` absurdo só faz as fotos do atacante serem descartadas (l. 7631), sem travar ninguém.
- Cenário de exploração: mandar `pos` com `ts` artificial para esconder velocidade do próprio movimento.
- Severidade: Baixa
- Correção sugerida: aceitar `ts` só se `finN(m.ts)`, senão tratar como 0; se `m.ts - ts0 > 5` (salto de relógio), aceitar e reiniciar a referência; para o `dt` do detector, usar `Math.min(m.ts - ts0, (now - p.posAt) * 1.5)` — assim a rede com soluço continua perdoada, mas o relógio não pode "esticar" além de 1,5× o tempo real do host.

### [R10] `ping`/`pong`: respondido antes do `join` e ecoa `d.c` de qualquer tipo
- Arquivo e linha: `index.html` l. 5250 (`srvOnData`), 5062 (`m.t !== 'ping' || m.c`), 7625 (cliente usa `m.c` como `performance.now()`).
- Descrição: o eco é 1:1 para o mesmo peer (sem amplificação nem reflexão a terceiros, porque o DTLS prende a mensagem à conexão). `d.c > 0` aceita string numérica ou lista (`['5'] > 0`), e o valor é devolvido como está — no máximo um pouco de banda. Medir o RTT do host é inofensivo. O problema real é o pré-join (ver R4): conexões sem `pid` ganham resposta e `lastSeen`.
- Cenário de exploração: só como parte dos floods (R4/R7).
- Severidade: Baixa
- Correção sugerida: `if (d.t === 'ping') { if (conn.pid && finN(d.c) && d.c > 0 && d.c < 1e12) sendFastTo(conn, { t:'pong', c:d.c }); return; }` e balde de 5 pings/s (o cliente manda 1/s).

### [R11] Cliente que só manda `ping` fica na sala para sempre (fantasma que conta como jogador)
- Arquivo e linha: `index.html` l. 5249 (`lastSeen` em qualquer mensagem), 5545–5548 (`srvCheckTimeouts` 12 s), 7004–7005 (zumbis por jogador), 7093–7095 (`zCheckOver` exige todos caídos).
- Descrição: o timeout mede silêncio, não participação. Um "jogador" que entrou e só manda `ping` (ou `pos` fixo) ocupa vaga, aumenta a quantidade e a vida dos zumbis dos outros e, no CS, segura a rodada enquanto estiver vivo. É o mesmo comportamento de um jogador AFK, só que automatizável e sem limite (R3).
- Cenário de exploração: 10 fantasmas numa sala de zumbis → rodadas com zumbis 3–4× mais numerosos e resistentes para os jogadores reais.
- Severidade: Baixa
- Correção sugerida: expulsar quem fica 3 min sem nenhuma mensagem de jogo (`pos` que muda, `shot`, `use`…), com aviso aos 2 min — só o host decide; com o teto de jogadores de R3 o abuso já fica pequeno.

### [R12] Sequestro do id da sala quando o host perde o servidor de pareamento (host sem autenticação)
- Arquivo e linha: `index.html` l. 5155 (`new Peer(PEER_PREFIX + code)`), 5161–5172 (`unavailable-id` depois de aberta só loga; `reconnect()` com backoff até 30 s), 5203 (cliente liga pelo id), 5207 (cliente executa `onMsg` para tudo que o "host" mandar, antes mesmo do `welcome`).
- Descrição: o id da sala é público para quem está nela (código no HUD e no link `?sala=`). O servidor do PeerJS dá o id a quem registrar primeiro; se o socket do host cair (Wi-Fi, suspensão, troca de rede), o servidor libera o id e outra pessoa pode registrá-lo. O `reconnect()` do host então falha com `unavailable-id`; na 1.5.4 isso chama `disconnect()` (porque `_lastServerId` existe), que dispara `disconnected` de novo, e o host fica tentando a cada 30 s em silêncio (a confirmar o encadeamento). Os jogadores já ligados continuam com o host verdadeiro (ligação direta), mas todo mundo que entrar depois cai no impostor, que pode mandar qualquer mensagem (`welcome` com mapa inválido, `chat`, `kill`, `zover`…) — o cliente confia totalmente no host. Não há nada no `welcome` que prove quem é o host.
- Cenário de exploração: um jogador descontente anota o código, espera (ou provoca, se puder) a queda do host no pareamento, e no console roda `new Peer('tiroteio-br-v1-' + code)` com `startHost` adaptado. Quem entra pelo link vai para a sala dele. Não dá para tomar um id enquanto o socket legítimo está vivo (`ID-TAKEN`).
- Severidade: Média
- Correção sugerida: resolver de verdade exige um registro de hosts fora do PeerJS (backend). Sem backend: (1) quando o `reconnect()` devolver `unavailable-id` com `NET.online`, avisar o host na tela ("alguém pode ter tomado o código da sala") e gerar um id novo com código novo, atualizando o HUD e mandando `{t:'room', code}` aos conectados; (2) o link de convite leva um segredo do host (`?sala=CODE&h=XXXXXXXX`, 8 caracteres gerados em `startHost`) que o host repete no `welcome` e o cliente confere quando entrou pelo link (quem digita só o código fica sem a conferência, mas o link é o caminho normal). Nenhuma mudança visível para salas saudáveis.

### [R13] Reconexão no modo zumbis identificada só pelo nome: qualquer um herda os pontos e armas de quem caiu; `S.left` cresce sem teto
- Arquivo e linha: `index.html` l. 5259–5260 (join recupera `S.left.get(name)` e apaga a entrada), 5272 (`srvDrop` guarda por nome), 6981 (só zera em partida nova), 5253 (nome livre: qualquer Unicode, 16 caracteres).
- Descrição: a "sessão" de quem caiu é o nome em texto. Quem souber o nome (está no placar e no feed) entra com ele durante os 5 minutos e leva pontos, abates e inventário — e a vítima, ao voltar, começa do zero porque a entrada foi apagada. Nomes com caracteres invisíveis/homoglifos (`"Caio​"`) permitem personificação no placar sem conflito. `S.left` guarda uma entrada por nome que saiu até o fim da partida: join/leave com nomes diferentes acumula memória (pequena por entrada, mas sem limite).
- Cenário de exploração: ver no placar que "Vitor" caiu (toast "saiu"), entrar como "Vitor" e jogar com 30 mil pontos e arma melhorada; ou derrubar alguém (R5/R6 travando o host dele) e entrar no lugar.
- Severidade: Média
- Correção sugerida: no `welcome`, mandar um token aleatório (`rk`, 16 caracteres de `crypto.getRandomValues`) que o cliente guarda em `sessionStorage` e reenvia no `join`; `S.left` passa a ser chaveado pelo token, com nome só para exibição; podar entradas com mais de 5 min e limitar a 32. Normalizar o nome (`.normalize('NFKC')`, remover categorias Cf/zero-width, colapsar espaços) e recusar vazio. Reconectar continua automático e invisível para o jogador honesto.

### [R14] Enumeração de códigos de sala pela API do PeerJS
- Arquivo e linha: `index.html` l. 5131 (`genCode`: 5 símbolos de 32 ≈ 33,5 milhões), 5203 e 5211 (`peer-unavailable` para id inexistente), 459 (`PEER_PREFIX` fixo e público).
- Descrição: `peer.connect(id)` a um id que não existe devolve `EXPIRE` do servidor em uma ida e volta pelo WebSocket (~100 ms) sem abrir WebRTC, então dá para testar códigos a dezenas por segundo numa única conexão; a varredura inteira leva dias e o servidor público tem limites por IP (a confirmar), mas salas abertas por horas são encontráveis em amostragem. A descoberta de peers (`/peers`) está desligada no servidor público (a confirmar). Como não há senha nem autenticação de entrada, achar o código = entrar.
- Cenário de exploração: varrer códigos aleatórios continuamente para entrar em salas alheias com floods (R3–R7).
- Severidade: Baixa
- Correção sugerida: código de 6–7 símbolos no id do PeerJS mantendo os 5 visíveis (`PEER_PREFIX + code + sufixo` onde o sufixo é derivado do código por um hash fixo não muda nada: é público; melhor é só aumentar o código mostrado para 6, que multiplica o espaço por 32) e uma opção "sala com senha" conferida no `join` (recusa = `close`, mensagem "Conexão recusada" já existente). Com o teto de jogadores de R3 o dano de quem acha a sala cai muito.

### [R15] Scripts de CDN sem SRI e sem CSP; fallback por `document.write`
- Arquivo e linha: `index.html` l. 274 (PeerJS do unpkg), 275 (`document.write` de script cross-origin do jsdelivr), 276 (importmap do three.js), 3559 (perfis WebXR), 8174 (Firebase do gstatic por `import()`), fonte do Google Fonts no `<head>`. Não há `fetch`/`XMLHttpRequest`/`WebSocket` próprios no `index.html` (confirmado por busca); as únicas chamadas de rede são do PeerJS, do WebRTC e do SDK do Firebase.
- Descrição: TLS cobre o homem-no-meio no caminho; o que fica descoberto é a CDN comprometida ou uma conta de pacote sequestrada: as versões são fixas (`peerjs@1.5.4`, `three@0.160.0`), mas sem `integrity` o navegador aceita o que a CDN mandar — e esse script tem acesso total à página (sessão do Firebase, credencial do TURN, mensagens de todos os jogadores via host). Sem CSP, nada limita de onde scripts e conexões podem vir. O `document.write` de script síncrono cross-origin é bloqueado pelo Chrome em conexões lentas (intervenção de 2G) e seria bloqueado por qualquer CSP sem `'unsafe-inline'`.
- Cenário de exploração: comprometimento do unpkg/jsdelivr (ou do pacote `peerjs` no npm, que o unpkg serve): o script malicioso roda em todos os jogadores, rouba o token do Firebase e grava o que quiser em `players/{uid}`.
- Severidade: Média
- Correção sugerida: `integrity="sha384-…" crossorigin="anonymous"` nas tags do PeerJS (as duas) e do perfil WebXR; para o importmap, a chave `"integrity"` do mapa (Chrome 127+, ignorada nos demais: proteção parcial); trocar o `document.write` por `document.createElement('script')` com o mesmo `integrity`. `<meta http-equiv="Content-Security-Policy">` (GitHub Pages não manda cabeçalhos) com `default-src 'self'; script-src 'self' https://unpkg.com https://cdn.jsdelivr.net https://www.gstatic.com 'sha256-<hash dos inline>'; connect-src 'self' wss://0.peerjs.com https://*.googleapis.com https://*.firebaseio.com https://cdn.jsdelivr.net https://www.gstatic.com; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; worker-src 'self' blob:` (ajustar testando: o Firebase Auth por popup precisa de `frame-src https://tiroteio-237ee.firebaseapp.com`). Invisível para o jogador quando acertado; um `integrity` errado quebra o carregamento, então validar com o teste de caracterização.

### [R16] HTTPS, `file://` e conteúdo misto (informativo)
- Arquivo e linha: `index.html` l. 5155/5194 (`new Peer` sem `host`), 5049 (`turn:…:80` sem TLS), `tools/*.js` (`POST http://127.0.0.1:8799`, só desenvolvimento).
- Descrição: na 1.5.4, quando o `host` é o padrão (`0.peerjs.com`) o PeerJS força `secure: true` (wss) independentemente da origem (a confirmar; se não forçar, em `file://` cairia em `ws://…:443` e a sala não abriria). `RTCPeerConnection` não exige contexto seguro, então abrir o `index.html` por `file://` funciona para jogar (o Firebase Auth por popup não, porque a origem é `null`). Em `https://` não há conteúdo misto: tudo é `https`/`wss`; `turn:` em porta 80 não é "conteúdo" (é transporte do ICE), e o que passa pelo relay já vai cifrado por DTLS — o TURN só vê o HMAC da credencial, nunca a senha nem o jogo. `127.0.0.1` é origem "potencialmente confiável", então os `tools/*.js` tampouco geram conteúdo misto.
- Cenário de exploração: nenhum; registrado para fechar a pergunta.
- Severidade: Baixa
- Correção sugerida: nenhuma obrigatória. Opcional: `turns:` apenas (TLS 443) para esconder o username do TURN de quem observa a rede local, com custo pequeno de conexão.

### [R17] Replay de mensagens (informativo): sem nonce, mas o transporte já impede terceiros
- Arquivo e linha: `index.html` l. 5283–5345 (`srvHandle` não tem contador nem nonce).
- Descrição: o DataChannel roda sobre DTLS, que tem proteção anti-replay por registro, e o `pid` vem da conexão (l. 5266), não da mensagem: um terceiro não consegue capturar e reinjetar nada. "Replay" aqui é só o próprio remetente mandar de novo, o que é idêntico a mandar uma mensagem nova — e as que têm efeito cumulativo já são tratadas no servidor: `zhit` tem balde de cadência (l. 5309–5312), `nade` desconta estoque (l. 5341), `use`/`door`/`perk` são idempotentes por estado (`Z.doors.has`, `p.perks.includes`), `buy` passa por dinheiro. As que não têm freio (`chat`, `shot`, `pos`, `skins`, `selfdmg`) são os floods de R5–R8/R18, não replay.
- Cenário de exploração: nenhum além dos floods.
- Severidade: Baixa
- Correção sugerida: nenhuma específica; os baldes por conexão de R5 cobrem.

### [R18] `skins` e `selfdmg` em laço: custo limitado, mas sem freio
- Arquivo e linha: `index.html` l. 5339 (`skins` → `cleanSk`, `S.skDirty`), 5538–5540 (`state` completo com skins quando `skDirty`), 5321 (`selfdmg` até 100 por mensagem, sem cadência).
- Descrição: `skins` em laço só custa `cleanSk` (≤ 80 entradas, l. 8150) por mensagem e faz o próximo `state` (no máximo 4/s) ir com as skins de todos — amplificação limitada pelo relógio do `state`. `selfdmg` não é rede, mas está no mesmo `switch` sem cadência: um cliente pode se matar a qualquer momento (igual a `suicide`), sem ganho.
- Cenário de exploração: ruído de CPU no host, pequeno.
- Severidade: Baixa
- Correção sugerida: balde de 1 `skins`/s e 5 `selfdmg`/s por conexão, dentro do mesmo limitador de R5.

## Resumo

| Id | Severidade | Título |
|---|---|---|
| R1 | Média | Credencial do TURN fixa no código (abuso da cota e uso como relay) |
| R2 | Baixa | Exposição do IP público dos jogadores (inerente ao WebRTC) |
| R3 | Alta | Sem limite de jogadores: flood de `join` custa O(N²) e quebra o `state` de todos (> 16 KB) |
| R4 | Média | Conexões abertas sem `join` nunca expiram nem contam (teto de `RTCPeerConnection` do navegador) |
| R5 | Alta | Flood de `chat`: amplificação ×N no canal confiável, sem limite por conexão |
| R6 | Alta | Flood de `shot`: até 12 explosões por mensagem em cada cliente, com arma que o jogador não tem |
| R7 | Média | Flood de `pos`: host paga por mensagem; fallback no canal confiável não descarta |
| R8 | Baixa | Mensagens grandes: `JSON.parse` sem limite de tamanho nos dois canais |
| R9 | Baixa | `ts` de `pos` do relógio do remetente: trava as próprias posições e engana o detector de velocidade |
| R10 | Baixa | `ping`/`pong` respondido antes do `join` e ecoa `d.c` de qualquer tipo |
| R11 | Baixa | Cliente que só manda `ping` fica na sala para sempre (fantasma que conta como jogador) |
| R12 | Média | Sequestro do id da sala quando o host perde o pareamento (host sem autenticação) |
| R13 | Média | Reconexão no modo zumbis só pelo nome: herança de pontos/armas de outro; `S.left` sem teto |
| R14 | Baixa | Enumeração de códigos de sala pela API do PeerJS |
| R15 | Média | Scripts de CDN sem SRI e sem CSP; fallback por `document.write` |
| R16 | Baixa | HTTPS, `file://` e conteúdo misto (informativo: sem problema encontrado) |
| R17 | Baixa | Replay (informativo): sem nonce, mas o DTLS e o `pid` da conexão impedem terceiros |
| R18 | Baixa | `skins` e `selfdmg` em laço: custo limitado, mas sem freio |

Prioridade de correção: um limitador por conexão e por tipo em `srvOnData` (fecha R5, R6, R7, R8, R10, R18 de uma vez), teto de jogadores e timeout pré-join (R3, R4), token de reconexão (R13), SRI + CSP (R15), credencial temporária do TURN (R1, precisa de backend mínimo), aviso/troca de código ao perder o id (R12).

