"""Tubuh kanonik: tungkai bawah Visible Human Female (Univ. of Denver, CC BY 4.0).

  Blender -b -P bodyexposure/pipeline/build_vhf_lower_limb.py [-- --body-id VHF_DENVER_CT.ADULT.FEMALE --ct <dir STL dari ct_masks_to_stl.py>]

Sumber: sources/du_vhf/final_stl/{Left,Right}/VHF_<sisi>_<jenis>_<nama>_smooth.stl, dari Andreassen dkk., "Three-dimensional
lower extremity musculoskeletal geometry of the Visible Human Female and Male", Scientific Data 2023
(doi:10.1038/s41597-022-01905-2); data doi:10.56902/COB.vh.2022.0. Disegmentasi dari kriosection NLM Visible Human Female,
lalu dihaluskan (varian "Final"). Satu individu, satu pipeline: tidak dicampur dengan tubuh lain.

Konversi: STL dalam mm; sumbu sumber +X kanan subjek, +Y anterior, +Z superior. Kanonik master: +X kiri subjek, −Y anterior,
+Z superior, meter. Jadi rotasi 180° mengelilingi Z (x,y → −x,−y; determinan +1, tanpa cermin) lalu mm → m dan kaki ke z=0.
Diuji terhadap geometri: patela anterior terhadap femur (−Y), struktur "Left" berada di +X.
"""
import bpy, bmesh, re, os, sys, json, glob
from mathutils import Vector, Matrix

ROOT = os.path.expanduser("~/Documents/Panaceamed.id/bodyexposure")
SRC = f"{ROOT}/sources/du_vhf/final_stl"
OUT = f"{ROOT}/bodies"
MASTER = f"{ROOT}/PANACEA_HUMAN_MASTER_v007.blend"  # hanya sumber material PAN_*
_argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
_arg = lambda k, d=None: _argv[_argv.index(k) + 1] if k in _argv else d
BODY_ID = _arg("--body-id", "VHF_LOWER_LIMB.ADULT.FEMALE")  # --body-id VHF_DENVER_CT.ADULT.FEMALE --ct <dir STL TotalSegmentator> → tubuh gabungan
CT_DIR = os.path.expanduser(_arg("--ct")) if _arg("--ct") else None
VERSION = _arg("--version", "body_v012")  # versi aset: naik bila geometri berubah (catatan tinjauan klinis lama otomatis tidak berlaku)
PUB = "Andreassen et al., Scientific Data 10:34 (2023), Visible Human Female lower-extremity musculoskeletal geometry"
INDIVIDUAL = ("single individual from source data: Visible Human Female donor, 59 y, 62 in (157 cm), 88 kg, BMI 36 (Andreassen et al. 2023); "
              "not an atlas, not a reference adult female, not patient-specific")
LICENSE = "CC BY 4.0 (University of Denver Center for Orthopaedic Biomechanics), doi:10.56902/COB.vh.2022.0; underlying images courtesy of the U.S. National Library of Medicine"

# ejaan sumber → nama anatomis (Terminologia Anatomica bila berbeda). Tidak ada nama yang diubah artinya.
FIX = {"Calcaneous": "Calcaneus", "Illiacus": "Iliacus", "Quadratis": "Quadratus", "Semitendonosus": "Semitendinosus"}
NAMES = {  # nama sumber → nama kanonik; yang tidak ada di sini hanya dipecah per huruf kapital
    "Bone_Pelvis": "Hip bone (os coxae)",
    "Bone_Phalanges": "Metatarsals and phalanges (combined)",
    "Bone_Sacrum": "Sacrum", "Bone_Coccyx": "Coccyx",
    "Muscle_PeroneusLongus": "Fibularis (peroneus) longus",
    "Muscle_BicepsFemorisLong": "Biceps femoris, long head", "Muscle_BicepsFemorisLongHead": "Biceps femoris, long head",
    "Muscle_BicepsFemorisShort": "Biceps femoris, short head", "Muscle_BicepsFemorisShortHead": "Biceps femoris, short head",
    "Muscle_GastrocnemiusLateral": "Gastrocnemius, lateral head", "Muscle_GastrocnemiusMedial": "Gastrocnemius, medial head",
    "Muscle_TensorFasciaeLatae": "Tensor fasciae latae",
    "Cartilage_PelvisAcetabulum": "Acetabular articular cartilage", "Cartilage_FemurHead": "Femoral head articular cartilage",
    "Cartilage_FemurDistal": "Distal femoral articular cartilage", "Cartilage_TibiaLateral": "Lateral tibial plateau articular cartilage",
    "Cartilage_TibiaMedial": "Medial tibial plateau articular cartilage", "Cartilage_TibiaDistal": "Distal tibial articular cartilage",
    "Cartilage_Talus": "Talar articular cartilage", "Cartilage_Patella": "Patellar articular cartilage",
    "Ligament_ACL": "Anterior cruciate ligament", "Ligament_PCL": "Posterior cruciate ligament",
    "Ligament_MCL": "Medial collateral ligament (tibial collateral)", "Ligament_LCL": "Lateral collateral ligament (fibular collateral)",
}
KIND = {"Bone": ("skeletal", "PAN_Bone"), "Cartilage": ("joint", "PAN_Cartilage"), "Ligament": ("joint", "PAN_Ligament"),
        "Muscle": ("muscular", "PAN_Muscle")}


def snake(s):
    return re.sub(r"_+", "_", re.sub(r"[^A-Z0-9]+", "_", s.upper())).strip("_")


def pretty(raw):  # Muscle_AdductorLongus → "Adductor longus"
    kind, nm = raw.split("_", 1)
    if raw in NAMES:
        return NAMES[raw]
    for a, b in FIX.items():
        nm = nm.replace(a, b)
    words = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", nm).split()
    return " ".join([words[0]] + [w.lower() for w in words[1:]])


CT_METHOD = ("machine segmentation (TotalSegmentator, task total) of the Visible Human Female CT, 1.5 mm, largest connected component, Taubin-smoothed; "
             "not reviewed. Accuracy was measured only for femur, hip bone and sacrum against the Denver manual segmentation (median 0.6-2.9 mm); "
             "not measured for this bone")


ARM_STEMS = re.compile(r"(radius|ulna|hand_bones)_(left|right)$")
ARM_METHOD = ("threshold segmentation (HU > 250, distance-transform watershed, label propagation along the shaft) of the native-resolution Visible Human Female CT "
              "(0.72 x 0.72 x 1.0 mm), Taubin-smoothed; algorithmic, not a trained model and not manual; not reviewed. Accuracy was not measured against a reference. "
              "Script segment_ct_forearm_hand.py, report qa_reports/vhf_forearm_hand.json")
_ARM_JSON = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "qa_reports", "vhf_forearm_hand.json")  # laporan versi repo (yang dilacak git)
ARM_REPORT = json.load(open(_ARM_JSON)) if os.path.exists(_ARM_JSON) else None


def arm_note(stem):
    """catatan kelengkapan dari laporan segmentasi (celah ke humerus di ujung proksimal)."""
    m = ARM_STEMS.match(stem)
    if not m or not ARM_REPORT: return None
    info = ARM_REPORT["arms"].get(m.group(2), {}).get("meshes", {}).get(m.group(1))
    if m.group(1) == "hand_bones":
        return ("Carpals, metacarpals and phalanges are ONE mesh: individual bones were not separated (joint gaps are too small for an automatic split, and no manual "
                "segmentation exists). Wrist boundary with the radius and ulna is approximate.")
    if info and not info.get("proximal_end_complete", True):
        return (f"Proximal end is INCOMPLETE: the recovered bone stops {info['gap_to_humerus_mm']} mm short of the humerus. Near the elbow the bone touches a thin bright "
                "artefact along the skin surface of the CT block, which the segmentation removes together with thin cortex.")
    return "The proximal end reaches the humerus; the elbow joint surface is ragged where the cortex is thin and was not smoothed over."


def ct_name(stem):
    """vertebrae_C3 → ('Vertebra C3', 'unpaired'); rib_left_5 → ('Rib 5', 'left'); clavicula_left → ('Clavicle', 'left')."""
    m = re.match(r"rib_(left|right)_(\d+)$", stem)
    if m: return f"Rib {m.group(2)}", m.group(1)
    m = re.match(r"vertebrae_([CTL]\d+)$", stem)
    if m: return f"Vertebra {m.group(1)}", "unpaired"
    m = re.match(r"(clavicula|scapula|humerus)_(left|right)$", stem)
    if m: return {"clavicula": "Clavicle"}.get(m.group(1), m.group(1).capitalize()), m.group(2)
    m = re.match(r"(radius|ulna|hand_bones)_(left|right)$", stem)
    if m: return {"radius": "Radius", "ulna": "Ulna", "hand_bones": "Hand bones"}[m.group(1)], m.group(2)
    return {"skull": "Skull (cranium and mandible, one mesh)", "sternum": "Sternum"}[stem], "unpaired"


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
    files = sorted(glob.glob(f"{SRC}/Left/*.stl") + glob.glob(f"{SRC}/Right/*.stl"))
    meshes = []
    for f in files:
        m = re.match(r"VHF_(Left|Right)_(.+)_smooth\.stl$", os.path.basename(f))
        side, raw = m.group(1), m.group(2)
        me = load_stl(f)
        # STL tidak berbagi titik sudut: satukan titik yang berimpit agar mesh terhubung
        bm = bmesh.new(); bm.from_mesh(me)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)  # 0,1 mm dalam satuan sumber (mm)
        bm.to_mesh(me); bm.free()
        meshes.append((side, raw, os.path.basename(f), me))
    if CT_DIR:
        for f in sorted(glob.glob(f"{CT_DIR}/*.stl")):
            stem = os.path.basename(f)[:-4]
            if stem == "costal_cartilages":
                continue  # masker terpecah (18 bagian, komponen terbesar hanya 72 %): tidak dipublikasikan
            me = load_stl(f)
            bm = bmesh.new(); bm.from_mesh(me)
            bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
            bm.to_mesh(me); bm.free()
            meshes.append(("CT", "CT_" + stem, os.path.basename(f), me))
    # garis tengah tubuh = titik tengah kedua tulang pinggul (satuan sumber, mm); sumbu X/Y dipusatkan di sana
    ctr = {sd: Vector((0, 0, 0)) for sd in ("Left", "Right")}
    for sd, raw, _, me in meshes:
        if raw == "Bone_Pelvis":
            xs = [v.co for v in me.vertices]
            ctr[sd] = (Vector((min(c.x for c in xs), min(c.y for c in xs), 0)) + Vector((max(c.x for c in xs), max(c.y for c in xs), 0))) / 2
    mid = (ctr["Left"] + ctr["Right"]) / 2
    # sumber mm, +X kanan, +Y anterior → kanonik m, +X kiri, −Y anterior (rotasi 180° mengelilingi Z, determinan +1)
    to_canon = Matrix(((-0.001, 0, 0, 0), (0, -0.001, 0, 0), (0, 0, 0.001, 0), (0, 0, 0, 1))) @ Matrix.Translation((-mid.x, -mid.y, 0))
    for _, _, _, me in meshes:
        me.transform(to_canon)
    zmin = min(v.co.z for _, _, _, me in meshes for v in me.vertices)
    coll = bpy.data.collections.new(BODY_ID); bpy.context.scene.collection.children.link(coll)
    report, bad_side, seen = [], [], set()
    for side, raw, fname, me in meshes:
        is_ct = side == "CT"
        kind = "Bone" if is_ct else raw.split("_", 1)[0]
        sysn, matname = KIND[kind]
        me.transform(Matrix.Translation((0, 0, -zmin)))
        if is_ct:
            name, lat = ct_name(raw[3:]); unpaired = lat == "unpaired"
        else:
            name = pretty(raw)
            unpaired = raw in ("Bone_Sacrum", "Bone_Coccyx")
            lat = "unpaired" if unpaired else side.lower()
        cx = sum(v.co.x for v in me.vertices) / len(me.vertices)
        if not unpaired and ((lat == "left" and cx < 0) or (lat == "right" and cx > 0)):  # +X = kiri subjek
            bad_side.append((fname, round(cx, 4)))
        if is_ct and not unpaired and ((lat == "left" and cx < 0) or (lat == "right" and cx > 0)):
            bad_side.append((fname, round(cx, 4)))
        sid = f"{BODY_ID}.{snake(sysn)}.{snake(name)}" + {"left": ".L", "right": ".R"}.get(lat, "")
        if sid in seen:
            continue  # sakrum/koksiks ada hanya di folder Left; ejaan ganda tidak terjadi setelah normalisasi
        seen.add(sid)
        me.name = sid
        ob = bpy.data.objects.new(sid, me)
        bb = [Vector(v) for v in ob.bound_box]; ctr = (bb[0] + bb[6]) / 2
        me.transform(Matrix.Translation(-ctr)); ob.location = ctr
        for p in me.polygons:
            p.use_smooth = True
        me.materials.append(bpy.data.materials[matname])
        coll.objects.link(ob)
        bm = bmesh.new(); bm.from_mesh(me)
        boundary = sum(1 for e in bm.edges if e.is_boundary); nonman = sum(1 for e in bm.edges if not e.is_manifold and not e.is_boundary)
        bm.free()
        meta = {"panacea_structure_id": sid, "panacea_body_id": BODY_ID, "canonical_name": name, "panacea_system": sysn,
                "panacea_laterality": lat, "panacea_laterality_source": "source_label_verified_by_geometry",
                "panacea_source": ((f"Threshold segmentation of the NLM Visible Human Female CT (Denver aligned CT, CC BY 4.0); file {fname}" if ARM_STEMS.match(raw[3:]) else f"TotalSegmentator on the NLM Visible Human Female CT (Denver aligned CT, CC BY 4.0); file {fname}") if is_ct else f"{PUB}; file {fname}"),
                "panacea_license": LICENSE, "panacea_source_raw_name": raw[3:] if is_ct else raw,
                "panacea_method": (ARM_METHOD if ARM_STEMS.match(raw[3:]) else CT_METHOD) if is_ct else "manual segmentation of the cryosections (Denver, ScanIP S-2021.06)",
                "panacea_accuracy_status": ("threshold_segmented" if ARM_STEMS.match(raw[3:]) else "model_segmented") if is_ct else "source_backed", "panacea_review_status": "review_required",
                "panacea_version": VERSION, "biological_sex_applicability": "female", "panacea_educational_only": True,
                "panacea_kind": kind.lower(), "panacea_individual": INDIVIDUAL, "panacea_clinically_reviewed": False,
                "panacea_known_limitations": "Segmented from one cadaver (Visible Human Female); smoothed surface; not patient-specific." + (" The scan shows disrupted anatomy; a model can mislabel or fragment bones." if is_ct else "")}
        if raw == "Bone_Phalanges":
            meta["panacea_qa_note"] = ("Source provides the forefoot as one mesh labelled 'Phalanges'. Its extent (129 mm, starting at the tarsometatarsal level) "
                                       "and a top-view render show metatarsal shafts and toe bones together, so it is named accordingly. Not split because the bone boundaries "
                                       "are not in the source; the toe segmentation is coarse (holes between toes).")
        if is_ct and arm_note(raw[3:]):
            meta["panacea_qa_note"] = arm_note(raw[3:])
        if raw == "Bone_Pelvis":
            meta["panacea_qa_note"] = "One mesh per side for the whole hip bone (ilium, ischium, pubis); sacrum and coccyx are separate."
        for k, v in meta.items():
            ob[k] = v
        report.append({"id": sid, "tris": sum(len(p.vertices) - 2 for p in me.polygons), "boundary_edges": boundary, "nonmanifold_edges": nonman})
    assert not bad_side, f"laterality contradicts geometry: {bad_side}"
    # sanity orientasi: patela anterior (−Y) terhadap pusat femur, pada kedua sisi
    for s in ("L", "R"):
        pat = bpy.data.objects[f"{BODY_ID}.SKELETAL.PATELLA.{s}"].location.y
        fem = bpy.data.objects[f"{BODY_ID}.SKELETAL.FEMUR.{s}"].location.y
        assert pat < fem, f"patella not anterior to femur on {s}: {pat} vs {fem}"
    bpy.context.view_layer.update()
    zs = [v.z for o in coll.objects for v in (o.matrix_world @ Vector(c) for c in o.bound_box)]
    coll["panacea_body_id"] = BODY_ID
    coll["panacea_body_status"] = "source_backed_partial"
    coll["panacea_body_source"] = f"{PUB}; {LICENSE}"
    coll["panacea_individual"] = INDIVIDUAL
    coll["panacea_body_frame"] = "+Z superior, +X subject left, -Y anterior, metres, lowest point z=0 (rotation 180 deg about Z from the source frame; patella anterior to femur verified)"
    coll["panacea_extent_m"] = round(max(zs) - min(zs), 4)
    os.makedirs(OUT, exist_ok=True)
    path = f"{OUT}/PANACEA_BODY_{BODY_ID.replace('.', '_')}.blend"
    bpy.ops.wm.save_as_mainfile(filepath=path)
    res = {"body": BODY_ID, "structures": len(report), "extent_m": coll["panacea_extent_m"], "file": os.path.basename(path),
           "open_boundary": sum(r["boundary_edges"] > 0 for r in report), "nonmanifold": sum(r["nonmanifold_edges"] > 0 for r in report),
           "tris_total": sum(r["tris"] for r in report)}
    json.dump({"summary": res, "structures": report}, open(f"{ROOT}/qa_reports/vhf_lower_limb_build.json", "w"), indent=1)
    print("BODY", res)


main()
