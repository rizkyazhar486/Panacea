import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const panel = await readFile(new URL('../../src/pages/bodyhub/WilayahAbdomenPanel.tsx', import.meta.url), 'utf8')
const tour = await readFile(new URL('../../src/pages/bodyhub/HepatobiliaryPancreasTour3D.tsx', import.meta.url), 'utf8')
assert.match(panel, /HepatobiliaryPancreasTour3D/, 'guided tour must be reachable')
assert.match(tour, /part\.module === 'bilier'/, 'tour must use registered biliary metadata')
assert.match(tour, /atlas\/bilier\.glb/, 'tour must use registered biliary geometry')
assert.match(tour, /availableNames\.has\(name\)/, 'tour stops must fail closed to registered names')
assert.match(tour, /not available in this build/, 'missing source structures must fail explicitly')
assert.doesNotMatch(tour, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'tour must not synthesize anatomy primitives')
console.log('hepatobiliary guided tour contract passed')
