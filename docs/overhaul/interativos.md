# Interativos novos dos mapas zumbi (Onda 2, Frente C, etapa 3)

Projeto do O2-C04: a base comum dos interativos, o primeiro tipo pronto (barril explosivo) e o plano dos próximos. Parte da auditoria do O2-C01 (`auditoria_itens.md`), já com as redistribuições do C02 (Vila) e do C03 (Sanatório).

O que **já existe** e não é repetido aqui: portas pagas (750–4000), 1 armadilha elétrica por mapa com alavanca (`M.z.traps` + `ZTRAP`), Caixa misteriosa (um lugar por região), 13 bebidas, Pack-a-Punch, Energia, janelas com tábuas. O que **não existe** e entra por esta etapa: interruptores, terminais, barris, armadilhas de fogo, atalhos, barricadas fora das janelas, máquinas de upgrade, variantes de caixa.

## 0. Base comum (pronta no O2-C04)

Tudo num bloco `// ===== O2-C04: interativos =====` do `index.html`, logo depois do `zTickTraps`.

| Peça | O que é |
|---|---|
| `ZINT[tipo]` | **valores de jogo** do tipo (preço, dano, raio, tempos, força para a auditoria). Nada de número espalhado no código. |
| `ZINT_MAPA[mapa]` | **posições**: `{ t: tipo, x, z, n: [nx, nz] (frente, para fora da parede), ...parâmetros }`. |
| `ZINT_FN[tipo]` | **código** do tipo: `est` (estados válidos), `monta(o, i)` (peças, colisor; devolve o objeto do cliente), `estado(o, e, c, ant, sync)` (o que muda nas peças quando o host avisa), `prompt(o, i, c, D)` (texto do F), `quadro` (efeito por quadro, opcional) e, no host, `usar`, `tick`, `rodada`, `tiro`, `explosao` (opcionais). |

Fluxo e rede (o host valida tudo, como no `srvZUse`):

1. O F no cliente (`zInteract` → `zintCands`) escolhe o mais perto, com a mesma regra dos outros itens, e manda `{ t: 'use', k: 'zint', id }` (limitador `use` do host, já existente).
2. O host (`srvZUse` → `zintUsar`) confere o índice, a distância (`ZINT[tipo].srvR`), o estado e os pontos (`zPay`), e chama `ZINT_FN[tipo].usar`.
3. `zintPoe(i, estado, segundos, quem)` muda `Z.zint[i]` e manda `{ t: 'zint', i, st, s }` a todos.
4. Cada cliente (inclusive o do host) recebe em `onMsg` → `zintMsg`, que confere a forma (índice inteiro, estado da lista `est`, `s` finito) e chama `estado`.
5. **Quem entra no meio**: `zWorldState()` leva `zi: [[estado, segundos], ...]`, e `zSyncWorld` → `zintSync` aplica sem som nem efeito. A chave de mudança do `srvState` inclui os estados, então o mundo é reenviado quando algum muda.
6. Ganchos no host: `zintReset` (no `zReset`), `zintRodada` (no `zStartRound`), `zintTick` (no `zTickObjects`), `zintTiro` (no `'shot'`: o host olha onde cada bala do cliente parou e confere a visada) e `zintExplosao` (no fim do `zExplode`: granada, Semtex, Claymore, PhD, macaco e o próprio barril).

Desempenho (regras da Onda 1):

- **O1-B01 (junção)**: o `zBuildWorld` roda depois do `mergeStatic`, então nada dos interativos entra na junção. Peça que se mexe ou some fica fora por construção.
- **O1-B03 (oclusão)**: cada interativo é um grupo no `cullAdd`; o `oclReg` registra sozinho (corte por distância e atrás das paredes). Não troque `visible` do grupo raiz (o `zCull` manda nele): troque o dos filhos.
- **O1-B05 (sombra do Alto)**: peça parada que some/volta faz o B05 refazer o mapa uma vez; peça que anda vira dinâmica sozinha. Nos outros gráficos, `renderer.shadowMap.needsUpdate = true` quando algo some/volta (como as portas).
- **O1-B21 (transparentes)**: transparente novo só aceso enquanto precisa (a faísca do pavio).
- Cada estado do interativo é juntado numa malha (`mergeParts`): o barril é 1 chamada de desenho; os restos, outra (só um dos dois aparece).
- **Colisor**: fica sempre no `COL` (a grade dos zumbis não muda e não precisa do `zBuildWalk`); se o interativo some, só a altura muda (`maxY`), e a pegada continua igual.

Testes e auditoria:

- `tests/interativos-zumbi.test.mjs` (padrão do `fluxos-zumbi.test.mjs`).
- `window.__T` ganha `ZINT`, `ZINT_MAPA`, `ZINT_BARRIL`, `ZINT_FN`, `zintUsar`, `zintTiro`, `zintExplosao`, `zintBarrilBoom`, `zintEstado`, `zintAud`, `zintSync`, `zintMsg`, `zExplode` e `zWorldState`.
- `tools/itens/auditoria.mjs` lê **todos os tipos** por `__T.zintAud()` (corpo = a caixa que está no `COL`, raio do F, força da tabela). Um tipo novo não precisa mexer na ferramenta, só ganhar cor e legenda (`COR`, `leg`).

**Como acrescentar um tipo** (cada agente, num bloco próprio, logo abaixo de uma das marcas `// @@INTERATIVO-n@@` (n = 1 a 5) depois do `FIM O2-C04`):

- `ZINT.<tipo> = { nome, custo, usoR, srvR, forca, ... }`;
- `ZINT_FN.<tipo> = { est, monta, estado, prompt, usar, ... }`;
- `ZINT_MAPA.vila.push(...)` e `ZINT_MAPA.sanatorio.push(...)`.

Nada de gancho novo, a não ser que o tipo precise de algo que a base não tem (ver §3).

## 1. Tipos (a) — comportamento, valores, rede, visual, som

Sons: só os sintetizados que já existem (`SND`): `boom`, `beep`, `hiss`, `power`, `zap`, `lightning`, `door`, `hammer`, `crack`, `kaching`, `smoke`, `cymbal`, `buy`, `slam`.

### 1.1 Barril explosivo — PRONTO (O2-C04)

- **Comportamento**: F acende o pavio (grátis); um tiro no barril detona na hora. A explosão é como a de uma granada do jogador:
  - dano nos zumbis com queda pela distância e linha livre (`zExplode`);
  - o Carniceiro perde no máximo 12% por golpe, como nas outras explosões;
  - pontos de abate em área para quem acendeu ou atirou;
  - machuca **qualquer** jogador perto sem PhD Flopper (padrão do jogo: a granada machuca o dono, o PhD protege);
  - acende o pavio curto dos barris vizinhos (corrente);
  - o barril vira restos baixos (dá para pisar) e volta `voltaRodadas` rodadas depois, no começo de uma rodada, quando ninguém está em cima.
- **Valores** (`ZINT.barril`):

  | Campo | Valor |
  |---|---|
  | custo | 0 |
  | pavio | 2,5 s |
  | raio | 5 m |
  | dano | 600 + 150 por rodada, teto 6000 (a mesma curva da Claymore) |
  | dano no jogador | até 70, a até 4,5 m (queda linear) |
  | corrente | 0,25 s |
  | volta em | 2 rodadas |
  | tiro aceito | até 150 m |
  | F | 2,2 m (o host aceita 2,8 m) |
  | força na auditoria | 3 (como a armadilha) |

- **Rede**:
  - o host valida a distância do F e o estado;
  - o tiro só vale se a bala do `'shot'` parou a até 0,2 m do colisor e com visada livre da boca do cano até a borda do barril;
  - eventos `zint` com os estados `pronto`, `pavio` e `boom`.
- **Visual** (procedural, 3 variantes, todas com o mesmo comportamento):

  | Variante | Aparência | Tamanho |
  |---|---|---|
  | `tambor` | tambor de óleo vermelho, faixa amarela, aros e bujão | r 0,3 m, 0,95 m |
  | `polvora` | barril de pólvora de madeira | r 0,32 m, 0,82 m |
  | `gas` | cilindro de gás verde com válvula e rótulo | r 0,2 m, 1,35 m |

  Restos: fundo queimado de 0,25 m e mancha no chão. A faísca do pavio é um sprite aditivo.
- **Som**: `hiss` ao acender, `beep` a cada 0,45 s do pavio, explosão com o `boomFx` do jogo (som `boom`, clarão, fumaça, tremor).

### 1.2 Armadilha elétrica nova (variantes da existente)

- **Comportamento**: igual à de hoje (alavanca, área de choque, mata zumbi sem pontos, Carniceiro perde 6% por choque, machuca o jogador). **Não precisa de código novo**: é uma entrada a mais em `M.z.traps` (`{x, z, w, d, sx, sz, n, post?}`), acrescentada no bloco do agente com `MAPS.<mapa>.z.traps.push(...)`, antes da IIFE que calcula os campos (ou com os campos já calculados). `ZC.traps`/`Z.traps` já se dimensionam pelo `D.traps`.
- **Valores**: os do `ZTRAP` (1000; 25 s ligada; 60 s de recarga; 25 de dano a cada 0,5 s). Para variar o preço por armadilha, o agente acrescenta `cost` opcional na entrada e lê `t.cost ?? ZTRAP.cost` em `srvZUse` `trap` e no `zInteract` (2 linhas).
- **Rede**: o `ztrap` de hoje. **Visual e som**: os de hoje (postes, raios, `power`).

### 1.3 Armadilha de fogo (tipo `fogo`)

- **Comportamento**: F na alavanca/registro (com pontos) acende uma faixa de chão (óleo, feno, gás) por um tempo:
  - zumbi que passa pega fogo: dano por segundo enquanto está na faixa e mais 2 s depois, e anda a 70%;
  - o Carniceiro leva só uma fração por segundo;
  - jogador na faixa leva dano por segundo (PhD não protege: é fogo, não explosão);
  - depois recarrega. Não precisa de energia (Vila não tem energia em tudo).
- **Valores** (sugestão): `ZINT.fogo = { custo: 750, dura: 20, recarga: 60, dps: 'mata comum em ~1 s até a rodada 15', dpsBoss: .03, jogDps: 15, lento: .7, queima: 2, usoR: 2.2, srvR: 2.8, forca: 3 }`. Área por instância: `{ ax, az, w, d }` em `ZINT_MAPA`.
- **Rede**: estados `pronto` → `aceso` (s = dura) → `recarga` (s = recarga) → `pronto`. O dano é só no host (`tick`). A lentidão no zumbi precisa de um gancho na velocidade do `zChase` (região da Frente A): `z.fogoT > now` → ×0,7; combinar com a A.
- **Visual**: registro/alavanca na parede, faixa com 8–16 sprites de chama (`SOFT` aditivo, como a fogueira) e luz que pisca (uma lâmpada do pool com `fire:1`, só enquanto aceso). Só aceso desenha transparente.
- **Som**: `smoke` ao acender, `hiss` em laço curto enquanto aceso.

### 1.4 Interruptores que destravam áreas (tipo `interruptor`)

- **Comportamento**: alavanca na parede que destrava algo **em outro lugar**: uma porta "trancada" (atalho, §1.6), as luzes e a armadilha de uma ala (Sanatório) ou um portão corta-fogo. Uso único por partida ou por rodada, conforme o alvo.
- **Valores**: `ZINT.interruptor = { custo: 0 a 1500 (por instância), precisaEnergia: true no Sanatório, usoR: 2.2, srvR: 2.8, forca: 2 }`. Alvo: `{ alvo: 'porta:<id>' | 'ala:<id>' }`.
- **Rede**: estados `desligado` → `ligado`. O efeito no alvo vai pelo evento que o alvo já tem: `zdoor` para porta; para a ala, um `zint` do próprio alvo.
- **Visual**: caixa de força com alavanca e lâmpada de estado (como a da armadilha) e uma placa com o nome da ala.
- **Som**: `power` ao ligar e `lightning` curto quando a ala acende.

### 1.5 Terminais com lore (tipo `terminal`)

- **Comportamento**: F lê um texto curto. **Texto provisório**, de uma linha (a lore oficial vem na Onda 3, Frente D, `docs/overhaul/lore.md`).
  - Só quem leu vê o painel: o host responde com `sendTo` e não com `broadcast`, e marca quem leu (`E.lidos`), para a campanha usar depois.
  - Não dá pontos nem itens, para não virar caça ao tesouro.
- **Valores**: `ZINT.terminal = { custo: 0, usoR: 1.8, srvR: 2.6, forca: 1, textoS: 8 }`; texto por instância (`txt`), no máximo 160 caracteres.
- **Rede**: `use` → host → `sendTo(p.id, { t: 'zint', i, st: 'lido' })`. O painel abre só no cliente que leu; o estado global continua `pronto`.
- **Visual**:
  - Sanatório: terminal de mesa (caixa cinza, tela verde com textura de canvas de texto, teclado), com a tela emissiva fraca;
  - Vila: "quadro de avisos" (tábua com papéis pregados) ou "diário" numa mesa.
- **Som**: `beep` ao abrir e `chat` ao fechar.

### 1.6 Atalhos (tipo `atalho`, e portas com pontos novas)

- **Comportamento**: passagem nova entre duas regiões **que já se ligam por outro caminho**. Só encurta: a área nova não abre nada que já não estivesse aberto pelo caminho longo. O que muda é que **zumbis também passam**, então o atalho tem risco.
  - **Por pontos**: cerca/grade quebrável (Vila) ou porta corta-fogo (Sanatório), mais baratas que as portas comuns (500–1000).
  - **Por interação**: trancada até um interruptor (§1.4).
- **Implementação**: reaproveitar o sistema de portas (`M.z.doors`, colisor, `zdoor`, `zBuildWalk`, `zActive`), com `kind: 'cerca' | 'cortafogo'` (visual novo no `zBuildWorld`) e `trava: 'interruptor'` (o `srvZUse` `door` recusa e o `zInteract` mostra "Trancada: ache o interruptor" enquanto a trava não cai).
- **Risco**: abrir um vão exige furar a parede.
  - Nas regiões escritas à mão: dividir a caixa da parede (`zWall` com `holes`).
  - Nas geradas (`zGen`): acrescentar uma ligação muda o sorteio do cenário. Furar a parede **depois** do `zGen` (dividir a caixa no `M.boxes` antes do `buildMap`), sem tocar na semente.
- **Valores**: `{ cost: 500–1000 }` na porta; o interruptor, o seu.
- **Rede**: o `zdoor` de hoje.
- **Som**: `crack` e `hammer` (cerca) ou `door` (porta corta-fogo).

### 1.7 Barricadas reparáveis fora das janelas (tipo `barricada`)

- **Comportamento**: tábuas atravessadas numa passagem larga (beco, quintal, corredor de serviço). **Não bloqueiam**: o zumbi passa, mas mais devagar enquanto há tábua (×0,5) e arranca uma tábua a cada passagem.
  - O jogador conserta segurando F (10 pontos por tábua, no mesmo teto de 500 por rodada das janelas).
  - Sem colisor no `COL`: a regra "nada bloqueia a navegação" vale por construção.
- **Valores**: `ZINT.barricada = { tabuas: 5, lento: .5, conserto: .5, ptsTabua: 10, usoR: 2.2, srvR: 2.6, forca: 2 }`.
- **Rede**:
  - estados `0..5` tábuas (`st` numérico em texto);
  - o conserto usa o `hold` (precisa de `k: 'zint'` no `srvZHold`, 1 linha);
  - o zumbi arranca no `zTickZombies` (gancho da Frente A: célula da barricada → lento + tábua).
- **Visual**: `InstancedMesh` de tábuas, como as janelas (tábua arrancada = escala zero).
- **Som**: `hammer` (conserto), `crack` (arrancada).

### 1.8 Máquinas de upgrade (tipo `maquina`)

Não podem mudar dano, vida nem velocidade das armas existentes (regra da Onda 2). Duas máquinas que respeitam isso:

- **Máquina de munição**: enche o pente e a reserva de todas as armas de quem usa.
  - Valores: 2000 pontos, uma vez por jogador por rodada, precisa de energia.
  - Rede: host → `ammo` de cada arma (mensagem que já existe).
- **Wunderfizz** (bebida sorteada): sorteia uma bebida que o jogador não tem, como o power-up `perk`.
  - Valores: 2500 (média das 13 bebidas, O2-C10), respeita `ZMAXPERKS`; fica num lugar só (não há outro lugar por mapa).
  - Rede: `zperk` (já existe).

- **Visual**: armário de metal com luz (munição) ou máquina redonda com globo (Wunderfizz).
- **Som**: `kaching`, `buy`, `perk`.

### 1.9 Caixas misteriosas extras / variantes (tipo `bau`)

- **Comportamento**: caixa fixa (não muda de lugar, não tem ursinho) com lista própria e mais curta.
  - Vila: "baú do armeiro" (explosivos e armas de parede da Vila, macaco com peso alto).
  - Sanatório: "armário de evidências" (armas de mão e especiais leves).
  - Uma vez por jogador por rodada.
- **Valores**: `ZINT.bau = { custo: 1000 (O2-C10: entre a Caixa e a arma de parede mais cara), lista: { arma: peso }, porRodada: 1, gira: 3, oferta: 10, usoR: 2.3, srvR: 3, forca: 4 }`.
- **Rede**:
  - estados `pronto` → `gira` (`s` = gira) → `oferta` (`s` = oferta; quem pode pegar vai em `quem`, um campo novo do evento) → `pronto`;
  - pegar = `use` com `k: 'zint'` e o estado `oferta`;
  - reaproveita `zGive` e `zSendInv`.
- **Visual**: baú de madeira com ferragens (Vila) ou armário de aço (Sanatório); a arma gira com o `ZBOXM` (cache dos modelos da Caixa).
- **Som**: `boxmusic` curto e `kaching`.

### 1.10 Sino da igreja (só Vila, tipo `sino`)

- **Comportamento**: F toca o sino: por alguns segundos os zumbis vão até a torre (igual ao macaco, `Z.lure`). Depois recarrega.
- **Valores**: `ZINT.sino = { custo: 500, dura: 8, recarga: 90, usoR: 2.2, srvR: 2.8, forca: 3 }`.
- **Rede**:
  - o host põe `Z.lure = [x, z]` e o tira no fim;
  - o macaco usa `Z.lure` pelo mesmo caminho: combinar a prioridade (o macaco vence);
  - estados `pronto` → `tocando` → `recarga`.
- **Visual**: corda no pé da torre da igreja; o sino balança (dinâmico no B05).
- **Som**: `cymbal` em 3 badaladas.

## 2. Identidade por mapa (b)

Regras da auditoria valendo para cada tipo novo:

- 3 m (desejável 5 m) de qualquer item;
- 3 m de porta, janela de dentro e chão que solta zumbi;
- corpo sem atravessar caixa;
- nada bloqueia (`auditoria.mjs --desvio 2`);
- cobertura das regiões de fora;
- força × risco.

As posições abaixo são **sugestões** da sonda do C04 (`C:\dev\tiroteio-notas\work\overhaul\C04\sonda.mjs`: ponto encostado na parede, 3,5 m livres na frente e 1,1 m dos lados, longe de itens, janelas, chão que solta zumbi e portas, e a mais de 6 m dos barris). Cada agente confere de novo com a sonda e com o `auditoria.mjs` antes de entregar.

### Vila (rural, vilarejo): fogo, barris, sino, quintais

| Tipo | Quantos | Onde (região: x; z) |
|---|---|---|
| Barril | **22 (pronto)** | pólvora: F Pedreira (par), I Castelo, J Mina (par), Q Serraria, c2 Vinhedo, b01 Mina velha; tambor: G Estação, H Acampamento, K Hospital de campanha, L Fábrica, M Ferrovia, N Porto, O Farol, P Floresta, c0 Base militar, c1 Pântano, c3 Ruínas, b20 Cais, b22 Estaleiro, b31 Quartel |
| Armadilha de fogo | 3 | C Fazenda, celeiro com feno (30,25; 2,25); H Acampamento (−48,25; 55,75); c2 Vinhedo, alambique (−73,25; 111,75) |
| Sino | 1 | B Igreja, pé da torre (0,75; −49,25) |
| Atalhos (cercas de quintal, 500–750) | 4 | entre as áreas do anel A–I que já se ligam: C↔G, E↔H, D↔I e B↔F, furando a cerca do quintal perto do meio de cada lado, longe das portas atuais |
| Barricadas reparáveis | 4 | M Ferrovia (122,25; 39,25); N Porto (42,75; 107,75); J Mina (35,75; −140,25); O Farol (−42,75; 132,25) |
| Armadilha elétrica nova | 1 | L Fábrica, cerca elétrica do galpão (140,75; −12,25), alavanca com energia |
| Máquina de munição | 1 | c0 Base militar, paiol (114,75; −106,25) |
| Baú do armeiro | 1 | b31 Quartel (−209,75; −34,75) |
| Terminais (quadros de avisos e diários) | 4 | B Igreja (−18,25; −26,25); K Hospital de campanha (−23,75; −115,75); O Farol (−22,75; 128,25); b01 Mina velha (29,75; −203,25) |

Nada novo no octógono de dentro (A–E), além do sino e do fogo da Fazenda, que pesam pouco (força 3, com preço). Os anéis de fora ganham pelo menos 1 interativo próprio cada (regra 7 da auditoria). Hoje ficam sem nada novo: b00, b02, b10, b11, b12, b21, b30 e b32; os atalhos e barricadas da segunda leva podem cobrir esses.

### Sanatório (hospital, elétrico): terminais, interruptores por ala, choque, portas corta-fogo

| Tipo | Quantos | Onde (região: x; z) |
|---|---|---|
| Barril (cilindro de gás e tambor) | **12 (pronto)** | gás: P Caldeiras (par), H Cozinha, r5 Túneis de serviço, r7 Crematório, r9 Lavanderia; tambor: M Torre d'água, r12 Ferro-velho (par), r2 Portaria; pólvora: r3 Pedreira (par) |
| Terminais | 6 | A Recepção (ficha de admissão, na parede da recepção, fora da área da Caixa 0); D Laboratório (−25,75; 17,25); I Necrotério (−24,75; 39,25); J Ala Psiquiátrica (25,75; 28,75); r7 Crematório (−97,25; 86,75); P Caldeiras, manual da caldeira (−52,75; 53,25) |
| Interruptores de energia por ala | 3 | ala leste K/L/M: K Jardim (35,75; 22,75); ala oeste G/H/N: N Biblioteca (−45,25; −25,25); anel r: r5 Túneis (−99,25; −12,25). Cada um acende as luzes da ala e libera a armadilha elétrica dela (com a Energia ligada) |
| Armadilhas elétricas novas | 3 | G Refeitório (−39,25; 18,75), alavanca na parede; L Estufa (50,25; 25,25); r9 Lavanderia (74,25; −9,75). Cada uma só funciona com o interruptor da ala |
| Portas corta-fogo (atalhos, 750–1000) | 3 | entre áreas que já se ligam por outro caminho: D↔G (Laboratório ↔ Refeitório), E↔K (Teatro ↔ Jardim) e r13↔r12 (margem do brejo). As duas de dentro ficam trancadas até o interruptor da ala |
| Barricadas reparáveis | 3 | macas e arquivos tombados: r1 Cemitério (−48,25; −47,25); r13 Brejo (13,75; 82,75); r5 Túneis (−100,25; −21,25) |
| Máquina (Wunderfizz) | 1 | r1 Cemitério, capela do cemitério (−50,75; −64,75), com energia |
| Armário de evidências (variante da caixa) | 1 | N Biblioteca (−40,75; −17,75) |

Nada novo nas áreas de 0–1000 pontos (A, B, C, F), além do terminal da Recepção (força 1).

### Força × risco com os barris

Os barris entram na conta com força 3, a mesma da armadilha (`auditoria.mjs`, Spearman força × custo de portas):

| Mapa | Antes (C02 / C03) | Com os barris |
|---|---|---|
| Sanatório | 0,50 | 0,46 |
| Vila | 0,17 | 0,15 |

O barril é grátis e fica nas regiões de 2250 a 11000 pontos, mas força 3 com custo médio puxa a conta um pouco para baixo. Opções para o coordenador:

- aceitar (é a força honesta);
- tirar da correlação o que não é compra (barril, terminal), com uma linha no `fxv` da ferramenta;
- dar força 4 ao barril: Sanatório 0,54, Vila 0,25.

## 3. Ordem dos agentes seguintes (c)

**Um agente por tipo, implementando nos dois mapas** (os ids dos agentes ficam com o coordenador: o `C05` da fila já foi usado nas placas de giz; aqui eles são chamados pela marca). Dois agentes no mesmo mapa e em tipos diferentes mexeriam no mesmo `ZINT_FN`; um por tipo só mexe no próprio bloco.

Cada agente põe o bloco abaixo da marca `// @@INTERATIVO-n@@` que o coordenador der (a coluna Marca abaixo). As marcas ficam no fim do bloco do C04 e são separadas para os diffs não se encostarem. O agente acrescenta só nos dois `ZINT_MAPA` com `push` e não mexe nos barris. Máximo de 3 ao mesmo tempo (fila da Onda 2).

| Ordem | Marca | Tipos | Ganchos fora da base | Pode rodar junto com |
|---|---|---|---|---|
| 1 | INTERATIVO-1 | armadilha de fogo (Vila 3) e armadilhas elétricas novas (Vila 1, Sanatório 3; com `t.cost` opcional) | lentidão no `zChase` (combinar com a Frente A) | INTERATIVO-2 |
| 1 | INTERATIVO-2 | terminais (Sanatório 6, Vila 4; texto provisório) | painel de leitura no HUD (bloco próprio) | INTERATIVO-1 |
| 2 | INTERATIVO-3 | interruptores e atalhos/portas corta-fogo/cercas (os dois mapas) | `srvZUse` `door` (trava), `zInteract` (texto da porta trancada), visual de porta nova no `zBuildWorld`, furo de parede antes do `buildMap` | sozinho (mexe nas portas) |
| 3 | INTERATIVO-4 | barricadas reparáveis (Vila 4, Sanatório 3) | `srvZHold` (`k: 'zint'`) e célula lenta no `zTickZombies` (Frente A) | INTERATIVO-5 |
| 3 | INTERATIVO-5 | máquina de munição, Wunderfizz, baú/armário de evidências, sino (Vila) | `Z.lure` (prioridade do macaco) | INTERATIVO-4 |

Depois de cada agente:

- `node --check`;
- `pnpm test`, com o teste do tipo em `tests/interativos-zumbi.test.mjs` ou num arquivo próprio;
- `auditoria.mjs` nos dois mapas, sem erro;
- harness de regressão `vila`/`sanatorio`;
- bench intercalado com o HEAD (normal e `--horda 1 --rodadas 25`);
- fotos.

**Rede**: o protocolo ganhou a mensagem `zint` e o campo `zi`, e os mapas mudaram (C02, C03, C04). O `PROTO` (versão da rede) deve subir **uma vez**, no fechamento da Onda 2, pelo coordenador. Um cliente antigo numa sala nova não vê os barris e anda através deles.
