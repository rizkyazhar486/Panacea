"""Non-destructive Cycles quality profiles over the existing anatomical benchmarks.

Blender -b MASTER.blend -P render_cinematic.py -- --out OUTPUT --compare
Uses existing materials, cameras, visibility and anatomical metadata. Never saves master.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import runpy
import sys
import time
import traceback
import types

import bpy
from mathutils import Vector

PROFILES = {
    'preview': (960, 540, 32, 0.10),
    'desktop': (1920, 1080, 128, 0.03),
    'cinematic': (7680, 4320, 512, 0.01),
}


def studio_lights(scene, meshes, keep_world=False):
    """Camera-relative area lights scaled to the source body's world-space bounds."""
    bpy.context.view_layer.update()
    points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    if not points:
        raise RuntimeError('Studio lighting requires visible anatomical meshes')
    low = Vector(tuple(min(p[axis] for p in points) for axis in range(3)))
    high = Vector(tuple(max(p[axis] for p in points) for axis in range(3)))
    centre = (low + high) / 2
    stature = high.z - low.z
    if stature <= 0:
        raise RuntimeError('Anatomical bounds have zero stature')
    rotation = scene.camera.matrix_world.to_quaternion()
    right, up, front = (rotation @ Vector(axis) for axis in ((1, 0, 0), (0, 1, 0), (0, 0, 1)))
    lights = []
    for name, offset, watts, size in (
        ('key', (-0.9, 0.65, 1.3), 180, 0.65),
        ('fill', (1.1, 0.15, 1.0), 45, 0.9),
        ('rim', (0.7, 0.6, -1.0), 120, 0.45),
    ):
        data = bpy.data.lights.new(f'PAN.CINEMATIC.{name}', 'AREA')
        data.energy = watts * stature ** 2
        data.shape = 'DISK'
        data.size = size * stature
        light = bpy.data.objects.new(data.name, data)
        scene.collection.objects.link(light)
        light.location = centre + stature * (offset[0] * right + offset[1] * up + offset[2] * front)
        light.rotation_euler = (centre - light.location).to_track_quat('-Z', 'Y').to_euler()
        lights.append(light)
    if not keep_world:
        world = bpy.data.worlds.new('PAN.CINEMATIC.neutral')
        world.use_nodes = True
        background = world.node_tree.nodes.get('Background')
        background.inputs['Color'].default_value = (0.015, 0.015, 0.015, 1)
        background.inputs['Strength'].default_value = 0.15
        scene.world = world
    return lights


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--profile', choices=PROFILES, default='preview')
    parser.add_argument('--bench', choices=('layered', 'thorax', 'female_layered', 'lineup', 'cutaway', 'exploded', 'body-qa'), default='layered')
    parser.add_argument('--out', required=True)
    parser.add_argument('--device', choices=('CPU', 'METAL', 'CUDA', 'OPTIX', 'HIP', 'ONEAPI'), default='CPU')
    parser.add_argument('--scale', type=int, default=100)
    parser.add_argument('--samples', type=int)
    parser.add_argument('--time-limit', type=float, default=0, help='Cycles seconds per frame; 0 disables')
    parser.add_argument('--compare', action='store_true')
    parser.add_argument('--compare-mode', choices=('quality', 'lighting'), default='quality')
    parser.add_argument('--lighting', choices=('original', 'studio'), default='original')
    parser.add_argument('--exposure', type=float, help='AgX exposure; studio defaults to -1.5 EV')
    parser.add_argument('--hdri', type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    if not 1 <= args.scale <= 100 or (args.samples is not None and args.samples < 1) or not math.isfinite(args.time_limit) or args.time_limit < 0:
        parser.error('scale must be 1..100; samples must be positive; time limit must be nonnegative')
    if args.hdri and not args.hdri.is_file():
        parser.error('HDR environment file does not exist')
    if args.exposure is not None and not math.isfinite(args.exposure):
        parser.error('exposure must be finite')
    if args.compare_mode == 'lighting' and (not args.compare or args.lighting != 'studio'):
        parser.error('lighting comparison requires --compare --lighting studio')
    output = Path(args.out).resolve()
    output.mkdir(parents=True, exist_ok=True)
    original_render = bpy.ops.render.render
    records = []

    def render(**kwargs):
        scene = bpy.context.scene
        scene.render.engine = 'CYCLES'
        # Device selection is explicit; do not silently claim GPU acceleration.
        scene.cycles.device = 'CPU'
        devices = []
        if args.device != 'CPU':
            prefs = bpy.context.preferences.addons['cycles'].preferences
            prefs.compute_device_type = args.device
            prefs.refresh_devices()
            for device in prefs.devices:
                device.use = device.type == args.device
                if device.use:
                    devices.append(device.name)
            if not devices:
                raise RuntimeError(f'No available {args.device} device; select --device CPU')
            scene.cycles.device = 'GPU'
        width, height, samples, threshold = PROFILES[args.profile]
        scene.render.resolution_x = width
        scene.render.resolution_y = height
        scene.render.resolution_percentage = args.scale
        if args.bench == 'body-qa' and scene.camera.data.type == 'ORTHO':
            # Body QA stages portrait cameras; preserve full stature in widescreen.
            scene.camera.data.ortho_scale *= max(1, width / height)
        scene.render.image_settings.file_format = 'PNG'
        scene.render.image_settings.color_depth = '16'
        scene.cycles.samples = args.samples or samples
        scene.cycles.time_limit = args.time_limit
        scene.cycles.seed = 0
        scene.cycles.use_animated_seed = False
        instances = []
        if args.bench != 'body-qa':
            # Newer masters include a display lineup as collection instances.
            # Legacy benchmarks stage the direct male/female meshes only; their
            # mesh visibility loop cannot suppress geometry inside instances.
            for obj in scene.objects:
                if obj.instance_type == 'COLLECTION' and obj.instance_collection:
                    obj.hide_render = True
                    instances.append(obj.name)
        if args.hdri:
            world = scene.world.copy() if scene.world else bpy.data.worlds.new('Cinematic environment')
            scene.world = world
            world.use_nodes = True
            environment = world.node_tree.nodes.new('ShaderNodeTexEnvironment')
            environment.image = bpy.data.images.load(str(args.hdri.resolve()), check_existing=True)
            background = next(n for n in world.node_tree.nodes if n.type == 'BACKGROUND')
            world.node_tree.links.new(environment.outputs['Color'], background.inputs['Color'])
        visible = [o for o in scene.objects if o.type == 'MESH' and not o.hide_render]
        audit = {
            'visible_meshes': len(visible),
            'source_polygons': sum(len(o.data.polygons) for o in visible),
            'meshes_without_uv': sum(not bool(o.data.uv_layers) for o in visible),
            'meshes_without_material': sum(not any(slot.material for slot in o.material_slots) for o in visible),
            'review_status_counts': {},
            'suppressed_display_instances': instances,
        }
        for obj in visible:
            status = str(obj.get('panacea_review_status', 'unspecified'))
            audit['review_status_counts'][status] = audit['review_status_counts'].get(status, 0) + 1
        original_world = scene.world
        original_exposure = scene.view_settings.exposure
        original_lights = [(o, o.hide_render) for o in scene.objects if o.type == 'LIGHT']
        for variant in (('before', 'after') if args.compare else ('after',)):
            quality = variant == 'after' or args.compare_mode == 'lighting'
            scene.cycles.use_adaptive_sampling = quality
            scene.cycles.adaptive_threshold = threshold
            scene.cycles.use_denoising = quality
            scene.view_settings.view_transform = 'AgX'
            use_studio = args.lighting == 'studio' and (variant == 'after' or args.compare_mode == 'quality')
            lights = []
            if use_studio:
                for light, _ in original_lights:
                    light.hide_render = True
                lights = studio_lights(scene, visible, keep_world=bool(args.hdri))
            exposure_override = args.exposure if use_studio or args.compare_mode != 'lighting' else None
            scene.view_settings.exposure = (exposure_override if exposure_override is not None else
                                           (-1.5 if use_studio else original_exposure))
            applied_exposure = scene.view_settings.exposure
            view = f'_{scene.camera.name}' if args.bench == 'body-qa' else ''
            path = output / f'{args.bench}{view}_{args.profile}_{variant}.png'
            scene.render.filepath = str(path)
            started = time.perf_counter()
            try:
                render_result = original_render(write_still=True)
            finally:
                for light in lights:
                    light.hide_render = True
                for light, hidden in original_lights:
                    light.hide_render = hidden
                scene.world = original_world
                scene.view_settings.exposure = original_exposure
            if render_result != {'FINISHED'}:
                raise RuntimeError(f'Render did not finish: {render_result}')
            restored = (scene.world == original_world and
                        scene.view_settings.exposure == original_exposure and
                        all(light.hide_render == hidden for light, hidden in original_lights) and
                        all(light.hide_render for light in lights))
            if not restored:
                raise RuntimeError('Temporary lighting state failed to restore')
            records.append({
                'variant': variant, 'path': path.name,
                'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                'render_seconds': round(time.perf_counter() - started, 3),
                'resolution': [width * args.scale // 100, height * args.scale // 100],
                'sample_limit': scene.cycles.samples,
                'time_limit_seconds': scene.cycles.time_limit,
                'adaptive_sampling': scene.cycles.use_adaptive_sampling,
                'denoising': scene.cycles.use_denoising,
                'lighting': 'studio' if use_studio else 'original',
                'exposure_ev': applied_exposure,
                'lighting_state_restored': restored,
                'studio_lights': [{'name': light.name, 'energy_watts': light.data.energy,
                                  'diameter_metres': light.data.size,
                                  'location_metres': list(light.location)} for light in lights],
            })
        report = {
            'source_blend': bpy.data.filepath, 'blender_version': bpy.app.version_string,
            'profile': args.profile, 'benchmark': args.bench,
            'compare_mode': args.compare_mode if args.compare else None,
            'device_backend': args.device, 'devices': devices,
            'hdri': str(args.hdri.resolve()) if args.hdri else None,
            'audit': audit, 'renders': records,
            'limitations': ['UV absence is informational for procedural materials.',
                             'No anatomical validation, deformation, browser FPS or memory measurement performed.',
                             'Quality comparison isolates sampling/denoising; lighting comparison holds those fixed.',
                             'Timings include scene synchronization and sequential cache effects.'],
        }
        (output / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
        return {'FINISHED'}

    # Reuse benchmark staging without editing Claude-owned scripts or copying anatomy logic.
    previous_argv = sys.argv[:]
    # bpy.ops dynamically resolves operators: assigning an operator attribute does
    # not reliably intercept calls. Scope a module facade to the staging script.
    facade = types.ModuleType('bpy')
    facade.__getattr__ = lambda name: getattr(bpy, name)
    facade.ops = types.SimpleNamespace(render=types.SimpleNamespace(render=render))
    previous_bpy = sys.modules['bpy']
    sys.modules['bpy'] = facade
    try:
        if args.bench == 'body-qa':
            sys.argv = [__file__, '--', '--out', str(output / 'body.png')]
            script = 'render_body_file.py'
        else:
            sys.argv = [__file__, '--', '--bench', args.bench, '--out', str(output)]
            script = 'render_benchmarks.py'
        runpy.run_path(str(Path(__file__).with_name(script)), run_name='__main__')
    finally:
        sys.modules['bpy'] = previous_bpy
        sys.argv = previous_argv


if __name__ == '__main__':
    try:
        main()
    except Exception:
        traceback.print_exc()
        sys.exit(1)
