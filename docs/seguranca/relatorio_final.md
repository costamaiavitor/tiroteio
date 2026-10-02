# Relatório final — endurecimento de segurança do Dan of Duty (tiroteio)

Branch `security-hardening` (base `origin/main` 12a9328), 02/10/2026. Nada foi enviado ao GitHub: os commits estão locais, para revisão e decisão de push. Documentos: `mapa_sistema.md` (fase 0), `auditoria/01..10` e `relatorio_auditoria.md` (fase 1), `acoes_manuais.md`, `vendor-edicao.md` (fase 2), `revisao_regressao.md`, `revisao_adversarial.md`, `revisao_compatibilidade.md` (fase 3).

## 1. Resultado em números

| | Linha de base (fase 0) | Final |
|---|---|---|
| Build / lint | não existem (arquivo estático) | idem |
| Testes | 15 de caracterização, 15 passando | 49 (15 caracterização + 17 host + 17 rede/zumbis), **49 passando** |
| Fumaça (revisor de regressão) | — | zumbis Sanatório e Vila, mata-mata com 3 bots e rodadas no Porto: 0 erros de página, 0 violações de CSP, 0 pedidos a CDN |
| Abrir `index.html` do disco (`file://`) | funciona | funciona (bibliotecas da CDN nesse caso) |
| Tamanho | `index.html` 724 KB | `index.html` 762 KB (+3 %), `vendor/` 1,8 MB |

Como rodar: `pnpm install` e `pnpm test` (um arquivo por vez; precisa de internet para o Firebase e as fontes; o pareamento do PeerJS fica bloqueado nos testes).

## 2. Falhas: encontradas × corrigidas × pendentes

Ids V01–V24 de `relatorio_auditoria.md`; R/F da revisão adversarial; RC da de compatibilidade.

### Corrigidas no código (commits 56b46b9, f6d3e5b, dca0db0, f50adbc e o da fase 3)

| Id | Falha | Correção (resumo) |
|---|---|---|
| V01 (Crítica) | `hit` matava qualquer um de qualquer lugar | arma do inventário, teto por arma e zona, cadência, distância, linha de visão com histórico de 0,4 s da vítima, recusado fora da rodada; facada também exige ver (R02) |
| V02 (Crítica) | `pos` sem limite | balde de velocidade no relógio do host (14/10 m/s médios, rajada 1,5 s), subida limitada, fora do mapa, **dentro de parede** (F01) e **flutuar > 1 s** (R01) recusados; `ts` inválido não trava |
| V03 (Alta) | `zhit` sem distância/visão/estado | subsolo, 260 m, linha de visão no tiro direto (faca inclusive, R04), cone do Trovão/Howl recalculado, explosão só perto de impacto (R03), teto por zona (R05) |
| V04 (Alta) | `shot` repassado sem conferir | arma, origem perto do jogador, cadência, pontos limitados aos bagos; arma na mão só do inventário |
| V05 (Alta) | flood, sem teto de jogadores, pendentes eternas, mensagens grandes | limitador por conexão e tipo (balde `*` para tipo inventado, F02), 12 jogadores, pendentes fechadas em 10 s (a mais antiga cai primeiro, F03), `pong` só após `join`, canal rápido ≤ 4 KB, `S.left` com teto |
| V06 (Alta) | XSS por campos do host | `sanePl`/`saneSt`: números viram números, cor por regex, nome cortado; `localStorage`/`lastSt` validados |
| V07 (Alta) | perfil gravado livremente | `firestore.rules` versionado (forma, tipos, tamanhos, 1 gravação/s, teto de salto por gravação); XP do fim de jogo limitado (R10); retentativa silenciosa de gravação negada |
| V08 (Alta) | CDN sem SRI/CSP, `document.write`, versão flutuante | `vendor/` com hashes, CSP e Referrer-Policy por `<meta>`, fallback para a CDN só em `file://` |
| V10 (Média) | ganchos `__T`/`__simLock` em produção | só em `localhost`/`127.0.0.1` (`DEBUG`) |
| V11 (Média) | reentrada e nomes repetidos | token `rk` por sala (10 min) + nome; nome repetido vira "Nome (2)"; invisíveis removidos |
| V12 (Média) | chaves herdadas e mensagens malformadas | `Object.hasOwn` em todos os catálogos, `onMsg` com `try/catch`, validação por tipo |
| V13 (Média) | sequestro do id da sala | código novo ao perder o id (`room`), segredo do host no link (`&h=`) conferido no `welcome` |
| V15 (Média, parte) | pastas de dev publicadas | `_config.yml` exclui `tools/`, `tests/`, `docs/`; `.gitignore` completo |
| V17 (Média) | sem anomalias nem expulsão | contador com decaimento, aviso ao host, lista com "Expulsar" na pausa; banido por token **e** nome (R06) |
| V19, V20, V21, V22 (Baixas) | `selfdmg`/`suicide`, `Math.random`, XP perdido ao sair, versão do protocolo | `selfdmg` só após tiro de arma explosiva e sem Dying Wish; `crypto.getRandomValues`; `profSave` ao sair; `PROTO` conferido no `join` |
| V24 (Baixa) | servidor de testes | `decodeURIComponent` protegido, pastas de dev não servidas; `pnpm test` serial |

### Pendentes (com motivo)

| Id | Falha | Por que não foi feito | O que fazer |
|---|---|---|---|
| V09 / R1 | credencial do TURN no código e no histórico | só rotação resolve (histórico público); credencial temporária exige um backend mínimo (arquitetura) | **manual**: rotacionar na Metered (`acoes_manuais.md` §1); depois decidir o backend |
| V07 (fundo) | progresso decidido pelo cliente | sem servidor não há correção completa (arquitetura); as regras só limitam o salto | Cloud Function para XP/caixas, se o jogo crescer |
| V09 (C9/Z7) | host com autoridade total | arquitetura P2P | servidor autoritativo ou relé, se o jogo crescer |
| V14, V16, V15 (parte) | App Check, chave de API, enumeração, Storage, proteção da `main` | ações no console do Firebase/Google Cloud/GitHub | `acoes_manuais.md` §2–§9 |
| R07 | canal confiável sem teto de tamanho por mensagem | o PeerJS remonta a mensagem antes de entregar; limitar exigiria interceptar o DataChannel | aceitar (custo de parse limitado pelo limitador de taxa) |
| R09 / R11 | a regra de velocidade limita a média: até 21 m (CS 15 m) de salto a cada 1,5 s parado | limite por forma (continuidade) exigiria simular o jogador no host; risco de punir lag | aceitar por ora; o aviso ao host e o "suspeito" cobrem o abuso repetido |
| R12 | rajada inicial dos baldes por arma soma entre armas (ak47 + deagle + faca no mesmo instante ≈ 4 400 de dano) | é a folga de rede do `zhit` original; reduzir pune quem tem soluço de rede | aceitar; acompanhar com os avisos de anomalia |
| V18 | Firebase SDK 10.12.2 e three.js 0.160.0 atrás das versões atuais | sem advisory aplicável; subir é risco de regressão sem ganho de segurança | acompanhar |
| RC2 | cliente com versão antiga vê a mensagem de versão só por 2 s (toast) e depois "Conexão recusada" | é o código antigo que mostra; o novo mostra a mensagem no lugar | nada |
| RC8 | nomes com emoji composto (ZWJ) perdem o conector | efeito colateral do filtro de invisíveis (segurança > cosmético) | aceitar |

## 3. Ações manuais que você (ou o Vitor) precisa fazer

Em ordem, com o passo a passo em `docs/seguranca/acoes_manuais.md`:

1. **Rotacionar a credencial do TURN na Metered** e colar a nova em `ICE` no `index.html` (a atual está no histórico público do git e no site). Ligar o alerta de cota.
2. **Publicar `firestore.rules`** no console (Firestore → Regras), testando antes no Simulador com um create e um update reais; trocar `COLOQUE_AQUI_O_UID_DO_DONO` pelo uid da conta do dono (senão `grantAllSkins` passa a ser recusado e aparece "Não consegui salvar na nuvem").
3. **Restringir a chave de API** (Google Cloud → Credenciais: referenciadores `costamaiavitor.github.io`, `localhost`, `127.0.0.1`; APIs Identity Toolkit, Token Service, Firestore, Installations).
4. **Authentication**: domínios autorizados só `costamaiavitor.github.io` e `localhost`; ativar "Email enumeration protection".
5. **App Check** (reCAPTCHA v3), primeiro em modo monitorar; ao aplicar, acrescentar `initializeAppCheck` no código e as origens na CSP (comentário no `<head>`).
6. **Storage**: se existir bucket, regras `allow read, write: if false`.
7. **GitHub**: ruleset na `main` (sem force-push/exclusão, PR obrigatório), Secret scanning + Push protection, Dependabot, CodeQL; conferir após o deploy que `…/tiroteio/vendor/three@0.160.0/build/three.module.js` responde 200 e `…/tools/vmtest.js` 404.
8. **Push desta branch** e merge na `main` (decisão sua): o Pages publica em segundos; avisar os jogadores para recarregar (Ctrl+F5), porque host e cliente de versões diferentes não se conectam mais.

## 4. Riscos residuais e recomendações

- **O host continua sendo um jogador com autoridade total.** Tudo o que foi feito protege os clientes uns dos outros, não do host. Quem hospeda pode editar o próprio estado; os outros só podem sair.
- **Progresso (XP, caixas, skins) é do cliente.** As regras do Firestore limitam a forma e o salto por gravação (10 caixas, 1 skin por vez, 1 gravação/s); um trapaceiro paciente ainda sobe devagar. Só um escritor confiável (Cloud Function) fecha isso.
- **A credencial do TURN é pública por natureza** no WebRTC do navegador; depois da rotação, só credenciais temporárias geradas por um backend impedem o abuso da cota.
- **A validação de movimento é por média**, com folga para lag: saltos curtos continuam possíveis; o contador de anomalias e a lista de "suspeitos" na pausa são a resposta, com a decisão sempre do host.
- **CSP com `'unsafe-inline'`** (scripts inline): uma fase 2 com hashes recalculados por script antes do commit tornaria a política bem mais forte; `jsdelivr`/`unpkg` continuam liberados só pelo caso `file://`.
- **Ao mudar armas, mapas ou mensagens**, subir `PROTO` (constante no topo do módulo); ao mudar `XP_CASE`, mudar o teto de `xp` em `firestore.rules`.
- **Testes**: rodar `pnpm test` antes de cada push; os testes abrem um Chromium por arquivo e dependem de internet para o Firebase.

## 5. O que mudou para quem joga

Nada visível em jogo honesto, exceto: teto de 12 jogadores por sala; nome repetido na sala ganha "(2)"; link de convite com um segundo parâmetro (`&h=`); mensagem clara quando a versão difere da do host; lista de jogadores com "Expulsar" na pausa do host; aviso ao host quando alguém manda muitas mensagens fora do esperado; XP dos últimos segundos passa a ser salvo ao sair.
