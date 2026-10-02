# 08 — Dependências

Auditoria somente leitura em 02/10/2026, branch `security-hardening` (`index.html` em `7bb7797`). Linhas referem-se a `index.html`. Consultas feitas online nesta data: `npm view` (versões e datas), OSV (`api.osv.dev/v1/query`), `pnpm audit`, jsDelivr (resolução de `@1.0`), GitHub Releases (PeerJS, Firebase) e download dos arquivos de CDN para calcular o SHA-384.

## Inventário

| Biblioteca | Versão usada | Atual (02/10/2026) | Origem (linha) | SRI? | Advisories (OSV) |
|---|---|---|---|---|---|
| PeerJS | 1.5.4 (14/05/2024) | 1.5.5 (07/06/2025, só correção de versão inline) | unpkg l. 274; fallback jsDelivr l. 275 via `document.write` | não | nenhum para o pacote |
| three.js + addons (`examples/jsm`) | 0.160.0 (22/12/2023) | 0.186.1 (24/09/2026) | jsDelivr, importmap l. 276; 11 imports l. 422–432 | não (importmap) | GHSA-fq6p-x6j3-cmmq, corrigido em 0.125.0: não afeta |
| @webxr-input-profiles/assets (2 `.glb`) | `@1.0` flutuante → 1.0.20 hoje | 1.0.20 | jsDelivr l. 3559, carregado pelo `GLTFLoader` | n/a (dados) | nenhum |
| Firebase JS SDK (app, auth, firestore) | 10.12.2 (27/05/2024) | 12.19.0 (09/09/2026); linha 10.x parou em out/2024 | gstatic, `import()` dinâmico l. 8174–8175 | não (`import()`) | GHSA-3wf4-68gx-mph8, corrigido em 10.9.0: não afeta |
| Google Fonts (Rajdhani 500/700) | v17 | — | `fonts.googleapis.com` l. 8–9 → `fonts.gstatic.com` | não (CSS varia por navegador) | — |
| playwright (devDependency) | 1.63.0 (04/09/2026) | 1.63.0 | `package.json` + `pnpm-lock.yaml`, só testes | — | GHSA-7mvr-c777-76hp, corrigido em 1.55.1: não afeta |

Hashes dos arquivos de CDN baixados hoje (base para SRI ou para conferir o `vendor/`):

| Arquivo | Bytes | SHA-384 |
|---|---|---|
| peerjs@1.5.4/dist/peerjs.min.js (unpkg e jsDelivr idênticos) | 92 865 | `nlUQ8ZqCbvStErob+biJNzSgltf6urV3VGqhfIfzhmg9RXmpeRm76ELw0pYnKlTR` |
| three@0.160.0/build/three.module.js | 1 272 972 | `61S/Nu32S3E5+n+KpCOTb2eRYps6fVKm+9Gz1QBvSePFthb46f063Aa/qe/lykFZ` |
| firebasejs/10.12.2/firebase-app.js | 101 721 | `stTNz2qNbq7DNZ/YGSW5tO9xP6QJJfI4FWVs8ua/u1eqMw9QYxdFg859xCkme49a` |
| firebasejs/10.12.2/firebase-auth.js | 150 996 | `xc1TV9O0/6B1UfdVv335cLLPR5z0/W7C/tHMVb0Io3DzsB2qscQnsXnZgVh/+kdU` |
| firebasejs/10.12.2/firebase-firestore.js | 436 574 | `mr45ONjFgd7GUimISmrEP4jMaKhbf2j/wb50swz+5/wVp7Oh6QSDbkxxa7y+YgF0` |

Fatos conferidos no código: nenhuma dependência de execução por `http://` (o único `http://` em `index.html` é o namespace SVG do favicon, l. 7, que não gera requisição); sem atributo `integrity`/`crossorigin`, sem `Content-Security-Policy`; sem lockfile para o jogo (o `pnpm-lock.yaml` cobre só o Playwright). `pnpm audit`: 0 vulnerabilidades em 2 pacotes de desenvolvimento.

## Achados

### [P1] Código de terceiros carregado de CDN sem SRI, sem CSP e sem cópia local
- Arquivo e linha: `index.html` l. 274 (PeerJS, unpkg), l. 275 (PeerJS, jsDelivr), l. 276 (importmap three.js, jsDelivr), l. 422–432 (11 módulos de `three` e `three/addons/`), l. 8174–8175 (`import()` de três bundles do Firebase em gstatic).
- Descrição: todo o JavaScript de terceiros (≈ 2,1 MB) é baixado em tempo de execução de três CDNs públicas. As versões estão fixas na URL (bom: nenhum `@latest`), mas nada verifica o conteúdo: não há `integrity`, não há `Content-Security-Policy` e não há cópia no repositório. O que o navegador recebe é o que a CDN entregar naquele instante. Conferido hoje: unpkg e jsDelivr entregam o mesmo `peerjs.min.js` (hash idêntico); os addons de three só importam `'three'` (resolvido pelo importmap) e arquivos relativos; `firebase-auth.js` e `firebase-firestore.js` importam `firebase-app.js` por URL absoluta em gstatic (nenhuma quarta origem).
- Cenário de exploração: comprometimento, sequestro de DNS/BGP ou conta de mantenedor de uma das CDNs (o caso polyfill.io, em 2024, é o precedente conhecido; conhecimento geral, não reconferido online) troca o script por um com código extra. Como o script roda na origem do jogo, ele lê e grava `localStorage` (perfil, nome), usa a sessão do Firebase Auth do jogador (Firestore `players/{uid}`, inclusive e-mail/senha digitados em `#acEmail`/`#acPass`), e no host controla a partida inteira. Probabilidade baixa (CDNs grandes, versão fixa), impacto total.
- Severidade: Alta
- Correção sugerida (menor risco de regressão primeiro):
  1. **Vendorizar** em `vendor/` os arquivos exatamente como baixados (mesma versão, mesmo conteúdo, só muda a URL): `vendor/peerjs@1.5.4/peerjs.min.js`; `vendor/three@0.160.0/build/three.module.js` + `vendor/three@0.160.0/examples/jsm/` inteiro (os addons importam arquivos irmãos relativos: `./Pass.js`, `../shaders/...`; copiar a pasta inteira evita faltar um); os dois `.glb` do P3. Fonte: `npm pack three@0.160.0` / `npm pack peerjs@1.5.4` (o tarball do npm é o mesmo artefato que a CDN serve). Importmap passa a `"three": "./vendor/three@0.160.0/build/three.module.js"`, `"three/addons/": "./vendor/three@0.160.0/examples/jsm/"`. Registrar em `vendor/HASHES.md` versão, origem, data e SHA-384 de cada arquivo (tabela acima). GitHub Pages serve tudo da mesma origem, sem build.
  2. Firebase: os bundles do gstatic só funcionam vendorizados se o `from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"` dentro de `firebase-auth.js` e `firebase-firestore.js` for reescrito para `./firebase-app.js` (edição no arquivo vendorizado, documentada no `HASHES.md`). Alternativa de menor regressão: **manter o Firebase no gstatic** (domínio do próprio Google; `signInWithPopup` já depende de `tiroteio-237ee.firebaseapp.com` e dos servidores do Firebase, então o gstatic não acrescenta uma parte nova em quem se confia) e restringir pela CSP.
  3. Depois de vendorizar, publicar uma CSP (`<meta http-equiv="Content-Security-Policy">`, já que o GitHub Pages não permite cabeçalho): `script-src 'self' https://www.gstatic.com/firebasejs/` (se o Firebase ficar lá), `connect-src` com os servidores do PeerJS, STUN/TURN, Firebase e Google, `style-src 'self' https://fonts.googleapis.com`, `font-src https://fonts.gstatic.com`. O jogo não usa `eval`; conferir `inline` (há `<script>` inline na l. 275 e o módulo principal) e, se preciso, usar `nonce`/hash ou mover o módulo para `game.js`.
  4. Se preferir ficar na CDN: SRI resolve só o `<script src>` clássico do PeerJS (`integrity="sha384-nlUQ…" crossorigin="anonymous"`). Para `importmap`/`import()` não existe atributo; a chave `integrity` dentro do importmap é recente e não foi conferida online nesta auditoria quanto ao suporte em todos os navegadores: não depender dela sem testar. Por isso vendorizar é a recomendação.

### [P2] Fallback do PeerJS por `document.write` dobra as origens confiadas e pode falhar em silêncio
- Arquivo e linha: `index.html` l. 275: `window.Peer || document.write('<script src="https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js"><\/script>')`.
- Descrição: se o unpkg falhar, um segundo CDN é inserido por `document.write`. Do ponto de vista de segurança, isso significa confiar em **duas** infraestruturas em vez de uma (qualquer uma das duas comprometida basta, e um atacante na rede que derrube o unpkg força o uso da segunda). Do ponto de vista de robustez, o Chrome bloqueia scripts cross-origin inseridos por `document.write` em conexões lentas (2G) quando não estão em cache (intervenção documentada em developer.chrome.com/blog/removing-document-write, conferida online), e `document.write` é incompatível com uma CSP estrita por `nonce`. Hoje o unpkg e o jsDelivr entregam bytes idênticos (hash conferido), então o fallback não introduz código diferente, só outra origem.
- Cenário de exploração: atacante que controle a rede bloqueia `unpkg.com`, o navegador cai para o jsDelivr; sozinho não é um ataque, mas amplia o P1. Mais provável na prática: jogador em rede lenta fica sem `Peer` e o jogo falha ao criar sala sem mensagem clara (`new Peer` em l. 5155/5194 lança `ReferenceError`).
- Severidade: Média
- Correção sugerida: com o PeerJS vendorizado (P1) o fallback deixa de existir: `<script src="./vendor/peerjs@1.5.4/peerjs.min.js">`. Se continuar na CDN, trocar `document.write` por `<script src=… integrity=… crossorigin="anonymous" onerror="…">` que injeta o segundo `<script>` por `document.createElement` com o **mesmo** `integrity`, assim as duas origens ficam presas ao mesmo hash.

### [P3] Modelos das mãos com versão flutuante (`@1.0`) em CDN
- Arquivo e linha: `index.html` l. 3559–3560: `https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/` + `right.glb` / `left.glb`, carregados pelo `GLTFLoader`.
- Descrição: `@1.0` é um intervalo, não uma versão: o jsDelivr resolve para a maior 1.0.x publicada no npm (hoje 1.0.20, conferido na API do jsDelivr). Qualquer 1.0.21 publicada amanhã, legítima ou por conta de mantenedor comprometida, passa a ser servida sem ninguém mudar o jogo. É a única dependência não fixada. Como são dados (GLB), não código, o pior caso é o que o parser do `GLTFLoader` fizer com um arquivo malicioso.
- Cenário de exploração: publicação maliciosa ou simplesmente quebrada de 1.0.x: mãos erradas, GLB gigantesco (travamento/estouro de memória na aba, inclusive no host, que derruba a partida de todos), ou exploração de bug de parsing do `GLTFLoader` 0.160.0 (nenhum advisory conhecido). Também inviabiliza reproduzir um build antigo.
- Severidade: Média
- Correção sugerida: copiar os dois `.glb` (licença MIT, como o comentário na l. 3556 já registra) para `assets/hands/` e apontar `base` para lá, registrando versão (1.0.20) e hash em `vendor/HASHES.md`. Mínimo aceitável: trocar `@1.0` por `@1.0.20`.

### [P4] Firebase JS SDK 10.12.2: duas versões maiores atrás, linha sem manutenção
- Arquivo e linha: `index.html` l. 8174 (`base = 'https://www.gstatic.com/firebasejs/10.12.2/'`), uso em l. 8176–8213 (`initializeApp`, `getAuth`, `onAuthStateChanged`, `signInWithPopup`, `signInWithEmailAndPassword`, `getFirestore`, `getDoc`, `setDoc`, `serverTimestamp`).
- Descrição: 10.12.2 é de 27/05/2024. A linha 10.x teve o último lançamento estável em 2024 (depois disso só `canary`); a 11.0.0 saiu em 21/10/2024 e a atual é 12.19.0 (09/09/2026), tudo conferido no npm e no GitHub. O Google corrige segurança só na última versão maior, então um advisory novo em Auth ou Firestore não chegará à 10.x. Hoje não há advisory que afete 10.12.2: o único registrado no OSV para `firebase` (GHSA-3wf4-68gx-mph8, `_authTokenSyncURL` apontável para servidor do atacante) foi corrigido na 10.9.0; `@firebase/auth`, `@firebase/firestore` e `@firebase/app` não têm registros. O jogo usa a parte sensível do SDK (login com e-mail/senha e Google, gravação de perfil).
- Cenário de exploração: nenhum explorável hoje. O risco é de exposição futura: a próxima falha em Auth/Firestore ficará aberta enquanto a versão não subir, e a subida tende a ficar mais cara quanto mais tempo passar.
- Severidade: Baixa (hoje), sobe para Média assim que sair um advisory em 11/12.x que também atinja 10.x
- Correção sugerida: planejar a atualização para a 12.x (`https://www.gstatic.com/firebasejs/12.19.0/…` ou vendorizada) depois do P1. A API modular usada (`firebase-app`, `firebase-auth`, `firebase-firestore`) não mudou de forma entre 10 e 12 para essas chamadas; as mudanças maiores das 11.0 e 12.0 são de Node/TypeScript e produtos não usados (VertexAI). Testar: login Google (popup), login/cadastro por e-mail, `profOnUser`, `profSave` e o aviso "Não consegui carregar o sistema de contas". Ver `02-autenticacao.md` para as regras do Firestore, que continuam sendo a proteção real dos dados.

### [P5] three.js 0.160.0: 26 versões atrás, sem advisory, risco de regressão alto ao subir
- Arquivo e linha: `index.html` l. 276 (importmap) e l. 422–432 (`EffectComposer`, `RenderPass`, `UnrealBloomPass`, `OutputPass`, `ShaderPass`, `RoundedBoxGeometry`, `RoomEnvironment`, `MarchingCubes`, `GLTFLoader`, `SkeletonUtils`); `tools/*.js` em desenvolvimento.
- Descrição: 0.160.0 é de 22/12/2023; a atual é 0.186.1 (24/09/2026). O único advisory conhecido (GHSA-fq6p-x6j3-cmmq, negação de serviço em loaders) foi corrigido na 0.125.0, logo não afeta. A superfície exposta a dados externos é o `GLTFLoader` (modelos locais em `assets/` e os `.glb` do P3); shaders e pós-processamento só recebem dados do próprio jogo. three.js muda API e comportamento visual a cada versão (gestão de cor, pós-processamento, `OutputPass`), então subir 26 versões sem testes visuais quase certamente quebra algo.
- Cenário de exploração: nenhum conhecido para esta versão. O que sobra é o P1 (origem do código) e o P3 (dados externos entrando no `GLTFLoader`).
- Severidade: Baixa
- Correção sugerida: manter 0.160.0, vendorizada (P1), e só subir de versão com os testes de caracterização (`pnpm test`) mais uma conferência visual dos mapas e do bloom. Reavaliar a cada advisory novo no OSV para `three` (a consulta usada está no cabeçalho).

### [P6] PeerJS 1.5.4 vs 1.5.5: diferença sem impacto de segurança
- Arquivo e linha: `index.html` l. 274–275; uso em l. 5155 (host) e l. 5194–5209 (cliente), com `serialization: 'json'` no canal confiável e `JSON.parse` próprio no canal rápido (l. 5062).
- Descrição: a 1.5.5 (07/06/2025) contém uma única correção, "inline package version" (#1322), conferida no GitHub Releases; nenhum advisory no OSV para `peerjs`. O canal confiável usa `serialization: 'json'`, então o desserializador `BinaryPack` do PeerJS (historicamente a parte mais delicada) não é exercitado pelas mensagens do jogo. Observação: o `peerjs.min.js` traz o servidor de pareamento padrão `0.peerjs.com` embutido; o jogo não define `host`/`secure`, então depende desse serviço público (fora do escopo desta área; registrado no mapa §5).
- Cenário de exploração: nenhum pela versão. Mensagens maliciosas de um cliente são assunto da área de rede/validação (`srvHandle`).
- Severidade: Baixa
- Correção sugerida: nada urgente. Ao vendorizar, pode-se adotar a 1.5.5 (sem mudança de comportamento) ou manter a 1.5.4 com o hash registrado; o importante é fixar e documentar.

### [P7] Fonte do Google Fonts: CSS externo sem possibilidade de SRI
- Arquivo e linha: `index.html` l. 8 (`preconnect`) e l. 9 (`fonts.googleapis.com/css2?family=Rajdhani…`), que por sua vez carrega `.ttf` de `fonts.gstatic.com`.
- Descrição: o CSS devolvido varia por navegador (por isso o Google não publica hash e SRI não se aplica). Uma CSS comprometida não executa código, mas pode alterar a interface (sobrepor botões, esconder avisos) e fazer exfiltração limitada por seletores de atributo; os campos de e-mail/senha (`#acEmail`, `#acPass`) são preenchidos pelo usuário, e valores digitados não aparecem no atributo `value`, então o vazamento por CSS não alcança a senha. Também envia o IP de cada jogador ao Google a cada carga.
- Cenário de exploração: comprometimento do Google Fonts (mesmo nível de confiança do gstatic do Firebase): interface alterada para enganar o jogador. Improvável e de impacto baixo.
- Severidade: Baixa
- Correção sugerida: opcional. Baixar os dois `.ttf` (Rajdhani é OFL) para `assets/fonts/` e declarar o `@font-face` no próprio `<style>`; remover o `preconnect`. Permite `style-src 'self'` e `font-src 'self'` na CSP do P1 e tira uma origem da lista.

### [P8] `pnpm audit` limpo; Playwright na última versão (informativo)
- Arquivo e linha: `package.json` (`devDependencies: { playwright: "1.63.0" }`), `pnpm-lock.yaml` (lockfileVersion 9.0).
- Descrição: `pnpm audit` executado em 02/10/2026: 0 vulnerabilidades (info/low/moderate/high/critical = 0) em 2 pacotes de desenvolvimento (`playwright`, `playwright-core`). Playwright 1.63.0 é a versão `latest` (04/09/2026). O único advisory do OSV (GHSA-7mvr-c777-76hp, download de navegadores sem verificar o certificado TLS) foi corrigido na 1.55.1. O pacote não entra no jogo publicado: só roda os testes de caracterização, que precisam de internet para a CDN (`tests/_jogo.mjs` bloqueia só `/peerjs/`).
- Cenário de exploração: nenhum. Nota: enquanto o jogo carregar da CDN, os testes também carregam da CDN; vendorizar (P1) torna os testes reproduzíveis sem rede, exceto o pareamento, que já é bloqueado.
- Severidade: Baixa (informativo)
- Correção sugerida: nenhuma. Manter `pnpm audit` na rotina (ou no CI, quando houver) e o lockfile versionado como está.

### [P9] Ferramentas de desenvolvimento (`tools/`) fora do jogo publicado (registro)
- Arquivo e linha: `tools/skview.js`, `tools/vmtest.js`, `tools/wfit.js` (importam `three` pelo mesmo importmap e fazem `POST http://127.0.0.1:8799/…`); `tools/blender/*.py` (28 scripts Python do Blender) e `tools/blender/pipeline.sh`.
- Descrição: `tools/blender/*.py` está **fora do escopo** desta auditoria, conforme combinado, e não foi lido. Os três `tools/*.js` são carregados à mão pelo console (`import('./tools/…')`) durante a produção de imagens; o único `http://` sem TLS do repositório é esse `POST` para o receptor local `127.0.0.1:8799` (loopback, não sai da máquina). Nenhum deles é referenciado por `index.html`, portanto não compõem a superfície do jogo publicado, embora o GitHub Pages os sirva como arquivos estáticos (quem abrir `tools/skview.js` só vê o código).
- Cenário de exploração: nenhum no jogo. Em desenvolvimento, uma página maliciosa aberta no mesmo navegador poderia tentar `POST` em `127.0.0.1:8799` enquanto o receptor estivesse ligado (gravaria PNGs com nomes controlados pelo atacante); risco restrito à máquina do desenvolvedor, com o receptor ligado.
- Severidade: Baixa (informativo)
- Correção sugerida: nada no jogo. Se quiser, excluir `tools/` do que o Pages publica (não há mecanismo sem build; alternativa é um `.nojekyll` + mover para outra branch) e, no `recv.py`, validar o nome do arquivo e aceitar só `Origin` local; fica para a auditoria das ferramentas, se houver.

## Resumo

| Id | Severidade | Título | Conferido online |
|---|---|---|---|
| P1 | Alta | Código de terceiros de CDN sem SRI, sem CSP e sem cópia local (PeerJS, three.js, Firebase) | Sim: arquivos baixados, hashes calculados, imports transitivos conferidos |
| P2 | Média | Fallback do PeerJS por `document.write` dobra as origens confiadas e pode falhar em silêncio | Sim: unpkg = jsDelivr (hash), intervenção do Chrome |
| P3 | Média | Modelos das mãos com versão flutuante `@1.0` em CDN | Sim: jsDelivr resolve `@1.0` → 1.0.20 |
| P4 | Baixa (tende a Média) | Firebase JS SDK 10.12.2, duas versões maiores atrás, linha sem manutenção | Sim: npm (datas, dist-tags), OSV, GitHub Releases 11.0.0; política de suporte só da última maior: conhecimento geral, não reconferido |
| P5 | Baixa | three.js 0.160.0 desatualizada, sem advisory | Sim: npm, OSV |
| P6 | Baixa | PeerJS 1.5.4 vs 1.5.5, diferença sem impacto de segurança | Sim: OSV, GitHub Releases v1.5.5 |
| P7 | Baixa | Google Fonts sem possibilidade de SRI | Sim: CSS baixado (aponta para `fonts.gstatic.com`) |
| P8 | Baixa (informativo) | `pnpm audit` limpo; Playwright 1.63.0 = latest | Sim: `pnpm audit`, npm, OSV |
| P9 | Baixa (informativo) | `tools/` fora do jogo publicado; `tools/blender/*.py` fora de escopo | Só código local |

Não conferido online nesta auditoria: suporte dos navegadores à chave `integrity` em importmap (P1 §4) e o precedente polyfill.io (P1), ambos marcados como conhecimento geral.
