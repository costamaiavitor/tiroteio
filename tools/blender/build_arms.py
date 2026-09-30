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
# região de cada vértice pela posição ao longo do antebraço (t = 0 cotovelo, 1 pulso): anel reto, sem serrilhado
def tpar(co, s):
    b = rig.data.bones[f'lowerarm_{s}']; h, t = b.head_local, b.tail_local
    return (co - h).dot(t - h) / (t - h).length_squared
keep, side, T = set(), {}, {}
for v in me.vertices:
    best, bw = None, 0
    for g in v.groups:
        n = gi[g.group]
        if n in ARM or n.startswith(('clavicle', 'spine', 'neck', 'head', 'pelvis', 'thigh', 'calf', 'foot', 'ball')):
            if g.weight > bw: best, bw = n, g.weight
    if best not in ARM: continue
    s = best[-1]
    if ARM[best] == 'upper':
        b = rig.data.bones[best]; h, t = b.head_local, b.tail_local
        if (v.co - h).dot(t - h) / (t - h).length_squared < .45: continue
    keep.add(v.index); side[v.index] = s
    T[v.index] = 2.0 if ARM[best] == 'hand' else tpar(v.co, s)
GL, CU = .93, .8   # luva a partir de 93% do antebraço; punho elástico entre 80% e 93%
def region(t): return 0 if t > GL else 2 if t > CU else 1   # 0 luva, 1 manga, 2 punho
def mat(name, col, rough):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*col, 1); p.inputs['Roughness'].default_value = rough; m.diffuse_color = (*col, 1)
    return m
me.materials.clear()
for n, c, r in (('glove', (.035, .033, .032), .55), ('sleeve', (.3, .28, .2), .9), ('cuff', (.06, .06, .065), .8)): me.materials.append(mat(n, c, r))
bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table(); bm.normal_update()
for f in bm.faces:
    if all(v.index in keep for v in f.verts):
        f.material_index = region(sum(T[v.index] for v in f.verts) / len(f.verts))
# espessuras: manga larga por cima, punho um pouco mais justo, luva colada
PUSH = {0: .0035, 1: .013, 2: .009}
for v in bm.verts:
    if v.index in keep: v.co += v.normal * PUSH[region(T[v.index])]
bmesh.ops.delete(bm, geom=[bm.verts[i] for i in range(len(bm.verts)) if i not in keep], context='VERTS')
bm.to_mesh(me); bm.free()
for p in me.polygons: p.use_smooth = True
print('verts', len(me.vertices))
