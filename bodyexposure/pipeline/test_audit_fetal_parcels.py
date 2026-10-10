"""Uji positif/negatif pengolahan atlas; fixture sintetis hanya untuk pengujian."""
import json
from pathlib import Path
import tempfile
import unittest

import nibabel as nib
import numpy as np

from audit_fetal_parcels import ORGAN_FILE, PARCEL_FILE, process, surface, validate_volumes


class ParcelAuditTest(unittest.TestCase):
    def setUp(self):
        self.parcels = np.zeros((12, 12, 12), dtype=np.int16)
        self.parcels[2:5, 2:5, 8:11] = 1
        self.organs = self.parcels.copy()
        self.organs[8:10, 2:4, 5:7] = 2
        self.organs[1:3, 2:4, 5:7] = 4
        self.organs[5:7, 2:4, 1:3] = 7
        self.affine = np.diag([0.75, 0.75, 0.75, 1.0])

    def test_valid_grid_and_anatomical_landmarks(self):
        validate_volumes(self.parcels, self.organs, self.affine, self.affine)

    def test_invalid_inputs(self):
        cases = [self.parcels[:, :, 0], self.parcels.astype(float) + 0.5,
                 np.full(self.parcels.shape, np.nan), -self.parcels, np.zeros_like(self.parcels)]
        for values in cases:
            with self.subTest(values=values.shape), self.assertRaises(ValueError):
                validate_volumes(values, self.organs, self.affine, self.affine)

    def test_mismatched_grid_and_mirror_rejected(self):
        shifted = self.affine.copy(); shifted[0, 3] = 0.01
        mirrored = self.affine.copy(); mirrored[0, 0] *= -1
        malformed = self.affine.copy(); malformed[3, 3] = 2
        for transform in (shifted, mirrored, malformed, np.zeros((3, 3))):
            with self.subTest(transform=transform), self.assertRaises(ValueError):
                validate_volumes(self.parcels, self.organs, transform, self.affine)

    def test_orientation_landmarks_required(self):
        for value in (2, 4, 7):
            organs = self.organs.copy(); organs[organs == value] = 0
            with self.assertRaisesRegex(ValueError, "landmarks missing"):
                validate_volumes(self.parcels, organs, self.affine, self.affine)
        swapped = self.organs.copy()
        swapped[self.organs == 2] = 4; swapped[self.organs == 4] = 2
        with self.assertRaisesRegex(ValueError, "orientation checks failed"):
            validate_volumes(self.parcels, swapped, self.affine, self.affine)

    def test_boundary_surface_closed_and_full_affine_preserved(self):
        mask = np.ones((2, 2, 2), dtype=bool)
        affine = self.affine.copy(); affine[:3, 3] = [10, 20, 30]
        vertices, faces, info = surface(mask, affine)
        self.assertEqual(info["nonmanifold_edges"], 0)
        np.testing.assert_allclose(vertices.mean(0), [-10.375, -20.375, 30.375])
        self.assertGreater(info["mesh_volume_mm3"], 0)
        tri = vertices[faces]
        self.assertGreater(np.einsum("ij,ij->i", tri[:, 0], np.cross(tri[:, 1], tri[:, 2])).sum(), 0)

    def test_deterministic_output_and_no_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name, values in ((PARCEL_FILE, self.parcels), (ORGAN_FILE, self.organs)):
                nib.save(nib.Nifti1Image(values, self.affine), root / name)
            first = process(root, root / "first")
            second = process(root, root / "second")
            self.assertEqual(first, second)
            region = first["regions"][0]
            self.assertEqual(region["voxels"], 27)
            self.assertEqual(region["organ_label_overlap_voxels"], {"1": 27})
            self.assertIsNone(region["anatomical_name"])
            self.assertEqual(first["clinical_validation"], "pending")
            self.assertEqual(first["runtime_admission"], "blocked_label_identity_unresolved")
            self.assertEqual((root / "first/parcel_01.stl").read_bytes(), (root / "second/parcel_01.stl").read_bytes())
            self.assertEqual((root / "first/parcel_01.stl").read_bytes()[:80].rstrip(), b"Panacea KCL fetal MRI anonymous parcel; QA only")
            before = (root / "first/report.json").read_bytes()
            with self.assertRaisesRegex(ValueError, "refusing to overwrite"):
                process(root, root / "first")
            self.assertEqual(before, (root / "first/report.json").read_bytes())
            self.assertEqual(json.loads(before), first)


if __name__ == "__main__":
    unittest.main()
