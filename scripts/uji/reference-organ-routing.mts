import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { REFERENCE_ATLAS_MODELS, REGIONAL_REFERENCE_ATLAS_MODELS } from '../../src/lib/referenceOrganModels'
import { ATLAS_MODULE_INFO } from '../../src/lib/systemAtlas.gen'

const organModelsSrc = readFileSync(new URL('../../src/lib/organModels.ts', import.meta.url), 'utf8')
const viewerSrc = readFileSync(new URL('../../src/components/OrganModel3D.tsx', import.meta.url), 'utf8')

const expected = [
  { focusKey: 'lungs', module: 'paru', asset: 'atlas/paru.glb', source: 'z-anatomy', structures: 13 },
  { focusKey: 'thyroid', module: 'tiroid', asset: 'atlas/tiroid.glb', source: 'z-anatomy', structures: 10 },
  { focusKey: 'ear', module: 'telinga', asset: 'atlas/telinga.glb', source: 'z-anatomy', structures: 21 },
  { focusKey: 'spinal-cord', module: 'medula-spinalis', asset: 'atlas/medula-spinalis.glb', source: 'hra', structures: 29 },
  { focusKey: 'breast', module: 'payudara', asset: 'atlas/payudara.glb', source: 'hra', structures: 16 },
] as const

for (const item of expected) {
  const model = REFERENCE_ATLAS_MODELS.find((m) => m.focusKey === item.focusKey)
  assert.ok(model, `${item.focusKey} must have a reference atlas close-up`)
  assert.equal(model.assetPath, item.asset, `${item.focusKey} must reuse the existing atlas binary`)
  assert.equal(model.sumber, item.source, `${item.focusKey} provenance must identify its reference source`)
  assert.equal(model.jumlahBagian, item.structures, `${item.focusKey} semantic count must match the generated atlas`)
  assert.equal(ATLAS_MODULE_INFO[item.module]?.structures, item.structures, `${item.module} generator metadata must agree with organ routing`)

  const publicAsset = new URL(`../../public/${item.asset}`, import.meta.url)
  assert.ok(existsSync(publicAsset), `${item.asset} must exist; routing must never point at an imaginary model`)
  assert.ok(statSync(publicAsset).size > 1024, `${item.asset} must be a non-empty reference GLB`)
}

for (const focusKey of ['ossicles', 'eardrum', 'inner-ear-nerve']) {
  const model = REFERENCE_ATLAS_MODELS.find((m) => m.focusKey === focusKey)
  assert.ok(model, `${focusKey} must reuse the verified ear atlas rather than inventing a separate mesh`)
  assert.equal(model.assetPath, 'atlas/telinga.glb')
  assert.equal(model.sumber, 'z-anatomy')
  assert.equal(model.jumlahBagian, 21)
}
assert.equal(
  REFERENCE_ATLAS_MODELS.some((m) => m.focusKey === 'external-ear'),
  false,
  'the middle/inner-ear atlas must not be mislabeled as verified external-ear anatomy',
)

const regionalExpected = [
  { focusKey: 'heart', module: 'jantung-ruang', asset: 'atlas/jantung-ruang.glb', structures: 14 },
  { focusKey: 'liver', module: 'bilier', asset: 'atlas/bilier.glb', structures: 40 },
  { focusKey: 'pancreas', module: 'bilier', asset: 'atlas/bilier.glb', structures: 40 },
  { focusKey: 'gallbladder', module: 'bilier', asset: 'atlas/bilier.glb', structures: 40 },
  { focusKey: 'prostate', module: 'prostat', asset: 'atlas/prostat.glb', structures: 26 },
  { focusKey: 'bladder', module: 'prostat', asset: 'atlas/prostat.glb', structures: 26 },
] as const

for (const item of regionalExpected) {
  const model = REGIONAL_REFERENCE_ATLAS_MODELS.find((m) => m.focusKey === item.focusKey)
  assert.ok(model, `${item.focusKey} must expose a regional reference relationship view`)
  assert.equal(model.assetPath, item.asset, `${item.focusKey} regional view must reuse the shipped atlas binary`)
  assert.equal(model.sumber, 'hra', `${item.focusKey} regional relationship provenance must be HRA`)
  assert.equal(model.jumlahBagian, item.structures, `${item.focusKey} regional semantic count must match the generated atlas`)
  assert.equal(ATLAS_MODULE_INFO[item.module]?.structures, item.structures, `${item.module} generator metadata must agree with regional routing`)
}

assert.match(
  organModelsSrc,
  /import \{ REFERENCE_ATLAS_MODELS, REGIONAL_REFERENCE_ATLAS_MODELS \} from '\.\/referenceOrganModels'/,
  'organ resolver must import primary and regional multi-source reference atlas mappings',
)
assert.match(
  organModelsSrc,
  /ORGAN_ATLAS\.find[\s\S]*REFERENCE_ATLAS_MODELS\.find[\s\S]*ORGAN_MODELS\.find/,
  'reference geometry must win over legacy AI close-ups while preserving BodyParts3D organ-specific priority',
)
assert.match(
  organModelsSrc,
  /regionalModelForFocus[\s\S]*REGIONAL_REFERENCE_ATLAS_MODELS\.find/,
  'regional reference anatomy must be addressable without replacing the primary close-up',
)
assert.match(viewerSrc, /modelAssetPath\(organ\)/, 'viewer must load explicit atlas asset paths instead of duplicating binaries')
assert.doesNotMatch(
  viewerSrc,
  /\$\{folderModel\(organ\)\}\/\$\{organ\.id\}\.glb/,
  'viewer must not force every reference source through the legacy organs-atlas filename convention',
)
assert.match(viewerSrc, /organ\.sumber && organ\.sumber !== 'ai'/, 'all non-AI routed atlases must retain exact named-mesh interaction')

console.log('Reference organ routing: primary reference atlases and optional HRA regional relationship views reuse shipped GLBs with explicit provenance; AI remains fallback only.')
