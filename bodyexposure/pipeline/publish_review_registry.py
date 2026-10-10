"""Registri tinjauan klinis per struktur untuk halaman dokter (/doctor-review/body).

  python3 bodyexposure/pipeline/publish_review_registry.py

Menulis public/bodyexposure/<tag>.review.json dari manifest/structures.json untuk setiap tubuh yang punya berkas web:
  {"body_id", "tag", "sources": [teks sumber unik], "rows": [[id, nama, lateralitas, sistem, status_akurasi, metode, versi_aset, indeks_sumber], ...]}
dan menyalin buku besar tinjauan (manifest/clinical_reviews.json) serta daftar peninjau berwenang (manifest/clinical_review_authorizations.json).

Registri TIDAK memuat bendera "ditinjau": status itu dihitung di halaman (dan di uji) dari buku besar memakai aturan yang sama
(domains/body-exposure/engine/structureReview.ts recordApproves). Versi aset = panacea_version + jumlah verteks/segitiga mesh:
berubah bila geometri berubah, sehingga catatan lama otomatis tidak berlaku untuk geometri baru.
"""
import glob, hashlib, json, os

PUB = "public/bodyexposure"
S = json.load(open("bodyexposure/manifest/structures.json"))["structures"]
tags = {os.path.basename(p).split(".")[0] for p in glob.glob(f"{PUB}/*.LOD*.glb")}


def tag_of(body_id):
    return body_id.replace("HUMAN.", "").replace(".", "_").lower()


def method_of(r):
    if r.get("panacea_accuracy_status") == "model_segmented": return "model_segmented"
    if str(r.get("panacea_method", "")).startswith("manual segmentation"): return "manual_segmentation"
    if r.get("panacea_accuracy_status") == "reference_stand_in": return "reference_stand_in"
    return "other"


by = {}
for r in S:
    by.setdefault(tag_of(r["panacea_body_id"]), []).append(r)
total = 0
for tag in sorted(tags & by.keys()):
    src, src_ix, rows = [], {}, []
    for r in sorted(by[tag], key=lambda r: r["panacea_structure_id"]):
        s = r.get("panacea_source", "")
        if s not in src_ix: src_ix[s] = len(src); src.append(s)
        m = r.get("mesh", {}); ver = f'{r.get("panacea_version", "?")}:{m.get("verts", 0)}v{m.get("tris", 0)}t'
        rows.append([r["panacea_structure_id"], r.get("canonical_name", ""), r.get("panacea_laterality", ""), r.get("panacea_system", ""),
                     r.get("panacea_accuracy_status", ""), method_of(r), ver, src_ix[s]])
    json.dump({"body_id": by[tag][0]["panacea_body_id"], "tag": tag, "sources": src, "rows": rows}, open(f"{PUB}/{tag}.review.json", "w"), separators=(",", ":"), ensure_ascii=False)
    total += len(rows)
    print(tag, len(rows))
for name in ("clinical_reviews.json", "clinical_review_authorizations.json"):
    open(f"{PUB}/{name}", "w").write(open(f"bodyexposure/manifest/{name}").read())
print("REGISTRY", total, "structures")
