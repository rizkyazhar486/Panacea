import {
  getEffectiveAnatomySourceNodeSnapshot,
  resolveAllAnatomySourceNodes,
} from './anatomySourceNodeRegistry'

export type BodySystemId =
  | 'cardiovascular'
  | 'nervous'
  | 'respiratory'
  | 'digestive'
  | 'urinary'
  | 'endocrine'
  | 'reproductive'
  | 'lymphatic-immune'
  | 'musculoskeletal'
  | 'sensory-ent'
  | 'integumentary-surface'

export interface BodySystemSourceTarget {
  id: string
  label: string
  file: string
  hints: readonly string[]
}

export interface BodySystemSourceDefinition {
  id: BodySystemId
  label: string
  targets: readonly BodySystemSourceTarget[]
}

export const BODY_SYSTEM_SOURCE_WAVE: readonly BodySystemSourceDefinition[] = [
  { id: 'cardiovascular', label: 'Cardiovascular', targets: [
    { id: 'heart', label: 'Heart', file: 'cardiovascular.glb', hints: ['heart'] },
    { id: 'aorta', label: 'Aorta', file: 'cardiovascular.glb', hints: ['aorta'] },
    { id: 'vena-cava', label: 'Vena cava', file: 'cardiovascular.glb', hints: ['vena cava'] },
    { id: 'pulmonary-vessels', label: 'Pulmonary vessels', file: 'cardiovascular.glb', hints: ['pulmonary artery', 'pulmonary vein'] },
  ] },
  { id: 'nervous', label: 'Nervous', targets: [
    { id: 'brain', label: 'Brain', file: 'nervous.glb', hints: ['brain'] },
    { id: 'spinal-cord', label: 'Spinal cord', file: 'nervous.glb', hints: ['spinal cord'] },
    { id: 'cranial-nerves', label: 'Cranial nerves', file: 'nervous.glb', hints: ['cranial nerve'] },
    { id: 'peripheral-nerves', label: 'Peripheral nerves', file: 'nervous.glb', hints: ['nerve'] },
  ] },
  { id: 'respiratory', label: 'Respiratory', targets: [
    { id: 'trachea', label: 'Trachea', file: 'visceral.glb', hints: ['trachea'] },
    { id: 'bronchi', label: 'Bronchi', file: 'visceral.glb', hints: ['bronch'] },
    { id: 'lungs', label: 'Lungs', file: 'visceral.glb', hints: ['lung'] },
    { id: 'diaphragm', label: 'Diaphragm', file: 'muscular.glb', hints: ['diaphragm'] },
  ] },
  { id: 'digestive', label: 'Digestive', targets: [
    { id: 'esophagus', label: 'Esophagus', file: 'visceral.glb', hints: ['esophagus', 'oesophagus'] },
    { id: 'stomach', label: 'Stomach', file: 'visceral.glb', hints: ['stomach'] },
    { id: 'small-bowel', label: 'Small bowel', file: 'visceral.glb', hints: ['duodenum', 'jejunum', 'ileum'] },
    { id: 'colon', label: 'Colon', file: 'visceral.glb', hints: ['colon', 'cecum', 'rectum'] },
    { id: 'hepatobiliary', label: 'Liver / gallbladder', file: 'visceral.glb', hints: ['liver', 'gallbladder', 'gall bladder'] },
    { id: 'pancreas', label: 'Pancreas', file: 'visceral.glb', hints: ['pancreas'] },
  ] },
  { id: 'urinary', label: 'Urinary', targets: [
    { id: 'kidneys', label: 'Kidneys', file: 'visceral.glb', hints: ['kidney'] },
    { id: 'ureters', label: 'Ureters', file: 'visceral.glb', hints: ['ureter'] },
    { id: 'bladder', label: 'Urinary bladder', file: 'visceral.glb', hints: ['urinary bladder', 'bladder'] },
    { id: 'urethra', label: 'Urethra', file: 'visceral.glb', hints: ['urethra'] },
  ] },
  { id: 'endocrine', label: 'Endocrine', targets: [
    { id: 'thyroid', label: 'Thyroid', file: 'visceral.glb', hints: ['thyroid'] },
    { id: 'parathyroid', label: 'Parathyroid', file: 'visceral.glb', hints: ['parathyroid'] },
    { id: 'adrenal', label: 'Adrenal glands', file: 'visceral.glb', hints: ['adrenal', 'suprarenal'] },
    { id: 'pancreas', label: 'Pancreas', file: 'visceral.glb', hints: ['pancreas'] },
  ] },
  { id: 'reproductive', label: 'Reproductive', targets: [
    { id: 'uterus', label: 'Uterus', file: 'visceral.glb', hints: ['uterus'] },
    { id: 'ovary', label: 'Ovaries', file: 'visceral.glb', hints: ['ovary'] },
    { id: 'vagina', label: 'Vagina', file: 'visceral.glb', hints: ['vagina'] },
    { id: 'testis', label: 'Testes', file: 'visceral.glb', hints: ['testis', 'testicle'] },
    { id: 'epididymis', label: 'Epididymis', file: 'visceral.glb', hints: ['epididymis'] },
    { id: 'prostate', label: 'Prostate', file: 'visceral.glb', hints: ['prostate'] },
  ] },
  { id: 'lymphatic-immune', label: 'Lymphatic / Immune', targets: [
    { id: 'spleen', label: 'Spleen', file: 'lymphoid.glb', hints: ['spleen'] },
    { id: 'thymus', label: 'Thymus', file: 'lymphoid.glb', hints: ['thymus'] },
    { id: 'lymph-nodes', label: 'Lymph nodes', file: 'lymphoid.glb', hints: ['lymph node'] },
    { id: 'tonsils', label: 'Tonsils', file: 'lymphoid.glb', hints: ['tonsil'] },
  ] },
  { id: 'musculoskeletal', label: 'Musculoskeletal / Articular', targets: [
    { id: 'skeleton', label: 'Skeleton', file: 'skeletal.glb', hints: ['femur', 'humerus', 'vertebra', 'rib', 'pelvis', 'skull'] },
    { id: 'muscles', label: 'Major muscles', file: 'muscular.glb', hints: ['muscle'] },
    { id: 'shoulder', label: 'Shoulder complex', file: 'skeletal.glb', hints: ['scapula', 'clavicle', 'humerus'] },
    { id: 'hip', label: 'Hip complex', file: 'skeletal.glb', hints: ['pelvis', 'femur'] },
    { id: 'knee', label: 'Knee complex', file: 'skeletal.glb', hints: ['femur', 'tibia', 'patella'] },
  ] },
  { id: 'sensory-ent', label: 'Sensory / ENT', targets: [
    { id: 'eye-context', label: 'Eye context', file: 'visceral.glb', hints: ['eye', 'eyeball'] },
    { id: 'optic-nerve', label: 'Optic nerve', file: 'nervous.glb', hints: ['optic nerve'] },
    { id: 'ear', label: 'Ear', file: 'visceral.glb', hints: ['ear', 'cochlea'] },
    { id: 'tongue', label: 'Tongue', file: 'visceral.glb', hints: ['tongue'] },
  ] },
  { id: 'integumentary-surface', label: 'Integumentary / Surface', targets: [
    { id: 'surface', label: 'Whole-body surface', file: 'surface.glb', hints: ['body', 'skin', 'surface'] },
  ] },
] as const

export function resolveBodySystemSourceWave() {
  const snapshot = getEffectiveAnatomySourceNodeSnapshot()
  return BODY_SYSTEM_SOURCE_WAVE.map((system) => ({
    ...system,
    targets: system.targets.map((target) => {
      const bundles = snapshot.filter((bundle) => bundle.file === target.file)
      const names = [...new Set(resolveAllAnatomySourceNodes(target.hints, bundles, 24).flatMap((match) => match.names))]
      return { ...target, names, available: names.length > 0 }
    }),
  }))
}

export function bodySystemSourceCoverage() {
  return resolveBodySystemSourceWave().map((system) => ({
    id: system.id,
    represented: system.targets.filter((target) => target.available).length,
    total: system.targets.length,
  }))
}
