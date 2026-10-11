// Bukti engineering tidak boleh berubah menjadi identitas anatomi/validasi klinis.
export function validateFetalParcelEvidence(audit, blender) {
  const blocked = 'blocked_label_identity_unresolved';
  const sha = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
  if (audit.clinical_validation !== 'pending' || blender.clinical_validation !== 'pending'
      || audit.runtime_admission !== blocked || blender.runtime_admission !== blocked) {
    throw new Error('QA-only pending boundary required');
  }
  if (audit.truth_class !== 'population_reference' || audit.license !== 'CC0-1.0'
      || !/^[a-f0-9]{40}$/.test(audit.source_repository_revision)
      || Object.values(audit.source_sha256).length !== 2 || !Object.values(audit.source_sha256).every(sha)) {
    throw new Error('pinned source provenance required');
  }
  if (audit.smoothing_iterations !== 0 || audit.fragments_removed !== 0) throw new Error('unaltered region masks required');
  if (audit.regions.length !== 9 || blender.regions.length !== 9) throw new Error('all nine source regions required');
  const ids = new Set();
  for (const region of audit.regions) {
    if (!Number.isInteger(region.source_label) || region.source_label < 1 || region.source_label > 9
        || region.id !== `parcel_${String(region.source_label).padStart(2, '0')}`
        || ids.has(region.id) || region.anatomical_name !== null) throw new Error('unique anonymous source IDs required');
    ids.add(region.id);
    const counterpart = blender.regions.find((r) => r.id === region.id);
    const overlap = Object.values(region.organ_label_overlap_voxels);
    if (!Number.isInteger(region.voxels) || region.voxels <= 0
        || !overlap.every((n) => Number.isInteger(n) && n >= 0)
        || overlap.reduce((sum, n) => sum + n, 0) !== region.voxels) throw new Error('overlap must account for every source voxel');
    if (!counterpart || counterpart.triangles !== region.triangles || region.nonmanifold_edges !== 0
        || counterpart.nonmanifold_edges !== 0 || counterpart.boundary_edges !== 0
        || !sha(region.stl_sha256) || !Number.isFinite(region.mesh_volume_mm3) || region.mesh_volume_mm3 <= 0
        || !Number.isFinite(counterpart.volume_m3) || counterpart.volume_m3 <= 0
        || Math.abs(counterpart.volume_m3 * 1e9 - region.mesh_volume_mm3) / region.mesh_volume_mm3 > 1e-4) {
      throw new Error('closed surfaces and cross-tool volume agreement required');
    }
  }
  for (const name of ['fetal_parcels_QA.glb', 'fetal_parcels_QA.blend']) {
    const artifact = blender.artifacts[name];
    if (!artifact || !sha(artifact.sha256) || !Number.isInteger(artifact.bytes) || artifact.bytes <= 0) throw new Error('artifact hashes required');
  }
  return { regions: ids.size, triangles: audit.regions.reduce((sum, r) => sum + r.triangles, 0), runtimeAdmission: blocked };
}
