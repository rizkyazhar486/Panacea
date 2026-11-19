import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  resolveBodyExposureRegionNode,
  UNIFIED_BODY_REGIONS,
} from '../../src/domains/body-exposure/bodyExposureUnifiedGraphEngine.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

test('bodyExposureUnifiedGraphEngine: resolves all 10 regions with 5-scale zoom, dual-lens & 3-phase bindings', () => {
  assert.equal(UNIFIED_BODY_REGIONS.length, 10)
  for (const reg of UNIFIED_BODY_REGIONS) {
    const res = resolveBodyExposureRegionNode(reg.id, { language: 'id' })
    assert.equal(res.ok, true)
    if (!res.ok) continue
    assert.equal(res.scales.length, 5)
    assert.equal(res.scales[0].scaleMeters, '1.7 m')
    assert.equal(res.scales[4].scaleMeters, '2 nm')
    assert.equal(res.lenses.ok, true)
    assert.equal(res.clinicallyReviewed, false)
    assert.ok(res.continuum.before_illness.length > 5)
    assert.ok(res.continuum.during_illness.length > 5)
    assert.ok(res.continuum.after_illness.length > 5)
  }

  // Negative fail-closed boundary
  const bad = resolveBodyExposureRegionNode('unknown_organ_xyz')
  assert.equal(bad.ok, false)

  // Measured vitals escalate truthClass + emergency trigger appropriately
  const emergencyHeart = resolveBodyExposureRegionNode('heart', {
    systolicMmHg: 192,
    spo2Pct: 87,
  })
  assert.equal(emergencyHeart.ok, true)
  if (emergencyHeart.ok && emergencyHeart.lenses.ok) {
    assert.equal(emergencyHeart.truthClass, 'measured')
    assert.equal(emergencyHeart.lenses.emergencyEscalationRequired, true)
  }
})

test('Purity guard: bodyExposureUnifiedGraphEngine contains zero forbidden browser/clock/random/fetch globals', () => {
  const raw = readFileSync(join(ROOT, 'src/domains/body-exposure/bodyExposureUnifiedGraphEngine.ts'), 'utf8')
  const stripped = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
  for (const pattern of [
    /(?<![\w.$])window(?:\.[A-Za-z_$]|\[)/,
    /(?<![\w.$])document(?:\.[A-Za-z_$]|\[)/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bDate\.now\s*\(/,
    /\bnew\s+Date\s*\(/,
    /\bMath\.random\s*\(/,
    /(?<![\w.$])fetch\s*\(/,
  ]) {
    assert.equal(pattern.test(stripped), false, `Purity violation: ${pattern}`)
  }
})
