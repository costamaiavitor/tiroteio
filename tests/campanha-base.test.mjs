// Base do modo zumbi com os objetivos do mapa (decisão do dono, 13/10; antes "campanha", O3-D02): o menu tem um modo só (cartões
// Vila e Sanatório, a dificuldade, nada de Ato/Campanha/Infinito/recorde) e o localStorage antigo não quebra o formulário nem a
// partida; a sequência de etapas de cada mapa (Vila: I, II, Vigia; Sanatório: III, IV, Foguista, Diretor) anda no intervalo e,
// depois da última, vira rodadas infinitas com o painel limpo; o time caído acaba a partida como no clássico (sem checkpoint, sem
// "Repetir"); quem entra no meio (rodada, intervalo entre etapas, depois dos objetivos) entra jogando como no clássico, sem kit, e
// recebe o mesmo estado (etapa, objetivos, painel); o motor de objetivos com cada tipo (alvos de TESTE nos interativos, injetados
// antes da partida); o painel do objetivo e o das peças do Pack-a-Punch não se sobrepõem (375/768/1280 px, Fácil com marcadores);
// o clássico de antes (window.__semObjetivos, só nos testes) continua sem nada disto.
// O que saiu (não existe mais; o código saiu na limpeza A8): cartões dos atos com cadeado, "Continuar", salvo por dificuldade no menu,
// st.ato, kit do ato, checkpoint e "Repetir o Ato" (painel #campOver), troca de mapa com bagagem, cenas (#campCena), fim da etapa na
// rodada mínima e as arenas (forte, forno, galeria7: o lastSt antigo que aponta para elas cai na Vila).
// Rodar: node --test tests/campanha-base.test.mjs (liga ZV2_OBJ e ZV2_SORTEIO sozinho)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

process.env.ZV2_OBJ = '1'; process.env.ZV2_SORTEIO = '1'; // o modo novo (sem window.__semObjetivos) com o sorteio (peças do PaP)
let J;
before(async () => { J = await abrirJogo(); }, { timeout: 120000 });
after(async () => { await J?.fechar(); });

// ajudas dentro da página (T = window.__T)
const PREP = `(T => {
  const p = T.S.players.get('h');
  const poe = (q, x, z) => { q.pos = [x, 0, z]; if (q === p) T.me.pos.set(x, 0, z); };
  const segura = () => { T.Z.toSpawn = 50; T.Z.spawnT = 1e12; for (const z of [...T.Z.zs.values()]) T.Z.zs.delete(z.id); };
  const idx = id => T.ZD.zint.findIndex(o => o.id === id);
  const zumbi = (x, z) => { const id = T.Z.nextId; T.Z.toSpawn++; T.zSpawnOne(); const zz = T.Z.zs.get(id); zz.st = 'in'; zz.body.pos.set(x, 0, z); zz.speed = 0; zz.sc = 0; zz.campS = 0; zz.chkT = 1e12; return zz; };
  const obj = id => T.campEstado().obj[id];
  const forcaTudo = () => { for (let k = 0; k < 12; k++) for (const id in T.CAMP.obj) if (T.CAMP.obj[id].st !== 'feito') T.campForca(id); };
  const fimRodada = () => { // começa a rodada (se no intervalo), mata tudo e deixa terminar: o intervalo começa
    if (T.Z.phase !== 'round') { T.Z.phaseEnd = 0; T.sim(.1); }
    T.Z.toSpawn = 0; T.Z.spawnT = 1e12; for (const z of [...T.Z.zs.values()]) T.zKill(z, p, 'head', 'm1911', false, false); T.Z.zs.clear(); T.sim(.3);
  };
  const cliente = nome => { const c = { open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; }, peerConnection: null }; T.srvOnData(c, { t: 'join', v: 2, pv: 7, name: nome }); return c; };
  const ultimoCp = c => c.out.filter(m => m.t === 'state' && m.z?.cp).pop()?.z.cp;
  const ativos = () => Object.entries(T.CAMP.obj).filter(([, o]) => o.st === 'ativo').map(([k]) => k).sort();
  return { p, poe, segura, idx, zumbi, obj, forcaTudo, fimRodada, cliente, ultimoCp, ativos };
})`;
const rodar = (fn, a = {}) => J.page.evaluate(([src, arg]) => {
  const A = (new Function('return ' + arg.PREP)())(window.__T);
  return (new Function('T', 'arg', 'A', `return (${src})(T, arg, A)`))(window.__T, arg, A);
}, [fn.toString(), { PREP, ...a }]);
// textos que não podem aparecer na interface do modo zumbi
const PROIBIDO = /campanha|\bato\b|\batos\b|checkpoint|repetir o|infinito liberado|cr[ée]ditos/i;
const textoHud = () => J.page.evaluate(() => ['zhud', 'center', 'toast'].map(id => document.getElementById(id)).filter(Boolean).map(e => e.innerText).join(' | '));
// espião: uma conexão sem jogador recebe tudo o que o host manda a todos (broadcast)
const ESPIA = `(T => { const msgs = [], c = { open: true, send(m) { msgs.push(typeof m === 'string' ? JSON.parse(m) : m); }, close() {} }; T.NET.conns.set('zz-espiao', c); return { msgs, fim: () => { T.NET.conns.delete('zz-espiao'); } }; })`;
// cria a sala sem o clique do Playwright esperar o mapa (a Vila monta em mais de 30 s no SwiftShader com a máquina ocupada)
async function criar(page, map, zdiff) {
  await page.evaluate(([map, zdiff]) => { const q = s => document.querySelector(s); q('#hostForm [data-mode="zombies"]').click(); q(`#hostForm [data-map="${map}"]`).click(); q(`#hostForm [data-k="zdiff"][data-v="${zdiff}"]`).click(); q('#btnHost').click(); }, [map, zdiff]);
  await page.waitForFunction(() => !!document.querySelector('#lbGo') && document.querySelector('#lbGo').offsetParent !== null, null, { timeout: 120000 });
  await page.evaluate(() => { setTimeout(() => document.querySelector('#lbGo').click(), 0); });
  await page.waitForFunction(() => { const T = window.__T; return T.S.players.get('h')?.alive && T.Z.on; }, null, { timeout: 300000, polling: 500 });
  await page.evaluate(() => { window.__T.sim(0.1); });
}

test('menu: um modo só (cartões Vila e Sanatório), dificuldade, sem Ato/Campanha/Infinito/recorde; localStorage antigo não quebra', { timeout: 120000 }, async () => {
  const r = await noJogo(J.page, T => {
    localStorage.setItem('tiroteio.campanha', JSON.stringify({ v: 1, dif: { 0: { ato: 4, fim: true }, 1: { ato: 4, fim: true } }, inf: { vila: { 1: 33 } }, finalCompleto: true })); // salvo antigo: campanha concluída e recorde
    const VELHOS = [ // lastSt de versões antigas (campanha, infinito, arena) e lixo
      { mode: 'zombies', map: 'forte', zmap: 'forte', zmode: 'infinito', ato: 3, zdiff: 2 },
      { mode: 'zombies', map: 'galeria7', zmode: 'classico', ato: 9 },
      { mode: 'zombies', zmap: 'forno', cmap: 'galeria7', zmode: 'campanha', ato: 4 },
      { mode: 'zombies', zmap: 'sanatorio', zmode: 'campanha', ato: 2, zdiff: 3 },
      { mode: 'dm', map: 'forte', zmap: 'galeria7', zmode: 'hack' },
      { mode: 'zombies', zmap: { x: 1 }, zmode: null, ato: 'x', zdiff: 99 },
    ];
    const res = [];
    for (const st0 of VELHOS) {
      const el = document.createElement('div'); document.body.appendChild(el);
      const get = T.matchForm(el, st0), o = get();
      el.querySelector('[data-mode="zombies"]').click();
      const o2 = get(), mapas = [...el.querySelectorAll('[data-map]')].map(b => b.dataset.map), on = el.querySelector('[data-map].on')?.dataset.map;
      const difs = [...el.querySelectorAll('[data-k="zdiff"]')].map(b => b.textContent);
      const txt = el.innerText;
      el.querySelector('[data-k="zdiff"][data-v="0"]').click(); const o3 = get();
      el.querySelector('[data-map="sanatorio"]').click(); const o4 = get();
      res.push({ o, o2, o3, o4, mapas, on, difs, extra: !!el.querySelector('[data-zm],[data-ato],[data-cont],.rec'), txt });
      el.remove();
    }
    return { res, s1: T.saneSt({ mode: 'zombies', map: 'vila', zmode: 'hack', ato: 99 }), s2: T.saneSt({ mode: 'zombies', map: 'vila', zmode: 'campanha', ato: 1.7 }) };
  });
  for (const [i, x] of r.res.entries()) {
    assert.deepEqual(x.mapas, ['sanatorio', 'vila'], `${i}: cartões do zumbi`); assert.equal(x.extra, false, `${i}: linha Modo, atos, Continuar ou recorde`);
    assert.ok(!/campanha|\bato\b|infinito|recorde|conclu[ií]da/i.test(x.txt), `${i}: texto proibido no menu: ${x.txt}`);
    assert.deepEqual(x.difs, ['Fácil', 'Normal', 'Difícil', 'Pesadelo']);
    for (const o of [x.o2, x.o3, x.o4]) { assert.equal(o.zmode, 'campanha', `${i}: zmode interno`); assert.equal(o.ato, undefined, `${i}: st.ato saiu`); assert.ok(['vila', 'sanatorio'].includes(o.map), `${i}: mapa ${o.map}`); assert.equal(o.map, o.zmap); }
    assert.ok(['vila', 'sanatorio'].includes(x.on), `${i}: nenhum cartão marcado`);
    assert.equal(x.o3.zdiff, 0); assert.equal(x.o4.map, 'sanatorio');
    if (x.o.mode !== 'zombies') assert.ok(!['forte', 'forno', 'galeria7'].includes(x.o.map), `${i}: arena no PvP`);
  }
  assert.equal(r.res[3].o.map, 'sanatorio', 'o mapa salvo continua'); assert.equal(r.res[3].o.zdiff, 3, 'a dificuldade salva continua');
  assert.equal(r.s1.zmode, 'classico'); assert.equal(r.s2.zmode, 'campanha'); // saneSt do cliente: só formas válidas (o st.ato saiu: o jogo não lê mais)
  // localStorage de verdade: lastSt do infinito na arena, a página recarrega e a partida começa na Vila com os objetivos
  await J.page.evaluate(() => localStorage.setItem('tiroteio.lastSt', JSON.stringify({ map: 'forte', cmap: 'galeria7', zmap: 'forte', mode: 'zombies', zmode: 'infinito', ato: 3, zdiff: 1 })));
  await J.page.reload({ waitUntil: 'load' }); await J.page.waitForFunction(() => window.__T && !document.querySelector('#btnHost').disabled, null, { timeout: 60000 });
  const f = await J.page.evaluate(() => ({ mapas: [...document.querySelectorAll('#hostForm [data-map]')].map(b => b.dataset.map), on: document.querySelector('#hostForm [data-map].on')?.dataset.map, txt: document.querySelector('#hostForm').innerText }));
  assert.deepEqual(f.mapas, ['sanatorio', 'vila']); assert.equal(f.on, 'vila'); assert.ok(!/campanha|\bato\b|infinito/i.test(f.txt), f.txt);
  await J.page.evaluate(() => document.querySelector('#btnHost').click());
  await J.page.waitForFunction(() => !!document.querySelector('#lbGo') && document.querySelector('#lbGo').offsetParent !== null, null, { timeout: 120000 });
  await J.page.evaluate(() => { setTimeout(() => document.querySelector('#lbGo').click(), 0); });
  await J.page.waitForFunction(() => { const T = window.__T; return T.S.players.get('h')?.alive && T.Z.on; }, null, { timeout: 300000, polling: 500 });
  const g = await noJogo(J.page, T => { T.sim(.1); return { map: T.S.st.map, zmode: T.S.st.zmode, id: T.CAMP_ATOS[T.CAMP.et]?.id, modo: T.CAMP.modo, cur: T.C.st.map }; });
  assert.deepEqual(g, { map: 'vila', zmode: 'campanha', id: 'I', modo: 'campanha', cur: 'vila' });
  assert.deepEqual(J.erros, []);
});

test('Vila: começa como o clássico (rodada 1, pontos, M1911) e a sequência I → II → Vigia anda no intervalo; depois, rodadas infinitas com o painel limpo', { timeout: 240000 }, async () => {
  const r = await rodar((T, arg, A) => {
    const { p, forcaTudo, fimRodada } = A, ids = () => (T.CAMP.cadeia || []).map(e => T.CAMP_ATOS[e].id);
    T.sim(.2);
    const ini = { cadeia: ids(), et: T.CAMP_ATOS[T.CAMP.et]?.id, round: T.Z.round, ph: T.Z.phase, money: p.money, pts: T.ZDIFF[T.S.st.zdiff].pts, inv: [p.inv.primary, p.inv.secondary], perks: p.perks.length, nd: T.Z.nextDog, nb: T.Z.nextBoss,
      titulo: document.querySelector('#campObj h4')?.textContent, painel: getComputedStyle(document.getElementById('campObj')).display };
    const E = (new Function('return ' + arg.ESPIA)())(T), passos = [];
    try {
      for (let k = 0; k < 4 && T.CAMP.modo === 'campanha'; k++) {
        const et = T.CAMP_ATOS[T.CAMP.et]?.id; forcaTudo(); fimRodada();
        passos.push({ et, depois: T.CAMP_ATOS[T.CAMP.et]?.id ?? null, modo: T.CAMP.modo, ph: T.Z.phase, cena: !!T.CAMP.c.cena, ativos: A.ativos() });
      }
      T.sim(.3);
    } finally { E.fim(); }
    const pn = document.getElementById('campObj');
    return { ini, passos, fim: { modo: T.CAMP.modo, et: T.CAMP.et, nd: T.Z.nextDog, nb: T.Z.nextBoss, painel: getComputedStyle(pn).display, over: document.getElementById('campOver') ? 'existe' : 'none',
      cena: document.getElementById('campCena') ? getComputedStyle(document.getElementById('campCena')).display : 'none', cp: T.zWorldState().cp, ato: T.CAMP.ato },
      msgs: E.msgs.filter(m => m.t === 'msg').map(m => m.txt + ' / ' + (m.sub || '')), cenas: E.msgs.filter(m => m.t === 'camp' && ['cena', 'creditos', 'fim', 'over', 'trans'].includes(m.k)).map(m => m.k) };
  }, { ESPIA });
  assert.deepEqual(r.ini.cadeia, ['I', 'II', 'C1']); assert.equal(r.ini.et, 'I');
  assert.equal(r.ini.money, r.ini.pts, 'pontos da dificuldade'); assert.deepEqual(r.ini.inv, ['m1911', null], 'sem kit do ato'); assert.equal(r.ini.perks, 0);
  assert.ok(r.ini.nd > 1e8 && r.ini.nb > 1e8, 'cães e Carniceiro do clássico desligados durante os objetivos');
  assert.equal(r.ini.titulo, 'Objetivo'); assert.equal(r.ini.painel, 'block');
  assert.deepEqual(r.passos.map(x => [x.et, x.depois, x.modo]), [['I', 'II', 'campanha'], ['II', 'C1', 'campanha'], ['C1', null, 'infinito']]);
  for (const x of r.passos) { assert.equal(x.ph, 'break', 'a etapa seguinte começa no intervalo'); assert.equal(x.cena, false); }
  assert.ok(r.passos[0].ativos.includes('II.1') && r.passos[1].ativos.includes('C1.1'), 'objetivos da etapa seguinte ativos');
  assert.equal(r.fim.modo, 'infinito'); assert.equal(r.fim.et, -1); assert.ok(r.fim.nd < 1e8 && r.fim.nb < 1e8, 'cães e Carniceiro voltam nas rodadas infinitas');
  assert.equal(r.fim.painel, 'none', 'o painel some limpo'); assert.equal(r.fim.over, 'none'); assert.notEqual(r.fim.cena, 'flex');
  assert.equal(r.fim.cp.et, -1); assert.equal(r.fim.cp.fo, 1); assert.equal(r.fim.ato, 4, 'depois dos objetivos os documentos de todas as etapas continuam');
  assert.ok(r.msgs.some(m => m.startsWith('OBJETIVOS CONCLUÍDOS')), r.msgs.join('\n'));
  for (const m of r.msgs) assert.ok(!PROIBIDO.test(m), 'mensagem com texto proibido: ' + m);
  assert.deepEqual(r.cenas, [], 'cena, créditos, checkpoint ou troca de mapa');
  // continua: as rodadas não acabam, o painel continua limpo
  const r2 = await rodar((T, arg, A) => { for (let k = 0; k < 3; k++) A.fimRodada(); return { modo: T.CAMP.modo, et: T.CAMP.et, ph: T.Z.phase, over: T.S.phase, painel: getComputedStyle(document.getElementById('campObj')).display }; });
  assert.deepEqual(r2, { modo: 'infinito', et: -1, ph: 'break', over: 'zombies', painel: 'none' });
  const t = await textoHud(); assert.ok(!PROIBIDO.test(t), 'texto proibido na interface: ' + t);
  assert.deepEqual(J.erros, []);
});

test('quem entra no meio: na rodada, no intervalo entre etapas e depois dos objetivos; joga na hora, sem kit, com o mesmo estado', { timeout: 240000 }, async () => {
  const r = await rodar((T, arg, A) => {
    const { segura, forcaTudo, fimRodada, cliente, ultimoCp } = A, res = {};
    T.srvStartMatch(); T.sim(.1); segura(); // partida nova na Vila
    const E = (new Function('return ' + arg.ESPIA)())(T);
    const painel = () => document.getElementById('campObj').innerText;
    const entra = (k, nome) => { // um cliente falso entra; o cp que ele recebe vira o estado do cliente (como no 'est') e o painel tem de ser o mesmo
      T.sim(.05); const ref = painel(), refC = { et: T.CAMP.c.et, ativos: Object.entries(T.CAMP.c.obj).filter(([, o]) => o.st === 'ativo').map(([i]) => i).sort() };
      const c = cliente(nome || 'Meio' + k); T.sim(.1); T.S.stateT = 0; T.sim(1 / 60); const q = T.S.players.get(c.pid), cp = ultimoCp(c);
      T.campMsg({ k: 'est', ...cp }); T.sim(.05);
      const o = { alive: q?.alive, downed: q?.downed, money: q?.money, inv: q && [q.inv.primary, q.inv.secondary], perks: q?.perks.length, cpEt: cp?.et, hostEt: T.CAMP.et, fo: cp?.fo,
        cli: { et: T.CAMP.c.et, ativos: Object.entries(T.CAMP.c.obj).filter(([, o]) => o.st === 'ativo').map(([i]) => i).sort(), fo: !!T.CAMP.c.fo }, refC, igual: painel() === ref, painel: painel(), ref,
        camp: c.out.filter(m => m.t === 'camp').map(m => m.k), st: c.out.find(m => m.t === 'welcome')?.st.zmode };
      return { c, q, o };
    };
    // 1) no meio de uma rodada da etapa I
    if (T.Z.phase !== 'round') { T.Z.phaseEnd = 0; T.sim(.1); } segura();
    const a = entra(1); res.rodada = a.o;
    // quem saiu caído e volta na mesma rodada espera a próxima (como no clássico), mas volta na rodada seguinte
    a.q.alive = false; T.srvDrop(a.c); T.sim(.05); const b = entra(2, 'Meio1'); res.volta = { alive: b.q.alive };
    fimRodada(); T.Z.phaseEnd = 0; T.sim(.1); res.volta.proxima = [b.q.alive, T.Z.phase]; T.srvDrop(b.c); segura();
    // 2) no intervalo logo depois de a etapa I acabar (a II já começou)
    forcaTudo(); fimRodada(); const c2 = entra(3); res.intervalo = { ...c2.o, ph: T.Z.phase, id: T.CAMP_ATOS[T.CAMP.et]?.id };
    // 3) depois dos objetivos (rodadas infinitas)
    for (let k = 0; k < 4 && T.CAMP.modo === 'campanha'; k++) { forcaTudo(); fimRodada(); }
    const c3 = entra(4); res.depois = { ...c3.o, modo: T.CAMP.modo, visivel: getComputedStyle(document.getElementById('campObj')).display };
    T.Z.phaseEnd = 0; T.sim(.1); res.depois.rodada = [c3.q.alive, T.Z.phase];
    for (const x of [c2, c3]) T.srvDrop(x.c);
    E.fim(); res.msgs = E.msgs.filter(m => m.t === 'msg').map(m => m.txt + ' / ' + (m.sub || ''));
    return res;
  }, { ESPIA });
  for (const k of ['rodada', 'intervalo', 'depois']) {
    const x = r[k];
    assert.equal(x.st, 'campanha', `${k}: o welcome leva o modo`);
    assert.equal(x.alive, true, `${k}: quem entra joga na hora (nada de espectador)`); assert.equal(x.downed, false);
    assert.deepEqual(x.inv, ['m1911', null], `${k}: sem kit do ato`); assert.equal(x.perks, 0); assert.equal(x.money, 500, `${k}: pontos ${x.money}`);
    assert.equal(x.cpEt, x.hostEt, `${k}: a etapa do cp`); assert.equal(x.cli.et, x.refC.et, `${k}: etapa no cliente`); assert.deepEqual(x.cli.ativos, x.refC.ativos, `${k}: objetivos ativos no cliente`);
    assert.ok(x.igual, `${k}: painel diferente depois do estado de quem entrou: ${JSON.stringify([x.painel, x.ref])}`);
    assert.ok(!x.camp.some(m => ['cena', 'creditos', 'over', 'fim', 'trans'].includes(m)), `${k}: mensagens antigas ${x.camp}`);
  }
  assert.equal(r.rodada.hostEt, 0); assert.equal(r.intervalo.id, 'II'); assert.equal(r.intervalo.ph, 'break');
  assert.equal(r.volta.alive, false, 'quem saiu caído não volta vivo na mesma rodada'); assert.deepEqual(r.volta.proxima, [true, 'round'], 'mas volta na rodada seguinte');
  assert.equal(r.depois.modo, 'infinito'); assert.equal(r.depois.cpEt, -1); assert.equal(r.depois.fo, 1); assert.equal(r.depois.cli.fo, true); assert.equal(r.depois.visivel, 'none', 'sem painel depois dos objetivos');
  assert.deepEqual(r.depois.rodada, [true, 'round']);
  for (const m of r.msgs) assert.ok(!PROIBIDO.test(m), m);
  assert.deepEqual(J.erros, []);
});

test('time caído: fim de jogo do clássico (sem checkpoint, sem Repetir) e a partida recomeça do primeiro objetivo', { timeout: 120000 }, async () => {
  const r = await rodar((T, arg, A) => {
    const { p, segura, forcaTudo, fimRodada } = A;
    T.srvStartMatch(); T.sim(.1); segura(); forcaTudo(); fimRodada(); const antes = T.CAMP_ATOS[T.CAMP.et]?.id; // na etapa II
    const E = (new Function('return ' + arg.ESPIA)())(T);
    T.Z.phaseEnd = 0; T.sim(.1); segura(); p.perks = []; p.dwEnd = 0; T.zHurt(p, 1e6, null); T.sim(.2);
    const over = { ph: T.S.phase, s: Math.round(T.S.phaseEnd - window.__simNow), campOver: !!T.CAMP.over, txt: document.getElementById('campOver')?.innerText || '', vis: document.getElementById('campOver') ? 'existe' : 'none' };
    T.sim(12.3); E.fim();
    return { antes, over, depois: { ph: T.S.phase, zph: T.Z.phase, round: T.Z.round, et: T.CAMP_ATOS[T.CAMP.et]?.id, modo: T.CAMP.modo, lobby: T.S.lobby, money: p.money, alive: p.alive },
      camp: E.msgs.filter(m => m.t === 'camp').map(m => m.k), msgs: E.msgs.filter(m => m.t === 'msg' || m.t === 'zover').map(m => m.t + ':' + (m.txt || '')) };
  }, { ESPIA });
  assert.equal(r.antes, 'II');
  assert.equal(r.over.ph, 'over'); assert.equal(r.over.s, 12, 'os 12 s do clássico'); assert.equal(r.over.campOver, false); assert.equal(r.over.vis, 'none'); assert.equal(r.over.txt, '');
  assert.ok(r.msgs.includes('zover:'), 'zover do clássico'); assert.ok(!r.camp.includes('over'), 'checkpoint');
  assert.deepEqual(r.depois, { ph: 'zombies', zph: 'pre', round: 0, et: 'I', modo: 'campanha', lobby: false, money: 500, alive: true });
  assert.deepEqual(J.erros, []);
});

test('HUD: painel do objetivo e peças do Pack-a-Punch sem sobreposição (375/768/1280, Fácil com marcadores, com e sem barra de chefe)', { timeout: 240000 }, async () => {
  await J.fechar(); J = await abrirJogo();
  await criar(J.page, 'vila', 0);
  const pre = await rodar((T, arg, A) => { A.segura(); T.CFG.zmarks = true; for (const id of T.CAMP_ATOS[T.CAMP.et].objs) if (T.CAMP.obj[id]?.st === 'oculto') T.campObjAtiva(id); T.sim(.3); return { pecas: T.ZD.pecas, ativos: A.ativos() }; });
  assert.ok(pre.pecas?.pap > 0, 'sorteio sem peças do PaP'); assert.ok(pre.ativos.length >= 2);
  const caixas = [];
  for (const [w, h] of [[1280, 720], [768, 1024], [375, 667]]) for (const chefe of [0, 1]) {
    await J.page.setViewportSize({ width: w, height: h });
    const b = await noJogo(J.page, (T, chefe) => {
      if (chefe) { Object.defineProperty(T.ZC, 'bo', { get: () => .7, set() {}, configurable: true }); Object.defineProperty(T.ZC, 'boT', { get: () => 1e12, set() {}, configurable: true }); }
      else { delete T.ZC.bo; delete T.ZC.boT; T.ZC.bo = 0; T.ZC.boT = 0; }
      T.CAMP.c.radio = null; T.CAMP.c.radioQ.push(['radio', 'r1-inicio']); T.sim(.3);
      const R = id => { const e = document.getElementById(id); if (!e || getComputedStyle(e).display === 'none' || getComputedStyle(e).visibility === 'hidden') return null; const r = e.getBoundingClientRect(); return r.width && r.height ? [r.left, r.top, r.right, r.bottom] : null; };
      return { obj: R('campObj'), pecas: R('zpecas'), chefe: R('zboss'), radio: R('campRadio'), titulo: document.querySelector('#campObj h4')?.textContent };
    }, chefe);
    caixas.push({ w, chefe, ...b });
  }
  await noJogo(J.page, T => { delete T.ZC.bo; delete T.ZC.boT; T.ZC.bo = 0; T.ZC.boT = 0; });
  const cruza = (a, b) => a && b && a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  for (const c of caixas) {
    assert.ok(c.obj && c.pecas, `${c.w}: painel ou peças não apareceram ${JSON.stringify(c)}`);
    assert.ok(!cruza(c.obj, c.pecas), `${c.w}${c.chefe ? ' com chefe' : ''}: objetivo e peças se sobrepõem ${JSON.stringify(c)}`);
    assert.ok(c.pecas[1] >= c.obj[3], `${c.w}: peças abaixo do painel`);
    assert.ok(c.obj[2] <= c.w && c.obj[0] >= 0, `${c.w}: painel fora da tela`);
    if (c.chefe) { assert.ok(c.chefe, 'barra do chefe'); assert.ok(!cruza(c.obj, c.chefe) && !cruza(c.pecas, c.chefe), `${c.w}: barra do chefe por cima ${JSON.stringify(c)}`); }
    assert.ok(!cruza(c.obj, c.radio) && !cruza(c.pecas, c.radio), `${c.w}${c.chefe ? ' com chefe' : ''}: legenda do rádio por cima ${JSON.stringify(c)}`);
    assert.equal(c.titulo, 'Objetivo');
  }
  await J.page.setViewportSize({ width: 960, height: 540 });
  const t = await textoHud(); assert.ok(!PROIBIDO.test(t), 'texto proibido na interface: ' + t);
  assert.deepEqual(J.erros, []);
});

test('cliente: mensagens antigas (cena, créditos, checkpoint, "concluída") não aparecem; rádio e falas continuam', { timeout: 60000 }, async () => {
  const r = await noJogo(J.page, T => {
    T.campMsg({ k: 'cena', ids: ['c0-abertura'] }); T.sim(.1); const cena = [!!T.CAMP.c.cena, document.getElementById('campCena') ? getComputedStyle(document.getElementById('campCena')).display : 'none'];
    T.campMsg({ k: 'fim', dif: 1 }); T.campMsg({ k: 'over', et: 0, s: 15 }); T.campMsg({ k: 'creditos', s: 30, dif: 1 }); T.sim(.1);
    const over = document.getElementById('campOver') ? 'existe' : 'none', cred = document.getElementById('campCred'), credVis = cred ? getComputedStyle(cred).display : 'none';
    T.CAMP.c.radio = null; T.CAMP.c.radioQ.length = 0; T.campMsg({ k: 'radio', id: 'r1-sino' }); T.sim(.1); const radio = document.getElementById('campRadio'), rd = [radio.style.opacity, radio.innerText];
    T.CAMP.c.radio = null; T.campMsg({ k: 'fala', id: 'cabo-ferido' }); T.sim(.1); const fala = radio.innerText;
    return { cena, over, credVis, center: document.getElementById('center').innerText, radio: rd, esperado: T.CAMP_RADIO_TXT['r1-sino'].txt, fala, falaTxt: T.CAMP_FALA_TXT['cabo-ferido'].txt };
  });
  assert.deepEqual(r.cena, [false, 'none']); assert.equal(r.over, 'none'); assert.equal(r.credVis, 'none');
  assert.ok(!PROIBIDO.test(r.center), r.center);
  assert.equal(r.radio[0], '1'); assert.ok(r.radio[1].includes(r.esperado), r.radio[1]); assert.ok(r.fala.includes(r.falaTxt), r.fala);
  assert.deepEqual(J.erros, []);
});

// ---------- motor de objetivos (cada tipo), com objetivos de TESTE na primeira etapa do Sanatório ----------
test('objetivos de teste no Sanatório: começa na primeira etapa com o objetivo inicial', { timeout: 240000 }, async () => {
  await J.fechar(); J = await abrirJogo();
  await noJogo(J.page, T => {
    T.ZINT_MAPA.sanatorio.push(
      { t: 'gerador', id: 'tz-ger', x: -6, z: -1, n: [1, 0] }, { t: 'alcapao', id: 'tz-alc', x: 5, z: 4, n: [0, 1] },
      { t: 'registro', id: 'tz-reg', x: 6, z: -6, n: [0, 1] }, { t: 'carga', id: 'tz-car', x: -4, z: 6, n: [0, -1] },
      { t: 'chave', id: 'tz-chv', chave: 'tz-chave', x: 2, z: 6, n: [0, 1] }, { t: 'gaiola', id: 'tz-gai', x: 5, z: -4, n: [0, 1], r: 2 });
    Object.assign(T.CAMP_OBJ, {
      'T.chegar': { tipo: 'chegar', titulo: 'Chegar', zona: { x: 6, z: 0, r: 1.5 } },
      'T.ler': { tipo: 'ler', titulo: 'Ler a ficha', alvo: { zint: 'san-recepcao' } },
      'T.alc': { tipo: 'usar', titulo: 'Abrir o alçapão', alvo: { zint: 'tz-alc' } },
      'T.reg': { tipo: 'usar', titulo: 'Fechar o registro', alvo: { zint: 'tz-reg' } },
      'T.car': { tipo: 'usar', titulo: 'Plantar', alvo: { zint: 'tz-car' } },
      'T.def': { tipo: 'defender', titulo: 'Gerador', alvo: { zint: 'tz-ger' }, dura: 8, hp: 400, hpPorJog: .35, atrai: 1, atraiR: 30, aoFeito: 'energia', radio: { ini: 'r1-energia', ok: 'r1-gerador-pegou', falha: 'r1-gerador-caiu' } },
      'T.seg': { tipo: 'segurar', titulo: 'Segurar', zona: { x: 0, z: -4, r: 3 }, dura: 3 },
      'T.esc': { tipo: 'escoltar', titulo: 'Escoltar', npc: 'cabo', rota: [[-3, 3], [3, 3], [3, 6]], hp: 300, hpPorJog: 0 },
      'T.col': { tipo: 'coletar', titulo: 'A chave', item: 'tz-chave', origem: { x: 2, z: 6 }, destino: { x: -6, z: 5, r: 1.5 } },
      'T.mat': { tipo: 'matar', titulo: 'Chefe', chefe: 14 },
      'T.fug': { tipo: 'fugir', titulo: 'Fuga', alvo: { zint: 'tz-gai' }, tempo: 20, embarque: 3 },
      'T.dep': { tipo: 'chegar', titulo: 'Depois', zona: { x: 0, z: 0, r: 30 } },
    });
    T.CAMP_OBJ['T.mat'].depois = ['T.dep'];
    const A = T.CAMP_ATOS.find(a => a.id === 'III'); A.objs = Object.keys(T.CAMP_OBJ).filter(k => k.startsWith('T.')); A.ini = ['T.mat'];
  });
  await criar(J.page, 'sanatorio', 1);
  const r = await rodar((T, arg, A) => {
    A.segura(); T.Z.phaseEnd = 0; T.sim(.1); A.segura(); // a primeira rodada
    const zi = T.ZD.zint.filter(o => o.id?.startsWith('tz-')).map(o => [o.id, !T.ZC.world.zint[T.ZD.zint.indexOf(o)].off]);
    return { cadeia: T.CAMP.cadeia.map(e => T.CAMP_ATOS[e].id), et: T.CAMP_ATOS[T.CAMP.et].id, round: T.Z.round, ph: T.Z.phase, zi, ativos: A.ativos(), cli: T.CAMP.c.obj['T.mat']?.st, painel: document.getElementById('campObj').innerText };
  });
  assert.deepEqual(r.cadeia, ['III', 'IV', 'C2', 'V']); assert.equal(r.et, 'III'); assert.equal(r.round, 1); assert.equal(r.ph, 'round');
  assert.ok(r.zi.length === 6 && r.zi.every(z => z[1]), 'interativos de teste montados');
  assert.deepEqual(r.ativos, ['T.mat']); assert.equal(r.cli, 'ativo'); assert.match(r.painel, /OBJETIVO[\s\S]*Chefe/i);
});

test('objetivos: matar libera o seguinte (depois); chegar; ler (terminal)', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, A) => {
    const { p, poe, segura, idx, obj } = A;
    segura(); T.campEvento('chefe', 14); T.sim(.1);
    const mat = obj('T.mat').st, dep = obj('T.dep').st;
    T.campObjAtiva('T.chegar'); T.campObjAtiva('T.ler'); poe(p, 0, -4); T.sim(.1); const longe = obj('T.chegar').st;
    poe(p, 6, 0); T.sim(.1); const perto = obj('T.chegar').st;
    poe(p, -7, 4); T.srvZUse(p, { k: 'zint', id: idx('san-recepcao') }); T.sim(.1);
    return { mat, dep, longe, perto, ler: obj('T.ler').st, cli: T.CAMP.c.obj['T.ler']?.st };
  });
  assert.equal(r.mat, 'feito'); assert.equal(r.dep, 'feito', 'T.dep (zona grande) ativado pelo depois e feito');
  assert.equal(r.longe, 'ativo'); assert.equal(r.perto, 'feito'); assert.equal(r.ler, 'feito'); assert.equal(r.cli, 'feito', 'o cliente soube');
});

test('objetivos usar (segurar F): alçapão zera ao soltar; registro soma e chama os zumbis; carga', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, A) => {
    const { p, poe, segura, idx, obj } = A;
    segura(); for (const k of ['T.alc', 'T.reg', 'T.car']) T.campObjAtiva(k);
    const hold = (i, s) => { for (let t = 0; t < s; t += .1) { T.srvZHold(p, { k: 'zint', id: i }); T.sim(.1); } };
    const ia = idx('tz-alc'), ir = idx('tz-reg'), ic = idx('tz-car');
    poe(p, 5, 3); hold(ia, 2); const meio = T.Z.zint[ia].st, prog = T.Z.zint[ia].prog; T.sim(1); const solto = [T.Z.zint[ia].st, T.Z.zint[ia].prog];
    hold(ia, 6.4); const alc = [T.Z.zint[ia].st, obj('T.alc').st, T.ZC.zint[ia].st];
    poe(p, 6, -5); hold(ir, 5); const chama = !!T.CAMP.chama; T.sim(1); const reg1 = [T.Z.zint[ir].st, T.Z.zint[ir].prog];
    hold(ir, 7.4); const reg = [T.Z.zint[ir].st, obj('T.reg').st];
    poe(p, -4, 5); hold(ic, 4.3);
    return { meio, prog, solto, alc, chama, reg1, reg, car: [T.Z.zint[ic].st, obj('T.car').st] };
  });
  assert.equal(r.meio, 'abrindo'); assert.ok(r.prog > 1.5); assert.deepEqual(r.solto, ['pronto', 0], 'soltou: zera');
  assert.deepEqual(r.alc, ['aberto', 'feito', 'aberto']);
  assert.equal(r.chama, true, 'quem segura o registro chama os zumbis'); assert.equal(r.reg1[0], 'pronto'); assert.ok(r.reg1[1] > 4.5, 'registro soma');
  assert.deepEqual(r.reg, ['fechado', 'feito']); assert.deepEqual(r.car, ['armada', 'feito']);
});

test('objetivo defender: alvo falso apanha dos zumbis, falha e volta no intervalo, depois liga a energia', { timeout: 90000 }, async () => {
  const r = await rodar((T, arg, A) => {
    const { p, poe, segura, idx, zumbi, obj } = A;
    segura(); T.campObjAtiva('T.def'); const ig = idx('tz-ger');
    poe(p, 6, 6); T.srvZUse(p, { k: 'zint', id: ig }); const longe = T.Z.zint[ig].st;
    poe(p, -4.5, -1); T.srvZUse(p, { k: 'zint', id: ig }); const st1 = T.Z.zint[ig].st, alvo = T.CAMP.alvos[0], hp0 = alvo?.hp;
    poe(p, 6, 6); const z = zumbi(-4.9, -1); T.sim(3); const hp1 = alvo.hp, tgt = z.tgt === alvo;
    const src = [[0, 0]]; src.y = [0]; T.campFontes(src); const fonte = src.length === 2;
    alvo.hp = 0; T.sim(.1); const falhou = [obj('T.def').st, T.Z.zint[ig].st, T.CAMP.alvos.length];
    T.Z.zs.clear(); T.campFimRodada(); const volta = [obj('T.def').st, T.Z.zint[ig].st];
    T.zStartRound(); segura();
    poe(p, -4.5, -1); T.srvZUse(p, { k: 'zint', id: ig }); poe(p, 6, 6); T.sim(8.2);
    return { longe, st1, hp0, hp1, tgt, fonte, falhou, volta, fim: [obj('T.def').st, T.Z.zint[ig].st, T.Z.power, T.CAMP.alvos.length] };
  });
  assert.equal(r.longe, 'pronto', 'F de longe não liga'); assert.equal(r.st1, 'pegando'); assert.equal(r.hp0, 400);
  assert.equal(r.tgt, true, 'o zumbi perto escolheu o gerador'); assert.ok(r.hp1 < r.hp0, `o gerador não apanhou (${r.hp1})`); assert.equal(r.fonte, true, 'fonte do campo de fluxo');
  assert.deepEqual(r.falhou, ['falhou', 'afogado', 0]); assert.deepEqual(r.volta, ['ativo', 'pronto']);
  assert.deepEqual(r.fim, ['feito', 'ligado', true, 0]);
});

test('objetivos segurar, escoltar (NPC cinemático e alvo falso) e o limite de 4 mensagens por segundo', { timeout: 90000 }, async () => {
  const r = await rodar((T, arg, A) => {
    const { p, poe, segura, obj } = A;
    segura();
    T.campObjAtiva('T.seg'); poe(p, 6, 6); T.sim(1); const fora = obj('T.seg').p;
    poe(p, 0, -4); let msgs = 0; const env = T.CAMP.obj['T.seg']; let last = env.envT;
    for (let i = 0; i < 32; i++) { T.sim(.1); if (env.envT !== last) { msgs++; last = env.envT; } }
    const seg = obj('T.seg').st;
    T.campObjAtiva('T.esc'); poe(p, 6, 6); T.sim(1); const parado = T.CAMP.npc?.a.pos.slice();
    const a = T.CAMP.npc.a; a.hp = 0; T.sim(.1); const falhou = obj('T.esc').st; T.campFimRodada(); const volta = [obj('T.esc').st, T.CAMP.npc.a.pos.slice(0, 1)[0]];
    poe(p, -2, 3); for (let i = 0; i < 80 && obj('T.esc').st === 'ativo'; i++) { const P = T.CAMP.npc?.a.pos; if (P) poe(p, P[0] + .8, P[2]); T.sim(.1); }
    return { fora, msgs, seg, parado, falhou, volta, esc: obj('T.esc').st, npcCli: !!T.CAMP.c.npc };
  });
  assert.equal(r.fora, 0, 'sem ninguém na zona o tempo não anda'); assert.equal(r.seg, 'feito'); assert.ok(r.msgs <= 4 * 3.2 + 2, `${r.msgs} mensagens em 3,2 s`);
  assert.deepEqual(r.parado, [-3, 0, 3], 'NPC sem ninguém perto não anda'); assert.equal(r.falhou, 'falhou'); assert.deepEqual(r.volta, ['ativo', -3], 'volta ao começo da rota');
  assert.equal(r.esc, 'feito'); assert.equal(r.npcCli, true, 'posição do NPC chega ao cliente');
});

test('objetivo coletar: chave no chão, portador cai e deixa o item, entrega; trava camp: na porta', { timeout: 90000 }, async () => {
  const r = await rodar((T, arg, A) => {
    const { p, poe, segura, idx, obj, cliente } = A;
    segura(); T.campObjAtiva('T.col'); const ik = idx('tz-chv'); const st0 = [T.Z.zint[ik].st, T.ZC.zint[ik].st, T.ZC.world.zint[ik].g.visible];
    const c = cliente('Portador'); const q = T.S.players.get(c.pid); q.alive = true; q.downed = false; T.sim(.1);
    q.alive = true; q.downed = false; poe(q, 2, 5.5); T.srvZUse(q, { k: 'zint', id: ik }); T.sim(.1); const lev = [T.Z.zint[ik].st, obj('T.col').q === q.id];
    poe(q, 4, 1); T.sim(.1); q.downed = true; T.sim(.1); const caiu = [T.Z.zint[ik].st, T.ZD.zint[ik].x, T.ZD.zint[ik].z, obj('T.col').q];
    poe(p, 4, 1.2); T.srvZUse(p, { k: 'zint', id: ik }); T.sim(.1); poe(p, -6, 5); T.sim(.1);
    const fim = [obj('T.col').st, T.CAMP.chaves.has('tz-chave'), T.Z.zint[ik].st];
    T.CAMP_TRAVAS.sanatorio.AC = 'camp:tz-trava'; poe(p, 8, 0); const m0 = p.money; T.srvZUse(p, { k: 'door', id: 'AC' }); const fechada = !T.Z.doors.has('AC');
    T.CAMP.chaves.add('tz-trava'); T.srvZUse(p, { k: 'door', id: 'AC' }); const aberta = T.Z.doors.has('AC'), gratis = p.money === m0;
    delete T.CAMP_TRAVAS.sanatorio.AC; T.srvDrop(c);
    return { st0, lev, caiu, fim, fechada, aberta, gratis };
  });
  assert.deepEqual(r.st0, ['chao', 'chao', true], 'origem: a chave aparece no chão');
  assert.deepEqual(r.lev, ['levada', true]); assert.deepEqual(r.caiu, ['chao', 4, 1, null], 'quem carrega e cai deixa o item onde estava');
  assert.deepEqual(r.fim, ['feito', true, 'entregue']);
  assert.equal(r.fechada, true, 'porta travada não abre sem a chave'); assert.equal(r.aberta, true); assert.equal(r.gratis, true);
});

test('objetivo fugir (gaiola: embarque) e, com tudo feito, a etapa seguinte do mesmo mapa no fim da rodada (sem rodada mínima)', { timeout: 60000 }, async () => {
  const r = await rodar((T, arg, A) => {
    const { p, poe, segura, idx, obj, forcaTudo } = A;
    segura(); T.campObjAtiva('T.fug'); const ig = idx('tz-gai'); poe(p, -6, 6); T.sim(1); const fora = obj('T.fug').st;
    poe(p, 5, -4); T.sim(.2); const emb = T.Z.zint[ig].st; T.sim(3); const fug = [obj('T.fug').st, T.Z.zint[ig].st, T.CAMP.fugiram];
    forcaTudo(); const r0 = T.Z.round, map0 = T.S.st.map; T.Z.zs.clear(); T.Z.toSpawn = 0; T.sim(.3);
    return { fora, emb, fug, r0, ph: T.Z.phase, et: T.CAMP_ATOS[T.CAMP.et]?.id, map: [map0, T.S.st.map, T.C.st.map], cena: !!T.CAMP.c.cena, round: T.Z.round };
  });
  assert.equal(r.fora, 'ativo'); assert.equal(r.emb, 'embarque'); assert.deepEqual(r.fug, ['feito', 'subiu', ['h']]);
  assert.equal(r.ph, 'break'); assert.equal(r.et, 'IV', 'próxima etapa: IV'); assert.deepEqual(r.map, ['sanatorio', 'sanatorio', 'sanatorio'], 'mesmo mapa');
  assert.equal(r.cena, false); assert.equal(r.round, r.r0);
  assert.deepEqual(J.erros, []);
});

test('Sanatório: IV → Foguista → Diretor e depois rodadas infinitas, no mesmo mapa e sem cena', { timeout: 240000 }, async () => {
  const r = await rodar((T, arg, A) => {
    const { segura, forcaTudo, fimRodada } = A, passos = [];
    const E = (new Function('return ' + arg.ESPIA)())(T);
    try {
      for (let k = 0; k < 5 && T.CAMP.modo === 'campanha'; k++) { segura(); const et = T.CAMP_ATOS[T.CAMP.et]?.id; forcaTudo(); fimRodada(); passos.push([et, T.CAMP_ATOS[T.CAMP.et]?.id ?? null, T.CAMP.modo, T.S.st.map, T.S.phase]); }
    } finally { E.fim(); }
    return { passos, painel: getComputedStyle(document.getElementById('campObj')).display, ato: T.CAMP.ato, msgs: E.msgs.filter(m => m.t === 'msg').map(m => m.txt + ' / ' + (m.sub || '')), camp: E.msgs.filter(m => m.t === 'camp').map(m => m.k) };
  }, { ESPIA });
  assert.deepEqual(r.passos, [['IV', 'C2', 'campanha', 'sanatorio', 'zombies'], ['C2', 'V', 'campanha', 'sanatorio', 'zombies'], ['V', null, 'infinito', 'sanatorio', 'zombies']]);
  assert.equal(r.painel, 'none'); assert.equal(r.ato, 4);
  for (const m of r.msgs) assert.ok(!PROIBIDO.test(m), m);
  assert.ok(!r.camp.some(k => ['cena', 'creditos', 'fim', 'over', 'trans'].includes(k)), r.camp.join());
  const t = await textoHud(); assert.ok(!PROIBIDO.test(t), 'texto proibido na interface: ' + t);
  assert.deepEqual(J.erros, []);
});

test('clássico de antes (window.__semObjetivos, só nos testes): CAMP desligado, sem cp no mundo, sem painel, cães e Carniceiro', { timeout: 180000 }, async () => {
  await J.fechar(); J = await abrirJogo();
  await J.page.evaluate(() => { window.__semObjetivos = true; });
  await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 });
  const r = await noJogo(J.page, T => {
    if (T.Z.phase !== 'round') T.zStartRound();
    T.Z.toSpawn = 0; T.Z.zs.clear(); T.sim(1);
    return { on: T.CAMP.on, cp: 'cp' in T.zWorldState(), zmode: T.S.st.zmode, fase: T.Z.phase, fim: T.Z.phaseEnd - window.__simNow, nd: T.Z.nextDog < 100, nb: T.Z.nextBoss < 100,
      painel: document.getElementById('campObj') ? getComputedStyle(document.getElementById('campObj')).display : 'none', pecas: T.ZD.pecas };
  });
  assert.equal(r.zmode, 'classico'); assert.equal(r.on, false); assert.equal(r.cp, false, 'cp só com os objetivos');
  assert.equal(r.fase, 'break'); assert.ok(r.fim > 8.5 && r.fim <= 10, 'intervalo de 10 s'); assert.ok(r.nd && r.nb, 'cães e Carniceiro do clássico');
  assert.equal(r.painel, 'none'); assert.ok(!r.pecas || (r.pecas.power > 0 && r.pecas.pap > 0), 'no clássico as peças são da energia e do PaP');
  assert.deepEqual(J.erros, []);
});
