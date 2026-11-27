import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { hillFormula, parseSdfV2000 } from '../../src/lib/kimia/sdfV2000.ts'

// Every bundled conformer must parse, and its atoms must add up to the formula
// PubChem publishes for that CID; a stray or truncated file fails here.
const manifest = JSON.parse(readFileSync('public/molecules/manifest.json', 'utf8'))
const EXPECTED: Record<string, string> = {
  glucose: 'C6H12O6',
  pyruvate: 'C3H3O3',
  'nad-plus': 'C21H28N7O14P2',
  nadh: 'C21H29N7O14P2',
  adp: 'C10H15N5O10P2',
  atp: 'C10H16N5O13P3',
  oxygen: 'O2',
  co2: 'CO2',
}

for (const [id, formula] of Object.entries(EXPECTED)) {
  const entry = manifest.compounds[id]
  assert.ok(entry?.conformer, `${id} must ship a PubChem conformer`)
  assert.match(entry.sourceUrl, /^https:\/\/pubchem\.ncbi\.nlm\.nih\.gov\/rest\/pug\/compound\/cid\/\d+\/SDF\?record_type=3d$/)
  const molecule = parseSdfV2000(readFileSync(`public/molecules/${entry.conformer}`, 'utf8'))
  assert.equal(hillFormula(molecule), formula, `${id} atoms must match PubChem formula`)
  assert.ok(molecule.bonds.length > 0)
}

// Compounds without a PubChem 3D record stay un-rendered with the reason kept.
for (const id of ['acetyl-coa', 'fad', 'fadh2']) {
  assert.equal(manifest.compounds[id].conformer, null)
  assert.match(manifest.compounds[id].reason, /no computed 3D conformer/)
}

assert.throws(() => parseSdfV2000('x\ny\nz\n  1  0  0  0  0  0  0  0  0  0999 V3000\n'))

const stage = readFileSync('src/pages/bodyhub/MolecularChemistryStage.tsx', 'utf8')
assert.match(stage, /Molecule3DViewer/, 'the Compound rung renders compounds in 3D')
// The CIDs cited in the stage source and the fetched records must be the same compounds.
for (const [, id, cid] of stage.matchAll(/id: '([^']+)'[^}]*pubchemCid: (\d+)/g)) {
  assert.equal(manifest.compounds[id!].cid, Number(cid), `${id} manifest CID must match the cited CID`)
}
console.log('PubChem 3D conformers verified against published formulas.')

const viewer = readFileSync('src/pages/bodyhub/Molecule3DViewer.tsx', 'utf8')
assert.match(viewer, /buatRendererAman/, 'Molecule3DViewer must use safe WebGL renderer wrapper')
assert.match(viewer, /mulaiLoopTerjaga/, 'Molecule3DViewer must use guarded render loop')
assert.match(viewer, /space-filling/, 'Molecule3DViewer must support space-filling representation')
assert.match(stage, /not a measured patient flux/)
assert.match(stage, /must bind to verified chemical\/protein identifiers before they are rendered as source-backed 3D/)
