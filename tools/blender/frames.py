# renderiza vários quadros de uma vez: FRAMES = [(quadro, tipo)]
for FR, kind in FRAMES:
    bpy.context.scene.frame_set(FR); bpy.context.view_layer.update()
    for n in ('karambit', 'knife'):
        k = bpy.data.objects['K_' + n]
        for o in [k] + list(k.children_recursive): o.hide_render = o.hide_viewport = n != kind
    NAME = 'f%s%d' % (kind[0], FR)
    exec(open(r'C:\Users\Costa\Claude\blender-tools\render.py', encoding='utf-8').read())
