import bpy, os
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(os.path.expanduser('~'), 'Claude', 'blender-tools', SAVE_AS))
print('saved', SAVE_AS)
