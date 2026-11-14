// The physiology the stage shows for each body system, assembled from the modules that already hold it. Pure and
// deterministic: the catalog is built from static data the first time it is asked for.
//
// Nothing is added here. Each source goes through a reader in physiologySources.ts, which drops anything without
// a usable source, and the result keeps the list of what was dropped (scripts/uji/system-physiology.mts requires
// it to be empty, so a broken source fails loudly instead of quietly disappearing from the stage).

import { BODY_SYSTEM_SOURCE_WAVE, type BodySystemId } from '../../data/bodySystems.ts'
import { BODY_SYSTEM_PHYSIOLOGY_BRIDGE } from '../../../../lib/bodySystemPhysiologyBridge.ts'
import { WHOLE_BODY_COUPLING_LOOPS, WHOLE_BODY_PHYSIOLOGY_SYSTEMS } from '../../../../lib/wholeBodyPhysiologyOS.ts'
import { ADRENAL_EDUCATION_NODES, ADRENAL_SYSTEM_ID } from '../../../../lib/bodyAdrenalEducation.ts'
import { BLADDER_EDUCATION_NODES, BLADDER_SYSTEM_ID } from '../../../../lib/bodyBladderEducation.ts'
import { COLON_EDUCATION_NODES, COLON_SYSTEM_ID } from '../../../../lib/bodyColonEducation.ts'
import { DIGESTIVE_EDUCATION_NODES, DIGESTIVE_SYSTEM_ID } from '../../../../lib/bodyDigestiveEducation.ts'
import { ENDOCRINE_EDUCATION_NODES, ENDOCRINE_SYSTEM_ID } from '../../../../lib/bodyEndocrineEducation.ts'
import { ESOPHAGUS_EDUCATION_NODES, ESOPHAGUS_SYSTEM_ID } from '../../../../lib/bodyEsophagusEducation.ts'
import { GALLBLADDER_EDUCATION_NODES, GALLBLADDER_SYSTEM_ID } from '../../../../lib/bodyGallbladderEducation.ts'
import { INTEGUMENTARY_EDUCATION_NODES, INTEGUMENTARY_SYSTEM_ID } from '../../../../lib/bodyIntegumentaryEducation.ts'
import { KIDNEY_EDUCATION_NODES, KIDNEY_SYSTEM_ID } from '../../../../lib/bodyKidneyEducation.ts'
import { LIVER_EDUCATION_NODES, LIVER_SYSTEM_ID } from '../../../../lib/bodyLiverEducation.ts'
import { LUNG_EDUCATION_NODES, LUNG_SYSTEM_ID } from '../../../../lib/bodyLungEducation.ts'
import { OVARY_EDUCATION_NODES, OVARY_SYSTEM_ID } from '../../../../lib/bodyOvaryEducation.ts'
import { PANCREAS_EDUCATION_NODES, PANCREAS_SYSTEM_ID } from '../../../../lib/bodyPancreasEducation.ts'
import { PARATHYROID_EDUCATION_NODES, PARATHYROID_SYSTEM_ID } from '../../../../lib/bodyParathyroidEducation.ts'
import { PROSTATE_EDUCATION_NODES, PROSTATE_SYSTEM_ID } from '../../../../lib/bodyProstateEducation.ts'
import { REPRODUCTIVE_EDUCATION_NODES, REPRODUCTIVE_SYSTEM_ID } from '../../../../lib/bodyReproductiveEducation.ts'
import { RESPIRATORY_EDUCATION_NODES, RESPIRATORY_SYSTEM_ID } from '../../../../lib/bodyRespiratoryEducation.ts'
import { SMALL_BOWEL_EDUCATION_NODES, SMALL_BOWEL_SYSTEM_ID } from '../../../../lib/bodySmallBowelEducation.ts'
import { SPLEEN_EDUCATION_NODES, SPLEEN_SYSTEM_ID } from '../../../../lib/bodySpleenEducation.ts'
import { STOMACH_EDUCATION_NODES, STOMACH_SYSTEM_ID } from '../../../../lib/bodyStomachEducation.ts'
import { THYMUS_EDUCATION_NODES, THYMUS_SYSTEM_ID } from '../../../../lib/bodyThymusEducation.ts'
import { THYROID_EDUCATION_NODES, THYROID_SYSTEM_ID } from '../../../../lib/bodyThyroidEducation.ts'
import { URINARY_EDUCATION_NODES, URINARY_SYSTEM_ID } from '../../../../lib/bodyUrinaryEducation.ts'
import { UTERUS_EDUCATION_NODES, UTERUS_SYSTEM_ID } from '../../../../lib/bodyUterusEducation.ts'
import { RESPIRATORY_EDUCATION_NETWORK } from '../../../../lib/bodyRespiratoryEducationNetwork.ts'
import { LYMPHATIC_EDUCATION_NETWORK } from '../../../../lib/bodyLymphaticEducationNetwork.ts'
import { ORGAN_EDUCATION_REFERENCES, ORGAN_EDUCATION_RELATIONSHIPS } from '../../../../lib/bodyOrganEducationAtlas.ts'
import {
  BAROREFLEX_BOUNDARY,
  BAROREFLEX_EVIDENCE,
  BAROREFLEX_PATHWAY,
  deriveBaroreflexDirection,
  type BaroreflexResponse,
} from '../../../../lib/physiology/baroreflexCoupling.ts'
import { PRESSURE_FLOW_BOUNDARY, PRESSURE_FLOW_EVIDENCE } from '../../../../lib/physiology/pressureFlowCoupling.ts'
import { CEREBRAL_PERFUSION_BOUNDARY, CEREBRAL_PERFUSION_EVIDENCE } from '../../../../lib/physiology/cerebralPerfusionCoupling.ts'
import { ACID_BASE_COUPLING_BOUNDARY, ACID_BASE_COUPLING_EVIDENCE } from '../../../../lib/physiology/acidBaseCoupling.ts'
import { FICK_OXYGEN_EXTRACTION_BOUNDARY, FICK_OXYGEN_EXTRACTION_EVIDENCE } from '../../../../lib/physiology/fickOxygenExtraction.ts'
import {
  readEducationNetwork,
  readEducationSources,
  readOrganRelationships,
  readReferencedMechanism,
  type EducationSource,
  type PhysiologyMechanism,
  type RejectedSource,
  type ReferencedMechanismInput,
} from './physiologySources.ts'
import type { SystemPhysiologyCatalog } from './systemPhysiology.ts'

const lib = (file: string) => `src/lib/${file}`

/** System-wide graphs first, then one graph per organ. The system of each comes from the graph's own constant. */
export const EDUCATION_SOURCES: readonly EducationSource[] = [
  { origin: lib('bodyRespiratoryEducation.ts'), system: RESPIRATORY_SYSTEM_ID, nodes: RESPIRATORY_EDUCATION_NODES },
  { origin: lib('bodyDigestiveEducation.ts'), system: DIGESTIVE_SYSTEM_ID, nodes: DIGESTIVE_EDUCATION_NODES },
  { origin: lib('bodyUrinaryEducation.ts'), system: URINARY_SYSTEM_ID, nodes: URINARY_EDUCATION_NODES },
  { origin: lib('bodyEndocrineEducation.ts'), system: ENDOCRINE_SYSTEM_ID, nodes: ENDOCRINE_EDUCATION_NODES },
  { origin: lib('bodyReproductiveEducation.ts'), system: REPRODUCTIVE_SYSTEM_ID, nodes: REPRODUCTIVE_EDUCATION_NODES },
  { origin: lib('bodyIntegumentaryEducation.ts'), system: INTEGUMENTARY_SYSTEM_ID, nodes: INTEGUMENTARY_EDUCATION_NODES },
  { origin: lib('bodyLungEducation.ts'), system: LUNG_SYSTEM_ID, organ: 'Lung', nodes: LUNG_EDUCATION_NODES },
  { origin: lib('bodyEsophagusEducation.ts'), system: ESOPHAGUS_SYSTEM_ID, organ: 'Esophagus', nodes: ESOPHAGUS_EDUCATION_NODES },
  { origin: lib('bodyStomachEducation.ts'), system: STOMACH_SYSTEM_ID, organ: 'Stomach', nodes: STOMACH_EDUCATION_NODES },
  { origin: lib('bodySmallBowelEducation.ts'), system: SMALL_BOWEL_SYSTEM_ID, organ: 'Small bowel', nodes: SMALL_BOWEL_EDUCATION_NODES },
  { origin: lib('bodyColonEducation.ts'), system: COLON_SYSTEM_ID, organ: 'Colon', nodes: COLON_EDUCATION_NODES },
  { origin: lib('bodyLiverEducation.ts'), system: LIVER_SYSTEM_ID, organ: 'Liver', nodes: LIVER_EDUCATION_NODES },
  { origin: lib('bodyGallbladderEducation.ts'), system: GALLBLADDER_SYSTEM_ID, organ: 'Gallbladder', nodes: GALLBLADDER_EDUCATION_NODES },
  { origin: lib('bodyPancreasEducation.ts'), system: PANCREAS_SYSTEM_ID, organ: 'Pancreas', nodes: PANCREAS_EDUCATION_NODES },
  { origin: lib('bodyKidneyEducation.ts'), system: KIDNEY_SYSTEM_ID, organ: 'Kidney', nodes: KIDNEY_EDUCATION_NODES },
  { origin: lib('bodyBladderEducation.ts'), system: BLADDER_SYSTEM_ID, organ: 'Urinary bladder', nodes: BLADDER_EDUCATION_NODES },
  { origin: lib('bodyThyroidEducation.ts'), system: THYROID_SYSTEM_ID, organ: 'Thyroid', nodes: THYROID_EDUCATION_NODES },
  { origin: lib('bodyParathyroidEducation.ts'), system: PARATHYROID_SYSTEM_ID, organ: 'Parathyroid glands', nodes: PARATHYROID_EDUCATION_NODES },
  { origin: lib('bodyAdrenalEducation.ts'), system: ADRENAL_SYSTEM_ID, organ: 'Adrenal glands', nodes: ADRENAL_EDUCATION_NODES },
  { origin: lib('bodyOvaryEducation.ts'), system: OVARY_SYSTEM_ID, organ: 'Ovary', nodes: OVARY_EDUCATION_NODES },
  { origin: lib('bodyUterusEducation.ts'), system: UTERUS_SYSTEM_ID, organ: 'Uterus', nodes: UTERUS_EDUCATION_NODES },
  { origin: lib('bodyProstateEducation.ts'), system: PROSTATE_SYSTEM_ID, organ: 'Prostate', nodes: PROSTATE_EDUCATION_NODES },
  { origin: lib('bodySpleenEducation.ts'), system: SPLEEN_SYSTEM_ID, organ: 'Spleen', nodes: SPLEEN_EDUCATION_NODES },
  { origin: lib('bodyThymusEducation.ts'), system: THYMUS_SYSTEM_ID, organ: 'Thymus', nodes: THYMUS_EDUCATION_NODES },
]

/** The networks name the lymphatic system 'lymphatic'; the atlas calls it 'lymphatic-immune'. */
export const NETWORK_SYSTEM_ALIASES: Readonly<Record<string, BodySystemId>> = { lymphatic: 'lymphatic-immune' }

const RESPONSE_WORDS: readonly (readonly [keyof BaroreflexResponse, string])[] = [
  ['sensorStretchDirection', 'baroreceptor stretch'],
  ['afferentFiringDirection', 'afferent firing'],
  ['sympatheticDirection', 'sympathetic outflow'],
  ['vagalDirection', 'vagal outflow'],
  ['heartRateDirection', 'heart rate'],
  ['contractilityDirection', 'contractility'],
  ['arteriolarToneDirection', 'arteriolar tone'],
  ['venousToneDirection', 'venous tone'],
]

const describeResponse = (response: BaroreflexResponse) =>
  RESPONSE_WORDS.map(([key, words]) => `${words} ${response[key] === 'increase' ? 'increases' : 'decreases'}`).join(', ')

/** The baroreflex module states its pathway and directions as data; the summary only puts them into sentences. */
export function baroreflexMechanismInput(): ReferencedMechanismInput {
  return {
    id: 'arterial-baroreflex',
    label: 'Arterial baroreflex',
    systems: ['cardiovascular', 'nervous'],
    summary: [
      ...BAROREFLEX_PATHWAY.map((step) => `${step.anatomy}: ${step.afferent} → ${step.centralTarget}.`),
      `When arterial pressure rises: ${describeResponse(deriveBaroreflexDirection('pressure-rise'))}.`,
      `When it falls: ${describeResponse(deriveBaroreflexDirection('pressure-fall'))}.`,
    ],
    references: BAROREFLEX_EVIDENCE.map((item) => ({ reference: item.reference, note: item.role })),
    boundary: BAROREFLEX_BOUNDARY,
    origin: lib('physiology/baroreflexCoupling.ts'),
  }
}

const asReferences = (evidence: readonly { reference: string; role: string; title?: string }[]) =>
  evidence.map((item) => ({ reference: item.reference, note: item.title ? `${item.title}: ${item.role}` : item.role }))

/**
 * The physiology couplings: each already computes one relation from cited sources and states its own boundary.
 * Listed under every system the relation joins; the summary stays empty because the claims live in the cited
 * roles and the boundary, word for word.
 */
export function couplingMechanismInputs(): ReferencedMechanismInput[] {
  return [
    {
      id: 'pressure-flow-chain',
      label: 'Pressure–flow: cardiac output, resistance and arterial pressure',
      systems: ['cardiovascular'],
      summary: [],
      references: asReferences(PRESSURE_FLOW_EVIDENCE),
      boundary: PRESSURE_FLOW_BOUNDARY,
      origin: lib('physiology/pressureFlowCoupling.ts'),
    },
    {
      id: 'cerebral-perfusion-pressure',
      label: 'Cerebral perfusion pressure',
      systems: ['nervous', 'cardiovascular'],
      summary: [],
      references: asReferences(CEREBRAL_PERFUSION_EVIDENCE),
      boundary: CEREBRAL_PERFUSION_BOUNDARY,
      origin: lib('physiology/cerebralPerfusionCoupling.ts'),
    },
    {
      id: 'acid-base-bicarbonate-buffer',
      label: 'Bicarbonate buffer: respiratory and renal acid–base',
      systems: ['respiratory', 'urinary'],
      summary: [],
      references: asReferences(ACID_BASE_COUPLING_EVIDENCE),
      boundary: ACID_BASE_COUPLING_BOUNDARY,
      origin: lib('physiology/acidBaseCoupling.ts'),
    },
    {
      id: 'fick-oxygen-mass-balance',
      label: 'Fick oxygen mass balance',
      systems: ['cardiovascular', 'respiratory'],
      summary: [],
      references: asReferences(FICK_OXYGEN_EXTRACTION_EVIDENCE),
      boundary: FICK_OXYGEN_EXTRACTION_BOUNDARY,
      origin: lib('physiology/fickOxygenExtraction.ts'),
    },
  ]
}

function build(): SystemPhysiologyCatalog {
  const labels = new Map(BODY_SYSTEM_SOURCE_WAVE.map((system) => [system.id, system.label] as const))
  const mechanisms: PhysiologyMechanism[] = []
  const rejected: RejectedSource[] = []
  const keep = (result: { mechanism: PhysiologyMechanism | null; rejected: RejectedSource | null }) => {
    if (result.mechanism) mechanisms.push(result.mechanism)
    if (result.rejected) rejected.push(result.rejected)
  }

  const education = readEducationSources(EDUCATION_SOURCES, labels)
  mechanisms.push(...education.mechanisms)
  rejected.push(...education.rejected)

  keep(readEducationNetwork(RESPIRATORY_EDUCATION_NETWORK, lib('bodyRespiratoryEducationNetwork.ts'), NETWORK_SYSTEM_ALIASES, labels))
  keep(readEducationNetwork(LYMPHATIC_EDUCATION_NETWORK, lib('bodyLymphaticEducationNetwork.ts'), NETWORK_SYSTEM_ALIASES, labels))

  const organSystems = new Map(
    EDUCATION_SOURCES.filter((source) => source.organ).map((source) => [source.organ!.toLowerCase(), { system: source.system, organ: source.organ! }] as const),
  )
  const organ = readOrganRelationships(ORGAN_EDUCATION_RELATIONSHIPS, ORGAN_EDUCATION_REFERENCES, organSystems, lib('bodyOrganEducationAtlas.ts'))
  mechanisms.push(...organ.mechanisms)
  rejected.push(...organ.rejected)

  keep(readReferencedMechanism(baroreflexMechanismInput(), labels))
  for (const input of couplingMechanismInputs()) keep(readReferencedMechanism(input, labels))

  return {
    systems: BODY_SYSTEM_SOURCE_WAVE.map(({ id, label }) => ({ id, label })),
    bridge: BODY_SYSTEM_PHYSIOLOGY_BRIDGE,
    domains: WHOLE_BODY_PHYSIOLOGY_SYSTEMS,
    loops: WHOLE_BODY_COUPLING_LOOPS,
    mechanisms,
    gaps: education.gaps,
    rejected,
  }
}

let cached: SystemPhysiologyCatalog | null = null

/** The catalog of the repository's own physiology sources, built once. */
export function defaultPhysiologyCatalog(): SystemPhysiologyCatalog {
  cached ??= build()
  return cached
}
