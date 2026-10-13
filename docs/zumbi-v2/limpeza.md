# Limpeza (zumbi-v2, Etapa 10)

Critério para apagar: o nome não aparece em mais nenhum lugar do `index.html`, nem como palavra solta nem dentro de texto (carregamento por nome). Também foram conferidos os arquivos de `assets/`.

| O que | Onde | Tamanho |
|---|---|---|
| Minimapa do modo Zumbi (Etapa 6): radar, mapa grande, rótulo, CSS, 2 canvas e 1 div, tecla M | `ZMM`, `zmmBuild`, `zmmScene`, `zmmIcon`, `zmmBig`, `zMinimap`, `zmmLab`, `zmmRoomName`, `zmmRoomsOpen`; `#zmm`, `#zmmLbl`, `#zbig` | 19 316 bytes de código + CSS e HTML |
| `W_NAME` (só o minimapa usava) | | 40 B |
| Funções nunca chamadas | `karambitHand`, `knFist`, `knRetarget`, `fpTwoBone`, `zAtGoal`, `g2MtxBarra`, `tooFar`, `fgAng` | 5 486 B |
| Total | | cerca de 25 KB a menos no `index.html` |

**Erro corrigido pelo revisor R2:**
- A primeira passada também apagou `stairs`, `gridBoxes`, `sanpUni` e `w06Vai`, que ainda são usadas. Sem elas:
  - a recarga de 28 armas dava erro;
  - 8 mapas não montavam;
  - o Sanatório ficava sem piso.
- As quatro voltaram no commit c7abb69.
- Daqui em diante, toda remoção passa pelo teste que monta os 13 mapas e pelo teste que recarrega todas as armas.

**Mantidos:**
- `assets/`: as 8 pastas de modelos (`fps/ak`, `knife`, `pistol`, `pump`, `rifle`, `smg`, `sniper`, `w/*`) e o `arms.glb` são todos carregados. As pastas de `fps/w/` são lidas pelo nome via `fpLoad('m:' + id)`, e a `fps/w/knife` pelo `fpLoad('m:knife')`.
- `console.log` de depuração: não há nenhum.
- Ganchos de teste `window.__T`: só existem com `DEBUG`, em localhost, nunca no site publicado.

Os itens que ficaram na dúvida estão em `limpeza_duvidosa.md`.

# Limpeza A8 (objetivos do mapa, 13/10): o que sobrou da campanha antiga

Regra do dono: sistema substituído sai por completo. Com os objetivos dentro do mapa (um modo só, sem troca de mapa, sem cena, sem kit e sem checkpoint), o código da campanha antiga ficou sem uso. Critério: antes de apagar, o nome foi procurado inteiro no `index.html`, em `tests/` e em `tools/` (também dentro de texto, `__T` e ganchos `CAMP_GANCHOS`/`CAMP_G`); só saiu o que não tinha uso vivo no modo novo, no clássico nem no PvP. O que ficou na dúvida está em `work/obj/A8/duvidosa.md` (notas do agente) e resumido no fim desta seção.

`index.html`: de 32 833 para 31 432 linhas (1 401 a menos; 1 616 linhas apagadas e 215 reescritas), cerca de 117 KB a menos. `PROTO` subiu de 6 para 7 (mensagens de rede saíram).

| O que saiu | Onde estava | Por quê |
|---|---|---|
| Troca de mapa entre atos: `campTrocaMapa`, `CAMP.trans`, bagagem (`CAMP.bag`, `campBagagem`), espera de carga (`CAMP.cargaMaxS`, `preS`), `{ t: 'camp', k: 'trans' \| 'pronto' }` (e o `case 'camp'` do `srvHandle`, `campSrvMsg`), o `tr` do `cp` | O3-D02 | os objetivos ficam no mapa escolhido |
| Kit e checkpoint: `CAMP_KIT`, `campKit`, `campEntradas`, `kitPend`, `vistos`, `ptsEntrada`, `campMediaPts`, `campOver` (e o gancho no `zCheckOver`), `campRepetir`, `CAMP.over/overSt/repetir`, `repetirS`, painel `#campOver` e o Enter de "Repetir", o `ov` do `cp`, `{ k: 'over' }` | O3-D02 | time caído acaba a partida como no clássico; quem entra no meio entra como no clássico |
| Progresso salvo e menu antigo: `campSalvo`, `campSalvoSane`, `campLibera`, `campLiberado`, `campAtoMax`, `campInfLiberado`, `{ k: 'salva' }`, `CAMP_ATO_CARTAO`, `campEtapaDoAto`, `campProxEtapa`, `campFormRender`, `campFormClick`, o `st.ato` (`campForm0`, `campFormOut`, `campSaneSt`), recorde do infinito por mapa (`CAMP_INF.mapas`, parte do `campInfHud`), `campInfForm` | O3-D02, O3-D14 | um modo só no menu, sem atos nem recorde; o `localStorage` antigo (`tiroteio.campanha`, `lastSt` com arena) é ignorado |
| Cenas e créditos: `campCena`, `campCenaPula`, `campCenaOn`, `campCenaDur`, `#campCena` (CSS e Enter), `CAMP.cenaMaxS/cartaoS`, `CAMP_CENA_TXT` (e o bloco da `lore.md` §10.2), `CAMP_CREDITOS`, `campCredEl/Pula/Quadro`, `CAMP_CRED_CSS`, `campVFinal`, `campVDocs`, `campDocsSala`, `CAMP.docs`, `campConcluida`, `CAMP_GANCHOS.concluida`, `campInfContinua` (e o gancho no `srvAfterMatch`), `CAMP_INFS.cont` no `zStartGame`, `campVLobbyJa`, `{ k: 'cena' \| 'fim' \| 'creditos' \| 'final' \| 'fuga' }`, o `fg` do `cp`, textos "CAMPANHA CONCLUÍDA", "Infinito liberado", "RODADAS INFINITAS" | O3-D02, O3-D04, O3-D14 | a história fica no rádio, nas falas e nos documentos; depois do último objetivo a partida segue no mesmo mapa |
| Etapa antiga: `campFimEtapa`, `CAMP.fim`, `CAMP.intervaloS`, `rod0/rodMin/rodMax/cenaIni/cenaFim` de `CAMP_ATOS`, o caminho antigo do `campInicio` | O3-D02 | a etapa acaba no fim da rodada (`campProxObjetivos`) |
| Arenas: `MAPS.forte`, `MAPS.forno`, `MAPS.galeria7` e tudo delas (`FORTE`, `FORNO`, `GAL7`, `*_V`, `GAL7_JUNCOES`, montagem, colisores, janelas, `fornoFace`, `dinamico`...), a marca `@@CAMP-MAPAS@@`, o filtro `!m.camp` do menu e o envoltório do `campForm0` | início do script (≈ 490 linhas) | as arenas saíram do modo zumbi |
| Forte Velho: torre (`vgEscada`, `vgAnda`, modos do `VGSRV`), arame farpado (`vgArame`, `vgArameTick`), gerador do holofote (`ZINT.curto`), `forteEsconde`, `forteAnim` (cone, apagão, sinalizadores), `ZINT_MAPA.forte`, `CAMP_VIGIA.nasce/sobe/arame` e as cores do cone/apagão | O3-D09 | o Vigia de campo nunca subia na torre (`vgFase` só adiantava o pelotão; o resto só valia em `curMapId === 'forte'`) |
| Casa do Forno: ataque da porta do forno (`campo: 0`, `fgFornoOk/Pos`, `fgNaFrente`, `fgImune`, fogo nos zumbis), esteira, boca e poço (`fgEsteira`, `fgBoca`, `fgPoco`, `fgIA`, `fgArenaTick`), válvula de vapor (`ZINT.valvula`, `FG_VAP`), `fornoEsconde`, `fornoAnim`, calha dos lacaios (`{ e: 'calha' }`), `ZINT_MAPA.forno`, `SND.fgforno/fgvapor`, a pose `forno`, `CAMP_FOG.nasce/esteira/poco/forno`, `'forno'` no `fogo` do Carvoeiro | O3-D11 | só existiam na arena; no campo os lacaios já nasciam perto (`'perto'`) |
| Galeria 7: púlpito, mergulho e nado (`drArena`, `drIA`, `drMergulha`, `drAnda`, `drPocoPara`, `drBorda`), tanques e junções (`drTanques`, `drProtecao`, `drVidas`, `drObjeto`), Corrente e Maré (`campo: 0`, `drMare*`, `SND.drmare`, `{ e: 'mare' \| 'agua' \| 'rompe' }`, o `dr` do `cp`), rodadas da arena (`GAL7_RODADAS`, `gal7Campanha`, `gal7Tipo`, `gal7Nasce`), `CAMP_AGUA.galeria7`, `ZINT_MAPA.galeria7`, `gal7Anim`, `gal7Seringas`, `drTela`, `drCliMundo`, `CAMP_DIRETOR.nasce/protecao/.../mare/nada/mergulho`, `CAMP_V.gaiola/cenas/creditosS/chefeMin` | O3-D13, O3-D14 | no campo o Diretor já ficava no chão, sem proteção, e os lacaios nasciam perto |
| `CAMP_ZK[k].mapas` e o teste dele no sorteio (`campZkCotas`, `campZk2Garantia`), o ramo da arena do `campZkQtd` | O3-D06, O3-D08 | só valia sem `CAMP_RITMO` e fora do infinito, isto é, nas arenas |
| `tools/bench/bench-campanha.mjs`, `robo-campanha.mjs`, `resumo-campanha.mjs`, `ponta-campanha.mjs`, `bench-forte.mjs`, `bench-forno.mjs`, `bench-galeria7.mjs` | `tools/bench` | começavam cada ato com o kit do checkpoint, trocavam de mapa e iam até os créditos (o modo novo não tem nada disso); os testes `objetivos-*` e `campanha-balanco` cobrem o modo novo. `tools/itens/conferencia.mjs --camp` foi ajustado (sem `campLibera` nem `ato`) |

Comportamento: nada muda no modo novo, no clássico nem no PvP (o que saiu só rodava nas arenas ou no fluxo antigo). Duas diferenças pequenas: o host não manda mais `{ t: 'camp', k: 'fg', e: 'calha' }` no apito do Foguista (o cliente fora da arena já ignorava) e a Chamada do Diretor não sorteia mais o poço de saída (era um `Math.random()` sem efeito no campo).

Na dúvida, ficou (ver `work/obj/A8/duvidosa.md`): a base de pilares e junções do O3-D07 (`ZINT.pilar/juncao`, `CAMP_PILAR`, `campDanoPilar`...) e a gaiola (`ZINT.gaiola`, o embarque do `fugir`), que nenhum mapa põe mais, mas são genéricas e testadas com peças de teste; o caminho fora de campo do `campChefeNasce` (`d.nasce`, `CAMP_CHEFE[k].rodada`); as 3 notas e as falas que só existiam nas arenas (`n-forte-paiol`, `n-forno-pulseira`, `n-galeria-diretor`, `r5-*`, `fog-forno`), que são texto da `lore.md`; o zmode `'infinito'` sozinho (sem objetivos), que o menu não oferece mais mas os testes usam; a pose `pulpito` do Diretor.
