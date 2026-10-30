"""Independent Blender reproduction of public rigid GLB WALK/RUN contact samples.

Run after scripts/qa/decode-rig-for-blender.mjs:
  Blender -b --factory-startup --python-exit-code 1 --python THIS -- \
    --decoded-dir /tmp/panacea-d7-decoded --out /tmp/panacea-d7-native-contact.json

This is an engineering cross-check, not clinical or force-plate validation.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import struct
import sys

import bpy
from mathutils import Matrix, Quaternion, Vector


ROOT = Path(__file__).resolve().parents[2]
NAMES = ('adult_male', 'vhf_denver_ct_adult_female')
SOURCE_SHA256 = {
    # 2026-10-23 (ENG-D7-03): sumber berubah hanya dengan node landmark FOOT_LANDMARK_* yang ditambahkan; ditinjau lewat
    # bodyexposure/qa_reports/rig_landmark_nodes.json (strip node -> JSON kanonik + BIN identik dengan versi 0d4a9564/73b112ed).
    'adult_male': 'b2c7cb609a7cc52064de4b5526ddfd2d9e15b6b261dcf44652aa5e1e3c887dc9',  # T-D7-05 MTP re-rig; needs independent review (PR)
    'vhf_denver_ct_adult_female': '7ec5ae004e6dca96f93cbb85b297e32d6a1d128980cdaa4af42a1d51eb574e32',  # changed by #2766 (T-D7-04) without re-pinning; needs independent review (PR)
}
FPS = 24
CONTACT_M = 0.015
MIN_FRAMES = 3
PLANTAR_FRACTION = 0.25
TO_GLTF = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))
TO_BLENDER = TO_GLTF.inverted()


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def glb_json(raw):
    if len(raw) < 28 or struct.unpack_from('<III', raw) != (0x46546c67, 2, len(raw)):
        raise ValueError('invalid GLB header')
    length, kind = struct.unpack_from('<II', raw, 12)
    if kind != 0x4E4F534A or length % 4 or 20 + length > len(raw):
        raise ValueError('invalid GLB JSON chunk')
    return json.loads(raw[20:20 + length])


def source_rest(nodes):
    # Blender's importer activates ROM at frame 1. Reset every imported node to
    # the GLB-declared rest TRS before selecting heel/toe plantar vertices.
    for obj in bpy.data.objects:
        if obj.animation_data:
            obj.animation_data.action = None
            for track in obj.animation_data.nla_tracks:
                track.mute = True
    for node in nodes:
        obj = bpy.data.objects.get(node.get('name', ''))
        if obj is None:
            continue
        obj.location = TO_BLENDER @ Vector(node.get('translation', (0, 0, 0)))
        x, y, z, w = node.get('rotation', (0, 0, 0, 1))
        source_q = Quaternion((w, x, y, z))
        obj.rotation_mode = 'QUATERNION'
        obj.rotation_quaternion = (TO_BLENDER @ source_q.to_matrix() @ TO_GLTF).to_quaternion()
        obj.scale = node.get('scale', (1, 1, 1))
    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()


def foot_vertices(side):
    anchor = bpy.data.objects.get('FOOT.' + side)
    if anchor is None:
        raise ValueError('missing foot anchor: ' + side)
    meshes = sorted((obj for obj in anchor.children_recursive if obj.type == 'MESH'), key=lambda obj: obj.name)
    if not meshes or any(not obj.data.vertices for obj in meshes):
        raise ValueError('missing rigid foot geometry: ' + side)
    return [(obj, vertex.index) for obj in meshes for vertex in obj.data.vertices]


def world_gltf(obj, vertex_index):
    point = TO_GLTF @ (obj.matrix_world @ obj.data.vertices[vertex_index].co)
    if not all(math.isfinite(value) for value in point):
        raise ValueError('nonfinite foot vertex: ' + obj.name)
    return (point.x, point.y, point.z)


def marker_indices(vertices):
    points = [(obj, index, world_gltf(obj, index)) for obj, index in vertices]
    zmin = min(p[2][2] for p in points)
    zmax = max(p[2][2] for p in points)
    length = zmax - zmin
    if not math.isfinite(length) or length <= 0:
        raise ValueError('degenerate foot AP extent')
    posterior = [p for p in points if p[2][2] <= zmin + PLANTAR_FRACTION * length]
    anterior = [p for p in points if p[2][2] >= zmax - PLANTAR_FRACTION * length]
    return {
        'heel': min(points, key=lambda p: p[2][2])[:2],
        'toe': max(points, key=lambda p: p[2][2])[:2],
        'heelPlantar': min(posterior, key=lambda p: (p[2][1], p[2][2]))[:2],
        'toePlantar': min(anterior, key=lambda p: (p[2][1], -p[2][2]))[:2],
    }


def activate(name):
    action = bpy.data.actions.get(name)
    if action is None or list(action.frame_range)[0] != 0 or list(action.frame_range)[1] < MIN_FRAMES:
        raise ValueError('missing or unsupported action: ' + name)
    for obj in bpy.data.objects:
        data = obj.animation_data
        if data is None:
            continue
        slot = next((slot for slot in action.slots if slot.identifier == 'OB' + obj.name), None)
        data.action = action if slot else None
        if slot:
            data.action_slot = slot
    return int(round(action.frame_range[1]))


def clip_rows(name, feet, markers):
    end_frame = activate(name)
    scene = bpy.context.scene
    pelvis = bpy.data.objects.get('PELVIS')
    if pelvis is None:
        raise ValueError('missing PELVIS')
    rows = []
    for frame in range(end_frame + 1):
        scene.frame_set(frame)
        bpy.context.view_layer.update()
        pelvis_position = TO_GLTF @ pelvis.matrix_world.translation
        row = {'pelvisZ': pelvis_position.z}
        for side in ('L', 'R'):
            positions = [world_gltf(obj, index) for obj, index in feet[side]]
            lowest = min(positions, key=lambda point: point[1])
            record = {'lowest': lowest[1], 'lowestZ': lowest[2]}
            for label, (obj, index) in markers[side].items():
                x, y, z = world_gltf(obj, index)
                record[label] = {'y': y, 'z': z}
            row[side] = record
        rows.append(row)
    return rows


def remove_loop_endpoint(rows):
    def signature(row):
        return [value for side in ('L', 'R') for value in (
            row[side]['lowest'], row[side]['toe']['y'], row[side]['heel']['y'],
            row[side]['toePlantar']['y'], row[side]['heelPlantar']['y'],
            row[side]['toe']['z'] - row['pelvisZ'],
            row[side]['heel']['z'] - row['pelvisZ'])]
    closed = all(abs(a - b) < .0005 for a, b in zip(signature(rows[0]), signature(rows[-1])))
    return (rows[:-1] if closed else rows), closed


def phases(heights, closed):
    count = len(heights)
    groups = []
    i = 0
    while i < count:
        if heights[i] < CONTACT_M:
            j = i
            while j + 1 < count and heights[j + 1] < CONTACT_M:
                j += 1
            groups.append((i, j))
            i = j + 1
        else:
            i += 1
    if closed and len(groups) > 1 and groups[0][0] == 0 and groups[-1][1] == count - 1:
        first, last = groups[0], groups[-1]
        groups = groups[1:-1] + [(last[0], first[1] + count)]
    return [group for group in groups if group[1] - group[0] + 1 >= MIN_FRAMES]


def regression(groups):
    if not groups:
        return {'stance_phases': 0}
    centered = []
    numerator = denominator = 0.0
    for group in groups:
        tm = sum(group['t']) / len(group['t'])
        xm = sum(group['x']) / len(group['x'])
        centered.append((group, tm, xm))
        for t, x in zip(group['t'], group['x']):
            numerator += (t - tm) * (x - xm)
            denominator += (t - tm) ** 2
    if denominator <= 0:
        raise ValueError('invalid contact regression')
    velocity = -numerator / denominator
    residuals = [x - (xm - velocity * (t - tm)) for group, tm, xm in centered
                 for t, x in zip(group['t'], group['x'])]
    return {'stance_phases': len(groups), 'stance_frames': len(residuals),
            'common_forward_speed_m_s': abs(velocity),
            'slide_rms_mm': 1000 * math.sqrt(sum(r * r for r in residuals) / len(residuals)),
            'slide_max_mm': 1000 * max(map(abs, residuals))}


def measurements(rows, closed):
    count = len(rows)
    floor = min(row[side]['lowest'] for row in rows for side in ('L', 'R'))
    out = {'frames': count, 'loop_closed_duplicate_end_frame_dropped': closed,
           'floor_m': floor}
    for kind in ('heel', 'toe', 'heelPlantar', 'toePlantar', 'sole'):
        groups = []
        per_side = {}
        for side in ('L', 'R'):
            heights = [(row[side]['lowest'] if kind == 'sole' else row[side][kind]['y']) - floor
                       for row in rows]
            intervals = phases(heights, closed)
            per_side[side] = [f'{a}-{count - 1}+0-{b - count}' if b >= count else f'{a}-{b}'
                              for a, b in intervals]
            for a, b in intervals:
                t, x = [], []
                for frame in range(a, b + 1):
                    row = rows[frame % count]
                    t.append(frame / FPS)
                    x.append((row[side]['lowestZ'] if kind == 'sole' else row[side][kind]['z']) - row['pelvisZ'])
                groups.append({'side': side, 't': t, 'x': x})
        out[kind] = {**regression(groups), 'phases_by_side': per_side, 'samples': groups}
    return out


def audit_one(name, decoded_dir):
    source_path = ROOT / 'public' / 'bodyexposure' / (name + '.rig_rom.glb')
    decoded_path = decoded_dir / (name + '.decoded.glb')
    source, decoded = source_path.read_bytes(), decoded_path.read_bytes()
    if digest(source) != SOURCE_SHA256[name]:
        raise ValueError('public source changed; independently review before reproducing: ' + name)
    source_json, decoded_json = glb_json(source), glb_json(decoded)
    for key in ('nodes', 'meshes', 'animations', 'skins', 'accessors', 'scenes', 'scene'):
        if source_json.get(key) != decoded_json.get(key):
            raise ValueError('decoded input changed source: ' + key)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(decoded_path))
    if bpy.context.scene.render.fps != FPS:
        raise ValueError('unexpected Blender frame rate')
    source_rest(source_json['nodes'])
    feet = {side: foot_vertices(side) for side in ('L', 'R')}
    markers = {side: marker_indices(feet[side]) for side in ('L', 'R')}
    rest_markers = {side: {label: {'mesh': obj.name, 'vertex': index,
                                   'position_gltf_m': list(world_gltf(obj, index))}
                            for label, (obj, index) in markers[side].items()}
                    for side in ('L', 'R')}
    clips = {}
    for clip in ('WALK', 'RUN'):
        rows, closed = remove_loop_endpoint(clip_rows(clip, feet, markers))
        clips[clip] = measurements(rows, closed)
    return {'source': source_path.relative_to(ROOT).as_posix(), 'source_sha256': digest(source),
            'decoded_sha256': digest(decoded), 'rest_markers': rest_markers, 'clips': clips}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--decoded-dir', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
    report = {'schema_version': 1, 'method': 'Independent Blender5 rigid mesh/animation sample; source rest markers; common clip floor; 24fps.',
              'coordinate_contract': {'gltf_up': '+Y', 'gltf_anterior': '+Z', 'blender_up': '+Z',
                                      'blender_anterior': '-Y', 'length_unit': 'metre',
                                      'contact_window_m': CONTACT_M, 'minimum_stance_frames': MIN_FRAMES},
              'limitations': ['AP rigid-vertex residual, not measured 3D ground slip or force-plate contact.',
                              'The 15 mm contact window is inherited research placeholder, not clinically validated.'],
              'assets': [audit_one(name, args.decoded_dir) for name in NAMES]}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2) + '\n')


if __name__ == '__main__':
    main()
