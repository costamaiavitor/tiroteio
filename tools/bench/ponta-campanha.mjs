// O3-D16: campanha de ponta a ponta (Ato I -> V, chefes, fuga, final, créditos, lobby), com clientes falsos em cada etapa
// (um que entra no intervalo e fica, outro que entra no meio da rodada), memória a cada chegada de mapa, segunda volta para
// conferir que geometrias/texturas não crescem e o Infinito no Sanatório depois da campanha no mesmo mapa.
// Rodar: node tools/bench/ponta-campanha.mjs [--saida ponta.json] (uns 2 min no SwiftShader)
import fs from 'node:fs';
import path from 'node:path';
import { abrirJogo, criarSala } from '../../tests/_jogo.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const SAIDA = arg('saida', 'ponta-campanha.json');
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const J = await abrirJogo();
const pg = J.page;
const out = { etapas: [], erros: J.erros, lap2: [], inf: null, softlock: [] };
try {
  await criarSala(pg, { mode: 'zombies', map: 'vila', zdiff: 1 });
  await pg.evaluate(() => { localStorage.removeItem('tiroteio.campanha'); const T = window.__T;
    window.__cli = () => ({ open: true, out: [], send(m) { this.out.push(m); }, close() { this.open = false; } });
    window.__mem = () => { const T = window.__T, R = T.renderer; return { geo: R.info.memory.geometries, tex: R.info.memory.textures, prog: R.info.programs?.length ?? null, col: T.COL().length }; };
  });
  const esperaMapa = m => pg.waitForFunction(m => window.__T.S.st.map === m && window.__T.ZC.world && !document.getElementById('warmMsg'), m, { timeout: 600000, polling: 300 });
  const comeca = async (zmode, ato, mapa) => {
    await pg.evaluate(([zmode, ato, mapa]) => { const T = window.__T; T.campLibera(4, 3); T.S.st = { ...T.S.st, zmode, ato, map: mapa, zmap: mapa }; T.broadcast({ t: 'match', st: T.S.st }); T.srvStartMatch(); T.sim(.1); }, [zmode, ato, mapa]);
    await esperaMapa(mapa);
  };

  // uma etapa: chega, clientes falsos, cumpre os objetivos, mata os chefes, encerra rodadas; devolve quando trocar de etapa
  async function etapa(volta) {
    const chegada = await pg.evaluate(() => { const T = window.__T, A = T.CAMP_ATOS[T.CAMP.et];
      const p = T.S.players.get('h'); p.dwEnd = 1e12; if (T.CAMP.c) T.CAMP.c.cena = null;
      const c = window.__c2 = window.__cli(); T.srvOnData(c, { t: 'join', v: 2, pv: T.PROTO ?? 3, name: 'Fica' + T.CAMP.et + (window.__vn = (window.__vn || 0) + 1) }); T.sim(.2);
      const q = T.S.players.get(c.pid), st = c.out.filter(m => m.t === 'state' && m.z).pop();
      return { et: T.CAMP.et, id: A?.id, mapa: T.S.st.map, round: T.Z.round, ph: T.Z.phase, mem: window.__mem(), doors: T.Z.doors.size, zs: T.Z.zs.size,
        c2: { pid: c.pid, vivo: q?.alive, pts: q?.money, kit: T.CAMP_KIT[A?.id]?.pts ?? null, armas: q && [q.inv.primary, q.inv.secondary], cpEt: st?.z?.cp?.et ?? null, msgs: [...new Set(c.out.map(m => m.t))].join() } };
    });
    log(`etapa ${chegada.id} (${chegada.mapa}) r${chegada.round} ${chegada.ph}`, JSON.stringify(chegada.mem), 'c2', JSON.stringify(chegada.c2));
    let meio = null, guard = 0, fim = null;
    { // quem entra no meio da rodada: espera a rodada começar e entra (espectador; kit no intervalo seguinte)
      meio = await pg.evaluate(() => { const T = window.__T, e0 = T.CAMP.et; for (let k = 0; k < 80 && T.Z.phase !== 'round' && !T.CAMP.trans && T.CAMP.et === e0; k++) { if (T.CAMP.c) T.CAMP.c.cena = null; T.sim(.25); }
        if (T.Z.phase !== 'round') return { sem: T.Z.phase };
        const c = window.__c3 = window.__cli(); T.srvOnData(c, { t: 'join', v: 2, pv: 3, name: 'Meio' + (window.__vn = (window.__vn || 0) + 1) }); T.sim(.2);
        const q = T.S.players.get(c.pid), st = c.out.filter(m => m.t === 'state' && m.z).pop(); return { vivo: q?.alive, cpEt: st?.z?.cp?.et ?? null, ph: T.Z.phase, round: T.Z.round }; });
    }
    for (;;) {
      const r = await pg.evaluate(() => {
        const T = window.__T, p = T.S.players.get('h'), agora = () => window.__simNow, e0 = T.CAMP.et, ev = [];
        const vivo = () => { p.dwEnd = 1e12; if (!p.alive || p.downed) { p.alive = true; p.downed = false; p.hp = p.maxHp; } };
        for (let k = 0; k < 120; k++) {
          vivo(); if (T.CAMP.c) T.CAMP.c.cena = null;
          if (T.CAMP.trans || T.S.phase === 'over' || T.CAMP.et !== e0 || !T.CAMP.on) break;
          for (const id in T.CAMP.obj) { const O = T.CAMP.obj[id], D = T.CAMP_OBJ[id]; if (O.st !== 'ativo' || !D) continue;
            if (D.tipo === 'matar') continue;
            if (D.tipo === 'fugir') { const zid = [].concat(D.alvo?.zint || [])[0], zn = D.zona || T.ZD.zint.find(x => x.id === zid); if (zn) { p.pos = [zn.x, 0, zn.z]; T.me.pos.set(zn.x, 0, zn.z); } else T.campForca(id); continue; }
            T.campForca(id); ev.push('forca ' + id); }
          const CH = T.CAMP_CH, z = CH.z;
          if (z && T.Z.zs.has(z.id) && z.st !== 'rise') { if (T.drProtecao && T.drIdx) for (const i of T.drIdx('g7-tanque')) T.campDanoPilar(i, 1e7, 0, p); CH.inv = 0; CH.fase = (CH.def.fases?.length || 1) - 1; z.hp = 1; T.zHit(p, z.id, 1000, 'body', 'm1911', false); ev.push('chefe ' + z.kind); }
          for (const x of [...T.Z.zs.values()]) if (!(CH.z && x === CH.z)) T.zKill(x, null, 'body', 'nuke', false, true);
          if (!(CH.z && T.Z.zs.has(CH.z.id)) && !T.CAMP_VS?.fase) { T.Z.toSpawn = 0; T.Z.reQ = []; }
          if (T.Z.phase !== 'round' && T.Z.phaseEnd > agora() + .3 && !T.CAMP.fim) T.Z.phaseEnd = agora() + .2;
          T.sim(.5);
        }
        return { et: T.CAMP.et, e0, trans: T.CAMP.trans?.fase || null, fim: !!T.CAMP.fim, over: T.S.phase, on: T.CAMP.on, round: T.Z.round, ph: T.Z.phase, ev: ev.slice(-6),
          obj: Object.entries(T.CAMP.obj).map(([k, O]) => k + ':' + O.st).join(' '), fuga: T.CAMP_VS?.fase || null, ch: T.CAMP_CH.z?.kind ?? null };
      });
      guard++;
      if (!meio && r.ph === 'round' && r.et === chegada.et && !r.trans) { // quem entra no meio da rodada: espectador, kit no intervalo
        meio = await pg.evaluate(() => { const T = window.__T, c = window.__c3 = window.__cli(); T.srvOnData(c, { t: 'join', v: 2, pv: T.PROTO ?? 3, name: 'Meio' + (window.__vn = (window.__vn || 0) + 1) }); T.sim(.2);
          const q = T.S.players.get(c.pid), st = c.out.filter(m => m.t === 'state' && m.z).pop(); return { vivo: q?.alive, cpEt: st?.z?.cp?.et ?? null, ph: T.Z.phase }; });
      }
      if (r.et !== chegada.et || r.trans || r.over === 'over' || !r.on) { fim = r; break; }
      if (guard > 30) { out.softlock.push({ etapa: chegada.id, r }); log('SOFTLOCK?', JSON.stringify(r)); fim = r; break; }
    }
    // quem entrou no meio: recebeu o kit no intervalo seguinte?
    const meioDepois = await pg.evaluate(() => { const T = window.__T, c = window.__c3; if (!c) return null; const q = T.S.players.get(c.pid); const o = q ? { vivo: q.alive, pts: q.money, armas: [q.inv.primary, q.inv.secondary] } : null; return o; });
    log(`  fim da etapa ${chegada.id}:`, JSON.stringify(fim), 'meio', JSON.stringify(meio), '->', JSON.stringify(meioDepois));
    out[volta].push({ chegada, fim, meio, meioDepois });
    return fim;
  }

  // troca de mapa: espera montar, manda o pronto do host e dos clientes falsos
  async function troca(fim) {
    if (fim.trans !== 'carga' && fim.trans !== 'troca') {
      const r = await pg.evaluate(() => { const T = window.__T; for (let k = 0; k < 120 && !T.CAMP.trans && T.S.phase !== 'over'; k++) { if (T.CAMP.c) T.CAMP.c.cena = null; T.sim(.5); } return { trans: T.CAMP.trans?.fase || null, et: T.CAMP.et, over: T.S.phase }; });
      if (!r.trans) return r;
    }
    await pg.evaluate(() => { const T = window.__T; for (let k = 0; k < 40 && T.CAMP.trans?.fase !== 'carga'; k++) T.sim(.25); });
    const prox = await pg.evaluate(() => window.__T.S.st.map);
    await esperaMapa(prox);
    return pg.evaluate(() => { const T = window.__T; let k = 0, fases = [];
      for (; k < 120 && T.CAMP.trans; k++) { fases.push(T.CAMP.trans.fase); T.sendToHost({ t: 'camp', k: 'pronto' }); for (const c of [window.__c2, window.__c3]) if (c?.pid && T.S.players.has(c.pid)) T.srvOnData(c, { t: 'camp', k: 'pronto' }); T.sim(.25); }
      const lib = !T.CAMP.trans, espS = k * .25, fs = [...new Set(fases)].join(); for (const c of [window.__c2, window.__c3]) if (c?.pid && T.S.players.has(c.pid)) T.srvDrop(c); window.__c2 = window.__c3 = null; T.sim(.1); return { lib, espS, fs, et: T.CAMP.et, mapa: T.S.st.map }; });
  }

  // ---------- volta 1: Ato I até o fim ----------
  await comeca('campanha', 0, 'vila');
  for (let n = 0; n < 12; n++) {
    const f = await etapa('etapas');
    if (f.over === 'over' || !f.on) break;
    if (f.et === 6 && f.fuga) break;
    const t = await troca(f); log('  troca', JSON.stringify(t));
    if (t.over === 'over') break;
  }
  // final: créditos e lobby
  const fin = await pg.evaluate(() => { const T = window.__T; for (let k = 0; k < 200 && T.S.phase !== 'over'; k++) { const p = T.S.players.get('h'); p.dwEnd = 1e12; T.sim(.5); }
    if (T.CAMP.fim) T.sim(Math.max(0, T.CAMP.fim.t - window.__simNow) + .3); T.sim(.3);
    return { ph: T.S.phase, cred: T.campVEstado?.().cred, salvo: T.campSalvo().dif[1], inf: T.campInfLiberado?.(), fug: T.CAMP.fugiram, mem: window.__mem() }; });
  log('final', JSON.stringify(fin)); out.final = fin;
  await pg.keyboard.press('Enter'); await pg.evaluate(() => window.__T.sim(.1)); await pg.keyboard.press('Enter');
  const lobby = await pg.evaluate(() => { const T = window.__T; T.sim(.3); return { lobby: T.S.lobby, on: T.CAMP.on, zon: T.Z.on, mem: window.__mem() }; });
  log('lobby', JSON.stringify(lobby)); out.lobby = lobby;

  // ---------- voltas 2 e 3: Vila -> Forte -> Sanatório (a 3ª não pode crescer sobre a 2ª: os pools da campanha ficam na cena) ----------
  for (const volta of ['lap2', 'lap3']) {
    out[volta] = [];
    await pg.evaluate(() => { const T = window.__T; T.S.lobby = false; });
    await comeca('campanha', 0, 'vila');
    for (let n = 0; n < 4; n++) { const f = await etapa(volta); const t = await troca(f); log('  troca', JSON.stringify(t)); if (t.et >= 3 || t.over === 'over') break; }
    out[volta].push({ chegadaSan: await pg.evaluate(() => ({ et: window.__T.CAMP.et, mapa: window.__T.S.st.map, mem: window.__mem() })) });
  }

  // ---------- Infinito no Sanatório depois da campanha no Sanatório ----------
  await comeca('infinito', 0, 'sanatorio');
  out.inf = await pg.evaluate(() => { const T = window.__T; T.sim(.2); const L = T.ZD.zint, W = T.ZC.world.zint;
    const camp = ['gerador', 'alcapao', 'registro', 'carga', 'chave', 'gaiola', 'nota', 'pilar', 'juncao', 'curto', 'valvula'];
    return { modo: T.CAMP.modo, et: T.CAMP.et, mapa: T.S.st.map, cst: T.C.st.zmode, visiveis: L.map((o, i) => camp.includes(o.t) && W[i] && (o.t === 'nota' ? W[i].corpo?.visible : !W[i].off) ? o.id || o.t : null).filter(Boolean), mem: window.__mem() }; });
  log('infinito', JSON.stringify(out.inf));
} catch (e) { out.excecao = String(e?.stack || e); log('EXCECAO', e); }
finally {
  fs.writeFileSync(SAIDA, JSON.stringify(out, null, 1)); log('erros de página:', J.erros.length, J.erros.slice(0, 5).join(' | '));
  await J.fechar();
}
