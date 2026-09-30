# UV nova (smart project), materiais procedurais (camuflado de tecido, couro da luva, punho elástico) e
# "assa" tudo em duas texturas (cor + normal) para o jogo usar como imagens comuns.
import bpy, os
o = bpy.data.objects['Arms']; rig = bpy.data.objects['ArmsRig']
sc = bpy.context.scene
rig.data.pose_position = 'REST'
for ob in bpy.context.view_layer.objects: ob.select_set(ob == o)
bpy.context.view_layer.objects.active = o
# ---------- UV ----------
me = o.data
while len(me.uv_layers) > 1: me.uv_layers.remove(me.uv_layers[-1])
with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o], selected_editable_objects=[o]):
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=.004, area_weight=0, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')
# ---------- materiais procedurais ----------
def build(name, kind):
    m = bpy.data.materials[name]; nt = m.node_tree; nt.nodes.clear(); N, L = nt.nodes, nt.links
    out = N.new('ShaderNodeOutputMaterial'); p = N.new('ShaderNodeBsdfPrincipled'); L.new(p.outputs[0], out.inputs[0])
    tc = N.new('ShaderNodeTexCoord')
    def noise(scale, detail=2, rough=.5):
        n = N.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = scale; n.inputs['Detail'].default_value = detail; n.inputs['Roughness'].default_value = rough
        L.new(tc.outputs['Object'], n.inputs['Vector']); return n
    def bump(h, strength, dist, nrm=None):
        b = N.new('ShaderNodeBump'); b.inputs['Strength'].default_value = strength; b.inputs['Distance'].default_value = dist
        L.new(h, b.inputs['Height'])
        if nrm: L.new(nrm, b.inputs['Normal'])
        return b
    def wave(scale, direction):
        w = N.new('ShaderNodeTexWave'); w.wave_type = 'BANDS'; w.bands_direction = direction; w.inputs['Scale'].default_value = scale
        L.new(tc.outputs['Object'], w.inputs['Vector']); return w
    if kind == 'sleeve':   # camuflado de manchas + trama do tecido + dobras
        n1 = noise(7, 3, .55); cr = N.new('ShaderNodeValToRGB'); cr.color_ramp.interpolation = 'CONSTANT'
        els = cr.color_ramp.elements; els[0].position = 0; els[0].color = (.36, .32, .22, 1); els[1].position = .47; els[1].color = (.22, .23, .14, 1)
        e = els.new(.56); e.color = (.2, .15, .1, 1); e = els.new(.63); e.color = (.09, .09, .07, 1)
        L.new(n1.outputs['Fac'], cr.inputs['Fac'])
        dirt = noise(40, 4, .6); mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = .25
        L.new(cr.outputs['Color'], mix.inputs['A']); L.new(dirt.outputs['Color'], mix.inputs['B']); L.new(mix.outputs['Result'], p.inputs['Base Color'])
        w1, w2 = wave(600, 'X'), wave(600, 'Z')
        weave = N.new('ShaderNodeMath'); weave.operation = 'MULTIPLY'; L.new(w1.outputs['Fac'], weave.inputs[0]); L.new(w2.outputs['Fac'], weave.inputs[1])
        folds = noise(5, 2, .4)
        b1 = bump(folds.outputs['Fac'], .55, .02); b2 = bump(weave.outputs['Value'], .12, .002, b1.outputs['Normal'])
        L.new(b2.outputs['Normal'], p.inputs['Normal']); p.inputs['Roughness'].default_value = .92
    elif kind == 'glove':   # couro sintético escuro com grão fino
        n1 = noise(12, 3, .5); cr = N.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].color = (.018, .018, .02, 1); cr.color_ramp.elements[1].color = (.055, .052, .05, 1)
        L.new(n1.outputs['Fac'], cr.inputs['Fac']); L.new(cr.outputs['Color'], p.inputs['Base Color'])
        grain = noise(450, 8, .7); vor = N.new('ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = 300; L.new(tc.outputs['Object'], vor.inputs['Vector'])
        b1 = bump(grain.outputs['Fac'], .35, .001); b2 = bump(vor.outputs['Distance'], .2, .0015, b1.outputs['Normal'])
        L.new(b2.outputs['Normal'], p.inputs['Normal']); p.inputs['Roughness'].default_value = .5
    else:   # punho elástico canelado
        p.inputs['Base Color'].default_value = (.045, .045, .05, 1)
        w = wave(180, 'Z'); b = bump(w.outputs['Fac'], .3, .002); L.new(b.outputs['Normal'], p.inputs['Normal']); p.inputs['Roughness'].default_value = .75
    return m, p
mats = {n: build(n, n) for n in ('glove', 'sleeve', 'cuff')}
# ---------- assar ----------
RES = 2048
def img(name, noncolor):
    im = bpy.data.images.get(name)
    if im: bpy.data.images.remove(im)
    im = bpy.data.images.new(name, RES, RES, alpha=False); im.colorspace_settings.name = 'Non-Color' if noncolor else 'sRGB'; return im
col, nrm = img('ArmsColor', False), img('ArmsNormal', True)
sc.render.engine = 'CYCLES'; sc.cycles.samples = 4; sc.cycles.device = 'CPU'; sc.render.bake.margin = 8
def set_target(im):
    for m, p in mats.values():
        t = m.node_tree.nodes.get('BakeTarget') or m.node_tree.nodes.new('ShaderNodeTexImage'); t.name = 'BakeTarget'; t.image = im
        m.node_tree.nodes.active = t
with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o], selected_editable_objects=[o]):
    set_target(col); bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, use_clear=True)
    set_target(nrm); bpy.ops.object.bake(type='NORMAL', normal_space='TANGENT', use_clear=True)
d = os.path.join(os.path.expanduser('~'), 'Claude', 'blender-tools', 'assets')
for im in (col, nrm): im.filepath_raw = os.path.join(d, im.name + '.png'); im.file_format = 'PNG'; im.save()
# ---------- materiais finais (só imagens, o que o glTF entende) ----------
ROUGH = {'glove': .5, 'sleeve': .92, 'cuff': .75}
for name in ('glove', 'sleeve', 'cuff'):
    m = bpy.data.materials[name]; nt = m.node_tree; nt.nodes.clear(); N, L = nt.nodes, nt.links
    out = N.new('ShaderNodeOutputMaterial'); p = N.new('ShaderNodeBsdfPrincipled'); L.new(p.outputs[0], out.inputs[0])
    tc = N.new('ShaderNodeTexImage'); tc.image = col; L.new(tc.outputs['Color'], p.inputs['Base Color'])
    tn = N.new('ShaderNodeTexImage'); tn.image = nrm; nm = N.new('ShaderNodeNormalMap'); L.new(tn.outputs['Color'], nm.inputs['Color']); L.new(nm.outputs['Normal'], p.inputs['Normal'])
    p.inputs['Roughness'].default_value = ROUGH[name]
rig.data.pose_position = 'POSE'; sc.render.engine = 'BLENDER_WORKBENCH'
print('baked', len(me.uv_layers), col.size[:])
