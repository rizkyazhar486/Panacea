import type { CausalNode } from '../../../lib/discoveryWorkbench'

export const MODEL_VERSION = 'omnicausalis-illustrative-1'
export const SCIENTIFIC_SOURCES = [
  { id: 'chouchani2014', authors: 'Chouchani et al.', year: 2014, doi: '10.1038/nature13909', pmid: '25383517', title: 'Ischaemic accumulation of succinate controls reperfusion injury through mitochondrial ROS', context: 'Experimental ischemia/reperfusion; murine heart and brain injury models. Not patient-specific prediction.' },
  { id: 'gong2018', authors: 'Gong et al.', year: 2018, doi: '10.1186/s12974-018-1282-6', pmid: '30153825', title: 'Mitochondrial dysfunction induces NLRP3 inflammasome activation during cerebral ischemia/reperfusion injury', context: 'Rat cerebral ischemia/reperfusion and cell co-culture oxygen-glucose deprivation/reoxygenation. Cell type and timing matter.' },
  { id: 'lottes2014', authors: 'Lottes et al.', year: 2014, doi: '10.1152/ajplung.00298.2013', pmid: '24682450', title: 'Alveolar type II cells maintain bioenergetic homeostasis in hypoxia through metabolic and molecular adaptation', context: 'Murine alveolar cells in hypoxia preserved ATP despite reduced mitochondrial function. Hypoxia is not identical to ischemia.' },
  { id: 'kim2007', authors: 'Kim et al.', year: 2007, doi: '10.1186/1472-6793-7-5', pmid: '17592640', title: 'Toll-like receptor 4 deficiency: smaller infarcts, but no gain in function', context: 'TLR4-deficient mouse myocardial ischemia/reperfusion: smaller infarcts did not imply preserved cardiac function.' },
] as const

export type Scale = 'tissue' | 'organelle' | 'chemical' | 'cellular' | 'organ' | 'clinical'
export interface ScientificNode extends Pick<CausalNode, 'id' | 'label'> {
  ontology: string | null
  domain: string
  spatialScale: Scale
  temporalScale: string
  unit: string | null
  compartment: string
  evidenceStatus: 'REFERENCE' | 'UNKNOWN'
  provenance: readonly string[]
  uncertainty: string
  sourceVersion: string
}
export interface ScientificEdge {
  id: string
  source: string
  target: string
  relationshipType: 'experimental-mechanism' | 'statistical-association' | 'mechanistic-hypothesis' | 'unknown'
  direction: 'source-to-target' | 'unresolved'
  mechanism: string
  effectSign: 'increases' | 'reduces' | 'context-dependent' | 'unknown'
  temporalLag: number | null
  conditions: string
  confidence: number | null
  evidenceReferences: readonly string[]
  modelVersion: string
  doesNotImply: string
}
export interface ScientificGraph { nodes: readonly ScientificNode[]; edges: readonly ScientificEdge[] }

const node = (id: string, label: string, spatialScale: Scale, provenance: string[], uncertainty: string): ScientificNode => ({
  id, label, spatialScale, provenance, uncertainty, ontology: null, domain: 'ischemia-reperfusion research',
  temporalScale: 'Context dependent; no calibrated delay', unit: null, compartment: 'Experimental reference, not a patient compartment',
  evidenceStatus: provenance.length ? 'REFERENCE' : 'UNKNOWN', sourceVersion: MODEL_VERSION,
})
const edge = (id: string, source: string, target: string, mechanism: string, conditions: string, evidenceReferences: string[], doesNotImply: string, unknown = false): ScientificEdge => ({
  id, source, target, mechanism, conditions, evidenceReferences, doesNotImply,
  relationshipType: unknown ? 'unknown' : 'experimental-mechanism', direction: unknown ? 'unresolved' : 'source-to-target',
  effectSign: unknown ? 'unknown' : 'context-dependent', temporalLag: null, confidence: null, modelVersion: MODEL_VERSION,
})

// Graf referensi tidak memetakan indeks mainan menjadi konsentrasi atau fungsi organ.
export const CASCADE_GRAPH: ScientificGraph = {
  nodes: [
    node('perfusion', 'Perfusion disturbance', 'tissue', ['chouchani2014'], 'Flow, oxygen, substrates and waste clearance are not interchangeable.'),
    node('energetics', 'Mitochondrial energetics', 'organelle', ['lottes2014'], 'ATP is unmeasured. Compensation depends on cell type and experimental conditions.'),
    node('succinate', 'Succinate metabolism', 'chemical', ['chouchani2014'], 'Concentration, flux and electron-transfer rates are unavailable.'),
    node('redox', 'Reperfusion redox processes', 'chemical', ['chouchani2014'], 'ROS species, rates and timing are not calculated; no electronic-structure solver is connected.'),
    node('stress', 'Cellular stress', 'cellular', ['gong2018'], 'Mitochondrial injury and responses vary across cell types; no cell viability prediction.'),
    node('inflammation', 'Inflammatory signaling', 'cellular', ['gong2018', 'kim2007'], 'NLRP3 and TLR4 are distinct mechanisms in different experimental systems, not a single validated chain.'),
    node('organ', 'Organ function', 'organ', ['kim2007'], 'Injury markers do not establish quantitative organ function.'),
    node('clinical', 'Clinical observation mapping', 'clinical', [], 'UNKNOWN: no validated mapping to patient observations, diagnosis or treatment.'),
  ],
  edges: [
    edge('perfusion-energy', 'perfusion', 'energetics', 'Restricted delivery can alter bioenergetic conditions; compensation can preserve total ATP.', 'Hypoxia cell experiments constrain this interpretation; ischemia also affects substrates and clearance.', ['lottes2014', 'chouchani2014'], 'Reduced oxygen is not proof of ATP depletion.'),
    edge('perfusion-succinate', 'perfusion', 'succinate', 'Ischemic succinate accumulation was observed in experimental tissues.', 'Experimental ischemia, with tissue-specific metabolism.', ['chouchani2014'], 'No universal concentration or patient biomarker is supplied.'),
    edge('succinate-redox', 'succinate', 'redox', 'Re-oxidation of accumulated succinate can drive complex I reverse electron transport and ROS during reperfusion.', 'Reperfusion in the cited experimental systems; not all ROS mechanisms or all tissues.', ['chouchani2014'], 'No quantitative ROS rate or quantum-to-clinical prediction.'),
    edge('redox-stress', 'redox', 'stress', 'Mitochondrial ROS contributes to reperfusion-associated tissue injury in the cited models.', 'Experimental ischemia/reperfusion; other injury mechanisms and protective responses coexist.', ['chouchani2014'], 'A toy stress index is not measured cellular injury.'),
    edge('stress-inflammation', 'stress', 'inflammation', 'Mitochondrial dysfunction was linked experimentally to cell type-dependent NLRP3 activation.', 'Rat cerebral ischemia/reperfusion and co-culture; not inferred from a redox score.', ['gong2018'], 'No cytokine concentration, immune-cell count or human effect size.'),
    edge('inflammation-organ', 'inflammation', 'organ', 'UNKNOWN quantitative mapping. Reduced inflammatory injury did not ensure preserved function in a mouse experiment.', 'TLR4-deficient mouse myocardial model differs from the NLRP3 cerebral model; this is a translation gap.', ['kim2007'], 'Cannot join distinct experimental contexts into a calibrated organ prediction.', true),
    edge('organ-clinical', 'organ', 'clinical', 'UNKNOWN: patient observation mapping and intended-use validation are absent.', 'No consented patient data, clinical calibration or diagnostic model connected.', [], 'Research output cannot become clinical evidence, orders or signatures.', true),
  ],
}

const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const sourceIds = new Set<string>(SCIENTIFIC_SOURCES.map(s => s.id))
const references = (value: unknown): value is string[] => Array.isArray(value) && value.every(id => text(id) && sourceIds.has(id))

// Pemeriksaan kontrak tidak menggantikan review sumber; celah translasi tetap tertutup.
export function validateScientificGraph(value: unknown): string[] {
  if (!record(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) return ['INVALID_GRAPH']
  if (!value.nodes.length || value.nodes.length > 1_000 || value.edges.length > 5_000) return ['GRAPH_BUDGET']
  const errors: string[] = []
  const ids = new Set<string>()
  const edgeIds = new Set<string>()
  for (const n of value.nodes) {
    if (!record(n)) { errors.push('INVALID_NODE'); continue }
    if (!text(n.id) || ids.has(n.id)) errors.push('DUPLICATE_OR_MISSING_NODE_ID')
    else ids.add(n.id)
    for (const key of ['label', 'domain', 'temporalScale', 'compartment', 'uncertainty', 'sourceVersion']) if (!text(n[key])) errors.push(`NODE_MISSING_${key}`)
    if (!['tissue', 'organelle', 'chemical', 'cellular', 'organ', 'clinical'].includes(String(n.spatialScale))) errors.push('INVALID_SCALE')
    if (n.ontology !== null && !text(n.ontology)) errors.push('INVALID_ONTOLOGY')
    if (n.unit !== null && !text(n.unit)) errors.push('INVALID_UNIT')
    if (!references(n.provenance) || !['REFERENCE', 'UNKNOWN'].includes(String(n.evidenceStatus)) || (n.evidenceStatus === 'REFERENCE' && !n.provenance.length)) errors.push('INVALID_NODE_PROVENANCE')
  }
  for (const e of value.edges) {
    if (!record(e)) { errors.push('INVALID_EDGE'); continue }
    if (!text(e.id) || edgeIds.has(e.id)) errors.push('DUPLICATE_OR_MISSING_EDGE_ID')
    else edgeIds.add(e.id)
    if (!ids.has(String(e.source)) || !ids.has(String(e.target))) errors.push('DANGLING_EDGE')
    for (const key of ['mechanism', 'conditions', 'modelVersion', 'doesNotImply']) if (!text(e[key])) errors.push(`EDGE_MISSING_${key}`)
    if (!['experimental-mechanism', 'statistical-association', 'mechanistic-hypothesis', 'unknown'].includes(String(e.relationshipType))) errors.push('INVALID_RELATIONSHIP')
    if (!['source-to-target', 'unresolved'].includes(String(e.direction))) errors.push('INVALID_DIRECTION')
    if (!['increases', 'reduces', 'context-dependent', 'unknown'].includes(String(e.effectSign))) errors.push('INVALID_SIGN')
    if ((e.relationshipType === 'statistical-association' || e.relationshipType === 'unknown') && (e.direction !== 'unresolved' || e.effectSign !== 'unknown')) errors.push('UNSUPPORTED_CAUSAL_ESCALATION')
    if ((e.source === 'inflammation' && e.target === 'organ' || e.target === 'clinical') && e.relationshipType !== 'unknown') errors.push('UNVALIDATED_TRANSLATION')
    if (!references(e.evidenceReferences) || (e.relationshipType !== 'unknown' && !e.evidenceReferences.length)) errors.push('INVALID_EDGE_PROVENANCE')
    if (e.confidence !== null && (typeof e.confidence !== 'number' || !Number.isFinite(e.confidence) || e.confidence < 0 || e.confidence > 1)) errors.push('INVALID_CONFIDENCE')
    if (e.temporalLag !== null && (typeof e.temporalLag !== 'number' || !Number.isFinite(e.temporalLag) || e.temporalLag < 0)) errors.push('INVALID_LAG')
    if (e.confidence !== null || e.temporalLag !== null) errors.push('UNSOURCED_QUANTIFICATION')
  }
  return errors
}
