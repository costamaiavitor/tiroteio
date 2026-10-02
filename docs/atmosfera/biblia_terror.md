# Bíblia de terror: Vila e Sanatório

Este documento é a referência para as fases 2 a 5. Ele define:
- a história que liga os dois mapas;
- as regras de estilo e o que o motor permite;
- uma ficha para cada uma das 62 áreas;
- o registro de números, datas e personagens, e o registro de repetições entre áreas.

Nenhuma cena foi alterada nesta fase.

## 1. A história (cânone)

**São Lázaro do Vale, 1958.** É uma vila rural de mineiros e lavradores, abaixo do **Sanatório Santa Inês**, um hospital de repouso no alto do morro.

1. **O Veio.** Em 1956, a mina abre uma galeria que vaza uma água preta, fria e sem cheiro. Os mineiros a chamam de **o Veio**. Ela se mistura ao lençol: o poço, o lago e o chafariz passam a ter um brilho escuro.
2. **A febre cinza.** Quem bebe dorme muito e acorda diferente: pele acinzentada, sono sem sonho, e uma frase repetida, "*ainda não acabou*". Os mortos da vila deixam de ficar parados nas covas.
3. **O Programa.** O diretor do Sanatório, **Dr. Aurélio Vasconcellos**, oferece "tratamento" gratuito. Um caminhão-ambulância branco leva as famílias, uma por vez, numa lista com números. Os que ficam marcam as portas com uma **cruz de cal** quando alguém da casa é levado.
4. **A quarentena.** O Exército cerca o vale (Base militar, Quartel), corta a ferrovia e proíbe a água. A vila se esvazia no meio de tarefas: mesa posta, roupa no varal, missa interrompida.
5. **Dentro do Sanatório.** O Programa não cura: ele estuda como os mortos acordam. Primeiro em animais (Estábulo), depois em pacientes (Laboratório, Necrotério) e por fim em crianças da vila (Anexo do asilo). O que sobrava ia para o Crematório. O Veio era bombeado para a Torre d'água e servido em todo o prédio.
6. **Hoje.** Os jogadores chegam à vila vazia. Quanto mais longe vão (mais portas abertas), mais perto estão do Sanatório e da verdade.

**Escalada:**
- **Vila:** inquietação que cresce. Começa no "parece normal, mas está errado" e termina em quarentena, fogo e fanatismo.
- **Sanatório:** horror explícito. Começa limpo e institucional e termina no Crematório.

### Motivos que costuram as duas áreas
Use-os com moderação, cada um com uma variação própria por área.

| Motivo | Na Vila | No Sanatório |
|---|---|---|
| **Água preta do Veio** | o poço, o lago e o chafariz ficam escuros aos poucos | baldes, tubos e a Torre d'água |
| **Cruz de cal nas portas** | casas de onde alguém foi levado | o mesmo símbolo como carimbo nas fichas |
| **Números** | etiquetas de papel com o número da família nas portas e nos objetos | o mesmo número numa pulseira de paciente, no prontuário ou numa gaveta do necrotério |
| **"ainda não acabou"** | arranhado, escrito ou sussurrado, sempre em lugar diferente | idem |
| **A ambulância branca** | marcas de pneu na Praça; um para-lama na Ponte velha | o baú no Ferro-velho; o veículo inteiro na Portaria |
| **Sino** | o da Igreja tocando sozinho; o sininho de cova; a bóia-sino do Farol | a campainha de consagração na Capela; a campainha de recolhimento no Pátio; a sineta da portaria no Convento |

## 2. Regras de estilo
- **Terror por sugestão** em vez de susto: o jogador deve perceber, não levar um susto. Jumpscare só raro, com propósito, nunca com som estourado e nunca tirando o controle.
- **Cada área tem identidade própria.** Um objeto genérico (cadeira, mesa, cruz, boneca) só aparece numa variante própria da área e com ligação à história dela. Os objetos de uma área não podem ser reaproveitados em outra.
- **Gameplay intocável:**
  - as armas, as máquinas, a Caixa, o Pack-a-Punch, as janelas e as portas continuam visíveis e legíveis;
  - nada esconde zumbis nem bloqueia caminho;
  - objeto novo é só visual, ou baixo e coberto pela regra de escalada (`ZTOP` 1,21 m).
- **Gatilhos de tensão** rodam só no cliente (cada jogador vê o seu): proximidade, olhar (direção da câmera), tempo parado. Não mandam nada pela rede e não dependem de sorteio sem semente para nada que tenha colisão.

## 3. O que o motor permite (para quem implementar)
- **Geometria:** caixas, cilindros, cones, planos, `InstancedMesh`, grupos; peças pequenas juntadas com `mergeGeos`. Não há modelos externos de cenário.
- **Texturas:** desenhadas em canvas (`genTex` e `canvasTex`): manchas, rachaduras, escrita à mão, papéis, números.
- **Luz:** de 5 a 8 `PointLight` reais no total, distribuídas pelo pool por proximidade. Fora disso a luz é falsa: material emissivo, sprite que brilha, plano aditivo, bloom.
- **Animação:** funções em `MAP_ANIM`, chamadas a cada quadro com `dt`. Nada pode alocar memória por quadro.
- **Névoa e cor:** `THREE.Fog` por mapa. O `gradePass` hoje só tem os uniforms `time` e `sc`: tom, saturação, vinheta ou paleta por área exigem uniforms novos.
- **Áreas geradas (`zGen`):** o sorteador `rr()` é um só para todas as regiões; mudar a quantidade de sorteios de uma região desloca arma, Caixa, lâmpadas e risers das seguintes. Variação por área = trocar cor ou material depois do sorteio, ou usar um `mkRand` próprio fora do `zGen`. A água das regiões geradas é um material único em `zGenDeco`.
- **Som:** sintetizado com WebAudio (osciladores, ruído, filtros), como em `SND`; não há arquivos de áudio.
- **Desempenho:** a Vila é enorme. Use o recorte por distância (`cullAdd`) e instâncias, sem sombras novas no gráfico Baixo.

## 4. Tipo de terror por área
O tipo dominante de cada área vem desta tabela; as repetições ficam em anéis diferentes e com outra variação.

### Vila
| Ordem | Área | Tipo dominante |
|---|---|---|
| 0 | Praça (A) | falsa segurança |
| 1 | Igreja (B) | religioso |
| 1 | Lago (E) | presença invisível |
| 1 | Fazenda (C) | algo que se move quando não observado |
| 1 | Cemitério (D) | som fora do lugar |
| 2 | Pedreira (F) | isolamento |
| 2 | Acampamento (H) | infância corrompida |
| 2 | Estação (G) | loop/repetição |
| 2 | Castelo (I) | vigilância |
| 3 | Mina (J) | claustrofobia |
| 3 | Fábrica (L) | loop/repetição (linha de produção) |
| 3 | Farol (O) | som fora do lugar |
| 3 | Floresta (P) | algo que se move quando não observado |
| 3 | Hospital de campanha (K) | médico/clínico |
| 3 | Ferrovia (M) | falsa segurança |
| 3 | Porto (N) | presença invisível |
| 3 | Serraria (Q) | corpo/grotesco |
| 4 | Base militar (c0) | vigilância |
| 4 | Vinhedo (c2) | infância corrompida |
| 4 | Pântano (c1) | presença invisível |
| 4 | Ruínas da cidade (c3) | som fora do lugar |
| 4 | Margem do rio (b10) | algo que se move quando não observado |
| 4 | Bairro queimado (b30) | religioso (purificação pelo fogo) |
| 4 | Encosta (b00) | isolamento |
| 4 | Cais (b20) | claustrofobia |
| 5 | Pico da montanha (b02) | falsa segurança |
| 5 | Estaleiro (b22) | loop/repetição |
| 5 | Bosque (b12) | vigilância |
| 5 | Brejo negro (b32) | corpo/grotesco |
| 5 | Ponte velha (b11) | som fora do lugar |
| 5 | Quartel (b31) | médico/clínico |
| 5 | Mina velha (b01) | religioso (culto ao Veio) |
| 5 | Ilha do porto (b21) | isolamento |

### Sanatório
| Ordem | Área | Tipo dominante |
|---|---|---|
| 0 | Recepção (A) | falsa segurança |
| 1 | Capela (F) | religioso |
| 1 | Enfermaria (B) | presença invisível |
| 1 | Pátio (C) | isolamento |
| 2 | Laboratório (D) | médico/clínico |
| 2 | Refeitório (G) | loop/repetição |
| 2 | Teatro (E) | infância corrompida |
| 2 | Ala Psiquiátrica (J) | som fora do lugar |
| 2 | Jardim (K) | vigilância |
| 3 | Biblioteca (N) | algo que se move quando não observado |
| 3 | Cozinha (H) | claustrofobia |
| 3 | Necrotério (I) | corpo/grotesco |
| 3 | Estufa (L) | falsa segurança |
| 3 | Torre d'água (M) | presença invisível |
| 4 | Caldeiras (P) | claustrofobia |
| 4 | Cemitério (r1) | loop/repetição |
| 4 | Túneis de serviço (r5) | claustrofobia |
| 4 | Brejo (r13) | algo que se move quando não observado |
| 4 | Pedreira (r3) | isolamento |
| 4 | Pomar (r10) | falsa segurança |
| 4 | Lavanderia (r9) | algo que se move quando não observado |
| 5 | Ferro-velho (r12) | médico/clínico |
| 5 | Portaria (r2) | vigilância |
| 5 | Anexo do asilo (r6) | infância corrompida |
| 5 | Ruínas do convento (r4) | religioso |
| 5 | Ilha do lago (r14) | som fora do lugar |
| 5 | Floresta (r8) | presença invisível |
| 5 | Estábulo (r11) | corpo/grotesco |
| 6 | Crematório (r7) | corpo/grotesco e médico/clínico (o clímax) |

## 5. Fichas das áreas
As fichas seguem a ordem de desbloqueio. Os números (famílias, pulseiras, gavetas) seguem o registro da seção 6; as trocas de objetos feitas para evitar repetição estão na seção 7.

### Vila

#### Praça (A) · ordem 0 · falsa segurança
- **Conceito:** a Praça Matriz de São Lázaro no dia em que a festa do padroeiro foi enfeitada e nunca aconteceu: a ambulância branca do Programa estacionou aqui de manhã, levou a primeira família da lista daquela semana (a 101), e a vila desmontou a festa só pela metade.
- **Como o terror aparece aqui:** quase não aparece. Tudo é morno, colorido e "de cidade pequena": bandeirinhas, pipoca, sapato engraxado. O único erro é de comportamento (os pombos), de rastro (pneu que vem e volta pelo mesmo portão) e de papel (um aviso alegre demais). O jogador deve sair da Praça achando que ela é o lugar seguro do mapa.
- **Props únicos (8):**
  1. **Varal de bandeirinhas da Festa de São Lázaro** entre os 4 postes internos ((±7, ±7)): 4 lances em catenária de y 3,1 (no poste) a 2,6 (no meio), 10 bandeirinhas triangulares por lance em papel de seda desbotado (vermelho, amarelo, azul, verde). Uma única bandeirinha, no lance sul, é branca e lisa. Instância: 1 `InstancedMesh` de triângulo plano (40) + 4 `rbox` finos de barbante. (só visual)
  2. **Faixa de pano "FESTA DE SÃO LÁZARO · 15 DE AGOSTO"** pendurada entre os postes (−7, −7) e (7, −7) a y 3,0, textura de canvas com letra pintada a pincel e uma ponta solta caída. Plano 9 × 0,7 com `DoubleSide`. (só visual)
  3. **Carrinho de pipoca vermelho e branco** em (8,5; −9), virado para o chafariz: caixa 0,9 × 1,0 × 0,6, vitrine com plano emissivo amarelado fraco (pipoca), toldo listrado (plano com canvas), 2 rodas de cilindro. A panela está tombada para fora. (só visual; 1,1 m de altura, não encosta na grade diagonal, que fica a 1,6 m)
  4. **Pipoca derramada no paralelepípedo** entre o carrinho e o chafariz (círculo de 1,5 m em (6,5; −8)): ~60 instâncias de icosaedro 0,03 m em 1 `InstancedMesh`, cor creme. (só visual)
  5. **Bando de 7 pombos** ciscando a pipoca: corpo (esfera achatada 0,12 m) + cabeça (esfera 0,05 m), 2 `InstancedMesh` de 7; cor cinza-azulada com pescoço de verde metálico (emissivo 0). (só visual)
  6. **Marcas de pneu da ambulância branca**: decal de canvas (2 trilhas paralelas de 0,22 m, terra clara seca sobre a pedra) que entram pelo portão AB (0, −14), contornam o chafariz pelo lado leste num laço e saem pelo mesmo portão. Um plano 12 × 26 a y 0,012, `transparent`, `depthWrite: false`, `polygonOffset`. (só visual)
  7. **Mural de avisos da prefeitura** em (−8,5; −9), de frente para o centro: cavalete de 2 pés, quadro de cortiça 1,1 × 0,8 a y 1,2–2,0 com 4 papéis presos por tachinhas (canvas): "VACINAÇÃO GRATUITA — Sanatório Santa Inês — Dr. Aurélio Vasconcellos", um programa da festa, um "Procura-se cachorro" e uma lista datilografada "Famílias chamadas esta semana: 101, 102, 104…". (só visual)
  8. **Caixa de engraxate com um par de sapatos de domingo de homem, de duas cores**, um brilhando e o outro ainda opaco, a escova em cima; em (−6,3; −1,8), ao pé do banco oeste. 3 caixas pequenas + 2 sapatos (caixa arredondada com `boxGeo`). (só visual)
  9. **Barquinho de papel dobrado com o programa da festa, boiando no chafariz de baixo** (3 planos dobrados, 0,25 m), girando devagar sobre a água (y 0,69). A borda da bacia ganha um **anel de lodo escuro** de 4 cm na linha d'água (torus fino, cor #1d2a24): a primeira e mais discreta aparição do Veio. (só visual)
- **Momento de assinatura: "os pombos que não voam mais".** Nas rodadas 1 e 2, quando o jogador chega a menos de 3 m do bando, os pombos levantam voo de verdade (subida em arco de 1,2 s com bater de asas no som), pousam na cumeeira do telhado da igreja e voltam 20 s depois: vida normal, falsa segurança confirmada. A partir da rodada 3 (ou depois do primeiro portão aberto, o que vier antes), ao chegar a 3 m eles **não voam**: os 7 param de ciscar ao mesmo tempo e viram a cabeça para o jogador por 1,5 s, em silêncio, e voltam a ciscar como se nada tivesse acontecido. Acontece no máximo uma vez por rodada por jogador. Seguro: só visual, sem colisão, nada se move para o caminho; roda só no cliente (cada jogador vê o seu bando reagir).
- **Animações ambientais (3):** ciscar dos pombos (cabeça desce e sobe com fase própria, passinhos de 5 cm a cada 2–4 s); bandeirinhas tremulando (rotação em x de ±8° por seno com fase por instância, uma vez por quadro em `InstancedMesh.setMatrixAt` só quando visível); barquinho de papel girando 0,1 rad/s e balançando 1 cm na água.
- **Luz e cor:** paleta #e8b878 (sódio quente), #6f6a62 (paralelepípedo), #c94a3a (bandeirinha), #2b4a5a (água). Nenhuma `PointLight` nova: usa o lampião do chafariz e os 4 postes que já existem; a vitrine da pipoca é emissiva fraca (×0,6). Ao entrar: `gradePass` com tom levemente mais quente nas altas (+0,02 no vermelho) e névoa um pouco mais longe (+10 m no `far`): é a área mais clara e mais "bonita" do jogo, de propósito.
- **Som ambiente:** (1) chafariz: ruído branco em passa-banda 2,4 kHz (Q 0,8) com ganho modulado por LFO de 0,3 Hz, volume pela distância ao centro; (2) arrulho de pombo a cada 7–15 s: seno 420 Hz com FM de 6 Hz e envelope de 0,6 s em 2 notas descendentes. Na rodada 3+, quando os pombos encaram, o arrulho para por 4 s (o silêncio é o susto).
- **Escalada:** é o grau zero. Tudo que existe nas áreas seguintes aparece aqui só como sombra: o Veio é um anel de lodo; o Programa é um aviso de vacinação; os números são uma lista datilografada; a ambulância é um rastro de pneu.
- **Implementação:** tudo dentro do octógono |x|,|z| ≤ 14, longe de m14 (−9,5; −5), olympia (9,5; −5), granadas (−9,5; 5), Quick Revive (−4; 11,5), Caixa (9,6; 5), armadilha AE (0; 14), spawns (±2,5; 6–9) e risers (±4; −11), (−11; 1), (11; −1); o carrinho fica a 4,9 m do riser (4; −11). ~14 malhas + 5 `InstancedMesh` (bandeirinhas 40, pipoca 60, pombos 7+7). Texturas de canvas: faixa 512×64, mural 256×192, decal de pneu 256×512. Animação sem alocação (matrizes reaproveitadas); pombos e bandeirinhas só animam se a Praça estiver a menos de 40 m da câmera.

#### Igreja (B) · ordem 1 · religioso
- **Conceito:** a missa das sete do domingo em que o Padre Anselmo leu do púlpito os números das famílias chamadas pelo Programa; a ambulância esperava na porta. O padre foi levado na mesma semana, e a casa paroquial ganhou a cruz de cal.
- **Como o terror aparece aqui:** pela liturgia que ficou no ar: tudo está no meio de um gesto (véus nos bancos, folhetos caídos, velas pela metade). O sagrado foi usado para chamar gente para o Programa, e o quadro de cânticos mostra números de família no lugar dos números de hino.
- **Props únicos (8):**
  1. **Quadro de cânticos de madeira** na parede oeste da nave, em (−6,55; y 1,5–2,5; −34,2), de frente para +x: moldura escura com 3 fichas de número pintadas a branco "214 · 215 · 216" (os números das famílias, não de hinos). Canvas 128×192. (só visual)
  2. **Mantilhas de renda branca** largadas em 3 bancos ((−3,2; −33,5), (3,2; −29,1), (−3,2; −26,9)): plano 0,9 × 0,5 com textura de renda (canvas com furos em alfa), dobrado sobre o encosto com 2 segmentos. (só visual)
  3. **Folhetos da missa espalhados pelo corredor central** (x −1 a 1, z −37 a −25): 26 planos 0,15 × 0,21 em 1 `InstancedMesh` a y 0,05, rotação aleatória com semente (`mkRand`), alguns pisados (canvas com marca de sola). (só visual)
  4. **Dois círios do altar** em castiçais de latão de 1,2 m, um de cada lado do altar, em (±1,6; −39,3): velas grossas meio consumidas, com escorridos de cera e chama em sprite aditivo. O da direita fica a 4,9 m do Juggernog; o da esquerda, a 3,4 m da Caixa (−5; −39,2). (só visual)
  5. **Pia de água benta de pedra** presa na parede ao lado da porta, em (5,4; y 1,0; −24,5): meia-taça (cilindro cortado) com a água em disco de cor #10181a e um fio escuro no fundo: a água vem do poço. (só visual)
  6. **Sino de bronze à vista no campanário**: 4 vãos escuros (planos pretos 1,2 × 1,6 em y 9,2–10,8) nas faces da torre (9,2; −38,5) e, no vão sul, o sino (`LatheGeometry` de 10 segmentos, cor #6a5530) meio para fora da face, com a língua aparente. (só visual)
  7. **Cruz de cal na parede oeste da casa paroquial** (−23,5; y 1,6; −30), de frente para −x: decal de canvas com pincelada grossa, escorridos e respingos no chão. Do lado oposto ao Clay (−16,5; −31) e ao Vulture Aid (−18; −26,55). (só visual)
  8. **Poço lacrado pelo padre** (o poço existente em (10, −20)): tábuas pregadas em X sobre a boca (3 caixas finas), uma cruzinha de madeira amarrada com arame em cima e um balde de zinco pendurado na corda, com um palmo de água preta. (colisão baixa: o poço já tem 0,9 m; as tábuas ficam a 0,95 m, dentro do colisor existente)
- **Momento de assinatura: "o sino que responde".** Gatilho: jogador dentro da nave (|x| < 6, −39 < z < −25), parado há 6 s e olhando para o altar (direção da câmera a menos de 30° de −z). O sino da torre bate **uma única vez**, grave e abafado, posicionado na torre; no mesmo instante as chamas dos dois círios se inclinam juntas para a porta (+z) por 2,5 s e as mantilhas levantam 3 cm, como se uma porta grande tivesse se aberto. Nada mais acontece. No máximo uma vez por rodada por jogador. Seguro: não tira o controle, não esconde nada, só som e visual local.
- **Animações ambientais (3):** chamas das velas tremulando (escala do sprite com seno + ruído com semente, sem `Math.random` por quadro); folhetos deslizando 2–4 cm em direção à porta a cada 10–20 s, como corrente de ar (2 a 3 por vez); balde do poço girando na corda (±15°) com rangido.
- **Luz e cor:** paleta #d9c49a (vela), #3a6ad0 (vitral), #2a1d14 (madeira), #e8e4d8 (cal). Nenhuma `PointLight` nova: a lâmpada existente da nave (0; −33; y 4,8) passa a tremer em sincronia com as velas (±12%); as 2 chamas dos círios são sprites emissivos. Dentro da nave: `gradePass` 15% menos saturado e tom frio nas sombras; fora, normal.
- **Som ambiente:** (1) só dentro da nave: bordão de órgão quase inaudível, dois senos 65 Hz + 98 Hz (quinta) com ganho 0,015 e um atraso de 0,23 s com realimentação 0,4 (eco de pedra); (2) rangido de banco a cada 9–16 s: ruído em passa-banda 700 Hz, 0,25 s, com glissando do filtro para 500 Hz. O sino da assinatura: 3 senos inarmônicos (110, 247, 341 Hz) com decaimento de 4 s.
- **Escalada:** primeira área em que o motivo aparece por inteiro e com nome: a cruz de cal, os números das famílias, a água preta numa pia sagrada e o sino. Ainda é inquietação: nada se move de verdade.
- **Implementação:** bbox x −34,5 a 34,5, z −49,5 a −10,5. Evitar MP40 (−12; −22), Clay (−16,5; −31), Juggernog (6,2; −37,6), Electric Cherry (15; −33), Vulture Aid (−18; −26,55), Caixa (−5; −39,2), janelas (±10; −50,5), porta (x −2 a 2 em z −24) e o corredor entre os bancos. ~22 malhas + 1 `InstancedMesh` (folhetos 26) e 2 sprites de chama. Tudo com `cullAdd`; as animações da nave só rodam com a câmera a menos de 30 m de (0; −32).

#### Lago (E) · ordem 1 · presença invisível
- **Conceito:** o Lago do Moinho foi o primeiro a escurecer com o Veio; o moleiro Benedito pescava todas as tardes da cadeira de balanço da margem, bebeu a água, dormiu três dias e voltou para a margem de noite, e desde então "alguém" continua pescando ali.
- **Como o terror aparece aqui:** por efeitos sem causa: a linha de pesca estica, a cadeira balança com o peso de alguém, a água faz anéis onde nada caiu, e pegadas molhadas saem do lago. Nunca se vê quem é.
- **Props únicos (8):**
  1. **Cadeira de balanço de palhinha com o xale do moleiro dobrado no assento**, em (3; 30,5), virada para a água (+x). Pés curvos com `TorusGeometry` parcial, assento em caixa fina, xale de crochê marrom (plano dobrado). (só visual)
  2. **Duas varas de bambu fincadas na margem sul** em (15; 25,8) e (18,5; 27,6), linhas de náilon (cilindro 0,005 m) entrando na água; a da direita tensa e vibrando. Bóia vermelha (esfera 0,04 m) na ponta. (só visual)
  3. **Samburá (cesto de pesca de taquara) dentro do barco** existente (14; 33), com três traíras escurecidas de olho branco, e um par de remos cruzados no banco. (só visual)
  4. **Lençóis quarando na grama** em (23; 29,5) e (23,5; 32): 2 planos 2,6 × 1,6 a y 0,02 com dobras (bump de canvas), muito brancos; quando o vento levanta uma ponta, vê-se que a grama embaixo morreu num retângulo cinza perfeito, do tamanho exato de cada lençol. (só visual)
  5. **Caixote com garrafas-amostra de água preta** encostado na lateral leste da casa, em (2,7; 39,5): 8 garrafas (cilindro + gargalo, `InstancedMesh`) com rótulos de papel "AMOSTRA 3 — LAGO — 12/VIII" (canvas), uma caída e vazia. (colisão baixa 0,45 m opcional; preferir só visual)
  6. **Rede de pesca estendida entre duas estacas** em (−25; 43), 3 m × 1,4 m, rasgada no meio de dentro para fora, com as pontas do náilon viradas para fora, como se algo grande tivesse passado por ela. Plano com textura de malha em alfa. (só visual; não fica na frente de janela: as janelas do Lago estão em (±10; 50,5))
  7. **Pano preto amarrado numa pá do moinho** existente: plano 0,8 × 2,2 preso ao braço 0 do `hub`, girando com ele e tremulando; de longe parece uma pessoa pendurada que passa pelo alto. (só visual)
  8. **Superfície do lago mais escura e oleosa**: o material do lago passa de #1f3a48 para #14262e com especular #b0b8c0 (brilho de óleo) e uma mancha negra ainda mais densa no centro (disco 0,3 × do raio, cor #050a0c). (só visual)
- **Momento de assinatura: "alguém saiu da água".** Gatilho: jogador a menos de 8 m da margem, parado há 5 s, sem zumbi a menos de 12 m. Um par de pegadas molhadas de pé descalço aparece na beira d'água no ponto mais próximo do jogador e, a cada 0,6 s, surge mais um passo na direção dele (decal escuro e brilhante); a trilha **para a 3 m do jogador**, com os dois pés juntos, como alguém parado olhando. Ao mesmo tempo, a linha de pesca da direita afrouxa. Fica assim 1,5 s, e as pegadas secam (opacidade a 0) em 6 s, de trás para frente. No máximo uma vez a cada 2 rodadas por jogador. Seguro: decal no chão, sem colisão, sem som alto, sem tirar controle; só no cliente.
- **Animações ambientais (4):** cadeira balançando devagar (rotação de ±4° em 3,2 s) como se alguém estivesse sentado; anéis na água sem causa (3 toros planos que crescem de 0,1 a 1,4 m e somem em 2,5 s, a cada 6–14 s em pontos sorteados com semente); linha de pesca vibrando (deslocamento de 1 cm em alta frequência com rajadas); pano preto do moinho tremulando.
- **Luz e cor:** paleta #14262e (água), #86775a (margem), #c8c0a8 (lençol), #9aa8b0 (reflexo frio). Nenhuma `PointLight` nova; o poste existente (1; 29) ganha cor um pouco mais fria (#d8dcd0). Ao entrar: névoa 8% mais densa e puxada para azul-cinza (#46505a), granulação do `gradePass` um pouco maior perto da água.
- **Som ambiente:** (1) água batendo na margem: ruído rosa em passa-baixa 400 Hz com envelopes curtos (0,3 s) a cada 1,5–3 s; (2) a cada 10–20 s, o rangido da cadeira (ruído em passa-banda 1,1 kHz com 2 pulsos de 0,12 s) **sincronizado** com a balançada mais funda, e, raramente, um "plop" de algo pesado entrando na água (seno 180 Hz → 60 Hz em 0,2 s) sem nada visível.
- **Escalada:** primeira vez que algo **age** perto do jogador sem ser visto; ainda sem ameaça, só a certeza de companhia. O Veio, que na Praça era um anel de lodo, aqui é o lago inteiro.
- **Implementação:** bbox x −34,5 a 34,5, z 10,5 a 49,5. Evitar Bowie (6; 24), Semtex (0; 35,45), Stamin-Up (−6; 26), Deadshot (−16; 26), Dying Wish (−13; 31,05), Caixa (18; 41), janelas (±10; 50,5), armadilha AE (0; 14) e o moinho (−14; 34, raio 2,5). A cadeira fica a 1,1 m da água e a 3 m do poste. ~16 malhas + 3 `InstancedMesh` (garrafas 8, pegadas 12, anéis 3). Pegadas e anéis são pool fixo criado no build; nada alocado por quadro.

#### Fazenda (C) · ordem 1 · algo que se move quando não observado
- **Conceito:** o Sítio dos Morais, família 118: o pai dormiu no meio da colheita depois de beber da cisterna, a mulher e os filhos foram levados pela ambulância, e o espantalho que o pai vestiu com o próprio macacão continua cuidando da roça.
- **Como o terror aparece aqui:** quase tudo está parado, mas não no mesmo lugar de antes: o espantalho, o forcado, a corrente do cachorro. Nada se mexe enquanto o jogador olha.
- **Props únicos (8):**
  1. **Espantalho com o macacão azul do Seu Morais e "118" costurado no peito**, cabeça de saco de estopa amarrada com barbante, chapéu de couro de vaqueiro furado, braços em cruz numa estaca. Em (29; 21,5) na roça sul. Grupo de 6 caixas/cilindros + canvas do saco com dois rasgos no lugar dos olhos. (só visual: a roça já é atravessável)
  2. **Arado de ferro ainda engatado no trator** existente (34; 15), atrás dele em (34; 17,6), parado no meio de um sulco interrompido (decal de terra revolvida que termina de repente). (só visual)
  3. **Latões de leite de folha** enfileirados ao lado da abertura do celeiro, em (28,7; 4,2), (28,7; 5,0) e (28,9; 5,8), fora do vão da porta (z −3 a 3): 3 cilindros com ombro; um sem tampa, cheio até a boca da água preta da cisterna (o pai encheu os latões com ela no lugar do leite), com um fio escuro escorrendo pela lateral (plano de escorrido) até o chão. (só visual)
  4. **Corrente de cachorro sem cachorro**: estaca em (27; −24) com coleira de couro vazia na ponta e 4 m de corrente (`InstancedMesh` de elos, 30 toros finos) **esticada** para dentro da roça norte, até (31; −21), como se algo puxasse. (só visual)
  5. **Forcado de três dentes que troca de lugar**: o mesmo forcado, em uma de três posições pré-definidas: encostado na parede norte do celeiro por fora (40,5; −7,5), cravado no fardo de feno (26; 20) ou apoiado no trator (35; 13). (só visual)
  6. **Galinheiro de tela vazio** em (46; −22): armação de ripas 2,4 × 1,6 × 1,1, tela em alfa, chão coberto de penas (30 planos pequenos instanciados) e 5 ovos acinzentados no ninho. (só visual)
  7. **Espigas cinzentas no milharal**: 20% das instâncias da plantação existente ganham cor #8a8a80 (a febre cinza nas plantas), agrupadas em manchas perto do espantalho. Só troca `setColorAt`. (só visual)
  8. **Etiqueta de papel "118" pregada no batente do celeiro** (30; y 2,6; −3,4), amarelada, com um prego torto. (só visual)
- **Momento de assinatura: "o espantalho chegou mais perto".** O espantalho tem 4 posições ao longo da fileira: (29; 21,5) → (28; 19,8) → (27; 18) → (26,5; 16,6), sempre de frente para onde o jogador estava. Gatilho: o espantalho fica fora do campo de visão (ângulo > 70° da direção da câmera) por pelo menos 4 s com o jogador a menos de 30 m; ao voltar o olhar, ele está uma posição adiante e virado para o jogador. Regras: nunca muda enquanto está dentro do cone de 70°, nunca chega a menos de 6 m do jogador (se chegaria, não avança), no máximo 3 passos por rodada; no começo de cada rodada volta para a posição 0. O forcado usa a mesma regra (troca de lugar quando ninguém vê por 8 s), e a corrente afrouxa e volta a esticar. Seguro: só visual, sem colisão, nenhuma posição fica sobre o Speed Cola (22; 12), riser (26; 13) ou caminho dos portões; cada jogador vê o seu espantalho.
- **Animações ambientais (3):** milharal balançando (rotação ±3° por seno com fase por x, aplicada a cada 3 quadros nas instâncias visíveis); manga vazia do macacão do espantalho balançando com o vento; porta lateral do celeiro (plano novo na face leste) rangendo 10° para dentro e para fora a cada 8–15 s.
- **Luz e cor:** paleta #6a5536 (terra), #7d3b2b (celeiro), #8a8a80 (milho cinza), #3a5a8a (macacão). Nenhuma `PointLight` nova: usa a lâmpada do celeiro (36; 0) e o poste (26; −14). Ao entrar: luz do fim de tarde um pouco mais amarela (+0,03 no vermelho/verde das altas no `gradePass`) e névoa 5% mais densa.
- **Som ambiente:** (1) vento no milharal: ruído rosa em passa-banda 900 Hz com Q 0,5 e LFO de 0,15 Hz no ganho e na frequência (farfalhar); (2) rangido da porta do celeiro: oscilador dente-de-serra 90 Hz com FM lenta (3 Hz, índice alto) e passa-banda 600 Hz, 0,8 s, a cada 8–15 s. Quando o espantalho avança, não há som nenhum.
- **Escalada:** depois da Igreja (memória) e do Lago (presença), aqui a presença **tem corpo** e muda de lugar; ainda com regras que impedem o confronto.
- **Implementação:** bbox x 10,5 a 49,5, z −34,5 a 34,5. Evitar AK-74u (24; −7), Stakeout (36; −6,65), Speed Cola (22; 12), Mule Kick (24; −16), Widow's Wine (49,55; 4,5), Caixa (37; 6,2), janelas (50,5; ±14), o vão do celeiro e as portas AC/BC/CG. ~20 malhas + 3 `InstancedMesh` (elos 30, penas 30, ovos 5). As posições do espantalho e do forcado são listas fixas no código (deterministas), escolhidas só no cliente.

#### Cemitério (D) · ordem 1 · som fora do lugar
- **Conceito:** o Cemitério de São Lázaro, onde o coveiro Tião enterrou 31 pessoas em agosto de 1958 e passou a ouvir, de noite, os mortos da febre cinza "ainda não acabados" debaixo da terra.
- **Como o terror aparece aqui:** pelo ouvido: os sons não saem de onde deveriam. O fole do harmônio do enterro respira sem tocar, o sininho de cova balança sem tinir, e o hino vem de debaixo do chão.
- **Props únicos (8):**
  1. **Cova aberta coberta por tábuas soltas** em (−19; −17), 2,2 × 1,1: plano preto a y 0,01 sob 5 tábuas desalinhadas (caixas finas), com o monte de terra ao lado (caixa achatada com bump de `dirt`) e o paletó do coveiro jogado em cima. (só visual; tábuas a 0,04 m)
  2. **Cruz provisória de tábua na cabeceira da cova**, em (−17,6; −17): nome riscado a faca e, entalhado a canivete por baixo, "ainda não acabou". Canvas 64×128. (só visual)
  3. **Harmônio portátil de enterro (órgão de fole) dentro do mausoléu**, em (−38,5; −3,8): caixa de madeira escura com o teclado aberto e o fole de pano entre os pedais. A 3,8 m do Double Tap (−39,15; 0). (só visual)
  4. **Sininho de segurança de cova**: haste de ferro em (−22,6; 15,3) com um sino de 8 cm na ponta e um cordão descendo até dentro da terra da sepultura ao lado. (só visual)
  5. **Cruzes de ferro fundido da prefeitura**: as 4 sepulturas da fileira x = −36 ganham cruzes iguais e novas, com a mesma plaquinha "VÍTIMA DA FEBRE — AGOSTO DE 1958 — PREFEITURA DE S. LÁZARO", sem nome. (só visual; troca de material e um topo de ferro sobre as lápides existentes)
  6. **Moringas de barro para os mortos** ao pé de 6 sepulturas (costume da vila: água fresca para quem foi), cada uma tampada com um caneco de lata; numa delas o caneco está caído ao lado e a água ficou preta. (só visual)
  7. **Montes de terra rachados de dentro para fora**: 3 dos montinhos existentes (os de z > 0) trocam de geometria por uma versão abaulada com rachaduras escuras radiais (canvas no topo) e torrões soltos (6 dodecaedros pequenos). (só visual)
  8. **Lista do coveiro pregada na porta da casa** (−34; y 1,5; −20,95), de frente para +z: papel pautado com tracinhos de contagem "agosto: 31" e uma coluna "exumados" vazia. Longe do Timeslip (−30,05; −22,5) e do lado oposto da porta. (só visual)
- **Momento de assinatura: "a música está embaixo".** Gatilho: jogador a menos de 4 m da cova aberta, parado há 3 s. Ouvem-se 6 s de um hino fúnebre de harmônio, posicionado no centro da cova e abafado como se viesse de debaixo de terra (passa-baixa 500 Hz), enquanto o fole do harmônio, a 20 m dali, enche e esvazia mudo no mesmo compasso. Ao terminar, o sininho de segurança balança uma vez, sem som. No máximo uma vez por rodada por jogador. Seguro: só som posicional local e uma animação; não usa os sons de zumbi (para não confundir a leitura de ameaça), volume baixo.
- **Animações ambientais (3):** fole do harmônio enchendo e esvaziando devagar (escala em y de 0,9 a 1,1, 4 s) em silêncio; sininho de segurança tremendo ±6° com o cordão esticando de vez em quando (a cada 15–30 s), sem som; terra solta escorrendo dos montes rachados (2 torrões deslizam 3 cm e voltam à posição quando fora da vista).
- **Luz e cor:** paleta #2a3020 (grama escura), #8b8b86 (lápide), #9a70ff (lâmpada do mausoléu, já existente), #8a5a3a (barro das moringas). Nenhuma `PointLight` nova. Ao entrar: névoa 10% mais densa e mais baixa, `gradePass` com tom frio nas sombras e um pouco mais de contraste.
- **Som ambiente:** (1) silêncio quase total: só grilos espaçados (seno 4,2 kHz em trens de 3 pulsos a cada 2–5 s), que **param** quando o jogador está a menos de 6 m da cova; (2) sopro de fole vindo do lado errado: ruído branco em passa-banda 1,5 kHz em sopros lentos de 2 s, posicionado na cova e não no mausoléu. O hino da assinatura: 3 osciladores de onda quadrada filtrada (timbre de palheta) em acordes lentos de uma melodia original simples, passa-baixa 500 Hz.
- **Escalada:** último degrau da inquietação leve: aqui pela primeira vez o jogo sugere que os mortos estão **acordados** (o hino que vem de baixo), mas sem mostrar nada. Prepara o anel do meio.
- **Implementação:** bbox x −49,5 a −10,5, z −34,5 a 34,5. Evitar MP5K (−22; 5), Double Tap (−39,15; 0), PhD (−26; 7), Timeslip (−30,05; −22,5), Caixa (−40,5; −12), janelas (−50,5; ±14), a entrada do mausoléu (x −31, z −2 a 2) e a estrada de terra em z ≈ 0. A cova fica longe dos risers (−20; −8) e (−40; −20). ~22 malhas + 2 `InstancedMesh` (torrões 18, moringas 6). Os sons só são criados quando a câmera está a menos de 25 m da cova.

#### Pedreira (F) · ordem 2 · isolamento
- **Conceito:** a Pedreira do Alto, onde a turma de cavouqueiros ficou do lado de dentro quando o Exército fechou com arame a boca da galeria que desce até a Mina (e o Veio): sem estrada, sem notícia, sem almoço, eles contaram os dias em pedra até ninguém mais contar.
- **Como o terror aparece aqui:** pelo vazio e pelo corte: a corneta de aviso que ninguém sopra, as cartas que ninguém levou, os bornais fechados e os marcos de dia. A área é grande, aberta e silenciosa demais; o mundo de fora parece longe.
- **Props únicos (8):**
  1. **Mastro de sinal de detonação**, em (38; −75): mastro de 4 m com a bandeira vermelha de "FOGO" arriada e amarrada, e uma corneta de chifre de boi pendurada por uma tira de couro, batendo no mastro. (só visual)
  2. **Bornais de lona fechados** pendurados em 9 pregos de uma tábua apoiada em duas pedras, em (32; −55): o almoço da turma, com o pão endurecido aparecendo pela boca e o nome de cada um a carvão na lona (`InstancedMesh`). Nunca abertos. (só visual)
  3. **Lata de biscoito com as cartas da turma** sobre um caixote, em (34; −56,5): tampa aberta, um maço de cartas para as famílias, endereçadas, seladas e amarradas com barbante, que nunca saíram do vale. Caixa + planos de papel. (só visual)
  4. **Carroça de burro parada com a carga de pedra pela metade**, em (25; −78): rodas de raio, varais no chão e os arreios vazios largados à frente, como se o animal tivesse sido desatrelado no meio do serviço. A 8,7 m da janela (18; −86,5), sem cruzar a frente dela. (só visual)
  5. **Arame farpado novo do Exército fechando a boca da mina** existente (grupo em (59,6; −59,6)): 4 fios em zigue-zague diante do plano preto (cilindros finos + farpas em `InstancedMesh`) e uma placa esmaltada "INTERDITADO — MINISTÉRIO DA GUERRA". Não encosta no gerador (52; −62) nem no botão de energia (52; −61,15). (só visual)
  6. **Marcos de pedra empilhada contando os dias de cerco**: 23 montinhos de 3 a 4 pedras (dodecaedros 0,12–0,2 m) em fila junto à sebe, de (2,5; −52) a (2,5; −62), parando antes da porta IF (0; −68); o último montinho está desmoronado. (só visual)
  7. **Cavalete com os paletós de brim da turma** pendurados em pregos, em (20; −68): 8 pregos, 7 paletós (planos curvados), um prego vazio. (só visual)
  8. **Lona de dormir esticada numa rocha** existente (38; −62) com sacos de dormir de lona e um fogareiro de álcool apagado: o acampamento improvisado da turma. (só visual)
- **Momento de assinatura: "o vale fecha".** Gatilho: jogador na Pedreira, parado há 5 s, sem outro jogador a menos de 25 m e sem zumbi a menos de 20 m (o cliente já conhece as posições). Em 4 s, o `far` da névoa desce até 60 m (nunca menos), o som de tudo que está fora da Pedreira passa por um passa-baixa que desce de 20 kHz a 600 Hz, e o único som nítido que fica é a respiração do próprio jogador (ruído filtrado em 2 fases) e a corneta de chifre batendo no mastro. Ao mexer o jogador, tudo volta em 1,5 s. Se outro jogador chegar perto, volta na hora. Seguro: só no cliente, visibilidade mínima de 60 m e cancelamento por qualquer ameaça.
- **Animações ambientais (3):** bandeira arriada estalando presa ao mastro (vértices de plano por seno, em rajadas); corneta de chifre girando na tira e batendo no mastro (pulso a cada 6–12 s); poeira de pedra fina subindo em redemoinho rasteiro (12 sprites cinza claro, 0,5 m de altura, percorrendo um círculo de 3 m) que aparece a cada 20–40 s em pontos fixos.
- **Luz e cor:** paleta #a09888 (cascalho), #5a6048 (gerador), #9a3a2a (bandeira de fogo), #c8ccd0 (névoa clara). Nenhuma `PointLight` nova: usa o poste (47; −60). Ao entrar: névoa mais clara e esbranquiçada (#7a7a78), dessaturação de 20%, céu "lavado": é a primeira área que tira cor.
- **Som ambiente:** (1) vento alto em paredão: ruído rosa em passa-banda 250 Hz com Q 2, ganho por LFO de 0,07 Hz (rajadas longas); (2) a corneta de chifre soprada pelo vento: a cada 20–35 s, quando a rajada passa pela boca dela, um gemido fraco (seno 220 Hz com ruído em passa-banda 400 Hz, 1,5 s) que nunca chega a ser um toque.
- **Escalada:** primeiro anel de fora: sai o cotidiano interrompido e entra a **quarentena** (Exército, arame, cartas que não saem). O jogador também fica sozinho de verdade: a área é larga e a assinatura separa ele do grupo.
- **Implementação:** bbox x 0,5 a 85,5, z −85,5 a −0,5 (só a parte com o > 50). Evitar Dragunov (66; −24), Caixa (62; −40), gerador e energia (52; −62), vagoneta (55; −55), trilho de (59,6; −59,6) a (45; −45), janelas (18; −86,5) e (86,5; −18), portas BF (28,3; −43,1), IF (0; −68), FG (68; 0). ~26 malhas + 4 `InstancedMesh` (bornais 9, farpas 60, pedras dos marcos 80, paletós 7). Tudo com `cullAdd` pelo centro (40; −60).

#### Acampamento (H) · ordem 2 · infância corrompida
- **Conceito:** a colônia de férias da paróquia, onde a Patrulha Lobo (oito meninos da vila) acampava quando o Programa mandou buscar "as crianças primeiro, para a vacina"; as mochilas ficaram enfileiradas esperando a ambulância, e a fogueira nunca apagou.
- **Como o terror aparece aqui:** pela brincadeira congelada e pelo que as crianças desenharam: o jogo de gude, os bonequinhos de barro virados para o fogo, os desenhos de carvão do homem de jaleco e da fila. A inocência foi organizada em fila.
- **Props únicos (8):**
  1. **Mochilas de lona da Patrulha Lobo enfileiradas**, prontas para a viagem: 8 mochilas pequenas (caixa arredondada + aba) em fila de (−36; 50) a (−36; 55), cada uma com uma etiqueta de papel amarrada na alça com o número da família do menino (os oito moravam na Rua de Cima: 401 a 408). (só visual)
  2. **Bonequinhos de barro do rio em volta da fogueira**, como plateia: 6 figurinhas de 0,25 m moldadas pelas crianças (cilindro + esfera, olhos de pedrinha), em pé sobre tocos num círculo de 3,3 m em volta de (−50; 48), entre os troncos existentes, todas viradas para o fogo. (só visual)
  3. **Desenhos de carvão na lona da barraca** (−40; 66), na face voltada para a fogueira: canvas com bonecos de palito de mãos dadas, um homem alto de jaleco de braços abertos e uma fila de crianças numeradas saindo da lona. Textura aplicada num plano colado à água do telhado. (só visual)
  4. **Flâmula triangular "PATRULHA LOBO"** em mastro de bambu, em (−54; 52): feltro verde com um lobo bordado e oito tracinhos riscados com giz. (só visual)
  5. **Varal de lenços de escoteiro** entre as árvores (−56; 26) e (−62; 16), corda a y 2,4: 8 lenços triangulares (vermelho e amarelo) presos por pregadores, cada um com um número bordado. (só visual; a parte mais baixa fica a 1,9 m)
  6. **Roda de bolinhas de gude** riscada na terra em (−58; 60): círculo de 1 m (decal), 12 bolinhas de vidro coloridas e, no centro, uma bolinha preta opaca (o Veio dentro do vidro). (só visual)
  7. **Apito de escoteiro de latão pendurado por um cordão** na perna da torre de vigia (−66; 30), y 1,5, girando no cordão. (só visual)
  8. **Fogueira que ninguém alimenta**: a existente ganha uma pilha de lenha cortada e arrumada a 1,5 m (8 cilindros, `InstancedMesh`) que **nunca diminui**, e um caldeirinho de lata tombado com feijão queimado no fundo. (só visual; a pilha fica a 0,5 m de altura e longe dos troncos-banco)
- **Momento de assinatura: "a fila na lona".** Gatilho: jogador a menos de 4 m da fogueira, olhando para ela (menos de 25° de desvio), parado há 4 s. Na face da barraca mais próxima da fogueira ((−50; 58) ou (−60; 46)), as **sombras de 8 meninos** (sprites escuros em alfa, colados na lona) entram uma a uma em fila indiana pela esquerda, atravessam a lona devagar em 6 s e saem pela direita, na direção da estrada; o último para na beira da lona e vira a cabeça para o fogo antes de sumir. Enquanto passam, os 6 bonequinhos de barro se inclinam 10° na direção da estrada. Não há música: só três apitos curtos de escoteiro, ao longe, quando o último sai. Some em 1,5 s. No máximo uma vez por rodada por jogador. Seguro: tudo nas lonas, sem colisão, sem esconder o fogo (que é lâmpada de jogo); só no cliente.
- **Animações ambientais (3):** chamas da fogueira (já existe) + fagulhas subindo (8 sprites pequenos em loop); lenços do varal ondulando (vértices de plano deslocados por seno, 4 segmentos); apito girando no cordão e batendo de leve na perna da torre.
- **Luz e cor:** paleta #ff8a30 (fogo), #6f7448 (lona), #b02a2a (lenço), #20160e (carvão). A única luz real é a da fogueira, que já está no pool (sempre acesa); sem `PointLight` nova. As sombras da assinatura são sprites. Ao entrar: tom mais quente e escuro em volta do fogo, vinheta um pouco mais forte, névoa marrom (#4a3a30).
- **Som ambiente:** (1) estalo de lenha: impulsos de ruído em passa-alta 2 kHz (40 ms) a cada 0,3–1,5 s, com uma base de ruído rosa em passa-baixa 200 Hz (crepitar); (2) uma vez por rodada, de longe e de direção sorteada com semente, **três apitos curtos** de escoteiro (seno 2,8 kHz com vibrato de 30 Hz, 0,2 s cada).
- **Escalada:** a vila deixa de ser só triste: aqui fica claro que o Programa levou **crianças** e que elas sabiam o que vinha (os desenhos). É o primeiro tema que se liga diretamente ao Anexo do asilo do Sanatório.
- **Implementação:** bbox x −85,5 a −0,5, z 0,5 a 85,5 (parte com o > 50). Evitar SPAS (−58; 34), Caixa (−40; 58), fogueira e troncos (−50; 48), barracas (−50; 58), (−60; 46), (−40; 66), torre (−66; 30), janelas (−18; 86,5) e (−86,5; 18), portas EH (−28,3; 43,1), GH (0; 68), HI (−68; 0); as mochilas ficam a 9,9 m da porta EH e a 4,2 m da Caixa. ~24 malhas + 4 `InstancedMesh` (mochilas 8, bolinhas 13, lenha 8, fagulhas 8) e 8 sprites de sombra. As sombras usam um único material compartilhado com opacidade animada.

#### Estação (G) · ordem 2 · loop/repetição
- **Conceito:** a Estação de São Lázaro na tarde em que o último trem das 17h12 para a Capital foi cancelado pelo Exército; as famílias com passagem comprada esperaram, voltaram no dia seguinte para o mesmo trem e continuaram voltando, até o Programa vir buscá-las na plataforma.
- **Como o terror aparece aqui:** pela repetição exata: o relógio volta para 17h12, o quadro de partidas lista o mesmo trem oito vezes, há três jornais idênticos, e o mesmo passageiro está sentado no mesmo banco em todos os vagões.
- **Props únicos (8):**
  1. **Relógio de plataforma de dupla face** num braço de ferro preso à fachada, em (53,5; y 3,2; 36,5): caixa redonda com mostrador emissivo fraco (canvas), ponteiros em caixas finas. (só visual)
  2. **Quadro-negro "PARTIDAS"** na parede oeste do prédio (x 52,95; z 40; y 1,2–2,2), de frente para −x: "17:12 — São Lázaro → Capital — CANCELADO" escrito 8 vezes, em 8 letras diferentes, com datas seguidas de 14 a 21 de agosto. Canvas 256×192. (só visual)
  3. **Malas de couro empilhadas com etiquetas de bagagem** atrás do prédio, do lado dos trilhos, em (55; 45,5): 6 malas (caixas com cantos de latão), cada uma com a mesma etiqueta "PASSAGEM Nº 0412". (só visual; 1,1 m de altura)
  4. **Bancos de ripas verde-ferrovia** (2) em (50; 34) e (46; 40), com **o mesmo jornal "O VALE — 14 de agosto de 1958"** dobrado do mesmo jeito em cada um e um terceiro no chão entre eles. (só visual)
  5. **Passageiro de chapéu na janela de cada vagão**: silhueta (plano em alfa, cabeça e ombros com chapéu) na mesma janela acesa (k = 1, mesmo lado) dos 3 vagões existentes, idêntica e na mesma pose. (só visual)
  6. **Braço de sinal ferroviário (semáforo)** em mastro de 5 m em (73,5; 41,5), ao lado do trilho além do último vagão: braço vermelho e branco que sobe e desce, lente verde/vermelha emissiva. (só visual)
  7. **Bilhetes de papelão espalhados** diante da porta (círculo de 2 m em (56; 35,2)): 20 planos pequenos (`InstancedMesh`) com o mesmo número de série "0412" (canvas). Não cobre o Galil (58; 36,95). (só visual)
  8. **Carrinho de bagagem de ferro** em (49; 44): plataforma com 2 rodas e alça, com um baú amarrado. (só visual)
- **Momento de assinatura: "17h12 de novo".** O ponteiro dos minutos anda de verdade: a cada 60 s de jogo vai de 12 para 13. Quando chega a 17h13 e há jogador a menos de 20 m, ele **volta para 17h12** com um estalo seco, e no mesmo instante as janelas acesas dos 3 vagões apagam e acendem em sequência, da frente para trás (0,15 s por vagão), como um trem partindo, sem nada se mover; de longe toca o mesmo apito de trem, sempre idêntico. Se o jogador estiver olhando para o relógio (menos de 10° de desvio) nesse momento, o passageiro de chapéu do vagão do meio já não está lá quando as luzes voltam e reaparece no ciclo seguinte. Dura 2 s, a cada minuto. Seguro: só emissivos e som; nada bloqueia; o tempo de cada jogador é o dele (cliente).
- **Animações ambientais (3):** braço do semáforo subindo e descendo num ciclo fixo de 18 s (sempre igual); um bilhete que rola pelo chão na mesma trajetória de 4 m e "reaparece" no começo (fade de 0,3 s) a cada 12 s; a placa esmaltada "S. LÁZARO" pendurada sob o beiral balançando ±5° e voltando, sempre igual.
- **Luz e cor:** paleta #e8dcb0 (placa), #ffc080 (janelas do trem), #2f4a38 (verde ferrovia), #6a2a24 (vagão). Nenhuma `PointLight` nova: usa o poste (58; 33); relógio, lente do sinal e janelas são emissivos. Ao entrar: `gradePass` com leve tom sépia (+0,02 vermelho e −0,02 azul nas altas) e granulação maior, como foto antiga.
- **Som ambiente:** (1) tique-taque do relógio (impulso de ruído em passa-banda 3 kHz, 15 ms, a cada 1 s) audível a menos de 15 m; (2) o apito do trem: dois senos (440 + 554 Hz) com envelope de 1,6 s e eco de 0,5 s, **sempre o mesmo**, junto com o retrocesso do ponteiro.
- **Escalada:** pela primeira vez a vila parece **presa num instante**: não é só abandono, é algo que se repete. Antecipa a Fábrica (repetição de linha de produção) e o Refeitório do Sanatório.
- **Implementação:** bbox x 0,5 a 85,5, z 0,5 a 85,5 (parte com o > 50). Evitar Galil (58; 36,95), Caixa (36; 50), prédio (53–63; 37–43), trilho diagonal e vagões (de (44,5; 67,5) a (67,1; 44,9)), janelas (86,5; 18) e (18; 86,5), portas CG (43,1; 28,3), FG (68; 0), GH (0; 68). As malas ficam a 8,5 m do eixo do trilho. ~22 malhas + 2 `InstancedMesh` (bilhetes 20, ripas dos bancos) e 3 planos de silhueta. O controle das janelas usa as malhas de janela que já existem (guardar a referência no build).

#### Castelo (I) · ordem 2 · vigilância
- **Conceito:** o Forte Velho, que o Exército ocupou como posto de observação da quarentena: dali o tenente vigiava a vila com holofote e luneta, fotografava cada morador e marcava no mapa as casas da lista do Programa.
- **Como o terror aparece aqui:** por ser olhado: o holofote varre o chão, a luneta aponta para a Praça, a câmera de fole está apontada para o portão, e o muro está coberto de fotos 3x4 com números. O jogador sente que entrou na ficha de alguém.
- **Props únicos (8):**
  1. **Holofote militar** no alto da torre (−38; −38), y 8,5: tambor (cilindro 0,7 m) em garfo, com feixe falso: cone aditivo longo, opacidade 0,06, e um disco de luz aditivo no chão onde o feixe toca. (só visual)
  2. **Mesa de campanha com o mapa da vila cheio de alfinetes** em (−55; −42): mesa dobrável, mapa desenhado em canvas (octógono da vila, casas numeradas) com 40 alfinetes de cabeça colorida (`InstancedMesh`), vermelhos nas casas já levadas; uma lista "PROGRAMA — famílias 101 a 140" com tiques a lápis. (só visual)
  3. **Cofre de campanha aberto** sobre a mesa, com as cadernetas de identidade recolhidas dos moradores, amarradas em maços de barbante, cada maço com o número da família a lápis. (só visual)
  4. **Fotos 3x4 de moradores pregadas no muro interno** (face x = −57,4, de frente para +x), de z −55 a −44, y 1,4–2,4: 36 fotos (planos 0,12 × 0,16, `InstancedMesh` com atlas de canvas de 6 rostos genéricos em sépia) cada uma com um número embaixo. Longe do Pack-a-Punch (−48; −52). (só visual)
  5. **Câmera de fole em tripé** em (−41; −53), apontada para a entrada do muro leste, com uma pilha de chapas de vidro numa caixa ao lado. Fora da linha da entrada (x −38, z −50 a −46). (só visual)
  6. **Luneta de latão no alto da torre** (−58; −58), y 8,5, apontada para o chafariz da Praça. (só visual)
  7. **Placa esmaltada "ÁREA MILITAR — PROIBIDO FOTOGRAFAR"** fora do muro, em (−52,5; −36,4), de frente para +z, num poste de ferro. Ironia: lá dentro só há fotos. (só visual)
  8. **Estandarte da companhia** (o estandarte vermelho existente em (−48; −37,35)) com o número "3ª Cia — 14º BC" em canvas e um ilhó solto, para tremular. (só visual)
- **Momento de assinatura: "o holofote te achou".** O feixe varre o pátio e os arredores do castelo num padrão fixo (elipse lenta, 24 s por volta). Gatilho: o disco de luz do feixe passa a menos de 2 m do jogador, que está na área do Castelo e fora do pátio do Pack-a-Punch (para não atrapalhar a compra). O feixe **para e passa a acompanhar o jogador** por 2,5 s (o disco segue os pés dele, suave, sem cegar), ouve-se um clique metálico vindo da torre e, ao mesmo tempo, o obturador da câmera de fole (som), e então o feixe retoma a varredura de onde parou. No máximo uma vez por rodada por jogador. Seguro: feixe com opacidade baixa (0,06 no cone, 0,15 no disco), não muda a névoa nem o grade, não segue quem estiver usando o PaP; só no cliente.
- **Animações ambientais (3):** holofote varrendo (rotação do tambor e do cone, disco no chão acompanhando); estandarte tremulando (vértices de plano por seno, 6 segmentos); fotos 3x4 tremulando no muro quando o vento sobe (inclinação de ±4° em ondas que percorrem o muro).
- **Luz e cor:** paleta #6a655c (pátio), #d8e0ff (feixe frio), #7a1a1a (estandarte), #c0a070 (sépia das fotos). Nenhuma `PointLight` nova: o feixe é aditivo; o poste âmbar existente (−44; −44) fica. Ao entrar: `gradePass` mais frio e mais contrastado (sc +0,05), névoa azulada (#3e4252): é a primeira área com luz "oficial", artificial.
- **Som ambiente:** (1) zumbido do holofote: seno 120 Hz + 240 Hz com ganho baixo e leve variação de fase, posicionado na torre; (2) rádio de campanha distante: ruído em passa-banda 1,5 kHz picotado em sílabas (envelope em portas de 80–200 ms) a cada 15–30 s, como alguém lendo números, sem palavras inteligíveis.
- **Escalada:** fecha o anel do meio: depois do isolamento, da infância e da repetição, aqui há **alguém responsável** e organizado por trás de tudo (o Exército com a lista do Programa). É a ponte para o Hospital de campanha e a Base militar.
- **Implementação:** bbox x −85,5 a −0,5, z −85,5 a −0,5 (parte com o > 50). Evitar Pack-a-Punch (−48; −52), FAL (−28; −64), Caixa (−66; −24), as duas entradas do pátio (z −38 com x −50 a −46; x −38 com z −50 a −46), torres (cantos de (−58/−38; −58/−38), raio 2,4), janelas (−86,5; −18) e (−18; −86,5), portas DI (−43,1; −28,3), IF (0; −68), HI (−68; 0). ~20 malhas + 3 `InstancedMesh` (alfinetes 40, fotos 36, maços de cadernetas 12). O cone do feixe é uma única malha com `depthWrite: false`; o disco é um plano a y 0,02 reposicionado por quadro (sem alocar).

#### Mina (J) · ordem 3 · claustrofobia
- **Conceito:** foi aqui que a Galeria 7 se abriu em 14/03/1956 e o Veio jorrou. O turno da tarde (47 homens) nunca subiu; só um voltou à superfície, o dono da chapa 17. A boca foi lacrada às pressas com tábuas e cal, mas a água preta continua escorrendo pela boca, entre os dormentes, até a entrada da área.
- **Como o terror aparece aqui:** a área é aberta, mas tudo a fecha: a névoa encurta, a teia de cabos do guincho forma um teto baixo de aço, e o quadro de presença deixa claro que 47 homens ainda estão "lá dentro". Perto da boca o ar fica parado e a vinheta aperta; a mina parece respirar.
- **Props únicos:**
  1. **Quadro de chapas de presença (lampisteria):** painel de madeira 2,4 × 1,4 m com 48 ganchos; 47 chapas de latão com números gravados (001 a 048) continuam penduradas (todos os que entraram e não saíram) e o gancho 17 está vazio, com o prego torto: é o único que subiu. Plano com textura de canvas (madeira, números a punção) + `InstancedMesh` de 47 discos (`CylinderGeometry` r 0,06, h 0,012, metal). Preso na face oeste do paredão de pedra (colisor existente). (só visual)
  2. **Lacre da Galeria 7:** cinco tábuas pregadas em X sobre a boca (o plano preto 3 × 3,4 m que já existe), com cal escorrida e o estêncil "GALERIA 7 — INTERDITADA — D.N.P.M. 03/56". Duas tábuas estão estufadas para fora, com as lascas apontando para o jogador (forçadas por dentro). Caixas finas juntadas com `mergeGeos` + textura de canvas. Fica rente à rocha, dentro da largura da boca (u 31,6 a 34,4). (só visual)
  3. **Filete do Veio nos dormentes:** uma fita de água preta e brilhante saindo da boca, correndo entre os trilhos por 36 m e abrindo uma poça de 3 × 2 m logo depois da entrada. `ShapeGeometry` sinuosa a y 0,03, `MeshPhongMaterial` 0x07090b, shininess 140, com mapa de faixas cujo `offset` desliza (escorre na direção da entrada). (só visual)
  4. **Garrafões empalhados do turno:** 9 garrafões de vidro com capa de palha (a água que o turno levava), enfileirados ao lado do trilho, destampados e cheios do Veio até o gargalo. `InstancedMesh` de cilindro + gargalo + disco preto brilhante na boca. Altura 0,45 m. (só visual)
  5. **Teia de cabos do guincho:** seis cabos de aço saindo da roda da torre do poço (9,6 m) até o topo dos paredões, e deles 7 lanternas de carbureto apagadas penduradas por arame entre 3,3 e 4,2 m de altura. Cria um "teto" sobre o caminho. Cilindros finos (r 0,03) juntados + `InstancedMesh` de 7 lanternas. Tudo acima de 3,2 m. (só visual)
  6. **Caixote de dinamite aberto:** caixote "EXPLOSIVOS — G7 — NÃO FUMAR" sobre a pedra baixa existente, tampa caída, 12 bananas de dinamite inchadas e encharcadas de preto, os pavios cortados a faca (ninguém quis explodir a galeria com gente dentro). Caixa + `InstancedMesh` de cilindros. (só visual, sobre colisor existente)
  7. **Chamada a fuligem de carbureto:** na face do paredão à direita da boca, de 1,2 a 2,8 m de altura, os 48 números das chapas escritos com a chama do carbureto em colunas, 47 com um tique e o 17 sem; embaixo, na mesma mão, "*ainda não acabou*". Plano com textura de canvas, `polygonOffset`. (só visual)
  8. **Vagoneta de botas:** a vagoneta de cima (v 124) deixa de levar pedra e passa a levar ~30 botas de borracha de mineiro, todas do pé esquerdo, com o número da chapa a giz no cano. `InstancedMesh` (caixa + cilindro) dentro do colisor que já existe. (só visual)
  9. **Vagoneta do Veio:** a de baixo (v 112) é cheia até a borda de água preta parada (plano Phong preto no lugar das pedras), com uma lancheira de folha boiando. (só visual)
- **Momento de assinatura — "o fôlego da galeria":** gatilho: jogador a ≤ 7 m da boca, olhando para ela (até 30°) e parado por 4 s. A mina solta o ar: um sopro de poeira cinza sai do buraco (12 sprites de `puff` que avançam 3 m e sobem), as 47 chapas do quadro tilintam juntas, as duas tábuas estufadas rangem e a vinheta do `gradePass` aperta 12% por 3 s. Depois o ar é puxado de volta: a poeira recua para dentro do buraco (mesmas partículas em sentido inverso, 2 s). Total de ~6 s, no máximo uma vez por rodada e espera de 90 s. É seguro: nada tem colisão, a vinheta é leve e não esconde zumbis, o controle não muda. Como a Caixa fica ao lado da boca, a espera evita repetição.
- **Animações ambientais:** (1) as 7 lanternas penduradas balançam como pêndulos, com fases e períodos diferentes (2,8 a 4,1 s, ±0,18 rad), matriz da instância reaproveitada; (2) o filete escorre (offset do mapa a 0,15 m/s) e a poça tem um reflexo que respira; (3) poeira cai do topo do paredão: um `puff` fino a cada 7 a 13 s, num de 4 pontos sorteados com semente; (4) a roda da torre gira um quarto de volta e volta, a cada 20 a 35 s, como se alguém lá embaixo puxasse o cabo.
- **Luz e cor:** paleta #0a0c0e (Veio), #6e6a62 (rocha), #c8a050 (carbureto), #4a5560 (aço). Uma `PointLight` real: a lâmpada que já existe em (30, -118), mais fraca (base 13 → 9) e com tremulação lenta de chama. Emissivos: nenhum novo, só o brilho especular do Veio. Ao entrar: névoa 0x4a4152 → 0x2e2c30, perto 20 → 10, longe 125 → 70; no `gradePass`, contraste +8%, saturação −15%, tom levemente frio.
- **Som ambiente:** (1) ronco da rocha: ruído marrom, passa-baixa 120 Hz, ganho com LFO de 0,07 Hz; (2) gotas: senoide de 1,6 a 2,4 kHz com envelope de 30 ms, em intervalos aleatórios de 0,6 a 3 s, passando por um delay de 180 ms com realimentação 0,35 (eco de galeria).
- **Escalada:** a Pedreira mostrava a mina como fundo de cenário e isolava; aqui o jogador chega à origem. É a primeira vez que o Veio corre (não só tinge a água) e que o espaço aberto passa a apertar. Abre a ordem 3 dizendo de onde tudo veio.
- **Implementação:** grupo do lado s = 0, coordenadas do mundo x = u, z = −v. Quadro em (50,9; −128), na face oeste do paredão (54; −128), virado para −x, de 1,0 a 2,4 m. Lacre em (33; −140,7). Filete em x 33, z −140 a −104; poça centrada em (33; −102,5). Garrafões em x 36,5, z −122 a −106. Cabos da roda (46; 9,6; −110) até (33; 6; −145), (54; 4,5; −145) e (54; 3,5; −128). Dinamite sobre a pedra (20; −120) a y 1,2. Chamada em x 35,2 a 37,3, z −140,95. Vagonetas em (30; −112) e (30; −124). Fora da frente da Caixa (30; −140), da arma de parede (59,2; −125), das janelas (12; −96,5), (20 e 45; −150), (60; −115 e −135) e do vão para a Base militar (x 60, z −111,5 a −107,5). ~14 draw calls (4 `InstancedMesh`: 47 chapas, 9 garrafões, 7 lanternas, 30 botas). Tudo em `cullAdd`; as lanternas atualizam só 7 matrizes por quadro, com `Matrix4` reaproveitada.

#### Fábrica (L) · ordem 3 · loop/repetição (linha de produção)
- **Conceito:** a Engarrafadora Águas de São Lázaro enchia garrafas com a água da fonte; desde março de 1956 a fonte é o Veio. Quando o Exército proibiu a água, a linha não parou: os operários com a febre cinza voltaram todo dia às 6h e repetiram os mesmos gestos, e cada garrafa ainda sai com o lote 0356.
- **Como o terror aparece aqui:** tudo se repete com precisão de máquina: o mesmo anel de fumaça a cada 9 s, o mesmo tac-tac, os mesmos números na lousa. Quem presta atenção percebe que a mesma garrafa marcada passa outra vez, e que o relógio volta para trás.
- **Props únicos:**
  1. **Esteira de engarrafamento:** sobre a máquina comprida existente, uma correia de lona com 14 roletes e 24 garrafas de vidro verde-escuro, meio cheias de líquido preto, com rótulo creme. Uma delas tem o rótulo colado de cabeça para baixo: é a garrafa marcada, que deixa ver que a linha se repete. `InstancedMesh` de garrafas (cilindro + cone do gargalo juntados), posições recalculadas por quadro sem alocar. (só visual, sobre colisor existente)
  2. **Relógio de ponto com escaninho:** caixa de ferro com mostrador e alavanca, e ao lado um escaninho com 60 cartões de ponto, todos picotados "06:00" em 200 linhas seguidas, datas de março de 1956 a fevereiro de 1958. Caixas + mostrador de canvas + plano com textura do escaninho. Preso à face de dentro da parede da frente do galpão. (só visual)
  3. **Aventais de borracha numerados:** 12 aventais pretos pendurados numa barra a 2,2 a 3,4 m de altura, com números 01 a 12 bordados em branco e todos com a mesma mancha gasta na altura do quadril direito, onde a mão bate na alavanca. Planos com leve curvatura (`PlaneGeometry` 6 × 1 segmentos dobrado) e um material. (só visual)
  4. **Lousa de produção:** lousa de giz 2 × 1,4 m com a tabela "PRODUÇÃO DO DIA — META 400" e uma coluna inteira de "400" na mesma letra, linha após linha, até a última, onde o giz escreveu "*ainda não acabou*" no lugar do número. Plano com textura de canvas. (só visual)
  5. **Prelo de rótulos e cascata de rótulos:** o prelo manual de ferro sobre a máquina cúbica e, saindo da bandeja, uma cascata de rótulos idênticos ("Água de São Lázaro — engarrafada em 14.03.1956 — lote 0356") que desce até o chão e forma montes como neve em 3 × 6 m. Prelo em caixas juntadas; rótulos em `InstancedMesh` de 220 planos 0,12 × 0,08 m com rotação sorteada por semente. (só visual)
  6. **Cuba de lavagem de garrafas:** sobre a máquina estreita, um tanque de chapa cheio de água preta, com os gargalos de 18 garrafas afundadas apontando para cima. A superfície ondula com o mesmo desenho a cada 4 s. Plano Phong preto + `InstancedMesh` de gargalos. (só visual)
  7. **Fieira de lâmpadas da linha:** 6 lâmpadas nuas de bulbo pendendo de fios sobre a esteira a 4,4 m, que acendem uma de cada vez em sequência, acompanhando a garrafa marcada. Esferas com material emissivo, sem luz real. (só visual)
  8. **Anel de fumaça da chaminé:** a chaminé de leste solta exatamente um anel de fumaça cinza a cada 9 s, com o mesmo tamanho, a mesma subida e a mesma inclinação; dá para ver de longe. `TorusGeometry` com material transparente que sobe, cresce e some (um só objeto reaproveitado). (só visual)
- **Momento de assinatura — "o turno recomeça":** gatilho: jogador dentro do galpão há 20 s seguidos. Uma cigarra elétrica de turno toca curta e abafada (não estourada); as 6 lâmpadas da linha piscam juntas duas vezes; a esteira acelera por 3 s e para exatamente na mesma posição em que estava quando o jogador entrou, com a garrafa marcada de volta no começo da linha; o ponteiro do relógio de ponto salta para 06:00 e a alavanca baixa sozinha (um cartão a mais no escaninho). Total de ~5 s, espera de 2 min. É seguro: só visual e som, sem colisão, a lâmpada real do galpão não muda de intensidade e nada cobre a Caixa nem a arma de parede.
- **Animações ambientais:** (1) a esteira anda a 0,5 m/s e as garrafas tilintam no fim da linha (o ciclo inteiro dura 24 s, sempre igual); (2) os 12 aventais balançam juntos, em uníssono perfeito (mesmo ângulo e fase), como se uma porta abrisse a cada 6 s; (3) os rótulos do topo da cascata levantam e assentam (3 instâncias por vez, com semente); (4) o anel de fumaça da chaminé a cada 9 s.
- **Luz e cor:** paleta #2c3a2e (verde-garrafa), #5e5c58 (concreto), #d8d0b0 (rótulo), #8a5a44 (tijolo). Uma `PointLight` real: a lâmpada existente do galpão, recolorida para 0xe0e4c8 (incandescente fraca e esverdeada), com uma piscada mínima a cada passagem da garrafa marcada. Emissivos: 6 bulbos da linha. Ao entrar no galpão: névoa 0x4a4152 → 0x3c443c, longe 125 → 95; no `gradePass`, tom esverdeado frio e saturação −10%.
- **Som ambiente:** (1) metrônomo da linha: duas batidas "tac-tac" (rajada de ruído, passa-faixa 1,2 kHz, 20 ms) a cada 0,75 s, sem variação nenhuma (é o que incomoda); (2) vidro: senoides de 3,1 kHz e 4,7 kHz com decaimento de 120 ms a cada três tac. A cigarra da assinatura: onda quadrada de 90 Hz com amplitude modulada a 50 Hz, 1,2 s, passa-baixa 1,5 kHz.
- **Escalada:** a Mina mostra a origem; a Fábrica mostra o Veio sendo organizado e distribuído, e a febre como repetição de gestos. É a primeira vez que a Vila mostra que o problema tinha método.
- **Implementação:** lado s = 1, mundo x = v, z = u. Galpão em x 108 a 132, z −52 a −18. Esteira sobre a máquina (120; −44), ao longo de z (−48 a −40). Relógio de ponto em (108,4; −26), a 1,4 a 2,2 m. Aventais em x 131,6, z −51 a −44 (face de dentro da parede do fundo; a arma de parede hk21 fica do lado de fora, em (132,45; −40)). Lousa em (124; −51,6), virada para +z. Prelo sobre (127; −26); cascata em x 124 a 130, z −24 a −21 (longe do vão x 118 a 122 da parede z −18). Cuba sobre a máquina (116; −28). Lâmpadas em x 120, z −48 a −40, y 4,4. Anel na chaminé (142; −10). Livres: Caixa (108,85; −45), porta do galpão (x 108, z −37 a −33), janelas (96,5; −12), (150; −20 e −45), (115 e 135; −60) e o vão para a Base militar (z −60, x 107,5 a 111,5). ~16 draw calls (4 instâncias: 24 garrafas, 220 rótulos, 18 gargalos e 47 cartões numa textura só). `cullAdd` no grupo; a animação da esteira só roda quando o galpão está a menos de 40 m.

#### Farol (O) · ordem 3 · som fora do lugar
- **Conceito:** o farol guiava as balsas da represa até o Porto. Depois que o faroleiro, Seu Quirino, bebeu da cisterna (Veio), a torre oca começou a soar como concha: quem encosta ouve o mar, num vale a centenas de quilômetros da costa. A chave de telégrafo do faroleiro, com a fiação arrancada, ainda bate Morse.
- **Como o terror aparece aqui:** cada som vem do lugar errado ou é de um lugar que não existe ali: ondas e gaivotas dentro da torre, um sino de bóia na areia seca, Morse numa chave de telégrafo sem fio. A paisagem é calma; é o ouvido que diz que algo está errado.
- **Props únicos:**
  1. **Bóia-sino encalhada:** uma bóia de navegação cônica, vermelha, tombada na areia, com a armação de ferro e o sino dentro, crostas de craca seca. Ela balança como se ainda estivesse na água. Cone + cilindros + toro juntados, ~2,4 m de comprimento. (só visual)
  2. **Buzina de nevoeiro de latão:** uma corneta grande (boca de 0,9 m) com fole de couro, presa à parede leste da casa do faroleiro, virada para a vila. `LatheGeometry` de perfil de corneta + caixa do fole. (só visual)
  3. **Catorze conchas numeradas no beiral:** conchas marinhas (búzios e vieiras) enfileiradas no beiral da casa, cada uma com um número de família a tinta azul. Ninguém na vila nunca viu o mar. `InstancedMesh` de 14 cones torcidos/achatados + atlas pequeno de números. (só visual)
  4. **Chave de telégrafo na janela:** manipulador Morse de latão sobre base de madeira, apoiado no peitoril de uma janela pintada na casa, com a fiação arrancada pendendo; a alavanca bate sozinha e uma lâmpada-piloto âmbar pisca junto. Caixa + alavanca + esfera emissiva. (só visual)
  5. **Âncora arrastada de um mar que não existe:** âncora de ferro de 1,6 m cravada na areia, com a corrente enrolada na haste e, atrás dela, um sulco de 6 m na areia, como se tivesse sido arrastada desde a beira da água. `InstancedMesh` de 18 elos (toros) + decal do sulco. (só visual)
  6. **Lente de Fresnel rachada:** a lente original do farol, um tambor de anéis de vidro de 1,2 m, caída de lado ao pé da torre, rachada ao meio (por isso a lanterna lá em cima brilha nua). 8 toros finos com material de vidro transparente + 2 discos. (só visual)
  7. **Escafandro virado na areia:** capacete de mergulho de latão com as três vigias redondas, o vidro da frente rachado e água preta até a metade, ao lado de um rolo de mangueira de ar ressecada. Esfera + cilindros + 3 discos de vidro. (só visual)
- **Momento de assinatura — "o mar dentro da torre":** gatilho: jogador a ≤ 4 m da base do farol, parado por 3 s. O ambiente da área baixa 70% (nunca o som dos zumbis, dos tiros e da interface) e de dentro da torre vem o mar: ondas arrebentando, ressaca puxando pedrinhas, duas gaivotas, com um passa-baixa que vai abrindo de 300 Hz para 3 kHz em 5 s. Um fio de areia escorre pela porta da torre. Aos 7 s tudo corta de uma vez e, no silêncio, uma única batida do sino de bóia soa atrás do jogador (painel posicionado 6 m atrás da câmera), embora a bóia esteja de lado na areia, a 20 m. Duração de ~8 s, espera de 2 min. É seguro: quase só áudio; a redução nunca atinge os sons de jogo e o sino é baixo (−18 dB), sem susto.
- **Animações ambientais:** (1) a bóia rola ±8° com período de 5 s, como se boiasse; (2) a lanterna do farol (emissiva existente) e a lâmpada-piloto da chave piscam em Morse "AINDA NAO ACABOU" (ponto 0,18 s), um ciclo a cada 40 s; (3) a cada 25 a 45 s, a areia da borda do sulco da âncora escorre para dentro dele (um fio de sprites claros); (4) areia fina corre rente ao chão no sentido do farol (sprites baixos, opacidade 0,15).
- **Luz e cor:** paleta #b0a078 (areia), #c23a2e (vermelho da bóia e das listras), #d8e0e8 (facho frio), #1c2a34 (azul-noite). Uma `PointLight` real: a lâmpada existente em (−40; 128), recolorida para 0xb8c8d8 (fria). Emissivos: a lanterna do farol (já existe; passa a piscar em Morse) e a lâmpada-piloto âmbar da chave (sprite pequeno). Ao entrar: névoa 0x4a4152 → 0x3e4a56 (maresia azulada), perto 20, longe 125 → 110; no `gradePass`, tom frio e um pouco mais de granulação.
- **Som ambiente:** (1) vento na torre: ruído rosa passa-faixa 900 Hz, Q 6, com LFO de 0,1 Hz no ganho, e um assobio fraco (senoide de 1,1 kHz a −34 dB) que sobe quando o jogador se aproxima da torre; (2) Morse da chave: senoide de 700 Hz a −30 dB, sincronizada com a lanterna, saindo da chave de telégrafo (`PannerNode` na casa).
- **Escalada:** o Cemitério já trazia som fora do lugar, mas debaixo da terra, onde ele ainda faz sentido; aqui o som é de um lugar que não existe no vale. O mundo começa a não bater com a geografia. Vem depois da infância corrompida do Acampamento.
- **Implementação:** lado s = 2, mundo x = −u, z = v. Torre em (−40; 136); casa do faroleiro em (−20; 132), ocupando x −23,5 a −16,5, z 129 a 135. Bóia em (−46; 120). Buzina na face da casa virada para o farol, x −23,6, z 132, a 2,2 m. Conchas no beiral, z 128,9, x −23 a −17, y 3,1. Chave de telégrafo em (−18; 128,9), a 1,1 m. Âncora em (−22; 104), sulco até (−25; 108). Lente em (−36,5; 134). Escafandro em (−34; 144). Livres: Caixa (−28; 126), arma de parede fal (−59,2; 140), janelas (−12; 96,5), (−20 e −45; 150), (−60; 115 e 135), o vão para o Vinhedo (x −60, z 107,5 a 111,5), a porta do Porto (0; 123) e a entrada pelo Acampamento (x −30, z < 96,5). ~13 draw calls (instâncias: 14 conchas, 18 elos). Material de vidro da lente sem `transmission` (só `opacity`) para o gráfico Baixo. `cullAdd` em tudo.

#### Floresta (P) · ordem 3 · algo que se move quando não observado
- **Conceito:** a família 61 fugiu da lista do Programa e se escondeu na cabana do lenhador, com barbantes e latas para ouvir a ambulância chegar. Foram levados mesmo assim. As roupas de domingo da família, penduradas nos galhos para secar, continuam voltando para casa.
- **Como o terror aparece aqui:** cinco peças de roupa (pai, mãe e três filhos, em tamanhos decrescentes) mudam de árvore sempre que ninguém olha, uma por vez, numa trilha que termina em volta da cabana. Nada se mexe à vista; o jogador só percebe que a mãe agora está mais perto.
- **Props únicos:**
  1. **Roupas de domingo da família 61:** paletó escuro, vestido estampado, e três roupinhas (camisa de menino, vestido de menina, macacão de bebê), cada uma num cabide de arame pendurado num galho, a barra molhada de preto. Planos curvados com textura de canvas e alpha. (só visual)
  2. **Alarme de barbante e latas:** um barbante esticado entre seis árvores a 0,4 m do chão, com 11 latas de goiabada vazias amarradas, cada uma com uma pedrinha dentro. Linhas (`LineSegments`) + `InstancedMesh` de latas. (só visual, sem colisão)
  3. **Cabana barricada por dentro:** na porta da cabana, as tábuas de travamento ficaram pregadas pelo lado de dentro (vistas pela fresta), o número "61" riscado na madeira e uma cruz de cal pela metade: só o traço vertical e o começo do horizontal, a escova de caiar caída no chão. Planos com textura de canvas na face leste da cabana existente + escova em caixas. (só visual)
  4. **Trempe de três pedras:** fogo apagado com três pedras, uma panela de ferro com ossinhos de preá e uma colher pequena de criança dentro. Caixas e cilindros juntados, altura 0,5 m. (só visual)
  5. **Trilha de pedrinhas de cal:** 60 pedrinhas brancas deixadas a cada 0,8 m, da porta da cabana até o vão do muro de fora (o caminho que as crianças marcaram para voltar), e as 10 últimas cinzentas, como se a cal tivesse "pegado a febre". `InstancedMesh` de dodecaedros pequenos. (só visual)
  6. **Pinheiro com as alturas das crianças:** riscos de faca na casca de um pinheiro com nomes de três crianças e as datas 55, 56, 57 subindo devagar, e uma última marca, "58", a 2,3 m de altura (mais alto do que uma criança pode ter crescido). Plano com textura de canvas envolvendo o tronco (cilindro aberto de 1/3). (só visual)
  7. **Rede de dormir afundada:** rede de algodão cru amarrada entre duas árvores, afundada no meio como se alguém deitado pesasse nela, e vazia. `TubeGeometry`/plano curvado com textura. (só visual)
  8. **Fifó aceso no peitoril da cabana:** lamparina de garrafa com pavio de pano, acesa na janela da cabana voltada para a mata, como quem deixa a luz para alguém voltar; o vidro esfumaçado. A chama é a única luz quente no meio das árvores. Cilindros + sprite emissivo. (só visual)
- **Momento de assinatura — "a família que volta para casa":** cada roupa tem 6 âncoras fixas (sorteadas com semente entre os troncos de `VD_TREES`), da beira do muro do fundo até as árvores em volta da cabana. Gatilho: o jogador está na Floresta e uma roupa ficou fora do campo de visão (mais de 70° da direção da câmera) e a mais de 12 m por pelo menos 1,5 s: ela passa para a âncora seguinte. Só uma roupa anda por vez, uma a cada 8 s no mínimo; nunca se move estando no quadro (teste de frustum) nem para menos de 3 m do jogador. Quando as cinco chegam às árvores da cabana, ficam viradas para a porta, como quem espera para entrar, o fifó baixa a chama pela metade e as latas do barbante tilintam uma vez. Reinicia se o jogador ficar 60 s fora da área. É seguro: são planos sem colisão, e as âncoras nunca ficam diante de janela, portão, arma de parede ou Caixa.
- **Animações ambientais:** (1) as roupas balançam no cabide (rotação em y ±0,15 rad e flexão dos vértices de baixo, período de 3 a 5 s); (2) a rede de dormir embala devagar (±4°, período de 4,5 s), sempre com o mesmo peso; (3) folhas secas caem das copas (sprites que giram, 1 a cada 2 s, em volta do jogador); (4) uma lata do barbante treme e tilinta a cada 15 a 30 s, sempre a mais longe do jogador.
- **Luz e cor:** paleta #3c4c2c (mato), #31503a (pinho), #e8e4d8 (cal), #ffb060 (fifó). Uma `PointLight` real: a lâmpada âmbar que já existe junto da cabana. Emissivos: a chama do fifó (sprite aditivo) e o reflexo dela no vidro. Ao entrar: névoa 0x4a4152 → 0x3a4236 (verde-cinza), perto 20 → 14, longe 125 → 90; no `gradePass`, verde escuro e um pouco menos de contraste nas sombras.
- **Som ambiente:** (1) vento nas copas: ruído rosa passa-faixa 600 Hz, Q 1, com LFO de 0,05 Hz; (2) galho estalando: dois a quatro estalos (ruído passa-alta 2 kHz, 15 ms) a cada 9 a 20 s, sempre de um ponto atrás do jogador (`PannerNode` 8 a 12 m atrás da câmera), nunca à frente.
- **Escalada:** na Fazenda, o que se movia era uma coisa só e voltava ao lugar; aqui é uma família inteira, com um destino, e o progresso fica: quanto mais tempo o jogador passa na área, mais perto da casa elas chegam. Os 46 troncos com colisão já dividem a atenção do jogador entre árvores e zumbis.
- **Implementação:** lado s = 3, mundo x = −v, z = −u. Cabana em (−124; 34), ocupando x −126,5 a −121,5, z 31 a 37; porta e cruz de cal na face z 30,9 (virada para a porta da Serraria). Trempe em (−118; 26). Trilha da cabana (−124; 34) até o vão do muro de fora (−150; 38). Barbante em x −140 a −130, z 10 a 20. Pinheiro entalhado: o tronco mais próximo de (−120; 40). Rede de dormir: entre os troncos mais próximos de (−132; 48). Fifó no peitoril da janela oeste da cabana (−126,6; 34), a 1,1 m. Começo das roupas perto de (−145; 50) e (−146; 12); âncoras finais nas 5 árvores mais próximas da cabana fora do setor da Caixa (−127; 34) e da lâmpada (−116; 34). Livres: arma de parede galil (−104; 59,2), janelas (−96,5; 12), (−150; 20 e 45), (−115 e −135; 60), o vão para o Vinhedo (z 60, x −111,5 a −107,5), o corredor do Acampamento (z 30, x > −96,5) e a porta da Serraria (−123; 0). ~12 draw calls (instâncias: 60 pedrinhas, 11 latas). O teste de frustum usa uma `Sphere` reaproveitada por roupa. `cullAdd` em tudo.

#### Hospital de campanha (K) · ordem 3 · médico/clínico
- **Conceito:** o posto de triagem do Exército na quarentena. Aqui a febre cinza era classificada com cartões verdes, amarelos e cinzentos, e os cinzentos eram "transferidos ao Sanatório Santa Inês" com a assinatura do Dr. Aurélio Vasconcellos. É a primeira vez que a Vila escreve o nome do Sanatório e do diretor.
- **Como o terror aparece aqui:** o horror é burocrático e limpo: listas datilografadas, carimbos, cartões, a vacina preta pingando de uma ampola rachada. Nada sangra; o que assusta é a ordem com que as pessoas foram classificadas e mandadas para o alto do morro, e uma vaga em branco no fim da lista.
- **Props únicos:**
  1. **Varal de cartões de triagem:** um arame esticado a 1,9 m entre duas estacas, com 40 cartões de papel pendurados por pregadores: 4 verdes, 7 amarelos e 29 cinzentos, estes com o carimbo "TRANSFERIR — S.S.I.". Atlas de canvas + `InstancedMesh` de planos. (só visual)
  2. **Lista do Programa na lona:** folha datilografada pregada com tachinhas na lona da barraca grande, "PROGRAMA DE TRATAMENTO — SANATÓRIO SANTA INÊS — Dir. Dr. Aurélio Vasconcellos", 40 linhas numeradas com os nomes batidos por cima com "xxxx", a linha 41 em branco ("41 — ________ — vaga"), e embaixo, a lápis, "*ainda não acabou*". Plano com textura de canvas 512 × 768. (só visual)
  3. **Máquina de escrever sobre caixote de munição:** máquina preta de carro largo com a folha seguinte presa no rolo, sobre um caixote verde "2ª CIA — SAÚDE". Caixas juntadas + rolo cilíndrico + plano de papel; o caixote tem 0,7 m. (só visual)
  4. **Estojo de vacinação aberto:** caixa de folha sobre um banquinho, com 40 ampolas de vidro de líquido preto em fila, uma lanceta e o carimbo "VACINA DO PROGRAMA" (a mesma "vacinação gratuita" do mural da Praça); uma ampola rachada pinga na lona do chão. Caixa + `InstancedMesh` de ampolas com material preto brilhante. (só visual)
  5. **Lençóis com a silhueta de cinza:** nas três macas que já existem, lençóis brancos com a marca de um corpo feita de pó cinza fino (cabeça, ombros, braços ao lado do corpo), e as correias de couro afiveladas, cortadas no meio. Planos com textura de canvas sobre cada maca + tiras. (só visual, sobre colisores existentes)
  6. **Balança antropométrica do Exército:** balança de coluna com régua de altura, cursor encostado no zero, e uma ficha presa no braço: "Família 117 — 5 pessoas — peso total: 0 kg". Coluna fina + plataforma de 0,08 m + plano de ficha. (só visual)
  7. **Cesto de pulseiras de lona:** um cesto de vime transbordando de pulseiras de identificação de lona com fivela, cada uma com um número a tinta; algumas caídas em volta. É a primeira aparição da pulseira que o jogador vai reencontrar no Sanatório. Cilindro do cesto + `InstancedMesh` de 40 toros achatados. (só visual)
  8. **Tonel de cal de desinfecção:** tonel de ferro "CAL VIRGEM — DESINFECÇÃO", uma brocha de caiar apoiada na borda e pegadas brancas de coturno saindo dele até o portão: é a mesma cal das cruzes nas portas da vila. Cilindro de 1 m + `InstancedMesh` de 26 decalques de pegada. (colisão baixa ≤ 1,2 m, ou só visual)
  9. **Ambulância do Exército repintada:** a ambulância que já existe passa a ser verde-oliva, com a cruz vermelha num círculo branco (a ambulância branca do Programa fica para o Sanatório). As portas de trás ficam abertas, o interior forrado de lona, quatro ganchos de maca vazios e um travesseiro com a mancha cinza de uma cabeça. Troca de material + 2 portas abertas + interior. (só visual, sobre colisor existente)
- **Momento de assinatura — "a vaga 41":** gatilho: jogador a ≤ 3,5 m da lista, olhando para ela (até 20°) por 1,5 s. A máquina de escrever bate sozinha nove teclas e o sino da margem (som curto, nítido, −12 dB), o carro corre 4 cm para a esquerda e a linha 41 da lista se preenche (redesenho do canvas): "41 — 1 pessoa — TRANSFERIR AO S.S.I.", com um carimbo cinza que aparece por último. Duração de ~3 s; acontece uma vez por partida para cada jogador e a linha fica preenchida. É seguro: troca de textura e som, sem colisão nem perda de controle, e a lista fica longe da Caixa e da arma de parede.
- **Animações ambientais:** (1) os 40 cartões giram e batem no arame com o vento (rotação em y e x por instância, fases sorteadas com semente); (2) uma gota preta cai da ampola rachada a cada 1,4 s (sprite pequeno) e a mancha na lona do chão cresce um pouco; (3) a lona das três barracas respira: escala em y de ±1,5% com período de 5 s, fases defasadas, como pulmões; (4) a bandeira da cruz vermelha, que já balança, ganha a cor desbotada.
- **Luz e cor:** paleta #76764e (lona), #e8e4d8 (lençol), #9a9a96 (cinza da febre), #b01818 (cruz). Uma `PointLight` real: a lâmpada existente junto das barracas, recolorida para 0xe8f0ff (branca clínica), base 12. Emissivos: nenhum; as ampolas pretas têm só brilho especular. Ao entrar: névoa 0x4a4152 → 0x5a5a5e (cinza claro), perto 18, longe 100; no `gradePass`, saturação −25% e um toque de ciano.
- **Som ambiente:** (1) gerador do posto: senoide de 38 Hz + 2ª e 3ª harmônicas, com pulsação de 6 Hz no ganho, a −32 dB, vindo das barracas; (2) rangido de maca de ferro: FM com portadora 180 Hz, índice 3, 0,4 s, a cada 8 a 15 s, sempre de uma maca vazia (`PannerNode` na maca mais longe do jogador).
- **Escalada:** o Castelo vigiava; aqui o jogador lê o que a vigilância fazia. Pela primeira vez a sugestão vira documento: nome, cargo, carimbo, lista. É a ponte explícita para o Sanatório (pulseira, carimbo, a vacina do Veio) e prepara a Encosta e as Ruínas.
- **Implementação:** lado s = 0, mundo x = u, z = −v. Varal em x −16 a −6, z −121. Lista na face sul da barraca grande (−28; −134,9), a 1,0 a 1,8 m; máquina sobre o caixote em (−28; −133). Estojo em (−13,3; −130), ao lado da maca (−12; −130); lençóis nas macas (−12; −130), (−12; −134) e (−48; −132). Balança em (−46; −123). Cesto em (−16; −128). Tonel em (−3; −103), pegadas até (−30; −97). Ambulância em (−54; −120), portas abertas para +z (lado oposto da arma de parede). Livres: Caixa (−24; −125), arma de parede mp40 (−59,2; −125), janelas (−12; −96,5), (−20 e −45; −150), (−60; −115 e −135), o vão para a Encosta (x −40 a −36, z −150), o vão para as Ruínas (x −60, z −111,5 a −107,5) e a porta da Mina (0; −123). ~15 draw calls (instâncias: 40 cartões, 40 pulseiras, 40 ampolas, 26 pegadas). Canvas da lista redesenhado uma vez só no gatilho. `cullAdd` em tudo.

#### Ferrovia (M) · ordem 3 · falsa segurança
- **Conceito:** o "Trem das 6" ia levar as famílias sadias para fora do vale antes do corte da linha. A plataforma foi montada, as cadeiras de espera foram etiquetadas, o café foi servido, e o trem nunca saiu: o vagão-dormitório iluminado era a quarentena, com as portas amarradas por fora.
- **Como o terror aparece aqui:** é a área mais acolhedora da ordem 3: luz quente nas janelas, café fumegando, música baixinha, sinal verde, cancela aberta. Tudo promete saída. O momento de assinatura retira a promessa de uma vez e mostra o que estava pintado por dentro do vidro.
- **Props únicos:**
  1. **Faixa de embarque:** faixa de pano cru entre duas estacas a 3,2 a 3,9 m de altura: "EMBARQUE — FAMÍLIAS LIBERADAS — TREM DAS 6 — 2ª CIA". `PlaneGeometry` com segmentos e textura de canvas. (só visual)
  2. **Fila de cadeiras de espera:** 14 cadeiras dobráveis de lona do Exército em fila na beira da linha, cada uma com um cartão "SADIO" e o número da família preso no encosto; na última, um vaso de avenca trazido de casa. `InstancedMesh` de cadeiras + atlas de cartões; altura 0,9 m. (só visual)
  3. **Vagão-dormitório iluminado:** o vagão do meio da segunda linha ganha 6 janelas acesas em âmbar quente, cortinas de renda, a silhueta de uma mesa posta para quatro, e por fora as portas amarradas com arame farpado e uma cruz de cal em cada porta. Planos emissivos + texturas de canvas + linhas de arame. (só visual, sobre colisor existente)
  4. **Garrafa térmica e xícaras emprestadas:** num caixote, uma garrafa térmica verde do Exército com café ainda fumegando e 14 xícaras de louça desparelhadas, emprestadas das casas, em fila, todas cheias. Cilindros (`InstancedMesh`) + vapor. (só visual)
  5. **Cancela aberta:** cancela de posto de controle listrada de vermelho e branco, com o braço levantado e a placa "LIVRE TRÂNSITO", ao lado do vão para o Pântano. Poste + braço em caixa a 60°. (só visual)
  6. **Sinal anão de manobra:** ao pé do sinal que já existe (luz vermelha), um sinal baixo de manobra de ferro fundido com lente dupla, que fica verde quando o jogador se aproxima ("via livre"). Caixa baixa + 2 esferas emissivas. (só visual)
  7. **Telegrama do Exército:** telegrama pregado numa perna da caixa d'água: "EVACUAÇÃO CONFIRMADA — 06:00 — FAMÍLIAS SADIAS — 2ª CIA", com a data do dia seguinte. Plano com textura de canvas. (só visual)
  8. **Mangote da caixa d'água pingando:** a mangueira de lona de abastecimento de locomotiva pende da caixa d'água e pinga preto num dormente, ao lado da placa esmaltada "ÁGUA TRATADA — PODE BEBER — Ministério da Saúde". Tubo + plano esmaltado + gota. (só visual)
- **Momento de assinatura — "via livre":** gatilho: a primeira vez que o jogador chega a ≤ 10 m do vagão iluminado na partida. Durante 6 s tudo dá certo: o sinal anão fica verde, um apito longo de locomotiva soa ao longe (vindo da direção da Estação, com Doppler leve), os engates dos vagões batem em sequência como se a composição fosse partir, e o vapor do café sobe mais forte. Depois a luz verde apaga e volta o vermelho; a música para; as 6 janelas do vagão apagam uma por uma, da mais longe para a mais perto do jogador (0,4 s cada), e no vidro escuro aparecem, por dentro, as cruzes de cal e "*ainda não acabou*" escrito a cal. As janelas reacendem devagar ao longo de 60 s, mas as cruzes ficam. Total de ~10 s, uma vez por partida. É seguro: só emissivos e texturas mudam; a lâmpada real da área continua igual, então a visibilidade dos zumbis não muda.
- **Animações ambientais:** (1) vapor do café subindo (6 sprites reaproveitados, 2 m de subida, 3 s); (2) cortinas de renda das janelas do vagão balançando (deslocamento do `offset` da textura); (3) a faixa de embarque ondula (vértices em seno, 2 Hz, amplitude 8 cm); (4) o vagão do meio dá um tranco de 0,3° a cada 30 a 50 s, como se alguém lá dentro mudasse de lugar.
- **Luz e cor:** paleta #ffd9a0 (janelas), #6a2a24 (vinho do vagão), #2f4a38 (verde da ferrovia), #e8e4d8 (cal). Uma `PointLight` real: a lâmpada existente da área, recolorida para 0xffc890 (quente, aconchegante). Emissivos: 6 janelas do vagão, 2 lentes do sinal anão. Ao entrar: névoa 0x4a4152 → 0x584a46 (mais quente e clara), longe 125 → 140; no `gradePass`, tom quente e contraste −5%. É a única área da ordem 3 que fica mais clara ao entrar (falsa segurança).
- **Som ambiente:** (1) metal esfriando: estalos de impulso passa-faixa 2,5 kHz a cada 3 a 9 s + chiado de vapor parado (ruído branco passa-alta 4 kHz, −36 dB); (2) música de dentro do vagão: sanfona sintetizada (duas vozes dente-de-serra, passa-baixa 1,2 kHz, vibrato de 5 Hz) tocando 8 compassos de xote em loop a −34 dB, com `PannerNode` no vagão; para no momento de assinatura e não volta.
- **Escalada:** depois do Hospital, a Ferrovia oferece alívio, a promessa de partir. A Praça também era falsa segurança, mas ingênua; esta é uma promessa oficial, com faixa e horário, e é a primeira vez que uma luz "boa" se apaga diante do jogador.
- **Implementação:** lado s = 1, mundo x = v, z = u. Faixa entre (104; 6) e (104; 20). Cadeiras em x 105,5, z 36 a 50. Caixote do café em (104,5; 33). Vagão iluminado: o do meio da linha x 120, z 23,7 a 36,3 (janelas nas duas faces). Cancela em (113,5; 56), braço levantado, ao lado do vão (z 60, x 107,5 a 111,5). Sinal anão em (140; 48). Telegrama na perna (135,6; 9,6) da caixa d'água (138; 12); mangote e placa na perna (140,4; 14,4). Livres: Caixa (130; 30), arma de parede ak74u (104; 59,2), janelas (96,5; 12), (150; 20 e 45), (115 e 135; 60), o portão da Estação (x < 96,5, z 30) e a porta da Fábrica (123; 0). ~16 draw calls (instâncias: 14 cadeiras, 14 xícaras). Janelas do vagão como um só plano emissivo com atlas, para apagar uma a uma pela textura. `cullAdd` em tudo.

#### Porto (N) · ordem 3 · presença invisível
- **Conceito:** daqui as balsas atravessavam a represa, uma família por vez, até a estrada. Depois da quarentena a balsa parou, mas os que acordaram continuam voltando ao píer toda noite, esperando a travessia. Não se veem; pesam.
- **Como o terror aparece aqui:** a presença tem massa: o banco afunda onde ninguém senta, a balança marca peso com o prato vazio, o barco desce na água quando alguém embarca. No Lago a presença era uma suspeita; aqui ela age e tem para onde ir.
- **Props únicos:**
  1. **Balança romana de peixe:** pendurada de uma trave de dois postes na beira da doca (a pesagem do peixe); o prato está vazio e o ponteiro marca 64 kg, oscilando. Postes + trave em caixas + mostrador de canvas. (só visual)
  2. **Banco da travessia com o assento afundado:** banco comprido de ripas com a placa "AGUARDE A TRAVESSIA — UMA FAMÍLIA POR VEZ"; as ripas estão afundadas em quatro lugares, como se houvesse gente sentada. Ripas em `InstancedMesh` com flexão já aplicada na geometria; 0,45 m. (só visual)
  3. **Cabeço de amarração com a corda esticada:** cabeço de ferro na borda do píer, com a corda de sisal até o barco mais perto esticada e rangendo. Cilindros + `TubeGeometry` atualizada só no gatilho. (só visual)
  4. **Barco que pesa:** o barco existente perto do píer fica 6 cm mais fundo na água do que o outro, e dentro dele há um par de sapatos de domingo molhados no banco do meio. Mudança de y + 2 caixas pequenas. (só visual)
  5. **Cabide de coletes salva-vidas:** prancha com 10 ganchos na parede do armazém, para as famílias da balsa; 9 vazios e um colete de cortiça ainda pendurado, molhado de preto, gotejando. Caixa + planos. (só visual)
  6. **Remo molhado:** um remo encostado no caixote baixo, molhado de água preta até a metade e ainda escorrendo, como se alguém tivesse acabado de remar. Caixas + plano decal com `polygonOffset`. (só visual)
  7. **Rastros na água:** na água das duas docas, esteiras em V que avançam devagar sem nada à frente. Planos aditivos com textura de anel/V e opacidade 0,25, reaproveitados. (só visual)
  8. **Tabela de preços da travessia:** tábua pintada à mão, pregada no beiral do armazém: "ADULTO 2 CR$ — CRIANÇA 1 CR$ — CAIXÃO 5 CR$", desbotada. Plano com textura. (só visual)
- **Momento de assinatura — "alguém embarca":** gatilho: jogador sobre o píer por 2 s, ou a ≤ 5 m do barco que pesa. As pranchas do píer afundam 3 a 4 cm uma depois da outra, da terra para o barco, uma a cada 0,6 s, cada uma com um rangido; a sequência passa por baixo do jogador quando ele está no píer ("alguém passou por você"), e um sopro frio cruza o som estéreo da esquerda para a direita. No fim o barco desce mais 10 cm e balança, a corda estica, e o ponteiro da balança volta a zero. Então uma esteira em V sai do barco e segue devagar pela água até o vão do muro de fora, na direção do Cais. ~9 s, espera de 3 min. É seguro: as pranchas são instâncias sem colisão (o piso é o chão), o barco e a água são só visuais, e nada passa pela frente da Caixa nem da arma de parede.
- **Animações ambientais:** (1) os dois barcos rolam ±2° com períodos diferentes (4,2 s e 5,7 s); (2) o ponteiro da balança oscila em torno de 64 kg (±3 kg, mola amortecida); (3) as esteiras em V atravessam as docas uma a cada 20 a 40 s; (4) o colete salva-vidas pinga e gira meia volta no gancho a cada 20 a 30 s.
- **Luz e cor:** paleta #1f3a48 (água), #5a4a38 (madeira úmida), #0c1014 (Veio), #9fb4c0 (luz fria). Uma `PointLight` real: a lâmpada existente da área, recolorida para 0x9fb4c0 e mais fraca (base 10). Emissivos: nenhum; só o especular da água. Ao entrar: névoa 0x4a4152 → 0x3a4450, perto 16, longe 95; no `gradePass`, saturação −20% e tom ciano.
- **Som ambiente:** (1) água nas estacas: ruído rosa passa-baixa 400 Hz com envelope de "chape" (ataque 40 ms, queda 300 ms) a cada 2 a 5 s; (2) passo na madeira: baque passa-baixa 180 Hz + rangido curto, vindo do píer vazio, a cada 20 a 40 s, só quando o jogador não está no píer.
- **Escalada:** a presença do Lago era ambígua e não tinha objetivo; a do Porto tem peso e destino (embarca e vai para o Cais). É o primeiro sinal de que os mortos da vila estão indo para algum lugar.
- **Implementação:** lado s = 2, mundo x = −u, z = v. Píer em x 34,8 a 40,2, z 126 a 144 (as pranchas já são `InstancedMesh`: o afundamento é só mexer nas matrizes). Barcos em (46; 133) e (28; 139); o que pesa é o (46; 133). Cabeço em (40,4; 134). Trave da balança em (22; 124,5). Banco em (50; 118), ao longo de z. Cabide de coletes na face oeste do armazém (42,05; 108), a 1,4 m. Remo no caixote (20; 110). Tabela de preços no beiral (38; 110,6), a 3,2 m. Livres: Caixa (38; 111,1), arma de parede spas (59,2; 125), janelas (12; 96,5), (20 e 45; 150), (60; 115 e 135), o vão para o Cais (x 36 a 40, z 150), o vão para o Pântano (x 60, z 107,5 a 111,5), o portão da Estação (x 30, z < 96,5) e a porta do Farol (0; 123). ~12 draw calls (instâncias: ripas, 2 esteiras). `cullAdd` em tudo.

#### Serraria (Q) · ordem 3 · corpo/grotesco
- **Conceito:** na quarentena o Exército mandou a serraria fazer caixões em série; depois, caixotes de transporte com medida de gente, endereçados ao Sanatório Santa Inês. A madeira que veio da mata regada pelo Veio sangra uma seiva preta, e a serra não corta só madeira.
- **Como o terror aparece aqui:** o corpo aparece pela madeira: toras que sangram e têm anéis em forma de costela, uma tora pendurada pelas correntes com a casca em tiras como pele, luvas com dedos a menos, dentes no cocho do rebolo. Ninguém aparece; tudo lembra carne.
- **Props únicos:**
  1. **Toras que sangram:** a pilha de toras que já existe ganha topos com anéis escuros e uma seiva preta-avermelhada escorrendo em fios até o chão; o topo de uma das toras mostra os anéis formando uma caixa torácica. Discos com textura de canvas nas pontas + fios em planos estreitos. (só visual, sobre colisor existente)
  2. **Tora pendurada descascada:** uma tora de 3 m presa por duas correntes ao pórtico do galpão, a 2,5 a 3,3 m de altura, com a casca levantada em tiras compridas que pendem como pele. Cilindro + 14 planos estreitos em `InstancedMesh` + elos. (só visual, acima da cabeça)
  3. **Quadro de luvas:** nove luvas de raspa de couro pregadas num pilar, uma acima da outra, cada uma com um ou dois dedos a menos, cortados retos, e o nome do serrador a canivete na madeira ao lado. Planos recortados (alpha) com atlas. (só visual)
  4. **Caixotes-esquife do S.S.I.:** sobre a pilha de tábuas de leste, três caixotes de pinho de 1,9 × 0,6 m empilhados, estampados "S.S.I. — FRÁGIL — NÃO ABRIR — Nº 207/208/209", um deles com a tampa erguida 3 cm, de onde sai um fio de serragem cinza. Caixas + texturas de estêncil. (só visual, sobre colisor existente ≤ 1,2 m)
  5. **Monte de serragem com cabelo:** debaixo da bancada da serra, um monte de serragem rosada misturada a mechas finas de cabelo escuro. Cone achatado com textura + 20 linhas curvas. (só visual)
  6. **Rebolo com cocho de água preta:** pedra de amolar de pedal, com o cocho cheio de água preta e, no fundo, dentes de serra soltos e três molares. Cilindros + caixa + `InstancedMesh` de dentes. (colisão baixa ≤ 1,0 m, ou só visual)
  7. **Ferros de marcar toras:** nove ferros de marcar a quente pendurados num pilar, com números de família no lugar do selo da serraria (203 a 211); as toras da pilha têm esses números queimados no topo, como gado. Cilindros finos + textura de canvas nos topos. (só visual)
- **Momento de assinatura — "a serra morde":** gatilho: jogador a ≤ 5 m da bancada, olhando para a serra (até 30°) por 2 s. O assobio da serra (1,2 kHz) cai para um ronco grave de 300 Hz, como se a lâmina entrasse em algo denso e úmido, com um baque surdo; um leque de partículas escuras (serragem molhada) sai da lâmina por 1,5 s para o lado oposto da Caixa e assenta na bancada, deixando uma mancha que fica até o fim da partida (decalque cuja opacidade sobe). A bancada está vazia o tempo todo. Depois a serra volta à rotação. ~4 s, uma vez por rodada, espera de 3 min (a Caixa fica ao lado da serra). É seguro: partículas leves que não cobrem a Caixa, som abaixo dos tiros, sem colisão nova.
- **Animações ambientais:** (1) a tora pendurada gira devagar nas correntes (±25°, período de 7 s) e as tiras de casca balançam com atraso; (2) gotas de seiva pingam das toras (sprites escuros a cada 1,5 a 4 s, num de 6 pontos sorteados com semente), com uma pequena mancha que cresce no chão; (3) pó de serra flutua no feixe da lâmpada do galpão (20 sprites lentos, só dentro do galpão).
- **Luz e cor:** paleta #6e5a3e (serragem), #1a0c0a (seiva), #a0a4a8 (aço da serra), #c8a878 (madeira crua). Uma `PointLight` real: a lâmpada existente do galpão, recolorida para 0xd8c8a0 (amarelo doente), com uma queda de 20% sincronizada com a mordida da serra. Emissivos: nenhum. Ao entrar: névoa 0x4a4152 → 0x5a5040 (poeira amarelada), perto 14, longe 90; no `gradePass`, tom quente sujo, sombras puxando para o vermelho escuro.
- **Som ambiente:** (1) serra girando em vazio: dente-de-serra de 110 Hz + 2 harmônicas, passa-baixa 1,8 kHz, tremolo de 12 Hz (rotação da lâmina), a −30 dB, saindo da bancada; (2) gotejar grosso: senoide de 180 Hz com envelope de 60 ms, a cada 2 a 4 s, vindo da pilha de toras.
- **Escalada:** fecha a ordem 3 e é a primeira vez que a Vila sai da sugestão para algo que lembra carne. O Hospital mostrou papéis; a Serraria mostra a matéria, ainda disfarçada de madeira. Prepara as Ruínas da cidade e o Bairro queimado.
- **Implementação:** lado s = 3, mundo x = −v, z = −u. Serra e bancada em (−118; −42); tora pendurada em (−114,5; −40), presa ao telhado (y 4,1). Pilha de toras em x −127,8 a −123,2, z −19 a −9. Luvas no pilar (−124; −48). Ferros de marcar no pilar (−112; −36). Caixotes-esquife sobre as tábuas (−140; −50). Monte de serragem no lado da bancada voltado para −x, em (−116,5; −42). Rebolo em (−116; −28). Livres: Caixa (−120,2; −42) (por isso o leque da serra sai para −x), arma de parede rpk (−104; −59,2), janelas (−96,5; −12), (−150; −20 e −45), (−115 e −135; −60), o vão para as Ruínas (z −60, x −111,5 a −107,5), o portão do Castelo (z −30, x > −96,5) e a porta da Floresta (−123; 0). ~13 draw calls (instâncias: 14 tiras, 9 luvas num atlas, dentes). O decalque da mancha é um plano só, com opacidade animada. `cullAdd` em tudo.

#### Base militar (c0) · ordem 4 · vigilância
- **Conceito:** posto de comando do cordão sanitário: daqui o Exército vigiava a vila e anotava cada família que tentava sair; quem era pego voltava para casa com uma cruz de cal na porta e o número no livro.
- **Como o terror aparece aqui:** o jogador sente que é observado por uma instituição, de longe e com método: a sirene espera no alto da torre, o binóculo de bateria acompanha cada passo e as chaves das casas já estão no quadro. Nada ataca; tudo registra.
- **Props únicos (9):**
  1. **Sirene de manivela no topo da torre de vigia** (a caixa de madeira 3×3×6,5 do tema em (117, −105) vira torre): plataforma 3,4×3,4 a 6,5 m com guarda-corpo de 4 ripas e, no meio, uma sirene de rotor (`CylinderGeometry(.35,.35,.5)` com aletas, manivela em caixa fina) virada para a vila. (só visual)
  2. **Quadro das chaves das casas** num cavalete: tábua 2,2×1,5 com `canvasTex` 512×384 (carimbo do Exército "CORDÃO 3 — CASAS FECHADAS") e 40 chaves de porta penduradas em pregos (`InstancedMesh`), cada uma com uma etiqueta de papel com o número da família; três pregos estão vazios. Em (128, −112), virado para oeste. (só visual)
  3. **Binóculo de bateria (luneta de tesoura) em tripé** (dois tubos em V de .07 × .5 m sobre três pernas de .9 m), em (134, −94); a cabeça gira (ver momento). (só visual)
  4. **Poste de alto-falantes**: poste de 5 m com 4 cornetas (`ConeGeometry` aberto, cinza-oliva) apontadas para os 4 cantos, fio descendo até um caixote de rádio, em (98, −82). (só visual)
  5. **Livro de registro de saídas sobre caixote de munição**: caixa .7×.45×.5 com livro aberto (plano com `canvasTex` em colunas "FAMÍLIA Nº / TENTOU SAIR / DEVOLVIDA À CASA", linhas à mão e a última em branco), em (122, −100). (só visual)
  6. **Cavalos de frisa com arame farpado** junto ao muro de fora, entre x 93 e 103 em z −146 (longe das janelas de x 85 e x 111): 4 cruzes de ripa de 1,1 m com arame (`LineSegments`). (só visual, encostado no muro)
  7. **Placa "ZONA DE QUARENTENA — ATIRA-SE SEM AVISO"**: tábua 1,6×.6 pregada no muro norte (z −72), em x 130, letras de estêncil vermelhas. (só visual)
  8. **Varal de cantis lacrados**: 8 cantis do Exército pendurados num arame entre dois sacos de areia, tampas presas com fita branca "NÃO BEBER — VEIO" (cilindros achatados instanciados + plano de fita), perto de (110, −130). (só visual)
  9. **Fotografias de vigilância em barbante**, dentro da barraca de (93, −108): 10 planos .12×.09 (atlas `canvasTex` de casas da vila tiradas daqui, com a porta de cada uma circulada a lápis) pendurados num fio. (só visual)
- **Momento de assinatura:** *o binóculo.* Se o jogador está dentro de 45 m da torre, a céu aberto, e fica parado 4 s, o binóculo de bateria gira devagar até ele (2 s) e passa a acompanhar cada passo dele por 5 s; ao mesmo tempo o alto-falante dá um chiado com três bipes descendentes (o "número") e a sirene da torre dá meia volta sozinha, com um gemido baixo que não chega a ser alarme. Depois o binóculo volta ao lugar. No máximo uma vez a cada 75 s. É seguro: só rotação de malhas e som; não mexe na luz real nem na névoa, não esconde zumbi e roda só no cliente (cada jogador é "anotado" na própria tela).
- **Animações ambientais (4):** rotor da sirene girando devagar com o vento (rotação com trancos); chaves do quadro tilintando quando o vento sobe (rotação em z com fase por chave); fotografias girando no barbante (rotação em y com fase por foto); aba de entrada das 4 barracas "respirando" (escala z do plano da aba, 0,25 Hz).
- **Luz e cor:** `#c8d4e0` (céu de aço), `#4a5a3a` (oliva), `#2a2e30` (aço), `#b8862e` (âmbar do registro). PointLight real: nenhuma nova; a lâmpada do pool em (139,9, −87,1) passa para `0xdfe8ff`. Emissivos: a lâmpada do rádio. Ao entrar: `gradePass` mais frio (tom −0,08), contraste +5%, saturação −10%; névoa `0x46505a`, perto 18 / longe 118.
- **Som ambiente:** vento no rotor da sirene (ruído passa-faixa 520 Hz, Q 3, ganho .04 subindo nas rajadas) + estática de rádio a cada 9 a 15 s (ruído passa-faixa 1,8 kHz, Q 4, 0,4 s) seguida às vezes de 3 senos 880/660/440 Hz de 120 ms.
- **Escalada:** depois da Mina e da Fábrica (lugares que prendem), aqui aparece pela primeira vez alguém organizado vigiando a vila. A ameaça deixa de ser só "os mortos" e passa a ser também quem mandava neles.
- **Implementação:** rect [72, 150, −150, −72]. Evitar: corredores Jc0 (x 60,5–72, z ≈ −109,5) e Lc0 (x ≈ 109,5, z −72 a −60,5), saída c0b02 (x 125, z −150); janelas (85, −150), (111, −150), (85, −72), (72, −137), (72, −85), (150, −111); arma commando (82,2, −116,5); Caixa (92,6, −117,9). Cerca de 35 malhas + 3 `InstancedMesh` (chaves 40, cantis 8, fotos 10); tudo em `cullAdd` com raio 70 m; o rotor e o binóculo só animam com o jogador a menos de 90 m. **Diferença para o Quartel (zGen `military`, linhas 782–787):** acrescentar um 5º campo "variante" às entradas de `T` (linhas 1210–1213) e ler `g.v` no `case 'military'`. A Base fica `posto`: contêineres oliva/aço como hoje, sacos de areia de areia, a torre ganha plataforma e sirene. Nada de colisão novo; trocar só cor/material depois do sorteio, nunca tirar nem pôr chamadas a `rr()` (o gerador é compartilhado: qualquer chamada a mais desloca arma, Caixa, lâmpadas e risers de todas as regiões seguintes).

#### Vinhedo (c2) · ordem 4 · infância corrompida
- **Conceito:** a escola trazia as crianças para a vindima; no dia em que o caminhão-ambulância passou, elas foram contadas no meio das parreiras e levadas para o "tratamento". O suco que ficou no lagar fermentou com a água do Veio e ficou preto.
- **Como o terror aparece aqui:** brincadeira e trabalho de criança interrompidos no meio, em escala pequena (tudo abaixo da cintura do jogador). O horror é a ausência delas e a ciranda que ainda tenta acontecer.
- **Props únicos (8):**
  1. **Cestinhos de vindima infantis de vime**, alça curta, etiqueta de papel com o número da família (62 a 75) amarrada: 14 instâncias (cilindro aberto .35 m + toro como alça), uns em pé com cachos pretos, outros virados, nos corredores entre fileiras. (só visual)
  2. **Lagar de pedra raso com caldo preto**: caixa baixa 3×2×.5 de pedra, superfície `MeshPhongMaterial` `0x1a0c1a` brilho 120, borda seca com respingos roxos (`canvasTex`), em (−88, 110). (só visual)
  3. **Carrocinha de brinquedo de caixote** (rodas de carretel, puxada por um barbante) cheia de cachos pretos, com uma boneca de sabugo de milho sentada em cima, de avental escolar azul-marinho de gola branca e uma cruz de cal pintada na cabeça. Em (−82, 86), no vão entre fileiras. (só visual)
  4. **Ciranda de estacas de parreira**: 7 estacas de 1 m em círculo de raio 1,6 m, cada uma com uma fita de cabelo desbotada amarrada (planos .04×.5 em cores apagadas), montinho de terra batida no meio. Em (−82, 110). (só visual)
  5. **Lousinha escolar de ardósia presa ao topo de uma estaca**, desenho a giz: um boneco deitado, pintado de cinza, com os olhos em dois risquinhos e a frase "PAPAI DORME MUITO" em letra de criança. Na ponta da fileira de (−96, 99). (só visual)
  6. **Caderno de caligrafia aberto sobre uma caixa de uva**, as linhas repetindo "ainda não acabou" em letra cursiva infantil; as folhas viram com o vento. Em (−118, 104). (só visual)
  7. **Gangorra de tábua sobre um barril de vinho** no corredor em (−88, 86), parada com uma ponta no chão e a outra no alto, como se houvesse uma criança sentada do lado de baixo (só visual, 0,9 m).
  8. **Cachos de uva preta pingando nas parreiras**: as 59 sebes do tema viram videiras; 3 cachos por sebe (177 instâncias de icosaedro `0x2a0f2a` com brilho) e uma gota que cai de um cacho a cada poucos segundos. (só visual)
- **Momento de assinatura:** *a ciranda.* Se o jogador fica parado 3 s a menos de 6 m da roda de estacas, uma melodia de ciranda (5 notas, senos levemente desafinados, longe e abafada) começa e as 7 fitas se levantam e giram em volta da roda (o grupo gira a .5 rad/s), como se mãos pequenas as segurassem correndo; marcas de mão de suco preto aparecem uma a uma nas estacas (7 decalques, .4 s cada). Para quando ele anda ou desvia o olhar mais de 60°; as marcas somem em 6 s. No máximo 1 vez por minuto. Seguro: só decalques e rotação, sem colisão, sem mexer em luz.
- **Animações ambientais (4):** fitas tremulando (rotação em z com ruído); folhas do caderno virando (rotação em x de 3 planos em sequência a cada 7–12 s); gangorra que estala e desce 2 cm do lado alto, de vez em quando, e volta; mosquinhas de fruta sobre o lagar (20 pontos em `Points` orbitando).
- **Luz e cor:** `#3a1e3a` (suco), `#c9b46a` (palha do vime), `#5a6a3a` (folha), `#e8dcc0` (gola branca). PointLight real: nenhuma; a lâmpada do pool em (−120,9, 88) passa para `0xffc890` mais fraca. Ao entrar: névoa um pouco arroxeada `0x4a3e4c`, `gradePass` quente e com saturação +5% (é o lugar mais "bonito" do anel, de propósito).
- **Som ambiente:** grilos (ruído passa-faixa 4,5 kHz, Q 8, com modulação de amplitude a 18 Hz, ligado e desligado em blocos de 1–3 s) + vespas no lagar (dente de serra 190 Hz com LFO de 6 Hz na frequência, ganho pela distância ao lagar).
- **Escalada:** no Acampamento (anel 2) a infância era brincadeira estragada; aqui fica claro que as crianças foram levadas, e o Programa aparece como algo que escolhia. Prepara o Anexo do asilo.
- **Implementação:** rect [−150, −72, 72, 150]; as sebes do tema correm ao longo de x a cada 5 m em z (de z 79), em blocos de 11 m com vãos de 3 m; os props ficam nos corredores (z = 81,5 + 5k) ou nos vãos. Evitar: corredores Oc2 (x −72 a −60,5, z ≈ 109,5) e Pc2 (x ≈ −109,5, z 60,5–72), saída c2b22 (x −125, z 150); janelas (−137, 72), (−85, 72), (−111, 150), (−150, 85), (−150, 111), (−72, 85); arma olympia (−124,9, 104,1); Caixa (−93,5, 89,8). O celeiro do tema não sai (não acha vão livre). Cerca de 25 malhas + 3 `InstancedMesh` (cestos 14, cachos 177, decalques 7). `cullAdd` raio 60 m.

#### Pântano (c1) · ordem 4 · presença invisível
- **Conceito:** o Exército não entrava no pântano, então era por ali que as famílias fugiam do cordão, à noite e descalças. Alguém continua atravessando.
- **Como o terror aparece aqui:** ninguém aparece, mas a lama, a água e os juncos mostram que alguém acabou de passar: pegadas na lama, juncos que se abrem, anéis na água. A presença é de quem fugia, não de quem caçava.
- **Props únicos (8):**
  1. **Touceiras de taboa** em volta das 6 poças: 300 instâncias de cone fino (.04 × 1,6 m) e espigas marrons; uma "trilha" na touceira da poça de (103,2, 109,1) fica aberta, como se alguém tivesse passado. (só visual)
  2. **Pinguela de tronco único** atravessando a poça de (86,7, 112,1) de ponta a ponta, apoiada em duas forquilhas. (só visual, a 0,3 m)
  3. **Jangada de bambu amarrada a uma estaca** na poça de (103,2, 109,1), com uma trouxa de pano e uma panela de barro com tampa. (só visual, boiando)
  4. **Guarda-chuva preto aberto, emborcado na lama**, com uma etiqueta "77" amarrada no cabo, em (122, 116). (só visual)
  5. **Covo de taquara pendurado num galho seco**, pesado, girando devagar, em (98, 92). (só visual, a 2,2 m)
  6. **Lençol de fuga esticado entre duas árvores secas** com "SOMOS 5" escrito a carvão, perto de (128, 128). (só visual, borda inferior a 2 m)
  7. **Rastro de pés descalços** (40 decalques instanciados de lama molhada) do corredor Mc1 até a beira da poça de (110,6, 89,6), terminando dentro da água. (só visual)
  8. **Vara de travessia cravada no meio da poça** de (132,1, 101,2), com um pano branco amarrado na ponta. (só visual)
- **Momento de assinatura:** *os juncos se abrem.* Com o jogador a menos de 15 m da touceira da poça de (103,2, 109,1) e olhando para ela (câmera dentro de 35°), uma trilha se abre na taboa diante dele, um tufo por vez (.6 s cada, 8 grupos), do corredor até a beira da água, como se alguém passasse agachado; os sapos calam de uma vez; no último tufo, a jangada afunda 5 cm e balança, e anéis se abrem na água. Dura 5 s; as taboas voltam ao lugar em 20 s. No máximo 1 vez a cada 90 s. Seguro: só rotação de instâncias de taboa e anéis aditivos; nada some, nada bloqueia; só no cliente.
- **Animações ambientais (4):** névoa rasteira (6 planos aditivos a .4 m derivando devagar); taboas balançando (rotação em grupo, 3 grupos defasados); jangada subindo e descendo (sen 0,3 Hz, 3 cm); anéis espontâneos nas poças (plano em anel que cresce e some, 1 a cada 6–14 s).
- **Luz e cor:** `#2e3a2c` (água verde-parda), `#6a7a4a` (lentilha d'água), `#b8c0a0` (névoa), `#e8e6da` (lençol). PointLight real: nenhuma; a lâmpada do pool em (101,5, 134,1) passa para `0xb8d0a0`. Ao entrar: névoa `0x3c463a`, perto 12 / longe 92; saturação −10%.
- **Som ambiente:** sapos (trens de 4 pulsos/s de seno 300 Hz com FM caindo para 240 Hz) que **param todos de uma vez** quando a presença passa (o silêncio é o aviso) + borbulho (ruído passa-baixa 250 Hz em rajadas de .2 s a cada 2–6 s).
- **Escalada:** no Lago (anel 1) a presença só "estava ali"; aqui ela deixa rastro e cruza perto do jogador. É o primeiro lugar onde a presença tem pressa.
- **Implementação:** rect [72, 150, 72, 150]; poças do tema em (120,2, 127,1) 8,2×8,2; (86,7, 112,1) 11,3×9,4; (132,1, 101,2) 7,8×9,9; (110,6, 89,6) 8,6×5,6; (103,2, 109,1) 11,6×6,1; (91,2, 130,9) 7,2×6,6. Evitar: corredores Mc1 (x ≈ 109,5, z 60,5–72) e Nc1 (x 60,5–72, z ≈ 109,5), saída c1b12 (150, 125); janelas (85, 72), (137, 72), (111, 150), (72, 85), (72, 137), (150, 111); arma spas (104,6, 121,2); Caixa (138,4, 89,6). A cabana do tema não sai. Cerca de 20 malhas + 3 `InstancedMesh` (taboas 300, pegadas 40, espigas 120). **Diferença para o Brejo negro (zGen `swamp`, linhas 788–792; água em `zGenDeco`, 852–853):** a água deixa de ser um material único para as duas: `deco.water` passa a guardar o id da região e o Pântano usa `0x24301f` com textura de lentilha d'água (pontos verdes em `canvasTex`), brilho 40. A vegetação viva (taboas) é só do Pântano.

#### Ruínas da cidade (c3) · ordem 4 · som fora do lugar
- **Conceito:** o "centro" de São Lázaro (agência dos Correios, central telefônica, cinema, farmácia), esvaziado às pressas e dinamitado pelo Exército para não servir de abrigo. A central telefônica ainda chama os números das famílias.
- **Como o terror aparece aqui:** sons de máquinas de gente (campainha, caixa registradora, projetor) vêm de onde não há máquina. Quando o jogador chega perto, o som muda de lugar; quando olha para a fonte certa, ele para no meio.
- **Props únicos (7):**
  1. **Mesa telefônica (central manual) de madeira**: caixa 1,6×.6×1,4 com painel de 60 tomadas numeradas (`canvasTex`), cabos de pino pendurados (`LineSegments` com pesos), cadeira giratória da telefonista com o fone apoiado no encosto. Em (−136, −124), encostada no muro de tijolo. (só visual)
  2. **Cabine telefônica pública de madeira** com porta de vidro rachado (plano com `canvasTex` de rachadura) e o aparelho de parede de manivela pendurado pelo fio, balançando; em (−100, −118). (só visual)
  3. **Letreiro do Cine São Lázaro** preso a um pedaço de muro: tábua 4×.8 com letras faltando, "CINE S. LÁ  ARO — HOJE: A VOLTA", e o cartaz colado embaixo, desbotado. Na parede de (−139, −104). (só visual)
  4. **Balcão da farmácia com frascos azul-cobalto** do "TÔNICO VASCONCELLOS — DISTRIBUIÇÃO GRATUITA": balcão 2,4×.6×1 e 20 frascos instanciados (cilindro + gargalo) com rótulo. Em (−136, −94). (só visual)
  5. **Coluna de correio de ferro amarela** transbordando, 30 envelopes espalhados no chão com carimbo roxo "DEVOLVIDO — QUARENTENA" (planos instanciados). Em (−100, −142). (só visual)
  6. **Caixa registradora do armazém** numa janela de muro, de ferro trabalhado, com a gaveta aberta e as teclas de preço levantadas em "0 · 4 · 1 · 2". No muro de (−86, −93). (só visual)
  7. **Rolo de filme desenrolado** saindo de uma lata de projeção amassada e se enroscando nos tijolos por 6 m (fita plana preta brilhante em curva). Perto de (−124, −88). (só visual)
- **Momento de assinatura:** *o telefone onde não há telefone.* Com o jogador a menos de 30 m da mesa telefônica, a cada 60–120 s uma campainha de telefone (dois tons, modulação de 20 Hz) toca de uma direção vazia, atrás de um muro. Se ele vai até lá, o som "pula" para outro ponto na segunda chamada; na mesa, uma lampadinha acende na tomada com o número de uma família. Se ele olha para a mesa (câmera dentro de 20°) enquanto toca, a campainha corta no meio do toque e o aparelho da cabine balança uma vez. Dura até 8 s. Seguro: só som posicional e um emissivo.
- **Animações ambientais (3):** envelopes deslizando com o vento (deslocamento em xz, até 0,5 m, voltam devagar); poeira de reboco caindo do topo dos muros (sprites reciclados, 1 a cada 3 s, perto do jogador); fone da cabine balançando no fio (pêndulo amortecido).
- **Luz e cor:** `#6a7480` (reboco frio), `#2a3038` (sombra), `#d8a040` (âmbar da lampadinha), `#1c3a8a` (cobalto). PointLight real: nenhuma; lampadinhas emissivas. Ao entrar: névoa azul-cinza `0x4a4e56`, `gradePass` frio, granulação +.
- **Som ambiente:** vento canalizado entre os muros (ruído passa-faixa 600 Hz, Q 1,2, LFO 0,1 Hz no ganho) + estalos de reboco (cliques de ruído de 5 ms, passa-alta 2 kHz, a cada 2–7 s, em posições aleatórias com semente).
- **Escalada:** no Cemitério (anel 1) o som fora do lugar era vago; aqui ele é feito por gente tentando se comunicar e não conseguindo. Ninguém atende do outro lado do vale.
- **Implementação:** rect [−150, −72, −150, −72]; chaminé do tema (3×3×9) em (−111, −111). Evitar: corredores Qc3 (x ≈ −109,5, z −72 a −60,5) e Kc3 (x −72 a −60,5, z ≈ −109,5), saída c3b32 (−150, −125); janelas (−137, −150), (−111, −150), (−137, −72), (−150, −137), (−150, −111), (−72, −137); arma m14 (−110,2, −127,5); Caixa (−83,3, −103,1). Cerca de 25 malhas + 2 `InstancedMesh` (frascos 20, envelopes 30). **Diferença para o Bairro queimado (zGen `ruins`, linhas 777–781):** aqui os tijolos ficam inteiros e frios, com remendos de reboco caiado (cor `0x9a6a50` e manchas claras na textura) e quebras retas de dinamite; a chaminé fica como a chaminé da padaria, com a boca do forno de lenha aberta na base (só visual). Trocar só a cor (`c`) dos `put` depois do sorteio, sem mexer nas chamadas a `rr()`.

#### Margem do rio (b10) · ordem 4 · algo que se move quando não observado
- **Conceito:** o lugar das lavadeiras. Quando a água escureceu, veio a ordem de jogar no rio as roupas das casas marcadas, "para não contaminar". As trouxas nunca desceram com a correnteza: voltam para a margem.
- **Como o terror aparece aqui:** objetos domésticos e moles (trouxas de roupa) que, cada vez que o jogador olha para outro lado, estão um pouco mais perto. Nunca se movem na frente dele.
- **Props únicos (7):**
  1. **Trouxas de roupa amarradas em lençol com uma cruz de cal pintada no nó**: 9 trouxas (esfera achatada + nó em toro), espalhadas na margem leste; são as que se movem. (só visual)
  2. **Lajes de bater roupa** inclinadas na beira (6 caixas de pedra .9×.6×.2 a 20°) com **tábuas de esfregar** de madeira, cada uma com o sobrenome de uma família entalhado (`canvasTex`). Na margem de x 194–196, entre z −150 e −125. (só visual)
  3. **Barras de sabão de cinza secando numa tábua** entre duas forquilhas, de (180, −122) a (186, −122): o sabão caseiro das lavadeiras, cinzento, cada barra marcada com a inicial de uma casa. (só visual, a 1 m)
  4. **Bacias de ágata brancas com borda azul**, cheias de água preta (5, uma emborcada), perto das lajes. (só visual)
  5. **Canoa de tábua emborcada** na margem oeste, com números de família riscados a cal no casco em sequência (12, 13, 14, 15, …), em (216, −62). (só visual)
  6. **Régua de enchente** pintada numa estaca na beira (204,5, −98), com uma faixa preta marcada "ÁGUA PRETA — 03/1957". (só visual)
  7. **Ferro de passar a brasa** sobre uma pedra, com a tampa aberta e brasas fracas (emissivo pulsando), em (186, −86). (só visual)
- **Momento de assinatura:** *as trouxas.* Sempre que uma trouxa fica 2 s fora do campo de visão do jogador (fora de 70° da câmera) e ele está a menos de 30 m dela, a mais próxima desliza 1,5 m em direção à última posição dele, por uma trilha pré-calculada (nunca a menos de 2 m dele, nunca sobre porta, janela, arma, Caixa, ponte ou água). Quando ele volta a olhar, estão paradas. Cada trouxa anda no máximo 6 m da origem; depois de 40 s sem o jogador por perto, voltam ao lugar, também só quando não observadas. Seguro: são só visuais, sem colisão e sem rede (cada jogador vê as suas).
- **Animações ambientais (4):** correnteza (rolagem de UV no plano do rio, 0,15 m/s, só nesta região); o pano de bater roupa secando na laje, levantando a ponta com o vento; espuma acumulada na beira (sprites brancos que oscilam na borda da água); brasa do ferro pulsando (intensidade emissiva 0,6–1,0, ruído lento).
- **Luz e cor:** `#2a3a40` (rio), `#8a8a84` (roupa cinza), `#3a5a7a` (borda das bacias), `#ff7a30` (brasa). PointLight real: nenhuma; a lâmpada do pool em (189,3, −86) passa para `0xe8e0d0`. Ao entrar: névoa clara e úmida `0x50585c`, perto 20 / longe 120.
- **Som ambiente:** correnteza (ruído rosa → passa-baixa 900 Hz, LFO 0,2 Hz no ganho) + batidas de roupa na pedra rio acima (2 a 3 baques de ruído passa-baixa 150 Hz a cada 15–25 s, panorâmica para o norte).
- **Escalada:** na Fazenda o que se movia era de fora (o espantalho) e na Floresta era uma família inteira pendurada nos galhos, voltando para casa; aqui são as trouxas de quem foi levado, jogadas no rio, e elas vêm atrás do jogador.
- **Implementação:** rect [160, 240, −160, −30]; rio ao longo de z em x 196–204; pontes de tábuas em z −116,7 e −73,3. Evitar: corredor Lb10 (x 150,5–160, z ≈ −38), portas b10b11 (184, −30) e b10b02 (184, −160); janelas em x 160 e x 240 nos z −143,7, −111,2 e −78,7; arma galil (229,6, −96,9); Caixa (228,4, −128,7). Trilhas das trouxas: só na margem leste (x 164–192), longe das janelas. Cerca de 25 malhas + 2 `InstancedMesh` (trouxas 9, espuma 30). **Diferença para a Ponte velha (zGen `river`, linhas 749–752 e 793):** a água ganha material por região (Margem: `0x2a3a40` com rolagem de UV, brilho 80; Ponte: parada e mais escura). As duas pontes de tábuas da Margem ficam baixas e simples (tábuas com corda de guarda); a ponte coberta é só da Ponte velha. Os 8 caixotes do tema viram cestos de roupa (cor `0x8a7a5a`, sem mexer no sorteio).

#### Bairro queimado (b30) · ordem 4 · religioso (purificação pelo fogo)
- **Conceito:** uma irmandade de fiéis, os Penitentes da Cal, decidiu que só o fogo limpava a febre: queimou as casas marcadas com cruz de cal com tudo o que havia dentro, em procissão. O padre já tinha sido levado pelo Programa; a irmandade seguiu sozinha, e ficou o andor.
- **Como o terror aparece aqui:** a fé virou fanatismo e o ritual continua sem ninguém. As cruzes brancas sobrevivem no meio do carvão, as brasas nunca apagam e a procissão ainda passa ao longe.
- **Props únicos (8):**
  1. **Andor de procissão carbonizado** sobre dois cavaletes, com o santo reduzido a uma silhueta de madeira queimada, sem rosto, e flores de papel derretidas. Em (−214, 80). (só visual)
  2. **Batentes de porta em pé sozinhos**, sem casa em volta, cada um com a cruz de cal intacta no meio do carvão: 6 batentes (3 caixas finas cada) em linha ao longo da rua central (x ≈ −200). (só visual)
  3. **Piras de colchões de palha e retratos de família**, 3 montes em brasa (caixas achatadas + planos de moldura) com textura de brasa emissiva; a do centro, em (−196, 74), tem a luz real. (só visual)
  4. **Estandarte da irmandade**: pano roxo chamuscado numa vara de 3 m, "PURGAI" bordado em linha amarela e uma cruz de cal; em (−226, 134). (só visual)
  5. **Matracas de Semana Santa** de madeira penduradas num poste queimado (4, de tamanhos diferentes), em (−172, 122). (só visual)
  6. **Coroas trançadas de arame farpado do cordão**, penduradas nos batentes do item 2 (toros finos instanciados). (só visual)
  7. **Montes de telha de barro vitrificada pelo calor** (60 telhas instanciadas, brilho alto, cor `0x6a2a1a`), ao pé dos muros. (só visual)
  8. **Baldes de cal virados com broxas queimadas**: 5 baldes de zinco tombados, uma língua de cal branca no chão e as broxas pretas. Em (−184, 116). (só visual)
- **Momento de assinatura:** *a procissão de brasas.* Quando o jogador está na rua central (x −210 a −190) e olha ao longo dela (câmera dentro de 25° de +z ou −z), longe, entre 40 e 60 m, uma fila de 12 brasas a 1,5 m de altura (sprites aditivos laranja, 2 m entre si) atravessa a rua devagar de uma ruína para outra, como velas de procissão, com matracas soando longe. Se ele chega a menos de 25 m ou passam 6 s, as brasas apagam uma a uma, de trás para a frente. No máximo 1 vez a cada 2 min. Seguro: só sprites pequenos, sem flash, sem colisão.
- **Animações ambientais (4):** brasas das piras pulsando (emissivo com ruído); fumaça subindo das piras (20 sprites reciclados por pira); páginas de missal queimadas planando no vento (12 planos reciclados, só nesta região); estandarte tremulando.
- **Luz e cor:** `#ff6a20` (brasa), `#2a2420` (carvão), `#e8e4d8` (cal), `#5a2a4a` (roxo da irmandade). PointLight real: 1, na pira central (uma lâmpada do pool desta região levada para (−196, 74, y 1,2), cor `0xff7a30`, tremulação de ±20%). Ao entrar: névoa marrom-fumaça `0x4a3a34`, perto 15 / longe 100; `gradePass` quente, contraste +8%.
- **Som ambiente:** crepitar (cliques de ruído de 3–8 ms, passa-alta 2 kHz, 8 a 20 por segundo, taxa variando devagar) + bafo de fornalha (ruído passa-baixa 80–150 Hz, ganho baixo, LFO 0,05 Hz); durante o momento, matracas (rajadas de 12 cliques secos de ruído passa-faixa 900 Hz).
- **Escalada:** na Igreja (anel 1) a fé era sino e banco vazio; aqui ela queima casas. Primeira vez que a vila faz mal a si mesma, e o fogo anuncia o Crematório.
- **Implementação:** rect [−240, −160, 30, 160]. Evitar: corredor Pb30 (x −160 a −150,5, z ≈ 38), portas b30b31 (−184, 30) e b30b22 (−184, 160); janelas em x −240 e x −160 nos z 46,3, 78,8 e 111,3; arma mp40 (−200,9, 110); Caixa (−227,8, 96,5). Os batentes na rua central passam longe da arma (z 40–100). Cerca de 30 malhas + 4 `InstancedMesh` (telhas 60, coroas 6, páginas 12, fumaça 60 sprites). **Diferença para as Ruínas da cidade (zGen `ruins`):** os 87 muros do Bairro ficam carbonizados (material novo `char` = `['brick', 0x2b2420]` com topo irregular de brasa emissiva fraca numa faixa de 10 cm), e os 10 entulhos viram montes de cinza (`0x3a3632`). Trocar o material depois do sorteio, sem mudar o número de chamadas a `rr()`.

#### Encosta (b00) · ordem 4 · isolamento
- **Conceito:** a trilha de fuga pela serra: as famílias tentaram subir a encosta para sair do vale; o Exército cortou os fios do telégrafo e ninguém do outro lado ouviu. Quem chegou ao pilar ficou esperando.
- **Como o terror aparece aqui:** o jogador percebe que não existe "fora": a trilha termina num muro, os fios estão cortados, a bagagem foi sendo largada até sobrar nada. O vazio e o vento fazem o trabalho.
- **Props únicos (7):**
  1. **Postes de telégrafo inclinados** subindo a encosta em linha (5 postes de 6 m, de (−140, −172) a (−56, −220)), com isoladores de vidro verde (emissivo fraco) e fios cortados pendendo até o chão. (só visual)
  2. **Trilha de bagagem largada** em ordem de peso: baú de madeira, um relógio de parede embrulhado num cobertor, duas sacolas de palha, uma lata de mantimento e, por último, um par de óculos; 8 peças com etiqueta de número, ao longo da linha dos postes. (só visual)
  3. **Marco de divisa de pedra** com placa de ferro "DIVISA DO MUNICÍPIO — 2 km", o "2 km" coberto a cal e reescrito: "NÃO HÁ SAÍDA". Em (−146, −220). (só visual)
  4. **Cadeirinha de arrimo de vime** (de carregar idoso nas costas), com alças de couro, largada de lado no meio da trilha, em (−110, −196). (só visual)
  5. **Espelho de barbear numa estaca** apontado para o vale, girando devagar no vento; reflete um brilho (sprite) quando alinha com o sol. Em (−80, −226). (só visual)
  6. **Recados riscados no pilar de pedra** (o pilar 3×3×12 do tema em (−95, −200)): decalque com dezenas de inscrições a canivete e a carvão, de mãos diferentes, até 2 m de altura: "FAMÍLIA 77 PASSOU AQUI", "ESPEREM NO PILAR", "NINGUÉM VEM", setas para cima. (só visual)
  7. **Fogueira de sinal nunca acesa** no topo do pilar: lenha empilhada em pirâmide, vista de baixo contra o céu, e uma caixa de fósforos molhada caída ao pé do pilar. (só visual)
- **Momento de assinatura:** *o sinal sem resposta.* Se o jogador está a mais de 25 m da porta mais próxima, parado 5 s e sem nenhum zumbi vivo a menos de 40 m, o espelho na estaca gira sozinho até pegar o sol e manda três clarões para o alto da serra (sprite de brilho na estaca + feixe fino aditivo, opacidade .12), e o vento cai a quase nada. Da serra, ninguém responde. Depois de 4 s, um único clarão responde de longe, do outro lado do vale, na direção do Sanatório; o vento volta. No máximo 1 vez a cada 2 min; cancela na hora se um zumbi entrar nos 40 m. Seguro: só sprites e som, sem mexer na névoa nem na luz real; só no cliente.
- **Animações ambientais (4):** fios cortados balançando (pêndulo por fio, fases diferentes); capim alto da encosta ondulando (3 grupos de tufos instanciados girando ±4° defasados); espelho girando na estaca; cascalho rolando morro abaixo (sprite pequeno a cada 8–15 s, do alto para baixo).
- **Luz e cor:** `#7a5a3a` (terra vermelha do barranco), `#8a9a9a` (céu de serra), `#2a8a6a` (vidro dos isoladores), `#e8e8e0` (brilho do espelho). PointLight real: nenhuma. Ao entrar: névoa pálida e fria `0x6a6e72`; `gradePass` com saturação −15% e menos granulação (vazio limpo).
- **Som ambiente:** vento de serra (ruído passa-faixa 350 Hz, Q .7, LFO de 0,08 Hz com profundidade grande) + zumbido do fio (senos 180 e 360 Hz, ganho seguindo o LFO do vento).
- **Escalada:** na Pedreira (anel 2) o isolamento era um beco sem saída; aqui o jogador entende que ninguém saiu do vale e ninguém de fora sabe. É o primeiro silêncio total da Vila.
- **Implementação:** rect [−160, −30, −240, −160]. Evitar: corredor Kb00 (x ≈ −38, z −160 a −150,5), portas b00b01 (−30, −184) e b00b32 (−160, −184); janelas em z −240 e z −160 nos x −143,7, −111,2 e −78,7; arma dragunov (−54,8, −196,6); Caixa (−63,1, −214,3). Cerca de 30 malhas + 2 `InstancedMesh` (isoladores 15, tufos 90). **Diferença para o Pico (zGen `rocks`, linhas 771–776):** as 41 pedras da Encosta ficam escuras e avermelhadas (`0x6a4a38`, terra de barranco), o chão ganha sulcos de erosão (decalques); o pilar de 12 m só existe aqui. O Pico fica com granito claro. Trocar a cor depois do sorteio.

#### Cais (b20) · ordem 4 · claustrofobia
- **Conceito:** o embarque da quarentena: famílias de fora do vale foram mandadas esperar nos contêineres o barco que ia levá-las, trancadas por fora "para a própria segurança". O barco nunca veio.
- **Como o terror aparece aqui:** num pátio aberto, o céu some: contêineres empilhados viram paredões e lonas alcatroadas fecham o alto. O jogador anda em corredores de aço e ouve que ainda tem alguém dentro.
- **Props únicos (8):**
  1. **Pilhas de contêineres lacrados**: segunda e terceira camada só visuais sobre os 4 contêineres do tema ((101, 228), (114, 181), (105, 176), (68, 193)), até 7,8 m, com portas soldadas, números de família pintados e, visto pela fresta, o desenho de um barco feito a giz por dentro, repetido em todos (`canvasTex`). (só visual, acima de `ZTOP`)
  2. **Lonas alcatroadas esticadas a 3,6 m** entre os 3 mastros do tema ((83, 235), (50, 191), (46, 231)) e as pilhas, formando um teto escuro e baixo com rasgos (planos opacos `0x2a2620` com furos em `alphaTest`). (só visual)
  3. **Rede de carga pendurada** de um mastro, a 6 m, com sacos de estopa de formas compridas dentro, girando devagar. Em (50, 191). (só visual)
  4. **Contêiner de porta entreaberta** (o de (68, 193)): folha da porta aberta 30° e, no vão, um plano escuro com arranhões de unha e um colchão de palha à vista; a colisão do contêiner não muda. (só visual)
  5. **Correntes de navio com lacres de chumbo do Exército numerados** nas portas de todos os contêineres (elos instanciados + disco de lacre). (só visual)
  6. **Baldes sanitários de zinco** ao lado de cada porta, com o mesmo número da porta pintado (8 baldes). (só visual)
  7. **Quadro de chamada do embarque** "EMBARQUE — AGUARDE A CHAMADA DO SEU NÚMERO" com placas de número viráveis mostrando "000", na parede do barracão de madeira do tema ((95, 200), 12×4×4). (só visual)
  8. **Respiros furados a prego** nas paredes dos contêineres: decalque de dezenas de furinhos com um brilho fraco por trás (emissivo). (só visual)
- **Momento de assinatura:** *os respiros.* Com o jogador a menos de 3,5 m de um contêiner e olhando para ele (dentro de 40°), os furinhos de respiro da porta se apagam um a um, de cima para baixo, como se alguém lá dentro passasse o rosto por eles; um sopro de ar quente sai pelos furos (6 sprites finos), a corrente da porta treme e cai poeira de ferrugem pela fresta. Dura 4 s; depois o brilho volta. Cada contêiner no máximo 1 vez a cada 3 min. Seguro: emissivo, partículas e som baixo; nada se abre, nada sai.
- **Animações ambientais (4):** lonas ondulando (rotação e escala leves dos planos, 0,3 Hz); rede de carga girando no cabo; correntes balançando (pêndulo pequeno); poeira de ferrugem caindo das bordas das pilhas (sprites marrons, poucos).
- **Luz e cor:** `#3a3e40` (aço), `#7a3a24` (ferrugem), `#e8e0c8` (giz), `#2a2620` (lona). PointLight real: nenhuma nova; a lâmpada do pool em (83,9, 185,8) passa para `0xffb060` e fica sob a lona (luz presa embaixo). Ao entrar: névoa cinza-chumbo `0x3e4246`, perto 14 / longe 95; `gradePass` com vinheta mais forte.
- **Som ambiente:** rangido de contêiner dilatando (FM: portadora 90 Hz, moduladora 3 Hz, índice subindo e descendo em 1,5 s, a cada 6–11 s) + água batendo nas estacas do cais (ruído passa-baixa 300 Hz em pulsos a 0,5 Hz).
- **Escalada:** no Porto (anel 3) a presença era invisível e solta; aqui ela está trancada, e o espaço aberto passa a apertar. É a primeira vez que a quarentena aparece como prisão.
- **Implementação:** rect [30, 160, 160, 240]. Evitar: corredor Nb20 (x ≈ 38, z 150,5–160), portas b20b21 (30, 184) e b20b12 (160, 184); janelas em z 160 e z 240 nos x 46,3, 78,8 e 111,3; arma ak74u (105,1, 184,7) (a pilha de (105, 176) fica a 9 m: manter a pilha baixa nesse lado para a placa ficar visível); Caixa (92,1, 229,7) (a pilha de (101, 228) não cobre a Caixa: a 2ª camada recua 1 m). As lonas ficam a 3,6 m e não passam sobre a arma nem a Caixa. Cerca de 30 malhas + 2 `InstancedMesh` (elos 120, baldes 8). **Diferença para o Estaleiro (zGen `yard`, linha 806):** o Cais mantém os contêineres de aço (e ganha as pilhas); os mastros viram paus de carga com rede. No Estaleiro, os contêineres viram barracões de madeira e os mastros viram escoras do casco.

#### Pico da montanha (b02) · ordem 5 · falsa segurança
- **Conceito:** o abrigo dos guardas florestais no pico, onde o Exército montou a estação de rádio. Está tudo arrumado, o braseiro aceso e o rádio tocando; dali se vê o Sanatório Santa Inês iluminado, como uma promessa de socorro.
- **Como o terror aparece aqui:** é o lugar mais acolhedor da Vila, de propósito: luz quente, cobertores, sopa, música. O jogador quase relaxa, até perceber que o socorro prometido vem justamente do Sanatório.
- **Props únicos (8):**
  1. **Mastro de rádio treliçado** de 12 m com luz vermelha de topo piscando (emissivo), cabos de estai finos. Em (156, −214). (só visual)
  2. **Alpendre de pedra com telhado de zinco** sobre a caixa de metal do tema ((174, −209), 6×2×1,2, que vira banco de pedra): 4 pilares finos e telhado a 2,8 m. (só visual)
  3. **Transmissor de campanha** sobre o banco, mostrador âmbar aceso, fone pendurado e um bloco com a última mensagem: "RESGATE CONFIRMADO. AGUARDEM A AMBULÂNCIA." (só visual)
  4. **Braseiro de tambor cortado** com brasas e uma chaleira esmaltada fumegando, ao lado do banco, em (168, −204). (só visual)
  5. **Pilha de cobertores do Exército dobrados** com uma panela tampada e um bilhete "SOPA QUENTE — RESERVADA P/ OS QUE CHEGAREM". (só visual)
  6. **Placa pintada à mão** "AQUI É SEGURO — O SOCORRO VEM DO SANATÓRIO", com seta apontando para o horizonte, em (198, −202). (só visual)
  7. **Silhueta do Sanatório Santa Inês no horizonte**: plano de 46×16 m além do muro de fora (z ≈ −330, x 170), `fog:false`, `canvasTex` com o prédio em contraluz e 24 janelas quentes (emissivas por máscara); só desenhada com o jogador dentro do Pico. (só visual)
  8. **Cruzeiro de ferro do cume com ex-votos de cera** (pulmões, cabeças e mãos pequenas pendurados por fita), em (216, −190). (só visual)
- **Momento de assinatura:** *as janelas apagam.* Se o jogador olha para a silhueta do Sanatório (câmera dentro de 10°) e fica parado 3 s, as 24 janelas apagam uma a uma, andar por andar (.15 s cada), até sobrar só uma, no alto, mais vermelha. Ao mesmo tempo o rádio troca o samba-canção pelos três bipes descendentes (os mesmos do posto da Base militar). Quando ele desvia o olhar por 10 s, tudo volta a estar aceso e o samba-canção recomeça. Seguro: só uma textura distante e som; o mapa jogável não muda.
- **Animações ambientais (4):** vapor da chaleira (sprites brancos curtos); luz vermelha do mastro piscando a 1 Hz; fitas dos ex-votos tremulando; brasas respirando no braseiro (emissivo e uma faísca a cada 2–4 s).
- **Luz e cor:** `#ffb060` (braseiro), `#f0d8a0` (janelas do Sanatório), `#9a968c` (granito claro), `#c0d0e0` (geada nas pedras). PointLight real: 1, o braseiro (a lâmpada do pool em (170, −221,9) levada para (168, −204, y 1), `0xff9a50`, tremulação suave). Ao entrar: névoa mais rala e longe (perto 30 / longe 160: a vista "limpa" é a isca), `gradePass` quente e com menos granulação.
- **Som ambiente:** samba-canção de rádio (2 senos tocando uma melodia simples em 2/4, passa-faixa 300–3.000 Hz, chiado de fundo e leve variação de afinação) + crepitar suave do braseiro (cliques esparsos, 2 a 4 por segundo).
- **Escalada:** depois de vigilância, fogo e prisão, o Pico oferece alívio, e o alívio é a armadilha: o socorro anunciado é o próprio Programa. É o primeiro lugar que aponta o Sanatório como destino.
- **Implementação:** rect [100, 240, −240, −160]. Evitar: corredor c0b02 (x ≈ 125, z −160 a −150,5), portas b01b02 (100, −184) e b10b02 (184, −160); janelas (114, −240), (142, −240), (198, −240), (114, −160), (142, −160), (240, −200); arma hk21 (223,1, −176,2); Caixa (183,1, −181,2). O mastro e o alpendre ficam a mais de 12 m da Caixa. Cerca de 30 malhas; silhueta com `cullAdd` por região (ligar só com o jogador no Pico). **Diferença para a Encosta (zGen `rocks`):** as 43 pedras do Pico ficam claras (`0x9a968c`) com geada no topo (segundo material com faixa clara em cima, por cor de vértice); sem pilar, sem terra vermelha, sem fios. Trocar só a cor depois do sorteio.

#### Estaleiro (b22) · ordem 5 · loop/repetição
- **Conceito:** o estaleiro construía a "Arca de São Lázaro", o barco que levaria a vila embora. Os carpinteiros, já com a febre cinza, continuaram trabalhando: tiravam e pregavam de novo as mesmas tábuas. O casco nunca fica pronto.
- **Como o terror aparece aqui:** tudo repete: o mesmo martelo, na mesma sequência, a mesma tábua que sai e volta, o mesmo dia no calendário, o mesmo nome pintado cinco vezes. O jogador percebe o ciclo e entende que a vila parou num dia só.
- **Props únicos (8):**
  1. **Casco de barco em construção** sobre o berço (a caixa de madeira 12×4×4 do tema em (−170, 200)): 14 cavernas curvas de 5 m (caixas finas dobradas por `mergeGeos`), metade de um costado tabuado. (só visual, acima da caixa)
  2. **Carreira de lançamento** de dormentes engraxados descendo do berço até perto do muro oeste (30 dormentes instanciados no chão, 4 cm de altura). (só visual)
  3. **Quadro de ferramentas com 12 contornos pintados** e as 12 ferramentas penduradas todas iguais (a mesma marreta de calafate repetida, cada uma com "S.L." gravado), na parede do barracão de (−139, 200). (só visual)
  4. **Pilhas de tábuas numeradas a giz** em sequência que recomeça (1, 2, 3, 1, 2, 3…), 4 pilhas baixas perto do casco, em (−184, 180). (só visual)
  5. **Caldeirão de piche** sobre fogo baixo, borbulhando preto, com concha de cabo longo, em (−154, 222). (só visual)
  6. **Proa com o nome pintado e repintado**: "SÃO LÁZARO" pintado por cima de si mesmo cinco vezes, cada camada mais torta (`canvasTex` em camadas). (só visual)
  7. **Talha de corrente** no mastro do tema em (−173, 216), erguendo e baixando uma tábua num ciclo exato. (só visual)
  8. **Calendário de parede do mestre de obras** no barracão de (−120, 185), todos os quadradinhos riscados com a mesma data escrita por cima: "14 SET". (só visual)
- **Momento de assinatura:** *o mesmo dia.* Um ciclo de 12 s roda sempre igual (semente fixa): três marteladas, pausa, três marteladas; a talha sobe a tábua; uma tábua do costado escorrega e cai. Se o jogador olha o casco por 4 s (dentro de 30°), vê a tábua cair; quando desvia o olhar, ela está de volta no lugar e o ciclo recomeça do primeiro golpe, idêntico. Toda vez que alguém entra na área, o ciclo reinicia do zero. Seguro: só animação e som; o casco não tem colisão nova.
- **Animações ambientais (3):** talha subindo e descendo (ciclo de 12 s, presa ao mesmo relógio do martelo); piche borbulhando (esferas que crescem e somem na superfície); fumaça fina do caldeirão (sprites escuros).
- **Luz e cor:** `#6a4a2a` (madeira nova), `#141210` (piche), `#c8a060` (lâmpada de oficina), `#7a8a8a` (céu de porto). PointLight real: nenhuma nova; a lâmpada do pool em (−212,7, 201,2) passa para `0xffc070`. Ao entrar: névoa marrom-clara `0x524a40`, `gradePass` levemente sépia.
- **Som ambiente:** martelo de calafate em ciclo exato de 12 s (rajada de ruído passa-faixa 1,2 kHz + seno 220 Hz curto, ×3, pausa, ×3), sempre com as mesmas pequenas variações + piche borbulhando (blips de ruído passa-baixa 200 Hz).
- **Escalada:** na Estação e na Fábrica a repetição era de máquina; aqui é de gente tentando fugir, e o loop é a esperança que nunca termina. É desespero, não estranheza.
- **Implementação:** rect [−240, −100, 160, 240]. Evitar: corredor c2b22 (x ≈ −125, z 150,5–160), portas b21b22 (−100, 184) e b30b22 (−184, 160); janelas (−142, 160), (−114, 160), (−198, 240), (−142, 240), (−114, 240), (−240, 200); arma hk21 (−116,3, 176,9); Caixa (−111,3, 204,4) (o barracão de (−127, 206) fica entre a Caixa e o casco: o quadro de ferramentas vai na face oeste). Cerca de 35 malhas + 1 `InstancedMesh` (dormentes 30). **Diferença para o Cais (zGen `yard`):** no Estaleiro, os 4 contêineres viram barracões de tábua (material `plank`, cor `0x6a4a32`, e um telhadinho só visual por cima) e os 3 mastros de metal viram escoras de madeira do casco (cor `0x5e4630`); os 10 caixotes viram pilhas de tábua (só cor). Nenhuma colisão nova; trocar só material/cor depois do sorteio.

#### Bosque (b12) · ordem 5 · vigilância
- **Conceito:** os enfermeiros do Programa caçavam os fugitivos pelo bosque; montaram jiraus de espera nas árvores e pregaram nos troncos os números das famílias que faltavam. Ainda estão de vigia.
- **Como o terror aparece aqui:** diferente da Base militar (vigilância de longe, institucional), aqui quem vigia é o Sanatório, de perto, entre as árvores, de jaleco. A sensação é de ser acompanhado por alguém que sabe o seu número.
- **Props únicos (7):**
  1. **Jiraus de espera** a 4 m em 3 troncos, com escada de ripas pregadas no tronco e um jaleco branco pendurado na borda, balançando; nas árvores do tema mais próximas de (186, 156), (216, 192) e (222, 126). (só visual)
  2. **Plaquinhas de lata com números de família** pregadas nos troncos à altura dos olhos: 30 instâncias, numeração salteada (o bosque é uma lista). (só visual)
  3. **Olhos pintados a cal nos troncos**, na altura do rosto, sempre nos troncos virados para as portas (12 pares de decalques). (só visual)
  4. **Lanternas de querosene de ronda** penduradas em galhos baixos: 6 lanternas com vidro e chama emissiva; uma delas "acompanha" (momento). (só visual)
  5. **Laço de captura de corda de algodão hospitalar** pendurado num galho, com etiqueta "ADULTO — Nº 233", em (204, 138). (só visual)
  6. **Tabuleta de ronda** pregada numa árvore perto de (180, 144): horários de 2 em 2 horas e as rubricas dos enfermeiros; a última linha, sem hora, diz "hoje". (só visual)
  7. **Toucas de enfermeiro engomadas** penduradas em pregos, 4, uma em cada jirau e uma na tabuleta. (só visual)
- **Momento de assinatura:** *a lanterna que acompanha.* Depois que o jogador anda 20 m dentro do bosque, uma lanterna de ronda (sprite quente) aparece entre as árvores a 35–45 m, atrás e à direita dele (120–150° da direção da câmera), mantendo a distância enquanto ele anda. Quando ele se vira para ela (dentro de 15°), ela já está parada, pendurada num galho (é uma das 6 lanternas fixas, que pisca uma vez). Repete no máximo 3 vezes por visita. Seguro: sprite sem colisão, nunca a menos de 30 m, não ilumina nada.
- **Animações ambientais (4):** jalecos balançando nos jiraus; folhas caindo (40 planos pequenos reciclados em volta do jogador); plaquinhas de lata girando e batendo no prego (rotação com tranco); chama das lanternas tremulando.
- **Luz e cor:** `#2a3a24` (copas), `#f0e8d0` (jaleco), `#ffcc70` (lanterna), `#9aa090` (cal nos troncos). PointLight real: nenhuma (as lanternas são emissivas e sprites). Ao entrar: névoa verde-escura `0x2e3a2c`, perto 14 / longe 88; `gradePass` frio nas sombras.
- **Som ambiente:** pio de nambu (seno 1,1 kHz com glissando para 900 Hz, em par, a cada 12–20 s, de posições diferentes) + tique metálico das plaquinhas no vento (cliques agudos de 2 ms, 3 kHz, em grupos).
- **Escalada:** depois de ver o Exército vigiando (Base militar), o jogador descobre que o Sanatório também vigia, mais perto e com nome. É a última área antes de os enfermeiros virarem personagens no outro mapa.
- **Implementação:** rect [160, 240, 100, 240]; 132 árvores do tema (com colisor). Evitar: corredor c1b12 (x 150,5–160, z ≈ 125), portas b11b12 (184, 100) e b20b12 (160, 184); janelas (173,3, 240), (200, 240), (160, 114), (240, 114), (240, 142), (240, 198); arma mp5k (178, 115,8); Caixa (189,3, 167,4). Jiraus e plaquinhas presos a árvores já existentes (procurar em `G.deco.trees` a mais próxima de cada ponto). Cerca de 30 malhas + 3 `InstancedMesh` (plaquinhas 30, olhos 24, folhas 40). A tora central do tema não sai (sem vão); as 6 toras pequenas ficam.

#### Brejo negro (b32) · ordem 5 · corpo/grotesco
- **Conceito:** é onde o Veio aflora: a água preta brota do chão. O Exército jogava ali os animais e as pessoas que "não acordaram direito". Nada afunda e nada apodrece: tudo fica cinzento e incha.
- **Como o terror aparece aqui:** o corpo aparece por sugestão: formas pálidas logo abaixo da água, um boi inchado, peles cinzentas penduradas como roupa ao sol. Pouco se vê claramente, e tudo parece um pouco vivo.
- **Props únicos (8):**
  1. **Água do Veio**: as 6 poças com material preto `0x050607`, brilho 150 e película de óleo iridescente (`canvasTex` com faixas violeta e verde, rolagem lenta). (só visual)
  2. **Formas pálidas sob a superfície**: 1 a 2 silhuetas humanas por poça (planos com `canvasTex` de silhueta difusa) a 3 cm abaixo da água, que só aparecem em ângulo rasante. (só visual)
  3. **Boi inchado e cinzento** deitado na lama, barriga enorme (esfera escalada), patas rígidas para cima, em (−220, −130). (só visual)
  4. **Dedos cinzentos brotando da lama** em fileira, como raízes, na beira da poça de (−194,7, −130,4) (24 cápsulas pequenas instanciadas). (só visual)
  5. **Árvores secas com nós inchados**: 12 das 55 árvores do tema ganham bolhas cinzentas no tronco, como juntas inchadas (esferas achatadas cor de pele cinzenta, meio enterradas na casca). (só visual)
  6. **Sacos de lona do Exército boiando, inflados de gás**, presos às margens, 4 sacos. (só visual)
  7. **Placa do Exército afundada até a metade**: "DEPÓSITO — PROIBIDO RETIRAR", inclinada na poça de (−198, −152,2). (só visual)
  8. **Mudas de pele cinzenta** penduradas nos galhos como roupas secando, finas e translúcidas, no formato de braços e costas (planos com `alphaTest`), perto de (−184, −202). (só visual)
- **Momento de assinatura:** *o que boia.* Com o jogador a menos de 8 m de uma poça e olhando para ela 2 s, a forma pálida mais próxima sobe até rente à película de óleo e se vira devagar, de bruços para de costas (troca de quadro na textura, 2,5 s), com um gorgolejo molhado; a película iridescente gira em volta e solta uma bolha grande; depois a forma afunda de novo. Dura 4 s. No máximo 1 vez a cada 90 s. Seguro: só textura e um plano, sem colisão e sem susto sonoro alto.
- **Animações ambientais (4):** bolhas subindo e estourando nas poças (esferas que crescem e somem, 1 a cada 1–3 s por poça); sacos inflando e murchando devagar; mudas de pele balançando nos galhos; nuvem de moscas sobre o boi (40 pontos em `Points`).
- **Luz e cor:** `#050607` (Veio), `#6a6a64` (pele cinza), `#3a3a2a` (lama), `#8a7a9a` (iridescência). PointLight real: nenhuma; a lâmpada do pool em (−205,4, −207,8) passa para `0xc8d0a8` mais fraca. Ao entrar: névoa escura `0x2a2c28`, perto 10 / longe 82; `gradePass` com saturação −30%.
- **Som ambiente:** borbulho grosso (ruído passa-baixa 120 Hz em rajadas com queda de altura, a cada 1,5–4 s) + moscas (dois dentes de serra 160 e 210 Hz levemente desafinados, ganho pela distância ao boi).
- **Escalada:** na Serraria (anel 3) o grotesco era de ferramenta e madeira; aqui é o próprio corpo, e o jogador está na nascente do Veio. É a área mais perto da verdade antes do Sanatório.
- **Implementação:** rect [−240, −160, −240, −100]; poças em (−213,9, −171,4), (−197,6, −171,7), (−227,2, −116,8), (−180, −193,3), (−194,7, −130,4), (−198, −152,2). Evitar: portas b00b32 (−160, −184) e b31b32 (−184, −100), corredor c3b32 (x −160 a −150,5, z ≈ −125); janelas (−226,7, −240), (−200, −240), (−240, −226), (−240, −170), (−240, −142), (−160, −142); arma rpk (−178, −119,2); Caixa (−206,5, −143,9). Cerca de 25 malhas + 4 `InstancedMesh` (dedos 24, nós 24, bolhas 18, moscas 40 pontos). **Diferença para o Pântano (zGen `swamp`):** água preta por região (ver Pântano), nenhuma vegetação viva (sem taboas), as árvores secas do Brejo ficam mais escuras (`0x2a2620`) e com os nós inchados; o Pântano fica verde-pardo e cheio de juncos.

#### Ponte velha (b11) · ordem 5 · som fora do lugar
- **Conceito:** a ponte da antiga estrada para fora do vale, por onde subia o caminhão-ambulância. Os da vila se escondiam na cabeceira quando ele passava e ouviam. A ponte ainda ouve o caminhão.
- **Como o terror aparece aqui:** o som é do próprio Programa vindo: motor, tábuas cedendo, a campainha de uma bicicleta. Nunca se vê o caminhão; o jogador está sempre no caminho dele.
- **Props únicos (7):**
  1. **Ponte coberta de madeira** sobre a ponte de tábuas de z 56,7: duas treliças laterais em X (nas bordas z 54,2 e 59,2, ao longo da travessia) e telhado de duas águas a 4,5 m; por dentro fica escuro. A passagem continua livre (as treliças ficam nos lados, não na frente). (só visual)
  2. **Guarda-corpo de ferro fundido torto** na ponte de z 13,3, com 26 fitas de luto pretas amarradas, uma por família levada. (só visual)
  3. **Para-lama branco arrancado** caído na cabeceira oeste da ponte coberta, com meia cruz vermelha pintada e o barro da estrada seco por cima: um pedaço do caminhão-ambulância. (só visual)
  4. **Nichos cavados no barranco** da cabeceira leste (x ≈ 205, z 52–61) com colchonetes de palha e um coto de vela aceso (emissivo). (só visual)
  5. **Placa de estrada de dois braços**: "← SÃO LÁZARO DO VALE 3 km" e "SANATÓRIO SANTA INÊS 1 km →", com o braço do Sanatório novo e pintado, em (186, 44). (só visual)
  6. **Bicicleta de padeiro caída** na cabeceira leste, com o cesto de pão vazio e a campainha virada para cima. (só visual)
  7. **Marco quilométrico de concreto "KM 0"** com uma cruz de cal, em (222, 38). (só visual)
- **Momento de assinatura:** *o caminhão.* Quando o jogador entra na ponte coberta, o som de um motor pesado (dente de serra 40–60 Hz com ronco de câmbio) se aproxima pela estrada, **passa por cima dele**: as tábuas batem em sequência ao longo de x, cai poeira do telhado em sequência e a campainha da bicicleta dá um trim fraco. Depois some na direção do Sanatório (leste). Nada aparece. Dura 5 s; no máximo 1 vez a cada 3 min. Seguro: só som e partículas; sem tremor de câmera, sem tirar o controle.
- **Animações ambientais (4):** roda da bicicleta girando devagar sozinha; poeira caindo das tábuas do telhado (sprites esparsos); fitas de luto tremulando; vela do nicho tremulando.
- **Luz e cor:** `#1e2a30` (água parada), `#4a3a2a` (madeira velha), `#0c0c0c` (interior da ponte), `#c8b088` (vela). PointLight real: nenhuma; a lâmpada do pool em (212,5, 49,6) passa para `0xd8c8a8`, fraca. Ao entrar: névoa `0x3a4044`, perto 16 / longe 105.
- **Som ambiente:** rio quase parado (ruído passa-baixa 400 Hz, ganho muito baixo) + pingos sob a ponte (blips de seno 1,5–3 kHz com eco por atraso realimentado de 0,3 s). A base é quieta de propósito, para o caminhão se destacar.
- **Escalada:** nas Ruínas o som era de gente chamando; aqui é o som de quem vinha buscar. O jogador está na estrada do Programa, a um quilômetro do Sanatório.
- **Implementação:** rect [160, 240, −30, 100]; rio ao longo de z em x 196–204; pontes de tábuas (10×5) em z 13,3 e 56,7. Evitar: portas b10b11 (184, −30) e b11b12 (184, 100); janelas em x 160 e x 240 nos z −13,7, 18,8 e 51,3; arma fal (206,6, −8,1); Caixa (178,9, 15). A ponte coberta fica longe da arma e da Caixa. Cerca de 35 malhas + 1 `InstancedMesh` (fitas 26). **Diferença para a Margem do rio (zGen `river`):** a água da Ponte velha é parada e mais escura (`0x161e24`, sem rolagem de UV, brilho 120); a ponte de z 56,7 ganha a cobertura e a de z 13,3 o guarda-corpo de ferro; os 8 caixotes do tema viram fardos de estrada (sacos de cimento, cor `0x8a8478`).

#### Quartel (b31) · ordem 5 · médico/clínico
- **Conceito:** o quartel de triagem: o Exército examinava quem tentava sair, descontaminava com cal e entregava os "positivos" ao caminhão branco do Dr. Aurélio. Aqui a quarentena vira medicina.
- **Como o terror aparece aqui:** tudo é limpo, branco e em ordem, e é isso que assusta: chuveiros, fichas carimbadas, cartazes em quadrinhos. A violência está no procedimento.
- **Props únicos (8):**
  1. **Chuveiros de descontaminação**: armação de cano galvanizado de 3 m com 6 crivos sobre um estrado de madeira 3×6 no chão, em (−190, −56). (só visual)
  2. **Tanque de cal com a peneira de pertences**: tanque de concreto de 3×1,5×.6 cheio de cal branca e, por cima, uma peneira grande com relógios, alianças e medalhinhas. Em (−184, −68). (só visual)
  3. **Mesa de triagem dobrável** com estetoscópio, termômetros num copo de álcool, almofada de carimbo e fichas carimbadas "POSITIVO — CAMINHÃO BRANCO", com cruz de cal, em (−202, 16). (só visual)
  4. **Padiolas de lona dobradas em pé** encostadas no contêiner de (−166, −65), cada uma com uma plaqueta "POSITIVO" e um número de família (6). (só visual)
  5. **Cartaz do Exército em quadrinhos**: "1 TIRE A ROUPA · 2 CAL · 3 BANHO · 4 SIGA PARA O CAMINHÃO BRANCO", colado num painel, em (−178, −8). (só visual)
  6. **Cabide de máscaras contra gás**: 12 máscaras penduradas em ganchos numa trave, com lentes que refletem (sprites de brilho), em (−226, −20). (só visual)
  7. **Câmaras de fumigação**: os 6 contêineres do tema pintados de branco, com estêncil vermelho "FUMIGAÇÃO — NÃO ABRIR" e um cano em cima soltando vapor pelas frestas. (só visual, a colisão é a do tema)
  8. **Caixa d'água de descontaminação** sobre a torre do tema ((−194, −29), 3×3×6,5): tanque de madeira com o cano descendo até os chuveiros. (só visual)
- **Momento de assinatura:** *o banho de cal.* Quando o jogador passa sob a armação dos chuveiros (dentro do estrado 3×6), os crivos soltam pó branco de cal por 3 s, com chiado e o apito de uma válvula; as lentes das 12 máscaras brilham ao mesmo tempo, viradas para ele; na mesa de triagem, um carimbo bate (som seco). No máximo 1 vez a cada 2 min. Seguro: partículas com opacidade baixa (≤ .25) que não escondem zumbis; sem dano, sem tirar o controle.
- **Animações ambientais (3):** vapor saindo das frestas das câmaras (sprites brancos lentos); máscaras balançando nos ganchos (pêndulos pequenos defasados); fichas soltas virando na mesa com o vento (rotação de 3 planos).
- **Luz e cor:** `#e8e8e0` (cal), `#c8d8d0` (luz fria de inspeção), `#8a2a22` (estêncil), `#4a5048` (lona). PointLight real: nenhuma nova; a lâmpada do pool em (−225,2, −34,2) passa para `0xe0f0ff`. Ao entrar: névoa esbranquiçada `0x5a5e5a`, perto 15 / longe 100; `gradePass` frio, saturação −20%.
- **Som ambiente:** vapor (ruído passa-alta 3 kHz, ganho baixo, em sopros de 1–2 s) + gerador de campanha (seno 50 Hz + quadrada 100 Hz → passa-baixa 400 Hz, com leve oscilação).
- **Escalada:** no Hospital de campanha (anel 3) o clínico ainda parecia cuidado; aqui o cuidado é seleção e o Exército é cúmplice do Programa. O próximo passo, no Sanatório, é a clínica de verdade.
- **Implementação:** rect [−240, −160, −100, 30]. Contêineres do tema em (−213, −35), (−222, −73), (−166, −65), (−166, 16), (−198, −75), (−195, −1); barracas em (−225, −41), (−220, −67), (−201, −44), (−169, −17). Evitar: portas b30b31 (−184, 30) e b31b32 (−184, −100); janelas em x −240 e x −160 nos z −83,7, −51,2 e −18,7; arma commando (−208,8, 1,1); Caixa (−212,2, −29,2) (encostada no contêiner de (−213, −35): o estêncil vai na face oposta). Cerca de 35 malhas + 2 `InstancedMesh` (máscaras 12, fichas 30). **Diferença para a Base militar (zGen `military`, variante `triagem`):** os contêineres ficam brancos (`0xd0ccc0`). Atenção: a cor dos contêineres sai de `rr()` dentro do `scatter` (linha 783), então **manter a chamada** e sobrescrever `b.c` depois. Os sacos de areia viram sacos de cal (material novo `lime` = `['sand', 0xd8d4c8]`, só troca de material); as barracas ficam de lona branca (`0xc8c4b4`); a torre vira caixa d'água (sem holofote).

#### Mina velha (b01) · ordem 5 · religioso (culto ao Veio)
- **Conceito:** a galeria velha, abandonada antes da guerra, que se liga por dentro à Galeria 7, onde o Veio se abriu em 1956. Os mineiros que beberam primeiro fizeram dela uma igreja: acreditam que o Veio é o sangue da terra e que "ainda não acabou" é uma promessa.
- **Como o terror aparece aqui:** o fanatismo chega ao auge: altar, oferendas, comunhão de água preta, e uma congregação que o jogador só ouve. É fé popular de mineiro (capacetes, fitas, carbureto) apontada para a coisa errada.
- **Props únicos (8):**
  1. **Altar de vagoneta**: a vagoneta do tema em (55, −177) coberta com toalha de altar manchada de preto, velas de carbureto e, no meio, um vidro grande de água preta. (só visual sobre a colisão existente)
  2. **Pórticos de capacetes**: os 3 pórticos de escora do tema ((48, −225), (85, −188), (33, −192)) cobertos de capacetes de mineiro pendurados em fileiras (24 instâncias), com as lâmpadas de carbureto acesas. (só visual)
  3. **Espiral de compoteiras de água preta**: 48 potes de vidro no chão em espiral de 3 voltas, levando ao altar (instanciados, tampas de pano amarradas). (só visual, 15 cm)
  4. **Inscrições a carvão nas rochas**: "O VEIO NOS CHAMA PELO NOME" na rocha de (−6,8, −190,9) e "AINDA NÃO ACABOU" em letra de mineiro na de (32,8, −179,5). (só visual)
  5. **Círculo de picaretas cravadas**, cabos enrolados em fitas brancas de primeira comunhão (7 picaretas), em (20, −184). (só visual)
  6. **Bateia de comunhão**: bateia de garimpo num tripé de ferro, cheia de água preta, com uma concha, ao lado do altar. (só visual)
  7. **Nichos de carbureto** nas rochas: 20 lamparinas pequenas acesas (emissivas, instanciadas) encaixadas nas pedras do tema. (só visual)
  8. **Estandarte de saco de minério**: lona com um olho preto escorrendo pintado e "N. SRA. DO VEIO", numa vara ao lado do pórtico de (85, −188). (só visual)
- **Momento de assinatura:** *a congregação.* Quando o jogador entra na espiral e fica 3 s a menos de 4 m do altar, todas as lâmpadas dos capacetes e dos nichos baixam de uma vez; um coro grave de boca fechada (senos 110/131/165 Hz desafinados, com filtro de formante "mmm") sobe do chão; a água dos 48 potes treme junto. Depois as lâmpadas reacendem uma a uma, da mais longe para a mais perto, como gente se aproximando. Dura 7 s; no máximo 1 vez a cada 2 min. Seguro: as lâmpadas são emissivas (a luz real do pool não apaga), o mapa continua legível; só no cliente.
- **Animações ambientais (4):** chamas de carbureto tremulando (emissivo com ruído por instância); água dos potes ondulando (escala em y com fase por pote); fitas das picaretas tremulando; gotas pingando das rochas (sprites que caem e somem).
- **Luz e cor:** `#1a1612` (rocha de galeria), `#f0e0a0` (carbureto), `#0a0a0c` (Veio), `#e8e0f0` (fitas brancas). PointLight real: 1, no altar (a lâmpada do pool em (53,1, −223,7) levada para (55, −177, y 1,6), `0xffe0a0`, tremulação). Ao entrar: névoa escura e quente `0x2e2a24`, perto 12 / longe 95; `gradePass` com contraste +10%.
- **Som ambiente:** gotejar com eco (blips de seno 800–1.400 Hz com atraso realimentado de 0,35 s) + bordão de terra muito baixo (seno 55 Hz, ganho .02); o coro só no momento.
- **Escalada:** na Mina (anel 3) o medo era do túnel; aqui as pessoas adoram a fonte da febre. É o ponto mais alto do fanatismo da Vila e mostra que o Programa só aproveitou uma fé que já existia.
- **Implementação:** rect [−30, 100, −240, −160]; vagonetas do tema em (−25, −168), (55, −177), (61, −224), (79, −230). Evitar: portas b00b01 (−30, −184) e b01b02 (100, −184); janelas em z −240 e z −160 nos x −13,7, 18,8 e 51,3; arma rpk (64, −191,5) (a espiral fica a mais de 12 m, centrada em (50, −172)); Caixa (25,1, −210,7). Cerca de 25 malhas + 4 `InstancedMesh` (capacetes 24, potes 48, nichos 20, gotas 12). Não confundir com a Mina (J): lá ficam a boca e a torre do poço; aqui não entra trilho nem roda.

#### Ilha do porto (b21) · ordem 5 · isolamento
- **Conceito:** a ilha do lazareto. Antes do Programa, os primeiros febris eram isolados ali pelo prefeito; um único barqueiro levava comida, até o dia em que parou de vir. A torre de pedra era o farolete do lazareto.
- **Como o terror aparece aqui:** água em volta, um píer, ninguém. Tudo aponta para um socorro que não vem: a bandeira de quarentena, a caixa de mantimentos vazia, os bilhetes. É o fim da Vila e o último lugar antes do Sanatório.
- **Props únicos (8):**
  1. **Bandeira amarela de quarentena** (a bandeira "Q" do código naval, amarela lisa), esfarrapada, num mastro sobre a torre de pedra do tema ((−31, 200), 4×4×9). (só visual)
  2. **Barco a remo sem remos** amarrado ao píer, com água preta até a metade, em (−35, 168). (só visual, sobre a água)
  3. **Boia de sinalização de lata** vermelha e branca, ancorada no fosso de (−35, 227,5), com a lanterninha quebrada. (só visual)
  4. **Cabana do barqueiro** (só visual: paredes de tábua de 2,4 m sem colisão, abertas de um lado) com a **lista dos isolados** na parede: nomes riscados um a um, e o último escrito com outra letra: "EU". Em (−66, 206). (só visual)
  5. **Caixa de mantimentos vazia** na ponta do píer: caixote com o carimbo da prefeitura, a tampa aberta e só palha dentro. (só visual)
  6. **Remos cravados na areia como cruzes**, com nomes queimados a ferro na pá (5), em (−14, 210). (só visual)
  7. **Farolete do lazareto**: lanterna a óleo apagada no alto da torre, com o vidro enegrecido. (só visual)
  8. **Cabaças lacradas com cera** na beira da água, cada uma com um bilhete enrolado "MANDEM O BARCO" (6, instanciadas). (só visual)
- **Momento de assinatura:** *o barco que vem.* Se o jogador fica 4 s no píer ou na beira norte da ilha olhando para fora (câmera dentro de 30° de +z), uma luz de lanterna aparece na névoa além do muro, como um barco chegando, e o som de remadas ritmadas cresce; depois de 8 s a luz apaga e as remadas param no meio. Nada chega. A bandeira amarela cai mole no mastro até o jogador se mover. No máximo 1 vez a cada 3 min. Seguro: sprite além do muro (fora do mapa jogável) e som.
- **Animações ambientais (4):** boia balançando e girando na água; bandeira esfarrapada tremulando (vértices de um plano 8×4, ou 3 planos com fase); palha da caixa de mantimentos voando aos poucos; marola contra o píer (anéis aditivos na borda das tábuas).
- **Luz e cor:** `#c8b030` (amarelo da bandeira), `#2a3a44` (água), `#9a8a68` (areia), `#ffd890` (lanterna distante). PointLight real: nenhuma. Ao entrar: névoa densa só para fora, com 6 planos de névoa (cartões aditivos `0x5a6066`) do lado de fora dos muros, para cortar a vista do mar; a névoa do mapa fica em perto 16 / longe 90 (a ilha inteira continua visível).
- **Som ambiente:** marola contra as estacas (ruído passa-baixa 300 Hz em pulsos a 0,3 Hz) + apito de navio muito longe (dente de serra 110 Hz + 165 Hz com ataque lento de 1,5 s, a cada 40–70 s, sempre do mesmo ponto e nunca mais perto).
- **Escalada:** é o fim da Vila: depois de fogo, fanatismo e o Veio, sobra o isolamento total. O próximo passo do jogador, e da história, é subir ao Sanatório.
- **Implementação:** rect [−100, 30, 160, 240]; fosso de água em volta (pools do tema: (−64,2, 172,5) 53,5×7; (−5,7, 172,5) 53,5×7; (−35, 227,5) 112×7; (−87,5, 200) 7×48; (17,5, 200) 7×48), píer de tábuas em (−35, 172,5); a ilha útil vai de x ≈ −84 a 14 e z ≈ 176 a 224. A cabana do tema não sai (sem vão). Evitar: portas b20b21 (30, 184) e b21b22 (−100, 184); janelas em z 160 e z 240 nos x −83,7, −51,2 e −18,7; arma stakeout (9, 193,6); Caixa (−40,5, 198,1) (a cabana fica a 25 m dela). Cerca de 30 malhas + 2 `InstancedMesh` (cabaças 6, remos 5). Sem colisão nova: a cabana é só visual e não pode encostar no píer.

### Sanatório

#### Recepção (A) · ordem 0 · falsa segurança
- **Conceito:** o balcão onde as famílias da vila davam entrada no Programa do Dr. Aurélio; tudo foi arrumado para parecer um hospital de repouso limpo e acolhedor, e o livro de admissões ainda espera a próxima família.
- **Como o terror aparece aqui:** quase nada está errado: flores frescas, rádio tocando valsa, retrato do diretor sorrindo. O erro está nos detalhes: as pulseiras que faltam no quadro, o cartaz que promete cura para a febre cinza, a cruz de cal carimbada ao lado de cada nome. O jogador só entende quando o livro se escreve sozinho.
- **Props únicos:**
  1. **Retrato oficial do Dr. Aurélio Vasconcellos**: moldura dourada larga, óleo escuro (jaleco, óculos redondos, sorriso contido), plaquinha de latão "DIRETOR · 1949". Plano 1,0 × 1,3 com textura de canvas (rosto em tons de sépia, craquelado) + moldura de 4 caixas finas `mergeGeos`. Parede sul entre as janelas. (só visual)
  2. **Livro de admissões aberto no balcão**: páginas pautadas com colunas "Família nº · Nomes · Chegada · Destino", última linha preenchida "Família 117 · 5 · 14/08/58 · PROGRAMA", cada linha com a cruz de cal carimbada à direita. Plano 0,6 × 0,45 com canvas 512 × 384 (o mesmo canvas é redesenhado no momento de assinatura) + lombada de caixa fina. (só visual)
  3. **Copos-de-leite num vaso de esmalte branco** com etiqueta de papel "oferta da família 117": brancos e frescos demais para um prédio abandonado. Vaso = cilindro; 5 flores = cones abertos (`ConeGeometry` com `openEnded`) + caules finos, material com leve emissivo (0x101010) para "brilharem" no escuro. (só visual)
  4. **Quadro de pulseiras de paciente**: tábua de pinho com 40 ganchos numerados; 26 pulseiras de papel branco penduradas, 14 ganchos vazios (os números vazios são os das famílias que já subiram). Tábua 2,4 × 1,0 + `InstancedMesh` de 26 laços (toro achatado). (só visual)
  5. **Cartaz do Programa**: litografia em cores gastas, família sorridente na frente do Sanatório, texto "FEBRE CINZA TEM CURA · TRATAMENTO GRATUITO · PROCURE A AMBULÂNCIA BRANCA". Plano 1,0 × 1,4 com canvas; um canto descolado (segundo plano dobrado 30°). (só visual)
  6. **Banco de espera de três assentos com mala de papelão**: madeira envernizada, a mala amarrada com barbante e etiqueta "117", chapéu de feltro em cima. Banco = 3 caixas + 4 pés `mergeGeos`, mala e chapéu (cilindro + disco). (só visual, altura 0,45 m)
  7. **Relógio de pêndulo de parede**: caixa de madeira escura, parado às 03:17 com o pêndulo imóvel; a porta de vidro tem uma cruz de cal pintada por dentro. Caixa + mostrador de canvas + pêndulo (caixa fina). (só visual)
  8. **Rádio de válvula de baquelite marrom** com mostrador âmbar aceso: é a fonte da valsa. Caixa arredondada (`RoundedBoxGeometry` se já carregado, senão caixa) + plano emissivo do mostrador + agulha (caixa fina). (só visual)
- **Momento de assinatura:** *a próxima família.* Gatilho: jogador a ≤ 2 m do balcão olhando para o livro (ângulo entre a câmera e o livro ≤ 25°, olhar para baixo) por 2 s, uma vez por partida. O canvas do livro é redesenhado em 4 s, traço a traço (uma linha a cada 0,1 s): numa linha nova aparece "Família 413 · (nº de jogadores da partida) · (data de hoje do jogo) · PROGRAMA": a lista acabava na 412, e a família seguinte é o grupo de jogadores; ao terminar, a cruz de cal é "carimbada" com um baque surdo e o rádio perde a estação por 1 s (chiado). Seguro: só textura e som locais, nada se move no espaço, não tira o controle.
- **Animações ambientais:** (a) agulha do rádio oscilando ±2° com o volume da valsa e o mostrador pulsando 5%; (b) poeira em suspensão nos fachos de luar das duas janelas (2 grupos de 12 sprites que sobem 1 cm/s e reciclam); (c) as pulseiras balançam levemente (seno 0,3 Hz, defasado por instância) sempre que uma porta da Recepção é aberta, por 3 s.
- **Luz e cor:** paleta `#E8DCC0` creme, `#9FA89A` verde-hospital, `#C9A65A` latão, `#3A2F28` madeira. PointLight real: a lâmpada que já existe em (0, 0), puxada para quente `0xffe2b0`. Emissivos: mostrador do rádio, copos-de-leite. Ao entrar: névoa um pouco mais aberta (`fog` 10–60) e `gradePass` levemente quente (+0,05 no tom quente, granulação mínima): é a sala "segura".
- **Som ambiente:** valsa abafada saindo do rádio (melodia de 16 notas em onda triangular + baixo em senoide, passa-baixa 900 Hz, panner na posição do rádio) + chiado de válvula (ruído branco passa-banda 3 kHz a −32 dB) e zumbido de 60 Hz da rede.
- **Escalada:** é o ponto zero: o lugar mais limpo e mais quente do Sanatório. Todo o resto do prédio é comparado com esta sala; o único sinal explícito é o livro.
- **Implementação:** bbox x −8,5…8,5, z −7,5…7,5. Retrato (0; 2,9; −7,45) entre as janelas (−4 e 4, faixa livre −3,2…3,2); livro sobre o balcão (0; 1,06; −1,5), vaso (1,6; 1,06; −1,5), rádio (−1,5; 1,06; −1,5); quadro de pulseiras na parede oeste (−8,45; 1,6; z 3…6), longe da granada (z −5) e da porta AF (z −2…2); cartaz na parede leste (8,45; 1,9; −5) e banco embaixo dele (7,9; 0; −5,5), afastado da Caixa (z 4,5); relógio de pêndulo na parede sul (−6,8; 1,9; −7,45), fora da janela (−4,8). Nada na faixa da armadilha (x −2…2, z 6,8…9,2) nem nas armas da parede norte (±5,5). ~14 malhas + 1 `InstancedMesh` (pulseiras 26) + 24 sprites. Canvas do livro pré-alocado (sem `new` por quadro); redesenho incremental com `needsUpdate` só nos 40 quadros do evento.

#### Capela (F) · ordem 1 · religioso
- **Conceito:** o capelão abençoava cada paciente antes do Programa, de joelhos e amarrado; a Capela virou a antessala da "cura" e o Cristo foi repintado com a cor da febre cinza.
- **Como o terror aparece aqui:** a fé foi posta a serviço do Programa: velas numeradas por família, uma Via-Sacra cujas últimas estações mostram a ambulância branca, correias de couro nos bancos. O sagrado e o clínico se confundem, e a bênção ainda acontece quando alguém para diante do crucifixo.
- **Props únicos:**
  1. **Crucifixo de gesso com o Cristo cinzento** acima da porta FD: cruz de madeira escura de 1,4 m, Cristo de gesso com a pele repintada de cinza-chumbo e uma pulseira de paciente em branco, sem número, no pulso direito. Cruz = 2 caixas; corpo = cilindros/caixas `mergeGeos` com material plaster `0x6a6e70`. (só visual)
  2. **Campainha de consagração sobre o atril de leitura**: atril de madeira com a Bíblia aberta e, no degrau, a campainha de altar de quatro sininhos de bronze num cabo único, com uma fita de pano preta amarrada. Atril = caixa inclinada + coluna; campainha = 4 `LatheGeometry` pequenas + cabo. (só visual)
  3. **Galhetas sobre a credência**: mesinha de canto com toalha branca e as duas galhetas de vidro da missa, a do vinho vazia e a da água cheia de água preta do Veio; da boca dela escorre um fio escuro que mancha a toalha. 2 cilindros transparentes com núcleo + toalha (plano com decal). (só visual)
  4. **Genuflexório com correias de couro nos braços**: madeira gasta no lugar dos joelhos, duas correias abertas com fivela. Caixa baixa + apoio inclinado + 2 tiras finas. (só visual, altura 0,9 m)
  5. **Estante de velas votivas numeradas**: três degraus de ferro com 30 velas em copinhos de vidro vermelho, cada uma com uma etiqueta de papel "Fam. 12", "Fam. 40"...; 22 acesas, 8 apagadas. Degraus = 3 caixas; velas = `InstancedMesh` (30) + sprites de chama aditivos (22). (só visual)
  6. **Via-Sacra do Programa**: 14 quadrinhos de madeira pequenos no alto das paredes; as estações 1–10 são as tradicionais, as 11–14 mostram a ambulância branca, a porta do Sanatório, uma maca e uma fileira de cruzes de cal. Planos 0,35 × 0,45 com um único atlas de canvas (14 células). (só visual)
  7. **Transformação dos 3 bancos existentes**: correias de couro presas no encosto de cada lugar e um missal de bolso com o número da família na capa em cada assento. Tiras finas instanciadas (15) + caixas achatadas (15). (só visual)
- **Momento de assinatura:** *a bênção.* Gatilho: jogador na Capela olhando para o crucifixo (≤ 15°) por 2 s a menos de 9 m, uma vez por rodada. A campainha de consagração toca três vezes, em trinados curtos (sem ninguém), a cada toque um terço das velas acesas se apaga da esquerda para a direita; no terceiro, uma sombra de mão erguida em bênção (plano escuro com textura de mão, opacidade 0 → 0,5 → 0) passa pela parede acima do genuflexório em 2,5 s. As velas reacendem uma a uma nos 4 s seguintes. Seguro: só sprites, um plano e som locais; a lâmpada real não muda.
- **Animações ambientais:** (a) chamas das velas tremulando (escala com seno + ruído com semente por vela); (b) uma gota preta escorre da boca da galheta e cai na toalha a cada 6–10 s, e a mancha cresce devagar até o fim da rodada; (c) a fita preta da campainha balançando como se houvesse corrente de ar (rotação ±6°, 0,4 Hz).
- **Luz e cor:** paleta `#5E4630` madeira, `#C8963E` vela, `#6A6E70` cinza do Cristo, `#7A1E22` vidro das velas. PointLight real: a lâmpada existente em (−18, 0), baixada para 70% e puxada para `0xffc88a`. Emissivos: 22 chamas (sprites aditivos) e um brilho falso no chão diante da estante de velas (plano aditivo radial). Ao entrar: névoa 8–48, `gradePass` quente e mais contrastado, vinheta um pouco maior.
- **Som ambiente:** coro distante sem palavras (ruído rosa em 3 filtros passa-banda de formante "a" 700/1200/2600 Hz, envelope muito lento, −30 dB) + estalo de pavio a cada 4–9 s.
- **Escalada:** primeira sala onde o Programa aparece de forma clara (correias, pulseira no Cristo, Via-Sacra); o terror deixa de ser só um detalhe errado e vira ritual.
- **Implementação:** bbox x −26,5…−9,5, z −7,5…7,5. Crucifixo na parede norte acima da porta FD (−18; 3,6; 7,45), acima do vão (que vai até ~2,5 m). Atril (−11,2; 0; 5) e genuflexório (−12,3; 0; 4,6), entre a ponta dos bancos (x −15,5) e a parede leste, fora da porta AF (z −2…2) e longe do semtex (−14,5; 7,45: 2,8 m). Credência com as galhetas junto à parede leste (−10,2; 0; −4,5), ao lado da porta AF. Velas no canto sudoeste (−25…−23; 0; −6,9), entre o mp5k (z −5) e a janela (x −18,8): mantém 1,5 m do mp5k. Via-Sacra a y 3,0 nas faixas livres das paredes (nunca acima da janela, do PhD, do Double Tap nem das armas). ~16 malhas + 4 `InstancedMesh` (velas 30, correias 15, missais 15, Via-Sacra 14 com atlas) + 22 sprites. Chamas animadas por escala de sprite, sem alocação.

#### Enfermaria (B) · ordem 1 · presença invisível
- **Conceito:** a enfermaria de "observação" onde os pacientes tomavam o soro de água do Veio e dormiam o sono sem sonho; um deles ainda não aceitou que teve alta.
- **Como o terror aparece aqui:** ninguém está à vista, mas tudo reage a alguém: a lâmpada de chamada acende, o biombo se enche de ar, chinelos esperam ao pé da maca vazia. Quando o jogador chega perto, alguém se deita na maca vazia.
- **Props únicos:**
  1. **Biombos de três folhas com pano de algodão encardido**: armação de tubo branco descascado, o pano "respira". Dois biombos encostados na parede sul. Armação = cilindros `mergeGeos`; pano = 3 planos com textura de canvas (manchas amarelas). (só visual, 1,7 m, colado à parede)
  2. **Colchão de oleado da maca (−5, 19)**: capa de oleado verde-clara sobre o colchão, com a marca rasa de uma cabeça no travesseiro; a malha tem 6 × 12 segmentos para afundar no momento de assinatura. (só visual)
  3. **Suporte de soro com frasco de vidro cheio do Veio**: haste de ferro com gancho, frasco rotulado "SORO · LOTE TORRE", tubo de borracha que desce até o travesseiro da maca. Cilindros finos + tubo (`TubeGeometry` curto, feito uma vez). (só visual)
  4. **Pranchetas de prontuário ao pé das quatro macas**: nº 61-2, 77-1, 118-1 e 214-3, cada uma com a cruz de cal carimbada e "ALTA → PROGRAMA" em letra de enfermeira. 4 planos 0,25 × 0,35 de um atlas de canvas. (só visual)
  5. **Bandeja de esmalte com três seringas de vidro de 50 ml cheias de líquido preto** e um bilhete "dose 3": sobre os pés da maca (4, 19). Plano/caixa achatada + 3 cilindros transparentes com núcleo escuro. (só visual)
  6. **Painéis de chamada de enfermeira com lâmpada vermelha e cordão de puxar**: placa de baquelite na parede, globo vermelho (esfera emissiva), cordão (cilindro fino) com pera de madeira. Dois painéis. (só visual)
  7. **Chinelos de pano com o número 61 bordado**, alinhados ao pé da maca (−5, 19) como se o dono tivesse acabado de deitar. 2 caixas achatadas com textura. (só visual)
  8. **Quadro de febre na parede**: papel quadriculado com as curvas de temperatura de 4 pacientes que descem até 34 °C, ficam retas, e depois sobem de novo; anotação "ainda não acabou" ao lado da última. Plano 0,8 × 1,0 com canvas. (só visual)
- **Momento de assinatura:** *alguém se deita.* Gatilho: jogador a ≤ 4 m da maca (−5, 19) por 2 s, no máximo uma vez a cada 3 rodadas. Os chinelos 61 deslizam 10 cm para baixo da maca, como empurrados por um pé; o colchão de oleado afunda devagar no formato de um corpo deitado (1,5 s), com um rangido de mola; o tubo do soro balança; o pano do biombo mais próximo infla e a lâmpada de chamada da parede oeste acende por 2 s. Fica assim 4 s, e o colchão volta a subir devagar, como quem se levanta. Seguro: só vértices de uma malha visual, uma rotação e som locais, nada com colisão, não cobre as máquinas Quick Revive e Electric Cherry.
- **Animações ambientais:** (a) panos dos biombos "respirando" (escala z do plano 1 ± 0,03, 0,2 Hz, defasado por folha); (b) gota caindo do frasco de soro dentro da câmara de gotejamento a cada 1,4 s (esfera reciclada); (c) as lâmpadas de chamada acendem sozinhas, uma de cada vez, por 0,5 s a cada 12–20 s (tempo sorteado com `mkRand`); (d) cordão de chamada balançando levemente depois de cada acendimento.
- **Luz e cor:** paleta `#D7E0DA` branco-esverdeado, `#7E9A92` azulejo, `#1B1D1F` preto do Veio, `#B03A2E` vermelho de chamada. PointLight real: a lâmpada existente em (0, 16), fria `0xdfe9e4`. Emissivos: 2 globos de chamada e o frasco de soro (leve brilho escuro). Ao entrar: névoa 7–45, `gradePass` frio e esverdeado, granulação +10%.
- **Som ambiente:** respiração lenta sem fonte (ruído rosa passa-baixa 400 Hz com envelope de 0,2 Hz, inspira/expira) + rangido de mola de maca (FM portadora 180 Hz, moduladora 37 Hz, 0,3 s) a cada 9–15 s, posicionado numa maca sorteada.
- **Escalada:** depois da falsa segurança, a primeira presença: algo está na sala com o jogador, e ele vê o peso dela na maca.
- **Implementação:** bbox x −8,5…8,5, z 8,5…23,5. Biombos na parede sul (x −6…−3,5 e 3,5…6; z 9,2), fora da porta AB (x −2…2) e da faixa da armadilha; soro em (6,4; 0; 12,4) ao lado da maca (5, 12); bandeja nos pés da maca (4, 19); chinelos em (−5; 0; 17,6); painéis de chamada na parede oeste (−8,45; 1,8; 20,5), longe do mp40 (z 11), e na parede leste (8,45; 1,8; 11,5), fora da porta BE (z 14…18) e do Cherry (z 20); quadro de febre na face sul interna (5,2; 1,6; 8,55). Colchão de oleado sobre a maca (−5, 19), longe da Caixa (−4,5; 23,05); a geometria é criada uma vez e os vértices só se mexem durante o evento (sem alocar). ~14 malhas. Sem sombras novas.

#### Pátio (C) · ordem 1 · isolamento
- **Conceito:** o pátio de banho de sol dos pacientes, um poço de céu cercado por muros com cacos de vidro; era o mais perto do mundo de fora que eles chegavam.
- **Como o terror aparece aqui:** o céu está logo ali, mas não há saída: cacos no alto dos muros, um chapéu preso neles, bilhetes de socorro que voltaram por cima do muro, uma trilha gasta de tanto andar em círculo. No momento de assinatura, alguém dá a volta no Pátio pelo lado de fora.
- **Props únicos:**
  1. **Cacos de garrafa cimentados no topo dos muros**: verdes e marrons, em fila irregular ao longo dos quatro muros do Pátio, pegando o luar. `InstancedMesh` de ~260 tetraedros (`TetrahedronGeometry(.08)`) com rotação e escala sorteadas por `mkRand`, material Standard com `roughness` baixa (Lambert com leve emissivo no gráfico Baixo). (só visual, y 4,5)
  2. **Chapéu de palha de paciente preso nos cacos** do muro sul, com a aba rasgada, como se alguém tivesse tentado passar. Cilindro + disco com textura de palha. (só visual)
  3. **Fonte seca transformada**: fundo coberto de crosta preta rachada (plano com canvas) e uma **caneca de lata acorrentada à borda** (cilindro + 8 elos de corrente instanciados), do tempo em que os pacientes bebiam dali. (só visual sobre a colisão já existente)
  4. **Trilha circular gasta em volta da fonte**: anel de areia mais escura (r 2,6–3,4 m, `RingGeometry` com canvas) com marcas de chinelo, todas no mesmo sentido. (só visual, no chão)
  5. **Bilhetes amarrados em pedras ao pé do muro norte**: 7 pedras com papel dobrado amarrado com barbante ("socorro · família 88 · avisem o padre"), jogadas por cima do muro e caídas de volta para dentro. `InstancedMesh` de pedras (icosaedro) + planos de papel. (só visual)
  6. **Relógio de sol horizontal embutido no chão** com o gnômon torto e todas as horas do mostrador raspadas a unha, menos uma: a do banho de sol. Disco de pedra (plano com canvas) + gnômon (triângulo extrudado, 0,3 m). (só visual)
  7. **Campainha elétrica de recolhimento no alto do muro norte**: campânula de ferro pintada de verde numa caixa, com o fio descendo pela parede. Caixa + meia-esfera + cilindro fino. (só visual)
  8. **Escada de mão quebrada encostada no muro leste**, sem os degraus de cima. 2 caixas longas + 4 degraus instanciados. (só visual)
- **Momento de assinatura:** *os muros calam.* Gatilho: jogador no Pátio sem nenhum colega a menos de 15 m, parado (velocidade < 0,5 m/s) por 5 s, uma vez a cada 2 rodadas. Os grilos de fora calam um muro por vez (norte, leste, sul, oeste, 1 s cada), como se alguém desse a volta no Pátio pelo lado de fora, e os cacos do topo de cada muro que cala perdem o brilho do luar. Com os quatro em silêncio, fica só o som do coração (senoide 50 Hz em batidas duplas, −24 dB) por 5 s; a campainha de recolhimento toca três vezes, curta, e os grilos e o brilho voltam juntos em 2 s. Seguro: só som e o emissivo dos cacos, locais; a névoa e a luz não mudam.
- **Animações ambientais:** (a) a aba rasgada do chapéu tremula ao vento (rotação ±8°, ruído suave); (b) um redemoinho baixo de areia passa em volta da fonte a cada 20–35 s (10 sprites em espiral por 3 s); (c) a caneca acorrentada balança e tilinta contra a borda de pedra a cada rajada.
- **Luz e cor:** paleta `#5B5E4C` areia, `#8FA3C8` luar, `#2E4A2A` vidro verde, `#C8B27A` palha. PointLight real: a lâmpada existente em (18, 0) (base 9), azulada `0xa8b8e0`. Emissivos: brilho dos cacos (fraco), nenhum outro. Ao entrar: névoa aberta 12–70 (o céu à vista), `gradePass` dessaturado 15%, sem tom quente.
- **Som ambiente:** vento passando por cima do muro (ruído branco passa-banda 600 Hz com centro varrendo 400–900 Hz em 8 s, −26 dB) + grilos de fora (pulsos de senoide 4,2 kHz em trens de 3, espalhados em 4 panners atrás dos muros).
- **Escalada:** depois da presença, o isolamento: primeira área a céu aberto, e mesmo assim fechada; o jogador sente que o prédio não deixa ninguém sair.
- **Implementação:** bbox x 9,5…26,5, z −7,5…7,5. Cacos ao longo do topo dos muros do Pátio (z −8, z 8, x 9, x 27; y 4,5); chapéu (21; 4,6; −8); fonte em (18, −1) com crosta a y 0,81 e caneca na borda leste (19,5; 0,8; −1); trilha centrada em (18, −1), raio externo 3,4 m (fica a ≥ 5 m dos pontos de saída do chão (14, −4), (23, 4) e (22, −5)); bilhetes em x 21…25, z 7,3 (fora da porta CE x 16…20 e longe do AK em 12,5); relógio de sol em (14; 0; 3); campainha (24; 4,1; 7,4); escada em (26,3; 0; −6,7), 2,7 m da Caixa (z −4). ~12 malhas + `InstancedMesh` de cacos (260), elos (8), pedras (7), degraus (4) + 10 sprites. Cacos com recorte por distância como um único objeto.

#### Laboratório (D) · ordem 2 · médico/clínico
- **Conceito:** aqui o Programa media quanto tempo um morto leva para acordar: mãos de pacientes em formol, a "curva do despertar" no quadro-negro e relatórios datilografados ao Dr. Aurélio.
- **Como o terror aparece aqui:** primeira sala de horror explícito e frio: a ciência do Programa aparece sem disfarce, com números, horas e nomes. Nada está sujo; está organizado, e isso é o pior.
- **Props únicos:**
  1. **Potes de formol com mãos acinzentadas**: sete frascos de vidro com tampa de vidro esmerilhado, líquido âmbar, uma mão cinza dentro de cada, etiqueta "Pac. 117-3 · 38 h pós-óbito", "Pac. 214-1 · 41 h"... O maior é o "Pote 1 — chapa 17 (G7) · 36 h": a mão do mineiro que subiu da Galeria 7, o primeiro sujeito, de antes da lista. Cilindros transparentes (`depthWrite: false`) + mão = 5 caixas finas `mergeGeos` (os dedos do Pote 1 ficam separados para o momento de assinatura). (só visual)
  2. **Quadro-negro com a "curva do despertar"**: eixo "horas após o óbito" × "movimento", pontos com nomes de pacientes, a curva sobe em 36–48 h; a última anotação, numa letra diferente, é só um ponto de interrogação depois de 48 h. Plano 2,6 × 1,4 com canvas (giz) + moldura. (só visual)
  3. **Microscópio de latão com lâmina de sangue preto**: a lâmina "117-2" sob a objetiva, a lampadinha do espelho acesa e, ao lado, o caderno de desenhos a nanquim com células cinzentas ramificadas. Cilindros + base + plano emissivo pequeno + plano com canvas. (só visual)
  4. **Destilador com serpentina de vidro pingando o Veio** num béquer graduado: balão, serpentina (`TubeGeometry` helicoidal feita uma vez), béquer com líquido preto. (só visual)
  5. **Erlenmeyer sobre bico de Bunsen com chama azul** e líquido cinza borbulhando. Cone + cilindro + sprite azul aditivo + 6 bolhas recicladas. (só visual)
  6. **Quimógrafo de tambor esfumaçado**: cilindro preto girando devagar, uma pena traçando uma linha que fica reta por muito tempo e depois treme. Cilindro com canvas (linha branca riscada) + braço fino. (só visual)
  7. **Armário de vidro de remédios com frascos "VEIO — LOTE 12"**: armário branco esmaltado de 2 m, portas de vidro, 3 prateleiras de frascos marrons rotulados. Caixa + planos de vidro + `InstancedMesh` de 24 frascos. (só visual, colado à parede)
  8. **Pasta de relatórios aberta sobre a bancada**, com o carimbo "CONFIDENCIAL — AO DIRETOR" e o relatório Nº 31 por cima: "Os sujeitos acordam. Não reconhecem os familiares. Repetem a mesma frase." Caixa fina + plano de papel com canvas. (só visual)
- **Momento de assinatura:** *a mão do Pote 1.* Gatilho: jogador a ≤ 2,5 m do Pote 1 olhando para ele (≤ 20°) por 2 s, uma vez por partida por jogador. Os dedos da mão se fecham devagar (rotação das 4 falanges em 2 s), o polegar bate uma vez no vidro ("tink": senoide 2,8 kHz com decaimento de 0,4 s), bolhas sobem do pulso e a mão fica fechada até o fim da partida. Seguro: só rotação de malhas pequenas dentro do pote e um som; nenhum efeito na tela.
- **Animações ambientais:** (a) tambor do quimógrafo girando (0,05 volta/s) com a pena tremendo; (b) chama do Bunsen tremulando e bolhas subindo no Erlenmeyer; (c) gota preta caindo da ponta da serpentina no béquer a cada 2,2 s; (d) a lampadinha do microscópio falha (opacidade do emissivo cai para 40% por 2 quadros) a cada 7–14 s.
- **Luz e cor:** paleta `#E8F4FF` branco clínico, `#C9A04A` âmbar do formol, `#4C5A60` aço, `#1B1D1F` preto. PointLight real: a lâmpada existente em (−18, 16), branca fria `0xe8f4ff`. Emissivos: lampadinha do microscópio, chama do Bunsen (sprite). Ao entrar: névoa 7–40, `gradePass` com contraste +15% e tom frio, granulação baixa (limpo demais).
- **Som ambiente:** zumbido de 120 Hz do reator da lampadinha do microscópio (senoide + 2º harmônico, −30 dB, cai junto com as falhas) + borbulhar (rajadas curtas de ruído passa-banda 900 Hz, 4–9 por segundo, perto do Erlenmeyer).
- **Escalada:** depois de sugestões e rituais, a primeira prova material do que o Programa fazia: partes de pacientes, horas, curvas.
- **Implementação:** bbox x −26,5…−9,5, z 8,5…23,5. Potes sobre a bancada (−18, 19), em x −18…−16 (Pote 1 em (−17; 1,0; 19,2)), pasta de relatórios na ponta (−19,6; 1,0; 19); destilador (−19,4), quimógrafo (−18) e Bunsen (−16,6) sobre a bancada (−18, 13) a y 1,0; quadro-negro na parede oeste (−26,45; 1,9; 17), longe do Juggernog (z 10,5); armário (−26,2; 0; 21,5), 2,5 m da Caixa (−23,5; 23,05); microscópio numa mesinha junto à parede norte (−12,5; 0; 22,8), fora da porta DI (x −20…−16) e a 3,6 m do Stakeout (−9,55; 21). Nada nas portas BD (z 14…18) e FD (x −20…−16). ~18 malhas + `InstancedMesh` (frascos 24, bolhas 6). Vidros transparentes poucos e pequenos; o Pote 1 tem a mão em 5 malhas separadas (as outras mãos são uma malha cada).

#### Refeitório (G) · ordem 2 · loop/repetição
- **Conceito:** todos os dias a mesma sopa cinza e o mesmo copo de água da Torre, servidos na mesma ordem para os mesmos números; o Refeitório continua servindo para ninguém.
- **Como o terror aparece aqui:** tudo se repete: 48 bandejas idênticas, 48 canecas iguais, o mesmo rosto "recuperado" trinta vezes no mural, o mesmo cardápio todos os dias, o mesmo compasso de marchinha no rolo rasgado da pianola. A sala inteira é um gesto que nunca termina.
- **Props únicos:**
  1. **Bandejas de alumínio com divisórias**, cada uma com a mesma porção de sopa cinza e a colher na mesma posição, em todos os 48 lugares das 6 mesas. `InstancedMesh` de bandejas (caixa achatada com canvas de divisórias e porção) + `InstancedMesh` de colheres. (só visual)
  2. **Canecas de alumínio cheias de água preta**, uma em cada lugar, todas com o mesmo número de paciente pintado: o número muda de mesa para mesa, não de lugar para lugar. `InstancedMesh` de 48 cilindros + disco escuro do líquido. (só visual)
  3. **Quadro de cardápio de giz**: "SEGUNDA: sopa · água / TERÇA: sopa · água / ..." até domingo, e embaixo, sete vezes, "amanhã: o mesmo". Plano 1,6 × 1,2 com canvas. (só visual)
  4. **Faixas numeradas da fila pintadas no chão**: 40 marcas amarelas de pés numerados de 1 a 40, da porta até o balcão, gastas no meio pelo uso. Decals instanciados. (só visual, no chão)
  5. **Pianola (piano mecânico) com o rolo perfurado rasgado**, encostada na ponta do balcão de servir: o rolo toca uma marchinha e, num rasgo remendado, pula de volta para o mesmo compasso. Caixa do piano + teclado + rolo (cilindro com canvas de furos). (só visual)
  6. **Panelão de sopa de alumínio amassado com concha de cabo longo**, sempre cheio até a mesma marca de ferrugem. Cilindro aberto + disco do líquido + concha. (só visual)
  7. **Mural de "pacientes recuperados"**: 30 fotografias 3 × 4 em moldura de papelão, todas com o mesmo rosto sorrindo e só a legenda mudando ("nº 12 · curado", "nº 13 · curado"...). Plano 2,4 × 1,0 com atlas de canvas. (só visual)
- **Momento de assinatura:** *a hora da sopa.* Gatilho: jogador a ≤ 3 m do balcão de servir por 3 s, uma vez a cada 2 rodadas. A pianola para no meio do compasso; as 48 colheres sobem 2 cm e batem nas bandejas em uníssono, três vezes, no ritmo da marchinha (som metálico posicionado em cada mesa, 6 panners); silêncio de 2 s; a pianola recomeça exatamente do mesmo compasso. Duração ~5 s. Seguro: só matrizes de instância (calculadas num `Matrix4` reaproveitado) e som; nada sai da mesa.
- **Animações ambientais:** (a) rolo da pianola girando e voltando 1 cm a cada 3,2 s, com as teclas afundando sozinhas no compasso; (b) vapor subindo do panelão (6 sprites reciclados, sempre o mesmo desenho); (c) três moscas circulando o panelão em órbitas fixas e idênticas (sprites pequenos).
- **Luz e cor:** paleta `#8C8778` piso, `#B8BCC0` alumínio das canecas, `#5C6B73` alumínio, `#1B1D1F` preto. PointLight real: a lâmpada existente em (−45, 6), amarelo doentio `0xfff0c8`. Emissivos: nenhum (a sala é "comum"); só o vapor. Ao entrar: névoa 10–55, `gradePass` amarelado e dessaturado 10%.
- **Som ambiente:** marchinha da pianola em loop (8 notas em onda triangular com ataque de martelo, passa-baixa 1,8 kHz + o sopro do fole em ruído baixo), pulando para trás a cada 3,2 s; + burburinho de talheres muito baixo (cliques metálicos espaçados) que para quando o jogador fica parado.
- **Escalada:** a primeira sala grande do prédio; o horror passa de um objeto para um sistema inteiro: a rotina do Programa ainda roda sozinha.
- **Implementação:** bbox x −62,5…−27,5, z −7,5…19,5. Bandejas, canecas e colheres sobre as mesas (x −54 e −37, z −1, 6, 13; tampo a 0,8 m), 4 lugares por lado. Cardápio na parede norte (−36; 2,3; 19,45), fora da porta GH (x −47…−43); pianola (−52,6; 0; 19,0) e panelão (−57,5; 1,05; 18,6) no balcão; faixas da fila em x −59,5, de z −5 até 17 (decals, não atrapalham a janela (−63, 12) nem a Caixa (−62,05; 6)); mural na parede sul (−50,3; 2,1; −7,45), entre o SPAS (−55) e a porta GN (x −47…−43). ~10 malhas + `InstancedMesh` (bandejas 48, colheres 48, canecas 48, marcas 40, fotos num só plano). Colheres: um `InstancedMesh`, matrizes atualizadas só durante o evento.

#### Teatro (E) · ordem 2 · infância corrompida
- **Conceito:** o "Teatrinho da Saúde", onde as crianças da vila assistiam a um espetáculo de fantoches para aceitarem o remédio sem chorar, antes de subirem ao Anexo.
- **Como o terror aparece aqui:** tudo foi feito para agradar criança: veludo vermelho, fantoches, balões, programas coloridos. O enredo é a doutrinação: "Joãozinho bebe a água e dorme feliz". Os balões murcharam cinzentos, e a lanterna mágica ainda conta o fim da história.
- **Props únicos:**
  1. **Teatrinho de fantoches de parede com cortina de veludo vermelho** e letreiro pintado "TEATRINHO DA SAÚDE", com estrelinhas douradas descascadas. Moldura de caixas `mergeGeos` + 2 planos de cortina com canvas + letreiro. (só visual, colado à parede)
  2. **Fantoches de luva**: "o Doutor" (jaleco, óculos redondos, sorriso largo: o Dr. Aurélio em caricatura), "a Enfermeira" de touca, e "Joãozinho", de pano cinza, com o número 7 costurado no peito e os olhos de botão preto. Cada um: cilindro de tecido + esfera de cabeça com canvas. Pendurados na borda do palquinho. (só visual)
  3. **Programas mimeografados em papel roxo** espalhados nas poltronas: "Joãozinho toma o remédio e dorme feliz", com um espaço "nome da criança: ____" preenchido a lápis em cada um. `InstancedMesh` de 10 planos com 3 variações de canvas. (só visual)
  4. **Caixotes de leite usados como assento elevador** na primeira fileira, com nomes de criança escritos a giz ("Zezinho", "Lurdes", "Tonho"). `InstancedMesh` de 6 caixas com atlas de canvas. (só visual)
  5. **Lanterna mágica de latão sobre tripé**, com caixa de lâminas de vidro pintadas ao lado; um facho cônico aditivo vai até a cortina. Caixa + cilindro da lente + 3 pernas + cone aditivo `depthWrite:false`. (só visual)
  6. **Balões de borracha murchos e cinzentos** amarrados nas pontas das fileiras com fitas de pulseira de paciente. 5 esferas achatadas + linhas finas. (só visual)
  7. **Pote de vidro de pirulitos acinzentados** com tampa de lata escrita "PRÊMIO PARA QUEM DORMIR". Cilindro transparente + 12 discos instanciados com palito. (só visual)
- **Momento de assinatura:** *a lanterna mágica.* Gatilho: jogador olhando para o teatrinho (≤ 25°) por 2 s, a mais de 4 m dele, uma vez por rodada. A lanterna dá um clique e projeta três lâminas na cortina (plano emissivo com canvas trocado, 1,5 s cada, com tremor de projeção): "Joãozinho bebe a água" (desenho alegre), "Joãozinho dorme" (olhos fechados, a mãe chorando ao fundo), "Joãozinho acorda" (o mesmo desenho, a pele cinza e os olhos pretos de botão, como o fantoche). Na terceira, uma salva curta de palminhas de criança (rajadas de ruído passa-banda 2 kHz, 6 pares de mãos) vem da plateia vazia; clique, escuro. Seguro: só um plano emissivo e som locais, o facho é aditivo e fraco, não cobre os Stamin-Up e Mule Kick.
- **Animações ambientais:** (a) a cortina de veludo ondula de leve (deslocamento senoidal do plano em 2 segmentos, 0,15 Hz); (b) os balões murchos giram devagar nos fios (rotação y ±20°, defasados); (c) poeira dançando dentro do facho da lanterna (8 sprites no cone).
- **Luz e cor:** paleta `#7A1E22` veludo, `#E2C38A` dourado gasto, `#6B4FA0` mimeógrafo, `#9AA0A6` cinza. PointLight real: a lâmpada existente em (18, 16) a 60% `0xffd6a0`. Emissivos: o facho e a projeção (só no momento), estrelinhas do letreiro (leve). Ao entrar: névoa 8–40, `gradePass` com saturação +10% nos vermelhos e vinheta suave (aparência de "festa").
- **Som ambiente:** flauta doce desafinada de 3 notas (senoide com vibrato irregular e afinação −30 cents) a cada 20–30 s, de trás do teatrinho + rangido de poltrona de madeira (FM 140 Hz) quando o jogador passa perto das fileiras.
- **Escalada:** primeira vez que o Programa toca as crianças; é a sala que anuncia o Anexo do asilo, lá fora, sem mostrá-lo.
- **Implementação:** bbox x 9,5…26,5, z 8,5…23,5. Teatrinho na parede norte (x 12…18; y 0,9…2,6 + cortina até 4,3; z 23,45), fora da Caixa (22; 23,05); fantoches na borda do palquinho (y 1,6); programas nas poltronas (x 15…21, z 13/16/19); caixotes na fileira de z 19; lanterna (22,5; 0; 9,8) com facho até (15; 2; 23), a 3,4 m do Stamin-Up (25,9; 10,5) e fora da porta CE (x 16…20, z 8); balões nas pontas das fileiras (x 14,8 e 21,2); pote de pirulitos na ponta da fileira (21,2; 0,6; 13). Corredor livre entre a última fileira (z 19,4) e a parede (z 23,5). ~18 malhas + `InstancedMesh` (programas 10, caixotes 6, pirulitos 12) + 8 sprites. Canvas das 3 lâminas pré-desenhados num atlas; troca por `offset` da textura.

#### Ala Psiquiátrica (J) · ordem 2 · som fora do lugar
- **Conceito:** a ala dos que "acordaram difícil": pacientes que repetiam a frase sem parar eram isolados aqui e escutados por tubos acústicos de latão ligados ao posto de enfermagem.
- **Como o terror aparece aqui:** os sons não batem com as coisas: o metrônomo marca um tempo que o pêndulo não acompanha, um gravador desligado gira sozinho, e os tubos acústicos trazem vozes de celas vazias. A ala inteira foi feita para ouvir, e ainda ouve.
- **Props únicos:**
  1. **Colchões de crina pregados nas divisórias das celas**, rasgados, com crina escura escapando dos rasgos. 6 planos com canvas e bump (listras de lona + rasgos) nas faces das 3 divisórias. (só visual)
  2. **Tubos acústicos de latão com bocal em cada cela**: um cano sai de cada divisória com um bocal em forma de funil a 1,6 m, sobe até 3 m e segue pelo alto até o posto de enfermagem, onde termina num painel de 4 bocais com plaquinhas "1 2 3 4". Cilindros `mergeGeos` + 4 cones. (só visual, acima da cabeça)
  3. **Gravador de fio de baquelite** sobre o posto de enfermagem, ligado ao painel dos tubos: dois carretéis de fio de aço e um microfone de mesa; registrava o que os pacientes repetiam. Caixa + 2 cilindros + microfone (cilindro + esfera). (só visual)
  4. **Aparelho de eletroconvulsão de baquelite** sobre o posto, com dois mostradores, chave de alavanca e um mordedor de borracha marcado por dentes. Caixa + 2 planos de mostrador + cilindro. (só visual)
  5. **Metrônomo de madeira** sobre o posto, pirâmide com pêndulo de latão. Cone de 4 lados + caixa fina. (só visual)
  6. **Camisas de força de lona penduradas em ganchos de ferro**, com o número costurado nas costas e as fivelas abertas. 4 planos com canvas levemente curvados + ganchos. (só visual)
  7. **Pauta musical riscada a unha na parede da cela 4**: cinco linhas tortas e notas cravadas, a mesma frase de 5 notas repetida até o canto. Decal 3 × 0,6 com canvas. (só visual)
  8. **Transformação das 4 camas**: os lençóis ganham amarras de couro nos quatro cantos, e o colchão tem dois sulcos rasgados no pé da cama, onde os calcanhares batiam. Tiras instanciadas (16) + decal no lençol. (só visual)
- **Momento de assinatura:** *os tubos falam.* Gatilho: jogador no corredor da ala (z 26…36) parado por 4 s, uma vez a cada 2 rodadas. Um sussurro (ruído rosa em 2 formantes que mudam a cada 0,18 s, como sílabas) sai do bocal da cela mais distante do jogador, com o panner no bocal; 1,2 s depois passa para a cela seguinte, e assim até a mais próxima; o último sussurro vem do bocal do posto, o mais perto do jogador, em 5 sílabas no ritmo de "ainda não acabou". Os carretéis do gravador dão meia volta sozinhos e soltam 1 s de chiado de fio, e silêncio. Duração ~7 s. Seguro: só som e a rotação dos carretéis.
- **Animações ambientais:** (a) o pêndulo do metrônomo balança a 60 bpm, mas o tique sonoro vai se adiantando até ficar meio tempo fora e volta (defasagem que cresce em 20 s); (b) o microfone de mesa balança no fio, devagar (±5°); (c) tufos de crina tremulam nos rasgos dos colchões (escala de 3 planos pequenos, ruído suave).
- **Luz e cor:** paleta `#9C9A8E` piso, `#6E7B5A` verde de lona, `#B08D57` latão, `#2A2A2A` crina. PointLight real: a lâmpada existente em (9, 31), `0xd8e4c8`, com tremulação leve de intensidade (±8%, ruído com semente). Emissivos: mostradores do aparelho (verde fraco). Ao entrar: névoa 8–45, `gradePass` esverdeado e granulação +15%.
- **Som ambiente:** tique do metrônomo (clique de ruído filtrado 3 kHz, 5 ms) + murmúrio de muitas vozes muito baixo (4 vozes de formante sem palavras, −36 dB) que vem sempre dos tubos, nunca das celas.
- **Escalada:** primeira sala onde o som engana o jogador de propósito: o perigo pode estar onde não se vê, e a frase do cânone é ouvida, não lida.
- **Implementação:** bbox x −8,5…26,5, z 24,5…43,5. Colchões nas faces das divisórias x −3, 6 e 15 (z 37…44); tubos com bocal a 1,6 m na face leste de cada divisória e na parede leste da cela 4, subindo a 3 m e cruzando o corredor até o posto (10, 30) a 3,4 m; gravador sobre o posto (8; 1,05; 30,4); aparelho (9; 1,05; 30) e metrônomo (11; 1,05; 30) sobre o posto; camisas de força na parede sul (x 20…25; y 1,3…2,4), longe do HK21 (16); pauta na parede norte da cela 4 (x 21…25; y 1,2…1,8; z 43,45), fora da janela (18 ± 0,8). Nada na frente das janelas (0, 44) e (18, 44) nem da Caixa (8; 43,05). ~16 malhas + `InstancedMesh` (amarras 16, ganchos 4). Tubos numa única malha `mergeGeos`.

#### Jardim (K) · ordem 2 · vigilância
- **Conceito:** o jardim de passeio dos pacientes "em melhora", onde enfermeiros anotavam cada gesto para o relatório do Dr. Aurélio; o busto do diretor ainda preside o chafariz.
- **Como o terror aparece aqui:** o jardim é bonito e aberto, mas tudo olha: espelhos de inspeção nos cantos, buracos de espiar nas sebes, silhuetas de enfermeiras nas janelas altas, corujas anilhadas nos postes. O jogador é o paciente sob observação.
- **Props únicos:**
  1. **Busto de bronze do Dr. Aurélio sobre o pedestal do chafariz**, oxidado de verde nos ombros, com placa "AO FUNDADOR, OS PACIENTES AGRADECIDOS". Esfera + cilindros `mergeGeos` com material metal `0x8a6a3a`; a cabeça é uma malha separada (gira). (só visual)
  2. **Espelhos convexos de inspeção** presos no alto dos quatro cantos do muro, com moldura de ferro. Calota esférica (`SphereGeometry` parcial) com material muito brilhante (envMap da cena se houver; senão Phong com `shininess` 120). (só visual, y 3,8)
  3. **Buracos de espiar nas sebes**: aberturas do tamanho de um rosto, à altura dos olhos, com galhos cortados em volta. 8 planos escuros com bordas de folhas (canvas com alfa) nas faces das 4 sebes. (só visual)
  4. **Placas esmaltadas em hastes**: "PACIENTES SÃO OBSERVADOS PARA O SEU PRÓPRIO BEM" e "NÃO SE AFASTE DO CAMINHO", esmalte branco lascado. 2 planos + hastes finas. (só visual)
  5. **Caderno de observação esquecido num banco**, aberto, com anotações de enfermeira: "17h10 · nº 44 olhou para o muro 4 vezes · nº 51 parou de responder ao nome". Caixa fina + plano com canvas + lápis. (só visual)
  6. **Corujas-buraqueiras com anilha numerada na pata**, uma no topo de cada poste. Esfera de corpo + esfera de cabeça + 2 discos emissivos âmbar nos olhos (piscam). (só visual)
  7. **Janelas altas com silhuetas de enfermeiras**: três "janelas" iluminadas no alto dos muros (y 3,2…4,2), cada uma com uma silhueta escura de touca, imóvel. Planos emissivos amarelados + plano de silhueta com alfa. (só visual)
- **Momento de assinatura:** *as sebes olham.* Gatilho: jogador em espaço aberto do Jardim (a mais de 3 m de sebes e do chafariz) parado por 3 s, no máximo uma vez a cada 2 rodadas. Os 8 buracos de espiar das sebes, um por vez, ganham dois pontinhos de brilho no fundo escuro (dois discos emissivos fracos, como reflexo de olhos), do mais longe para o mais perto do jogador; enquanto isso, passos de bota correm do lado de fora do muro leste e param na altura dele, e as silhuetas das janelas altas se apagam uma a uma (elas viram que ele viu). Um lápis risca papel por 1 s e os brilhos somem todos juntos. Duração ~5 s. Seguro: só emissivos pequenos e som; nenhuma luz nova, nada esconde zumbis.
- **Animações ambientais:** (a) cabeça do busto acompanha o jogador mais próximo bem devagar, no máximo ±35°, só quando ninguém olha direto para ele (até 0,2 rad/s); (b) corujas piscam (os discos dos olhos somem 0,1 s a cada 3–6 s, tempo sorteado com semente) e arrepiam as penas (escala ±3%); (c) a água escura do chafariz ondula (deslocamento de UV de uma textura de ondas, 0,05/s).
- **Luz e cor:** paleta `#4A5A34` grama, `#8A6A3A` bronze, `#C8D4FF` luz dos postes, `#E8C060` brilho de olho. PointLight real: uma das duas luminárias existentes (o pool escolhe), `0xc8d4ff`; a outra fica só bulbo. Emissivos: janelas altas, olhos das corujas, brilhos nos buracos das sebes (só no momento). Ao entrar: névoa 12–70, `gradePass` frio, sem granulação extra (claro e "vigiado").
- **Som ambiente:** grilos (pulsos de 4,5 kHz em trens de 3–5) + passos de bota no cascalho do outro lado do muro (rajadas de ruído passa-baixa 1,2 kHz, 6 passos) a cada 14–25 s, com o panner correndo ao longo do muro leste.
- **Escalada:** depois de ser ouvido na Ala, o jogador é visto: a sensação de ser observado se torna o tema, preparando a Torre e o anel externo (Portaria).
- **Implementação:** bbox x 27,5…62,5, z −7,5…23,5. Busto em (45; 2,5; 8) sobre o pedestal existente (topo a 2,5 m); espelhos em (28; 3,8; −7), (62; 3,8; −7), (28; 3,8; 23), (62; 3,8; 23); buracos nas faces das sebes (35, 1), (55, 1), (35, 15), (55, 15) a y 1,15; placas em (31,5; 0; 4) e (58,5; 0; 12), a 5 m e 6,7 m dos pontos de saída do chão (31, 9) e (52, 5); caderno no banco (45; 0,52; 2,6); corujas em (36; 3,85; 8) e (54; 3,85; 8); janelas altas na face leste do muro x 27 (z 6…9 e 14…17, longe da porta CK z −2…2) e na face sul do muro z 24 (x 32…35, longe da porta KL x 43…47). Nada perto do Widow's Wine (49,5; −7,05) nem do AK (62,45; 7). ~20 malhas + 8 planos de sebe + 16 discos emissivos pequenos. A cabeça do busto gira com `rotation.y` direto, sem alocação.

#### Biblioteca (N) · ordem 3 · algo que se move quando não observado
- **Conceito:** a biblioteca do Sanatório guarda, entre os livros de verdade, os prontuários encadernados de cada família levada; os mortos do Programa ainda vêm ler o que foi escrito sobre eles.
- **Como o terror aparece aqui:** nada se move enquanto o jogador olha. Mas a escada desliza pelo trilho, uma gaveta do fichário fica aberta, uma cadeira muda de lugar; a sala é arrumada por alguém que nunca aparece.
- **Props únicos:**
  1. **Fichário de cartões de carvalho com gavetas numeradas por faixa de família** (1–20, 21–40… até 401–412), uma gaveta aberta com as fichas carimbadas com a cruz de cal à mostra. Caixa + atlas de canvas das frentes + 1 gaveta separada (desliza). (só visual, colado à parede)
  2. **Escada de biblioteca com rodinhas presa ao trilho da estante**, de madeira, com o último degrau lascado. 2 caixas longas + 6 degraus instanciados + 2 rodinhas. (só visual)
  3. **Livros-prontuário encadernados em tecido cinza**: cerca de 30% dos livros das estantes trocados por lombadas cinzentas com etiqueta branca de número; alguns puxados até a metade. Mesmo `InstancedMesh` dos livros existentes, com cor/escala por instância. (só visual)
  4. **Abajur de banqueiro com cúpula verde rachada** sobre a mesa de leitura. Cilindro curvo (meia casca) emissivo verde + haste de latão. (só visual)
  5. **Carrinho de ferro de devolução** com prontuários empilhados e uma pulseira de paciente pendurada na alça. Caixa vazada + 4 rodinhas + pilha. (só visual)
  6. **Cadeiras de palhinha com "S.I." gravado no encosto**, quatro em volta da mesa de leitura. Uma malha `mergeGeos` por cadeira (assento, encosto, pés). (só visual)
  7. **Livro aberto "Do sono sem sonho", de A. Vasconcellos**, com notas a lápis na margem e óculos redondos dobrados em cima. Plano dobrado em V com canvas + toros finos dos óculos. (só visual)
- **Momento de assinatura:** *a cadeira que vem ler.* Gatilho: jogador na Biblioteca olha para longe da mesa de leitura (ângulo > 100° entre a câmera e a mesa) por 2 s e depois volta a olhar. No retorno, uma das cadeiras de palhinha está no fim do corredor central, virada para o jogador, com um livro-prontuário aberto no assento. Repete até 3 vezes por partida, e a cada vez a cadeira está mais perto (8 m, 5 m, 3 m do jogador, sempre fora das portas, janelas e da Caixa); depois da terceira, todas voltam ao lugar quando ele não estiver olhando. Seguro: a cadeira não tem colisão, só aparece em pontos fixos pré-validados, e só para quem disparou.
- **Animações ambientais:** (a) a gaveta aberta do fichário fecha ou abre 10 cm sempre que o jogador está de costas (teste de ângulo, no máximo uma vez a cada 15 s); (b) as páginas do livro aberto viram sozinhas em uma corrente de ar (rotação de um plano de página em 0,6 s, a cada 10–18 s); (c) a escada desliza 1 m pelo trilho quando ninguém olha (a cada 30–60 s, com o rangido de rodinhas tocado de costas para o jogador).
- **Luz e cor:** paleta `#5A4330` madeira, `#2F5A3A` verde da cúpula, `#FFB070` âmbar, `#8C8C88` cinza dos prontuários. PointLight real: a lâmpada existente em (−45, −22), âmbar `0xffb070`. Emissivos: cúpula verde do abajur e o cone de luz falso dele sobre a mesa (plano aditivo). Ao entrar: névoa 8–42, `gradePass` quente, granulação +10%.
- **Som ambiente:** páginas folheando (rajadas de ruído passa-alta 3 kHz, 0,3 s) vindas de uma estante sorteada a cada 6–12 s + rangido de madeira de estante (FM 110 Hz, 0,5 s) a cada 7–13 s.
- **Escalada:** depois da vigilância do Jardim, agora é a coisa que se move enquanto o jogador não vigia; o jogador passa a olhar para trás.
- **Implementação:** bbox x −62,5…−27,5, z −35,5…−8,5. Fichário na parede leste (−28; 0; −14), 1,6 m de largura, longe da janela (−27, −22 ± 0,8); escada encostada na face norte da estante (−52, −25) a z −24,6; abajur e livro aberto na mesa (−45; 0,8; −21,5); cadeiras em (−47, −21,5), (−43, −21,5), (−45, −23), (−45, −20); carrinho em (−29,5; 0; −28,2), no beco entre a ponta das estantes (x −31) e a parede, fora da janela leste; pontos da cadeira no momento: (−36, −21), (−40,5, −21), (−43, −15) no corredor central, sempre a mais de 2 m das portas GN (x −47…−43, z −8) e Nr1 (x −58…−54, z −36) e da Caixa (−36; −35,05). Nada perto do Dragunov (−62,45; −14). ~14 malhas + reaproveita o `InstancedMesh` de livros (só muda cor/escala de ~30%) + 6 degraus instanciados.

#### Cozinha (H) · ordem 3 · claustrofobia
- **Conceito:** a cozinha industrial que preparava a sopa do Programa com a água da Torre; quando a ala foi trancada, as cozinheiras ficaram presas lá dentro, e uma delas na câmara fria.
- **Como o terror aparece aqui:** a sala é grande, mas o alto foi tomado: grades de ganchos com panelas a 2,3 m, uma coifa de cobre que desce quase até a cabeça, vapor rasteiro. O espaço aperta por cima, e a câmara fria mostra o que é ficar preso.
- **Props únicos:**
  1. **Grade de ganchos de açougue pendurada baixa** sobre todo o salão, com panelas de alumínio amassadas, escumadeiras e conchas: o fundo das panelas fica a 2,3 m. Grade = barras finas `mergeGeos`; `InstancedMesh` de ~70 panelas (cilindros abertos) + 40 utensílios. (só visual, acima da cabeça)
  2. **Coifa de cobre baixa sobre o fogão central**, manchada de gordura e azinhavre, com a borda a 2,1 m. Pirâmide truncada (`CylinderGeometry` de 4 lados) com material metal `0xb87333`. (só visual)
  3. **Câmara fria (transformação da geladeira existente)**: porta de madeira e zinco entreaberta, maçaneta interna arrancada, marcas de unha e um avental preso na fresta por dentro. Plano de porta girado 15° com canvas de arranhões + avental (plano). (só visual sobre a colisão existente)
  4. **Monta-pratos na parede**: portinhola de correr com cordas de sisal subindo pelo poço, o vão é pequeno demais para um adulto e tem um sapato de cozinheira lá dentro. Moldura + plano preto do poço + 2 cordas + sapato. (só visual)
  5. **Caixotes de mantimentos "DOAÇÃO DO PROGRAMA"** com a cruz de cal carimbada e o número de família, empilhados contra a parede. `InstancedMesh` de 6 caixotes com atlas de canvas. (só visual, até 1,0 m)
  6. **Marmita basculante de 200 litros com a tampa amarrada com arame**, algo batendo por dentro de vez em quando. Cilindro + tampa (malha separada) + arame (toros). (colisão baixa ≤ 1,1 m, no canto)
  7. **Carrinho térmico de distribuição** (banho-maria sobre rodas) com 6 tampas de inox numeradas por ala, pronto para subir no monta-pratos; a última tampa ainda solta vapor. Caixa sobre rodas + `InstancedMesh` de 6 tampas. (só visual, encostado na bancada)
- **Momento de assinatura:** *a cozinha encolhe.* Gatilho: jogador no corredor entre o fogão e a bancada (x −44…−37, z 26…36) por 3 s, uma vez a cada 2 rodadas. A grade de ganchos desce 25 cm em 2 s com correntes rangendo e as panelas batendo umas nas outras; o vapor engrossa (névoa local de 35 para 14 m em 1,5 s); a porta da câmara fria fecha devagar até a fresta e bate com um baque abafado; tampa da marmita salta duas vezes. Em 6 s tudo volta (a grade sobe, a névoa abre, a porta fica entreaberta de novo). Seguro: o fundo das panelas nunca fica abaixo de 2,05 m (acima da cabeça do jogador e dos zumbis), a névoa a 14 m ainda mostra o corredor inteiro, nada tem colisão nova.
- **Animações ambientais:** (a) panelas balançando e tilintando de leve (rotação x/z ±3°, defasada, só nas 20 mais próximas); (b) vapor rasteiro saindo do fogão e espalhando no chão (10 sprites largos a 0,3 m de altura, reciclados); (c) tampa da marmita saltando 1 cm a cada 15–25 s com um baque metálico; (d) a corda do monta-pratos tremendo como se alguém puxasse lá em cima (a cada 20–40 s).
- **Luz e cor:** paleta `#A3A69C` azulejo, `#B87333` cobre, `#6E7470` alumínio, `#E6E1D2` vapor. PointLight real: a lâmpada existente em (−45, 32), `0xffe8c0`, com a coifa projetando sombra falsa (plano escuro aditivo-negativo no chão sob ela). Emissivos: nenhum além do vapor iluminado. Ao entrar: névoa fechada 6–35, `gradePass` amarelado com vinheta forte (+20%).
- **Som ambiente:** zumbido do compressor da câmara fria (senoide 60 Hz + 180 Hz, −28 dB) + tilintar de panelas (sino FM curto, portadora 1,2 kHz, razão 3,5) espaçado 2–6 s.
- **Escalada:** primeiro espaço que aperta fisicamente o jogador (de cima); depois dele vem o Necrotério, a primeira sala de corpos.
- **Implementação:** bbox x −62,5…−27,5, z 20,5…43,5. Grade de x −60 a −30, z 23 a 41, a y 2,35…2,9 (nunca abaixo de 2,05 m); coifa sobre o fogão (−48, 32), 9 × 3 m, borda a 2,1 m; câmara fria na geladeira existente (−31; 22,2), porta voltada para +z; monta-pratos na parede leste (−27,55; 0,9…1,7; 40), fora da porta HI (z 32…36); caixotes na parede oeste em z 31…34 (entre as janelas z 28 e 38, ≥ 2,8 m delas); marmita basculante no canto (−59,5; 0; 22,5), 5,5 m da janela (z 28) e fora da porta GH (x −47…−43); carrinho térmico junto à bancada (−34,5; 0; 42,2), longe do Galil (−55; 43,45). ~12 malhas + `InstancedMesh` (panelas 70, utensílios 40, caixotes 6, tampas 6) + 10 sprites. Balanço só nas 20 panelas mais próximas do jogador (índices fixos por setor), o resto parado.

#### Necrotério (I) · ordem 3 · corpo/grotesco
- **Conceito:** para onde iam os que morriam no Programa, e de onde voltavam: as gavetas têm números de família, as mortalhas têm amarras de queixo, e o livro de óbitos tem uma coluna para a hora do despertar.
- **Como o terror aparece aqui:** os corpos estão presentes, cobertos, mas inconfundíveis: um pé cinza com etiqueta no dedão, uma mão pendendo da mesa, um saco de lona que estica as correias. O grotesco está no que foi preciso fazer para mantê-los quietos, não em sangue.
- **Props únicos:**
  1. **Gavetas frias numeradas (transformação das existentes)**: 3 × 3 frentes de inox com plaquinhas de família; a gaveta 214 está amassada para fora, de dentro; a 117 está meio aberta com um pé cinzento e uma etiqueta de papel amarrada no dedão. Planos de frente com atlas + 1 gaveta separada (desliza) + pé (caixas `mergeGeos`). (só visual sobre a colisão existente)
  2. **Corpos sob os lençóis das três mesas**: volumes de cabeça, ombros e pés sob o pano; na mesa 3, uma mão acinzentada pende para fora, com a pulseira de paciente. Caixas arredondadas sob o lençol existente + mão (5 caixas). (só visual)
  3. **Pia de mármore de lavagem**, inclinada, com sulcos de escoamento e uma torneira de latão que solta um fio preto pelo sulco. Caixa inclinada + canvas de veios + torneira (cilindros). (só visual, colada à parede)
  4. **Ralo central com crosta preta e mangueira de lona enrolada** no chão ao lado. Disco de grelha (canvas) + decal de mancha radial + toro achatado da mangueira. (só visual, no chão)
  5. **Livro de óbitos pregado na parede**, colunas "Nº · Óbito · Despertar · Destino", a coluna "Despertar" preenchida em quase todas as linhas, "Destino: Crematório". Plano 0,6 × 0,8 com canvas + prego. (só visual)
  6. **Carrinho-maca de transporte com saco de lona amarrado por três correias**, as correias esticadas. Armação de tubos + rodas + saco (caixa arredondada com canvas de lona) + 3 tiras. (só visual)
  7. **Bacia de esmalte com pulseiras de paciente cortadas**, dezenas, sobre o gaveteiro. Meia-esfera + `InstancedMesh` de 30 pulseiras. (só visual, a 2,2 m)
  8. **Ataduras de queixo e mordaças de couro penduradas em ganchos**, prontas para os mortos que falavam. 6 planos/tiras em ganchos. (só visual)
- **Momento de assinatura:** *a gaveta 214.* Gatilho: jogador a ≤ 3 m do gaveteiro por 1,5 s, uma vez por partida por jogador. Três batidas de dentro da gaveta 214 (baques graves: senoide 70 Hz com ataque de ruído, intervalo 0,6 s), a plaquinha de número treme a cada batida, e na terceira a gaveta desliza 10 cm para fora e para; da fresta escapa um sopro de névoa fria (6 sprites azulados). A gaveta fica assim até o fim da partida. Seguro: deslocamento de uma malha visual de 10 cm dentro da colisão existente do gaveteiro (que tem 1,2 m de profundidade, a gaveta não sai da caixa de colisão em mais de 0,1 m).
- **Animações ambientais:** (a) as correias do saco no carrinho esticam e afrouxam (escala de 3 tiras ±4% em intervalos irregulares de 4–9 s, com rangido de couro); (b) a torneira da pia soluça de ar e cospe preto a cada 12–20 s; (c) a lâmpada fria pisca curto (intensidade a 30% por 80 ms, a cada 10–20 s); (d) gota caindo da ponta da mangueira no ralo a cada 2,5 s.
- **Luz e cor:** paleta `#8A9A9C` azulejo, `#9FD0FF` luz fria, `#6A6E70` pele cinza, `#2A2422` crosta. PointLight real: a lâmpada existente em (−18, 34), `0x9fd0ff`. Emissivos: nenhum; o sopro frio é sprite. Ao entrar: névoa 6–34, `gradePass` frio e dessaturado 25%, contraste +10%.
- **Som ambiente:** compressor das gavetas (senoides 55 Hz e 57 Hz batendo, −28 dB) + gotas no ralo (senoide curta 1,1 kHz caindo para 600 Hz em 60 ms).
- **Escalada:** o primeiro contato com corpos; depois da cozinha que aperta, a sala que mostra o produto do Programa. Prepara o Brejo e, no fim, o Crematório.
- **Implementação:** bbox x −26,5…−9,5, z 24,5…43,5. Gaveteiro existente (−25,9; 40), frentes em x −25,25 (z 37,8…42,2); corpos nas mesas (−18, 29,5), (−13, 29,5), (−18, 37), mão na mesa (−18, 37) para o lado +x; pia na parede leste (−10,4; 0,9; 27), fora da porta IJ (z 32…36); ralo em (−15,5; 0; 33,5) e mangueira em (−11,5; 0; 29); livro de óbitos na parede sul (−13; 1,6; 24,55), fora da porta DI (x −20…−16); carrinho no canto (−11,2; 0; 26,5), longe das portas IJ e Ir13 (x −14…−10, z 44); bacia em cima do gaveteiro (−25,9; 2,25; 39); ataduras na parede norte (x −24…−22; y 1,4), fora da janela (−18 ± 0,8). Nada perto do FAL (−26,45; 28). ~16 malhas + `InstancedMesh` (pulseiras 30) + 6 sprites. Sala pequena (360 m²): todos os props colados às paredes ou sobre as mesas, o miolo fica livre.

#### Estufa (L) · ordem 3 · falsa segurança
- **Conceito:** a estufa onde os pacientes "em melhora" cuidavam das plantas; tudo cresce bem demais, regado com a água da Torre e adubado com o que vinha do Crematório.
- **Como o terror aparece aqui:** depois do Necrotério, a única sala viva: verde, quente, um peixinho dourado no aquário, um bolo ainda morno. Os sinais são pequenos (tomates escuros demais, raízes como dedos, um saco de "farinha de osso"), até a névoa dos bicos ficar preta.
- **Props únicos:**
  1. **Regadores de zinco cheios de água preta** com etiqueta pintada "TORRE · IRRIGAÇÃO". 3 regadores (cilindro + bico + alça `mergeGeos`). (só visual)
  2. **Tomateiros carregados de tomates perfeitos, vermelho quase preto**, em cima das plantas existentes dos canteiros de z 30. `InstancedMesh` de ~120 esferas (r 0,05–0,07), material com brilho alto. (só visual)
  3. **Plaquinhas de canteiro com nomes de família**: estacas de madeira com "Fam. 31 · tomate", "Fam. 66 · couve". `InstancedMesh` de 16 estacas + atlas de canvas. (só visual)
  4. **Sacos de aniagem "FARINHA DE OSSO · SANTA INÊS · USO INTERNO"**, empilhados num canto, um aberto com pó cinza. `InstancedMesh` de 4 sacos + 1 cone de pó. (só visual, até 1,0 m)
  5. **Linha de nebulização**: cano fino de latão com 8 bicos pendurado da armação de vidro a 3,6 m sobre os canteiros. Cilindro + 8 cones instanciados. (só visual)
  6. **Banquinho do jardineiro com um bolo de fubá ainda morno**: banquinho de ripas com a tesoura de poda aberta e, em cima, a forma redonda do bolo coberta por um pano de prato, soltando vapor. Caixas + cilindro + plano. (só visual)
  7. **Aquário redondo com um peixinho dourado vivo**, sobre um pedestal de ferro na ponta de um canteiro: água limpa, pedrinhas e uma plantinha. Esfera de vidro transparente + peixe (2 esferas achatadas + cauda) + disco de pedrinhas. (só visual, a 1,1 m)
  8. **Mudas em tubos de ensaio grandes num suporte de madeira, com raízes compridas e acinzentadas, como dedos**, enfileiradas na ponta de um canteiro. 5 cilindros transparentes + raízes (cilindros finos tortos). (só visual)
  9. **Termômetro de mercúrio de parede marcando 37,0 °C exatos** (a temperatura de um corpo), placa de madeira com escala. Plano com canvas + tubo vermelho. (só visual)
- **Momento de assinatura:** *a rega.* Gatilho: os bicos ligam sozinhos a cada 60–90 s (névoa branca, inofensiva); se o jogador estiver olhando para um canteiro sob os bicos (≤ 25°) por 2 s enquanto a névoa sai, a água escurece em 1 s até ficar preta, os tomates e folhas ficam brilhando de preto (cor das instâncias puxada para `0x1b1d1f` com brilho), a água do aquário escurece junto e o peixinho para, rente ao vidro, virado para o jogador, e o termômetro sobe a 37,5 °C. Em 4 s a névoa para, as cores voltam devagar em 6 s e o aquário clareia. Seguro: só sprites, cor de instâncias e som locais; a névoa é fina e fica acima de 2,5 m até se dissipar.
- **Animações ambientais:** (a) o peixinho nada em voltas lentas no aquário; (b) folhas das plantas balançando leve quando a névoa está ligada (rotação das instâncias de planta ±4°, só nos canteiros sob os bicos); (c) vapor do bolo (3 sprites finos, sempre "morno"); (d) gotas caindo dos bicos depois de cada rega.
- **Luz e cor:** paleta `#4F7A30` verde vivo, `#8B1A1A` tomate escuro, `#E8E0C0` luz de dia falsa, `#9FC8B0` vidro. PointLight real: a lâmpada existente em (45, 34), puxada para quente `0xf0ffd0`. Emissivos: nenhum. Ao entrar: névoa aberta 12–60 e levemente esverdeada, `gradePass` quente, saturação +15%, granulação mínima: a sala mais "acolhedora" desde a Recepção.
- **Som ambiente:** abelhas mansas nas flores do tomate (dente-de-serra 220 Hz com vibrato lento, ganho baixo) e o borbulhador do aquário (bolhas de seno curto, 1,2 kHz) + chiado dos bicos durante a rega (ruído passa-alta 5 kHz, −30 dB).
- **Escalada:** uma volta deliberada à falsa segurança da Recepção, só que agora o jogador já sabe ler os sinais; o alívio dura pouco e prepara o anel externo (Pomar).
- **Implementação:** bbox x 27,5…62,5, z 24,5…43,5. Regadores nas pontas dos canteiros (41,3; 0,8; 30,9), (48,7; 0,8; 37,1), (41,3; 0,8; 37,1); tomates nos canteiros (36, 30) e (54, 30); estacas nos 4 canteiros; sacos no canto noroeste (28,7; 0; 42,4), 7 m da Caixa (36; 43,05) e fora da porta JL (z 32…36); linha de nebulização a y 3,6 sobre z 30 e z 38 (x 31…59); banquinho do jardineiro em (30,5; 0; 25,6), longe da porta KL (x 43…47) e do Dying Wish (49; 24,95); aquário no pedestal em (41,3; 0; 34), na ponta do canteiro, fora do corredor central; mudas na ponta do canteiro (54, 38) a x 58,8; termômetro na parede norte (52; 1,6; 43,45), fora da janela (45 ± 0,8). Nada perto do MP40 (62,45; 28) nem da porta Lr10 (z 38…42). ~16 malhas + `InstancedMesh` (tomates 120, estacas 16, sacos 4, bicos 8) + ~20 sprites de névoa reciclados. Cor das instâncias alterada só durante o evento (`instanceColor.needsUpdate` por ~60 quadros).

#### Torre d'água (M) · ordem 3 · presença invisível
- **Conceito:** a Torre recebia o Veio bombeado da mina e o servia a todo o prédio; os pacientes que já tinham acordado subiam a escada para ficar perto da água, e um deles ainda sobe.
- **Como o terror aparece aqui:** a Torre vaza preto pelas tábuas, os baldes esperam cheios, o cloro nunca foi usado. A presença é ouvida e sentida na estrutura: degraus que rangem em sequência, um cadeado que bate no degrau, um cata-vento que gira contra o vento.
- **Props únicos:**
  1. **Escorrimentos de água preta nas tábuas da caixa d'água e poça preta** ao pé da torre: listras escuras e brilhantes descendo pelo cilindro e uma poça irregular no chão. Canvas de escorrido aplicado como segundo cilindro levemente maior (transparente) + plano da poça com reflexo (Phong `shininess` 100). (só visual)
  2. **Cano de ferro do Veio** que sai do chão, sobe colado a uma perna da torre e entra no tanque, com **régua de nível de vidro** presa ao tanque mostrando uma coluna preta. Cilindro longo + 3 braçadeiras + tubo de vidro com núcleo escuro (escala y animada). (só visual)
  3. **Marcas de mãos cinzentas subindo a escada**, nas travessas da torre, cada vez mais altas. Decals pequenos (canvas de mão) instanciados (12). (só visual)
  4. **Fileira de 12 baldes de esmalte branco numerados em vermelho**, cheios até a borda de água preta parada, ao longo do muro oeste. `InstancedMesh` de 12 cilindros + 12 discos escuros. (só visual, 0,35 m)
  5. **Caixotes existentes viram "CLORO · MINISTÉRIO DA SAÚDE"**, tampas arrancadas e vazios por dentro. Canvas de estêncil nas faces + tampas como planos inclinados. (só visual sobre a colisão existente)
  6. **Cata-vento de lata em forma de galo** no topo do telhado cônico, enferrujado. Plano recortado com alfa + seta (caixa) + eixo. (só visual, y 17,8)
  7. **Corrente com cadeado cortada** no pé da escada: a corrente que fechava o primeiro degrau, cortada a alicate e caída na poça, e o cadeado aberto pendurado no degrau. `InstancedMesh` de 10 elos + cadeado (caixa + toro). (só visual)
- **Momento de assinatura:** *alguém sobe a escada.* Gatilho: jogador a ≤ 8 m da torre, parado por 3 s, no máximo uma vez a cada 2 rodadas. Rangidos de degrau sobem a escada um a um (11 rangidos, 0,45 s de intervalo, panner subindo pela posição da escada de y 0,4 a y 11); cada degrau verga 2° quando o som passa por ele; no topo, a tampa do tanque bate (baque de madeira) e se ouve algo grande entrar na água (ruído passa-baixa com cauda longa); um jorro preto transborda pela borda do lado da escada por 1,5 s (plano de escorrido com opacidade animada) e a poça se agita. Duração ~7 s. Seguro: só som, rotação de degraus visuais e planos; nada perto do Pack-a-Punch (45, −22), que fica visível e legível o tempo todo.
- **Animações ambientais:** (a) o galo do cata-vento gira devagar sempre no sentido contrário ao vento do mapa (direção oposta à da bandeira, 0,1 volta/s); (b) o cadeado aberto balança no degrau e bate de leve (±5°); (c) a coluna preta da régua de nível sobe e desce 5 cm em 12 s, como uma respiração; (d) ondinhas concêntricas na poça a cada gota que cai do tanque (anel de escala crescente, reciclado).
- **Luz e cor:** paleta `#4E4A3C` terra, `#1B1D1F` preto, `#A8B8D0` luar, `#8A6A4A` madeira molhada. PointLight real: a lâmpada existente da torre (45; 9,4; −22, dist 26), azulada `0xa8b8d0`. Emissivos: nenhum; a poça reflete. Ao entrar: névoa 10–60, `gradePass` frio e escuro (exposição −5%).
- **Som ambiente:** gotas grandes caindo na poça (senoide de 900 Hz descendo a 300 Hz em 80 ms, com eco curto) a cada 1,5–3 s + rangido grave da torre ao vento (FM portadora 90 Hz, 1,2 s) a cada 8–14 s.
- **Escalada:** presença invisível de novo, mas agora grande e sobre a fonte do Veio: o jogador está no coração da contaminação, que leva à Pedreira e à Lavanderia.
- **Implementação:** bbox x 27,5…62,5, z −35,5…−8,5. Escorrimentos no cilindro do tanque (45, −22, y 11…15,4); poça em (39,6; 0,02; −22) a oeste das pernas (fora da frente do Pack-a-Punch, que olha para +z); cano na perna (41, −18); régua de nível no tanque a x 40,1; mãos nas travessas perto da escada (x 49,45); baldes ao longo do muro oeste (x 28,4; z −33…−27), a 5 m da janela oeste (27, −22) e a 4,6 m do ponto de saída do chão (33, −27); caixotes existentes (32, −32), (33,6; −32,4), (58,5; −12,5); galo em (45; 17,8; −22); corrente e cadeado no pé da escada (49,45; 0…0,6; −22). Nada perto do Stakeout (62,45; −30), da Caixa (36; −35,05), da porta Mr9 (x 63, z −16…−12) e das janelas. ~14 malhas + `InstancedMesh` (baldes 12+12, mãos 12, ondas 4, elos 10). Degraus da escada: o `InstancedMesh` existente de degraus recebe a rotação por instância só durante o evento.

#### Caldeiras (P) · ordem 4 · claustrofobia
- **Conceito:** a casa de máquinas que aquecia a água da Torre para todo o Sanatório; o foguista trabalhava sozinho no calor, entre canos e manômetros, e não saiu quando trancaram o prédio.
- **Como o terror aparece aqui:** a claustrofobia agora é calor e pressão: ar que treme, vapor, canos que vibram, ponteiros no vermelho. A sala parece viva e prestes a estourar, e uma grade baixa na parede lembra que existe um lugar ainda mais apertado atrás dela.
- **Props únicos:**
  1. **Painel de manômetros de latão** na parede, seis mostradores com ponteiros, dois deles parados no vermelho, plaquinhas "TORRE", "ALA", "COZINHA". Placa + 6 discos com canvas + ponteiros (caixas finas, malhas separadas). (só visual)
  2. **Volantes de registro vermelhos e válvulas de alívio** sobre os canos altos, com fitas de pano amarradas. `InstancedMesh` de 8 toros + 4 cilindros de válvula. (só visual, y 3,7…4,1)
  3. **Monte de carvão com pá de cabo quebrado** e uma ficha de paciente meio queimada por cima, a cruz de cal ainda visível. Cone achatado com textura de carvão + pá (caixa + plano) + plano de papel com canvas de borda queimada. (só visual, 0,8 m)
  4. **Óculos de proteção do foguista** pendurados pela tira num registro de cano, as lentes verdes cobertas de fuligem e, riscado com a unha na fuligem de uma lente: "ainda não acabou". 2 toros + 2 discos + tira. (só visual)
  5. **Tanque marcado "ÁGUA DA TORRE · NÃO BEBER"** (transformação do tanque existente), com a válvula de purga aberta e uma mancha preta seca no chão embaixo dela. Canvas de estêncil + válvula (cilindros) + decal. (só visual sobre a colisão existente)
  6. **Grade baixa do túnel de serviço** na parede, 60 × 60 cm, ferro forjado, de onde sai ar quente; atrás, escuridão total. Plano de grade com alfa + plano preto atrás. (só visual)
  7. **Apito de vapor de latão** no alto da segunda caldeira, com a corrente de acionamento pendurada. Cilindro + cone + 6 elos. (só visual)
- **Momento de assinatura:** *a caldeira respira.* Gatilho: jogador entre as duas caldeiras (a ≤ 4 m do ponto (−45,5; 54,5)) por 3 s, uma vez a cada 2 rodadas. Todos os ponteiros do painel sobem para o vermelho em 1,5 s; os canos altos vibram (deslocamento de ±1 cm, 18 Hz); o apito solta um uivo grave e baixo (não estourado: dente de serra 220 Hz com passa-banda, −18 dB, 2 s); quatro jatos de vapor saem das válvulas acima da cabeça (sprites brancos, só acima de 2,4 m); a névoa fecha de 30 para 12 m e o brilho das fornalhas pulsa mais forte; depois um chiado longo de alívio e tudo volta em 3 s. Duração ~6 s. Seguro: nada causa dano, o vapor fica acima da cabeça, a lâmpada real e a energia não mudam, e a névoa a 12 m mostra a sala inteira entre as caldeiras.
- **Animações ambientais:** (a) ponteiros dos manômetros tremendo (±3°, ruído rápido com semente), um deles subindo devagar ao longo da rodada; (b) ar quente ondulando na frente das fornalhas (2 planos transparentes com deslocamento senoidal de UV); (c) brilho das fornalhas pulsando (intensidade do material básico ±15%, 0,7 Hz, defasado entre as duas); (d) fiapos de vapor escapando de uma junta com vazamento (4 sprites pequenos, contínuo).
- **Luz e cor:** paleta `#FF7020` fornalha, `#3A2A22` fuligem, `#6A4A36` ferrugem, `#D8D0C0` vapor. PointLight real: a lâmpada existente em (−45, 54), `0xff8a40`. Emissivos: os dois brilhos de fornalha que já existem (agora pulsando), mostrador iluminado do painel (fraco). Ao entrar: névoa densa 5–30 com cor `0x1a0f0a`, `gradePass` quente e avermelhado, contraste +10%, granulação +15%.
- **Som ambiente:** ronco das fornalhas (ruído marrom passa-baixa 120 Hz, −24 dB, com flutuação lenta) + estalos metálicos de dilatação (clique passa-alta 2 kHz, 10 ms) a cada 3–8 s, sorteados entre os canos; um arrastar ocasional vindo da grade do túnel (ruído passa-baixa 400 Hz, 1,5 s, a cada 25–45 s).
- **Escalada:** fecha o núcleo do prédio: o último espaço interno, o mais quente, mais escuro e mais apertado, a porta para o Ferro-velho e, dali, para o Crematório.
- **Implementação:** bbox x −62,5…−27,5, z 44,5…63,5. Painel de manômetros na parede leste (−27,55; 1,8; 48), longe da janela leste (z 54 ± 0,8) e da porta HP (x −47…−43, z 44); volantes e válvulas nos canos altos já existentes (z 63,2 e 44,8; y 3,7…4,1), sem nenhum acima da alavanca de energia (−52; 63,45) num raio de 2 m; carvão em (−60,5; 0; 60,5), 6,5 m da janela oeste (−63, 54) e 8,5 m da energia; óculos no cano perto da caldeira (−55, 52) a y 2,2; estêncil e válvula de purga no tanque (−45; 60,5); grade do túnel na parede oeste (−62,45; 0,3; 58,5), longe do MP5K (z 48) e da janela (z 54); apito no topo da caldeira (−36; 4,4; 57). Nada perto da porta Pr12 (x −33…−29, z 64) nem da janela norte (−40, 64). ~14 malhas + `InstancedMesh` (volantes 8, válvulas 4, elos 6) + ~16 sprites de vapor reciclados. Vibração dos canos aplicada no `InstancedMesh` de canos existente por um único `position` do objeto (não por instância).

#### Cemitério (r1) · ordem 4 · loop/repetição
- **Conceito:** é o cemitério do Programa, de 1957, de antes de existirem os fornos. Os "não salvos" eram enterrados por número, em fileiras iguais, sem nome nem cruz de família. Quando os mortos deixaram de ficar nas covas, o Dr. Aurélio mandou parar de enterrar. O coveiro continuou cavando a cova seguinte todos os dias.
- **Como o terror aparece aqui:** tudo se repete. Os marcos são iguais, os números seguem em sequência (301 a 346) e as pás são idênticas. A cova aberta do próximo número está sempre pronta. O som das pás volta com o mesmo ritmo, como um metrônomo. Na Vila o Cemitério (D) é de família (nomes, cruzes, epitáfios, mausoléu com colunas) e trabalha com som fora do lugar; aqui não há nome nenhum, só a contagem.
- **Props únicos:**
  1. **Marcos de concreto numerados** (as 46 lápides do tema): na frente de cada caixa `grave` entra uma plaqueta de 0,45 × 0,25 m com o número em baixo-relevo ("Nº 301"… "Nº 346", "S.I." e uma cruzinha de cal carimbada). Fazer com 46 planos juntados por `mergeGeos`, cada um com a UV numa célula de um atlas em canvas de 512 × 512 (8 × 6 números). (só visual)
  2. **Cova aberta nº 347**: retângulo de 1 × 2,2 m no chão. O fundo é um plano escuro com uma textura de canvas que pinta as paredes da cova em perspectiva (falsa profundidade). As bordas de terra são 4 caixas finas de 0,05 m. Na cabeceira, uma estaca com plaqueta de lata que mostra o número da vez. (só visual)
  3. **Monte de terra fresca** ao lado da cova: um cone achatado (raio 0,9 m, altura 0,45 m) com textura `dirt` mais escura e úmida. (só visual)
  4. **Carrinho de mão de cal virgem**: caçamba de chapa (caixa inclinada), roda (cilindro), dois cabos e um monte de pó branco por cima (cone com material `plaster` claro, emissivo fraco), com uma colher de pedreiro espetada. (só visual)
  5. **Linha de demarcação das próximas covas**: 12 estacas (cilindros de 0,04 × 0,5 m, instanciados) e um barbante branco esticado entre elas (caixas de 0,01 m juntadas). No chão, um "X" de cal a cada 3 m (decalques num atlas só): as covas que ainda vão ser abertas. (só visual)
  6. **Caixote de plaquetas prontas**: caixote de madeira encostado no muro, com uma pilha de plaquetas de lata já pintadas e numeradas (instanciadas); a de cima é a 347. (só visual)
  7. **Seis pás idênticas** encostadas no muro, à mesma distância umas das outras. Só uma tem terra fresca na lâmina. Instanciadas: cabo (cilindro) e lâmina (caixa fina). (só visual)
  8. **Lâmpada nua de extensão**: um fio que vem do muro e uma lâmpada sem cúpula pendurada na estaca da cova, de luz branco-azulada (emissiva). (só visual)
  9. **Sulco de roda gasto no chão**: uma elipse de 6 × 3 m em volta da cova, decalque de canvas com dois trilhos de roda de carrinho de mão que dão voltas e voltas no mesmo lugar. (só visual)
- **Momento de assinatura (a cova seguinte):**
  - **Gatilho:** o jogador está a 8 m ou mais da cova, com ela fora da vista (mais de 70° da direção da câmera) por 4 s ou mais.
  - **O que acontece:** a cova "anda" para a próxima vaga de uma lista fixa de 6 vagas vazias da grade. No lugar antigo fica um montinho baixo de terra (0,25 m) com uma plaqueta deitada no chão: 347. Ao mesmo tempo, sai da posição antiga o som de 4 golpes de pá. A cova nova mostra 348; depois 349… até 352. Na sexta vez, a cova está de volta à primeira vaga com 347 e todos os montinhos somem: o ciclo recomeça.
  - **Duração:** a troca é instantânea (fora da vista) e o som dura 3,6 s.
  - **Por que é seguro:** é só malha visual e decalque, sem colisão, com uma lista determinística. Roda no cliente.
- **Animações ambientais:**
  1. A lâmpada nua oscila no fio e falha às vezes (emissivo com ruído, 7 a 11 Hz).
  2. A plaqueta de lata da estaca gira no prego com o vento (rotação y = sen(t × 0,7) × 25°).
  3. Barbante vibrando com o vento (rotação x pequena, fase diferente por trecho).
  4. A cada 12 a 20 s, um torrão rola do monte de terra fresca para dentro da cova (uma instância reaproveitada).
- **Luz e cor:**
  - **Paleta:** #c9cfc4 (cal), #3a4630 (grama), #7f8a96 (concreto frio), #cfe0ff (lâmpada nua).
  - **Fontes:** nenhuma PointLight nova; as 2 lâmpadas do tema ficam com `lc: 0xbfd0ff`. Emissivas: a lâmpada nua.
  - **Ao entrar:** a névoa esfria para 0x0c1016 e o fim cai de 52 para 44 m; o grading fica levemente dessaturado e frio.
- **Som ambiente:**
  - (1) **Pás:** ruído branco com envelope curto (ataque de 5 ms, queda de 120 ms) num passa-banda de 900 Hz, somado a um seno de 70 Hz como baque. São sempre 4 golpes a 0,9 s um do outro, repetidos a cada 14 s exatos: a regularidade é o incômodo. O som vem da cova.
  - (2) **Vento rasteiro:** ruído rosa num passa-baixa de 400 Hz, com o ganho variando por um LFO de 0,07 Hz.
- **Escalada:** é a primeira área de fora do prédio. Logo depois da Biblioteca, o segredo sai do papel e vira chão: os pacientes eram números, e os números estão enterrados. A contagem continua e aponta para a frente (os "X" de cal das covas ainda não abertas).
- **Implementação:**
  - **Área:** bbox [-72,5, -24,5, -89,5, -36,5].
  - **Grade das lápides:** colunas a cada 3 m, de x = -67 a -31, sem as colunas -49 e -46 (corredor central). Fileiras em z = -84, -80, -76, -72, -64, -60 e -56 (z = -68 é o corredor).
  - **Posições:**

    | Peça | Posição |
    |---|---|
    | Cova 347 | (-43, -78), entre as fileiras -80 e -76, em vagas vazias |
    | Monte de terra | (-41,3, -78) |
    | Lista de vagas da assinatura | (-43, -78), (-61, -78), (-67, -66), (-37, -68,5), (-58, -82), (-52,5, -66) |
    | Carrinho | (-47,5, -86) |
    | Linha de demarcação | z = -52,5, de x = -52 a -31 |
    | Caixote e pás | muro z = -46 (face de dentro), x = -44 a -40 |

    Conferir as vagas da lista com os risers.
  - **O que evitar:**

    | Item | Posição |
    |---|---|
    | Janelas | (-60,7, -90), (-36,2, -90), (-36,2, -46) |
    | Arma | (-55,2, -78,9) |
    | Caixa | (-64,6, -52,2) |
    | Lâmpadas | (-30,9, -75,7), (-36,5, -67,2) |
    | Corredor da porta Nr1 | x = -58 a -54 |
    | Porta r1r2 | (-24, -68) |
    | Porta r1r4 | (-73, -68) |
    | Risers | (-63,2, -75,1), (-29,4, -79,4), (-50,2, -56,2), (-44,3, -67,3), (-60,8, -67,8), (-43,6, -53,3) |

  - **Peso:** cerca de 14 malhas, mais 3 instâncias (estacas, plaquetas do caixote, pás).
  - **Tema gerado (`graves`):**
    - Os 2 mausoléus do tema nunca são colocados (o `put` falha por causa das lápides); não contar com eles. Há 1 árvore seca, em (-51,9, -64,9).
    - **Trocar:** o material `grave` só desta região, por um campo novo na região (ex.: `mats: { grave: 'grave_r1' }`, lido no `put`), com concreto lavado e sem musgo.
    - **Não mexer** na altura nem no `rn(-.3,.3)` das lápides: mudar o número de chamadas de `rr()` desloca o sorteio de todas as regiões seguintes.
    - **Acrescentar:** o resto entra depois do `zGen`, num `ATMOS.r1()` com `mkRand` próprio.
  - **MAP_ANIM:** sai cedo se o jogador estiver a mais de 40 m.

#### Túneis de serviço (r5) · ordem 4 · claustrofobia
- **Conceito:** por estes corredores sob o morro, os carrinhos levavam os "não salvos" da Biblioteca para o Anexo e o Convento, e daí para o Forno, sem cruzar os pátios. Pelo teto passa o cano-mestre que leva o Veio da Torre d'água para o prédio.
- **Como o terror aparece aqui:** o teto desce para 3,3 m, as paredes suam, o cano zumbe e a névoa fecha a 30 m. As setas de cal nas paredes indicam destinos que ninguém quer. O corpo sente o labirinto como estreito, mesmo sendo largo.
- **Props únicos:**
  1. **Forro baixo de concreto com vigas**: um plano de 48 × 60 m a y = 3,3, com a face para baixo e textura `concrete` manchada de umidade, e 20 vigas instanciadas (0,3 × 0,4 m, a cada 3 m). Corta as paredes de 4,5 m. (só visual)
  2. **Trilho aéreo em I com carretilhas**: viga de ferro a 3,0 m, da entrada do Nr5 até antes da parede x = -86, com 9 carretilhas paradas (instanciadas) e um gancho em S em cada uma. (só visual)
  3. **Cano-mestre do Veio**: cilindro de ferro fundido de 0,5 m de diâmetro, preso ao forro ao longo de x = -100, com uma junta vazando. Gotas pretas (sprite) caem num ralo de ferro no chão. Do ralo sai uma mancha preta brilhante (decalque com `specular` alto). (só visual)
  4. **Padiola de rodízios baixa**: prancha de madeira a 0,45 m, 4 rodízios, duas cintas de lona soltas e uma etiqueta de papelão "CARGA 22 → FORNO" amarrada com arame. (só visual)
  5. **Setas de destino pintadas com cal**: 6 decalques em estêncil nas paredes, a 1,6 m de altura: "← ANEXO", "CONVENTO ↑", "FORNO →→", com números de lote riscados. Atlas único em canvas. As setas apontam de verdade para as portas r5r6 e r5r4, o que também ajuda o jogador. (só visual)
  6. **Lâmpadas de gaiola em fileira**: 14 bulbos com grade de arame (InstancedMesh com cor por instância) a cada 6 m, ao longo dos corredores principais, a 3,1 m. (só visual)
  7. **Portinholas de inspeção ao rés do chão**: 5 tampas de ferro de 0,6 × 0,6 m nas paredes soltas, com arranhões claros do lado de fora da tinta (canvas), como se viessem de dentro. Uma está entreaberta (rotação de 25°). (só visual)
  8. **Marcas de arrasto**: duas faixas paralelas escuras no piso (decalque de 0,5 × 8 m), indo até a portinhola entreaberta. (só visual)
- **Momento de assinatura (o apagar em fila):**
  - **Gatilho:** o jogador está andando dentro de r5 há 20 s ou mais e não há zumbi a menos de 6 m dele.
  - **O que acontece:** a fileira de bulbos do corredor em que ele está apaga de um em um, do mais distante para ele, a 0,35 s de intervalo, com um clique de relé em cada. O último apagado é o vizinho do bulbo que fica sobre a cabeça dele: esse continua aceso. O zumbido do cano para. Ficam 2,5 s só com esse bulbo e a lanterna. Depois a fileira religa na ordem inversa, a partir dele, e o zumbido volta.
  - **Duração:** cerca de 7 s; espera de 120 s até poder repetir.
  - **Por que é seguro:** mexe só na cor emissiva das instâncias (`setColorAt` durante o evento). A lanterna e as 2 lâmpadas reais do pool não mudam, então os zumbis continuam visíveis. Roda no cliente.
- **Animações ambientais:**
  1. Gotas pretas caindo da junta (3 sprites em ciclo, queda com aceleração; ao bater no ralo, um anel que cresce e some).
  2. Vapor saindo das juntas dos canos de chão do tema (`puff` com alfa 0,15, a cada 4 a 9 s).
  3. Um bulbo com filamento falhando (intensidade com ruído; corta 2 a 3 vezes a cada 10 a 25 s).
  4. A portinhola entreaberta treme (rotação de ±1,5° por 0,3 s) a cada 9 a 15 s.
- **Luz e cor:**
  - **Paleta:** #ffb070 (lâmpadas do tema), #4a4a46 (concreto), #2e3a2a (mofo), #0a0806 (fundo).
  - **Fontes:** nenhuma PointLight nova; as 2 lâmpadas do tema descem para y = 3,0 (campo novo `ly` na região, sem efeito no sorteio), para ficarem sob o forro. 14 bulbos emissivos.
  - **Ao entrar:** névoa 0x0d0b08, de 4 a 30 m; grading quente e mais escuro, com a vinheta mais forte (se houver uniform para isso).
- **Som ambiente:**
  - (1) **Zumbido do cano:** dente-de-serra de 50 Hz mais um harmônico de 100 Hz, num passa-baixa de 180 Hz, ganho baixo, com um tremor a cada 6 a 11 s (o fluxo engasga).
  - (2) **Gotas e batida:** senos curtos de 1,2 a 2 kHz com queda de 150 ms, a intervalos irregulares de 0,8 a 3 s. A cada 25 a 40 s, uma batida metálica distante (rajada de ruído num passa-banda ressonante de 220 Hz, Q 20).
- **Escalada:** depois do céu aberto do Cemitério, o caminho dos mortos desce para baixo da terra. É a primeira área fechada do anel, com o teto em cima do jogador. Na Vila, a Mina (J) era pedra e madeira de mineiro; aqui é alvenaria institucional, sinalizada, organizada para transportar gente.
- **Implementação:**
  - **Área:** bbox [-120,5, -63,5, -45,5, 13,5].
  - **Paredes do labirinto:** 24, já conhecidas (ex.: x = -86, z de -35,6 a -27,6, que fecha o corredor que vem do Nr5).
  - **Posições:**

    | Peça | Posição |
    |---|---|
    | Trilho | z = -29, de x = -74 a -85 |
    | Cano-mestre | x = -100, de z = -44 a 12 |
    | Vazamento e ralo | (-99,5, -19) |
    | Padiola | (-116, 10), no canto noroeste sem saída |
    | Portinholas | (-104, -15,0) na parede z = -15,4; (-112,7, -6) na parede x = -112,3; (-98,4, -1,6); (-82,6, -33); (-105,3, 3) |
    | Marcas de arrasto | até (-104, -15) |
    | Seta "← ANEXO" | perto de (-97, 6) |
    | Seta "CONVENTO ↑" | perto de (-97, -40) |

  - **O que evitar:**

    | Item | Posição |
    |---|---|
    | Janelas | (-121, -36), (-121, -16), (-121, 4), (-73, -36), (-73, -16) |
    | Arma | (-109,4, -30,6) |
    | Caixa | (-94,9, -16,5) |
    | Portas | r5r4 (-97, -46), r5r6 (-97, 14), gap do Nr5 (-73, -29) |

  - **Peso:** cerca de 12 malhas, mais 4 instâncias.
  - **Forro:** fica dentro do recorte por região (só desenhado quando o jogador está em r5 ou a menos de 20 m), para não cobrir o céu visto de fora.
  - **Tema gerado (`tunnels`):**
    - **Trocar:** o material dos canos de chão (`metal`) só nesta região, para "cano isolado com amianto" (branco-encardido com cintas).
    - **Acrescentar:** o forro e os bulbos depois do `zGen`.

#### Brejo (r13) · ordem 4 · algo que se move quando não observado
- **Conceito:** o corredor de 30 m que sai do Necrotério (Ir13) é o despejo do prédio. A água que lavava as mesas, o resto do Veio e o que não servia mais saíam por uma manilha neste brejo. O que foi jogado aqui continua andando à deriva.
- **Como o terror aparece aqui:** os frascos de amostra boiando nunca estão onde estavam, e sempre um pouco mais perto da margem onde o jogador está. A corrente do tripé de dragagem dá um puxão de vez em quando, como se algo embaixo mexesse.
- **Diferença para a Vila:** o Pântano e o Brejo negro são brejos naturais (presença invisível e corpo). Este é um esgoto institucional: bordas de concreto, refugo de vidro, placa de despejo.
- **Props únicos:**
  1. **Boca da manilha de esgoto**: cilindro de concreto de 1,6 m de diâmetro, meio enterrado no muro norte, com um fio de água escura escorrendo (plano com UV rolando). Um leque de mancha preta desce até a poça oeste. (só visual)
  2. **Frascos de amostra de vidro âmbar boiando**: 9 frascos (cilindro, gargalo e rolha de cortiça) com o rótulo "S.I. — AMOSTRA Nº 2xx", instanciados sobre as poças a y = 0,1. Material âmbar com emissivo fraco (0,15). (só visual, dentro do colisor da água)
  3. **Bote de chapa do serviço de limpeza**: bote de fundo chato, meio afundado e cheio até a borda, com uma vara de empurrar atravessada. Pintado na proa: "SERVIÇO". (só visual, na água)
  4. **Estacas de sondagem**: 6 varas com anéis de tinta vermelha a cada 0,5 m e uma plaqueta "aqui 12", "aqui 13"…, marcando onde se afundou alguma coisa. (só visual)
  5. **Tripé de dragagem**: três troncos (cilindros de 3,5 m) sobre a poça leste, com uma talha no topo e uma corrente esticada que entra na água. Os elos são instanciados. (só visual; os pés ficam dentro da água)
  6. **Aguapés cinzentos**: placas de aguapé boiando em parte das poças, com as flores lilases desbotadas para cinza ("o Veio descoloriu"). Instanciados, cerca de 30. (só visual)
  7. **Placa esmaltada**: "ÁGUA IMPRÓPRIA — DESPEJO DO SANATÓRIO", num poste torto ao lado da manilha. (só visual)
  8. **Barba-de-velho cinza-esverdeada** pendurada nas 7 árvores secas do tema (planos com alfa, 2 a 3 por árvore). (só visual)
- **Momento de assinatura (os frascos chegam):**
  - **Gatilho:** as duas poças ficam fora da vista (o centro de cada poça a mais de 75° da direção da câmera) por 1,5 s ou mais, com o jogador a menos de 15 m.
  - **O que acontece:** os frascos andam 0,8 m na direção do ponto da margem mais perto dele (presos dentro do retângulo da poça, com 0,3 m de folga). Quando ele olha de novo, eles estão parados, balançando como sempre. Depois de 5 movimentos, ficam amontoados na margem, aos pés dele. Se ele ficar olhando 3 s, o frasco mais próximo gira devagar até mostrar o rótulo inteiro: "AMOSTRA — DOADOR: S. LÁZARO DO VALE", sem número. Ao se afastar 15 m, eles voltam ao meio em 20 s (fora da vista).
  - **Duração:** contínua enquanto ele está perto; o giro do rótulo leva 1,2 s.
  - **Por que é seguro:** os frascos ficam dentro do colisor da água, onde ninguém anda. São só visuais e rodam no cliente.
- **Animações ambientais:**
  1. Frascos boiando (y e inclinação senoidais, fase por instância).
  2. Bolhas lentas no meio das poças (3 esferas que crescem e estouram, a cada 2 a 6 s).
  3. Barba-de-velho balançando.
  4. A corrente do tripé dá um tranco (rotação de 2° no eixo da talha e volta, com um rangido) a cada 10 a 20 s.
- **Luz e cor:**
  - **Paleta:** #3a3a2a (lama), #5d6b4a (lodo), #c7a24a (âmbar dos frascos), #0b0f0c (água).
  - **Fontes:** nenhuma PointLight nova. Emissivas: os frascos e um plano aditivo de névoa rasteira (0,6 m de altura) sobre cada poça.
  - **Ao entrar:** névoa 0x0e120c esverdeada, de 6 a 40 m. A água desta região ganha material próprio: oleosa, quase preta, com reflexo esverdeado (shininess 60).
- **Som ambiente:**
  - (1) **Borbulho:** seno descendo de 120 para 60 Hz em 80 ms, a cada 2 a 6 s, com uma posição aleatória (com semente) sobre as poças.
  - (2) **Fio d'água:** ruído num passa-banda de 2 kHz, ganho baixo, posicionado na manilha. Durante o movimento dos frascos, um tilintar de vidro (triângulo de 2,8 kHz, queda de 90 ms).
  - Nada de sapos: o silêncio de bicho é proposital.
- **Escalada:** o jogador vê pela primeira vez o resto físico do que acontecia dentro do prédio (amostras, esgoto). No Cemitério a contagem fica parada no chão; aqui ela começa a vir atrás dele.
- **Implementação:**
  - **Área:** bbox [-23,5, 23,5, 74,5, 113,5]; o corredor Ir13 vai de z = 44 a 74, em x = -12.
  - **Poças:** oeste em (-11,2, 87,1), 6,2 × 7,1 m; leste em (4,3, 90,3), 9,5 × 8,9 m. A cabana do tema não é colocada.
  - **Posições:**

    | Peça | Posição |
    |---|---|
    | Manilha | (-3, 75,3), no muro z = 74, fora do gap do Ir13 (x = -14 a -10) |
    | Mancha da manilha | de (-3, 76) até (-9, 83,5) |
    | Placa | (-1, 77) |
    | Tripé | sobre a poça leste, centrado em (4,3, 90,3) |
    | Bote | (-11, 88), dentro da poça oeste |
    | Estacas | nas bordas das poças |

  - **O que evitar:**

    | Item | Posição |
    |---|---|
    | Janelas | (12, 74), (-12, 114), (12, 114) |
    | Arma | (6,5, 81,3) |
    | Caixa | (-12,2, 102,7) |
    | Lâmpadas | (0,3, 106,1), (16,8, 105,2) |
    | Portas | (-24, 94), (24, 94) |
    | Risers | (4, 102,7), (-2,1, 86,1), (-8,8, 81), (-4, 97,2), (9, 100,1), (13,1, 91,9) |

  - **Peso:** cerca de 10 malhas, mais 4 instâncias (frascos, aguapés, elos, barba-de-velho).
  - **Tema gerado (`swamp`):**
    - **Trocar:** a cor e o material da água por região no `zGenDeco`, consultando `zGenZone` para cada poça.
    - **Acrescentar:** a canaleta de concreto no piso do corredor Ir13 (decalque de 0,6 m de largura com fio escuro), que costura este brejo ao Necrotério.

#### Pedreira (r3) · ordem 4 · isolamento
- **Conceito:** desta pedreira saiu a pedra do Sanatório, em 1931. Em 1957 o buraco virou o "isolamento ao ar livre": os pacientes inquietos demais para ficar no prédio eram presos a argolas na rocha. A comida descia num cesto, do alto do pilar de pedra.
- **Como o terror aparece aqui:** aqui se vê longe e não há ninguém. As correntes estão soltas, as marmitas foram lambidas e há riscos de contagem de dias. O cesto desce para o jogador como descia para eles: agora quem está no fundo do buraco é ele.
- **Diferença para a Vila:** a Pedreira (F) é dos mineiros (entrada de mina, vagoneta, gerador), e a Encosta e o Pico são rocha natural. Aqui a pedra é talhada e virou cela.
- **Props únicos:**
  1. **Argolas de ferro chumbadas na rocha** com correntes curtas soltas: 8 argolas (toro de 0,12 m) nas faces das pedras grandes, cada uma com 3 a 4 elos (toros pequenos instanciados) e uma chapinha de número batida na pedra ao lado. (só visual)
  2. **Pau-de-carga e sarilho no alto do pilar**: no topo do pilar de 12 m, uma lança de madeira de 2 m para fora, um tambor de corda e uma manivela. Recortados contra o céu. (só visual)
  3. **Cesto de vime no cabo**, pendurado da lança. Corda: cilindro fino com escala em y; cesto: cilindro aberto com textura de vime. (só visual)
  4. **Marmitas de alumínio vazias**: 12 latas empilhadas ao pé do pilar, abertas e limpas por dentro, cada uma com um número riscado a prego na tampa. Instanciadas. (só visual)
  5. **Riscos de contagem nos dias**: decalque de canvas numa face de pedra, com grupos de 5 riscos (cerca de 70 dias). Termina em "ainda não acabou", riscado com a mesma ponta. (só visual)
  6. **Ninho de pedras soltas**: meia-lua de pedras empilhadas, com 0,7 m de altura, encostada numa rocha, e um saco de estopa embolado dentro (onde alguém dormia). Pedras instanciadas e saco em caixa deformada. (só visual)
  7. **Escada de corda cortada**: desce do topo do pilar e termina pendurada a 4 m do chão. A ponta é desfiada (planos com alfa). Não há saída. (só visual)
- **Momento de assinatura (a refeição):**
  - **Gatilho:** o jogador está parado há 6 s ou mais, a menos de 7 m do pilar.
  - **O que acontece:** o sarilho no alto range e o cesto desce de y = 11 até y = 1,6 em 5 s, com a corda esticando. Fica parado 4 s: dentro há uma marmita fechada e uma caneca de lata. Depois sobe em 6 s. Se o jogador olhar para cima durante a descida (inclinação da câmera acima de 50°), vê a manivela girando sozinha, sem ninguém.
  - **Duração:** 15 s; espera de 90 s até poder repetir.
  - **Por que é seguro:** o cesto não tem colisão, para a 1,6 m e fica junto à face do pilar, longe das janelas e das portas. Roda no cliente.
- **Animações ambientais:**
  1. As correntes balançam quando o jogador passa a menos de 2 m (impulso de rotação que se amortece em 2 s).
  2. Um fio de cascalho escorre pela face do pilar (6 partículas em queda, a cada 8 a 15 s).
  3. A escada cortada balança com o vento.
  4. A ponta do saco de estopa do ninho levanta e assenta.
- **Luz e cor:**
  - **Paleta:** #5a4e3c (terra), #8f8a80 (pedra talhada), #c8b48a (vime), #6f7d93 (lua na pedra).
  - **Fontes:** nenhuma PointLight nova; as 2 lâmpadas do tema ficam com `lc: 0xc8d4ff`, frias.
  - **Ao entrar:** é a área mais "aberta" do anel. A névoa clareia para 0x161a20, de 10 a 60 m: vê-se longe, e o vazio pesa. O grading fica dessaturado e com mais contraste na pedra.
- **Som ambiente:**
  - (1) **Vento na borda do buraco:** ruído num passa-banda de Q 4, com o centro varrendo devagar de 400 a 900 Hz (assobio).
  - (2) **Cascalho:** a cada 15 a 30 s, uma pedrinha cai (impulso num passa-banda de 3 kHz, com 3 quiques cada vez mais curtos).
  - No momento de assinatura, o sarilho: FM com portadora de 180 Hz e moduladora de 23 Hz, mais cliques de catraca a 8 Hz.
- **Escalada:** os Túneis apertam o corpo; a Pedreira solta o jogador num espaço grande onde não há para onde ir. É o primeiro lugar onde a vítima é ele, e não um número de 1957.
- **Implementação:**
  - **Área:** bbox [24,5, 72,5, -89,5, -36,5].
  - **Pedras do tema** (as faces que recebem argolas):

    | Posição | Tamanho |
    |---|---|
    | (67,8, -75) | 2,5 × 2,6 × 4,6 m |
    | (54,4, -68,5) | 5,9 × 4,8 × 2,6 m |
    | (49,2, -58) | 5 × 4,4 × 5 m |
    | (43,2, -59,4) | 4,3 × 2,6 × 4,9 m |
    | (52,4, -85,4) | 5,6 × 2,4 × 1,8 m |

    Pilar: (48,5, -68), 3 × 3 × 12 m. A laje de metal do tema não é colocada.
  - **Posições:**

    | Peça | Posição |
    |---|---|
    | Lança | face leste do pilar, x = 50 a 52 |
    | Cesto | desce em (51,5, -68) |
    | Marmitas | (46, -66) |
    | Riscos de contagem | face sul da pedra (54,4, -68,5) |
    | Ninho | (47, -84) |
    | Escada cortada | face norte do pilar |

  - **O que evitar:**

    | Item | Posição |
    |---|---|
    | Janelas | (36,3, -90), (60,8, -90), (36,3, -46) |
    | Arma | (37,2, -56,2) |
    | Caixa | (44,7, -80,3) |
    | Lâmpadas | (61,4, -81), (35,5, -67,8) |
    | Gap do Mr3 | (56, -46) |
    | Portas | (24, -68), (73, -68) |

  - **Peso:** cerca de 9 malhas, mais 3 instâncias.
  - **Tema gerado (`rocks`):** trocar o material `rock` só nesta região por "granito talhado", com faces retas e marcas de cinzel em canvas. É a mudança visual que separa esta pedreira das pedras naturais da Encosta e do Pico.

#### Pomar (r10) · ordem 4 · falsa segurança
- **Conceito:** é o pomar da "laborterapia". Os pacientes colhiam frutas como tratamento, e a rega vinha da Torre d'água, ou seja, do Veio. As frutas saem grandes demais, brilhantes demais e fora de época.
- **Como o terror aparece aqui:** é a única área quente e "viva" do anel: luz âmbar, pássaros cantando, um banco com casaco dobrado. O conforto é falso: o canto vem de um pássaro de lata, as abelhas não zumbem e a fruta mordida é cinza por dentro.
- **Diferença para a Vila:** o Vinhedo é de parreiras e infância corrompida, e a Fazenda é rural. Aqui é cítrico, institucional e terapêutico.
- **Props únicos:**
  1. **Laranjeiras de tronco caiado** (as 2 árvores do tema): tronco pintado de cal até 1 m (segundo material na base), copa verde-escura lustrosa e 40 laranjas instanciadas (esferas de 0,09, laranja vivo com emissivo de 0,1). Três laranjas no chão estão cortadas ao meio, com o miolo cinza. (só visual)
  2. **Cerca-viva de pitangueira podada** (as 11 sebes do tema): nova textura de folha miúda e cerca de 200 pitangas vermelhas instanciadas na face das sebes. (só visual)
  3. **Escada de colheita de três pés**, encostada na laranjeira, com uma sacola de lona de colher pendurada no degrau de cima. (só visual)
  4. **Cestos de colheita etiquetados**: 5 cestos de vime em fila, cobertos com pano branco, cada um com uma etiqueta "PAVILHÃO 3 — LEITO 12", "LEITO 13"… O que está sob o pano não se vê. (só visual)
  5. **Placa pintada "LABORTERAPIA — O TRABALHO CURA"**, alegre, com florzinhas pintadas, em dois postes. (só visual)
  6. **Banco verde de ripas** com um casaco de lã cinza dobrado e uma laranja mordida (miolo cinza) no assento. (colisão baixa 0,5 m, encostado no muro)
  7. **Gaiola de passarinho com pássaro de corda de lata**, pendurada num galho da laranjeira a 2,4 m. O pássaro é pintado de amarelo e tem a chave nas costas. (só visual)
  8. **Três colmeias de caixa branca numeradas** ("1", "2", "3"), sobre tijolos, com um tapete de abelhas mortas no chão em volta (decalque). (só visual)
  9. **Canaletas de rega de cimento** entre as sebes, com uma comporta de tábua. A água parece limpa, mas tem um brilho escuro (plano com `specular`). (só visual)
- **Momento de assinatura (o canto):**
  - **Gatilho:** o canto de pássaro toca o tempo todo enquanto o jogador está no Pomar. O evento dispara quando ele olha para a gaiola (dentro de 12°, a até 15 m) por 3 s.
  - **O que acontece:** de perto, vê-se que o "passarinho" é de lata e gira no poleiro, com a chave girando. Depois de 3 s de olhar, a chave desacelera, o canto arrasta (o tom cai uma oitava em 2 s) e para. Para também o vento nas folhas: 20 s de silêncio total na área. Depois tudo volta, como se nada fosse.
  - **Duração:** 25 s; espera de 120 s até poder repetir.
  - **Por que é seguro:** é só som e uma rotação pequena. Os sons dos zumbis não são afetados (só a camada ambiente da área é silenciada). Roda no cliente.
- **Animações ambientais:**
  1. O pássaro de lata e a chave girando.
  2. A copa respira de leve com a brisa (escala de ±1,5%).
  3. A cada 30 a 60 s, uma laranja cai e rola 1 m (uma instância reaproveitada, que volta para o galho fora da vista).
  4. O pano dos cestos levanta numa ponta com o vento.
- **Luz e cor:**
  - **Paleta:** #f2b54a (laranja), #4a5a34 (folha), #e9dfc0 (cal dos troncos), #ffd9a0 (lâmpada quente).
  - **Fontes:** nenhuma PointLight nova; as 2 lâmpadas do tema ficam com `lc: 0xffd9a0`, quentes. Emissivo fraco nas frutas.
  - **Ao entrar:** névoa mais quente e clara (0x1a1610, de 10 a 58 m); grading um pouco mais saturado e quente. É o respiro proposital antes do anel 5.
- **Som ambiente:**
  - (1) **Canto de pássaro:** seno com chilreios em FM (de 2,5 a 5 kHz), uma frase de 5 notas repetida com variação mínima a cada 3 a 7 s. São dois "pássaros", um mais longe, que saem na verdade da mesma gaiola.
  - (2) **Folhas:** ruído num passa-alta de 2 kHz, ganho baixo, com um LFO de 0,2 Hz.
- **Escalada:** depois de três áreas de medo crescente, o jogo oferece descanso. A falsa paz deixa o jogador desarmado para a Lavanderia e o anel 5.
- **Implementação:**
  - **Área:** bbox [63,5, 120,5, 14,5, 63,5].
  - **O que já existe:** 11 sebes de 0,8 × 11 × 1,3 m, ao longo de z, em x = 80, 85, 90, 95, 100, 105 e 110; árvores em (84, 28,8) e (82,9, 43,8). O celeiro não é colocado.
  - **Posições:**

    | Peça | Posição |
    |---|---|
    | Gaiola | galho da árvore (84, 28,8), lado leste, a 2,4 m |
    | Escada | (85,2, 29,5) |
    | Cestos | (90, 21) a (90, 25) |
    | Placa | (77, 46) |
    | Banco | encostado no muro z = 63,5, em (110, 62,6) |
    | Colmeias | (114, 48), (114, 51), (114, 54) |
    | Canaletas | entre as sebes, z = 33 a 35 |

  - **O que evitar:**

    | Item | Posição |
    |---|---|
    | Janelas | (73, 26,5), (73, 51,5), (121, 26,5), (121, 51,5) |
    | Arma | (108,1, 42,9) |
    | Caixa | (87,8, 42,9) |
    | Lâmpadas | (88,9, 29,6), (84,2, 33,3) |
    | Gap do Lr10 | (73, 40) |
    | Portas | (97, 14), (97, 64) |
    | Risers | (109,9, 34,1), (95,7, 51,8), (101,8, 26,8), (81,5, 18), (113,5, 20,9), (102,3, 37,1) |

  - **Peso:** cerca de 12 malhas, mais 4 instâncias (laranjas, pitangas, abelhas e pés de cesto).
  - **Tema gerado (`field`):**
    - **Trocar:** o material `hedge` só desta região (folha miúda) e a cor da copa das árvores desta região no `zGenDeco`.
    - **Acrescentar:** as frutas, separadas por região com `zGenZone`.

#### Lavanderia (r9) · ordem 4 · algo que se move quando não observado
- **Conceito:** toda a roupa do Programa passava por aqui. As camisolas dos que iam "para o tratamento" eram lavadas, recebiam o carimbo do próximo número e eram dobradas para o seguinte. A lavagem apagava o nome bordado pelas mães.
- **Como o terror aparece aqui:** as 68 máquinas giram sozinhas, e as camisolas penduradas no trilho do teto andam enquanto o jogador não olha. A fila delas vai se juntando atrás dele.
- **Diferença para a Vila:** na Vila há roupa de casa no varal, ao ar livre. Aqui é roupa de paciente, industrial e numerada.
- **Props únicos:**
  1. **Trilho de teto com camisolas numeradas**: dois trilhos a 3,4 m, com 14 camisolas de algodão cru em cabides de arame. A barra fica a 2,05 m, acima da cabeça de um zumbi. Nas costas, o número carimbado (347 a 360, a mesma contagem do Cemitério). Plano duplo com canvas e alfa na barra desfiada. (só visual)
  2. **Visores redondos nas máquinas**: as 68 caixas `metal` do tema ganham uma porta de vidro redonda na face do corredor (círculos instanciados), com o tambor girando por dentro (textura em espiral com UV girando). Em 6 delas, um pano cinza tomba lá dentro. (só visual)
  3. **Calandra de passar lençol**: dois rolos de 2,8 m sobre a mesa de madeira do tema, com um lençol entrando entre eles (plano que avança). (só visual sobre o colisor da mesa)
  4. **Pilhas de camisolas dobradas e carimbadas**: 3 pilhas de 6 sobre duas mesas, com o número aparente na dobra. (só visual)
  5. **Rol de roupa e carimbo**: livro de rol aberto (colunas "Nº / peças / destino", com "FORNO" escrito na última coluna das linhas mais recentes), carimbo de borracha e almofada roxa. (só visual)
  6. **Tina de anil**: meio barril de madeira com líquido azul vivo e ondulação (plano com `specular`), com uma camisola meio afundada. (só visual)
  7. **Cestos de vime com rodízios**, cheios de roupa cinza amontoada (caixa deformada, com textura). São 3. (só visual)
  8. **Luvas de borracha de cano longo**: 8 luvas laranja penduradas em pregos na parede, de dedos para baixo. (só visual)
- **Momento de assinatura (a fila das camisolas):**
  - **Gatilho:** o trilho fica fora da vista (mais de 80° da direção da câmera) por 1 s ou mais, com o jogador a menos de 25 m.
  - **O que acontece:** a camisola da ponta mais distante desliza 1,6 m pelo trilho na direção do z do jogador, até encostar na anterior. Na volta do olhar, tudo está parado e um único rangido de roldana soa. Quando as 14 estiverem juntas na ponta mais próxima dele, a primeira aparece virada de frente. A frente tem um nome bordado à mão, "Antônio", riscado por um carimbo "347".
  - **Duração:** contínua; volta à posição inicial depois de 2 min com o jogador fora da área.
  - **Por que é seguro:** a barra fica a 2,05 m, então os zumbis continuam inteiramente visíveis. As camisolas ficam longe da arma e das janelas. São só visuais e rodam no cliente.
- **Animações ambientais:**
  1. Tambores girando nos visores (rotação da UV, fase escalonada por fileira).
  2. Os rolos da calandra giram e o lençol avança e volta.
  3. Vapor sobre a tina (`puff` com alfa baixo, a cada 3 a 6 s).
  4. As luvas murcham e enchem (escala em y de ±4%, cada uma no seu tempo), como dedos se mexendo.
- **Luz e cor:**
  - **Paleta:** #9a9e98 (azulejo), #e8e6dc (algodão), #3b5ba8 (anil), #c8d4e8 (luz fria).
  - **Fontes:** nenhuma PointLight nova; as 2 lâmpadas do tema ficam com `lc: 0xd8e4ff`. A tina tem emissivo fraco.
  - **Ao entrar:** névoa 0x0e1114, de 6 a 40 m, com um véu de vapor (plano aditivo baixo); grading frio e limpo.
- **Som ambiente:**
  - (1) **Máquinas:** seno de 55 Hz com a amplitude batendo a 0,8 Hz (o tombo do tambor). As 3 fileiras ficam defasadas, formando uma polirritmia que nunca se acerta.
  - (2) **Água chacoalhando:** ruído num passa-baixa de 700 Hz com um LFO de 0,8 Hz.
  - Na assinatura, o rangido de roldana: FM com portadora de 900 Hz e moduladora de 40 Hz, com 250 ms.
- **Escalada:** fecha o anel 4. Depois do falso respiro do Pomar, a contagem do Cemitério reaparece nas costas das camisolas e vem atrás do jogador. É a ponte para o anel 5.
- **Implementação:**
  - **Área:** bbox [63,5, 120,5, -45,5, 13,5].
  - **O que já existe:** máquinas em x = 91, 97 e 103, a cada 2 m, de z = -39 a 7; mesas em (114,2, -27,3), (86,2, -20,7), (81,6, 9), (114,2, 0,9), (85, -14,5) e (83,6, -35,2).
  - **Posições:**

    | Peça | Posição |
    |---|---|
    | Trilhos das camisolas | x = 110,5 e 113, de z = -32 a 8 (sem passar sobre a arma) |
    | Calandra | mesa (86,2, -20,7) |
    | Pilhas dobradas | mesas (85, -14,5) e (81,6, 9) |
    | Rol | mesa (83,6, -35,2) |
    | Tina | (116, -8) |
    | Cestos | (108, -20) a (108, -24) |
    | Luvas | parede z = 13 (face de dentro), x = 106 a 112 |

  - **O que evitar:**

    | Item | Posição |
    |---|---|
    | Janelas | (73, -36), (73, 4), (121, -36), (121, -16), (121, 4) |
    | Arma | (109,2, -37,9) |
    | Caixa | (100, 2,2) |
    | Lâmpadas | (82,7, -33,1), (110,3, -26,4) |
    | Gap do Mr9 | (73, -14) |
    | Portas | (97, -46), (97, 14) |
    | Riser | (107,7, -13,4), sob o trilho, mas a barra a 2,05 m não esconde o zumbi que sai dali |

  - **Peso:** cerca de 10 malhas, mais 3 instâncias (68 visores, 14 camisolas, 8 luvas).
  - **Tema gerado (`laundry`):** acrescentar os visores pela lista de caixas `metal` da região, depois do `zGen`, sem mexer no sorteio.

#### Ferro-velho (r12) · ordem 5 · médico/clínico
- **Conceito:** é o pátio de sucata atrás das Caldeiras. Aqui foram desmontados os carros tomados das famílias e a primeira ambulância do Programa, a que fazia a "triagem em domicílio". O baú dela foi tirado do chassi e virou um posto de triagem parado.
- **Como o terror aparece aqui:** o clínico invade a sucata. Instrumentos estão enfileirados sobre um capô, há tambores de resíduo com uma pasta cinza vazando e um banco de couro com cintas dentro do baú. É o atendimento que acontecia na porta das casas.
- **Diferença para a Portaria:** lá está a ambulância inteira; aqui só o baú, destacado.
- **Props únicos:**
  1. **Baú de ambulância destacado sobre calços**: caixa branca de 3,9 × 2,2 × 2,4 m, com portas duplas abertas. A cruz vermelha foi raspada e por cima pintaram o selo do Programa (círculo "S.I." com uma cruz de cal). Dentro: um banco dobrável de madeira com duas cintas de couro afiveladas, uma luminária de teto e um negatoscópio na parede do fundo. (fica sobre o colisor do carro do tema, que tem 1,8 m)
  2. **Cilindros de éter tombados em pilha**: 10 cilindros verdes e pretos com a etiqueta "ÉTER — PROGRAMA", instanciados. (só visual)
  3. **Tambores brancos de resíduo**: 6 tambores de 200 L com o estêncil preto "RESÍDUO — NÃO ABRIR — Nº 0xx", três tombados. De um deles escorre uma pasta cinza (decalque que cresce). (só visual)
  4. **Porta de carro usada como quadro de placas**: uma porta solta encostada num contêiner, com 9 placas da vila pregadas ("SL-031", "SL-047"…), uma por família levada. (só visual)
  5. **Maletas de médico de couro abertas sobre um capô**: duas maletas e uma toalha branca com instrumentos enfileirados (caixas finas e cilindros, cerca de 20, instanciados). (só visual)
  6. **Girafa de oficina com rolos de sonda de borracha**: guincho de oficina de ferro, com a corrente segurando um rolo de tubos de borracha vermelha pendurados. (só visual)
  7. **Placas de vila nos carros**: as 13 sucatas do tema ganham placas instanciadas com os números das famílias, ligando os carros ao quadro de placas. (só visual)
- **Momento de assinatura (o negatoscópio):**
  - **Gatilho:** o jogador está a menos de 6 m da traseira do baú e olha para dentro (menos de 20° do eixo das portas).
  - **O que acontece:** a luminária do baú pisca três vezes e acende, e o negatoscópio liga com um zumbido. Nele aparece uma radiografia de tórax em que veias cinzentas ramificadas sobem do estômago até a garganta (o Veio). Embaixo, o carimbo "TRIAGEM — APTO PARA O PROGRAMA". Depois de 4 s, a fivela de uma das cintas do banco bate uma vez no metal (som e um balanço de 0,3 s) e tudo apaga.
  - **Duração:** 6 s; espera de 60 s até poder repetir.
  - **Por que é seguro:** só emissivo e som, dentro de um volume fechado sobre um colisor que já existe. Roda no cliente.
- **Animações ambientais:**
  1. Os tubos de borracha da girafa balançam.
  2. Uma porta de carro solta abre e fecha devagar com o vento (rotação y até 25°, com rangido).
  3. A pasta cinza do tambor tombado cresce bem devagar (escala do decalque até o máximo em 10 min; volta a cada rodada).
  4. Flocos de ferrugem caem do contêiner mais alto (partículas raras).
- **Luz e cor:**
  - **Paleta:** #d9d6c8 (branco sujo do baú), #3e3e3a (asfalto), #8a2a22 (cruz raspada), #9fd6ff (negatoscópio).
  - **Fontes:** nenhuma PointLight nova; a luminária e o negatoscópio são emissivos.
  - **Ao entrar:** névoa 0x0d0e10, de 7 a 44 m; grading com um tom de ferrugem nos médios.
- **Som ambiente:**
  - (1) **Chapa solta:** batida num passa-banda ressonante de 340 Hz, Q 30, a intervalos irregulares de 3 a 9 s (com semente).
  - (2) **Radiador pingando:** senos de 900 Hz com queda curta, a cada 2 s.
  - Na assinatura, o zumbido do negatoscópio: dente-de-serra de 120 Hz num passa-baixa de 400 Hz.
- **Escalada:** abre o anel 5 e põe o clínico fora do prédio. A triagem acontecia nas casas da vila, e o que se pesava nela era quem servia para o Programa. Este é também o caminho direto para a porta do Crematório.
- **Implementação:**
  - **Área:** bbox [-72,5, -24,5, 64,5, 113,5].
  - **Posições:**

    | Peça | Posição |
    |---|---|
    | Baú | sobre a sucata (-36,2, 95,9), de 3,9 × 2,2 m, com as portas para leste (x = -34) |
    | Cilindros | (-66,5, 103,5) |
    | Tambores | (-55, 110,5) |
    | Porta-quadro | encostada no contêiner (-45, 85,3), face norte |
    | Maletas | capô da sucata (-59,1, 99,6), a y = 2,0 |
    | Girafa | (-47, 111) |

  - **O que evitar:**

    | Item | Posição |
    |---|---|
    | Janelas | (-60,7, 74), (-60,7, 114), (-36,2, 114) |
    | Arma | (-49,4, 95,4) |
    | Caixa | (-52,1, 89,7) |
    | Lâmpadas | (-40,4, 97,1), (-35,3, 87,6) |
    | Gap do Pr12 | (-31, 74) |
    | Portas | (-24, 94) e (-73, 94): nada a menos de 4,5 m da frente delas |

  - **Peso:** cerca de 12 malhas, mais 4 instâncias.
  - **Tema gerado (`junk`):**
    - **Trocar:** a paleta `car` só nesta região, para cores desbotadas com poeira.
    - **Acrescentar:** as placas pela lista de caixas `metal` da região. O baú usa a caixa existente; não criar colisor novo.

#### Portaria (r2) · ordem 5 · vigilância
- **Conceito:** é a entrada principal, de frente para a Recepção. Toda família chegava aqui na ambulância branca e era registrada na guarita. Os carros das famílias continuam nas vagas, com a mudança amarrada no teto.
- **Como o terror aparece aqui:** o lugar continua vigiando. A fresta de vigia da guarita acompanha o jogador com atraso. A ambulância, intacta, tem o motor ligado sem motorista. Cada vaga tem o número de uma família pintado no meio-fio.
- **Diferença para outras áreas:** na Vila, a ambulância é só marca de pneu (Praça); no Ferro-velho é só o baú.
- **Props únicos:**
  1. **A ambulância branca inteira**: furgão de 2,1 × 5,0 × 2,3 m, com faróis redondos, cruz vermelha e para-choque cromado, de frente para a Recepção. Fica sobre o colisor do carro (-16, -60) do tema (1,9 × 4,2 × 1,5 m): não muda a navegação. (visual sobre colisão existente)
  2. **Guarita vestida** (a caixa de 5 × 4 × 3 m do tema): janela de correr com vidro, balcão, telhadinho de beiral, e uma fresta de vigia com veneziana de ferro de correr. (só visual sobre o colisor)
  3. **Prancheta do guarda** presa por um barbante na janela da guarita: a lista de veículos autorizados a entrar tem uma linha só, "AMBULÂNCIA — S.I.", repetida em todas as folhas. (só visual)
  4. **Quadro de crachás de visitante**: na parede externa da guarita, 20 crachás de papelão "VISITANTE" pendurados na coluna "ENTRADA"; a coluna "SAÍDA" está vazia. (só visual)
  5. **Números das famílias nas vagas**: o meio-fio diante de cada vaga tem o número de uma família pintado à mão (decalques num atlas), como vaga reservada. (só visual)
  6. **Cadeira de rodas de vime** parada na faixa diante da guarita, virada para a Recepção, com uma manta cinza dobrada no assento, "esperando". (só visual)
  7. **Bomba de gasolina de manivela** ao lado da guarita, com o globo de vidro no alto e o bico pendurado pingando preto numa lata. (só visual)
  8. **A mudança no teto dos carros**: em 5 dos 8 carros, colchões enrolados, cadeiras e gaiolas de galinha amarrados com corda, com o número da família escrito a giz numa tábua. Instanciadas. (só visual)
  9. **Placa esmaltada** "SANATÓRIO SANTA INÊS — VISITAS SUSPENSAS POR ORDEM DA DIREÇÃO" no muro sul. No asfalto, "PARE — IDENTIFIQUE-SE" pintado diante da guarita e "AMBULÂNCIA" pintado numa vaga. (só visual)
- **Momento de assinatura (a guarita vê):**
  - **Gatilho:** a primeira entrada do jogador na Portaria e, depois, a cada 90 s com ele dentro.
  - **O que acontece:** um estalo de relé; a veneziana de ferro da fresta de vigia corre devagar e passa a acompanhar o jogador por 8 s com 0,8 s de atraso, a abertura sempre virada para ele (uma faixa escura onde brilha, por um instante, o reflexo de uns óculos). Quando ela para nele, os faróis da ambulância acendem (discos emissivos e dois cones aditivos curtos), apontados para a Recepção, e o motor acelera uma vez. Se ele olhar direto para a guarita durante o evento (menos de 10°), as folhas da prancheta levantam sozinhas, uma a uma. No fim, a veneziana fecha e os faróis apagam juntos.
  - **Duração:** cerca de 10 s.
  - **Por que é seguro:** a luz é falsa (nenhuma luz real), com alfa máximo de 0,25, sem ofuscar nem esconder zumbis. Roda no cliente.
- **Animações ambientais:**
  1. **Motor da ambulância ligado:** a carroceria treme 3 mm a 25 Hz e sai fumaça do escapamento (`puff` a cada 0,7 s).
  2. As cordas da mudança batem com o vento.
  3. Os crachás do quadro tremulam.
  4. A roda da cadeira de rodas gira meia volta a cada 30 a 50 s, como se alguém a empurrasse de leve.
- **Luz e cor:**
  - **Paleta:** #f1efe6 (branco da ambulância), #3a3c3a (asfalto), #c43a2a (listras e cruz), #fff2c0 (faróis).
  - **Fontes:** nenhuma PointLight nova; os faróis são falsos (discos e cones aditivos).
  - **Ao entrar:** névoa padrão do Sanatório (0x0a0d14, de 8 a 52 m); grading com um pouco mais de contraste.
- **Som ambiente:**
  - (1) **Motor em marcha lenta:** dente-de-serra de 28 Hz mais 56 Hz, num passa-baixa de 200 Hz, com tremolo de 7 Hz, posicionado na ambulância e baixo.
  - (2) **Veneziana:** ferro raspando no trilho (ruído num passa-banda de 1,8 kHz) durante o movimento; um baque de relé ao abrir e ao fechar.
- **Escalada:** depois do clínico do Ferro-velho, o jogo dá ao jogador a sensação de ser recebido e anotado. Ele é o próximo da lista, e a guarita sabe onde ele está.
- **Implementação:**
  - **Área:** bbox [-23,5, 23,5, -89,5, -46,5].
  - **O que já existe:** carros em z = -60 (x = -16, -12,8, -9,6, -3,2, 3,2, 9,6, 12,8) e em z = -76 (x = -12,8 e 9,6); guarita em (0, -68).
  - **Posições:**

    | Peça | Posição |
    |---|---|
    | Ambulância | sobre o carro (-16, -60), frente para z = -46 |
    | Cadeira de rodas | (3, -84), na faixa diante da guarita |
    | Bomba de gasolina | (3,5, -68), face leste da guarita |
    | Quadro de crachás e prancheta | face oeste e janela da guarita |
    | Números das vagas | meio-fio das vagas em z = -60 e z = -76 |
    | Mudança | carros (-12,8, -60), (-9,6, -60), (3,2, -60), (12,8, -60), (9,6, -76) |
    | Placa | muro z = -46, x = 0 |

  - **O que evitar:**

    | Item | Posição |
    |---|---|
    | Janelas | (-12, -90), (12, -90), (-12, -46), (12, -46) |
    | Arma | (-6,4, -80,4) |
    | Caixa | (2,3, -73,8) |
    | Lâmpadas | (-5,4, -71,2), (10,4, -65,8) |
    | Portas | (-24, -68), (24, -68) |

  - **Peso:** cerca de 12 malhas, mais 2 instâncias.
  - **Tema gerado (`parking`):** só material: a guarita (`wall`) desta região ganha a textura de guarita e os carros, poeira. Os cones de luz ficam com `depthWrite: false`.

#### Anexo do asilo (r6) · ordem 5 · infância corrompida
- **Conceito:** o Anexo era onde as crianças da vila ficavam "em observação". Era a última etapa antes do Crematório: o corredor do Anexo vai em linha reta da porta dos Túneis até a porta do Forno.
- **Como o terror aparece aqui:**
  - Tudo é ausência e sugestão: sapatinhos alinhados à porta das celas, desenhos, uma amarelinha de giz e uma pedrinha que avança sozinha em direção à última porta.
  - **Nunca:** figura de criança, corpo, sangue, violência mostrada ou som de choro.
- **Diferença para outras áreas:** na Vila, o Acampamento e o Vinhedo são infância ao ar livre; no prédio, o Teatro é espetáculo. Aqui é a enfermaria infantil vazia.
- **Props únicos:**
  1. **Sapatinhos enfileirados à porta de cada cela**: 9 pares de alpargatas de lona, de bico para o corredor, cada par com uma etiqueta de papelão amarrada por barbante ("C-01" a "C-10"). No lugar do C-07 só há a etiqueta. Instanciados (18 pés). (só visual)
  2. **Desenhos de giz de cera colados nas divisórias**: 8 folhas (canvas com traço tremido gerado), a 1,0 a 1,3 m:
     - uma casa com uma cruz branca na porta;
     - um carro branco com cruz vermelha cheio de bonequinhos;
     - um prédio grande com chaminé e nuvem cinza;
     - "QUERO IR PRA CASA".

     (só visual)
  3. **Amarelinha de giz no piso do corredor**: decalque comprido de z = 18 a z = 58, com as casas numeradas C-01 a C-10. No fim, o "CÉU" foi apagado e redesenhado mais adiante, com uma seta de giz para a porta do Crematório. (só visual)
  4. **Pedrinha chata da amarelinha**: seixo achatado (esfera escalada) sobre a casa 1. (só visual)
  5. **Escovas de dente numeradas** num suporte de lata sobre a pia baixa de azulejo, na ponta da divisória: dez escovas de cabo de osso, C-01 a C-10, gastas; a C-07 está seca e nova. (só visual)
  6. **Caminhas de ferro de grade baixa** (as 10 camas do tema, re-texturizadas): esmalte branco descascado e um cobertor cinza dobrado em quadrado perfeito, com o número costurado. Numa delas o cobertor está aberto e o colchão tem só uma marca afundada, pequena. (visual sobre o colisor existente de 0,5 m)
  7. **Balanço de tábua pendurado num cano** do teto, com o assento a 0,5 m, num canto do espaço aberto do fim da ala. (só visual)
  8. **Quadro de estrelinhas de comportamento**: cortiça com as linhas C-01 a C-10, estrelinhas douradas de papel e o título "DIAS PARA IR PARA CASA". As linhas param em dias diferentes. (só visual)
  9. **Duas tigelas de mingau intactas** no chão de duas celas, com nata seca e a colher em pé. (só visual)
- **Momento de assinatura (a pedrinha):**
  - **Gatilho:** o jogador está no corredor (x de -100,5 a -93,5) e a pedrinha fica fora da vista (mais de 70° da direção da câmera) por 1 s ou mais.
  - **O que acontece:** quando ele volta a olhar, a pedrinha está uma casa adiante, em direção à porta do Crematório. Quando ela se move, sai do ponto dela um "tic" baixo de pedra em cimento. Na casa 10, ela some. A palavra "CÉU" aparece borrada, como se alguém tivesse ficado de pé em cima.
  - **Duração:** contínua; volta a zero depois de 3 min ou na rodada seguinte.
  - **Por que é seguro:** é um decalque e uma malha minúscula, sem colisão. A Caixa no corredor continua livre (a pedrinha passa ao lado, a 1 m dela). Roda no cliente.
- **Animações ambientais:**
  1. O balanço oscila 6°, amortece até parar e volta a ser "empurrado" a cada 40 a 70 s, sem ninguém.
  2. As pontas das folhas de desenho levantam e baixam com a corrente de ar.
  3. Poeira suspensa na luz das 2 lâmpadas (pontos lentos, cerca de 60).
- **Luz e cor:**
  - **Paleta:** #9fd0ff (`lc` frio do tema), #8a8a80 (azulejo), #e6d9a8 (papel e giz), #c64a3a (giz vermelho dos desenhos).
  - **Fontes:** nenhuma PointLight nova.
  - **Ao entrar:** névoa 0x0b0f14, de 6 a 38 m; grading mais dessaturado e frio que o Pomar; só o giz vermelho escapa.
- **Som ambiente:**
  - (1) **Caixinha de música distante:** triângulo de 1,5 a 2,5 kHz, com uma melodia pentatônica de 5 notas e queda longa. Toca a cada 40 a 70 s, de uma cela sorteada com semente, com o andamento caindo e desafinando no fim, como corda acabando.
  - (2) **Zumbido baixo das lâmpadas:** 100 Hz.
- **Escalada:** é o penúltimo degrau. A Portaria registrava quem chegava; o Anexo mostra quem não saiu. O corredor conduz literalmente à porta do Crematório.
- **Implementação:**
  - **Área:** bbox [-120,5, -73,5, 14,5, 63,5].
  - **O que já existe:** divisórias de 16,5 m em z = 23, 29, 35, 41 e 47, centradas em x = -108,7 e -85,2; corredor de x = -100,5 a -93,5; camas em x = -115,5 e -78,5, nos z 25, 31, 37, 43 e 49.
  - **Posições:**

    | Peça | Posição |
    |---|---|
    | Sapatos | x = -100,2 e -93,8, em z = 26, 32, 38 e 44 (lado oeste também em 50; o leste não, por causa da Caixa) |
    | Amarelinha | centro x = -97 |
    | Desenhos | faces das divisórias, dentro das celas |
    | Escovas de dente | pia baixa na ponta da divisória (-100,6, 23) |
    | Balanço | (-118, 58) |
    | Quadro de estrelinhas | muro z = 14 (face de dentro), x = -89 |
    | Tigelas | celas oeste z = 32 e leste z = 38 |

  - **O que evitar:**

    | Item | Posição |
    |---|---|
    | Janelas | (-121, 26,5), (-121, 51,5), (-73, 26,5), (-73, 51,5) |
    | Arma | (-106,2, 20,5) |
    | Caixa | (-95,5, 51,2) |
    | Lâmpadas | (-107,4, 42,2), (-86,8, 33,7) |
    | Portas | (-97, 14), (-97, 64) |
    | Risers | (-89,1, 30,9), (-81,8, 52,2), (-114,1, 52,4) |

  - **Peso:** cerca de 10 malhas, mais 2 instâncias.
  - **Tema gerado (`cells`):** trocar só materiais desta região: `metal` (camas) vira esmalte branco descascado, e `wall` (divisórias) vira reboco com barra de azulejo até 1,5 m.
  - **Revisão:** pedir a um revisor humano que confira o tom antes de fechar (regra de cuidado).

#### Ruínas do convento (r4) · ordem 5 · religioso
- **Conceito:** é o convento das Irmãs de Santa Inês, que cuidavam do asilo antes do Dr. Aurélio. Elas entregaram os órfãos ao Programa acreditando na cura, e depois rezavam "pelos números". Na roda dos expostos a vila deixava seus filhos "para as irmãs"; a partir de 1957, era ali que o Programa os recolhia.
- **Como o terror aparece aqui:** é fé cúmplice:
  - santas com o rosto caiado;
  - terços em que cada conta tem um número;
  - campas rasas das irmãs, com as últimas já cortadas e em branco;
  - a roda que gira sozinha ao som da sineta.
- **Diferença para outras áreas:** na Vila, a Igreja é o sino grande e a fé do povo, e o Bairro queimado é purificação pelo fogo. A Capela do prédio tem os bancos. Aqui é a clausura.
- **Props únicos:**
  1. **Roda dos expostos**: cilindro de madeira de 1,0 m de diâmetro por 1,2 m de altura, com um quarto aberto, embutido num muro a 0,9 m do chão. A moldura é de pedra caiada. (só visual, dentro do muro)
  2. **Sineta da portaria**: sino de bronze de parede numa mola de ferro em braço curvo, com o cordão de puxar cortado e uma fita roxa de luto amarrada na mola, presa na verga de uma janela partida, no alto de um muro. (só visual)
  3. **Arcos do claustro**: 4 arcos de tijolo rebocado e caiado, sobre muros quebrados do tema, acima de 2,2 m. Meio-anel com a extrusão de um `Shape`. (só visual)
  4. **Nichos de santas de rosto caiado**: 3 nichos rasos nos muros, com imagens de gesso (cilindros, cone e esfera) e o rosto coberto por uma demão grossa de cal. (só visual)
  5. **Terços de contas numeradas**: 12 terços pendurados em pregos numa fileira, com contas cor de osso (esferas instanciadas, cerca de 600). As maiores têm números pintados. (só visual)
  6. **Campas rasas das irmãs no chão**: 8 lajes rentes (0,03 m) com "IRMÃ …" e datas de 1957. As 3 últimas estão cortadas e em branco. (só visual)
  7. **Esteira de palha gasta** no chão diante da roda, com os dois sulcos dos joelhos e um livro de horas aberto em cima: a ladainha é uma lista de números ("pelo 1, pelo 2… pelo 412"). (só visual)
  8. **Tabuleiro de areia com tocos de vela de sebo**: cerca de 40 tocos sem número, fincados em forma de cruz; 9 estão acesos. (só visual)
  9. **Hábito preto pendurado** num cabide de pau atrás da roda, com a barra suja de cal. (só visual)
- **Momento de assinatura (vésperas):**
  - **Gatilho:** o jogador está a menos de 4 m da roda e olha para ela (menos de 20°) por 2 s.
  - **O que acontece:**
    1. A sineta da portaria toca duas vezes, sozinha, a mola balançando, como quem chama à roda.
    2. Sobe dos muros um coro feminino sem palavras por 6 s.
    3. A roda gira 90° devagar, sozinha, e mostra o compartimento: vazio, só com um papel dobrado com uma cruz de cal e "recebido — 412".
    4. O coro corta no meio da nota e um toco do tabuleiro apaga.
  - **Duração:** cerca de 10 s; uma vez por rodada.
  - **Por que é seguro:** a roda faz parte do muro e não muda colisão; é só som e rotação. Roda no cliente.
- **Animações ambientais:**
  1. Chamas das velas tremulando (sprites).
  2. A sineta balança de leve fora do evento (2°).
  3. Os terços balançam em fases diferentes.
  4. Pó de reboco cai dos arcos (4 partículas, a cada 10 a 20 s).
- **Luz e cor:**
  - **Paleta:** #e9e4d6 (cal), #6e4a3c (tijolo), #ffcc80 (vela), #5a3f6e (roxo de luto).
  - **Fontes:** nenhuma PointLight nova; cerca de 12 chamas emissivas (sprites).
  - **Ao entrar:** névoa 0x0d0b10 levemente violeta, de 7 a 46 m; grading com altas quentes (velas) e sombras frias.
- **Som ambiente:**
  - (1) **Vento nos arcos:** ruído num passa-banda de 250 Hz, com um uivo ressonante de 1,1 kHz de vez em quando.
  - (2) **Coro** (só na assinatura): 3 vozes em dente-de-serra (Lá2, Mi3, Lá3) por filtros de formante "u" (300 / 870 / 2240 Hz), com ataque lento.
  - A sineta: soma de senos nas razões 1 / 2,4 / 3,0 / 4,2, com quedas exponenciais de 2 s.
- **Escalada:** depois do Anexo, o jogador descobre quem assinou embaixo: a fé local abençoou a lista. O número 412 aparece aqui antes do Crematório.
- **Implementação:**
  - **Área:** bbox [-120,5, -73,5, -89,5, -46,5].
  - **O que já existe:** 18 muros de tijolo do tema (ex.: x = -96,6, z de -70,5 a -60,2, com 3,5 m; x = -93,4, z de -64,5 a -55,4, com 2,6 m) e 10 pedras. A coluna central do tema não é colocada.
  - **Posições:**

    | Peça | Posição |
    |---|---|
    | Roda | muro x = -96,6, em z = -62, face leste |
    | Esteira | (-95, -62) |
    | Hábito | (-97,2, -61) (atrás do muro) |
    | Sineta | topo do muro x = -93,4, em z = -57 |
    | Arcos | sobre os muros (-101,8, -73,6), (-99,6, -76,7), (-114,3, -80,9) e (-81,7, -56,6) |
    | Nichos | muros (-103,2, -60,8), (-111,1, -65,3) e (-85,6, -79,6) |
    | Terços | muro (-114,3, -61,1) |
    | Campas | piso entre (-108, -70) e (-104, -66) |
    | Tabuleiro | (-88, -68) |

  - **O que evitar:**

    | Item | Posição |
    |---|---|
    | Janelas | (-109, -90), (-85, -90), (-121, -79), (-121, -57) |
    | Arma | (-107,9, -56,6) |
    | Caixa | (-92,4, -68,2) (o tabuleiro fica a 4 m) |
    | Lâmpadas | (-85,1, -54,8), (-108,6, -77) |
    | Portas | (-73, -68), (-97, -46) |

  - **Peso:** cerca de 14 malhas, mais 3 instâncias.
  - **Tema gerado (`ruins`):** trocar só nesta região o material `brick` por "tijolo caiado descascado" (reboco branco com o tijolo aparecendo) e `stone` por "cantaria lavrada" (pedaços de capitel). Só material; o sorteio fica igual. É o que a separa das Ruínas da cidade e do Bairro queimado.

#### Ilha do lago (r14) · ordem 5 · som fora do lugar
- **Conceito:** a ilhota no lago abaixo do Sanatório era o retiro particular do Dr. Aurélio. Ele vinha de barco a remo, tomava chá e ouvia valsas no gramofone enquanto os fornos trabalhavam do outro lado do morro.
- **Como o terror aparece aqui:** uma valsa toca baixinho, elegante e completamente errada para o lugar, e nunca vem de onde deveria. O gramofone está parado; a música sai de baixo do píer, de dentro da água.
- **Diferença para a Vila:** a Ilha do porto é de pescadores, com isolamento, torre de pedra e cabana. Aqui é lazer de rico: latão, porcelana, vime.
- **Props únicos:**
  1. **Gramofone com corneta de latão** sobre uma mesinha redonda, com o disco preto e a agulha no sulco final. (colisão baixa 0,75 m, só a mesinha)
  2. **Mesa de chá posta para dois**: ferro batido e porcelana branca; uma xícara cheia, a outra emborcada no pires, e um bule. (colisão baixa 0,75 m)
  3. **Barco a remo do diretor**: casco branco com o nome "REPOUSO" na popa e os remos recolhidos, amarrado ao píer por uma corda. (só visual, dentro da água)
  4. **Cavalete de pintura** com uma aquarela inacabada do Sanatório visto do lago, as janelas pintadas uma a uma; ao lado, a caixa de tintas aberta e um copo de água turva. (só visual)
  5. **Partituras molhadas boiando**: 12 folhas na água sul, com a valsa "Sobre as Ondas" (Juventino Rosas, 1888, domínio público) no cabeçalho. Planos instanciados. (só visual)
  6. **Sinos de vento de vidro** pendurados num poste na ponta do píer. (só visual)
  7. **Fio de lanternas de papel** sobre o píer: 6 apagadas e uma acesa, laranja. (só visual)
  8. **Cadeira de vime de espaldar alto**, virada para o Sanatório, com uma manta xadrez e, no braço, um cinzeiro com um charuto ainda soltando fumaça. (só visual)
- **Momento de assinatura (a valsa):**
  - **Gatilho:** a valsa começa baixinha quando o jogador entra na área.
  - **O que acontece:**
    1. A valsa sai posicionada sobre a água sul (filtro de disco velho).
    2. Quando o jogador chega a 3 m do gramofone, vê o prato parado e a agulha batendo no sulco final, mas a música continua. A fonte passa para baixo das tábuas do píer, com um passa-baixa de 600 Hz, abafada como se estivesse submersa.
    3. Se ele pisa no píer, a música corta seco. Atrás dele, o gramofone começa a girar e só se ouve o "tic… tic" do sulco final.
  - **Duração:** o corte dura até ele sair do píer. Uma vez por rodada, depois a cada 3 min.
  - **Por que é seguro:** é áudio e uma rotação pequena. A música fica sempre abaixo dos sons dos zumbis (ganho máximo de 0,12). Roda no cliente.
- **Animações ambientais:**
  1. Fumaça do charuto (`puff` fino e lento).
  2. As partituras derivam devagar.
  3. O barco balança, com a corda esticando e afrouxando.
  4. A lanterna acesa balança e a luz dela tremula.
- **Luz e cor:**
  - **Paleta:** #1d3440 (água noturna), #c9a45a (latão), #f4ead2 (porcelana), #ff9a5a (lanterna de papel).
  - **Fontes:** nenhuma PointLight nova; a lanterna é emissiva, com um reflexo (plano aditivo) na água.
  - **Ao entrar:** névoa 0x0a1218 azulada, de 10 a 55 m (água aberta); grading mais frio. A água desta região fica mais lisa e espelhada (shininess 140), com um brilho de lua num plano aditivo.
- **Som ambiente:**
  - (1) **Valsa:**
    - melodia em 3/4 em onda triangular, com acompanhamento de "um-dois-três" em senos graves;
    - passa-banda de 300 a 3000 Hz (disco velho);
    - chiado: estalos esparsos e ruído rosa baixo.
  - (2) **Água:** ruído num passa-baixa de 400 Hz, com ondas a 0,2 Hz.
  - Os sinos de vento: senos de 2,1 / 2,9 / 3,7 kHz, aleatórios com semente, tocando mesmo quando nada se mexe.
- **Escalada:** é a área mais bonita do anel 5 e a mais doente. Aqui o jogador encontra o conforto do responsável. O som fora do lugar prepara o Crematório: a valsa é o que tocava enquanto lá se queimava.
- **Implementação:**
  - **Área:** bbox [24,5, 72,5, 74,5, 113,5].
  - **O que já existe:**

    | Água | Posição | Tamanho |
    |---|---|---|
    | Norte | (39,5, 86,5) e (57,5, 86,5) | 13 × 7 m cada |
    | Sul | (48,5, 101,5) | 31 × 7 m |
    | Oeste | (36,5, 94) | 7 × 8 m |
    | Leste | (60,5, 94) | 7 × 8 m |

    Píer em (48,5, 86,5). Ilha útil: x de 40 a 57, z de 90 a 98. A torre e a cabana do tema não são colocadas.
  - **Posições:**

    | Peça | Posição |
    |---|---|
    | Gramofone | (42,5, 96,5) |
    | Mesa de chá | (54,5, 96,5) |
    | Cadeira | (55,5, 93,5), virada para z negativo |
    | Cavalete | (43, 92) |
    | Barco | (44, 86,5), na água norte |
    | Sinos de vento | (48,5, 83,2), ponta norte do píer |
    | Lanternas | fio sobre o píer, a 2,6 m |
    | Partituras | água sul |

  - **O que evitar:**

    | Item | Posição |
    |---|---|
    | Lâmpadas (na ilha) | (48,6, 95,1), (46,8, 91,7) |
    | Risers | (51,4, 91,6) na ilha; (49,2, 86) no píer |
    | Janelas | (36,3, 74), (60,8, 74), (36,3, 114), (60,8, 114) |
    | Arma | (57,9, 80,6) |
    | Caixa | (66,3, 85,7) |
    | Portas | (24, 94), (73, 94) |

  - **Peso:** cerca de 11 malhas, mais 2 instâncias.
  - **Tema gerado (`island`):** acrescentar o material de água por região (o mesmo mecanismo do Brejo) e mudar o piso do píer para tábua envernizada.

#### Floresta (r8) · ordem 5 · presença invisível
- **Conceito:** esta é a mata atrás da Pedreira. Era por aqui que fugiam, descalços e de camisola listrada, os que escapavam do Programa. Os guardas os caçavam com cães (a rodada dos cães nasce aqui). Um deles nunca parou de correr.
- **Como o terror aparece aqui:** alguém anda ao lado do jogador sem existir. As pegadas descalças aparecem no folhiço no ritmo dos passos dele, os grilos se calam onde "ele" passa, e no fim as pegadas param de frente para o jogador.
- **Diferença para a Vila:** a Floresta (P) trabalha com coisas que se movem sem ser vistas, e o Bosque com vigilância. Aqui é fuga e caça.
- **Props únicos:**
  1. **Tiras de camisola listrada rasgadas presas nos galhos**: 10 tiras de algodão azul e branco, a 1,5 a 2,2 m, marcando a linha da fuga da porta r3r8 até o canto nordeste. Planos com alfa. (só visual)
  2. **Cocho de ração dos cães de caça**: tabuleiro de lata pregado num tronco, com 5 tigelas de ferro, a placa pintada "CÃES DA GUARDA" e uma guia de couro cortada pendurada no prego. (só visual)
  3. **Armadilha de mandíbula fechada sobre um tamanco de paciente**: o tamanco de madeira está preso entre os dentes de ferro. (só visual, 0,15 m)
  4. **Cerca de arame farpado tombada** ao longo da borda norte: postes caídos e rolos de arame no chão (0,3 a 1,0 m), em trechos. (só visual)
  5. **Quepe de guarda e lanterna de mão caídos no musgo**: a lanterna continua acesa, fraca, e lança um facho falso (cone aditivo rente ao chão) sobre umas folhas. (só visual)
  6. **Folhiço**: tapete de folhas secas (cerca de 300 planos pequenos instanciados) nas clareiras onde as pegadas da assinatura aparecem. (só visual)
  7. **Covinha rasa coberta de cal**: retângulo de 0,6 × 1,4 m de cal sobre terra revolvida, com um sapato de guarda ao lado. Decalque e um sapato. (só visual)
- **Momento de assinatura (companhia):**
  - **Gatilho:** o jogador anda dentro de r8 por 5 s ou mais.
  - **O que acontece:**
    1. Pares de pegadas descalças (decalques de 0,25 m, um pool de 20 reaproveitados) aparecem 2,5 m à esquerda dele (pelo vetor direita da câmera), no compasso dos passos dele, por 8 passos. Cada uma vem com um sopro de folhas e uma pisada abafada no canal esquerdo.
    2. Se ele parar, as pegadas param. Depois de 2 s, aparece um último par 3 m à frente dele, virado para ele.
    3. As pegadas somem em 6 s.
    4. Se ele virar para o lado das pegadas (menos de 25°) enquanto elas aparecem, a próxima aparece mesmo assim: nada visível as faz.
  - **Duração:** 8 a 15 s; espera de 60 s até poder repetir.
  - **Por que é seguro:** são só decalques no chão, sem figura nenhuma: não se confunde com zumbi. Roda no cliente.
- **Animações ambientais:**
  1. As tiras de camisola tremulam.
  2. A lanterna caída falha (intensidade com ruído).
  3. A guia cortada balança no prego e bate nas tigelas.
  4. Vaga-lumes (cerca de 30 pontos emissivos) num canto da mata, que apagam num raio de 4 m em volta da "presença" durante a assinatura.
- **Luz e cor:**
  - **Paleta:** #34452a (grama), #1f2a1b (copa), #b8c8d8 (lua entre galhos), #ffe9a8 (lanterna de mão).
  - **Fontes:** nenhuma PointLight nova; o facho da lanterna é falso.
  - **Ao entrar:** névoa 0x0a0f0b, de 5 a 34 m (as árvores fecham); grading mais verde e escuro.
- **Som ambiente:**
  - (1) **Grilos:** trens de pulsos senoidais de 4,2 kHz, em estéreo. Durante a assinatura, o lado esquerdo cala.
  - (2) **Pisadas da presença:** ruído num passa-alta de 1,5 kHz, com 60 ms, panorâmica à esquerda.
  - Fora do evento, um latido muito distante a cada 60 a 120 s: ruído com formante de 600 Hz e envelope duplo curto, com reverberação longa (atraso com realimentação).
- **Escalada:** depois da Ilha, só de som, a presença ganha corpo sem se mostrar. O que sobrou de uma vítima acompanha o jogador. Prepara o Estábulo, onde o corpo aparece (sob a lona).
- **Implementação:**
  - **Área:** bbox [73,5, 120,5, -89,5, -46,5].
  - **O que já existe:** 21 árvores com colisor e 6 toras de madeira. O bloco central do tema não é colocado.
  - **Posições:**

    | Peça | Posição |
    |---|---|
    | Tiras de camisola | árvores (80,5, -73), (89,5, -72,2), (97,8, -73,5), (105,4, -77,1), (108,4, -83,9) e (117, -82,8) |
    | Cocho dos cães | árvore (102,6, -69,6) |
    | Armadilha | (100, -86) |
    | Cerca tombada | z = -87, trechos x = 90 a 104 e x = 112 a 118 (longe das janelas) |
    | Lanterna e quepe | (95, -84) |
    | Covinha | (112, -60) |
    | Folhiço | clareiras em volta de (94, -62) e (110, -70) |

  - **O que evitar:**

    | Item | Posição |
    |---|---|
    | Janelas | (85, -90), (109, -90), (121, -79), (121, -57) |
    | Arma | (96,5, -66,4) |
    | Caixa | (112, -81,8) |
    | Lâmpadas | (87,1, -53,9), (91,2, -53,9) |
    | Portas | (73, -68), (97, -46) |

  - **Peso:** cerca de 9 malhas, mais 4 instâncias.
  - **Tema gerado (`forest`):** trocar a cor da copa só desta região (verde-negro) e baixar a escala da copa em 10% no `zGenDeco` (filtrar por `zGenZone`). A mata fica mais fechada que o Bosque da Vila, sem mudar colisor nem sorteio.

#### Estábulo (r11) · ordem 5 · corpo/grotesco
- **Conceito:** foi o primeiro teste do Programa. O gado leiteiro e os cavalos de serviço do Sanatório beberam o Veio; os animais que morreram acordaram. Ficaram nas baias, amarrados, pesados e medidos, antes de o Dr. Aurélio passar para os pacientes.
- **Como o terror aparece aqui:** o grotesco é animal e clínico: leite cinza talhado, cabrestos com eletrodos de cobre, fichas de baia com "óbito" e "acordou". Debaixo de uma lona, na última baia, algo grande ainda respira, mas só quando ninguém olha.
- **Diferença para a Vila:** a Fazenda tem celeiro, feno e trator, e o movimento escondido é rural. Aqui é experimento.
- **Props únicos:**
  1. **Volume sob lona na última baia**: lona encerada cinza sobre uma forma de cavalo deitado (caixas e cilindros por baixo, só a lona aparece, com dobras em canvas e bump), com 0,9 m de altura. (só visual)
  2. **Fichas de baia pregadas nas divisórias**: 10 cartões, por exemplo "VACA MIMOSA — A-04 — óbito 12/03/57 — acordou 14/03/57", com uma cruz de cal no canto. (só visual)
  3. **Tronco de contenção veterinário de ferro**: armação de barras com cintas de couro arranhadas. (colisão baixa 1,1 m só na base; as barras de cima são visuais)
  4. **Cocho de ferro com leite talhado cinza**: superfície grumosa (plano com textura e bump) e uma nuvem de moscas. (só visual)
  5. **Ferraduras pregadas formando "1956"** (o ano em que o Veio vazou) numa parede: 22 ferraduras instanciadas. (só visual)
  6. **Cabrestos com mordaça de couro e eletrodos de cobre**: 6 cabrestos pendurados nas frentes das baias, com fios que sobem a uma caixa de bateria de madeira com voltímetro. (só visual)
  7. **Marcas de dentes e de cascos nas tábuas**, por dentro das baias, a 1,3 m (altura de cabeça de cavalo). Decalques. (só visual)
  8. **Balança de gado com mostrador**: plataforma rente ao chão (0,08 m) e um poste com um mostrador redondo de ponteiro, e um papel preso: "peso antes / peso depois". (só visual)
  9. **Feno manchado** (os 10 fardos do tema): textura com manchas cinza-escuras úmidas. (visual sobre o colisor existente)
- **Momento de assinatura (a respiração):**
  - **Gatilho e ciclo:**
    - Enquanto o jogador não olha para a lona, ou está a mais de 10 m, ela sobe e desce: escala y de 1,00 a 1,06, ciclo de 5 s, com uma expiração úmida baixa a cada ciclo.
    - Quando ele olha (menos de 25°, a até 6 m), a respiração para na hora, como fôlego preso, e as moscas do cocho silenciam.
  - **O que acontece:** depois de 4 s de olhar, um casco escorrega 15 cm para fora da borda da lona e raspa a tábua uma vez (som seco), e fica parado. Ao desviar o olhar, a respiração volta com uma expiração mais longa e o casco recolhe para baixo da lona sem ser visto.
  - **Duração:** contínua; o casco aparece uma vez por rodada.
  - **Por que é seguro:** é só visual, no canto de uma baia sem passagem, sem colisor. Roda no cliente.
- **Animações ambientais:**
  1. Nuvens de moscas sobre o cocho e a lona (InstancedMesh de 40 pontos em trajetórias de Lissajous).
  2. Os cabrestos balançam.
  3. O ponteiro do voltímetro da bateria dá trancos irregulares.
  4. Pó de feno flutua na luz das lâmpadas.
- **Luz e cor:**
  - **Paleta:** #6a5032 (madeira), #8a7a4a (feno sujo), #9aa08a (leite cinza), #2a1e14 (sombra).
  - **Fontes:** nenhuma PointLight nova; as 2 lâmpadas do tema ficam com `lc: 0xffc080`, fracas.
  - **Ao entrar:** névoa 0x100c08 marrom, de 6 a 40 m; grading amarelo-esverdeado doente.
- **Som ambiente:**
  - (1) **Moscas:** dente-de-serra de 180 a 220 Hz com vibrato rápido (25 Hz), ganho pela distância do enxame.
  - (2) **Madeira e respiração:** rangido de tábua (FM curta de 300 Hz) a cada 8 a 14 s. A expiração do animal é ruído num passa-baixa de 300 Hz, com formante de 180 Hz e envelope de 1,5 s, só quando a lona não é olhada.
- **Escalada:** a Floresta mostrava a vítima sem corpo; aqui o corpo está presente, coberto e vivo. É o último aviso antes do Crematório: o que acordou foi primeiro animal, depois gente.
- **Implementação:**
  - **Área:** bbox [73,5, 120,5, 64,5, 113,5].
  - **O que já existe:**
    - divisórias de 6 m (de 1,6 m) em x = 79 (z = 70, 74,5, 79, 83,5, 88, 101,5, 106) e em x = 115 (z = 70, 83,5, 88, 92,5, 97, 106);
    - 10 fardos de feno.
  - **Posições:**

    | Peça | Posição |
    |---|---|
    | Lona | baia oeste entre z = 101,5 e 106, em (77,5, 103,7), junto ao muro x = 73 (sem janela) |
    | Fichas | frentes das divisórias, x = 82 e 112 |
    | Tronco de contenção | (104,5, 100,5) |
    | Cocho | (113,5, 95), dentro da baia leste z de 92,5 a 97 |
    | Ferraduras | muro x = 121 (face de dentro), z = 88 |
    | Cabrestos e bateria | divisórias leste z = 83,5 a 92,5 |
    | Balança | (86, 67,5) |

  - **O que evitar:**

    | Item | Posição |
    |---|---|
    | Janelas | (85, 114), (109, 114), (121, 76,5), (121, 101,5) |
    | Arma | (94,5, 77,9) |
    | Caixa | (83,7, 92) |
    | Lâmpadas | (87,3, 73,8), (90,4, 71,5) |
    | Portas | (97, 64), (73, 94) |
    | Risers | (91,5, 101,7), (104,6, 89,2), (88,6, 97,9) |

  - **Peso:** cerca de 11 malhas, mais 3 instâncias.
  - **Tema gerado (`stables`):**
    - **Trocar:** os materiais `hay` e `wood` só desta região (feno manchado; tábua escura com arranhões).
    - **Acrescentar:** o colisor baixo do tronco de contenção entra na lista de caixas depois de `SAN_GEN.boxes`, antes de `zBuildWalk`.

#### Crematório (r7) · ordem 6 · corpo/grotesco e médico/clínico (o clímax)
- **Conceito:** é o fim da linha e o destino de todos os que o Programa não "salvou". Chega-se pelo corredor das crianças (Anexo) e pela porta do Ferro-velho, por onde vinham os da triagem. A lista termina aqui.
- **A revelação:** no forno 3 está a pulseira "Nº 1 — A. VASCONCELLOS". O próprio Dr. Aurélio entrou no seu Programa. "Ainda não acabou."
- **Como o terror aparece aqui:** tudo o que o jogador viu converge:
  - os números (covas, camisolas, contas) viram urnas de lata;
  - as cruzes de cal estão nos caixões;
  - a fumaça sai das chaminés;
  - o livro da lista tem as últimas linhas em branco, numeradas para quem chegou agora;
  - a burocracia do forno é clínica: mostradores, turnos, contagem.
- **Props únicos:**
  1. **Portas de ferro dos fornos com visor de mica**: nos 4 fornos do tema, portas fundidas com um visor redondo laranja (emissivo), a placa "FORNO 1"… "FORNO 4" e tranca de alavanca. A porta do forno 3 está entreaberta (20°). Instanciadas (as portas como peças). (só visual, na face do colisor)
  2. **Mesas de rolos diante de cada porta**: trechos de 3 m de roletes de ferro a 0,6 m, só na frente de cada forno, nunca contínuos (o vão da janela fica livre). (só visual)
  3. **Carrinho de cinzas**: tina de ferro em duas rodas, com um rodo de cabo longo e uma pá, ao lado do forno 2. (só visual)
  4. **Urnas de lata numeradas**: 240 latas (cilindros de 0,12 × 0,22 m, InstancedMesh) em 4 fileiras ao longo do muro leste. Os números vêm de um atlas de 16 variações, com a cor variando por instância. As últimas 20 estão vazias e destampadas, com a tampa ao lado. (só visual)
  5. **O livro da lista**: livro-razão aberto num suporte de aço inclinado, "LISTA DO PROGRAMA — S. LÁZARO DO VALE". Cada linha está riscada com um traço de cal, menos as últimas, em branco e já numeradas: 413-1, 413-2, 413-3, 413-4 (a família 413: os jogadores, uma linha por jogador). (colisão baixa 1,2 m, base de 0,5 × 0,5 m)
  6. **Caixões de pinho cru** (os 10 do tema): tampa pregada com cruz de cal e número a carvão. Em dois a tampa está deslocada e mostra só cinza dentro. (visual sobre o colisor existente)
  7. **Painel de controle dos fornos**: 4 mostradores redondos com o ponteiro em 900 °C, válvulas de roda e uma lousa de giz com os turnos: "6 h – 18 h: 22 / 18 h – 6 h: 19". (só visual)
  8. **Neve de cinza**: cerca de 400 pontos claros caindo devagar na área inteira, com posição presa a um volume em volta da câmera (sem alocar). (só visual)
  9. **Pulseira Nº 1**: pulseira de latão gravada "Nº 1 — A. VASCONCELLOS", caída na cinza da boca do forno 3. Brilha (emissivo baixo) quando a lanterna bate. (só visual)
  10. **"ainda não acabou"** escrito com o dedo na fuligem, na face de dentro da porta entreaberta do forno 3. Canvas, legível só de perto. (só visual)
- **Momento de assinatura (a chamada):**
  - **Gatilho:** a primeira vez que o jogador fica a menos de 5 m do forno 3 olhando para dentro (menos de 20°), ou depois de 15 s dentro da área.
  - **O que acontece:**
    1. Os visores dos fornos 1 a 4 se acendem em sequência, a 0,6 s um do outro, com um rugido de fogo que cresce.
    2. Os ponteiros dos 4 mostradores sobem até o fim da escala.
    3. A PointLight do forno 3 cresce de 1,2 para 3,0, laranja e tremulando, e a cinza cai mais densa.
    4. Se o livro estiver à vista, a página vira sozinha para as linhas em branco.
    5. A porta do forno 3 abre mais 10° e mostra a pulseira Nº 1 brilhando e o "ainda não acabou" na fuligem.
    6. Em 4 s, tudo volta ao normal.
  - **Duração:** 12 s; uma vez por rodada com força total, depois a cada 3 min com metade da intensidade.
  - **Por que é seguro:**
    - não há tremor de câmera nem flash;
    - a luz tem teto (3,0, com alcance de 10 m) e os zumbis continuam visíveis;
    - o controle continua com o jogador;
    - as portas e a pulseira são visuais.

    Roda no cliente.
- **Animações ambientais:**
  1. Os visores tremulam (emissivo com ruído, fase por forno).
  2. Neve de cinza.
  3. Fumaça das duas chaminés (sprites `puff` subindo de y = 14). É visível do Anexo e do Ferro-velho: prenuncia o fim.
  4. Os ponteiros dos mostradores tremem, e a porta entreaberta oscila 1° com a tiragem, rangendo.
- **Luz e cor:**
  - **Paleta:** #ff8a40 (`lc` do tema), #55524a (concreto), #d8d2c4 (cinza), #1a0d08 (fuligem).
  - **Fontes:** 1 PointLight real nova, na boca do forno 3 (0xff6a20, intensidade 1,2, alcance de 10 m, tremulando). Entra no pool por proximidade e é a única luz nova do anel. Os visores e a pulseira são emissivos.
  - **Ao entrar:** névoa 0x170c07, de brasa, de 6 a 36 m; grading laranja nas altas, sombras dessaturadas e contraste alto.
- **Som ambiente:**
  - (1) **Fogo:** ruído marrom num passa-baixa de 250 Hz, com crepitar (impulsos esparsos num passa-alta de 3 kHz), posicionado nos fornos. Na assinatura, o ganho sobe 2,5× em 3 s.
  - (2) **Tiragem das chaminés:** gemido grave de dois senos de 38 e 57 Hz batendo, com volume ditado pelo vento (LFO de 0,05 Hz). É o prédio respirando. Os mostradores tiquetaqueiam durante a assinatura.
- **Escalada:** é o clímax do mapa e da história. Cada motivo que o jogador viu (números, cruz de cal, a lista, a ambulância, o corredor das crianças, a água preta virada cinza) termina aqui. As linhas em branco do livro dizem que a história continua com ele: ainda não acabou.
- **Implementação:**
  - **Área:** bbox [-120,5, -73,5, 64,5, 113,5].
  - **O que já existe:**
    - fornos em x = -116,5, nos z 72, 84, 90 e 96 (2,5 × 3 × 2,6 m; os de z = 78 e 102 não são colocados);
    - caixões em (-96,1, 105,6), (-82,3, 100,1), (-98,5, 83), (-112,3, 81,7), (-86,8, 91), (-113,4, 98), (-84,7, 83,6), (-98,1, 94,7), (-98,6, 104,1) e (-84,6, 102,8);
    - chaminés em (-78, 109) e (-97, 89).
  - **Posições:**

    | Peça | Posição |
    |---|---|
    | Portas dos fornos | face x = -115,25 |
    | Mesas de rolos | x = -113,5, nos z de cada forno, ±1,5 m |
    | Carrinho de cinzas | (-113, 86,8) |
    | Urnas | x = -74,2 a -75,2, em z de 66 a 89 e de 99 a 106 (fora da frente da porta) |
    | Livro | (-90, 80) |
    | Painel | muro z = 64 (face de dentro), x = -110 |
    | PointLight | (-114,5, 90, 1,0) |

    A janela (-121, 76,5) fica entre os fornos de z = 72 e 84: nada no vão de z = 73,5 a 82,5 entre x = -121 e -112.
  - **O que evitar:**

    | Item | Posição |
    |---|---|
    | Janelas | (-109, 114), (-85, 114), (-121, 76,5), (-121, 101,5) |
    | Arma | (-86,6, 105,9) |
    | Caixa | (-90,6, 71) |
    | Lâmpadas | (-112,2, 93,1), (-93,5, 101,4) |
    | Portas | r6r7 (-97, 64) e r12r7 (-73, 94): nada a menos de 4,5 m da frente delas |
    | Risers | (-99,6, 75,6), (-96,5, 81,2), (-81,8, 90,2) |

  - **Peso:** cerca de 14 malhas, mais 5 instâncias (urnas, portas, rolos, cinza, fumaça).
  - **Tema gerado (`ovens`):**
    - **Trocar:** o material `brick` só desta região, para "tijolo refratário enegrecido de fuligem" (as Ruínas do convento usam o mesmo nome `brick`, por isso a troca precisa ser por região), e `wood` para "pinho cru".
    - **Acrescentar:** o colisor baixo do suporte do livro na lista de caixas, antes de `zBuildWalk`.
  - **MAP_ANIM:** a neve de cinza só roda com o jogador a menos de 30 m da área.

## 6. Registro de números e personagens

### Regras dos números
- **Número de família.** Em 1957 o Programa recenseou o vale e numerou as famílias de **1 a 412**. A numeração é do recenseamento, não da ordem em que as famílias foram levadas: a 117 pode subir antes da 101. Esse número vai na etiqueta de papel da porta, nos objetos da casa, no livro da Recepção, na gaveta do Necrotério e na cova do Cemitério do Programa.
- **Pulseira de paciente.** Número da família, hífen, número da pessoa na família: `117-2` é a segunda pessoa da família 117.
- **A lista acaba na 412.** Quem chega depois é a **família 413: os jogadores**. A Recepção escreve "Família 413 · (nº de jogadores)"; o Crematório tem as linhas 413-1 a 413-4 em branco.
- **Nº 1 é só do Dr. Aurélio.** Nenhum outro objeto usa o número 1 como identidade (a pulseira do Cristo da Capela é em branco).
- **Séries que não são número de família** (para não confundir): chapas da mina (001 a 048), lote de fabricação 0356 (março de 1956), celas do Anexo (C-01 a C-10), linhas da lista do Hospital (1 a 41), baias do Estábulo (A-01…), leitos do Pomar, horas pós-óbito do Laboratório. A passagem 0412 da Estação é exceção de propósito: é o número da família 412.

### Números que se repetem de propósito
| Número | Quem é | Onde aparece, na ordem do caminho |
|---|---|---|
| **Nº 1** | **Dr. Aurélio Vasconcellos**, diretor do Sanatório desde 1949. Deu a si mesmo o número 1 e terminou dentro do próprio Programa. | Praça (aviso de vacinação com o nome), Hospital de campanha (assina a lista), Recepção (retrato), Teatro (fantoche "o Doutor"), Jardim (busto), Biblioteca (livro "Do sono sem sonho" e os óculos), Ilha do lago (o retiro, a valsa), **Crematório (pulseira "Nº 1 — A. VASCONCELLOS" no forno 3)** |
| **chapa 17** | O único mineiro que subiu da **Galeria 7** em 14/03/1956. Foi o primeiro a beber o Veio e o primeiro sujeito do Laboratório, de antes da lista (por isso é identificado pela chapa, e não por família). | Mina (gancho 17 vazio; o 17 sem tique na chamada a fuligem), Laboratório (Pote 1: "chapa 17 (G7) · 36 h") |
| **61** | Família que fugiu da lista e se escondeu na cabana do lenhador: pai, mãe e três filhos. Foram levados mesmo assim. | Floresta da Vila (roupas, "61" na porta, cruz de cal pela metade), Enfermaria (chinelos 61; prancheta 61-2) |
| **77** | Família de cinco que tentou sair pela serra e depois pelo pântano. | Encosta ("FAMÍLIA 77 PASSOU AQUI" no pilar), Pântano (guarda-chuva com etiqueta 77; lençol "SOMOS 5"), Enfermaria (prancheta 77-1) |
| **101 a 140** | O lote de agosto de 1958. A 101 foi a primeira levada naquela semana, na manhã da festa. | Praça (mural: "Famílias chamadas esta semana: 101, 102, 104…"), Castelo (lista "PROGRAMA — famílias 101 a 140" com tiques) |
| **117** | Família de cinco que deu entrada em 14/08/1958. | Hospital de campanha (balança: "Família 117 — 5 pessoas — peso total: 0 kg"), Recepção (última linha do livro, copos-de-leite, mala), Laboratório (Pac. 117-3; lâmina 117-2), Necrotério (gaveta 117, com o pé cinzento) |
| **118** | **Os Morais.** Seu Morais bebeu da cisterna, dormiu no meio da colheita e ficou no sítio: o espantalho veste o macacão dele. A mulher e os filhos foram levados. | Fazenda (espantalho com "118" no peito, etiqueta no batente), Enfermaria (prancheta 118-1: a mulher) |
| **203 a 211** | Famílias cujas toras e caixotes a Serraria marcou. | Serraria (ferros de marcar; caixotes-esquife 207, 208, 209) |
| **214 a 216** | Famílias lidas do púlpito pelo Padre Anselmo, na missa das sete. | Igreja (quadro de cânticos), Enfermaria (prancheta 214-3), Laboratório (Pac. 214-1), **Necrotério (gaveta 214, que bate de dentro)** |
| **233** | Adulto caçado pelos enfermeiros no Bosque. | Bosque (laço "ADULTO — Nº 233") |
| **301 a 346** | Famílias "não salvas" enterradas pelo número em 1957, no Cemitério do Programa. | Cemitério do Sanatório (marcos 301 a 346) |
| **347** | A família seguinte a ser enterrada: a cova está sempre aberta. **Antônio**, da 347, tem o nome bordado pela mãe e riscado pelo carimbo. | Cemitério do Sanatório (cova 347, ciclo 347 a 352), Lavanderia (camisolas 347 a 360; a primeira, "Antônio") |
| **401 a 408** | Os oito meninos da **Patrulha Lobo**, vizinhos da Rua de Cima. | Acampamento (mochilas e lenços) |
| **412** | A última família do recenseamento. Comprou passagem no trem das 17h12, que nunca saiu; deixou o filho na roda do convento. | Estação (passagem e bilhetes 0412), Ruínas da cidade (teclas da caixa registradora em 0·4·1·2), Ruínas do convento ("recebido — 412"; ladainha "pelo 1… pelo 412"), Crematório (última linha riscada) |
| **413** | **Os jogadores**, a família seguinte. | Recepção (assinatura: "Família 413"), Crematório (linhas 413-1 a 413-4 em branco) |
| **41** | A linha em branco da lista de transferência do Hospital: é o jogador que está lendo. | Hospital de campanha (assinatura "a vaga 41") |
| **22** | Os corpos do turno de dia do Crematório. | Túneis ("CARGA 22 → FORNO"), Crematório (lousa "6 h – 18 h: 22") |
| **C-07 / 7** | A criança da cela 7 do Anexo. | Teatro (Joãozinho, com o 7 costurado no peito), Anexo (só a etiqueta C-07, sem sapatos; escova C-07 seca e nova) |
| **Galeria 7** | Onde o Veio se abriu (cânone). | Mina (lacre "GALERIA 7"), Mina velha (liga-se a ela por dentro), Laboratório ("G7") |
| **0356** | Lote da Engarrafadora: março de 1956, o mês do Veio. | Fábrica (rótulos e garrafas) |

Números que aparecem uma vez só, sem continuação (famílias de passagem): 12 a 15 (canoa da Margem do rio), 12 e 40 (velas da Capela), 31 e 66 (canteiros da Estufa), 44 e 51 (caderno do Jardim), 62 a 75 (cestinhos do Vinhedo), 88 (bilhete do Pátio). Não reutilizar esses números em outra área sem decidir uma ligação.

**Colisões removidas nesta consolidação:** lápides 301/302/305/309 do Cemitério da Vila (batiam com o Cemitério do Sanatório); "Família 112" do Hospital (virou 117); "Família 118 · 4" escrita pela Recepção (118 já eram os Morais; virou 413); cestinhos 61 a 74 do Vinhedo (a família 61 estava escondida na Floresta; viraram 62 a 75); "Pac. 3" e "Pac. 9" do Laboratório (viraram pulseiras de família); "LOTE 17" dos Túneis (17 é a chapa do mineiro; virou CARGA 22); "AMOSTRA 7" do Lago e "RELATÓRIO Nº 7" do Laboratório (o 7 fica para a Galeria e para a cela C-07; viraram 3 e 31); marretas "7" do Estaleiro (viraram "S.L."); baia A-07 do Estábulo (virou A-04); "Fam. 64" da Estufa (batia com os 64 kg da balança do Porto; virou 66); pulseira "Nº 1" do Cristo da Capela (ficou em branco); linhas 413 a 416 do Crematório (viraram 413-1 a 413-4, a mesma família).

### Linha do tempo
| Data | Fato | Onde aparece |
|---|---|---|
| 1931 | A pedra do Sanatório sai da pedreira do morro. | Pedreira do Sanatório |
| 1949 | Dr. Aurélio assume a direção. | Recepção (retrato "DIRETOR · 1949") |
| 14/03/1956 | A Galeria 7 se abre e o Veio jorra; 47 homens não sobem. | Mina, Fábrica ("engarrafada em 14.03.1956", lote 0356), Estábulo (ferraduras "1956") |
| 1957 | Recenseamento e lista; primeiros testes em animais (12/03/57), Cemitério do Programa, isolamento na Pedreira, crianças no Anexo, a roda do convento passa a ser do Programa; a água preta sobe no rio (03/1957). | Estábulo, Cemitério do Sanatório, Pedreira do Sanatório, Anexo, Ruínas do convento, Margem do rio |
| começo de 1958 | O Exército proíbe a água; a linha da Fábrica não para. | Fábrica (cartões de ponto até fevereiro de 1958) |
| agosto de 1958 | Quarentena: o Exército cerca o vale e corta a ferrovia. 14/08: a família 117 dá entrada; o trem das 17h12 é cancelado (14 a 21/08); o coveiro Tião enterra 31; a festa de 15 de agosto não acontece. | Recepção, Estação, Cemitério da Vila, Praça |
| 14 de setembro de 1958 | O dia em que o Estaleiro parou. | Estaleiro |
| hoje | Os jogadores chegam à vila vazia: são a família 413. | Recepção, Crematório |

### Personagens
| Nome | Quem é | Área |
|---|---|---|
| Dr. Aurélio Vasconcellos | diretor do Sanatório e do Programa; pulseira Nº 1 | ver a tabela de números |
| Padre Anselmo | leu os números das famílias na missa; foi levado na mesma semana (por isso os Penitentes da Cal agiram sem padre) | Igreja, Bairro queimado |
| Benedito | o moleiro que pescava no Lago do Moinho; bebeu, dormiu três dias e voltou à margem | Lago |
| Seu Morais (família 118) | lavrador; virou o espantalho do próprio macacão | Fazenda |
| Tião | coveiro da Vila; enterrou 31 em agosto de 1958 | Cemitério da Vila |
| Seu Quirino | faroleiro; bebeu da cisterna, e o farol passou a soar como concha | Farol |
| Patrulha Lobo (401 a 408) | os oito escoteiros levados "primeiro, para a vacina" | Acampamento |
| o tenente da 3ª Cia — 14º BC | fotografava os moradores e marcava a lista no Forte Velho | Castelo |
| Penitentes da Cal | irmandade que queimou as casas marcadas | Bairro queimado |
| o capelão | abençoava os pacientes antes do Programa | Capela |
| o foguista | trabalhava sozinho nas Caldeiras e não saiu quando trancaram o prédio | Caldeiras |
| Antônio (família 347) | a camisola com o nome bordado pela mãe, riscado pelo carimbo | Lavanderia |
| Joãozinho | o fantoche da doutrinação, com o 7 da cela C-07 | Teatro, Anexo |
| Zezinho, Lurdes, Tonho | nomes a giz nos caixotes da primeira fileira | Teatro |
| Irmãs de Santa Inês | entregaram os órfãos ao Programa e rezaram "pelos números" | Ruínas do convento |

## 7. Registro de repetições

A regra da seção 2 (nenhum objeto de uma área reaparece em outra) foi conferida nas 62 fichas. Os conflitos abaixo foram resolvidos assim: o objeto ficou na área onde é mais forte para a história e foi trocado nas outras por um objeto novo, já escrito nas fichas da seção 5.

### Conflitos resolvidos
| # | Objeto repetido | Fica em | Trocado em |
|---|---|---|---|
| 1 | rádio de válvula | Recepção (fonte da valsa) | Pedreira da Vila: lata com as cartas da turma · Farol: chave de telégrafo · Ruínas da cidade: caixa registradora |
| 2 | telefone (manivela, campanha, parede) | Ruínas da cidade (mesa telefônica e cabine) | Pedreira da Vila: mastro de sinal com corneta de chifre · Castelo: cofre com as cadernetas · Ala Psiquiátrica: gravador de fio |
| 3 | poste com isoladores e fio cortado | Encosta | Pedreira da Vila (ver 2) |
| 4 | lampião/lanterna de querosene e de carbureto | Bosque (lanternas de ronda) | Floresta da Vila: fifó na janela · Pedreira da Vila: fogareiro de álcool · Estação: placa sob o beiral · Cemitério do Sanatório: lâmpada nua de extensão |
| 5 | latas de goiabada | Floresta da Vila (alarme) | Cemitério da Vila: moringas para os mortos |
| 6 | alarme de latas no barbante | Floresta da Vila | Ponte velha: bicicleta de padeiro |
| 7 | relógio de ponto | Fábrica | Recepção: relógio de pêndulo parado · Portaria: quadro de crachás de visitante |
| 8 | máquina de escrever | Hospital de campanha | Laboratório: pasta de relatórios |
| 9 | pia de água benta com água preta | Igreja | Capela: galhetas sobre a credência |
| 10 | holofote que acha o jogador | Castelo | Base militar: sirene na torre e assinatura nova ("o binóculo") · Portaria: bomba de gasolina e assinatura nova ("a guarita vê") |
| 11 | luneta/telescópio | Castelo | Base militar: binóculo de bateria (forma própria) · Ilha do lago: cavalete de pintura |
| 12 | mapa com alfinetes | Castelo | Base militar: quadro das chaves das casas |
| 13 | espantalho | Fazenda | Vinhedo: carrocinha com boneca de sabugo |
| 14 | marmitas de alumínio numeradas | Pedreira do Sanatório (o cesto da refeição) | Pedreira da Vila: bornais de lona · Cozinha: carrinho térmico |
| 15 | capacetes | Mina velha (pórticos de capacetes acesos) | Pedreira da Vila: paletós de brim · Mina: garrafões empalhados · Caldeiras: óculos do foguista |
| 16 | gramofone/vitrola | Ilha do lago | Cemitério da Vila: harmônio de enterro · Refeitório: pianola de rolo rasgado |
| 17 | balanças | Hospital (antropométrica), Porto (romana) e Estábulo (de gado), formas distintas | Necrotério: pia de mármore · Quartel: a balança sai da mesa de triagem |
| 18 | fotos 3 × 4 | Castelo (moradores) e Refeitório (o mesmo rosto 30 vezes, variante própria) | Portaria: números das famílias nas vagas · Base militar: fotos de casas, não de rostos |
| 19 | pegadas como assinatura | Lago e Floresta do Sanatório | Pântano: "os juncos se abrem" (as pegadas ficam como rastro parado de lama) · Enfermaria: "alguém se deita" |
| 20 | "o vale fecha" (névoa fecha, som abafa) | Pedreira da Vila | Encosta: "o sinal sem resposta" · Pátio: "os muros calam" |
| 21 | ciranda de crianças | Vinhedo | Acampamento: "a fila na lona" |
| 22 | fantoches | Teatro | Acampamento: bonequinhos de barro |
| 23 | desenho de criança com a ambulância | Anexo | Acampamento e Vinhedo: desenhos sem a ambulância |
| 24 | marcas de altura de criança | Floresta da Vila | Anexo: escovas de dente numeradas |
| 25 | balanço | Anexo | Vinhedo: gangorra |
| 26 | batidas de dentro | Necrotério (gaveta 214) | Cemitério da Vila: o hino que vem de baixo · Cais: "os respiros" |
| 27 | animal que respira | Estábulo | Brejo negro: "o que boia" |
| 28 | casca em tiras como pele | Serraria | Brejo negro: nós inchados nos troncos |
| 29 | taboas | Pântano | Brejo do Sanatório: aguapés cinzentos |
| 30 | gaiola com pássaro que canta | Pomar | Estufa: aquário com peixinho · Ferrovia: a gaiola vazia virou vaso de avenca |
| 31 | cadeira de vime, manta xadrez e chá | Ilha do lago | Estufa: banquinho com bolo de fubá · Lago: xale de crochê |
| 32 | chapéu de palha | Pátio (preso nos cacos) | Praça: barquinho de papel · Fazenda: chapéu de couro no espantalho |
| 33 | botas de borracha | Mina (vagoneta de botas) | Lago: samburá com traíras · Pântano: guarda-chuva emborcado |
| 34 | sapatinhos de criança | Anexo | Praça: sapatos de homem na caixa de engraxate |
| 35 | leite talhado cinza | Estábulo | Fazenda: latões cheios de água preta |
| 36 | velas votivas | Capela (numeradas) | Igreja: dois círios do altar · Ruínas do convento: tocos sem número, em cruz |
| 37 | frascos âmbar boiando e rede de pesca | Brejo do Sanatório (frascos) e Lago (rede) | Farol: escafandro |
| 38 | rede com volume pesado | Cais (rede de carga) | Lago: rede rasgada de dentro para fora |
| 39 | corrente esticada por algo invisível | Fazenda | Farol: âncora arrastada |
| 40 | silhueta de corpo no lençol | Hospital de campanha | Lago: grama morta sob o lençol · Ala Psiquiátrica: sulcos dos calcanhares · Quartel: plaqueta "POSITIVO" nas padiolas |
| 41 | carimbo "APTO PARA O PROGRAMA" | Ferro-velho | Quartel: "POSITIVO — CAMINHÃO BRANCO" |
| 42 | amostra marcada | Lago (caixote) e Brejo do Sanatório (frascos), formas distintas | Fábrica: rótulo de cabeça para baixo |
| 43 | soro do Veio no pedestal | Enfermaria | Hospital de campanha: estojo de vacinação |
| 44 | negatoscópio com veias | Ferro-velho | Laboratório: microscópio com lâmina 117-2 |
| 45 | malas etiquetadas | Estação (couro, 0412) e Recepção (mala 117) | Ferrovia: cadeiras de espera · Portaria: mudança no teto dos carros · Encosta: sacolas de palha |
| 46 | semáforo de braço | Estação | Ferrovia: sinal anão |
| 47 | quadro de partidas | Estação | Ferrovia: telegrama do Exército |
| 48 | bilhetes numerados | Estação | Porto: cabide de coletes salva-vidas |
| 49 | canecas de ágata numeradas | Margem do rio (bacias de ágata) | Refeitório: canecas de alumínio · Ferrovia: xícaras desparelhadas |
| 50 | bandeira de sinal naval | Ilha do porto (Q, quarentena) | Porto: tabela de preços da travessia |
| 51 | marcas de mão pretas | Vinhedo (assinatura) e Torre d'água (mãos cinzentas de adulto na escada) | Porto: remo molhado |
| 52 | cancela listrada | Ferrovia | Portaria: cadeira de rodas |
| 53 | livro de entrada de famílias | Recepção | Portaria: prancheta do guarda |
| 54 | cesto no cabo trazendo comida | Pedreira do Sanatório | Ilha do porto: caixa de mantimentos vazia |
| 55 | corda/escada cortada no topo do pilar | Pedreira do Sanatório | Encosta: fogueira de sinal nunca acesa |
| 56 | contagem de dias riscada | Pedreira do Sanatório (riscos) e Pedreira da Vila (montinhos de pedra, forma distinta) | Mina: chamada a fuligem · Encosta: recados no pilar · Pátio: horas raspadas · Cais: desenho de barco a giz |
| 57 | genuflexório | Capela | Ruínas do convento: esteira de palha |
| 58 | cobertor cinza numerado | Anexo | Capela: missais · Pedreira do Sanatório: saco de estopa |
| 59 | balde girando na corda | Igreja (poço) | Torre d'água: corrente com cadeado cortada |
| 60 | visor de nível preto | Torre d'água | Caldeiras: válvula de purga |
| 61 | neve de cinza | Crematório | Bairro queimado: páginas de missal queimadas |
| 62 | varal de roupas | Floresta da Vila e Lavanderia (formas distintas) | Margem do rio: sabão de cinza |
| 63 | facho que para no jogador | Castelo | Jardim: "as sebes olham" |
| 64 | cabeças que viram para o jogador | Praça (pombos) | Jardim: as corujas só piscam |
| 65 | lápides só com números | Cemitério do Sanatório | Cemitério da Vila: cruzes de ferro da prefeitura |
| 66 | quadro de ganchos com plaquetas de latão | Mina (lampisteria) | Cemitério do Sanatório: caixote de plaquetas prontas |
| 67 | pá | Cemitério do Sanatório | Cemitério da Vila: paletó do coveiro |
| 68 | sacos de "farinha" | Estufa (farinha de osso) | Cozinha: caixotes de mantimentos |
| 69 | vidros de compota | Mina velha (espiral) | Estufa: tubos de ensaio |
| 70 | apitos | Acampamento (escoteiro) | Bosque: toucas de enfermeiro · Floresta do Sanatório: quepe de guarda |
| 71 | coleira de cão | Fazenda | Floresta do Sanatório: cocho dos cães |
| 72 | marcas de pneu do caminhão | Praça (cânone) | Ponte velha: para-lama da ambulância |
| 73 | valsa | Recepção e Ilha do lago (gosto do Dr. Aurélio, de propósito) | Ferrovia: xote · Pico: samba-canção · Cemitério da Vila: hino de harmônio |
| 74 | terços | Ruínas do convento | Quartel: medalhinhas na peneira |
| 75 | caixa d'água | Torre d'água, Ferrovia e Quartel (formas e funções distintas) | Ruínas da cidade: a chaminé fica como chaminé de padaria |
| 76 | apito a vapor | Caldeiras | Fábrica: cigarra elétrica de turno |
| 77 | alto-falante de corneta | Base militar | Pátio: campainha elétrica de recolhimento |
| 78 | sino de mão com fita, tocando três vezes | (motivo do cânone, ver abaixo) | Capela: campainha de consagração de quatro sininhos · Ruínas do convento: sineta de portaria, de mola, toca duas vezes |

Outras correções de cânone feitas junto: a Mina velha deixou de ser "a galeria onde o Veio se abriu" (é a galeria velha ligada à Galeria 7); a Pedreira da Vila fecha a boca de uma galeria que desce até a Mina, não a Galeria 7; o padre do Bairro queimado não "fugiu" (foi levado, como diz a Igreja); o faroleiro passou a se chamar Seu Quirino, para não confundir com Benedito, o moleiro.

### Motivos do cânone que se repetem de propósito
Cada um aparece em várias áreas, sempre com forma, material ou lugar diferente.
- **Água preta do Veio:** anel de lodo (Praça) → poço e pia (Igreja) → lago inteiro (Lago) → latões (Fazenda) → filete entre os dormentes (Mina) → garrafas (Fábrica) → poças do Brejo negro → galhetas (Capela), soro (Enfermaria), regadores (Estufa), tanque e baldes (Torre d'água), cano-mestre (Túneis) → cinza (Crematório).
- **Cruz de cal:** portas da vila, batentes do Bairro queimado, carimbo nas fichas e livros do Sanatório, caixões do Crematório.
- **"ainda não acabou":** 13 lugares, cada um com um meio diferente: entalhado a canivete (Cemitério da Vila), fuligem de carbureto (Mina), giz na lousa (Fábrica), Morse (Farol), lápis na lista (Hospital), cal no vidro (Ferrovia), caligrafia infantil (Vinhedo), carvão na rocha (Mina velha), quadro de febre (Enfermaria), sussurro nos tubos (Ala Psiquiátrica), unha na fuligem de uma lente (Caldeiras), riscado na pedra (Pedreira do Sanatório), dedo na fuligem do forno (Crematório).
- **A ambulância branca, por partes:** marcas de pneu (Praça) → para-lama (Ponte velha) → baú sem chassi (Ferro-velho) → o veículo inteiro, com o motor ligado (Portaria). A ambulância verde-oliva do Hospital de campanha é outro veículo, do Exército.
- **Sino:** sino da torre que bate sozinho (Igreja), sininho de segurança de cova (Cemitério da Vila), bóia-sino na areia (Farol), campainha de consagração de quatro sininhos (Capela), campainha elétrica de recolhimento (Pátio), sineta de portaria de mola (Ruínas do convento). Não são sino do cânone: a campainha da bicicleta (Ponte velha) e os sinos de vento de vidro (Ilha do lago).
- **Pulseira de paciente:** cesto de pulseiras novas (Hospital de campanha), quadro de pulseiras (Recepção), fitas dos balões (Teatro), bacia de pulseiras cortadas (Necrotério), pulseira em branco do Cristo (Capela), pulseira Nº 1 (Crematório).
- **Pegadas:** só duas assinaturas usam pegadas, com formas distintas: descalças e molhadas saindo da água em direção ao jogador (Lago) e descalças no folhiço, andando ao lado dele (Floresta do Sanatório). As outras pegadas são objetos parados: rastro de lama até a água (Pântano) e coturnos brancos de cal (Hospital de campanha).
- **Os três bipes descendentes** (o "número"): alto-falante da Base militar e rádio do Pico, de propósito: o Pico ouve o mesmo posto.
- **A valsa:** rádio da Recepção e gramofone da Ilha do lago, de propósito: é a música do Dr. Aurélio.
- **Coros sem palavras:** cada área religiosa tem o seu timbre: coro distante em "a" (Capela, ambiente), coro feminino em "u" (Ruínas do convento, assinatura), coro masculino de boca fechada (Mina velha, assinatura).
- **Coisas que andam quando ninguém olha** (é o tipo de terror, não um objeto): espantalho (Fazenda), roupas de domingo nos galhos (Floresta da Vila), trouxas amarradas (Margem do rio), cadeira de palhinha (Biblioteca), frascos de amostra (Brejo do Sanatório), camisolas no trilho (Lavanderia).

### Genéricos aceitos em variante própria
Cestos de vime, escadas, barcos e remos, correntes, arame farpado, cal (tonel, tanque, carrinho, baldes), quadros-negros, estandartes, placas esmaltadas, listas e livros de registro, carrinhos, chinelos e sapatos, cadeiras e bancos, velas e círios, moscas. Cada ocorrência tem forma, função e história próprias da área (conferido nas fichas); ao implementar, não reaproveitar a mesma malha ou textura entre áreas.
