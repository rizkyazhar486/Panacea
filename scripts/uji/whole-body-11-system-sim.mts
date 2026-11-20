import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BODY_SYSTEM_SOURCE_WAVE, type BodySystemId } from '../../src/domains/body-exposure/data/bodySystems.ts'
import { SYSTEM_SIMULATIONS, simulationsFor } from '../../src/domains/body-exposure/engine/system-physiology/systemSimulations.ts'
import {
  VERTICAL_GAP_MARKER,
  WHOLE_BODY_11_SPECS,
  WHOLE_BODY_PRESETS,
  defaultParamsForSystem,
  evaluateAll11Systems,
  evaluateWholeBodySystem,
} from '../../src/domains/body-exposure/engine/whole-body-sim/wholeBody11SystemEngine.ts'

const ledger = JSON.parse(
  readFileSync(new URL('../../governance/LITERATURE_CITATION_LEDGER.json', import.meta.url), 'utf8'),
) as { entries: { pmid?: string }[] }
const verifiedPmids = new Set(ledger.entries.map((e) => e.pmid).filter((x): x is string => typeof x === 'string'))
const labSource = readFileSync(new URL('../../src/domains/body-exposure/ui/WholeBody11SystemLab.tsx', import.meta.url), 'utf8')
const atlasHomeSource = readFileSync(new URL('../../src/domains/body-exposure/ui/BodyExposureAtlasHome.tsx', import.meta.url), 'utf8')

export function auditWholeBodyLabUi(lab: string, home: string): string[] {
  const problems: string[] = []
  const code = lab.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
  if (!home.includes("lazy(() => import('./WholeBody11SystemLab'))")) problems.push('BodyExposureAtlasHome does not lazy-load WholeBody11SystemLab')
  if (!code.includes('role="img"')) problems.push('SVG oscilloscope missing role="img" accessibility')
  if (!code.includes('sliderValueText(')) problems.push('sliders missing aria-valuetext with physical units')
  if (!code.includes('truthClass: simulated')) problems.push('lab missing explicit truthClass: simulated badge')
  if (/from\s+['"]three['"]|webgl/i.test(code)) problems.push('lab must not require WebGL')
  if (/\b(lokal|compliant|certified|hipaa|fda|terverifikasi)\b/i.test(code)) problems.push('lab contains forbidden local/compliance wording')
  return problems
}

// ── 1. POSITIVE: ALL 11 canonical atlas systems have interactive mechanistic models, verified citations, curves, and stage routing.
const canonicalIds: BodySystemId[] = BODY_SYSTEM_SOURCE_WAVE.map((s) => s.id)
assert.equal(WHOLE_BODY_11_SPECS.length, 11, 'must model all 11 canonical body systems')
assert.deepEqual(WHOLE_BODY_11_SPECS.map((s) => s.systemId), canonicalIds)

for (const id of canonicalIds) {
  assert.ok(simulationsFor(id).length >= 1, `${id}: must have at least 1 interactive stage simulation`)
  assert.ok(
    SYSTEM_SIMULATIONS[id].some((s) => s.deck === 'whole_body' && s.wholeBodySystem === id),
    `${id}: must wire into whole_body interactive lab`,
  )
}

for (const preset of WHOLE_BODY_PRESETS) {
  const results = evaluateAll11Systems(preset.id)
  assert.equal(results.length, 11, `preset ${preset.id} must evaluate all 11 systems`)
  for (const r of results) {
    assert.equal(r.truthClass, 'simulated')
    assert.equal(r.clinicallyReviewed, false)
    assert.ok(verifiedPmids.has(r.pmid), `${r.systemId}: PMID ${r.pmid} missing from LITERATURE_CITATION_LEDGER.json`)
    assert.ok(r.verticalGapNote.includes(VERTICAL_GAP_MARKER), `${r.systemId}: missing VERTICAL GAP marker`)
    assert.ok(r.metrics.length >= 3, `${r.systemId}: expected >= 3 numeric readouts`)
    assert.ok(r.series.length >= 1 && r.series[0].points.length >= 20, `${r.systemId}: expected live SVG curve points`)
    for (const m of r.metrics) assert.ok(Number.isFinite(m.value), `${r.systemId}.${m.id} non-finite`)
    for (const s of r.series) for (const pt of s.points) {
      assert.ok(Number.isFinite(pt.x) && Number.isFinite(pt.y), `${r.systemId} curve non-finite`)
    }
  }
}

// ── 2. PHYSIOLOGICAL CAUSALITY & BOUNDARY CHECKS
{
  const restCv = evaluateWholeBodySystem('cardiovascular', WHOLE_BODY_PRESETS[0].params.cardiovascular)
  const exCv = evaluateWholeBodySystem('cardiovascular', WHOLE_BODY_PRESETS[1].params.cardiovascular)
  assert.ok(restCv.ok && exCv.ok)
  assert.ok(exCv.metrics[0].value > restCv.metrics[0].value, 'exercise must increase simulated cardiac output')

  const normalRenal = evaluateWholeBodySystem('urinary', { rap: 100 })
  const lowRenal = evaluateWholeBodySystem('urinary', { rap: 60 })
  assert.ok(normalRenal.ok && lowRenal.ok)
  assert.ok(lowRenal.metrics[0].value < normalRenal.metrics[0].value, 'renal hypotension below autoregulation must reduce GFR')

  const apexTone = evaluateWholeBodySystem('sensory-ent', { freqHz: 100 })
  const baseTone = evaluateWholeBodySystem('sensory-ent', { freqHz: 10000 })
  assert.ok(apexTone.ok && baseTone.ok)
  assert.ok(baseTone.metrics[0].value > apexTone.metrics[0].value, 'higher frequency must map closer to cochlear base')

  // Extreme input clamping boundary stays finite
  const clamped = evaluateWholeBodySystem('integumentary-surface', { ambientC: 999, humidity: -50, barrier: 0, coreDelta: 99 })
  assert.ok(clamped.ok && clamped.inputs.ambientC === 45 && clamped.inputs.humidity === 10 && clamped.inputs.barrier === 25)
  assert.deepEqual(defaultParamsForSystem('unknown' as BodySystemId), {})
}

// ── 3. NEGATIVE (PAIRED): unknown systems & NaN/Infinity inputs fail closed!
{
  const badSys = evaluateWholeBodySystem('nonexistent' as BodySystemId, {})
  assert.equal(badSys.ok, false)
  const nanInput = evaluateWholeBodySystem('cardiovascular', { hr: Number.NaN })
  assert.equal(nanInput.ok, false)
  const infInput = evaluateWholeBodySystem('urinary', { rap: Number.POSITIVE_INFINITY })
  assert.equal(infInput.ok, false)
}

// ── 4. UI SOURCE AUDIT & SABOTAGED GATE VERIFICATION
assert.deepEqual(auditWholeBodyLabUi(labSource, atlasHomeSource), [])
{
  const noLazy = atlasHomeSource.replace("lazy(() => import('./WholeBody11SystemLab'))", 'WholeBody11SystemLab')
  assert.notEqual(noLazy, atlasHomeSource)
  assert.ok(auditWholeBodyLabUi(labSource, noLazy).some((p) => p.includes('lazy-load')))

  const noSliderUnits = labSource.replace('sliderValueText(', 'String(')
  assert.notEqual(noSliderUnits, labSource)
  assert.ok(auditWholeBodyLabUi(noSliderUnits, atlasHomeSource).some((p) => p.includes('aria-valuetext')))

  const withLokal = labSource.replace('truthClass: simulated', 'Mode lokal')
  assert.notEqual(withLokal, labSource)
  assert.ok(auditWholeBodyLabUi(withLokal, atlasHomeSource).some((p) => p.includes('forbidden')))
}

console.log('whole-body-11-system-sim: all 11 systems x 6 presets, ledger-verified PMIDs, causality, fail-closed NaN, and sabotaged UI gates PASS')
