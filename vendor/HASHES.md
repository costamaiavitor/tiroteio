# vendor/ — dependências de execução copiadas para o repositório

Gerado em 02/10/2026 (Lote D do endurecimento, achado V08 / P1–P3 de `docs/seguranca/auditoria/08-dependencias.md`).
Mesmas versões que o `index.html` carregava das CDNs, byte a byte; só muda a origem (`./vendor/…` em vez de unpkg/jsDelivr).
Nenhum arquivo foi editado depois de copiado. O Firebase **não** está aqui: fica no gstatic por decisão do relatório (`relatorio_auditoria.md`, V08).

## Como reconferir

Na raiz do projeto, para um arquivo:

```
node -e "const c=require('crypto'),f=require('fs');console.log(c.createHash('sha384').update(f.readFileSync(process.argv[1])).digest('base64'))" vendor/peerjs@1.5.4/peerjs.min.js
```

ou, com OpenSSL:

```
openssl dgst -sha384 -binary vendor/peerjs@1.5.4/peerjs.min.js | openssl base64 -A
```

Para todos de uma vez (imprime bytes e hash de cada um):

```
node -e "const c=require('crypto'),f=require('fs'),p=require('path');(function w(d){for(const e of f.readdirSync(d,{withFileTypes:true})){const q=p.join(d,e.name);if(e.isDirectory())w(q);else if(e.name!=='HASHES.md'){const b=f.readFileSync(q);console.log(b.length+'\t'+c.createHash('sha384').update(b).digest('base64')+'\t'+q.split(p.sep).join('/'))}}})('vendor')"
```

O valor é o mesmo que entraria num atributo `integrity="sha384-…"`.

## Tabela

| Arquivo | Versão | Bytes | SHA-384 (base64) |
|---|---|---:|---|
| `vendor/peerjs@1.5.4/LICENSE` | 1.5.4 | 1.108 | `8dJL9gIzjoQcbihc+sNaRa2L4oamfl0m1GNQjroonXp4HZ9DTizTIRMocelG5F0B` |
| `vendor/peerjs@1.5.4/peerjs.min.js` | 1.5.4 | 92.865 | `nlUQ8ZqCbvStErob+biJNzSgltf6urV3VGqhfIfzhmg9RXmpeRm76ELw0pYnKlTR` |
| `vendor/three@0.160.0/build/three.module.js` | 0.160.0 | 1.272.972 | `61S/Nu32S3E5+n+KpCOTb2eRYps6fVKm+9Gz1QBvSePFthb46f063Aa/qe/lykFZ` |
| `vendor/three@0.160.0/examples/jsm/environments/RoomEnvironment.js` | 0.160.0 | 3.735 | `ZGqh+dJjt6z9NHsWYYt+TPDFj8y+2If7naI6a6AkkyNZyH51CVS3HTWFh0njp4k6` |
| `vendor/three@0.160.0/examples/jsm/geometries/RoundedBoxGeometry.js` | 0.160.0 | 4.625 | `S52/WAm3DaIIFna675h5dmavqea/akLlPFtPdnzgWWhnz+/nMqR6PPsSXPOd8Gpw` |
| `vendor/three@0.160.0/examples/jsm/loaders/GLTFLoader.js` | 0.160.0 | 108.522 | `oxY9vSeh7Mrt5WmhN8xfWoDRnmoW9krEiRBY7vJKaK90jMUidM0fhbUwcblpBgTu` |
| `vendor/three@0.160.0/examples/jsm/objects/MarchingCubes.js` | 0.160.0 | 38.025 | `j6MQ+4tROPfoG01YLkZzswNB+66fuwtNYSEBRs9nqqggZX6WIHGiq5PllKss2Cnh` |
| `vendor/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js` | 0.160.0 | 4.651 | `L+Ns9skCAqjab7aG8LH5VLknBCoENW7p37sOj39jnITwlWZFabWc29JwzgYf6ygy` |
| `vendor/three@0.160.0/examples/jsm/postprocessing/MaskPass.js` | 0.160.0 | 2.231 | `SDM80tiGflO8UDV/QzR/mASjcc/+wF7KfRVFNHJUIPcTctwoPI8GoWVTlccZw7V4` |
| `vendor/three@0.160.0/examples/jsm/postprocessing/OutputPass.js` | 0.160.0 | 2.398 | `RJJc+pg+Ue2ZwXlf8n78cPHMiHrqfr+AxxabF5vkXMXjNPF6nSUoqb20IQXkMo6c` |
| `vendor/three@0.160.0/examples/jsm/postprocessing/Pass.js` | 0.160.0 | 1.706 | `gSqIFh8vMmp1veyOysIS3KPVUl/A5JPefYvW4b89OeYeW0bwkrjN7qcC1h0XJK/K` |
| `vendor/three@0.160.0/examples/jsm/postprocessing/RenderPass.js` | 0.160.0 | 1.915 | `LwKrkOBAkmQ2KT4cv6P6q9Rb9L01GIFU34Zp16tGWZoBnrVuujfjpYZb7OxEMb0J` |
| `vendor/three@0.160.0/examples/jsm/postprocessing/ShaderPass.js` | 0.160.0 | 1.576 | `zetU6HhR/vTtgSvnS9DE+GQPZhVT/ZOSLa/1+DSM6rkM9hvBgQWr9bCEosZt93ch` |
| `vendor/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js` | 0.160.0 | 12.406 | `R734/7SvtqjjeteDKG4qcQA0adDCZ1ZcKfYUZsbVr9qqHGlgSXH9eNN4b3NIgwuc` |
| `vendor/three@0.160.0/examples/jsm/shaders/CopyShader.js` | 0.160.0 | 571 | `kzVlcj2amFaRNIWZ5zE0PmIN+QTNWWvrgKk31S8N/7w0nf7Qq3xqxHRLbD2UPPSl` |
| `vendor/three@0.160.0/examples/jsm/shaders/LuminosityHighPassShader.js` | 0.160.0 | 1.192 | `621kiA/kIdX8rtH6VU6+SwMVx+B8g7MQ6x0fei5dZVX3CQZSLkpOlglIk9sxE+/g` |
| `vendor/three@0.160.0/examples/jsm/shaders/OutputShader.js` | 0.160.0 | 1.393 | `fT4woAJJtXcAxElHG1cGfIZkiSxaj7u+24LHlfNVDZZ9aSjZvr2emMGPmcD9eF0V` |
| `vendor/three@0.160.0/examples/jsm/utils/BufferGeometryUtils.js` | 0.160.0 | 31.906 | `jHGXS4+FuVOBnZkNme2ury3Ccg5DWDLYK22xX/WGdZCZsjRM4J+3n6Qc4CXx1Hjf` |
| `vendor/three@0.160.0/examples/jsm/utils/SkeletonUtils.js` | 0.160.0 | 8.007 | `oipDsNi7yyq1H7gmTrR5wzMQeLavOwnYqWjajKnOmxVTgtE3xmr06+oQL1OOuXLI` |
| `vendor/three@0.160.0/LICENSE` | 0.160.0 | 1.081 | `mUeSINM7srxm4QxsF/D79MqN53C5HNrAHfMITQbcYB4ik6l1vyy16IQ8CvUVdIDK` |
| `vendor/webxr-generic-hand@1.0.20/left.glb` | 1.0.20 | 94.572 | `7Pa06sSRgK+kkpzKYwJs2/vO3fKvauLR9VhjYGLFw7WnHpiMc1UVbgpoZYdsN1Lv` |
| `vendor/webxr-generic-hand@1.0.20/LICENSE.md` | 1.0.20 | 1.094 | `ytgkuiUZvtn+884CZtPBKXVBMbzgdVfYjFcNgW+/7F8Pz+H5GuejZloOTki/zHgl` |
| `vendor/webxr-generic-hand@1.0.20/right.glb` | 1.0.20 | 94.004 | `NZt2IvhyrLdf8ae06IYpfZhWSb6XRxi/Gbh6Upyjq2jfkLnRCsaMGd4vJ60iptH/` |

23 arquivos, 1.782.555 bytes.

Os hashes de `peerjs.min.js` e `three.module.js` são os mesmos que a auditoria calculou a partir dos arquivos baixados das CDNs em 02/10/2026 (`08-dependencias.md`, tabela "Hashes dos arquivos de CDN").

## Origens

- `vendor/peerjs@1.5.4/`: tarball npm `peerjs-1.5.4.tgz` (`npm pack peerjs@1.5.4`, sha512 `yFsoLMnurJKlQbx6kVSBpOp+AlNldY1JQS2BrSsHLKCZnq6t7saHleuHM5svuLNbQkUJXHLF3sKOJB1K0xulOw==`), caminho `package/dist/peerjs.min.js` e `package/LICENSE`; idêntico ao que `https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js` e o jsDelivr servem.
- `vendor/three@0.160.0/`: tarball npm `three-0.160.0.tgz` (`npm pack three@0.160.0`, sha512 `DLU8lc0zNIPkM7rH5/e1Ks1Z8tWCGRq6g8mPowdDJpw1CFBJMU7UoJjC6PefXW7z//SSl0b2+GCw14LB+uDhng==`), mesmo caminho relativo dentro de `package/` (`build/`, `examples/jsm/`, `LICENSE`); é o que `https://cdn.jsdelivr.net/npm/three@0.160.0/` serve. Só os 16 addons alcançados pelos imports do jogo foram copiados (rastreio transitivo descrito em `docs/seguranca/vendor-edicao.md`).
- `vendor/webxr-generic-hand@1.0.20/`: `right.glb` e `left.glb` baixados de `https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/` (a URL que o jogo usava; `@1.0` resolvido para 1.0.20 pela API `data.jsdelivr.com/v1/package/resolve/npm/@webxr-input-profiles/assets@1.0` em 02/10/2026, e 1.0.20 é a maior 1.0.x no npm); bytes idênticos ao tarball npm `@webxr-input-profiles/assets@1.0.20` (`package/dist/profiles/generic-hand/`). `LICENSE.md` (MIT, Amazon 2019) é o `package/LICENSE.md` do mesmo tarball.

## Ao atualizar

1. Baixar a versão nova pelo `npm pack` (nunca editar à mão), copiar para uma pasta nova `vendor/<pacote>@<versão>/`.
2. Recalcular esta tabela com o comando acima e registrar a data.
3. Apontar `index.html` (l. 274, 276 e `loadHands`) para a pasta nova e apagar a antiga.
