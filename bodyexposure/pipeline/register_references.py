"""Daftar referensi visual pemilik (art direction) — BUKAN sumber geometri anatomi.

  python3 bodyexposure/pipeline/register_references.py <folder sumber> [--copy <folder tujuan lokal>]

Mencatat setiap berkas: sha256, ukuran, dimensi gambar, generator (dari metadata GLB/FBX/nama berkas),
dan peran. Semua berkas di folder ini terdeteksi sebagai keluaran AI generatif (ChatGPT / Tripo), sehingga
perannya dibatasi: arah visual, tata letak tampilan, dan cakupan target. Tidak ada yang digabung ke tubuh kanonik.
"""
import hashlib, json, os, re, shutil, struct, subprocess, sys

src = sys.argv[1]
dst = sys.argv[sys.argv.index("--copy") + 1] if "--copy" in sys.argv else None
OUT = os.path.join(os.path.dirname(__file__), "..", "manifest", "references.json")

# peran per berkas yang sudah ditinjau secara visual (2026-10-03); sisanya mengikuti pola nama
ROLES = {
    "Panacea Body Exposure 2D.png": ("body_matrix_target",
        "Six-body neutral-pose sheet (adult male/female, elderly male, 15 y, 8 y, infant) with anterior, posterior, lateral, 3/4, head, hand and foot views. Sets the presentation view set and confirms an older-adult body is in scope."),
    "Body Exposure 2D Organ.png": ("system_coverage_checklist",
        "Twelve-system overview (integumentary to sensory) with per-system organ lists. Used as a coverage checklist against the source-backed structure inventory."),
    "Cardiovascular 2D Panacea.png": ("view_convention",
        "Multiscale sheet: six orthographic views with axis labels, 45-degree turntable, labelled close-ups with scale bars, projectile path through thoracic layers. Sets the benchmark view layout and the trauma-path visualisation brief."),
    "ChatGPT Image Oct 3, 2026, 04_05_59 PM.png": ("layer_sequence",
        "Female body exposure asset set: external to skeletal layer sequence plus regional and sectional detail panels. Sets the layer-peel order and regional close-up list."),
    "ChatGPT Image Oct 3, 2026, 05_55_34 PM.png": ("multiscale_hierarchy",
        "Chemical, cellular, tissue, organ and organ-system levels. Brief for multiscale zoom; out of scope for gross anatomy."),
    "ChatGPT Image Oct 3, 2026, 08_18_12 PM.png": ("view_convention",
        "Pelvic and reproductive multiscale sheet with orthographic views, sections and projectile trajectory panels."),
}


def kind(name):
    n = name.lower()
    if n.endswith((".glb", ".fbx")): return "mesh"
    if n.endswith(".zip"): return "archive"
    return "image"


def generator(path, name):
    if name.lower().endswith(".glb"):
        with open(path, "rb") as fh:
            fh.seek(12); n = struct.unpack("<I", fh.read(4))[0]; fh.seek(20); b = fh.read(n)  # potongan JSON utuh
        try:
            return json.loads(b).get("asset", {}).get("generator", "unknown")
        except Exception:
            return "unknown"
    if "tripo" in name.lower() or name.startswith("multiview_"): return "Tripo"
    if name.startswith("ChatGPT Image"): return "ChatGPT image generation"
    if name.lower().endswith((".zip", ".fbx")):
        if name.lower().endswith(".zip"):
            data = subprocess.run(["unzip", "-p", path], capture_output=True).stdout  # isi arsip, bukan hanya nama
            if b"tripo" in data.lower(): return "Tripo"
        elif b"tripo" in open(path, "rb").read().lower(): return "Tripo"
    return "AI-generated (owner-supplied; style matches ChatGPT image generation)"


def dims(path):
    r = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", path], capture_output=True, text=True).stdout
    v = re.findall(r"pixel(?:Width|Height): (\d+)", r)
    return [int(x) for x in v] if len(v) == 2 else None


rows = []
for root, dirs, files in os.walk(src):
    dirs[:] = [d for d in dirs if not d.endswith(".fbm")]  # tekstur di dalam .fbm dicatat lewat FBX induknya
    for f in sorted(files):
        if f.startswith("."): continue
        p = os.path.join(root, f); rel = os.path.relpath(p, src)
        h = hashlib.sha256(open(p, "rb").read()).hexdigest()
        k = kind(f)
        role, note = ROLES.get(f, (None, None))
        if role is None:
            if f.startswith("multiview_"): role, note = "generator_input", "Tripo multiview input image."
            elif k in ("mesh", "archive"): role, note = "not_used_geometry", "AI-generated mesh; not anatomical evidence and not merged."
            else: role, note = "system_art_direction", "System infographic used for colour, labelling and layout direction only."
        rows.append({"file": rel, "sha256": h, "bytes": os.path.getsize(p), "kind": k,
                     "pixels": dims(p) if k == "image" else None, "generator": generator(p, f),
                     "role": role, "note": note, "anatomical_evidence": False, "redistributed": False})
        if dst:
            os.makedirs(os.path.dirname(os.path.join(dst, rel)), exist_ok=True)
            shutil.copy2(p, os.path.join(dst, rel))
        if dst and k == "mesh" and f.lower().endswith(".fbx") and os.path.isdir(p[:-4] + ".fbm"):
            shutil.copytree(p[:-4] + ".fbm", os.path.join(dst, rel[:-4] + ".fbm"), dirs_exist_ok=True)
rows.sort(key=lambda r: r["file"])
json.dump({"registered": "2026-10-03", "source_folder": "owner-supplied 'Panaceamed Resources'",
           "policy": "Art direction and scope only. Generated images and meshes are never used as anatomical geometry, landmark positions or measurements.",
           "files": rows}, open(OUT, "w"), indent=1)
from collections import Counter
print(len(rows), "files", Counter(r["role"] for r in rows), Counter(r["generator"] for r in rows))
