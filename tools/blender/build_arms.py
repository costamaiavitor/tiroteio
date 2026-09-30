# Monta os braços de primeira pessoa a partir de um humano do MPFB (CC0): corta o resto do corpo,
# veste luva e manga, e cria os controles de IK para posar/animar.
import bpy, bmesh, math
from mathutils import Vector, Matrix
from bl_ext.blender_org.mpfb.services.humanservice import HumanService

for o in list(bpy.data.objects): bpy.data.objects.remove(o)
for a in list(bpy.data.actions): bpy.data.actions.remove(a)
bm_obj = HumanService.create_human(mask_helpers=False, detailed_helpers=False)
rig = HumanService.add_builtin_rig(bm_obj, "game_engine")
bm_obj.name, rig.name = "Arms", "ArmsRig"
# assa as shape keys do MPFB na malha (senão cortar/mexer nos vértices distorce tudo)
arm_mod = bm_obj.modifiers.get('Armature'); arm_mod.show_viewport = False
dg = bpy.context.evaluated_depsgraph_get(); ev = bm_obj.evaluated_get(dg)
cos = [v.co.copy() for v in ev.data.vertices]
bm_obj.shape_key_clear()
for v, c in zip(bm_obj.data.vertices, cos): v.co = c
arm_mod.show_viewport = True
# o "pés no chão" do MPFB sobe a malha mas não o esqueleto: realinha pela média dos ossos do antebraço/dedos
gidx = {g.name: g.index for g in bm_obj.vertex_groups}; offs = []
for n in ['lowerarm_r', 'lowerarm_l', 'middle_02_r', 'middle_02_l', 'thumb_02_r']:
    pts = [v.co for v in bm_obj.data.vertices if any(g.group == gidx[n] and g.weight > .8 for g in v.groups)]
    b = rig.data.bones[n]; offs.append(sum(pts, Vector()) / len(pts) - (b.head_local + b.tail_local) / 2)
dz = sum(o.z for o in offs) / len(offs)
for v in bm_obj.data.vertices: v.co.z -= dz
print('offset z', round(dz, 4))

ARM = {}
for s in 'lr':
    for n in ['lowerarm', 'hand'] + [f'{f}_0{i}' for f in ['index', 'middle', 'ring', 'pinky', 'thumb'] for i in (1, 2, 3)]:
        ARM[f'{n}_{s}'] = 'hand' if n != 'lowerarm' else 'lower'
    ARM[f'upperarm_{s}'] = 'upper'
gi = {g.index: g.name for g in bm_obj.vertex_groups}
me = bm_obj.data
keep, glove = set(), set()
for v in me.vertices:
    best, bw = None, 0
    for g in v.groups:
        n = gi[g.group]
        if n in ARM or n.startswith(('clavicle', 'spine', 'neck', 'head', 'pelvis', 'thigh', 'calf', 'foot', 'ball')):
            if g.weight > bw: best, bw = n, g.weight
    if best in ARM:
        kind, side = ARM[best], best[-1]
        if kind == 'upper':
            b = rig.data.bones[best]; h, t = b.head_local, b.tail_local
            k = (v.co - h).dot(t - h) / (t - h).length_squared
            if k < .45: continue
        keep.add(v.index)
        if kind == 'hand': glove.add(v.index)
        if kind == 'lower':
            b = rig.data.bones[best]; h, t = b.head_local, b.tail_local
            if (v.co - h).dot(t - h) / (t - h).length_squared > .9: glove.add(v.index)
def mat(name, col, rough):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*col, 1); p.inputs['Roughness'].default_value = rough; m.diffuse_color = (*col, 1)
    return m
me.materials.clear(); me.materials.append(mat('glove', (.035, .033, .032), .55)); me.materials.append(mat('sleeve', (.22, .2, .15), .85))
bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table(); bm.normal_update()
for f in bm.faces: f.material_index = 0 if all(v.index in glove for v in f.verts) else 1
# manga mais grossa que o braço (tecido por cima), luva justa
for v in bm.verts:
    if v.index in keep: v.co += v.normal * (.0035 if v.index in glove else .012)
bmesh.ops.delete(bm, geom=[bm.verts[i] for i in range(len(bm.verts)) if i not in keep], context='VERTS')
bm.to_mesh(me); bm.free()
for p in me.polygons: p.use_smooth = True
print('verts', len(me.vertices))
