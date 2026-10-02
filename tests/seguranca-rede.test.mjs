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

test('V19 suicide: jogador caído não pula o sangramento', async () => {
  const r = await noJogo(J.page, T => { const p = T.S.players.get('h'); p.alive = true; p.downed = true; T.sendToHost({ t: 'suicide' }); const vivo = p.alive; p.downed = false; p.hp = 100; return vivo; });
  assert.equal(r, true);
  assert.deepEqual(J.erros, []);
});
