# Auditoria 01 — Segredos expostos

Branch `security-hardening` (`7bb7797`, base `origin/main`), 02/10/2026. Repositório **público** (`costamaiavitor/tiroteio`, confirmado por `gh repo view`), publicado em `costamaiavitor.github.io/tiroteio` (GitHub Pages). Linhas referem-se a `index.html` nessa revisão. Somente leitura; nenhum arquivo de código foi alterado.

Método: `grep` em `index.html`, `README.md`, `tools/`, `tests/`, `package.json`, `pnpm-lock.yaml`; `git log --all -p` com grep; `git log --all -S'<valor>'` para datar; `git grep` na ponta de cada branch (local e `origin/claude/*`); `git log --all --name-only --diff-filter=A` para arquivos; `curl` da página publicada. As consultas à API do Google (restrição de referrer da chave, App Check) foram bloqueadas pela política do ambiente e ficam como verificação manual (ver S3).

### [S1] Credenciais TURN estáticas da Metered no código, no histórico e no site publicado
- Arquivo e linha (ou commit): `index.html` l. 5049–5050 (`username: '7e5e…(redigido)', credential: 'lsm3…(redigido)'`, dentro de `ICE`, l. 5046–5051). Entrou no commit `58b2d6e` (30/09/2026, "Troca o TURN morto pelo da Metered"). Presente na ponta de **todas** as branches: `main`, `security-hardening`, `zumbis-alcance`, `origin/main`, `origin/claude/tiroteio-online-connection-kvekur`, `origin/claude/vibrant-fermi-ulajqn`. Servida ao vivo em `costamaiavitor.github.io/tiroteio` (l. 5056 da página publicada).
- Descrição: par usuário/senha estático de uma conta Metered (plano grátis, comentário na l. 5048). É uma credencial real do dono: TURN não tem conceito de origem/domínio, então quem tiver o par usa o relay como se fosse o dono, de qualquer programa, não só do jogo. Está indexável no GitHub e em qualquer fork ou cache.
- Cenário de exploração: terceiro copia o par e aponta um cliente TURN qualquer (ou outro jogo WebRTC) para `global.relay.metered.ca`; consome a cota mensal do plano grátis (o jogo perde o relay e quem está atrás de NAT restritivo não entra mais: negação de serviço) ou gera cobrança se houver cartão/plano pago; pode usar o relay como proxy de tráfego abusivo atribuído à conta do dono (risco de suspensão da conta).
- Severidade: Alta
- Correção sugerida: (1) **Manual, imediata:** no painel da Metered, apagar/rotacionar esse par de credenciais; remover do código não resolve, o valor continua no histórico público. (2) Trocar por credenciais de curta duração: a Metered gera pares temporários pela API `…/api/v1/turn/credentials?apiKey=…`, mas essa `apiKey` é secreta e não pode ir ao navegador: precisa de uma função mínima (Cloud Function/Worker) que, para usuário logado no Firebase, devolva o par com validade de minutos, e o cliente monte `ICE` com o resultado. (3) Enquanto não houver backend: usar o Open Relay público da Metered (sem cota do dono) ou manter o par novo com alerta de cota no painel, sabendo que ficará público de novo. Funcionalidade do jogo não muda.

### [S2] Credenciais antigas `openrelayproject` no histórico
- Arquivo e linha (ou commit): commit `740dbd3` (29/09/2026, primeiro commit), `index.html` l. 1019–1021; removidas em `58b2d6e`. Fora do código atual (0 ocorrências em todas as pontas); só citadas de passagem em `docs/seguranca/mapa_sistema.md` l. 119 (commit `7bb7797`).
- Descrição: `username: 'openrelayproject', credential: 'openrelayproject'` para `turn:openrelay.metered.ca`. É o par **público e documentado** do projeto Open Relay da Metered, igual para todo mundo. Não é segredo do dono.
- Cenário de exploração: nenhum; ninguém ganha nada com esse par além do que já está publicado pela Metered.
- Severidade: Baixa
- Correção sugerida: nenhuma ação. Registrado só para que não seja confundido com vazamento numa varredura futura.

### [S3] Configuração do Firebase pública sem restrição da chave nem App Check
- Arquivo e linha (ou commit): `index.html` l. 8129–8136 (`FIREBASE_CONFIG`: `apiKey 'AIzaSyDSRN…(redigido)'` l. 8130, `projectId 'tiroteio-237ee'` l. 8132, `messagingSenderId '226278812286'` l. 8134, `appId` l. 8135). Entrou em `e4533a7` (30/09/2026). Em todas as branches e na página publicada (l. 8195). `fbInit` (l. 8178–8188) importa só `firebase-app`, `firebase-auth` e `firebase-firestore`: **não há `initializeAppCheck`** em lugar nenhum do código (grep sem resultado). Regras do Firestore no `README.md` l. 138–145 (só `request.auth.uid == uid`); domínios autorizados l. 134.
- Descrição: a `apiKey` do Firebase identifica o projeto e é pública por natureza (o comentário da l. 8128 e o README l. 151 estão corretos nesse ponto); **não precisa ser rotacionada**. O que falta é o que limita o uso dela fora do site: (a) não foi possível confirmar se a chave tem restrição de referrer HTTP e de APIs no Google Cloud (a consulta foi bloqueada neste ambiente; verificar manualmente); (b) sem App Check, qualquer script fora do navegador fala com Auth e Firestore em nome do projeto; (c) as regras não validam forma nem limites dos dados (tema da auditoria de autenticação/Firestore, não deste relatório).
- Cenário de exploração: com a chave e o `projectId`, um script usa a API Identity Toolkit para criar contas em massa, testar listas de e-mail/senha vazadas contra as contas de e-mail/senha do jogo (credential stuffing) e enumerar e-mails cadastrados, consumindo as cotas de autenticação do projeto; usa a API REST do Firestore para gravar documentos `players/{uid}` de tamanho arbitrário dentro do que as regras deixam (custo de leitura/escrita e armazenamento).
- Severidade: Média
- Correção sugerida: **manual, sem mudar o código**: (1) Google Cloud → APIs e serviços → Credenciais → chave "Browser key (auto created by Firebase)": restringir a referrers `costamaiavitor.github.io/*` e `localhost:*` e às APIs Identity Toolkit, Token Service e Cloud Firestore (lembrando que referrer é forjável fora do navegador; é só uma primeira barreira). (2) Firebase → App Check com reCAPTCHA v3/Enterprise, registrar o domínio e **aplicar** em Firestore e Authentication; no código isso vira um `import` de `firebase-app-check.js` e uma chamada `initializeAppCheck` logo após `initializeApp` em `fbInit` (não altera a funcionalidade). (3) Authentication → Configurações → ligar a proteção contra enumeração de e-mails e manter "uma conta por e-mail". (4) Definir alertas de orçamento/cota no projeto.

### [S4] E-mail pessoal do dono como lista `OWNERS` no cliente
- Arquivo e linha (ou commit): `index.html` l. 8138 (`const OWNERS = ['costamaiavitor@gmail.com']`), usado em `profOnUser` l. 8197 (`grantAllSkins()`, l. 8139–8146). Entrou em `b46725b` (30/09/2026). Em todas as branches e na página publicada (l. 8203).
- Descrição: não é credencial, é dado pessoal publicado num site aberto, usado como "controle" de privilégio no cliente. Como qualquer jogador pode se dar todas as skins editando o próprio navegador (README l. 151 admite isso), a lista não protege nada; só expõe o e-mail e aponta qual conta do Firebase vale a pena atacar (o provedor e-mail/senha está ativo, README l. 133).
- Cenário de exploração: phishing/spam dirigido ao dono; tentativas de login por e-mail/senha nessa conta via Identity Toolkit (combina com S3); engenharia social em nome do "dono" dentro do jogo.
- Severidade: Baixa
- Correção sugerida: trocar o e-mail pelo `uid` do Firebase na lista (o `uid` não identifica a pessoa fora do projeto) ou, melhor, marcar o dono no Firestore num campo que só o console edita (ou custom claim) e ler isso em vez da lista; funcionalidade igual. Manual: ligar verificação em duas etapas na conta Google do dono. O valor continua no histórico público; não há o que rotacionar.

### [S5] Histórico público e imutável na prática (forks, caches, metadados)
- Arquivo e linha (ou commit): commits `740dbd3`, `58b2d6e`, `e4533a7`, `b46725b` estão em `origin/main` e nas duas branches remotas `origin/claude/*` (`git branch -r --contains`). Metadados de autoria (`git log --format=%ae`): `costamaiavitor@gmail.com` (66 commits), `caiobholanda2007@gmail.com` (15), `noreply@anthropic.com` (33).
- Descrição: tudo o que entrou em qualquer commit enviado ao GitHub de um repositório público (S1, S3, S4) deve ser considerado permanentemente exposto: forks, páginas em cache, raspadores de segredos e as branches `claude/*` guardam cópias. Reescrever o histórico (`git filter-repo` + force push + pedido de limpeza ao suporte do GitHub) não garante remoção.
- Cenário de exploração: credencial "removida" do código continua utilizável por quem já a coletou (vale sobretudo para S1).
- Severidade: Baixa (consequência dos achados acima, não um vazamento novo)
- Correção sugerida: tratar **rotação** como a única correção efetiva (S1); só depois, se quiser, reescrever o histórico e apagar as branches `origin/claude/*` já mescladas. Para commits futuros, usar o e-mail `noreply` do GitHub nos metadados, se os autores preferirem não expor o pessoal. Adicionar ao `.gitignore` (hoje só `_sk/` e `node_modules/`) os padrões `.env*`, `*service-account*.json`, `*.pem`, `*.key` para evitar um acidente futuro.

## Verificações sem achado

- Nenhum `.env`, `.firebaserc`, `firebase.json`, JSON de service account, `.pem`, `.key` ou `.p12` em nenhum commit de nenhuma branch (`git log --all --name-only`, filtrado por esses padrões: vazio). Fora de `assets/`, os únicos arquivos que já existiram são `.gitignore`, `README.md`, `index.html`, `package.json`, `pnpm-lock.yaml`, `docs/seguranca/*`, `tests/*.mjs`, `tools/*.js` e `tools/blender/*`.
- `package.json` e `pnpm-lock.yaml`: sem `_authToken`, registry privado ou URL com credencial.
- `tests/*.mjs`: só `http://127.0.0.1:<porta>` local; nenhuma credencial.
- `tools/skview.js`, `vmtest.js`, `wfit.js`: só `POST http://127.0.0.1:8799` (receptor local); `tools/blender/*.py` e `pipeline.sh`: sem caminhos pessoais (`C:\Users`, `/home`, `Desktop`) nem chaves.
- PeerJS: `new Peer(...)` (l. 5155 e 5194) usa o servidor público `0.peerjs.com` sem chave; `PEER_PREFIX` (l. 459) e `genCode` (l. 5131) não são segredos.
- STUN do Google (l. 5047): público, sem credencial.
- Não há `Bearer`, `token`, `secret` ou `password` com valor real em lugar nenhum do código atual (as ocorrências são o campo `<input type="password">` l. 8270 e os códigos de erro `auth/*` l. 8204–8205).

## Resumo

| Id | Severidade | Título |
|---|---|---|
| S1 | Alta | Credenciais TURN estáticas da Metered no código, no histórico e no site publicado (rotacionar) |
| S2 | Baixa | Credenciais antigas `openrelayproject` no histórico (par público da Metered; sem ação) |
| S3 | Média | Configuração do Firebase pública sem restrição da chave nem App Check (restringir chave, ligar App Check) |
| S4 | Baixa | E-mail pessoal do dono como lista `OWNERS` no cliente |
| S5 | Baixa | Histórico público e imutável na prática (rotação é a única correção efetiva) |
