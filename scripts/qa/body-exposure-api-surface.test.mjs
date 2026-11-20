import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import ts from 'typescript'

const domain = new URL('../../src/domains/body-exposure/', import.meta.url)
const source = readFileSync(new URL('index.ts', domain), 'utf8')

// AST menghitung nama publik (termasuk alias/tipe), bukan kecocokan teks komentar.
function inspectSurface(text, readModule = () => '') {
  const ast = ts.createSourceFile('index.ts', text, ts.ScriptTarget.Latest, true)
  assert.equal(ast.parseDiagnostics.length, 0, 'invalid TypeScript surface')
  const names = new Set()
  const modules = new Set()
  for (const statement of ast.statements) {
    assert.ok(ts.isExportDeclaration(statement), 'barrel must contain only explicit re-exports')
    assert.ok(statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier), 'missing source module')
    assert.ok(statement.exportClause && ts.isNamedExports(statement.exportClause), 'wildcard exports are not curated')
    const module = statement.moduleSpecifier.text
    for (const specifier of statement.exportClause.elements) {
      const name = specifier.name.text
      assert.ok(!names.has(name), `duplicate public name: ${name}`)
      names.add(name)
    }
    assert.ok(!modules.has(module), `duplicate source block: ${module}`)
    modules.add(module)
    assert.doesNotMatch(readModule(module), /@internal\b/, `internal module exported: ${module}`)
  }
  return { names, modules }
}

const readModule = module => {
  const extension = module.startsWith('./ui/') ? '.tsx' : '.ts'
  return readFileSync(new URL(`${module}${extension}`, domain), 'utf8')
}

const required = [
  'BodyExposureAtlasHome', 'BoundsBvh', 'searchStructures', 'ATLAS_LAYERS',
  'ANATOMICAL_REGIONS', 'SelectedStructureInfo', 'atlasEnvelope', 'selubungAtlas',
  'organFactIndex', 'faktaMilikOrgan', 'firstSentence', 'kalimatPertama',
  'cardiacStateAt', 'validateCardiacParams', 'DEFAULT_CARDIAC_PARAMS',
  'parseRespiratoryModel', 'sampleRespiration', 'evaluateCardiopulmonaryCoupling',
  'correlateImagingPlane', 'ImagingPlane', 'AtlasBox', 'PlaneResult',
  'correlateImagingPlaneWithStructures', 'createDefaultKaloLumenState',
  'computeCanonicalRecordOverlays', 'resolveAnatomicalOverlayBinding',
  'reviewReadiness', 'recordApproves', 'evaluateStructureReviewWorkflow',
  'createPresentationLighting', 'applyBakedAoToLayer', 'mergeRigMeshes',
  'ANATOMICAL_VIEWS', 'viewPose', 'stepTween', 'frameStats', 'nextAutoPreset',
  'classifyPathologicalGaitCycle', 'evaluateGaitSymmetry', 'evaluateMultiscaleDrugAction',
]

// Union vascular dari main 9739773d: tidak menghapus kontrak walau belum ada pemakai.
const vascular = [
  'AHA17_CORONARY_TERRITORY_SOURCE', 'AHA17_CORONARY_TERRITORY_TABLE',
  'AHA17_LIMITATIONS', 'AHA17_RINGS', 'AHA17_SEGMENT_COUNT', 'AHA17_SEGMENT_NAMES',
  'AHA17_SOURCES', 'AHA17_TERRITORY_LIMITATIONS', 'ATLAS_REFERENCE_LABEL',
  'DOMINANCE_PREVALENCE', 'branchForSegment', 'evaluateAHA17PerfusionBurden',
  'mapCoronaryToAHA17', 'territoryForArtery', 'CoronaryArtery', 'CoronaryArteryId',
  'CoronaryBranch', 'CoronaryDominanceColumns', 'CoronaryDominanceInput',
  'CoronaryTerritoryTable', 'CoronaryTerritoryTableRow', 'Dominance', 'EvidenceKind',
  'KnownCoronaryDominance', 'MapCoronaryOptions', 'PerfusionBurdenInput',
  'PerfusionBurdenResult', 'SegmentEvidence', 'SegmentInfo', 'SegmentResult',
  'TerritoryResult', 'VascularFailureReason', 'VascularMapping',
  'VascularMappingFailure', 'VascularMappingSuccess', 'VascularTerritorySource',
  'VascularTruthClass',
]

// Pemakai lintas-domain nyata; studio ini belum boleh dijadikan internal.
const consumers = {
  OculomotorLesionLab: 'src/components/digital-twin/OcularMotility4D.tsx',
  AnatomicalLightingControls: 'src/pages/bodyhub/CanonicalBody.tsx',
  OpenCellPanel: 'src/pages/bodyhub/CanonicalBody.tsx',
  FetalGrowthPanel: 'src/pages/bodyhub/CanonicalBody.tsx',
  PerfusionChainPanel: 'src/pages/bodyhub/CanonicalBody.tsx',
  CoronaryTerritoryPanel: 'src/pages/bodyhub/CanonicalBody.tsx',
  KaloLumenVolumetricStudio: 'src/pages/bodyhub/PencitraanVolumetrikPanel.tsx',
  ReferredPainDermatomeStudio: 'src/pages/bodyhub/LokalisasiLesiPanel.tsx',
  OrganBiometricOverlayCard: 'src/pages/bodyhub/OrganClinicalPanel.tsx',
  CardiopulmonaryCouplingDeck: 'src/pages/bodyhub/WholeBodyPhysiologyWorkbench.tsx',
  SoftTissueBiomechanicsDeck: 'src/pages/bodyhub/WholeBodyPhysiologyWorkbench.tsx',
  NeuroFascicularReflexDeck: 'src/pages/bodyhub/WholeBodyPhysiologyWorkbench.tsx',
  BodyExposureAtlasHome: 'src/main.tsx',
}

test('public API preserves anatomy, physiology, imaging, review and vascular contracts', () => {
  const { names } = inspectSurface(source, readModule)
  for (const name of [...required, ...vascular, ...Object.keys(consumers)]) {
    assert.ok(names.has(name), `missing public contract: ${name}`)
  }
})

test('each exported UI has a real cross-domain consumer', () => {
  const ast = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true)
  for (const statement of ast.statements) {
    if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier.text.startsWith('./ui/')) continue
    for (const specifier of statement.exportClause.elements) {
      if (specifier.isTypeOnly || statement.isTypeOnly) continue
      const name = specifier.name.text
      assert.ok(consumers[name], `UI requires curation evidence: ${name}`)
      const path = new URL(`../../${consumers[name]}`, import.meta.url)
      assert.match(readFileSync(path, 'utf8'), new RegExp(`\\b${name}\\b`), fileURLToPath(path))
    }
  }
})

test('public API groups the supported families for review', () => {
  const groups = ['MODEL', 'ENGINE: GROSS ANATOMY', 'ENGINE: IMAGING',
    'ENGINE: PHYSIOLOGY', 'ENGINE: CLINICAL CORRELATION',
    'ENGINE: BIOMECHANICS & GAIT', 'ADAPTERS', 'UI (cross-domain only)']
  for (const group of groups) assert.ok(source.includes(`// ── ${group} ──`), `missing group: ${group}`)
})

test('surface parser accepts aliases and separate source/public names', () => {
  const { names } = inspectSurface("export { a as b, type A as B } from './a'; export { a as c } from './c'")
  assert.deepEqual([...names], ['b', 'B', 'c'])
})

test('negative control rejects duplicate public names, including aliased types', () => {
  assert.throws(() => inspectSurface("export { a, a } from './a'"), /duplicate public name: a/)
  assert.throws(() => inspectSurface("export { a as Same } from './a'; export type { B as Same } from './b'"), /duplicate public name: Same/)
})

test('negative control rejects a second source block even with distinct exports', () => {
  assert.throws(() => inspectSurface("export { a } from './vascular'; export { b } from './vascular'"), /duplicate source block/)
})

test('negative control rejects internal modules and wildcard exports', () => {
  assert.throws(() => inspectSurface("export { Studio } from './ui/Studio'", () => '// @internal\nexport function Studio() {}'), /internal module exported/)
  assert.throws(() => inspectSurface("export * from './engine'"), /wildcard exports are not curated/)
})
