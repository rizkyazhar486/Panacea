"""Rekonstruksi diskus intervertebralis C2-C3 s.d. L5-S1 dari endplate vertebra sumber.

Dijalankan di dalam Blender (MCP atau `Blender -b master.blend -P ...`).

Metode (tanpa dimensi karangan):
  1. Untuk tiap pasangan vertebra (atas U, bawah D) ambil wilayah korpus = 40% paling
     anterior (-Y) dari kedalaman vertebra.
  2. Sumbu lokal a = arah dari sentroid korpus U ke sentroid korpus D.
  3. Endplate inferior U = face dengan normal·a > 0.6 dalam 12 mm terbawah korpus U;
     endplate superior D = face dengan normal·a < -0.6 dalam 12 mm teratas korpus D.
  4. Kontur diskus = convex hull 2D (bidang ⟂ a) gabungan kedua endplate, di-inset 0.4 mm.
     Convex hull sedikit melebihkan cekungan posterior diskus — dicatat sebagai keterbatasan.
  5. Permukaan atas/bawah mengikuti tinggi endplate (interpolasi IDW k=6) dengan celah
     0.15 mm, sehingga diskus mengisi ruang diskus tanpa menembus tulang.
Status akurasi: reconstructed (bentuk diturunkan dari ruang diskus sumber, bukan atlas).
"""
import bpy, bmesh, math, mathutils
from mathutils import Vector
from mathutils.kdtree import KDTree

LEVELS = ["AXIS_C2"] + [f"VERTEBRA_C{i}" for i in range(3, 8)] + [f"VERTEBRA_T{i}" for i in range(1, 13)] \
    + [f"VERTEBRA_L{i}" for i in range(1, 6)] + ["SACRUM"]
LABEL = {"AXIS_C2": "C2", "SACRUM": "S1"}
N_ANG = 72
RINGS = [1.0, 0.86, 0.68, 0.46, 0.22]
GAP = 0.00015
BONE = "ADULT.MALE.SKELETAL."   # prefiks ID tulang di master
DISC = "ADULT.MALE.JOINT.INTERVERTEBRAL_DISC_"
INSET = 0.0004


def lab(n):
    return LABEL.get(n, n.split("_")[-1])


def world_tris(o):
    M = o.matrix_world
    me = o.data
    me.calc_loop_triangles()
    vs = [M @ v.co for v in me.vertices]
    nm = M.to_3x3().inverted().transposed()
    tris = []
    for t in me.loop_triangles:
        c = (vs[t.vertices[0]] + vs[t.vertices[1]] + vs[t.vertices[2]]) / 3
        tris.append((c, (nm @ t.normal).normalized(), tuple(t.vertices)))
    return vs, tris


def plate(tris, cand):
    """Ambil komponen terhubung (berbagi verteks) terbesar di garis tengah dari kandidat endplate.
    Ini membuang prosesus transversus, pedikel dan faset artikular yang normalnya kebetulan searah."""
    idx = [i for i in range(len(tris)) if cand(tris[i])]
    if not idx:
        return []
    by_v = {}
    for i in idx:
        for v in tris[i][2]:
            by_v.setdefault(v, []).append(i)
    # pecah menjadi komponen terhubung, pilih komponen terbesar yang sentroidnya di garis tengah
    left, comps = set(idx), []
    while left:
        s0 = left.pop(); comp, stack = [s0], [s0]
        while stack:
            i = stack.pop()
            for v in tris[i][2]:
                for j in by_v[v]:
                    if j in left:
                        left.discard(j); comp.append(j); stack.append(j)
        comps.append(comp)
    def score(comp):
        cx = sum(tris[i][0].x for i in comp) / len(comp)
        return (abs(cx) < 0.012, len(comp))
    seen = max(comps, key=score)
    return [(tris[i][0], tris[i][1]) for i in seen]


def kdtree_2d(points):
    tree = KDTree(len(points))
    for i, p in enumerate(points):
        tree.insert((p.x, p.y, 0), i)
    tree.balance()
    return tree


def body_region(vs):
    ys = [v.y for v in vs]
    y0, y1 = min(ys), max(ys)
    cut = y0 + 0.40 * (y1 - y0)
    return cut


def build(upper, lower, mat, coll):
    U = bpy.data.objects[BONE + upper]
    D = bpy.data.objects[BONE + lower]
    vu, tu = world_tris(U)
    vd, td = world_tris(D)
    cu_cut, cd_cut = body_region(vu), body_region(vd)
    bu = [v for v in vu if v.y < cu_cut]
    bd = [v for v in vd if v.y < cd_cut]
    if lower == "SACRUM":
        # basis sakrum: batasi pada lebar korpus L5 agar ala sakrum tidak ikut
        xs = [v.x for v in bu]
        x0, x1 = min(xs) - 0.003, max(xs) + 0.003
        bd = [v for v in bd if x0 < v.x < x1 and v.z > max(v.z for v in bd) - 0.03]
    cu = sum(bu, Vector()) / len(bu)
    cd = sum(bd, Vector()) / len(bd)
    a = (cd - cu).normalized()
    e1 = a.cross(Vector((0, 1, 0))).normalized()
    e2 = a.cross(e1).normalized()
    o = (cu + cd) / 2

    def p2(c):
        d = c - o
        return Vector((d.dot(e1), d.dot(e2)))

    tmax_u = max((v - o).dot(a) for v in bu)
    tmin_d = min((v - o).dot(a) for v in bd)
    win_d = 0.022 if lower == "SACRUM" else 0.012  # basis sakrum miring ~20° terhadap sumbu
    up = plate(tu, lambda t: t[0].y < cu_cut and t[1].dot(a) > 0.6 and (t[0] - o).dot(a) > tmax_u - 0.012)
    dn = plate(td, lambda t: t[0].y < cd_cut and t[1].dot(a) < -0.6 and (t[0] - o).dot(a) < tmin_d + win_d
               and (lower != "SACRUM" or x0 < t[0].x < x1))
    if len(up) < 20 or len(dn) < 20:
        return None, f"{upper}-{lower}: endplate tidak terdeteksi ({len(up)},{len(dn)})"

    # buang titik endplate yang tidak berhadapan: hanya yang tertutup kedua plate
    up2 = [p2(c) for c, _ in up]
    dn2 = [p2(c) for c, _ in dn]
    ku, kd = kdtree_2d(up2), kdtree_2d(dn2)
    both = [p for p in up2 if kd.find((p.x, p.y, 0))[2] < 0.004] + [p for p in dn2 if ku.find((p.x, p.y, 0))[2] < 0.004]
    hull_idx = mathutils.geometry.convex_hull_2d(both)
    hull = [both[i] for i in hull_idx]
    ctr = sum(hull, Vector((0, 0))) / len(hull)
    tu_ = [(c - o).dot(a) for c, _ in up]
    td_ = [(c - o).dot(a) for c, _ in dn]

    def ray_r(th):
        d = Vector((math.cos(th), math.sin(th)))
        best = 0
        for i in range(len(hull)):
            p, q = hull[i] - ctr, hull[(i + 1) % len(hull)] - ctr
            e = q - p
            den = d.x * e.y - d.y * e.x
            if abs(den) < 1e-12:
                continue
            t = (p.x * e.y - p.y * e.x) / den
            s = (p.x * d.y - p.y * d.x) / den
            if t > 0 and -1e-9 <= s <= 1 + 1e-9:
                best = max(best, t)
        return max(best - INSET, 0.001)

    def idw(tree, vals, p, k=6):
        hits = tree.find_n((p.x, p.y, 0), k)
        w = [(1 / max(h[2], 1e-5) ** 2, vals[h[1]]) for h in hits]
        return sum(x * v for x, v in w) / sum(x for x, _ in w)

    radii = [ray_r(2 * math.pi * i / N_ANG) for i in range(N_ANG)]
    bm = bmesh.new()

    def vert(p, t):
        return bm.verts.new(o + e1 * p.x + e2 * p.y + a * t)

    top_rings, bot_rings = [], []
    for f in RINGS:
        tr, br = [], []
        for i in range(N_ANG):
            th = 2 * math.pi * i / N_ANG
            p = ctr + Vector((math.cos(th), math.sin(th))) * radii[i] * f
            # atas = menempel endplate inferior U (t terbesar milik U → arah -a dari D)
            # sumbu a menunjuk U→D: endplate U di t kecil, endplate D di t besar
            t_top = idw(ku, tu_, p) + GAP
            t_bot = idw(kd, td_, p) - GAP
            if t_bot - t_top < 0.0008:  # tebal minimum 0.8 mm (cegah permukaan terbalik)
                m = (t_top + t_bot) / 2; t_top, t_bot = m - 0.0004, m + 0.0004
            tr.append(vert(p, t_top)); br.append(vert(p, t_bot))
        top_rings.append(tr); bot_rings.append(br)
    ct = vert(ctr, idw(ku, tu_, ctr) + GAP)
    cb = vert(ctr, idw(kd, td_, ctr) - GAP)
    # dinding lateral: satu cincin tengah dengan tonjolan annulus 0.3 mm
    mid = []
    for i in range(N_ANG):
        a0, b0 = top_rings[0][i].co, bot_rings[0][i].co
        m = (a0 + b0) / 2
        rad = (m - o) - a * (m - o).dot(a)
        mid.append(bm.verts.new(m + rad.normalized() * 0.0003))
    F = bm.faces.new
    for i in range(N_ANG):
        j = (i + 1) % N_ANG
        F((top_rings[0][i], top_rings[0][j], mid[j], mid[i]))
        F((mid[i], mid[j], bot_rings[0][j], bot_rings[0][i]))
        for r in range(len(RINGS) - 1):
            F((top_rings[r + 1][i], top_rings[r + 1][j], top_rings[r][j], top_rings[r][i]))
            F((bot_rings[r][i], bot_rings[r][j], bot_rings[r + 1][j], bot_rings[r + 1][i]))
        F((ct, top_rings[-1][j], top_rings[-1][i]))
        F((cb, bot_rings[-1][i], bot_rings[-1][j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    name = f"{DISC}{lab(upper)}_{lab(lower)}"
    me = bpy.data.meshes.get(name) or bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.get(name) or bpy.data.objects.new(name, me)
    ob.data = me
    if ob.name not in coll.objects:
        coll.objects.link(ob)
    me.materials.clear(); me.materials.append(mat)
    # ukur tinggi anterior/posterior di garis tengah sagital
    def height_at(p):
        return idw(kd, td_, p) - idw(ku, tu_, p)
    rim = [ctr + Vector((math.cos(2 * math.pi * i / N_ANG), math.sin(2 * math.pi * i / N_ANG))) * radii[i] * 0.9 for i in range(N_ANG)]
    wy = [(o + e1 * p.x + e2 * p.y).y for p in rim]
    pa = rim[wy.index(min(wy))]   # titik paling anterior (-Y)
    pp = rim[wy.index(max(wy))]   # titik paling posterior
    h_ant, h_post, h_c = height_at(pa), height_at(pp), height_at(ctr)
    meta = {
        "panacea_structure_id": name, "panacea_body_id": "HUMAN.ADULT.MALE",
        "canonical_name": f"Intervertebral disc {lab(upper)}-{lab(lower)}",
        "panacea_system": "joint", "panacea_kind": "intervertebral_disc",
        "panacea_laterality": "unpaired", "panacea_position_side": "midline",
        "panacea_region": "vertebral_column",
        "panacea_source": "Reconstructed by Panacea pipeline from the disc space between source vertebral endplates (Z-Anatomy / BodyParts3D)",
        "panacea_reference": "Morphology rule: disc fills the space between adjacent vertebral body endplates (Gray's Anatomy, vertebral column); no external dimensions imposed",
        "panacea_method": "build_intervertebral_discs.py: endplate detection + 2D convex hull + IDW height fit, gap 0.15 mm",
        "panacea_accuracy_status": "reconstructed", "panacea_review_status": "review_required",
        "panacea_known_limitations": "Convex outline slightly overfills the posterior concavity; annulus fibrosus and nucleus pulposus not separated",
        "panacea_version": "body_v004", "panacea_educational_only": True, "panacea_license": "CC BY-SA 4.0 (derivative of source vertebrae)",
        "qa_height_anterior_mm": round(h_ant * 1000, 2), "qa_height_posterior_mm": round(h_post * 1000, 2), "qa_height_centre_mm": round(h_c * 1000, 2),
    }
    for k, v in meta.items():
        ob[k] = v
    return ob, (name, round(h_ant * 1000, 1), round(h_c * 1000, 1), round(h_post * 1000, 1))


def resolve_penetration(ob, bone_names, iters=3):
    """Dorong verteks diskus yang masuk ke tulang kembali ke permukaan tulang + GAP.
    Setara shrinkwrap 'outside' terbatas; dipakai karena interpolasi IDW melampaui tepi endplate yang membulat."""
    from mathutils.bvhtree import BVHTree
    trees = []
    for n in bone_names:
        b = bpy.data.objects[n]
        bm = bmesh.new(); bm.from_mesh(b.data); bm.transform(b.matrix_world)
        trees.append(BVHTree.FromBMesh(bm)); bm.free()
    M = ob.matrix_world; Mi = M.inverted()
    moved = 0
    for _ in range(iters):
        n_it = 0
        for v in ob.data.vertices:
            p = M @ v.co
            for t in trees:
                loc, nrm, _, d = t.find_nearest(p)
                if loc is not None and d < 0.01 and (p - loc).dot(nrm) < 0:
                    p = loc + nrm * GAP
                    n_it += 1
            v.co = Mi @ p
        moved += n_it
        if n_it == 0:
            break
    ob.data.update()
    return moved


def bone_of(label):
    return BONE + {"C2": "AXIS_C2", "S1": "SACRUM"}.get(label, "VERTEBRA_" + label)


def run():
    root = bpy.data.collections["03_JOINTS"]
    coll = bpy.data.collections.get("03_JOINTS.INTERVERTEBRAL_DISCS") or bpy.data.collections.new("03_JOINTS.INTERVERTEBRAL_DISCS")
    if coll.name not in root.children:
        root.children.link(coll)
    mat = bpy.data.materials.get("PAN_Fibrocartilage")
    if mat is None:
        mat = bpy.data.materials["PAN_Cartilage"].copy(); mat.name = "PAN_Fibrocartilage"
        b = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        b.inputs['Base Color'].default_value = (0.50, 0.52, 0.48, 1); b.inputs['Roughness'].default_value = 0.38
        mat.diffuse_color = (0.50, 0.52, 0.48, 1)
    bpy.context.view_layer.update()
    out = []
    for u, d in zip(LEVELS[:-1], LEVELS[1:]):
        ob, info = build(u, d, mat, coll)
        if ob is not None:
            moved = resolve_penetration(ob, [BONE + u, BONE + d])
            ob["qa_vertices_pushed_out_of_bone"] = moved
            info = info + (moved,)
        out.append(info)
    return out


if __name__ == "__main__":
    for r in run():
        print(r)
