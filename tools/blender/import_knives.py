import bpy, os
for n in ['karambit', 'knife']:
    old = bpy.data.objects.get('K_' + n)
    if old:
        for c in list(old.children_recursive): bpy.data.objects.remove(c)
        bpy.data.objects.remove(old)
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(os.path.expanduser('~'), 'Claude', 'blender-tools', 'assets', n + '.glb'))
    new = [o for o in bpy.data.objects if o not in before]
    root = bpy.data.objects.new('K_' + n, None); bpy.context.scene.collection.objects.link(root); root.empty_display_size = .02
    for o in new:
        if o.parent is None: o.parent = root
    print(n, len(new), [o.type for o in new][:5])
