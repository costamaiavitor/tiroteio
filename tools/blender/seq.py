# Renderiza uma sequência de quadros (SEQ) de uma faca (KIND) em PNGs pequenos: renders/seq_<prefixo>_<quadro>.png
import os
sc = bpy.context.scene
for n in ('karambit', 'knife'):
    k = bpy.data.objects['K_' + n]
    for o in [k] + list(k.children_recursive): o.hide_render = o.hide_viewport = n != KIND
cam = bpy.data.objects['Cam']; sc.camera = cam
cam.data.sensor_fit = 'VERTICAL'; cam.data.angle_y = math.radians(62); cam.data.clip_start = .01
sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.color_type = 'MATERIAL'; sc.display.shading.show_cavity = True
sc.render.resolution_x, sc.render.resolution_y = 480, 270
for fr in SEQ:
    sc.frame_set(fr); bpy.context.view_layer.update()
    sc.render.filepath = os.path.join(os.path.expanduser('~'), 'Claude', 'blender-tools', 'renders', 'seq_%s_%04d.png' % (PFX, fr))
    bpy.ops.render.render(write_still=True)
print('seq ok')
