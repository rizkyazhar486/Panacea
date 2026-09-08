import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync('src/pages/BrainExplorer.tsx', 'utf8')
const viewer = readFileSync('src/components/AtlasViewer3D.tsx', 'utf8')
const router = readFileSync('src/main.tsx', 'utf8')
const body = readFileSync('src/pages/BodyExplorer.tsx', 'utf8')

assert.match(page, /partsForModule\('neurologi'\)/, 'Brain Explorer must derive structures from the generated neurology source registry.')
assert.match(page, /berkas="atlas\/neurologi\.glb"/, 'Brain Explorer must use the existing licensed neurology GLB.')
assert.match(page, /BodyParts3D 4\.0/, 'Brain Explorer must display geometry provenance.')
assert.match(page, /CC BY 4\.0/, 'Brain Explorer must display the atlas license boundary.')
assert.match(page, /not an MRI\/CT of a patient/, 'Brain Explorer must distinguish educational geometry from patient imaging.')
assert.match(page, /Brain ≠ mind/, 'Brain Explorer must explicitly separate neuroanatomy from mental-health diagnosis.')
assert.match(page, /to="\/jiwa"/, 'Brain Explorer must provide a human mental-health pathway.')
assert.match(page, /classifyBrainRegion/, 'Brain regions must be classified from source mesh metadata instead of hard-coded fake objects.')
assert.match(page, /REGION_COUNTS\.get/, 'Region controls must expose only source-backed groups and counts.')
assert.match(page, /data-brain-structure=/, 'Exact named source meshes must be selectable.')
assert.doesNotMatch(page, /new THREE\.(?:SphereGeometry|CapsuleGeometry|BoxGeometry|LatheGeometry)/, 'Brain Explorer must not manufacture primitive stand-in anatomy.')
assert.equal((page.match(/<AtlasViewer3D/g) ?? []).length, 1, 'Brain Explorer must own exactly one 3D canvas.')

assert.match(viewer, /\$\{D \?\? ''\}/, 'AtlasViewer framing cache must include the exact selected structure.')
assert.match(viewer, /if \(D\) bingkaiKe\(/, 'Exact selection must drive camera framing to the selected verified mesh.')

assert.match(router, /const BrainExplorer = lazy\(/, 'Brain Explorer route must stay lazy-loaded.')
assert.match(router, /path="\/brain-explorer" element=\{<BrainExplorer \/>\}/, 'Brain Explorer must be reachable through the main router.')
assert.match(body, /to="\/brain-explorer"/, 'Whole Body Explorer must expose a lightweight link to the dedicated brain workspace.')

console.log('3D Brain Explorer source, routing, camera-focus, provenance and mental-health boundaries verified.')
