# Utilitários de pose: mão controlada por IK (posição + direção dos dedos + direção da palma), dedos por curvatura
import bpy, math
from mathutils import Vector, Matrix, Quaternion
rig = bpy.data.objects['ArmsRig']
FING = ['index', 'middle', 'ring', 'pinky']
def bw(n, tail=False):
    b = rig.data.bones[n]; return rig.matrix_world @ (b.tail_local if tail else b.head_local)
def rest_frame(s):
    F = (bw(f'middle_01_{s}') - bw(f'hand_{s}')).normalized()
    S = (bw(f'pinky_01_{s}') - bw(f'index_01_{s}'))
    S = (S - S.dot(F) * F).normalized()
    N = F.cross(S) if s == 'r' else -F.cross(S)   # normal da palma
    return F, N
def frame(F, N):
    F = Vector(F).normalized(); N = Vector(N); N = (N - N.dot(F) * F).normalized(); X = F.cross(N)
    return Matrix((F, N, X)).transposed()
def ensure_ik():
    sc = bpy.context.scene
    for s, pole in (('r', (-.6, .1, -.4)), ('l', (.6, .1, -.4))):
        t = bpy.data.objects.get(f'IK_{s}')
        if not t:
            t = bpy.data.objects.new(f'IK_{s}', None); sc.collection.objects.link(t); t.empty_display_size = .03
            p = bpy.data.objects.new(f'POLE_{s}', None); sc.collection.objects.link(p); p.empty_display_size = .03
            pb = rig.pose.bones[f'lowerarm_{s}']; c = pb.constraints.new('IK'); c.target = t; c.pole_target = p; c.chain_count = 2; c.use_rotation = False
            c.pole_angle = math.radians(-90)
            h = rig.pose.bones[f'hand_{s}']; c2 = h.constraints.new('COPY_ROTATION'); c2.target = t
            t.rotation_mode = 'QUATERNION'
def set_hand(s, pos, F, N, pole=None, frame_=None):
    """Mão s ('r'/'l') no ponto pos (mundo), dedos apontando para F e palma virada para N."""
    t = bpy.data.objects[f'IK_{s}']; b = rig.data.bones[f'hand_{s}']
    R0 = (rig.matrix_world.to_3x3() @ b.matrix_local.to_3x3())
    F0, N0 = rest_frame(s)
    Rw = frame(F, N) @ frame(F0, N0).transposed() @ R0
    t.location = Vector(pos); t.rotation_quaternion = Rw.to_quaternion()
    if pole: bpy.data.objects[f'POLE_{s}'].location = Vector(pole)
    if frame_ is not None:
        t.keyframe_insert('location', frame=frame_); t.keyframe_insert('rotation_quaternion', frame=frame_)
        if pole: bpy.data.objects[f'POLE_{s}'].keyframe_insert('location', frame=frame_)
def curl(s, fingers, a, frame_=None, spread=0):
    """Dobra os dedos (a = [base, meio, ponta] em radianos)."""
    for f in fingers:
        for i in range(3):
            pb = rig.pose.bones[f'{f}_0{i+1}_{s}']; pb.rotation_mode = 'XYZ'
            pb.rotation_euler = (a[i], 0, spread if i == 0 else 0)
            if frame_ is not None: pb.keyframe_insert('rotation_euler', frame=frame_)
def thumb(s, rot, frame_=None):
    for i in range(3):
        pb = rig.pose.bones[f'thumb_0{i+1}_{s}']; pb.rotation_mode = 'XYZ'; pb.rotation_euler = rot[i]
        if frame_ is not None: pb.keyframe_insert('rotation_euler', frame=frame_)
def pose_frame(s):
    """Direções da mão posada (mundo): F dedos, N palma, S indicador→mindinho; e a posição do pulso."""
    bpy.context.view_layer.update()
    pw = lambda n: rig.matrix_world @ rig.pose.bones[n].head
    F = (pw(f'middle_01_{s}') - pw(f'hand_{s}')).normalized()
    S = pw(f'pinky_01_{s}') - pw(f'index_01_{s}'); S = (S - S.dot(F) * F).normalized()
    N = F.cross(S) if s == 'r' else -F.cross(S)
    return F, N, S, pw(f'hand_{s}')
def socket(s='r'):
    so = bpy.data.objects.get(f'Socket_{s}')
    if not so:
        so = bpy.data.objects.new(f'Socket_{s}', None); bpy.context.scene.collection.objects.link(so); so.empty_display_size = .02
        so.parent = rig; so.parent_type = 'BONE'; so.parent_bone = f'hand_{s}'
    return so
def place_knife(kind, along=.075, palm=.034, side=0.0, P=None, Q=None, frame_=None):
    """Coloca o soquete da faca na mão direita: P = direção do pomo/anel, Q = direção do fio/curva (mundo)."""
    F, N, S, W = pose_frame('r'); so = socket('r')
    P = P if P is not None else (-S if kind == 'karambit' else S)
    Q = Q if Q is not None else F
    P = P.normalized(); Q = (Q - Q.dot(P) * P).normalized()
    # eixos locais do modelo no Blender: pomo = -Y, fio = -Z
    Y = -P; Z = -Q; X = Y.cross(Z)
    R = Matrix((X, Y, Z)).transposed()
    rh = Vector((0, -.03, .006)) if kind == 'karambit' else Vector((0, -.05, .006))
    G = W + F * along + N * palm + S * side
    M = Matrix.Translation(G - R @ rh) @ R.to_4x4()
    so.matrix_world = M
    for n in ('karambit', 'knife'):
        k = bpy.data.objects[f'K_{n}']
        for o in [k] + list(k.children_recursive): o.hide_render = o.hide_viewport = n != kind
        k.parent = so; k.matrix_parent_inverse.identity(); k.matrix_basis.identity()
    if frame_ is not None: so.keyframe_insert('location', frame=frame_); so.keyframe_insert('rotation_euler', frame=frame_)
