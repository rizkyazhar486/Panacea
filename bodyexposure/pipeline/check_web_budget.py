"""Gerbang budget poligon web: tampilan awal tiap tubuh di aplikasi ≤ 80.000 segitiga.

  python3 bodyexposure/pipeline/check_web_budget.py [--dir public/bodyexposure] [--budget 80000]

Dihitung langsung dari GLB yang diterbitkan (jumlah indeks accessor / 3), untuk LOD ringan (LOD4 bila ada,
selain itu LOD3) dan sistem yang tampil default (DEFAULT_ON di CanonicalBody.tsx). Keluar dengan kode 1 bila gagal.
"""
import argparse, glob, json, os, re, struct, sys

ap = argparse.ArgumentParser(); ap.add_argument("--dir", default="public/bodyexposure"); ap.add_argument("--budget", type=int, default=80000)
a = ap.parse_args()
src = open("src/pages/CanonicalBody.tsx").read()
DEFAULT_ON = set(re.findall(r"'(\w+)'", re.search(r"DEFAULT_ON = new Set\(\[(.*?)\]\)", src).group(1)))


def tris(path):
    with open(path, "rb") as f:
        f.seek(12); n = struct.unpack("<I", f.read(4))[0]; f.seek(20); j = json.loads(f.read(n))
    acc = j["accessors"]
    return sum(acc[p["indices"]]["count"] // 3 for m in j.get("meshes", []) for p in m["primitives"] if "indices" in p)


bodies = {}
for p in glob.glob(os.path.join(a.dir, "*.LOD[34].glb")):
    tag, sysn, lod = os.path.basename(p).rsplit(".", 3)[:3]
    bodies.setdefault(tag, {}).setdefault(lod, {})[sysn] = tris(p)
rows, fail = [], []
for tag, lods in sorted(bodies.items()):
    lod = "LOD4" if "LOD4" in lods else "LOD3"
    initial = sum(t for s, t in lods[lod].items() if s in DEFAULT_ON); total = sum(lods[lod].values())
    rows.append({"body": tag, "light_lod": lod, "initial_tris": initial, "all_systems_tris": total})
    if initial > a.budget: fail.append(tag)
json.dump({"budget": a.budget, "default_systems": sorted(DEFAULT_ON), "bodies": rows, "ok": not fail},
          open("bodyexposure/qa_reports/web_budget.json", "w"), indent=1)
for r in rows: print(f"{r['body']:32s} {r['light_lod']} initial {r['initial_tris']:>7,}  all {r['all_systems_tris']:>7,}")
print("WEB_BUDGET", "ok" if not fail else f"FAIL {fail}"); sys.exit(1 if fail else 0)
