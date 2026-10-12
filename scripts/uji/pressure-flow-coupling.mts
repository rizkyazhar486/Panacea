import assert from 'node:assert/strict'
import { createDomainEngineRegistry, runPhysiologicalSimulation, type BoundaryCondition } from '../../src/lib/physiology/runtime.ts'
import { cardiovascularIdentityEngine } from '../../src/lib/physiology/cardiovascularIdentityEngine.ts'
import {
  PRESSURE_FLOW_BOUNDARY, PRESSURE_FLOW_EVIDENCE, SVR_UNIT, WOOD_TO_DYNE_SECOND_CM5,
  cerebralPerfusionPressureEngine, meanArterialPressureEngine,
} from '../../src/lib/physiology/pressureFlowCoupling.ts'

// Sintetis, hanya untuk menguji komposisi; bukan nilai bawaan pasien.
const at = '2026-10-12T10:00:00.000Z'
function boundary(name: string, unit: string, value: number, sigma: number | null = null, truthClass: BoundaryCondition['truthClass'] = 'measured'): BoundaryCondition {
  return { name, unit, value, sigma, truthClass, source: { id: `obs-${name}`, subjectId: 'qa-patient', sourceId: 'qa-instrument', capturedAt: at, semanticState: truthClass } }
}
const FIELDS = [
  { name: 'cardio.heart_rate', unit: 'bpm' }, { name: 'cardio.lv.edv', unit: 'mL' }, { name: 'cardio.lv.esv', unit: 'mL' },
  { name: 'systemic.vascular_resistance', unit: SVR_UNIT }, { name: 'venous.central_pressure', unit: 'mmHg' }, { name: 'intracranial.pressure', unit: 'mmHg' },
]
const registry = createDomainEngineRegistry([cerebralPerfusionPressureEngine(), meanArterialPressureEngine(), cardiovascularIdentityEngine()], FIELDS)
function run(overrides: Record<string, BoundaryCondition> = {}) {
  const base: Record<string, BoundaryCondition> = {
    'cardio.heart_rate': boundary('cardio.heart_rate', 'bpm', 80, 2), 'cardio.lv.edv': boundary('cardio.lv.edv', 'mL', 120, 3), 'cardio.lv.esv': boundary('cardio.lv.esv', 'mL', 50, 3),
    'systemic.vascular_resistance': boundary('systemic.vascular_resistance', SVR_UNIT, 1200, 60), 'venous.central_pressure': boundary('venous.central_pressure', 'mmHg', 6, 1),
    'intracranial.pressure': boundary('intracranial.pressure', 'mmHg', 10, 2),
  }
  return runPhysiologicalSimulation({ registry, boundaryConditions: Object.values({ ...base, ...overrides }), untilSeconds: 0 })
}

// 1. Rantai lengkap HR/EDV/ESV -> CO -> MAP -> CPP, nilai dihitung dengan tangan.
const r = run()
assert.equal(r.latest['cardio.cardiac_output'].value, 5.6)                 // 80 × 70 mL
assert.ok(Math.abs(r.latest['arterial.mean_pressure'].value - (5.6 * 1200 / 80 + 6)) < 1e-12) // 90
assert.ok(Math.abs(r.latest['cerebral.perfusion_pressure'].value - 80) < 1e-12)
for (const name of ['arterial.mean_pressure', 'cerebral.perfusion_pressure']) assert.equal(r.latest[name].truthClass, 'model-derived')

// 2. Provenans: CPP bersumber dari MAP, MAP dari CO + SVR + CVP; akar semuanya adalah observasi.
const byId = new Map(r.provenance.map(p => [p.id, p]))
function roots(id: string, seen = new Set<string>()): Set<string> {
  const node = byId.get(id); assert(node, `missing provenance ${id}`)
  if (node.kind === 'boundary') return new Set([node.id])
  const out = new Set<string>()
  for (const parent of node.parents) if (!seen.has(parent)) { seen.add(parent); roots(parent, seen).forEach(x => out.add(x)) }
  return out
}
const cppRoots = roots(r.latest['cerebral.perfusion_pressure'].provenance.id)
for (const name of ['cardio.heart_rate', 'cardio.lv.edv', 'cardio.lv.esv', 'systemic.vascular_resistance', 'venous.central_pressure', 'intracranial.pressure']) {
  assert(cppRoots.has(r.boundaries[name].provenance.id), `CPP must trace to ${name}`)
}

// 3. Invarian yang bisa dibantah: arah dan besar perubahan.
const m0 = r.latest['arterial.mean_pressure'].value
assert.ok(Math.abs(run({ 'systemic.vascular_resistance': boundary('systemic.vascular_resistance', SVR_UNIT, 1400, 60) }).latest['arterial.mean_pressure'].value - m0 - 5.6 * 200 / 80) < 1e-12, 'SVR +200 raises MAP by CO×200/80')
assert.ok(Math.abs(run({ 'venous.central_pressure': boundary('venous.central_pressure', 'mmHg', 11, 1) }).latest['arterial.mean_pressure'].value - m0 - 5) < 1e-12, 'CVP is additive')
assert.ok(Math.abs(run({ 'intracranial.pressure': boundary('intracranial.pressure', 'mmHg', 25, 2) }).latest['cerebral.perfusion_pressure'].value - 65) < 1e-12, 'ICP +15 lowers CPP by 15')
assert.equal(run({ 'intracranial.pressure': boundary('intracranial.pressure', 'mmHg', 25, 2) }).latest['arterial.mean_pressure'].value, m0, 'ICP does not feed back into MAP')

// 4. Sigma: propagasi orde pertama; satu sigma hilang -> null, tidak dikarang.
const sMap = r.latest['arterial.mean_pressure'].sigma!
const sCo = r.latest['cardio.cardiac_output'].sigma!
assert.ok(Math.abs(sMap - Math.hypot((1200 / 80) * sCo, (5.6 / 80) * 60, 1)) < 1e-12)
assert.ok(Math.abs(r.latest['cerebral.perfusion_pressure'].sigma! - Math.hypot(sMap, 2)) < 1e-12)
assert.equal(run({ 'systemic.vascular_resistance': boundary('systemic.vascular_resistance', SVR_UNIT, 1200, null) }).latest['arterial.mean_pressure'].sigma, null)

// 5. Konstanta 80 berasal dari satuan: 1 mmHg·min/L dalam dyn·s/cm^5.
const exact = 1333.223684 / (1000 / 60)
assert.ok(Math.abs(exact - WOOD_TO_DYNE_SECOND_CM5) / WOOD_TO_DYNE_SECOND_CM5 < 1e-3, `80 vs derived ${exact}`)

// 6. Sabotase: masukan mustahil atau satuan salah ditolak, bukan diubah jadi angka yang tampak wajar.
assert.throws(() => run({ 'systemic.vascular_resistance': boundary('systemic.vascular_resistance', SVR_UNIT, 0) }), /outside supported bounds/)
assert.throws(() => run({ 'systemic.vascular_resistance': boundary('systemic.vascular_resistance', SVR_UNIT, -5) }), /outside supported bounds/)
assert.throws(() => run({ 'venous.central_pressure': boundary('venous.central_pressure', 'mmHg', Number.NaN) }), /./)
assert.throws(() => run({ 'systemic.vascular_resistance': boundary('systemic.vascular_resistance', 'mmHg*min/L', 15) }), /unit mismatch/)
assert.throws(() => run({ 'intracranial.pressure': boundary('intracranial.pressure', 'mmHg', -1) }), /intracranial pressure must be a non-negative finite number/)
assert.throws(() => run({ 'systemic.vascular_resistance': boundary('systemic.vascular_resistance', SVR_UNIT, 1, null) , 'venous.central_pressure': boundary('venous.central_pressure', 'mmHg', -50) }), /not a positive finite value/)
// Rantai tanpa CVP terdeklarasi gagal pada komposisi, bukan mengisi nilai bawaan.
assert.throws(() => createDomainEngineRegistry([meanArterialPressureEngine(), cardiovascularIdentityEngine()], FIELDS.filter(f => f.name !== 'venous.central_pressure')), /venous\.central_pressure/)

// 7. Bukti dan batas klaim terkunci.
for (const ref of ['NBK556075', 'NBK470455', 'NBK538226', 'NBK537271']) assert.ok(PRESSURE_FLOW_EVIDENCE.some(e => e.reference.endsWith(ref)), `missing evidence ${ref}`)
for (const required of ['do not model pulsatility', 'not a population default', 'no clinical validation', 'not a diagnosis']) {
  assert.ok(PRESSURE_FLOW_BOUNDARY.toLowerCase().includes(required.toLowerCase()), `boundary missing "${required}"`)
}
console.log('pressure-flow coupling: CO -> MAP -> CPP chain, provenance roots, sigma propagation, unit/bounds rejection and claim boundary locked')
