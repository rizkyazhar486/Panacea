"""Masker TotalSegmentator (NIfTI 1,5 mm, afin diag(−1,5, −1,5, 1,5)) → mesh permukaan, dipakai validasi dan impor.

Pembersihan yang diterapkan dan dilaporkan (bukan diam-diam): komponen terhubung terbesar saja (butiran liar model dibuang) dan
pemulusan Taubin 10 iterasi (λ=0,5, μ=−0,53; mempertahankan volume) untuk anak tangga voksel 1,5 mm. Koordinat keluaran: mm, +X kanan
subjek, +Y anterior, +Z superior (kerangka CT = kerangka STL Denver hingga translasi).
"""
import os
import numpy as np, nibabel as nib
from scipy import sparse
from scipy.ndimage import label
from skimage.measure import marching_cubes

SPACING = 1.5


def _taubin(V, F, it=10, lam=0.5, mu=-0.53):
    n = len(V); I = np.r_[F[:, 0], F[:, 1], F[:, 2], F[:, 1], F[:, 2], F[:, 0]]; J = np.r_[F[:, 1], F[:, 2], F[:, 0], F[:, 0], F[:, 1], F[:, 2]]
    A = sparse.coo_matrix((np.ones(len(I)), (I, J)), shape=(n, n)).tocsr(); A.data[:] = 1
    D = np.asarray(A.sum(1)).ravel(); D[D == 0] = 1
    L = sparse.diags(1 / D) @ A - sparse.eye(n)
    for _ in range(it):
        V = V + lam * (L @ V); V = V + mu * (L @ V)
    return V


def mask_mesh(seg_dir, name):
    """→ (V mm, F, info) o (None, None, info) bila masker kosong."""
    m = np.asarray(nib.load(os.path.join(seg_dir, name + ".nii.gz")).dataobj) > 0
    info = {"voxels": int(m.sum())}
    if not m.any(): return None, None, info
    lab, k = label(m)
    sizes = np.bincount(lab.ravel())[1:]
    info.update({"components": int(k), "largest_component_fraction": round(float(sizes.max() / sizes.sum()), 4)})
    m = lab == (1 + int(sizes.argmax()))
    V, F, _, _ = marching_cubes(m.astype(np.uint8), 0.5, spacing=(SPACING,) * 3)
    V = _taubin(V, F)
    info["volume_cm3"] = round(float(m.sum()) * SPACING ** 3 / 1000.0, 1)
    return np.c_[-V[:, 0], -V[:, 1], V[:, 2]], F, info  # indeks → mm; x,y dibalik oleh afin


def write_stl(path, V, F):
    import struct
    tri = V[F]; n = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0]); n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)
    rec = np.zeros(len(F), dtype=np.dtype([("n", "<3f4"), ("v", "<9f4"), ("a", "<u2")]))
    rec["n"] = n; rec["v"] = tri.reshape(-1, 9)
    with open(path, "wb") as f:
        f.write(b"Panacea CT segmentation mesh (TotalSegmentator)".ljust(80, b" ")); f.write(struct.pack("<I", len(F))); f.write(rec.tobytes())
