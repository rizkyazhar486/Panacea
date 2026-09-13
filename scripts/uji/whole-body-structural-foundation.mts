import { ADVANCED_RESPIRATORY_ATLAS_NODES } from '../../src/lib/anatomy/advancedRespiratoryAtlas.ts'
import { CARDIOPULMONARY_BRIDGE_NODES } from '../../src/lib/anatomy/cardiopulmonaryBridge.ts'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import { DEEP_CARDIOVASCULAR_ATLAS_NODES } from '../../src/lib/anatomy/deepCardiovascularAtlas.ts'
import { DEEP_NEUROVASCULAR_ATLAS_NODES } from '../../src/lib/anatomy/deepNeurovascularAtlas.ts'

let pass = 0
let fail = 0
function ok(name: string, condition: boolean) {
  if (condition) { pass++; console.log('ok    ', name) }
  else { fail++; console.error('GAGAL ', name) }
}

const nodes = COMPLETE_WHOLE_BODY_ATLAS.nodes
const ids = nodes.map((node) => node.id)
const structuralModules = [
  ...ADVANCED_RESPIRATORY_ATLAS_NODES,
  ...DEEP_CARDIOVASCULAR_ATLAS_NODES,
  ...DEEP_NEUROVASCULAR_ATLAS_NODES,
  ...CARDIOPULMONARY_BRIDGE_NODES,
]

ok('canonical ids remain unique', new Set(ids).size === ids.length)
ok('advanced respiratory topology is composed', ids.includes('resp:segmental-bronchus:r-b1'))
ok('deep aortic topology is composed', ids.includes('cv:aortic-arch'))
ok('coronary topology is composed', ids.includes('cv:lad'))
ok('deep neurovascular module has meaningful breadth', DEEP_NEUROVASCULAR_ATLAS_NODES.length >= 20)
ok('cardiopulmonary bridge is present', CARDIOPULMONARY_BRIDGE_NODES.length > 0)
ok('structural modules remain review-gated', structuralModules.every((node) => node.provenance.reviewStatus === 'academic-review-required'))
ok('reference-only geometry never declares source files', structuralModules.filter((node) => node.geometryStatus === 'reference-only').every((node) => !node.source.files?.length))
ok('revision identifies structural foundation', COMPLETE_WHOLE_BODY_ATLAS.revision.includes('structural-foundation'))

console.log(`\nWhole-body structural foundation: ${pass} pass, ${fail} fail · ${nodes.length} canonical nodes`)
if (fail) process.exitCode = 1
