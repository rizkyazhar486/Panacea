"""Terbitkan jangkar landmark untuk aplikasi: public/bodyexposure/anchors_adult_male.json.

Hanya landmark titik (point_landmark) dan hasil hitung (computed) yang punya struktur inang;
label grup/region tidak dicantumkan sebagai landmark satu struktur. Koordinat diubah ke kerangka
glTF Y-up (x, z, -y) agar sama dengan GLB. Jalankan dari akar repo: python3 bodyexposure/pipeline/publish_anchors.py
"""
import json, collections

a = json.load(open("bodyexposure/manifest/anchors.json"))["anchors"]
by = collections.defaultdict(list)
for x in a:
    if not x.get("anchor_of") or x.get("kind") == "group_label":
        continue
    p = x["position_m"]
    by[x["anchor_of"]].append({"id": x["id"], "name": (x.get("landmark") or "").lower(),
                               "p": [round(p[0], 4), round(p[2], 4), round(-p[1], 4)], "s": x.get("accuracy_status")})
out = {"frame": "glTF Y-up (x, z, -y of master)", "count": sum(len(v) for v in by.values()), "by_structure": by}
json.dump(out, open("public/bodyexposure/anchors_adult_male.json", "w"), separators=(",", ":"))
print(out["count"], len(by))
