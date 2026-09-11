import assert from 'node:assert/strict'
import { cardiacCycleVisualState } from '../../src/lib/cardiacCycleVisual.ts'

const base = cardiacCycleVisualState(0, 72)
assert.ok(base.periodSec > 0)
assert.ok(base.systoleSec > 0 && base.systoleSec < base.periodSec)
assert.equal(base.semilunarValvesOpen, true)
assert.equal(base.avValvesOpen, false)

const systolePeak = cardiacCycleVisualState(base.systoleSec / 2, 72)
assert.ok(systolePeak.systolicPulse > 0.95, 'ventricular systolic visual pulse should peak near mid-systole')
assert.equal(systolePeak.semilunarValvesOpen, true)
assert.equal(systolePeak.avValvesOpen, false)

const diastoleMid = cardiacCycleVisualState(base.systoleSec + (base.periodSec - base.systoleSec) / 2, 72)
assert.ok(diastoleMid.diastolicPulse > 0.95, 'diastolic filling visual pulse should peak near mid-diastole')
assert.equal(diastoleMid.avValvesOpen, true)
assert.equal(diastoleMid.semilunarValvesOpen, false)

const atrial = cardiacCycleVisualState(base.periodSec * 0.95, 72)
assert.ok(atrial.atrialKick > 0, 'late diastole should expose a bounded atrial-contraction visual envelope')
assert.equal(atrial.avValvesOpen, true)

const fast = cardiacCycleVisualState(0, 144)
assert.ok(Math.abs(fast.periodSec * 2 - base.periodSec) < 1e-9, 'doubling HR must halve the rendered cycle period')
assert.ok(fast.systoleSec < base.systoleSec, 'absolute systolic duration should shorten as HR rises')
assert.ok((fast.periodSec - fast.systoleSec) < (base.periodSec - base.systoleSec), 'diastolic filling time should shorten at higher HR')

const wrapped = cardiacCycleVisualState(base.periodSec + base.systoleSec / 2, 72)
assert.ok(Math.abs(wrapped.systolicPulse - systolePeak.systolicPulse) < 1e-9, 'visual cycle must wrap deterministically')

const invalid = cardiacCycleVisualState(Number.NaN, Number.NaN)
assert.equal(invalid.hr, 72)
assert.ok(Number.isFinite(invalid.phaseSec))

console.log('cardiac-cycle-visual: synchronized systole/diastole valve and chamber render envelopes are deterministic')
