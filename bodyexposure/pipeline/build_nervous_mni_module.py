"""Modul sistem saraf dalam koordinat template MNI152: edisi PUBLIK Clinical Neuroanatomy Atlas (Batuhan Ayci), bukan bagian dari tubuh individu mana pun.

  Blender -b -P bodyexposure/pipeline/build_nervous_mni_module.py -- --data <dir hasil ekstrak atlas-data-v1.0.3.tar.gz> [--version body_v001]

Mengapa modul terpisah: mesh atlas berada di ruang template MNI152NLin2009cAsym (rata-rata 152 otak), bukan di kerangka tubuh Denver/HuBMAP/Z-Anatomy
mana pun, dan sebagian (213 mesh Z-Anatomy/BodyParts3D) diregistrasi ke MNI dengan afin landmark (RMS permukaan 12,45 mm, p95 24,85 mm). Mereka TIDAK
digabung ke tubuh dewasa; koordinat MNI asli tiap struktur (centroid, mm) disimpan sebagai metadata.

Lisensi: data atlas CC BY-SA 4.0 (kode Apache-2.0). Tiap mesh membawa sumber dan lisensi aslinya; lapisan gabungan ini CC BY-SA 4.0 (kewajiban share-alike).
DIKECUALIKAN: sumber `mni_aseg` (30 mesh): segmentasi FreeSurfer pada template MNI tanpa lisensi tertulis untuk berkas label; tidak dapat dipastikan boleh didistribusikan ulang.

Konversi: koordinat simpul dalam GLB atlas adalah koordinat MNI RAS mm (x kanan, y anterior, z superior) ditulis langsung sebagai (x, y, z) glTF tanpa konversi sumbu
Y-atas; impor Blender memetakannya ke (x, −z, y). Jadi MNI = (X_b, Z_b, −Y_b). Kanonik: +X kiri, −Y anterior, +Z superior, meter = (−x, −y, z)·0,001 (rotasi 180° mengelilingi Z,
determinan +1, tanpa cermin); titik terendah modul di z = 0 (pergeseran dicatat). Setiap struktur DIVERIFIKASI: bbox hasil transformasi, dikembalikan ke MNI, harus cocok
dengan bbox manifest atlas (toleransi 0,7 mm; dekimasi dan kuantisasi) — kalau tidak, build dihentikan.
"""
import bpy, bmesh, os, sys, json, re
from mathutils import Vector, Matrix

ROOT = os.path.expanduser("~/Documents/Panaceamed.id/bodyexposure")
MASTER = f"{ROOT}/PANACEA_HUMAN_MASTER_v007.blend"  # hanya sumber material PAN_*
OUT = f"{ROOT}/bodies"
_argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
_arg = lambda k, d=None: _argv[_argv.index(k) + 1] if k in _argv else d
DATA = os.path.expanduser(_arg("--data"))
VERSION = _arg("--version", "body_v001")
BODY_ID = "ATLAS.NERVOUS.MNI152"
EXCLUDED_SOURCES = {"mni_aseg": "FreeSurfer aseg labels on the MNI template: no licence stated for the label file, redistribution not confirmed"}
SPACE = "MNI152NLin2009cAsym"
LAT_TOL_M = 0.03
ATLAS = "Clinical Neuroanatomy Atlas v1.0.3 (Batuhan Ayci; code Apache-2.0, data CC BY-SA 4.0), public edition, https://github.com/aycibatuhan/nervous-system-atlas"
ALIGN = {
    "native-mni": "defined natively on the MNI152NLin2009cAsym template",
    "registered-affine": "BodyParts3D/Z-Anatomy geometry placed into MNI space by a landmark affine (surface RMS 12.45 mm, p95 24.85 mm, mean landmark error 3.31 mm): approximate, not template anatomy",
    "warped-sym-to-asym": "defined on the symmetric MNI template and warped onto the asymmetric template",
    "nlin6-identity": "defined in the FSL MNI152NLin6 space and read as MNI152NLin2009cAsym without resampling (small offset possible)",
}
LICENSES = {  # lisensi sumber (kunci manifest) → teks; lapisan gabungan tetap CC BY-SA 4.0
    "CC-BY-SA-4.0": "CC BY-SA 4.0", "CC-BY-4.0": "CC BY 4.0", "CC0-1.0": "CC0 1.0", "Apache-2.0": "Apache-2.0",
    "CC-BY-4.0-BodyParts3D": "CC BY 4.0 (BodyParts3D, The Database Center for Life Science)", "MNI": "MNI/McGill permissive licence (copyright notice retained)",
}
# Sistem muatan bertahap (tiap sistem satu berkas GLB yang dimuat saat dinyalakan): saraf pusat dan pembuluh otak tampil awal (ATLAS_ON), sisanya menyusul.
SYSTEM_OF = {"arteries": "cardiovascular", "venous": "cardiovascular", "tracts": "tracts", "peripheral": "peripheral", "cranial-nerves": "peripheral",
             "autonomic": "peripheral", "arterial-territories": "territories", "meninges": "fascia", "spinal-cord": "spinal"}  # selebihnya: "nervous" (parenkim otak, batang otak, serebelum, ventrikel); medula spinalis dipisah agar bingkai awal kamera pada otak, bukan 1,8 m tubuh
EXCLUDED_IDS = {"envelope": "the MNI brain envelope is an opaque closed surface that would hide every structure inside it in the viewer"}
MATERIAL_OF = {
    "cerebrum": "PAN_GreyMatter", "cerebellum": "PAN_GreyMatter", "basal-ganglia": "PAN_Nucleus", "diencephalon": "PAN_Nucleus", "brainstem": "PAN_Nucleus",
    "tracts": "PAN_WhiteMatter", "spinal-cord": "PAN_WhiteMatter", "cranial-nerves": "PAN_Nerve", "peripheral": "PAN_Nerve", "autonomic": "PAN_Nerve",
    "venous": "PAN_Vein", "arteries": "PAN_PulmonaryArtery", "ventricles-csf": "PAN_Fluid", "meninges": "PAN_Fascia",
}


def snake(s):
    return re.sub(r"[^A-Z0-9]+", "_", s.upper()).strip("_")


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    with bpy.data.libraries.load(MASTER, link=False) as (src, dst):
        dst.materials = [m for m in src.materials if m.startswith("PAN_")]
    man = json.load(open(f"{DATA}/manifest.json"))
    assert man["edition"] == "public" and man["space"] == SPACE, (man["edition"], man["space"])
    meshes = [x for x in man["meshes"] if not x.get("nc") and not x.get("noRedistribution")]
    kept = [x for x in meshes if x["source"] not in EXCLUDED_SOURCES and x["system"] not in EXCLUDED_IDS]
    # impor Blender: (x_b, y_b, z_b) = (x_mni, −z_mni, y_mni); kanonik (m) = (−x_mni, −y_mni, z_mni)·0,001 = (−x_b, −z_b, −y_b)·0,001
    to_canon = Matrix(((-0.001, 0, 0, 0), (0, 0, -0.001, 0), (0, -0.001, 0, 0), (0, 0, 0, 1)))
    coll = bpy.data.collections.new(BODY_ID); bpy.context.scene.collection.children.link(coll)
    seen, report, skipped_missing, near_midline = {}, [], [], []
    objs = []
    for x in kept:
        path = f"{DATA}/{x['file']}"
        if not os.path.exists(path): skipped_missing.append(x["id"]); continue
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=path)
        new = [o for o in set(bpy.data.objects) - before]
        ms = [o for o in new if o.type == "MESH"]
        assert ms, f"no mesh in {path}"
        bpy.ops.object.select_all(action="DESELECT")
        for o in ms: o.select_set(True)
        bpy.context.view_layer.objects.active = ms[0]
        if len(ms) > 1: bpy.ops.object.join()
        ob = bpy.context.view_layer.objects.active
        me = ob.data.copy(); me.transform(ob.matrix_world)
        for o in new: bpy.data.objects.remove(o, do_unlink=True)
        me.transform(to_canon)
        # verifikasi sumbu: bbox dalam MNI (dikembalikan dari kanonik) harus sama dengan bbox manifest
        mn = [min(v.co[i] for v in me.vertices) for i in range(3)]; mx = [max(v.co[i] for v in me.vertices) for i in range(3)]
        mni_lo = [-mx[0] * 1000, -mx[1] * 1000, mn[2] * 1000]; mni_hi = [-mn[0] * 1000, -mn[1] * 1000, mx[2] * 1000]
        err = max(abs(a - b) for a, b in zip(mni_lo + mni_hi, list(x["bbox"][0]) + list(x["bbox"][1])))
        assert err < 0.7, f"axis check failed for {x['id']}: max bbox difference {err:.2f} mm"
        sysn = SYSTEM_OF.get(x["system"], "nervous")
        side = {"left": ".L", "right": ".R"}.get(x["side"], "")
        base = re.sub(r"\s*\((L|R)\)\s*$", "", x["name"])
        sid = f"{BODY_ID}.{sysn.upper()}.{snake(base)}{side}"
        if sid in seen:  # nama ganda antar-sumber: ID manifest membedakan
            sid = f"{BODY_ID}.{sysn.upper()}.{snake(base)}_{snake(x['id'])}{side}"
        assert sid not in seen, sid
        seen[sid] = x["id"]
        me.name = sid
        objs.append((sid, me, x, sysn, base))
    zmin = min(v.co.z for _, me, _, _, _ in objs for v in me.vertices)
    for sid, me, x, sysn, base in objs:
        me.transform(Matrix.Translation((0, 0, -zmin)))
        ob = bpy.data.objects.new(sid, me)
        bb = [Vector(v) for v in ob.bound_box]; ctr = (bb[0] + bb[6]) / 2
        # lateralitas terhadap geometri (+X = kiri subjek): salah tanda lebih dari LAT_TOL_M dihentikan; di dekat garis tengah hanya dicatat
        # (struktur registrasi afin berkesalahan RMS 12 mm; pusat bbox saraf panjang dapat melewati garis tengah)
        if (x["side"] == "left" and ctr.x < 0) or (x["side"] == "right" and ctr.x > 0):
            assert abs(ctr.x) <= LAT_TOL_M, f"laterality contradicts geometry for {sid}: x={ctr.x:.3f} m"
            near_midline.append({"id": sid, "x_m": round(ctr.x, 4), "alignment": x["alignment"]})
        me.transform(Matrix.Translation(-ctr)); ob.location = ctr
        for p in me.polygons: p.use_smooth = True
        mat = MATERIAL_OF.get(x["system"], "PAN_Organ")
        me.materials.append(bpy.data.materials[mat if mat in bpy.data.materials else "PAN_Organ"])
        coll.objects.link(ob)
        lic = LICENSES.get(x["license"], x["license"])
        meta = {
            "panacea_structure_id": sid, "panacea_body_id": BODY_ID, "canonical_name": base, "panacea_system": sysn,
            "panacea_laterality": {"left": "left", "right": "right"}.get(x["side"], "unpaired"), "panacea_laterality_source": "atlas_manifest_side",
            "panacea_source": f"{x['source']} ({lic}); via {ATLAS}", "panacea_license": f"{lic}; combined atlas layer CC BY-SA 4.0",
            "panacea_source_raw_name": x["id"], "panacea_method": f"template atlas mesh; {ALIGN.get(x['alignment'], x['alignment'])}",
            "panacea_accuracy_status": "atlas_template", "panacea_review_status": "review_required", "panacea_version": VERSION,
            "biological_sex_applicability": "both", "panacea_educational_only": True, "panacea_kind": x["system"],
            "panacea_individual": "template space (MNI152NLin2009cAsym), not an individual and not registered to any Body Exposure body",
            "panacea_clinically_reviewed": False, "panacea_template_space": SPACE, "panacea_mni_centroid_mm": json.dumps(x.get("centroid")),
            "panacea_alignment": x["alignment"], "panacea_known_limitations": "Template atlas geometry from published open datasets; smoothed and decimated; not patient-specific.",
        }
        if x.get("ontology"): meta["panacea_atlas_ontology"] = json.dumps(x["ontology"])
        for k, v in meta.items(): ob[k] = v
        bm = bmesh.new(); bm.from_mesh(me)
        report.append({"id": sid, "atlas_id": x["id"], "tris": sum(len(p.vertices) - 2 for p in me.polygons), "boundary_edges": sum(1 for e in bm.edges if e.is_boundary),
                       "nonmanifold_edges": sum(1 for e in bm.edges if not e.is_manifold and not e.is_boundary)})
        bm.free()
    bpy.context.view_layer.update()
    zs = [v.z for o in coll.objects for v in (o.matrix_world @ Vector(c) for c in o.bound_box)]
    coll["panacea_body_id"] = BODY_ID; coll["panacea_body_status"] = "atlas_template"
    coll["panacea_body_source"] = f"{ATLAS}; combined layer CC BY-SA 4.0"
    coll["panacea_individual"] = "template space (MNI152NLin2009cAsym), not an individual and not registered to any Body Exposure body"
    coll["panacea_body_frame"] = (f"{SPACE} template coordinates rotated into the canonical axes (+Z superior, +X left, -Y anterior), metres; lowest point z=0 "
                                  f"(shift {round(-zmin, 4)} m applied after the rotation); original MNI centroids kept per structure")
    coll["panacea_extent_m"] = round(max(zs) - min(zs), 4)
    os.makedirs(OUT, exist_ok=True)
    path = f"{OUT}/PANACEA_BODY_ATLAS_NERVOUS_MNI152.blend"
    bpy.ops.wm.save_as_mainfile(filepath=path)
    res = {"body": BODY_ID, "structures": len(report), "extent_m": coll["panacea_extent_m"], "file": os.path.basename(path), "tris_total": sum(r["tris"] for r in report),
           "atlas_meshes_total": len(man["meshes"]), "excluded": {k: sum(1 for x in meshes if x["source"] == k) for k in EXCLUDED_SOURCES} | {k: sum(1 for x in meshes if x["system"] == k) for k in EXCLUDED_IDS}, "missing_files": skipped_missing, "laterality_near_midline": near_midline,
           "open_boundary": sum(r["boundary_edges"] > 0 for r in report), "nonmanifold": sum(r["nonmanifold_edges"] > 0 for r in report)}
    json.dump({"summary": res, "structures": report, "atlas_manifest_generated": man.get("generated")}, open(f"{ROOT}/qa_reports/nervous_mni_build.json", "w"), indent=1)
    print("BODY", res)


main()
