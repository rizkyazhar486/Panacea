import assert from 'node:assert/strict'
import fs from 'node:fs'
import { INDEKS_TUBUH, pasangan } from '../../src/lib/bodySearch.ts'
import { buildBodyLabelChallenge, isBodyLabelAnswerCorrect } from '../../src/lib/bodyLabelChallenge.ts'

const target = INDEKS_TUBUH.find((s) => s.l === 'skeletal') ?? INDEKS_TUBUH[0]
assert.ok(target, 'whole-body geometry index must contain at least one structure')

const challenge = buildBodyLabelChallenge(target)
assert.equal(challenge.source, 'whole-body-geometry-index')
assert.equal(challenge.options.length, 4, 'default challenge should expose four bounded choices')
assert.equal(new Set(challenge.options.map((option) => option.key)).size, challenge.options.length, 'choices must be unique')
assert.equal(challenge.options.filter((option) => option.key === challenge.targetKey).length, 1, 'target must appear exactly once')
assert.ok(challenge.options.every((option) => {
  const [layer, ...baseParts] = option.key.split(':')
  const base = baseParts.join(':')
  return INDEKS_TUBUH.some((s) => s.l === layer && s.b === base)
}), 'every answer choice must resolve to an actual whole-body geometry index name')
assert.ok(isBodyLabelAnswerCorrect(challenge, challenge.targetKey))
assert.ok(challenge.options.some((option) => option.key !== challenge.targetKey && !isBodyLabelAnswerCorrect(challenge, option.key)))

const repeat = buildBodyLabelChallenge(target)
assert.deepEqual(repeat.options, challenge.options, 'challenge construction must remain deterministic')
assert.ok(pasangan(target).length >= 1, 'challenge target must map to at least one exact mesh name')

const finder = fs.readFileSync('src/pages/bodyhub/StructureFinder.tsx', 'utf8')
assert.match(finder, /buildBodyLabelChallenge/)
assert.match(finder, /Geometry label challenge/)
assert.match(finder, /Study/)
assert.match(finder, /pasangan\(s\)/)
assert.doesNotMatch(finder, /Math\.random\(/)

console.log('Geometry-grounded Body label challenge guards verified.')
