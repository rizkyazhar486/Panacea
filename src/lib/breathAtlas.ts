import { PHYSIOLOGY_DEEP_DIVES } from './physiologyDeepDives'

export const THEBUGGEDDEV_ANATOMY_REPOSITORY = 'https://github.com/thebuggeddev/anatomy'
export const BREATH_ATLAS_REFERENCE_URL = 'https://breath-atlas.thebuggeddev.chatgpt.site/'
export const THEBUGGEDDEV_ANATOMY_REVIEWED_REVISION = '8c0e6f321a47f895ae58ce098028b92774733ee9'

export const BREATH_ATLAS_REFERENCE_BOUNDARY =
  'External design/product reference only. Panacea does not import code, meshes, textures, hotspots, coordinates, or biomedical claims from this project while its license remains unverified. Respiratory teaching stays on Panacea provenance-bearing anatomy and existing evidence sources.'

export const BREATH_ATLAS_SCIENCE_BOUNDARY =
  'Reference physiology only: source anatomy stays dimensionally unchanged, missing structures remain text/reference-only, and nothing here measures a patient, diagnoses disease, or infers patient-specific airway, lung, pleural, alveolar, or diaphragmatic geometry.'

export const BREATH_ATLAS_TOPIC = PHYSIOLOGY_DEEP_DIVES.find((topic) => topic.id === 'spirometry')

export const BREATH_ATLAS_STATIONS = [
  {
    id: 'airway',
    label: 'Airway context',
    description: 'Inspect the existing lung and bronchus context in the shared Body3D rather than loading a separate respiratory renderer.',
  },
  {
    id: 'ventilation',
    label: 'Ventilation pump',
    description: 'Connect diaphragm and lung anatomy to the existing respiratory-mechanics teaching model without deforming source anatomy to imitate breathing.',
  },
  {
    id: 'exchange',
    label: 'Gas-exchange context',
    description: 'Use alveolar context only when verified source geometry exists; otherwise keep the concept explicitly reference-only instead of fabricating microanatomy.',
  },
  {
    id: 'mechanics',
    label: 'Spirometry & mechanics',
    description: BREATH_ATLAS_TOPIC?.summary ?? 'Respiratory mechanics remain unavailable until the existing evidence-backed topic can be resolved.',
  },
] as const
