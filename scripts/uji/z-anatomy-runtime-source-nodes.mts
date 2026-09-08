import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  anatomySourceNameMatchesHint,
  clearAllAnatomySourceNodes,
  getAnatomySourceNodeSnapshot,
  publishAnatomySourceNodes,
  resolveAnatomySourceNodes,
  subscribeAnatomySourceNodes,
} from '../../src/lib/anatomySourceNodeRegistry.ts'

clearAllAnatomySourceNodes()
let notifications = 0
const unsubscribe = subscribeAnatomySourceNodes(() => { notifications += 1 })

publishAnatomySourceNodes('skeletal.glb', [
  'Femur.r',
  'Hip_Joint',
  'Hippocampus',
  'Femur.r',
  '  ',
])
publishAnatomySourceNodes('cardiovascular.glb', [
  'Common carotid artery.l',
  'Femoral artery.r',
])

const snapshot = getAnatomySourceNodeSnapshot()
assert.equal(snapshot.length, 2)
assert.deepEqual(snapshot.find((bundle) => bundle.file === 'skeletal.glb')?.names, [
  'Femur.r',
  'Hip_Joint',
  'Hippocampus',
])
assert.equal(notifications, 2)

// Re-publishing the same canonical names is intentionally silent.
publishAnatomySourceNodes('skeletal.glb', ['Hippocampus', 'Hip_Joint', 'Femur.r'])
assert.equal(notifications, 2)

assert.equal(anatomySourceNameMatchesHint('Hip_Joint', 'hip'), true)
assert.equal(anatomySourceNameMatchesHint('Hippocampus', 'hip'), false, 'token matching must not confuse hip with hippocampus')
assert.equal(anatomySourceNameMatchesHint('Common carotid artery.l', 'carotid'), true)

const carotid = resolveAnatomySourceNodes(['carotid', 'artery'], snapshot)
assert.equal(carotid.length, 1)
assert.equal(carotid[0].file, 'cardiovascular.glb')
assert.deepEqual(carotid[0].names, ['Common carotid artery.l'])
assert.equal(carotid[0].hint, 'carotid', 'the first specific reviewed hint must win before broad fallbacks')

const hip = resolveAnatomySourceNodes(['hip'], snapshot)
assert.deepEqual(hip.flatMap((entry) => entry.names), ['Hip_Joint'])

unsubscribe()
clearAllAnatomySourceNodes()

const captureSource = readFileSync(new URL('../../src/lib/body3dSourceNodeCapture.ts', import.meta.url), 'utf8')
const qualitySource = readFileSync(new URL('../../src/lib/body3dQuality.ts', import.meta.url), 'utf8')
const workbenchSource = readFileSync(new URL('../../src/pages/bodyhub/ZAnatomyAtlasWorkbench.tsx', import.meta.url), 'utf8')

// Guard the behavior contract instead of the exact spelling of the internal regex.
// The capture hook must derive a file only through the anatomy URL parser and must
// immediately delegate unchanged when the URL is outside that scope.
assert.match(captureSource, /function\s+anatomyFileFromUrl\(url:\s*string\)/, 'capture hook must keep a dedicated anatomy URL parser')
assert.match(captureSource, /url\.match\([^\n]*anatomy[^\n]*\\\.glb/, 'capture parser must require an anatomy path and a GLB filename')
assert.match(captureSource, /const\s+file\s*=\s*anatomyFileFromUrl\(url\)/, 'loader hook must scope through the anatomy URL parser')
assert.match(captureSource, /if\s*\(!file\)\s*return\s+originalLoad\.call\(this,\s*url,\s*onLoad,\s*onProgress,\s*onError\)/, 'non-anatomy URLs must bypass capture unchanged')
assert.match(captureSource, /gltf\.parser\.json\.nodes/, 'registry must read original GLTF JSON node names')
assert.match(captureSource, /publishAnatomySourceNodes\(file, names\)/)
assert.match(qualitySource, /installBody3dSourceNodeCapture\(\)/, 'Body3D generation controller must activate source-node capture')
assert.match(workbenchSource, /useSyncExternalStore/)
assert.match(workbenchSource, /Runtime source-node matches/)
assert.match(workbenchSource, /naming-resolution result—not evidence that the anatomical structure is absent/)
assert.doesNotMatch(workbenchSource, /coverage\s*%/i, 'runtime name matching must not be presented as anatomical coverage')

console.log('Z-Anatomy runtime registry retains exact source names and resolves reviewed hints conservatively.')
