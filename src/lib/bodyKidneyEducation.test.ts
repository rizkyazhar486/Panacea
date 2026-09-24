import {
  KIDNEY_EDUCATION_EDGES,
  KIDNEY_EDUCATION_NODES,
  KIDNEY_SYSTEM_ID,
  validateKidneyEducationGraph,
} from './bodyKidneyEducation'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(KIDNEY_SYSTEM_ID === 'urinary', 'kidney education must remain mapped to the urinary system')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
  assert(KIDNEY_EDUCATION_NODES.some((node) => node.kind === kind), `kidney education must include ${kind}`)
}

const validation = validateKidneyEducationGraph()
assert(validation.duplicateIds === false, 'kidney education node ids must be unique')
assert(validation.danglingEdges.length === 0, 'kidney education graph must not contain dangling edges')
assert(validation.sourceBackedWithoutSource.length === 0, 'source-backed kidney nodes must retain source identity')
assert(validation.educationalWithSourceClaim.length === 0, 'educational-only kidney nodes must not claim source provenance')
assert(validation.boundaryMissing.length === 0, 'kidney education nodes must retain explicit boundaries')

const anatomy = KIDNEY_EDUCATION_NODES.find((node) => node.id === 'kidney-gross-reference')
assert(anatomy?.evidenceState === 'source-backed', 'gross kidney reference anatomy must remain source-backed')
assert(anatomy?.sourceId === 'visceral.glb', 'gross kidney reference anatomy must remain bound to visceral.glb')
assert(/not patient-specific anatomy/i.test(anatomy.boundary), 'kidney reference anatomy must reject patient-specific inference')
assert(/nephron microstructure/i.test(anatomy.boundary), 'gross kidney anatomy must not imply nephron microstructure')

for (const node of KIDNEY_EDUCATION_NODES.filter((item) => item.kind !== 'anatomy')) {
  assert(node.evidenceState === 'educational-only', `kidney ${node.kind} must remain educational-only`)
  assert(node.sourceId === undefined, `kidney ${node.kind} must not attach an unverified source identifier`)
}
assert(/no GFR/i.test(KIDNEY_EDUCATION_NODES.find((node) => node.kind === 'physiology')?.boundary ?? ''), 'kidney physiology must not imply GFR calculation')
assert(/no drug selection/i.test(KIDNEY_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')?.boundary ?? ''), 'kidney pharmacology must not select drugs')
assert(/no CT, MRI, ultrasound/i.test(KIDNEY_EDUCATION_NODES.find((node) => node.kind === 'imaging')?.boundary ?? ''), 'kidney imaging must not claim patient imaging')

for (const edge of KIDNEY_EDUCATION_EDGES) {
  assert(edge.from !== edge.to, `kidney edge ${edge.from} -> ${edge.to} must not self-reference`)
  assert(edge.note.length > 40, `kidney edge ${edge.from} -> ${edge.to} must retain a substantive boundary note`)
}
assert(/no diagnosis or patient-state inference/i.test(KIDNEY_EDUCATION_EDGES.find((edge) => edge.relationship === 'supports')?.note ?? ''), 'kidney relationships must reject diagnosis and patient-state inference')
