// Apoio para as análises: abre o Dan Gun num Chromium headless servindo REPO_DIR em http://localhost/ (o resto da rede é abortado).
// Uso: REPO_DIR=<worktree> node script.mjs
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const REPO = process.env.REPO_DIR || process.cwd();
export const OUT = process.env.OUT || '.';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.gz': 'application/gzip', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.wav': 'audio/wav', '.svg': 'image/svg+xml', '.css': 'text/css' };
export const wait = ms => new Promise(r => setTimeout(r, ms));

export async function abrir({ w = 1280, h = 720, log = false } = {}) {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.route('**/*', async r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'localhost' || /peerjs/i.test(u.pathname)) return r.abort();
    let rel = decodeURIComponent(u.pathname); if (rel.endsWith('/')) rel += 'index.html';
    const abs = path.resolve(REPO, '.' + rel);
    if (!abs.startsWith(REPO)) return r.abort();
    try { const body = await readFile(abs); return r.fulfill({ status: 200, body, headers: { 'content-type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' } }); }
    catch { return r.fulfill({ status: 404, body: 'nao achei' }); }
  });
  await ctx.addInitScript(() => { window.__semSorteio = true; window.__semObjetivos = true; window.__semFundo3d = true; });
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  if (log) page.on('console', m => console.log('[pag]', m.text()));
  await page.goto('http://localhost/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__T && !document.querySelector('#btnHost').disabled, null, { timeout: 120000 });
  return { browser, ctx, page, erros, fechar: () => browser.close() };
}

// mode: 'dm' | 'zombies' | 'rounds'
export async function sala(page, { mode = 'dm', map = mode === 'zombies' ? 'sanatorio' : 'dust', espera } = {}) {
  await page.click('#btnHost');
  await page.waitForSelector('#lbGo', { timeout: 60000 });
  await page.click(`#lbForm [data-mode="${mode}"]`);
  await wait(300);
  await page.click(`#lbForm [data-map="${map}"]`);
  if (mode !== 'zombies') { const b = await page.$('#lbForm [data-k="bots"][data-v="0"]'); if (b) await b.click(); }
  await wait(300);
  await page.evaluate(() => { setTimeout(() => document.querySelector('#lbGo').click(), 0); });
  await page.waitForFunction(() => { const T = window.__T; return T.S.players.get('h')?.alive && (T.S.st.mode !== 'zombies' || T.Z.on); }, null, { timeout: 240000 });
  await wait(espera ?? (mode === 'zombies' ? 30000 : 12000));
  await page.evaluate(() => { document.querySelector('#click')?.classList.add('hidden'); });
  // a partida não acaba (o mata-mata dura 10 min) e o laço do jogo não desenha nada entre as fotos (o SwiftShader é lento)
  await page.evaluate(() => { const T = window.__T; if (T.S.st.mode !== 'zombies') T.S.phaseEnd = T.NOW + 1e7;
    const r = T.renderer, o = r.render.bind(r); r.render = (s, c) => { if (window.__noRender) return; return o(s, c); }; window.__noRender = true; });
}

export const ev = (page, fn, arg) => page.evaluate(([src, a]) => (new Function('T', 'arg', `return (${src})(T, arg)`))(window.__T, a), [fn.toString(), arg]);

// dá a arma e equipa; espera a arma da mão ficar pronta (pacote fps2 montado quando houver)
export async function dar(page, id, { att = null, wxp = true, esperaFps2 = true, ms = 30000 } = {}) {
  await ev(page, (T, { id, att, wxp }) => {
    const w = T.W[id]; const slot = w.slot === 'secondary' ? 'secondary' : w.slot === 'primary' ? 'primary' : w.slot;
    if (T.PROF.data) {
      T.PROF.data.wxp = T.PROF.data.wxp || {}; T.PROF.data.att = T.PROF.data.att || {};
      if (wxp) T.PROF.data.wxp[w.base || id] = 1e9;
      T.PROF.data.att[w.base || id] = att || [];
    }
    window.__simLock = false; T.G.reloadEnd = 0; T.G.reload = null; T.G.adsHold = false; T.G.ads = 0; T.G.scope = 0;
    T.G.inv[slot] = id; T.G.ammo[id] = { mag: w.mag, res: 90 };
    T.equip(id, true); T.G.switchEnd = 0;
  }, { id, att, wxp });
  const t0 = Date.now();
  if (esperaFps2) {
    const quer = await ev(page, (T, id) => !!T.fpw(id), id);
    while (quer && Date.now() - t0 < ms) {
      const ok = await ev(page, (T, id) => { if (T.vmGun?.userData.fps2) return true; T.equip(id, true); T.G.switchEnd = 0; return !!T.vmGun?.userData.fps2; }, id);
      if (ok) break; await wait(800);
    }
  }
  await wait(300);
  return ev(page, T => ({ fps2: !!T.vmGun?.userData.fps2, arms: !!T.vmGun?.userData.armsGun, vox: (() => { let n = 0; T.vmGun?.traverse(o => { if (o.userData?.vox) n++; }); return n; })() }));
}

// deixa a arma parada (sem balanço), com ou sem mira; avança a simulação com o tempo travado a partir do relógio atual
export async function pose(page, { ads = 0, s = 1.2, extra = null } = {}) {
  await ev(page, (T, { ads, s }) => {
    window.__simNow = T.NOW; if (T.S.st.mode !== 'zombies') T.S.phaseEnd = T.NOW + 1e7; T.me.vel.set(0, 0, 0); T.me.sprinting = false; T.me.crouch = false; T.G.switchEnd = 0; T.G.reloadEnd = 0; T.G.reload = null;
    T.G.adsHold = !!ads; T.G.kick = 0; T.G.lastShot = -99; if (T.me.pitch !== undefined) T.me.pitch = 0;
    T.sim(s);
  }, { ads, s });
}

// quadro do jogo (renderScene) só com a primeira pessoa (mundo escondido, fundo neutro), luz de dia opcional (mesma luz nos dois modos)
export async function shot(page, file, { fundo = 0x7d8288, dia = true, mundo = false } = {}) {
  const b64 = await page.evaluate(async ({ fundo, dia, mundo }) => {
    const THREE = await import('three'); const T = window.__T, r = T.renderer, sc = T.scene;
    const L = T.vmScene.children.filter(o => o.isLight), sv = L.map(o => [o.color.getHex(), o.intensity, o.groundColor?.getHex()]);
    const mats = [];
    if (dia) {
      const hemi = L.find(o => o.isHemisphereLight), [key, rim] = L.filter(o => o.isDirectionalLight);
      hemi.color.setHex(0xffffff); hemi.groundColor.setHex(0x555555); hemi.intensity = 1.1; key.color.setHex(0xfff2e0); key.intensity = 2.2; rim.color.setHex(0xbcd4ff); rim.intensity = 1.2;
      T.vmScene.traverse(o => { if (o.isMesh) for (const m of [o.material].flat()) if (m && m.userData?.env != null) { mats.push([m, m.envMapIntensity]); m.envMapIntensity = m.userData.env; } });
    }
    const vis = sc.visible, bg = sc.background, cc = r.getClearColor(new THREE.Color()), ca = r.getClearAlpha();
    if (!mundo) { sc.visible = false; sc.background = new THREE.Color(fundo); r.setClearColor(fundo, 1); }
    const nr = window.__noRender; window.__noRender = false;
    T.renderScene();
    const url = r.domElement.toDataURL('image/png'); window.__noRender = nr;
    sc.visible = vis; sc.background = bg; r.setClearColor(cc, ca);
    L.forEach((o, i) => { o.color.setHex(sv[i][0]); o.intensity = sv[i][1]; if (o.groundColor) o.groundColor.setHex(sv[i][2]); });
    for (const [m, v] of mats) m.envMapIntensity = v;
    return url.split(',')[1];
  }, { fundo, dia, mundo });
  await writeFile(file, Buffer.from(b64, 'base64'));
  return file;
}

// números da arma na mão (malhas visíveis, triângulos, voxels, pacote, clipes)
export const stats = page => ev(page, T => {
  const g = T.vmGun; if (!g) return null; let meshes = 0, tris = 0, vox = 0, voxTris = 0, voxBraco = 0;
  g.traverse(o => { if (!o.isMesh) return; for (let p = o; p; p = p.parent) if (!p.visible) return;
    const gg = o.geometry; if (!gg?.attributes?.position) return; const n = (gg.index ? gg.index.count : gg.attributes.position.count) / 3;
    if (o.name === 'voxBraco') voxBraco += n; else if (o.userData.vox) { vox++; voxTris += n; } else { meshes++; tris += n; } });
  const F = g.userData.fps2, ud = g.userData;
  return { fps2: !!F, pack: F?.P ? Object.keys(T.FPK).find(k => T.FPK[k] === F.P) : null, clips: F ? Object.keys(F.clips) : null, follow: F?.follow?.length ?? null,
    meshes, tris: Math.round(tris), vox, voxTris: Math.round(voxTris), voxBraco: Math.round(voxBraco), arms: !!ud.armsGun, rig: ud.rig || null, mag: !!ud.mag, slide: !!ud.slide, bolt: !!ud.bolt, pump: !!ud.pump, cyl: !!ud.cyl, brk: !!ud.brk, akimbo: !!ud.akimbo, fab: ud.fab || null };
});

// quadro no meio da recarga (frac 0..1 da recarga)
export async function recarga(page, frac = .45, vazia = false) {
  await ev(page, (T, { frac, vazia }) => {
    window.__simNow = T.NOW; const w = T.W[T.G.cur]; T.G.adsHold = false; T.G.ads = 0; T.sim(.3);
    const a = T.G.ammo[T.G.cur]; if (a) { a.mag = vazia ? 0 : Math.max(0, Math.floor(w.mag / 2)); a.res = 90; }
    T.startReload(); const dur = (T.G.reloadEnd - T.NOW); T.sim(Math.max(.05, dur * frac));
  }, { frac, vazia });
}
