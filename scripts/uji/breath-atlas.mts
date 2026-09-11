import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const breathSource = readFileSync(new URL('../../src/pages/bodyhub/BreathAtlasLab.tsx', import.meta.url), 'utf8')
const precisionSource = readFileSync(new URL('../../src/pages/bodyhub/WholeBodyPrecisionLab.tsx', import.meta.url), 'utf8')
const registry = JSON.parse(readFileSync(new URL('../../data/source-registry/anatomy/thebuggeddev-anatomy-breath-atlas.json', import.meta.url), 'utf8'))

assert.match(breathSource, /https:\/\/github\.com\/thebuggeddev\/anatomy/)
assert.match(breathSource, /https:\/\/breath-atlas\.thebuggeddev\.chatgpt\.site\//)
assert.match(breathSource, /interaction reference only · license check required/)
assert.doesNotMatch(breathSource, /<iframe/i, 'Breath Atlas must not embed a remote third-party viewer')
assert.doesNotMatch(breathSource, /fetch\s*\(/, 'Breath Atlas must not introduce a runtime dependency on the external reference')

assert.match(breathSource, /getEffectiveAnatomySourceNodeSnapshot/)
assert.match(breathSource, /resolveAllAnatomySourceNodes/)
assert.match(breathSource, /useSyncExternalStore/)
assert.match(breathSource, /onHighlight\?\.\(exact\)/, 'source geometry highlighting must use resolved exact GLB node names')
assert.match(breathSource, /No direct source-node name match was found/)
assert.match(breathSource, /does not fabricate substitute geometry/)

assert.match(breathSource, /diaphragm contracts and descends/i)
assert.match(breathSource, /pump-handle/i)
assert.match(breathSource, /bucket-handle/i)
assert.match(breathSource, /quiet expiration is largely passive/i)
assert.match(breathSource, /elastic recoil/i)
assert.match(breathSource, /Forced expiration is different/i)
assert.match(breathSource, /oxygen diffuses from alveolar gas toward pulmonary capillary blood/i)
assert.match(breathSource, /carbon dioxide diffuses in the opposite direction/i)
assert.match(breathSource, /not represented at whole-body mesh scale/i)
assert.match(breathSource, /source body mesh is not deformed to fake breathing/i)
assert.match(breathSource, /no patient-specific ventilation map/i)

assert.match(precisionSource, /import BreathAtlasLab from '\.\/BreathAtlasLab'/)
assert.match(precisionSource, /'breath-atlas'/)
assert.match(precisionSource, /\['breath-atlas', 'Breath atlas'\]/)
assert.match(precisionSource, /mode === 'breath-atlas'/)
assert.match(precisionSource, /<BreathAtlasLab onHighlight=\{onHighlight\} onFocusRegion=\{onFocusRegion\} onEnableLayer=\{onEnableLayer\}/)

assert.equal(registry.id, 'thebuggeddev_anatomy_breath_atlas')
assert.equal(registry.repository, 'https://github.com/thebuggeddev/anatomy')
assert.equal(registry.homepage, 'https://breath-atlas.thebuggeddev.chatgpt.site/')
assert.equal(registry.usage.runtime, false)
assert.equal(registry.usage.networkRequired, false)
assert.equal(registry.license.status, 'CHECK_REQUIRED')
assert.equal(registry.license.commercialUse, 'UNKNOWN')
assert.equal(registry.adapter.status, 'NOT_APPLICABLE')
assert.equal(registry.validation.clinicalDecisionUse, 'NO')

console.log('Breath Atlas remains source-aware, physiologically bounded, independently implemented, and license-gated.')
