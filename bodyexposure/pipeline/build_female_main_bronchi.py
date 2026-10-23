"""Prepare the existing HRA female main-bronchus GLB as a standalone source reference.

Blender -b --factory-startup --python-exit-code 1 -P this_file.py -- --source INPUT.glb --out NEW_DIRECTORY
The source coordinate frame is retained. This does not register or merge anatomy into the whole-body female.
"""
import argparse
import json
from pathlib import Path
import sys
import bpy
import bmesh
from mathutils import Vector
sys.path.insert(0, str(Path(__file__).resolve().parent))
from render_artifacts import claim_output, fingerprint, verify_unchanged

from female_main_bronchi_source import BODY_ID, SOURCE_URL, SOURCE, LICENSE, SOURCE_SHA256, NODES


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    if bpy.data.filepath:
        parser.error('Use factory startup; refusing to operate on an opened master')
    inputs = [fingerprint(args.source), fingerprint(__file__), fingerprint(Path(__file__).with_name('female_main_bronchi_source.py'))]
    if inputs[0]['sha256'] != SOURCE_SHA256:
        raise ValueError('Source differs from the pinned local HRA main-bronchus asset')
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(args.source.resolve()))
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if len(meshes) != len(NODES) or {obj.name for obj in meshes} != set(NODES):
        raise ValueError('Source must contain exactly the four named HRA main-bronchus meshes')
    out = claim_output(args.out)
    rows = []
    for obj in sorted(meshes, key=lambda obj: obj.name):
        raw_name = obj.name
        suffix, label, side = NODES[raw_name]
        sid = 'REFERENCE.VH_FEMALE.RESPIRATORY.' + suffix
        metadata = {
            'panacea_structure_id': sid, 'canonical_name': label, 'panacea_body_id': BODY_ID,
            'panacea_system': 'respiratory', 'panacea_laterality': side,
            'panacea_laterality_source': 'source_mesh_name', 'panacea_source': SOURCE,
            'panacea_source_url': SOURCE_URL, 'panacea_license': LICENSE,
            'panacea_source_raw_name': raw_name, 'panacea_method': 'existing HRA source mesh; no segmentation or registration added',
            'panacea_accuracy_status': 'model_segmented', 'panacea_review_status': 'review_required',
            'panacea_version': 'body_v001', 'biological_sex_applicability': 'female',
            'panacea_clinically_reviewed': False, 'panacea_educational_only': True,
            'panacea_known_limitations': 'Standalone four-component reference in the source frame; not registered to the canonical whole-body female.',
        }
        obj.name = sid
        for key, value in metadata.items(): obj[key] = value
        bpy.context.view_layer.update()
        points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
        bm = bmesh.new(); bm.from_mesh(obj.data)
        rows.append(metadata | {
            'bbox_min_m': [min(p[axis] for p in points) for axis in range(3)],
            'bbox_max_m': [max(p[axis] for p in points) for axis in range(3)],
            'mesh': {'verts': len(obj.data.vertices), 'tris': sum(len(p.vertices)-2 for p in obj.data.polygons),
                     'boundary_edges': sum(edge.is_boundary for edge in bm.edges),
                     'nonmanifold_edges': sum(not edge.is_manifold and not edge.is_boundary for edge in bm.edges)},
        })
        bm.free()
    bpy.ops.object.select_all(action='DESELECT')
    for obj in meshes: obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.export_scene.gltf(filepath=str(out/'female_main_bronchi.glb'), export_format='GLB',
                             use_selection=True, export_extras=True, export_animations=False)
    bpy.ops.wm.save_as_mainfile(filepath=str(out/'female_main_bronchi.blend'), check_existing=False, relative_remap=False)
    verify_unchanged(inputs)
    report = {'schema_version': 1, 'body_id': BODY_ID, 'source': SOURCE, 'source_url': SOURCE_URL,
              'license': LICENSE, 'input_artifacts': inputs, 'inputs_unchanged': True,
              'clinical_validation': 'pending', 'structures': rows,
              'coordinate_frame': 'Source glTF Y-up metres converted by the Blender importer; no further geometry or placement transform.',
              'registration_to_whole_body': None,
              'output_artifacts': [fingerprint(out/'female_main_bronchi.glb'), fingerprint(out/'female_main_bronchi.blend')]}
    (out/'report.json').write_text(json.dumps(report, indent=2)+'\n')
    print('PREPARED', len(rows), 'source components in', out)

if __name__ == '__main__': main()
