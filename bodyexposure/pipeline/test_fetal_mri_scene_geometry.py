"""Registration and source-change regressions without requiring Blender in CI."""
import json
import math
from pathlib import Path
import shutil
import tempfile
import unittest

from fetal_mri_scene_geometry import load_package, plane_corners_m, source_point_m

PACKAGE = Path(__file__).resolve().parents[2] / 'public/bodyexposure/dataset-inspection/fetal-parcels/mri'


class SourceMriGeometryTests(unittest.TestCase):
    def test_all_nine_labels_use_the_published_affine_point(self):
        for label in range(1, 10):
            manifest, region = load_package(PACKAGE, label)
            point = source_point_m(manifest, region['representative_voxel_ijk'])
            ras = region['point_ras_mm']
            for actual, expected in zip(point, [-ras[0]/1000, -ras[1]/1000, ras[2]/1000]):
                self.assertAlmostEqual(actual, expected, places=12)

    def test_pixel_centres_at_uv_match_native_rows_and_columns(self):
        manifest, region = load_package(PACKAGE, 9)
        for image in region['images']:
            axis = image['axis']
            corners = plane_corners_m(manifest, region, axis)
            # Native PNG's bottom-left pixel: U half a pixel from left, V half
            # a pixel from bottom. Its source coordinates are both crop minima.
            u, v = .5/image['width'], .5/image['height']
            bottom_left = [corners[0][i]+u*(corners[1][i]-corners[0][i])+v*(corners[3][i]-corners[0][i]) for i in range(3)]
            ijk = list(manifest['crop_ijk_min']); ijk[axis] = image['index']
            for actual, expected in zip(bottom_left, source_point_m(manifest, ijk)):
                self.assertAlmostEqual(actual, expected, places=12)
            # Each complete quad edge spans exactly width/height source voxels.
            width = math.dist(corners[0], corners[1])
            height = math.dist(corners[0], corners[3])
            self.assertAlmostEqual(width, image['width']*.00075, places=10)
            self.assertAlmostEqual(height, image['height']*.00075, places=10)

    def test_changed_affine_or_review_state_is_not_accepted(self):
        for key, value in [('clinical_validation', 'accepted'), ('affine_ras_mm', [[1,0,0,0]]*4)]:
            with tempfile.TemporaryDirectory() as directory:
                package = Path(directory)
                data = json.loads((PACKAGE/'manifest.json').read_text()); data[key] = value
                (package/'manifest.json').write_text(json.dumps(data))
                with self.assertRaisesRegex(ValueError, 'manifest differs'):
                    load_package(package, 1)

    def test_changed_png_is_rejected_and_input_is_preserved(self):
        with tempfile.TemporaryDirectory() as directory:
            package = Path(directory)
            shutil.copy(PACKAGE/'manifest.json', package/'manifest.json')
            image = package/'region-01-i.png'; image.write_bytes(b'changed image')
            with self.assertRaisesRegex(ValueError, 'source image differs'):
                load_package(package, 1)
            self.assertEqual(image.read_bytes(), b'changed image')

    def test_labels_and_axes_do_not_accept_guesses_or_booleans(self):
        for label in [True, 0, 10, 'left lung']:
            with self.assertRaises(ValueError):
                load_package(PACKAGE, label)
        for axis in [True, -1, 3]:
            with self.assertRaises(ValueError):
                plane_corners_m({}, {}, axis)


if __name__ == '__main__':
    unittest.main()
