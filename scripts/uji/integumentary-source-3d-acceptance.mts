import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { auditSurfaceSourceAcceptance } from '../../src/lib/anatomy/surfaceSourceAcceptance'
import { partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const audit = auditSurfaceSourceAcceptance()
assert.equal(audit.reachable, true, `skin/body-surface module must be shipped: ${audit.blockers.join(', ')}`)
assert.equal(audit.renderEligible, true, `integumentary source gate must pass: ${audit.blockers.join(', ')}`)
assert.deepEqual(audit.blockers, [], 'surface source acceptance must fail closed on every blocker')
assert.equal(audit.exactSource, true, 'skin/body-surface geometry must remain BodyParts3D-only')
assert.ok(audit.structures > 0, 'skin/body-surface module must expose shipped source geometry')
assert.ok(audit.triangles > 0, 'skin/body-surface source must carry positive indexed triangles')

const parts = partsForModule('kulit')
assert.ok(parts.length > 0, 'kulit module must expose generated source metadata')
assert.ok(parts.every((part) => part.source === 'bodyparts3d'), 'surface module must not silently mix source bodies')
assert.ok(parts.every((part) => part.triangles > 0), 'every surfaced source structure must carry geometry')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'specialty atlas must remain reachable from Body Exposure')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'specialty atlas tab must remain user-reachable')
assert.match(specialty, /Systemic.*\['imunologi', 'kulit'\]/, 'skin module must remain reachable from the Systemic specialty selector')
assert.match(specialty, /kulit: 'Skin is a single surface mesh/, 'UI must disclose the source-model skin depth limitation')
assert.match(specialty, /partsForModule\(modul\)/, 'render metadata must derive from generated source atlas')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'selected skin module must load its shipped GLB')
assert.match(specialty, /<AtlasViewer3D/, 'skin/body-surface anatomy must use interactive source-backed WebGL')
assert.match(specialty, /SUMBER\[asal\]/, 'source provenance must remain visible beside the rendered module')
assert.match(viewer, /body3dPixelRatio/, 'shared specialty renderer must bound mobile DPR')
assert.match(viewer, /IntersectionObserver/, 'shared specialty renderer must suspend offscreen rendering')
assert.match(viewer, /visibilitychange/, 'shared specialty renderer must suspend background rendering')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'picking must remain constrained to verified source metadata')

console.log(`Integumentary source/3D gate: ${audit.structures} exact surface structures, ${audit.triangles.toLocaleString()} indexed triangles, BodyParts3D-only identity, user-reachable shipped GLB WebGL, visible depth limitation, and mobile renderer lifecycle are locked.`)
