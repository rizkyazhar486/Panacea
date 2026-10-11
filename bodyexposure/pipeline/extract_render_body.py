"""Append one existing anatomy body into an isolated render BLEND, unchanged.

blender -b --factory-startup --python-exit-code 1 -P extract_render_body.py -- \
  --source MASTER.blend --body-id HUMAN.ADULT.FEMALE --prefix ADULT.FEMALE. --out NEW_DIRECTORY
"""
import argparse
import json
from pathlib import Path
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from render_artifacts import claim_output, fingerprint, verify_unchanged, validate_body_selection


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--body-id', required=True)
    parser.add_argument('--prefix', required=True, help='Exact existing source object-name prefix')
    parser.add_argument('--camera-prefix', help='Optional exact prefix of existing source cameras')
    parser.add_argument('--frame-camera', help='Reframe one named source camera as an orthographic 16:9 whole-body plate')
    parser.add_argument('--out', required=True)
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    if not args.prefix.strip() or not args.body_id.strip():
        parser.error('Body ID and object-name prefix must be nonempty')
    source = fingerprint(args.source)
    if bpy.data.filepath:
        parser.error('Start with --factory-startup; do not run inside an opened anatomy master')
    with bpy.data.libraries.load(source['path'], link=False) as (available, selected):
        names = [name for name in available.objects if name.startswith(args.prefix)]
        if not names:
            raise ValueError('No existing objects match the requested source prefix')
        camera_names = [name for name in available.objects if args.camera_prefix and name.startswith(args.camera_prefix)]
        if args.camera_prefix is not None and (not args.camera_prefix.strip() or not camera_names):
            raise ValueError('Camera prefix must select existing source cameras')
        selected.objects = names + camera_names
    meshes = [obj for obj in selected.objects if obj is not None and obj.type == 'MESH']
    cameras = [obj for obj in selected.objects if obj is not None and obj.type == 'CAMERA']
    if not meshes or len(meshes) != len(names):
        raise ValueError('The prefix must identify only existing anatomical meshes')
    if len(cameras) != len(camera_names):
        raise ValueError('Camera prefix must select only source camera objects')
    plate_camera = next((camera for camera in cameras if camera.name == args.frame_camera), None)
    if args.frame_camera and plate_camera is None:
        raise ValueError('Requested plate camera is not among the selected source cameras')
    ids = validate_body_selection([{'type': obj.type, 'body_id': obj.get('panacea_body_id'),
                                   'structure_id': obj.get('panacea_structure_id')} for obj in meshes], args.body_id)
    output = claim_output(args.out)
    keep = set(meshes + cameras)
    for obj in list(bpy.context.scene.objects):
        if obj not in keep:
            bpy.data.objects.remove(obj, do_unlink=True)
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0
    for obj in meshes:
        scene.collection.objects.link(obj)
        obj.hide_set(False)
        obj.hide_viewport = False
        obj.hide_render = False
    for camera in cameras:
        scene.collection.objects.link(camera)
    if cameras:
        scene.camera = cameras[0]
    bpy.context.view_layer.update()
    if plate_camera:
        points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
        low = Vector(tuple(min(point[axis] for point in points) for axis in range(3)))
        high = Vector(tuple(max(point[axis] for point in points) for axis in range(3)))
        centre = (low + high) / 2
        rotation = plate_camera.matrix_world.to_quaternion()
        projected = [rotation.inverted() @ (point - centre) for point in points]
        width = max(point.x for point in projected) - min(point.x for point in projected)
        height = max(point.y for point in projected) - min(point.y for point in projected)
        if max(width, height) <= 0:
            raise ValueError('Selected anatomy has no extent for camera framing')
        plate_camera.data = plate_camera.data.copy()
        plate_camera.data.type = 'ORTHO'
        plate_camera.data.shift_x = plate_camera.data.shift_y = 0
        plate_camera.data.ortho_scale = max(width, height * 16 / 9) * 1.10
        pose = plate_camera.matrix_world.copy()
        pose.translation = centre + rotation @ Vector((0, 0, max((high - low).length * 3, plate_camera.data.clip_start * 2)))
        plate_camera.matrix_world = pose
        scene.render.resolution_x, scene.render.resolution_y = 1920, 1080
        scene.camera = plate_camera
    verify_unchanged([source])
    destination = output / 'anatomy_render_body.blend'
    bpy.ops.wm.save_as_mainfile(filepath=str(destination), check_existing=False, relative_remap=False)
    report = {
        'schema_version': 1, 'body_id': args.body_id,
        'operation': 'append existing meshes; preserve geometry, transforms, materials and anatomical metadata',
        'source': source, 'output': fingerprint(destination),
        'source_meshes': len(meshes), 'source_polygons': sum(len(obj.data.polygons) for obj in meshes),
        'source_cameras': sorted(camera.name for camera in cameras),
        'reframed_plate_camera': args.frame_camera,
        'structure_ids': sorted(ids), 'clinical_validation': 'pending',
        'source_unchanged': True,
        'limitations': ['This is an isolated rendering copy, not new anatomical evidence.',
                       'Optional plate framing changes camera presentation only; meshes retain their source transforms.',
                       'External textures retain their original paths; the copy is not a portable packaged asset.'],
    }
    verify_unchanged([source])
    (output / 'extraction.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'EXTRACTED {len(meshes)} source meshes: {destination}')


if __name__ == '__main__':
    main()
