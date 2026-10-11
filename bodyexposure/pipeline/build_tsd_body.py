"""Tubuh individu dari satu subjek TotalSegmentator dataset (v2.0.1, CC BY 4.0): lansia, cakupan sebagian (kepala sampai paha atas).

  Blender -b -P bodyexposure/pipeline/build_tsd_body.py -- --stl <dir dari tsd_masks_to_stl.py> --body-id TSD_S0196.OLDER_ADULT.FEMALE --version body_v001

STL dalam RAS mm (+X kanan, +Y anterior, +Z superior). Kanonik: +X kiri, −Y anterior, +Z superior, meter = (−x, −y, z)·0,001 (rotasi 180° mengelilingi Z, determinan +1, tanpa cermin);
XY dipusatkan di titik tengah kedua tulang pinggul, titik terendah = z 0 (di sini potongan paha: tubuh TIDAK lengkap). Lateralitas diuji terhadap geometri (+X = kiri subjek).
"""
import bpy, bmesh, os, sys, json
from mathutils import Vector, Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tsd_classes import classify

ROOT = os.path.expanduser("~/Documents/Panaceamed.id/bodyexposure")
MASTER = f"{ROOT}/PANACEA_HUMAN_MASTER_v007.blend"
OUT = f"{ROOT}/bodies"
_argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
_arg = lambda k, d=None: _argv[_argv.index(k) + 1] if k in _argv else d
STL = os.path.expanduser(_arg("--stl")); BODY_ID = _arg("--body-id"); VERSION = _arg("--version", "body_v001")
SOURCE = ("TotalSegmentator dataset v2.0.1 (Wasserthal et al., Radiology: Artificial Intelligence 2023; Zenodo 10047292), reference segmentations: made with iterative nnU-Net "
          "and corrected by a radiologist; CC BY 4.0")
METHOD = ("reference segmentation of the dataset (model-assisted, expert-corrected), CT resampled to 1.5 mm and cropped to the segmented region by the dataset authors; "
          "marching cubes, Taubin-smoothed. Not manual from scratch and not reviewed here")


def snake(s):
    import re
    return re.sub(r"[^A-Z0-9]+", "_", s.upper()).strip("_")


def load_stl(path):
    before = set(bpy.data.objects)
    bpy.ops.wm.stl_import(filepath=path)
    ob = [o for o in bpy.data.objects if o not in before][0]
    me = ob.data.copy(); bpy.data.objects.remove(ob)
    return me


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    with bpy.data.libraries.load(MASTER, link=False) as (src, dst):
        dst.materials = [m for m in src.materials if m.startswith("PAN_")]
    prov = json.load(open(f"{STL}/provenance.json")); meta = prov["meta"]
    age, sex = int(float(meta["age"])), {"f": "female", "m": "male"}[meta["gender"]]
    items = []
    for key in sorted(prov["structures"]):
        name, sysn, mat, kind, lat = classify(key)
        me = load_stl(f"{STL}/{key}.stl")
        bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4); bm.to_mesh(me); bm.free()
        me.transform(Matrix(((-0.001, 0, 0, 0), (0, -0.001, 0, 0), (0, 0, 0.001, 0), (0, 0, 0, 1))))
        items.append((key, name, sysn, mat, kind, lat, me))
    hips = [me for key, *_rest, me in items if key in ("hip_left", "hip_right")]
    assert len(hips) == 2, "both hip bones are needed to centre the body"
    allv = [v.co for me in hips for v in me.vertices]
    cx = (min(c.x for c in allv) + max(c.x for c in allv)) / 2; cy = (min(c.y for c in allv) + max(c.y for c in allv)) / 2
    zmin = min(v.co.z for *_r, me in items for v in me.vertices)
    coll = bpy.data.collections.new(BODY_ID); bpy.context.scene.collection.children.link(coll)
    seen, report, bad = set(), [], []
    for key, name, sysn, mat, kind, lat, me in items:
        me.transform(Matrix.Translation((-cx, -cy, -zmin)))
        unpaired = lat == "unpaired"
        sid = f"{BODY_ID}.{snake(sysn)}.{snake(name)}" + {"left": ".L", "right": ".R"}.get(lat, "")
        assert sid not in seen, sid
        seen.add(sid); me.name = sid
        ob = bpy.data.objects.new(sid, me)
        bb = [Vector(v) for v in ob.bound_box]; ctr = (bb[0] + bb[6]) / 2
        if not unpaired and ((lat == "left" and ctr.x < 0) or (lat == "right" and ctr.x > 0)): bad.append((sid, round(ctr.x, 3)))
        me.transform(Matrix.Translation(-ctr)); ob.location = ctr
        for p in me.polygons: p.use_smooth = True
        me.materials.append(bpy.data.materials[mat if mat in bpy.data.materials else "PAN_Organ"])
        coll.objects.link(ob)
        info = prov["structures"][key]
        bm = bmesh.new(); bm.from_mesh(me)
        report.append({"id": sid, "tris": sum(len(p.vertices) - 2 for p in me.polygons), "boundary_edges": sum(1 for e in bm.edges if e.is_boundary), "nonmanifold_edges": sum(1 for e in bm.edges if not e.is_manifold and not e.is_boundary)})
        bm.free()
        limits = "Segmented from one older adult's CT (resampled to 1.5 mm); smoothed surface; not patient-specific for any other person."
        if info["touches_ct_border"]: limits += " The structure is cut by the edge of the scanned region: it is incomplete."
        if info["largest_component_fraction"] < 0.9: limits += f" The mask has {info['components']} pieces (largest {info['largest_component_fraction']:.0%})."
        meta_props = {"panacea_structure_id": sid, "panacea_body_id": BODY_ID, "canonical_name": name, "panacea_system": sysn, "panacea_laterality": lat,
                      "panacea_laterality_source": "dataset_label_verified_by_geometry", "panacea_source": f"{SOURCE}; subject {prov['subject']}; class {key}",
                      "panacea_license": "CC BY 4.0 (TotalSegmentator dataset, Wasserthal et al.)", "panacea_source_raw_name": key, "panacea_method": METHOD,
                      "panacea_accuracy_status": "expert_refined_segmentation", "panacea_review_status": "review_required", "panacea_version": VERSION,
                      "biological_sex_applicability": sex, "panacea_educational_only": True, "panacea_kind": kind, "panacea_clinically_reviewed": False,
                      "panacea_individual": f"one individual from the dataset: {sex}, {age} years, {meta['study_type']}, pathology label '{meta['pathology']}'; not an atlas and not a reference older adult",
                      "panacea_known_limitations": limits, "panacea_dataset_subject": prov["subject"], "panacea_cut_by_scan_border": bool(info["touches_ct_border"])}
        notes = []
        if info["touches_ct_border"]: notes.append("Cut by the edge of the scanned region: this structure is incomplete.")
        if info["largest_component_fraction"] < 0.9: notes.append(f"The mask has {info['components']} pieces (largest {info['largest_component_fraction']:.0%}).")
        if notes: meta_props["panacea_qa_note"] = " ".join(notes)
        for k, v in meta_props.items(): ob[k] = v
    assert not bad, f"laterality contradicts geometry: {bad}"
    bpy.context.view_layer.update()
    zs = [v.z for o in coll.objects for v in (o.matrix_world @ Vector(c) for c in o.bound_box)]
    coll["panacea_body_id"] = BODY_ID; coll["panacea_body_status"] = "source_backed_partial"
    coll["panacea_body_source"] = SOURCE
    coll["panacea_individual"] = f"one individual from the dataset: {sex}, {age} years; partial body (head to upper thighs)"
    coll["panacea_body_frame"] = "+Z superior, +X subject left, -Y anterior, metres; XY centred on the midpoint of the hip bones; z=0 at the lowest scanned point (thigh cut), so this is NOT a standing height"
    coll["panacea_extent_m"] = round(max(zs) - min(zs), 4)
    os.makedirs(OUT, exist_ok=True)
    path = f"{OUT}/PANACEA_BODY_{BODY_ID.replace('.', '_')}.blend"
    bpy.ops.wm.save_as_mainfile(filepath=path)
    res = {"body": BODY_ID, "subject": prov["subject"], "age": age, "sex": sex, "structures": len(report), "extent_m": coll["panacea_extent_m"], "tris_total": sum(r["tris"] for r in report),
           "empty_classes": prov["empty"], "not_published": sorted(prov["not_published"]), "cut_by_scan_border": sorted(k for k, v in prov["structures"].items() if v["touches_ct_border"]),
           "open_boundary": sum(r["boundary_edges"] > 0 for r in report), "nonmanifold": sum(r["nonmanifold_edges"] > 0 for r in report)}
    json.dump({"summary": res, "structures": report}, open(f"{ROOT}/qa_reports/tsd_{prov['subject']}_build.json", "w"), indent=1)
    print("BODY", {k: v for k, v in res.items() if k not in ("cut_by_scan_border",)}, "cut:", len(res["cut_by_scan_border"]))


main()
