import { LUNG_EDUCATION_EDGES, LUNG_EDUCATION_NODES, validateLungEducationGraph } from './bodyLungEducation'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const validation = validateLungEducationGraph()
assert(validation.duplicateIds === false, 'lung education node ids must be unique')
assert(validation.danglingEdges.length === 0, 'lung education graph must not contain dangling edges')
assert(validation.nonEducationalNodes.length === 0, 'lung education nodes must remain educational-only')
assert(validation.boundaryMissing.length === 0, 'lung education nodes must retain explicit boundaries')
assert(LUNG_EDUCATION_NODES.every((node) => node.evidenceState === 'educational-only'), 'lung nodes must not claim source-backed evidence')

for (const node of LUNG_EDUCATION_NODES) {
  assert(!('sourceId' in node), `lung node ${node.id} must not attach an unverified source identifier`)
  assert(/educational|placeholder|no /i.test(node.boundary), `lung node ${node.id} must state its educational boundary`)
}

assert(LUNG_EDUCATION_EDGES.length > 0, 'lung education graph must contain bounded relationships')
for (const edge of LUNG_EDUCATION_EDGES) {
  assert(edge.note.length > 40, `lung edge ${edge.from} -> ${edge.to} must retain a substantive boundary note`)
  assert(/education|no |without /i.test(edge.note), `lung edge ${edge.from} -> ${edge.to} must remain bounded away from patient inference`)
}
