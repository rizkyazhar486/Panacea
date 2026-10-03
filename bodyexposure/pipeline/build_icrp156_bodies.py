"""Tubuh kanonik dari ICRP: pediatrik (Publication 156) dan dewasa referensi (Publication 145, --only AM,AF).

  Blender -b -P bodyexposure/pipeline/build_icrp156_bodies.py -- [--only 00M,05F]

Sumber: sources/icrp156/MRCP_<usia><jk>.obj (versi polygon-mesh), dibangun ICRP dari citra CT orang
nyata dan disesuaikan dengan parameter anatomi rujukan Publication 89. BUKAN dewasa yang diskalakan.

Konversi (terverifikasi pada 05M): satuan cm → m; +Z superior; sternum di −Y (anterior); hati di −X
(kanan subjek) — sama persis dengan konvensi master, jadi hanya skala 0,01 (seragam, satuan) dan kaki ke z=0.

Disaring: lapisan target dosimetri (…um), spongiosa & kavum medula (interior tulang), isi lumen/udara,
RST (jaringan lunak sisa). Dipertahankan: permukaan organ, korteks tulang (= bentuk luar tulang),
dinding luar (…_surface), kulit permukaan, bola mata, gigi, kelenjar getah bening, darah arteri/vena besar.
"""
import bpy, bmesh, re, os, sys, json
from mathutils import Vector, Matrix

ROOT = os.path.expanduser("~/Documents/Panaceamed.id/bodyexposure")
SRC = f"{ROOT}/sources/icrp156"
OUT = f"{ROOT}/bodies"
MASTER = f"{ROOT}/PANACEA_HUMAN_MASTER_v007.blend"  # hanya sumber material PAN_*
STAGES = {"00": ("NEONATE", "newborn"), "01": ("INFANT", "1 year"), "05": ("CHILD_5Y", "5 years"),
          "10": ("CHILD_10Y", "10 years"), "15": ("ADOLESCENT", "15 years"),
          "A": ("ADULT", "adult")}  # ICRP Publication 145 (MRCP_AM / MRCP_AF), konvensi grup sama
SRC145 = f"{ROOT}/sources/icrp145"
SEX = {"M": "MALE", "F": "FEMALE"}

DROP = re.compile(r"(_-?\d+um\b|_-?\d+um_|spongiosa|medullary|contents|\(air\)|^Air_remaining$|^RST$|Teeth_retention|^Skin_(40|100)um)", re.I)
SYSTEMS = [  # (pola, sistem, bahan)
    (r"cortical|^cartilage", "skeletal", "PAN_Bone"),  # grup tulang ICRP: …_cortical (dewasa juga …_cortical_surrounding_…)
    (r"enamel|dentin|cementum|pulp|^teeth$", "digestive", "PAN_Enamel"),
    (r"blood_in_large_arteries", "cardiovascular", "PAN_Artery"),
    (r"blood_in_large_veins", "cardiovascular", "PAN_Vein"),
    (r"heart", "cardiovascular", "PAN_Myocardium"),
    (r"lung|trachea|^ET[12]|^BB|bronch", "respiratory", "PAN_Lung"),
    (r"brain|spinal_cord", "nervous", "PAN_GreyMatter"),
    (r"lens|cornea|aqueous|vitreous", "sensory", "PAN_Sclera"),
    (r"lymphatic|thymus|spleen|tonsil", "lymphatic", "PAN_Lymph"),
    (r"adrenal|pituitary|thyroid|pancreas", "endocrine", "PAN_Gland"),
    (r"kidney|ureter|urinary_bladder", "urinary", "PAN_Organ"),
    (r"testis|prostate|ovar|uterus|breast", "reproductive", "PAN_Gland"),
    (r"liver|gall|stomach|intestine|colon|rectum|oesophagus|salivary|tongue|oral_mucosa", "digestive", "PAN_Intestine"),
    (r"^muscle$", "muscular", "PAN_Muscle"),
    (r"skin", "surface", "PAN_Skin"),
]


# kode saluran napas ICRP (Human Respiratory Tract Model, Publication 66) → nama anatomis
AIRWAY = {"ET1": "Extrathoracic airway ET1 (anterior nasal passage)",
          "ET2": "Extrathoracic airway ET2 (posterior nasal passage, pharynx, larynx)",
          "BB1": "Bronchi (BB region)", "BB": "Bronchi (BB region)"}


def snake(s):
    return re.sub(r"_+", "_", re.sub(r"[^A-Z0-9]+", "_", s.upper())).strip("_")


def parse(path):
    V, groups, g = [], {}, None
    with open(path) as f:
        for line in f:
            if line.startswith("v "):
                x, y, z = line.split()[1:4]; V.append((float(x), float(y), float(z)))
            elif line.startswith("g "):
                g = line[2:].strip(); groups.setdefault(g, [])
            elif line.startswith("f ") and g is not None:
                groups[g].append([int(t.split("/")[0]) - 1 for t in line.split()[1:]])
    return V, groups


def classify(label):
    if DROP.search(label):
        return None
    for pat, sysn, mat in SYSTEMS:
        if re.search(pat, label, re.I):
            return sysn, mat
    return "visceral_unclassified", "PAN_Organ"


def build(code):
    age, sx = code[:-1], code[-1]
    stage, age_label = STAGES[age]
    adult = age == "A"
    body_id = f"ICRP.ADULT.{SEX[sx]}" if adult else f"PEDIATRIC.{stage}.{SEX[sx]}"
    pub = "ICRP Publication 145, adult mesh-type reference computational phantom" if adult else "ICRP Publication 156, paediatric mesh-type reference computational phantom"
    bpy.ops.wm.read_factory_settings(use_empty=True)
    with bpy.data.libraries.load(MASTER, link=False) as (src, dst):
        dst.materials = [m for m in src.materials if m.startswith("PAN_")]
    V, groups = parse(f"{SRC145 if adult else SRC}/MRCP_{code}.obj")
    zmin = min(v[2] for v in V) * 0.01
    coll = bpy.data.collections.new(body_id); bpy.context.scene.collection.children.link(coll)
    kept = dropped = 0
    for raw, faces in groups.items():
        m = re.match(r"^(\d+)_(.*)$", raw)
        if not m or not faces:
            continue
        organ_id, label = m.groups()
        c = classify(label)
        if c is None:
            dropped += 1; continue
        sysn, matname = c
        used = sorted({i for f in faces for i in f})
        remap = {o: n for n, o in enumerate(used)}
        verts = [(V[i][0] * 0.01, V[i][1] * 0.01, V[i][2] * 0.01 - zmin) for i in used]
        me = bpy.data.meshes.new(raw)
        me.from_pydata(verts, [], [[remap[i] for i in f] for f in faces])
        me.validate(clean_customdata=False)
        lat = "left" if re.search(r"_left(?=_|$)", label, re.I) else "right" if re.search(r"_right(?=_|$)", label, re.I) else "unpaired"
        name = re.sub(r"_(left|right)(?=_|$)", "", label, flags=re.I)  # kata sisi bisa di tengah nama
        name = re.sub(r"_surface$", "", name).replace("_", " ").replace("(AI)", "").strip()
        name = AIRWAY.get(name, name)
        # label sisi sumber diuji terhadap geometri (+X = kiri subjek); bila bertentangan dikoreksi & dicatat
        cx = sum(v[0] for v in verts) / len(verts)
        side_fix = None
        if (lat == "left" and cx < -0.003) or (lat == "right" and cx > 0.003):
            side_fix = f"Source group '{raw}' is labelled {lat} but its centroid lies at x={cx:+.4f} m; laterality corrected from geometry."
            lat = "right" if lat == "left" else "left"
        sid = f"{body_id}.{snake(sysn)}.{snake(name)}" + {"left": ".L", "right": ".R"}.get(lat, "")
        if sid in bpy.data.objects:
            sid += f".ID{organ_id}"
        ob = bpy.data.objects.new(sid, me); me.name = sid
        bb = [Vector(v) for v in ob.bound_box]; ctr = (bb[0] + bb[6]) / 2
        me.transform(Matrix.Translation(-ctr)); ob.location = ctr
        for p in me.polygons:
            p.use_smooth = True
        if matname in bpy.data.materials:
            me.materials.append(bpy.data.materials[matname])
        coll.objects.link(ob)
        meta = {"panacea_structure_id": sid, "panacea_body_id": body_id, "canonical_name": name,
                "panacea_system": sysn, "panacea_laterality": lat, "panacea_laterality_source": "name",
                "panacea_source": f"{pub} MRCP_{code} ({age_label}, {SEX[sx].lower()})",
                "panacea_license": f"{pub.split(',')[0]} reference phantom data; redistribution in Panacea cleared by the project owner (2026-10-03, ICRP-derived meshes)",
                "panacea_source_raw_name": raw, "panacea_icrp_organ_id": int(organ_id),
                "panacea_accuracy_status": "source_backed", "panacea_review_status": "review_required",
                "panacea_developmental_stage": stage.lower(), "panacea_age": age_label, "panacea_version": "body_v010",
                "biological_sex_applicability": SEX[sx].lower(),
                "panacea_educational_only": True}
        if side_fix:
            meta["panacea_laterality_source"] = "geometry_override"; meta["panacea_qa_note"] = side_fix
        elif re.search(r"cortical", label, re.I):
            meta["panacea_qa_note"] = "Cortical-bone surface of the ICRP bone region (outer bone shape); spongiosa/medulla omitted."
        for k, v in meta.items():
            ob[k] = v
        kept += 1
    coll["panacea_body_id"] = body_id
    coll["panacea_body_status"] = "source_backed"
    coll["panacea_body_source"] = f"{pub.split(',')[0]} MRCP_{code} (CT-based reference phantom, adjusted to ICRP Publication 89 reference values)"
    coll["panacea_body_frame"] = "+Z superior, +X subject left, -Y anterior, metres, feet at z=0 (verified: sternum -Y, liver -X)"
    coll["panacea_stature_m"] = round(max(v[2] for v in V) * 0.01 - zmin, 4)
    os.makedirs(OUT, exist_ok=True)
    path = f"{OUT}/PANACEA_BODY_{body_id.replace('.', '_')}.blend"
    bpy.ops.wm.save_as_mainfile(filepath=path)
    return {"body": body_id, "kept": kept, "dropped": dropped, "stature_m": coll["panacea_stature_m"], "file": os.path.basename(path)}


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    only = argv[argv.index("--only") + 1].split(",") if "--only" in argv else [f"{a}{s}" for a in STAGES if a != "A" for s in "MF"]  # dewasa: --only AM,AF
    res = [build(c) for c in only]
    rp = f"{ROOT}/bodies/build_report.json"
    old = {r["body"]: r for r in json.load(open(rp))} if os.path.exists(rp) else {}
    old.update({r["body"]: r for r in res})  # gabung, jangan timpa hasil tubuh lain
    json.dump(sorted(old.values(), key=lambda r: r["file"]), open(rp, "w"), indent=1)
    for r in res:
        print("BODY", r)
