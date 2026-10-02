import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const home = readFileSync(new URL('../../src/pages/HomeSocialWorkspace.tsx', import.meta.url), 'utf8')
const intent = readFileSync(new URL('../../src/styles/home-intent-motion.css', import.meta.url), 'utf8')
const recovery = readFileSync(new URL('../../src/components/HomeRecoveryVisuals.tsx', import.meta.url), 'utf8')
const clinical = readFileSync(new URL('../../src/pages/ClinicalHub.tsx', import.meta.url), 'utf8')
const forYou = readFileSync(new URL('../../src/pages/ForYouHub.tsx', import.meta.url), 'utf8')
const zoneNav = readFileSync(new URL('../../src/components/PanaceaZoneNav.tsx', import.meta.url), 'utf8')

assert.ok(home.indexOf('<HomeHealthBrief />') < home.indexOf('<HomeVisualLanding />'))
assert.ok(home.indexOf('<HomeVisualLanding />') < home.indexOf('<SuperPageLauncher />'))
assert.doesNotMatch(home, /<ForYouSocialPulse/)

assert.match(intent, /font-size: clamp\(22px, 3\.2vw, 34px\)/)
assert.match(intent, /min-height: 116px/)
assert.doesNotMatch(recovery, /pmd-recovery-meter/)
assert.doesNotMatch(recovery, /Array\.from\(\{ length: 7 \}\)/)

assert.match(clinical, /const \[weight, setWeight\] = useState\(''\)/)
assert.match(clinical, /BMI = kg ÷ m²/)
assert.match(clinical, /MAP = \(SBP \+ 2×DBP\) ÷ 3/)
assert.match(clinical, /bmi == null \? '—'/)

assert.match(forYou, /useState<number \| null>\(null\)/)
assert.match(forYou, /Self-rated · 0–100/)
assert.doesNotMatch(forYou, /useState\(72\)/)

assert.match(zoneNav, /min-h-\[52px\]/)
assert.match(zoneNav, /min-w-\[74px\]/)

console.log('clarity-pass-v51: home order, truthful visuals, clinical inputs, self-rated check-in, and compact zone navigation are locked')
