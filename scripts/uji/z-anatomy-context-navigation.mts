import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workbench = readFileSync('src/pages/bodyhub/ZAnatomyAtlasWorkbench.tsx', 'utf8')
const precision = readFileSync('src/pages/bodyhub/WholeBodyPrecisionLab.tsx', 'utf8')
const surgical = readFileSync('src/pages/bodyhub/SurgicalLab.tsx', 'utf8')
const biomechanics = readFileSync('src/pages/bodyhub/WholeBodyMotionInspector.tsx', 'utf8')
const handoff = readFileSync('src/lib/anatomyContextHandoff.ts', 'utf8')

assert.match(workbench, /buildAnatomyContextHandoff/)
assert.match(workbench, /publishAnatomyContextHandoff/)
assert.match(workbench, /Open mapped surgical anatomy/)
assert.match(workbench, /Continue in biomechanics/)
assert.match(workbench, /not inferred from mesh-name similarity/i)

assert.match(precision, /onOpenSurgical=\{onOpenSurgical\}/)
assert.match(precision, /onOpenBiomechanics=\{\(\) => setMode\('movement'\)\}/)

assert.match(surgical, /consumeAnatomyContextHandoff\('surgery'\)/)
assert.match(surgical, /curated surgical route/i)
assert.match(surgical, /does not infer a procedure from mesh names/i)

assert.match(biomechanics, /consumeAnatomyContextHandoff\('biomechanics'\)/)
assert.match(biomechanics, /curated biomechanics route/i)
assert.match(biomechanics, /Source-mesh availability does not itself prove biomechanics applicability/i)

assert.match(handoff, /pendingHandoff/)
assert.match(handoff, /surgery:\s*null/)
assert.match(handoff, /biomechanics:\s*null/)
assert.doesNotMatch(handoff, /localStorage|sessionStorage/)
assert.match(handoff, /does NOT mean qualified human academic review/i)
assert.match(handoff, /identity, credentials, date and scope/i)

console.log('Z-Anatomy context navigation remains curated, destination-isolated, one-shot, non-persistent, and explicit about review and geometry boundaries.')
