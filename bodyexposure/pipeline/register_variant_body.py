"""Daftarkan satu tubuh varian (mis. tungkai bawah Visible Human Female) ke manifest dan matriks tubuh aplikasi.

  python3 bodyexposure/pipeline/register_variant_body.py --manifest <dir hasil export_manifest.py> --entry HUMAN.ADULT.FEMALE \
      --label "Visible Human lower limb (Denver)" --coverage "pelvis to feet only" --individual "..." [--light-lod LOD4]

Menggabung (tanpa menimpa tubuh lain):
  manifest/structures.json  : baris struktur tubuh itu diganti/ditambahkan
  public/bodyexposure/body_matrix.json : varian di entri `--entry`, daftar `files` (<tag>.<sistem> yang ada di public/bodyexposure),
                                         dan `light_lod[<tag>]`
Berkas GLB harus sudah ada di public/bodyexposure (hasil pack_web.py). Indeks pencarian dibuat terpisah oleh publish_search_index.py.
"""
import argparse, glob, json, os

ap = argparse.ArgumentParser()
ap.add_argument("--manifest", required=True); ap.add_argument("--entry", required=True)
ap.add_argument("--label", required=True); ap.add_argument("--coverage", default=""); ap.add_argument("--individual", default="")
ap.add_argument("--light-lod", default="LOD4"); ap.add_argument("--update-entry", action="store_true", help="entri = tubuh itu sendiri (mis. FETUS): perbarui status, sumber, jumlah struktur dan hapus alasan placeholder"); ap.add_argument("--motion-glb", default=""); ap.add_argument("--motion-json", default=""); ap.add_argument("--source", default="", help="teks sumber untuk tampilan (bawaan: sumber dari manifest)"); ap.add_argument("--replace", default="", help="body_id de una varian lama yang digantikan (dihapus dari matriks, manifest, dan berkas web)")
a = ap.parse_args()

new_m = json.load(open(os.path.join(a.manifest, "body_matrix.json")))["bodies"]
assert len(new_m) == 1, "manifest must describe exactly one body"
nb = new_m[0]; bid = nb["body_id"]
tag = bid.replace("HUMAN.", "").replace(".", "_").lower()
PUB = "public/bodyexposure"

def rm_old(old):
    tag_old = old.replace("HUMAN.", "").replace(".", "_").lower()
    for pth in glob.glob(f"{PUB}/{tag_old}.*"):
        os.remove(pth)
    return tag_old


old_tag = rm_old(a.replace) if a.replace else None

# 1) structures.json
sp = "bodyexposure/manifest/structures.json"
S = json.load(open(sp))
rows = json.load(open(os.path.join(a.manifest, "structures.json")))["structures"]
S["structures"] = [r for r in S["structures"] if r["panacea_body_id"] not in (bid, a.replace)] + rows
json.dump(S, open(sp, "w"), indent=1, ensure_ascii=False)

# 2) body_matrix.json
mp = f"{PUB}/body_matrix.json"
M = json.load(open(mp))
systems = sorted({os.path.basename(p).split(".")[1] for p in glob.glob(f"{PUB}/{tag}.*.LOD*.glb")})
assert systems, f"no GLB for {tag} in {PUB}"
entry = next(b for b in M["bodies"] if b["body_id"] == a.entry)
var = {"body_id": bid, "structures": nb["structures"], "label": a.label, "status": nb["status"], "source": a.source or nb["source"]}
var["stature_m"] = None  # tubuh parsial: tinggi badan tidak ditampilkan
if a.coverage: var["coverage"] = a.coverage
if a.individual: var["individual"] = a.individual
entry["variants"] = [v for v in entry.get("variants", []) if v["body_id"] not in (bid, a.replace)] + [var]
if a.update_entry:
    assert entry["body_id"] == bid, "--update-entry requires the entry to be the body itself"
    entry.update({"status": nb["status"], "source": a.source or nb["source"], "structures": nb["structures"], "systems": nb["systems"], "source_requirement": None})
M["files"] = sorted((set(M["files"]) | {f"{tag}.{s}" for s in systems}) - {f for f in M["files"] if old_tag and f.startswith(old_tag + ".")})
if old_tag: M.get("light_lod", {}).pop(old_tag, None)
M.setdefault("light_lod", {})[tag] = a.light_lod
if a.motion_glb:  # klip gerak varian (rig + pustaka klip), dibaca pemutar lewat matrix.motion[<tag>]
    M.setdefault("motion", {})[tag] = {"glb": a.motion_glb, "timeline": a.motion_json}
json.dump(M, open(mp, "w"), indent=1)  # sama dengan format berkas yang ada (ASCII-escaped)
print("REGISTERED", bid, "tag", tag, "systems", systems, "structures", nb["structures"])
