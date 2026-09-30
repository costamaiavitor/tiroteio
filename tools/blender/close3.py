# Closes da mão direita por 4 ângulos (para ver se os dedos envolvem o cabo)
import os, time
sc = bpy.context.scene
v = bpy.data.objects.get('CloseCam')
if not v:
    d = bpy.data.cameras.new('CloseCam'); v = bpy.data.objects.new('CloseCam', d); sc.collection.objects.link(v)
F, N, S, W = pose_frame('r'); tgt = W + F * .07 + N * .02
sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.color_type = 'MATERIAL'; sc.display.shading.show_cavity = True
views = {'dorso': -N * .3 + F * .05, 'palma': N * .3 - S * .05, 'polegar': -S * .3 + F * .05, 'frente': F * .3 + N * .08}
for name, off in views.items():
    v.location = tgt + off; up = F if name != 'frente' else -N
    v.rotation_euler = (tgt - v.location).to_track_quat('-Z', 'Y').to_euler(); v.data.lens = 50; v.data.clip_start = .005
    q = (tgt - v.location).to_track_quat('-Z', 'Y')
    old = sc.camera; sc.camera = v; sc.render.resolution_x = sc.render.resolution_y = 420
    sc.render.filepath = os.path.join(os.path.expanduser('~'), 'Claude', 'blender-tools', 'renders', 'c_%s_%s_%d.png' % (KIND, name, time.time()))
    bpy.ops.render.render(write_still=True); sc.camera = old
print('closes ok')
