"""Atlas MRI badan janin KCL (CC0 1.0) → mesh organ STL dalam kerangka kanonik (mm), dengan orientasi DIBUKTIKAN dari anatomi.

  python3 bodyexposure/pipeline/fetal_atlas_to_stl.py --atlas <dir structural_3t_t2w> --out ~/Documents/Panaceamed.id/bodyexposure/sources/fetal_atlas/stl

Sumber: SVRTK fetal MRI atlas repository (King's College London, Centre for the Developing Brain), https://gin.g-node.org/kcl_cdb/fetal_body_mri_atlas,
CC0 1.0. Uus A et al., Sci Rep 14:6637 (2024), doi:10.1038/s41598-024-57087-x. Atlas populasi-rata-rata dari 17 janin normal (3T, T2w, TE 180 ms; rentang usia
gestasi 25–28 minggu menurut pracetak medRxiv; repositori sendiri tidak menyebut usia), 0,75 mm isotropik, 10 label organ. BUKAN satu individu.

Kerangka: header NIfTI RAS (+x kanan subjek, +y anterior, +z superior). Kerangka kanonik master: +X kiri, −Y anterior, +Z superior. Alih-alih mempercayai
header, tanda tiap sumbu ditetapkan dari anatomi dan dihentikan bila memerlukan cermin: hati harus di kanan subjek dan limpa di kiri (sumbu x), lambung di anterior
ginjal (sumbu y), paru-paru & timus di atas hati dan hati di atas kandung kemih (sumbu z). Organ berpasangan dipisah kiri/kanan dari komponen terhubung.
Hanya label organ yang diberi nama di berkas colourmap yang dipakai; berkas parcelasi lobus paru tidak dipakai (nama label tidak disediakan di repositori).
"""
import argparse, json, os, sys
import numpy as np, nibabel as nib
from scipy.ndimage import label
from skimage.measure import marching_cubes
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ct_segmentation_common import _taubin, write_stl

ap = argparse.ArgumentParser(); ap.add_argument("--atlas", required=True); ap.add_argument("--out", required=True)
a = ap.parse_args()
img = nib.load(os.path.join(a.atlas, "reo-fetal-t2w-body-atlas-mask-body_organs-10.nii.gz"))
M = np.rint(np.asarray(img.dataobj)).astype(np.int16); aff = img.affine; vox = np.abs(np.diag(aff)[:3])
assert nib.aff2axcodes(aff) == ("R", "A", "S") and np.allclose(vox, 0.75, atol=1e-3), "unexpected atlas geometry"
SP = 0.75  # mm isotropik (afin header: 0,7500 ± 1e-5 dengan rotasi qform < 0,3°)
NAMES = {1: "lungs", 2: "liver", 3: "stomach", 4: "spleen", 5: "kidney pelvis", 6: "kidney parenchyma", 7: "bladder", 8: "thymus", 9: "gallbladder", 10: "adrenal glands"}
PAIRED = {1, 5, 6, 10}


def world(idx):  # indeks voksel → mm dunia (RAS)
    return nib.affines.apply_affine(aff, idx)


cent = {n: world(np.argwhere(M == l).mean(0)) for l, n in NAMES.items()}
checks = {"liver_right_of_spleen": bool(cent["liver"][0] > cent["spleen"][0]), "stomach_anterior_to_kidney": bool(cent["stomach"][1] > cent["kidney parenchyma"][1]),
          "lungs_above_liver": bool(cent["lungs"][2] > cent["liver"][2]), "liver_above_bladder": bool(cent["liver"][2] > cent["bladder"][2]),
          "thymus_above_liver": bool(cent["thymus"][2] > cent["liver"][2])}
# tanda sumbu kanonik: x_kanon = −x_dunia bila hati di +x (kanan = +x); y_kanon = −y_dunia bila lambung di +y (anterior = +y); z tetap bila organ toraks di atas
sx = -1.0 if checks["liver_right_of_spleen"] else 1.0
sy = -1.0 if checks["stomach_anterior_to_kidney"] else 1.0
sz = 1.0 if (checks["lungs_above_liver"] and checks["liver_above_bladder"]) else -1.0
det = sx * sy * sz
if not (checks["lungs_above_liver"] and checks["liver_above_bladder"] and checks["thymus_above_liver"]): raise SystemExit(f"vertical order check failed: {checks}")
if det < 0: raise SystemExit(f"orientation evidence needs a mirror (det {det}); refusing to build: {checks}")
prov = {"source": "SVRTK fetal MRI atlas repository, King's College London CDB (CC0 1.0); Uus et al., Sci Rep 14:6637 (2024)", "atlas": "population average, 17 normal fetuses, 3T T2w",
        "voxel_mm": SP, "orientation_header": "RAS", "orientation_checks": checks, "axis_signs_to_canonical": {"x": sx, "y": sy, "z": sz}, "structures": {}}
os.makedirs(a.out, exist_ok=True)
allv = []
for l, n in NAMES.items():
    m = M == l; lab, k = label(m); sz_ = np.bincount(lab.ravel())[1:]
    keep = [j + 1 for j, s in enumerate(sz_) if s >= 0.02 * sz_.sum()]               # fragmen < 2 % volume = butiran
    parts = []
    if l in PAIRED:
        full = np.isin(lab, keep); xs = np.argwhere(full)[:, 0].astype(float)           # indeks x voksel (pasangan kiri/kanan terpisah sepanjang x)
        cs = sorted(keep, key=lambda j: -sz_[j - 1])
        if len(cs) >= 2:
            cxw = {j: world(np.argwhere(lab == j).mean(0))[0] for j in cs}
            two = cs[:2]; others = [q for q in cs[2:]]
            ordered = sorted(two, key=lambda j: cxw[j])
            masks = {j: (lab == j) for j in ordered}
            for q in others:  # fragmen kecil ikut sisi komponen terdekat pada sumbu x
                masks[min(ordered, key=lambda j: abs(cxw[j] - world(np.argwhere(lab == q).mean(0))[0]))] |= (lab == q)
            halves = [masks[j] for j in ordered]; how = "two connected components"
        else:
            # satu komponen (kedua paru menyatu lewat mediastinum): belah pada bidang sagital di lembah antara dua pusat 2-means pada x
            c1, c2 = np.percentile(xs, 25), np.percentile(xs, 75)
            for _ in range(50):
                grp = np.abs(xs - c1) <= np.abs(xs - c2); c1, c2 = xs[grp].mean(), xs[~grp].mean()
            cut = (c1 + c2) / 2; idx_x = np.arange(M.shape[0])[:, None, None]
            halves = [full & (idx_x < cut), full & (idx_x >= cut)]; how = f"sagittal plane at voxel x={cut:.1f} (one connected component)"
        for pm in halves:
            cxw_ = world(np.argwhere(pm).mean(0))[0]; side = "L" if sx * cxw_ > 0 else "R"
            parts.append((side, pm, how))
    else:
        parts.append((None, np.isin(lab, keep), "single structure"))
    for side, pm, how in parts:
        V, F, _, _ = marching_cubes(pm.astype(np.uint8), 0.5, spacing=(SP,) * 3)
        V = _taubin(V, F)
        P = nib.affines.apply_affine(aff, V / SP)  # indeks voksel → mm dunia (RAS) lewat afin penuh
        C = np.c_[sx * P[:, 0], sy * P[:, 1], sz * P[:, 2]]
        key = f"{n.replace(' ', '_')}{'.' + side if side else ''}"
        write_stl(os.path.join(a.out, key + ".stl"), C, F)
        allv.append(C)
        prov["structures"][key] = {"label": l, "name": n, "side": side, "volume_cm3": round(float(pm.sum()) * SP ** 3 / 1000, 2), "triangles": int(len(F)), "split": how}
Z = np.vstack(allv)
prov["bbox_mm_canonical"] = {"min": Z.min(0).round(1).tolist(), "max": Z.max(0).round(1).tolist()}
json.dump(prov, open(os.path.join(a.out, "provenance.json"), "w"), indent=1)
print("OK", len(prov["structures"]), "meshes;", checks, "signs", (sx, sy, sz), "bbox", prov["bbox_mm_canonical"])
