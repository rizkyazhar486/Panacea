"""Langkah 2 (di master, via MCP): gabungkan struktur dari za_extra.blend ke HUMAN.ADULT.MALE.

Aturan (sama persis dengan yang dijalankan untuk master v007):
  - Dibuang: ikon koleksi (.g), garis label (.j / bahan 'Text'), garis acuan (meridian, ekuator,
    sumbu bola mata), grup di luar 2/3/4, dan duplikat nama-dasar yang sudah ada di master.
  - 2: Muscular insertions → area origo (.o) / insersio (.e); sufiks l/r = lateralitas.
    Tafsir .o/.e dikonfirmasi oleh nama bahan sumber 'Origin-*' / 'End-*'.
  - 3/4 → bursa, selubung tendon, fasia, kapsul, diskus/nukleus pulposus, kartilago/meniskus, ligamen.
"""
import bpy, re, mathutils

EXTRA = "/Users/rizkyazhar/Documents/Panaceamed.id/bodyexposure/sources/zanatomy/za_extra.blend"


def snake(s):
    return re.sub(r"_+", "_", re.sub(r"[^A-Z0-9]+", "_", s.upper())).strip("_")


def material(name, base, color, alpha=1.0, rough=None):
    M = bpy.data.materials
    m = M.get(name)
    if not m:
        m = M[base].copy(); m.name = name
        b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Alpha'].default_value = alpha
        if rough is not None:
            b.inputs['Roughness'].default_value = rough
        m.diffuse_color = (*color, alpha)
    return m


def collection(path):
    parent = bpy.data.collections[path.split("/")[0]]
    c = bpy.data.collections.get(path.split("/")[1]) or bpy.data.collections.new(path.split("/")[1])
    if c.name not in parent.children:
        parent.children.link(c)
    return c


def classify(raw, top, zm):
    """→ (nama, lateralitas, sistem, jenis, jalur koleksi) atau None bila dibuang."""
    if raw.endswith((".g", ".j")) or zm == "Text" or re.search(r"Meridians|Equator|External axis", raw):
        return None
    if top.startswith("2:"):
        m = re.match(r"^(.*)\.([oe])(\d*)([lr]?)$", raw)
        if not m:
            return None
        muscle, oe, idx, sd = m.groups()
        kind = "origin" if oe == "o" else "insertion"
        name = f"{muscle.strip('()')} {kind}" + (f" {idx}" if idx else "")
        return name, {"l": "left", "r": "right"}.get(sd, "unpaired"), "muscular", kind, "04_MUSCLE/04_MUSCLE.ATTACHMENTS"
    if not top.startswith(("3:", "4:")):
        return None
    lat, name = "unpaired", raw
    m = re.match(r"^(.*)\.([lr])$", raw)
    if m:
        name, lat = m.group(1), {"l": "left", "r": "right"}[m.group(2)]
    name = name.strip("()")
    low = (zm + " " + name).lower()
    for pat, kind, sysn, path in [
        ("bursa", "bursa", "muscular", "04_MUSCLE/04_MUSCLE.BURSAE_SHEATHS"),
        ("sheath", "tendon_sheath", "muscular", "04_MUSCLE/04_MUSCLE.BURSAE_SHEATHS"),
        ("fascia|septum|aponeuros", "fascia", "fascia", "05_FASCIA/05_FASCIA.SHEETS"),
        ("capsule", "capsule", "joint", "03_JOINTS/03_JOINTS.CAPSULES"),
        ("intervertebral disc|nucleus pulposus|annulus", "disc", "joint", "03_JOINTS/03_JOINTS.INTERVERTEBRAL_DISCS"),
        ("menisc|cartilage|disc|labrum", "cartilage", "joint", "03_JOINTS/03_JOINTS.CARTILAGE"),
    ]:
        if re.search(pat, low):
            return name, lat, sysn, kind, path
    return name, lat, "joint", "ligament", "03_JOINTS/03_JOINTS.LIGAMENTS"


def run():
    with bpy.data.libraries.load(EXTRA, link=False) as (src, dst):
        dst.objects = [n for n in src.objects if n.startswith("ZA::")]
    base = lambda n: re.sub(r"\.[a-z]$", "", re.sub(r"\.\d{3}$", "", n))
    have = {base(o["panacea_source_raw_name"]) for o in bpy.data.objects
            if o.get("panacea_body_id") == "HUMAN.ADULT.MALE" and "panacea_source_raw_name" in o}
    M = bpy.data.materials
    mats = {"capsule": material("PAN_JointCapsule", "PAN_Ligament", (0.70, 0.66, 0.58), rough=0.35),
            "ligament": M["PAN_Ligament"], "tendon_sheath": M["PAN_Ligament"], "cartilage": M["PAN_Cartilage"],
            "disc": M.get("PAN_Fibrocartilage") or M["PAN_Cartilage"],
            "bursa": material("PAN_Bursa", "PAN_Fluid", (0.62, 0.74, 0.86), alpha=0.55, rough=0.1),
            "fascia": material("PAN_Fascia", "PAN_Ligament", (0.78, 0.76, 0.70), alpha=0.6, rough=0.4),
            "origin": material("PAN_Attachment_Origin", "PAN_Tendon", (0.86, 0.42, 0.18), rough=0.5),
            "insertion": material("PAN_Attachment_Insertion", "PAN_Tendon", (0.20, 0.46, 0.86), rough=0.5)}
    used = {o.name for o in bpy.data.objects}
    added = 0
    for o in dst.objects:
        if o is None:
            continue
        raw, top, zm = o["za_raw_name"], o["za_top"], o["za_material"]
        c = classify(raw, top, zm)
        if c is None or base(raw) in have:
            bpy.data.objects.remove(o, do_unlink=True); continue
        name, lat, sysn, kind, path = c
        sid = f"ADULT.MALE.{snake(sysn)}.{snake(name)}" + {"left": ".L", "right": ".R"}.get(lat, "")
        k, i = sid, 2
        while k in used:
            k = f"{sid}.V{i}"; i += 1
        used.add(k)
        collection(path).objects.link(o)
        o.name = k; o.data.name = k
        bb = [mathutils.Vector(v) for v in o.bound_box]; ctr = (bb[0] + bb[6]) / 2
        o.data.transform(mathutils.Matrix.Translation(-ctr)); o.location = ctr
        o.data.materials.clear(); o.data.materials.append(mats[kind])
        for p in o.data.polygons:
            p.use_smooth = True
        meta = {"panacea_structure_id": k, "panacea_body_id": "HUMAN.ADULT.MALE", "canonical_name": name,
                "panacea_system": sysn, "panacea_kind": kind, "panacea_laterality": lat, "panacea_laterality_source": "name",
                "panacea_source": "Z-Anatomy full model (Startup.blend, derived from BodyParts3D, DBCLS); not in Panacea's original web export",
                "panacea_license": "CC BY-SA 4.0", "panacea_source_raw_name": raw,
                "panacea_source_group": top + " / " + o.get("za_sub", ""), "panacea_source_material": zm,
                "panacea_accuracy_status": "source_backed", "panacea_review_status": "review_required",
                "panacea_version": "body_v007", "panacea_educational_only": True,
                "biological_sex_applicability": "male_body_source"}
        for kk, vv in meta.items():
            o[kk] = vv
        for kk in ("za_raw_name", "za_collection", "za_top", "za_sub", "za_material"):
            if kk in o:
                del o[kk]
        added += 1
    return added


if __name__ == "__main__":
    print(run())
