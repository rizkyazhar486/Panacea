export type BodyExposureActivityKey =
  | 'layers'
  | 'muscles'
  | 'workout-sim'
  | 'biomekanika'
  | 'tuas-sendi'
  | 'organs'
  | 'physiology'
  | 'simulator'
  | 'lokalisasi'
  | 'ventilasi'
  | 'hemodinamik'
  | 'nefron'
  | 'asam-basa'
  | 'ventilasi-membran'
  | 'farmakodinamik'
  | 'dialisis'
  | 'gas-alveolar'
  | 'difusi'
  | 'indera'
  | 'termoregulasi'
  | 'wilayah-abdomen'
  | 'kerangka'
  | 'arteri'
  | 'limfe'
  | 'kelenjar-saluran'
  | 'cardio'
  | 'spesialisasi'
  | 'molekul'
  | 'genomik'
  | 'genom-alfa'
  | 'vertikal-molekuler'
  | 'pencitraan-volumetrik'
  | 'cari'
  | 'presisi'
  | 'mesin'
  | 'sel'
  | 'bedah'
  | 'drugs'
  | 'diseases'
  | 'reference'

export interface BodyExposureActivity {
  key: BodyExposureActivityKey
  label: string
  keywords: string
}

export const BODY_EXPOSURE_ACTIVITIES: readonly BodyExposureActivity[] = [
  { key: 'layers', label: 'Layers', keywords: 'anatomy layers dissection surface depth' },
  { key: 'muscles', label: 'Muscles', keywords: 'muscle muscular workout anatomy' },
  { key: 'workout-sim', label: 'Workout', keywords: 'exercise contraction training movement' },
  { key: 'biomekanika', label: 'Motion biomechanics', keywords: 'movement gait mechanics motion' },
  { key: 'tuas-sendi', label: 'Joint levers', keywords: 'joint lever torque biomechanics' },
  { key: 'organs', label: 'Organs', keywords: 'organ visceral anatomy system' },
  { key: 'physiology', label: 'Physiology', keywords: 'function physiology organ systems' },
  { key: 'simulator', label: 'Simulator', keywords: 'simulation physiology scenario vitals' },
  { key: 'lokalisasi', label: 'Localise a lesion', keywords: 'neurology lesion localisation localization exam' },
  { key: 'ventilasi', label: 'Segmental ventilation', keywords: 'lung respiratory ventilation segment' },
  { key: 'hemodinamik', label: 'Oxygen delivery', keywords: 'oxygen delivery hemodynamics perfusion' },
  { key: 'nefron', label: 'Glomerular filtration', keywords: 'kidney renal nephron gfr filtration' },
  { key: 'asam-basa', label: 'Acid–base', keywords: 'acid base blood gas physiology' },
  { key: 'ventilasi-membran', label: 'Ventilation & membrane', keywords: 'respiratory membrane ventilation perfusion' },
  { key: 'farmakodinamik', label: 'Dose–response', keywords: 'pharmacodynamics dose response receptor' },
  { key: 'dialisis', label: 'Dialysis kinetics', keywords: 'renal dialysis clearance kinetics' },
  { key: 'gas-alveolar', label: 'Alveolar gas', keywords: 'alveolar gas equation respiratory oxygen' },
  { key: 'difusi', label: 'Diffusion limits', keywords: 'diffusion membrane gas transfer' },
  { key: 'indera', label: 'Dioptres & decibels', keywords: 'vision hearing eye ear sensory' },
  { key: 'termoregulasi', label: 'Heat balance', keywords: 'temperature heat thermoregulation' },
  { key: 'wilayah-abdomen', label: 'Abdominal regions', keywords: 'abdomen region surface anatomy' },
  { key: 'kerangka', label: 'Skeleton', keywords: 'bone skeletal anatomy' },
  { key: 'arteri', label: 'Arterial territories', keywords: 'artery vascular blood supply territory' },
  { key: 'limfe', label: 'Lymphoid system', keywords: 'lymph node immune lymphatic' },
  { key: 'kelenjar-saluran', label: 'Glands & urinary tract', keywords: 'gland urinary endocrine tract' },
  { key: 'cardio', label: 'Cardio lab', keywords: 'heart cardiovascular circulation lab' },
  { key: 'spesialisasi', label: 'Specialty labs', keywords: 'specialty clinical surgery organ lab' },
  { key: 'molekul', label: 'Molecules', keywords: 'molecule drug chemistry molecular' },
  { key: 'genomik', label: 'Genomics', keywords: 'genomics genetics dna variant' },
  { key: 'genom-alfa', label: 'Genome atlas', keywords: 'genome atlas dna genetics' },
  { key: 'vertikal-molekuler', label: 'Tissue → gene', keywords: 'tissue cell molecule gene multiscale' },
  { key: 'pencitraan-volumetrik', label: 'DICOM → 3D', keywords: 'dicom ct mri imaging radiology volumetric' },
  { key: 'cari', label: 'Find structure', keywords: 'search structure anatomy finder' },
  { key: 'presisi', label: 'Whole-body precision', keywords: 'whole body precision anatomy' },
  { key: 'mesin', label: 'Biomedical engine', keywords: 'biomedical engine simulation model' },
  { key: 'sel', label: 'Cell & metabolism', keywords: 'cell organelle metabolism biochemistry' },
  { key: 'bedah', label: 'Surgical layers', keywords: 'surgery operative layers approach' },
  { key: 'drugs', label: 'Drugs', keywords: 'drug pharmacology medicine mechanism' },
  { key: 'diseases', label: 'Diseases', keywords: 'disease pathology pathophysiology diagnosis' },
  { key: 'reference', label: 'Study', keywords: 'study reference anatomy curriculum' },
] as const

const BODY_EXPOSURE_ACTIVITY_KEYS = new Set<string>(BODY_EXPOSURE_ACTIVITIES.map((activity) => activity.key))

export function isBodyExposureActivityKey(value: string | null | undefined): value is BodyExposureActivityKey {
  return typeof value === 'string' && BODY_EXPOSURE_ACTIVITY_KEYS.has(value)
}
