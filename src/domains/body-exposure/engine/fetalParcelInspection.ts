export interface FetalParcelRegion {
  id: string
  source_label: number
  anatomical_name: null
  voxels: number
  components: number
  triangles: number
  voxel_volume_mm3: number
  surface_volume_mm3: number
  mesh_volume_relative_error: number
  organ_label_overlap_voxels: Record<string, number>
  boundary_edges: number
  nonmanifold_edges: number
}

export interface FetalParcelDataset {
  purpose: 'dataset_inspection'
  clinical_validation: 'pending'
  runtime_admission: 'blocked_label_identity_unresolved'
  anatomical_identity: 'unresolved'
  source: string
  source_revision: string
  license: string
  source_sha256: Record<string, string>
  source_glb_sha256: string
  packed_glb_sha256: string
  asset: 'regions.glb'
  coordinate_frame: string
  default_labels: number[]
  default_triangles: number
  all_triangles: number
  regions: FetalParcelRegion[]
}

export const FETAL_PARCEL_COLORS = ['#e66b65', '#efb34f', '#68b9e8', '#718ae2', '#9c77ce', '#65c7ad', '#cc85a7', '#b9c568', '#c69d7a'] as const

// The inspector cannot promote a QA package to clinical/named anatomy.
export function parseFetalParcelDataset(value: unknown): FetalParcelDataset {
  const data = value as FetalParcelDataset
  if (!data || data.purpose !== 'dataset_inspection' || data.clinical_validation !== 'pending'
      || data.runtime_admission !== 'blocked_label_identity_unresolved' || data.anatomical_identity !== 'unresolved'
      || data.asset !== 'regions.glb' || !/^[a-f0-9]{64}$/.test(data.packed_glb_sha256 ?? '')
      || !Array.isArray(data.regions) || data.regions.length !== 9) throw new Error('Incomplete anonymous dataset package')
  // This inspector is bound to one audited source package, not an arbitrary atlas.
  if (data.source !== 'https://gin.g-node.org/kcl_cdb/fetal_body_mri_atlas'
      || data.source_revision !== '74f11a186c709078d712bb2fd827bfa2b36e3407'
      || data.license !== 'CC0-1.0'
      || data.coordinate_frame !== '+X subject left, +Y superior, +Z anterior; metres; source origin retained'
      || data.source_sha256?.['reo-fetal-t2w-body-atlas-mask-lungs_multi-10.nii.gz'] !== '5d81b6f91bcc2a6d6e64dfcd97a3099cfdc30cd9826f29d297b3c6983aceee54'
      || data.source_sha256?.['reo-fetal-t2w-body-atlas-mask-body_organs-10.nii.gz'] !== '4b7bade32fac95a80c622f535c05f6a6f8eab8f1e32ba093cc742b1a5dc6c8b7'
      || data.source_glb_sha256 !== '63505eedb8867bbd0a6f7abf646edbffc19357eaf5e622871b21604a8b62bb13') {
    throw new Error('Dataset source provenance differs')
  }
  const labels = new Set<number>()
  for (const region of data.regions) {
    if (!Number.isInteger(region.source_label) || region.source_label < 1 || region.source_label > 9
        || labels.has(region.source_label) || region.id !== `parcel_${String(region.source_label).padStart(2, '0')}`
        || region.anatomical_name !== null || !Number.isInteger(region.voxels) || region.voxels <= 0
        || !Number.isInteger(region.triangles) || region.triangles <= 0 || !Number.isInteger(region.components) || region.components < 1
        || !Number.isFinite(region.surface_volume_mm3) || !(region.surface_volume_mm3 > 0)
        || !Number.isFinite(region.voxel_volume_mm3) || !(region.voxel_volume_mm3 > 0)
        || !Number.isFinite(region.mesh_volume_relative_error) || region.mesh_volume_relative_error < 0
        || region.boundary_edges !== 0 || region.nonmanifold_edges !== 0
        || !region.organ_label_overlap_voxels
        || Object.values(region.organ_label_overlap_voxels).some(n => !Number.isInteger(n) || n < 0)
        || Object.values(region.organ_label_overlap_voxels).reduce((s, n) => s + n, 0) !== region.voxels) {
      throw new Error('Region source accounting or identity differs')
    }
    labels.add(region.source_label)
  }
  const defaults = data.default_labels
  if (!Array.isArray(defaults) || defaults.join(',') !== '1,2,3,4,5'
      || data.default_triangles !== visibleParcelTriangles(data.regions, defaults)
      || data.default_triangles > 80000 || data.all_triangles !== visibleParcelTriangles(data.regions, [...labels])) {
    throw new Error('Dataset display budget differs')
  }
  return data
}

export function visibleParcelTriangles(regions: FetalParcelRegion[], visible: number[]): number {
  const labels = new Set(visible)
  return regions.reduce((total, region) => total + (labels.has(region.source_label) ? region.triangles : 0), 0)
}

// This is correspondence with the older source mask, never an identity claim.
export function wholeLungOverlap(region: FetalParcelRegion): number {
  return (region.organ_label_overlap_voxels['1'] ?? 0) / region.voxels
}
