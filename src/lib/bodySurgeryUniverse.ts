export type SurgicalSpecialtyId =
  | 'general'
  | 'digestive'
  | 'hepatobiliary'
  | 'colorectal'
  | 'breast-endocrine'
  | 'vascular'
  | 'cardiac'
  | 'thoracic'
  | 'pediatric'
  | 'urology'
  | 'plastic'
  | 'orthopedic'
  | 'spine'
  | 'hand'
  | 'neurosurgery'
  | 'ent'
  | 'ophthalmology'
  | 'obgyn'
  | 'trauma'
  | 'laparoscopy'

export interface SurgicalProcedureConcept {
  id: string
  title: string
  region: string
  approach: readonly string[]
  anatomy: readonly string[]
  learningTargets: readonly string[]
  simulatorModes: readonly string[]
}

export interface SurgicalSpecialtyConcept {
  id: SurgicalSpecialtyId
  label: string
  procedures: readonly SurgicalProcedureConcept[]
}

const p = (
  id: string,
  title: string,
  region: string,
  approach: readonly string[],
  anatomy: readonly string[],
  learningTargets: readonly string[],
  simulatorModes: readonly string[] = ['orientation', 'layer-peel', 'camera-navigation', 'concept-sequencing'],
): SurgicalProcedureConcept => ({ id, title, region, approach, anatomy, learningTargets, simulatorModes })

export const BODY_SURGERY_UNIVERSE: readonly SurgicalSpecialtyConcept[] = [
  {
    id: 'general', label: 'General Surgery', procedures: [
      p('appendectomy', 'Appendectomy concept', 'right-lower-abdomen', ['open', 'laparoscopic'], ['cecum', 'appendix', 'ileum', 'mesoappendix'], ['surface-to-target orientation', 'regional relationships', 'safe visual identification']),
      p('hernia', 'Inguinal hernia repair concept', 'groin', ['open', 'minimally-invasive'], ['inguinal canal', 'inferior epigastric vessels', 'spermatic cord', 'femoral region'], ['direct-vs-indirect spatial anatomy', 'mesh-plane concept', 'danger zones']),
      p('soft-tissue', 'Soft-tissue excision concept', 'surface', ['open'], ['skin', 'subcutaneous tissue', 'fascia', 'neurovascular structures'], ['margin visualization', 'plane awareness', 'closure geometry']),
      p('abdominal-access', 'Abdominal access concept', 'abdomen', ['open', 'laparoscopic'], ['abdominal wall layers', 'peritoneum', 'viscera'], ['entry layers', 'port geometry', 'spatial orientation']),
    ],
  },
  {
    id: 'digestive', label: 'Digestive Surgery', procedures: [
      p('gastrectomy', 'Gastrectomy concept', 'upper-abdomen', ['open', 'laparoscopic', 'robotic'], ['stomach', 'omentum', 'gastric vessels', 'esophagus', 'duodenum'], ['resection geometry', 'vascular territories', 'reconstruction concepts']),
      p('small-bowel-resection', 'Small-bowel resection concept', 'abdomen', ['open', 'laparoscopic'], ['jejunum', 'ileum', 'mesentery', 'mesenteric vessels'], ['bowel orientation', 'mesenteric geometry', 'anastomotic concept']),
      p('esophageal', 'Esophageal surgery concept', 'thoracoabdominal', ['open', 'minimally-invasive'], ['esophagus', 'stomach', 'mediastinum', 'vagus nerves'], ['long-axis anatomy', 'thoracoabdominal relationships', 'reconstruction route']),
    ],
  },
  {
    id: 'hepatobiliary', label: 'Hepatobiliary & Pancreatic Surgery', procedures: [
      p('cholecystectomy', 'Cholecystectomy concept', 'right-upper-abdomen', ['laparoscopic', 'open'], ['gallbladder', 'cystic duct', 'cystic artery', 'common bile duct', 'liver'], ['biliary mapping', 'critical-view concept', 'vascular awareness']),
      p('hepatectomy', 'Liver resection concept', 'right-upper-abdomen', ['open', 'laparoscopic'], ['liver segments', 'portal pedicles', 'hepatic veins', 'IVC'], ['segmental anatomy', 'inflow-outflow concept', 'resection-plane visualization']),
      p('pancreatic', 'Pancreatic resection concept', 'upper-abdomen', ['open', 'robotic'], ['pancreas', 'duodenum', 'portal vein', 'SMA', 'SMV', 'bile duct'], ['vascular relationships', 'head-body-tail orientation', 'reconstruction concept']),
    ],
  },
  {
    id: 'colorectal', label: 'Colorectal Surgery', procedures: [
      p('colectomy', 'Segmental colectomy concept', 'abdomen', ['open', 'laparoscopic', 'robotic'], ['colon', 'mesocolon', 'regional vessels', 'ureter'], ['segmental blood supply', 'mesenteric planes', 'anastomotic orientation']),
      p('rectal', 'Rectal surgery concept', 'pelvis', ['open', 'laparoscopic', 'robotic'], ['rectum', 'mesorectum', 'pelvic nerves', 'ureters', 'pelvic floor'], ['pelvic planes', 'autonomic nerve preservation concept', 'distal geometry']),
      p('stoma', 'Stoma construction concept', 'abdominal-wall', ['open'], ['colon', 'ileum', 'rectus sheath', 'skin'], ['site geometry', 'abdominal-wall passage', 'orientation']),
    ],
  },
  {
    id: 'breast-endocrine', label: 'Breast & Endocrine Surgery', procedures: [
      p('breast-conservation', 'Breast-conserving surgery concept', 'chest-wall', ['open'], ['breast quadrants', 'pectoral fascia', 'axillary tail'], ['lesion localization', 'margin geometry', 'cosmetic volume concept']),
      p('axillary', 'Axillary nodal surgery concept', 'axilla', ['open'], ['axillary vein', 'long thoracic nerve', 'thoracodorsal bundle', 'nodes'], ['nodal levels', 'nerve awareness', 'vascular landmarks']),
      p('thyroidectomy', 'Thyroidectomy concept', 'neck', ['open'], ['thyroid', 'recurrent laryngeal nerve', 'parathyroids', 'trachea'], ['capsular planes', 'nerve relationship', 'parathyroid preservation concept']),
    ],
  },
  {
    id: 'vascular', label: 'Vascular Surgery', procedures: [
      p('carotid', 'Carotid surgery concept', 'neck', ['open'], ['carotid bifurcation', 'internal carotid', 'external carotid', 'cranial nerves'], ['bifurcation anatomy', 'cerebral-flow context', 'nerve proximity']),
      p('aortic', 'Aortic repair concept', 'abdomen', ['open', 'endovascular'], ['aorta', 'renal arteries', 'iliac arteries', 'visceral branches'], ['landing-zone concept', 'branch anatomy', 'proximal-distal control concept']),
      p('peripheral-bypass', 'Peripheral bypass concept', 'lower-limb', ['open'], ['femoral artery', 'popliteal artery', 'tibial vessels', 'veins'], ['inflow-outflow mapping', 'tunnel geometry', 'distal target selection concept']),
    ],
  },
  {
    id: 'cardiac', label: 'Cardiac Surgery', procedures: [
      p('cabg', 'Coronary bypass concept', 'heart', ['median-sternotomy', 'minimally-invasive'], ['coronary arteries', 'aorta', 'internal thoracic arteries', 'great saphenous vein'], ['coronary territories', 'conduit routing', 'proximal-distal geometry']),
      p('aortic-valve', 'Aortic valve surgery concept', 'heart', ['open'], ['aortic root', 'valve cusps', 'coronary ostia', 'LVOT'], ['root anatomy', 'annular orientation', 'coronary proximity']),
      p('mitral-valve', 'Mitral valve surgery concept', 'heart', ['open', 'minimally-invasive'], ['mitral leaflets', 'annulus', 'chordae', 'papillary muscles'], ['subvalvular anatomy', 'repair geometry', 'ventricular relationship']),
    ],
  },
  {
    id: 'thoracic', label: 'Thoracic Surgery', procedures: [
      p('lobectomy', 'Pulmonary lobectomy concept', 'thorax', ['thoracotomy', 'VATS', 'robotic'], ['lobes', 'pulmonary arteries', 'pulmonary veins', 'bronchi'], ['hilar anatomy', 'fissures', 'segmental relationships']),
      p('mediastinal', 'Mediastinal surgery concept', 'mediastinum', ['open', 'VATS', 'robotic'], ['thymus', 'phrenic nerves', 'great vessels', 'trachea'], ['mediastinal compartments', 'nerve-vessel relationships', 'access geometry']),
      p('esophageal-thoracic', 'Thoracic esophageal concept', 'posterior-mediastinum', ['open', 'VATS'], ['esophagus', 'aorta', 'trachea', 'vagus nerves'], ['mediastinal orientation', 'longitudinal planes', 'adjacent organ awareness']),
    ],
  },
  {
    id: 'pediatric', label: 'Pediatric Surgery', procedures: [
      p('pediatric-abdomen', 'Pediatric abdominal exploration concept', 'abdomen', ['open', 'laparoscopic'], ['bowel', 'mesentery', 'abdominal wall'], ['scale awareness', 'developmental anatomy', 'gentle spatial navigation']),
      p('pyloric', 'Pyloric surgery concept', 'upper-abdomen', ['open', 'laparoscopic'], ['stomach', 'pylorus', 'duodenum'], ['pyloric orientation', 'wall layers', 'regional anatomy']),
      p('orchiopexy', 'Orchiopexy concept', 'groin-scrotum', ['open', 'laparoscopic'], ['testis', 'spermatic cord', 'inguinal canal', 'scrotum'], ['cord length geometry', 'inguinal pathway', 'gonadal orientation']),
    ],
  },
  {
    id: 'urology', label: 'Urology', procedures: [
      p('turbt', 'Transurethral bladder procedure concept', 'pelvis', ['endoscopic'], ['urethra', 'bladder', 'ureteric orifices'], ['endoscopic orientation', 'wall mapping', 'orifice awareness']),
      p('turp', 'Transurethral prostate procedure concept', 'pelvis', ['endoscopic'], ['urethra', 'prostate', 'bladder neck', 'verumontanum'], ['endoscopic landmarks', 'prostatic zones', 'outlet geometry']),
      p('pcnl', 'Percutaneous renal access concept', 'flank', ['percutaneous'], ['kidney', 'calyces', 'renal pelvis', 'adjacent organs'], ['collecting-system map', 'access trajectory', 'regional safety geometry']),
      p('nephrectomy', 'Nephrectomy concept', 'retroperitoneum', ['open', 'laparoscopic', 'robotic'], ['kidney', 'renal artery', 'renal vein', 'ureter', 'adrenal'], ['hilar anatomy', 'retroperitoneal planes', 'organ mobilization concept']),
    ],
  },
  {
    id: 'plastic', label: 'Plastic & Reconstructive Surgery', procedures: [
      p('local-flap', 'Local flap geometry concept', 'surface', ['open'], ['skin', 'subcutaneous tissue', 'perforators'], ['tissue movement', 'pivot geometry', 'vascular-territory concept']),
      p('free-flap', 'Free flap concept', 'multi-region', ['microsurgical'], ['donor vessels', 'recipient vessels', 'flap tissue'], ['pedicle orientation', 'recipient-site geometry', 'reconstructive planning']),
      p('tendon-repair', 'Tendon repair concept', 'hand-limb', ['open'], ['tendon', 'sheath', 'pulley', 'neurovascular bundles'], ['tendon course', 'gliding environment', 'repair-zone orientation']),
    ],
  },
  {
    id: 'orthopedic', label: 'Orthopedic Surgery', procedures: [
      p('fracture-fixation', 'Fracture fixation concept', 'limb', ['open', 'percutaneous'], ['bone', 'fracture', 'joint', 'neurovascular structures'], ['alignment axes', 'fixation construct concept', 'safe corridors']),
      p('arthroplasty', 'Joint arthroplasty concept', 'hip-knee-shoulder', ['open'], ['articular surfaces', 'bone axes', 'ligaments', 'muscles'], ['component orientation', 'mechanical axes', 'soft-tissue balance concept']),
      p('arthroscopy', 'Arthroscopy concept', 'joint', ['arthroscopic'], ['joint capsule', 'cartilage', 'ligaments', 'tendons'], ['portal orientation', 'camera triangulation', 'intra-articular mapping']),
    ],
  },
  {
    id: 'spine', label: 'Spine Surgery', procedures: [
      p('decompression', 'Spinal decompression concept', 'spine', ['posterior'], ['lamina', 'facet', 'ligamentum flavum', 'dura', 'nerve roots'], ['posterior anatomy', 'neural relationships', 'decompression geometry']),
      p('fusion', 'Spinal fixation concept', 'spine', ['posterior', 'anterior', 'lateral'], ['vertebral bodies', 'pedicles', 'discs', 'neural elements'], ['trajectory concepts', 'segmental alignment', 'construct geometry']),
      p('disc', 'Disc surgery concept', 'spine', ['posterior', 'anterior'], ['disc', 'nerve root', 'dura', 'vertebral body'], ['disc-root relationship', 'approach geometry', 'level orientation']),
    ],
  },
  {
    id: 'hand', label: 'Hand Surgery', procedures: [
      p('carpal-tunnel', 'Carpal tunnel release concept', 'wrist', ['open', 'endoscopic'], ['transverse carpal ligament', 'median nerve', 'flexor tendons'], ['tunnel anatomy', 'nerve position', 'safe plane concept']),
      p('digital-tendon', 'Digital tendon concept', 'finger', ['open'], ['flexor tendons', 'pulleys', 'digital nerves', 'digital arteries'], ['zone anatomy', 'gliding system', 'neurovascular relationships']),
      p('hand-fracture', 'Hand fracture concept', 'hand', ['open', 'percutaneous'], ['metacarpals', 'phalanges', 'joints', 'tendons'], ['rotation alignment', 'articular relationships', 'fixation geometry']),
    ],
  },
  {
    id: 'neurosurgery', label: 'Neurosurgery', procedures: [
      p('craniotomy', 'Craniotomy orientation concept', 'cranium', ['open'], ['scalp', 'skull', 'dura', 'cortex', 'vascular territories'], ['surface-to-cortex layers', 'trajectory planning', 'vascular awareness']),
      p('ventricular-access', 'Ventricular access concept', 'brain', ['percutaneous'], ['lateral ventricles', 'foramina', 'cortex', 'deep nuclei'], ['ventricular geometry', 'trajectory concept', 'depth awareness']),
      p('spinal-neuro', 'Spinal neural decompression concept', 'spine', ['posterior'], ['dura', 'cord', 'roots', 'lamina'], ['neural anatomy', 'segmental localization', 'posterior approach concept']),
    ],
  },
  {
    id: 'ent', label: 'ENT / Head & Neck Surgery', procedures: [
      p('tonsil', 'Tonsillar surgery concept', 'oropharynx', ['transoral'], ['tonsil', 'tonsillar fossa', 'palatal arches', 'regional vessels'], ['oropharyngeal orientation', 'fossa anatomy', 'surface landmarks']),
      p('sinus', 'Endoscopic sinus concept', 'nose-sinuses', ['endoscopic'], ['nasal cavity', 'turbinates', 'ostiomeatal complex', 'orbit', 'skull base'], ['sinonasal landmarks', 'orbit/skull-base boundaries', 'endoscopic navigation']),
      p('neck-dissection', 'Neck compartment surgery concept', 'neck', ['open'], ['carotid sheath', 'cranial nerves', 'lymphatic levels', 'SCM'], ['neck levels', 'nerve-vessel map', 'compartment orientation']),
    ],
  },
  {
    id: 'ophthalmology', label: 'Ophthalmic Surgery', procedures: [
      p('cataract', 'Cataract surgery concept', 'eye', ['microsurgical'], ['cornea', 'anterior chamber', 'iris', 'lens capsule', 'lens'], ['anterior-segment depth', 'capsular geometry', 'optical-axis orientation']),
      p('retina', 'Vitreoretinal surgery concept', 'eye', ['microsurgical'], ['vitreous', 'retina', 'macula', 'optic disc'], ['posterior-segment orientation', 'retinal landmarks', 'instrument-space concept']),
      p('glaucoma', 'Aqueous outflow surgery concept', 'eye', ['microsurgical'], ['anterior chamber angle', 'trabecular meshwork', 'sclera', 'conjunctiva'], ['aqueous pathway', 'angle anatomy', 'outflow concept']),
    ],
  },
  {
    id: 'obgyn', label: 'Obstetric & Gynecologic Surgery', procedures: [
      p('cesarean', 'Cesarean delivery anatomy concept', 'pelvis-abdomen', ['open'], ['abdominal wall', 'uterus', 'bladder', 'placental region'], ['layer orientation', 'uterine anatomy', 'pelvic relationships']),
      p('hysterectomy', 'Hysterectomy concept', 'pelvis', ['open', 'laparoscopic', 'robotic'], ['uterus', 'ureters', 'uterine vessels', 'bladder', 'rectum'], ['pelvic vascular anatomy', 'ureter relationship', 'support structures']),
      p('adnexal', 'Adnexal surgery concept', 'pelvis', ['laparoscopic', 'open'], ['ovary', 'tube', 'infundibulopelvic ligament', 'ureter'], ['adnexal orientation', 'vascular pedicle concept', 'ureter awareness']),
    ],
  },
  {
    id: 'trauma', label: 'Trauma Surgery', procedures: [
      p('damage-control-abdomen', 'Damage-control abdomen concept', 'abdomen', ['open'], ['solid organs', 'bowel', 'major vessels', 'retroperitoneum'], ['regional prioritization', 'hemorrhage-source mapping', 'temporary-control concepts']),
      p('thoracic-trauma', 'Thoracic trauma concept', 'thorax', ['open', 'tube-access'], ['lung', 'pleura', 'heart', 'great vessels'], ['thoracic compartments', 'life-threatening pattern recognition', 'access orientation']),
      p('pelvic-trauma', 'Pelvic trauma concept', 'pelvis', ['open', 'endovascular'], ['pelvic ring', 'iliac vessels', 'bladder', 'rectum'], ['bleeding territories', 'pelvic geometry', 'multidisciplinary pathway concept']),
    ],
  },
  {
    id: 'laparoscopy', label: 'Laparoscopic Skills', procedures: [
      p('camera-navigation', 'Camera navigation gym', 'synthetic-cavity', ['laparoscopic'], ['camera', 'target', 'horizon', 'ports'], ['centering', 'horizon control', 'depth perception']),
      p('triangulation', 'Instrument triangulation gym', 'synthetic-cavity', ['laparoscopic'], ['ports', 'instruments', 'target'], ['instrument-camera geometry', 'bimanual coordination concept', 'target approach']),
      p('suturing', 'Synthetic suturing geometry', 'synthetic-cavity', ['laparoscopic'], ['needle', 'target plane', 'instrument tips'], ['needle orientation', 'entry-exit geometry', 'knot sequence concept']),
    ],
  },
] as const

export const BODY_SURGERY_SPECIALTY_COUNT = BODY_SURGERY_UNIVERSE.length
export const BODY_SURGERY_PROCEDURE_COUNT = BODY_SURGERY_UNIVERSE.reduce((sum, specialty) => sum + specialty.procedures.length, 0)

export function surgicalSpecialty(id: SurgicalSpecialtyId) {
  return BODY_SURGERY_UNIVERSE.find((specialty) => specialty.id === id)
}

export function allSurgicalProcedureConcepts() {
  return BODY_SURGERY_UNIVERSE.flatMap((specialty) => specialty.procedures.map((procedure) => ({ specialty: specialty.id, specialtyLabel: specialty.label, ...procedure })))
}

export function searchSurgicalUniverse(query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return allSurgicalProcedureConcepts()
  return allSurgicalProcedureConcepts().filter((procedure) => [procedure.title, procedure.region, procedure.specialtyLabel, ...procedure.approach, ...procedure.anatomy, ...procedure.learningTargets].join(' ').toLowerCase().includes(normalized))
}

export const BODY_SURGERY_UNIVERSE_RULES = {
  realPatientSpecific: false,
  autonomousSurgery: false,
  validatedSkillAssessment: false,
  educationalSpatialConcepts: true,
  sourceBackedAnatomyRequiredForGoldStandard: true,
} as const
