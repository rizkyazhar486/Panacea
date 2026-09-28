import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const read = (p: string) => readFileSync(resolve(root, p), 'utf8')

const registryPath = 'governance/panacea-99-axioms.json'
const annexPath = 'PANACEA_99_AXIOM_CONSTITUTION.md'
const registry = JSON.parse(read(registryPath)) as {
  schemaVersion: number
  enforcementPolicy: {
    hardByDefaultSurfaces: string[]
    hardPassRequiresEvidence: boolean
    hardCriticalityMayBeDowngraded: boolean
  }
  theologicalBoundary: string
  formula: { hardGate: string; maturity: string }
  axioms: Array<{
    id: string
    sequence: number
    inspirationName: string
    engineeringTheme: string
    invariant: string
    enforcement: string
    claimBoundary: string
  }>
}

assert.equal(registry.schemaVersion, 2)
assert.deepEqual(
  registry.enforcementPolicy.hardByDefaultSurfaces,
  ['security', 'safety', 'privacy', 'clinical', 'data', 'governance'],
)
assert.equal(registry.enforcementPolicy.hardPassRequiresEvidence, true)
assert.equal(registry.enforcementPolicy.hardCriticalityMayBeDowngraded, false)
assert.equal(registry.axioms.length, 99, '99-Axiom registry must contain exactly 99 entries')

const ids = new Set(registry.axioms.map((a) => a.id))
const seq = new Set(registry.axioms.map((a) => a.sequence))
assert.equal(ids.size, 99, 'axiom IDs must be unique')
assert.equal(seq.size, 99, 'axiom sequence numbers must be unique')

for (let i = 0; i < registry.axioms.length; i++) {
  const axiom = registry.axioms[i]
  assert.equal(axiom.id, `A${String(i + 1).padStart(2, '0')}`)
  assert.equal(axiom.sequence, i + 1)
  assert.ok(axiom.inspirationName.trim())
  assert.ok(axiom.engineeringTheme.trim())
  assert.ok(axiom.invariant.trim().length >= 32)
  assert.ok(axiom.enforcement.trim())
  assert.equal(axiom.claimBoundary, 'inspiration-only')
}

const boundary = registry.theologicalBoundary.toLowerCase()
for (const phrase of ['belong to allah', 'does not possess', 'omniscience', 'infallibility', 'not aqidah']) {
  assert.ok(boundary.includes(phrase), `missing theological boundary phrase: ${phrase}`)
}

assert.match(registry.formula.hardGate, /C_99\(a\).*product/i)
assert.match(registry.formula.hardGate, /blocks execution/i)
assert.match(registry.formula.maturity, /engineering maturity heuristic/i)

const annex = read(annexPath)
assert.match(annex, /C_\{99\}\(a\)/)
assert.match(annex, /Qur'an 7:180/)
assert.match(annex, /Sahih al-Bukhari 2736/)
assert.match(annex, /Sahih Muslim 2677a/)
assert.match(annex, /non-theocratic and non-deifying/i)
assert.match(annex, /measurement != estimate/)
assert.match(annex, /intelligence != authority/)
assert.match(annex, /Runtime constitutional policy kernel/)
assert.match(annex, /hard PASS without evidence/)

for (const path of ['AGENTS.md', 'PANACEA_INVICTUS_PRINCIPLE.md']) {
  const content = read(path)
  assert.ok(content.includes('PANACEA_99_AXIOM_CONSTITUTION.md'), `${path} must inherit the 99-Axiom annex`)
  assert.ok(content.includes('governance/panacea-99-axioms.json'), `${path} must point to the machine-readable registry`)
}

console.log('99-Axiom constitutional registry: 99/99 entries, runtime enforcement policy, and inheritance contract verified')
