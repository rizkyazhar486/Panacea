"""File ownership and measured provenance for offline anatomical captures."""
import hashlib
from pathlib import Path
import sys


def fingerprint(path):
    path = Path(path).resolve(strict=True)
    before = path.stat()
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(block)
    after = path.stat()
    if (before.st_size, before.st_mtime_ns, before.st_ino) != (after.st_size, after.st_mtime_ns, after.st_ino):
        raise RuntimeError(f'Input changed while hashing: {path.name}')
    return {'path': str(path), 'bytes': after.st_size, 'sha256': digest.hexdigest()}


def verify_unchanged(artifacts):
    for artifact in artifacts:
        if fingerprint(artifact['path']) != artifact:
            raise RuntimeError(f'Input changed during render: {Path(artifact["path"]).name}')


def claim_output(path):
    """An atomic directory claim prevents overwriting previous or concurrent runs."""
    path = Path(path).resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.mkdir(exist_ok=False)
    return path


def validate_body_selection(rows, body_id):
    """Keep an isolated copy within the source body's existing mesh identities."""
    if not rows or any(row['type'] != 'MESH' or row['body_id'] != body_id for row in rows):
        raise ValueError('Selection must contain only meshes from the requested body')
    ids = [row['structure_id'] for row in rows]
    if any(not isinstance(sid, str) or not sid.strip() for sid in ids) or len(set(ids)) != len(ids):
        raise ValueError('Source meshes require unique existing structure identities')
    return ids


def process_memory():
    """OS process high-water RSS; neither GPU allocation nor per-frame memory."""
    try:
        import resource
    except ImportError:
        return {'peak_rss_bytes': None, 'scope': 'unavailable', 'gpu_memory_bytes': None}
    if sys.platform not in ('darwin', 'linux'):
        return {'peak_rss_bytes': None, 'scope': 'unsupported_platform', 'gpu_memory_bytes': None}
    rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    return {'peak_rss_bytes': int(rss if sys.platform == 'darwin' else rss * 1024),
            'scope': 'process_lifetime_high_water_rss', 'gpu_memory_bytes': None}
