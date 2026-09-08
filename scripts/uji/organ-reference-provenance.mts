import assert from 'node:assert/strict'
import { existsSync, statSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const reference = readFileSync(new URL('../../src/lib/referenceOrganModels.ts', import.meta.url), 'utf8')
const models = readFileSync(new URL('../../src/lib/organModels.ts', import.meta.url), 'utf8')
const dossier = readFileSync(new URL('../../src/pages/bodyhub/OrganDossier.tsx', import.meta.url), 'utf8')
const systemAtlas = readFileSync(new URL('../../src/lib/systemAtlas.gen.ts', import.meta.url), 'utf8')

const assets = [
  'public/atlas/paru.glb',
  'public/atlas/tiroid.glb',
  'public/atlas/telinga.glb',
  'public/atlas/medula-spinalis.glb',
  'public/atlas/payudara.glb',
  'public/atlas/jantung-ruang.glb',
  'public/atlas/bilier.glb',
  'public/atlas/prostat.glb',
]
for (const rel of assets) {
  const path = root + rel
  assert.equal(existsSync(path), true, `reference asset must exist: ${rel}`)
  assert.ok(statSync(path).size > 1_000, `reference asset must not be an empty placeholder: ${rel}`)
}

assert.match(reference, /HuBMAP Human Reference Atlas · female reference object/, 'female HRA reference objects must be identified as female')
assert.match(reference, /HuBMAP Human Reference Atlas · male reference object/, 'male HRA reference objects must be identified as male')
assert.match(reference, /'atlas\/paru\.glb',[\s\S]*?13,/, 'lungs must use the 13-structure Z-Anatomy reference atlas')
assert.match(reference, /'atlas\/tiroid\.glb',[\s\S]*?10,/, 'thyroid must use the 10-structure Z-Anatomy reference atlas')
assert.match(reference, /'atlas\/telinga\.glb'/, 'ear routes must reuse the shipped ear atlas')
assert.match(reference, /'atlas\/medula-spinalis\.glb',[\s\S]*?29,/, 'spinal cord must use the 29-structure HRA atlas')
assert.match(reference, /'atlas\/payudara\.glb',[\s\S]*?16,/, 'breast must use the 16-structure HRA atlas')
assert.match(reference, /heart-regional-reference[\s\S]*?'atlas\/jantung-ruang\.glb'[\s\S]*?14,/, 'heart regional mode must expose chambers/valves without replacing the primary organ cut')
assert.match(reference, /pancreas-biliary-regional-reference[\s\S]*?'atlas\/bilier\.glb'[\s\S]*?40,/, 'pancreas must expose the 40-structure biliary-pancreatic regional atlas')
assert.match(reference, /prostate-pelvis-regional-reference[\s\S]*?'atlas\/prostat\.glb'[\s\S]*?26,[\s\S]*?'male'/, 'prostate regional mode must identify the male HRA reference object')

assert.match(models, /REGIONAL_REFERENCE_ATLAS_MODELS/, 'organ model resolver must know about regional reference anatomy')
assert.match(models, /regionalModelForFocus/, 'regional reference anatomy must be addressable by organ focus')
assert.match(dossier, /Regional relationships/, 'organ dossier must expose an explicit regional relationship control')
assert.match(dossier, /model\.sumber === 'z-anatomy' \|\| model\.sumber === 'hra'/, 'Z-Anatomy and HRA must have a truthful reference-provenance branch')
assert.match(dossier, /This is a reference atlas, not patient-specific imaging\./, 'reference anatomy must not masquerade as patient-specific imaging')
assert.match(dossier, /Shape approximation — an AI-generated model \(Tripo\)/, 'legacy AI fallback must remain explicitly labeled as approximation')

// Structural ordering is more precise than a greedy negative regex: the UI must
// branch BodyParts3D -> Z-Anatomy/HRA -> AI fallback in that order. This proves
// reference sources are not collapsed into the final AI approximation branch.
const bodypartsBranch = dossier.indexOf("model.sumber === 'bodyparts3d'")
const referenceBranch = dossier.indexOf("model.sumber === 'z-anatomy' || model.sumber === 'hra'")
const aiFallbackCopy = dossier.indexOf('Shape approximation — an AI-generated model (Tripo)')
assert.ok(bodypartsBranch >= 0, 'BodyParts3D provenance branch must exist')
assert.ok(referenceBranch > bodypartsBranch, 'Z-Anatomy/HRA provenance branch must follow BodyParts3D and remain distinct')
assert.ok(aiFallbackCopy > referenceBranch, 'AI approximation copy must be the final fallback after all reference-source branches')

// Generated metadata is the independent count source used by the atlas build.
assert.match(systemAtlas, /"paru"\s*:\s*\{[\s\S]*?"structures"\s*:\s*13/, 'generated atlas metadata must agree on lung structure count')
assert.match(systemAtlas, /"tiroid"\s*:\s*\{[\s\S]*?"structures"\s*:\s*10/, 'generated atlas metadata must agree on thyroid structure count')
assert.match(systemAtlas, /"telinga"\s*:\s*\{[\s\S]*?"structures"\s*:\s*21/, 'generated atlas metadata must agree on ear structure count')
assert.match(systemAtlas, /"medula-spinalis"\s*:\s*\{[\s\S]*?"structures"\s*:\s*29/, 'generated atlas metadata must agree on spinal cord structure count')
assert.match(systemAtlas, /"payudara"\s*:\s*\{[\s\S]*?"structures"\s*:\s*16/, 'generated atlas metadata must agree on breast structure count')
assert.match(systemAtlas, /"jantung-ruang"\s*:\s*\{[\s\S]*?"structures"\s*:\s*14/, 'generated atlas metadata must agree on heart regional structure count')
assert.match(systemAtlas, /"bilier"\s*:\s*\{[\s\S]*?"structures"\s*:\s*40/, 'generated atlas metadata must agree on biliary regional structure count')
assert.match(systemAtlas, /"prostat"\s*:\s*\{[\s\S]*?"structures"\s*:\s*26/, 'generated atlas metadata must agree on prostate/bladder regional structure count')

console.log('Reference organ provenance, shipped assets, regional anatomy routes, and non-patient-specific boundaries are locked.')
