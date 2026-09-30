# Suaviza a malha: subdivisão aplicada antes do esqueleto (os pesos dos ossos são interpolados)
import bpy
o = bpy.data.objects['Arms']
if not o.get('subdivided'):
    m = o.modifiers.new('Subd', 'SUBSURF'); m.levels = 1; m.render_levels = 1
    while o.modifiers[0].name != 'Subd': bpy.ops.object.modifier_move_up({'object': o}, modifier='Subd') if False else o.modifiers.move(o.modifiers.find('Subd'), 0)
    with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o]):
        bpy.ops.object.modifier_apply(modifier='Subd')
    o['subdivided'] = 1
print(len(o.data.vertices), [m.name for m in o.modifiers])
