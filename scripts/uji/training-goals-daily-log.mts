import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseDailyLog, MINUTES_PER_DAY_MAX, REPS_PER_DAY_MAX } from '../../src/domains/training-goals/index.ts'

// Positivo + limites
assert.deepEqual(parseDailyLog('45', MINUTES_PER_DAY_MAX, 'Minutes'), { ok: true, value: 45 })
assert.deepEqual(parseDailyLog('1440', MINUTES_PER_DAY_MAX, 'Minutes'), { ok: true, value: 1440 })
assert.deepEqual(parseDailyLog('0', REPS_PER_DAY_MAX, 'Reps'), { ok: true, value: 0 })
assert.deepEqual(parseDailyLog('500', REPS_PER_DAY_MAX, 'Reps'), { ok: true, value: 500 })
assert.equal(MINUTES_PER_DAY_MAX, 1440); assert.equal(REPS_PER_DAY_MAX, 500)
// Campo vazio = apagar o registro do dia (0 explícito), não erro
for (const t of ['', '   ']) assert.deepEqual(parseDailyLog(t, 500, 'Reps'), { ok: true, value: 0 }, JSON.stringify(t))
// Negativo: motivo exato e sem `value`
for (const t of ['abc', 'NaN', 'Infinity', '-Infinity', '1e999']) assert.deepEqual(parseDailyLog(t, 500, 'Reps'), { ok: false, problem: 'Reps must be a number' }, t)
for (const t of [undefined, null, 5, {}]) assert.deepEqual(parseDailyLog(t, 500, 'Reps'), { ok: false, problem: 'Reps must be text input' }, String(t))
assert.deepEqual(parseDailyLog('12.5', 500, 'Reps'), { ok: false, problem: 'Reps must be a whole number' })
// Pareados nos limites: 1440/1441 e 0/-1
assert.deepEqual(parseDailyLog('1441', MINUTES_PER_DAY_MAX, 'Minutes'), { ok: false, problem: 'Minutes must be 0–1440' })
assert.deepEqual(parseDailyLog('501', REPS_PER_DAY_MAX, 'Reps'), { ok: false, problem: 'Reps must be 0–500' })
assert.deepEqual(parseDailyLog('-1', REPS_PER_DAY_MAX, 'Reps'), { ok: false, problem: 'Reps must be 0–500' })
assert.equal('value' in parseDailyLog('abc', 500, 'Reps'), false)
assert.deepEqual(parseDailyLog('7', 500, 'Reps'), parseDailyLog('7', 500, 'Reps'), 'determinismo')

// Regressão das páginas: sem `|| 0` no campo, entrada inválida avisa e não grava
for (const f of ['bodyhub/BodyToolkit', 'fitness/MovementToolkit']) {
  const src = readFileSync(new URL(`../../src/pages/${f}.tsx`, import.meta.url), 'utf8')
  assert.equal(/Number\(e\.target\.value\)\s*\|\|\s*0/.test(src), false, `${f}: texto inválido não pode virar 0`)
  assert.ok(src.includes('parseDailyLog(e.target.value'), `${f}: deve validar via domínio`)
  assert.ok(/if \(v\.ok\) \{ set(Minutes|Days)\(/.test(src), `${f}: só grava quando válido`)
  assert.ok(src.includes('Showing your last saved value'), `${f}: avisa qual valor vale`)
}
console.log('training-goals-daily-log: ok')
