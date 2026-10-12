import type { FetalParcelDataset } from './fetalParcelInspection'

export type FetalMriImage = { asset: string; axis: number; index: number; width: number; height: number; bytes: number; sha256: string; pixel_grid: { column_axis: number; row_axis: number; row_direction: number } }
export type FetalMriRegion = { source_label: number; voxels: number; representative_voxel_ijk: number[]; point_ras_mm: number[]; images: FetalMriImage[] }
export type FetalMriContext = { purpose: string; clinical_validation: string; anatomical_identity: string; source: string; source_revision: string; license: string; source_sha256: { t2: string; regions: string }; segmentation_manifest_sha256: string; shape: number[]; affine_ras_mm: number[][]; mask_affine_ras_mm: number[][]; crop_ijk_min: number[]; crop_ijk_max_exclusive: number[]; display_intensity_percentiles: number[]; display_intensity_window: number[]; sampling: string; overlay_alpha_selected: number; overlay_alpha_other_labels: number; regions: FetalMriRegion[] }
const requireContext = (ok: boolean): void => { if (!ok) throw new Error('MRI context differs from the pinned numeric source dataset') }
const triple = (value: unknown): value is number[] => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)
const sha = (value: unknown): boolean => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)

export function parseFetalMriContext(value: unknown, dataset: FetalParcelDataset): FetalMriContext {
  requireContext(typeof value === 'object' && value !== null)
  const d = value as FetalMriContext
  requireContext(d.purpose === 'source_mri_display_context' && d.clinical_validation === 'pending' && d.anatomical_identity === 'unresolved')
  requireContext(d.source === dataset.source && d.source_revision === dataset.source_revision && d.license === dataset.license)
  requireContext(d.source_sha256?.t2 === '75e234afd07b8dc8279b94f9d3ee2469cadaa4dec5e0df1ba6a1da96bcb92dcb' && d.source_sha256?.regions === '5d81b6f91bcc2a6d6e64dfcd97a3099cfdc30cd9826f29d297b3c6983aceee54' && sha(d.segmentation_manifest_sha256))
  requireContext(Array.isArray(d.shape) && d.shape.join(',') === '245,275,304' && triple(d.crop_ijk_min) && triple(d.crop_ijk_max_exclusive))
  requireContext(d.crop_ijk_min.every((n, i) => Number.isInteger(n) && n >= 0 && Number.isInteger(d.crop_ijk_max_exclusive[i]) && n < d.crop_ijk_max_exclusive[i] && d.crop_ijk_max_exclusive[i] <= d.shape[i]))
  requireContext(Array.isArray(d.affine_ras_mm) && d.affine_ras_mm.length === 4 && d.affine_ras_mm.every(row => Array.isArray(row) && row.length === 4 && row.every(Number.isFinite)) && d.affine_ras_mm[3].join(',') === '0,0,0,1')
  requireContext(Array.isArray(d.mask_affine_ras_mm) && d.mask_affine_ras_mm.length === 4 && d.mask_affine_ras_mm.every((row,i) => Array.isArray(row) && row.length === 4 && row.every((n,j) => Number.isFinite(n) && Math.abs(n-d.affine_ras_mm[i][j]) <= 1e-6)))
  requireContext(Array.isArray(d.display_intensity_window) && d.display_intensity_window.length === 2 && d.display_intensity_window.every(Number.isFinite) && d.display_intensity_window[0] < d.display_intensity_window[1] && d.display_intensity_percentiles?.join(',') === '1,99')
  requireContext(d.sampling === 'native source-grid slices; no resampling; 8-bit display window only' && d.overlay_alpha_selected === 0.55 && d.overlay_alpha_other_labels === 0.18)
  requireContext(Array.isArray(d.regions) && d.regions.length === 9 && new Set(d.regions.map(r => r.source_label)).size === 9)
  const names = new Set<string>()
  for (const region of d.regions) {
    const original = dataset.regions.find(r => r.source_label === region.source_label)
    requireContext(!!original && original.voxels === region.voxels && triple(region.point_ras_mm) && triple(region.representative_voxel_ijk))
    requireContext(region.representative_voxel_ijk.every((n, i) => Number.isInteger(n) && n >= d.crop_ijk_min[i] && n < d.crop_ijk_max_exclusive[i]))
    requireContext(d.affine_ras_mm.slice(0,3).every((row,i) => Math.abs(row[3]+row.slice(0,3).reduce((sum,n,j) => sum+n*region.representative_voxel_ijk[j],0)-region.point_ras_mm[i]) <= 1e-9))
    requireContext(Array.isArray(region.images) && region.images.length === 3 && new Set(region.images.map(im => im.axis)).size === 3)
    for (const image of region.images) {
      requireContext(Number.isInteger(image.axis) && image.axis >= 0 && image.axis < 3)
      const axes = [0,1,2].filter(i => i !== image.axis)
      const expected = `region-${String(region.source_label).padStart(2, '0')}-${'ijk'[image.axis]}.png`
      requireContext(image.asset === expected && !names.has(expected) && image.index === region.representative_voxel_ijk[image.axis] && sha(image.sha256) && Number.isInteger(image.bytes) && image.bytes > 0 && image.bytes <= 100_000)
      requireContext(image.width === d.crop_ijk_max_exclusive[axes[0]]-d.crop_ijk_min[axes[0]] && image.height === d.crop_ijk_max_exclusive[axes[1]]-d.crop_ijk_min[axes[1]])
      requireContext(image.pixel_grid?.column_axis === axes[0] && image.pixel_grid?.row_axis === axes[1] && image.pixel_grid?.row_direction === -1)
      names.add(expected)
    }
  }
  return d
}
