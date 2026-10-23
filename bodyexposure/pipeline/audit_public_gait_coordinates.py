"""Read-only native coordinate inventory of public rigid gait GLBs.
First run scripts/qa/decode-rig-for-blender.mjs --decoded-dir DIRECTORY.
Then Blender -b --factory-startup --python-exit-code 1 --python THIS_FILE --
  --decoded-dir DIRECTORY --out bodyexposure/qa_reports/gait_coordinate_audit.json
Does not evaluate animation parity or approve clinical biomechanics.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import struct
import sys
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
NAMES = ('adult_male', 'vhf_denver_ct_adult_female')

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def glb_json(raw):
    if len(raw) < 28 or struct.unpack_from('<III', raw) != (0x46546c67, 2, len(raw)):
        raise ValueError('invalid GLB header')
    length, kind = struct.unpack_from('<II', raw, 12)
    if kind != 0x4E4F534A or length % 4 or 20 + length > len(raw):
        raise ValueError('invalid JSON chunk')
    return json.loads(raw[20:20 + length])

def bounds(points):
    return {'min': [min(p[k] for p in points) for k in range(3)],
            'max': [max(p[k] for p in points) for k in range(3)]} if points else None

def audit(name, decoded_dir):
    source_path = ROOT / 'public' / 'bodyexposure' / (name + '.rig_rom.glb')
    source = source_path.read_bytes()
    decoded = (decoded_dir / (name + '.decoded.glb')).read_bytes()
    original_json, decoded_json = glb_json(source), glb_json(decoded)
    # Decoding may only rewrite buffer storage/compression declarations.
    for key in ('nodes', 'meshes', 'animations', 'skins', 'accessors', 'scenes', 'scene'):
        if original_json.get(key) != decoded_json.get(key):
            raise ValueError('decoded intermediary changed source contract: ' + key)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(decoded_dir / (name + '.decoded.glb')))
    bpy.context.view_layer.update()
    scene = bpy.context.scene
    item = {'source': source_path.relative_to(ROOT).as_posix(), 'source_sha256': digest(source),
            'decoded_name': name + '.decoded.glb', 'decoded_sha256': digest(decoded),
            'gltf_asset': original_json.get('asset'), 'source_skins': len(original_json.get('skins', [])),
            'scene_units': {'system': scene.unit_settings.system, 'scale_length': scene.unit_settings.scale_length},
            'fps': scene.render.fps, 'fps_base': scene.render.fps_base,
            'armatures': sorted(o.name for o in bpy.data.objects if o.type == 'ARMATURE'),
            'sampled_frame': scene.frame_current,
            'pose_basis': 'Blender glTF importer-selected initial animation at the sampled frame; not source rest pose.',
            'active_animation_bindings': [],
            'rig_nodes': [], 'actions': [], 'feet_import_pose': {}}
    for obj in sorted(bpy.data.objects, key=lambda o: o.name):
        animation_data = obj.animation_data
        if animation_data and animation_data.action:
            item['active_animation_bindings'].append({
                'object': obj.name, 'action': animation_data.action.name})
    for obj in sorted(bpy.data.objects, key=lambda o: o.name):
        if obj.name.startswith(('FOOT.', 'RIG.')) or obj.name == 'PELVIS':
            item['rig_nodes'].append({'name': obj.name, 'type': obj.type,
                'parent': obj.parent.name if obj.parent else None, 'local_scale': list(obj.scale),
                'world_matrix': [list(row) for row in obj.matrix_world]})
    for action in sorted(bpy.data.actions, key=lambda a: a.name):
        item['actions'].append({'name': action.name, 'frame_range': list(action.frame_range),
                               'slots': [slot.identifier for slot in action.slots]})
    item['animation_targets'] = {animation['name']: [
        {'node': original_json['nodes'][channel['target']['node']].get('name'), 'path': channel['target']['path']}
        for channel in animation['channels']] for animation in original_json.get('animations', [])}
    for side in ('L', 'R'):
        anchor = bpy.data.objects.get('FOOT.' + side)
        meshes = sorted((o for o in anchor.children_recursive if o.type == 'MESH'), key=lambda o: o.name) if anchor else []
        points = [o.matrix_world @ vertex.co for o in meshes for vertex in o.data.vertices]
        item['feet_import_pose'][side] = {'anchor': anchor.name if anchor else None,
            'meshes': [{'name': o.name, 'parent': o.parent.name if o.parent else None,
                        'vertices': len(o.data.vertices)} for o in meshes],
            'vertices': len(points), 'bounds': bounds(points)}
    item['world_bounds'] = bounds([o.matrix_world @ Vector(corner) for o in bpy.data.objects
                                 if o.type == 'MESH' for corner in o.bound_box])
    item['nonfinite_or_exactly_singular_transforms'] = sorted(o.name for o in bpy.data.objects
        if not all(math.isfinite(value) for row in o.matrix_world for value in row)
        or o.matrix_world.determinant() == 0)
    return item

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--decoded-dir', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
    report = {'schema_version': 1, 'blender_version': bpy.app.version_string,
        'method': 'Meshopt-decoded intermediary; fresh factory scene per asset; read-only Blender glTF import; importer-selected initial animation pose.',
        'coordinate_contract': {'gltf_up': '+Y', 'gltf_anterior_for_these_assets': '+Z',
            'blender_up': '+Z', 'blender_anterior_after_import': '-Y', 'distance_unit': 'metre'},
        'limitations': ['Import-pose bounds and transforms are not source rest-pose measurements.',
                        'Rigid hierarchy inventory, not Blender pose-bone validation.',
            'No sampled animation parity, force/contact simulation, or clinical gait approval.',
            'Small nonzero determinants from quantization are not singular transforms.',
            'Frame ranges include the exported loop endpoint; this audit does not count stance phases.'],
        'assets': [audit(name, args.decoded_dir) for name in NAMES]}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2) + '\n')
    if any(a['nonfinite_or_exactly_singular_transforms'] or
           any(not f['vertices'] for f in a['feet_import_pose'].values()) for a in report['assets']):
        raise RuntimeError('native coordinate audit failed; inspect report')

if __name__ == '__main__':
    main()
