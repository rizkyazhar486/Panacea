"""Run with Blender --factory-startup --python-exit-code 1 -P this_file.py."""
from pathlib import Path
import sys
import unittest
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
sys.path.insert(0, str(Path(__file__).resolve().parent))
from render_camera import frame_visible_meshes

class CameraFramingTests(unittest.TestCase):
    def setUp(self):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        self.scene = bpy.context.scene
        self.scene.render.resolution_x, self.scene.render.resolution_y = 960, 540
        self.meshes = []
        for location, scale in [((2, 3, 4), (1, 2, 3)), ((4, 7, 2), (2, 1, 1)), ((100, 100, 0), (1, 1, 1))]:
            bpy.ops.mesh.primitive_cube_add(size=1, location=location)
            obj = bpy.context.object
            obj.scale = scale
            self.meshes.append(obj)
        self.meshes[-1].hide_render = True
        camera = bpy.data.objects.new('TEST.CAMERA', bpy.data.cameras.new('TEST.CAMERA'))
        self.scene.collection.objects.link(camera)
        camera.rotation_euler = (0.7, 0.2, 0.6)
        camera.data.shift_x = 0.4
        self.scene.camera = camera
        bpy.context.view_layer.update()
        self.matrices = [obj.matrix_world.copy() for obj in self.meshes]
        self.rotation = camera.matrix_world.to_quaternion()

    def test_centres_visible_bounds_and_preserves_anatomy(self):
        report = frame_visible_meshes(self.scene, self.meshes)
        self.assertEqual(report['mesh_count'], 2)
        projected = [world_to_camera_view(self.scene, self.scene.camera, obj.matrix_world @ Vector(corner))
                     for obj in self.meshes[:-1] for corner in obj.bound_box]
        for point in projected:
            self.assertTrue(0 <= point.x <= 1 and 0 <= point.y <= 1 and point.z > 0)
        for axis in ('x', 'y'):
            self.assertAlmostEqual((min(getattr(p, axis) for p in projected) + max(getattr(p, axis) for p in projected)) / 2, 0.5, places=5)
        for obj, previous in zip(self.meshes, self.matrices):
            self.assertEqual(obj.matrix_world, previous)
        self.assertTrue(self.meshes[-1].hide_render)
        self.assertLess(self.rotation.rotation_difference(self.scene.camera.matrix_world.to_quaternion()).angle, 0.001)

    def test_invalid_inputs_do_not_change_camera(self):
        previous = self.scene.camera.matrix_world.copy()
        for meshes, margin in [([], 1.1), (self.meshes, 0.5), (self.meshes, float('nan'))]:
            with self.assertRaises(ValueError):
                frame_visible_meshes(self.scene, meshes, margin)
        self.assertEqual(self.scene.camera.matrix_world, previous)

if __name__ == '__main__':
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(CameraFramingTests))
    if not result.wasSuccessful():
        raise RuntimeError('Camera framing regression failed')
