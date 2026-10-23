"""Pinned native MRI pixel cells in the original fetal QA Blender frame."""
import hashlib
import json
from pathlib import Path

SOURCE_BLEND_SHA = 'f3baa221c9fa8c528f730a67c0993886f86fb215644b95c29a0b2e1f9da2e0da'
MRI_MANIFEST_SHA = '199fef2cc70c489a928b6ad44a1eb9c6b2ebf76c9a30e22a4bdd86997038bf07'


def load_package(package, label):
    """Only the published source registration is accepted; no guessed labels."""
    if type(label) is not int or label not in range(1, 10):
        raise ValueError('numeric source label 1–9 required')
    package = Path(package).resolve(strict=True)
    data = (package / 'manifest.json').read_bytes()
    if hashlib.sha256(data).hexdigest() != MRI_MANIFEST_SHA:
        raise ValueError('pinned native MRI manifest differs')
    manifest = json.loads(data)
    if manifest['clinical_validation'] != 'pending' or manifest['anatomical_identity'] != 'unresolved':
        raise ValueError('pending source review required')
    region = next(row for row in manifest['regions'] if row['source_label'] == label)
    for image in region['images']:
        data = (package / image['asset']).read_bytes()
        if len(data) != image['bytes'] or hashlib.sha256(data).hexdigest() != image['sha256']:
            raise ValueError('pinned source image differs')
    return manifest, region


def source_point_m(manifest, ijk):
    """RAS mm -> source QA Blender metres: [-R, -A, S], origin retained."""
    affine = manifest['affine_ras_mm']
    ras = [sum(affine[i][j] * ijk[j] for j in range(3)) + affine[i][3] for i in range(3)]
    return [-ras[0] / 1000, -ras[1] / 1000, ras[2] / 1000]


def plane_corners_m(manifest, region, axis):
    """Four native pixel-cell edges; UV +U/+V follows increasing indices."""
    if type(axis) is not int or axis not in range(3):
        raise ValueError('source axis 0–2 required')
    column, row = [n for n in range(3) if n != axis]
    low, high = manifest['crop_ijk_min'], manifest['crop_ijk_max_exclusive']
    corners = []
    for c, r in [(low[column]-.5, low[row]-.5), (high[column]-.5, low[row]-.5),
                 (high[column]-.5, high[row]-.5), (low[column]-.5, high[row]-.5)]:
        point = list(region['representative_voxel_ijk'])
        point[column], point[row] = c, r
        corners.append(source_point_m(manifest, point))
    return corners
