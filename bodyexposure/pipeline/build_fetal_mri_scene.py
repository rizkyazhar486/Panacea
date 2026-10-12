"""Build a fresh comparison scene from the nine pinned fetal QA surfaces and native MRI planes."""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import sys
import bpy
from mathutils import Vector
sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetal_mri_scene_geometry import SOURCE_BLEND_SHA, load_package, plane_corners_m, source_point_m
from render_artifacts import claim_output, fingerprint, verify_unchanged

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source-blend', type=Path, required=True)
    p.add_argument('--package', type=Path, required=True)
    p.add_argument('--out', type=Path, required=True)
    p.add_argument('--label', type=int, default=1, choices=range(1, 10))
    a = p.parse_args(sys.argv[sys.argv.index('--') + 1:])
    if a.out.exists():
        raise RuntimeError('fresh output required; preserve existing work')
    source_artifact = fingerprint(a.source_blend)
    source_hash = source_artifact['sha256']
    if source_hash != SOURCE_BLEND_SHA:
        raise RuntimeError('pinned QA scene differs')
    (d, r) = load_package(a.package, a.label)
    inputs = [source_artifact, fingerprint(a.package / 'manifest.json'), fingerprint(__file__), fingerprint(Path(__file__).with_name('fetal_mri_scene_geometry.py'))]
    inputs += [fingerprint(a.package / im['asset']) for im in r['images']]
    bpy.ops.wm.open_mainfile(filepath=str(a.source_blend))
    source = [ob for ob in bpy.context.scene.objects if ob.type == 'MESH' and ob.name.startswith('FETAL_QA.')]
    if len(source) != 9 or {int(ob.get('source_label', 0)) for ob in source} != set(range(1, 10)):
        raise RuntimeError('all nine original source surfaces required')
    if any((ob.get('clinical_validation') != 'pending' or ob.get('anatomical_identity') != 'unresolved' for ob in source)):
        raise RuntimeError('source review flags differ')

    def fingerprints():
        result = {}
        for ob in source:
            h = hashlib.sha256()
            for vertex in ob.data.vertices:
                h.update(struct.pack('<ddd', *ob.matrix_world @ vertex.co))
            for polygon in ob.data.polygons:
                h.update(struct.pack('<' + 'I' * len(polygon.vertices), *polygon.vertices))
            result[str(ob['source_label'])] = {'world_geometry_sha256': h.hexdigest(), 'vertices': len(ob.data.vertices), 'polygons': len(ob.data.polygons)}
        return result
    before = fingerprints()
    palette = ['e66b65', 'efb34f', '68b9e8', '718ae2', '9c77ce', '65c7ad', 'cc85a7', 'b9c568', 'c69d7a']
    for ob in source:
        hexcolor = palette[int(ob['source_label']) - 1]
        srgb = [int(hexcolor[i:i + 2], 16) / 255 for i in (0, 2, 4)]
        linear = [n / 12.92 if n <= 0.04045 else ((n + 0.055) / 1.055) ** 2.4 for n in srgb] + [1]
        mat = bpy.data.materials.new('Display numeric colour ' + str(ob['source_label']))
        mat.use_nodes = True
        mat.diffuse_color = linear
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = linear
        bsdf.inputs['Roughness'].default_value = 0.65
        ob.data.materials.clear()
        ob.data.materials.append(mat)

    def xyz(ijk):
        return Vector(source_point_m(d, ijk))
    collection = bpy.data.collections.new('MRI source display planes; pending human review')
    bpy.context.scene.collection.children.link(collection)
    planes = []
    for im in r['images']:
        axis = im['axis']
        corners = [Vector(v) for v in plane_corners_m(d, r, axis)]
        mesh = bpy.data.meshes.new('Native MRI display quad')
        mesh.from_pydata(corners, [], [(0, 1, 2, 3)])
        mesh.update()
        ob = bpy.data.objects.new(f"MRI_SOURCE.REGION_{a.label:02d}.PLANE_{'IJK'[axis]}", mesh)
        collection.objects.link(ob)
        uv = mesh.uv_layers.new(name='Native source pixels')
        for (loop, coords) in zip(uv.data, [(0, 0), (1, 0), (1, 1), (0, 1)]):
            loop.uv = coords
        image = bpy.data.images.load(str(a.package / im['asset']), check_existing=True)
        image.pack()
        mat = bpy.data.materials.new(ob.name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        nodes.clear()
        output = nodes.new('ShaderNodeOutputMaterial')
        emission = nodes.new('ShaderNodeEmission')
        texture = nodes.new('ShaderNodeTexImage')
        texture.image = image
        texture.interpolation = 'Closest'
        texture.extension = 'CLIP'
        transparent = nodes.new('ShaderNodeBsdfTransparent')
        mix = nodes.new('ShaderNodeMixShader')
        mix.inputs[0].default_value = 0.55
        links = mat.node_tree.links
        links.new(texture.outputs['Color'], emission.inputs['Color'])
        links.new(transparent.outputs[0], mix.inputs[1])
        links.new(emission.outputs[0], mix.inputs[2])
        links.new(mix.outputs[0], output.inputs['Surface'])
        mesh.materials.append(mat)
        for (key, value) in {'purpose': 'source_mri_display_context', 'clinical_validation': 'pending', 'anatomical_identity': 'unresolved', 'anatomy_surface': False, 'source_label': a.label, 'source_axis': 'ijk'[axis], 'source_index': im['index'], 'image_sha256': im['sha256']}.items():
            ob[key] = value
        planes.append({'name': ob.name, 'axis': axis, 'index': im['index'], 'pixel_grid': im['pixel_grid'], 'image_sha256': im['sha256'], 'world_quad_corners_m': [list(v) for v in corners]})
    scene = bpy.context.scene
    scene['clinical_validation'] = 'pending'
    scene['purpose'] = 'source_dataset_trial'
    scene['source_blend_sha256'] = source_hash
    scene['source_repository_revision'] = d['source_revision']
    scene.unit_settings.system = 'METRIC'
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    point = xyz(r['representative_voxel_ijk'])
    camera_data = bpy.data.cameras.new('Source comparison camera')
    camera = bpy.data.objects.new('Source comparison camera', camera_data)
    scene.collection.objects.link(camera)
    camera.location = point + Vector((0.12, -0.16, 0.11))
    camera.rotation_euler = (point - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera_data.lens = 45
    camera_data.clip_start = 0.0001
    camera_data.clip_end = 10
    scene.camera = camera
    for (name, offset, power) in [('Key', (0.12, -0.15, 0.2), 0.75), ('Fill', (-0.13, -0.08, 0.1), 0.4)]:
        light = bpy.data.lights.new(name, 'AREA')
        light.energy = power
        light.shape = 'DISK'
        light.size = 0.12
        ob = bpy.data.objects.new(name, light)
        scene.collection.objects.link(ob)
        ob.location = point + Vector(offset)
        ob.rotation_euler = (point - ob.location).to_track_quat('-Z', 'Y').to_euler()
    if scene.world is None:
        scene.world = bpy.data.worlds.new('Source comparison world')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.035, 0.05, 0.075, 1)
    scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value = 0.35
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 32
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    if fingerprints() != before:
        raise RuntimeError('source geometry changed')
    verify_unchanged(inputs)
    a.out = claim_output(a.out)
    bpy.ops.wm.save_as_mainfile(filepath=str(a.out / 'fetal-source-mri-context.blend'))
    report = {'purpose': 'source_dataset_trial', 'clinical_validation': 'pending', 'anatomical_identity': 'unresolved', 'source_blend_sha256': source_hash, 'input_artifacts': inputs, 'source_geometry_unchanged': True, 'source_surfaces': before, 'source_coordinate_frame': '+X subject left, -Y anterior, +Z superior; metres; original origin retained', 'selected_source_label': a.label, 'source_voxel_ijk': r['representative_voxel_ijk'], 'source_point_blender_m': list(point), 'planes': planes, 'texture_mapping': 'pixel-cell edges at source indices +/- 0.5; nearest texture sampling; native source-grid orientation', 'view_transparency': 0.55, 'presentation_palette_srgb': palette, 'source_materials_changed_for_display_only': True, 'blender_version': bpy.app.version_string}
    verify_unchanged(inputs)
    report['output_scene'] = fingerprint(a.out / 'fetal-source-mri-context.blend')
    report['source_inputs_unchanged'] = True
    (a.out / 'source-scene-evidence.json').write_text(json.dumps(report, indent=2) + '\n')
    print('SOURCE_MRI_SCENE_READY: nine original surfaces preserved; three native display planes; clinical review pending')
if __name__ == '__main__':
    main()
