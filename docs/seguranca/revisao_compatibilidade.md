# Revisão de compatibilidade (fase 3) — endurecimento de segurança do Dan of Duty

Revisão feita sobre a branch `security-hardening` em 02/10/2026, comparando a linha de base `7bb7797` (fase 0) com `HEAD` (`c8e1e9a`, fase 2). O objetivo é responder: **o que continua funcionando igual, o que mudou de forma visível e o que quebrou** em protocolo de rede, formatos de dados, saves locais, Firestore, ferramentas, publicação (GitHub Pages / `file://`), navegadores e testes. Nada do jogo foi editado nesta revisão; só este relatório.

Método: `git show 7bb7797:index.html` contra `index.html` atual (grep das mensagens `{ t: '…' }`, leitura dos trechos de rede, saneamento, perfil e boot), `firestore.rules`, `_config.yml`, `tools/*.js`, `tests/*` e um teste rápido com Playwright abrindo o `index.html` por `file://` (seção 6).

Resumo em uma linha: **o protocolo e os formatos continuam compatíveis entre host e cliente da mesma versão; a única regressão de compatibilidade confirmada é jogar abrindo o `index.html` direto do disco (`file://`), que o README ainda anuncia e que deixou de funcionar porque as bibliotecas agora vêm de `./vendor/` como módulos ES.** O resto são observações e recomendações.

---

## 1. Protocolo de rede

### 1.1 Mensagens cliente → host

| Mensagem | Campos antes (7bb7797) | Campos depois (HEAD) | Mudança |
|---|---|---|---|
| `join` | `v: 2, name, sk` | `v: 2, **pv: PROTO (3)**, name, sk, **rk**` | `pv` = versão do protocolo (inteiro, obrigatório: host recusa se diferente); `rk` = token de reentrada (UUID guardado em `localStorage` por sala, 10 min; `undefined` quando `crypto.randomUUID` não existe) |
| `ping` | `c` | `c` | igual (host só responde depois do `join`, com `c` finito em `(0, 1e12)`) |
| `pos` | `p, y, pi, c, w, ts, sq` | `p, y, pi, c, w, ts, sq` | igual na forma; o host agora **ignora** (sem resposta) posição implausível (`posPlausivel`), `ts` velho e arma fora do inventário |
| `shot` | `w, o, e` | `w, o, e` | igual; o host confere arma, origem perto do jogador e cadência |
| `hit` | `v, dmg, z, w` | `v, dmg, z, w` | igual; o host confere arma do inventário, teto de dano, cadência (0,6 × intervalo da arma) e linha de visão (histórico de 0,4 s da vítima) |
| `zhit` | `v, dmg, z, w, sp` | `v, dmg, z, w, sp` | igual; conferências análogas (alcance + 2 m, cone de visão) |
| `hold`, `use`, `buy`, `chat`, `skins`, `nade`, `zclay`, `zfx`, `selfdmg`, `bomb`, `suicide` | — | — | forma igual; agora com limite de taxa por tipo (`TAXA`) e validação de conteúdo |

Limites de taxa (`TAXA`, por segundo / rajada) contra o uso honesto: `pos` 45/70 (jogo manda 30/s), `shot` 25/40 (arma mais rápida: `rate: .05` = 20/s; a rajada da G11 é 3 tiros a cada 0,35 s = 8,6/s), `zhit` 60/90, `hit` 40/60, `ping` 5/10 (1/s). Nenhum tipo honesto cai no limite genérico `'*'` (todos os 16 tipos que o cliente manda têm entrada própria). Excesso só descarta a mensagem; a conexão cai apenas depois de 2000 descartes.

### 1.2 Mensagens host → cliente

| Mensagem | Antes | Depois | Mudança |
|---|---|---|---|
| `welcome` | `you, st, code` | `you, st, code, **hk**` | `hk` = segredo do host (10 caracteres), o mesmo que vai no link `?sala=CODE&h=…` |
| `room` | (não existia) | `code, hk` | **nova**: o host abriu um código novo depois de perder o pareamento; o cliente atualiza o HUD e o link |
| `err` | `txt` | `txt` | forma igual; textos novos: "Sua versão do jogo é diferente da do host…", "Sala cheia", "Você foi removido desta sala pelo host" |
| `state` | `ph, tl, r, pl[], win, pre, st?, sc?, bomb?, z?` | idêntico | nenhum campo novo ou removido no host (`srvState`); o cliente passou a sanear (seção 2) |
| `pos` (repasse) | `id, p, y, pi, c, w, d, ts, sq` | idêntico | `ts` já era normalizado (`finN ? ts : 0`); agora a posição não plausível não é repassada |
| `spawn`, `inv`, `pts`, `ammo`, `dmg`, `kill`, `mend`, `match`, `msg`, `info`, `chat`, `nade`, `shot`, `hold` | — | — | idênticos |
| `zs`, `zround`, `zrend`, `zover`, `zreset`, `zdie`, `zgone`, `zdown`, `zrevive`, `zbleed`, `zdoor`, `zbox`, `zpap`, `zperk`, `zpwr`, `zpower`, `zdrop`, `zdropgone`, `zclay`, `zclayx`, `ztrap`, `zvult`, `zvultx`, `zboss`, `zscr`, `zslam`, `zarc`, `zbowie`, `zfx` | — | — | idênticos (o `diff` de `zSyncWorld` e `zOnSnap` entre as versões é vazio) |

`PROTO = 3` (l. 459). O host recusa `join` com `(d.pv | 0) !== PROTO`; o cliente não confere o `pv` do host (o `welcome` não o carrega: ver cenário 3 abaixo).

### 1.3 Cenários de versões mistas

| # | Cenário | Funciona? | O que acontece (confirmado no código) |
|---|---|---|---|
| 1 | Host novo + cliente novo | Sim | Fluxo completo: `join{pv:3, rk}` → `welcome{hk}`; reentrada por nome + token. |
| 2 | Host **novo** + cliente **antigo** (`index.html` da `main`, sem `pv`) | Não, **de propósito** (V22) | Host: `(undefined \| 0) !== 3` → `err{txt:'Sua versão do jogo é diferente da do host: recarregue a página com Ctrl+F5 e tente de novo'}` e fecha a conexão 200 ms depois. Cliente antigo: `conn.on('data')` chama `onMsg` direto → `case 'err'` → `toast(m.txt, 2)` + som `empty` (o toast aparece sobre o menu por 2 s); em seguida `close` → `fail('Conexão recusada')` fica no status do formulário. Ou seja, a mensagem de versão **é mostrada**, mas só por 2 s e como toast; o texto que permanece é "Conexão recusada". Não dá para melhorar sem mudar o cliente antigo (que está na `main`, publicado). Quando a branch for mesclada, o Pages passa a servir o cliente novo e o cenário some depois do Ctrl+F5. |
| 3 | Host **antigo** + cliente **novo** (código digitado ou link sem `&h=`) | Sim | Host antigo ignora `pv` e `rk` (`conn.v = +d.v \|\| 1`, nome e `sk` como sempre) e manda `welcome` sem `hk` → cliente: `NET.hostKey = null`, `NET.linkKey` é `null` → entra. `state`, `zs` etc. do host antigo têm a mesma forma que os do novo, então `sanePl`/`saneSt` aceitam tudo. **Observação:** neste caso ninguém confere a versão (o host antigo não conhece `pv`); se as tabelas de armas/mapas divergirem no futuro, o cliente novo joga com um host antigo sem aviso. Nesta fase as tabelas (`W`, `MAPS`, `ZPERKS`) não mudaram, então não há efeito prático. A reentrada no host antigo continua por nome (ele não lê `rk`). |
| 4 | Host **antigo** + cliente **novo** entrando por link **com `&h=`** | Não | `NET.linkKey` é preenchido pelo `?h=` (l. 8632) e o `welcome` antigo não traz `hk` → `m.hk !== NET.linkKey` → `fail('Esse código agora é de outra sala (o host mudou). Peça um link novo.')`. **Só acontece se** um link gerado por um host novo (único que põe `&h=`) for usado para entrar numa sala de host antigo com o **mesmo código** — isto é, o código de 5 caracteres (32⁵ ≈ 33 milhões) teria de ser reaproveitado por um host antigo enquanto alguém ainda tem o link do novo. Probabilidade desprezível; a mensagem ("o host mudou") é inclusive correta nesse caso. Aceitável. |
| 5 | Host antigo + cliente antigo | Sim | Nada mudou (a `main` continua como está até a mesclagem). |
| 6 | Cliente novo cola o link inteiro no campo do código | Sim | `joinRoom` remove `.*sala=` e caracteres fora de `[A-Z0-9]` e corta em 5 → `…?sala=ABCDE&h=XXXXXXXXXX` vira `ABCDE` (o `h` colado não vira `linkKey`; só o parâmetro de URL faz isso). |
| 7 | Cliente novo em `http://` fora de `localhost` (ex.: IP da rede local servido por `tests/servidor.mjs`) | Sim | `crypto.randomUUID` não existe fora de contexto seguro → `tokenReentrada` cai no `catch` → `rk: undefined` → o host usa só o nome (`chaveLeft = nome0`), como antes. `crypto.getRandomValues` (código da sala) funciona em qualquer contexto. |
| 8 | Reentrada depois de limpar o `localStorage` ou de outro navegador/dispositivo | Não recupera pontos/armas | `tiroteio.rk.<CODE>` some → token novo → `chaveLeft` diferente → entra como jogador novo. Comportamento intencional (V11); antes bastava o nome. Documentado no comentário de `tokenReentrada`. |
| 9 | Host novo perde o pareamento e reabre com código novo | Sim (novo) | `room{code, hk}` chega a quem já está na sala; cliente novo valida `/^[A-Z0-9]{5}$/` e atualiza `NET.code`/`NET.hostKey`. Um cliente antigo (se estivesse na sala, o que o cenário 2 impede) ignoraria a mensagem sem erro (o `switch` antigo não tem `case 'room'`). |

---

## 2. Formato dos dados em jogo (`state`, `zs`, `spawn`, `inv`, `pts`…)

O host (`srvState`, l. 5681) continua emitindo exatamente os mesmos campos; o que mudou é o cliente, que agora passa cada jogador do `state` por `sanePl` (l. 7764) e o `st` por `saneSt` (l. 7763). Conferência campo a campo do que o host honesto manda contra o que o cliente converte:

| Campo (`pl`) | Host manda | `sanePl` faz | Perde algo? |
|---|---|---|---|
| `id` | `'h'`, `'p3'`, `'b1'` | `String()` | não |
| `n` | nome ≤ 16 (+ " (2)") | `String().slice(0, 20)` | não |
| `c` | `COLORS[]` (`#e74c3c`…) ou `TEAMC` (`#e0a030`/`#4a90e2`) | precisa casar `/^#[0-9a-f]{3,8}$/i`, senão `#cccccc` | não (todas as cores do host são hex) |
| `hp, ar, m, rw, mh, bl, rv` | números (`Math.round`, `r2`) | `+v \|\| 0` | não; `0` continua `0`; campo ausente (só do modo zumbis, fora dele) vira `0`, antes era `undefined` lido como falso |
| `k, d, hs, dw, rvs` | inteiros | `\| 0` | não |
| `tm` | `'t'`/`'ct'` (`setTeam`) | só esses dois valores, senão `undefined` | não |
| `pk` | ids de `ZPERKS` (`zPerkGot` só recebe chaves do catálogo) | filtra por `Object.hasOwn(ZPERKS, k)` | não |
| `ac` | `0` ou `[segundos, duração]` | array com dois finitos, senão `0` | não |
| `sk` | objeto (`state` cheio) ou ausente (`lean`) | `cleanSk` quando objeto; ausente continua ausente (o cliente reaproveita a skin anterior) | não |
| `b, hm, al, kt, dn, bw` | `0/1` | passam sem conversão (usados como booleanos) | não |

`saneSt`: `map` precisa existir em `MAPS` (arena, dust, armazem, favela, neve, porto, sanatorio, vila: todos presentes), `mode` em `rounds/dm/zombies`, `bots` preso a 0–7 (o formulário oferece 0–7), `zdiff` preso ao tamanho de `ZDIFF`, `rounds`/`frags`/`diff` com `| 0`; os campos extras (`cmap`, `zmap`) sobrevivem pelo spread. O `st` que o host guarda em `S.st` tem exatamente esses campos (l. 8275).

Outros campos do `state`: `C.phase = String(m.ph)` (era string), `C.timeLeft = +m.tl || 0`, `C.round = m.r | 0`, `C.winner = m.win == null ? null : String(m.win)` (`S.winner` é `null`, id do jogador ou time `'t'`/`'ct'`: tudo string ou nulo, então o valor é o mesmo; aliás `C.winner` só é escrito, nenhum trecho o lê), `C.pre`, `C.sc = {t|0, ct|0}`, `C.bomb` passa inteiro quando é objeto (igual a antes). `m.z` vai para `zSyncWorld` sem mudança.

`spawn`, `inv` (`+m.m || 0`, `+m.ar || 0`, `!!m.hm`), `pts` (`+m.m || 0`, `+m.n || 0`), `ammo` (`isW(m.w)`: as variantes `_pap` são chaves de `W`), `zs` (`zOnSnap`, sem diff): compatíveis.

**Conclusão da seção:** nenhum campo numérico virou 0 por engano e nenhum campo de texto mudou de tipo. A única diferença de comportamento é que valores fora do catálogo (cor não hex, perk inexistente, mapa desconhecido) agora caem no padrão em vez de ir para o HTML.

---

## 3. `localStorage`

| Chave | Antes | Depois | Observação |
|---|---|---|---|
| `tiroteio.name` | string crua | mesma string; na leitura passa por `String().replace(/[<>]/g, '').slice(0, 16) \|\| 'Jogador'` | É o mesmo filtro do campo `#inName` (`maxlength="16"`, `oninput` idêntico), então nenhum nome legítimo é cortado: o que o campo aceitou, a leitura aceita. Um valor não-string (editado à mão) vira texto. |
| `tiroteio.sens/fov/vol/shadows/gfx/bright/zmarks/lant/autofull` | JSON | JSON, mesmas chaves e padrões | sem mudança |
| `tiroteio.lastSt` | `{map, zmap, mode, rounds, frags, bots, diff, zdiff, cmap?}` | mesmo formato; na leitura `rounds` fora de `[3,5,8,10,13,16]` → 8, `frags` fora de `[10,15,20,30,50]` → 20, `bots` 0–7, `diff` 0–2 | Só valores editados à mão são afetados (o formulário só grava os das listas). |
| `tiroteio.prof.guest`, `tiroteio.prof.<uid>` | `{xp, cases, items[], equipped{}, opened}` | idêntico (`newProfile`/`cleanProf` sem mudança de forma) | sem mudança |
| `tiroteio.rk.<CODE>` | (não existia) | `{tok: <uuid>, at: <ms>}`; todas as chaves `tiroteio.rk.*` com mais de 10 min são apagadas a cada entrada em sala | Chave nova; não colide com as antigas (prefixo próprio). Falha de `localStorage` (modo privado, cota) cai no `catch` e devolve `undefined`. |

No host, o nome recebido passa por `normalize('NFKC')` e pela remoção de `INVISIVEIS` (`< >`, U+200B–U+200F, U+2028–U+202F, U+2060–U+206F, U+FEFF). Efeitos colaterais em nomes legítimos: emojis compostos com ZWJ (U+200D, ex.: família 👨‍👩‍👧) viram os emojis separados; ligaduras e letras de largura total são normalizadas ("ﬁ" → "fi", "Ｖitor" → "Vitor"). Acentos comuns (é, ã, ç) não mudam. Aceitável, mas vale saber.

---

## 4. Firestore (`firestore.rules` × o que o cliente grava)

Simulação mental dos dois caminhos de escrita de `index.html` contra as regras:

**Criação** (`profOnUser`, l. 8377): `setDoc(ref, { ...PROF.data, name, created: serverTimestamp() })` com `PROF.data = cleanProf(convidado) | newProfile()` = `{xp, cases, items, equipped, opened}`.
- `formaOk`: chaves ⊆ `[xp, cases, items, equipped, opened, name, upd, created]` ✓; `xp` number ≥ 0 e < 300 ✓ (`grantXP` troca cada 300 por caixa, `cleanProf` só garante ≥ 0); `cases` int ✓ (`Math.floor`); `opened` int — `cleanProf` faz `Math.max(0, +d.opened || 0)` **sem `Math.floor`**: o código honesto só produz inteiros (`opened++`), mas um valor fracionário vindo de um `localStorage` editado passa por `cleanProf` e seria recusado pela regra (`is int`) em todas as gravações seguintes; recomendo `Math.floor` ali por simetria com `cases`. `items`: `cleanProf` já exige `W[arma]` e `SKIN_BY[skin]`; todas as chaves de `W` casam `[a-z0-9_]` e todos os 20 ids de `SKINS` casam `[a-z]` (conferido: floresta … galaxia), então a regex de `itensOk` aceita tudo que o cliente grava ✓. `equipped`: `cleanSk` limita a 80 chaves, valores são ids de skin ou `_faca: 'karambit'` ✓. `name` ≤ 100 ✓ (`displayName` do Google ou prefixo do e-mail).
- `created == request.time` ✓ (serverTimestamp); `!('upd' in d())` ✓ (a criação nunca manda `upd`).
- `tetosCriacao`: `cases ≤ 20` e `items ≤ 50`. **Convidado honesto pode estourar?** 20 caixas sem abrir = 6 000 XP; 50 skins = 50 caixas abertas = 15 000 XP (rodada 40 no Zumbis rende 350 XP; um abate 10–15). Improvável, mas possível para quem jogou meses como convidado: a criação é **negada**, `profOnUser` cai no `catch`, mostra "Não consegui ler sua conta (permission-denied). Confira as regras do Firestore." e o perfil fica só local (`PROF.cloud = false`), repetindo a cada login. Ver recomendação R4.

**Atualização** (`profSave`, l. 8345): `setDoc(…, { ...PROF.data, name, upd: serverTimestamp() }, { merge: true })`.
- `request.resource.data` com `merge` é o documento **resultante** (campos antigos + novos). Documentos criados pela versão antiga têm os mesmos campos (`newProfile` antigo é idêntico; o `profSave` antigo já gravava `upd: serverTimestamp()` e a criação `created: serverTimestamp()`), então `hasOnly` e `intervaloOk` (timestamp + 1 s) passam ✓. **Risco só para documento com campo extra posto à mão no console**: o `merge` carrega o campo e `hasOnly` passa a recusar **todas** as gravações daquele jogador, para sempre, com "Não consegui salvar na nuvem (permission-denied)". Não há documento assim produzido pelo código.
- Documento antigo sem `upd` (criado e nunca atualizado): `intervaloOk` tem a exceção `!('upd' in antes())` ✓.
- `created` imutável: o merge não manda `created` → igual ao anterior ✓; documento sem `created` → exceção ✓.
- `d().opened >= antes().opened` ✓ (só cresce).
- `saltoOk`: abrir caixa (`openCaseUI`) faz `cases--`, `opened++`, `items.push` (se inédita) e `profSave(true)` **imediato**; `SKUI.rolling` trava a próxima caixa por 5,4 s, então duas caixas nunca entram na mesma gravação ✓ e nunca ficam a menos de 1 s ✓. Repetida: `grantXP(60)` só depois da roleta (5,4 s) e com atraso de 3 s → gravação separada ✓. `cases ≤ antes + 10`: o `profSave()` adiado reinicia o atraso de 3 s a cada XP, então uma sequência de abates sem pausa de 3 s acumula; 10 caixas = 3 000 XP por gravação (≈ 200–300 abates ou ~8 fins de rodada alta seguidos sem pausa de 3 s). Entre rodadas há pausa, e `leaveGame` grava imediatamente; folgado para o jogador honesto, mas sem teto de tempo (ver R5).
- **Abrir caixa + esconder a aba no mesmo segundo**: `visibilitychange` chama `profSave(true)` → segunda gravação imediata < 1 s depois da primeira → `intervaloOk` nega → `profSave` trata: `imediato && e.code === 'permission-denied' && !PROF.retentou` → refaz uma vez em 3,1 s ✓ (l. 8348). Se a retentativa também falhar (improvável), fica a mensagem de status e a próxima mudança tenta de novo. Confirmado no código.
- **Conta do dono** (`OWNERS`, `grantAllSkins` → `profSave(true)` com ~1100 itens): no update, `saltoOk` exige `items ≤ antes + 1`; na criação, `tetosCriacao` exige `items ≤ 50`. Os dois só passam com `donoDoProjeto()`, que depende do **uid real no placeholder `COLOQUE_AQUI_O_UID_DO_DONO`**. Enquanto o placeholder não for trocado, a conta do dono vê "Não consegui salvar na nuvem (permission-denied)" a cada login (as skins ficam em memória e no `localStorage`). Ação manual já registrada em `acoes_manuais.md` §2; repito aqui como pré-requisito de publicação das regras.
- **Documento apagado à mão no console**: o comentário das regras diz que "a alternativa sem `created` cobre o documento recriado pelo merge". Não cobre: o merge sempre manda `upd`, e o `create` exige `!('upd' in d())`. Na prática: o `profSave` em sessão falha até a próxima recarga, quando `profOnUser` vê `snap.exists() === false` e recria pelo caminho de criação (com `created`), que passa. Inofensivo, mas o comentário está errado (ver R6).

Textos de erro e retentativa: tratados; `PROF.status` aparece na aba Skins (`skinsUI`).

---

## 5. Ferramentas (`tools/*.js`)

- `tools/skview.js`, `tools/wfit.js`, `tools/vmtest.js` importam `three` e `three/addons/…` pelos especificadores do importmap. Importadas pelo console (`await import('./tools/vmtest.js')`), elas resolvem pelo importmap **da página**, que agora aponta para `./vendor/three@0.160.0/…` ✓ (importmaps valem para `import()` dinâmico do mesmo documento). A CSP `script-src 'self'` permite o `./tools/…` quando a página é servida pela mesma origem (`tests/servidor.mjs` serve `tools/`; no Pages a pasta é excluída pelo `_config.yml`, o que é intencional).
- As três usam `window.__T`, que agora só existe com `DEBUG` (`location.hostname` ∈ `localhost`, `127.0.0.1`, `[::1]`). `tests/servidor.mjs` escuta em `127.0.0.1` ✓. **Registro:** aberto pelo Pages, por IP da rede local ou por `file://` (hostname vazio), `__T` é `undefined` e as ferramentas quebram em `T().…` — esperado (V10), mas o cabeçalho de `vmtest.js` ainda diz só "no console do jogo".
- `tools/vmtest.js` faz `POST http://127.0.0.1:8799/` (receptor do Blender, `tools/blender/recv.py`, que **não existe no repositório**). Com a CSP nova, `connect-src 'self'` só libera a própria origem (mesmo esquema+host+**porta**): se o jogo não for servido em `127.0.0.1:8799`, o `fetch` é bloqueado ("Refused to connect"). Antes não havia CSP. Como o receptor não está no repositório, não dá para dizer se ele também serve a página (mesma origem) — fica registrado para quem usar a ferramenta (ver R8).
- `__simLock`/`__simNow` (travar o relógio) também ficaram atrás de `DEBUG` — `vmtest.settle()` continua funcionando em localhost.

---

## 6. Publicação: GitHub Pages e `file://`

### 6.1 GitHub Pages (build legacy do Jekyll, raiz da `main`)

- `_config.yml` exclui `tools`, `tests`, `docs`, `package.json`, `pnpm-lock.yaml`, `node_modules`, `firestore.rules`, `CLAUDE.md`, `_config.yml`. O Jekyll já ignora por padrão tudo que começa com `_` ou `.` (`_sk/`, `.gitattributes`, `.gitignore`, `.git`) e `node_modules`; o padrão também exclui **só** `vendor/bundle`, `vendor/cache`, `vendor/gems` e `vendor/ruby` — `vendor/three@0.160.0/…`, `vendor/peerjs@1.5.4/…` e `vendor/webxr-generic-hand@1.0.20/…` **são publicados**, como precisa ser. Arquivos `.md` sem front matter (`vendor/HASHES.md`, `LICENSE.md`) são copiados como estão; os `.js` do three não começam com `---`, então não passam pelo Liquid. `README.md` continua acessível (decisão registrada no `_config.yml`).
- `index.html` referencia `./vendor/…`, `./assets/…` e `./tools/…` com caminho **relativo**: em `https://costamaiavitor.github.io/tiroteio/` (subpasta) resolve para `…/tiroteio/vendor/…` ✓. O link de convite usa `location.origin + location.pathname` ✓ (inclui `/tiroteio/`).
- `.gitattributes` com `vendor/** -text` e `*.glb binary`: o checkout do Pages (Linux) e do Windows recebem os mesmos bytes; os hashes de `vendor/HASHES.md` continuam válidos.
- Conferência depois do deploy (já listada em `acoes_manuais.md` §8): `…/tiroteio/vendor/three@0.160.0/build/three.module.js` deve responder 200 com `content-type: text/javascript` (o Pages serve `.js` assim; um `.mjs` também seria `text/javascript`). Não há como conferir sem o deploy.

### 6.2 Abrir o `index.html` direto do disco (`file://`) — **REGRESSÃO DE COMPATIBILIDADE**

O README (l. 7) diz: "Abra o jogo (pelo link do GitHub Pages **ou abrindo o `index.html` no Chrome/Edge**)". Teste com Playwright/Chromium 1243 (SwiftShader), sem servidor, 12 s de espera depois do `load` (script em `scratchpad/compat/file-test.mjs`, resultado colado abaixo):

| | `7bb7797` (CDN) | `HEAD` (`./vendor/`) |
|---|---|---|
| `#btnHost` | **habilitado**, "Criar sala" | **desabilitado**, "Carregando..." (o módulo do jogo nunca executou) |
| `window.Peer` | function | function (script clássico `./vendor/peerjs…` carrega em `file://`) |
| `window.__T` | object | undefined (esperado: `DEBUG` falso em `file://`; mas aqui o módulo nem rodou) |
| Erros de console | só `fetch` dos `.glb/.gltf` de `assets/` ("URL scheme file is not supported": o jogo já tolerava, com os avisos "braços 3D não carregaram" e segue sem os modelos) | 11 × `Access to script at 'file:///…/vendor/three@0.160.0/…' from origin 'null' has been blocked by CORS policy: Cross origin requests are only supported for protocol schemes: chrome, chrome-untrusted, data, http, https.` + `net::ERR_FAILED` em cada módulo |
| Mensagens "Refused…" (CSP) | — | **nenhuma**: a CSP com `'self'` não é o problema em `file://`; o bloqueio é o CORS dos módulos ES |

Causa: o Chrome trata cada documento `file://` como origem opaca (`null`) e exige CORS para `import` de módulos ES; módulos em `file://` não têm cabeçalhos CORS, então o `import 'three'` falha e o `<script type="module">` inteiro do jogo não executa. Antes, o importmap apontava para `https://cdn.jsdelivr.net/…`, que responde com `Access-Control-Allow-Origin: *`, e por isso funcionava do disco (com os modelos 3D locais faltando, que o código já tratava). O Firefox tem a mesma restrição (cada arquivo `file://` é uma origem distinta desde o 68; `security.fileuri.strict_origin_policy`). O Edge é Chromium: idêntico.

Impacto: quem segue o README e dá duplo clique no `index.html` fica para sempre em "Carregando...", sem mensagem de erro na tela. Jogar por `http://` (Pages, `pnpm serve`/`tests/servidor.mjs`, qualquer servidor estático) continua igual.

Opções (decisão do dono; a recomendação é a primeira):
1. **Atualizar o README e a tela**: "jogue pelo link do Pages (`https://costamaiavitor.github.io/tiroteio/`) ou, offline, sirva a pasta com `node tests/servidor.mjs` / `pnpm serve` e abra `http://127.0.0.1:<porta>/`"; e, no `index.html`, se `location.protocol === 'file:'`, trocar o texto do botão "Carregando..." por "Abra pelo link do site ou por um servidor local (file:// não funciona)" **antes** do módulo (num `<script>` clássico, que roda em `file://`). Custo mínimo; mantém o ganho de segurança do `vendor/`.
2. **Fallback de CDN só em `file://`**: escrever o importmap por um `<script>` clássico (`document.write`/`insertAdjacentHTML` antes de qualquer módulo) escolhendo `./vendor/` em `http(s)` e `https://cdn.jsdelivr.net/…` em `file:`. Reabre a dependência da CDN (sem SRI) justamente no modo em que a CSP `<meta>` menos protege, e precisa liberar `cdn.jsdelivr.net` em `script-src`/`connect-src`. Não recomendo.
3. **Empacotar o jogo num único arquivo** (inline do three.js e dos addons, ~1,3 MB) ou abrir o Chrome com `--allow-file-access-from-files`: o primeiro muda o processo de build do projeto ("um único `index.html`"), o segundo é inseguro e não serve para "o amigo".

---

## 7. Navegadores: requisitos mínimos antes e depois

| Recurso | Usado desde | Chrome/Edge | Firefox | Safari | Observação |
|---|---|---|---|---|---|
| Módulos ES + **importmap** (`<script type="importmap">`) | antes | 89 | 108 | 16.4 | É o piso real do jogo, antes e depois. |
| `??=` / `\|\|=` | antes (1 e 6 usos) → depois (1 e 14) | 85 | 79 | 14 | abaixo do piso |
| `Array.prototype.at` | antes | 92 | 90 | 15.4 | abaixo do piso |
| `Object.hasOwn` | antes (1 uso) → depois (7) | 93 | 92 | 15.4 | abaixo do piso |
| `crypto.getRandomValues` | **novo** (`genCode`) | todos | todos | todos | funciona em `http://` e `file://` |
| `crypto.randomUUID` | **novo** (`tokenReentrada`) | 92 | 95 | 15.4 | **só em contexto seguro** (`https://`, `localhost`, `file://`): em `http://192.168.x.x` lança → `catch` → `undefined` → reentrada só por nome. Tratado. |
| `<meta http-equiv="Content-Security-Policy">` | **novo** | todos | todos | todos | navegador sem CSP só ignora. |
| `<meta name="referrer">` | **novo** | todos | todos | todos | idem |
| WebRTC (PeerJS), Pointer Lock, WebGL 2 (three 0.160), Web Audio, `localStorage` | antes | — | — | — | sem mudança |

`structuredClone`, `findLast`, `toSorted`, `replaceAll`, campos privados `#x`, `import.meta`: não são usados em nenhuma das versões. **Conclusão:** o piso de navegador não mudou (Chrome/Edge 89, Firefox 108, Safari 16.4, ditado pelo importmap). As novidades estão todas abaixo desse piso ou são opcionais.

Nota sobre a CSP e o WebRTC: `connect-src` não governa `RTCPeerConnection` (STUN/TURN da Metered não precisam estar na lista; só o servidor de pareamento `0.peerjs.com` está, em `https` e `wss`) ✓. O Firebase está coberto (`gstatic`, `identitytoolkit`, `securetoken`, `firestore` em `https`/`wss`, `googleapis`, `frame-src` para o popup de login) ✓. Fontes do Google (`fonts.googleapis.com`/`fonts.gstatic.com`) ✓.

---

## 8. Testes e CI

- `pnpm test` = `node --test "tests/**/*.test.mjs"`. No Node 26 o runner executa **cada arquivo em paralelo** (concorrência padrão = `os.availableParallelism() - 1`): três arquivos = três Chromium headless com SwiftShader ao mesmo tempo, e cada um cria salas e simula partidas. Foi isso que travou a máquina nesta fase (também observado durante esta revisão: 8 processos `chrome-headless-shell` de outro revisor; o teste da seção 6 esperou eles terminarem). Recomendação R9: `node --test --test-concurrency=1 "tests/**/*.test.mjs"`. Dentro de cada arquivo os `test()` já são sequenciais.
- `tests/servidor.mjs` escuta em `127.0.0.1` (porta aleatória) → `DEBUG` verdadeiro → `window.__T` existe → `tests/_jogo.mjs` espera `window.__T && !#btnHost.disabled` ✓. Se um dia o servidor escutar em `0.0.0.0` e o teste abrir pelo IP, `__T` some e o `waitForFunction` estoura em 60 s: vale um comentário no `_jogo.mjs`.
- `tests/_jogo.mjs` bloqueia `/peerjs/` por `ctx.route`: com o PeerJS em `./vendor/peerjs@1.5.4/peerjs.min.js` a regex continua casando (o caminho contém "peerjs") — é o comportamento desejado (sala offline). `vendor-edicao.md` §3 já discute isso.
- O importmap em `./vendor/` fez os testes deixarem de depender de `cdn.jsdelivr.net`/`unpkg.com`; ainda dependem de internet para `www.gstatic.com/firebasejs` (só contas) e `fonts.googleapis.com` (só visual): sem internet o jogo sobe mesmo assim (`fbInit` cai no `catch`).

---

## 9. Regressões e incompatibilidades encontradas

| # | Gravidade | O quê | Evidência | Onde |
|---|---|---|---|---|
| **RC1** | **Alta (uso anunciado)** | Jogar abrindo o `index.html` do disco (`file://`) deixou de funcionar: o botão fica em "Carregando..." para sempre | Teste Playwright §6.2: 11 erros `blocked by CORS policy` nos módulos de `./vendor/three@0.160.0/…`; na linha de base `7bb7797` o mesmo teste habilita "Criar sala" | README l. 7; `index.html` l. 281 (importmap) |
| RC2 | Baixa (intencional, V22) | Cliente antigo (a `main` publicada hoje) não entra em sala de host novo; a mensagem de versão aparece só como toast de 2 s e o status final é "Conexão recusada" | §1.3 cenário 2 (código antigo: `onMsg('err')` → `toast`, `close` → `fail`) | `index.html` l. 5288 |
| RC3 | Baixa (intencional, V11) | Reentrada em sala só recupera pontos/armas no mesmo navegador (token em `localStorage`, 10 min); de outro dispositivo ou após limpar dados entra como jogador novo | §1.3 cenário 8 | `tokenReentrada` l. 5155 |
| RC4 | Baixa (ferramentas de dev) | `tools/*.js` só funcionam em `localhost`/`127.0.0.1`/`[::1]` (`window.__T`); `tools/vmtest.js` faz `POST http://127.0.0.1:8799` que a CSP `connect-src 'self'` bloqueia se a página não for servida nessa mesma origem (porta inclusa) | §5 | `tools/vmtest.js` l. 3–6; CSP l. 8 |
| RC5 | Baixa (caso raro) | Convidado com > 20 caixas fechadas ou > 50 skins ao criar a conta: criação negada por `tetosCriacao`, perfil fica só local com "Não consegui ler sua conta (permission-denied)" a cada login | §4 | `firestore.rules` `tetosCriacao`; `profOnUser` l. 8377 |
| RC6 | Baixa (ação manual pendente) | Conta do dono: `grantAllSkins` (1100 itens) é recusada até trocar o placeholder do uid nas regras; aparece "Não consegui salvar na nuvem" a cada login | §4 | `firestore.rules` `donoDoProjeto`; `acoes_manuais.md` §2 |
| RC7 | Informativa | Cliente novo + host antigo: funciona, mas sem conferência de versão (o host antigo não conhece `pv`); link com `&h=` só falha se o código for reaproveitado por um host antigo (probabilidade ~3 × 10⁻⁸) | §1.3 cenários 3–4 | — |
| RC8 | Informativa | Nomes com emoji composto (ZWJ) ou letras de largura total são normalizados pelo host (`NFKC` + `INVISIVEIS`) | §3 | `INVISIVEIS` l. 5383 |

Sem regressão: protocolo entre host e cliente da **mesma** versão (todas as mensagens têm a mesma forma; `pv`, `rk`, `hk`, `room` são acréscimos); `state`/`zs`/`spawn`/`inv`/`pts` (nenhum campo numérico zerado nem campo de texto com tipo trocado); chaves antigas do `localStorage`; documentos do Firestore criados pela versão antiga (mesmos campos, `upd`/`created` já eram `serverTimestamp`); piso de navegador (continua Chrome/Edge 89, Firefox 108, Safari 16.4, pelo importmap); publicação no Pages (relativo em subpasta; `vendor/` publicado).

## 10. Recomendações

| # | Recomendação | Fecha | Esforço |
|---|---|---|---|
| **R1** | **Atualizar o README** ("Como jogar" l. 7 e "Como funciona" l. 189): o jogo roda pelo link do Pages ou por um servidor local (`pnpm serve` → `http://127.0.0.1:<porta>/`); abrir o `index.html` do disco não funciona mais (módulos ES em `file://`). | RC1 | pequeno |
| **R2** | No `index.html`, num `<script>` clássico antes do módulo: `if (location.protocol === 'file:')` trocar o texto de `#btnHost`/`#btnJoin` por "Abra pelo link do site ou por um servidor local" (e talvez um aviso no `#joinStatus`). Assim quem der duplo clique entende em vez de ver "Carregando..." eterno. Alternativa (não recomendada): importmap de CDN só em `file:` (§6.2 opção 2). | RC1 | pequeno |
| R3 | Opcional: `pnpm serve` já existe (`node tests/servidor.mjs`); documentar a porta impressa e, se quiser "offline sem Node", um `jogar-local.cmd`/`.sh` que abra o servidor e o navegador. | RC1 | pequeno |
| R4 | `firestore.rules` `tetosCriacao`: subir para algo como `cases ≤ 100` e `items ≤ 300` (um convidado honesto não passa disso; o abuso continua limitado), ou, no cliente, ao receber `permission-denied` na criação, criar com `newProfile()` e manter o resto só local avisando. | RC5 | pequeno |
| R5 | `profSave`: além do atraso de 3 s, forçar uma gravação a cada 60 s de mudanças contínuas (teto de tempo), para o salto por gravação ficar bem abaixo de `+10` caixas mesmo numa sequência longa de abates sem pausa. | §4 `saltoOk` | pequeno |
| R6 | Corrigir o comentário de `allow create` nas regras: o `merge` do `profSave` **sempre** manda `upd`, então ele nunca recria um documento apagado (`!('upd' in d())`); a recriação acontece na próxima recarga pelo caminho de criação. Opcional: `Math.floor` em `p.opened` no `cleanProf` (simetria com `cases`; a regra exige `int`). | §4 | trivial |
| R7 | Trocar o placeholder `COLOQUE_AQUI_O_UID_DO_DONO` **antes** de publicar as regras (já em `acoes_manuais.md` §2); sem isso a conta do dono recebe erro a cada login. | RC6 | manual |
| R8 | `tools/vmtest.js`: anotar no cabeçalho que exige `localhost`/`127.0.0.1` (`__T`) e que o `POST` para `127.0.0.1:8799` precisa que a página seja servida da mesma origem (ou liberar a porta em `connect-src` só quando `DEBUG`, via `<meta>` escrita por script: não recomendado); `tools/blender/recv.py` referenciado não está no repositório. | RC4 | trivial |
| **R9** | `package.json`: `"test": "node --test --test-concurrency=1 \"tests/**/*.test.mjs\""` (os três arquivos abrem um Chromium cada; em paralelo travam a máquina). Se um dia houver CI, o mesmo flag. | §8 | trivial |
| R10 | Depois da mesclagem: conferir no Pages (`acoes_manuais.md` §8) que `…/tiroteio/vendor/three@0.160.0/build/three.module.js` responde 200 como `text/javascript` e que `…/tools/vmtest.js` dá 404. | §6.1 | manual |
| R11 | Quando `W`/`MAPS`/`ZPERKS` mudarem no futuro, lembrar de subir `PROTO` (comentário já está na l. 459) — e considerar mandar `pv` também no `welcome` para o cliente novo recusar host com tabela diferente (hoje só o host confere). | RC7 | pequeno |

## 11. O que não foi feito nesta revisão

- Não foi testado o fluxo completo host ↔ cliente em duas abas (depende do servidor de pareamento público; os testes `tests/seguranca-*.test.mjs` cobrem o host com `srvOnData` direto).
- Não foi testado o Firestore real (regras publicadas e Simulador): a análise da seção 4 é por leitura; os dois payloads de `acoes_manuais.md` §2 devem ser rodados no Simulador antes de publicar.
- O teste `file://` rodou uma vez por versão num Chromium headless com SwiftShader; não foi repetido em Firefox nem em Edge (mesmo motor do Chrome).
