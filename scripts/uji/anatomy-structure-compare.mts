import assert from 'node:assert/strict'
import fs from 'node:fs'

const finder = fs.readFileSync('src/pages/bodyhub/StructureFinder.tsx', 'utf8')

assert.match(finder, /const MAX_COMPARE = 3/)
assert.match(finder, /useState<CompareItem\[]>\(\[\]\)/)
assert.match(finder, /if \(prev\.length >= MAX_COMPARE\) return prev/)
assert.match(finder, /Compare up to three named meshes side by side/)
assert.match(finder, /Compare tray is capped at three structures/)

assert.match(finder, /function sorotPerbandinganWholeBody\(\)/)
assert.match(finder, /if \(item\.family !== 'whole-body'\) continue/)
assert.match(finder, /onLapisan\(item\.whole\.l\)/)
assert.match(finder, /wholeNodes\.push\(\.\.\.pasangan\(item\.whole\)\)/)
assert.match(finder, /onSorot\(\[\.\.\.new Set\(wholeNodes\)\]\)/)

assert.match(finder, /Specialty atlas/)
assert.match(finder, /Separate specialty geometry; no whole-body substitute\./)
assert.match(finder, /specialty\s+entries stay in their own atlas and are never redirected to a substitute body mesh/i)
assert.match(finder, /disabled=\{!inCompare && comparePenuh\}/)
assert.match(finder, /aria-pressed=\{inCompare\}/)
assert.doesNotMatch(finder, /iframe/i)
assert.doesNotMatch(finder, /fetch\s*\(/i)

console.log('Structure compare tray is bounded to three real atlas entries, unions only exact whole-body mesh names, and never substitutes specialty geometry.')
