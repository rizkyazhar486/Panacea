"""Indeks pencarian ringan per tubuh untuk aplikasi (sistem bisa dimuat bertahap, pencarian tetap lengkap).

  python3 bodyexposure/pipeline/publish_search_index.py

Menulis public/bodyexposure/<tag>.index.json = [[id, nama kanonik, lateralitas, sistem], ...] dari manifest/structures.json
untuk setiap tubuh yang punya berkas web.
"""
import glob, json, os

S = json.load(open("bodyexposure/manifest/structures.json"))["structures"]
tags = {os.path.basename(p).split(".")[0] for p in glob.glob("public/bodyexposure/*.glb")}
by = {}
for r in S:
    tag = r["panacea_body_id"].replace("HUMAN.", "").replace(".", "_").lower()
    by.setdefault(tag, []).append([r["panacea_structure_id"], r.get("canonical_name", ""), r.get("panacea_laterality", ""), r.get("panacea_system", "")])
for tag in sorted(tags & by.keys()):
    rows = sorted(by[tag])
    json.dump(rows, open(f"public/bodyexposure/{tag}.index.json", "w"), separators=(",", ":"), ensure_ascii=False)
    print(tag, len(rows))
