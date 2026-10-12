"""Capture an existing MRI comparison scene without saving or changing its source."""
import argparse
import json
from pathlib import Path
import sys
import time

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from render_artifacts import claim_output, fingerprint, process_memory, verify_unchanged
from render_cinematic import PROFILES


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--profile', choices=PROFILES, default='preview')
    parser.add_argument('--device', choices=['METAL', 'OPTIX', 'CUDA', 'HIP', 'ONEAPI', 'CPU'], default='METAL')
    args = parser.parse_args(sys.argv[sys.argv.index('--')+1:])
    if args.out.exists():
        raise ValueError('fresh render output required; previous captures are preserved')
    scene = bpy.context.scene
    if scene.get('purpose') != 'source_dataset_trial' or scene.get('clinical_validation') != 'pending':
        raise ValueError('pending source comparison scene required')
    if not scene.camera or len([ob for ob in scene.objects if ob.get('purpose') == 'source_mri_display_context']) != 3:
        raise ValueError('source comparison camera and three MRI display planes required')
    inputs = [fingerprint(bpy.data.filepath), fingerprint(__file__),
              fingerprint(Path(__file__).with_name('render_artifacts.py')),
              fingerprint(Path(__file__).with_name('render_cinematic.py'))]
    devices = []
    if args.device == 'CPU':
        scene.cycles.device = 'CPU'
    else:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        try:
            prefs.compute_device_type = args.device
        except (TypeError, ValueError) as error:
            raise RuntimeError(f'{args.device} backend unavailable in this Blender build; no CPU substitution') from error
        prefs.get_devices()
        for device in prefs.devices:
            device.use = device.type == args.device
            if device.use:
                devices.append({'name': device.name, 'type': device.type})
        if not devices:
            raise RuntimeError(f'{args.device} GPU unavailable; choose an available backend explicitly')
        scene.cycles.device = 'GPU'
    width, height, samples, threshold = PROFILES[args.profile]
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = samples
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = threshold
    scene.cycles.time_limit = 0
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = width, height
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGB'
    scene.render.image_settings.color_depth = '16'
    scene.render.film_transparent = False
    out = claim_output(args.out)
    image = out / f'native-mri-context-{args.profile}.png'
    scene.render.filepath = str(image)
    start = time.perf_counter()
    bpy.ops.render.render(write_still=True)
    elapsed = time.perf_counter() - start
    verify_unchanged(inputs)
    evidence = {'purpose': 'source_dataset_trial', 'clinical_validation': 'pending',
                'anatomical_identity': 'unresolved', 'profile': args.profile,
                'device_backend': args.device, 'cycles_device': scene.cycles.device, 'devices': devices,
                'sample_ceiling': samples, 'adaptive_threshold': threshold, 'sampling_time_limit_seconds': 0,
                'resolution': [width, height], 'color_depth': '16', 'elapsed_seconds': elapsed,
                'input_artifacts': inputs, 'source_inputs_unchanged': True,
                'image': fingerprint(image), 'process_memory': process_memory(),
                'blender_version': bpy.app.version_string}
    (out / 'render-evidence.json').write_text(json.dumps(evidence, indent=2)+'\n')
    print(f'SOURCE_MRI_CAPTURE_FINISHED: {args.device}, {width}x{height}, {elapsed:.3f} seconds')


if __name__ == '__main__':
    main()
