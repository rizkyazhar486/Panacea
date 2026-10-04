"""Koreksi label usus laki-laki dewasa + struktur BP3D yang benar-benar hilang (master v009 → v010).

Dijalankan di dalam Blender dengan master terbuka (MCP: exec(open(path).read())) atau headless:
  Blender -b PANACEA_HUMAN_MASTER_v009.blend -P bodyexposure/pipeline/apply_bp3d_corrections.py

Bukti (qa_reports/bp3d_junctions_pelvis.json, manifest/bp3d_icp.json, manifest/bp3d_label_audit.json):
- "Sigmoid colon" Z-Anatomy = mesh BP3D "rectum" (97 % verteks, 0 % > 1 cm); rentang z 0,925→0,808 m:
  puncak setinggi S3 (sendi sakroiliaka bawah 0,913 m), dasar di bawah diafragma pelvis (0,824 m) → rektum + kanal anal.
- "Jejunum" Z-Anatomy = jejunum 46 % + ileum 33 % BP3D → usus halus mesenterik.
- "Descending colon" memuat bagian sigmoid (melintas ke garis tengah di bawah pintu atas panggul) di kedua sumber.
- Sfingter ani eksterna BP3D ditambahkan (registrasi ICP pelvis, median jarak permukaan rujukan 1,1 mm).
- Sekum BP3D TIDAK ditambahkan: 60 % verteksnya berada di dalam mesh usus halus Z-Anatomy.
"""
import bpy, json, os
import numpy as np

ROOT = os.path.expanduser("~/Documents/Panaceamed.id/bodyexposure")
PIPE = os.path.join(ROOT, "pipeline") if os.path.exists(os.path.join(ROOT, "pipeline", "fit_bp3d_frame.py")) else os.path.dirname(os.path.abspath(__file__ if "__file__" in globals() else "."))
SRC = f"{ROOT}/sources/bodyparts3d"
MAN = os.environ.get("PANACEA_MANIFEST_DIR", f"{ROOT}/manifest")
BP3D_SRC = "BodyParts3D 4.0 partof (DBCLS), element files {}"
BP3D_LIC = "CC BY-SA 2.1 JP (OBJ header); CC BY 4.0 (DBCLS licence page, 2026-10-03)"

RELABEL = {  # id lama → (id baru, nama kanonik, catatan)
    "ADULT.MALE.DIGESTIVE.SIGMOID_COLON": ("ADULT.MALE.DIGESTIVE.RECTUM", "Rectum",
        "Z-Anatomy labels this mesh 'Sigmoid colon'; it is the BodyParts3D 'rectum' mesh (FMA14544; 97% of vertices map to it, none farther than 1 cm). "
        "It runs from S3 level (z 0.925 m) to below the pelvic diaphragm (z 0.808 m), so it is the rectum including the anal canal. Relabelled to the BodyParts3D concept."),
    "ADULT.MALE.DIGESTIVE.JEJUNUM": ("ADULT.MALE.DIGESTIVE.JEJUNUM_AND_ILEUM", "Jejunum and ileum",
        "Z-Anatomy labels this mesh 'Jejunum'; it spans both the BodyParts3D jejunum (46% of vertices) and ileum (33%), i.e. the whole mesenteric small intestine. Not split: 16% of vertices lie over 1 cm from either source part."),
    "ADULT.MALE.DIGESTIVE.DESCENDING_COLON": ("ADULT.MALE.DIGESTIVE.DESCENDING_AND_SIGMOID_COLON", "Descending and sigmoid colon",
        "Below the pelvic brim this mesh turns medially to the midline (x -0.017 m at z 0.873 m), which is the sigmoid colon; BodyParts3D 4.0 has no separate sigmoid mesh either."),
}
ADD = [("external anal sphincter", "ADULT.MALE.MUSCULAR.EXTERNAL_ANAL_SPHINCTER", "External anal sphincter", "muscular", "PAN_Muscle",
        "Encircles the anal canal; 9.5% of its vertices lie inside the rectum mesh, less than the 22% overlap between the same two meshes inside BodyParts3D itself.")]

G = json.load(open(f"{MAN}/bp3d_frame.json")); I = json.load(open(f"{MAN}/bp3d_icp.json"))["pelvis"]
s, R, t = G["scale"], np.array(G["rotation"]), np.array(G["translation_m"]); Ri, ti = np.array(I["rotation"]), np.array(I["translation_m"])
elems = {}
for line in open(f"{SRC}/partof_element_parts.txt").read().splitlines()[1:]:
    c, n, e = line.split("\t")[:3]; elems.setdefault(n.strip().lower(), []).append((c, e.strip()))

log = {"relabelled": [], "added": [], "references_updated": 0}
for old, (new, name, note) in RELABEL.items():
    o = bpy.data.objects.get(old)
    if o is None:
        continue
    o.name = new; o.data.name = new
    prev = list(o.get("panacea_previous_ids", [])) + [old]
    o["panacea_previous_ids"] = prev; o["panacea_structure_id"] = new; o["canonical_name"] = name
    o["panacea_source_label"] = o.get("panacea_source_raw_name", "")
    o["panacea_accuracy_status"] = "source_backed_corrected"; o["panacea_qa_note"] = note
    for k in ("panacea_ta2_id", "panacea_latin_name", "panacea_name_fr"):
        if k in o: del o[k]  # nama Latin lama milik label lama; diisi ulang oleh annotate_ta2
    log["relabelled"].append([old, new])
    for x in bpy.data.objects:  # jangkar/empty yang merujuk id lama
        for k in list(x.keys()):
            if x[k] == old:
                x[k] = new; log["references_updated"] += 1

ref = bpy.data.objects.get("ADULT.MALE.DIGESTIVE.RECTUM")
for bp_name, sid, name, sysn, mat, note in ADD:
    if sid in bpy.data.objects:
        continue
    V, F = [], []
    for c, e in elems[bp_name]:
        off = len(V)
        for l in open(f"{SRC}/partof_BP3D_4.0_obj_99/{e}.obj"):
            if l.startswith("v "): V.append(list(map(float, l.split()[1:4])))
            elif l.startswith("f "): F.append([off + int(x.split("/")[0]) - 1 for x in l.split()[1:]])
    Vt = (Ri @ ((s * (R @ np.array(V).T)).T + t).T).T + ti
    ctr = (Vt.min(0) + Vt.max(0)) / 2
    me = bpy.data.meshes.new(sid); me.from_pydata((Vt - ctr).tolist(), [], F); me.validate(clean_customdata=False)
    for p in me.polygons: p.use_smooth = True
    if mat in bpy.data.materials: me.materials.append(bpy.data.materials[mat])
    ob = bpy.data.objects.new(sid, me); ob.location = ctr.tolist()
    sibling = next(x for x in bpy.data.objects if x.get("panacea_body_id") == "HUMAN.ADULT.MALE" and x.get("panacea_system") == sysn and x.type == 'MESH')
    for col in sibling.users_collection: col.objects.link(ob)
    if sibling.parent is not None:
        ob.parent = sibling.parent; ob.matrix_parent_inverse = sibling.parent.matrix_world.inverted()
    meta = {"panacea_structure_id": sid, "panacea_body_id": "HUMAN.ADULT.MALE", "canonical_name": name, "panacea_system": sysn,
            "panacea_laterality": "unpaired", "panacea_laterality_source": "name",
            "panacea_source": BP3D_SRC.format(", ".join(e for _, e in elems[bp_name])) + f" — concept {elems[bp_name][0][0]}",
            "panacea_license": BP3D_LIC, "panacea_source_raw_name": bp_name,
            "panacea_registration": "global similarity fit (manifest/bp3d_frame.json) + pelvic rigid ICP (manifest/bp3d_icp.json, median reference surface distance 1.1 mm)",
            "panacea_accuracy_status": "source_backed", "panacea_review_status": "review_required", "panacea_version": "body_v010",
            "biological_sex_applicability": "male", "panacea_qa_note": note, "panacea_educational_only": True}
    for k, v in meta.items(): ob[k] = v
    log["added"].append(sid)
print("BP3D_CORRECTIONS", json.dumps(log))
