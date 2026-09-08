export type BodySystemId =
  | 'digestive'
  | 'cardiovascular'
  | 'pulmonary'
  | 'brain-neuro'
  | 'eye'
  | 'ear'
  | 'ent'
  | 'endocrine'
  | 'female-reproductive'
  | 'male-reproductive'
  | 'urinary'
  | 'integumentary'
  | 'lymphatic'
  | 'musculoskeletal'
  | 'sensory-receptors'

export type ProjectionKind = 'anatomy' | 'procedure' | 'lesion' | 'drug-target' | 'adverse-effect' | 'physiology'
export type GeometryStatus = 'verification-required' | 'verified-native' | 'verified-adjacent' | 'reference-only' | 'blocked'
export type EvidenceStatus = 'source-required' | 'source-checked' | 'human-reviewed' | 'unsupported'
export type AcademicReviewStatus = 'pending' | 'recorded'

export interface BodyProjectionTarget {
  id: string
  label: string
  system: BodySystemId
  kinds: ProjectionKind[]
  anatomyHints: string[]
  preferredSourceIds: Array<'z_anatomy' | 'hubmap_hra' | 'nih_3d'>
  geometryStatus: GeometryStatus
  evidenceStatus: EvidenceStatus
  academicReview: AcademicReviewStatus
  patientSpecificAllowed: boolean
  note?: string
}

export interface ProcedureProjectionTarget {
  id: string
  label: string
  system: BodySystemId
  anatomyTargetIds: string[]
  reviewRequired: true
  productionReady: boolean
}

/**
 * Coverage contract for the shared Body3D / Z-Anatomy projection pipeline.
 *
 * IMPORTANT: presence in this registry is a roadmap/normalization target, not
 * evidence that Panacea already owns a verified mesh. Every target starts
 * verification-required or reference-only unless an asset-level provenance
 * record has been verified separately. This prevents "pretty" generated
 * geometry from silently becoming anatomy truth.
 */
export const BODY_PROJECTION_TARGETS: BodyProjectionTarget[] = [
  { id: 'digestive-core', label: 'Digestive tract and hepatopancreatobiliary organs', system: 'digestive', kinds: ['anatomy', 'procedure', 'lesion', 'drug-target', 'adverse-effect', 'physiology'], anatomyHints: ['esophagus', 'stomach', 'duodenum', 'jejunum', 'ileum', 'colon', 'rectum', 'liver', 'gallbladder', 'pancreas', 'appendix'], preferredSourceIds: ['z_anatomy', 'hubmap_hra', 'nih_3d'], geometryStatus: 'verification-required', evidenceStatus: 'source-required', academicReview: 'pending', patientSpecificAllowed: false },
  { id: 'cardiovascular-core', label: 'Heart and major vessels', system: 'cardiovascular', kinds: ['anatomy', 'procedure', 'lesion', 'drug-target', 'adverse-effect', 'physiology'], anatomyHints: ['heart', 'aorta', 'vena cava', 'pulmonary artery', 'pulmonary vein', 'coronary'], preferredSourceIds: ['z_anatomy', 'hubmap_hra', 'nih_3d'], geometryStatus: 'verification-required', evidenceStatus: 'source-required', academicReview: 'pending', patientSpecificAllowed: false },
  { id: 'pulmonary-core', label: 'Lungs, airway and pleural anatomy', system: 'pulmonary', kinds: ['anatomy', 'procedure', 'lesion', 'drug-target', 'adverse-effect', 'physiology'], anatomyHints: ['lung', 'trachea', 'bronch', 'pleura'], preferredSourceIds: ['z_anatomy', 'hubmap_hra', 'nih_3d'], geometryStatus: 'verification-required', evidenceStatus: 'source-required', academicReview: 'pending', patientSpecificAllowed: false },
  { id: 'brain-neuro-core', label: 'Brain, spinal cord and major neural pathways', system: 'brain-neuro', kinds: ['anatomy', 'procedure', 'lesion', 'drug-target', 'adverse-effect', 'physiology'], anatomyHints: ['brain', 'cerebrum', 'cerebellum', 'brainstem', 'spinal cord', 'cranial nerve', 'peripheral nerve'], preferredSourceIds: ['z_anatomy', 'hubmap_hra', 'nih_3d'], geometryStatus: 'verification-required', evidenceStatus: 'source-required', academicReview: 'pending', patientSpecificAllowed: false },
  { id: 'eye-core', label: 'Eye and visual pathway structures', system: 'eye', kinds: ['anatomy', 'procedure', 'lesion', 'drug-target', 'adverse-effect', 'physiology'], anatomyHints: ['eye', 'globe', 'cornea', 'lens', 'retina', 'optic nerve', 'extraocular'], preferredSourceIds: ['z_anatomy', 'nih_3d', 'hubmap_hra'], geometryStatus: 'verification-required', evidenceStatus: 'source-required', academicReview: 'pending', patientSpecificAllowed: false },
  { id: 'ear-core', label: 'External, middle and inner ear structures', system: 'ear', kinds: ['anatomy', 'procedure', 'lesion', 'drug-target', 'adverse-effect', 'physiology'], anatomyHints: ['external ear', 'tympanic', 'ossicle', 'cochlea', 'vestibular'], preferredSourceIds: ['z_anatomy', 'nih_3d'], geometryStatus: 'verification-required', evidenceStatus: 'source-required', academicReview: 'pending', patientSpecificAllowed: false, note: 'Tiny otologic structures may require a dedicated specialty atlas rather than whole-body geometry.' },
  { id: 'ent-core', label: 'Nose, paranasal sinus, pharynx and larynx', system: 'ent', kinds: ['anatomy', 'procedure', 'lesion', 'drug-target', 'adverse-effect', 'physiology'], anatomyHints: ['nasal cavity', 'sinus', 'pharynx', 'larynx', 'oral cavity'], preferredSourceIds: ['z_anatomy', 'nih_3d', 'hubmap_hra'], geometryStatus: 'verification-required', evidenceStatus: 'source-required', academicReview: 'pending', patientSpecificAllowed: false },
  { id: 'endocrine-core', label: 'Endocrine organs and neuroendocrine control structures', system: 'endocrine', kinds: ['anatomy', 'procedure', 'lesion', 'drug-target', 'adverse-effect', 'physiology'], anatomyHints: ['thyroid', 'parathyroid', 'adrenal', 'pituitary', 'hypothalamus', 'pancreas'], preferredSourceIds: ['z_anatomy', 'hubmap_hra', 'nih_3d'], geometryStatus: 'verification-required', evidenceStatus: 'source-required', academicReview: 'pending', patientSpecificAllowed: false, note: 'Hormonal function must be represented as physiology/evidence overlays; endocrine cell populations are not inferred from gross-organ geometry.' },
  { id: 'female-reproductive-core', label: 'Female reproductive and pelvic structures', system: 'female-reproductive', kinds: ['anatomy', 'procedure', 'lesion', 'drug-target', 'adverse-effect', 'physiology'], anatomyHints: ['vagina', 'cervix', 'uterus', 'fallopian', 'ovary', 'vulva'], preferredSourceIds: ['z_anatomy', 'hubmap_hra', 'nih_3d'], geometryStatus: 'verification-required', evidenceStatus: 'source-required', academicReview: 'pending', patientSpecificAllowed: false },
  { id: 'male-reproductive-core', label: 'Male reproductive and pelvic structures', system: 'male-reproductive', kinds: ['anatomy', 'procedure', 'lesion', 'drug-target', 'adverse-effect', 'physiology'], anatomyHints: ['penis', 'testis', 'epididymis', 'vas deferens', 'seminal vesicle', 'prostate'], preferredSourceIds: ['z_anatomy', 'hubmap_hra', 'nih_3d'], geometryStatus: 'verification-required', evidenceStatus: 'source-required', academicReview: 'pending', patientSpecificAllowed: false },
  { id: 'urinary-core', label: 'Kidneys, ureters, bladder and urethra', system: 'urinary', kinds: ['anatomy', 'procedure', 'lesion', 'drug-target', 'adverse-effect', 'physiology'], anatomyHints: ['kidney', 'ureter', 'bladder', 'urethra'], preferredSourceIds: ['z_anatomy', 'hubmap_hra', 'nih_3d'], geometryStatus: 'verification-required', evidenceStatus: 'source-required', academicReview: 'pending', patientSpecificAllowed: false },
  { id: 'integumentary-core', label: 'Skin and integumentary structures', system: 'integumentary', kinds: ['anatomy', 'procedure', 'lesion', 'drug-target', 'adverse-effect', 'physiology'], anatomyHints: ['skin', 'dermis', 'epidermis', 'hair', 'nail'], preferredSourceIds: ['hubmap_hra', 'nih_3d', 'z_anatomy'], geometryStatus: 'verification-required', evidenceStatus: 'source-required', academicReview: 'pending', patientSpecificAllowed: false, note: 'Histologic layers and appendages require tissue/microscopy evidence; a surface mesh alone is insufficient.' },
  { id: 'lymphatic-core', label: 'Lymphatic and lymphoid structures', system: 'lymphatic', kinds: ['anatomy', 'procedure', 'lesion', 'drug-target', 'adverse-effect', 'physiology'], anatomyHints: ['lymph node', 'lymphatic', 'spleen', 'thymus', 'tonsil'], preferredSourceIds: ['z_anatomy', 'hubmap_hra', 'nih_3d'], geometryStatus: 'verification-required', evidenceStatus: 'source-required', academicReview: 'pending', patientSpecificAllowed: false },
  { id: 'musculoskeletal-core', label: 'Bones, joints, muscles, tendons and major ligaments', system: 'musculoskeletal', kinds: ['anatomy', 'procedure', 'lesion', 'drug-target', 'adverse-effect', 'physiology'], anatomyHints: ['bone', 'joint', 'muscle', 'tendon', 'ligament'], preferredSourceIds: ['z_anatomy', 'nih_3d', 'hubmap_hra'], geometryStatus: 'verification-required', evidenceStatus: 'source-required', academicReview: 'pending', patientSpecificAllowed: false },
  { id: 'chemoreceptor-reference', label: 'Chemoreceptor reference locations', system: 'sensory-receptors', kinds: ['anatomy', 'physiology', 'drug-target'], anatomyHints: ['carotid body', 'aortic body', 'brainstem chemoreception'], preferredSourceIds: ['nih_3d', 'hubmap_hra', 'z_anatomy'], geometryStatus: 'reference-only', evidenceStatus: 'source-required', academicReview: 'pending', patientSpecificAllowed: false, note: 'Do not convert distributed/physiologic chemoreception into a fabricated single whole-body mesh.' },
  { id: 'thermoreceptor-reference', label: 'Thermoreceptor distribution reference', system: 'sensory-receptors', kinds: ['anatomy', 'physiology', 'drug-target'], anatomyHints: ['skin thermoreceptor', 'free nerve ending', 'hypothalamus'], preferredSourceIds: ['hubmap_hra', 'nih_3d'], geometryStatus: 'reference-only', evidenceStatus: 'source-required', academicReview: 'pending', patientSpecificAllowed: false, note: 'Thermoreception is distributed and must be shown as an evidence-backed conceptual/tissue overlay, not a gross-organ mesh.' },
]

/**
 * Procedure names are normalized teaching targets only. No approach, device,
 * pressure, force, safe-zone, trocar coordinate, dose, or patient-specific
 * trajectory is encoded here. All procedures remain review-required until a
 * qualified human reviewer and procedure-specific source basis are recorded.
 */
export const PROCEDURE_PROJECTION_TARGETS: ProcedureProjectionTarget[] = [
  { id: 'appendectomy', label: 'Appendectomy', system: 'digestive', anatomyTargetIds: ['digestive-core'], reviewRequired: true, productionReady: false },
  { id: 'cholecystectomy', label: 'Cholecystectomy', system: 'digestive', anatomyTargetIds: ['digestive-core'], reviewRequired: true, productionReady: false },
  { id: 'gastrectomy', label: 'Gastrectomy', system: 'digestive', anatomyTargetIds: ['digestive-core'], reviewRequired: true, productionReady: false },
  { id: 'bowel-resection-anastomosis', label: 'Bowel resection and anastomosis', system: 'digestive', anatomyTargetIds: ['digestive-core'], reviewRequired: true, productionReady: false },
  { id: 'hepatectomy', label: 'Hepatectomy', system: 'digestive', anatomyTargetIds: ['digestive-core'], reviewRequired: true, productionReady: false },
  { id: 'pancreatectomy', label: 'Pancreatectomy', system: 'digestive', anatomyTargetIds: ['digestive-core'], reviewRequired: true, productionReady: false },
  { id: 'nissen-fundoplication', label: 'Nissen fundoplication', system: 'digestive', anatomyTargetIds: ['digestive-core'], reviewRequired: true, productionReady: false },
  { id: 'endoscopy', label: 'Upper gastrointestinal endoscopy', system: 'digestive', anatomyTargetIds: ['digestive-core'], reviewRequired: true, productionReady: false },
  { id: 'colostomy', label: 'Colostomy', system: 'digestive', anatomyTargetIds: ['digestive-core'], reviewRequired: true, productionReady: false },
  { id: 'bariatric-surgery', label: 'Bariatric surgery anatomy', system: 'digestive', anatomyTargetIds: ['digestive-core'], reviewRequired: true, productionReady: false },
  { id: 'cabg', label: 'Coronary artery bypass grafting anatomy', system: 'cardiovascular', anatomyTargetIds: ['cardiovascular-core'], reviewRequired: true, productionReady: false },
  { id: 'coronary-angioplasty-stent', label: 'Coronary angioplasty and stent anatomy', system: 'cardiovascular', anatomyTargetIds: ['cardiovascular-core'], reviewRequired: true, productionReady: false },
  { id: 'cardiac-catheterization', label: 'Cardiac catheterization anatomy', system: 'cardiovascular', anatomyTargetIds: ['cardiovascular-core'], reviewRequired: true, productionReady: false },
  { id: 'valve-repair', label: 'Cardiac valve repair anatomy', system: 'cardiovascular', anatomyTargetIds: ['cardiovascular-core'], reviewRequired: true, productionReady: false },
  { id: 'thrombectomy-vascular', label: 'Vascular thrombectomy anatomy', system: 'cardiovascular', anatomyTargetIds: ['cardiovascular-core'], reviewRequired: true, productionReady: false },
  { id: 'lobectomy', label: 'Pulmonary lobectomy', system: 'pulmonary', anatomyTargetIds: ['pulmonary-core'], reviewRequired: true, productionReady: false },
  { id: 'pneumonectomy', label: 'Pneumonectomy', system: 'pulmonary', anatomyTargetIds: ['pulmonary-core'], reviewRequired: true, productionReady: false },
  { id: 'thoracentesis', label: 'Thoracentesis anatomy', system: 'pulmonary', anatomyTargetIds: ['pulmonary-core'], reviewRequired: true, productionReady: false },
  { id: 'bronchoscopy', label: 'Bronchoscopy anatomy', system: 'pulmonary', anatomyTargetIds: ['pulmonary-core'], reviewRequired: true, productionReady: false },
  { id: 'tracheostomy', label: 'Tracheostomy anatomy', system: 'ent', anatomyTargetIds: ['ent-core', 'pulmonary-core'], reviewRequired: true, productionReady: false },
  { id: 'nephrectomy', label: 'Nephrectomy', system: 'urinary', anatomyTargetIds: ['urinary-core'], reviewRequired: true, productionReady: false },
  { id: 'lithotripsy', label: 'Urinary stone lithotripsy anatomy', system: 'urinary', anatomyTargetIds: ['urinary-core'], reviewRequired: true, productionReady: false },
  { id: 'cystectomy', label: 'Cystectomy', system: 'urinary', anatomyTargetIds: ['urinary-core'], reviewRequired: true, productionReady: false },
  { id: 'urethroplasty', label: 'Urethroplasty anatomy', system: 'urinary', anatomyTargetIds: ['urinary-core'], reviewRequired: true, productionReady: false },
  { id: 'circumcision', label: 'Circumcision anatomy', system: 'male-reproductive', anatomyTargetIds: ['male-reproductive-core'], reviewRequired: true, productionReady: false },
  { id: 'hysterectomy', label: 'Hysterectomy', system: 'female-reproductive', anatomyTargetIds: ['female-reproductive-core'], reviewRequired: true, productionReady: false },
  { id: 'oophorectomy', label: 'Oophorectomy', system: 'female-reproductive', anatomyTargetIds: ['female-reproductive-core'], reviewRequired: true, productionReady: false },
  { id: 'salpingo-oophorectomy', label: 'Salpingo-oophorectomy', system: 'female-reproductive', anatomyTargetIds: ['female-reproductive-core'], reviewRequired: true, productionReady: false },
  { id: 'dilation-curettage', label: 'Dilation and curettage anatomy', system: 'female-reproductive', anatomyTargetIds: ['female-reproductive-core'], reviewRequired: true, productionReady: false },
  { id: 'cesarean', label: 'Cesarean delivery anatomy', system: 'female-reproductive', anatomyTargetIds: ['female-reproductive-core'], reviewRequired: true, productionReady: false },
  { id: 'vasectomy', label: 'Vasectomy anatomy', system: 'male-reproductive', anatomyTargetIds: ['male-reproductive-core'], reviewRequired: true, productionReady: false },
  { id: 'tubal-sterilization', label: 'Tubal sterilization anatomy', system: 'female-reproductive', anatomyTargetIds: ['female-reproductive-core'], reviewRequired: true, productionReady: false },
  { id: 'prostatectomy', label: 'Prostatectomy', system: 'male-reproductive', anatomyTargetIds: ['male-reproductive-core', 'urinary-core'], reviewRequired: true, productionReady: false },
  { id: 'orchiectomy', label: 'Orchiectomy', system: 'male-reproductive', anatomyTargetIds: ['male-reproductive-core'], reviewRequired: true, productionReady: false },
  { id: 'thyroidectomy', label: 'Thyroidectomy', system: 'endocrine', anatomyTargetIds: ['endocrine-core'], reviewRequired: true, productionReady: false },
  { id: 'parathyroidectomy', label: 'Parathyroidectomy', system: 'endocrine', anatomyTargetIds: ['endocrine-core'], reviewRequired: true, productionReady: false },
  { id: 'adrenalectomy', label: 'Adrenalectomy', system: 'endocrine', anatomyTargetIds: ['endocrine-core'], reviewRequired: true, productionReady: false },
  { id: 'pancreaticoduodenectomy', label: 'Pancreaticoduodenectomy (Whipple procedure)', system: 'digestive', anatomyTargetIds: ['digestive-core'], reviewRequired: true, productionReady: false },
  { id: 'lymphadenectomy', label: 'Lymphadenectomy anatomy', system: 'lymphatic', anatomyTargetIds: ['lymphatic-core'], reviewRequired: true, productionReady: false },
  { id: 'craniotomy', label: 'Craniotomy anatomy', system: 'brain-neuro', anatomyTargetIds: ['brain-neuro-core'], reviewRequired: true, productionReady: false },
  { id: 'mechanical-thrombectomy-stroke', label: 'Mechanical thrombectomy for stroke anatomy', system: 'brain-neuro', anatomyTargetIds: ['brain-neuro-core', 'cardiovascular-core'], reviewRequired: true, productionReady: false },
  { id: 'fracture-fixation', label: 'Fracture fixation anatomy', system: 'musculoskeletal', anatomyTargetIds: ['musculoskeletal-core'], reviewRequired: true, productionReady: false },
  { id: 'arthroplasty', label: 'Joint arthroplasty anatomy', system: 'musculoskeletal', anatomyTargetIds: ['musculoskeletal-core'], reviewRequired: true, productionReady: false },
  { id: 'arthroscopy', label: 'Arthroscopy anatomy', system: 'musculoskeletal', anatomyTargetIds: ['musculoskeletal-core'], reviewRequired: true, productionReady: false },
  { id: 'osteotomy', label: 'Osteotomy anatomy', system: 'musculoskeletal', anatomyTargetIds: ['musculoskeletal-core'], reviewRequired: true, productionReady: false },
  { id: 'laminectomy-discectomy', label: 'Laminectomy and discectomy anatomy', system: 'brain-neuro', anatomyTargetIds: ['brain-neuro-core', 'musculoskeletal-core'], reviewRequired: true, productionReady: false },
]

export function projectionTargetById(id: string): BodyProjectionTarget | undefined {
  return BODY_PROJECTION_TARGETS.find((target) => target.id === id)
}

export function canPublishProjection(target: BodyProjectionTarget): boolean {
  const geometryReady = target.geometryStatus === 'verified-native' || target.geometryStatus === 'verified-adjacent' || target.geometryStatus === 'reference-only'
  const evidenceReady = target.evidenceStatus === 'source-checked' || target.evidenceStatus === 'human-reviewed'
  return geometryReady && evidenceReady && target.academicReview === 'recorded'
}

export function canPublishProcedure(procedure: ProcedureProjectionTarget): boolean {
  if (!procedure.productionReady) return false
  return procedure.anatomyTargetIds.every((id) => {
    const target = projectionTargetById(id)
    return target ? canPublishProjection(target) : false
  })
}
