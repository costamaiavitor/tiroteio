# Mapa do sistema — Dan of Duty (tiroteio)

Levantamento feito em 02/10/2026 na branch `security-hardening` (base: `origin/main` em `12a9328`), para a auditoria de segurança. Números de linha referem-se a `index.html` nessa revisão (8565 linhas, ~724 KB).

## 1. Identificação

| Item | Valor |
|---|---|
| Linguagem | JavaScript (ES2022, módulo único dentro de `index.html`), CSS inline, Python (ferramentas do Blender em `tools/blender`, só desenvolvimento) |
| Framework / engine | [three.js 0.160.0](https://cdn.jsdelivr.net/npm/three@0.160.0) (3D, importmap), [PeerJS 1.5.4](https://unpkg.com/peerjs@1.5.4) (WebRTC), Firebase JS SDK 10.12.2 (`gstatic`, carregado por `import()` dinâmico), fonte Rajdhani do Google Fonts |
| Arquitetura | **P2P com host-autoridade**: o navegador do host roda o "servidor" (`S`, `Z`, `srvHandle`, `srvTick`); os outros navegadores são clientes que mandam intenções e desenham. Pareamento pelo servidor público do PeerJS (`0.peerjs.com`), STUN do Google e TURN da Metered. Sem backend próprio. |
| Banco | Firestore (projeto `tiroteio-237ee`), um documento por jogador em `players/{uid}` (XP, caixas, skins). Regras publicadas no README (§Configurar as contas). `localStorage` para o perfil de convidado e preferências. |
| Build / deploy | **Não há build, bundler, lint nem testes.** Deploy = GitHub Pages servindo a `main` (`costamaiavitor.github.io/tiroteio`). Nenhum workflow em `.github/`. |
| Dependências | Todas por CDN em tempo de execução (sem lockfile, sem SRI). `tools/*.js` importam `three` só para desenvolvimento. |
| Variáveis de ambiente | Nenhuma. A configuração do Firebase (`FIREBASE_CONFIG`, l. 8129) e as credenciais do TURN (`ICE`, l. 5046) estão escritas no código. |
| Autores | 103 commits: costamaiavitor (66), Claude (27), Caio Holanda/caiobholanda (10). |

## 2. Linha de base (antes de qualquer correção)

- Build: não existe (arquivo estático). Lint: não existe. Testes: não existiam.
- Criados nesta branch: `package.json` (só `devDependencies: playwright 1.63.0`), `tests/servidor.mjs` (servidor estático), `tests/_jogo.mjs` (abre o jogo headless e cria uma sala) e `tests/caracterizacao.test.mjs` (15 testes de caracterização do servidor: criação de sala, rodada de zumbis, `zhit` com teto e cadência, portas, bebidas, armas de parede, `pos`, `chat`, `selfdmg`, `nade`, `skins`, perfil local, mata-mata com bots).
- Resultado em 02/10/2026: **15/15 passando** (`pnpm test`, ~45 s, precisa de internet para a CDN; PeerJS bloqueado nos testes, então a sala fica offline). Nenhum `pageerror` no console.
- Os testes usam os ganchos de depuração `window.__T` (l. 8560) e `T.sim()` (relógio travado), que o jogo já expunha.

## 3. Componentes (dentro de `index.html`)

| Camada | Linhas | Roda em |
|---|---|---|
| Utilidades, `save/load` (localStorage `tiroteio.*`), `CFG` | 434–454 | ambos |
| Constantes de jogo: armas `W` (465–547, inclui `ZWEAP` e versões `_pap`), mapas `MAPS` (568–1370) | 456–1370 | ambos |
| Montagem do mapa, colisores `COL`, raycast `trace` | 1371–2410 | ambos |
| Skins (`SKINS`, `SKIN_BY`), modelos de arma | 2704–3560 | cliente |
| Jogador local: movimento, tiro (`shoot` 4650–4744), faca (4745), granada (4764), `sendPos` | 4400–4900 | cliente |
| Rede: `ICE`, `NET`, canal rápido (`attachFast`), `startHost`, `joinRoom`, heartbeat | 5041–5230 | ambos |
| **Servidor genérico**: `S`, `srvAddPlayer`, `srvOnData` (join), `srvHandle` (todas as mensagens), `srvDamage/Kill/Spawn`, rodadas CS, `srvBuy`, `srvState`, `srvTick`, bots | 5232–5680 | host |
| Modo Zumbis — dados, modelos, mundo no cliente | 5682–6663 | cliente |
| **Servidor dos zumbis**: `Z`, `zStartGame/Round`, IA, `zHit/Kill`, `srvZUse/ZHold/ZFx/ZClay`, caixa, PaP, power-ups, armadilhas, `zSnap` | 6664–7596 | host |
| Cliente: `onMsg` (todas as mensagens recebidas) | 7601–7755 | cliente |
| HUD, chat, feed, placar, loja (`renderBuy`), pausa | 7757–8060 | cliente |
| Formulários do menu (`matchForm`, `settingsForm`) | 8059–8122 | cliente |
| **Conta e progresso**: `FIREBASE_CONFIG`, `OWNERS`, `PROF`, `cleanProf/cleanSk`, `profSave` (Firestore), `grantXP`, `rollItem`, caixa, UI de skins | 8123–8430 | cliente |
| Boot, laço principal (`tick`), `window.__T` | 8431–8562 | ambos |

Arquivos fora do HTML: `assets/` (glTF dos braços e armas), `tools/` (ferramentas de desenvolvimento; `tools/*.js` fazem `POST http://127.0.0.1:8799` para um receptor local de imagens, `tools/blender/*.py` rodam dentro do Blender).

## 4. Fluxo de dados

```
Jogador (cliente)                       Host (servidor no navegador)                    Outros clientes
──────────────────                      ───────────────────────────────                 ───────────────
localStorage ──► CFG/PROF
Firebase Auth ──► PROF.uid ──► Firestore players/{uid} (lê e grava o próprio inventário)
   │
   ├─ join {name, sk, v} ─────────────► srvOnData: cria p, welcome {st, you, code} ──► info "entrou"
   ├─ pos (canal rápido, 30/s) ───────► srvHandle 'pos': valida vec3/finitos, grava p.pos ──► broadcastFast pos
   ├─ shot {w, o, e[]} ───────────────► repassa (sem checar munição/cadência) ────────► efeitos
   ├─ zhit {v, dmg, z, w, sp} ────────► confere arma, teto de dano, cadência, alvos ──► zHit → pontos, zdie
   ├─ hit {v, dmg, z, w} (x1/DM) ────► clamp 0..500, srvDamage (sem LOS/distância) ──► dmg, kill
   ├─ use / hold / zclay / zfx ───────► srvZUse etc.: distância, pontos, energia, estado
   ├─ selfdmg {d} ────────────────────► zHurt(clamp 0..100)
   ├─ buy {it} ───────────────────────► srvBuy: fase, dinheiro, slot
   ├─ nade {k, p, v} ─────────────────► estoque, distância ≤ 4 m, |v| ≤ 30 ──────────► nade
   ├─ chat {txt} ─────────────────────► slice(0,120), broadcast ─────────────────────► esc() no HTML
   ├─ skins {sk} ─────────────────────► cleanSk
   ├─ suicide, bomb {on}, ping
   ◄─ state (4/s), zs (20/s), spawn, inv, pts, err, msg, kill, zdie, zround, zover, mend, ...
```

- O host também é cliente de si mesmo: `sendToHost` chama `srvHandle('h', m)` direto e `broadcast` chama `onMsg` local.
- **XP e caixas são calculados no cliente** a partir das mensagens recebidas (`grantXP` em `zdie`, `zrend`, `zrevive`, `zover`, `mend`, `kill`) e gravados no Firestore pelo próprio cliente (`profSave`). O host não participa do progresso.
- Mapas, armas, preços e regras ficam no código (iguais em todos os navegadores). Não há versão de protocolo além de `v: 2` no `join`.

## 5. Pontos de entrada

| Entrada | Onde | Observação |
|---|---|---|
| `?sala=CODIGO` na URL | l. 8448 | Vai para o campo de código (`toUpperCase`, depois filtrado em `joinRoom` para `[A-Z0-9]{5}`) |
| Nome do jogador (`#inName`) | l. 8447 | Remove `<>` e corta em 16 |
| Código da sala (`#inCode`) | l. 5189 | Normalizado |
| Chat (`#chat`) | l. 7958 → `chat` | Mostrado via `esc()` |
| E-mail/senha (`#acEmail`, `#acPass`) | l. 8209 | Entregues ao Firebase Auth |
| **Mensagens de rede do cliente para o host** | `srvOnData` (5247) e `srvHandle` (5283): `join, ping, pos, shot, zhit, use, hold, selfdmg, zfx, zclay, hit, bomb, buy, skins, nade, chat, suicide` | O canal rápido faz `JSON.parse` (5062); o canal confiável usa `serialization: 'json'` do PeerJS |
| **Mensagens do host para o cliente** | `onMsg` (7601): ~50 tipos | O cliente confia no host (host malicioso pode mandar qualquer coisa) |
| `localStorage` `tiroteio.*` | `load()` 447 | `prof.guest` passa por `cleanProf`; `lastSt` passa por `matchForm`; `name` sem filtro na leitura |
| Firestore `players/{uid}` | `profOnUser` 8188 | Passa por `cleanProf` |
| `window.__T`, `window.__simLock/__simNow` | 8560 | Ganchos de depuração expostos em produção (console do navegador) |
| Scripts externos | l. 274–276, 3559, 8174 | PeerJS (unpkg com fallback jsdelivr via `document.write`), three.js (jsdelivr), perfis WebXR, Firebase (gstatic). Sem SRI, sem CSP |
| Pareamento / ICE | l. 5046–5051, 5155, 5194 | Servidor público do PeerJS; o id da sala é `tiroteio-br-v1-` + 5 caracteres de 32 (≈33 milhões) |
| Receptor local de imagens | `tools/*.js` | Só desenvolvimento, `127.0.0.1:8799` |

## 6. Autenticação e autorização

- **Partida**: não há autenticação. Quem tem o código entra; o host aceita a primeira mensagem `join` de qualquer conexão e dá um `pid` sequencial (`p1`, `p2`, …). Não há limite de jogadores por sala nem de conexões por origem. O id do jogador é atribuído pelo host (o cliente não escolhe), e `srvHandle` sempre usa o `pid` da conexão, não um campo da mensagem.
- **Host**: é quem criou a sala; tem autoridade total (inclusive para trocar modo/mapa pela pausa, `btnApply` 8462). Um host malicioso pode mandar qualquer mensagem aos clientes.
- **Conta (skins)**: Firebase Auth (Google ou e-mail/senha). A regra do Firestore (README) só deixa o próprio `uid` ler/gravar `players/{uid}`. A `apiKey` é pública por natureza. `OWNERS` (l. 8138) é uma lista de e-mails no cliente que ganha todas as skins — é só conveniência, não controle de acesso.
- **Não há papel de administrador, moderação, kick ou ban.**

## 7. Estado sensível (quem decide e onde fica)

| Estado | Autoridade | Onde | Como o cliente influencia |
|---|---|---|---|
| Posição, yaw, agachado | **cliente** (`pos`) | `p.pos` no host | Só checa número finito e < 1e4; sem velocidade, colisão ou teleporte |
| Vida (`hp`), armadura, caído | host | `p.hp` | `selfdmg` (0–100 por mensagem, sem cadência), `hit` em x1/DM (0–500, sem LOS, distância ou munição) |
| Dano em zumbis | **cliente decide o acerto**; host confere arma, teto, cadência e nº de alvos | `zhit` | `dmg`, `z` (zona), `v` (alvo), `sp` (splash) livres dentro do teto |
| Pontos (zumbis) / dinheiro (CS) | host | `p.money` | Via acertos, compras; `pts`/`inv` enviados ao cliente |
| Inventário, bebidas, PaP | host | `p.inv`, `p.perks` | `use`, `buy` validados por distância e pontos; `cur` (arma na mão) vem do cliente |
| Munição | **cliente** | `G.ammo` | O host não sabe a munição; `shot` não é conferido contra `mag` |
| Cadência de tiro | cliente (`G.nextFire`); host só limita `zhit` (não `shot` nem `hit`) | | |
| Granadas, Claymores | host (estoque, distância) | `p.inv.he/semtex/clay` | Trajetória simulada em cada cliente a partir de `p`/`v` enviados |
| Rodada, spawn, IA, power-ups, caixa | host | `Z` | — |
| Placar (kills, hs, revives) | host | `p.kills`… | — |
| **XP, caixas, skins** | **cliente** | `PROF.data` → Firestore `players/{uid}` | Qualquer valor pode ser gravado pelo próprio usuário (as regras só restringem o `uid`) |
| Skin exibida aos outros | cliente (`skins`), validada por `cleanSk` | `p.skins` | Pode anunciar skin que não possui |
| Configuração da partida (`st`) | host | `S.st` | `matchForm` normaliza o que vem do `localStorage` |
| Nome | cliente | `p.name` | Remove `<>`, corta em 16; renderizado com `esc()` |

## 8. Pontos de atenção já visíveis no levantamento (a confirmar na auditoria)

1. Credenciais TURN da Metered no código e no histórico (`ICE`, l. 5050; commit `58b2d6e`); credenciais anteriores `openrelayproject` também no histórico.
2. Config do Firebase no código (pública por natureza, mas sem App Check nem restrição de domínio da chave de API).
3. Progresso/skins decididos e gravados pelo cliente; regras do Firestore sem validação de forma/limites.
4. `pos` sem limite de velocidade; `shot` e `hit` sem munição, cadência, LOS ou distância; `selfdmg` sem cadência; `hit` em DM/x1 com dano até 500 por mensagem.
5. Sem rate limit por conexão (flood de `chat`, `shot`, `join` de muitas conexões), sem limite de jogadores.
6. Scripts de CDN sem SRI e sem CSP; `document.write` de script cross-site.
7. `window.__T` com funções do servidor expostas em produção.
8. `localStorage.name` lido sem filtro (só filtrado ao digitar).
