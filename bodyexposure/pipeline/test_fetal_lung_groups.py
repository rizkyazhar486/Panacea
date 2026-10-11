"""Fixture sintetis hanya menguji kontrak label, bukan validasi klinis."""
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import hashlib

import numpy as np

from fetal_lung_groups import GROUPS, load_groups, split_groups
from audit_fetal_parcels import PARCEL_FILE, ORGAN_FILE


class LungGroupsTest(unittest.TestCase):
    def setUp(self):
        self.labels = np.zeros((20, 4, 4), dtype=np.int16)
        for value, x in enumerate([1, 2, 14, 15, 16, 8, 9, 10, 11], start=1):
            self.labels[x, 1, 1] = value
        self.affine = np.eye(4); self.affine[0, 3] = -10

    def test_source_groups_preserve_every_lung_voxel_and_exclude_other_regions(self):
        masks, evidence = split_groups(self.labels, self.affine)
        self.assertEqual(GROUPS, {"L": (1, 2), "R": (3, 4, 5)})
        self.assertEqual(evidence["voxel_counts"], {"L": 2, "R": 3})
        self.assertEqual(evidence["excluded_labels"], [6, 7, 8, 9])
        np.testing.assert_array_equal(masks["L"] | masks["R"], np.isin(self.labels, [1, 2, 3, 4, 5]))
        self.assertFalse((masks["L"] & masks["R"]).any())
        self.assertEqual(evidence["clinical_validation"], "pending")
        self.assertEqual(evidence["individual_lobe_identity"], "unresolved")

    def test_invalid_labels_rejected(self):
        for labels in (self.labels[:, :, 0], self.labels.astype(float) + 0.5,
                       np.full(self.labels.shape, np.nan), np.where(self.labels == 9, 10, self.labels)):
            with self.subTest(shape=labels.shape), self.assertRaises(ValueError):
                split_groups(labels, self.affine)

    def test_swapped_laterality_rejected(self):
        with self.assertRaisesRegex(ValueError, "laterality contradicts"):
            split_groups(self.labels[::-1], self.affine)

    def test_non_ras_affine_rejected(self):
        affine = self.affine.copy(); affine[0, 0] = -1
        with self.assertRaisesRegex(ValueError, "finite RAS affine"):
            split_groups(self.labels, affine)

    def test_unknown_source_hash_rejected_before_nifti_processing(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / PARCEL_FILE
            path.write_bytes(b"not the pinned atlas")
            before = path.read_bytes()
            with self.assertRaisesRegex(ValueError, "source mapping must be reverified"):
                load_groups(tmp)
            self.assertEqual(path.read_bytes(), before)

    def test_unknown_organ_hash_rejected_before_nifti_processing(self):
        with tempfile.TemporaryDirectory() as tmp:
            parcel = b"parcel fixture"
            (Path(tmp) / PARCEL_FILE).write_bytes(parcel)
            (Path(tmp) / ORGAN_FILE).write_bytes(b"unexpected organ mask")
            with patch("fetal_lung_groups.MASK_SHA256", hashlib.sha256(parcel).hexdigest()):
                with self.assertRaisesRegex(ValueError, "unrecognized organ mask"):
                    load_groups(tmp)


if __name__ == "__main__":
    unittest.main()
