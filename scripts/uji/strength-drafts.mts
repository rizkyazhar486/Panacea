import assert from 'node:assert/strict'
import { parseStrengthDraft } from '../../src/domains/personal-health/engine/strengthDraft.ts'
assert.deepEqual(parseStrengthDraft([{ ulangan: '', kg: '' }]), { kind: 'empty', sets: [] })
assert.deepEqual(parseStrengthDraft([{ ulangan: '5', kg: '100' }, { ulangan: '', kg: '' }]), { kind: 'valid', sets: [{ ulangan: 5, kg: 100 }] })
for (const row of [{ ulangan: '', kg: '100' }, { ulangan: '5', kg: '' }, { ulangan: '0', kg: '100' }, { ulangan: '5', kg: '0' }, { ulangan: '2.5', kg: '100' }, { ulangan: '101', kg: '100' }, { ulangan: '5', kg: '1000.1' }, { ulangan: '1e309', kg: '100' }, { ulangan: '5', kg: 'NaN' }]) {
  const result = parseStrengthDraft([{ ulangan: '5', kg: '100' }, row])
  assert.equal(result.kind, 'invalid')
  assert.deepEqual(result.sets, [], 'one incomplete/invalid row suppresses the session estimate')
}
for (const wrong of [null, undefined, 0, NaN, true]) assert.equal(parseStrengthDraft([{ ulangan: wrong, kg: '100' } as any]).kind, 'invalid')
for (let reps = 1; reps <= 100; reps++) for (const kg of [0.01, 0.5, 1, 100, 1000]) {
  const row = { ulangan: String(reps), kg: String(kg) }
  assert.deepEqual(parseStrengthDraft([row]), { kind: 'valid', sets: [{ ulangan: reps, kg }] })
  assert.equal(parseStrengthDraft([{ ...row, ulangan: String(reps + 0.5) }]).kind, 'invalid')
}
console.log('Strength drafts: missing/explicit zero/partial rows, existing bounds and finite property grid PASS')
