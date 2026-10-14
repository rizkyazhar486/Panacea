import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const home = readFileSync(new URL('../../src/pages/HomeSocialWorkspace.tsx', import.meta.url), 'utf8')
const intent = readFileSync(new URL('../../src/styles/home-intent-motion.css', import.meta.url), 'utf8')
const recovery = readFileSync(new URL('../../src/components/dashboard/HomeRecoveryVisuals.tsx', import.meta.url), 'utf8')
const clinical = readFileSync(new URL('../../src/pages/clinical/ClinicalHub.tsx', import.meta.url), 'utf8')
const forYou = readFileSync(new URL('../../src/pages/social/ForYouHub.tsx', import.meta.url), 'utf8')
const zoneNav = readFileSync(new URL('../../src/components/ui/PanaceaZoneNav.tsx', import.meta.url), 'utf8')

assert.ok(home.indexOf('<HomeHealthBrief />') < home.indexOf('<HomeVisualLanding />'))
assert.ok(home.indexOf('<HomeVisualLanding />') < home.indexOf('<SuperPageLauncher />'))
assert.doesNotMatch(home, /<ForYouSocialPulse/)

// PR #2530 moved this header into the desktop bento. Assert its compact type
// and >=44px touch floor, plus the larger mobile override, rather than the retired card height.
assert.match(intent, /font-size: clamp\(20px, 2\.2vw, 26px\)/)
assert.match(intent, /min-height: 50px/)
assert.match(intent, /font-size: clamp\(24px, 7\.2vw, 31px\)/)
assert.match(intent, /min-height: 48px/)
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
