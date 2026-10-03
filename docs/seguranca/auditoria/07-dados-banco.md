# Auditoria de segurança — 07. Dados e banco

Branch `security-hardening`, `index.html` em 8565 linhas (02/10/2026). Somente leitura: nenhum arquivo de código foi alterado. Linhas citadas referem-se a `index.html`, salvo indicação.

## Contexto verificado no código

- **Firestore**: um documento por jogador em `players/{uid}`. Regras publicadas só no `README.md` (l. 134–142): `allow read, write: if request.auth != null && request.auth.uid == uid;`. Não há `firestore.rules`, `firebase.json` nem `.firebaserc` no repositório (as regras vivem apenas no console).
- **Esquema real gravado pelo cliente honesto** (`newProfile`, l. 8149; `cleanProf`, l. 8151–8157):
  - criação (l. 8193): `{ xp, cases, items, equipped, opened, name, created: serverTimestamp() }`
  - atualização com `merge: true` (l. 8166): `{ xp, cases, items, equipped, opened, name, upd: serverTimestamp() }`
  - `xp`: número, **pode ser fracionário** (abate contra bot vale metade: `(m.hs ? 15 : 10) * .5` → 7,5 ou 5, l. 7742) e, no cliente honesto, fica sempre em `[0, 300)` porque `grantXP` (l. 8221–8227) converte cada 300 XP em uma caixa.
  - `cases`, `opened`: inteiros ≥ 0 (`d.cases++`, `d.cases--`, `d.opened++`).
  - `items`: lista de strings `arma:skin`; 55 armas com skin (`SKIN_WEAPONS`, l. 2729, avaliado: `knife glock usp … law crossbow karambit`) × 20 acabamentos (`SKINS`, l. 2704–2725) = **máximo 1100 itens**, cada um com no máximo 23 caracteres (ids `[a-z0-9_]` : `[a-z]`). O dono (`OWNERS`, l. 8138) recebe os 1100 de uma vez (`grantAllSkins`, l. 8139–8146).
  - `equipped`: mapa `arma → skin` mais a chave especial `_faca` com valor fixo `'karambit'` (`cleanSk`, l. 8150; `equipItem`, l. 8240–8244). `cleanSk` corta em 80 chaves.
  - `name`: `displayName` do Google ou a parte antes do `@` do e-mail (l. 8184).
- **Escrita**: `profSave` (l. 8160–8169) grava no `localStorage` na hora e, se logado, agenda o `setDoc` com atraso de 3 s (`clearTimeout` a cada chamada: o temporizador recomeça a cada XP) ou imediato (`now_`) ao abrir caixa (l. 8372), ao esconder a aba (l. 8170), ao sair da conta (l. 8215) e ao liberar skins do dono (l. 8144).
- **Storage**: `storageBucket` está em `FIREBASE_CONFIG` (l. 8133), mas não há `getStorage`, `firebase-storage` nem `ref(`/`uploadBytes` em lugar nenhum (grep sem resultado). O produto Storage não é usado.
- **App Check / restrição da chave**: não há `initializeAppCheck`, `ReCaptcha` nem referência a App Check (grep sem resultado).

---

### [D1] Regras do Firestore sem validação de esquema, tipos ou tamanhos
- Arquivo e linha: `README.md` l. 134–142 (regras publicadas); `index.html` l. 8166 e 8193 (escritas); l. 8151–8157 (`cleanProf`, a única validação, e ela roda só no cliente).
- Descrição: a regra atual só confere que `request.auth.uid == uid`. Qualquer usuário autenticado (basta uma conta Google ou e-mail/senha, que o próprio app deixa criar) pode gravar no seu documento **qualquer conteúdo**: campos arbitrários, `items` com milhares de strings até o limite de 1 MiB por documento, `xp`/`cases` com números negativos, `NaN`-equivalentes, strings, mapas aninhados, ou apagar o documento (`delete` está incluído em `write`). O cliente honesto nunca grava nada disso, então restringir não muda nada para ele.
- Cenário de exploração: (a) com a `apiKey` pública (l. 8130) e um login, um script de 10 linhas usando o SDK do Firebase grava `players/{meu uid}` com `items` = lista de 1100 strings válidas e `cases: 999999` (ver D4); (b) o mesmo script grava um documento de ~1 MiB com lixo (lista de 50 000 strings) e repete em laço: consumo de cota de escrita/armazenamento do plano gratuito, lentidão na leitura do próprio perfil, sem valor para o jogo mas com custo para o projeto; (c) campos extras (`admin: true`, `role`, HTML em `name`) não têm efeito hoje porque `cleanProf` ignora tudo que não conhece e `name` passa por `esc()` (l. 8273), mas qualquer tela futura que leia o documento com confiança herdaria o problema.
- Severidade: **Alta** (dados do próprio usuário apenas, mas sem nenhum limite de forma, tamanho ou custo).
- Correção sugerida: publicar as regras abaixo (**ação manual no console do Firebase → Firestore Database → Regras**, e também atualizar o bloco do `README.md`). Elas aceitam exatamente o que o cliente honesto grava hoje e recusam o resto. Recomenda-se ainda versionar o texto em `firestore.rules` no repositório, para a próxima mudança ter histórico e revisão.

  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /players/{uid} {
        // ---- quem ----
        function dono() { return request.auth != null && request.auth.uid == uid; }
        function d() { return request.resource.data; }

        // ---- forma de cada campo (espelha newProfile/cleanProf/cleanSk do index.html) ----
        function inteiro(v) { return v is int && v >= 0; }
        // items: lista de "arma:skin" (ids de arma [a-z0-9_], ids de skin [a-z]); 55 armas x 20 skins = 1100 no máximo
        function itensOk(l) {
          return l is list && l.size() <= 1200
            && l.join(',').matches('^$|^[a-z0-9_]{1,24}:[a-z]{1,16}(,[a-z0-9_]{1,24}:[a-z]{1,16})*$');
        }
        // equipped: mapa arma -> skin, mais a chave especial _faca (valor 'karambit'); cleanSk corta em 80 chaves
        function equipOk(m) {
          return m is map && m.keys().size() <= 80
            && m.keys().join(',').matches('^$|^[a-z0-9_]{1,24}(,[a-z0-9_]{1,24})*$')
            && m.values().join(',').matches('^$|^[a-z]{1,16}(,[a-z]{1,16})*$');
        }
        function formaOk() {
          return d().keys().hasOnly(['xp', 'cases', 'items', 'equipped', 'opened', 'name', 'upd', 'created'])
            && d().keys().hasAll(['xp', 'cases', 'items', 'equipped', 'opened'])
            && d().xp is number && d().xp >= 0 && d().xp < 300        // XP_CASE: grantXP sempre deixa xp < 300 (pode ser fracionário)
            && inteiro(d().cases) && d().cases <= 100000
            && inteiro(d().opened) && d().opened <= 1000000
            && itensOk(d().items)
            && equipOk(d().equipped)
            && (!('name' in d()) || (d().name is string && d().name.size() <= 100));
        }

        // ---- permissões ----
        allow get: if dono();
        allow list: if false;                                   // o app nunca consulta a coleção
        allow create: if dono() && formaOk()
            && d().created == request.time                      // serverTimestamp() da l. 8193
            && !('upd' in d());
        allow update: if dono() && formaOk()
            && d().upd == request.time                          // serverTimestamp() da l. 8166
            && (!('created' in resource.data) || d().created == resource.data.created)  // created é imutável
            && d().opened >= resource.data.opened;              // caixas abertas nunca diminuem
        allow delete: if false;                                 // o app não exclui (ver D8 se um dia tiver "Excluir conta")
      }
    }
  }
  ```

  Observações para não quebrar o jogador honesto:
  - `xp < 300` depende de `XP_CASE` (l. 8137). Se o valor mudar no código, mudar na regra junto (ou afrouxar para `xp < 10000` e perder só esse limite).
  - A regra de `create` exige `created`; a escrita com `merge` (l. 8166) só cria documento se ele tiver sido apagado à mão no console. Nesse caso raro o usuário precisa sair e entrar de novo (o caminho da l. 8193 recria com `created`). Alternativa: trocar `d().created == request.time` por `(!('created' in d()) || d().created == request.time)`.
  - Documentos antigos com campos fora da lista (não há indício de que existam: a coleção nasceu no commit `ec521dd` já com este esquema) passariam a ser recusados até o cliente regravar só os campos conhecidos; como o `merge` mantém campos antigos, seria preciso limpá-los uma vez pelo console.
  - Antes de publicar, rodar o **Simulador de regras** do console com os dois payloads reais (criação e merge) para um uid de teste.

### [D2] Sem App Check nem restrição de domínio na chave de API
- Arquivo e linha: `index.html` l. 8129–8135 (`FIREBASE_CONFIG`); l. 8171–8181 (`fbInit`, sem `initializeAppCheck`); `README.md` l. 148 ("a apiKey não é segredo").
- Descrição: a `apiKey` é pública por natureza, mas nada liga o projeto ao site `costamaiavitor.github.io`: qualquer script, em qualquer origem, pode inicializar o Firebase com essa configuração, criar conta, logar e usar o Firestore e o Auth. Sem App Check, as regras de D1 são a única barreira e elas não distinguem o jogo de um script.
- Cenário de exploração: ferramenta externa ("trainer") que loga com a conta do jogador e grava skins; ou uso do projeto como backend de autenticação gratuito para outro site (criação de contas em massa, consumo da cota de Auth e Firestore).
- Severidade: **Média**.
- Correção sugerida (tudo **ação manual no console**, mais uma linha de código):
  1. Firebase → App Check → registrar o app Web com reCAPTCHA v3 (ou Enterprise) e **aplicar** (enforce) em Firestore e Authentication. No código, depois dos `import()` da l. 8174, importar `firebase-app-check.js` e chamar `initializeAppCheck(app, { provider: new ReCaptchaV3Provider('<site key>'), isTokenAutoRefreshEnabled: true })` antes de `getAuth`/`getFirestore`. Testar primeiro em modo "monitorar" para não bloquear jogadores com navegadores que falham no reCAPTCHA.
  2. Google Cloud Console → APIs e serviços → Credenciais → chave `AIzaSyDSRN…` → **Restrições de aplicativo: referenciadores HTTP** `https://costamaiavitor.github.io/*` e `http://localhost:*` (desenvolvimento). Isso não impede chamadas com `Referer` forjado fora do navegador, mas corta o uso casual a partir de outros sites.
  3. Authentication → Configurações → Domínios autorizados: confirmar que só `costamaiavitor.github.io` e `localhost` estão na lista (já previsto no README l. 128).

### [D3] Sem limite de taxa de escrita no documento
- Arquivo e linha: `README.md` l. 134–142; `index.html` l. 8160–8169 (`profSave`, atraso de 3 s).
- Descrição: as regras não limitam quantas vezes por segundo o mesmo usuário grava. O cliente honesto grava no máximo a cada 3 s (ou imediatamente em 4 eventos pontuais); um script pode gravar centenas de vezes por segundo até esgotar a cota gratuita do projeto (20 000 escritas/dia no Spark), deixando todos os jogadores sem salvar.
- Cenário de exploração: negação de serviço do progresso de todos (as escritas dos outros jogadores passam a falhar com `resource-exhausted`; o app mostra "Não consegui salvar na nuvem", l. 8167).
- Severidade: **Média**.
- Correção sugerida: acrescentar à regra de `update` de D1 um intervalo mínimo usando o próprio `upd` (que já é `serverTimestamp()`):

  ```
  && request.time > resource.data.upd + duration.value(1, 's')
  ```

  Com 1 s o jogador honesto não é afetado (o único caso de duas escritas imediatas seguidas é abrir caixa e esconder a aba no mesmo segundo; a escrita recusada é refeita na próxima mudança e o estado local está no `localStorage`). Isso limita o usuário a 86 400 escritas/dia, ainda acima da cota, então o App Check (D2) e as cotas/alertas de orçamento do projeto (**console → Uso e faturamento → alertas**) continuam necessários. Documentos sem `upd` (criados e nunca atualizados) precisam da exceção `!('upd' in resource.data) ||`.

### [D4] Progresso (XP, caixas, skins) decidido e gravado pelo cliente
- Arquivo e linha: `index.html` l. 7651, 7670, 7715, 7723, 7737, 7742 (chamadas de `grantXP` a partir de mensagens do host), l. 8221–8227 (`grantXP`), l. 8366–8373 (`openCaseUI`: `d.cases--; d.opened++; d.items.push(it)` e `profSave(true)`), l. 8139–8146 (`grantAllSkins`).
- Descrição: o host não participa do progresso, e o Firestore não tem como saber se o XP foi "ganho de verdade". O usuário pode: editar `PROF.data` pelo console (`window.__T.PROF`, l. 8560, exposto em produção), alterar `localStorage` `tiroteio.prof.<uid>` antes de uma gravação, chamar `__T.grantAllSkins()` (dá as 1100 skins a qualquer conta, não só ao dono) ou gravar direto no Firestore. O README (l. 148) reconhece isso como aceitável entre amigos. O que as regras **podem** fazer é limitar o salto por escrita, de modo que o resultado de uma trapaça precise de muitas escritas (e então D3 e App Check entram).
- Cenário de exploração: `__T.PROF.data.cases = 500; __T.PROF.data.items = [...todas]; profSave` → conta com tudo. Só afeta o próprio jogador e o que os outros veem (`skins` na rede, D6).
- Severidade: **Baixa** (jogo entre amigos, sem valor monetário; o próprio README aceita). Sobe para Média se o jogo virar público ou se skins passarem a ter valor.
- Correção sugerida: limitar o incremento de `cases` por escrita na regra de `update` de D1. Valores medidos no código para calibrar o teto:
  - XP por evento: abate 10/15 (metade contra bot), zumbi 3/5 + tipo (Veloz +2, Explosivo/Tóxico +3, Gritador +4, Brutamonte +6, Carniceiro +50; `ZKIND`, l. 5752–5753), rodada sobrevivida 25, reanimar 20, fim de jogo nos zumbis 30 + 8 × rodada (rodada 40 → 350), fim de partida 150/40, repetida 60.
  - Como `profSave` reinicia o atraso de 3 s a cada XP, uma rodada inteira pode entrar numa única escrita: uma rodada alta (30–40 zumbis a ~5 XP, um Carniceiro, +25 da rodada) fica em torno de 250–350 XP, ou seja, 1–2 caixas; o fim de jogo na rodada 40 dá mais 1–2. Um teto de **+10 caixas por escrita** (3000 XP) é folgado para o jogador honesto e torna o `cases: 999999` impossível numa só escrita.
  - Regra (acrescentar ao `update`): `&& d().cases <= resource.data.cases + 10 && d().cases >= resource.data.cases - 1` (abrir caixa reduz exatamente 1). E, para o par abertura/itens: `&& (d().cases >= resource.data.cases || d().opened == resource.data.opened + 1)` (só diminui caixa se abriu uma) e `&& d().items.size() <= resource.data.items.size() + 1` para contas comuns.
  - **Contra**: o dono (`OWNERS`) recebe 1100 itens de uma vez (l. 8139); a regra de `items.size() + 1` quebraria `grantAllSkins`. Opções: (a) exceção por uid na regra (`|| request.auth.uid == '<uid do dono>'`), ou (b) trocar o mecanismo por uma leitura no cliente (`OWNERS` ganha tudo em memória, sem gravar), já que é só conveniência. Também quebraria a migração do perfil de convidado... não: ela acontece no `create`, onde não há `resource.data`; mas aí um convidado com `localStorage` editado entra com qualquer valor, então vale aplicar no `create` tetos absolutos pequenos (`cases <= 20`, `items.size() <= 50`), já que um convidado honesto raramente passa disso.
  - Com um trapaceiro persistente nenhuma regra resolve (ele grava +10 caixas por escrita, 1 por segundo com D3). A solução estrutural seria mover a concessão de XP para uma Cloud Function chamada pelo host (fora do escopo e do plano gratuito), ou aceitar o risco como o README já faz.

### [D5] Dados que trafegam entre jogadores: e-mail e uid não vazam (confirmado), nome e skins sim (esperado)
- Arquivo e linha: `index.html` l. 5206 (`join: { v, name: CFG.name, sk: cleanSk(PROF.data?.equipped) }`), l. 5255 (`welcome`), l. 5521–5527 (`srvState`: `n: p.name, sk: p.skins, k, d, m, hs, …`), l. 8273 (único uso de `PROF.email`, na própria tela).
- Descrição: `PROF.email` e `PROF.uid` aparecem apenas no cliente (UI da conta e documento do próprio usuário). O `name` que vai para a rede é o apelido do jogo (`CFG.name`, `localStorage` `tiroteio.name`), não o `displayName` do Google (`PROF.name`), que só vai para `players/{uid}` (l. 8166/8193). Os outros jogadores veem apelido, skins equipadas, placar, dinheiro/pontos, vida, bebidas e posição — tudo necessário ao jogo. Firestore trafega por TLS; dados entre jogadores por WebRTC com DTLS; o servidor de sinalização do PeerJS vê apenas ids de sala.
- Cenário de exploração: nenhum específico. Observação: `PROF.name` (nome real do Google) fica gravado no Firestore sem necessidade funcional (não é lido por nenhuma tela: `cleanProf` o descarta na leitura, l. 8151–8157); é um dado pessoal a mais no banco (ver D8).
- Severidade: **Baixa** (informativo).
- Correção sugerida: nenhuma obrigatória. Se quiser minimizar dados pessoais, parar de gravar `name` no documento (remover `name: PROF.name` das l. 8166 e 8193 e tirá-lo da lista de D1) — o Auth já guarda o nome.

### [D6] Skin anunciada na rede não é conferida contra o inventário
- Arquivo e linha: `index.html` l. 5253 (`np.skins = cleanSk(d.sk)` no `join`), l. 5339 (`case 'skins': p.skins = cleanSk(m.sk)`), l. 8150 (`cleanSk` só confere que a arma e a skin existem no catálogo).
- Descrição: o host valida a forma (`W[w] && SKIN_BY[f]`, até 80 chaves) mas não tem como saber se o jogador possui a skin. Um cliente modificado exibe aos outros qualquer acabamento (Dragão, Galáxia) sem tê-lo ganhado. É consequência direta de D4 (sem autoridade central sobre o inventário) e inerente ao desenho P2P.
- Cenário de exploração: `sendToHost({ t: 'skins', sk: { ak47: 'galaxia' } })` pelo console. Efeito puramente cosmético.
- Severidade: **Baixa**.
- Correção sugerida: sem servidor não há correção completa. Mitigação barata: o host poderia ler `players/{uid}` do outro jogador se as regras permitissem leitura pública de `items` — **não recomendado** (abriria o inventário e o `name` de todos). Manter como está e registrar como limitação conhecida.

### [D7] Dados locais: perfil em cache com o uid, sessão do Firebase persistente, nada sensível além disso
- Arquivo e linha: `index.html` l. 446–447 (`save`/`load`, prefixo `tiroteio.`), l. 8158 (`profKey`: `prof.guest` ou `prof.<uid>`), l. 8196 (`save(profKey(), PROF.data)` com os dados da nuvem), l. 8209 (`#acPass` lido só para `signInWithEmailAndPassword`/`createUserWithEmailAndPassword`), l. 8275–8277 (o valor digitado é preservado só no próprio `<input>` ao redesenhar), l. 8451/8464 (`lastSt`), l. 8447 (`name`).
- Descrição: no `localStorage` ficam o perfil de convidado, uma cópia do perfil da nuvem indexada pelo uid do Firebase, o apelido, a última configuração de sala e preferências gráficas. **A senha nunca é gravada** (confirmado: `#acPass` só aparece nas l. 8209, 8270, 8275 e 8277, todas em memória/DOM). O SDK do Firebase Auth, por padrão (`browserLocalPersistence`), guarda o token de sessão em IndexedDB (`firebaseLocalStorageDb`) e mantém o usuário logado indefinidamente no navegador — o app não oferece "não lembrar neste computador". Nada é cifrado, e não precisa: são dados de jogo. A exposição do uid a outra pessoa que use o mesmo navegador tem relevância baixa (o uid sozinho não dá acesso a nada, as regras exigem o token).
- Cenário de exploração: computador compartilhado (lan house, escola): quem usar o navegador depois continua logado na conta anterior e pode gastar as caixas dela. Dado de valor baixo.
- Severidade: **Baixa**.
- Correção sugerida: opcional. Em `fbInit` (l. 8176), `A.setPersistence(auth, A.browserSessionPersistence)` faria a sessão acabar ao fechar o navegador (custo: logar de novo a cada visita), ou uma caixa "manter conectado" no formulário da l. 8268–8272. Manter o cache `prof.<uid>` (serve de fallback quando a leitura da nuvem falha, l. 8199).

### [D8] Sem exclusão de conta e sem aviso de privacidade (LGPD) — nota informativa
- Arquivo e linha: `index.html` l. 8268–8273 (UI da conta: só Entrar/Criar conta/Sair), l. 8166/8193 (`name` gravado), `README.md` l. 124–149.
- Descrição: o Firebase Auth guarda e-mail (e, no login Google, nome e foto) e o Firestore guarda nome + progresso. Não há no app uma forma de o usuário apagar a conta nem um texto dizendo o que é guardado e para quê. Para um jogo entre amigos é aceitável; se for aberto ao público, a LGPD (arts. 9 e 18) pede informação e um canal de exclusão.
- Cenário de exploração: não é vulnerabilidade; é obrigação legal/transparência.
- Severidade: **Baixa** (informativo).
- Correção sugerida: (1) um parágrafo no README/menu: "Ao criar conta guardamos seu e-mail, nome e o progresso das skins no Firebase; para apagar, escreva para …"; (2) se quiser um botão "Excluir conta": `deleteDoc(players/{uid})` + `A.deleteUser(user)` (o Firebase exige login recente; tratar `auth/requires-recent-login`). Para isso, trocar em D1 `allow delete: if false` por `allow delete: if dono()`. Enquanto não existir, a exclusão é **ação manual no console** (Authentication → usuário → Excluir; Firestore → documento → Excluir).

### [D9] `storageBucket` configurado sem o Storage ser usado: regras do bucket podem estar abertas
- Arquivo e linha: `index.html` l. 8133 (`storageBucket: 'tiroteio-237ee.firebasestorage.app'`); grep por `getStorage`, `firebase-storage`, `uploadBytes`, `ref(` sem resultado.
- Descrição: o app só importa `firebase-app`, `firebase-auth` e `firebase-firestore` (l. 8174). O campo `storageBucket` está no config apenas porque foi copiado inteiro do console. Se o Storage tiver sido criado no console (o nome `*.firebasestorage.app` é o do bucket padrão novo, mas o config traz esse nome mesmo sem o bucket provisionado), as regras padrão em "modo de teste" liberam leitura e escrita a qualquer um por 30 dias, e em "modo de produção" liberam para qualquer usuário autenticado — e criar conta é livre. Qualquer um poderia hospedar arquivos no bucket do projeto, gerando custo de armazenamento e tráfego.
- Cenário de exploração: script com a `apiKey` + conta nova → `uploadBytes` de arquivos grandes; distribuição de conteúdo arbitrário sob o domínio do projeto.
- Severidade: **Média** se o bucket existir com regras abertas; **Baixa** se o Storage nunca foi ativado. (Não é possível confirmar pelo código; precisa olhar o console.)
- Correção sugerida (**ação manual no console → Storage**): se o Storage não aparecer como ativado, não ativar. Se existir, publicar:

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

  Opcionalmente remover `storageBucket` e `messagingSenderId` de `FIREBASE_CONFIG` (l. 8133–8134): o SDK não precisa deles para Auth e Firestore, e tira a tentação de usar o bucket por engano. Aproveitar para conferir que Realtime Database e Cloud Functions não estão ativados (mesmo raciocínio).

### [D10] XP ganho nos últimos 3 s antes de "Sair" é perdido (integridade, não segurança)
- Arquivo e linha: `index.html` l. 8160–8169 (`profSave` com `setTimeout` de 3 s), l. 8480 (`leaveGame`: `location.href = location.pathname` recarrega a página), l. 8189 (ao logar de novo, `PROF.data = cleanProf(snap.data())` substitui o local pela nuvem), l. 8170 (`visibilitychange` só salva se a aba for escondida).
- Descrição: a escrita na nuvem é adiada 3 s e reiniciada a cada XP. Sair da partida recarrega a página; `onbeforeunload` é anulado (l. 8480) e não há `pagehide` que force o `setDoc`. O temporizador morre com a página. Na próxima carga o perfil da nuvem (sem o último XP) vence a cópia local (`prof.<uid>`, que tem o XP). Quem ganha uma caixa nos segundos finais (`mend` 150 XP ou `zover`) e sai logo em seguida pode perder a caixa. É achado de integridade de dados do próprio usuário.
- Cenário de exploração: nenhum (prejudica o jogador honesto).
- Severidade: **Baixa**.
- Correção sugerida: em `leaveGame` (l. 8480) chamar `if (PROF.cloud) profSave(true)` antes de trocar o `location` (o `setDoc` imediato costuma sair antes do unload; para garantir, aguardar a promessa ou usar `pagehide`). Alternativa mais robusta: ao ler a nuvem no login (l. 8189), se a cópia local `prof.<uid>` tiver `opened`/`cases`/`xp` maiores e for do mesmo uid, regravar a local (fundir pelo maior `opened` e `cases + xp/300`). Com as regras de D1/D4 essa regravação continua válida (incrementos pequenos).

---

## Pontos conferidos e considerados corretos

- Leitura do documento de outro usuário é negada pela regra atual (`uid` da rota precisa ser igual ao do token). Coleções fora de `/players` são negadas por padrão (não há `match` para elas).
- Firestore via HTTPS/TLS pelo SDK oficial; dados entre jogadores via WebRTC (DTLS-SRTP) do PeerJS.
- Senha nunca gravada em `localStorage`/`sessionStorage`; só entregue ao SDK do Auth.
- `cleanProf` na leitura (l. 8151–8157) descarta itens fora do catálogo e equipamentos de skins não possuídas: um documento corrompido ou adulterado não quebra o cliente.
- `name` do Firestore é mostrado só ao próprio usuário e sempre por `esc()` (l. 8273).

## Resumo

| Id | Severidade | Título |
|---|---|---|
| D1 | Alta | Regras do Firestore sem validação de esquema, tipos ou tamanhos |
| D2 | Média | Sem App Check nem restrição de domínio na chave de API |
| D3 | Média | Sem limite de taxa de escrita no documento |
| D4 | Baixa | Progresso (XP, caixas, skins) decidido e gravado pelo cliente; regras podem limitar o salto por escrita |
| D5 | Baixa | E-mail e uid não vazam na rede (confirmado); `name` do Google gravado sem uso |
| D6 | Baixa | Skin anunciada na rede não é conferida contra o inventário |
| D7 | Baixa | Cache do perfil com uid e sessão do Firebase persistente; senha nunca gravada |
| D8 | Baixa | Sem exclusão de conta nem aviso de privacidade (LGPD) |
| D9 | Média/Baixa | `storageBucket` configurado sem uso: conferir e fechar as regras do Storage |
| D10 | Baixa | XP dos últimos 3 s antes de sair é perdido (integridade) |
