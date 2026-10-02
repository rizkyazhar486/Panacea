import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ocularOpticsSchematic } from '../../src/lib/ocularOpticsSchematic.ts'

const far = ocularOpticsSchematic(4, 6)
const near = ocularOpticsSchematic(4, 0.25)
assert.ok(near.lensRx > far.lensRx, 'Near focus must thicken the lens along the optical axis')
assert.equal(near.accommodationD, 4)
assert.equal(far.accommodationD, 1 / 6)
assert.ok(ocularOpticsSchematic(8, 6).pupilHalf > ocularOpticsSchematic(2, 6).pupilHalf)
for (const value of [NaN, Infinity, -Infinity, -10, 0, 1e9]) {
  const state = ocularOpticsSchematic(value, value)
  assert.ok(Object.values(state).every(Number.isFinite))
  assert.ok(state.pupilHalf >= 8 && state.pupilHalf <= 26)
  assert.ok(state.lensRx >= 17 && state.lensRx <= 22)
}
const source = readFileSync(new URL('../../src/components/digital-twin/Ocular4DAtlas.tsx', import.meta.url), 'utf8')
assert.match(source, /ocularOpticsSchematic\(pupilMm, distanceM\)/)
assert.match(source, /y1="82" x2="365" y2=\{140 - pupilHalf\}/)
assert.match(source, /y1=\{140 \+ pupilHalf\} x2="365" y2="198"/)
assert.match(source, /const activeStructure = visibleStructures.find/)
assert.match(source, /activeStructure \? <HraResolvedAnatomyViewer/)
const specialty = readFileSync(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
assert.match(specialty, /lazy\(\(\) => import\('\.\.\/\.\.\/components\/digital-twin\/Ocular4DAtlas'\)/)
assert.match(specialty, /modul === 'mata'/)
assert.match(specialty, /showEyeOptics &&/)
assert.match(specialty, /<OcularOpticsLesson \/>/)
assert.match(specialty, /aria-expanded=\{showEyeOptics\}/)
console.log('ocular-optics-schematic: accommodation direction, aperture, bounded inputs and empty-group regressions passed')
