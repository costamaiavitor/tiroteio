// Interruptores e atalhos (Onda 2, O2-C08; docs/overhaul/interativos.md §1.4 e §1.6).
// Regras conferidas: o vão do atalho é furado na parede (só a porta tapa); a porta trancada recusa (host) e mostra o texto (F);
// o interruptor precisa de energia (Sanatório), é pago, só vale de perto e uma vez, destrava a porta, acende a ala e libera a
// armadilha elétrica dela (O2-C06); o atalho só
// abre com as duas áreas já ativas; aberto, o campo dos zumbis passa pelo vão (caminho bem mais curto); quem entra no meio recebe
// portas e interruptores; nenhum softlock (toda área, trava e lado de atalho tem caminho sem atalho). Sanatório e Vila.
// Rodar: pnpm test (todos) ou node --test tests/atalhos-zumbi.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); }, { timeout: 120000 });
after(async () => { await J?.fechar(); });

// cena: rodada sem zumbi novo; ajudas para pôr o jogador num ponto, abrir porta comum (host + cliente) e ligar a energia
const PREP = `(T => {
  const p = T.S.players.get('h'), L = T.ZD.zint, D = T.ZD.doors;
  const poe = (x, z) => { p.pos = [x, 0, z]; T.me.pos.set(x, 0, z); };
  const abre = id => { T.Z.doors.add(id); T.broadcast({ t: 'zdoor', id }); T.zBuildWalk(); };
  const energia = () => { if (!T.Z.power) { T.Z.power = true; T.broadcast({ t: 'zpower' }); } };
  const porta = id => D.find(d => d.id === id), ii = id => L.findIndex(o => o.t === 'interruptor' && o.id === id);
  const frente = (o, d = 1) => [o.x + o.n[0] * d, o.z + o.n[1] * d];
  const lado = (d, s, k = 1.6) => d.axis === 'x' ? [d.x, d.z + s * k] : [d.x + s * k, d.z];
  const prompt = () => { T.zInteract(0); return T.ZC.act; };
  T.Z.toSpawn = 50; T.Z.spawnT = 1e12; T.Z.zs.clear();
  return { p, L, D, poe, abre, energia, porta, ii, frente, lado, prompt };
})`;
// vão furado: nada do COL (além do colisor da própria porta) no meio do vão até 3 m de altura
const VAO = `((T, d) => { const o = T.ZC.world.doors.get(d.id), ax = d.axis === 'x', hx = ax ? 1.6 : .3, hz = ax ? .3 : 1.6;
  return !T.COL().some(b => b !== o.col && b.maxY > .1 && b.minY < 3 && b.maxX > d.x - hx && b.minX < d.x + hx && b.maxZ > d.z - hz && b.minZ < d.z + hz); })`;

test('atalho: Sanatório monta 3 portas corta-fogo (vão furado, colisor no COL) e 3 interruptores desligados', { timeout: 180000 }, async () => {
  await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 });
  const r = await noJogo(J.page, (T, VAO) => {
    if (T.Z.phase !== 'round') T.zStartRound(); T.sim(.2);
    const vao = new Function('return ' + VAO)(), D = T.ZD.doors.filter(d => d.atalho && !d.secreta), L = T.ZD.zint, I = L.map((o, i) => i).filter(i => L[i].t === 'interruptor'), COL = T.COL();
    return { ids: D.map(d => d.id), kinds: [...new Set(D.map(d => d.kind))], col: D.every(d => COL.includes(T.ZC.world.doors.get(d.id)?.col)), vao: D.map(d => vao(T, d)),
      ints: I.map(i => L[i].id), st: I.every(i => T.Z.zint[i].st === 'pronto' && T.ZC.zint[i].st === 'pronto'), icol: I.every(i => COL.includes(T.ZC.world.zint[i].col) && T.ZC.world.zint[i].col.maxY === T.ZC.world.zint[i].h),
      travas: D.filter(d => d.trava).map(d => d.trava), aud: T.zintAud().filter(a => a.tipo === 'interruptor').every(a => a.forca0 === 2 && a.corpo) };
  }, VAO);
  assert.deepEqual(r.ids, ['atalho-DG', 'atalho-EK', 'atalho-r12r13']); assert.deepEqual(r.kinds, ['cortafogo']);
  assert.ok(r.col, 'colisor da porta fora do COL'); assert.deepEqual(r.vao, [true, true, true], 'parede no meio do vão');
  assert.deepEqual(r.ints, ['ala-oeste', 'ala-leste', 'ala-anel']); assert.ok(r.st, 'interruptor não começa desligado');
  assert.ok(r.icol, 'colisor do interruptor'); assert.deepEqual(r.travas, ['ala-oeste', 'ala-leste']); assert.ok(r.aud);
});

test('atalho: porta trancada recusa e mostra o texto; interruptor sem energia, longe ou sem pontos não liga; ligado destrava e acende a ala', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, L, poe, energia, porta, ii, frente, lado, prompt } = (new Function('return ' + PREP)())(T), d = porta('atalho-DG'), i = ii('ala-oeste'), o = L[i];
    p.money = 5000; const out = {};
    poe(...lado(d, 1)); const a = prompt(); out.trancada = { k: a?.k, id: a?.id, ok: a?.ok, txt: a?.txt };
    T.srvZUse(p, { k: 'door', id: d.id }); out.trancadaSrv = { aberta: T.Z.doors.has(d.id), m: p.money, toast: document.getElementById('toast')?.textContent };
    poe(...frente(o)); const b = prompt(); out.semEnergia = { k: b?.k, ok: b?.ok, txt: b?.txt };
    T.srvZUse(p, { k: 'zint', id: i }); out.semEnergiaSrv = [T.Z.zint[i].st, p.money];
    energia(); const c = prompt(); out.comEnergia = { ok: c?.ok, cost: c?.cost, txt: c?.txt };
    const ti = T.ZD.traps.findIndex(t => t.ala === 'oeste'), tr = T.ZD.traps[ti], usaTrap = () => { poe(tr.sx + tr.n[0], tr.sz + tr.n[1]); const a = prompt(); const m0 = p.money; T.srvZUse(p, { k: 'trap', id: ti }); return { txt: a?.txt, ok: a?.ok, st: T.Z.traps[ti].st, gasto: m0 - p.money }; };
    out.trapAntes = usaTrap(); poe(...frente(o));
    poe(...frente(o, T.ZINT.interruptor.srvR + .5)); T.srvZUse(p, { k: 'zint', id: i }); out.longe = T.Z.zint[i].st;
    poe(...frente(o)); p.money = 100; T.srvZUse(p, { k: 'zint', id: i }); out.pobre = [T.Z.zint[i].st, p.money];
    p.money = 5000; T.srvZUse(p, { k: 'zint', id: i }); out.liga = [T.Z.zint[i].st, T.ZC.zint[i].st, p.money, T.zintAla('oeste'), T.zintAlaCli('oeste'), T.zintAla('leste')];
    T.srvZUse(p, { k: 'zint', id: i }); out.deNovo = p.money; out.trapDepois = usaTrap(); p.money = 4500; poe(...frente(o));
    out.alasTraps = T.ZD.traps.map(t => t.ala || null); out.promptLigado = prompt()?.k === 'zint' && prompt()?.id === i;
    T.sim(.1); const Wd = T.ZC.world; out.lampadas = Wd.lights.filter(l => l.ala === 'oeste').length; out.alas = [...Wd.alas];
    out.outras = Wd.lights.filter(l => l.ala === 'leste').length; // a ala leste continua apagada (falhando) com a energia ligada
    return out;
  }, PREP);
  assert.equal(r.trancada.k, 'door'); assert.equal(r.trancada.ok, false); assert.match(r.trancada.txt, /Trancada/);
  assert.equal(r.trancadaSrv.aberta, false, 'o host abriu a porta trancada'); assert.equal(r.trancadaSrv.m, 5000, 'cobrou a porta trancada'); assert.match(r.trancadaSrv.toast, /Trancada/);
  assert.equal(r.semEnergia.ok, false); assert.match(r.semEnergia.txt, /sem energia/); assert.deepEqual(r.semEnergiaSrv, ['pronto', 5000]);
  assert.notEqual(r.comEnergia.ok, false); assert.equal(r.comEnergia.cost, 500); assert.match(r.comEnergia.txt, /Ligar a Ala Oeste \[500\]/);
  assert.equal(r.longe, 'pronto', 'ligou de longe'); assert.deepEqual(r.pobre, ['pronto', 100], 'ligou sem pontos');
  assert.deepEqual(r.liga, ['ligado', 'ligado', 4500, true, true, false]); assert.equal(r.deNovo, 4500, 'cobrou de novo'); assert.equal(r.promptLigado, false);
  assert.equal(r.trapAntes.ok, false); assert.match(r.trapAntes.txt, /ligue a Ala Oeste/); assert.equal(r.trapAntes.st, 'idle'); assert.equal(r.trapAntes.gasto, 0);
  assert.equal(r.trapDepois.st, 'on', 'armadilha da ala não ligou depois do interruptor'); assert.ok(r.trapDepois.gasto > 0);
  assert.deepEqual(r.alasTraps, [null, 'oeste', 'leste', 'anel']); // a do começo (Recepção/Enfermaria) não é de ala
  assert.ok(r.lampadas >= 3, `lâmpadas da ala oeste: ${r.lampadas}`); assert.deepEqual(r.alas, ['oeste']); assert.ok(r.outras >= 2);
});

test('atalho: destravado, só abre com as duas áreas ativas; aberto, cobra, tira o colisor e o campo dos zumbis passa pelo vão', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, poe, abre, porta, lado, prompt } = (new Function('return ' + PREP)())(T), d = porta('atalho-DG'), out = {};
    p.money = 5000; poe(...lado(d, 1));
    const a = prompt(); out.fechada = { ok: a?.ok, txt: a?.txt }; T.srvZUse(p, { k: 'door', id: d.id }); out.fechadaSrv = [T.Z.doors.has(d.id), p.money];
    abre('AF'); abre('FD'); abre('FG'); // as duas áreas (Laboratório e Refeitório) ficam ativas pelo caminho longo
    const b = prompt(); out.aberta = { ok: b?.ok, cost: b?.cost, txt: b?.txt };
    const dist = () => { const [x, z] = lado(d, -3); T.zFlow([[x, z]]); const [gx, gz] = lado(d, 3.5); return T.FF.dist[T.ffCell(gx, gz)] / 5; };
    out.antes = dist();
    const col = T.ZC.world.doors.get(d.id).col, c = T.ffCell(d.x, d.z); out.celAntes = T.FF.walk[c];
    T.srvZUse(p, { k: 'door', id: d.id });
    out.depois = [T.Z.doors.has(d.id), T.ZC.doors.has(d.id), p.money, T.COL().includes(col), T.FF.walk[c], T.Z.ffT];
    out.dDepois = dist(); out.ativas = [...T.zActive()].sort();
    return out;
  }, PREP);
  assert.equal(r.fechada.ok, false); assert.match(r.fechada.txt, /Atalho: abra antes/); assert.deepEqual(r.fechadaSrv, [false, 5000]);
  assert.notEqual(r.aberta.ok, false); assert.equal(r.aberta.cost, 750); assert.match(r.aberta.txt, /corta-fogo \[750\]/);
  assert.equal(r.celAntes, 0, 'o vão já estava andável com a porta fechada');
  assert.deepEqual(r.depois, [true, true, 4250, false, 1, 0]);
  assert.ok(r.antes > 20 && r.dDepois < 12 && r.dDepois < r.antes / 2, `caminho dos zumbis: ${r.antes} m antes, ${r.dDepois} m depois`);
  assert.deepEqual(r.ativas, ['A', 'D', 'F', 'G']);
});

test('atalho: quem entra no meio recebe a porta aberta e o interruptor ligado (e o mundo do cliente aplica sem efeito)', { timeout: 120000 }, async () => {
  const r = await noJogo(J.page, T => {
    const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; }, peerConnection: null };
    T.srvOnData(c, { t: 'join', v: 2, pv: 9, name: 'Novo' }); if (!T.S.players.get(c.pid)) return { semJogador: true };
    T.sim(1.2); const z = c.out.filter(m => m.t === 'state' && m.z).pop()?.z; T.srvDrop?.(c);
    const L = T.ZD.zint, i = L.findIndex(o => o.id === 'ala-oeste');
    const st = T.zWorldState(); T.buildMap('sanatorio'); // cliente novo: mundo montado do zero (portas fechadas, interruptores desligados)
    const antes = [T.ZC.doors.has('atalho-DG'), T.ZC.zint[i].st, T.ZC.world.alas?.size ?? 0];
    T.zSyncWorld(st); T.zBuildWalk();
    const d = T.ZC.world.doors.get('atalho-DG');
    return { d: z?.d?.includes('atalho-DG'), zi: z?.zi?.[i], antes, depois: [T.ZC.doors.has('atalho-DG'), T.ZC.zint[i].st, [...T.ZC.world.alas]], col: T.COL().includes(d.col) };
  });
  assert.ok(!r.semJogador, 'o jogador falso não entrou');
  assert.equal(r.d, true, 'a porta aberta não foi no estado de quem entrou'); assert.deepEqual(r.zi, ['ligado', 0]);
  assert.deepEqual(r.antes, [false, 'pronto', 0]);
  assert.deepEqual(r.depois, [true, 'ligado', ['oeste']]); assert.equal(r.col, false, 'o colisor da porta continuou no COL');
});

// nenhum softlock: com os atalhos fora do grafo, toda área continua alcançável; o interruptor de cada trava fica numa área
// alcançável sem a porta que ele destrava; os dois lados de cada atalho têm outro caminho
const GRAFO = T => {
  const D = T.ZD.doors, start = T.ZD.start || 'A', alc = sem => { const s = new Set([start]); let mud = true; while (mud) { mud = false; for (const d of D) if (!sem(d) && d.rooms.some(r => s.has(r)) && !d.rooms.every(r => s.has(r))) { d.rooms.forEach(r => s.add(r)); mud = true; } } return s; };
  const todas = alc(() => false), semAtalho = alc(d => d.atalho), L = T.ZD.zint;
  const travas = D.filter(d => d.trava).map(d => { const o = L.find(q => q.t === 'interruptor' && q.id === d.trava); const z = o && T.ZD.zoneAt?.(o.x + o.n[0], o.z + o.n[1]); return { id: d.id, z, ok: !!z && semAtalho.has(z) }; });
  return { todas: [...todas].sort(), semAtalho: [...semAtalho].sort(), travas, lados: D.filter(d => d.atalho).every(d => d.rooms.every(r => semAtalho.has(r))) };
};
test('atalho: nenhum softlock no Sanatório (grafo sem atalhos igual, travas alcançáveis antes)', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, GRAFO);
  assert.deepEqual(r.semAtalho, r.todas); assert.ok(r.lados); assert.equal(r.travas.length, 2); for (const t of r.travas) assert.ok(t.ok, `trava de ${t.id} atrás dela (${t.z})`);
});

test('atalho: Vila monta 3 cercas e a porteira; a tranca é grátis e sem energia; a porteira só abre depois dela; sem softlock', { timeout: 240000 }, async () => {
  await J.fechar(); J = await abrirJogo();
  await criarSala(J.page, { mode: 'zombies', map: 'vila', zdiff: 1 });
  const r = await noJogo(J.page, (T, a) => {
    if (T.Z.phase !== 'round') T.zStartRound(); T.sim(.2);
    const { p, L, poe, abre, porta, ii, frente, lado, prompt } = (new Function('return ' + a.PREP)())(T), vao = new Function('return ' + a.VAO)(), out = {};
    const D = T.ZD.doors.filter(d => d.atalho && !d.secreta); out.kinds = D.map(d => d.id + ':' + d.kind); out.vao = D.map(d => vao(T, d));
    const d = porta('atalho-CG'), i = ii('porteira-estacao'), o = L[i]; p.money = 5000;
    abre('AC'); abre('BC'); abre('BF'); abre('FG'); // Fazenda e Estação ativas pelo caminho longo
    poe(...lado(d, -1)); out.trancada = prompt()?.txt; T.srvZUse(p, { k: 'door', id: d.id }); out.trancadaSrv = T.Z.doors.has(d.id);
    poe(...frente(o)); const b = prompt(); out.tranca = { ok: b?.ok, cost: b?.cost, txt: b?.txt };
    T.srvZUse(p, { k: 'zint', id: i }); out.solta = [T.Z.zint[i].st, p.money, T.Z.power];
    poe(...lado(d, -1)); const c = prompt(); out.porteira = { ok: c?.ok, txt: c?.txt };
    T.srvZUse(p, { k: 'door', id: d.id }); out.aberta = [T.Z.doors.has(d.id), p.money];
    T.sim(1.2); out.afundou = T.ZC.world.doors.get(d.id).g.position.y < -1;
    const bf = porta('atalho-BF'); poe(...lado(bf, 1)); out.cerca = prompt()?.txt; T.srvZUse(p, { k: 'door', id: bf.id }); out.cercaAberta = [T.Z.doors.has(bf.id), p.money]; // B e F já ativas
    return out;
  }, { PREP, VAO });
  assert.deepEqual(r.kinds, ['atalho-BF:cerca', 'atalho-CG:porteira', 'atalho-EH:cerca', 'atalho-DI:cerca']); assert.deepEqual(r.vao, [true, true, true, true]);
  assert.match(r.trancada, /Trancada/); assert.equal(r.trancadaSrv, false);
  assert.notEqual(r.tranca.ok, false); assert.ok(!r.tranca.cost); assert.match(r.tranca.txt, /tranca/);
  assert.deepEqual(r.solta, ['ligado', 5000, false]);
  assert.notEqual(r.porteira.ok, false); assert.match(r.porteira.txt, /porteira \[500\]/);
  assert.deepEqual(r.aberta, [true, 4500]); assert.ok(r.afundou, 'a porteira não afundou');
  assert.match(r.cerca, /Derrubar a cerca \[500\]/); assert.deepEqual(r.cercaAberta, [true, 4000]);
  const g = await noJogo(J.page, GRAFO);
  assert.deepEqual(g.semAtalho, g.todas); assert.ok(g.lados); assert.equal(g.travas.length, 1); assert.ok(g.travas[0].ok, `tranca atrás da porteira (${g.travas[0].z})`);
  assert.deepEqual(J.erros, []);
});
