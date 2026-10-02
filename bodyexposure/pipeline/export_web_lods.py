"""Turunkan aset web LOD (GLB) dari master kanonik — master tidak pernah diubah.

  Blender -b bodyexposure/PANACEA_HUMAN_MASTER_v005.blend -P bodyexposure/pipeline/export_web_lods.py -- \
      --out bodyexposure/web/raw [--body HUMAN.ADULT.MALE] [--lods LOD1,LOD2,LOD3]

Per tubuh × sistem × LOD satu GLB. Nama node = ID struktur semantik; metadata panacea_* ikut
sebagai glTF `extras`. Desimasi collapse dengan lantai segitiga minimum per struktur supaya
struktur kecil (ossikel, katup, saraf kranial) tidak hilang. Galat geometrik tiap LOD diukur
terhadap master (jarak verteks master ke permukaan LOD) dan ditulis ke lod_report.json.
Kompresi meshopt dilakukan sesudahnya dengan gltfpack (lihat README).
"""
import bpy, bmesh, sys, os, json, argparse
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--out", default="bodyexposure/web/raw")
ap.add_argument("--body", default="")
ap.add_argument("--lods", default="LOD0,LOD1,LOD2,LOD3")
a = ap.parse_args(argv)

# rasio target segitiga terhadap master, dan lantai segitiga per struktur
LODS = {"LOD0": (0.50, 400), "LOD1": (0.25, 200), "LOD2": (0.10, 120), "LOD3": (0.04, 60)}
SAMPLE = 400  # verteks master yang diuji per struktur untuk galat


def tri_count(me):
    return sum(len(p.vertices) - 2 for p in me.polygons)


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
    report = {"lods": {k: {"target_ratio": r, "min_tris": m} for k, (r, m) in LODS.items()}, "files": []}
    dg = bpy.context.evaluated_depsgraph_get()
    for body, systems in bodies.items():
        if a.body and body != a.body:
            continue
        tag = body.replace("HUMAN.", "").replace(".", "_").lower()
        for lod in a.lods.split(","):
            ratio, floor = LODS[lod]
            for sysn, objs in sorted(systems.items()):
                mods = []
                for o in objs:
                    t = tri_count(o.data)
                    r = min(1.0, max(ratio, floor / max(t, 1)))
                    if r < 0.999:
                        m = o.modifiers.new("PAN_LOD", 'DECIMATE'); m.decimate_type = 'COLLAPSE'; m.ratio = r
                        m.use_collapse_triangulate = True
                        mods.append((o, m))
                bpy.context.view_layer.update(); dg.update()
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
                for o, m in mods:
                    o.modifiers.remove(m)
                report["files"].append({"body": body, "system": sysn, "lod": lod, "file": os.path.basename(path),
                                        "structures": len(objs), "tris_master": src_t, "tris_lod": out_t,
                                        "bytes_raw": os.path.getsize(path),
                                        "error_mm_largest_structures": errs})
                print("EXPORT", os.path.basename(path), len(objs), src_t, "->", out_t, os.path.getsize(path))
    json.dump(report, open(os.path.join(a.out, "lod_report.json"), "w"), indent=1)


main()
