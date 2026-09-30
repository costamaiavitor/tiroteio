# Renderiza a câmera "Cam" (mesmo campo de visão da câmera das mãos do jogo) para um PNG
import bpy, os
sc = bpy.context.scene
cam = bpy.data.objects.get('Cam')
if not cam:
    cd = bpy.data.cameras.new('Cam'); cam = bpy.data.objects.new('Cam', cd); sc.collection.objects.link(cam)
cd = cam.data; cd.sensor_fit = 'VERTICAL'; cd.angle_y = __import__('math').radians(62); cd.clip_start = .01
sc.camera = cam
sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'MATERIAL'
sc.display.shading.show_shadows = True; sc.display.shading.show_cavity = True
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 960, 540, 100
sc.render.film_transparent = False; sc.world.color = (.45, .5, .55) if sc.world else None
out = os.path.join(os.path.expanduser('~'), 'Claude', 'blender-tools', 'renders', '%s_%d.png' % ((globals().get('NAME') or 'view'), __import__('time').time()))
os.makedirs(os.path.dirname(out), exist_ok=True); sc.render.filepath = out
bpy.ops.render.render(write_still=True); print(out)
