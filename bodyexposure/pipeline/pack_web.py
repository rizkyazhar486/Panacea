"""Kompres GLB LOD mentah dengan meshopt (gltfpack) dan verifikasi nama node tetap utuh.

  python3 bodyexposure/pipeline/pack_web.py [--raw bodyexposure/web/raw] [--out bodyexposure/web/glb]

gltfpack (meshoptimizer, MIT) dijalankan lewat `npx -y gltfpack`, tidak ditambahkan ke dependensi
proyek. Flag: -c (EXT_meshopt_compression, cocok dengan MeshoptDecoder di Body3D.tsx),
-kn (pertahankan node bernama = ID struktur), -km (material bernama), -ke (extras panacea_*).
Kuantisasi posisi 14 bit per mesh (default gltfpack) → presisi sub-milimeter.
"""
import argparse, json, os, struct, subprocess, sys

ap = argparse.ArgumentParser()
ap.add_argument("--raw", default="bodyexposure/web/raw")
ap.add_argument("--out", default="bodyexposure/web/glb")
a = ap.parse_args()


def glb_json(path):
    with open(path, "rb") as f:
        head = f.read(12)
        if head[:4] != b"glTF":
            raise ValueError(path + " bukan GLB")
        length, ctype = struct.unpack("<II", f.read(8))
        return json.loads(f.read(length))


def named_mesh_nodes(doc):
    """Nama node yang membawa mesh — langsung, atau lewat anak tanpa nama (gltfpack -kn memindahkan
    mesh ke node anak tak bernama di bawah node bernama). Raycast di aplikasi naik ke induk bernama."""
    nodes = doc.get("nodes", [])
    def carries_mesh(i):
        n = nodes[i]
        return "mesh" in n or any("mesh" in nodes[c] and "name" not in nodes[c] for c in n.get("children", []))
    return sorted(n["name"] for i, n in enumerate(nodes) if "name" in n and carries_mesh(i))


def main():
    os.makedirs(a.out, exist_ok=True)
    rows = []
    for name in sorted(os.listdir(a.raw)):
        if not name.endswith(".glb"):
            continue
        src, dst = os.path.join(a.raw, name), os.path.join(a.out, name)
        cmd = ["npx", "-y", "gltfpack", "-i", src, "-o", dst, "-c", "-kn", "-km", "-ke"]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            print("GAGAL", name, r.stderr[-400:]); sys.exit(1)
        before, after = named_mesh_nodes(glb_json(src)), named_mesh_nodes(glb_json(dst))
        doc = glb_json(dst)
        rows.append({"file": name, "bytes_raw": os.path.getsize(src), "bytes_packed": os.path.getsize(dst),
                     "nodes": len(after), "names_preserved": before == after,
                     "extensions": doc.get("extensionsUsed", []),
                     "extras_on_nodes": sum(1 for n in doc.get("nodes", []) if n.get("extras") and "name" in n)})
        print(f"{name:45s} {rows[-1]['bytes_raw']/1e6:7.2f} MB -> {rows[-1]['bytes_packed']/1e6:6.2f} MB  "
              f"names_ok={rows[-1]['names_preserved']} extras={rows[-1]['extras_on_nodes']}")
    json.dump(rows, open(os.path.join(a.out, "pack_report.json"), "w"), indent=1)
    bad = [r["file"] for r in rows if not r["names_preserved"]]
    if bad:
        print("NAMA NODE BERUBAH:", bad); sys.exit(2)


main()
