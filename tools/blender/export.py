# Exporta braços + esqueleto + soquetes das facas + câmera, com as animações assadas (30 fps)
import bpy, os
sc = bpy.context.scene
keep = {'Arms', 'ArmsRig', 'Cam', 'Sock_karambit', 'Sock_knife', 'Spin_karambit', 'Spin_knife'}
for o in bpy.context.view_layer.objects: o.select_set(o.name in keep)
bpy.context.view_layer.objects.active = bpy.data.objects['ArmsRig']
out = r'C:\Users\Costa\Claude\tiroteio\assets\arms.glb'
os.makedirs(os.path.dirname(out), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_cameras=True, export_animations=True,
    export_animation_mode='SCENE', export_force_sampling=True, export_bake_animation=True, export_frame_range=True,
    export_anim_single_armature=True, export_optimize_animation_size=True, export_def_bones=False, export_yup=True,
    export_apply=False, export_morph=False, export_texcoords=True, export_normals=True, export_materials='EXPORT', export_image_format='NONE')
print(out, os.path.getsize(out))
