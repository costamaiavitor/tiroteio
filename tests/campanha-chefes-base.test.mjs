// Base dos chefes da campanha (Onda 3, O3-D07; docs/overhaul/campanha.md §7.1, §4.2 pilar/junção, §9 versão de campo):
// fases nos limites da vida (com 2 s de invulnerável), aviso antes do dano (nunca menos de 0,6 s), dano só dentro da forma (disco,
// linha, setor, altura e cobertura), ponto fraco (multiplica e respeita o teto), lacaios fora do toSpawn com teto de vivos, barra no
// cliente, pilar destrutível, morte (evento 'chefe', recompensa, fim da rodada), quem entra no meio, versão de campo e o clássico intacto.
// O chefe é DE TESTE (tipo acrescentado no ZKIND só nesta página): os de verdade (Vigia, Foguista, Diretor) são do D09, D11 e D13.
// Rodar: node --test tests/campanha-chefes-base.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 }); await J.page.evaluate(() => { window.__T.ZBAL.chefes.vidaK = 1; }); }, { timeout: 180000 }); // a mecânica da base com a vida pura (o ×2,5 dos objetivos é balanceamento, testado nos chefes)
after(async () => { await J?.fechar(); });

// chefe de teste (só nesta página): tipo novo no fim do ZKIND, definição em CAMP_CHEFE, objetivo 'matar' na etapa III
const DEF = T => {
  const TK = T.ZKIND.length; T.ZKIND.push({ n: 'Chefe de teste', sz: 1.3, rad: .45, pts: 500, xp: 10, fracoK: 3 }); // sem os tetos: a base preenche
  T.CAMP_CHEFE[TK] = {
    nome: 'O Teste', rodada: 10, base: 6, porJog: 4, vel: 2, nasce: { x: 0, z: -4 },
    fases: [{ de: 1 }, { de: .66, vel: 2.5 }, { de: .33, baixa: 1, danoK: 1.15 }],
    ataques: [
      { id: 'disco', aviso: .5, ativo: 0, rec: 1, forma: 'disco', onde: 'alvo', dims: [3], dano: 40, fraco: 1 },
      { id: 'linha', aviso: .8, ativo: 0, rec: .5, forma: 'linha', dims: [20, 1], dano: 30, pilar: 400 },
      { id: 'setor', aviso: 1, ativo: 0, rec: .5, forma: 'setor', dims: [10, 60], dano: 20, cobre: 1 },
      { id: 'brasa', aviso: .7, ativo: 2, forma: 'disco', onde: 'alvo', dims: [2], dps: 20 },
      { id: 'pelotao', aviso: 1, ativo: 0, lacaios: { tipo: 3, n: 3, max: 2 } },
      { id: 'arena', campo: 0, aviso: .6, forma: 'disco', dims: [2], dano: 10 },
    ],
    fraco: { caixa: { f: -.4, r: .25, y0: 1.0, y1: 1.5 } },
  };
  return TK;
};
const PREP = `(T => {
  const p = T.S.players.get('h'), CH = T.CAMP_CH, TK = T.ZKIND.findIndex(k => k?.n === 'Chefe de teste'); // O3-D09: tipos ainda vazios do ZKIND são null
  const poe = (q, x, z, y = 0) => { q.pos = [x, y, z]; if (q === p) { T.me.pos.set(x, y, z); T.me.vel.set(0, 0, 0); } };
  const quieto = () => { const z = CH.z; if (z) { z.speed = 0; z.atkT = 1e12; } CH.prox = 1e12; CH.lacT = 1e12; T.Z.spawnT = 1e12; T.Z.toSpawn = Math.max(T.Z.toSpawn, 5); for (const o of [...T.Z.zs.values()]) if (o !== z) T.Z.zs.delete(o.id); };
  const agora = () => window.__simNow;
  const tg = q => q; // alvo do ataque (jogador)
  const atk = id => T.CAMP_CHEFE[TK].ataques.find(a => a.id === id);
  return { p, CH, TK, poe, quieto, agora, tg, atk };
})`;
const em = fn => `(T, arg) => { const { p, CH, TK, poe, quieto, agora, tg, atk } = (new Function('return ' + arg.PREP)())(T); return (${fn})(T, arg, p, CH, TK, poe, quieto, agora, tg, atk); }`;
const rodar = (fn, a = {}) => J.page.evaluate(([src, arg]) => (new Function('T', 'arg', `return (${src})(T, arg)`))(window.__T, arg), [em(fn.toString()), { PREP, ...a }]);

test('clássico sem efeito: nenhum chefe da campanha, barra do Carniceiro, sem caixa do fraco, sem avisos, pilar desligado', { timeout: 120000 }, async () => {
  const r = await noJogo(J.page, (T, DEFsrc) => {
    const TK = (new Function('return ' + DEFsrc)())(T);
    if (T.Z.phase !== 'round') T.zStartRound();
    const z0 = T.campChefeNasce(TK), ch0 = T.campChefeEstado();
    // Carniceiro pela fila: bo é o dele, sem caixa 'fraco'
    // O3-D16: o Carniceiro nasce num raio sorteado em volta do jogador, só em células com o campo de fluxo pronto (no começo da partida
    // ele ainda está sendo calculado em fatias): sem chão, a chamada falha; tenta de novo andando um pouco o relógio
    T.Z.zs.clear(); T.Z.spawnT = 1e12; let id, c = null; for (let k = 0; k < 40 && !c; k++) { T.Z.reQ = [[6, 0, 0]]; T.Z.toSpawn++; id = T.Z.nextId; if (T.zSpawnOne()) c = T.Z.zs.get(id); else { T.Z.toSpawn--; T.sim(.1); } }
    c.hp = c.maxHp * .5; T.sim(.3);
    const zc = T.ZC.zs.get(id), caixas = zc ? T.zBoxes(zc).map(b => b[0]) : null;
    return { on: T.CAMP.on, z0, ch0, bo: T.ZC.bo, txt: document.getElementById('zboss').firstChild.nodeValue, caixas, fbx: zc?.fbx ?? null, av: T.CAMP_AV, pil: T.ZD.zint.filter(o => o.t === 'pilar').length, d: T.campDanoPilar(0, 100), tk: TK };
  }, DEF.toString());
  assert.equal(r.on, false); assert.equal(r.z0, null, 'sem campanha o chefe não nasce'); assert.equal(r.ch0.id, null);
  assert.equal(r.bo, .5, 'a barra continua sendo a do Carniceiro'); assert.equal(r.txt, 'CARNICEIRO');
  assert.deepEqual(r.caixas, ['head', 'body', 'legs'], 'sem caixa do ponto fraco no clássico'); assert.equal(r.fbx, null);
  assert.equal(r.av, null, 'o pool de avisos não é criado no clássico'); assert.equal(r.pil, 0); assert.equal(r.d, false, 'pilar não leva dano sem campanha');
  assert.equal(J.erros.length, 0, J.erros.join('\n'));
});

test('campanha: o objetivo matar chama o chefe; vida pela rodada da tabela; tetos preenchidos; cliente recebe o chefe e a barra', { timeout: 180000 }, async () => {
  const r = await rodar((T, arg, p, CH, TK) => {
    T.ZINT_MAPA.sanatorio.push({ t: 'pilar', id: 'tp-1', v: 'sacos', x: 0, z: -5, n: [0, 1], hp: 600, h: 1.8 }, { t: 'juncao', id: 'tp-j', x: -8.4, z: -2, n: [1, 0], hp: 200 });
    Object.assign(T.CAMP_OBJ, { 'T.mat': { tipo: 'matar', titulo: 'Mate o chefe de teste', chefe: TK } });
    const A = T.CAMP_ATOS[3]; A.objs = ['T.mat']; A.ini = ['T.mat'];
    T.S.st = { ...T.S.st, zmode: 'campanha' }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1); // objetivos do mapa: o Sanatório começa na etapa III, na rodada 1
    T.sim(T.Z.phaseEnd - window.__simNow + .2); T.sim(2.2); // pré-rodada, depois o chefe sobe do chão
    const z = CH.z, K = T.ZKIND[TK];
    const o = { on: T.CAMP.on, round: T.Z.round, ph: T.Z.phase, k: CH.k, st: z?.st, hp: z?.hp, maxHp: z?.maxHp, esp: Math.round(T.zHp(10) * T.zHpK(10) * 10), lac: z?.lac ?? 0, ts: T.Z.toSpawn,
      caps: ['capGolpe', 'capFraco', 'capArmadilha', 'capNuke', 'capBarril'].map(c => K[c]), chefe: K.chefe, ia: !!z?.ck, enc: CH.encerra,
      cli: T.CAMP.c.ch && { k: T.CAMP.c.ch.k, f: T.CAMP.c.ch.f, z: T.CAMP.c.ch.z }, bo: T.ZC.bo, av: !!T.CAMP_AV, zi: T.ZD.zint.filter(x => x.id?.startsWith('tp-')).map(x => x.t) };
    const zb = document.getElementById('zboss'); o.txt = zb.firstChild.nodeValue; o.mk = zb.querySelectorAll('.campMk').length; o.oculto = zb.classList.contains('hidden');
    o.marcas = [...zb.querySelectorAll('.campMk')].map(e => e.style.left);
    return o;
  });
  assert.equal(r.on, true); assert.equal(r.round, 1); assert.equal(r.ph, 'round'); assert.equal(r.k, r.k | 0);
  assert.equal(r.st, 'in'); assert.equal(r.hp, r.esp, 'vida = zHp(10)·0,9·(6 + 4·1) (Normal, 1 jogador; o 0,9 é a vida do Normal desde o balanceamento final de 13/10): 9 405'); assert.equal(r.maxHp, 9405);
  assert.deepEqual(r.caps, [.06, .1, .02, .05, .08], 'tetos que faltavam vêm da base (nunca NaN)'); assert.equal(r.chefe, 1); assert.ok(r.ia, 'IA do chefe registrada');
  assert.equal(r.enc, true, 'na campanha a morte encerra a rodada');
  assert.deepEqual(r.cli, { k: r.k, f: 1, z: r.cli.z }); assert.equal(r.bo, 1, 'bo da foto = vida do chefe');
  assert.equal(r.txt, 'O TESTE · FASE 1'); assert.equal(r.mk, 2, 'marcas das 2 trocas de fase'); assert.deepEqual(r.marcas.map(parseFloat), [66, 33]); assert.equal(r.oculto, false);
  assert.ok(r.av, 'pool de avisos criado na campanha'); assert.deepEqual(r.zi, ['pilar', 'juncao']);
  assert.equal(J.erros.length, 0, J.erros.join('\n'));
});

test('aviso antes do dano: nunca menos de 0,6 s (Pesadelo 0,5·0,8 → 0,6); dano só depois; o pool mostra e esconde', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, p, CH, TK, poe, quieto, agora, tg, atk) => {
    quieto(); const z = CH.z; CH.inv = 0; poe(p, 0, 2); z.body.pos.set(0, 0, -4); p.hp = p.maxHp = 1000; p.dwEnd = 0;
    T.S.st.zdiff = 3; T.CAMP.c.tel = [];
    T.campChefeAtaca(z, atk('disco'), p); const A = CH.atk, tel = T.CAMP.c.tel[T.CAMP.c.tel.length - 1];
    T.sim(1 / 60); const av1 = T.CAMP_AV.disco.count, vis1 = T.CAMP_AV.disco.visible;
    const h0 = p.hp; T.sim(.5); const h1 = p.hp; const ativo0 = !!CH.atk;
    T.sim(.15); const h2 = p.hp;
    T.S.st.zdiff = 1;
    T.sim(1.5); const av2 = T.CAMP_AV.disco.count, vis2 = T.CAMP_AV.disco.visible;
    return { s: A.fa - A.t0, tel: tel && { a: tel.a, f: tel.f, s: tel.s, d1: tel.d1, n: tel.p.length }, av1, vis1, h0, h1, h2, ativo0, av2, vis2, fr: z.fracoAte > agora() - 2 };
  });
  assert.ok(Math.abs(r.s - .6) < 1e-6, `aviso de ${r.s} s`); assert.deepEqual(r.tel, { a: 'disco', f: 'disco', s: .6, d1: 3, n: 1 });
  assert.equal(r.av1, 1); assert.equal(r.vis1, true, 'o aviso aparece no chão');
  assert.equal(r.h1, r.h0, 'nada de dano durante o aviso'); assert.equal(r.h0 - r.h2, 60, 'dano depois do aviso (40 × 75/50 no Pesadelo)');
  assert.equal(r.av2, 0); assert.equal(r.vis2, false, 'sem ataque, nada desenhado'); assert.ok(r.fr, 'a recuperação abriu o ponto fraco');
});

test('dano só na forma: disco, linha, setor (com a abertura), altura (ataque de chão) e cobertura', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, p, CH, TK, poe, quieto, agora, tg, atk) => {
    quieto(); const z = CH.z;
    const A = (id, sh) => ({ a: atk(id), d1: atk(id).dims[0], d2: atk(id).dims[1] ?? (atk(id).forma === 'setor' ? 60 : 1), fa: 0, fb: 0, sh: [sh] });
    const q = (x, zz, y = 0) => ({ pos: [x, y, zz] }), den = (a, s, qq) => T.campChefeDentro(a, s, qq, s[3], a.d1);
    const D = A('disco', [0, 0, 0, 0]), L = A('linha', [0, 0, 0, 0]), St = A('setor', [0, 0, 0, 0]); // ang 0: frente para -z
    return {
      disco: [den(D, D.sh[0], q(0, 3.2)), den(D, D.sh[0], q(0, 3.4)), den(D, D.sh[0], q(2, 2)), den(D, D.sh[0], q(0, 1, 1.6)), den(D, D.sh[0], q(0, 1, 1.4))],
      linha: [den(L, L.sh[0], q(0, -19)), den(L, L.sh[0], q(0, -20.4)), den(L, L.sh[0], q(.75, -5)), den(L, L.sh[0], q(.85, -5)), den(L, L.sh[0], q(0, 2))],
      setor: [den(St, St.sh[0], q(0, -9)), den(St, St.sh[0], q(Math.sin(.45) * 8, -Math.cos(.45) * 8)), den(St, St.sh[0], q(Math.sin(.7) * 8, -Math.cos(.7) * 8)), den(St, St.sh[0], q(0, 9)), den(St, St.sh[0], q(0, -10.5))],
    };
  });
  assert.deepEqual(r.disco, [true, false, true, false, true], 'disco de 3 m (+0,3 do corpo); 1,6 m acima não pega, 1,4 m pega');
  assert.deepEqual(r.linha, [true, false, true, false, false], 'linha de 20 × 1 m saindo para a frente');
  assert.deepEqual(r.setor, [true, true, false, false, false], 'setor de 60° e 10 m');
});

test('pilar: segura a linha (quem está atrás não leva), racha, cai (colisor baixa), tiro e explosão; junção rompe', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, p, CH, TK, poe, quieto, agora, tg, atk) => {
    quieto(); const z = CH.z, idx = id => T.ZD.zint.findIndex(o => o.id === id), i = idx('tp-1'), j = idx('tp-j'), E = T.Z.zint[i], col = T.ZC.world.zint[i].col;
    z.body.pos.set(-5, 0, -5); poe(p, 5, -5); p.hp = p.maxHp = 1000; p.dwEnd = 0; z.yaw = 0; // a linha do chefe até o jogador passa pelo pilar
    const V = T.camera.position.constructor, h0 = p.hp; T.campChefeAtaca(z, atk('linha'), p); T.sim(.9); const h1 = p.hp;
    const st1 = T.Z.zint[i].st, hp1 = E.hp, cst1 = T.ZC.zint[i].st;
    poe(p, -5, 2); T.campChefeAtaca(z, atk('linha'), p); T.sim(.9); const h2 = p.hp; // sem pilar no caminho
    const mx0 = col.maxY; T.campDanoPilar(i, 1000); T.sim(1 / 60); const st2 = T.Z.zint[i].st, mx = col.maxY, cst2 = T.ZC.zint[i].st;
    T.campPilarRestaura(i); T.sim(1 / 60); const st3 = T.Z.zint[i].st, mx3 = col.maxY;
    p.shotW = 'm1911'; const n = Math.ceil(600 / T.W.m1911.dmg); for (let k = 0; k < n; k++) T.zintTiro(p, [3, 1.5, -5], [[col.maxX - .05, .6, -5]]); const st4 = T.Z.zint[i].st;
    T.campPilarRestaura(i); T.zExplode(new V(0, .5, -3.8), 'h', 5, 0, 'he'); const st5 = T.Z.zint[i].st;
    T.campDanoPilar(j, 250); const sj = T.Z.zint[j].st;
    T.campPilarRestaura(i); T.sim(1 / 60); poe(p, 4, -5); const h6 = p.hp; T.campChefeAtaca(z, atk('setor'), p); T.sim(1.1); const h7 = p.hp; // setor com cobre: atrás do pilar não leva
    poe(p, -1, -1); T.campChefeAtaca(z, atk('setor'), p); T.sim(1.1); const h8 = p.hp; // à vista: leva
    T.campPilarRestaura(i); T.campPilarRestaura(j); T.sim(.1);
    return { h0, h1, h2, st1, hp1, cst1, st2, mx0, mx, cst2, st3, mx3, st4, st5, sj, n, coberto: h6 - h7, aVista: h7 - h8 };
  });
  assert.equal(r.h1, r.h0, 'o pilar segurou a linha'); assert.equal(r.hp1, 200, 'o pilar perdeu 400'); assert.equal(r.st1, 'rachado'); assert.equal(r.cst1, 'rachado', 'o cliente vê rachado');
  assert.equal(r.h0 - r.h2, 30, 'sem pilar no caminho, a linha pega');
  assert.equal(r.st2, 'caido'); assert.equal(r.cst2, 'caido'); assert.equal(r.mx, .25, 'caído: só os restos (colisor baixo)'); assert.equal(r.mx0, 1.8);
  assert.equal(r.st3, 'pronto'); assert.equal(r.mx3, 1.8);
  assert.equal(r.st4, 'caido', `tiros (${r.n}) derrubam o pilar`); assert.notEqual(r.st5, 'pronto', 'explosão perto racha/derruba'); assert.equal(r.sj, 'rompida');
  assert.equal(r.coberto, 0, 'cobertura: o pilar protege do setor'); assert.equal(r.aVista, 20, 'à vista o setor pega');
});

test('fases: o golpe para no limite, 2 s invulnerável, ataque cancelado; Nuke também troca a fase; o cliente vê', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, p, CH, TK, poe, quieto, agora, tg, atk) => {
    quieto(); const z = CH.z; z.hp = z.maxHp; CH.fase = 0; CH.inv = 0; z.body.pos.set(0, 0, -4); poe(p, 0, 3); p.dwEnd = 1e12;
    const o = {};
    z.hp = z.maxHp * .67; T.campChefeAtaca(z, atk('setor'), p); const tinha = !!CH.atk;
    T.zHit(p, z.id, 5000, 'body', 'm1911', false); o.f1 = [CH.fase, z.hp / z.maxHp, CH.inv - agora(), tinha, !!CH.atk];
    T.zHit(p, z.id, 5000, 'body', 'm1911', false); o.inv = z.hp / z.maxHp;
    T.sim(.1); o.cli = T.CAMP.c.ch.f; o.speed = z.speed;
    T.sim(2); T.zHit(p, z.id, 300, 'body', 'm1911', false); o.depois = +(z.hp / z.maxHp).toFixed(4);
    z.hp = z.maxHp * .34; z.nukeAt = agora() + .05; T.sim(.2); o.f3 = [CH.fase, +(z.hp / z.maxHp).toFixed(2), T.CAMP.c.ch.f];
    T.sim(2.1); T.zHit(p, z.id, 1000, 'body', 'm1911', false); o.k3 = Math.round(z.maxHp * .29 - z.hp); // fase 3: leva ×1,15 (teto 6%)
    return o;
  });
  assert.equal(r.f1[0], 1, 'passou para a fase 2'); assert.ok(Math.abs(r.f1[1] - .66) < 1e-9, 'o golpe parou em 66%'); assert.ok(Math.abs(r.f1[2] - 2) < 1e-6, '2 s invulnerável');
  assert.ok(r.f1[3] && !r.f1[4], 'ataque em curso cancelado'); assert.ok(Math.abs(r.inv - .66) < 1e-9, 'invulnerável: nada de dano');
  assert.equal(r.cli, 2, 'o cliente vê a fase 2'); assert.equal(r.speed, 2.5 * .95, 'velocidade da fase (2,5 × 0,95 do Normal, balanceamento final 13/10)');
  assert.ok(Math.abs(r.depois - (.66 - 300 / 9405)) < 1e-3, 'depois da invulnerabilidade o dano volta'); // 9405 = vida do chefe no Normal (×0,9 desde o balanceamento final 13/10)
  assert.deepEqual(r.f3, [2, .29, 3], 'Nuke (5%) passou do limite: o relógio trocou a fase');
  assert.equal(r.k3, Math.round(Math.min(1000 * 1.15, 9405 * .06)), 'fase 3: ×1,15 e teto 6%');
});

test('ponto fraco: zhit "fraco" só com a janela aberta, multiplica (×3) e respeita o teto (10%); caixa e multiplicador no cliente', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, p, CH, TK, poe, quieto, agora, tg, atk) => {
    quieto(); const z = CH.z; CH.inv = 0; CH.fase = 0; z.body.pos.set(0, 0, -4); z.yaw = 0; poe(p, 0, 2); p.dwEnd = 1e12; p.inv.secondary = 'm1911'; p.inv.primary = 'm1911';
    const w = T.W.m1911.dmg, o = { w };
    const tiro = zz => { T.sim(.6); const h = z.hp; T.sendToHost({ t: 'zhit', v: z.id, w: 'm1911', dmg: 1e6, z: zz }); T.sim(1 / 60); return +(h - z.hp).toFixed(3); };
    z.hp = z.maxHp * .9; z.fracoAte = 0; o.fechado = tiro('fraco'); o.corpo = tiro('body');
    z.fracoAte = agora() + 30; o.aberto = tiro('fraco');
    const mx = z.maxHp; z.maxHp = 300; z.hp = 290; CH.fase = 2; o.teto = tiro('fraco'); z.maxHp = mx; z.hp = mx * .9; CH.fase = 0; CH.inv = 0;
    // cliente: caixa 'fraco' por último (zBoxes[0] continua a cabeça) e o multiplicador
    T.sim(.1); const zc = T.ZC.zs.get(z.id), L = T.zBoxes(zc); o.caixas = L.map(b => b[0]); T.CAMP.c.ch.fr = agora() + 5; o.mult = T.campFracoMult('z' + z.id);
    T.CAMP.c.ch.fr = 0; T.CAMP.c.ch.at = 0; o.multFechado = T.campFracoMult('z' + z.id);
    // tiro de verdade pelas costas (o jogador atrás dele mira na caixa do fraco)
    const b = L.find(x => x[0] === 'fraco')[1], cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2, cz = (b.minZ + b.maxZ) / 2;
    const or = new T.camera.position.constructor(cx, cy, cz + 4), dir = new T.camera.position.constructor(0, 0, -1), res = T.trace(or, dir, 50, T.zCands());
    o.trace = res.zone;
    return o;
  });
  assert.ok(r.fechado > 0 && Math.abs(r.fechado - r.corpo) < 1e-6, 'janela fechada: vale corpo');
  assert.ok(Math.abs(r.corpo - Math.min(r.w * 1.1, 9405 * .06)) < 1e-3, 'corpo: teto do tiro');
  assert.ok(Math.abs(r.aberto - Math.min(r.w * 3 * 1.1, 9405 * .1)) < 1e-3, `fraco aberto: ×3 (${r.aberto})`);
  assert.ok(Math.abs(r.teto - 30) < 1e-6, 'teto do fraco: 10% da vida');
  assert.deepEqual(r.caixas, ['head', 'body', 'legs', 'fraco']); assert.equal(r.mult, 3); assert.equal(r.multFechado, 1); assert.equal(r.trace, 'fraco', 'tiro pelas costas acerta a caixa do fraco');
});

test('lacaios: nascem fora do toSpawn, marcados, com teto de vivos (ataque e periódicos)', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, p, CH, TK, poe, quieto, agora, tg, atk) => {
    quieto(); const z = CH.z; CH.inv = 0; z.body.pos.set(0, 0, -4); poe(p, 0, 2); p.dwEnd = 1e12;
    const ts = T.Z.toSpawn, n0 = T.Z.zs.size;
    T.campChefeAtaca(z, atk('pelotao'), p); T.sim(1.2); const a = T.campChefeLacVivos();
    T.campChefeAtaca(z, atk('pelotao'), p); T.sim(1.2); const b = T.campChefeLacVivos();
    T.CAMP_CHEFE[TK].lacaios = { tipo: 3, n: 2, cada: 1, max: 4 }; CH.lacT = agora();
    T.sim(4); const c = T.campChefeLacVivos();
    const lac = [...T.Z.zs.values()].filter(o => o.lac), tipos = [...new Set(lac.map(o => o.kind))];
    delete T.CAMP_CHEFE[TK].lacaios; CH.lacT = 1e12;
    return { ts, ts2: T.Z.toSpawn, n0, a, b, c, tipos, mix: T.Z.mixN };
  });
  assert.equal(r.a, 2, 'pelotão: 3 pedidos, teto 2'); assert.equal(r.b, 2, 'teto de vivos segurado'); assert.equal(r.c, 4, 'periódicos até o teto 4');
  assert.equal(r.ts2, r.ts, 'lacaios fora do toSpawn'); assert.deepEqual(r.tipos, [3]);
});

test('quem entra no meio: cp com o chefe, a fase e o aviso no ar; o cliente monta a barra', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, p, CH, TK, poe, quieto, agora, tg, atk) => {
    quieto(); const z = CH.z; CH.inv = 0; z.body.pos.set(0, 0, -4); poe(p, 0, 2); p.dwEnd = 1e12;
    T.campChefeAtaca(z, atk('setor'), p); T.sim(.1);
    const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; } };
    T.srvOnData(c, { t: 'join', v: 2, pv: 7, name: 'Meio' }); T.sim(.05);
    T.sim(.15); const st = c.out.filter(m => m.t === 'state' && m.z).pop(), zs = c.out.filter(m => m.t === 'zs' && m.bo).pop();
    T.srvDrop(c);
    const cp = st?.z?.cp;
    T.campCliReset(); T.campSync(cp); T.sim(1 / 60);
    const zb = document.getElementById('zboss');
    return { ch: cp?.ch, tel: cp?.tel?.[0] && { a: cp.tel[0].a, f: cp.tel[0].f, s: cp.tel[0].s }, bo: zs?.bo, cli: T.CAMP.c.ch && T.CAMP.c.ch.f, tels: T.CAMP.c.tel?.length, txt: zb.firstChild.nodeValue, f: CH.fase + 1 };
  });
  assert.ok(Array.isArray(r.ch) && r.ch[2] === r.f, 'cp.ch traz a fase'); assert.equal(r.tel.a, 'setor'); assert.ok(r.tel.s > 0 && r.tel.s < 1, 'o aviso no ar, com o tempo que falta');
  assert.ok(r.bo > 0, 'a foto traz o bo'); assert.equal(r.cli, r.f); assert.equal(r.tels, 1); assert.equal(r.txt, 'O TESTE · FASE ' + r.f);
});

test('morte: evento chefe (objetivo matar), recompensa, lacaios e o resto caem sem pontos, a rodada acaba', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, p, CH, TK, poe, quieto, agora, tg, atk) => {
    quieto(); const z = CH.z; CH.inv = 0; CH.fase = 2; z.body.pos.set(0, 0, -4); poe(p, 0, 2); p.dwEnd = 1e12;
    T.campChefeLacaios({ tipo: 3, n: 2, max: 4 }); T.Z.toSpawn = 0; T.Z.reQ = []; // um comum ainda vivo, para ver a rodada acabar
    { const id = T.Z.nextId; T.Z.toSpawn++; T.zSpawnOne(); T.Z.toSpawn = 3; }
    const money = p.money, kills = p.kills, vivos = T.Z.zs.size, drops = T.Z.drops.length;
    z.hp = 10; T.zHit(p, z.id, 100, 'body', 'm1911', false);
    const o = { vivos, zs: T.Z.zs.size, ts: T.Z.toSpawn, obj: T.campEstado().obj['T.mat']?.st, ch: CH.z, drops: T.Z.drops.length - drops, tipos: T.Z.drops.slice(drops).map(d => d.type), ganho: p.money - money, kills: p.kills - kills };
    T.sim(.2); o.ph = T.Z.phase; o.fim = !!T.CAMP.fim; o.cli = T.CAMP.c.ch;
    return o;
  });
  assert.ok(r.vivos >= 3); assert.equal(r.zs, 0, 'todos caíram'); assert.equal(r.ts, 0); assert.equal(r.obj, 'feito', 'objetivo matar feito (campEvento)'); assert.equal(r.ch, null);
  assert.ok(r.drops >= 2); assert.ok(r.tipos.includes('max') && r.tipos.includes('perk'), 'drops garantidos: max e perk'); assert.equal(r.kills, 1, 'só o chefe conta abate');
  assert.ok(r.ganho >= 500, `recompensa +500 (${r.ganho})`); assert.notEqual(r.ph, 'round', 'a rodada de chefe acabou'); assert.ok(r.cli == null, 'o cliente tira a barra'); // a etapa seguinte zera o estado do cliente (campCliReset): undefined
  assert.equal(J.erros.length, 0, J.erros.join('\n'));
});

test('versão de campo (infinito): só ataques de campo, lacaios perto dos jogadores; a morte não encerra a rodada', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, p, CH, TK, poe, quieto, agora, tg, atk) => {
    T.S.st = { ...T.S.st, zmode: 'infinito', map: 'sanatorio' }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1);
    T.sim(T.Z.phaseEnd - window.__simNow + .2); T.Z.spawnT = 1e12;
    const sp = T.ZD.spawns[0]; poe(p, sp[0], sp[1]); p.dwEnd = 1e12;
    const z = T.campChefeNasce(TK, { campo: 1 }); T.sim(2);
    const o = { modo: T.CAMP.modo, z: !!z, campo: CH.campo, enc: CH.encerra };
    z.speed = 0; z.atkT = 1e12; CH.lacT = 1e12; CH.inv = 0; z.st = 'in'; z.body.pos.set(sp[0] + 3, 0, sp[1]); z.tgt = p;
    const vistos = new Set(); for (let k = 0; k < 200; k++) { CH.atk = null; CH.cd = {}; T.campChefeSorteia(z); if (CH.atk) vistos.add(CH.atk.a.id); }
    CH.atk = null; T.broadcast({ t: 'camp', k: 'telx' });
    o.vistos = [...vistos].sort();
    const n = T.campChefeLacaios({ tipo: 3, n: 2, max: 4, onde: 'portoes' }), lac = [...T.Z.zs.values()].filter(x => x.lac);
    o.lacSt = lac.map(x => x.st); o.n = n;
    const ts = T.Z.toSpawn; z.hp = 5; CH.fase = 2; T.zHit(p, z.id, 100, 'body', 'm1911', false);
    o.lacDepois = [...T.Z.zs.values()].filter(x => x.lac).length; o.ts = T.Z.toSpawn === ts; o.ph = T.Z.phase;
    return o;
  });
  assert.equal(r.modo, 'infinito'); assert.ok(r.z); assert.equal(r.campo, true); assert.equal(r.enc, false);
  assert.ok(!r.vistos.includes('arena'), 'ataque sem campo não sai na versão de campo'); assert.ok(r.vistos.includes('disco') && r.vistos.includes('linha'));
  assert.equal(r.n, 2); assert.ok(r.lacSt.every(s => s === 'rise' || s === 'in'), 'lacaios de campo saem do chão perto do jogador (não pelos portões)');
  assert.equal(r.lacDepois, 0, 'lacaios caem com o chefe'); assert.ok(r.ts, 'o toSpawn do infinito não muda'); assert.equal(r.ph, 'round');
  assert.equal(J.erros.length, 0, J.erros.join('\n'));
});
