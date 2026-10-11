"""Tubuh kanonik FETUS dari atlas MRI badan janin KCL (CC0 1.0): organ saja, rata-rata populasi, BUKAN satu individu.

  Blender -b -P bodyexposure/pipeline/build_fetus_atlas_body.py -- --stl ~/Documents/Panaceamed.id/bodyexposure/sources/fetal_atlas/stl

Masukan: keluaran fetal_atlas_to_stl.py (STL mm dalam kerangka kanonik + provenance.json dengan bukti orientasi). Konversi: mm → m, x,y dipusatkan pada kotak
pembatas organ, titik terendah di z = 0 (janin tidak punya kaki; bukan "kaki di lantai"). Material PAN_* dari master.
"""
import bpy, bmesh, json, os, re, sys, glob
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
STL = os.path.expanduser(argv[argv.index("--stl") + 1])
ROOT = os.path.expanduser("~/Documents/Panaceamed.id/bodyexposure")
BODY_ID = "FETUS"
PROV = json.load(open(os.path.join(STL, "provenance.json")))
SYSTEM = {"lungs": ("respiratory", "PAN_Lung"), "liver": ("digestive", "PAN_Organ"), "stomach": ("digestive", "PAN_Intestine"), "gallbladder": ("digestive", "PAN_Gallbladder"),
          "spleen": ("lymphatic", "PAN_Lymph"), "thymus": ("lymphatic", "PAN_Lymph"), "kidney pelvis": ("urinary", "PAN_Duct"),
          "kidney parenchyma": ("urinary", "PAN_Organ"), "bladder": ("urinary", "PAN_Organ"), "adrenal glands": ("endocrine", "PAN_Gland")}
NAME = {"lungs": "Lung", "kidney pelvis": "Renal pelvis", "kidney parenchyma": "Renal parenchyma", "adrenal glands": "Adrenal gland"}
SRC = "SVRTK fetal MRI atlas repository (King's College London, Centre for the Developing Brain); Uus et al., Sci Rep 14:6637 (2024), doi:10.1038/s41598-024-57087-x"
LICENSE = "CC0 1.0 Universal (repository); article CC BY 4.0"
INDIVIDUAL = ("Population-average atlas of 17 normal fetuses (3T T2-weighted MRI, 25 to 28 weeks gestational age according to the preprint), not an individual. "
              "Organs only: no skeleton, skin, brain, heart or gut. Not clinically reviewed.")
METHOD = "organ parcellation of a population-average T2w MRI atlas (King's College London), marching-cubes surface with volume-preserving smoothing"


def snake(s):
    return re.sub(r"_+", "_", re.sub(r"[^A-Z0-9]+", "_", s.upper())).strip("_")


bpy.ops.wm.read_factory_settings(use_empty=True)
with bpy.data.libraries.load(os.path.join(ROOT, "PANACEA_HUMAN_MASTER_v007.blend"), link=False) as (src, dst):
    dst.materials = [m for m in src.materials if m.startswith("PAN_")]
meshes = {}
for key, info in PROV["structures"].items():
    before = set(bpy.data.objects); bpy.ops.wm.stl_import(filepath=os.path.join(STL, key + ".stl"))
    ob = [o for o in bpy.data.objects if o not in before][0]; me = ob.data.copy(); bpy.data.objects.remove(ob)
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4); bm.to_mesh(me); bm.free()
    me.transform(Matrix.Scale(0.001, 4)); meshes[key] = (info, me)
allv = [v.co for _, me in meshes.values() for v in me.vertices]
cx = (min(v.x for v in allv) + max(v.x for v in allv)) / 2; cy = (min(v.y for v in allv) + max(v.y for v in allv)) / 2; zmin = min(v.z for v in allv)
coll = bpy.data.collections.new(BODY_ID); bpy.context.scene.collection.children.link(coll)
report = []
for key, (info, me) in meshes.items():
    me.transform(Matrix.Translation((-cx, -cy, -zmin)))
    sysn, mat = SYSTEM[info["name"]]; nm = NAME.get(info["name"], info["name"].capitalize()); side = info["side"]
    lat = {"L": "left", "R": "right"}.get(side, "unpaired")
    sid = f"{BODY_ID}.{snake(sysn)}.{snake(nm)}" + (f".{side}" if side else "")
    # lateralidade diuji terhadap geometri: +X = kiri subjek
    mx = sum(v.co.x for v in me.vertices) / len(me.vertices)
    if side and ((side == "L" and mx < 0) or (side == "R" and mx > 0)):
        raise SystemExit(f"{sid}: laterality contradicts geometry (centroid x {mx:+.4f} m)")
    me.name = sid; ob = bpy.data.objects.new(sid, me)
    bb = [Vector(v) for v in ob.bound_box]; c = (bb[0] + bb[6]) / 2; me.transform(Matrix.Translation(-c)); ob.location = c
    for p in me.polygons: p.use_smooth = True
    me.materials.append(bpy.data.materials[mat]); coll.objects.link(ob)
    meta = {"panacea_structure_id": sid, "panacea_body_id": BODY_ID, "canonical_name": nm, "panacea_system": sysn, "panacea_laterality": lat,
            "panacea_laterality_source": "connected_component_or_plane_verified_by_geometry", "panacea_source": f"{SRC}; label {info['label']} ({info['name']})",
            "panacea_license": LICENSE, "panacea_source_raw_name": info["name"], "panacea_method": METHOD, "panacea_accuracy_status": "source_backed",
            "panacea_review_status": "review_required", "panacea_version": "body_v014", "biological_sex_applicability": "unspecified", "panacea_educational_only": True,
            "panacea_kind": "organ", "panacea_individual": INDIVIDUAL, "panacea_clinically_reviewed": False,
            "panacea_known_limitations": ("Population-average atlas label, not any real fetus; one 3T T2w protocol; " + ("left and right lungs are one connected label and are split at a sagittal plane; " if info["name"] == "lungs" else "") + "organs only.")}
    for k, v in meta.items(): ob[k] = v
    report.append({"id": sid, "volume_cm3": info["volume_cm3"], "tris": sum(len(p.vertices) - 2 for p in me.polygons)})
bpy.context.view_layer.update()
zs = [v.z for o in coll.objects for v in (o.matrix_world @ Vector(c) for c in o.bound_box)]
coll["panacea_body_id"] = BODY_ID; coll["panacea_body_status"] = "source_backed_partial"; coll["panacea_body_source"] = f"{SRC}; {LICENSE}"
coll["panacea_individual"] = INDIVIDUAL
coll["panacea_body_frame"] = "+Z superior, +X subject left, -Y anterior, metres, lowest organ point at z=0; axis signs proven from anatomy (liver right of spleen, stomach anterior to kidney, thorax above abdomen), no mirror needed"
coll["panacea_extent_m"] = round(max(zs) - min(zs), 4)
path = f"{ROOT}/bodies/PANACEA_BODY_FETUS_ATLAS.blend"; os.makedirs(os.path.dirname(path), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=path)
res = {"body": BODY_ID, "structures": len(report), "extent_m": coll["panacea_extent_m"], "tris_total": sum(r["tris"] for r in report), "file": os.path.basename(path)}
json.dump({"summary": res, "structures": report, "orientation_checks": PROV["orientation_checks"]}, open(f"{ROOT}/qa_reports/fetus_atlas_build.json", "w"), indent=1)
print("BODY", res)
