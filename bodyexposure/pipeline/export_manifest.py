"""Ekspor lapisan metadata semantik dari master Blender ke JSON.

Dijalankan di dalam Blender (MCP atau `Blender -b master.blend -P export_manifest.py -- --out <dir>`).
Menghasilkan:
  body_matrix.json  — status tiap tubuh kanonik (sumber, status, kebutuhan data)
  structures.json   — satu entri per struktur: id, nama, sistem, lateralitas, sumber, status, statistik mesh
  anchors.json      — jangkar label semantik (posisi dunia + metode penentuan)
  qa_summary.json   — ringkasan QA mesh per tubuh/sistem
"""
import bpy, bmesh, json, os, sys, collections, datetime
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.join(os.path.dirname(bpy.data.filepath), "manifest")

KEYS = ["panacea_structure_id", "canonical_name", "panacea_body_id", "panacea_system", "panacea_kind", "panacea_laterality",
        "panacea_laterality_source", "panacea_position_side", "panacea_region", "panacea_source", "panacea_license",
        "panacea_source_raw_name", "panacea_accuracy_status", "panacea_review_status", "panacea_reference", "panacea_method",
        "panacea_known_limitations", "panacea_qa_note", "panacea_version", "biological_sex_applicability",
        "panacea_kind", "panacea_ta2_id", "panacea_latin_name", "panacea_name_fr", "panacea_ta2_match", "panacea_source_group", "panacea_individual", "panacea_clinically_reviewed"]


def mesh_stats(o):
    bm = bmesh.new(); bm.from_mesh(o.data)
    boundary = sum(1 for e in bm.edges if e.is_boundary)
    nonmanifold = sum(1 for e in bm.edges if not e.is_manifold and not e.is_boundary)
    tris = sum(len(f.verts) - 2 for f in bm.faces)
    bm.free()
    return {"verts": len(o.data.vertices), "tris": tris, "boundary_edges": boundary, "nonmanifold_edges": nonmanifold}


def run(out=OUT):
    os.makedirs(out, exist_ok=True)
    bpy.context.view_layer.update()
    root = bpy.context.scene.collection
    bodies = []
    for c in root.children:
        if "panacea_body_id" in c:
            ms = [o for o in c.all_objects if o.type == 'MESH']
            # tubuh tertaut (satu .blend per varian) dicatat lewat empty ROOT-nya
            linked = [{"body_id": e.get("panacea_body_id"), "file": e.get("panacea_body_file"),
                       "structures": e.get("panacea_structures"), "stature_m": e.get("panacea_stature_m"),
                       **{k: e[f"panacea_variant_{k}"] for k in ("label", "status", "source") if f"panacea_variant_{k}" in e}}
                      for e in c.objects if e.type == 'EMPTY' and e.instance_type == 'COLLECTION' and e.get("panacea_body_file")]
            if ms and linked:
                # entri dewasa: tubuh asli di master + varian tertaut (mis. ICRP) → tubuh asli jadi varian pertama
                zs = [(o.matrix_world @ Vector(k)).z for o in ms for k in o.bound_box]
                linked.insert(0, {"body_id": c["panacea_body_id"], "file": None, "structures": len(ms),
                                  "stature_m": round(max(zs) - min(zs), 4), "label": c.get("panacea_variant_label"),
                                  "status": c.get("panacea_body_status"), "source": c.get("panacea_body_source")})
            bodies.append({"variants": linked, "redistribution": c.get("panacea_redistribution"),
                "body_id": c["panacea_body_id"], "status": c.get("panacea_body_status"), "source": c.get("panacea_body_source"),
                "frame": c.get("panacea_body_frame"), "source_requirement": c.get("panacea_source_requirement"),
                "structures": len(ms) if ms and linked else len(ms) + sum(v["structures"] or 0 for v in linked), "verts": sum(len(o.data.vertices) for o in ms),
                "systems": dict(collections.Counter(o.get("panacea_system", "?") for o in ms)),
            })
    structs, qa = [], collections.defaultdict(lambda: collections.Counter())
    for o in bpy.data.objects:
        if o.type != 'MESH' or "panacea_structure_id" not in o:
            continue
        e = {k: o[k] for k in KEYS if k in o}
        for k in o.keys():
            if k.startswith("qa_"):
                e[k] = o[k]
        bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
        e["bbox_min_m"] = [round(min(v[i] for v in bb), 4) for i in range(3)]
        e["bbox_max_m"] = [round(max(v[i] for v in bb), 4) for i in range(3)]
        e["material"] = o.material_slots[0].material.name if o.material_slots and o.material_slots[0].material else None
        st = mesh_stats(o)
        e["mesh"] = st
        key = f'{e.get("panacea_body_id")}|{e.get("panacea_system")}'
        qa[key]["structures"] += 1
        qa[key]["verts"] += st["verts"]
        qa[key]["tris"] += st["tris"]
        qa[key]["open_meshes"] += 1 if st["boundary_edges"] else 0
        qa[key]["nonmanifold_meshes"] += 1 if st["nonmanifold_edges"] else 0
        structs.append(e)
    structs.sort(key=lambda e: e["panacea_structure_id"])
    anchors = []
    for o in bpy.data.objects:
        if o.type == 'EMPTY' and o.name.startswith("ANCHOR."):
            anchors.append({"id": o.name, "anchor_of": o.get("panacea_anchor_of"), "landmark": o.get("panacea_anchor_landmark"), "kind": o.get("panacea_anchor_kind"),
                            "surface_distance_mm": o.get("panacea_anchor_surface_distance_mm"), "method": o.get("panacea_anchor_method"),
                            "accuracy_status": o.get("panacea_accuracy_status"), "position_m": [round(x, 4) for x in o.matrix_world.translation]})
    meta = {"generated": datetime.datetime.now().isoformat(timespec="seconds"), "master": os.path.basename(bpy.data.filepath),
            "blender": bpy.app.version_string, "units": "metres", "frame": "+Z superior, +X subject left, -Y anterior",
            "educational_only": True}
    dump = lambda n, d: json.dump(d, open(os.path.join(out, n), "w"), indent=1, ensure_ascii=False)
    dump("body_matrix.json", {"meta": meta, "bodies": bodies})
    dump("structures.json", {"meta": meta, "count": len(structs), "structures": structs})
    dump("anchors.json", {"meta": meta, "anchors": anchors})
    dump("qa_summary.json", {"meta": meta, "by_body_system": {k: dict(v) for k, v in sorted(qa.items())}})
    return len(bodies), len(structs), len(anchors)


if __name__ == "__main__":
    print(run())
