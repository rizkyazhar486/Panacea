"""Rekonstruksi kantong perikardium (fibrosa + lapisan parietal serosa sebagai satu permukaan).

Dasar anatomi (Gray's Anatomy, mediastinum medius): perikardium membungkus jantung dan pangkal
pembuluh besar; refleksi superior setinggi percabangan trunkus pulmonalis / awal arkus aorta;
dasarnya menempel pada centrum tendineum diafragma; ruang perikardium normal sangat tipis.

Metode (tanpa bentuk karangan):
  1. Gabungkan geometri sumber: keempat ruang jantung, sinus koronarius, aorta asendens,
     trunkus pulmonalis + percabangannya, VCS, dan VCI torakal di atas diafragma.
  2. Remesh voxel 3 mm + penutupan morfologis 6 mm (alur di antara objek sumber terisi) → selubung tertutup gabungan tersebut.
  3. Dorong keluar sepanjang normal (OFFSET) untuk ruang perikardium, lalu haluskan.
  4. Potong di atas bidang refleksi (puncak percabangan trunkus pulmonalis) dan buang bagian
     yang masuk ke diafragma.
Status: approximate. Tebal dinding dan refleksi pada vena pulmonalis tidak dimodelkan.
"""
import bpy, bmesh, mathutils, re
from mathutils.bvhtree import BVHTree

P = "ADULT.MALE.CARDIOVASCULAR."
PARTS = ["LEFT_ATRIUM", "RIGHT_ATRIUM", "LEFT_VENTRICLE", "RIGHT_VENTRICLE", "CORONARY_SINUS", "ASCENDING_AORTA",
         "PULMONARY_TRUNK", "BIFURCATION_OF_PULMONARY_TRUNK", "SUPERIOR_VENA_CAVA", "INFERIOR_VENA_CAVA_THORACIC_PART"]
VOXEL = 0.003
CLOSE = 0.006
OFFSET = 0.0035
NAME = "ADULT.MALE.CARDIOVASCULAR.PERICARDIUM"


def world_bm(names):
    bm = bmesh.new()
    for n in names:
        o = bpy.data.objects[n]
        tmp = bmesh.new(); tmp.from_mesh(o.data); tmp.transform(o.matrix_world)
        me = bpy.data.meshes.new("tmp"); tmp.to_mesh(me); tmp.free()
        bm.from_mesh(me); bpy.data.meshes.remove(me)
    return bm


def epicardial_vessels(margin=0.006):
    """Pembuluh koroner dan vena jantung terletak di epikardium, di dalam kantong: ambil semua struktur
    kardiovaskular yang batasnya seluruhnya berada di dalam kotak ruang jantung (+margin)."""
    ch = [bpy.data.objects[P + n] for n in PARTS[:4]]
    pts = [o.matrix_world @ mathutils.Vector(c) for o in ch for c in o.bound_box]
    lo = [min(p[i] for p in pts) - margin for i in range(3)]
    hi = [max(p[i] for p in pts) + margin for i in range(3)]
    out = []
    for o in bpy.data.objects:
        if o.type != 'MESH' or not o.name.startswith(P) or o.name.endswith("PERICARDIUM") or o.name[len(P):] in PARTS:
            continue
        if re.search(r"HEPATIC|LUNG", o.name):
            continue  # vena hepatika di bawah diafragma; vena segmental paru di luar kantong
        bb = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
        if all(lo[i] <= min(b[i] for b in bb) and max(b[i] for b in bb) <= hi[i] for i in range(3)):
            out.append(o.name)
    return out


def bvh_of(name):
    o = bpy.data.objects[name]
    bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world)
    t = BVHTree.FromBMesh(bm); bm.free()
    return t


def run(coll_name="06_CARDIOVASCULAR.HEART"):
    bpy.context.view_layer.update()
    old = bpy.data.objects.get(NAME)
    if old:
        bpy.data.objects.remove(old, do_unlink=True)
    names = [P + p for p in PARTS] + epicardial_vessels()
    bm = world_bm(names)
    me = bpy.data.meshes.new(NAME + "_SRC"); bm.to_mesh(me); bm.free()
    src = bpy.data.objects.new(NAME + "_SRC", me)
    bpy.context.scene.collection.objects.link(src)
    # penutupan morfologis: dilatasi CLOSE → remesh (alur sempit di antara objek sumber terisi)
    # → erosi kembali ke OFFSET; lalu penghalusan ringan
    rm1 = src.modifiers.new("remesh1", 'REMESH'); rm1.mode = 'VOXEL'; rm1.voxel_size = VOXEL
    dil = src.modifiers.new("dilate", 'DISPLACE'); dil.mid_level = 0.0; dil.strength = CLOSE
    rm2 = src.modifiers.new("remesh2", 'REMESH'); rm2.mode = 'VOXEL'; rm2.voxel_size = VOXEL
    ero = src.modifiers.new("erode", 'DISPLACE'); ero.mid_level = 0.0; ero.strength = -(CLOSE - OFFSET)
    sm = src.modifiers.new("smooth", 'CORRECTIVE_SMOOTH'); sm.iterations = 4; sm.smooth_type = 'LENGTH_WEIGHTED'; sm.use_only_smooth = True
    dg = bpy.context.evaluated_depsgraph_get()
    out = bpy.data.meshes.new_from_object(src.evaluated_get(dg))
    bpy.data.objects.remove(src, do_unlink=True); bpy.data.meshes.remove(me)

    # bidang refleksi superior: puncak percabangan trunkus pulmonalis
    bif = bpy.data.objects[P + "BIFURCATION_OF_PULMONARY_TRUNK"]
    z_top = max((bif.matrix_world @ mathutils.Vector(c)).z for c in bif.bound_box)
    dia = bvh_of("ADULT.MALE.MUSCULAR.DIAPHRAGM")
    bm = bmesh.new(); bm.from_mesh(out)
    kill = []
    for f in bm.faces:
        c = f.calc_center_median()
        if c.z > z_top:
            kill.append(f); continue
        loc, nrm, _, d = dia.find_nearest(c)
        if loc is not None and d < 0.01 and (c - loc).dot(nrm) < 0:
            kill.append(f)  # di dalam diafragma
    bmesh.ops.delete(bm, geom=kill, context='FACES')
    loose = [v for v in bm.verts if not v.link_faces]
    bmesh.ops.delete(bm, geom=loose, context='VERTS')
    bm.to_mesh(out); bm.free()
    for p in out.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(NAME, out); out.name = NAME
    coll = bpy.data.collections.get(coll_name) or bpy.context.scene.collection
    coll.objects.link(ob)
    mat = bpy.data.materials.get("PAN_Pericardium")
    if mat is None:
        mat = bpy.data.materials["PAN_Peritoneum"].copy(); mat.name = "PAN_Pericardium"
    out.materials.append(mat)
    meta = {"panacea_structure_id": NAME, "panacea_body_id": "HUMAN.ADULT.MALE", "canonical_name": "Pericardium",
            "panacea_system": "cardiovascular", "panacea_kind": "serous_sac", "panacea_laterality": "unpaired",
            "panacea_position_side": "left", "panacea_region": "middle_mediastinum",
            "panacea_source": "Reconstructed by Panacea pipeline from source heart and great-vessel geometry (Z-Anatomy / BodyParts3D)",
            "panacea_reference": "Gray's Anatomy, middle mediastinum: sac encloses heart and roots of great vessels; superior reflection at pulmonary trunk bifurcation / start of aortic arch; base on central tendon of diaphragm",
            "panacea_method": f"build_pericardium.py: voxel union {VOXEL*1000:.0f} mm, closing {CLOSE*1000:.0f} mm, normal offset {OFFSET*1000:.1f} mm, cut at z={z_top:.4f} m and at diaphragm",
            "panacea_accuracy_status": "approximate", "panacea_review_status": "review_required",
            "panacea_known_limitations": "Fibrous and parietal serous layers merged into one surface; no wall thickness; reflections around pulmonary veins and oblique/transverse sinuses not modelled",
            "panacea_version": "body_v006", "panacea_educational_only": True, "panacea_license": "CC BY-SA 4.0 (derivative of source heart)"}
    for k, v in meta.items():
        ob[k] = v
    return ob, z_top


LOBES = ["SUPERIOR_LOBE_OF_LEFT_LUNG", "INFERIOR_LOBE_OF_LEFT_LUNG", "SUPERIOR_LOBE_OF_RIGHT_LUNG",
         "MIDDLE_LOBE_OF_RIGHT_LUNG", "INFERIOR_LOBE_OF_RIGHT_LUNG"]
CONTACT_GAP = 0.0008


def resolve_lung_contact(iters=3):
    """Paru sumber menembus ruang jantung/perikardium (cacat relasi pada sumber, terukur dengan uji
    paritas sinar). Dorong verteks paru yang berada di dalam kantong ke permukaan kantong + 0.8 mm,
    sehingga paru menempel pada perikardium dan membentuk impresio kardiaka."""
    sac = bpy.data.objects[NAME]
    bm = bmesh.new(); bm.from_mesh(sac.data); bm.transform(sac.matrix_world)
    boundary = [v.co.copy() for v in bm.verts if v.is_boundary]
    tree = BVHTree.FromBMesh(bm); bm.free()
    zs = [v.co.z for v in sac.data.vertices]
    z0, z1 = min(zs), max(zs)
    from mathutils.kdtree import KDTree
    kb = KDTree(len(boundary))
    for i, p in enumerate(boundary):
        kb.insert(p, i)
    kb.balance()
    report = {}
    for lobe in LOBES:
        o = bpy.data.objects["ADULT.MALE.RESPIRATORY." + lobe]
        M, Mi = o.matrix_world, o.matrix_world.inverted()
        moved = set()
        for _ in range(iters):
            n_it = 0
            for v in o.data.vertices:
                p = M @ v.co
                if not (z0 - 0.002 < p.z < z1 + 0.002):
                    continue
                loc, nrm, _, d = tree.find_nearest(p)
                if loc is None or d > 0.03 or (p - loc).dot(nrm) >= 0:
                    continue
                if kb.find(loc)[2] < 0.004:
                    continue  # dekat tepi potong kantong: tanda dalam/luar tidak andal
                v.co = Mi @ (loc + nrm * CONTACT_GAP)
                moved.add(v.index); n_it += 1
            if n_it == 0:
                break
        o.data.update()
        o["panacea_accuracy_status"] = "source_backed_corrected"
        o["panacea_qa_note"] = (f"{len(moved)} vertices moved out of the pericardial sac onto its surface (+0.8 mm) to remove "
                                "source heart–lung interpenetration; forms the cardiac impression. build_pericardium.py")
        report[lobe] = len(moved)
    return report


if __name__ == "__main__":
    print(run())
    print(resolve_lung_contact())
