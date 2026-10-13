// Balanceamento do modo zumbi (zumbi-v2): TODOS os valores novos de balanceamento ficam aqui, sem números soltos no código.
// O index.html importa este arquivo (import { ZBAL } from './zumbi_config.js').
export const ZBAL = {
  // Etapa 1: tamanho → velocidade → dano. s = tamanho do tipo (1 = zumbi comum).
  // velocidade × s^-vel, dano por golpe × s^dano, intervalo e preparo do golpe × s^ritmo.
  // DPS ∝ s^(dano - ritmo); com a velocidade, a ameaça efetiva fica perto de 1 para todos (tabela em docs/zumbi-v2/balanceamento.md).
  tamanho: {
    vel: 1.5, dano: 2.5, ritmo: 1,
    intervalo: 1.2, preparo: .45, // golpe do zumbi comum (s) antes da dificuldade
    tetoGolpe: 90, // nenhum golpe passa disso (vida do jogador sem Juggernog é 100: nada derruba de um golpe só)
    pisoGolpe: 15, // nem o menor zumbi no Fácil fica inofensivo
  },
  // passo do zumbi comum por marcha (0 anda, 1 trota, 2 corre), m/s, antes do tamanho e da dificuldade
  marcha: [[1.3, 1.8], [3.6, 4.3], [5, 5.5]],
  // tipos do clássico (índice de ZKIND): tamanho e marcha mínima/máxima. Carniceiro (6) e cães têm regra própria.
  tipos: {
    0: { s: 1 },
    1: { s: 1.32, marchaMax: 1 }, // Brutamonte
    2: { s: 1.05, marchaMax: 1 }, // Explosivo
    3: { s: .86, marchaMin: 2 }, // Veloz
    4: { s: 1 }, // Tóxico
    5: { s: 1.04, marchaMin: 1, marchaMax: 1 }, // Gritador
  },
};
