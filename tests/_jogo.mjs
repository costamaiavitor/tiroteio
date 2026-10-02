// Apoio dos testes: abre o jogo num Chromium headless (Playwright) e cria uma sala como host, offline.
// O jogo expõe ganchos de depuração em window.__T (fim do index.html): estado do servidor (S, Z),
// do cliente (C, ZC, me), srvHandle via sendToHost, e sim(seg) que avança a simulação com o tempo travado.
//
// Rede: o servidor de pareamento do PeerJS é bloqueado (o jogo fica "offline", só o host). three.js e PeerJS vêm de
// ./vendor/; o Firebase e as fontes ainda vêm do Google, então os testes precisam de internet (sem ela o jogo também
// roda, só sem contas). Sem WebGL por hardware o Chromium usa SwiftShader (lento, mas funciona).
import { chromium } from 'playwright';
import { iniciarServidor } from './servidor.mjs';

export async function abrirJogo({ bloquearPeer = true, console: log = false } = {}) {
  const { srv, url } = await iniciarServidor(0);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  // Bloqueia o próprio script do PeerJS (./vendor/peerjs…): sem window.Peer o jogo cria a sala "offline" e nunca fala com o
  // servidor público de pareamento (o Playwright não intercepta WebSocket, então bloquear só o domínio não bastaria).
  if (bloquearPeer) await ctx.route(/peerjs/, r => r.abort());
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  if (log) page.on('console', m => console.log('[pág]', m.text()));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__T && !document.querySelector('#btnHost').disabled, null, { timeout: 60000 });
  const fechar = async () => { await browser.close(); srv.close(); };
  return { page, ctx, browser, url, erros, fechar };
}

// Cria a sala como host. mode: 'zombies' | 'dm' | 'rounds'. Devolve quando o host está vivo no mapa.
export async function criarSala(page, { mode = 'zombies', map = mode === 'zombies' ? 'sanatorio' : 'arena', bots = 0, zdiff = 1 } = {}) {
  await page.click(`#hostForm [data-mode="${mode}"]`);
  await page.click(`#hostForm [data-map="${map}"]`);
  if (mode === 'zombies') await page.click(`#hostForm [data-k="zdiff"][data-v="${zdiff}"]`);
  else await page.click(`#hostForm [data-k="bots"][data-v="${bots}"]`);
  await page.click('#btnHost'); // abre o lobby (menu novo); "Começar partida" inicia de fato
  await page.waitForSelector('#lbGo', { timeout: 60000 });
  await page.click('#lbGo');
  await page.waitForFunction(() => { const T = window.__T; return T.S.players.get('h')?.alive && (T.S.st.mode !== 'zombies' || T.Z.on); }, null, { timeout: 60000 });
  // trava o relógio: a partir daqui só T.sim(seg) avança o jogo (testes determinísticos)
  await page.evaluate(() => { window.__T.sim(0.1); });
}

// Avalia uma função dentro da página com T = window.__T.
export const noJogo = (page, fn, arg) => page.evaluate(([src, a]) => (new Function('T', 'arg', `return (${src})(T, arg)`))(window.__T, a), [fn.toString(), arg]);
