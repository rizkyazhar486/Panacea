import assert from 'node:assert/strict'
import { parseJetLagHours, validDepartureDate, sanitizeJetLagPlan } from '../../src/domains/personal-health/engine/jetLagInputs.ts'
for(let n=-12;n<=12;n++) {assert.equal(parseJetLagHours(n),n);assert.equal(parseJetLagHours(String(n)),n)}
for(const bad of ['', ' ', 'foo', 'Infinity', 'NaN', '1.5', '1e1', '13', '-13', NaN, Infinity, -Infinity, 1.5, 13, -13, null, undefined, {}, [], true]) assert.equal(parseJetLagHours(bad),null)
assert.equal(parseJetLagHours('0'),0)
assert.equal(validDepartureDate('2024-02-29'),'2024-02-29')
for(const bad of ['2026-02-29','1900-02-29','2026-04-31','2026-13-01','bad',0,{},null]) assert.equal(validDepartureDate(bad),'')
assert.deepEqual(sanitizeJetLagPlan({selisih:'Infinity',tanggal:'2026-02-31'}),{selisih:'',tanggal:''})
assert.deepEqual(sanitizeJetLagPlan({selisih:'0',tanggal:'2026-10-20'}),{selisih:'0',tanggal:'2026-10-20'})
assert.deepEqual(sanitizeJetLagPlan(null),{selisih:'',tanggal:''})
console.log('Jet lag: explicit zero, whole-hour boundaries, corrupt cache and calendar validity PASS')
