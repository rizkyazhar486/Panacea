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

PROFILES = {
    'preview': (960, 540, 32, 0.10),
    'desktop': (1920, 1080, 128, 0.03),
    'cinematic': (7680, 4320, 512, 0.01),
}


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
    parser.add_argument('--hdri', type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    if not 1 <= args.scale <= 100 or (args.samples is not None and args.samples < 1) or not math.isfinite(args.time_limit) or args.time_limit < 0:
        parser.error('scale must be 1..100; samples must be positive; time limit must be nonnegative')
    if args.hdri and not args.hdri.is_file():
        parser.error('HDR environment file does not exist')
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
        for variant in (('before', 'after') if args.compare else ('after',)):
            scene.cycles.use_adaptive_sampling = variant == 'after'
            scene.cycles.adaptive_threshold = threshold
            scene.cycles.use_denoising = variant == 'after'
            scene.view_settings.view_transform = 'AgX'
            view = f'_{scene.camera.name}' if args.bench == 'body-qa' else ''
            path = output / f'{args.bench}{view}_{args.profile}_{variant}.png'
            scene.render.filepath = str(path)
            started = time.perf_counter()
            original_render(write_still=True)
            records.append({
                'variant': variant, 'path': path.name,
                'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                'render_seconds': round(time.perf_counter() - started, 3),
                'resolution': [width * args.scale // 100, height * args.scale // 100],
                'sample_limit': scene.cycles.samples,
                'time_limit_seconds': scene.cycles.time_limit,
                'adaptive_sampling': scene.cycles.use_adaptive_sampling,
                'denoising': scene.cycles.use_denoising,
            })
        report = {
            'source_blend': bpy.data.filepath, 'blender_version': bpy.app.version_string,
            'profile': args.profile, 'benchmark': args.bench,
            'device_backend': args.device, 'devices': devices,
            'hdri': str(args.hdri.resolve()) if args.hdri else None,
            'audit': audit, 'renders': records,
            'limitations': ['UV absence is informational for procedural materials.',
                             'No anatomical validation, deformation, browser FPS or memory measurement performed.',
                             'Before/after isolates adaptive sampling and denoising at identical sample limits.'],
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
