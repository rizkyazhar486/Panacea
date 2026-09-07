import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { HEAD_TO_TOE_REGIONS, HEAD_TO_TOE_STRUCTURES, findHeadToToeRegionForStructure } from '../../src/lib/headToToeAnatomy.ts'

assert.ok(HEAD_TO_TOE_REGIONS.length >= 10, 'Body Exposure should cover at least ten ordered anatomical regions')
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

const bodyPage = readFileSync('src/pages/BodyExplorer.tsx', 'utf8')
assert.match(bodyPage, /HeadToToeAnatomyWorkbench/)
assert.match(bodyPage, /BodyParts3DDeepAtlas/)
assert.match(bodyPage, /HumanAnatomyLayerNavigator/)
assert.match(bodyPage, /OcularAnatomyAtlas/, 'Eye anatomy should use the current anatomy-first ocular atlas')
assert.match(bodyPage, /HumanAnatomyMasterAtlas/)
assert.match(bodyPage, /HraClinicalAtlas/)
assert.match(bodyPage, /function AnatomyMode/)
assert.match(bodyPage, /useState<AnatomyTool>\('head-to-toe'\)/, 'head-to-toe must be the default anatomy workspace')
assert.match(bodyPage, /tool === 'head-to-toe' \? \(/)
assert.match(bodyPage, /tool === 'systems' \? \(/)
assert.match(bodyPage, /tool === 'layers' \? \(/)
assert.match(bodyPage, /tool === 'deep' \? \(/)
assert.match(bodyPage, /tool === 'hra' \? \(/)
assert.match(bodyPage, /One anatomical workspace at a time/)
assert.match(bodyPage, /open && <div/, 'optional non-primary panels should unmount when closed')

const workbench = readFileSync('src/components/digital-twin/HeadToToeAnatomyWorkbench.tsx', 'utf8')
assert.match(workbench, /HraResolvedAnatomyViewer/)
assert.match(workbench, /HraContextBridge/)
assert.match(workbench, /onOpenPhysiology/)
assert.match(workbench, /Later · physiology bridge/, 'physiology should remain an explicit secondary bridge from anatomy')
assert.match(workbench, /Open physiology for this anatomy/, 'the bridge should stay actionable without making physiology the primary workspace')

const navigator = readFileSync('src/components/digital-twin/HeadToToeAnatomyNavigator.tsx', 'utf8')
assert.match(navigator, /Head-to-toe anatomy/)
assert.match(navigator, /Region first, then exact named structure/)
assert.match(navigator, /Search head-to-toe anatomy/)
assert.match(navigator, /detail targets/)
assert.match(navigator, /Head/)
assert.match(navigator, /Toe/)

const viewer = readFileSync('src/components/digital-twin/HraResolvedAnatomyViewer.tsx', 'utf8')
assert.match(viewer, /try \{\s*renderer = new THREE\.WebGLRenderer/)
assert.match(viewer, /3D renderer unavailable/)
assert.match(viewer, /mobile \? 1\.15 : 1\.65/, 'HRA viewer should keep the lower mobile/desktop DPR caps used by the crash-safety pass')
assert.match(viewer, /ResizeObserver/)

const deepAtlas = readFileSync('src/components/digital-twin/BodyParts3DDeepAtlas.tsx', 'utf8')
assert.match(deepAtlas, /if \(!activated\)/, 'deep BodyParts3D must stay explicitly on demand')
assert.match(deepAtlas, /Load deep anatomy/)
assert.match(deepAtlas, /Educational reference · not patient anatomy/)
assert.match(deepAtlas, /window\.innerWidth < 768 \? 1\.25 : 1\.75/, 'deep atlas should cap mobile pixel ratio')

console.log(`Body Exposure: ${HEAD_TO_TOE_REGIONS.length} ordered regions, ${HEAD_TO_TOE_STRUCTURES.length} named structures; exclusive-viewer safeguards passed`)
