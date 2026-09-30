import {
  LIVER_EDUCATION_EDGES,
  LIVER_EDUCATION_NODES,
  LIVER_SYSTEM_ID,
  validateLiverEducationGraph,
} from './bodyLiverEducation'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(LIVER_SYSTEM_ID === 'digestive', 'liver education must remain mapped to the digestive system')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
  assert(LIVER_EDUCATION_NODES.some((node) => node.kind === kind), `liver education must include ${kind}`)
}

const validation = validateLiverEducationGraph()
assert(validation.duplicateIds === false, 'liver education node ids must be unique')
assert(validation.danglingEdges.length === 0, 'liver education graph must not contain dangling edges')
assert(validation.sourceBackedWithoutSource.length === 0, 'source-backed liver nodes must retain source identity')
assert(validation.educationalWithSourceClaim.length === 0, 'educational-only liver nodes must not claim source provenance')
assert(validation.boundaryMissing.length === 0, 'liver education nodes must retain explicit boundaries')

const anatomy = LIVER_EDUCATION_NODES.find((node) => node.id === 'liver-gross-reference')
assert(anatomy?.evidenceState === 'source-backed', 'gross liver reference anatomy must remain source-backed')
assert(anatomy?.sourceId === 'visceral.glb', 'gross liver reference anatomy must remain bound to visceral.glb')
assert(/not patient-specific anatomy/i.test(anatomy.boundary), 'liver reference anatomy must reject patient-specific inference')
assert(/microscopic lobules/i.test(anatomy.boundary), 'gross liver anatomy must not imply microscopic lobular detail')

for (const node of LIVER_EDUCATION_NODES.filter((item) => item.kind !== 'anatomy')) {
  assert(node.evidenceState === 'educational-only', `liver ${node.kind} must remain educational-only`)
  assert(node.sourceId === undefined, `liver ${node.kind} must not attach an unverified source identifier`)
}
assert(/no synthetic function/i.test(LIVER_EDUCATION_NODES.find((node) => node.kind === 'physiology')?.boundary ?? ''), 'liver physiology must not imply measured or synthetic hepatic function')
assert(/no drug selection/i.test(LIVER_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')?.boundary ?? ''), 'liver pharmacology must not select drugs')
assert(/no ultrasound, CT, MRI/i.test(LIVER_EDUCATION_NODES.find((node) => node.kind === 'imaging')?.boundary ?? ''), 'liver imaging must not claim patient imaging')

for (const edge of LIVER_EDUCATION_EDGES) {
  assert(edge.from !== edge.to, `liver edge ${edge.from} -> ${edge.to} must not self-reference`)
  assert(edge.note.length > 40, `liver edge ${edge.from} -> ${edge.to} must retain a substantive boundary note`)
}
assert(/no diagnosis/i.test(LIVER_EDUCATION_EDGES.find((edge) => edge.relationship === 'supports')?.note ?? ''), 'liver relationships must reject diagnosis inference')
assert(/patient-state inference/i.test(LIVER_EDUCATION_EDGES.find((edge) => edge.relationship === 'supports')?.note ?? ''), 'liver relationships must reject patient-state inference')
