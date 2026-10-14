import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseTargetValue, TARGET_MIN, TARGET_MAX } from '../../src/domains/training-goals/index.ts'

// Positivo + limites
assert.deepEqual(parseTargetValue('20'), { ok: true, value: 20 })
assert.deepEqual(parseTargetValue('1'), { ok: true, value: 1 })
assert.deepEqual(parseTargetValue('100000'), { ok: true, value: 100000 })
assert.deepEqual(parseTargetValue('12.5'), { ok: true, value: 12.5 }, 'alvo fracionário (km) é válido')
assert.equal(TARGET_MIN, 1); assert.equal(TARGET_MAX, 100000)
// Negativo: cada um recusado com motivo exato e sem `value`
const vazio = { ok: false, problem: 'Enter a target of at least 1' }
for (const t of ['', '   ']) assert.deepEqual(parseTargetValue(t), vazio, JSON.stringify(t))
for (const t of [undefined, null, 5, {}]) assert.deepEqual(parseTargetValue(t), vazio, String(t))
for (const t of ['abc', 'NaN', 'Infinity', '-Infinity', '1e999']) assert.deepEqual(parseTargetValue(t), { ok: false, problem: 'Target must be a number' }, t)
// Pareados nos limites: 0.99/1 e 100000/100000.01
assert.deepEqual(parseTargetValue('0'), { ok: false, problem: 'Target must be 1–100000' })
assert.deepEqual(parseTargetValue('0.99'), { ok: false, problem: 'Target must be 1–100000' })
assert.deepEqual(parseTargetValue('-5'), { ok: false, problem: 'Target must be 1–100000' })
assert.deepEqual(parseTargetValue('100000.01'), { ok: false, problem: 'Target must be 1–100000' })
assert.equal('value' in parseTargetValue(''), false)
assert.deepEqual(parseTargetValue('20'), parseTargetValue('20'), 'determinismo')

// Regressão das duas páginas: nada de `|| 0`, alvo inválido avisa e não é gravado
for (const f of ['fitness/WorkoutHistory', 'AnalisisPro']) {
  const src = readFileSync(new URL(`../../src/pages/${f}.tsx`, import.meta.url), 'utf8')
  assert.equal(/Number\(e\.target\.value\)\s*\|\|\s*0/.test(src), false, `${f}: campo vazio não pode virar alvo 0`)
  assert.ok(src.includes('parseTargetValue(e.target.value)'), `${f}: deve validar via domínio`)
  assert.ok(/if \(v\.ok\) setTarget\(/.test(src), `${f}: só grava o alvo quando válido`)
  assert.ok(src.includes('Showing your last saved target'), `${f}: avisa qual alvo vale`)
}
console.log('training-goals-target: ok')
