import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { auditSensoryEntTarget, SENSORY_ENT_TARGETS } from '../../src/lib/anatomy/sensoryEntSpecialtyAudit'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const panel = await readFile(new URL('../../src/pages/bodyhub/InderaPanel.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const earTarget = SENSORY_ENT_TARGETS.find((target) => target.module === 'telinga')
assert.ok(earTarget, 'middle-inner-ear sensory target must be registered')
const audit = auditSensoryEntTarget(earTarget)
assert.equal(audit.reachable, true, `telinga atlas module must be shipped: ${audit.blockers.join(', ')}`)
assert.equal(audit.sourceBacked, true, `ear geometry must satisfy source acceptance: ${audit.blockers.join(', ')}`)
assert.deepEqual(audit.blockers, [], 'ear source acceptance must fail closed on every blocker')
assert.ok(audit.resolvedExactNames.includes('Left cochlea'))
assert.ok(audit.resolvedExactNames.includes('Right cochlea'))
assert.ok(audit.resolvedExactNames.includes('Left tympanic membrane'))
assert.ok(audit.resolvedExactNames.includes('Right tympanic membrane'))
assert.ok(audit.resolvedExactNames.includes('Left malleus'))
assert.ok(audit.resolvedExactNames.includes('Right stapes'))

const info = ATLAS_MODULE_INFO.telinga
assert.ok(info, 'telinga module info must exist')
const parts = partsForModule('telinga')
assert.ok(parts.length > 0, 'telinga module must expose exact generated parts')
assert.ok(parts.every((part) => part.triangles > 0), 'every selected ear source part must carry indexed geometry')
assert.ok(parts.some((part) => part.source === 'z-anatomy'), 'ear module must retain Z-Anatomy source identity')

assert.match(panel, /<AtlasViewer3D/, 'sensory panel must make the shipped WebGL ear viewer user-reachable')
assert.match(panel, /berkas="atlas\/telinga\.glb"/, 'sensory panel must load the shipped ear GLB')
assert.match(panel, /partsForModule\('telinga'\)/, 'viewer labels must derive from generated source metadata')
assert.match(panel, /data-sensory-ent-source-3d="telinga"/, 'reachable 3D surface must have a deterministic acceptance marker')
assert.match(panel, /Missing anatomy is not synthesized, mirrored or inferred/, 'missing-geometry disclosure must remain explicit')
assert.match(panel, /min-h-11/, 'selected-structure mobile surface must retain a 44px-class minimum height')

assert.match(viewer, /body3dPixelRatio/, 'shared atlas renderer must bound mobile DPR')
assert.match(viewer, /IntersectionObserver/, 'shared atlas renderer must pause offscreen rendering')
assert.match(viewer, /visibilitychange/, 'shared atlas renderer must pause in background tabs')
assert.match(viewer, /MeshoptDecoder/, 'shared atlas renderer must support the shipped compressed GLB')

console.log(`Sensory/ENT 3D gate: ${parts.length} generated ear structures, ${audit.triangles.toLocaleString()} indexed triangles, exact named cochlea/ossicles/tympanic membranes, shipped GLB reachability, and mobile renderer lifecycle are locked.`)
