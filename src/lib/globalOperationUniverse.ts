import type { SurgicalProcedure, SurgicalSpecialty } from './surgicalAtlas'

export type GlobalOperationDomain =
  | 'general'
  | 'colorectal'
  | 'hepatobiliary-pancreatic'
  | 'breast-endocrine'
  | 'vascular'
  | 'cardiothoracic'
  | 'congenital-cardiac'
  | 'neurosurgery'
  | 'spine'
  | 'orthopaedic-reconstruction'
  | 'orthopaedic-trauma'
  | 'sports'
  | 'hand-upper-limb'
  | 'pediatric-surgery'
  | 'urology'
  | 'obgyn'
  | 'gyn-oncology'
  | 'plastic-reconstructive'
  | 'burn'
  | 'ent-head-neck'
  | 'ophthalmology'
  | 'oral-maxillofacial'
  | 'transplant'
  | 'dermatologic-minor'

export interface GlobalOperationFamily {
  id: GlobalOperationDomain
  label: string
  targetSystems: string[]
  representativeProcedures: string[]
}

export const GLOBAL_OPERATION_FAMILIES: GlobalOperationFamily[] = [
  { id: 'general', label: 'General surgery', targetSystems: ['abdomen', 'soft tissue', 'hernia'], representativeProcedures: ['appendectomy', 'cholecystectomy', 'hernia repair', 'small-bowel resection', 'adhesiolysis', 'laparotomy', 'abdominal wall reconstruction'] },
  { id: 'colorectal', label: 'Colorectal surgery', targetSystems: ['colon', 'rectum', 'anus'], representativeProcedures: ['right colectomy', 'left colectomy', 'sigmoidectomy', 'low anterior resection', 'abdominoperineal resection', 'proctocolectomy', 'stoma creation/reversal', 'hemorrhoid surgery'] },
  { id: 'hepatobiliary-pancreatic', label: 'Hepatobiliary & pancreatic', targetSystems: ['liver', 'biliary tree', 'pancreas', 'spleen'], representativeProcedures: ['hepatectomy', 'biliary reconstruction', 'pancreaticoduodenectomy', 'distal pancreatectomy', 'pancreatectomy', 'splenectomy', 'portal-hypertension surgery'] },
  { id: 'breast-endocrine', label: 'Breast & endocrine surgery', targetSystems: ['breast', 'thyroid', 'parathyroid', 'adrenal'], representativeProcedures: ['lumpectomy', 'mastectomy', 'sentinel-node surgery', 'axillary dissection', 'thyroidectomy', 'parathyroidectomy', 'adrenalectomy'] },
  { id: 'vascular', label: 'Vascular surgery', targetSystems: ['aorta', 'arteries', 'veins', 'dialysis access'], representativeProcedures: ['aortic aneurysm repair', 'carotid endarterectomy', 'peripheral bypass', 'endarterectomy', 'thrombectomy', 'embolectomy', 'venous reconstruction', 'dialysis-access surgery', 'amputation for vascular disease'] },
  { id: 'cardiothoracic', label: 'Adult cardiothoracic surgery', targetSystems: ['heart', 'great vessels', 'lung', 'mediastinum'], representativeProcedures: ['CABG', 'aortic valve replacement', 'mitral repair/replacement', 'aortic root surgery', 'thoracic aortic repair', 'lobectomy', 'pneumonectomy', 'mediastinal surgery', 'esophagectomy'] },
  { id: 'congenital-cardiac', label: 'Congenital cardiac surgery', targetSystems: ['heart', 'great vessels'], representativeProcedures: ['VSD closure', 'ASD closure', 'arterial switch', 'Tetralogy repair', 'Fontan pathway surgery', 'Glenn shunt', 'Norwood pathway surgery', 'coarctation repair', 'congenital valve repair'] },
  { id: 'neurosurgery', label: 'Neurosurgery', targetSystems: ['brain', 'cranial nerves', 'cerebrovascular'], representativeProcedures: ['brain tumor craniotomy', 'aneurysm clipping', 'hematoma evacuation', 'decompressive craniectomy', 'VP shunt', 'epilepsy surgery', 'microvascular decompression', 'skull-base surgery', 'pituitary surgery'] },
  { id: 'spine', label: 'Spine surgery', targetSystems: ['cervical spine', 'thoracic spine', 'lumbar spine'], representativeProcedures: ['discectomy', 'laminectomy', 'spinal decompression', 'spinal fusion', 'deformity correction', 'vertebral tumor surgery', 'spinal trauma stabilization'] },
  { id: 'orthopaedic-reconstruction', label: 'Orthopaedic reconstruction', targetSystems: ['hip', 'knee', 'shoulder', 'elbow', 'ankle'], representativeProcedures: ['total hip arthroplasty', 'total knee arthroplasty', 'shoulder arthroplasty', 'revision arthroplasty', 'osteotomy', 'limb reconstruction'] },
  { id: 'orthopaedic-trauma', label: 'Orthopaedic trauma', targetSystems: ['long bones', 'pelvis', 'acetabulum', 'periarticular fractures'], representativeProcedures: ['ORIF', 'intramedullary fixation', 'external fixation', 'pelvic fixation', 'acetabular fixation', 'fracture-dislocation reconstruction', 'damage-control orthopaedics'] },
  { id: 'sports', label: 'Sports surgery', targetSystems: ['knee', 'shoulder', 'ankle', 'hip'], representativeProcedures: ['ACL reconstruction', 'PCL reconstruction', 'meniscus repair', 'rotator cuff repair', 'labral repair', 'ankle ligament reconstruction', 'cartilage restoration'] },
  { id: 'hand-upper-limb', label: 'Hand & upper-limb surgery', targetSystems: ['hand', 'wrist', 'peripheral nerves', 'tendons'], representativeProcedures: ['carpal tunnel release', 'tendon repair', 'nerve repair', 'fracture fixation', 'replantation', 'trigger finger release', 'Dupuytren surgery', 'wrist reconstruction'] },
  { id: 'pediatric-surgery', label: 'Pediatric surgery', targetSystems: ['neonatal abdomen', 'pediatric thorax', 'congenital anomalies'], representativeProcedures: ['pyloromyotomy', 'Hirschsprung surgery', 'anorectal-malformation repair', 'esophageal-atresia repair', 'congenital diaphragmatic hernia repair', 'pediatric hernia repair', 'neonatal bowel surgery'] },
  { id: 'urology', label: 'Urologic surgery', targetSystems: ['kidney', 'ureter', 'bladder', 'prostate', 'testis'], representativeProcedures: ['partial nephrectomy', 'radical nephrectomy', 'pyeloplasty', 'ureteric reconstruction', 'cystectomy', 'prostatectomy', 'TURP', 'orchidopexy', 'urethroplasty', 'stone surgery'] },
  { id: 'obgyn', label: 'Obstetric & gynecologic surgery', targetSystems: ['uterus', 'adnexa', 'pelvic floor'], representativeProcedures: ['cesarean delivery', 'hysterectomy', 'myomectomy', 'ovarian cystectomy', 'ectopic-pregnancy surgery', 'endometriosis surgery', 'pelvic-floor reconstruction', 'fertility-preserving surgery'] },
  { id: 'gyn-oncology', label: 'Gynecologic oncology', targetSystems: ['uterus', 'cervix', 'ovary', 'pelvis'], representativeProcedures: ['radical hysterectomy', 'ovarian-cancer cytoreduction', 'pelvic lymphadenectomy', 'para-aortic lymphadenectomy', 'vulvar cancer surgery', 'fertility-sparing oncologic surgery'] },
  { id: 'plastic-reconstructive', label: 'Plastic & reconstructive surgery', targetSystems: ['skin', 'soft tissue', 'breast', 'face', 'limbs'], representativeProcedures: ['free flap', 'local flap', 'skin graft', 'breast reconstruction', 'cleft lip repair', 'cleft palate repair', 'microsurgical reconstruction', 'scar revision'] },
  { id: 'burn', label: 'Burn surgery', targetSystems: ['skin', 'soft tissue'], representativeProcedures: ['burn excision', 'skin grafting', 'escharotomy', 'contracture release', 'burn reconstruction'] },
  { id: 'ent-head-neck', label: 'ENT & head-neck surgery', targetSystems: ['ear', 'nose', 'sinus', 'pharynx', 'larynx', 'neck'], representativeProcedures: ['tonsillectomy', 'FESS', 'septoplasty', 'tympanoplasty', 'mastoidectomy', 'laryngeal surgery', 'parotidectomy', 'neck dissection', 'head-neck tumor resection'] },
  { id: 'ophthalmology', label: 'Ophthalmic surgery', targetSystems: ['cornea', 'lens', 'retina', 'glaucoma', 'orbit'], representativeProcedures: ['cataract surgery', 'corneal transplant', 'vitrectomy', 'retinal-detachment repair', 'glaucoma surgery', 'strabismus surgery', 'oculoplastic surgery', 'orbital surgery'] },
  { id: 'oral-maxillofacial', label: 'Oral & maxillofacial surgery', targetSystems: ['jaw', 'face', 'oral cavity', 'teeth'], representativeProcedures: ['mandibular fixation', 'maxillary fixation', 'orthognathic surgery', 'facial-fracture reconstruction', 'oral tumor surgery', 'TMJ surgery', 'dentoalveolar surgery'] },
  { id: 'transplant', label: 'Transplant surgery', targetSystems: ['kidney', 'liver', 'heart', 'lung', 'pancreas'], representativeProcedures: ['kidney transplant', 'liver transplant', 'heart transplant', 'lung transplant', 'heart-lung transplant', 'pancreas transplant', 'multi-organ transplant'] },
  { id: 'dermatologic-minor', label: 'Dermatologic & minor surgery', targetSystems: ['skin', 'subcutaneous tissue'], representativeProcedures: ['excision', 'Mohs surgery', 'biopsy', 'abscess drainage', 'nail surgery', 'wound debridement', 'local flap/graft closure'] },
]

const CURRENT_DOMAIN_BY_SPECIALTY: Record<SurgicalSpecialty, GlobalOperationDomain> = {
  general: 'general',
  orthopaedics: 'orthopaedic-reconstruction',
  cardiothoracic: 'cardiothoracic',
  neurosurgery: 'neurosurgery',
  obgyn: 'obgyn',
  urology: 'urology',
  plastic: 'plastic-reconstructive',
  ent: 'ent-head-neck',
}

export function getGlobalOperationUniverseStats(procedures: SurgicalProcedure[]) {
  const detailedByDomain = Object.fromEntries(
    GLOBAL_OPERATION_FAMILIES.map((family) => [family.id, 0]),
  ) as Record<GlobalOperationDomain, number>

  for (const procedure of procedures) {
    detailedByDomain[CURRENT_DOMAIN_BY_SPECIALTY[procedure.specialty]] += 1
  }

  const representativeProcedures = GLOBAL_OPERATION_FAMILIES.reduce(
    (sum, family) => sum + family.representativeProcedures.length,
    0,
  )

  return {
    domains: GLOBAL_OPERATION_FAMILIES.length,
    representativeProcedures,
    detailedProcedures: procedures.length,
    domainsWithDetailedSimulation: Object.values(detailedByDomain).filter((count) => count > 0).length,
    unresolvedDomains: GLOBAL_OPERATION_FAMILIES
      .filter((family) => detailedByDomain[family.id] === 0)
      .map((family) => family.id),
    byDomain: GLOBAL_OPERATION_FAMILIES.map((family) => ({
      ...family,
      detailedProcedures: detailedByDomain[family.id],
    })),
  }
}

export interface IchiOperationIdentity {
  target: string
  action: string
  means: string
  stemCode?: string
  uri?: string
  source: 'WHO-ICHI'
}

export function attachIchiIdentity(
  identity: Omit<IchiOperationIdentity, 'source'>,
): IchiOperationIdentity {
  return { ...identity, source: 'WHO-ICHI' }
}
