# Animações das duas facas, cada uma com a pose de mão própria e a faca encaixada pelo túnel do punho (fitgrip.py).
# Linha do tempo (30 fps). Karambit a partir do quadro 0, faca a partir do 1000:
#   parado +0-60, sacar +100-118, corte +200-216, corte de volta +300-316, estocada +400-425, inspecionar +500-596
import math
from mathutils import Euler
sc = bpy.context.scene; sc.render.fps = 30
cam = bpy.data.objects['Cam']; E = cam.location.copy()
def C(x, y, z): return E + Vector((-x, -z, y))
def D(x, y, z): return Vector((-x, -z, y))
Rcam = Matrix(((-1, 0, 0), (0, 0, -1), (0, 1, 0)))
POSES = {
    'karambit': dict(pos=(.09, -.12, .3), F=(-.25, .05, 1), N=(.15, -1, -.1), pole=(.4, -.75, -.1)),
    'knife': dict(pos=(.11, -.14, .3), F=(-.25, -.55, .8), N=(-1, .05, -.15), pole=(.5, -.6, -.1)),
}
FIT = r'C:\Users\Costa\Claude\blender-tools\fitgrip.py'
def clear_anim():
    for o in ('IK_r', 'IK_l', 'POLE_r', 'POLE_l'): bpy.data.objects[o].animation_data_clear()
clear_anim()
SPIN = {}
for KN in ('karambit', 'knife'):
    HP = POSES[KN]; KIND = KN
    exec(open(FIT, encoding='utf-8').read())   # (o fitgrip reusa a variável kind)
    kind = KN
    so = bpy.data.objects['Socket_r']; name = 'Sock_' + kind
    s2 = bpy.data.objects.get(name)
    if not s2:
        s2 = bpy.data.objects.new(name, None); sc.collection.objects.link(s2); s2.empty_display_size = .02
        s2.parent = rig; s2.parent_type = 'BONE'; s2.parent_bone = 'hand_r'
    s2.matrix_world = so.matrix_world.copy()
    sp = bpy.data.objects.get('Spin_' + kind)
    if not sp:
        sp = bpy.data.objects.new('Spin_' + kind, None); sc.collection.objects.link(sp); sp.empty_display_size = .015
    sp.parent = s2; sp.matrix_parent_inverse.identity()
    piv = Vector((0, -.08, .006)) if kind == 'karambit' else Vector((0, -.05, .006))
    sp.location = piv; sp.rotation_mode = 'XYZ'; sp.rotation_euler = (0, 0, 0); sp.animation_data_clear()
    k = bpy.data.objects['K_' + kind]; k.parent = sp; k.matrix_parent_inverse.identity(); k.location = -piv; k.rotation_euler = (0, 0, 0)
    SPIN[kind] = sp
    bpy.context.view_layer.update()
# o fitgrip da segunda faca rependura as duas no soquete temporário: devolve cada uma ao seu
for KN, sp in SPIN.items():
    piv = Vector((0, -.08, .006)) if KN == 'karambit' else Vector((0, -.05, .006))
    k = bpy.data.objects['K_' + KN]; k.parent = sp; k.matrix_parent_inverse.identity(); k.location = -piv; k.rotation_euler = (0, 0, 0)
clear_anim()
LPOSE = (Vector(LP['pos']), D(*LP['F']), D(*LP['N']), Vector(LP['pole']))
def key(s, f, dp=(0, 0, 0), dr=(0, 0, 0), dpole=(0, 0, 0)):
    p, F, N, pole = BASE if s == 'r' else LPOSE
    R = Rcam @ Euler(dr, 'YXZ').to_matrix() @ Rcam.transposed()
    set_hand(s, C(*(p + Vector(dp))), F=R @ F, N=R @ N, pole=C(*(pole + Vector(dpole))), frame_=f)
def spin(f, a, axis=0):
    sp = SPIN[KIND]; e = [0, 0, 0]; e[axis] = a; sp.rotation_euler = e; sp.keyframe_insert('rotation_euler', frame=f)
# ---------- movimentos: (quadro, deslocamento em m, giro em rad), eixos da câmera ----------
MOVES = {
  'karambit': KAR_MOVES,
  'knife': KNIFE_MOVES,
}
END = {'slash': 16, 'slash2': 16, 'stab': 25, 'inspect': 96}
START = {'slash': 200, 'slash2': 300, 'stab': 400, 'inspect': 500}
for kind, O in (('karambit', 0), ('knife', 1000)):
    KIND = kind; p = POSES[kind]; BASE = (Vector(p['pos']), D(*p['F']), D(*p['N']), Vector(p['pole']))
    for f, d in ((0, 0), (30, 1), (60, 0)):   # parado, respirando
        key('r', O + f, dp=(0, .004 * d, -.003 * d), dr=(.02 * d, 0, 0)); key('l', O + f, dp=(0, .005 * d, -.002 * d), dr=(.015 * d, 0, 0))
    spin(O, 0); spin(O + 60, 0)
    # sacar: sobe de baixo girando para a posição; a karambit dá uma volta no dedo
    key('r', O + 100, dp=(.04, -.2, -.05), dr=(-.6, .2, .4)); key('l', O + 100, dp=(-.02, -.22, -.04), dr=(-.4, 0, 0))
    key('r', O + 110, dp=(0, .015, 0), dr=(.1, 0, 0)); key('l', O + 112, dp=(0, .01, 0)); key('r', O + 118); key('l', O + 118)
    if kind == 'karambit': spin(O + 100, 0); spin(O + 116, -2 * math.pi); spin(O + 118, -2 * math.pi)
    else: spin(O + 100, -1.8); spin(O + 112, 0); spin(O + 118, 0)
    for mv, S0 in START.items():
        s0 = O + S0; key('r', s0); key('l', s0); spin(s0, 0)
        for f, dp, dr in MOVES[kind][mv]: key('r', s0 + f, dp=dp, dr=dr)
        key('l', s0 + (12 if mv == 'inspect' else 10), dp=(-.02, -.03 if mv == 'inspect' else -.02, 0))
        if mv == 'inspect': key('l', s0 + 84, dp=(-.02, -.03, 0))
        key('r', s0 + END[mv]); key('l', s0 + END[mv])
        if mv == 'inspect' and kind == 'karambit':
            spin(s0 + 40, 0); spin(s0 + 52, -2 * math.pi); spin(s0 + 72, -2 * math.pi); spin(s0 + 82, -4 * math.pi)
        spin(s0 + END[mv], -4 * math.pi if (mv == 'inspect' and kind == 'karambit') else 0)
# dedos e polegares: curvatura fixa, mas com chaves (sem chave o exportador manda a mão aberta do esqueleto)
FBONES = [f'{f}_0{i}_{sd}' for sd in 'rl' for f in FING + ['thumb'] for i in (1, 2, 3)]
for fr in (0, 1596):
    for n in FBONES: rig.pose.bones[n].keyframe_insert('rotation_euler', frame=fr)
sc.frame_start, sc.frame_end = 0, 1596
print('ok anim2')
