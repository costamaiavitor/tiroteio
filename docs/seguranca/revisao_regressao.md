# Revisão de regressão (fase 3) — endurecimento de segurança do Dan of Duty

Data: 02/10/2026. Branch `security-hardening` em `C:\dev\tiroteio-seguranca`, HEAD `c8e1e9a` (fase 2: V01…V22 + `vendor/` e CSP). Linha de base: fase 0, commit `7bb7797` (15 testes de caracterização passando, sem build nem lint). Nada do jogo nem dos testes foi editado nesta revisão; só este relatório e scripts descartáveis no scratchpad.

Ambiente da revisão: Windows 11, i5-13420H (12 threads), Chromium headless do Playwright 1.63 com SwiftShader. A máquina estava compartilhada durante toda a revisão (vários processos `claude` e o OneDrive em 50–60 % de CPU sem nenhum teste rodando), então **todos os tempos abaixo são maiores que os da fase 0** (lá: suíte inteira em ~45 s; aqui: a primeira carga do jogo sozinha leva 43–53 s). Os arquivos de teste foram rodados um por vez, nunca em paralelo entre si. Porém, às 14:48 **outra sessão** iniciou `node --test …/scratchpad/adversarial/adv-zumbis.test.mjs` (PID 7268, fora do meu controle), cujo Chromium headless com SwiftShader consumiu ~3 núcleos contínuos durante o resto da revisão (5.000 s de CPU acumulados às 15:30); além disso o Chrome normal do usuário tinha 16 processos abertos. Isso explica a lentidão extrema (requisições locais de texturas levando minutos) e contamina todos os tempos a partir de então; os resultados de passa/falha continuam válidos, os tempos não são comparáveis aos da fase 0.

## 1. Resultado dos testes automáticos

Comando: `node --test tests/<arquivo>.test.mjs`, um arquivo por vez.

| Arquivo | Testes | 1.ª rodada | 2.ª rodada | Observação |
|---|---:|---|---|---|
| `tests/caracterizacao.test.mjs` | 15 | 14 passam, 1 falha (`mata-mata: hit em bot…`) | 14 passam, 1 falha (o mesmo) | falha **firme** (2/2), mas em `page.goto` da recarga — ver §1.1 |
| `tests/seguranca-host.test.mjs` | 16 | 13 passam, 3 falham (`zumbis: sala` + os 2 que dependem dela), 132 s, máquina disputada | **15 passam, 1 falha** (`V02 pos: andar normal…`), 22,5 s, máquina livre | 1.ª: `page.goto` da recarga (§1.1); 2.ª: as 3 da recarga passaram e apareceu uma falha **intermitente** nova, que só ocorre com a máquina rápida (§1.2) |
| `tests/seguranca-rede.test.mjs` | 11 | 11 passam (112 s) | — | sem falha |

Totais: 42 testes; 1.ª rodada 38 ✔ / 4 ✖; 2.ª rodada (caracterização + host) 29 ✔ / 2 ✖. Nenhuma falha é de regra do jogo: as duas causas são sensibilidade ao tempo real do ambiente (§1.1 e §1.2).

Lista por teste (1.ª rodada):

- `caracterizacao.test.mjs`: 14 × ✔ (`zumbis: sala criada offline…` 53,6 s; `zumbis: a rodada 1 começa…`; `zhit` ×3; `use/door`, `use/perk`, `use/wall`; `pos`; `chat`; `selfdmg`; `nade`; `skins`; `perfil local`) e ✖ `mata-mata: hit em bot aplica o dano e kill soma abate` — `page.goto: Timeout 30000ms exceeded … waiting until "load"` (l. 178, a recarga da mesma aba antes de criar a segunda sala; o corpo do teste nem chegou a rodar).
- `seguranca-host.test.mjs`: 13 × ✔ (sala com 2 bots 49,7 s; V01 hit ×6; V02 pos ×5; V17 anomalias) e ✖ `zumbis: sala` (l. 97, o mesmo `page.goto` de recarga, 30 s) → ✖ `V02 pos (zumbis)` e ✖ `V03 zhit (zumbis)` falham em cascata (a sala de zumbis não existe).
- `seguranca-rede.test.mjs`: 11 × ✔ (`zumbis: sala criada` 50,7 s; V22 join; V05 join/ping/chat/teto; V11 reentrada; V04 shot; V03 zhit ×2; V19 suicide). Este arquivo não recarrega a aba.

### 1.1 A única falha: recarregar a aba com uma sala aberta demora mais de 30 s até `load`

Os dois testes que falham (`caracterizacao` l. 178 e `seguranca-host` l. 97) fazem a mesma coisa: com uma sala aberta na aba, `page.goto(url, { waitUntil: 'load' })` para recarregar e criar outra sala. O `goto` estoura o limite padrão de 30 s do Playwright antes de o corpo do teste rodar. Para saber se é regressão do jogo ou do ambiente, rodei um diagnóstico no scratchpad (`diag-reload.mjs`: mesmo `abrirJogo`/`criarSala` de `tests/_jogo.mjs`, limites de 120 s, registro de diálogos, frames e tempo de cada requisição):

- Primeira carga até o jogo pronto: 51,6 s. `criarSala` (zumbis/Sanatório): **380 s** neste ambiente, porque logo depois de entrar no mapa o jogo baixa os modelos glTF e texturas de todas as armas do modo CS (`assets/fps/w/*/scene.gltf`, `fpLoad`, código de `c6db026`, anterior à fase 0) e, com SwiftShader e a CPU disputada, cada `fetch` **local** levou de 15 s a 398 s (ex.: `assets/fps/w/spas/scene.gltf` 397,7 s; `assets/fps/ak/scene.bin` 277,6 s). Ou seja, a thread principal da página fica saturada por minutos.
- Na recarga: o diálogo `beforeunload` do jogo (handler idêntico na fase 0: `window.onbeforeunload = e => { …; e.preventDefault(); return ''; }` em `enterGame`) só apareceu **32 s** depois do `goto` (a página demorou tudo isso para processar o evento), o documento novo levou 49,4 s e `load` disparou aos 104 s; o jogo ficou pronto de novo aos 144 s, com **0 `pageerror`**. O Playwright 1.63 aceita `beforeunload` sozinho quando não há listener (`playwright-core/lib/coreBundle.js` l. 62287: `if (dialogObject.type() === "beforeunload") dialog.accept(...)`), então o diálogo em si não bloqueia a navegação, nem na fase 0 nem agora; o que bloqueia é a página ocupada.
- `git diff 7bb7797 HEAD -- index.html` (+280/−83 linhas) não toca o carregamento de modelos nem o laço de renderização: as únicas linhas mudadas com `GLTFLoader`/`fpLoad`/`loadAsync` são o caminho das mãos (`./vendor/webxr-generic-hand@1.0.20/` no lugar do jsDelivr).

Conclusão do §1.1: **não é regressão do jogo**. É sensibilidade ao tempo de carga (a tarefa já previa "testes sensíveis ao tempo de carga do mapa"): o limite de 30 s do `goto` só é atingido porque a máquina está disputada (o mesmo teste passou 15/15 na fase 0 na máquina livre). A reprodução é determinística neste ambiente (2/2 em `caracterizacao`, 1/1 em `seguranca-host`), mas o corpo dos três testes afetados foi exercitado de outra forma: o `mata-mata` equivalente passa em `seguranca-host` (V01 ×6, com o mesmo `criarSala` de 2 bots), e `V02 pos (zumbis)`/`V03 zhit (zumbis)` têm gêmeos em `seguranca-rede` (V03 zhit ×2, todos passando) e na fumaça do §3 (`pos:fora` e `zhit` com visão). Sugestão para a fase 4 (não aplicada aqui): nos dois testes de recarga, passar `{ timeout: 120000 }` ao `goto`, como os outros `waitForFunction` do arquivo já fazem.

Confirmação: às 15:37, com a máquina livre (a outra sessão tinha terminado), `seguranca-host` inteiro rodou em **22,5 s** e os três testes da recarga (`zumbis: sala`, `V02 pos (zumbis)`, `V03 zhit (zumbis)`) **passaram** (sala com 2 bots em 8,7 s, recarga + sala de zumbis em 10,1 s). Na fumaça do §3, feita logo depois, a recarga da aba com sala aberta levou 0,6–0,9 s até `load` e 4,2–4,9 s até o jogo pronto. A falha de `caracterizacao` l. 178 não foi rodada de novo com a máquina livre (o coordenador pediu para fechar com o que havia), mas é o mesmo `goto` que passou em `seguranca-host` l. 97.

Linha de base sob as mesmas condições: tentei rodar a cópia da fase 0 (`git archive 7bb7797` no scratchpad, `node_modules` por junção, CDN real) às 15:08, ainda com a outra sessão ocupando a máquina. Resultado **não concluído**: o primeiro teste falhou aos 113 s (a criação da sala não terminou no limite de 60 s do `waitForFunction`), os outros 14 caíram em cascata e o processo ficou travado no `after` (fechar o navegador) até ser encerrado às 15:37. Não serve como comparação; o argumento de "não é regressão" fica com o diff do `index.html` e com a rodada limpa acima.

### 1.2 Falha intermitente: `V02 pos: andar normal (o próprio cliente do host a 30 Hz) é aceito sem anomalia`

- 1.ª rodada (máquina disputada, teste levou 10,7 s): ✔. 2.ª rodada (máquina livre, 55 ms): ✖ `AssertionError: andou 2.3999999999999986` (esperado entre 5 e 6,5 m). `anom` não foi avaliado porque a primeira asserção falhou, mas o host não contou anomalia (nenhum `pos:` chegou a ser recusado por regra).
- Mecanismo: o teste anda 30 passos de 0,2 m com `T.sim(1/30)` (relógio travado), e `sendPos` manda 30 `pos` (cadência pelo `dt` da simulação, l. 4883). Mas o limitador por conexão da fase 2, `taxaOk` (l. 5378–5381, commit `f6d3e5b`), enche o balde por **tempo real** (`performance.now()`): `TAXA.pos = [45/s, rajada 70]`. Os seis testes V01 anteriores já tinham gastado a rajada em poucas centenas de ms reais, então, com o teste inteiro levando 55 ms, só ~12 mensagens (0,25 s × 45/s) passaram: 12 × 0,2 = 2,4 m, exatamente o valor medido. Com a máquina lenta, o tempo real entre os testes reenche o balde e o teste passa.
- É regressão do jogo? **Não**: em jogo real o relógio é o real, e 30 `pos`/s < 45/s, com rajada de 70. É uma incompatibilidade entre o balde em tempo real e o relógio travado dos testes (`netTime`, l. 5098, já trata esse caso usando `now` quando `DEBUG && __simLock`; `taxaOk` não). Reprodução: rodar `node --test tests/seguranca-host.test.mjs` numa máquina ociosa (falha); numa máquina ocupada passa. Sugestão para a fase 4 (não aplicada): em `taxaOk`, usar o relógio da simulação quando `DEBUG && window.__simLock` (como `netTime`) ou zerar `conn.taxa` no `__prep` do teste.

## 2. Linha de base: os 15 testes de caracterização

`git show 7bb7797 --stat`: a fase 0 criou `tests/caracterizacao.test.mjs` (182 linhas), `tests/_jogo.mjs`, `tests/servidor.mjs`, `package.json`, `pnpm-lock.yaml`, `.gitignore` e `docs/seguranca/mapa_sistema.md`. O §2 do mapa registra: 15/15 passando em 02/10/2026, ~45 s, sem `pageerror`.

Hoje o arquivo continua com **os mesmos 15 testes, na mesma ordem e com o mesmo propósito**; nenhum foi removido, pulado (`skip`) ou afrouxado para "passar de qualquer jeito". `git log --follow` mostra três commits da fase 2 que o tocaram (`56b46b9`, `f6d3e5b`, `dca0db0`) e `git diff 7bb7797 HEAD -- tests/caracterizacao.test.mjs` tem exatamente estes ajustes:

| # | Teste | Ajuste | Correção que o motivou | Coerente? |
|---|---|---|---|---|
| 1 | `zumbis: a rodada 1 começa e zumbis nascem` | só chama `zStartRound()` se `Z.phase !== 'round'`; aceita `round >= 1` em vez de `== 1` | nenhuma correção de segurança: o relógio do jogo fica parado durante o `buildMap`, então a fase "pre" (5 s) pode já ter terminado sozinha quando o teste roda (sensível ao tempo de carga do mapa) | Sim. A asserção que importa (`n > 0`, zumbis nasceram) continua intacta; `round >= 1` só tolera a rodada já ter começado. Não esconde regressão: se zumbis não nascessem, falharia. |
| 2 | `zhit: dano é limitado ao teto da arma…` | antes de atirar, move o zumbi para 2,5 m do jogador numa direção sem parede (`T.trace`) e zera `z.ph` | V03 (`f6d3e5b`): o host passou a exigir distância ≤ 260 m, linha de visão e zumbi fora do subsolo | Sim. O teste continua medindo o teto `dmg × head × 1,1` e os 10 pontos; só garante que o acerto é "honesto" sob a regra nova. |
| 3 | `zhit: repetir a mensagem muitas vezes… só vale até a cadência` | mesmo posicionamento do zumbi | V03 | Sim; as asserções de cadência (`acertos ≤ cota`) não mudaram. |
| 4 | `selfdmg: dano próprio é limitado a 100 e não mata com PhD` → `selfdmg: explosão da própria arma machuca (até o dano dela) e não machuca com PhD` | `selfdmg` só é aceito logo depois de um `shot` de arma que explode (`raygun`, posta no inventário); `d: 30` virou `d: 20`; restaura `p.inv` no fim | V19 (`f6d3e5b`): `selfdmg` sem contexto era um canal de dano arbitrário; agora só vale após um tiro da própria arma explosiva e limitado ao dano dela | Sim, e é o único teste cuja **regra mudou de propósito** (a regra antiga "até 100" era a vulnerabilidade). A proteção do PhD (`b === max`) continua testada. |
| 5 | `mata-mata: hit em bot aplica o dano e kill soma abate` | garante o host vivo/no lugar (`h.alive`, `h.hp`, `h.pos`, `h.anom = null`); põe o bot a 1,5 m com visão; o tiro de `1e6` agora deixa `hp2 = 30` (teto 36 × 1,1 = 39,6 → 70 − 39,6 ≈ 30) e o abate vem de 3 tiros de 36 | V01 (`56b46b9`): teto de dano por arma e linha de visão no `hit` PvP | Sim. Antes `hp2` nem era observado (um tiro matava, que era a falha V01); agora o teste prova o teto **e** que o abate legítimo ainda soma `kills = 1`. |

Conclusão do §2: os cinco ajustes correspondem a V01, V03 e V19 (ou a uma folga de tempo sem relação com segurança, no #1) e cada um mantém ou aperta a asserção original. Nenhum ajuste esconde uma regressão. O helper `tests/_jogo.mjs` só mudou em comentários (e CRLF) — a forma de abrir o jogo, criar a sala e travar o relógio é a mesma da fase 0.

## 3. Fumaça visual (20 s de jogo real por sala)

Script `scratchpad/regressao/fumaca.mjs` (usa `abrirJogo`/`criarSala`/`noJogo` de `tests/_jogo.mjs`; PeerJS bloqueado como nos testes). Para cada cenário: abre o jogo, **recarrega a aba** medindo `load` e "pronto", cria a sala, destrava o relógio (`__simLock = false`) e deixa 20 s de tempo real com amostras a cada 5 s; registra `pageerror`, todo o console, todos os hosts pedidos, falhas de requisição, status do `vendor/` e tira uma captura. Rodado às 15:39–15:45 com a máquina livre. Capturas: `scratchpad/regressao/<cenário>.png` (960×540; a de mata-mata mostra o AK, o HUD, "Offline" e o feed com dois abates de bots).

| Cenário | `load` / pronto / criar sala | `pageerror` | console "Refused"/CSP/"Uncaught" | pedidos a unpkg/jsDelivr | hosts pedidos | `vendor/` |
|---|---|---|---|---|---|---|
| (a1) zumbis, Sanatório | 0,86 s / 4,2 s / 3,5 s | 0 | 0 | 0 | 127.0.0.1, fonts.googleapis.com, fonts.gstatic.com, www.gstatic.com | 19 arquivos, todos 200 |
| (a2) zumbis, Vila | 0,87 s / 4,3 s / 4,3 s | 0 | 0 | 0 | idem | 19 × 200 |
| (b) mata-mata, Arena, 3 bots | 0,73 s / 4,2 s / 3,8 s | 0 | 0 | 0 | idem | 19 × 200 |
| (c) rodadas, Porto, 2 bots | 0,62 s / 4,5 s / 3,6 s | 0 | 0 | 0 | idem | 19 × 200 |

Console em todos: 1 `error` = `Failed to load resource: net::ERR_FAILED` do próprio bloqueio do PeerJS pelos testes (`ctx.route(/peerjs/)`, intencional) e 2–8 `warning` "Canvas2D … willReadFrequently" (aviso de desempenho do Chromium, já existia). As falhas `net::ERR_ABORTED` em `assets/fps/w/*/scene.bin` são os `fetch` de modelos interrompidos pela recarga que o próprio script faz; nenhuma depois da sala criada. `__T.HAND3D.R` e `.L` carregados (`true`) e `__T.NET.online === false` em todos os cenários e em todas as amostras.

(a) Zumbis: nas duas salas `Z.phase` já estava em `pre` (rodada 0) ao criar; o script chamou `zStartRound()`. Amostras (`Z.zs.size` / `toSpawn`): 0 s → 0/6; 5 s → 2/4; 10 s → 5/1; 15 s → 6/0; 20 s → 6/0, `Z.round = 1`, `Z.on = true`. **Zumbis nascem** (6 em 15 s, como a rodada 1 manda). Host: no Sanatório `hp 100`, vivo, de pé aos 20 s; na Vila `hp 100` até 15 s e aos 20 s `hp 0`, `downed = true`, `Z.phase = 'over'` — o host parado no ponto de nascimento, sem atirar, foi derrubado pelos 6 zumbis e, sozinho na sala, a partida acabou: **caído normalmente** (sem erro, sem anomalia). `#feed` sem linhas (não há abates em zumbis).

(b) Mata-mata, 3 bots: `S.phase = 'live'` o tempo todo. Posições dos bots (x, z) mudam a cada amostra — ex.: `b1` 15,35/10,36 → 14,73/3,06 → 20,63/7,81 → 20,30/7,74 → −19,02/−0,26; `b2` 19,00/−8,74 → −15,00/−11,00 → −15,01/−7,83 → 20,57/−1,22 → 15,07/2,27; `b3` −18,38/8,11 → −17,35/2,84 → −20,34/−0,01 → −14,80/−7,53 → −19,63/7,90. **Abates acontecem**: linhas acrescentadas ao `#feed` (contadas por `MutationObserver`): 0 → 2 → 4 → 7 → **9** em 20 s (o feed guarda só 6 filhos; 2 visíveis no fim); placar aos 20 s: `b1` 3 abates/2 mortes, `b2` 2/2, `b3` 4/2 (morto na hora), host 0/3 (parado, levou 3 mortes e renasceu com `hp 100`). **`S.players.get('h').anom === null`** em todas as amostras. 0 `pageerror`.

(c) Rodadas, Porto, 2 bots: **fase progride** — amostra 0 s `freeze` (rodada 1) → 5 s `live` → `live` a cada segundo nos 10 s seguintes (`live@1` ×10) → 30 s `live`, rodada 1. Bots se movem (`b1` −6/−36 → −11,33/−34,42 → −16,92/−33,97 → −16,57/−23,07; `b2` −2/34 → −6,09/29,51 → −8,73/25,19 → −8,44/15,29) e trocam tiros (`b1` hp 100 → 78 → 49; `b2` hp 100 → 4), sem abate em 30 s (feed 0). Host `hp 100`, 0 anomalias, 0 `pageerror`.

Mapas disponíveis no formulário, lidos de `__T.MAPS`: arena, dust, armazem, favela, neve, porto (bomba), sanatorio (zumbis), vila (zumbis).

## 4. Dependências: nada de CDN, `vendor/` servido, hashes conferidos

- `index.html` (HEAD) não contém `unpkg` nem `jsdelivr` (0 ocorrências; na fase 0 eram 4). Os módulos vêm do `importmap` → `./vendor/three@0.160.0/…` e `<script src="./vendor/peerjs@1.5.4/peerjs.min.js">`. Durante a fumaça (§3) foram registrados **todos** os hosts pedidos pelo jogo: nenhum pedido a unpkg/jsdelivr (números na seção 3).
- CSP (l. 8): `default-src 'self'`, `script-src 'self' 'unsafe-inline' gstatic apis.google.com`, `connect-src` restrito a `'self'`, gstatic, `0.peerjs.com`, Firebase/Google; `base-uri 'none'`, `object-src 'none'`. Nenhuma mensagem "Refused…"/"Content Security Policy" no console em nenhum cenário da fumaça.
- Hashes: rodei o comando "todos de uma vez" de `vendor/HASHES.md` e comparei programaticamente bytes e SHA-384 de cada arquivo com a tabela: **23 arquivos em disco, 23 na tabela, 23 iguais, 0 diferentes** (1.782.555 bytes). O commit `c8e1e9a` (`.gitattributes` sem conversão de fim de linha) está surtindo efeito: os bytes do checkout são os do tarball.

## 5. Tamanho

- `git count-objects -vH`: 142 objetos soltos (4,12 MiB), 762 em 1 pack de **37,73 MiB** (o pack inclui todo o histórico do jogo com os `.glb`/texturas; o `vendor/` acrescentou ~1,7 MiB de blobs). Aviso "garbage found: …/worktrees/tiroteio-seguranca/refs" é só o diretório de refs do worktree, inofensivo.
- `vendor/`: 1,8 MB em disco (23 arquivos; o maior é `three.module.js`, 1.272.972 bytes).
- `index.html`: 738.544 bytes na fase 0 → **761.909 bytes** em HEAD (+23.365 bytes, +3,2 %).

## 6. Veredito

**SEM REGRESSÃO DETECTADA.**

- Os 15 testes de caracterização da fase 0 continuam no arquivo, com cinco ajustes rastreáveis a V01, V03 e V19 (ou a folga de tempo), nenhum escondendo regressão (§2). 14 passam nas duas rodadas; o 15.º (`mata-mata`) só não rodou porque a recarga da aba estourou 30 s com a máquina disputada, e o mesmo `goto` passou em `seguranca-host` quando a máquina ficou livre (§1.1).
- `seguranca-rede` 11/11; `seguranca-host` 15/16 na rodada limpa, com a única falha (`V02 pos: andar normal`) explicada pelo balde de cadência em tempo real contra o relógio travado dos testes — não acontece em jogo real (§1.2).
- Fumaça: 4 salas (zumbis ×2, mata-mata, rodadas), 0 `pageerror`, 0 violação de CSP, 0 pedido a CDN, `vendor/` 19 × 200, mãos 3D carregadas, sala offline, zumbis nascendo, bots se movendo e abatendo, fase `freeze → live`, host sem anomalias (§3).
- `vendor/HASHES.md`: 23/23 hashes e tamanhos iguais aos arquivos em disco (§4).

Duas fragilidades **de teste** (não do jogo) ficam anotadas para a fase 4, sem nada revertido ou editado aqui: (1) os dois `page.goto` de recarga (`caracterizacao` l. 178, `seguranca-host` l. 97) sem `timeout` próprio, estouram em máquina ocupada; (2) `taxaOk` conta tempo real sob `__simLock`, fazendo `V02 pos: andar normal` falhar em máquina rápida. Material da revisão (logs das rodadas, `fumaca.json`, capturas, `diag-reload.mjs`) está em `scratchpad/regressao/`.
