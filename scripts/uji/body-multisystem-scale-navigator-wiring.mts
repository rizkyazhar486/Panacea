import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const lab = await readFile(new URL('../../src/pages/bodyhub/WholeBodyPrecisionLab.tsx', import.meta.url), 'utf8')
const navigator = await readFile(new URL('../../src/pages/bodyhub/MultisystemScaleNavigator.tsx', import.meta.url), 'utf8')

assert.match(lab, /import MultisystemScaleNavigator from '\.\/MultisystemScaleNavigator'/)
assert.equal((lab.match(/<MultisystemScaleNavigator\s*\/>/g) ?? []).length, 1, 'WholeBodyPrecisionLab must mount the navigator exactly once')
assert.match(lab, /type Mode = 'z-anatomy' \| 'breath-atlas' \| 'unfolded' \| 'specialty' \| 'movement'/)
assert.match(lab, /<MultisystemScaleNavigator\s*\/>[\s\S]*?\[\['z-anatomy', 'Z-Anatomy atlas'\]/)

assert.match(navigator, /data-body-multisystem-scale-navigator="v1"/)
assert.match(navigator, /listBodyMultisystemScaleViews/)
assert.match(navigator, /boundary\.externalUxReferences/)
assert.match(navigator, /boundary\.scientificEvidence/)
assert.doesNotMatch(navigator, /fetch\s*\(/)
assert.doesNotMatch(navigator, /new THREE\./)
assert.doesNotMatch(navigator, /GLTFLoader/)
assert.doesNotMatch(navigator, /@react-three/)
assert.doesNotMatch(navigator, /<Canvas\b/)

console.log('Body multisystem scale navigator wiring: exactly one bounded navigator mount remains integrated without duplicate renderer or network behavior.')
