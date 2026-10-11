"""Presentation-only orthographic framing for the currently visible source meshes."""
import math
import bpy
from mathutils import Matrix, Vector


def frame_visible_meshes(scene, meshes, margin=1.10):
    if not math.isfinite(margin) or margin < 1:
        raise ValueError('Camera margin must be finite and at least 1')
    camera = scene.camera
    if camera is None:
        raise ValueError('Visible framing requires an existing camera')
    bpy.context.view_layer.update()
    rotation = camera.matrix_world.to_quaternion()
    inverse = rotation.inverted()
    points = [inverse @ (obj.matrix_world @ Vector(corner))
              for obj in meshes if obj.type == 'MESH' and not obj.hide_render
              for corner in obj.bound_box]
    if not points:
        raise ValueError('Visible framing requires visible meshes')
    low = Vector(tuple(min(p[a] for p in points) for a in range(3)))
    high = Vector(tuple(max(p[a] for p in points) for a in range(3)))
    width, height = high.x - low.x, high.y - low.y
    if max(width, height) <= 0:
        raise ValueError('Visible meshes have no camera-plane extent')
    aspect = (scene.render.resolution_x * scene.render.pixel_aspect_x /
              (scene.render.resolution_y * scene.render.pixel_aspect_y))
    centre = (low + high) / 2
    distance = max((high - low).length * 3, camera.data.clip_start * 2)
    position = rotation @ (centre + Vector((0, 0, distance)))
    camera.data = camera.data.copy()
    camera.data.type = 'ORTHO'
    camera.data.sensor_fit = 'HORIZONTAL'
    camera.data.shift_x = camera.data.shift_y = 0
    camera.data.ortho_scale = max(width, height * aspect) * margin
    camera.data.clip_end = max(camera.data.clip_end, distance + (high.z - low.z))
    camera.matrix_world = Matrix.Translation(position) @ rotation.to_matrix().to_4x4()
    bpy.context.view_layer.update()
    return {'mode': 'visible_meshes', 'camera': camera.name,
            'mesh_count': len([obj for obj in meshes if obj.type == 'MESH' and not obj.hide_render]),
            'margin': margin, 'ortho_scale': camera.data.ortho_scale}
