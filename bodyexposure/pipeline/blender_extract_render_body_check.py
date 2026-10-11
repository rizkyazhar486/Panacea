"""Blender adapter regression tests; no atlas or patient data is synthesized.

blender -b --factory-startup --python-exit-code 1 -P blender_extract_render_body_check.py
"""
import json
from pathlib import Path
import sys
import tempfile
import unittest

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from extract_render_body import main
from render_artifacts import fingerprint


class ExtractRenderBodyTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.folder = Path(self.tmp.name)
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.mesh.primitive_cube_add(size=1)
        mesh = bpy.context.object
        mesh.name = 'TEST.GOOD.MESH'
        mesh.location = (2, 3, 4)
        mesh['panacea_body_id'] = 'TEST.BODY'
        mesh['panacea_structure_id'] = 'TEST.GOOD.MESH'
        mesh['panacea_review_status'] = 'review_required'
        mesh['panacea_clinically_reviewed'] = False
        data = bpy.data.cameras.new('TEST.CAMERA')
        camera = bpy.data.objects.new('TEST.CAMERA', data)
        bpy.context.scene.collection.objects.link(camera)
        camera.location = (9, 10, 11)
        bpy.context.view_layer.update()
        self.matrix = [list(row) for row in mesh.matrix_world]
        self.vertices = [list(vertex.co) for vertex in mesh.data.vertices]
        self.source = self.folder / 'fixture.blend'
        bpy.ops.wm.save_as_mainfile(filepath=str(self.source), check_existing=False)
        self.source_record = fingerprint(self.source)
        bpy.ops.wm.read_factory_settings(use_empty=True)

    def tearDown(self):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        self.tmp.cleanup()

    def run_extract(self, *extra):
        previous = sys.argv[:]
        sys.argv = ['extract_render_body.py', '--', '--source', str(self.source),
                    '--body-id', 'TEST.BODY', '--prefix', 'TEST.GOOD.',
                    '--camera-prefix', 'TEST.CAMERA', '--out', str(self.folder / 'output'), *extra]
        try:
            main()
        finally:
            sys.argv = previous

    def test_source_geometry_metadata_and_whole_plate_projection(self):
        self.run_extract('--frame-camera', 'TEST.CAMERA')
        report = json.loads((self.folder / 'output/extraction.json').read_text())
        self.assertEqual(report['source_meshes'], 1)
        self.assertEqual(report['source_polygons'], 6)
        self.assertEqual(report['structure_ids'], ['TEST.GOOD.MESH'])
        self.assertEqual(fingerprint(self.source), self.source_record)
        mesh = bpy.context.scene.objects['TEST.GOOD.MESH']
        self.assertEqual([list(row) for row in mesh.matrix_world], self.matrix)
        self.assertEqual([list(vertex.co) for vertex in mesh.data.vertices], self.vertices)
        self.assertFalse(mesh['panacea_clinically_reviewed'])
        self.assertEqual(mesh['panacea_review_status'], 'review_required')
        bpy.context.view_layer.update()
        camera = bpy.context.scene.camera
        self.assertEqual(camera.data.type, 'ORTHO')
        for corner in mesh.bound_box:
            projected = world_to_camera_view(bpy.context.scene, camera, mesh.matrix_world @ Vector(corner))
            self.assertGreaterEqual(projected.x, 0)
            self.assertLessEqual(projected.x, 1)
            self.assertGreaterEqual(projected.y, 0)
            self.assertLessEqual(projected.y, 1)
            self.assertGreater(projected.z, 0)

    def test_unknown_source_prefix_creates_no_output(self):
        with self.assertRaisesRegex(ValueError, 'No existing objects'):
            self.run_extract('--prefix', 'MISSING.')
        self.assertFalse((self.folder / 'output').exists())
        self.assertEqual(fingerprint(self.source), self.source_record)

    def test_wrong_body_and_missing_camera_create_no_output(self):
        for args in [('--body-id', 'OTHER.BODY'), ('--frame-camera', 'MISSING.CAMERA')]:
            with self.assertRaises(ValueError):
                self.run_extract(*args)
            self.assertFalse((self.folder / 'output').exists())
            self.assertEqual(fingerprint(self.source), self.source_record)
            bpy.ops.wm.read_factory_settings(use_empty=True)

    def test_existing_output_and_open_master_are_preserved(self):
        out = self.folder / 'output'
        out.mkdir()
        marker = out / 'previous.bin'
        marker.write_bytes(b'previous trial')
        with self.assertRaises(FileExistsError):
            self.run_extract()
        self.assertEqual(marker.read_bytes(), b'previous trial')
        bpy.ops.wm.open_mainfile(filepath=str(self.source))
        with self.assertRaises(SystemExit) as caught:
            self.run_extract()
        self.assertEqual(caught.exception.code, 2)
        self.assertEqual(fingerprint(self.source), self.source_record)


if __name__ == '__main__':
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(ExtractRenderBodyTests))
    if not result.wasSuccessful():
        raise RuntimeError('Blender render-body extraction regression failed')
