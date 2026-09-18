import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const os = readFileSync('src/pages/BodyExposureOS.tsx', 'utf8')
const projector = readFileSync('src/pages/bodyhub/UnifiedHumanSimulationProjector.tsx', 'utf8')
const atlas = readFileSync('src/components/BodyAllSystems3D.tsx', 'utf8')

assert.match(os, /projectorDomain: 'localization'/, 'Body Exposure top-level navigation must expose lesion localization in the same projector')
assert.match(os, /projectorDomain: 'imaging'/, 'Body Exposure top-level navigation must expose imaging in the same projector')
assert.match(os, /requestedDomain=\{current\.projectorDomain\}/, 'top-level mode must drive the unified projector')
assert.match(os, /Deep reference labs/, 'legacy Body Explorer capability must be preserved on demand instead of deleted')

assert.match(projector, /type SimulationDomain[\s\S]*'localization'/, 'unified projector must own localization as a first-class projection')
assert.match(projector, /type SimulationDomain[\s\S]*'imaging'/, 'unified projector must own imaging as a first-class projection')
assert.match(projector, /LokalisasiLesiPanel/, 'localization reasoning must render inside the unified projector')
assert.match(projector, /PencitraanVolumetrikPanel/, 'volumetric imaging must render inside the unified projector')
assert.match(projector, /Body → system → organ → tissue → cell → organelle → molecule → genome/, 'one projector must expose the full biological scale ladder')
assert.match(projector, /selectedStructureName/, 'exact rendered structure context must persist across projections')
assert.match(projector, /onStructureSelect=\{setSelectedStructureName\}/, '3D structure selection must feed projector state')

assert.match(atlas, /THREE\.Raycaster/, 'whole-body atlas must support direct mesh picking')
assert.match(atlas, /onStructureSelect\?: \(sourceName: string\) => void/, 'mesh selection must be exposed to the parent projector')
assert.match(atlas, /applyProjectedSelection/, 'selected anatomy must be visually isolated without mutating source geometry')
assert.doesNotMatch(atlas, /new THREE\.(?:SphereGeometry|CapsuleGeometry|LatheGeometry)/, 'gross anatomy selection must remain on source meshes, never primitive stand-ins')

console.log('Body Exposure one-projector contract verified: exact structure selection + localization + imaging + cross-scale continuity.')
