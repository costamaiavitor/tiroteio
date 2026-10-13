// Terminais com lore (Onda 2, O2-C07; docs/overhaul/interativos.md §1.5): F perto abre o painel de leitura no HUD.
// Regras conferidas: F longe não abre; perto, o host anota quem leu (E.lidos, uma vez por jogador) e responde só a ele (sendTo,
// não broadcast); não dá pontos; o estado global continua 'pronto' (quem entra no meio não abre nada); o painel fecha com F,
// Esc, andando e sozinho no fim do tempo; os textos (lore oficial, lore.md §7; conferidos com a lore em tests/lore.test.mjs) cabem no limite. Sanatório (6) e Vila (4).
// Rodar: pnpm test (todos) ou node --test tests/terminais-zumbi.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); }, { timeout: 120000 });
after(async () => { await J?.fechar(); });

// cena: rodada sem zumbi novo, jogador num ponto; terminais do mapa e um ponto na frente de cada um
const PREP = `(T => {
  const p = T.S.players.get('h'), L = T.ZD.zint, term = L.map((o, i) => i).filter(i => L[i].t === 'terminal');
  const poe = (q, x, z) => { q.pos = [x, 0, z]; if (q.id === 'h') T.me.pos.set(x, 0, z); };
  const frente = (i, d = 1.2) => [L[i].x + L[i].n[0] * d, L[i].z + L[i].n[1] * d];
  T.Z.toSpawn = 50; T.Z.spawnT = 1e12; T.Z.zs.clear();
  return { p, L, term, poe, frente };
})`;
const visivel = () => J.page.evaluate(() => { const el = document.getElementById('zlore'); return !!el && !el.classList.contains('hidden'); });

test('terminal: Sanatório monta 6 (colisor no COL, estado pronto, textos no limite, sem pontos na auditoria)', { timeout: 180000 }, async () => {
  await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 });
  const r = await noJogo(J.page, T => {
    if (T.Z.phase !== 'round') T.zStartRound(); T.sim(.2);
    const L = T.ZD.zint, E = T.ZC.world.zint, COL = T.COL(), D = T.ZINT.terminal, ix = L.map((o, i) => i).filter(i => L[i].t === 'terminal');
    return { n: ix.length, ids: ix.map(i => L[i].id), col: ix.every(i => COL.includes(E[i].col) && E[i].col.maxY === E[i].h),
      txt: ix.every(i => { const t = T.ZINT_TERM_TXT[L[i].id]; return t && t.txt.length <= D.maxTxt && t.titulo.length > 0; }),
      vis: ix.every(i => T.ZINT_TERM_VIS[L[i].v]?.est === 'san'), st: ix.every(i => T.Z.zint[i].st === 'pronto' && T.ZC.zint[i].st === 'pronto'),
      zi: T.zWorldState().zi.length === L.length, aud: T.zintAud().filter(a => a.tipo === 'terminal').every(a => a.preco === 0 && a.forca0 === 1 && a.corpo) };
  });
  assert.equal(r.n, 6); assert.equal(new Set(r.ids).size, 6, 'id repetido');
  assert.ok(r.col, 'colisor fora do COL'); assert.ok(r.txt, 'texto faltando ou acima do limite'); assert.ok(r.vis, 'variante da Vila no Sanatório');
  assert.ok(r.st, 'estado inicial não é pronto'); assert.ok(r.zi); assert.ok(r.aud, 'auditoria: preço/força/corpo');
});

test('terminal: F longe não abre; perto abre o painel com o texto, anota quem leu uma vez e não dá pontos', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, L, term, poe, frente } = (new Function('return ' + PREP)())(T), i = term[0], D = T.ZINT.terminal;
    T.zintLoreFecha(false); const m0 = p.money;
    poe(p, ...frente(i, D.srvR + .6)); T.srvZUse(p, { k: 'zint', id: i }); const longe = T.ZLORE.i;
    poe(p, ...frente(i)); T.zInteract(0); const prompt = T.ZC.act?.k === 'zint' && T.ZC.act.id === i ? T.ZC.act.txt : null;
    T.srvZUse(p, { k: 'zint', id: i }); const aberto = T.ZLORE.i, el = document.getElementById('zlore');
    const txt = el?.querySelector('.zlx').textContent, titulo = el?.querySelector('#zloreT').textContent;
    T.zInteract(0); const promptAberto = T.ZC.act?.id === i && T.ZC.act?.k === 'zint';
    T.srvZUse(p, { k: 'zint', id: i }); // de novo: o registro não duplica
    return { longe, prompt, aberto, i, txt, titulo, esperado: T.ZINT_TERM_TXT[L[i].id], lidos: [...(T.Z.zint[i].lidos || [])], ganho: p.money - m0,
      srv: T.Z.zint[i].st, cli: T.ZC.zint[i].st, promptAberto, quem: T.zintQuemLeu()[L[i].id], local: T.zintLoreLidos().includes(L[i].id), role: el?.getAttribute('role') };
  }, PREP);
  assert.equal(r.longe, -1, 'F de longe abriu'); assert.ok(r.prompt, 'sem prompt perto do terminal');
  assert.equal(r.aberto, r.i, 'F perto não abriu'); assert.equal(await visivel(), true);
  assert.equal(r.txt, r.esperado.txt); assert.equal(r.titulo, r.esperado.titulo); assert.equal(r.role, 'dialog');
  assert.equal(r.promptAberto, false, 'o prompt do F continua com o painel aberto');
  assert.deepEqual(r.lidos, ['h']); assert.deepEqual(r.quem, ['h']); assert.ok(r.local, 'registro local (zintLoreLidos) sem o id');
  assert.equal(r.ganho, 0, 'ler deu pontos'); assert.equal(r.srv, 'pronto'); assert.equal(r.cli, 'pronto');
});

test('terminal: fecha com F (sem mandar uso ao host), Esc, andando e sozinho no fim do tempo; parado continua aberto', { timeout: 60000 }, async () => {
  const abre = () => noJogo(J.page, (T, PREP) => { const { p, term, poe, frente } = (new Function('return ' + PREP)())(T); poe(p, ...frente(term[1])); T.srvZUse(p, { k: 'zint', id: term[1] }); return T.ZLORE.i === term[1]; }, PREP);
  assert.ok(await abre());
  const f = await noJogo(J.page, T => { const ev = new KeyboardEvent('keydown', { code: 'KeyF', bubbles: true, cancelable: true });
    document.body.dispatchEvent(ev); return { i: T.ZLORE.i, cancelado: ev.defaultPrevented }; });
  assert.equal(f.i, -1, 'F não fechou'); assert.equal(f.cancelado, true); assert.equal(await visivel(), false);
  assert.ok(await abre());
  await J.page.evaluate(() => document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true })));
  assert.equal(await noJogo(J.page, T => T.ZLORE.i), -1, 'Esc não fechou');
  assert.ok(await abre());
  const andar = await noJogo(J.page, T => { T.sim(1); const parado = T.ZLORE.i; const d = T.ZINT.terminal.fechaAndar + .2, o = T.ZD.zint[T.ZLORE.i];
    T.me.pos.x += -o.n[1] * d; T.me.pos.z += o.n[0] * d; T.sim(.1); return { parado, depois: T.ZLORE.i }; });
  assert.notEqual(andar.parado, -1, 'fechou parado antes do tempo'); assert.equal(andar.depois, -1, 'andando não fechou');
  assert.ok(await abre());
  const tempo = await noJogo(J.page, T => { const D = T.ZINT.terminal, o = T.ZD.zint[T.ZLORE.i], s = Math.max(D.textoS, T.ZINT_TERM_TXT[o.id].txt.length * D.porLetra);
    T.sim(s - .5); const antes = T.ZLORE.i; T.sim(.7); return { antes, depois: T.ZLORE.i }; });
  assert.notEqual(tempo.antes, -1, 'fechou antes do tempo de leitura'); assert.equal(tempo.depois, -1, 'não fechou sozinho');
});

test('terminal: outro jogador lê e só ele recebe o painel (sendTo); quem entra no meio recebe os terminais prontos', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { L, term, poe, frente } = (new Function('return ' + PREP)())(T), i = term[2];
    const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; }, peerConnection: null };
    T.srvOnData(c, { t: 'join', v: 2, pv: 7, name: 'Leitor' }); const q = T.S.players.get(c.pid); if (!q) return { semJogador: true };
    T.sim(1.2); const zi = c.out.find(m => m.t === 'state' && Array.isArray(m.z?.zi))?.z.zi; // o mundo vai no 'state' (zWorldState)
    q.alive = true; q.downed = false; poe(q, ...frente(i)); c.out.length = 0; T.zintLoreFecha(false);
    T.srvOnData(c, { t: 'use', k: 'zint', id: i });
    const msgs = c.out.filter(m => m.t === 'zint'), host = T.ZLORE.i, lidos = [...(T.Z.zint[i].lidos || [])];
    T.srvDrop?.(c);
    return { msgs, host, lidos, pid: c.pid, i, zi: zi && term.map(k => zi[k]?.[0]) };
  }, PREP);
  assert.ok(!r.semJogador, 'o jogador falso não entrou');
  assert.deepEqual(r.msgs, [{ t: 'zint', i: r.i, st: 'lido' }]); assert.equal(r.host, -1, 'o painel abriu no host (devia ser só para quem leu)');
  assert.deepEqual(r.lidos, [r.pid]);
  assert.ok(r.zi && r.zi.every(s => s === 'pronto'), `zi de quem entrou: ${r.zi}`);
  // cliente novo aplicando o mundo do host: nada abre
  const s = await noJogo(J.page, T => { T.zintLoreFecha(false); T.zintSync(T.zWorldState().zi); return T.ZLORE.i; });
  assert.equal(s, -1);
});

test('terminal: Vila monta 4 (quadro, diário, rádio) e o F abre o painel no estilo da Vila', { timeout: 240000 }, async () => {
  await J.page.evaluate(() => { const T = window.__T; T.zintLoreFecha?.(false); });
  await J.fechar(); J = await abrirJogo();
  await criarSala(J.page, { mode: 'zombies', map: 'vila', zdiff: 1 });
  const r = await noJogo(J.page, (T, PREP) => {
    if (T.Z.phase !== 'round') T.zStartRound(); T.sim(.2);
    const { p, L, term, poe, frente } = (new Function('return ' + PREP)())(T), COL = T.COL(), E = T.ZC.world.zint;
    const vs = [...new Set(term.map(i => L[i].v))].sort(), col = term.every(i => COL.includes(E[i].col));
    poe(p, ...frente(term[0])); T.srvZUse(p, { k: 'zint', id: term[0] });
    return { n: term.length, vs, col, aberto: T.ZLORE.i === term[0], m: document.getElementById('zlore')?.dataset.m };
  }, PREP);
  assert.equal(r.n, 4); assert.deepEqual(r.vs, ['diario', 'quadro', 'radio']); assert.ok(r.col);
  assert.equal(r.aberto, true); assert.equal(r.m, 'vila');
  assert.deepEqual(J.erros, []);
});
