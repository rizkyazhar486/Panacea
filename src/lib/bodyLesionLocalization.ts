import type { BodySystemId } from './bodySystemSourceWave'
import type { WholeBodySystemId } from './wholeBodyPhysiologyOS'

export type NeuroLocalizationLevelId =
  | 'cortical-network'
  | 'deep-subcortical'
  | 'brainstem'
  | 'cerebellar'
  | 'spinal-cord'
  | 'peripheral-motor-sensory'

export type LocalizationSignalDomain =
  | 'cognition-language'
  | 'cranial-nerve'
  | 'motor'
  | 'sensory'
  | 'coordination-gait'
  | 'autonomic-sphincter'

export interface LocalizationSignal {
  id: string
  domain: LocalizationSignalDomain
  label: string
  localizingValue: string
  caution: string
}

export interface NeuroLocalizationLevel {
  id: NeuroLocalizationLevelId
  label: string
  shortLabel: string
  levelSummary: string
  atlasSystemIds: readonly BodySystemId[]
  physiologySystemIds: readonly WholeBodySystemId[]
  anatomyAnchors: readonly string[]
  pathwayAnchors: readonly string[]
  highSpecificityPattern: string
  signals: readonly LocalizationSignal[]
  sideLogic: readonly string[]
  imagingHandoff: string
  commonPitfall: string
}

export interface LocalizationReference {
  id: string
  role: 'reference-architecture' | 'clinical-taxonomy-reference'
  title: string
  repository: string
  repositoryUrl: string
  pinnedCommit: string
  license: string
  note: string
}

export const BODY_LESION_LOCALIZATION_REFERENCES: readonly LocalizationReference[] = [
  {
    id: 'aycibatuhan-nervous-system-atlas',
    role: 'reference-architecture',
    title: 'Clinical Neuroanatomy Atlas',
    repository: 'aycibatuhan/nervous-system-atlas',
    repositoryUrl: 'https://github.com/aycibatuhan/nervous-system-atlas',
    pinnedCommit: '3a5fc2c1f2251d852769004446140d1842f58afe',
    license: 'Source code Apache-2.0; authored content/data CC BY-SA 4.0',
    note: 'Reference architecture for lesion/syndrome mode, MNI152 spatial framing, pathway/territory linking and examination-first localization. Panacea localization prose and data below are independently authored rather than copied from CC BY-SA clinical content.',
  },
] as const

export const BODY_LESION_LOCALIZATION_LEVELS: readonly NeuroLocalizationLevel[] = [
  {
    id: 'cortical-network',
    label: 'Cortical hemisphere / distributed cortical network',
    shortLabel: 'Cortex',
    levelSummary: 'A supratentorial cortical localization becomes more plausible when focal motor or sensory findings travel with higher cortical dysfunction rather than appearing as an isolated long-tract deficit.',
    atlasSystemIds: ['nervous', 'sensory-ent'],
    physiologySystemIds: ['nervous'],
    anatomyAnchors: ['frontal cortex', 'precentral gyrus', 'postcentral gyrus', 'parietal association cortex', 'temporal cortex', 'occipital cortex'],
    pathwayAnchors: ['corticospinal/corticobulbar origins', 'thalamocortical sensory projections', 'visual radiations', 'language and attention networks'],
    highSpecificityPattern: 'Focal deficit plus a cortical sign such as aphasia, neglect, apraxia, agnosia, a homonymous field deficit, cortical sensory dysfunction or focal seizure activity.',
    signals: [
      {
        id: 'cortical-language',
        domain: 'cognition-language',
        label: 'Language or hemispheric-attention dysfunction',
        localizingValue: 'Aphasic or neglect-type findings strongly raise cortical-network localization when the examination is internally consistent.',
        caution: 'Altered attention, delirium, sedation and sensory impairment can mimic higher cortical deficits and require contextual interpretation.',
      },
      {
        id: 'cortical-motor',
        domain: 'motor',
        label: 'Contralateral upper-motor-neuron pattern with body-part emphasis',
        localizingValue: 'Somatotopic asymmetry can accompany cortical motor lesions, especially when one region such as face/arm or leg is disproportionately involved.',
        caution: 'Motor distribution alone is not sufficiently specific; deep lesions can also cause dense contralateral weakness.',
      },
      {
        id: 'cortical-visual',
        domain: 'sensory',
        label: 'Contralateral homonymous visual-field pattern',
        localizingValue: 'A congruent retrochiasmal field deficit can localize to optic radiations or visual cortex depending on the complete pattern.',
        caution: 'Formal field testing and ocular/optic-nerve exclusions are required before treating this as a cortical sign.',
      },
    ],
    sideLogic: [
      'Motor and somatosensory cortical deficits are generally expressed on the opposite side of the body because major long tracts cross before reaching the spinal/peripheral target.',
      'Language and neglect lateralization depends on network dominance and cannot be inferred from handedness alone.',
    ],
    imagingHandoff: 'For an acute focal cortical syndrome, cross-sectional brain imaging and vascular imaging are chosen by clinical context; MRI diffusion-weighted imaging can add tissue-level information when appropriate.',
    commonPitfall: 'Calling any hemiparesis “cortical” without demonstrating a cortical sign or considering internal-capsule/deep lesions.',
  },
  {
    id: 'deep-subcortical',
    label: 'Deep subcortical white matter / internal-capsule-thalamic level',
    shortLabel: 'Deep brain',
    levelSummary: 'Compact deep pathways can produce dense motor, sensory or sensorimotor deficits across face, arm and leg without the higher cortical signs expected from a cortical-network lesion.',
    atlasSystemIds: ['nervous'],
    physiologySystemIds: ['nervous'],
    anatomyAnchors: ['internal capsule', 'corona radiata', 'thalamus', 'basal ganglia', 'deep perforator territories'],
    pathwayAnchors: ['corticospinal tract', 'corticobulbar tract', 'thalamocortical sensory pathways'],
    highSpecificityPattern: 'Dense contralateral face-arm-leg motor or sensory pattern with relative absence of aphasia, neglect, apraxia, seizure or other convincing cortical-network signs.',
    signals: [
      {
        id: 'deep-pure-motor',
        domain: 'motor',
        label: 'Dense contralateral pure-motor pattern',
        localizingValue: 'A compact corticospinal/corticobulbar pathway lesion can affect face, arm and leg together.',
        caution: 'Large cortical or brainstem lesions can mimic parts of this pattern; cranial-nerve and cortical examination still matters.',
      },
      {
        id: 'deep-pure-sensory',
        domain: 'sensory',
        label: 'Dense hemisensory pattern',
        localizingValue: 'A deep sensory relay lesion can produce face-and-body sensory loss without cortical sensory features.',
        caution: 'Modality, exact distribution and functional sensory signs must be assessed before assigning a deep localization.',
      },
      {
        id: 'deep-no-cortical',
        domain: 'cognition-language',
        label: 'No convincing cortical sign',
        localizingValue: 'The absence of higher cortical dysfunction is supportive only when the examination was adequate and the patient could participate.',
        caution: 'Absence of evidence is weak when consciousness, language barrier or severe weakness limits testing.',
      },
    ],
    sideLogic: [
      'Deep supratentorial motor and sensory lesions typically produce deficits on the opposite body side.',
      'A lesion above the facial nucleus generally preserves bilateral upper-face input more than lower-face input, but bedside interpretation depends on the exact pathway involved.',
    ],
    imagingHandoff: 'Brain MRI with diffusion-weighted imaging can resolve small deep lesions that may be subtle on initial CT; vascular context determines whether additional vessel imaging is appropriate.',
    commonPitfall: 'Equating a small deep imaging lesion with causality when the bedside deficit does not match its tract anatomy.',
  },
  {
    id: 'brainstem',
    label: 'Brainstem level',
    shortLabel: 'Brainstem',
    levelSummary: 'The brainstem packs cranial-nerve nuclei/fascicles next to long motor, sensory and cerebellar pathways, so combinations of ipsilateral cranial-nerve dysfunction with contralateral body findings are particularly localizing.',
    atlasSystemIds: ['nervous', 'sensory-ent'],
    physiologySystemIds: ['nervous'],
    anatomyAnchors: ['midbrain', 'pons', 'medulla', 'cranial nerve nuclei/fascicles', 'cerebral peduncles', 'medial lemniscus'],
    pathwayAnchors: ['corticospinal tract', 'spinothalamic tract', 'medial lemniscus', 'trigeminal sensory pathways', 'ocular motor pathways'],
    highSpecificityPattern: 'Crossed findings: a cranial-nerve or face deficit on one side combined with long-tract motor or sensory findings affecting the opposite body side.',
    signals: [
      {
        id: 'brainstem-crossed',
        domain: 'cranial-nerve',
        label: 'Crossed cranial-nerve and long-tract signs',
        localizingValue: 'This pattern exploits the juxtaposition of ipsilateral cranial-nerve structures and long tracts that have different crossing points.',
        caution: 'Not every brainstem syndrome is crossed, and multifocal disease can create a pseudo-crossed pattern.',
      },
      {
        id: 'brainstem-ocular',
        domain: 'cranial-nerve',
        label: 'Diplopia / ocular-motor pattern with additional long-tract signs',
        localizingValue: 'An ocular-motor deficit becomes strongly brainstem-localizing when paired with anatomically coherent motor, sensory or cerebellar findings.',
        caution: 'Isolated ocular-motor palsies may arise outside the brainstem and should not be overlocalized.',
      },
      {
        id: 'brainstem-bulbar',
        domain: 'cranial-nerve',
        label: 'Bulbar or facial dysfunction with limb findings',
        localizingValue: 'Dysarthria, dysphagia, facial sensory/motor or vestibular findings can identify brainstem level when combined with coherent long-tract abnormalities.',
        caution: 'Neuromuscular-junction, peripheral cranial-nerve and systemic causes can mimic isolated bulbar symptoms.',
      },
    ],
    sideLogic: [
      'Cranial-nerve nucleus/fascicle dysfunction is often ipsilateral to the brainstem lesion.',
      'Long-tract body findings may be contralateral or ipsilateral depending on whether that pathway has already crossed at the lesion level.',
    ],
    imagingHandoff: 'MRI is generally preferred for detailed posterior-fossa/brainstem tissue assessment; vessel imaging is added when a vascular process is suspected.',
    commonPitfall: 'Using a normal early scan to dismiss a strongly coherent brainstem examination rather than reconciling clinical and imaging sensitivity.',
  },
  {
    id: 'cerebellar',
    label: 'Cerebellum / cerebellar connections',
    shortLabel: 'Cerebellum',
    levelSummary: 'A cerebellar localization is suggested by coordination, timing and balance failure that cannot be explained by weakness, primary sensory loss or a peripheral motor deficit.',
    atlasSystemIds: ['nervous'],
    physiologySystemIds: ['nervous', 'musculoskeletal'],
    anatomyAnchors: ['cerebellar hemispheres', 'vermis', 'cerebellar peduncles'],
    pathwayAnchors: ['spinocerebellar inputs', 'cortico-ponto-cerebellar input', 'deep nuclei and cerebellar outflow'],
    highSpecificityPattern: 'Ipsilateral limb dysmetria or decomposition with gait/truncal ataxia, dysarthria or nystagmus, in the absence of weakness sufficient to explain the coordination deficit.',
    signals: [
      {
        id: 'cerebellar-limb',
        domain: 'coordination-gait',
        label: 'Limb dysmetria / decomposition',
        localizingValue: 'Appendicular incoordination that remains after accounting for weakness and sensory loss supports a cerebellar hemisphere/connection localization.',
        caution: 'Severe proprioceptive loss can produce sensory ataxia and must be separated with sensory examination and visual compensation.',
      },
      {
        id: 'cerebellar-gait',
        domain: 'coordination-gait',
        label: 'Gait or truncal ataxia',
        localizingValue: 'Marked truncal/gait instability can emphasize vermian or vestibulocerebellar circuitry depending on the accompanying examination.',
        caution: 'Vestibular, sensory, toxic-metabolic and medication effects can also cause gait ataxia.',
      },
      {
        id: 'cerebellar-eye-speech',
        domain: 'cranial-nerve',
        label: 'Nystagmus or scanning-type dysarthria with incoordination',
        localizingValue: 'Eye-movement and speech-timing abnormalities can reinforce a cerebellar network pattern.',
        caution: 'These findings are supportive rather than individually diagnostic.',
      },
    ],
    sideLogic: [
      'Cerebellar limb signs are usually expressed ipsilateral to the affected cerebellar hemisphere because of the net double-crossing organization of major motor loops.',
    ],
    imagingHandoff: 'Posterior-fossa MRI provides higher tissue contrast than CT for many cerebellar processes; acute hemorrhage and urgent structural questions may still begin with CT according to clinical context.',
    commonPitfall: 'Calling all dizziness or imbalance “cerebellar” without documenting objective limb, ocular-motor or truncal coordination signs.',
  },
  {
    id: 'spinal-cord',
    label: 'Spinal cord level',
    shortLabel: 'Spinal cord',
    levelSummary: 'A cord localization is favored by a definable sensory level, bilateral long-tract findings below a level, segmental signs at the lesion, or sphincter/autonomic involvement that cannot be explained by a single peripheral nerve.',
    atlasSystemIds: ['nervous', 'musculoskeletal'],
    physiologySystemIds: ['nervous', 'musculoskeletal'],
    anatomyAnchors: ['cervical cord', 'thoracic cord', 'conus region', 'dorsal columns', 'lateral corticospinal tracts', 'anterolateral system'],
    pathwayAnchors: ['corticospinal tract', 'dorsal-column medial-lemniscus pathway', 'spinothalamic/anterolateral pathway', 'segmental roots'],
    highSpecificityPattern: 'A sensory level with upper-motor-neuron signs below the level, optionally combined with segmental lower-motor-neuron findings at the level and bladder/bowel or autonomic dysfunction.',
    signals: [
      {
        id: 'cord-sensory-level',
        domain: 'sensory',
        label: 'Sensory level on the trunk',
        localizingValue: 'A reproducible transition across the trunk strongly supports a spinal level when modality and examination consistency are clear.',
        caution: 'The apparent dermatome can differ from the structural level; exact level estimation requires pathway anatomy and imaging correlation.',
      },
      {
        id: 'cord-long-tract',
        domain: 'motor',
        label: 'Bilateral or tract-pattern upper-motor-neuron signs below a level',
        localizingValue: 'Spasticity, hyperreflexia and pathological plantar responses below a segmental boundary support cord long-tract involvement.',
        caution: 'Acute cord injury can initially present with reduced tone/reflexes before classic upper-motor-neuron physiology emerges.',
      },
      {
        id: 'cord-autonomic',
        domain: 'autonomic-sphincter',
        label: 'Sphincter or autonomic dysfunction in a compatible cord syndrome',
        localizingValue: 'Autonomic involvement raises concern for a central spinal process when paired with motor/sensory level findings.',
        caution: 'Urinary symptoms are common and nonspecific in isolation; they should not be used alone to localize a lesion.',
      },
    ],
    sideLogic: [
      'Corticospinal deficits from a hemicord lesion are typically ipsilateral below the lesion because these fibers crossed in the medulla.',
      'Pain/temperature deficits can emerge contralaterally below the lesion because anterolateral fibers cross within the spinal cord after entry.',
      'Dorsal-column vibration/proprioception deficits from a hemicord lesion remain ipsilateral below the lesion until those fibers cross in the lower brainstem.',
    ],
    imagingHandoff: 'MRI of the clinically appropriate spinal region is the principal structural handoff when a cord syndrome is suspected; broader imaging may be needed when the level is uncertain or multifocal disease is possible.',
    commonPitfall: 'Using the sensory-level dermatome as an exact MRI slice rather than a bedside estimate shaped by tract crossing and root overlap.',
  },
  {
    id: 'peripheral-motor-sensory',
    label: 'Root / plexus / peripheral nerve / neuromuscular level',
    shortLabel: 'Peripheral',
    levelSummary: 'A peripheral localization is favored by lower-motor-neuron weakness, reflex loss and sensory findings that conform to a root, plexus, named nerve or length-dependent peripheral pattern rather than a central long-tract distribution.',
    atlasSystemIds: ['nervous', 'musculoskeletal'],
    physiologySystemIds: ['nervous', 'musculoskeletal'],
    anatomyAnchors: ['ventral/dorsal roots', 'brachial plexus', 'lumbosacral plexus', 'peripheral nerves', 'neuromuscular junction', 'skeletal muscle'],
    pathwayAnchors: ['motor unit', 'myotomes', 'dermatomes', 'named peripheral nerve territories'],
    highSpecificityPattern: 'Lower-motor-neuron weakness with reflex reduction and a distribution that can be explained by a root, plexus or named nerve; sensory sparing shifts attention toward neuromuscular junction or muscle depending on the motor pattern.',
    signals: [
      {
        id: 'peripheral-lmn',
        domain: 'motor',
        label: 'Lower-motor-neuron pattern',
        localizingValue: 'Weakness with reduced reflexes, atrophy or fasciculation supports the motor-unit/peripheral side of the localization tree.',
        caution: 'Very acute lesions may precede visible atrophy, while critical illness and medication effects can alter reflexes.',
      },
      {
        id: 'peripheral-sensory-map',
        domain: 'sensory',
        label: 'Root, plexus, named-nerve or length-dependent sensory pattern',
        localizingValue: 'The geometry of sensory loss can separate peripheral levels when interpreted together with weakness and reflexes.',
        caution: 'Dermatomes overlap substantially and patient-reported borders are rarely exact anatomical maps.',
      },
      {
        id: 'peripheral-reflex',
        domain: 'motor',
        label: 'Reflex reduction matching the weak segment',
        localizingValue: 'A reflex arc abnormality can link weakness to specific roots/nerves when the rest of the examination fits.',
        caution: 'Baseline reflex amplitude varies; symmetry and the full motor/sensory pattern matter more than a single reflex grade.',
      },
    ],
    sideLogic: [
      'Peripheral motor and sensory deficits generally occur on the same side as the affected root, plexus or named nerve.',
      'Distribution geometry—myotomal, dermatomal, named-nerve or length-dependent—is more useful than a simple left/right rule at the peripheral level.',
    ],
    imagingHandoff: 'Electrodiagnostic studies, targeted nerve/root imaging or muscle studies are selected according to the suspected peripheral level and timing; the tool does not prescribe a workup.',
    commonPitfall: 'Assuming every distal weakness with numbness is a single peripheral nerve lesion rather than comparing root, plexus, polyneuropathy and central patterns.',
  },
] as const

export const BODY_LESION_LOCALIZATION_BOUNDARY =
  'Educational neuroanatomical localization workspace only. It teaches level, side, pathway and pattern relationships; it does not diagnose a lesion, calculate probability, determine stroke treatment eligibility, replace a neurological examination, or substitute for imaging/electrodiagnostic interpretation by a qualified clinician.'

export function getNeuroLocalizationLevel(id: NeuroLocalizationLevelId): NeuroLocalizationLevel {
  const level = BODY_LESION_LOCALIZATION_LEVELS.find((item) => item.id === id)
  if (!level) throw new Error(`Unknown neuro-localization level: ${id}`)
  return level
}

export function listNeuroLocalizationLevelsForAtlasSystem(systemId: BodySystemId): readonly NeuroLocalizationLevel[] {
  return BODY_LESION_LOCALIZATION_LEVELS.filter((level) => level.atlasSystemIds.includes(systemId))
}

export function localizationSignalDomainCount(levelId: NeuroLocalizationLevelId): number {
  return new Set(getNeuroLocalizationLevel(levelId).signals.map((signal) => signal.domain)).size
}
