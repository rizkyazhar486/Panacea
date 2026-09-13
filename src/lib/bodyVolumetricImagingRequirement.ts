export type VolumetricImagingCapabilityStatus = 'present' | 'required' | 'blocked';

export interface VolumetricImagingCapability {
  id: string;
  label: string;
  status: VolumetricImagingCapabilityStatus;
  acceptance: string;
}

/**
 * Mandatory Body Exposure target inspired by public CT/MRI-to-3D research
 * demonstrations, including KaloLumen. This is a Panacea product requirement,
 * not a claim that those external systems are bundled, licensed or reproduced.
 *
 * The current Body Exposure surface already teaches HU windowing and the
 * distinction between surface and volume rendering. Everything marked
 * `required` or `blocked` below must stay visibly unfinished until Panacea has
 * a real implementation and a deterministic/runtime acceptance gate for it.
 */
export const BODY_EXPOSURE_VOLUMETRIC_IMAGING_REQUIREMENT = {
  id: 'volumetric-imaging-digital-twin',
  label: 'Volumetric Imaging & Digital Twin Lab',
  surfaceKey: 'pencitraan-volumetrik',
  surfaceLabel: 'DICOM → 3D',
  required: true,
  modalities: ['CT', 'MRI'] as const,
  regionBenchmarks: [
    'head-and-neck / temporal-bone spatial relationships',
    'brain MRI with intracranial vessel course',
    'thorax / heart / great-vessel relationships',
    'abdomen-pelvis multi-organ relationships',
  ] as const,
  capabilities: [
    {
      id: 'reachable-body-exposure-surface',
      label: 'Reachable Body Exposure DICOM → 3D surface',
      status: 'present',
      acceptance: 'Body Explorer must expose the pencitraan-volumetrik tab and render PencitraanVolumetrikPanel.',
    },
    {
      id: 'ct-hu-window-education',
      label: 'CT Hounsfield threshold/window education',
      status: 'present',
      acceptance: 'Lower/upper HU controls must remain quantitative and must not be presented as a patient scan.',
    },
    {
      id: 'dicom-series-ingestion',
      label: 'Real local DICOM series ingestion',
      status: 'required',
      acceptance: 'Decode ordered slices plus spacing/orientation metadata; reject inconsistent series rather than guessing geometry.',
    },
    {
      id: 'linked-mpr',
      label: 'Linked axial · coronal · sagittal MPR',
      status: 'required',
      acceptance: 'Three orthogonal views share one world-space crosshair and stay synchronized with the 3D section plane.',
    },
    {
      id: 'ct-surface-rendering',
      label: 'CT surface reconstruction',
      status: 'required',
      acceptance: 'Thresholded surfaces must derive from the loaded voxel volume; synthetic patient anatomy is forbidden.',
    },
    {
      id: 'volume-rendering',
      label: 'Direct volume rendering',
      status: 'required',
      acceptance: 'Volume rendering and surface rendering can be compared from the same source volume and transfer-function state.',
    },
    {
      id: 'mri-relative-intensity',
      label: 'MRI series-aware rendering',
      status: 'required',
      acceptance: 'MRI uses series-relative intensity/sequence metadata; MRI intensity must never be mislabeled as Hounsfield units.',
    },
    {
      id: 'three-layer-composition',
      label: 'At least three simultaneous or switchable surface layers',
      status: 'required',
      acceptance: 'Layer opacity/visibility remains independently controllable without silently deleting source voxels.',
    },
    {
      id: 'tissue-layer-presets',
      label: 'Bone · vasculature · soft-tissue / organ layer presets',
      status: 'required',
      acceptance: 'Presets are editable visualization starting points, not automatic diagnostic segmentation labels.',
    },
    {
      id: 'vessel-course-visibility',
      label: 'Vessel-course visualization in 3D and cross-section',
      status: 'required',
      acceptance: 'A vessel surface/volume must remain spatially registered to the source slices and section plane.',
    },
    {
      id: 'section-plane-linkage',
      label: 'Interactive clipping / section plane linked to source slices',
      status: 'required',
      acceptance: 'Moving a 3D section plane updates the corresponding source-space slice position and vice versa.',
    },
    {
      id: 'performance-benchmark',
      label: 'Measured reconstruction and interaction performance',
      status: 'required',
      acceptance: 'Record reconstruction latency, VRAM/RAM use and interaction frame time by device class; no sub-minute or hardware claim is allowed without Panacea measurements.',
    },
    {
      id: 'spatial-display-output',
      label: 'Optional side-by-side stereoscopic / spatial-display output',
      status: 'blocked',
      acceptance: 'Enable only after a measured renderer path exists; ordinary 2D WebGL remains the baseline and no hardware support is fabricated.',
    },
  ] satisfies readonly VolumetricImagingCapability[],
  hardBoundaries: [
    'educational and research use only until a separate clinical validation programme exists',
    'no diagnosis, treatment planning or patient-specific clinical inference from this module',
    'no external proprietary code, images, DICOM studies, models or textures are copied without verified permission',
    'no claim of sub-minute reconstruction, diagnostic accuracy or hardware performance without Panacea measurements',
    'patient anatomy may only come from an explicitly loaded source volume; missing anatomy must never be synthesized',
  ] as const,
} as const;

export function unfinishedVolumetricImagingCapabilities() {
  return BODY_EXPOSURE_VOLUMETRIC_IMAGING_REQUIREMENT.capabilities.filter((item) => item.status !== 'present');
}
