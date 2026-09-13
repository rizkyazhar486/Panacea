import assert from 'node:assert/strict'
import {
  UNVERIFIED_STRUCTURE_POLICY,
  VERIFIED_PROTEIN_STRUCTURE_BOUNDARY,
  VERIFIED_PROTEIN_STRUCTURES,
  canonicalMmcifUrl,
  experimentalCoordinatesAllowed,
  normalizedPdbId,
  verifiedStructureByPdbId,
} from '../../src/lib/verifiedProteinStructureRegistry.ts'

assert.deepEqual(VERIFIED_PROTEIN_STRUCTURES.map((record) => record.pdbId), ['1YCR', '6CM4', '9RB7', '6VNO'])
assert.equal(new Set(VERIFIED_PROTEIN_STRUCTURES.map((record) => record.pdbId)).size, VERIFIED_PROTEIN_STRUCTURES.length)

for (const record of VERIFIED_PROTEIN_STRUCTURES) {
  assert.match(record.pdbId, /^[0-9][A-Z0-9]{3}$/)
  assert.equal(record.organism, 'Homo sapiens')
  assert.equal(record.evidenceState, 'experimental-atomic-coordinates')
  assert.equal(record.coordinateUse, 'allowed-with-provenance')
  assert.equal(record.clinicalInferenceAllowed, false)
  assert.equal(record.molecularDynamicsClaimAllowed, false)
  assert.ok(record.rcsbUrl.endsWith(`/structure/${record.pdbId}`))
  assert.ok(record.pdbDoi.endsWith(`pdb${record.pdbId}/pdb`))
  assert.ok(record.resolutionAngstrom === null || record.resolutionAngstrom > 0)
  assert.equal(experimentalCoordinatesAllowed(record.pdbId), true)
  assert.equal(canonicalMmcifUrl(record.pdbId), `https://files.rcsb.org/download/${record.pdbId}.cif`)
}

const mdm2 = verifiedStructureByPdbId('1ycr')
assert.ok(mdm2)
assert.deepEqual(mdm2.genes, ['MDM2', 'TP53'])
assert.equal(mdm2.method, 'X-RAY DIFFRACTION')
assert.equal(mdm2.resolutionAngstrom, 2.6)

const drd2 = verifiedStructureByPdbId(' 6cm4 ')
assert.ok(drd2)
assert.deepEqual(drd2.genes, ['DRD2'])
assert.deepEqual(drd2.ligands, ['risperidone'])
assert.equal(drd2.method, 'X-RAY DIFFRACTION')
assert.equal(drd2.resolutionAngstrom, 2.87)

const snca = verifiedStructureByPdbId('9RB7')
assert.ok(snca)
assert.deepEqual(snca.genes, ['SNCA'])
assert.equal(snca.method, 'ELECTRON MICROSCOPY')
assert.equal(snca.resolutionAngstrom, 3.45)
assert.match(snca.caveat, /fibril polymorph/i)
assert.match(snca.caveat, /not be presented as the soluble monomer/i)

const lrrk2 = verifiedStructureByPdbId('6vno')
assert.ok(lrrk2)
assert.deepEqual(lrrk2.genes, ['LRRK2'])
assert.equal(lrrk2.method, 'ELECTRON MICROSCOPY')
assert.equal(lrrk2.resolutionAngstrom, 3.5)
assert.match(lrrk2.caveat, /C-terminal LRRK2 construct/i)
assert.match(lrrk2.caveat, /not a complete full-length state atlas/i)

assert.equal(normalizedPdbId('6cm4'), '6CM4')
assert.equal(normalizedPdbId('bad'), null)
assert.equal(normalizedPdbId('ABCDE'), null)
assert.equal(verifiedStructureByPdbId('7XYZ'), null)
assert.equal(canonicalMmcifUrl('7XYZ'), null)
assert.equal(experimentalCoordinatesAllowed('7XYZ'), false)

assert.deepEqual(UNVERIFIED_STRUCTURE_POLICY, {
  allowSyntheticAtoms: false,
  allowInventedPdbIds: false,
  allowPredictedAsExperimental: false,
  allowUnverifiedCoordinateDownload: false,
  allowPatientInference: false,
  action: 'remain-blocked-until-verified',
})
assert.match(VERIFIED_PROTEIN_STRUCTURE_BOUNDARY, /not a complete representation/i)
assert.match(VERIFIED_PROTEIN_STRUCTURE_BOUNDARY, /patient state/i)
assert.match(VERIFIED_PROTEIN_STRUCTURE_BOUNDARY, /molecular-dynamics trajectory/i)

console.log('verified protein structure registry: 1YCR, 6CM4, 9RB7 and 6VNO remain experimental-coordinate-only and fail-closed')
