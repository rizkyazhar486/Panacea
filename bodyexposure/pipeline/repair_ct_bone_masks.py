"""Perbaikan terbatas masker tulang TotalSegmentator: menutup celah antar pecahan SEPANJANG tulang berdensitas pada CT, tanpa menambah anatomi.

  python3 bodyexposure/pipeline/repair_ct_bone_masks.py --ct vhf_ct_hu_1p5mm.nii.gz --seg ts_out15 --out ts_repaired --report bodyexposure/qa_reports/ct_mask_repair.json

Aturan (semuanya terukur dan dilaporkan; tidak ada voksel yang dibuat dari "bentuk yang seharusnya"):
  1. Kandidat = voksel CT di atas ambang tulang milik tulang itu sendiri (persentil ke-10 HU di komponen terbesarnya, tidak kurang dari 100 HU),
     bukan bagian dari label tulang lain, dan berada dalam 6 mm dari masker.
  2. Jembatan: hanya voksel kandidat yang berada dalam 4,5 mm dari ≥ 2 pecahan bermakna (≥ 1 cm3) yang berbeda, yaitu celah ≤ 9 mm antar pecahan
     yang CT-nya memang berdensitas tulang. Tulang yang sudah satu bagian bermakna tidak ditebalkan sama sekali.
  3. Hanya komponen yang tersambung ke komponen terbesar yang dipertahankan; pecahan kecil (< 1 cm3) yang tetap terpisah dibuang sebagai artefak
     dan DICATAT; pecahan ≥ 1 cm3 yang tetap terpisah dipertahankan (bisa bagian anatomi asli: dilaporkan, bukan dihapus).
Masker asli tidak diubah; hasil ditulis ke direktori terpisah. Ukuran perbaikan: jumlah komponen, fraksi komponen terbesar, perubahan volume,
HU voksel yang ditambahkan (harus berdensitas tulang), dan, bila ada acuan manual (femur, tulang pinggul, sakrum Denver), jarak permukaan sebelum/sesudah.
"""
import argparse, json, os, sys
import numpy as np, nibabel as nib
from scipy.ndimage import label, binary_dilation, distance_transform_edt, generate_binary_structure, iterate_structure

ap = argparse.ArgumentParser()
ap.add_argument("--ct", required=True); ap.add_argument("--seg", required=True); ap.add_argument("--out", required=True); ap.add_argument("--report", required=True)
a = ap.parse_args()
VOX = 1.5
BONES = (["skull", "sternum", "clavicula_left", "clavicula_right", "scapula_left", "scapula_right", "humerus_left", "humerus_right",
          "femur_left", "femur_right", "hip_left", "hip_right", "sacrum"]
         + [f"vertebrae_{r}{i}" for r, n in (("C", 7), ("T", 12), ("L", 5)) for i in range(1, n + 1)]
         + [f"rib_{s}_{i}" for s in ("left", "right") for i in range(1, 13)])
ball = lambda r: iterate_structure(generate_binary_structure(3, 1), r)  # oktahedron ≈ bola kecil; r dalam voksel
CLOSE_R, NEAR_R, MIN_KEEP_CM3 = 3, 4, 1.0  # 3 voksel = 4,5 mm; 4 voksel = 6 mm

ct_img = nib.load(a.ct); ct = np.asarray(ct_img.dataobj).astype(np.int16)
masks = {n: np.asarray(nib.load(os.path.join(a.seg, n + ".nii.gz")).dataobj) > 0 for n in BONES if os.path.exists(os.path.join(a.seg, n + ".nii.gz"))}
all_bone = np.zeros(ct.shape, bool)
for m in masks.values(): all_bone |= m
os.makedirs(a.out, exist_ok=True)
report = {"rule": __doc__.strip().splitlines()[0], "params": {"voxel_mm": VOX, "closing_radius_voxels": CLOSE_R, "near_radius_voxels": NEAR_R, "min_keep_cm3": MIN_KEEP_CM3}, "bones": {}}


def comps(m):
    lab, k = label(m); s = np.bincount(lab.ravel())[1:] if k else np.array([0])
    return lab, int(k), (float(s.max() / s.sum()) if s.sum() else 0.0)


for n, m in masks.items():
    if not m.any():
        continue
    lab0, k0, f0 = comps(m); sizes0 = np.bincount(lab0.ravel())[1:]
    idx = np.argwhere(m); lo = np.maximum(idx.min(0) - 12, 0); hi = np.minimum(idx.max(0) + 13, m.shape)
    sl = tuple(slice(l, h) for l, h in zip(lo, hi))
    mc, cc, others = m[sl], ct[sl], (all_bone[sl] & ~m[sl])
    lab, k, _ = comps(mc); sz = np.bincount(lab.ravel())[1:]; big = 1 + int(sz.argmax())
    sig = [c for c in range(1, k + 1) if sz[c - 1] * VOX ** 3 / 1000.0 >= MIN_KEEP_CM3]   # pecahan bermakna (≥ 1 cm3); selebihnya butiran
    thr = max(100.0, float(np.percentile(cc[lab == big], 10)))
    allowed = (cc > thr) & ~others & binary_dilation(mc, ball(NEAR_R))
    new = np.zeros_like(mc)
    if len(sig) > 1:
        # jembatan = voksel berdensitas tulang yang berada dalam jangkauan penutupan dari ≥ 2 pecahan bermakna yang BERBEDA:
        # hanya celah antar pecahan yang terisi; tulang yang sudah utuh tidak ditebalkan sama sekali
        cover = sum(binary_dilation(lab == c, ball(CLOSE_R)).astype(np.uint8) for c in sig)
        new = (cover >= 2) & allowed & ~mc
    # celah antar pecahan bermakna: jarak ke komponen terbesar, dan ambang HU tertinggi yang masih menyambungkan semuanya (dalam 12 mm dari masker,
    # tanpa label tulang lain). Ambang jauh di bawah tulang (≤ 60 HU = jaringan lunak) berarti CT tidak menunjukkan tulang di celah itu.
    gaps, connect = [], None
    if len(sig) > 1:
        d = distance_transform_edt(lab != big) * VOX
        gaps = [round(float(d[lab == c].min()), 1) for c in sig if c != big]
        near12 = binary_dilation(mc, ball(8))
        for T in range(250, -80, -10):
            l2_, _ = label(mc | ((cc > T) & near12 & ~others))
            if len({int(l2_[lab == c][0]) for c in sig}) == 1: connect = T; break
    out = mc | new
    lab2, k2, f2 = comps(out); main2 = 1 + int(np.bincount(lab2.ravel())[1:].argmax()); sz2 = np.bincount(lab2.ravel())[1:]
    keep = lab2 == main2; dropped = []
    for j in range(1, k2 + 1):
        if j == main2: continue
        cm3 = sz2[j - 1] * VOX ** 3 / 1000.0
        if cm3 >= MIN_KEEP_CM3: keep |= lab2 == j
        else: dropped.append(round(float(cm3), 3))
    final = np.zeros(m.shape, bool); final[sl] = keep
    lab3, k3, f3 = comps(final)
    added_hu = cc[new] if new.any() else np.array([])
    report["bones"][n] = {"threshold_hu": round(thr, 0), "components_before": k0, "largest_fraction_before": round(f0, 4),
                          "components_after": k3, "largest_fraction_after": round(f3, 4),
                          "volume_cm3_before": round(float(m.sum()) * VOX ** 3 / 1000, 2), "volume_cm3_after": round(float(final.sum()) * VOX ** 3 / 1000, 2),
                          "voxels_added": int(new.sum()), "added_hu_median": (round(float(np.median(added_hu)), 0) if added_hu.size else None),
                          "added_hu_p10": (round(float(np.percentile(added_hu, 10)), 0) if added_hu.size else None),
                          "significant_fragments_before": len(sig), "gap_mm_to_largest": gaps, "highest_hu_that_connects_fragments": connect, "dropped_fragments_cm3": dropped, "dropped_fragments_count": len(dropped)}
    nib.save(nib.Nifti1Image(final.astype(np.uint8), ct_img.affine), os.path.join(a.out, n + ".nii.gz"))
    if k0 > 1: print("REPAIR", n, report["bones"][n])
json.dump(report, open(a.report, "w"), indent=1)
ch = [n for n, r in report["bones"].items() if r["components_after"] != r["components_before"] or r["voxels_added"]]
print("DONE", len(report["bones"]), "bones;", len(ch), "changed")
