import {
  ADRENAL_EDUCATION_EDGES,
  ADRENAL_EDUCATION_NODES,
  ADRENAL_SYSTEM_ID,
  validateAdrenalEducationGraph,
} from './bodyAdrenalEducation'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(ADRENAL_SYSTEM_ID === 'endocrine', 'adrenal education must remain mapped to the endocrine system')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
  assert(ADRENAL_EDUCATION_NODES.some((node) => node.kind === kind), `adrenal education must include ${kind}`)
}

const validation = validateAdrenalEducationGraph()
assert(validation.duplicateIds === false, 'adrenal education node ids must be unique')
assert(validation.danglingEdges.length === 0, 'adrenal education graph must not contain dangling edges')
assert(validation.unsupportedLiteratureNodes.length === 0, 'literature-backed adrenal nodes must retain PubMed evidence')
assert(validation.unsupportedSourceNodes.length === 0, 'source-backed adrenal nodes must retain atlas-source evidence')
assert(validation.boundaryMissing.length === 0, 'adrenal education nodes must retain explicit boundaries')

const anatomy = ADRENAL_EDUCATION_NODES.find((node) => node.id === 'adrenal-gross-reference')
assert(anatomy?.evidenceState === 'source-backed', 'gross adrenal reference anatomy must remain source-backed')
assert(anatomy?.evidence.some((item) => item.kind === 'atlas-source' && item.id === 'visceral.glb'), 'gross adrenal anatomy must retain visceral.glb source identity')
assert(/not patient-specific anatomy/i.test(anatomy?.boundary ?? ''), 'adrenal reference anatomy must reject patient-specific inference')

const physiology = ADRENAL_EDUCATION_NODES.find((node) => node.id === 'adrenal-hpa-feedback')
assert(physiology?.evidenceState === 'literature-backed', 'HPA feedback context must remain literature-backed')
assert(physiology?.evidence.some((item) => item.kind === 'pubmed' && item.id === '29764284'), 'HPA feedback context must retain verified PMID 29764284')
assert(/no person-level cortisol concentration/i.test(physiology?.boundary ?? ''), 'adrenal physiology must reject person-level hormone inference')

const pathophysiology = ADRENAL_EDUCATION_NODES.find((node) => node.id === 'adrenal-feedback-disruption')
assert(pathophysiology?.evidence.some((item) => item.kind === 'pubmed' && item.id === '29764284'), 'feedback-disruption context must retain its literature provenance')
assert(/does not diagnose/i.test(pathophysiology?.boundary ?? ''), 'adrenal pathophysiology must reject diagnosis')

for (const kind of ['pharmacology', 'imaging'] as const) {
  const node = ADRENAL_EDUCATION_NODES.find((item) => item.kind === kind)
  assert(node?.evidenceState === 'educational-only', `adrenal ${kind} must remain educational-only until claim-specific evidence exists`)
  assert(node?.evidence.length === 0, `adrenal ${kind} must not carry unverified evidence`)
  assert(/until .*evidence/i.test(node?.boundary ?? ''), `adrenal ${kind} must fail closed pending evidence`)
}

for (const edge of ADRENAL_EDUCATION_EDGES) {
  assert(edge.from !== edge.to, `adrenal edge ${edge.from} -> ${edge.to} must not self-reference`)
  assert(edge.note.length > 40, `adrenal edge ${edge.from} -> ${edge.to} must retain a substantive boundary note`)
}
assert(
  /rather than a diagnosis/i.test(ADRENAL_EDUCATION_EDGES.find((edge) => edge.relationship === 'disruption-associated-with')?.note ?? ''),
  'adrenal mechanism relationships must reject diagnosis inference',
)
