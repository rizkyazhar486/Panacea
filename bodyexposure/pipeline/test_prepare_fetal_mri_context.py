import json
import tempfile
import unittest
from pathlib import Path

import numpy as np
from prepare_fetal_mri_context import FILES, prepare, representative_voxel, validate_grid


class SourceContextTests(unittest.TestCase):
    def setUp(self):
        self.mask = np.arange(10, dtype=np.uint16).reshape(2, 5, 1)
        self.t2 = np.ones_like(self.mask, dtype=float)
        self.affine = np.eye(4)

    def test_grid_registration_mismatch_is_rejected(self):
        other = self.affine.copy()
        other[0, 3] = 0.1
        with self.assertRaisesRegex(ValueError, 'affines'):
            validate_grid(self.t2, self.mask, self.affine, other)

    def test_nonfinite_intensities_or_missing_regions_are_rejected(self):
        bad = self.t2.copy(); bad[0,0,0] = np.nan
        with self.assertRaises(ValueError):
            validate_grid(bad, self.mask, self.affine, self.affine)
        with self.assertRaises(ValueError):
            validate_grid(self.t2, np.zeros_like(self.mask), self.affine, self.affine)

    def test_representative_point_belongs_to_label_when_centroid_is_outside_it(self):
        mask = np.zeros((7, 7, 7), dtype=np.uint8)
        mask[0,0,0] = mask[6,6,6] = 9
        self.assertEqual(mask[3,3,3], 0)
        point = representative_voxel(mask, 9)
        self.assertEqual(mask[tuple(point)], 9)
        with self.assertRaises(ValueError):
            representative_voxel(mask, 1)

    def test_existing_output_is_preserved_before_any_source_read(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)/'assets'; out.mkdir()
            sentinel = out/'unchanged'; sentinel.write_bytes(b'preserve')
            with self.assertRaisesRegex(ValueError, 'fresh output'):
                prepare(Path(tmp)/'missing', Path(tmp)/'missing.json', out)
            self.assertEqual(sentinel.read_bytes(), b'preserve')

    def test_clinical_promotion_rejected_without_creating_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            evidence = Path(tmp)/'manifest.json'
            evidence.write_text(json.dumps({'clinical_validation':'reviewed'}))
            out=Path(tmp)/'new'
            with self.assertRaises(ValueError):
                prepare(Path(tmp)/'missing', evidence, out)
            self.assertFalse(out.exists())

    def test_changed_source_fingerprint_rejected_without_creating_output(self):
        evidence = Path(__file__).resolve().parents[2]/'public/bodyexposure/dataset-inspection/fetal-parcels/manifest.json'
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp)/'source'; source.mkdir()
            (source/FILES['t2'][0]).write_bytes(b'changed source')
            out=Path(tmp)/'new'
            with self.assertRaisesRegex(ValueError, 'fingerprint'):
                prepare(source, evidence, out)
            self.assertFalse(out.exists())


if __name__ == '__main__':
    unittest.main()
