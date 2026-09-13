import { BODY_EXPOSURE_ALPHA_GENOME_REQUIREMENT } from './alphaGenomeAtlas';
import { BODY_EXPOSURE_VOLUMETRIC_IMAGING_REQUIREMENT } from './bodyVolumetricImagingRequirement';

export interface BodyExposureMandatoryModule {
  id: string;
  label: string;
  required: boolean;
  domain: 'anatomy' | 'physiology' | 'genomics' | 'molecular' | 'clinical-education' | 'imaging';
  minimumContract: string[];
  failClosed: boolean;
}

export const BODY_EXPOSURE_MANDATORY_MODULES: BodyExposureMandatoryModule[] = [
  {
    id: BODY_EXPOSURE_ALPHA_GENOME_REQUIREMENT.id,
    label: 'Alpha Genome Atlas',
    required: true,
    domain: 'genomics',
    minimumContract: [
      'chromosome-to-pathway multiscale navigation',
      'reference-assembly provenance',
      'transcript identity',
      'variant evidence and review context',
      'population-frequency context',
      'protein/pathway bridge',
      'organ/system cross-links',
      'no fabricated coordinates or patient inference',
    ],
    failClosed: true,
  },
  {
    id: BODY_EXPOSURE_VOLUMETRIC_IMAGING_REQUIREMENT.id,
    label: BODY_EXPOSURE_VOLUMETRIC_IMAGING_REQUIREMENT.label,
    required: true,
    domain: 'imaging',
    minimumContract: [
      'real local CT/MRI DICOM-series ingestion with geometry validation',
      'linked axial-coronal-sagittal multiplanar reconstruction',
      'surface rendering and direct volume rendering from the same source volume',
      'editable bone, vasculature and soft-tissue/organ visualization layers',
      'three simultaneous or switchable surface layers',
      '3D clipping/section plane synchronized with source-space slices',
      'MRI sequence-aware relative-intensity rendering without HU mislabeling',
      'head/temporal-bone, brain-vessel, thorax/heart and abdomen-pelvis benchmark scenes',
      'measured reconstruction latency, memory/VRAM use and interaction performance by device class',
      'optional stereoscopic/spatial-display output only after measured implementation',
      'no synthetic patient anatomy, diagnosis, or unmeasured performance claims',
    ],
    failClosed: true,
  },
];

export function isMandatoryBodyExposureModule(id: string) {
  return BODY_EXPOSURE_MANDATORY_MODULES.some((module) => module.id === id && module.required);
}
