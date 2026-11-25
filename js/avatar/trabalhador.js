// Worker dos avatares: recebe { id, cod, nivel } (código compacto, já validado no jogo) e devolve as peças assadas
// (arrays transferidos, sem cópia). O index.html cria este Worker por um blob (a CSP só aceita worker-src blob:) que importa
// este arquivo com import() e guarda em self.__q os pedidos que chegam antes de o módulo carregar.
import { gerarPartes, decodificar } from './avatar.js';
function tratar({ id, cod, nivel }) {
  try { const r = gerarPartes(decodificar(cod), nivel); postMessage({ id, r }, r.tr); }
  catch (err) { postMessage({ id, err: String(err && err.stack || err) }); }
}
onmessage = e => tratar(e.data);
for (const d of self.__q || []) tratar(d);
self.__q = null;
postMessage({ pronto: true });
