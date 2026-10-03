// Testes de segurança da rede e do servidor de zumbis (fase 2, lote B): limitador por conexão, teto de jogadores,
// token de reentrada, nomes únicos, 'shot' conferido, 'zhit' com linha de visão/cone, selfdmg e suicide.
// Conexões de outros jogadores são simuladas com objetos falsos entregues a srvOnData (o PeerJS fica bloqueado).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); }, { timeout: 120000 });
after(async () => { await J?.fechar(); });

const instalar = () => J.page.evaluate(() => {
  const T = window.__T;
  window.__conn = () => ({ open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; this.fechada = true; }, peerConnection: null });
  window.__entrar = (name, extra = {}) => { const c = __conn(); T.srvOnData(c, { t: 'join', v: 2, pv: 3, name, ...extra }); return c; }; // pv: versão do protocolo (PROTO)
  // zumbi à vista: a 2,5 m do jogador numa direção sem parede (tenta 8 direções)
  window.__zumbiPerto = (p, z) => {
    const V3 = T.camera.position.constructor, eye = new V3(p.pos[0], p.pos[1] + 1.62, p.pos[2]);
    for (const [dx, dz] of [[2.5, 0], [-2.5, 0], [0, 2.5], [0, -2.5], [1.8, 1.8], [-1.8, 1.8], [1.8, -1.8], [-1.8, -1.8]]) {
      const c = new V3(p.pos[0] + dx, p.pos[1] + 1.15, p.pos[2] + dz), d = c.clone().sub(eye), dist = d.length(); d.divideScalar(dist);
      if (T.trace(eye, d, dist, null).t >= dist - .05) { z.body.pos.set(p.pos[0] + dx, p.pos[1], p.pos[2] + dz); z.st = 'in'; z.ph = []; return [dx, dz]; }
    }
    throw new Error('sem lugar com visão');
  };
});

test('zumbis: sala criada', { timeout: 120000 }, async () => {
  await criarSala(J.page, { mode: 'zombies', map: 'sanatorio', zdiff: 1 });
  await instalar();
});

test('V22 join: versão de protocolo diferente é recusada com mensagem', async () => {
  const r = await noJogo(J.page, T => { const c = __conn(); T.srvOnData(c, { t: 'join', v: 2, name: 'Antigo' }); return { erro: c.out.find(m => m.t === 'err')?.txt, pid: c.pid }; });
  assert.ok(/vers/i.test(r.erro), r.erro); assert.equal(r.pid, undefined);
});

test('V05 join: jogador entra, recebe welcome; nome repetido vira "Nome (2)"; nome com invisíveis é limpo', async () => {
  const r = await noJogo(J.page, T => {
    const a = __entrar('Vitor'), b = __entrar('Vitor'), c = __entrar('Vi​tor<b>');
    const nomes = [a, b, c].map(x => T.S.players.get(x.pid).name);
    return { nomes, welcome: a.out[0]?.t, you: a.out[0]?.you, n: T.S.players.size };
  });
  assert.equal(r.welcome, 'welcome'); assert.equal(r.you, 'p1');
  assert.deepEqual(r.nomes, ['Vitor', 'Vitor (2)', 'Vitorb']); // o invisível e os < > saem (o "b" da tag fica, como antes)
});

test('V05 ping: sem join não recebe pong; com join recebe', async () => {
  const r = await noJogo(J.page, T => { const c = __conn(); T.srvOnData(c, { t: 'ping', c: 5 }); const antes = c.out.length; T.srvOnData(c, { t: 'join', v: 2, pv: 3, name: 'Ping' }); T.srvOnData(c, { t: 'ping', c: 5 }); return { antes, depois: c.out.filter(m => m.t === 'pong').length }; });
  assert.equal(r.antes, 0); assert.equal(r.depois, 1);
});

test('V05 chat: 200 mensagens num instante viram no máximo a rajada permitida (5) para os outros', async () => {
  const r = await noJogo(J.page, T => { const a = __entrar('Falador'), b = __entrar('Ouvinte'); b.out.length = 0; for (let i = 0; i < 200; i++) T.srvOnData(a, { t: 'chat', txt: 'spam ' + i }); return { chats: b.out.filter(m => m.t === 'chat').length, excesso: a.excesso, aberta: a.open }; });
  assert.ok(r.chats >= 1 && r.chats <= 5, `${r.chats} chats repassados`); assert.ok(r.excesso > 150); assert.equal(r.aberta, true);
});

test('V05 teto de jogadores: a 13.ª pessoa recebe "Sala cheia" e a conexão é fechada', { timeout: 20000 }, async () => {
  const r = await noJogo(J.page, T => { let c; const n0 = [...T.S.players.values()].filter(p => !p.isBot).length; for (let i = n0; i < 12; i++) __entrar('Lotacao' + i); c = __entrar('Sobrando'); return { erro: c.out.find(m => m.t === 'err')?.txt, pid: c.pid, humanos: [...T.S.players.values()].filter(p => !p.isBot).length }; });
  assert.equal(r.erro, 'Sala cheia'); assert.equal(r.pid, undefined); assert.equal(r.humanos, 12);
  await J.page.waitForTimeout(400);
  // limpa a sala para os testes seguintes (tira os figurantes)
  await noJogo(J.page, T => { for (const [pid, c] of [...T.NET.conns]) if (T.S.players.get(pid)?.name.startsWith('Lotacao') || T.S.players.get(pid)?.name.startsWith('Vitor') || ['Ping', 'Falador', 'Ouvinte'].includes(T.S.players.get(pid)?.name)) T.srvDrop(c); });
});

test('V11 reentrada: com o mesmo nome E o mesmo token recupera os pontos; só o nome não recupera', async () => {
  const r = await noJogo(J.page, T => {
    const tok = '0123abcd-4567-89ef-0123-456789abcdef';
    const a = __entrar('Caio', { rk: tok }); const pa = T.S.players.get(a.pid); pa.money = 7777; T.srvDrop(a);
    const imp = __entrar('Caio'); const dinheiroImpostor = T.S.players.get(imp.pid).money; T.srvDrop(imp);
    const b = __entrar('Caio', { rk: tok }); const dinheiroVolta = T.S.players.get(b.pid).money; T.srvDrop(b);
    return { dinheiroImpostor, dinheiroVolta };
  });
  assert.equal(r.dinheiroImpostor, 500); assert.equal(r.dinheiroVolta, 7777);
});

test('V04 shot: arma que não tem, origem longe e cadência estourada são recusados; tiro válido é repassado', async () => {
  const r = await noJogo(J.page, T => {
    const a = __entrar('Atirador'), b = __entrar('Plateia'), p = T.S.players.get(a.pid); T.sim(.5); p.anom = null; b.out.length = 0;
    const o = [p.pos[0], p.pos[1] + 1.6, p.pos[2]], e = [[p.pos[0] + 5, 1, p.pos[2]]];
    T.srvOnData(a, { t: 'shot', w: 'raygun', o, e }); // não tem
    T.srvOnData(a, { t: 'shot', w: 'm1911', o: [p.pos[0] + 40, 1, p.pos[2]], e }); // origem longe
    T.srvOnData(a, { t: 'shot', w: 'm1911', o, e }); // válido
    for (let i = 0; i < 40; i++) T.srvOnData(a, { t: 'shot', w: 'm1911', o, e }); // enxurrada
    const repassados = b.out.filter(m => m.t === 'shot').length;
    const by = { ...p.anom?.by }; T.srvDrop(a); T.srvDrop(b);
    return { repassados, by };
  });
  assert.equal(r.by['shot:arma'], 1); assert.equal(r.by['shot:origem'], 1); assert.ok(r.by['shot:cadencia'] >= 20);
  assert.ok(r.repassados >= 1 && r.repassados <= 12, `${r.repassados} tiros repassados de 41`);
});

test('V03 zhit: zumbi à vista vale; embaixo do chão (nascendo) e sem visão não valem', async () => {
  const r = await noJogo(J.page, T => {
    if (T.Z.phase !== 'round') T.zStartRound(); T.sim(6);
    const p = T.S.players.get('h'), z = [...T.Z.zs.values()][0];
    for (const zz of T.Z.zs.values()) zz.atkT = 1e9; // ninguém ataca o jogador durante o teste
    p.alive = true; p.downed = false; p.hp = 100;
    __zumbiPerto(p, z); const hp0 = z.hp; T.sim(.5); p.anom = null;
    T.sendToHost({ t: 'zhit', v: z.id, dmg: 20, z: 'body', w: 'm1911' }); const d1 = hp0 - z.hp, by1 = { ...p.anom?.by };
    z.t0 = 1e9; z.st = 'rise'; z.body.pos.y = -1.5; z.ph = []; p.anom = null; T.sendToHost({ t: 'zhit', v: z.id, dmg: 20, z: 'body', w: 'm1911' }); const d2 = hp0 - z.hp, by2 = { ...p.anom?.by }; // nascendo: ainda embaixo do chão
    z.st = 'in'; z.body.pos.y = -50; z.ph = []; p.anom = null; T.sendToHost({ t: 'zhit', v: z.id, dmg: 20, z: 'body', w: 'm1911' }); const d3 = hp0 - z.hp, by3 = { ...p.anom?.by };
    z.body.pos.y = 0; z.t0 = 0;
    return { d1, d2, d3, by1, by2, by3, vivo: p.alive, caido: p.downed };
  });
  assert.equal(r.d1, 20, JSON.stringify(r)); assert.equal(r.d2, 20); assert.equal(r.d3, 20);
  assert.equal(r.by2['zhit:subsolo'], 1, JSON.stringify(r)); assert.equal(r.by3['zhit:visao'], 1, JSON.stringify(r));
});

test('V03 zhit: Arma Trovão só pega quem está dentro do cone à frente', async () => {
  const r = await noJogo(J.page, T => {
    const p = T.S.players.get('h'), z = [...T.Z.zs.values()].find(z => T.Z.zs.has(z.id)); const inv0 = { ...p.inv }; p.inv.primary = 'thundergun';
    for (const zz of T.Z.zs.values()) zz.atkT = 1e9; p.alive = true; p.downed = false; p.hp = 100;
    const [dx, dz] = __zumbiPerto(p, z); T.me.yaw = Math.atan2(-dx, -dz); T.me.pitch = 0; // olhando para o zumbi (o próprio cliente do host manda yaw/pitch no pos)
    T.sim(1.2); __zumbiPerto(p, z); p.anom = null; T.sendToHost({ t: 'zhit', v: z.id, dmg: 1e7, z: 'body', w: 'thundergun' }); const morreu = !T.Z.zs.has(z.id), by1 = { ...p.anom?.by };
    const z2 = [...T.Z.zs.values()].find(z => T.Z.zs.has(z.id)); __zumbiPerto(p, z2); const P = z2.body.pos; P.set(p.pos[0] - (P.x - p.pos[0]), 0, p.pos[2] - (P.z - p.pos[2])); z2.ph = []; // atrás
    T.sim(1.2); P.set(p.pos[0] - dx, 0, p.pos[2] - dz); z2.ph = []; p.anom = null; T.sendToHost({ t: 'zhit', v: z2.id, dmg: 1e7, z: 'body', w: 'thundergun' }); const vivo = T.Z.zs.has(z2.id), by2 = { ...p.anom?.by };
    p.inv = inv0; return { morreu, vivo, by1, by2, yaw: p.yaw };
  });
  assert.equal(r.morreu, true, JSON.stringify(r)); assert.equal(r.vivo, true); assert.equal(r.by2['zhit:cone'], 1, JSON.stringify(r));
});

test('F01 pos: ficar dentro de uma parede (3 posições seguidas) é recusado e tira a visão', async () => {
  const r = await noJogo(J.page, T => {
    const c = __entrar('Fantasma'), p = T.S.players.get(c.pid); for (const zz of T.Z.zs.values()) zz.atkT = 1e9;
    const b = T.COL().find(b => !b.ns && b.maxY - b.minY >= 1.5 && b.minY <= .5 && b.maxX - b.minX >= 1 && b.maxZ - b.minZ >= 1); if (!b) throw new Error('sem caixa');
    const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2, y = Math.max(0, b.minY); p.posAt -= 1e4; p.anom = null;
    for (let i = 0; i < 3; i++) T.srvOnData(c, { t: 'pos', p: [cx, y, cz], y: 0, pi: 0 });
    const r = { dentro: p.dentroN, by: { ...p.anom?.by }, pos: p.pos.slice() }; T.srvDrop(c); return r;
  });
  assert.equal(r.by['pos:dentro'], 1, JSON.stringify(r)); assert.ok(r.dentro >= 3);
});

test('R01 pos: flutuar sem apoio por mais de 1 s é recusado; pular não', async () => {
  const r = await noJogo(J.page, T => {
    const c = __entrar('Voador'), p = T.S.players.get(c.pid); for (const zz of T.Z.zs.values()) zz.atkT = 1e9;
    T.sim(.2); const p0 = p.pos.slice(); p.anom = null;
    T.srvOnData(c, { t: 'pos', p: [p0[0], p0[1] + 1.1, p0[2]], y: 0, pi: 0 }); T.sim(.3); T.srvOnData(c, { t: 'pos', p: [p0[0], p0[1] + .3, p0[2]], y: 0, pi: 0 }); T.sim(.3); T.srvOnData(c, { t: 'pos', p: p0, y: 0, pi: 0 }); // pulo: sobe e desce
    const puloOk = !p.anom; p.anom = null;
    for (let i = 0; i < 8; i++) { T.srvOnData(c, { t: 'pos', p: [p0[0], p0[1] + 1.6, p0[2]], y: 0, pi: 0 }); T.sim(.25); } // flutuando a 1,6 m por 2 s
    const r = { puloOk, voo: p.anom?.by?.['pos:voo'] || 0, y: p.pos[1] - p0[1] }; T.srvDrop(c); return r;
  });
  assert.equal(r.puloOk, true); assert.ok(r.voo >= 1, JSON.stringify(r));
});

test('R03 zhit: explosão (sp) longe de qualquer impacto é recusada; perto de um zumbi acertado direto vale', async () => {
  const r = await noJogo(J.page, T => {
    if (T.S.phase === 'over' || T.Z.phase === 'over') T.srvStartMatch(); // os testes anteriores podem ter derrubado o host (fim de jogo): partida nova
    if (T.Z.zs.size < 2) { if (T.Z.phase !== 'round') T.zStartRound(); T.sim(6); }
    const p = T.S.players.get('h'), zs = [...T.Z.zs.values()]; if (zs.length < 2) throw new Error('precisa de 2 zumbis');
    for (const zz of zs) zz.atkT = 1e9; p.alive = true; p.downed = false; p.hp = 100; const inv0 = { ...p.inv }; p.inv.primary = 'raygun';
    const [z1, z2] = zs; T.sim(.6); __zumbiPerto(p, z1); z2.st = 'in'; z2.body.pos.set(p.pos[0] + 40, -30, p.pos[2]); z2.ph = []; p.anom = null; // sem sim depois de mover: o servidor recicla zumbi fora do mapa
    const diag = { fase: T.S.phase, zfase: T.Z.phase, vivo: p.alive, caido: p.downed, inv: { ...p.inv }, zs: T.Z.zs.size, temZ2: T.Z.zs.has(z2.id), isW: !!T.W.raygun, pos: p.pos };
    const hp2 = z2.hp; T.sendToHost({ t: 'zhit', v: z2.id, dmg: 100, z: 'body', w: 'raygun', sp: 1 }); const longe = { d: hp2 - z2.hp, by: { ...p.anom?.by }, diag };
    T.sendToHost({ t: 'zhit', v: z1.id, dmg: 100, z: 'body', w: 'raygun' }); // direto, à vista
    z2.body.pos.set(z1.body.pos.x + 1.5, 0, z1.body.pos.z); z2.ph = []; p.anom = null; const hp2b = z2.hp;
    T.sendToHost({ t: 'zhit', v: z2.id, dmg: 100, z: 'body', w: 'raygun', sp: 1 }); const perto = { d: hp2b - z2.hp, by: { ...p.anom?.by } };
    p.inv = inv0; return { longe, perto };
  });
  assert.equal(r.longe.d, 0); assert.equal(r.longe.by['zhit:sp'], 1, JSON.stringify(r));
  assert.ok(r.perto.d > 0, JSON.stringify(r));
});

test('R06 expulsão: o expulso não volta nem com o mesmo nome sem token; outro nome entra', async () => {
  const r = await noJogo(J.page, T => {
    const tok = '9999abcd-4567-89ef-0123-456789abcdef', a = __entrar('Chato', { rk: tok }); window.__T.NET.conns.get(a.pid);
    const antes = T.S.players.has(a.pid);
    // srvKick é interno: reproduz o que o botão faz
    const p = T.S.players.get(a.pid); (T.S.banidos ||= new Set()).add(p.chaveLeft); T.S.banidos.add('nome:' + p.nome0); T.srvDrop(a);
    const b = __entrar('Chato'), bOk = !!b.pid, bErr = b.out.find(m => m.t === 'err')?.txt;
    const c2 = __entrar('Chato', { rk: tok }), cOk = !!c2.pid;
    const d = __entrar('Outro'), dOk = !!d.pid; if (dOk) T.srvDrop(d); T.S.banidos.clear();
    return { antes, bOk, bErr, cOk, dOk };
  });
  assert.equal(r.antes, true); assert.equal(r.bOk, false); assert.match(r.bErr || '', /removido/); assert.equal(r.cOk, false); assert.equal(r.dOk, true);
});

test('R10 XP: fim de jogo com r absurdo mandado por um host editado dá no máximo o XP de 200 rodadas', async () => {
  const r = await noJogo(J.page, T => { const d = T.PROF.data, c0 = d.cases, x0 = d.xp; T.onMsg({ t: 'zover', r: 1e9 }); T.ZC.over = false; return { caixas: d.cases - c0, xp: d.xp, x0 }; });
  assert.ok(r.caixas <= 6, JSON.stringify(r));
});

test('F02 limitador: tipos de mensagem inventados caem num balde só e contam excesso', async () => {
  const r = await noJogo(J.page, T => { const c = __entrar('Inventor'); for (let i = 0; i < 300; i++) T.srvOnData(c, { t: 'tipo' + i }); const r = { baldes: Object.keys(c.taxa).length, excesso: c.excesso }; T.srvDrop(c); return r; });
  assert.ok(r.baldes <= 2, JSON.stringify(r)); assert.ok(r.excesso > 200);
});

test('V19 suicide: jogador caído não pula o sangramento', async () => {
  const r = await noJogo(J.page, T => { const p = T.S.players.get('h'); p.alive = true; p.downed = true; T.sendToHost({ t: 'suicide' }); const vivo = p.alive; p.downed = false; p.hp = 100; return vivo; });
  assert.equal(r, true);
  assert.deepEqual(J.erros, []);
});
