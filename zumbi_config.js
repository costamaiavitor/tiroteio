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
    // teto de velocidade (m/s) por dificuldade (Fácil, Normal, Difícil, Pesadelo) = o cão mais rápido de cada uma: o Veloz chegava a 8 m/s no
    // Pesadelo, mais que os cães e que o jogador correndo (7,4). Quem passa do teto fica entre 96% e 100% dele (não andam todos iguais).
    velMax: [5.6, 6.1, 6.4, 6.4],
  },
  // passo do zumbi comum por marcha (0 anda, 1 trota, 2 corre), m/s, antes do tamanho e da dificuldade
  marcha: [[1.3, 1.8], [3.6, 4.3], [5, 5.5]],
  // Etapa 4: zumbis nas janelas
  janela: {
    encosto: -.03, // o centro do zumbi para a (tábuas 0,35 m + raio do zumbi + encosto) da janela: colado na barricada
    tabua: [.85, .65, .5], // segundos para arrancar uma tábua sozinho, por marcha (anda, trota, corre); antes 1,5 / 0,9
    tabuaBruto: .8, // Brutamonte arranca mais rápido (× no tempo)
    maxPorJanela: 3, // zumbis arrancando tábua ao mesmo tempo na mesma janela; os outros esperam atrás
    espera: 1.6, // distância (m) da fila de espera atrás de quem arranca
    acelera: .6, curva: .85, // com n zumbis juntos a quebra fica 1 + acelera·(n-1)^curva vezes mais rápida (2: 1,6×; 3: 2,08×)
  },
  // Etapa 5: alvo e jeito de andar
  alvo: {
    reavalia: .5, sorteio: .1, // reavaliação do alvo a cada 0,5–0,6 s (escalonada entre os zumbis)
    perto: 3, // jogador a menos disso (com linha livre) do zumbi que está do lado de fora: larga a janela e ataca
  },
  estilos: { // desvio lateral do caminho (amp em fração da direção, freq em Hz), troca brusca de rumo (s) e variação de passo por zumbi
    erratico: { amp: .45, freq: 2.4, rumo: [.35, .8], rumoAng: .6, varia: .08 }, // pequeno e rápido: corrida errática
    cambaleante: { amp: .22, freq: .9, varia: .06, balanco: .12 }, // padrão: caminhada cambaleante (o passo oscila)
    pesado: { amp: .05, freq: .5, varia: .03, balanco: .05 }, // grande: pesado, quase não desvia do caminho
    semDesvioPerto: 2.5, // a menos disso do alvo, anda reto (não erra o bote)
  },
  // Etapa 6: dicas de localização (marcador da energia e do Pack-a-Punch) só nas dificuldades desta lista (0 = Fácil)
  dicas: { dificuldades: [0] },
  secreta: { alcance: 1.6 }, // passagem secreta (parede falsa): o F só aparece a menos disso dela
  // Etapa 7: caixa misteriosa e lugares sorteados
  caixa: { qualquerLugar: true },
  lugares: { sortear: true, papChance: .7, energiaCusto: [1500, 3500] }, // a cada partida: bebidas trocam entre si; PaP vai para o lugar de uma bebida (chance) e a energia fica sempre numa área média: custo das portas até ela entre energiaCusto[0] e [1] (no lugar dela ou trocando com um giz de parede) // depois do ursinho, qualquer lugar da caixa do mapa (não só as áreas já abertas)
  // Etapa 8: energia e Pack-a-Punch construídos com peças espalhadas pelo mapa
  construcao: {
    ligada: true,
    pecas: [2, 3, 4, 5], // peças de CADA máquina (energia e PaP) por dificuldade: Fácil, Normal, Difícil, Pesadelo
    custoMax: [2500, 2500, 3000, 3000], // só áreas baratas ou médias: custo somado das portas até a área (desde o início) no máximo isso
    longe: [-.5, .5, 1.2, 2], // peso pela distância do nascimento: d^longe (negativo = perto no Fácil; maior = mais longe nos difíceis)
    distMin: 7, // distância mínima entre duas peças e de uma peça a qualquer máquina, arma ou caixa
    distInterativo: 3, // e a mais disso de qualquer interativo (barril, terminal, alavanca...)
    grade: 3, livre: .9, // procura de chão para as peças: grade de 3 m, ponto com 0,9 m livres em volta
  },
  // Etapa 2: coice visual por arma (× no tranco do modelo; 1 = antes). Valores das revisões por arma (docs/zumbi-v2/relatorio_final.md)
  armas: {
    coice: { m1911: .8, cz75: .8, fiveseven: .7, b23r: .8, c96: 1.1, python: 1.6, olympia: 1.8, m14: 1.3, spas: 1.6, fal: 1.3, hk21: .8, rpk: .8, commando: .9,
      dragunov: 1.6, chinalake: 1.8, ppsh: .8, thompson: 1.1, spectre: .9, kiparis: .85, uzi: .9 },
    // decisões do dono (13/10): valores da arma no modo zumbi que trocam os da tabela ZWEAP (o PaP é calculado a partir daqui)
    ajuste: { kar98k: { dmg: 600 }, m16: { rate: .22 } },
  },
  // Etapa 9: Pack-a-Punch com 3 níveis. custo[n] = preço para ir do nível n ao n+1; niveis[1] e [2] = bônus do nível 2 e 3 sobre o nível 1
  pap: {
    custo: [5000, 10000, 20000],
    oferta: [1000, 3000, 5000], // preço de cada nível com o PaP em oferta (poder da fogueira)
    niveis: [null, { sufixo: 'II', dano: 1.5, pente: 1.25, cadencia: .9, tracer: 0xff8a1a }, { sufixo: 'III', dano: 2.2, pente: 1.5, cadencia: .8, tracer: 0xff2a2a }],
  },
  // tipos do clássico (índice de ZKIND): tamanho e marcha mínima/máxima. Carniceiro (6) e cães têm regra própria.
  tipos: {
    0: { s: 1, estilo: 'cambaleante' },
    1: { s: 1.32, marchaMax: 1, estilo: 'pesado' }, // Brutamonte
    2: { s: 1.05, marchaMax: 1, estilo: 'cambaleante' }, // Explosivo
    3: { s: .86, marchaMin: 2, estilo: 'erratico' }, // Veloz
    4: { s: 1, estilo: 'cambaleante' }, // Tóxico
    5: { s: 1.04, marchaMin: 1, marchaMax: 1, estilo: 'cambaleante' }, // Gritador
    // Tanque (pedido do dono, 13/10): muita vida, pouco dano, devagar. dm troca o dano pelo tamanho (s^2,5 daria 2,5×); vida × a do comum;
    // aparece desde a rodada desde (depois do atraso da dificuldade), mais 1 a cada `cada` rodadas, no máximo 1 + nº de jogadores
    17: { s: 1.45, marchaMax: 0, estilo: 'pesado', dm: .5, vida: 6, pts: 120, xp: 8, desde: 9, cada: 5 },
  },
  // Pedido do dono (13/10): o zumbi comum (tipo 0, sem os especiais, cães e chefes) com 7% menos vida e golpe de no máximo 40 em todas
  // as dificuldades (no Normal eram 50: 2 golpes derrubavam; agora 3)
  comum: { vida: .93, danoMax: 40 },
  // chefes dos objetivos (Vigia, Foguista, Diretor): vida da rodada em que entram × vidaK (com a vida pura, a validação mediu lutas de
  // 12 a 18 s; o projeto pede minutos). Fuga: zona maior e o embarque só pausa quando a zona fica vazia (antes recomeçava)
  chefes: { vidaK: 2.5 }, fuga: { raio: 4.5 },
  // Pedido do dono (13/10): o Normal estava difícil demais. Ajustes por dificuldade sobre a tabela ZDIFF (0 Fácil, 1 Normal, 2 Difícil, 3 Pesadelo)
  dificuldade: { 1: { cnt: .9, regen: 3 } },
  // Decisão do dono (13/10): zumbi morto sem tiro por algo que um jogador ligou ou pegou (armadilha, Nuke, fogo do interativo, vapor da
  // válvula) dá pontos a quem ligou/pegou: os de um abate no corpo mais o bônus do tipo (o Carniceiro dá também os 300 do time).
  pontos: { semTiro: 60 },
  // Decisão do dono (13/10): modo infinito. Depois dos créditos da campanha a partida segue em rodadas infinitas (no mapa abaixo, com as
  // armas, pontos e bebidas de cada um, da rodada em que parou). No infinito, a escalada (só no infinito; o clássico não muda):
  infinito: {
    aposCampanha: true, mapa: 'sanatorio',
    qtd: { de: 15, porRodada: .02, max: .4 }, // zumbis da rodada: +2% por rodada depois da 15 (até +40%, na 35; com +60% a rodada 49 do Pesadelo passava de 450); o teto de vivos não muda
    carniceiro: { de: 25, cada: 15, max: 3 }, // rodada de Carniceiro: mais 1 a cada 15 rodadas depois da 25 (2 na 40, 3 na 55); nascem espaçados
    espaco: .5, // o Carniceiro seguinte entra quando faltar esta fração do que faltava na hora do anterior
    chefes: { depoisDe: 40, cada: 5 }, // chefes de campo (Vigia, Foguista, Diretor): a cada 10 rodadas da 20 à 40; depois a cada 5 (depoisDe − 20 múltiplo de 10)
    mista: { de: 25, cada: 6, caes: .2, avisoS: 2.5 }, // rodada mista: zumbis + cães (20% a mais, misturados) + Carniceiro garantido; nunca na rodada de chefe de campo nem na de cães
  },
};
