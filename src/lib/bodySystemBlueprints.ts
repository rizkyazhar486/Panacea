import type { BodySystemId } from './bodySystemSourceWave'

export interface BodySystemBlueprint {
  id: BodySystemId
  label: string
  regions: readonly string[]
  structures: readonly string[]
  physiology: readonly string[]
  imaging: readonly string[]
  pathologyConcepts: readonly string[]
  procedures: readonly string[]
  microWorlds: readonly string[]
  simulations: readonly string[]
  sourceBundles: readonly string[]
  qualityTargets: readonly string[]
}

export const BODY_SYSTEM_BLUEPRINTS: readonly BodySystemBlueprint[] = [
  {
    id: 'cardiovascular',
    label: 'Cardiovascular',
    regions: ['thorax', 'heart', 'neck vessels', 'aorta', 'upper-limb vessels', 'abdominal vessels', 'pelvic vessels', 'lower-limb vessels'],
    structures: ['atria', 'ventricles', 'septum', 'tricuspid valve', 'pulmonary valve', 'mitral valve', 'aortic valve', 'aortic root', 'coronary arteries', 'cardiac veins', 'conduction system', 'pericardium', 'aorta', 'pulmonary arteries', 'pulmonary veins', 'vena cavae', 'carotid arteries', 'subclavian vessels', 'iliac vessels', 'femoral vessels', 'microcirculation'],
    physiology: ['cardiac cycle', 'pressure-volume relationships', 'electrical conduction', 'coronary perfusion', 'systemic hemodynamics', 'vascular resistance', 'venous return', 'microvascular exchange', 'oxygen delivery'],
    imaging: ['ECG spatial map', 'echocardiography', 'cardiac CT', 'coronary CT', 'cardiac MRI concept', 'angiography', 'vascular ultrasound'],
    pathologyConcepts: ['ischemia', 'infarction', 'heart failure', 'valve dysfunction', 'arrhythmia', 'pericardial disease', 'aneurysm', 'atherosclerosis', 'arterial occlusion', 'venous thrombosis', 'shock'],
    procedures: ['cardiac catheterization concept', 'PCI concept', 'CABG concept', 'valve surgery concept', 'pericardial access concept', 'vascular bypass concept', 'endovascular repair concept'],
    microWorlds: ['myocardium', 'cardiomyocyte', 'sarcomere', 'endothelium', 'atheroma microenvironment', 'platelet-coagulation surface'],
    simulations: ['cardiac cycle engine', 'pressure-volume loop', 'coronary flow map', 'arrhythmia clock', 'shock sandbox', 'vascular pulse', 'thrombus sandbox'],
    sourceBundles: ['cardiovascular.glb'],
    qualityTargets: ['four-chamber spatial accuracy', 'valve orientation', 'great-vessel continuity', 'coronary territory clarity', 'whole-body arterial/venous context'],
  },
  {
    id: 'nervous',
    label: 'Nervous',
    regions: ['brain', 'cranial base', 'brainstem', 'cerebellum', 'spinal cord', 'plexuses', 'upper-limb nerves', 'lower-limb nerves', 'autonomic pathways'],
    structures: ['cerebral lobes', 'cortical gyri', 'basal ganglia', 'thalamus', 'hypothalamus', 'ventricles', 'brainstem nuclei context', 'cerebellum', 'meninges', 'cranial nerves', 'spinal cord segments', 'dorsal columns', 'spinothalamic tracts', 'corticospinal tracts', 'brachial plexus', 'lumbosacral plexus', 'peripheral nerves'],
    physiology: ['action potentials', 'synaptic transmission', 'sensory pathways', 'motor pathways', 'autonomic control', 'CSF circulation', 'cerebral perfusion', 'neurovascular coupling', 'reflexes'],
    imaging: ['head CT', 'CTA', 'MRI T1/T2/FLAIR', 'DWI/ADC', 'susceptibility concept', 'spine MRI', 'EEG topography concept'],
    pathologyConcepts: ['ischemic stroke', 'intracranial hemorrhage', 'seizure', 'myelopathy', 'neuropathy', 'demyelination concept', 'raised intracranial pressure', 'compressive lesions', 'movement-disorder circuits'],
    procedures: ['lumbar puncture concept', 'ventricular access concept', 'craniotomy orientation', 'spinal decompression concept', 'nerve block anatomy concept'],
    microWorlds: ['neuron', 'synapse', 'myelin', 'astrocyte', 'microglia', 'blood-brain barrier', 'axon transport'],
    simulations: ['stroke territory explorer', 'tract lesion game', 'ICP box', 'neural firing trails', 'reflex circuit', 'EEG rhythm teaching world'],
    sourceBundles: ['nervous.glb'],
    qualityTargets: ['tract continuity', 'crossing logic', 'brainstem density', 'cranial nerve exits', 'peripheral nerve routes', 'vascular-territory overlays'],
  },
  {
    id: 'respiratory',
    label: 'Respiratory',
    regions: ['nose', 'pharynx', 'larynx', 'trachea', 'bronchial tree', 'lungs', 'pleura', 'diaphragm', 'thoracic cage'],
    structures: ['nasal cavity', 'pharynx', 'larynx', 'trachea', 'main bronchi', 'lobar bronchi', 'segmental bronchi', 'bronchioles', 'alveoli', 'pulmonary capillaries', 'pleura', 'diaphragm', 'intercostal muscles'],
    physiology: ['airflow', 'ventilation mechanics', 'compliance', 'airway resistance', 'gas diffusion', 'V/Q matching', 'dead space', 'shunt concept', 'respiratory drive', 'acid-base integration'],
    imaging: ['chest radiograph', 'chest CT', 'CT pulmonary angiography concept', 'lung ultrasound', 'bronchoscopy view', 'pulmonary function traces'],
    pathologyConcepts: ['airway obstruction', 'bronchospasm', 'emphysema concept', 'pneumonia pattern', 'ARDS physiology', 'pulmonary edema', 'pulmonary embolism', 'pneumothorax', 'pleural effusion', 'interstitial pattern'],
    procedures: ['bronchoscopy concept', 'thoracentesis concept', 'pleural drainage concept', 'airway access anatomy concept', 'thoracic surgery orientation'],
    microWorlds: ['alveolar unit', 'type I pneumocyte', 'type II pneumocyte', 'surfactant', 'alveolar macrophage', 'cilia-mucus system'],
    simulations: ['airflow particles', 'alveolar breathing field', 'ventilator mechanics lab', 'V/Q map', 'bronchial flow tree', 'pleural pressure sandbox'],
    sourceBundles: ['visceral.glb', 'muscular.glb'],
    qualityTargets: ['branching airway continuity', 'lobar/segmental orientation', 'pleural envelope', 'diaphragm mechanics', 'alveolar micro-world transition'],
  },
  {
    id: 'digestive',
    label: 'Digestive',
    regions: ['oral cavity', 'pharynx', 'esophagus', 'stomach', 'small bowel', 'colon', 'rectum', 'liver', 'gallbladder', 'pancreas', 'portal system'],
    structures: ['esophagus', 'stomach', 'duodenum', 'jejunum', 'ileum', 'cecum', 'appendix', 'colon', 'rectum', 'liver segments', 'gallbladder', 'bile ducts', 'pancreas', 'mesentery', 'portal vein', 'hepatic veins'],
    physiology: ['swallowing', 'gastric secretion', 'motility', 'digestion', 'absorption', 'bile physiology', 'pancreatic secretion', 'portal circulation', 'hepatic metabolism', 'defecation'],
    imaging: ['abdominal radiograph concept', 'abdominal CT', 'hepatobiliary ultrasound', 'endoscopy', 'colonoscopy', 'MRCP concept', 'angiographic bleeding concept'],
    pathologyConcepts: ['reflux', 'ulceration', 'obstruction', 'inflammation', 'ischemia', 'GI bleeding', 'pancreatitis', 'biliary obstruction', 'cirrhosis', 'portal hypertension', 'ascites'],
    procedures: ['upper endoscopy concept', 'colonoscopy concept', 'paracentesis concept', 'cholecystectomy concept', 'bowel resection concept', 'liver surgery concept', 'pancreatic surgery concept'],
    microWorlds: ['GI wall', 'intestinal villus', 'enterocyte', 'hepatic lobule', 'hepatocyte', 'bile canaliculus', 'pancreatic acinus', 'islet context'],
    simulations: ['GI transit timeline', 'portal pressure world', 'nutrient journey', 'bile flow map', 'hepatic microcirculation', 'endoscopic lumen flight'],
    sourceBundles: ['visceral.glb'],
    qualityTargets: ['continuous luminal tract', 'mesenteric relationships', 'portal circulation', 'hepatobiliary branching', 'pancreatic spatial relationships'],
  },
  {
    id: 'urinary',
    label: 'Urinary',
    regions: ['retroperitoneum', 'kidneys', 'ureters', 'bladder', 'urethra', 'pelvic floor'],
    structures: ['renal cortex', 'renal medulla', 'pyramids', 'calyces', 'renal pelvis', 'renal artery', 'renal vein', 'ureters', 'bladder', 'urethra', 'nephron'],
    physiology: ['glomerular filtration', 'tubular reabsorption', 'tubular secretion', 'countercurrent concentration', 'water balance', 'electrolyte balance', 'acid-base control', 'RAAS integration', 'micturition'],
    imaging: ['renal ultrasound', 'bladder ultrasound', 'noncontrast stone CT concept', 'contrast urinary CT concept', 'cystoscopy view', 'renal angiography concept'],
    pathologyConcepts: ['AKI framework', 'glomerular injury', 'tubular injury', 'obstruction', 'stones', 'infection', 'proteinuria concept', 'hematuria localization', 'retention'],
    procedures: ['urinary catheterization anatomy concept', 'cystoscopy concept', 'PCNL access concept', 'ureteroscopy concept', 'renal biopsy concept', 'dialysis circuit concept'],
    microWorlds: ['glomerulus', 'podocyte', 'proximal tubule', 'loop of Henle', 'distal tubule', 'collecting duct', 'transport proteins'],
    simulations: ['nephron flow simulator', 'acid-base mixer', 'urine concentration lab', 'RAAS loop', 'obstruction pressure map'],
    sourceBundles: ['visceral.glb'],
    qualityTargets: ['renal hilar anatomy', 'collecting-system continuity', 'ureter route', 'bladder outlet', 'nephron micro-world'],
  },
  {
    id: 'endocrine',
    label: 'Endocrine',
    regions: ['hypothalamus', 'pituitary', 'neck', 'adrenals', 'pancreatic islets', 'gonads'],
    structures: ['hypothalamus', 'pituitary', 'thyroid', 'parathyroids', 'adrenal cortex', 'adrenal medulla', 'pancreatic islets', 'ovaries', 'testes'],
    physiology: ['HPA axis', 'HPT axis', 'HPG axis', 'growth axis', 'prolactin control', 'calcium-PTH-vitamin D axis', 'insulin-glucagon control', 'catecholamine response', 'circadian endocrine rhythms'],
    imaging: ['pituitary MRI', 'thyroid ultrasound', 'thyroid uptake concept', 'adrenal CT/MRI concept', 'endocrine nuclear imaging concept'],
    pathologyConcepts: ['hormone deficiency', 'hormone excess', 'thyrotoxicosis', 'hypothyroid physiology', 'adrenal crisis', 'cortisol excess concept', 'hypercalcemia framework', 'diabetes physiology', 'DKA'],
    procedures: ['thyroid FNA concept', 'thyroid surgery concept', 'adrenal surgery concept', 'pituitary surgical orientation concept'],
    microWorlds: ['thyroid follicle', 'parathyroid cell', 'adrenal cortical cell', 'chromaffin cell', 'beta cell', 'hormone receptor signaling'],
    simulations: ['thyroid feedback loop', 'glucose-insulin control loop', 'calcium homeostasis loop', 'cortisol circadian ring', 'endocrine orbital feedback'],
    sourceBundles: ['visceral.glb'],
    qualityTargets: ['axis connectivity', 'organ locations', 'feedback visualization', 'cellular hormone production', 'target-organ signaling'],
  },
  {
    id: 'reproductive',
    label: 'Reproductive',
    regions: ['pelvis', 'uterus', 'adnexa', 'vagina', 'testes', 'epididymis', 'prostate', 'external genital context'],
    structures: ['uterus', 'endometrium', 'myometrium', 'cervix', 'fallopian tubes', 'ovaries', 'vagina', 'testes', 'epididymides', 'vas deferens', 'seminal vesicles', 'prostate'],
    physiology: ['menstrual cycle', 'ovulation', 'implantation concept', 'pregnancy adaptation', 'fetal circulation', 'spermatogenesis', 'sexual response physiology', 'HPG feedback'],
    imaging: ['pelvic ultrasound', 'early pregnancy ultrasound concept', 'pelvic MRI', 'scrotal ultrasound', 'prostate MRI concept', 'hysteroscopy view'],
    pathologyConcepts: ['ectopic implantation concept', 'endometriosis', 'fibroid geometry', 'ovarian mass framework', 'torsion concept', 'BPH', 'testicular torsion concept', 'infertility pathways'],
    procedures: ['hysteroscopy concept', 'cesarean anatomy concept', 'hysterectomy concept', 'adnexal surgery concept', 'orchiopexy concept', 'TURP concept'],
    microWorlds: ['ovarian follicle', 'endometrium', 'placental interface', 'seminiferous tubule', 'Sertoli/Leydig neighborhood', 'gamete development'],
    simulations: ['cycle ring', 'fetal circulation flow', 'pregnancy timeline', 'spermatogenesis timeline', 'pelvic ultrasound beam'],
    sourceBundles: ['visceral.glb'],
    qualityTargets: ['pelvic organ relationships', 'gonadal anatomy', 'cycle-time synchronization', 'pregnancy state transitions', 'reproductive micro-worlds'],
  },
  {
    id: 'lymphatic-immune',
    label: 'Lymphatic / Immune',
    regions: ['bone marrow context', 'thymus', 'cervical nodes', 'axillary nodes', 'mediastinal nodes', 'abdominal nodes', 'pelvic nodes', 'inguinal nodes', 'spleen', 'mucosal lymphoid tissue'],
    structures: ['lymphatic vessels', 'lymph nodes', 'thoracic duct', 'right lymphatic duct', 'thymus', 'spleen', 'tonsils', 'bone marrow context'],
    physiology: ['interstitial fluid return', 'lymph transport', 'antigen presentation', 'innate response', 'adaptive response', 'clonal expansion', 'antibody production', 'immune memory'],
    imaging: ['nodal CT map', 'PET-style metabolic concept', 'ultrasound nodal concept', 'histology navigation'],
    pathologyConcepts: ['lymphatic obstruction', 'edema', 'infection response', 'autoimmune concept', 'immunodeficiency concept', 'lymphoid proliferation concept', 'systemic inflammation'],
    procedures: ['lymph node biopsy orientation', 'splenic surgical orientation', 'central lymphatic access concept'],
    microWorlds: ['lymph node follicle', 'paracortex', 'spleen red/white pulp', 'T cell', 'B cell', 'macrophage', 'dendritic cell', 'antibody-receptor interaction'],
    simulations: ['immune response arena', 'lymph flow network', 'antigen chase', 'clonal expansion timeline', 'inflammation field'],
    sourceBundles: ['lymphoid.glb'],
    qualityTargets: ['whole-body nodal map', 'lymphatic return continuity', 'immune organ microarchitecture', 'cell interaction visualization'],
  },
  {
    id: 'musculoskeletal',
    label: 'Musculoskeletal / Articular',
    regions: ['skull', 'spine', 'thorax', 'shoulder', 'upper arm', 'elbow', 'forearm', 'wrist', 'hand', 'pelvis', 'hip', 'thigh', 'knee', 'leg', 'ankle', 'foot'],
    structures: ['bones', 'joints', 'articular cartilage', 'ligaments', 'muscles', 'tendons', 'fascia', 'bursae', 'entheses'],
    physiology: ['muscle contraction', 'force transmission', 'joint kinematics', 'gait', 'postural control', 'bone remodeling', 'tendon elasticity', 'load adaptation'],
    imaging: ['radiography', 'CT bone concept', 'MRI joint concept', 'musculoskeletal ultrasound', '3D fracture map'],
    pathologyConcepts: ['fracture', 'dislocation', 'ligament injury', 'tendon injury', 'osteoarthritis concept', 'bone tumor concept', 'infection concept', 'compartment pressure concept'],
    procedures: ['fracture fixation concept', 'arthroplasty concept', 'arthroscopy concept', 'spine fixation concept', 'hand surgery concept', 'rehabilitation planning'],
    microWorlds: ['cortical bone', 'trabecular bone', 'osteon', 'osteocyte', 'skeletal myocyte', 'sarcomere', 'tendon fascicle', 'cartilage matrix'],
    simulations: ['gait lab', 'running economy', 'jump lab', 'throwing chain', 'joint stress map', 'spine loading', 'fracture builder', 'fixation sandbox'],
    sourceBundles: ['skeletal.glb', 'muscular.glb'],
    qualityTargets: ['whole skeleton continuity', 'major muscle coverage', 'joint-specific layers', 'biomechanics vectors', 'motion-synchronized muscle highlighting'],
  },
  {
    id: 'sensory-ent',
    label: 'Sensory / ENT',
    regions: ['orbit', 'eye', 'ear', 'nose', 'sinuses', 'oral cavity', 'pharynx', 'larynx', 'neck'],
    structures: ['globe', 'cornea', 'iris', 'lens', 'retina', 'optic nerve', 'extraocular muscles', 'lacrimal system', 'external ear', 'middle ear', 'cochlea', 'vestibular labyrinth', 'nasal cavity', 'sinuses', 'tongue', 'larynx'],
    physiology: ['optics', 'accommodation', 'pupillary reflex', 'phototransduction', 'visual pathway', 'hearing transduction', 'vestibular sensing', 'olfaction concept', 'taste concept', 'phonation', 'swallowing'],
    imaging: ['ocular ultrasound concept', 'fundus view', 'OCT-style layer concept', 'orbital CT/MRI', 'temporal-bone CT concept', 'sinus CT', 'endoscopy', 'laryngoscopy'],
    pathologyConcepts: ['corneal disease concept', 'lens opacity', 'glaucoma physiology', 'retinal vascular disease concept', 'optic neuropathy concept', 'hearing loss framework', 'vestibular dysfunction', 'sinus disease concept', 'airway obstruction concept'],
    procedures: ['cataract surgery concept', 'retinal surgery concept', 'glaucoma surgery concept', 'sinus surgery concept', 'tonsillar surgery concept', 'laryngeal surgery orientation'],
    microWorlds: ['corneal layers', 'retinal layers', 'photoreceptor', 'trabecular meshwork', 'cochlear hair cell', 'olfactory epithelium'],
    simulations: ['eye optical ray trace', 'pupillary reflex circuit', 'visual pathway flight', 'cochlear traveling wave', 'vestibular motion lab', 'voice airflow', 'swallow sequence'],
    sourceBundles: ['visceral.glb', 'nervous.glb'],
    qualityTargets: ['eye gold-standard depth', 'optic pathway continuity', 'cochlear spatial logic', 'sinonasal boundaries', 'laryngeal mechanics'],
  },
  {
    id: 'integumentary-surface',
    label: 'Integumentary / Surface',
    regions: ['scalp', 'face', 'neck', 'trunk', 'upper limbs', 'hands', 'pelvis', 'lower limbs', 'feet'],
    structures: ['skin surface', 'epidermis', 'dermis', 'subcutis', 'hair follicles', 'sebaceous glands', 'sweat glands', 'cutaneous vessels', 'cutaneous nerves', 'nails'],
    physiology: ['barrier function', 'keratinization', 'pigmentation', 'thermoregulation', 'sensation', 'wound healing', 'vitamin D synthesis concept'],
    imaging: ['surface photography concept', 'dermoscopy-style view', 'skin ultrasound concept', 'histology navigator'],
    pathologyConcepts: ['inflammation', 'infection', 'pigment change', 'barrier disruption', 'wound', 'scar', 'tumor morphology concept', 'burn depth concept'],
    procedures: ['biopsy orientation concept', 'excision geometry', 'local flap concept', 'wound closure concept', 'burn surface mapping'],
    microWorlds: ['epidermal layers', 'keratinocyte', 'melanocyte', 'hair follicle', 'sweat gland', 'collagen matrix', 'wound-healing cells'],
    simulations: ['skin depth microscope', 'wound-healing timeline', 'thermoregulation map', 'pain referral surface', 'burn-depth teaching map'],
    sourceBundles: ['surface.glb'],
    qualityTargets: ['continuous whole-body surface', 'regional dermatome overlays', 'surface-to-depth transition', 'appendage micro-worlds'],
  },
] as const

export function bodySystemBlueprint(id: BodySystemId) {
  return BODY_SYSTEM_BLUEPRINTS.find((blueprint) => blueprint.id === id)
}

export function bodySystemBlueprintStats() {
  return BODY_SYSTEM_BLUEPRINTS.map((blueprint) => ({
    id: blueprint.id,
    regions: blueprint.regions.length,
    structures: blueprint.structures.length,
    physiology: blueprint.physiology.length,
    imaging: blueprint.imaging.length,
    pathologyConcepts: blueprint.pathologyConcepts.length,
    procedures: blueprint.procedures.length,
    microWorlds: blueprint.microWorlds.length,
    simulations: blueprint.simulations.length,
  }))
}

export function searchBodySystemBlueprints(query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return BODY_SYSTEM_BLUEPRINTS
  return BODY_SYSTEM_BLUEPRINTS.filter((blueprint) => [
    blueprint.label,
    ...blueprint.regions,
    ...blueprint.structures,
    ...blueprint.physiology,
    ...blueprint.imaging,
    ...blueprint.pathologyConcepts,
    ...blueprint.procedures,
    ...blueprint.microWorlds,
    ...blueprint.simulations,
  ].join(' ').toLowerCase().includes(normalized))
}

export const BODY_SYSTEM_BLUEPRINT_META = {
  systemCount: BODY_SYSTEM_BLUEPRINTS.length,
  wholeBodyFirst: true,
  goldStandardOrgansFollow: true,
  clinicalClaimsRequireReview: true,
  sourceBackedAnatomyPreferred: true,
} as const
