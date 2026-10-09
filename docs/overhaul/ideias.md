# Ideias de melhoria (Frente E, O2-E01)

Lista de ideias para o modo zumbi e o resto do jogo. **Nada aqui foi implementado.** Cada ideia diz o impacto esperado, o esforço, o risco e de onde veio. O coordenador e o Caio escolhem o que vira agente.

**Como ler:**
- **Impacto**: alto / médio / baixo, para quem joga (FPS, diversão, clareza) ou para quem mantém o jogo.
- **Esforço**: P (até meio dia de um agente), M (1 agente, 1 a 2 dias), G (vários agentes ou uma onda).
- **Risco**: o que pode quebrar (visual, balanceamento, rede, comportamento).
- **Origem**: o agente ou a medida de onde a ideia saiu. ESTADO = `tiroteio-notas/work/overhaul/ESTADO.md`; "conferência E01" = a conferência de gameplay desta entrega (§0).

## 0. Conferência de gameplay das redistribuições (C02 Vila, C03 Sanatório)

**Como foi feito.** O jogo rodou de verdade num Chromium (host offline, gráfico Baixo, relógio travado com `__T.sim`). O jogador **andou com as teclas do jogo** (W, e Espaço quando travava), com a colisão real do `moveBody`, do nascimento até cada item. Antes, abriu com F, pagando, cada porta do caminho de menor custo (`M.z.doors`). No item, a compra foi pelo F de verdade: o prompt saiu do `zInteract`, a compra do `zUse` e o pagamento do `srvZUse`. Depois de cada compra o teste conferiu:
- o preço cobrado;
- o efeito no servidor e no cliente (bebida, letal, Bowie ou arma).

Entre um item e outro o jogador voltava ao nascimento, sem zumbis e com pontos de sobra.

Houve também um passe estático: para cada item, um caminho a pé desde o nascimento abrindo **só a cadeia de portas daquele item**, sem as portas que outros itens já tinham aberto.

O script e os resultados ficam fora do repositório, em `tiroteio-notas/work/overhaul/E01/` (`conferencia.mjs`, `san.json`, `vila.json`, `*_trap.json`). Ver a ideia T1 para trazê-lo como teste.

**Resultado:**
- **Sanatório:** 74 de 74 itens comprados de fato: Energia, 13 bebidas, PaP, 34 compras de parede e os 25 lugares da Caixa, incluindo o novo `caixa:16` em r6. O passe estático também deu 74/74.
- **Vila:** 86 de 86 itens comprados de fato: Energia, 13 bebidas, PaP, 38 compras de parede (os 8 letais novos com a letal e o preço certos) e os 33 lugares da Caixa. O passe estático também deu 86/86.
- **Armadilhas:** a dos 2 mapas comprada e ligada.
- **Softlocks:** nenhum item inalcançável, nenhuma porta que não abre e nenhum prompt errado, nos dois mapas.
- **0 erros de página.**

### Sanatório (HEAD 299328e + b3b9342)

| Item | Área | Portas abertas para chegar (cadeia) | Prompt | Pago | Recebeu |
|---|---|---|---|---|---|
| Energia | P Caldeiras | AF, FG, GH, HP | Ligar a energia | 0 | energia ligada |
| Quick Revive | B | AB | Quick Revive [500] (sozinho) | 500 | sim |
| Stamin-Up (trocado com o Jug) | D | BD | Stamin-Up [2000] | 2000 | sim |
| Speed Cola (para o Necrotério) | I | DI | Speed Cola [3000] | 3000 | sim |
| Double Tap | F | (já aberta) | Double Tap [2000] | 2000 | sim |
| Juggernog (para o Teatro) | E | BE | Juggernog [2500] | 2500 | sim |
| PhD Flopper | F | – | PhD Flopper [2000] | 2000 | sim |
| Deadshot (6,9) | C | AC | Deadshot Daiquiri [1500] | 1500 | sim |
| Mule Kick (para o Brejo, anel de fora) | r13 | I → r13 | Mule Kick [4000] | 4000 | sim |
| Electric Cherry (para a Cozinha) | H | (aberta pela Energia) | Electric Cherry [2000] | 2000 | sim |
| Vulture Aid | J | BJ | Vulture Aid [3000] | 3000 | sim |
| Widow's Wine | K | CK | Widow's Wine [4000] | 4000 | sim |
| Dying Wish (para o Pomar, anel de fora) | r10 | KL, Lr10 | Dying Wish [4000] | 4000 | sim |
| Timeslip | G | – | Timeslip [2000] | 2000 | sim |
| Pack-a-Punch (com a M1911) | M Torre d'água | KM | Pack-a-Punch na M1911 [5000] → Pegar Mustang & Sally | 5000 | Mustang & Sally |
| Olympia movida (6,5; 7,45) | A | – | Comprar Olympia [500] | 500 | sim |
| Olympia (no lugar do Stakeout, D) | D | – | Comprar Olympia [500] | 500 | sim |
| M14 (no lugar da SPAS, G) | G | – | Comprar M14 [500] | 500 | sim |
| MP40 (no lugar da Dragunov, N) | N | GN | Comprar MP40 [1000] | 1000 | sim |
| MP5K (no lugar da HK21, J) | J | – | Comprar MP5K [1000] | 1000 | sim |
| **Claymore** (era MP40, L) | L | – | 2 Claymores [1000] | 1000 | 2 Claymores |
| **Semtex** (era MP5K, P) | P | – | Semtex (granada que gruda) [500] | 500 | 4 Semtex, letal = semtex |
| Claymore movida (12; −7,45) | C | – | 2 Claymores [1000] | 1000 | 2 Claymores |
| Semtex (F) | F | – | Semtex (granada que gruda) [500] | 500 | 4 Semtex |
| Granadas (A, J, r13) | A/J/r13 | – | Granadas [250] | 250 | 4 HE, letal = he |
| Faca Bowie (Teatro) | E | – | Faca Bowie [3000] | 3000 | Bowie |
| Regiões geradas novas: Dragunov r1, SPAS r2, HK21 r5, Commando r9 | r1/r2/r5/r9 | Nr1, r1r2, Nr5, Mr9 | Comprar … [2000/1500/2500/2000] | igual ao giz | sim |
| As outras 15 armas de parede | – | – | Comprar …/preço do giz | igual | sim |
| Caixa nos 25 lugares (0 a 24, incluindo o 16 novo em r6) | todas | – | Caixa Misteriosa [950] | 950 | gira e oferece |

### Vila (HEAD b3b9342)

| Item | Área | Portas abertas para chegar | Prompt | Pago | Recebeu |
|---|---|---|---|---|---|
| Energia | F Pedreira | AB, BF | Ligar a energia | 0 | energia ligada |
| Quick Revive | A | – | Quick Revive [500] (sozinho) | 500 | sim |
| **Juggernog** (muro de fora do Acampamento) | H | AE, EH | Juggernog [2500] | 2500 | sim |
| **Speed Cola** (muro de fora da Pedreira) | F | (aberta pela Energia) | Speed Cola [3000] | 3000 | sim |
| **Mule Kick** (Mina) | J | FJ | Mule Kick [4000] | 4000 | sim |
| **Vulture Aid** (Estação) | G | AC, CG | Vulture Aid [3000] | 3000 | sim |
| **Widow's Wine** (Fábrica) | L | FL | Widow's Wine [4000] | 4000 | sim |
| **Dying Wish** (Serraria) | Q | DI, IQ | Dying Wish [4000] | 4000 | sim |
| Double Tap, Stamin-Up, PhD, Deadshot, Cherry, Timeslip (sem mudança) | B/D/E | AD | preço de `ZPERKS` | igual | sim |
| **Pack-a-Punch** (muralha oeste do Castelo) | I | (abertas antes) | Pack-a-Punch na M1911 [5000] → Pegar Mustang & Sally | 5000 | Mustang & Sally |
| **Faca Bowie** (Castelo, muralha leste) | I | – | Faca Bowie [3000] | 3000 | Bowie |
| **Claymore** (era Commando, Mina, `parede:12`) | J | – | 2 Claymores [1000] | 1000 | 2 Claymores |
| **Granadas** (era HK21, Fábrica, `parede:14`) | L | – | Granadas [250] | 250 | 4 HE, letal = he |
| **Semtex** (era RPK, Serraria, `parede:19`) | Q | – | Semtex (granada que gruda) [500] | 500 | 4 Semtex, letal = semtex |
| **Claymore** (era SPAS, Pântano c1, `parede:26`) | c1 | Mc1 | 2 Claymores [1000] | 1000 | 2 Claymores |
| **Granadas** (era Galil, Margem do rio b10, `parede:27`) | b10 | Lb10 | Granadas [250] | 250 | 4 HE |
| **Semtex** (era FAL, Ponte velha b11, `parede:28`) | b11 | b10b11 | Semtex … [500] | 500 | 4 Semtex |
| **Semtex** (era AK-74u, Cais b20, `parede:31`) | b20 | Nb20 | Semtex … [500] | 500 | 4 Semtex |
| **Granadas** (era MP40, Bairro queimado b30, `parede:35`) | b30 | Pb30 | Granadas [250] | 250 | 4 HE |
| Granadas (A), Semtex (E), Claymore (B) de antes | A/E/B | – | 250 / 500 / 1000 | igual | sim |
| As outras armas de parede (38 compras ao todo) | – | – | Comprar …/preço do giz | igual | sim |
| Caixa nos 33 lugares (0 a 32) | todas | – | Caixa Misteriosa [950] | 950 | gira e oferece |

**Vila: 86 de 86 comprados de fato.** O passe estático também deu 86/86: cada item se alcança só com a própria cadeia de portas. O trajeto mais longo foi até a Caixa 32 (b32): 297 m, 62 s a pé.

**Armadilhas (os 2 mapas):** a alavanca mostra "Armadilha elétrica [1000]", cobra 1000 e liga. No Sanatório, a Olympia movida para (6,5; 7,45) não rouba mais o F da alavanca.

O andador nunca precisou pular: 0 pulos em 160 trajetos, e nenhuma quina prendeu o jogador.

### Achados da conferência

**Nenhum bug que impeça comprar.**

Achados laterais, que viraram ideias:
1. **Placa de giz com desenho de fuzil em toda compra de parede.** O `chalkTex` (`zBuildWorld`, "armas de parede") desenha sempre a mesma silhueta de fuzil. Por isso Granadas, Semtex, Claymore e Faca Bowie também aparecem com um fuzil. Com os 8 gizes da Vila e os 2 do Sanatório que viraram letais, o problema ficou mais visível. **Para reproduzir:** num mapa zumbi, ir até `M.z.wall` com `w: 'he' | 'semtex' | 'clay' | 'bowie'` (Sanatório: Granadas em (−8,45; −5) ou o Bowie do Teatro em (26,45; 21)) e olhar a placa: o desenho é de fuzil. → ideia U1.
2. **Quick Revive esgotado some sem aviso.** Jogando sozinho, depois de 3 compras o `zInteract` faz `continue`: a máquina continua lá, mas o F não mostra nada. → ideia U3.
3. **Cadeia de portas.** Todos os itens se alcançam só com a própria cadeia de portas de menor custo, sem portas abertas por outros itens. O grafo `M.z.doors` bate com a geometria nos dois mapas.

## 1. Desempenho

| # | Ideia | Impacto | Esforço | Risco | Origem |
|---|---|---|---|---|---|
| P1 | **Recorte além da névoa (B02) também na Vila** (`B02.mapas.vila`), com o filtro de silhueta do O2-B02s (só peças com chão atrás). A Vila Médio é o único caso abaixo da meta (48–55 FPS). | alto | M | médio: pop-in de peças altas contra o céu; conferir com o mesmo teste de 20 pontos do B02s | B02 (pista), onda1_resultados |
| P2 | **Pool de luzes virtual**: 6 PointLights reais repartidas a cada quadro entre as lâmpadas do frustum, no lugar das 8 fixas. Ganho de −0,4 a −0,6 ms de GPU. | baixo (GPU não é o gargalo hoje) | M | médio: lâmpada que pisca ao trocar de dona; 24% das vistas do Sanatório têm lâmpadas visíveis | A32, ESTADO |
| P3 | **Sangue em InstancedMesh** (decals e gotas num só draw por material). Ganho de −0,4 a −0,5 ms na horda. | baixo/médio | P–M | baixo: ordem dos transparentes dentro da instância | A20 (opção A11), ESTADO |
| P4 | **Texturas dos braços 2×2048² (44 MB)** → 1024² ou KTX2/Basis. Pouco ganho de FPS, mas muita VRAM em placa integrada. | médio (memória) | P | baixo/médio: braço mais borrado de perto, no Alto | B06, ESTADO |
| P5 | **Névoa mais curta no Baixo** (corta o que o recorte além da névoa desenha). | médio no Baixo | P | médio: muda o visual e o alcance de visão (decisão de jogo: zumbi aparece mais perto) | B16, ESTADO (decisão do Caio) |
| P6 | **Troca de gráfico no meio da partida**: hoje o Baixo só vale inteiro no próximo mapa. Refazer as junções e o recorte na hora (ou avisar "vale no próximo mapa" no menu). | baixo/médio | M (refazer) / P (aviso) | médio: rebuild no meio da horda dá travada | B15, ESTADO |
| P7 | **B10 (cor por área sem cópia de tela) no Sanatório**: ganha ~1 ms de GPU, mas o `SAN_PIORA` usa aberração cromática nas bordas, que o B10 não tem. | baixo | P | médio: perde a aberração (assinatura visual do Sanatório) | B10, ESTADO |
| P8 | **Atlas dos transparentes parados** (decalques, mofo, cartazes) por área, para fechar o alvo do B21 no Sanatório (38 → ≤ 30 draws transparentes). | médio no Sanatório | M | médio: sangramento entre as peças do atlas e mip; conferir nas fotos | B21, ESTADO |
| P9 | **Lençóis (e cortinas) animados no shader** (vertex shader com vento) no lugar de malha `dyn` mexida na CPU: entram na junção. | baixo/médio | M | médio: o movimento fica diferente do atual | B21, ESTADO |
| P10 | **Excluir da junção do B01 as instanciadas que as animações das áreas mexem** (lista estática feita à mão ou por marcação no dado, sem rodar os gatilhos como o B01b fazia). Tira 6 voltas da rede de segurança. | baixo | P | baixo | A34, B01b (recusado) |
| P11 | **`polygonOffset` nas janelas e placas coplanares** (torre da igreja da Vila e outras): o z-fighting que o A31 revelou. | baixo (visual) | P | baixo | A31 |
| P12 | **Sombra do Alto em 4096² (128 MB)**: 2048² com cascata simples ou fitting no frustum. | médio no Alto | M | médio: sombra mais serrilhada de perto | B06 |
| P13 | **Carga da Arena +1,5–2,6 s (B08)**: baixar as armas da partida em paralelo com a montagem do mapa, e não depois. | médio (espera no PvP) | P–M | baixo | onda1_resultados ("o que piorou") |
| P14 | **PeerJS só na 1ª sala (+~3 s no aquecimento do 1º mapa)**: começar a baixar em ócio logo depois que o menu fica pronto. | baixo/médio | P | baixo | B11 |
| P15 | **`MAP_ANIM` do Sanatório escreve exposure/hemi/fill a cada quadro**: escrever só quando muda (e evitar conflito com quem mexe no mesmo valor). | baixo | P | baixo | B19 |
| P16 | **Áudio: HRTF só perto** (PannerNode `equalpower` além de N m). A thread de áudio chega a 98% de um núcleo na horda do Sanatório: risco de estalo, não de FPS. | médio (estalos) | P | baixo | B13/BX |
| P17 | **Bench limpo no fim da Onda 2** (horda da Vila inconclusiva no C02, máquina ocupada) e bench automatizado intercalado como passo fixo de cada lote. | médio (processo) | P | nenhum | C02, FILA_ONDA2 |

## 2. Distribuição e interativos

| # | Ideia | Impacto | Esforço | Risco | Origem |
|---|---|---|---|---|---|
| D1 | **Spearman força × custo de portas da Vila preso em 0,17** (meta ≥ 0,5). As armas das regiões geradas (`VILA_GEN`, uma por região) puxam a correlação para baixo. Opções: (a) arma da região escolhida pela distância em portas (anéis de fora com armas mais fortes, como o C03 fez com r1/r2/r5/r9 no Sanatório); (b) excluir da métrica as armas de região, que são "cobertura" e não "recompensa"; (c) aceitar. | médio | P (a, só dados) | baixo/médio: muda a progressão de armas | C02, ESTADO |
| D2 | **Confirmar com o Caio os letais em gizes**: 8 na Vila (HE ×3, Semtex ×3, Claymore ×2) e 2 no Sanatório (Claymore, Semtex). A conferência mostra que funcionam e cobram o preço certo, mas com a mesma placa de fuzil (U1). Alternativa: um interativo próprio para letais (caixa de munição/granadas). | médio | P | baixo | C02, C03, ESTADO |
| D3 | **Confirmar Mule Kick e Dying Wish no anel de fora** nos dois mapas (4000 + 2500–4250 de portas). Jogando sozinho, é caro chegar lá antes da rodada 10. Medir no harness o tempo até ter pontos para isso. | médio | P | baixo | C03, ESTADO |
| D4 | **Armadilhas fora da área inicial** (regra 9 da auditoria): pelo menos 1 por anel de regiões, com a identidade do mapa (fogo no Crematório, elétrica nas Caldeiras, serra na Serraria da Vila). Já está na fila da Etapa 3 (C04+). | alto | M por tipo | médio: balanceamento (trap mata sem dar pontos) | auditoria §2.8 e §3.9 |
| D5 | **Cobertura por região** (regra 7): regiões de fora com 1 arma em 2500–10 600 m². Dar a cada uma pelo menos 1 interativo próprio (terminal de lore, interruptor de atalho, barricada reparável, máquina de upgrade). | alto | G | médio | auditoria §2.7 |
| D6 | **Zumbi que sai do chão a menos de 3 m do balcão** no Pátio do Sanatório (Claymore `parede:19` e Deadshot). A Speed Cola já saiu dali. Mover o ponto do chão ou o item. | baixo | P | baixo | auditoria §2.3 |
| D7 | **A auditoria e a conferência em toda mudança de `M.z`**: a `auditoria.mjs` cobre a geometria; a conferência (T1) cobre "dá para comprar". Rodar as duas no fim de cada C0x. | médio (processo) | P | nenhum | conferência E01 |
| D8 | **Caixa com peso por região** (lugares mais longe do início com tabela de armas um pouco melhor, ou sem ursinho na 1ª vez): dá motivo para abrir o mapa. | médio | P | médio: balanceamento | auditoria §2.6 |

## 3. Interface (UX) e clareza

| # | Ideia | Impacto | Esforço | Risco | Origem |
|---|---|---|---|---|---|
| U1 | **Silhueta da placa de giz pelo tipo** (`chalkTex(title, price)` sempre desenha fuzil). Silhuetas para pistola, SMG, escopeta, fuzil, precisão, metralhadora, granada, Semtex, Claymore e faca, com a classe vinda de `W[w]`. Corrige a "placa da Faca Bowie com desenho de fuzil", que vale também para todos os letais. Cuidado com o cache `B06_GIZ` (a chave precisa incluir o tipo). | médio | P | baixo | ESTADO (bug antigo), conferência E01 |
| U2 | **Descrição da bebida no prompt** (o `ZPERKS[k].desc` já existe e só a auditoria usa): segunda linha menor sob "Speed Cola [3000]". | médio para quem começa | P | baixo | conferência E01 |
| U3 | **Quick Revive esgotado com prompt** ("Quick Revive esgotado", `ok: false`) em vez de sumir (`zInteract`: `if (pk.k === 'qr' && solo && ZC.qrBuys >= 3) continue;`). | baixo | P | baixo | conferência E01 |
| U4 | **Mapa (tecla) com o que já foi aberto e comprado**: portas abertas, máquinas (com energia ou não), PaP, lugar atual da Caixa. Os mapas zumbi são grandes (Vila ±230 m). | alto | M | baixo | auditoria (tamanho das regiões), conferência (caminhos de até 297 m) |
| U5 | **Aviso de para onde a Caixa foi** depois do ursinho (som com direção + marca no HUD por alguns segundos). | médio | P | baixo | `zTickObjects` (`gone` → novo `loc`) |
| U6 | **Prompt com o preço em vermelho quando faltam pontos** (hoje só aparece o toast "Pontos insuficientes" depois do F). | baixo | P | baixo | `zUse` |
| U7 | **"Vale no próximo mapa"** no menu de gráfico durante a partida (ligada a P6). | baixo | P | nenhum | B15 |

## 4. Acessibilidade

| # | Ideia | Impacto | Esforço | Risco | Origem |
|---|---|---|---|---|---|
| A1 | **Volume por canal** (efeitos, música/ambiente, vozes de zumbi, interface): hoje só existe `CFG.vol`. | médio | P | baixo | `CFG` |
| A2 | **Reduzir tremor e balanço da câmera** (`me.shake`, punch, mola da arma) por uma opção de 0–100%. Ajuda quem enjoa com movimento. | médio | P | baixo | `CFG` não tem; fase 6 (w18) aumentou a mola |
| A3 | **Modos para daltonismo** nas máquinas e nos power-ups (cor + forma/ícone). Hoje as bebidas se distinguem pela cor do corpo e pelo letreiro. | médio | M | baixo | `zBuildWorld` (máquinas por `P.color`) |
| A4 | **Legendas de sons importantes** ("cães chegando", "Gritador", "Caixa se mexeu", "energia ligada") no HUD. | médio | P | baixo | `zRoundFx`, sons do zumbi |
| A5 | **Remapear teclas** (F, V, Q, Ctrl/C) e alternar ou segurar para correr e agachar. O Ctrl+W fora da tela cheia já é um problema conhecido (toast em `keydown`). | alto | M | baixo/médio: conflito com o atalho do navegador | `LOCK_KEYS`, toast do Ctrl |
| A6 | **Tamanho do HUD e do texto do prompt** (escala 80–150%). | baixo/médio | P | baixo | – |

## 5. Áudio

| # | Ideia | Impacto | Esforço | Risco | Origem |
|---|---|---|---|---|---|
| S1 | **Jingle posicional das máquinas** perto delas, quando estão ligadas (ajuda a achar a bebida sem mapa). | médio | P | baixo (custo: 1 nó por máquina perto) | U4 |
| S2 | **Limite de vozes de zumbi** por distância e prioridade (junto com P16). | médio na horda | P | baixo | B13 |
| S3 | **Assinatura sonora por mapa** (ambiente do Sanatório × Vila), nas áreas novas da Etapa 3. | médio | M | baixo | – |

## 6. Multijogador

| # | Ideia | Impacto | Esforço | Risco | Origem |
|---|---|---|---|---|---|
| M1 | **Fila no Pack-a-Punch e na Caixa** (hoje um jogador trava a máquina por até 15 s com a arma pronta e ninguém mais usa): mostrar "ocupado por X · 9 s" no prompt. | médio | P | baixo | `srvZUse` (`Z.pap.st !== 'idle'` só retorna, sem aviso) |
| M2 | **Entrar no meio da partida e reconectar** com o mesmo estado (pontos, bebidas, armas) quando o cliente cai. | alto | G | alto: rede, segurança do host | – |
| M3 | **Migração de host** quando o host sai (hoje a partida acaba). | alto | G | alto | – |
| M4 | **Teste com 2 clientes no harness** (o BX mediu rede com 2º cliente; os testes de fluxo são só host). Cobrir compra, porta e Caixa vistas pelo cliente. | médio | M | nenhum | BX, tests/ |

## 7. Testes e ferramentas (domínio da Frente E)

| # | Ideia | Impacto | Esforço | Risco | Origem |
|---|---|---|---|---|---|
| T1 | **Trazer a conferência de gameplay para `tests/`** (`compras-zumbi.test.mjs`, marcada como lenta): cada bebida, letal, PaP e porta comprados andando de verdade. Leva uns 4 min no Sanatório e uns 15 min na Vila com GPU. | médio | P | nenhum | conferência E01 |
| T2 | **Conferir a placa de giz contra o tipo** (depois de U1): ler o canvas do `chalkTex` e comparar a silhueta com a classe da arma. | baixo | P | nenhum | U1 |
| T3 | **Teste de "sem jogador preso"**: andar aleatório com a grade do jogador por N minutos, checando se o jogador para de se mexer (detecta quina e vão onde ele prende). | médio | M | nenhum | conferência E01 (o andador nunca precisou pular nos dois mapas) |
| T4 | **Ganchos `__T` para interativos novos** (C04): todo tipo novo expõe estado e ação para a auditoria e a conferência. | médio | P | baixo | C04, FILA_ONDA2 |

## 8. Pendências visuais anotadas (sem dono ainda)

- **Tampa da b21 "bate por dentro"** (Vila). Origem: B18; decisão do Caio.
- **Lâmpada da r3 do Sanatório apagada depois do tour.** É estado, não geometria. Origem: B02.
- **Travadas de 0,3–5,8 s no PvP** por disputa de GPU da máquina. Não é do jogo; repetir numa máquina livre. Origem: B04.
