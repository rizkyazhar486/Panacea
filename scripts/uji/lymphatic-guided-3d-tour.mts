import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const panel = await readFile(new URL('../../src/pages/bodyhub/LimfePanel.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/pages/bodyhub/Limfe3D.tsx', import.meta.url), 'utf8')
const source = await readFile(new URL('../../src/lib/anatomy/stasiunLimfe.ts', import.meta.url), 'utf8')
const credits = await readFile(new URL('../../public/anatomy/CREDITS.txt', import.meta.url), 'utf8')

assert.match(panel, /Guided 3D tour/, 'lymphatic anatomy must expose a visible guided 3D tour')
assert.match(panel, /Auto tour/, 'the tour must be directly controllable')
assert.match(panel, /Previous lymph node station/, 'the tour must support backward navigation')
assert.match(panel, /Next lymph node station/, 'the tour must support forward navigation')
assert.match(panel, /min-h-11/, 'tour controls must preserve mobile touch targets')
assert.match(panel, /not a simulation of lymph transport/i, 'camera choreography must not be mislabeled as physiological lymph flow')
assert.match(panel, /setInterval/, 'guided mode must visibly progress through source-backed stations')
assert.match(viewer, /data\.limfeTerpilih|dataset\.limfeTerpilih/, '3D viewer must expose the selected source-backed station for browser QA')
assert.match(viewer, /body3dPixelRatio/, '3D viewer must retain bounded mobile pixel ratio behavior')
assert.match(source, /BERKAS_LIMFOID = 'lymphoid\.glb'/, 'tour must remain bound to the shipped lymphoid GLB')
assert.match(source, /POLA_PEMBULUH_ABSEN/, 'missing lymphatic vessels must stay explicit')
assert.match(credits, /lymphoid\.glb/, 'lymphoid geometry must be explicitly covered by source attribution')
assert.match(credits, /Z-Anatomy/, 'source attribution must name Z-Anatomy')
assert.match(credits, /CC BY-SA 4\.0/, 'derived lymphoid geometry must keep the declared share-alike license boundary')
assert.match(credits, /does not add missing lymphatic vessels or ducts/i, 'credits must not imply fabricated vessel geometry')

console.log('lymphatic guided 3D tour acceptance passed')
