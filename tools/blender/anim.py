# Anima os braços. Tudo em relação à pose parada (HP/LP), em coordenadas da câmera (x direita, y cima, z frente).
# Linha do tempo (30 fps): parado 0-60, sacar 100-118, corte 200-213, corte de volta 300-313, estocada 400-425, inspecionar 500-596
import math
from mathutils import Euler
sc = bpy.context.scene; sc.render.fps = 30
cam = bpy.data.objects['Cam']; E = cam.location.copy()
def C(x, y, z): return E + Vector((-x, -z, y))
def D(x, y, z): return Vector((-x, -z, y))
Rcam = Matrix(((-1, 0, 0), (0, 0, -1), (0, 1, 0)))   # câmera → mundo (colunas: x, y, z da câmera)
for o in ('IK_r', 'IK_l', 'POLE_r', 'POLE_l'):
    ob = bpy.data.objects[o]; ob.animation_data_clear()
# soquetes das duas facas (filhos da mão) com um "giro" dentro, onde a faca do jogo é pendurada
exec(open(r'C:\Users\Costa\Claude\blender-tools\pose_test.py', encoding='utf-8').read())
thumb('r', TH); bpy.context.view_layer.update()
F0, N0, S0, W0 = pose_frame('r')
def mk_socket(kind):
    if kind == 'karambit': place_knife('karambit', Q=F0 * KQ[0] + N0 * KQ[1])
    else: place_knife('knife', P=S0 * KP[0] + F0 * KP[1] + N0 * KP[2], Q=N0 + F0 * .3)
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
    # pivô do giro: anel da karambit / meio do cabo da faca (em coordenadas do modelo no Blender: pomo = -Y, fio = -Z)
    piv = Vector((0, -.08, .006)) if kind == 'karambit' else Vector((0, -.05, .006))
    sp.location = piv; sp.rotation_mode = 'XYZ'; sp.rotation_euler = (0, 0, 0)
    k = bpy.data.objects['K_' + kind]; k.parent = sp; k.matrix_parent_inverse.identity(); k.location = -piv; k.rotation_euler = (0, 0, 0)
    sp.animation_data_clear()
    return sp
SPIN = {k: mk_socket(k) for k in ('karambit', 'knife')}
# base da pose parada
BASE = {'r': (Vector(HP['pos']), D(*HP['F']), D(*HP['N']), Vector(HP['pole'])), 'l': (Vector(LP['pos']), D(*LP['F']), D(*LP['N']), Vector(LP['pole']))}
def key(s, f, dp=(0, 0, 0), dr=(0, 0, 0), dpole=(0, 0, 0)):
    p, F, N, pole = BASE[s]
    R = Rcam @ Euler(dr, 'YXZ').to_matrix() @ Rcam.transposed()   # giro em eixos da câmera
    set_hand(s, C(*(p + Vector(dp))), F=R @ F, N=R @ N, pole=C(*(pole + Vector(dpole))), frame_=f)
def spin(f, a, kinds=('karambit', 'knife'), axis=0):
    for k in kinds:
        sp = SPIN[k]; e = [0, 0, 0]; e[axis] = a; sp.rotation_euler = e; sp.keyframe_insert('rotation_euler', frame=f)
def still(s, f): key(s, f)
# ---------- parado (respiração leve) ----------
for f, d in ((0, 0), (30, 1), (60, 0)):
    key('r', f, dp=(0, .004 * d, -.003 * d), dr=(.02 * d, 0, 0)); key('l', f, dp=(0, .005 * d, -.002 * d), dr=(.015 * d, 0, 0))
spin(0, 0); spin(60, 0)
# ---------- sacar: sobe de baixo; karambit dá uma volta no dedo, faca vira para a posição ----------
key('r', 100, dp=(.04, -.2, -.05), dr=(-.6, .2, .4)); key('l', 100, dp=(-.02, -.22, -.04), dr=(-.4, 0, 0))
key('r', 110, dp=(0, .015, 0), dr=(.1, 0, 0)); key('l', 112, dp=(0, .01, 0))
still('r', 118); still('l', 118)
spin(100, 0, ('karambit',)); spin(116, -2 * math.pi, ('karambit',))
spin(100, -1.8, ('knife',)); spin(112, 0, ('knife',)); spin(118, 0)
# ---------- corte: mão à direita com a lâmina deitada, varre rápido para a esquerda e a lâmina sobe ----------
key('r', 200)
key('r', 203, dp=(.06, .06, -.03), dr=(.3, -.45, -.4))
key('r', 207, dp=(-.17, .06, .09), dr=(0, 1.5, 1.1))
key('r', 209, dp=(-.18, .055, .085), dr=(0, 1.55, 1.15))
still('r', 216); key('l', 200); key('l', 206, dp=(-.02, -.02, 0)); still('l', 216)
spin(200, 0); spin(216, 0)
# ---------- corte de volta: da esquerda para a direita ----------
key('r', 300)
key('r', 303, dp=(-.12, .06, .07), dr=(0, 1.3, 1.0))
key('r', 307, dp=(.08, 0, .05), dr=(-.3, -.6, -.9))
key('r', 309, dp=(.085, -.005, .045), dr=(-.3, -.65, -.95))
still('r', 316); key('l', 300); key('l', 306, dp=(-.02, -.02, 0)); still('l', 316)
spin(300, 0); spin(316, 0)
# ---------- estocada: recolhe, empurra forte para a frente, segura, volta ----------
key('r', 400)
key('r', 408, dp=(.02, .05, -.08), dr=(.35, -.1, -.1))
key('r', 412, dp=(-.06, -.01, .16), dr=(-.25, .15, .05), dpole=(0, 0, .15))
key('r', 417, dp=(-.06, -.01, .15), dr=(-.25, .15, .05), dpole=(0, 0, .15))
still('r', 425); key('l', 400); key('l', 410, dp=(-.03, -.03, -.02)); still('l', 425)
spin(400, 0); spin(425, 0)
# ---------- inspecionar: traz para o meio mostrando a lâmina de chapa, gira o pulso para o outro lado, volta ----------
key('r', 500)
key('r', 512, dp=(-.06, .06, -.02), dr=(0, -.6, -1.2))
key('r', 540, dp=(-.065, .065, -.02), dr=(.05, -.65, -1.25))
key('r', 556, dp=(-.06, .06, -.02), dr=(-.4, 0, -2.2))
key('r', 584, dp=(-.06, .065, -.02), dr=(-.42, .05, -2.25))
still('r', 596); key('l', 500); key('l', 512, dp=(-.02, -.05, 0)); key('l', 584, dp=(-.02, -.05, 0)); still('l', 596)
spin(500, 0); spin(540, 0, ('karambit',)); spin(552, -2 * math.pi, ('karambit',)); spin(572, -2 * math.pi, ('karambit',)); spin(582, -4 * math.pi, ('karambit',)); spin(596, -4 * math.pi, ('karambit',))
spin(596, 0, ('knife',))
sc.frame_start, sc.frame_end = 0, 596
print('ok anim')
