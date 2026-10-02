#!/usr/bin/env python3
"""
Audit integritas mesh layer anatomi dengan Blender (bpy), tanpa mengubah aset.

Jalankan (Blender sebagai modul Python, tanpa layar):
  python scripts/blender/audit_anatomy_meshes.py --input public/anatomy --output data/anatomy-assets/mesh-quality.json [--layers skeletal,muscular]

Mengukur per layer: tepi non-manifold (bukan dibagi tepat 2 muka), tepi batas (1 muka), titik lepas,
muka berluas nol, dan mesh tanpa muka. Deterministik: tanpa jam/acak, urutan objek menurut nama.
Hanya MENGUKUR; tidak memperbaiki apa pun. Mesh anatomi sumber memang banyak yang terbuka (permukaan
organ) sehingga "non-manifold" di sini adalah temuan deskriptif, bukan otomatis cacat.
"""
import argparse, hashlib, json, sys
import bpy, bmesh

LAYERS = ["surface", "skeletal", "muscular", "cardiovascular", "nervous", "visceral", "lymphoid"]
ZERO_AREA = 1e-12  # m^2


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def audit_layer(path):
    clear_scene()
    bpy.ops.import_scene.gltf(filepath=path)
    meshes = sorted((o for o in bpy.data.objects if o.type == "MESH"), key=lambda o: o.name)
    totals = dict(meshes=0, vertices=0, edges=0, faces=0, nonManifoldEdges=0, boundaryEdges=0,
                  looseVertices=0, zeroAreaFaces=0, meshesWithoutFaces=0, meshesWithNonManifold=0)
    names = {}
    for o in meshes:
        names[o.name] = names.get(o.name, 0) + 1
        bm = bmesh.new()
        bm.from_mesh(o.data)
        totals["meshes"] += 1
        totals["vertices"] += len(bm.verts)
        totals["edges"] += len(bm.edges)
        totals["faces"] += len(bm.faces)
        nm = sum(1 for e in bm.edges if len(e.link_faces) > 2)
        bd = sum(1 for e in bm.edges if len(e.link_faces) == 1)
        totals["nonManifoldEdges"] += nm
        totals["boundaryEdges"] += bd
        totals["looseVertices"] += sum(1 for v in bm.verts if not v.link_edges)
        totals["zeroAreaFaces"] += sum(1 for f in bm.faces if f.calc_area() < ZERO_AREA)
        if not bm.faces:
            totals["meshesWithoutFaces"] += 1
        if nm:
            totals["meshesWithNonManifold"] += 1
        bm.free()
    totals["duplicateObjectNames"] = sum(1 for n in names.values() if n > 1)
    return totals


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--source", default="public/anatomy", help="direktori GLB sumber (untuk hash pengikat)")
    ap.add_argument("--layers", default=",".join(LAYERS))
    a = ap.parse_args()
    wanted = a.layers.split(",")
    for l in wanted:
        if l not in LAYERS:
            sys.exit(f"unknown layer {l}")
    try:
        with open(a.output) as fh:
            doc = json.load(fh)
    except FileNotFoundError:
        doc = {"layers": {}}
    doc["purpose"] = "Pengukuran integritas mesh layer anatomi terkirim dengan Blender (bpy). Deskriptif: tidak memperbaiki atau menilai kebenaran anatomi."
    doc["blenderVersion"] = bpy.app.version_string
    doc["zeroAreaThresholdM2"] = ZERO_AREA
    for layer in wanted:
        result = audit_layer(f"{a.input}/{layer}.glb")
        with open(f"{a.source}/{layer}.glb", "rb") as fh:
            result["sourceSha256"] = hashlib.sha256(fh.read()).hexdigest()  # mengikat hasil ke GLB terkirim
        doc["layers"][layer] = result
        print(layer, doc["layers"][layer], flush=True)
    doc["layers"] = {k: doc["layers"][k] for k in LAYERS if k in doc["layers"]}
    with open(a.output, "w") as fh:
        json.dump(doc, fh, indent=2)
        fh.write("\n")


if __name__ == "__main__":
    main()
