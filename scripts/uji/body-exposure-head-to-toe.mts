import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { HEAD_TO_TOE_REGIONS, HEAD_TO_TOE_STRUCTURES, findHeadToToeRegionForStructure } from '../../src/lib/headToToeAnatomy.ts'

// Keep the structured head-to-toe catalogue available even though the active
// Body Exposure UI has been restored to Claude Code's original shared-body
// workspace. The catalogue remains useful data; it must not dictate a later UI
// architecture that replaced Claude's implementation.
assert.ok(HEAD_TO_TOE_REGIONS.length >= 10, 'Body Exposure should retain at least ten ordered anatomical regions')
assert.equal(HEAD_TO_TOE_REGIONS[0]?.id, 'head-brain', 'coverage must begin at the head')
assert.equal(HEAD_TO_TOE_REGIONS.at(-1)?.id, 'ankle-foot', 'coverage must end at the foot')
assert.deepEqual(HEAD_TO_TOE_REGIONS.map((region) => region.order), [...HEAD_TO_TOE_REGIONS].map((region) => region.order).sort((a, b) => a - b), 'regions must stay in anatomical head-to-toe order')
assert.ok(HEAD_TO_TOE_STRUCTURES.length >= 140, `expected >=140 named structures, got ${HEAD_TO_TOE_STRUCTURES.length}`)
assert.equal(new Set(HEAD_TO_TOE_STRUCTURES.map((item) => item.id)).size, HEAD_TO_TOE_STRUCTURES.length, 'structure ids must be unique')
assert.ok(HEAD_TO_TOE_REGIONS.every((region) => region.structures.length >= 10), 'every head-to-toe region needs substantial named coverage')
assert.ok(HEAD_TO_TOE_STRUCTURES.every((item) => item.terms.length >= 1 && item.landmark.length >= 20), 'every structure needs resolver terms and a useful anatomical landmark')

for (const id of ['retina', 'optic-nerve', 'larynx', 'carotids', 'mitral', 'left-ventricle', 'right-lung', 'liver', 'pancreas', 'right-kidney', 'bladder', 'hip-joint', 'sciatic-nerve', 'acl', 'tibial-nerve', 'ankle-joint', 'achilles', 'plantar-fascia']) {
  const region = findHeadToToeRegionForStructure(id)
  assert.ok(region, `${id} must be represented in head-to-toe coverage`)
}

// Regression lock for the Claude Code Body Exposure that is intentionally the
// active /body-explorer implementation. Do not make this test require the later
// HRA/digital-twin replacement: that would silently force the restored UI away
// from the version the product owner asked to preserve.
const bodyPage = readFileSync('src/pages/BodyExplorer.tsx', 'utf8')
assert.match(bodyPage, /from '\.\.\/components\/Body3D'/, 'active Body Exposure must use the original shared Body3D viewer')
assert.match(bodyPage, /const PhysiologySection = lazy/)
assert.match(bodyPage, /const CardioLab = lazy/)
assert.match(bodyPage, /const SpecialtyLab = lazy/)
assert.match(bodyPage, /const MolecularLab = lazy/)
assert.match(bodyPage, /const GenomicsLab = lazy/)
assert.match(bodyPage, /const CellLab = lazy/)
assert.match(bodyPage, /const SurgicalLab = lazy/)
assert.match(bodyPage, /const StructureFinder = lazy/)
assert.match(bodyPage, /const WholeBodyPrecisionLab = lazy/)
assert.match(bodyPage, /const BiomedicalEngineLab = lazy/)
assert.match(bodyPage, /Cell & metabolism/)
assert.match(bodyPage, /Surgical layers/)
assert.match(bodyPage, /Whole-body precision/)
assert.match(bodyPage, /Biomedical engine/)
assert.match(bodyPage, /Find structure/)
assert.match(bodyPage, /Diseases/)
assert.match(bodyPage, /Study/)
assert.match(bodyPage, /satu simulasi tubuh yang utuh/, 'Claude shared-body design contract should remain documented in the active page')

const body3d = readFileSync('src/components/Body3D.tsx', 'utf8')
const physiologyWaveData = readFileSync('src/lib/motionWave.ts', 'utf8')
assert.match(body3d, /GLTFLoader/)
assert.match(body3d, /MeshoptDecoder/)
assert.match(body3d, /RoomEnvironment/)
assert.match(physiologyWaveData, /SEBAR_PERISTALTIK/, 'physiology teaching data may remain available as a tested model')
assert.doesNotMatch(body3d, /SEBAR_PERISTALTIK/, 'source anatomy renderer must not deform bowel meshes to simulate peristalsis')
assert.doesNotMatch(body3d, /gelombang(?:Jantung|Napas|Peristaltik|Nadi)/, 'source anatomy renderer must not resize real atlas geometry to imply physiology')
assert.ok(body3d.includes('Source anatomy is') && body3d.includes('evidence-bearing geometry'), 'renderer must document the non-deforming source-anatomy boundary')
assert.match(body3d, /keburaman/)
assert.match(body3d, /geserBuka/)
assert.match(body3d, /Unit Hounsfield|Hounsfield/i, 'Claude renderer must retain physically grounded CT windowing')
assert.match(body3d, /type SlicePlane = 'none' \| 'axial' \| 'coronal' \| 'sagittal'/)
assert.match(body3d, /try \{\s*renderer = new THREE\.WebGLRenderer/, 'WebGL creation must remain crash-safe')
assert.match(body3d, /This device could not start 3D graphics \(WebGL\)/, 'unsupported or memory-constrained devices need a readable fallback')
assert.match(body3d, /webglcontextlost/, 'lost GPU contexts must be handled instead of leaving a black viewer')
assert.match(body3d, /webglcontextrestored/, 'restored GPU contexts must restart the local viewer without reloading the whole app')
assert.match(body3d, /ResizeObserver/, 'viewer must resize safely across phone, tablet and desktop layouts')
assert.match(body3d, /body3dPixelRatio\(/, 'viewer must use the deterministic adaptive pixel budget')
assert.match(body3d, /window\.matchMedia\('\(max-width: 640px\)'\)\.matches/, 'mobile quality must remain more conservative than desktop for GPU stability')
assert.match(body3d, /IntersectionObserver/, 'off-screen anatomy rendering must suspend instead of burning mobile GPU')
assert.match(body3d, /visibilitychange/, 'hidden-tab rendering must suspend')
assert.match(body3d, /Body3dLayerLoadGeneration/, 'stale GLB loads must not reattach layers after a toggle changes')
assert.match(body3d, /controls\.addEventListener\('change', requestRender\)/, 'static anatomy should render on demand while preserving orbit controls')
assert.doesNotMatch(body3d, /new THREE\.(?:SphereGeometry|CapsuleGeometry|LatheGeometry)/, 'macro anatomy must stay on the real GLB meshes, never primitive stand-ins')

console.log(`Body Exposure: Claude shared-body workspace preserved; ${HEAD_TO_TOE_REGIONS.length} ordered regions and ${HEAD_TO_TOE_STRUCTURES.length} named catalogue structures retained with a non-deforming demand-render boundary`)
