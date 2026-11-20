// The OSA screening inputs (AHI, lowest SpO2) must treat a blank field as "not entered", never as 0 and never as a
// stand-in normal value, and must not invent an ODI. Domain contract + a guard on the screen that feeds it.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { evaluateOsaSleepMonitor } from '../../src/domains/neuro/brainAndOsaEngine.ts'
import { parseNumberField } from '../../src/domains/clinical-calculators/engine/inputs.ts'

const osa = (ahiText: string, spo2Text: string) =>
  evaluateOsaSleepMonitor({
    ahiEventsPerHour: parseNumberField(ahiText),
    odiEventsPerHour: null,
    spo2NadirPct: parseNumberField(spo2Text),
    studySource: 'hsat',
  })

// positive: valid entries are accepted exactly and ODI stays unknown (null), not derived from AHI
{
  const r = osa('3.8', '94')
  assert.equal(r.ok, true)
  if (r.ok) {
    assert.equal(r.ahiEventsPerHour, 3.8)
    assert.equal(r.spo2NadirPct, 94)
    assert.equal(r.odiEventsPerHour, null, 'ODI is not derived from AHI')
    assert.equal(r.clinicallyReviewed, false)
  }
}

// negative: blank / whitespace / non-numeric AHI is rejected with a reason naming the field, not read as 0
for (const bad of ['', '   ', 'abc']) {
  const r = osa(bad, '94')
  assert.equal(r.ok, false, `AHI "${bad}" must be rejected`)
  if (!r.ok) assert.match(r.error, /ahiEventsPerHour/)
}

// negative: blank SpO2 is rejected, not replaced by a normal 94
for (const bad of ['', ' ', 'x']) {
  const r = osa('5', bad)
  assert.equal(r.ok, false, `SpO2 "${bad}" must be rejected`)
  if (!r.ok) assert.match(r.error, /spo2NadirPct/)
}

// paired: the only difference is blank vs "0"; 0 is a real AHI value, blank is not
assert.equal(osa('', '94').ok, false)
assert.equal(osa('0', '94').ok, true)
{
  const zero = osa('0', '94')
  if (zero.ok) assert.equal(zero.ahiEventsPerHour, 0)
}

// boundaries: AHI [0..150], SpO2 [40..100], one step outside rejected
assert.equal(osa('150', '94').ok, true)
assert.equal(osa('150.5', '94').ok, false)
assert.equal(osa('-0.5', '94').ok, false)
assert.equal(osa('5', '40').ok, true)
assert.equal(osa('5', '39.9').ok, false)
assert.equal(osa('5', '100').ok, true)
assert.equal(osa('5', '100.1').ok, false)

// screen guard: raw text state, no fallback to 0 or 94, no demo defaults, no derived ODI
const src = readFileSync(new URL('../../src/components/scan/DigitalTwinScanFlow.tsx', import.meta.url), 'utf8')
assert.match(src, /\[ahiText, setAhiText\] = useState\(''\)/, 'AHI state starts empty')
assert.match(src, /\[spo2NadirText, setSpo2NadirText\] = useState\(''\)/, 'SpO2 state starts empty')
assert.doesNotMatch(src, /Number\(e\.target\.value\) \|\| (0|94)/, 'no empty-to-value fallback')
assert.doesNotMatch(src, /ahi\w*\s*\*\s*0\.85/i, 'ODI is never derived from AHI')
assert.match(src, /parseNumberField\(ahiText\)/)
assert.match(src, /parseNumberField\(spo2NadirText\)/)

console.log('scan-osa-empty-not-zero: blank AHI/SpO2 rejected (not 0, not 94), zero accepted, ODI not derived, boundaries and screen guard PASS')
