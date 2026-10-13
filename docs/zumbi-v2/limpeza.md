# Limpeza (zumbi-v2, Etapa 10)

Critério para apagar: o nome não aparece em mais nenhum lugar do `index.html`, nem como palavra solta nem dentro de texto (carregamento por nome). Também foram conferidos os arquivos de `assets/`.

| O que | Onde | Tamanho |
|---|---|---|
| Minimapa do modo Zumbi (Etapa 6): radar, mapa grande, rótulo, CSS, 2 canvas e 1 div, tecla M | `ZMM`, `zmmBuild`, `zmmScene`, `zmmIcon`, `zmmBig`, `zMinimap`, `zmmLab`, `zmmRoomName`, `zmmRoomsOpen`; `#zmm`, `#zmmLbl`, `#zbig` | 19 316 bytes de código + CSS e HTML |
| `W_NAME` (só o minimapa usava) | | 40 B |
| Funções nunca chamadas | `stairs`, `gridBoxes`, `sanpUni`, `karambitHand`, `knFist`, `knRetarget`, `fpTwoBone`, `w06Vai`, `zAtGoal`, `g2MtxBarra`, `tooFar`, `fgAng` | 7 096 B |
| Total | | cerca de 27 KB a menos no `index.html` |

**Mantidos:**
- `assets/`: as 8 pastas de modelos (`fps/ak`, `knife`, `pistol`, `pump`, `rifle`, `smg`, `sniper`, `w/*`) e o `arms.glb` são todos carregados. As pastas de `fps/w/` são lidas pelo nome via `fpLoad('m:' + id)`, e a `fps/w/knife` pelo `fpLoad('m:knife')`.
- `console.log` de depuração: não há nenhum.
- Ganchos de teste `window.__T`: só existem com `DEBUG`, em localhost, nunca no site publicado.

Os itens que ficaram na dúvida estão em `limpeza_duvidosa.md`.
