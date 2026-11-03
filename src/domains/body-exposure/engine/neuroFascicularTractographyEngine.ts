/**
 * @file neuroFascicularTractographyEngine.ts
 * @description High-Density Cranial Nerve Reflex Arcs, Long Tracts & Neurovascular Deficit Localizer (Pillar VII).
 * Models 12 cranial nerves, 4 brainstem reflex loops, 3 somatosensory/motor long tracts,
 * and classic vascular brainstem/spinal syndromic deficit localization.
 *
 * Truth Class: MECHANISTIC_SIMULATION_PROXY.
 * Pure deterministic mathematics and anatomical taxonomy. Never manufactures biomarkers.
 */

export interface CranialNerveProfile {
  id: string
  number: number
  roman: string
  name: string
  functionalTypes: Array<'GSA' | 'GSE' | 'GVA' | 'GVE' | 'SVA' | 'SVE' | 'SSA'>
  originNuclei: string[]
  exitForamen: string
  brainstemLevel: 'Telencephalon' | 'Diencephalon' | 'Midbrain' | 'Pons' | 'Pontomedullary' | 'Medulla' | 'Spinal Cord'
  innervation: string
  clinicalTest: string
  reflexArcs: string[]
}

export interface BrainstemReflexArc {
  id: string
  name: string
  afferentCranialNerve: string
  afferentNucleus: string
  centralPathways: string
  efferentCranialNerve: string
  efferentNuclei: string[]
  efferentTarget: string
  normalResponse: string
  latencyMs: number
  clinicalSignificance: string
}

export interface LongTractProfile {
  id: string
  name: string
  modality: string
  firstOrderNeuron: string
  decussationLevel: string
  tractLocationSpinalCord: string
  termination: string
  ipsilateralAboveDecussation: boolean
}

export interface NeuroLesionSyndrome {
  id: string
  name: string
  anatomicLocation: string
  vascularTerritory: string
  affectedStructures: string[]
  cranialNervePalsies: string[]
  motorDeficit: string
  sensoryDeficit: string
  reflexDeficit: string
  ataxiaOrHorner: string
}

export interface ReflexSimulationResult {
  reflexId: string
  reflexName: string
  stimulusSide: 'left' | 'right'
  directResponse: 'intact' | 'absent' | 'diminished'
  consensualResponse: 'intact' | 'absent' | 'diminished'
  latencyMs: number
  diagnosticSummary: string
  truthClass: 'mechanistic_simulation_proxy'
}

export interface SyndromicDeficitResult {
  syndromeId: string
  syndromeName: string
  location: string
  vascularTerritory: string
  interruptedTracts: string[]
  cranialNerveFindings: string[]
  ipsilateralBodySigns: string[]
  contralateralBodySigns: string[]
  ruleOf4Level: 'Midbrain' | 'Pons' | 'Medulla' | 'Spinal Cord'
  truthClass: 'mechanistic_simulation_proxy'
}

/** 12 Cranial Nerves Catalog */
export const CRANIAL_NERVES: CranialNerveProfile[] = [
  {
    id: 'cn-1',
    number: 1,
    roman: 'CN I',
    name: 'Olfactory Nerve',
    functionalTypes: ['SVA'],
    originNuclei: ['Olfactory bulb / primary receptor neurons'],
    exitForamen: 'Cribriform plate of ethmoid bone',
    brainstemLevel: 'Telencephalon',
    innervation: 'Olfactory neuroepithelium of nasal cavity',
    clinicalTest: 'Familiar non-irritating odors (coffee, vanilla) per nostril',
    reflexArcs: [],
  },
  {
    id: 'cn-2',
    number: 2,
    roman: 'CN II',
    name: 'Optic Nerve',
    functionalTypes: ['SSA'],
    originNuclei: ['Retinal ganglion cells'],
    exitForamen: 'Optic canal in sphenoid',
    brainstemLevel: 'Diencephalon',
    innervation: 'Retinal photoreceptors to lateral geniculate & pretectal area',
    clinicalTest: 'Visual acuity, visual fields by confrontation, fundoscopy',
    reflexArcs: ['pupillary-light-reflex'],
  },
  {
    id: 'cn-3',
    number: 3,
    roman: 'CN III',
    name: 'Oculomotor Nerve',
    functionalTypes: ['GSE', 'GVE'],
    originNuclei: ['Oculomotor nucleus', 'Edinger-Westphal nucleus'],
    exitForamen: 'Superior orbital fissure',
    brainstemLevel: 'Midbrain',
    innervation: 'SR, IR, MR, IO muscles; levator palpebrae; sphincter pupillae & ciliary muscle',
    clinicalTest: 'Eye movements (up, down, medial), eyelid elevation, pupillary constriction',
    reflexArcs: ['pupillary-light-reflex', 'vestibulo-ocular-reflex'],
  },
  {
    id: 'cn-4',
    number: 4,
    roman: 'CN IV',
    name: 'Trochlear Nerve',
    functionalTypes: ['GSE'],
    originNuclei: ['Trochlear nucleus (only dorsal brainstem exit)'],
    exitForamen: 'Superior orbital fissure',
    brainstemLevel: 'Midbrain',
    innervation: 'Superior oblique muscle (intorsion & depression in adduction)',
    clinicalTest: 'Look down and in; head tilt test (Bielschowsky sign)',
    reflexArcs: [],
  },
  {
    id: 'cn-5',
    number: 5,
    roman: 'CN V',
    name: 'Trigeminal Nerve',
    functionalTypes: ['GSA', 'SVE'],
    originNuclei: ['Mesencephalic', 'Principal sensory', 'Spinal trigeminal', 'Motor trigeminal'],
    exitForamen: 'V1: Superior orbital fissure, V2: Foramen rotundum, V3: Foramen ovale',
    brainstemLevel: 'Pons',
    innervation: 'Facial cutaneous sensation (V1, V2, V3); muscles of mastication (masseter, temporalis, pterygoids)',
    clinicalTest: 'Facial light touch / pinprick (3 divisions); corneal reflex; jaw clench and resistance',
    reflexArcs: ['corneal-blink-reflex', 'jaw-jerk-reflex'],
  },
  {
    id: 'cn-6',
    number: 6,
    roman: 'CN VI',
    name: 'Abducens Nerve',
    functionalTypes: ['GSE'],
    originNuclei: ['Abducens nucleus in dorsal pons'],
    exitForamen: 'Superior orbital fissure (longest intracranial subarachnoid course)',
    brainstemLevel: 'Pons',
    innervation: 'Lateral rectus muscle (eye abduction)',
    clinicalTest: 'Lateral gaze abduction; evaluate horizontal diplopia on lateral gaze',
    reflexArcs: ['vestibulo-ocular-reflex'],
  },
  {
    id: 'cn-7',
    number: 7,
    roman: 'CN VII',
    name: 'Facial Nerve',
    functionalTypes: ['SVE', 'GVE', 'GSA', 'SVA'],
    originNuclei: ['Facial motor nucleus', 'Superior salivatory', 'Solitary nucleus (gustatory)'],
    exitForamen: 'Internal acoustic meatus -> Stylomastoid foramen',
    brainstemLevel: 'Pontomedullary',
    innervation: 'Muscles of facial expression, stapedius; lacrimal/submandibular glands; taste anterior 2/3 tongue',
    clinicalTest: 'Smile, frown, close eyes tightly against resistance, taste testing',
    reflexArcs: ['corneal-blink-reflex'],
  },
  {
    id: 'cn-8',
    number: 8,
    roman: 'CN VIII',
    name: 'Vestibulocochlear Nerve',
    functionalTypes: ['SSA'],
    originNuclei: ['Vestibular nuclei (superior, lateral, medial, inferior)', 'Cochlear nuclei (dorsal, ventral)'],
    exitForamen: 'Internal acoustic meatus',
    brainstemLevel: 'Pontomedullary',
    innervation: 'Cochlea (hearing Organ of Corti); semicircular canals & otoliths (balance)',
    clinicalTest: 'Whispered voice, Weber & Rinne tuning fork tests, head impulse test (vHIT)',
    reflexArcs: ['vestibulo-ocular-reflex'],
  },
  {
    id: 'cn-9',
    number: 9,
    roman: 'CN IX',
    name: 'Glossopharyngeal Nerve',
    functionalTypes: ['SVE', 'GVE', 'GVA', 'GSA', 'SVA'],
    originNuclei: ['Nucleus ambiguus', 'Inferior salivatory', 'Solitary tract', 'Spinal trigeminal'],
    exitForamen: 'Jugular foramen',
    brainstemLevel: 'Medulla',
    innervation: 'Stylopharyngeus; parotid gland; carotid sinus/body chemo/baroreceptors; taste posterior 1/3 tongue',
    clinicalTest: 'Gag reflex sensory limb, swallow assessment, posterior pharyngeal sensation',
    reflexArcs: ['gag-reflex', 'carotid-sinus-reflex'],
  },
  {
    id: 'cn-10',
    number: 10,
    roman: 'CN X',
    name: 'Vagus Nerve',
    functionalTypes: ['SVE', 'GVE', 'GVA', 'GSA', 'SVA'],
    originNuclei: ['Nucleus ambiguus', 'Dorsal motor nucleus of vagus', 'Solitary tract'],
    exitForamen: 'Jugular foramen',
    brainstemLevel: 'Medulla',
    innervation: 'Pharyngeal & laryngeal muscles (recurrent laryngeal); thoracic & abdominal parasympathetic viscera',
    clinicalTest: 'Uvula symmetrical elevation on "Ah", hoarseness, swallow, cough reflex',
    reflexArcs: ['gag-reflex', 'cough-reflex'],
  },
  {
    id: 'cn-11',
    number: 11,
    roman: 'CN XI',
    name: 'Accessory Nerve',
    functionalTypes: ['SVE'],
    originNuclei: ['Spinal accessory nucleus (C1-C5 anterior horn)'],
    exitForamen: 'Enters Foramen magnum, exits Jugular foramen',
    brainstemLevel: 'Spinal Cord',
    innervation: 'Sternocleidomastoid (contralateral head rotation) & Trapezius (shoulder shrug)',
    clinicalTest: 'Shoulder shrug against resistance, head turn against resistance',
    reflexArcs: [],
  },
  {
    id: 'cn-12',
    number: 12,
    roman: 'CN XII',
    name: 'Hypoglossal Nerve',
    functionalTypes: ['GSE'],
    originNuclei: ['Hypoglossal nucleus in tegmentum of medulla'],
    exitForamen: 'Hypoglossal canal',
    brainstemLevel: 'Medulla',
    innervation: 'Intrinsic and extrinsic muscles of tongue (except palatoglossus / CN X)',
    clinicalTest: 'Tongue protrusion (deviates to side of lesion in LMN palsy), lingual speech',
    reflexArcs: [],
  },
]

/** 4 Core Brainstem Reflex Arcs */
export const BRAINSTEM_REFLEX_ARCS: BrainstemReflexArc[] = [
  {
    id: 'pupillary-light-reflex',
    name: 'Pupillary Light Reflex',
    afferentCranialNerve: 'CN II (Optic)',
    afferentNucleus: 'Pretectal nucleus (midbrain)',
    centralPathways: 'Bilateral pretectal axonal projection to both Edinger-Westphal nuclei via posterior commissure',
    efferentCranialNerve: 'CN III (Oculomotor, parasympathetic)',
    efferentNuclei: ['Edinger-Westphal nucleus (bilateral)'],
    efferentTarget: 'Ciliary ganglion -> Short ciliary nerves -> Sphincter pupillae (constriction)',
    normalResponse: 'Bilateral equal pupillary constriction to light in either eye (direct & consensual)',
    latencyMs: 180,
    clinicalSignificance: 'Distinguishes afferent conduction defect (Marcus Gunn) from uncal herniation (blown CN III pupil).',
  },
  {
    id: 'corneal-blink-reflex',
    name: 'Corneal Blink Reflex',
    afferentCranialNerve: 'CN V1 (Trigeminal - Ophthalmic)',
    afferentNucleus: 'Spinal trigeminal nucleus (pars interpolaris / caudalis)',
    centralPathways: 'Polysynaptic interneuronal projection to bilateral facial motor nuclei',
    efferentCranialNerve: 'CN VII (Facial motor)',
    efferentNuclei: ['Facial motor nucleus (bilateral)'],
    efferentTarget: 'Orbicularis oculi muscles (bilateral contraction)',
    normalResponse: 'Bilateral consensual blink upon light touch to either cornea',
    latencyMs: 40,
    clinicalSignificance: 'Evaluates brainstem integrity in coma, acoustic neuroma (CPA tumor), and Bell palsy.',
  },
  {
    id: 'gag-reflex',
    name: 'Pharyngeal Gag Reflex',
    afferentCranialNerve: 'CN IX (Glossopharyngeal)',
    afferentNucleus: 'Nucleus solitarius / spinal trigeminal nucleus',
    centralPathways: 'Interneurons project from nucleus solitarius to nucleus ambiguus',
    efferentCranialNerve: 'CN X (Vagus - branchial motor)',
    efferentNuclei: ['Nucleus ambiguus (bilateral)'],
    efferentTarget: 'Pharyngeal constrictors & levator veli palatini',
    normalResponse: 'Bilateral palate elevation and pharyngeal wall contraction upon posterior pharynx contact',
    latencyMs: 90,
    clinicalSignificance: 'Critical for airway protection and swallowing safety; impaired in Wallenberg syndrome and bulbar palsies.',
  },
  {
    id: 'vestibulo-ocular-reflex',
    name: 'Vestibulo-Ocular Reflex (VOR)',
    afferentCranialNerve: 'CN VIII (Vestibular)',
    afferentNucleus: 'Medial and superior vestibular nuclei (pontomedullary junction)',
    centralPathways: 'Ascending Medial Longitudinal Fasciculus (MLF) crossing to contralateral Abducens (CN VI) & ipsilateral Oculomotor (CN III)',
    efferentCranialNerve: 'CN VI (Abducens) & CN III (Oculomotor)',
    efferentNuclei: ['Contralateral Abducens nucleus', 'Ipsilateral Oculomotor nucleus'],
    efferentTarget: 'Contralateral Lateral Rectus & Ipsilateral Medial Rectus muscles',
    normalResponse: 'Conjugate eye movement opposite in direction and equal in velocity to rapid head rotation',
    latencyMs: 15,
    clinicalSignificance: 'Fastest reflex in human biology. Impaired in internuclear ophthalmoplegia (MS MLF lesion) and brain death.',
  },
]

/** 3 Major Long Tracts */
export const LONG_TRACTS: LongTractProfile[] = [
  {
    id: 'corticospinal-tract',
    name: 'Lateral Corticospinal Tract',
    modality: 'Voluntary motor control of extremities',
    firstOrderNeuron: 'Primary motor cortex (Precentral gyrus / Betz cells)',
    decussationLevel: 'Pyramidal decussation in caudal medulla (85-90% fibers cross)',
    tractLocationSpinalCord: 'Lateral funiculus of spinal cord',
    termination: 'Ventral horn alpha motor neurons',
    ipsilateralAboveDecussation: false,
  },
  {
    id: 'dcml-tract',
    name: 'Dorsal Column-Medial Lemniscus (DCML)',
    modality: 'Fine discriminative touch, 2-point discrimination, vibration, conscious proprioception',
    firstOrderNeuron: 'Dorsal root ganglion -> Fasciculus gracilis (T7 and below) & cuneatus (T6 and above)',
    decussationLevel: 'Internal arcuate fibers in medulla (second order neurons in nucleus gracilis/cuneatus)',
    tractLocationSpinalCord: 'Posterior (dorsal) columns',
    termination: 'Ventral posterolateral (VPL) nucleus of thalamus -> Primary somatosensory cortex (postcentral gyrus)',
    ipsilateralAboveDecussation: false,
  },
  {
    id: 'spinothalamic-tract',
    name: 'Anterolateral / Spinothalamic Tract',
    modality: 'Nociception (pain) and temperature',
    firstOrderNeuron: 'Dorsal root ganglion (A-delta and C fibers) -> Lissauer tract -> Substantia gelatinosa',
    decussationLevel: 'Anterior white commissure within 1-2 spinal cord segments of entry',
    tractLocationSpinalCord: 'Anterolateral funiculus of spinal cord',
    termination: 'VPL nucleus of thalamus -> Primary somatosensory cortex',
    ipsilateralAboveDecussation: false,
  },
]

/** Classic Brainstem & Spinal Syndromes */
export const NEURO_SYNDROMES: NeuroLesionSyndrome[] = [
  {
    id: 'weber-syndrome',
    name: 'Weber Syndrome (Superior Ventral Midbrain Alternating Hemiplegia)',
    anatomicLocation: 'Ventromedial midbrain (cerebral peduncle / crus cerebri & exiting CN III fascicles)',
    vascularTerritory: 'Paramedian branches of Basilar artery / Posterior cerebral artery (PCA)',
    affectedStructures: ['CN III oculomotor fascicles', 'Corticospinal tract in crus cerebri', 'Corticobulbar tract'],
    cranialNervePalsies: ['Ipsilateral CN III palsy: ptosis, dilated non-reactive pupil, down-and-out eye'],
    motorDeficit: 'Contralateral spastic hemiplegia (face, arm, leg) due to pre-decussation corticospinal interruption',
    sensoryDeficit: 'Spared (medial lemniscus and spinothalamic tracts are dorsolateral in tegmentum)',
    reflexDeficit: 'Ipsilateral efferent pupillary defect (direct pupillary constriction absent on affected side)',
    ataxiaOrHorner: 'None (red nucleus and sympathetic fibers are spared)',
  },
  {
    id: 'millard-gubler-syndrome',
    name: 'Millard-Gubler Syndrome (Ventral Caudal Pontine Syndrome)',
    anatomicLocation: 'Ventrolateral caudal pons basis',
    vascularTerritory: 'Circumferential / paramedian pontine perforators of Basilar artery',
    affectedStructures: ['CN VI fascicles', 'CN VII fascicles / nucleus', 'Corticospinal tract in basis pontis'],
    cranialNervePalsies: ['Ipsilateral lateral gaze palsy (CN VI)', 'Ipsilateral lower-motor-neuron facial palsy (CN VII)'],
    motorDeficit: 'Contralateral hemiplegia of upper and lower extremities',
    sensoryDeficit: 'Spared',
    reflexDeficit: 'Ipsilateral corneal reflex efferent limb absent (CN VII motor failure)',
    ataxiaOrHorner: 'None',
  },
  {
    id: 'wallenberg-syndrome',
    name: 'Wallenberg Syndrome (Lateral Medullary Syndrome)',
    anatomicLocation: 'Dorsolateral caudal medulla',
    vascularTerritory: 'Posterior Inferior Cerebellar Artery (PICA) or Vertebral Artery',
    affectedStructures: [
      'Nucleus ambiguus (CN IX, X)',
      'Spinal trigeminal nucleus & tract (CN V)',
      'Spinothalamic tract',
      'Inferior cerebellar peduncle',
      'Descending central sympathetic tract',
      'Vestibular nuclei',
    ],
    cranialNervePalsies: [
      'Ipsilateral palate drop, hoarseness, absent gag reflex, dysphagia (Nucleus ambiguus / CN IX, X)',
      'Ipsilateral facial loss of pain and temperature (Spinal trigeminal nucleus)',
    ],
    motorDeficit: 'Spared motor extremities! Corticospinal pyramids are located ventromedially and are untouched',
    sensoryDeficit: 'Alternating sensory loss: Ipsilateral face pain/temp loss + Contralateral body pain/temp loss (spinothalamic)',
    reflexDeficit: 'Absent ipsilateral gag reflex and corneal blink sensory limb',
    ataxiaOrHorner: 'Ipsilateral Horner syndrome (miosis, ptosis, anhidrosis) + Ipsilateral hemi-ataxia & dysmetria (ICP)',
  },
  {
    id: 'brown-sequard-t10',
    name: 'Brown-Séquard Syndrome (Spinal Cord Hemisection at T10)',
    anatomicLocation: 'Right hemicord lesion at T10 spinal level',
    vascularTerritory: 'Sulcal artery / spinal cord penetrating vessel (or trauma / compression)',
    affectedStructures: [
      'Ipsilateral lateral corticospinal tract',
      'Ipsilateral dorsal column (fasciculus gracilis)',
      'Contralateral spinothalamic tract fibers ascending from T12 and below',
      'Local anterior horn & dorsal horn at T10',
    ],
    cranialNervePalsies: ['None (spinal level)'],
    motorDeficit: 'Ipsilateral spastic paresis / paralysis below T10 (right leg)',
    sensoryDeficit: 'Dissociated sensory loss: Ipsilateral loss of vibration and joint position sense below T10 + Contralateral loss of pain and temperature starting 1-2 segments below (left leg)',
    reflexDeficit: 'Ipsilateral hyperreflexia (patellar, Achilles) & extensor plantar (Babinski) response below lesion',
    ataxiaOrHorner: 'Spared (cranial sympathetic outflow is above T1)',
  },
]

/**
 * Simulates testing a brainstem reflex arc with specified component integrity.
 */
export function simulateReflexArc(
  reflexId: string,
  stimulusSide: 'left' | 'right',
  options?: {
    afferentIntact?: boolean
    centralIntact?: boolean
    efferentIpsilateralIntact?: boolean
    efferentContralateralIntact?: boolean
  },
): ReflexSimulationResult {
  const reflex = BRAINSTEM_REFLEX_ARCS.find((r) => r.id === reflexId) ?? BRAINSTEM_REFLEX_ARCS[0]
  const afferent = options?.afferentIntact ?? true
  const central = options?.centralIntact ?? true
  const efferentIpsi = options?.efferentIpsilateralIntact ?? true
  const efferentContra = options?.efferentContralateralIntact ?? true

  let direct: 'intact' | 'absent' | 'diminished' = 'intact'
  let consensual: 'intact' | 'absent' | 'diminished' = 'intact'
  let summary = 'Normal physiological reflex arc.'

  if (!afferent) {
    direct = 'absent'
    consensual = 'absent'
    summary = `Afferent limb defect in ${reflex.afferentCranialNerve} on the ${stimulusSide} side: neither direct nor consensual response elicited.`
  } else if (!central) {
    direct = 'absent'
    consensual = 'absent'
    summary = `Brainstem interneuronal / nuclear lesion at ${reflex.afferentNucleus}: complete reflex dissociation.`
  } else {
    direct = efferentIpsi ? 'intact' : 'absent'
    consensual = efferentContra ? 'intact' : 'absent'

    if (!efferentIpsi && efferentContra) {
      summary = `Isolated efferent palsy of ${reflex.efferentCranialNerve} on stimulus side: direct absent, but consensual response on opposite side is preserved.`
    } else if (efferentIpsi && !efferentContra) {
      summary = `Efferent palsy of ${reflex.efferentCranialNerve} on contralateral side: direct response intact, consensual response absent.`
    } else if (!efferentIpsi && !efferentContra) {
      summary = `Bilateral efferent failure of ${reflex.efferentCranialNerve}.`
    }
  }

  return {
    reflexId: reflex.id,
    reflexName: reflex.name,
    stimulusSide,
    directResponse: direct,
    consensualResponse: consensual,
    latencyMs: reflex.latencyMs,
    diagnosticSummary: summary,
    truthClass: 'mechanistic_simulation_proxy',
  }
}

/**
 * Resolves full neurological findings for a classic neurovascular syndrome.
 */
export function evaluateNeurologicalSyndrome(syndromeId: string): SyndromicDeficitResult {
  const syn = NEURO_SYNDROMES.find((s) => s.id === syndromeId) ?? NEURO_SYNDROMES[0]

  let ruleOf4Level: 'Midbrain' | 'Pons' | 'Medulla' | 'Spinal Cord' = 'Medulla'
  if (syn.anatomicLocation.toLowerCase().includes('midbrain')) ruleOf4Level = 'Midbrain'
  else if (syn.anatomicLocation.toLowerCase().includes('pons')) ruleOf4Level = 'Pons'
  else if (syn.anatomicLocation.toLowerCase().includes('spinal')) ruleOf4Level = 'Spinal Cord'

  const ipsiSigns: string[] = []
  const contraSigns: string[] = []

  if (syn.id === 'weber-syndrome') {
    ipsiSigns.push('CN III palsy: complete ptosis, dilated fixed pupil, down-and-out ophthalmoplegia')
    contraSigns.push('Contralateral spastic hemiplegia (face, arm, leg)')
    contraSigns.push('Contralateral hyperreflexia & positive Babinski')
  } else if (syn.id === 'millard-gubler-syndrome') {
    ipsiSigns.push('CN VI palsy: inability to abduct eye past midline (diplopia on lateral gaze)')
    ipsiSigns.push('CN VII LMN palsy: complete ipsilateral facial droop including forehead')
    contraSigns.push('Contralateral hemiplegia of arm and leg')
  } else if (syn.id === 'wallenberg-syndrome') {
    ipsiSigns.push('Ipsilateral loss of pain/temp on face (V1, V2, V3 trigeminal spinal nucleus)')
    ipsiSigns.push('Ipsilateral Horner syndrome (miosis, ptosis, anhidrosis)')
    ipsiSigns.push('Ipsilateral cerebellar limb ataxia, dysmetria, intention tremor')
    ipsiSigns.push('Ipsilateral palate paralysis, absent gag reflex, dysphagia, hoarseness (CN IX/X)')
    contraSigns.push('Contralateral loss of pain and temperature on trunk and limbs (Spinothalamic tract)')
  } else if (syn.id === 'brown-sequard-t10') {
    ipsiSigns.push('Ipsilateral spastic paralysis below T10 (Right leg)')
    ipsiSigns.push('Ipsilateral loss of vibration sense and conscious proprioception below T10 (Right leg)')
    ipsiSigns.push('Ipsilateral hyperactive patellar/Achilles reflexes and extensor plantar sign')
    contraSigns.push('Contralateral loss of pain and temperature sensation below T12 (Left leg)')
  }

  return {
    syndromeId: syn.id,
    syndromeName: syn.name,
    location: syn.anatomicLocation,
    vascularTerritory: syn.vascularTerritory,
    interruptedTracts: syn.affectedStructures,
    cranialNerveFindings: syn.cranialNervePalsies,
    ipsilateralBodySigns: ipsiSigns,
    contralateralBodySigns: contraSigns,
    ruleOf4Level,
    truthClass: 'mechanistic_simulation_proxy',
  }
}
