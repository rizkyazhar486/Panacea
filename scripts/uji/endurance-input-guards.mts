import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  parseNumberText, readAltitudeExposure, readAltitudeMeters, readFuelDuration, readHeatExposure,
  readBodyWeight, readOptionalTemperature, readPowerGuideInputs, readSegments, readSweatTest,
} from '../../src/lib/endurance/inputs.ts'

const ok = <T,>(r: { ok: boolean }) => { assert.equal(r.ok, true, JSON.stringify(r)); return (r as { ok: true; value: T }).value }
const reason = (r: { ok: boolean }) => { assert.equal(r.ok, false, JSON.stringify(r)); return (r as { ok: false; reason: string }).reason }

// 1. "Not filled in" is never 0: blank and whitespace are NaN, and every reader asks for the value instead of inventing one.
assert.ok(Number.isNaN(parseNumberText('')) && Number.isNaN(parseNumberText('   ')) && Number.isNaN(parseNumberText(undefined)))
assert.equal(parseNumberText('12.5'), 12.5)
assert.match(reason(readFuelDuration('')), /^Enter the session duration\.$/)
assert.match(reason(readFuelDuration('  ')), /Enter/)
assert.match(reason(readHeatExposure('', '60')), /Enter the temperature/)
assert.match(reason(readHeatExposure('32', '')), /Enter the minutes/)
assert.match(reason(readAltitudeExposure('', '14')), /Enter the altitude/)
assert.match(reason(readAltitudeExposure('2500', '')), /Enter the hours/)
assert.match(reason(readPowerGuideInputs({ ftp: '', mass: '75', hours: '2' })), /Enter your FTP/)
assert.match(reason(readPowerGuideInputs({ ftp: '238', mass: '', hours: '2' })), /Enter the total weight/)
assert.match(reason(readPowerGuideInputs({ ftp: '238', mass: '75', hours: '' })), /Enter the estimated hours/)
assert.match(reason(readSegments([{ nama: 'a', jarak: '', gradien: '0' }])), /Enter the distance of segment 1/)
assert.match(reason(readSegments([{ nama: 'a', jarak: '5', gradien: '0' }, { nama: 'b', jarak: '5', gradien: '' }])), /Enter the gradient of segment 2/)

// 2. Hand-checked valid values pass through unchanged.
assert.equal(ok<number>(readFuelDuration('180')), 180)
assert.deepEqual(ok(readHeatExposure('32', '60')), { suhuC: 32, menit: 60 })
assert.deepEqual(ok(readAltitudeExposure('2500', '14')), { meter: 2500, jam: 14 })
assert.deepEqual(ok(readPowerGuideInputs({ ftp: '238', mass: '74', hours: '2.5' })), { ftpWatt: 238, totalMassKg: 74, durationHours: 2.5 })
assert.deepEqual(ok(readSegments([{ nama: 'Climb', jarak: '8', gradien: '7' }, { nama: 'Descent', jarak: '8.5', gradien: '-6' }])), [
  { nama: 'Climb', jarakKm: 8, gradienPct: 7 }, { nama: 'Descent', jarakKm: 8.5, gradienPct: -6 },
])
assert.equal(ok<number | undefined>(readOptionalTemperature('')), undefined, 'blank temperature means unknown, not 0 °C')
assert.equal(ok<number | undefined>(readOptionalTemperature('0')), 0, 'an explicit 0 °C is a real value')
assert.equal(ok<number | undefined>(readOptionalTemperature('30')), 30)
assert.equal(ok<number>(readAltitudeMeters('0')), 0)

// 3. Boundaries: inclusive where a zero or the limit is physically meaningful, exclusive where zero means "nothing happened".
assert.equal(ok<number>(readFuelDuration('2880')), 2880); reason(readFuelDuration('2881')); reason(readFuelDuration('0')); reason(readFuelDuration('-30'))
assert.deepEqual(ok(readHeatExposure('-50', '1')), { suhuC: -50, menit: 1 }); ok(readHeatExposure('60', '1440')); reason(readHeatExposure('61', '60')); reason(readHeatExposure('32', '0')); reason(readHeatExposure('32', '1441'))
assert.deepEqual(ok(readAltitudeExposure('0', '24')), { meter: 0, jam: 24 }); ok(readAltitudeExposure('9000', '0.5')); reason(readAltitudeExposure('9001', '14')); reason(readAltitudeExposure('-1', '14')); reason(readAltitudeExposure('2500', '0')); reason(readAltitudeExposure('2500', '24.5'))
ok(readPowerGuideInputs({ ftp: '50', mass: '20', hours: '48' })); ok(readPowerGuideInputs({ ftp: '2000', mass: '300', hours: '0.25' }))
for (const bad of [{ ftp: '49', mass: '75', hours: '2' }, { ftp: '2001', mass: '75', hours: '2' }, { ftp: '238', mass: '19', hours: '2' }, { ftp: '238', mass: '301', hours: '2' }, { ftp: '238', mass: '75', hours: '0' }, { ftp: '238', mass: '75', hours: '49' }]) reason(readPowerGuideInputs(bad))
ok(readSegments([{ nama: 'x', jarak: '1000', gradien: '40' }])); ok(readSegments([{ nama: 'x', jarak: '0.1', gradien: '-40' }]))
for (const bad of [{ jarak: '0', gradien: '0' }, { jarak: '1001', gradien: '0' }, { jarak: '-5', gradien: '0' }, { jarak: '5', gradien: '41' }, { jarak: '5', gradien: '-41' }]) reason(readSegments([{ nama: 'x', ...bad }]))
assert.match(reason(readSegments([])), /at least one route segment/)

// 4. Garbage never becomes a number: NaN, Infinity, partial numbers, fractions where a whole number is required.
for (const garbage of ['abc', 'NaN', 'Infinity', '-Infinity', '1e999', '12abc', '5 5']) {
  reason(readFuelDuration(garbage)); reason(readHeatExposure(garbage, '60')); reason(readAltitudeExposure(garbage, '14'))
  reason(readPowerGuideInputs({ ftp: garbage, mass: '75', hours: '2' })); reason(readSegments([{ nama: 'x', jarak: garbage, gradien: '0' }]))
  reason(readOptionalTemperature(garbage))
}
assert.match(reason(readHeatExposure('32', '60.5')), /whole number/)
assert.match(reason(readAltitudeExposure('2500.5', '14')), /whole number/)
assert.match(reason(readFuelDuration('abc')), /must be a number/)

// 4b. Sweat test: all four fields are required; "drank nothing" must be typed as 0, never inferred from an empty box.
const sweat = { before: '70.0', after: '68.8', minutes: '60', drunk: '500' }
assert.deepEqual(ok(readSweatTest(sweat)), { beforeKg: 70, afterKg: 68.8, minutes: 60, drunkMl: 500 })
assert.equal(ok<{ drunkMl: number }>(readSweatTest({ ...sweat, drunk: '0' })).drunkMl, 0, 'an explicit 0 mL is a real answer')
assert.match(reason(readSweatTest({ ...sweat, drunk: '' })), /Enter the total drunk/)
assert.match(reason(readSweatTest({ ...sweat, before: '' })), /Enter the weight before/)
assert.match(reason(readSweatTest({ ...sweat, after: '  ' })), /Enter the weight after/)
assert.match(reason(readSweatTest({ ...sweat, minutes: '0' })), /session duration/)
for (const bad of [{ drunk: '-1' }, { drunk: '20001' }, { before: '19' }, { after: '301' }, { minutes: '2881' }, { drunk: 'abc' }]) reason(readSweatTest({ ...sweat, ...bad }))
ok(readSweatTest({ ...sweat, drunk: '20000' }))
// Body weight for the fuel plan: required, never defaulted.
assert.match(reason(readBodyWeight('')), /Enter your body weight/)
assert.equal(ok<number>(readBodyWeight('64.5')), 64.5); ok(readBodyWeight('20')); ok(readBodyWeight('300')); reason(readBodyWeight('19.9')); reason(readBodyWeight('300.1')); reason(readBodyWeight('x'))

// 5. The page must use these guards: no silent numeric fallbacks may come back into EnduranceTools.
const page = readFileSync(new URL('../../src/pages/fitness/EnduranceTools.tsx', import.meta.url), 'utf8')
for (const forbidden of [/Number\([^)]*\)\s*\|\|\s*\d/, /parseFloat\([^)]*\)\s*\|\|\s*\d/, /parseInt\([^)]*\)\s*\|\|\s*\d/]) {
  assert.doesNotMatch(page, forbidden, `EnduranceTools must not turn blank or invalid text into a made-up number: ${forbidden}`)
}
for (const guard of ['readFuelDuration', 'readOptionalTemperature', 'readPowerGuideInputs', 'readSegments', 'readHeatExposure', 'readAltitudeExposure', 'readAltitudeMeters']) {
  assert.match(page, new RegExp(`\\b${guard}\\b`), `EnduranceTools must call ${guard}`)
}

console.log('endurance input guards: blank is never 0, bounds and garbage rejected with reasons, optional temperature, page forbids silent fallbacks')
