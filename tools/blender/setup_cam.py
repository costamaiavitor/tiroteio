ensure_ik()
sc = bpy.context.scene
cam = bpy.data.objects.get('Cam')
if not cam:
    cd = bpy.data.cameras.new('Cam'); cam = bpy.data.objects.new('Cam', cd); sc.collection.objects.link(cam)
eye = bw('head') + Vector((0, -.06, .085 + .14))  # câmera acima do olho: antebraços sobem de baixo, como nos FPS
cam.location = eye; cam.rotation_euler = (math.radians(90), 0, math.radians(180))
print('eye', eye)
for s in 'rl': print(s, rest_frame(s))
