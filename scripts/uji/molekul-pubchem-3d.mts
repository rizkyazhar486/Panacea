import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { hillFormula, molarMassDa, parseSdfV2000, summarizeSdfChemistry } from '../../src/lib/kimia/sdfV2000.ts'

// Every bundled conformer must parse, and its atoms must add up to the formula
// PubChem publishes for that CID; a stray or truncated file fails here.
const manifest = JSON.parse(readFileSync('public/molecules/manifest.json', 'utf8'))
const EXPECTED: Record<string, string> = {
  glucose: 'C6H12O6',
  pyruvate: 'C3H3O3',
  lactate: 'C3H6O3',
  citrate: 'C6H8O7',
  'nad-plus': 'C21H28N7O14P2',
  nadh: 'C21H29N7O14P2',
  adp: 'C10H15N5O10P2',
  atp: 'C10H16N5O13P3',
  oxygen: 'O2',
  co2: 'CO2',
  dopamine: 'C8H11NO2',
  serotonin: 'C10H12N2O',
  acetylcholine: 'C7H16NO2',
  epinephrine: 'C9H13NO3',
  norepinephrine: 'C8H11NO3',
  gaba: 'C4H9NO2',
  glutamate: 'C5H9NO4',
  histamine: 'C5H9N3',
  cortisol: 'C21H30O5',
  estradiol: 'C18H24O2',
  melatonin: 'C13H16N2O2',
  cholesterol: 'C27H46O',
}

for (const [id, formula] of Object.entries(EXPECTED)) {
  const entry = manifest.compounds[id]
  assert.ok(entry?.conformer, `${id} must ship a PubChem conformer`)
  assert.match(entry.sourceUrl, /^https:\/\/pubchem\.ncbi\.nlm\.nih\.gov\/rest\/pug\/compound\/cid\/\d+\/SDF\?record_type=3d$/)
  const molecule = parseSdfV2000(readFileSync(`public/molecules/${entry.conformer}`, 'utf8'))
  assert.equal(hillFormula(molecule), formula, `${id} atoms must match PubChem formula`)
  assert.ok(molecule.bonds.length > 0)
  const summary = summarizeSdfChemistry(molecule)
  assert.equal(summary.hillFormula, formula)
  assert.ok(summary.molarMassDa > 20, `${id} molar mass must be physical`)
}

// Sanity check exact IUPAC molar mass for Glucose (180.156 Da) and Dopamine (153.18 Da)
const glucoseMol = parseSdfV2000(readFileSync('public/molecules/glucose.sdf', 'utf8'))
assert.ok(Math.abs(molarMassDa(glucoseMol) - 180.16) < 0.05)
const dopamineMol = parseSdfV2000(readFileSync('public/molecules/dopamine.sdf', 'utf8'))
assert.ok(Math.abs(molarMassDa(dopamineMol) - 153.18) < 0.05)

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

const viewer = readFileSync('src/pages/bodyhub/Molecule3DViewer.tsx', 'utf8')
assert.match(viewer, /buatRendererAman/, 'Molecule3DViewer must use safe WebGL renderer wrapper')
assert.match(viewer, /mulaiLoopTerjaga/, 'Molecule3DViewer must use guarded render loop')
assert.match(viewer, /space-filling/, 'Molecule3DViewer must support space-filling representation')
assert.match(viewer, /polarity-shell/, 'Molecule3DViewer must support Pauling electronegativity polarity-shell representation')
assert.match(stage, /not a measured patient flux/)
assert.match(stage, /must bind to verified chemical\/protein identifiers before they are rendered as source-backed 3D/)
console.log('PubChem 3D conformers (22 verified molecules + IUPAC molar mass + polarity-shell): PASS')
