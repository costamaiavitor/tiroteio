// Decisão do dono (13/10): zumbi morto por armadilha, Nuke ou fogo ligado/pego por um jogador dá pontos a ele (ZBAL.pontos.semTiro + o
// bônus do tipo). Rodar: node --test tests/pontos-sem-tiro.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirJogo, criarSala, noJogo } from './_jogo.mjs';

let J;
before(async () => { J = await abrirJogo(); await criarSala(J.page, { mode: 'zombies', map: 'vila', zdiff: 1 }); }, { timeout: 240000 });
after(async () => { await J?.fechar(); });

test('armadilha e Nuke: os abates dão pontos a quem ligou / pegou', { timeout: 180000 }, async () => {
  const r = await noJogo(J.page, T => {
    const p = T.S.players.get('h'); p.dwEnd = 1e12;
    const limpa = () => { for (const z of [...T.Z.zs.values()]) T.zKill(z, null, 'body', 'nuke', false, true); T.Z.toSpawn = 0; T.Z.reQ = []; };
    const nasce = n => { const ids = []; T.Z.phase = 'round'; for (let k = 0; k < n * 4 && ids.length < n; k++) { T.Z.toSpawn++; const a = T.Z.nextId; if (T.zSpawnOne() && T.Z.zs.has(a)) ids.push(a); else T.Z.toSpawn--; } return ids.map(id => T.Z.zs.get(id)); };
    limpa(); T.Z.round = 3; T.Z.dogRound = false; T.Z.bossQ = 0; T.Z.mixN = 0;
    const o = {};
    // armadilha: o zumbi dentro da faixa ligada morre; quem ligou ganha 60 (zGain no Normal = 1)
    const t = T.ZD.traps[0], E = T.Z.traps[0];
    const [z] = nasce(1); z.st = 'in'; z.body.pos.set(t.x, 0, t.z);
    E.st = 'on'; E.t = window.__simNow + 5; E.by = 'h'; E.hurt = {}; p.pos = [t.x + 30, 0, t.z + 30];
    const m0 = p.money, k0 = p.kills; T.sim(.3);
    o.trap = [T.Z.zs.has(z.id), p.money - m0, p.kills - k0]; E.st = 'idle';
    // Nuke: todos caem e quem pegou ganha 400 (todo mundo) + 60 por abate
    limpa(); const zs = nasce(3); const m1 = p.money, k1 = p.kills;
    T.zPower('nuke', p); T.sim(2.5);
    o.nuke = [zs.filter(x => T.Z.zs.has(x.id)).length, zs.length, p.money - m1, p.kills - k1];
    // tiro continua como antes
    limpa(); const [y] = nasce(1); const m2 = p.money; y.hp = 1; T.zHit(p, y.id, 50, 'head', 'm1911', false); o.tiro = p.money - m2;
    return o;
  });
  assert.deepEqual(r.trap, [false, 60, 1], 'armadilha: morto, 60 pontos e 1 abate para quem ligou');
  assert.equal(r.nuke[0], 0); assert.equal(r.nuke[2], 400 + 60 * r.nuke[1], 'Nuke: 400 + 60 por abate'); assert.equal(r.nuke[3], r.nuke[1]);
  assert.ok(r.tiro >= 100, 'tiro na cabeça: 100 como antes ' + r.tiro);
  assert.deepEqual(J.erros, []);
});
