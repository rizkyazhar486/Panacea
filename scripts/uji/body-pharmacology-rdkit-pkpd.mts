import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  BUNDLED_RDKIT_DRUGS,
  PKPD_STUDIO_BOUNDARY,
  resolveDrugForMechanism,
  simulateMultiDosePkPd,
} from '../../src/domains/body-exposure/engine/pkPdCompartmentEngine.ts'

// 1. Every single one of the 34 catalogued RDKit 3D drug JSONs must exist on disk & have valid 3D coordinates + bonds
assert.equal(BUNDLED_RDKIT_DRUGS.length, 34, 'All 34 bundled RDKit 3D drug conformers must be catalogued')
assert.equal(PKPD_STUDIO_BOUNDARY.clinicalPrescribingAuthorized, false)
for (const drug of BUNDLED_RDKIT_DRUGS) {
  const parsed = JSON.parse(readFileSync(`public/molecules/${drug.slug}.json`, 'utf8')) as {
    name: string
    formula: string
    atoms: [string, number, number, number][]
    bonds: [number, number, number][]
  }
  assert.ok(parsed.atoms.length >= 6, `${drug.slug} must have 3D atoms`)
  assert.ok(parsed.bonds.length >= 5, `${drug.slug} must have covalent bonds`)
}

// 2. Mechanism bridge & Bateman multi-dose renal accumulation physics
assert.equal(resolveDrugForMechanism('statin-hmgcr').slug, 'atorvastatin')
assert.equal(resolveDrugForMechanism('ace-inhibition').slug, 'lisinopril')
const metformin = BUNDLED_RDKIT_DRUGS.find((d) => d.slug === 'metformin')!
const norm = simulateMultiDosePkPd({ drug: metformin, doseMg: 500, intervalHours: 12, renalClFactor: 1.0 })
const ckd = simulateMultiDosePkPd({ drug: metformin, doseMg: 500, intervalHours: 12, renalClFactor: 0.3 })
assert.ok(ckd.peakMgL > norm.peakMgL * 1.9, 'Renally cleared drug must accumulate strongly when renalClFactor drops')
assert.ok(ckd.effectiveHalfLifeHours > norm.effectiveHalfLifeHours * 2.5)

// 3. Guardrails: safe renderer, guarded render loop, dark marker, lazy mounting
const viewer = readFileSync('src/pages/bodyhub/DrugMolecule3DViewer.tsx', 'utf8')
assert.match(viewer, /buatRendererAman/)
assert.match(viewer, /mulaiLoopTerjaga/)
assert.doesNotMatch(viewer, /new THREE\.WebGLRenderer/)
const studio = readFileSync('src/pages/bodyhub/DrugPkPd3DStudio.tsx', 'utf8')
assert.match(studio, /className="dark space-y-3/)
assert.match(studio, /data-clinical-prescribing-authorized="false"/)
const panel = readFileSync('src/pages/bodyhub/PharmacologyMechanismPanel.tsx', 'utf8')
assert.match(panel, /lazy\(\(\) => import\('\.\/DrugPkPd3DStudio'\)\)/)

console.log('body-pharmacology-rdkit-pkpd: PASS (34 real RDKit 3D drug JSONs verified, Bateman PK-PD & safe WebGL guards)')
