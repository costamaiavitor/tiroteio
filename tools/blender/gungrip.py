# Pose de mão para armas de fogo (quadro 2000), usada pelo IK do jogo:
#  - mão direita: médio, anelar e mindinho fechados num punho de pistola (vertical); indicador esticado no gatilho
#  - mão esquerda: os quatro dedos fechados em volta do guarda-mão (horizontal), polegar do outro lado
# Cria dois soquetes presos aos ossos das mãos (GunSock_r / GunSock_l) com eixos x = direita da arma,
# y = frente da arma, z = cima (no jogo viram x direita, y cima, z para trás). O jogo encaixa esses soquetes na arma.
import numpy as np
sc = bpy.context.scene
FR = 2000
def pw(n, tail=False):
    pb = rig.pose.bones[n]; return rig.matrix_world @ (pb.tail if tail else pb.head)
def circle(pts):
    P = np.array([list(p) for p in pts]); c0 = P.mean(0); U, S_, Vt = np.linalg.svd(P - c0); e1, e2 = Vt[0], Vt[1]
    xy = np.array([[(p - c0) @ e1, (p - c0) @ e2] for p in P]); A = np.c_[2 * xy, np.ones(len(xy))]; b = (xy ** 2).sum(1)
    cx, cy, k = np.linalg.lstsq(A, b, rcond=None)[0]
    return Vector(c0 + cx * e1 + cy * e2), float(np.sqrt(k + cx * cx + cy * cy))
def loop(s, f): return circle([pw(f'{f}_01_{s}'), pw(f'{f}_02_{s}'), pw(f'{f}_03_{s}'), pw(f'{f}_03_{s}', True)])
BASEC = [1.4, 1.5, 1.1]
def fit(s, fingers, target):
    for f in fingers:
        lo, hi = .45, 1.4
        for _ in range(22):
            mid = (lo + hi) / 2; curl(s, [f], [c * mid for c in BASEC]); bpy.context.view_layer.update()
            if loop(s, f)[1] > target[f]: lo = mid
            else: hi = mid
        curl(s, [f], [c * (lo + hi) / 2 for c in BASEC])
    bpy.context.view_layer.update()
    L = {f: loop(s, f) for f in fingers}
    cs = np.array([list(L[f][0]) for f in fingers]); c0 = cs.mean(0); A = Vector(np.linalg.svd(cs - c0)[2][0])
    return L, Vector(c0), A
def make_sock(name, s, M):
    so = bpy.data.objects.get(name)
    if not so:
        so = bpy.data.objects.new(name, None); sc.collection.objects.link(so); so.empty_display_size = .03
    so.parent = rig; so.parent_type = 'BONE'; so.parent_bone = f'hand_{s}'
    bpy.context.view_layer.update(); so.matrix_world = M; return so
def frame_m(x, y, z, o):
    return Matrix(((x.x, y.x, z.x, o.x), (x.y, y.y, z.y, o.y), (x.z, y.z, z.z, o.z), (0, 0, 0, 1)))
sc.frame_set(FR); bpy.context.view_layer.update()
# ---------- mão direita ----------
L, c0, A = fit('r', ['middle', 'ring', 'pinky'], {'middle': .021, 'ring': .02, 'pinky': .018})
if A.dot(L['middle'][0] - L['pinky'][0]) < 0: A = -A           # A: do mindinho para o médio = cima do punho
curl('r', ['index'], [.45, 1.0, .6])                              # indicador no gatilho
thumb('r', TH_R)
bpy.context.view_layer.update()
up = A; fwd = pw('middle_02_r') - L['middle'][0]; fwd = (fwd - fwd.dot(up) * up).normalized()
rt = fwd.cross(up)                                                  # direita = frente × cima
o = c0 + up * (up.dot(L['middle'][0] - c0))                         # altura do dedo médio
make_sock('GunSock_r', 'r', frame_m(rt, fwd, up, o))
# ---------- mão esquerda ----------
L2, c2, A2 = fit('l', FING, {'index': .026, 'middle': .027, 'ring': .026, 'pinky': .023})
if A2.dot(L2['index'][0] - L2['pinky'][0]) < 0: A2 = -A2         # A2: do mindinho para o indicador = frente
thumb('l', [(.3, 0, .2), (.3, 0, 0), (.2, 0, 0)])
bpy.context.view_layer.update()
fwd2 = A2; palm = (pw('hand_l') + pw('middle_01_l')) / 2
up2 = c2 - palm; up2 = (up2 - up2.dot(fwd2) * fwd2).normalized()   # da palma para o eixo do guarda-mão = cima
rt2 = fwd2.cross(up2)
o2 = c2 + fwd2 * (fwd2.dot(L2['middle'][0] - c2))
make_sock('GunSock_l', 'l', frame_m(rt2, fwd2, up2, o2))
# chaves dos dedos no quadro da pose de arma (e no seguinte, para virar um clipe)
FB = [f'{f}_0{i}_{sd}' for sd in 'rl' for f in FING + ['thumb'] for i in (1, 2, 3)]
for fr in (FR, FR + 1):
    for n in FB: rig.pose.bones[n].keyframe_insert('rotation_euler', frame=fr)
sc.frame_end = FR + 1
print('gun grip ok', [round(v, 3) for v in A], [round(v, 3) for v in A2])
