# Ações manuais do dono (fora do código)

Lista do que precisa ser feito nos painéis da Metered, do Firebase/Google Cloud e do GitHub para fechar os achados V07, V09, V14, V15 e V16 de `relatorio_auditoria.md`. Nada aqui muda o jogo; tudo é configuração de conta. Fazer na ordem (a credencial do TURN é a mais urgente: está no histórico público do git).

Convenções: **Por quê** diz o risco que o passo fecha; **Como verificar** é o teste que mostra que deu certo. Onde um passo exigir mudança no `index.html`, está dito.

## 1. Metered (TURN): rotacionar a credencial

- Onde: https://dashboard.metered.ca → **TURN Server** → o app do jogo → **Credentials** (ou **Manage credentials**). Apagar a credencial atual (`username` começando em `7e5e…`) e criar uma nova. Depois, na mesma página do app, ligar o **alerta de cota** (e-mail quando o uso passar de uma porcentagem do plano) e, se o plano mostrar **Allowed domains / Origins**, restringir a `costamaiavitor.github.io` (e `localhost` para testes).
- No código: colar o `username` e o `credential` novos na constante `ICE` (`index.html`, l. 5050, bloco `turn:global.relay.metered.ca`). A credencial continuará pública por natureza (o navegador precisa dela para falar com o TURN); o que muda é que a antiga, que está no histórico do git, deixa de valer. Credencial temporária por servidor (TURN REST) é decisão de arquitetura, fora desta lista.
- Por quê: qualquer pessoa com o `username`/`credential` atuais usa o relay como proxy ou esgota a cota grátis, e aí quem está atrás de NAT simétrico não entra mais nas salas (V09).
- Como verificar: com a antiga apagada, abrir o jogo em dois navegadores em redes diferentes (celular no 4G + computador) e entrar na mesma sala; em `chrome://webrtc-internals` o par selecionado deve aparecer como `relay` em pelo menos um lado quando a ligação direta falhar. No painel da Metered, o contador de uso da credencial nova deve subir e o da antiga não existir mais.

## 2. Firebase: publicar `firestore.rules`

- Onde: https://console.firebase.google.com → projeto `tiroteio-237ee` → **Firestore Database** → aba **Regras**. Antes de colar, trocar no arquivo `firestore.rules` o placeholder `'COLOQUE_AQUI_O_UID_DO_DONO'` pelo uid da conta do dono (**Authentication → Users**, coluna "UID do usuário" da conta `costamaiavitor@gmail.com`); sem isso, a conta do dono continua recebendo as skins em memória, mas a gravação das 1100 de uma vez é recusada pela regra de +1 item por gravação. Colar o conteúdo inteiro do arquivo e **Publicar**.
- Testar no **Simulador de regras** (botão na própria aba), autenticado com um uid de teste, dois casos:
  1. `create` em `players/<uid de teste>` com `{ xp: 0, cases: 2, items: [], equipped: {}, opened: 0, name: "Teste", created: <timestamp "request.time"> }` → deve **permitir**;
  2. `update` no mesmo documento com `{ xp: 7.5, cases: 3, items: ["glock:dragao"], equipped: { glock: "dragao" }, opened: 0, name: "Teste", upd: <request.time> }` → deve **permitir**; repetir com `cases: 999` → deve **negar**.
- Por quê: hoje a regra só confere o uid, então qualquer conta grava qualquer coisa no próprio documento (campos extras, 1 MiB de lixo, `cases: 999999`, milhares de gravações por segundo) e esgota a cota de todos (V07, D1/D3/D4).
- Como verificar: no jogo, entrar com uma conta, ganhar XP numa partida e abrir uma caixa; a mensagem "Não consegui salvar na nuvem" não pode aparecer, e no console do Firestore o documento deve mostrar `upd` atualizado. Com a conta do dono, entrar e conferir que o status "Conta do dono: todas as … skins liberadas" aparece sem erro de permissão.

## 3. Google Cloud: restringir a chave de API do navegador

- Onde: https://console.cloud.google.com → projeto `tiroteio-237ee` → **APIs e serviços → Credenciais** → chave **"Browser key (auto created by Firebase)"** (a `apiKey` que começa com `AIzaSyDSRN…`, `index.html` l. 8130).
  - **Restrições de aplicativo → Referenciadores HTTP (sites)**: `https://costamaiavitor.github.io/*`, `http://localhost:*/*`, `http://127.0.0.1:*/*`.
  - **Restrições de API → Restringir chave**: Identity Toolkit API, Token Service API, Cloud Firestore API, Firebase Installations API. Salvar (leva alguns minutos para valer).
- Por quê: a chave é pública por natureza, mas sem restrição qualquer script fora do site (um `node` com o SDK) inicializa o projeto, cria contas em massa e consome a cota de Auth/Firestore (V14, D2).
- Como verificar: no site publicado, fazer login com Google e com e-mail/senha e salvar progresso (abrir uma caixa); nada pode falhar. Num terminal, `curl "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=<apiKey>" -H "Content-Type: application/json" -d "{}"` (sem `Referer`) deve voltar `403 … API_KEY_HTTP_REFERRER_BLOCKED`, e não `400 MISSING_EMAIL`.

## 4. Firebase Authentication: domínios autorizados e proteção contra enumeração

- Onde: console do Firebase → **Authentication → Settings (Configurações) → Authorized domains (Domínios autorizados)**: deixar só `costamaiavitor.github.io` e `localhost`; remover `tiroteio-237ee.firebaseapp.com`/`…web.app` se não forem usados para hospedar o jogo (o `authDomain` do popup continua funcionando mesmo fora da lista). Na mesma tela, **User actions (Ações do usuário)** → ativar **Email enumeration protection (Proteção contra enumeração de e-mails)**.
- Por quê: um domínio a mais na lista permite que um site de terceiros abra o popup de login do projeto; sem a proteção, as mensagens de erro distinguem "sem conta" de "senha errada" e o endpoint de cadastro revela quais e-mails já existem (V14, A5/A6).
- Como verificar: login no site publicado e em `localhost` funciona; num site qualquer, abrir o console do navegador e tentar `signInWithPopup` com a mesma config deve dar `auth/unauthorized-domain`. Tentar entrar com um e-mail inexistente e com senha errada deve mostrar a mesma mensagem genérica (o jogo já trata `auth/invalid-credential`; se aparecer um texto estranho, é preciso ajustar o `switch` de erros em `index.html`, l. ≈ 8201).

## 5. Firebase App Check (reCAPTCHA v3), primeiro em modo monitorar

- Onde: console do Firebase → **App Check** → **Apps** → registrar o app web com o provedor **reCAPTCHA v3** (criar a chave em https://www.google.com/recaptcha/admin para o domínio `costamaiavitor.github.io` + `localhost`, colar a chave secreta no App Check). Em **APIs**, deixar **Authentication** e **Cloud Firestore** em **Monitorar** (não "Aplicar") por uma ou duas semanas.
- O que muda no código antes de "Aplicar" (não feito neste lote; **só depois** que o item estiver em monitorar): em `fbInit` (`index.html`, l. ≈ 8174-8176) importar `firebase-app-check.js` junto com os outros módulos e chamar `initializeAppCheck(app, { provider: new ReCaptchaV3Provider('<site key>'), isTokenAutoRefreshEnabled: true })` logo depois de `initializeApp`; na CSP (quando ela existir) acrescentar `https://www.google.com` e `https://www.gstatic.com` em `script-src` e `frame-src`, e `https://firebaseappcheck.googleapis.com` em `connect-src`; nos testes locais, usar um *debug token* do App Check (`self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` só em `localhost`) e registrá-lo em **App Check → Apps → ⋮ → Gerenciar tokens de depuração**.
- Por quê: é a única barreira que distingue o jogo de um script qualquer usando a mesma config; as regras do Firestore e a restrição da chave reduzem o abuso, mas não o impedem (V14, D2).
- Como verificar: em modo monitorar, a aba **App Check → métricas** mostra as requisições como "não verificadas" (esperado antes do código) sem nenhuma falha no jogo; depois do código e de "Aplicar", as requisições passam a "verificadas" e login/salvar continuam funcionando no site e em `localhost` com o token de depuração.

## 6. Firebase Storage: conferir se existe e fechar

- Onde: console do Firebase → **Storage** (menu Build). Se aparecer "Vamos começar"/"Get started", o bucket não existe: **não ativar** e pronto. Se já existir um bucket, abrir a aba **Rules (Regras)** e publicar:

  ```
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      match /{allPaths=**} {
        allow read, write: if false;
      }
    }
  }
  ```

  Aproveitar para conferir que **Realtime Database** e **Functions** também não estão ativados.
- Por quê: o config do jogo traz `storageBucket` (`index.html` l. 8133) sem o Storage ser usado; se o bucket existir com as regras padrão, qualquer conta nova hospeda arquivos no projeto, com custo de armazenamento e tráfego (V16, D9).
- Como verificar: a aba Storage mostra "Vamos começar" ou as regras acima publicadas; o jogo não muda (ele nunca importa `firebase-storage`).

## 7. GitHub: proteger a `main` e ligar as varreduras

- Onde: https://github.com/costamaiavitor/tiroteio → **Settings**.
  - **Rules → Rulesets → New ruleset → New branch ruleset**: nome `main`, *Enforcement status* **Active**, *Target branches* → *Add target* → **Default branch**. Marcar **Restrict deletions**, **Block force pushes**, **Require a pull request before merging** (1 aprovação; num projeto de duas pessoas, se a aprovação travar o fluxo, deixar 0 aprovações mas manter o PR obrigatório) e **Require linear history**. Quando houver CI, **Require status checks to pass**. Em *Bypass list*, não adicionar ninguém (nem o próprio dono: a exceção é só editar o ruleset quando precisar).
  - **Security (Code security and analysis)**: ativar **Dependabot alerts**, **Secret scanning** e **Push protection**; em **Code scanning**, **CodeQL analysis → Default setup** (JavaScript/TypeScript; Python se quiser cobrir `tools/blender`). Tudo grátis em repositório público.
- Por quê: qualquer push na `main` vira em segundos o jogo que todos carregam (com acesso ao Firestore deles); hoje não há revisão, proibição de force-push nem varredura de segredos, e a credencial do TURN teria sido barrada pelo push protection (V15, F6).
- Como verificar: `git push --force origin main` a partir de um clone deve ser recusado com a mensagem do ruleset; um push direto na `main` também. Em **Security**, os quatro itens aparecem como "Enabled" e, depois do primeiro CodeQL, a aba **Code scanning** lista a análise.

## 8. GitHub Pages: conferir a publicação e esconder as pastas de desenvolvimento

- Onde: **Settings → Pages**. Hoje: *Source* **Deploy from a branch**, *Branch* `main`, pasta `/ (root)`. Confirmar que continua assim depois de mesclar esta branch; o `_config.yml` novo na raiz faz o Jekyll do Pages **não publicar** `tools/`, `tests/`, `docs/`, `package.json`, `pnpm-lock.yaml`, `firestore.rules` e `CLAUDE.md` (o `README.md` continua acessível de propósito).
- Opcional, mais robusto: **Settings → Pages → Source → GitHub Actions** com um workflow (`.github/workflows/pages.yml`) que usa `actions/upload-pages-artifact` enviando só `index.html`, `assets/` e `vendor/` (quando existir) e `actions/deploy-pages`. Isso também permite exigir revisão no ambiente `github-pages` (*Environments → github-pages → Required reviewers*). Se fizer isso, o `_config.yml` deixa de ser necessário (não atrapalha).
- Por quê: o build legacy publica tudo o que está na `main`; sem o `_config.yml`, a auditoria inteira (com linhas e valores de credencial repetidos em `01-segredos.md`) seria servida ao lado do jogo (V15, F5).
- Como verificar: depois do deploy (aba **Actions → pages-build-deployment** verde), `https://costamaiavitor.github.io/tiroteio/` abre o jogo e `https://costamaiavitor.github.io/tiroteio/docs/seguranca/relatorio_auditoria.md`, `…/tools/blender/export.py` e `…/tests/servidor.mjs` devolvem **404**.

## 9. GitHub: revisar quem escreve e os tokens

- Onde: **Settings → Collaborators and teams**: conferir cada pessoa com *Write* ou *Admin* e tirar quem não precisa. Em https://github.com/settings/tokens (de cada conta que faz push, inclusive a usada pela automação): trocar tokens clássicos por **fine-grained** com prazo de validade, limitados a este repositório e à permissão `contents: write`; revogar os que ninguém reconhece. Se a automação precisar de push direto, dar a ela um branch próprio (`claude/*`) e exigir PR para a `main` (item 7).
- Por quê: o histórico mostra três identidades fazendo push direto na `main` (uma automatizada); um token vazado de qualquer uma delas troca o jogo de todos em segundos (V15, F6).
- Como verificar: a lista de colaboradores tem só quem deve; cada token ativo tem dono, prazo e escopo conhecidos; o próximo push da automação chega como PR (ou é recusado na `main`).
