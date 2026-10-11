"""Blender: paket region bernomor untuk inspeksi engineering, BUKAN aset runtime.

blender -b -P build_fetal_parcel_qa.py -- --audit <audit-dir> --out <direktori-baru>
Tidak memuat/menulis master bersama; warna hanya membedakan ID, bukan identitas anatomi.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys

import bpy
import bmesh

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--audit", required=True)
parser.add_argument("--out", required=True)
options = parser.parse_args(args)
audit, out = Path(options.audit), Path(options.out)
if out.exists():
    raise SystemExit("output already exists; refusing to overwrite")
report = json.loads((audit / "report.json").read_text())
if report["runtime_admission"] != "blocked_label_identity_unresolved" or report["clinical_validation"] != "pending":
    raise SystemExit("QA-only unresolved-label report required")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.unit_settings.system = "METRIC"
results = []
palette = [(0.8, 0.2, 0.2, 1), (0.2, 0.8, 0.2, 1), (0.2, 0.3, 0.8, 1), (0.8, 0.7, 0.2, 1), (0.6, 0.3, 0.8, 1)]
for index, region in enumerate(report["regions"]):
    key = region["id"]
    if key != f"parcel_{region['source_label']:02d}" or region["anatomical_name"] is not None:
        raise SystemExit("anonymous source IDs required")
    path = audit / (key + ".stl")
    if hashlib.sha256(path.read_bytes()).hexdigest() != region["stl_sha256"]:
        raise SystemExit(f"{key}: STL hash differs from audit")
    bpy.ops.wm.stl_import(filepath=str(path))
    ob = bpy.context.object
    ob.name = "FETAL_QA." + key.upper()
    for vertex in ob.data.vertices:
        vertex.co *= 0.001  # mm sumber → m, origin sumber dipertahankan
    bm = bmesh.new(); bm.from_mesh(ob.data)
    boundary = sum(e.is_boundary for e in bm.edges)
    nonmanifold = sum(not e.is_manifold for e in bm.edges)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    volume = bm.calc_volume(signed=True)
    bm.to_mesh(ob.data); bm.free()
    if boundary or nonmanifold or volume <= 0:
        raise SystemExit(f"{key}: invalid closed surface")
    if abs(volume * 1e9 - region["mesh_volume_mm3"]) / region["mesh_volume_mm3"] > 1e-4:
        raise SystemExit(f"{key}: Blender mesh volume differs from source export")
    mat = bpy.data.materials.new(key); mat.diffuse_color = palette[index % len(palette)]
    mat.use_nodes = True
    mat.node_tree.nodes.get("Principled BSDF").inputs["Base Color"].default_value = mat.diffuse_color
    ob.data.materials.append(mat)
    for poly in ob.data.polygons:
        poly.use_smooth = True
    for key_, value in {"source_label": region["source_label"], "source": report["source"], "license": report["license"],
                        "truth_class": "population_reference", "clinical_validation": "pending",
                        "anatomical_identity": "unresolved", "runtime_admission": "blocked_label_identity_unresolved",
                        "educational_only": True, "source_sha256": report["source_sha256"]}.items():
        ob[key_] = value
    results.append({"id": region["id"], "vertices": len(ob.data.vertices), "triangles": len(ob.data.polygons),
                    "boundary_edges": boundary, "nonmanifold_edges": nonmanifold, "volume_m3": volume})
out.mkdir(parents=True, exist_ok=False)
bpy.ops.wm.save_as_mainfile(filepath=str(out / "fetal_parcels_QA.blend"))
bpy.ops.export_scene.gltf(filepath=str(out / "fetal_parcels_QA.glb"), export_format="GLB", export_extras=True)
(out / "blender-report.json").write_text(json.dumps({"blender_version": bpy.app.version_string,
    "clinical_validation": "pending", "runtime_admission": report["runtime_admission"], "regions": results}, indent=2) + "\n")
print("QA-only parcel export:", len(results), "closed meshes; no runtime admission")
