# vendor/ — edições para o `index.html` (Lote D, V08)

Preparação feita em 02/10/2026 na branch `security-hardening`. O `vendor/` já está no repositório com os arquivos
exatos que o jogo carregava das CDNs (mesmas versões, mesmos bytes; hashes em `vendor/HASHES.md`). Este documento
diz o que falta trocar no `index.html` e registra o teste de fumaça que provou que a troca funciona sem a rede.

Decisões já tomadas em `relatorio_auditoria.md` (V08) e respeitadas aqui: PeerJS e three.js vendorizados; mãos VR
vendorizadas com a versão fixada; **Firebase fica no gstatic** (domínio do próprio Google; `signInWithPopup` já depende
de `*.firebaseapp.com` e dos servidores do Firebase, então o gstatic não acrescenta uma parte nova em quem se confia).
A CSP e o `Referrer-Policy` (fase seguinte do V08) não entram aqui.

## 1. As três edições do `index.html`

Linhas conferidas em 02/10/2026 (texto antigo exato; se a linha deslocar, localizar pelo texto).

**Edição 1 — l. 274–275: PeerJS local, sem o fallback por `document.write` (P1 + P2).**

Antigo (duas linhas):

```html
<script src="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"></script>
<script>window.Peer || document.write('<script src="https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js"><\/script>')</script>
```

Novo (uma linha; a l. 275 é removida):

```html
<script src="./vendor/peerjs@1.5.4/peerjs.min.js"></script>
```

**Edição 2 — l. 276: importmap apontando para o `vendor/` (P1).**

Antigo:

```html
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
```

Novo:

```html
<script type="importmap">{"imports":{"three":"./vendor/three@0.160.0/build/three.module.js","three/addons/":"./vendor/three@0.160.0/examples/jsm/"}}</script>
```

Os 11 `import` da l. 422–432 (`three`, `three/addons/...`) e os de `tools/*.js` não mudam: o importmap resolve.

**Edição 3 — l. 3559 (dentro de `loadHands`): mãos com versão fixa, servidas do repositório (P3).**

Antigo:

```js
  const base = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/', ld = new GLTFLoader();
```

Novo:

```js
  const base = './vendor/webxr-generic-hand@1.0.20/', ld = new GLTFLoader();
```

O comentário da l. 3556 ("pacote aberto WebXR generic-hand, licença MIT") continua verdadeiro; a licença está em
`vendor/webxr-generic-hand@1.0.20/LICENSE.md`.

Depois das três edições, `grep -n "unpkg.com\|cdn.jsdelivr.net" index.html` deve devolver nada. As únicas origens
externas que sobram são `fonts.googleapis.com`/`fonts.gstatic.com` (l. 8–9, P7, opcional) e `www.gstatic.com/firebasejs/`
(l. 8174–8175, decisão de manter).

### Atenção: `tests/_jogo.mjs` precisa de um ajuste junto com a edição 1

`tests/_jogo.mjs` l. 14 bloqueia o pareamento com `ctx.route(/peerjs/, r => r.abort())`. Essa expressão casa com
**qualquer URL que contenha "peerjs"**, inclusive `http://127.0.0.1:…/vendor/peerjs@1.5.4/peerjs.min.js`. Com o
`index.html` apontando para o `vendor/`, o Playwright abortaria o próprio script do PeerJS, `window.Peer` ficaria
indefinido e `criarSala` falharia em `new Peer` (`ReferenceError`). Trocar por uma expressão que case só o servidor de
pareamento, por exemplo `/^(https?|wss?):\/\/[^/]*peerjs\.com\//` (é a que o teste de fumaça abaixo usou, e o jogo
continuou "offline" como antes). Esse ajuste não foi feito aqui (fora dos arquivos deste lote); fica para quem editar o
`index.html`, e `pnpm test` deve rodar logo depois.

## 2. O que está em `vendor/`

23 arquivos, **1 782 555 bytes (1,70 MiB)**. Lista completa com tamanhos e SHA-384 em `vendor/HASHES.md`.

| Pasta | Conteúdo | Origem |
|---|---|---|
| `vendor/peerjs@1.5.4/` | `peerjs.min.js`, `LICENSE` | `npm pack peerjs@1.5.4` → `package/dist/peerjs.min.js`; hash igual ao do unpkg/jsDelivr (`nlUQ8Zq…`, tabela de `08-dependencias.md`) |
| `vendor/three@0.160.0/` | `build/three.module.js`, `LICENSE`, 16 addons em `examples/jsm/` | `npm pack three@0.160.0`; `three.module.js` com o mesmo hash da auditoria (`61S/Nu32…`); três addons amostrados (`GLTFLoader`, `UnrealBloomPass`, `SkeletonUtils`) baixados do jsDelivr e idênticos byte a byte |
| `vendor/webxr-generic-hand@1.0.20/` | `right.glb`, `left.glb`, `LICENSE.md` | baixados da URL que o jogo usava (`…/assets@1.0/dist/profiles/generic-hand/`); `@1.0` resolvia para 1.0.20 (API do jsDelivr e `npm view`), e os bytes são idênticos ao tarball `@webxr-input-profiles/assets@1.0.20` |

### Addons copiados (rastreio transitivo, não a pasta inteira)

O relatório sugeria copiar `examples/jsm/` inteiro (≈ 31 MB desempacotados no tarball). Em vez disso, um script Node no
scratchpad (`rastrear-addons.mjs`) partiu dos 10 módulos importados em `index.html` l. 422–432 e em `tools/skview.js`/
`tools/wfit.js` (`GLTFLoader`, `RoomEnvironment`, já na lista) e seguiu, dentro de cada arquivo alcançado, todo
`import … from '…'`, `export … from '…'` e `import('…')` com caminho relativo (`./x.js`, `../y/z.js`) ou
`three/addons/…`; `'three'` não é seguido (resolve para `build/three.module.js`). Resultado: 16 arquivos.

```
environments/RoomEnvironment.js
geometries/RoundedBoxGeometry.js
loaders/GLTFLoader.js
objects/MarchingCubes.js
postprocessing/EffectComposer.js
postprocessing/MaskPass.js            (importado por EffectComposer)
postprocessing/OutputPass.js
postprocessing/Pass.js                (importado por todos os *Pass)
postprocessing/RenderPass.js
postprocessing/ShaderPass.js
postprocessing/UnrealBloomPass.js
shaders/CopyShader.js                 (EffectComposer, UnrealBloomPass)
shaders/LuminosityHighPassShader.js   (UnrealBloomPass)
shaders/OutputShader.js               (OutputPass)
utils/BufferGeometryUtils.js          (GLTFLoader)
utils/SkeletonUtils.js
```

Conferência independente: `grep` de todos os especificadores de import nos 16 arquivos copiados só encontra `'three'`,
os relativos acima e dois textos de comentário do `GLTFLoader` (`https://my-cnd-server.com/...`, `"srgb-linear"`), que
não são imports. No teste de fumaça o navegador pediu exatamente esses 16 arquivos (mais `three.module.js`, `peerjs.min.js`
e os dois `.glb`): nenhum 404, nenhum arquivo copiado sem uso.

## 3. Teste de fumaça (02/10/2026): **passou**

Feito sem tocar no `index.html`: um script (`criar-teste-html.mjs`, scratchpad) gerou `_vendor-test.html` na raiz como
cópia do `index.html` com só as três edições da §1 (conferindo o texto antigo de cada linha antes de trocar), e
`fumaca-vendor.mjs` (scratchpad) o abriu num Chromium headless do Playwright 1.63.0 (mesmos argumentos de
`tests/_jogo.mjs`: SwiftShader) servido por `tests/servidor.mjs`. O `_vendor-test.html` foi apagado no fim.

Condições: toda requisição para `cdn.jsdelivr.net` e `unpkg.com` abortada (`ctx.route`); servidor de pareamento
`*.peerjs.com` abortado (jogo offline, como nos testes); `gstatic`, Firebase e fontes liberados. Passos: esperar
`window.__T` e `#btnHost` habilitado → mesmos cliques de `criarSala` (zumbis, Sanatório, dificuldade 1) → esperar o host
vivo e `Z.on` → 10 s de jogo com o relógio solto → ler o estado.

| Verificação | Resultado |
|---|---|
| `pageerror` | nenhum |
| `console.error` | nenhum |
| requisições falhadas para `./vendor/` (`requestfailed`) | nenhuma |
| respostas 404 (qualquer URL) | nenhuma |
| tentativas de ir à CDN (seriam abortadas) | **zero**: a página não pediu nada a unpkg/jsDelivr |
| arquivos servidos de `./vendor/` com 200 | 20 (peerjs, three.module, os 16 addons, `right.glb`, `left.glb`) |
| `typeof window.Peer` | `function` (PeerJS local carregou) |
| `__T.HAND3D.R` / `.L` com `mesh` | carregadas as duas (mãos do `vendor/`) |
| sala criada | modo `zombies`, mapa `sanatorio`, host vivo, `Z.on = true` |
| renderização (`renderer.info.render`) | 134 quadros, 25 chamadas, 37 618 triângulos no último quadro |
| captura | `fumaca-vendor.png` no scratchpad: Sanatório, HUD, braço e M1911 em primeira pessoa, "Zumbis restantes: 6" |

Saída de referência do script (resumo): `passou: true`, `pageerror: []`, `vendorFalhas: []`, `respostas404: []`,
`tentativasCDN: []`.

O que o teste **não** cobre: login Google/Firebase (continua no gstatic, não mudou), duas abas na mesma sala (pareamento
bloqueado), VR de verdade (as mãos só foram carregadas e montadas). São os testes listados em V08 para a fase da CSP.

## 4. Firebase: fica no gstatic

Por decisão do relatório (V08, correção (a)), `firebase-app.js`, `firebase-auth.js` e `firebase-firestore.js` 10.12.2
continuam vindo de `https://www.gstatic.com/firebasejs/10.12.2/` (`import()` dinâmico, l. 8174–8175). Vendorizar exigiria
reescrever, dentro de `firebase-auth.js` e `firebase-firestore.js`, o `from "https://www.gstatic.com/…/firebase-app.js"`
para `./firebase-app.js` (arquivo editado, hash diferente do publicado). Os hashes dos três bundles estão em
`08-dependencias.md` para quem quiser rever a decisão; na CSP, o gstatic entra em `script-src`.

## 5. Scripts usados (scratchpad da sessão, não versionados)

Pasta `…\scratchpad\vendor\`:

- `rastrear-addons.mjs` — rastreio transitivo dos addons e cópia para `vendor/three@0.160.0/examples/jsm/` (§2).
- `sha384.mjs` — bytes + SHA-384 base64 de arquivos (conferência contra a tabela da auditoria).
- `gerar-hashes.mjs` — gera a tabela de `vendor/HASHES.md`.
- `criar-teste-html.mjs` — cria o `_vendor-test.html` com as três edições, conferindo o texto antigo.
- `fumaca-vendor.mjs` — o teste de fumaça da §3 (importa `playwright` e `tests/servidor.mjs` do projeto).
- `pack/` — tarballs `peerjs-1.5.4.tgz`, `three-0.160.0.tgz`, `webxr-input-profiles-assets-1.0.20.tgz` extraídos;
  `cdn/` — amostras baixadas do jsDelivr; `hands/` — os `.glb` baixados da URL do jogo; `fumaca-vendor.png`.

Para refazer do zero sem o scratchpad: `npm pack peerjs@1.5.4 three@0.160.0 @webxr-input-profiles/assets@1.0.20`,
extrair, copiar os caminhos da tabela de `vendor/HASHES.md` e reconferir os hashes com o comando que está lá.

## 6. Depois das edições

1. Aplicar as três edições da §1 e o ajuste de `tests/_jogo.mjs` (§1, atenção).
2. `grep -n "unpkg.com\|cdn.jsdelivr.net" index.html` vazio; `pnpm test` verde (agora sem depender de CDN, só do
   gstatic para quem testar login).
3. Abrir o jogo publicado com a aba Rede do navegador filtrada por `jsdelivr`/`unpkg`: nada deve aparecer.
4. Seguir para a CSP (`09-configuracao.md` F1), já com `script-src 'self' https://www.gstatic.com/firebasejs/`.
