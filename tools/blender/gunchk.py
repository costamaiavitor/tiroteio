# Confere a pose de arma: cilindros de teste no punho (vertical, soquete direito) e no guarda-mão (horizontal, soquete esquerdo)
import os, time, bmesh
sc = bpy.context.scene; sc.frame_set(2000); bpy.context.view_layer.update()
for n in ('karambit', 'knife'):
    k = bpy.data.objects['K_' + n]
    for o in [k] + list(k.children_recursive): o.hide_render = True
def cyl(name, sock, r, length, axis):
    ob = bpy.data.objects.get(name)
    if ob: bpy.data.objects.remove(ob)
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=r, radius2=r, depth=length); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob)
    S = bpy.data.objects[sock].matrix_world
    R = Matrix.Rotation(math.radians(90), 4, 'X') if axis == 'y' else Matrix.Identity(4)
    ob.matrix_world = S @ R
    m = bpy.data.materials.get('chk') or bpy.data.materials.new('chk'); m.diffuse_color = (.8, .5, .1, 1); me.materials.append(m)
    return ob
import math
cyl('ChkR', 'GunSock_r', .014, .11, 'z'); cyl('ChkL', 'GunSock_l', .02, .2, 'y')
sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.color_type = 'MATERIAL'
v = bpy.data.objects.get('CloseCam')
if not v:
    d = bpy.data.cameras.new('CloseCam'); v = bpy.data.objects.new('CloseCam', d); sc.collection.objects.link(v)
for s, sock in (('r', 'GunSock_r'), ('l', 'GunSock_l')):
    S = bpy.data.objects[sock].matrix_world; o = S.translation; X, Y, Z = [S.col[i].xyz.normalized() for i in range(3)]
    for name, off in {'dir': X * .25 + Z * .05, 'esq': -X * .25 + Z * .05, 'frente': Y * .25 + Z * .05, 'cima': Z * .25 - Y * .05}.items():
        v.location = o + off; v.rotation_euler = (o - v.location).to_track_quat('-Z', 'Z' if name != 'cima' else 'Y').to_euler(); v.data.lens = 50; v.data.clip_start = .005
        old = sc.camera; sc.camera = v; sc.render.resolution_x = sc.render.resolution_y = 360
        sc.render.filepath = os.path.join(os.path.expanduser('~'), 'Claude', 'blender-tools', 'renders', 'g_%s_%s_%d.png' % (s, name, time.time()))
        bpy.ops.render.render(write_still=True); sc.camera = old
for n in ('ChkR', 'ChkL'): bpy.data.objects.remove(bpy.data.objects[n])
print('gun check ok')
