import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  HUMAN_SEXUAL_REPRODUCTIVE_PHYSIOLOGY,
  stageAt,
  stagesForDomain,
} from '../../src/lib/humanSexualReproductivePhysiology'

const ui = await readFile(new URL('../../src/pages/bodyhub/HumanSexualReproductivePhysiologyLab.tsx', import.meta.url), 'utf8')
const ids = new Set(HUMAN_SEXUAL_REPRODUCTIVE_PHYSIOLOGY.map((stage) => stage.id))

for (const required of [
  'arousal', 'orgasm-ejaculation', 'female-ejaculation-squirting', 'ovarian-cycle',
  'fertilization', 'implantation', 'pregnancy-adaptation', 'labour', 'hyperemesis',
  'preeclampsia', 'sexual-dysfunction', 'vaginismus', 'orientation', 'gender-identity',
]) assert.ok(ids.has(required), `missing required physiology topic: ${required}`)

assert.ok(stagesForDomain('sexual-response').length >= 3, 'sexual response must include arousal, orgasm/ejaculation and female ejaculation/squirting')
assert.ok(stagesForDomain('fertilization').length >= 2, 'fertilization must distinguish fertilization from implantation')
assert.ok(stagesForDomain('pregnancy-disorders').some((stage) => stage.id === 'hyperemesis'), 'HEG must be represented')
assert.ok(stagesForDomain('pregnancy-disorders').some((stage) => stage.id === 'preeclampsia'), 'pre-eclampsia/eclampsia must be represented')
assert.equal(stageAt('sexual-response', -1)?.id, 'arousal', 'timeline must clamp below zero')
assert.equal(stageAt('orientation-gender', 2)?.id, 'gender-identity', 'timeline must clamp above one')

const orientation = HUMAN_SEXUAL_REPRODUCTIVE_PHYSIOLOGY.find((stage) => stage.id === 'orientation')!
const gender = HUMAN_SEXUAL_REPRODUCTIVE_PHYSIOLOGY.find((stage) => stage.id === 'gender-identity')!
const vaginismus = HUMAN_SEXUAL_REPRODUCTIVE_PHYSIOLOGY.find((stage) => stage.id === 'vaginismus')!
assert.match(orientation.mechanisms.join(' '), /not diseases or sexual dysfunctions/i, 'sexual orientation must be explicitly non-pathologized')
assert.match(gender.mechanisms.join(' '), /not modeled as diseases/i, 'transgender/gender-diverse identity must be explicitly non-pathologized')
assert.match(gender.clinicalBoundary ?? '', /Identity is not a pathology/i, 'identity boundary must remain explicit')
assert.match(gender.mechanisms.join(' '), /Cross-dressing.*not treated as pathology/i, 'gender expression/cross-dressing must not be pathologized by default')
assert.match(vaginismus.mechanisms.join(' '), /pelvic-floor guarding/i, 'vaginismus-type presentation must include pelvic-floor mechanism without calling identity a cause')

const allText = HUMAN_SEXUAL_REPRODUCTIVE_PHYSIOLOGY.flatMap((stage) => [...stage.mechanisms, stage.clinicalBoundary ?? '']).join(' ')
assert.doesNotMatch(allText, /conversion therapy|cure homosexuality|cure transgender|orientation disorder/i, 'atlas must never encode conversion/pathologizing claims')
assert.doesNotMatch(allText, /patient-specific|your diagnosis|your risk score/i, 'atlas must not claim patient-specific inference')

assert.match(ui, /role="tablist"/, 'interactive physiology lab must expose domain tabs')
assert.match(ui, /type="range"/, 'interactive physiology lab must expose a mechanism timeline')
assert.match(ui, /min-h-\[44px\]/, 'interactive controls must preserve mobile touch targets')
assert.match(ui, /Sexual orientation, lesbian\/gay\/bisexual identities, transgender identity and gender expression are represented as human diversity, not disease/, 'UI must visibly preserve inclusive clinical framing')
assert.match(ui, /does not diagnose a person or infer identity from anatomy, hormones, genes or behavior/, 'UI must visibly reject patient identity inference')

console.log(`human sexual/reproductive physiology acceptance passed: ${HUMAN_SEXUAL_REPRODUCTIVE_PHYSIOLOGY.length} stages`)
