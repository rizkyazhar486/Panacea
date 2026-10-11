"""Measured order for the partial organ-only fetal atlas; not clinical validation."""
import math

REQUIRED = ('liver', 'bladder', 'kidney.L', 'kidney.R', 'lung.L', 'lung.R', 'thymus')

def audit_order(centroids_z):
    missing = [key for key in REQUIRED if key not in centroids_z or centroids_z[key] is None]
    invalid = [key for key in REQUIRED if key not in missing and not math.isfinite(centroids_z[key])]
    pairs = [('lung.L', 'liver'), ('lung.R', 'liver'), ('thymus', 'liver'),
             ('liver', 'kidney.L'), ('liver', 'kidney.R'),
             ('liver', 'bladder'), ('kidney.L', 'bladder'), ('kidney.R', 'bladder')]
    violations = [(a, b) for a, b in pairs if a not in missing + invalid and b not in missing + invalid
                  and centroids_z[a] <= centroids_z[b]]
    return not (missing or invalid or violations), {
        'scope': 'partial fetal source atlas', 'not_represented': ['brain', 'heart', 'skeleton'],
        'centroids_z_m': centroids_z, 'missing_required_organs': missing,
        'invalid_centroids': invalid, 'order_violations': violations,
        'clinical_validation': 'pending'}
