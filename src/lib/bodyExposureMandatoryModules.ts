import { BODY_EXPOSURE_ALPHA_GENOME_REQUIREMENT } from './alphaGenomeAtlas';

export interface BodyExposureMandatoryModule {
  id: string;
  label: string;
  required: boolean;
  domain: 'anatomy' | 'physiology' | 'genomics' | 'molecular' | 'clinical-education';
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
];

export function isMandatoryBodyExposureModule(id: string) {
  return BODY_EXPOSURE_MANDATORY_MODULES.some((module) => module.id === id && module.required);
}
