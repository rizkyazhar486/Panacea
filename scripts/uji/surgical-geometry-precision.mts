import assert from 'node:assert/strict'
import { URUTAN } from '../../src/lib/dissection.ts'
import { INDEKS_TUBUH } from '../../src/lib/bodySearch.ts'
import {
  canonicalSurgicalStructureName,
  resolveSurgicalRisk,
  resolveSurgicalRisks,
  wholeBodyRiskNodes,
} from '../../src/lib/surgicalGeometry.ts'

assert.equal(
  canonicalSurgicalStructureName('Popliteal artery (posterior, at risk with retraction)'),
  'popliteal artery',
  'Presentation annotations must not become part of the geometry lookup key.',
)
assert.equal(
  canonicalSurgicalStructureName('Ilioinguinal nerve — teaching note'),
  'ilioinguinal nerve',
  'Teaching notes after an em dash must not become part of the geometry lookup key.',
)
assert.equal(
  resolveSurgicalRisk('Definitely not a real atlas structure').status,
  'reference-only',
  'Absent structures must fail closed instead of fuzzy-matching a different mesh.',
)

const allRisks = URUTAN.flatMap((approach) => approach.lapis.flatMap((layer) => layer.bahaya ?? []))
const coverage = resolveSurgicalRisks(allRisks)
const represented = coverage.filter((item) => item.status === 'whole-body')
assert.ok(represented.length > 0, 'At least one current surgical risk should resolve to an exact whole-body mesh name.')

const byNode = new Map(INDEKS_TUBUH.map((structure) => [structure.n, structure]))
for (const item of represented) {
  assert.ok(item.wholeBodyNodeNames.length > 0, `${item.label} is marked whole-body but has no node names.`)
  for (const nodeName of item.wholeBodyNodeNames) {
    const structure = byNode.get(nodeName)
    assert.ok(structure, `${nodeName} must exist in the generated whole-body index.`)
    assert.equal(
      canonicalSurgicalStructureName(structure!.b),
      item.canonical,
      `Surgical highlighting must be exact-name only for ${item.label}.`,
    )
  }
}

const uniqueNodes = wholeBodyRiskNodes(allRisks)
assert.equal(uniqueNodes.length, new Set(uniqueNodes).size, 'Whole-body surgical highlight nodes must be de-duplicated.')

console.log(`Surgical geometry precision verified: ${represented.length}/${coverage.length} risk labels have exact whole-body meshes.`)
