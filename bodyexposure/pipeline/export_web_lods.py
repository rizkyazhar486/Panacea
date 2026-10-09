"""Turunkan aset web LOD (GLB) dari master kanonik — master tidak pernah diubah.

  Blender -b bodyexposure/PANACEA_HUMAN_MASTER_v005.blend -P bodyexposure/pipeline/export_web_lods.py -- \
      --out bodyexposure/web/raw [--body HUMAN.ADULT.MALE] [--lods LOD1,LOD2,LOD3,LOD4]

Per tubuh × sistem × LOD satu GLB. Nama node = ID struktur semantik; metadata panacea_* ikut
sebagai glTF `extras`. Desimasi collapse dengan lantai segitiga minimum per struktur supaya
struktur kecil (ossikel, katup, saraf kranial) tidak hilang. Galat geometrik tiap LOD diukur
terhadap master (jarak verteks master ke permukaan LOD) dan ditulis ke lod_report.json.
Kompresi meshopt dilakukan sesudahnya dengan gltfpack (lihat README).
"""
import bpy, bmesh, sys, os, json, argparse
from mathutils.bvhtree import BVHTree
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lod_budget import tri_count, allocate, split_nonmanifold, escapes_bbox, fix_escapes

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--out", default="bodyexposure/web/raw")
ap.add_argument("--body", default="")
ap.add_argument("--lods", default="LOD0,LOD1,LOD2,LOD3")
a = ap.parse_args(argv)

# rasio target segitiga terhadap master, dan lantai segitiga per struktur
LODS = {"LOD0": (0.50, 400), "LOD1": (0.25, 200), "LOD2": (0.10, 120), "LOD3": (0.04, 60)}
# LOD4 = budget per SISTEM untuk tampilan web ringan. Sistem yang tampil default di aplikasi (DEFAULT_ON di
# CanonicalBody.tsx) berjumlah ≤ 80.000 segitiga per tubuh = muatan awal; sistem lain dimuat saat dinyalakan.
# Di dalam sistem: lantai per struktur (tidak ada struktur yang hilang) + sisa ∝ luas permukaan.
# pembuluh darah: 677 struktur tabung pada tubuh laki-laki; agar tak ada verteks lolos bbox (fix_escapes) perlu
# ≈ 38.000 segitiga → jatah sesuai kenyataan, sistem default lain disesuaikan agar muatan awal ≤ 80.000
BUDGET = {"LOD4": ({"skeletal": 20000, "cardiovascular": 38000, "surface": 6000, "digestive": 6000, "respiratory": 3500,
                    "urinary": 2000, "reproductive": 2000,  # = 77.500 (muatan awal)
                    "muscular": 24000, "nervous": 12000, "joint": 8000, "lymphatic": 3000, "fascia": 3000,
                    "sensory": 3000, "endocrine": 1500, "visceral_unclassified": 1000}, 8)}
# per tubuh: laki-laki (3.877 struktur, 677 pembuluh terkunci ≈ 45.000) → sistem default lain lebih ketat
BODY_BUDGET = {"HUMAN.ADULT.MALE": {"skeletal": 16000, "surface": 5000, "digestive": 5000, "respiratory": 3000,
                                    "urinary": 1800, "reproductive": 1800}}
DEFAULT_ON = {"surface", "skeletal", "cardiovascular", "respiratory", "digestive", "urinary", "reproductive"}
SAMPLE = 400  # verteks master yang diuji per struktur untuk galat




def lod_error(src_obj, eval_obj, dg):
    """Galat satu arah master→LOD (meter): rerata dan maksimum dari sampel verteks master."""
    me = eval_obj.evaluated_get(dg).to_mesh()
    bm = bmesh.new(); bm.from_mesh(me); bm.transform(eval_obj.matrix_world)
    tree = BVHTree.FromBMesh(bm); bm.free(); eval_obj.evaluated_get(dg).to_mesh_clear()
    vs = src_obj.data.vertices
    step = max(1, len(vs) // SAMPLE)
    M = src_obj.matrix_world
    ds = [tree.find_nearest(M @ vs[i].co)[3] for i in range(0, len(vs), step)]
    ds = [d for d in ds if d is not None]
    return (sum(ds) / len(ds), max(ds)) if ds else (0.0, 0.0)


def export_glb(objs, path):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True,
                              export_extras=True, export_yup=True, export_materials='EXPORT',
                              export_texcoords=False, export_normals=True, export_animations=False)


def main():
    os.makedirs(a.out, exist_ok=True)
    sc = bpy.context.scene
    # buang offset tampilan supaya GLB memakai koordinat kanonik tubuh itu sendiri
    root = bpy.data.objects.get("HUMAN.ADULT.FEMALE.ROOT")
    if root:
        root.location = (0, 0, 0)
    for lc in bpy.context.view_layer.layer_collection.children:
        lc.exclude = False
    bodies = {}
    for o in sc.objects:
        if o.type == 'MESH' and "panacea_body_id" in o:
            o.hide_set(False); o.hide_viewport = False
            bodies.setdefault(o["panacea_body_id"], {}).setdefault(o.get("panacea_system", "other"), []).append(o)
    report = {"lods": {k: {"target_ratio": r, "min_tris": m} for k, (r, m) in LODS.items()}
              | {k: {"system_budget_tris": b, "body_overrides": BODY_BUDGET, "min_tris": m, "initial_load_systems": sorted(DEFAULT_ON),
                     "allocation": "per system: floor + remainder proportional to surface area"} for k, (b, m) in BUDGET.items()},
              "files": []}
    dg = bpy.context.evaluated_depsgraph_get()
    for body, systems in bodies.items():
        if a.body and body != a.body:
            continue
        tag = body.replace("HUMAN.", "").replace(".", "_").lower()
        for lod in a.lods.split(","):
            ratios = None; swapped = []
            if lod in BUDGET:
                budgets, floor = BUDGET[lod]; ratios = {}
                # edge non-manifold (>2 face, mis. lembaran sinus/falx yang bersilangan) mengunci decimate collapse;
                # pisahkan edge itu pada SALINAN mesh (posisi verteks identik), kembalikan sesudah ekspor
                for sobjs in systems.values():
                    for o in sobjs:
                        orig = split_nonmanifold(o)
                        if orig is not None:
                            swapped.append((o, orig))
                for sysn, sobjs in systems.items():
                    budget = BODY_BUDGET.get(body, {}).get(sysn, budgets.get(sysn, 1000))
                    if sum(tri_count(o.data) for o in sobjs) <= budget:
                        ratios.update({o.name: 1.0 for o in sobjs}); continue
                    r = allocate(sobjs, budget, floor)
                    unsplit_sys = {o.name: orig for o, orig in swapped if o in sobjs and o.data is not orig}
                    # ukur hasil nyata: collapse tidak tepat sasaran, dan struktur yang lolos bbox diperbaiki
                    # (fix_escapes menaikkan rasionya); kelebihan diserap struktur lain di sistem yang sama.
                    for _ in range(5):
                        for o in sobjs:
                            m = o.modifiers.new("PAN_LOD", 'DECIMATE'); m.decimate_type = 'COLLAPSE'; m.ratio = r[o.name]
                            m.use_collapse_triangulate = True
                        bpy.context.view_layer.update(); dg.update()
                        fixed = {n for n, _ in fix_escapes(sobjs, dg, unsplit_sys)}
                        tri = {o.name: len(o.evaluated_get(dg).data.polygons) for o in sobjs}
                        r = {o.name: (o.modifiers["PAN_LOD"].ratio if o.modifiers.get("PAN_LOD") else 1.0) for o in sobjs}
                        for o in sobjs:
                            m = o.modifiers.get("PAN_LOD")
                            if m: o.modifiers.remove(m)
                        got = sum(tri.values())
                        if got <= budget: break
                        locked = fixed | {n for n, v in r.items() if v >= 1.0}
                        free_t = got - sum(tri[n] for n in locked)
                        if free_t <= 0: break
                        scale = max(0.05, (budget - sum(tri[n] for n in locked)) / free_t) * 0.97
                        r = {n: (v if n in locked else v * scale) for n, v in r.items()}
                    ratios.update(r)
                ratio = floor = None
            else:
                ratio, floor = LODS[lod]
            for sysn, objs in sorted(systems.items()):
                mods = []
                for o in objs:
                    t = tri_count(o.data)
                    r = ratios[o.name] if ratios else min(1.0, max(ratio, floor / max(t, 1)))
                    if r < 0.999:
                        m = o.modifiers.new("PAN_LOD", 'DECIMATE'); m.decimate_type = 'COLLAPSE'; m.ratio = r
                        m.use_collapse_triangulate = True
                        mods.append((o, m))
                bpy.context.view_layer.update(); dg.update()
                unsplit = {o.name: orig for o, orig in swapped if o in objs}
                fixed = fix_escapes(objs, dg, unsplit)
                for o, orig in list(swapped):  # mesh yang dikembalikan ke aslinya tidak perlu dipulihkan lagi
                    if o.data is orig: swapped.remove((o, orig))
                exploded = [o.name for o in objs if escapes_bbox(o, dg)]
                if exploded:  # gerbang keras: GLB tidak boleh berisi verteks di luar bbox struktur aslinya
                    raise SystemExit(f"LOD {lod} {sysn}: decimation escaped source bbox for {exploded[:5]}")
                src_t = sum(tri_count(o.data) for o in objs)
                out_t, errs = 0, []
                for o in objs:
                    e = o.evaluated_get(dg)
                    out_t += sum(len(p.vertices) - 2 for p in e.data.polygons)
                worst = sorted(objs, key=lambda o: -tri_count(o.data))[:12]  # ukur galat pada struktur terbesar
                for o in worst:
                    mean, mx = lod_error(o, o, dg)
                    errs.append((o.name, round(mean * 1000, 3), round(mx * 1000, 3)))
                path = os.path.join(a.out, f"{tag}.{sysn}.{lod}.glb")
                export_glb(objs, path)
                for o, _ in mods:  # modifier bisa sudah dihapus fix_escapes ("not decimated")
                    m = o.modifiers.get("PAN_LOD")
                    if m: o.modifiers.remove(m)
                report["files"].append({"body": body, "system": sysn, "lod": lod, "file": os.path.basename(path),
                                        "structures": len(objs), "tris_master": src_t, "tris_lod": out_t,
                                        "bytes_raw": os.path.getsize(path),
                                        "error_mm_largest_structures": errs, "bbox_escape_fixed": fixed})
                print("EXPORT", os.path.basename(path), len(objs), src_t, "->", out_t, os.path.getsize(path))
            for o, orig in swapped:
                tmp = o.data; o.data = orig; bpy.data.meshes.remove(tmp)
    json.dump(report, open(os.path.join(a.out, "lod_report.json"), "w"), indent=1)


main()
