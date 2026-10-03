// Servidor estático mínimo para os testes: serve a pasta do jogo em http://127.0.0.1:PORTA.
// Só leitura de arquivos dentro da pasta do projeto (sem ../). Não tem nada de produção aqui:
// o jogo real é servido pelo GitHub Pages.
import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.css': 'text/css', '.md': 'text/markdown' };

export function iniciarServidor(porta = 0) {
  const srv = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    // Sequência inválida (ex.: "/%") lança URIError; sem o try/catch ela derrubaria o processo inteiro do node --test.
    let rel; try { rel = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end(); }
    if (rel.endsWith('/')) rel += 'index.html';
    // Nada de ponto-arquivos (.git, .env) nem pastas/arquivos de desenvolvimento. tools/ continua servido:
    // as ferramentas de dev são importadas pelo navegador em tools/*.js.
    if (/^\/(\.[^/]*|node_modules|_sk|docs|tests|package\.json|pnpm-lock\.yaml)(\/|$)/.test(rel)) { res.writeHead(404); return res.end(); }
    const abs = path.resolve(RAIZ, '.' + rel);
    if (!abs.startsWith(RAIZ + path.sep) && abs !== RAIZ) { res.writeHead(403); return res.end(); }
    let st; try { st = statSync(abs); } catch { res.writeHead(404); return res.end('não achei ' + rel); }
    if (!st.isFile()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream', 'content-length': st.size, 'cache-control': 'no-store' });
    createReadStream(abs).pipe(res);
  });
  return new Promise(resolve => srv.listen(porta, '127.0.0.1', () => resolve({ srv, porta: srv.address().port, url: `http://127.0.0.1:${srv.address().port}/` })));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { url } = await iniciarServidor(+process.env.PORTA || 8765);
  console.log('Jogo em ' + url);
}
