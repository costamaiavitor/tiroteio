# Testa poses de golpe no quadro 1900 (fora das animações): TRY = [(dp, dr)], KIND = faca
from mathutils import Euler
cam = bpy.data.objects['Cam']; E = cam.location.copy()
def C(x, y, z): return E + Vector((-x, -z, y))
def D(x, y, z): return Vector((-x, -z, y))
Rcam = Matrix(((-1, 0, 0), (0, 0, -1), (0, 1, 0)))
POSES = {
    'karambit': dict(pos=(.09, -.12, .3), F=(-.25, .05, 1), N=(.15, -1, -.1), pole=(.4, -.75, -.1)),
    'knife': dict(pos=(.11, -.14, .3), F=(-.25, -.55, .8), N=(-1, .05, -.15), pole=(.5, -.6, -.1)),
}
p = POSES[KIND]; BASE = (Vector(p['pos']), D(*p['F']), D(*p['N']), Vector(p['pole']))
for n in ('karambit', 'knife'):
    k = bpy.data.objects['K_' + n]
    for o in [k] + list(k.children_recursive): o.hide_render = o.hide_viewport = n != KIND
for i, (dp, dr) in enumerate(TRY):
    pp, F, N, pole = BASE
    R = Rcam @ Euler(dr, 'YXZ').to_matrix() @ Rcam.transposed()
    set_hand('r', C(*(pp + Vector(dp))), F=R @ F, N=R @ N, pole=C(*pole), frame_=1900)
    bpy.context.scene.frame_set(1900); bpy.context.view_layer.update()
    NAME = 'try%d' % i
    exec(open(r'C:\Users\Costa\Claude\blender-tools\render.py', encoding='utf-8').read())
