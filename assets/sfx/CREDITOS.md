# Créditos dos sons (assets/sfx)

Todos os arquivos desta pasta são recortes de gravações reais com licença **CC0 1.0** (domínio público: uso livre, inclusive comercial, sem exigir crédito). Mesmo assim, os autores ficam registrados aqui.

Processamento feito para o jogo: soma dos dois canais em mono, passa-alta de 30 Hz, recorte de um tiro só (começa no estalo, cauda com queda suave), reamostragem (32 kHz perto, 24 kHz longe), nível igualado pelo RMS da janela de 30 ms mais forte e picos acima de 0,8 dobrados suavemente. No jogo ainda entram variação de tom e volume, um grave sintético somado (deagle, AWP, escopeta...), posição 3D, ar/parede, reverb da sala e o limitador.

## Free Firearm Sound Library ("Prepared SFX Library")

- Autores: Ben Jaszczak, Brian Nelson, Kevin Heras e Matthew Nanney (Still North Media), publicado no OpenGameArt por bart
- Origem: https://opengameart.org/content/the-free-firearm-sound-library (arquivo `Prepared SFX Library.7z`)
- Licença: CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/

| Arquivo | Família no jogo | Gravação original (arma, arquivo, tiro nº) |
|---|---|---|
| pistol_1.wav, pistol_2.wav | pistola | Walther PPQ 9 mm, `X_39P.wav`, tiros 1 e 2 (perto) |
| pistol_3.wav | pistola | Bersa .380, `F_47P.wav`, tiro 1 (perto) |
| deagle_1.wav, deagle_2.wav | Desert Eagle | Colt 1911 .45, `A_42P.wav`, tiros 1 e 2 (perto; tocado ~10% mais grave) |
| revolver_1.wav, revolver_2.wav | revólver (R8) | Smith & Wesson 642 .38, `V_27P.wav`, tiros 1 e 2 (perto) |
| smg_1.wav, smg_2.wav | submetralhadoras | Carl Gustav M45 9 mm, `G_31P.wav`, tiros 1 e 2 (perto) |
| smg_3.wav | submetralhadoras | PPSh-41 7,62x25, `P_30P.wav`, tiro 2 (perto) |
| rifle_1..3.wav | AK-47 / fuzis "rifle" | AK-47 7,62x39, `C_28P.wav`, tiros 1 a 3 (perto) |
| rifle2_1.wav, rifle2_2.wav | M4 / fuzis "rifle2" | AR-15 5,56, `D_32P.wav`, tiros 1 e 2 (perto) |
| rifle2_3.wav | M4 / fuzis "rifle2" | Savage 10 .300 Blackout, `T_27P.wav`, tiro 1 (perto) |
| mg_1.wav, mg_2.wav | metralhadoras (Negev, M249, RPK) | Marlin 336 .30-30, `I_22P.wav`, tiros 1 e 2 (perto) |
| mg_3.wav | metralhadoras | Winchester Model 1894 .32 Win. Special, `L_23P.wav`, tiro 1 (perto) |
| sniper_1.wav, sniper_2.wav | SSG 08 / G3SG1 / SCAR-20 | Tikka T3 .30-06, `W_29P.wav`, tiros 1 e 2 (perto) |
| sniper_3.wav | idem | Arisaka, `E_25P.wav`, tiro 1 (perto) |
| awp_1.wav, awp_2.wav | AWP | Mosin-Nagant 7,62x54R, `M_21P.wav`, tiros 1 e 2 (perto) |
| awp_3.wav | AWP | Springfield 1917 .30-06, `B_24P.wav`, tiro 1 (perto) |
| shotgun_1.wav, shotgun_2.wav | escopetas | Benelli Nova 12 ga, `O_21P.wav`, tiros 1 e 2 (perto) |
| shotgun_3.wav | escopetas | Winchester Model 12, 12 ga, `K_22P.wav`, tiro 1 (perto) |
| silenced_1.wav, silenced_2.wav | supressor (pistola) | Ruger Mark III .22, `R_35P.wav`, tiros 1 e 2 (perto), passa-baixa 1,7 kHz |
| silenced2_1.wav, silenced2_2.wav | supressor (fuzil/SMG) | Ruger Mark III .22, `R_30P.wav`, tiros 1 e 2 (meia distância), passa-baixa 1,1 kHz |
| longeP_1.wav | tiro de longe: pistolas | Walther PPQ, `X_31P.wav`, tiro 1 (meia distância) |
| longeS_1.wav | tiro de longe: SMG | Carl Gustav M45, `G_20P.wav`, tiro 1 (meia distância) |
| longeR_1.wav | tiro de longe: fuzis/metralhadoras | AK-47, `C_31P.wav`, tiro 1 (meia distância) |
| longeR_2.wav | tiro de longe: fuzis/metralhadoras | AR-15, `D_24P.wav`, tiro 1 (meia distância) |
| longeH_1.wav | tiro de longe: snipers | Mosin-Nagant, `M_26P.wav`, tiro 1 (meia distância) |
| longeG_1.wav | tiro de longe: escopetas | Benelli Nova, `O_17P.wav`, tiro 1 (meia distância) |

## Shotgun Reload Sound Effects

- Autor: zer0_sol
- Origem: https://opengameart.org/content/shotgun-reload-sound-effects (arquivo `shotgunsounds.zip`)
- Licença: CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/

| Arquivo | Som no jogo | Original |
|---|---|---|
| pump_1.wav | `pump` (bomba da escopeta) | `Rack.mp3` |
| shellin_1.wav | `shellin` (cartucho entrando) | `Shell in Chamber.mp3` |

## Continuam sintetizados

Clique sem munição, carregador saindo/entrando, ferrolho, cápsula caindo, faca, passos, granadas, interface e as armas especiais do modo Zumbis (Ray Gun, Thundergun, Wunderwaffe, lança-granadas, besta, arma de gelo). O mecanismo do supressor (o ferrolho batendo) também é sintetizado, somado à gravação abafada.
