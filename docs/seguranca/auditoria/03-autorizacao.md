# Auditoria de segurança — 03 Autorização

Dan of Duty (`index.html`, branch `security-hardening`, 02/10/2026). Área: controle de acesso, IDOR, escalonamento e ações sem proteção. Somente leitura; linhas conferidas no código.

Contexto confirmado: `srvHandle(pid, m)` (l. 5283) recebe sempre o `pid` da conexão (`srvOnData`, l. 5266: `srvHandle(conn.pid, d)`); o cliente não escolhe o próprio id (l. 5252) e nenhum ramo lê um "remetente" de dentro da mensagem. O que falha é o que o host **não** confere sobre o alvo e sobre a situação de quem manda.

### [Z1] Perfil (XP, caixas, skins) gravado pelo próprio cliente no Firestore, sem validação de conteúdo
- Arquivo e linha: `index.html` l. 8160–8169 (`profSave`), 8193 (`setDoc` na criação), 8151–8156 (`cleanProf`, só na leitura); `README.md` l. 138–146 (regras).
- Descrição: a regra `allow read, write: if request.auth.uid == uid` só restringe **quem** grava, não **o quê**. `profSave` faz `setDoc(..., { ...PROF.data, name, upd }, { merge: true })` com o objeto inteiro vindo da memória do cliente. Qualquer usuário autenticado pode gravar `xp`, `cases`, `items` (todas as skins), `equipped` e campos extras arbitrários (até 1 MiB por documento) usando o SDK do Firebase com a `FIREBASE_CONFIG` pública (l. 8129) ou alterando `__T.PROF.data` no console (exposto em l. 8561).
- Cenário de exploração: no console, `__T.PROF.data.cases = 9999; __T.PROF.data.items = [...]` seguido de qualquer ação que chame `profSave` (equipar skin, l. 8244). Ou, em qualquer página, `initializeApp(config)` + `signInWithEmailAndPassword` + `setDoc(doc(db,'players',uid), {cases: 1e6, items: [...todas]})`. `cleanProf` aceita tudo que for número ≥ 0 e skin existente, então o valor "vale" na próxima leitura.
- Severidade: Alta (toda a economia de skins/caixas pode ser forjada por qualquer conta; não afeta outros usuários nem dados deles).
- Correção sugerida: sem mudar a funcionalidade visível, endurecer as regras do Firestore: `request.resource.data.keys().hasOnly(['xp','cases','items','equipped','opened','name','upd','created'])`, tipos (`is int`/`is list`/`is map`), `items.size() <= N` (nº total de skins), `name.size() <= 32`, `cases >= 0`, e `xp` entre 0 e `XP_CASE`. Para impedir o incremento arbitrário de `cases`/`items` é preciso um escritor confiável (Cloud Function que recebe o resultado da partida e credita XP, ou que faz o sorteio da caixa): isso muda a arquitetura (hoje não há backend) e deve ser decidido com o dono. Como paliativo, limitar nas regras o crescimento por gravação (`request.resource.data.cases <= resource.data.cases + 3`, `items.size() <= resource.data.items.size() + 3`), o que torna a fraude lenta em vez de impossível.

### [Z2] XP e caixas calculados no cliente a partir de mensagens do host (confiança total no host e em `onMsg`)
- Arquivo e linha: `index.html` l. 7651 (`zdie`, `by === C.myId`), 7670 (`zrend`), 7715 (`zrevive`), 7723 (`zover`, `30 + 8*m.r` sem teto), 7737 (`mend`), 7742 (`kill`), 8221–8227 (`grantXP`), 8560 (`onMsg` e `broadcast` em `window.__T`).
- Descrição: o host é um jogador qualquer e `broadcast` chega ao próprio `onMsg` (l. 5138). Nenhuma mensagem é verificável: o cliente credita XP pelo que recebe. Nem é preciso ser host: `__T.onMsg({t:'zover', r: 1e7})` ou `__T.onMsg({t:'mend', w: __T.C.myId})` no console credita XP e caixas localmente, e `grantXP` chama `profSave` (Z1).
- Cenário de exploração: jogador cria sala de zumbis sozinho e roda no console `for(;;) __T.onMsg({t:'zdie', id: 0, by: 'h', hs: 1, k: 6})`; cada chamada dá 5 + XP do chefe; a cada 300 XP uma caixa. Host editado também pode mandar `mend`/`kill` com `k` igual ao id de um cúmplice.
- Severidade: Alta (mesmo impacto de Z1; é o caminho "legítimo" para forjar progresso).
- Correção sugerida: curto prazo, tirar `onMsg`, `broadcast`, `grantAllSkins`, `PROF`, `srvBuy`, `srvZUse`, `zHit` de `window.__T` em produção (expor só quando `location.hostname` for `localhost`/`127.0.0.1` ou com `?debug` e um flag de build dos testes) e pôr tetos em `grantXP` por partida (ex.: `zover` limitado a `Z.round` plausível, `m.r <= 200`). Médio prazo, o mesmo de Z1: só um escritor confiável resolve de fato.

### [Z3] Privilégio de "dono" (todas as skins) decidido no cliente e exposto no console; e-mail pessoal no código
- Arquivo e linha: `index.html` l. 8138 (`OWNERS`), 8139–8146 (`grantAllSkins`), 8197 (chamada após o login), 8561 (`grantAllSkins` em `window.__T`).
- Descrição: a checagem `OWNERS.includes(email)` roda no navegador do usuário, e a função que concede as skins é pública: qualquer conta logada executa `__T.grantAllSkins()` no console e recebe `profSave(true)` com as 100% das skins no Firestore. Além disso o e-mail do autor fica em um repositório/site público (dado pessoal, alvo para phishing de "conta do dono").
- Cenário de exploração: entrar com qualquer conta → F12 → `__T.grantAllSkins()` → "Conta do dono: todas as N skins liberadas." gravado na nuvem.
- Severidade: Média (impacto cosmético igual a Z1, mas de execução trivial e com exposição de dado pessoal).
- Correção sugerida: tirar `grantAllSkins` de `window.__T`; substituir a lista de e-mails por um campo no documento do jogador que só o administrador do projeto grava pelo console do Firebase (ex.: `players/{uid}.owner = true`, e nas regras `request.resource.data.owner == resource.data.owner` para o usuário não se promover) ou por um custom claim do Firebase Auth. Sem funcionalidade visível alterada: o dono continua recebendo tudo ao entrar.

### [Z4] `hit` (x1 e mata-mata): dano a qualquer jogador sem linha de visão, distância, munição ou cadência
- Arquivo e linha: `index.html` l. 5324–5328 (`case 'hit'`), 5346–5356 (`srvDamage`), 5357–5363 (`srvKill`).
- Descrição: o host só confere modo ≠ zumbis, atacante vivo (ou morto há < 0,6 s), fase ≠ `freeze`, `m.v !== pid` e `clamp(dmg, 0, 500)`. Não confere se a vítima está ao alcance, visível, se a arma `m.w` está no inventário, se há munição ou intervalo entre tiros. `m.z === 'head'` é aceito sem prova (ignora colete sem capacete, l. 5350, e conta headshot). Fases `warmup`, `live`, `end` e `over` aceitam: abates em `end`/`over` ainda somam `kills` e dinheiro (l. 5360, só exclui `warmup`).
- Cenário de exploração: cliente modificado manda `{t:'hit', v:'p2', dmg:500, z:'head', w:'awp'}` a cada frame para cada id de `C.players`: mata todos os adversários do mapa inteiro, sem apontar, inclusive 0,6 s depois de morrer. Em "rodadas" só o time inimigo (l. 5348) e nunca a si mesmo (l. 5327): confirmado. Bots também são alvos válidos (não é indevido).
- Severidade: Alta (afeta diretamente os outros jogadores em toda partida PvP).
- Correção sugerida: no host, validar o acerto como já se faz em `zhit`: (a) distância entre `p.pos` e `v.pos` ≤ alcance da arma; (b) `losClear` (já existe, usado em l. 7502) entre olhos do atacante e tronco da vítima, com folga para latência; (c) `m.w` tem de estar em `p.inv` (ou ser `knife`), `dmg` ≤ `W[w].dmg * head * pellets * 1.1` como em l. 5304; (d) balde de cadência por arma igual ao de l. 5309; (e) recusar em `end`/`over`. Visível só para quem trapaceava; jogador honesto não muda.

### [Z5] `zhit`: zumbi em qualquer lugar do mapa, zona e splash decididos pelo cliente
- Arquivo e linha: `index.html` l. 5298–5318 (`case 'zhit'`), em especial 5302 (`Z.zs.get(+m.v)` sem distância), 5305 (distância só para a faca), 5314 (`m.z`, `m.sp` livres).
- Descrição: o host confere arma no inventário, teto de dano, cadência por zumbi e por arma, mas aceita **qualquer** `m.v` existente em `Z.zs`, atrás de parede ou do outro lado do mapa, e aceita `z:'head'` (mais pontos, +XP em `zdie` l. 7651) e `sp` em todo tiro. Um cliente modificado atira "legalmente" (dentro do teto e da cadência) em zumbis que nunca viu, sempre na cabeça, sem risco.
- Cenário de exploração: a cada quadro, para o zumbi mais perto de qualquer colega, enviar `{t:'zhit', v: id, dmg: cap, z:'head', w: G.cur}`; farma pontos no ritmo máximo da arma durante a rodada inteira sem sair do spawn; combinado com Z2, XP ilimitado "legítimo".
- Severidade: Média (afeta a partida cooperativa; o teto e a cadência limitam o ritmo).
- Correção sugerida: para armas sem `splash`/`chain`/`thunder`: distância `p.pos`→`z.body.pos` ≤ alcance da arma (ou 60 m) e `losClear` da cabeça do jogador ao tronco do zumbi (função já usada em l. 7502), com folga de 1 m/`NET.rtt`; para `head`, exigir que o `pitch`/direção registrada em `p.yaw/p.pitch` (l. 5291) aponte para o zumbi dentro de um cone (ex.: 25°). Sem efeito para o jogador honesto.

### [Z6] Autorização por proximidade construída sobre a posição que o próprio cliente informa
- Arquivo e linha: `index.html` l. 5286–5292 (`pos`: só finito e < 1e4; l. 5290 apenas **marca** `fastT`, não recusa); usos: `near()` l. 7420 (porta 7424, parede 7429, bebida 7442, caixa 7451/7460, PaP 7470/7480, energia 7483, armadilha 7485), `hold` l. 7534/7540, `zclay` l. 7340, `nade` l. 5341, `bomb` l. 5334–5335.
- Descrição: toda a verificação de "está perto do objeto/colega" compara com `p.pos`, que o cliente define livremente (teleporte de 1 mensagem). Portanto um jogador pode: abrir qualquer porta do mapa (gastando pontos) sem chegar lá; reanimar um colega caído do outro lado do mapa (`hold rev` com `m.id` do colega, l. 7539–7544, cuja única exigência além de `t.downed` é 2,4 m); comprar bebida/arma/PaP/caixa de qualquer ponto; plantar/desarmar a bomba fora do bomb mandando `pos` dentro do site; pôr Claymore e jogar granada "a partir" de onde quiser. O dado do alvo (`m.id`) em si está bem validado (objeto existe, estado correto, usuário da caixa/PaP é o mesmo, l. 7460/7480); o que falha é a premissa.
- Cenário de exploração: `__T.sendToHost({t:'pos', p:[xPorta, 0, zPorta], y:0, pi:0}); __T.sendToHost({t:'use', k:'door', id:'D3'}); __T.sendToHost({t:'pos', p: posReal, ...})` entre dois quadros. Para reanimação remota: `pos` ao lado do caído + `hold rev` 14×/s (l. 7543 soma até 0,3 s por chamada).
- Severidade: Média (quebra o progresso cooperativo e o x1; depende do achado de validação de movimento, provavelmente registrado na área de entrada de dados).
- Correção sugerida: no `pos`, recusar (ou segurar na última posição válida) deslocamento acima de `vMax * dt + folga` (l. 5290 já calcula a velocidade: basta trocar `p.fastT = now` por um `return` quando passar de, p. ex., 12 m/s, com tolerância para o `spawn`, `sq`) e, para `hold`/`use`/`bomb`, usar a **posição de 300 ms atrás** (histórico curto) em vez da atual, para que o teleporte de um quadro não conte. Sem efeito visível para jogador honesto; corrigir aqui cobre todos os ramos de uma vez.

### [Z7] Host como autoridade única e sem verificação; funções do servidor expostas em `window.__T`
- Arquivo e linha: `index.html` l. 5132–5139 (`sendToHost`/`broadcast`: o host chama `srvHandle` e `onMsg` direto), 8462–8466 (`btnApply`: checagem `NET.isHost` só no cliente), 5393 (`srvStartMatch`), 8560–8562 (`window.__T` com `S`, `Z`, `srvBuy`, `srvStartMatch`, `broadcast`, `srvZUse`, `srvZHold`, `zHit`, `zHurt`, `zStartRound`...).
- Descrição: por desenho, quem cria a sala roda o servidor; os outros não têm como auditar nada. O host pode editar `__T.S.players.get('p2').hp = 0`, `__T.srvBuy(__T.S.players.get('h'), 'awp')` (ignora fase e dinheiro? não: `srvBuy` ainda confere, mas `S.players.get('h').money = 1e6` antes resolve), mandar `broadcast({t:'kill', k:'h', v:'p2'})` ou `{t:'msg'}`/`{t:'chat', id:'p2', txt:...}` falando em nome de outro (o cliente só usa `m.id` para o nome, l. 7752), trocar modo/mapa a qualquer momento (`btnApply`) e expulsar fechando a conexão. A checagem `!NET.isHost` em `btnApply` é inócua para segurança (um cliente que a burle só altera o `S` local, que ninguém lê). Não há kick, ban nem moderação para os demais se defenderem.
- Cenário de exploração: host trapaceiro em x1: `__T.S.players.get('h').hp = 1e9` (nunca morre) ou, nos zumbis, `for (const p of __T.S.players.values()) if (p.id !== 'h') __T.zHurt(p, 100)` (derruba todos; `zHurt` está exposto em l. 8561).
- Severidade: Média (limitação arquitetural aceita no mapa §6; vira Alta quando combinada com Z1/Z2, porque o host malicioso transforma vantagem de partida em progresso permanente para si e cúmplices).
- Correção sugerida: sem servidor próprio não há como tirar a autoridade do host. Mitigações sem mudar o jogo: (1) `window.__T` só fora de produção (ver Z2); (2) mostrar aos jogadores quem é o host (já aparece o código da sala; acrescentar "sala de <nome>") e um botão "sair" visível para quem desconfiar (já existe `btnLeave`); (3) não deixar que mensagens do host gerem progresso persistente (Z1/Z2). Qualquer coisa além disso (servidor relé com autoridade) exige mudança de funcionalidade e deve ser decidida pelo dono.

### [Z8] Campos repassados no `broadcast` sem conferir inventário ou situação (`shot`, `pos.w`)
- Arquivo e linha: `index.html` l. 5293–5297 (`shot`: `m.w` só `isW`, `m.o`/`m.e` só `vec3`, sem cadência nem munição), 5291–5292 (`pos`: `m.w` só `isW`, vira `p.w` e vai a todos), 5340–5341 (`nade`: bem validado: estoque, 4 m, |v| ≤ 30), 5342 (`chat`: `id: pid` da conexão — confirmado, não dá para fingir ser outro).
- Descrição: o host repassa `shot` com qualquer arma do catálogo (inclusive `_pap`, `dmach`, `thunder`), com origem `o` e pontos `e` arbitrários (até 12), em qualquer fase e mesmo morto/caído (não há `p.alive`). Os clientes desenham rastros, sons e marcas (`remoteShot`, l. 7746) de uma arma que o jogador não tem, de qualquer lugar do mapa, em qualquer ritmo. `pos.w` muda a arma que os outros veem na mão. `p.shotT` (l. 5296) é marcado por `shot` sem checagem e alimenta o Electric Cherry (l. 7497): manda `shot` e logo `zfx ch` sem ter atirado de verdade (ainda exige a bebida e 2,5 s).
- Cenário de exploração: cliente modificado faz `setInterval(() => __T.sendToHost({t:'shot', w:'thunder', o:[0,50,0], e:[[0,0,0],...]}), 5)`: barulho e flashes contínuos em todos os clientes (incômodo/DoS visual), sem gastar nada. Em x1, `shot` com `e` apontando para longe do alvo real enquanto `hit` (Z4) acerta, para esconder a trapaça de quem assiste.
- Severidade: Baixa (só efeitos visuais/sonoros; o dano real passa por `hit`/`zhit`).
- Correção sugerida: em `shot`, exigir `p.alive && !p.downed`, `m.w === 'knife' || zHas(p, m.w) || p.inv.primary/secondary === m.w` e um balde de cadência por arma igual ao de `zhit` (l. 5309–5312, extraído para uma função reutilizável); em `pos`, aceitar `m.w` só se estiver no inventário. Sem efeito visível para jogador honesto.

### [Z9] `skins`: jogador anuncia aos outros skins que não possui
- Arquivo e linha: `index.html` l. 5339 (`case 'skins'`: `cleanSk(m.sk)`), 5254 (`join`: `cleanSk(d.sk)`), 8150 (`cleanSk` só confere arma e skin existentes), 5524 (`sk` vai no `state` a todos), 4918 (`setRemoteGun` desenha).
- Descrição: a posse é verificada só no cliente (`equipItem`, l. 8242); o host aceita qualquer combinação válida do catálogo (até 80 entradas) e repassa no `state`. Como o produto da economia (Z1) é justamente mostrar a skin aos outros, isso esvazia o valor das caixas sem precisar nem de conta.
- Cenário de exploração: `__T.sendToHost({t:'skins', sk:{ak47:'<id lendária>', _faca:'karambit'}})` — todos veem a skin lendária e a karambit.
- Severidade: Baixa (cosmético; impacto econômico igual ao de Z1, que já permite o mesmo com conta).
- Correção sugerida: só resolve de verdade com o perfil validado por um escritor confiável (Z1) e o host lendo `players/{uid}` (as regras hoje só deixam o próprio uid ler: seria preciso `allow read: if request.auth != null` para um subdocumento público `players/{uid}/public/skins`). Sem isso, documentar como limitação aceita.

### [Z10] Ações aceitas em situação/fase indevida: `suicide` sem fase e `hit` em `end`/`over`
- Arquivo e linha: `index.html` l. 5343 (`suicide`: só `p.alive`), 5357–5362 (`srvKill`), 7015 (quem morreu volta na rodada seguinte), 5324–5328 e 5360 (`hit`/`srvKill` em `end`/`over` contam abate e dinheiro).
- Descrição: (a) `suicide` existe para a queda no vazio (l. 4869) mas é aceito em qualquer modo e fase: nos zumbis, um jogador **caído** (`alive` continua `true`, l. 7079) manda `suicide`, "morre" na hora sem esperar os 45 s de sangramento, pula a chance de reanimação e volta na próxima rodada (l. 7015), além de gerar um `kill` com `w:'world'` no feed dos zumbis; em "rodadas", suicídio durante `freeze`/`live` derruba a bomba (l. 5359) e ajuda o time contrário sem punição (só `deaths++`). (b) `hit` não é recusado em `end`/`over`: abates depois do fim da rodada somam `kills` e dinheiro (`S.phase !== 'warmup'`, l. 5360); a rodada seguinte respawna todos (l. 5414–5419), então o efeito fica no placar e no dinheiro.
- Cenário de exploração: cúmplices em "rodadas" se matam entre si durante `end` para acumular `kills`/dinheiro (`W[w].reward` por abate) antes da próxima rodada; nos zumbis, caído sem ninguém perto, `suicide` para voltar inteiro na rodada seguinte em vez de sangrar (vantagem pequena).
- Severidade: Baixa.
- Correção sugerida: `suicide` só com `p.alive && !p.downed && S.phase !== 'over'` e, nos zumbis, tratar como `zDown` (cair) em vez de `srvKill`; em `hit`, recusar quando `S.phase === 'end' || S.phase === 'over'` (as armas já não disparam no cliente nessas fases, então nada muda para o jogador honesto).

### Conferido e sem achado (para registro)
- `chat` (l. 5342): id sempre o `pid` da conexão; texto cortado em 120 e escapado no cliente (l. 7752). Não há como falar em nome de outro, salvo pelo host (Z7).
- `use boxtake`/`paptake` (l. 7460, 7480): exigem `Z.box.user`/`Z.pap.user === p.id` e estado `offer`/`ready`; `pap` (l. 7472) exige `has(w)` e arma melhorável; `zGive` com `m.cur` arbitrário (l. 7407) só escolhe entre os slots do próprio jogador.
- `use door/wall/perk/trap` (l. 7424, 7429, 7442, 7485): objeto tem de existir, `trap` exige inteiro; pagamento por `zPay` (l. 7281); limites de bebidas, granadas e Claymores aplicados.
- `use box` com `m.c` (l. 7453): o campo é só uma proteção a favor do jogador (preço visto); enviar `c: 0` apenas renuncia a ela.
- `buy` (l. 5482–5498): fase, dinheiro, slot e time (`kit`) conferidos; nos zumbis `S.phase === 'zombies'` (l. 6992) cai em "Tempo de compra acabou" (l. 5487), então não dá para comprar arma de CS no cooperativo.
- `bomb` (l. 5329–5337): plantar só quem carrega (`B.by === pid`) dentro do site; desarmar só `ct` a < 2 m.
- `zfx` (l. 7494–7512) e `zclay` (l. 7336–7345): bebida, intervalo, estoque, sala e visibilidade conferidos.
- `hit` em si mesmo (l. 5327) e fogo amigo em "rodadas" (l. 5348) recusados; `hit` nos zumbis recusado (l. 5325).
- `join` (l. 5251): só uma vez por conexão; `nade` (l. 5340–5341): estoque, distância e velocidade.

## Resumo

| Id | Severidade | Título |
|---|---|---|
| Z1 | Alta | Perfil (XP, caixas, skins) gravado pelo cliente no Firestore sem validação de conteúdo |
| Z2 | Alta | XP e caixas calculados no cliente a partir de mensagens do host (`onMsg` exposto) |
| Z3 | Média | Privilégio de "dono" (todas as skins) decidido no cliente e exposto no console; e-mail no código |
| Z4 | Alta | `hit` PvP sem linha de visão, distância, munição ou cadência; zona `head` livre |
| Z5 | Média | `zhit` em zumbi em qualquer lugar do mapa; zona e splash decididos pelo cliente |
| Z6 | Média | Autorização por proximidade (portas, lojas, reanimar, bomba) sobre posição informada pelo cliente |
| Z7 | Média | Host como autoridade única sem verificação; funções do servidor em `window.__T` |
| Z8 | Baixa | `shot`/`pos.w` repassados sem conferir inventário, vida ou cadência |
| Z9 | Baixa | `skins`: anunciar skins não possuídas |
| Z10 | Baixa | `suicide` sem fase/estado e `hit` aceito em `end`/`over` |
