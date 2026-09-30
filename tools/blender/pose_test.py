cam = bpy.data.objects['Cam']; E = cam.location.copy()
def C(x, y, z): return E + Vector((-x, -z, y))   # ponto na câmera: x direita, y cima, z frente
def D(x, y, z): return Vector((-x, -z, y))       # direção na câmera
HP = globals().get('HP') or dict(pos=(.09, -.12, .3), F=(-.2, .05, 1), N=(.15, -1, -.1), pole=(.5, -.5, -.1))
LP = globals().get('LP') or dict(pos=(-.19, -.14, .3), F=(.4, .05, 1), N=(.5, -.85, 0), pole=(-.5, -.5, -.1))
set_hand('r', C(*HP['pos']), F=D(*HP['F']), N=D(*HP['N']), pole=C(*HP['pole']))
curl('r', FING, [1.4, 1.5, 1.1])
set_hand('l', C(*LP['pos']), F=D(*LP['F']), N=D(*LP['N']), pole=C(*LP['pole']))
for f_, c_ in zip(FING, ([.15, .22, .12], [.25, .32, .2], [.36, .42, .28], [.48, .5, .34])): curl('l', [f_], c_)   # mão esquerda solta: dedos mais fechados do indicador ao mindinho
thumb('l', [(.1, 0, .1), (.15, 0, 0), (.1, 0, 0)])
bpy.context.view_layer.update()
NAME = 'pose1'
