# Encaixe de verdade: abre/fecha cada dedo até o túnel do punho ter o tamanho do cabo e
# alinha o eixo do cabo com os centros dos dedos. O indicador passa pelo anel da karambit.
import numpy as np
exec(open(r'C:\Users\Costa\Claude\blender-tools\pose_test.py', encoding='utf-8').read())
thumb('r', TH); bpy.context.view_layer.update()
def pw(n, tail=False):
    pb = rig.pose.bones[n]; return rig.matrix_world @ (pb.tail if tail else pb.head)
def circle(pts):
    P = np.array([list(p) for p in pts]); c0 = P.mean(0); U, S_, Vt = np.linalg.svd(P - c0); e1, e2 = Vt[0], Vt[1]
    xy = np.array([[(p - c0) @ e1, (p - c0) @ e2] for p in P]); A = np.c_[2 * xy, np.ones(len(xy))]; b = (xy ** 2).sum(1)
    cx, cy, k = np.linalg.lstsq(A, b, rcond=None)[0]
    return Vector(c0 + cx * e1 + cy * e2), float(np.sqrt(k + cx * cx + cy * cy))
def loop(f): return circle([pw(f'{f}_01_r'), pw(f'{f}_02_r'), pw(f'{f}_03_r'), pw(f'{f}_03_r', True)])
BASEC = [1.4, 1.5, 1.1]
TARGET = globals().get('TARGET') or {'index': .0285, 'middle': .0285, 'ring': .0275, 'pinky': .024}
CURL = {}
for f in FING:
    lo, hi = .45, 1.3
    for _ in range(22):   # mais dobra = círculo menor
        mid = (lo + hi) / 2; curl('r', [f], [c * mid for c in BASEC]); bpy.context.view_layer.update()
        if loop(f)[1] > TARGET[f]: lo = mid
        else: hi = mid
    CURL[f] = [round(c * (lo + hi) / 2, 4) for c in BASEC]; curl('r', [f], CURL[f])
bpy.context.view_layer.update()
L = {f: loop(f) for f in FING}
cs = np.array([list(L[f][0]) for f in FING]); c0 = cs.mean(0); A = Vector(np.linalg.svd(cs - c0)[2][0])
if A.dot(L['index'][0] - L['pinky'][0]) < 0: A = -A   # A: do mindinho para o indicador
off = [round((Vector(cs[i]) - Vector(c0) - A * A.dot(Vector(cs[i]) - Vector(c0))).length, 4) for i in range(4)]
print('CURL', CURL); print('radii', {f: round(L[f][1], 4) for f in FING}, 'off-axis', off)
F, N, S, W = pose_frame('r')
def on_axis(p): return Vector(c0) + A * A.dot(p - Vector(c0))
# ---- soquetes das duas facas, calculados pelo túnel ----
def socket_matrix(kind):
    if kind == 'karambit':
        Yb = -A                                   # -Y (anel) aponta para o indicador
        C = -N * KQ2[0] + F * KQ2[1]; C = (C - C.dot(A) * A).normalized()   # curva da garra (-Z)
        Zb = -C; X = Yb.cross(Zb)
        R = Matrix((X, Yb, Zb)).transposed()
        ring = Vector((0, -.08, .006))            # centro do anel no modelo (Blender)
        P = on_axis(L['index'][0]) + A * .004     # anel em volta do indicador
        return Matrix.Translation(P - R @ ring) @ R.to_4x4()
    else:
        Yb = A                                     # lâmina (+Y) sai pelo lado do polegar/indicador
        E = N - N.dot(A) * A; Zb = -E.normalized()  # fio (-Z) para o lado dos dedos
        X = Yb.cross(Zb); R = Matrix((X, Yb, Zb)).transposed()
        grip = Vector((0, -.022, .01))             # ponto do cabo logo atrás da guarda (Blender)
        P = on_axis(L['index'][0])
        return Matrix.Translation(P - R @ grip) @ R.to_4x4()
KQ2 = globals().get('KQ2') or (.85, .55)
for kind in ('karambit', 'knife'):
    place_knife(kind)                              # cria/prende tudo no soquete
    so = bpy.data.objects['Socket_r']; so.matrix_world = socket_matrix(kind)
    bpy.context.view_layer.update()
    globals()['SOCK_' + kind] = so.matrix_world.copy()
import json
open(r'C:\Users\Costa\Claude\blender-tools\grip.json', 'w').write(json.dumps({'curl': CURL}))
place_knife(KIND); bpy.data.objects['Socket_r'].matrix_world = globals()['SOCK_' + KIND]; bpy.context.view_layer.update()
