// Interativos novos da Frente C (Onda 2, O2-C10): máquina de munição e baú do armeiro e sino da igreja (Vila); Wunderfizz e armário de
// evidências (Sanatório). Regras do host conferidas: F longe não faz nada; sem pontos ou sem energia recusa sem cobrar; com pontos cobra
// o preço da tabela (ZINT) e entrega (munição de todas as armas; bebida; arma do baú); 1 vez por jogador por rodada (munição e baú);
// Wunderfizz respeita o limite de bebidas e nunca repete bebida; o baú sorteia no host (o que o cliente manda não escolhe), oferece só a
// quem pagou e devolve os pontos se a pessoa já tiver a arma; o sino põe a isca (Z.lure), os zumbis vão até ela, o macaco vence e a isca
// some no fim; quem entra no meio recebe os estados (zWorldState().zi -> zintSync). Os tipos são achados por `t`, nunca por índice.
// Rodar: pnpm test (todos) ou node --test tests/interativos-maquinas.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); }, { timeout: 120000 });
after(async () => { await J?.fechar(); });

// cena: rodada sem zumbi novo, jogador num ponto; índices de cada tipo; energia ligada ou não
const PREP = `(T => {
  const p = T.S.players.get('h'), L = T.ZD.zint, de = t => L.map((o, i) => i).filter(i => L[i].t === t);
  const poe = (q, x, z) => { q.pos = [x, 0, z]; if (q.id === 'h') T.me.pos.set(x, 0, z); };
  const frente = (i, d = 1.2) => [L[i].x + L[i].n[0] * d, L[i].z + L[i].n[1] * d];
  const energia = on => { T.Z.power = on; T.ZC.power = on; };
  const zera = i => { const E = T.Z.zint[i]; E.st = 'pronto'; E.t = 0; E.rod = {}; T.zintMsg({ t: 'zint', i, st: 'pronto', s: 0 }); T.ZC.zint[i].usei = -1; T.ZC.zint[i].meu = false; };
  const zumbi = (x, z) => { const id = T.Z.nextId; T.zSpawnOne(); const zz = T.Z.zs.get(id); if (!zz) throw new Error('zSpawnOne não criou zumbi'); zz.st = 'in'; zz.body.pos.set(x, 0, z); zz.sc = 0; return zz; };
  T.Z.toSpawn = 50; T.Z.spawnT = 1e12; T.Z.zs.clear(); p.dwEnd = 1e12;
  return { p, L, de, poe, frente, energia, zera, zumbi };
})`;
// jogador falso (como nos testes de rede): entra pela porta da frente do host
const FALSO = `(T => { const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; }, peerConnection: null };
  T.srvOnData(c, { t: 'join', v: 2, pv: 6, name: 'Outro' }); const q = T.S.players.get(c.pid); if (q) { q.alive = true; q.downed = false; } return { c, q }; })`;

test('máquinas (Vila): monta munição, baú do armeiro e sino (colisor no COL, estado pronto, preços da tabela na auditoria)', { timeout: 240000 }, async () => {
  await criarSala(J.page, { mode: 'zombies', map: 'vila', zdiff: 1 });
  const r = await noJogo(J.page, T => {
    if (T.Z.phase !== 'round') T.zStartRound(); T.sim(.2);
    const L = T.ZD.zint, E = T.ZC.world.zint, COL = T.COL(), aud = T.zintAud(), ix = L.map((o, i) => i).filter(i => ['municao', 'bau', 'sino', 'wunderfizz'].includes(L[i].t));
    return { tipos: ix.map(i => L[i].t + (L[i].v ? ':' + L[i].v : '')).sort(), col: ix.every(i => COL.includes(E[i].col)), pronto: ix.every(i => T.Z.zint[i].st === 'pronto' && T.ZC.zint[i].st === 'pronto'),
      precos: ix.map(i => [aud[i].tipo, aud[i].preco, T.ZINT[L[i].t].custo]) };
  });
  assert.deepEqual(r.tipos, ['bau:armeiro', 'municao', 'sino']); assert.ok(r.col, 'colisor fora do COL'); assert.ok(r.pronto, 'estado inicial não é pronto');
  for (const [t, a, b] of r.precos) assert.equal(a, b, `preço do ${t} na auditoria`);
});

test('munição: sem energia e sem pontos recusa; cobra o preço, enche todas as armas, 1 vez por rodada; arma do Pack-a-Punch paga custoPap', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, de, poe, frente, energia, zera } = (new Function('return ' + PREP)())(T), D = T.ZINT.municao, i = de('municao')[0]; zera(i);
    p.inv.primary = 'm1911'; p.inv.secondary = 'mp40'; const res = {};
    const vazia = () => { for (const w of ['m1911', 'mp40', 'mp40_pap']) T.G.ammo[w] = { mag: 0, res: 0 }; };
    poe(p, ...T.ZD.spawns[0]); energia(true); p.money = 9000; T.srvZUse(p, { k: 'zint', id: i }); res.longe = 9000 - p.money;
    poe(p, ...frente(i)); energia(false); T.srvZUse(p, { k: 'zint', id: i }); res.semEnergia = 9000 - p.money;
    energia(true); p.money = D.custo - 1; T.srvZUse(p, { k: 'zint', id: i }); res.pobre = p.money === D.custo - 1;
    vazia(); p.money = 9000; T.srvZUse(p, { k: 'zint', id: i }); T.sim(.05);
    res.gasto = 9000 - p.money; res.cheia = ['m1911', 'mp40'].map(w => [T.G.ammo[w].mag, T.G.ammo[w].res]); res.st = T.Z.zint[i].st; res.cli = T.ZC.zint[i].st; res.usei = T.ZC.zint[i].usei === T.ZC.round;
    T.zInteract(0); res.prompt = T.ZC.act?.txt;
    vazia(); const m1 = p.money; T.srvZUse(p, { k: 'zint', id: i }); res.denovo = m1 - p.money; res.vaziaDepois = T.G.ammo.mp40.res;
    T.sim(D.usoS + .1); res.volta = T.Z.zint[i].st;
    T.Z.round++; T.ZC.round++; p.inv.secondary = 'mp40_pap'; const m2 = p.money; T.srvZUse(p, { k: 'zint', id: i }); T.sim(.05); res.pap = m2 - p.money; res.papCheia = T.G.ammo.mp40_pap.res;
    p.inv.secondary = null; return { ...res, custo: D.custo, custoPap: D.custoPap, resMp40: T.W.mp40.res, resPap: T.W.mp40_pap.res };
  }, PREP);
  assert.equal(r.longe, 0, 'F de longe cobrou'); assert.equal(r.semEnergia, 0, 'cobrou sem energia'); assert.ok(r.pobre, 'cobrou sem pontos');
  assert.equal(r.gasto, r.custo); assert.equal(r.st, 'uso'); assert.equal(r.cli, 'uso'); assert.ok(r.usei, 'o cliente não marcou a rodada');
  assert.ok(r.cheia.every(([m, s]) => m > 0 && s > 0), `armas não encheram: ${JSON.stringify(r.cheia)}`);
  assert.match(r.prompt || '', /próxima rodada/, `F depois de usar: ${r.prompt}`);
  assert.equal(r.denovo, 0, 'cobrou a segunda vez na mesma rodada'); assert.equal(r.vaziaDepois, 0, 'encheu a segunda vez na mesma rodada'); assert.equal(r.volta, 'pronto');
  assert.equal(r.pap, r.custoPap, 'com arma do Pack-a-Punch devia custar custoPap'); assert.equal(r.papCheia, r.resPap);
});

test('baú do armeiro: sorteio no host (o pedido do cliente não escolhe), sem o que a pessoa já tem; oferta só para quem pagou; 1 vez por rodada', { timeout: 90000 }, async () => {
  const r = await noJogo(J.page, (T, A) => {
    const { p, L, de, poe, frente, zera } = (new Function('return ' + A.PREP)())(T), D = T.ZINT.bau, i = de('bau')[0], o = L[i], lista = D.listas[o.v]; zera(i);
    // sorteio puro: 400 vezes, sempre da lista e nunca o que a pessoa tem
    p.inv.primary = 'stakeout'; p.inv.secondary = 'ak74u'; p.inv.monkey = 3; const vistos = new Set(); let fora = 0;
    for (let k = 0; k < 400; k++) { const w = T.zintBauSorteia(p, o.v); vistos.add(w); if (!(w in lista) || ['stakeout', 'ak74u', 'monkey'].includes(w)) fora++; }
    p.inv.primary = 'm1911'; p.inv.secondary = null; p.inv.monkey = 0;
    poe(p, ...frente(i)); p.money = D.custo - 1; T.srvZUse(p, { k: 'zint', id: i }); const pobre = T.Z.zint[i].st;
    p.money = 9000; T.srvZUse(p, { k: 'zint', id: i, w: 'raygun', arma: 'raygun' }); const gasto = 9000 - p.money, gira = T.Z.zint[i].st, meu = T.ZC.zint[i].meu;
    // outro jogador: não pega a oferta de quem pagou
    const { c, q } = (new Function('return ' + A.FALSO)())(T); poe(q, ...frente(i, 1.5)); q.money = 9000;
    T.sim(D.giraS + .1); const oferta = T.Z.zint[i].st, cli = T.ZC.zint[i].st; T.zInteract(0); const prompt = T.ZC.act?.txt;
    c.out.length = 0; T.srvOnData(c, { t: 'use', k: 'zint', id: i }); const roubo = T.Z.zint[i].st, errOutro = c.out.find(m => m.t === 'err')?.txt, qGasto = 9000 - q.money;
    const w = oferta.slice(7); T.srvZUse(p, { k: 'zint', id: i }); T.sim(.05);
    const tem = w === 'monkey' ? p.inv.monkey === 3 : w === 'semtex' ? p.inv.semtex === 4 : w === 'clay' ? p.inv.clay === 2 : [p.inv.primary, p.inv.secondary, p.inv.third].includes(w);
    const m1 = p.money; T.srvZUse(p, { k: 'zint', id: i }); const denovo = m1 - p.money;
    // outra rodada: abre, a oferta some sem ninguém pegar
    T.Z.round++; T.ZC.round++; T.srvZUse(p, { k: 'zint', id: i }); T.sim(D.giraS + D.ofertaS + .2); const sumiu = T.Z.zint[i].st;
    // comprou a mesma arma na parede no meio tempo: pontos devolvidos
    T.Z.round++; T.ZC.round++; p.inv.primary = 'm1911'; p.inv.secondary = null; p.inv.monkey = 3; p.inv.semtex = 4; p.inv.clay = 2;
    const m2 = p.money; T.srvZUse(p, { k: 'zint', id: i }); T.sim(D.giraS + .1); const w2 = T.Z.zint[i].st.slice(7);
    if (w2) p.inv.secondary = w2; T.srvZUse(p, { k: 'zint', id: i }); const devolveu = m2 - p.money;
    p.inv.secondary = null; p.inv.semtex = 0; p.inv.clay = 0; T.srvDrop?.(c);
    return { fora, nVistos: vistos.size, nLista: Object.keys(lista).length - 3, pobre, gasto, custo: D.custo, gira, meu, oferta, cli, prompt, roubo, errOutro, qGasto, tem, w, denovo, sumiu, devolveu, w2 };
  }, { PREP, FALSO });
  assert.equal(r.fora, 0, 'sorteou fora da lista ou algo que a pessoa já tinha'); assert.equal(r.nVistos, r.nLista, `em 400 sorteios saíram ${r.nVistos} de ${r.nLista}`);
  assert.equal(r.pobre, 'pronto', 'abriu sem pontos'); assert.equal(r.gasto, r.custo); assert.equal(r.gira, 'gira'); assert.equal(r.meu, true, 'quem pagou não recebeu o "meu"');
  assert.match(r.oferta, /^oferta:/); assert.equal(r.cli, r.oferta); assert.match(r.prompt || '', /^Pegar /);
  assert.notEqual(r.w, 'raygun', 'o cliente escolheu a arma'); assert.equal(r.roubo, r.oferta, 'outro jogador pegou a oferta'); assert.match(r.errOutro || '', /outro jogador/); assert.equal(r.qGasto, 0);
  assert.ok(r.tem, `não entregou ${r.w}`); assert.equal(r.denovo, 0, 'abriu duas vezes na mesma rodada');
  assert.equal(r.sumiu, 'pronto', 'a oferta não expirou'); assert.ok(r.w2, 'segundo sorteio sem arma'); assert.equal(r.devolveu, 0, 'não devolveu os pontos de quem já tinha a arma');
});

test('sino: cobra, põe a isca no pé da torre (zumbi vai até lá), o macaco vence, a isca some no fim; recarga recusa e volta a pronto', { timeout: 90000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, L, de, poe, frente, zera, zumbi } = (new Function('return ' + PREP)())(T), D = T.ZINT.sino, i = de('sino')[0], o = L[i]; zera(i);
    const isca = [o.x + o.n[0] * D.iscaD, o.z + o.n[1] * D.iscaD];
    poe(p, ...frente(i)); p.money = D.custo - 1; T.srvZUse(p, { k: 'zint', id: i }); const pobre = T.Z.zint[i].st;
    p.money = 5000; T.srvZUse(p, { k: 'zint', id: i }); const gasto = 5000 - p.money; T.sim(.1); const lure = T.Z.lure && [...T.Z.lure];
    // jogador longe; zumbi a ~12 m da isca: anda para a isca, não para o jogador
    poe(p, ...T.ZD.spawns[0]); const z = zumbi(isca[0] + 9, isca[1] + 8); z.speed = 2.2; z.hp = z.maxHp = 1e6;
    const d0 = Math.hypot(z.body.pos.x - isca[0], z.body.pos.z - isca[1]), dp0 = Math.hypot(z.body.pos.x - p.pos[0], z.body.pos.z - p.pos[2]);
    T.sim(3); const d1 = Math.hypot(z.body.pos.x - isca[0], z.body.pos.z - isca[1]), dp1 = Math.hypot(z.body.pos.x - p.pos[0], z.body.pos.z - p.pos[2]);
    // macaco no ar: a isca é a dele
    T.spawnNade('h', 'monkey', [isca[0] + 20, 1, isca[1]], [0, 0, 0]); T.sim(.6); const macaco = T.Z.lure && [...T.Z.lure];
    T.sim(D.dura); const fim = T.Z.lure, st = T.Z.zint[i].st, cli = T.ZC.zint[i].st;
    const m0 = p.money; poe(p, ...frente(i)); T.srvZUse(p, { k: 'zint', id: i }); const recusa = m0 - p.money;
    T.sim(D.recarga); T.Z.zs.clear();
    return { pobre, gasto, custo: D.custo, lure, isca, d0, d1, dp0, dp1, macaco, fim, st, cli, recusa, volta: T.Z.zint[i].st };
  }, PREP);
  assert.equal(r.pobre, 'pronto', 'tocou sem pontos'); assert.equal(r.gasto, r.custo);
  assert.ok(r.lure && Math.hypot(r.lure[0] - r.isca[0], r.lure[1] - r.isca[1]) < .01, `isca fora do lugar: ${r.lure}`);
  assert.ok(r.d1 < r.d0 - 2, `o zumbi não foi até a isca: ${r.d0.toFixed(1)} -> ${r.d1.toFixed(1)}`);
  assert.ok(r.macaco && Math.hypot(r.macaco[0] - r.isca[0], r.macaco[1] - r.isca[1]) > 10, `com macaco no ar a isca devia ser a dele: ${r.macaco}`);
  assert.equal(r.fim, null, 'a isca não sumiu no fim'); assert.equal(r.st, 'recarga'); assert.equal(r.cli, 'recarga');
  assert.equal(r.recusa, 0, 'cobrou na recarga'); assert.equal(r.volta, 'pronto');
});

test('quem entra no meio (Vila): recebe a oferta do baú, o sino tocando e a munição; o cliente aplica sem precisar de evento', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, A) => {
    const { p, de, poe, frente, zera, energia } = (new Function('return ' + A.PREP)())(T), b = de('bau')[0], s = de('sino')[0], m = de('municao')[0], D = T.ZINT;
    for (const i of [b, s, m]) zera(i); energia(true); T.Z.round += 5; T.ZC.round += 5; p.money = 50000; p.inv.monkey = 0;
    poe(p, ...frente(b)); T.srvZUse(p, { k: 'zint', id: b }); T.sim(D.bau.giraS + .1);
    poe(p, ...frente(s)); T.srvZUse(p, { k: 'zint', id: s }); poe(p, ...frente(m)); T.srvZUse(p, { k: 'zint', id: m }); T.sim(.05);
    const { c } = (new Function('return ' + A.FALSO)())(T); T.sim(1.2); const zi = c.out.filter(x => x.t === 'state' && Array.isArray(x.z?.zi)).pop()?.z.zi;
    // cliente novo: zera o lado do cliente e aplica só o zi do host
    for (const i of [b, s, m]) { T.ZC.zint[i].st = 'pronto'; T.ZC.world.zint[i].holder && (T.ZC.world.zint[i].holder.visible = false); }
    T.zintSync(zi);
    const hb = T.ZC.world.zint[b].holder; T.srvDrop?.(c);
    return { host: [b, s, m].map(i => T.Z.zint[i].st), zi: zi && [b, s, m].map(i => zi[i]?.[0]), cli: [b, s, m].map(i => T.ZC.zint[i].st), arma: hb.visible && hb.children.length === 1 };
  }, { PREP, FALSO });
  assert.ok(r.zi, 'o mundo não foi para quem entrou');
  assert.deepEqual(r.zi.slice(0, 2), r.host.slice(0, 2)); assert.match(r.zi[0], /^oferta:/); assert.equal(r.zi[1], 'tocando'); assert.ok(['uso', 'pronto'].includes(r.zi[2]), `munição: ${r.zi[2]}`);
  assert.deepEqual(r.cli.slice(0, 2), r.zi.slice(0, 2)); assert.ok(r.arma, 'a arma da oferta não apareceu no baú de quem entrou');
  assert.deepEqual(J.erros, []);
});

test('Wunderfizz e armário de evidências (Sanatório): energia, limite de bebidas, nunca repete, só bebidas do mapa; quem entra no meio vê o giro', { timeout: 300000 }, async () => {
  await J.fechar(); J = await abrirJogo(); // um navegador por vez
  {
    await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 });
    const r = await noJogo(J.page, (T, PREP) => {
      if (T.Z.phase !== 'round') T.zStartRound(); T.sim(.2);
      const { p, L, de, poe, frente, energia, zera } = (new Function('return ' + PREP)())(T), D = T.ZINT.wunderfizz, i = de('wunderfizz')[0], bau = de('bau'), COL = T.COL();
      const res = { n: de('wunderfizz').length, bau: bau.map(k => L[k].v), col: COL.includes(T.ZC.world.zint[i].col) && bau.every(k => COL.includes(T.ZC.world.zint[k].col)) };
      zera(i); poe(p, ...frente(i)); energia(false); p.money = 9000; p.perks = []; T.srvZUse(p, { k: 'zint', id: i }); res.semEnergia = 9000 - p.money;
      energia(true); p.money = D.custo - 1; T.srvZUse(p, { k: 'zint', id: i }); res.pobre = p.perks.length;
      // limite: com ZMAXPERKS bebidas recusa sem cobrar
      p.perks = Object.keys(T.ZPERKS).slice(0, T.ZMAXPERKS); p.money = 9000; T.srvZUse(p, { k: 'zint', id: i }); res.limite = [9000 - p.money, p.perks.length];
      // nunca repete e só sai bebida do mapa: 60 compras partindo de bebidas sorteadas que a pessoa já tem
      const doMapa = new Set(T.ZD.perks.map(x => x.k)); let repetiu = 0, foraMapa = 0, cobrou = 0, n = 0;
      for (let k = 0; k < 60; k++) {
        const ja = [...doMapa].sort(() => Math.random() - .5).slice(0, (k % T.ZMAXPERKS)); p.perks = [...ja]; p.money = 9000; zera(i);
        T.srvZUse(p, { k: 'zint', id: i }); const nova = p.perks[p.perks.length - 1];
        if (p.perks.length !== ja.length + 1) continue; n++; cobrou += 9000 - p.money;
        if (ja.includes(nova)) repetiu++; if (!doMapa.has(nova)) foraMapa++;
        if (T.Z.zint[i].st !== 'gira:' + nova) repetiu += 100;
      }
      res.compras = n; res.repetiu = repetiu; res.foraMapa = foraMapa; res.media = cobrou / Math.max(1, n); res.custo = D.custo;
      // girando: fechada para os outros; quem entra no meio vê a garrafa girando; volta a pronto
      zera(i); p.perks = []; p.money = 9000; T.srvZUse(p, { k: 'zint', id: i }); const st = T.Z.zint[i].st; const m1 = p.money; p.perks = []; T.srvZUse(p, { k: 'zint', id: i }); res.girando = m1 - p.money;
      const E = T.ZC.world.zint[i]; T.ZC.zint[i].st = 'pronto'; E.gar.visible = false; T.zintSync(T.zWorldState().zi); res.sync = [T.ZC.zint[i].st === st, E.gar.visible];
      T.sim(D.giraS + .1); res.volta = [T.Z.zint[i].st, T.ZC.zint[i].st, E.gar.visible];
      // armário de evidências: abre, sorteia da lista do Sanatório e entrega
      const b = bau[0], lb = T.ZINT.bau.listas[L[b].v]; zera(b); poe(p, ...frente(b)); p.money = 9000; p.inv.monkey = 0; T.srvZUse(p, { k: 'zint', id: b }); T.sim(T.ZINT.bau.giraS + .1);
      const w = T.Z.zint[b].st.slice(7); res.evid = [9000 - p.money, w in lb]; T.srvZUse(p, { k: 'zint', id: b }); res.evidSt = T.Z.zint[b].st; p.perks = [];
      return res;
    }, PREP);
    assert.equal(r.n, 1); assert.deepEqual(r.bau, ['evidencias']); assert.ok(r.col, 'colisor fora do COL');
    assert.equal(r.semEnergia, 0, 'cobrou sem energia'); assert.equal(r.pobre, 0, 'deu bebida sem pontos');
    assert.deepEqual(r.limite, [0, 4], 'passou do limite de bebidas ou cobrou');
    assert.ok(r.compras >= 50, `poucas compras válidas: ${r.compras}`); assert.equal(r.repetiu, 0, 'repetiu bebida ou o estado não mostra a sorteada'); assert.equal(r.foraMapa, 0, 'deu bebida que o mapa não tem');
    assert.equal(r.media, r.custo);
    assert.equal(r.girando, 0, 'cobrou com a Wunderfizz girando'); assert.deepEqual(r.sync, [true, true], 'quem entrou no meio não vê o giro');
    assert.deepEqual(r.volta, ['pronto', 'pronto', false]);
    assert.equal(r.evid[0], 1000); assert.ok(r.evid[1], 'o armário sorteou fora da lista do Sanatório'); assert.equal(r.evidSt, 'pronto');
    assert.deepEqual(J.erros, []);
  }
});
