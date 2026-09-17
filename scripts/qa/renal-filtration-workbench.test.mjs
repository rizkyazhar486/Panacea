import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { RENAL_FILTRATION_BOUNDARY, RENAL_FILTRATION_DEFAULTS, RENAL_FILTRATION_EQUATIONS, deriveRenalFiltration, normalizeRenalFiltrationInputs } from '../../src/lib/renalFiltrationLab.ts'

const baseline = deriveRenalFiltration(RENAL_FILTRATION_DEFAULTS)
for (const value of Object.values(baseline)) assert.ok(typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1)
const lowPerfusion = deriveRenalFiltration({ ...RENAL_FILTRATION_DEFAULTS, renalPlasmaFlow: 0.2 })
const highPerfusion = deriveRenalFiltration({ ...RENAL_FILTRATION_DEFAULTS, renalPlasmaFlow: 0.9 })
assert.ok(highPerfusion.filtrationSignal > lowPerfusion.filtrationSignal)
const lowBarrier = deriveRenalFiltration({ ...RENAL_FILTRATION_DEFAULTS, filtrationBarrier: 0.2 })
const highBarrier = deriveRenalFiltration({ ...RENAL_FILTRATION_DEFAULTS, filtrationBarrier: 0.9 })
assert.ok(highBarrier.filtrationSignal > lowBarrier.filtrationSignal)
const dehydrated = deriveRenalFiltration({ ...RENAL_FILTRATION_DEFAULTS, waterConservationDrive: 0.9 })
const dilute = deriveRenalFiltration({ ...RENAL_FILTRATION_DEFAULTS, waterConservationDrive: 0.1 })
assert.ok(dehydrated.relativeUrineFlowSignal < dilute.relativeUrineFlowSignal)
const normalized = normalizeRenalFiltrationInputs({ renalPlasmaFlow: 9, filtrationBarrier: -2, waterConservationDrive: Number.NaN })
assert.equal(normalized.renalPlasmaFlow, 1); assert.equal(normalized.filtrationBarrier, 0); assert.equal(normalized.waterConservationDrive, 0)
for (const token of ['FF = GFR / RPF', 'Filtered load = GFR × Pₓ', 'Cₓ = Uₓ × V / Pₓ']) assert.ok(RENAL_FILTRATION_EQUATIONS.some(item => item.expression === token))
assert.match(RENAL_FILTRATION_BOUNDARY, /synthetic dimensionless signals/i); assert.match(RENAL_FILTRATION_BOUNDARY, /not patient-specific/i)
const workspace = await readFile(new URL('../../src/pages/bodyhub/BodySystemDeepDiveWorkspace.tsx', import.meta.url), 'utf8')
assert.match(workspace, /selectedAtlasSystemId === 'urinary'/); assert.match(workspace, /RenalFiltrationWorkbench/)
console.log('renal filtration workbench: directional physiology, equations, safety boundary and reachability locked')