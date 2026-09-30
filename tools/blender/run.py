# Roda etapas do pipeline no Blender em segundo plano (sem janela). Uso:
#   blender -b [arquivo.blend] --python run.py -- etapa1.py+lib.py,etapa2.py ...
# Cada etapa é uma lista de arquivos concatenados (como o bl.py fazia pelo socket).
import bpy, sys, os, traceback
D = os.path.dirname(os.path.abspath(__file__))
steps = sys.argv[sys.argv.index('--') + 1:]
for st in steps:
    files = st.split('+')
    code = '\n'.join(open(os.path.join(D, f), encoding='utf-8').read() for f in files)
    print('=== etapa', st, flush=True)
    try: exec(compile(code, st, 'exec'), {'__name__': '__main__', 'bpy': bpy})
    except Exception: traceback.print_exc(); sys.exit(1)
