import assert from 'node:assert/strict'
import { HUFNER, KELARUTAN_PLASMA, kandunganOksigen } from '../../src/lib/hemodinamik.ts'
import {
  DEFAULT_OXYGEN_CONTENT_CONVENTION,
  OXYGEN_CONTENT_CONVENTIONS,
  oxygenContentConvention,
  oxygenContentMlDl,
} from '../../src/lib/physiology/oxygenContentConventions.ts'

assert.equal(DEFAULT_OXYGEN_CONTENT_CONVENTION, 'panacea-clinical-effective-v1')
const clinical = oxygenContentConvention(DEFAULT_OXYGEN_CONTENT_CONVENTION)
assert.equal(clinical.executable, true)
assert.equal(clinical.hufnerMlO2PerGHb, HUFNER)
assert.equal(clinical.dissolvedMlO2PerDlPerMmHg, KELARUTAN_PLASMA)
assert.equal(clinical.hbWorkingUnit, 'g/dL')

const ca = oxygenContentMlDl(DEFAULT_OXYGEN_CONTENT_CONVENTION, { value: 15, unit: 'g/dL' }, 0.98, 100)
assert.ok(Math.abs(ca - kandunganOksigen(15, 0.98, 100)) < 1e-12)
assert.ok(Math.abs(oxygenContentMlDl(DEFAULT_OXYGEN_CONTENT_CONVENTION, { value: 150, unit: 'g/L' }, 0.98, 100) - ca) < 1e-12)
assert.ok(Math.abs(ca - 19.998) < 1e-12)

const theoretical = oxygenContentConvention('theoretical-hufner-v1')
assert.equal(theoretical.hufnerMlO2PerGHb, 1.39)
assert.equal(theoretical.dissolvedMlO2PerDlPerMmHg, 0.0031)
assert.ok(oxygenContentMlDl('theoretical-hufner-v1', { value: 15, unit: 'g/dL' }, 0.98, 100) > ca)

const elso = oxygenContentConvention('elso-vv-2021-verbatim')
assert.equal(elso.executable, false)
assert.equal(elso.sourcePrintedHbUnit, 'g/L')
assert.match(elso.unitIssue ?? '', /inconsistent/i)
assert.throws(() => oxygenContentMlDl('elso-vv-2021-verbatim', { value: 12, unit: 'g/dL' }, 0.9, 80), /non-executable/)

assert.equal(new Set(OXYGEN_CONTENT_CONVENTIONS.map((x) => x.id)).size, OXYGEN_CONTENT_CONVENTIONS.length)
assert.throws(() => oxygenContentConvention('unknown' as never), /unknown oxygen-content convention/)
for (const bad of [
  () => oxygenContentMlDl(DEFAULT_OXYGEN_CONTENT_CONVENTION, { value: -1, unit: 'g/dL' }, 0.98, 100),
  () => oxygenContentMlDl(DEFAULT_OXYGEN_CONTENT_CONVENTION, { value: 15, unit: 'g/dL' }, -0.1, 100),
  () => oxygenContentMlDl(DEFAULT_OXYGEN_CONTENT_CONVENTION, { value: 15, unit: 'g/dL' }, 1.1, 100),
  () => oxygenContentMlDl(DEFAULT_OXYGEN_CONTENT_CONVENTION, { value: 15, unit: 'g/dL' }, 0.98, -1),
]) assert.throws(bad, /oxygen-content input/)

console.log('oxygen-content-conventions: unit-explicit registry, legacy compatibility, theoretical variant, ELSO verbatim fail-closed')
