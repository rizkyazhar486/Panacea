"""Kelompok paru kiri/kanan dari protokol SVRTK; nama lobus individual belum dipastikan."""
import hashlib
from pathlib import Path

import nibabel as nib
import numpy as np

from audit_fetal_parcels import PARCEL_FILE, ORGAN_FILE, validate_volumes

GROUPS = {"L": (1, 2), "R": (3, 4, 5)}
MASK_SHA256 = "5d81b6f91bcc2a6d6e64dfcd97a3099cfdc30cd9826f29d297b3c6983aceee54"
ORGAN_SHA256 = "4b7bade32fac95a80c622f535c05f6a6f8eab8f1e32ba093cc742b1a5dc6c8b7"
SOURCE_REVISION = "7d75fa96162245326f7046bb4df0a41cdeaf7f5c"
SOURCE_REPORT = f"https://github.com/SVRTK/auto-proc-svrtk/blob/{SOURCE_REVISION}/scripts/auto-reporting-lung-volumetry-html.py#L162-L167"
SOURCE_EXTRACTION = f"https://github.com/SVRTK/auto-proc-svrtk/blob/{SOURCE_REVISION}/scripts/auto-lung-segmentation.sh#L280-L281"


def split_groups(parcels, affine):
    """Tidak membelah bidang, menghapus fragmen, atau menginterseksikan masker organ lama."""
    if parcels.ndim != 3 or not np.isfinite(parcels).all() or not np.equal(parcels, np.rint(parcels)).all():
        raise ValueError("finite integer 3D labels required")
    if set(np.unique(parcels)) != set(range(10)):
        raise ValueError("pinned ten-label protocol required")
    if (affine.shape != (4, 4) or not np.isfinite(affine).all()
            or not np.allclose(affine[3], [0, 0, 0, 1]) or np.linalg.det(affine[:3, :3]) <= 0
            or nib.aff2axcodes(affine) != ("R", "A", "S")):
        raise ValueError("finite RAS affine required")
    masks = {side: np.isin(parcels, values) for side, values in GROUPS.items()}
    centroids = {side: nib.affines.apply_affine(affine, np.argwhere(mask).mean(0)) for side, mask in masks.items()}
    if not (centroids["L"][0] < 0 < centroids["R"][0]):
        raise ValueError("source group laterality contradicts pinned atlas geometry")
    return masks, {"source_label_groups": {side: list(ids) for side, ids in GROUPS.items()},
                   "grouping_source": SOURCE_REPORT, "exclusion_source": SOURCE_EXTRACTION,
                   "source_revision": SOURCE_REVISION, "excluded_labels": [6, 7, 8, 9],
                   "individual_lobe_identity": "unresolved", "clinical_validation": "pending",
                   "voxel_counts": {side: int(mask.sum()) for side, mask in masks.items()},
                   "centroids_ras_mm": {side: centroid.tolist() for side, centroid in centroids.items()}}


def load_groups(atlas):
    path = Path(atlas) / PARCEL_FILE
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != MASK_SHA256:
        raise ValueError("unrecognized parcel mask hash; source mapping must be reverified")
    organ_path = Path(atlas) / ORGAN_FILE
    organ_digest = hashlib.sha256(organ_path.read_bytes()).hexdigest()
    if organ_digest != ORGAN_SHA256:
        raise ValueError("unrecognized organ mask hash; source mapping must be reverified")
    pi = nib.load(path); oi = nib.load(organ_path)
    parcels, organs = np.asarray(pi.dataobj), np.asarray(oi.dataobj)
    validate_volumes(parcels, organs, pi.affine, oi.affine)
    masks, evidence = split_groups(parcels, pi.affine)
    old = organs == 1
    combined = masks["L"] | masks["R"]
    evidence.update({"parcel_mask_sha256": digest, "organ_mask_sha256": organ_digest, "source_file": PARCEL_FILE,
                     "older_whole_lung_voxels": int(old.sum()),
                     "overlap_with_older_lung_voxels": int((combined & old).sum()),
                     "outside_older_lung_voxels": int((combined & ~old).sum()),
                     "older_lung_not_in_parcels_voxels": int((old & ~combined).sum())})
    return masks, evidence
