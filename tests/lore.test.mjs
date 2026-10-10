// Lore em jogo (Onda 3, O3-D04; docs/overhaul/lore.md §7–§10 e campanha.md §4.2): textos dos terminais e das tabelas da campanha
// iguais aos da lore.md e dentro do limite; nenhum id repetido; todo id citado no campanha.md existe; o tipo ZINT 'nota' (só com a
// campanha) abre e fecha como o terminal; os sons sintetizados (rádio, apito, coro, papel) saem com som e sem NaN.
// As notas de verdade são posicionadas pelos agentes dos atos (D10/D12/D14): aqui entram 3 notas de TESTE, empurradas no
// ZINT_MAPA.sanatorio antes de criar a sala (fora dos dados do mapa) e tiradas no fim. O3-D12: as notas de teste têm teste: 1 (as de
// verdade do Sanatório usam os mesmos ids): o teste conta e tira só as dele.
// Rodar: pnpm test (todos) ou node --test tests/lore.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LORE = fs.readFileSync(path.join(RAIZ, 'docs/overhaul/lore.md'), 'utf8');
const CAMPANHA = fs.readFileSync(path.join(RAIZ, 'docs/overhaul/campanha.md'), 'utf8');
const HTML = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
const TABELAS = ['ZINT_TERM_TXT', 'CAMP_NOTA_TXT', 'CAMP_RADIO_TXT', 'CAMP_FALA_TXT', 'CAMP_CENA_TXT'];
// tabelas como estão na lore.md (blocos ```js prontos para colar)
const daLore = Object.fromEntries([...LORE.matchAll(/```js\n(const (\w+) = \{[\s\S]*?\n\};)\n```/g)].map(m => [m[2], new Function(m[1] + `; return ${m[2]};`)()]));
// chaves do literal no código (o objeto do JS esconde chave repetida: a última vence sem aviso)
const chavesFonte = nome => { const i = HTML.indexOf(`const ${nome} = {`); assert.ok(i >= 0, `${nome} não está no index.html`); const f = HTML.indexOf('\n};', i);
  return [...HTML.slice(i, f).matchAll(/^\s*'([^']+)':/gm)].map(m => m[1]); };
// a única diferença combinada: a fala 'cabo-ferido' (citada no campanha.md §4.3) usa a frase do rádio r2-escolta-ferido
const EXTRA = { CAMP_FALA_TXT: ['cabo-ferido'] };

let J, TAB;
before(async () => { J = await abrirJogo(); TAB = await noJogo(J.page, (T, ns) => Object.fromEntries(ns.map(n => [n, T[n]])), TABELAS); }, { timeout: 120000 });
after(async () => { await J?.fechar(); });

test('lore: as 5 tabelas do jogo são as da lore.md (só a fala cabo-ferido a mais, com a frase do rádio)', () => {
  assert.deepEqual(Object.keys(daLore).sort(), [...TABELAS].sort(), 'blocos js da lore.md');
  for (const n of TABELAS) {
    const extra = EXTRA[n] || [], jogo = Object.fromEntries(Object.entries(TAB[n]).filter(([k]) => !extra.includes(k)));
    assert.deepEqual(jogo, daLore[n], `${n} diferente da lore.md`);
    for (const k of extra) assert.ok(TAB[n][k], `${n}.${k} faltando`);
  }
  assert.equal(TAB.CAMP_FALA_TXT['cabo-ferido'].txt, TAB.CAMP_RADIO_TXT['r2-escolta-ferido'].txt);
  assert.equal(TAB.CAMP_FALA_TXT['cabo-ferido'].quem, 'NOGUEIRA');
});

test('lore: limites (160 letras por painel, linha e cartão; até 3 cartões por cena) e campos preenchidos', async () => {
  const lim = await noJogo(J.page, T => [T.ZINT.terminal.maxTxt, T.ZINT.nota.maxTxt]);
  assert.deepEqual(lim, [160, 160]);
  for (const n of ['ZINT_TERM_TXT', 'CAMP_NOTA_TXT']) for (const [id, v] of Object.entries(TAB[n])) {
    assert.ok(v.titulo?.length > 0 && v.txt?.length > 0, `${n}.${id} vazio`); assert.ok(v.txt.length <= 160, `${n}.${id}: ${v.txt.length} letras`);
  }
  for (const n of ['CAMP_RADIO_TXT', 'CAMP_FALA_TXT']) for (const [id, v] of Object.entries(TAB[n])) {
    assert.ok(v.quem?.length > 0 && v.txt?.length > 0, `${n}.${id} vazio`); assert.ok(v.txt.length <= 160, `${n}.${id}: ${v.txt.length} letras`);
  }
  for (const [id, c] of Object.entries(TAB.CAMP_CENA_TXT)) {
    assert.ok(Array.isArray(c) && c.length >= 1 && c.length <= 3, `cena ${id}: ${c.length} cartões`);
    for (const s of c) assert.ok(typeof s === 'string' && s.length > 0 && s.length <= 160, `cena ${id}: cartão com ${s.length} letras`);
  }
  assert.equal(Object.keys(TAB.ZINT_TERM_TXT).length, 10); assert.equal(Object.keys(TAB.CAMP_NOTA_TXT).length, 12); // lore.md §10.3: 22 documentos
});

test('lore: nenhum id repetido (no literal de cada tabela e entre terminais e notas, que dividem o registro tiroteio.lore)', () => {
  for (const n of TABELAS) { const k = chavesFonte(n); assert.equal(new Set(k).size, k.length, `${n}: id repetido ${k.filter((x, i) => k.indexOf(x) !== i)}`); assert.ok(k.length > 0); }
  const term = Object.keys(TAB.ZINT_TERM_TXT), notas = Object.keys(TAB.CAMP_NOTA_TXT);
  assert.deepEqual(term.filter(k => notas.includes(k)), []);
  assert.ok(notas.every(k => k.startsWith('n-')), 'nota sem o prefixo n-');
});

test('lore: todo id de texto citado no campanha.md existe na tabela certa (terminais pelos ids do mapa)', async () => {
  const qual = id => /^(r\d|ev)-/.test(id) ? 'CAMP_RADIO_TXT' : /^n-/.test(id) ? 'CAMP_NOTA_TXT' : /^c\d-/.test(id) ? 'CAMP_CENA_TXT'
    : /^(cabo|ten|fog|dir|carn)-/.test(id) ? 'CAMP_FALA_TXT' : /^(san|vila)-/.test(id) ? 'ZINT_TERM_TXT' : null;
  const ids = new Set([...CAMPANHA.matchAll(/[`']((?:r\d|ev|n|c\d|cabo|ten|fog|dir|carn)-[a-z0-9-]+|(?:san|vila)-[a-z]+)[`']/g)].map(m => m[1]));
  assert.ok(ids.size >= 45, `poucos ids achados no campanha.md: ${ids.size}`);
  const faltam = [...ids].filter(id => !TAB[qual(id)]?.[id]);
  assert.deepEqual(faltam, [], 'citados no campanha.md sem texto');
  // os terminais da tabela são os 10 do mapa (Vila 4 + Sanatório 6), sem sobra nem falta
  const doMapa = await noJogo(J.page, T => [...T.ZINT_MAPA.vila, ...T.ZINT_MAPA.sanatorio].filter(o => o.t === 'terminal').map(o => o.id).sort());
  assert.deepEqual(doMapa, Object.keys(TAB.ZINT_TERM_TXT).sort());
});

// notas de teste na Recepção do Sanatório (perto do nascimento): pregada e bilhete na parede oeste (à esquerda do terminal) (face em x = -8,495, a mesma
// do terminal da Recepção), papel no chão no meio da sala
const NOTAS = [
  { t: 'nota', v: 'pregada', id: 'n-enfermaria-dose', x: -8.495, z: 6.75, n: [1, 0], teste: 1 },
  { t: 'nota', v: 'bilhete', id: 'n-biblioteca-sono', x: -8.495, z: 8.6, n: [1, 0], teste: 1 },
  { t: 'nota', v: 'chao', id: 'n-torre-registro', x: -5.5, z: 4.25, n: [1, 0], ato: 3, teste: 1 },
];
const PREP = `(T => {
  const p = T.S.players.get('h'), L = T.ZD.zint, nota = L.map((o, i) => i).filter(i => L[i].t === 'nota' && L[i].teste);
  const poe = (q, x, z) => { q.pos = [x, 0, z]; if (q.id === 'h') T.me.pos.set(x, 0, z); };
  const frente = (i, d = 1.2) => [L[i].x + L[i].n[0] * d, L[i].z + L[i].n[1] * d];
  T.Z.toSpawn = 50; T.Z.spawnT = 1e12; T.Z.zs.clear();
  return { p, L, nota, poe, frente };
})`;
const visivel = () => J.page.evaluate(() => { const el = document.getElementById('zlore'); return !!el && !el.classList.contains('hidden'); });

test('nota: sem a campanha não existe (sem peças, sem prompt, F no host não abre) e o índice continua na lista', { timeout: 180000 }, async () => {
  await J.fechar(); J = await abrirJogo();
  await noJogo(J.page, (T, N) => { T.ZNOTA.forca = false; T.ZINT_MAPA.sanatorio.push(...N); }, NOTAS);
  await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 });
  const r = await noJogo(J.page, (T, PREP) => {
    if (T.Z.phase !== 'round') T.zStartRound(); T.sim(.2);
    const { p, L, nota, poe, frente } = (new Function('return ' + PREP)())(T), E = T.ZC.world.zint, m0 = p.money;
    poe(p, ...frente(nota[0])); T.zInteract(0); const prompt = T.ZC.act?.k === 'zint' && nota.includes(T.ZC.act.id);
    T.srvZUse(p, { k: 'zint', id: nota[0] });
    return { n: nota.length, ligada: T.zintNotaLigada(L[nota[0]]), pecas: nota.map(i => !!E[i]?.g), col: nota.map(i => E[i]?.col ?? null), prompt, aberto: T.ZLORE.i,
      lidos: T.Z.zint[nota[0]].lidos?.size || 0, ganho: p.money - m0, zi: T.zWorldState().zi.length === L.length, aud: T.zintAud().filter(a => a.tipo === 'nota').map(a => a.corpo ?? null).slice(-nota.length) };
  }, PREP);
  assert.equal(r.n, 3); assert.equal(r.ligada, false);
  assert.deepEqual(r.pecas, [false, false, false], 'peças montadas no clássico'); assert.deepEqual(r.col, [null, null, null]);
  assert.equal(r.prompt, false, 'prompt de nota no clássico'); assert.equal(r.aberto, -1); assert.equal(r.lidos, 0); assert.equal(r.ganho, 0);
  assert.ok(r.zi); assert.deepEqual(r.aud, [null, null, null]);
});

test('nota: ligada, monta as 3 variantes no primeiro quadro (sem colisor), respeita o ato e o F perto abre a janela do terminal com o texto', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { p, L, nota, poe, frente } = (new Function('return ' + PREP)())(T), E = T.ZC.world.zint, D = T.ZINT.nota, nCol = T.COL().length;
    T.ZNOTA.forca = true; T.sim(.1);
    const vs = nota.map(i => L[i].v), pecas = nota.map(i => !!E[i].g && E[i].corpo.visible), semCol = T.COL().length === nCol && nota.every(i => !E[i].col);
    const i = nota[0], m0 = p.money; T.zintLoreFecha(false);
    poe(p, ...frente(i, D.srvR + .6)); T.srvZUse(p, { k: 'zint', id: i }); const longe = T.ZLORE.i;
    poe(p, ...frente(i)); T.zInteract(0); const prompt = T.ZC.act?.k === 'zint' && T.ZC.act.id === i ? T.ZC.act.txt : null;
    T.srvZUse(p, { k: 'zint', id: i }); const el = document.getElementById('zlore');
    const aberto = T.ZLORE.i, txt = el?.querySelector('.zlx').textContent, titulo = el?.querySelector('#zloreT').textContent, m = el?.dataset.m, rot = el?.querySelector('.zlk').textContent;
    T.srvZUse(p, { k: 'zint', id: i }); // de novo: o registro não duplica
    return { vs, pecas, semCol, longe, prompt, aberto, i, txt, titulo, m, rot, esperado: T.CAMP_NOTA_TXT[L[i].id], verbo: T.ZINT_NOTA_VIS[L[i].v].verbo, rotV: T.ZINT_NOTA_VIS[L[i].v].rot,
      lidos: [...(T.Z.zint[i].lidos || [])], ganho: p.money - m0, srv: T.Z.zint[i].st, cli: T.ZC.zint[i].st, local: T.zintLoreLidos().includes(L[i].id), docs: T.campDocs(),
      aud: T.zintAud().filter(a => a.tipo === 'nota').every(a => a.preco === 0 && a.forca0 === 1 && a.nome === 'Nota' && /sem pontos/.test(a.efeito)) };
  }, PREP);
  assert.deepEqual(r.vs, ['pregada', 'bilhete', 'chao']); assert.deepEqual(r.pecas, [true, true, true], 'peças da nota não montaram ao ligar');
  assert.ok(r.semCol, 'nota entrou no COL');
  assert.equal(r.longe, -1, 'F de longe abriu'); assert.equal(r.prompt, r.verbo, 'prompt da nota');
  assert.equal(r.aberto, r.i, 'F perto não abriu'); assert.equal(await visivel(), true);
  assert.equal(r.txt, r.esperado.txt); assert.equal(r.titulo, r.esperado.titulo); assert.equal(r.m, 'nota'); assert.equal(r.rot, r.rotV);
  assert.deepEqual(r.lidos, ['h']); assert.equal(r.ganho, 0, 'ler deu pontos'); assert.equal(r.srv, 'pronto'); assert.equal(r.cli, 'pronto');
  assert.ok(r.local, 'registro local (tiroteio.lore) sem o id da nota');
  assert.deepEqual(r.docs.lidos, ['n-enfermaria-dose']); assert.equal(r.docs.total, 22); assert.ok(r.aud, 'auditoria da nota');
});

test('nota: fecha com F, Esc, andando, sozinho no fim do tempo e quando a campanha desliga; parado continua aberta', { timeout: 60000 }, async () => {
  const abre = () => noJogo(J.page, (T, PREP) => { const { p, nota, poe, frente } = (new Function('return ' + PREP)())(T); T.ZNOTA.forca = true; poe(p, ...frente(nota[1])); T.srvZUse(p, { k: 'zint', id: nota[1] }); return T.ZLORE.i === nota[1]; }, PREP);
  assert.ok(await abre());
  const f = await noJogo(J.page, T => { const ev = new KeyboardEvent('keydown', { code: 'KeyF', bubbles: true, cancelable: true }); document.body.dispatchEvent(ev); return { i: T.ZLORE.i, cancelado: ev.defaultPrevented }; });
  assert.equal(f.i, -1, 'F não fechou'); assert.equal(f.cancelado, true); assert.equal(await visivel(), false);
  assert.ok(await abre());
  await J.page.evaluate(() => document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true })));
  assert.equal(await noJogo(J.page, T => T.ZLORE.i), -1, 'Esc não fechou');
  assert.ok(await abre());
  const andar = await noJogo(J.page, T => { T.sim(1); const parado = T.ZLORE.i; const d = T.ZINT.nota.fechaAndar + .2, o = T.ZD.zint[T.ZLORE.i];
    T.me.pos.x += -o.n[1] * d; T.me.pos.z += o.n[0] * d; T.sim(.1); return { parado, depois: T.ZLORE.i }; });
  assert.notEqual(andar.parado, -1, 'fechou parada antes do tempo'); assert.equal(andar.depois, -1, 'andando não fechou');
  assert.ok(await abre());
  const tempo = await noJogo(J.page, T => { const D = T.ZINT.nota, o = T.ZD.zint[T.ZLORE.i], s = Math.max(D.textoS, T.CAMP_NOTA_TXT[o.id].txt.length * D.porLetra);
    T.sim(s - .5); const antes = T.ZLORE.i; T.sim(.7); return { antes, depois: T.ZLORE.i }; });
  assert.notEqual(tempo.antes, -1, 'fechou antes do tempo de leitura'); assert.equal(tempo.depois, -1, 'não fechou sozinha');
  assert.ok(await abre());
  const desl = await noJogo(J.page, (T, PREP) => { const { nota } = (new Function('return ' + PREP)())(T); T.ZNOTA.forca = false; T.sim(.1);
    return { i: T.ZLORE.i, vis: nota.map(k => T.ZC.world.zint[k].corpo.visible) }; }, PREP);
  assert.equal(desl.i, -1, 'campanha desligada e o painel continuou'); assert.deepEqual(desl.vis, [false, false, false], 'peças visíveis sem a campanha');
});

test('nota: ato da entrada (CAMP.on, CAMP.ato), outro jogador lê só para ele, quem entra no meio recebe pronto', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, (T, PREP) => {
    const { L, nota, poe, frente } = (new Function('return ' + PREP)())(T), o3 = L[nota[2]]; T.ZNOTA.forca = false;
    // o adaptador lê o CAMP do D02 quando ele existir; aqui a regra do ato é conferida com a forca desligada (sem CAMP: desligada)
    const semCamp = T.zintNotaLigada(o3); T.ZNOTA.forca = true;
    const i = nota[2], c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; }, peerConnection: null };
    T.srvOnData(c, { t: 'join', v: 2, pv: 3, name: 'Leitor' }); const q = T.S.players.get(c.pid); if (!q) return { semJogador: true };
    T.sim(1.2); const zi = c.out.find(m => m.t === 'state' && Array.isArray(m.z?.zi))?.z.zi;
    q.alive = true; q.downed = false; poe(q, ...frente(i)); c.out.length = 0; T.zintLoreFecha(false);
    T.srvOnData(c, { t: 'use', k: 'zint', id: i });
    const msgs = c.out.filter(m => m.t === 'zint'), host = T.ZLORE.i, lidos = [...(T.Z.zint[i].lidos || [])];
    T.srvDrop?.(c); T.zintLoreFecha(false); T.zintSync(T.zWorldState().zi); const sync = T.ZLORE.i;
    return { semCamp, msgs, host, lidos, pid: c.pid, i, zi: zi && nota.map(k => zi[k]?.[0]), sync };
  }, PREP);
  assert.ok(!r.semJogador, 'o jogador falso não entrou'); assert.equal(r.semCamp, false);
  assert.deepEqual(r.msgs, [{ t: 'zint', i: r.i, st: 'lido' }]); assert.equal(r.host, -1, 'o painel abriu no host (devia ser só para quem leu)');
  assert.deepEqual(r.lidos, [r.pid]); assert.ok(r.zi && r.zi.every(s => s === 'pronto'), `zi de quem entrou: ${r.zi}`); assert.equal(r.sync, -1);
  // a regra do ato com um CAMP falso no lugar do do D02 (ZNOTA.camp, só nos testes): a nota do ato 3 só aparece do ato 3 em diante
  const ato = await noJogo(J.page, (T, PREP) => { const { L, nota } = (new Function('return ' + PREP)())(T), o3 = L[nota[2]], o0 = L[nota[0]]; T.ZNOTA.forca = false;
    const f = (o, camp) => { T.ZNOTA.camp = camp; const r = T.zintNotaLigada(o); T.ZNOTA.camp = null; return r; };
    const res = { a2: f(o3, { on: true, ato: 2 }), a3: f(o3, { on: true, ato: 3 }), off: f(o0, { on: false, ato: 4 }), a0: f(o0, { on: true, ato: 0 }) };
    T.ZNOTA.camp = { on: true, ato: 2 }; T.sim(.05); const vis2 = T.ZC.world.zint[nota[2]].corpo.visible; T.ZNOTA.camp = { on: true, ato: 3 }; T.sim(.05); res.vis = [vis2, T.ZC.world.zint[nota[2]].corpo.visible];
    T.ZNOTA.camp = null; T.ZNOTA.forca = true; return res; }, PREP);
  assert.deepEqual(ato, { a2: false, a3: true, off: false, a0: true, vis: [false, true] });
});

test('lore: terminal com o texto novo; sons do rádio, apito, coro e papel com som e sem NaN', { timeout: 120000 }, async () => {
  const sons = await noJogo(J.page, T => T.campSomTeste(['radio', 'apito', 'coro', 'papel']));
  for (const [k, v] of Object.entries(sons)) { assert.equal(v.err, null, `${k}: ${v.err}`); assert.ok(v.fin, `${k}: NaN`); assert.ok(v.rms > 1e-3, `${k} mudo (rms ${v.rms})`); }
  // terminal da Recepção com o texto oficial (lore.md §7)
  const t = await noJogo(J.page, T => { const L = T.ZD.zint, i = L.findIndex(o => o.id === 'san-recepcao'), p = T.S.players.get('h');
    T.zintLoreFecha(false); p.pos = [L[i].x + 1.2, 0, L[i].z]; T.me.pos.set(L[i].x + 1.2, 0, L[i].z); T.srvZUse(p, { k: 'zint', id: i });
    return { txt: document.querySelector('#zlore .zlx').textContent, titulo: document.getElementById('zloreT').textContent }; });
  assert.equal(t.titulo, 'Livro de admissões, última linha'); assert.match(t.txt, /^Família 413\./);
  await noJogo(J.page, (T, N) => { T.zintLoreFecha(false); const L = T.ZINT_MAPA.sanatorio; for (const n of N) { const k = L.findIndex(o => o.id === n.id && o.t === 'nota' && o.teste); if (k >= 0) L.splice(k, 1); } T.ZNOTA.forca = false; }, NOTAS);
  assert.deepEqual(J.erros, []);
});
